import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';

interface ReservationsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({ onOpenModal }) => {
  const { 
    reservations, 
    deleteReservation, 
    requestReservationDoc,
    globalSearchQuery,
    convertReservationToProforma,
    convertReservationToPlanning,
    settings
  } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [pendingReqId, setPendingReqId] = useState<string | null>(null);

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = reservations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (effectiveSearch) {
      const matchClient = r.client?.toLowerCase().includes(effectiveSearch);
      const matchService = r.service?.toLowerCase().includes(effectiveSearch);
      const matchOrigin = r.origin?.toLowerCase().includes(effectiveSearch);
      const matchDest = r.destination?.toLowerCase().includes(effectiveSearch);
      const matchId = r.id?.toLowerCase().includes(effectiveSearch);
      return matchClient || matchService || matchOrigin || matchDest || matchId;
    }
    return true;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Confirmée': return 'green';
      case 'En cours': return 'orange';
      case 'Terminée': return 'green';
      case 'Annulée': return 'red';
      default: return '';
    }
  };

  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  const handleRequestDoc = async (r: any, type: 'devis' | 'facture') => {
    setPendingReqId(`${r.id}-${type}`);
    try {
      await requestReservationDoc(r, type);
    } finally {
      setPendingReqId(null);
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isClient ? 'Mes Réservations & Trajets VIP' : 'Gestion des Réservations & Courses'}</h2>
          <p>
            {isClient
              ? 'Consultez vos trajets réservés, demandez un devis ou une facture en 1 clic et suivez vos chauffeurs.'
              : 'Supervisez l\'ensemble des demandes de transferts, circuits et réservations VIP avec traçabilité complète.'}
          </p>
        </div>
        <div className="actions">
          <button 
            type="button" 
            className="primary" 
            onClick={() => onOpenModal('reservation')}
          >
            {isClient ? '+ Réserver un Trajet' : '+ Nouvelle Réservation'}
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder={isClient ? 'Rechercher un trajet, destination...' : 'Filtrer par client, trajet ou service...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: '1 1 200px' }}
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ flex: '0 1 160px' }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Confirmée">Confirmée</option>
              <option value="En cours">En cours</option>
              <option value="Terminée">Terminée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>

          {/* View mode toggle: Detailed Cards vs Grid Table */}
          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`btn-view-mode ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Affichage en fiches dépliées complètes (aucune troncature)"
            >
              <span>📋</span>
              <span>Vue Détaillée (Cartes)</span>
            </button>
            <button
              type="button"
              className={`btn-view-mode ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Affichage en tableau aux lignes allongées"
            >
              <span>📊</span>
              <span>Tableau Allongé</span>
            </button>
          </div>
        </div>

        {/* 1. DETAILED CARDS VIEW (Spacious, full width, no truncation) */}
        {viewMode === 'cards' && (
          <div className="cards-grid-flow" style={{ marginTop: '16px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚗</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Aucune réservation trouvée</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  {isClient 
                    ? 'Vous n\'avez aucune réservation active avec ce filtre. Cliquez sur "+ Réserver un Trajet" pour planifier une course.' 
                    : 'Modifiez vos filtres de recherche pour afficher les réservations.'}
                </div>
              </div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="item-detail-card">
                  {/* Card Header */}
                  <div className="item-detail-card-head">
                    <div className="card-id-cluster" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DocRefBadge reference={r.id} type="reservation" />
                      <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                        {r.status || 'En attente'}
                      </span>
                      {r.demandeDevis && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⏳ Devis sollicité
                        </span>
                      )}
                      {r.demandeFacture && (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          ⏳ Facture sollicitée
                        </span>
                      )}
                      {r.devisRef && (
                        <DocRefBadge reference={r.devisRef} type="proforma" label={`Devis ${r.devisRef}`} />
                      )}
                      {r.factureRef && (
                        <DocRefBadge reference={r.factureRef} type="facture" label={`Facture ${r.factureRef}`} />
                      )}
                      <span className="card-service-title">{r.service || 'Course privée VIP'}</span>
                    </div>

                    <div className="card-price-badge">
                      <DualPrice amount={r.amount || 0} currency={r.currency || 'USD'} size="sm" />
                    </div>
                  </div>

                  {/* Route Row (Large & Clear) */}
                  <div className="item-detail-card-route">
                    <span className="route-endpoint">
                      <span>📍</span>
                      <strong>{r.origin || 'Port-au-Prince'}</strong>
                    </span>
                    <span className="route-arrow-icon">➔</span>
                    <span className="route-endpoint">
                      <span>🎯</span>
                      <strong>{r.destination || 'Côte des Arcadins'}</strong>
                    </span>
                  </div>

                  {/* Meta Details Row */}
                  <div className="item-detail-card-meta">
                    <span className="meta-chip">
                      <span>📅</span>
                      <span>Date : <strong>{r.date}</strong> à <strong>{r.time || '09:00'}</strong></span>
                    </span>
                    <span className="meta-chip">
                      <span>👥</span>
                      <span>Passagers : <strong>{r.passengers || 1} pers.</strong></span>
                    </span>
                    <span className="meta-chip">
                      <span>🚗</span>
                      <span>Chauffeur : <strong>{r.driver || 'Attribution en cours'}</strong></span>
                      {r.vehicle && <span style={{ color: '#082b70' }}>({r.vehicle})</span>}
                    </span>
                    {!isClient && (
                      <span className="meta-chip">
                        <span>👤</span>
                        <span>Client : <strong>{r.client}</strong></span>
                        {r.telephone && <span style={{ color: '#64748b' }}>({r.telephone})</span>}
                      </span>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="item-detail-card-actions">
                    {isClient ? (
                      <>
                        <button
                          type="button"
                          className="btn-card-action primary-subtle"
                          disabled={pendingReqId === `${r.id}-devis`}
                          onClick={() => handleRequestDoc(r, 'devis')}
                          title="Demander à l'équipe commerciale de vous préparer le devis officiel"
                        >
                          📋 Demander un Devis
                        </button>

                        <button
                          type="button"
                          className="btn-card-action primary-subtle"
                          disabled={pendingReqId === `${r.id}-facture`}
                          onClick={() => handleRequestDoc(r, 'facture')}
                          title="Demander à la comptabilité de vous adresser la facture officielle"
                        >
                          🧾 Demander une Facture
                        </button>

                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('demande-envoi', {
                            type: 'facture',
                            doc: {
                              number: r.id,
                              amount: r.amount,
                              service: r.service,
                              client: r.client,
                              clientEmail: r.email,
                              telephone: r.telephone,
                              status: r.status
                            }
                          })}
                          title="Recevoir par Email ou WhatsApp"
                        >
                          📨 Envoi par Email/WhatsApp
                        </button>

                        <a
                          href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour Laperle Tour, je vous contacte concernant ma réservation ${r.id} (${r.service || 'Course'} du ${r.date}).`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-card-action success-subtle"
                          style={{ textDecoration: 'none' }}
                        >
                          💬 Support WhatsApp
                        </a>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(r.origin || 'Port-au-Prince')}&destination=${encodeURIComponent(r.destination || 'Côte des Arcadins')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-card-action"
                          style={{ textDecoration: 'none' }}
                        >
                          🗺️ Carte GPS
                        </a>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-card-action primary-subtle"
                          onClick={() => convertReservationToProforma(r)}
                          title="Générer automatiquement un devis proforma"
                        >
                          📋 Générer Devis
                        </button>
                        <button
                          type="button"
                          className="btn-card-action success-subtle"
                          onClick={() => convertReservationToPlanning(r)}
                          title="Envoyer au planning de dispatch"
                        >
                          ⏱️ Envoyer Dispatch
                        </button>
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('reservation', r)}
                          title="Modifier les détails de la réservation"
                        >
                          ✏️ Modifier
                        </button>
                        {r.telephone && (
                          <a
                            href={`https://wa.me/${r.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${r.client}, votre réservation Laperle ${r.id} est bien notée.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-card-action"
                            style={{ textDecoration: 'none' }}
                          >
                            💬 WhatsApp Client
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn-card-action"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            if (window.confirm('Voulez-vous supprimer cette réservation ?')) {
                              deleteReservation(r.id);
                            }
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. TABLE VIEW WITH ELONGATED SPACIOUS ROWS */}
        {viewMode === 'table' && (
          <div className="table-wrap" style={{ marginTop: '16px', overflowX: 'auto' }}>
            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Réf. Course</th>
                  {!isClient && <th style={{ padding: '14px 16px', fontSize: '12px' }}>Client</th>}
                  <th className="cell-service" style={{ padding: '14px 16px', fontSize: '12px' }}>Prestation</th>
                  <th className="cell-route" style={{ padding: '14px 16px', fontSize: '12px' }}>Itinéraire Trajet</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Date & Heure</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Passagers</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Tarif (USD / HTG)</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Chauffeur</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Statut</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Actions & Demandes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isClient ? 9 : 10} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      Aucune réservation trouvée.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr 
                      key={r.id} 
                      style={{ 
                        background: '#ffffff', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', 
                        borderRadius: '10px'
                      }}
                    >
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <DocRefBadge reference={r.id} type="reservation" />
                        {r.devisRef && (
                          <div style={{ marginTop: '4px' }}>
                            <DocRefBadge reference={r.devisRef} type="proforma" label={`Devis ${r.devisRef}`} />
                          </div>
                        )}
                        {r.factureRef && (
                          <div style={{ marginTop: '4px' }}>
                            <DocRefBadge reference={r.factureRef} type="facture" label={`Facture ${r.factureRef}`} />
                          </div>
                        )}
                      </td>
                      {!isClient && (
                        <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                          <strong style={{ color: '#0f172a' }}>{r.client}</strong>
                          {r.telephone && <div style={{ fontSize: '11px', color: '#64748b' }}>{r.telephone}</div>}
                        </td>
                      )}
                      <td className="cell-service" style={{ padding: '16px 14px', verticalAlign: 'middle', fontWeight: 600, color: '#1e293b' }}>
                        {r.service || 'Course privée VIP'}
                      </td>
                      <td className="cell-route" style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                          <div>📍 <strong>{r.origin || 'Port-au-Prince'}</strong></div>
                          <div style={{ color: '#d97706', fontWeight: 700, paddingLeft: '4px' }}>➔ 🎯 <strong>{r.destination || 'Côte des Arcadins'}</strong></div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600 }}>{r.date}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.time || '09:00'}</div>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <span className="font-semibold">{r.passengers || 1} pers.</span>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <DualPrice amount={r.amount || 0} currency={r.currency || 'USD'} size="sm" />
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ fontWeight: 600 }}>{r.driver || 'En attente'}</span>
                          {r.vehicle && <div style={{ color: '#082b70', fontSize: '11px' }}>{r.vehicle}</div>}
                        </div>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                          {r.status || 'En attente'}
                        </span>
                        {r.demandeDevis && (
                          <div style={{ fontSize: '10px', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                            Devis demandé ⏳
                          </div>
                        )}
                        {r.demandeFacture && (
                          <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 600, marginTop: '2px' }}>
                            Facture demandée ⏳
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div className="action-cell" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {isClient ? (
                            <>
                              <button
                                type="button"
                                className="tiny"
                                style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}
                                onClick={() => handleRequestDoc(r, 'devis')}
                                title="Demander un devis sur ce trajet"
                              >
                                📋 Devis
                              </button>
                              <button
                                type="button"
                                className="tiny"
                                style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                                onClick={() => handleRequestDoc(r, 'facture')}
                                title="Demander une facture sur ce trajet"
                              >
                                🧾 Facture
                              </button>
                              <a
                                href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour Laperle Tour, je vous contacte concernant ma réservation ${r.id}.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tiny"
                                style={{ textDecoration: 'none' }}
                                title="Support WhatsApp"
                              >
                                💬
                              </a>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="tiny"
                                style={{ background: '#eef3ff', color: '#164b99', fontWeight: 600 }}
                                onClick={() => convertReservationToProforma(r)}
                                title="Générer un devis proforma"
                              >
                                📋 Devis
                              </button>
                              <button
                                type="button"
                                className="tiny"
                                style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 600 }}
                                onClick={() => convertReservationToPlanning(r)}
                                title="Envoyer au planning de dispatch"
                              >
                                ⏱️ Dispatch
                              </button>
                              <button
                                type="button"
                                className="tiny edit"
                                onClick={() => onOpenModal('reservation', r)}
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="tiny delete"
                                onClick={() => {
                                  if (window.confirm('Voulez-vous supprimer cette réservation ?')) {
                                    deleteReservation(r.id);
                                  }
                                }}
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
