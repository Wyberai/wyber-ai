# US free-call campaign: creatives and copy (11 Nov 2026)

Goal: book free 30-minute founder calls from US app-idea owners, then quote a fixed-price build (Simple $199 / 24 hours,
Medium $399 / 3 working days, Complex $799 / 1 week, as on the pricing page). Landing page: `/us-consulting`.

Every line below is something the live page or the pricing page already says. Do not add prices, income promises or
"responds same day" to ad copy.

## Images (in this folder)
| Concept | Idea | Files |
|---|---|---|
| A. Idea to plan | Same headline as the page: "Have an app idea? Leave with a plan to build it." | `a-idea-to-plan_square.png`, `_feed45.png` |
| B. Big builds | One example per project kind: scheduling SaaS, marketplace, booking/delivery app, business site | `b-big-builds_*.png` |
| C. Days, not months | The three sizes and delivery times, no prices | `c-days-not-months_*.png` |

Square (1080x1080) for feed and carousel placements; 4:5 (1080x1350) for the larger feed slot. A 9:16 story version is not
made yet.

## Links (one per concept, so results split by creative)
```
https://wyberai.com/us-consulting?utm_source=facebook&utm_medium=paid&utm_campaign=us-idea-call&utm_content=a-idea-to-plan
https://wyberai.com/us-consulting?utm_source=facebook&utm_medium=paid&utm_campaign=us-idea-call&utm_content=b-big-builds
https://wyberai.com/us-consulting?utm_source=facebook&utm_medium=paid&utm_campaign=us-idea-call&utm_content=c-days-not-months
```
The booking carries these tags into Cal.com, and the webhook stores the whole payload, so every booked call shows its campaign.

## Copy

### A. Idea to plan
- **Primary text (short):** Have an app idea but don't know where to start? Book a free 30-minute call with the founder of WyberAi. Within 24 hours you get a written plan: your MVP, the tools it needs, and a fixed price.
- **Primary text (long):** Most app ideas stall at the same place: nobody has told you what to build first. On a free 30-minute call, tell the founder of WyberAi your idea in plain English. Within 24 hours you get it in writing: what your first version should include, which tools it needs, and a fixed price and delivery date. No card, no sales script, no obligation.
- **Headline:** Leave with a plan to build it
- **Description:** Free 30-minute call with the founder
- **Button:** Book now

### B. Big builds
- **Primary text (short):** A scheduling platform. A marketplace. A booking app. A business site that sells. We build the big ones too. Free 30-minute call, then a fixed-price quote.
- **Primary text (long):** You do not need a developer on payroll to build something substantial. WyberAi builds SaaS products, marketplaces, mobile apps and business websites. Book a free 30-minute call, describe your idea, and within 24 hours you get a written scope and a fixed quote. You get the GitHub repository, a live URL and support after delivery.
- **Headline:** We build the big ones too
- **Description:** SaaS, marketplaces, mobile apps, websites
- **Button:** Book now

### C. Days, not months
- **Primary text (short):** From idea to a live app in days, not months. Simple builds in 24 hours, medium in 3 working days, complex in about a week. Fixed price, quoted after a free 30-minute call.
- **Primary text (long):** Agencies quote months. We quote days: 24 hours for a simple build, 3 working days for a medium one, about a week for a complex one. Book a free 30-minute call, tell the founder what you want built, and get a fixed price and delivery date in writing within 24 hours.
- **Headline:** Idea to live app in days
- **Description:** Fixed price. Free planning call.
- **Button:** Book now

## Audience and test plan
- **Location:** United States. **Age:** 25 to 60. **Placements:** start with Advantage+ placements, then check Feed vs Stories.
- **Targeting:** start broad (let Meta find bookers). If you add interests, use Entrepreneurship, Small business owners, Startups.
  Exclude existing customers and anyone who has booked.
- **Budget (from the Nov 7 plan, not yet agreed):** $25/day for 14 days (about $350), three ads, one ad set.
- **Judge on:** cost per booked call and, later, calls that become paid builds. Do not judge on clicks.
- **Stop rule:** pause an ad that has spent $60 with no booking; change the concept, not the budget.

## Compliance checklist
- No before/after, no "are you struggling with..." personal-attribute phrasing, no income or earnings claims.
- The landing page has Privacy and Terms links (needed for ad review).
- "Founder" is the person on the call; no location or team-size claims in ads.

## Tracking gap to close before scaling
The booking happens inside Cal.com, which the Meta pixel on our site cannot see, so Meta will not know which clicks led to a
booking. The ad's `fbclid` is already stored with each booking. The next build is to send a "Schedule" event to Meta from the
Cal.com booking webhook (Conversions API), so the campaign can optimise for booked calls.
