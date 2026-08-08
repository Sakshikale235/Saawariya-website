-- ============================================================
-- Saawariya – Order Management Migration  (v2, backward-compatible)
-- Run in the Supabase SQL Editor (Settings → SQL Editor).
--
-- SAFE TO RUN ON EXISTING DATA:
--   • All ALTER TABLE statements use ADD COLUMN IF NOT EXISTS.
--   • No existing columns are dropped or renamed.
--   • CHECK constraints are guarded by DO $$ existence checks.
--   • Existing backend views (orders_views.py, payments_views.py)
--     continue to work unchanged after this migration.
--
-- ACCESS MODEL (read this before touching RLS):
--   Django backend  uses SUPABASE_SERVICE_ROLE_KEY which carries
--   role=service_role in its JWT.  Supabase grants this role full,
--   unrestricted access to all tables; RLS is entirely bypassed.
--
--   The React frontend uses a per-user JWT (anon / authenticated).
--   RLS policies below apply ONLY to that direct-client path.
--   Django never relies on, nor is limited by, any policy here.
-- ============================================================


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 1 – EXTEND public.orders
--
-- Decision: Keep id as TEXT (not UUID) to preserve backward-compatibility with
-- existing rows written by orders_views.py (which already generates uuid4 strings
-- as TEXT).  PostgreSQL TEXT accepts any UUID string; casting is only needed if
-- you later change the type.  All new columns are nullable so existing rows are
-- unaffected.
-- ──────────────────────────────────────────────────────────────────────────────

-- 1a. Financial breakdown columns
--
-- Why NUMERIC(12,2)?
--   NUMERIC is an exact decimal type; FLOAT/DOUBLE are IEEE 754 binary fractions
--   and cannot represent e.g. 0.1 exactly, causing rounding errors in totals.
--   Precision 12, scale 2 = up to 9,999,999,999.99 (safely above any INR order).
--   All monetary columns in orders and order_items use this type.
--   Exception: payments.amount stays INTEGER (paise) to match Razorpay's API.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal      NUMERIC(12, 2) CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS discount      NUMERIC(12, 2) DEFAULT 0 CHECK (discount >= 0),
  ADD COLUMN IF NOT EXISTS shipping_fee  NUMERIC(12, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
  ADD COLUMN IF NOT EXISTS tax           NUMERIC(12, 2) DEFAULT 0 CHECK (tax >= 0);

-- total_amount already exists as plain NUMERIC NOT NULL (no precision/scale).
-- Cast to NUMERIC(12,2) for consistency across all monetary columns.
-- Existing data is preserved; PostgreSQL applies precision/scale going forward.
-- Application formula: total_amount = subtotal - discount + shipping_fee + tax
ALTER TABLE public.orders
  ALTER COLUMN total_amount TYPE NUMERIC(12, 2);

-- 1b. Payment method (cod | razorpay | upi | …)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay'
    CHECK (payment_method IN ('razorpay', 'cod', 'upi', 'netbanking', 'card', 'wallet'));

-- Decision: ENUM-style CHECK allows the frontend to rely on a fixed set without
-- a separate lookup table.  Add new values here as payment providers are added.

-- 1c. Normalised status columns with CHECK constraints
--     order_status / payment_status already exist as plain TEXT; we add CHECK
--     constraints only if they don't already exist to avoid duplicate constraint errors.
DO $$
BEGIN
  -- order_status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_order_status_check' AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_order_status_check
      CHECK (order_status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded'));
  END IF;

  -- payment_status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_status_check' AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('unpaid','paid','failed','refunded','pending_verification'));
  END IF;
END;
$$;

-- 1d. Indexes on the most common query patterns
--     (profile_id already has an implicit FK index; add the rest)
CREATE INDEX IF NOT EXISTS idx_orders_profile_id
  ON public.orders (profile_id);

CREATE INDEX IF NOT EXISTS idx_orders_order_status
  ON public.orders (order_status);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON public.orders (payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id);

-- Decision: razorpay_order_id is stored on orders for the webhook lookup
-- performed by payments_views.py.  Index makes that O(log n) instead of O(n).

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);

-- Decision: DESC index is used for "recent orders" pages in both the customer
-- dashboard and the admin panel.


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 2 – EXTEND public.order_items  (product snapshot)
--
-- Decision: Store a denormalised snapshot of the product at purchase time.
-- If a product is later deleted or its price changes, the order history remains
-- accurate.  The existing product_id FK is kept for convenience (join to get
-- current product data), but the business-critical fields are self-contained.
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_name      TEXT,
  ADD COLUMN IF NOT EXISTS product_image     TEXT,
  ADD COLUMN IF NOT EXISTS price_at_purchase NUMERIC(12, 2) CHECK (price_at_purchase >= 0),
  ADD COLUMN IF NOT EXISTS selected_size     TEXT,
  ADD COLUMN IF NOT EXISTS selected_color    TEXT,
  ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ DEFAULT NOW();

-- Decision: quantity is already INTEGER DEFAULT 1; no change needed.
-- Decision: product_id FK has ON DELETE CASCADE – if a product is hard-deleted
-- the item row goes too.  The snapshot fields (name, image, price) preserve the
-- customer's receipt even if the product no longer exists.  If you want true
-- immutability, change the FK to ON DELETE SET NULL.

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2)
    GENERATED ALWAYS AS (price_at_purchase * quantity) STORED;

