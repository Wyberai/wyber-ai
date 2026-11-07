# TruGrain: GitHub stack, white space and long-run strategy

Written 2026-11-02. Companion to `trugrain-blueprint.md`.
Method: I queried GitHub directly (`gh`) for stars, last-push date and license on about 120 repos, across grain vision, traceability, commerce, ERP/WMS, data, AI, voice, mobile and infrastructure. Stars and dates below are as of today. "Verify license" means GitHub reports a custom or mixed license (NOASSERTION), so read the LICENSE file before you build on it.

I am not a licensed financial or legal advisor. This is a structured view of the technical landscape and the strategic choices, with the uncertainties named.

---

## 1. The most important finding: where nobody has built anything serious

**Grain quality on GitHub is a desert.** Searching "rice quality grain" returns student projects: the best has 32 stars, most were last touched in 2022, none has a license. "Seed purity", "agri produce quality" and "grain classification" return the same. The credible players (Nebulaa, AgNext, Upjao, Intello Labs) are closed and sell to B2B buyers.

**Food traceability on GitHub is blockchain demos.** The largest has 91 stars, was last updated in 2023, and has no license. The newer ones (FoodPrint on Algorand, Hyperledger FoodTraze) are small and academic.

**India commerce plumbing is thin.** There is no maintained Razorpay payment module for Medusa (the only hits are 0–2 star repos). There is no Medusa India GST module I could find. The best GST billing repo is a 415-star invoice builder, not a commerce-grade library.

This is both a warning and the opportunity. Nothing off the shelf will give you a grain grader or a consumer-facing traceability layer, so you have to build them, and whatever you build is hard to copy because there is no open-source head start for a competitor either.

---

## 2. "First in everything": seven plays where the white space is real

| # | Play | Why it's defensible | Building blocks (GitHub) |
|---|---|---|---|
| 1 | **Measured grading, not guessed grading.** Segment every kernel, then count and measure (length/breadth ratio, broken fraction, discolouration, foreign pieces), and use the vision LLM only for judgement and explanation. Today's code asks a vision model to *estimate percentages*, which is hard to calibrate and hard to defend. | Measurements are reproducible and auditable. Combined with your own labelled data, this becomes the moat | `facebookresearch/sam2` (Apache-2.0, 20k★) for kernel masks; `roboflow/rf-detr` (Apache-2.0, 9.9k★) or `open-mmlab/mmdetection` (Apache-2.0) for detection; `roboflow/supervision` (MIT, 51k★) for counting/measuring; `facebookresearch/dinov2` (Apache-2.0) for variety/embedding features; classical L/B-ratio code as in `hkedia321/rice-quality-analysis` (32★, no license, use as a reference only) |
| 2 | **A tamper-evident public lot ledger.** Every lot's grading record is appended to a transparency log, like Certificate Transparency, and the QR page shows a verifiable proof. No blockchain, no token. | Customers and regulators can verify that a report wasn't edited after the fact. Nobody in grains does this | `transparency-dev/tessera` (Apache-2.0), `sigstore/rekor` (Apache-2.0), `google/trillian` (Apache-2.0) |
| 3 | **Signed photo provenance.** Embed C2PA content credentials in the grading photos so "this image came from our device, unedited" is checkable. | Directly answers "is this AI report real?", the main trust risk of an AI-graded brand | `contentauth/c2pa-rs` (verify license, 438★) |
| 4 | **On-device grading in the app.** The customer scans their own pack or loose grain offline, and the model runs on the phone. | Instant, private, no per-scan API cost, works on poor networks | `microsoft/onnxruntime` (MIT), `google-ai-edge/mediapipe` (Apache-2.0), `pytorch/executorch` (verify license) |
| 5 | **Voice commerce in Indian languages.** Order, reorder and ask questions by voice in Hindi, Kannada, Telugu and more. | Many households are voice-first; most D2C brands are text/English-first | `pipecat-ai/pipecat` (BSD-2, 17k★), `livekit/agents` (Apache-2.0, 15k★), `AI4Bharat/IndicTrans2` (MIT, 22 languages). Speech-to-text and text-to-speech quality for each language needs its own bake-off |
| 6 | **Agent-native commerce.** Publish an MCP server so shoppers' AI agents can browse lots, compare grades and place orders. Your `/api/agent-catalog` route is a start. | Early-mover position as people delegate shopping to assistants | `vercel/ai` (verify license, 27k★), `mastra-ai/mastra` (verify license), MCP SDKs |
| 7 | **Open-source the commodity India pieces** (Medusa Razorpay module, GST invoice and HSN logic, Shiprocket connector). | Cheap credibility, hiring magnet, free bug reports, and it positions TruGrain as a tech company not just a rice seller | Yours to write. Licensing decisions in section 5 |

