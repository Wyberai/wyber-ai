import { NextResponse } from 'next/server'

// Mobile app's blocking-update gate polls this on launch (see wyberai-mobile
// src/app/_layout.tsx). Bump minVersion here to force-update everyone below
// it — no app-binary deploy needed, this is a static value.
export async function GET() {
  return NextResponse.json({ minVersion: '2.4.1' })
}
