import { NextResponse } from 'next/server'

// Retired. Domains used to be bought through the Vercel registrar from here. WyberAi now sells domains itself:
// search, price, buy, connect and renew all happen at /dashboard/domains (src/app/api/domains/*). Kept as a plain answer
// so an old client gets a clear message instead of a way to buy from the old supplier.
const gone = () => NextResponse.json({ error: 'Domains are now bought inside WyberAi at /dashboard/domains.' }, { status: 410 })
export const GET = gone
export const POST = gone
