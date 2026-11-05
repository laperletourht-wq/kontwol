import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Proforma } from '../../types';
import { RowActionMenu, type ActionMenuItem } from '../common/RowActionMenu';
import { DocumentDetailView } from '../common/DocumentDetailView';

interface ClientProformasViewProps {
  onOpenModal?: (type: string, data?: any) => void;
}

export const ClientProformasView: React.FC<ClientProformasViewProps> = ({ onOpenModal }) => {
  const { 
    proformas, 
    reservations, 
    convertProformaToFacture, 
    saveProforma, 
    saveReservation,
    addNotification,
    setPrintSheetData, 
    showToast, 
    setCurrentModule,
    settings,
    requestDocumentSend,
    clientProformaViewMode,
    setClientProformaViewMode
  } = useApp();
  
  const { profile, user } = useAuth();

  // Mode: list or dedicated new-request page
  const viewMode = clientProformaViewMode || 'list';
  const setViewMode = setClientProformaViewMode;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);

  // Form states for the dedicated "Demande de devis" page
  const [reqOrigin, setReqOrigin] = useState('Port-au-Prince');
  const [reqDestination, setReqDestination] = useState('Cap-Haïtien');
  const [reqPickupAddress, setReqPickupAddress] = useState('');
  const [reqDate, setReqDate] = useState('2025-01-28');
  const [reqTime, setReqTime] = useState('08:00');
  const [reqVehicle, setReqVehicle] = useState('Toyota Hiace');
  const [reqPassengers, setReqPassengers] = useState(10);
  const [reqServiceType, setReqServiceType] = useState('Transport de personnes');
  const [reqNotes, setReqNotes] = useState('Ce devis est valable jusqu\'au 03 févr. 2025. Pour confirmer, veuillez accepter le devis.');
  const [customClientName, setCustomClientName] = useState('');
  const [customClientPhone, setCustomClientPhone] = useState('');
  const [customClientEmail, setCustomClientEmail] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const exchangeRate = settings?.tauxChangeUSD_HTG || 132;
  const officialWhatsApp = settings?.whatsapp || '+509 4440 8687';

  // Format amount exclusively in HTG (Gourdes)
  const formatHTG = (amount: number, currency: string = 'USD') => {
    const totalHTG = currency === 'HTG' ? amount : Math.round(amount * exchangeRate);
    return `${totalHTG.toLocaleString('fr-FR')} HTG`;
  };

  const clientName = profile?.nom || user?.displayName || 'Jean Baptiste';

  // Fallback demo proformas if list is empty for demo/new account
  const defaultClientProformas: Proforma[] = useMemo(() => [
    {
      id: 'DEV-2025-0018',
      number: 'DEV-2025-0018',
      dossierId: 'DEM-2025-0067',
      reservationId: 'RES-2025-0032',
      client: clientName,
      telephone: profile?.telephone || '+509 37 12 45 67',
      clientEmail: profile?.email || 'jean.baptiste@gmail.com',
      service: 'Transport de personnes (Port-au-Prince → Cap-Haïtien)',
      date: '27 janv. 2025',
      dueDate: '03 févr. 2025',
      amount: 45000,
      currency: 'HTG',
      status: 'En attente',
      notes: 'Ce devis est valable jusqu\'au 03 févr. 2025. Pour confirmer, veuillez accepter le devis.',
      createdAt: '2025-01-27T08:00:00Z',
      updatedAt: '2025-01-27T08:00:00Z'
    },
    {
      id: 'DEV-2025-0017',
      number: 'DEV-2025-0017',
      dossierId: 'DEM-2025-0066',
      reservationId: 'RES-2025-0031',
      client: clientName,
      telephone: profile?.telephone || '+509 37 12 45 67',
      clientEmail: profile?.email || 'jean.baptiste@gmail.com',
      service: 'Navette VIP Pétion-Ville → Jacmel',
      date: '25 janv. 2025',
      dueDate: '01 févr. 2025',
      amount: 28500,
      currency: 'HTG',
      status: 'Acceptée',
      notes: 'Devis validé par le client, converti en facture.',
      createdAt: '2025-01-25T10:00:00Z',
      updatedAt: '2025-01-25T10:00:00Z'
    },
    {
      id: 'DEV-2025-0016',
      number: 'DEV-2025-0016',
      dossierId: 'DEM-2025-0065',
      reservationId: 'RES-2025-0030',
      client: clientName,
      telephone: profile?.telephone || '+509 37 12 45 67',
      clientEmail: profile?.email || 'jean.baptiste@gmail.com',
      service: 'Circuit Découverte Côte des Arcadins',
      date: '20 janv. 2025',
      dueDate: '27 janv. 2025',
      amount: 32000,
      currency: 'HTG',
      status: 'Convertie en facture',
      notes: 'Facturation effectuée.',
      createdAt: '2025-01-20T09:00:00Z',
      updatedAt: '2025-01-20T09:00:00Z'
    }
  ], [clientName, profile?.telephone, profile?.email]);

  // Active proformas sorted with newest on top (row 1)
  const activeProformasList = useMemo(() => {
    const list = proformas.length > 0 ? proformas : defaultClientProformas;
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [proformas, defaultClientProformas]);

  // Dynamic Sequential IDs for the new quote request
  const nextDevisNumber = useMemo(() => {
    const numbers = activeProformasList
      .map((p) => {
        const m = p.number?.match(/DEV-\d{4}-(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 18;
    const nextSeq = Math.max(maxNum + 1, 19);
    return `DEV-2025-${String(nextSeq).padStart(4, '0')}`;
  }, [activeProformasList]);

  const nextDossierNumber = useMemo(() => {
    const numbers = activeProformasList
      .map((p) => {
        const m = p.dossierId?.match(/DEM-\d{4}-(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 67;
    const nextSeq = Math.max(maxNum + 1, 68);
    return `DEM-2025-${String(nextSeq).padStart(4, '0')}`;
  }, [activeProformasList]);

  // Dynamic price calculation based on route and vehicle with standard status check
  const priceCalculation = useMemo(() => {
    const o = (reqOrigin || '').trim().toLowerCase();
    const d = (reqDestination || '').trim().toLowerCase();
    let base = 35000;
    let isStandardRoute = false;

    if ((o.includes('port-au-prince') && d.includes('cap')) || (d.includes('port-au-prince') && o.includes('cap'))) {
      base = 45000; // Matches exact screenshot 45 000,00 HTG
      isStandardRoute = true;
    } else if ((o.includes('port-au-prince') && d.includes('jacmel')) || (d.includes('port-au-prince') && o.includes('jacmel'))) {
      base = 28500;
      isStandardRoute = true;
    } else if ((o.includes('port-au-prince') && d.includes('cayes')) || (d.includes('port-au-prince') && o.includes('cayes'))) {
      base = 38000;
      isStandardRoute = true;
    } else if ((o.includes('port-au-prince') && d.includes('gona')) || (d.includes('port-au-prince') && o.includes('gona'))) {
      base = 32000;
      isStandardRoute = true;
    } else if ((o.includes('port-au-prince') && d.includes('ouanaminthe')) || (d.includes('port-au-prince') && o.includes('ouanaminthe'))) {
      base = 52000;
      isStandardRoute = true;
    } else if (o.includes('pétion') || d.includes('pétion') || (o && d && o === d)) {
      base = 18000;
      isStandardRoute = true;
    }

    let mult = 1.0;
    const v = (reqVehicle || '').toLowerCase();
    if (v.includes('coaster') || v.includes('30')) {
      mult = 1.6;
    } else if (v.includes('suv') || v.includes('prado') || v.includes('lexus')) {
      mult = 1.25;
    } else if (v.includes('noah') || v.includes('voxy')) {
      mult = 0.85;
    } else if (v.includes('berline')) {
      mult = 0.75;
    }

    return {
      amount: Math.round(base * mult),
      isStandard: isStandardRoute
    };
  }, [reqOrigin, reqDestination, reqVehicle]);

  const estimatedAmount = priceCalculation.amount;
  const isStandardPricing = priceCalculation.isStandard;

  // Client display fields
  const displayClientName = customClientName.trim() || clientName;
  const displayClientPhone = customClientPhone.trim() || profile?.telephone || '+509 37 12 45 67';
  const displayClientEmail = customClientEmail.trim() || profile?.email || user?.email || 'jean.baptiste@gmail.com';

  const todayFormatted = '27 janv. 2025';
  const validityFormatted = '03 févr. 2025';

  const displayTravelDateTime = useMemo(() => {
    try {
      if (reqDate) {
        const [year, month, day] = reqDate.split('-');
        const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        const mIdx = parseInt(month, 10) - 1;
        const monthStr = months[mIdx] || month;
        return `${day} ${monthStr} ${year} à ${reqTime || '08:00'}`;
      }
    } catch {
      // fallback
    }
    return '28 janv. 2025 à 08:00';
  }, [reqDate, reqTime]);

  // Filtered proformas for list view
  const filteredProformas = useMemo(() => {
    return activeProformasList.filter((p) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Acceptée') {
          if (p.status !== 'Acceptée' && p.status !== 'Convertie en facture') return false;
        } else if (p.status !== statusFilter) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNum = p.number?.toLowerCase().includes(query);
        const matchSvc = p.service?.toLowerCase().includes(query);
        const matchNotes = p.notes?.toLowerCase().includes(query);
        const matchDossier = p.dossierId?.toLowerCase().includes(query);
        return matchNum || matchSvc || matchNotes || matchDossier;
      }

      return true;
    });
  }, [activeProformasList, statusFilter, searchTerm]);

  // Dynamic KPI Stats
  const totalCount = activeProformasList.length;
  const pendingCount = activeProformasList.filter((p) => p.status === 'En attente' || p.status === 'Brouillon' || !p.status).length;
  const acceptedCount = activeProformasList.filter((p) => p.status === 'Acceptée' || p.status === 'Convertie en facture').length;
  const refusedCount = activeProformasList.filter((p) => p.status === 'Refusée' || p.status === 'Expirée').length;

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

  // Submission handler for the new quote request
  const handleSendQuoteRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reqOrigin.trim() || !reqDestination.trim()) {
      showToast('Veuillez préciser le lieu de départ et d\'arrivée.', 'warning');
      return;
    }

    setIsSubmittingReq(true);
    try {
      const uniqueResNumber = `RES-${Date.now().toString().slice(-6)}`;
      
      const newDevis: Proforma = {
        id: nextDevisNumber,
        number: nextDevisNumber,
        dossierId: nextDossierNumber,
        reservationId: uniqueResNumber,
        client: displayClientName,
        telephone: displayClientPhone,
        clientEmail: displayClientEmail,
        clientId: user?.uid,
        uid: user?.uid,
        service: `${reqServiceType} (${reqOrigin} → ${reqDestination})`,
        date: todayFormatted,
        dueDate: validityFormatted,
        amount: estimatedAmount,
        totalTTC: estimatedAmount,
        currency: 'HTG',
        status: 'En attente',
        notes: reqNotes.trim() || `Ce devis est valable jusqu'au ${validityFormatted}. Pour confirmer, veuillez accepter le devis.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        origin: reqOrigin,
        destination: reqDestination,
        pickup: reqOrigin,
        dropoff: reqDestination,
        pickupAddress: reqPickupAddress,
        travelDate: reqDate,
        travelTime: reqTime,
        vehicleType: reqVehicle,
        vehicle: reqVehicle,
        passengers: reqPassengers,
        serviceType: reqServiceType
      } as any;

      // Also create matching reservation so the entire platform stays in sync
      const linkedReservation = {
        id: uniqueResNumber,
        dossierId: nextDossierNumber,
        devisRef: nextDevisNumber,
        client: displayClientName,
        phone: displayClientPhone,
        telephone: displayClientPhone,
        email: displayClientEmail,
        clientId: user?.uid,
        uid: user?.uid,
        origin: reqOrigin,
        destination: reqDestination,
        pickup: reqOrigin,
        dropoff: reqDestination,
        pickupAddress: reqPickupAddress,
        date: reqDate,
        time: reqTime,
        passengers: reqPassengers,
        vehicle: reqVehicle,
        vehicule: reqVehicle,
        service: reqServiceType,
        notes: reqNotes,
        status: 'En attente' as const,
        amount: estimatedAmount,
        currency: 'HTG',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await saveReservation(linkedReservation as any);
      } catch (err) {
        console.warn('Fallback saving reservation:', err);
      }

      await saveProforma(newDevis);

      // Send priority notification to administrators, direction, accounting, and secretary
      await addNotification({
        title: `Nouvelle demande de devis : ${nextDevisNumber}`,
        message: `${displayClientName} a soumis une demande de devis (${formatHTG(estimatedAmount, 'HTG')}) pour ${reqOrigin} ➔ ${reqDestination} (${reqVehicle}, ${reqPassengers} passagers). Transmis aux responsables habilités pour validation et conversion en facture.`,
        type: 'info',
        link: 'proformas',
        targetId: nextDevisNumber,
        targetAudience: 'admin',
        authorUid: user?.uid
      });

      showToast(`Votre demande de devis ${nextDevisNumber} a été envoyée avec succès à la régulation !`, 'success');

      // User confirmed decision: Redirect immediately to "Mes devis" list with new quote on row 1
      setSelectedProforma(null);
      setViewMode('list');
    } catch (err: any) {
      console.error('Erreur envoi demande devis:', err);
      showToast(`Erreur lors de l'envoi : ${err?.message || 'Veuillez réessayer.'}`, 'error');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // If a proforma is clicked for A4 official preview
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
          showToast(`Devis ${p.number} accepté ! Redirection vers votre facture...`, 'success');
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

  // =========================================================================
  // CASE 1: DEDICATED NEW QUOTE REQUEST PAGE (viewMode === 'new-request')
  // Split View: Form on Left, Live A4 Document Preview on Right (matching screenshot)
  // =========================================================================
  if (viewMode === 'new-request') {
    return (
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 60px' }}>
        {/* Top Header Bar with Breadcrumb and Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          {/* Breadcrumb & Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => setCurrentModule('dashboard')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
                className="hover:underline"
              >
                Accueil
              </button>
              <span>›</span>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
                className="hover:underline"
              >
                Mes devis
              </button>
              <span>›</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>
                Nouvelle demande de devis
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Demander un devis
            </h1>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
              className="hover:bg-slate-50 transition-colors"
            >
              <span>← Retour à mes devis</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendQuoteRequest()}
              disabled={isSubmittingReq}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: isSubmittingReq ? 'not-allowed' : 'pointer',
                opacity: isSubmittingReq ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)',
                whiteSpace: 'nowrap'
              }}
              className="hover:brightness-105 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>{isSubmittingReq ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Form Configurator on Left, Live A4 Document Sheet on Right */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 440px) 1fr',
          gap: '28px',
          alignItems: 'start'
        }} className="client-quote-split">
          
          {/* ================= LEFT COLUMN: Form Configurator ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Card 1: Configuration du Trajet & Véhicule */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  🚗
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    1. Trajet & Véhicule
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Renseignez vos étapes et votre flotte souhaitée
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Lieu de départ (Origine) avec saisie libre et suggestions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                      Lieu de prise en charge (Origine)
                    </label>
                    <span style={{ fontSize: '11px', color: '#0052cc', fontWeight: 600 }}>
                      Saisie libre ou suggestions
                    </span>
                  </div>
                  <input
                    type="text"
                    list="origins-list"
                    value={reqOrigin}
                    onChange={(e) => setReqOrigin(e.target.value)}
                    placeholder="Tapez votre point de départ (ex: Port-au-Prince, Aéroport Toussaint Louverture, Pétion-Ville...)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  <datalist id="origins-list">
                    <option value="Port-au-Prince">Port-au-Prince (Centre-ville)</option>
                    <option value="Aéroport International Toussaint Louverture">Aéroport Toussaint Louverture (PAP)</option>
                    <option value="Pétion-Ville">Pétion-Ville</option>
                    <option value="Cap-Haïtien">Cap-Haïtien</option>
                    <option value="Jacmel">Jacmel</option>
                    <option value="Les Cayes">Les Cayes</option>
                    <option value="Gonaïves">Gonaïves</option>
                    <option value="Ouanaminthe">Ouanaminthe</option>
                    <option value="Saint-Marc">Saint-Marc</option>
                    <option value="Montrouis (Côte des Arcadins)">Montrouis (Côte des Arcadins)</option>
                    <option value="Delmas">Delmas</option>
                    <option value="Tabarre">Tabarre</option>
                  </datalist>
                </div>

                {/* Lieu d'arrivée (Destination) avec saisie libre et suggestions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                      Destination d'arrivée
                    </label>
                    <span style={{ fontSize: '11px', color: '#0052cc', fontWeight: 600 }}>
                      Saisie libre ou suggestions
                    </span>
                  </div>
                  <input
                    type="text"
                    list="destinations-list"
                    value={reqDestination}
                    onChange={(e) => setReqDestination(e.target.value)}
                    placeholder="Tapez votre lieu d'arrivée (ex: Cap-Haïtien, Jacmel, Hôtel Karibe, Labadee...)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  <datalist id="destinations-list">
                    <option value="Cap-Haïtien">Cap-Haïtien (Nord)</option>
                    <option value="Port-au-Prince">Port-au-Prince</option>
                    <option value="Aéroport International Toussaint Louverture">Aéroport Toussaint Louverture (PAP)</option>
                    <option value="Jacmel">Jacmel (Sud-Est)</option>
                    <option value="Les Cayes">Les Cayes (Sud)</option>
                    <option value="Gonaïves">Gonaïves (Artibonite)</option>
                    <option value="Ouanaminthe">Ouanaminthe (Frontière Nord)</option>
                    <option value="Pétion-Ville">Pétion-Ville</option>
                    <option value="Côte des Arcadins (Montrouis)">Côte des Arcadins</option>
                    <option value="Labadee">Labadee</option>
                    <option value="Miragoâne">Miragoâne</option>
                    <option value="Jérémie">Jérémie</option>
                  </datalist>
                </div>

                {/* Adresse précise ou point de rendez-vous (Optionnel) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Adresse précise ou repère de rendez-vous (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={reqPickupAddress}
                    onChange={(e) => setReqPickupAddress(e.target.value)}
                    placeholder="Ex: N° rue, nom de l'hôtel, barrière, quartier..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Date & Heure */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Date du trajet
                    </label>
                    <input
                      type="date"
                      value={reqDate}
                      onChange={(e) => setReqDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Heure de départ
                    </label>
                    <input
                      type="time"
                      value={reqTime}
                      onChange={(e) => setReqTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Véhicule souhaité avec saisie libre */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                      Véhicule proposé / souhaité
                    </label>
                    <span style={{ fontSize: '11px', color: '#0052cc', fontWeight: 600 }}>
                      Saisie libre ou suggestions
                    </span>
                  </div>
                  <input
                    type="text"
                    list="vehicles-list"
                    value={reqVehicle}
                    onChange={(e) => setReqVehicle(e.target.value)}
                    placeholder="Sélectionnez ou écrivez votre véhicule (ex: Toyota Hiace, SUV Lexus...)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  <datalist id="vehicles-list">
                    <option value="Toyota Hiace">Toyota Hiace (Minibus 14 places climatisé)</option>
                    <option value="Minibus Coaster">Toyota Coaster VIP (30 places climatisé)</option>
                    <option value="Minivan Toyota Noah">Toyota Noah / Voxy (Minivan 7 places)</option>
                    <option value="SUV VIP Lexus / Prado">SUV VIP Prado / Lexus (4 places Premium)</option>
                    <option value="Berline Confort">Berline Confort (4 places)</option>
                    <option value="Autocar Grande Capacité">Autocar Grande Capacité (50 places)</option>
                    <option value="Pick-up 4x4 Sécurisé">Pick-up 4x4 Sécurisé</option>
                  </datalist>
                </div>

                {/* Passagers & Type de prestation avec saisie libre */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Passagers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={reqPassengers}
                      onChange={(e) => setReqPassengers(parseInt(e.target.value, 10) || 1)}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none',
                        fontWeight: 700
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Catégorie de prestation
                    </label>
                    <input
                      type="text"
                      list="services-list"
                      value={reqServiceType}
                      onChange={(e) => setReqServiceType(e.target.value)}
                      placeholder="Ex: Transport de personnes, Navette VIP..."
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                    <datalist id="services-list">
                      <option value="Transport de personnes">Transport de personnes</option>
                      <option value="Transfert VIP Aéroport">Transfert VIP Aéroport</option>
                      <option value="Circuit Découverte Touristique">Circuit Découverte Touristique</option>
                      <option value="Délégation & Événement">Délégation & Événement</option>
                      <option value="Navette Scolaire & Entreprise">Navette Scolaire & Entreprise</option>
                      <option value="Mise à disposition avec chauffeur">Mise à disposition avec chauffeur</option>
                    </datalist>
                  </div>
                </div>

                {/* Précisions & Remarques */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Notes & instructions particulières
                  </label>
                  <textarea
                    rows={2}
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '12.5px',
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Précisez un arrêt, bagages volumineux, etc."
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Informations du Client Demandeur */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  👤
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    2. Coordonnées de contact
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Inscrites sur le document officiel de devis
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    placeholder={clientName}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={customClientPhone}
                      onChange={(e) => setCustomClientPhone(e.target.value)}
                      placeholder={profile?.telephone || '+509 37 12 45 67'}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={customClientEmail}
                      onChange={(e) => setCustomClientEmail(e.target.value)}
                      placeholder={profile?.email || user?.email || 'jean.baptiste@gmail.com'}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Notice & Bouton d'Envoi */}
            <div style={{
              background: '#eff6ff',
              borderRadius: '16px',
              border: '1px solid #bfdbfe',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>🛡️</span>
                <p style={{ fontSize: '12.5px', color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
                  <strong>Transmission directe :</strong> Votre demande sera instantanément adressée aux personnes habilitées (Administration, Direction et Comptabilité) pour validation et conversion en facture officielle.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSendQuoteRequest()}
                disabled={isSubmittingReq}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: isSubmittingReq ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingReq ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)'
                }}
                className="hover:brightness-105 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{isSubmittingReq ? 'Envoi en cours...' : 'Envoyer la demande de devis'}</span>
              </button>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: Live A4 Document Sheet (Matches Screenshot) ================= */}
          <div 
            style={{
              height: '1351px',
              width: '800px',
              background: '#e2e8f0',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              padding: '24px 16px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.04)',
              overflowX: 'auto'
            }}
          >
            {/* A4 Document Toolbar */}
            <div style={{
              width: '100%',
              maxWidth: '794px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              background: '#ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.3px'
                }}>
                  <span>📄</span>
                  <span>FORMAT A4 (210 × 297 mm)</span>
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Ratio 1:1.414 · Conforme Impression & PDF
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  className="hover:bg-slate-100 transition-colors"
                  title="Télécharger l'aperçu officiel du devis au format PDF"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Télécharger en PDF</span>
                </button>
              </div>
            </div>

            {/* Official ISO A4 Paper Sheet (794px × 1123px standard proportion at 96 DPI) */}
            <div 
              id="quote-preview-a4-sheet"
              style={{
                width: '100%',
                maxWidth: '794px',
                minHeight: '1123px',
                aspectRatio: '210 / 297',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 5px 15px rgba(0, 0, 0, 0.06)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* Top Printable Body */}
              <div style={{ padding: '44px 48px 24px', flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
                
                {/* Header: Company Brand on Left & DEVIS Badge on Right */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '20px',
                  marginBottom: '28px'
                }}>
                  {/* Left Brand block with logo */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <img
                      src="/logo-laperle.jpg"
                      alt="Laperle Tour HT"
                      style={{
                        width: '84px',
                        height: '84px',
                        objectFit: 'contain',
                        borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#082b70', margin: '0 0 2px', lineHeight: 1.1 }}>
                        <span style={{ color: '#0052cc' }}>Laperle Tour </span>
                        <span style={{ color: '#f59e0b' }}>HT</span>
                      </h2>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#082b70', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Transport & Tourisme
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
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
                        marginBottom: '10px'
                      }}
                    >
                      DEVIS
                    </div>

                    {/* Clickable link to PDF/print: "CEST UN LIEN QUI OUVRE LA PAGE PDF" */}
                    <div style={{ marginBottom: '6px' }}>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        title="Cliquer pour ouvrir et télécharger la version PDF officielle"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '18px',
                          fontWeight: 800,
                          color: '#0052cc',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        className="hover:text-blue-800"
                      >
                        <span>N° {nextDevisNumber}</span>
                        <span style={{ fontSize: '11px', textDecoration: 'none', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>PDF ↗</span>
                      </button>
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
                      <div><strong>Date d'émission :</strong> &nbsp;{todayFormatted}</div>
                      <div><strong>Date de validité :</strong> &nbsp;{validityFormatted}</div>
                    </div>
                  </div>
                </div>

                {/* 2 Information Boxes: Left = Devis pour, Right = Trajet */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '28px'
                }} className="client-quote-boxes">
                  
                  {/* Box Left: Devis pour */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px 20px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                      Devis pour :
                    </div>
                    <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <span>👤</span>
                        <span>{displayClientName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                        <span>📞</span>
                        <span>{displayClientPhone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                        <span>✉️</span>
                        <span>{displayClientEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Box Right: Trajet & Déplacement */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px 20px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#0f172a' }}>Trajet :</strong>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{reqOrigin} → {reqDestination}</span>
                      </div>
                      {reqPickupAddress && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: '#0f172a' }}>Point de prise en charge :</strong>
                          <span style={{ color: '#475569' }}>{reqPickupAddress}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#0f172a' }}>Date :</strong>
                        <span style={{ color: '#475569' }}>{displayTravelDateTime}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#0f172a' }}>Véhicule proposé :</strong>
                        <span style={{ color: '#475569' }}>{reqVehicle}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: '#0f172a' }}>Passagers :</strong>
                        <span style={{ color: '#475569' }}>{reqPassengers}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Prestations Table */}
                <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#082b70', color: '#ffffff', fontSize: '13px', fontWeight: 800 }}>
                        <th style={{ padding: '10px 14px', borderRadius: '6px 0 0 6px' }}>Description</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '90px' }}>Quantité</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '150px' }}>Prix unitaire (HTG)</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '150px', borderRadius: '0 6px 6px 0' }}>Montant (HTG)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                            {reqServiceType}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {reqOrigin} → {reqDestination} ({reqVehicle})
                            {reqPickupAddress ? ` · ${reqPickupAddress}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center', color: '#0f172a', fontWeight: 600, fontSize: '13.5px' }}>
                          1
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: '#0f172a', fontWeight: 600, fontSize: '13.5px', fontVariantNumeric: 'tabular-nums' }}>
                          {estimatedAmount.toLocaleString('fr-FR')},00
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: '#0f172a', fontWeight: 700, fontSize: '13.5px', fontVariantNumeric: 'tabular-nums' }}>
                          {estimatedAmount.toLocaleString('fr-FR')},00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
                  <div style={{ width: '330px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                      <span style={{ fontWeight: 700 }}>Sous-total</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {estimatedAmount.toLocaleString('fr-FR')},00 HTG
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>TVA (0 %)</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>0,00 HTG</span>
                    </div>
                    <div 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#dbeafe',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginTop: '4px'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#0052cc', display: 'block' }}>Total du devis</span>
                        {!isStandardPricing && (
                          <span style={{ fontSize: '10.5px', color: '#1e40af', fontWeight: 700, display: 'block', marginTop: '1px' }}>
                            Estimation · À chiffrer par l'agence
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 900, fontSize: '18px', color: '#0052cc', fontVariantNumeric: 'tabular-nums' }}>
                        {estimatedAmount.toLocaleString('fr-FR')},00 HTG
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes at Bottom */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: 'auto'
                }}>
                  <span style={{ color: '#0052cc', fontWeight: 800 }}>ℹ️</span>
                  <div>
                    <strong>Notes :</strong>
                    <div style={{ marginTop: '2px' }}>
                      {reqNotes || `Ce devis est valable jusqu'au ${validityFormatted}. Pour confirmer, veuillez accepter le devis.`}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Elements of A4 Sheet: Page numbering and Decorative wave */}
              <div style={{ marginTop: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 48px 12px',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <span>Laperle Tour HT · Société de Transport & Tourisme d'Haïti</span>
                  <span style={{ fontWeight: 700 }}>Page 1 / 1</span>
                </div>

                {/* Signature Bottom Decorative Wave */}
                <div style={{
                  height: '14px',
                  width: '100%',
                  background: 'linear-gradient(90deg, #0052cc 0%, #2563eb 50%, #f59e0b 100%)'
                }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: MAIN LIST VIEW OF DEVIS (viewMode === 'list')
  // =========================================================================
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Mes devis
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Consultez vos estimations tarifaires officielles et validez vos trajets en un clic.
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
        {/* Total Devis */}
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
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Devis reçus</div>
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
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>À confirmer</div>
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

        {/* Refusés / Expirés */}
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

      {/* 3. Action Callout Banner: "Demande de devis" */}
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
              Demande de devis & tarification
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Besoin d'un chiffrage pour un événement, circuit ou transfert ? Obtenez une estimation détaillée.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('new-request')}
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
          className="hover:brightness-105 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Demander un devis</span>
        </button>
      </div>

      {/* 4. Main White Card: "Mes devis" */}
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
            Mes devis
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

        {/* Table of Devis */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12.5px', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px' }}>N° de devis</th>
                <th style={{ padding: '12px 14px' }}>Trajet / Prestation</th>
                <th style={{ padding: '12px 14px' }}>Date & Validité</th>
                <th style={{ padding: '12px 14px' }}>Montant total</th>
                <th style={{ padding: '12px 14px' }}>Statut</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProformas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📄</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Aucun devis trouvé</div>
                    <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748b', marginBottom: '16px' }}>
                      Cliquez sur « Demander un devis » pour soumettre votre premier besoin tarifaire.
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('new-request')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Demander un devis maintenant
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProformas.map((p) => {
                  const amount = p.totalTTC || p.amount || 0;
                  const htgText = formatHTG(amount, p.currency);

                  const actionItems: ActionMenuItem[] = [
                    {
                      label: 'Consulter le devis A4',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ),
                      onClick: () => setSelectedProforma(p),
                      variant: 'primary'
                    },
                    ...(p.status !== 'Acceptée' && p.status !== 'Convertie en facture' ? [
                      {
                        label: 'Accepter le devis en 1 clic',
                        icon: (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ),
                        onClick: async () => {
                          await convertProformaToFacture(p);
                          showToast(`Devis ${p.number} accepté ! Redirection vers votre facture...`, 'success');
                          setCurrentModule('factures');
                        },
                        variant: 'success' as const
                      }
                    ] : []),
                    {
                      label: 'Télécharger en PDF',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      ),
                      onClick: () => {
                        setSelectedProforma(p);
                        setTimeout(() => window.print(), 350);
                      }
                    },
                    {
                      label: 'Demander la facture officielle',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      ),
                      onClick: async () => {
                        try {
                          await requestDocumentSend(
                            'facture',
                            p.number,
                            amount,
                            'both',
                            `Le client ${p.client} a accepté le devis ${p.number} et demande la facture officielle avec coordonnées de règlement.`
                          );
                          showToast(`Votre demande de facture pour le devis ${p.number} a été transmise à la comptabilité !`, 'success');
                        } catch {
                          showToast('Demande enregistrée avec succès !', 'success');
                        }
                      }
                    },
                    {
                      label: 'Confirmer sur WhatsApp',
                      icon: (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      ),
                      href: `https://wa.me/${officialWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour LAPERLE TOUR HT, je valide le devis N° ${p.number} (${htgText}) et je souhaite obtenir ma facture pour effectuer le paiement.`)}`
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
                      {/* N° de devis (clickable to open A4 / PDF) */}
                      <td style={{ padding: '14px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedProforma(p)}
                          title="Cliquer pour afficher le devis A4 officiel"
                          style={{
                            background: '#eff6ff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            color: '#1d4ed8',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            letterSpacing: '0.2px'
                          }}
                          className="hover:bg-blue-100 transition-colors"
                        >
                          {p.number}
                        </button>
                      </td>

                      {/* Trajet / Prestation */}
                      <td style={{ padding: '14px', color: '#1e293b', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{p.service || 'Circuit Touristique & Transport VIP'}</span>
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
                          <span>Émis : {p.date} · Expire : {p.dueDate || '7 jours'}</span>
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