**My ranking by value over effort:** 1 and 2 are the core of the brand. 3 is small and makes 1–2 credible. 7 is nearly free. 4 and 5 are strong differentiators for the apps. 6 is a cheap bet.

---

## 3. Recommended stack by layer

I chose boring, well-maintained, permissively licensed software wherever the layer isn't a differentiator.

### Commerce and back office

| Layer | Pick | Stats | License | Notes |
|---|---|---|---|---|
| Storefront commerce engine | **Medusa** | 37k★, pushed today | MIT, except enterprise-edition files under a separate commercial license (read `ENTERPRISE-LICENSE.md`) | TypeScript, matches your stack. You'll write the Razorpay module and GST logic yourself. Starter: `medusajs/nextjs-starter-medusa` (MIT) |
| Back-office ERP (procurement, stock, accounting, GST) | **ERPNext** with **India Compliance** | 40.8k★ / 281★, both pushed today | GPL-3.0 | India-native: GST, e-invoicing. Has batch tracking. GPL is fine for running it internally; don't embed its code in a distributed product |
| Alternatives | Odoo (55k★, mixed license, enterprise features paid), Saleor (BSD-3, 23k★, Python/GraphQL), Vendure (8.5k★, verify license), InvenTree (MIT, 7.8k★, inventory only) | | | InvenTree is a good lightweight inventory fallback if ERPNext feels heavy |
| Warehouse | Start with ERPNext stock plus a custom handheld PWA | | | `openboxes/openboxes` (920★) and `GreaterWMS` (4.4k★, no license) exist but are generic; I'd not adopt them |
| Subscriptions and billing | **Lago** (usage/subscription billing, 10.7k★, AGPL-3.0) or build on Razorpay Subscriptions | | AGPL | Probably overkill for fixed monthly plans; revisit if plans get complex |

**Design rule for the three-system setup.** ERPNext is the source of truth for stock and money, Medusa is the source of truth for the cart and order experience, and your Quality service is the source of truth for lots and grades. Sync with events, and decide up front which system owns each fact. The most common failure here is two inventories that drift apart.

### Data, analytics and experimentation

| Need | Pick | Notes |
|---|---|---|
| Product analytics and session replay | **PostHog** (40.6k★; verify license, core is MIT with enterprise directories) or `openreplay/openreplay` | One tool for events, funnels, replay, flags and experiments |
| Experimentation and flags | **GrowthBook** (8.5k★, verify license), **Unleash** (AGPL-3.0, 13.9k★) | PostHog may already cover this |
| BI | **Metabase** (50k★; AGPL core, commercial for embedding), **Apache Superset** (Apache-2.0, 75k★) | Superset is the safer license |
| Warehouse and transforms | **ClickHouse** (Apache-2.0, 50k★) or **DuckDB** (MIT, 42.7k★) to start, **dbt** (Apache-2.0), **Dagster** (Apache-2.0) or **Kestra** (Apache-2.0) for orchestration | DuckDB is enough for the first year |
| Ingestion | **Airbyte** (22k★, verify license) | Connectors for ad platforms, payment gateway, courier |
| Semantic layer | **Cube** (21k★, verify license) | Consistent metric definitions across BI, apps and AI |
| Time-series (warehouse sensors) | **TimescaleDB** (24k★, verify license) with **Mosquitto** MQTT, **ESPHome** or **ThingsBoard** | Later phase |

### AI platform