-- Decision: Computed subtotal per line is stored in the DB so the backend never
-- needs to recalculate it.  GENERATED ALWAYS STORED uses no extra space beyond
-- a regular column and is automatically kept consistent.

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items (product_id);


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 3 – CREATE public.payments  (dedicated payment ledger)
--
-- Decision: Separate payments table instead of embedding Razorpay fields in orders.
--   • One order can have multiple payment attempts (failure → retry).
--   • The existing orders.razorpay_order_id / transaction_id columns are kept so
--     orders_views.py and payments_views.py continue to work without code changes.
--   • This table is the authoritative receipt.  The backend creates a row here
--     after successful verification.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- FK to the parent order
  order_id             TEXT         NOT NULL
    REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Razorpay identifiers
  razorpay_order_id    TEXT,           -- Razorpay's own order id (rzp_ord_…)
  razorpay_payment_id  TEXT,           -- Razorpay's payment id (pay_…)
  razorpay_signature   TEXT,           -- HMAC-SHA256 signature verified at capture

  -- Amount in smallest currency unit (paise for INR)
  amount               INTEGER      NOT NULL CHECK (amount > 0),
  currency             TEXT         NOT NULL DEFAULT 'INR'
    CHECK (char_length(currency) = 3),   -- ISO 4217

  -- Status lifecycle: initiated → captured | failed | refunded
  status               TEXT         NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated','captured','failed','refunded','pending_verification')),

  -- Gateway response (store full JSON for debugging / disputes)
  gateway_response     JSONB        DEFAULT '{}',

  paid_at              TIMESTAMPTZ,     -- set when status becomes 'captured'
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Decision: UUID PK with gen_random_uuid() because:
--   1. Payments must never be guessable / enumerable by external parties.
--   2. Supabase enables pgcrypto by default so gen_random_uuid() is available.

COMMENT ON TABLE public.payments IS
  'Authoritative payment ledger. One row per payment attempt for an order.';

COMMENT ON COLUMN public.payments.razorpay_signature IS
  'HMAC-SHA256(razorpay_order_id|razorpay_payment_id, key_secret). Verified before inserting.';

COMMENT ON COLUMN public.payments.gateway_response IS
  'Raw JSON response from Razorpay. Stored for auditing and dispute resolution.';

