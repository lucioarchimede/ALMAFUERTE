import { useState } from 'react';
import { SchoolLogo } from '../icons';

export default function LoginScreen({ dispatch, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => {
      if (onLogin) onLogin(email);
      else dispatch({ type: 'LOGIN' });
    }, 800);
  };

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => {
      dispatch({ type: 'LOGIN' });
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      overflow: 'auto',
    }}>
      {/* Green header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: '60px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>

        <div style={{ position: 'relative' }}>
          <SchoolLogo size={72} white />
        </div>

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <h1 style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Portal de Familias
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 13,
            fontWeight: 500,
            marginTop: 4,
            letterSpacing: '0.5px',
          }}>
            COLEGIO ALMAFUERTE
          </p>
        </div>

        <div style={{ width: 32, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
      </div>

      {/* Form */}
      <div style={{
        flex: 1,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        <p style={{
          color: '#616161',
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 24,
          textAlign: 'center',
        }}>
          Ingresá con tu cuenta de familia
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#424242', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@email.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                fontSize: 16,
                fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                color: '#212121',
                background: 'white',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2E7D32'}
              onBlur={e => e.target.style.borderColor = '#EEEEEE'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#424242', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                fontSize: 16,
                fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                color: '#212121',
                background: 'white',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2E7D32'}
              onBlur={e => e.target.style.borderColor = '#EEEEEE'}
            />
          </div>

          <button
            type="button"
            style={{
              background: 'none',
              color: '#2E7D32',
              fontSize: 13,
              fontWeight: 700,
              padding: 0,
              textAlign: 'right',
              fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#6B9E70' : '#1B5E20',
              color: 'white',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              marginTop: 4,
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#EEEEEE' }} />
          <span style={{ fontSize: 12, color: '#9E9E9E', fontWeight: 600 }}>o</span>
          <div style={{ flex: 1, height: 1, background: '#EEEEEE' }} />
        </div>

        {/* Demo button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            background: 'none',
            color: '#1B5E20',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            border: '1px solid #E2E8F0',
            letterSpacing: '0.2px',
          }}
        >
          Ingresar como Demo
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#9E9E9E',
          marginTop: 12,
        }}>
          Accedé con la familia García de muestra
        </p>

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#BDBDBD', fontWeight: 500 }}>
            © 2026 Colegio Almafuerte · Portal de Familias v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
