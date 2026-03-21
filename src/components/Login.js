import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { SchoolLogo } from '../icons';

function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No existe una cuenta con ese email. Contacte al colegio.';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta.';
    case 'auth/invalid-credential':
      return 'Email o contraseña incorrectos.';
    case 'auth/invalid-email':
      return 'El formato del email no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta fue deshabilitada. Contacte al colegio.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verificá tu conexión a internet.';
    default:
      return 'Error al iniciar sesión. Intentá de nuevo.';
  }
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const [showForgot, setShowForgot]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg]         = useState(null);

  const openForgot = () => { setForgotEmail(email.trim()); setForgotMsg(null); setShowForgot(true); };
  const closeForgot = () => { setShowForgot(false); setForgotMsg(null); };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || forgotLoading) return;
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotMsg({ text: 'Se envió un enlace a tu email. Revisá tu bandeja de entrada y spam.', type: 'success' });
      setTimeout(() => { setShowForgot(false); setForgotMsg(null); }, 5000);
    } catch (err) {
      const code = err.code;
      let text = 'Error al enviar el enlace. Intentá de nuevo.';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') text = 'No existe una cuenta con ese email.';
      setForgotMsg({ text, type: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#F8FAFC',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: 'max(52px, env(safe-area-inset-top)) 32px 44px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <SchoolLogo size={56} white />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Colegio Almafuerte
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600, margin: '5px 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Portal de Familias
          </p>
        </div>
        <div style={{ width: 32, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
      </div>

      {/* Form card */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 24px 40px',
        maxWidth: 380,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {showForgot ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                Recuperar contraseña
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleForgot} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Correo electrónico">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => { setForgotEmail(e.target.value); setForgotMsg(null); }}
                  placeholder="nombre@email.com"
                  autoComplete="email"
                  disabled={forgotLoading}
                  style={inputStyle}
                />
              </Field>

              {forgotMsg && (
                <div style={{
                  background: forgotMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${forgotMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: forgotMsg.type === 'success' ? '#059669' : '#DC2626',
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}>
                  {forgotMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!forgotEmail.trim() || forgotLoading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: (forgotEmail.trim() && !forgotLoading) ? '#1B5E20' : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: (forgotEmail.trim() && !forgotLoading) ? 'pointer' : 'not-allowed',
                  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                }}
              >
                {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <button
              onClick={closeForgot}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#6B7280', textAlign: 'center',
                fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                padding: '10px 0', minHeight: 44, width: '100%',
              }}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, textAlign: 'center', fontWeight: 400 }}>
              Ingresá con tu cuenta institucional
            </p>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Correo electrónico">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="nombre@email.com"
                  autoComplete="email"
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>

              <Field label="Contraseña">
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>

              {error && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500, lineHeight: 1.5 }}>
                    {error}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: canSubmit ? '#1B5E20' : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                  letterSpacing: '0.2px',
                  marginTop: 4,
                }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <button
              onClick={openForgot}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#6B7280', textAlign: 'center',
                marginTop: 8,
                fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                padding: '10px 0', minHeight: 44, width: '100%',
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </>
        )}

        {!showForgot && (
          <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
            ¿No tenés acceso?<br />
            Contactá al colegio para que te creen una cuenta.
          </p>
        )}
      </div>

      <div style={{ padding: '12px 0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#D1D5DB', margin: 0 }}>
          © 2026 Colegio Almafuerte
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 16,
  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
  color: '#111827',
  background: 'white',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
};
