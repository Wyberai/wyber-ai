import { NextResponse } from 'next/server'

// The description of the REST API, for tools that import one: ChatGPT custom actions, Postman, n8n, code generators.
// Public on purpose (it describes the API, it holds no data). Two calls cover everything: list the tools, then call one by
// name. Keeping it to those two means the document never drifts from the tools themselves.
const spec = {
  openapi: '3.1.0',
  info: {
    title: 'WyberAi API',
    version: '1.0.0',
    description: 'Build, inspect and publish WyberAi projects from your own AI agent or automation. Authenticate with an API key created in WyberAi under Settings, API Keys. A read-only key can call only the tools marked readOnly.',
  },
  servers: [{ url: 'https://wyberai.com' }],
  security: [{ ApiKey: [] }],
  paths: {
    '/api/v1/tools': {
      get: {
        operationId: 'listTools',
        summary: 'List the tools this key can call',
        description: 'Returns every tool with its description, its input schema, and whether it is read-only.',
        responses: { '200': { description: 'The tools' }, '401': { description: 'Missing, invalid, revoked or expired key' }, '429': { description: 'Too many requests' } },
      },
    },
    '/api/v1/tools/{name}': {
      post: {
        operationId: 'callTool',
        summary: 'Run one tool',
        description: 'Send the tool\'s arguments as a JSON object. The result comes back as { ok: true, result }. A read-only key calling a tool that changes things gets 403.',
        parameters: [{ name: 'name', in: 'path', required: true, description: 'The tool name from listTools, for example list_projects or get_project.', schema: { type: 'string' } }],
        requestBody: { required: false, content: { 'application/json': { schema: { type: 'object', additionalProperties: true, description: 'The tool\'s arguments.' } } } },
        responses: {
          '200': { description: 'The tool ran. Body: { ok: true, result }.' },
          '400': { description: 'The tool refused the arguments or failed. Body: { ok: false, error }.' },
          '401': { description: 'Missing, invalid, revoked or expired key' },
          '403': { description: 'The key is read-only and this tool changes things' },
          '404': { description: 'No tool with that name' },
          '429': { description: 'Too many requests' },
        },
      },
    },
  },
  components: { securitySchemes: { ApiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' } } },
}

export function GET() {
  return NextResponse.json(spec, { headers: { 'Cache-Control': 'public, max-age=300' } })
}
