-- Marketplace: anyone vibe-coding on WyberAi can list an app they built for
-- sale at a USD price they set; the built-in prebuilt_apps catalog is seeded
-- in too (as 'studio' listings) so the marketplace isn't empty on day one.
--
-- Security model mirrors challenge_entries/domain_purchases: RLS on, no
-- client INSERT/UPDATE/DELETE policies. All writes go through /api/marketplace/*
-- and /api/admin/marketplace/* using the service_role key. Public read is
-- limited to approved listings, so pending/rejected/hidden rows never leak.

-- ── Listings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,       -- null = studio listing
  project_id     uuid REFERENCES projects(id) ON DELETE SET NULL,       -- provenance for user submissions
  source         text NOT NULL DEFAULT 'user' CHECK (source IN ('studio', 'user')),
  title          text NOT NULL,
  description    text NOT NULL,
  category       text NOT NULL,
  tags           text[] NOT NULL DEFAULT '{}',
  framework      text NOT NULL DEFAULT 'react-vite',
  files          jsonb NOT NULL,                       -- snapshot of source at listing time
  thumbnail_url  text,
  preview_color  text DEFAULT '#0EA5E9',
  price_usd      numeric(10,2) NOT NULL CHECK (price_usd >= 1),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  sales_count    integer NOT NULL DEFAULT 0,           -- real count, only incremented by fulfillment
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (source = 'studio' OR seller_id IS NOT NULL)   -- user listings must have an owner
);

CREATE INDEX IF NOT EXISTS marketplace_listings_public_idx
  ON marketplace_listings (status, sales_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_listings_seller_idx ON marketplace_listings (seller_id);
CREATE INDEX IF NOT EXISTS marketplace_listings_category_idx ON marketplace_listings (category) WHERE status = 'approved';

-- Studio listings are 1:1 with a prebuilt_apps name — this lets the seed
-- route upsert by title (onConflict: 'title') so re-seeding updates price/
-- description instead of duplicating. Scoped to studio rows only: two
-- different sellers may legitimately title their own listing the same thing.
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_listings_studio_title_uniq
  ON marketplace_listings (title) WHERE source = 'studio';

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved listings" ON marketplace_listings;
CREATE POLICY "Anyone can view approved listings" ON marketplace_listings
  FOR SELECT USING (status = 'approved');

-- A seller needs to see their own pending/rejected listings on /marketplace/sell,
-- not just what's already public.
DROP POLICY IF EXISTS "Sellers can view their own listings" ON marketplace_listings;
CREATE POLICY "Sellers can view their own listings" ON marketplace_listings
  FOR SELECT USING (auth.uid() = seller_id);

-- ── Purchases ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE RESTRICT,
  buyer_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id            uuid REFERENCES profiles(id) ON DELETE SET NULL,   -- copied from listing at purchase time
  price_usd            numeric(10,2) NOT NULL,
  platform_fee_usd     numeric(10,2) NOT NULL DEFAULT 0,
  seller_earning_usd   numeric(10,2) NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'failed', 'refunded')),
  dodo_checkout_id     text,
  dodo_payment_id      text,
  delivered_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_purchases_buyer_idx ON marketplace_purchases (buyer_id);
CREATE INDEX IF NOT EXISTS marketplace_purchases_seller_idx ON marketplace_purchases (seller_id);
CREATE INDEX IF NOT EXISTS marketplace_purchases_listing_idx ON marketplace_purchases (listing_id);

ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers and sellers can view their own purchases" ON marketplace_purchases;
CREATE POLICY "Buyers and sellers can view their own purchases" ON marketplace_purchases
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ── Seller earnings ledger (tracked only — no automated payout in v1) ────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_earnings_usd numeric(10,2) NOT NULL DEFAULT 0;
