import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SnackFile {
  type: 'CODE' | 'ASSET'
  contents: string
}

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

    // Convert editor file map to Snack file format
    const snackFiles: Record<string, SnackFile> = {}
    for (const [path, content] of Object.entries(files)) {
      // Snack expects paths without leading src/ for RN projects
      const snackPath = path.startsWith('src/') ? path.slice(4) : path
      snackFiles[snackPath] = { type: 'CODE', contents: content }
    }

    // Ensure App.tsx exists (required by Snack)
    if (!snackFiles['App.tsx'] && !snackFiles['app/index.tsx']) {
      return NextResponse.json({ error: 'No App.tsx found in files' }, { status: 400 })
    }

    const payload = {
      name: name || 'Wyber AI Mobile App',
      description: description || 'Generated with Wyber AI',
      files: snackFiles,
      sdkVersion: '52.0.0',
      dependencies: {},
    }

    const res = await fetch('https://exp.host/--/api/v2/snack/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Expo-Platform': 'web',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Snack API error: ${text}` }, { status: 500 })
    }

    const data = await res.json() as { id: string; hashId?: string }
    const snackId = data.id || data.hashId
    if (!snackId) return NextResponse.json({ error: 'No snack ID returned' }, { status: 500 })

    return NextResponse.json({
      snackId,
      snackUrl: `https://snack.expo.dev/${snackId}`,
      embedUrl: `https://snack.expo.dev/embedded/${snackId}?platform=ios&theme=dark&preview=true`,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
