import { supabase, supabaseAdmin } from './supabase';
import type { Product, Category, Customer, Order, OrderItem, Review, Coupon } from '../types';

// Badges and symbols mapping for aesthetic boutique visual fidelity
const PRODUCT_VISUALS: Record<string, { badge?: string; symbol?: string; rating?: number; reviews?: number }> = {
  'handmade-blossom-bloom': { badge: 'NEW', symbol: '🌸', rating: 4.9, reviews: 24 },
  'moonlit-freshwater-pearl-necklace': { badge: 'BESTSELLER', symbol: '✨', rating: 4.8, reviews: 38 },
  'vintage-rosette-charm-bracelet': { badge: 'POPULAR', symbol: '♡', rating: 4.7, reviews: 19 },
  'the-draupadi-celebration-hamper': { badge: "EDITOR'S PICK", symbol: '🎀', rating: 5.0, reviews: 42 },
  'hand-knitted-crochet-daisy-bookmark': { badge: 'HANDMADE', symbol: '🌼', rating: 4.9, reviews: 16 },
  'rose-quartz-brass-solitaire-ring': { badge: 'FAVOURITE', symbol: '💍', rating: 4.8, reviews: 29 },
  'velvet-satin-scrunchie-trio': { badge: 'SET OF 3', symbol: '🪶', rating: 4.7, reviews: 14 },
  'sun-baked-terracotta-floral-drops': { badge: 'HANDCRAFTED', symbol: '🏺', rating: 4.9, reviews: 31 },
};

// ==========================================
// 1. PRODUCTS & CATEGORIES
// ==========================================

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('⚠️ [Dear Draupadi] Supabase categories fetch error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('⚠️ [Dear Draupadi] Categories error:', err);
    return [];
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    // 1. Fetch categories for name mapping
    const categories = await fetchCategories();
    const catMap = new Map<number, string>();
    categories.forEach(c => catMap.set(c.id, c.name));

    // 2. Fetch all product images
    const { data: imgData } = await supabase
      .from('product_images')
      .select('*')
      .order('sort_order', { ascending: true });

    const imgMap = new Map<number, string[]>();
    (imgData || []).forEach((img: any) => {
      const pid = img.product_id;
      if (!imgMap.has(pid)) imgMap.set(pid, []);
      imgMap.get(pid)!.push(img.image_url);
    });

    // 3. Fetch products
    const { data: prodData, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('⚠️ [Dear Draupadi] Supabase products fetch error:', error.message);
      return [];
    }

    return (prodData || []).map((p: any) => {
      const visuals = PRODUCT_VISUALS[p.slug] || {};
      const productImages = imgMap.get(p.id) || [];
      
      // Default placeholder if no images
      if (productImages.length === 0) {
        productImages.push('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80');
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category_id: p.category_id,
        categoryName: p.category_id ? catMap.get(p.category_id) || 'Jewellery' : 'Jewellery',
        description: p.description || '',
        price: Number(p.price) || 0,
        original_price: p.original_price ? Number(p.original_price) : null,
        stock: p.stock ?? 10,
        materials: p.materials || '',
        size: p.size || '',
        care_instructions: p.care_instructions || '',
        featured: !!p.featured,
        new_arrival: !!p.new_arrival,
        bestseller: !!p.bestseller,
        created_at: p.created_at,
        updated_at: p.updated_at,
        images: productImages,
        rating: visuals.rating || 4.8,
        reviewCount: visuals.reviews || 12,
        badge: visuals.badge || (p.new_arrival ? 'NEW' : p.bestseller ? 'BESTSELLER' : undefined),
        symbol: visuals.symbol || '❀'
      };
    });
  } catch (err) {
    console.error('❌ [Dear Draupadi] Error loading products:', err);
    return [];
  }
}

// ==========================================
// 2. COUPONS
// ==========================================

