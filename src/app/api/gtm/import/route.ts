import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
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

  if (action === 'csv') {
    // Own-data import: no credit charge. Client parses the file and sends
    // batches of already-mapped rows; this branch validates, dedupes, upserts.
    const { rows, listName, listId } = body
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: 'No rows' }, { status: 400 })
    if (rows.length > 500) return NextResponse.json({ error: 'Max 500 rows per batch' }, { status: 400 })

    let list: { id: string } | null = null
    if (listId) {
      const { data } = await supabase.from('gtm_lead_lists').select('id').eq('user_id', user.id).eq('id', listId).single()
      list = data
    }
    if (!list) {
      const name = (typeof listName === 'string' && listName.trim()) ? listName.trim().slice(0, 120) : 'CSV import'
      const { data: existing } = await supabase.from('gtm_lead_lists').select('id').eq('user_id', user.id).eq('name', name).limit(1).maybeSingle()
      list = existing
      if (!list) {
        const { data: created, error: listErr } = await supabase.from('gtm_lead_lists').insert({ user_id: user.id, name }).select('id').single()
        if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })
        list = created
      }
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const seen = new Set<string>()
    let invalid = 0
    const clean = []
    for (const r of rows) {
      const email = String(r.email || '').trim().toLowerCase()
      if (!emailRe.test(email) || seen.has(email)) { invalid++; continue }
      seen.add(email)
      clean.push({
        user_id: user.id,
        list_id: list!.id,
        first_name: String(r.first_name || '').trim().slice(0, 120),
        last_name: String(r.last_name || '').trim().slice(0, 120),
        email,
        phone: String(r.phone || '').trim().slice(0, 40) || null,
        title: String(r.title || '').trim().slice(0, 200) || null,
        company_name: String(r.company_name || '').trim().slice(0, 200) || null,
        company_domain: String(r.company_domain || '').trim().slice(0, 200) || null,
        company_location: String(r.company_location || '').trim().slice(0, 200) || null,
        linkedin_url: String(r.linkedin_url || '').trim().slice(0, 300) || null,
        email_verified: r.email_verified === true || String(r.email_verified || '').toLowerCase() === 'true',
        status: 'new',
        source: 'csv',
      })
    }
    if (clean.length === 0) return NextResponse.json({ imported: 0, duplicates: 0, invalid, list_id: list!.id })

    // ignoreDuplicates + select returns only the rows actually inserted
    const { data: inserted, error: upErr } = await supabase
      .from('gtm_leads')
      .upsert(clean, { onConflict: 'user_id,email', ignoreDuplicates: true })
      .select('id')
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const importedCount = inserted?.length || 0
    if (importedCount > 0) {
      const { data: lc } = await supabase.from('gtm_lead_lists').select('lead_count').eq('id', list!.id).single()
      await supabase.from('gtm_lead_lists').update({ lead_count: (lc?.lead_count || 0) + importedCount }).eq('id', list!.id)
    }

    return NextResponse.json({ imported: importedCount, duplicates: clean.length - importedCount, invalid, list_id: list!.id })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
