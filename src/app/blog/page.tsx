import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — Wyber AI',
  description: 'Insights on AI app building, vibe coding, and shipping faster as a solo founder or small team.',
}

const POSTS = [
  {
    slug: 'built-lovable-competitor-6-weeks',
    title: 'I built a Lovable competitor in 6 weeks as a solo founder — here\'s everything I did differently',
    excerpt: 'How I shipped an AI app builder from zero to live in 6 weeks, and the decisions that made it possible.',
    date: 'May 31, 2026',
    readTime: '5 min read',
    tag: 'Build in public',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'why-we-charge-less-than-lovable',
    title: 'Why Wyber AI charges $18.99 instead of $25 — the math behind our pricing',
    excerpt: 'Our prebuilt app library serves 60%+ of prompts at zero API cost. That changes the math entirely.',
    date: 'May 30, 2026',
    readTime: '4 min read',
    tag: 'Product',
    tagColor: '#8b5cf6',
  },
  {
    slug: 'build-saas-mvp-with-ai-2026',
    title: 'How to build a SaaS MVP with AI in 2026 — no coding required',
    excerpt: 'A step-by-step guide to going from idea to live product in under an hour using AI app builders.',
    date: 'May 29, 2026',
    readTime: '7 min read',
    tag: 'Guide',
    tagColor: '#10b981',
  },
]

function WyberLogo({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0EA5E9"/><path d="M20 7L11 16L20 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 11L28 16L23 21" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
}

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo size={24}/><span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14 }}>Wyber AI</span></Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
      </nav>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Blog</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em' }}>Thoughts on building with AI</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: post.tagColor + '15', border: `1px solid ${post.tagColor}30`, fontSize: 11, fontWeight: 700, color: post.tagColor }}>{post.tag}</span>
                  <span style={{ fontSize: 12, color: '#52525b' }}>{post.date} · {post.readTime}</span>
                </div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(16px,2vw,20px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.3 }}>{post.title}</h2>
                <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.65 }}>{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap'); .blog-post:hover { padding-left: 8px !important; transition: padding 0.15s; } .blog-post { transition: padding 0.15s; }`}</style>
    </div>
  )
}
