import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';

interface ClientDashboardProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onOpenModal }) => {
  const { profile, user, role } = useAuth();
  const { 
    reservations, 
    proformas, 
    factures, 
    paiements, 
    abonnements,
    setCurrentModule,
    requestReservationDoc,
    completeReservationByDriver
  } = useApp();

  const [activeTab, setActiveTab] = useState<'toutes' | 'en_cours' | 'terminees'>('toutes');

  // Identity info
  const clientName = profile?.nom || profile?.name || user?.displayName || 'Client LAPERLE';
  const clientEmail = profile?.email || user?.email || 'client@laperletourht.com';
  const clientPhone = profile?.telephone || profile?.phone || '+509 4440 8687';
  const clientCity = profile?.ville || profile?.adresse || 'Port-au-Prince, Haïti';
  const clientDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '24 Novembre 2024';

  // Role label display
  const roleDisplay = role === 'chauffeur' ? 'Chauffeur Partenaire' : role === 'prospect' ? 'Nouveau Membre' : 'Client Privilège';

  // Unpaid invoices calculation
  const unpaidInvoices = useMemo(() => {
    return factures.filter(f => f.statut !== 'Payée');
  }, [factures]);

  const unpaidTotal = useMemo(() => {
    return unpaidInvoices.reduce((sum, f) => sum + (f.totalTTC || f.montantTotal || 0), 0);
  }, [unpaidInvoices]);

  // Filter reservations based on active tab
  const filteredReservations = useMemo(() => {
    if (activeTab === 'en_cours') {
      return reservations.filter(r => r.status === 'En cours' || r.status === 'Confirmée' || r.status === 'En attente');
    }
    if (activeTab === 'terminees') {
      return reservations.filter(r => r.status === 'Terminée' || r.status === 'Annulée');
    }
    return reservations;
  }, [reservations, activeTab]);

