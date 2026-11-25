# Domains relay

A small server with a fixed outbound IP. ResellerClub only accepts API calls from whitelisted IPs (up to 3, no ranges,
and a new IP takes 30 to 60 minutes to start working), and Vercel has no fixed IP, so the app sends signed requests here
and this server forwards them.

- The app never holds the reseller id or API key. Only this server does, from environment variables.
- Every request is signed (HMAC-SHA256 of `timestamp.body`, 60 second window) and only the listed provider paths are allowed.
- No dependencies. Node 18 or newer.

## Deploy (any small VPS, 512 MB is plenty)

1. Create the VPS and note its public IPv4 address. Keep it fixed (a reserved or elastic IP).
2. Install Node 20, copy `server.mjs` to `/opt/wyber-relay/`.
3. Create `/etc/wyber-relay.env` (root-only, `chmod 600`), see `.env.example`.
4. Install the service: copy `wyber-relay.service` to `/etc/systemd/system/`, then `systemctl enable --now wyber-relay`.
5. Put HTTPS in front (Caddy: `relay.yourdomain.com { reverse_proxy localhost:8787 }`). Do not expose port 8787 directly.
6. In the ResellerClub panel: Settings > API > whitelist the VPS IP. Wait up to an hour. A call before then returns "Access Denied".
7. Check: `curl https://relay.yourdomain.com/healthz` returns `{"ok":true,"mode":"sandbox"}` until you switch to live.

## Sandbox first

Leave `RESELLERCLUB_BASE=https://test.httpapi.com/api/` and use a demo reseller account's id and key. Live credentials
on the test URL still act on production, so never put live credentials in front of the sandbox URL. To go live, change
`RESELLERCLUB_BASE` to `https://httpapi.com/api/`, use the live id and key, and restart.

## App side

Set `DOMAINS_RELAY_URL` to the relay's HTTPS address and `DOMAINS_RELAY_SECRET` to the same value as `RELAY_SECRET`.
