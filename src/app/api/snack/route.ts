import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { files, name, description } = await req.json() as {
      files: Record<string, string>
      name?: string
      description?: string
    }

    // Build the `code` map: { filename: { type: 'CODE', contents: string } }
    // Strip leading src/ — Snack expects bare filenames like App.tsx, screens/Home.tsx
    const code: Record<string, { type: 'CODE'; contents: string }> = {}
    for (const [path, content] of Object.entries(files ?? {})) {
      if (!content) continue
      const snackPath = path.startsWith('src/') ? path.slice(4) : path
      code[snackPath] = { type: 'CODE', contents: content }
    }

    // Snack requires an App.tsx or App.js entry point
    if (!code['App.tsx'] && !code['App.js'] && !code['app/index.tsx']) {
      return NextResponse.json({ error: 'No App.tsx entry point found in files' }, { status: 400 })
    }

    // Exact payload shape from snack-sdk Session.ts saveAsync()
    const payload = {
      manifest: {
        sdkVersion: '52.0.0',
        name: name || 'Wyber AI Mobile App',
        description: description || 'Generated with Wyber AI',
        dependencies: {},
      },
      code,
      dependencies: {},
      isDraft: false,
    }

    const res = await fetch('https://exp.host/--/api/v2/snack/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: `Snack API error (${res.status}): ${text}` }, { status: 500 })
    }

    let data: { id?: string; errors?: { message: string }[] }
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: `Invalid JSON from Snack API: ${text.slice(0, 200)}` }, { status: 500 })
    }

    if (!data.id) {
      const msg = data.errors?.[0]?.message || 'No id returned'
      return NextResponse.json({ error: `Snack save failed: ${msg}` }, { status: 500 })
    }

    const snackId = data.id
    return NextResponse.json({
      snackId,
      snackUrl: `https://snack.expo.dev/${snackId}`,
      // embed URL: ?snack= param is the canonical format for anonymous/saved snacks
      embedUrl: `https://snack.expo.dev/embedded?snack=${snackId}&platform=ios&theme=dark&preview=true`,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
