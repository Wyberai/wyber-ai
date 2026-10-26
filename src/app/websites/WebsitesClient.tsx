'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { track } from '@/lib/track'

// /websites — "your business, found on Google and ChatGPT". India-first.
// Free: the plan (via /api/websites/plan). Paid: the build, which the
// dashboard only starts once the balance covers websiteLaunchEstimate().min
// (WebsiteCreditGate). Every number on this page comes from that estimate,
// i.e. from credits.ts — nothing here is hardcoded pricing.

type Estimate = { steps: { key: string; label: string; credits: number; max?: number }[]; min: number; max: number }
type Plan = {
  businessName: string; category: string; city: string; tagline: string; about: string
  services: { name: string; price: string }[]; phone: string; whatsapp: string; email: string; address: string; hours: string
  pages: { name: string; sections: string[] }[]; faqs: { q: string; a: string }[]; missing: string[]
}

// Studio pack: 200 credits for ₹1,999 / $99 — the per-credit rate used to
// show a rupee/dollar range next to the credit range.
const PER_CREDIT = { INR: 1999 / 200, USD: 99 / 200 }
function money(credits: number, cur: 'INR' | 'USD') {
  const v = credits * PER_CREDIT[cur]
  return cur === 'INR' ? `₹${(Math.round(v / 100) * 100).toLocaleString('en-IN')}` : `$${Math.round(v / 5) * 5}`
}

const SHARE_TEXT = 'Your business deserves a better website. Paste your old site here and see the plan for a new one, free: https://wyberai.com/websites'

