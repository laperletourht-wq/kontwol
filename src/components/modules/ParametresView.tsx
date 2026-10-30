import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const ParametresView: React.FC = () => {
  const { settings, saveSettings, showToast, saveClient, clients, resetAllSiteDataToZero } = useApp();
  const { user, profile, role, isSuperAdmin, updateUserProfile, isProfileComplete } = useAuth();

  const isStaff = isSuperAdmin || role === 'admin' || role === 'direction' || role === 'comptabilite';
  const [activeTab, setActiveTab] = useState<'profil' | 'entreprise'>(isStaff ? 'entreprise' : 'profil');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Personal Profile fields
  const [userNom, setUserNom] = useState(profile?.nom || profile?.name || user?.displayName || '');
  const [userTel, setUserTel] = useState(profile?.telephone || profile?.phone || '');
  const [userAdresse, setUserAdresse] = useState(profile?.adresse || '');
  const [userVille, setUserVille] = useState(profile?.ville || 'Port-au-Prince');
  const [userSociete, setUserSociete] = useState(profile?.societe || '');
  const [userNif, setUserNif] = useState(profile?.numeroFiscal || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setUserNom(profile.nom || profile.name || user?.displayName || '');
      setUserTel(profile.telephone || profile.phone || '');
      setUserAdresse(profile.adresse || '');
      setUserVille(profile.ville || 'Port-au-Prince');
      setUserSociete(profile.societe || '');
      setUserNif(profile.numeroFiscal || '');
    }
  }, [profile, user]);

  // Company Settings fields
  const [nom, setNom] = useState(settings.nom || 'LAPERLE TOUR HT');
  const [slogan, setSlogan] = useState(settings.slogan || 'Un coup d\'œil sur Haïti');
  const [telephone1, setTelephone1] = useState(settings.telephone1 || '+509 4440 8687');
  const [telephone2, setTelephone2] = useState(settings.telephone2 || '+509 3700 0000');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '+509 4440 8687');
  const [email, setEmail] = useState(settings.email || 'laperletourht@gmail.com');
  const [adresse, setAdresse] = useState(settings.adresse || 'Delmas 75, Port-au-Prince, Haïti');
  const [tauxChange, setTauxChange] = useState(settings.tauxChangeUSD_HTG || 132);
  const [tva, setTva] = useState(settings.tvaPourcentage || 10);
  const [numeroFiscal, setNumeroFiscal] = useState(settings.numeroFiscal || '001-234-567-8');
  const [savingCompany, setSavingCompany] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserProfile({
        nom: userNom.trim(),
        name: userNom.trim(),
        telephone: userTel.trim(),
        phone: userTel.trim(),
        adresse: userAdresse.trim(),
        ville: userVille.trim(),
        societe: userSociete.trim(),
        numeroFiscal: userNif.trim()
      });

      // Synchroniser avec l'annuaire client
      try {
        const existingClient = clients.find(
          c => c.id === user?.uid || (user?.email && c.email === user.email)
        );
        await saveClient({
          id: existingClient?.id || user?.uid || `CLI-${Date.now().toString().slice(-5)}`,
          name: userSociete.trim().toLowerCase() === 'particulier' ? userNom.trim() : `${userNom.trim()} (${userSociete.trim()})`,
          telephone: userTel.trim(),
          email: user?.email || profile?.email || '',
          address: `${userAdresse.trim()}, ${userVille.trim()}`,
          city: userVille.trim(),
          type: userSociete.trim().toLowerCase() === 'particulier' ? 'Particulier' : 'Entreprise'
        });
      } catch (err) {
        console.warn('Sync client fallback:', err);
      }

      showToast('Votre profil personnel a été mis à jour avec succès', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await saveSettings({
        nom,
        slogan,
        telephone1,
        telephone2,
        whatsapp,
        email,
        adresse,
        tauxChangeUSD_HTG: Number(tauxChange),
        tvaPourcentage: Number(tva),
        numeroFiscal
      });
      showToast('Paramètres de l\'entreprise mis à jour avec succès', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de la sauvegarde des paramètres', 'error');
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Paramètres & Profil Utilisateur</h2>
          <p>Gérez vos informations personnelles et les paramètres de facturation officielle de la centrale.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('profil')}
          style={{
            background: activeTab === 'profil' ? '#082b70' : '#f1f5f9',
            color: activeTab === 'profil' ? '#ffffff' : '#475569',
            border: 0,
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>👤</span>
          <span>Mon Profil Personnel</span>
          {!isProfileComplete && (
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
              À compléter
            </span>
          )}
        </button>

        {isStaff && (
          <button
            type="button"
            onClick={() => setActiveTab('entreprise')}
            style={{
              background: activeTab === 'entreprise' ? '#082b70' : '#f1f5f9',
              color: activeTab === 'entreprise' ? '#ffffff' : '#475569',
              border: 0,
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🏢</span>
            <span>Paramètres Entreprise & Facturation</span>
          </button>
        )}
      </div>

      {/* TAB 1: Mon Profil Personnel */}
      {activeTab === 'profil' && (
        <div className="data-panel" style={{ maxWidth: '850px' }}>
          <div style={{ marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#082b70' }}>Informations de Mon Compte</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Ces coordonnées sont utilisées pour vos réservations, factures proformas et reçus fiscaux.
            </p>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="form-grid">
              <div className="field">
                <label>Nom complet (Prénom & Nom) * :</label>
                <input
                  type="text"
                  value={userNom}
                  onChange={(e) => setUserNom(e.target.value)}
                  placeholder="Jean-Claude Moïse"
                  required
                />
              </div>

              <div className="field">
                <label>Téléphone (WhatsApp / Direct) * :</label>
                <input
                  type="tel"
                  value={userTel}
                  onChange={(e) => setUserTel(e.target.value)}
                  placeholder="+509 4440 8687"
                  required
                />
              </div>

              <div className="field">
                <label>Adresse de résidence / Siège * :</label>
                <input
                  type="text"
                  value={userAdresse}
                  onChange={(e) => setUserAdresse(e.target.value)}
                  placeholder="24, Rue Rebecca"
                  required
                />
              </div>

              <div className="field">
                <label>Commune / Ville :</label>
                <select
                  value={userVille}
                  onChange={(e) => setUserVille(e.target.value)}
                >
                  <option value="Port-au-Prince">Port-au-Prince</option>
                  <option value="Pétion-Ville">Pétion-Ville</option>
                  <option value="Delmas">Delmas</option>
                  <option value="Tabarre">Tabarre</option>
                  <option value="Carrefour">Carrefour</option>
                  <option value="Cap-Haïtien">Cap-Haïtien</option>
                  <option value="Jacmel">Jacmel</option>
                  <option value="Saint-Marc">Saint-Marc</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="field">
                <label>Société / Raison Sociale * :</label>
                <input
                  type="text"
                  value={userSociete}
                  onChange={(e) => setUserSociete(e.target.value)}
                  placeholder="Entreprise SAS ou Particulier"
                  required
                />
              </div>

              <div className="field">
                <label>Numéro Fiscal (NIF / CIF) * :</label>
                <input
                  type="text"
                  value={userNif}
                  onChange={(e) => setUserNif(e.target.value)}
                  placeholder="001-234-567-8"
                  required
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="submit" className="primary" disabled={savingProfile}>
                {savingProfile ? 'Enregistrement...' : '💾 Mettre à jour mon profil'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Paramètres Entreprise (Staff Only) */}
      {activeTab === 'entreprise' && isStaff && (
        <div className="data-panel" style={{ maxWidth: '900px' }}>
          <form onSubmit={handleSaveCompany}>
            <div className="form-grid">
              <div className="field">
                <label>Raison Sociale / Nom Entreprise :</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Slogan Officiel :</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Téléphone Ligne 1 :</label>
                <input
                  type="text"
                  value={telephone1}
                  onChange={(e) => setTelephone1(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Téléphone Ligne 2 :</label>
                <input
                  type="text"
                  value={telephone2}
                  onChange={(e) => setTelephone2(e.target.value)}
                />
              </div>

              <div className="field">
                <label>WhatsApp Centrale Réservation :</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              <div className="field">
                <label>E-mail Officiel :</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field full">
                <label>Adresse du Siège Social :</label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Numéro d'Immatriculation Fiscale (NIF / DGI) :</label>
                <input
                  type="text"
                  value={numeroFiscal}
                  onChange={(e) => setNumeroFiscal(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Taux de Change Réglementaire (1 USD = ? HTG) :</label>
                <input
                  type="number"
                  step="0.1"
                  value={tauxChange}
                  onChange={(e) => setTauxChange(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label>Taux de Taxe / TVA (%) :</label>
                <input
                  type="number"
                  step="0.5"
                  value={tva}
                  onChange={(e) => setTva(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button type="submit" className="primary" disabled={savingCompany}>
                {savingCompany ? 'Enregistrement...' : 'Enregistrer les Paramètres Entreprise'}
              </button>
            </div>
          </form>

          {/* DANGER ZONE : Remise à zéro complète du site */}
          {(isSuperAdmin || role === 'admin') && (
            <div style={{
              marginTop: '40px',
              borderTop: '2px dashed #fecaca',
              paddingTop: '24px'
            }}>
              <div style={{
                background: '#fff5f5',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <h4 style={{ margin: 0, color: '#991b1b', fontSize: '15px', fontWeight: 800 }}>
                    Zone de Maintenance : Démarrage à neuf & Première Utilisation
                  </h4>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#7f1d1d', lineHeight: '1.5' }}>
                  Effacer l'ensemble des données opérationnelles (réservations, proformas, factures, plannings, paiements, véhicules, chauffeurs, élèves) pour démarrer l'application avec des listes totalement vides.
                </p>

                {!confirmResetOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 0,
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    <span>🗑️</span>
                    <span>Remettre toutes les données à zéro (Première utilisation)</span>
                  </button>
                ) : (
                  <div style={{ background: '#ffffff', border: '1px solid #f87171', borderRadius: '8px', padding: '16px' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#b91c1c' }}>
                      Confirmez-vous la purge totale de toutes les données du site à zéro ?
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          setResetting(true);
                          try {
                            await resetAllSiteDataToZero();
                            setConfirmResetOpen(false);
                          } finally {
                            setResetting(false);
                          }
                        }}
                        disabled={resetting}
                        style={{
                          background: '#b91c1c',
                          color: '#ffffff',
                          border: 0,
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >
                        {resetting ? 'Purge en cours...' : 'Oui, effacer toutes les données'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        disabled={resetting}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
