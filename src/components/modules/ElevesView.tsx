import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RowActionMenu, ActionMenuItem } from '../common/RowActionMenu';

interface ElevesViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ElevesView: React.FC<ElevesViewProps> = ({ onOpenModal }) => {
  const { eleves, deleteEleve, globalSearchQuery, generateEleveAbonnementEtFacture } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');

  const effectiveSearch = globalSearchQuery.toLowerCase();

  const filtered = eleves.filter((e) => {
    if (statusFilter !== 'ALL' && e.statut !== statusFilter) return false;
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
              <option value="ALL">Tous les élèves</option>
              <option value="Actif">Actif</option>
              <option value="En attente">En attente</option>
              <option value="Inactif">Inactif</option>
            </select>
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
            <strong>{filtered.length}</strong> élève{filtered.length > 1 ? 's' : ''} inscrit{filtered.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="modern-table-card">
          <div className="modern-table-wrap">
            <table className="modern-table">
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
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      Aucun élève enregistré.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => {
                    const cleanPhone = (e.parentTelephone || '').replace(/\D/g, '');
                    const actionItems: ActionMenuItem[] = [
                      {
                        label: 'Abonner & Facturer',
                        icon: '🎫',
                        onClick: () => generateEleveAbonnementEtFacture(e),
                        variant: 'primary'
                      },
                      ...(cleanPhone ? [{
                        label: 'WhatsApp Parent',
                        icon: '💬',
                        href: `https://wa.me/${cleanPhone}`,
                        variant: 'success' as const
                      }] : []),
                      {
                        label: 'Modifier les détails',
                        icon: '✏️',
                        onClick: () => onOpenModal('eleve', e)
                      },
                      {
                        label: 'Supprimer',
                        icon: '🗑️',
                        onClick: () => {
                          if (window.confirm(`Supprimer l'élève ${e.prenom} ${e.nom} ?`)) {
                            deleteEleve(e.id);
                          }
                        },
                        variant: 'danger'
                      }
                    ];

                    return (
                      <tr key={e.id}>
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
                              {(e.prenom || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: '#082b70' }}>{e.prenom} {e.nom}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{e.ecole}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Classe : {e.classe || '-'}</div>
                        </td>
                        <td>📍 {e.arretRamassage}</td>
                        <td style={{ fontWeight: 600 }}>{e.parentNom}</td>
                        <td>
                          {cleanPhone ? (
                            <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#082b70', fontWeight: 600, textDecoration: 'none' }}>
                              {e.parentTelephone}
                            </a>
                          ) : (
                            e.parentTelephone || '-'
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{e.chauffeurAssigne || 'Samuel Joseph'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{e.vehiculeAssigne || 'Coaster SC-10522'}</div>
                        </td>
                        <td><strong style={{ color: '#082b70' }}>${e.fraisMensuel || 150} USD</strong></td>
                        <td>
                          <span className={`badge ${e.statut === 'Actif' ? 'green' : 'orange'}`}>
                            {e.statut}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <RowActionMenu items={actionItems} title={`Actions pour ${e.prenom} ${e.nom}`} />
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
              <span>Affichage de <strong>{filtered.length}</strong> élève(s)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
