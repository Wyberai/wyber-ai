import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { creditCost } from './credits'
import {
  WEBSITE_LAUNCH_READY_CONTRACT, WEBSITE_MIN_TIER, checkWebsiteReady, floorWebsiteTier, isLaunchReadyWebsite,
  websiteLaunchReadyCost, websiteLaunchReadyCostText, websiteReadyIssues, websiteReadySummary, sectionCount, englishWordCount,
} from './website-ready'
import { UNSLOP_WEBSITE_RULES } from './unslop-website'
import { runQaChecks } from './agents/qa-checks'

afterEach(() => { vi.unstubAllEnvs() })

describe('flag and price', () => {
  it('is off unless NEXT_PUBLIC_WEBSITE_LAUNCH_READY is "true", and only for websites', () => {
    expect(isLaunchReadyWebsite('website')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_WEBSITE_LAUNCH_READY', 'true')
    expect(isLaunchReadyWebsite('website')).toBe(true)
    for (const t of ['app', 'saas', 'mobile', undefined]) expect(isLaunchReadyWebsite(t as string | undefined)).toBe(false)
  })
  it('floors at medium and shows what credits.ts charges, with the ceiling', () => {
    expect(WEBSITE_MIN_TIER).toBe('medium')
    expect(floorWebsiteTier('small')).toBe('medium')
    expect(floorWebsiteTier('large')).toBe('large')
    const { price, ceiling } = websiteLaunchReadyCost()
    expect(price).toBe(creditCost('website-build', 'fast', 'medium'))
    expect(ceiling).toBe(creditCost('website-build', 'fast', 'large'))
    expect(websiteLaunchReadyCostText()).toContain(String(price))
    expect(websiteLaunchReadyCostText()).toContain(String(ceiling))
  })
})

describe('contract and rules', () => {
  it('has twelve website rules and ten design rules, with credit to unslop', () => {
    for (let i = 1; i <= 12; i++) expect(WEBSITE_LAUNCH_READY_CONTRACT).toContain(`W${i} `)
    for (let i = 1; i <= 10; i++) expect(UNSLOP_WEBSITE_RULES).toContain(`UW${i} `)
    expect(UNSLOP_WEBSITE_RULES).toMatch(/Damir Sokolovsky/)
    expect(UNSLOP_WEBSITE_RULES).toMatch(/CC BY 4\.0/)
  })
  it('forbids invented claims and false success messages, and names the delivery path', () => {
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/NEVER show "Thank you, we received it" unless/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/publicInsert/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/public_enquiries/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/Never invent a phone number/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/no "SOC 2"/)
  })
  it('is wired into the generator behind the flag', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/api/generate/route.ts'), 'utf8')
    expect(src).toMatch(/isLaunchReadyWebsite\(projectType\) \? WEBSITE_LAUNCH_READY_CONTRACT \+ UNSLOP_WEBSITE_RULES/)
    expect(src).toMatch(/floorWebsiteTier\(rawBuildTier\)/)
  })
})

// About 800 words of distinct English sentences, as string literals the way a real site keeps its copy.
const LONG_COPY = Array.from({ length: 70 }, (_, i) => `const line${i} = "Every visit starts with a calm conversation about what you need and what to expect, part ${i}."`).join('\n')

const GOOD: Record<string, string> = {
  'src/owner-details.ts': `export const OWNER = { name: 'Asha Dental', city: 'Ahmedabad', phone: '', whatsapp: '919999999999' }`,
  'index.html': `<title>Asha Dental, Ahmedabad</title><meta name="description" content="x"/><link rel="canonical" href="https://ashadental.example/"/><script type="application/ld+json">{"@type":"LocalBusiness"}</script>`,
  'public/robots.txt': 'User-agent: *', 'public/sitemap.xml': '<urlset/>',
  'src/App.tsx': `
    <h1>Gentle dental care in Ahmedabad</h1>
    {OWNER.whatsapp ? <a href={'https://wa.me/' + OWNER.whatsapp}>WhatsApp</a> : null}
    <form onSubmit={submit}><label htmlFor="n">Name</label><input id="n" className="focus-visible:ring-2"/><input name="company_website" tabIndex={-1} aria-hidden/>
    <p>We use your details only to reply to your enquiry.</p></form>
    const submit = async () => { const r = await publicInsert('public_enquiries', d); if (r.success) setSubmitted(true) }
    <img src="a.jpg" alt="Clinic reception"/>
    <footer><a href="#privacy">Privacy</a> <a href="#terms">Terms</a> <button>हिन्दी</button> const translations = {}</footer>
    <section id="privacy"/><section id="terms"/>
    <section id="services"><h2>Treatments</h2></section><section id="how"><h2>What to expect at your first visit</h2></section>
    <section id="cares"><h2>What we care about</h2></section><section id="faq"><h2>Common questions</h2></section><section id="area"><h2>Where we are</h2></section>
    <section id="visit"><h2>Book a visit</h2></section>
    ${LONG_COPY}
  `,
}

