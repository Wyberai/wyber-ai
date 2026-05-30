import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY
    if (!FIRECRAWL_KEY) return NextResponse.json({ error: 'FIRECRAWL_API_KEY not set' }, { status: 503 })

    // Scrape the website
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown', 'screenshot'], screenshot: true }),
    })
    const scrapeData = await scrapeRes.json()

    if (!scrapeData.success) return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 })

    const pageContent = scrapeData.data?.markdown?.slice(0, 3000) || ''
    const screenshotUrl = scrapeData.data?.screenshot || ''

    // Generate React clone
    const prompt = `Clone this website as a React app. Here is the page content:\n\n${pageContent}\n\nBuild a pixel-perfect React clone with:
- Same layout structure and sections
- Same copy and content
- Dark theme with sky blue accent
- Space Grotesk + Sora fonts
- Max 5 files total
- Relative imports only

Output <file path="...">...</file> blocks only.`

    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    return NextResponse.json({ code: text, screenshot: screenshotUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
