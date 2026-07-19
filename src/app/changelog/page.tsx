import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Changelog', description: 'Every feature, fix, and improvement — logged as we ship.', alternates: { canonical: 'https://wyberai.com/changelog' } };
const RELEASES = [
  { date:'July 17, 2026', version:'v1.2', tag:'Security-first', color:'#0EA5E9', items:[
    { type:'new', text:'Live RLS Trust Scan on every publish — probes your real database with the public anon key (an attacker\'s exact view); critical data leaks block publishing' },
    { type:'new', text:'Security dashboard — per-project security status, scan history, and publish badges' },
    { type:'new', text:'Interactive mobile preview — React Native apps run live in an embedded Expo Snack, tap and scroll like a real device' },
    { type:'new', text:'Wyberman — in-editor help agent that answers questions about your project and the platform' },
    { type:'new', text:'Plan Mode direction cards — pick a product direction before the first build' },
    { type:'new', text:'WyberAi in Claude — connect via MCP and build projects from Claude Desktop or claude.ai' },
    { type:'new', text:'Community challenge gallery — publish your app to the gallery, community votes weekly' },
    { type:'improved', text:'Hero prompt box — typing an idea builds instantly (web or mobile via visible target toggle); the choice survives signup' },
    { type:'improved', text:'India pricing — INR plans from ₹499/mo with UPI' },
    { type:'improved', text:'ErrorBoundary + crash-guard injection in every generated app, expanded secret-pattern detection, rate limits on publish/deploy/export' },
    { type:'fixed', text:'Instant signup — no confirmation-email wait; magic-link sign-in delivers in seconds' },
  ]},
  { date:'July 10, 2026', version:'v1.1', tag:'Design engine', color:'#7C3AED', items:[
    { type:'new', text:'Wyber UI kit — 31 premium components injected into every build, with 30 curated palettes' },
    { type:'new', text:'Visual edits without AI — click any text or color in preview and change it directly, 0 credits' },
    { type:'new', text:'Themes panel — restyle your whole app in one click, 0 credits' },
    { type:'new', text:'Images panel — upload, generate, and swap images from the editor' },
    { type:'new', text:'Voice input — describe your app out loud, on web and mobile' },
    { type:'improved', text:'Smart model routing — the strongest AI model for builds, faster models for edits, chosen automatically' },
    { type:'improved', text:'Design seeds — every app gets a distinct visual identity, not the same AI-generated look' },
  ]},
  { date:'June 20, 2026', version:'v1.0', tag:'The AI Business Platform', color:'#10b981', items:[
    { type:'new', text:'Auto error fix — build errors detected and resolved automatically, 0 credits charged' },
    { type:'new', text:'Command palette (Cmd+K) — instant access to any page, template, or action' },
    { type:'new', text:'Persona onboarding — solo founder, team, agency, or enterprise' },
    { type:'new', text:'App gallery with ready-to-use web apps across 15+ industries' },
    { type:'new', text:'120 mobile templates — 12 categories from social to kids apps' },
    { type:'new', text:'100 workflow templates — AI-generated with full node configs' },
    { type:'new', text:'Svelte + Astro frameworks — added alongside React, Vue, Next.js' },
    { type:'new', text:'AI Employee browser control — web research, scraping, form filling' },
    { type:'new', text:'AI Employee voice output — TTS via ElevenLabs or OpenAI' },
    { type:'new', text:'AI Employee phone calls — outbound AI calls via Bland.ai' },
    { type:'new', text:'AI Employee Slack notifications — alert your team in real-time' },
    { type:'new', text:'Agent-to-agent delegation — employees delegate tasks by role' },
    { type:'new', text:'Role-specific knowledge bases — upload SOPs per employee' },
    { type:'new', text:'Sub-workflow + parallel nodes — modular, reusable flow components' },
    { type:'new', text:'GTM: Calendly meeting booking step in sequences' },
    { type:'new', text:'GTM: Website visitor de-anonymization via Clearbit' },
    { type:'new', text:'GTM: AI personalization — LinkedIn + company news per lead' },
    { type:'new', text:'GTM: Intent signals, waterfall enrichment, A/B testing, lead scoring' },
    { type:'new', text:'GTM: CRM sync (HubSpot + Salesforce), email warmup (Smartlead)' },
    { type:'new', text:'Mobile: camera, GPS, biometrics, RevenueCat in-app purchases' },
    { type:'new', text:'Confetti celebration on first successful build' },
    { type:'new', text:'Smart prompt suggestions — contextual chips in the editor' },
    { type:'improved', text:'Dodo Payments — fixed checkout + webhook for all 4 plans' },
    { type:'improved', text:'Team collaboration — invite co-founders to web app projects' },
    { type:'improved', text:'Agent persistent memory — remembers context across runs' },
    { type:'improved', text:'Flow run trace logs — per-node observability in the canvas' },
    { type:'improved', text:'All "pillar" references updated to "6 products" across the site' },
    { type:'fixed', text:'RLS audit — fixed AI Employee permission errors, auto-create profiles on signup' },
    { type:'fixed', text:'GTM sequence enrollments table — migration 020 fixed' },
  ]},
  { date:'May 28, 2026', version:'v0.9', tag:'Major release', color:'#0EA5E9', items:[
    { type:'new', text:'MCP server — connect to Claude Desktop, Cursor at wyberai.com/api/mcp' },
    { type:'new', text:'Wyber API + API key management — build on top of WyberAi' },
    { type:'new', text:'35 app connectors — Airtable, Notion, HubSpot, Slack, Anthropic, ElevenLabs, BigQuery, Snowflake and 27 more' },
    { type:'new', text:'Draw on images — upload a screenshot, draw what to change, AI fixes exactly that area' },
    { type:'new', text:'Test / Live environments — promote builds to live without breaking production' },
    { type:'new', text:'Figma import — paste a URL, get a production React component' },
    { type:'new', text:'Project subdomains — one-click publish to projectname.wyberai.app' },
    { type:'new', text:'Image generation (DALL-E 3) — generate assets directly in the IDE' },
    { type:'new', text:'SEO + AI search audit — score, fix recommendations, AI crawler optimization' },
    { type:'new', text:'Voice input — mic button in chat (UI shipped; server-side transcription coming)' },
    { type:'improved', text:'ChatPanel — bubble UI, AI avatar, dot-pulse loading' },
    { type:'improved', text:'PreviewPanel — live indicator, glass overlay, premium empty state' },
    { type:'improved', text:'Design system — consistent tokens, skeleton loading, smooth transitions' },
  ]},
  { date:'May 23, 2026', version:'v0.8', tag:'IDE overhaul', color:'#7C3AED', items:[
    { type:'new', text:'Agent Mode — describe a full feature, Agent builds each step autonomously' },
    { type:'new', text:'Version history — auto-commit on every generation, restore any state' },
    { type:'new', text:'GitHub sync — push to any repo, branch management, commit history' },
    { type:'new', text:'Security scanner — scan for exposed keys, missing auth before deploy' },
    { type:'new', text:'Theme panel — 8 premium themes, dark/light mode per project' },
    { type:'new', text:'33 starter templates — dashboard, auth, landing page, CRM, and more' },
    { type:'improved', text:'Deploy to Vercel — one-click production deployment from the IDE' },
  ]},
  { date:'May 15, 2026', version:'v0.7', tag:'Launch', color:'#059669', items:[
    { type:'new', text:'Public launch — WyberAi is live at wyberai.com' },
    { type:'new', text:'Core AI generation — React, Vue, Next.js, Vanilla JS from plain English' },
    { type:'new', text:'E2B sandbox — live preview of every generation' },
    { type:'new', text:'Free tier — 50 credits/month, no card required' },
    { type:'new', text:'Export as ZIP — download your full project anytime' },
    { type:'new', text:'AI error fixes always free' },
  ]},
];
const TS: Record<string, { bg:string; color:string; label:string }> = {
  new: { bg:'rgba(5,150,105,0.1)', color:'#059669', label:'New' },
  improved: { bg:'rgba(14,165,233,0.1)', color:'#0EA5E9', label:'Improved' },
  fixed: { bg:'rgba(245,158,11,0.1)', color:'#F59E0B', label:'Fixed' },
};
export default function ChangelogPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section">
        <div className="wy-sec-tag">Changelog</div>
        <h1 className="wy-h2">What's new in <em>WyberAi</em></h1>
        <p style={{ fontSize:15, color:'var(--text2)', maxWidth:480, lineHeight:1.75, marginBottom:52 }}>Every feature, improvement, and fix — logged as we ship.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {RELEASES.map(r=>(
            <div key={r.version} className="wy-card" style={{ padding:'28px 32px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                <div style={{ display:'inline-flex', alignItems:'center', padding:'3px 12px', borderRadius:20, background:`${r.color}15`, border:`1px solid ${r.color}30`, fontSize:11, fontWeight:700, color:r.color }}>{r.version} — {r.tag}</div>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{r.date}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {r.items.map((item,i)=>{
                  const s=TS[item.type];
                  return (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:s.bg, color:s.color, fontWeight:700, flexShrink:0, marginTop:2 }}>{s.label}</span>
                      <span style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
