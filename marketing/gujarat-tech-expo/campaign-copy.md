# Gujarat Tech Expo: campaign copy

Landing page: `/expo` (local, not deployed). Use `?utm_source=meta|linkedin|email&utm_campaign=expo` on every link so the alert email shows where each request came from.

Core idea: small teams pay for software with 100 features, use 5, and the one they need is missing. Tell us the pain point, we build your own software, see it at the booth.

---

## LinkedIn post

Your CRM has 100 features.
You use 5.
You pay for all 100.

And the one you actually need? It isn't there. So it ends up in Excel. Or WhatsApp. Or in someone's head.

Small teams shouldn't have to bend to their software. The software should bend to them.

At the Gujarat Tech Expo (27–29 Nov) we're trying something simple. Tell us the one thing your current tools can't do. We'll build it as your own software, and you can try it at our booth. 15 minutes, free.

What's the feature your tools are missing? Drop it in the comments.

Booking link in the first comment.

First comment: `https://wyberai.com/expo?utm_source=linkedin&utm_campaign=expo`

Attach: `social-feed-1080x1350.png` (or the square).

---

## Meta ads (3 variants)

Meta's policy does not allow copy that asserts something about the viewer ("your CRM"), so ad copy says "most" instead. The landing page keeps the stronger "your" wording.

**A: the grid (use the 4:5 and story posters)**
- Primary text: Most CRMs have 100 features. Most small teams use 5. And the one they need is missing. Tell us your pain point. We'll build your own software and show you at the Gujarat Tech Expo, 27–29 Nov.
- Headline: Build your own software
- Description: Free 15-minute slot at our booth
- Button: Book now

**B: the pain point**
- Primary text: Customers go quiet and nobody follows up. Orders live in WhatsApp and Excel. You pay for a tool and still keep a spreadsheet beside it. Tell us the one thing your software can't do. We'll build it. Meet us at the Gujarat Tech Expo.
- Headline: Tell us your pain point
- Description: Book 15 minutes, 27–29 Nov
- Button: Book now

**C: the offer, short**
- Primary text: Software that fits your business, not 100 features you never open. Book a free 15-minute slot at the Gujarat Tech Expo.
- Headline: Your pain point. Your software.
- Description: wyberai.com
- Button: Learn more

Setup notes (not yet created or run, no spend):
- Objective: Leads, optimising for the `Lead` pixel event (the form fires it on success).
- Location: Ahmedabad plus about 25 km. Age 25–55. Start broad and let delivery find the buyers. Use interests only to exclude (students, job seekers).
- Run from about 17 Nov to 29 Nov. Existing scripts for reference: `scripts/meta-ad-india-layoff.mjs`, `scripts/meta-ad-us-founder-call.mjs`. Creating ads spends real money, so nothing is launched without your go-ahead and a daily budget.
- Watch the first 3 days of cost per lead before scaling.

---

## Cold email (send from Smartlead, not Continuum/SES)

Merge fields: `{{first_name}}`, `{{company}}`, `{{sender_first_name}}`. Add your unsubscribe line in Smartlead. Link: `https://wyberai.com/expo?utm_source=email&utm_campaign=expo`.

**Email 1**
Subject: one question about {{company}}'s software

Hi {{first_name}},

Most CRMs have around 100 features. Most small teams use about 5, and the one they really need is missing.

We'll be at the Gujarat Tech Expo on 27–29 Nov. Tell us the one thing your current tools can't do, and we'll build it as your own software and show you at our booth.

15 minutes, free. Pick a slot here: {{link}}

{{sender_first_name}}, WyberAi

**Email 2 (3 days later)**
Subject: re: one question about {{company}}'s software

{{first_name}}, a few examples of what people tell us:

- Customers go quiet and nobody follows up
- Orders and quotes live in WhatsApp and Excel
- The same data gets typed in three places

If one of these is you, or something else entirely, reply with one line and we'll build around it. Or book the booth slot: {{link}}

**Email 3 (about 1 week before the expo)**
Subject: see you at the expo?

{{first_name}}, last note from us. If you're visiting the Gujarat Tech Expo on 27–29 Nov, book 15 minutes and bring your pain point: {{link}}

If it's not for you, no reply needed.

Rules followed: no "I noticed your company" opener, no invented scarcity, passes the "swap the company name" test only because the pain points are concrete. Personalise line 1 per segment once the lead list is chosen.
