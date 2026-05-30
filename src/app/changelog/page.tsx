import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Changelog — Wyber AI', description: 'Every feature, fix, and improvement — logged as we ship.' };
const RELEASES = [
  { date:'May 28, 2026', version:'v0.9', tag:'Major release', color:'#0EA5E9', items:[
    { type:'new', text:'MCP server — connect to Claude Desktop, Cursor at wyberai.com/api/mcp' },
    { type:'new', text:'Wyber API + API key management — build on top of Wyber AI' },
    { type:'new', text:'35 app connectors — Airtable, Notion, HubSpot, Slack, Anthropic, ElevenLabs, BigQuery, Snowflake and 27 more' },
    { type:'new', text:'Draw on images — upload a screenshot, draw what to change, AI fixes exactly that area' },
    { type:'new', text:'Test / Live environments — promote builds to live without breaking production' },
    { type:'new', text:'Figma import — paste a URL, get a production React component' },
    { type:'new', text:'Project subdomains — one-click publish to projectname.wyberai.app' },
    { type:'new', text:'Image generation (DALL-E 3) — generate assets directly in the IDE' },
    { type:'new', text:'SEO + AI search audit — score, fix recommendations, AI crawler optimization' },
    { type:'new', text:'Voice input — mic button in chat, powered by Whisper' },
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
    { type:'new', text:'Public launch — Wyber AI is live at wyberai.com' },
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
        <h1 className="wy-h2">What's new in <em>Wyber AI</em></h1>
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
