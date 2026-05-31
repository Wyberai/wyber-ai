import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const authKey = req.headers.get('x-admin-key')
    if (authKey !== (process.env.ADMIN_SECRET_KEY || 'wyber-admin-2026')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { offset = 0 } = await req.json().catch(() => ({}))
    const admin = getAdmin()

    const { data: apps } = await admin
      .from('prebuilt_apps')
      .select('id, name, category, description, keywords')
      .range(offset, offset + 9)

    if (!apps?.length) return NextResponse.json({ done: true, generated: 0 })

    let count = 0
    for (const app of apps) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Generate a complete self-contained React component for a "${app.name}" app.
Category: ${app.category}. Description: ${app.description}.
Rules: inline styles only, dark theme (#09090b bg, #111113 cards, #fafafa text, #0EA5E9 accent), realistic mock data, under 200 lines, no imports except useState from react.
Start directly with: import { useState } from 'react'`
          }]
        })
        const code = response.content[0].type === 'text'
          ? response.content[0].text.replace(/```jsx?\n?/g, '').replace(/```\n?/g, '').trim()
          : ''
        await admin.from('prebuilt_apps').update({ files: { code, generated: true } }).eq('id', app.id)
        count++
        console.log(`Generated: ${app.name}`)
      } catch (err) {
        console.error(`Failed ${app.name}:`, String(err))
      }
    }
    return NextResponse.json({ generated: count, offset, next: offset + 10, remaining: 100 - (offset + 10) })
  } catch (err) {
    console.error('Error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