CREATE INDEX IF NOT EXISTS idx_payments_order_id
  ON public.payments (order_id);

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
  ON public.payments (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON public.payments (razorpay_payment_id);

-- Decision: Both Razorpay IDs are indexed because the webhook handler looks up
-- by razorpay_order_id AND VerifyRazorpayPaymentView looks up by order_id.
-- Separate indexes are smaller and faster than a composite.

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments (status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
  ON public.payments (created_at DESC);


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 4 – ROW-LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 4a. orders ────────────────────────────────────────────────────────────────
-- Already enabled in the base schema.  Replace the broad policy with split
-- SELECT / INSERT / UPDATE / DELETE policies for clearer intent.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own orders"               ON public.orders;
DROP POLICY IF EXISTS "orders_select_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_update_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_delete_own"        ON public.orders;
DROP POLICY IF EXISTS "orders_all_admin"         ON public.orders;

-- Customers: read their own orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

-- Customers: create orders for themselves only
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- Customers: update their own orders (e.g. cancel before dispatch)
-- The backend service-role key bypasses RLS anyway; this guards direct client access.
CREATE POLICY "orders_update_own" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Customers: cannot delete orders (protect audit trail)
-- No DELETE policy for customers.

-- Admins: unrestricted access to everything
CREATE POLICY "orders_all_admin" ON public.orders
  FOR ALL TO authenticated
  USING      (auth.jwt()->'app_metadata'->>'role' = 'admin')
  WITH CHECK (auth.jwt()->'app_metadata'->>'role' = 'admin');

-- Decision: Split policies are clearer than FOR ALL, and allow future fine-tuning
-- (e.g. allowing customers to cancel but not update other fields).


-- ── 4b. order_items ───────────────────────────────────────────────────────────
-- Already enabled in the base schema.  Replace read-only policy with full CRUD
-- split so inserts are also controlled.

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order items via order"         ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_own"        ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own"        ON public.order_items;
DROP POLICY IF EXISTS "order_items_all_admin"         ON public.order_items;

-- Customers: read items belonging to their own orders
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.profile_id = auth.uid()
    )
  );

-- Customers: insert items only into their own orders
CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.profile_id = auth.uid()
    )
  );

-- No UPDATE / DELETE policy for customers (order items are immutable after creation).

-- Admins: unrestricted
CREATE POLICY "order_items_all_admin" ON public.order_items
  FOR ALL TO authenticated
  USING      (auth.jwt()->'app_metadata'->>'role' = 'admin')
  WITH CHECK (auth.jwt()->'app_metadata'->>'role' = 'admin');


-- ── 4c. payments ─────────────────────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Customers: read only their own payment records (via order ownership)
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND o.profile_id = auth.uid()
    )
  );

-- Customers: insert a payment record for their own order
-- Decision: INSERT is allowed so the frontend can record a payment initiation
-- directly.  Verification/status update is always done server-side (backend
-- service-role key).
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND o.profile_id = auth.uid()
    )
  );

-- Customers: NO UPDATE or DELETE on payments (immutable receipt principle).
-- Status transitions are performed only by the backend (service-role key, bypasses RLS).

-- Admins: unrestricted
CREATE POLICY "payments_all_admin" ON public.payments
  FOR ALL TO authenticated
  USING      (auth.jwt()->'app_metadata'->>'role' = 'admin')
  WITH CHECK (auth.jwt()->'app_metadata'->>'role' = 'admin');

