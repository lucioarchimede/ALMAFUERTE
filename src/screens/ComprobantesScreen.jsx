import { useState, useMemo } from 'react';
import { IconDownload, IconFileText } from '../icons';
import { formatCurrency, statusConfig, methodLabel, monthNameToNum, sortPaymentsNewestFirst } from '../utils';
import { MONTHS } from '../store';

export default function ComprobantesScreen({ state, dispatch, addToast }) {
  const { payments, family } = state;
  const [childFilter, setChildFilter] = useState('todos');
  const [monthFilter, setMonthFilter] = useState('todos');

  const filtered = useMemo(() => {
    const result = [...payments].filter(p => {
      if (childFilter !== 'todos' && !p.studentIds?.includes(Number(childFilter))) return false;
      if (monthFilter !== 'todos') {
        const monthObj = MONTHS.find(m => String(m.num) === monthFilter);
        if (!monthObj || p.mes !== monthObj.name) return false;
      }
      return true;
    });
    return sortPaymentsNewestFirst(result);
  }, [payments, childFilter, monthFilter]);

  const handleDownload = () => {
    addToast('Comprobante descargado', 'success');
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: 'max(24px, env(safe-area-inset-top)) 20px 24px',
      }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Mis comprobantes
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '6px 0 0', fontWeight: 500 }}>
          {payments.length} comprobante{payments.length !== 1 ? 's' : ''} disponible{payments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px 16px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        gap: 10,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <select
          value={childFilter}
          onChange={e => setChildFilter(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: 'white',
            fontSize: 13,
            fontWeight: 600,
            color: '#111827',
            cursor: 'pointer',
          }}
        >
          <option value="todos">Todos los alumnos</option>
          {(family?.children || []).map(child => (
            <option key={child.id} value={String(child.id)}>{child.shortName}</option>
          ))}
        </select>

        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: 'white',
            fontSize: 13,
            fontWeight: 600,
            color: '#111827',
            cursor: 'pointer',
          }}
        >
          <option value="todos">Todos los meses</option>
          {MONTHS.map(m => (
            <option key={m.num} value={String(m.num)}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px 24px' }}>
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(payment => (
              <ReceiptCard
                key={payment.id}
                payment={payment}
                family={family}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptCard({ payment, family, onDownload }) {
  const cfg = statusConfig[payment.estado] || statusConfig.pendiente;
  const childNames = (payment.studentIds || []).map(id => {
    const child = family?.children.find(c => c.id === Number(id));
    return child ? `${child.shortName} (Leg. ${child.legajo})` : `Leg. ${id}`;
  });
  const concept = payment.mes ? `Cuota ${payment.mes}` : 'Pago';

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'stretch',
    }}>
      {/* Color accent */}
      <div style={{
        width: 4,
        background: cfg.color,
        flexShrink: 0,
      }} />

      <div style={{ flex: 1, padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: cfg.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconFileText size={20} color={cfg.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {concept}
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {childNames.join(', ')} · {payment.fecha}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: cfg.bg,
              color: cfg.color,
              fontSize: 11,
              fontWeight: 600,
            }}>
              {cfg.label}
            </span>
            {payment.referencia && (
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, fontFamily: 'monospace' }}>
                {payment.referencia}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 8px', color: '#111827' }}>
            {formatCurrency(payment.monto)}
          </p>
          <button
            onClick={onDownload}
            style={{
              background: '#F0FDF4',
              border: 'none',
              borderRadius: 8,
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#059669',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <IconDownload size={13} color="#059669" />
            Bajar
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <IconFileText size={36} color="#9CA3AF" />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>
        Aún no hay comprobantes
      </h3>
      <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500, lineHeight: 1.6 }}>
        Los comprobantes aparecen aquí automáticamente cuando realizás un pago
      </p>
    </div>
  );
}
