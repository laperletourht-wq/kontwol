import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';
import { PaymentProofModal } from '../modals/PaymentProofModal';

interface ClientPaiementsViewProps {
  onOpenModal?: (type: string, data?: any) => void;
}

export const ClientPaiementsView: React.FC<ClientPaiementsViewProps> = () => {
  const { 
    paiements, 
    factures, 
    setPrintSheetData, 
    setCurrentModule,
    setGlobalSearchQuery,
    settings
  } = useApp();
  
  const { profile, user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'PENDING' | 'REJECTED'>('ALL');
  const [zoomedProofImage, setZoomedProofImage] = useState<string | null>(null);
  const [proofModalFacture, setProofModalFacture] = useState<any | null>(null);

  const exchangeRate = settings?.tauxChangeUSD_HTG || 132;
  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  // Format amount exclusively in HTG (Gourdes)
  const formatHTG = (amount: number, currency: string = 'USD') => {
    const totalHTG = currency === 'HTG' ? amount : Math.round(amount * exchangeRate);
    return `${totalHTG.toLocaleString('fr-FR')} HTG`;
  };

  const clientName = profile?.nom || user?.displayName || 'Client';

  // Fallback demo payments if list is empty for this client account
  const defaultClientPaiements: any[] = useMemo(() => [
    {
      id: 'PAY-2025-0021',
      reference: 'PAY-2025-0021',
      factureAssociee: 'FAC-2025-0032',
      factureNumber: 'FAC-2025-0032',
      client: clientName,
      date: '2025-01-28',
      amount: 45000,
      currency: 'HTG',
      statut: 'Validé',
      status: 'Validé',
      modePaiement: 'Virement bancaire (UNIBANK)',
      referenceTransaction: 'VIR-992384-HT',
      recuPar: 'Comptabilité Laperle',
      createdAt: '2025-01-28T09:30:00Z'
    },
    {
      id: 'PAY-2025-0020',
      reference: 'PAY-2025-0020',
      factureAssociee: 'FAC-2025-0030',
      factureNumber: 'FAC-2025-0030',
      client: clientName,
      date: '2025-01-26',
      amount: 65000,
      currency: 'HTG',
      statut: 'Validé',
      status: 'Validé',
      modePaiement: 'Chèque certifié',
      referenceTransaction: 'CHQ-582103',
      recuPar: 'Direction Financière',
      createdAt: '2025-01-26T11:00:00Z'
    },
    {
      id: 'PAY-2025-0019',
      reference: 'PAY-2025-0019',
      factureAssociee: 'FAC-2025-0031',
      factureNumber: 'FAC-2025-0031',
      client: clientName,
      date: '2025-01-27',
      amount: 28500,
      currency: 'HTG',
      statut: 'En attente',
      status: 'En attente',
      modePaiement: 'MonCash',
      referenceTransaction: 'MC-8374920',
      recuPar: 'Régulation',
      createdAt: '2025-01-27T14:15:00Z'
    }
  ], [clientName]);

  // Client filtered payments list
  const activePaiementsList = useMemo(() => {
    if (!profile && !user) return defaultClientPaiements;
    const userPayments = paiements.filter(p => 
      p.clientId === user?.uid || 
      (p.client && profile?.nom && p.client.toLowerCase() === profile.nom.toLowerCase()) ||
      (p.clientEmail && profile?.email && p.clientEmail.toLowerCase() === profile.email.toLowerCase())
    );
    return userPayments.length > 0 ? userPayments : defaultClientPaiements;
  }, [paiements, profile, user, defaultClientPaiements]);

  const isValide = (s?: string) => {
    const val = (s || '').toLowerCase();
    return val.includes('valid') || val.includes('payé') || val.includes('confir');
  };
  const isNonConforme = (s?: string) => {
    const val = (s || '').toLowerCase();
    return val.includes('rejet') || val.includes('annul') || val.includes('non') || val.includes('refus');
  };
  const isEnVerification = (s?: string) => !isValide(s) && !isNonConforme(s);

  // Dynamic KPI Stats
  const totalCount = activePaiementsList.length;
  const validatedCount = activePaiementsList.filter((p) => isValide(p.statut || p.status)).length;
  const pendingCount = activePaiementsList.filter((p) => isEnVerification(p.statut || p.status)).length;
  const rejectedCount = activePaiementsList.filter((p) => isNonConforme(p.statut || p.status)).length;

  // Filtered paiements
  const filteredPaiements = useMemo(() => {
    return activePaiementsList.filter((p) => {
      const rawStatus = p.statut || p.status;
      if (statusFilter === 'VALID' && !isValide(rawStatus)) return false;
      if (statusFilter === 'PENDING' && !isEnVerification(rawStatus)) return false;
      if (statusFilter === 'REJECTED' && !isNonConforme(rawStatus)) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchRef = (p.reference || p.id)?.toLowerCase().includes(query);
        const matchFac = p.factureAssociee?.toLowerCase().includes(query) || p.factureNumber?.toLowerCase().includes(query);
        const matchMode = p.modePaiement?.toLowerCase().includes(query);
        const matchTx = p.referenceTransaction?.toLowerCase().includes(query);
        return matchRef || matchFac || matchMode || matchTx;
      }

      return true;
    });
  }, [activePaiementsList, statusFilter, searchTerm]);

  const renderStatusBadge = (status: string) => {
    if (isValide(status)) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: '#f0fdf4',
          color: '#16a34a',
          fontSize: '12.5px',
          fontWeight: 700
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Validé</span>
        </span>
      );
    }

    if (isNonConforme(status)) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: '#fef2f2',
          color: '#dc2626',
          fontSize: '12.5px',
          fontWeight: 700
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span>Non conforme</span>
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '999px',
        background: '#fffbeb',
        color: '#d97706',
        fontSize: '12.5px',
        fontWeight: 700
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>En vérification</span>
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 8px 48px' }}>
      {/* 1. Header Hero Card with Fleet Background */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            flexShrink: 0
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Mes paiements
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Suivi exclusif de vos règlements enregistrés, attestations d'encaissement et justificatifs financiers.
            </p>
          </div>
        </div>

        {/* Scenic Fleet Image Banner */}
        <div style={{
          position: 'absolute',
          right: '0',
          top: '0',
          bottom: '0',
          width: '380px',
          overflow: 'hidden',
          display: 'block',
          pointerEvents: 'none'
        }} className="client-header-banner-wrap">
          <img
            src="/hero-laperle.jpg"
            alt="Paiements sécurisés"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%',
              maskImage: 'linear-gradient(to right, transparent 0%, black 35%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 35%)'
            }}
          />
        </div>
      </div>

      {/* 2. KPI Filter Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Total Paiements */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{totalCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Versements déclarés</div>
          </div>
        </div>

        {/* Validés */}
        <div 
          onClick={() => setStatusFilter('VALID')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'VALID' ? '2px solid #16a34a' : '1px solid #e2e8f0',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{validatedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Validés</div>
          </div>
        </div>

        {/* En vérification */}
        <div 
          onClick={() => setStatusFilter('PENDING')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'PENDING' ? '2px solid #d97706' : '1px solid #e2e8f0',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#fffbeb',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pendingCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>En vérification</div>
          </div>
        </div>

        {/* Non conformes */}
        <div 
          onClick={() => setStatusFilter('REJECTED')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'REJECTED' ? '2px solid #dc2626' : '1px solid #e2e8f0',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{rejectedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Non conformes</div>
          </div>
        </div>
      </div>

      {/* 3. Action Callout Banner: "Transmettre un justificatif" */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '22px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Transmettre un justificatif
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Vous venez d'effectuer un versement (MonCash, virement bancaire ou chèque certifié) ? Déposez votre reçu pour confirmation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const firstUnpaid = factures.find(f => (f.status || f.statut) !== 'Payée') || factures[0] || {
              id: 'FAC-2025-0031',
              number: 'FAC-2025-0031',
              client: clientName,
              amount: 28500,
              currency: 'HTG',
              service: 'Prestation transport & logistique',
              status: 'En attente'
            };
            setProofModalFacture(firstUnpaid);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Transmettre un justificatif</span>
        </button>
      </div>

      {/* 4. Main White Card: "Mes paiements" */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Mes paiements
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '260px' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher un paiement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '9px 16px 9px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="VALID">Validé</option>
                <option value="PENDING">En vérification</option>
                <option value="REJECTED">Non conforme</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table of Paiements */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12.5px', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px' }}>Réf. Paiement</th>
                <th style={{ padding: '12px 14px' }}>Facture associée</th>
                <th style={{ padding: '12px 14px' }}>Date & Mode de versement</th>
                <th style={{ padding: '12px 14px' }}>Montant encaissé</th>
                <th style={{ padding: '12px 14px' }}>Statut</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaiements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>💳</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Aucun paiement trouvé</div>
                    <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748b' }}>
                      Vos paiements validés et reçus de caisse s'afficheront ici.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPaiements.map((p) => {
                  const amount = p.montant || p.amount || 0;
                  const htgText = formatHTG(amount, p.currency);
                  const invoiceRef = p.factureAssociee || p.factureNumber || 'FAC-2025-0032';
                  const matchedFacture = factures.find(f => f.number === invoiceRef || f.id === invoiceRef);

                  const actionItems: ActionMenuItem[] = [
                    {
                      label: 'Consulter le reçu certifié',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      ),
                      onClick: () => {
                        if (matchedFacture) {
                          setPrintSheetData({ type: 'facture', data: matchedFacture });
                        } else {
                          setPrintSheetData({ 
                            type: 'facture', 
                            data: {
                              number: p.reference || p.id,
                              client: p.client || clientName,
                              date: p.date,
                              totalTTC: amount,
                              currency: p.currency || 'HTG',
                              status: 'Payée',
                              paymentMethod: p.modePaiement
                            }
                          });
                        }
                      },
                      variant: 'primary'
                    },
                    {
                      label: 'Voir la facture liée',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      ),
                      onClick: () => {
                        setCurrentModule('factures');
                        setGlobalSearchQuery(invoiceRef);
                      }
                    },
                    ...(p.proofUrl || p.justificatifUrl ? [
                      {
                        label: 'Afficher le justificatif téléversé',
                        icon: (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        ),
                        onClick: () => setZoomedProofImage(p.proofUrl || p.justificatifUrl)
                      }
                    ] : []),
                    {
                      label: 'Assistance WhatsApp',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      ),
                      href: `https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour LAPERLE TOUR HT, je vous contacte concernant mon paiement Réf. ${p.reference || p.id} (${htgText}).`)}`
                    }
                  ];

                  return (
                    <tr 
                      key={p.id}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Réf. Paiement: Badge stylisé PAY-2025-XXXX */}
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 800,
                          fontSize: '12.5px',
                          letterSpacing: '0.3px',
                          border: '1px solid #dbeafe'
                        }}>
                          {p.reference || p.id}
                        </span>
                      </td>

                      {/* Facture associée: Référence FAC-2025-XXXX avec accès direct en 1 clic */}
                      <td style={{ padding: '14px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentModule('factures');
                            setGlobalSearchQuery(invoiceRef);
                          }}
                          title={`Accéder directement à la facture ${invoiceRef}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            color: '#2563eb',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.borderColor = '#93c5fd';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                          <span>{invoiceRef}</span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>

                      {/* Date & Mode de versement: MonCash, Virement bancaire, Chèque certifié */}
                      <td style={{ padding: '14px', color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{p.date} · <strong style={{ color: '#0f172a' }}>{p.modePaiement || 'Virement bancaire'}</strong></span>
                        </div>
                      </td>

                      {/* Montant encaissé: Affichage exclusif en Gourdes (HTG) */}
                      <td style={{ padding: '14px', color: '#16a34a', fontWeight: 800, fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
                        {htgText}
                      </td>

                      {/* Statut: Validé, En vérification, Non conforme */}
                      <td style={{ padding: '14px' }}>
                        {renderStatusBadge(p.statut || p.status || 'En attente')}
                      </td>

                      {/* Menu d'actions déroulant */}
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <RowActionMenu items={actionItems} title="Options du versement" />
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

      {/* Proof Modal */}
      {proofModalFacture && (
        <PaymentProofModal
          facture={proofModalFacture}
          onClose={() => setProofModalFacture(null)}
        />
      )}

      {/* Zoom Lightbox */}
      {zoomedProofImage && (
        <div
          onClick={() => setZoomedProofImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={zoomedProofImage}
            alt="Preuve agrandie"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
};
