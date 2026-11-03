export type UserRole = 
  | 'admin' 
  | 'direction' 
  | 'comptabilite' 
  | 'secretaire' 
  | 'operations' 
  | 'vendeur'
  | 'chauffeur' 
  | 'client' 
  | 'prospect' 
  | 'lecture_seule';

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  name?: string;
  nom?: string;
  prenom?: string;
  username?: string;
  telephone?: string;
  phone?: string;
  role: UserRole;
  roles?: UserRole[];
  isSuperAdmin?: boolean;
  allowedModules?: string[]; // Modules/zones d'accès spécifiquement accordés par l'Admin
  permissions?: Record<string, boolean>;
  status?: 'actif' | 'inactif';
  statutCompte?: string;
  statutClient?: string;
  photoURL?: string;
  adresse?: string;
  ville?: string;
  societe?: string;
  numeroFiscal?: string;
  profileComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface SystemZoneDefinition {
  key: string;
  label: string;
  icon: string;
  category: 'Vue Globale' | 'Transport & Flotte' | 'Scolaire' | 'Facturation & Trésorerie' | 'Administration';
  description: string;
  adminOnly?: boolean;
}

export const ALL_SYSTEM_ZONES: SystemZoneDefinition[] = [
  { key: 'dashboard', label: 'Tableau de Bord', icon: '📊', category: 'Vue Globale', description: 'Vue générale, indicateurs clés et activités en direct' },
  { key: 'plannings', label: 'Planning & Dispatch', icon: '📅', category: 'Vue Globale', description: 'Calendrier des trajets, courses assignées et dispatch chauffeurs' },
  { key: 'reservations', label: 'Réservations & Courses', icon: '🚗', category: 'Transport & Flotte', description: 'Prise en charge de passagers, courses privées et transferts VIP' },
  { key: 'vehicules', label: 'Flotte Véhicules', icon: '🚘', category: 'Transport & Flotte', description: 'Suivi du parc automobile, statut de disponibilité et assignations' },
  { key: 'chauffeurs', label: 'Chauffeurs & Personnel', icon: '👔', category: 'Transport & Flotte', description: 'Gestion des chauffeurs assermentés, permis et contacts directs' },
  { key: 'eleves', label: 'Élèves & Ramassage', icon: '🎒', category: 'Scolaire', description: 'Inscriptions scolaires, écoles partenaires et arrêts de navette' },
  { key: 'abonnements', label: 'Abonnements Scolaires', icon: '🎫', category: 'Scolaire', description: 'Contrats de transport mensuels et forfaits récurrents' },
  { key: 'proformas', label: 'Devis Proforma', icon: '📄', category: 'Facturation & Trésorerie', description: 'Émissions d\'estimations et propositions commerciales' },
  { key: 'vendeur', label: 'Espace Vendeur & Devis', icon: '💼', category: 'Facturation & Trésorerie', description: 'Tableau de bord commercial, KPI de vente et conversion de devis' },
  { key: 'factures', label: 'Factures & Règlements', icon: '💳', category: 'Facturation & Trésorerie', description: 'Facturation officielle DGI, suivi des soldes et preuves de paiement' },
  { key: 'paiements', label: 'Trésorerie & Encaissements', icon: '💰', category: 'Facturation & Trésorerie', description: 'MonCash, virements bancaires, chèques et dépenses de service' },
  { key: 'finances', label: 'Comptabilité & Rentabilité', icon: '📈', category: 'Facturation & Trésorerie', description: 'Rapports de recettes, marges et bilans financiers' },
  { key: 'clients', label: 'Répertoire Clients', icon: '👥', category: 'Administration', description: 'Comptes clients, entreprises, délégations et historique' },
  { key: 'utilisateurs', label: 'Gestion Utilisateurs (RBAC)', icon: '🔐', category: 'Administration', description: 'Attribution des rôles et contrôle strict des accès aux zones', adminOnly: true },
  { key: 'vitrine', label: 'Vitrine Publique CMS', icon: '🌐', category: 'Administration', description: 'Personnalisation des offres et textes du site public' },
  { key: 'parametres', label: 'Paramètres Société', icon: '⚙️', category: 'Administration', description: 'Taux de change USD/HTG, TVA et coordonnées de l\'entreprise', adminOnly: true },
];

