import React from 'react';

export const BrandStory: React.FC = () => {
  return (
    <section className="story-section" id="about">
      <div className="story-art">
        <img src="/logo.png" alt="Dear Draupadi Brand Crest" className="story-logo" />
      </div>

      <div className="story-content">
        <p className="section-label">A little about us</p>
        <h2>
          Made for the
          <br />
          little joys in life.
        </h2>
        <p>
          Dear Draupadi is a warm boutique space filled with pretty things, thoughtful gifts, and pieces crafted with love and patience.
        </p>
        <p>
          From handmade everlasting blossoms and delicate freshwater pearls to hand-knitted crochet creations and curated gift hampers, everything here is meant to make your everyday moments a little more meaningful.
        </p>
        <a href="#products" className="btn-secondary" style={{ marginTop: '16px' }}>
          SHOP THE BOUTIQUE →
        </a>
      </div>
    </section>
  );
};
