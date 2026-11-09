import type { Metadata } from 'next';
import { PRICING_STRINGS } from '@/lib/i18n/dict/pricing';
import { creditCost } from '@/lib/credits';

export const metadata: Metadata = {
  title: 'Pricing — Start free, scale when ready',
  description: 'WyberAi pricing: Starter $29, Builder $79, Pro $199. Web + mobile apps, one credit balance. No charges for AI mistakes.',
  alternates: { canonical: 'https://wyberai.com/pricing' },
  openGraph: {
    title: 'Pricing — Start free, scale when ready | WyberAi',
    description: 'WyberAi pricing: Starter $29, Builder $79, Pro $199. Web + mobile apps, one credit balance. No charges for AI mistakes.',
    url: 'https://wyberai.com/pricing',
  },
};

// FAQPage markup for the questions shown on the page, so search and answer engines can quote them. The text is built the
// same way the page builds it (same strings, same credit costs), so the markup always matches what a visitor reads.
function faqJsonLd() {
  const t = PRICING_STRINGS.en;
  const answers: Record<string, string> = {
    faq1A: t.faq1A
      .replace('{simple}', String(creditCost('web-build', 'fast', 'small')))
      .replace('{complex}', String(creditCost('web-build', 'default', 'large')))
      .replace('{edit}', String(creditCost('small-edit', 'fast'))),
  };
  const items = [1, 2, 3, 4, 5, 6].map(n => ({
    '@type': 'Question',
    name: t[`faq${n}Q`],
    acceptedAnswer: { '@type': 'Answer', text: answers[`faq${n}A`] ?? t[`faq${n}A`] },
  }));
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items }).replace(/</g, '\\u003c');
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />
      {children}
    </>
  );
}
