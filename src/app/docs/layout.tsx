import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Docs — How to use Wyber AI',
  description: 'Learn how to build apps with Wyber AI. Credits, frameworks, Agent Mode, GitHub sync, Vercel deploy.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
