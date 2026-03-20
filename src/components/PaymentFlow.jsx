import { useState, useMemo, useCallback } from 'react';
import {
  IconX, IconArrowLeft, IconCopy, IconCheck, AnimatedCheckmark, IconDownload,
} from '../icons';
import {
  formatCurrency, getAvailableMonths, computePaymentItems,
  generateConceptName, getDisplayDate,
  CURRENT_MONTH, CURRENT_YEAR, getMonthName,
} from '../utils';
import { MONTHS } from '../store';

// Steps: select-children | select-months | review | mp-loading | mp-success | transfer-details | transfer-confirm

export function PaymentFlow({ state, dispatch, addToast, onAddPayment }) {
  const { family, payments, paymentFlowPreselect } = state;

  const initialChildren = paymentFlowPreselect?.childId
    ? new Set([paymentFlowPreselect.childId])
    : new Set(family.children.map(c => c.id));

  const initialMonths = paymentFlowPreselect?.month
    ? new Set([paymentFlowPreselect.month])
    : new Set();

  const [step, setStep] = useState(paymentFlowPreselect ? 'select-months' : 'select-children');
  const [selectedChildren, setSelectedChildren] = useState(initialChildren);
  const [selectedMonths, setSelectedMonths] = useState(initialMonths);
  const [flowStep, setFlowStep] = useState(null); // null | 'mp-loading' | 'mp-success' | 'transfer-details' | 'transfer-confirm'
  const [pendingPayment, setPendingPayment] = useState(null);

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE_PAYMENT_FLOW' });
  }, [dispatch]);

  const toggleChild = (id) => {
    setSelectedChildren(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectedMonths(new Set()); // reset months when children change
  };

  const toggleAllChildren = () => {
    if (selectedChildren.size === family.children.length) {
      setSelectedChildren(new Set());
    } else {
      setSelectedChildren(new Set(family.children.map(c => c.id)));
    }
    setSelectedMonths(new Set());
  };

  const toggleMonth = (m) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const availableMonths = useMemo(() => {
    if (selectedChildren.size === 0) return [];
    return getAvailableMonths([...selectedChildren], payments);
  }, [selectedChildren, payments]);

  const paymentItems = useMemo(() => {
    if (selectedChildren.size === 0 || selectedMonths.size === 0) return [];
    return computePaymentItems(
      [...selectedChildren],
      [...selectedMonths].sort((a, b) => a - b),
      payments,
      family.children
    );
  }, [selectedChildren, selectedMonths, payments, family.children]);

  const totalAmount = useMemo(() => paymentItems.reduce((sum, item) => sum + item.amount, 0), [paymentItems]);

  const concept = useMemo(() => {
    const sortedMonths = [...selectedMonths].sort((a, b) => a - b);
    return generateConceptName(sortedMonths);
  }, [selectedMonths]);

  const handleMercadoPago = () => {
    setFlowStep('mp-loading');
    setTimeout(async () => {
      try {
        const paymentsToAdd = buildPayments('verificado', 'MercadoPago');
        for (const p of paymentsToAdd) {
          await onAddPayment(p);
        }
        setPendingPayment({
          concept,
          fecha: paymentsToAdd[0].fecha,
          referencia: paymentsToAdd[0].referencia,
          total: paymentsToAdd.reduce((s, p) => s + p.monto, 0),
        });
        setFlowStep('mp-success');
      } catch {
        setFlowStep(null);
        addToast('Error al procesar el pago. Intentá de nuevo.', 'error');
      }
    }, 2000);
  };

  const handleTransfer = () => {
    setFlowStep('transfer-details');
  };

  const handleTransferConfirm = async () => {
    try {
      const paymentsToAdd = buildPayments('pendiente', 'Transferencia');
      for (const p of paymentsToAdd) {
        await onAddPayment(p);
      }
      setPendingPayment({
        concept,
        fecha: paymentsToAdd[0].fecha,
        referencia: paymentsToAdd[0].referencia,
        total: paymentsToAdd.reduce((s, p) => s + p.monto, 0),
      });
      setFlowStep('transfer-confirm');
      addToast('Pago registrado. Se verificará en 24-48hs', 'info');
    } catch {
      addToast('Error al registrar el pago. Intentá de nuevo.', 'error');
    }
  };

  // Returns one Firestore payment document per selected month
  const buildPayments = (estado, metodo) => {
    const sortedMonths = [...selectedMonths].sort((a, b) => a - b);
    const fecha = getDisplayDate();
    const referencia = estado === 'verificado'
      ? `MP-${Date.now().toString().slice(-8)}`
      : `TRF-${Date.now().toString().slice(-8)}`;
    return sortedMonths.map(monthNum => {
      const itemsForMonth = paymentItems.filter(i => i.month === monthNum);
      const studentIds = itemsForMonth.map(i => Number(i.childId));
      const monto = itemsForMonth.reduce((sum, i) => sum + i.amount, 0);
      return {
        mes: getMonthName(monthNum),
        studentIds,
        monto,
        estado,
        metodo,
        fecha,
        referencia,
        familiaId: state.familiaId,
      };
    });
  };

  const handleGoHome = () => {
    dispatch({ type: 'NAVIGATE', screen: 'home' });
    close();
  };

  const handleDownloadReceipt = () => {
    addToast('Comprobante descargado ✓', 'success');
  };

  // Special full-screen states
  if (flowStep === 'mp-loading') {
    return (
      <FullOverlay>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <span style={{ fontSize: 28 }}>💳</span>
          </div>
          <p style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
            Conectando con MercadoPago...
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>
            No cerrés esta pantalla
          </p>
        </div>
      </FullOverlay>
    );
  }

  if (flowStep === 'mp-success') {
    return (
      <FullOverlay bg="#F5F5F0">
        <div style={{ width: '100%', maxWidth: 360, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, animation: 'scaleIn 0.4s ease' }}>
              <AnimatedCheckmark />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#2E7D32', margin: '0 0 8px' }}>
              ¡Pago realizado!
            </h2>
            <p style={{ color: '#616161', fontSize: 14, margin: 0 }}>
              Tu pago fue procesado exitosamente
            </p>
          </div>

          {/* Receipt summary */}
          {pendingPayment && (
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #F0F0F0' }}>
                <span style={{ fontSize: 13, color: '#9E9E9E', fontWeight: 600 }}>Concepto</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#212121', textAlign: 'right', maxWidth: '60%' }}>{pendingPayment.concept}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#9E9E9E', fontWeight: 600 }}>Fecha</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#212121' }}>{pendingPayment.fecha}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#9E9E9E', fontWeight: 600 }}>Referencia</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#616161', fontFamily: 'monospace' }}>{pendingPayment.referencia}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#9E9E9E', fontWeight: 600 }}>Método</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#009EE3' }}>MercadoPago</span>
              </div>
              <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '12px 14px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2E7D32' }}>Total pagado</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#2E7D32' }}>{formatCurrency(pendingPayment.total)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleDownloadReceipt}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              color: '#2E7D32',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              border: '2px solid #2E7D32',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <IconDownload size={18} color="#2E7D32" />
            Descargar comprobante
          </button>
          <button
            onClick={handleGoHome}
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
            }}
          >
            Volver al inicio
          </button>
        </div>
      </FullOverlay>
    );
  }

  if (flowStep === 'transfer-confirm') {
    return (
      <FullOverlay bg="#F5F5F0">
        <div style={{ width: '100%', maxWidth: 360, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: 'scaleIn 0.4s ease' }}>⏳</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#212121', margin: '0 0 8px' }}>
              Pago registrado
            </h2>
            <p style={{ color: '#616161', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Tu transferencia quedó registrada como{' '}
              <strong style={{ color: '#FF8F00' }}>pendiente</strong>.<br />
              Se verificará en <strong>24-48hs hábiles</strong>.
            </p>
          </div>

          {pendingPayment && (
            <div style={{ background: '#FFF8E1', borderRadius: 14, padding: '14px 16px', marginBottom: 20, border: '1px solid #FFD54F' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#E65100', margin: '0 0 4px' }}>
                {pendingPayment.concept}
              </p>
              <p style={{ fontSize: 12, color: '#BF360C', margin: 0, fontWeight: 500 }}>
                Ref: {pendingPayment.referencia} · {formatCurrency(pendingPayment.total)}
              </p>
            </div>
          )}

          <button
            onClick={handleGoHome}
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
            }}
          >
            Volver al inicio
          </button>
        </div>
      </FullOverlay>
    );
  }

  if (flowStep === 'transfer-details') {
    return <TransferDetails
      amount={totalAmount}
      reference={`${state.familiaId || 'FAM'}-${concept.replace(/\s+/g, '').slice(-8).toUpperCase()}`}
      onConfirm={handleTransferConfirm}
      onBack={() => setFlowStep(null)}
      addToast={addToast}
    />;
  }

  // Main sheet (steps 1-3)
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div
        onClick={close}
        style={{ flex: 1 }}
      />
      <div
        className="animate-slide-up"
        style={{
          background: '#F5F5F0',
          borderRadius: '24px 24px 0 0',
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, background: '#DDDDDD', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step !== 'select-children' && (
              <button
                onClick={() => setStep(step === 'select-months' ? 'select-children' : 'select-months')}
                style={{ background: 'none', padding: 4 }}
              >
                <IconArrowLeft size={20} color="#212121" />
              </button>
            )}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#212121', margin: 0, lineHeight: 1 }}>
                {step === 'select-children' && 'Seleccioná los alumnos'}
                {step === 'select-months' && 'Seleccioná las cuotas'}
                {step === 'review' && 'Revisá y pagá'}
              </h3>
              <p style={{ fontSize: 12, color: '#9E9E9E', margin: '3px 0 0', fontWeight: 500 }}>
                Paso {step === 'select-children' ? 1 : step === 'select-months' ? 2 : 3} de 3
              </p>
            </div>
          </div>
          <button onClick={close} style={{ background: 'none', padding: 4 }}>
            <IconX size={20} color="#616161" />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, padding: '0 20px 16px' }}>
          {[1, 2, 3].map(n => {
            const stepNum = step === 'select-children' ? 1 : step === 'select-months' ? 2 : 3;
            return (
              <div key={n} style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: n <= stepNum ? '#2E7D32' : '#DDDDDD',
                transition: 'background 0.3s ease',
              }} />
            );
          })}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {step === 'select-children' && (
            <StepSelectChildren
              family={family}
              selectedChildren={selectedChildren}
              onToggle={toggleChild}
              onToggleAll={toggleAllChildren}
            />
          )}
          {step === 'select-months' && (
            <StepSelectMonths
              availableMonths={availableMonths}
              selectedMonths={selectedMonths}
              onToggle={toggleMonth}
            />
          )}
          {step === 'review' && (
            <StepReview
              paymentItems={paymentItems}
              totalAmount={totalAmount}
              concept={concept}
              onMercadoPago={handleMercadoPago}
              onTransfer={handleTransfer}
            />
          )}
        </div>

        {/* Footer button */}
        {step !== 'review' && (
          <div style={{ padding: '18px 20px', background: '#F5F5F0', borderTop: '1px solid #EEEEEE' }}>
            <button
              onClick={() => {
                if (step === 'select-children') setStep('select-months');
                else if (step === 'select-months') setStep('review');
              }}
              disabled={
                (step === 'select-children' && selectedChildren.size === 0) ||
                (step === 'select-months' && selectedMonths.size === 0)
              }
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
              }}
            >
              {step === 'select-children' && `Continuar (${selectedChildren.size} alumn${selectedChildren.size === 1 ? 'o' : 'os'})`}
              {step === 'select-months' && `Continuar (${selectedMonths.size} cuota${selectedMonths.size === 1 ? '' : 's'})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepSelectChildren({ family, selectedChildren, onToggle, onToggleAll }) {
  const allSelected = selectedChildren.size === family.children.length;
  return (
    <div style={{ paddingBottom: 16 }}>
      <button
        onClick={onToggleAll}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: allSelected ? '#E8F5E9' : 'white',
          borderRadius: 12,
          border: `2px solid ${allSelected ? '#2E7D32' : '#EEEEEE'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          fontSize: 14,
          fontWeight: 700,
          color: allSelected ? '#2E7D32' : '#616161',
        }}
      >
        <span>Seleccionar todos</span>
        <Checkbox checked={allSelected} />
      </button>
      {family.children.map(child => {
        const selected = selectedChildren.has(child.id);
        return (
          <button
            key={child.id}
            onClick={() => onToggle(child.id)}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: selected ? child.color + '12' : 'white',
              borderRadius: 12,
              border: `2px solid ${selected ? child.color + '66' : '#EEEEEE'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: child.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: child.color }}>{child.initial}</span>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: '#212121' }}>{child.name}</p>
              <p style={{ fontSize: 12, color: '#9E9E9E', margin: '2px 0 0', fontWeight: 500 }}>
                {child.grade} · Legajo {child.legajo}
              </p>
            </div>
            <div style={{ textAlign: 'right', marginRight: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#2E7D32', margin: 0 }}>
                {formatCurrency(child.cuota)}
              </p>
              <p style={{ fontSize: 11, color: '#9E9E9E', margin: '2px 0 0' }}>por cuota</p>
            </div>
            <Checkbox checked={selected} color={child.color} />
          </button>
        );
      })}
    </div>
  );
}

function StepSelectMonths({ availableMonths, selectedMonths, onToggle }) {
  if (availableMonths.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
        <p style={{ fontWeight: 700, fontSize: 16, color: '#212121', margin: '0 0 8px' }}>
          ¡Todo al día!
        </p>
        <p style={{ fontSize: 14, color: '#9E9E9E', fontWeight: 500 }}>
          Los alumnos seleccionados no tienen cuotas pendientes de pago.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <p style={{ fontSize: 13, color: '#9E9E9E', fontWeight: 500, marginBottom: 14 }}>
        Seleccioná una o más cuotas para pagar
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {availableMonths.map(monthNum => {
          const month = MONTHS.find(m => m.num === monthNum);
          const selected = selectedMonths.has(monthNum);
          const isOverdue = monthNum <= CURRENT_MONTH;
          return (
            <button
              key={monthNum}
              onClick={() => onToggle(monthNum)}
              style={{
                padding: '10px 16px',
                borderRadius: 20,
                border: `2px solid ${selected ? '#2E7D32' : isOverdue ? '#E5393544' : '#EEEEEE'}`,
                background: selected
                  ? '#2E7D32'
                  : isOverdue
                    ? '#FFEBEE'
                    : 'white',
                color: selected ? 'white' : isOverdue ? '#E53935' : '#212121',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {isOverdue && !selected && <span style={{ fontSize: 11 }}>⚠</span>}
              {selected && <span style={{ fontSize: 11 }}>✓</span>}
              {month?.name}
              {isOverdue && <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}> (vencida)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({ paymentItems, totalAmount, concept, onMercadoPago, onTransfer }) {
  // Group by month
  const byMonth = {};
  for (const item of paymentItems) {
    if (!byMonth[item.month]) byMonth[item.month] = [];
    byMonth[item.month].push(item);
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{
        background: 'white',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
        border: '1px solid #EEEEEE',
      }}>
        {paymentItems.map((item, idx) => (
          <div key={`${item.childId}-${item.month}`} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '13px 16px',
            borderBottom: idx < paymentItems.length - 1 ? '1px solid #F5F5F5' : 'none',
          }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#212121' }}>
                {item.child.shortName}
              </p>
              <p style={{ fontSize: 12, color: '#9E9E9E', margin: '2px 0 0', fontWeight: 500 }}>
                Leg. {item.child.legajo} · Cuota {getMonthName(item.month)} {CURRENT_YEAR}
              </p>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#212121' }}>
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
        {/* Divider */}
        <div style={{ height: 1, background: '#2E7D32', opacity: 0.15, margin: '0 16px' }} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          background: '#E8F5E9',
        }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#2E7D32' }}>
            Total ({paymentItems.length} cuota{paymentItems.length !== 1 ? 's' : ''})
          </span>
          <span style={{ fontWeight: 900, fontSize: 22, color: '#2E7D32' }}>
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#9E9E9E', fontWeight: 600, marginBottom: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Elegí el método de pago
      </p>

      {/* MercadoPago */}
      <button
        onClick={onMercadoPago}
        style={{
          width: '100%',
          padding: '16px',
          background: '#009EE3',
          color: 'white',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,158,227,0.3)',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>💳</span>
        Pagar con MercadoPago
      </button>

      {/* Transfer */}
      <button
        onClick={onTransfer}
        style={{
          width: '100%',
          padding: '15px',
          background: 'white',
          color: '#212121',
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          border: '2px solid #DDDDDD',
        }}
      >
        🏦 Pagar por transferencia
      </button>
    </div>
  );
}

function TransferDetails({ amount, reference, onConfirm, onBack, addToast }) {
  const bankDetails = [
    { label: 'Banco', value: 'Banco Macro' },
    { label: 'CBU', value: '2850590940090418135201' },
    { label: 'Alias', value: 'colegio.almafuerte.pagos' },
    { label: 'Titular', value: 'Colegio Almafuerte SRL' },
    { label: 'Monto exacto', value: formatCurrency(amount) },
    { label: 'Referencia', value: reference },
  ];

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        addToast(`¡Copiado! ${label}`, 'success');
      }).catch(() => {
        addToast(`¡Copiado! ${label}`, 'success');
      });
    } else {
      addToast(`¡Copiado! ${label}`, 'success');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div style={{ flex: 1 }} />
      <div
        className="animate-slide-up"
        style={{
          background: '#F5F5F0',
          borderRadius: '24px 24px 0 0',
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, background: '#DDDDDD', borderRadius: 2 }} />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 20px 16px',
          borderBottom: '1px solid #EEEEEE',
        }}>
          <button onClick={onBack} style={{ background: 'none', padding: 4 }}>
            <IconArrowLeft size={20} color="#212121" />
          </button>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#212121', margin: 0 }}>
              Datos para transferencia
            </h3>
            <p style={{ fontSize: 12, color: '#9E9E9E', margin: '2px 0 0', fontWeight: 500 }}>
              Realizá la transferencia desde tu banco
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{
            background: '#1B5E20',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>Total a transferir</span>
            <span style={{ color: 'white', fontSize: 24, fontWeight: 900 }}>{formatCurrency(amount)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bankDetails.map(({ label, value }) => (
              <div key={label} style={{
                background: 'white',
                borderRadius: 12,
                padding: '13px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #EEEEEE',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#212121', margin: 0, wordBreak: 'break-all' }}>
                    {value}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(value, label)}
                  className="copy-btn"
                  style={{
                    background: '#E8F5E9',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    marginLeft: 10,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#2E7D32',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <IconCopy size={14} color="#2E7D32" />
                  Copiar
                </button>
              </div>
            ))}
          </div>

          <div style={{
            background: '#FFF8E1',
            borderRadius: 12,
            padding: '12px 14px',
            marginTop: 14,
            border: '1px solid #FFD54F',
          }}>
            <p style={{ fontSize: 12, color: '#E65100', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              ⚠️ <strong>Importante:</strong> Incluí la referencia exacta en el concepto de la transferencia para que podamos identificar tu pago.
            </p>
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: '#F5F5F0', borderTop: '1px solid #EEEEEE' }}>
          <button
            onClick={onConfirm}
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
            }}
          >
            ✓ Ya realicé la transferencia
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ checked, color = '#2E7D32' }) {
  return (
    <div style={{
      width: 22,
      height: 22,
      borderRadius: 6,
      border: `2px solid ${checked ? color : '#CCCCCC'}`,
      background: checked ? color : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.2s ease',
    }}>
      {checked && <IconCheck size={14} color="white" />}
    </div>
  );
}

function FullOverlay({ children, bg }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 800,
      background: bg || 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
    }}>
      {children}
    </div>
  );
}
