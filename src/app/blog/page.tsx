import type { Metadata } from 'next'
import Link from 'next/link'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { SIGNAL_POSTS } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'WyberAi blog: guides on building apps with AI',
  description: 'Guides on building web apps, mobile apps and SaaS with AI: what it costs, how to ship, and how to go from idea to a live product.',
  alternates: { canonical: 'https://wyberai.com/blog' },
}

export default function BlogPage() {
  // Most recently written or updated first. Every post, new and migrated, lives in SIGNAL_POSTS.
  const all = [...SIGNAL_POSTS]
    .sort((a, b) => (b.modified ?? b.iso).localeCompare(a.modified ?? a.iso))
    .map((x) => ({ slug: x.slug, title: x.title, excerpt: x.excerpt, tag: x.tag, date: x.date, readTime: x.readTime }))
  return (
    <SignalFrame>
      <div className="sg-wrap sg-blog">
        <header className="sg-blog-head">
          <span className="sg-mono">Blog</span>
          <h1>Guides and notes from the builder</h1>
          <p>How to get a first build right, what the security scan checks, and what each tool can and cannot replace.</p>
        </header>
        <div className="sg-blog-grid">
          {all.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="sg-blog-card">
              <div className="sg-post-meta">
                <span className="sg-post-tag">{post.tag}</span>
                <span className="sg-mono">{post.date} &middot; {post.readTime}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </SignalFrame>
  )
}
