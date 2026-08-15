import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Run this SQL once in your Supabase dashboard to create the table:
//
// create table if not exists independence_day_entries (
//   id uuid primary key default gen_random_uuid(),
//   name text not null,
//   email text not null,
//   app_url text not null,
//   video_url text,
//   description text not null,
//   created_at timestamptz default now()
// );

const resend = new Resend(process.env.RESEND_API_KEY!)
const FOUNDER_EMAIL = 'hello@wyberai.com'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    name?: string
    email?: string
    appUrl?: string
    description?: string
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim()
  const appUrl = (body.appUrl ?? '').trim()
  const description = (body.description ?? '').trim()

  if (!name || !email || !appUrl || !description) {
    return NextResponse.json({ error: 'Name, email, app URL, and description are required.' }, { status: 400 })
  }
  if (description.length > 500) {
    return NextResponse.json({ error: 'Description must be 500 characters or less.' }, { status: 400 })
  }

  // Deadline check: August 15 2026 11:59:59 PM IST = 18:29:59 UTC
  const deadline = new Date('2026-08-15T18:29:59Z')
  if (new Date() > deadline) {
    return NextResponse.json({ error: 'Submissions are now closed. Thank you for building with WyberAi.' }, { status: 400 })
  }

  // Save to Supabase (best-effort — email is the reliable fallback)
  try {
    const db = createServiceClient()
    await db.from('independence_day_entries').insert({ name, email, app_url: appUrl, description })
  } catch {
    // Table may not exist yet — email notification still fires below
  }

  // Notify founder immediately
  try {
    await resend.emails.send({
      from: 'WyberAi <hello@wyberai.com>',
      to: FOUNDER_EMAIL,
      subject: `🇮🇳 New Independence Day Entry: ${name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;padding:32px">
          <h2 style="margin:0 0 24px;font-size:22px">New Contest Entry 🏆</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:10px 0;color:#666;width:120px">Name</td><td style="padding:10px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:10px 0;color:#666">Email</td><td style="padding:10px 0">${email}</td></tr>
            <tr><td style="padding:10px 0;color:#666">App URL</td><td style="padding:10px 0"><a href="${appUrl}">${appUrl}</a></td></tr>
            <tr><td style="padding:10px 0;color:#666;vertical-align:top">What they built</td><td style="padding:10px 0">${description}</td></tr>
          </table>
        </div>
      `,
    })
  } catch {
    // Email failure should not fail the submission
  }

  return NextResponse.json({ ok: true })
}
