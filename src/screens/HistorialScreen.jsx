import { useState, useMemo } from 'react';
import { IconChevronDown, IconChevronUp, IconDownload, IconFilter } from '../icons';
import { formatCurrency, methodLabel, methodColor, statusConfig, getMonthName } from '../utils';
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

export default function HistorialScreen({ state, dispatch, addToast }) {
  const { payments, family } = state;
  const [statusFilter, setStatusFilter] = useState('todos');
  const [childFilter, setChildFilter] = useState('todos');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    return [...payments].filter(p => {
      if (statusFilter === 'verificados' && p.estado !== 'verificado') return false;
      if (statusFilter === 'pendientes' && p.estado !== 'pendiente') return false;
      if (childFilter !== 'todos' && !p.studentIds?.includes(Number(childFilter))) return false;
      return true;
    }).sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha));
  }, [payments, statusFilter, childFilter]);

  const handleDownload = (payment) => {
    addToast('Comprobante descargado ✓', 'success');
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 100%)',
        padding: '24px 20px 24px',
      }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1 }}>
          Historial de pagos
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '6px 0 0', fontWeight: 500 }}>
          {payments.length} pago{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px 16px',
        borderBottom: '1px solid #EEEEEE',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'verificados', label: 'Verificados' },
            { key: 'pendientes', label: 'Pendientes' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: 'none',
                background: statusFilter === tab.key ? '#2E7D32' : '#F0F0F0',
                color: statusFilter === tab.key ? 'white' : '#616161',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Child filter */}
        <select
          value={childFilter}
          onChange={e => setChildFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '2px solid #EEEEEE',
            background: 'white',
            fontSize: 14,
            fontWeight: 600,
            color: '#212121',
            cursor: 'pointer',
          }}
        >
          <option value="todos">Todos los alumnos</option>
          {family.children.map(child => (
            <option key={child.id} value={String(child.id)}>{child.shortName}</option>
          ))}
        </select>
      </div>

      {/* Payment list */}
      <div style={{ padding: '12px 16px 24px' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No se encontraron pagos"
            subtitle="No hay pagos con los filtros seleccionados"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(payment => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                family={family}
                expanded={expandedId === payment.id}
                onToggle={() => toggleExpand(payment.id)}
                onDownload={() => handleDownload(payment)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentCard({ payment, family, expanded, onToggle, onDownload }) {
  const cfg = statusConfig[payment.estado] || statusConfig.pendiente;
  const childNames = (payment.studentIds || []).map(id => {
    const child = family.children.find(c => c.id === Number(id));
    return child ? `${child.shortName} (Leg. ${child.legajo})` : `Leg. ${id}`;
  });
  const concept = payment.mes ? `Cuota ${payment.mes}` : 'Pago';

  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      border: '1px solid #F0F0F0',
    }}>
      {/* Main row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Method icon */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: payment.metodo?.toLowerCase() === 'mercadopago' ? '#E3F2FD' : '#E8F5E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 18,
        }}>
          {payment.metodo?.toLowerCase() === 'mercadopago' ? '💳' : '🏦'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: '#212121', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {concept}
          </p>
          <p style={{ fontSize: 12, color: '#9E9E9E', margin: '3px 0 0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {childNames.join(', ')} · {payment.fecha}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 15, margin: '0 0 4px', color: '#212121' }}>
            {formatCurrency(payment.monto)}
          </p>
          <span style={{
            display: 'inline-flex',
            padding: '3px 8px',
            borderRadius: 20,
            background: cfg.bg,
            color: cfg.color,
            fontSize: 10,
            fontWeight: 700,
          }}>
            {cfg.label}
          </span>
        </div>

        <div style={{ marginLeft: 4, flexShrink: 0 }}>
          {expanded
            ? <IconChevronUp size={16} color="#9E9E9E" />
            : <IconChevronDown size={16} color="#9E9E9E" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 16px 20px',
          borderTop: '1px solid #F5F5F5',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Per-child breakdown */}
          {(payment.studentIds || []).length > 1 && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 8px' }}>
                Alumnos incluidos
              </p>
              {(payment.studentIds || []).map(legajo => {
                const child = family.children.find(c => c.id === Number(legajo));
                return (
                  <div key={legajo} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #F5F5F5',
                  }}>
                    <span style={{ fontSize: 13, color: '#424242', fontWeight: 600 }}>
                      {child?.name || `Legajo ${legajo}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Meta */}
          <div style={{
            background: '#F9F9F9',
            borderRadius: 10,
            padding: '10px 12px',
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <MetaRow label="Referencia" value={payment.referencia} mono />
            <MetaRow label="Fecha" value={payment.fecha} />
            <MetaRow label="Método" value={methodLabel(payment.metodo)} color={methodColor(payment.metodo)} />
          </div>

          {/* Download */}
          <button
            onClick={onDownload}
            style={{
              width: '100%',
              padding: '11px',
              background: '#E8F5E9',
              color: '#2E7D32',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <IconDownload size={15} color="#2E7D32" />
            Descargar comprobante
          </button>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, mono, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#9E9E9E', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: color || '#424242',
        fontFamily: mono ? 'monospace' : 'inherit',
        maxWidth: '65%',
        textAlign: 'right',
        wordBreak: 'break-all',
      }}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      animation: 'fadeIn 0.3s ease',
    }}>
      <p style={{ fontSize: 56, marginBottom: 16 }}>{icon}</p>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#424242', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#9E9E9E', fontWeight: 500 }}>{subtitle}</p>
    </div>
  );
}
