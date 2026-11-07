# Ahmedabad lead plan

Goal: owners of small teams (1–50 people) in Ahmedabad, technical or not, to email and to book booth meetings. Not agriculture.

## Honest limit
Nobody can be absolutely sure about a scraped or purchased list. What we can do is make every row pass checks we can prove, and spot-check a sample by hand before anything is sent. The plan below is built around that.

## Sources, checked on 1 Nov 2026
1. **Apollo (primary).** Your existing `APOLLO_API_KEY` works. A search for founder/owner/CEO titles, Ahmedabad, 1–50 employees returns about 20,000 raw matches, so we filter hard. Search is free of credits. Revealing an email costs Apollo credits (spend needs your OK). The results carry real titles and company names, which is what we need to judge "owner of a small team".
2. **Apify Google Maps scraper (secondary).** For small local businesses Apollo doesn't cover. Listed at roughly $2–4 per 1,000 places plus about $2 per 1,000 for website contact details (prices vary by actor, so confirm on the actor page). It gives business name, phone, website, address. It does not give the owner's name, so these rows suit WhatsApp or phone follow-up more than named email.
3. **Not using:** scraping LinkedIn directly (the Proxycurl lawsuit makes this a legal risk), and Apollo-UI scrapers on Apify (they scrape a site whose terms forbid it).

If you share the Apify key, put it in `.env.local` as `APIFY_TOKEN` rather than pasting it in chat. Keys pasted in chat sit in the history. I can read it from there.

## Status (1 Nov)
- Apollo: 73 verified leads delivered in `leads/ahmedabad-leads-batch1.csv`. Apollo then ran out of credits.
- Apify: token saved in `.env.local`. Account is on the free plan ($5 monthly credit, none used). Chosen actor: `code_crafter/leads-finder`, $0.002 per lead plus $0.02 per run (FREE tier price), 99% success over 143,000 runs in 30 days. It refuses to run until you approve its "full account access" permission in the Apify console, so no Apify credits are spent yet.
- Apify filters set in `scripts/gujarat-expo-apify.mjs`: country India, city Ahmedabad, titles founder / co-founder / owner / proprietor / CEO / managing director / partner, seniority founder / owner / c-suite / partner, company size 1–10 / 11–20 / 21–50, email status `validated` only, excluded industries agriculture / farming / dairy / ranching / fishery / mining & metals / food production / tobacco, excluded keywords agro / farm / dairy / fertilizer / pesticide / seeds / poultry / mining. IT services stay in.

## Who qualifies
- Title contains founder, co-founder, owner, proprietor, managing director, CEO or partner.
- Company based in Ahmedabad (city on the company record, not just the person).
- 1–50 employees.
- Company type (updated 1 Nov): startups and service businesses, such as agencies, consultancies, clinics, education, D2C brands and other small service firms. Shops, factories and traders only if they clearly look like a startup.
- IT services firms and other tech companies stay in (technical or non-technical both count).
- Excluded: agriculture, farming, dairy, fisheries, mining. Also large corporates and branch offices of big firms.
- Apollo search results do not include industry, so the industry exclusion is applied after the email reveal, using the industry field on each record. Rows that fail are dropped before they reach the CSV.

## Verification gates (every row must pass)
1. Company has a live website and a domain that resolves.
2. Email domain has MX records, then a Continuum bulk verify (valid only). Past runs on India data had about 8% of "valid" still bouncing, so a second verifier runs before volume sends.
3. Owner-of-the-company check: title plus company size from the same record.
4. Dedup: one person per company, plus drop any of your own addresses (`reconsignal`, `continuum`, `wyberai`, your Gmail).
5. Manual spot check of 30 random rows (open the website, confirm it is a real small business in Ahmedabad). If more than 3 fail, we tighten filters and rerun before sending.

## Deliverable
The usual 16-column sequencer CSV (First Name, Last Name, Email, Phone Number, Company Name, Website, LinkedIn Profile, Location, Status, Category, ESP Type, Current Sequence Number, url, country, industry, job_title), saved to `Desktop\Wyber Ai\Gujarat Tech Expo\`, with `url` set to the `/expo` link plus UTM.

## What I need from you
- OK to spend Apollo credits (suggest 500 rows first).
- The Apify key (in `.env.local`) if you want the Google Maps list as well.
- Any industries to exclude besides agriculture.
- Confirm the expo dates (27–29 Nov 2026 comes from my notes) and the booth number.

## Sending notes
- Cold email goes through Smartlead only. Continuum/SES must not carry cold outreach.
- Meta ads target by place and age, not by this list. Uploading scraped emails as an audience needs consent we don't have.
- Emailing individuals in India is covered by the DPDP Act. Keep the unsubscribe line, honour opt-outs, and only email business addresses.
