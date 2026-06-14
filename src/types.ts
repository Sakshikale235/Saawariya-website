export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  subcategory: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  colors: string[];
  sizes: string[];
  inStock: boolean;
  tags: string[];
  brand: string;
  material: string;
  care: string;
  fit: string;
  origin: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

export type Page = 'home' | 'shop' | 'product' | 'cart' | 'wishlist' | 'loading';

export interface AppState {
  page: Page;
  productId: string | null;
  categoryFilter: string | null;
}
