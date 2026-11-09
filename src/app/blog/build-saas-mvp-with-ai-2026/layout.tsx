import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="How to build a SaaS MVP with AI in 2026" description="A step-by-step guide to going from idea to live SaaS product in under an hour using AI app builders. No coding required." url="https://wyberai.com/blog/build-saas-mvp-with-ai-2026" datePublished="2026-05-29" dateModified="2026-05-29" />
      {children}
    </>
  )
}
