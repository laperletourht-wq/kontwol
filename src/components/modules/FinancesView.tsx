import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';

export const FinancesView: React.FC = () => {
  const { paiements, factures, settings, showToast, setPrintSheetData, globalSearchQuery } = useApp();
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Compute total validated revenues
  const totalUSD = paiements
    .filter((p) => p.devise === 'USD' && p.statut === 'Validé')
    .reduce((sum, p) => sum + p.montant, 0);

  const totalHTG = paiements
    .filter((p) => p.devise === 'HTG' && p.statut === 'Validé')
    .reduce((sum, p) => sum + p.montant, 0);

  // Invoiced amounts pending collection
  const pendingInvoicedUSD = factures
    .filter((f) => f.status !== 'Payée')
    .reduce((sum, f) => sum + (f.totalTTC || f.amount || 0), 0);

  const exchangeRate = settings?.tauxChangeUSD_HTG || 132;
  const pendingInvoicedHTG = Math.round(pendingInvoicedUSD * exchangeRate);

  // Estimated operational expenses (fuel, maintenance, salaries ~35%)
  const estimatedExpensesUSD = Math.round(totalUSD * 0.35);
  const netProfitUSD = totalUSD - estimatedExpensesUSD;
  const recoveryRate = factures.length > 0 
    ? Math.round((factures.filter(f => f.status === 'Payée').length / factures.length) * 100) 
    : 100;

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filteredPaiements = paiements.filter((p) => {
    if (filterMode !== 'ALL' && p.modePaiement !== filterMode && p.statut !== filterMode) return false;
    if (effectiveSearch) {
      const matchClient = p.client?.toLowerCase().includes(effectiveSearch);
      const matchRef = p.reference?.toLowerCase().includes(effectiveSearch);
      const matchMotif = p.motif?.toLowerCase().includes(effectiveSearch);
      return matchClient || matchRef || matchMotif;
    }
    return true;
  });

  const handleExportCSV = () => {
    let csv = 'Reference,Date,Client,Montant,Devise,Mode,Statut,Motif\n';
    paiements.forEach((p) => {
      csv += `"${p.reference}","${p.date}","${p.client}",${p.montant},"${p.devise}","${p.modePaiement}","${p.statut}","${p.motif || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rapport_Financier_Laperle_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export CSV certifié généré avec succès !', 'success');
  };

  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  return (
    <div className="dashboard-container-exact">
      {/* 1. Hero Card matching exact design */}
      <div className="dashboard-hero-card">
        <div className="hero-kicker-row">
          <span className="kicker-sparkle">✨</span>
          <span className="kicker-text">ANALYSE FINANCIÈRE & TRÉSORERIE · LAPERLE TOUR HT</span>
        </div>

        <div className="hero-content-row">
          <div className="hero-text-block">
            <h1 className="hero-title">Trésorerie & Comptabilité Analytique</h1>
            <p className="hero-subtitle">
              Bilan consolidé des flux de trésorerie, encaissements certifiés USD et HTG (MonCash, virements), créances clients et résultat net d'exploitation.
            </p>
          </div>

          <div className="hero-actions-block">
            <button type="button" className="btn-hero-primary" onClick={handleExportCSV}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Exporter Rapport CSV</span>
            </button>

            <a
              href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour Direction Financière Laperle Tour, je sollicite un point sur la trésorerie et les encaissements.')}`}
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

      {/* 3. Synthèse des Flux Financiers */}
      <div className="data-panel" style={{ marginBottom: '20px' }}>
        {/* Bandeau de synthèse compact 1-ligne (Option A - Style Ruban Excel) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '8px 14px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#082b70', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>📊</span> Synthèse Trésorerie :
            </span>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e3a8a'
              }}
              title="Recettes encaissées en USD"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }} />
              <span>Recettes USD : <strong>${totalUSD.toLocaleString()}</strong></span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#15803d'
              }}
              title="Recettes encaissées en HTG"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
              <span>Recettes HTG : <strong>{totalHTG.toLocaleString()} HTG</strong></span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid #fed7aa',
                background: '#fffaf5',
                color: '#c2410c'
              }}
              title="Créances clients à recouvrer"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f97316' }} />
              <span>Créances à recouvrer : <strong>${pendingInvoicedUSD.toLocaleString()} USD</strong></span>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '6px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <span>📈 Résultat Net Estimé :</span>
            <span style={{ fontSize: '13px', fontWeight: 800 }}>${netProfitUSD.toLocaleString()} USD</span>
          </div>
        </div>
        <h3 style={{ margin: '0 0 16px', color: '#082b70', fontSize: '15px', fontWeight: 800 }}>
          📊 Indicateurs Stratégiques & Taux de Change
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Taux de change appliqué :</span>
            <div style={{ fontSize: '19px', fontWeight: 850, color: '#082b70', margin: '6px 0' }}>
              1 USD = {exchangeRate} HTG
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Calculs et conversions automatiques pour tous les règlements en Gourdes haïtiennes.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Dépenses opérationnelles estimées (~35%) :</span>
            <div style={{ fontSize: '19px', fontWeight: 850, color: '#dc2626', margin: '6px 0' }}>
              ${estimatedExpensesUSD.toLocaleString()} USD
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Carburant, entretien périodique des véhicules et indemnités chauffeurs VIP.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Taux de Recouvrement Global :</span>
            <div style={{ fontSize: '19px', fontWeight: 850, color: '#15803d', margin: '6px 0' }}>
              {recoveryRate}%
            </div>
            <p style={{ fontSize: '12px', color: '#166534', margin: 0, lineHeight: 1.4 }}>
              Factures honorées sans contentieux ni incident de paiement.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Journal de Trésorerie & Encaissements */}
      <div className="data-panel">
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Mode / Statut :</span>
            <select 
              value={filterMode} 
              onChange={(e) => setFilterMode(e.target.value)}
              style={{ minWidth: '160px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b' }}
            >
              <option value="ALL">Tous les règlements</option>
              <option value="MonCash">MonCash</option>
              <option value="Natcash">Natcash</option>
              <option value="Virement Bancaire">Virement Bancaire</option>
              <option value="Espèces">Espèces</option>
              <option value="Validé">Statut : Validé</option>
              <option value="En attente">Statut : En attente</option>
            </select>
          </div>

          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`btn-view-mode ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Affichage en fiches dépliées"
            >
              <span>📋</span>
              <span>Vue Cartes</span>
            </button>
            <button
              type="button"
              className={`btn-view-mode ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Affichage en tableau complet"
            >
              <span>📊</span>
              <span>Tableau Allongé</span>
            </button>
          </div>
        </div>

        {/* CARDS VIEW */}
        {viewMode === 'cards' && (
          <div className="cards-grid-flow" style={{ marginTop: '16px' }}>
            {filteredPaiements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Aucun flux enregistré</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Modifiez vos filtres de recherche.</div>
              </div>
            ) : (
              filteredPaiements.map((p) => (
                <div key={p.id} className="item-detail-card">
                  <div className="item-detail-card-head">
                    <div className="card-id-cluster" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DocRefBadge reference={p.reference} type="paiement" />
                      <span className={`badge ${p.statut === 'Validé' ? 'green' : 'orange'}`}>
                        {p.statut}
                      </span>
                      <strong style={{ color: '#0f172a', fontSize: '14px' }}>{p.client}</strong>
                    </div>
                    <div className="card-price-badge">
                      <DualPrice amount={p.montant} currency={p.devise} size="md" />
                    </div>
                  </div>

                  <div className="item-detail-card-meta">
                    <span className="meta-chip">📅 Date : <strong>{p.date}</strong></span>
                    <span className="meta-chip">💳 Mode : <strong>{p.modePaiement}</strong></span>
                    {p.motif && <span className="meta-chip">📝 Motif : <strong>{p.motif}</strong></span>}
                    {p.factureAssociee && (
                      <span className="meta-chip">
                        🧾 Facture liée : <DocRefBadge reference={p.factureAssociee} type="facture" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === 'table' && (
          <div style={{ marginTop: '16px', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>RÉFÉRENCE</th>
                    <th>CLIENT</th>
                    <th>DATE</th>
                    <th>MODE DE RÈGLEMENT</th>
                    <th>MONTANT CERTIFIÉ</th>
                    <th>STATUT</th>
                    <th>FACTURE LIÉE</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaiements.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Aucun flux de trésorerie trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredPaiements.map((p) => {
                      const actionItems: ActionMenuItem[] = [
                        {
                          label: 'Imprimer le Reçu',
                          icon: '🖨️',
                          onClick: () => {
                            if (setPrintSheetData) {
                              setPrintSheetData({
                                type: 'paiement',
                                data: p,
                                title: `Bordereau de Règlement ${p.reference}`
                              });
                            }
                          }
                        },
                        {
                          label: 'WhatsApp Trésorerie',
                          icon: '💬',
                          onClick: () => {
                            const text = encodeURIComponent(
                              `Bonjour ${p.client}, nous confirmons la bonne réception de votre règlement de ${p.montant} ${p.devise} (Réf : ${p.reference}). Merci !`
                            );
                            window.open(`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${text}`, '_blank');
                          }
                        }
                      ];

                      return (
                        <tr key={p.id}>
                          <td>
                            <DocRefBadge reference={p.reference} type="paiement" />
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{p.client}</strong>
                          </td>
                          <td>{p.date}</td>
                          <td>
                            <span style={{ 
                              background: '#f1f5f9', 
                              padding: '3px 8px', 
                              borderRadius: '6px', 
                              fontSize: '11.5px', 
                              fontWeight: 650, 
                              color: '#334155' 
                            }}>
                              {p.modePaiement}
                            </span>
                          </td>
                          <td>
                            <DualPrice amount={p.montant} currency={p.devise} size="sm" />
                          </td>
                          <td>
                            <span className={`badge ${p.statut === 'Validé' ? 'green' : 'orange'}`}>
                              {p.statut}
                            </span>
                          </td>
                          <td>
                            {p.factureAssociee ? (
                              <DocRefBadge reference={p.factureAssociee} type="facture" />
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                            <RowActionMenu items={actionItems} title={`Actions pour ${p.reference}`} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredPaiements.length > 0 && (
              <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Affichage de <strong>{filteredPaiements.length}</strong> ligne(s) d'encaissement</span>
                <span style={{ fontSize: '11px' }}>Double devise USD / HTG certifiée</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
