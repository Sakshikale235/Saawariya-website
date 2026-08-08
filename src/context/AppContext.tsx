import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { fetchProducts } from '../api/products';
import type { Product, CartItem, WishlistItem, Page } from '../types';
import { useSupabaseAuth } from './SupabaseAuthContext';
import {
  addCart,
  addWishlist,
  guestAddWishlist,
  guestCartAdd,
  guestCartRemove,
  guestCartUpdateQuantity,
  guestRemoveWishlist,
  loadCart,
  loadWishlist,
  mergeGuestCart,
  mergeGuestWishlist,
  removeCartVariant,
  removeWishlist,
  updateCartQuantity as updateCartQtySupabase,
  clearCart as clearCartSupabase,
} from '../api/wishlist';


interface AppContextType {
  page: Page;
  productId: string | null;
  categoryFilter: string | null;
  navigate: (page: Page, productId?: string, category?: string | null) => void;
  setCategoryFilter: (cat: string | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useSupabaseAuth();

  // Supabase session uid can vary by project/config; resolve it robustly.
  const uid =
    session?.user?.id ??
    (session?.user as any)?.user_metadata?.sub ??
    (session?.user as any)?.sub ??
    '';

  const [page, setPage] = useState<Page>('loading');
  const [productId, setProductId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const didInit = useRef(false);

  const navigate = useCallback((newPage: Page, pid?: string, cat?: string | null) => {
  console.log("Navigate ->", newPage);

  setPage(newPage);
  setProductId(pid ?? null);
  setCategoryFilter(cat ?? null);

  window.scrollTo(0, 0);
}, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some((item) => item.product.id === productId),
    [wishlist]
  );

  const wishlistCount = wishlist.length;

  const refreshFromSupabase = useCallback(async () => {
    if (!uid) return;
    console.log('[AppContext] refreshFromSupabase start', { uid });
    try {
      const products = await loadWishlist(uid);
      console.log('[AppContext] refreshFromSupabase wishlist loaded', { count: products.length });
      setWishlist(products.map((p) => ({ product: p, addedAt: new Date() })));
    } catch (err) {
      console.error('[AppContext] refreshFromSupabase wishlist error:', err);
    }
    try {
      const cartRows = await loadCart(uid);
      console.log('[AppContext] refreshFromSupabase cart loaded', { count: cartRows.length });
      setCart(
        cartRows.map((r) => ({
          product: r.product,
          quantity: r.quantity,
          size: r.size ?? '',
          color: r.color ?? '',
        }))
      );
    } catch (err) {
      console.error('[AppContext] refreshFromSupabase cart error:', err);
    }
  }, [uid]);

  useEffect(() => {
    if (authLoading) return;
    if (!didInit.current) {
      didInit.current = true;
      // guest init
        if (!uid) {
        (async () => {
          const allProducts: Product[] = await fetchProducts();

          const guestWishlistIds: string[] = JSON.parse(
            window.localStorage.getItem('guest_wishlist') ?? '[]'
          );

          const guestWishlistProducts = allProducts.filter((p: Product) =>
            guestWishlistIds.includes(p.id)
          );

          setWishlist(
            guestWishlistProducts.map((p: Product) => ({
              product: p,
              addedAt: new Date(),
            }))
          );

          const guestCartRaw: any[] = JSON.parse(
            window.localStorage.getItem('guest_cart') ?? '[]'
          );

          const cartItems: CartItem[] = (Array.isArray(guestCartRaw) ? guestCartRaw : [])
            .map((x: any) => {
              const product = allProducts.find(
                (p: Product) => p.id === String(x.productId ?? '')
              );

              if (!product) return null;

              return {
                product,
                quantity: Number(x.quantity ?? 1) || 1,
                size: String(x.size ?? product.sizes[0] ?? ''),
                color: String(x.color ?? product.colors[0] ?? ''),
              };
            })
            .filter((item): item is CartItem => item !== null);

          setCart(cartItems);
        })();
      }
    }

    if (uid) {
      (async () => {
        setIsLoading(true);
        try {
          await mergeGuestWishlist(uid);
          await mergeGuestCart(uid);
          await refreshFromSupabase();
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      // guest state already initialized, but keep it in sync with localStorage changes.
      // Do not refetch on every render.
    }
  }, [uid, authLoading, refreshFromSupabase]);

  const addToCart = useCallback(
    (product: Product, size: string, color: string, quantity = 1) => {
      console.log('[AppContext] addToCart clicked', { uid, productId: product.id, size, color, quantity });
      if (!uid) {
        guestCartAdd(product.id, size, color, quantity);

        // optimistic guest update (so UI updates immediately)
        setCart((prev) => {
          const idx = prev.findIndex((x) => x.product.id === product.id && x.size === size && x.color === color);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
            return next;
          }
          return [...prev, { product, size, color, quantity }];
        });
        return;
      }

      (async () => {
        await addCart(uid, product.id, size, color, quantity);
        await refreshFromSupabase();
      })();
    },
    [uid, refreshFromSupabase]
  );

  const removeFromCart = useCallback(
    (productId: string, size: string, color: string) => {
      if (!uid) {
        guestCartRemove(productId, size, color);
        setCart((prev) => prev.filter((x) => !(x.product.id === productId && x.size === size && x.color === color)));
        return;
      }

      (async () => {
        await removeCartVariant(uid, productId, size, color);
        await refreshFromSupabase();
      })();
    },
    [uid, refreshFromSupabase]
  );

  const updateCartQuantity = useCallback(
    (productId: string, size: string, color: string, quantity: number) => {
      if (!uid) {
        guestCartUpdateQuantity(productId, size, color, quantity);
        if (quantity <= 0) {
          setCart((prev) => prev.filter((x) => !(x.product.id === productId && x.size === size && x.color === color)));
        } else {
          setCart((prev) =>
            prev.map((x) => (x.product.id === productId && x.size === size && x.color === color ? { ...x, quantity } : x))
          );
        }
        return;
      }

      (async () => {
        await updateCartQtySupabase(uid, productId, size, color, quantity);
        await refreshFromSupabase();
      })();
    },
    [uid, refreshFromSupabase]
  );

  const clearCart = useCallback(() => {
    if (!uid) {
      window.localStorage.removeItem('guest_cart');
      setCart([]);
      return;
    }
    (async () => {
      try {
        await clearCartSupabase(uid);
        await refreshFromSupabase();
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    })();
  }, [uid, refreshFromSupabase]);

  const addToWishlist = useCallback(
    (product: Product) => {
      console.log('[AppContext] addToWishlist clicked', { uid, productId: product.id });
      if (!uid) {
        guestAddWishlist(product.id);

        setWishlist((prev) => {
          if (prev.some((x) => x.product.id === product.id)) return prev;
          return [...prev, { product, addedAt: new Date() }];
        });
        return;
      }
      (async () => {
        await addWishlist(uid, product.id);
        await refreshFromSupabase();
      })();
    },
    [uid, refreshFromSupabase]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!uid) {
        guestRemoveWishlist(productId);
        setWishlist((prev) => prev.filter((x) => x.product.id !== productId));
        return;
      }
      (async () => {
        await removeWishlist(uid, productId);
        await refreshFromSupabase();
      })();
    },
    [uid, refreshFromSupabase]
  );

  return (
    <AppContext.Provider
      value={{
        page,
        productId,
categoryFilter,
        navigate,
        setCategoryFilter,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount,
        searchQuery,
        setSearchQuery,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
