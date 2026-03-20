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
import { SchoolLogo } from './icons';

const ADMIN_EMAILS = ['admin@almafuerte.edu.ar'];
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
          setAdminPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    const ref = await addDoc(collection(db, 'payments'), data);
    setAdminPayments(prev => [{ id: ref.id, ...data }, ...prev]);
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
    const ref = await addDoc(collection(db, 'payments'), paymentData);
    dispatch({ type: 'ADD_PAYMENT', payment: { id: ref.id, ...paymentData } });
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <CurrentScreen state={state} dispatch={dispatch} addToast={addToast} onLogout={handleLogout} />
      </div>

      <BottomNav currentScreen={state.currentScreen} dispatch={dispatch} />

      {state.showPaymentFlow && (
        <PaymentFlow state={state} dispatch={dispatch} addToast={addToast} onAddPayment={handleFamilyAddPayment} />
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
      <span style={{ fontSize: 48 }}>⚠️</span>
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
      background: 'white', fontFamily: "'IBM Plex Sans', 'Nunito', sans-serif",
    }}>
      {/* Green top strip */}
      <div style={{
        background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 100%)',
        padding: '40px 24px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ position: 'relative' }}>
          <SchoolLogo size={68} white />
        </div>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>Colegio Almafuerte</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '4px 0 0', letterSpacing: '0.5px' }}>
            PORTAL DE COBRANZAS
          </p>
        </div>
        <div style={{ width: 40, height: 3, background: 'linear-gradient(90deg,#F9A825,#FFD54F)', borderRadius: 2, position: 'relative' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: '#9E9E9E', textAlign: 'center', margin: '0 0 8px' }}>
          Sesión iniciada como <strong style={{ color: '#212121' }}>{email}</strong>
        </p>

        {/* Portal Familias card */}
        <button
          onClick={onSelectFamilias}
          style={{
            width: '100%', padding: '20px', borderRadius: 16,
            border: '2px solid #E8F5E9', background: '#F9FFF9',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg,#2E7D32,#43A047)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>👨‍👩‍👧</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#212121', marginBottom: 3 }}>Portal Familias</div>
              <div style={{ fontSize: 13, color: '#9E9E9E' }}>
                {familyName ? `Familia ${familyName}` : 'Ver como familia'}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#9E9E9E', fontSize: 18 }}>›</span>
          </div>
        </button>

        {/* Admin panel card */}
        <button
          onClick={onSelectAdmin}
          style={{
            width: '100%', padding: '20px', borderRadius: 16,
            border: '2px solid #E8F0FE', background: '#F8F9FF',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg,#1B5E20,#2E7D32)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>⚙️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#212121', marginBottom: 3 }}>Panel Administrativo</div>
              <div style={{ fontSize: 13, color: '#9E9E9E' }}>
                {studentCount} alumnos registrados
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#9E9E9E', fontSize: 18 }}>›</span>
          </div>
        </button>

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: '#FFF5F5', color: '#E53935',
              border: '1.5px solid #FFCDD2', fontSize: 14, fontWeight: 700,
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