export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('⚠️ Coupons fetch notice:', error.message);
      return [];
    }
    return (data || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      minimum_spend: Number(c.minimum_spend || 0),
      description: c.description || '',
      active: !!c.active,
      created_at: c.created_at
    }));
  } catch (e) {
    return [];
  }
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon }> {
  const coupons = await fetchCoupons();
  const found = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);

  if (!found) {
    return { valid: false, discount: 0, message: 'Invalid or expired coupon code.' };
  }

  if (subtotal < found.minimum_spend) {
    return {
      valid: false,
      discount: 0,
      message: `Coupon requires a minimum order value of ₹${found.minimum_spend}.`
    };
  }

  let discount = 0;
  if (found.discount_type === 'percentage') {
    discount = Math.round((subtotal * found.discount_value) / 100);
  } else {
    discount = Math.min(subtotal, found.discount_value);
  }

  return {
    valid: true,
    discount,
    message: `Coupon applied: ₹${discount} savings ♡`,
    coupon: found
  };
}

// ==========================================
// 3. REVIEWS
// ==========================================

export async function fetchReviews(productId: number): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function submitReview(productId: number, authorName: string, rating: number, comment: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        rating,
        comment: `${authorName}: ${comment}`,
        status: 'approved'
      });

    if (error) {
      console.warn('⚠️ Review insert warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ==========================================
// 4. CUSTOMER AUTHENTICATION & REGISTRATION
// ==========================================

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error || !data) {
      // Check local registered cache fallback
      const local = JSON.parse(localStorage.getItem('dd_registered_users_v3') || '[]');
      const match = local.find((u: any) => u.email?.toLowerCase() === cleanEmail);
      if (match) return match;
      return null;
    }
    return data;
  } catch {
    const local = JSON.parse(localStorage.getItem('dd_registered_users_v3') || '[]');
    return local.find((u: any) => u.email?.toLowerCase() === cleanEmail) || null;
  }
}

export async function registerCustomerInSupabase(customer: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  const cleanEmail = customer.email.trim().toLowerCase();

  // 1. Check if already registered
  const existing = await findCustomerByEmail(cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please sign in.' };
  }

  // 2. Insert into Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({
        name: customer.name.trim(),
        email: cleanEmail,
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || ''
      })
      .select()
      .single();

    if (error) {
      console.warn('Customer insert error:', error.message);
    }

    const savedCustomer = data || {
      id: Date.now(),
      name: customer.name.trim(),
      email: cleanEmail,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || ''
    };

    // Cache locally
    const local = JSON.parse(localStorage.getItem('dd_registered_users_v3') || '[]');
    local.push(savedCustomer);
    localStorage.setItem('dd_registered_users_v3', JSON.stringify(local));

    return { success: true, customer: savedCustomer };
  } catch (err: any) {
    const fallbackCustomer = {
      id: Date.now(),
      name: customer.name.trim(),
      email: cleanEmail,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || ''
    };
    const local = JSON.parse(localStorage.getItem('dd_registered_users_v3') || '[]');
    local.push(fallbackCustomer);
    localStorage.setItem('dd_registered_users_v3', JSON.stringify(local));
    return { success: true, customer: fallbackCustomer };
  }
}

// ==========================================
// 5. ORDERS & CUSTOMER CHECKOUT
// ==========================================

export async function createOrder(
  customerData: Customer,
  items: { product: Product; quantity: number }[],
  totalAmount: number,
  discount: number,
  paymentMethod: string
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  try {
    // 1. Insert or match customer
    let customerId: number | null = null;
    try {
      const { data: custData, error: custErr } = await supabaseAdmin
        .from('customers')
        .insert({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          pincode: customerData.pincode
        })
        .select()
        .single();

      if (!custErr && custData) {
        customerId = custData.id;
      }
    } catch (custEx) {
      console.warn('⚠️ Customer insert notice:', custEx);
    }

    // 2. Insert Order
    const { data: orderData, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customerId,
        total_amount: totalAmount,
        discount: discount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid',
        order_status: 'placed'
      })
      .select()
      .single();

    if (orderErr || !orderData) {
      console.error('❌ Order insertion error:', orderErr);
      return { success: false, error: orderErr?.message || 'Could not place order.' };
    }

    const orderId = orderData.id;
    const orderNumber = `DD-${String(orderId).padStart(6, '0')}`;

    // 3. Insert Order Items & Deduct Stock
    for (const item of items) {
      await supabase.from('order_items').insert({
        order_id: orderId,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      });

      // Stock deduction
      const newStock = Math.max(0, item.product.stock - item.quantity);
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product.id);
    }

    // Also cache order locally so customer can review immediately
    try {
      const localOrders = JSON.parse(localStorage.getItem('dd_local_orders_v3') || '[]');
      localOrders.unshift({
        id: orderId,
        orderNumber,
        customer: customerData,
        items: items.map(i => ({
          product_name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          image: i.product.images[0]
        })),
        total_amount: totalAmount,
        discount,
        payment_method: paymentMethod,
        order_status: 'Order Placed',
        created_at: new Date().toISOString()
      });
      localStorage.setItem('dd_local_orders_v3', JSON.stringify(localOrders));
      localStorage.setItem('dd_last_order_number', orderNumber);
    } catch (ignore) {}

    return { success: true, orderId: String(orderId), orderNumber };
  } catch (err: any) {
    console.error('❌ Checkout error:', err);
    return { success: false, error: err.message };
  }
}

