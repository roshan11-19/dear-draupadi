export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
}

export interface ProductImage {
  id?: number;
  product_id: number;
  image_url: string;
  sort_order?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category_id?: number | null;
  categoryName?: string;
  description: string;
  price: number;
  original_price?: number | null;
  stock: number;
  materials?: string;
  size?: string;
  care_instructions?: string;
  featured?: boolean;
  new_arrival?: boolean;
  bestseller?: boolean;
  created_at?: string;
  updated_at?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  badge?: string;
  symbol?: string;
}

export interface Customer {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  created_at?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  price: number;
  image?: string;
  category?: string;
}

export interface OrderStatusHistoryItem {
  status: string;
  time: string;
  note: string;
}

export interface Order {
  id: string | number;
  order_number?: string;
  customer_id?: number | null;
  total_amount: number;
  discount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at?: string;
  customer?: Customer;
  items: OrderItem[];
  statusHistory?: OrderStatusHistoryItem[];
  expectedDelivery?: string;
}

export interface Review {
  id?: number;
  product_id: number;
  customer_id?: number | null;
  author_name?: string;
  rating: number;
  comment: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at?: string;
}

export interface Coupon {
  id?: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_spend: number;
  description?: string;
  active: boolean;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  productId: number;
  addedAt: string;
}

export interface CustomerSession {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  joinedDate?: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'error';
}
