import React from 'react';
import { useStore } from '../context/StoreContext';

export const InstagramGrid: React.FC = () => {
  const { setActiveCategory } = useStore();

  const boxes = [
    { emoji: '🌸', title: 'Everlasting Blooms', cat: 'flowers' },
    { emoji: '✨', title: 'Freshwater Pearls', cat: 'jewellery' },
    { emoji: '🎀', title: 'Curated Hampers', cat: 'hampers' },
    { emoji: '🌼', title: 'Hand-Knitted Crochet', cat: 'crochet' }
  ];

  return (
    <section style={{ padding: '80px 5%', textAlign: 'center', background: 'var(--cream)' }} id="contact">
      <p className="section-label">Follow our little world</p>
      <h2 style={{ fontSize: '38px', color: 'var(--brown)', fontWeight: 400, marginBottom: '8px' }}>
        @deardraupadi
      </h2>
      <p style={{ color: 'var(--soft-brown)', fontSize: '15px', marginBottom: '40px' }}>
        Pretty things · little moments · lots of love ♡
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {boxes.map((b, i) => (
          <div
            key={i}
            onClick={() => {
              setActiveCategory(b.cat);
              const el = document.getElementById('products');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: 'var(--ivory)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '36px 20px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{b.emoji}</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brown)' }}>{b.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
