import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Start free, scale when ready',
  description: 'WyberAi pricing: Starter $29, Builder $79, Pro $199, Growth $399, Scale $799. Six products, one credit balance. No charges for AI mistakes.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
