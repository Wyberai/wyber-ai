import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Ã¢â‚¬â€ Wyber AI',
  description: 'Tips, guides, and updates from the Wyber AI team.',
};

const POSTS = [
  { slug: 'build-saas-without-code', title: 'How to build a SaaS app without writing code in 2026', excerpt: 'AI app builders have changed what\'s possible for solo founders. Here\'s how to go from idea to live product in a single afternoon.', date: 'May 28, 2026', readTime: '6 min read', tag: 'Guide', tagColor: '#0EA5E9' },
  { slug: 'wyber-vs-lovable', title: 'Wyber AI vs Lovable: Which AI app builder is right for you?', excerpt: 'Both tools let you build full-stack apps from plain English. But they make different tradeoffs. An honest comparison.', date: 'May 27, 2026', readTime: '8 min read', tag: 'Comparison', tagColor: '#7C3AED' },
  { slug: 'nextjs-app-in-one-hour', title: 'Build a production Next.js app in under an hour with AI', excerpt: 'Next.js is the default framework in Wyber AI Ã¢â‚¬â€ SSR, SEO, and performance out of the box. A step-by-step walkthrough.', date: 'May 26, 2026', readTime: '5 min read', tag: 'Tutorial', tagColor: '#059669' },
];

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div className="wy-section">
        <div className="wy-sec-tag">Blog</div>
        <h1 className="wy-h2">Ideas, guides, <em>updates</em></h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 480, lineHeight: 1.7, marginBottom: 48 }}>
          Tips on building faster with AI, product updates, and founder stories.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div className="wy-card" style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${post.tagColor}15`, color: post.tagColor, fontWeight: 700, border: `1px solid ${post.tagColor}30` }}>{post.tag}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{post.date} Ã‚Â· {post.readTime}</span>
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.3 }}>{post.title}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>{post.excerpt}</p>
                </div>
                <div style={{ fontSize: 18, color: 'var(--text3)', flexShrink: 0 }}>Ã¢â€ â€™</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}