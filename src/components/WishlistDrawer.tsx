import React from 'react';
import { useStore } from '../context/StoreContext';

export const WishlistDrawer: React.FC = () => {
  const {
    products,
    wishlist,
    isWishlistOpen,
    closeWishlist,
    toggleWishlist,
    addToCart
  } = useStore();

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  if (!isWishlistOpen) return null;

  return (
    <>
      <div
        className="drawer-overlay active"
        onClick={closeWishlist}
      />
      <aside className={`drawer ${isWishlistOpen ? 'active' : ''}`}>
        <div className="drawer-header">
          <div>
            <p className="section-label" style={{ marginBottom: '4px' }}>Saved with love</p>
            <h2>Your Wishlist</h2>
          </div>
          <button className="drawer-close-btn" onClick={closeWishlist} aria-label="Close wishlist">×</button>
        </div>

        <div className="drawer-body">
          {wishlistProducts.length === 0 ? (
            <div className="empty-drawer">
              <div className="empty-drawer-symbol">♡</div>
              <h3>Your wishlist is empty</h3>
              <p>Save your favourite pieces by tapping the heart icon on any product.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  closeWishlist();
                  const el = document.getElementById('products');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                EXPLORE PIECES
              </button>
            </div>
          ) : (
            <div>
              {wishlistProducts.map(p => (
                <div key={p.id} className="drawer-item">
                  <img src={p.images?.[0] || ''} alt={p.name} className="drawer-item-img" />
                  <div className="drawer-item-info">
                    <h4 className="drawer-item-title">{p.name}</h4>
                    <div className="drawer-item-price">₹{p.price}</div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        className="add-cart-btn"
                        style={{ padding: '6px 12px', fontSize: '10px' }}
                        onClick={() => {
                          addToCart(p, 1);
                          toggleWishlist(p.id);
                        }}
                      >
                        + MOVE TO CART
                      </button>
                      <button
                        onClick={() => toggleWishlist(p.id)}
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
      </aside>
    </>
  );
};
