import React, { useState, useCallback } from 'react';

let toastFn = null;

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  toastFn = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export const toast = (message, type, duration) => {
  if (toastFn) toastFn(message, type, duration);
};
