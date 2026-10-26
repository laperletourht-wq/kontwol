import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RowActionMenu, ActionMenuItem } from '../common/RowActionMenu';

interface AbonnementsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const AbonnementsView: React.FC<AbonnementsViewProps> = ({ onOpenModal }) => {
  const { abonnements, deleteAbonnement, globalSearchQuery } = useApp();
  const [typeFilter, setTypeFilter] = useState('ALL');

  const effectiveSearch = globalSearchQuery.toLowerCase();

  const filtered = abonnements.filter((a) => {
    if (typeFilter !== 'ALL' && a.typeAbonnement !== typeFilter) return false;
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
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Type :</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#ffffff',
                color: '#1e293b'
              }}
            >
              <option value="ALL">Tous les types de contrat</option>
              <option value="Transport Scolaire">Transport Scolaire</option>
              <option value="Contrat Entreprise">Contrat Entreprise</option>
              <option value="Abonnement VIP">Abonnement VIP</option>
              <option value="Navette Partagée">Navette Partagée</option>
            </select>
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
            <strong>{filtered.length}</strong> abonnement{filtered.length > 1 ? 's' : ''} en cours
          </div>
        </div>

        <div className="modern-table-card">
          <div className="modern-table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Titulaire / Client</th>
                  <th>Bénéficiaire</th>
                  <th>Type de Contrat</th>
                  <th>Tarif Mensuel</th>
                  <th>Période de Validité</th>
                  <th>Prochaine Échéance</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      Aucun abonnement en cours.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const actionItems: ActionMenuItem[] = [
                      {
                        label: 'Modifier le contrat',
                        icon: '✏️',
                        onClick: () => onOpenModal('abonnement', a)
                      },
                      {
                        label: 'Supprimer',
                        icon: '🗑️',
                        onClick: () => {
                          if (window.confirm(`Supprimer l'abonnement de ${a.client} ?`)) {
                            deleteAbonnement(a.id);
                          }
                        },
                        variant: 'danger'
                      }
                    ];

                    return (
                      <tr key={a.id}>
                        <td><strong style={{ color: '#082b70' }}>{a.client}</strong></td>
                        <td>{a.eleveNom || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                        <td><span className="badge">{a.typeAbonnement}</span></td>
                        <td><strong style={{ color: '#0f172a' }}>${a.tarifMensuel} {a.currency || 'USD'} / mois</strong></td>
                        <td style={{ fontSize: '12.5px' }}>Du {a.dateDebut} au {a.dateFin}</td>
                        <td><strong style={{ color: '#b45309' }}>{a.prochainRenouvellement || '-'}</strong></td>
                        <td>
                          <span className={`badge ${a.statut === 'Actif' ? 'green' : 'orange'}`}>
                            {a.statut}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <RowActionMenu items={actionItems} title={`Actions pour l'abonnement de ${a.client}`} />
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
              <span>Affichage de <strong>{filtered.length}</strong> abonnement(s)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
