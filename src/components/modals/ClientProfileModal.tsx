import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const ClientProfileModal: React.FC = () => {
  const { user, profile, isProfileComplete, updateUserProfile } = useAuth();
  const { clientProfileModalOpen, setClientProfileModalOpen, showToast, saveClient, clients } = useApp();

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('Port-au-Prince');
  const [societe, setSociete] = useState('');
  const [numeroFiscal, setNumeroFiscal] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync inputs with current profile when modal opens
  useEffect(() => {
    if (clientProfileModalOpen && profile) {
      setNom(profile.nom || profile.name || user?.displayName || '');
      setTelephone(profile.telephone || profile.phone || '');
      setAdresse(profile.adresse || '');
      setVille(profile.ville || 'Port-au-Prince');
      setSociete(profile.societe || '');
      setNumeroFiscal(profile.numeroFiscal || '');
      setErrorMsg('');
    }
  }, [clientProfileModalOpen, profile, user]);

  if (!clientProfileModalOpen) return null;

  // Calculate fields completed
  const fieldsFilled = [
    Boolean(nom.trim()),
    Boolean(telephone.trim()),
    Boolean(adresse.trim()),
    Boolean(societe.trim()),
    Boolean(numeroFiscal.trim())
  ].filter(Boolean).length;

  const completionPct = Math.round((fieldsFilled / 5) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim() || !adresse.trim() || !societe.trim() || !numeroFiscal.trim()) {
      setErrorMsg('Veuillez remplir l\'ensemble des 5 champs obligatoires pour valider votre profil client.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      await updateUserProfile({
        nom: nom.trim(),
        name: nom.trim(),
        telephone: telephone.trim(),
        phone: telephone.trim(),
        adresse: adresse.trim(),
        ville: ville.trim(),
        societe: societe.trim(),
        numeroFiscal: numeroFiscal.trim()
      });

      // Also upsert client directory entry for seamless invoicing & bookings
      try {
        const existingClient = clients.find(
          c => c.id === user?.uid || (user?.email && c.email === user.email)
        );
        await saveClient({
          id: existingClient?.id || user?.uid || `CLI-${Date.now().toString().slice(-5)}`,
          name: societe.trim().toLowerCase() === 'particulier' ? nom.trim() : `${nom.trim()} (${societe.trim()})`,
          telephone: telephone.trim(),
          email: user?.email || profile?.email || '',
          address: `${adresse.trim()}, ${ville.trim()}`,
          city: ville.trim(),
          type: societe.trim().toLowerCase() === 'particulier' ? 'Particulier' : 'Entreprise'
        });
      } catch (clientErr) {
        console.warn('Sync to clients directory handled locally:', clientErr);
      }

      showToast('Profil client complété et enregistré avec succès !', 'success');
      setClientProfileModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Erreur lors de l\'enregistrement du profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="modal-backdrop open" 
      onClick={(e) => {
        if (e.target === e.currentTarget && isProfileComplete) {
          setClientProfileModalOpen(false);
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 20, 56, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div 
        className="modal client-profile-modal" 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeInScale 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #082b70 0%, #123c98 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '26px' }}>👤</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Compléter mon Profil Client
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                  Informations requises pour vos réservations et factures officielles
                </p>
              </div>
            </div>
            {isProfileComplete && (
              <button 
                type="button" 
                onClick={() => setClientProfileModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 0,
                  borderRadius: '50%',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Fermer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#e2e8f0', marginBottom: '4px' }}>
              <span>Progression du profil</span>
              <strong>{fieldsFilled}/5 champs ({completionPct}%)</strong>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${completionPct}%`, 
                  background: completionPct === 100 ? '#22c55e' : '#f7941d',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMsg && (
            <div 
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px'
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Nom complet */}
            <div className="field">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                Nom complet (Prénom & Nom) <span style={{ color: '#ef4444' }}>*</span> :
              </label>
              <input 
                type="text"
                placeholder="Ex : Jean-Claude Moïse"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13.5px'
                }}
              />
            </div>

            {/* 2. Téléphone WhatsApp */}
            <div className="field">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                Téléphone (WhatsApp & Appels direct) <span style={{ color: '#ef4444' }}>*</span> :
              </label>
              <input 
                type="tel"
                placeholder="+509 4440 8687"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13.5px'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Indispensable pour la confirmation instantanée de vos navettes et courses.
              </span>
            </div>

            {/* 3. Adresse & Ville */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div className="field">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  Adresse de résidence / livraison <span style={{ color: '#ef4444' }}>*</span> :
                </label>
                <input 
                  type="text"
                  placeholder="Ex : 24, Rue Rebecca, Delmas 75"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              <div className="field">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  Commune / Ville :
                </label>
                <select
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                >
                  <option value="Port-au-Prince">Port-au-Prince</option>
                  <option value="Pétion-Ville">Pétion-Ville</option>
                  <option value="Delmas">Delmas</option>
                  <option value="Tabarre">Tabarre</option>
                  <option value="Carrefour">Carrefour</option>
                  <option value="Cap-Haïtien">Cap-Haïtien</option>
                  <option value="Jacmel">Jacmel</option>
                  <option value="Saint-Marc">Saint-Marc</option>
                  <option value="Gonaïves">Gonaïves</option>
                  <option value="Les Cayes">Les Cayes</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            {/* 4. Société / Raison Sociale */}
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Société / Entreprise <span style={{ color: '#ef4444' }}>*</span> :
                </label>
                <button
                  type="button"
                  onClick={() => setSociete('Particulier')}
                  style={{
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Cliquer si vous êtes un particulier"
                >
                  Cliquer si « Particulier »
                </button>
              </div>
              <input 
                type="text"
                placeholder="Ex : Ambassade, Entreprise SAS ou Particulier"
                value={societe}
                onChange={(e) => setSociete(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13.5px'
                }}
              />
            </div>

            {/* 5. Numéro Fiscal (NIF / CIF) */}
            <div className="field">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                Numéro fiscal (NIF / CIF / Matricule) <span style={{ color: '#ef4444' }}>*</span> :
              </label>
              <input 
                type="text"
                placeholder="Ex : 001-234-567-8"
                value={numeroFiscal}
                onChange={(e) => setNumeroFiscal(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13.5px'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Requis par la DGI pour l'émission des factures et bordereaux fiscaux.
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '10px', 
              marginTop: '22px', 
              paddingTop: '16px', 
              borderTop: '1px solid #e2e8f0' 
            }}
          >
            {isProfileComplete && (
              <button 
                type="button"
                onClick={() => setClientProfileModalOpen(false)}
                className="secondary"
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Fermer
              </button>
            )}
            <button 
              type="submit"
              disabled={saving}
              className="primary"
              style={{
                background: '#082b70',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {saving ? 'Enregistrement en cours...' : '💾 Valider mon profil client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
