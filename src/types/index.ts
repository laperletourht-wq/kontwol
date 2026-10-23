export type UserRole = 
  | 'admin' 
  | 'direction' 
  | 'comptabilite' 
  | 'secretaire' 
  | 'operations' 
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
  status?: 'actif' | 'inactif';
  statutCompte?: string;
  statutClient?: string;
  photoURL?: string;
  adresse?: string;
  ville?: string;
  societe?: string;
  numeroFiscal?: string;
  profileComplete?: boolean;
  permissions?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface Reservation {
  id: string;
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
  vehicle?: string;
  notes?: string;
  status: 'En attente' | 'Confirmée' | 'En cours' | 'Terminée' | 'Annulée';
  telephone?: string;
  email?: string;
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
  notes?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Facture {
  id: string;
  number: string;
  proformaNumber?: string;
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
  paymentMethod?: string;
  items?: ProformaItem[];
  notes?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  type?: 'Particulier' | 'Entreprise' | 'École' | 'Ambassade / ONG' | 'Touriste';
  telephone: string;
  email?: string;
  address?: string;
  city?: string;
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
  date: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  montant: number;
  devise: 'USD' | 'HTG';
  modePaiement: 'MonCash' | 'Natcash' | 'Virement Bancaire' | 'Espèces' | 'Carte de Crédit' | 'Chèque';
  motif: string;
  factureAssociee?: string;
  proformaAssociee?: string;
  statut: 'Validé' | 'En attente' | 'Rejeté';
  recuPar?: string;
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
}
