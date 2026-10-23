import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { AppShell } from './components/layout/AppShell';
import { AuthModal } from './components/auth/AuthModal';
import { PrintSheetModal } from './components/modals/PrintSheetModal';
import { LiveChatModal } from './components/modals/LiveChatModal';
import { EditModal } from './components/modals/EditModal';

import { DashboardView } from './components/modules/DashboardView';
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
import { useAuth } from './context/AuthContext';

const MainRouter: React.FC = () => {
  const { isPublicLanding, currentModule, toast } = useApp();
  const { canAccess } = useAuth();
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  const handleOpenModal = (type: string, data?: any) => {
    setModalType(type);
    setModalData(data || null);
  };

  const renderModule = () => {
    // Strict RBAC route guard
    if (currentModule !== 'dashboard' && !canAccess(currentModule)) {
      return <DashboardView onOpenModal={handleOpenModal} />;
    }
    switch (currentModule) {
      case 'dashboard':
        return <DashboardView onOpenModal={handleOpenModal} />;
      case 'reservations':
        return <ReservationsView onOpenModal={handleOpenModal} />;
      case 'proformas':
        return <ProformasView onOpenModal={handleOpenModal} />;
      case 'factures':
        return <FacturesView onOpenModal={handleOpenModal} />;
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
        return <PaiementsView onOpenModal={handleOpenModal} />;
      case 'finances':
        return <FinancesView />;
      case 'utilisateurs':
        return <UtilisateursView onOpenModal={handleOpenModal} />;
      case 'vitrine':
        return <VitrineCMSView />;
      case 'parametres':
        return <ParametresView />;
      default:
        return <DashboardView onOpenModal={handleOpenModal} />;
    }
  };

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
        type={modalType}
        data={modalData}
        onClose={() => setModalType(null)}
      />

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
