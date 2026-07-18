import { describe, it, expect } from 'vitest';
import { resolveHeroSegment, HERO_SEGMENT_STRINGS } from './hero-segments';

describe('resolveHeroSegment', () => {
  it('returns null for untagged organic/direct traffic (default hero untouched)', () => {
    expect(resolveHeroSegment({})).toBeNull();
    expect(resolveHeroSegment({ utmSource: null, utmCampaign: null, referer: null })).toBeNull();
    expect(resolveHeroSegment({ referer: 'https://www.google.com/search?q=app+builder' })).toBeNull();
    expect(resolveHeroSegment({ utmSource: 'badge-featured', utmCampaign: 'badge-wyberai' })).toBeNull();
  });

  it('maps the made-with badge on published apps to the badge segment (exact source only)', () => {
    // app/[slug]/page.tsx: utm_source=made-with-badge, utm_campaign=<app slug>
    expect(resolveHeroSegment({ utmSource: 'made-with-badge', utmCampaign: 'my-app' })).toBe('badge');
    expect(resolveHeroSegment({ utmSource: 'Made-With-Badge' })).toBe('badge');
    // Anything merely containing "badge" stays default
    expect(resolveHeroSegment({ utmSource: 'some-badge' })).toBeNull();
  });

  it('maps the live security funnel utms to the security segment', () => {
    // The RLS-scanner lifecycle emails (lib/email/index.ts)
    expect(resolveHeroSegment({ utmSource: 'scanner_email', utmCampaign: 'rls-scan' })).toBe('security');
    // The /tools scanner CTA (app/tools/ToolsClient.tsx)
    expect(resolveHeroSegment({ utmSource: 'tools', utmCampaign: 'scanner' })).toBe('security');
    expect(resolveHeroSegment({ utmCampaign: 'security-parity' })).toBe('security');
  });

  it('maps Reddit/HN referrals to the security segment', () => {
    expect(resolveHeroSegment({ referer: 'https://www.reddit.com/r/vibecoding/' })).toBe('security');
    expect(resolveHeroSegment({ referer: 'https://news.ycombinator.com/item?id=1' })).toBe('security');
    expect(resolveHeroSegment({ utmSource: 'reddit' })).toBe('security');
  });

  it('maps devshop/agency outreach tags to the devshop segment, beating security hints', () => {
    expect(resolveHeroSegment({ utmCampaign: 'devshop' })).toBe('devshop');
    expect(resolveHeroSegment({ utmSource: 'devshop-outreach' })).toBe('devshop');
    expect(resolveHeroSegment({ utmCampaign: 'agency-q3' })).toBe('devshop');
    // Deliberately-tagged outreach wins over an incidental reddit referer
    expect(
      resolveHeroSegment({ utmCampaign: 'devshop', referer: 'https://www.reddit.com/' }),
    ).toBe('devshop');
  });

  it('is case-insensitive on utm values', () => {
    expect(resolveHeroSegment({ utmSource: 'Scanner_Email' })).toBe('security');
    expect(resolveHeroSegment({ utmCampaign: 'DevShop' })).toBe('devshop');
  });

  it('every segment only overrides hero-scope fields', () => {
    const heroFields = new Set(['eyebrowMain', 'heroLine1', 'heroLine2', 'heroLead', 'heroPlaceholder']);
    for (const overrides of Object.values(HERO_SEGMENT_STRINGS)) {
      for (const key of Object.keys(overrides)) expect(heroFields.has(key)).toBe(true);
    }
  });
});
