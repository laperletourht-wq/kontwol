import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  testConnection 
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
  numeroFiscal: '001-234-567-8'
};

// Seed samples for immediate rich visualization
const SEED_VEHICULES: Vehicule[] = [
  {
    id: 'VEH-01',
    plaque: 'AA-98124',
    marque: 'Toyota',
    modele: 'Land Cruiser Prado TXL',
    annee: 2024,
    couleur: 'Noir Métallisé',
    categorie: 'SUV VIP',
    capacitePassagers: 5,
    statut: 'Disponible',
    chauffeurAttitre: 'Jean-Baptiste Pierre',
    kilometrage: 18450,
    climatisation: true,
    gpsActif: true
  },
  {
    id: 'VEH-02',
    plaque: 'BB-44210',
    marque: 'Toyota',
    modele: 'HiAce VIP Grand Cabin',
    annee: 2023,
    couleur: 'Blanc Nacré',
    categorie: 'Minibus HiAce',
    capacitePassagers: 12,
    statut: 'En mission',
    chauffeurAttitre: 'Marc Antoine Saint-Louis',
    kilometrage: 32100,
    climatisation: true,
    gpsActif: true
  },
  {
    id: 'VEH-03',
    plaque: 'SC-10522',
    marque: 'Toyota',
    modele: 'Coaster Navette Scolaire',
    annee: 2022,
    couleur: 'Jaune & Bleu Laperle',
    categorie: 'Autocar / Coaster',
    capacitePassagers: 28,
    statut: 'Disponible',
    chauffeurAttitre: 'Samuel Joseph',
    kilometrage: 41200,
    climatisation: true,
    gpsActif: true
  },
  {
    id: 'VEH-04',
    plaque: 'PR-88190',
    marque: 'Toyota',
    modele: 'Land Cruiser 300 VXR',
    annee: 2025,
    couleur: 'Noir Vierge',
    categorie: 'SUV VIP',
    capacitePassagers: 6,
    statut: 'Disponible',
    chauffeurAttitre: 'Jean-Baptiste Pierre',
    kilometrage: 6200,
    climatisation: true,
    gpsActif: true
  }
];

const SEED_CHAUFFEURS: Chauffeur[] = [
  {
    id: 'CHF-01',
    nom: 'Pierre',
    prenom: 'Jean-Baptiste',
    telephone: '+509 3788 1245',
    email: 'j.pierre@laperletour.ht',
    permisNumero: 'HT-P-449102',
    statut: 'En service',
    vehiculeActuel: 'Toyota Land Cruiser Prado TXL',
    noteService: 4.9,
    zonesHabituelles: 'Port-au-Prince, Pétion-Ville, Côte des Arcadins'
  },
  {
    id: 'CHF-02',
    nom: 'Saint-Louis',
    prenom: 'Marc Antoine',
    telephone: '+509 4412 8890',
    email: 'm.saintlouis@laperletour.ht',
    permisNumero: 'HT-P-118432',
    statut: 'En course',
    vehiculeActuel: 'Toyota HiAce VIP Grand Cabin',
    noteService: 4.8,
    zonesHabituelles: 'Aéroport, Cap-Haïtien, Jacmel'
  },
  {
    id: 'CHF-03',
    nom: 'Joseph',
    prenom: 'Samuel',
    telephone: '+509 3690 7714',
    email: 's.joseph@laperletour.ht',
    permisNumero: 'HT-P-882310',
    statut: 'En service',
    vehiculeActuel: 'Toyota Coaster Navette Scolaire',
    noteService: 4.9,
    zonesHabituelles: 'Lycée Français, Institution Saint-Louis, Delmas'
  }
];

const SEED_CLIENTS: Client[] = [
  {
    id: 'CLI-01',
    name: 'Délégation Diplomatique Union Européenne',
    type: 'Ambassade / ONG',
    telephone: '+509 2940 1000',
    email: 'contact@delegation-ue.ht',
    address: 'Pétion-Ville, Route de Montagne Noire',
    totalOrders: 14
  },
  {
    id: 'CLI-02',
    name: 'Famille Delacroix',
    type: 'Particulier',
    telephone: '+509 3441 9920',
    email: 'delacroix.famille@gmail.com',
    address: 'Delmas 75',
    totalOrders: 6
  },
  {
    id: 'CLI-03',
    name: 'Digicel Business Haïti',
    type: 'Entreprise',
    telephone: '+509 3700 1122',
    email: 'logistique@digicelgroup.com',
    address: 'Turgeau, Port-au-Prince',
    totalOrders: 28
  }
];

