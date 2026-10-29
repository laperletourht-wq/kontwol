import {
  db,
  auth,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  handleFirestoreError,
  OperationType,
  type Unsubscribe
} from '../src/lib/firebase';
import type { Temoignage } from '../src/types';

const COLLECTION_NAME = 'temoignages';

export const SEED_TEMOIGNAGES: Temoignage[] = [
  {
    id: 'TEM-001',
    nom: 'Jean-Marc Delacroix',
    titre: 'Directeur Logistique • ONG Humanitaire',
    etoiles: 5,
    commentaire:
      '« Un service d\'une rigueur absolue. Pour les déplacements de nos experts et délégations internationales vers l\'Artibonite et le Cap-Haïtien, les chauffeurs Laperle Tour ont fait preuve d\'un sang-froid et d\'un professionnalisme exemplaires. »',
    auteurId: 'system_seed_1',
    initiales: 'JM',
    createdAt: '2026-09-15T10:30:00.000Z'
  },
  {
    id: 'TEM-002',
    nom: 'Marie-Claire Saint-Juste',
    titre: 'Parent d\'élèves • Collège Saint-Louis de Bourdon',
    etoiles: 5,
    commentaire:
      '« Mes deux enfants prennent la navette scolaire tous les matins. L\'accompagnatrice est aux petits soins et je reçois un message de confirmation dès leur arrivée au collège. Une tranquillité d\'esprit totale pour une mère qui travaille. »',
    auteurId: 'system_seed_2',
    initiales: 'MC',
    createdAt: '2026-09-28T07:45:00.000Z'
  },
  {
    id: 'TEM-003',
    nom: 'David & Vanessa K.',
    titre: 'Voyageurs de la Diaspora • Montréal, Canada',
    etoiles: 5,
    commentaire:
      '« Nous sommes rentrés du Canada pour un séjour de deux semaines en famille. Le SUV Prado était étincelant, la climatisation glaciale et le chauffeur nous a fait redécouvrir la beauté de la Côte des Arcadins et de Jacmel en toute sécurité. »',
    auteurId: 'system_seed_3',
    initiales: 'DK',
    createdAt: '2026-10-10T14:20:00.000Z'
  },
  {
    id: 'TEM-004',
    nom: 'Pierre-Louis A.',
    titre: 'Attaché Logistique • Mission Diplomatique',
    etoiles: 5,
    commentaire:
      '« Des véhicules conformes aux normes protocolaires les plus exigeantes. Véhicules avec vitres teintées, chauffeurs discrets et réactivité impressionnante du centre de régulation en cas de changement d\'horaire de vol. »',
    auteurId: 'system_seed_4',
    initiales: 'PL',
    createdAt: '2026-10-18T16:15:00.000Z'
  }
];

export function subscribeTemoignages(callback: (list: Temoignage[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const remoteList: Temoignage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Temoignage, 'id'>)
        }));
        // Merge with seed testimonials without duplicate IDs
        const remoteIds = new Set(remoteList.map((t) => t.id));
        const filteredSeeds = SEED_TEMOIGNAGES.filter((s) => !remoteIds.has(s.id));
        callback([...remoteList, ...filteredSeeds]);
      },
      (error) => {
        console.warn('[Temoignages Snapshot Warning]:', error.message);
        callback(SEED_TEMOIGNAGES);
      }
    );
  } catch (err) {
    console.warn('[Temoignages Init Warning]:', err);
    callback(SEED_TEMOIGNAGES);
    return () => {};
  }
}

export async function addTemoignage(data: {
  nom: string;
  titre?: string;
  etoiles: number;
  commentaire: string;
}): Promise<Temoignage> {
  if (!auth.currentUser) {
    throw new Error('Vous devez être connecté avec un compte pour ajouter un commentaire.');
  }

  const user = auth.currentUser;
  const id = `TEM-${Date.now().toString().slice(-6)}`;
  const cleanNom = data.nom.trim();
  const words = cleanNom.split(' ').filter(Boolean);
  const initiales =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : cleanNom.slice(0, 2).toUpperCase() || 'CL';

  const newTemoignage: Temoignage = {
    id,
    nom: cleanNom,
    titre: (data.titre || 'Client Laperle Tour').trim(),
    etoiles: Math.max(1, Math.min(5, Number(data.etoiles) || 5)),
    commentaire: data.commentaire.trim(),
    auteurId: user.uid,
    auteurEmail: user.email || '',
    initiales,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), newTemoignage);
    return newTemoignage;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
}

export async function deleteTemoignage(id: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentification requise pour supprimer un commentaire.');
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    throw error;
  }
}
