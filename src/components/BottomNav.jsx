import { IconHome, IconCreditCard, IconClock, IconMoreHorizontal } from '../icons';

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio', Icon: IconHome },
  { id: 'pay', label: 'Pagar', Icon: IconCreditCard },
  { id: 'historial', label: 'Historial', Icon: IconClock },
  { id: 'mas', label: 'Más', Icon: IconMoreHorizontal },
];

export function BottomNav({ currentScreen, dispatch }) {
  const handleNav = (id) => {
    if (id === 'pay') {
      dispatch({ type: 'OPEN_PAYMENT_FLOW' });
    } else {
      dispatch({ type: 'NAVIGATE', screen: id });
    }
  };

  return (
    <nav style={{
      background: 'white',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'stretch',
      boxShadow: '0 -1px 0 #E2E8F0',
      flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = id !== 'pay' && currentScreen === id;
        return (
          <button
            key={id}
            onClick={() => handleNav(id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 0 10px',
              minHeight: 56,
              color: isActive ? '#1B5E20' : '#9CA3AF',
              cursor: 'pointer',
              position: 'relative',
              fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 2,
                background: '#1B5E20',
                borderRadius: '0 0 3px 3px',
              }} />
            )}
            <Icon size={20} color={isActive ? '#1B5E20' : '#9CA3AF'} />
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 500,
              lineHeight: 1,
              letterSpacing: '0.2px',
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
