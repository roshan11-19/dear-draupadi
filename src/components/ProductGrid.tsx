import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

const CATEGORY_ICONS: Record<string, string> = {
  all: '❀',
  jewellery: '✨',
  flowers: '🌸',
  bracelets: '♡',
  crochet: '🧶',
  hampers: '🎀',
  accessories: '🪶',
  'new-arrivals': '✧'
};

export const ProductGrid: React.FC = () => {
  const {
    products,
    categories,
    activeCategory,
    setActiveCategory,
    sortOrder,
    setSortOrder,
    isLoading
  } = useStore();

  const [filterSearch, setFilterSearch] = useState('');

  // Calculate dynamic item counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      'new-arrivals': products.filter(p => p.new_arrival).length
    };
    categories.forEach(c => {
      const key = c.slug || c.name.toLowerCase();
      counts[key] = products.filter(p => p.categoryName?.toLowerCase().includes(key)).length;
    });
    return counts;
  }, [products, categories]);

  const filterButtons = useMemo(() => {
    const base = [
      { label: 'ALL TREASURES', value: 'all', icon: CATEGORY_ICONS.all }
    ];
    categories.forEach(c => {
      const val = c.slug || c.name.toLowerCase();
      base.push({
        label: c.name.toUpperCase(),
        value: val,
        icon: CATEGORY_ICONS[val] || '❀'
      });
    });
    return base;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      if (activeCategory === 'new-arrivals') {
        list = list.filter(p => p.new_arrival);
      } else {
        list = list.filter(p => {
          const catName = p.categoryName?.toLowerCase() || '';
          return catName.includes(activeCategory.toLowerCase());
        });
      }
    }

    // Inline search filter if entered
    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortOrder) {
      case 'newest':
        list.sort((a, b) => (b.new_arrival ? 1 : 0) - (a.new_arrival ? 1 : 0));
        break;
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return list;
  }, [products, activeCategory, filterSearch, sortOrder]);

  return (
    <section className="products-section" id="products">
      <div className="products-heading">
        <div>
          <p className="section-label">Curated Catalog</p>
          <h2>Little treasures</h2>
        </div>
        <p style={{ color: 'var(--soft-brown)', fontSize: '15px', maxWidth: '420px' }}>
          Explore our handcrafted blooms, pearls, hampers, and crochet creations.
        </p>
      </div>

      {/* PROFESSIONAL MIDDLE BOUTIQUE NAVIGATION BAR */}
      <nav className="products-navbar-dock" aria-label="Product Category Navigation">
        <div className="products-nav-track">
          <div className="product-filters-scroll">
            {filterButtons.map(btn => {
              const count = categoryCounts[btn.value] ?? 0;
              const isActive = activeCategory === btn.value;
              return (
                <button
                  key={btn.value}
                  className={`boutique-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(btn.value)}
                  type="button"
                >
                  <span className="tab-icon">{btn.icon}</span>
                  <span className="tab-label">{btn.label}</span>
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="products-nav-controls">
            {/* Quick Filter Search */}
            <div className="quick-search-wrap">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Filter catalog..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                aria-label="Filter catalog"
              />
              {filterSearch && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setFilterSearch('')}
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="sort-wrap">
              <label htmlFor="sort-select">Sort:</label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Filter Summary Bar */}
        <div className="products-status-bar">
          <span>
            Showing <strong>{filteredProducts.length}</strong> of {products.length} treasures
            {activeCategory !== 'all' && (
              <> in <em>{activeCategory}</em></>
            )}
            {filterSearch && (
              <> matching "<em>{filterSearch}</em>"</>
            )}
          </span>
          {(activeCategory !== 'all' || filterSearch) && (
            <button
              className="reset-filters-btn"
              onClick={() => {
                setActiveCategory('all');
                setFilterSearch('');
              }}
            >
              Reset Filters ✕
            </button>
          )}
        </div>
      </nav>

      {/* PRODUCTS GRID */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--soft-brown)' }}>
          <p style={{ fontSize: '28px', marginBottom: '8px' }}>🌸</p>
          <p>Unwrapping boutique treasures from Supabase...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--soft-brown)',
          background: 'var(--ivory)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginTop: '20px'
        }}>
          <p style={{ fontSize: '36px', marginBottom: '12px' }}>♡</p>
          <h3 style={{ fontSize: '20px', color: 'var(--brown)', marginBottom: '8px' }}>No pieces match your selection</h3>
          <p style={{ fontSize: '14px' }}>Try switching category or clearing the search query.</p>
          <button
            className="btn-primary"
            style={{ marginTop: '18px' }}
            onClick={() => {
              setActiveCategory('all');
              setFilterSearch('');
            }}
          >
            VIEW ALL TREASURES
          </button>
        </div>
      ) : (
        <div className="product-grid" style={{ marginTop: '24px' }}>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
