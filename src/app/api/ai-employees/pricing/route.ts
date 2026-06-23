import { NextRequest, NextResponse } from 'next/server'
import { getRoleBySlug } from '@/lib/employee-roles'
import { getRolePrice } from '@/lib/ai-employees/pricing'

// GET /api/ai-employees/pricing?role=marketing-manager
// Public: returns the fixed monthly price for a role.
export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('role') ?? ''
  const role = getRoleBySlug(slug)
  if (!role) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })

  const price = getRolePrice(slug)
  return NextResponse.json({
    role: role.title,
    priceCents: price.priceCents,
    priceLabel: price.priceLabel,
  })
}
