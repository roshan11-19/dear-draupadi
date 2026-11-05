import React from 'react';
import { useStore } from '../context/StoreContext';

export const AnnouncementBar: React.FC = () => {
  const { openAuthOrAccount, openTracking, customerSession } = useStore();

  return (
    <aside className="announcement-bar">
      <div className="announcement-text">
        Complimentary Handcrafted Gift Packaging on all boutique orders ♡
      </div>
      <div className="announcement-links">
        <button onClick={openAuthOrAccount}>
          {customerSession ? `ACCOUNT (${customerSession.name.split(' ')[0]})` : 'ACCOUNT / SIGN IN'}
        </button>
        <button onClick={openTracking}>TRACK ORDER</button>
        <a href="#about">OUR STORY</a>
      </div>
    </aside>
  );
};
