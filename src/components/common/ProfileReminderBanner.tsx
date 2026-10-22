import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const ProfileReminderBanner: React.FC = () => {
  const { user, profile, isProfileComplete } = useAuth();
  const { setClientProfileModalOpen } = useApp();
  const [minimized, setMinimized] = useState(false);

  // If not logged in or profile is already complete, do not render banner
  if (!user || isProfileComplete) return null;

  // Identify missing fields
  const missingItems: string[] = [];
  if (!profile?.nom?.trim() && !profile?.name?.trim()) missingItems.push('Nom complet');
  if (!profile?.telephone?.trim() && !profile?.phone?.trim()) missingItems.push('Téléphone');
  if (!profile?.adresse?.trim()) missingItems.push('Adresse');
  if (!profile?.societe?.trim()) missingItems.push('Société');
  if (!profile?.numeroFiscal?.trim()) missingItems.push('Numéro fiscal (NIF)');

  if (minimized) {
    return (
      <div 
        style={{
          background: '#fffbeb',
          borderBottom: '1px solid #fef3c7',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#92400e'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span>
          <span>Profil client incomplet ({5 - missingItems.length}/5 renseignés).</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setClientProfileModalOpen(true)}
            style={{
              background: '#f59e0b',
              color: '#ffffff',
              border: 0,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Compléter
          </button>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            style={{ background: 'none', border: 0, color: '#b45309', cursor: 'pointer', fontSize: '11px' }}
          >
            Agrandir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="profile-reminder-banner"
      style={{
        background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
        border: '1.5px solid #f59e0b',
        borderRadius: '12px',
        padding: '14px 18px',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 300px' }}>
        <div 
          style={{
            background: '#f59e0b',
            color: '#fff',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}
        >
          📝
        </div>
        <div>
          <strong style={{ display: 'block', fontSize: '14px', color: '#92400e', fontWeight: 800 }}>
            Complétez votre profil client pour finaliser vos dossiers
          </strong>
          <p style={{ margin: '3px 0 6px', fontSize: '12px', color: '#78350f', lineHeight: 1.4 }}>
            Pour éditer vos devis officiels, réserver vos courses et recevoir vos factures régularisées, veuillez renseigner vos coordonnées complètes.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Champs requis :</span>
            {['Nom complet', 'Téléphone', 'Adresse', 'Société', 'Numéro fiscal (NIF)'].map((field) => {
              const isMissing = missingItems.includes(field);
              return (
                <span 
                  key={field}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    background: isMissing ? '#fee2e2' : '#dcfce7',
                    color: isMissing ? '#991b1b' : '#166534',
                    border: `1px solid ${isMissing ? '#fca5a5' : '#86efac'}`
                  }}
                >
                  {isMissing ? '✕ ' : '✓ '} {field}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setClientProfileModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #f7941d 0%, #ea580c 100%)',
            color: '#ffffff',
            border: 0,
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(247, 148, 29, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>✍️</span> <span>Compléter mon profil</span>
        </button>

        <button
          type="button"
          onClick={() => setMinimized(true)}
          title="Réduire le rappel"
          style={{
            background: 'rgba(0,0,0,0.06)',
            border: 0,
            borderRadius: '6px',
            color: '#78350f',
            padding: '8px 10px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Réduire
        </button>
      </div>
    </div>
  );
};
