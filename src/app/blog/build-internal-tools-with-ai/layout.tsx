import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="Build internal tools in minutes — not months" description="Stop wasting engineering sprints on admin panels and dashboards. AI app builders generate production-ready internal tools from a single prompt." url="https://wyberai.com/blog/build-internal-tools-with-ai" datePublished="2026-06-26" dateModified="2026-06-26" />
      {children}
    </>
  )
}
