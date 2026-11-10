# Web design direction research (10 Nov 2026)

Purpose: replace "pick a palette, compose kit components" with a library of *directions* anchored in real,
top-tier sites, the way `Wyberai/app-ui-slopless` does for mobile (31 directions, each tied to shipped apps).
Everything below was either read from a primary source or measured on the live site on 10 Nov 2026.
Anything not verified is marked **unverified**.

## Sources
- **Awwwards Sites of the Year** — read from awwwards.com/websites/sites_of_the_year (first page of 2). Winners relevant here:
  2025 Lando Norris (OFF+BRAND), Messenger (abeto); 2024 Igloo Inc (abeto), Don't Board Me, Opal Tadpole;
  2023 Lusion v3, Noomo Agency, Mana Yerba Mate (Louis Paquet); 2021 Pangram Pangram Foundry (Locomotive),
  Chungi Folio, Synchronized Studio (Zhenya Rynzhuk, 2020); 2018 Frans Hals Museum (Build in Amsterdam); 2020 Kode Sports Club (Merci Michel).
  Many winners are WebGL "experience" sites (Lusion, abeto, Active Theory); those do not suit small-business or SaaS builds and are not used as anchors.
- **Live measurement** (browser, DOM + computed styles, first load): the ten sites in the table below.
- Trend blogs (vendor/agency posts) were read but are **not** used as evidence; one audit in them (Credo, 200+ sites) says
  trend briefs converge on "the same five templates", which supports the premise rather than any specific direction.

## Measured facts
| Site | Ground | Ink / accents | Type system | Largest type | Gradients (DOM count) | Images |
|---|---|---|---|---|---|---|
| pangrampangram.com | `#fafafa` | black; ONE signal `rgb(255,47,0)` | Neue Montreal only | 14px nav, full-bleed art cards | 0 | 37 |
| en.manayerbamate.com | cream `rgb(254,247,230)` | ink `rgb(14,14,14)`; peach `255,211,114`, coral `241,91,64` | Neue Montreal only | **237px, weight 300** | 0 | 102 |
| aesop.com | warm white `rgb(255,254,242)` | `#333`; no accent colour | Suisse Int'l + Zapf Humanist | 36px, calm | 3 | 71 |
| franshalsmuseum.nl | deep teal-black `rgb(0,19,23)` | off-white + peach `254,205,140` | Rubik 700 caps | 36px bold | 73 | 77 |
| kodeclubs.com | white | indigo `28,34,140` + hot pink `245,3,89` | Antique Olive (extended) | **160px wordmark** | 4 | 1 |
| synchronized.studio | `rgb(21,21,21)` | white + pale green `222,235,200` | custom (A/B/C/E) | **123px, weight 300** | 4 | canvas |
| linear.app | `rgb(8,9,10)` | grey ladder `#f7f8f8 / #8a8f98 / #62666d` — no hue | Inter Variable + Berkeley Mono | 56px, weight 510, **tracking -1.2px** | 56 | product UI |
| stripe.com | light | navy `rgb(6,27,49)` + one purple `rgb(83,58,253)` | Söhne (single family) | 56px, **weight 300**, tracking -1.4px | 25 | 31 |
| resend.com | `#000` | greys `#f0f0f0 / #a1a4a5` | **Commit Mono body**, Inter, ABC Favorit | **96px**, tracking -0.96px | 240 | 73 |
| raycast.com | `rgb(7,8,10)` | white + alpha ladder | Inter + SF Pro | 64px / 600 | 235 | 117 |

Caveats: homepage first load only; colour counts are DOM usage, not visible area; gradient counts include masks and UI details;
several screenshots caught loaders/animations, so **motion and imagery quality were not judged**; stripe.com redirected to /in.

