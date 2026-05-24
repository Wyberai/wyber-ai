import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Pricing — Start free, scale when ready',
  description: 'Wyber AI pricing: Free (50 credits), Starter ($15/mo), Pro ($39/mo), Teams ($79/seat). No charges for AI mistakes.',
};
export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
