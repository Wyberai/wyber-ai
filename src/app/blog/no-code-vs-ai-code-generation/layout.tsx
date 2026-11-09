import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="No-code vs AI code generation — which one should you use in 2026?" description="A practical comparison of no-code platforms (Bubble, Glide, Webflow) and AI code generators (WyberAi, Lovable, Bolt). Trade-offs on vendor lock-in, performance, and customization." url="https://wyberai.com/blog/no-code-vs-ai-code-generation" datePublished="2026-06-28" dateModified="2026-06-28" />
      {children}
    </>
  )
}
