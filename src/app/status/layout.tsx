import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System status',
  description: 'Live status for WyberAi services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
