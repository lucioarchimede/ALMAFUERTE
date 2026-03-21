import { useState, useMemo } from 'react';
import { IconChevronDown, IconChevronUp, IconDownload, IconFilter, IconCreditCard, IconBanknote, IconSearch } from '../icons';
import { formatCurrency, methodLabel, methodColor, statusConfig, getMonthName, sortPaymentsNewestFirst } from '../utils';
import { MONTHS } from '../store';

export default function HistorialScreen({ state, dispatch, addToast }) {
  const { payments, family } = state;
  const [statusFilter, setStatusFilter] = useState('todos');
  const [childFilter, setChildFilter] = useState('todos');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    const result = [...payments].filter(p => {
      if (statusFilter === 'verificados' && p.estado !== 'verificado') return false;
      if (statusFilter === 'pendientes' && p.estado !== 'pendiente') return false;
      if (childFilter !== 'todos' && !p.studentIds?.includes(Number(childFilter))) return false;
      return true;
    });
    return sortPaymentsNewestFirst(result);
  }, [payments, statusFilter, childFilter]);

  const handleDownload = (payment) => {
    addToast('Comprobante descargado', 'success');
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: 'max(24px, env(safe-area-inset-top)) 20px 24px',
      }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1 }}>
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
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
                background: statusFilter === tab.key ? '#1B5E20' : '#F3F4F6',
                color: statusFilter === tab.key ? 'white' : '#6B7280',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
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
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: 'white',
            fontSize: 14,
            fontWeight: 600,
            color: '#111827',
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
          <EmptyState />
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

  const isMP = payment.metodo?.toLowerCase() === 'mercadopago';

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
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
          background: isMP ? '#EFF6FF' : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isMP
            ? <IconCreditCard size={18} color="#2563EB" />
            : <IconBanknote size={18} color="#374151" />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {concept}
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {childNames.join(', ')} · {payment.fecha}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: '#111827' }}>
            {formatCurrency(payment.monto)}
          </p>
          <span style={{
            display: 'inline-flex',
            padding: '2px 8px',
            borderRadius: 4,
            background: cfg.bg,
            color: cfg.color,
            fontSize: 11,
            fontWeight: 600,
          }}>
            {cfg.label}
          </span>
        </div>

        <div style={{ marginLeft: 4, flexShrink: 0 }}>
          {expanded
            ? <IconChevronUp size={16} color="#9CA3AF" />
            : <IconChevronDown size={16} color="#9CA3AF" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 16px 20px',
          borderTop: '1px solid #E2E8F0',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Per-child breakdown */}
          {(payment.studentIds || []).length > 1 && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 8px' }}>
                Alumnos incluidos
              </p>
              {(payment.studentIds || []).map(legajo => {
                const child = family.children.find(c => c.id === Number(legajo));
                return (
                  <div key={legajo} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #E2E8F0',
                  }}>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                      {child?.name || `Legajo ${legajo}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Meta */}
          <div style={{
            background: '#F8FAFC',
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
              background: '#F0FDF4',
              color: '#059669',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <IconDownload size={15} color="#059669" />
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
      <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: color || '#374151',
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

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <IconSearch size={36} color="#9CA3AF" />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>No se encontraron pagos</h3>
      <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>No hay pagos con los filtros seleccionados</p>
    </div>
  );
}
