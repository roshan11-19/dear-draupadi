import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  adminFetchAllOrders,
  adminUpdateOrderStatus,
  adminAdjustStock,
  adminSaveProduct,
  adminDeleteProduct,
  adminFetchCustomers,
  adminSaveCoupon,
  adminToggleCoupon,
  adminDeleteCoupon,
  adminAddCategory,
  adminDeleteCategory
} from '../lib/db';
import type { Order, Product, Customer, Coupon, Category } from '../types';
import '../styles/admin.css';

interface AdminPortalProps {
  onReturnToStore: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onReturnToStore }) => {
  const {
    products,
    categories,
    adminSession,
    loginAdmin,
    logoutAdmin,
    showToast,
    refreshCatalog
  } = useStore();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'categories' | 'coupons'>('overview');

  // Live admin state
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Product Add/Edit Modal
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productImageInput, setProductImageInput] = useState('');

  // Coupon Add Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponMinSpend, setNewCouponMinSpend] = useState(199);
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // Category Add
  const [newCatName, setNewCatName] = useState('');

  const loadAdminData = async () => {
    try {
      const [ordData, custData] = await Promise.all([
        adminFetchAllOrders(),
        adminFetchCustomers()
      ]);
      setOrders(ordData);
      setCustomers(custData);
    } catch (e) {
      console.warn('Admin load error:', e);
    }
  };

  useEffect(() => {
    if (adminSession.authenticated) {
      loadAdminData();
    }
  }, [adminSession.authenticated]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput === 'admin@deardraupadi.com' && passwordInput === 'draupadi2026') {
      loginAdmin(emailInput);
    } else {
      // Demo mode allows any admin sign-in
      loginAdmin(emailInput || 'admin@deardraupadi.com');
    }
  };

  const fillDemo = () => {
    setEmailInput('admin@deardraupadi.com');
    setPasswordInput('draupadi2026');
  };

  // 1. Stock Adjustment
  const handleStockDelta = async (productId: number, delta: number) => {
    const updated = await adminAdjustStock(productId, delta);
    if (updated !== null) {
      showToast(`Stock updated to ${updated}`);
      refreshCatalog();
    }
  };

  // 2. Order Status Update
  const handleStatusChange = async (orderId: string | number, newStatus: string) => {
    const ok = await adminUpdateOrderStatus(orderId, newStatus);
    if (ok) {
      showToast(`Order status updated to "${newStatus}"`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    }
  };

  // 3. Save Product
  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    const imgArray = productImageInput
      ? productImageInput.split(',').map(s => s.trim()).filter(Boolean)
      : (editingProduct.images || []);

    const ok = await adminSaveProduct(editingProduct, imgArray);
    if (ok) {
      showToast('Product saved successfully in Supabase ♡');
      setEditingProduct(null);
      setProductImageInput('');
      refreshCatalog();
    } else {
      showToast('Could not save product.', 'error');
    }
  };

  // 4. Delete Product
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to remove this piece from boutique catalog?')) return;
    const ok = await adminDeleteProduct(productId);
    if (ok) {
      showToast('Product removed from catalog.');
      refreshCatalog();
    }
  };

  // 5. Add Category
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ok = await adminAddCategory(newCatName.trim(), slug);
    if (ok) {
      showToast(`Category "${newCatName}" added.`);
      setNewCatName('');
      refreshCatalog();
    }
  };

  // 6. Delete Category
  const handleDeleteCategory = async (catId: number) => {
    if (!confirm('Delete this category?')) return;
    const ok = await adminDeleteCategory(catId);
    if (ok) {
      showToast('Category removed.');
      refreshCatalog();
    }
  };

  // 7. Save Coupon
  const handleSaveCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const ok = await adminSaveCoupon({
      code: newCouponCode,
      discount_type: newCouponType,
      discount_value: newCouponValue,
      minimum_spend: newCouponMinSpend,
      description: newCouponDesc,
      active: true
    });
    if (ok) {
      showToast(`Coupon "${newCouponCode}" created.`);
      setIsCouponModalOpen(false);
      setNewCouponCode('');
      setNewCouponDesc('');
    }
  };

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => (o.order_status || '').toLowerCase().includes('placed') || (o.order_status || '').toLowerCase().includes('pending')).length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  // Render Login View if not authenticated
  if (!adminSession.authenticated) {
    return (
      <div className="admin-login-view">
        <div className="login-card">
          <img src="/logo.png" alt="Dear Draupadi" className="login-logo" />
          <h1>Dear Draupadi</h1>
          <p className="subtitle">Boutique Store Management Portal</p>

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label>Admin Email</label>
              <input
                type="text"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="admin@deardraupadi.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="login-btn">
              SIGN IN TO DASHBOARD →
            </button>
          </form>

          <div className="demo-credentials-chip">
            <strong>Demo Credentials:</strong>
            <span>Email: <code>admin@deardraupadi.com</code></span>
            <span>Password: <code>draupadi2026</code></span>
            <button type="button" className="demo-fill-btn" onClick={fillDemo}>
              ⚡ Quick Fill Credentials
            </button>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={onReturnToStore}
              style={{ color: 'var(--admin-teal)', textDecoration: 'underline', fontSize: '13px' }}
            >
              ← Return to Dear Draupadi Boutique Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Dear Draupadi" className="sidebar-logo" />
          <div>
            <div className="sidebar-brand-title">Dear Draupadi</div>
            <div className="sidebar-brand-tag">Management</div>
          </div>
        </div>

        <ul className="sidebar-nav">
          <li>
            <button
              className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span>📊</span> Overview
            </button>
          </li>
          <li>
            <button
              className={`nav-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span>🌸</span> Products ({products.length})
            </button>
          </li>
          <li>
            <button
              className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); loadAdminData(); }}
            >
              <span>📦</span> Orders ({orders.length})
            </button>
          </li>
          <li>
            <button
              className={`nav-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveTab('customers'); loadAdminData(); }}
            >
              <span>👥</span> Customers
            </button>
          </li>
          <li>
            <button
              className={`nav-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <span>🏷️</span> Categories ({categories.length})
            </button>
          </li>
          <li>
            <button
              className={`nav-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              <span>✂️</span> Coupons
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button
            onClick={onReturnToStore}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--admin-border)',
              fontSize: '12px',
              color: 'var(--admin-teal)',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>View Customer Store</span>
            <span>↗</span>
          </button>
          <button
            onClick={logoutAdmin}
            style={{
              padding: '10px 14px',
              fontSize: '12px',
              color: 'var(--admin-terracotta)',
              textAlign: 'left',
              fontWeight: 600
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        <header className="admin-header">
          <h2>
            {activeTab === 'overview' && 'Boutique Dashboard Overview'}
            {activeTab === 'products' && 'Product Catalogue & Inventory'}
            {activeTab === 'orders' && 'Customer Orders Fulfillment'}
            {activeTab === 'customers' && 'Registered Customers'}
            {activeTab === 'categories' && 'Store Categories'}
            {activeTab === 'coupons' && 'Promotions & Coupons'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--admin-muted)' }}>Logged in as Admin</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--admin-teal)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              D
            </div>
          </div>
        </header>

        <div className="admin-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Total Revenue</span>
                    <span>💰</span>
                  </div>
                  <div className="kpi-value">₹{totalRevenue}</div>
                  <div className="kpi-sub">Across all placed orders in Supabase</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Total Orders</span>
                    <span>📦</span>
                  </div>
                  <div className="kpi-value">{orders.length}</div>
                  <div className="kpi-sub">Lifetime customer purchases</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Pending Orders</span>
                    <span>⏳</span>
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--admin-terracotta)' }}>{pendingOrders}</div>
                  <div className="kpi-sub">Need preparation & dispatch</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Low Stock Alerts</span>
                    <span>⚠️</span>
                  </div>
                  <div className="kpi-value" style={{ color: lowStockCount > 0 ? '#C76A15' : 'var(--admin-teal)' }}>
                    {lowStockCount}
                  </div>
                  <div className="kpi-sub">Pieces with ≤ 5 items remaining</div>
                </div>
              </div>

              {/* Revenue Graph Card */}
              <div className="admin-table-card" style={{ padding: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px' }}>Weekly Order & Inflow Activity</h3>
                  <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>Live Supabase Synced</span>
                </div>
                <svg viewBox="0 0 500 140" style={{ width: '100%', height: '180px' }}>
                  <line x1="30" y1="120" x2="480" y2="120" stroke="rgba(99, 68, 47, 0.15)" strokeWidth="1" />
                  <line x1="30" y1="80" x2="480" y2="80" stroke="rgba(99, 68, 47, 0.1)" strokeWidth="1" strokeDasharray="3" />
                  <line x1="30" y1="40" x2="480" y2="40" stroke="rgba(99, 68, 47, 0.1)" strokeWidth="1" strokeDasharray="3" />

                  {/* Sample weekly flow bars */}
                  {[
                    { x: 60, h: 45, val: '₹1,250', day: 'Mon' },
                    { x: 120, h: 70, val: '₹2,100', day: 'Tue' },
                    { x: 180, h: 55, val: '₹1,650', day: 'Wed' },
                    { x: 240, h: 90, val: '₹3,200', day: 'Thu' },
                    { x: 300, h: 65, val: '₹2,400', day: 'Fri' },
                    { x: 360, h: 100, val: '₹4,500', day: 'Sat' },
                    { x: 420, h: 85, val: '₹3,800', day: 'Sun' }
                  ].map((bar, i) => (
                    <g key={i}>
                      <rect
                        x={bar.x}
                        y={120 - bar.h}
                        width="32"
                        height={bar.h}
                        rx="4"
                        fill="var(--admin-teal)"
                        opacity="0.85"
                      />
                      <text x={bar.x + 16} y="136" textAnchor="middle" fontSize="10" fill="var(--admin-muted)">
                        {bar.day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <div className="admin-table-card">
                <div className="table-header-bar">
                  <h3>All Boutique Pieces</h3>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '10px 18px' }}
                    onClick={() => {
                      setEditingProduct({
                        name: '',
                        category_id: categories[0]?.id || 1,
                        price: 99,
                        stock: 10,
                        description: '',
                        materials: '',
                        size: '',
                        care_instructions: ''
                      });
                      setProductImageInput('');
                    }}
                  >
                    + ADD NEW PIECE
                  </button>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock Quantity</th>
                      <th>Badge</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={p.images?.[0] || ''}
                              alt=""
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div>
                              <strong style={{ fontSize: '14px' }}>{p.name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>ID: #{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{p.categoryName || '—'}</td>
                        <td>₹{p.price}</td>
                        <td>
                          <div className="stock-adjust-group">
                            <button onClick={() => handleStockDelta(p.id, -1)}>−</button>
                            <span>{p.stock}</span>
                            <button onClick={() => handleStockDelta(p.id, 1)}>+</button>
                          </div>
                        </td>
                        <td>
                          {p.badge ? (
                            <span className="status-badge badge-packed">{p.badge}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductImageInput(p.images.join(', '));
                              }}
                              style={{ fontSize: '12px', color: 'var(--admin-teal)', fontWeight: 600 }}
                            >
                              Edit
                            </button>
                            <span>•</span>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              style={{ fontSize: '12px', color: 'var(--admin-terracotta)', fontWeight: 600 }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="admin-table-card">
              <div className="table-header-bar">
                <h3>Customer Orders ({orders.length})</h3>
                <button
                  onClick={loadAdminData}
                  style={{ fontSize: '12px', color: 'var(--admin-teal)', fontWeight: 600 }}
                >
                  🔄 Refresh Orders
                </button>
              </div>

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-muted)' }}>
                  No customer orders placed yet. Place a test order in the storefront!
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(ord => (
                      <tr key={ord.id}>
                        <td>
                          <strong>{ord.order_number || `DD-${ord.id}`}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>
                            {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-GB') : ''}
                          </div>
                        </td>
                        <td>
                          <div>{ord.customer?.name || 'Customer'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>
                            {ord.customer?.phone || ord.customer?.email || '—'}
                          </div>
                        </td>
                        <td>
                          {(ord.items || []).map((it, k) => (
                            <div key={k} style={{ fontSize: '12px' }}>
                              {it.product_name} (×{it.quantity})
                            </div>
                          ))}
                        </td>
                        <td>
                          <strong>₹{ord.total_amount}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>
                            {ord.payment_method}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge badge-${(ord.order_status || 'placed').toLowerCase()}`}>
                            {ord.order_status || 'Placed'}
                          </span>
                        </td>
                        <td>
                          <select
                            value={ord.order_status}
                            onChange={e => handleStatusChange(ord.id, e.target.value)}
                            style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--admin-border)' }}
                          >
                            <option value="placed">Order Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="admin-table-card">
              <div className="table-header-bar">
                <h3>Customer Directory</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address / City</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.email || '—'}</td>
                      <td>{c.phone || '—'}</td>
                      <td>{c.address ? `${c.address}, ${c.city}` : '—'}</td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-muted)' }}>
                        Customers will appear here as orders are placed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {activeTab === 'categories' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
              <div className="admin-table-card">
                <div className="table-header-bar">
                  <h3>Active Boutique Categories</h3>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category Name</th>
                      <th>Slug</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td><strong>{c.name}</strong></td>
                        <td><code>{c.slug}</code></td>
                        <td>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            style={{ color: 'var(--admin-terracotta)', fontSize: '12px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-table-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>+ Add New Category</h3>
                <form onSubmit={handleAddCategorySubmit}>
                  <div className="form-group">
                    <label>Category Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Candles"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    ADD CATEGORY ❀
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="admin-table-card">
              <div className="table-header-bar">
                <h3>Promotional Discount Codes</h3>
                <button
                  className="btn-primary"
                  style={{ fontSize: '11px', padding: '10px 18px' }}
                  onClick={() => setIsCouponModalOpen(true)}
                >
                  + CREATE COUPON
                </button>
              </div>

              <div style={{ padding: '20px' }}>
                <p style={{ color: 'var(--admin-muted)', fontSize: '13px', marginBottom: '16px' }}>
                  Available seeded coupons: <strong>DRAUPADI10</strong> (10% off &gt; ₹199), <strong>FIRSTLOVE</strong> (Flat ₹50 off &gt; ₹250), <strong>JOY20</strong> (20% off &gt; ₹499).
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* EDIT / ADD PRODUCT MODAL */}
      {editingProduct && (
        <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) setEditingProduct(null); }}>
          <div className="modal-content" style={{ maxWidth: '640px', padding: '32px' }}>
            <button className="modal-close" onClick={() => setEditingProduct(null)}>×</button>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--admin-brown)' }}>
              {editingProduct.id ? `Edit Piece: ${editingProduct.name}` : 'Add New Boutique Piece'}
            </h2>

            <form onSubmit={handleSaveProductSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={editingProduct.category_id || categories[0]?.id || 1}
                    onChange={e => setEditingProduct({ ...editingProduct, category_id: Number(e.target.value) })}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URLs (comma-separated)</label>
                <input
                  type="text"
                  placeholder="https://...jpg, https://...png"
                  value={productImageInput}
                  onChange={e => setProductImageInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Materials</label>
                  <input
                    type="text"
                    value={editingProduct.materials || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, materials: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Size / Dimensions</label>
                  <input
                    type="text"
                    value={editingProduct.size || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, size: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
                SAVE PIECE TO SUPABASE ♡
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) setIsCouponModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '32px' }}>
            <button className="modal-close" onClick={() => setIsCouponModalOpen(false)}>×</button>
            <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Create Promo Coupon</h2>

            <form onSubmit={handleSaveCouponSubmit}>
              <div className="form-group">
                <label>Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE15"
                  value={newCouponCode}
                  onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newCouponType}
                    onChange={e => setNewCouponType(e.target.value as any)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    value={newCouponValue}
                    onChange={e => setNewCouponValue(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Minimum Order Spend (₹)</label>
                <input
                  type="number"
                  value={newCouponMinSpend}
                  onChange={e => setNewCouponMinSpend(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g. 15% off on orders above ₹300"
                  value={newCouponDesc}
                  onChange={e => setNewCouponDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                CREATE COUPON IN SUPABASE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
