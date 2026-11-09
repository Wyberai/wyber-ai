import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="How to deploy an AI-generated app to production" description="Step-by-step guide to taking an AI-generated app from preview to production. Covers custom domains, Supabase database setup, environment variables, and Vercel deployment." url="https://wyberai.com/blog/how-to-deploy-ai-generated-app" datePublished="2026-06-27" dateModified="2026-06-27" />
      {children}
    </>
  )
}
