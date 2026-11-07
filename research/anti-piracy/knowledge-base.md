# Anti-Piracy Knowledge Base — Hollywood-Grade Security for Bollywood & Regional Cinema

**Purpose of this file:** working knowledge base for a new venture concept — an AI-driven anti-piracy platform aimed at bringing Hollywood/live-sports-grade detection and enforcement speed to Bollywood and regional Indian cinema (Telugu/Tamil/Kannada/Hindi), which is currently served only by slow, manual, reactive enforcement. This is a **separate venture from WyberAi** — kept in its own folder so it doesn't mix with the WyberAi product codebase.

Last updated: 2026-08-28. All facts below are sourced from live web research (URLs inline); re-verify anything load-bearing before it goes into a pitch deck or gets built against, since this is a fast-moving space and vendor capabilities/numbers change.

---

## 1. The Vision

Build a platform that gives regional/Bollywood producers the same class of protection that DAZN/NBA-grade live sports piracy vendors already give top-tier rightsholders — sub-5-second detection, sub-5-minute validated takedown, infrastructure-level disruption — but purpose-built for the two distribution channels that actually dominate Indian film piracy: **Telegram** and **pirate IPTV/reseller networks**, in Indian regional languages, plugged directly into India's own (surprisingly fast) government takedown mechanism.

The white space is specific: incumbents (Irdeto, NAGRA, Friend MTS, Vobile) protect major studios and top-tier live sports extremely well. Nobody has brought that same real-time SLA down-market to regional-language, high-velocity, Telegram/IPTV-first piracy — which is a **different technical problem** (network-graph-shaped, bot-mediated, multilingual) than the CDN/web-crawl problem the incumbents solve.

---

## 2. How Telegram Piracy Actually Works (the deepest, most current technical picture)

