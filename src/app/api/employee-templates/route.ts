import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const department = searchParams.get('department')
  const slug = searchParams.get('slug')

  const db = createServiceClient()
  let q = db.from('employee_templates').select('*').order('department').order('name')

  if (department) q = q.eq('department', department)
  if (slug) q = q.eq('slug', slug)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}
