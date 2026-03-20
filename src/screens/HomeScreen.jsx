import { useState, useMemo } from 'react';
import {
  IconBell, IconChevronDown, IconChevronUp, SchoolLogo,
} from '../icons';
import {
  formatCurrency, getMonthCellStatus, getPaymentForChildMonth,
  getChildOverallStatus, getDashboardStats, statusConfig,
  CURRENT_MONTH, getMonthName,
} from '../utils';
import { MONTHS } from '../store';

export default function HomeScreen({ state, dispatch, addToast }) {
  const { family, payments } = state;
  const [expandedChildren, setExpandedChildren] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => getDashboardStats(family, payments), [family, payments]);

  if (!family) return null;

  const toggleChild = (id) => {
    setExpandedChildren(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

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
    if (stats.totalDue === 0) return '#43A047';
    const ratio = stats.totalPaid / stats.totalDue;
    if (ratio >= 0.8) return '#43A047';
    if (ratio >= 0.5) return '#FF8F00';
    return '#E53935';
  }, [stats]);

  const openPaymentFlow = (childId, month) => {
    dispatch({ type: 'OPEN_PAYMENT_FLOW', preselect: { childId, month } });
  };

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100%', paddingBottom: 24 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)',
        padding: '20px 20px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background dots */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />

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
              onClick={handleRefresh}
              style={{ background: 'none', position: 'relative', padding: 4 }}
            >
              <IconBell size={22} color="white" />
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  background: '#F9A825',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#1B5E20',
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Greeting */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>Bienvenido,</p>
            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              Hola, {family.parent.firstName} 👋
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
            {/* Card 1 */}
            <SummaryCard
              label="Hijos inscriptos"
              value={family.children.length}
              unit="alumnos"
              
            />
            {/* Card 2 */}
            <SummaryCard
              label="Cuotas al día"
              value={`${stats.totalPaid}/${stats.totalDue}`}
              valueColor={paidRatioColor}
              icon={stats.totalPaid === stats.totalDue ? '' : ''}
            />
            {/* Card 3 */}
            <SummaryCard
              label="Próximo vencimiento"
              value={nextDueText}
              valueColor={stats.nextDueMonth && stats.nextDueMonth <= CURRENT_MONTH ? '#E53935' : '#2E7D32'}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 16px 0' }}>
        {/* Refresh indicator */}
        {refreshing && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div className="spinner-green" />
          </div>
        )}

        {/* Children section */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#212121', marginBottom: 14, paddingLeft: 4 }}>
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
              background: 'linear-gradient(135deg, #2E7D32, #388E3C)',
              color: 'white',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 800,
              border: 'none',
              boxShadow: '0 4px 16px rgba(46,125,50,0.3)',
              letterSpacing: '0.3px',
            }}
          >
            💳 Pagar cuotas
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => dispatch({ type: 'NAVIGATE', screen: 'historial' })}
              style={{
                flex: 1,
                padding: '13px',
                background: 'white',
                color: '#2E7D32',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                border: '2px solid #2E7D32',
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
                color: '#2E7D32',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                border: '2px solid #2E7D32',
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
            background: '#FFF8E1',
            borderRadius: 12,
            border: '1px solid #FFD54F',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#E65100', margin: 0 }}>
                {pendingCount} pago{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de verificación
              </p>
              <p style={{ fontSize: 12, color: '#BF360C', margin: '2px 0 0', fontWeight: 500 }}>
                Se verificarán en 24-48hs hábiles
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit, icon, valueColor }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      padding: '14px 16px',
      minWidth: 130,
      flexShrink: 0,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 20, opacity: 0.15 }}>
        {icon}
      </div>
      <p style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: valueColor || '#212121', margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {unit && (
        <p style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 500, margin: '3px 0 0' }}>
          {unit}
        </p>
      )}
    </div>
  );
}

function ChildCard({ child, payments, expanded, onToggle, onPayMonth }) {
  // 100% beca children owe nothing — always show "Al día"
  const overallStatus = child.cuota === 0 ? 'ok' : getChildOverallStatus(child.id, payments);

  const statusDotColor = {
    ok: '#43A047',
    pending: '#FF8F00',
    overdue: '#E53935',
  }[overallStatus];

  const statusLabel = {
    ok: 'Al día',
    pending: 'Pendiente',
    overdue: 'Cuotas impagas',
  }[overallStatus];

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
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
          borderRadius: '50%',
          background: child.color + '22',
          border: `2px solid ${child.color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: child.color }}>
            {child.initial}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0, color: '#212121' }}>{child.name}</p>
          <p style={{ fontSize: 12, color: '#9E9E9E', margin: '2px 0 0', fontWeight: 500 }}>
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
            fontWeight: 700,
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
            ? <IconChevronUp size={18} color="#9E9E9E" />
            : <IconChevronDown size={18} color="#9E9E9E" />
          }
        </div>
      </button>

      {/* Expanded months grid */}
      {expanded && (
        <div style={{
          padding: '0 16px 16px',
          animation: 'fadeIn 0.2s ease',
          borderTop: '1px solid #F5F5F5',
        }}>
          {child.cuota === 0 ? (
            <div style={{
              marginTop: 12, background: '#ECFDF5', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, fontWeight: 600,
              color: '#059669', textAlign: 'center',
            }}>
              ✓ Cuota cubierta por beca al 100%
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
      <p style={{ fontSize: 11, fontWeight: 700, color: '#616161', margin: '0 0 4px', textTransform: 'uppercase' }}>
        {month.short}
      </p>
      <p style={{ fontSize: 11, fontWeight: 800, color: cfg.color, margin: 0, lineHeight: 1.2 }}>
        {cfg.label}
      </p>
      {payment && cellStatus !== 'futuro' && (
        <p style={{ fontSize: 9, color: '#9E9E9E', margin: '3px 0 0', fontWeight: 500, lineHeight: 1.3 }}>
          {payment.fecha?.slice(0, 5)}
          {payment.metodo?.toLowerCase() === 'mercadopago' ? ' · MP' : ' · Transf'}
        </p>
      )}
      {cellStatus === 'impago' && (
        <p style={{ fontSize: 9, color: '#E53935', fontWeight: 700, margin: '3px 0 0' }}>
          Tap para pagar
        </p>
      )}
    </button>
  );
}
