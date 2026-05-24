import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Status — Wyber AI System Status',
  description: 'Live status for Wyber AI services: AI generation, live preview, authentication, database, deployment.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
