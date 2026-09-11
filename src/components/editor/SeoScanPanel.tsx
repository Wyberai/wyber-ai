'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';

interface Check { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string }
interface Report { score: number; checks: Check[]; scannedAt: string }

const STATUS_STYLE: Record<Check['status'], { color: string; icon: string }> = {
  pass: { color: '#34D399', icon: '✓' },
  warn: { color: '#F5A623', icon: '!' },
  fail: { color: '#F0524B', icon: '✕' },
};

// "Make it a Marketing Beast" — a curated bundle of the launch-readiness
// content every real project needs, distinct from the checks above (those
// are diagnostics for what the app ALREADY has; this is a one-shot generator
// for what it's usually missing). Deliberately only real generateable
// content — each item is a file/page/snippet the model can actually write —
// not audit-style tasks like "test forms" or "check broken links" that need
// running tests, not writing content, so they'd overpromise if bundled here.
// No new pricing logic needed: this dispatches through the same
// wyber:chat-prompt → normal edit path every other panel uses, and a
// generation this size naturally settles into the large/xl edit tier
// (credits.ts) from its real output tokens — same mechanism, not a special case.
//
// A crawlable marketing site's launch checklist (privacy/terms/robots.txt/
// sitemap.xml) doesn't transfer 1:1 to a mobile app (app stores don't care
// about robots.txt, but DO require a privacy policy and real app icons) or a
// SaaS product (needs a pricing page and conversion trust signals more than
// it needs a cookie banner) or a generic tool (mostly behind auth, so
// onboarding/empty-states matter more than per-page SEO) — so each project
// type gets its own curated 10, not one list stretched to fit everything.
type MarketingBeastType = 'website' | 'saas' | 'mobile' | 'app';

