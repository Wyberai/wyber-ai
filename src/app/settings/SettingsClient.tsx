'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { createClient } from '@/lib/supabase/client';

export function SettingsClient({ profile }: { profile: any }) {
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name }).eq('email', profile.email);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const S = {
    page: { minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' },
    content: { maxWidth: 720, margin: '0 auto', padding: 'clamp(32px,5vw,48px) clamp(16px,4vw,40px)' },
    h1: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-serif)' },
    sub: { fontSize: 14, color: 'var(--text3)', marginBottom: 40 },
    section: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 16, boxShadow: 'var(--shadow)' },
    sectionTitle: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '11px 14px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 16, transition: 'border-color 0.15s' },
    btn: { padding: '10px 22px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' },
    planBadge: { fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: 'var(--sky)', fontWeight: 700, border: '1px solid rgba(14,165,233,0.2)', display: 'inline-block' },
  };

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.content}>
        <h1 style={S.h1}>Account Settings</h1>
        <p style={S.sub}>Manage your profile, billing, and preferences</p>

        {/* Profile */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Profile</div>
          <label style={S.label}>Display name</label>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--sky)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <label style={S.label}>Email address</label>
          <input style={{ ...S.input, opacity: 0.6, cursor: 'not-allowed' }} value={profile?.email ?? ''} readOnly />
          <button style={S.btn} onClick={handleSave} disabled={saving}>
            {saving ? '⟳ Saving...' : saved ? '✓ Saved!' : 'Save changes'}
          </button>
        </div>

        {/* Plan & Credits */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Plan & Credits</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Current plan</div>
              <span style={S.planBadge}>{(profile?.plan ?? 'free').toUpperCase()}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--sky)', letterSpacing: '-0.04em', fontFamily: 'var(--font-serif)' }}>{profile?.credits ?? 50}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>credits remaining</div>
            </div>
          </div>
          <Link href="/pricing" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 9, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 14 }}>
            Upgrade plan →
          </Link>
        </div>

        {/* Danger zone */}
        <div style={{ ...S.section, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
          <div style={{ ...S.sectionTitle, color: 'var(--red)' }}>Danger zone</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
            Deleting your account is permanent and cannot be undone. All your projects and data will be lost.
          </p>
          <button style={{ padding: '10px 22px', borderRadius: 9, background: 'transparent', color: 'var(--red)', fontWeight: 700, fontSize: 14, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Delete account
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
