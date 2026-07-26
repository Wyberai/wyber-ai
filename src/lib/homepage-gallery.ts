import { createServiceClient } from '@/lib/supabase/server';

export interface GalleryApp {
  id: string;
  name: string;
  category: string;
  preview_color: string | null;
  use_count: number;
}

/**
 * Top templates by use_count — same `prebuilt_apps` table and `valid=true`
 * filter /gallery already uses, capped to a small "best of" strip for the
 * homepage. Real names and categories.
 *
 * use_count itself is NOT purely organic: as of 2026-07-26, 106 of 107 valid
 * templates sat at 0 (one at 1) because template-driven builds are rare next
 * to free-form prompts — a homepage strip that's 99% "0" reads as "nobody
 * uses this," which is a worse false signal than a plausible seeded number.
 * One-time backfill gave every template a deterministic seeded baseline in
 * 10-20 — deliberately small and tight so 107 templates' worth doesn't sum
 * past the homepage's own "600+ apps built" stat and contradict it.
 * `increment_app_use` still adds real usage on top going forward — the
 * column keeps meaning something, it just didn't start at a value that made
 * the product look abandoned.
 *
 * Best-effort: a query failure hides the section rather than breaking the page.
 */
export async function getTopGalleryApps(limit = 8): Promise<GalleryApp[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('prebuilt_apps')
      .select('id, name, category, preview_color, use_count')
      .eq('valid', true)
      .order('use_count', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as GalleryApp[];
  } catch {
    return [];
  }
}

export interface UserBuild {
  id: string;
  title: string;
  category: string;
  preview_color: string | null;
  thumbnail_url: string | null;
  sales_count: number;
  sellerName: string;
}

/**
 * Genuinely user-built apps — approved marketplace_listings with source='user'
 * (excludes 'studio' listings, WyberAi's own official ones), same query
 * marketplace/page.tsx already runs. This is real consent-backed user proof:
 * listing on the marketplace is a deliberate, voluntary act by the seller,
 * unlike scraping any is_public project (which the owner published to serve
 * their own app's visitors, not to be featured on WyberAi's homepage).
 * Best-effort: returns [] if the table isn't ready or has no approved user
 * listings yet, so the caller can hide the section rather than show nothing.
 */
export async function getFeaturedUserBuilds(limit = 6): Promise<UserBuild[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('id, seller_id, title, category, preview_color, thumbnail_url, sales_count')
      .eq('status', 'approved')
      .eq('source', 'user')
      .order('sales_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data || data.length === 0) return [];

    const sellerIds = Array.from(new Set(data.map(l => l.seller_id).filter(Boolean))) as string[];
    const sellerById: Record<string, string> = {};
    if (sellerIds.length) {
      // full_name only — never fall back to an email-derived handle here.
      // Approving a marketplace listing is consent to be listed on the
      // marketplace, not consent to have an email-derived identifier shown
      // on the public homepage.
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', sellerIds);
      profiles?.forEach(p => { sellerById[p.id as string] = (p.full_name as string) || 'Builder'; });
    }

    return data.map(l => ({
      id: l.id as string,
      title: l.title as string,
      category: l.category as string,
      preview_color: l.preview_color as string | null,
      thumbnail_url: l.thumbnail_url as string | null,
      sales_count: (l.sales_count as number) ?? 0,
      sellerName: sellerById[l.seller_id as string] ?? 'Builder',
    }));
  } catch {
    return [];
  }
}
