import { NextResponse } from 'next/server'

/**
 * DISABLED — do not re-enable without metering.
 *
 * This route used to create Supabase projects inside WyberAi's OWN org
 * (SUPABASE_ORG_ID + platform management token), which put every customer
 * database on the platform owner's Supabase bill (~$10/mo compute per project
 * on a paid org) with generic names nobody could tell apart from real
 * platform infrastructure.
 *
 * The supported flow is the OAuth connect (/api/connectors/supabase/*): the
 * user links their own Supabase account and we create/link projects in THEIR
 * org — free for them on Supabase's free tier, zero cost to us, and they own
 * their data.
 *
 * If a managed "we host it for you" offering (Lovable Cloud-style) is ever
 * wanted, it must charge credits per provisioned project + monthly upkeep
 * before this is turned back on.
 */
export async function POST() {
  return NextResponse.json({
    error: 'Auto-provisioning is no longer available. Connect your own Supabase account instead — click "Connect Supabase" in the editor to link or create a project (free on Supabase\'s free tier).',
  }, { status: 410 })
}
