import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';

interface VehiculesViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const VehiculesView: React.FC<VehiculesViewProps> = ({ onOpenModal }) => {
  const { vehicules, deleteVehicule, globalSearchQuery } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = vehicules.filter((v) => {
    if (statusFilter !== 'ALL' && v.statut !== statusFilter) return false;
    if (globalSearchQuery) {
      const q = globalSearchQuery.toLowerCase();
      return (
        v.plaque.toLowerCase().includes(q) ||
        v.marque.toLowerCase().includes(q) ||
        v.modele.toLowerCase().includes(q) ||
        v.categorie.toLowerCase().includes(q)
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
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Statut véhicule :</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '180px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="Disponible">Disponible</option>
              <option value="En mission">En mission</option>
              <option value="En maintenance">En maintenance</option>
            </select>
          </div>
        </div>

        <div className="modern-table-card">
          <div className="modern-table-wrap">
            <table className="modern-table">
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
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      Aucun véhicule enregistré.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => {
                    const actionItems: ActionMenuItem[] = [
                      {
                        label: 'Modifier le véhicule',
                        icon: '✏️',
                        onClick: () => onOpenModal('vehicule', v)
                      },
                      {
                        label: 'Supprimer',
                        icon: '🗑️',
                        onClick: () => {
                          if (window.confirm(`Supprimer le véhicule ${v.plaque} ?`)) {
                            deleteVehicule(v.id);
                          }
                        },
                        variant: 'danger' as const
                      }
                    ];

                    return (
                      <tr key={v.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                            {v.plaque}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#082b70' }}>{v.marque} {v.modele}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Année {v.annee} • {v.couleur || 'Standard'}</div>
                        </td>
                        <td><span className="badge">{v.categorie}</span></td>
                        <td style={{ fontWeight: 600 }}>{v.capacitePassagers} passagers</td>
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
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <RowActionMenu items={actionItems} title={`Actions pour ${v.plaque}`} />
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
              <span>Flotte opérationnelle : <strong>{filtered.length}</strong> véhicule(s)</span>
              <span style={{ fontSize: '11px' }}>Inspection et suivi technique à jour</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
