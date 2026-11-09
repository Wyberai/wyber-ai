# SEO and AEO: the daily 15 minutes

Why daily: search and answer engines reward a site that is healthy, current and talked about. None of that is a one-off fix. This file is the routine. It is written so that on a bad day you can do the first block (5 minutes) and stop.

Where we are (9 Nov 2026): 38 of about 254 known pages indexed, 120 clicks in three months. The technical faults found that day are fixed (canonicals, sitemap, robots, titles, markup). What moves the number now is **crawl priority and authority**: links and mentions from other sites, and content worth citing. So the routine is mostly off-site and content, with a quick health check to make sure nothing regresses.

## The 15 minutes

| Min | Block | What to do |
|---|---|---|
| 2 | Health | `node scripts/seo-health.mjs`. Green means go on. Any "problem" line: fix or ask Claude to fix it before anything else. |
| 3 | Search Console | Open Overview. Note clicks and indexed pages in the log. Open **Indexing → Pages** only if the health script showed a problem. Then **Request indexing** for 2 URLs from the queue below (new or updated pages only). |
| 8 | Today's task | Pick the task for the weekday (next section). |
| 2 | Log | One line in `docs/seo/LOG.md`: date, what you did, the indexed number, clicks. |

## Today's task, by weekday (8 minutes)

- **Mon: read the data.** Search Console → Performance → last 28 days → Queries. Write down the 3 queries with the most impressions and a position worse than 10. Those are the pages to improve this week.
- **Tue: improve one page.** Take one of Monday's queries. Ask Claude: "improve the page for <query>". Claude proposes the change; you approve; it is committed. Then request indexing.
- **Wed: one listing.** Submit WyberAi to one directory or review site from the list below, with the text from `docs/seo/OFFSITE.md` (Claude drafts it).
- **Thu: one helpful answer.** Find one question on Reddit, Quora, Hacker News, Indie Hackers or Stack Overflow about building an app without code, an AI app builder or a Lovable alternative. Answer it properly. Mention WyberAi only if it really fits, and say you are the maker.
- **Fri: check the answer engines.** Ask two prompts from the bank in ChatGPT, Perplexity and Gemini. Note whether WyberAi appears, what is cited instead, and which sources are named. The cited sources are your link targets for next week.

## Request-indexing queue (2 a day, in this order)
1. https://wyberai.com/blog/ai-workflow-automation-guide  (crawled 1 Jul, not indexed; content updated 9 Nov)
2. https://wyberai.com/blog/what-are-ai-agents-guide  (same)
3. https://wyberai.com/vs/lovable
4. https://wyberai.com/vs/bolt
5. https://wyberai.com/vs/replit
6. https://wyberai.com/lovable-alternatives
7. https://wyberai.com/use-cases/ai-app-builder
8. https://wyberai.com/use-cases/build-saas-without-code
9. https://wyberai.com/websites
10. https://wyberai.com/mcp
After these, add every new page the day it is published.

## Directory and listing candidates (verify each still exists and is free before submitting)
Product Hunt, AlternativeTo, SaaSHub, G2, Capterra, There's An AI For That, Futurepedia, BetaList, Indie Hackers (product page), DevHunt, Uneed, StackShare, Hacker News (Show HN, once, when there is a real story), dev.to and Hashnode (cross-post articles with a canonical link back to wyberai.com).
Only submit to a place where the product is a real fit. One good listing a week beats ten in one day.

## Answer-engine prompt bank (use two per Friday, rotate)
1. What is the best AI app builder for a small business owner with no coding experience?
2. Lovable alternatives that build real mobile apps too
3. Which vibe coding tools include a security scan before publishing?
4. How do I build an app from a plain-English description and own the code?
5. What is the cheapest way to build a web app with AI in 2026?
6. AI tools that connect to Claude through MCP to build and deploy apps
7. How do I replace a paid SaaS tool with my own app?
8. Best AI website builder for a local business in India
9. Bolt.new vs Lovable vs Replit: which should a non-developer use?
10. How do I stop AI-built apps from looking generic?
Log for each: appears yes or no, position, sources cited.

## Weekly (Monday, 30 minutes instead of the daily task)
- Indexed pages and clicks, compared with last Monday.
- Search Console → Links: any new sites linking to us.
- Pick the one page to write or improve this week (see the content queue).
- Re-run the Friday prompts if the answer-engine results changed.

## Monthly (first Monday)
- Re-verify competitor prices and credits on the `/vs` pages before changing any claim (Lovable, Bolt, Replit, v0, Cursor change often). Ask Claude to re-check and update, with the date.
- Update `public/llms.txt` if plans or features changed (a test keeps the prices in step with the plan file).
- Re-run the full crawl audit (ask Claude: "run the monthly SEO audit").

## Content queue (write one every week or two)
1. A proof article: the same prompt built in WyberAi and two other tools, with real screenshots and the prompts. The "no generic AI slop" story, shown, not claimed.
2. What is vibe coding? A plain guide with a clear definition, the real limits, and when to use it.
3. Best vibe coding tools in 2026: an honest comparison with verified prices, including where others are better.
4. How WyberCode 1.0 builds an app, step by step (staged builds, security scan, self-repair). No claims about training or owning a model.
5. A real customer or demo build story with the numbers (time, credits, result).
6. GST, invoices and stock apps for Indian small businesses (India searches are most of your traffic).
Rules for every article: one clear question answered in the first paragraph, real screenshots, no claim we cannot show, a date and a "last checked" line.

## What not to do
- Do not publish many thin pages. Google already holds back 98 of the generated ones.
- Do not buy links or use link-exchange schemes. Do not post fake reviews.
- Do not change titles or URLs of pages that already rank without a reason.
- Do not request indexing for the same URL more than once a week.

## How Claude helps in about two minutes of your time
Say "SEO today" in chat. Claude will run the health check, say what the weekday task is, and draft whatever it needs (the listing text, the answer to post, the page change, the article outline). You review and publish from your own accounts.
