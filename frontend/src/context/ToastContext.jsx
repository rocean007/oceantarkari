import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const toast = {
    success: (msg, opts) => addToast({ message: msg, type: 'success', ...opts }),
    error:   (msg, opts) => addToast({ message: msg, type: 'error',   ...opts }),
    info:    (msg, opts) => addToast({ message: msg, type: 'info',    ...opts }),
    warning: (msg, opts) => addToast({ message: msg, type: 'warning', ...opts }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  // Inject keyframe once
  if (typeof document !== 'undefined' && !document.getElementById('vg-toast-style')) {
    const s = document.createElement('style');
    s.id = 'vg-toast-style';
    s.textContent = '@keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }';
    document.head.appendChild(s);
  }
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'max(env(safe-area-inset-bottom), 24px)',
        right: '16px',
        left: '16px',
        zIndex: 'var(--z-toast)',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: '380px',
        marginLeft: 'auto',
      }}
    >
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const icons = { success: '✓', error: '✕', warning: '!', info: 'ℹ' };
  const colors = {
    success: { bg: '#1a3c2a', border: '#4a7c59', icon: '#a8d5b5' },
    error:   { bg: '#3c1a1a', border: '#8c3a3a', icon: '#f4a4a4' },
    warning: { bg: '#3c2e1a', border: '#8c6a2a', icon: '#f4d4a4' },
    info:    { bg: '#1a2e3c', border: '#2a5e8c', icon: '#a4c4f4' },
  };
  const c = colors[toast.type];

  return (
    <div
      role="alert"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '14px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: '#fff',
        fontSize: '0.9rem',
        fontFamily: 'var(--font-body)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: c.icon, color: c.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
      }}>
        {icons[toast.type]}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
    </div>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};
