import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLAN_BY_PRODUCT: Record<string, string> = {
  [process.env.DODO_PRODUCT_STARTER || '']: 'starter',
  [process.env.DODO_PRODUCT_PRO || '']: 'pro',
  [process.env.DODO_PRODUCT_TEAMS || '']: 'teams',
};

const CREDITS_BY_PLAN: Record<string, number> = {
  starter: 400,
  pro: 1200,
  teams: 3000,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    const signature = req.headers.get('webhook-signature') || req.headers.get('x-dodo-signature');

    if (webhookSecret && signature) {
      const { createHmac } = await import('crypto');
      const expected = createHmac('sha256', webhookSecret).update(body).digest('hex');
      if (!signature.includes(expected)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const supabase = await createClient();

    if (event.type === 'payment.succeeded' || event.type === 'subscription.active') {
      const userId = event.data?.metadata?.user_id || event.metadata?.user_id;
      const productId = event.data?.product_cart?.[0]?.product_id || event.product_id || '';
      const plan = PLAN_BY_PRODUCT[productId] || 'pro';

      if (userId) {
        await supabase.from('profiles').update({
          plan,
          credits: CREDITS_BY_PLAN[plan] || 400,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      }
    }

    if (event.type === 'subscription.cancelled' || event.type === 'payment.failed') {
      const userId = event.data?.metadata?.user_id || event.metadata?.user_id;
      if (userId) {
        await supabase.from('profiles').update({
          plan: 'free',
          credits: 50,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Dodo webhook error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}