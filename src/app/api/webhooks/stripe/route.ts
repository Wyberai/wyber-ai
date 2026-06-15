import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendUpgradeConfirmEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('REPLACE_ME')) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const PLAN_CREDITS: Record<string, { plan: string; credits: number; dailyCredits: number }> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY ?? '']: { plan: 'pro', credits: 250, dailyCredits: 10 },
    [process.env.STRIPE_PRICE_TEAMS_MONTHLY ?? '']: { plan: 'business', credits: 500, dailyCredits: 20 },
  };

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const priceId = session.metadata?.priceId;
    if (!userId || !priceId) return NextResponse.json({ ok: true });

    const config = PLAN_CREDITS[priceId];
    if (config) {
      await supabase.from('profiles').update({
        plan: config.plan,
        credits: config.credits,
        daily_credits: config.dailyCredits,
        stripe_customer_id: session.customer,
      }).eq('id', userId);

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        plan: config.plan,
        status: 'active',
      });

      const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
      if (profile?.email) {
        sendUpgradeConfirmEmail(profile.email, config.plan, config.credits).catch(() => {});
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as any;
    await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.id);
    const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', sub.customer).single();
    if (profile) {
      await supabase.from('profiles').update({ plan: 'free', credits: 50 }).eq('id', profile.id);
    }
  }

  return NextResponse.json({ ok: true });
}