describe('content depth (W16)', () => {
  it('is in the contract and in the definition of done', () => {
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/W16 CONTENT DEPTH THAT NEEDS NO FACTS/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/PLUS the depth sections of W16/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/it never overrides W6, W13, W14 or W15/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/the W16 depth sections are all written/)
  })
  it('sends back a thin site: a hero, a short list of treatments and an about line', () => {
    const thin = { ...GOOD, 'src/App.tsx': `<h1>Gentle dental care in Ahmedabad</h1><section id="services"><li>Check-ups</li><li>Cleaning</li></section><section id="about"><p>A short intro to the clinic.</p></section>` }
    const failed = checkWebsiteReady(thin).items.filter(i => !i.ok).map(i => i.id)
    for (const id of ['sections-depth', 'faq', 'how-it-works', 'copy-depth']) expect(failed).toContain(id)
  })
  it('counts content sections but not page chrome, and counts distinct English copy only', () => {
    expect(sectionCount('<section id="top"/><section id="footer"/><section id="a"/><section id="b"/>')).toBe(2)
    const copy = 'const a = "Every visit starts with a calm conversation about what you need."; const b = "Every visit starts with a calm conversation about what you need."; const c = "ગુજરાતી ભાષામાં લખેલી લાંબી લાઇન જે ગણતરીમાં ન આવવી જોઈએ."'
    expect(englishWordCount(copy)).toBe(11)
  })
  it('turns missing depth into fix prompts the free fix lane can run', () => {
    const thin = { ...GOOD, 'src/App.tsx': `<h1>Dental care</h1>` }
    const issues = websiteReadyIssues(thin)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.length).toBeLessThanOrEqual(6)
  })
})

describe('checkWebsiteReady', () => {
  it('passes a site that has everything', () => {
    const r = checkWebsiteReady(GOOD)
    expect(r.items.filter(i => !i.ok).map(i => i.id)).toEqual([])
    expect(websiteReadySummary(r)).toMatch(/Nothing missing/)
    expect(websiteReadySummary(r)).toMatch(/not opened the site in a browser/)
  })

  it('flags the classic failures: fake compliance, fake success, no contact path, no owner file', () => {
    const r = checkWebsiteReady({
      'src/App.tsx': `<h1>Best</h1><p>SOC 2 Type II certified. Trusted by 5000 clinics. 24/7 support</p><form onSubmit={() => setSubmitted(true)}><input/></form><img src="a.jpg"/>`,
    })
    const failed = r.items.filter(i => !i.ok).map(i => i.id)
    for (const id of ['owner-details', 'no-invented-claims', 'contact-path', 'form-delivers', 'no-fake-success', 'form-purpose', 'alt', 'title-meta', 'json-ld', 'robots-sitemap', 'privacy-terms']) {
      expect(failed).toContain(id)
    }
  })

  it('skips form checks when there is no form and the language check outside India', () => {
    const r = checkWebsiteReady({ 'src/App.tsx': '<h1>Bakery in Austin</h1>' })
    const ids = r.items.map(i => i.id)
    for (const id of ['form-delivers', 'no-fake-success', 'form-purpose', 'honeypot', 'language-toggle']) expect(ids).not.toContain(id)
  })

  it('requires the language toggle for an Indian business', () => {
    const r = checkWebsiteReady({ 'src/App.tsx': '<h1>Clinic in Pune</h1>' })
    expect(r.items.find(i => i.id === 'language-toggle')?.ok).toBe(false)
  })

  it('does not count a success state that follows a real write as fake', () => {
    const r = checkWebsiteReady({ 'src/App.tsx': `<form onSubmit={s}/> const s = async () => { const res = await publicInsert('public_enquiries', d); if (res.success) setSubmitted(true) }` })
    expect(r.items.find(i => i.id === 'no-fake-success')?.ok).toBe(true)
  })

  it('returns at most four launch items plus two design items as fix prompts', () => {
    const issues = websiteReadyIssues({ 'src/App.tsx': `<h1>x</h1> bg-clip-text text-transparent 👋 Welcome back!` })
    expect(issues.length).toBeLessThanOrEqual(6)
    expect(issues.filter(i => !i.detail.startsWith('Design')).length).toBe(4)
    expect(issues.some(i => i.detail.startsWith('Design'))).toBe(true)
  })
})

