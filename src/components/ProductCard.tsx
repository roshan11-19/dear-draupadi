import React from 'react';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openProductModal, addToCart, toggleWishlist, isInWishlist } = useStore();
  const inWishlist = isInWishlist(product.id);

  const displayImage = product.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="product-card">
      <div className="product-card-media" onClick={() => openProductModal(product)}>
        <img src={displayImage} alt={product.name} loading="lazy" />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className={`product-wishlist-btn ${inWishlist ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label="Toggle wishlist"
          title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          {inWishlist ? '♥' : '♡'}
        </button>
      </div>

      <div className="product-card-content">
        <span className="product-category-tag">{product.categoryName || 'Boutique'}</span>
        <h3 className="product-title" onClick={() => openProductModal(product)}>
          {product.name}
        </h3>

        <div className="product-card-rating">
          <span>★</span>
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount} reviews)</span>
        </div>

        <div className="product-card-footer">
          <div className="product-price-wrap">
            <span className="product-price">₹{product.price}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="product-original-price">₹{product.original_price}</span>
            )}
          </div>

          <button
            className="add-cart-btn"
            onClick={() => addToCart(product, 1)}
            aria-label={`Add ${product.name} to cart`}
          >
            + ADD
          </button>
        </div>
      </div>
    </div>
  );
};
