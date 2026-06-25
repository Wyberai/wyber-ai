import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail, sendAdminSignupAlert } from '@/lib/email';

// Supabase sends this webhook on auth.users INSERT
// Set up at: Supabase → Database → Webhooks → on auth.users INSERT
// URL: https://wyberai.com/api/webhooks/supabase
// Secret: add SUPABASE_WEBHOOK_SECRET to env

export async function POST(req: NextRequest) {
  // Verify secret header
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { type, record } = body;

  if (type === 'INSERT' && record?.email) {
    const provider = record.raw_app_meta_data?.provider as string | undefined;
    try {
      await sendWelcomeEmail(record.email, record.raw_user_meta_data?.full_name);
    } catch (err) {
      console.error('Welcome email failed:', err);
      // Don't throw — email failure shouldn't break signup
    }
    // Notify the owner of every new signup
    sendAdminSignupAlert(record.email, provider).catch(err => console.error('Signup alert failed:', err));
  }

  return NextResponse.json({ ok: true });
}