| Need | Pick | Notes |
|---|---|---|
| LLM observability and evals | **Langfuse** (36.9k★, verify license), **promptfoo** (MIT, 26.7k★) | promptfoo also does red-teaming of your public AI endpoints |
| Vector and hybrid search | **pgvector** (23.5k★) first, **Qdrant** (Apache-2.0, 35k★) if scale demands | Keep it in Postgres until it hurts |
| Site search | **Meilisearch** (59.7k★, verify license) or **Typesense** (GPL-3.0, 27k★) | |
| Agent memory/knowledge graph | `mem0ai/mem0`, `getzep/graphiti` (both Apache-2.0) | Only if the concierge needs long-term memory |
| Labelling | **Label Studio** (Apache-2.0, 28.6k★), **CVAT** (MIT, 17k★) | Needed from day one for the grading dataset |
| Local/fine-tuning | `unslothai/unsloth` (Apache-2.0), `ggml-org/llama.cpp` (MIT) | For small models you host yourself |

**License trap:** `ultralytics/ultralytics` and `yolov5` are AGPL-3.0. Running them inside a network-facing product can force you to publish your source or buy an enterprise license. For a commercial product prefer RF-DETR, MMDetection or DINOv2 (Apache-2.0).

### Automation, support and growth

| Need | Pick | Notes |
|---|---|---|
| Durable workflows (order → fulfilment → refund) | **Temporal** (MIT, 24k★), **Hatchet** (MIT, 8k★) or **Trigger.dev** (Apache-2.0, 16.7k★) | Trigger.dev/Hatchet are lighter; Temporal is the heavyweight |
| Internal automation glue | **n8n** (fair-code, 209k★) | Its license restricts embedding it in a product you sell; internal use is fine. Verify |
| Notifications | **Novu** (40k★, verify license) | Multi-channel orchestration over your WhatsApp/email/push providers |
| Email campaigns | **listmonk** (AGPL-3.0, 24k★), **Mautic** (verify license) | |
| Support desk | **Chatwoot** (38.7k★, verify license), **Zammad** (AGPL-3.0), **Frappe Helpdesk** (AGPL-3.0) | Chatwoot handles WhatsApp inbox well |
| CRM | **Twenty** (60k★, verify license), **Frappe CRM** (AGPL-3.0) | Optional |
| Feedback and surveys | **Formbricks** (13k★, verify license) | Post-delivery quality surveys per lot |
| Admin UI framework | **Refine** (MIT, 36k★), **Appsmith** (Apache-2.0, 41k★) | Refine fits a Next.js stack |

### Platform, security and reliability

| Need | Pick | Notes |
|---|---|---|
| Auth | **Better Auth** (MIT, 30.5k★), Keycloak (Apache-2.0) for heavier IdP needs | Replace the shared admin password |
| Authorization | **OpenFGA** (Apache-2.0, 6k★) | Fine-grained roles for the admin suite |
| Rate limiting | `upstash/ratelimit-js` (MIT) | Replaces the in-memory limiter |
| Secrets | **Infisical** (30k★, verify license) or Vault | |
| Errors and observability | **Sentry** (45.7k★), **Grafana** (AGPL-3.0), **OpenObserve** (AGPL-3.0) | |
| Infrastructure as code | **OpenTofu** (MPL-2.0, 30.7k★) | |
| Self-hosted PaaS (optional) | **Coolify** (65k★), **Dokploy** (38k★) | Only if you decide to leave managed hosting |
| Monorepo | **Turborepo** (MIT) or **Nx** (MIT) | One repo for web, mobile, admin, shared packages |
| Mobile | **Expo** (MIT, 53k★), `react-native-reanimated`, `react-native-skia` (both MIT) | The premium feel in the apps comes from motion and graphics; both are well-maintained |
| Reference data | **Open Food Facts** (AGPL-3.0 server) | Product and nutrition data conventions, open prices dataset |

---

## 4. What I would NOT adopt, and why

- **Blockchain traceability repos.** Small, abandoned, and they add cost and jargon without improving trust over a signed transparency log.
- **Any student grain-classifier repo as a dependency.** Fine for reading the approach, but no licenses, no maintenance, and the datasets are small.
- **A full WMS now.** Generic WMS repos are heavy. ERPNext stock plus a custom handheld app covers the first year.
- **Everything at once.** Each tool above is a maintenance burden. Adopt per phase (below), and write a one-page decision record for each.

