import { supabase } from '../supabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Row shape as stored in Supabase (snake_case columns). */
interface HeroBannerRow {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapRowToBanner(row: HeroBannerRow): HeroBanner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    button_text: row.button_text,
    button_link: row.button_link,
    image_url: row.image_url,
    display_order: row.display_order,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch **all** hero banners (regardless of active status),
 * ordered by `display_order` ascending.
 */
export async function fetchHeroBanners(): Promise<HeroBanner[]> {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[heroBanners.ts] fetchHeroBanners error:', error);
    throw error;
  }

  return (data ?? []).map((row: any) => mapRowToBanner(row as HeroBannerRow));
}

/**
 * Fetch **only active** hero banners (`is_active = true`),
 * ordered by `display_order` ascending.
 */
export async function fetchActiveHeroBanner(): Promise<HeroBanner[]> {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[heroBanners.ts] fetchActiveHeroBanner error:', error);
    throw error;
  }

  return (data ?? []).map((row: any) => mapRowToBanner(row as HeroBannerRow));
}

/**
 * Create a new hero banner.
 * Returns the created banner.
 */
export async function createHeroBanner(
  banner: Omit<HeroBanner, 'id' | 'created_at' | 'updated_at'>,
): Promise<HeroBanner> {
  const { data, error } = await supabase
    .from('hero_banners')
    .insert({
      title: banner.title,
      subtitle: banner.subtitle,
      button_text: banner.button_text,
      button_link: banner.button_link,
      image_url: banner.image_url,
      display_order: banner.display_order,
      is_active: banner.is_active,
    })
    .select()
    .single();

  if (error) {
    console.error('[heroBanners.ts] createHeroBanner error:', error);
    throw error;
  }

  return mapRowToBanner(data as HeroBannerRow);
}

/**
 * Update an existing hero banner by `id`.
 * Only the provided fields will be updated.
 * Returns the updated banner.
 */
export async function updateHeroBanner(
  id: string,
  updates: Partial<Omit<HeroBanner, 'id' | 'created_at' | 'updated_at'>>,
): Promise<HeroBanner> {
  const { data, error } = await supabase
    .from('hero_banners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[heroBanners.ts] updateHeroBanner error:', error);
    throw error;
  }

  return mapRowToBanner(data as HeroBannerRow);
}

/**
 * Delete a hero banner by `id`.
 */
export async function deleteHeroBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('hero_banners')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[heroBanners.ts] deleteHeroBanner error:', error);
    throw error;
  }
}

