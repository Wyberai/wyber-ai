export interface SequenceStep {
  day: number
  type: 'email' | 'call' | 'linkedin' | 'wait' | 'task' | 'meeting'
  subject?: string
  body?: string
  script?: string
  message?: string
  duration_min?: number
  note?: string // guidance for non-native steps
  native: boolean // true = Wyber executes | false = guide user to their tool
}

export interface SequenceTemplate {
  id: string
  name: string
  emoji: string
  description: string
  goal: string
  ideal_for: string[]
  avg_reply_rate: string
  steps: SequenceStep[]
  tools_needed: string[]
  tags: string[]
}

export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  // ─── 1. SaaS Cold Outreach ────────────────────────────────────────────────
  {
    id: 'saas-cold-trial',
    name: 'SaaS Cold → Trial',
    emoji: '🚀',
    description: '7-touch sequence converting cold prospects to free trial signups using email + call + LinkedIn.',
    goal: 'Book a demo or drive trial signup',
    ideal_for: ['SaaS founders', 'Sales reps targeting SMB', 'Product-led growth motions'],
    avg_reply_rate: '12–18%',
    tools_needed: ['Smartlead / Instantly', 'Apollo Dialer / JustCall', 'LinkedIn Sales Navigator'],
    tags: ['cold', 'saas', 'trial', 'multi-channel'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: 'Quick question, {{first_name}}',
        body: `Hi {{first_name}},

I noticed {{company}} is scaling its [relevant function] — congrats on [recent signal if available].

We help [ICP type] companies [core value prop] without [main pain]. Would a 15-min call this week make sense?

Best,
{{sender_name}}`,
      },
      {
        day: 2, type: 'linkedin', native: false,
        message: `Hi {{first_name}}, sent you a quick email about [value prop]. Thought I'd connect here too — would love to hear how you're handling [pain point] at {{company}}.`,
        note: 'Send this LinkedIn connection request manually or via LinkedIn Sales Navigator / Expandi / Dripify. Keep it short — no pitch in the request.',
      },
      {
        day: 3, type: 'email', native: true,
        subject: 'Re: Quick question, {{first_name}}',
        body: `Hi {{first_name}},

Following up on my note from earlier. Sharing a quick result in case it's relevant:

[Client similar to {{company}}] went from [before state] to [after state] in [timeframe].

Happy to show you how — 15 mins enough?

{{sender_name}}`,
      },
      {
        day: 5, type: 'call', native: false,
        script: `"Hi, is this {{first_name}}? Great — this is [name] from [company]. I sent you a couple of emails about [value prop] — caught you at a bad time? [If yes: no problem, I'll send a calendar link] [If no:] Fantastic. In one sentence, we help [ICP] companies [result]. Does that sound like something worth 15 minutes? When works for you?"`,
        duration_min: 5,
        note: 'Dial via Apollo Dialer, JustCall, or Aircall. Log the outcome (VM / connected / meeting booked) back in your CRM. If voicemail: leave a 20-second message referencing your email.',
      },
      {
        day: 7, type: 'email', native: true,
        subject: '{{first_name}} — one more thought',
        body: `Hi {{first_name}},

One more thought before I stop bothering you:

Most [ICP role]s I talk to say the hardest part is [pain point]. We solved that by [differentiator].

If the timing is ever right, here's my calendar: [link]

{{sender_name}}`,
      },
      {
        day: 10, type: 'linkedin', native: false,
        message: `{{first_name}}, I know you're busy — just dropping this case study here in case it's useful: [link or 2-sentence summary]. No pressure to reply.`,
        note: 'Send as a LinkedIn DM (not InMail). This is a value-add touchpoint, not another ask.',
      },
      {
        day: 14, type: 'email', native: true,
        subject: 'Closing the loop',
        body: `Hi {{first_name}},

I've reached out a few times — if the timing isn't right, completely understand. I'll stop here.

If things change and [pain point] becomes a priority, my calendar is always open: [link]

Good luck with everything at {{company}}.

{{sender_name}}`,
      },
    ],
  },

  // ─── 2. Event / Conference Follow-up ─────────────────────────────────────
  {
    id: 'event-followup',
    name: 'Event Follow-up',
    emoji: '🎪',
    description: 'Strike within 48 hours of meeting a prospect at a conference or event. High-context, fast close.',
    goal: 'Convert event connection to booked meeting within 7 days',
    ideal_for: ['Post-SaaStr', 'Post-trade show', 'Post-webinar attendees'],
    avg_reply_rate: '25–35%',
    tools_needed: ['Smartlead / Instantly', 'Apollo Dialer / JustCall'],
    tags: ['event', 'warm', 'fast', 'high-intent'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: 'Great meeting you at [Event], {{first_name}}',
        body: `Hi {{first_name}},

Really enjoyed our conversation at [Event] — especially your point about [something they said].

As promised, here's [resource/demo link/next step you discussed].

Worth jumping on a quick call this week to go deeper?

{{sender_name}}`,
      },
      {
        day: 1, type: 'linkedin', native: false,
        message: `{{first_name}} — great to connect at [Event]! Sent you a follow-up email. Looking forward to continuing our conversation.`,
        note: 'Send this within 24 hours of the event while the memory is fresh. Use the LinkedIn mobile app for speed.',
      },
      {
        day: 3, type: 'call', native: false,
        script: `"Hi {{first_name}}, it's [name] — we met at [Event] and talked about [topic]. I sent over [resource] — did you get a chance to look? [Yes: great, what did you think?] [No: no worries, let me give you the 60-second version…] When could we carve out 20 minutes?"`,
        duration_min: 10,
        note: 'Call during business hours in their timezone. Reference the event immediately — this is a warm call, not cold.',
      },
      {
        day: 6, type: 'email', native: true,
        subject: 'Last follow-up from [Event]',
        body: `Hi {{first_name}},

One final note — I know post-event inboxes are brutal.

If [pain point we discussed] is still on your radar, here's my direct calendar: [link]

If not, no worries at all. Was great meeting you either way.

{{sender_name}}`,
      },
    ],
  },

  // ─── 3. Competitor Displacement ──────────────────────────────────────────
  {
    id: 'competitor-displacement',
    name: 'Competitor Displacement',
    emoji: '⚔️',
    description: 'Target users of a specific competitor with a direct value comparison. High-conviction, multi-touch.',
    goal: 'Get prospects using [Competitor] to evaluate switching',
    ideal_for: ['Targeting Lovable users', 'Targeting Zapier users', 'Any known competitor stack'],
    avg_reply_rate: '10–15%',
    tools_needed: ['Smartlead / Instantly', 'Apollo Dialer / JustCall', 'LinkedIn Sales Navigator'],
    tags: ['competitor', 'displacement', 'high-conviction'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: '{{first_name}} — faster than [Competitor]?',
        body: `Hi {{first_name}},

I see {{company}} is using [Competitor] for [use case]. Quick question: are you happy with [specific pain of competitor — e.g. the credit limits / pricing / missing feature]?

We built [product] specifically to fix that. Companies like [social proof] switched and cut [metric] by [%].

Worth 15 minutes to see if we'd be a better fit?

{{sender_name}}`,
      },
      {
        day: 2, type: 'email', native: true,
        subject: '[Competitor] vs [Your product] — the honest comparison',
        body: `Hi {{first_name}},

I put together a quick side-by-side since I mentioned it:

✅ [Your product]: [advantage 1], [advantage 2], [advantage 3]
❌ [Competitor]: [limitation 1], [limitation 2]

Happy to walk through it live. 15 mins this week?

{{sender_name}}`,
      },
      {
        day: 4, type: 'linkedin', native: false,
        message: `{{first_name}}, I know switching tools is a big decision. Happy to do a free migration audit for {{company}} — no commitment, just want to show you what's possible. Sent you a couple of emails too.`,
        note: 'Frame this as helping them evaluate, not hard-selling. Offer something of value (free audit, migration help) to lower the friction.',
      },
      {
        day: 6, type: 'call', native: false,
        script: `"Hi {{first_name}}, [name] here from [company]. I emailed about switching from [Competitor] — got 2 minutes? Great. The main thing I hear from [Competitor] users is [pain]. We solved that by [differentiator]. Would a 30-day free trial make sense so you can see the difference with your own data?"`,
        duration_min: 7,
        note: 'Lead with the competitor pain immediately. Have a switch offer ready (free trial, migration help, pricing match).',
      },
      {
        day: 10, type: 'email', native: true,
        subject: 'Free migration from [Competitor] — offer expires Friday',
        body: `Hi {{first_name}},

Last email, I promise.

We're offering free white-glove migration from [Competitor] for [X] companies this month — including data transfer + setup.

If {{company}} is evaluating options, this might be the right time: [calendar link]

{{sender_name}}`,
      },
    ],
  },

  // ─── 4. Inbound Lead Speed-to-Lead ───────────────────────────────────────
  {
    id: 'inbound-speed-to-lead',
    name: 'Inbound Speed-to-Lead',
    emoji: '⚡',
    description: 'Respond to a demo request or trial signup within 5 minutes. Studies show 100x higher contact rate vs 30-min response.',
    goal: 'Book a call within 24 hours of signup',
    ideal_for: ['Demo requests', 'Free trial signups', 'Contact form submissions'],
    avg_reply_rate: '40–60%',
    tools_needed: ['Smartlead / Instantly (automated trigger)', 'Apollo Dialer / JustCall'],
    tags: ['inbound', 'speed', 'warm', 'high-intent'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: '{{first_name}}, saw your signup — here\'s what to do first',
        body: `Hi {{first_name}},

Thanks for signing up! I'm [name], and I personally onboard every new user.

The fastest way to see results: [3 quick steps or single action].

I also set aside time this week for a 20-min setup call — here's my calendar: [link]

Talk soon,
{{sender_name}}`,
      },
      {
        day: 0, type: 'call', native: false,
        script: `"Hi, is this {{first_name}}? This is [name] from [company] — you just signed up a few minutes ago. I wanted to catch you while [product] is fresh. Did you get a chance to [first step]? [Yes: great, what did you think?] [No: totally fine, let me give you the 2-min walkthrough right now]"`,
        duration_min: 5,
        note: 'Make this call within 5 minutes of signup if possible. Use JustCall or Apollo Dialer. This is the single highest-ROI call you can make.',
      },
      {
        day: 1, type: 'email', native: true,
        subject: 'Quick tip for {{company}}',
        body: `Hi {{first_name}},

One thing I've seen help companies like {{company}} get faster results: [specific tip relevant to ICP].

Here's a 3-min walkthrough of how to do it: [loom/video link]

Any questions? Just reply here.

{{sender_name}}`,
      },
      {
        day: 3, type: 'call', native: false,
        script: `"Hi {{first_name}}, [name] checking in on your [product] setup. How's it going? [Listen] Great — what's the biggest thing you're trying to solve right now? [Listen and link to feature]"`,
        duration_min: 10,
        note: 'This is a success/onboarding call, not a sales call. Focus on making them successful. The sale happens naturally.',
      },
    ],
  },

  // ─── 5. Enterprise Account Break-in ──────────────────────────────────────
  {
    id: 'enterprise-break-in',
    name: 'Enterprise Account Break-in',
    emoji: '🏢',
    description: 'Multi-threaded approach for enterprise accounts. Hit 3 stakeholders simultaneously across email + LinkedIn + phone.',
    goal: 'Get an internal champion and executive sponsor at a target enterprise',
    ideal_for: ['Deals > $50K ACV', 'Fortune 1000 targets', 'Long sales cycles'],
    avg_reply_rate: '8–12% (but much higher deal value)',
    tools_needed: ['Smartlead / Outreach.io', 'LinkedIn Sales Navigator', 'JustCall / Aircall'],
    tags: ['enterprise', 'multi-thread', 'high-ACV'],
    steps: [
      {
        day: 0, type: 'linkedin', native: false,
        message: `{{first_name}}, I've been following {{company}}'s work on [initiative] — impressive. We've helped [similar company] achieve [result] in that space. Would love to share what we learned. Open to a quick conversation?`,
        note: 'Start with LinkedIn for enterprise — executives screen email more aggressively. Send connection requests to 3 contacts at the same account simultaneously (champion + economic buyer + technical evaluator).',
      },
      {
        day: 1, type: 'email', native: true,
        subject: '{{company}} + [Your company] — a potential fit?',
        body: `Hi {{first_name}},

I reached out on LinkedIn as well — wanted to make sure this got through.

We recently helped [similar enterprise] [specific quantified result]. Given what {{company}} is building in [area], I think there's a genuine fit worth exploring.

Would a 20-min conversation with [your CTO/VP/relevant title] make sense?

{{sender_name}}`,
      },
      {
        day: 3, type: 'email', native: true,
        subject: 'Research on {{company}}\'s [initiative]',
        body: `Hi {{first_name}},

I did some research on {{company}}'s [public initiative / product / announcement].

[2-3 specific observations that show you've done your homework]

We've helped companies at this stage [specific outcome]. I put together a 2-page brief on how it could apply to {{company}} — worth sending over?

{{sender_name}}`,
      },
      {
        day: 5, type: 'call', native: false,
        script: `"Hi {{first_name}}, [name] from [company] — I emailed and connected on LinkedIn about [topic]. I'll be brief: we just finished a project with [similar company] on [problem] and got [result]. I'd love 20 minutes with you and [other stakeholder] to see if there's a fit. What does your calendar look like next week?"`,
        duration_min: 5,
        note: 'Call the economic buyer, not just the champion. Ask to include other stakeholders in the meeting — this establishes multi-threading from the start.',
      },
      {
        day: 8, type: 'linkedin', native: false,
        message: `{{first_name}}, sharing this [article / case study / report] that's directly relevant to what {{company}} is working on: [link]. No agenda — just thought it might be useful given our conversation.`,
        note: 'Value-add touchpoint. Share something genuinely useful. This builds credibility without another ask.',
      },
      {
        day: 12, type: 'email', native: true,
        subject: 'Executive brief — [Your company] for {{company}}',
        body: `Hi {{first_name}},

I put together a one-page executive brief on how [Your company] could help {{company}} [specific outcome] — tailored to what I know about your [initiative].

[Attach or link the brief]

Happy to walk through it in 20 minutes. Here's my calendar for this week: [link]

{{sender_name}}`,
      },
      {
        day: 18, type: 'call', native: false,
        script: `"Hi {{first_name}}, [name] — I sent over a brief last week and wanted to check if it reached you. Is [initiative] still a priority for {{company}} this quarter? [If yes: great, can we find 20 minutes?] [If no: totally understand — when would be a better time to revisit?]"`,
        duration_min: 5,
        note: 'This call is specifically about the brief. Always reference the most recent thing you sent.',
      },
    ],
  },

  // ─── 6. Webinar / Content Lead Nurture ───────────────────────────────────
  {
    id: 'webinar-nurture',
    name: 'Webinar → Pipeline',
    emoji: '🎙️',
    description: 'Convert webinar attendees and content downloaders into pipeline. Educational → conversational arc.',
    goal: 'Nurture content-engaged leads into discovery calls over 3 weeks',
    ideal_for: ['Webinar attendees', 'Ebook downloaders', 'Blog subscribers'],
    avg_reply_rate: '15–22%',
    tools_needed: ['Smartlead / Instantly', 'LinkedIn Sales Navigator'],
    tags: ['nurture', 'content', 'webinar', 'warm'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: 'Thanks for attending — {{first_name}}, here\'s the replay',
        body: `Hi {{first_name}},

Thanks for joining [Webinar Name] today! Here's the replay + slides: [link]

The part I think is most relevant for {{company}}: [timestamp or section].

One question: what was the biggest takeaway for you?

{{sender_name}}`,
      },
      {
        day: 2, type: 'email', native: true,
        subject: 'The #1 thing [ICP type] ask after this webinar',
        body: `Hi {{first_name}},

The most common question we get after this webinar: "[specific question]."

The short answer: [answer in 2-3 sentences].

The longer answer — happy to walk through it live with you specifically. 15 mins?

{{sender_name}}`,
      },
      {
        day: 5, type: 'linkedin', native: false,
        message: `{{first_name}}, great having you at [Webinar]. I published a follow-up on [topic] here: [post link]. Would love to hear your perspective — are you dealing with [challenge] at {{company}}?`,
        note: 'Share a LinkedIn post about the webinar topic and tag (or DM) attendees. This extends the conversation naturally.',
      },
      {
        day: 8, type: 'email', native: true,
        subject: '{{first_name}} — one more resource from the webinar',
        body: `Hi {{first_name}},

One resource I forgot to mention during the session: [link — template / tool / checklist].

It's what [similar company] used to [result]. Thought it might be useful for {{company}} too.

Let me know what you think — or if you want to walk through how to use it: [calendar link]

{{sender_name}}`,
      },
      {
        day: 14, type: 'email', native: true,
        subject: 'Checking in — {{first_name}}',
        body: `Hi {{first_name}},

It's been a couple of weeks since [Webinar]. Curious: have you been able to apply [key concept] at {{company}} yet?

If you've run into any roadblocks, happy to help. And if you're ready to go deeper, we can set up a proper session: [calendar link]

{{sender_name}}`,
      },
    ],
  },

  // ─── 7. Re-engagement (Stale Deals / Ghosts) ─────────────────────────────
  {
    id: 'reengagement-ghosts',
    name: 'Re-engagement — Ghosts & Stale Deals',
    emoji: '👻',
    description: 'Win back prospects who went dark. Pattern interrupt subject lines, new angle, no-pressure close.',
    goal: 'Revive 10–20% of stale conversations into active pipeline',
    ideal_for: ['Deals that went dark after demo', 'Prospects who stopped replying', '90-day inactive contacts'],
    avg_reply_rate: '18–28% (high because of novelty)',
    tools_needed: ['Smartlead / Instantly'],
    tags: ['reengagement', 'ghost', 'winback'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: 'Did I do something wrong?',
        body: `Hi {{first_name}},

I noticed we haven't connected in a while — wanted to check if everything's okay or if I dropped the ball somewhere.

If [product/solution] is no longer a priority, just say the word and I'll stop following up.

If timing just got away from us — happy to pick up where we left off.

{{sender_name}}`,
      },
      {
        day: 3, type: 'email', native: true,
        subject: 'New: [Feature / Result / Case study] that might change things',
        body: `Hi {{first_name}},

Since we last spoke, [something new happened — new feature, new customer result, price change].

[1-sentence description of why it's relevant to {{company}}]

Worth a quick re-look? 15 minutes, I'll get straight to the point: [calendar link]

{{sender_name}}`,
      },
      {
        day: 7, type: 'call', native: false,
        script: `"Hi {{first_name}}, [name] here — we spoke about [topic] a few months back and I wanted to check in. Has anything changed on your end? [Listen] Got it. We just [new development] and I thought of you immediately. Worth 10 minutes to see if the timing is better now?"`,
        duration_min: 5,
        note: 'Lead with "has anything changed?" — not another pitch. This shows you remember the context and are checking in, not just dialing for dollars.',
      },
      {
        day: 12, type: 'email', native: true,
        subject: 'Closing your file — {{first_name}}',
        body: `Hi {{first_name}},

I'm going to stop reaching out after this — I don't want to be that person.

If [pain point] ever becomes a priority again, you know where to find me: [email] or [calendar link]

Rooting for everything you're building at {{company}}.

{{sender_name}}`,
      },
    ],
  },

  // ─── 8. Referral Ask ─────────────────────────────────────────────────────
  {
    id: 'referral-ask',
    name: 'Referral Machine',
    emoji: '🤝',
    description: 'Turn happy customers into a referral source. The highest-converting channel (30–40% close rate on referrals).',
    goal: 'Get 1–2 warm introductions from each happy customer',
    ideal_for: ['Post-onboarding (60 days in)', 'After a positive review or NPS', 'After a renewal'],
    avg_reply_rate: '35–50% (these are warm customers)',
    tools_needed: ['Smartlead / Instantly'],
    tags: ['referral', 'customer', 'expansion'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: '{{first_name}} — quick favour?',
        body: `Hi {{first_name}},

It's been great working with you — [specific win they've had with your product].

I have a quick ask: do you know 1–2 other [ICP role]s at [ICP company type] who might benefit from [product]?

If so, a quick introduction by email would mean the world. Just reply and I'll take it from there — no awkward sales pitches, I promise.

{{sender_name}}`,
      },
      {
        day: 4, type: 'email', native: true,
        subject: 'One more thought on the referral',
        body: `Hi {{first_name}},

Following up on my note — if it helps, here's a template you could forward:

---
"Hey [friend], thought of you — I've been using [product] for [outcome] and it's been great. Might be worth a quick chat with {{sender_name}}: [calendar link]"
---

Feel free to edit it however you'd like. And as always — there's [referral incentive if any] in it for you if they sign up.

{{sender_name}}`,
      },
    ],
  },

  // ─── 9. Product Launch Blitz ─────────────────────────────────────────────
  {
    id: 'product-launch-blitz',
    name: 'Product Launch Blitz',
    emoji: '🎯',
    description: 'Announce a new feature or product to your warmest leads and past lost deals with urgency.',
    goal: 'Drive trials / demos in the 2-week launch window',
    ideal_for: ['New feature announcements', 'V2 launches', 'Beta openings', 'Price changes'],
    avg_reply_rate: '14–20%',
    tools_needed: ['Smartlead / Instantly', 'LinkedIn Sales Navigator'],
    tags: ['launch', 'announcement', 'urgency'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: '{{first_name}} — [Product/Feature] is live today',
        body: `Hi {{first_name}},

Big news: [Product/Feature] launched today.

Here's why I thought of you specifically: [1-sentence personalised reason based on their company or past conversation].

[2-sentence description of what it does and the main benefit]

First [X] customers get [early access / bonus / price lock]. Here's the link: [link]

{{sender_name}}`,
      },
      {
        day: 1, type: 'linkedin', native: false,
        message: `{{first_name}}, we just launched [Feature] and immediately thought of {{company}}. DM me if you want a private walkthrough before we go wide — happy to prioritise you.`,
        note: 'Post your launch on LinkedIn first (personal post) so this DM references something public. Screenshots or demo GIFs in the post dramatically increase response rates.',
      },
      {
        day: 4, type: 'email', native: true,
        subject: 'Early access closes Friday — {{first_name}}',
        body: `Hi {{first_name}},

Quick reminder: the [early access / launch pricing / beta spots] for [Feature] close this Friday.

[One-liner on what they'll miss if they wait]

If you want in, here's the link: [link]
Or grab 15 mins to talk through it: [calendar link]

{{sender_name}}`,
      },
      {
        day: 7, type: 'email', native: true,
        subject: 'Last chance — [Feature] early access',
        body: `Hi {{first_name}},

Today's the last day for [early access / launch pricing].

After today: [price goes up / feature goes to waitlist / etc.]

Here's the link if you want to lock it in: [link]

{{sender_name}}`,
      },
    ],
  },

  // ─── 10. SDR → AE Handoff (Warm Transfer) ───────────────────────────────
  {
    id: 'sdr-ae-handoff',
    name: 'SDR → AE Warm Handoff',
    emoji: '🎽',
    description: 'Nurture sequence designed for SDR-generated leads being transitioned to an Account Executive. Maintains momentum post-handoff.',
    goal: 'Keep deal momentum alive through the SDR → AE transition',
    ideal_for: ['Qualified leads post-discovery', 'Handoffs from Wyber AI SDR', 'Pipeline acceleration'],
    avg_reply_rate: '28–40% (pre-qualified, already engaged)',
    tools_needed: ['Smartlead / Outreach.io', 'JustCall / Aircall'],
    tags: ['handoff', 'qualified', 'pipeline', 'acceleration'],
    steps: [
      {
        day: 0, type: 'email', native: true,
        subject: '{{first_name}} — introducing [AE Name]',
        body: `Hi {{first_name}},

Quick intro: I've been working with {{company}} on [specific topic from discovery], and I want to bring in [AE Name], our [title], who specialises in exactly this.

[AE Name] will be your main point of contact from here. I've briefed them on [key details] so you won't have to repeat yourself.

[AE Name] — {{first_name}} is evaluating [solution] for [use case]. They're most interested in [pain point 1] and [pain point 2].

{{first_name}} — does [proposed meeting time] work for an intro call with [AE Name]?

{{sender_name}} (SDR)`,
      },
      {
        day: 0, type: 'call', native: false,
        script: `"Hi {{first_name}}, this is [AE Name] from [company] — [SDR name] just introduced us. I've read all the context from your earlier conversations and I want to make sure this transition is seamless. Is now a good time for 5 minutes? I just want to confirm a few things before our [upcoming meeting]."`,
        duration_min: 5,
        note: 'The AE should call within 2 hours of the email introduction. Speed signals seriousness. Reference the SDR by name to validate the handoff.',
      },
      {
        day: 2, type: 'email', native: true,
        subject: 'Prep for our call, {{first_name}}',
        body: `Hi {{first_name}},

Looking forward to our call on [date/time]. To make it as useful as possible, I put together:

1. [Relevant case study for their industry]
2. [Proposed agenda — 3 bullet points]
3. [Any open questions from discovery]

Let me know if there's anything specific you'd like to cover or if you need to adjust the time.

[AE Name]`,
      },
      {
        day: 1, type: 'linkedin', native: false,
        message: `{{first_name}}, [AE Name] here — [SDR name] just made an intro. Really looking forward to our conversation about [topic]. Connected here so you have another easy way to reach me.`,
        note: 'The AE should send this LinkedIn connection request on the same day as the email. It reinforces the handoff and gives the prospect multiple touchpoints.',
      },
    ],
  },
]

export function getTemplateById(id: string): SequenceTemplate | undefined {
  return SEQUENCE_TEMPLATES.find(t => t.id === id)
}

export const TEMPLATE_CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Cold outreach', value: 'cold' },
  { label: 'Warm / Inbound', value: 'warm' },
  { label: 'Enterprise', value: 'enterprise' },
  { label: 'Re-engagement', value: 'reengagement' },
  { label: 'Customer success', value: 'customer' },
]
