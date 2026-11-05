import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Proforma } from '../../types';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';
import { DocumentDetailView } from '../common/DocumentDetailView';
import { ClientProformasView } from './ClientProformasView';

interface ProformasViewProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ProformasView: React.FC<ProformasViewProps> = ({ onOpenModal }) => {
  const { 
    proformas, 
    reservations,
    deleteProforma, 
    convertProformaToFacture, 
    saveProforma,
    setPrintSheetData, 
    globalSearchQuery, 
    settings,
    requestDocumentSend,
    showToast,
    setCurrentModule
  } = useApp();
  const { role, isSuperAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);

  const isAdmin = role === 'admin' || isSuperAdmin;
  const isClient = role === 'client' || role === 'prospect';

  // Strict Client-specific View matching screenshot
  if (isClient) {
    return <ClientProformasView onOpenModal={onOpenModal} />;
  }

  const exchangeRate = settings?.tauxChangeUSD_HTG || 132;
  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  // Format amount exclusively in HTG (Gourdes)
  const formatHTG = (amount: number, currency: string = 'USD') => {
    const totalHTG = currency === 'HTG' ? amount : Math.round(amount * exchangeRate);
    return `${totalHTG.toLocaleString('fr-FR')} HTG`;
  };

  // Render High-Fidelity Detailed View when a devis is selected
  if (selectedProforma) {
    const matchedReservation = reservations.find(r => 
      r.id === selectedProforma.reservationId || 
      r.dossierId === selectedProforma.dossierId || 
      r.devisRef === selectedProforma.number
    );
    return (
      <DocumentDetailView
        type="devis"
        document={selectedProforma}
        reservation={matchedReservation}
        onBack={() => setSelectedProforma(null)}
        onAcceptDevis={async (p) => {
          await convertProformaToFacture(p);
          showToast(`Devis ${p.number} accepté ! Facture créée.`, 'success');
          setCurrentModule('factures');
        }}
        onRefuseDevis={async (p) => {
          await saveProforma({ ...p, status: 'Refusée' });
          showToast(`Le devis ${p.number} a été marqué comme refusé.`, 'info');
          setSelectedProforma(prev => prev ? { ...prev, status: 'Refusée' } : null);
        }}
      />
    );
  }

  const effectiveSearch = (searchTerm || globalSearchQuery).toLowerCase();

