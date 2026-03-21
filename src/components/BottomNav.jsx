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
      flexShrink: 0,
      background: 'white',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'stretch',
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
              gap: 3,
              padding: '10px 0 10px',
              paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              minHeight: 52,
              color: isActive ? '#1B5E20' : '#9CA3AF',
              cursor: 'pointer',
              position: 'relative',
              fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 24, height: 2,
                background: '#1B5E20',
                borderRadius: '0 0 3px 3px',
              }} />
            )}
            <Icon size={20} color={isActive ? '#1B5E20' : '#9CA3AF'} />
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 500,
              lineHeight: 1,
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
