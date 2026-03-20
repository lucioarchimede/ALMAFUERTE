import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { SchoolLogo } from '../icons';

// ── Spanish error messages by Firebase error code ────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Forgot password state
  const [showForgot, setShowForgot]     = useState(false);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg]       = useState(null); // { text, type: 'success'|'error' }

  const openForgot = () => {
    setForgotEmail(email.trim());
    setForgotMsg(null);
    setShowForgot(true);
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotMsg(null);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || forgotLoading) return;
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotMsg({
        text: 'Se envió un enlace a tu email. Revisá tu bandeja de entrada y spam.',
        type: 'success',
      });
      setTimeout(() => {
        setShowForgot(false);
        setForgotMsg(null);
      }, 5000);
    } catch (err) {
      const code = err.code;
      let text = 'Error al enviar el enlace. Intentá de nuevo.';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        text = 'No existe una cuenta con ese email.';
      }
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
      // onAuthStateChanged in App.jsx handles the rest automatically
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
      background: '#FAFBFC',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
    }}>
      {/* Green header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: '52px 32px 44px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle dot pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          pointerEvents: 'none',
        }} />

        {/* School logo */}
        <div style={{ position: 'relative' }}>
          <SchoolLogo size={64} white />
        </div>

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <h1 style={{
            color: 'white',
            fontSize: 21,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.2px',
          }}>
            Colegio Almafuerte
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: 13,
            fontWeight: 400,
            margin: '5px 0 0',
            letterSpacing: '0.3px',
          }}>
            Portal de Familias
          </p>
        </div>

        {/* Gold accent */}
        <div style={{
          width: 36, height: 3,
          background: 'linear-gradient(90deg, #F9A825, #FFD54F)',
          borderRadius: 2, position: 'relative',
        }} />
      </div>

      {/* Form card */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 24px 40px',
        maxWidth: 360,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {showForgot ? (
          /* ─── Forgot password view ─── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B5E20', margin: '0 0 6px' }}>
                Recuperar contraseña
              </h2>
              <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.6 }}>
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
                  background: forgotMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${forgotMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: forgotMsg.type === 'success' ? '#059669' : '#DC2626',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  animation: 'fadeIn 0.2s ease',
                }}>
                  {forgotMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={!forgotEmail.trim() || forgotLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: (forgotEmail.trim() && !forgotLoading)
                    ? 'linear-gradient(135deg, #1B5E20, #2E7D32)'
                    : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: (forgotEmail.trim() && !forgotLoading) ? 'pointer' : 'not-allowed',
                  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                  boxShadow: (forgotEmail.trim() && !forgotLoading)
                    ? '0 4px 14px rgba(27,94,32,0.3)'
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {forgotLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Spinner /> Enviando...
                  </span>
                ) : 'Enviar enlace'}
              </button>
            </form>

            <button
              onClick={closeForgot}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#6B7280', textAlign: 'center',
                fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                padding: 0,
              }}
            >
              ← Volver al login
            </button>
          </div>
        ) : (
          /* ─── Normal login view ─── */
          <>
            <p style={{
              fontSize: 14,
              color: '#4B5563',
              marginBottom: 24,
              textAlign: 'center',
              fontWeight: 400,
            }}>
              Ingresá con tu cuenta institucional
            </p>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Email */}
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

              {/* Password */}
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

              {/* Error banner */}
              {error && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <span style={{ flexShrink: 0, fontSize: 14 }}>⚠️</span>
                  <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 500, lineHeight: 1.5 }}>
                    {error}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: canSubmit
                    ? 'linear-gradient(135deg, #1B5E20, #2E7D32)'
                    : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                  letterSpacing: '0.2px',
                  boxShadow: canSubmit ? '0 4px 14px rgba(27,94,32,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  marginTop: 4,
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Spinner /> Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>

            </form>

            {/* Forgot password link */}
            <button
              onClick={openForgot}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#6B7280', textAlign: 'center',
                marginTop: 12,
                fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                padding: 0,
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </>
        )}

        {/* Footer note — only on login view */}
        {!showForgot && (
          <p style={{
            marginTop: 32,
            textAlign: 'center',
            fontSize: 12,
            color: '#9CA3AF',
            lineHeight: 1.6,
          }}>
            ¿No tenés acceso?<br />
            Contactá al colegio para que te creen una cuenta.
          </p>
        )}
      </div>

      {/* Bottom copyright */}
      <div style={{ padding: '12px 0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#D1D5DB', margin: 0 }}>
          © 2026 Colegio Almafuerte
        </p>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        letterSpacing: '0.2px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="16" height="16"
      viewBox="0 0 16 16"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
  color: '#111827',
  background: 'white',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
};
