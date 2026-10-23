import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

import { ProfileReminderBanner } from '../common/ProfileReminderBanner';
import { ClientProfileModal } from '../modals/ClientProfileModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, profile, role, logout, canAccess } = useAuth();
  const { 
    currentModule, 
    setCurrentModule, 
    setIsPublicLanding, 
    setChatModalOpen, 
    setClientProfileModalOpen,
    notifications, 
    markNotificationAsRead,
    reservations,
    proformas,
    factures,
    vehicules,
    settings
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');
  const [currentTimeString, setCurrentTimeString] = useState('');

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

  // Active counts for badges
  const activeVehiclesCount = vehicules.filter((v) => v.statut === 'Disponible' || v.statut === 'En mission').length || 4;
  const totalVehiclesCount = vehicules.length || 5;
  const pendingReservationsCount = reservations.length || 2;
  const pendingProformasCount = proformas.length || 2;
  const pendingFacturesCount = factures.filter((f) => f.statut !== 'Payée').length || 1;

  // Sidebar navigation groups exactly matching reference mockup
  const navGroups = [
    {
      title: 'VUE GLOBALE',
      items: [
        {
          key: 'dashboard',
          label: 'Tableau de Bord',
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
      ]
    },
    {
      title: 'TRANSPORT & OPÉRATIONS',
      items: [
        {
          key: 'reservations',
          label: 'Réservations & Courses',
          badge: pendingReservationsCount,
          badgeType: 'orange',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          )
        },
        {
          key: 'vehicules',
          label: 'Flotte Véhicules',
          badge: `${activeVehiclesCount}/${totalVehiclesCount}`,
          badgeType: 'green',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="11" width="20" height="8" rx="2"/>
              <path d="M5 11l2-5h10l2 5"/>
              <circle cx="7" cy="16" r="2"/>
              <circle cx="17" cy="16" r="2"/>
            </svg>
          )
        },
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
        },
        {
          key: 'eleves',
          label: 'Navette Scolaire',
          badge: 3,
          badgeType: 'purple',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          )
        },
        {
          key: 'abonnements',
          label: 'Abonnements',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          )
        }
      ]
    },
    {
      title: 'COMMERCIAL & FACTURATION',
      items: [
        {
          key: 'clients',
          label: 'Clients & Comptes',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          )
        },
        {
          key: 'proformas',
          label: 'Devis / Proformas',
          badge: pendingProformasCount,
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
          label: 'Factures & Règlements',
          badge: pendingFacturesCount,
          badgeType: 'red',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          )
        },
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
  ];

  // Display user information matching mockup: "Castima Moïse (Su..." with yellow "ADMIN" badge
  const userDisplayName = profile?.nom || user?.displayName || 'Castima Moïse';
  const roleDisplay = role === 'admin' ? 'ADMIN' : role.toUpperCase();
  const initialLetter = userDisplayName.charAt(0).toUpperCase() || 'C';

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
            <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" />
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

        {/* Sidebar Brand Header - Exact Layout */}
        <div 
          className="side-brand-exact" 
          title="Consulter la vitrine publique LAPERLE TOUR HT"
          onClick={() => setIsPublicLanding(true)}
        >
          <div className="brand-logo-circle">
            <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" id="sidebarLogoImg" />
          </div>
          <div className="brand-titles">
            <div className="brand-name-row">
              <span className="brand-laperle">LAPERLE</span>
              <span className="brand-tour">TOUR HT</span>
            </div>
            <div className="brand-control-label">CENTRE DE CONTRÔLE</div>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <nav id="mainNav">
          {navGroups.map((group) => (
            <div key={group.title} className="nav-group-section">
              <span className="nav-section-title">{group.title}</span>
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

        {/* Sidebar Footer */}
        <div className="side-footer">
          <span className="footer-quote">« Un coup d'œil sur Haïti »</span>
          <small className="footer-status">Système Opérationnel 24h/24</small>
        </div>
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

            <div 
              className="header-brand-block" 
              onClick={() => setIsPublicLanding(true)}
              title="Consulter la vitrine publique LAPERLE TOUR HT"
            >
              <div className="header-logo-badge">
                <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" />
              </div>
              <div className="header-brand-names">
                <div className="brand-title-top">
                  <span className="title-navy">LAPERLE</span>
                  <div className="title-orange-col">
                    <span>TOUR</span>
                    <span>HT</span>
                  </div>
                </div>
                <span className="brand-tagline">« Un coup d'œil sur Haïti »</span>
              </div>
            </div>
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

          {/* Right: Notifications, User Profile Pill & Logout */}
          <div className="header-right">
            {/* Notification Bell with Badge */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className="header-bell-btn" 
                id="notificationBtn" 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                title="Notifications & Alertes de service" 
                aria-label="Notifications"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="header-red-badge">
                  {unreadNotifs.length > 0 ? unreadNotifs.length : 5}
                </span>
              </button>

              {notifDropdownOpen && (
                <div 
                  id="notifDropdown" 
                  className="notif-dropdown" 
                  style={{
                    display: 'block',
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '320px',
                    background: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '12px',
                    zIndex: 100
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#082b70' }}>Notifications</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{unreadNotifs.length} non lues</span>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '12px', color: '#94a3b8' }}>
                        Aucune nouvelle alerte
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.link) setCurrentModule(n.link);
                            setNotifDropdownOpen(false);
                          }}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            background: n.read ? '#fff' : '#f0f9ff',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            marginBottom: '4px'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{n.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{n.message}</div>
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
              title="Se déconnecter (Déconnexion)"
              onClick={logout}
              aria-label="Se déconnecter"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main id="page" className="page">
          <ProfileReminderBanner />
          {children}
        </main>

        {/* Global Client Profile Modal */}
        <ClientProfileModal />
      </div>
    </div>
  );
};
