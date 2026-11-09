import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="How WyberAi keeps pricing transparent" description="Smart model routing, prompt caching, and self-healing builds. Here's how WyberAi keeps prices lower than Lovable." url="https://wyberai.com/blog/why-we-charge-less-than-lovable" datePublished="2026-05-30" dateModified="2026-11-09" />
      {children}
    </>
  )
}
