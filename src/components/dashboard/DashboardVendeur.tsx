import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';
import { Proforma, Reservation } from '../../types';

interface DashboardVendeurProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const DashboardVendeur: React.FC<DashboardVendeurProps> = ({ onOpenModal }) => {
  const { profile, user, role } = useAuth();
  const {
    proformas,
    factures,
    reservations,
    clients,
    convertProformaToFacture,
    convertReservationToProforma,
    setPrintSheetData,
    showToast,
    setCurrentModule,
    setGlobalSearchQuery,
    settings
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const vendorName = profile?.nom || user?.displayName || 'Agent Commercial';

  // --------------------------------------------------------------------------
  // SALES KPIS COMPUTATION
  // --------------------------------------------------------------------------
  const salesMetrics = useMemo(() => {
    const totalQuotes = proformas.length;

    // Filter out canceled/refused for conversion denominator if applicable
    const convertedQuotes = proformas.filter(
      (p) => p.status === 'Convertie en facture' || p.status === 'Validée'
    );
    const convertedCount = convertedQuotes.length;

    const pendingQuotes = proformas.filter(
      (p) => p.status === 'En attente' || p.status === 'Demande de facture' || p.status === 'Envoyée'
    );
    const pendingCount = pendingQuotes.length;

    const invoiceRequestedQuotes = proformas.filter(
      (p) => p.status === 'Demande de facture' || p.demandeFacture === true
    );

    // Amounts
    const totalQuotedAmount = proformas.reduce((sum, p) => sum + (Number(p.totalTTC || p.amount) || 0), 0);
    const totalConvertedAmount = convertedQuotes.reduce((sum, p) => sum + (Number(p.totalTTC || p.amount) || 0), 0);
    const totalPendingAmount = pendingQuotes.reduce((sum, p) => sum + (Number(p.totalTTC || p.amount) || 0), 0);

    // Average Deal Size
    const avgDealSize = totalQuotes > 0 ? Math.round(totalQuotedAmount / totalQuotes) : 0;

    // Conversion rate
    const conversionRate = totalQuotes > 0 ? Math.round((convertedCount / totalQuotes) * 100) : 0;

    return {
      totalQuotes,
      convertedCount,
      pendingCount,
      invoiceRequestedCount: invoiceRequestedQuotes.length,
      totalQuotedAmount,
      totalConvertedAmount,
      totalPendingAmount,
      avgDealSize,
      conversionRate
    };
  }, [proformas]);

  // --------------------------------------------------------------------------
  // RESERVATIONS AWAITING QUOTE (LEADS / DEMANDES ENTRANTES)
  // --------------------------------------------------------------------------
  const leadsToQuote = useMemo(() => {
    return reservations.filter((r) => {
      // Find reservations that don't have a linked proforma yet and are pending
      const hasProforma = proformas.some((p) => p.number === r.devisRef || p.id === r.devisRef || p.id === r.id);
      return !hasProforma && (r.status === 'En attente' || r.status === 'Confirmée');
    });
  }, [reservations, proformas]);

  // --------------------------------------------------------------------------
  // FILTERED PROFORMAS
  // --------------------------------------------------------------------------
  const filteredProformas = useMemo(() => {
    return proformas.filter((p) => {
      if (statusFilter === 'PENDING' && p.status !== 'En attente' && p.status !== 'Envoyée') return false;
      if (statusFilter === 'REQUESTED' && p.status !== 'Demande de facture' && !p.demandeFacture) return false;
      if (statusFilter === 'CONVERTED' && p.status !== 'Convertie en facture' && p.status !== 'Validée') return false;
      if (statusFilter === 'REJECTED' && p.status !== 'Refusée' && p.status !== 'Annulée') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = (p.number || p.id || '').toLowerCase().includes(q);
        const matchClient = (p.client || '').toLowerCase().includes(q);
        const matchPhone = (p.telephone || '').toLowerCase().includes(q);
        const matchService = (p.service || '').toLowerCase().includes(q);
        return matchNum || matchClient || matchPhone || matchService;
      }
      return true;
    });
  }, [proformas, statusFilter, searchQuery]);

  // --------------------------------------------------------------------------
  // ACTION HANDLERS
  // --------------------------------------------------------------------------
  const handleQuickConvert = async (proforma: Proforma) => {
    try {
      setConvertingId(proforma.id || proforma.number);
      await convertProformaToFacture(proforma);
    } catch (err: any) {
      showToast(`Erreur de conversion : ${err?.message || 'Échec'}`, 'error');
    } finally {
      setConvertingId(null);
    }
  };

  const handleCreateQuoteForLead = async (lead: Reservation) => {
    try {
      await convertReservationToProforma(lead);
      showToast(`Devis généré pour ${lead.client} avec succès !`, 'success');
    } catch (err: any) {
      showToast(`Erreur lors du chiffrage : ${err?.message || 'Échec'}`, 'error');
    }
  };

