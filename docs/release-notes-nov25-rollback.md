# Release note: read this before any rollback (25 Nov 2026)

**Saved credentials changed format.** `src/lib/encryption.ts` now writes new values as `v2:<base64>` (the key is the SHA-256 of
`CREDENTIAL_ENCRYPTION_KEY`). The new code still reads the old format, so nothing already saved is lost. The OLD code cannot read `v2:`
values. If you roll the app back to a release from before 25 Nov after users have saved API keys or connector credentials, those
saved values will not decrypt until the new release is back. Roll forward, not back, once this release has been live for a while.

**Database changes to apply in this order** (none are applied automatically):
1. `20261124000000_domains_workspace.sql`
2. `20261124010000_domains_renewals.sql` (widens the order kind; domain renewals fail without it)
3. `20261125000000_dashboard_speed_indexes.sql`
4. `20261125010000_api_key_scope_expiry.sql` (read-only and expiring API keys; until applied, every key stays full access)

**Domains stay off in production until** `DOMAINS_RELAY_URL` (https), `DOMAINS_RELAY_SECRET`, `DODO_PRODUCT_DOMAIN` and the payment
keys are set. Plain `http://` relay addresses are refused on production.
