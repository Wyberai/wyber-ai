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
