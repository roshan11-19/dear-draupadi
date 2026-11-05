import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartTotal,
    appliedCoupon,
    isCartOpen,
    closeCart,
    updateCartQuantity,
    removeFromCart,
    applyCouponCode,
    removeCoupon,
    openCheckout,
    customerSession,
    openAuthModal
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApply = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await applyCouponCode(couponInput);
    setCouponLoading(false);
    setCouponInput('');
  };

  const handleProceedToCheckout = () => {
    if (!customerSession) {
      closeCart();
      openAuthModal('Please sign in or create an account to proceed with your checkout ♡');
      return;
    }
    openCheckout();
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="drawer-overlay active"
        onClick={closeCart}
      />
      <aside className={`drawer ${isCartOpen ? 'active' : ''}`}>
        <div className="drawer-header">
          <div>
            <p className="section-label" style={{ marginBottom: '4px' }}>Your little treasures</p>
            <h2>Your Cart</h2>
          </div>
          <button className="drawer-close-btn" onClick={closeCart} aria-label="Close cart">×</button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-drawer">
              <div className="empty-drawer-symbol">♡</div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't picked your little treasures yet.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  closeCart();
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <div>
              {cart.map(item => (
                <div key={item.product.id} className="drawer-item">
                  <img
                    src={item.product.images?.[0] || ''}
                    alt={item.product.name}
                    className="drawer-item-img"
                  />
                  <div className="drawer-item-info">
                    <h4 className="drawer-item-title">{item.product.name}</h4>
                    <div className="drawer-item-price">₹{item.product.price}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="drawer-qty-controls">
                        <button onClick={() => updateCartQuantity(item.product.id, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.product.id, 1)}>+</button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        style={{ fontSize: '11px', color: 'var(--soft-brown)', textDecoration: 'underline' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            {/* Coupon Box */}
            <div className="coupon-box">
              <input
                type="text"
                placeholder="COUPON (e.g. DRAUPADI10)"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
              />
              <button onClick={handleApply} disabled={couponLoading}>
                {couponLoading ? '...' : 'APPLY'}
              </button>
            </div>

            {appliedCoupon && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(49, 93, 90, 0.08)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '12px',
                fontSize: '11px',
                color: 'var(--teal)'
              }}>
                <span>✂️ Code: <strong>{appliedCoupon.code}</strong> (−₹{appliedCoupon.discount})</span>
                <button onClick={removeCoupon} style={{ color: 'var(--terracotta)', fontWeight: 'bold' }}>✕</button>
              </div>
            )}

            <div className="drawer-summary-row">
              <span>Subtotal</span>
              <span>₹{cartSubtotal}</span>
            </div>

            {appliedCoupon && (
              <div className="drawer-summary-row" style={{ color: 'var(--terracotta)' }}>
                <span>Coupon Discount</span>
                <span>−₹{appliedCoupon.discount}</span>
              </div>
            )}

            <div className="drawer-summary-row">
              <span>Boutique Delivery</span>
              <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>FREE</span>
            </div>

            <div className="drawer-summary-total">
              <span>Total</span>
              <span>₹{cartTotal}</span>
            </div>

            <button className="btn-checkout" onClick={handleProceedToCheckout}>
              PROCEED TO CHECKOUT →
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--soft-brown)', marginTop: '12px' }}>
              Handmade with love ♡
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
