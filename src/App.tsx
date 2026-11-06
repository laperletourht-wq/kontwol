import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { AppShell } from './components/layout/AppShell';
import { AuthModal } from './components/auth/AuthModal';
import { PrintSheetModal } from './components/modals/PrintSheetModal';
import { LiveChatModal } from './components/modals/LiveChatModal';
import { EditModal } from './components/modals/EditModal';
import { DemandeEnvoiModal } from './components/modals/DemandeEnvoiModal';

import { ReservationsView } from './components/modules/ReservationsView';
import { ProformasView } from './components/modules/ProformasView';
import { FacturesView } from './components/modules/FacturesView';
import { ClientsView } from './components/modules/ClientsView';
import { ElevesView } from './components/modules/ElevesView';
import { AbonnementsView } from './components/modules/AbonnementsView';
import { VehiculesView } from './components/modules/VehiculesView';
import { ChauffeursView } from './components/modules/ChauffeursView';
import { PlanningsView } from './components/modules/PlanningsView';
import { PaiementsView } from './components/modules/PaiementsView';
import { FinancesView } from './components/modules/FinancesView';
import { UtilisateursView } from './components/modules/UtilisateursView';
import { VitrineCMSView } from './components/modules/VitrineCMSView';
import { ParametresView } from './components/modules/ParametresView';
import { DashboardVendeur } from './components/dashboard/DashboardVendeur';
import { ClientReservationsView } from './components/modules/ClientReservationsView';
import { ClientProformasView } from './components/modules/ClientProformasView';
import { ClientFacturesView } from './components/modules/ClientFacturesView';
import { useAuth } from './context/AuthContext';

const MainRouter: React.FC = () => {
  const { isPublicLanding, currentModule, toast, setCurrentModule, setClientProformaViewMode } = useApp();
  const { canAccess, role, loading } = useAuth();
  const isClient = role === 'client' || role === 'prospect';
  const isChauffeur = role === 'chauffeur';
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  const handleOpenModal = (type: string, data?: any) => {
    if (isClient && type === 'demande-devis') {
      setClientProformaViewMode('new-request');
      setCurrentModule('proformas');
      return;
    }
    setModalType(type);
    setModalData(data || null);
  };

  const renderDefaultModule = () => {
    if (isChauffeur) return <PlanningsView onOpenModal={handleOpenModal} />;
    if (isClient) return <ClientReservationsView onOpenModal={handleOpenModal} />;
    return <ReservationsView onOpenModal={handleOpenModal} />;
  };

  const renderModule = () => {
    // Strict RBAC route guard
    if (!canAccess(currentModule)) {
      return renderDefaultModule();
    }
    switch (currentModule) {
      case 'vendeur':
        return <DashboardVendeur onOpenModal={handleOpenModal} />;
      case 'reservations':
        return isClient ? (
          <ClientReservationsView onOpenModal={handleOpenModal} />
        ) : (
          <ReservationsView onOpenModal={handleOpenModal} />
        );
      case 'proformas':
        return isClient ? (
          <ClientProformasView onOpenModal={handleOpenModal} />
        ) : (
          <ProformasView onOpenModal={handleOpenModal} />
        );
      case 'factures':
        return isClient ? (
          <ClientFacturesView onOpenModal={handleOpenModal} />
        ) : (
          <FacturesView onOpenModal={handleOpenModal} />
        );
      case 'clients':
        return <ClientsView onOpenModal={handleOpenModal} />;
      case 'eleves':
        return <ElevesView onOpenModal={handleOpenModal} />;
      case 'abonnements':
        return <AbonnementsView onOpenModal={handleOpenModal} />;
      case 'vehicules':
        return <VehiculesView onOpenModal={handleOpenModal} />;
      case 'chauffeurs':
        return <ChauffeursView onOpenModal={handleOpenModal} />;
      case 'plannings':
        return <PlanningsView onOpenModal={handleOpenModal} />;
      case 'paiements':
        return isClient ? (
          <ClientFacturesView onOpenModal={handleOpenModal} />
        ) : (
          <PaiementsView onOpenModal={handleOpenModal} />
        );
      case 'finances':
        return <FinancesView />;
      case 'utilisateurs':
        return <UtilisateursView onOpenModal={handleOpenModal} />;
      case 'vitrine':
        return <VitrineCMSView />;
      case 'parametres':
        return <ParametresView />;
      default:
        return renderDefaultModule();
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#06193d',
        color: '#ffffff',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.2px' }}>
            LAPERLE TOUR HT
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Chargement en cours...
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      {isPublicLanding ? (
        <LandingPage />
      ) : (
        <AppShell>
          {renderModule()}
        </AppShell>
      )}

      {/* Global Modals & Overlays */}
      <AuthModal />
      <PrintSheetModal />
      <LiveChatModal />
      <EditModal
        type={modalType !== 'demande-envoi' ? modalType : null}
        data={modalData}
        onClose={() => setModalType(null)}
      />
      {modalType === 'demande-envoi' && modalData && (
        <DemandeEnvoiModal
          data={modalData}
          onClose={() => setModalType(null)}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <div 
          className="toast show" 
          style={{
            display: 'block',
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#b91c1c' : toast.type === 'success' ? '#15803d' : '#082b70',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 10000,
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <MainRouter />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
