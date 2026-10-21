import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface VehiculesViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const VehiculesView: React.FC<VehiculesViewProps> = ({ onOpenModal }) => {
  const { vehicules, deleteVehicule, globalSearchQuery } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = vehicules.filter((v) => {
    if (effectiveSearch) {
      return (
        v.plaque.toLowerCase().includes(effectiveSearch) ||
        v.marque.toLowerCase().includes(effectiveSearch) ||
        v.modele.toLowerCase().includes(effectiveSearch) ||
        v.categorie.toLowerCase().includes(effectiveSearch)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disponible': return 'green';
      case 'En mission': return 'orange';
      case 'En maintenance': return 'red';
      default: return '';
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Parc Automobile & Flotte LAPERLE</h2>
          <p>Gestion technique, disponibilité, maintenance et assignation des véhicules.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('vehicule')}>
            + Ajouter un Véhicule
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par plaque, marque, modèle ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Immatriculation</th>
                <th>Véhicule</th>
                <th>Catégorie</th>
                <th>Capacité</th>
                <th>Kilométrage</th>
                <th>Équipements</th>
                <th>Chauffeur Attitré</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucun véhicule enregistré.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.plaque}</strong></td>
                    <td>
                      <strong>{v.marque} {v.modele}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Année {v.annee} • {v.couleur || 'Standard'}</div>
                    </td>
                    <td><span className="badge">{v.categorie}</span></td>
                    <td>{v.capacitePassagers} passagers</td>
                    <td>{v.kilometrage ? `${v.kilometrage.toLocaleString()} km` : '-'}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {v.climatisation && <span>❄️ Clim. </span>}
                        {v.gpsActif && <span>📡 GPS</span>}
                      </div>
                    </td>
                    <td>{v.chauffeurAttitre || 'Non assigné'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(v.statut)}`}>
                        {v.statut}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('vehicule', v)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm(`Supprimer le véhicule ${v.plaque} ?`)) {
                              deleteVehicule(v.id);
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
