import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { RowActionMenu, ActionMenuItem } from '../common/RowActionMenu';

interface PlanningsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const PlanningsView: React.FC<PlanningsViewProps> = ({ onOpenModal }) => {
  const { plannings, deletePlanning, savePlanning, globalSearchQuery } = useApp();
  const { role } = useAuth();
  const isChauffeur = role === 'chauffeur';
  const isClient = role === 'client' || role === 'prospect';
  const canDispatch = !isChauffeur && !isClient;
  const [statusFilter, setStatusFilter] = useState('ALL');

  const effectiveSearch = globalSearchQuery.toLowerCase();

  const filtered = plannings.filter((p) => {
    if (statusFilter !== 'ALL' && p.statut !== statusFilter) return false;
    if (effectiveSearch) {
      return (
        p.client.toLowerCase().includes(effectiveSearch) ||
        p.chauffeur.toLowerCase().includes(effectiveSearch) ||
        p.vehicule.toLowerCase().includes(effectiveSearch) ||
        p.destination.toLowerCase().includes(effectiveSearch)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isChauffeur ? 'Ma Feuille de Route & Missions Dispatchées' : 'Planning des Départs & Dispatch Flotte'}</h2>
          <p>
            {isChauffeur
              ? 'Consultez vos départs, passagers et itinéraires qui vous sont expressément confiés.'
              : 'Organisez les missions, assignez chauffeurs et véhicules, et prévenez les conflits d\'horaires.'}
          </p>
        </div>
        <div className="actions">
          {canDispatch && (
            <button type="button" className="primary" onClick={() => onOpenModal('planning')}>
              + Programmer un Trajet
            </button>
          )}
        </div>
      </div>

      <div className="data-panel">
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Statut :</span>
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
              <option value="Programmé">Programmé</option>
              <option value="En cours">En cours</option>
              <option value="Achevé">Achevé</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
            <strong>{filtered.length}</strong> trajet{filtered.length > 1 ? 's' : ''} programmé{filtered.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="modern-table-card">
          <div className="modern-table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Client / Mission</th>
                  <th>Prestation</th>
                  <th>Itinéraire</th>
                  <th>Passagers</th>
                  <th>Conducteur</th>
                  <th>Véhicule</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      Aucun planning programmé.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const actionItems: ActionMenuItem[] = [];

                    if (p.statut === 'Programmé') {
                      actionItems.push({
                        label: 'Démarrer la mission',
                        icon: '▶️',
                        onClick: () => savePlanning({ ...p, statut: 'En cours' }),
                        variant: 'primary'
                      });
                    }

                    if (p.statut === 'En cours') {
                      actionItems.push({
                        label: 'Achever la mission',
                        icon: '✅',
                        onClick: () => savePlanning({ ...p, statut: 'Achevé' }),
                        variant: 'success'
                      });
                    }

                    if (canDispatch) {
                      actionItems.push({
                        label: 'Modifier le trajet',
                        icon: '✏️',
                        onClick: () => onOpenModal('planning', p)
                      });
                      actionItems.push({
                        label: 'Supprimer',
                        icon: '🗑️',
                        onClick: () => {
                          if (window.confirm('Supprimer ce planning de trajet ?')) {
                            deletePlanning(p.id);
                          }
                        },
                        variant: 'danger'
                      });
                    }

                    return (
                      <tr key={p.id}>
                        <td>
                          <strong style={{ color: '#082b70', fontSize: '13.5px' }}>{p.heure}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{p.date}</div>
                        </td>
                        <td><strong style={{ color: '#0f172a' }}>{p.client}</strong></td>
                        <td><span className="badge">{p.service}</span></td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            <span>📍 {p.depart}</span>
                            <span style={{ color: '#f7941d', margin: '0 4px', fontWeight: 700 }}>➔</span>
                            <span>🎯 {p.destination}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.passagers} pers.</td>
                        <td><strong>{p.chauffeur}</strong></td>
                        <td>{p.vehicule}</td>
                        <td>
                          <span className={`badge ${p.statut === 'En cours' ? 'orange' : p.statut === 'Achevé' ? 'green' : ''}`}>
                            {p.statut}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <RowActionMenu items={actionItems} title={`Actions pour le trajet de ${p.client}`} />
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
              <span>Affichage de <strong>{filtered.length}</strong> mission(s)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
