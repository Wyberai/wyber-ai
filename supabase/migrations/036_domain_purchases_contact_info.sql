-- Vercel's Registrar API "buy" endpoint (replacing the sunset v4/v5 domains
-- API) requires ICANN registrant contact info on every purchase request.
-- Store what the buyer submitted at checkout time so the webhook can pass it
-- through when payment confirms.

alter table public.domain_purchases add column if not exists contact_info jsonb;
