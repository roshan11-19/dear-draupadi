import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { lookupOrder } from '../lib/db';
import type { Order } from '../types';

export const OrderTrackingModal: React.FC = () => {
  const { isTrackingOpen, closeTracking, lastOrder } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (isTrackingOpen) {
      if (lastOrder) {
        setSearchInput(String(lastOrder.order_number || lastOrder.id));
        setOrder(lastOrder);
        setSearched(true);
      } else {
        const lastSaved = localStorage.getItem('dd_last_order_number');
        if (lastSaved) {
          setSearchInput(lastSaved);
          handleLookup(lastSaved);
        }
      }
    }
  }, [isTrackingOpen, lastOrder]);

  const handleLookup = async (q?: string) => {
    const queryToUse = q || searchInput;
    if (!queryToUse.trim()) return;

    setLoading(true);
    setSearched(true);
    const res = await lookupOrder(queryToUse);
    setOrder(res);
    setLoading(false);
  };

  if (!isTrackingOpen) return null;

  const steps = [
    { title: 'Order Placed', note: 'Received by boutique' },
    { title: 'Confirmed', note: 'Order verified & recorded' },
    { title: 'Packed', note: 'Handcrafted packing with love' },
    { title: 'Shipped', note: 'Dispatched via delivery partner' },
    { title: 'Out for Delivery', note: 'Nearby with courier' },
    { title: 'Delivered', note: 'Delivered into loving hands' }
  ];

  const getStepStatus = (stepTitle: string) => {
    if (!order) return false;
    const current = (order.order_status || '').toLowerCase();
    const orderProgression = ['order placed', 'placed', 'confirmed', 'packed', 'shipped', 'out for delivery', 'delivered'];
    const currentIdx = orderProgression.indexOf(current);
    const stepIdx = orderProgression.indexOf(stepTitle.toLowerCase());
    return currentIdx >= stepIdx;
  };

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) closeTracking(); }}>
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <button className="modal-close" onClick={closeTracking}>×</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p className="section-label">Order Journey</p>
          <h2 style={{ fontSize: '28px', fontWeight: 400, color: 'var(--brown)' }}>Track your treasures</h2>
          <p style={{ color: 'var(--soft-brown)', fontSize: '13px', marginTop: '4px' }}>
            Live status lookup directly from our boutique database
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', maxWidth: '440px', margin: '0 auto 24px' }}>
          <input
            type="text"
            placeholder="Enter Order ID (e.g. DD-000001) or Phone"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLookup(); }}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px'
            }}
          />
          <button
            className="add-cart-btn"
            onClick={() => handleLookup()}
            disabled={loading}
          >
            {loading ? 'LOOKING...' : 'LOOKUP'}
          </button>
        </div>

        {searched && !loading && !order && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--soft-brown)' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>📦</p>
            <p>No order found matching "{searchInput}". Please double check your details.</p>
          </div>
        )}

        {order && (
          <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-sm)', padding: '24px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--terracotta)', fontWeight: 600 }}>
                  Order Reference
                </span>
                <h3 style={{ fontSize: '20px', color: 'var(--brown)', margin: '2px 0' }}>
                  {order.order_number || `DD-${order.id}`}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--soft-brown)' }}>Expected Delivery</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--teal)' }}>
                  {order.expectedDelivery || 'In 3-4 Days'}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="tracking-timeline">
              {steps.map((s, idx) => {
                const isDone = getStepStatus(s.title);
                return (
                  <div key={idx} className={`timeline-step ${isDone ? 'completed' : ''}`}>
                    <div className="timeline-bullet">{isDone ? '✓' : idx + 1}</div>
                    <div style={{ fontWeight: isDone ? 600 : 400, color: isDone ? 'var(--brown)' : 'var(--soft-brown)' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--soft-brown)' }}>{s.note}</div>
                  </div>
                );
              })}
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border-light)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--brown)' }}>Enclosed Items</h4>
                {order.items.map((i, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>{i.product_name} × {i.quantity}</span>
                    <span style={{ fontWeight: 600 }}>₹{i.price * i.quantity}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, marginTop: '10px', color: 'var(--teal)' }}>
                  <span>Total Amount Paid / Due</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