describe('qa-checks integration', () => {
  it('adds website items only for websites and only when the flag is on', () => {
    const files = { 'src/App.tsx': 'export default function App(){return null}' }
    expect(runQaChecks(files, 'website').some(i => i.kind === 'launch-ready')).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_WEBSITE_LAUNCH_READY', 'true')
    expect(runQaChecks(files, 'website').some(i => i.kind === 'launch-ready')).toBe(true)
    expect(runQaChecks(files, 'app').some(i => i.kind === 'launch-ready')).toBe(false)
  })
})

import { contactNudge } from './website-ready'
import { mergeOwnerDetails, applyGrowKit, EMPTY_GROW_CONFIG } from './grow-kit'

describe('contact path fix (14 Nov): no dead buttons, no notes to the owner', () => {
  it('the contract says never to render a button or form that cannot work, and never to leave notes on the page', () => {
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/NEVER render a WhatsApp or call button, or a wa\.me link, when its OWNER value is empty/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/DO NOT render the form at all/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/W13 NO NOTES TO THE OWNER ON THE PAGE/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/read every value from OWNER at render time/)
  })

  it('flags the exact note the last build showed to visitors', () => {
    const r = checkWebsiteReady({
      'src/owner-details.ts': `export const OWNER = { whatsapp: '' }`,
      'src/App.tsx': `<p className="text-sm">Add the clinic WhatsApp number or email in owner-details to turn this on.</p>`,
    })
    expect(r.items.find(i => i.id === 'no-owner-notes')?.ok).toBe(false)
  })

  it('does not flag an import of owner-details or a code comment', () => {
    const r = checkWebsiteReady({
      'src/owner-details.ts': `export const OWNER = { whatsapp: '' }`,
      'src/App.tsx': `import { OWNER } from './owner-details'\n// owner: set your number in owner-details\nconst x = OWNER.whatsapp ? <a href={'https://wa.me/' + OWNER.whatsapp}>WhatsApp</a> : null`,
    })
    expect(r.items.find(i => i.id === 'no-owner-notes')?.ok).toBe(true)
    expect(r.items.find(i => i.id === 'cta-guarded')?.ok).toBe(true)
  })

  it('flags a WhatsApp button with no link, and an unguarded wa.me link built from an empty value', () => {
    expect(checkWebsiteReady({ 'src/App.tsx': `<button>WhatsApp પર બુક કરો</button>` }).items.find(i => i.id === 'cta-guarded')?.ok).toBe(false)
    expect(checkWebsiteReady({ 'src/App.tsx': "<a href={`https://wa.me/${OWNER.whatsapp}`}>WhatsApp</a>" }).items.find(i => i.id === 'cta-guarded')?.ok).toBe(false)
  })

  it('nudges once when no WhatsApp, phone or email is set, and stays quiet when one is', () => {
    const empty = { 'src/owner-details.ts': `export const OWNER = { name: "Smilecraft", whatsapp: "", phone: "", email: "" }` }
    expect(contactNudge(empty)).toMatch(/visitors cannot reach you yet/)
    expect(contactNudge(empty)).toMatch(/Grow tab/)
    expect(contactNudge({ 'src/owner-details.ts': `export const OWNER = { whatsapp: "919999999999", phone: "" }` })).toBeNull()
    expect(contactNudge({ 'src/owner-details.ts': `export const OWNER = { phone: '+91 99999 99999' }` })).toBeNull()
    expect(contactNudge({ 'src/App.tsx': 'x' })).toBeNull()
  })

  it('the editor shows the nudge after a launch-ready website build', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/editor/ChatPanel.tsx'), 'utf8')
    expect(src).toMatch(/const contactMsg = contactNudge\(updatedFiles\)/)
  })
})

