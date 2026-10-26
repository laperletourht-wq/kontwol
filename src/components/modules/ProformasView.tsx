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
    settings,
    requestDocumentSend,
    showToast
  } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleClientRequestInvoice = async (p: Proforma) => {
    try {
      await requestDocumentSend(
        'facture',
        p.number,
        p.totalTTC || p.amount || 0,
        'both',
        `Le client ${p.client} a accepté le devis ${p.number} et demande la facture officielle avec les coordonnées de paiement.`
      );
      showToast(`Votre demande de facture officielle pour le devis ${p.number} a été transmise à la comptabilité !`, 'success');
    } catch {
      showToast('Demande enregistrée avec succès !', 'success');
    }
  };

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

  const totalCount = proformas.length;
  const pendingCount = proformas.filter((p) => p.status === 'En attente' || p.status === 'Brouillon' || !p.status).length;
  const acceptedCount = proformas.filter((p) => p.status === 'Acceptée' || p.status === 'Convertie en facture').length;
  const totalVolumeUSD = proformas.reduce((sum, p) => sum + (p.totalTTC || p.amount || 0), 0);
  const exchangeRate = settings?.tauxChangeUSD_HTG || 132;
  const totalVolumeHTG = Math.round(totalVolumeUSD * exchangeRate);
  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  return (
    <div className="dashboard-container-exact">
      {/* 1. Hero Card matching exact design */}
      <div className="dashboard-hero-card">
        <div className="hero-kicker-row">
          <span className="kicker-sparkle">✨</span>
          <span className="kicker-text">GESTION COMMERCIALE · DEVIS & PROFORMAS</span>
        </div>

        <div className="hero-content-row">
          <div className="hero-text-block">
            <h1 className="hero-title">
              {isClient ? 'Mes Devis & Propositions Commerciales' : 'Devis & Proformas Officielles'}
            </h1>
            <p className="hero-subtitle">
              {isClient
                ? 'Consultez les chiffrages sur mesure préparés par notre équipe commerciale et téléchargez vos devis certifiés.'
                : 'Éditez, chiffrez et convertissez vos propositions commerciales en $ USD et Gourdes HTG avec traçabilité complète.'}
            </p>
          </div>

          <div className="hero-actions-block">
            {!isChauffeur && (
              <button 
                type="button" 
                className="btn-hero-primary" 
                onClick={() => onOpenModal(isClient ? 'demande-devis' : 'proforma')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>{isClient ? 'Demander un Devis' : 'Nouvelle Proforma'}</span>
              </button>
            )}

            <a
              href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour Laperle Tour, je souhaite des informations concernant vos devis et tarifs.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-secondary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <span>Support WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. 4-Card KPI Grid */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: Total Devis */}
        <div className="kpi-card-exact" onClick={() => setStatusFilter('ALL')} title="Afficher tous les devis">
          <div className="kpi-icon-box blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="kpi-header-label">TOTAL PROPOSITIONS</div>
          <div className="kpi-main-number">{totalCount}</div>
          <div className="kpi-sub-text green">↗ {filtered.length} affichée(s)</div>
        </div>

        {/* KPI 2: En attente */}
        <div className="kpi-card-exact" onClick={() => setStatusFilter('En attente')} title="Filtrer les devis en attente">
          <div className="kpi-icon-box amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="kpi-header-label">EN ATTENTE DE VALIDATION</div>
          <div className="kpi-main-number" style={{ color: '#d97706' }}>{pendingCount}</div>
          <div className="kpi-sub-text">Devis en cours d'évaluation</div>
        </div>

        {/* KPI 3: Acceptées / Converties */}
        <div className="kpi-card-exact" onClick={() => setStatusFilter('Acceptée')} title="Filtrer les devis acceptés">
          <div className="kpi-icon-box green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="kpi-header-label">DEVIS ACCEPTÉS</div>
          <div className="kpi-main-number" style={{ color: '#16a34a' }}>{acceptedCount}</div>
          <div className="kpi-sub-text green">Prêts pour conversion</div>
        </div>

        {/* KPI 4: Volume Financier */}
        <div className="kpi-card-exact" title="Volume total des devis">
          <div className="kpi-icon-box emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="kpi-header-label">VOLUME CHIFFRÉ TOTAL</div>
          <div className="kpi-main-number navy" style={{ fontSize: '22px' }}>${totalVolumeUSD.toLocaleString()} USD</div>
          <div className="kpi-sub-text">≈ {totalVolumeHTG.toLocaleString()} HTG</div>
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
                          style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#92400e', fontWeight: 700 }}
                          onClick={() => handleClientRequestInvoice(p)}
                          title="Demander à la comptabilité d'émettre la facture avec coordonnées de paiement MonCash / Virement"
                        >
                          🧾 Demander une Facture & Payer
                        </button>
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('demande-envoi', { type: 'proforma', doc: p })}
                          title="Demander à l'équipe commerciale de vous réadresser ce devis"
                        >
                          📨 Recevoir par Email / WhatsApp
                        </button>
                        <a
                          href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour Laperle Tour, je valide le devis proforma N° ${p.number} ($${p.totalTTC || p.amount} USD) et je souhaite la facture pour effectuer mon règlement.`)}`}
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
                            label: 'Demander Facture & Payer',
                            icon: '🧾',
                            onClick: () => handleClientRequestInvoice(p),
                            variant: 'primary' as const
                          },
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
