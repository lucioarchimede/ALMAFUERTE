import { useState, useMemo, useCallback, useRef } from 'react';
import { sortPaymentsNewestFirst } from '../utils';
import { IconBarChart, IconCreditCard, IconUsers, IconSettings, IconBanknote, IconDollarSign, IconSearch, IconCheckCircle, IconAlertCircle } from '../icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
// Dynamic current month index in the school-year array (Feb=0, Mar=1, Apr=2…)
const _adminNow = new Date();
const CM = Math.max(0, Math.min(_adminNow.getMonth() - 1, MONTHS.length - 1));

const NIVELES = ['Jardín', 'Primaria', 'Secundaria'];
const BECAS = [0, 0.1, 0.25, 0.50, 0.75, 1];
const METODOS = ['MercadoPago', 'Transferencia', 'Efectivo'];

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  green: '#1B5E20',
  greenMid: '#2E7D32',
  greenLight: '#43A047',
  greenBg: '#ECFDF5',
  greenText: '#065F46',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  amberText: '#92400E',
  red: '#DC2626',
  redBg: '#FEF2F2',
  redText: '#991B1B',
  gray: '#6B7280',
  grayBg: '#F3F4F6',
  grayText: '#374151',
  purple: '#7C3AED',
  purpleBg: '#F5F3FF',
  purpleText: '#5B21B6',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E8ECF0',
  text: '#1F2937',
  textMid: '#4B5563',
  textLight: '#9CA3AF',
  font: "'IBM Plex Sans', -apple-system, sans-serif",
};

