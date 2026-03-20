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
      height: 68,
      background: 'white',
      borderTop: '1px solid #EEEEEE',
      display: 'flex',
      alignItems: 'stretch',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.07)',
      flexShrink: 0,
    }}>
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = id !== 'pay' && currentScreen === id;
        return (
          <button
            key={id}
            onClick={() => handleNav(id)}
            className="nav-btn"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 0 12px',
              color: isActive ? '#2E7D32' : '#9E9E9E',
              cursor: 'pointer',
              borderRadius: 0,
              position: 'relative',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 32,
                height: 3,
                background: '#2E7D32',
                borderRadius: '0 0 4px 4px',
              }} />
            )}
            <Icon
              size={22}
              color={isActive ? '#2E7D32' : '#9E9E9E'}
            />
            <span style={{
              fontSize: 11,
              fontWeight: isActive ? 700 : 500,
              fontFamily: 'Nunito, sans-serif',
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