  const handleWhatsAppFollowUp = (p: Proforma) => {
    const rawPhone = (p.telephone || '').replace(/\D/g, '');
    const clientName = p.client || 'Cher Client';
    const num = p.number || p.id;
    const amountStr = `$${p.totalTTC || p.amount} USD`;

    const message = encodeURIComponent(
      `Bonjour ${clientName},\n\nNous faisons suite à votre devis proforma N° ${num} d'un montant de ${amountStr} pour nos services de transport chez LAPERLE TOUR HT.\n\nSouhaitez-vous que nous validions votre réservation et éditions votre facture officielle ?\n\nNous restons à votre entière disposition au +509 3723-3816.\nLAPERLE TOUR HT - Excellence & Confort.`
    );

    const waPhone = rawPhone.length === 8 ? `509${rawPhone}` : rawPhone;
    if (waPhone) {
      window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank');
    } else {
      showToast("Numéro WhatsApp client introuvable sur ce devis.", 'warning');
    }
  };

  return (
    <div className="dashboard-container-exact" style={{ paddingBottom: '50px' }}>
      {/* -------------------------------------------------------------------- */}
      {/* 1. HEADER COMMERCIAL & BANNIÈRE VENDEUR                              */}
      {/* -------------------------------------------------------------------- */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #071f4c 0%, #0c337c 50%, #1754b5 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(7, 31, 76, 0.2)',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span 
              style={{
                background: '#f59e0b',
                color: '#78350f',
                fontWeight: 800,
                fontSize: '11px',
                padding: '3px 9px',
                borderRadius: '6px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase'
              }}
            >
              ESPACE COMMERCIAL & VENTES
            </span>
            <span style={{ fontSize: '13px', opacity: 0.85 }}>
              • Centre de Contrôle LAPERLE TOUR HT
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 850, margin: '0 0 6px', color: '#ffffff', letterSpacing: '-0.3px' }}>
            Tableau de Bord Vendeur & Suivi des Devis
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#e0e7ff', lineHeight: 1.5 }}>
            Bienvenue, <strong>{vendorName}</strong>. Pilotez vos opportunités commerciales, convertissez vos devis proformas en factures d'un simple clic et assurez un suivi client réactif par WhatsApp.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onOpenModal('proforma')}
            style={{
              background: '#f59e0b',
              color: '#0f172a',
              border: 'none',
              padding: '11px 18px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouveau Devis Proforma
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('client')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '11px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(6px)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Nouveau Client / Prospect
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. SALES KPIS ROW                                                    */}
      {/* -------------------------------------------------------------------- */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* KPI 1 : Total Devis Émis */}
        <div className="kpi-card-exact" style={{ background: '#ffffff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Total Devis Émis
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', lineHeight: 1.1, marginBottom: '6px' }}>
            {salesMetrics.totalQuotes}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Volume chiffré : <DualPrice amountUSD={salesMetrics.totalQuotedAmount} inline />
          </div>
        </div>

        {/* KPI 2 : Taux de Conversion */}
        <div className="kpi-card-exact" style={{ background: '#ffffff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Taux de Conversion
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 850, color: '#059669', lineHeight: 1.1, marginBottom: '6px' }}>
            {salesMetrics.conversionRate}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${Math.min(salesMetrics.conversionRate, 100)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: '3px'
                }} 
              />
            </div>
            <span>{salesMetrics.convertedCount}/{salesMetrics.totalQuotes}</span>
          </div>
        </div>

        {/* KPI 3 : Chiffre d'Affaires Gagné (Converti) */}
        <div className="kpi-card-exact" style={{ background: '#ffffff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              CA Gagné / Converti
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', lineHeight: 1.1, marginBottom: '6px' }}>
            ${salesMetrics.totalConvertedAmount.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>USD</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Équivalent HTG : {(salesMetrics.totalConvertedAmount * (settings.tauxChangeUSD_HTG || 132)).toLocaleString()} HTG
          </div>
        </div>

        {/* KPI 4 : Devis en Attente (Pipeline Actif) */}
        <div className="kpi-card-exact" style={{ background: '#ffffff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Pipeline en Négociation
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 850, color: '#ea580c', lineHeight: 1.1, marginBottom: '6px' }}>
            {salesMetrics.pendingCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            En jeu : <DualPrice amountUSD={salesMetrics.totalPendingAmount} inline />
          </div>
        </div>

        {/* KPI 5 : Panier Moyen */}
        <div className="kpi-card-exact" style={{ background: '#ffffff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Valeur Moyenne Devis
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 850, color: '#0f172a', lineHeight: 1.1, marginBottom: '6px' }}>
            ${salesMetrics.avgDealSize.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>USD</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Par dossier commercial
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. PIPELINE COMMERCIAL (ENTONNOIR DE VENTES INTERACTIF)              */}
      {/* -------------------------------------------------------------------- */}
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px 24px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#082b70' }}>
              Entonnoir de Conversion des Devis (Sales Pipeline)
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
              Cliquez sur une étape pour filtrer instantanément le tableau de conversion ci-dessous.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
            style={{
              background: statusFilter === 'ALL' && !searchQuery ? '#082b70' : '#f1f5f9',
              color: statusFilter === 'ALL' && !searchQuery ? '#ffffff' : '#475569',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Afficher Tout ({proformas.length})
          </button>
        </div>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}
        >
          {/* Étape 1 : En attente */}
          <div
            onClick={() => setStatusFilter('PENDING')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: statusFilter === 'PENDING' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: statusFilter === 'PENDING' ? '#eff6ff' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>
                1. EN NÉGOCIATION
              </span>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                {salesMetrics.pendingCount}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Devis transmis, en attente de validation client.
            </div>
          </div>

          {/* Étape 2 : Demande Facture Reçue */}
          <div
            onClick={() => setStatusFilter('REQUESTED')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: statusFilter === 'REQUESTED' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              background: statusFilter === 'REQUESTED' ? '#fffbeb' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>
                2. PRÊT À FACTURER
              </span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                {salesMetrics.invoiceRequestedCount}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Le client a demandé sa facture officielle.
            </div>
          </div>

          {/* Étape 3 : Convertie en Facture (Gagnée) */}
          <div
            onClick={() => setStatusFilter('CONVERTED')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: statusFilter === 'CONVERTED' ? '2px solid #10b981' : '1px solid #e2e8f0',
              background: statusFilter === 'CONVERTED' ? '#ecfdf5' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                3. CONVERTI EN FACTURE
              </span>
              <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                {salesMetrics.convertedCount}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Dossier clos gagné, facture émise en comptabilité.
            </div>
          </div>

          {/* Étape 4 : Refusé / Annulé */}
          <div
            onClick={() => setStatusFilter('REJECTED')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: statusFilter === 'REJECTED' ? '2px solid #ef4444' : '1px solid #e2e8f0',
              background: statusFilter === 'REJECTED' ? '#fef2f2' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                4. PERDU / REFUSÉ
              </span>
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                {proformas.filter(p => p.status === 'Refusée' || p.status === 'Annulée').length}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Proposition commerciale sans suite ou annulée.
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. LEADS ENTRANTS À CHIFFRER (OPPORTUNITÉS IMMÉDIATES)                 */}
      {/* -------------------------------------------------------------------- */}
      {leadsToQuote.length > 0 && (
        <div 
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fed7aa',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2410c' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '15.5px', fontWeight: 850, margin: 0, color: '#9a3412' }}>
                  {leadsToQuote.length} Demande{leadsToQuote.length > 1 ? 's' : ''} Entrante{leadsToQuote.length > 1 ? 's' : ''} à Chiffrer en Devis Proforma
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#7c2d12' }}>
                  Nouvelles réservations nécessitant une proposition commerciale immédiate.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentModule('reservations')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#c2410c',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Voir toutes les réservations →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {leadsToQuote.slice(0, 3).map((lead) => (
              <div 
                key={lead.id}
                style={{
                  background: '#fffaf5',
                  border: '1px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      {lead.client}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', background: '#ffedd5', padding: '2px 6px', borderRadius: '6px' }}>
                      {lead.date || 'Date à convenir'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                    {lead.service || 'Course VIP'} : {lead.origin || 'Port-au-Prince'} ➔ {lead.destination || 'Destination'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    Estimation indicative : <DualPrice amountUSD={lead.amount || 250} inline />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCreateQuoteForLead(lead)}
                    style={{
                      flex: 1,
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Chiffrer en Devis Proforma
                  </button>

                  {lead.telephone && (
                    <button
                      type="button"
                      onClick={() => {
                        const raw = lead.telephone!.replace(/\D/g, '');
                        const wa = raw.length === 8 ? `509${raw}` : raw;
                        window.open(`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour ${lead.client}, nous préparons votre devis proforma pour votre course chez LAPERLE TOUR HT.`)}`, '_blank');
                      }}
                      title="Contacter sur WhatsApp"
                      style={{
                        background: '#25D366',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      💬
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. TABLEAU DE SUIVI & DE CONVERSION DES PROFORMAS                     */}
      {/* -------------------------------------------------------------------- */}
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}
      >
        {/* Table Filter & Search Controls */}
        <div 
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            background: '#fafbfc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#082b70' }}>
              Suivi des Devis & Actions de Conversion
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              ({filteredProformas.length} devis affiché{filteredProformas.length > 1 ? 's' : ''})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Rechercher devis, client, tél..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  outline: 'none',
                  background: '#ffffff'
                }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>
                🔍
              </span>
            </div>

            {/* Status Quick Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">1. En négociation / attente</option>
              <option value="REQUESTED">2. Facture demandée par client</option>
              <option value="CONVERTED">3. Convertie en facture (Gagnée)</option>
              <option value="REJECTED">4. Refusée ou annulée</option>
            </select>

            <button
              type="button"
              onClick={() => onOpenModal('proforma')}
              style={{
                background: '#082b70',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              + Émettre Devis
            </button>
          </div>
        </div>

        {/* The Conversion Table */}
        <div className="modern-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  N° Devis
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Client & Contact
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Service & Date
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Montant Total TTC
                </th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Statut & Demande
                </th>
                <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>
                  Actions de Vente
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProformas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                      Aucun devis proforma correspondant
                    </div>
                    <p style={{ fontSize: '13px', margin: '0 0 16px' }}>
                      Commencez par émettre votre première proposition commerciale ou convertissez une réservation entrante.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenModal('proforma')}
                      style={{
                        background: '#082b70',
                        color: '#ffffff',
                        border: 'none',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Créer un Devis Proforma
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProformas.map((p) => {
                  const isConverted = p.status === 'Convertie en facture' || p.status === 'Validée';
                  const isRequested = p.status === 'Demande de facture' || p.demandeFacture === true;
                  const isPending = p.status === 'En attente' || p.status === 'Envoyée';
                  const isRejected = p.status === 'Refusée' || p.status === 'Annulée';
                  const isConverting = convertingId === (p.id || p.number);

                  return (
                    <tr 
                      key={p.id || p.number}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: isRequested ? '#fffdf7' : '#ffffff',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* N° Devis */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <DocRefBadge 
                            type="proforma" 
                            id={p.number || p.id} 
                            onClick={() => setPrintSheetData({ type: 'proforma', data: p })}
                          />
                        </div>
                      </td>

                      {/* Client & Contact */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                          {p.client}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          <span>{p.telephone || 'Sans tél'}</span>
                          {p.clientEmail && (
                            <>
                              <span>•</span>
                              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.clientEmail}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Service & Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                          {p.service || 'Transport VIP / Course'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          Émis le {p.date || 'Récemment'} {p.dueDate ? `• Échéance ${p.dueDate}` : ''}
                        </div>
                      </td>

                      {/* Montant Total TTC */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <DualPrice amountUSD={p.totalTTC || p.amount} />
                      </td>

                      {/* Statut & Demande */}
                      <td style={{ padding: '14px 16px' }}>
                        {isConverted ? (
                          <span 
                            style={{
                              background: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ✓ Convertie en Facture
                          </span>
                        ) : isRequested ? (
                          <div>
                            <span 
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              ⚡ Facture Demandée
                            </span>
                            {p.moyenPaiement && (
                              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, marginTop: '3px' }}>
                                Via {p.moyenPaiement}
                              </div>
                            )}
                          </div>
                        ) : isRejected ? (
                          <span 
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 800
                            }}
                          >
                            ✕ Refusée / Sans suite
                          </span>
                        ) : (
                          <span 
                            style={{
                              background: '#eff6ff',
                              color: '#1e40af',
                              border: '1px solid #bfdbfe',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            ⏳ En attente de réponse
                          </span>
                        )}
                      </td>

                      {/* Actions de Vente */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* 1-CLIC CONVERT TO INVOICE */}
                          {!isConverted && !isRejected && (
                            <button
                              type="button"
                              disabled={isConverting}
                              onClick={() => handleQuickConvert(p)}
                              style={{
                                background: isRequested ? '#16a34a' : '#082b70',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: isRequested ? '0 2px 8px rgba(22, 163, 74, 0.3)' : 'none'
                              }}
                              title="Générer la facture officielle DGI pour ce devis"
                            >
                              {isConverting ? (
                                'Génération...'
                              ) : (
                                <>
                                  <span>⚡</span>
                                  <span>Convertir en Facture</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* WHATSAPP FOLLOW-UP */}
                          <button
                            type="button"
                            onClick={() => handleWhatsAppFollowUp(p)}
                            style={{
                              background: '#25D366',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Envoyer une relance par WhatsApp"
                          >
                            💬 Relance
                          </button>

                          {/* PRINT / VIEW SHEET */}
                          <button
                            type="button"
                            onClick={() => setPrintSheetData({ type: 'proforma', data: p })}
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Visualiser / Imprimer la Proforma"
                          >
                            🖨️
                          </button>

                          {/* EDIT PROFORMA */}
                          <button
                            type="button"
                            onClick={() => onOpenModal('proforma', p)}
                            style={{
                              background: '#f8fafc',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Modifier ce devis"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
