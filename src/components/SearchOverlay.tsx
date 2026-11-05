import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';

export const SearchOverlay: React.FC = () => {
  const { products, isSearchOpen, closeSearch, openProductModal } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q)
    );
  }, [products, query]);

  if (!isSearchOpen) return null;

  return (
    <div className="search-overlay active">
      <button className="modal-close" onClick={closeSearch} aria-label="Close search">×</button>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p className="section-label">DEAR DRAUPADI</p>
        <h2 style={{ fontSize: '32px', color: 'var(--brown)', fontWeight: 400 }}>Find your little something.</h2>
        <p style={{ color: 'var(--soft-brown)', fontSize: '13px', marginTop: '6px' }}>
          Search through our handmade boutique treasures ♡
        </p>
      </div>

      <div className="search-box">
        <span>⌕</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search flowers, jewellery, crochet, hampers..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div style={{ width: '100%', maxWidth: '680px', flex: 1, overflowY: 'auto' }}>
        {query.trim() === '' ? (
          <p style={{ textAlign: 'center', color: 'var(--soft-brown)', fontSize: '14px', fontStyle: 'italic' }}>
            Start typing to find something lovely...
          </p>
        ) : searchResults.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--soft-brown)', fontSize: '14px' }}>
            No treasures found matching "{query}".
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {searchResults.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  closeSearch();
                  openProductModal(p);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 16px',
                  background: 'var(--ivory)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <img
                  src={p.images?.[0] || ''}
                  alt={p.name}
                  style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--terracotta)' }}>
                    {p.categoryName}
                  </span>
                  <h4 style={{ fontSize: '16px', color: 'var(--brown)', fontWeight: 500 }}>{p.name}</h4>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--teal)', fontSize: '15px' }}>
                  ₹{p.price}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