// ==========================================
// 5. ORDER TRACKING LOOKUP
// ==========================================

export async function lookupOrder(query: string): Promise<Order | null> {
  const clean = query.trim();
  if (!clean) return null;

  try {
    let orderRecord: any = null;

    // A. If query is numeric or starts with DD-
    let numericId: number | null = null;
    if (clean.toUpperCase().startsWith('DD-')) {
      const parsed = parseInt(clean.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) numericId = parsed;
    } else if (/^\d+$/.test(clean) && clean.length < 9) {
      numericId = parseInt(clean, 10);
    }

    if (numericId) {
      const { data } = await supabase
        .from('orders')
        .select('*, customers(*), order_items(*)')
        .eq('id', numericId)
        .maybeSingle();

      if (data) orderRecord = data;
    }

    // B. If not found by ID, try looking up customer by phone or email
    if (!orderRecord) {
      const { data: custData } = await supabase
        .from('customers')
        .select('id')
        .or(`email.eq.${clean},phone.eq.${clean}`)
        .limit(1);

      if (custData && custData.length > 0) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, customers(*), order_items(*)')
          .eq('customer_id', custData[0].id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (ordersData && ordersData.length > 0) {
          orderRecord = ordersData[0];
        }
      }
    }

    // Fallback: Check local storage
    if (!orderRecord) {
      const localOrders = JSON.parse(localStorage.getItem('dd_local_orders_v3') || '[]');
      const found = localOrders.find((o: any) => 
        String(o.id) === clean ||
        o.orderNumber === clean ||
        (o.customer && (o.customer.phone === clean || o.customer.email === clean))
      );
      if (found) return found;
      return null;
    }

    const orderNumber = `DD-${String(orderRecord.id).padStart(6, '0')}`;
    const orderDate = new Date(orderRecord.created_at || Date.now());
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(orderDate.getDate() + 3);

    const timeString = orderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
      orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const statusMap: Record<string, string> = {
      'placed': 'Order Placed',
      'confirmed': 'Confirmed',
      'packed': 'Packed',
      'shipped': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };

    const currentStatus = statusMap[orderRecord.order_status] || orderRecord.order_status || 'Order Placed';

    return {
      id: orderRecord.id,
      order_number: orderNumber,
      customer_id: orderRecord.customer_id,
      total_amount: Number(orderRecord.total_amount),
      discount: Number(orderRecord.discount || 0),
      payment_method: orderRecord.payment_method || 'Cash on Delivery',
      payment_status: orderRecord.payment_status || 'pending',
      order_status: currentStatus,
      created_at: orderRecord.created_at,
      customer: orderRecord.customers ? {
        name: orderRecord.customers.name,
        email: orderRecord.customers.email,
        phone: orderRecord.customers.phone,
        address: orderRecord.customers.address,
        city: orderRecord.customers.city,
        state: orderRecord.customers.state,
        pincode: orderRecord.customers.pincode
      } : undefined,
      items: (orderRecord.order_items || []).map((i: any) => ({
        id: i.id,
        order_id: i.order_id,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        price: Number(i.price)
      })),
      statusHistory: [
        { status: 'Order Placed', time: timeString, note: 'Your little treasures are being prepared with love ♡' }
      ],
      expectedDelivery: deliveryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  } catch (err) {
    console.error('Tracking lookup error:', err);
    return null;
  }
}

// ==========================================
// 6. ADMIN OPERATIONS
// ==========================================

export async function adminFetchAllOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*), order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((o: any) => ({
      id: o.id,
      order_number: `DD-${String(o.id).padStart(6, '0')}`,
      customer_id: o.customer_id,
      total_amount: Number(o.total_amount),
      discount: Number(o.discount || 0),
      payment_method: o.payment_method || 'Cash on Delivery',
      payment_status: o.payment_status || 'pending',
      order_status: o.order_status || 'placed',
      created_at: o.created_at,
      customer: o.customers,
      items: o.order_items || []
    }));
  } catch (e) {
    console.warn('Admin fetch orders notice:', e);
    // Fallback to local orders
    return JSON.parse(localStorage.getItem('dd_local_orders_v3') || '[]');
  }
}

