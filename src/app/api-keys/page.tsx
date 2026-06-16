import { NavbarClient as Navbar } from '@/components/shared/NavbarClient';
import { Footer } from '@/components/shared/FooterClient';
import { APIKeysPanel } from '@/components/settings/APIKeysPanel';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'API Keys — WyberAi' };

export default function APIKeysPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,8vw,72px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Developer</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' }}>API & MCP Access</h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 40 }}>Connect WyberAi to Claude Desktop, Cursor, or build on top of the API.</p>
        <APIKeysPanel />
      </div>
      <Footer />
    </div>
  );
}
