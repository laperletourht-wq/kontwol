import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Facture } from '../../types';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { PaymentProofModal } from '../modals/PaymentProofModal';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';

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
  const { role, isSuperAdmin } = useAuth();
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
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

  const totalInvoices = factures.length;
  const paidInvoices = factures.filter((f) => f.status === 'Payée').length;
  const pendingInvoices = factures.filter((f) => f.status === 'En attente' || f.status === 'Partiellement payée' || !f.status).length;
  const lateInvoices = factures.filter((f) => f.status === 'En retard').length;
  const pendingAmountUSD = factures
    .filter((f) => f.status !== 'Payée')
    .reduce((sum, f) => sum + (f.totalTTC || f.amount || 0), 0);
  const exchangeRate = settings?.tauxChangeUSD_HTG || 132;
  const pendingAmountHTG = Math.round(pendingAmountUSD * exchangeRate);
  const recoveryRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 100;

  return (
    <div className="dashboard-container-exact">
      {/* 1. Hero Card matching exact design */}
      <div className="dashboard-hero-card">
        <div className="hero-kicker-row">
          <span className="kicker-sparkle">✨</span>
          <span className="kicker-text">COMPTABILITÉ & FACTURATION CONFORME · LAPERLE TOUR HT</span>
        </div>

        <div className="hero-content-row">
          <div className="hero-text-block">
            <h1 className="hero-title">
              {isClient ? 'Mes Factures & Règlements' : 'Factures Officielles & Recouvrement'}
            </h1>
            <p className="hero-subtitle">
              {isClient
                ? 'Consultez vos factures en règle, réglez en toute sécurité par MonCash, virement ou chèque avec transmission de bordereau.'
                : 'Gestion comptable, encaissements certifiés DGI, suivi des bordereaux et téléversement des preuves de règlement.'}
            </p>
          </div>

          <div className="hero-actions-block">
            {!isClient && !isChauffeur && (
              <button 
                type="button" 
                className="btn-hero-primary" 
                onClick={() => onOpenModal('facture')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Nouvelle Facture</span>
              </button>
            )}

            <a
              href={`https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour Service Comptabilité Laperle Tour, je vous contacte concernant mes factures et règlements.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-secondary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <span>Comptabilité WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <div className="data-panel">
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
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#082b70', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>📊</span> Synthèse :
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: statusFilter === 'ALL' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: statusFilter === 'ALL' ? '#eff6ff' : '#ffffff',
                color: statusFilter === 'ALL' ? '#1d4ed8' : '#334155',
                cursor: 'pointer'
              }}
              title="Afficher toutes les factures"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }} />
              <span>Émises : <strong>{totalInvoices}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Payée')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: statusFilter === 'Payée' ? '1px solid #16a34a' : '1px solid #cbd5e1',
                background: statusFilter === 'Payée' ? '#f0fdf4' : '#ffffff',
                color: statusFilter === 'Payée' ? '#15803d' : '#334155',
                cursor: 'pointer'
              }}
              title="Filtrer les factures réglées"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
              <span>Réglées : <strong>{paidInvoices}</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>({recoveryRate}%)</span></span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('En attente')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: statusFilter === 'En attente' ? '1px solid #d97706' : '1px solid #cbd5e1',
                background: statusFilter === 'En attente' ? '#fffbeb' : '#ffffff',
                color: statusFilter === 'En attente' ? '#b45309' : '#334155',
                cursor: 'pointer'
              }}
              title="Filtrer les factures en attente"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706' }} />
              <span>En attente : <strong>{pendingInvoices}</strong>{lateInvoices > 0 ? ` (${lateInvoices} en retard)` : ''}</span>
            </button>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '6px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 700
          }}>
            <span>💳 Solde restant dû :</span>
            <span style={{ fontSize: '13px', fontWeight: 800 }}>${pendingAmountUSD.toLocaleString()} USD</span>
            <span style={{ color: '#991b1b', fontSize: '11px', fontWeight: 500 }}>(≈ {pendingAmountHTG.toLocaleString()} HTG)</span>
          </div>
        </div>
        <div className="filters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Filtrer par statut :</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '160px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b' }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="Payée">Payée</option>
              <option value="En attente">En attente</option>
              <option value="Partiellement payée">Partiellement payée</option>
              <option value="En retard">En retard</option>
            </select>
          </div>

          <div style={{ fontSize: '12.5px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <strong>{filtered.length}</strong> facture{filtered.length > 1 ? 's' : ''}
          </div>
        </div>

        {false && (
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
                      {f.dossierId && (
                        <DocRefBadge reference={f.dossierId} type="reservation" label={`📁 ${f.dossierId}`} />
                      )}
                      {f.proformaNumber && (
                        <DocRefBadge reference={f.proformaNumber} type="proforma" label={`Devis ${f.proformaNumber}`} />
                      )}
                      {f.reservationId && f.reservationId !== f.dossierId && (
                        <DocRefBadge reference={f.reservationId} type="reservation" label={`Résa ${f.reservationId}`} />
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
                              style={{ background: '#dcfce7', borderColor: '#86efac', color: '#166534', fontWeight: 700 }}
                              onClick={() => convertFactureToPaiement(f)}
                              title="Valider l'encaissement et débloquer l'assignation chauffeur"
                            >
                              ✅ Valider Paiement & Facture
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
                          <>
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ✓ Facture Validée & Payée
                            </span>
                            <button
                              type="button"
                              className="btn-card-action primary-subtle"
                              onClick={() => setCurrentModule('reservations')}
                              title="Consulter les réservations et assigner le chauffeur"
                            >
                              🚗 Assigner Chauffeur
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn-card-action"
                          onClick={() => onOpenModal('facture', f)}
                        >
                          ✏️ Modifier
                        </button>
                        {isAdmin && (
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
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODERN AIRY TABLE (Excel Style) */}
        <div className="modern-table-card">
            <div className="modern-table-wrap">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>N° Facture</th>
                    <th>Réf. Devis</th>
                    {!isClient && <th>Client</th>}
                    <th>Date Émission</th>
                    <th>Date Échéance</th>
                    <th>Montant (USD / HTG)</th>
                    <th>Moyen / Réf.</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={isClient ? 8 : 9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                        Aucune facture disponible.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((f) => {
                      const actionItems: ActionMenuItem[] = [
                        {
                          label: 'Aperçu imprimable (PDF)',
                          icon: '🖨️',
                          onClick: () => setPrintSheetData({ type: 'facture', data: f }),
                          variant: 'primary'
                        },
                        ...(f.status !== 'Payée' ? [{
                          label: 'Attacher preuve de paiement',
                          icon: '💳',
                          onClick: () => setProofFacture(f),
                          variant: 'success' as const
                        }] : []),
                        ...(isClient ? [
                          {
                            label: 'Recevoir par Email / WhatsApp',
                            icon: '📨',
                            onClick: () => onOpenModal('demande-envoi', { type: 'facture', doc: f })
                          }
                        ] : [
                          ...(f.status !== 'Payée' ? [{
                            label: 'Encaisser immédiatement',
                            icon: '⚡',
                            onClick: () => convertFactureToPaiement(f),
                            variant: 'success' as const
                          }] : []),
                          {
                            label: 'Modifier la facture',
                            icon: '✏️',
                            onClick: () => onOpenModal('facture', f)
                          },
                          ...(isAdmin ? [{
                            label: 'Supprimer',
                            icon: '🗑️',
                            onClick: () => {
                              if (window.confirm(`Supprimer la facture ${f.number} ?`)) {
                                deleteFacture(f.id);
                              }
                            },
                            variant: 'danger' as const
                          }] : [])
                        ])
                      ];

                      return (
                        <tr key={f.id}>
                          <td>
                            <DocRefBadge reference={f.number} type="facture" />
                            {f.dossierId && (
                              <div style={{ marginTop: '4px' }}>
                                <DocRefBadge reference={f.dossierId} type="reservation" label={`📁 ${f.dossierId}`} />
                              </div>
                            )}
                          </td>
                          <td>
                            {f.proformaNumber ? (
                              <DocRefBadge reference={f.proformaNumber} type="proforma" label={f.proformaNumber} />
                            ) : f.reservationId ? (
                              <DocRefBadge reference={f.reservationId} type="reservation" label={`Résa ${f.reservationId}`} />
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>Direct</span>
                            )}
                          </td>
                          {!isClient && (
                            <td>
                              <strong style={{ color: '#0f172a' }}>{f.client}</strong>
                            </td>
                          )}
                          <td>{f.date}</td>
                          <td>{f.dueDate || '-'}</td>
                          <td>
                            <DualPrice amount={f.amount || 0} currency={f.currency || 'USD'} size="sm" />
                          </td>
                          <td>
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
                          <td>
                            <span className={`badge ${getStatusBadge(f.status)}`}>
                              {f.status || 'En attente'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                            <RowActionMenu items={actionItems} title={`Actions pour ${f.number}`} />
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
                <span>Affichage de <strong>{filtered.length}</strong> facture(s)</span>
                <span style={{ fontSize: '11px' }}>Règlements & Trésorerie certifiés DGI</span>
              </div>
            )}
          </div>
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
