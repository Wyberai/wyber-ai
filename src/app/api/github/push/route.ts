import { internalSecret } from '@/lib/internal-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sanitizeFiles } from '@/lib/sanitize-files'

export async function POST(req: NextRequest) {
  try {
    // Internal callers (the MCP push_to_github tool) have no browser session —
    // same X-Scheduler-Secret/X-Scheduler-User-Id bypass as /api/publish.
    const schedulerSecret = req.headers.get('x-scheduler-secret')
    const schedulerUserId = req.headers.get('x-scheduler-user-id')
    const isInternalCall = !!schedulerUserId && schedulerSecret === internalSecret()

    let userId: string
    if (isInternalCall) {
      userId = schedulerUserId!
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      userId = user.id
    }

    const { files: rawFiles, projectName, repoName } = await req.json()
    const files = sanitizeFiles(rawFiles as Record<string, { content: string }>)

    // Get GitHub token — service client since internal calls have no session
    // to scope the cookie-based client's RLS-filtered select against.
    const admin = createServiceClient()
    const { data: conn } = await admin.from('github_connections')
      .select('access_token, github_username').eq('user_id', userId).single()
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
