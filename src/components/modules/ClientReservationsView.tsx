import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { type Reservation } from '../../types';

interface ClientReservationsViewProps {
  onOpenModal?: (type: string, data?: any) => void;
}

export const ClientReservationsView: React.FC<ClientReservationsViewProps> = ({ onOpenModal }) => {
  const { 
    reservations, 
    saveReservation, 
    addNotification, 
    showToast, 
    setPrintSheetData, 
    proformas,
    clientReservationViewMode,
    setClientReservationViewMode
  } = useApp();
  
  const { user, profile } = useAuth();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedResForDetail, setSelectedResForDetail] = useState<Reservation | null>(null);

  // Form state
  const [service, setService] = useState('Transport de personnes');
  const [trajet, setTrajet] = useState('Aller simple');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('08:00');
  const [passengers, setPassengers] = useState<number>(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Minibus (9 – 15 places)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const viewMode = clientReservationViewMode || 'list';
  const setViewMode = setClientReservationViewMode;

  const DEFAULT_CLIENT_RESERVATIONS: Reservation[] = useMemo(() => [
    {
      id: 'RES-2025-0032',
      dossierId: 'DOS-0032',
      client: profile?.nom || 'Jean Baptiste',
      origin: 'Port-au-Prince',
      destination: 'Cap-Haïtien',
      date: '2025-01-28',
      time: '08:00',
      service: 'Transport de personnes',
      trajet: 'Aller simple',
      vehicle: 'Toyota Hiace',
      vehicule: 'Toyota Hiace',
      status: 'Confirmée',
      passengers: 4,
      amount: 180,
      currency: 'USD',
      createdAt: '2025-01-28T08:00:00Z',
      updatedAt: '2025-01-28T08:00:00Z'
    },
    {
      id: 'RES-2025-0031',
      dossierId: 'DOS-0031',
      client: profile?.nom || 'Jean Baptiste',
      origin: 'Pétion-Ville',
      destination: 'Jacmel',
      date: '2025-01-27',
      time: '10:30',
      service: 'Transport de personnes',
      trajet: 'Aller-retour',
      vehicle: 'Hyundai H1',
      vehicule: 'Hyundai H1',
      status: 'En cours',
      passengers: 2,
      amount: 140,
      currency: 'USD',
      createdAt: '2025-01-27T10:30:00Z',
      updatedAt: '2025-01-27T10:30:00Z'
    },
    {
      id: 'RES-2025-0030',
      dossierId: 'DOS-0030',
      client: profile?.nom || 'Jean Baptiste',
      origin: 'Port-au-Prince',
      destination: 'Les Cayes',
      date: '2025-01-26',
      time: '07:00',
      service: 'Transport de groupe',
      trajet: 'Aller simple',
      vehicle: 'Bus 30 places',
      vehicule: 'Bus 30 places',
      status: 'Terminée',
      passengers: 28,
      amount: 350,
      currency: 'USD',
      createdAt: '2025-01-26T07:00:00Z',
      updatedAt: '2025-01-26T07:00:00Z'
    },
    {
      id: 'RES-2025-0029',
      dossierId: 'DOS-0029',
      client: profile?.nom || 'Jean Baptiste',
      origin: 'Gonaïves',
      destination: 'Port-au-Prince',
      date: '2025-01-25',
      time: '15:00',
      service: 'Transport de personnes',
      trajet: 'Aller simple',
      vehicle: 'Toyota Coaster',
      vehicule: 'Toyota Coaster',
      status: 'Confirmée',
      passengers: 12,
      amount: 220,
      currency: 'USD',
      createdAt: '2025-01-25T15:00:00Z',
      updatedAt: '2025-01-25T15:00:00Z'
    },
    {
      id: 'RES-2025-0028',
      dossierId: 'DOS-0028',
      client: profile?.nom || 'Jean Baptiste',
      origin: 'Port-au-Prince',
      destination: 'Cap-Haïtien',
      date: '2025-01-24',
      time: '09:00',
      service: 'Transport de personnes',
      trajet: 'Aller simple',
      vehicle: 'Hyundai H1',
      vehicule: 'Hyundai H1',
      status: 'Annulée',
      passengers: 3,
      amount: 180,
      currency: 'USD',
      createdAt: '2025-01-24T09:00:00Z',
      updatedAt: '2025-01-24T09:00:00Z'
    }
  ], [profile?.nom]);

  const activeReservationList = reservations.length > 0 ? reservations : DEFAULT_CLIENT_RESERVATIONS;

  // Filtered reservations for the client
  const filteredReservations = useMemo(() => {
    return activeReservationList.filter((r) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'En cours') {
          if (r.status !== 'En cours' && r.status !== 'En attente') return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchId = r.id?.toLowerCase().includes(query);
        const matchOrigin = r.origin?.toLowerCase().includes(query);
        const matchDest = r.destination?.toLowerCase().includes(query);
        const matchService = r.service?.toLowerCase().includes(query);
        const matchVehicule = (r.vehicle || r.vehicule)?.toLowerCase().includes(query);
        return matchId || matchOrigin || matchDest || matchService || matchVehicule;
      }

      return true;
    });
  }, [activeReservationList, statusFilter, searchTerm]);

  // Dynamic KPI Stats
  const totalCount = activeReservationList.length;
  const confirmedCount = activeReservationList.filter((r) => r.status === 'Confirmée').length;
  const inProgressCount = activeReservationList.filter((r) => r.status === 'En cours' || r.status === 'En attente').length;
  const cancelledCount = activeReservationList.filter((r) => r.status === 'Annulée').length;
  const completedCount = activeReservationList.filter((r) => r.status === 'Terminée').length;

  // Vehicle choices for Step 2
  const vehicleOptions = [
    {
      id: 'minibus',
      name: 'Minibus',
      capacity: '9 – 15 places',
      fullName: 'Minibus (9 – 15 places)',
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="3" />
          <path d="M6 10h3v4H6z" />
          <path d="M11 10h3v4h-3z" />
          <path d="M16 10h2v4h-2z" />
          <circle cx="6.5" cy="18" r="2" />
          <circle cx="17.5" cy="18" r="2" />
        </svg>
      )
    },
    {
      id: 'bus',
      name: 'Bus',
      capacity: '20 – 30 places',
      fullName: 'Bus (20 – 30 places)',
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="15" rx="3" />
          <line x1="3" y1="11" x2="21" y2="11" />
          <circle cx="7" cy="19" r="2" />
          <circle cx="17" cy="19" r="2" />
          <path d="M7 7h2v2H7z" />
          <path d="M15 7h2v2h-2z" />
        </svg>
      )
    },
    {
      id: 'coaster',
      name: 'Coaster',
      capacity: '16 – 25 places',
      fullName: 'Coaster (16 – 25 places)',
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="11" rx="2.5" />
          <path d="M5 10h4v3H5z" />
          <path d="M11 10h4v3h-4z" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      )
    },
    {
      id: 'voiture',
      name: 'Voiture',
      capacity: '1 – 4 places',
      fullName: 'Voiture (1 – 4 places)',
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H8c-.6 0-1.1.2-1.5.6L3.8 10.3C3.3 10.7 3 11.3 3 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      )
    }
  ];

  // Reset form
  const handleResetForm = () => {
    setService('Transport de personnes');
    setTrajet('Aller simple');
    setOrigin('');
    setDestination('');
    setDate(() => new Date().toISOString().split('T')[0]);
    setTime('08:00');
    setPassengers(1);
    setSelectedVehicle('Minibus (9 – 15 places)');
    setNotes('');
    setFormErrors({});
  };

  // Submit new reservation
  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: Record<string, string> = {};
    if (!service.trim()) errors.service = 'Le type de service est obligatoire';
    if (!trajet.trim()) errors.trajet = 'Le type de trajet est obligatoire';
    if (!origin.trim()) errors.origin = 'Le lieu de départ est obligatoire';
    if (!destination.trim()) errors.destination = 'Le lieu d\'arrivée est obligatoire';
    if (!date) errors.date = 'La date de départ est obligatoire';
    if (!time.trim()) errors.time = 'L\'heure de départ est obligatoire';
    if (!passengers || passengers < 1) errors.passengers = 'Au moins 1 passager requis';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Veuillez renseigner tous les champs obligatoires (*)', 'warning');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      // Generate clean unique reservation number matching format RES-2025-XXXX
      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const uniqueResNumber = `RES-${currentYear}-${randomSuffix}`;
      const dossierId = `DOS-${randomSuffix}`;

      const clientName = profile?.nom || profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Client';
      const clientEmail = user?.email || profile?.email || '';
      const clientPhone = profile?.telephone || profile?.phone || '';

      const newReservation: Partial<Reservation> = {
        id: uniqueResNumber,
        dossierId,
        client: clientName,
        clientId: user?.uid,
        uid: user?.uid,
        email: clientEmail,
        telephone: clientPhone,
        service: service.trim(),
        trajet: trajet.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        date,
        time,
        passengers: Number(passengers),
        vehicle: selectedVehicle || 'Non spécifié',
        vehicule: selectedVehicle || 'Non spécifié',
        notes: notes.trim(),
        status: 'En attente',
        amount: 0,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false
      };

      // Save to Firebase / Firestore via AppContext
      await saveReservation(newReservation);

      // Notify administrator and secretary
      await addNotification({
        title: `Nouvelle réservation : ${uniqueResNumber}`,
        message: `${clientName} a soumis une demande de transport : ${origin} ➔ ${destination} (${service}, le ${date} à ${time}).`,
        type: 'info',
        link: 'reservations',
        targetId: uniqueResNumber,
        targetAudience: 'admin',
        authorUid: user?.uid
      });

      showToast(`Réservation ${uniqueResNumber} enregistrée avec succès ! Notre équipe vous répondra rapidement.`, 'success');

      // Reset and return to list
      handleResetForm();
      setViewMode('list');
    } catch (err: any) {
      console.error('Erreur enregistrement réservation client:', err);
      showToast(`Erreur lors de la réservation : ${err?.message || 'Veuillez réessayer.'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmée':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#dcfce7',
            color: '#15803d'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Confirmée
          </span>
        );
      case 'En cours':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#fef3c7',
            color: '#b45309'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            En cours
          </span>
        );
      case 'En attente':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#e0f2fe',
            color: '#0369a1'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            En attente
          </span>
        );
      case 'Terminée':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#f3e8ff',
            color: '#7e22ce'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Terminée
          </span>
        );
      case 'Annulée':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#fee2e2',
            color: '#b91c1c'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Annulée
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#f1f5f9',
            color: '#475569'
          }}>
            {status}
          </span>
        );
    }
  };

  // Format date helper: "28 janv. 2025 à 08:00"
  const formatTripDateTime = (rDate?: string, rTime?: string) => {
    if (!rDate) return '—';
    try {
      const d = new Date(rDate);
      const formattedDate = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      return rTime ? `${formattedDate} à ${rTime}` : formattedDate;
    } catch {
      return `${rDate} ${rTime || ''}`.trim();
    }
  };

  // Open Proforma associated with reservation
  const handleOpenProforma = (r: Reservation) => {
    const matching = proformas.find((p) => p.dossierId === r.dossierId || p.dossierId === r.id || p.reservationId === r.id);
    if (matching) {
      setPrintSheetData({ type: 'proforma', data: matching });
    } else {
      showToast(`Le devis chiffré pour la réservation ${r.id} est en cours de préparation par notre secrétariat.`, 'info');
    }
  };

  // =========================================================================
  // VIEW 1: NOUVELLE RÉSERVATION (Screenshot 1 Exact Layout)
  // =========================================================================
  if (viewMode === 'new') {
    return (
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 20px 48px' }}>
        {/* Top Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#64748b' }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1e293b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Espace Client</span>
            </button>
            <span style={{ color: '#94a3b8' }}>›</span>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 500 }}
            >
              Réservations
            </button>
            <span style={{ color: '#94a3b8' }}>›</span>
            <span style={{ color: '#0f172a', fontWeight: 700 }}>Nouvelle réservation</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#dc2626',
                border: '1.5px solid #fff'
              }} />
            </div>
            <div style={{ cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
        </div>

        {/* Header Title with Blue Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            flexShrink: 0
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M12 14v4" />
              <path d="M10 16h4" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Nouvelle réservation
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Soumettez votre demande de transport, notre équipe vous répondra rapidement.
            </p>
          </div>
        </div>

        {/* Main 2-Column Content */}
        <form onSubmit={handleSubmitReservation}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: 3 Step Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* STEP 1: Informations du trajet */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    1
                  </div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Informations du trajet
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Type de service */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Type de service <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="12" rx="2" />
                          <circle cx="6.5" cy="15.5" r="1.5" />
                          <circle cx="17.5" cy="15.5" r="1.5" />
                        </svg>
                      </div>
                      <select
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: formErrors.service ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      >
                        <option value="Transport de personnes">Transport de personnes</option>
                        <option value="Navette VIP & Transfert Aéroport">Navette VIP & Transfert Aéroport</option>
                        <option value="Circuit Touristique & Escapade">Circuit Touristique & Escapade</option>
                        <option value="Transport Scolaire">Transport Scolaire</option>
                        <option value="Location avec Chauffeur">Location avec Chauffeur</option>
                      </select>
                    </div>
                    {formErrors.service && <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '3px', display: 'block' }}>{formErrors.service}</span>}
                  </div>

                  {/* Type de trajet */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Type de trajet <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="17 11 21 7 17 3" />
                          <line x1="21" y1="7" x2="9" y2="7" />
                          <polyline points="7 21 3 17 7 13" />
                          <line x1="3" y1="17" x2="15" y2="17" />
                        </svg>
                      </div>
                      <select
                        value={trajet}
                        onChange={(e) => setTrajet(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: formErrors.trajet ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      >
                        <option value="Aller simple">Aller simple</option>
                        <option value="Aller-retour">Aller-retour</option>
                      </select>
                    </div>
                    {formErrors.trajet && <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '3px', display: 'block' }}>{formErrors.trajet}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Lieu de départ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Lieu de départ <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Ex. Port-au-Prince"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: formErrors.origin ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {formErrors.origin && <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '3px', display: 'block' }}>{formErrors.origin}</span>}
                  </div>

                  {/* Lieu d'arrivée */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Lieu d'arrivée <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Ex. Cap-Haïtien"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: formErrors.destination ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {formErrors.destination && <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '3px', display: 'block' }}>{formErrors.destination}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
                  {/* Date de départ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Date de départ <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: formErrors.date ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {formErrors.date && <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '3px', display: 'block' }}>{formErrors.date}</span>}
                  </div>

                  {/* Heure de départ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Heure de départ <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: formErrors.time ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      >
                        {['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    {formErrors.time && <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '3px', display: 'block' }}>{formErrors.time}</span>}
                  </div>

                  {/* Nombre de passagers */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Nombre de passagers <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: formErrors.passengers ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30].map((num) => (
                          <option key={num} value={num}>{num} {num > 1 ? 'personnes' : 'personne'}</option>
                        ))}
                      </select>
                    </div>
                    {formErrors.passengers && <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '3px', display: 'block' }}>{formErrors.passengers}</span>}
                  </div>
                </div>
              </div>

              {/* STEP 2: Véhicule (optionnel) */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    2
                  </div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Véhicule (optionnel)
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  {vehicleOptions.map((v) => {
                    const isSelected = selectedVehicle === v.fullName;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicle(isSelected ? '' : v.fullName)}
                        style={{
                          position: 'relative',
                          border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          borderRadius: '12px',
                          padding: '18px 12px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none'
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#2563eb',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}

                        <div style={{ color: isSelected ? '#2563eb' : '#64748b', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                          {v.icon}
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#1e40af' : '#0f172a', marginBottom: '2px' }}>
                          {v.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                          ({v.capacity})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Informations complémentaires */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    3
                  </div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Informations complémentaires
                  </h2>
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={4}
                    placeholder="Précisez vos besoins (arrêts, bagages, aller-retour, etc.)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Showcase Banner + Live Recap + Notice + Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Vehicle Showcase Image Card */}
              <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                height: '140px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              }}>
                <img
                  src="/navette-scolaire.jpg"
                  alt="Véhicule de transport LAPERLE"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 40%',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.4) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.4) 100%)'
                }} />
              </div>

              {/* Récapitulatif de la demande */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Récapitulatif de la demande
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="12" rx="2" />
                      <circle cx="6.5" cy="15.5" r="1.5" />
                      <circle cx="17.5" cy="15.5" r="1.5" />
                    </svg>
                    <span><strong>Service :</strong> {service || '—'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <polyline points="17 11 21 7 17 3" />
                      <line x1="21" y1="7" x2="9" y2="7" />
                      <polyline points="7 21 3 17 7 13" />
                      <line x1="3" y1="17" x2="15" y2="17" />
                    </svg>
                    <span><strong>Trajet :</strong> {trajet || '—'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span><strong>Départ :</strong> {origin || '—'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span><strong>Arrivée :</strong> {destination || '—'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span><strong>Date :</strong> {date ? `${date} à ${time}` : '—'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <span><strong>Passagers :</strong> {passengers}</span>
                  </div>

                  {selectedVehicle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="15" rx="3" />
                        <line x1="3" y1="11" x2="21" y2="11" />
                      </svg>
                      <span><strong>Véhicule :</strong> {selectedVehicle}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice Card: Après l'envoi de votre demande */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Après l'envoi de votre demande
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ color: '#16a34a', marginTop: '1px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Votre demande sera transmise à notre secrétaire.</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ color: '#16a34a', marginTop: '1px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Nous vous contacterons pour confirmation.</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ color: '#16a34a', marginTop: '1px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Un devis (proforma) vous sera ensuite envoyé.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Annuler & Envoyer la demande */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setViewMode('list');
                  }}
                  style={{
                    flex: '1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '13px 20px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Annuler</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: '1.6',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '13px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isSubmitting ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}</span>
                </button>
              </div>

            </div>

          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LISTE DES RÉSERVATIONS (Screenshot 2 Exact Layout)
  // =========================================================================
  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 20px 48px' }}>
      
      {/* Top Banner Header with Scenic Image */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M12 14v4" />
              <path d="M10 16h4" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Réservations
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Gérez vos demandes de réservation et suivez leur avancement.
            </p>
          </div>
        </div>

        {/* Scenic Van Showcase Banner on Header Right */}
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
            src="/navette-scolaire.jpg"
            alt="Flotte VIP"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
              maskImage: 'linear-gradient(to right, transparent 0%, black 35%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 35%)'
            }}
          />
        </div>
      </div>

      {/* 5 Stat KPI Cards in a row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Demandes totales</div>
          </div>
        </div>

        {/* Confirmées */}
        <div 
          onClick={() => setStatusFilter('Confirmée')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'Confirmée' ? '2px solid #16a34a' : '1px solid #e2e8f0',
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
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{confirmedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Confirmées</div>
          </div>
        </div>

        {/* En cours / En attente */}
        <div 
          onClick={() => setStatusFilter('En cours')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'En cours' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
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
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{inProgressCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>En cours</div>
          </div>
        </div>

        {/* Annulée */}
        <div 
          onClick={() => setStatusFilter('Annulée')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'Annulée' ? '2px solid #dc2626' : '1px solid #e2e8f0',
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
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{cancelledCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Annulée</div>
          </div>
        </div>

        {/* Terminée */}
        <div 
          onClick={() => setStatusFilter('Terminée')}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: statusFilter === 'Terminée' ? '2px solid #7e22ce' : '1px solid #e2e8f0',
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
            background: '#faf5ff',
            color: '#7e22ce',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{completedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Terminée</div>
          </div>
        </div>
      </div>

      {/* Action Callout Banner: "Nouvelle demande de réservation" */}
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M12 14v4" />
              <path d="M10 16h4" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Nouvelle demande de réservation
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Remplissez les informations principales et notre équipe vous répondra rapidement.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('new')}
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
          <span>Nouvelle réservation</span>
        </button>
      </div>

      {/* "Mes réservations" Section with Search & Filter */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {/* Section Header with Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Mes réservations
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
                placeholder="Rechercher une réservation..."
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

            {/* Status Filter Dropdown */}
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
                <option value="Confirmée">Confirmée</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table of Reservations */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12.5px', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px' }}>N° de réservation</th>
                <th style={{ padding: '12px 14px' }}>Trajet</th>
                <th style={{ padding: '12px 14px' }}>Date & Heure</th>
                <th style={{ padding: '12px 14px' }}>Véhicule</th>
                <th style={{ padding: '12px 14px' }}>Statut</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚗</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Aucune réservation trouvée</div>
                    <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748b' }}>
                      Cliquez sur « + Nouvelle réservation » pour soumettre votre premier trajet.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
                  <tr 
                    key={r.id} 
                    style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* N° de réservation */}
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
                        {r.id}
                      </span>
                    </td>

                    {/* Trajet */}
                    <td style={{ padding: '14px', color: '#1e293b', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>
                          {r.origin || 'Port-au-Prince'} <span style={{ color: '#94a3b8' }}>➔</span> {r.destination || 'Destination'}
                        </span>
                      </div>
                    </td>

                    {/* Date & Heure */}
                    <td style={{ padding: '14px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{formatTripDateTime(r.date, r.time)}</span>
                      </div>
                    </td>

                    {/* Véhicule */}
                    <td style={{ padding: '14px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="12" rx="2" />
                          <circle cx="6.5" cy="15.5" r="1.5" />
                          <circle cx="17.5" cy="15.5" r="1.5" />
                        </svg>
                        <span>{r.vehicle || r.vehicule || 'Minibus (9 – 15 places)'}</span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td style={{ padding: '14px' }}>
                      {renderStatusBadge(r.status || 'En attente')}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {/* Eye Button: View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedResForDetail(r)}
                          title="Consulter les détails de la réservation"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* Document Button: View Proforma / Quote */}
                        <button
                          type="button"
                          onClick={() => handleOpenProforma(r)}
                          title="Voir le devis / proforma associé"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedResForDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            maxWidth: '540px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#071f4c',
              color: '#ffffff',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#93c5fd', fontWeight: 700 }}>
                  Détail de la réservation
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800 }}>
                  {selectedResForDetail.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResForDetail(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Statut opérationnel :</span>
                <div>{renderStatusBadge(selectedResForDetail.status || 'En attente')}</div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Trajet & Service</div>
                <div style={{ color: '#334155', marginBottom: '4px' }}>
                  <strong>Service :</strong> {selectedResForDetail.service || 'Transport de personnes'}
                </div>
                <div style={{ color: '#334155', marginBottom: '4px' }}>
                  <strong>Type :</strong> {selectedResForDetail.trajet || 'Aller simple'}
                </div>
                <div style={{ color: '#334155', marginBottom: '4px' }}>
                  <strong>Itinéraire :</strong> {selectedResForDetail.origin} ➔ {selectedResForDetail.destination}
                </div>
                <div style={{ color: '#334155' }}>
                  <strong>Date & Heure :</strong> {formatTripDateTime(selectedResForDetail.date, selectedResForDetail.time)}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Passagers & Véhicule</div>
                <div style={{ color: '#334155', marginBottom: '4px' }}>
                  <strong>Nombre de passagers :</strong> {selectedResForDetail.passengers || 1}
                </div>
                <div style={{ color: '#334155' }}>
                  <strong>Véhicule :</strong> {selectedResForDetail.vehicle || selectedResForDetail.vehicule || 'Minibus'}
                </div>
              </div>

              {selectedResForDetail.driver && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Chauffeur assigné</div>
                  <div style={{ color: '#16a34a', fontWeight: 600 }}>
                    {selectedResForDetail.driver} {selectedResForDetail.chauffeurTelephone ? `(${selectedResForDetail.chauffeurTelephone})` : ''}
                  </div>
                </div>
              )}

              {selectedResForDetail.notes && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Notes & Instructions</div>
                  <div style={{ color: '#64748b', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                    {selectedResForDetail.notes}
                  </div>
                </div>
              )}

              {/* Actions Footer in Modal */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleOpenProforma(selectedResForDetail)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#1e293b',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Voir le Devis / Proforma
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedResForDetail(null)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
