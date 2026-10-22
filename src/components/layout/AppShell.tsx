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
    firebaseOnline,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');
  const [currentTimeString, setCurrentTimeString] = useState('');

  // Live Clock & Date update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsDate: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDateString(now.toLocaleDateString('fr-FR', optionsDate));
      setCurrentTimeString(now.toLocaleTimeString('fr-FR'));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { key: 'reservations', label: 'Réservations', icon: '📅', badge: reservations.length },
    { key: 'proformas', label: 'Proformas (Devis)', icon: '📋', badge: proformas.length },
    { key: 'factures', label: 'Factures', icon: '💳', badge: factures.length },
    { key: 'clients', label: 'Clients & Écoles', icon: '👥' },
    { key: 'eleves', label: 'Élèves (Transport)', icon: '🎓' },
    { key: 'abonnements', label: 'Abonnements', icon: '🎫' },
    { key: 'vehicules', label: 'Flotte & Véhicules', icon: '🚗' },
    { key: 'chauffeurs', label: 'Chauffeurs & Équipe', icon: '👔' },
    { key: 'plannings', label: 'Plannings & Dispatch', icon: '⏱️' },
    { key: 'paiements', label: 'Caisse & Paiements', icon: '💵' },
    { key: 'finances', label: 'Finances & Rapports', icon: '📈' },
    { key: 'utilisateurs', label: 'Utilisateurs & Rôles', icon: '🔐', adminOnly: true },
    { key: 'vitrine', label: 'Vitrine CMS Publique', icon: '🌐', adminOnly: true },
    { key: 'parametres', label: 'Paramètres Société', icon: '⚙️' }
  ];

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
          background: 'rgba(0,0,0,0.5)',
          zIndex: 19
        }}
      />

      {/* Main Sidebar */}
      <aside 
        className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}
        id="sidebar"
      >
        {/* Mobile-only Drawer Top Bar */}
        <div className="sidebar-mobile-bar">
          <div className="sidebar-mobile-brand" onClick={() => { setIsPublicLanding(true); setMobileSidebarOpen(false); }}>
            <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" />
            <div className="sidebar-mobile-title">
              <strong>LAPERLE TOUR HT</strong>
              <small>Centre de Contrôle</small>
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

        <div 
          className="side-brand" 
          style={{ cursor: 'pointer', position: 'relative' }} 
          title="Consulter la vitrine publique LAPERLE TOUR HT"
          onClick={() => setIsPublicLanding(true)}
        >
          <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" id="sidebarLogoImg" />
        </div>

        {/* User Mini Card in Drawer (Mobile & Tablet) */}
        <div className="sidebar-user-card">
          <span className="user-avatar-circle">
            {profile?.nom?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
          <div className="sidebar-user-details">
            <strong className="sidebar-user-name">
              {profile?.nom?.split(' ')[0] || user?.displayName || 'Utilisateur'}
            </strong>
            <span className={`user-role-tag ${(role || 'client').toLowerCase()}`}>
              {role.toUpperCase()}
            </span>
          </div>
        </div>

        <nav id="mainNav">
          <span className="nav-section-title">OPÉRATIONS & GESTION</span>
          {navItems.map((item) => {
            if (!canAccess(item.key)) return null;
            const isActive = currentModule === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentModule(item.key);
                  setMobileSidebarOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="side-footer">
          <b>LAPERLE TOUR HT</b>
          <span>Un coup d'œil sur Haïti</span>
          <small>Version 3.0 • Système Sécurisé</small>
          <button 
            id="sidebarLogoutBtn" 
            className="sidebar-logout-btn" 
            type="button" 
            title="Se déconnecter"
            onClick={logout}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <span>🚪</span> <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main">
        {/* Top Header */}
        <header className="header">
          <div className="header-brand">
            <button 
              className="mobile-toggle" 
              id="mobileToggle" 
              aria-label="Menu"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              ☰
            </button>
            <div 
              className="header-brand-logo" 
              onClick={() => setIsPublicLanding(true)}
              title="Consulter la vitrine publique LAPERLE TOUR HT"
            >
              <img src="/logo-laperle.jpg" alt="LAPERLE TOUR HT" />
            </div>
            <div className="header-brand-text">
              <span className="brand-name-mobile">LAPERLE TOUR</span>
              <div className="header-brand-top">
                <span className="brand-name">LAPERLE TOUR HT</span>
                <span className="brand-dot">·</span>
                <span className="brand-slogan">« Un coup d'œil sur Haïti »</span>
              </div>
              <h1 className="header-brand-title">
                Centre de Contrôle<em>Opérationnel</em>
              </h1>
            </div>
          </div>

          {/* Central Universal Search Bar */}
          <div className="header-search-wrap">
            <span className="search-icon">🔍</span>
            <input 
              id="globalSearch" 
              placeholder="Recherche rapide (client, véhicule, course, élève)..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
            />
            {globalSearchQuery && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setGlobalSearchQuery('')}
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* Operations Telemetry & User Controls */}
          <div className="header-right">
            <div className="header-status-box" title="Système de dispatch actif 24/7">
              <div className="status-live-indicator">
                <span className="status-dot-pulse" />
                <span className="status-label">EN DIRECT</span>
              </div>
              <div className="status-clock-info">
                <span className="clock-time" id="clock">{currentTimeString}</span>
                <span className="clock-date" id="date">{currentDateString}</span>
              </div>
            </div>

            <div className="header-separator" />

            <div className="header-action-group">
              {/* Chat / Radio dispatch button */}
              <button 
                className="header-icon-btn" 
                id="chatToggleBtn" 
                onClick={() => setChatModalOpen(true)}
                title="Messagerie & Live Dispatch (Radio de bord)" 
                aria-label="Messagerie en direct"
              >
                💬
              </button>

              {/* Notification button & dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  className="header-icon-btn" 
                  id="notificationBtn" 
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  title="Notifications & Alertes de service" 
                  aria-label="Notifications et alertes"
                >
                  🔔
                  {unreadNotifs.length > 0 && (
                    <span className="header-notif-badge">{unreadNotifs.length}</span>
                  )}
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
                      borderRadius: '10px',
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
                        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: '#94a3b8' }}>
                          Aucune notification
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

              {/* User Profile Info */}
              <button 
                className="header-user-pill" 
                id="profileBtn"
                onClick={() => {
                  if (role === 'client' || role === 'prospect') {
                    setClientProfileModalOpen(true);
                  } else {
                    setCurrentModule('parametres');
                  }
                }}
                title={role === 'client' ? "Gérer mon profil client (nom, tél, adresse, NIF)" : "Paramètres et profil"}
              >
                <span className="user-avatar-circle" id="headerAvatar">
                  {profile?.nom?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
                <div className="user-info-text">
                  <span className="user-display-name" id="headerUserName">
                    {profile?.nom?.split(' ')[0] || user?.displayName || 'Utilisateur'}
                  </span>
                  <span className={`user-role-tag ${(role || 'client').toLowerCase()}`}>
                    {role.toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Logout button */}
              <button 
                className="header-logout-btn" 
                id="headerLogoutBtn" 
                type="button" 
                title="Se déconnecter"
                onClick={logout}
              >
                <span>🚪</span> <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container with Client Reminder Banner */}
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