describe('Grow panel fills owner-details', () => {
  const existing = `export const OWNER = {\n  name: "Smilecraft",\n  city: "Ahmedabad",\n  phone: "",\n  whatsapp: "",\n  hours: "",\n  years: "",\n  languages: "en,hi,gu",\n};\n`
  const cfg = { ...EMPTY_GROW_CONFIG, businessName: 'Smilecraft Dental', whatsapp: '99999 88888', phone: '079 1234 5678', hours: 'Mon to Sat, 10am to 7pm' }

  it('rewrites the Grow facts and keeps every other key', () => {
    const out = mergeOwnerDetails(existing, cfg)
    expect(out).toContain('name: "Smilecraft Dental"')
    expect(out).toContain('whatsapp: "919999988888"')
    expect(out).toContain('phone: "079 1234 5678"')
    expect(out).toContain('hours: "Mon to Sat, 10am to 7pm"')
    expect(out).toContain('city: "Ahmedabad"')
    expect(out).toContain('languages: "en,hi,gu"')
    expect(out).toContain('years: ""')
  })

  it('does not blank a value the owner already had when the panel field is empty', () => {
    const out = mergeOwnerDetails(`export const OWNER = { address: "12 MG Road", phone: "" }`, { ...EMPTY_GROW_CONFIG, businessName: 'X' })
    expect(out).toContain('address: "12 MG Road"')
  })

  it('applyGrowKit updates owner-details.ts only when the project has one', () => {
    const base = {
      'index.html': '<html><head></head><body></body></html>',
      'src/main.tsx': `import React from 'react'\n`,
      'src/owner-details.ts': { path: 'src/owner-details.ts', language: 'typescript', content: existing },
    }
    const out = applyGrowKit(base, cfg, { qrSvg: '' }) as Record<string, { content?: string }>
    expect(out['src/owner-details.ts'].content).toContain('whatsapp: "919999988888"')
    const { 'src/owner-details.ts': _drop, ...without } = base
    const out2 = applyGrowKit(without, cfg, { qrSvg: '' }) as Record<string, unknown>
    expect('src/owner-details.ts' in out2).toBe(false)
  })
})

import { deadAnchors } from './website-ready'
describe('in-page links land somewhere (14 Nov)', () => {
  it('the contract tells the model to hide the nav link with its section', () => {
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/W14 NAV LINKS LAND SOMEWHERE/)
  })
  it('finds the dead #timings link from the dental build', () => {
    const code = '<a href="#services">S</a><a href="#timings">T</a><section id="services"/>'
    expect(deadAnchors(code)).toEqual(['timings'])
    expect(checkWebsiteReady({ 'src/App.tsx': code }).items.find(i => i.id === 'anchors-resolve')?.ok).toBe(false)
  })
  it('passes when every target exists, including id set from a string expression', () => {
    expect(deadAnchors('<a href="#a">x</a><a href={"#b"}>y</a><div id="a"/><div id={"b"}/>')).toEqual([])
  })
})

import { inventedPeople } from './website-ready'
describe('no invented facts (15 Nov)', () => {
  const owner = `// FILE src/owner-details.ts\nexport const OWNER = { name: "", team: "", timetable: "" }\n`
  it('contract bans invented names, people, timetables and prices, and dead Book buttons', () => {
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/W15 NO INVENTED FACTS ABOUT THE BUSINESS/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/team: ""[^a-z]{1,8}timetable: ""/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/only scroll to another section/)
  })
  it('flags the teachers from the Pune yoga build', () => {
    const app = `// FILE src/App.tsx\n<h2>Teachers</h2><h3>Meera Kulkarni</h3><p>Lead teacher</p><h3>Rohan Deshpande</h3>`
    expect(inventedPeople(owner + app)).toEqual(['Meera Kulkarni', 'Rohan Deshpande'])
    expect(checkWebsiteReady({ 'src/owner-details.ts': owner, 'src/App.tsx': app.replace('// FILE src/App.tsx\n', '') }).items.find(i => i.id === 'no-invented-people')?.ok).toBe(false)
  })
  it('flags Dr. names and teacher: keys', () => {
    expect(inventedPeople(owner + `// FILE src/App.tsx\n<p>Dr. Asha Shah</p>`)).toEqual(['Dr. Asha Shah'])
    expect(inventedPeople(owner + `// FILE src/App.tsx\nconst c = { teacher: "Rohan Deshpande" }`)).toEqual(['Rohan Deshpande'])
  })
  it('allows names the owner gave, and headings that are not people', () => {
    const own = `// FILE src/owner-details.ts\nexport const OWNER = { team: "Meera Kulkarni, lead teacher" }\n`
    expect(inventedPeople(own + `// FILE src/App.tsx\n<h2>Teachers</h2><h3>Meera Kulkarni</h3>`)).toEqual([])
    expect(inventedPeople(owner + `// FILE src/App.tsx\n<h2>Classes</h2><h3>Hatha Foundations</h3>`)).toEqual([])
    expect(inventedPeople(owner + `// FILE src/App.tsx\n<h2>Teachers</h2>{OWNER.team && <p>{OWNER.team}</p>}`)).toEqual([])
  })
  it('the nudge also says staff, timetable and prices were left out', () => {
    expect(contactNudge({ 'src/owner-details.ts': 'export const OWNER = { whatsapp: "", phone: "", email: "", team: "", timetable: "" }' })).toMatch(/staff names, the timetable and prices/)
  })
})

