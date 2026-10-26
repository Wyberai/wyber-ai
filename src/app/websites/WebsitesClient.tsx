'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { Footer } from '@/components/shared/FooterClient'
import { track } from '@/lib/track'

// /websites — "Your Instagram page isn't your business. Your website is."
// Rented (a social profile) vs owned (your website). India-first, in the
// brand system (mk-* primitives, --brand-* tokens).
// Free: the plan (/api/websites/plan). Paid: the build, which the dashboard
// only starts once the balance covers websiteLaunchEstimate().min
// (WebsiteCreditGate). Every number on this page comes from that estimate,
// i.e. from credits.ts — no hardcoded pricing.

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

const SHARE_TEXT = 'Your Instagram page isn’t your business — your website is. See the plan for yours, free: https://wyberai.com/websites'

const RENTED_VS_OWNED: [string, string, string][] = [
  ['Who owns it', 'The platform', 'You'],
  ['Who decides who sees you', 'The algorithm', 'Anyone who searches'],
  ['Found on Google and ChatGPT', 'Barely — most of it is behind a login', 'Yes — built to be read'],
  ['If it’s hacked or banned', 'Your customers go with it', 'Your site stays yours'],
  ['Taking orders', 'DMs and “price pls?”', 'Menu, prices, WhatsApp button, enquiry form'],
  ['Your address online', '@yourname on someone else’s app', 'Your own name — and your own domain'],
]

