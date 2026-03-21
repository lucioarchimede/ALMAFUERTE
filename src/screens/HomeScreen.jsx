import { useState, useMemo } from 'react';
import {
  IconBell, IconChevronDown, IconChevronUp, SchoolLogo, IconX, IconAlertCircle,
} from '../icons';
import {
  formatCurrency, getMonthCellStatus, getPaymentForChildMonth,
  getChildOverallStatus, getDashboardStats, statusConfig,
  CURRENT_MONTH, getMonthName,
} from '../utils';
import { MONTHS } from '../store';

export default function HomeScreen({ state, dispatch, addToast, notifications = [], onMarkAllRead }) {
  const { family, payments } = state;
  const [expandedChildren, setExpandedChildren] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);

  const stats = useMemo(() => getDashboardStats(family, payments), [family, payments]);

  if (!family) return null;

  const toggleChild = (id) => {
    setExpandedChildren(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBellPress = () => {
    setShowNotifications(true);
    onMarkAllRead?.();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const pendingCount = useMemo(
    () => payments.filter(p => p.estado === 'pendiente').length,
    [payments]
  );

  const nextDueText = useMemo(() => {
    if (stats.nextDueMonth === null) return '¡Al día!';
    const name = getMonthName(stats.nextDueMonth);
    return `10 ${name.slice(0, 3)}`;
  }, [stats.nextDueMonth]);

  const paidRatioColor = useMemo(() => {
    if (stats.totalDue === 0) return '#059669';
    const ratio = stats.totalPaid / stats.totalDue;
    if (ratio >= 0.8) return '#059669';
    if (ratio >= 0.5) return '#D97706';
    return '#DC2626';
  }, [stats]);

  const openPaymentFlow = (childId, month) => {
    dispatch({ type: 'OPEN_PAYMENT_FLOW', preselect: { childId, month } });
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
      {/* Notification panel */}
      {showNotifications && (
        <div
          onClick={() => setShowNotifications(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 14,
              maxHeight: '55vh', overflow: 'auto',
              margin: '60px 12px 0',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              animation: 'slideNotif 0.2s ease-out',
            }}
          >
            <div style={{
              padding: '14px 16px', fontWeight: 700, fontSize: 15,
              color: '#111827', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Notificaciones</span>
              <button
                onClick={() => setShowNotifications(false)}
                style={{
                  background: '#F3F4F6', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconX size={14} color="#6B7280" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                Sin notificaciones
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  background: n.read ? 'white' : '#F0FDF4',
                  borderBottom: '1px solid #E2E8F0',
                }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#111827' }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0', lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>{n.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: 'max(20px, env(safe-area-inset-top)) 20px 36px',
        position: 'relative',
      }}>
        <div style={{ position: 'relative' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SchoolLogo size={34} white />
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', margin: 0, textTransform: 'uppercase' }}>
                  COLEGIO ALMAFUERTE
                </p>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>
                  Portal de Familias
                </p>
              </div>
            </div>
            <button
              onClick={handleBellPress}
              style={{
                background: 'none', border: 'none', position: 'relative',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IconBell size={22} color="white" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 16,
                  height: 16,
                  background: '#F9A825',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#1B5E20',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Greeting */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>Bienvenido,</p>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              Hola, {family.parent.firstName}
            </h2>
          </div>

          {/* Summary cards */}
          <div style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: -24,
          }}>
            <SummaryCard
              label="Hijos inscriptos"
              value={family.children.length}
              unit="alumnos"
            />
            <SummaryCard
              label="Cuotas al día"
              value={`${stats.totalPaid}/${stats.totalDue}`}
              valueColor={paidRatioColor}
            />
            <SummaryCard
              label="Próximo vencimiento"
              value={nextDueText}
              valueColor={stats.nextDueMonth && stats.nextDueMonth <= CURRENT_MONTH ? '#DC2626' : '#059669'}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 16px 0' }}>
        {/* Children section */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14, paddingLeft: 4 }}>
            Mis hijos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {family.children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                payments={payments}
                expanded={!!expandedChildren[child.id]}
                onToggle={() => toggleChild(child.id)}
                onPayMonth={(month) => openPaymentFlow(child.id, month)}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => dispatch({ type: 'OPEN_PAYMENT_FLOW' })}
            style={{
              width: '100%',
              padding: '16px',
              background: '#1B5E20',
              color: 'white',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              letterSpacing: '0.3px',
              cursor: 'pointer',
            }}
          >
            Pagar cuotas
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => dispatch({ type: 'NAVIGATE', screen: 'historial' })}
              style={{
                flex: 1,
                padding: '13px',
                background: 'white',
                color: '#374151',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
              }}
            >
              Ver historial
            </button>
            <button
              onClick={() => dispatch({ type: 'NAVIGATE', screen: 'comprobantes' })}
              style={{
                flex: 1,
                padding: '13px',
                background: 'white',
                color: '#374151',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
              }}
            >
              Mis comprobantes
            </button>
          </div>
        </div>

        {/* Pending notice */}
        {pendingCount > 0 && (
          <div style={{
            marginTop: 16,
            padding: '14px 16px',
            background: '#FFFBEB',
            borderRadius: 12,
            border: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              <IconAlertCircle size={18} color="#D97706" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#92400E', margin: 0 }}>
                {pendingCount} pago{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de verificación
              </p>
              <p style={{ fontSize: 12, color: '#B45309', margin: '2px 0 0', fontWeight: 500 }}>
                Se verificarán en 24-48hs hábiles
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit, valueColor }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '14px 16px',
      minWidth: 130,
      flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
    }}>
      <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 700, color: valueColor || '#111827', margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {unit && (
        <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, margin: '3px 0 0' }}>
          {unit}
        </p>
      )}
    </div>
  );
}

function ChildCard({ child, payments, expanded, onToggle, onPayMonth }) {
  const overallStatus = child.cuota === 0 ? 'ok' : getChildOverallStatus(child.id, payments);

  const statusDotColor = {
    ok: '#059669',
    pending: '#D97706',
    overdue: '#DC2626',
  }[overallStatus];

  const statusLabel = {
    ok: 'Al día',
    pending: 'Pendiente',
    overdue: 'Cuotas impagas',
  }[overallStatus];

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
    }}>
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 46,
          height: 46,
          borderRadius: '10px',
          background: child.color + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: child.color }}>
            {child.initial}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#111827' }}>{child.name}</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0', fontWeight: 500 }}>
            {child.grade} · Legajo {child.legajo}
          </p>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            background: statusDotColor + '18',
            fontSize: 11,
            fontWeight: 600,
            color: statusDotColor,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusDotColor,
              flexShrink: 0,
            }} />
            {statusLabel}
          </span>
          {expanded
            ? <IconChevronUp size={18} color="#9CA3AF" />
            : <IconChevronDown size={18} color="#9CA3AF" />
          }
        </div>
      </button>

      {/* Expanded months grid */}
      {expanded && (
        <div style={{
          padding: '0 16px 16px',
          animation: 'fadeIn 0.2s ease',
          borderTop: '1px solid #E2E8F0',
        }}>
          {child.cuota === 0 ? (
            <div style={{
              marginTop: 12, background: '#F0FDF4', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, fontWeight: 600,
              color: '#059669', textAlign: 'center',
            }}>
              Cuota cubierta por beca al 100%
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginTop: 12,
            }}>
              {MONTHS.map(m => (
                <MonthCell
                  key={m.num}
                  month={m}
                  childId={child.id}
                  payments={payments}
                  onPay={() => onPayMonth(m.num)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MonthCell({ month, childId, payments, onPay }) {
  const cellStatus = getMonthCellStatus(childId, month.num, payments);
  const payment = getPaymentForChildMonth(childId, month.num, payments);
  const cfg = statusConfig[cellStatus];

  const isClickable = cellStatus === 'impago';

  return (
    <button
      onClick={isClickable ? onPay : undefined}
      style={{
        padding: '10px 8px',
        borderRadius: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
        textAlign: 'center',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.1s ease',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', margin: '0 0 4px', textTransform: 'uppercase' }}>
        {month.short}
      </p>
      <p style={{ fontSize: 11, fontWeight: 700, color: cfg.color, margin: 0, lineHeight: 1.2 }}>
        {cfg.label}
      </p>
      {payment && cellStatus !== 'futuro' && (
        <p style={{ fontSize: 9, color: '#9CA3AF', margin: '3px 0 0', fontWeight: 500, lineHeight: 1.3 }}>
          {payment.fecha?.slice(0, 5)}
          {payment.metodo?.toLowerCase() === 'mercadopago' ? ' · MP' : ' · Transf'}
        </p>
      )}
      {cellStatus === 'impago' && (
        <p style={{ fontSize: 9, color: '#DC2626', fontWeight: 700, margin: '3px 0 0' }}>
          Tap para pagar
        </p>
      )}
    </button>
  );
}
