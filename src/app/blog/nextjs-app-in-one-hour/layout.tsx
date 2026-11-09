import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="Build a production Next.js app in under an hour with AI" description="Next.js is the default framework in WyberAi. SSR, SEO, and performance out of the box. A step-by-step walkthrough." url="https://wyberai.com/blog/nextjs-app-in-one-hour" datePublished="2026-05-26" dateModified="2026-05-26" />
      {children}
    </>
  )
}