## What separates these from the generic look (measured, not opinion)
1. **The type system is the design.** Every site uses a licensed or custom family, mostly a *single* family with extreme size contrast
   (56–237px display against 14–16px UI), light weights at large sizes (300 on Stripe, Mana, Synchronized) and tight negative tracking.
   Our palettes use Switzer for body text in **29 of 30** cases (General Sans in the other one), and General Sans for display in 19 of 30
   (counted from `design-palettes.ts`); only 11 palettes differ at all in display type (Instrument Serif 3, Fraunces 5, Playfair 1, Lora 2).
2. **One signal colour, on a considered ground.** Pangram: one red-orange. Kode: indigo + pink. Mana: coral + peach on cream.
   Grounds are tinted (`#fafafa`, cream, `#001317`, `#08090a`), not pure black/white or default greys.
3. **Brand-owned imagery carries the page, not effects.** Mana 102 images, Aesop 71, Pangram 37 with **0** gradients on the first two.
4. **The dark SaaS look is restrained at the source.** Linear is a hue-free grey ladder; its identity is the Inter + Berkeley Mono pairing and tight type.
   Clones copy "dark + glow" and drop the restraint, which is where black-and-neon-purple comes from.
5. **Brand colour worlds beat palettes.** Frans Hals (teal-black + peach) and Kode (indigo + pink) look like their brand, not a category.

## Draft directions (anchors are verified sites above)
| id | Direction | Anchors | Core rules | Fits |
|---|---|---|---|---|
| ed-brand-world | Brand world, imagery-led | Aesop, Mana | warm off-white ground, ONE text family, calm type, 60%+ of the page is brand photography, zero gradients | retail, food, wellness, local business |
| ty-poster | Giant type poster | Mana, Pangram | display 160–240px, weight 300, section = one word + one image | D2C, studios, events |
| mn-signal | Single-signal grid | Pangram Pangram | `#fafafa` ground, black ink, one signal colour used 5% max, art-directed image cards each in their own mood | portfolios, product catalogues |
| dk-studio | Dark typographic studio | Synchronized | `#151515`, 120px light type, one pale accent, one micro-animation | agencies, creators |
| dk-instrument | Instrument dark | Linear, Raycast, Resend | near-black, hue-free grey ladder, mono pairing, product UI as the hero, **no neon** | SaaS, dev tools |
| lt-luxe-fintech | Light-weight luxe | Stripe | light-weight display (300), navy ink, ONE brand colour, gradient only as art direction | fintech, B2B |
| mono-dev | Mono-body developer | Resend | monospace body, large display, tight tracking | APIs, dev tools |
| br-saturated | Saturated brand block | Kode | white ground, extended display wordmark in saturated brand colour + one hot accent | gyms, clubs, consumer brands |
| tn-cultural | Tinted dark cultural | Frans Hals Museum | teal-black ground, warm peach accent, rounded offset cards, video hero | museums, hospitality, venues |

**Gap research (second pass, 10 Nov 2026)** is below. Still not researched: local services (salons, gyms, plumbers, clinics as small businesses),
agriculture/export/B2B trade, DTC e-commerce beyond Aesop, and logged-in dashboards (see limits). Candidates (**unverified**): Lusion, abeto, Active Theory for a WebGL "launch page" direction.

## Gap research: how anchors were chosen
- **Award-listed** = read from Awwwards category result pages on 10 Nov 2026 (real estate, restaurant/hospitality, healthcare, education, law).
  Badges quoted exactly as the page showed them (SOTD = Site of the Day, SOTM = Site of the Month, HM = Honorable Mention).
- **Category leader (not award-ranked)** = my pick, measured the same way. Used where Awwwards had nothing relevant: its "non-profit" results were
  mostly agencies/studios, "marketplace" was NFT/luxury, "dashboard" winners dated 2012–2015, and "law" had only Honorable Mentions.
- Logged-in dashboards cannot be measured; only public tool UIs and marketing pages were.

