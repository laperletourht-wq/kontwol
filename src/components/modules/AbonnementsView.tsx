import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface AbonnementsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const AbonnementsView: React.FC<AbonnementsViewProps> = ({ onOpenModal }) => {
  const { abonnements, deleteAbonnement, globalSearchQuery } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = abonnements.filter((a) => {
    if (effectiveSearch) {
      return (
        a.client.toLowerCase().includes(effectiveSearch) ||
        (a.eleveNom && a.eleveNom.toLowerCase().includes(effectiveSearch)) ||
        a.typeAbonnement.toLowerCase().includes(effectiveSearch)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Abonnements Mensuels & Contrats Réguliers</h2>
          <p>Supervisez les abonnements scolaires, corporatifs et forfaits de transport réguliers.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('abonnement')}>
            + Nouvel Abonnement
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par client, élève ou contrat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titulaire / Client</th>
                <th>Bénéficiaire</th>
                <th>Type de Contrat</th>
                <th>Tarif Mensuel</th>
                <th>Période de Validité</th>
                <th>Prochaine Échéance</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucun abonnement en cours.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.client}</strong></td>
                    <td>{a.eleveNom || '-'}</td>
                    <td><span className="badge">{a.typeAbonnement}</span></td>
                    <td><strong>${a.tarifMensuel} {a.currency || 'USD'} / mois</strong></td>
                    <td>Du {a.dateDebut} au {a.dateFin}</td>
                    <td><strong>{a.prochainRenouvellement || '-'}</strong></td>
                    <td>
                      <span className={`badge ${a.statut === 'Actif' ? 'green' : 'orange'}`}>
                        {a.statut}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('abonnement', a)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm(`Supprimer l'abonnement de ${a.client} ?`)) {
                              deleteAbonnement(a.id);
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
