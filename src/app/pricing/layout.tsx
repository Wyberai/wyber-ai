import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Start free, scale when ready',
  description: 'WyberAi pricing: Starter $29, Builder $79, Pro $199. Six products, one credit balance. No charges for AI mistakes.',
  alternates: { canonical: 'https://wyberai.com/pricing' },
  openGraph: {
    title: 'Pricing — Start free, scale when ready | WyberAi',
    description: 'WyberAi pricing: Starter $29, Builder $79, Pro $199. Six products, one credit balance. No charges for AI mistakes.',
    url: 'https://wyberai.com/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
