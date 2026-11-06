import React, { useState } from 'react';
import { Proforma, Facture, Reservation } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface DocumentDetailViewProps {
  type: 'devis' | 'facture';
  document: Proforma | Facture;
  reservation?: Reservation | null;
  onBack: () => void;
  onAcceptDevis?: (proforma: Proforma) => Promise<void> | void;
  onRefuseDevis?: (proforma: Proforma) => Promise<void> | void;
  onPayFacture?: (facture: Facture) => void;
}

export const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({
  type,
  document: docItem,
  reservation,
  onBack,
  onAcceptDevis,
  onRefuseDevis,
  onPayFacture
}) => {
  const { settings, showToast, setCurrentModule } = useApp();
  const { profile, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmRefuse, setConfirmRefuse] = useState(false);

  const isDevis = type === 'devis';
  const proforma = isDevis ? (docItem as Proforma) : null;
  const facture = !isDevis ? (docItem as Facture) : null;

  // Rate & amounts in HTG strictly as requested
  const exchangeRate = settings?.tauxChangeUSD_HTG || 132;

  // Format currency helper to Haitian Gourdes HTG: e.g. "45 000,00 HTG"
  const formatHTG = (amountInHTGorUSD: number, isDirectHTG: boolean = true): string => {
    let finalHTG = amountInHTGorUSD;
    if (!isDirectHTG) {
      finalHTG = Math.round(amountInHTGorUSD * exchangeRate);
    }
    return `${finalHTG.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HTG`;
  };

  // Compute HTG amount
  // If proforma/facture has amount in HTG or default sample
  const rawAmount = docItem.amount || (docItem as any).totalTTC || 45000;
  // If the document currency is USD and < 1000, convert to HTG, else assume HTG
  const isUSDAmount = (docItem.currency === 'USD' && rawAmount < 2000);
  const amountInHTG = isUSDAmount ? Math.round(rawAmount * exchangeRate) : rawAmount;

  // Document metadata
  const docNumber = docItem.number || (isDevis ? 'DEV-2025-0018' : 'FAC-2025-0032');
  const dateEmission = docItem.date || (isDevis ? '27 janv. 2025' : '28 janv. 2025');
  const dateValiditeOrEcheance = docItem.dueDate || (isDevis ? '03 févr. 2025' : '04 févr. 2025');
  const status = (docItem.status || docItem.statut || (isDevis ? 'En attente' : 'Payée'));

  // Linked reservation / demand info
  const demandOrResNumber = reservation?.id || (docItem as any).dossierId || (docItem as any).demandNumber || (docItem as any).reservationId || (isDevis ? 'DEM-2025-0067' : 'RES-2025-0032');
  const origin = reservation?.origin || (docItem as any).origin || (docItem as any).pickup || 'Port-au-Prince';
  const destination = reservation?.destination || (docItem as any).destination || (docItem as any).dropoff || 'Cap-Haïtien';
  const trajetDisplay = `${origin} → ${destination}`;
  const dateTimeDisplay = reservation?.date && reservation?.time 
    ? `${reservation.date} à ${reservation.time}` 
    : ((docItem as any).travelDate ? `${(docItem as any).travelDate} à ${(docItem as any).travelTime || '08:00'}` : '28 janv. 2025 à 08:00');
  const vehiculeDisplay = reservation?.vehicle || reservation?.vehicule || (docItem as any).vehicleType || (docItem as any).vehicle || 'Toyota Hiace';
  const passagersDisplay = reservation?.passengers || (docItem as any).passengers || 10;

  // Customer info
  const clientName = docItem.client || profile?.nom || profile?.name || user?.displayName || 'Jean Baptiste';
  const clientPhone = (docItem as any).telephone || profile?.telephone || profile?.phone || '+509 37 12 45 67';
  const clientEmail = (docItem as any).clientEmail || (docItem as any).email || profile?.email || user?.email || 'jean.baptiste@gmail.com';

  // Mode de paiement
  const paymentMethod = (facture as any)?.modePaiement || (facture as any)?.paymentMethod || 'Virement bancaire';
  const isPaid = !isDevis && (status === 'Payée' || status === 'Payé' || status === 'Validé');

  // Interactive Action Handlers
  const handlePrintOrPdf = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = `${isDevis ? 'Devis' : 'Facture'} Laperle Tour HT N° ${docNumber} - Montant : ${formatHTG(amountInHTG, true)}`;
    
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        showToast('Lien du document copié dans le presse-papier !', 'success');
        return;
      } catch (e) {
        console.warn('Clipboard write fallback', e);
      }
    }
    
    // WhatsApp fallback
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
    window.open(waUrl, '_blank');
  };

  const handleAccept = async () => {
    if (!proforma || !onAcceptDevis) return;
    setIsProcessing(true);
    try {
      await onAcceptDevis(proforma);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (!proforma || !onRefuseDevis) return;
    setIsProcessing(true);
    try {
      await onRefuseDevis(proforma);
      setConfirmRefuse(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="document-detail-container" style={{ padding: '20px 24px 60px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Header Bar: Title, Breadcrumbs & Actions */}
      <div 
        className="doc-header-bar flex flex-wrap items-center justify-between gap-4 mb-6"
        style={{
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px'
        }}
      >
        {/* Left: Icon, Title & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#0052cc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}
          >
            {isDevis ? '📄' : '🧾'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isDevis ? 'Devis' : 'Facture'}
              </h1>
              <button
                type="button"
                onClick={onBack}
                style={{
                  fontSize: '12px',
                  color: '#0052cc',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
                className="hover:underline hover:bg-blue-50"
              >
                ← Retour à la liste
              </button>
            </div>
            {/* Breadcrumb matching screenshots */}
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }} className="flex items-center gap-1.5">
              <button 
                type="button" 
                onClick={() => setCurrentModule('reservations')} 
                style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
                className="hover:underline"
              >
                Accueil
              </button>
              <span>›</span>
              <button 
                type="button" 
                onClick={onBack} 
                style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
                className="hover:underline"
              >
                {isDevis ? 'Mes devis' : 'Mes factures'}
              </button>
              <span>›</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>
                {isDevis ? `Devis n° ${docNumber}` : `Facture n° ${docNumber}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions Top Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action 1: Télécharger en PDF */}
          <button
            type="button"
            onClick={handlePrintOrPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            className="hover:bg-slate-50 transition-colors"
            title="Télécharger ou enregistrer le document au format PDF"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Télécharger en PDF</span>
          </button>

          {/* Action 3: Partager */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            className="hover:bg-slate-50 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>Partager</span>
          </button>

          {/* Conditional Action buttons for Devis: Accepter & Refuser */}
          {isDevis && (
            <>
              <button
                type="button"
                onClick={handleAccept}
                disabled={isProcessing || status === 'Convertie en facture' || status === 'Acceptée'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: status === 'Convertie en facture' || status === 'Acceptée' ? '#94a3b8' : '#16a34a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: status === 'Convertie en facture' || status === 'Acceptée' ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                }}
                className="hover:brightness-105 transition-all"
              >
                <span>✓</span>
                <span>{status === 'Convertie en facture' || status === 'Acceptée' ? 'Devis Accepté' : 'Accepter le devis'}</span>
              </button>

              {status !== 'Convertie en facture' && status !== 'Acceptée' && status !== 'Refusée' && (
                !confirmRefuse ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRefuse(true)}
                    disabled={isProcessing}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #ef4444',
                      background: '#ffffff',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    className="hover:bg-red-50 transition-colors"
                  >
                    <span>✕</span>
                    <span>Refuser le devis</span>
                  </button>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef2f2', padding: '4px 8px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>Confirmer le refus ?</span>
                    <button
                      type="button"
                      onClick={handleRefuse}
                      disabled={isProcessing}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      className="hover:bg-red-700 transition-colors"
                    >
                      {isProcessing ? 'En cours...' : 'Oui, refuser'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRefuse(false)}
                      disabled={isProcessing}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      className="hover:bg-slate-100 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )
              )}
            </>
          )}

          {/* Conditional Action button for Unpaid Facture */}
          {!isDevis && !isPaid && onPayFacture && (
            <button
              type="button"
              onClick={() => onPayFacture(facture!)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#0052cc',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 82, 204, 0.3)'
              }}
              className="hover:bg-blue-700 transition-colors"
            >
              <span>💳</span>
              <span>Payer la facture (Règlement)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main 2-Column Content Split */}
      <div 
        className="doc-main-split" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(300px, 340px) 1fr', 
          gap: '24px', 
          alignItems: 'start' 
        }}
      >
        {/* ==================================================================== */}
        {/* LEFT COLUMN: Summary & Linked Demand Cards (width ~340px)            */}
        {/* ==================================================================== */}
        <div className="left-cards-column flex flex-col gap-5">
          {/* CARD 1: Informations du devis / de la facture */}
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            {/* Navy Card Header */}
            <div 
              style={{
                background: '#0052cc',
                color: '#ffffff',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              <span>📄</span>
              <span>{isDevis ? 'Informations du devis' : 'Informations de la facture'}</span>
            </div>

            {/* Rows list */}
            <div style={{ padding: '4px 16px', width: '300px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{isDevis ? 'N° de devis' : 'N° de facture'}</span>
                <button
                  type="button"
                  onClick={handlePrintOrPdf}
                  title="Cliquer pour ouvrir et télécharger la version PDF officielle"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px 6px',
                    color: '#0052cc',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '4px'
                  }}
                  className="hover:bg-blue-50"
                >
                  <span>{docNumber}</span>
                  <span style={{ fontSize: '11px', textDecoration: 'none' }}>↗ PDF</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Date d'émission</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{dateEmission}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{isDevis ? 'Date de validité' : 'Date d\'échéance'}</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{dateValiditeOrEcheance}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Statut</span>
                {isDevis ? (
                  <span 
                    style={{
                      background: status === 'Convertie en facture' || status === 'Acceptée' ? '#dcfce7' : '#fef3c7',
                      color: status === 'Convertie en facture' || status === 'Acceptée' ? '#166534' : '#b45309',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{status === 'Convertie en facture' || status === 'Acceptée' ? '✓' : '🕒'}</span>
                    <span>{status === 'Convertie en facture' ? 'Acceptée' : status}</span>
                  </span>
                ) : (
                  <span 
                    style={{
                      background: isPaid ? '#dcfce7' : '#fef3c7',
                      color: isPaid ? '#166534' : '#b45309',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{isPaid ? '✓' : '🕒'}</span>
                    <span>{status}</span>
                  </span>
                )}
              </div>

              {!isDevis && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Mode de paiement</span>
                  <span style={{ color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>💳</span>
                    <span>{paymentMethod}</span>
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Montant total</span>
                <strong style={{ color: '#0052cc', fontSize: '18px', fontWeight: 800, fontFamily: 'monospace' }}>
                  {formatHTG(amountInHTG, true)}
                </strong>
              </div>
            </div>
          </div>

          {/* CARD 2: Demande associée / Réservation associée */}
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            {/* Navy Card Header */}
            <div 
              style={{
                background: '#0052cc',
                color: '#ffffff',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              <span>📅</span>
              <span>{isDevis ? 'Demande associée' : 'Réservation associée'}</span>
            </div>

            {/* Rows list */}
            <div style={{ padding: '4px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{isDevis ? 'N° de demande' : 'N° de réservation'}</span>
                <span 
                  style={{
                    background: '#eff6ff',
                    color: '#0052cc',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                >
                  {demandOrResNumber}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Trajet</span>
                <span style={{ color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#64748b' }}>📍</span>
                  <span>{trajetDisplay}</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Date & Heure</span>
                <span style={{ color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#64748b' }}>📅</span>
                  <span>{dateTimeDisplay}</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{isDevis ? 'Véhicule demandé' : 'Véhicule'}</span>
                <span style={{ color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#64748b' }}>🚗</span>
                  <span>{vehiculeDisplay}</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Passagers</span>
                <span style={{ color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#64748b' }}>👥</span>
                  <span>{passagersDisplay}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: Official A4 Paper Document Sheet                       */}
        {/* ==================================================================== */}
        <div 
          id="official-print-document"
          className="official-doc-sheet"
          style={{
            background: '#ffffff',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            padding: '44px 48px 48px',
            position: 'relative',
            overflow: 'hidden',
            width: '800px',
            maxWidth: '800px',
            minHeight: '1123px',
            boxSizing: 'border-box',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Header of Official Sheet */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
            {/* Left Brand Lockup matching screenshot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src="/logo-laperle.jpg" 
                alt="Laperle Tours Logo" 
                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              />
              <div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0052cc', lineHeight: 1.1 }}>
                  Laperle Tour <span style={{ color: '#f59e0b' }}>HT</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#082b70', marginBottom: '6px' }}>
                  Transport & Tourisme
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📍</span> <span>Port-au-Prince, Haïti</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📞</span> <span>+509 34 56 78 90</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✉️</span> <span>contact@laperletourht.com</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌐</span> <span>www.laperletourht.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Badge & Doc Number */}
            <div style={{ textAlign: 'right' }}>
              <div 
                style={{
                  display: 'inline-block',
                  background: '#082b70',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '1px',
                  padding: '6px 24px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  height: '34.4667px',
                  width: '106.517px',
                  paddingTop: '5px',
                  marginLeft: '0px',
                  boxSizing: 'border-box'
                }}
              >
                {isDevis ? 'DEVIS' : 'FACTURE'}
              </div>
              <button
                type="button"
                onClick={handlePrintOrPdf}
                title="Cliquer pour ouvrir et télécharger la version PDF officielle"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0052cc',
                  fontFamily: 'monospace',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                className="hover:text-blue-700"
              >
                <span>N° {docNumber}</span>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>↗ PDF</span>
              </button>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                <div>Date d'émission : <strong style={{ color: '#0f172a' }}>{dateEmission}</strong></div>
                <div>{isDevis ? 'Date de validité :' : 'Date d\'échéance :'} <strong style={{ color: '#0f172a' }}>{dateValiditeOrEcheance}</strong></div>
              </div>
            </div>
          </div>

          {/* Two Soft Blue Cards: Recipient & Journey Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
            {/* Box 1: Devis pour / Facturé à */}
            <div 
              style={{
                background: '#f0f7ff',
                borderRadius: '8px',
                padding: '14px 18px',
                border: '1px solid #e0f2fe'
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                {isDevis ? 'Devis pour :' : 'Facturé à :'}
              </div>
              <div style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 600 }}>
                  <span style={{ color: '#64748b' }}>👤</span> <span>{clientName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ color: '#64748b' }}>📞</span> <span>{clientPhone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ color: '#64748b' }}>✉️</span> <span>{clientEmail}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Trajet / Réservation */}
            <div 
              style={{
                background: '#f0f7ff',
                borderRadius: '8px',
                padding: '14px 18px',
                border: '1px solid #e0f2fe'
              }}
            >
              <div style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.7 }}>
                {!isDevis && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Réservation :</span>
                    <strong style={{ color: '#0052cc', fontFamily: 'monospace' }}>{demandOrResNumber}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Trajet :</span>
                  <strong style={{ color: '#0f172a' }}>{trajetDisplay}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Date :</span>
                  <strong style={{ color: '#0f172a' }}>{dateTimeDisplay}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>{isDevis ? 'Véhicule proposé :' : 'Véhicule :'}</span>
                  <strong style={{ color: '#0f172a' }}>{vehiculeDisplay}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Passagers :</span>
                  <strong style={{ color: '#0f172a' }}>{passagersDisplay}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#082b70', color: '#ffffff', fontSize: '12px' }}>
                  <th style={{ padding: '10px 14px', borderRadius: '6px 0 0 0', fontWeight: 700 }}>Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>Quantité</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>Prix unitaire (HTG)</th>
                  <th style={{ padding: '10px 14px', borderRadius: '0 6px 0 0', textAlign: 'right', fontWeight: 700 }}>Montant (HTG)</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '12.5px', color: '#1e293b' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Transport de personnes</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {trajetDisplay} ({vehiculeDisplay})
                    </div>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center', verticalAlign: 'top' }}>1</td>
                  <td style={{ padding: '14px', textAlign: 'right', verticalAlign: 'top', fontFamily: 'monospace' }}>
                    {formatHTG(amountInHTG, true).replace(' HTG', '')}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatHTG(amountInHTG, true).replace(' HTG', '')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation (Right Aligned) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', marginBottom: '28px' }}>
            <div style={{ width: '280px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
              <span style={{ fontWeight: 600 }}>Sous-total</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{formatHTG(amountInHTG, true)}</strong>
            </div>

            <div style={{ width: '280px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
              <span style={{ fontWeight: 600 }}>TVA (0 %)</span>
              <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>0,00 HTG</span>
            </div>

            {/* Total Highlight Bar in light blue (#e0f2fe) matching screenshot */}
            <div 
              style={{
                width: '320px',
                background: '#e0f2fe',
                padding: '10px 16px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#0052cc',
                marginTop: '4px'
              }}
            >
              <strong style={{ fontSize: '14px' }}>
                {isDevis ? 'Total du devis' : 'Total à payer'}
              </strong>
              <strong style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace' }}>
                {formatHTG(amountInHTG, true)}
              </strong>
            </div>
          </div>

          {/* Paid Stamp for Facture matching screenshot 2 */}
          {!isDevis && isPaid && (
            <div 
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '2.5px solid #16a34a',
                color: '#16a34a',
                borderRadius: '8px',
                padding: '6px 20px',
                fontWeight: 900,
                fontSize: '20px',
                letterSpacing: '2px',
                transform: 'rotate(-4deg)',
                margin: '10px 0 24px 10px',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)',
                background: 'rgba(240, 253, 244, 0.8)'
              }}
            >
              <span>✓</span>
              <span>PAYÉE</span>
            </div>
          )}

          {/* Notes Box */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '12px',
              color: '#475569',
              lineHeight: 1.5,
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            <span style={{ color: '#0052cc', fontSize: '14px' }}>ℹ️</span>
            <div>
              <strong style={{ color: '#0f172a' }}>Notes :</strong>
              <span style={{ marginLeft: '6px' }}>
                {isDevis 
                  ? `Ce devis est valable jusqu'au ${dateValiditeOrEcheance}. Pour confirmer, veuillez accepter le devis.`
                  : 'Merci de votre confiance. Pour toute information, contactez notre service client.'}
              </span>
            </div>
          </div>

          {/* Decorative Bottom Wave matching screenshot */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '18px',
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            <svg viewBox="0 0 500 20" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M0,12 C150,22 350,0 500,12 L500,20 L0,20 Z" fill="#f59e0b" />
              <path d="M0,14 C180,6 320,20 500,10 L500,20 L0,20 Z" fill="#0052cc" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
