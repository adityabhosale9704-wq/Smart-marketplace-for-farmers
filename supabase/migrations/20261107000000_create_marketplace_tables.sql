-- Review only: requires Supabase auth.users, auth.uid(), anon and authenticated roles.
-- Stock deduction, cancellation/restoration and status transitions need later atomic
-- functions with row locking. Constraints alone do not prevent overselling.

-- SECTION 1: Farmer Profiles

-- Profiles may be incomplete at registration; email and credentials stay in Auth.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  mobile TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  pin_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_id_fk FOREIGN KEY (id)
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT profiles_full_name_check
    CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 100),
  CONSTRAINT profiles_mobile_check
    CHECK (mobile ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT profiles_city_check
    CHECK (char_length(btrim(city)) BETWEEN 2 AND 100),
  CONSTRAINT profiles_district_check
    CHECK (char_length(btrim(district)) BETWEEN 2 AND 100),
  CONSTRAINT profiles_state_check
    CHECK (char_length(btrim(state)) BETWEEN 2 AND 100),
  CONSTRAINT profiles_pin_code_check
    CHECK (pin_code ~ '^[1-9][0-9]{5}$')
);

-- Keep update timestamps accurate without relying on every caller to set them.
CREATE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SECTION 2: Products

-- Draft = unpublished; published + positive stock = Active;
-- published + zero stock = Out of Stock. Do not store a second stock-derived status.
-- Future product writes must validate harvest_date <= today's Asia/Kolkata date
-- and keep seller identity and measurement unit immutable.
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  available_quantity NUMERIC(12,2) NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  harvest_date DATE,
  image_path TEXT,
  listing_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT products_seller_id_fk FOREIGN KEY (seller_id)
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT products_name_check
    CHECK (char_length(btrim(name)) BETWEEN 3 AND 100),
  CONSTRAINT products_category_check
    CHECK (category IN ('vegetables', 'fruits', 'grains', 'pulses', 'seeds', 'spices')),
  CONSTRAINT products_description_check
    CHECK (char_length(btrim(description)) BETWEEN 20 AND 2000),
  CONSTRAINT products_price_check
    CHECK (price > 0 AND price <= 1000000),
  CONSTRAINT products_unit_check
    CHECK (unit IN ('kg', 'quintal')),
  CONSTRAINT products_available_quantity_check
    CHECK (available_quantity BETWEEN 0 AND 1000000),
  CONSTRAINT products_city_check
    CHECK (char_length(btrim(city)) BETWEEN 2 AND 100),
  CONSTRAINT products_district_check
    CHECK (char_length(btrim(district)) BETWEEN 2 AND 100),
  CONSTRAINT products_state_check
    CHECK (char_length(btrim(state)) BETWEEN 2 AND 100),
  CONSTRAINT products_harvest_date_check
    CHECK (harvest_date >= DATE '1900-01-01'),
  CONSTRAINT products_image_path_check
    CHECK (char_length(btrim(image_path)) BETWEEN 1 AND 1024),
  CONSTRAINT products_listing_status_check
    CHECK (listing_status IN ('draft', 'published')),
  CONSTRAINT products_id_seller_id_unique UNIQUE (id, seller_id)
);

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SECTION 3: Orders

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  request_key UUID NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  contact_name TEXT NOT NULL,
  contact_mobile TEXT NOT NULL,
  contact_email TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT orders_buyer_id_fk FOREIGN KEY (buyer_id)
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT orders_currency_check
    CHECK (currency = 'INR'),
  CONSTRAINT orders_contact_name_check
    CHECK (char_length(btrim(contact_name)) BETWEEN 2 AND 100),
  CONSTRAINT orders_contact_mobile_check
    CHECK (contact_mobile ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT orders_contact_email_check
    CHECK (
      char_length(contact_email) <= 254
      AND contact_email ~ '^[^[:space:]@]+@[^[:space:]@.]+([.][^[:space:]@.]+)+$'
    ),
  CONSTRAINT orders_address_line1_check
    CHECK (char_length(btrim(address_line1)) BETWEEN 5 AND 200),
  CONSTRAINT orders_address_line2_check
    CHECK (char_length(btrim(address_line2)) BETWEEN 1 AND 200),
  CONSTRAINT orders_city_check
    CHECK (char_length(btrim(city)) BETWEEN 2 AND 100),
  CONSTRAINT orders_district_check
    CHECK (char_length(btrim(district)) BETWEEN 2 AND 100),
  CONSTRAINT orders_state_check
    CHECK (char_length(btrim(state)) BETWEEN 2 AND 100),
  CONSTRAINT orders_pin_code_check
    CHECK (pin_code ~ '^[1-9][0-9]{5}$'),
  CONSTRAINT orders_delivery_notes_check
    CHECK (char_length(btrim(delivery_notes)) BETWEEN 1 AND 500),
  -- A retry must not create a second purchase.
  CONSTRAINT orders_buyer_id_request_key_unique UNIQUE (buyer_id, request_key),
  CONSTRAINT orders_id_buyer_id_unique UNIQUE (id, buyer_id)
);

