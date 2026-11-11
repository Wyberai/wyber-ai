# Agency mode: plan (v3, built for the solo freelancer)

## Who it is for
A single freelancer or tiny studio who builds apps and websites for paying clients and has to run the whole job:
get the brief, build, show, take feedback, fix, hand over, get paid, and keep the client. Teams are a nice extra, not the point.
(v2 led with workspaces and roles; that was the wrong emphasis. They stay in the backend but the interface no longer leads with them.)

## The job, and what WyberAi does at each step

| Step | Feature | Notes |
|---|---|---|
| Brief | **Intake link.** The client answers 10 short questions on a public page; the freelancer gets a structured brief and a ready-made build prompt. | `/brief/[token]`, separate from the portal link so it can be sent first. |
| Build | **Build from brief.** One click creates the project from the brief and attaches it to the client. | Reuses the dashboard project creation. |
| Show | The client portal: updates, projects, quote, delivery. | Done in v2, extended. |
| Feedback | Client change requests, plus pinned comments on the live preview (already in the product), in one inbox per client. | Pinned comments are opt-in per project; the dashboard can switch them on. |
| Fix | **Fix with AI.** One button turns open feedback (one item or all of it) into a prompt in the builder, prefilled, not auto-sent (so no surprise credit spend). Then "Mark done" and "Ask for review again". | The client sees which items are done. |
| Deliver | **Handover.** Per project: Delivered state, a handover note (repo, domain, logins, how to edit), live URL, code download link for the freelancer. | In-place project transfer is deliberately NOT built, see below. |
| Bill | **Quotes.** Line items, currency, notes. The client accepts or declines on the portal with a name and a timestamp. The freelancer's own payment instructions or link appear after acceptance; the freelancer marks it paid. | WyberAi never touches the money. |
| Know | **Credits per client** (credits spent on their projects) next to the quote total; stage per client; approval log as CSV. | |
| Keep | Client emails (updates, quote sent, delivered) with the freelancer as reply-to; changes after delivery stay open on the portal. | |

## Decisions
- **No in-place transfer of a project to the client's account.** A project is tied to secrets, connectors, a cloud
  database, snapshots and domain purchases that are all keyed to the freelancer's user id. Swapping the owner would
  either break the client's app or hand over the freelancer's keys. Handover is therefore: code export, the live URL,
  the domain steps, and a written note, which is how freelancers deliver anyway.
- **No payment processing.** Taking money for someone else is a regulated activity; the portal shows the freelancer's
  own payment instructions or link and records acceptance and "paid" as the freelancer's own bookkeeping.
- **Fix with AI prefills, never auto-sends.** Builds cost credits; the freelancer reviews the prompt first.
- **No plan limits or pricing changes** (policy is frozen).
- Client accounts, per-client custom domains and a client-side code download are later work.

## Build order
1. Migration `20261112000000_agency_freelancer_flow.sql`.
2. Pure libraries with tests: stage, feedback prompt, brief, quote, CSV.
3. Owner APIs: feedback resolve, brief link, quotes, delivered/handover, approvals CSV, emailed updates.
4. Public: `/brief/[token]` and the quote response on the portal.
5. Portal and dashboard rebuild; teams collapsed; builder draft prefill.

---

# v4 (Nov 12): audit findings and what changed

The v3 flow was tested in isolation, never walked end to end as a freelancer, and never attacked across accounts. This
pass did both. Findings, all fixed:

| # | Finding | Fix |
|---|---|---|
| 1 | Nothing in the signed-in app linked to /clients, and the "agency" persona landed on /dashboard. | Clients in the dashboard nav and command palette; agency persona lands on /clients?welcome=1; first-run checklist read from real data. |
| 2 | **/api/generate trusted a `projectId` from the request body** and read and wrote that project with the service client (memory, knowledge, Supabase connection, rescued files). Project ids appear in public preview links. | Caller must be able to edit the project (owner, workspace member, editor collaborator). `src/lib/project-access.ts`. |
| 3 | Publish, custom domain and export required the project's creator, so a workspace teammate could open a shared project but not ship it. | Same shared check on publish, custom-domain, export and the pinned-comments switch. |
| 4 | The portal put project ids on the wire. | Removed. |
| 5 | Passcode brute-force limit and the review/brief spam limits were per serverless instance. | Database-backed limiter (`src/lib/agency/limits.ts`); passcode attempts fail closed. |
| 6 | Anyone with a client link could flood the freelancer's inbox; a freelancer could mass-mail strangers. | One alert email per 10 minutes per client; 6 emails an hour per client and 25 a day per freelancer; footer on every client email. |
| 7 | Handover notes (logins) were visible on an unlocked page. | Notes show only on a passcode-locked page. |
| 8 | No agency identity: nothing showed the business name, logo, tax details. | `agency_profiles` (per person or per workspace); used on the client page, quotes, printable invoice and as the email sender. |
| 9 | No domain step. | Go live panel: connect the client's domain, DNS note for their IT person, buy a domain with the client as registrant, add it to the quote. |
| 10 | Build-from-brief made a personal project a teammate could not open. | Creates inside the workspace when the client lives in one; copy-and-attach duplicates into it too. |
| 11 | No retainer, terms or invoice. | Billing period (once, monthly, yearly), terms, printable quote and invoice. |
| 12 | Links 8 random characters; pages cacheable. | 12 characters; no-store, no-referrer, noindex on client pages and their APIs. |

Tenant isolation is attacked by `src/app/api/clients/tenant-isolation.test.ts`: two tenants plus a stranger, every
route, refused and unchanged, nothing leaked. Mutation-checked.

Not built, deliberately: a shared credit pool for a workspace (credits live on each person; that is a billing change),
in-place project transfer, client logins, per-client custom domains, taking payment on the freelancer's behalf.

---

# Shareable previews (Nov 12)

A freelancer can give a client a private link to the latest SAVED version of a project without publishing it.
- `/preview/<token>`: random token is the access; works only while the client is active and the preview is on; on a
  passcode-locked client it only opens in a browser that has unlocked the page (and never reveals the page address).
- Built with the publishing build (same sanitising, secret scan, smoke test) but none of publishing's side effects: not
  public, no published address, no image generation, no credits. Stored at `previews/<token>/index.html`.
- A generated app is code, so it runs in a sandboxed frame with an opaque origin (same isolation as published apps),
  never on our own origin. A test fails if the frame ever gains `allow-same-origin`.
- Create, update, make a new link, turn off. A failed rebuild leaves the previous preview working.
- Mobile projects reuse the phone-frame render that /m/<id> uses (now one shared module).
- Pinned comments appear in a web preview when they are switched on for the project.
