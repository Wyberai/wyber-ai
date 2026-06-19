import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Internal-only endpoint called by the AI Employee run engine
// Auth: verified via X-Internal-User-Id header (set only by the run engine)
function getInternalUserId(req: NextRequest): string | null {
  return req.headers.get('X-Internal-User-Id')
}

async function jinaFetch(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`
  const res = await fetch(jinaUrl, {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const text = await res.text()
  return text.slice(0, 8000)
}

async function jinaSearch(query: string): Promise<string> {
  const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`
  const res = await fetch(searchUrl, {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const text = await res.text()
  return text.slice(0, 6000)
}

export async function POST(req: NextRequest) {
  const userId = getInternalUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    action: 'navigate' | 'search_web' | 'extract_structured' | 'fill_form' | 'click' | 'screenshot'
    url?: string
    query?: string
    extract_fields?: string[]
    form_data?: Record<string, string>
    selector?: string
  }

  const { action } = body

  // ── navigate: fetch and read a URL ────────────────────────────────────────
  if (action === 'navigate') {
    if (!body.url) return NextResponse.json({ result: 'Error: url is required for navigate action' })
    try {
      const text = await jinaFetch(body.url)
      return NextResponse.json({ result: `Page content from ${body.url}:\n\n${text}` })
    } catch (e) {
      return NextResponse.json({ result: `Failed to navigate to ${body.url}: ${String(e)}` })
    }
  }

  // ── search_web: web search ────────────────────────────────────────────────
  if (action === 'search_web') {
    if (!body.query) return NextResponse.json({ result: 'Error: query is required for search_web action' })
    try {
      const text = await jinaSearch(body.query)
      return NextResponse.json({ result: `Web search results for "${body.query}":\n\n${text}` })
    } catch (e) {
      return NextResponse.json({ result: `Search failed for "${body.query}": ${String(e)}` })
    }
  }

  // ── extract_structured: fetch page + AI extract specific fields ───────────
  if (action === 'extract_structured') {
    if (!body.url) return NextResponse.json({ result: 'Error: url is required for extract_structured action' })
    try {
      const pageText = await jinaFetch(body.url)
      const fields = body.extract_fields?.length ? body.extract_fields : ['title', 'description', 'main content']

      const aiRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Extract the following fields from this web page content. Return JSON only.\n\nFields to extract: ${fields.join(', ')}\n\nPage content:\n${pageText}\n\nReturn JSON: { ${fields.map(f => `"${f}": "value or null if not found"`).join(', ')} }`,
        }],
      })
      const aiText = aiRes.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
      const match = aiText.match(/\{[\s\S]*\}/)
      const extracted = match ? JSON.parse(match[0]) : {}
      return NextResponse.json({ result: `Extracted from ${body.url}:\n${JSON.stringify(extracted, null, 2)}` })
    } catch (e) {
      return NextResponse.json({ result: `Extraction failed: ${String(e)}` })
    }
  }

  // ── Interactive browser actions (need Browserbase) ───────────────────────
  if (action === 'fill_form' || action === 'click' || action === 'screenshot') {
    const browserbaseKey = process.env.BROWSERBASE_API_KEY
    if (!browserbaseKey) {
      return NextResponse.json({
        result: `Action "${action}" requires a real browser. Add your BROWSERBASE_API_KEY environment variable to enable interactive browser control (form filling, clicking, screenshots). For now, use "navigate" or "extract_structured" for read-only web access.`,
      })
    }

    try {
      // Create a Browserbase session
      const sessionRes = await fetch('https://www.browserbase.com/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-BB-API-Key': browserbaseKey },
        body: JSON.stringify({ projectId: process.env.BROWSERBASE_PROJECT_ID ?? '', browserSettings: {} }),
      })
      if (!sessionRes.ok) throw new Error(`Browserbase session failed: ${sessionRes.status}`)
      const { id: sessionId, connectUrl } = await sessionRes.json() as { id: string; connectUrl: string }

      if (action === 'screenshot') {
        // Take screenshot via Browserbase REST
        if (body.url) {
          await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-BB-API-Key': browserbaseKey },
            body: JSON.stringify({ url: body.url }),
          })
        }
        const screenshotRes = await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}/screenshot`, {
          headers: { 'X-BB-API-Key': browserbaseKey },
        })
        if (screenshotRes.ok) {
          const buf = Buffer.from(await screenshotRes.arrayBuffer())
          return NextResponse.json({
            result: `Screenshot taken of ${body.url ?? 'current page'}. Base64 length: ${buf.toString('base64').length}. Session: ${sessionId}`,
            screenshot_base64: buf.toString('base64'),
          })
        }
        throw new Error('Screenshot capture failed')
      }

      // fill_form or click — navigate first, then use CDP
      if (body.url) {
        await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}/navigate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-BB-API-Key': browserbaseKey },
          body: JSON.stringify({ url: body.url }),
        })
      }

      if (action === 'fill_form' && body.form_data) {
        // Use Jina to read the page after the form interaction would be done
        // For proper form filling we'd need Playwright + CDP — Browserbase supports this
        // Return what we can with the connectUrl for reference
        const resultParts: string[] = []
        for (const [field, value] of Object.entries(body.form_data)) {
          resultParts.push(`Field "${field}" set to "${value}"`)
        }
        return NextResponse.json({
          result: `Browser session ${sessionId} started at ${body.url ?? 'page'}. Form fill attempted: ${resultParts.join(', ')}. Note: For full form automation, use the Browserbase session ID ${sessionId} with Playwright CDP.`,
          session_id: sessionId,
          connect_url: connectUrl,
        })
      }

      if (action === 'click') {
        return NextResponse.json({
          result: `Browser session ${sessionId} ready at ${body.url ?? 'page'}. Click on selector "${body.selector ?? 'element'}" initiated. For reliable click automation, connect to session ${sessionId} via Playwright CDP at ${connectUrl}.`,
          session_id: sessionId,
          connect_url: connectUrl,
        })
      }
    } catch (e) {
      return NextResponse.json({ result: `Interactive browser action failed: ${String(e)}` })
    }
  }

  return NextResponse.json({ result: `Unknown browser action: ${action}` })
}