  const filtered = proformas.filter((p) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'Acceptée') {
        if (p.status !== 'Acceptée' && p.status !== 'Convertie en facture') return false;
      } else if (p.status !== statusFilter) {
        return false;
      }
    }
    if (effectiveSearch) {
      const matchClient = p.client?.toLowerCase().includes(effectiveSearch);
      const matchNum = p.number?.toLowerCase().includes(effectiveSearch);
      const matchSvc = p.service?.toLowerCase().includes(effectiveSearch);
      return matchClient || matchNum || matchSvc;
    }
    return true;
  });

  const totalCount = proformas.length;
  const pendingCount = proformas.filter((p) => p.status === 'En attente' || p.status === 'Brouillon' || !p.status).length;
  const acceptedCount = proformas.filter((p) => p.status === 'Acceptée' || p.status === 'Convertie en facture').length;
  const refusedCount = proformas.filter((p) => p.status === 'Refusée' || p.status === 'Expirée').length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Acceptée':
      case 'Convertie en facture':
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
            <span>{status === 'Convertie en facture' ? 'Facturé' : 'Accepté'}</span>
          </span>
        );
      case 'Refusée':
      case 'Expirée':
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
            <span>{status}</span>
          </span>
        );
      default:
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
            <span>En attente</span>
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 8px 48px' }}>
      {/* 1. Header Hero Card */}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Devis & Proformas
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Gestion commerciale, tarification en Gourdes (HTG), conversion instantanée en factures et transmission client.
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
            src="/tourisme-haiti.jpg"
            alt="Flotte Laperle"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 30%',
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
        {/* Total */}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{totalCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Total devis</div>
          </div>
        </div>

        {/* En attente */}
        <div 
          onClick={() => setStatusFilter('En attente')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'En attente' ? '2px solid #d97706' : '1px solid #e2e8f0',
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
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>En attente de réponse</div>
          </div>
        </div>

        {/* Acceptés / Convertis */}
        <div 
          onClick={() => setStatusFilter('Acceptée')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'Acceptée' ? '2px solid #16a34a' : '1px solid #e2e8f0',
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
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{acceptedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Acceptés & Facturés</div>
          </div>
        </div>

        {/* Refusés */}
        <div 
          onClick={() => setStatusFilter('Refusée')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'Refusée' ? '2px solid #dc2626' : '1px solid #e2e8f0',
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
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{refusedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Refusés / Expirés</div>
          </div>
        </div>
      </div>

      {/* 3. Action Callout Banner */}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Nouvelle proposition de devis
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Créez un devis chiffré sur mesure, affectez un itinéraire et transmettez-le instantanément au client.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal('proforma')}
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
          <span>Créer un devis</span>
        </button>
      </div>

      {/* 4. Main White Card */}
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
            Liste des devis & proformas
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
                placeholder="Rechercher un devis..."
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
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <option value="En attente">En attente</option>
                <option value="Acceptée">Acceptés & Facturés</option>
                <option value="Refusée">Refusés / Expirés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12.5px', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px' }}>N° de devis</th>
                <th style={{ padding: '12px 14px' }}>Client</th>
                <th style={{ padding: '12px 14px' }}>Prestation / Trajet</th>
                <th style={{ padding: '12px 14px' }}>Date & Validité</th>
                <th style={{ padding: '12px 14px' }}>Montant total</th>
                <th style={{ padding: '12px 14px' }}>Statut</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📄</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Aucun devis trouvé</div>
                    <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748b' }}>
                      Cliquez sur « Créer un devis » pour concevoir votre premier chiffrage.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const amount = p.totalTTC || p.amount || 0;
                  const htgText = formatHTG(amount, p.currency);

                  const actionItems: ActionMenuItem[] = [
                    {
                      label: 'Consulter la proforma A4',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ),
                      onClick: () => setSelectedProforma(p),
                      variant: 'primary'
                    },
                    ...(p.status !== 'Convertie en facture' ? [
                      {
                        label: 'Convertir en Facture',
                        icon: (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ),
                        onClick: async () => {
                          await convertProformaToFacture(p);
                          showToast(`Devis ${p.number} converti en facture avec succès !`, 'success');
                          setCurrentModule('factures');
                        },
                        variant: 'success' as const
                      }
                    ] : []),
                    {
                      label: 'Modifier le devis',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      ),
                      onClick: () => onOpenModal('proforma', p)
                    },
                    {
                      label: 'Aperçu PDF / Imprimer',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                      ),
                      onClick: () => setPrintSheetData({ type: 'proforma', data: p })
                    },
                    {
                      label: 'Transmettre par Email / WhatsApp',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      ),
                      onClick: () => onOpenModal('demande-envoi', { type: 'proforma', doc: p })
                    },
                    {
                      label: 'Relance WhatsApp client',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      ),
                      href: `https://wa.me/${(p.telephone || officialWhatsApp).replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${p.client}, LAPERLE TOUR HT vous transmet le devis proforma N° ${p.number} pour un montant de ${htgText}. N'hésitez pas à nous confirmer pour planifier votre véhicule.`)}`
                    },
                    ...(isAdmin ? [
                      {
                        label: 'Supprimer',
                        icon: (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        ),
                        onClick: () => {
                          if (window.confirm(`Supprimer la proforma ${p.number} ?`)) {
                            deleteProforma(p.id);
                          }
                        },
                        variant: 'danger' as const
                      }
                    ] : [])
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
                      {/* N° de devis */}
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          letterSpacing: '0.2px'
                        }}>
                          {p.number}
                        </span>
                      </td>

                      {/* Client */}
                      <td style={{ padding: '14px', color: '#1e293b', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <div>
                            <div>{p.client}</div>
                            {p.telephone && <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 400 }}>{p.telephone}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Prestation / Trajet */}
                      <td style={{ padding: '14px', color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{p.service || 'Prestation de transport'}</span>
                        </div>
                      </td>

                      {/* Date & Validité */}
                      <td style={{ padding: '14px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{p.date} · Expire : {p.dueDate || '7 jours'}</span>
                        </div>
                      </td>

                      {/* Montant total (HTG exclusif) */}
                      <td style={{ padding: '14px', color: '#0f172a', fontWeight: 800, fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>
                        {htgText}
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '14px' }}>
                        {renderStatusBadge(p.status || 'En attente')}
                      </td>

                      {/* Actions: Bouton avec menu déroulant */}
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <RowActionMenu items={actionItems} title="Options du devis" />
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
