import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PrintSheetModal: React.FC = () => {
  const { printSheetData, setPrintSheetData, settings } = useApp();
  const [zoomedProof, setZoomedProof] = useState<string | null>(null);

  if (!printSheetData) return null;

  const { type, data } = printSheetData;
  const isFacture = type === 'facture';
  const isProforma = type === 'proforma';
  const isReservation = type === 'reservation';
  const isPaiement = type === 'paiement';

  let title = 'DOCUMENT OFFICIEL';
  if (isFacture) title = 'FACTURE OFFICIELLE';
  else if (isProforma) title = 'DEVIS PROFORMA';
  else if (isReservation) title = 'BON DE RÉSERVATION';
  else if (isPaiement) title = 'REÇU DE PAIEMENT CERTIFIÉ';

  const number = data.number || data.id || data.reference || 'REF-001';
  const client = data.client || 'Client Laperle';
  const date = data.date || new Date().toISOString().slice(0, 10);
  const dueDate = data.dueDate || '-';

  const amount = Number(data.amount || data.totalTTC || data.montantTotal || data.montant || 0);
  const currency = data.currency || data.devise || 'USD';
  const isUSD = currency.toUpperCase() === 'USD';
  const rate = settings.tauxChangeUSD_HTG || 132;
  
  const totalUSD = isUSD ? amount : (rate > 0 ? amount / rate : 0);
  const totalHTG = isUSD ? Math.round(amount * rate) : amount;

  const items = data.items || [
    {
      description: data.service || (isReservation ? `Course VIP : ${data.origin || 'Départ'} ➔ ${data.destination || 'Destination'}` : 'Prestation de transport privé VIP'),
      quantity: data.passengers || 1,
      unitPrice: amount,
      total: amount
    }
  ];

  const subTotal = items.reduce((sum: number, it: any) => sum + (it.total || 0), 0) || amount;
  const tva = data.tva || (isFacture || isProforma ? Math.round(subTotal * ((settings.tvaPourcentage || 10) / 100)) : 0);
  const grandTotal = subTotal + tva;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#082b70] hover:bg-blue-900 text-white font-medium text-sm rounded-lg shadow-sm transition-all active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              <span>Imprimer / Télécharger PDF</span>
            </button>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
              {number}
            </span>
          </div>

          <button 
            type="button" 
            onClick={() => setPrintSheetData(null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:m-0" id="printDocumentArea">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-[#082b70]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#082b70] to-[#05183d] text-white flex flex-col items-center justify-center font-black shadow-sm border-2 border-amber-500 shrink-0 select-none print:border-[#082b70]">
                <span className="text-xl tracking-wider text-amber-400 font-serif leading-none font-bold">LT</span>
                <span className="text-[7.5px] tracking-widest text-slate-200 uppercase font-sans font-bold leading-none mt-1">HAÏTI</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#082b70] m-0">LAPERLE TOUR HT</h1>
                <div className="text-xs font-semibold text-amber-600 italic">« Un coup d'œil sur Haïti »</div>
                <div className="text-xs text-slate-500 mt-1">Flotte VIP • Circuits Touristiques • Navettes • Trajets Privés</div>
              </div>
            </div>

            <div className="text-xs text-slate-600 sm:text-right space-y-0.5 leading-relaxed">
              <div><strong className="text-slate-800">Siège :</strong> {settings.adresse}</div>
              <div><strong className="text-slate-800">Tél :</strong> {settings.telephone1} / {settings.telephone2}</div>
              <div><strong className="text-slate-800">WhatsApp :</strong> {settings.whatsapp}</div>
              <div><strong className="text-slate-800">Email :</strong> {settings.email}</div>
              {settings.numeroFiscal && <div><strong className="text-slate-800">NIF :</strong> {settings.numeroFiscal}</div>}
            </div>
          </div>

          {/* Doc Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-[11px] font-bold text-amber-600 tracking-wider uppercase">
                {title}
              </div>
              <h2 className="text-xl font-bold text-[#082b70] mt-0.5 font-mono">
                {number}
              </h2>
              <div className="text-xs text-slate-600 mt-2">
                Date : <strong className="text-slate-800">{date}</strong>
              </div>
              {dueDate && dueDate !== '-' && (
                <div className="text-xs text-slate-600">
                  Échéance : <strong className="text-slate-800">{dueDate}</strong>
                </div>
              )}
              {data.status && (
                <div className="text-xs text-slate-600 mt-1">
                  Statut : <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-200 text-slate-800">{data.status}</span>
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                DESTINATAIRE / CLIENT
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {client}
              </h3>
              {data.telephone && <div className="text-xs text-slate-600">Tél : {data.telephone}</div>}
              {data.email && <div className="text-xs text-slate-600">Email : {data.email}</div>}
              {data.origin && (
                <div className="text-xs text-slate-600 mt-1">
                  Itinéraire : <strong>{data.origin}</strong> ➔ <strong>{data.destination}</strong>
                </div>
              )}
            </div>
          </div>

          {/* If Payment Receipt with Proof Info */}
          {(isPaiement || data.preuveImage || data.referenceTransaction) && (
            <div className="mb-6 p-4 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>📎 Informations & Preuve de Règlement</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500 block">Mode de Paiement :</span>
                  <strong className="text-slate-900">{data.modePaiement || data.paymentMethod || 'MonCash / Virement'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Réf. Transaction / Bordereau :</span>
                  <strong className="font-mono text-purple-800">{data.referenceTransaction || data.reference || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Facture Associée :</span>
                  <strong className="font-mono text-slate-900">{data.factureAssociee || data.number || 'Direct'}</strong>
                </div>
              </div>

              {/* Attached Receipt Thumbnail */}
              {data.preuveImage && (
                <div className="mt-3 pt-3 border-t border-purple-200/80 flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600">Bordereau / Reçu joint :</span>
                  <button 
                    type="button" 
                    onClick={() => setZoomedProof(data.preuveImage)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white text-purple-700 border border-purple-300 rounded shadow-sm hover:bg-purple-100/50"
                  >
                    <span>🖼️ Agrandir la preuve</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <table className="w-full text-xs text-left border-collapse my-4">
            <thead>
              <tr className="bg-[#082b70] text-white">
                <th className="p-3 rounded-l-lg font-semibold">Désignation de la Prestation</th>
                <th className="p-3 text-center w-16 font-semibold">Qté</th>
                <th className="p-3 text-right w-28 font-semibold">Prix Unitaire</th>
                <th className="p-3 text-right w-32 rounded-r-lg font-semibold">Total ($ USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((it: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3.5">
                    <strong className="text-slate-900 text-[13px]">{it.description}</strong>
                    {it.notes && <div className="text-slate-500 text-[11px] mt-0.5">{it.notes}</div>}
                  </td>
                  <td className="p-3.5 text-center text-slate-700">{it.quantity}</td>
                  <td className="p-3.5 text-right font-mono text-slate-700">
                    ${(it.unitPrice || 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    ${(it.total || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Payment Instructions */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mt-6">
            <div className="w-full sm:w-7/12 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 leading-relaxed">
              <strong className="text-slate-800 text-[11px] uppercase tracking-wider block">
                MODALITÉS DE RÈGLEMENT OFFICIELLES :
              </strong>
              <div>• <strong>MonCash / Natcash</strong> direct au : <span className="font-mono text-amber-700 font-bold">{settings.telephone1}</span></div>
              <div>• <strong>Virement Bancaire</strong> : SOGEBANK / UNIBANK / BUH à l'ordre de <strong>LAPERLE TOUR HT</strong></div>
              <div>• <strong>Chèques & Espèces</strong> : Bureau commercial de Delmas 75 avec délivrance de reçu certifié.</div>
              <div className="text-[11px] text-slate-500 italic pt-1">
                Taux de change légal : 1 USD = {rate} HTG
              </div>
            </div>

            <div className="w-full sm:w-5/12 text-xs space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total HT :</span>
                <strong className="font-mono text-slate-800">${subTotal.toLocaleString()} USD</strong>
              </div>
              {tva > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>TVA ({settings.tvaPourcentage || 10}%) :</span>
                  <strong className="font-mono text-slate-800">${tva.toLocaleString()} USD</strong>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#082b70] pt-2 border-t border-slate-300">
                <span>TOTAL :</span>
                <span className="font-mono">${grandTotal.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 font-medium">
                <span>Contre-valeur HTG :</span>
                <strong className="font-mono">{totalHTG.toLocaleString('fr-FR')} HTG</strong>
              </div>
            </div>
          </div>

          {/* Certified Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 mt-8 pt-6 border-t border-slate-200 text-xs">
            <div className="text-slate-400 text-[11px] text-center sm:text-left">
              Document officiel généré par le Centre de Contrôle Laperle Tour HT.<br />
              Toute altération rend ce document nul et non avenu.
            </div>

            <div className="border-2 border-dashed border-[#082b70] rounded-xl px-5 py-3 text-center bg-blue-50/40">
              <div className="font-black text-[#082b70] tracking-wide">LAPERLE TOUR HT</div>
              <div className="text-[10px] text-slate-600 uppercase">Direction Administrative & Financière</div>
              <div className="text-xs font-bold text-emerald-600 mt-1">✓ CERTIFIÉ CONFORME</div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Image Zoom Modal */}
      {zoomedProof && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomedProof(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl p-2 overflow-hidden shadow-2xl">
            <button
              type="button"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 text-white font-bold flex items-center justify-center hover:bg-slate-900"
              onClick={() => setZoomedProof(null)}
            >
              ✕
            </button>
            <img 
              src={zoomedProof} 
              alt="Justificatif de paiement" 
              className="max-h-[80vh] w-auto object-contain mx-auto rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};
