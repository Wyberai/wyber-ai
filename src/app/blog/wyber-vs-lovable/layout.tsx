import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="WyberAi vs Lovable" description="Both tools build full-stack apps from plain English. An honest comparison for developers and founders." url="https://wyberai.com/blog/wyber-vs-lovable" datePublished="2026-05-27" dateModified="2026-05-27" />
      {children}
    </>
  )
}
