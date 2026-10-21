import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface PlanningsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const PlanningsView: React.FC<PlanningsViewProps> = ({ onOpenModal }) => {
  const { plannings, deletePlanning, savePlanning, globalSearchQuery } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = plannings.filter((p) => {
    if (effectiveSearch) {
      return (
        p.client.toLowerCase().includes(effectiveSearch) ||
        p.chauffeur.toLowerCase().includes(effectiveSearch) ||
        p.vehicule.toLowerCase().includes(effectiveSearch) ||
        p.destination.toLowerCase().includes(effectiveSearch)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Planning des Départs & Dispatch Flotte</h2>
          <p>Organisez les missions, assignez chauffeurs et véhicules, et prévenez les conflits d'horaires.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('planning')}>
            + Programmer un Trajet
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par trajet, chauffeur, véhicule ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Client / Mission</th>
                <th>Prestation</th>
                <th>Itinéraire</th>
                <th>Passagers</th>
                <th>Conducteur</th>
                <th>Véhicule</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucun planning programmé.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.heure}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{p.date}</div>
                    </td>
                    <td><strong>{p.client}</strong></td>
                    <td>{p.service}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <span>📍 {p.depart}</span>
                        <span style={{ color: '#f7941d', margin: '0 4px' }}>➔</span>
                        <span>🎯 {p.destination}</span>
                      </div>
                    </td>
                    <td>{p.passagers} pers.</td>
                    <td><strong>{p.chauffeur}</strong></td>
                    <td>{p.vehicule}</td>
                    <td>
                      <span className={`badge ${p.statut === 'En cours' ? 'orange' : p.statut === 'Achevé' ? 'green' : ''}`}>
                        {p.statut}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        {p.statut === 'Programmé' && (
                          <button
                            type="button"
                            className="tiny"
                            style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}
                            onClick={() => savePlanning({ ...p, statut: 'En cours' })}
                            title="Démarrer la mission (Met le véhicule et le chauffeur en mission)"
                          >
                            ▶️ Démarrer
                          </button>
                        )}
                        {p.statut === 'En cours' && (
                          <button
                            type="button"
                            className="tiny"
                            style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}
                            onClick={() => savePlanning({ ...p, statut: 'Achevé' })}
                            title="Achever la mission (Libère le véhicule et le chauffeur)"
                          >
                            ✅ Achever
                          </button>
                        )}
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('planning', p)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm('Supprimer ce planning de trajet ?')) {
                              deletePlanning(p.id);
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
