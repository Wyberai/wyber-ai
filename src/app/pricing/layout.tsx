import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Start free, scale when ready',
  description: 'WyberAi pricing: Free, Starter, Pro, Teams. No charges for AI mistakes.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
