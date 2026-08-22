import { NextRequest, NextResponse } from 'next/server';
import { sendAdminDentistLeadAlert } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email || '').trim().slice(0, 200);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await sendAdminDentistLeadAlert(email, 'dentist-ops-dashboard');
  } catch (err) {
    console.error('[dentist-ops-lead]', err);
  }

  return NextResponse.json({ ok: true });
}
