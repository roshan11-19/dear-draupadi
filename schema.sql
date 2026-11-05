-- ==========================================================
-- Dear Draupadi - Complete PostgreSQL Database Schema & RLS
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. CATEGORIES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 2. PRODUCTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    stock INTEGER DEFAULT 0,
    materials TEXT,
    size TEXT,
    care_instructions TEXT,
    featured BOOLEAN DEFAULT false,
    new_arrival BOOLEAN DEFAULT false,
    bestseller BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 3. PRODUCT IMAGES TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 4. CUSTOMERS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 5. ORDERS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'placed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 6. ORDER ITEMS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL
);

-- ==========================================================
-- 7. REVIEWS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES public.customers(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 8. COUPONS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    minimum_spend NUMERIC DEFAULT 0,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures storefront visitors (anon role) can read data
-- ==========================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 1. Categories: Public can read
DROP POLICY IF EXISTS "Allow public read on categories" ON public.categories;
CREATE POLICY "Allow public read on categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Products: Public can read
DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
CREATE POLICY "Allow public read on products"
ON public.products FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Product Images: Public can read
DROP POLICY IF EXISTS "Allow public read on product_images" ON public.product_images;
CREATE POLICY "Allow public read on product_images"
ON public.product_images FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Reviews: Public can read approved reviews & submit new reviews
DROP POLICY IF EXISTS "Allow public read on reviews" ON public.reviews;
CREATE POLICY "Allow public read on reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (status = 'approved' OR status IS NULL);

DROP POLICY IF EXISTS "Allow public insert on reviews" ON public.reviews;
CREATE POLICY "Allow public insert on reviews"
ON public.reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. Coupons: Public can read active coupons
DROP POLICY IF EXISTS "Allow public read on coupons" ON public.coupons;
CREATE POLICY "Allow public read on coupons"
ON public.coupons FOR SELECT
TO anon, authenticated
USING (active = true);

-- 6. Customers: Public can insert their own customer details during checkout
DROP POLICY IF EXISTS "Allow public insert on customers" ON public.customers;
CREATE POLICY "Allow public insert on customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 7. Orders & Order Items: Public can place orders and track orders
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
CREATE POLICY "Allow public select on orders"
ON public.orders FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
CREATE POLICY "Allow public insert on order_items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on order_items" ON public.order_items;
CREATE POLICY "Allow public select on order_items"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (true);

-- 8. Products: Allow update for stock synchronization
DROP POLICY IF EXISTS "Allow public update on products" ON public.products;
CREATE POLICY "Allow public update on products"
ON public.products FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ==========================================================
-- STOREFRONT & ADMIN ATOMIC RPC FUNCTIONS
-- Safe transaction handling with row-level locking (FOR UPDATE)
-- ==========================================================

-- Atomic Order Placement RPC Function
CREATE OR REPLACE FUNCTION public.place_order_atomic(
    p_customer JSONB,
    p_shipping JSONB,
    p_items JSONB,
    p_pricing JSONB,
    p_payment_method TEXT DEFAULT 'Cash on Delivery'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id INTEGER;
    v_order_id INTEGER;
    v_item JSONB;
    v_product_id INTEGER;
    v_product_name TEXT;
    v_quantity INTEGER;
    v_price NUMERIC;
    v_current_stock INTEGER;
    v_total NUMERIC;
    v_discount NUMERIC;
    v_res JSONB;
    v_updated_products JSONB := '[]'::JSONB;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item.';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF v_item ? 'product_id' OR v_item ? 'id' THEN
            BEGIN
                v_product_id := (COALESCE(v_item->>'product_id', v_item->>'id'))::INTEGER;
            EXCEPTION WHEN OTHERS THEN
                v_product_id := NULL;
            END;

            IF v_product_id IS NOT NULL THEN
                v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 1);

                SELECT stock, name INTO v_current_stock, v_product_name
                FROM public.products
                WHERE id = v_product_id
                FOR UPDATE;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Product with ID % not found.', v_product_id;
                END IF;

                IF v_current_stock < v_quantity THEN
                    RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %',
                        v_product_name, v_current_stock, v_quantity;
                END IF;

                UPDATE public.products
                SET stock = stock - v_quantity,
                    updated_at = NOW()
                WHERE id = v_product_id;

                v_updated_products := v_updated_products || jsonb_build_object(
                    'id', v_product_id,
                    'name', v_product_name,
                    'new_stock', v_current_stock - v_quantity
                );
            END IF;
        END IF;

        IF (v_item->>'isHamper')::BOOLEAN IS TRUE AND v_item ? 'hamperItems' AND jsonb_typeof(v_item->'hamperItems') = 'array' THEN
            DECLARE
                v_hamper_item JSONB;
                v_h_product_id INTEGER;
                v_h_qty INTEGER;
                v_parent_qty INTEGER := COALESCE((v_item->>'quantity')::INTEGER, 1);
            BEGIN
                FOR v_hamper_item IN SELECT * FROM jsonb_array_elements(v_item->'hamperItems')
                LOOP
                    BEGIN
                        v_h_product_id := (COALESCE(v_hamper_item->>'productId', v_hamper_item->>'id'))::INTEGER;
                    EXCEPTION WHEN OTHERS THEN
                        v_h_product_id := NULL;
                    END;

                    IF v_h_product_id IS NOT NULL THEN
                        v_h_qty := COALESCE((v_hamper_item->>'quantity')::INTEGER, 1) * v_parent_qty;

                        SELECT stock, name INTO v_current_stock, v_product_name
                        FROM public.products
                        WHERE id = v_h_product_id
                        FOR UPDATE;

                        IF NOT FOUND THEN
                            RAISE EXCEPTION 'Hamper component with ID % not found.', v_h_product_id;
                        END IF;

                        IF v_current_stock < v_h_qty THEN
                            RAISE EXCEPTION 'Insufficient stock for hamper component "%". Available: %, Requested: %',
                                v_product_name, v_current_stock, v_h_qty;
                        END IF;

                        UPDATE public.products
                        SET stock = stock - v_h_qty,
                            updated_at = NOW()
                        WHERE id = v_h_product_id;

                        v_updated_products := v_updated_products || jsonb_build_object(
                            'id', v_h_product_id,
                            'name', v_product_name,
                            'new_stock', v_current_stock - v_h_qty
                        );
                    END IF;
                END LOOP;
            END;
        END IF;
    END LOOP;

    IF p_customer ? 'email' AND p_customer->>'email' IS NOT NULL AND trim(p_customer->>'email') <> '' THEN
        SELECT id INTO v_customer_id
        FROM public.customers
        WHERE lower(email) = lower(trim(p_customer->>'email'))
        LIMIT 1;

        IF v_customer_id IS NOT NULL THEN
            UPDATE public.customers
            SET name = COALESCE(p_customer->>'name', name),
                phone = COALESCE(p_customer->>'phone', phone),
                address = COALESCE(p_shipping->>'address', address),
                city = COALESCE(p_shipping->>'city', city),
                state = COALESCE(p_shipping->>'state', state),
                pincode = COALESCE(p_shipping->>'pincode', pincode)
            WHERE id = v_customer_id;
        ELSE
            INSERT INTO public.customers (name, email, phone, address, city, state, pincode)
            VALUES (
                COALESCE(p_customer->>'name', 'Valued Customer'),
                lower(trim(p_customer->>'email')),
                p_customer->>'phone',
                p_shipping->>'address',
                p_shipping->>'city',
                p_shipping->>'state',
                p_shipping->>'pincode'
            )
            RETURNING id INTO v_customer_id;
        END IF;
    ELSE
        INSERT INTO public.customers (name, email, phone, address, city, state, pincode)
        VALUES (
            COALESCE(p_customer->>'name', 'Valued Customer'),
            p_customer->>'email',
            p_customer->>'phone',
            p_shipping->>'address',
            p_shipping->>'city',
            p_shipping->>'state',
            p_shipping->>'pincode'
        )
        RETURNING id INTO v_customer_id;
    END IF;

    v_total := COALESCE((p_pricing->>'total')::NUMERIC, 0);
    v_discount := COALESCE((p_pricing->>'discount')::NUMERIC, 0);

    INSERT INTO public.orders (
        customer_id,
        total_amount,
        discount,
        payment_method,
        payment_status,
        order_status,
        created_at
    )
    VALUES (
        v_customer_id,
        v_total,
        v_discount,
        p_payment_method,
        CASE WHEN p_payment_method = 'Cash on Delivery' THEN 'pending' ELSE 'paid' END,
        'placed',
        NOW()
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            v_product_id := (COALESCE(v_item->>'product_id', v_item->>'id'))::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            v_product_id := NULL;
        END;

        v_product_name := COALESCE(v_item->>'name', 'Artisan Creation');
        v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 1);
        v_price := COALESCE((v_item->>'price')::NUMERIC, 0);

        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            price
        )
        VALUES (
            v_order_id,
            v_product_id,
            v_product_name,
            v_quantity,
            v_price
        );
    END LOOP;

    v_res := jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'customer_id', v_customer_id,
        'total_amount', v_total,
        'updated_products', v_updated_products
    );

    RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order_atomic(JSONB, JSONB, JSONB, JSONB, TEXT) TO anon, authenticated;

-- Atomic Admin Stock Update RPC
CREATE OR REPLACE FUNCTION public.update_product_stock_admin(
    p_product_id INTEGER,
    p_new_stock INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_stock INTEGER;
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, p_new_stock),
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock INTO v_updated_stock;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found.', p_product_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', p_product_id,
        'stock', v_updated_stock
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_product_stock_admin(INTEGER, INTEGER) TO anon, authenticated;


