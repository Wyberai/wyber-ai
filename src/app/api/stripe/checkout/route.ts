import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { priceId, mode = 'subscription' } = await req.json();
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });

    const origin = req.headers.get('origin') || 'https://wyberai.com';
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        mode,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'customer_email': user.email!,
        'metadata[user_id]': user.id,
        success_url: `${origin}/dashboard?upgraded=1`,
        cancel_url: `${origin}/pricing`,
        'allow_promotion_codes': 'true',
      }),
    });

    const session = await res.json();
    if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}