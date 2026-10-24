import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Facture } from '../../types';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { PaymentProofModal } from '../modals/PaymentProofModal';

interface FacturesViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const FacturesView: React.FC<FacturesViewProps> = ({ onOpenModal }) => {
  const { 
    factures, 
    deleteFacture, 
    setPrintSheetData, 
    globalSearchQuery,
    convertFactureToPaiement,
    settings
  } = useApp();
  const { role } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [proofFacture, setProofFacture] = useState<Facture | null>(null);
  const [zoomedProofImage, setZoomedProofImage] = useState<string | null>(null);

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = factures.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (effectiveSearch) {
      const matchClient = f.client?.toLowerCase().includes(effectiveSearch);
      const matchNum = f.number?.toLowerCase().includes(effectiveSearch);
      const matchProf = f.proformaNumber?.toLowerCase().includes(effectiveSearch);
      return matchClient || matchNum || matchProf;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Payée': return 'green';
      case 'En retard': return 'red';
      case 'Partiellement payée': return 'orange';
      default: return 'orange';
    }
  };

  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  const sendWhatsAppReminder = (f: Facture) => {
    const text = encodeURIComponent(
      `Bonjour ${f.client},\n` +
      `Ceci est un rappel amical de LAPERLE TOUR HT concernant la facture officielle N° ${f.number} d'un montant de $${f.amount} ${f.currency || 'USD'}.\n` +
      `Date limite de règlement : ${f.dueDate || 'Immédiat'}.\n` +
      `Modes acceptés : MonCash (+509 4440 8687), Virement SOGEBANK / UNIBANK ou Chèque.\n` +
      `Merci pour votre confiance !`
    );
    window.open(`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{isClient ? 'Mes Factures & Règlements' : 'Factures Officielles & Recouvrement'}</h2>
          <p>
            {isClient
              ? 'Consultez vos factures en règle, réglez par MonCash, virement ou chèque avec preuve photographique.'
              : 'Gestion comptable, encaissements et suivi des bordereaux de règlement conformes DGI.'}
          </p>
        </div>
        <div className="actions">
          {!isClient && !isChauffeur && (
            <button type="button" className="primary" onClick={() => onOpenModal('facture')}>
              + Nouvelle Facture
            </button>
          )}
        </div>
      </div>

      <div className="data-panel">
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder={isClient ? 'Rechercher une facture ou référence...' : 'Rechercher par facture, client ou proforma...'}
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
              <option value="Payée">Payée</option>
              <option value="En attente">En attente</option>
              <option value="Partiellement payée">Partiellement payée</option>
              <option value="En retard">En retard</option>
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
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧾</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Aucune facture trouvée</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  {isClient 
                    ? 'Aucune facture en cours sur votre compte. Dès qu\'une prestation est validée, votre facture apparaîtra ici.' 
                    : 'Modifiez vos filtres pour afficher les factures.'}
                </div>
              </div>
            ) : (
              filtered.map((f) => (
                <div key={f.id} className="item-detail-card">
                  <div className="item-detail-card-head">
                    <div className="card-id-cluster" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DocRefBadge reference={f.number} type="facture" />
                      {f.proformaNumber && (
                        <DocRefBadge reference={f.proformaNumber} type="proforma" label={`Devis ${f.proformaNumber}`} />
                      )}
                      <span className={`badge ${getStatusBadge(f.status)}`}>
                        {f.status || 'En attente'}
                      </span>
                      {f.preuveImage && (
                        <button
                          type="button"
                          onClick={() => setZoomedProofImage(f.preuveImage || null)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          <span>📎 Preuve jointe</span>
                        </button>
                      )}
                    </div>
                    <div className="card-price-badge">
                      <DualPrice amount={f.amount || 0} currency={f.currency || 'USD'} size="sm" />
                    </div>
                  </div>

                  <div className="item-detail-card-meta">
                    <span className="meta-chip">
                      <span>📅</span>
                      <span>Émission : <strong>{f.date}</strong></span>
                    </span>
                    <span className="meta-chip">
                      <span>⏳</span>
                      <span>Échéance : <strong>{f.dueDate || 'À réception'}</strong></span>
                    </span>
                    <span className="meta-chip">
                      <span>💳</span>
                      <span>Moyen : <strong>{f.modePaiement || f.paymentMethod || 'MonCash / Virement / Chèque'}</strong></span>
                    </span>
                    {f.referenceTransaction && (
                      <span className="meta-chip">
                        <span>🏷️</span>
                        <span>Réf. Transaction : <strong className="font-mono text-purple-800">{f.referenceTransaction}</strong></span>
                      </span>
                    )}
                    {!isClient && (
                      <span className="meta-chip">
                        <span>👤</span>
                        <span>Client : <strong>{f.client}</strong></span>
                      </span>
                    )}
                  </div>

                  <div className="item-detail-card-actions">
                    <button
                      type="button"
                      className="btn-card-action"
                      onClick={() => setPrintSheetData({ type: 'facture', data: f })}
                      title="Imprimer ou télécharger la facture en PDF officiel"
                    >
                      🖨️ Aperçu PDF / Imprimer
                    </button>

                    {f.status !== 'Payée' && (
                      <button
                        type="button"
                        className="btn-card-action success-subtle"
                        onClick={() => setProofFacture(f)}
                        title="Transmettre la preuve de paiement MonCash, Virement ou Chèque"
                      >
                        💳 {isClient ? 'Régler / Soumettre Preuve' : 'Attacher une Preuve'}
                      </button>
                    )}

                    {isClient ? (
                      <>
                        <button
                          type="button"
                          className="btn-card-action primary-subtle"
                          onClick={() => onOpenModal('demande-envoi', { type: 'facture', doc: f })}
                          title="Demander de m'envoyer cette facture par Email ou sur WhatsApp"
                        >
                          📨 Envoyer par Email / WhatsApp
                        </button>
                        <a
                          href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour Laperle Tour, je vous écris concernant ma facture N° ${f.number} d'un montant de $${f.amount} ${f.currency || 'USD'}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-card-action success-subtle"
                          style={{ textDecoration: 'none' }}
                        >
                          💬 Question WhatsApp
                        </a>
                      </>
                    ) : (
                      <>
                        {f.status !== 'Payée' ? (
                          <>
                            <button
                              type="button"
                              className="btn-card-action success-subtle"
                              onClick={() => convertFactureToPaiement(f)}
                              title="Valider l'encaissement"
                            >
                              ⚡ Encaisser Direct
                            </button>
                            <button
                              type="button"
                              className="btn-card-action amber-subtle"
                              onClick={() => sendWhatsAppReminder(f)}
                            >
                              💬 Relance WhatsApp
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Facture Soldée
                          </span>
                        )}
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('facture', f)}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          type="button"
                          className="btn-card-action"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            if (window.confirm(`Supprimer la facture ${f.number} ?`)) {
                              deleteFacture(f.id);
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
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>N° Facture</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Réf. Devis</th>
                  {!isClient && <th style={{ padding: '14px 16px', fontSize: '12px' }}>Client</th>}
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Date Émission</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Date Échéance</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Montant (USD / HTG)</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Moyen / Réf.</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Statut</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isClient ? 8 : 9} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      Aucune facture disponible.
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => (
                    <tr 
                      key={f.id}
                      style={{ 
                        background: '#ffffff', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', 
                        borderRadius: '10px'
                      }}
                    >
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <DocRefBadge reference={f.number} type="facture" />
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        {f.proformaNumber ? (
                          <DocRefBadge reference={f.proformaNumber} type="proforma" label={f.proformaNumber} />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Direct</span>
                        )}
                      </td>
                      {!isClient && (
                        <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                          <strong style={{ color: '#0f172a' }}>{f.client}</strong>
                        </td>
                      )}
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>{f.date}</td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>{f.dueDate || '-'}</td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <DualPrice amount={f.amount || 0} currency={f.currency || 'USD'} size="sm" />
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>
                          {f.modePaiement || f.paymentMethod || 'MonCash / Virement'}
                        </div>
                        {f.referenceTransaction && (
                          <div style={{ fontSize: '10.5px', color: '#7e22ce', fontFamily: 'monospace' }}>
                            {f.referenceTransaction}
                          </div>
                        )}
                        {f.preuveImage && (
                          <button
                            type="button"
                            onClick={() => setZoomedProofImage(f.preuveImage || null)}
                            className="inline-block mt-1 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                          >
                            📎 Voir photo
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <span className={`badge ${getStatusBadge(f.status)}`}>
                          {f.status || 'En attente'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                        <div className="action-cell" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="tiny"
                            style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                            onClick={() => setPrintSheetData({ type: 'facture', data: f })}
                            title="Aperçu officiel de la facture"
                          >
                            🖨️ PDF
                          </button>

                          {f.status !== 'Payée' && (
                            <button
                              type="button"
                              className="tiny"
                              style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 600 }}
                              onClick={() => setProofFacture(f)}
                              title="Attacher la preuve de virement / MonCash"
                            >
                              💳 Payer
                            </button>
                          )}

                          {isClient ? (
                            <button
                              type="button"
                              className="tiny"
                              style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}
                              onClick={() => onOpenModal('demande-envoi', { type: 'facture', doc: f })}
                              title="Demander l'envoi de la facture par Email ou WhatsApp"
                            >
                              📨 Envoi
                            </button>
                          ) : (
                            <>
                              {f.status !== 'Payée' && (
                                <button
                                  type="button"
                                  className="tiny"
                                  style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}
                                  onClick={() => convertFactureToPaiement(f)}
                                  title="Encaisser immédiatement"
                                >
                                  ⚡
                                </button>
                              )}
                              <button
                                type="button"
                                className="tiny edit"
                                onClick={() => onOpenModal('facture', f)}
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="tiny delete"
                                onClick={() => {
                                  if (window.confirm(`Supprimer la facture ${f.number} ?`)) {
                                    deleteFacture(f.id);
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

      {/* Payment Proof Modal */}
      {proofFacture && (
        <PaymentProofModal
          facture={proofFacture}
          onClose={() => setProofFacture(null)}
          onSuccess={() => setProofFacture(null)}
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
