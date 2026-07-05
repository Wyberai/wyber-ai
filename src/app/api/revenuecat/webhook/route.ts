import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// RevenueCat webhook → grant credits for a mobile IAP. Mirrors the Stripe
// webhook's model (see webhooks/stripe): map the purchased product to a plan
// and SET the plan's credit allotment. Set-based (not incremented) so resent
// events are naturally idempotent — no processed-events table needed.

// Product identifier → plan grant. Product IDs come from App Store Connect /
// Play Console once created; wire them via env. Allotments match Stripe so web
// and mobile stay consistent.
function planForProduct(productId: string):
  | { plan: string; credits: number; dailyCredits: number }
  | null {
  const MAP: Record<string, { plan: string; credits: number; dailyCredits: number }> = {
    [process.env.REVENUECAT_PRODUCT_PRO_MONTHLY ?? '']: { plan: 'pro', credits: 250, dailyCredits: 10 },
    [process.env.REVENUECAT_PRODUCT_PRO_YEARLY ?? '']: { plan: 'pro', credits: 250, dailyCredits: 10 },
    [process.env.REVENUECAT_PRODUCT_TEAMS_MONTHLY ?? '']: { plan: 'business', credits: 500, dailyCredits: 20 },
  };
  return MAP[productId] ?? null;
}

// Entitlement is active now → (re)grant. Access ended → revert to free.
const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
]);
const REVOKE_EVENTS = new Set(['EXPIRATION']);

export async function POST(req: NextRequest) {
  // RevenueCat sends the exact Authorization header value configured in the
  // dashboard — a shared secret. Reject anything that doesn't match.
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  if ((req.headers.get('authorization') ?? '') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as { event?: any } | null;
  const event = payload?.event;
  if (!event?.type) return NextResponse.json({ ok: true });

  // The mobile SDK is configured with the Supabase user id as app_user_id, so
  // this maps 1:1 to profiles.id. Skip anonymous ids (pre-login purchases).
  const userId: string | undefined = event.app_user_id;
  if (!userId || String(userId).startsWith('$RCAnonymousID')) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createAdminClient();

  if (GRANT_EVENTS.has(event.type)) {
    const config = planForProduct(event.product_id ?? '');
    if (!config) {
      console.warn('[revenuecat] unmapped product', event.product_id, 'for', userId);
      return NextResponse.json({ ok: true });
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        plan: config.plan,
        credits: config.credits,
        daily_credits: config.dailyCredits,
        subscription_status: config.plan,
      })
      .eq('id', userId);
    if (error) {
      console.error('[revenuecat] grant failed', error);
      return NextResponse.json({ error: 'grant failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, granted: config.plan });
  }

  if (REVOKE_EVENTS.has(event.type)) {
    await supabase
      .from('profiles')
      .update({ plan: 'free', credits: 50, subscription_status: 'free' })
      .eq('id', userId);
    return NextResponse.json({ ok: true, revoked: true });
  }

  // Other event types (CANCELLATION while still active, BILLING_ISSUE, etc.)
  // need no ledger change here.
  return NextResponse.json({ ok: true });
}