  return (
    <div className="client-dash-wrapper">
      {/* Top Bar / Greeting Header */}
      <div className="client-dash-topbar">
        <div className="client-topbar-left">
          <span className="client-role-pill">{roleDisplay}</span>
          <h1 className="client-topbar-title">Espace Personnel & Réservations</h1>
          <p className="client-topbar-sub">
            Gérez vos circuits touristiques, courses privées et justificatifs de paiement en toute sécurité.
          </p>
        </div>

        <div className="client-topbar-actions">
          <button 
            type="button" 
            className="client-btn-primary"
            onClick={() => onOpenModal('reservation')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Réserver une Course</span>
          </button>
          <button 
            type="button" 
            className="client-btn-secondary"
            onClick={() => onOpenModal('demande-devis')}
          >
            <span>Demander un Devis</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns Matching Reference 2 */}
      <div className="client-dash-grid">
        {/* TOP ROW: Left = Profile Card, Right = Payment Info Card */}
        
        {/* 1. Profile Card (Ref 2 top center card) */}
        <div className="client-profile-card">
          <div className="client-avatar-col">
            <div className="client-avatar-wrap">
              {profile?.photoURL || user?.photoURL ? (
                <img 
                  src={profile?.photoURL || user?.photoURL || ''} 
                  alt={clientName} 
                  className="client-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="client-avatar-placeholder">
                  {clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="client-status-indicator">Compte Actif</span>
          </div>

          <div className="client-info-col">
            <div className="client-name-row">
              <h2 className="client-name">{clientName}</h2>
              <button 
                type="button" 
                className="client-edit-profile-btn"
                onClick={() => onOpenModal('client-profile')}
                title="Modifier mes informations"
                aria-label="Modifier mes informations"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>Modifier</span>
              </button>
            </div>

            <div className="client-meta-grid">
              <div className="client-meta-item">
                <span className="meta-label">Membre depuis :</span>
                <span className="meta-value">{clientDate}</span>
              </div>
              <div className="client-meta-item">
                <span className="meta-label">Localisation :</span>
                <span className="meta-value">{clientCity}</span>
              </div>
              <div className="client-meta-item">
                <span className="meta-label">Adresse e-mail :</span>
                <span className="meta-value text-truncate">{clientEmail}</span>
              </div>
              <div className="client-meta-item">
                <span className="meta-label">Téléphone :</span>
                <span className="meta-value">{clientPhone}</span>
              </div>
            </div>

            {/* Quick Contact & WhatsApp Support */}
            <div className="client-contact-badges">
              <a 
                href="https://wa.me/50944408687" 
                target="_blank" 
                rel="noopener noreferrer"
                className="client-contact-btn whatsapp"
              >
                💬 WhatsApp Laperle (+509 4440 8687)
              </a>
              <button 
                type="button"
                className="client-contact-btn email"
                onClick={() => {
                  window.location.href = `mailto:laperletourht@gmail.com?subject=Demande de renseignement - ${clientName}`;
                }}
              >
                ✉️ Contacter le Desk
              </button>
            </div>
          </div>
        </div>

        {/* 2. Payment & Billing Card (Ref 2 top right card) */}
        <div className="client-payment-card">
          <div className="payment-card-head">
            <h3 className="payment-card-title">Moyens de Paiement & Factures</h3>
            <span className="payment-secure-badge">🔒 100% Sécurisé</span>
          </div>

          <div className="payment-balance-box">
            <span className="balance-label">Solde en attente de règlement</span>
            <div className="balance-amount tabular-nums">
              <DualPrice usdAmount={unpaidTotal} showBoth={true} />
            </div>
            <span className="balance-sub">
              {unpaidInvoices.length > 0 
                ? `${unpaidInvoices.length} facture(s) en attente de validation` 
                : 'Toutes vos factures sont à jour'}
            </span>
          </div>

          {/* Supported payment badges in Haiti matching reference logos */}
          <div className="payment-methods-strip">
            <span className="methods-title">Modes de règlement acceptés :</span>
            <div className="methods-badges-row">
              <div className="pm-chip moncash" title="Paiement mobile MonCash Digicel">
                <strong>MonCash</strong>
              </div>
              <div className="pm-chip natcash" title="Paiement mobile Natcash">
                <strong>Natcash</strong>
              </div>
              <div className="pm-chip virement" title="Virement bancaire Sogebank / Unibank">
                <strong>Virement</strong>
              </div>
              <div className="pm-chip visa" title="Carte bancaire Visa / Mastercard">
                <strong>VISA / MC</strong>
              </div>
            </div>
          </div>

          <div className="payment-card-actions">
            <button 
              type="button" 
              className="client-btn-pay"
              onClick={() => onOpenModal('payment-proof')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <span>Déposer un Justificatif de Paiement</span>
            </button>
            <button 
              type="button" 
              className="client-btn-history"
              onClick={() => setCurrentModule('factures')}
            >
              Historique des Factures
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: Left = Timeline of courses/reservations, Right = VIP Subscription banner */}

        {/* 3. Timeline of Courses / Reservations (Ref 2 bottom wide timeline) */}
        <div className="client-timeline-card">
          <div className="timeline-card-head">
            <div>
              <h3 className="timeline-title">Mes Réservations & Trajets</h3>
              <p className="timeline-sub">Historique et suivi chronologique de vos déplacements</p>
            </div>

            <div className="timeline-filter-tabs">
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'toutes' ? 'active' : ''}`}
                onClick={() => setActiveTab('toutes')}
              >
                Toutes ({reservations.length})
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'en_cours' ? 'active' : ''}`}
                onClick={() => setActiveTab('en_cours')}
              >
                En cours
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'terminees' ? 'active' : ''}`}
                onClick={() => setActiveTab('terminees')}
              >
                Terminées
              </button>
            </div>
          </div>

          {/* Timeline Rail & Nodes Container */}
          <div className="client-timeline-body">
            {filteredReservations.length > 0 ? (
              <div className="timeline-tree">
                {filteredReservations.slice(0, 6).map((res, index) => {
                  const isCompleted = res.status === 'Terminée';
                  const isConfirmed = res.status === 'Confirmée';
                  const isPending = res.status === 'En attente' || res.status === 'Brouillon';

                  return (
                    <div key={res.id || `res-${index}`} className="timeline-item">
                      {/* Left Rail Node */}
                      <div className="timeline-rail">
                        <div className={`timeline-node ${isCompleted ? 'completed' : isConfirmed ? 'active' : 'pending'}`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        {index < filteredReservations.length - 1 && <div className="timeline-connector" />}
                      </div>

                      {/* Right Item Content Card with soft background */}
                      <div className={`timeline-content-box ${index % 2 === 0 ? 'tint-soft-blue' : 'tint-soft-orange'}`}>
                        <div className="timeline-item-header">
                          <div>
                            <h4 className="item-title">
                              {res.circuit || res.service || res.serviceType || 'Transport Personnalisé'}
                            </h4>
                            <div className="item-ref-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <DocRefBadge 
                                type="reservation" 
                                reference={res.number || res.id} 
                                inline={true} 
                              />
                              {res.devisRef && (
                                <DocRefBadge 
                                  type="proforma" 
                                  reference={res.devisRef} 
                                  label={`Devis ${res.devisRef}`}
                                  inline={true} 
                                />
                              )}
                              {res.factureRef && (
                                <DocRefBadge 
                                  type="facture" 
                                  reference={res.factureRef} 
                                  label={`Facture ${res.factureRef}`}
                                  inline={true} 
                                />
                              )}
                              {res.demandeDevis && !res.devisRef && (
                                <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ⏳ Devis en préparation
                                </span>
                              )}
                              {res.demandeFacture && !res.factureRef && (
                                <span style={{ fontSize: '11px', color: '#1d4ed8', background: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ⏳ Facture demandée
                                </span>
                              )}
                              <span className="item-date">
                                📅 {res.date || res.departureDate || 'Date à confirmer'} 
                                {res.departureTime ? ` à ${res.departureTime}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="item-badge-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`status-badge ${isCompleted ? 'completed' : isConfirmed ? 'confirmed' : 'pending'}`}>
                              {res.status || 'En attente'}
                            </span>
                            {!res.devisRef && (
                              <button
                                type="button"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                onClick={() => requestReservationDoc(res, 'devis')}
                                title="Solliciter un devis chiffré"
                              >
                                📋 Demander Devis
                              </button>
                            )}
                            {res.devisRef && !res.factureRef && (
                              <button
                                type="button"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                onClick={() => requestReservationDoc(res, 'facture')}
                                title="Demander la facture pour payer"
                              >
                                🧾 Demander Facture
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Details snippet */}
                        <div className="item-details-row">
                          <span className="detail-pill">
                            📍 {res.destination || res.trajet || res.circuit || 'Port-au-Prince'}
                          </span>
                          {res.passengers && (
                            <span className="detail-pill">
                              👥 {res.passengers} passager(s)
                            </span>
                          )}
                          {res.driver && (
                            <span className="detail-pill driver">
                              🚗 Chauffeur : {res.driver}
                            </span>
                          )}
                          {res.totalAmount && (
                            <span className="detail-price">
                              <DualPrice usdAmount={res.totalAmount} />
                            </span>
                          )}
                        </div>

                        {/* Action Chauffeur : Terminer la course en 1 clic */}
                        {(role === 'chauffeur' || role === 'admin' || role === 'secretaire') && 
                         (res.status === 'En cours' || res.status === 'Confirmée') && (
                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Confirmer que la course ${res.id || res.number} pour ${res.client} est terminée ?`)) {
                                  completeReservationByDriver(res.id || res.number);
                                }
                              }}
                              style={{
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '12px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                              }}
                              title="Signaler la fin de la course en 1 clic et notifier la régulation"
                            >
                              <span>🏁</span>
                              <span>Terminer la Course (1 clic)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="timeline-empty-state">
                <div className="empty-icon">🚗</div>
                <h4>Aucune réservation trouvée</h4>
                <p>Vous n'avez pas de course enregistrée dans cette catégorie.</p>
                <button 
                  type="button" 
                  className="client-btn-primary"
                  onClick={() => onOpenModal('reservation')}
                >
                  Réserver un Véhicule Maintenant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. VIP Subscription / Privilège Card (Ref 2 bottom right card) */}
        <div className="client-subscription-card">
          <div className="sub-card-inner">
            <span className="sub-card-badge">ADHÉSION EXCLUSIVE</span>
            <h3 className="sub-card-title">Abonnement Laperle VIP & Scolaire</h3>
            <p className="sub-card-lead">
              Bénéficiez de tarifs préférentiels, d'une priorité de réservation et de nos véhicules haut de gamme.
            </p>

            <ul className="sub-card-list">
              <li>
                <span className="bullet-check">✓</span>
                <span>Priorité absolue sur les navettes scolaires et circuits VIP</span>
              </li>
              <li>
                <span className="bullet-check">✓</span>
                <span>Chauffeurs certifiés et expérimentés sur toutes les routes d'Haïti</span>
              </li>
              <li>
                <span className="bullet-check">✓</span>
                <span>Facturation transparente conforme aux normes DGI</span>
              </li>
              <li>
                <span className="bullet-check">✓</span>
                <span>Assistance et conciergerie 24h/24 via WhatsApp direct</span>
              </li>
            </ul>

            <div className="sub-card-footer">
              <button 
                type="button" 
                className="sub-cta-btn"
                onClick={() => onOpenModal('reservation')}
              >
                Souscrire / Réserver
              </button>
              <button 
                type="button" 
                className="sub-text-btn"
                onClick={() => onOpenModal('demande-devis')}
              >
                Demander les Tarifs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
