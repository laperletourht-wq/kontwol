import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RowActionMenu, ActionMenuItem } from '../common/RowActionMenu';

interface ChauffeursViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ChauffeursView: React.FC<ChauffeursViewProps> = ({ onOpenModal }) => {
  const { chauffeurs, deleteChauffeur, globalSearchQuery } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');

  const effectiveSearch = globalSearchQuery.toLowerCase();

  const filtered = chauffeurs.filter((c) => {
    if (statusFilter !== 'ALL' && c.statut !== statusFilter) return false;
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
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#ffffff',
                color: '#1e293b'
              }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="En service">En service</option>
              <option value="En course">En course</option>
              <option value="En repos">En repos</option>
              <option value="Hors service">Hors service</option>
            </select>
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
            <strong>{filtered.length}</strong> conducteur{filtered.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="modern-table-card">
          <div className="modern-table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Conducteur</th>
                  <th>Téléphone</th>
                  <th>Numéro de Permis</th>
                  <th>Véhicule Actuel</th>
                  <th>Zones d'Intervention</th>
                  <th>Évaluation</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      Aucun chauffeur enregistré.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const cleanPhone = c.telephone.replace(/\D/g, '');
                    const actionItems: ActionMenuItem[] = [
                      {
                        label: 'Message WhatsApp',
                        icon: '💬',
                        href: `https://wa.me/${cleanPhone}`,
                        variant: 'primary'
                      },
                      {
                        label: 'Modifier les détails',
                        icon: '✏️',
                        onClick: () => onOpenModal('chauffeur', c)
                      },
                      {
                        label: 'Supprimer',
                        icon: '🗑️',
                        onClick: () => {
                          if (window.confirm(`Supprimer le chauffeur ${c.prenom} ${c.nom} ?`)) {
                            deleteChauffeur(c.id);
                          }
                        },
                        variant: 'danger'
                      }
                    ];

                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px'
                            }}>
                              {(c.prenom || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: '#082b70' }}>{c.prenom} {c.nom}</strong>
                              {c.email && <div style={{ fontSize: '11px', color: '#64748b' }}>{c.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#082b70', fontWeight: 600, textDecoration: 'none' }}>
                            {c.telephone}
                          </a>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f8fafc', padding: '2px 7px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                            {c.permisNumero}
                          </span>
                        </td>
                        <td>{c.vehiculeActuel || <span style={{ color: '#94a3b8' }}>Non assigné</span>}</td>
                        <td>{c.zonesHabituelles || 'Toutes zones'}</td>
                        <td style={{ fontWeight: 600 }}>⭐ {c.noteService || 5.0} / 5</td>
                        <td>
                          <span className={`badge ${getStatusBadge(c.statut)}`}>
                            {c.statut}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <RowActionMenu items={actionItems} title={`Actions pour ${c.prenom} ${c.nom}`} />
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
              <span>Affichage de <strong>{filtered.length}</strong> chauffeur(s)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
