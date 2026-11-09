import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="Why startups are ditching dev agencies for AI app builders" description="Dev agencies charge $15k–$50k and take 3–6 months. AI app builders like WyberAi ship an MVP the same day for $29/mo. A real comparison of cost, speed, and quality." url="https://wyberai.com/blog/ai-app-builder-for-startups" datePublished="2026-06-29" dateModified="2026-06-29" />
      {children}
    </>
  )
}