const SEED_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-001',
    client: 'Délégation Diplomatique Union Européenne',
    service: 'Location VIP avec Chauffeur',
    origin: 'Hôtel Karibe, Pétion-Ville',
    destination: 'Côte des Arcadins (Decameron Resort)',
    date: new Date().toISOString().slice(0, 10),
    time: '08:30',
    passengers: 4,
    amount: 350,
    currency: 'USD',
    driver: 'Jean-Baptiste Pierre',
    vehicle: 'Toyota Land Cruiser Prado TXL',
    status: 'En cours',
    telephone: '+509 2940 1000'
  },
  {
    id: 'RES-002',
    client: 'Digicel Business Haïti',
    service: 'Transfert Aéroport Toussaint Louverture',
    origin: 'Aéroport International',
    destination: 'Siège Digicel Turgeau',
    date: new Date().toISOString().slice(0, 10),
    time: '14:15',
    passengers: 8,
    amount: 180,
    currency: 'USD',
    driver: 'Marc Antoine Saint-Louis',
    vehicle: 'Toyota HiAce VIP Grand Cabin',
    status: 'Confirmée',
    telephone: '+509 3700 1122'
  },
  {
    id: 'RES-003',
    client: 'Dr. Émile Beauvoir',
    service: 'Circuit Touristique & Découverte',
    origin: 'Pétion-Ville',
    destination: 'Citadelle Laferrière & Cap-Haïtien',
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    time: '06:00',
    passengers: 3,
    amount: 580,
    currency: 'USD',
    driver: 'Jean-Baptiste Pierre',
    vehicle: 'Toyota Land Cruiser 300 VXR',
    status: 'En attente',
    telephone: '+509 3810 5544'
  }
];

const SEED_PROFORMAS: Proforma[] = [
  {
    id: 'PRO-2026-001',
    number: 'PRO-2026-001',
    client: 'Délégation Diplomatique Union Européenne',
    service: 'Mise à disposition VIP Prado TXL 3 jours',
    date: new Date().toISOString().slice(0, 10),
    amount: 1050,
    currency: 'USD',
    items: [
      { description: 'Location SUV Prado TXL climatisé avec chauffeur assermenté (3 jours)', quantity: 3, unitPrice: 350, total: 1050 }
    ],
    tva: 105,
    totalTTC: 1155,
    status: 'Acceptée'
  },
  {
    id: 'PRO-2026-002',
    number: 'PRO-2026-002',
    client: 'Ministère du Tourisme Haïti',
    service: 'Excursion Citadelle Laferrière & Bassin Zim',
    date: new Date().toISOString().slice(0, 10),
    amount: 2400,
    currency: 'USD',
    items: [
      { description: 'Minibus HiAce VIP avec guide certifié & rafraîchissements', quantity: 2, unitPrice: 1200, total: 2400 }
    ],
    tva: 240,
    totalTTC: 2640,
    status: 'En attente'
  }
];

const SEED_FACTURES: Facture[] = [
  {
    id: 'FAC-2026-001',
    number: 'FAC-2026-001',
    proformaNumber: 'PRO-2026-001',
    client: 'Délégation Diplomatique Union Européenne',
    service: 'Mise à disposition VIP Prado TXL 3 jours',
    date: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
    amount: 1155,
    currency: 'USD',
    paidAmount: 1155,
    status: 'Payée',
    paymentMethod: 'Virement Bancaire'
  },
  {
    id: 'FAC-2026-002',
    number: 'FAC-2026-002',
    client: 'Digicel Business Haïti',
    service: 'Transferts Navettes Janvier 2026',
    date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10),
    amount: 1450,
    currency: 'USD',
    paidAmount: 0,
    status: 'En attente',
    paymentMethod: 'Chèque Commercial'
  }
];

