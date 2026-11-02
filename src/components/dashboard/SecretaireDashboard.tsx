import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { AssignDriverModal } from '../modals/AssignDriverModal';

interface SecretaireDashboardProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const SecretaireDashboard: React.FC<SecretaireDashboardProps> = ({ onOpenModal }) => {
  const { profile, user } = useAuth();
  const { 
    reservations, 
    vehicules, 
    chauffeurs, 
    proformas, 
    factures, 
    plannings,
    setCurrentModule, 
    setChatModalOpen,
    convertReservationToProforma,
    convertProformaToFacture,
    convertReservationToFacture,
    convertFactureToPaiement,
    settings
  } = useApp();

  const [period, setPeriod] = useState<'jour' | 'semaine' | 'mois'>('jour');
  const [driverTab, setDriverTab] = useState<'actifs' | 'tous'>('actifs');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [assignRes, setAssignRes] = useState<any | null>(null);

  const secretaryName = profile?.nom || user?.displayName || 'Secrétariat';

  // Metrics computation
  const activeReservations = useMemo(() => {
    return reservations.filter(r => r.status === 'Confirmée' || r.status === 'En cours');
  }, [reservations]);

  const pendingReservations = useMemo(() => {
    return reservations.filter(r => r.status === 'En attente');
  }, [reservations]);

  const activeDriversCount = useMemo(() => {
    return chauffeurs.filter(c => c.statut === 'Disponible' || c.statut === 'En course' || c.status === 'actif').length;
  }, [chauffeurs]);

  const availableVehiclesCount = useMemo(() => {
    return vehicules.filter(v => v.statut === 'Disponible' || v.status === 'Disponible').length;
  }, [vehicules]);

  // Operational metrics for the 3 highlight cards
  const navettesScolairesCount = useMemo(() => {
    return reservations.filter(r => (r.serviceType || r.service || '').toLowerCase().includes('scolaire') || (r.circuit || '').toLowerCase().includes('scolaire')).length;
  }, [reservations]);

  const circuitsTouristiquesCount = useMemo(() => {
    return reservations.filter(r => (r.serviceType || r.service || '').toLowerCase().includes('tour') || (r.circuit || '').toLowerCase().includes('tour')).length;
  }, [reservations]);

  const vipSuvCount = useMemo(() => {
    return reservations.filter(r => (r.serviceType || r.service || '').toLowerCase().includes('vip') || (r.vehicleType || '').toLowerCase().includes('suv')).length;
  }, [reservations]);

  // Map markers for live map
  const liveVehicles = useMemo(() => {
    if (vehicules.length > 0) {
      return vehicules.map((v, i) => ({
        id: v.id,
        nom: `${v.marque || ''} ${v.modele || ''}`.trim() || 'Véhicule',
        immatriculation: v.plaque || `VEH-${i + 1}`,
        status: v.statut || 'Disponible',
        zone: v.categorie || 'Base Centrale',
        driver: v.chauffeurAttitre || 'Non assigné',
        lat: 30 + ((i * 17) % 45),
        lng: 25 + ((i * 23) % 45)
      }));
    }
    return [];
  }, [vehicules]);

