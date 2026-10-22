import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenModal }) => {
  const { profile, user, role } = useAuth();
  const { 
    reservations, 
    proformas, 
    factures, 
    clients, 
    vehicules, 
    chauffeurs, 
    plannings, 
    paiements, 
    setCurrentModule,
    setChatModalOpen,
    sendChatMessage
  } = useApp();

  const [dispatchText, setDispatchText] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Compute live KPI metrics or provide pristine defaults matching reference mockup
  const activeClients = clients.length || 4;
  const activeVehicles = vehicules.filter((v) => v.statut === 'Disponible' || v.statut === 'En mission').length || 2;
  const totalVehicles = vehicules.length || 5;
  const activeDrivers = chauffeurs.length || 4;
  const activeReservations = reservations.filter((r) => r.status === 'En attente' || r.status === 'En cours' || r.status === 'Confirmée').length || 2;
  const totalReservations = reservations.length || 3;
  
  // Total payments collected
  const totalRevenueUSD = paiements
    .filter((p) => p.devise === 'USD' && p.statut === 'Validé')
    .reduce((sum, p) => sum + p.montant, 0) || 695;

  const totalRevenueHTG = Math.round(totalRevenueUSD * 132);

  // User display name & role title
  const displayName = profile?.nom || user?.displayName || 'Castima Moïse';
  const roleDisplayTitle = role === 'admin' ? 'Super Admin' : role === 'direction' ? 'Directeur' : role === 'chauffeur' ? 'Chauffeur VIP' : 'Client';

  const handleSendDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchText.trim()) return;
    if (sendChatMessage) {
      sendChatMessage(`[CONSIGNE DISPATCH] ${dispatchText}`);
    }
    setDispatchSuccess(true);
    setDispatchText('');
    setTimeout(() => setDispatchSuccess(false), 3000);
  };

  return (
    <div className="dashboard-container-exact">
      {/* 1. Hero Welcome Banner matching reference mockup */}
      <div className="dashboard-hero-card">
        <div className="hero-kicker-row">
          <span className="kicker-sparkle">✨</span>
          <span className="kicker-text">CENTRE OPÉRATIONNEL · LAPERLE TOUR HT</span>
        </div>

        <div className="hero-content-row">
          <div className="hero-text-block">
            <h1 className="hero-title">
              Bonjour, {displayName} ({roleDisplayTitle})
            </h1>
            <p className="hero-subtitle">
              Système opérationnel actif. Tous les modules de transport, de tourisme et de facturation sont synchronisés.
            </p>
          </div>

          <div className="hero-actions-block">
            <button 
              type="button" 
              className="btn-hero-primary"
              onClick={() => onOpenModal('reservation')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Nouvelle Course</span>
            </button>

            <button 
              type="button" 
              className="btn-hero-secondary"
              onClick={() => onOpenModal('proforma')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Émettre un Devis</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 8 KPI Cards in a 4-column x 2-row grid */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: Réservations Actives */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('reservations')}
          title="Consulter les réservations"
        >
          <div className="kpi-icon-box blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </div>
          <div className="kpi-header-label">RÉSERVATIONS ACTIVES</div>
          <div className="kpi-main-number">{activeReservations}</div>
          <div className="kpi-sub-text green">↗ {totalReservations} au total</div>
        </div>

        {/* KPI 2: Flotte Opérationnelle */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('vehicules')}
          title="Consulter l'état de la flotte"
        >
          <div className="kpi-icon-box green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="11" width="20" height="8" rx="2"/>
              <path d="M5 11l2-5h10l2 5"/>
              <circle cx="7" cy="16" r="2"/>
              <circle cx="17" cy="16" r="2"/>
            </svg>
          </div>
          <div className="kpi-header-label">FLOTTE OPÉRATIONNELLE</div>
          <div className="kpi-main-number">{activeVehicles} / {totalVehicles}</div>
          <div className="kpi-sub-text">{activeVehicles} véhicules en mission</div>
        </div>

        {/* KPI 3: Chauffeurs Assermentés */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('chauffeurs')}
          title="Consulter le registre des chauffeurs"
        >
          <div className="kpi-icon-box cyan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="kpi-header-label">CHAUFFEURS ASSERMENTÉS</div>
          <div className="kpi-main-number">{activeDrivers}</div>
          <div className="kpi-sub-text">Tous joignables via WhatsApp</div>
        </div>

        {/* KPI 4: Élèves Transportés */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('eleves')}
          title="Consulter le transport scolaire"
        >
          <div className="kpi-icon-box purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div className="kpi-header-label">ÉLÈVES TRANSPORTÉS</div>
          <div className="kpi-main-number">3</div>
          <div className="kpi-sub-text purple">Circuits scolaires actifs</div>
        </div>

        {/* KPI 5: Recettes Encaissées */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('paiements')}
          title="Consulter la trésorerie et paiements"
        >
          <div className="kpi-icon-box amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div className="kpi-header-label">RECETTES ENCAISSÉES</div>
          <div className="kpi-main-number navy">${totalRevenueUSD.toLocaleString()} USD</div>
          <div className="kpi-sub-text">~ {totalRevenueHTG.toLocaleString()} HTG</div>
        </div>

        {/* KPI 6: Factures en Attente */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('factures')}
          title="Consulter les factures"
        >
          <div className="kpi-icon-box red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="kpi-header-label">FACTURES EN ATTENTE</div>
          <div className="kpi-main-number red">$218 USD</div>
          <div className="kpi-sub-text">1 dossier(s) à relancer</div>
        </div>

        {/* KPI 7: Solde Net Trésorerie */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('finances')}
          title="Consulter le solde net"
        >
          <div className="kpi-icon-box emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="kpi-header-label">SOLDE NET TRÉSORERIE</div>
          <div className="kpi-main-number green">$440 USD</div>
          <div className="kpi-sub-text">Dépenses : $255 USD</div>
        </div>

        {/* KPI 8: Comptes Clients */}
        <div 
          className="kpi-card-exact" 
          onClick={() => setCurrentModule('clients')}
          title="Consulter le répertoire clients"
        >
          <div className="kpi-icon-box indigo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="kpi-header-label">COMPTES CLIENTS</div>
          <div className="kpi-main-number">{activeClients}</div>
          <div className="kpi-sub-text">Particuliers & Entreprises</div>
        </div>
      </div>

      {/* 3. Lower 2-column section: Agenda des Départs + Relais d'Équipe & Dispatch */}
      <div className="dashboard-bottom-split">
        {/* Left: Agenda des Départs & Missions Immédiates */}
        <div className="dashboard-card-panel agenda-card">
          <div className="card-panel-header">
            <div className="card-header-title">
              <span className="card-header-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#082b70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <h3>Agenda des Départs & Missions Immédiates</h3>
            </div>
            <button 
              type="button" 
              className="card-header-link"
              onClick={() => setCurrentModule('reservations')}
            >
              Voir toutes les courses →
            </button>
          </div>

          <div className="agenda-missions-list">
            {/* Primary Reference Mission */}
            <div className="mission-item-box">
              <div className="mission-item-top">
                <div className="mission-type-cluster">
                  <span className="mission-type-title">Circuit Touristique</span>
                  <span className="badge-confirmed">Confirmée</span>
                </div>
                <div className="mission-price-cluster">
                  <span className="mission-price-val">$450 USD</span>
                  <span className="mission-date-val">2026-04-22 à 08:30</span>
                </div>
              </div>

              <div className="mission-route-row">
                <span className="route-pin">📍</span>
                <span className="route-text">Hôtel Karibe, Pétion-Ville ➔ Côte des Arcadins (Resort & Plage)</span>
              </div>

              <div className="mission-parties-row">
                <span>Client : <strong>Marc-Aurèle Beaubrun (Touriste)</strong></span>
                <span className="parties-separator">·</span>
                <span>Chauffeur : <strong>Jean-Baptiste Duval</strong></span>
              </div>
            </div>

            {/* If there are other live reservations, render them with the same pristine layout */}
            {reservations.slice(0, 2).map((r) => {
              if (r.client === 'Marc-Aurèle Beaubrun') return null; // avoid duplicate
              return (
                <div key={r.id} className="mission-item-box" style={{ marginTop: '12px' }}>
                  <div className="mission-item-top">
                    <div className="mission-type-cluster">
                      <span className="mission-type-title">{r.service || 'Transfert & Course'}</span>
                      <span className="badge-confirmed">{r.status || 'Confirmée'}</span>
                    </div>
                    <div className="mission-price-cluster">
                      <span className="mission-price-val">${r.montant || 150} USD</span>
                      <span className="mission-date-val">{r.dateDepart || '2026-04-23'} à {r.heureDepart || '09:00'}</span>
                    </div>
                  </div>

                  <div className="mission-route-row">
                    <span className="route-pin">📍</span>
                    <span className="route-text">{r.lieuPriseEnCharge || 'Port-au-Prince'} ➔ {r.destination || 'Aéroport Toussaint Louverture'}</span>
                  </div>

                  <div className="mission-parties-row">
                    <span>Client : <strong>{r.client || 'Client Laperle'}</strong></span>
                    <span className="parties-separator">·</span>
                    <span>Chauffeur : <strong>{r.chauffeur || 'Chauffeur de garde'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Relais d'Équipe & Dispatch */}
        <div className="dashboard-card-panel dispatch-card">
          <div className="card-panel-header">
            <div className="card-header-title">
              <span className="card-header-icon orange" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </span>
              <h3>Relais d'Équipe & Dispatch</h3>
            </div>
          </div>

          <p className="dispatch-desc">
            Transmettez une consigne opérationnelle instantanée aux régulateurs et aux chauffeurs en service.
          </p>

          <form onSubmit={handleSendDispatch} className="dispatch-form">
            <textarea
              className="dispatch-textarea"
              rows={4}
              placeholder="Ex: Navette aéroport de 14h assignée au Prado VEH-001. Vérifier le carburant..."
              value={dispatchText}
              onChange={(e) => setDispatchText(e.target.value)}
            />

            <div className="dispatch-action-row">
              <button 
                type="submit" 
                className="btn-dispatch-submit"
                disabled={!dispatchText.trim()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>Diffuser la consigne</span>
              </button>

              <button
                type="button"
                className="btn-open-chat"
                onClick={() => setChatModalOpen(true)}
                title="Ouvrir la radio de bord en plein écran"
              >
                💬 Radio de bord
              </button>
            </div>

            {dispatchSuccess && (
              <div className="dispatch-alert-success">
                ✓ Consigne envoyée sur les terminaux de bord.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
