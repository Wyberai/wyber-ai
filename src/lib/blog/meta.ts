import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGES } from '@/lib/og-default'
import { SIGNAL_POSTS, type SignalPost } from './posts'

export function getPost(slug: string): SignalPost {
  const post = SIGNAL_POSTS.find((p) => p.slug === slug)
  if (!post) throw new Error(`Unknown blog post: ${slug}`)
  return post
}

export function postMetadata(post: SignalPost): Metadata {
  const url = `https://wyberai.com/blog/${post.slug}`
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: { images: DEFAULT_OG_IMAGES, title: post.title, url, type: 'article' },
  }
}
