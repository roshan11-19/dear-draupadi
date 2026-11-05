import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Category, CartItem, CustomerSession, ToastMessage, Order } from '../types';
import { fetchProducts, fetchCategories, validateCoupon } from '../lib/db';

interface AppliedCoupon {
  code: string;
  discount: number;
  description?: string;
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  sortOrder: string;
  setSortOrder: (sort: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartTotal: number;
  appliedCoupon: AppliedCoupon | null;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: number, delta: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  
  // Wishlist
  wishlist: number[];
  wishlistCount: number;
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;

  // UI Modals & Drawers
  activeProduct: Product | null;
  openProductModal: (product: Product) => void;
  closeProductModal: () => void;
  
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;

  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  isTrackingOpen: boolean;
  openTracking: () => void;
  closeTracking: () => void;

  isAuthOpen: boolean;
  openAuthModal: (contextText?: string) => void;
  closeAuthModal: () => void;
  authNotice: string | null;

  isAccountOpen: boolean;
  openCustomerAccount: () => void;
  closeCustomerAccount: () => void;
  openAuthOrAccount: () => void;

  isCheckoutActive: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;

  lastOrder: Order | null;
  setLastOrder: (order: Order | null) => void;
  isOrderSuccessOpen: boolean;
  closeOrderSuccess: () => void;

  // Customer & Admin Session
  customerSession: CustomerSession | null;
  setCustomerSession: (session: CustomerSession | null) => void;
  logoutCustomer: () => void;
  
  adminSession: { authenticated: boolean; email?: string };
  loginAdmin: (email: string) => void;
  logoutAdmin: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  
  refreshCatalog: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dd_cart_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem('dd_coupon_v3');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('dd_wishlist_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [isCheckoutActive, setIsCheckoutActive] = useState<boolean>(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState<boolean>(false);

  // Sessions
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => {
    try {
      const saved = localStorage.getItem('dd_cust_sess_v3');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminSession, setAdminSession] = useState<{ authenticated: boolean; email?: string }>(() => {
    try {
      const saved = localStorage.getItem('dd_admin_sess_v3');
      return saved ? JSON.parse(saved) : { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Load from Supabase on mount
  const refreshCatalog = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.warn('Catalog refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('dd_cart_v3', JSON.stringify(cart));
  }, [cart]);

  // Save Wishlist to LocalStorage
  useEffect(() => {
    localStorage.setItem('dd_wishlist_v3', JSON.stringify(wishlist));
  }, [wishlist]);

  // Save Sessions
  useEffect(() => {
    if (customerSession) {
      localStorage.setItem('dd_cust_sess_v3', JSON.stringify(customerSession));
    } else {
      localStorage.removeItem('dd_cust_sess_v3');
    }
  }, [customerSession]);

  useEffect(() => {
    localStorage.setItem('dd_admin_sess_v3', JSON.stringify(adminSession));
  }, [adminSession]);

  // Cart Calculations
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? Math.min(cartSubtotal, appliedCoupon.discount) : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${quantity} × ${product.name} to cart ♡`);
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((i): i is CartItem => i !== null);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Removed item from cart.');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('dd_coupon_v3');
  };

  const applyCouponCode = async (code: string) => {
    if (!code.trim()) {
      return { success: false, message: 'Please enter a coupon code.' };
    }
    const result = await validateCoupon(code, cartSubtotal);
    if (result.valid) {
      const couponObj = {
        code: code.trim().toUpperCase(),
        discount: result.discount,
        description: result.coupon?.description
      };
      setAppliedCoupon(couponObj);
      localStorage.setItem('dd_coupon_v3', JSON.stringify(couponObj));
      showToast(result.message);
      return { success: true, message: result.message };
    } else {
      showToast(result.message, 'error');
      return { success: false, message: result.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('dd_coupon_v3');
    showToast('Coupon removed.');
  };

  // Wishlist
  const wishlistCount = wishlist.length;

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        showToast('Removed from your wishlist.');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Saved to your wishlist ♡');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: number) => wishlist.includes(productId);

  // Modal actions
  const openProductModal = (product: Product) => setActiveProduct(product);
  const closeProductModal = () => setActiveProduct(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const openTracking = () => setIsTrackingOpen(true);
  const closeTracking = () => setIsTrackingOpen(false);

  const openAuthModal = (noticeText?: string) => {
    setAuthNotice(noticeText || null);
    setIsAuthOpen(true);
  };
  const closeAuthModal = () => {
    setAuthNotice(null);
    setIsAuthOpen(false);
  };

  const openCustomerAccount = () => setIsAccountOpen(true);
  const closeCustomerAccount = () => setIsAccountOpen(false);

  const openAuthOrAccount = () => {
    if (customerSession) {
      openCustomerAccount();
    } else {
      openAuthModal();
    }
  };

  const openCheckout = () => {
    closeCart();
    setIsCheckoutActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeCheckout = () => setIsCheckoutActive(false);

  const closeOrderSuccess = () => {
    setIsOrderSuccessOpen(false);
    setLastOrder(null);
  };

  const logoutCustomer = () => {
    setCustomerSession(null);
    closeCustomerAccount();
    showToast('Signed out of customer account.');
  };

  const loginAdmin = (email: string) => {
    setAdminSession({ authenticated: true, email });
    showToast('Welcome to Dear Draupadi Admin Portal.');
  };

  const logoutAdmin = () => {
    setAdminSession({ authenticated: false });
    showToast('Admin logged out.');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        isLoading,
        activeCategory,
        setActiveCategory,
        sortOrder,
        setSortOrder,
        searchQuery,
        setSearchQuery,
        cart,
        cartCount,
        cartSubtotal,
        cartTotal,
        appliedCoupon,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyCouponCode,
        removeCoupon,
        wishlist,
        wishlistCount,
        toggleWishlist,
        isInWishlist,
        activeProduct,
        openProductModal,
        closeProductModal,
        isCartOpen,
        openCart,
        closeCart,
        isWishlistOpen,
        openWishlist,
        closeWishlist,
        isSearchOpen,
        openSearch,
        closeSearch,
        isTrackingOpen,
        openTracking,
        closeTracking,
        isAuthOpen,
        openAuthModal,
        closeAuthModal,
        authNotice,
        isAccountOpen,
        openCustomerAccount,
        closeCustomerAccount,
        openAuthOrAccount,
        isCheckoutActive,
        openCheckout,
        closeCheckout,
        lastOrder,
        setLastOrder: (o) => {
          setLastOrder(o);
          if (o) setIsOrderSuccessOpen(true);
        },
        isOrderSuccessOpen,
        closeOrderSuccess,
        customerSession,
        setCustomerSession,
        logoutCustomer,
        adminSession,
        loginAdmin,
        logoutAdmin,
        toasts,
        showToast,
        refreshCatalog
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
