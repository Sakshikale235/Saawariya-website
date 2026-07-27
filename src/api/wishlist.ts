import { supabase } from '../supabaseClient';
import type { Product } from '../types';
import { fetchProductById } from '../api/products';

const GUEST_WISHLIST_KEY = 'guest_wishlist';
const GUEST_CART_KEY = 'guest_cart';

export type GuestWishlist = string[];

export type GuestCartItem = {
  productId: string;
  size: string | null;
  color: string | null;
  quantity: number;
};

export type GuestCart = GuestCartItem[];

function readGuestWishlist(): GuestWishlist {
  try {
    const raw = window.localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(items: GuestWishlist) {
  window.localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
}

function normalizeGuestCart(cart: any): GuestCart {
  if (!Array.isArray(cart)) return [];
  return cart
    .map((x) => {
      if (!x || typeof x !== 'object') return null;
      const productId = String((x as any).productId ?? '');
      if (!productId) return null;
      return {
        productId,
        size: (x as any).size ?? null,
        color: (x as any).color ?? null,
        quantity: Number((x as any).quantity ?? 1) || 1,
      } as GuestCartItem;
    })
    .filter(Boolean) as GuestCartItem[];
}

export function readGuestCart(): GuestCart {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    return normalizeGuestCart(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCart) {
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export async function loadWishlist(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', userId);

  if (error) throw error;

  console.log('Wishlist rows:', data);

  const ids: string[] = (data ?? []).map((r: any) => String(r.product_id));
  const products = (await Promise.all(ids.map((id) => fetchProductById(id)))).filter(Boolean) as Product[];

  return products;
}

export async function wishlistCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('wishlist_items')

    .select('product_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count ?? 0;
}

export function guestWishlistCount(): number {
  return readGuestWishlist().length;
}

export async function isProductWishlisted(userId: string, productId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('id')

    .eq('user_id', userId)
    .eq('product_id', productId)
    .limit(1);

  if (error) throw error;
  return !!data && data.length > 0;
}

function assertUuidLike(id: string): string {
  if (!id) return id;
  const s = String(id);
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
  if (!uuidLike) {
    console.error('[Supabase] Non-UUID product_id passed:', { productId: s });
  }
  return s;
}

export async function addWishlist(userId: string, productId: string): Promise<void> {
  productId = assertUuidLike(productId);


  // Prevent duplicates by checking first.
  const { data, error: selErr } = await supabase
    .from('wishlist_items')

    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .limit(1);

  if (data && data.length > 0) return;

  try {
    const { error: insErr } = await supabase
      .from('wishlist_items')
      .insert({
        user_id: userId,
        product_id: productId,
        created_at: new Date().toISOString(),
      });

    if (insErr) {
      console.error('Supabase addWishlist error:', insErr);
      return;
    }
  } catch (err) {
    console.error('Supabase addWishlist exception:', err);
  }
}



export async function removeWishlist(userId: string, productId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('Supabase removeWishlist error:', error);
    }
  } catch (err) {
    console.error('Supabase removeWishlist exception:', err);
  }
}


export async function mergeGuestWishlist(userId: string): Promise<void> {
  const guest = readGuestWishlist();
  if (guest.length === 0) return;

  // For each productId, only insert if not already present.
  for (const productId of Array.from(new Set(guest))) {
    await addWishlist(userId, productId);
  }

  window.localStorage.removeItem(GUEST_WISHLIST_KEY);
}

export function guestAddWishlist(productId: string) {
  const current = readGuestWishlist();
  if (current.includes(productId)) return;
  writeGuestWishlist([...current, productId]);
}

export function guestRemoveWishlist(productId: string) {
  const current = readGuestWishlist();
  writeGuestWishlist(current.filter((id) => id !== productId));
}

export async function guestMoveToCart(product: Product): Promise<void> {
  // Uses product default size/color as the existing UI does.
  const current = readGuestCart();
  const size = product.sizes[0] ?? null;
  const color = product.colors[0] ?? null;

  const idx = current.findIndex((x) => x.productId === product.id && x.size === size && x.color === color);
  if (idx >= 0) {
    current[idx] = { ...current[idx], quantity: current[idx].quantity + 1 };
  } else {
    current.push({ productId: product.id, size, color, quantity: 1 });
  }

  writeGuestCart(current);
}

export async function guestCartAdd(productId: string, size: string | null, color: string | null, quantity: number) {
  const current = readGuestCart();
  const idx = current.findIndex((x) => x.productId === productId && x.size === size && x.color === color);
  if (idx >= 0) {
    current[idx] = { ...current[idx], quantity: current[idx].quantity + quantity };
  } else {
    current.push({ productId, size, color, quantity });
  }
  writeGuestCart(current);
}

export function guestCartRemove(productId: string, size: string | null, color: string | null) {
  const current = readGuestCart();
  const next = current.filter((x) => !(x.productId === productId && x.size === size && x.color === color));
  writeGuestCart(next);
}

export function guestCartUpdateQuantity(productId: string, size: string | null, color: string | null, quantity: number) {
  const current = readGuestCart();
  const idx = current.findIndex((x) => x.productId === productId && x.size === size && x.color === color);
  if (idx < 0) return;
  if (quantity <= 0) {
    writeGuestCart(current.filter((_, i) => i !== idx));
  } else {
    current[idx] = { ...current[idx], quantity };
    writeGuestCart(current);
  }
}

export async function mergeGuestCart(userId: string): Promise<void> {
  const guest = readGuestCart();
  if (guest.length === 0) return;

  // For each guest variant: upsert by matching on (user_id, product_id, size, color)
  for (const item of guest) {
    const { data: existing, error: selErr } = await supabase
      .from('carts')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', item.productId)
      .eq('size', item.size)
      .eq('color', item.color)
      .limit(1);

    if (selErr) throw selErr;

    if (existing && existing.length > 0) {
      const row = existing[0] as any;
      const nextQty = Number(row.quantity ?? 0) + item.quantity;
      const { error: updErr } = await supabase
        .from('carts')
        .update({ quantity: nextQty })
        .eq('id', row.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase.from('carts').insert({
        user_id: userId,
        product_id: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        created_at: new Date().toISOString(),
      });
      if (insErr) throw insErr;
    }
  }

  window.localStorage.removeItem(GUEST_CART_KEY);
}

export async function loadCart(userId: string): Promise<{ product: Product; quantity: number; size: string | null; color: string | null }[]> {
  const { data, error } = await supabase
    .from('carts')
    .select('product_id, quantity, size, color')
    .eq('user_id', userId);

  if (error) throw error;

  console.log('Cart rows:', data);

  const rows = data ?? [];
  const items = (
    await Promise.all(
      rows.map(async (r: any) => {
        const product = await fetchProductById(String(r.product_id));
        if (!product) return null;
        return {
          product,
          quantity: Number(r.quantity ?? 1) || 1,
          size: r.size ?? null,
          color: r.color ?? null,
        };
      })
    )
  ).filter(Boolean) as { product: Product; quantity: number; size: string | null; color: string | null }[];

  return items;
}

export async function addCart(userId: string, productId: string, size: string | null, color: string | null, quantity: number): Promise<void> {
  try {
    const { data: existing, error: selErr } = await supabase
      .from('carts')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('size', size)
      .eq('color', color)
      .limit(1);

    if (selErr) {
      console.error('Supabase addCart select error:', selErr);
      return;
    }

    if (existing && existing.length > 0) {
      const row = existing[0] as any;
      const nextQty = Number(row.quantity ?? 0) + quantity;
      const { error: updErr } = await supabase
        .from('carts')
        .update({ quantity: nextQty })
        .eq('id', row.id);
      if (updErr) {
        console.error('Supabase addCart update error:', updErr);
        return;
      }
    } else {
      const { error: insErr } = await supabase.from('carts').insert({
        user_id: userId,
        product_id: productId,
        size,
        color,
        quantity,
        created_at: new Date().toISOString(),
      });
      if (insErr) {
        console.error('Supabase addCart insert error:', insErr);
        return;
      }
    }
  } catch (err) {
    console.error('Supabase addCart exception:', err);
  }
}


export async function updateCartQuantity(userId: string, productId: string, size: string | null, color: string | null, quantity: number): Promise<void> {
  try {
    if (quantity <= 0) {
      await removeCartVariant(userId, productId, size, color);
      return;
    }

    const { data: existing, error: selErr } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('size', size)
      .eq('color', color)
      .limit(1);

    if (selErr) {
      console.error('Supabase updateCartQuantity select error:', selErr);
      return;
    }
    if (!existing || existing.length === 0) return;

    const id = (existing[0] as any).id;
    const { error: updErr } = await supabase.from('carts').update({ quantity }).eq('id', id);
    if (updErr) {
      console.error('Supabase updateCartQuantity update error:', updErr);
      return;
    }
  } catch (err) {
    console.error('Supabase updateCartQuantity exception:', err);
  }
}


export async function removeCartVariant(userId: string, productId: string, size: string | null, color: string | null): Promise<void> {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('size', size)
      .eq('color', color);

    if (error) {
      console.error('Supabase removeCartVariant error:', error);
    }
  } catch (err) {
    console.error('Supabase removeCartVariant exception:', err);
  }
}


export async function clearCart(userId: string): Promise<void> {
  try {
    const { error } = await supabase.from('carts').delete().eq('user_id', userId);
    if (error) {
      console.error('Supabase clearCart error:', error);
    }
  } catch (err) {
    console.error('Supabase clearCart exception:', err);
  }
}


export function cartCountFromGuestCart(cart: GuestCart): number {
  return cart.reduce((sum, x) => sum + (Number(x.quantity) || 0), 0);
}

export function wishlistCountFromGuestWishlist(list: GuestWishlist): number {
  return list.length;
}

