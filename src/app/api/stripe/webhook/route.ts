import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro']: 'pro',
  [process.env.STRIPE_PRICE_TEAMS_MONTHLY || 'price_teams']: 'teams',
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  let event: Stripe.Event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sig = req.headers.get('stripe-signature');
    if (!sig) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 401 });
    }
  } else {
    try { event = JSON.parse(body); }
    catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }); }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const priceId = session.line_items?.data?.[0]?.price?.id || '';
    const plan = PLAN_MAP[priceId] || 'pro';
    if (userId) {
      const supabase = await createClient();
      await supabase.from('profiles').update({ plan, stripe_customer_id: session.customer, updated_at: new Date().toISOString() }).eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const supabase = await createClient();
    await supabase.from('profiles').update({ plan: 'free', updated_at: new Date().toISOString() }).eq('stripe_customer_id', sub.customer);
  }

  return NextResponse.json({ received: true });
}