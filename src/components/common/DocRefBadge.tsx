import React from 'react';
import { useApp } from '../../context/AppContext';

interface DocRefBadgeProps {
  reference: string;
  type?: 'auto' | 'facture' | 'proforma' | 'reservation' | 'paiement';
  label?: string;
  className?: string;
}

export const DocRefBadge: React.FC<DocRefBadgeProps> = ({
  reference,
  type = 'auto',
  label,
  className = '',
}) => {
  const { 
    factures, 
    proformas, 
    reservations, 
    paiements, 
    setPrintSheetData, 
    setCurrentModule, 
    setGlobalSearchQuery,
    showToast 
  } = useApp();

  if (!reference) return null;

  // Determine doc type from prefix if auto
  const cleanRef = reference.trim();
  let resolvedType = type;
  if (resolvedType === 'auto') {
    if (cleanRef.startsWith('FAC-') || cleanRef.includes('FAC')) resolvedType = 'facture';
    else if (cleanRef.startsWith('PRO-') || cleanRef.startsWith('DEV-') || cleanRef.includes('PRO')) resolvedType = 'proforma';
    else if (cleanRef.startsWith('RES-') || cleanRef.startsWith('DOS-') || cleanRef.startsWith('DEM-') || cleanRef.includes('RES') || cleanRef.includes('DOS')) resolvedType = 'reservation';
    else if (cleanRef.startsWith('PAI-') || cleanRef.startsWith('REC-') || cleanRef.startsWith('MONCASH') || cleanRef.includes('PAI')) resolvedType = 'paiement';
    else resolvedType = 'facture';
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (resolvedType === 'facture') {
      const match = factures.find((f) => f.number === cleanRef || f.id === cleanRef);
      if (match) {
        setPrintSheetData({ type: 'facture', data: match });
        showToast(`Facture ${match.number} ouverte en aperçu officiel`, 'info');
      } else {
        // Fallback dummy view with this ref
        setPrintSheetData({
          type: 'facture',
          data: {
            number: cleanRef,
            client: 'Client Laperle',
            date: new Date().toISOString().slice(0, 10),
            amount: 250,
            currency: 'USD',
            service: 'Service de transport VIP Laperle Tour HT'
          }
        });
      }
      return;
    }

    if (resolvedType === 'proforma') {
      const match = proformas.find((p) => p.number === cleanRef || p.id === cleanRef);
      if (match) {
        setPrintSheetData({ type: 'proforma', data: match });
        showToast(`Devis ${match.number} ouvert en aperçu officiel`, 'info');
      } else {
        setPrintSheetData({
          type: 'proforma',
          data: {
            number: cleanRef,
            client: 'Client Laperle',
            date: new Date().toISOString().slice(0, 10),
            amount: 250,
            currency: 'USD',
            service: 'Devis sur mesure Laperle Tour HT'
          }
        });
      }
      return;
    }

    if (resolvedType === 'reservation') {
      const match = reservations.find((r) => r.id === cleanRef || r.dossierId === cleanRef);
      if (match) {
        setPrintSheetData({ type: 'reservation', data: match });
        showToast(`Fiche de réservation ${match.dossierId || match.id} ouverte`, 'info');
      } else {
        setCurrentModule('reservations');
        setGlobalSearchQuery(cleanRef);
      }
      return;
    }

    if (resolvedType === 'paiement') {
      const match = paiements.find((p) => p.reference === cleanRef || p.id === cleanRef);
      if (match) {
        setPrintSheetData({ type: 'paiement', data: match });
        showToast(`Reçu de paiement ${match.reference} ouvert`, 'info');
      } else {
        setCurrentModule('paiements');
        setGlobalSearchQuery(cleanRef);
      }
    }
  };

  const getBadgeColors = () => {
    switch (resolvedType) {
      case 'facture':
        return 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border-blue-200';
      case 'proforma':
        return 'bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-900 border-amber-200';
      case 'reservation':
        return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 border-emerald-200';
      case 'paiement':
        return 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-900 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Cliquer pour prévisualiser le document officiel (${cleanRef})`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all duration-150 border cursor-pointer shadow-sm hover:shadow active:scale-95 ${getBadgeColors()} ${className}`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <span>{label || cleanRef}</span>
      <span className="text-[10px] opacity-60 ml-0.5">↗</span>
    </button>
  );
};