-- Decision: The backend Django service uses the service-role key which bypasses
-- RLS entirely.  These policies protect direct Supabase client (anon/user key)
-- access from the frontend.


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 5 – HELPER FUNCTION: atomic order placement
--
-- Decision: Wrap order + order_items insert + stock deduction in a single
-- Postgres transaction exposed as an RPC.  This prevents the race condition
-- that exists in the current Python-level sequential calls in orders_views.py.
-- The backend's fallback path still works; calling this RPC is optional but
-- strongly recommended for production.
--
-- Call from Django:  supabase.rpc('place_order', {...}).execute()
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.place_order(
  p_order_id       TEXT,
  p_profile_id     UUID,
  p_address_id     TEXT,
  p_subtotal       NUMERIC,
  p_discount       NUMERIC,
  p_shipping_fee   NUMERIC,
  p_tax            NUMERIC,
  p_total_amount   NUMERIC,
  p_payment_method TEXT,
  p_items          JSONB   -- [{"product_id","quantity","product_name","product_image","price_at_purchase","selected_size","selected_color"}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER   -- runs with definer's privileges (service role) so RLS is bypassed inside
AS $$
DECLARE
  v_item       JSONB;
  v_product_id TEXT;
  v_qty        INTEGER;
  v_stock      INTEGER;
  v_now        TIMESTAMPTZ := NOW();
BEGIN
  -- ── Stock validation (fail fast before any writes) ──────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := v_item->>'product_id';
    v_qty        := (v_item->>'quantity')::INTEGER;

    SELECT stock INTO v_stock
      FROM public.products
     WHERE id = v_product_id
       FOR UPDATE;   -- row-level lock prevents concurrent over-sell

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found::%', v_product_id;
    END IF;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock::%', v_product_id;
    END IF;
  END LOOP;

  -- ── Insert order ─────────────────────────────────────────────────────────
  INSERT INTO public.orders (
    id, profile_id, address_id,
    subtotal, discount, shipping_fee, tax, total_amount,
    payment_method, payment_status, order_status,
    status_history, created_at, updated_at
  ) VALUES (
    p_order_id, p_profile_id, p_address_id,
    p_subtotal, p_discount, p_shipping_fee, p_tax, p_total_amount,
    p_payment_method, 'unpaid', 'pending',
    jsonb_build_array(jsonb_build_object('status','pending','timestamp', v_now)),
    v_now, v_now
  );

  -- ── Insert order items + deduct stock ────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := v_item->>'product_id';
    v_qty        := (v_item->>'quantity')::INTEGER;

    INSERT INTO public.order_items (
      order_id, product_id, quantity,
      product_name, product_image, price_at_purchase,
      selected_size, selected_color, created_at
    ) VALUES (
      p_order_id,
      v_product_id,
      v_qty,
      v_item->>'product_name',
      v_item->>'product_image',
      (v_item->>'price_at_purchase')::NUMERIC,
      v_item->>'selected_size',
      v_item->>'selected_color',
      v_now
    );

    UPDATE public.products
       SET stock      = stock - v_qty,
           updated_at = v_now
     WHERE id = v_product_id;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id',  p_order_id,
    'status',    'pending',
    'created_at', v_now
  );

EXCEPTION
  WHEN OTHERS THEN
    -- re-raise so the caller gets the SQLSTATE and message
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.place_order IS
  'Atomically creates an order, inserts line-items, and deducts stock.
   Uses SELECT FOR UPDATE to prevent over-selling under concurrent load.
   Raises exceptions with prefixed codes: product_not_found::<id> or insufficient_stock::<id>.';


-- ──────────────────────────────────────────────────────────────────────────────
-- SECTION 6 – VERIFICATION QUERIES
-- Run these after the migration to confirm everything applied correctly.
-- ──────────────────────────────────────────────────────────────────────────────

-- Check new orders columns
-- SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'orders'
--  ORDER BY ordinal_position;

-- Check new order_items columns
-- SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'order_items'
--  ORDER BY ordinal_position;

-- Check payments table
-- SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'payments'
--  ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT tablename, policyname, cmd, qual, with_check
--   FROM pg_policies
--  WHERE schemaname = 'public'
--    AND tablename IN ('orders','order_items','payments')
--  ORDER BY tablename, policyname;

-- Check indexes
-- SELECT indexname, indexdef
--   FROM pg_indexes
--  WHERE schemaname = 'public'
--    AND tablename IN ('orders','order_items','payments')
--  ORDER BY tablename, indexname;
