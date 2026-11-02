import { 
  db, 
  auth, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType,
  type Unsubscribe 
} from '../src/lib/firebase';

export interface CompanySettingsData {
  id: string;
  company: string;
  slogan: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  currency: string;
  logoUrl?: string;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
  [key: string]: unknown;
}

const COLLECTION_NAME = 'settings';
const DOC_ID = 'company';

export const DEFAULT_COMPANY_SETTINGS: CompanySettingsData = {
  id: DOC_ID,
  company: 'LAPERLE TOUR HT',
  slogan: "Un coup d'œil sur Haïti",
  phone: '+509 4440-8687',
  whatsapp: '+509 4440-8687',
  email: 'direction@laperletour.ht',
  address: 'Pétion-Ville & Port-au-Prince, Haïti',
  currency: 'HTG',
  logoUrl: 'logo-laperle.jpg',
  notes: 'Transport • Tourisme • Location • Abonnement scolaire et entreprises • Taxi privé',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

export async function getCompanySettings(): Promise<CompanySettingsData> {
  try {
    const d = await getDoc(doc(db, COLLECTION_NAME, DOC_ID));
    if (d.exists()) {
      return { ...DEFAULT_COMPANY_SETTINGS, ...d.data(), id: DOC_ID } as CompanySettingsData;
    }
    return DEFAULT_COMPANY_SETTINGS;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_ID}`);
  }
}

export async function saveCompanySettings(data: Partial<CompanySettingsData>): Promise<CompanySettingsData> {
  const user = auth.currentUser;
  if (!user) throw new Error('Une session Firebase est requise.');
  const token = await user.getIdToken();

  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new Error(err.error || "Accès refusé. Privilèges administrateur requis côté serveur.");
    }
    throw new Error(err.error || `Erreur serveur (${res.status}) lors de la sauvegarde des paramètres.`);
  }

  const payload: CompanySettingsData = {
    ...DEFAULT_COMPANY_SETTINGS,
    ...data,
    id: DOC_ID,
    updatedAt: new Date().toISOString(),
    updatedBy: user.email || 'admin'
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, DOC_ID), payload, { merge: true });
  } catch (error) {
    console.warn('Notice setDoc local settings après validation serveur:', error);
  }
  return payload;
}

export function subscribeCompanySettings(callback: (settings: CompanySettingsData) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTION_NAME, DOC_ID), (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...DEFAULT_COMPANY_SETTINGS, ...snapshot.data(), id: DOC_ID } as CompanySettingsData);
    } else {
      callback(DEFAULT_COMPANY_SETTINGS);
    }
  }, (error) => {
    console.warn(`[Settings Snapshot Warning]:`, error.message);
  });
}