Source: ["Binge, Bot, Repeat: Unpacking the Ecosystem of Video Piracy on Telegram"](https://arxiv.org/html/2605.08418v2) (arXiv 2605.08418) — the single best technical resource found. Academic study, open-sourced tooling and dataset, published 2026. Researchers: Louisiana State University (Scalable Security Research Lab) + University of Texas at Arlington.

### 2.1 Network topology

Telegram piracy is **not** a flat list of channels — it's a directed graph engineered for resilience:

- Mapped ecosystem: **2,312 nodes** (1,875 channels + 437 bots), **3,843 edges** (internal promotion links).
- **27 "super-channels"**: routing hubs with 23+ outgoing links each; the most-connected channel linked to 74 unique destinations.
- **40 "terminal channels"**: final content-consumption endpoints, no further redirection.
- **93.92%** of channels sit inside one connected component — i.e. almost the whole ecosystem is interlinked, not isolated silos.
- **177 indirect (2+ hop) relationships** — users can still reach content even if a direct link is removed. This is deliberate structural redundancy, explicitly built to survive takedowns.

**Implication for detection systems:** a crawler that only follows direct/1-hop links will systematically undercount the ecosystem. You need **recursive graph traversal with depth ≥2** to get full coverage — this is exactly what the researchers' tool (Anti-RIP, see §2.4) does.

### 2.2 Bots as infrastructure, not just chatbots

Five distinct bot categories were identified, each doing a specific ecosystem job:

1. **Content delivery bots (21 found)** — direct file/link delivery on request.
2. **Dynamic retrieval bots (13)** — menu-driven, query-based content navigation.
3. **Channel promotion bots (9)** — force users to join N other channels before releasing a download link, which is the literal audience-growth engine for the whole network.
4. **Content ingestion bots (7)** — accept user-submitted uploads with quality gating.
5. **Payment processing bots (2)** — handle Google Pay / Apple Pay / crypto transactions.

Critically: **8 content-delivery bots auto-delete their own responses within minutes and disable forwarding** — an active anti-forensics measure specifically to defeat evidence collection. Any monitoring system has to capture bot responses in near-real-time or the evidence disappears before a human (or even an automated pipeline) can act on it.

### 2.3 Monetization models

Three patterns, none of which route through anything a normal payment-fraud system would flag:

1. **Cloud-provider-credit model** (e.g. Terashare) — downloads consume purchased cloud credits.
2. **Quality-tiered freemium** — free up to 1080p, 4K/premium gated behind payment.
3. **Incentivized uploads** — uploaders paid in cloud-storage credits, crowdsourcing the piracy supply chain.

Payment instructions are revealed **dynamically, only on user interaction with a bot** — meaning static/URL-based abuse scanners never see the commercial layer at all. This is a specific, named evasion technique worth building a detector around.

### 2.4 The reference detection architecture: Anti-RIP (open source, directly reusable as a design pattern)

GitHub: [Scalable-Security-Research-Lab/BingeBotRepeat](https://github.com/Scalable-Security-Research-Lab/BingeBotRepeat) (AGPL v3+)

This is effectively a **published blueprint** for exactly the kind of system this venture would need to build. Pipeline:

1. **Discovery** — continuous, randomized Telegram invite-link probing to surface new channels (no reliance on tips/reports).
2. **Screening** — a small fine-tuned model (Llama3.2:1B, trained on 100k labeled piracy posts + 300k benign) does first-pass classification. Reported **98% accuracy, F1=0.97**.
3. **Recursive expansion** — from any flagged channel, crawl linked entities to depth=2 to catch the super-channel/terminal-channel graph structure from §2.1.
4. **Artifact extraction** — screenshots, links, and title-matching against TMDb (The Movie Database) to identify *which* film/show is being pirated.
5. **Taxonomy/context labeling** — a larger LLM (Gemma3:27B in their setup, 99.2% piracy-detection accuracy / 97% taxonomy accuracy) labels *what the channel is doing* (hosting, redirecting, monetizing) rather than just "infringing: yes/no." **This contextual labeling is what drove better enforcement outcomes** (see §2.5).
6. **Multilingual normalization** — TranslateGemma:12B converts non-English posts to English before classification, which matters enormously for an India-first product given the language diversity noted in §2.6.
7. **Evidence-backed reporting** — structured reports (not just raw URLs) sent to Telegram and rightsholders.

**Real-world deployment results (61 days, Feb 3–Apr 10 2026):** scanned 249,133 newly discovered channels → flagged 802 piracy channels (median age **under 5 days** — i.e. catching them almost at birth) + 299 connected channels + 108 bots → **524 of 1,101 reported channels (47.6%) inaccessible within two weeks**, 309 removals explicitly confirmed by Telegram, 71/108 bots disabled. Live production accuracy: **4 false positives in 1,000 reviewed posts (99.6%)**.

**The single most actionable finding for a product roadmap:** contextual/taxonomy-based reports got **31.4% removal rates vs. 12.7% for plain URL-only reports** (p<0.05, statistically significant). *How you report matters as much as detecting.* A "world-beater" product should never send bare URLs — it should send structured evidence packages (what the channel does, its role in the graph, screenshots, title match) exactly like Anti-RIP does. Also: 14/17 publishers acknowledged reports, 9 explicitly credited the tool for the takedown — meaning rightsholders will act fast on good evidence, the bottleneck is the *quality of what's handed to them*, not their willingness.

### 2.5 Scale/impact context

- Estimated financial impact across their (partial) observed dataset: **$17.49B**, US content alone **$8.17B**, using a conservative 1% view-to-consumption conversion.
- Top targeted rightsholders in their dataset: Toei (17%), Netflix (15%), Warner Bros. Discovery (12.4%).
- Cross-border pattern: pirated content deliberately routes through **less-scrutinized language channels** — e.g. more US-content posts flow through Persian-language channels (32,960) than English ones (10,768); Korean content is most prevalent in **Burmese**-language channels. Operators are explicitly picking obscure languages to reduce scrutiny — the inverse of this is a genuine opportunity: **nobody with a "world-beater" claim is doing deep monitoring in Indian regional languages (Telugu, Kannada, Tamil, Malayalam, Bhojpuri, Punjabi) specifically**, which is exactly the blind spot Indian producers need covered.

### 2.6 How to actually report/act on Telegram content today (the manual baseline you're automating away)

- Telegram has **no takedown API** — reporting is via email to `dmca@telegram.org` with a properly formatted DMCA-style notice (contact info, ownership proof, original work, direct URLs). ([DMCA.ai guide](https://www.dmca.ai/articles/dmca-takedown-telegram), [TakedownPanel guide](https://takedownpanel.com/report-copyright-infringement-telegram/))
- Only **public** content is actionable this way (channels, groups, bots, sticker sets) — private channels are out of reach via this route.
- Response time: days to weeks; individual posts get removed far more often than whole channels; channels that do get banned frequently **reappear under a new name within days** — meaning ongoing/continuous monitoring is non-negotiable, this is not a one-and-done takedown problem.
- **India-specific and much faster alternative exists — see §4.** This is the real unlock for an India-first product: you don't have to rely on Telegram's slow self-policing at all.

---

## 3. How IPTV/Pirate-Streaming Reseller Networks Work

### 3.1 Technical architecture

- Two dominant client protocols: **M3U** (a single static playlist URL) and **Xtream Codes** (portal URL + username + password, dynamic, supports per-user auth/expiry — this is what almost all commercial-grade pirate IPTV runs on). ([iptvexplained.com](https://iptvexplained.com/articles/m3u-vs-xtream-codes))
- **Xtream Codes reseller panel**: for as little as **€50/month an operator could run and resell up to 1,000 user accounts** — this literally turnkeys piracy into a franchisable business. By 2019, an estimated **70–80% of pirate IPTV in Europe ran on Xtream Codes.** ([Grokipedia: Xtream Codes](https://grokipedia.com/page/Xtream_Codes))
- The panel software itself doesn't host any streams — it's the **access-control/routing middleman**. When the original Xtream Codes operation was shut down in 2019 on copyright charges, it took down the whole dependent network in one move — but cracked clones reappeared almost immediately. This tells you infrastructure takedown works but needs to be continuous, not a single strike.
- Distribution structure mirrors Telegram: **three-tier** — head-end operators → resellers (sell via Telegram/Facebook/storefronts, tiered pricing, "customer support") → end consumers on set-top boxes or modified apps. Payment via crypto/PayPal/anonymous processors. ([EzlaScan 2026 report](https://www.ezlascan.com/blog/iptv-piracy-global-crackdown-2026))
- Scale: **4,200+ active IPTV reseller operations tracked across 31 countries** as of January 2026; global cost estimated at **$67B/year**.

### 3.2 Detection & enforcement techniques that actually work

- **Content-based**: automated content recognition against known reference titles, continuously scanning web/social/app-store/Telegram for unauthorized restreams during live windows.
- **Infrastructure-based (the higher-leverage approach)**: reverse-engineer the pirate app/client to extract the actual **head-end server IP/DNS**, not just the consumer-facing URL. Tools like "ServerSweep"-style approaches trace load balancers back to the source, then hit hosting providers/CDNs/domain registrars/payment processors **in parallel** — hosting abuse reports, CDN termination, domain suspension, payment processor notices, all simultaneously so the operator can't just swap one link. ([Removeyourmedia — Live Sports Piracy & IPTV](https://removeyourmedia.com/2026/02/24/live-sports-piracy-and-the-rise-of-iptv-streams-what-rights-holders-need-to-know/))
- **Real-world scale reference (EzlaScan, 2025):** 34,000+ infrastructure-level enforcement actions → 1,900+ reseller operations disrupted, 680+ head-end server clusters suspended, across 44 countries.
- **Evasion to plan for:** operators use **domain rotation and DNS fast-flux**, re-pointing within hours of a block — meaning detection has to be continuous/automated, and takedown requests need to target the server infrastructure (hosting/CDN/registrar), not just the consumer-facing domain, or you're permanently one step behind.

---

## 4. India's Legal & Enforcement Mechanism (the actual lever a product plugs into — this is the unfair advantage)

This is the most important section for a Bollywood/regional-first product, because **India already has a faster, government-run takedown channel that bypasses Telegram's slow self-policing entirely** — most producers/vendors simply aren't using it systematically.

### 4.1 Cinematograph (Amendment) Act, 2023

- **Section 6AA**: makes unauthorized audio-visual recording (camcording) of a film in a licensed cinema hall a specific criminal offense.
- **Penalties**: minimum 3 months to up to 3 years imprisonment, **and a fine up to 5% of the audited gross production cost** — a genuinely severe deterrent on paper. ([PIB press release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2241712&reg=3&lang=1))
- **Section 7(1B)(ii)** empowers government to notify intermediaries under **Section 79(3) of the IT Act, 2000** to disable access to infringing content — this is the mechanism that actually moves fast.

### 4.2 The government notify-and-block mechanism (the fast lane)

- The **Ministry of Information & Broadcasting has a dedicated institutional mechanism with nodal officers** who accept complaints from copyright holders (or authorized reps, or any individual) in a prescribed format.
- On verification, MIB (specifically the **Joint Secretary, Films**, who is authorized to issue takedown notices) issues a notice under Section 79(3)(b) directly to the intermediary (Telegram, an ISP, etc.), which is then **legally required** to disable access.
- **Real, current scale**: on 2026-03-11, the government notified Telegram to remove **3,142 channels** in one action; separately blocked **~800 websites** via ISPs. A broader tally cited elsewhere: **7,393 URLs and 4,996 Telegram channels blocked** cumulatively. ([Deccan Chronicle](https://www.deccanchronicle.com/nation/govt-blocks-3100-telegram-channels-800-websites-over-pirated-content-1944709), [IndianTelevision.com](https://indiantelevision.com/regulators/india-turns-up-the-heat-on-piracy-orders-telegram-to-axe-3142-channels-and-blocks-800-websites/), [NewKerala](https://www.newkerala.com/news/a/cinematograph-amendment-act-it-framework-strengthen-anti-piracy-enforcement-876.htm))

**Why this matters for the product:** this government channel can act on **entire batches of channels/URLs in a single notice**, at a speed and scale that Telegram's own `dmca@telegram.org` process cannot match, and it applies pressure Telegram is legally obligated to comply with (not just "may choose to"). A product that (a) does Anti-RIP-style continuous discovery + evidence packaging, and (b) has the workflow/relationships to feed verified batches directly into the **MIB nodal-officer pipeline** on behalf of producers, is functionally offering **faster enforcement than what Hollywood gets from Telegram's own DMCA process in the US** — a genuinely defensible, India-specific moat that global incumbents (built around US/EU DMCA norms) haven't optimized for.

### 4.2.1 Deep dive, 2026-08-28: the mechanism is barely used, and the primary source explains exactly why

Read the actual government office order directly (No. M-11017/1/2023-DO(FC), MIB, 3 November 2023) rather than relying on press summaries — worth doing because it changes the picture, and because it also **corrects a detail every secondary source got slightly wrong.**

**The nodal officer roster, confirmed from the primary document** (these are role-based appointments, not named individuals — they change with personnel):
- Joint Secretary (Films), Director (Films), and DS (Films-1) — MIB headquarters, 'A' Wing, Shastri Bhavan, New Delhi.
- Chief Executive Officer and Regional Officer — CBFC, Mumbai.
- Regional Officers — CBFC regional offices at Bengaluru, Chennai, Cuttack, Delhi, Guwahati, Hyderabad, Kolkata, and Thiruvananthapuram.

**The actual legal mechanics, from the notification template itself (Annexure to the office order):** once a nodal officer is satisfied a complaint is valid, they issue a notification citing Cinematograph Act §6AB (prohibits hosting/exhibiting an infringing copy) and §7(1B)(ii) (empowers action against intermediaries) together with IT Act §79(3)(b) and IT Rules 2021 Rule 3(1)(d). The notification lists infringing URLs in a table (built for batch submission — one notice, many URLs) and states the intermediary must **remove and disable access within thirty-six hours "without vitiating the evidence in any manner."**

**Correction to widely-repeated press figures:** most news coverage (and this file, previously) cited "48 hours" as the turnaround. The actual template text says **36 hours** for the intermediary's compliance window specifically. The two numbers likely describe different clocks — press "48 hours" may describe the nodal officer's own decision-to-notify turnaround, while 36 hours is what the primary document confirms as the intermediary's post-notice compliance deadline — but only the 36-hour figure is directly verified from a primary source here. Treat "48 hours" as unconfirmed secondary reporting until verified directly.

**The finding that matters most for the business case:** an RTI disclosure ([MediaNama, July 2025](https://www.medianama.com/2025/07/223-anti-piracy-nodal-officers-received-9-complaints-rti/)) revealed the nodal-officer mechanism received **only 9 complaints total** between its November 2023 launch and the RTI response — despite 700+ infringing sites having been reported to *other* channels over the same period, meaning demand for anti-piracy enforcement clearly exists, it's just not flowing through this specific fast lane. MIB's own stated reason: **complainants must physically submit a prescribed paper form — there is no online portal.** MediaNama's own conclusion was that the Ministry should build "a single, searchable portal for producers... to register and track their complaints" — which is, functionally, exactly the product surface `mib-nodal` (ARCHITECTURE.md §3.6) needs to become.

**What this changes about the opportunity:** this is not "a fast lane that's merely underexploited by competitors" — it's a fast lane that is **almost completely unused, with the regulator's own reporting pointing at the exact fix**, and apparently no dominant player has claimed this space (9 complaints in ~20 months rules out any large-scale existing operator). That's about as clean a white-space signal as this kind of research turns up.

**What remains a genuine, unresolved gap:** the actual complainant-facing intake form — the physical document a producer fills out and submits — is not published anywhere online that this research could locate. Only the notification-*to-intermediary* template (the nodal officer's output document) was found in the primary source. Getting the actual intake form template requires direct engagement with MIB/CBFC (a phone call, an in-person visit, or a fresh RTI request) — this is a real next step, not something further web research will resolve.

### 4.3 Existing criminal enforcement precedent

- Hyderabad Cyber Crime Unit dismantled the **iBomma/Bappam network** — 65+ mirror domains, described as causing "thousands of crores" in losses to the Telugu industry. ([source](https://www.newsonair.gov.in/hyderabad-cyber-crime-unit-arrests-mastermind-of-ibomma-and-bappam-piracy-racket))
- This shows India's cybercrime units *will* pursue and arrest operators of large-scale piracy networks when a strong evidence case is built — again, the bottleneck is **evidence quality and volume**, which is exactly what an AI monitoring pipeline supplies.

---

## 5. The Incumbent Vendor Landscape (competitive benchmark — what "Hollywood-grade" actually means in practice)

| Vendor | Core capability | Notable numbers |
|---|---|---|
| **Irdeto** | Forensic watermarking + piracy detection for OTT & live sports | Enterprise-grade, broad platform |
| **NAGRA (NexGuard)** | Forensic watermarking, integrated directly into Akamai's edge network for live/VOD | Edge-level embedding at CDN scale |
| **Friend MTS** | AI-driven 24/7/365 automated monitoring + watermarking + dynamic server blocking | 70% faster response vs. prior approach; 50%+ more tracked targets; **12,000 infringing servers blocked per live sports event** via Dynamic Delivery Server Blocking |
| **Vobile** | Multi-attribute fingerprinting, robust to edited/speed-altered content | Rights management + fingerprinting at scale |
| **Videocites** (DAZN partner) | AI video-recognition for live sports restreams | Validates stream legitimacy in **<5 minutes** vs. 30-min industry average; live with the NBA |
| **White Bullet** | AI scanning of text/image/video for ad-supported piracy, risk-scored prioritization | TAG Certified Against Piracy program member |
| **MUSO Protect** | Cross-surface monitoring (web, search, social, UGC) for film/TV/music/software/publishing | Broad detect-monitor-remove platform |
| **EzlaScan** | Infrastructure-level IPTV enforcement | 34,000+ actions/yr, 1,900+ reseller ops disrupted, 680+ head-ends suspended across 44 countries |
| **ACE / MPA** | Legal/criminal enforcement arm, not a monitoring vendor | Dismantled AnimePlay (Indonesia, 5M+ users, 60TB content, seized 29 GitHub repos + full backend) in March 2026 |
| **Verance (Cinavia)** | Audio watermarking embedded in theatrical DCP soundtrack, survives microphone re-recording | Compliant Blu-ray/hardware refuses to play audio if a "theatrical" watermark is detected on a retail disc — i.e. **camcording is provably traceable and playback-blockable at the hardware level**, not just detectable after the fact |

**Core technical baseline to match or beat**: ~5-second live-stream fingerprint match latency, ~95-96% match accuracy under transcoding/cropping/mirroring, ~96% automated takedown success rate once matched.

**Where none of them are optimized**: Indian regional-language Telegram/IPTV ecosystems, and direct integration with India's MIB Section 79(3)(b) government fast-lane. This is the wedge.

---

## 6. The Arms Race (must-know caveat before overselling "unbreakable")

- Peer-reviewed 2025–2026 research (NeurIPS 2024 paper, multiple 2026 arXiv follow-ups) demonstrates **diffusion-model "regeneration attacks"** can strip invisible watermarks from images/video with no visible quality loss — the attack treats the watermark's engineered statistical noise as something to denoise away.
- This is real, working, published research — not theoretical. ([NeurIPS 2024 paper](https://proceedings.neurips.cc/paper_files/paper/2024/file/10272bfd0371ef960ec557ed6c866058-Paper-Conference.pdf), [arXiv 2510.05978](https://arxiv.org/pdf/2510.05978))
- **Industry's actual counter-strategy (per Friend MTS 2026 predictions)** is not "build an unbreakable watermark" — it's **layer watermarking + fingerprinting + infrastructure-blocking simultaneously**, so an attacker has to defeat all three live, at scale, faster than the platform can re-detect and re-block. Make removal expensive/slow enough that the pirate's unit economics break.
- **Product implication:** never pitch a single-layer "watermark = solved" story to a sophisticated buyer (studio legal/anti-piracy teams will know this literature). Pitch the layered, continuously-adapting system — which also happens to be more defensible as a moat since it's an ops/data problem, not a single crackable artifact.

---

## 7. Synthesis — What a "World-Beater" Product Architecture Looks Like

Combining everything above into concrete system components:

### 7.1 Discovery layer (continuous, not report-driven)
- Randomized Telegram invite-link probing (Anti-RIP pattern) + recursive graph traversal to depth ≥2 to catch super-channel/terminal-channel structure.
- IPTV reseller discovery via monitoring Telegram/Facebook reseller storefronts, pirate app stores (modified APK scanning), and known Xtream-Codes-panel fingerprints/ports.
- SearXNG-style metasearch against a title database (TMDb-equivalent, extended with Indian regional-film metadata that TMDb under-covers) to catch content the moment it's indexed.

### 7.2 Classification layer
- Lightweight fast-path model (fine-tuned small LLM, Anti-RIP's Llama3.2:1B pattern) for first-pass piracy/not-piracy at ingestion scale.
- Larger LLM for **taxonomy/context labeling** (what the channel/server actually does — hosting, redirecting, monetizing) — proven to more than double enforcement success rates (§2.4).
- Mandatory multilingual pipeline (Telugu/Tamil/Kannada/Malayalam/Hindi/Bhojpuri/Punjabi/Bengali at minimum) — this is the single biggest technical gap versus every incumbent found in this research, all of whom are English/major-language-first.
- Perceptual video/audio fingerprinting (5-second-class latency, robust to transcode/crop/mirror/overlay) for the live-stream/camcording detection path specifically.

### 7.3 Evidence & reporting layer
- Structured, evidence-backed reports (screenshots, title match, channel-role taxonomy, network-graph context) — never bare URLs, per the proven 31.4% vs 12.7% removal-rate gap.
- Dual-track reporting: (a) direct-to-platform (Telegram DMCA email, standard for global reach) and (b) **batched submissions into India's MIB nodal-officer / Section 79(3)(b) mechanism** for Indian-jurisdiction content — this second track is the genuine speed/scale advantage over anything Hollywood-facing vendors currently offer for Indian content.
- Evidence capture has to be near-real-time given bots that self-delete responses within minutes.

### 7.4 Infrastructure-disruption layer (highest leverage, least built by anyone at the regional level)
- Reverse-engineer pirate IPTV clients to extract actual head-end server IP/DNS (not just consumer URLs).
- Parallel takedown fan-out: hosting abuse → CDN termination → domain registrar suspension → payment processor notice, fired simultaneously (per EzlaScan/Friend MTS pattern) so operators can't just hot-swap one link.
- Continuous re-scan for domain-rotation/fast-flux evasion — this can't be a one-shot takedown; it has to be a persistent monitoring loop.

### 7.5 Prevention layer (source-side, for later maturity — needs partnerships, not pure software)
- Per-DCP/per-screening forensic watermarking for theatrical exhibition (partnership with digital cinema server vendors/theater chains — this is how Cinavia/DCP watermarking already works and is the traceability backbone).
- Per-session dynamic watermarking for OTT/streaming release windows.
- These require studio/theater/OTT-platform integration, not something a monitoring SaaS can retrofit alone — sequence this *after* the detection/enforcement product has traction and trust.

### 7.6 Analytics/trust layer (what makes it sellable to Hollywood eventually)
- Real-time dashboards: piracy volume by platform/geography/language, revenue-impact modeling, leak-source attribution, takedown SLA tracking (mirroring what Friend MTS/Irdeto already show enterprise buyers).
- SOC 2/ISO 27001 compliance and chain-of-custody evidence logging — table stakes for any studio legal team to sign a contract.

---

## 8. Recommended Wedge & Sequencing

1. **Start**: Telegram + IPTV-reseller monitoring, India regional-language-first, with direct MIB Section 79(3)(b) batch-reporting integration as the headline differentiator no one else offers.
2. **Prove**: sub-5-day-old channel detection (matching Anti-RIP's demonstrated median), evidence-based reporting with a measurably higher removal rate than bare-URL reporting, and faster-than-Telegram-DMCA turnaround via the government channel.
3. **Expand**: add live-stream fingerprint matching (sub-5-second class) for theatrical/OTT day-1 release windows — this is where camcording and live-restream piracy actually hit revenue hardest.
4. **Layer in**: infrastructure-level IPTV disruption (hosting/CDN/registrar/payment fan-out) once discovery+evidence pipeline is proven.
5. **Move upmarket**: forensic watermarking partnerships (DCP-level, OTT session-level) once there's a case-study track record — this is the step that makes a "sold to Hollywood" pitch credible, because it requires trust built on the detection/enforcement layer first.

---

## 8.5. Anti-RIP Source Code Audit & Fork Scoping (read directly from the repo, 2026-08-28)

Cloned and read the actual code (not just the paper) at `Scalable-Security-Research-Lab/BingeBotRepeat`. Verdict: **it's a real, runnable pipeline**, not paper decoration — but it's narrower than the paper's framing suggests, and it comes with two decisions that have to be made before writing a line of fork code.

### Decision #1 — License (blocking, resolve first)

**Anti-RIP is AGPLv3.** The Affero clause is network copyleft: if a SaaS product is built on a fork/derivative of this code and users interact with it over a network (which is exactly the anti-piracy monitoring product being scoped), **the complete corresponding source of the whole service must be made available to those users** — not just the modified files, the whole service. This is very likely incompatible with a closed-source commercial SaaS.

Two honest paths:
1. **Study the code, don't fork it.** Reimplement the pipeline shape (discovery → hydrate → translate → classify → extract → report) clean-room, in a proprietary codebase, using Anti-RIP purely as an architectural reference (which is legitimate — ideas/methodology aren't copyrightable, the code text is). This is what "scope a fork" should probably mean in practice.
2. **Actually fork it and keep the whole product AGPL/open-source**, monetizing via hosting/support/SLA (the GitLab/Mattermost model) rather than closed IP. Only viable if the business model can live with that.
Given the "world-beater, sell to Hollywood" ambition, path 1 (clean-room reimplementation using this as a spec) is almost certainly the right call — flagging this explicitly so it isn't discovered later during diligence.

### Decision #2 — Operational risk: this uses a real human Telegram account, not a bot

`hydrate_channels.py` authenticates via **Telethon/MTProto as a real user account** (phone number + login code, stores a `.session` file) — not the Bot API. At the scale needed (hundreds of thousands of discovery probes, per the paper's 249K-channel sweep), this is a real account doing real-looking-suspicious behavior. Risk: **the account gets rate-limited or banned**, which stops the whole pipeline. A production fork needs a pool of registered numbers/accounts with rotation and backoff — this is an operational cost/risk line item, not a solved problem in the reference code.

### What's directly reusable as architecture (not code, given §Decision 1)

- **Discovery mechanism** (`discover_channels.py`): surprisingly low-tech and cheap — plain unauthenticated `GET https://t.me/<handle>` requests, regex-parsed for Telegram's own web-preview markup (`tgme_page_extra` div containing "N subscribers"). No Telegram API auth needed for this stage at all. Candidates are generated by brute-forcing combinations (single/bigram/trigram/concatenated) from a **hardcoded 57-word English seed vocabulary** — worth noting the list contains `bollywood`, `hindi`, `tamil` as isolated tokens, but **nothing for Telugu, Kannada, Malayalam, Bengali, Marathi, Bhojpuri, Punjabi, or common regional-piracy slang/handle conventions** — this seed list is the first thing that needs full rebuilding for an India-first product, and the value-add is almost entirely in a better, India-specific seed vocabulary + handle-pattern corpus, not in the probing mechanism itself.
- **Recursive crawl mechanic**: simple — extract `t.me/<handle>` links from message text via regex, BFS-queue them up to `--max-depth` (default 2). This is what achieves the "graph traversal" described in the paper; it is not a graph-algorithm-heavy system, just link-following with a depth cap and a visited-set.
- **Translation-first classification pattern**: detect-language (langdetect) → translate to English (local Ollama model) → classify the English text. This pattern is directly reusable and is the right shape for a multilingual India product — but the specific model (`translategemma:12b`) needs benchmarking on Telugu/Tamil/Kannada/Malayalam/Bhojpuri specifically before trusting it; translation quality on Indian low-resource languages/mixed-script "Tanglish"/"Hinglish" text (extremely common in Telegram piracy posts) is unverified and should be tested, not assumed.
- **The taxonomy itself** (`analysis/taxonomy_labelling/labels.txt`): a genuinely well-designed, reusable label schema — 4 mutually-exclusive primary labels (Direct Download, Channel/Bot Routing, Streaming/Magnet Links, Cloud Storage Links) plus ~20 secondary operational/ecosystem labels (Forced Join, Credit Purchase, Backup Channels, Content Delivery Bots, etc.) and a parallel benign-content taxonomy to reduce false positives. This taxonomy transfers directly — it's language/region-agnostic by design. Worth adopting as-is rather than reinventing.
- **Evidence-backed title matching** (`extraction.py`): Aho-Corasick exact-match against a TMDB-title automaton, with an LLM proposing candidates and a rule ("candidate title must literally appear as a substring in the post") rejecting LLM hallucinations before anything gets called a match. Good design pattern, but **depends entirely on `tmdb.sqlite` coverage** — and TMDB's coverage of Telugu/Tamil/Kannada/Malayalam regional titles is materially worse than its Hollywood coverage. This is the same gap already flagged in §9 below and is now confirmed as a hard blocker at the code level, not just a hypothesis.
- **Reporting/grouping logic** (`create_report.py`): groups infringing posts by matched production company against a simple JSON contacts list, builds one SQLite report per company, emails via Mailgun. Simple, reusable pattern — the fork's real work here is the contacts list itself: wiring in each Indian producer's actual abuse contact **and** a submission path into the MIB nodal-officer mechanism (§4.2), which is not email-shaped (it's a prescribed-format government complaint process) and will need its own integration, not a drop-in contact-list entry.

### What's a hard blocker or missing entirely (net-new engineering, not adaptable from this repo)

1. **The classifier model is fine-tuned on Western/anime-style piracy posts specifically.** The shipped LoRA adapter (`model/unsloth_telegram_labels/`, a fine-tune of `unsloth/Llama-3.2-1B-Instruct`) was trained on posts like the shipped sample — `"🔰 WITCH WATCH 🔰 ... Language: English Sub ... Quality: 720p, 1080p"`. Indian regional-piracy channel posts follow different conventions (different emoji use, Hinglish/Tanglish code-switching, different quality/format jargon, WhatsApp/Telegram-forward chain artifacts). **This model will need retraining on a freshly labeled Indian-piracy-post dataset** using the existing taxonomy — the training pipeline (`models/detection_model/training_scripts/finetune.py`) is reusable, but the training *data* is not, and building that labeled dataset (even semi-automated via a larger LLM doing first-pass labeling + human verification, mirroring their own methodology) is real, dedicated work.
2. **Zero IPTV/Xtream-Codes capability.** This entire repo only addresses the Telegram half of the problem in §3 of this knowledge base. There is no code here for Xtream-Codes-panel discovery, M3U/reseller-storefront monitoring, or infrastructure-level takedown — that whole layer (§7.4 in this file) has no open-source reference at all and is 100% original build.
3. **No video/audio content fingerprinting.** Anti-RIP only classifies **text** (post captions + attached filenames) — it never looks at actual video/audio content. It would catch a Telegram post advertising a pirated file, but would miss a raw camcorder livestream on Facebook/YouTube/Instagram with no accompanying text, or a stream where the pirate never posts a caption. The live-stream fingerprint-matching capability described in §2 of this knowledge base (Videocites/DAZN-style, ~5-second detection) is a completely separate, much heavier system (perceptual hashing against reference video/audio) that this repo does not provide even a starting point for.
4. **Fixed hardware assumption.** `predict.py` hard-requires a CUDA GPU (`raise SystemExit("CUDA not available")`) — fine for a research lab workstation, needs to become a properly provisioned GPU-inference service (or be swapped for an API-based classifier, e.g. Claude Haiku, at least for early-stage prototyping before investing in fine-tuning infra) for a real product.

### Net scoping conclusion

Anti-RIP is best used as a **detailed functional specification and taxonomy source**, not a codebase to fork under AGPL. The genuinely valuable, transferable assets are: the discovery mechanism's *shape* (cheap unauthenticated web-preview scraping + BFS link-following), the translate-then-classify pattern, and — most valuable of all — the **taxonomy** (`labels.txt`), which can be adopted close to verbatim. Everything language/region-specific (seed vocabulary, the fine-tuned classifier, TMDB coverage) needs to be rebuilt for Telugu/Tamil/Kannada/Malayalam/Hindi content, and the entire IPTV + video-fingerprinting halves of the product have no code to draw from here at all.

---

## 9. Open Questions / Next Research Threads

- Exact cost/API access model for TMDb-equivalent regional Indian film metadata (TMDb under-covers regional titles — may need to build/license a better catalog). **Confirmed as a real blocker** by the source code audit in §8.5 (Aho-Corasick matching is only as good as the TMDB index it's built from).
- Legal mechanics of *who* is authorized to file into the MIB nodal-officer mechanism on a producer's behalf (agency/representative registration process) — needs a direct read of the prescribed complaint format, not just news coverage.
- Whether Xtream-Codes-panel fingerprinting (detecting panels by port/response signature at internet scale, à la Shodan-style scanning) is legally clean to build in-house vs. licensing from an infrastructure-enforcement vendor.
- ~~Full technical read of the Anti-RIP GitHub repo~~ — **done, see §8.5.** Follow-up now needed: source/build a labeled dataset of actual Telugu/Tamil/Kannada/Hindi Telegram piracy posts to retrain the classifier (the shipped model is fine-tuned on Western/anime-style posts and won't generalize as-is), and benchmark `translategemma:12b` (or alternatives) specifically on Indian regional languages and Hinglish/Tanglish code-switched text before trusting it in the pipeline.
- Get a firm answer on the AGPLv3 licensing question raised in §8.5 (clean-room reimplementation vs. open-source-the-whole-product) — this affects the entire technical approach and should be resolved before writing product code, ideally with actual legal counsel rather than this research alone.
- Deeper look at Friend MTS's "Dynamic Delivery Server Blocking" — how exactly the 12,000-servers-per-event number is achieved technically.
- Telethon/MTProto account-ban risk at discovery scale (see §8.5, Decision #2) — research what account-pooling/rotation practices other large-scale Telegram-monitoring operations use to stay under the radar without violating Telegram's ToS.

---

## 10. Second Market Segment: Individual Creators (YouTubers, Instagrammers, Drone/Stock Footage Shooters)

Raised 2026-08-28: a parallel, more consumer-facing product idea — "upload your video to us before YouTube, we embed something that lets us track it, and if anyone downloads/reposts it we detect that and notify you" — aimed at individual creators rather than film studios. This is a genuinely different customer segment (self-serve/prosumer vs. enterprise) but shares almost all of the same underlying technology already scoped in this file. Notes below explain the actual mechanisms (since "how does YouTube do it" was an open question) and the closest existing playbook.

### 10.1 How YouTube Content ID actually works (it's fingerprinting, not watermarking)

- A rightsholder uploads a **reference file** to YouTube. YouTube extracts **fingerprints** (feature vectors from audio and video — for video, the clip is sliced into thousands of frames and each is fingerprinted) and stores them in a reference database.
- Every video uploaded by any user is fingerprinted the same way and checked against that database. The matching is robust to some alteration (partial matches, dimension/color changes).
- On a match, the *content owner* (not YouTube) chooses the policy: block it, allow it and just track viewership, or allow it and monetize it (run ads, keep the revenue). ([jdhao's explainer](https://jdhao.github.io/2021/08/02/the_youtube_content_id_system/), [Streaming Media](https://www.streamingmedia.com/Articles/Editorial/Featured-Articles/YouTubes-Digital-Fingerprints-How-Content-ID-Protects-Videos-78358.aspx?CategoryID=427))
- **Critical limitation for the user's idea:** Content ID only ever looks at things uploaded *to YouTube*. It has zero visibility into Instagram, TikTok, a competitor's stock-footage site, or a re-upload to a totally different platform. It also has eligibility requirements (a substantial catalog of original content) — it is not a self-serve tool an individual creator can just switch on. **Nothing embedded goes into the original file at all** — Content ID is pure server-side matching against a reference the owner already gave YouTube.

### 10.2 Two distinct technical mechanisms — this is the concept the user's phrasing ("add code to it so we can track it") was reaching for

1. **Fingerprinting / perceptual hashing** (what Content ID, Pixsy, and most film-anti-piracy vendors in §2 of this file do): the original file is **not modified at all**. A hash/feature-vector "fingerprint" of it is computed and stored. Anything crawled from the web is fingerprinted the same way and compared for a match. Tells you "this matches something we know about," robust to resize/crop/re-encode, but carries no information about *who* leaked it unless the reference copy itself was already unique per recipient.
2. **Forensic/invisible watermarking** (what Cinavia, NAGRA NexGuard, and the two vendors below do): an invisible, unique identifier is **actively embedded into the pixels/audio of the file itself** before it's distributed — this is the literal mechanism the user described ("add some code to it"). When a leaked copy is found, extracting the watermark reveals exactly which distributed copy it came from (which recipient, which session, which platform upload). Survives re-encoding, resizing, cropping, and — for some techniques — even screenshots, though no watermark is literally unremovable (see the generative-AI watermark-removal arms race in §6 of this file; marketing claims of "unremovable" should be read skeptically).

**For the product the user is describing, both are needed together**: fingerprint everything for broad detection, and embed a unique watermark per creator/upload for precise attribution (who owns it, and eventually which specific distribution leaked it).

### 10.3 Existing vendors doing exactly this, already, as licensable APIs

- **IMATAG** — forensic watermarking API: hides an invisible identifier in images/video without visible quality loss; on finding a suspicious copy, uploading it reveals the embedded source identifier. Explicitly marketed for creators tracking unauthorized reuse. ([IMATAG](https://www.imatag.com/api/forensic-watermarking-api))
- **Steg.AI** — patented "Light Field Messaging" invisible watermarking for images/video/documents; claims survival through screenshots and common manipulations; used for leak-source tracing (who leaked which copy). ([Steg.AI](https://steg.ai/))
- Both are **B2B/enterprise-oriented APIs a product could license and build on top of**, rather than needing to invent forensic watermarking from scratch — this meaningfully de-risks and speeds up the technical build for this segment specifically (unlike the live-video-fingerprinting gap noted in §7 for the film-piracy product, which is also patent-dense but has no obvious off-the-shelf API this well-suited to a creator-facing product).

### 10.4 The closest existing business-model playbook: Pixsy (images only — no video equivalent found at this price point)

- **Pixsy**: photographers sync/upload their image library; Pixsy fingerprints every image and continuously reverse-image-searches the public web for matches (robust to resize/crop/edits); on a match, the photographer can either send a one-click takedown themselves, or hand the case to Pixsy for recovery.
- **Business model — this is the key transferable idea**: Pixsy is **free to monitor** (up to 500 images), and **only takes a cut (50%) when it actually recovers a settlement/licensing fee** — a pure contingency model, no upfront cost to the creator. This removes the price objection that would otherwise block prosumer/individual adoption. ([Pixsy](https://www.pixsy.com/), [Pixsy image-theft explainer](https://www.pixsy.com/image-theft/how-reverse-image-search-tools-like-pixsy-help-fight-image-theft))
- **The gap:** no equivalent exists for video at Pixsy's self-serve, contingency-priced, individual-creator scale. Every video-specific vendor found (IMATAG, Steg.AI, NAGRA, Irdeto, Vobile) is enterprise/B2B, sold to media companies and platforms, not to a solo YouTuber or drone videographer. **This is a genuine, differentiated market gap**, not an already-crowded space.

### 10.5 Reverse-video-search / crawling reality check

Generic "reverse video search" consumer tools exist (scanning YouTube/TikTok/Instagram/Reddit/the open web frame-by-frame) but are positioned as one-off lookup tools, not continuous monitoring-and-enforcement services — none of the ones surfaced in this research combine continuous monitoring + fingerprinting + watermarking + contingency-based enforcement the way Pixsy does for images. Building the crawling/monitoring layer for this segment is a superset of the discovery/classification work already scoped for the film-piracy product in this file (same shape: crawl platforms → fingerprint/match → evidence → enforcement), just aimed at a much broader set of platforms (Instagram, TikTok, YouTube re-uploads, stock-footage marketplaces) instead of Telegram/IPTV specifically.

### 10.6 Important expectation-setting: this detects and attributes, it does not prevent copying

Neither fingerprinting nor watermarking stops someone from downloading a publicly posted video (any public YouTube/Instagram URL can be downloaded with widely available tools regardless of what was embedded beforehand). This class of product is a **"catch and get paid" system, the same as Content ID and Pixsy**, not a copy-prevention/DRM system. A true prevention approach would require a fundamentally different distribution model (e.g., a paywalled/DRM-wrapped private player instead of a public social post), which contradicts the "upload before YouTube, then post publicly" workflow the user described. This distinction should be set correctly in any pitch to creators — oversell prevention and the first traceable leak becomes a credibility problem.

### 10.7 Why "upload here before YouTube" is a genuinely smart product hook

- It captures the **original, not-yet-public master file** to fingerprint/watermark before anyone else has a copy — a much stronger signal than trying to fingerprint something already scraped from the web after the fact.
- It inserts into a workflow step creators already have to do (upload somewhere before publishing), rather than asking for extra effort.
- It allows a **unique watermark per creator or even per individual upload**, enabling not just "is this mine" detection but eventually "which specific distribution/download leaked this" attribution.
- Wedding/drone videographers are a validated real pain point already — a search surfaced a concrete case of drone cinematography companies having footage stolen/reshared and responding with watermarking + access restrictions on masters, confirming actual demand in exactly this niche. ([ScoreDetect — Copyright Implications for Drone Videography](https://www.scoredetect.com/blog/posts/copyright-implications-for-drone-videography))

### 10.8 How this relates to the Bollywood/regional-cinema product already being designed

Same underlying architecture (`anti-piracy-platform` repo — discovery, classification, evidence, enforcement services from `ARCHITECTURE.md`), retargeted:

| | Film/regional-cinema product | Creator product |
|---|---|---|
| Customer | Producers/studios | Individual YouTubers/Instagrammers/videographers |
| Business model | Enterprise contract | Contingency/revenue-share (Pixsy-style) or freemium subscription |
| Primary detection surface | Telegram, IPTV | Instagram, TikTok, YouTube re-uploads, stock-footage sites |
| Attribution mechanism | Evidence packages from text/post classification | Forensic watermark (IMATAG/Steg.AI-class) embedded pre-upload + fingerprint matching |
| Enforcement | Telegram DMCA, India MIB nodal channel | Standard platform DMCA/takedown flows per-platform |
| Sales motion | Long enterprise cycle, needs case studies | Self-serve signup, faster to first revenue |

This could be a second product line sharing the evidence/enforcement/analytics service layer, or a deliberately separate go-to-market entirely — worth a direct decision before more architecture work goes into either, since the sales motions are different enough (enterprise vs. self-serve) that bundling them into one pitch to either audience could weaken both.

**Update 2026-08-28:** decided as ONE platform, not two — see `anti-piracy-platform/ARCHITECTURE.md` §2.5. Tier (creator/studio/enterprise) changes onboarding and which surfaces are active; the core pipeline is shared.

### 10.9 owned-asset-registry service scope — fingerprinting vs. watermarking are different technology stacks

Detailed research into actually building the mechanism described in §10.3 surfaced an important split, now encoded in `anti-piracy-platform/services/content-catalog/owned-asset-registry/DESIGN.md`:

- **Fingerprinting (broad detection) can be fully self-hosted and free**: Meta open-sourced **PDQ** (256-bit perceptual hash, single images) and **TMK+PDQF** (whole-video matching) in 2019 specifically for this class of problem — C++ with Python bindings. For audio, **Chromaprint/AcoustID** is the open-source option (~100ms per 2-minute clip, ~2.5KB fingerprint) but is tuned for music-track identification against MusicBrainz — its fit for arbitrary spoken-word/ambient audio needs empirical validation, not assumption. ([Meta — Open-Sourcing Photo- and Video-Matching Technology](https://about.fb.com/news/2019/08/open-source-photo-video-matching/), [Chromaprint/AcoustID](https://acoustid.org/chromaprint))
- **Watermarking (precise per-copy attribution) requires a licensed vendor**, confirmed concretely for the two candidates named in §10.3:
  - **IMATAG** has a public, documented REST API (v4): Upload (pre-signed URL) → Watermark → Register (via a returned LMK file, attach metadata) → Detect (submit a suspect file, get the embedded ID back). Covers images and video. **Explicitly does not support audio** — stated directly in IMATAG's own materials. ([IMATAG API docs](https://imatag.com/api/doc/))
  - **Steg.AI** claims image/video/audio/document coverage and a "single-frame watermarking" technique (attribution survives even a single screenshot), but no public endpoint-level API documentation was found — would need a direct sales/technical conversation to confirm actual capability and pricing before relying on it, especially for the audio claim. ([Steg.AI](https://steg.ai/watermarking-software/))
  - **Recommendation**: IMATAG for image/video (clear API, faster to integrate); audio watermarking is an open gap — either validate Steg.AI directly or ship audio as fingerprint-only at launch.
- **The load-bearing product rule this surfaced**: the customer must actually download and publish the *watermarked* output file, not their original — a watermark that stays in platform storage while the customer posts their untouched original to Instagram protects nothing. This has to be a first-class, prominent step in the product UX, not an implementation detail.

### 10.10 Update 2026-08-28: explicit decision to build watermarking in-house — and a major finding that makes it realistic

User pushed back on licensing IMATAG/Steg.AI at all: "our aim is to build our own IP." This is a legitimate strategic call, but the honest framing given first: fingerprinting was already effectively "your own IP" (PDQ/TMK+PDQF/Chromaprint are open-source building blocks, no vendor lock-in), while forensic **watermarking** specifically is a patent-dense, research-heavy field (Digimarc alone holds 1,100+ granted/pending patents spanning embedding, recovery, multi-layer, and compressed-content watermarking; Verance holds Cinavia-related recovery patents) that companies like NAGRA/Irdeto/IMATAG/Steg.AI exist specifically because it's hard. Presented three paths — fingerprint-only for now, license short-term, or commit to in-house R&D — user chose **build in-house from day one**.

**Follow-up research changed the picture significantly.** Directly cloned and verified (not just searched) two GitHub repos:

- **[facebookresearch/videoseal](https://github.com/facebookresearch/videoseal)** — Meta FAIR's open watermarking suite for image + video. **LICENSE file confirmed as plain MIT** (Copyright Meta Platforms, Inc.). Includes VideoSeal (v1.0, March 2025, 256-bit), PixelSeal (Dec 2025, SOTA robustness/imperceptibility trade-off), and ChunkySeal (Dec 2025, 1024-bit capacity) — actively maintained through December 2025, clean Python API (`videoseal.load()`, `.embed()`, `.detect()`).
- **[facebookresearch/audioseal](https://github.com/facebookresearch/audioseal)** — Meta's audio watermarking model, published at ICML 2024. **LICENSE file confirmed as plain MIT.** Meta's own changelog explicitly states: *"Now you can use AudioSeal in commercial application too!"* (license updated to full MIT including model weights, 2024-04-02). Sample-level localized watermarking, robust to compression/re-encoding/noise, detection reported as two orders of magnitude faster than prior approaches.
- A newer umbrella framework, **facebookresearch/content-seal**, ties these together (also confirmed MIT) plus adds text watermarking (not relevant here).

**This directly closes the audio gap** that made IMATAG's vendor path incomplete (IMATAG explicitly doesn't support audio watermarking at all). More importantly, it changes "build in-house" from "invent forensic watermarking as a multi-year research project" into "self-host and productionize an already-open, already-MIT-licensed, actively-maintained, state-of-the-art model suite" — a materially different and more achievable scope.

**What this does NOT change, and must not be lost**: MIT is a copyright license, confirmed by reading the actual LICENSE file text to contain **no patent grant clause** (unlike Apache 2.0). It grants permission to use/modify/commercialize *this code* — it says nothing about whether the underlying technique infringes a *third party's* patent (Digimarc's/Verance's portfolios, referenced above, are exactly the risk here). **A freedom-to-operate legal review by an actual patent attorney is a required step before commercial deployment of self-hosted watermarking, full stop** — this is now documented as the top open item in `anti-piracy-platform/services/content-catalog/owned-asset-registry/DESIGN.md` §2/§8, not something this research substitutes for.

**Schema consequence**: `WatermarkProvider` enum extended to `VIDEO_SEAL` / `AUDIO_SEAL` / `WATERMARK_ANYTHING` (self-hosted, now the primary path) alongside the previously-recommended `IMATAG` / `STEGAI` (kept as a documented fallback if the FTO review or robustness testing forces a pivot back to a licensed vendor).

### 10.11 Model-serving infrastructure scoped — these are small, cheap-to-run models, not a GPU-fleet problem

Pulled real performance numbers directly from the papers (arXiv 2412.09492 for VideoSeal, arXiv 2401.17264 for AudioSeal), not repo READMEs or marketing pages, since this determines actual infrastructure cost:

- **VideoSeal**: embedder is 16M parameters / 42 GFlops, extractor 24M parameters / 3.1 GFlops. On a **Tesla V100-16GB (2017-era GPU)**: embedding runs at 0.42 GPU-seconds per video-second (faster than real-time), extraction at 0.11 GPU-seconds per video-second (~9x faster than real-time). Even **CPU-only** (Intel Xeon 6230) stays close to real-time (1.14 sec/video-sec embed, 0.69 sec/video-sec extract).
- **AudioSeal**: on a Quadro GP100 (also a modest, older GPU), detects a 10-second clip in ~33ms total; 485x faster than the WavMark baseline when no watermark present.
- **Implication**: this is not an A100/H100-class workload at all — 16-24M-parameter models are tiny by modern ML standards, and even old/unremarkable GPU hardware clears real-time by a wide margin. Full infrastructure scope (capacity math, serverless-vs-dedicated deployment recommendation, queueing/batching design) is in `anti-piracy-platform/services/model-serving/watermark-engine/DESIGN.md`. Recommended Phase 1 approach: serverless/on-demand GPU (not always-on dedicated instances), since creator-tier traffic is bursty and pre-launch volume is unknown, and the small model size means cold-start model loading is fast enough to make serverless practical.
- Fingerprinting (PDQ/TMK+PDQF, Chromaprint) is CPU-only and kept on a fully separate worker pool from the GPU-based watermarking — see `services/model-serving/fingerprint-engine/README.md`.

## Full Source List

- [MIB Office Order No. M-11017/1/2023-DO(FC), 3 Nov 2023 — Nomination of Nodal Officers (primary source, read directly)](https://mib.gov.in/sites/default/files/2024-12/nomination-of-nodal-officers-under-section-79-3-b-of-the-it-act-2000-accessible.pdf)
- [MediaNama — India's Anti-Piracy Nodal Officers Got Just 9 Complaints: RTI](https://www.medianama.com/2025/07/223-anti-piracy-nodal-officers-received-9-complaints-rti/)
- [Binge, Bot, Repeat: Unpacking the Ecosystem of Video Piracy on Telegram (arXiv 2605.08418)](https://arxiv.org/html/2605.08418v2)
- [Anti-RIP GitHub repository](https://github.com/Scalable-Security-Research-Lab/BingeBotRepeat)
- [TorrentFreak — Researchers Hunt Telegram Pirates with AI Tool](https://torrentfreak.com/researchers-hunt-telegram-pirates-with-ai-tool-flag-hundreds-of-channels/)
- [DMCA.ai — How to File a DMCA Takedown on Telegram](https://www.dmca.ai/articles/dmca-takedown-telegram)
- [TakedownPanel — Report Copyright Infringement on Telegram](https://takedownpanel.com/report-copyright-infringement-telegram/)
- [Grokipedia — Xtream Codes](https://grokipedia.com/page/Xtream_Codes)
- [IPTV Explained — M3U vs Xtream Codes](https://iptvexplained.com/articles/m3u-vs-xtream-codes)
- [EzlaScan — The Global IPTV Piracy Crackdown 2026](https://www.ezlascan.com/blog/iptv-piracy-global-crackdown-2026)
- [Removeyourmedia — Live Sports Piracy and the Rise of IPTV Streams](https://removeyourmedia.com/2026/02/24/live-sports-piracy-and-the-rise-of-iptv-streams-what-rights-holders-need-to-know/)
- [PIB — Cinematograph (Amendment) Act 2023 press release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2241712&reg=3&lang=1)
- [PIB — Cinematograph Act anti-piracy penalties](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2246198&reg=1&lang=1)
- [Deccan Chronicle — Govt Blocks 3,100 Telegram Channels, 800 Websites](https://www.deccanchronicle.com/nation/govt-blocks-3100-telegram-channels-800-websites-over-pirated-content-1944709)
- [IndianTelevision.com — India orders Telegram to axe 3,142 channels](https://indiantelevision.com/regulators/india-turns-up-the-heat-on-piracy-orders-telegram-to-axe-3142-channels-and-blocks-800-websites/)
- [NewKerala — 7,393 URLs, 4,996 Telegram Channels Blocked](https://www.newkerala.com/news/a/cinematograph-amendment-act-it-framework-strengthen-anti-piracy-enforcement-876.htm)
- [News on Air — Hyderabad Cyber Crime Unit / iBomma-Bappam racket](https://www.newsonair.gov.in/hyderabad-cyber-crime-unit-arrests-mastermind-of-ibomma-and-bappam-piracy-racket)
- [Irdeto — Anti-piracy and forensic watermarking](https://irdeto.com/video-entertainment/irdeto-anti-piracy)
- [NAGRA — NexGuard forensic watermarking on Akamai edge network](https://www.nagra.com/nagra-launches-nexguard-forensic-watermarking-akamai-edge-network-protect-high-value-live-and-vod)
- [Friend MTS — Digital Watermarking Solutions](https://www.friendmts.com/technology/watermarking)
- [Friend MTS — Anti-Piracy in 2026 Predictions](https://www.friendmts.com/blog/anti-piracy-in-2026-predictions-from-friend-mts)
- [DAZN Group and Videocites partnership announcement](https://dazngroup.com/press-room/dazn-group-and-videocites-join-forces-to-combat-piracy-and-achieve-unprecedented-success/)
- [Sports Video Group — The Automation Imperative (AI vs live-sports piracy)](https://www.sportsvideo.org/2025/11/13/op-ed-the-automation-imperative-why-ai-is-the-only-scalable-defense-against-live-sports-piracy/)
- [White Bullet Solutions](https://www.white-bullet.com/)
- [MUSO Protect](https://www.muso.com/protect)
- [ACE dismantles AnimePlay (Indonesia)](https://finance.yahoo.com/sectors/technology/articles/ace-dismantles-major-illicit-anime-013400824.html)
- [Alliance for Creativity and Entertainment — Wikipedia](https://en.wikipedia.org/wiki/Alliance_for_Creativity_and_Entertainment)
- [Verance — Cinavia](https://www.verance.com/cinavia/)
- [Cinavia — Wikipedia](https://en.wikipedia.org/wiki/Cinavia)
- [A Survey on Piracy Protection Techniques in Digital Cinema Watermarking Schemes](https://www.intechopen.com/chapters/71851)
- [NYU Stern — Watermarks: Visible, Invisible, and Forensic Watermarking](https://wp.nyu.edu/leonardnsternschoolofbusiness-forensicwatermarking/2026/03/05/watermarks-protecting-digital-content-with-visible-invisible-and-forensic-watermarking/)
- [NeurIPS 2024 — Invisible Image Watermarks Are Provably Removable Using Generative AI](https://proceedings.neurips.cc/paper_files/paper/2024/file/10272bfd0371ef960ec557ed6c866058-Paper-Conference.pdf)
- [arXiv 2510.05978 — Diffusion-Based Image Editing for Breaking Robust Watermarks](https://arxiv.org/pdf/2510.05978)
- [Netflix system-level password-sharing enforcement](https://www.educative.io/newsletter/system-design/how-netflix-built-system-level-enforcement-for-password-sharing)
- [jdhao — How Does The YouTube Content ID System Work?](https://jdhao.github.io/2021/08/02/the_youtube_content_id_system/)
- [Streaming Media — YouTube's Digital Fingerprints: How Content ID Protects Videos](https://www.streamingmedia.com/Articles/Editorial/Featured-Articles/YouTubes-Digital-Fingerprints-How-Content-ID-Protects-Videos-78358.aspx?CategoryID=427)
- [Pixsy — Image Theft Protection](https://www.pixsy.com/)
- [Pixsy — How reverse image search tools like Pixsy help fight image theft](https://www.pixsy.com/image-theft/how-reverse-image-search-tools-like-pixsy-help-fight-image-theft)
- [IMATAG — Forensic Watermarking API](https://www.imatag.com/api/forensic-watermarking-api)
- [Steg.AI — Forensic Watermarking & Content Protection](https://steg.ai/)
- [ScoreDetect — Copyright Implications for Drone Videography](https://www.scoredetect.com/blog/posts/copyright-implications-for-drone-videography)
- [Meta — Open-Sourcing Photo- and Video-Matching Technology (PDQ/TMK+PDQF)](https://about.fb.com/news/2019/08/open-source-photo-video-matching/)
- [Chromaprint/AcoustID](https://acoustid.org/chromaprint)
- [IMATAG REST API v4 documentation](https://imatag.com/api/doc/)
- [IMATAG Forensic Watermarking API](https://www.imatag.com/api/forensic-watermarking-api)
- [Steg.AI — Watermarking Software](https://steg.ai/watermarking-software/)
- [facebookresearch/videoseal (GitHub)](https://github.com/facebookresearch/videoseal)
- [facebookresearch/audioseal (GitHub)](https://github.com/facebookresearch/audioseal)
- [facebookresearch/content-seal (GitHub)](https://github.com/facebookresearch/content-seal)
- [Meta Releases Video Seal — Maginative](https://www.maginative.com/article/meta-releases-video-seal-an-open-source-watermarking-tool-for-ai-video/)
