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
  // The empty-string key (an env var that isn't set) must never match a real,
  // possibly-empty productId — guard it.
  if (!productId) return null;
  return MAP[productId] ?? null;
}

// Consumable credit packs (one-time purchases) → credits to ADD. Mirrors the
// web Dodo top-ups (200/600/2000). Product IDs are the Play Console managed-
// product ids, wired via env. Unlike subscription grants (which SET the
// balance and are naturally idempotent), a pack INCREMENTS credits — so it
// needs explicit dedupe (see processed_webhooks below).
function topupForProduct(productId: string): number | null {
  if (!productId) return null;
  const MAP: Record<string, number> = {
    [process.env.REVENUECAT_TOPUP_200 ?? '']: 200,
    [process.env.REVENUECAT_TOPUP_600 ?? '']: 600,
    [process.env.REVENUECAT_TOPUP_2000 ?? '']: 2000,
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
    // ── Consumable credit packs (incremental) — check FIRST ──────────────────
    // These ADD credits, so a resent event would double-credit. Claim the event
    // id in processed_webhooks (PK conflict = already handled), then adjust_credits
    // atomically. On any failure, release the claim + 500 so RevenueCat retries.
    const packCredits = topupForProduct(event.product_id ?? '');
    if (packCredits) {
      const eventId = String(event.id ?? event.transaction_id ?? '');
      if (!eventId) return NextResponse.json({ ok: true }); // can't dedupe → skip rather than risk double-credit
      const { error: dupeErr } = await supabase
        .from('processed_webhooks')
        .insert({ id: eventId, source: 'revenuecat' });
      if (dupeErr?.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      try {
        // Atomic add, with a read-then-write fallback (mirrors the Dodo top-up).
        let newBalance: number | null = null;
        const { data: adjusted, error: adjErr } = await supabase.rpc('adjust_credits', {
          p_user_id: userId,
          p_delta: packCredits,
        });
        if (!adjErr && typeof adjusted === 'number') newBalance = adjusted;
        if (newBalance === null) {
          const { data: prof } = await supabase.from('profiles').select('credits').eq('id', userId).maybeSingle();
          const before = Number((prof as { credits?: number } | null)?.credits ?? 0);
          newBalance = before + packCredits;
          const { error: updErr } = await supabase
            .from('profiles')
            .update({ credits: newBalance, updated_at: new Date().toISOString() })
            .eq('id', userId);
          if (updErr) throw updErr;
        }
        // Positive-grant audit row (best-effort; consistent with credit_usage shape).
        try {
          await supabase.from('credit_usage').insert({
            user_id: userId,
            amount: packCredits,
            reason: `topup:play:${eventId}`,
            credits_before: newBalance - packCredits,
            credits_after: newBalance,
          });
        } catch {
          /* audit is best-effort — never fail the grant on a log write */
        }
        return NextResponse.json({ ok: true, credited: packCredits, balance: newBalance });
      } catch (e) {
        // Release the idempotency claim so the retry re-runs the grant.
        try {
          await supabase.from('processed_webhooks').delete().eq('id', eventId);
        } catch {
          /* claim release is best-effort */
        }
        console.error('[revenuecat] top-up grant failed', e);
        return NextResponse.json({ error: 'grant failed — retry' }, { status: 500 });
      }
    }

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