export function WebsitesClient({ currency, estimate }: { currency: 'INR' | 'USD'; estimate: Estimate }) {
  const [tab, setTab] = useState<'url' | 'describe'>('url')
  const [url, setUrl] = useState('')
  const [form, setForm] = useState({ name: '', about: '', city: '', whatsapp: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ plan: Plan; prompt: string } | null>(null)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    track('websites_page_viewed', { currency })
    import('@/lib/supabase/client').then(({ createClient }) => createClient().auth.getUser().then(({ data }) => setSignedIn(!!data.user))).catch(() => {})
  }, [currency])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    track('websites_plan_requested', { mode: tab })
    try {
      const res = await fetch('/api/websites/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'url' ? { url } : form),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Something went wrong — try again.'); return }
      setResult(d)
      track('websites_plan_shown', { mode: tab, pages: d.plan.pages.length, faqs: d.plan.faqs.length })
      setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch {
      setError('Something went wrong — try again.')
    } finally {
      setLoading(false)
    }
  }

  const build = () => {
    if (!result) return
    try {
      localStorage.setItem('wyber-pending-prompt', result.prompt.slice(0, 6000))
      localStorage.setItem('wyber-pending-type', 'website')
      localStorage.setItem('wyber-pending-source', 'websites')
      localStorage.setItem('wyber-pending-project-name', result.plan.businessName.slice(0, 80))
    } catch { /* private mode */ }
    track('websites_build_clicked', { signedIn })
    window.location.href = signedIn ? '/dashboard' : '/signup?next=/dashboard'
  }

  const p = result?.plan

  return (
    <div className="ws">
      <style>{CSS}</style>

      <nav className="ws-nav">
        <Link href="/" aria-label="WyberAi home"><WyberLogo markSize={22} wordmarkSize={14} theme="onLight" /></Link>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/login" className="ws-link">Sign in</Link>
          <a href="#start" className="ws-btn ws-btn-sm">See my plan free</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="ws-hero" id="start">
        <div className="ws-hero-copy">
          <div className="ws-kicker">For shops, clinics, restaurants, tutors & local services</div>
          <h1>Your business, found on <span className="ws-hl">Google</span> and <span className="ws-hl">ChatGPT</span>.</h1>
          <p className="ws-lead">
            Paste your old website — or tell us about your business. We plan a fast, multi-page site with your real details
            that search engines <em>and</em> AI assistants can actually read.
          </p>
          <p className="ws-hindi" lang="hi">पुरानी वेबसाइट? मिनटों में नई बनवाइए।</p>

          <form onSubmit={submit} className="ws-tool">
            <div className="ws-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'url'} className={tab === 'url' ? 'on' : ''} onClick={() => setTab('url')}>I have a website</button>
              <button type="button" role="tab" aria-selected={tab === 'describe'} className={tab === 'describe' ? 'on' : ''} onClick={() => setTab('describe')}>I don’t have one yet</button>
            </div>
            {tab === 'url' ? (
              <div className="ws-row">
                <input className="ws-input" inputMode="url" placeholder="yourbusiness.com" value={url} onChange={e => setUrl(e.target.value)} required aria-label="Your current website" />
                <button className="ws-btn" disabled={loading}>{loading ? 'Reading your site…' : 'Plan my new site'}</button>
              </div>
            ) : (
              <div className="ws-grid">
                <input className="ws-input" placeholder="Business name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required aria-label="Business name" />
                <input className="ws-input" placeholder="City / area" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} aria-label="City" />
                <textarea className="ws-input ws-span" rows={3} placeholder="What you do, what you sell, timings, prices — anything customers ask about" value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} required aria-label="About your business" />
                <input className="ws-input" inputMode="tel" placeholder="WhatsApp number (optional)" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} aria-label="WhatsApp number" />
                <button className="ws-btn" disabled={loading}>{loading ? 'Planning…' : 'Plan my site'}</button>
              </div>
            )}
            {error && <div className="ws-error">{error}</div>}
            <div className="ws-fine">The plan is free. We only use your business details — never another site’s design.</div>
          </form>
        </div>

        {/* Before / after — illustration, not a customer */}
        <div className="ws-ba" aria-hidden="true">
          <div className="ws-old">
            <div className="ws-old-bar">www.sharmasweets.in/index.htm</div>
            <div className="ws-old-body">
              <div className="ws-marquee"><span>★ WELCOME TO OUR WEBSITE ★ BEST SWEETS IN TOWN ★ CALL NOW ★</span></div>
              <div className="ws-old-h">Sharma Sweets &amp; Namkeen</div>
              <div className="ws-old-u">Home | About Us | Contact Us</div>
              <div className="ws-old-p">Site under construction. Please visit again!!!</div>
              <div className="ws-old-c">Visitors: <b>004213</b></div>
              <div className="ws-old-s">Best viewed in Internet Explorer 6</div>
            </div>
          </div>
          <div className="ws-arrow">→</div>
          <div className="ws-new">
            <div className="ws-new-top"><b>Sharma Sweets</b><span>Menu · Order · Visit</span></div>
            <div className="ws-new-h">Fresh mithai, made daily in Jayanagar.</div>
            <div className="ws-new-chips"><span>Open 8am–10pm</span><span>Kaju katli · ₹1,200/kg</span></div>
            <div className="ws-new-wa">● Order on WhatsApp</div>
            <div className="ws-ai">
              <div className="ws-ai-q">“sweet shop open late in Jayanagar?”</div>
              <div className="ws-ai-a">Sharma Sweets, 4th Block — open till 10pm. Order on WhatsApp.</div>
            </div>
          </div>
          <div className="ws-ill">Illustration</div>
        </div>
      </header>

      {/* PLAN RESULT */}
      {p && (
        <section className="ws-plan" id="plan">
          <div className="ws-plan-head">
            <div>
              <div className="ws-kicker">Your free plan</div>
              <h2>{p.businessName}</h2>
              <div className="ws-sub">{[p.category, p.city].filter(Boolean).join(' · ')}</div>
            </div>
            <button className="ws-btn" onClick={build}>Build my website →</button>
          </div>

          <div className="ws-plan-grid">
            <div className="ws-card">
              <h3>What we found</h3>
              {p.tagline && <p className="ws-q">“{p.tagline}”</p>}
              <ul className="ws-facts">
                {p.services.length > 0 && <li><b>{p.services.length}</b> services / products</li>}
                {p.address && <li>{p.address}</li>}
                {p.phone && <li>{p.phone}</li>}
                {p.whatsapp && <li>WhatsApp {p.whatsapp}</li>}
                {p.email && <li>{p.email}</li>}
                {p.hours && <li>{p.hours}</li>}
              </ul>
              {p.missing.length > 0 && <p className="ws-miss">Add later: {p.missing.join(', ')}. We never make these up.</p>}
            </div>
            <div className="ws-card">
              <h3>Your pages</h3>
              <ol className="ws-pages">
                {p.pages.map(pg => <li key={pg.name}><b>{pg.name}</b><span>{pg.sections.join(' · ')}</span></li>)}
              </ol>
            </div>
            {p.faqs.length > 0 && (
              <div className="ws-card ws-span2">
                <h3>Questions AI assistants will be able to answer about you</h3>
                <div className="ws-faqs">
                  {p.faqs.map(f => <div key={f.q}><b>{f.q}</b><span>{f.a}</span></div>)}
                </div>
              </div>
            )}
          </div>
          <CostTable estimate={estimate} currency={currency} />
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="ws-btn ws-btn-lg" onClick={build}>Build {p.businessName}’s website →</button>
          </div>
        </section>
      )}

      {/* WHAT AI SEES */}
      <section className="ws-sec">
        <div className="ws-kicker">Why most small-business sites are invisible to AI</div>
        <h2>ChatGPT can’t recommend a business it can’t read.</h2>
        <p className="ws-lead">
          Many sites — including most built with app builders — show their content only after JavaScript runs.
          AI crawlers usually don’t run it, so they see a blank page. Your WyberAi site is published with a readable copy of every page, built for them.
        </p>
        <div className="ws-crawl">
          <div className="ws-term">
            <div className="ws-term-h">What an AI crawler reads · typical site</div>
            <pre>{`<title>Home</title>
<div id="root"></div>

— 0 words about the business —`}</pre>
          </div>
          <div className="ws-term ws-term-ok">
            <div className="ws-term-h">What it reads · your WyberAi site</div>
            <pre>{`# Sharma Sweets — Jayanagar, Bengaluru
Open 8am–10pm · WhatsApp +91 …
Kaju katli ₹1,200/kg · Rasmalai …
Q: Do you deliver? A: Yes, within 5 km…

+ LocalBusiness & FAQ data · llms.txt`}</pre>
          </div>
        </div>
      </section>

      {/* INCLUDED */}
      <section className="ws-sec">
        <div className="ws-kicker">Every site includes</div>
        <h2>Built to be found, and to get you enquiries.</h2>
        <div className="ws-incl">
          {[
            ['Readable by AI assistants', 'A crawler-ready copy of every page, plus an llms.txt summary.'],
            ['Business details search engines trust', 'LocalBusiness and FAQ structured data, titles and descriptions.'],
            ['Answers to real customer questions', 'An FAQ written from your details — the questions people ask ChatGPT.'],
            ['WhatsApp, maps and enquiry form', 'Customers can message, find you and enquire in one tap.'],
            ['Multiple pages, mobile-first', 'Home, services or menu, gallery, about, contact — fast on any phone.'],
            ['Share card and QR code', 'A proper preview when your link is shared, and a QR for your counter.'],
          ].map(([t, d]) => <div key={t} className="ws-inc"><b>{t}</b><span>{d}</span></div>)}
        </div>
      </section>

      {/* COST */}
      <section className="ws-sec" id="cost">
        <div className="ws-kicker">What it costs</div>
        <h2>You pay for what your site uses — nothing hidden.</h2>
        <p className="ws-lead">A complete website is built from the same steps everyone pays for on WyberAi. Bigger sites use more credits; you see the cost of each step before it runs.</p>
        <CostTable estimate={estimate} currency={currency} />
        <div className="ws-compare">
          <div><b>Freelancer</b><span>{currency === 'INR' ? '₹15,000–80,000' : '$300–1,500'} · 2–4 weeks · changes cost extra</span></div>
          <div><b>Template builders</b><span>Looks like everyone else’s · often invisible to AI crawlers</span></div>
          <div className="ws-us"><b>WyberAi</b><span>About {money(estimate.min, currency)}–{money(estimate.max, currency)} in credits · readable by Google and AI · you own the code</span></div>
        </div>
      </section>

      {/* DONE FOR YOU + SHARE */}
      <section className="ws-sec ws-two">
        <div className="ws-card">
          <h3>Rather we build it for you?</h3>
          <p>Talk to us for 15 minutes — we’ll scope it and give you a firm quote.</p>
          <Link className="ws-btn ws-btn-ghost" href={currency === 'INR' ? '/india-consult' : '/setup-call'}>Book a free call</Link>
        </div>
        <div className="ws-card">
          <h3>Know a business with an old website?</h3>
          <p>Send them this page — they can see their new site’s plan for free.</p>
          <a className="ws-btn ws-btn-wa" href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer" onClick={() => track('websites_shared', { channel: 'whatsapp' })}>Share on WhatsApp</a>
        </div>
      </section>

      {/* FAQ */}
      <section className="ws-sec">
        <h2>Questions</h2>
        <div className="ws-faq">
          {[
            ['Is the plan really free?', 'Yes. Reading your site and planning your new one costs nothing and needs no sign-up. You only use credits when you build.'],
            [`How much will my website cost?`, `A complete site — build, ${estimate.steps.find(s => s.key === 'photos')?.label.toLowerCase()}, an SEO + AI-search pass and a few edits — uses about ${estimate.min}–${estimate.max} credits (${money(estimate.min, currency)}–${money(estimate.max, currency)}). Larger sites use more. You need ${estimate.min} credits before the build starts.`],
            ['Will I show up in Google and ChatGPT?', 'We make your site readable and well-described for search engines and AI assistants — the part most small-business sites get wrong. No one can promise a ranking, and anyone who does is guessing.'],
            ['Can I use my own domain?', 'Yes — connect a domain you own on the Builder plan or above. Until then your site is live on a free wyberai.com link.'],
            ['Can it be in Hindi or my language?', 'Yes. Ask for Hindi, Kannada, Telugu, Tamil or any language, in the plan or later as an edit.'],
            ['Who owns the website?', 'You do. Export the code or push it to GitHub any time.'],
          ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <footer className="ws-foot">
        <Link href="/">WyberAi</Link><span>·</span><Link href="/pricing">Pricing</Link><span>·</span><Link href="/privacy">Privacy</Link><span>·</span><Link href="/terms">Terms</Link>
      </footer>
    </div>
  )
}

