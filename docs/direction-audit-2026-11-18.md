# Direction audit, 18 Nov 2026

Why a law-firm brief with no firm name came out as a giant "LEGAL": the dealt direction was `lg-wordmark` ("Giant wordmark", built for law firms, anchored on ario.law). Its composition says the firm's name IS the hero at 200-300px. The brief had no firm name, our rules forbid inventing one, so the model enlarged the category word. The direction did what it says; the brief it was given could not satisfy it, and the web direction brief also told the model to ship invented facts as "marked placeholders", which contradicted the website rules (no notes to the owner, no invented names).

Fix: every direction brief now carries a MISSING FACTS rule (never invent, never fill a slot with a stand-in, a category word is not a name; with no name the biggest hero type is the short promise headline at the direction's display scale; no invented portraits, no figures, no notes to the owner). Test: src/lib/direction-missing-facts.test.ts runs it against all 30 directions.

Scan of what each direction's own text assumes (heuristic regex over composition, moves, image brief and vibe; indicative, not a verdict). Regenerate with `node scripts/audit-directions.mjs`.

```
30 directions

ed-brand-world       hero=photo    assumes: portraits / people, real photography
ty-poster            hero=type     assumes: real photography
dk-instrument        hero=product-ui assumes: figures / data
mono-dev             hero=product-ui assumes: portraits / people, real photography
tn-cultural          hero=video    assumes: real photography
lt-luxe-fintech      hero=product-ui assumes: figures / data
br-saturated         hero=type     assumes: business name, real photography
br-signal-ground     hero=photo    assumes: portraits / people, real photography
co-spec-poster       hero=spec-grid assumes: portraits / people, figures / data, real photography
re-line-drawing      hero=line-art assumes: business name
re-luxe-video        hero=video    assumes: real photography
hs-expedition        hero=photo    assumes: real photography
fb-oxblood-pop       hero=photo    assumes: portraits / people
ag-earth             hero=photo    assumes: portraits / people, real photography
fa-mono-lookbook     hero=cutouts  assumes: figures / data, real photography
hl-anti-clinical     hero=illustration assumes: portraits / people
il-joyful            hero=illustration assumes: portraits / people, real photography
ed-gradient-field    hero=gradient-field assumes: portraits / people, figures / data
lg-wordmark          hero=type     assumes: business name, portraits / people
ngo-human-donate     hero=photo    assumes: portraits / people, figures / data, testimonials
mk-photo-grid        hero=photo    assumes: figures / data
app-owned-tool       hero=product-ui assumes: portraits / people, testimonials
app-calm-ledger      hero=product-ui assumes: figures / data
app-sales-desk       hero=product-ui assumes: business name
app-soft-daily       hero=illustration assumes: figures / data

no assumptions found: mn-signal, dk-studio, b2b-acid-mono, fb-warm-appetite, app-warm-counter
```