export function WebsitesClient({ currency, estimate }: { currency: 'INR' | 'USD'; estimate: Estimate }) {
  const [tab, setTab] = useState<'social' | 'url'>('social')
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
    <div className="mk-page ws" data-theme="dark">
      <style>{CSS}</style>

      <nav className="ws-nav">
        <Link href="/" aria-label="WyberAi home" style={{ display: 'flex', textDecoration: 'none' }}><WyberLogo markSize={24} wordmarkSize={15} /></Link>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/pricing" className="ws-navlink">Pricing</Link>
          {signedIn
            ? <Link href="/dashboard" className="mk-btn" style={{ padding: '7px 16px', fontSize: 13 }}>Dashboard</Link>
            : <Link href="/login" className="ws-navlink">Sign in</Link>}
          <a href="#start" className="mk-btn ws-hide-sm" style={{ padding: '7px 16px', fontSize: 13 }}>Plan my website</a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <header className="ws-hero" id="start">
        <div className="mk-stars" />
        <div className="ws-hero-in">
          <div className="ws-hero-copy">
            <div className="mk-eyebrow">For shops · clinics · studios · tutors · home businesses</div>
            <h1 className="mk-display ws-h1">Your Instagram page isn’t your business. <span className="mk-serif">Your website is.</span></h1>
            <p className="mk-lead">
              Followers belong to the app. Reach belongs to the algorithm. One hack or one report and it’s gone.
              Own a website on your name — found on Google and ChatGPT, taking orders on WhatsApp.
            </p>
            <p className="ws-hindi" lang="hi">Instagram किराए का घर है। वेबसाइट अपना है।</p>

            <form onSubmit={submit} className="mk-frame ws-tool">
              <div className="ws-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={tab === 'social'} className={tab === 'social' ? 'on' : ''} onClick={() => setTab('social')}>Start from my Instagram</button>
                <button type="button" role="tab" aria-selected={tab === 'url'} className={tab === 'url' ? 'on' : ''} onClick={() => setTab('url')}>I have a website</button>
              </div>
              {tab === 'social' ? (
                <div className="ws-grid">
                  <input className="ws-input" placeholder="Business name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required aria-label="Business name" />
                  <input className="ws-input" placeholder="City / area" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} aria-label="City" />
                  <textarea className="ws-input ws-span" rows={3} placeholder="Paste your Instagram bio and a few captions — or just say what you sell, your timings and prices" value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} required aria-label="Your Instagram bio or a description of your business" />
                  <input className="ws-input" inputMode="tel" placeholder="WhatsApp number (optional)" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} aria-label="WhatsApp number" />
                  <button className="mk-btn ws-submit" disabled={loading}>{loading ? 'Planning…' : 'Plan my website'}</button>
                </div>
              ) : (
                <div className="ws-row">
                  <input className="ws-input" inputMode="url" placeholder="yourbusiness.com" value={url} onChange={e => setUrl(e.target.value)} required aria-label="Your current website" />
                  <button className="mk-btn ws-submit" disabled={loading}>{loading ? 'Reading your site…' : 'Plan my new site'}</button>
                </div>
              )}
              {error && <div className="ws-error">{error}</div>}
              <div className="mk-mono ws-fine">THE PLAN IS FREE · NO SIGN-UP · WE USE ONLY YOUR OWN DETAILS</div>
            </form>
          </div>

          {/* Rented → owned. Illustration, not a real business. */}
          <div className="ws-visual" aria-hidden="true">
            <div className="ws-phone">
              <div className="ws-phone-notch" />
              <div className="ws-prof">
                <div className="ws-avatar">SS</div>
                <div className="ws-stats"><b>312</b><span>posts</span><b>1,204</b><span>followers</span></div>
              </div>
              <div className="ws-prof-name">sharma.sweets</div>
              <div className="ws-prof-bio">Fresh mithai daily 🍬 Jayanagar<br />DM to order · Link in bio 👇</div>
              <div className="ws-tiles">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
              <div className="mk-mono ws-tag ws-tag-rent">RENTED · REACH SET BY THE ALGORITHM</div>
            </div>
            <div className="ws-arrow">→</div>
            <div className="mk-frame ws-site">
              <div className="ws-chrome"><i /><i /><i /><span className="mk-mono">sharmasweets.in</span></div>
              <div className="ws-site-nav"><b>Sharma Sweets</b><span>Menu · Order · Visit</span></div>
              <div className="ws-site-h">Fresh mithai, made daily in Jayanagar.</div>
              <div className="ws-chips"><span>Open 8am–10pm</span><span>Kaju katli · ₹1,200/kg</span></div>
              <div className="ws-wa">● Order on WhatsApp</div>
              <div className="ws-found">
                <div><span className="mk-mono">GOOGLE</span>Sharma Sweets — Jayanagar · Open till 10pm</div>
                <div><span className="mk-mono">CHATGPT</span>“Try Sharma Sweets in 4th Block — open till 10pm.”</div>
              </div>
              <div className="mk-mono ws-tag ws-tag-own">OWNED · FOUND BY ANYONE WHO SEARCHES</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── PLAN RESULT ─────────────────────────────────────── */}
      {p && (
        <section className="ws-plan" id="plan">
          <div className="ws-plan-head">
            <div>
              <div className="mk-eyebrow">Your free plan</div>
              <h2 className="mk-h2 ws-h2">{p.businessName}</h2>
              <div className="ws-sub">{[p.category, p.city].filter(Boolean).join(' · ')}</div>
            </div>
            <button className="mk-btn" onClick={build}>Build my website →</button>
          </div>
          <div className="ws-plan-grid">
            <div className="ws-card">
              <div className="mk-mono ws-card-h">WHAT WE FOUND</div>
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
              <div className="mk-mono ws-card-h">YOUR PAGES</div>
              <ol className="ws-pages">
                {p.pages.map(pg => <li key={pg.name}><b>{pg.name}</b><span>{pg.sections.join(' · ')}</span></li>)}
              </ol>
            </div>
            {p.faqs.length > 0 && (
              <div className="ws-card ws-span2">
                <div className="mk-mono ws-card-h">QUESTIONS AI ASSISTANTS WILL BE ABLE TO ANSWER ABOUT YOU</div>
                <div className="ws-faqs">
                  {p.faqs.map(f => <div key={f.q}><b>{f.q}</b><span>{f.a}</span></div>)}
                </div>
              </div>
            )}
          </div>
          <CostTable estimate={estimate} currency={currency} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="mk-btn" style={{ padding: '15px 32px', fontSize: 16 }} onClick={build}>Build {p.businessName}’s website →</button>
          </div>
        </section>
      )}

      {/* ── RENTED VS OWNED ─────────────────────────────────── */}
      <section className="mk-section">
        <div className="mk-eyebrow">01 · Rented vs owned</div>
        <h2 className="mk-h2 ws-h2">A profile is a rented shop. <span className="mk-serif">A website is yours.</span></h2>
        <div className="ws-rvo" role="table">
          <div className="ws-rvo-row ws-rvo-head" role="row">
            <span role="columnheader" />
            <span role="columnheader" className="mk-mono">SOCIAL PROFILE</span>
            <span role="columnheader" className="mk-mono ws-own">YOUR WEBSITE</span>
          </div>
          {RENTED_VS_OWNED.map(([k, rent, own]) => (
            <div key={k} className="ws-rvo-row" role="row">
              <b role="rowheader">{k}</b>
              <span role="cell" className="ws-rent">{rent}</span>
              <span role="cell" className="ws-own">{own}</span>
            </div>
          ))}
        </div>
        <p className="mk-mono ws-note">YOUR OWN DOMAIN CONNECTS ON THE BUILDER PLAN · UNTIL THEN YOUR SITE IS LIVE AT WYBERAI.COM/APP/YOURNAME</p>
      </section>

      {/* ── KEEP INSTAGRAM. POINT IT HOME. ──────────────────── */}
      <section className="mk-section ws-tight">
        <div className="mk-eyebrow">02 · How it works</div>
        <h2 className="mk-h2 ws-h2">Keep your Instagram. <span className="mk-serif">Point it home.</span></h2>
        <div className="ws-steps">
          {[
            ['01', 'Paste your bio — or your old site', 'We pull out what you sell, your timings, prices and contact. Free, no sign-up. Nothing invented.'],
            ['02', 'We build a site you own', 'Multi-page, mobile-first, with your menu or services, WhatsApp ordering, a map and an enquiry form.'],
            ['03', 'Put it in your bio', 'Your link, a share card and a QR code for the counter. Every post now sends people somewhere you own.'],
          ].map(([n, t, d]) => (
            <div key={n} className="ws-step"><span className="mk-mono">{n}</span><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
      </section>

      {/* ── WHAT AI SEES ────────────────────────────────────── */}
      <section className="mk-section ws-tight">
        <div className="mk-eyebrow">03 · Found by AI</div>
        <h2 className="mk-h2 ws-h2">ChatGPT can’t recommend a business <span className="mk-serif">it can’t read.</span></h2>
        <p className="mk-lead ws-lead-narrow">
          Social profiles sit behind a login, and many websites only show their content after JavaScript runs — which AI crawlers usually don’t do.
          Every WyberAi website is published with a readable copy of each page, written for them.
        </p>
        <div className="ws-crawl">
          <div className="mk-frame ws-term">
            <div className="ws-chrome"><i /><i /><i /><span className="mk-mono">what an AI crawler reads · social profile</span></div>
            <pre>{`Log in to see photos and videos
from sharma.sweets

— nothing about your timings,
  prices or how to order —`}</pre>
          </div>
          <div className="mk-frame ws-term ws-term-ok">
            <div className="ws-chrome"><i /><i /><i /><span className="mk-mono">what it reads · your WyberAi site</span></div>
            <pre>{`# Sharma Sweets — Jayanagar, Bengaluru
Open 8am–10pm · WhatsApp +91 …
Kaju katli ₹1,200/kg · Rasmalai …
Q: Do you deliver? A: Yes, within 5 km

+ business & FAQ data · llms.txt`}</pre>
          </div>
        </div>
      </section>

      {/* ── INCLUDED ────────────────────────────────────────── */}
      <section className="mk-section ws-tight">
        <div className="mk-eyebrow">04 · Every site includes</div>
        <h2 className="mk-h2 ws-h2">Built to be found. <span className="mk-serif">Built to get orders.</span></h2>
        <div className="ws-incl">
          {[
            ['Readable by AI assistants', 'A crawler-ready copy of every page, plus an llms.txt summary.'],
            ['Details search engines trust', 'Business and FAQ structured data, proper titles and descriptions.'],
            ['Answers to real questions', 'An FAQ from your details — the questions people ask ChatGPT.'],
            ['WhatsApp, map, enquiry form', 'Customers message, find you and enquire in one tap.'],
            ['Multiple pages, mobile-first', 'Home, menu or services, gallery, about, contact — fast on any phone.'],
            ['Share card and QR code', 'A proper preview when your link is shared, and a QR for your counter.'],
          ].map(([t, d]) => <div key={t} className="mk-card ws-inc"><b>{t}</b><span>{d}</span></div>)}
        </div>
      </section>

      {/* ── COST ────────────────────────────────────────────── */}
      <section className="mk-section ws-tight" id="cost">
        <div className="mk-eyebrow">05 · What it costs</div>
        <h2 className="mk-h2 ws-h2">Pay for what your site uses. <span className="mk-serif">Own it forever.</span></h2>
        <p className="mk-lead ws-lead-narrow">A complete website is built from the same steps everyone pays for on WyberAi. Bigger sites use more credits, and you see each step’s cost before it runs.</p>
        <CostTable estimate={estimate} currency={currency} />
        <div className="ws-compare">
          <div className="ws-cmp"><b>Freelancer</b><span>{currency === 'INR' ? '₹15,000–80,000' : '$300–1,500'} · 2–4 weeks · every change costs extra</span></div>
          <div className="ws-cmp"><b>Social profile only</b><span>Free to start · but rented, algorithm-dependent and mostly invisible to search</span></div>
          <div className="ws-cmp ws-cmp-us"><b>WyberAi</b><span>About {money(estimate.min, currency)}–{money(estimate.max, currency)} in credits · readable by Google and AI · you own the code</span></div>
        </div>
      </section>

      {/* ── DONE FOR YOU + SHARE ───────────────────────────── */}
      <section className="mk-section ws-tight ws-two">
        <div className="mk-card ws-cta">
          <div className="mk-eyebrow">Rather we do it?</div>
          <b>We’ll build and launch it for you.</b>
          <p>A free 15-minute call — we scope it and give you a firm quote.</p>
          <Link className="mk-btn-ghost" href={currency === 'INR' ? '/india-consult' : '/setup-call'}>Book a free call</Link>
        </div>
        <div className="mk-card ws-cta">
          <div className="mk-eyebrow">Know a business that lives on Instagram?</div>
          <b>Send them this page.</b>
          <p>They can see the plan for their own website — free, in a minute.</p>
          <a className="mk-btn ws-wa-btn" href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer" onClick={() => track('websites_shared', { channel: 'whatsapp' })}>Share on WhatsApp</a>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="mk-section ws-tight">
        <div className="mk-eyebrow">Questions</div>
        <div className="ws-faq">
          {[
            ['I already have Instagram. Why do I need a website?', 'Keep Instagram — it’s great for being discovered. But you don’t own it: the algorithm decides who sees you, most of it is hidden from Google and AI assistants, and a hack or ban can take it away. A website is the one place online that’s yours, and your Instagram should point to it.'],
            ['Is the plan really free?', 'Yes. Planning your site costs nothing and needs no sign-up. You only use credits when you build.'],
            ['How much will my website cost?', `A complete site — build, ${estimate.steps.find(s => s.key === 'photos')?.label.toLowerCase()}, an SEO + AI-search pass and a few edits — uses about ${estimate.min}–${estimate.max} credits (${money(estimate.min, currency)}–${money(estimate.max, currency)}). Larger sites use more. You need ${estimate.min} credits before the build starts.`],
            ['Will I show up on Google and ChatGPT?', 'We make your site readable and well-described for search engines and AI assistants — the part most small-business sites get wrong. Nobody can promise a ranking, and anyone who does is guessing.'],
            ['Can I use my own domain?', 'Yes — connect a domain you own on the Builder plan or above. Until then your site is live on a free wyberai.com link.'],
            ['Can it be in Hindi or my language?', 'Yes. Ask for Hindi, Kannada, Telugu, Tamil or any language — in the plan or later as an edit.'],
          ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <Footer />
    </div>
  )
}

function CostTable({ estimate, currency }: { estimate: Estimate; currency: 'INR' | 'USD' }) {
  return (
    <div className="mk-frame ws-cost">
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
.ws-nav{position:sticky;top:0;z-index:100;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,48px);background:rgba(5,6,10,.85);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid rgba(255,255,255,.06)}
.ws-navlink{padding:7px 12px;border-radius:8px;font-size:13px;color:var(--brand-text-dim);text-decoration:none;font-weight:500}
.ws-navlink:hover{color:var(--brand-text)}
.ws-hero{position:relative;overflow:hidden;border-bottom:1px solid var(--brand-border)}
.ws-hero::before{content:"";position:absolute;inset:-20% -10% auto auto;width:70%;height:90%;background:radial-gradient(ellipse at 70% 20%,var(--brand-glow-soft),transparent 60%);pointer-events:none}
.ws-hero-in{position:relative;max-width:1240px;margin:0 auto;padding:clamp(48px,7vw,104px) clamp(20px,5vw,48px);display:grid;grid-template-columns:1.08fr .92fr;gap:clamp(28px,4vw,64px);align-items:center}
.ws-hero-copy{display:flex;flex-direction:column;gap:20px;min-width:0}
.ws-h1{font-size:clamp(40px,5.4vw,76px)}
.ws-h2{margin:14px 0 18px}
.ws-hindi{margin:-6px 0 4px;color:var(--brand-text-faint);font-size:16px}
.ws-tool{padding:12px;display:flex;flex-direction:column;gap:10px}
.ws-tabs{display:flex;gap:4px;padding:4px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--brand-border)}
.ws-tabs button{flex:1;border:none;background:none;padding:9px 10px;border-radius:9px;font:600 13.5px var(--font-display);color:var(--brand-text-dim);cursor:pointer}
.ws-tabs button.on{background:var(--brand-bg-overlay);color:var(--brand-text);box-shadow:inset 0 0 0 1px var(--brand-border-strong)}
.ws-row{display:flex;gap:8px}
.ws-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ws-span{grid-column:1/-1}
.ws-input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.03);border:1px solid var(--brand-border-strong);border-radius:12px;padding:12px 14px;font:16px var(--font-display);color:var(--brand-text);outline:none;resize:vertical}
.ws-input::placeholder{color:var(--brand-text-faint)}
.ws-input:focus{border-color:var(--brand-border-accent);box-shadow:0 0 0 3px var(--brand-glow-soft)}
.ws-submit{justify-content:center}
.ws-submit:disabled{opacity:.6;cursor:wait;transform:none}
.ws-error{color:#f87171;font-size:13.5px}
.ws-fine{font-size:10px;padding:0 4px}
.ws-visual{position:relative;display:grid;grid-template-columns:minmax(0,.8fr) 28px minmax(0,1.2fr);align-items:center;gap:10px;min-width:0}
.ws-phone{position:relative;background:#0b0d16;border:1px solid var(--brand-border-strong);border-radius:28px;padding:22px 12px 14px;transform:rotate(-3deg);box-shadow:0 20px 50px rgba(0,0,0,.5);filter:saturate(.75)}
.ws-phone-notch{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:44px;height:6px;border-radius:9px;background:#1b1f2c}
.ws-prof{display:flex;align-items:center;gap:12px}
.ws-avatar{width:44px;height:44px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;background:conic-gradient(#f59e0b,#ec4899,#8b5cf6,#f59e0b);box-shadow:inset 0 0 0 3px #0b0d16}
.ws-stats{display:grid;grid-template-columns:auto auto;gap:0 8px;font-size:11px;color:var(--brand-text-dim);align-items:baseline}
.ws-stats b{color:var(--brand-text);font-size:12px}
.ws-prof-name{margin-top:10px;font-size:12px;font-weight:700;color:var(--brand-text)}
.ws-prof-bio{font-size:11px;line-height:1.5;color:var(--brand-text-dim);margin-top:2px}
.ws-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:10px}
.ws-tiles i{aspect-ratio:1;border-radius:3px;background:linear-gradient(135deg,#1c2133,#141826)}
.ws-tiles i:nth-child(3n+1){background:linear-gradient(135deg,#3b2a1a,#1e1712)}
.ws-tiles i:nth-child(4n){background:linear-gradient(135deg,#2a1830,#161220)}
.ws-tag{position:absolute;left:50%;transform:translateX(-50%);bottom:-30px;white-space:nowrap;font-size:9px;padding:4px 8px;border-radius:99px}
.ws-tag-rent{background:rgba(255,255,255,.04);border:1px solid var(--brand-border-strong);color:var(--brand-text-faint)}
.ws-tag-own{background:rgba(14,165,233,.1);border:1px solid var(--brand-border-accent);color:var(--brand-accent-hot)}
.ws-arrow{color:var(--brand-accent);font-size:24px;text-align:center}
.ws-site{position:relative;padding:12px 14px 16px;transform:rotate(1.5deg);box-shadow:0 24px 64px rgba(0,0,0,.55),0 0 0 1px var(--brand-border-accent),0 0 60px var(--brand-glow-soft)}
.ws-chrome{display:flex;align-items:center;gap:6px;margin-bottom:12px;min-width:0}
.ws-chrome i{width:9px;height:9px;border-radius:50%;background:#ff5f57;flex-shrink:0}.ws-chrome i:nth-child(2){background:#ffbd2e}.ws-chrome i:nth-child(3){background:#28c840}
.ws-chrome span{margin-left:8px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ws-site-nav{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--brand-text-faint)}.ws-site-nav b{color:var(--brand-text)}.ws-site-nav span{white-space:nowrap}
.ws-site-h{font-size:clamp(17px,1.6vw,21px);font-weight:700;letter-spacing:-.03em;line-height:1.15;margin:12px 0 10px;color:var(--brand-text)}
.ws-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.ws-chips span{font-size:10.5px;color:var(--brand-text-dim);border:1px solid var(--brand-border-strong);border-radius:99px;padding:3px 9px}
.ws-wa{display:inline-block;background:#25D366;color:#052e16;font-size:11.5px;font-weight:700;border-radius:99px;padding:6px 12px}
.ws-found{margin-top:12px;display:flex;flex-direction:column;gap:6px}
.ws-found div{font-size:11px;color:var(--brand-text-dim);background:rgba(255,255,255,.03);border:1px solid var(--brand-border);border-radius:8px;padding:7px 9px;line-height:1.4}
.ws-found .mk-mono{display:block;font-size:9px;color:var(--brand-accent);margin-bottom:2px}
.ws-plan{max-width:1120px;margin:0 auto;padding:clamp(40px,6vw,72px) clamp(20px,5vw,48px);scroll-margin-top:72px;border-bottom:1px solid var(--brand-border)}
.ws-plan-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:20px}
.ws-sub{color:var(--brand-text-dim)}
.ws-plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.ws-span2{grid-column:1/-1}
.ws-card{background:var(--brand-bg-raised);border:1px solid var(--brand-border);border-radius:18px;padding:20px}
.ws-card-h{font-size:10px;margin-bottom:12px;color:var(--brand-accent)}
.ws-q{color:var(--brand-text);font-style:italic;margin:0 0 12px}
.ws-facts{margin:0;padding-left:18px;line-height:1.8;color:var(--brand-text-dim);font-size:14.5px}.ws-facts b{color:var(--brand-text)}
.ws-miss{font-size:13px;color:var(--brand-text-faint);margin:12px 0 0;line-height:1.5}
.ws-pages{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:10px;color:var(--brand-text)}
.ws-pages span{display:block;font-size:13px;color:var(--brand-text-faint);margin-top:2px}
.ws-faqs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ws-faqs div{background:rgba(255,255,255,.02);border:1px solid var(--brand-border);border-radius:12px;padding:12px 14px}
.ws-faqs b{display:block;font-size:14px;margin-bottom:4px;color:var(--brand-text)}.ws-faqs span{font-size:13.5px;color:var(--brand-text-dim);line-height:1.55}
.ws-tight{padding-top:clamp(48px,7vw,96px);padding-bottom:clamp(48px,7vw,96px)}
.ws-lead-narrow{max-width:680px}
.ws-rvo{margin-top:28px;border:1px solid var(--brand-border);border-radius:18px;overflow:hidden;background:var(--brand-bg-raised)}
.ws-rvo-row{display:grid;grid-template-columns:1.1fr 1fr 1.25fr;gap:16px;padding:16px 22px;border-top:1px solid var(--brand-border);align-items:baseline}
.ws-rvo-head{border-top:none;padding-top:14px;padding-bottom:14px;background:rgba(255,255,255,.015)}
.ws-rvo-head .mk-mono{font-size:10px}
.ws-rvo-row b{font-size:15px;color:var(--brand-text);font-weight:600}
.ws-rent{color:var(--brand-text-dim);font-size:14.5px;text-decoration:line-through;text-decoration-color:rgba(248,113,113,.45);text-decoration-thickness:1px}
.ws-own{color:var(--brand-accent-hot)!important;font-size:14.5px;font-weight:500}
.ws-note{margin-top:14px;font-size:9.5px}
.ws-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:28px;background:var(--brand-border);border:1px solid var(--brand-border);border-radius:18px;overflow:hidden}
.ws-step{background:var(--brand-bg-raised);padding:24px}
.ws-step .mk-mono{color:var(--brand-accent);font-size:11px}
.ws-step b{display:block;font-size:18px;letter-spacing:-.02em;margin:12px 0 8px;color:var(--brand-text)}
.ws-step p{margin:0;color:var(--brand-text-dim);line-height:1.6;font-size:14.5px}
.ws-crawl{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:28px}
.ws-term{padding:14px 16px}
.ws-term pre{margin:0;font:12.5px/1.7 var(--brand-mono);color:var(--brand-text-dim);white-space:pre-wrap}
.ws-term-ok{border-color:var(--brand-border-accent)}
.ws-term-ok pre{color:var(--brand-text)}
.ws-incl{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}
.ws-inc{padding:22px}.ws-inc b{display:block;margin-bottom:8px;color:var(--brand-text);font-size:16px}.ws-inc span{color:var(--brand-text-dim);font-size:14.5px;line-height:1.6}
.ws-cost{margin-top:24px;padding:0;overflow:hidden}
.ws-cost-row{display:flex;justify-content:space-between;gap:16px;padding:14px 20px;border-bottom:1px solid var(--brand-border);font-size:15px;color:var(--brand-text-dim)}
.ws-cost-row b{white-space:nowrap;color:var(--brand-text);font-weight:600;font-variant-numeric:tabular-nums}
.ws-cost-total{border-bottom:none;background:rgba(14,165,233,.07)}.ws-cost-total span{color:var(--brand-text)}.ws-cost-total b{color:var(--brand-accent-hot)}
.ws-compare{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
.ws-cmp{border:1px solid var(--brand-border);border-radius:14px;padding:16px;background:var(--brand-bg-raised)}
.ws-cmp b{display:block;margin-bottom:6px;color:var(--brand-text)}.ws-cmp span{font-size:14px;color:var(--brand-text-dim);line-height:1.55}
.ws-cmp-us{border-color:var(--brand-border-accent);box-shadow:0 0 40px var(--brand-glow-soft)}
.ws-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ws-cta{padding:26px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.ws-cta b{font-size:22px;letter-spacing:-.025em;color:var(--brand-text)}
.ws-cta p{margin:0 0 6px;color:var(--brand-text-dim);line-height:1.6}
.ws-wa-btn{background:#25D366;color:#052e16;box-shadow:0 4px 16px rgba(37,211,102,.2)}.ws-wa-btn:hover{background:#2fe174}
.ws-faq{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.ws-faq details{background:var(--brand-bg-raised);border:1px solid var(--brand-border);border-radius:14px;padding:16px 20px}
.ws-faq details[open]{border-color:var(--brand-border-strong)}
.ws-faq summary{cursor:pointer;font-weight:600;color:var(--brand-text);font-size:16px}
.ws-faq p{color:var(--brand-text-dim);line-height:1.7;margin:12px 0 0}
@media (max-width:900px){
  .ws-hero-in{grid-template-columns:1fr}
  .ws-visual{margin:12px 0 30px}
  .ws-plan-grid,.ws-faqs,.ws-crawl,.ws-two,.ws-compare,.ws-steps,.ws-incl{grid-template-columns:1fr}
  .ws-rvo-row{grid-template-columns:1fr 1fr;gap:4px 16px}
  .ws-rvo-row b{grid-column:1/-1}
  .ws-rvo-head span:first-child{display:none}
}
@media (max-width:560px){
  .ws-hide-sm{display:none}
  .ws-row{flex-direction:column}
  .ws-grid{grid-template-columns:1fr}
  .ws-visual{grid-template-columns:1fr;gap:44px}
  .ws-arrow{display:none}
  .ws-phone,.ws-site{transform:none}
  .ws-cost-row{flex-direction:column;gap:2px}
}
`