const SEED_ELEVES: Eleve[] = [
  {
    id: 'ELV-01',
    nom: 'Delacroix',
    prenom: 'Lucas',
    ecole: 'Lycée Alexandre Dumas (Lycée Français)',
    classe: '6ème A',
    arretRamassage: 'Delmas 75, angle rue Rebecca',
    parentNom: 'Jean-Marc Delacroix',
    parentTelephone: '+509 3441 9920',
    parentEmail: 'delacroix.famille@gmail.com',
    chauffeurAssigne: 'Samuel Joseph',
    vehiculeAssigne: 'Coaster Scolaire SC-10522',
    statut: 'Actif',
    fraisMensuel: 150
  },
  {
    id: 'ELV-02',
    nom: 'Moïse',
    prenom: 'Sarah',
    ecole: 'Institution Sainte Rose de Lima',
    classe: '4ème B',
    arretRamassage: 'Pétion-Ville, Place Boyer',
    parentNom: 'Dr. Moïse',
    parentTelephone: '+509 4440 8687',
    chauffeurAssigne: 'Samuel Joseph',
    vehiculeAssigne: 'Coaster Scolaire SC-10522',
    statut: 'Actif',
    fraisMensuel: 150
  }
];

const SEED_ABONNEMENTS: Abonnement[] = [
  {
    id: 'ABO-01',
    client: 'Jean-Marc Delacroix',
    eleveNom: 'Lucas Delacroix',
    typeAbonnement: 'Scolaire',
    tarifMensuel: 150,
    currency: 'USD',
    dateDebut: '2026-09-01',
    dateFin: '2026-06-30',
    statut: 'Actif',
    prochainRenouvellement: '2026-11-01'
  },
  {
    id: 'ABO-02',
    client: 'Digicel Business Haïti',
    typeAbonnement: 'Corporate',
    tarifMensuel: 1800,
    currency: 'USD',
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    statut: 'Actif',
    prochainRenouvellement: '2026-11-01'
  }
];

const SEED_PLANNINGS: Planning[] = [
  {
    id: 'PLN-01',
    date: new Date().toISOString().slice(0, 10),
    heure: '06:45',
    heureRetour: '15:30',
    client: 'Navette Scolaire Laperle Matin',
    service: 'Ramassage Scolaire Ligne Pétion-Ville / Delmas',
    depart: 'Place Boyer, Pétion-Ville',
    destination: 'Lycée Français & Sainte Rose',
    passagers: 22,
    chauffeur: 'Samuel Joseph',
    vehicule: 'Toyota Coaster SC-10522',
    statut: 'En cours'
  },
  {
    id: 'PLN-02',
    date: new Date().toISOString().slice(0, 10),
    heure: '09:00',
    heureRetour: '18:00',
    client: 'Délégation Diplomatique Union Européenne',
    service: 'Mission officielle Côte des Arcadins',
    depart: 'Hôtel Karibe',
    destination: 'Decameron Beach Resort',
    passagers: 4,
    chauffeur: 'Jean-Baptiste Pierre',
    vehicule: 'Toyota Land Cruiser Prado TXL',
    statut: 'En cours'
  }
];

const SEED_PAIEMENTS: Paiement[] = [
  {
    id: 'PAI-001',
    reference: 'MONCASH-991204',
    date: new Date().toISOString().slice(0, 10),
    client: 'Délégation Diplomatique Union Européenne',
    montant: 1155,
    devise: 'USD',
    modePaiement: 'Virement Bancaire',
    motif: 'Règlement intégral Facture FAC-2026-001',
    factureAssociee: 'FAC-2026-001',
    statut: 'Validé',
    recuPar: 'Comptabilité Laperle'
  },
  {
    id: 'PAI-002',
    reference: 'NATCASH-552109',
    date: new Date().toISOString().slice(0, 10),
    client: 'Jean-Marc Delacroix',
    montant: 19800,
    devise: 'HTG',
    modePaiement: 'MonCash',
    motif: 'Abonnement scolaire Lucas Delacroix',
    statut: 'Validé',
    recuPar: 'Secrétariat Laperle'
  }
];

