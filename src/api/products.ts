import { supabase } from '../supabaseClient';
import type { Product } from '../types';

/**
 * Product row shape returned by the Supabase `products` table.
 * Double‑check column names against your actual schema if needed.
 */
interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discount_price: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  image_url: string;
  material: string;
  fit: string;
  care: string;
  origin: string;
  brand_id: string | null;
  slug: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // The migration may also have migrated rating / reviews / tags.
  // We'll check at runtime and default if missing.
}

// ---------------------------------------------------------------------------
// In‑memory cache – prevents repeated fetches within the same page load.
// ---------------------------------------------------------------------------
let cached: Product[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

function isCacheValid(): boolean {
  return cached !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

function updateCache(products: Product[]) {
  cached = products;
  cacheTimestamp = Date.now();
}

export function clearCache() {
  cached = null;
  cacheTimestamp = 0;
}

// ---------------------------------------------------------------------------
// Mapping helper
// ---------------------------------------------------------------------------

function mapRowToProduct(row: ProductRow): Product {
  const discountPrice = row.discount_price ?? 0;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    originalPrice: Number(row.price) + discountPrice,
    category: row.category,
    subcategory: row.slug ?? row.category, // fallback readable label
    image: row.image_url,
    images: [row.image_url],
    rating: 4.5, // default – not in the base schema
    reviews: 0,  // default
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    inStock: row.is_active && row.stock > 0,
    tags: row.slug ? [row.slug] : [],
    brand: row.brand_id ?? 'Saawariya',
    material: row.material ?? '',
    care: row.care ?? '',
    fit: row.fit ?? '',
    origin: row.origin ?? 'India',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch **all** active products from the Supabase `products` table.
 * Results are cached for `CACHE_TTL_MS`.
 */
export async function fetchProducts(): Promise<Product[]> {
  if (isCacheValid()) return cached!;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[products.ts] fetchProducts error:', error);
    throw error;
  }

  const rows = (data ?? []) as ProductRow[];
  const products = rows.map(mapRowToProduct);
  updateCache(products);
  return products;
}

/**
 * Fetch a single product by its **UUID** primary key.
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  // Attempt cache lookup first
  if (isCacheValid()) {
    const found = cached!.find((p) => p.id === id);
    if (found) return found;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[products.ts] fetchProductById error:', error);
    throw error;
  }

  if (!data) return null;
  return mapRowToProduct(data as ProductRow);
}

/**
 * Fetch products belonging to a specific category.
 */
export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const all = await fetchProducts();
  return all.filter((p) => p.category === category);
}

/**
 * Return products considered "featured" (highest‑rated subset).
 * Since rating is a default for now, we return the first 8 active products.
 */
export async function fetchFeaturedProducts(): Promise<Product[]> {
  const all = await fetchProducts();
  return all.slice(0, 8);
}

/**
 * Return "bestsellers" (by stock sold – not available, so we return a subset).
 */
export async function fetchBestsellers(): Promise<Product[]> {
  const all = await fetchProducts();
  return all.slice(0, 6);
}

/**
 * Search products by name, description, category, and tags.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const all = await fetchProducts();
  const q = query.trim().toLowerCase();
  if (!q) return all;

  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

