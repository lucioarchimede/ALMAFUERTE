import { IconUser, IconPhone, IconMail, IconBuilding, IconLogOut, IconChevronRight } from '../icons';

export default function MasScreen({ state, dispatch, addToast, onLogout }) {
  const { family } = state;
  const { parent, children } = family;

  const handleLogout = () => {
    if (onLogout) onLogout();
    else dispatch({ type: 'LOGOUT' });
  };

  const bankDetails = [
    { label: 'Banco', value: 'Banco Macro' },
    { label: 'CBU', value: '2850590940090418135201' },
    { label: 'Alias', value: 'colegio.almafuerte.pagos' },
    { label: 'Titular', value: 'Colegio Almafuerte SRL' },
  ];

  const handleCopy = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    addToast(`Copiado: ${label}`, 'success');
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))', fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
        padding: 'max(24px, env(safe-area-inset-top)) 20px 32px',
      }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>Más</h2>
      </div>

      {/* Profile card */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: '20px',
          marginBottom: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#1B5E20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>
              {parent.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
              {parent.name}
            </h3>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontWeight: 500 }}>
              Titular de la cuenta
            </p>
          </div>
        </div>

        {/* Contact info */}
        <SectionCard title="Mis datos">
          <InfoRow icon={<IconMail size={16} color="#9CA3AF" />} label="Correo" value={parent.email} />
          <InfoRow icon={<IconPhone size={16} color="#9CA3AF" />} label="Teléfono" value={parent.phone} last />
        </SectionCard>

        {/* Children */}
        <SectionCard title="Grupo familiar">
          {children.map((child, idx) => (
            <div key={child.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderBottom: idx < children.length - 1 ? '1px solid #E2E8F0' : 'none',
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: child.color + '22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: child.color }}>
                  {child.initial}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#111827' }}>
                  {child.name}
                </p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0', fontWeight: 500 }}>
                  {child.grade} · Legajo {child.legajo}
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1B5E20' }}>
                ${(child.cuota / 1000).toFixed(0)}k/mes
              </span>
            </div>
          ))}
        </SectionCard>

        {/* Bank details */}
        <SectionCard title="Datos bancarios del colegio">
          {bankDetails.map((item, idx) => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: idx < bankDetails.length - 1 ? '1px solid #E2E8F0' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{item.value}</p>
              </div>
              <button
                onClick={() => handleCopy(item.value, item.label)}
                style={{
                  background: '#F0FDF4',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  color: '#059669',
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
                }}
              >
                Copiar
              </button>
            </div>
          ))}
        </SectionCard>

        {/* Contact school */}
        <SectionCard title="Contactar al colegio">
          <InfoRow
            icon={<IconPhone size={16} color="#9CA3AF" />}
            label="Teléfono"
            value="(011) 4444-5555"
          />
          <InfoRow
            icon={<IconMail size={16} color="#9CA3AF" />}
            label="E-mail"
            value="info@colealmafuerte.com"
            last
          />
        </SectionCard>

        {/* App version */}
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
            Portal de Familias v1.0 · © 2026 Colegio Almafuerte
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            background: 'white',
            color: '#DC2626',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
          }}
        >
          <IconLogOut size={18} color="#DC2626" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '0 16px',
      marginBottom: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
    }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        margin: 0,
        padding: '14px 0 8px',
        borderBottom: '1px solid #E2E8F0',
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid #E2E8F0',
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}
