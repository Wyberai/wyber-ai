import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'search') {
    // Get Apollo key
    const { data: keyRow } = await supabase
      .from('user_api_keys')
      .select('key_value')
      .eq('user_id', user.id)
      .eq('key_name', 'apollo_api_key')
      .single()

    if (!keyRow?.key_value) return NextResponse.json({ error: 'Apollo not connected', people: [], total: 0 })

    const searchBody: any = { per_page: 25, page: 1 }
    if (body.titles) searchBody.person_titles = body.titles.split(',').map((s: string) => s.trim()).filter(Boolean)
    if (body.industries) searchBody.organization_industry_tag_values = body.industries.split(',').map((s: string) => s.trim()).filter(Boolean)
    if (body.locations) searchBody.person_locations = body.locations.split(',').map((s: string) => s.trim()).filter(Boolean)

    try {
      const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': keyRow.key_value },
        body: JSON.stringify(searchBody),
      })
      const data = await res.json()
      return NextResponse.json({
        people: data.people || [],
        total: data.pagination?.total_entries || 0,
      })
    } catch {
      return NextResponse.json({ people: [], total: 0 })
    }
  }

  if (action === 'import') {
    const { people } = body
    if (!Array.isArray(people) || people.length === 0) return NextResponse.json({ error: 'No people' }, { status: 400 })

    // Deduct credits: 2 per contact
    const creditCost = people.length * 2
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if ((profile?.credits || 0) < creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Get default lead list
    let { data: leadList } = await supabase
      .from('gtm_lead_lists')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!leadList) {
      const { data: newList } = await supabase
        .from('gtm_lead_lists')
        .insert({ user_id: user.id, name: 'Default list' })
        .select('id')
        .single()
      leadList = newList
    }

    const rows = people.map((p: any) => ({
      user_id: user.id,
      list_id: leadList?.id,
      first_name: p.first_name || p.name?.split(' ')[0] || '',
      last_name: p.last_name || p.name?.split(' ').slice(1).join(' ') || '',
      email: p.email,
      title: p.title,
      company_name: p.organization?.name || p.company_name,
      linkedin_url: p.linkedin_url,
      status: 'new',
      source: 'apollo',
    }))

    await supabase.from('gtm_leads').upsert(rows, { onConflict: 'user_id,email', ignoreDuplicates: true })

    // Deduct credits
    await supabase
      .from('profiles')
      .update({ credits: (profile?.credits || 0) - creditCost })
      .eq('id', user.id)

    return NextResponse.json({ imported: rows.length, credits_used: creditCost })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
