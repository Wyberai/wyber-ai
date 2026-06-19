import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Start free, scale when ready',
  description: 'WyberAi pricing: Builder $99, Operator $249, Founder $499, Scale $999. Six pillars, one credit balance. No charges for AI mistakes.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
