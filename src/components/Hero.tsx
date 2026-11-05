import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="hero-eyebrow">
          <span>❀</span> Welcome to Dear Draupadi
        </p>
        <h1>
          Little things,
          <br />
          <span>made with love.</span>
        </h1>
        <p className="hero-description">
          Pretty little things, thoughtful gifts and handmade creations — chosen to bring a little more joy into your everyday moments.
        </p>
        <div className="hero-buttons">
          <a href="#collections" className="btn-primary">
            EXPLORE OUR COLLECTION →
          </a>
          <a href="#about" className="btn-secondary">
            OUR STORY ❀
          </a>
        </div>
      </div>

      <div className="hero-art">
        <div className="hero-logo-frame">
          <img src="/logo.png" alt="Dear Draupadi Brand Illustration" className="hero-logo" />
        </div>
      </div>
    </section>
  );
};