describe('post-build check is wired without the agent team (15 Nov)', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/components/editor/ChatPanel.tsx'), 'utf8')
  it('runs on its own launch-ready gate, not only on AGENT_TEAM_ENABLED', () => {
    expect(src).toMatch(/const launchQaOn = isLaunchReadyApp\(projectType\)/)
    expect(src).toMatch(/\(AGENT_TEAM_ENABLED \|\| \(launchQaOn && qaFirstBuild\)\) && qaEligible/)
  })
  it('runs only after a first build, never after a later edit such as "add a settings page" (16 Nov)', () => {
    expect(src).toMatch(/const qaFirstBuild = !hasGeneratedFiles \|\| \(opts\?\.stage === 'fill' && !!opts\?\.finalPass\)/)
  })
  it('a launch-ready fix pass names what it added; continuation passes never claim the build is complete (16 Nov)', () => {
    expect(src).toMatch(/Added what was missing:/)
    const dict = fs.readFileSync(path.join(process.cwd(), 'src/lib/i18n/dict/editor-chatpanel.ts'), 'utf8')
    expect(dict).not.toMatch(/continuationDoneMsg: '[^']*build is complete/i)
  })
  it('with the agent team off it acts only on launch-ready findings, and shows results as chat messages', () => {
    expect(src).toMatch(/\.filter\(i => AGENT_TEAM_ENABLED \|\| i\.kind === 'launch-ready'\)/)
    expect(src).toMatch(/const say = \(text: string\) =>/)
    expect(src).toMatch(/if \(contactMsg\) say\(contactMsg\)/)
  })
})

describe('fix pass instructions (15 Nov)', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/components/editor/ChatPanel.tsx'), 'utf8')
  it('tells the model to answer with file blocks, and never shows a scary bubble when a fix pass changes nothing', () => {
    expect(src).toMatch(/Output each changed file as a COMPLETE <file> block/)
    expect(src).toMatch(/!opts\?\.quietRetryEligible && !opts\?\.qaFix/)
    expect(src).toMatch(/qaFix: !!detail\.qaFix/)
  })
})

describe('launch-ready fix passes are free (15 Nov)', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/components/editor/ChatPanel.tsx'), 'utf8')
  it('a qaFix pass is free even when earlier repair passes used the allowance', () => {
    expect(src).toMatch(/const freeSelfHeal = isSelfHeal && \(!!opts\?\.qaFix \|\| totalRepairPassesRef\.current <= FREE_REPAIR_PASSES\)/)
  })
})

