import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd headline="How to build a mobile app with AI in 2026" description="React Native + Expo from a plain-English prompt. Preview on your phone in minutes. No Xcode, no Android Studio, no code." url="https://wyberai.com/blog/build-mobile-app-with-ai-2026" datePublished="2026-06-14" dateModified="2026-06-14" />
      {children}
    </>
  )
}
