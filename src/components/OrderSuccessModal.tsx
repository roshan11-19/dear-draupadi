import React from 'react';
import { useStore } from '../context/StoreContext';

export const OrderSuccessModal: React.FC = () => {
  const { lastOrder, isOrderSuccessOpen, closeOrderSuccess, openTracking } = useStore();

  if (!isOrderSuccessOpen || !lastOrder) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ maxWidth: '520px', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: '48px', color: 'var(--terracotta)', marginBottom: '16px' }}>♡</div>
        <p className="section-label">Thank you</p>
        <h2 style={{ fontSize: '32px', color: 'var(--brown)', fontWeight: 400, marginBottom: '12px' }}>
          Your order is placed!
        </h2>
        <p style={{ color: 'var(--soft-brown)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
          Thank you for choosing Dear Draupadi. Your little treasures will be prepared and packed with lots of love.
        </p>

        <div style={{
          background: 'var(--cream)',
          border: '1px dashed var(--teal)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 20px',
          display: 'inline-block',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--teal)',
          letterSpacing: '2px',
          marginBottom: '28px'
        }}>
          {lastOrder.order_number || lastOrder.id}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => {
              closeOrderSuccess();
              openTracking();
            }}
          >
            TRACK ORDER →
          </button>
          <button
            className="btn-secondary"
            onClick={closeOrderSuccess}
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    </div>
  );
};
