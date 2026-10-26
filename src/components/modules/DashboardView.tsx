import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { DashboardUniversalSearchBar } from '../common/DashboardUniversalSearchBar';

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
    sendChatMessage,
    requestReservationDoc
  } = useApp();

  const [dispatchText, setDispatchText] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';

  // Display user name
  const displayName = profile?.nom || user?.displayName || 'Castima Moïse';

  // =========================================================================
  // 1. CLIENT PORTAL DASHBOARD (STRICTLY ISOLATED FROM COMPANY FINANCES)
  // =========================================================================
  if (isClient) {
    const activeClientReservations = reservations.filter(
      (r) => r.status === 'En attente' || r.status === 'En cours' || r.status === 'Confirmée'
    );
    const pendingClientProformas = proformas.filter(
      (p) => p.statut === 'En attente' || p.statut === 'Brouillon'
    );
    const unpaidClientFactures = factures.filter((f) => f.statut !== 'Payée');
    const unpaidAmount = unpaidClientFactures.reduce(
      (sum, f) => sum + (f.totalTTC || f.montantTotal || 0),
      0
    );
    const completedClientReservations = reservations.filter(
      (r) => r.status === 'Terminée'
    );

    return (
      <div className="dashboard-container-exact">
        {/* Client Hero Banner */}
        <div className="dashboard-hero-card">
          <div className="hero-kicker-row">
            <span className="kicker-sparkle">✨</span>
            <span className="kicker-text">ESPACE PERSONNEL CLIENT · LAPERLE TOUR HT</span>
          </div>

          <div className="hero-content-row">
            <div className="hero-text-block">
              <h1 className="hero-title">
                Bonjour, {displayName}
              </h1>
              <p className="hero-subtitle">
                Bienvenue sur votre portail client sécurisé. Suivez vos réservations de transport, consultez vos devis personnalisés et accédez à vos factures en toute confidentialité.
              </p>
            </div>

            <div className="hero-actions-block">
              <button 
                type="button" 
                className="btn-hero-primary"
                onClick={() => onOpenModal('reservation')}
                aria-label="Réserver une nouvelle course"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Réserver une Course</span>
              </button>

              <button 
                type="button" 
                className="btn-hero-secondary"
                onClick={() => onOpenModal('demande-devis')}
                aria-label="Demander un devis sur mesure"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>Demander un Devis</span>
              </button>

              <button 
                type="button" 
                className="btn-hero-secondary"
                style={{ borderColor: '#fed7aa', color: '#c2410c', background: '#fffaf5' }}
                onClick={() => onOpenModal('demande-envoi', { type: 'facture' })}
                aria-label="Demander une facture officielle au support"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <line x1="6" y1="8" x2="18" y2="8"/>
                  <line x1="6" y1="12" x2="14" y2="12"/>
                  <line x1="6" y1="16" x2="10" y2="16"/>
                </svg>
                <span>Demander une Facture</span>
              </button>
            </div>
          </div>

          {/* Universal Search Bar */}
          <DashboardUniversalSearchBar />
        </div>

        {/* Quick Document Request Banner from Support */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#082b70', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.5 }}>
              <span>📄</span>
              <span>Besoin d'un devis chiffré ou d'une facture officielle ?</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
              Sollicitez immédiatement notre équipe support pour l'édition ou la transmission directe de vos documents par email et WhatsApp.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-card-action primary-subtle"
              onClick={() => onOpenModal('demande-devis')}
              style={{ padding: '9px 16px', fontSize: '13px', borderRadius: '10px' }}
            >
              📋 Demander un devis
            </button>
            <button
              type="button"
              className="btn-card-action amber-subtle"
              onClick={() => onOpenModal('demande-envoi', { type: 'facture' })}
              style={{ padding: '9px 16px', fontSize: '13px', borderRadius: '10px' }}
            >
              🧾 Demander une facture
            </button>
          </div>
        </div>

        {/* 4 Client-Specific KPI Cards */}
        <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {/* KPI 1: Mes Réservations Actives */}
          <div 
            className="kpi-card-exact" 
            onClick={() => setCurrentModule('reservations')}
            title="Consulter mes réservations"
            role="button"
            tabIndex={0}
          >
            <div className="kpi-icon-box blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
            </div>
            <div className="kpi-header-label">MES RÉSERVATIONS ACTIVES</div>
            <div className="kpi-main-number">{activeClientReservations.length}</div>
            <div className="kpi-sub-text green">↗ {reservations.length} course(s) enregistrée(s)</div>
          </div>

          {/* KPI 2: Mes Devis en Attente */}
          <div 
            className="kpi-card-exact" 
            onClick={() => setCurrentModule('proformas')}
            title="Consulter mes devis"
            role="button"
            tabIndex={0}
          >
            <div className="kpi-icon-box cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="kpi-header-label">DEVIS EN ATTENTE</div>
            <div className="kpi-main-number">{pendingClientProformas.length}</div>
            <div className="kpi-sub-text">Devis & proformas à valider</div>
          </div>

          {/* KPI 3: Mes Factures à Régler */}
          <div 
            className="kpi-card-exact" 
            onClick={() => setCurrentModule('factures')}
            title="Consulter mes factures"
            role="button"
            tabIndex={0}
          >
            <div className="kpi-icon-box amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className="kpi-header-label">FACTURES À RÉGLER</div>
            <div className={`kpi-main-number ${unpaidClientFactures.length > 0 ? 'red' : 'green'}`}>
              {unpaidClientFactures.length}
            </div>
            <div className="kpi-sub-text">
              {unpaidAmount > 0 ? (
                <span>${unpaidAmount.toLocaleString()} USD (~{Math.round(unpaidAmount * 132).toLocaleString()} HTG)</span>
              ) : 'Tout est à jour ✓'}
            </div>
          </div>

          {/* KPI 4: Courses Effectuées */}
          <div 
            className="kpi-card-exact" 
            onClick={() => setCurrentModule('reservations')}
            title="Consulter l'historique"
            role="button"
            tabIndex={0}
          >
            <div className="kpi-icon-box emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="kpi-header-label">COURSES EFFECTUÉES</div>
            <div className="kpi-main-number green">{completedClientReservations.length}</div>
            <div className="kpi-sub-text">Historique de vos trajets VIP</div>
          </div>
        </div>

        {/* 2-Column Split: Upcoming Bookings & Dedicated Customer Support */}
        <div className="dashboard-bottom-split">
          {/* Left Column: Mes Prochaines Courses */}
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
                <h3>Mes Prochaines Courses & Réservations</h3>
              </div>
              <button 
                type="button" 
                className="card-header-link"
                onClick={() => setCurrentModule('reservations')}
              >
                Voir tout mon historique →
              </button>
            </div>

            <div className="agenda-missions-list">
              {reservations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚗</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Aucune réservation en cours
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '320px', margin: '0 auto 16px auto' }}>
                    Planifiez dès maintenant votre transfert aéroport, votre mise à disposition VIP ou votre circuit touristique.
                  </p>
                  <button
                    type="button"
                    className="btn-hero-primary"
                    onClick={() => onOpenModal('reservation')}
                    style={{ margin: '0 auto', display: 'inline-flex' }}
                  >
                    <span>Réserver une Course</span>
                  </button>
                </div>
              ) : (
                reservations.slice(0, 3).map((r) => (
                  <div key={r.id} className="mission-item-box" style={{ marginBottom: '18px' }}>
                    <div className="mission-item-top">
                      <div className="mission-type-cluster">
                        <span className="mission-type-title">{r.service || 'Transfert VIP & Course'}</span>
                        <span className={`badge-${r.status === 'Confirmée' ? 'confirmed' : 'pending'}`}>
                          {r.status || 'En attente'}
                        </span>
                      </div>
                      <div className="mission-price-cluster">
                        <DualPrice amount={r.amount ?? r.montant ?? 0} currency={r.currency || 'USD'} size="sm" />
                        <span className="mission-date-val">{r.date || r.dateDepart || 'Date à convenir'} à {r.time || r.heureDepart || '08:00'}</span>
                      </div>
                    </div>

                    <div className="mission-route-row">
                      <span className="route-pin">📍</span>
                      <span className="route-text" style={{ lineHeight: 1.6 }}>
                        <strong>{r.origin || r.lieuPriseEnCharge || 'Port-au-Prince'}</strong>
                        <span style={{ color: '#f7941d', margin: '0 8px', fontWeight: 800 }}>➔</span>
                        <strong>{r.destination || 'Destination'}</strong>
                      </span>
                    </div>

                    <div className="mission-parties-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DocRefBadge reference={r.id} type="reservation" />
                      <span className="parties-separator">·</span>
                      <span>
                        Chauffeur : <strong>{r.driver || r.chauffeur || 'Assignation en cours'}</strong>
                      </span>
                      {r.vehicle && (
                        <>
                          <span className="parties-separator">·</span>
                          <span>Véhicule : <strong>{r.vehicle}</strong></span>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-card-action primary-subtle"
                        onClick={() => requestReservationDoc(r, 'facture')}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        title="Demander à l'équipe Laperle de préparer et d'envoyer votre facture"
                      >
                        🧾 Demander une Facture
                      </button>

                      <button
                        type="button"
                        className="btn-card-action primary-subtle"
                        onClick={() => requestReservationDoc(r, 'devis')}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        title="Demander à l'équipe commerciale un devis pour ce trajet"
                      >
                        📋 Demander un Devis
                      </button>

                      <a
                        href={`https://wa.me/50944408687?text=${encodeURIComponent(`Bonjour Laperle Tour, je vous contacte concernant ma réservation ${r.id} (${r.service || 'Course'}).`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-card-action success-subtle"
                        style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Assistance & Support Client */}
          <div className="dashboard-card-panel dispatch-card">
            <div className="card-panel-header">
              <div className="card-header-title">
                <span className="card-header-icon orange" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </span>
                <h3>Assistance & Service Client 24/7</h3>
              </div>
            </div>

            <p className="dispatch-desc">
              Notre équipe de régulation et conciergerie est à votre disposition immédiate pour ajuster vos horaires ou répondre à vos questions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '20px' }}>📞</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>LIGNE DIRECTE DISPATCH</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>+509 4440 8687 · +509 3700 0000</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '20px' }}>✈️</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ACCUEIL AÉROPORT TOUSSAINT LOUVERTURE</div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>Votre chauffeur vous attend dès la sortie des bagages avec une pancarte personnalisée.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={() => setChatModalOpen(true)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Chat avec le Dispatch</span>
                </button>

                <a
                  href="https://wa.me/50944408687"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hero-secondary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. CHAUFFEUR DASHBOARD (CONDUCTEUR / MISSIONS ASSIGNÉES)
  // =========================================================================
  if (isChauffeur) {
    const driverPlannings = plannings;
    return (
      <div className="dashboard-container-exact">
        <div className="dashboard-hero-card">
          <div className="hero-kicker-row">
            <span className="kicker-sparkle">✨</span>
            <span className="kicker-text">ESPACE CHAUFFEUR · LAPERLE TOUR HT</span>
          </div>
          <div className="hero-content-row">
            <div className="hero-text-block">
              <h1 className="hero-title">
                Bonjour, {displayName} (Chauffeur VIP)
              </h1>
              <p className="hero-subtitle">
                Consultez vos missions assignées, vérifiez la conformité de votre véhicule et restez joignable par la régulation.
              </p>
            </div>
            <div className="hero-actions-block">
              <button 
                type="button" 
                className="btn-hero-primary"
                onClick={() => setChatModalOpen(true)}
              >
                <span>💬 Radio Dispatch</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="kpi-card-exact" onClick={() => setCurrentModule('plannings')}>
            <div className="kpi-icon-box blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="kpi-header-label">MISSIONS ASSIGNÉES</div>
            <div className="kpi-main-number">{driverPlannings.length}</div>
            <div className="kpi-sub-text green">Trajets programmés</div>
          </div>

          <div className="kpi-card-exact" onClick={() => setCurrentModule('vehicules')}>
            <div className="kpi-icon-box green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="11" width="20" height="8" rx="2"/>
                <path d="M5 11l2-5h10l2 5"/>
                <circle cx="7" cy="16" r="2"/>
                <circle cx="17" cy="16" r="2"/>
              </svg>
            </div>
            <div className="kpi-header-label">VÉHICULE ATTITRÉ</div>
            <div className="kpi-main-number" style={{ fontSize: '18px' }}>Toyota Prado</div>
            <div className="kpi-sub-text">Contrôle journalier validé</div>
          </div>

          <div className="kpi-card-exact" onClick={() => setChatModalOpen(true)}>
            <div className="kpi-icon-box orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="kpi-header-label">LIAISON DISPATCH</div>
            <div className="kpi-main-number green">Connecté</div>
            <div className="kpi-sub-text">Radio de bord active</div>
          </div>
        </div>

        <div className="dashboard-bottom-split">
          <div className="dashboard-card-panel agenda-card" style={{ flex: 1 }}>
            <div className="card-panel-header">
              <div className="card-header-title">
                <h3>Feuille de Route du Jour</h3>
              </div>
              <button type="button" className="card-header-link" onClick={() => setCurrentModule('plannings')}>
                Voir le planning complet →
              </button>
            </div>
            <div className="agenda-missions-list">
              {driverPlannings.length === 0 ? (
                <p style={{ color: '#64748b', padding: '16px' }}>Aucune mission programmée pour aujourd'hui.</p>
              ) : (
                driverPlannings.map((p) => (
                  <div key={p.id} className="mission-item-box" style={{ marginBottom: '10px' }}>
                    <div className="mission-item-top">
                      <span className="mission-type-title">{p.service}</span>
                      <span className="badge-confirmed">{p.statut}</span>
                    </div>
                    <div className="mission-route-row">
                      <span className="route-pin">📍</span>
                      <span className="route-text">{p.depart} ➔ {p.destination}</span>
                    </div>
                    <div className="mission-parties-row">
                      <span>Client : <strong>{p.client}</strong></span>
                      <span className="parties-separator">·</span>
                      <span>Heure : <strong>{p.heure}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. STAFF / DIRECTION / ADMIN / COMPTABILITÉ DASHBOARD (FULL ENTERPRISE VIEW)
  // =========================================================================
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

  const roleDisplayTitle = role === 'admin' ? 'Super Admin' : role === 'direction' ? 'Directeur' : 'Comptabilité';

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
              aria-label="Planifier une nouvelle course"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Nouvelle Course</span>
            </button>

            <button 
              type="button" 
              className="btn-hero-secondary"
              onClick={() => onOpenModal('proforma')}
              aria-label="Émettre un devis proforma"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Émettre un Devis</span>
            </button>
          </div>
        </div>

        {/* Universal Search Bar */}
        <DashboardUniversalSearchBar />
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
