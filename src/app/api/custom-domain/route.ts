import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { detectProvider, type DnsProvider } from '@/lib/dns-provider'

// dashboardUrl is a function — resolve it to a plain string before returning
// from an API route, since NextResponse.json() silently drops function props.
function serializeProvider(provider: DnsProvider | null, domain: string) {
  return provider ? { name: provider.name, dashboardUrl: provider.dashboardUrl(domain) } : null
}

// Where users point their domain. Apex (root) domains cannot use a CNAME —
// they must use an A record to Vercel's anycast IP. Subdomains (e.g. www) use a CNAME.
const VERCEL_A_IP = '76.76.21.21'
const VERCEL_CNAME = 'cname.vercel-dns.com'
// Accepted CNAME targets (back-compat with older "point at wyberai.com" guidance)
const ACCEPTED_CNAME = ['cname.vercel-dns.com', 'vercel-dns.com', 'wyberai.com', 'vercel.app']

const isApex = (domain: string) => domain.replace(/\.$/, '').split('.').length <= 2

// Returns the correct DNS record a given domain should add.
function recordFor(domain: string) {
  return isApex(domain)
    ? { type: 'A', name: '@', value: VERCEL_A_IP, ttl: '300' as string }
    : { type: 'CNAME', name: domain.split('.')[0], value: VERCEL_CNAME, ttl: '300' as string }
}

async function verifyDNS(domain: string, _projectId: string): Promise<{ verified: boolean; error?: string }> {
  try {
    // 1. CNAME pointing at Vercel / WyberAI (used for subdomains like www)
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`, {
      headers: { Accept: 'application/dns-json' }
    })
    const data = await res.json()
    if (data.Answer) {
      const cnames = data.Answer.filter((r: any) => r.type === 5) // CNAME = type 5
      if (cnames.some((r: any) => ACCEPTED_CNAME.some(t => r.data?.includes(t)))) {
        return { verified: true }
      }
    }

    // 2. A record pointing specifically at Vercel's IP (used for apex domains).
    //    We must NOT accept *any* A record — a registrar parking IP would falsely verify.
    const aRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { Accept: 'application/dns-json' }
    })
    const aData = await aRes.json()
    const aRecords = (aData.Answer ?? []).filter((r: any) => r.type === 1) // A = type 1
    if (aRecords.some((r: any) => r.data === VERCEL_A_IP)) {
      return { verified: true }
    }
    if (aRecords.length > 0) {
      return { verified: false, error: `Domain points to ${aRecords[0].data}, not Vercel (${VERCEL_A_IP}). Update your A record.` }
    }

    return { verified: false, error: 'DNS not configured yet — add the record below, then verify again (can take up to 24h to propagate).' }
  } catch {
    return { verified: false, error: 'Could not verify DNS' }
  }
}

// POST /api/custom-domain — add or verify custom domain
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, domain, action } = await req.json()

    if (!projectId || !domain) {
      return NextResponse.json({ error: 'projectId and domain required' }, { status: 400 })
    }

    // Clean the domain
    const cleanDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()

    const admin = await createAdminClient()

    // Verify project belongs to user
    const { data: project } = await admin
      .from('projects')
      .select('id, name, subdomain, is_public')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    if (action === 'verify') {
      // Check if DNS is configured
      const { verified, error } = await verifyDNS(cleanDomain, projectId)
      
      if (verified) {
        // Register domain with Vercel so it routes correctly
        const VERCEL_TOKEN = process.env.VERCEL_TOKEN
        const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID
        const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_pTqy3kMHCQ6CTOrkbCXVuCETb0bZ'
        
        if (VERCEL_TOKEN) {
          try {
            // Add domain to Vercel project
            await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cleanDomain }),
            })
          } catch (e) {
            console.warn('Vercel domain registration failed (non-critical):', e)
          }
        }

        // Save the custom domain
        await admin.from('projects').update({
          custom_domain: cleanDomain,
          custom_domain_verified: true,
          updated_at: new Date().toISOString(),
        }).eq('id', projectId)

        return NextResponse.json({ 
          verified: true, 
          domain: cleanDomain,
          message: 'Domain verified and connected!' 
        })
      }

      const rec = recordFor(cleanDomain)
      const provider = await detectProvider(cleanDomain)
      return NextResponse.json({
        verified: false,
        error,
        provider: serializeProvider(provider, cleanDomain),
        instructions: {
          ...rec,
          message: `Add ${rec.type === 'A' ? 'an' : 'a'} ${rec.type} record: ${rec.name} → ${rec.value}. If your domain uses email (e.g. Zoho/Google), leave existing MX records untouched.`
        }
      })
    }

    // Default: save domain as pending and return DNS instructions
    await admin.from('projects').update({
      custom_domain: cleanDomain,
      custom_domain_verified: false,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId)

    const rec = recordFor(cleanDomain)
    const provider = await detectProvider(cleanDomain)
    return NextResponse.json({
      domain: cleanDomain,
      verified: false,
      provider: serializeProvider(provider, cleanDomain),
      instructions: {
        step1: provider
          ? `Go to ${provider.name} — we detected this domain's nameservers point there.`
          : `Go to your DNS provider / domain registrar (e.g. Namecheap, GoDaddy, Cloudflare, Zoho).`,
        step2: rec.type === 'A'
          ? `This is a root domain, so add an A record (root domains can't use CNAME):`
          : `Add a CNAME record:`,
        record: rec,
        step3: `Leave any existing MX records (email) untouched — only add/replace the website record above.`,
        step4: `Click "Verify DNS" below. DNS changes can take up to 24 hours to propagate.`,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/custom-domain — remove custom domain
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    const admin = await createAdminClient()

    await admin.from('projects').update({
      custom_domain: null,
      custom_domain_verified: false,
    }).eq('id', projectId).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
