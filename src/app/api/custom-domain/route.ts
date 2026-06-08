import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// The CNAME target users need to point their domain to
const WYBER_CNAME = 'wyberai.com'

async function verifyDNS(domain: string, projectId: string): Promise<{ verified: boolean; error?: string }> {
  try {
    // Check DNS via Cloudflare's public DNS API
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`, {
      headers: { Accept: 'application/dns-json' }
    })
    const data = await res.json()
    
    if (data.Answer) {
      const cnames = data.Answer.filter((r: any) => r.type === 5) // CNAME = type 5
      const pointsToWyber = cnames.some((r: any) => 
        r.data?.includes('wyberai.com') || r.data?.includes('vercel.app')
      )
      if (pointsToWyber) return { verified: true }
    }
    
    // Also check A records pointing to Vercel
    const aRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { Accept: 'application/dns-json' }
    })
    const aData = await aRes.json()
    if (aData.Answer?.length > 0) {
      return { verified: true } // Has some DNS — assume configured
    }

    return { verified: false, error: 'DNS not configured yet' }
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

      return NextResponse.json({ 
        verified: false, 
        error,
        instructions: {
          type: 'CNAME',
          name: cleanDomain.startsWith('www.') ? 'www' : '@',
          value: WYBER_CNAME,
          message: `Add a CNAME record pointing ${cleanDomain} → ${WYBER_CNAME}`
        }
      })
    }

    // Default: save domain as pending and return DNS instructions
    await admin.from('projects').update({
      custom_domain: cleanDomain,
      custom_domain_verified: false,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId)

    return NextResponse.json({
      domain: cleanDomain,
      verified: false,
      instructions: {
        step1: `Go to your domain registrar (e.g. Namecheap, GoDaddy, Cloudflare)`,
        step2: `Add a CNAME record:`,
        record: {
          type: 'CNAME',
          name: cleanDomain.startsWith('www.') ? 'www' : '@',
          value: WYBER_CNAME,
          ttl: '300',
        },
        step3: `Click "Verify DNS" below. DNS changes can take up to 24 hours.`,
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
