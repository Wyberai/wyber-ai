import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeFiles } from '@/lib/sanitize-files'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { files: rawFiles, projectName, repoName } = await req.json()
    const files = sanitizeFiles(rawFiles as Record<string, { content: string }>)

    // Get GitHub token
    const { data: conn } = await supabase.from('github_connections')
      .select('access_token, github_username').eq('user_id', user.id).single()
    if (!conn) return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })

    const { access_token: token, github_username: username } = conn
    const repo = repoName || projectName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'wyber-app'

    // Create repo if it doesn't exist
    await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: repo, private: false, auto_init: false, description: `Built with WyberAi - wyberai.com` }),
    })

    // Push all files
    const results = []
    for (const [path, file] of Object.entries(files)) {
      const cleanPath = path.replace(/^\//, '')
      const content = typeof file === 'string' ? file : file.content ?? ''
      // Check if file exists
      const existsRes = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${cleanPath}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
      })
      const existing = existsRes.ok ? await existsRes.json() : null
      const body: any = {
        message: `Update ${cleanPath} via WyberAi`,
        content: Buffer.from(content).toString('base64'),
      }
      if (existing?.sha) body.sha = existing.sha

      const pushRes = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${cleanPath}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      results.push({ path: cleanPath, ok: pushRes.ok })
    }

    const repoUrl = `https://github.com/${username}/${repo}`
    return NextResponse.json({ repoUrl, files: results.length, username, repo })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