const STATUS_CFG = {
  verificado: { label: 'Verificado', color: T.greenLight, bg: T.greenBg, text: T.greenText },
  pendiente: { label: 'Pendiente', color: T.amber, bg: T.amberBg, text: T.amberText },
  rechazado: { label: 'Rechazado', color: T.red, bg: T.redBg, text: T.redText },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (n) => '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 });

const normalizeStr = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const famLabel = (id) => id ? (id.startsWith('FAM-') ? id : `FAM-${id}`) : '';

// Deterministic accent color per family (for left border visual differentiation)
const FAMILY_BORDER_COLORS = ['#2E7D32','#1565C0','#E65100','#6A1B9A','#00838F','#AD1457','#F57F17','#4527A0'];
const getFamilyColor = (familiaId) => {
  if (!familiaId) return FAMILY_BORDER_COLORS[0];
  let hash = 0;
  const s = String(familiaId);
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return FAMILY_BORDER_COLORS[Math.abs(hash) % FAMILY_BORDER_COLORS.length];
};

// ─── Shared micro-components ──────────────────────────────────────────────────

function StatusBadge({ estado }) {
  const cfg = STATUS_CFG[estado] || { label: estado || 'Desconocido', bg: T.grayBg, text: T.grayText };
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 20,
      background: cfg.bg, color: cfg.text,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name, color }) {
  const initials = name ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: color || 'linear-gradient(135deg,#1B5E20,#2E7D32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderRadius: 12, ...style,
    }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, style, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 18px', borderRadius: 10, border: 'none',
        background: danger
          ? T.red
          : T.green,
        color: 'white', fontSize: 14, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: T.font,
        transition: 'opacity 0.15s, transform 0.1s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 16px', borderRadius: 10,
        border: `1.5px solid ${T.border}`,
        background: 'white', color: T.textMid,
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: T.font,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({ label, type = 'text', value, onChange, placeholder, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          padding: '10px 12px', borderRadius: 8,
          border: `1.5px solid ${T.border}`,
          fontSize: 14, fontFamily: T.font, color: T.text,
          background: T.white, outline: 'none', width: '100%',
          boxSizing: 'border-box', ...style,
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={{
          padding: '10px 12px', borderRadius: 8,
          border: `1.5px solid ${T.border}`,
          fontSize: 14, fontFamily: T.font, color: T.text,
          background: T.white, cursor: 'pointer',
          width: '100%', boxSizing: 'border-box', ...style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminView({
  allStudents = [],
  rates = {},
  payments = [],
  onBack,
  onUpdatePayment,
  onAddPayment,
  onUpdateRate,
  onUpdateStudent,
}) {
  const [tab, setTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);  // null | 'debtors' | 'addPayment' | 'editStudent'
  const [editingStudent, setEditingStudent] = useState(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [expandedStudentLegajo, setExpandedStudentLegajo] = useState(null);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('todos');
  const [studentSearch, setStudentSearch] = useState('');
  const [bulkConfirm, setBulkConfirm] = useState(null); // null | { type: 'verify'|'reopen', count, payments }

  // ── Helpers ──

  const getCuota = useCallback((student) => {
    const rate = rates[student.nivel] || 0;
    return rate * (1 - (student.beca || 0));
  }, [rates]);

  // Returns 'ok' | 'pen' | 'no'
  const gs = useCallback((legajo, mes) => {
    const p = payments.find(pay =>
      Array.isArray(pay.studentIds) && pay.studentIds.includes(legajo) && pay.mes === mes
    );
    if (!p) return 'no';
    if (p.estado === 'verificado') return 'ok';
    if (p.estado === 'pendiente') return 'pen';
    return 'no';
  }, [payments]);

  const getStudentName = useCallback((legajo) => {
    const s = allStudents.find(st => st.legajo === legajo || String(st.legajo) === String(legajo));
    return s ? `${s.apellido} ${s.nombre}` : `Legajo ${legajo}`;
  }, [allStudents]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Computed ──

  const dueMonths = MONTHS.slice(0, CM + 1); // Feb, Mar, Abr

  const kpis = useMemo(() => {
    const recaudado = payments.filter(p => p.estado === 'verificado').reduce((s, p) => s + (p.monto || 0), 0);
    const pendiente = payments.filter(p => p.estado === 'pendiente').reduce((s, p) => s + (p.monto || 0), 0);
    const familiesWithDebt = new Set();
    let deudaTotal = 0;
    for (const st of allStudents) {
      const cuota = getCuota(st);
      if (cuota <= 0) continue; // skip 100% beca students ($0 fee)
      for (const mes of dueMonths) {
        if (gs(st.legajo, mes) === 'no') {
          deudaTotal += cuota;
          familiesWithDebt.add(st.familiaId);
        }
      }
    }
    const totalFamilias = new Set(allStudents.map(s => s.familiaId).filter(Boolean)).size;
    return { recaudado, pendiente, conDeuda: familiesWithDebt.size, totalFamilias, deudaTotal };
  }, [payments, allStudents, gs, getCuota, dueMonths]);

  const monthlyRevenue = useMemo(() => {
    return MONTHS.slice(0, CM + 1).map((mes, idx) => ({
      mes,
      short: MONTHS_SHORT[idx],
      verified: payments.filter(p => p.mes === mes && p.estado === 'verificado').reduce((s, p) => s + (p.monto || 0), 0),
      pending: payments.filter(p => p.mes === mes && p.estado === 'pendiente').reduce((s, p) => s + (p.monto || 0), 0),
    }));
  }, [payments]);

  const debtors = useMemo(() => {
    // Group by family; skip students with $0 fee (100% beca)
    const familyMap = {};
    for (const student of allStudents) {
      const cuota = getCuota(student);
      if (cuota <= 0) continue;
      const fid = student.familiaId || '__sin_familia__';
      if (!familyMap[fid]) {
        familyMap[fid] = {
          familiaId: fid,
          apellido: student.apellido,
          responsable: student.responsable || '',
          email: student.email || '',
          telefono: student.telefono || '',
          students: [],
          unpaidMonths: new Set(),
          totalDebt: 0,
        };
      }
      const family = familyMap[fid];
      const studentOwed = [];
      for (const mes of dueMonths) {
        if (gs(student.legajo, mes) === 'no') {
          studentOwed.push(mes);
          family.unpaidMonths.add(mes);
          family.totalDebt += cuota;
        }
      }
      if (studentOwed.length > 0) {
        family.students.push({ ...student, cuota, owedMonths: studentOwed });
      }
    }
    return Object.values(familyMap)
      .filter(f => f.students.length > 0)
      .map(f => ({ ...f, unpaidMonths: [...f.unpaidMonths] }))
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [allStudents, gs, getCuota, dueMonths]);

  const accumulatedDebtFamilies = useMemo(() => {
    // Group students by familiaId — skip 100%-beca students (cuota = $0)
    const familyGroups = {};
    for (const student of allStudents) {
      if (getCuota(student) === 0) continue;
      const fid = student.familiaId || '__sin_familia__';
      if (!familyGroups[fid]) {
        familyGroups[fid] = {
          familiaId: fid,
          apellido: student.apellido,
          responsable: student.responsable || '',
          email: student.email || '',
          telefono: student.telefono || '',
          students: [],
        };
      }
      familyGroups[fid].students.push(student);
    }
    const result = [];
    for (const family of Object.values(familyGroups)) {
      // A month is "unpaid" for the family if ANY of its students hasn't paid it
      const unpaidMonthSet = new Set();
      for (const student of family.students) {
        for (const mes of dueMonths) {
          if (gs(student.legajo, mes) === 'no') unpaidMonthSet.add(mes);
        }
      }
      if (unpaidMonthSet.size < 2) continue;
      const unpaidMonths = [...unpaidMonthSet];
      const totalDebt = family.students.reduce((sum, st) => sum + unpaidMonths.length * getCuota(st), 0);
      result.push({ ...family, unpaidMonthCount: unpaidMonths.length, unpaidMonths, totalDebt });
    }
    return result.sort((a, b) => b.unpaidMonthCount - a.unpaidMonthCount || b.totalDebt - a.totalDebt);
  }, [allStudents, gs, getCuota, dueMonths]);

  const filteredPayments = useMemo(() => {
    return [...payments].filter(p => {
      if (paymentSearch) {
        const q = normalizeStr(paymentSearch);
        const names = normalizeStr((p.studentIds || []).map(getStudentName).join(' '));
        const ref = (p.referencia || '').toLowerCase();
        const fid = String(p.familiaId || '').toLowerCase();
        const legs = (p.studentIds || []).map(String).join(' ');
        if (!names.includes(q) && !ref.includes(q) && !fid.includes(q) && !legs.includes(q)) return false;
      }
      if (paymentFilter !== 'todos' && p.estado !== paymentFilter) return false;
      return true;
    });
    return sortPaymentsNewestFirst(result);
  }, [payments, paymentSearch, paymentFilter, getStudentName]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return allStudents;
    const q = normalizeStr(studentSearch);
    return allStudents.filter(s =>
      normalizeStr(s.nombre).includes(q) ||
      normalizeStr(s.apellido).includes(q) ||
      String(s.legajo).includes(q) ||
      String(s.familiaId || '').toLowerCase().includes(q) ||
      famLabel(s.familiaId).toLowerCase().includes(q) ||
      normalizeStr(s.email || '').includes(q) ||
      normalizeStr(s.responsable || '').includes(q)
    );
  }, [allStudents, studentSearch]);

  // ── Action handlers ──

  const handleUpdatePayment = async (paymentId, newStatus) => {
    try {
      await onUpdatePayment?.(paymentId, newStatus);
      const labels = { verificado: '✓ Pago verificado', pendiente: '↩ Revertido a pendiente', rechazado: '✕ Pago rechazado' };
      showToast(labels[newStatus] || 'Actualizado');
    } catch (e) {
      showToast('Error al actualizar', 'error');
    }
  };

  const handleAddPayment = async (data) => {
    try {
      await onAddPayment?.(data);
      setModal(null);
      showToast('✓ Pago registrado correctamente');
    } catch (e) {
      showToast('Error al registrar pago', 'error');
    }
  };

  const handleUpdateStudent = async (studentData) => {
    try {
      await onUpdateStudent?.(studentData);
      setModal(null);
      setEditingStudent(null);
      showToast('✓ Alumno actualizado');
    } catch (e) {
      showToast('Error al actualizar alumno', 'error');
    }
  };

  const handleBulkUpdate = async (paymentsToUpdate, newStatus) => {
    try {
      for (const p of paymentsToUpdate) {
        await onUpdatePayment?.(p.id, newStatus);
      }
      setBulkConfirm(null);
      const label = newStatus === 'verificado'
        ? `✓ ${paymentsToUpdate.length} pago${paymentsToUpdate.length !== 1 ? 's' : ''} verificado${paymentsToUpdate.length !== 1 ? 's' : ''}`
        : `↩ ${paymentsToUpdate.length} pago${paymentsToUpdate.length !== 1 ? 's' : ''} revertido${paymentsToUpdate.length !== 1 ? 's' : ''} a pendiente`;
      showToast(label);
    } catch (e) {
      showToast('Error en la operación', 'error');
    }
  };

  // ── Render ──

  const shell = {
    margin: '0 auto',
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: T.bg,
    fontFamily: T.font,
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div style={shell}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1B5E20,#2E7D32)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', cursor: 'pointer', fontSize: 14, fontFamily: T.font }}
          >
            ← Volver
          </button>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>Panel Administrativo</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
              {allStudents.length} alumnos · {payments.length} pagos
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)', borderRadius: 8,
          padding: '5px 10px', color: 'white', fontSize: 12, fontWeight: 600,
        }}>
          Admin
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 80 }}>
        {tab === 'dashboard' && (
          <DashboardTab
            kpis={kpis}
            monthlyRevenue={monthlyRevenue}
            payments={payments}
            getStudentName={getStudentName}
            allStudents={allStudents}
            getCuota={getCuota}
            accumulatedDebtFamilies={accumulatedDebtFamilies}
            onOpenDebtors={() => setModal('debtors')}
            onOpenAddPayment={() => setModal('addPayment')}
            onNavigatePayments={() => setTab('pagos')}
          />
        )}
        {tab === 'pagos' && (
          <PagosTab
            filteredPayments={filteredPayments}
            allPayments={payments}
            search={paymentSearch}
            filter={paymentFilter}
            expandedId={expandedPaymentId}
            getStudentName={getStudentName}
            allStudents={allStudents}
            getCuota={getCuota}
            onSearch={setPaymentSearch}
            onFilter={setPaymentFilter}
            onToggleExpand={(id) => setExpandedPaymentId(prev => prev === id ? null : id)}
            onUpdatePayment={handleUpdatePayment}
            onOpenAdd={() => setModal('addPayment')}
            onBulkAction={(type, pmts) => setBulkConfirm({ type, count: pmts.length, payments: pmts })}
          />
        )}
        {tab === 'alumnos' && (
          <AlumnosTab
            students={filteredStudents}
            search={studentSearch}
            payments={payments}
            gs={gs}
            getCuota={getCuota}
            getStudentName={getStudentName}
            onSearch={setStudentSearch}
            onEdit={(student) => { setEditingStudent(student); setModal('editStudent'); }}
          />
        )}
        {tab === 'config' && (
          <ConfigTab
            rates={rates}
            allStudents={allStudents}
            getCuota={getCuota}
            onUpdateRate={handleUpdateRate}
            showToast={showToast}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
      }}>
        <div style={{
          background: T.white,
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'stretch',
          boxShadow: '0 -1px 4px rgba(0,0,0,0.04)',
        }}>
        {[
          { id: 'dashboard', label: 'Dashboard', Icon: IconBarChart },
          { id: 'pagos', label: 'Pagos', Icon: IconCreditCard },
          { id: 'alumnos', label: 'Alumnos', Icon: IconUsers },
          { id: 'config', label: 'Config', Icon: IconSettings },
        ].map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, color: active ? T.green : T.textLight, fontFamily: T.font,
                minHeight: 50, padding: '8px 0 4px', position: 'relative',
              }}
            >
              {active && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: T.green, borderRadius: '0 0 3px 3px' }} />}
              <Icon size={20} color={active ? T.green : T.textLight} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500 }}>{label}</span>
            </button>
          );
        })}
        </div>
        <div style={{ background: T.white, height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>

      {/* Modals */}
      {modal === 'debtors' && (
        <DebtorsModal debtors={debtors} onClose={() => setModal(null)} />
      )}
      {modal === 'addPayment' && (
        <AddPaymentModal
          allStudents={allStudents}
          rates={rates}
          getCuota={getCuota}
          onSubmit={handleAddPayment}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'editStudent' && editingStudent && (
        <EditStudentModal
          student={editingStudent}
          rates={rates}
          getCuota={getCuota}
          onSubmit={handleUpdateStudent}
          onClose={() => { setModal(null); setEditingStudent(null); }}
        />
      )}

      {/* Bulk confirm dialog */}
      {bulkConfirm && (
        <ConfirmDialog
          type={bulkConfirm.type}
          count={bulkConfirm.count}
          onConfirm={() => handleBulkUpdate(
            bulkConfirm.payments,
            bulkConfirm.type === 'verify' ? 'verificado' : 'pendiente'
          )}
          onCancel={() => setBulkConfirm(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: toast.type === 'error' ? T.red : T.green,
          color: 'white', padding: '10px 20px', borderRadius: 10,
          fontFamily: T.font, fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          animation: 'slideInDown 0.25s ease', whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );

  function handleUpdateRate(nivel, value) {
    onUpdateRate?.(nivel, value);
    showToast(`✓ Cuota ${nivel} actualizada`);
  }
}

// ─── AccumulatedDebtAlert ─────────────────────────────────────────────────────

function AccumulatedDebtAlert({ families, onOpenDebtors }) {
  if (families.length === 0) {
    return (
      <div style={{
        background: '#ECFDF5', border: '1px solid #A7F3D0',
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <IconCheckCircle size={20} color="#059669" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>Sin deuda acumulada</div>
          <div style={{ fontSize: 11, color: '#34D399', marginTop: 2 }}>Ninguna familia debe más de 1 mes</div>
        </div>
      </div>
    );
  }

  const displayed = families.slice(0, 5);
  const remaining = families.length - displayed.length;
  const grandTotal = families.reduce((s, f) => s + f.totalDebt, 0);

  return (
    <div style={{
      background: '#FEF2F2', border: '2px solid #FECACA',
      borderRadius: 14, padding: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <IconAlertCircle size={15} color={T.red} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.red }}>ALERTA: Deuda Acumulada</span>
      </div>
      <div style={{ fontSize: 12, color: '#991B1B', marginBottom: 12 }}>
        {families.length} familia{families.length !== 1 ? 's' : ''} deb{families.length !== 1 ? 'en' : 'e'} 2 o más meses
      </div>

      {/* Family cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {displayed.map((family, i) => (
          <button
            key={family.familiaId || i}
            onClick={onOpenDebtors}
            style={{
              background: 'white', borderRadius: 10, border: '1px solid #FECACA',
              padding: 12, textAlign: 'left', cursor: 'pointer',
              fontFamily: T.font, width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.red, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    Familia {family.apellido}
                  </span>
                  {family.familiaId && (
                    <span style={{ fontSize: 10, color: T.red, fontFamily: 'monospace', opacity: 0.7 }}>
                      {famLabel(family.familiaId)}
                    </span>
                  )}
                </div>
                {family.responsable && (
                  <div style={{ fontSize: 11, color: T.textLight, marginTop: 1 }}>{family.responsable}</div>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.red }}>{fmt(family.totalDebt)}</span>
            </div>
            <div style={{ fontSize: 11, color: T.red, fontWeight: 500, marginBottom: 3 }}>
              {family.unpaidMonthCount} mes{family.unpaidMonthCount !== 1 ? 'es' : ''} sin pagar · {family.unpaidMonths.join(', ')}
            </div>
            {family.email && (
              <a href={`mailto:${family.email}`} style={{ fontSize: 11, color: T.green, marginBottom: 3, display: 'block', textDecoration: 'none' }}>
                {family.email}
              </a>
            )}
            <div style={{ fontSize: 11, color: T.gray }}>
              {family.students.map(st =>
                `${st.nombre} · Leg. ${st.legajo}${st.beca > 0 ? ` (Beca ${Math.round(st.beca * 100)}%)` : ''}`
              ).join(', ')}
            </div>
          </button>
        ))}
      </div>

      {/* "y X más" link */}
      {remaining > 0 && (
        <button
          onClick={onOpenDebtors}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: T.red, fontWeight: 600, fontFamily: T.font,
            padding: '0 0 10px', display: 'block', textDecoration: 'underline',
          }}
        >
          y {remaining} familia{remaining !== 1 ? 's' : ''} más...
        </button>
      )}

      {/* Grand total */}
      <div style={{
        background: T.red, borderRadius: 8, padding: '10px 14px',
        textAlign: 'center', fontSize: 15, fontWeight: 700, color: 'white',
      }}>
        Deuda acumulada total: {fmt(grandTotal)}
      </div>
    </div>
  );
}

// ─── DashboardTab ─────────────────────────────────────────────────────────────

function DashboardTab({ kpis, monthlyRevenue, payments, getStudentName, allStudents, getCuota, accumulatedDebtFamilies, onOpenDebtors, onOpenAddPayment, onNavigatePayments }) {
  const [expandedId, setExpandedId] = useState(null);
  const recentPayments = sortPaymentsNewestFirst(payments).slice(0, 5);

  const kpiData = [
    { label: 'Recaudado', value: fmt(kpis.recaudado), color: T.greenText, bg: T.greenBg, border: '#D1FAE5' },
    { label: 'Pendiente', value: fmt(kpis.pendiente), color: T.amberText, bg: T.amberBg, border: '#FDE68A' },
    { label: 'Con deuda', value: kpis.conDeuda, color: T.redText, bg: T.redBg, border: '#FECACA', suffix: `/${kpis.totalFamilias} fam.` },
    { label: 'Deuda total', value: fmt(kpis.deudaTotal), color: T.purpleText, bg: T.purpleBg, border: '#DDD6FE' },
  ];

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {kpiData.map(({ label, value, color, bg, border, suffix }) => (
          <div key={label} style={{
            background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '16px',
          }}>
            <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.2, marginTop: 4 }}>
              {value}{suffix || ''}
            </div>
          </div>
        ))}
      </div>

      {/* Accumulated debt alert */}
      <AccumulatedDebtAlert families={accumulatedDebtFamilies} onOpenDebtors={onOpenDebtors} />

      {/* Monthly revenue */}
      <Card style={{ padding: '16px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 12 }}>Recaudación mensual</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {monthlyRevenue.map(({ mes, short, verified, pending }) => (
            <div key={mes}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.textMid }}>{mes}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.greenText }}>{fmt(verified)}</span>
                  {pending > 0 && <span style={{ fontSize: 12, color: T.amberText }}>+{fmt(pending)} pend.</span>}
                </div>
              </div>
              <div style={{ height: 6, background: T.grayBg, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: `linear-gradient(90deg, ${T.greenLight}, ${T.green})`,
                  width: verified > 0 ? `${Math.min(100, (verified / (verified + pending + 1)) * 100)}%` : '0%',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <PrimaryBtn onClick={onOpenAddPayment} style={{ flex: 1, textAlign: 'center' }}>
          + Registrar pago
        </PrimaryBtn>
        <PrimaryBtn
          onClick={onOpenDebtors}
          style={{ flex: 1, textAlign: 'center', background: T.red }}
          danger
        >
          Deudores
        </PrimaryBtn>
      </div>

      {/* Recent payments */}
      <Card>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 14px', borderBottom: `1px solid ${T.border}`,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Últimos pagos</span>
          <button
            onClick={onNavigatePayments}
            style={{ background: 'none', border: 'none', color: T.green, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font }}
          >
            Ver todos →
          </button>
        </div>
        {recentPayments.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.textLight, fontSize: 14 }}>Sin pagos registrados</div>
        ) : (
          recentPayments.map((p, i) => {
            const names = (p.studentIds || []).map(getStudentName);
            const isExpanded = expandedId === (p.id || i);
            return (
              <div key={p.id || i} style={{
                borderBottom: i < recentPayments.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <button
                  onClick={() => setExpandedId(prev => prev === (p.id || i) ? null : (p.id || i))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: T.font,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: p.metodo === 'MercadoPago' ? '#EFF6FF' : p.metodo === 'Efectivo' ? T.greenBg : T.grayBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {p.metodo === 'MercadoPago'
                      ? <IconCreditCard size={16} color="#2563EB" />
                      : p.metodo === 'Efectivo'
                        ? <IconDollarSign size={16} color={T.green} />
                        : <IconBanknote size={16} color={T.gray} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {names.slice(0, 2).join(', ')}{names.length > 2 ? ` +${names.length - 2}` : ''} — {p.mes}
                    </div>
                    <div style={{ fontSize: 11, color: T.textLight }}>
                      {p.fecha || 'Sin fecha'}
                      {p.familiaId && ` · ${famLabel(p.familiaId)}`}
                      {(p.studentIds || []).length > 0 && ` · Leg. ${(p.studentIds || []).join(', ')}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(p.monto)}</div>
                    <StatusBadge estado={p.estado} />
                  </div>
                  <span style={{ color: T.textLight, fontSize: 11, flexShrink: 0, marginLeft: 4 }}>{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <PaymentExpandedDetail
                    p={p}
                    allStudents={allStudents}
                    getCuota={getCuota}
                    onUpdatePayment={null}
                  />
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

// ─── PagosTab ─────────────────────────────────────────────────────────────────

function PagosTab({ filteredPayments, allPayments, search, filter, expandedId, getStudentName, allStudents, getCuota, onSearch, onFilter, onToggleExpand, onUpdatePayment, onOpenAdd, onBulkAction }) {
  const counts = {
    todos: allPayments.length,
    verificado: allPayments.filter(p => p.estado === 'verificado').length,
    pendiente: allPayments.filter(p => p.estado === 'pendiente').length,
    rechazado: allPayments.filter(p => p.estado === 'rechazado').length,
  };
  const FILTERS = [
    { key: 'todos', label: 'Todos' },
    { key: 'verificado', label: 'Verificados' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'rechazado', label: 'Rechazados' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky filters */}
      <div style={{
        background: T.white, borderBottom: `1px solid ${T.border}`,
        padding: '12px 14px', position: 'sticky', top: 0, zIndex: 5,
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Buscar alumno, FAM, legajo o ref..."
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8,
              border: `1.5px solid ${T.border}`, fontSize: 13,
              fontFamily: T.font, outline: 'none', color: T.text,
            }}
          />
          <button
            onClick={onOpenAdd}
            style={{
              padding: '9px 14px', borderRadius: 8, border: 'none',
              background: T.green,
              color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: T.font,
            }}
          >
            + Nuevo
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onFilter(key)}
              style={{
                padding: '10px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filter === key ? T.green : T.grayBg,
                color: filter === key ? 'white' : T.textMid,
                fontSize: 13, fontWeight: 600, fontFamily: T.font,
                minHeight: 44,
                transition: 'all 0.2s',
              }}
            >
              {label}{counts[key] > 0 ? ` (${counts[key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action buttons */}
      {filter === 'pendiente' && filteredPayments.length > 0 && (
        <div style={{ padding: '10px 14px 0' }}>
          <button
            onClick={() => onBulkAction('verify', filteredPayments)}
            style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: T.green,
              color: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: T.font,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            Verificar todos los pendientes ({filteredPayments.length})
          </button>
        </div>
      )}
      {filter === 'rechazado' && filteredPayments.length > 0 && (
        <div style={{ padding: '10px 14px 0' }}>
          <button
            onClick={() => onBulkAction('reopen', filteredPayments)}
            style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: T.amber,
              color: 'white', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: T.font,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            ↻ Pasar todos a pendiente ({filteredPayments.length})
          </button>
        </div>
      )}

      {/* List */}
      <div style={{ padding: '10px 14px', flex: 1 }}>
        {filteredPayments.length === 0 ? (
          <EmptyState icon={<IconSearch size={32} color={T.textLight} />} text="No se encontraron pagos con estos filtros" />
        ) : (
          filteredPayments.map((p, i) => (
            <PaymentRow
              key={p.id || i}
              payment={p}
              expanded={expandedId === p.id}
              getStudentName={getStudentName}
              allStudents={allStudents}
              getCuota={getCuota}
              onToggle={() => onToggleExpand(p.id)}
              onUpdatePayment={onUpdatePayment}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: T.textLight, fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, color: T.text,
        fontFamily: mono ? 'monospace' : 'inherit',
        maxWidth: '65%', textAlign: 'right', wordBreak: 'break-all',
      }}>
        {value}
      </span>
    </div>
  );
}

function PaymentExpandedDetail({ p, allStudents, getCuota, onUpdatePayment }) {
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 16px', animation: 'fadeIn 0.2s ease' }}>
      {/* Per-student breakdown */}
      {(p.studentIds || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Detalle por alumno
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(p.studentIds || []).map(legajo => {
              const st = allStudents.find(s => s.legajo === legajo || String(s.legajo) === String(legajo));
              const fee = st ? getCuota(st) : null;
              return (
                <div key={legajo} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', background: T.bg, borderRadius: 8,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                      {st ? `${st.apellido}, ${st.nombre}` : `Legajo ${legajo}`}
                    </div>
                    {st && (
                      <div style={{ fontSize: 11, color: T.textLight, marginTop: 1 }}>
                        {st.nivel} · {st.curso} · Leg. {legajo}
                        {st.beca > 0 && ` · Beca ${Math.round(st.beca * 100)}%`}
                      </div>
                    )}
                  </div>
                  {fee !== null && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(fee)}</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Total row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', background: T.greenBg, borderRadius: 8,
            marginTop: 4, fontSize: 13, fontWeight: 700, color: T.greenText,
          }}>
            <span>Total</span>
            <span>{fmt(p.monto)}</span>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div style={{
        background: T.bg, borderRadius: 10, padding: '10px 12px', marginBottom: 12,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {p.mes && <MetaRow label="Mes" value={p.mes} />}
        {p.metodo && <MetaRow label="Método" value={p.metodo} />}
        {p.fecha && <MetaRow label="Fecha" value={p.fecha} />}
        {p.referencia && <MetaRow label="Referencia" value={p.referencia} mono />}
        {p.familiaId && <MetaRow label="Familia" value={famLabel(p.familiaId)} mono />}
      </div>

      {/* Observations */}
      {p.observaciones && (
        <div style={{
          background: T.amberBg, border: `1px solid #FDE68A`, borderRadius: 8,
          padding: '10px 12px', marginBottom: 12, fontSize: 12,
          color: T.amberText,
        }}>
          <strong style={{ fontWeight: 700 }}>Observaciones:</strong> {p.observaciones}
        </div>
      )}

      {/* Action buttons */}
      {onUpdatePayment && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {p.estado === 'pendiente' && (
            <>
              <PrimaryBtn onClick={() => onUpdatePayment(p.id, 'verificado')} style={{ fontSize: 12, padding: '7px 14px' }}>
                Verificar
              </PrimaryBtn>
              <PrimaryBtn onClick={() => onUpdatePayment(p.id, 'rechazado')} danger style={{ fontSize: 12, padding: '7px 14px' }}>
                Rechazar
              </PrimaryBtn>
            </>
          )}
          {p.estado === 'verificado' && (
            <GhostBtn onClick={() => onUpdatePayment(p.id, 'pendiente')} style={{ fontSize: 12, padding: '7px 14px' }}>
              Revertir a pendiente
            </GhostBtn>
          )}
          {p.estado === 'rechazado' && (
            <GhostBtn onClick={() => onUpdatePayment(p.id, 'pendiente')} style={{ fontSize: 12, padding: '7px 14px' }}>
              Cambiar a pendiente
            </GhostBtn>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentRow({ payment: p, expanded, getStudentName, allStudents, getCuota, onToggle, onUpdatePayment }) {
  const namesWithLegs = (p.studentIds || []).map(id => {
    const st = allStudents.find(s => s.legajo === id);
    return st ? `${st.nombre} ${st.apellido} (${id})` : `Leg. ${id}`;
  });
  return (
    <Card style={{ marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: T.font,
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: p.metodo === 'MercadoPago' ? '#EFF6FF' : p.metodo === 'Efectivo' ? T.greenBg : T.grayBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {p.metodo === 'MercadoPago'
            ? <IconCreditCard size={16} color="#2563EB" />
            : p.metodo === 'Efectivo'
              ? <IconDollarSign size={16} color={T.green} />
              : <IconBanknote size={16} color={T.gray} />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {namesWithLegs.slice(0, 2).join(', ')}{namesWithLegs.length > 2 ? ` +${namesWithLegs.length - 2}` : ''} — {p.mes}
          </div>
          <div style={{ fontSize: 11, color: T.textLight, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.fecha || 'Sin fecha'} · {p.metodo}
            {p.familiaId && <span style={{ color: T.textLight }}> · {famLabel(p.familiaId)}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fmt(p.monto)}</span>
          <StatusBadge estado={p.estado} />
        </div>
        <span style={{ color: T.textLight, fontSize: 12, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <PaymentExpandedDetail
          p={p}
          allStudents={allStudents}
          getCuota={getCuota}
          onUpdatePayment={onUpdatePayment}
        />
      )}
    </Card>
  );
}

// ─── AlumnosTab ───────────────────────────────────────────────────────────────

function AlumnosTab({ students, search, payments, gs, getCuota, getStudentName, onSearch, onEdit }) {
  const [expandedFamiliaId, setExpandedFamiliaId] = useState(null);

  const families = useMemo(() => {
    const familyMap = {};
    for (const student of students) {
      const fid = student.familiaId || '__sin_familia__';
      if (!familyMap[fid]) {
        familyMap[fid] = {
          familiaId: fid,
          apellido: student.apellido,
          responsable: student.responsable || '',
          email: student.email || '',
          telefono: student.telefono || '',
          students: [],
        };
      }
      familyMap[fid].students.push(student);
    }
    return Object.values(familyMap).sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'));
  }, [students]);

  return (
    <div>
      <div style={{ padding: '12px 14px', background: T.white, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 5 }}>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Buscar por familia, alumno o legajo..."
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 8,
            border: `1.5px solid ${T.border}`, fontSize: 13,
            fontFamily: T.font, outline: 'none', color: T.text, boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ padding: '10px 14px' }}>
        {families.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={32} color={T.textLight} />}
            text={search ? `No se encontraron resultados para "${search}"` : 'No se encontraron alumnos'}
          />
        ) : (
          families.map(family => (
            <FamilyCard
              key={family.familiaId}
              family={family}
              expanded={expandedFamiliaId === family.familiaId}
              payments={payments}
              gs={gs} 
              getCuota={getCuota}
              onToggle={() => setExpandedFamiliaId(prev => prev === family.familiaId ? null : family.familiaId)}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FamilyCard({ family, expanded, payments, gs, getCuota, onToggle, onEdit }) {
  const dueMonths = MONTHS.slice(0, CM + 1);
  const AVATAR_COLORS = ['#43A047', '#7B1FA2', '#1565C0', '#E65100', '#00838F', '#AD1457'];
  const accentColor = getFamilyColor(family.familiaId);

  // Compute family-level debt summary
  let totalMonthlyFee = 0;
  let totalDebt = 0;
  let hasPending = false;
  for (const student of family.students) {
    const cuota = getCuota(student);
    totalMonthlyFee += cuota;
    if (cuota > 0) {
      for (const mes of dueMonths) {
        const s = gs(student.legajo, mes);
        if (s === 'no') totalDebt += cuota;
        else if (s === 'pen') hasPending = true;
      }
    }
  }
  const statusBadge = totalDebt > 0
    ? { label: `Debe ${fmt(totalDebt)}`, bg: T.redBg, color: T.redText }
    : hasPending
      ? { label: 'Pendiente', bg: T.amberBg, color: T.amberText }
      : { label: 'Al día', bg: T.greenBg, color: T.greenText };

  // Family payment history (any payment involving a family student)
  const legajos = family.students.map(s => s.legajo);
  const familyPayments = sortPaymentsNewestFirst(
    payments.filter(p => (p.studentIds || []).some(id => legajos.includes(id)))
  );

  return (
    <Card style={{ marginBottom: 10, overflow: 'hidden', borderLeft: `4px solid ${accentColor}` }}>
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: T.font,
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 16,
        }}>
          {family.apellido.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 8px' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Familia {family.apellido}</span>
            {family.familiaId && (
              <span style={{ fontSize: 10, color: T.textLight, fontFamily: 'monospace', background: T.grayBg, padding: '1px 5px', borderRadius: 4 }}>
                {famLabel(family.familiaId)}
              </span>
            )}
            <span style={{ padding: '2px 9px', borderRadius: 20, background: statusBadge.bg, color: statusBadge.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 'auto' }}>
              {statusBadge.label}
            </span>
          </div>
          {family.responsable && (
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {family.responsable}
            </div>
          )}
          {family.email && (
            <div style={{ fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <a href={`mailto:${family.email}`} style={{ color: T.green, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{family.email}</a>
            </div>
          )}
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 3 }}>
            {family.students.length <= 2 ? (
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {family.students.map(s => `${s.nombre} (Leg. ${s.legajo})`).join(', ')} · {fmt(totalMonthlyFee)}/mes
              </div>
            ) : (
              <div>
                {family.students.map(s => (
                  <div key={s.legajo} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.nombre} (Leg. {s.legajo}) · {s.nivel} {s.curso}
                  </div>
                ))}
                <div style={{ marginTop: 1 }}>{fmt(totalMonthlyFee)}/mes</div>
              </div>
            )}
          </div>
        </div>
        <span style={{ color: T.textLight, fontSize: 12, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '14px 16px', animation: 'fadeIn 0.2s ease' }}>
          {family.students.map((student, idx) => {
            const cuota = getCuota(student);
            const owedMonths = dueMonths.filter(mes => cuota > 0 && gs(student.legajo, mes) === 'no');
            const hasPend = dueMonths.some(mes => gs(student.legajo, mes) === 'pen');
            const avatarColor = AVATAR_COLORS[student.legajo % AVATAR_COLORS.length];
            const sBadge = owedMonths.length > 0
              ? { label: `Debe ${fmt(owedMonths.length * cuota)}`, bg: T.redBg, color: T.redText }
              : hasPend
                ? { label: 'Pendiente', bg: T.amberBg, color: T.amberText }
                : { label: cuota === 0 ? 'Beca 100%' : 'Al día', bg: T.greenBg, color: T.greenText };

            return (
              <div key={student.legajo} style={{
                marginBottom: idx < family.students.length - 1 ? 16 : 0,
                paddingBottom: idx < family.students.length - 1 ? 16 : 0,
                borderBottom: idx < family.students.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                {/* Child header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Avatar name={`${student.apellido} ${student.nombre}`} color={avatarColor} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{student.nombre}</div>
                    <div style={{ fontSize: 11, color: T.textLight }}>
                      {student.nivel} · {student.curso} · Leg. {student.legajo}
                      {student.beca > 0 && ` · Beca ${Math.round(student.beca * 100)}%`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{fmt(cuota)}/mes</div>
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: sBadge.bg, color: sBadge.color, fontSize: 10, fontWeight: 700 }}>
                      {sBadge.label}
                    </span>
                  </div>
                </div>

                {/* Year grid */}
                {cuota === 0 ? (
                  <div style={{ background: T.greenBg, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.greenText, fontWeight: 600, marginBottom: 8 }}>
                    Cuota cubierta por beca al 100%
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
                    {MONTHS.map((mes, midx) => {
                      const isDue = midx <= CM;
                      const status = isDue ? gs(student.legajo, mes) : 'future';
                      const cellBg = status === 'ok' ? '#DCFCE7' : status === 'pen' ? '#FEF9C3' : status === 'no' ? '#FEE2E2' : T.grayBg;
                      const cellColor = status === 'ok' ? '#15803D' : status === 'pen' ? '#A16207' : status === 'no' ? '#B91C1C' : T.textLight;
                      return (
                        <div key={mes} style={{
                          padding: '4px 7px', borderRadius: 6,
                          background: cellBg, color: cellColor,
                          fontSize: 10, fontWeight: 700, textAlign: 'center', minWidth: 30,
                        }}>
                          {MONTHS_SHORT[midx]}
                          <div style={{ fontSize: 8, marginTop: 1 }}>
                            {status === 'ok' ? 'ok' : status === 'pen' ? 'pen' : status === 'no' ? 'no' : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => onEdit(student)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: `1.5px solid ${T.green}`,
                    background: 'white', color: T.green,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
                  }}
                >
                  Editar
                </button>
              </div>
            );
          })}

          {/* Family payment history */}
          {familyPayments.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Historial de pagos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {familyPayments.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ padding: '7px 10px', background: T.bg, borderRadius: 8, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{p.mes} · {p.metodo}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: T.text }}>{fmt(p.monto)}</span>
                        <StatusBadge estado={p.estado} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, gap: 8 }}>
                      <span style={{ color: T.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{p.fecha || ''}</span>
                      {p.referencia && <span style={{ color: T.textLight, fontFamily: 'monospace', flexShrink: 0 }}>{p.referencia}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function StudentRow({ student, expanded, payments, gs, getCuota, getStudentName, onToggle, onEdit }) {
  const dueMonths = MONTHS.slice(0, CM + 1);
  const cuota = getCuota(student);
  const owedMonths = dueMonths.filter(mes => gs(student.legajo, mes) === 'no');
  const hasDebt = cuota > 0 && owedMonths.length > 0;
  const hasPending = dueMonths.some(mes => gs(student.legajo, mes) === 'pen');

  // Get payments for this student
  const studentPayments = sortPaymentsNewestFirst(
    payments.filter(p => (p.studentIds || []).includes(student.legajo))
  );

  const colors = ['#43A047', '#7B1FA2', '#1565C0', '#E65100', '#00838F', '#AD1457'];
  const avatarColor = colors[student.legajo % colors.length] || T.green;

  return (
    <Card style={{ marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: T.font,
        }}
      >
        <Avatar name={`${student.apellido} ${student.nombre}`} color={avatarColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.apellido}, {student.nombre}
          </div>
          <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>
            {student.nivel} · {student.curso} · Legajo {student.legajo}
            {student.beca > 0 && ` · Beca ${Math.round(student.beca * 100)}%`}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(cuota)}</span>
          {hasDebt ? (
            <span style={{
              padding: '2px 8px', borderRadius: 20,
              background: T.redBg, color: T.redText,
              fontSize: 11, fontWeight: 700,
            }}>
              Debe {fmt(owedMonths.length * cuota)}
            </span>
          ) : hasPending ? (
            <span style={{ padding: '2px 8px', borderRadius: 20, background: T.amberBg, color: T.amberText, fontSize: 11, fontWeight: 700 }}>Pendiente</span>
          ) : (
            <span style={{ padding: '2px 8px', borderRadius: 20, background: T.greenBg, color: T.greenText, fontSize: 11, fontWeight: 700 }}>Al día</span>
          )}
        </div>
        <span style={{ color: T.textLight, fontSize: 12, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 16px', animation: 'fadeIn 0.2s ease' }}>
          {/* Contact info */}
          <div style={{ marginBottom: 12, fontSize: 12, color: T.textMid, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {student.responsable && <div><strong>Responsable:</strong> {student.responsable}</div>}
            {student.email && <div><a href={`mailto:${student.email}`} style={{ color: T.green }}>{student.email}</a></div>}
            {student.telefono && <div><a href={`tel:${student.telefono}`} style={{ color: T.textMid, textDecoration: 'none' }}>{student.telefono}</a></div>}
            {student.familiaId && <div style={{ color: T.textLight }}>{famLabel(student.familiaId)}</div>}
          </div>

          {/* Year grid */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Estado de cuotas
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {MONTHS.map((mes, idx) => {
                const isDue = idx <= CM; // only past/current months are "due"
                const status = isDue ? gs(student.legajo, mes) : 'future';
                const cellBg = status === 'ok' ? '#DCFCE7' : status === 'pen' ? '#FEF9C3' : status === 'no' ? '#FEE2E2' : T.grayBg;
                const cellColor = status === 'ok' ? '#15803D' : status === 'pen' ? '#A16207' : status === 'no' ? '#B91C1C' : T.textLight;
                return (
                  <div key={mes} style={{
                    padding: '4px 8px', borderRadius: 6,
                    background: cellBg, color: cellColor,
                    fontSize: 11, fontWeight: 700, textAlign: 'center',
                    minWidth: 36,
                  }}>
                    {MONTHS_SHORT[idx]}
                    <div style={{ fontSize: 9, marginTop: 1 }}>
                      {status === 'ok' ? 'ok' : status === 'pen' ? 'pen' : status === 'no' ? 'no' : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment history */}
          {studentPayments.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Historial de pagos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {studentPayments.slice(0, 4).map((p, i) => (
                  <div key={i} style={{
                    padding: '7px 10px', background: T.bg, borderRadius: 8,
                    fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: T.text }}>{p.mes} · {p.metodo}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: T.text }}>{fmt(p.monto)}</span>
                        <StatusBadge estado={p.estado} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ color: T.textLight }}>{p.fecha || ''}</span>
                      {p.referencia && <span style={{ color: T.textLight, fontFamily: 'monospace' }}>{p.referencia}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onEdit}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: `1.5px solid ${T.green}`,
              background: 'white', color: T.green,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
            }}
          >
            Editar alumno
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── ConfigTab ────────────────────────────────────────────────────────────────

function ConfigTab({ rates, allStudents, getCuota, onUpdateRate }) {
  const summaryByNivel = useMemo(() => {
    return NIVELES.map(nivel => {
      const students = allStudents.filter(s => s.nivel === nivel);
      const monthly = students.reduce((sum, s) => sum + getCuota(s), 0);
      return { nivel, count: students.length, monthly };
    });
  }, [allStudents, getCuota, rates]);

  const totalReal = useMemo(() => {
    return allStudents.reduce((sum, s) => sum + getCuota(s), 0);
  }, [allStudents, getCuota, rates]);

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Rate editor */}
      <Card style={{ padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 14 }}>Cuotas por nivel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NIVELES.map(nivel => (
            <RateInput
              key={nivel}
              nivel={nivel}
              defaultValue={rates[nivel] || ''}
              onSave={(val) => onUpdateRate(nivel, val)}
            />
          ))}
        </div>
      </Card>

      {/* Summary by level */}
      <Card style={{ padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 12 }}>Resumen por nivel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {summaryByNivel.map(({ nivel, count, monthly }) => (
            <div key={nivel} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', background: T.bg, borderRadius: 8,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{nivel}</div>
                <div style={{ fontSize: 12, color: T.textLight }}>{count} alumnos</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{fmt(monthly)}/mes</div>
                <div style={{ fontSize: 11, color: T.textLight }}>teórico</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Total revenue */}
      <div style={{
        background: '#1B5E20',
        borderRadius: 12, padding: '16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>INGRESO REAL MENSUAL</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
            después de descuentos por becas
          </div>
        </div>
        <div style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{fmt(totalReal)}</div>
      </div>
    </div>
  );
}

// Rate input uses defaultValue + onBlur to avoid re-render focus loss
function RateInput({ nivel, defaultValue, onSave }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: T.text, minWidth: 90 }}>{nivel}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: T.textMid }}>$</span>
        <input
          key={`rate-${nivel}-${defaultValue}`}
          type="number"
          defaultValue={defaultValue}
          onBlur={(e) => {
            const val = Number(e.target.value);
            if (val > 0) onSave(val);
          }}
          style={{
            width: 120, padding: '8px 10px', borderRadius: 8,
            border: `1.5px solid ${T.border}`, fontSize: 14,
            fontFamily: T.font, color: T.text, textAlign: 'right',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = T.green}
          onBlurCapture={e => e.target.style.borderColor = T.border}
        />
      </div>
    </div>
  );
}

// ─── Debtors Modal ────────────────────────────────────────────────────────────

function DebtorsModal({ debtors, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalHeader
        title={`Deudores — ${debtors.length} familia${debtors.length !== 1 ? 's' : ''}`}
        onClose={onClose}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {debtors.length === 0 ? (
          <EmptyState icon={<IconCheckCircle size={32} color={T.greenLight} />} text="Sin deudores. Todas las familias están al día." />
        ) : (
          debtors.map((family, i) => (
            <Card key={family.familiaId || i} style={{ marginBottom: 10, padding: '14px' }}>
              {/* Family header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 6px' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                      Familia {family.apellido}
                    </span>
                    {family.familiaId && (
                      <span style={{ fontSize: 11, color: T.textLight, fontFamily: 'monospace', background: T.grayBg, padding: '1px 6px', borderRadius: 4 }}>
                        {famLabel(family.familiaId)}
                      </span>
                    )}
                  </div>
                  {family.responsable && (
                    <div style={{ fontSize: 12, color: T.textMid, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{family.responsable}</div>
                  )}
                  <div style={{ fontSize: 11, color: T.textLight, marginTop: 1 }}>
                    {family.students.length} alumno{family.students.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.redText, flexShrink: 0 }}>{fmt(family.totalDebt)}</div>
              </div>

              {/* Contact */}
              <div style={{ fontSize: 11, color: T.textMid, marginBottom: 8 }}>
                {family.email && (
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={`mailto:${family.email}`} style={{ color: T.green, textDecoration: 'none' }}>{family.email}</a>
                  </div>
                )}
                {family.telefono && (
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: family.email ? 2 : 0 }}>
                    <a href={`tel:${family.telefono}`} style={{ color: T.textMid, textDecoration: 'none' }}>{family.telefono}</a>
                  </div>
                )}
              </div>

              {/* Months owed */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.textMid }}>Meses adeudados: </span>
                <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                  {family.unpaidMonths.map(mes => (
                    <span key={mes} style={{
                      padding: '2px 8px', borderRadius: 20,
                      background: T.redBg, color: T.redText, fontSize: 11, fontWeight: 600,
                    }}>
                      {mes}
                    </span>
                  ))}
                </div>
              </div>

              {/* Children */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {family.students.map(st => (
                  <div key={st.legajo} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    padding: '6px 10px', background: T.bg, borderRadius: 7, fontSize: 12,
                  }}>
                    <span style={{ color: T.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      • {st.nombre} — {st.nivel} {st.curso} · Leg. {st.legajo}
                      {st.beca > 0 && ` (Beca ${Math.round(st.beca * 100)}%)`}
                    </span>
                    <span style={{ fontWeight: 700, color: T.text, flexShrink: 0 }}>{fmt(st.cuota)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </Overlay>
  );
}

// ─── Add Payment Modal ────────────────────────────────────────────────────────

function AddPaymentModal({ allStudents, rates, getCuota, onSubmit, onClose }) {
  const [legajosRaw, setLegajosRaw] = useState('');
  const [mes, setMes] = useState(MONTHS[CM]);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Transferencia');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [autoMonto, setAutoMonto] = useState(true);

  const legajos = legajosRaw.split(',').map(s => s.trim()).filter(Boolean);

  const calculatedMonto = useMemo(() => {
    if (!autoMonto) return null;
    const total = legajos.reduce((sum, leg) => {
      const student = allStudents.find(s => String(s.legajo) === leg);
      return sum + (student ? getCuota(student) : 0);
    }, 0);
    return total;
  }, [legajos, allStudents, getCuota, autoMonto]);

  const finalMonto = autoMonto && calculatedMonto > 0 ? calculatedMonto : Number(monto);

  const valid = legajos.length > 0 && mes && finalMonto > 0;

  const handleSubmit = () => {
    onSubmit({
      studentIds: legajos,
      mes,
      monto: finalMonto,
      metodo,
      referencia,
      observaciones,
      estado,
      fecha: (() => { const t = new Date(); return `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}`; })(),
      familiaId: allStudents.find(s => String(s.legajo) === legajos[0])?.familiaId || '',
    });
  };

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Registrar pago" onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textMid, display: 'block', marginBottom: 5 }}>
              Legajos (separados por coma)
            </label>
            <input
              value={legajosRaw}
              onChange={e => setLegajosRaw(e.target.value)}
              placeholder="1001, 1002, 1003"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: `1.5px solid ${T.border}`, fontSize: 13,
                fontFamily: T.font, boxSizing: 'border-box', color: T.text, outline: 'none',
              }}
            />
            {legajos.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: T.textMid }}>
                {legajos.map(leg => {
                  const st = allStudents.find(s => String(s.legajo) === leg);
                  return st ? `${st.apellido} ${st.nombre}` : `Legajo ${leg} (no encontrado)`;
                }).join(' · ')}
              </div>
            )}
          </div>

          <Select label="Mes" value={mes} onChange={e => setMes(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textMid, display: 'block', marginBottom: 5 }}>
              Monto
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {autoMonto && calculatedMonto > 0 ? (
                <div style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8,
                  border: `1.5px solid ${T.greenLight}`, fontSize: 13,
                  background: T.greenBg, color: T.greenText, fontWeight: 700,
                }}>
                  {fmt(calculatedMonto)} (calculado automáticamente)
                </div>
              ) : (
                <input
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="Ingresá el monto"
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8,
                    border: `1.5px solid ${T.border}`, fontSize: 13,
                    fontFamily: T.font, color: T.text, outline: 'none',
                  }}
                />
              )}
              <button
                onClick={() => setAutoMonto(p => !p)}
                style={{
                  padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${T.border}`,
                  background: 'white', fontSize: 12, cursor: 'pointer',
                  color: T.textMid, fontFamily: T.font, whiteSpace: 'nowrap',
                }}
              >
                {autoMonto ? 'Manual' : 'Auto'}
              </button>
            </div>
          </div>

          <Select label="Método de pago" value={metodo} onChange={e => setMetodo(e.target.value)}>
            {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>

          <Input label="Referencia (opcional)" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Nro. de comprobante o CBU..." />

          <Input label="Observaciones (opcional)" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Notas adicionales..." />

          <Select label="Estado" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="verificado">Verificado</option>
          </Select>
        </div>
      </div>
      <div style={{ padding: '16px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
        <GhostBtn onClick={onClose} style={{ flex: 1 }}>Cancelar</GhostBtn>
        <PrimaryBtn onClick={handleSubmit} disabled={!valid} style={{ flex: 2 }}>
          Registrar pago {finalMonto > 0 ? `· ${fmt(finalMonto)}` : ''}
        </PrimaryBtn>
      </div>
    </Overlay>
  );
}

// ─── Edit Student Modal ───────────────────────────────────────────────────────

function EditStudentModal({ student, rates, getCuota, onSubmit, onClose }) {
  const [nivel, setNivel] = useState(student.nivel || 'Primaria');
  const [beca, setBeca] = useState(student.beca || 0);
  const [curso, setCurso] = useState(student.curso || '');

  const previewCuota = (rates[nivel] || 0) * (1 - beca);

  const handleSubmit = () => {
    onSubmit({ ...student, nivel, beca, curso });
  };

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Editar alumno" onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Student info */}
        <div style={{ background: T.bg, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{student.apellido}, {student.nombre}</div>
          <div style={{ fontSize: 12, color: T.textLight }}>Legajo {student.legajo}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select label="Nivel" value={nivel} onChange={e => setNivel(e.target.value)}>
            {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
          </Select>

          <Input label="Curso / Grado" value={curso} onChange={e => setCurso(e.target.value)} placeholder="Ej: 3°B" />

          <Select label="Beca" value={beca} onChange={e => setBeca(Number(e.target.value))}>
            {BECAS.map(b => <option key={b} value={b}>{b === 0 ? 'Sin beca' : `${Math.round(b * 100)}%`}</option>)}
          </Select>

          {/* Preview */}
          <div style={{
            background: T.greenBg, borderRadius: 10, padding: '14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: `1px solid #A7F3D0`,
          }}>
            <div>
              <div style={{ fontSize: 12, color: T.greenText, fontWeight: 600 }}>Cuota resultante</div>
              {beca > 0 && <div style={{ fontSize: 11, color: T.greenText, opacity: 0.8 }}>Con {Math.round(beca * 100)}% de beca</div>}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.green }}>{fmt(previewCuota)}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
        <GhostBtn onClick={onClose} style={{ flex: 1 }}>Cancelar</GhostBtn>
        <PrimaryBtn onClick={handleSubmit} style={{ flex: 2 }}>Guardar cambios</PrimaryBtn>
      </div>
    </Overlay>
  );
}

// ─── Shared: Overlay & ModalHeader ───────────────────────────────────────────

function Overlay({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div
        onClick={onClose}
        style={{ flex: 1 }}
      />
      <div
        style={{
          background: T.white,
          borderRadius: '20px 20px 0 0',
          maxHeight: '88%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 16px 14px',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 3, background: T.grayBg, borderRadius: 2, margin: '-24px auto 0' }} />
        <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{title}</span>
      </div>
      <button
        onClick={onClose}
        style={{
          background: T.grayBg, border: 'none', borderRadius: '50%',
          width: 44, height: 44, cursor: 'pointer', color: T.textMid,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.font, flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function ConfirmDialog({ type, count, onConfirm, onCancel }) {
  const isVerify = type === 'verify';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      <div style={{
        background: T.white, borderRadius: 20, padding: '28px 24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        animation: 'fadeIn 0.2s ease', maxWidth: 380, width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          {isVerify
            ? <IconCheckCircle size={40} color={T.greenLight} />
            : <IconAlertCircle size={40} color={T.amber} />
          }
        </div>
        <div style={{ fontWeight: 700, fontSize: 17, color: T.text, textAlign: 'center', marginBottom: 8 }}>
          {isVerify ? `¿Verificar ${count} pago${count !== 1 ? 's' : ''}?` : `¿Revertir ${count} pago${count !== 1 ? 's' : ''} a pendiente?`}
        </div>
        <div style={{ fontSize: 13, color: T.textMid, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
          {isVerify
            ? `Se marcarán como "Verificado" los ${count} pago${count !== 1 ? 's' : ''} pendientes actualmente visibles.`
            : `Se moverán a "Pendiente" los ${count} pago${count !== 1 ? 's' : ''} rechazados actualmente visibles.`
          }
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <GhostBtn onClick={onCancel} style={{ flex: 1 }}>Cancelar</GhostBtn>
          <button
            onClick={onConfirm}
            style={{
              flex: 2, padding: '10px 18px', borderRadius: 10, border: 'none',
              background: isVerify ? T.greenMid : T.amber,
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: T.font,
            }}
          >
            {isVerify ? 'Verificar todos' : 'Revertir todos'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textLight }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, background: T.grayBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{text}</div>
    </div>
  );
}
