import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';

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
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Type de client :</span>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ minWidth: '180px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="ALL">Tous les types de clients</option>
              <option value="Particulier">Particulier</option>
              <option value="Entreprise">Entreprise</option>
              <option value="Ambassade / ONG">Ambassade / ONG</option>
              <option value="École">École / Collège</option>
              <option value="Touriste">Touriste / Diaspora</option>
            </select>
          </div>
        </div>

        <div className="modern-table-card">
          <div className="modern-table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nom ou Raison Sociale</th>
                  <th>Type</th>
                  <th>Téléphone</th>
                  <th>E-mail</th>
                  <th>Adresse</th>
                  <th>Historique</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      Aucun client trouvé.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const actionItems: ActionMenuItem[] = [
                      ...(c.telephone ? [{
                        label: 'Contacter sur WhatsApp',
                        icon: '💬',
                        href: `https://wa.me/${c.telephone.replace(/\D/g, '')}`,
                        variant: 'success' as const
                      }] : []),
                      {
                        label: 'Modifier la fiche',
                        icon: '✏️',
                        onClick: () => onOpenModal('client', c)
                      },
                      {
                        label: 'Supprimer',
                        icon: '🗑️',
                        onClick: () => {
                          if (window.confirm(`Supprimer le client ${c.name} ?`)) {
                            deleteClient(c.id);
                          }
                        },
                        variant: 'danger' as const
                      }
                    ];

                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#082b70', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                          </div>
                        </td>
                        <td><span className="badge">{c.type || 'Particulier'}</span></td>
                        <td>{c.telephone}</td>
                        <td>{c.email || '-'}</td>
                        <td>{c.address || 'Port-au-Prince'}</td>
                        <td><strong>{c.totalOrders || 0} commande(s)</strong></td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <RowActionMenu items={actionItems} title={`Actions pour ${c.name}`} />
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
              <span>Affichage de <strong>{filtered.length}</strong> client(s)</span>
              <span style={{ fontSize: '11px' }}>Base clients synchronisée</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
