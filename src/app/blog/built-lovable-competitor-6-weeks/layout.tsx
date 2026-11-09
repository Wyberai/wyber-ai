import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="I built a Lovable competitor in 6 weeks as a solo founder" description="How I shipped an AI app builder from zero to live in 6 weeks, and the decisions that made it possible." url="https://wyberai.com/blog/built-lovable-competitor-6-weeks" datePublished="2026-05-31" dateModified="2026-11-09" />
      {children}
    </>
  )
}