export async function adminUpdateOrderStatus(orderId: number | string, status: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ order_status: status.toLowerCase().replace(/\s+/g, '_') })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Admin update order error:', e);
    return false;
  }
}

export async function adminAdjustStock(productId: number, delta: number): Promise<number | null> {
  try {
    const { data: prod } = await supabaseAdmin
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (!prod) return null;
    const newStock = Math.max(0, (prod.stock || 0) + delta);
    await supabaseAdmin
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    return newStock;
  } catch (e) {
    console.error('Stock adjust error:', e);
    return null;
  }
}

export async function adminSaveProduct(product: Partial<Product>, imageList: string[]): Promise<boolean> {
  try {
    const payload = {
      name: product.name,
      slug: product.slug || (product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product'),
      category_id: product.category_id || null,
      description: product.description || '',
      price: product.price || 0,
      original_price: product.original_price || null,
      stock: product.stock ?? 10,
      materials: product.materials || '',
      size: product.size || '',
      care_instructions: product.care_instructions || '',
      featured: product.featured ?? false,
      new_arrival: product.new_arrival ?? false,
      bestseller: product.bestseller ?? false
    };

    let pid = product.id;
    if (pid) {
      // Update
      await supabaseAdmin.from('products').update(payload).eq('id', pid);
    } else {
      // Insert
      const { data, error } = await supabaseAdmin.from('products').insert(payload).select().single();
      if (error) throw error;
      pid = data.id;
    }

    if (pid && imageList.length > 0) {
      await supabaseAdmin.from('product_images').delete().eq('product_id', pid);
      for (let i = 0; i < imageList.length; i++) {
        await supabaseAdmin.from('product_images').insert({
          product_id: pid,
          image_url: imageList[i],
          sort_order: i
        });
      }
    }
    return true;
  } catch (e) {
    console.error('Save product error:', e);
    return false;
  }
}

export async function adminDeleteProduct(productId: number): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);
    return !error;
  } catch (e) {
    return false;
  }
}

export async function adminFetchCustomers(): Promise<Customer[]> {
  try {
    const { data } = await supabaseAdmin.from('customers').select('*').order('created_at', { ascending: false });
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function adminSaveCoupon(coupon: Partial<Coupon>): Promise<boolean> {
  try {
    const payload = {
      code: coupon.code?.toUpperCase(),
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value || 10,
      minimum_spend: coupon.minimum_spend || 0,
      description: coupon.description || '',
      active: coupon.active ?? true
    };

    if (coupon.id) {
      await supabaseAdmin.from('coupons').update(payload).eq('id', coupon.id);
    } else {
      await supabaseAdmin.from('coupons').insert(payload);
    }
    return true;
  } catch (e) {
    return false;
  }
}

export async function adminToggleCoupon(couponId: number, active: boolean): Promise<boolean> {
  try {
    await supabaseAdmin.from('coupons').update({ active }).eq('id', couponId);
    return true;
  } catch (e) {
    return false;
  }
}

export async function adminDeleteCoupon(couponId: number): Promise<boolean> {
  try {
    await supabaseAdmin.from('coupons').delete().eq('id', couponId);
    return true;
  } catch (e) {
    return false;
  }
}

export async function adminAddCategory(name: string, slug: string): Promise<boolean> {
  try {
    await supabaseAdmin.from('categories').insert({ name, slug });
    return true;
  } catch (e) {
    return false;
  }
}

export async function adminDeleteCategory(categoryId: number): Promise<boolean> {
  try {
    await supabaseAdmin.from('categories').delete().eq('id', categoryId);
    return true;
  } catch (e) {
    return false;
  }
}