import { deadActionButtons, formTextWithoutForm } from './website-ready'
describe('no action promised without an action (15 Nov)', () => {
  const emptyOwner = `// FILE src/owner-details.ts\nexport const OWNER = { name: "", whatsapp: "", phone: "", email: "" }\n`
  const filledOwner = `// FILE src/owner-details.ts\nexport const OWNER = { name: "", whatsapp: "919999999999", phone: "", email: "" }\n`
  const coaching = `// FILE src/App.tsx\n<a href="#contact" className="btn">Demo class</a>\n<section id="contact"><p>We will get back to you about a demo class.</p></section>\n<p>We collect only the details you type into the enquiry form.</p>`

  it('flags the Demo class button and the enquiry-form text from the coaching build', () => {
    expect(deadActionButtons(emptyOwner + coaching)).toEqual(['Demo class'])
    expect(formTextWithoutForm(emptyOwner + coaching)).toBe(true)
    const r = checkWebsiteReady({ 'src/owner-details.ts': emptyOwner, 'src/App.tsx': coaching })
    expect(r.items.find(i => i.id === 'actions-have-action')?.ok).toBe(false)
    expect(r.items.find(i => i.id === 'privacy-matches-form')?.ok).toBe(false)
  })

  it('allows the button once a contact fact exists, or when a form is rendered', () => {
    expect(deadActionButtons(filledOwner + coaching)).toEqual([])
    expect(formTextWithoutForm(filledOwner + coaching)).toBe(false)
    expect(deadActionButtons(emptyOwner + coaching + `\n<form onSubmit={go}></form>`)).toEqual([])
    expect(formTextWithoutForm(emptyOwner + coaching + `\n<form onSubmit={go}></form>`)).toBe(false)
  })

  it('allows a button inside the same condition as the contact fact', () => {
    const guarded = `// FILE src/App.tsx\n{OWNER.whatsapp && <a href="https://wa.me/1">Book a class</a>}`
    expect(deadActionButtons(emptyOwner + guarded)).toEqual([])
  })

  it('ignores words that are not actions, and code comments', () => {
    expect(deadActionButtons(emptyOwner + `// FILE src/App.tsx\n<a href="#courses">See courses</a>\n// <a>Book now</a>`)).toEqual([])
  })

  it('the contract covers words as well as buttons', () => {
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/"Demo class"/)
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/we will get back to you/)
  })
})

import { inventedBusinessName } from './website-ready'
describe('no coined business name (15 Nov)', () => {
  const owner = (name: string, city = '') => `// FILE src/owner-details.ts\nexport const OWNER = { name: "${name}", city: "${city}", whatsapp: "", phone: "", email: "" }\n`
  const html = (t: string) => `// FILE index.html\n<title>${t}</title>\n`

  it('flags the names the model coined on the yoga and coaching builds', () => {
    expect(inventedBusinessName(owner('') + html('Shikshan Path | JEE and NEET coaching'))).toBe('Shikshan Path')
    expect(inventedBusinessName(owner('', 'Pune') + html('Prana Yoga Studio, Pune'))).toBe('Prana Yoga Studio, Pune')
    expect(inventedBusinessName(owner('') + html('Smile Dental Clinic | Dental clinic in Ahmedabad'))).toBe('Smile Dental Clinic')
  })

  it('allows plain descriptions, acronyms and the owner city', () => {
    expect(inventedBusinessName(owner('', 'Pune') + html('Yoga studio in Pune | Classes'))).toBeNull()
    expect(inventedBusinessName(owner('') + html('JEE & NEET Coaching'))).toBeNull()
    expect(inventedBusinessName(owner('', 'Surat') + html('Bakery in Surat: custom cakes'))).toBeNull()
  })

  it('allows any title when the owner gave the name, and when there is no title', () => {
    expect(inventedBusinessName(owner('Asha Dental') + html('Asha Dental | Ahmedabad'))).toBeNull()
    expect(inventedBusinessName(owner('') + `// FILE src/App.tsx\n<h1>Hi</h1>`)).toBeNull()
  })

  it('is a launch-ready item with a fix, and the nudge asks for the name', () => {
    const r = checkWebsiteReady({ 'src/owner-details.ts': owner(''), 'index.html': html('Shikshan Path | JEE coaching').replace('// FILE index.html\n', '') })
    expect(r.items.find(i => i.id === 'no-invented-name')).toBeTruthy()
    expect(WEBSITE_LAUNCH_READY_CONTRACT).toMatch(/never coin a brand such as/)
    expect(contactNudge({ 'src/owner-details.ts': 'export const OWNER = { name: "", whatsapp: "", phone: "", email: "" }' })).toMatch(/business name is not set/)
  })
})

describe('edit pass handing off to a follow-up pass (16 Nov)', () => {
  it('closes its own bubble instead of leaving an orphaned "Working on your changes..." spinner', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/editor/ChatPanel.tsx'), 'utf8')
    expect(src).not.toMatch(/ownsBubble && completenessRetryFired\) \{\s*updateMessage\(assistantId, \{ status: 'streaming' \}\)/)
    expect(src).toMatch(/finishing the rest now, a few more updates coming below/)
  })
})
