# WyberAi US campaign: "Tell us the app. Get a price in 24h."

Goal: 10 paying US customers in 30 days. Geo-routing already exists, so no new landing page. All traffic goes to the existing US homepage; the offer is delivered in the reply, not on a page.

## Constraints that shape it
- Credit policy frozen: no free credits, no price changes.
- Funnel today: 779 signups, ~10% built, 1 payer. Credit wall + empty prompt box lose people.
- So we lead with a human-scoped answer, then sell: Builder $79/mo, Done-For-You from $199, Medium Build $399 (3 days), Complex $799 (1 week).
- No founder / location mentions. No generic AI-slop copy.

## Lead offer: consultation, not DIY (decided Nov 7)
Headline = free scoping consultation (15-min call or written plan in 24h) -> fixed-price quote for Done-For-You $199+ / Medium $399 / Complex $799. Builder $79 is the fallback for small budgets or technical buyers, never the headline.
- Evidence: only payer so far bought a build; 19 UAE signups = 5 credit wall, 9 never typed a prompt, 0 checkouts.
- Intake (3 questions): what the business does, what the app must do on day one, budget band. Calls only above ~$200 budget; others get the written plan.
- Reuse the existing consultation framework (intake, scope interview, breakdown).
- Cap ~20 consultations/week; beyond that add a small fee or tighten the filter.
- Plan lists screens, data, credit estimate, so it still has value if they self-build.
- Reply closing line becomes: "Want me to scope this properly? 15 minutes or a written plan, free."

## Who
1. US small-business owners who need a portal / booking / quoting / CRM.
2. Solo founders with an MVP idea and no developer.
3. Freelancers and small agencies (resell lane, repeat buyers).

## The one motion: intent replies
People publicly ask for exactly this every day (r/forhire, r/startups, r/SaaS, r/Entrepreneur, r/smallbusiness, r/SideProject, r/somebodymakethis, X, Indie Hackers, HN "Ask HN").

Daily loop (60-90 min):
1. Pull last-24h posts where a US person asks for an app/MVP/tool to be built.
2. Reply publicly or by DM with a *specific* answer: the 4-5 screens their app needs and what it would take, in their words. Value first.
3. Last line only: "I can build this in 3 days for $399 (or you can build it yourself on WyberAi for $79). Want the scoped plan?"
4. Interested -> quote with a real credit estimate -> Dodo checkout.

Rules: one reply per post, no links in the first message on Reddit, never reply to threads that ban promotion, no copy-paste (each reply names their actual use case).

## Proof assets (build once, reuse everywhere)
Three screen-recorded one-prompt builds with the clock and credit count visible, each ending on a live URL:
1. Client portal for a small agency
2. Quote + invoice tool for a contractor
3. Booking + CRM for a coach/clinic

Cut each into a 45s vertical, an X thread and a LinkedIn carousel (renderer exists). Pinned link in every reply profile.

## Paid test (optional, $350)
Meta US, $25/day, 14 days, creative = the three recordings, destination = existing homepage with `utm_campaign=us-nov`. Kill if no `signup -> first prompt` rate of at least 25%.

## Targets
| By | Metric | Target |
|---|---|---|
| Day 3 | Proof builds recorded | 3 |
| Day 7 | Intent replies sent | 100 |
| Day 14 | Scoped quotes sent | 20 |
| Day 30 | Paid orders | 10 |

Day-14 gate: fewer than 8 conversations from 100 replies means change the ICP/subreddits, not the volume.

## Known blockers
- Reddit blocks the free JSON scrape (403), so `scripts/lead-scanner.mjs` hangs on the Reddit step. HN works. Fix = Apify Reddit scraper (a few dollars per run) or run the scan from a browser session.
- Email now sends through Continuum (SES is NOT sandboxed; wyberai.com verified, bounce MX added Oct 31). Open: /v1/send latency ~4-5s. Cold outreach goes through Instantly mailboxes (reconsignal.com, ~180/day ceiling).

## Automation target (decided Nov 7): Sumeet only attends meetings
Agent chain, cloud-scheduled (not desktop-dependent): Scout -> Qualifier -> Writer (Haiku) -> Quality gate -> Sender (Instantly) -> Reply/Setter (/gtm/inbox + Cal booking) -> Pre-call brief -> Post-call quote + Dodo link + follow-ups -> Daily digest of meetings.
Human approval is replaced by an automated gate, send caps, suppression/unsub, and a kill switch. Public Reddit/X replies are NOT auto-posted (platform bans); those sources feed targeting only.
