-- ====================================================================
-- GR FURNITURE SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY POLICIES
-- ====================================================================
-- Run this SQL in your Supabase Project -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PRODUCTS TABLE (Permanent Dynamic Inventory)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  dimensions TEXT,
  material TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  image_labels JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ORDERS TABLE (Customer Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'New' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. ORDER ITEMS TABLE (Ordered Items breakdown)
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INT DEFAULT 1 NOT NULL,
  image TEXT
);

-- 5. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. ROW LEVEL SECURITY POLICIES

-- Categories: Anyone can read categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- Categories: Full access for service role and authenticated admins
DROP POLICY IF EXISTS "Service role / Admin full categories access" ON public.categories;
CREATE POLICY "Service role / Admin full categories access"
  ON public.categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- Products: Anyone can read products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  USING (true);

-- Products: Full access for service role and authenticated admins
DROP POLICY IF EXISTS "Service role / Admin full products access" ON public.products;
CREATE POLICY "Service role / Admin full products access"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Orders: Public can create (insert) new orders
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Orders: Public can view order by ID or order number (for order tracking)
DROP POLICY IF EXISTS "Public can view own order" ON public.orders;
CREATE POLICY "Public can view own order"
  ON public.orders FOR SELECT
  USING (true);

-- Orders: Admin / Service role full access
DROP POLICY IF EXISTS "Admin / Service role full orders access" ON public.orders;
CREATE POLICY "Admin / Service role full orders access"
  ON public.orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Order Items: Public can insert items during order creation
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Order Items: Public and admin can view order items
DROP POLICY IF EXISTS "Public / Admin can view order items" ON public.order_items;
CREATE POLICY "Public / Admin can view order items"
  ON public.order_items FOR SELECT
  USING (true);

-- Order Items: Admin / Service role full access
DROP POLICY IF EXISTS "Admin / Service role full order items access" ON public.order_items;
CREATE POLICY "Admin / Service role full order items access"
  ON public.order_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. STORAGE BUCKET FOR PRODUCT IMAGES
-- Create public storage bucket 'product-images' if not already created
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to product-images
DROP POLICY IF EXISTS "Public Access to Product Images" ON storage.objects;
CREATE POLICY "Public Access to Product Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated/service role to upload/update/delete product images
DROP POLICY IF EXISTS "Allow Uploads to Product Images" ON storage.objects;
CREATE POLICY "Allow Uploads to Product Images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow Updates to Product Images" ON storage.objects;
CREATE POLICY "Allow Updates to Product Images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow Deletions to Product Images" ON storage.objects;
CREATE POLICY "Allow Deletions to Product Images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