const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Nouveau devis demandé',
    message: 'Dr. Beauvoir a configuré une demande de circuit Citadelle Laferrière.',
    type: 'info',
    date: new Date().toISOString(),
    read: false,
    link: 'reservations'
  },
  {
    id: 'notif-2',
    title: 'Paiement confirmé ($1,155 USD)',
    message: 'Virement bancaire validé pour la facture FAC-2026-001 (Délégation UE).',
    type: 'success',
    date: new Date().toISOString(),
    read: false,
    link: 'factures'
  },
  {
    id: 'notif-3',
    title: 'Contrôle technique préventif',
    message: 'La révision périodique du Minibus HiAce VIP BB-44210 est programmée dans 5 jours.',
    type: 'warning',
    date: new Date().toISOString(),
    read: false,
    link: 'vehicules'
  }
];

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'dispatch',
    senderId: 'system',
    senderName: 'Secrétariat Dispatch',
    senderRole: 'secretaire',
    text: 'Bonjour à tous les conducteurs en service. Météo favorable sur la nationale 1. Bonne route.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg-2',
    channelId: 'chauffeurs',
    senderId: 'chf-1',
    senderName: 'Jean-Baptiste Pierre',
    senderRole: 'chauffeur',
    text: 'Prado TXL vérifié, réservoir plein et climatisation OK pour la mission Côte des Arcadins.',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

interface AppContextType {
  // Navigation & UI
  currentModule: string;
  setCurrentModule: (mod: string) => void;
  isPublicLanding: boolean;
  setIsPublicLanding: (val: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (val: boolean) => void;
  authView: 'login' | 'register' | 'verify' | 'forgot';
  setAuthView: (v: 'login' | 'register' | 'verify' | 'forgot') => void;
  chatModalOpen: boolean;
  setChatModalOpen: (val: boolean) => void;
  printSheetData: { type: 'proforma' | 'facture'; data: any } | null;
  setPrintSheetData: (data: { type: 'proforma' | 'facture'; data: any } | null) => void;
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
  convertProformaToFacture: (proforma: Proforma) => Promise<void>;
  convertReservationToProforma: (res: Reservation) => Promise<void>;
  convertReservationToPlanning: (res: Reservation) => Promise<void>;
  generateEleveAbonnementEtFacture: (eleve: Eleve) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  // Navigation states
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isPublicLanding, setIsPublicLanding] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  const [chatModalOpen, setChatModalOpen] = useState<boolean>(false);
  const [printSheetData, setPrintSheetData] = useState<{ type: 'proforma' | 'facture'; data: any } | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [firebaseOnline, setFirebaseOnline] = useState<boolean>(true);