## Measured facts (gap categories)
| Site | Category / status | Ground | Ink / accents | Type | Largest type | Media |
|---|---|---|---|---|---|---|
| belgradearbor.rs | Real estate, **SOTD 17 Oct 2026** | cream `253,251,239` | forest `46,58,38`, brass `166,129,80`, lime `231,253,85` | custom serif + Work Sans | 107px / 400 | line-drawn building hero, 7 videos, 44 imgs |
| sobha-privy-collection.com | Real estate, **SOTD 23 Sep 2026** | white | ink `26,25,25` | TT Ramillas serif + TT Commons Pro | 68px / 300, **tracking +1.37px** | 12 videos, 55 imgs |
| white-desert.com | Hospitality, **SOTD 11 Sep 2026** | white | navy `31,42,68` | Inter Tight + Cardinal Classic (serif) | **227px** | full-bleed expedition photo hero |
| delice.ca | Restaurant, HM 24 Sep 2026 | cream `248,239,220` | signal red `222,43,43`, burgundy `124,38,39` | Filson Soft + Ivy Mode (serif display, mixed weights) | 55px / 600 | food photo hero, 4-action strip |
| burritomadre.rs | Restaurant, HM 9 Jul 2026 | peach `250,232,223` | **oxblood ink `95,14,0`**, orange-red `248,62,28` | Figtree only | 30px, tracking -1px | large food photograph hero |
| pomegranate.health | Health, HM 26 Jul 2025 | cream `247,239,223` | **wine ink `58,0,29`**, pink | Gliker (rounded display) + TTC Pro | 70px / 600 | stacked-tab cards, illustrated mark |
| why.zero.university | Education, **SOTM Sep 2026** | deep green `28,72,57` gradient field | white, greys | Supply Sans + PP Supply Mono | giant counter | gradient field + mono |
| ario.law | Law, HM 25 May 2026 | white / blue gradient | black `2,2,2` | one custom sans | **300px wordmark** | 27 imgs, 1 video |
| charitywater.org | NGO, category leader | white | `34,37,32`, one yellow | Proxima Nova + Kazimir (serif) | 46px | real human portrait + inline donation widget |
| ramp.com | B2B finance, category leader | white | near-black, ONE acid yellow-lime CTA | Lausanne only | 64px / 400 | product UI hero, dotted grid |
| mercury.com | B2B banking, category leader | lavender-grey `237,237,243` | black | arcadia + arcadiaDisplay | 50px / 480 | surreal landscape hero, glass pills |
| airbnb.com | Marketplace, category leader | white | `34,34,34`, one brand red | Airbnb Cereal only | n/a | photo grid is the UI |
| excalidraw.com | Tool/webapp, category leader | white | `27,27,31`, one indigo `105,101,219` | Assistant + **Excalifont (handwriting)** | n/a | floating toolbar, canvas as hero |

Same caveats as above (first load, DOM counts, motion not judged). Several screenshots caught loaders or cookie banners.

## New findings
1. **Ink is rarely black.** Oxblood `#5f0e00` (Burrito Madre), wine `#3a001d` (Pomegranate), forest `#2e3a26` (Belgrade Arbor), navy `#1f2a44` (White Desert).
   Tinted ink on a tinted ground is a repeatable, lintable rule.
2. **Photography or drawing *is* the hero** for physical businesses (food, expeditions, property): a full-bleed photograph or a line illustration, not a gradient.
   Where gradients appear (Zero, Ario) they are the brand material itself, art-directed to one hue family.
