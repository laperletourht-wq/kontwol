import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

import { ClientProfileModal } from '../modals/ClientProfileModal';
import { UniversalFooter } from '../common/UniversalFooter';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, profile, role, logout, canAccess } = useAuth();
  const { 
    currentModule, 
    setCurrentModule, 
    clientReservationViewMode,
    setClientReservationViewMode,
    setIsPublicLanding, 
    setChatModalOpen, 
    setClientProfileModalOpen,
    setPrintSheetData,
    setGlobalSearchQuery,
    notifications, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    showToast,
    reservations,
    proformas,
    factures,
    vehicules,
    eleves,
    settings
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');
  const [currentTimeString, setCurrentTimeString] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };

    if (notifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [notifDropdownOpen]);

  // Handler to open the exact source document / record of any notification
  const handleOpenNotificationSource = (n: any) => {
    markNotificationAsRead(n.id);
    setNotifDropdownOpen(false);

    // 1. Facture source
    if (
      n.link === 'factures' || 
      n.targetId?.startsWith('FAC-') || 
      n.message.includes('FAC-') || 
      n.title.toLowerCase().includes('facture') || 
      n.title.toLowerCase().includes('paiement')
    ) {
      const matchNumber = n.targetId || (n.message.match(/FAC-[\w-]+/)?.[0]) || 'FAC-2026-001';
      const targetFacture = factures.find((f) => f.number === matchNumber || f.id === matchNumber) || factures[0];
      
      setCurrentModule('factures');
      if (targetFacture) {
        setGlobalSearchQuery(targetFacture.number);
        setPrintSheetData({ type: 'facture', data: targetFacture });
        showToast(`Source ouverte : Facture ${targetFacture.number} (${targetFacture.client})`, 'success');
      }
      return;
    }

    // 2. Proforma source
    if (
      n.link === 'proformas' || 
      n.targetId?.startsWith('PRO-') || 
      n.message.includes('PRO-') || 
      n.title.toLowerCase().includes('devis') || 
      n.title.toLowerCase().includes('proforma')
    ) {
      const matchNumber = n.targetId || (n.message.match(/PRO-[\w-]+/)?.[0]) || 'PRO-2026-001';
      const targetProforma = proformas.find((p) => p.number === matchNumber || p.id === matchNumber) || proformas[0];
      
      setCurrentModule('proformas');
      if (targetProforma) {
        setGlobalSearchQuery(targetProforma.number);
        setPrintSheetData({ type: 'proforma', data: targetProforma });
        showToast(`Source ouverte : Devis ${targetProforma.number} (${targetProforma.client})`, 'success');
      }
      return;
    }

    // 3. Réservation source
    if (
      n.link === 'reservations' || 
      n.targetId?.startsWith('RES-') || 
      n.message.includes('RES-') || 
      n.title.toLowerCase().includes('réservation') || 
      n.title.toLowerCase().includes('circuit')
    ) {
      const matchNumber = n.targetId || (n.message.match(/RES-[\w-]+/)?.[0]) || 'RES-003';
      const targetRes = reservations.find((r) => r.id === matchNumber || r.client?.toLowerCase().includes('beauvoir')) || reservations[0];
      
      setCurrentModule('reservations');
      if (targetRes) {
        setGlobalSearchQuery(targetRes.id);
        showToast(`Source ouverte : Réservation ${targetRes.id} (${targetRes.client})`, 'success');
      }
      return;
    }

    // 4. Véhicule source
    if (
      n.link === 'vehicules' || 
      n.targetId?.startsWith('VEH-') || 
      n.message.includes('BB-') || 
      n.message.includes('AA-') || 
      n.message.includes('PR-')
    ) {
      const matchPlate = n.targetId || (n.message.match(/[A-Z]{2}-\d{4,5}/)?.[0]) || '';
      const targetVeh = vehicules.find((v) => v.id === n.targetId || v.plaque === matchPlate || n.message.includes(v.plaque)) || vehicules[0];
      
      setCurrentModule('vehicules');
      if (targetVeh) {
        setGlobalSearchQuery(targetVeh.plaque);
        showToast(`Source ouverte : Fiche Véhicule ${targetVeh.modele} (${targetVeh.plaque})`, 'success');
      }
      return;
    }

    // 5. Default direct fallback
    if (n.link) {
      setCurrentModule(n.link);
      if (n.targetId) setGlobalSearchQuery(n.targetId);
      showToast(`Module ouvert : ${n.link}`, 'info');
    }
  };

  // Live Clock & Date update formatted in French matching reference: "Jeudi 22 Octobre 2026"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsWeekday: Intl.DateTimeFormatOptions = { weekday: 'long' };
      const optionsMonth: Intl.DateTimeFormatOptions = { month: 'long' };
      
      const weekday = now.toLocaleDateString('fr-FR', optionsWeekday);
      const day = now.getDate();
      const month = now.toLocaleDateString('fr-FR', optionsMonth);
      const year = now.getFullYear();

      const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
      setCurrentDateString(`${capitalize(weekday)} ${day} ${capitalize(month)} ${year}`);
      setCurrentTimeString(now.toLocaleTimeString('fr-FR'));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';
  const isStaff = !isClient && !isChauffeur;

  // Active counts for badges (scoped to the user's view)
  const activeVehiclesCount = vehicules.filter((v) => v.statut === 'Disponible' || v.statut === 'En mission').length;
  const totalVehiclesCount = vehicules.length;
  const pendingReservationsCount = reservations.filter((r) => r.status === 'En attente' || r.status === 'En cours' || r.status === 'Confirmée').length;
  const pendingProformasCount = proformas.filter((p) => p.statut === 'En attente' || p.statut === 'Brouillon').length;
  const pendingFacturesCount = factures.filter((f) => f.statut !== 'Payée').length;

  // Guard current module: if user is on a module they are not permitted to see, redirect to default
  useEffect(() => {
    if (isClient) {
      const allowedClientModules = ['reservations', 'proformas', 'factures'];
      if (!allowedClientModules.includes(currentModule)) {
        setCurrentModule('reservations');
      }
    } else if (isChauffeur) {
      const allowedDriverModules = ['plannings', 'vehicules'];
      if (!allowedDriverModules.includes(currentModule)) {
        setCurrentModule('plannings');
      }
    }
  }, [isClient, isChauffeur, currentModule, setCurrentModule]);

  // Sidebar navigation groups strictly customized per role
  const navGroups = useMemo(() => {
    if (isClient) {
      return [
        {
          title: '',
          items: [
            {
              key: 'reservations',
              label: 'Mes réservations',
              onClick: () => {
                setClientReservationViewMode('list');
                setCurrentModule('reservations');
              },
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="7" y1="14" x2="7.01" y2="14" strokeWidth="2.5"/>
                  <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5"/>
                  <line x1="17" y1="14" x2="17.01" y2="14" strokeWidth="2.5"/>
                  <line x1="7" y1="18" x2="7.01" y2="18" strokeWidth="2.5"/>
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5"/>
                  <line x1="17" y1="18" x2="17.01" y2="18" strokeWidth="2.5"/>
                </svg>
              )
            },
            {
              key: 'proformas',
              label: 'Mes devis',
              onClick: () => setCurrentModule('proformas'),
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              )
            },
            {
              key: 'factures',
              label: 'Mes factures',
              onClick: () => setCurrentModule('factures'),
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              )
            },
            {
              key: 'mon-profil',
              label: 'Mon profil',
              isAction: true,
              onClick: () => setClientProfileModalOpen(true),
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )
            },
            {
              key: 'dispatch-chat',
              label: 'Messages',
              badge: 2,
              badgeType: 'red-circle',
              isAction: true,
              onClick: () => setChatModalOpen(true),
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              )
            }
          ]
        }
      ];
    }

    if (isChauffeur) {
      return [
        {
          title: 'ESPACE CHAUFFEUR',
          items: [
            {
              key: 'plannings',
              label: 'Feuille de Route (Missions)',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              )
            },
            {
              key: 'vehicules',
              label: 'Fiche Véhicule',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="11" width="20" height="8" rx="2"/>
                  <path d="M5 11l2-5h10l2 5"/>
                  <circle cx="7" cy="16" r="2"/>
                  <circle cx="17" cy="16" r="2"/>
                </svg>
              )
            }
          ]
        },
        {
          title: 'COMMUNICATION',
          items: [
            {
              key: 'dispatch-chat',
              label: 'Radio & Dispatch',
              isAction: true,
              hasChevron: true,
              onClick: () => setChatModalOpen(true),
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              )
            }
          ]
        }
      ];
    }

    if (role === 'vendeur') {
      return [
        {
          title: 'ESPACE COMMERCIAL',
          items: [
            {
              key: 'vendeur',
              label: 'Espace Vendeur & KPI',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                </svg>
              )
            },
            {
              key: 'proformas',
              label: 'Devis & Proformas',
              badge: pendingProformasCount > 0 ? pendingProformasCount : undefined,
              badgeType: 'blue',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              )
            },
            {
              key: 'factures',
              label: 'Factures Converties',
              badge: pendingFacturesCount > 0 ? pendingFacturesCount : undefined,
              badgeType: 'red',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              )
            },
            {
              key: 'reservations',
              label: 'Demandes & Courses',
              badge: pendingReservationsCount > 0 ? pendingReservationsCount : undefined,
              badgeType: 'orange',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
              )
            },
            {
              key: 'clients',
              label: 'Portefeuille Clients',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              )
            }
          ]
        },
        {
          title: 'COMMUNICATION',
          items: [
            {
              key: 'dispatch-chat',
              label: 'Support & Dispatch',
              isAction: true,
              hasChevron: true,
              onClick: () => setChatModalOpen(true),
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              )
            }
          ]
        }
      ];
    }

    // Default: Staff / Administration / Direction / Comptabilité
    return [
      {
        title: 'TRANSPORT & OPÉRATIONS',
        items: [
          ...(canAccess('reservations') ? [
            {
              key: 'reservations',
              label: 'Réservations & Courses',
              badge: pendingReservationsCount > 0 ? pendingReservationsCount : undefined,
              badgeType: 'orange',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
              )
            }
          ] : []),
          ...(canAccess('plannings') ? [
            {
              key: 'plannings',
              label: 'Planning & Dispatch',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              )
            }
          ] : []),

          ...(canAccess('vehicules') ? [
            {
              key: 'vehicules',
              label: 'Flotte Véhicules',
              badge: totalVehiclesCount > 0 ? `${activeVehiclesCount}/${totalVehiclesCount}` : undefined,
              badgeType: 'green',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="11" width="20" height="8" rx="2"/>
                  <path d="M5 11l2-5h10l2 5"/>
                  <circle cx="7" cy="16" r="2"/>
                  <circle cx="17" cy="16" r="2"/>
                </svg>
              )
            }
          ] : []),
          ...(canAccess('chauffeurs') ? [
            {
              key: 'chauffeurs',
              label: 'Chauffeurs & Staff',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )
            }
          ] : []),
          ...(canAccess('eleves') ? [
            {
              key: 'eleves',
              label: 'Navette Scolaire',
              badge: eleves.length > 0 ? eleves.length : undefined,
              badgeType: 'purple',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              )
            }
          ] : []),
          ...(canAccess('abonnements') ? [
            {
              key: 'abonnements',
              label: 'Abonnements',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              )
            }
          ] : [])
        ]
      },
      {
        title: 'COMMERCIAL & FACTURATION',
        items: [
          ...(canAccess('clients') ? [
            {
              key: 'clients',
              label: 'Clients & Comptes',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              )
            }
          ] : []),
          ...(canAccess('proformas') ? [
            {
              key: 'proformas',
              label: 'Devis / Proformas',
              badge: pendingProformasCount > 0 ? pendingProformasCount : undefined,
              badgeType: 'blue',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              )
            }
          ] : []),
          ...(canAccess('vendeur') ? [
            {
              key: 'vendeur',
              label: 'Espace Vendeur & KPI',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              )
            }
          ] : []),
          ...(canAccess('factures') ? [
            {
              key: 'factures',
              label: 'Factures & Règlements',
              badge: pendingFacturesCount > 0 ? pendingFacturesCount : undefined,
              badgeType: 'red',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              )
            }
          ] : []),
          ...(canAccess('paiements') ? [
            {
              key: 'paiements',
              label: 'Trésorerie & Dépenses',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              )
            }
          ] : [])
        ]
      },
      {
        title: 'COMMUNICATION & ADMIN',
        items: [
          {
            key: 'dispatch-chat',
            label: 'Live Dispatch / Chat',
            isAction: true,
            hasChevron: true,
            onClick: () => setChatModalOpen(true),
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            )
          },
          ...(canAccess('utilisateurs') ? [
            {
              key: 'utilisateurs',
              label: 'Gestion Utilisateurs',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )
            }
          ] : []),
          ...(role === 'admin' ? [
            {
              key: 'parametres',
              label: 'Paramètres Société',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              )
            }
          ] : [])
        ]
      }
    ].filter((g) => g.items.length > 0);
  }, [isClient, isChauffeur, canAccess, pendingReservationsCount, pendingProformasCount, pendingFacturesCount, activeVehiclesCount, totalVehiclesCount, role]);

  // Display user information matching mockup: "Castima Moïse (Su..." with yellow "ADMIN" badge
  const userDisplayName = profile?.nom || user?.displayName || 'Castima Moïse';
  const roleDisplay = role === 'admin' ? 'ADMIN' : role === 'client' ? 'CLIENT' : role === 'prospect' ? 'CLIENT' : role.toUpperCase();
  const initialLetter = userDisplayName.charAt(0).toUpperCase() || 'C';

  const getHeaderRoleBadge = () => {
    switch (role) {
      case 'admin':
        return {
          title: 'ADMIN',
          fullLabel: 'Administrateur',
          tagline: 'Supervision & Contrôle Total',
          icon: '🛡️',
          badgeBg: '#fef3c7',
          badgeColor: '#92400e',
          borderColor: '#fde68a'
        };
      case 'secretaire':
        return {
          title: 'SECRÉTAIRE',
          fullLabel: 'Secrétariat & Accueil',
          tagline: 'Régulation & Dispatch Central',
          icon: '📋',
          badgeBg: '#fae8ff',
          badgeColor: '#86198f',
          borderColor: '#f5d0fe'
        };
      case 'chauffeur':
        return {
          title: 'CHAUFFEUR',
          fullLabel: 'Chauffeur Privé VIP',
          tagline: 'Missions & Feuilles de Route',
          icon: '🚘',
          badgeBg: '#dcfce7',
          badgeColor: '#166534',
          borderColor: '#bbf7d0'
        };
      case 'comptabilite':
        return {
          title: 'COMPTABILITÉ',
          fullLabel: 'Comptabilité & Finances',
          tagline: 'Factures, Encaissements & DGI',
          icon: '💼',
          badgeBg: '#ccfbf1',
          badgeColor: '#115e59',
          borderColor: '#99f6e4'
        };
      case 'direction':
        return {
          title: 'DIRECTION',
          fullLabel: 'Direction Générale',
          tagline: 'Supervision & Stratégie',
          icon: '🏛️',
          badgeBg: '#ede9fe',
          badgeColor: '#5b21b6',
          borderColor: '#ddd6fe'
        };
      case 'client':
      case 'prospect':
      default:
        return {
          title: 'CLIENT',
          fullLabel: 'Espace Client',
          tagline: 'Réservations, Devis & Trajets',
          icon: '👤',
          badgeBg: '#e0f2fe',
          badgeColor: '#0369a1',
          borderColor: '#bae6fd'
        };
    }
  };

  const headerRole = getHeaderRoleBadge();

  return (
    <div id="app" style={{ display: 'block' }}>
      {/* Sidebar Backdrop for Mobile */}
      <div 
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
        style={{
          display: mobileSidebarOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(6,29,71,0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 80
        }}
      />

      {/* Main Sidebar */}
      <aside 
        className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}
        id="sidebar"
      >
        {/* Mobile-only Drawer Header */}
        <div className="sidebar-mobile-bar">
          <div className="sidebar-mobile-brand" onClick={() => { setIsPublicLanding(true); setMobileSidebarOpen(false); }}>
            <div className="brand-logo-circle" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ffffff', padding: '1px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
            </div>
            <div className="sidebar-mobile-title">
              <strong>LAPERLE TOUR HT</strong>
              <small>CENTRE DE CONTRÔLE</small>
            </div>
          </div>
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Fermer le menu"
            title="Fermer le menu"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Header: Client Profile Card or Brand */}
        {isClient ? (
          <div className="sidebar-client-profile">
            <img 
              src={profile?.avatar || "/avatar-jean-baptiste.png"} 
              alt={profile?.nom || 'Jean Baptiste'} 
              className="sidebar-client-avatar"
            />
            <div className="sidebar-client-name">
              {profile?.nom || 'Jean Baptiste'}
            </div>
            <div className="sidebar-client-role">
              Client
            </div>
          </div>
        ) : (
          <div 
            className="side-brand-exact" 
            title="Consulter la vitrine publique LAPERLE TOUR HT"
            onClick={() => setIsPublicLanding(true)}
          >
            <div className="brand-logo-circle" style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffffff', padding: '2px', boxShadow: '0 3px 10px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
            </div>
            <div className="brand-titles">
              <div className="brand-name-row">
                <span className="brand-laperle">LAPERLE</span>
                <span className="brand-tour">TOUR HT</span>
              </div>
              <div className="brand-control-label">CENTRE DE CONTRÔLE</div>
            </div>
          </div>
        )}

        {/* Grouped Navigation Links */}
        <nav id="mainNav">
          {navGroups.map((group) => (
            <div key={group.title || 'group'} className="nav-group-section">
              {group.title ? (
                <span className="nav-section-title">{group.title}</span>
              ) : null}
              <div className="nav-group-list">
                {group.items.map((item) => {
                  const isAction = 'isAction' in item && item.isAction;
                  const isActive = !isAction && currentModule === item.key;
                  
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          setCurrentModule(item.key);
                        }
                        setMobileSidebarOpen(false);
                      }}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label-text">{item.label}</span>
                      
                      {item.badge !== undefined && (
                        <span className={`nav-badge ${item.badgeType || ''}`}>
                          {item.badge}
                        </span>
                      )}

                      {item.hasChevron && (
                        <span className="nav-chevron">▼</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Déconnexion Button */}
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={async () => {
            try {
              await logout();
            } finally {
              setIsPublicLanding(true);
              setCurrentModule('reservations');
            }
          }}
          title="Se déconnecter"
          style={{
            boxSizing: 'border-box',
            width: 'calc(100% - 24px)',
            maxWidth: 'calc(100% - 24px)',
            margin: 'auto 12px 18px 12px',
            flexShrink: 0
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Déconnexion</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="main">
        {/* Top Header - Exact Mockup Alignment */}
        <header className="header">
          {/* Left: Mobile hamburger + Brand + Vitrine Publique CTA button */}
          <div className="header-left">
            <button 
              className="mobile-toggle" 
              id="mobileToggle" 
              aria-label="Menu"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              ☰
            </button>

            {!isClient && (
              <div 
                className="header-brand-block" 
                title={`Espace connecté : ${headerRole.fullLabel}`}
                style={{ cursor: 'default' }}
              >
                <div 
                  className="header-role-icon-badge" 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    background: headerRole.badgeBg, 
                    color: headerRole.badgeColor,
                    border: `1.5px solid ${headerRole.borderColor}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    fontSize: '18px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  <span>{headerRole.icon}</span>
                </div>
                <div className="header-brand-names">
                  <div className="brand-title-top" style={{ gap: '6px' }}>
                    <span className="title-navy" style={{ fontSize: '15px', fontWeight: 850, letterSpacing: '0.3px' }}>
                      {headerRole.title}
                    </span>
                    <span 
                      className="header-role-full-label"
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1px 7px',
                        borderRadius: '10px',
                        background: headerRole.badgeBg,
                        color: headerRole.badgeColor,
                        border: `1px solid ${headerRole.borderColor}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}
                    >
                      {headerRole.fullLabel}
                    </span>
                  </div>
                  <span className="brand-tagline">« {headerRole.tagline} »</span>
                </div>
              </div>
            )}
          </div>

          {/* Center: Live Status & Official Rate Pill */}
          <div className="header-center">
            <div className="live-rate-pill" title="Système de dispatch actif en temps réel">
              <span className="clock-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>

              <span className="live-date-text">{currentDateString || 'Jeudi 22 Octobre 2026'}</span>

              <span className="live-clock-time">{currentTimeString || '12:31:32'}</span>

              <span className="pill-divider" aria-hidden="true">|</span>

              <span className="rate-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </span>

              <span className="rate-label">Taux Officiel :</span>
              <strong className="rate-value">$1 USD = {settings?.tauxChange || 132} HTG</strong>
            </div>
          </div>

          {/* Right: Notifications, User Profile Pill & Logout (Staff/Admin only) */}
          {!isClient && (
            <div className="header-right">
              {/* Notification Bell with Dropdown */}
              <div ref={notifDropdownRef} style={{ position: 'relative' }}>
                <button 
                  type="button"
                  className="header-bell-btn" 
                  id="notificationBtn" 
                  onClick={() => setNotifDropdownOpen((prev) => !prev)}
                  title="Notifications & Alertes de service" 
                  aria-label="Notifications"
                  aria-expanded={notifDropdownOpen}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadNotifs.length > 0 && (
                    <span className="header-red-badge">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div 
                    id="notifDropdown" 
                    className="notif-dropdown shadow-2xl" 
                    style={{
                      display: 'block',
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      width: '340px',
                      maxWidth: 'calc(100vw - 24px)',
                      background: '#ffffff',
                      boxShadow: '0 12px 30px rgba(8, 43, 112, 0.18)',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      padding: '12px',
                      zIndex: 1000
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '13px', color: '#082b70' }}>Notifications</strong>
                        <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                          {unreadNotifs.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {unreadNotifs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllNotificationsAsRead()}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 4px',
                              textDecoration: 'underline'
                            }}
                          >
                            Tout marquer lu
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={() => clearAllNotifications()}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '11px',
                              cursor: 'pointer',
                              padding: '2px 4px'
                            }}
                            title="Vider la liste"
                          >
                            Vider
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '12px', color: '#94a3b8' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" style={{ margin: '0 auto 8px' }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                          Aucune nouvelle alerte
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id}
                            onClick={() => handleOpenNotificationSource(n)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: n.read ? '#ffffff' : '#f0f9ff',
                              border: n.read ? '1px solid #f1f5f9' : '1px solid #bae6fd',
                              cursor: 'pointer',
                              marginBottom: '6px',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start'
                            }}
                            className="hover:bg-sky-50"
                            title="Cliquez pour ouvrir directement le document source"
                          >
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              marginTop: '5px',
                              flexShrink: 0,
                              background: n.read ? '#cbd5e1' : '#0284c7'
                            }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{n.title}</div>
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Aujourd'hui</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>{n.message}</div>
                              <div style={{ 
                                marginTop: '6px', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                fontSize: '10.5px', 
                                fontWeight: 700, 
                                color: '#0369a1', 
                                background: '#e0f2fe', 
                                padding: '2px 8px', 
                                borderRadius: '4px' 
                              }}>
                                <span>🔗 Ouvrir la source du document ➔</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill with Avatar, Name, Admin badge & Chevron */}
              <button 
                type="button"
                className="header-user-pill-exact"
                id="profileBtn"
                onClick={() => {
                  if (role === 'client' || role === 'prospect') {
                    setClientProfileModalOpen(true);
                  } else {
                    setCurrentModule('parametres');
                  }
                }}
                title="Paramètres de profil utilisateur"
              >
                <div className="user-avatar-navy">
                  {initialLetter}
                </div>
                <div className="user-text-column">
                  <span className="user-title-text" title={userDisplayName}>
                    {userDisplayName.length > 18 ? `${userDisplayName.slice(0, 16)}...` : userDisplayName}
                  </span>
                  <span className="user-badge-yellow">{roleDisplay}</span>
                </div>
                <span className="chevron-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </button>

              {/* Logout button (square icon border) */}
              <button 
                type="button"
                className="header-logout-square" 
                id="headerLogoutBtn" 
                title="Se déconnecter (Déconnexion immédiate)"
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  try {
                    await logout();
                  } catch (err) {
                    console.warn('Logout fallback:', err);
                  } finally {
                    setIsPublicLanding(true);
                    showToast('Vous avez été déconnecté avec succès. À bientôt !', 'info');
                    setIsLoggingOut(false);
                  }
                }}
                aria-label="Se déconnecter"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}
        </header>

        {/* Dynamic Page Container */}
        <main id="page" className="page">
          {children}
          <UniversalFooter variant="app" />
        </main>

        {/* Global Client Profile Modal */}
        <ClientProfileModal />
      </div>
    </div>
  );
};
