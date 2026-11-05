import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export const AccountPortalModal: React.FC = () => {
  const { isAccountOpen, closeCustomerAccount, customerSession, logoutCustomer, showToast, setCustomerSession } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'address'>('orders');

  const [address, setAddress] = useState(customerSession?.address || '');
  const [city, setCity] = useState(customerSession?.city || '');
  const [state, setState] = useState(customerSession?.state || '');
  const [pincode, setPincode] = useState(customerSession?.pincode || '');

  if (!isAccountOpen || !customerSession) return null;

  const localOrders = JSON.parse(localStorage.getItem('dd_local_orders_v3') || '[]');
  const myOrders = localOrders.filter((o: any) =>
    !o.customer?.email || o.customer.email.toLowerCase() === customerSession.email.toLowerCase()
  );

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerSession({
      ...customerSession,
      address,
      city,
      state,
      pincode
    });
    showToast('Delivery address updated ♡');
  };

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) closeCustomerAccount(); }}>
      <div className="modal-content" style={{ maxWidth: '680px', padding: '36px' }}>
        <button className="modal-close" onClick={closeCustomerAccount}>×</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--teal)',
            color: 'var(--ivory)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-serif)'
          }}>
            {customerSession.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p className="section-label" style={{ marginBottom: '2px' }}>Customer Account</p>
            <h2 style={{ fontSize: '24px', fontWeight: 400, color: 'var(--brown)' }}>{customerSession.name}</h2>
            <p style={{ fontSize: '13px', color: 'var(--soft-brown)' }}>{customerSession.email}</p>
          </div>
          <button
            onClick={logoutCustomer}
            style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--terracotta)', fontWeight: 600 }}
          >
            LOGOUT ↗
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '1px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: activeTab === 'orders' ? 'var(--teal)' : 'var(--soft-brown)',
              borderBottom: activeTab === 'orders' ? '2px solid var(--teal)' : 'none'
            }}
          >
            📦 My Orders ({myOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '1px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: activeTab === 'profile' ? 'var(--teal)' : 'var(--soft-brown)',
              borderBottom: activeTab === 'profile' ? '2px solid var(--teal)' : 'none'
            }}
          >
            👤 Profile Details
          </button>
          <button
            onClick={() => setActiveTab('address')}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '1px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: activeTab === 'address' ? 'var(--teal)' : 'var(--soft-brown)',
              borderBottom: activeTab === 'address' ? '2px solid var(--teal)' : 'none'
            }}
          >
            📍 Saved Address
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div>
            {myOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--soft-brown)', padding: '40px 0' }}>
                You haven't placed any boutique orders yet ♡
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myOrders.map((ord: any, idx: number) => (
                  <div key={idx} style={{ background: 'var(--cream)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{ord.orderNumber || `DD-${ord.id}`}</strong>
                      <span style={{ color: 'var(--teal)', fontWeight: 600, fontSize: '13px' }}>
                        {ord.order_status || 'Order Placed'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--soft-brown)', marginBottom: '8px' }}>
                      {new Date(ord.created_at).toLocaleDateString('en-GB')} • Total: ₹{ord.total_amount}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--brown)' }}>
                      {(ord.items || []).map((i: any, k: number) => (
                        <div key={k}>{i.product_name} × {i.quantity}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
            <div style={{ background: 'var(--cream)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--soft-brown)', textTransform: 'uppercase' }}>Full Name</span>
              <p style={{ fontWeight: 600, marginTop: '4px' }}>{customerSession.name}</p>
            </div>
            <div style={{ background: 'var(--cream)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--soft-brown)', textTransform: 'uppercase' }}>Email Address</span>
              <p style={{ fontWeight: 600, marginTop: '4px' }}>{customerSession.email}</p>
            </div>
            <div style={{ background: 'var(--cream)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--soft-brown)', textTransform: 'uppercase' }}>Member Since</span>
              <p style={{ fontWeight: 600, marginTop: '4px' }}>{customerSession.joinedDate || '2026'}</p>
            </div>
            <div style={{ background: 'var(--cream)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--soft-brown)', textTransform: 'uppercase' }}>Boutique Tier</span>
              <p style={{ fontWeight: 600, color: 'var(--teal)', marginTop: '4px' }}>Valued Collector ❀</p>
            </div>
          </div>
        )}

        {/* Tab 3: Address */}
        {activeTab === 'address' && (
          <form onSubmit={handleSaveAddress}>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                placeholder="Flat / House no., Street, Area"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
              SAVE ADDRESS DETAILS
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
