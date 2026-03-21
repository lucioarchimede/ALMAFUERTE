import { MONTHS } from './store';

// Dynamic current month number (Feb=2 … Dec=12). Clamped to school-year range.
const _now = new Date();
export const CURRENT_MONTH = Math.max(2, Math.min(_now.getMonth() + 1, 12));
export const CURRENT_YEAR = _now.getFullYear();

const CHILD_COLORS = ['#4CAF50', '#7B1FA2', '#1565C0', '#E65100', '#00838F', '#AD1457'];

export const getChildColor = (legajo) => CHILD_COLORS[legajo % CHILD_COLORS.length];

export const formatCurrency = (amount) => {
  return '$' + Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const getMonthName = (num) => {
  const m = MONTHS.find(m => m.num === num);
  return m ? m.name : '';
};

export const getMonthShort = (num) => {
  const m = MONTHS.find(m => m.num === num);
  return m ? m.short : '';
};

export const monthNameToNum = (name) => {
  const m = MONTHS.find(m => m.name === name);
  return m ? m.num : null;
};

// Returns 'pagado' | 'pendiente' | null
export const getMonthStatus = (childId, month, payments) => {
  const monthName = getMonthName(month);
  const relevant = payments.filter(p =>
    p.mes === monthName &&
    Array.isArray(p.studentIds) &&
    p.studentIds.includes(Number(childId))
  );
  if (relevant.length === 0) return null;
  if (relevant.some(p => p.estado === 'verificado')) return 'pagado';
  if (relevant.some(p => p.estado === 'pendiente')) return 'pendiente';
  return null;
};

// Returns 'pagado' | 'pendiente' | 'impago' | 'futuro'
export const getMonthCellStatus = (childId, month, payments) => {
  const payStatus = getMonthStatus(childId, month, payments);
  if (payStatus === 'pagado') return 'pagado';
  if (payStatus === 'pendiente') return 'pendiente';
  if (month <= CURRENT_MONTH) return 'impago';
  return 'futuro';
};

// Returns the payment record that made a month "pagado" or "pendiente"
export const getPaymentForChildMonth = (childId, month, payments) => {
  const monthName = getMonthName(month);
  return payments.find(p =>
    p.mes === monthName &&
    Array.isArray(p.studentIds) &&
    p.studentIds.includes(Number(childId)) &&
    p.estado === 'verificado'
  ) || payments.find(p =>
    p.mes === monthName &&
    Array.isArray(p.studentIds) &&
    p.studentIds.includes(Number(childId))
  );
};

// Returns 'ok' | 'pending' | 'overdue'
export const getChildOverallStatus = (childId, payments) => {
  const dueMonths = MONTHS.map(m => m.num).filter(m => m <= CURRENT_MONTH);
  let hasOverdue = false;
  let hasPending = false;
  for (const m of dueMonths) {
    const s = getMonthStatus(childId, m, payments);
    if (!s) hasOverdue = true;
    else if (s === 'pendiente') hasPending = true;
  }
  if (hasOverdue) return 'overdue';
  if (hasPending) return 'pending';
  return 'ok';
};

export const getDashboardStats = (family, payments) => {
  if (!family) return { totalDue: 0, totalPaid: 0, pendingPayments: 0, nextDueMonth: null };
  const dueMonths = MONTHS.map(m => m.num).filter(m => m <= CURRENT_MONTH);
  let totalDue = 0;
  let totalPaid = 0;
  const pendingPayments = payments.filter(p => p.estado === 'pendiente').length;

  // Skip children with 100% scholarship (cuota === 0) — they owe nothing
  const payingChildren = family.children.filter(c => (c.cuota || 0) > 0);

  for (const child of payingChildren) {
    for (const month of dueMonths) {
      totalDue++;
      const s = getMonthStatus(child.id, month, payments);
      if (s === 'pagado') totalPaid++;
    }
  }

  let nextDueMonth = null;
  for (const m of MONTHS.map(m => m.num)) {
    const allPaid = payingChildren.every(child => getMonthStatus(child.id, m, payments) !== null);
    if (!allPaid) { nextDueMonth = m; break; }
  }

  return { totalDue, totalPaid, pendingPayments, nextDueMonth };
};

// Which months are available to pay: only current/past months where at least one child has no payment
export const getAvailableMonths = (childIds, payments) => {
  return MONTHS.map(m => m.num).filter(month =>
    month <= CURRENT_MONTH &&
    childIds.some(childId => getMonthStatus(childId, month, payments) === null)
  );
};

// (childId, month) pairs where child has no payment
export const computePaymentItems = (childIds, months, payments, children) => {
  const items = [];
  for (const month of months) {
    for (const childId of childIds) {
      if (getMonthStatus(childId, month, payments) === null) {
        const child = children.find(c => c.id === Number(childId));
        if (child) items.push({ childId, month, child, amount: child.cuota });
      }
    }
  }
  return items;
};

export const generateConceptName = (months) => {
  if (months.length === 0) return 'Pago';
  if (months.length === 1) return `Cuota ${getMonthName(months[0])}`;
  if (months.length === 2) return `Cuotas ${getMonthName(months[0])} y ${getMonthName(months[1])}`;
  const allButLast = months.slice(0, -1).map(getMonthName).join(', ');
  const last = getMonthName(months[months.length - 1]);
  return `Cuotas ${allButLast} y ${last}`;
};

// ── Date parsing & payment sorting ───────────────────────────────────────────

export const parseDateToTimestamp = (dateStr) => {
  if (!dateStr) return Date.now(); // No date = treat as newest
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day).getTime();
  }
  return 0;
};

export const sortPaymentsNewestFirst = (payments) => {
  return [...payments].sort((a, b) => {
    // Prefer createdAt timestamp (most reliable — always set on new payments)
    if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
    if (a.createdAt) return -1; // a is newer
    if (b.createdAt) return 1;  // b is newer
    // Fallback: parse DD/MM/YYYY fecha
    return parseDateToTimestamp(b.fecha) - parseDateToTimestamp(a.fecha);
  });
};

export const getDisplayDate = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
};

export const methodLabel = (method) => {
  if (!method) return '';
  const m = method.toLowerCase();
  if (m === 'mercadopago') return 'MercadoPago';
  if (m === 'transferencia') return 'Transferencia';
  if (m === 'efectivo') return 'Efectivo';
  return method;
};

export const methodColor = (method) => {
  if (!method) return '#616161';
  if (method.toLowerCase() === 'mercadopago') return '#009EE3';
  return '#616161';
};

export const statusConfig = {
  verificado: { label: 'Verificado', color: '#43A047', bg: '#E8F5E9' },
  pendiente: { label: 'Pendiente', color: '#FF8F00', bg: '#FFF8E1' },
  pagado: { label: 'Pagado ✓', color: '#43A047', bg: '#E8F5E9' },
  impago: { label: 'Impago', color: '#E53935', bg: '#FFEBEE' },
  futuro: { label: '—', color: '#9E9E9E', bg: '#F5F5F5' },
};
