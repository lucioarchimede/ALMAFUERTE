import { useReducer, useCallback, useState, useEffect } from 'react';
import './App.css';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { INITIAL_STATE, reducer } from './store';
import { ToastContainer } from './components/Toast';
import { BottomNav } from './components/BottomNav';
import { PaymentFlow } from './components/PaymentFlow';
import AdminView from './components/AdminView';
import Login from './components/Login';
import HomeScreen from './screens/HomeScreen';
import HistorialScreen from './screens/HistorialScreen';
import ComprobantesScreen from './screens/ComprobantesScreen';
import MasScreen from './screens/MasScreen';
import { SchoolLogo, IconUsers, IconSettings } from './icons';
import { sortPaymentsNewestFirst } from './utils';

const ADMIN_EMAILS = ['admin@almafuerte.edu.ar'];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Pago verificado',
    message: 'Cuota Febrero acreditada para tus hijos.',
    timestamp: '5 Feb',
    read: true,
  },
  {
    id: 'n2',
    title: 'Próximo vencimiento',
    message: 'La cuota de Abril vence el 10/04.',
    timestamp: 'Hoy',
    read: false,
  },
];
const CHILD_COLORS = ['#4CAF50', '#7B1FA2', '#1565C0', '#E65100', '#00838F', '#AD1457'];

const SCREENS = {
  home: HomeScreen,
  historial: HistorialScreen,
  comprobantes: ComprobantesScreen,
  mas: MasScreen,
};

export default function App() {
  // undefined = Firebase still initialising, null = signed out, object = signed in
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [role, setRole] = useState(null); // null | 'familias' | 'admin'
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Notification state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const addNotification = useCallback((title, message) => {
    setNotifications(prev => [{
      id: `n-${Date.now()}`,
      title,
      message,
      timestamp: 'Ahora',
      read: false,
    }, ...prev]);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Admin state (loaded from Firestore)
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminRates, setAdminRates] = useState({});
  const [adminPayments, setAdminPayments] = useState([]);

  const addToast = useCallback((message, toastType = 'success') => {
    dispatch({ type: 'ADD_TOAST', message, toastType });
  }, []);

  // ── Firebase Auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setRole(null);
        setDataError(null);
        dispatch({ type: 'LOGOUT' });
      }
    });
    return unsub;
  }, []);

  // ── Firestore data loading ──────────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;
    const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
    setDataLoading(true);
    setDataError(null);

    const loadData = async () => {
      try {
        const ratesDoc = await getDoc(doc(db, 'config', 'rates'));
        const ratesData = ratesDoc.exists() ? ratesDoc.data() : {};

        if (isAdmin) {
          setAdminRates(ratesData);
          const [stuSnap, paySnap] = await Promise.all([
            getDocs(collection(db, 'students')),
            getDocs(collection(db, 'payments')),
          ]);
          setAdminStudents(stuSnap.docs.map(d => d.data()));
          setAdminPayments(sortPaymentsNewestFirst(paySnap.docs.map(d => ({ id: d.id, ...d.data() }))));
        } else {
          const famQuery = query(collection(db, 'Familias'), where('authUid', '==', firebaseUser.uid));
          const famSnap = await getDocs(famQuery);
          if (famSnap.empty) {
            setDataError('No se encontró una familia asociada a este usuario. Contactá al colegio.');
            return;
          }
          const famDoc = famSnap.docs[0];
          const famData = famDoc.data();
          const familiaId = famDoc.id;

          const stuQuery = query(collection(db, 'students'), where('familiaId', '==', familiaId));
          const stuSnap = await getDocs(stuQuery);
          const students = stuSnap.docs.map(d => d.data());
          students.sort((a, b) => a.legajo - b.legajo);

          const children = students.map((s, idx) => ({
            id: s.legajo,
            name: `${s.nombre} ${s.apellido}`,
            shortName: s.nombre,
            grade: s.curso,
            legajo: s.legajo,
            cuota: Math.round((ratesData[s.nivel] || 0) * (1 - (s.beca || 0))),
            color: CHILD_COLORS[idx % CHILD_COLORS.length],
            initial: s.nombre.charAt(0),
          }));

          const responsable = famData.responsable || famData.nombre || '';
          const family = {
            id: familiaId,
            parent: {
              name: responsable,
              firstName: responsable.split(' ')[0],
              email: famData.email || firebaseUser.email || '',
              phone: famData.telefono || '',
            },
            children,
          };

          dispatch({ type: 'SET_FAMILY_DATA', family, familiaId });
          dispatch({ type: 'SET_RATES', rates: ratesData });

          const payQuery = query(collection(db, 'payments'), where('familiaId', '==', familiaId));
          const paySnap = await getDocs(payQuery);
          const payments = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
          dispatch({ type: 'SET_PAYMENTS', payments });
        }
      } catch (err) {
        console.error('Error loading Firestore data:', err);
        setDataError('Error al cargar los datos. Intentá de nuevo.');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [firebaseUser]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // ── Admin Firestore handlers ────────────────────────────────────────────────
  const handleAdminUpdatePayment = useCallback(async (paymentId, newStatus) => {
    await updateDoc(doc(db, 'payments', paymentId), { estado: newStatus });
    setAdminPayments(prev => prev.map(p => p.id === paymentId ? { ...p, estado: newStatus } : p));
  }, []);

  const handleAdminAddPayment = useCallback(async (data) => {
    const dataWithTs = { ...data, createdAt: Date.now() };
    const ref = await addDoc(collection(db, 'payments'), dataWithTs);
    setAdminPayments(prev => [{ id: ref.id, ...dataWithTs }, ...prev]);
  }, []);

  const handleAdminUpdateRate = useCallback(async (nivel, value) => {
    await updateDoc(doc(db, 'config', 'rates'), { [nivel]: value });
    setAdminRates(prev => ({ ...prev, [nivel]: value }));
  }, []);

  const handleAdminUpdateStudent = useCallback(async (studentData) => {
    await setDoc(doc(db, 'students', String(studentData.legajo)), studentData);
    setAdminStudents(prev => prev.map(s => s.legajo === studentData.legajo ? { ...s, ...studentData } : s));
  }, []);

  // ── Family payment handler ──────────────────────────────────────────────────
  const handleFamilyAddPayment = useCallback(async (paymentData) => {
    const dataWithTs = { ...paymentData, createdAt: Date.now() };
    const ref = await addDoc(collection(db, 'payments'), dataWithTs);
    const fullPayment = { id: ref.id, ...dataWithTs };
    dispatch({ type: 'ADD_PAYMENT', payment: fullPayment });
    setAdminPayments(prev => [fullPayment, ...prev]);
  }, []);

  // ── 1. Firebase still initialising ─────────────────────────────────────────
  if (firebaseUser === undefined) return <SplashScreen />;

  // ── 2. Not signed in ────────────────────────────────────────────────────────
  if (firebaseUser === null) return <Login />;

  // ── 3. Loading Firestore data ───────────────────────────────────────────────
  if (dataLoading) return <SplashScreen />;

  // ── 4. Data error ───────────────────────────────────────────────────────────
  if (dataError) return <ErrorScreen message={dataError} onLogout={handleLogout} />;

  // ── 5. Admin role selection ─────────────────────────────────────────────────
  const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);

  if (isAdmin && role === null) {
    return (
      <RoleSelectScreen
        email={firebaseUser.email}
        studentCount={adminStudents.length}
        familyName={state.family?.parent?.name}
        onSelectFamilias={() => { dispatch({ type: 'LOGIN' }); setRole('familias'); }}
        onSelectAdmin={() => setRole('admin')}
        onLogout={handleLogout}
      />
    );
  }

  // ── 6. Admin panel ──────────────────────────────────────────────────────────
  if (role === 'admin') {
    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <AdminView
          allStudents={adminStudents}
          rates={adminRates}
          payments={adminPayments}
          onBack={() => setRole(null)}
          onUpdatePayment={handleAdminUpdatePayment}
          onAddPayment={handleAdminAddPayment}
          onUpdateRate={handleAdminUpdateRate}
          onUpdateStudent={handleAdminUpdateStudent}
        />
      </div>
    );
  }

  // ── 7. Family portal ────────────────────────────────────────────────────────
  if (!state.isLoggedIn) dispatch({ type: 'LOGIN' });

  const CurrentScreen = SCREENS[state.currentScreen] || HomeScreen;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="scroll-y" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <CurrentScreen
          state={state}
          dispatch={dispatch}
          addToast={addToast}
          onLogout={handleLogout}
          notifications={notifications}
          onMarkAllRead={markAllNotificationsRead}
        />
      </div>

      <BottomNav currentScreen={state.currentScreen} dispatch={dispatch} />

      {state.showPaymentFlow && (
        <PaymentFlow
          state={state}
          dispatch={dispatch}
          addToast={addToast}
          onAddPayment={handleFamilyAddPayment}
          onAddNotification={addNotification}
        />
      )}

      <ToastContainer toasts={state.toasts} dispatch={dispatch} />
    </div>
  );
}

