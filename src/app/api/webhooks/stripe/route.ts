import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendUpgradeConfirmEmail, sendCreditLowEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' });

const PLAN_CREDITS: Record<string, { plan: string; credits: number }> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY!]:   { plan: 'Pro',   credits: 400 },
  [process.env.STRIPE_PRICE_TEAMS_MONTHLY!]: { plan: 'Teams', credits: 1500 },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const priceId = session.metadata?.priceId;
    if (!userId || !priceId) return NextResponse.json({ ok: true });

    const config = PLAN_CREDITS[priceId];
    if (config) {
      await supabase.from('profiles').update({
        plan: config.plan.toLowerCase(),
        credits: config.credits,
        stripe_customer_id: session.customer as string,
      }).eq('id', userId);

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        plan: config.plan.toLowerCase(),
        status: 'active',
      });

      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: config.credits,
        reason: 'subscription',
        balance_after: config.credits,
      });

      // Send upgrade confirmation email
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
      if (profile?.email) {
        sendUpgradeConfirmEmail(profile.email, config.plan, config.credits).catch(() => {});
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.id);
    const { data: profile } = await supabase.from('profiles').select('id,email').eq('stripe_customer_id', sub.customer as string).single();
    if (profile) {
      await supabase.from('profiles').update({ plan: 'free', credits: 50 }).eq('id', profile.id);
    }
  }

  // Low credit warning (triggered by cron or credit deduction — hook here)
  if (event.type === 'invoice.payment_succeeded') {
    // Could trigger credit refresh here on renewal
  }

  return NextResponse.json({ ok: true });
}
