import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Proforma } from '../../types';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';

interface ProformasViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ProformasView: React.FC<ProformasViewProps> = ({ onOpenModal }) => {
  const { 
    proformas, 
    deleteProforma, 
    convertProformaToFacture, 
    setPrintSheetData, 
    globalSearchQuery, 
    settings 
  } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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

  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isClient ? 'Mes Devis & Propositions Commerciales' : 'Devis & Proformas Officielles'}</h2>
          <p>
            {isClient
              ? 'Consultez les chiffrages sur mesure préparés par notre équipe commerciale et téléchargez vos devis officiels.'
              : 'Éditez, chiffrez et convertissez vos propositions commerciales en $ USD et Gourdes HTG.'}
          </p>
        </div>
        <div className="actions">
          {!isChauffeur && (
            <button 
              type="button" 
              className="primary" 
              onClick={() => onOpenModal(isClient ? 'demande-devis' : 'proforma')}
            >
              {isClient ? '+ Demander un Devis' : '+ Nouvelle Proforma'}
            </button>
          )}
        </div>
      </div>

      <div className="data-panel">
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Filtrer par statut :</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '160px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b' }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Acceptée">Acceptée</option>
              <option value="Convertie en facture">Convertie en facture</option>
              <option value="Refusée">Refusée</option>
            </select>
          </div>

          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`btn-view-mode ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Affichage en fiches complètes sans troncature"
            >
              <span>📋</span>
              <span>Vue Détaillée (Cartes)</span>
            </button>
            <button
              type="button"
              className={`btn-view-mode ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Affichage en tableau aux lignes allongées"
            >
              <span>📊</span>
              <span>Tableau Allongé</span>
            </button>
          </div>
        </div>

        {/* 1. DETAILED CARDS VIEW */}
        {viewMode === 'cards' && (
          <div className="cards-grid-flow" style={{ marginTop: '16px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Aucun devis disponible</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  {isClient 
                    ? 'Aucun devis en attente. Utilisez le bouton "+ Demander un Devis" pour obtenir une estimation personnalisée.' 
                    : 'Modifiez vos filtres pour afficher les devis proformas.'}
                </div>
              </div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="item-detail-card">
                  <div className="item-detail-card-head">
                    <div className="card-id-cluster" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DocRefBadge reference={p.number} type="proforma" />
                      <span className={`badge ${getStatusBadge(p.status)}`}>
                        {p.status || 'En attente'}
                      </span>
                      <span className="card-service-title">{p.service || 'Prestation VIP'}</span>
                    </div>
                    <div className="card-price-badge">
                      <DualPrice amount={p.totalTTC || p.amount || 0} currency={p.currency || 'USD'} size="sm" />
                    </div>
                  </div>

                  <div className="item-detail-card-meta">
                    <span className="meta-chip">
                      <span>📅</span>
                      <span>Émis le : <strong>{p.date}</strong></span>
                    </span>
                    <span className="meta-chip">
                      <span>⏳</span>
                      <span>Validité : <strong>{p.dueDate || '7 jours'}</strong></span>
                    </span>
                    {!isClient && (
                      <span className="meta-chip">
                        <span>👤</span>
                        <span>Client : <strong>{p.client}</strong></span>
                        {p.telephone && <span style={{ color: '#64748b' }}>({p.telephone})</span>}
                      </span>
                    )}
                  </div>

                  {p.notes && (
                    <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', margin: '8px 0' }}>
                      📝 <em>{p.notes}</em>
                    </div>
                  )}

                  <div className="item-detail-card-actions">
                    <button
                      type="button"
                      className="btn-card-action"
                      onClick={() => setPrintSheetData({ type: 'proforma', data: p })}
                      title="Imprimer ou télécharger le devis officiel"
                    >
                      🖨️ Aperçu PDF / Imprimer
                    </button>

                    {isClient ? (
                      <>
                        <button
                          type="button"
                          className="btn-card-action primary-subtle"
                          onClick={() => onOpenModal('demande-envoi', { type: 'proforma', doc: p })}
                          title="Demander à l'équipe commerciale de vous réadresser ce devis"
                        >
                          📨 Recevoir par Email / WhatsApp
                        </button>
                        <a
                          href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour Laperle Tour, je valide le devis proforma N° ${p.number} d'un montant de $${p.totalTTC || p.amount} USD.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-card-action success-subtle"
                          style={{ textDecoration: 'none' }}
                        >
                          💬 Confirmer sur WhatsApp
                        </a>
                      </>
                    ) : (
                      <>
                        {p.status !== 'Convertie en facture' && (
                          <button
                            type="button"
                            className="btn-card-action success-subtle"
                            onClick={() => convertProformaToFacture(p)}
                            title="Transformer ce devis en facture finale"
                          >
                            ⚡ Convertir en Facture
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('proforma', p)}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          type="button"
                          className="btn-card-action"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            if (window.confirm(`Supprimer la proforma ${p.number} ?`)) {
                              deleteProforma(p.id);
                            }
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. TABLE VIEW (Modern Airy Table with 3-dot Action Menu) */}
        {viewMode === 'table' && (
          <div className="modern-table-card">
            <div className="modern-table-wrap">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>N° Devis</th>
                    {!isClient && <th>Client</th>}
                    <th>Prestation</th>
                    <th>Date</th>
                    <th>Échéance</th>
                    <th>Montant Total (USD / HTG)</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={isClient ? 7 : 8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                        Aucun devis disponible.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const actionItems: ActionMenuItem[] = [
                        {
                          label: 'Aperçu officiel (PDF)',
                          icon: '🖨️',
                          onClick: () => setPrintSheetData({ type: 'proforma', data: p }),
                          variant: 'primary'
                        },
                        ...(isClient ? [
                          {
                            label: 'Recevoir par Email / WhatsApp',
                            icon: '📨',
                            onClick: () => onOpenModal('demande-envoi', { type: 'proforma', doc: p })
                          }
                        ] : [
                          ...(p.status !== 'Convertie en facture' ? [{
                            label: 'Convertir en Facture',
                            icon: '⚡',
                            onClick: () => convertProformaToFacture(p),
                            variant: 'success' as const
                          }] : []),
                          {
                            label: 'Modifier le devis',
                            icon: '✏️',
                            onClick: () => onOpenModal('proforma', p)
                          },
                          {
                            label: 'Supprimer',
                            icon: '🗑️',
                            onClick: () => {
                              if (window.confirm(`Supprimer le devis ${p.number} ?`)) {
                                deleteProforma(p.id);
                              }
                            },
                            variant: 'danger' as const
                          }
                        ])
                      ];

                      return (
                        <tr key={p.id}>
                          <td>
                            <DocRefBadge reference={p.number} type="proforma" />
                          </td>
                          {!isClient && (
                            <td>
                              <strong style={{ color: '#0f172a' }}>{p.client}</strong>
                            </td>
                          )}
                          <td style={{ fontWeight: 600 }}>
                            {p.service || 'Service de transport'}
                          </td>
                          <td>{p.date}</td>
                          <td>{p.dueDate || '7 jours'}</td>
                          <td>
                            <DualPrice amount={p.totalTTC || p.amount || 0} currency={p.currency || 'USD'} size="sm" />
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(p.status)}`}>
                              {p.status || 'En attente'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                            <RowActionMenu items={actionItems} title={`Actions pour ${p.number}`} />
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
                <span>Affichage de <strong>{filtered.length}</strong> devis proforma(s)</span>
                <span style={{ fontSize: '11px' }}>Montants en USD et HTG certifiés</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
