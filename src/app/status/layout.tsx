import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Status - WyberAi System Status',
  description: 'Live status for WyberAi services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
