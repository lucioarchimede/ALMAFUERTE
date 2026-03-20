import { useState, useMemo } from 'react';
import { IconDownload, IconFileText } from '../icons';
import { formatCurrency, statusConfig, methodLabel, monthNameToNum } from '../utils';
import { MONTHS } from '../store';

const parseDate = (dateStr) => {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // parts[0] = day, parts[1] = month, parts[2] = year
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
  }
  return 0;
};

export default function ComprobantesScreen({ state, dispatch, addToast }) {
  const { payments, family } = state;
  const [childFilter, setChildFilter] = useState('todos');
  const [monthFilter, setMonthFilter] = useState('todos');

  const filtered = useMemo(() => {
    return [...payments].filter(p => {
      if (childFilter !== 'todos' && !p.studentIds?.includes(Number(childFilter))) return false;
      if (monthFilter !== 'todos') {
        const monthObj = MONTHS.find(m => String(m.num) === monthFilter);
        if (!monthObj || p.mes !== monthObj.name) return false;
      }
      return true;
    }).sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha));
  }, [payments, childFilter, monthFilter]);

  const handleDownload = () => {
    addToast('Comprobante descargado ✓', 'success');
  };

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 100%)',
        padding: '24px 20px 24px',
      }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>
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
        borderBottom: '1px solid #EEEEEE',
        display: 'flex',
        gap: 10,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <select
          value={childFilter}
          onChange={e => setChildFilter(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 10,
            border: '2px solid #EEEEEE',
            background: 'white',
            fontSize: 13,
            fontWeight: 600,
            color: '#212121',
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
            borderRadius: 10,
            border: '2px solid #EEEEEE',
            background: 'white',
            fontSize: 13,
            fontWeight: 600,
            color: '#212121',
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
    return child?.shortName || String(id);
  });
  const concept = payment.mes ? `Cuota ${payment.mes}` : 'Pago';

  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      border: '1px solid #F0F0F0',
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
          <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 2px', color: '#212121', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {concept}
          </p>
          <p style={{ fontSize: 12, color: '#9E9E9E', margin: '0 0 4px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {childNames.join(', ')} · {payment.fecha}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: 20,
              background: cfg.bg,
              color: cfg.color,
              fontSize: 10,
              fontWeight: 700,
            }}>
              {cfg.label}
            </span>
            {payment.referencia && (
              <span style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 500, fontFamily: 'monospace' }}>
                {payment.referencia}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 15, margin: '0 0 8px', color: '#212121' }}>
            {formatCurrency(payment.monto)}
          </p>
          <button
            onClick={onDownload}
            style={{
              background: '#E8F5E9',
              border: 'none',
              borderRadius: 8,
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#2E7D32',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <IconDownload size={13} color="#2E7D32" />
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
      <p style={{ fontSize: 56, marginBottom: 16 }}>📄</p>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#424242', margin: '0 0 8px' }}>
        Aún no hay comprobantes
      </h3>
      <p style={{ fontSize: 14, color: '#9E9E9E', fontWeight: 500, lineHeight: 1.6 }}>
        Los comprobantes aparecen aquí automáticamente cuando realizás un pago
      </p>
    </div>
  );
}
