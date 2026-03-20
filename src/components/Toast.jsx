import { useEffect } from 'react';

export function ToastContainer({ toasts, dispatch }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxWidth: 390,
      width: '92%',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} dispatch={dispatch} />
      ))}
    </div>
  );
}

function ToastItem({ toast, dispatch }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id: toast.id });
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const configs = {
    success: { bg: '#2E7D32', icon: '✓' },
    error: { bg: '#E53935', icon: '✕' },
    info: { bg: '#1565C0', icon: 'ℹ' },
    warning: { bg: '#FF8F00', icon: '!' },
  };
  const cfg = configs[toast.toastType] || configs.success;

  return (
    <div style={{
      background: cfg.bg,
      color: 'white',
      padding: '12px 18px',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      animation: 'slideInDown 0.3s ease',
      fontFamily: 'Nunito, sans-serif',
      fontWeight: 600,
      fontSize: 14,
      pointerEvents: 'auto',
    }}>
      <span style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 13,
        fontWeight: 800,
      }}>
        {cfg.icon}
      </span>
      {toast.message}
    </div>
  );
}
