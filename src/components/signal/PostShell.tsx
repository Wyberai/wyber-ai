import Link from 'next/link'
import { SignalFrame } from './SignalFrame'
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'
import type { SignalPost } from '@/lib/blog/posts'

/** One reading layout for every Signal blog post: shell, header, prose column, closing call to action. */
export function PostShell({ post, dek, cta, children }: {
  post: SignalPost
  dek: string
  cta: { title: string; body: string; href: string; label: string; second?: { href: string; label: string } }
  children: React.ReactNode
}) {
  const url = `https://wyberai.com/blog/${post.slug}`
  return (
    <SignalFrame>
      <ArticleJsonLd headline={post.title} description={post.excerpt} url={url} datePublished={post.iso} dateModified={post.modified ?? post.iso} />
      <article className="sg-post">
        <Link href="/blog" className="sg-post-back">&larr; All posts</Link>
        <div className="sg-post-meta">
          <span className="sg-post-tag">{post.tag}</span>
          <span className="sg-mono">{post.date} &middot; {post.readTime}{post.updated ? <> &middot; Updated {post.updated}</> : null}</span>
        </div>
        <h1>{post.title}</h1>
        <p className="sg-post-dek">{dek}</p>
        <div className="sg-prose">{children}</div>
        <section className="sg-post-cta" aria-labelledby="post-cta">
          <h2 id="post-cta">{cta.title}</h2>
          <p>{cta.body}</p>
          <Link href={cta.href} className="sg-btn">{cta.label}</Link>
          {cta.second && <Link href={cta.second.href} className="sg-btn sg-ghost">{cta.second.label}</Link>}
        </section>
        <p className="sg-post-note">
          Found something wrong or out of date? Write to <a href="mailto:hello@wyberai.com">hello@wyberai.com</a> and we will fix it and say so here. Rules, fees and rates mentioned in our posts change, and this one was last checked on {post.updated ?? post.date}.
        </p>
      </article>
    </SignalFrame>
  )
}
