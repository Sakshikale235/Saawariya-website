# Homepage Dynamic Implementation - Progress

## Step 1: Database Schema Migration
- [ ] Add `is_new`, `bestseller`, `featured`, `discount_price` to products table
- [ ] Create `featured_collections` table

## Step 2: Update src/api/products.ts
- [ ] Add `is_new`, `bestseller`, `featured`, `discount_price` to ProductRow interface
- [ ] Add `fetchNewArrivals()` (is_new=true, order by created_at DESC, limit 8)
- [ ] Update `fetchBestsellers()` to use bestseller=true
- [ ] Update `fetchFeaturedProducts()` to use featured=true

## Step 3: Create src/api/featuredCollections.ts
- [ ] Fetch active featured collections ordered by display_order

## Step 4: Fix HeroSection.tsx JSX nesting errors
- [ ] Fix all 3 branches (loading, fallback, loaded)

## Step 5: Update src/pages/HomePage.tsx
- [ ] Remove hardcoded /Picture2.png and /Picture4.png
- [ ] Remove hardcoded "Festive Collection 2024" content
- [ ] Remove static categories import from data/categories.ts
- [ ] Derive categories dynamically from products.category (Men, Women, Collections only)
- [ ] Add New Arrivals section (is_new=true, created_at DESC, 8 products)
- [ ] Update Best Picks section to use bestseller=true
- [ ] Update Featured Collection to use featured=true
- [ ] Add Featured Collections (promotional banners from featured_collections table)
- [ ] Keep all existing UI design, Tailwind styling, animations, ProductCard
