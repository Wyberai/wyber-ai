import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyToken, userIdFromAuth } from '@/lib/mcp/auth'
import { getProjectSupabase } from '@/lib/mcp/project-db'
import { runSql } from '@/lib/supabase-management'
import { runProjectRlsScan } from '@/lib/rls-scan-project'
import { creditCost, resolveBuildTier, type ActionType, type ModelTier, type BuildSizeTier } from '@/lib/credits'
import { PLAN_FACTS } from '@/lib/plans'
import { currencyForCountry } from '@/lib/currency'
import { Composio } from '@composio/core'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { sendAdminMcpProjectAlert } from '@/lib/email'
import { internalSecret, signParams } from '@/lib/internal-auth'

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

/** Get user's currency: from profile.country if set, then USD default */
async function getUserCurrency(userId: string): Promise<'USD' | 'INR'> {
  try {
    const db = createServiceClient()
    const { data: profile } = await db
      .from('profiles')
      .select('country')
      .eq('id', userId)
      .single()

    // If profile has country set, use it
    if (profile?.country) {
      return currencyForCountry(profile.country)
    }
  } catch {
    /* fall through to default */
  }
  return 'USD' // Safe default
}

/** Build upsell message for insufficient credits */
function insufficientCreditsMessage(needed: number, have: number, currency: 'USD' | 'INR' = 'USD'): string {
  const shortage = needed - have
  const starterCredits = 150
  const builderCredits = 500

  if (currency === 'INR') {
    return `You need ${needed} credits but have only ${have} (${shortage} short).

**Upgrade to get more credits:**
• **Spark** (₹499/mo): 50cr/mo — limited to small builds
• **Starter** (₹1,499/mo): 150cr/mo — ~5 builds/month
• **Builder** (₹3,999/mo): 500cr/mo — ~16 builds/month ← Recommended

**Save 20% with annual billing!**
Starter: ₹1,199/mo annual | Builder: ₹3,199/mo annual

Upgrade now: https://wyberai.com/pricing

Or top-up credits: https://wyberai.com/credits`
  }

  return `You need ${needed} credits but have only ${have} (${shortage} short).

**Upgrade to get more credits:**
• **Starter** ($29/mo): 150cr/mo — ~5 builds/month
• **Builder** ($79/mo): 500cr/mo — ~16 builds/month ← Recommended

**Save 20% with annual billing!**
Starter: $23/mo annual | Builder: $63/mo annual

Upgrade now: https://wyberai.com/pricing

Or top-up credits: https://wyberai.com/credits`
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
        const { data, error } = await db
          .from('projects')
          .select('id, name, framework, published_url, deployed_url, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(20)
        if (error) return errorResult(`Could not list projects: ${error.message}`)
        return jsonResult({ projects: data ?? [] })
      },
    )

    server.tool(
      'create_project',
      'Create a new WyberAi project. Returns a project id that start_build uses to build the app.',
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
            created_via: 'mcp',
          })
          .select('id, name, framework')
          .single()
        if (error) return errorResult(`Could not create project: ${error.message}`)

        // Fire-and-forget admin alert — someone building via the Claude
        // connector is a stronger signal than a web signup; don't block the
        // tool response on email delivery.
        db.from('profiles').select('email').eq('id', userId).single().then(({ data: profile }) => {
          if (profile?.email) sendAdminMcpProjectAlert(profile.email, args.name, args.framework ?? 'react-vite').catch(() => {})
        })

        return jsonResult({
          project: data,
          message: `Project "${args.name}" created. Use start_build with project_id "${data?.id}" to start building.`,
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
        const { data, error } = await db
          .from('projects')
          .select('*')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (error || !data) return errorResult(error && error.code !== 'PGRST116' ? `Could not get project: ${error.message}` : 'Project not found')
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

    // ─────────────────────────────────────────────────────────────────
    // PROJECT TYPE SELECTION
    // ─────────────────────────────────────────────────────────────────

    server.tool(
      'select_project_type',
      'Get available project types. User must select one before building.',
      {},
      { title: 'Choose project type', readOnlyHint: true, openWorldHint: false },
      async (_args, extra) => {
        return jsonResult({
          types: [
            {
              id: 'web-app',
              label: 'Web App',
              description: 'React/Vue interactive dashboard, SPA, or internal tool',
              baseFileCount: 8,
            },
            {
              id: 'mobile',
              label: 'Mobile App',
              description: 'iOS/Android app built with React Native via Expo',
              baseFileCount: 10,
              note: 'Preview in-house free. APK/IPA export is temporarily unavailable.',
            },
            {
              id: 'website',
              label: 'Website',
              description: 'Marketing site, landing page, or blog',
              baseFileCount: 6,
            },
            {
              id: 'saas',
              label: 'SaaS',
              description: 'Full application with auth, database, and backend',
              baseFileCount: 15,
            },
          ],
          message: 'Pick the type that best describes what you want to build.',
        })
      },
    )

    server.tool(
      'get_palette_options',
      'Get 3 design palette options for the build. User picks one or "Surprise me".',
      {
        prompt: z.string().describe('User description/prompt for the build'),
        project_type: z.enum(['web-app', 'mobile', 'website', 'saas']).describe('Type of project'),
      },
      { title: 'Show design palettes', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        try {
          // Import pickPaletteOptions from lib/design-palettes at runtime
          const { pickPaletteOptions } = await import('@/lib/design-palettes')
          const palettes = pickPaletteOptions(args.prompt, 3)

          return jsonResult({
            palettes: palettes.map(p => ({
              id: p.id,
              label: p.label,
              vibe: p.vibe,
              mode: p.mode,
            })),
            message: 'Pick a design direction or click "Surprise me" for a random palette.',
          })
        } catch (err) {
          // Fallback if pickPaletteOptions unavailable
          return jsonResult({
            palettes: [
              { id: 'palette-1', label: 'Modern Blue', vibe: 'Professional', mode: 'Dark' },
              { id: 'palette-2', label: 'Warm Sunset', vibe: 'Friendly', mode: 'Light' },
              { id: 'palette-3', label: 'Mint Fresh', vibe: 'Minimalist', mode: 'Light' },
            ],
            message: 'Pick a design direction.',
          })
        }
      },
    )

    server.tool(
      'get_build_cost',
      'Get the exact cost to build a project. Shows cost + handles insufficient credits with upsell.',
      {
        project_id: z.string().describe('Project ID'),
        project_type: z.enum(['web-app', 'mobile', 'website', 'saas']).describe('Type of project'),
        estimated_files: z.number().optional().describe('Estimated number of files (optional)'),
      },
      { title: 'Check build cost', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()

        const { data: profile } = await db
          .from('profiles')
          .select('credits, plan, country')
          .eq('id', userId)
          .single()
        if (!profile) return errorResult('Account not found')

        const { data: project } = await db
          .from('projects')
          .select('files')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()

        // Determine model tier and currency
        const planRank: Record<string, number> = { free: 0, spark: 0, starter: 1, builder: 2, pro: 3, growth: 4, scale: 5 }
        const userPlanRank = planRank[profile.plan as string] ?? 0
        const modelTier: ModelTier = userPlanRank >= 1 ? 'default' : 'fast'
        const currency = await getUserCurrency(userId)

        // Calculate cost — must mirror /api/generate's real pricing decision
        // (src/app/api/generate/route.ts ~line 2455): any build on a project
        // that already has files is priced as a flat 'small-edit', regardless
        // of project type or file-count estimate. Quoting full build pricing
        // for what will actually be charged as a 2-5cr edit misleads the
        // affordability check (can wrongly refuse, or wrongly reassure).
        const availableCredits = profile.credits ?? 0
        const isFirstBuild = !project?.files || Object.keys((project?.files as Record<string, unknown>) ?? {}).length === 0

        const actionTypeMap: Record<string, ActionType> = {
          'web-app': 'web-build',
          'mobile': 'mobile-build',
          'website': 'website-build',
          'saas': 'saas-build',
        }
        let buildTier: BuildSizeTier | undefined
        let actionType: ActionType
        if (isFirstBuild) {
          const estimatedFiles = args.estimated_files ?? 15
          buildTier = resolveBuildTier({ totalPlannedFiles: estimatedFiles })
          actionType = actionTypeMap[args.project_type]
        } else {
          actionType = 'small-edit'
        }
        const estimatedCost = creditCost(actionType, modelTier, buildTier)

        if (availableCredits < estimatedCost) {
          return jsonResult({
            estimated_cost: estimatedCost,
            available_credits: availableCredits,
            can_afford: false,
            shortage: estimatedCost - availableCredits,
            is_first_build: isFirstBuild,
            error: insufficientCreditsMessage(estimatedCost, availableCredits, currency),
          })
        }

        return jsonResult({
          estimated_cost: estimatedCost,
          available_credits: availableCredits,
          can_afford: true,
          remaining_after: availableCredits - estimatedCost,
          project_type: args.project_type,
          is_first_build: isFirstBuild,
          build_tier: buildTier,
          model_tier: modelTier,
          plan: profile.plan,
          message: isFirstBuild
            ? `Building ${args.project_type} will cost ~${estimatedCost} credits.\nYou'll have ${availableCredits - estimatedCost} credits left.\n\nReady to proceed?`
            : `This project already has files, so this is priced as an edit: ${estimatedCost} credits flat.\nYou'll have ${availableCredits - estimatedCost} credits left.\n\nReady to proceed?`,
        })
      },
    )

    server.tool(
      'start_build',
      'Queue a build with type and palette selected. 8-10 minute build time. Returns message_id and live progress URL.',
      {
        project_id: z.string().describe('Project ID'),
        message: z.string().describe('What to build (user description)'),
        project_type: z.enum(['web-app', 'mobile', 'website', 'saas']).describe('Type of project'),
        palette_id: z.string().optional().describe('Selected palette ID'),
        estimated_files: z.number().optional().describe('Estimated file count'),
      },
      { title: 'Start building', readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()

        const { data: project } = await db
          .from('projects')
          .select('id, files, name')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!project) return errorResult('Project not found')

        const { data: profile } = await db
          .from('profiles')
          .select('credits, plan')
          .eq('id', userId)
          .single()
        if (!profile) return errorResult('Account not found')

        const availableCredits = profile.credits ?? 0
        const isFirstBuild = !project.files || Object.keys(project.files as Record<string, unknown>).length === 0

        const planRank: Record<string, number> = { free: 0, spark: 0, starter: 1, builder: 2, pro: 3, growth: 4, scale: 5 }
        const userPlanRank = planRank[profile.plan as string] ?? 0
        const modelTier: ModelTier = userPlanRank >= 1 ? 'default' : 'fast'

        // Must mirror /api/generate's real pricing decision — any build on a
        // project that already has files is charged as a flat 'small-edit'
        // (2-5cr) regardless of project type, not full build pricing. See the
        // matching comment in get_build_cost above.
        const actionTypeMap: Record<string, ActionType> = {
          'web-app': 'web-build',
          'mobile': 'mobile-build',
          'website': 'website-build',
          'saas': 'saas-build',
        }
        let buildTier: BuildSizeTier | undefined
        let actionType: ActionType
        let estimatedFiles: number | undefined
        if (isFirstBuild) {
          estimatedFiles = args.estimated_files ?? 15
          buildTier = resolveBuildTier({ totalPlannedFiles: estimatedFiles })
          actionType = actionTypeMap[args.project_type]
        } else {
          actionType = 'small-edit'
        }
        const estimatedCost = creditCost(actionType, modelTier, buildTier)

        if (availableCredits < estimatedCost) {
          const currency = await getUserCurrency(userId)
          return errorResult(insufficientCreditsMessage(estimatedCost, availableCredits, currency))
        }

        const { data, error } = await db
          .from('mcp_messages')
          .insert({
            project_id: args.project_id,
            user_id: userId,
            message: args.message,
            project_type: args.project_type,
            palette_id: args.palette_id ?? null,
            status: 'queued',
          })
          .select('id')
          .single()
        if (error) return errorResult(`Could not queue message: ${error.message}`)

        const statusUrl = `${APP_URL}/mcp/build/${data?.id}`

        return jsonResult({
          message_id: data?.id,
          status: 'queued',
          // Nothing is charged yet — /api/generate deducts (and can refund)
          // the actual cost once the build runs. This is only an estimate.
          estimated_cost: estimatedCost,
          estimated_credits_remaining: availableCredits - estimatedCost,
          estimated_files: estimatedFiles,
          build_tier: buildTier,
          model_tier: modelTier,
          status_url: statusUrl,
          message: `🏗️ Building your ${args.project_type}...\n⏱️ Estimated time: 8-10 minutes\n\n📊 Live Progress: ${statusUrl}\n\nI'll let you know when it's done!`,
        })
      },
    )

    server.tool(
      'get_message_status',
      'Check the status of a queued build (from start_build): queued | processing | done | error. Returns live URL when complete.',
      { message_id: z.string().describe('The message_id returned by start_build') },
      { title: 'Check build status', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data } = await db
          .from('mcp_messages')
          .select('id, status, response, error, published_url, created_at, processed_at')
          .eq('id', args.message_id)
          .eq('user_id', userId)
          .single()
        if (!data) return errorResult('Message not found')

        // Calculate elapsed time for progress display
        const createdAt = new Date(data.created_at).getTime()
        const now = new Date().getTime()
        const elapsedMin = Math.floor((now - createdAt) / 60000)
        const elapsedSec = Math.floor(((now - createdAt) % 60000) / 1000)

        let emoji = '⏳'
        let progressMsg = ''
        if (data.status === 'queued') {
          progressMsg = `⏳ Queued for ${elapsedMin}m ${elapsedSec}s. Builds typically take 8-10 minutes total.`
        } else if (data.status === 'processing') {
          emoji = '🔨'
          progressMsg = `🔨 Building for ${elapsedMin}m ${elapsedSec}s. This is normal — generation takes time.`
        } else if (data.status === 'done') {
          emoji = '✅'
        } else if (data.status === 'error') {
          emoji = '❌'
        }

        // If there's a credit-limit error, inject an interactive checkout modal
        let checkoutUrl: string | null = null
        if (data.status === 'error' && data.error?.includes('Not enough credits')) {
          const costMatch = data.error.match(/costs? (\d+)/)
          const balanceMatch = data.error.match(/have (\d+)/)
          const cost = costMatch ? parseInt(costMatch[1], 10) : 100
          const balance = balanceMatch ? parseInt(balanceMatch[1], 10) : 0
          // Signed so this URL can't be forged to read another user's
          // plan/balance by guessing a UUID — see internal-auth.ts.
          const checkoutParams = { user_id: userId, cost: String(cost), balance: String(balance) }
          const sig = signParams(checkoutParams)
          checkoutUrl = `${APP_URL}/api/mcp/resources/checkout?user_id=${userId}&cost=${cost}&balance=${balance}&sig=${sig}`
        }

        const response = {
          message_id: data.id,
          status: data.status,
          elapsed_time: `${elapsedMin}m ${elapsedSec}s`,
          response: data.response,
          error: data.error,
          published_url: data.published_url,
          progress: progressMsg || (data.status === 'done'
            ? `${emoji} Build complete! ${data.published_url ? `Live: ${data.published_url}` : 'Project updated.'}`
            : `${emoji} ${data.status}`),
          ...(checkoutUrl && { checkout_url: checkoutUrl }),
        }

        return jsonResult(response)
      },
    )

    server.tool(
      'publish_to_web',
      'Publish project to live URL. Includes RLS security check. Shows share options after.',
      { project_id: z.string().describe('Project ID') },
      { title: 'Publish to web', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const res = await fetch(`${APP_URL}/api/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Scheduler-User-Id': userId,
            'X-Scheduler-Secret': internalSecret(),
          },
          body: JSON.stringify({ projectId: args.project_id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return errorResult(data.error || `Publish failed (${res.status})`)

        const url = (data as { publishedUrl?: string }).publishedUrl
        return jsonResult({
          success: true,
          url,
          message: `✅ Live! ${url}\n\n**Share your app:**\n- X/Twitter\n- LinkedIn\n\n**Next:**\n- Buy custom domain ($9–15/year)\n- Enable Supabase for real database`,
        })
      },
    )

    server.tool(
      'search_domains',
      'Search domain availability and price. Upsells premium domains.',
      {
        domain_name: z.string().describe('Domain to search (e.g., "myapp.com")'),
      },
      { title: 'Search domains', readOnlyHint: true, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        try {
          const res = await fetch(`${APP_URL}/api/domain/search?name=${encodeURIComponent(args.domain_name)}`, {
            headers: {
              'X-Scheduler-User-Id': userId,
              'X-Scheduler-Secret': internalSecret(),
            },
          })
          const data = await res.json()
          if (!res.ok) return errorResult(data.error || 'Domain search failed')

          const priceCents = data.priceCents as number | null
          return jsonResult({
            domain: args.domain_name,
            available: data.available,
            price_usd: priceCents ? priceCents / 100 : null,
            message: data.available
              ? `✅ ${args.domain_name} is available!\n\nPrice: $${priceCents ? (priceCents / 100).toFixed(2) : '9-15'}/year\n\nReady to buy? I'll collect your contact info.`
              : `❌ ${args.domain_name} is taken.\n\nTry another or use your free subdomain.`,
          })
        } catch (err) {
          return errorResult(`Could not search domains: ${String(err).slice(0, 100)}`)
        }
      },
    )

    server.tool(
      'buy_domain',
      'Purchase a domain. Requires contact information. Costs $9–15/year.',
      {
        domain_name: z.string().describe('Domain name to buy'),
        project_id: z.string().describe('Project ID to attach domain to'),
        first_name: z.string().describe('First name'),
        last_name: z.string().describe('Last name'),
        email: z.string().describe('Email'),
        phone: z.string().describe('Phone number'),
        address: z.string().describe('Street address'),
        city: z.string().describe('City'),
        state: z.string().describe('State/province'),
        zip: z.string().describe('Postal code'),
        country: z.string().describe('Country'),
      },
      { title: 'Buy domain', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        const schedulerHeaders = {
          'Content-Type': 'application/json',
          'X-Scheduler-User-Id': userId,
          'X-Scheduler-Secret': internalSecret(),
        }

        try {
          // The purchase endpoint needs the real Vercel-quoted price on the
          // request — look it up fresh rather than trust a stale value.
          const priceRes = await fetch(`${APP_URL}/api/domain/search?name=${encodeURIComponent(args.domain_name)}`, { headers: schedulerHeaders })
          const priceData = await priceRes.json()
          if (!priceRes.ok) return errorResult(priceData.error || 'Could not price this domain')
          if (!priceData.available || !priceData.priceCents) return errorResult(`${args.domain_name} is no longer available.`)

          const res = await fetch(`${APP_URL}/api/domain/purchase`, {
            method: 'POST',
            headers: schedulerHeaders,
            body: JSON.stringify({
              projectId: args.project_id,
              domain: args.domain_name,
              priceCents: priceData.priceCents,
              contactInfo: {
                firstName: args.first_name,
                lastName: args.last_name,
                email: args.email,
                phone: args.phone,
                address1: args.address,
                city: args.city,
                state: args.state,
                zip: args.zip,
                country: args.country,
              },
            }),
          })
          const data = await res.json()

          if (!res.ok) return errorResult(data.error || 'Purchase failed')
          if (!data.url) return errorResult('Checkout could not be created')

          return jsonResult({
            success: true,
            domain: args.domain_name,
            checkout_url: data.url,
            price_usd: priceData.priceCents / 100,
            message: `Almost there — complete payment to register ${args.domain_name} ($${(priceData.priceCents / 100).toFixed(2)}/year):\n\n${data.url}\n\nThe domain registers automatically once payment confirms.`,
          })
        } catch (err) {
          return errorResult(`Could not purchase domain: ${String(err).slice(0, 100)}`)
        }
      },
    )

    server.tool(
      'export_mobile_build',
      'Export APK or IPA for mobile app. Currently unavailable — always returns an error, no credits charged.',
      {
        project_id: z.string().describe('Project ID'),
        format: z.enum(['apk', 'ipa']).describe('Export format'),
      },
      { title: 'Export mobile build', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        // /api/mobile/build-apk|ipa authenticates to Expo's EAS API with the
        // user's GitHub OAuth token, which isn't a valid Expo credential — every
        // EAS call 401s server-side and no EXPO_TOKEN is configured anywhere.
        // Refuse here instead of deducting 50cr for a build that can only fail.
        return errorResult(
          `${args.format.toUpperCase()} export isn't available yet — the mobile build pipeline needs to be reconnected to a real build backend. No credits were charged. Use export_code to download the project and build it yourself in the meantime.`
        )
      },
    )

    server.tool(
      'save_snapshot',
      'Save current project state as a version. Free.',
      {
        project_id: z.string().describe('Project ID'),
        label: z.string().describe('Version label (e.g., "Before Supabase migration")'),
      },
      { title: 'Save version', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()

        const { data: project } = await db
          .from('projects')
          .select('id, files')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!project) return errorResult('Project not found')

        try {
          const res = await fetch(`${APP_URL}/api/snapshots`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Scheduler-User-Id': userId,
              'X-Scheduler-Secret': internalSecret(),
            },
            body: JSON.stringify({
              project_id: args.project_id,
              label: args.label,
              files: project.files,
            }),
          })
          const data = await res.json()
          if (!res.ok) return errorResult(data.error || 'Snapshot save failed')

          return jsonResult({
            success: true,
            snapshot_id: data.snapshot?.id,
            label: args.label,
            message: `✅ Snapshot saved: "${args.label}"\n\nYou can restore this anytime.`,
          })
        } catch (err) {
          return errorResult(`Could not save snapshot: ${String(err).slice(0, 100)}`)
        }
      },
    )

    server.tool(
      'list_snapshots',
      'List all saved versions of a project.',
      { project_id: z.string().describe('Project ID') },
      { title: 'List versions', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        try {
          const res = await fetch(`${APP_URL}/api/snapshots?project_id=${args.project_id}`, {
            headers: {
              'X-Scheduler-User-Id': userId,
              'X-Scheduler-Secret': internalSecret(),
            },
          })
          const data = await res.json()

          return jsonResult({
            snapshots: data.snapshots || [],
            message: data.snapshots && data.snapshots.length > 0
              ? `Found ${data.snapshots.length} snapshot(s). Pick one to restore.`
              : 'No snapshots yet. Save one before making big changes!',
          })
        } catch (err) {
          return errorResult(`Could not list snapshots: ${String(err).slice(0, 100)}`)
        }
      },
    )

    server.tool(
      'restore_snapshot',
      'Rollback to a saved version. Overwrites current files.',
      {
        project_id: z.string().describe('Project ID'),
        snapshot_id: z.string().describe('Snapshot ID to restore'),
      },
      { title: 'Restore version', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()

        // Verify project ownership
        const { data: project } = await db
          .from('projects')
          .select('id')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!project) return errorResult('Project not found')

        try {
          const res = await fetch(`${APP_URL}/api/snapshots/${args.snapshot_id}?project_id=${args.project_id}`, {
            headers: {
              'X-Scheduler-User-Id': userId,
              'X-Scheduler-Secret': internalSecret(),
            },
          })
          const data = await res.json()
          if (!res.ok) return errorResult(data.error || 'Restore failed')
          if (!data.snapshot?.files) return errorResult('Snapshot has no files to restore')

          const { error: updateError } = await db
            .from('projects')
            .update({ files: data.snapshot.files, updated_at: new Date().toISOString() })
            .eq('id', args.project_id)
            .eq('user_id', userId)
          if (updateError) return errorResult(`Restore failed: ${updateError.message}`)

          const count = Object.keys((data.snapshot.files as Record<string, unknown>) ?? {}).length
          return jsonResult({
            success: true,
            restored_files: count,
            message: `✅ Project restored to "${data.snapshot?.label}" (${count} files).\n\nYour files have been rolled back.`,
          })
        } catch (err) {
          return errorResult(`Could not restore snapshot: ${String(err).slice(0, 100)}`)
        }
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
        const { data, error } = await db
          .from('projects')
          .select('files')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (error || !data) return errorResult(error && error.code !== 'PGRST116' ? `Could not list files: ${error.message}` : 'Project not found')
        const paths = Object.keys((data.files as Record<string, unknown>) ?? {}).sort()
        return jsonResult({ file_count: paths.length, files: paths })
      },
    )

    server.tool(
      'read_file',
      'Read the source of one file from the project\'s own generated codebase (stored in WyberAi, not an external API). Use list_files first to see available paths.',
      {
        project_id: z.string().describe('Project ID'),
        path: z.string().describe('File path, e.g. src/App.tsx'),
      },
      { title: 'Read a project file', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data, error } = await db
          .from('projects')
          .select('files')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (error || !data) return errorResult(error && error.code !== 'PGRST116' ? `Could not read file: ${error.message}` : 'Project not found')
        const files = (data.files as Record<string, { content?: string }>) ?? {}
        const file = files[args.path]
        if (!file) return errorResult(`File not found: ${args.path}. Call list_files to see available paths.`)
        return jsonResult({ path: args.path, content: file.content ?? '' })
      },
    )

    server.tool(
      'execute_sql',
      "Run a SQL statement against the project's own connected Supabase Postgres database (Supabase must be connected to the project first). Accepts freeform SQL — reads, writes, and schema changes. Target: the user's Supabase project, https://supabase.com/docs.",
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
        if (!conn) {
          // getProjectSupabase needs BOTH a data-plane connection (service=
          // 'supabase') AND the OAuth management-API connection (service=
          // 'supabase-oauth') — a project connected only via connect_supabase
          // or the editor's manual-paste flow has real data access (codegen
          // works) but no management token, so "no Supabase connected" would
          // be false and misleading here. Distinguish the two.
          const { data: rows } = await db
            .from('project_connectors')
            .select('service')
            .eq('project_id', args.project_id)
            .eq('user_id', userId)
            .in('service', ['supabase', 'supabase-oauth'])
          const hasDataPlane = rows?.some(r => r.service === 'supabase')
          return errorResult(
            hasDataPlane
              ? 'Supabase is connected for this project\'s own data access, but execute_sql needs the Management API connection. Reconnect via "Connect with Supabase" (OAuth) in the WyberAi editor — connect_supabase and manual URL+key connections don\'t enable this.'
              : 'No Supabase connected for this project. Connect it in the WyberAi editor (Connect Supabase) first.'
          )
        }
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
        const { data, error } = await db
          .from('projects')
          .select('knowledge')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (error || !data) return errorResult(error && error.code !== 'PGRST116' ? `Could not get knowledge: ${error.message}` : 'Project not found')
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
        const truncated = args.knowledge.length > 8000
        const { error } = await db
          .from('projects')
          .update({ knowledge: args.knowledge.slice(0, 8000) })
          .eq('id', args.project_id)
          .eq('user_id', userId)
        if (error) return errorResult(`Could not save knowledge: ${error.message}`)
        return jsonResult({
          ok: true,
          truncated,
          message: truncated
            ? `Project knowledge updated. Note: your text was ${args.knowledge.length} characters — only the first 8000 were saved.`
            : 'Project knowledge updated.',
        })
      },
    )

    server.tool(
      'get_account',
      'Get the connected WyberAi account: remaining credits and plan. Builds spend credits from this balance.',
      {},
      { title: 'Get account & credits', readOnlyHint: true, openWorldHint: false },
      async (_args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data, error } = await db.from('profiles').select('email, credits, plan').eq('id', userId).single()
        if (error || !data) return errorResult(error && error.code !== 'PGRST116' ? `Could not get account: ${error.message}` : 'Account not found')
        return jsonResult({ email: data.email, credits: data.credits, plan: data.plan })
      },
    )

    server.tool(
      'rename_project',
      'Rename a project.',
      {
        project_id: z.string().describe('Project ID'),
        name: z.string().describe('New project name'),
      },
      { title: 'Rename project', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { error } = await db.from('projects').update({ name: args.name.slice(0, 120) }).eq('id', args.project_id).eq('user_id', userId)
        if (error) return errorResult(error.message)
        return jsonResult({ ok: true, name: args.name })
      },
    )

    server.tool(
      'duplicate_project',
      'Duplicate a project (copies its files into a new project). Returns the new project id.',
      { project_id: z.string().describe('Project ID to copy') },
      { title: 'Duplicate project', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data: original } = await db.from('projects').select('name, description, framework, files').eq('id', args.project_id).eq('user_id', userId).single()
        if (!original) return errorResult('Project not found')
        const { data: fork, error } = await db.from('projects').insert({
          user_id: userId,
          name: `${original.name} (copy)`,
          description: original.description,
          framework: original.framework,
          files: original.files,
          is_public: false,
        }).select('id, name').single()
        if (error) return errorResult(error.message)
        return jsonResult({ project: fork })
      },
    )

    server.tool(
      'delete_project',
      'Permanently delete a project and all its data. This cannot be undone.',
      { project_id: z.string().describe('Project ID to delete') },
      { title: 'Delete project', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data: proj } = await db.from('projects').select('id').eq('id', args.project_id).eq('user_id', userId).single()
        if (!proj) return errorResult('Project not found')
        const { error } = await db.from('projects').delete().eq('id', args.project_id).eq('user_id', userId)
        if (error) return errorResult(error.message)
        return jsonResult({ ok: true, deleted: args.project_id })
      },
    )

    server.tool(
      'get_database_status',
      "Check whether a project has a Supabase database connected (needed for execute_sql and security scans).",
      { project_id: z.string().describe('Project ID') },
      { title: 'Get database status', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data: rows } = await db
          .from('project_connectors')
          .select('service, config')
          .eq('project_id', args.project_id)
          .eq('user_id', userId)
          .in('service', ['supabase', 'supabase-oauth'])
        const dataPlane = rows?.find(r => r.service === 'supabase')
        const mgmt = rows?.find(r => r.service === 'supabase-oauth')
        return jsonResult({
          connected: !!dataPlane,
          ref: (dataPlane?.config as { ref?: string })?.ref ?? null,
          management_api_connected: !!mgmt, // required for execute_sql + security scans
          hint: !dataPlane
            ? 'Connect Supabase in the WyberAi editor (Connect Supabase) to enable SQL and security scans.'
            : !mgmt
              ? 'Connected for data access, but execute_sql/run_security_scan need the OAuth management connection too — use "Connect with Supabase" in the editor, not connect_supabase or manual URL+key.'
              : undefined,
        })
      },
    )

    server.tool(
      'run_security_scan',
      "Run a real RLS security scan on the project's connected Supabase — probes every table with the public anon key (an attacker's view) and reports which tables leak data. Read-only.",
      { project_id: z.string().describe('Project ID') },
      { title: 'Run security (RLS) scan', readOnlyHint: true, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        try {
          const { connected, blockedRef, report } = await runProjectRlsScan(db, args.project_id, userId)
          if (blockedRef) return errorResult('That project cannot be scanned.')
          if (!connected) return errorResult('No Supabase connected for this project. Connect it in the WyberAi editor first.')
          // scanRls returns reachable:false with a placeholder score:100 when
          // it couldn't reach ANY table with the anon key (paused project,
          // rotated/wrong key) — that is "nothing was actually checked", not
          // "checked and clean". Surfacing the raw report as-is reads as a
          // clean pass; make the inconclusive case impossible to miss.
          if (report && report.reachable === false) {
            return jsonResult({
              ...report,
              inconclusive: true,
              message: `⚠️ Scan did not run — no tables were reachable with the anon key (${report.note ?? 'the project may be paused, or the URL/key is stale'}). This is NOT a clean result; nothing was actually checked. Verify the connection in the WyberAi editor and retry.`,
            })
          }
          return jsonResult(report)
        } catch (e) {
          return errorResult(`Scan failed: ${String(e).slice(0, 300)}`)
        }
      },
    )

    server.tool(
      'list_versions',
      'List saved versions (snapshots) of a project, newest first. Use restore_version to roll back.',
      { project_id: z.string().describe('Project ID') },
      { title: 'List project versions', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data, error } = await db
          .from('project_versions')
          .select('id, label, created_at')
          .eq('project_id', args.project_id)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) return errorResult(`Could not list versions: ${error.message}`)
        return jsonResult({ versions: data ?? [] })
      },
    )

    server.tool(
      'restore_version',
      'Roll a project back to a saved version (from list_versions). Overwrites the current files.',
      {
        project_id: z.string().describe('Project ID'),
        version_id: z.string().describe('Version ID from list_versions'),
      },
      // destructiveHint: overwrites the current working files with the snapshot.
      { title: 'Restore a project version', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()
        const { data: version } = await db
          .from('project_versions')
          .select('files')
          .eq('id', args.version_id)
          .eq('project_id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!version) return errorResult('Version not found')
        const { error } = await db
          .from('projects')
          .update({ files: version.files })
          .eq('id', args.project_id)
          .eq('user_id', userId)
        if (error) return errorResult(error.message)
        const count = Object.keys((version.files as Record<string, unknown>) ?? {}).length
        return jsonResult({ ok: true, restored_files: count })
      },
    )

    server.tool(
      'connect_supabase',
      'Connect a Supabase database to the project (URL + anon key). Enables real data instead of mocks. Note: SQL execution and security scans additionally require connecting Supabase via OAuth in the WyberAi editor — this tool alone does not enable execute_sql/run_security_scan.',
      {
        project_id: z.string().describe('Project ID'),
        supabase_url: z.string().describe('Supabase project URL'),
        supabase_key: z.string().describe('Supabase anon key'),
      },
      { title: 'Connect Supabase', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
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

        try {
          const { encrypt } = await import('@/lib/secrets-crypto')
          const refMatch = args.supabase_url.match(/https:\/\/([a-z0-9]+)\.supabase/i)
          const { error } = await db
            .from('project_connectors')
            .upsert(
              {
                project_id: args.project_id,
                user_id: userId,
                service: 'supabase',
                // Same shape the editor's manual-paste connect flow writes
                // (src/app/api/connectors/route.ts) — this is what codegen's
                // getSupabaseContext actually reads. The onConflict target
                // must match the real DB constraint, unique(project_id, service)
                // — a 3-column target here always failed with a Postgres
                // 42P10 error, so this tool never connected anything before.
                api_key: encrypt(args.supabase_key),
                config: { url: args.supabase_url, ref: refMatch?.[1] ?? null },
                connected_at: new Date().toISOString(),
              },
              { onConflict: 'project_id,service' },
            )
          if (error) return errorResult(`Could not connect: ${error.message}`)

          return jsonResult({
            success: true,
            message: `✅ Supabase connected!\n\nYour app can now use real auth and database queries.\n\nURL: ${args.supabase_url}\n\nNext: rebuild the app to replace mock data with live queries.\n\nNote: execute_sql and run_security_scan need Supabase connected via OAuth in the WyberAi editor (Connect Supabase → "Connect with Supabase") — this URL+key connection alone doesn't enable those.`,
          })
        } catch (err) {
          return errorResult(`Could not connect Supabase: ${String(err).slice(0, 100)}`)
        }
      },
    )

    server.tool(
      'connect_wybercloud',
      'Connect WyberCloud (our hosted database) for easy backend without setup. Currently unavailable via the connector — provisions real cloud infrastructure and needs to go through the WyberAi editor.',
      {
        project_id: z.string().describe('Project ID'),
      },
      { title: 'Connect WyberCloud', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      async (_args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        // The old implementation wrote a { service: 'wybercloud', config: {
        // enabled: true } } marker row that nothing in the codebase ever
        // reads — it also used a 3-column onConflict target that doesn't
        // match the real 2-column DB constraint, so it always failed anyway.
        // Real WyberCloud provisioning (/api/cloud/create-database) spins up
        // a genuine, billable Google Cloud SQL instance and takes 5-10
        // minutes — that's a real infra-provisioning action with no rate
        // limiting today, not something to expose to an MCP tool call
        // without deliberately deciding to. Refuse honestly instead of
        // faking success.
        return errorResult('Connecting WyberCloud isn\'t available via the connector yet. Open the project in the WyberAi editor and use "Connect WyberCloud" there.')
      },
    )

    server.tool(
      'invite_collaborator',
      'Invite someone to edit or view this project.',
      {
        project_id: z.string().describe('Project ID'),
        email: z.string().describe('Email to invite'),
        role: z.enum(['editor', 'viewer']).describe('Role: editor (can build/edit) or viewer (read-only)'),
      },
      { title: 'Invite teammate', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        try {
          const res = await fetch(`${APP_URL}/api/projects/${args.project_id}/collaborators`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Scheduler-User-Id': userId,
              'X-Scheduler-Secret': internalSecret(),
            },
            body: JSON.stringify({ email: args.email, role: args.role }),
          })
          const data = await res.json()
          if (!res.ok) return errorResult(data.error || 'Invite failed')

          return jsonResult({
            success: true,
            invited_email: args.email,
            role: args.role,
            message: `✅ Invitation sent to ${args.email}\n\nThey can now ${args.role === 'editor' ? 'build and edit' : 'view'} your project once they accept.`,
          })
        } catch (err) {
          return errorResult(`Could not invite: ${String(err).slice(0, 100)}`)
        }
      },
    )

    server.tool(
      'export_code',
      'Download your entire project as a ZIP file. Free.',
      { project_id: z.string().describe('Project ID') },
      { title: 'Export code', readOnlyHint: true, openWorldHint: false },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')

        const downloadUrl = `${APP_URL}/api/export?project_id=${args.project_id}&format=zip`
        return jsonResult({
          success: true,
          download_url: downloadUrl,
          message: `✅ Export ready!\n\nDownload your code (opens in your browser, signed in as yourself): ${downloadUrl}\n\nYou can run it locally, deploy elsewhere, or use as a reference.`,
        })
      },
    )

    server.tool(
      'push_to_github',
      'Push your code to GitHub. Requires GitHub connection.',
      { project_id: z.string().describe('Project ID') },
      { title: 'Push to GitHub', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
      async (args, extra) => {
        const userId = userIdFromAuth(extra.authInfo as AuthInfo | undefined)
        if (!userId) return errorResult('Unauthorized')
        const db = createServiceClient()

        const { data: project } = await db
          .from('projects')
          .select('name, files')
          .eq('id', args.project_id)
          .eq('user_id', userId)
          .single()
        if (!project) return errorResult('Project not found')
        if (!project.files || Object.keys(project.files as Record<string, unknown>).length === 0) {
          return errorResult('Project has no files to push yet.')
        }

        try {
          const res = await fetch(`${APP_URL}/api/github/push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Scheduler-User-Id': userId,
              'X-Scheduler-Secret': internalSecret(),
            },
            body: JSON.stringify({ files: project.files, projectName: project.name }),
          })
          const data = await res.json()
          if (!res.ok) {
            if (res.status === 400 && data.error === 'GitHub not connected') {
              return errorResult('GitHub is not connected. Connect it in the WyberAi editor (Connect GitHub) first.')
            }
            return errorResult(data.error || 'Push failed')
          }

          return jsonResult({
            success: true,
            repo_url: data.repoUrl,
            files_pushed: data.files,
            message: `✅ Code pushed to GitHub!\n\n${data.repoUrl}\n\nYou can clone, deploy, or collaborate on GitHub.`,
          })
        } catch (err) {
          return errorResult(`Could not push to GitHub: ${String(err).slice(0, 100)}`)
        }
      },
    )

    server.tool(
      'list_connectors',
      'Browse the connector catalog (Gmail, Notion, Linear, Slack, and 250+ others) available to wire into your app. Optionally filter with a search term.',
      { search: z.string().optional().describe('Filter by name/keyword, e.g. "gmail"') },
      { title: 'Browse connectors', readOnlyHint: true, openWorldHint: true },
      async (args) => {
        const apiKey = process.env.COMPOSIO_API_KEY
        if (!apiKey) return errorResult('Connectors are not configured on this server.')
        try {
          const composio = new Composio({ apiKey })
          const all = await composio.toolkits.get({ limit: 250 })
          const q = (args.search || '').toLowerCase()
          const list = all
            .map(t => ({ slug: t.slug, name: t.name, description: t.meta?.description ?? '', categories: (t.meta?.categories ?? []).map((c: { name: string }) => c.name) }))
            .filter(t => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
          return jsonResult({ total: list.length, connectors: list.slice(0, 60) })
        } catch (e) {
          return errorResult(`Could not load connectors: ${String(e).slice(0, 200)}`)
        }
      },
    )
  },
  { serverInfo: { name: 'wyber-ai', version: '2.4.0' } },
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
