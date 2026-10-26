import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface UniversalFooterProps {
  variant?: 'public' | 'app';
}

export const UniversalFooter: React.FC<UniversalFooterProps> = ({ variant = 'public' }) => {
  const { isPublicLanding, setIsPublicLanding, setCurrentModule } = useApp();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const isAppVariant = variant === 'app' || !isPublicLanding;

  return (
    <footer 
      className="universal-footer" 
      style={{
        background: isAppVariant 
          ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' 
          : 'linear-gradient(180deg, #071f4c 0%, #051433 100%)',
        color: isAppVariant ? '#475569' : '#e2e8f0',
        borderTop: isAppVariant ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
        padding: isAppVariant ? '24px 20px 20px' : '48px 20px 32px',
        marginTop: isAppVariant ? '32px' : '0',
        transition: 'all 0.2s ease',
        width: '100%'
      }}
    >
      <div 
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: isAppVariant ? '16px' : '28px'
        }}
      >
        {/* Main Footer Row */}
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px'
          }}
        >
          {/* Brand & Slogan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: isAppVariant ? '38px' : '48px',
                height: isAppVariant ? '38px' : '48px',
                borderRadius: '50%',
                background: '#ffffff',
                padding: '2px',
                boxShadow: isAppVariant ? '0 2px 8px rgba(8,43,112,0.1)' : '0 3px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <img 
                src="/logo-laperle.jpg" 
                alt="LAPERLE TOUR HT" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} 
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span 
                  style={{
                    fontSize: isAppVariant ? '15px' : '17px',
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                    color: isAppVariant ? '#082b70' : '#ffffff'
                  }}
                >
                  LAPERLE
                </span>
                <span 
                  style={{
                    fontSize: isAppVariant ? '15px' : '17px',
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                    color: '#f97316'
                  }}
                >
                  TOUR HT
                </span>
              </div>
              <div 
                style={{
                  fontSize: isAppVariant ? '11.5px' : '12.5px',
                  fontStyle: 'italic',
                  color: isAppVariant ? '#64748b' : '#94a3b8',
                  marginTop: '1px'
                }}
              >
                « Un coup d'œil sur Haïti »
              </div>
            </div>
          </div>

          {/* Quick Nav & Mode Switcher */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '13px'
            }}
          >
            {isPublicLanding ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('plDevis');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                  className="hover:text-white"
                >
                  Simulateur de Devis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('plServices');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                  className="hover:text-white"
                >
                  Prestations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('plFlotte');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                  className="hover:text-white"
                >
                  Flotte VIP
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={() => setIsPublicLanding(false)}
                    style={{
                      background: 'rgba(249, 115, 22, 0.15)',
                      border: '1px solid rgba(249, 115, 22, 0.4)',
                      color: '#f97316',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '12.5px'
                    }}
                  >
                    Accéder au Centre de Contrôle ➔
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsPublicLanding(true)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#082b70',
                    borderRadius: '7px',
                    padding: '5px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🌐 Voir la Vitrine Publique
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentModule('dashboard')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                >
                  Tableau de bord
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentModule('reservations')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                >
                  Réservations
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Legal Line */}
        <div 
          style={{
            borderTop: isAppVariant ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: isAppVariant ? '12px' : '18px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: isAppVariant ? '11.5px' : '12px',
            color: isAppVariant ? '#94a3b8' : '#64748b'
          }}
        >
          <div>
            © {currentYear} <strong>LAPERLE TOUR HT</strong>. Tous droits réservés. Système de Gestion & Centre de Contrôle Opérationnel.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Conformité fiscale & administrative</span>
            <span aria-hidden="true">·</span>
            <span>Sécurité certifiée</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
