import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DODO_API = 'https://api.dodopayments.com';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, planName } = await req.json();
    const DODO_KEY = process.env.DODO_API_KEY;
    if (!DODO_KEY) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });

    const origin = req.headers.get('origin') || 'https://wyberai.com';

    const res = await fetch(`${DODO_API}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DODO_KEY}` },
      body: JSON.stringify({
        billing: { city: '', country: 'IN', state: '', street: '', zipcode: '' },
        customer: { email: user.email, name: user.email?.split('@')[0] || 'Customer' },
        payment_link: true,
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: `${origin}/dashboard?upgraded=1`,
        metadata: { user_id: user.id, plan: planName },
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Payment failed to initialize' }, { status: 500 });

    const paymentUrl = data.payment_link || data.url || data.checkout_url;
    return NextResponse.json({ url: paymentUrl, paymentId: data.payment_id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}