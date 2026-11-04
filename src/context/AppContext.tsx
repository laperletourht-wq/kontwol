import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot, 
  testConnection,
  query,
  where
} from '../lib/firebase';
import { 
  Reservation, 
  Proforma, 
  Facture, 
  Client, 
  Eleve, 
  Abonnement, 
  Vehicule, 
  Chauffeur, 
  Planning, 
  Paiement, 
  UserProfile, 
  NotificationItem, 
  ChatMessage, 
  CompanySettings 
} from '../types';
import { useAuth } from './AuthContext';

// Default initial company settings
const DEFAULT_SETTINGS: CompanySettings = {
  nom: 'LAPERLE TOUR HT',
  slogan: 'Un coup d\'œil sur Haïti',
  telephone1: '+509 4440 8687',
  telephone2: '+509 3700 0000',
  whatsapp: '+509 4440 8687',
  email: 'laperletourht@gmail.com',
  adresse: 'Delmas 75, Port-au-Prince, Haïti',
  tauxChangeUSD_HTG: 132.0,
  tvaPourcentage: 10,
  numeroFiscal: '001-234-567-8',
  bannierePromoActive: true,
  bannierePromoTexte: '✨ Service Premium Laperle : Demandez votre Devis Proforma officiel en 1 clic sur WhatsApp et sur le site !',
  tarifBaseTourisme: 120,
  tarifBaseVip: 250,
  tarifBaseScolaire: 150
};

// Site data reset to 0 for initial first-time use
const SEED_VEHICULES: Vehicule[] = [];
const SEED_CHAUFFEURS: Chauffeur[] = [];
const SEED_CLIENTS: Client[] = [];
const SEED_RESERVATIONS: Reservation[] = [];
const SEED_PROFORMAS: Proforma[] = [];
const SEED_FACTURES: Facture[] = [];
const SEED_ELEVES: Eleve[] = [];
const SEED_ABONNEMENTS: Abonnement[] = [];
const SEED_PLANNINGS: Planning[] = [];
const SEED_PAIEMENTS: Paiement[] = [];
const SEED_NOTIFICATIONS: NotificationItem[] = [];
const SEED_MESSAGES: ChatMessage[] = [];

