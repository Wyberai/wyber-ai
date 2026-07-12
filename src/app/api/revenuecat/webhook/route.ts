import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { subPlanForProduct, subGrant, FREE_ON_CANCEL } from '@/lib/plan-grants';

// RevenueCat webhook → grant credits for a mobile IAP (consumable credit packs
// AND subscription tiers). Grants mirror the Dodo webhook exactly (see
// api/dodo/webhook) so web and mobile hand out the same credits/plan/daily-drip
// for the same tier — the difference is only which store took the payment.
//
// Both paths ADD credits (never SET), so a subscribe never wipes a user's
// top-up balance. Because adds aren't idempotent on their own, every grant
// claims the event id in processed_webhooks first (a PK conflict = already
// handled → skip), matching the pack path below.

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

    // ── Subscription tiers (spark/starter/builder/pro) ───────────────────────
    // ADD the monthly allotment (mirrors Dodo) and set plan + daily drip +
    // status. INITIAL_PURCHASE, RENEWAL, etc. each carry a distinct event.id,
    // so the processed_webhooks claim both dedupes retries AND lets a genuine
    // renewal grant again. On any failure, release the claim + 500 so RevenueCat
    // retries the grant.
    const subPlan = subPlanForProduct(event.product_id ?? '');
    if (!subPlan) {
      console.warn('[revenuecat] unmapped product', event.product_id, 'for', userId);
      return NextResponse.json({ ok: true });
    }
    const grant = subGrant(subPlan);
    const subEventId = String(event.id ?? event.transaction_id ?? '');
    if (!subEventId) return NextResponse.json({ ok: true }); // can't dedupe → skip rather than risk double-credit

    const { error: subDupeErr } = await supabase
      .from('processed_webhooks')
      .insert({ id: subEventId, source: 'revenuecat' });
    if (subDupeErr?.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    try {
      // Atomic add, with a read-then-write fallback (mirrors the pack path).
      let newBalance: number | null = null;
      const { data: adjusted, error: adjErr } = await supabase.rpc('adjust_credits', {
        p_user_id: userId,
        p_delta: grant.credits,
      });
      if (!adjErr && typeof adjusted === 'number') newBalance = adjusted;

      const update: Record<string, unknown> = {
        plan: grant.plan,
        daily_credits: grant.dailyCredits,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      };
      if (newBalance === null) {
        // RPC unavailable → non-atomic fallback add in the same write.
        const { data: prof } = await supabase.from('profiles').select('credits').eq('id', userId).maybeSingle();
        const before = Number((prof as { credits?: number } | null)?.credits ?? 0);
        newBalance = before + grant.credits;
        update.credits = newBalance;
      }
      const { error: updErr } = await supabase.from('profiles').update(update).eq('id', userId);
      if (updErr) throw updErr;

      // Positive-grant audit row (best-effort; consistent with credit_usage shape).
      try {
        await supabase.from('credit_usage').insert({
          user_id: userId,
          amount: grant.credits,
          reason: `sub:play:${grant.plan}:${subEventId}`,
          credits_before: newBalance - grant.credits,
          credits_after: newBalance,
        });
      } catch {
        /* audit is best-effort — never fail the grant on a log write */
      }
      return NextResponse.json({ ok: true, granted: grant.plan, balance: newBalance });
    } catch (e) {
      // Release the idempotency claim so the retry re-runs the grant.
      try {
        await supabase.from('processed_webhooks').delete().eq('id', subEventId);
      } catch {
        /* claim release is best-effort */
      }
      console.error('[revenuecat] subscription grant failed', e);
      return NextResponse.json({ error: 'grant failed — retry' }, { status: 500 });
    }
  }

  if (REVOKE_EVENTS.has(event.type)) {
    // Subscription lapsed → drop plan + daily drip to free, but KEEP the credit
    // balance (mirrors the Dodo cancellation branch — the user paid for what's
    // left, and top-ups never expire).
    await supabase
      .from('profiles')
      .update({ ...FREE_ON_CANCEL, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return NextResponse.json({ ok: true, revoked: true });
  }

  // Other event types (CANCELLATION while still active, BILLING_ISSUE, etc.)
  // need no ledger change here.
  return NextResponse.json({ ok: true });
}