---

## 5. Analyst view: how to set this up for the long run

### 5.1 What compounds (your moat), in order of strength

1. **Proprietary labelled data.** Every graded lot adds photos, expert labels, meter readings and customer outcomes (complaints, repeat rate). After a few thousand lots, you have a dataset nobody else has. Start capturing it correctly on day one: fixed lighting, calibration card, consistent metadata, human-verified labels, versioned datasets.
2. **Verifiable trust.** The transparency log plus signed photos make your claims checkable. This is hard to retrofit and easy for a competitor to fake without.
3. **Supplier relationships and scorecards.** Lot-level grades let you pay suppliers for quality and drop the weak ones, which improves product quality over time.
4. **Brand.** Trust in the grade, built from consistent results.
5. **Software.** The least defensible, since other brands can eventually build a similar stack. Don't mistake it for the moat.

### 5.2 Own, rent, or open-source

| Own (core IP, never outsource) | Rent or adopt (commodity) | Open-source (strategic) |
|---|---|---|
| Grading pipeline and datasets, lot model, transparency log, grading profiles, customer data | Commerce engine, ERP, analytics, support, notifications, auth, hosting | Razorpay/GST/courier modules, a public grading spec (see below), maybe the measurement toolkit |

### 5.3 Publish a grading specification

Write a versioned public "TruGrain Grade Spec": how photos are taken, which measurements are made, how limits map to grades, and the references to FSSAI/AgMark standards. Publishing it makes your grade a thing people can audit, invites outside scrutiny, and sets the standard others have to react to. Keep the data and models private; publish the method.

### 5.4 Engineering policy

- **Decision records** for every adopted tool: why, alternatives, license, exit plan.
- **License audit in CI** (flag AGPL/GPL/custom licenses before they enter a distributed or network-facing component).
- **Pin versions and track maintainers**: the tools above are all active today (most pushed within days), but check bus factor and release cadence quarterly.
- **Abstraction boundaries** around payments, shipping, WhatsApp, LLM provider and the commerce engine, so each can be swapped.
- **Eval-gated AI releases**: no model or prompt change reaches customers without passing the grading benchmark.
- **Data governance** from the start: consent, retention, deletion, audit logs (DPDP).

### 5.5 Sequencing (extends the roadmap)

| Phase | Adopt |
|---|---|
| A. Foundations | Postgres, Better Auth, Upstash ratelimit, Sentry, Turborepo, Langfuse, Label Studio. Medusa + ERPNext spike |
| B. Quality core | SAM2 + RF-DETR/supervision measurement pipeline, promptfoo evals, the Grade Spec v0, tessera transparency log, C2PA signing |
| C. Commerce | Medusa + your Razorpay/GST modules, ERPNext sync, Novu, PostHog |
| D. Operations | ERPNext procurement/stock/accounting, handheld PWA, MQTT sensors (if needed) |
| E. Apps and growth | Expo, ONNX/MediaPipe on-device check, Pipecat/LiveKit + IndicTrans2 voice, Chatwoot, DuckDB/dbt/Superset, Cube |
| F. Hardening | OpenFGA roles, OpenTofu, load and pen tests, license audit |

### 5.6 Risks the analyst would flag

- **Measured grading depends on photo discipline.** If operators vary lighting or distance, measurements drift. Hardware and SOP matter as much as the model.
- **Three-system complexity** (Medusa + ERPNext + Quality service). Mitigation: strict data ownership, an event contract, integration tests.
- **Single-founder bandwidth.** The plan is large; the sequencing and the "rent the commodity" rule are what make it survivable.
- **Regulatory claims.** "AI-graded" and "verified" must be backed by methods you can show; an unsupported claim is a larger risk than a missing feature.
- **Unknowns I could not verify:** the exact license terms of every "verify license" project; Indic speech quality per language; how well SAM2-style segmentation separates touching kernels in your photo setup (needs a prototype); whether your market responds to lot-level proof (test with the pilot cohort).