function CostTable({ estimate, currency }: { estimate: Estimate; currency: 'INR' | 'USD' }) {
  return (
    <div className="ws-cost">
      {estimate.steps.map(s => (
        <div key={s.key} className="ws-cost-row">
          <span>{s.label}</span>
          <b>{s.max ? `${s.credits}–${s.max}` : s.credits} credits</b>
        </div>
      ))}
      <div className="ws-cost-row ws-cost-total">
        <span>Typical complete website</span>
        <b>{estimate.min}–{estimate.max} credits · about {money(estimate.min, currency)}–{money(estimate.max, currency)}</b>
      </div>
    </div>
  )
}

const CSS = `
.ws{--paper:#FBF8F3;--ink:#1C1917;--ink2:#57534E;--ink3:#8A847C;--line:#E7E1D8;--card:#FFFFFF;--brand:#0284C7;--brand2:#0EA5E9;--ok:#15803D;--wa:#25D366;
  background:var(--paper);color:var(--ink);min-height:100vh;font-family:var(--font-display,system-ui),system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.ws a{color:inherit}
.ws-nav{display:flex;justify-content:space-between;align-items:center;padding:14px clamp(16px,4vw,48px);border-bottom:1px solid var(--line);background:rgba(251,248,243,.92);position:sticky;top:0;z-index:20;backdrop-filter:blur(8px)}
.ws-link{font-size:14px;color:var(--ink2);text-decoration:none}
.ws-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--brand);color:#fff!important;border:none;border-radius:10px;padding:12px 18px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;font-family:inherit;white-space:nowrap;transition:background .15s,transform .15s}
.ws-btn:hover{background:#0369A1;transform:translateY(-1px)}
.ws-btn:disabled{opacity:.6;cursor:wait;transform:none}
.ws-btn-sm{padding:8px 14px;font-size:13px}
.ws-btn-lg{padding:15px 26px;font-size:16px}
.ws-btn-ghost{background:transparent;color:var(--ink)!important;border:1.5px solid var(--ink)}
.ws-btn-ghost:hover{background:var(--ink);color:#fff!important}
.ws-btn-wa{background:var(--wa)}.ws-btn-wa:hover{background:#1EB955}
.ws-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--brand);margin-bottom:12px}
.ws h1{font-size:clamp(34px,6vw,62px);line-height:1.02;letter-spacing:-.035em;margin:0 0 18px;font-weight:700}
.ws h2{font-size:clamp(26px,4vw,40px);line-height:1.1;letter-spacing:-.03em;margin:0 0 12px;font-weight:700}
.ws h3{font-size:16px;margin:0 0 10px}
.ws-hl{background:linear-gradient(transparent 62%,#BAE6FD 62%)}
.ws-lead{font-size:clamp(16px,2vw,19px);line-height:1.55;color:var(--ink2);max-width:640px;margin:0 0 10px}
.ws-hindi{font-size:17px;color:var(--ink3);margin:0 0 22px}
.ws-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(24px,4vw,56px);align-items:center;padding:clamp(36px,6vw,80px) clamp(16px,4vw,48px);max-width:1240px;margin:0 auto}
.ws-tool{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 12px 32px rgba(28,25,23,.06)}
.ws-tabs{display:flex;gap:4px;margin-bottom:12px;background:#F3EEE6;padding:4px;border-radius:10px}
.ws-tabs button{flex:1;border:none;background:none;padding:9px 10px;border-radius:7px;font-size:14px;font-weight:600;color:var(--ink2);cursor:pointer;font-family:inherit}
.ws-tabs button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.ws-row{display:flex;gap:8px}
.ws-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ws-span{grid-column:1/-1}
.ws-input{width:100%;box-sizing:border-box;border:1.5px solid var(--line);border-radius:10px;padding:12px 14px;font-size:16px;font-family:inherit;color:var(--ink);background:#fff;outline:none;resize:vertical}
.ws-input:focus{border-color:var(--brand2)}
.ws-error{margin-top:10px;color:#B91C1C;font-size:14px}
.ws-fine{margin-top:10px;font-size:12.5px;color:var(--ink3)}
.ws-ba{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr);align-items:center;gap:10px}
.ws-old{min-width:0;overflow:hidden;background:#C0C0C0;border:2px outset #ddd;font-family:'Times New Roman',Times,serif;transform:rotate(-2.5deg);box-shadow:0 10px 24px rgba(0,0,0,.12)}
.ws-old-bar{background:#000080;color:#fff;font:11px/1.6 Tahoma,Verdana,sans-serif;padding:2px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ws-old-body{background:#FFFFE0;padding:10px 10px 12px;text-align:center}
.ws-marquee{overflow:hidden;white-space:nowrap;color:#C00;font-weight:bold;font-size:11px}
.ws-marquee span{display:inline-block;animation:wsMarq 9s linear infinite}
@keyframes wsMarq{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
.ws-old-h{font-size:19px;color:#800000;font-weight:bold;margin:8px 0 4px}
.ws-old-u{color:#00E;text-decoration:underline;font-size:12px}
.ws-old-p{font-size:12px;margin:10px 0;color:#333}
.ws-old-c{font:11px monospace;color:#060}
.ws-old-s{font-size:9.5px;color:#666;margin-top:6px}
.ws-arrow{font-size:28px;color:var(--ink3)}
.ws-new{min-width:0;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 18px 40px rgba(28,25,23,.12);transform:rotate(1.5deg)}
.ws-new-top{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--ink3)}.ws-new-top span{white-space:nowrap}.ws-new-top b{color:var(--ink)}
.ws-new-h{font-size:19px;font-weight:700;letter-spacing:-.02em;margin:12px 0 10px;line-height:1.15}
.ws-new-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.ws-new-chips span{font-size:11px;background:#F3EEE6;border-radius:99px;padding:4px 9px}
.ws-new-wa{display:inline-block;background:var(--wa);color:#fff;font-size:12px;font-weight:700;border-radius:8px;padding:7px 10px}
.ws-ai{margin-top:12px;border-top:1px dashed var(--line);padding-top:10px;font-size:11.5px}
.ws-ai-q{color:var(--ink3)}.ws-ai-a{margin-top:4px;background:#F0F9FF;border-radius:8px;padding:7px 9px;color:#075985}
.ws-ill{position:absolute;bottom:-26px;right:0;font-size:11px;color:var(--ink3)}
.ws-sec{max-width:1080px;margin:0 auto;padding:clamp(40px,7vw,88px) clamp(16px,4vw,48px)}
.ws-plan{max-width:1080px;margin:0 auto;padding:24px clamp(16px,4vw,48px) 48px;scroll-margin-top:72px}
.ws-plan-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.ws-sub{color:var(--ink2)}
.ws-plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.ws-span2{grid-column:1/-1}
.ws-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
.ws-card p{color:var(--ink2);line-height:1.55;margin:0 0 14px}
.ws-q{font-style:italic}
.ws-facts{margin:0;padding-left:18px;line-height:1.7;color:var(--ink2);font-size:14.5px}
.ws-miss{font-size:13px;color:var(--ink3)!important;margin-top:10px!important}
.ws-pages{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}
.ws-pages li span{display:block;font-size:13px;color:var(--ink3)}
.ws-faqs{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ws-faqs div{background:#FAF7F2;border-radius:10px;padding:12px}
.ws-faqs b{display:block;font-size:14px;margin-bottom:4px}.ws-faqs span{font-size:13.5px;color:var(--ink2);line-height:1.5}
.ws-crawl{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}
.ws-term{background:#1C1917;color:#D6D3D1;border-radius:12px;overflow:hidden}
.ws-term-h{font-size:12px;padding:9px 14px;background:#292524;color:#A8A29E}
.ws-term pre{margin:0;padding:16px;font:13px/1.65 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}
.ws-term-ok .ws-term-h{color:#86EFAC}
.ws-incl{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:22px}
.ws-inc{background:var(--card);padding:20px}.ws-inc b{display:block;margin-bottom:6px}.ws-inc span{color:var(--ink2);font-size:14.5px;line-height:1.5}
.ws-cost{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:18px}
.ws-cost-row{display:flex;justify-content:space-between;gap:16px;padding:13px 18px;border-bottom:1px solid var(--line);font-size:15px}
.ws-cost-row b{white-space:nowrap;font-variant-numeric:tabular-nums}
.ws-cost-total{background:#F0F9FF;border-bottom:none}.ws-cost-total b{color:#075985}
.ws-compare{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
.ws-compare div{border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--card)}
.ws-compare b{display:block;margin-bottom:4px}.ws-compare span{font-size:14px;color:var(--ink2);line-height:1.5}
.ws-compare .ws-us{border-color:var(--brand2);box-shadow:0 0 0 1px var(--brand2) inset}
.ws-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ws-faq{display:flex;flex-direction:column;gap:8px;margin-top:16px}
.ws-faq details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px}
.ws-faq summary{cursor:pointer;font-weight:600}
.ws-faq p{color:var(--ink2);line-height:1.6;margin:10px 0 0}
.ws-foot{display:flex;gap:10px;justify-content:center;padding:28px 16px 40px;color:var(--ink3);font-size:13px;border-top:1px solid var(--line)}
.ws-foot a{text-decoration:none}
@media (max-width:860px){
  .ws-hero{grid-template-columns:1fr}
  .ws-ba{margin-top:8px}
  .ws-plan-grid,.ws-faqs,.ws-crawl,.ws-two,.ws-compare{grid-template-columns:1fr}
  .ws-incl{grid-template-columns:1fr}
}
@media (max-width:520px){
  .ws-row{flex-direction:column}
  .ws-grid{grid-template-columns:1fr}
  .ws-ba{grid-template-columns:1fr;gap:18px}
  .ws-arrow{display:none}
  .ws-old,.ws-new{transform:none}
  .ws-cost-row{flex-direction:column;gap:2px}
}
@media (prefers-reduced-motion:reduce){.ws-marquee span{animation:none}}
`
