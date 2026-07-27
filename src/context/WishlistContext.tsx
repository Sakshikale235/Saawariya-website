import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product, CartItem, WishlistItem } from '../types';
import { fetchProducts } from '../api/products';
import { useSupabaseAuth } from './SupabaseAuthContext';
import {
  addCart,
  addWishlist,
  clearCart,
  cartCountFromGuestCart,
  guestAddWishlist,
  guestCartAdd,
  guestCartRemove,
  guestCartUpdateQuantity,
  guestWishlistCount,
  guestRemoveWishlist,
  isProductWishlisted,
  loadCart,
  loadWishlist,
  mergeGuestCart,
  mergeGuestWishlist,
  removeCartVariant,
  removeWishlist,
  removeWishlist as supabaseRemoveWishlist,
  updateCartQuantity,
  wishlistCount,
  removeCartVariant as supabaseRemoveCartVariant,
} from '../api/wishlist';

type WishlistContextType = {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;

  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, size: string, color: string) => Promise<void>;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useSupabaseAuth();
  const userId = session?.user?.id ?? '';

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [wishlistCountState, setWishlistCountState] = useState(0);

  const isInWishlist = useMemo(() => {
    const set = new Set(wishlist.map((w) => w.product.id));
    return (productId: string) => set.has(productId);
  }, [wishlist]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const refreshWishlist = async (uid: string) => {
    const products = await loadWishlist(uid);
    setWishlist(products.map((product) => ({ product, addedAt: new Date() })));
    setWishlistCountState(await wishlistCount(uid));
  };

  const refreshCart = async (uid: string) => {
    const items = await loadCart(uid);
    setCart(
      items.map((it) => ({
        product: it.product,
        quantity: it.quantity,
        size: it.size ?? '',
        color: it.color ?? '',
      }))
    );
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

       if (!session) {
    const allProducts = await fetchProducts();

    const guestIds = JSON.parse(
      window.localStorage.getItem('guest_wishlist') ?? '[]'
    ) as string[];

    const guestProducts = allProducts.filter((product: Product) =>
      guestIds.includes(product.id)
    );

    if (!cancelled) {
      setWishlist(
        guestProducts.map((product: Product) => ({
          product,
          addedAt: new Date(),
        }))
      );

      setWishlistCountState(guestProducts.length);
      setCart([]);
    }

    return;
  }

          await mergeGuestWishlist(userId);
          await mergeGuestCart(userId);
          await refreshWishlist(userId);
          await refreshCart(userId);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, userId, authLoading]);

  const ctxValue: WishlistContextType = {
    wishlist,
    wishlistCount: wishlistCountState,
    isInWishlist,
    addToWishlist: async (product) => {
      if (!session) {
        guestAddWishlist(product.id);
        setWishlist((prev) => {
          if (prev.some((x) => x.product.id === product.id)) return prev;
          return [...prev, { product, addedAt: new Date() }];
        });
        setWishlistCountState((c) => c + 1);
        return;
      }

      await addWishlist(userId, product.id);
      await refreshWishlist(userId);
    },
    removeFromWishlist: async (productId) => {
      if (!session) {
        guestRemoveWishlist(productId);
        setWishlist((prev) => prev.filter((x) => x.product.id !== productId));
        setWishlistCountState((c) => Math.max(0, c - 1));
        return;
      }

      await removeWishlist(userId, productId);
      await refreshWishlist(userId);
    },

    cart,
    cartCount,
    cartTotal,
    addToCart: async (product, size, color, quantity = 1) => {
      // Guest cart not implemented here (AppContext currently does). Keep no-op to avoid breaking.
      // This module is introduced but we are migrating AppContext in a later step.
      // Returning empty implementation would break UI, so we throw to force migration completion.
      throw new Error('Cart provider not integrated. Use AppContext for cart until migration is complete.');
    },
    removeFromCart: async (_productId, _size, _color) => {
      throw new Error('Cart provider not integrated. Use AppContext for cart until migration is complete.');
    },
    updateCartQuantity: async (_productId, _size, _color, _quantity) => {
      throw new Error('Cart provider not integrated. Use AppContext for cart until migration is complete.');
    },
    clearCart: async () => {
      throw new Error('Cart provider not integrated. Use AppContext for cart until migration is complete.');
    },
  };

  if (loading && wishlist.length === 0) {
    // still allow render; UI handles loading at page level.
  }

  return <WishlistContext.Provider value={ctxValue}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

