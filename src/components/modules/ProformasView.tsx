import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Proforma } from '../../types';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';

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
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder={isClient ? 'Rechercher par numéro ou prestation...' : 'Rechercher par numéro, client ou prestation...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: '1 1 200px' }}
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ flex: '0 1 160px' }}
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

        {/* 2. TABLE VIEW WITH ELONGATED SPACIOUS ROWS */}
        {viewMode === 'table' && (
          <div className="table-wrap" style={{ marginTop: '16px', overflowX: 'auto' }}>
            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>N° Devis</th>
                  {!isClient && <th style={{ padding: '14px 16px', fontSize: '12px' }}>Client</th>}
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Prestation</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Échéance</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Montant Total (USD / HTG)</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Statut</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isClient ? 7 : 8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      Aucun devis disponible.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr 
                      key={p.id}
                      style={{ 
                        background: '#ffffff', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', 
                        borderRadius: '10px'
                      }}
                    >
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <DocRefBadge reference={p.number} type="proforma" />
                      </td>
                      {!isClient && (
                        <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                          <strong style={{ color: '#0f172a' }}>{p.client}</strong>
                        </td>
                      )}
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle', fontWeight: 600 }}>
                        {p.service || 'Service de transport'}
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>{p.date}</td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>{p.dueDate || '7 jours'}</td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <DualPrice amount={p.totalTTC || p.amount || 0} currency={p.currency || 'USD'} size="sm" />
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <span className={`badge ${getStatusBadge(p.status)}`}>
                          {p.status || 'En attente'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div className="action-cell" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="tiny"
                            style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                            onClick={() => setPrintSheetData({ type: 'proforma', data: p })}
                            title="Aperçu officiel imprimable"
                          >
                            🖨️ PDF
                          </button>

                          {isClient ? (
                            <button
                              type="button"
                              className="tiny"
                              style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}
                              onClick={() => onOpenModal('demande-envoi', { type: 'proforma', doc: p })}
                              title="Recevoir par Email ou WhatsApp"
                            >
                              📨 Envoi
                            </button>
                          ) : (
                            <>
                              {p.status !== 'Convertie en facture' && (
                                <button
                                  type="button"
                                  className="tiny"
                                  style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 600 }}
                                  onClick={() => convertProformaToFacture(p)}
                                  title="Convertir en facture"
                                >
                                  ⚡
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
                                  if (window.confirm(`Supprimer le devis ${p.number} ?`)) {
                                    deleteProforma(p.id);
                                  }
                                }}
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
