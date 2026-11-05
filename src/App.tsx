import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EditorialCollections } from './components/EditorialCollections';
import { ProductGrid } from './components/ProductGrid';
import { BrandStory } from './components/BrandStory';
import { InstagramGrid } from './components/InstagramGrid';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchOverlay } from './components/SearchOverlay';
import { CheckoutView } from './components/CheckoutView';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AuthModal } from './components/AuthModal';
import { AccountPortalModal } from './components/AccountPortalModal';
import { Toast } from './components/Toast';
import { AdminPortal } from './admin/AdminPortal';

import './styles/tokens.css';
import './styles/store.css';

const MainLayout: React.FC = () => {
  const { isCheckoutActive } = useStore();
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin' || window.location.pathname.includes('/admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('store');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = '#admin';
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStore = () => {
    window.location.hash = '';
    setCurrentView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'admin') {
    return (
      <>
        <AdminPortal onReturnToStore={navigateToStore} />
        <Toast />
      </>
    );
  }

  return (
    <div className="store-layout">
      <AnnouncementBar />
      <Navbar onNavigateAdmin={navigateToAdmin} />

      {isCheckoutActive ? (
        <CheckoutView />
      ) : (
        <main>
          <Hero />
          <div className="divider">
            <div className="divider-line"></div>
            <div className="divider-symbol">❀</div>
            <div className="divider-line"></div>
          </div>
          <EditorialCollections />
          <ProductGrid />
          <BrandStory />
          <InstagramGrid />
        </main>
      )}

      <Footer onNavigateAdmin={navigateToAdmin} />

      {/* Drawers & Modals */}
      <ProductModal />
      <CartDrawer />
      <WishlistDrawer />
      <SearchOverlay />
      <OrderTrackingModal />
      <OrderSuccessModal />
      <AuthModal />
      <AccountPortalModal />
      <Toast />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
};

export default App;
