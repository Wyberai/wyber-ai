import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getRoleBySlug } from '@/lib/employee-roles'
import { computeDynamicPrice, formatPrice } from '@/lib/ai-employees/pricing'

// GET /api/ai-employees/pricing?role=marketing-manager
// Public: returns the current demand-based monthly price for a role.
export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('role') ?? ''
  const role = getRoleBySlug(slug)
  if (!role) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })

  const db = createServiceClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Demand signals: active hires of this role (all customers) + recent momentum.
  const [{ count: activeHires }, { count: recentHires }] = await Promise.all([
    db.from('ai_employees').select('id', { count: 'exact', head: true })
      .ilike('role', role.title).eq('is_active', true),
    db.from('ai_employees').select('id', { count: 'exact', head: true })
      .ilike('role', role.title).gte('created_at', since),
  ])

  const price = computeDynamicPrice(slug, {
    activeHires: activeHires ?? 0,
    recentHires: recentHires ?? 0,
  })

  return NextResponse.json({
    role: role.title,
    priceCents: price.priceCents,
    priceLabel: `${formatPrice(price.priceCents)}/mo`,
    basePriceCents: price.basePriceCents,
    surgePct: price.surgePct,
    label: price.label,
    hot: price.hot,
    activeHires: activeHires ?? 0,
  })
}
