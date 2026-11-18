import type { Metadata } from 'next'
import Link from 'next/link'
import { SignalFrame } from '@/components/signal/SignalFrame'
import { SIGNAL_POSTS } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'WyberAi blog: guides on building apps with AI',
  description: 'Guides on building web apps, mobile apps and SaaS with AI: what it costs, how to ship, and how to go from idea to a live product.',
  alternates: { canonical: 'https://wyberai.com/blog' },
}

const POSTS = [
  {
    slug: 'ai-app-builder-for-startups',
    title: 'Why startups are ditching dev agencies for AI app builders',
    excerpt: 'Dev agencies charge $15k–$50k and take months. AI app builders ship an MVP in an afternoon for under $30. Here\'s what changed.',
    date: 'June 29, 2026',
    readTime: '6 min read',
    tag: 'Startups',
  },
  {
    slug: 'no-code-vs-ai-code-generation',
    title: 'No-code vs AI code generation — which one should you use in 2026?',
    excerpt: 'Bubble and Glide give you drag-and-drop. WyberAi and Lovable generate real code. The trade-offs are shifting fast.',
    date: 'June 28, 2026',
    readTime: '7 min read',
    tag: 'Guide',
  },
  {
    slug: 'how-to-deploy-ai-generated-app',
    title: 'How to deploy an AI-generated app to production',
    excerpt: 'Your app works in preview. Now what? Custom domains, databases, environment variables, and going live — the complete checklist.',
    date: 'June 27, 2026',
    readTime: '5 min read',
    tag: 'Guide',
  },
  {
    slug: 'build-internal-tools-with-ai',
    title: 'Build internal tools in minutes — not months',
    excerpt: 'Admin panels, dashboards, approval workflows. Your team needs them yesterday. Here\'s how to ship them with a single prompt.',
    date: 'June 25, 2026',
    readTime: '5 min read',
    tag: 'Use Case',
  },
  {
    slug: 'build-saas-mvp-with-ai-2026',
    title: 'How to build a SaaS MVP with AI in 2026 — no coding required',
    excerpt: 'A step-by-step guide to going from idea to live product in under an hour using AI app builders.',
    date: 'May 29, 2026',
    readTime: '7 min read',
    tag: 'Guide',
  },
  {
    slug: 'build-saas-without-code',
    title: 'How to build a SaaS app without writing code in 2026',
    excerpt: 'AI app builders have changed what is possible for solo founders. Go from idea to live product in a single afternoon.',
    date: 'May 20, 2026',
    readTime: '6 min read',
    tag: 'Guide',
  },
  {
    slug: 'nextjs-app-in-one-hour',
    title: 'Build a production Next.js app in under an hour with AI',
    excerpt: 'Next.js is the default framework in WyberAi. SSR, SEO, and performance out of the box. A step-by-step walkthrough.',
    date: 'May 15, 2026',
    readTime: '5 min read',
    tag: 'Guide',
  },
]

export default function BlogPage() {
  // Newest first. Posts written for the Signal layout lead; the older posts follow with their own dates.
  const all = [
    ...SIGNAL_POSTS.map((x) => ({ slug: x.slug, title: x.title, excerpt: x.excerpt, tag: x.tag, date: x.date, readTime: x.readTime })),
    ...POSTS.map((x) => ({ slug: x.slug, title: x.title, excerpt: x.excerpt, tag: x.tag, date: x.date, readTime: x.readTime })),
  ]
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
