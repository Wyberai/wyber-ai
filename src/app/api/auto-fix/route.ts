import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Auto-fix endpoint: takes an error + the files that caused it, returns patched files
// Costs 0 credits — error fixes are always free
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error, files, fileName } = await req.json() as {
    error: string
    files: Record<string, string>
    fileName?: string
  }

  if (!error || !files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'error and files required' }, { status: 400 })
  }

  const fileList = Object.entries(files)
    .map(([path, content]) => `--- ${path} ---\n${(content as string).slice(0, 3000)}`)
    .join('\n\n')

  const prompt = `A React app has a build/runtime error. Fix it and return ONLY the corrected file(s).

ERROR:
${error.slice(0, 1000)}

${fileName ? `The error is most likely in: ${fileName}` : ''}

FILES:
${fileList.slice(0, 12000)}

RULES:
- Return ONLY the files you changed, using this exact format for each:
<file path="src/App.tsx">
...complete corrected file content...
</file>
- Fix the root cause, not just the symptom
- Do NOT add comments explaining the fix
- Do NOT change any working functionality
- If the error is a missing import, add it
- If the error is a type error, fix the type
- If the error is a syntax error, fix the syntax
- Keep all existing styling and logic intact
- Return ONLY <file> blocks, no prose`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = res.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    // Parse <file path="...">...</file> blocks
    const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g
    const fixes: Record<string, string> = {}
    let match
    while ((match = fileRegex.exec(text)) !== null) {
      fixes[match[1]] = match[2].trim()
    }

    if (Object.keys(fixes).length === 0) {
      return NextResponse.json({ fixed: false, reason: 'Could not generate a fix' })
    }

    return NextResponse.json({
      fixed: true,
      files: fixes,
      filesChanged: Object.keys(fixes),
    })
  } catch (e) {
    return NextResponse.json({ fixed: false, reason: String(e) })
  }
}
