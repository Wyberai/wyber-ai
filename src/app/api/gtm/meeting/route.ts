import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDecryptedSecret } from '@/lib/get-decrypted-secret'

// Meeting booking step for GTM sequences
// Supports Calendly (primary) and Cal.com as scheduling providers

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    action: 'get_link' | 'create_one_off' | 'check_booked'
    lead_id?: string
    lead_email?: string
    event_type_slug?: string
    provider?: 'calendly' | 'calcom'
  }

  const provider = body.provider ?? 'calendly'

  if (provider === 'calendly') {
    const apiKey = await getDecryptedSecret(user.id, 'CALENDLY_API_KEY')
    if (!apiKey) {
      return NextResponse.json({
        connected: false,
        message: 'Add your CALENDLY_API_KEY in Settings → Secrets. Get it from calendly.com/integrations/api_webhooks.',
        fallback_url: null,
      })
    }

    if (body.action === 'get_link') {
      try {
        const meRes = await fetch('https://api.calendly.com/users/me', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!meRes.ok) throw new Error(`Calendly auth failed: ${meRes.status}`)
        const me = await meRes.json() as { resource: { uri: string; scheduling_url: string } }

        const eventsRes = await fetch(`https://api.calendly.com/event_types?user=${me.resource.uri}&active=true`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        const events = await eventsRes.json() as { collection: Array<{ uri: string; name: string; slug: string; scheduling_url: string; duration: number }> }

        const eventTypes = (events.collection ?? []).map(e => ({
          name: e.name,
          slug: e.slug,
          url: e.scheduling_url,
          duration: e.duration,
        }))

        const selected = body.event_type_slug
          ? eventTypes.find(e => e.slug === body.event_type_slug)
          : eventTypes[0]

        let bookingUrl = selected?.url ?? me.resource.scheduling_url
        if (body.lead_email) {
          bookingUrl += `?email=${encodeURIComponent(body.lead_email)}`
          if (body.lead_id) bookingUrl += `&utm_content=${body.lead_id}`
        }

        return NextResponse.json({
          connected: true,
          booking_url: bookingUrl,
          event_types: eventTypes,
          selected: selected ?? null,
        })
      } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
      }
    }

    if (body.action === 'check_booked') {
      if (!body.lead_email) return NextResponse.json({ error: 'lead_email required' }, { status: 400 })
      try {
        const meRes = await fetch('https://api.calendly.com/users/me', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        const me = await meRes.json() as { resource: { uri: string } }

        const now = new Date()
        const minTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const maxTime = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()

        const schedRes = await fetch(
          `https://api.calendly.com/scheduled_events?user=${me.resource.uri}&min_start_time=${minTime}&max_start_time=${maxTime}&invitee_email=${encodeURIComponent(body.lead_email)}&status=active`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        )
        const sched = await schedRes.json() as { collection: Array<{ uri: string; name: string; start_time: string; status: string }> }

        const meetings = (sched.collection ?? []).map(m => ({
          name: m.name,
          start_time: m.start_time,
          status: m.status,
        }))

        if (meetings.length > 0 && body.lead_id) {
          const db = createServiceClient()
          await db.from('gtm_leads').update({
            status: 'meeting_booked',
          }).eq('id', body.lead_id).eq('user_id', user.id)
        }

        return NextResponse.json({ booked: meetings.length > 0, meetings })
      } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
      }
    }
  }

  if (provider === 'calcom') {
    const apiKey = await getDecryptedSecret(user.id, 'CALCOM_API_KEY')
    if (!apiKey) {
      return NextResponse.json({
        connected: false,
        message: 'Add your CALCOM_API_KEY in Settings → Secrets. Get it from cal.com/settings/developer/api-keys.',
      })
    }

    if (body.action === 'get_link') {
      try {
        const res = await fetch('https://api.cal.com/v1/event-types?apiKey=' + apiKey)
        const data = await res.json() as { event_types: Array<{ id: number; title: string; slug: string; length: number }> }
        const eventTypes = (data.event_types ?? []).map(e => ({
          name: e.title,
          slug: e.slug,
          url: `https://cal.com/${e.slug}`,
          duration: e.length,
        }))

        const selected = body.event_type_slug
          ? eventTypes.find(e => e.slug === body.event_type_slug)
          : eventTypes[0]

        let bookingUrl = selected?.url ?? eventTypes[0]?.url ?? ''
        if (body.lead_email && bookingUrl) {
          bookingUrl += `?email=${encodeURIComponent(body.lead_email)}`
        }

        return NextResponse.json({ connected: true, booking_url: bookingUrl, event_types: eventTypes })
      } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ error: 'Unknown action or provider' }, { status: 400 })
}
