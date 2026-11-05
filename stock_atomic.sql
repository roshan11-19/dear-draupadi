-- ==========================================================
-- Dear Draupadi - Atomic Stock Reservation & Order Placement RPC
-- Run this script in Supabase Dashboard -> SQL Editor
-- ==========================================================

-- 1. Enable UPDATE on products table for anon & authenticated roles
DROP POLICY IF EXISTS "Allow public update on products" ON public.products;
CREATE POLICY "Allow public update on products"
ON public.products FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. Atomic Order Placement RPC Function with Row-Level Locking (FOR UPDATE)
-- This function executes in a single PostgreSQL transaction.
-- It locks each product row, verifies available stock, decrements stock atomically,
-- creates the customer and order, and inserts order items.
-- If any product has insufficient stock, it aborts and rolls back completely.
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
    -- Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item.';
    END IF;

    -- Validate and lock stock for each item in the order
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Check regular product or direct product ID
        IF v_item ? 'product_id' OR v_item ? 'id' THEN
            BEGIN
                v_product_id := (COALESCE(v_item->>'product_id', v_item->>'id'))::INTEGER;
            EXCEPTION WHEN OTHERS THEN
                v_product_id := NULL;
            END;

            IF v_product_id IS NOT NULL THEN
                v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 1);

                -- Row-level locking to prevent race conditions on last unit
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

                -- Atomically deduct stock
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

        -- Check if item is a hamper with components
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

    -- Upsert or locate customer
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

    -- Insert Order
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

    -- Insert Order Items
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

-- 3. Atomic Admin Stock Update RPC
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
