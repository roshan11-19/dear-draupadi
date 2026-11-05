import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { createOrder } from '../lib/db';
import type { Customer } from '../types';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartTotal,
    appliedCoupon,
    closeCheckout,
    clearCart,
    setLastOrder,
    customerSession,
    openAuthModal,
    showToast,
    refreshCatalog
  } = useStore();

  const [customer, setCustomer] = useState<Customer>({
    name: customerSession?.name || '',
    email: customerSession?.email || '',
    phone: customerSession?.phone || '',
    address: customerSession?.address || '',
    city: customerSession?.city || '',
    state: customerSession?.state || '',
    pincode: customerSession?.pincode || ''
  });

  // Sync customer details whenever customerSession changes
  useEffect(() => {
    if (customerSession) {
      setCustomer({
        name: customerSession.name || '',
        email: customerSession.email || '',
        phone: customerSession.phone || '',
        address: customerSession.address || '',
        city: customerSession.city || '',
        state: customerSession.state || '',
        pincode: customerSession.pincode || ''
      });
    }
  }, [customerSession]);

  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI' | 'Card'>('Cash on Delivery');
  const [submitting, setSubmitting] = useState(false);

  // Authentication Guard: Only logged in customers can checkout!
  if (!customerSession) {
    return (
      <section className="checkout-section">
        <div style={{
          maxWidth: '540px',
          margin: '60px auto',
          textAlign: 'center',
          background: 'var(--ivory)',
          padding: '48px 36px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ fontSize: '48px', color: 'var(--terracotta)', marginBottom: '16px' }}>🔒</div>
          <p className="section-label">Account Verification Required</p>
          <h2 style={{ fontSize: '28px', color: 'var(--brown)', fontWeight: 400, marginBottom: '12px' }}>
            Please sign in to buy
          </h2>
          <p style={{ color: 'var(--soft-brown)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
            To ensure secure order processing and delivery tracking of your handmade treasures, customer login is required. Only registered emails can sign in.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn-primary"
              onClick={() => openAuthModal('Please sign in with your registered email or create an account to proceed ♡')}
            >
              SIGN IN / REGISTER TO BUY →
            </button>
            <button
              className="btn-secondary"
              onClick={closeCheckout}
            >
              ← RETURN TO SHOPPING
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }

    if (!customer.name || !customer.phone || !customer.address || !customer.pincode) {
      showToast('Please fill all required delivery details.', 'error');
      return;
    }

    setSubmitting(true);
    const discount = appliedCoupon ? appliedCoupon.discount : 0;

    const res = await createOrder(customer, cart, cartTotal, discount, paymentMethod);
    setSubmitting(false);

    if (res.success && res.orderNumber) {
      const orderDate = new Date();
      const deliveryDate = new Date();
      deliveryDate.setDate(orderDate.getDate() + 3);

      const placedOrderObj = {
        id: res.orderId || res.orderNumber,
        order_number: res.orderNumber,
        total_amount: cartTotal,
        discount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid (demo)',
        order_status: 'Order Placed',
        created_at: orderDate.toISOString(),
        customer,
        items: cart.map(i => ({
          product_name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          image: i.product.images[0]
        })),
        expectedDelivery: deliveryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      clearCart();
      closeCheckout();
      setLastOrder(placedOrderObj);
      showToast(`Order placed successfully! ${res.orderNumber} ♡`);
      refreshCatalog();
    } else {
      showToast(res.error || 'Could not place order. Please check connection.', 'error');
    }
  };

  return (
    <section className="checkout-section">
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px' }}>
        <button
          onClick={closeCheckout}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--brown)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px'
          }}
        >
          ← BACK TO SHOPPING
        </button>
        <p className="section-label">Almost yours</p>
        <h1 style={{ fontSize: '38px', color: 'var(--brown)', fontWeight: 400 }}>Complete your order</h1>
        <p style={{ color: 'var(--soft-brown)', fontSize: '15px' }}>
          Just a few little details and your Dear Draupadi treasures will be on their way. ♡
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="checkout-grid">
        {/* Form Column */}
        <div>
          {/* Step 1: Contact */}
          <div className="checkout-block">
            <h3>01 — Contact details</h3>
            <div className="form-group">
              <label>Full name *</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={customer.name}
                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email address *</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={customer.email}
                  onChange={e => setCustomer({ ...customer, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone number *</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={customer.phone}
                  onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Address */}
          <div className="checkout-block">
            <h3>02 — Delivery address</h3>
            <div className="form-group">
              <label>House / Flat / Street address *</label>
              <textarea
                rows={2}
                placeholder="Flat / House no., Building, Street, Area"
                value={customer.address}
                onChange={e => setCustomer({ ...customer, address: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  placeholder="City"
                  value={customer.city}
                  onChange={e => setCustomer({ ...customer, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  placeholder="State"
                  value={customer.state}
                  onChange={e => setCustomer({ ...customer, state: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>PIN Code *</label>
              <input
                type="text"
                placeholder="e.g. 560001"
                value={customer.pincode}
                onChange={e => setCustomer({ ...customer, pincode: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Step 3: Payment */}
          <div className="checkout-block">
            <h3>03 — Payment</h3>
            <label className={`payment-option-card ${paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="Cash on Delivery"
                checked={paymentMethod === 'Cash on Delivery'}
                onChange={() => setPaymentMethod('Cash on Delivery')}
              />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--brown)' }}>Cash on Delivery</strong>
                <p style={{ fontSize: '12px', color: 'var(--soft-brown)', marginTop: '2px' }}>
                  Pay comfortably when your parcel arrives at your doorstep.
                </p>
              </div>
            </label>

            <label className={`payment-option-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="UPI"
                checked={paymentMethod === 'UPI'}
                onChange={() => setPaymentMethod('UPI')}
              />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--brown)' }}>UPI (GPay / PhonePe / Paytm - Demo)</strong>
                <p style={{ fontSize: '12px', color: 'var(--soft-brown)', marginTop: '2px' }}>
                  Instant digital UPI confirmation simulation.
                </p>
              </div>
            </label>

            <label className={`payment-option-card ${paymentMethod === 'Card' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="Card"
                checked={paymentMethod === 'Card'}
                onChange={() => setPaymentMethod('Card')}
              />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--brown)' }}>Debit / Credit Card (Demo)</strong>
                <p style={{ fontSize: '12px', color: 'var(--soft-brown)', marginTop: '2px' }}>
                  Secure card checkout simulation.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '12px', letterSpacing: '2px' }}
            disabled={submitting}
          >
            {submitting ? 'PLACING YOUR ORDER IN SUPABASE...' : 'PLACE MY ORDER ♡'}
          </button>
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="checkout-block" style={{ position: 'sticky', top: '100px' }}>
            <p className="section-label">Your order</p>
            <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>Little treasures</h2>

            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '20px' }}>
              {cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
                  <img
                    src={item.product.images?.[0] || ''}
                    alt={item.product.name}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: 'var(--brown)', fontWeight: 500 }}>{item.product.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--soft-brown)' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--brown)', fontSize: '14px' }}>
                    ₹{item.product.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-summary-row">
              <span>Subtotal</span>
              <span>₹{cartSubtotal}</span>
            </div>

            {appliedCoupon && (
              <div className="drawer-summary-row" style={{ color: 'var(--terracotta)' }}>
                <span>Coupon Discount ({appliedCoupon.code})</span>
                <span>−₹{appliedCoupon.discount}</span>
              </div>
            )}

            <div className="drawer-summary-row">
              <span>Boutique Delivery</span>
              <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>FREE</span>
            </div>

            <div className="drawer-summary-total">
              <span>Total</span>
              <strong style={{ color: 'var(--teal)', fontSize: '22px' }}>₹{cartTotal}</strong>
            </div>

            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--soft-brown)', marginTop: '14px' }}>
              Complimentary handwritten note included with every boutique order ♡
            </p>
          </div>
        </div>
      </form>
    </section>
  );
};
