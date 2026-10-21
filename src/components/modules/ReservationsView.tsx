import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Reservation } from '../../types';

interface ReservationsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({ onOpenModal }) => {
  const { 
    reservations, 
    deleteReservation, 
    saveReservation, 
    globalSearchQuery,
    convertReservationToProforma,
    convertReservationToPlanning
  } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = reservations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (effectiveSearch) {
      const matchClient = r.client?.toLowerCase().includes(effectiveSearch);
      const matchService = r.service?.toLowerCase().includes(effectiveSearch);
      const matchOrigin = r.origin?.toLowerCase().includes(effectiveSearch);
      const matchDest = r.destination?.toLowerCase().includes(effectiveSearch);
      return matchClient || matchService || matchOrigin || matchDest;
    }
    return true;
  });

  const handleStatusChange = async (r: Reservation, newStatus: Reservation['status']) => {
    await saveReservation({ ...r, status: newStatus });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Confirmée': return 'green';
      case 'En cours': return 'orange';
      case 'Terminée': return 'green';
      case 'Annulée': return 'red';
      default: return '';
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Gestion des Réservations & Courses</h2>
          <p>Supervisez l'ensemble des demandes de transferts, circuits et réservations VIP.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('reservation')}>
            + Nouvelle Réservation
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Filtrer par client, trajet ou service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="Confirmée">Confirmée</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
            <option value="Annulée">Annulée</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Prestation</th>
                <th>Itinéraire</th>
                <th>Date & Heure</th>
                <th>Passagers</th>
                <th>Montant</th>
                <th>Chauffeur & Véhicule</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucune réservation trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong></td>
                    <td>
                      <strong>{r.client}</strong>
                      {r.telephone && <div style={{ fontSize: '11px', color: '#64748b' }}>{r.telephone}</div>}
                    </td>
                    <td>{r.service || 'Course privée'}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <span>📍 {r.origin || 'Port-au-Prince'}</span>
                        <span style={{ color: '#f7941d', margin: '0 4px' }}>➔</span>
                        <span>🎯 {r.destination || 'Côte des Arcadins'}</span>
                      </div>
                    </td>
                    <td>
                      <div>{r.date}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{r.time || '09:00'}</div>
                    </td>
                    <td>{r.passengers || 1} pers.</td>
                    <td><strong>${r.amount || 0} {r.currency || 'USD'}</strong></td>
                    <td>
                      <div style={{ fontSize: '11px' }}>
                        <span>{r.driver || 'Non assigné'}</span>
                        {r.vehicle && <div style={{ color: '#64748b' }}>{r.vehicle}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="tiny"
                          style={{ background: '#eef3ff', color: '#164b99', fontWeight: 600 }}
                          onClick={() => convertReservationToProforma(r)}
                          title="Générer automatiquement un devis proforma"
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
                        {r.telephone && (
                          <a
                            href={`https://wa.me/${r.telephone.replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(r.client)},%20votre%20réservation%20Laperle%20${r.id}%20est%20bien%20notée.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tiny"
                            style={{ textDecoration: 'none' }}
                            title="Contacter sur WhatsApp"
                          >
                            💬
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(r.origin || 'Port-au-Prince')}&destination=${encodeURIComponent(r.destination || 'Cap-Haitien')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tiny"
                          style={{ textDecoration: 'none' }}
                          title="Itinéraire GPS"
                        >
                          🗺️
                        </a>
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
