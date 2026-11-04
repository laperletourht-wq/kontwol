import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DualPrice } from '../common/DualPrice';
import { DocRefBadge } from '../common/DocRefBadge';

interface ClientDashboardProps {
  onOpenModal: (type: string, data?: any) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onOpenModal }) => {
  const { profile, user, role } = useAuth();
  const { 
    reservations, 
    proformas, 
    factures, 
    paiements, 
    abonnements,
    setCurrentModule,
    setClientReservationViewMode,
    requestReservationDoc,
    completeReservationByDriver
  } = useApp();

  const [activeTab, setActiveTab] = useState<'toutes' | 'en_cours' | 'terminees'>('toutes');

  // Identity info
  const clientName = profile?.nom || profile?.name || user?.displayName || 'Client LAPERLE';
  const clientEmail = profile?.email || user?.email || 'client@laperletourht.com';
  const clientPhone = profile?.telephone || profile?.phone || '+509 4440 8687';
  const clientCity = profile?.ville || profile?.adresse || 'Port-au-Prince, Haïti';
  const clientDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '24 Novembre 2024';

  // Role label display
  const roleDisplay = role === 'chauffeur' ? 'Chauffeur Partenaire' : role === 'prospect' ? 'Nouveau Membre' : 'Client Privilège';

  // Unpaid invoices calculation
  const unpaidInvoices = useMemo(() => {
    return factures.filter(f => (f.status || f.statut) !== 'Payée');
  }, [factures]);

  const unpaidTotal = useMemo(() => {
    return unpaidInvoices.reduce((sum, f) => sum + (Number(f.amount || f.totalTTC || f.montantTotal || 0)), 0);
  }, [unpaidInvoices]);

  // Filter reservations based on active tab
  const filteredReservations = useMemo(() => {
    if (activeTab === 'en_cours') {
      return reservations.filter(r => r.status === 'En cours' || r.status === 'Confirmée' || r.status === 'En attente');
    }
    if (activeTab === 'terminees') {
      return reservations.filter(r => r.status === 'Terminée' || r.status === 'Annulée');
    }
    return reservations;
  }, [reservations, activeTab]);

  return (
    <div className="client-dash-wrapper">
      {/* Top Bar / Greeting Header */}
      <div className="client-dash-topbar">
        <div className="client-topbar-left">
          <span className="client-role-pill">{roleDisplay}</span>
          <h1 className="client-topbar-title">Espace Personnel & Réservations</h1>
          <p className="client-topbar-sub">
            Gérez vos circuits touristiques, courses privées et justificatifs de paiement en toute sécurité.
          </p>
        </div>

        <div className="client-topbar-actions">
          <button 
            type="button" 
            className="client-btn-primary"
            onClick={() => {
              setClientReservationViewMode('new');
              setCurrentModule('reservations');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Réserver une Course</span>
          </button>
          <button 
            type="button" 
            className="client-btn-secondary"
            onClick={() => onOpenModal('demande-devis')}
          >
            <span>Demander un Devis</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns Matching Reference 2 */}
      <div className="client-dash-grid">
        {/* TOP ROW: Left = Profile Card, Right = Payment Info Card */}
        
        {/* Profile Card Only */}
        <div className="client-profile-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="client-avatar-col">
            <div className="client-avatar-wrap">
              {profile?.photoURL || user?.photoURL ? (
                <img 
                  src={profile?.photoURL || user?.photoURL || ''} 
                  alt={clientName} 
                  className="client-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="client-avatar-placeholder">
                  {clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="client-status-indicator">Compte Actif</span>
          </div>

          <div className="client-info-col">
            <div className="client-name-row">
              <h2 className="client-name">{clientName}</h2>
              <button 
                type="button" 
                className="client-edit-profile-btn"
                onClick={() => onOpenModal('client-profile')}
                title="Modifier mes informations"
                aria-label="Modifier mes informations"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>Modifier</span>
              </button>
            </div>

            <div className="client-meta-grid">
              <div className="client-meta-item">
                <span className="meta-label">Membre depuis :</span>
                <span className="meta-value">{clientDate}</span>
              </div>
              <div className="client-meta-item">
                <span className="meta-label">Localisation :</span>
                <span className="meta-value">{clientCity}</span>
              </div>
              <div className="client-meta-item">
                <span className="meta-label">Adresse e-mail :</span>
                <span className="meta-value text-truncate">{clientEmail}</span>
              </div>
              <div className="client-meta-item">
                <span className="meta-label">Téléphone :</span>
                <span className="meta-value">{clientPhone}</span>
              </div>
            </div>

            {/* Quick Contact & WhatsApp Support */}
            <div className="client-contact-badges">
              <a 
                href="https://wa.me/50944408687" 
                target="_blank" 
                rel="noopener noreferrer"
                className="client-contact-btn whatsapp"
              >
                💬 WhatsApp Laperle (+509 4440 8687)
              </a>
              <button 
                type="button"
                className="client-contact-btn email"
                onClick={() => {
                  window.location.href = `mailto:laperletourht@gmail.com?subject=Demande de renseignement - ${clientName}`;
                }}
              >
                ✉️ Contacter le Desk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
