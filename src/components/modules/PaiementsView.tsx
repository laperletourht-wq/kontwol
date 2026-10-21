import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface PaiementsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const PaiementsView: React.FC<PaiementsViewProps> = ({ onOpenModal }) => {
  const { paiements, deletePaiement, globalSearchQuery } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';
  const canManagePayments = !isClient && !isChauffeur;
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = paiements.filter((p) => {
    if (effectiveSearch) {
      return (
        p.reference.toLowerCase().includes(effectiveSearch) ||
        p.client.toLowerCase().includes(effectiveSearch) ||
        p.modePaiement.toLowerCase().includes(effectiveSearch) ||
        (p.factureAssociee && p.factureAssociee.toLowerCase().includes(effectiveSearch))
      );
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isClient ? 'Mes Règlements & Reçus de Paiement' : 'Caisse & Enregistrement des Paiements'}</h2>
          <p>
            {isClient
              ? 'Consultez l\'historique de vos versements (MonCash, Natcash, virements bancaires).'
              : 'Consultez les encaissements par MonCash, Natcash, virement bancaire et espèces.'}
          </p>
        </div>
        <div className="actions">
          {!isChauffeur && (
            <button type="button" className="primary" onClick={() => onOpenModal('paiement')}>
              {isClient ? '+ Déclarer un Règlement' : '+ Encaisser un Paiement'}
            </button>
          )}
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par référence, client ou mode de règlement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Mode de Paiement</th>
                <th>Motif / Facture</th>
                <th>Reçu Par</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucun encaissement enregistré.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.reference}</strong></td>
                    <td>{p.date}</td>
                    <td><strong>{p.client}</strong></td>
                    <td>
                      <strong style={{ color: '#082b70' }}>
                        {p.devise === 'USD' ? `$${p.montant.toLocaleString()}` : `${p.montant.toLocaleString()} HTG`}
                      </strong>
                    </td>
                    <td><span className="badge">{p.modePaiement}</span></td>
                    <td>
                      <div>{p.motif}</div>
                      {p.factureAssociee && <div style={{ fontSize: '11px', color: '#64748b' }}>Réf: {p.factureAssociee}</div>}
                    </td>
                    <td>{p.recuPar || 'Caisse Centrale'}</td>
                    <td>
                      <span className={`badge ${p.statut === 'Validé' ? 'green' : 'orange'}`}>
                        {p.statut}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        {canManagePayments ? (
                          <>
                            <button
                              type="button"
                              className="tiny edit"
                              onClick={() => onOpenModal('paiement', p)}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="tiny delete"
                              onClick={() => {
                                if (window.confirm(`Supprimer le paiement ${p.reference} ?`)) {
                                  deletePaiement(p.id);
                                }
                              }}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Reçu officiel</span>
                        )}
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
