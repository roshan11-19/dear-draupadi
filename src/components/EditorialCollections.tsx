import React from 'react';
import { useStore } from '../context/StoreContext';

export const EditorialCollections: React.FC = () => {
  const { setActiveCategory } = useStore();

  const handleSelectCollection = (catKey: string) => {
    setActiveCategory(catKey);
    const shopEl = document.getElementById('products');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const collections = [
    {
      num: '01 / COLLECTION',
      title: 'Flowers',
      catKey: 'flowers',
      desc: 'Handmade blooms that never fade.',
      symbol: '❀',
      linkText: 'EXPLORE →'
    },
    {
      num: '02 / COLLECTION',
      title: 'Jewellery',
      catKey: 'jewellery',
      desc: 'Little pieces to treasure.',
      symbol: '✦',
      linkText: 'EXPLORE →'
    },
    {
      num: '03 / COLLECTION',
      title: 'Crochet',
      catKey: 'crochet',
      desc: 'Made slowly, made with love.',
      symbol: '♡',
      linkText: 'EXPLORE →'
    },
    {
      num: '04 / COLLECTION',
      title: 'Hampers',
      catKey: 'hampers',
      desc: 'Gifts made for someone special.',
      symbol: '✿',
      linkText: 'EXPLORE →'
    },
    {
      num: '05 / COLLECTION',
      title: 'New Arrivals',
      catKey: 'new-arrivals',
      desc: 'Something new has arrived.',
      symbol: '✧',
      linkText: 'DISCOVER →'
    }
  ];

  return (
    <section className="editorial-collections" id="collections">
      <div className="editorial-heading">
        <div>
          <p className="section-label">Discover</p>
          <h2>
            Explore our
            <br />
            little world.
          </h2>
        </div>
        <p className="editorial-description">
          Thoughtfully chosen pieces, handmade details and little things that make ordinary moments feel special.
        </p>
      </div>

      <div className="editorial-grid">
        {collections.map(col => (
          <div
            key={col.title}
            className="editorial-card"
            onClick={() => handleSelectCollection(col.catKey)}
          >
            <div className="collection-symbol">{col.symbol}</div>
            <div className="editorial-content">
              <div className="collection-number">{col.num}</div>
              <h3>{col.title}</h3>
              <p>{col.desc}</p>
              <span className="collection-link">{col.linkText}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
