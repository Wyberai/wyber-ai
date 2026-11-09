import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="AI workflow automation without code" description="Connect your apps, apply AI reasoning, and run automations on a schedule — all from plain English. No Zapier, no Make, no code." url="https://wyberai.com/blog/ai-workflow-automation-guide" datePublished="2026-06-12" dateModified="2026-11-09" />
      {children}
    </>
  )
}
