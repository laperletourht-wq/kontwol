import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface ElevesViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ElevesView: React.FC<ElevesViewProps> = ({ onOpenModal }) => {
  const { eleves, deleteEleve, globalSearchQuery, generateEleveAbonnementEtFacture } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = eleves.filter((e) => {
    if (effectiveSearch) {
      const matchNom = `${e.prenom} ${e.nom}`.toLowerCase().includes(effectiveSearch);
      const matchEcole = e.ecole.toLowerCase().includes(effectiveSearch);
      const matchParent = e.parentNom.toLowerCase().includes(effectiveSearch);
      return matchNom || matchEcole || matchParent;
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Navettes Scolaires & Liste des Élèves</h2>
          <p>Gestion des enfants pris en charge quotidiennement par les circuits scolaires LAPERLE TOUR HT.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('eleve')}>
            + Inscrire un Élève
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par élève, école ou parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Établissement & Classe</th>
                <th>Point de Ramassage</th>
                <th>Responsable / Parent</th>
                <th>Contact Parent</th>
                <th>Chauffeur & Autocar</th>
                <th>Frais Mensuel</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucun élève enregistré.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.prenom} {e.nom}</strong></td>
                    <td>
                      <div>{e.ecole}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Classe : {e.classe || '-'}</div>
                    </td>
                    <td>📍 {e.arretRamassage}</td>
                    <td>{e.parentNom}</td>
                    <td>
                      <a href={`https://wa.me/${e.parentTelephone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#082b70', fontWeight: 600 }}>
                        {e.parentTelephone}
                      </a>
                    </td>
                    <td>
                      <div>{e.chauffeurAssigne || 'Samuel Joseph'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{e.vehiculeAssigne || 'Coaster SC-10522'}</div>
                    </td>
                    <td><strong>${e.fraisMensuel || 150} USD</strong></td>
                    <td>
                      <span className={`badge ${e.statut === 'Actif' ? 'green' : 'orange'}`}>
                        {e.statut}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="tiny"
                          style={{ background: '#fef3c7', color: '#b45309', fontWeight: 600 }}
                          onClick={() => generateEleveAbonnementEtFacture(e)}
                          title="Générer l'abonnement mensuel et la facture pour le parent"
                        >
                          🎫 Abonner & Facturer
                        </button>
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('eleve', e)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm(`Supprimer l'élève ${e.prenom} ${e.nom} ?`)) {
                              deleteEleve(e.id);
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