3. **Serif + grotesk pairs with weight contrast** are the hospitality/real-estate norm (Délice, Sobha, White Desert, Belgrade Arbor); single-grotesk is the B2B/marketplace norm (Ramp, Airbnb).
4. **Positive tracking on light display** (Sobha, +1.37px at 68px) is the luxury counterpart to the negative tracking on tech sites.
5. **One-accent B2B:** Ramp = near-black + one acid yellow-lime; Airbnb = one red. Not purple, not gradient.
6. **Tools can own a personality** (Excalidraw's handwriting font) without breaking usability.
7. **Conversion as a strip:** Délice puts Visit / Reserve / Order online / Gift card in one bar over the hero; charity: water embeds the donation module in the hero.

## Additional directions (anchors measured above)
| id | Direction | Anchors | Core rules | Fits |
|---|---|---|---|---|
| re-line-drawing | Architectural line drawing | Belgrade Arbor (SOTD) | cream ground, forest ink, brass accent, line-art hero, floating pill nav, serif + Work Sans | property, architecture, interiors |
| re-luxe-video | Luxe light + video | Sobha Privy (SOTD) | white, tinted-black ink, serif + grotesk, light display with **positive** tracking, video-led sections | luxury property, hotels |
| hs-expedition | Full-bleed expedition | White Desert (SOTD) | photograph hero, glass nav pills, 200px+ display, navy ink | travel, adventure, high-end hospitality |
| fb-warm-appetite | Warm appetite | Délice (HM) | cream + ONE signal red + burgundy, serif display with mixed weights, action strip | restaurants, bakeries, cafés |
| fb-oxblood-pop | Oxblood pop | Burrito Madre (HM) | oxblood ink on peach, one orange-red, single family, pill buttons, oversized food photograph | casual food, D2C food |
| hl-anti-clinical | Anti-clinical health | Pomegranate (HM) | cream, wine ink, pink, rounded display face, stacked-card layout | wellness, digital health, mental health |
| ed-gradient-field | Gradient field + mono | Zero (SOTM) | one saturated hue as a full-bleed gradient field, mono UI type, a giant counter | education, programmes, cohorts |
| lg-wordmark | Giant wordmark | Ario (HM) | 300px wordmark, single custom sans, one blue field, black/white only | law, consultancies, professional services |
| ngo-human-donate | Human photograph + inline giving | charity: water | real portrait hero, serif headline, donation module in the hero, one yellow | NGOs, fundraising |
| b2b-acid-mono | Acid mono B2B | Ramp | white, near-black, ONE acid CTA colour, single grotesk, copy-led headline over product UI, dotted grid | finance, ops, enterprise SaaS |
| mk-photo-grid | Photo grid marketplace | Airbnb | white, `#222` ink, single family, photography grid is the UI, one brand colour | marketplaces, listings |
| app-owned-tool | Owned-personality tool | Excalidraw | floating toolbar, canvas as hero, one indigo accent, one expressive typeface used sparingly | creative/utility webapps |

## Updated consequences for WyberAi
- **Lint rules to add:** ink must not be `#000`/default zinc (distance from pure black in HSL); ground must be tinted or an explicit white; at most one saturated hue
  plus neutrals; gradients allowed only where the direction says so; display:body ratio >= 3x.
- **Direction → image brief:** physical-business directions (food, property, travel, NGO) need real or generated photography as the hero; our gpt-image-2 pipeline must take a direction-specific art brief.
- **Type pairing is the next blocker:** serif + grotesk pairs and one expressive display face are needed from free families; each direction must be previewed in the real preview engine.
- **Prompt contradiction to remove:** the kit/prompt currently pushes the same glow hero (AuroraBackground, every section Reveal) for every business, which none of the sites above do.

## Third pass: local services, trades, agriculture, fashion, India (10 Nov 2026)
Award-listed sources (Awwwards category pages): beauty/wellness, fitness, agriculture, construction, fashion. Zerodha is a category leader, not award-ranked.

| Site | Category / status | Ground | Ink / accents | Type | Largest type | Media |
|---|---|---|---|---|---|---|
| maximatherapy.com | Therapy/wellness, **SOTD 7 Apr 2026** (Louis Paquet, who also made Mana) | sunny yellow field | black `0,0,0`, cobalt `38,104,253`, orange-red `253,68,1` | Robuck Rounded + ABC Diatype Rounded | 50px | **0 photos, 0 gradients**: flat illustrated characters |
| phive.pt | Fitness, **SOTD 5 Aug 2025** | **saturated yellow `255,217,4` ground** | black, white | PP Formula (extended) | **284px, tracking -5.7px** | 4 videos, 58 imgs |
| farmminerals.com | Agriculture, **SOTD 19 Feb 2026** | white + warm cream `244,237,230` | olive `64,79,29`, `99,111,61`; ink `51,51,51` | Aeonik only | 74px / 500, tracking -1.5px | 70 imgs, 3 videos |
| enerblock.net | Construction, **SOTD 16 May 2026** | **coral `255,89,73` hero ground** | near-black `12,11,17` | Neue Corp only | 72px / 600 | grid lines + "SYSTEM / EST." spec labels, isometric mark, 1 video |
| serotoninn.com | Fashion, **SOTD 4 Aug 2026** | off-white `255,249,247` | black, red `237,56,51`, cyan | Thunder (condensed) + PP Fraktion Mono + Inter | 84px / 800 | **395 imgs, 31 videos**, monochrome cut-outs |
| zerodha.com | Indian broker, category leader | white | greys, one blue `56,126,209` | Inter only | 28px | product screenshot; deliberately plain |

Findings: (1) a **whole-page saturated ground** (Phive yellow, Enerblock coral, Maxima yellow) is a distinct, memorable alternative to dark or white;
(2) trades/industrial sites win with **technical-spec framing** (grid lines, "SYSTEM / EST." labels) rather than polish effects;
(3) agriculture is **earthy, not green-tech**: olive + cream + a single grotesk, with field/product photography;
(4) wellness/therapy can be **fully illustrated** with zero photos; (5) fashion is **monochrome photography + condensed display + mono captions**;
(6) Zerodha shows a plain, text-first page can be right for a trust-heavy audience (not a design direction, a counter-example to "always bold").
Phive's and Maxima's screenshots were partly cookie banners; Farm Minerals' was a loader, so photo quality there is unjudged.

| id | Direction | Anchors | Core rules | Fits |
|---|---|---|---|---|
| il-joyful | Joyful illustration | Maxima Therapy (SOTD) | one saturated field colour, flat character illustration instead of photos, rounded type, black ink | therapy, kids, wellness, education |
| br-signal-ground | Signal-colour ground | Phive (SOTD), Enerblock (SOTD) | the whole page ground is ONE saturated colour, black ink, 280px tightly tracked display or technical-spec grid framing | gyms, clubs, construction, industrial |
| ag-earth | Earth grotesk | Farm Minerals (SOTD) | olive + warm cream, one grotesk at weight 500, tracking -2%, field/product photography | agriculture, food production, export |
| fa-mono-lookbook | Monochrome lookbook | Serotoninn (SOTD) | black/white photography cut-outs, condensed display, monospace captions, one red accent | fashion, boutiques |
| co-spec-poster | Technical spec poster | Enerblock (SOTD) | saturated ground, hairline grid, mono "SYSTEM / EST." labels, isometric mark | construction, hardware, engineering |

## Fonts: what we can actually use (verified 10 Nov 2026)
- **Fontshare** (api.fontshare.com): exactly **100 families**. **36 are SIL OFL** (Archivo, Poppins, Bebas Neue, Anton, Work Sans, Manrope, Epilogue, Sora, Space Grotesk, Roundo, Familjen Grotesk, Nunito, Quicksand, Lora, JetBrains Mono, Azeret Mono, Hind, Kalam, ...).
  The other **64 are "ITF FFL"** (all the distinctive ones: Switzer, General Sans, Satoshi, Clash Display/Grotesk, Cabinet Grotesk, Boska, Gambetta, Sentient, Zodiak, Erode, Recia, Supreme, Author, Excon, Panchang, ...).
  **I could not verify the ITF FFL terms** (fontshare.com/licenses and /terms pages state nothing). We already ship Switzer and General Sans. **Get the licence text checked before relying on them commercially or adding more.**
- **Google Fonts** (fonts.google.com/metadata/fonts): **1,959 families**, all SIL OFL. Every candidate I tested exists:
  Bricolage Grotesque, Unbounded, Syne, Anybody, Instrument Sans/Serif, DM Serif Display, Gloock, Young Serif, Cormorant Garamond, Newsreader, Fraunces,
  Figtree, Inter Tight, Hanken Grotesk, Schibsted Grotesk, Geist/Geist Mono, DM Mono, IBM Plex Mono, Space Grotesk/Mono, Archivo/Archivo Black, Anton, Bebas Neue, Barlow Condensed, Rubik, Fredoka, Baloo 2, Caveat, Permanent Marker.
  Only Big Shoulders Display was missing from my list.
- **Indian scripts exist in Google Fonts**: Noto Sans/Serif Devanagari, Noto Sans/Serif Gujarati, Hind, Hind Vadodara, Mukta, Tiro Devanagari Hindi, Yatra One. Needed for Hindi/Gujarati sites.
- **Award-level sites use free fonts too:** Frans Hals Museum = Rubik, White Desert = Inter Tight (+serif), Belgrade Arbor = Work Sans, Burrito Madre = Figtree, Zerodha = Inter. All are on Google Fonts.

### Free (OFL, Google Fonts) pairings per direction — proposals to test in the preview, not verified visually
| Direction | Display | Body / caption |
|---|---|---|
| ed-brand-world | Newsreader | Hanken Grotesk |
| ty-poster, lt-luxe-fintech, ag-earth, b2b-acid-mono | Inter Tight (weight 300–500, tracking -1 to -2%) | same family |
| mn-signal, mk-photo-grid | Hanken Grotesk | same family |
| dk-studio, dk-instrument | Inter Tight / Geist | DM Mono / Geist Mono |
| mono-dev | Inter Tight | IBM Plex Mono / Space Mono |
| br-saturated, lg-wordmark | Archivo Black / Anton (300px wordmark) | Inter Tight |
| br-signal-ground | Unbounded / Archivo Black | Hanken Grotesk |
| tn-cultural | Rubik 700 caps | Rubik |
| re-line-drawing | Cormorant Garamond / Newsreader | Work Sans |
| re-luxe-video | Cormorant Garamond (light) | Inter Tight, +0.02em tracking |
| hs-expedition | Inter Tight (200px+) | Newsreader accents |
| fb-warm-appetite | DM Serif Display / Gloock | Figtree |
| fb-oxblood-pop | Figtree | Figtree |
| hl-anti-clinical, il-joyful | Fredoka / Baloo 2 | Nunito |
| ed-gradient-field | Space Grotesk | DM Mono |
| ngo-human-donate | Young Serif / Newsreader | Nunito |
| fa-mono-lookbook | Anton / Barlow Condensed | DM Mono |
| co-spec-poster | Archivo | DM Mono |
| app-owned-tool | Caveat (sparingly) | Instrument Sans |

## What is still unresearched
Motion (all measurements are static DOM); logged-in dashboards; small-business templates for kirana/steel/rice-trade type sites in Indian regional languages;
how these directions look when built from our own previews; whether the ITF FFL licence allows what we do.

## Consequences for WyberAi
- **Fonts are a blocker.** The engine loads only Fontshare and Google Fonts. Directions need distinct display + body pairs; the licensed faces above cannot be used. Free candidates must be chosen and visually tested.
- **Remove the glow default.** The kit rules say "hero gets AuroraBackground or BackgroundGrid; every section Reveal". Effects should be opt-in per direction.
- **Lintable rules exist now:** one signal colour, tinted grounds, display-to-body ratio >= 3x, gradient budget, image share, no hue-less dark with neon.
- **Imagery must be a first-class input** (we already have gpt-image-2): each direction needs an image art-direction block.
- **Deal + owned idea + blind render critique** as in slopless (see docs/first-build-verification-plan.md for the render path).
