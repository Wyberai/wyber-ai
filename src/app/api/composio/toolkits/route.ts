import { NextRequest, NextResponse } from 'next/server'
import { Composio } from '@composio/core'

// Cached in-memory for the lifetime of this serverless instance (toolkits rarely change)
let cachedAt = 0
let cached: ComposioToolkit[] | null = null
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export interface ComposioToolkit {
  slug: string
  name: string
  description: string
  logo: string
  categories: string[]
  toolsCount: number
}

// GET /api/composio/toolkits?search=gmail&category=communication
// GET /api/composio/toolkits?toolkit=GMAIL  (fetch actions for a single toolkit)
export async function GET(req: NextRequest) {
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'COMPOSIO_API_KEY not configured' }, { status: 503 })
  }

  const { searchParams } = req.nextUrl
  const toolkitSlug = searchParams.get('toolkit')

  // If asking for actions of a specific toolkit, fetch those
  if (toolkitSlug) {
    return getToolkitActions(apiKey, toolkitSlug)
  }

  // Otherwise return the full toolkit catalog
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''

  try {
    const toolkits = await getOrFetchToolkits(apiKey)
    let result = toolkits

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    }

    if (category) {
      result = result.filter(t => t.categories.some(c => c.toLowerCase() === category.toLowerCase()))
    }

    return NextResponse.json({ toolkits: result, total: result.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function getOrFetchToolkits(apiKey: string): Promise<ComposioToolkit[]> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached

  const composio = new Composio({ apiKey })
  // Fetch all toolkits — Composio returns up to 250 per page
  const result = await composio.toolkits.get({ limit: 250 })
  const toolkits: ComposioToolkit[] = result.map(t => ({
    slug: t.slug,
    name: t.name,
    description: t.meta?.description ?? '',
    logo: t.meta?.logo ?? '',
    categories: (t.meta?.categories ?? []).map((c: { name: string }) => c.name),
    toolsCount: t.meta?.toolsCount ?? 0,
  }))

  cached = toolkits
  cachedAt = Date.now()
  return toolkits
}

async function getToolkitActions(apiKey: string, toolkitSlug: string) {
  try {
    const composio = new Composio({ apiKey })
    // Use 'default' as userId for catalog browsing (no user auth needed for tool metadata)
    const tools = await composio.tools.get('default', {
      toolkits: [toolkitSlug.toUpperCase()],
      limit: 100,
    })

    // Composio returns Claude-format tool descriptors: { type: 'function', function: { name, description, parameters } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actions = (Array.isArray(tools) ? tools : []).map((t: any) => ({
      slug: t.function?.name ?? t.name ?? '',
      name: t.function?.name ?? t.name ?? '',
      description: t.function?.description ?? t.description ?? '',
    }))

    return NextResponse.json({ actions })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
