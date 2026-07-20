import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VsPageTemplate } from '@/components/seo/VsPageTemplate'
import { getScanStats } from '@/lib/security-stats'
import { NON_ENGLISH_LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { localeAlternates } from '@/lib/i18n/hreflang'
import { LOVABLE_CONTENT } from '@/lib/i18n/dict/vs-content/lovable'

// Locale-prefixed sibling of app/vs/[competitor]/page.tsx — see that file's
// English version for the canonical (unprefixed) route. Only 'hi'|'kn'|'te'|'ta'
// generate here; 'en' 404s (English stays at the existing /vs/[competitor] URL
// with zero disruption to current backlinks/SEO equity — see NON_ENGLISH_LOCALES).
//
// Each competitor needs its own translated content file under
// dict/vs-content/*.ts (rows/faqs/tagline/blurb/pillarNote) — only 'lovable'
// exists so far as the proof of this pattern. Adding another competitor means:
// 1) create dict/vs-content/<slug>.ts following lovable.ts's shape
// 2) add it to CONTENT below and to generateStaticParams' competitor list
const COMPETITORS: Record<string, { name: string; url: string; content: typeof LOVABLE_CONTENT }> = {
  lovable: { name: 'Lovable', url: 'https://lovable.dev', content: LOVABLE_CONTENT },
}

const META: Record<Locale, { titleSuffix: string; descTemplate: string }> = {
  en: { titleSuffix: 'Honest Comparison', descTemplate: 'WyberAi vs {name}: fresh code every build, web + mobile apps, self-healing builds, 27 integrations, and GitHub ownership. Verified June 2026.' },
  hi: { titleSuffix: 'ईमानदार तुलना', descTemplate: 'WyberAi बनाम {name}: हर बिल्ड में नया कोड, वेब + मोबाइल ऐप्स, सेल्फ-हीलिंग बिल्ड्स, 27 इंटीग्रेशन, और GitHub ओनरशिप। जून 2026 में सत्यापित।' },
  kn: { titleSuffix: 'ಪ್ರಾಮಾಣಿಕ ಹೋಲಿಕೆ', descTemplate: 'WyberAi vs {name}: ಪ್ರತಿ ಬಿಲ್ಡ್‌ನಲ್ಲೂ ಹೊಸ ಕೋಡ್, ವೆಬ್ + ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳು, ಸ್ವಯಂ-ಸರಿಪಡಿಸುವ ಬಿಲ್ಡ್‌ಗಳು, 27 ಇಂಟಿಗ್ರೇಶನ್‌ಗಳು, ಮತ್ತು GitHub ಮಾಲೀಕತ್ವ. ಜೂನ್ 2026 ರಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.' },
  te: { titleSuffix: 'నిజాయితీ పోలిక', descTemplate: 'WyberAi vs {name}: ప్రతి బిల్డ్‌లో కొత్త కోడ్, వెబ్ + మొబైల్ యాప్‌లు, స్వీయ-సరిదిద్దుకునే బిల్డ్‌లు, 27 ఇంటిగ్రేషన్‌లు, మరియు GitHub యాజమాన్యం. జూన్ 2026లో ధృవీకరించబడింది.' },
  ta: { titleSuffix: 'நேர்மையான ஒப்பீடு', descTemplate: 'WyberAi vs {name}: ஒவ்வொரு பில்டிலும் புதிய கோட், வெப் + மொபைல் ஆப்கள், சுய-சரிசெய்யும் பில்டுகள், 27 இன்டகிரேஷன்கள், மற்றும் GitHub உரிமை. ஜூன் 2026 இல் சரிபார்க்கப்பட்டது.' },
}

export function generateStaticParams() {
  return NON_ENGLISH_LOCALES.flatMap(locale =>
    Object.keys(COMPETITORS).map(competitor => ({ locale, competitor }))
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; competitor: string }> }): Promise<Metadata> {
  const { locale, competitor } = await params
  const comp = COMPETITORS[competitor]
  if (!isLocale(locale) || locale === 'en' || !comp) return {}
  const m = META[locale]
  return {
    title: `WyberAi vs ${comp.name} (2026) — ${m.titleSuffix}`,
    description: m.descTemplate.replace('{name}', comp.name),
    alternates: {
      canonical: `https://wyberai.com/${locale}/vs/${competitor}`,
      languages: localeAlternates(`/vs/${competitor}`),
    },
    openGraph: {
      title: `WyberAi vs ${comp.name} (2026)`,
      description: m.descTemplate.replace('{name}', comp.name),
      url: `https://wyberai.com/${locale}/vs/${competitor}`,
    },
  }
}

export default async function LocalizedVsPage({ params }: { params: Promise<{ locale: string; competitor: string }> }) {
  const { locale, competitor } = await params
  if (!isLocale(locale) || locale === 'en') notFound()
  const comp = COMPETITORS[competitor]
  if (!comp) notFound()

  const content = comp.content[locale]
  const securityStats = await getScanStats()

  return (
    <VsPageTemplate
      slug={competitor}
      competitorName={comp.name}
      competitorUrl={comp.url}
      tagline={content.tagline}
      blurb={content.blurb}
      rows={content.rows}
      faqs={content.faqs}
      pillarNote={content.pillarNote}
      competitorKey={competitor}
      securityStats={securityStats}
      locale={locale}
    />
  )
}
