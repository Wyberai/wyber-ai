# Wyber AI — Setup Guide

## Step 1: Install
```bash
npm install
```

## Step 2: Supabase (10 min)
1. Go to supabase.com → New project
2. Project Settings → API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to SQL Editor → paste entire contents of `supabase/schema.sql` → Run
4. Authentication → Providers → enable Google + GitHub OAuth

## Step 3: E2B (2 min)
1. Go to e2b.dev → sign up
2. Dashboard → API Keys → copy key → `E2B_API_KEY`

## Step 4: Anthropic (2 min)
1. console.anthropic.com → API Keys → create key → `ANTHROPIC_API_KEY`

## Step 5: Stripe (15 min)
1. dashboard.stripe.com → Developers → API Keys
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
2. Products → Create two products:
   - "Wyber AI Pro" $15/month → copy Price ID → `STRIPE_PRICE_PRO_MONTHLY`
   - "Wyber AI Teams" $25/month → copy Price ID → `STRIPE_PRICE_TEAMS_MONTHLY`
3. Webhooks → Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Step 6: Fill .env.local
All placeholders in `.env.local` — replace every `REPLACE_ME` with real values.

## Step 7: Run
```bash
npm run dev   # http://localhost:3000
```

## Step 8: Deploy to Vercel
```bash
npx vercel --prod
# Add all env vars in Vercel dashboard → Settings → Environment Variables
```

## What's live at each URL
- `/` → Landing page (wyberai.com)
- `/login` → Auth (magic link + Google + GitHub)
- `/dashboard` → User's project list
- `/project/[id]` → Full IDE (Monaco + Chat + Preview)
- `/pricing` → Pricing + Stripe checkout

## The IP moat — what makes Wyber AI defensible
1. Multi-framework (React/Vue/Vanilla/Next) — Lovable is React only
2. Full credit transparency — shown per generation, Lovable hides this
3. System prompt is yours to tune — stored in `src/app/api/generate/route.ts`
4. The credit model (50 free vs Lovable's 30) is a marketing advantage
5. Everything is your code — fork it, white-label it, sell it as a service
