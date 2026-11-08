# WyberAi automation runbook

How the company runs itself, what you do each day, and where to look when something breaks.
Written for the founder. Every name below is the real one in the code, and a test checks this file still
mentions every scheduled job and every agent, so it cannot quietly go stale.

## Your day in ten minutes

1. **Morning email.** The daily revenue brief arrives at about 8:30 India time: pipeline, who to contact first,
   drafts waiting for you, accepted quotes that are not paid.
2. **Open `/admin/agents`.** Approve, edit or reject the drafts. Nothing is ever sent without you:
   you tap "Open WhatsApp" or "Open email", send it yourself, then tap "I sent it".
3. **Open `/admin/crm`, Today queue.** Anyone overdue is at the top. When someone replies, choose
   "They replied" in the activity box: it moves them to Replied and the follow-up agent drafts an answer.
4. **Content.** Open `/admin/growth`. Today's post topic and its first line are there. Edit the Content agent's
   draft from the Agents page, then post it.
5. **Mondays.** The weekly report arrives at about 9:00 India time.

At any time, open `/admin/ask` and ask for any number, report or list in plain words.

## What runs by itself

All times India time. The full list with plain descriptions is on `/admin/today`.

| Job (path) | When | What it does |
|---|---|---|
| `/api/cron/ops-agents` | every 3 hours | The agents write new drafts for your approval. Nothing is sent. |
| `/api/cron/crm-brief` | daily 8:30 | Refreshes the CRM from every source, emails the daily brief. |
| `/api/cron/watchdog` | daily 8:15 | Checks the automation is healthy, including a tiny live test of the AI key. Emails only when something is wrong. |
| `/api/cron/weekly-report` | Mondays 9:00 | The weekly report email. |
| `/api/cron/expo-sequence` | daily 10:00 | The expo email sequence (reminder, thanks, follow-up) to booth leads who are due one. |
| `/api/cron/email-drip` | daily 16:00 | Lifecycle emails to signed-up users. |
| `/api/cron/daily-credits` | daily 5:30 | Daily free credits for users. |
| `/api/cron/security-rescan` | daily 8:30 | Re-checks published apps for security problems. |
| `/api/cron/weekly-digest` | Mondays 14:30 | Weekly summary email to users. |
| `/api/cron/consultation-reminders` | every 15 minutes | Reminders for booked consultation calls. |
| `/api/cron/employee-scheduler` | every 15 minutes | Runs customers' AI employees on their schedules. |
| `/api/cron/agent-scheduler` | every minute | Runs customers' scheduled automations. |
| `/api/cron/mcp-consumer` | every minute | Processes requests from the Claude connector. |
| `/api/cron/wpl-monthly-reminder` | last days of the month | Month-end contest reminder. |

## The company agents

All of them only DRAFT. A person approves and sends. Each can be switched off on the Agents page.

| Agent | id | What it drafts | Who it is for |
|---|---|---|---|
| Outreach | `outreach` | First message to a new lead | the lead |
| Follow-up | `followup` | A nudge for quiet leads, or an answer to a reply | the lead |
| Meeting prep | `meeting_prep` | A one-page brief before a booked meeting | you |
| Proposal outline | `proposal` | A scope outline after a meeting; no price | you |
| Weekly coach | `weekly_coach` | What is stuck and what to do first | you |
| Client onboarding | `onboarding` | A kickoff checklist when a deal is won | you |
| Re-engage | `reengage` | One gentle message to a lead that went cold | the lead |
| Content | `content` | LinkedIn posts from the content calendar | you to publish |
| Collections | `collections` | A payment reminder for an accepted, unpaid quote; never states an amount | the client |
| Research | `research` | A cited web brief on a lead; says "could not confirm" if unsure | you |

Rules enforced in code, not just in the prompts: no prices to customers, no promises, no invented history
("we met", "you visited"), no placeholders, no AI mentions, only wyberai.com links (the research agent
alone may cite its sources), and nobody who said stop or is tagged `do-not-contact` is ever written to.

## Kill switches (Vercel environment variables)

| Variable | Effect |
|---|---|
| `OPS_AGENTS_DISABLED=true` | Stops every company agent. |
| `CRM_BRIEF_DISABLED=true` | Stops the daily brief. |
| `WEEKLY_REPORT_DISABLED=true` | Stops the weekly report. |
| `WATCHDOG_DISABLED=true` | Stops the health check. |

Each agent also has its own on/off switch on the Agents page.

## Settings the automation needs

| Variable | Why |
|---|---|
| `ANTHROPIC_API_KEY` | Agents and Ask cannot work without it. |
| `CRON_SECRET` | Every scheduled job refuses requests without it. |
| `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` | The database. |
| `NEXT_PUBLIC_INTENT_EXPERIMENT=1` | Turns the adaptive homepage on for the public (India). Leave unset to keep it owner-only. |
| `OWNER_PREVIEW_KEY` | Lets your own browser see the adaptive homepage before it is public. |
| `CRM_INR_PER_USD` | Rupees per dollar used only to roll accepted rupee quotes into the dollar pipeline. Default 85. |
| `NEXT_PUBLIC_APP_URL` | Base address used in emails and quote links. |

## Database setup (run once, in this order)

The migrations are in `supabase/migrations`. The automation needs these, in order:
`20261109000000_internal_crm.sql`, `20261109010000_ops_agents.sql`, `20261109020000_crm_quotes.sql`,
`20261109030000_ops_agents_more.sql`, `20261109040000_collections.sql`, `20261109050000_research_agent.sql`.
Every page and job tolerates a missing table: it reports it instead of crashing.

## When something looks wrong

1. Ask the assistant: "Is everything healthy?" or open `/api/cron/watchdog?dry=1` while signed in as admin.
2. **No drafts appearing:** check `ANTHROPIC_API_KEY`, then `OPS_AGENTS_DISABLED`, then the Agents page for a
   "backlog" note (agents pause when 40 drafts are waiting unreviewed).
3. **No emails:** check `CRON_SECRET`, then the job's logs in Vercel (Cron Jobs).
4. **Agents write something wrong:** reject the draft and pick a reason. Recent rejection reasons are fed back
   to the agent so it stops repeating the mistake.
5. **Homepage looks wrong:** add `?xp=control` to the address to see the original page, or unset
   `NEXT_PUBLIC_INTENT_EXPERIMENT` and redeploy to switch the adaptive homepage off for everyone.
6. **Everything is on fire:** set `OPS_AGENTS_DISABLED=true`. The site and customers' apps are unaffected.

## What is NOT automated (on purpose or for now)

- Sending any message. A person always sends.
- Prices and quote terms. Agents never state them; you type them into a quote.
- Reading your WhatsApp or email replies. You log a reply in one tap; there is no inbox connection yet.
- Hindi and Gujarati wording has not been reviewed by a native speaker.
- Paid advertising is not used.
