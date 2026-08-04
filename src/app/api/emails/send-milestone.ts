import { createServiceClient } from '@/lib/supabase/server'
import { sendMilestoneEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  // Verify admin access via Authorization header
  const auth = req.headers.get('authorization')
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey || auth !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createServiceClient()

    // Get all users with emails
    const { data: users, error } = await db
      .from('auth.users')
      .select('id, email, user_metadata')
      .limit(10000)

    if (error) throw error

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found', sent: 0 })
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send emails in batches
    for (const user of users) {
      try {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Creator'
        await sendMilestoneEmail(user.email, name)
        sent++

        // Rate limit: send 10 emails per second
        if (sent % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (err) {
        failed++
        errors.push(`${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: 'Milestone emails sent',
      total: users.length,
      sent,
      failed,
      errors: errors.slice(0, 10) // Return first 10 errors
    })
  } catch (err) {
    console.error('[Milestone Email] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send emails' },
      { status: 500 }
    )
  }
}