-- SECTION 4: Seller Orders

CREATE TABLE public.seller_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT seller_orders_seller_id_fk FOREIGN KEY (seller_id)
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT seller_orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  -- The repeated buyer ID must match the parent purchase.
  CONSTRAINT seller_orders_order_id_buyer_id_fk FOREIGN KEY (order_id, buyer_id)
    REFERENCES public.orders(id, buyer_id) ON DELETE RESTRICT,
  CONSTRAINT seller_orders_no_self_purchase
    CHECK (buyer_id <> seller_id),
  -- Each seller has one fulfillment per purchase.
  CONSTRAINT seller_orders_order_id_seller_id_unique UNIQUE (order_id, seller_id),
  CONSTRAINT seller_orders_id_seller_id_unique UNIQUE (id, seller_id)
);

CREATE TRIGGER seller_orders_updated_at BEFORE UPDATE ON public.seller_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SECTION 5: Order Items

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,

  CONSTRAINT order_items_quantity_check
    CHECK (quantity > 0 AND quantity <= 1000000),
  CONSTRAINT order_items_unit_check
    CHECK (unit IN ('kg', 'quintal')),
  CONSTRAINT order_items_product_name_check
    CHECK (char_length(btrim(product_name)) BETWEEN 3 AND 100),
  CONSTRAINT order_items_unit_price_check
    CHECK (unit_price > 0 AND unit_price <= 1000000),
  -- Both references must agree on the seller.
  CONSTRAINT order_items_seller_order_id_seller_id_fk FOREIGN KEY (seller_order_id, seller_id)
    REFERENCES public.seller_orders(id, seller_id) ON DELETE RESTRICT,
  CONSTRAINT order_items_product_id_seller_id_fk FOREIGN KEY (product_id, seller_id)
    REFERENCES public.products(id, seller_id) ON DELETE RESTRICT,
  CONSTRAINT order_items_seller_order_id_product_id_unique UNIQUE (seller_order_id, product_id)
);

-- Snapshot fields must be copied from locked product rows and remain immutable.
-- Compute rounded line subtotals from quantity * unit_price; shipping/taxes are absent.
-- Parent/child nonempty checks, retry-body matching, immutable IDs/snapshots,
-- and the following transitions belong in the later controlled write functions:
-- pending -> confirmed/cancelled; confirmed -> completed/cancelled; terminal otherwise.

-- SECTION 6: Essential Indexes

CREATE INDEX products_seller_created_idx
  ON public.products (seller_id, created_at DESC);

CREATE INDEX products_available_category_created_idx
  ON public.products (category, created_at DESC)
  WHERE listing_status = 'published' AND available_quantity > 0;

CREATE INDEX orders_buyer_created_idx
  ON public.orders (buyer_id, created_at DESC);

CREATE INDEX seller_orders_seller_created_idx
  ON public.seller_orders (seller_id, created_at DESC);

CREATE INDEX order_items_product_idx
  ON public.order_items (product_id);

-- SECTION 7: Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Start with explicit grants, regardless of project default privileges.
REVOKE ALL ON TABLE
  public.profiles,
  public.products,
  public.orders,
  public.seller_orders,
  public.order_items
FROM public, anon, authenticated;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.seller_orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT INSERT (id, full_name, mobile, city, district, state, pin_code)
  ON public.profiles TO authenticated;
GRANT UPDATE (full_name, mobile, city, district, state, pin_code)
  ON public.profiles TO authenticated;

CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY products_read_available ON public.products
  FOR SELECT TO anon, authenticated
  USING (listing_status = 'published' AND available_quantity > 0);

CREATE POLICY products_read_own ON public.products
  FOR SELECT TO authenticated
  USING (seller_id = (SELECT auth.uid()));

CREATE POLICY orders_read_buyer ON public.orders
  FOR SELECT TO authenticated
  USING (buyer_id = (SELECT auth.uid()));

CREATE POLICY seller_orders_read_participant ON public.seller_orders
  FOR SELECT TO authenticated
  USING (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()));

CREATE POLICY order_items_read_participant ON public.order_items
  FOR SELECT TO authenticated
  -- Follow the parent fulfillment to check who may read this item.
  USING (EXISTS (
    SELECT 1 FROM public.seller_orders
    WHERE seller_orders.id = order_items.seller_order_id
      AND (seller_orders.buyer_id = (SELECT auth.uid())
        OR seller_orders.seller_id = (SELECT auth.uid()))
  ));

-- No direct client product/order writes or deletes are granted. Later atomic
-- functions must enforce JWT-derived identity, ownership, locks, stock updates,
-- snapshot immutability, cancellation restocking exactly once and valid transitions.
-- Sellers intentionally cannot read the parent delivery/contact row yet: add a
-- narrowly scoped fulfillment query when its required fields are agreed.
-- Public seller names also need a narrow projection, never public profile access.
-- User-scoped Supabase calls use auth.uid(); service-role/privileged connections
-- may bypass RLS and must enforce authorization in Express/controlled functions.
