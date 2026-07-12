import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyToken, userIdFromAuth } from '@/lib/mcp/auth'
import { getProjectSupabase } from '@/lib/mcp/project-db'
import { runSql } from '@/lib/supabase-management'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'

// The MCP route itself only does fast DB work (create/list/get/queue) — the
// heavy builds run in /api/cron/mcp-consumer, so a short ceiling is fine.
export const maxDuration = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wyberai.com'

/** Wrap any JSON payload in the MCP text-content envelope. */
function jsonResult(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] }
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'list_projects',
      'List the projects in your WyberAi workspace (most recently updated first).',
      {},
      { title: 'List projects', readOnlyHint: true, openWorldHint: false },
      async (_args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data } = await db
          .from('projects')
          .select('id, name, framework, published_url, deployed_url, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(20)
        return jsonResult({ projects: data ?? [] })
      },
    )

    server.tool(
      'create_project',
      'Create a new WyberAi project. After creating it, call send_message to build the app.',
      {
        name: z.string().describe('Project name'),
        framework: z
          .enum(['next', 'react-vite', 'vue', 'vanilla'])
          .optional()
          .describe('Framework (default: react-vite)'),
        description: z.string().optional().describe('What you want to build'),
      },
      { title: 'Create project', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data, error } = await db
          .from('projects')
          .insert({
            name: args.name,
            framework: args.framework ?? 'react-vite',
            description: args.description,
            user_id: userId,
          })
          .select('id, name, framework')
          .single()
        if (error) return errorResult(`Could not create project: ${error.message}`)
        return jsonResult({
          project: data,
          message: `Project "${args.name}" created. Use send_message with project_id "${data?.id}" to start building.`,
        })
      },
    )

    server.tool(
      'get_project',
      'Get details of a specific project, including how many files it has.',
      { project_id: z.string().describe('Project ID') },
      { title: 'Get project details', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data } = await db
          .from('projects')
          .select('*')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!data) return errorResult('Project not found')
        return jsonResult({
          project: {
            id: data.id,
            name: data.name,
            framework: data.framework,
            published_url: data.published_url,
            file_count: Object.keys(data.files ?? {}).length,
            updated_at: data.updated_at,
          },
        })
      },
    )

    server.tool(
      'send_message',
      'Queue a build/change for a project. Returns a message_id immediately; the build runs asynchronously — poll get_message_status until it is "done".',
      {
        project_id: z.string().describe('Project ID'),
        message: z.string().describe('What to build or change'),
      },
      // destructiveHint: a build can rewrite the project's existing files. Each
      // queued build also consumes WyberAi credits from the connected account.
      { title: 'Build or edit the app', readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()

        // Verify ownership before queueing so a bad project_id fails fast.
        const { data: project } = await db
          .from('projects')
          .select('id')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!project) return errorResult('Project not found')

        const { data, error } = await db
          .from('mcp_messages')
          .insert({
            project_id: args.project_id,
            user_id: userId,
            message: args.message,
            status: 'queued',
          })
          .select('id')
          .single()
        if (error) return errorResult(`Could not queue message: ${error.message}`)

        return jsonResult({
          message_id: data?.id,
          status: 'queued',
          note: 'Build queued. Poll get_message_status with this message_id until status is "done" (usually under 2 minutes), then get_project to see the result.',
        })
      },
    )

    server.tool(
      'get_message_status',
      'Check the status of a queued build (from send_message): queued | processing | done | error.',
      { message_id: z.string().describe('The message_id returned by send_message') },
      { title: 'Check build status', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data } = await db
          .from('mcp_messages')
          .select('id, status, response, error, created_at, processed_at')
          .eq('id', args.message_id)
          .eq('user_id', userId)
          .single()
        if (!data) return errorResult('Message not found')
        return jsonResult({
          message_id: data.id,
          status: data.status,
          response: data.response,
          error: data.error,
        })
      },
    )

    server.tool(
      'publish_project',
      'Publish a project to a live URL (projectname on wyberai.com/app).',
      { project_id: z.string().describe('Project ID') },
      // destructiveHint: republishing replaces the currently live version.
      // openWorldHint: the result is a publicly reachable URL.
      { title: 'Publish to a live URL', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const res = await fetch(`${APP_URL}/api/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Scheduler-User-Id': userId,
            'X-Scheduler-Secret': process.env.CRON_SECRET!,
          },
          body: JSON.stringify({ projectId: args.project_id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return errorResult(data.error || `Publish failed (${res.status})`)
        return jsonResult(data)
      },
    )

    server.tool(
      'list_files',
      'List the file paths in a project (the app source tree).',
      { project_id: z.string().describe('Project ID') },
      { title: 'List project files', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data } = await db
          .from('projects')
          .select('files')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!data) return errorResult('Project not found')
        const paths = Object.keys((data.files as Record<string, unknown>) ?? {}).sort()
        return jsonResult({ file_count: paths.length, files: paths })
      },
    )

    server.tool(
      'read_file',
      'Read the source of one file in a project. Use list_files first to see available paths.',
      {
        project_id: z.string().describe('Project ID'),
        path: z.string().describe('File path, e.g. src/App.tsx'),
      },
      { title: 'Read a project file', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data } = await db
          .from('projects')
          .select('files')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!data) return errorResult('Project not found')
        const files = (data.files as Record<string, { content?: string }>) ?? {}
        const file = files[args.path]
        if (!file) return errorResult(`File not found: ${args.path}. Call list_files to see available paths.`)
        return jsonResult({ path: args.path, content: file.content ?? '' })
      },
    )

    server.tool(
      'execute_sql',
      "Run SQL against the project's connected Supabase database (the user must have connected Supabase in the editor first). Handles reads, writes, and schema changes.",
      {
        project_id: z.string().describe('Project ID'),
        query: z.string().describe('SQL to execute'),
      },
      // destructiveHint: SQL can drop/alter/delete. openWorldHint: hits an
      // external database the connector does not control.
      { title: 'Run SQL on the project database', readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data: project } = await db
          .from('projects')
          .select('id')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!project) return errorResult('Project not found')

        const conn = await getProjectSupabase(userId, args.project_id)
        if (!conn) return errorResult('No Supabase connected for this project. Connect it in the WyberAi editor (Connect Supabase) first.')
        try {
          const rows = await runSql(conn.token, conn.ref, args.query)
          return jsonResult({ rows })
        } catch (e) {
          return errorResult(`SQL failed: ${String(e).slice(0, 400)}`)
        }
      },
    )

    server.tool(
      'get_project_knowledge',
      'Get the persistent knowledge for a project — standards, brand, and patterns the builder follows on every run.',
      { project_id: z.string().describe('Project ID') },
      { title: 'Get project knowledge', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data } = await db
          .from('projects')
          .select('knowledge')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!data) return errorResult('Project not found')
        return jsonResult({ knowledge: data.knowledge ?? '' })
      },
    )

    server.tool(
      'set_project_knowledge',
      'Set persistent knowledge for a project (brand, coding standards, API patterns). The builder applies it on every future build. Replaces any existing knowledge.',
      {
        project_id: z.string().describe('Project ID'),
        knowledge: z.string().describe('The knowledge text (plain language). Pass an empty string to clear it.'),
      },
      { title: 'Set project knowledge', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { error } = await db
          .from('projects')
          .update({ knowledge: args.knowledge.slice(0, 8000) })
          .eq('id', args.project_id)
          .eq('user_id', userId)
        if (error) return errorResult(`Could not save knowledge: ${error.message}`)
        return jsonResult({ ok: true, message: 'Project knowledge updated.' })
      },
    )
  },
  { serverInfo: { name: 'wyber-ai', version: '2.1.0' } },
  {
    // The handler matches the request path against this endpoint. Our route
    // lives at /api/mcp, so the full path must be configured here (basePath
    // '/api' derives streamableHttpEndpoint '/api/mcp').
    basePath: '/api',
    // SSE is dropped from the MCP spec (2025-03-26); we only serve the stateless
    // Streamable HTTP transport, so no Redis is needed.
    disableSse: true,
    maxDuration: 60,
  },
)

const authed = withMcpAuth(handler, verifyToken, { required: true })

export { authed as GET, authed as POST, authed as DELETE }
