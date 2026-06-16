import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendAIEmployeesWaitlistEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { error } = await admin.from('ai_employee_waitlist').insert({ email: email.toLowerCase().trim() })

    if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'Could not save' }, { status: 500 })
    }

    sendAIEmployeesWaitlistEmail(email).catch(() => {})
    return NextResponse.json({ success: true, alreadyJoined: error?.code === '23505' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
