import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { PaymentProofModal } from '../modals/PaymentProofModal';

interface PaiementsViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const PaiementsView: React.FC<PaiementsViewProps> = ({ onOpenModal }) => {
  const { paiements, deletePaiement, setPrintSheetData, globalSearchQuery } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';
  const canManagePayments = !isClient && !isChauffeur;

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [zoomedProofImage, setZoomedProofImage] = useState<string | null>(null);

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = paiements.filter((p) => {
    if (effectiveSearch) {
      return (
        p.reference?.toLowerCase().includes(effectiveSearch) ||
        p.client?.toLowerCase().includes(effectiveSearch) ||
        p.modePaiement?.toLowerCase().includes(effectiveSearch) ||
        (p.factureAssociee && p.factureAssociee.toLowerCase().includes(effectiveSearch)) ||
        (p.referenceTransaction && p.referenceTransaction.toLowerCase().includes(effectiveSearch))
      );
    }
    return true;
  });

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isClient ? 'Mes Règlements & Reçus de Caisse' : 'Caisse & Enregistrement des Paiements'}</h2>
          <p>
            {isClient
              ? 'Consultez l\'historique de vos versements (MonCash, virements bancaires, chèques) et téléversez vos justificatifs.'
              : 'Supervision de la trésorerie : validation des règlements MonCash, virements et chèques certifiés.'}
          </p>
        </div>
        <div className="actions">
          {!isChauffeur && (
            <button 
              type="button" 
              className="primary" 
              onClick={() => setProofModalOpen(true)}
            >
              + {isClient ? 'Transmettre une Preuve' : 'Encaisser un Règlement'}
            </button>
          )}
        </div>
      </div>

      <div className="data-panel">
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Rechercher par référence, client, mode ou bordereau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: '1 1 240px' }}
            />
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
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Aucun règlement enregistré</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  {isClient 
                    ? 'Aucun paiement n\'est enregistré pour le moment. Cliquez sur "+ Transmettre une Preuve" pour envoyer votre bordereau MonCash ou bancaire.' 
                    : 'Modifiez vos filtres pour afficher les encaissements.'}
                </div>
              </div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="item-detail-card">
                  <div className="item-detail-card-head">
                    <div className="card-id-cluster" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DocRefBadge reference={p.reference || p.id} type="paiement" />
                      {p.factureAssociee && (
                        <DocRefBadge reference={p.factureAssociee} type="facture" label={`Facture ${p.factureAssociee}`} />
                      )}
                      <span className={`badge ${p.statut === 'Validé' ? 'green' : 'orange'}`}>
                        {p.statut || 'En attente'}
                      </span>
                      {p.preuveImage && (
                        <button
                          type="button"
                          onClick={() => setZoomedProofImage(p.preuveImage || null)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          <span>📎 Preuve Photo</span>
                        </button>
                      )}
                    </div>

                    <div className="card-price-badge">
                      <DualPrice amount={p.montant} currency={p.devise || 'USD'} size="sm" />
                    </div>
                  </div>

                  <div className="item-detail-card-meta">
                    <span className="meta-chip">
                      <span>📅</span>
                      <span>Date : <strong>{p.date}</strong></span>
                    </span>
                    <span className="meta-chip">
                      <span>💳</span>
                      <span>Moyen : <strong>{p.modePaiement}</strong></span>
                    </span>
                    {p.referenceTransaction && (
                      <span className="meta-chip">
                        <span>🏷️</span>
                        <span>Réf. Transaction : <strong className="font-mono text-purple-800">{p.referenceTransaction}</strong></span>
                      </span>
                    )}
                    <span className="meta-chip">
                      <span>👤</span>
                      <span>Client : <strong>{p.client}</strong></span>
                    </span>
                    {p.recuPar && (
                      <span className="meta-chip">
                        <span>🏛️</span>
                        <span>Encaissé par : <strong>{p.recuPar}</strong></span>
                      </span>
                    )}
                  </div>

                  {p.motif && (
                    <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', margin: '8px 0' }}>
                      ℹ️ <em>{p.motif}</em>
                    </div>
                  )}

                  <div className="item-detail-card-actions">
                    <button
                      type="button"
                      className="btn-card-action"
                      onClick={() => setPrintSheetData({
                        type: 'paiement',
                        data: {
                          ...p,
                          number: p.reference,
                          amount: p.montant,
                          currency: p.devise,
                          service: p.motif || `Règlement par ${p.modePaiement}`
                        }
                      })}
                      title="Afficher et imprimer le reçu officiel de paiement"
                    >
                      🖨️ Reçu Officiel PDF
                    </button>

                    {p.preuveImage && (
                      <button
                        type="button"
                        className="btn-card-action success-subtle"
                        onClick={() => setZoomedProofImage(p.preuveImage || null)}
                      >
                        🖼️ Agrandir Preuve Photo
                      </button>
                    )}

                    {canManagePayments && (
                      <>
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('paiement', p)}
                          title="Modifier"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          type="button"
                          className="btn-card-action"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            if (window.confirm(`Supprimer le paiement ${p.reference} ?`)) {
                              deletePaiement(p.id);
                            }
                          }}
                          title="Supprimer"
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
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Réf. Paiement</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Client</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Montant (USD / HTG)</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Moyen & Bordereau</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Facture Liée</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Statut</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      Aucun encaissement enregistré.
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
                        <DocRefBadge reference={p.reference || p.id} type="paiement" />
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>{p.date}</td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#0f172a' }}>{p.client}</strong>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <DualPrice amount={p.montant} currency={p.devise || 'USD'} size="sm" />
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <span className="badge">{p.modePaiement}</span>
                        {p.referenceTransaction && (
                          <div style={{ fontSize: '10.5px', color: '#7e22ce', fontFamily: 'monospace', marginTop: '3px' }}>
                            {p.referenceTransaction}
                          </div>
                        )}
                        {p.preuveImage && (
                          <button
                            type="button"
                            onClick={() => setZoomedProofImage(p.preuveImage || null)}
                            className="inline-block mt-1 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                          >
                            📎 Photo
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        {p.factureAssociee ? (
                          <DocRefBadge reference={p.factureAssociee} type="facture" />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <span className={`badge ${p.statut === 'Validé' ? 'green' : 'orange'}`}>
                          {p.statut}
                        </span>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div className="action-cell" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="tiny"
                            style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                            onClick={() => setPrintSheetData({
                              type: 'paiement',
                              data: {
                                ...p,
                                number: p.reference,
                                amount: p.montant,
                                currency: p.devise,
                                service: p.motif || `Règlement par ${p.modePaiement}`
                              }
                            })}
                            title="Aperçu officiel imprimable"
                          >
                            🖨️ Reçu
                          </button>

                          {canManagePayments && (
                            <>
                              <button
                                type="button"
                                className="tiny edit"
                                onClick={() => onOpenModal('paiement', p)}
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="tiny delete"
                                onClick={() => {
                                  if (window.confirm(`Supprimer le paiement ${p.reference} ?`)) {
                                    deletePaiement(p.id);
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

      {/* Payment Proof Submission Modal */}
      {proofModalOpen && (
        <PaymentProofModal
          onClose={() => setProofModalOpen(false)}
          onSuccess={() => setProofModalOpen(false)}
        />
      )}

      {/* Proof Image Zoom Modal */}
      {zoomedProofImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomedProofImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl p-2 overflow-hidden shadow-2xl">
            <button
              type="button"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 text-white font-bold flex items-center justify-center hover:bg-slate-900"
              onClick={() => setZoomedProofImage(null)}
            >
              ✕
            </button>
            <img 
              src={zoomedProofImage} 
              alt="Bordereau de paiement" 
              className="max-h-[80vh] w-auto object-contain mx-auto rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};
