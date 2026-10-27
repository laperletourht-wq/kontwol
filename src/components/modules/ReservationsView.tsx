import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';
import { AssignDriverModal } from '../modals/AssignDriverModal';

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
    completeReservationByDriver,
    settings
  } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingReqId, setPendingReqId] = useState<string | null>(null);
  const [assignModalRes, setAssignModalRes] = useState<any | null>(null);

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

  const totalCount = reservations.length;
  const pendingCount = reservations.filter((r) => r.status === 'En attente').length;
  const activeCount = reservations.filter((r) => r.status === 'Confirmée' || r.status === 'En cours').length;
  const completedCount = reservations.filter((r) => r.status === 'Terminée').length;

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
        {/* Bandeau de synthèse compact 1-ligne (Option A - Style Ruban Excel) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '8px 14px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#082b70', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>📊</span> Synthèse :
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: statusFilter === 'ALL' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: statusFilter === 'ALL' ? '#eff6ff' : '#ffffff',
                color: statusFilter === 'ALL' ? '#1d4ed8' : '#334155',
                cursor: 'pointer'
              }}
              title="Afficher toutes les courses"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }} />
              <span>Toutes les courses : <strong>{totalCount}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('En attente')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: statusFilter === 'En attente' ? '1px solid #d97706' : '1px solid #cbd5e1',
                background: statusFilter === 'En attente' ? '#fffbeb' : '#ffffff',
                color: statusFilter === 'En attente' ? '#b45309' : '#334155',
                cursor: 'pointer'
              }}
              title="Filtrer les courses en attente"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706' }} />
              <span>En attente : <strong>{pendingCount}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Confirmée')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: (statusFilter === 'Confirmée' || statusFilter === 'En cours') ? '1px solid #16a34a' : '1px solid #cbd5e1',
                background: (statusFilter === 'Confirmée' || statusFilter === 'En cours') ? '#f0fdf4' : '#ffffff',
                color: (statusFilter === 'Confirmée' || statusFilter === 'En cours') ? '#15803d' : '#334155',
                cursor: 'pointer'
              }}
              title="Filtrer les courses confirmées"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
              <span>Confirmées / En cours : <strong>{activeCount}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Terminée')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: statusFilter === 'Terminée' ? '1px solid #059669' : '1px solid #cbd5e1',
                background: statusFilter === 'Terminée' ? '#ecfdf5' : '#ffffff',
                color: statusFilter === 'Terminée' ? '#047857' : '#334155',
                cursor: 'pointer'
              }}
              title="Filtrer les courses terminées"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669' }} />
              <span>Terminées : <strong>{completedCount}</strong></span>
            </button>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#475569',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <span>🚘 Courses enregistrées :</span>
            <strong style={{ color: '#082b70' }}>{totalCount}</strong>
          </div>
        </div>
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Filtrer par statut :</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '160px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b' }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Confirmée">Confirmée</option>
              <option value="En cours">En cours</option>
              <option value="Terminée">Terminée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>

          <div style={{ fontSize: '12.5px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <strong>{filtered.length}</strong> réservation{filtered.length > 1 ? 's' : ''}
          </div>
        </div>

        {false && (
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
                        {!r.devisRef && (
                          <button
                            type="button"
                            className="btn-card-action primary-subtle"
                            onClick={() => convertReservationToProforma(r)}
                            title="Chiffrer et transformer en devis proforma officiel"
                          >
                            📋 Transformer en Devis
                          </button>
                        )}
                        {r.devisRef && !r.factureRef && (
                          <button
                            type="button"
                            className="btn-card-action primary-subtle"
                            onClick={() => setCurrentModule('proformas')}
                            title="Consulter le devis et émettre la facture"
                          >
                            🧾 Émettre Facture
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-card-action success-subtle"
                          onClick={() => setAssignModalRes(r)}
                          title="Assigner manuellement un chauffeur assermenté et un véhicule"
                        >
                          🚗 Assigner Chauffeur & Véhicule
                        </button>
                        {(r.status === 'En cours' || r.driver) && r.status !== 'Terminée' && (
                          <button
                            type="button"
                            className="btn-card-action"
                            style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', fontWeight: 700 }}
                            onClick={() => {
                              if (window.confirm(`Confirmer la fin de la course ${r.id} pour ${r.client} ?`)) {
                                completeReservationByDriver(r.id);
                              }
                            }}
                            title="Clôturer immédiatement la course (1 clic)"
                          >
                            🏁 Terminer la Course
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('reservation', r)}
                          title="Modifier les détails de la réservation"
                        >
                          ✏️ Modifier
                        </button>
                        {r.chauffeurTelephone && (
                          <a
                            href={`https://wa.me/${r.chauffeurTelephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${r.driver}, concernant la course ${r.id} (${r.service || 'Course VIP'}).`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-card-action"
                            style={{ textDecoration: 'none' }}
                          >
                            📲 WhatsApp Chauffeur
                          </a>
                        )}
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

        {/* MODERN AIRY TABLE (Excel Style) */}
        <div className="modern-table-card">
            <div className="modern-table-wrap">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Réf. Course</th>
                    {!isClient && <th>Client</th>}
                    <th>Prestation</th>
                    <th>Itinéraire</th>
                    <th>Date & Heure</th>
                    <th>Passagers</th>
                    <th>Tarif (USD / HTG)</th>
                    <th>Chauffeur</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={isClient ? 9 : 10} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                        Aucune réservation trouvée.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const actionItems: ActionMenuItem[] = isClient ? [
                        {
                          label: 'Demander un devis',
                          icon: '📋',
                          onClick: () => handleRequestDoc(r, 'devis'),
                          variant: 'primary'
                        },
                        {
                          label: 'Demander une facture',
                          icon: '🧾',
                          onClick: () => handleRequestDoc(r, 'facture'),
                          variant: 'primary'
                        },
                        {
                          label: 'Assistance WhatsApp',
                          icon: '💬',
                          href: `https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour Laperle Tour, je vous contacte concernant ma réservation ${r.id}.`)}`,
                          variant: 'success'
                        }
                      ] : [
                        ...(!r.devisRef ? [{
                          label: 'Transformer en Devis',
                          icon: '📋',
                          onClick: () => convertReservationToProforma(r),
                          variant: 'primary' as const
                        }] : []),
                        ...(r.devisRef && !r.factureRef ? [{
                          label: 'Émettre Facture',
                          icon: '🧾',
                          onClick: () => setCurrentModule('proformas'),
                          variant: 'primary' as const
                        }] : []),
                        {
                          label: 'Assigner Chauffeur & Véhicule',
                          icon: '🚗',
                          onClick: () => setAssignModalRes(r),
                          variant: 'success' as const
                        },
                        ...((r.status === 'En cours' || r.driver) && r.status !== 'Terminée' ? [{
                          label: 'Terminer la Course (1 clic)',
                          icon: '🏁',
                          onClick: () => {
                            if (window.confirm(`Confirmer la fin de la course ${r.id} pour ${r.client} ?`)) {
                              completeReservationByDriver(r.id);
                            }
                          },
                          variant: 'success' as const
                        }] : []),
                        {
                          label: 'Modifier la réservation',
                          icon: '✏️',
                          onClick: () => onOpenModal('reservation', r)
                        },
                        ...(r.chauffeurTelephone ? [{
                          label: 'WhatsApp Chauffeur',
                          icon: '📲',
                          href: `https://wa.me/${r.chauffeurTelephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${r.driver}, concernant la course ${r.id}.`)}`,
                          variant: 'success' as const
                        }] : []),
                        ...(r.telephone ? [{
                          label: 'Contacter le client WhatsApp',
                          icon: '💬',
                          href: `https://wa.me/${r.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${r.client}, votre réservation Laperle ${r.id} est bien notée.`)}`,
                          variant: 'success' as const
                        }] : []),
                        {
                          label: 'Supprimer',
                          icon: '🗑️',
                          onClick: () => {
                            if (window.confirm('Voulez-vous supprimer cette réservation ?')) {
                              deleteReservation(r.id);
                            }
                          },
                          variant: 'danger' as const
                        }
                      ];

                      return (
                        <tr key={r.id}>
                          <td>
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
                            <td>
                              <strong style={{ color: '#0f172a' }}>{r.client}</strong>
                              {r.telephone && <div style={{ fontSize: '11px', color: '#64748b' }}>{r.telephone}</div>}
                            </td>
                          )}
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>
                            {r.service || 'Course privée VIP'}
                          </td>
                          <td>
                            <div style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                              <div>📍 <strong>{r.origin || 'Port-au-Prince'}</strong></div>
                              <div style={{ color: '#d97706', fontWeight: 700, paddingLeft: '4px' }}>➔ 🎯 <strong>{r.destination || 'Côte des Arcadins'}</strong></div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.date}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{r.time || '09:00'}</div>
                          </td>
                          <td>
                            <span className="font-semibold">{r.passengers || 1} pers.</span>
                          </td>
                          <td>
                            <DualPrice amount={r.amount || 0} currency={r.currency || 'USD'} size="sm" />
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ fontWeight: 600 }}>{r.driver || 'En attente'}</span>
                              {r.vehicle && <div style={{ color: '#082b70', fontSize: '11px' }}>{r.vehicle}</div>}
                            </div>
                          </td>
                          <td>
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
                          <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                            <RowActionMenu items={actionItems} title={`Actions pour ${r.id}`} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Affichage de <strong>{filtered.length}</strong> réservation(s)</span>
                <span style={{ fontSize: '11px' }}>Tableau opérationnel actualisé</span>
              </div>
            )}
          </div>
      </div>

      {/* Modal d'assignation Chauffeur & Véhicule */}
      {assignModalRes && (
        <AssignDriverModal
          reservation={assignModalRes}
          onClose={() => setAssignModalRes(null)}
          onSuccess={() => setAssignModalRes(null)}
        />
      )}
    </div>
  );
};
