import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="How to build a SaaS app without writing code in 2026" description="AI app builders have changed what is possible for solo founders. Go from idea to live product in a single afternoon." url="https://wyberai.com/blog/build-saas-without-code" datePublished="2026-05-28" dateModified="2026-05-28" />
      {children}
    </>
  )
}
