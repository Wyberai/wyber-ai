# WyberAi MCP Connector — Reviewer Guide

Server URL: `https://wyberai.com/api/mcp` (Streamable HTTP)
Support: hello@wyberai.com · Docs: https://wyberai.com/docs/mcp · Privacy: https://wyberai.com/privacy

## Authentication

Two supported paths:

1. **OAuth 2.0** (directory path) — Dynamic Client Registration + authorization code + PKCE (S256) + refresh tokens.
   - Protected-resource metadata: `https://wyberai.com/.well-known/oauth-protected-resource`
   - Authorization-server metadata: `https://wyberai.com/.well-known/oauth-authorization-server`
   - Redirect URI registered for hosted Claude: `https://claude.ai/api/mcp/auth_callback`
   - On connect, the user lands on a WyberAi consent screen (must sign in to WyberAi first) and approves access.
2. **API key** (`x-api-key: wyb_…`) — for custom-connector / Claude Code use. Create one at https://wyberai.com/api-keys.

## Test account

- Email: `<REVIEWER_TEST_EMAIL>`  (sign in via magic link / Google)
- The account is pre-populated with a sample project and carries enough credits to run builds.
- API key for header auth (if testing that path): `<REVIEWER_TEST_KEY>`

> Fill the two placeholders in the submission portal's private test-instructions field before submitting.

## Tools & how to exercise them

Read-only tools return immediately: `list_projects`, `get_project`, `list_files`, `read_file`,
`get_account`, `get_project_knowledge`, `get_database_status`, `list_versions`, `list_connectors`,
`run_security_scan`.

**Building is asynchronous** — this is the one flow that isn't a single synchronous call:

1. `create_project` → returns a `project_id`.
2. `send_message` `{ project_id, message: "Build a simple counter app" }` → returns `{ message_id, status: "queued" }`.
3. Poll `get_message_status` `{ message_id }` every ~10s. It moves `queued → processing → done` (typically 30–70s).
4. When `done`, call `get_project` / `list_files` / `read_file` to see the generated files.
5. Optionally `publish_project` `{ project_id }` → returns a live `https://wyberai.com/app/<slug>` URL.

Each `send_message` build consumes credits from the connected account (disclosed on the consent screen and in `get_account`).

## Notes for review

- Read and write operations are separate tools; destructive tools (`send_message`, `delete_project`,
  `restore_version`, `execute_sql`, `publish_project`) carry `destructiveHint`.
- `execute_sql` runs SQL against the **user's own** connected Supabase project (not WyberAi's), and only
  when the user has connected Supabase to that project.
- The connector builds **web/mobile applications** (code). It does not offer image/video/audio generation
  as a function; any imagery inside a built app is incidental to app generation.
