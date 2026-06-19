import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { profile } = await req.json()

  // Check for Apollo key
  const { data: keyRow } = await supabase
    .from('user_api_keys')
    .select('key_value')
    .eq('user_id', user.id)
    .eq('key_name', 'apollo_api_key')
    .single()

  const apolloKey = keyRow?.key_value

  if (!apolloKey) {
    // Return estimated figures based on ICP
    return NextResponse.json({
      no_key: true,
      companies: estimateCompanies(profile),
      contacts: estimateContacts(profile),
      breakdown: buildBreakdown(profile),
      top_companies: [],
    })
  }

  // Live Apollo count query
  try {
    const body: any = {
      per_page: 1,
      page: 1,
    }
    if (profile.icp_company_sizes?.length) body.organization_num_employees_ranges = profile.icp_company_sizes.map(sizeToRange)
    if (profile.icp_industries?.length) body.organization_industry_tag_values = profile.icp_industries
    if (profile.icp_geographies?.length) body.person_locations = profile.icp_geographies
    if (profile.icp_seniorities?.length) body.person_titles = profile.icp_seniorities

    const [orgRes, peopleRes] = await Promise.all([
      fetch('https://api.apollo.io/v1/mixed_companies/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
        body: JSON.stringify(body),
      }),
      fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
        body: JSON.stringify(body),
      }),
    ])

    const orgData = await orgRes.json()
    const peopleData = await peopleRes.json()

    return NextResponse.json({
      no_key: false,
      companies: orgData.pagination?.total_entries || 0,
      contacts: peopleData.pagination?.total_entries || 0,
      breakdown: buildBreakdown(profile),
      top_companies: (orgData.organizations || []).slice(0, 12).map((o: any) => ({
        name: o.name,
        industry: o.industry,
        size: o.employee_count ? `${o.employee_count} emp` : '',
        domain: o.primary_domain,
      })),
    })
  } catch (e) {
    return NextResponse.json({ no_key: false, companies: 0, contacts: 0, breakdown: buildBreakdown(profile), top_companies: [] })
  }
}

function sizeToRange(size: string) {
  const map: Record<string, string> = {
    '1–10': '1,10', '11–50': '11,50', '51–200': '51,200',
    '201–500': '201,500', '500–1000': '500,1000', '1000+': '1000,10000',
  }
  return map[size] || size
}

function estimateCompanies(profile: any) {
  let base = 50000
  if (profile.icp_geographies?.includes('United States')) base *= 0.4
  else if (profile.icp_geographies?.length) base *= 0.3
  if (profile.icp_company_sizes?.length < 3) base *= 0.5
  if (profile.icp_industries?.length) base *= Math.min(profile.icp_industries.length * 0.15, 0.6)
  return Math.round(base)
}

function estimateContacts(profile: any) {
  return Math.round(estimateCompanies(profile) * (profile.icp_seniorities?.length > 2 ? 4 : 2))
}

function buildBreakdown(profile: any) {
  const breakdown: any = {}
  if (profile.icp_geographies?.length) {
    const total = estimateCompanies(profile)
    breakdown['By geography'] = profile.icp_geographies.map((g: string, i: number) => ({
      label: g,
      count: Math.round(total / profile.icp_geographies.length * (1 - i * 0.05)),
      pct: Math.round(100 / profile.icp_geographies.length * (1 - i * 0.05)),
    }))
  }
  if (profile.icp_company_sizes?.length) {
    const total = estimateCompanies(profile)
    breakdown['By company size'] = profile.icp_company_sizes.map((sz: string, i: number) => ({
      label: sz,
      count: Math.round(total / profile.icp_company_sizes.length),
      pct: Math.round(100 / profile.icp_company_sizes.length),
    }))
  }
  return breakdown
}