// ── Splash screen ──────────────────────────────────────────────────────────────

function SplashScreen() {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'white', gap: 20,
    }}>
      <SchoolLogo size={56} />
      <div className="spinner-green" />
      <p style={{
        fontSize: 13, color: '#9E9E9E', fontWeight: 500,
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}>
        Cargando...
      </p>
    </div>
  );
}

// ── Error screen ───────────────────────────────────────────────────────────────

function ErrorScreen({ message, onLogout }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'white', gap: 16, padding: '0 32px', textAlign: 'center',
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><span style={{ fontSize: 32 }}>!</span></div>
      <p style={{ fontSize: 15, color: '#424242', fontWeight: 600, margin: 0 }}>{message}</p>
      <button
        onClick={onLogout}
        style={{
          padding: '12px 24px',
          background: '#FFEBEE',
          color: '#E53935',
          border: '1.5px solid #FFCDD2',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

// ── Role Selection Screen ─────────────────────────────────────────────────────

function RoleSelectScreen({ email, studentCount, familyName, onSelectFamilias, onSelectAdmin, onLogout }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#F8FAFC', fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
    }}>
      {/* Green top strip */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: '40px 24px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <SchoolLogo size={68} white />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>Colegio Almafuerte</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0', letterSpacing: '0.5px' }}>
            PORTAL DE COBRANZAS
          </p>
        </div>
        <div style={{ width: 32, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '0 0 8px' }}>
          Sesión iniciada como <strong style={{ color: '#111827' }}>{email}</strong>
        </p>

        {/* Portal Familias card */}
        <button
          onClick={onSelectFamilias}
          style={{
            width: '100%', padding: '20px', borderRadius: 16,
            border: '1px solid #E2E8F0', background: 'white',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#1B5E20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconUsers size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 3 }}>Portal Familias</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                {familyName ? `Familia ${familyName}` : 'Ver como familia'}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: 18 }}>›</span>
          </div>
        </button>

        {/* Admin panel card */}
        <button
          onClick={onSelectAdmin}
          style={{
            width: '100%', padding: '20px', borderRadius: 16,
            border: '1px solid #E2E8F0', background: 'white',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: '#1B5E20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconSettings size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 3 }}>Panel Administrativo</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                {studentCount} alumnos registrados
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: 18 }}>›</span>
          </div>
        </button>

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '13px', borderRadius: 10,
              background: 'none', color: '#6B7280',
              border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
