import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'Blog — Wyber AI',
  description: 'Build logs, product guides, and deep dives on AI app building — web apps, mobile apps, AI agents, and workflow automation.',
}

const POSTS = [
  {
    slug: 'build-mobile-app-with-ai-2026',
    title: 'How to build a mobile app with AI in 2026 — iOS and Android, no coding',
    excerpt: 'React Native + Expo from a plain-English prompt. Preview on your phone in under 60 seconds. Here\'s exactly how it works.',
    date: 'June 14, 2026',
    readTime: '6 min read',
    tag: 'Mobile',
    tagColor: '#8b5cf6',
    isNew: true,
  },
  {
    slug: 'what-are-ai-agents-guide',
    title: 'What are AI agents? A practical guide for non-technical founders',
    excerpt: 'Agents watch data, make decisions, and take action — automatically. Here\'s what they actually are, what they\'re good for, and how to build one in minutes.',
    date: 'June 13, 2026',
    readTime: '7 min read',
    tag: 'AI Agents',
    tagColor: '#10b981',
    isNew: true,
  },
  {
    slug: 'ai-workflow-automation-guide',
    title: 'AI workflow automation without code — connect your apps and let them run',
    excerpt: 'Zapier and Make require manual setup. Wyber\'s workflow builder takes a plain-English description and generates the entire automation — AI reasoning included.',
    date: 'June 12, 2026',
    readTime: '5 min read',
    tag: 'Workflows',
    tagColor: '#f59e0b',
    isNew: true,
  },
  {
    slug: 'build-saas-mvp-with-ai-2026',
    title: 'How to build a SaaS MVP with AI in 2026 — no coding required',
    excerpt: 'A step-by-step guide to going from idea to live product in under an hour using AI app builders.',
    date: 'May 29, 2026',
    readTime: '7 min read',
    tag: 'Guide',
    tagColor: '#0EA5E9',
  },
  {
    slug: 'built-lovable-competitor-6-weeks',
    title: 'I built a Lovable competitor in 6 weeks as a solo founder — here\'s what I did differently',
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
]

const s = {
  bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)',
  text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9',
}

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={24} wordmarkSize={14} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/learn" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Learn</Link>
          <Link href="/docs" style={{ fontSize: 13, color: s.muted, textDecoration: 'none' }}>Docs</Link>
          <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <header style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: s.sky, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Blog</div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 14px' }}>
            Build logs, guides, and product news
          </h1>
          <p style={{ fontSize: 15, color: s.muted, lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
            Web apps, mobile apps, AI agents, and workflow automation — from the team building Wyber AI.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {POSTS.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article className="blog-post" style={{ padding: '28px 0', borderBottom: `1px solid ${s.border}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: post.tagColor + '15', border: `1px solid ${post.tagColor}30`, fontSize: 11, fontWeight: 700, color: post.tagColor }}>
                    {post.tag}
                  </span>
                  {post.isNew && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', fontSize: 10, fontWeight: 700, color: s.sky, letterSpacing: '0.05em' }}>
                      NEW
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: s.dim }}>{post.date} · {post.readTime}</span>
                </div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(16px,2vw,20px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.3, color: s.text }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 14, color: s.muted, lineHeight: 1.65, margin: 0 }}>
                  {post.excerpt}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap'); .blog-post { transition: padding-left 0.15s; } .blog-post:hover { padding-left: 6px !important; }`}</style>
    </div>
  )
}
