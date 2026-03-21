import { useEffect } from 'react';
import { IconCheck, IconX, IconAlertCircle, IconAlertTriangle } from '../icons';

export function ToastContainer({ toasts, dispatch }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 'max(16px, env(safe-area-inset-top))',
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
    success: { bg: '#111827', Icon: IconCheck },
    error:   { bg: '#111827', Icon: IconX },
    info:    { bg: '#111827', Icon: IconAlertCircle },
    warning: { bg: '#111827', Icon: IconAlertTriangle },
  };
  const cfg = configs[toast.toastType] || configs.success;
  const { Icon } = cfg;

  return (
    <div style={{
      background: '#111827',
      color: 'white',
      padding: '12px 16px',
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      animation: 'slideInDown 0.3s ease',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      fontWeight: 500,
      fontSize: 13,
      pointerEvents: 'auto',
    }}>
      <div style={{
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        opacity: 0.8,
      }}>
        <Icon size={16} color="white" />
      </div>
      {toast.message}
    </div>
  );
}