### 5.7 Cheap experiments to run first (one to two weeks each)

1. **Segmentation prototype:** photograph 50 scoops of rice under fixed lighting, run SAM2, count kernels and compute L/B ratios; compare against a hand count.
2. **Transparency log demo:** append 100 fake lot records to a tessera log and render a verifiable proof on the QR page.
3. **Medusa + GST spike:** create an order and generate a correct CGST/SGST/IGST invoice.
4. **Voice bake-off:** same 20 grocery utterances in Hindi, Kannada and Telugu across candidate speech models.
5. **Customer test:** show 20 households two product pages, with and without lot proof, and measure which they trust.

---

## 6. Repo index (stats as of 2026-11-02)

Grain/vision: [facebookresearch/sam2](https://github.com/facebookresearch/sam2), [roboflow/rf-detr](https://github.com/roboflow/rf-detr), [roboflow/supervision](https://github.com/roboflow/supervision), [facebookresearch/dinov2](https://github.com/facebookresearch/dinov2), [open-mmlab/mmdetection](https://github.com/open-mmlab/mmdetection), [HumanSignal/label-studio](https://github.com/HumanSignal/label-studio), [cvat-ai/cvat](https://github.com/cvat-ai/cvat), [hkedia321/rice-quality-analysis](https://github.com/hkedia321/rice-quality-analysis)
Trust: [transparency-dev/tessera](https://github.com/transparency-dev/tessera), [sigstore/rekor](https://github.com/sigstore/rekor), [google/trillian](https://github.com/google/trillian), [contentauth/c2pa-rs](https://github.com/contentauth/c2pa-rs)
Commerce/ERP: [medusajs/medusa](https://github.com/medusajs/medusa), [medusajs/nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa), [frappe/erpnext](https://github.com/frappe/erpnext), [resilient-tech/india-compliance](https://github.com/resilient-tech/india-compliance), [inventree/InvenTree](https://github.com/inventree/InvenTree), [getlago/lago](https://github.com/getlago/lago), [saleor/saleor](https://github.com/saleor/saleor)
Data/analytics: [PostHog/posthog](https://github.com/PostHog/posthog), [growthbook/growthbook](https://github.com/growthbook/growthbook), [apache/superset](https://github.com/apache/superset), [metabase/metabase](https://github.com/metabase/metabase), [duckdb/duckdb](https://github.com/duckdb/duckdb), [ClickHouse/ClickHouse](https://github.com/ClickHouse/ClickHouse), [dbt-labs/dbt](https://github.com/dbt-labs/dbt), [dagster-io/dagster](https://github.com/dagster-io/dagster), [airbytehq/airbyte](https://github.com/airbytehq/airbyte), [cube-js/cube](https://github.com/cube-js/cube)
AI platform: [langfuse/langfuse](https://github.com/langfuse/langfuse), [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo), [pgvector/pgvector](https://github.com/pgvector/pgvector), [qdrant/qdrant](https://github.com/qdrant/qdrant), [AI4Bharat/IndicTrans2](https://github.com/AI4Bharat/IndicTrans2), [pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat), [livekit/agents](https://github.com/livekit/agents), [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime), [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe)
Automation/support: [temporalio/temporal](https://github.com/temporalio/temporal), [hatchet-dev/hatchet](https://github.com/hatchet-dev/hatchet), [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev), [n8n-io/n8n](https://github.com/n8n-io/n8n), [novuhq/novu](https://github.com/novuhq/novu), [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot), [formbricks/formbricks](https://github.com/formbricks/formbricks)
Platform: [better-auth/better-auth](https://github.com/better-auth/better-auth), [openfga/openfga](https://github.com/openfga/openfga), [upstash/ratelimit-js](https://github.com/upstash/ratelimit-js), [getsentry/sentry](https://github.com/getsentry/sentry), [opentofu/opentofu](https://github.com/opentofu/opentofu), [expo/expo](https://github.com/expo/expo), [refinedev/refine](https://github.com/refinedev/refine), [vercel/turborepo](https://github.com/vercel/turborepo)
