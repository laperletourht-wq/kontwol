import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface ChauffeursViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ChauffeursView: React.FC<ChauffeursViewProps> = ({ onOpenModal }) => {
  const { chauffeurs, deleteChauffeur, globalSearchQuery } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = chauffeurs.filter((c) => {
    if (effectiveSearch) {
      return (
        `${c.prenom} ${c.nom}`.toLowerCase().includes(effectiveSearch) ||
        c.telephone.includes(effectiveSearch) ||
        c.permisNumero.toLowerCase().includes(effectiveSearch)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En service': return 'green';
      case 'En course': return 'orange';
      default: return '';
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Chauffeurs Privés & Personnel Roulant</h2>
          <p>Supervisez l'équipe de conducteurs assermentés, leurs permis et véhicules affectés.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('chauffeur')}>
            + Nouveau Chauffeur
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par chauffeur, téléphone ou permis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Conducteur</th>
                <th>Téléphone</th>
                <th>Numéro de Permis</th>
                <th>Véhicule Actuel</th>
                <th>Zones d'Intervention</th>
                <th>Évaluation</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucun chauffeur enregistré.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.prenom} {c.nom}</strong>
                      {c.email && <div style={{ fontSize: '11px', color: '#64748b' }}>{c.email}</div>}
                    </td>
                    <td>
                      <a href={`https://wa.me/${c.telephone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#082b70', fontWeight: 600 }}>
                        {c.telephone}
                      </a>
                    </td>
                    <td><span className="badge">{c.permisNumero}</span></td>
                    <td>{c.vehiculeActuel || 'Non assigné'}</td>
                    <td>{c.zonesHabituelles || 'Toutes zones'}</td>
                    <td>⭐ {c.noteService || 5.0} / 5</td>
                    <td>
                      <span className={`badge ${getStatusBadge(c.statut)}`}>
                        {c.statut}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <a
                          href={`https://wa.me/${c.telephone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tiny"
                          style={{ textDecoration: 'none' }}
                          title="Message WhatsApp"
                        >
                          💬
                        </a>
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('chauffeur', c)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm(`Supprimer le chauffeur ${c.prenom} ${c.nom} ?`)) {
                              deleteChauffeur(c.id);
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
