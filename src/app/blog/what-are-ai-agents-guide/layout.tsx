import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="What are AI agents? A practical guide for non-technical founders" description="Agents watch data, make decisions, and take action automatically. Here's what they actually are, what they're good for, and how to build one without code." url="https://wyberai.com/blog/what-are-ai-agents-guide" datePublished="2026-06-13" dateModified="2026-11-09" />
      {children}
    </>
  )
}
