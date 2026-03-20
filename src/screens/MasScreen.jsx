import { IconUser, IconPhone, IconMail, IconBuilding, IconLogOut, IconChevronRight } from '../icons';

export default function MasScreen({ state, dispatch, addToast, onLogout }) {
  const { family } = state;
  const { parent, children } = family;

  const handleLogout = () => {
    // onLogout calls Firebase signOut → onAuthStateChanged resets everything
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
    addToast(`¡Copiado! ${label}`, 'success');
  };

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100%', paddingBottom: 28 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 100%)',
        padding: '24px 20px 32px',
      }}>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>Más</h2>
      </div>

      {/* Profile card */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '20px',
          marginBottom: 14,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2E7D32, #43A047)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>
              {parent.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#212121', margin: '0 0 4px' }}>
              {parent.name}
            </h3>
            <p style={{ fontSize: 13, color: '#9E9E9E', margin: 0, fontWeight: 500 }}>
              Titular de la cuenta
            </p>
          </div>
        </div>

        {/* Contact info */}
        <SectionCard title="Mis datos">
          <InfoRow icon={<IconMail size={16} color="#9E9E9E" />} label="Correo" value={parent.email} />
          <InfoRow icon={<IconPhone size={16} color="#9E9E9E" />} label="Teléfono" value={parent.phone} last />
        </SectionCard>

        {/* Children */}
        <SectionCard title="Grupo familiar">
          {children.map((child, idx) => (
            <div key={child.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderBottom: idx < children.length - 1 ? '1px solid #F5F5F5' : 'none',
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
                <span style={{ fontSize: 16, fontWeight: 800, color: child.color }}>
                  {child.initial}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#212121' }}>
                  {child.name}
                </p>
                <p style={{ fontSize: 12, color: '#9E9E9E', margin: '2px 0 0', fontWeight: 500 }}>
                  {child.grade} · Legajo {child.legajo}
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32' }}>
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
              borderBottom: idx < bankDetails.length - 1 ? '1px solid #F5F5F5' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#212121', margin: 0 }}>{item.value}</p>
              </div>
              <button
                onClick={() => handleCopy(item.value, item.label)}
                style={{
                  background: '#E8F5E9',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  color: '#2E7D32',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
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
            icon={<IconPhone size={16} color="#9E9E9E" />}
            label="Teléfono"
            value="(011) 4444-5555"
          />
          <InfoRow
            icon={<IconMail size={16} color="#9E9E9E" />}
            label="E-mail"
            value="info@colealmafuerte.com"
            last
          />
        </SectionCard>

        {/* App version */}
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <p style={{ fontSize: 11, color: '#BDBDBD', fontWeight: 500 }}>
            Portal de Familias v1.0 · © 2026 Colegio Almafuerte
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '15px',
            background: '#FFEBEE',
            color: '#E53935',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 800,
            border: '2px solid #FFCDD2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <IconLogOut size={18} color="#E53935" />
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
      borderRadius: 16,
      padding: '0 16px',
      marginBottom: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      <p style={{
        fontSize: 12,
        fontWeight: 800,
        color: '#2E7D32',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        margin: 0,
        padding: '14px 0 8px',
        borderBottom: '1px solid #F5F5F5',
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
      borderBottom: last ? 'none' : '1px solid #F5F5F5',
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#212121', margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}
