import React from 'react';
import { useStore } from '../context/StoreContext';

export const Toast: React.FC = () => {
  const { toasts } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{
          background: t.type === 'error' ? '#8B2626' : t.type === 'info' ? 'var(--dark-teal)' : 'var(--brown)'
        }}>
          <span>{t.type === 'error' ? '⚠️' : '🌸'}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