const MARKETING_BEAST_SETS: Record<MarketingBeastType, { items: { label: string; detail: string }[]; prompt: string }> = {
  website: {
    items: [
      { label: 'Privacy Policy', detail: 'A real, complete page — not a placeholder' },
      { label: 'Terms of Service', detail: 'A real, complete page' },
      { label: 'Custom 404 page', detail: 'Branded, matches the site\'s design, links back home' },
      { label: 'Per-page SEO meta tags', detail: 'Descriptive title + meta description on every real page' },
      { label: 'Social share previews', detail: 'Open Graph + Twitter Card tags — rich link previews' },
      { label: 'Favicon + app icons', detail: 'Matches the site\'s existing branding' },
      { label: 'robots.txt', detail: 'Allows crawlers, points to the sitemap' },
      { label: 'sitemap.xml', detail: 'Lists every real route on the site' },
      { label: 'Cookie consent banner', detail: 'Dismissible, accept/decline' },
      { label: 'Analytics scaffold', detail: 'GA4-ready tracking helper, wired into route changes' },
    ],
    prompt: `Make this site launch-ready by adding all of the following. Match the site's existing design system, tone, and branding throughout — none of this should look bolted-on:

1. Privacy Policy page — a real, complete policy referencing what this specific site actually does, not generic boilerplate.
2. Terms of Service page — a real, complete page, same standard as the Privacy Policy.
3. A custom 404 "page not found" page, styled to match the rest of the site, with a clear link back home.
4. Descriptive, keyword-relevant <title> and <meta name="description"> tags for every real page/route.
5. Open Graph and Twitter Card meta tags (og:title, og:description, og:image, og:url, twitter:card) so shared links show a rich preview.
6. A favicon and app icons matching the site's existing branding/colors.
7. public/robots.txt allowing all crawlers and pointing to the sitemap.
8. public/sitemap.xml listing every real route this site has.
9. A dismissible cookie-consent banner (accept/decline) using the site's existing UI style.
10. A lightweight analytics scaffold — tracks page views on route change, reads a measurement ID from an env var, with a clear placeholder for when no ID is set yet (do not fabricate a working GA account).

Only add these — do not modify any existing feature, page, or styling beyond what's needed to wire these in.`,
  },
  saas: {
    items: [
      { label: 'Public landing page', detail: 'Hero, features, CTA — in front of the app, not the login screen' },
      { label: 'Pricing page', detail: 'Clear plan tiers, matching what the app actually offers' },
      { label: 'Privacy Policy', detail: 'A real, complete page' },
      { label: 'Terms of Service', detail: 'A real, complete page' },
      { label: 'Custom 404 page', detail: 'Branded, links back home' },
      { label: 'Refund / cancellation policy', detail: 'A real page — required trust signal for paid products' },
      { label: 'Empty states + onboarding checklist', detail: 'No blank screens for a brand-new signup' },
      { label: 'Social share previews', detail: 'Open Graph + Twitter Card tags' },
      { label: 'Favicon + app icons', detail: 'Matches the product\'s existing branding' },
      { label: 'Analytics scaffold', detail: 'GA4-ready tracking helper, wired into route changes' },
    ],
    prompt: `Make this SaaS product launch-ready by adding all of the following. Match the app's existing design system, tone, and branding throughout — none of this should look bolted-on:

1. A public marketing landing page (hero, real feature list, clear CTA) in front of the app — shown to logged-out visitors instead of jumping straight to a login screen.
2. A pricing page with clear plan tiers matching what this product actually offers (or a reasonable free/pro structure if none exists yet).
3. Privacy Policy page — a real, complete policy referencing what this specific product actually does.
4. Terms of Service page — a real, complete page, same standard as the Privacy Policy.
5. A custom 404 "page not found" page, styled to match the rest of the app, with a clear link back home.
6. A refund/cancellation policy page — a real trust signal for any product charging money.
7. Proper empty states for every major dashboard screen, plus a short onboarding checklist for a brand-new signup so nothing looks blank/broken on first login.
8. Open Graph and Twitter Card meta tags (og:title, og:description, og:image, og:url, twitter:card) for the public landing/pricing pages.
9. A favicon and app icons matching the product's existing branding/colors.
10. A lightweight analytics scaffold — tracks page views on route change, reads a measurement ID from an env var, with a clear placeholder for when no ID is set yet.

Only add these — do not modify any existing feature, page, or styling beyond what's needed to wire these in.`,
  },
  mobile: {
    items: [
      { label: 'Privacy Policy', detail: 'Required for App Store / Play Store submission' },
      { label: 'Terms of Service', detail: 'A real, complete page/screen' },
      { label: 'Full app icon set', detail: 'All required iOS/Android sizes, matching the app\'s branding' },
      { label: 'Splash screen', detail: 'Matches the app\'s branding' },
      { label: 'Onboarding walkthrough', detail: 'First-run screens introducing the app' },
      { label: 'Empty states', detail: 'For every major screen — no blank/broken-looking views' },
      { label: 'Permission explainer screens', detail: 'Why camera/location/notifications are needed, shown before the OS prompt' },
      { label: 'Push notification opt-in', detail: 'A dedicated screen/prompt, not a bare OS dialog' },
      { label: 'Store listing copy', detail: 'Title, subtitle, description, keywords — ready to paste into App Store Connect / Play Console' },
      { label: 'Analytics scaffold', detail: 'Screen-view tracking helper wired into navigation' },
    ],
    prompt: `Make this mobile app store-ready by adding all of the following. Match the app's existing design system and branding throughout:

1. A Privacy Policy screen/page — a real, complete policy referencing what this specific app actually does. This is REQUIRED for App Store/Play Store submission.
2. A Terms of Service screen/page — a real, complete page, same standard as the Privacy Policy.
3. A full app icon set at every size iOS and Android require, matching the app's existing branding/colors.
4. A splash screen matching the app's branding.
5. A short first-run onboarding walkthrough (2-4 screens) introducing what the app does.
6. Proper empty states for every major screen — nothing should look blank or broken before real data exists.
7. Permission-explainer screens shown BEFORE the native OS permission dialog for anything the app requests (camera, location, notifications, etc.) — explain why in the app's own voice, not the generic OS prompt.
8. A push-notification opt-in screen if the app uses notifications, instead of firing the bare OS prompt unexplained.
9. App Store / Play Store listing copy as a single reference doc: app title, subtitle/short description, full description, and a keyword list — ready to paste into App Store Connect / Play Console.
10. A lightweight analytics scaffold that tracks screen views on navigation, reading a measurement ID from an env var, with a clear placeholder for when no ID is set yet.

Only add these — do not modify any existing feature or screen beyond what's needed to wire these in.`,
  },
  app: {
    items: [
      { label: 'Privacy Policy', detail: 'A real, complete page' },
      { label: 'Terms of Service', detail: 'A real, complete page' },
      { label: 'Custom 404 / error page', detail: 'Branded, links back home' },
      { label: 'Empty states', detail: 'For every major screen — no blank "nothing here" moments' },
      { label: 'Onboarding walkthrough', detail: 'A short first-run intro for new users' },
      { label: 'Keyboard shortcuts help', detail: 'A quick-reference panel, if the app is shortcut-heavy' },
      { label: 'Favicon + app icons', detail: 'Matches the app\'s existing branding' },
      { label: 'Social share previews', detail: 'Open Graph + Twitter Card tags for the public entry page' },
      { label: 'robots.txt + sitemap.xml', detail: 'Minimal but present, for whatever\'s publicly reachable' },
      { label: 'Analytics scaffold', detail: 'GA4-ready tracking helper, wired into route changes' },
    ],
    prompt: `Make this app launch-ready by adding all of the following. Match the app's existing design system, tone, and branding throughout — none of this should look bolted-on:

1. Privacy Policy page — a real, complete policy referencing what this specific app actually does, not generic boilerplate.
2. Terms of Service page — a real, complete page, same standard as the Privacy Policy.
3. A custom 404/error page, styled to match the rest of the app, with a clear link back home.
4. Proper empty states for every major screen — nothing should look blank or broken before real data exists.
5. A short first-run onboarding walkthrough introducing what the app does.
6. A keyboard-shortcuts help panel/modal if this app has meaningful keyboard interactions — skip this one if it doesn't.
7. A favicon and app icons matching the app's existing branding/colors.
8. Open Graph and Twitter Card meta tags (og:title, og:description, og:image, og:url, twitter:card) for whatever public entry page this app has.
9. A minimal public/robots.txt and public/sitemap.xml covering whatever pages are actually publicly reachable (skip if the entire app is behind auth with nothing public to list).
10. A lightweight analytics scaffold — tracks page views on route change, reads a measurement ID from an env var, with a clear placeholder for when no ID is set yet.

Only add these — do not modify any existing feature, page, or styling beyond what's needed to wire these in.`,
  },
};

