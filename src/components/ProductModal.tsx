import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { fetchReviews, submitReview } from '../lib/db';
import type { Review } from '../types';

export const ProductModal: React.FC = () => {
  const {
    activeProduct,
    closeProductModal,
    addToCart,
    toggleWishlist,
    isInWishlist,
    openCheckout,
    showToast,
    customerSession,
    openAuthModal
  } = useStore();

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (activeProduct) {
      setSelectedImgIdx(0);
      setQuantity(1);
      setShowReviewForm(false);
      fetchReviews(activeProduct.id).then(setReviews);
    }
  }, [activeProduct]);

  if (!activeProduct) return null;

  const inWishlist = isInWishlist(activeProduct.id);
  const images = activeProduct.images?.length > 0
    ? activeProduct.images
    : ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'];

  const handleAddToCart = () => {
    addToCart(activeProduct, quantity);
    closeProductModal();
  };

  const handleBuyNow = () => {
    if (!customerSession) {
      addToCart(activeProduct, quantity);
      closeProductModal();
      openAuthModal('Please sign in or create an account to proceed with your purchase ♡');
      return;
    }
    addToCart(activeProduct, quantity);
    closeProductModal();
    openCheckout();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: activeProduct.name,
        text: activeProduct.description,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard ♡');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    const ok = await submitReview(activeProduct.id, reviewName, reviewRating, reviewComment);
    setSubmittingReview(false);

    if (ok) {
      showToast('Thank you for your lovely review ♡');
      setReviews(prev => [
        {
          product_id: activeProduct.id,
          rating: reviewRating,
          comment: `${reviewName}: ${reviewComment}`,
          status: 'approved',
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      setReviewName('');
      setReviewComment('');
      setShowReviewForm(false);
    } else {
      showToast('Could not save review. Please try again.', 'error');
    }
  };

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closeProductModal(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={closeProductModal} aria-label="Close">×</button>

        <div className="product-modal-grid">
          {/* Gallery */}
          <div className="modal-gallery">
            <img
              src={images[selectedImgIdx] || images[0]}
              alt={activeProduct.name}
              className="modal-main-img"
            />
            {images.length > 1 && (
              <div className="modal-thumbnails">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    className={`modal-thumb ${selectedImgIdx === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImgIdx(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="modal-info">
            <span className="section-label">{activeProduct.categoryName || 'Boutique'}</span>
            <h2>{activeProduct.name}</h2>

            <div className="modal-rating-row">
              <span>★ {activeProduct.rating.toFixed(1)}</span>
              <span>•</span>
              <span style={{ color: activeProduct.stock > 0 ? 'var(--teal)' : 'var(--terracotta)', fontWeight: 600 }}>
                {activeProduct.stock > 0 ? `In Stock (${activeProduct.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            <div className="modal-prices">
              <span className="modal-price">₹{activeProduct.price}</span>
              {activeProduct.original_price && activeProduct.original_price > activeProduct.price && (
                <span className="modal-orig-price">₹{activeProduct.original_price}</span>
              )}
            </div>

            <p className="modal-desc">{activeProduct.description}</p>

            {/* Specs Accordion */}
            <div className="modal-specs">
              {activeProduct.materials && (
                <p><strong>Materials:</strong> {activeProduct.materials}</p>
              )}
              {activeProduct.size && (
                <p><strong>Size & Fit:</strong> {activeProduct.size}</p>
              )}
              {activeProduct.care_instructions && (
                <p><strong>Care:</strong> {activeProduct.care_instructions}</p>
              )}
            </div>

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', color: 'var(--soft-brown)' }}>Quantity</span>
              <div className="drawer-qty-controls">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(activeProduct.stock || 99, q + 1))}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions-row">
              <button
                className="btn-primary"
                style={{ flex: 1.2 }}
                onClick={handleAddToCart}
                disabled={activeProduct.stock <= 0}
              >
                ADD TO CART →
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, borderColor: 'var(--teal)', color: 'var(--teal)' }}
                onClick={handleBuyNow}
                disabled={activeProduct.stock <= 0}
              >
                BUY NOW ♡
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
              <button
                onClick={() => toggleWishlist(activeProduct.id)}
                style={{ fontSize: '12px', color: inWishlist ? 'var(--terracotta)' : 'var(--brown)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{inWishlist ? '♥' : '♡'}</span>
                <span>{inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
              <span>•</span>
              <button
                onClick={handleShare}
                style={{ fontSize: '12px', color: 'var(--soft-brown)', textDecoration: 'underline' }}
              >
                Share piece ↗
              </button>
            </div>

            {/* Reviews Section */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 400 }}>Customer Reviews ({reviews.length})</h4>
                <button
                  onClick={() => setShowReviewForm(prev => !prev)}
                  style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 600, letterSpacing: '1px' }}
                >
                  {showReviewForm ? '✕ CANCEL' : '+ WRITE A REVIEW'}
                </button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} style={{ background: 'var(--cream)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ananya R."
                      value={reviewName}
                      onChange={e => setReviewName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Rating</label>
                    <select
                      value={reviewRating}
                      onChange={e => setReviewRating(Number(e.target.value))}
                    >
                      <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                      <option value={4}>★★★★☆ (4 Stars - Lovely)</option>
                      <option value={3}>★★★☆☆ (3 Stars - Good)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Review Comment</label>
                    <textarea
                      rows={3}
                      placeholder="Share your experience with this handmade treasure..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '11px' }} disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'SUBMIT REVIEW ♡'}
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '200px', overflowY: 'auto' }}>
                {reviews.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--soft-brown)', fontStyle: 'italic' }}>
                    Be the first to leave a gentle review for this handcrafted piece ♡
                  </p>
                ) : (
                  reviews.map((r, i) => (
                    <div key={i} style={{ paddingBottom: '12px', borderBottom: '1px dashed var(--border-light)', fontSize: '13px' }}>
                      <div style={{ color: 'var(--gold)', fontSize: '11px', marginBottom: '4px' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </div>
                      <p style={{ color: 'var(--brown)' }}>{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
