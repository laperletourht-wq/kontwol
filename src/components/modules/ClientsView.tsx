import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface ClientsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onOpenModal }) => {
  const { clients, deleteClient, globalSearchQuery } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = clients.filter((c) => {
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
    if (effectiveSearch) {
      return (
        c.name.toLowerCase().includes(effectiveSearch) ||
        (c.telephone && c.telephone.includes(effectiveSearch)) ||
        (c.email && c.email.toLowerCase().includes(effectiveSearch))
      );
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Répertoire Clients & Partenaires</h2>
          <p>Consultez la base des clients particuliers, entreprises, ambassades et écoles partenaires.</p>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => onOpenModal('client')}>
            + Nouveau Client
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="filters">
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">Tous les types de clients</option>
            <option value="Particulier">Particulier</option>
            <option value="Entreprise">Entreprise</option>
            <option value="Ambassade / ONG">Ambassade / ONG</option>
            <option value="École">École / Collège</option>
            <option value="Touriste">Touriste / Diaspora</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nom ou Raison Sociale</th>
                <th>Type de Client</th>
                <th>Téléphone</th>
                <th>E-mail</th>
                <th>Adresse</th>
                <th>Historique Courses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td><span className="badge">{c.type || 'Particulier'}</span></td>
                    <td>{c.telephone}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.address || 'Port-au-Prince'}</td>
                    <td><strong>{c.totalOrders || 0} commande(s)</strong></td>
                    <td>
                      <div className="action-cell">
                        {c.telephone && (
                          <a
                            href={`https://wa.me/${c.telephone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tiny"
                            style={{ textDecoration: 'none' }}
                            title="Contacter sur WhatsApp"
                          >
                            💬 WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          className="tiny edit"
                          onClick={() => onOpenModal('client', c)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tiny delete"
                          onClick={() => {
                            if (window.confirm(`Supprimer le client ${c.name} ?`)) {
                              deleteClient(c.id);
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
