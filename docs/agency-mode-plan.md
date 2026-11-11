# Agency mode: plan

## What exists today (Nov 11 audit)
- A client record per account (`clients`) with a public delivery page `/client/[slug]` listing attached projects.
- Isolation per account is correct (tests added in `clients-isolation.test.ts`).
- Gaps: `clients.org_id` and the org RLS exist but no code uses them (no teamwork); the link is the only protection and
  cannot be rotated; clients cannot respond; agencies cannot tell whether a client opened the page.

## What an agency actually needs
1. **Team workspace.** Several people at one agency see and manage the same clients. Roles reuse the org roles
   (owner and admin manage, member edits, viewer reads).
2. **A link that can be locked down.** Optional passcode, and "new link" that kills the old one.
3. **Client review.** On each deliverable the client can Approve, Request changes (with a note) or comment, with no account.
4. **Updates.** The agency posts short updates that show on the client page, newest first.
5. **Signal.** The agency sees views and last opened, which deliverables are approved, and who is waiting on whom.
   An email goes to the agency when a client approves or asks for changes.

## Out of scope on purpose
- Plan limits or pricing for agency mode (credit and pricing policy is frozen).
- Client accounts and logins (a passcode is enough for v1 and keeps the client friction-free).
- Per-client custom domains (needs DNS and TLS work; separate task).

## Build
- Migration `20261111000000_agency_mode.sql`: passcode hash, view count, last viewed; review status on deliverables;
  `client_feedback`; `client_updates`; RLS for owner and org members.
- `src/lib/agency/access.ts`: one place that answers "can this user see or edit this client".
- `src/lib/agency/passcode.ts`: scrypt hash, signed unlock cookie that stops working when the passcode changes.
- Public API: `/api/portal/[slug]/{unlock,review,view}`; owner API: clients (org-aware), `rotate`, `updates`.
- Client page: passcode gate, updates, review controls, view beacon (not counted for the agency's own visits).
- Dashboard `/clients`: workspace picker, invites, status badges, feedback thread, link and passcode controls, updates composer.
- Tests: access rules, passcode, review flow, isolation across accounts and orgs.
