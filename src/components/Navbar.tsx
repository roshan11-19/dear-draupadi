import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

interface NavbarProps {
  onNavigateAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateAdmin }) => {
  const {
    cartCount,
    wishlistCount,
    openCart,
    openWishlist,
    openSearch,
    openAuthOrAccount,
    customerSession,
    openTracking
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="navbar">
        <div className="nav-brand-wrap">
          <button
            className="mobile-toggle"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <a href="#" aria-label="Dear Draupadi Home">
            <img src="/logo.png" alt="Dear Draupadi Logo" className="nav-logo" />
          </a>
        </div>

        <nav>
          <ul className="nav-links">
            <li><a href="#">HOME</a></li>
            <li><a href="#collections">COLLECTIONS</a></li>
            <li><a href="#products">SHOP</a></li>
            <li><a href="#about">ABOUT</a></li>
            <li><a href="#contact">CONTACT</a></li>
            <li>
              <button onClick={openSearch} aria-label="Search treasures">
                ⌕ SEARCH
              </button>
            </li>
          </ul>
        </nav>

        <div className="nav-actions">
          <button
            className="nav-action-btn"
            onClick={openAuthOrAccount}
            aria-label="Customer Account"
          >
            <span>👤</span>
            <span>{customerSession ? customerSession.name.split(' ')[0] : 'ACCOUNT'}</span>
          </button>

          <button
            className="nav-action-btn"
            onClick={openWishlist}
            aria-label="Open wishlist"
            title="Wishlist"
          >
            <span>♡</span>
            {wishlistCount > 0 && <span className="badge-count">{wishlistCount}</span>}
          </button>

          <button
            className="cart-link"
            onClick={openCart}
            aria-label="Open cart"
            title="Cart"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>CART</span>
            {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER NAVIGATION - RENDERED ONLY WHEN OPEN */}
      {mobileMenuOpen && (
        <>
          <div
            className="drawer-overlay active"
            onClick={closeMobile}
          />
          <aside className="mobile-nav-drawer active">
            <div className="drawer-header">
              <img src="/logo.png" alt="Dear Draupadi" style={{ height: '36px' }} />
              <button className="drawer-close-btn" onClick={closeMobile}>×</button>
            </div>
            <div className="drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '15px' }}>
                <a href="#" onClick={closeMobile}>Home</a>
                <a href="#collections" onClick={closeMobile}>Collections</a>
                <a href="#products" onClick={closeMobile}>All Treasures</a>
                <a href="#about" onClick={closeMobile}>Our Story</a>
                <a href="#contact" onClick={closeMobile}>Instagram</a>
                <hr style={{ borderColor: 'var(--border-light)', margin: '8px 0' }} />
                <button style={{ textAlign: 'left' }} onClick={() => { closeMobile(); openSearch(); }}>
                  ⌕ Search Treasures
                </button>
                <button style={{ textAlign: 'left' }} onClick={() => { closeMobile(); openAuthOrAccount(); }}>
                  👤 {customerSession ? `Account (${customerSession.name})` : 'My Account'}
                </button>
                <button style={{ textAlign: 'left' }} onClick={() => { closeMobile(); openWishlist(); }}>
                  ♡ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </button>
                <button style={{ textAlign: 'left' }} onClick={() => { closeMobile(); openCart(); }}>
                  🛍 Cart {cartCount > 0 && `(${cartCount})`}
                </button>
                <button style={{ textAlign: 'left' }} onClick={() => { closeMobile(); openTracking(); }}>
                  📦 Track My Order
                </button>
                {onNavigateAdmin && (
                  <button
                    style={{ textAlign: 'left', color: 'var(--teal)', fontWeight: 600, marginTop: '12px' }}
                    onClick={() => { closeMobile(); onNavigateAdmin(); }}
                  >
                    ⚙️ Boutique Admin Portal ↗
                  </button>
                )}
              </div>
            </div>
            <div className="drawer-footer" style={{ textAlign: 'center', fontSize: '12px', color: 'var(--soft-brown)' }}>
              <p>© 2026 Dear Draupadi</p>
              <p style={{ marginTop: '4px', color: 'var(--terracotta)' }}>Handmade with love ♡</p>
            </div>
          </aside>
        </>
      )}
    </>
  );
};
