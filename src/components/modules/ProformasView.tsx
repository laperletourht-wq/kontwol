import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Proforma } from '../../types';

interface ProformasViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ProformasView: React.FC<ProformasViewProps> = ({ onOpenModal }) => {
  const { proformas, deleteProforma, convertProformaToFacture, setPrintSheetData, globalSearchQuery } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = proformas.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (effectiveSearch) {
      const matchClient = p.client?.toLowerCase().includes(effectiveSearch);
      const matchNum = p.number?.toLowerCase().includes(effectiveSearch);
      const matchSvc = p.service?.toLowerCase().includes(effectiveSearch);
      return matchClient || matchNum || matchSvc;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Acceptée': return 'green';
      case 'Convertie en facture': return 'green';
      case 'Refusée': return 'red';
      default: return 'orange';
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isClient ? 'Mes Devis & Proformas' : 'Devis & Proformas Officielles'}</h2>
          <p>
            {isClient
              ? 'Consultez les devis et propositions personnalisées qui vous sont transmis.'
              : 'Éditez, chiffrez et suivez vos propositions commerciales en $ USD et Gourdes HTG.'}
          </p>
        </div>
        <div className="actions">
          {!isChauffeur && (
            <button type="button" className="primary" onClick={() => onOpenModal('proforma')}>
              {isClient ? '+ Demander un Devis' : '+ Nouvelle Proforma'}
            </button>
          )}
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par numéro, client ou prestation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="Acceptée">Acceptée</option>
            <option value="Convertie en facture">Convertie en facture</option>
            <option value="Refusée">Refusée</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Prestation / Objet</th>
                <th>Date d'émission</th>
                <th>Montant HT</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucune proforma enregistrée.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.number}</strong></td>
                    <td><strong>{p.client}</strong></td>
                    <td>{p.service || 'Mise à disposition avec chauffeur'}</td>
                    <td>{p.date}</td>
                    <td>${p.amount.toLocaleString()} {p.currency || 'USD'}</td>
                    <td>
                      <strong style={{ color: '#082b70' }}>
                        ${(p.totalTTC || p.amount).toLocaleString()} {p.currency || 'USD'}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="tiny"
                          onClick={() => setPrintSheetData({ type: 'proforma', data: p })}
                          title="Imprimer / Télécharger PDF officiel"
                        >
                          🖨️ Imprimer
                        </button>
                        {p.status !== 'Convertie en facture' && (
                          <button
                            type="button"
                            className="tiny edit"
                            onClick={() => convertProformaToFacture(p)}
                            title="Transformer en facture officielle"
                          >
                            💳 Facturer
                          </button>
                        )}
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('proforma', p)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm(`Supprimer la proforma ${p.number} ?`)) {
                              deleteProforma(p.id);
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
