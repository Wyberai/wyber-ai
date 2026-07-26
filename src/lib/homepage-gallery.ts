import { createServiceClient } from '@/lib/supabase/server';

export interface GalleryApp {
  id: string;
  name: string;
  category: string;
  preview_color: string | null;
  use_count: number;
}

/**
 * Top real templates by actual use_count — same `prebuilt_apps` table and
 * `valid=true` filter /gallery already uses, just capped to a small "best of"
 * strip for the homepage. Real names, real categories, real usage numbers —
 * no screenshots exist for these yet (a future improvement), but the numbers
 * themselves are genuine, not illustrative, unlike the homepage's previous
 * fake terminal-log mockups. Best-effort: a query failure hides the section
 * rather than breaking the page.
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
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', sellerIds);
      profiles?.forEach(p => { sellerById[p.id as string] = (p.full_name as string) || (p.email as string)?.split('@')[0] || 'Builder'; });
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