export interface Reservation {
  id: string;
  dossierId?: string;
  client: string;
  clientId?: string;
  service?: string;
  origin?: string;
  destination?: string;
  date: string;
  time?: string;
  passengers?: number;
  amount?: number;
  currency?: 'USD' | 'HTG';
  driver?: string;
  driverId?: string;
  chauffeur?: string;
  chauffeurTelephone?: string;
  vehicle?: string;
  vehicleId?: string;
  vehicule?: string;
  notes?: string;
  status: 'En attente' | 'Devis émis' | 'Facturé' | 'Confirmée' | 'En cours' | 'Terminée' | 'Annulée' | string;
  telephone?: string;
  email?: string;
  demandeDevis?: boolean;
  demandeFacture?: boolean;
  devisRef?: string;
  proformaRef?: string;
  factureRef?: string;
  paiementRef?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProformaItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Proforma {
  id: string;
  number: string;
  dossierId?: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  telephone?: string;
  service?: string;
  date: string;
  dueDate?: string;
  amount: number;
  currency?: 'USD' | 'HTG';
  items?: ProformaItem[];
  tva?: number;
  totalTTC?: number;
  status: 'En attente' | 'Acceptée' | 'Refusée' | 'Convertie en facture';
  statut?: string;
  reservationId?: string;
  demandeFacture?: boolean;
  factureNumber?: string;
  factureRef?: string;
  notes?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Facture {
  id: string;
  number: string;
  dossierId?: string;
  proformaNumber?: string;
  proformaRef?: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  telephone?: string;
  service?: string;
  date: string;
  dueDate?: string;
  amount: number;
  currency?: 'USD' | 'HTG';
  paidAmount?: number;
  status: 'Payée' | 'En attente' | 'En retard' | 'Partiellement payée' | 'Annulée';
  statut?: string;
  montantTotal?: number;
  totalTTC?: number;
  paymentMethod?: string;
  modePaiement?: string;
  items?: ProformaItem[];
  reservationId?: string;
  paiementRef?: string;
  preuveImage?: string;
  referenceTransaction?: string;
  notes?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  clientId?: string;
  clientUid?: string;
  uid?: string;
  name: string;
  nom?: string;
  type?: 'Particulier' | 'Entreprise' | 'École' | 'Ambassade / ONG' | 'Touriste' | string;
  telephone: string;
  phone?: string;
  email?: string;
  address?: string;
  adresse?: string;
  city?: string;
  ville?: string;
  societe?: string;
  numeroFiscal?: string;
  notes?: string;
  totalOrders?: number;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  ecole: string;
  classe?: string;
  arretRamassage: string;
  parentNom: string;
  parentTelephone: string;
  parentEmail?: string;
  clientId?: string;
  chauffeurId?: string;
  chauffeurAssigne?: string;
  vehiculeAssigne?: string;
  statut: 'Actif' | 'En pause' | 'Suspendu';
  fraisMensuel?: number;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Abonnement {
  id: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  eleveNom?: string;
  typeAbonnement: 'Scolaire' | 'Corporate' | 'Navette Entreprise' | 'VIP Mensuel';
  tarifMensuel: number;
  currency?: 'USD' | 'HTG';
  dateDebut: string;
  dateFin: string;
  statut: 'Actif' | 'Échu' | 'En attente de paiement' | 'Résilié';
  prochainRenouvellement?: string;
  notes?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicule {
  id: string;
  plaque: string;
  marque: string;
  modele: string;
  annee: number;
  couleur?: string;
  categorie: 'SUV VIP' | 'Minibus HiAce' | 'Autocar / Coaster' | 'Berline VIP' | '4x4 Tout-Terrain';
  capacitePassagers: number;
  statut: 'Disponible' | 'En mission' | 'En maintenance' | 'Réservé' | 'Hors service';
  chauffeurAttitre?: string;
  kilometrage?: number;
  assuranceExpiration?: string;
  inspectionExpiration?: string;
  climatisation: boolean;
  gpsActif: boolean;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  permisNumero: string;
  permisCategorie?: string;
  dateEmbauche?: string;
  statut: 'En service' | 'En course' | 'En pause' | 'Congé' | 'Indisponible';
  vehiculeActuel?: string;
  noteService?: number;
  zonesHabituelles?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Planning {
  id: string;
  date: string;
  heure: string;
  heureRetour?: string;
  client: string;
  clientId?: string;
  service: string;
  depart: string;
  destination: string;
  passagers: number;
  chauffeur: string;
  chauffeurId?: string;
  vehicule: string;
  statut: 'Programmé' | 'En cours' | 'Achevé' | 'Retardé' | 'Annulé';
  notes?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paiement {
  id: string;
  reference: string;
  dossierId?: string;
  reservationId?: string;
  date: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  montant: number;
  amount?: number;
  devise: 'USD' | 'HTG';
  currency?: string;
  modePaiement: 'MonCash' | 'Natcash' | 'Virement Bancaire' | 'Espèces' | 'Carte de Crédit' | 'Chèque' | string;
  motif: string;
  factureAssociee?: string;
  proformaAssociee?: string;
  statut: 'Validé' | 'En attente' | 'Rejeté' | string;
  status?: string;
  recuPar?: string;
  preuveImage?: string;
  referenceTransaction?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceSummary {
  recettesUSD: number;
  recettesHTG: number;
  depensesUSD: number;
  depensesHTG: number;
  soldeUSD: number;
  soldeHTG: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  date: string;
  read: boolean;
  link?: string;
  targetId?: string;
  targetAudience?: 'admin' | 'client' | 'chauffeur' | 'all';
  targetUid?: string;
  authorUid?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  text: string;
  createdAt: string;
}

export interface CompanySettings {
  nom: string;
  slogan: string;
  telephone1: string;
  telephone2: string;
  whatsapp: string;
  email: string;
  adresse: string;
  tauxChangeUSD_HTG: number;
  tvaPourcentage: number;
  numeroFiscal?: string;
  bannierePromoActive?: boolean;
  bannierePromoTexte?: string;
  tarifBaseTourisme?: number;
  tarifBaseVip?: number;
  tarifBaseScolaire?: number;
}

export interface Temoignage {
  id: string;
  nom: string;
  titre?: string;
  etoiles: number;
  commentaire: string;
  auteurId: string;
  auteurEmail?: string;
  initiales?: string;
  createdAt: string;
}


