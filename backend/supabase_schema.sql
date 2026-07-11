-- ============================================================
-- Saawariya – Supabase PostgreSQL Schema
-- Run this entire script in the Supabase SQL Editor.
-- ============================================================


-- ── 1. Profiles (linked to Supabase auth.users) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  full_name   TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. Products ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  title       TEXT,
  description TEXT,
  price       NUMERIC NOT NULL DEFAULT 0,
  category    TEXT,
  sizes       TEXT[]  DEFAULT '{}',
  colors      TEXT[]  DEFAULT '{}',
  stock       INTEGER DEFAULT 0,
  image_url   TEXT,
  created_by  UUID    REFERENCES auth.users,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 3. Addresses ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id            TEXT PRIMARY KEY,
  profile_id    UUID    REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name     TEXT       NOT NULL,
  phone         TEXT,
  address_line1 TEXT       NOT NULL,
  address_line2 TEXT,
  city          TEXT       NOT NULL,
  state         TEXT       NOT NULL,
  postal_code   TEXT       NOT NULL,
  country       TEXT       NOT NULL,
  is_default    BOOLEAN    DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── 4. Wishlist Items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id          BIGSERIAL  PRIMARY KEY,
  profile_id  UUID       REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  TEXT       REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, product_id)
);


-- ── 5. Cart Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          BIGSERIAL  PRIMARY KEY,
  profile_id  UUID       REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  TEXT       REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    INTEGER    DEFAULT 1,
  size        TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, product_id, size, color)
);


-- ── 6. Reviews ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id           BIGSERIAL PRIMARY KEY,
  product_id   TEXT      REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id   UUID      REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating       NUMERIC   CHECK (rating >= 1 AND rating <= 5),
  review_text  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ── 7. Orders ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                TEXT PRIMARY KEY,
  profile_id        UUID    REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_amount      NUMERIC NOT NULL,
  payment_status    TEXT    DEFAULT 'unpaid',
  order_status      TEXT    DEFAULT 'pending',
  status_history    JSONB   DEFAULT '[]',
  razorpay_order_id TEXT,
  razorpay_amount   NUMERIC,
  transaction_id    TEXT,
  address_id        TEXT    REFERENCES public.addresses(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ── 8. Order Items ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT      REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  TEXT      REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    INTEGER   DEFAULT 1
);


-- ── 9. Razorpay Webhooks (idempotency log) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.razorpay_webhooks (
  id           TEXT PRIMARY KEY,
  received_at  TIMESTAMPTZ DEFAULT NOW(),
  event_type   TEXT,
  payment_id   TEXT
);


-- ── 10. API Test Table (health-check / migration verification) ────────────────
CREATE TABLE IF NOT EXISTS public.api_test (
  id           BIGSERIAL PRIMARY KEY,
  uid          UUID,
  payload      JSONB,
  server_time  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================

-- Products: public read, admin write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.products;
CREATE POLICY "Public Read Access" ON public.products
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Write Access" ON public.products;
CREATE POLICY "Admin Write Access" ON public.products
  FOR ALL TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role' = 'admin');

-- Profiles: users can read/update their own row
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own profile access" ON public.profiles;
CREATE POLICY "Own profile access" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id);

-- Addresses: own rows only
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own addresses" ON public.addresses;
CREATE POLICY "Own addresses" ON public.addresses
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id);

-- Wishlist: own rows only
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own wishlist" ON public.wishlist_items;
CREATE POLICY "Own wishlist" ON public.wishlist_items
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id);

-- Cart: own rows only
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own cart" ON public.cart_items;
CREATE POLICY "Own cart" ON public.cart_items
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id);

-- Orders: users see their own orders; admins see all
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own orders" ON public.orders;
CREATE POLICY "Own orders" ON public.orders
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id OR auth.jwt()->'app_metadata'->>'role' = 'admin');

-- Order items: follows parent order visibility
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order items via order" ON public.order_items;
CREATE POLICY "Order items via order" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.profile_id = auth.uid() OR auth.jwt()->'app_metadata'->>'role' = 'admin')
    )
  );

-- Reviews: public read, authenticated write
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated write reviews" ON public.reviews;
CREATE POLICY "Authenticated write reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- NOTE: The backend uses the service-role key (bypasses RLS), so RLS policies
-- above are most relevant when the frontend accesses Supabase directly (e.g.
-- via @supabase/supabase-js with the anon key).
-- ============================================================