  return (
    <div className="secretaire-dash-wrapper">
      {/* Top Welcome & Period Control */}
      <div className="secretaire-header-row">
        <div>
          <span className="secretaire-pill-badge">CENTRE OPÉRATIONNEL & SECRÉTARIAT</span>
          <h1 className="secretaire-title">Bonjour, {secretaryName}</h1>
          <p className="secretaire-subtitle">
            Supervision en temps réel des courses, affectation des chauffeurs et gestion des navettes LAPERLE TOUR HT.
          </p>
        </div>

        <div className="secretaire-header-actions">
          <div className="secretaire-segmented-pills">
            <button 
              type="button" 
              className={`sec-pill-btn ${period === 'jour' ? 'active' : ''}`}
              onClick={() => setPeriod('jour')}
            >
              Aujourd'hui
            </button>
            <button 
              type="button" 
              className={`sec-pill-btn ${period === 'semaine' ? 'active' : ''}`}
              onClick={() => setPeriod('semaine')}
            >
              Cette semaine
            </button>
            <button 
              type="button" 
              className={`sec-pill-btn ${period === 'mois' ? 'active' : ''}`}
              onClick={() => setPeriod('mois')}
            >
              Ce mois
            </button>
          </div>

          <button 
            type="button" 
            className="secretaire-btn-primary"
            onClick={() => onOpenModal('reservation')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Nouvelle Course</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid matching reference 1 */}
      <div className="secretaire-main-grid">
        {/* Left Column: Big Interactive Overview Card + Operational Highlights */}
        <div className="secretaire-left-col">
          {/* Wave Curve Overview Card (Ref 1 style) */}
          <div className="secretaire-overview-card">
            <div className="sec-overview-head">
              <div>
                <span className="sec-head-small">SURVEILLANCE DU FLUX OPÉRATIONNEL</span>
                <h2 className="sec-head-title">Vue d'ensemble des Transports</h2>
              </div>
              <div className="sec-dropdown-pill">
                <span>{period === 'jour' ? 'Journée en cours' : period === 'semaine' ? 'Semaine active' : 'Mois d\'Avril 2026'}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {/* Simulated interactive wave chart with pinned stat */}
            <div className="sec-chart-container">
              <svg className="sec-wave-svg" viewBox="0 0 700 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#1769e0" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                <path 
                  d="M0,110 C80,120 140,50 220,70 C300,90 340,30 420,35 C500,40 560,95 640,75 L700,85 L700,160 L0,160 Z" 
                  fill="url(#waveGradient)"
                />
                <path 
                  d="M0,110 C80,120 140,50 220,70 C300,90 340,30 420,35 C500,40 560,95 640,75 L700,85" 
                  fill="none" 
                  stroke="#f97316" 
                  strokeWidth="3.5"
                />
              </svg>

              {/* Pin marker on peak */}
              <div className="sec-chart-pin" style={{ left: '60%', top: '18%' }}>
                <div className="sec-pin-bubble">
                  <strong>{activeReservations.length + 8}</strong> courses
                  <span>Pointe 14h-17h</span>
                </div>
                <div className="sec-pin-dot" />
              </div>

              {/* Bottom timeline months/hours labels */}
              <div className="sec-chart-labels">
                <span>06:00</span>
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span className="active-label">14:00</span>
                <span>16:00</span>
                <span>18:00</span>
                <span>20:00</span>
              </div>
            </div>

            {/* Bottom 3 metrics on the overview card */}
            <div className="sec-overview-stats">
              <div className="sec-stat-box">
                <span className="sec-stat-label">Heures planifiées</span>
                <div className="sec-stat-value tabular-nums">{period === 'jour' ? '38 h' : period === 'semaine' ? '240 h' : '980 h'}</div>
                <span className="sec-stat-sub">Tous circuits confondus</span>
              </div>
              <div className="sec-stat-box highlight">
                <span className="sec-stat-label">Courses confirmées</span>
                <div className="sec-stat-value tabular-nums">{reservations.length}</div>
                <span className="sec-stat-sub">{activeReservations.length} en circulation</span>
              </div>
              <div className="sec-stat-box">
                <span className="sec-stat-label">Taux de ponctualité</span>
                <div className="sec-stat-value tabular-nums">98.5%</div>
                <span className="sec-stat-sub">Objectif qualité Laperle</span>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles & Service Categories */}
          <div className="secretaire-highlight-row">
            {/* Coral Action Card (Ref 1 pink card style) */}
            <div className="sec-action-card-gradient">
              <div className="sec-action-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div className="sec-action-info">
                <span className="sec-action-kicker">DISPATCH ACCÉLÉRÉ</span>
                <h3 className="sec-action-title">Urgence & Demande Spéciale</h3>
                <p className="sec-action-desc">Assigner un véhicule disponible pour une course immédiate.</p>
              </div>
              <button 
                type="button" 
                className="sec-action-circle-btn"
                onClick={() => onOpenModal('reservation', { immediate: true })}
                title="Lancer le dispatch"
                aria-label="Lancer le dispatch"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Quick Planning / Dispatch Launcher */}
            <div className="sec-action-card-blue">
              <div className="sec-action-icon-circle blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="sec-action-info">
                <span className="sec-action-kicker">PLANNING ÉQUIPE</span>
                <h3 className="sec-action-title">Feuille de Route Quotidienne</h3>
                <p className="sec-action-desc">Imprimer ou exporter la fiche des rotations de la journée.</p>
              </div>
              <button 
                type="button" 
                className="sec-action-circle-btn"
                onClick={() => setCurrentModule('plannings')}
                title="Ouvrir les plannings"
                aria-label="Ouvrir les plannings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 3 Summary Cards with Progress Bars (Ref 1 bottom cards) */}
          <div className="secretaire-three-cards">
            {/* Card 1: Navettes Scolaires */}
            <div className="sec-category-card">
              <div className="sec-cat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h4 className="sec-cat-title">Navettes Scolaires</h4>
              <span className="sec-cat-sub">{navettesScolairesCount} élèves inscrits</span>
              <div className="sec-progress-wrap">
                <div className="sec-progress-bar" style={{ width: '85%' }} />
              </div>
              <div className="sec-cat-footer">
                <span className="sec-cat-ratio">Rotations 85%</span>
                <span className="sec-cat-tag green">Matin & Soir</span>
              </div>
            </div>

            {/* Card 2: Circuits Touristiques */}
            <div className="sec-category-card">
              <div className="sec-cat-icon orange">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
              </div>
              <h4 className="sec-cat-title">Circuits & Excursions</h4>
              <span className="sec-cat-sub">{circuitsTouristiquesCount} circuits planifiés</span>
              <div className="sec-progress-wrap">
                <div className="sec-progress-bar orange" style={{ width: '60%' }} />
              </div>
              <div className="sec-cat-footer">
                <span className="sec-cat-ratio">Cap-Haïtien / Jacmel</span>
                <span className="sec-cat-tag orange">Confirmés</span>
              </div>
            </div>

            {/* Card 3: VIP SUV & Entreprises */}
            <div className="sec-category-card">
              <div className="sec-cat-icon purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <h4 className="sec-cat-title">Locations VIP SUV</h4>
              <span className="sec-cat-sub">{vipSuvCount} missions actives</span>
              <div className="sec-progress-wrap">
                <div className="sec-progress-bar purple" style={{ width: '92%' }} />
              </div>
              <div className="sec-cat-footer">
                <span className="sec-cat-ratio">92% disponibilité</span>
                <span className="sec-cat-tag blue">Chauffeurs dédiés</span>
              </div>
            </div>
          </div>

          {/* Dossiers Clients & Cycle de Vie Réservation ➔ Proforma ➔ Facture */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            padding: '20px',
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#082b70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PILOTAGE DU CYCLE COMMERCIAL & LOGISTIQUE
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>
                  Dossiers Réservations & Traitement Secrétariat
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentModule('reservations')}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#2563eb',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Voir Toutes les Réservations ({reservations.length}) ➔
                </button>
              </div>
            </div>

            {reservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>📋</span>
                <div style={{ fontWeight: 600, color: '#334155' }}>Aucune demande client pour le moment</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Les nouvelles réservations et demandes de devis apparaîtront ici avec actions directes.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Dossier</th>
                      <th style={{ padding: '10px 12px' }}>Client</th>
                      <th style={{ padding: '10px 12px' }}>Prestation & Trajet</th>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Chiffrage</th>
                      <th style={{ padding: '10px 12px' }}>Documents Liés</th>
                      <th style={{ padding: '10px 12px' }}>Statut</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions Secrétariat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.slice(0, 6).map((r) => {
                      const linkedProforma = proformas.find(p => p.number === r.devisRef || p.reservationId === r.id);
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <DocRefBadge reference={r.id} type="reservation" />
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong style={{ color: '#0f172a' }}>{r.client}</strong>
                            {r.telephone && <div style={{ fontSize: '11px', color: '#64748b' }}>{r.telephone}</div>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.service || 'Course VIP'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              📍 {r.origin || 'Port-au-Prince'} ➔ {r.destination || 'Destination'}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <div>{r.date}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{r.time || '09:00'}</div>
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <DualPrice amount={r.amount || 0} currency={r.currency || 'USD'} size="sm" />
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {r.devisRef ? (
                                <DocRefBadge reference={r.devisRef} type="proforma" label={`Devis ${r.devisRef}`} />
                              ) : r.demandeDevis ? (
                                <span style={{ fontSize: '10.5px', color: '#b45309', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                  ⏳ Devis sollicité
                                </span>
                              ) : (
                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>-</span>
                              )}
                              {r.factureRef && (
                                <DocRefBadge reference={r.factureRef} type="facture" label={`Facture ${r.factureRef}`} />
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              background: r.status === 'Confirmée' || r.status === 'Terminée' ? '#dcfce7' : r.status === 'Facturé' ? '#dbeafe' : r.status === 'Devis émis' ? '#fef3c7' : '#f1f5f9',
                              color: r.status === 'Confirmée' || r.status === 'Terminée' ? '#166534' : r.status === 'Facturé' ? '#1e40af' : r.status === 'Devis émis' ? '#92400e' : '#475569'
                            }}>
                              {r.status || 'En attente'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '5px' }}>
                              {!r.devisRef && (
                                <button
                                  type="button"
                                  onClick={() => convertReservationToProforma(r)}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a',
                                    cursor: 'pointer'
                                  }}
                                  title="Chiffrer et créer le devis proforma"
                                >
                                  📋 Devis
                                </button>
                              )}
                              {!r.factureRef && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (linkedProforma) {
                                      convertProformaToFacture(linkedProforma);
                                    } else {
                                      convertReservationToFacture(r);
                                    }
                                  }}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    border: '1px solid #bfdbfe',
                                    cursor: 'pointer'
                                  }}
                                  title="Émettre la facture officielle"
                                >
                                  🧾 Facturer
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setAssignRes(r)}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: '#f0fdf4',
                                  color: '#166534',
                                  border: '1px solid #bbf7d0',
                                  cursor: 'pointer'
                                }}
                                title="Affecter chauffeur & véhicule"
                              >
                                🚗 Dispatch
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenModal('reservation', r)}
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: '#f8fafc',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer'
                                }}
                                title="Modifier la réservation"
                              >
                                ✏️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Drivers/Team List + Live Map (Ref 1 right sidebar) */}
        <div className="secretaire-right-col">
          {/* Active Drivers Panel */}
          <div className="sec-drivers-panel">
            <div className="sec-panel-header">
              <div className="sec-panel-title-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h3>Chauffeurs & Équipe</h3>
              </div>
              <button 
                type="button" 
                className="sec-link-btn"
                onClick={() => setCurrentModule('chauffeurs')}
              >
                Voir tous
              </button>
            </div>

            {/* Drivers Filter Tabs */}
            <div className="sec-drivers-tabs">
              <button 
                type="button" 
                className={`sec-tab-btn ${driverTab === 'actifs' ? 'active' : ''}`}
                onClick={() => setDriverTab('actifs')}
              >
                En tournée ({activeDriversCount})
              </button>
              <button 
                type="button" 
                className={`sec-tab-btn ${driverTab === 'tous' ? 'active' : ''}`}
                onClick={() => setDriverTab('tous')}
              >
                Tous ({chauffeurs.length})
              </button>
            </div>

            {/* Chauffeurs List */}
            <div className="sec-drivers-list">
              {liveVehicles.map((item, idx) => (
                <div key={item.id} className="sec-driver-item">
                  <div className="sec-driver-avatar">
                    <span>{item.driver.split(' ').map(n => n[0]).join('')}</span>
                    <span className="sec-online-dot" />
                  </div>
                  <div className="sec-driver-details">
                    <div className="sec-driver-name">{item.driver}</div>
                    <div className="sec-driver-vehicle">{item.nom}</div>
                    <span className="sec-driver-status-badge">{item.status}</span>
                  </div>
                  <button 
                    type="button"
                    className="sec-msg-btn"
                    onClick={() => {
                      if (setChatModalOpen) setChatModalOpen(true);
                    }}
                    title={`Contacter ${item.driver}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Map Panel */}
          <div className="sec-livemap-panel">
            <div className="sec-panel-header">
              <div className="sec-panel-title-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>Carte en Direct</h3>
              </div>
              <span className="sec-map-badge">GPS Actif</span>
            </div>

            {/* Interactive map mock styled as Port-au-Prince road grid */}
            <div className="sec-map-canvas">
              {/* Stylized road network */}
              <div className="sec-map-grid-roads">
                <div className="road main-road-1" />
                <div className="road main-road-2" />
                <div className="road cross-road-1" />
                <div className="road cross-road-2" />
                <div className="road highway-curve" />
              </div>

              {/* Map vehicle pins */}
              {liveVehicles.map(v => (
                <div 
                  key={v.id} 
                  className={`sec-map-pin ${selectedRoute === v.id ? 'selected' : ''}`}
                  style={{ left: `${v.lat}%`, top: `${v.lng}%` }}
                  onClick={() => setSelectedRoute(selectedRoute === v.id ? null : v.id)}
                  title={`${v.nom} - ${v.driver}`}
                >
                  <div className="pin-pulse" />
                  <div className="pin-core">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="8"/>
                    </svg>
                  </div>
                  {selectedRoute === v.id && (
                    <div className="pin-tooltip">
                      <strong>{v.driver}</strong>
                      <span>{v.zone}</span>
                      <em>{v.status}</em>
                    </div>
                  )}
                </div>
              ))}

              <div className="sec-map-overlay-footer">
                <span className="sec-map-footer-text">
                  📍 {liveVehicles.length} véhicules géo-localisés en Haïti
                </span>
                <button 
                  type="button" 
                  className="sec-map-recenter-btn"
                  onClick={() => setSelectedRoute(null)}
                >
                  Recentrer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'assignation Chauffeur & Véhicule */}
      {assignRes && (
        <AssignDriverModal
          reservation={assignRes}
          onClose={() => setAssignRes(null)}
          onSuccess={() => setAssignRes(null)}
        />
      )}
    </div>
  );
};