  // Data states with sensible seed defaults
  const [reservations, setReservations] = useState<Reservation[]>(SEED_RESERVATIONS);
  const [proformas, setProformas] = useState<Proforma[]>(SEED_PROFORMAS);
  const [factures, setFactures] = useState<Facture[]>(SEED_FACTURES);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [eleves, setEleves] = useState<Eleve[]>(SEED_ELEVES);
  const [abonnements, setAbonnements] = useState<Abonnement[]>(SEED_ABONNEMENTS);
  const [vehicules, setVehicules] = useState<Vehicule[]>(SEED_VEHICULES);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>(SEED_CHAUFFEURS);
  const [plannings, setPlannings] = useState<Planning[]>(SEED_PLANNINGS);
  const [paiements, setPaiements] = useState<Paiement[]>(SEED_PAIEMENTS);
  const [utilisateurs, setUtilisateurs] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SEED_NOTIFICATIONS);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);

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

    // Helper for syncing collections
    const syncCollection = <T extends { id: string }>(
      collectionName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      fallback: T[]
    ) => {
      try {
        const colRef = collection(db, collectionName);
        const unsub = onSnapshot(
          colRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const list: T[] = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data()
              } as T));
              setter(list);
            }
          },
          (err) => {
            console.warn(`Firestore sync error on ${collectionName}:`, err.message);
          }
        );
        unsubs.push(unsub);
      } catch (err) {
        console.warn(`Subscription setup error for ${collectionName}`);
      }
    };

    syncCollection('reservations', setReservations, SEED_RESERVATIONS);
    syncCollection('proformas', setProformas, SEED_PROFORMAS);
    syncCollection('factures', setFactures, SEED_FACTURES);
    syncCollection('clients', setClients, SEED_CLIENTS);
    syncCollection('eleves', setEleves, SEED_ELEVES);
    syncCollection('abonnements', setAbonnements, SEED_ABONNEMENTS);
    syncCollection('vehicules', setVehicules, SEED_VEHICULES);
    syncCollection('chauffeurs', setChauffeurs, SEED_CHAUFFEURS);
    syncCollection('plannings', setPlannings, SEED_PLANNINGS);
    syncCollection('paiements', setPaiements, SEED_PAIEMENTS);
    syncCollection('utilisateurs', setUtilisateurs, []);
    syncCollection('notifications', setNotifications, SEED_NOTIFICATIONS);

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [user]);

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

    listSetter((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullItem;
        return next;
      }
      return [fullItem, ...prev];
    });

    try {
      if (auth.currentUser) {
        await setDoc(doc(db, colName, id), fullItem as any);
      }
    } catch (e) {
      console.warn(`Failed to write to remote ${colName}, preserved in memory`, e);
    }
    showToast(successMsg, 'success');
  };

  const deleteItemFromCollection = async <T extends { id: string }>(
    colName: string,
    id: string,
    listSetter: React.Dispatch<React.SetStateAction<T[]>>,
    successMsg: string
  ) => {
    listSetter((prev) => prev.filter((p) => p.id !== id));
    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, colName, id));
      }
    } catch (e) {
      console.warn(`Failed to delete from remote ${colName}`, e);
    }
    showToast(successMsg, 'info');
  };

  // Explicit CRUD implementations
  const saveReservation = async (item: Partial<Reservation>) => {
    await saveItemToCollection('reservations', item, setReservations, 'Réservation enregistrée avec succès');
  };
  const deleteReservation = async (id: string) => {
    await deleteItemFromCollection('reservations', id, setReservations, 'Réservation supprimée');
  };

  const saveProforma = async (item: Partial<Proforma>) => {
    await saveItemToCollection('proformas', item, setProformas, 'Devis proforma enregistré');
  };
  const deleteProforma = async (id: string) => {
    await deleteItemFromCollection('proformas', id, setProformas, 'Proforma supprimée');
  };

  const saveFacture = async (item: Partial<Facture>) => {
    await saveItemToCollection('factures', item, setFactures, 'Facture enregistrée');
  };
  const deleteFacture = async (id: string) => {
    await deleteItemFromCollection('factures', id, setFactures, 'Facture supprimée');
  };

  const saveClient = async (item: Partial<Client>) => {
    await saveItemToCollection('clients', item, setClients, 'Client enregistré');
  };
  const deleteClient = async (id: string) => {
    await deleteItemFromCollection('clients', id, setClients, 'Client supprimé');
  };

  const saveEleve = async (item: Partial<Eleve>) => {
    await saveItemToCollection('eleves', item, setEleves, 'Élève enregistré');
  };
  const deleteEleve = async (id: string) => {
    await deleteItemFromCollection('eleves', id, setEleves, 'Élève supprimé');
  };

  const saveAbonnement = async (item: Partial<Abonnement>) => {
    await saveItemToCollection('abonnements', item, setAbonnements, 'Abonnement enregistré');
  };
  const deleteAbonnement = async (id: string) => {
    await deleteItemFromCollection('abonnements', id, setAbonnements, 'Abonnement supprimé');
  };

  const saveVehicule = async (item: Partial<Vehicule>) => {
    await saveItemToCollection('vehicules', item, setVehicules, 'Véhicule mis à jour dans la flotte');
  };
  const deleteVehicule = async (id: string) => {
    await deleteItemFromCollection('vehicules', id, setVehicules, 'Véhicule retiré de la flotte');
  };

  const saveChauffeur = async (item: Partial<Chauffeur>) => {
    await saveItemToCollection('chauffeurs', item, setChauffeurs, 'Chauffeur enregistré');
  };
  const deleteChauffeur = async (id: string) => {
    await deleteItemFromCollection('chauffeurs', id, setChauffeurs, 'Chauffeur supprimé');
  };

  const savePlanning = async (item: Partial<Planning>) => {
    // 1. Détection préventive des conflits horaires
    if (item.date && (item.chauffeur || item.vehicule)) {
      const conflict = plannings.find(
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
    await saveItemToCollection('plannings', item, setPlannings, 'Trajet et planning dispatchés');

    // 3. Synchronisation automatique des statuts de flotte et de chauffeurs
    if (item.vehicule) {
      const targetVeh = vehicules.find(
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
      const targetChf = chauffeurs.find(
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
    await deleteItemFromCollection('plannings', id, setPlannings, 'Planning annulé');
  };

  const savePaiement = async (item: Partial<Paiement>) => {
    await saveItemToCollection('paiements', item, setPaiements, 'Paiement encaissé et enregistré');

    // Liaison Métier Clé : Mise à jour automatique du solde et du statut de la facture liée
    if (item.factureAssociee && (item.statut === 'Validé' || !item.statut)) {
      const targetFacture = factures.find(
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
          setFactures,
          `Facture ${targetFacture.number} mise à jour : Statut [${newStatus}] ($${newPaid}/$${targetFacture.amount})`
        );
      }
    }
  };
  const deletePaiement = async (id: string) => {
    await deleteItemFromCollection('paiements', id, setPaiements, 'Paiement supprimé');
  };

  const saveSettings = async (item: Partial<CompanySettings>) => {
    const updated = { ...settings, ...item };
    setSettings(updated);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'settings', 'company'), updated);
      }
    } catch (e) {
      console.warn('Could not save settings to cloud:', e);
    }
    showToast('Paramètres de l\'entreprise mis à jour', 'success');
  };

  const sendChatMessage = async (text: string, channelId = 'dispatch') => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      channelId,
      senderId: user?.uid || 'guest',
      senderName: profile?.name || profile?.nom || user?.displayName || 'Opérateur',
      senderRole: profile?.role || 'admin',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'messages', newMsg.id), newMsg);
      }
    } catch (e) {}
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const convertProformaToFacture = async (proforma: Proforma) => {
    const factureNumber = `FAC-${Date.now().toString().slice(-6)}`;
    const newFacture: Facture = {
      id: factureNumber,
      number: factureNumber,
      proformaNumber: proforma.number,
      client: proforma.client,
      clientId: proforma.clientId,
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
    await saveProforma({ ...proforma, status: 'Convertie en facture' });
    showToast(`Proforma ${proforma.number} convertie en facture ${factureNumber} avec succès !`, 'success');
  };

  // Passerelle 1 : Réservation ➔ Devis Proforma
  const convertReservationToProforma = async (res: Reservation) => {
    const number = `PRO-${Date.now().toString().slice(-6)}`;
    const amount = Number(res.amount) || 250;
    const tva = Math.round(amount * (settings.tvaPourcentage / 100));
    const newProforma: Proforma = {
      id: number,
      number,
      client: res.client,
      clientId: res.clientId,
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
      notes: res.notes ? `Issu de la réservation ${res.id}. Note : ${res.notes}` : `Généré depuis la réservation ${res.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveProforma(newProforma);
    showToast(`Devis Proforma ${number} généré avec succès pour ${res.client} !`, 'success');
    setCurrentModule('proformas');
  };

  // Passerelle 2 : Réservation ➔ Planning Dispatch Flotte
  const convertReservationToPlanning = async (res: Reservation) => {
    const planningId = `PLN-${Date.now().toString().slice(-6)}`;
    const driverName = res.driver || (chauffeurs.length > 0 ? `${chauffeurs[0].prenom} ${chauffeurs[0].nom}` : 'Jean-Baptiste Pierre');
    const vehName = res.vehicle || (vehicules.length > 0 ? `${vehicules[0].modele} (${vehicules[0].plaque})` : 'Toyota Prado TXL (AA-98124)');

    const newPlanning: Planning = {
      id: planningId,
      date: res.date || new Date().toISOString().slice(0, 10),
      heure: res.time || '08:30',
      client: res.client,
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

  return (
    <AppContext.Provider
      value={{
        currentModule,
        setCurrentModule,
        isPublicLanding,
        setIsPublicLanding,
        authModalOpen,
        setAuthModalOpen,
        authView,
        setAuthView,
        chatModalOpen,
        setChatModalOpen,
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
        convertProformaToFacture,
        convertReservationToProforma,
        convertReservationToPlanning,
        generateEleveAbonnementEtFacture
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
