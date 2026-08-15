import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Website visitor de-anonymization
// Embeds a tracking pixel/script on user's site, resolves IP → company via Clearbit Reveal or similar
// For now: manual CSV upload of visitor logs + AI enrichment, with Clearbit integration when key is present

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    action: 'get_script' | 'identify' | 'list_visitors' | 'import_logs'
    domain?: string
    ip_addresses?: string[]
    visitor_logs?: Array<{ ip: string; page: string; timestamp: string; referrer?: string }>
  }

  const db = createServiceClient()

  if (body.action === 'get_script') {
    const trackingId = `wyb_${user.id.slice(0, 8)}`
    const script = `<!-- WyberAI Visitor Tracking -->
<script>
(function(){var w=window,d=document,t='${trackingId}';
var s=d.createElement('script');s.async=true;
s.src='https://wyberai.com/api/gtm/pixel?tid='+t;
d.head.appendChild(s);
w.__wyb_tid=t;
})();
</script>`
    return NextResponse.json({ script, tracking_id: trackingId })
  }

  if (body.action === 'identify' && body.ip_addresses?.length) {
    const clearbitKey = process.env.CLEARBIT_API_KEY
    if (!clearbitKey) {
      return NextResponse.json({
        results: body.ip_addresses.map(ip => ({ ip, company: null, note: 'Add CLEARBIT_API_KEY to enable IP → company resolution' })),
        message: 'Clearbit Reveal not configured. Add CLEARBIT_API_KEY to your environment for IP-to-company resolution.',
      })
    }

    const results: Array<{ ip: string; company: string | null; domain: string | null; employees: number | null }> = []
    for (const ip of body.ip_addresses.slice(0, 25)) {
      try {
        const res = await fetch(`https://reveal.clearbit.com/v1/companies/find?ip=${ip}`, {
          headers: { Authorization: `Bearer ${clearbitKey}` },
        })
        if (res.ok) {
          const data = await res.json() as { company?: { name: string; domain: string; metrics?: { employees: number } } }
          results.push({
            ip,
            company: data.company?.name ?? null,
            domain: data.company?.domain ?? null,
            employees: data.company?.metrics?.employees ?? null,
          })

          if (data.company?.name) {
            await db.from('gtm_visitors').upsert({
              user_id: user.id,
              ip_address: ip,
              company_name: data.company.name,
              company_domain: data.company.domain,
              employee_count: data.company.metrics?.employees,
              identified_at: new Date().toISOString(),
            }, { onConflict: 'user_id,ip_address' }).then(() => {}, () => {})
          }
        } else {
          results.push({ ip, company: null, domain: null, employees: null })
        }
      } catch {
        results.push({ ip, company: null, domain: null, employees: null })
      }
    }

    const identified = results.filter(r => r.company)
    return NextResponse.json({ results, identified_count: identified.length, total: results.length })
  }

  if (body.action === 'import_logs' && body.visitor_logs?.length) {
    const inserted = []
    for (const log of body.visitor_logs.slice(0, 100)) {
      const { error } = await db.from('gtm_visitors').upsert({
        user_id: user.id,
        ip_address: log.ip,
        page_url: log.page,
        referrer: log.referrer ?? null,
        visited_at: log.timestamp,
      }, { onConflict: 'user_id,ip_address' })
      if (!error) inserted.push(log.ip)
    }
    return NextResponse.json({ imported: inserted.length })
  }

  if (body.action === 'list_visitors') {
    const { data } = await db.from('gtm_visitors')
      .select('*')
      .eq('user_id', user.id)
      .order('visited_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ visitors: data ?? [] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
