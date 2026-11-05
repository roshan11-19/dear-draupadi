import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

interface FooterProps {
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateAdmin }) => {
  const { openTracking, setActiveCategory, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    showToast('Thank you for subscribing to our gentle notes ♡');
    setNewsletterEmail('');
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src="/logo.png" alt="Dear Draupadi Logo" />
          <p>
            Pretty little things, thoughtful gifts, and handmade happiness. Curated with love for life's sweetest moments.
          </p>
        </div>

        <div className="footer-col">
          <h4>SHOP</h4>
          <button onClick={() => handleCategoryClick('flowers')}>Flowers</button>
          <button onClick={() => handleCategoryClick('jewellery')}>Jewellery</button>
          <button onClick={() => handleCategoryClick('crochet')}>Crochet</button>
          <button onClick={() => handleCategoryClick('hampers')}>Hampers</button>
          <button onClick={() => handleCategoryClick('accessories')}>Accessories</button>
        </div>

        <div className="footer-col">
          <h4>HELP & CARE</h4>
          <button onClick={openTracking}>Track My Order</button>
          <a href="#about">Our Story</a>
          <a href="#contact">Instagram Community</a>
          {onNavigateAdmin && (
            <button
              onClick={onNavigateAdmin}
              style={{ opacity: 0.6, fontSize: '11px', marginTop: '14px', letterSpacing: '1px' }}
            >
              Admin Management Portal ↗
            </button>
          )}
        </div>

        <div className="footer-col">
          <h4>NEWSLETTER</h4>
          <p style={{ fontSize: '13px', color: 'var(--sand)', marginBottom: '14px', lineHeight: 1.6 }}>
            Subscribe to receive gentle notes on new arrivals & secret boutique drops ♡
          </p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="email"
              placeholder="Your email address"
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: '#fff',
                fontSize: '12px'
              }}
            />
            <button
              type="submit"
              style={{
                background: 'var(--terracotta)',
                color: '#fff',
                padding: '0 16px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px'
              }}
            >
              JOIN
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Dear Draupadi · Made with ♡</span>
        <span>Handmade in India</span>
      </div>
    </footer>
  );
};
