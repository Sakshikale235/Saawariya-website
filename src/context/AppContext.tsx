import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Product, CartItem, WishlistItem, Page } from '../types';

interface AppContextType {
  page: Page;
  productId: string | null;
  categoryFilter: string | null;
  navigate: (page: Page, productId?: string, category?: string | null) => void;
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
  const [page, setPage] = useState<Page>('loading');
  const [productId, setProductId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useCallback((newPage: Page, pid?: string, cat?: string | null) => {
    setPage(newPage);
    setProductId(pid ?? null);
    setCategoryFilter(cat ?? null);
    window.scrollTo(0, 0);
  }, []);

  const addToCart = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(
        item => item.product.id === product.id && item.size === size && item.color === color
      );
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.size === size && item.color === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, size, color, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size: string, color: string) => {
    setCart(prev =>
      prev.filter(
        item => !(item.product.id === productId && item.size === size && item.color === color)
      )
    );
  }, []);

  const updateCartQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev =>
        prev.filter(
          item => !(item.product.id === productId && item.size === size && item.color === color)
        )
      );
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToWishlist = useCallback((product: Product) => {
    setWishlist(prev => {
      if (prev.find(item => item.product.id === product.id)) return prev;
      return [...prev, { product, addedAt: new Date() }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some(item => item.product.id === productId),
    [wishlist]
  );

  const wishlistCount = wishlist.length;

  return (
    <AppContext.Provider
      value={{
        page,
        productId,
        categoryFilter,
        navigate,
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