function resolveMarketingBeastType(projectType?: string): MarketingBeastType {
  if (projectType === 'website' || projectType === 'saas' || projectType === 'mobile') return projectType;
  return 'app';
}

export function SeoScanPanel({ projectId, projectType: projectTypeProp, onSwitchToChat }: { projectId: string; projectType?: string; onSwitchToChat?: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [beastArmed, setBeastArmed] = useState(false);
  const project = useEditorStore(s => s.project);
  const projectType = projectTypeProp ?? project?.project_type;

  const beastType = resolveMarketingBeastType(projectType);
  const beast = MARKETING_BEAST_SETS[beastType];

  const makeMarketingBeast = () => {
    if (!beastArmed) { setBeastArmed(true); return; }
    setBeastArmed(false);
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: beast.prompt })), 60);
  };

  const scan = async () => {
    setScanning(true); setError(null);
    try {
      const res = await fetch('/api/seo/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Scan failed');
      else setReport(json);
    } catch (e) { setError(String(e)); }
    setScanning(false);
  };

  const fixWithAi = (check: Check) => {
    const prompts: Record<string, string> = {
      title: 'Set a descriptive, keyword-rich <title> tag in index.html for this app.',
      description: 'Add a compelling <meta name="description"> (under 160 characters) to index.html.',
      opengraph: 'Add complete Open Graph meta tags (og:title, og:description, og:image, og:url) to index.html so shared links show a rich preview.',
      'structured-data': 'Add appropriate schema.org JSON-LD structured data to index.html for this type of site.',
      robots: 'Add a public/robots.txt that allows all crawlers and points to the sitemap.',
      sitemap: 'Add a public/sitemap.xml listing all the routes in this app.',
      'llms-txt': 'Create a public/llms.txt file following the llms.txt convention (llmstxt.org) — a clean markdown summary of what this site/product is, its key pages, and its purpose, so AI assistants like ChatGPT and Claude can read and cite it accurately without scraping rendered HTML.',
    };
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: prompts[check.id] || `Fix this SEO issue: ${check.label}` })), 60);
  };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', height: '100%' }}>
      <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>
        🔎 <strong>Real SEO & AI-search scan.</strong> Reads your actual generated index.html and public/ files — not a guess from a template.
      </div>

      <button onClick={scan} disabled={scanning}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.7 : 1 }}>
        {scanning ? '⟳ Scanning…' : '🔎 Scan SEO & AI-search readiness'}
      </button>

      {/* Make it a Marketing Beast — bundled launch-readiness generator,
          distinct from the scan above (that finds what's broken; this adds
          what's usually just missing). Set differs per project type. */}
      <div style={{ border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '12px 14px', background: 'rgba(168,85,247,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ide-text)' }}>🔥 Make it a Marketing Beast</div>
          <div style={{ fontSize: 11.5, color: 'var(--ide-text3)', marginTop: 3, lineHeight: 1.5 }}>
            Adds the 10 launch-readiness pieces every {beastType === 'mobile' ? 'app store submission' : beastType === 'saas' ? 'SaaS product' : beastType === 'website' ? 'site' : 'app'} needs, in one pass — priced like any large edit based on what actually gets built, typically <strong style={{ color: '#a855f7' }}>~20-50 credits</strong>.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
          {beast.items.map(item => (
            <div key={item.label} title={item.detail} style={{ fontSize: 11, color: 'var(--ide-text2)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
              <span style={{ color: '#a855f7', flexShrink: 0 }}>✓</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <button onClick={makeMarketingBeast}
          style={{
            alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: beastArmed ? '#a855f7' : 'rgba(168,85,247,0.15)', color: beastArmed ? '#fff' : '#a855f7',
            fontSize: 12.5, fontWeight: 700,
          }}>
          {beastArmed ? 'Tap again to confirm →' : '🔥 Make it a Marketing Beast'}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#F0524B', background: 'rgba(240,82,75,0.08)', border: '1px solid rgba(240,82,75,0.25)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
      )}

      {report && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-surface, #16181d)', borderRadius: 10, border: '1px solid var(--ide-border)' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: report.score >= 85 ? '#34D399' : report.score >= 50 ? '#F5A623' : '#F0524B', letterSpacing: '-0.03em' }}>{report.score}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ide-text)' }}>SEO & AI-search score</div>
              <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2 }}>{report.checks.filter(c => c.status === 'pass').length} of {report.checks.length} checks passing</div>
            </div>
          </div>

          {report.checks.map(c => {
            const s = STATUS_STYLE[c.status];
            return (
              <div key={c.id} style={{ padding: '11px 13px', borderRadius: 8, border: `1px solid ${s.color}40`, background: `${s.color}0c` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: s.color, color: '#000', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ide-text)' }}>{c.label}</span>
                  </div>
                  {c.status !== 'pass' && (
                    <button onClick={() => fixWithAi(c)}
                      style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--ide-border)', background: 'var(--bg-base, #0d0e12)', color: '#0EA5E9', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                      ✨ Fix with AI
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ide-text3)', lineHeight: 1.5 }}>{c.detail}</div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
