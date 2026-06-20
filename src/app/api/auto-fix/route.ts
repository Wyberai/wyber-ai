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

  // Detect error type for better fix guidance
  const isRuntime = error.toLowerCase().includes('runtime') || error.includes('is not defined') || error.includes('Cannot read') || error.includes('is not a function') || error.includes('undefined')
  const isSyntax = error.includes('SyntaxError') || error.includes('Unexpected token') || error.includes('Parse error')
  const isImport = error.includes('Could not resolve') || error.includes('Module not found') || error.includes('Cannot find module') || error.includes('is not exported')
  const isType = error.includes('TypeError') || error.includes('is not assignable') || error.includes('Property') && error.includes('does not exist')

  const errorType = isRuntime ? 'RUNTIME' : isSyntax ? 'SYNTAX' : isImport ? 'IMPORT' : isType ? 'TYPE' : 'BUILD'

  const prompt = `A React app has a ${errorType} error. Fix it and return ONLY the corrected file(s).

ERROR:
${error.slice(0, 1000)}

ERROR TYPE: ${errorType}
${fileName ? `Most likely in: ${fileName}` : ''}

FILES:
${fileList.slice(0, 12000)}

FIX STRATEGY (based on error type):
${isImport ? '- Add the missing import or remove the unused one. Check if the module name is spelled correctly.' : ''}
${isRuntime ? '- A variable, function, or property is undefined at runtime. Add null checks, default values, or fix the reference.' : ''}
${isSyntax ? '- Fix the syntax error — missing bracket, comma, semicolon, or malformed JSX.' : ''}
${isType ? '- Fix the type mismatch — wrong prop type, missing property, or incorrect function signature.' : ''}
${!isImport && !isRuntime && !isSyntax && !isType ? '- Analyze the error message carefully and fix the root cause.' : ''}

RULES:
- Return ONLY the files you changed, using this exact format for each:
<file path="src/App.tsx">
...complete corrected file content...
</file>
- Fix the root cause, not just the symptom
- Do NOT add comments explaining the fix
- Do NOT change any working functionality or styling
- Output the COMPLETE file, not a partial diff
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