interface AppContextType {
  // Navigation & UI
  currentModule: string;
  setCurrentModule: (mod: string) => void;
  clientReservationViewMode: 'list' | 'new';
  setClientReservationViewMode: (mode: 'list' | 'new') => void;
  isPublicLanding: boolean;
  setIsPublicLanding: (val: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (val: boolean) => void;
  authView: 'login' | 'register' | 'verify' | 'forgot';
  setAuthView: (v: 'login' | 'register' | 'verify' | 'forgot') => void;
  chatModalOpen: boolean;
  setChatModalOpen: (val: boolean) => void;
  clientProfileModalOpen: boolean;
  setClientProfileModalOpen: (val: boolean) => void;
  printSheetData: { type: 'proforma' | 'facture' | 'reservation' | 'paiement'; data: any; title?: string } | null;
  setPrintSheetData: (data: { type: 'proforma' | 'facture' | 'reservation' | 'paiement'; data: any; title?: string } | null) => void;
  toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  firebaseOnline: boolean;

  // Collections
  reservations: Reservation[];
  proformas: Proforma[];
  factures: Facture[];
  clients: Client[];
  eleves: Eleve[];
  abonnements: Abonnement[];
  vehicules: Vehicule[];
  chauffeurs: Chauffeur[];
  plannings: Planning[];
  paiements: Paiement[];
  allReservations?: Reservation[];
  allProformas?: Proforma[];
  allFactures?: Facture[];
  allPlannings?: Planning[];
  allPaiements?: Paiement[];
  utilisateurs: UserProfile[];
  notifications: NotificationItem[];
  settings: CompanySettings;
  messages: ChatMessage[];

  // Actions
  saveReservation: (item: Partial<Reservation>) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  saveProforma: (item: Partial<Proforma>) => Promise<void>;
  deleteProforma: (id: string) => Promise<void>;
  saveFacture: (item: Partial<Facture>) => Promise<void>;
  deleteFacture: (id: string) => Promise<void>;
  saveClient: (item: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  saveEleve: (item: Partial<Eleve>) => Promise<void>;
  deleteEleve: (id: string) => Promise<void>;
  saveAbonnement: (item: Partial<Abonnement>) => Promise<void>;
  deleteAbonnement: (id: string) => Promise<void>;
  saveVehicule: (item: Partial<Vehicule>) => Promise<void>;
  deleteVehicule: (id: string) => Promise<void>;
  saveChauffeur: (item: Partial<Chauffeur>) => Promise<void>;
  deleteChauffeur: (id: string) => Promise<void>;
  savePlanning: (item: Partial<Planning>) => Promise<void>;
  deletePlanning: (id: string) => Promise<void>;
  savePaiement: (item: Partial<Paiement>) => Promise<void>;
  deletePaiement: (id: string) => Promise<void>;
  saveSettings: (item: Partial<CompanySettings>) => Promise<void>;
  sendChatMessage: (text: string, channelId?: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  addNotification: (item: { 
    title: string; 
    message: string; 
    type?: 'info' | 'warning' | 'success' | 'danger'; 
    link?: string; 
    targetId?: string;
    targetAudience?: 'admin' | 'client' | 'chauffeur' | 'all';
    targetUid?: string;
    authorUid?: string;
  }) => Promise<void>;
  requestDocumentSend: (docType: 'facture' | 'proforma', docNumber: string, amount: number, method: 'email' | 'whatsapp' | 'both', clientNotes?: string) => Promise<void>;
  requestReservationDoc: (res: Reservation | string, docType?: 'devis' | 'facture' | 'proforma', notes?: string) => Promise<void>;
  convertProformaToFacture: (proforma: Proforma) => Promise<Facture | void>;
  convertReservationToProforma: (res: Reservation) => Promise<void>;
  convertReservationToFacture: (res: Reservation) => Promise<void>;
  convertReservationToPlanning: (res: Reservation) => Promise<void>;
  convertFactureToPaiement: (facture: Facture, modePaiement?: string, reference?: string) => Promise<void>;
  validatePaiement: (paiement: Paiement) => Promise<void>;
  generateEleveAbonnementEtFacture: (eleve: Eleve) => Promise<void>;
  assignDriverAndDispatch: (
    reservationId: string, 
    chauffeurId: string, 
    chauffeurNom: string, 
    vehiculeId: string, 
    vehiculeNom: string, 
    chauffeurTel?: string, 
    notes?: string
  ) => Promise<string>;
  completeReservationByDriver: (reservationId: string) => Promise<void>;
  resetAllSiteDataToZero: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, role, roles, isSuperAdmin } = useAuth();

  // Navigation states
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [clientReservationViewMode, setClientReservationViewMode] = useState<'list' | 'new'>('list');
  const [isPublicLanding, setIsPublicLanding] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  const [chatModalOpen, setChatModalOpen] = useState<boolean>(false);
  const [clientProfileModalOpen, setClientProfileModalOpen] = useState<boolean>(false);
  const [printSheetData, setPrintSheetData] = useState<{ type: 'proforma' | 'facture' | 'reservation' | 'paiement'; data: any; title?: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [firebaseOnline, setFirebaseOnline] = useState<boolean>(true);

  // Raw Data states starting clean at 0 (first-time use)
  const [rawReservations, setRawReservations] = useState<Reservation[]>([]);
  const [rawProformas, setRawProformas] = useState<Proforma[]>([]);
  const [rawFactures, setRawFactures] = useState<Facture[]>([]);
  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [rawEleves, setRawEleves] = useState<Eleve[]>([]);
  const [rawAbonnements, setRawAbonnements] = useState<Abonnement[]>([]);
  const [rawVehicules, setRawVehicules] = useState<Vehicule[]>([]);
  const [rawChauffeurs, setRawChauffeurs] = useState<Chauffeur[]>([]);
  const [rawPlannings, setRawPlannings] = useState<Planning[]>([]);
  const [rawPaiements, setRawPaiements] = useState<Paiement[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<UserProfile[]>([]);
  const [rawNotifications, setRawNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // When user logs in, show dashboard by default
  useEffect(() => {
    if (user) {
      setIsPublicLanding(false);
      setAuthModalOpen(false);
    }
  }, [user]);

  // Test Firestore connection on mount
  useEffect(() => {
    testConnection().then((ok) => {
      setFirebaseOnline(ok);
    });
  }, []);

  // Firestore real-time subscriptions when authenticated
  useEffect(() => {
    if (!user) return;

    const unsubs: (() => void)[] = [];

    // Helper for syncing collections or scoped queries
    const syncQueryOrCollection = <T extends { id: string }>(
      name: string,
      queryRef: any,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      fallback: T[]
    ) => {
      try {
        const unsub = onSnapshot(
          queryRef,
          (snapshot: any) => {
            const list: T[] = snapshot.docs.map((docSnap: any) => ({
              id: docSnap.id,
              ...docSnap.data()
            } as T));
            setter(list);
          },
          (err: any) => {
            // Silently maintain fallback data if permission is restricted for current role
            if (!err?.message?.includes('Missing or insufficient permissions')) {
              console.info(`Firestore sync (${name}):`, err.message);
            }
          }
        );
        unsubs.push(unsub);
      } catch (err) {
        // Fallback maintained
      }
    };

    const isStaff = isSuperAdmin || role === 'admin' || role === 'direction' || role === 'comptabilite' || role === 'secretaire' || role === 'operations';

    if (isStaff) {
      // Staff members have administrative read access to full operational collections
      syncQueryOrCollection('reservations', collection(db, 'reservations'), setRawReservations, []);
      syncQueryOrCollection('proformas', collection(db, 'proformas'), setRawProformas, []);
      syncQueryOrCollection('factures', collection(db, 'factures'), setRawFactures, []);
      syncQueryOrCollection('notifications', collection(db, 'notifications'), setRawNotifications, []);
      syncQueryOrCollection('clients', collection(db, 'clients'), setRawClients, []);
      syncQueryOrCollection('eleves', collection(db, 'eleves'), setRawEleves, []);
      syncQueryOrCollection('abonnements', collection(db, 'abonnements'), setRawAbonnements, []);
      syncQueryOrCollection('vehicules', collection(db, 'vehicules'), setRawVehicules, []);
      syncQueryOrCollection('chauffeurs', collection(db, 'chauffeurs'), setRawChauffeurs, []);
      syncQueryOrCollection('plannings', collection(db, 'plannings'), setRawPlannings, []);
      syncQueryOrCollection('paiements', collection(db, 'paiements'), setRawPaiements, []);
      if (role === 'admin' || isSuperAdmin) {
        syncQueryOrCollection('utilisateurs', collection(db, 'utilisateurs'), setUtilisateurs, []);
      }
    } else if (role === 'chauffeur') {
      // Drivers have scoped mission access
      if (user?.uid) {
        syncQueryOrCollection('plannings', query(collection(db, 'plannings'), where('chauffeurId', '==', user.uid)), setRawPlannings, []);
        syncQueryOrCollection('vehicules', collection(db, 'vehicules'), setRawVehicules, []);
        syncQueryOrCollection('notifications', query(collection(db, 'notifications'), where('targetUid', '==', user.uid)), setRawNotifications, []);
      }
      if (user?.uid) {
        syncQueryOrCollection('reservations', query(collection(db, 'reservations'), where('clientId', '==', user.uid)), setRawReservations, []);
        syncQueryOrCollection('proformas', query(collection(db, 'proformas'), where('clientId', '==', user.uid)), setRawProformas, []);
        syncQueryOrCollection('factures', query(collection(db, 'factures'), where('clientId', '==', user.uid)), setRawFactures, []);
      }
    } else if (role === 'client' || role === 'prospect' || (!isStaff && (role as string) !== 'chauffeur')) {
      // Client & Prospect real-time scoped synchronization
      if (user?.uid) {
        syncQueryOrCollection('reservations', query(collection(db, 'reservations'), where('clientId', '==', user.uid)), setRawReservations, []);
        syncQueryOrCollection('proformas', query(collection(db, 'proformas'), where('clientId', '==', user.uid)), setRawProformas, []);
        syncQueryOrCollection('factures', query(collection(db, 'factures'), where('clientId', '==', user.uid)), setRawFactures, []);
        syncQueryOrCollection('paiements', query(collection(db, 'paiements'), where('clientId', '==', user.uid)), setRawPaiements, []);
        syncQueryOrCollection('notifications', query(collection(db, 'notifications'), where('targetUid', '==', user.uid)), setRawNotifications, []);
        syncQueryOrCollection('vehicules', collection(db, 'vehicules'), setRawVehicules, []);
      }
    }

    // Real-time synchronization of chat & dispatch messages for all authenticated users
    if (user?.uid) {
      syncQueryOrCollection('messages', collection(db, 'messages'), setMessages, []);
    }

    // Real-time synchronization of company settings
    if (isStaff) {
      try {
        const unsubSettings = onSnapshot(doc(db, 'settings', 'company'), (snap) => {
          if (snap.exists()) {
            setSettings((prev) => ({ ...prev, ...(snap.data() as CompanySettings) }));
          }
        }, () => {});
        unsubs.push(unsubSettings);
      } catch (err) {}
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [user, role, roles, isSuperAdmin]);

  // Generic Save and Delete helper methods
  const saveItemToCollection = async <T extends { id: string }>(
    colName: string,
    item: Partial<T>,
    listSetter: React.Dispatch<React.SetStateAction<T[]>>,
    successMsg: string
  ) => {
    const id = item.id || `${colName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const fullItem = {
      ...item,
      id,
      updatedAt: new Date().toISOString()
    } as unknown as T;

    if (!auth.currentUser) {
      showToast('Authentification requise pour enregistrer dans Firestore.', 'error');
      throw new Error('Authentification requise.');
    }

    try {
      await setDoc(doc(db, colName, id), fullItem as any);
      listSetter((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = fullItem;
          return next;
        }
        return [fullItem, ...prev];
      });
      showToast(successMsg, 'success');
    } catch (e: any) {
      console.error(`Erreur d'écriture Firestore (${colName}):`, e);
      showToast(`Échec d'enregistrement distant (${colName}) : ${e?.message || 'Droits insuffisants'}`, 'error');
      throw e;
    }
  };

  const deleteItemFromCollection = async <T extends { id: string }>(
    colName: string,
    id: string,
    listSetter: React.Dispatch<React.SetStateAction<T[]>>,
    successMsg: string
  ) => {
    if (!auth.currentUser) {
      showToast('Authentification requise pour supprimer de Firestore.', 'error');
      throw new Error('Authentification requise.');
    }
    try {
      await deleteDoc(doc(db, colName, id));
      listSetter((prev) => prev.filter((p) => p.id !== id));
      showToast(successMsg, 'info');
    } catch (e: any) {
      console.error(`Erreur de suppression Firestore (${colName}):`, e);
      showToast(`Échec de suppression distante (${colName}) : ${e?.message || 'Erreur'}`, 'error');
      throw e;
    }
  };

  // --------------------------------------------------------------------------
  // ROLE-BASED ACCESS & PARTITIONING LOGIC (1, 2 ou 3)
  // --------------------------------------------------------------------------
  // 1. Roles with global visibility: Direction, Administrateur et Comptabilité
  const isGlobalRole = useMemo(() => {
    if (isSuperAdmin) return true;
    const globalRoles: string[] = ['admin', 'direction', 'comptabilite'];
    if (globalRoles.includes(role)) return true;
    if (Array.isArray(roles) && roles.some((r) => globalRoles.includes(r))) return true;
    return false;
  }, [isSuperAdmin, role, roles]);

  const isSecretaireRole = useMemo(() => {
    return role === 'secretaire' || (Array.isArray(roles) && roles.includes('secretaire'));
  }, [role, roles]);

  const isOperationsRole = useMemo(() => {
    return role === 'operations' || (Array.isArray(roles) && roles.includes('operations'));
  }, [role, roles]);

  const isChauffeurRole = useMemo(() => {
    return role === 'chauffeur' || (Array.isArray(roles) && roles.includes('chauffeur'));
  }, [role, roles]);

  const isVendeurRole = useMemo(() => {
    return role === 'vendeur' || (Array.isArray(roles) && roles.includes('vendeur'));
  }, [role, roles]);

  const isClientRole = useMemo(() => {
    return (
      role === 'client' ||
      role === 'prospect' ||
      (!isGlobalRole && !isSecretaireRole && !isOperationsRole && !isChauffeurRole && !isVendeurRole)
    );
  }, [role, isGlobalRole, isSecretaireRole, isOperationsRole, isChauffeurRole, isVendeurRole]);

  // Generic stopwords that should never trigger loose substring cross-client matching
  const GENERIC_NAMES = useMemo(() => new Set([
    'client', 'utilisateur', 'user', 'guest', 'admin', 'client laperle', 'test', 'demo', 
    'passager', 'nouveau', 'client divers', 'inconnu', 'visiteur'
  ]), []);

  // Name & Identity normalization helpers for multi-criteria matching
  const nameVariants = useMemo(() => {
    const list: string[] = [];
    const addNorm = (s?: string | null) => {
      if (!s) return;
      const clean = s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (clean && clean.length > 2 && !GENERIC_NAMES.has(clean)) list.push(clean);
    };
    addNorm(profile?.nom);
    addNorm(profile?.prenom);
    if (profile?.nom && profile?.prenom) {
      addNorm(`${profile.prenom} ${profile.nom}`);
      addNorm(`${profile.nom} ${profile.prenom}`);
    }
    addNorm(profile?.name);
    addNorm(user?.displayName);
    return Array.from(new Set(list));
  }, [profile?.nom, profile?.prenom, profile?.name, user?.displayName, GENERIC_NAMES]);

  const userPhone = useMemo(() => {
    const p = profile?.telephone || profile?.phone;
    return p ? p.replace(/\D/g, '') : '';
  }, [profile?.telephone, profile?.phone]);

  const userEmail = useMemo(() => {
    return (user?.email || profile?.email || '').trim().toLowerCase();
  }, [user?.email, profile?.email]);

  // Match Name helper
  const matchName = useCallback(
    (targetName?: string | null): boolean => {
      if (!targetName) return false;
      const cleanTarget = targetName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!cleanTarget || cleanTarget.length < 3 || GENERIC_NAMES.has(cleanTarget)) return false;
      return nameVariants.some(
        (v) => v === cleanTarget || (v.length >= 4 && (cleanTarget.includes(v) || v.includes(cleanTarget)))
      );
    },
    [nameVariants, GENERIC_NAMES]
  );

  // Match Phone helper (checks last 8 digits)
  const matchPhone = useCallback(
    (targetPhone?: string | null): boolean => {
      if (!targetPhone || !userPhone || userPhone.length < 7) return false;
      const cleanTarget = targetPhone.replace(/\D/g, '');
      if (cleanTarget.length < 7) return false;
      return cleanTarget.endsWith(userPhone.slice(-8)) || userPhone.endsWith(cleanTarget.slice(-8));
    },
    [userPhone]
  );

  // 1. Scoped Reservations
  const reservations = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole || isOperationsRole || isVendeurRole) {
      return rawReservations;
    }
    if (isChauffeurRole) {
      // Driver only sees trips where assigned
      return rawReservations.filter((r) => matchName(r.driver));
    }
    // Client / Prospect: Criterion 1 (UID/clientId), 2 (Email), 3 (Name or Phone)
    return rawReservations.filter((r) => {
      if (r.clientId && (r.clientId === user.uid || r.clientId === profile?.id)) return true;
      if ((r as any).uid && ((r as any).uid === user.uid || (r as any).uid === profile?.id)) return true;
      if (userEmail && r.email && r.email.trim().toLowerCase() === userEmail) return true;
      if (userEmail && r.notes && r.notes.toLowerCase().includes(userEmail)) return true;
      if (matchName(r.client)) return true;
      if (matchPhone(r.telephone)) return true;
      return false;
    });
  }, [rawReservations, user, isGlobalRole, isSecretaireRole, isOperationsRole, isVendeurRole, isChauffeurRole, profile?.id, userEmail, matchName, matchPhone]);

  // 2. Scoped Proformas
  const proformas = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole || isVendeurRole) {
      return rawProformas;
    }
    if (isChauffeurRole || isOperationsRole) {
      return []; // Proformas are strictly confidential to client & commercial/management
    }
    // Client / Prospect: Criterion 1 (UID/clientId), 2 (Email), 3 (Name or Phone)
    return rawProformas.filter((p) => {
      if (p.clientId && (p.clientId === user.uid || p.clientId === profile?.id)) return true;
      if (userEmail && p.clientEmail && p.clientEmail.trim().toLowerCase() === userEmail) return true;
      if (userEmail && (p as any).email && (p as any).email.trim().toLowerCase() === userEmail) return true;
      if (userEmail && p.notes && p.notes.toLowerCase().includes(userEmail)) return true;
      if (matchName(p.client)) return true;
      if (matchPhone(p.telephone)) return true;
      return false;
    });
  }, [rawProformas, user, isGlobalRole, isSecretaireRole, isVendeurRole, isChauffeurRole, isOperationsRole, profile?.id, userEmail, matchName, matchPhone]);

  const clientProformaNumbers = useMemo(() => {
    return new Set(proformas.map((p) => p.number).filter(Boolean));
  }, [proformas]);

  // 3. Scoped Factures
  const factures = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole || isVendeurRole) {
      return rawFactures;
    }
    if (isChauffeurRole || isOperationsRole) {
      return []; // Invoices strictly confidential to client & accounting/management
    }
    // Client / Prospect: Criterion 1 (UID/clientId), 2 (Email/Proforma match), 3 (Name or Phone)
    return rawFactures.filter((f) => {
      if (f.clientId && (f.clientId === user.uid || f.clientId === profile?.id)) return true;
      if (userEmail && f.clientEmail && f.clientEmail.trim().toLowerCase() === userEmail) return true;
      if (f.proformaNumber && clientProformaNumbers.has(f.proformaNumber)) return true;
      if (matchName(f.client)) return true;
      if (matchPhone(f.telephone)) return true;
      return false;
    });
  }, [rawFactures, user, isGlobalRole, isSecretaireRole, isVendeurRole, isChauffeurRole, isOperationsRole, profile?.id, userEmail, clientProformaNumbers, matchName, matchPhone]);

  const clientFactureNumbers = useMemo(() => {
    return new Set(factures.map((f) => f.number).filter(Boolean));
  }, [factures]);

  // 4. Scoped Paiements
  const paiements = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole) {
      return rawPaiements;
    }
    if (isChauffeurRole || isOperationsRole) {
      return []; // Payments are strictly confidential to client & finance
    }
    // Client / Prospect
    return rawPaiements.filter((p) => {
      if (p.clientId && (p.clientId === user.uid || p.clientId === profile?.id)) return true;
      if (userEmail && p.clientEmail && p.clientEmail.trim().toLowerCase() === userEmail) return true;
      if (p.factureAssociee && clientFactureNumbers.has(p.factureAssociee)) return true;
      if (p.proformaAssociee && clientProformaNumbers.has(p.proformaAssociee)) return true;
      if (matchName(p.client)) return true;
      return false;
    });
  }, [rawPaiements, user, isGlobalRole, isSecretaireRole, isChauffeurRole, isOperationsRole, profile?.id, userEmail, clientFactureNumbers, clientProformaNumbers, matchName]);

  // 5. Scoped Plannings (Feuille de Route)
  const plannings = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole || isOperationsRole) {
      return rawPlannings;
    }
    if (isChauffeurRole) {
      // Driver only sees their assigned courses
      return rawPlannings.filter((p) => {
        if (p.chauffeurId && (p.chauffeurId === user.uid || p.chauffeurId === profile?.id)) return true;
        if ((p as any).driverId && ((p as any).driverId === user.uid || (p as any).driverId === profile?.id)) return true;
        return matchName(p.chauffeur);
      });
    }
    // Client only sees confirmed plannings for their personal trips
    return rawPlannings.filter((p) => {
      if (p.clientId && (p.clientId === user.uid || p.clientId === profile?.id)) return true;
      return matchName(p.client);
    });
  }, [rawPlannings, user, isGlobalRole, isSecretaireRole, isOperationsRole, isChauffeurRole, profile?.id, matchName]);

  // 6. Scoped Eleves (Navette Scolaire)
  const eleves = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole) {
      return rawEleves;
    }
    if (isChauffeurRole) {
      return rawEleves.filter((e) => matchName(e.chauffeurAssigne));
    }
    return rawEleves.filter((e) => {
      if (e.clientId && (e.clientId === user.uid || e.clientId === profile?.id)) return true;
      if (userEmail && e.parentEmail && e.parentEmail.trim().toLowerCase() === userEmail) return true;
      if (matchName(e.parentNom)) return true;
      if (matchPhone(e.parentTelephone)) return true;
      return false;
    });
  }, [rawEleves, user, isGlobalRole, isSecretaireRole, isChauffeurRole, profile?.id, userEmail, matchName, matchPhone]);

  // 7. Scoped Abonnements
  const abonnements = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole) {
      return rawAbonnements;
    }
    if (isChauffeurRole || isOperationsRole) {
      return [];
    }
    const clientEleveNames = new Set(eleves.map((e) => `${e.prenom} ${e.nom}`.toLowerCase().trim()));
    return rawAbonnements.filter((a) => {
      if (a.clientId && (a.clientId === user.uid || a.clientId === profile?.id)) return true;
      if (userEmail && a.clientEmail && a.clientEmail.trim().toLowerCase() === userEmail) return true;
      if (matchName(a.client)) return true;
      if (a.eleveNom && clientEleveNames.has(a.eleveNom.toLowerCase().trim())) return true;
      return false;
    });
  }, [rawAbonnements, user, isGlobalRole, isSecretaireRole, isChauffeurRole, isOperationsRole, profile?.id, userEmail, eleves, matchName]);

  // 8. Scoped Clients Directory
  const clients = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole || isOperationsRole || isVendeurRole) {
      return rawClients;
    }
    if (isChauffeurRole) return [];
    return rawClients.filter((c) => {
      if (c.id === user.uid || c.id === profile?.id) return true;
      if (userEmail && c.email && c.email.trim().toLowerCase() === userEmail) return true;
      if (matchName(c.name)) return true;
      if (matchPhone(c.telephone)) return true;
      return false;
    });
  }, [rawClients, user, isGlobalRole, isSecretaireRole, isOperationsRole, isVendeurRole, isChauffeurRole, profile?.id, userEmail, matchName, matchPhone]);

  // 9. Vehicules (Accessible to staff and client showcase)
  const vehicules = useMemo(() => {
    return rawVehicules;
  }, [rawVehicules]);

  // 10. Chauffeurs
  const chauffeurs = useMemo(() => {
    if (!user || isGlobalRole || isSecretaireRole || isOperationsRole) {
      return rawChauffeurs;
    }
    if (isChauffeurRole) {
      return rawChauffeurs.filter((c) => c.id === user.uid || matchName(`${c.prenom} ${c.nom}`));
    }
    return [];
  }, [rawChauffeurs, user, isGlobalRole, isSecretaireRole, isOperationsRole, isChauffeurRole, matchName]);

  // 11. Scoped Notifications: Strict Recipient Isolation
  const notifications = useMemo(() => {
    if (!user) return rawNotifications;
    if (isGlobalRole || isSecretaireRole || isOperationsRole) {
      // Staff members receive all admin alerts, operations alerts, and client requests
      return rawNotifications.filter((n) => n.targetAudience !== 'chauffeur' || isSuperAdmin);
    }
    if (isChauffeurRole) {
      return rawNotifications.filter((n) => 
        n.targetUid === user.uid || 
        n.targetAudience === 'chauffeur' || 
        n.targetAudience === 'all'
      );
    }
    // Client / Prospect:
    // - NEVER show their own requests to themselves (avoid self-spam)
    // - NEVER show admin-targeted notifications
    // - Only show notifications targeted to them specifically, or to 'client'/'all'
    return rawNotifications.filter((n) => {
      if (n.authorUid && (n.authorUid === user.uid || n.authorUid === profile?.id)) {
        return false;
      }
      if (n.targetAudience === 'admin') {
        return false;
      }
      if (n.targetUid && (n.targetUid === user.uid || n.targetUid === profile?.id)) {
        return true;
      }
      if (n.targetAudience === 'client' || n.targetAudience === 'all') {
        return true;
      }
      return false;
    });
  }, [rawNotifications, user, isGlobalRole, isSecretaireRole, isOperationsRole, isChauffeurRole, isSuperAdmin, profile?.id]);

  // --------------------------------------------------------------------------
  // ENRICHED CRUD IMPLEMENTATIONS WITH AUTOMATIC ATTRIBUTION
  // --------------------------------------------------------------------------
  const saveReservation = async (item: Partial<Reservation>) => {
    const isRestricted = isClientRole && user;
    const dossierId = item.dossierId || item.id || `DOS-${Date.now().toString().slice(-6)}`;
    
    let resolvedClientId = item.clientId || (isRestricted ? user.uid : undefined);
    let resolvedEmail = item.email || (isRestricted && user.email ? user.email : undefined);
    let resolvedTelephone = item.telephone || (isRestricted ? (profile?.telephone || profile?.phone) : undefined);
    let resolvedClient = item.client || (isRestricted ? (profile?.nom || profile?.name || user.displayName || 'Client') : 'Client Divers');

    if (!resolvedClientId && item.client) {
      const match = rawClients.find(c => c.name.toLowerCase() === item.client?.toLowerCase());
      if (match) {
        resolvedClientId = match.id;
        if (!resolvedEmail && match.email) resolvedEmail = match.email;
        if (!resolvedTelephone && match.telephone) resolvedTelephone = match.telephone;
      }
    }

    const enriched: Partial<Reservation> = {
      ...item,
      dossierId,
      clientId: resolvedClientId,
      email: resolvedEmail,
      telephone: resolvedTelephone,
      client: resolvedClient
    };
    await saveItemToCollection('reservations', enriched, setRawReservations, 'Réservation enregistrée avec succès');
  };
  const deleteReservation = async (id: string) => {
    await deleteItemFromCollection('reservations', id, setRawReservations, 'Réservation supprimée');
  };

  const saveProforma = async (item: Partial<Proforma>) => {
    const isRestricted = isClientRole && user;
    let dossierId = item.dossierId;
    if (!dossierId && item.reservationId) {
      const linkedRes = rawReservations.find(r => r.id === item.reservationId);
      if (linkedRes) dossierId = linkedRes.dossierId || linkedRes.id;
    }
    if (!dossierId) {
      dossierId = item.number || item.id || `DOS-${Date.now().toString().slice(-6)}`;
    }

    let resolvedClientId = item.clientId || (isRestricted ? user.uid : undefined);
    let resolvedEmail = item.clientEmail || (isRestricted && user.email ? user.email : undefined);
    let resolvedTelephone = item.telephone || (isRestricted ? (profile?.telephone || profile?.phone) : undefined);
    let resolvedClient = item.client || (isRestricted ? (profile?.nom || profile?.name || user.displayName || 'Client') : 'Client Divers');

    if (!resolvedClientId && item.client) {
      const match = rawClients.find(c => c.name.toLowerCase() === item.client?.toLowerCase());
      if (match) {
        resolvedClientId = match.id;
        if (!resolvedEmail && match.email) resolvedEmail = match.email;
        if (!resolvedTelephone && match.telephone) resolvedTelephone = match.telephone;
      }
    }

    const enriched: Partial<Proforma> = {
      ...item,
      dossierId,
      clientId: resolvedClientId,
      clientEmail: resolvedEmail,
      telephone: resolvedTelephone,
      client: resolvedClient
    };
    await saveItemToCollection('proformas', enriched, setRawProformas, 'Devis proforma enregistré');
  };
  const deleteProforma = async (id: string) => {
    await deleteItemFromCollection('proformas', id, setRawProformas, 'Proforma supprimée');
  };

  const saveFacture = async (item: Partial<Facture>) => {
    const isRestricted = isClientRole && user;
    let dossierId = item.dossierId;
    if (!dossierId && item.reservationId) {
      const linkedRes = rawReservations.find(r => r.id === item.reservationId);
      if (linkedRes) dossierId = linkedRes.dossierId || linkedRes.id;
    }
    if (!dossierId && item.proformaNumber) {
      const linkedPro = rawProformas.find(p => p.number === item.proformaNumber);
      if (linkedPro) dossierId = linkedPro.dossierId;
    }
    if (!dossierId) {
      dossierId = item.number || item.id || `DOS-${Date.now().toString().slice(-6)}`;
    }

    let resolvedClientId = item.clientId || (isRestricted ? user.uid : undefined);
    let resolvedEmail = item.clientEmail || (isRestricted && user.email ? user.email : undefined);
    let resolvedTelephone = item.telephone || (isRestricted ? (profile?.telephone || profile?.phone) : undefined);
    let resolvedClient = item.client || (isRestricted ? (profile?.nom || profile?.name || user.displayName || 'Client') : 'Client');

    if (!resolvedClientId && item.client) {
      const match = rawClients.find(c => c.name.toLowerCase() === item.client?.toLowerCase());
      if (match) {
        resolvedClientId = match.id;
        if (!resolvedEmail && match.email) resolvedEmail = match.email;
        if (!resolvedTelephone && match.telephone) resolvedTelephone = match.telephone;
      }
    }

    const enriched: Partial<Facture> = {
      ...item,
      dossierId,
      clientId: resolvedClientId,
      clientEmail: resolvedEmail,
      telephone: resolvedTelephone,
      client: resolvedClient
    };
    await saveItemToCollection('factures', enriched, setRawFactures, 'Facture enregistrée');
  };
  const deleteFacture = async (id: string) => {
    await deleteItemFromCollection('factures', id, setRawFactures, 'Facture supprimée');
  };

  const saveClient = async (item: Partial<Client>) => {
    await saveItemToCollection('clients', item, setRawClients, 'Client enregistré');
  };
  const deleteClient = async (id: string) => {
    await deleteItemFromCollection('clients', id, setRawClients, 'Client supprimé');
  };

  const saveEleve = async (item: Partial<Eleve>) => {
    await saveItemToCollection('eleves', item, setRawEleves, 'Élève enregistré');
  };
  const deleteEleve = async (id: string) => {
    await deleteItemFromCollection('eleves', id, setRawEleves, 'Élève supprimé');
  };

  const saveAbonnement = async (item: Partial<Abonnement>) => {
    await saveItemToCollection('abonnements', item, setRawAbonnements, 'Abonnement enregistré');
  };
  const deleteAbonnement = async (id: string) => {
    await deleteItemFromCollection('abonnements', id, setRawAbonnements, 'Abonnement supprimé');
  };

  const saveVehicule = async (item: Partial<Vehicule>) => {
    await saveItemToCollection('vehicules', item, setRawVehicules, 'Véhicule mis à jour dans la flotte');
  };
  const deleteVehicule = async (id: string) => {
    await deleteItemFromCollection('vehicules', id, setRawVehicules, 'Véhicule retiré de la flotte');
  };

  const saveChauffeur = async (item: Partial<Chauffeur>) => {
    await saveItemToCollection('chauffeurs', item, setRawChauffeurs, 'Chauffeur enregistré');
  };
  const deleteChauffeur = async (id: string) => {
    await deleteItemFromCollection('chauffeurs', id, setRawChauffeurs, 'Chauffeur supprimé');
  };

  const savePlanning = async (item: Partial<Planning>) => {
    // 1. Détection préventive des conflits horaires sur l'ensemble de la flotte
    if (item.date && (item.chauffeur || item.vehicule)) {
      const conflict = rawPlannings.find(
        (p) =>
          p.id !== item.id &&
          p.date === item.date &&
          p.statut !== 'Achevé' &&
          p.statut !== 'Annulé' &&
          ((item.chauffeur && p.chauffeur && p.chauffeur.toLowerCase() === item.chauffeur.toLowerCase()) ||
           (item.vehicule && p.vehicule && p.vehicule.toLowerCase() === item.vehicule.toLowerCase()))
      );
      if (conflict) {
        showToast(
          `⚠️ Conflit potentiel: ${item.chauffeur || item.vehicule} est déjà assigné le ${item.date} à ${conflict.heure}.`,
          'warning'
        );
      }
    }

    // 2. Sauvegarde du planning
    await saveItemToCollection('plannings', item, setRawPlannings, 'Trajet et planning dispatchés');

    // 3. Synchronisation automatique des statuts de flotte et de chauffeurs
    if (item.vehicule) {
      const targetVeh = rawVehicules.find(
        (v) =>
          v.plaque.toLowerCase() === item.vehicule?.toLowerCase() ||
          item.vehicule?.toLowerCase().includes(v.plaque.toLowerCase()) ||
          v.modele.toLowerCase().includes(item.vehicule?.toLowerCase() || '')
      );
      if (targetVeh) {
        if (item.statut === 'En cours' && targetVeh.statut !== 'En mission') {
          await saveVehicule({ ...targetVeh, statut: 'En mission' });
        } else if (item.statut === 'Achevé' && targetVeh.statut === 'En mission') {
          await saveVehicule({ ...targetVeh, statut: 'Disponible' });
        }
      }
    }

    if (item.chauffeur) {
      const targetChf = rawChauffeurs.find(
        (c) =>
          `${c.prenom} ${c.nom}`.toLowerCase() === item.chauffeur?.toLowerCase() ||
          item.chauffeur?.toLowerCase().includes(c.nom.toLowerCase())
      );
      if (targetChf) {
        if (item.statut === 'En cours' && targetChf.statut !== 'En course') {
          await saveChauffeur({ ...targetChf, statut: 'En course' });
        } else if (item.statut === 'Achevé' && targetChf.statut === 'En course') {
          await saveChauffeur({ ...targetChf, statut: 'En service' });
        }
      }
    }
  };
  const deletePlanning = async (id: string) => {
    await deleteItemFromCollection('plannings', id, setRawPlannings, 'Planning annulé');
  };

  const savePaiement = async (item: Partial<Paiement>) => {
    const isRestricted = isClientRole && user;
    const enriched: Partial<Paiement> = {
      ...item,
      clientId: item.clientId || (isRestricted ? user.uid : undefined),
      clientEmail: item.clientEmail || (isRestricted && user.email ? user.email : undefined),
      client: item.client || (isRestricted ? (profile?.nom || profile?.name || user.displayName || 'Client') : 'Client Divers')
    };

    await saveItemToCollection('paiements', enriched, setRawPaiements, 'Paiement encaissé et enregistré');

    // Liaison Métier Clé : Mise à jour automatique du solde et du statut de la facture liée
    if (item.factureAssociee && (item.statut === 'Validé' || !item.statut)) {
      const targetFacture = rawFactures.find(
        (f) => f.number === item.factureAssociee || f.id === item.factureAssociee
      );
      if (targetFacture) {
        const priorPaid = Number(targetFacture.paidAmount) || 0;
        const currentPay = Number(item.montant) || 0;
        const newPaid = Math.min(targetFacture.amount, priorPaid + currentPay);
        const newStatus: Facture['status'] = newPaid >= targetFacture.amount ? 'Payée' : 'Partiellement payée';

        await saveItemToCollection(
          'factures',
          { ...targetFacture, paidAmount: newPaid, status: newStatus },
          setRawFactures,
          `Facture ${targetFacture.number} mise à jour : Statut [${newStatus}] ($${newPaid}/$${targetFacture.amount})`
        );
      }
    }
  };
  const deletePaiement = async (id: string) => {
    await deleteItemFromCollection('paiements', id, setRawPaiements, 'Paiement supprimé');
  };

  const saveSettings = async (item: Partial<CompanySettings>) => {
    if (!auth.currentUser) {
      showToast('Authentification requise pour enregistrer les paramètres.', 'error');
      throw new Error('Authentification requise.');
    }
    const updated = { ...settings, ...item };
    try {
      await setDoc(doc(db, 'settings', 'company'), updated);
      setSettings(updated);
      showToast('Paramètres de l\'entreprise mis à jour', 'success');
    } catch (e: any) {
      console.error('Erreur d\'enregistrement des paramètres Firestore:', e);
      showToast(`Échec d'enregistrement distant : ${e?.message || 'Erreur'}`, 'error');
      throw e;
    }
  };

  const sendChatMessage = async (text: string, channelId = 'dispatch') => {
    if (!text.trim()) return;
    if (!auth.currentUser) {
      showToast('Authentification requise pour envoyer un message.', 'error');
      return;
    }
    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      channelId,
      senderId: user?.uid || auth.currentUser.uid,
      senderName: profile?.name || profile?.nom || user?.displayName || 'Utilisateur',
      senderRole: (role as string) || profile?.role || 'client',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'messages', newMsg.id), newMsg);
      setMessages((prev) => [...prev, newMsg]);
    } catch (e: any) {
      console.error('Erreur d\'envoi de message Firestore:', e);
      showToast(`Échec de l'envoi du message : ${e?.message || 'Erreur'}`, 'error');
    }
  };

  const markNotificationAsRead = (id: string) => {
    setRawNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setRawNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Toutes les notifications sont marquées comme lues', 'info');
  };

  const clearAllNotifications = () => {
    setRawNotifications([]);
    showToast('Boîte de notifications vidée', 'info');
  };

  const addNotification = async (item: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success' | 'danger';
    link?: string;
    targetId?: string;
    targetAudience?: 'admin' | 'client' | 'chauffeur' | 'all';
    targetUid?: string;
    authorUid?: string;
  }) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: item.title,
      message: item.message,
      type: item.type || 'info',
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      link: item.link,
      targetId: item.targetId,
      targetAudience: item.targetAudience || 'all',
      targetUid: item.targetUid,
      authorUid: item.authorUid
    };
    setRawNotifications((prev) => [newNotif, ...prev]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      }
    } catch (e) {}
  };

  const requestDocumentSend = async (
    docType: 'facture' | 'proforma',
    docNumber: string,
    amount: number,
    method: 'email' | 'whatsapp' | 'both',
    clientNotes?: string
  ) => {
    const clientName = profile?.nom || profile?.name || user?.displayName || 'Client';
    const clientEmail = user?.email || profile?.email || 'Non renseigné';
    const clientPhone = profile?.telephone || profile?.phone || 'Non renseigné';
    const typeLabel = docType === 'facture' ? 'Facture' : 'Devis';

    const notifTitle = `Demande d'envoi de ${typeLabel} N° ${docNumber}`;
    const methodDesc = method === 'both' ? 'Email & WhatsApp' : method === 'email' ? 'Email' : 'WhatsApp';
    const notifMessage = `Le client ${clientName} a demandé l'envoi de son document officiel (${amount} USD) par ${methodDesc}.\nEmail : ${clientEmail} | Tél : ${clientPhone}${clientNotes ? `\nPrécisions : ${clientNotes}` : ''}`;

    await addNotification({
      title: notifTitle,
      message: notifMessage,
      type: 'info',
      link: docType === 'facture' ? 'factures' : 'proformas',
      targetId: docNumber,
      targetAudience: 'admin',
      authorUid: user?.uid
    });

    showToast(`Votre demande d'envoi pour ${typeLabel} N° ${docNumber} a bien été enregistrée. L'équipe Laperle Tour vous l'adressera très rapidement !`, 'success');
  };

  // Client requests a quote (Devis) or Invoice (Facture) on a reservation
  const requestReservationDoc = async (
    target: Reservation | string,
    docType: 'devis' | 'facture' | 'proforma' = 'devis',
    notes?: string
  ) => {
    const res: Reservation | undefined = typeof target === 'string'
      ? rawReservations.find(r => r.id === target) || (target ? { id: target, client: 'Client' } as Reservation : undefined)
      : target;

    if (!res || !res.id) {
      showToast('Dossier de réservation introuvable.', 'error');
      return;
    }

    const normalizedDocType = docType === 'proforma' ? 'devis' : docType;
    const clientName = profile?.nom ? `${profile.prenom || ''} ${profile.nom}`.trim() : user?.displayName || res.client || 'Client';
    const typeLabel = normalizedDocType === 'facture' ? 'Facture' : 'Devis';

    // 1. Mark the reservation
    const updatedRes: Reservation = {
      ...res,
      demandeDevis: normalizedDocType === 'devis' ? true : res.demandeDevis,
      demandeFacture: normalizedDocType === 'facture' ? true : res.demandeFacture,
      updatedAt: new Date().toISOString()
    };
    await saveReservation(updatedRes);

    // 2. Alert administration ONLY (the client will not receive their own request in their bell!)
    await addNotification({
      title: `Demande de ${typeLabel} sur Dossier ${res.id}`,
      message: `${clientName} sollicite l'émission d'un ${typeLabel.toLowerCase()} officiel pour sa réservation (${res.origin || 'Départ'} ➔ ${res.destination || 'Arrivée'}).${notes ? `\nPrécisions : ${notes}` : ''}`,
      type: 'info',
      link: 'reservations',
      targetId: res.id,
      targetAudience: 'admin',
      authorUid: user?.uid
    });

    showToast(`Votre demande de ${typeLabel.toLowerCase()} pour le dossier ${res.id} a été envoyée avec succès à notre équipe !`, 'success');
  };

  const convertProformaToFacture = async (proforma: Proforma) => {
    const factureNumber = `FAC-${Date.now().toString().slice(-6)}`;
    const newFacture: Facture = {
      id: factureNumber,
      number: factureNumber,
      proformaNumber: proforma.number,
      reservationId: proforma.reservationId,
      dossierId: proforma.dossierId || proforma.reservationId,
      client: proforma.client,
      clientId: proforma.clientId,
      clientEmail: proforma.clientEmail,
      telephone: proforma.telephone,
      service: proforma.service,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
      amount: proforma.totalTTC || proforma.amount,
      currency: proforma.currency || 'USD',
      paidAmount: 0,
      status: 'En attente',
      items: proforma.items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveFacture(newFacture);
    await saveProforma({ 
      ...proforma, 
      status: 'Convertie en facture',
      factureNumber: factureNumber
    });

    // Link back to original reservation if found
    const linkedRes = rawReservations.find(r => 
      (proforma.reservationId && r.id === proforma.reservationId) || 
      r.devisRef === proforma.number || 
      (proforma.dossierId && r.dossierId === proforma.dossierId) ||
      r.id === proforma.id
    );
    if (linkedRes) {
      await saveReservation({
        ...linkedRes,
        factureRef: factureNumber,
        status: 'Facturé',
        demandeFacture: false,
        updatedAt: new Date().toISOString()
      });
    }

    // Notify the client that their invoice is ready!
    if (proforma.clientId || proforma.clientEmail) {
      await addNotification({
        title: `Votre Facture ${factureNumber} a été émise`,
        message: `Bonjour ${proforma.client}, votre facture officielle N° ${factureNumber} ($${newFacture.amount} USD) a été générée et est disponible dans votre espace.`,
        type: 'success',
        link: 'factures',
        targetId: factureNumber,
        targetAudience: 'client',
        targetUid: proforma.clientId,
        authorUid: user?.uid
      });
    }

    showToast(`Proforma ${proforma.number} convertie en facture ${factureNumber} avec succès !`, 'success');
    setCurrentModule('factures');
    return newFacture;
  };

  // Passerelle 1 : Réservation ➔ Devis Proforma
  const convertReservationToProforma = async (res: Reservation) => {
    const number = `PRO-${Date.now().toString().slice(-6)}`;
    const amount = Number(res.amount) || 250;
    const tva = Math.round(amount * (settings.tvaPourcentage / 100));
    const newProforma: Proforma = {
      id: number,
      number,
      reservationId: res.id,
      dossierId: res.dossierId || res.id,
      client: res.client,
      clientId: res.clientId,
      clientEmail: res.email,
      telephone: res.telephone,
      service: res.service || 'Transfert & Course VIP',
      date: res.date || new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      amount,
      tva,
      totalTTC: amount + tva,
      currency: res.currency || 'USD',
      status: 'En attente',
      items: [
        {
          description: `${res.service || 'Transport VIP'} : ${res.origin || 'Port-au-Prince'} ➔ ${res.destination || 'Destination'} (${res.passengers || 1} passager(s))`,
          quantity: 1,
          unitPrice: amount,
          total: amount
        }
      ],
      notes: res.notes ? `Issu du dossier ${res.dossierId || res.id}. Note : ${res.notes}` : `Généré depuis la réservation ${res.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveProforma(newProforma);

    // Update reservation with devisRef, proformaRef and status Devis émis
    await saveReservation({
      ...res,
      devisRef: number,
      proformaRef: number,
      status: 'Devis émis',
      updatedAt: new Date().toISOString()
    });

    // Notify the client that their proforma has been prepared!
    if (res.clientId || res.email) {
      await addNotification({
        title: `Votre Devis Proforma ${number} est prêt`,
        message: `Bonjour ${res.client}, votre devis officiel pour votre course (${res.origin || 'Départ'} ➔ ${res.destination || 'Arrivée'}) a été préparé ($${amount + tva} USD).`,
        type: 'info',
        link: 'proformas',
        targetId: number,
        targetAudience: 'client',
        targetUid: res.clientId,
        authorUid: user?.uid
      });
    }

    showToast(`Devis Proforma ${number} généré avec succès pour le dossier ${res.id} !`, 'success');
    setCurrentModule('proformas');
  };

  // Passerelle 1b : Réservation ➔ Facture Directe
  const convertReservationToFacture = async (res: Reservation) => {
    const factureNumber = `FAC-${Date.now().toString().slice(-6)}`;
    const amount = Number(res.amount) || 250;
    const tva = Math.round(amount * (settings.tvaPourcentage / 100));
    const totalTTC = amount + tva;

    const newFacture: Facture = {
      id: factureNumber,
      number: factureNumber,
      reservationId: res.id,
      dossierId: res.dossierId || res.id,
      proformaNumber: res.devisRef,
      client: res.client,
      clientId: res.clientId,
      clientEmail: res.email,
      telephone: res.telephone,
      service: res.service || 'Transfert & Course VIP',
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
      amount: totalTTC,
      totalTTC,
      currency: res.currency || 'USD',
      paidAmount: 0,
      status: 'En attente',
      items: [
        {
          description: `${res.service || 'Transport VIP'} : ${res.origin || 'Port-au-Prince'} ➔ ${res.destination || 'Destination'} (${res.passengers || 1} passager(s))`,
          quantity: 1,
          unitPrice: amount,
          total: amount
        }
      ],
      notes: res.notes ? `Facture émise depuis la réservation ${res.id}. ${res.notes}` : `Facture émise depuis la réservation ${res.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveFacture(newFacture);

    await saveReservation({
      ...res,
      factureRef: factureNumber,
      status: 'Facturé',
      demandeFacture: false,
      updatedAt: new Date().toISOString()
    });

    if (res.clientId || res.email) {
      await addNotification({
        title: `Votre Facture ${factureNumber} a été émise`,
        message: `Bonjour ${res.client}, votre facture officielle N° ${factureNumber} ($${totalTTC} USD) a été générée et est disponible dans votre espace.`,
        type: 'success',
        link: 'factures',
        targetId: factureNumber,
        targetAudience: 'client',
        targetUid: res.clientId,
        authorUid: user?.uid
      });
    }

    showToast(`Facture ${factureNumber} générée pour le dossier ${res.id} !`, 'success');
    setCurrentModule('factures');
  };

  // Passerelle 2 : Réservation ➔ Planning Dispatch Flotte
  const convertReservationToPlanning = async (res: Reservation) => {
    const planningId = `PLN-${Date.now().toString().slice(-6)}`;
    const driverName = res.driver || (rawChauffeurs.length > 0 ? `${rawChauffeurs[0].prenom} ${rawChauffeurs[0].nom}` : 'Jean-Baptiste Pierre');
    const vehName = res.vehicle || (rawVehicules.length > 0 ? `${rawVehicules[0].modele} (${rawVehicules[0].plaque})` : 'Toyota Prado TXL (AA-98124)');

    const newPlanning: Planning = {
      id: planningId,
      date: res.date || new Date().toISOString().slice(0, 10),
      heure: res.time || '08:30',
      client: res.client,
      clientId: res.clientId,
      service: res.service || 'Course VIP',
      depart: res.origin || 'Port-au-Prince',
      destination: res.destination || 'Côte des Arcadins',
      passagers: res.passengers || 1,
      chauffeur: driverName,
      vehicule: vehName,
      statut: 'Programmé',
      notes: `Dispatch issu de la réservation ${res.id}`
    };
    await savePlanning(newPlanning);
    await saveReservation({ ...res, status: 'Confirmée' });
    showToast(`Trajet planifié et envoyé au dispatch pour ${res.client} !`, 'success');
    setCurrentModule('plannings');
  };

  // Passerelle 3 : Élève Navette ➔ Abonnement & Facturation Récurrente
  const generateEleveAbonnementEtFacture = async (eleve: Eleve) => {
    const abonnId = `ABO-${Date.now().toString().slice(-6)}`;
    const fee = Number(eleve.fraisMensuel) || 150;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const newAbonnement: Abonnement = {
      id: abonnId,
      client: eleve.parentNom,
      clientId: eleve.clientId,
      clientEmail: eleve.parentEmail,
      eleveNom: `${eleve.prenom} ${eleve.nom}`,
      typeAbonnement: 'Scolaire',
      tarifMensuel: fee,
      currency: 'USD',
      dateDebut: now.toISOString().slice(0, 10),
      dateFin: nextMonth.toISOString().slice(0, 10),
      prochainRenouvellement: nextMonth.toISOString().slice(0, 10),
      statut: 'Actif',
      notes: `Établissement: ${eleve.ecole} (${eleve.classe || 'Standard'}) - Arrêt: ${eleve.arretRamassage}`
    };

    const factureNumber = `FAC-${Date.now().toString().slice(-6)}`;
    const newFacture: Facture = {
      id: factureNumber,
      number: factureNumber,
      client: eleve.parentNom,
      clientId: eleve.clientId,
      clientEmail: eleve.parentEmail,
      telephone: eleve.parentTelephone,
      service: `Abonnement Navette Scolaire Mensuelle - ${eleve.prenom} ${eleve.nom}`,
      date: now.toISOString().slice(0, 10),
      dueDate: new Date(now.getTime() + 86400000 * 10).toISOString().slice(0, 10),
      amount: fee,
      currency: 'USD',
      paidAmount: 0,
      status: 'En attente',
      items: [
        {
          description: `Transport scolaire mensuel : ${eleve.prenom} ${eleve.nom} (${eleve.ecole}) - Ligne ${eleve.arretRamassage}`,
          quantity: 1,
          unitPrice: fee,
          total: fee
        }
      ],
      notes: `Facture mensuelle récurrente pour le parent responsable ${eleve.parentNom}`
    };

    await saveAbonnement(newAbonnement);
    await saveFacture(newFacture);
    showToast(`Abonnement et Facture ${factureNumber} ($${fee} USD) générés pour ${eleve.parentNom} !`, 'success');
    setCurrentModule('factures');
  };

  // Passerelle 4 : Facture ➔ Enregistrement Instantané de Paiement Caisse & Validation
  const convertFactureToPaiement = async (
    facture: Facture,
    modePaiement: string = 'Espèces Caisse',
    reference?: string
  ) => {
    const resteAPayer = Math.max(0, (Number(facture.amount) || 0) - (Number(facture.paidAmount) || 0));
    const montantPaye = resteAPayer > 0 ? resteAPayer : (Number(facture.amount) || 100);
    const refPaiement = reference || `REC-${Date.now().toString().slice(-6)}`;
    const paymentId = `PAI-${Date.now().toString().slice(-6)}`;

    const newPaiement: Paiement = {
      id: paymentId,
      reference: refPaiement,
      date: new Date().toISOString().slice(0, 10),
      client: facture.client,
      clientId: facture.clientId,
      clientEmail: facture.clientEmail,
      montant: montantPaye,
      amount: montantPaye,
      devise: facture.currency || 'USD',
      modePaiement,
      motif: `Règlement Facture ${facture.number} - ${facture.service || 'Prestation VIP'}`,
      factureAssociee: facture.number,
      proformaAssociee: facture.proformaNumber,
      reservationId: facture.reservationId,
      dossierId: facture.dossierId,
      statut: 'Validé',
      recuPar: profile?.nom || profile?.name || user?.displayName || 'Caisse Centrale Laperle'
    };

    await savePaiement(newPaiement);

    // Mettre à jour la facture comme intégralement payée
    await saveFacture({
      ...facture,
      paidAmount: Number(facture.amount) || montantPaye,
      status: 'Payée',
      statut: 'Payée',
      modePaiement,
      paymentMethod: modePaiement,
      referenceTransaction: refPaiement,
      updatedAt: new Date().toISOString()
    });

    // Mettre à jour la réservation associée si existante
    const linkedRes = rawReservations.find(
      r => (facture.reservationId && r.id === facture.reservationId) ||
           (facture.dossierId && r.dossierId === facture.dossierId) ||
           r.factureRef === facture.number || 
           (facture.proformaNumber && r.devisRef === facture.proformaNumber)
    );
    if (linkedRes) {
      await saveReservation({
        ...linkedRes,
        status: 'Confirmée',
        paiementRef: refPaiement,
        updatedAt: new Date().toISOString()
      });

      // Notification à l'équipe régulation pour assigner le chauffeur
      await addNotification({
        title: '✅ Course Payée · Prête pour assignation',
        message: `La facture ${facture.number} pour ${facture.client} a été payée ($${montantPaye} ${facture.currency || 'USD'}). Vous pouvez assigner le chauffeur et le véhicule pour le dossier ${linkedRes.id}.`,
        type: 'success',
        link: 'reservations',
        targetId: linkedRes.id,
        targetAudience: 'all'
      });
    }

    if (facture.clientId) {
      await addNotification({
        title: `Paiement validé pour la Facture ${facture.number}`,
        message: `Bonjour ${facture.client}, votre règlement de $${montantPaye} ${facture.currency || 'USD'} a été validé par la comptabilité. Votre réservation est confirmée !`,
        type: 'success',
        link: 'factures',
        targetId: facture.number,
        targetAudience: 'client',
        targetUid: facture.clientId,
        authorUid: user?.uid
      });
    }

    showToast(`Paiement de $${montantPaye} ${facture.currency || 'USD'} validé avec succès pour la facture ${facture.number} !`, 'success');
    setCurrentModule('paiements');
  };

  // Validation d'un paiement (ex: justificatif transmis par le client)
  const validatePaiement = async (paiement: Paiement) => {
    const updatedPayment: Paiement = {
      ...paiement,
      statut: 'Validé',
      status: 'Validé',
      recuPar: profile?.nom || profile?.name || user?.displayName || 'Secrétariat Laperle',
      updatedAt: new Date().toISOString()
    };
    await savePaiement(updatedPayment);

    // Mettre à jour la facture associée
    if (paiement.factureAssociee) {
      const targetFacture = rawFactures.find(
        (f) => f.number === paiement.factureAssociee || f.id === paiement.factureAssociee
      );
      if (targetFacture) {
        const priorPaid = Number(targetFacture.paidAmount) || 0;
        const currentPay = Number(paiement.montant || paiement.amount) || 0;
        const newPaid = Math.min(targetFacture.amount, priorPaid + currentPay);
        const newStatus: Facture['status'] = newPaid >= targetFacture.amount ? 'Payée' : 'Partiellement payée';

        await saveFacture({
          ...targetFacture,
          paidAmount: newPaid,
          status: newStatus,
          statut: newStatus,
          referenceTransaction: paiement.referenceTransaction || paiement.reference || targetFacture.referenceTransaction,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Mettre à jour la réservation liée
    const targetReservation = rawReservations.find(
      (r) =>
        (paiement.reservationId && (r.id === paiement.reservationId || r.dossierId === paiement.reservationId)) ||
        (paiement.dossierId && r.dossierId === paiement.dossierId) ||
        (paiement.factureAssociee && r.factureRef === paiement.factureAssociee) ||
        (paiement.proformaAssociee && r.devisRef === paiement.proformaAssociee)
    );

    if (targetReservation) {
      await saveReservation({
        ...targetReservation,
        status: 'Confirmée',
        paiementRef: paiement.reference || paiement.id,
        updatedAt: new Date().toISOString()
      });

      await addNotification({
        title: '✅ Course Payée & Confirmée · Prête pour assignation',
        message: `Le règlement de ${paiement.client} (${paiement.montant} ${paiement.devise || 'USD'}) a été validé. Dossier ${targetReservation.id} prêt pour assignation chauffeur & véhicule.`,
        type: 'success',
        link: 'reservations',
        targetId: targetReservation.id,
        targetAudience: 'all'
      });
    }

    if (paiement.clientId) {
      await addNotification({
        title: `Paiement Validé - Reçu ${paiement.reference || paiement.id}`,
        message: `Bonjour ${paiement.client}, votre versement de ${paiement.montant} ${paiement.devise || 'USD'} a été validé avec succès par notre service comptabilité. Votre réservation est confirmée !`,
        type: 'success',
        link: 'paiements',
        targetId: paiement.id,
        targetAudience: 'client',
        targetUid: paiement.clientId,
        authorUid: user?.uid
      });
    }

    showToast(`Paiement ${paiement.reference || paiement.id} validé avec succès !`, 'success');
  };

  // Passerelle 5 : Assignation Manuelle Chauffeur & Véhicule avec Ordre de Mission
  const assignDriverAndDispatch = async (
    reservationId: string,
    chauffeurId: string,
    chauffeurNom: string,
    vehiculeId: string,
    vehiculeNom: string,
    chauffeurTel?: string,
    notes?: string
  ): Promise<string> => {
    const targetRes = rawReservations.find(r => r.id === reservationId);
    if (!targetRes) throw new Error('Réservation introuvable');

    const updatedRes: Reservation = {
      ...targetRes,
      driver: chauffeurNom,
      chauffeur: chauffeurNom,
      driverId: chauffeurId,
      vehicle: vehiculeNom,
      vehicule: vehiculeNom,
      vehicleId: vehiculeId,
      chauffeurTelephone: chauffeurTel,
      status: 'En cours',
      notes: notes ? `${targetRes.notes ? targetRes.notes + ' | ' : ''}Dispatch : ${notes}` : targetRes.notes,
      updatedAt: new Date().toISOString()
    };
    await saveReservation(updatedRes);

    // Mettre à jour le véhicule sélectionné
    const targetVeh = rawVehicules.find(v => v.id === vehiculeId || v.plaque === vehiculeId);
    if (targetVeh) {
      await saveVehicule({
        ...targetVeh,
        statut: 'En mission',
        chauffeurAttitre: chauffeurNom,
        updatedAt: new Date().toISOString()
      });
    }

    // Créer ou actualiser le planning dispatch
    const planningId = `PLN-${Date.now().toString().slice(-6)}`;
    const newPlanning: Planning = {
      id: planningId,
      date: targetRes.date || new Date().toISOString().slice(0, 10),
      heure: targetRes.time || '08:30',
      client: targetRes.client,
      clientId: targetRes.clientId,
      service: targetRes.service || 'Course VIP',
      depart: targetRes.origin || 'Port-au-Prince',
      destination: targetRes.destination || 'Destination VIP',
      passagers: targetRes.passengers || 1,
      chauffeur: chauffeurNom,
      vehicule: vehiculeNom,
      statut: 'En mission',
      notes: `Ordre de mission pour ${targetRes.id} ${notes ? `- ${notes}` : ''}`
    };
    await savePlanning(newPlanning);

    // Notification interne dans l'application au chauffeur
    await addNotification({
      title: '🚗 Nouvelle mission assignée !',
      message: `Course assignée pour ${targetRes.client} le ${targetRes.date} à ${targetRes.time || '08:00'}. Trajet : ${targetRes.origin || 'Départ'} ➔ ${targetRes.destination || 'Destination'}.`,
      type: 'info',
      link: 'plannings',
      targetId: planningId,
      targetAudience: 'all'
    });

    // Génération du message WhatsApp pré-formaté pour le chauffeur
    const telClean = (chauffeurTel || '').replace(/\D/g, '');
    const msgText = encodeURIComponent(
      `*ORDRE DE MISSION · LAPERLE TOUR HT*\n` +
      `Bonjour ${chauffeurNom},\n\n` +
      `Une course officielle vous a été assignée :\n` +
      `• *Réf Course* : ${targetRes.id}\n` +
      `• *Client* : ${targetRes.client} (${targetRes.telephone || 'Non renseigné'})\n` +
      `• *Date & Heure* : ${targetRes.date} à ${targetRes.time || '08:00'}\n` +
      `• *Prise en charge* : ${targetRes.origin || 'Port-au-Prince'}\n` +
      `• *Destination* : ${targetRes.destination || 'Destination'}\n` +
      `• *Passagers* : ${targetRes.passengers || 1}\n` +
      `• *Véhicule* : ${vehiculeNom}\n` +
      `${notes ? `• *Consignes* : ${notes}\n` : ''}\n` +
      `Merci de confirmer la prise en charge.`
    );
    const waUrl = telClean ? `https://wa.me/${telClean}?text=${msgText}` : `https://wa.me/50944408687?text=${msgText}`;

    showToast(`Chauffeur ${chauffeurNom} et ${vehiculeNom} assignés avec succès !`, 'success');
    return waUrl;
  };

  // Passerelle 6 : Clôture en 1 clic de la course par le Chauffeur
  const completeReservationByDriver = async (reservationId: string) => {
    const targetRes = rawReservations.find(r => r.id === reservationId);
    if (!targetRes) throw new Error('Réservation introuvable');

    const updatedRes: Reservation = {
      ...targetRes,
      status: 'Terminée',
      updatedAt: new Date().toISOString()
    };
    await saveReservation(updatedRes);

    // Libérer le véhicule
    if (targetRes.vehicleId || targetRes.vehicle) {
      const veh = rawVehicules.find(v => v.id === targetRes.vehicleId || v.modele === targetRes.vehicle || v.plaque === targetRes.vehicle);
      if (veh) {
        await saveVehicule({
          ...veh,
          statut: 'Disponible',
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Clôturer le planning si existant
    const pln = rawPlannings.find(p => p.client === targetRes.client && (p.statut === 'Programmé' || p.statut === 'En mission' || p.statut === 'En cours'));
    if (pln) {
      await savePlanning({
        ...pln,
        statut: 'Terminé'
      });
    }

    // Notification générale pour secrétaire, admin & direction
    await addNotification({
      title: '🏁 Course terminée avec succès',
      message: `Le chauffeur ${targetRes.driver || targetRes.chauffeur || 'partenaire'} a signalé la fin de la course N° ${targetRes.id} pour ${targetRes.client}. Dossier complet et archivé !`,
      type: 'success',
      link: 'reservations',
      targetId: targetRes.id,
      targetAudience: 'all'
    });

    showToast(`Course ${targetRes.id} terminée avec succès ! La régulation et la direction ont été notifiées.`, 'success');
  };

  const resetAllSiteDataToZero = async () => {
    // 1. Reset all in-memory React states to empty arrays (clean slate)
    setRawReservations([]);
    setRawProformas([]);
    setRawFactures([]);
    setRawClients([]);
    setRawEleves([]);
    setRawAbonnements([]);
    setRawVehicules([]);
    setRawChauffeurs([]);
    setRawPlannings([]);
    setRawPaiements([]);
    setRawNotifications([]);
    setMessages([]);

    // 2. If authenticated, purge existing documents in Firestore collections
    if (auth.currentUser) {
      const collectionsToPurge = [
        'reservations',
        'proformas',
        'factures',
        'paiements',
        'plannings',
        'eleves',
        'abonnements',
        'clients',
        'chauffeurs',
        'vehicules',
        'notifications',
        'messages',
        'conversations',
        'demandesProformas'
      ];
      for (const colName of collectionsToPurge) {
        try {
          const snap = await getDocs(collection(db, colName));
          for (const d of snap.docs) {
            try {
              await deleteDoc(doc(db, colName, d.id));
            } catch (delErr) {
              // Ignore single doc delete errors if permission restricted
            }
          }
        } catch (colErr) {
          // Ignore collection access errors
        }
      }
    }

    showToast('Toutes les données ont été remises à zéro (première utilisation du site).', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentModule,
        setCurrentModule,
        clientReservationViewMode,
        setClientReservationViewMode,
        isPublicLanding,
        setIsPublicLanding,
        authModalOpen,
        setAuthModalOpen,
        authView,
        setAuthView,
        chatModalOpen,
        setChatModalOpen,
        clientProfileModalOpen,
        setClientProfileModalOpen,
        printSheetData,
        setPrintSheetData,
        toast,
        showToast,
        globalSearchQuery,
        setGlobalSearchQuery,
        firebaseOnline,
        reservations,
        proformas,
        factures,
        clients,
        eleves,
        abonnements,
        vehicules,
        chauffeurs,
        plannings,
        paiements,
        allReservations: rawReservations,
        allProformas: rawProformas,
        allFactures: rawFactures,
        allPlannings: rawPlannings,
        allPaiements: rawPaiements,
        utilisateurs,
        notifications,
        settings,
        messages,
        saveReservation,
        deleteReservation,
        saveProforma,
        deleteProforma,
        saveFacture,
        deleteFacture,
        saveClient,
        deleteClient,
        saveEleve,
        deleteEleve,
        saveAbonnement,
        deleteAbonnement,
        saveVehicule,
        deleteVehicule,
        saveChauffeur,
        deleteChauffeur,
        savePlanning,
        deletePlanning,
        savePaiement,
        deletePaiement,
        saveSettings,
        sendChatMessage,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        addNotification,
        requestDocumentSend,
        requestReservationDoc,
        convertProformaToFacture,
        convertReservationToProforma,
        convertReservationToFacture,
        convertReservationToPlanning,
        convertFactureToPaiement,
        validatePaiement,
        generateEleveAbonnementEtFacture,
        assignDriverAndDispatch,
        completeReservationByDriver,
        resetAllSiteDataToZero
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
