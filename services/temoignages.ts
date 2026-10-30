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

export const SEED_TEMOIGNAGES: Temoignage[] = [];

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
        callback(remoteList);
      },
      (error) => {
        console.warn('[Temoignages Snapshot Warning]:', error.message);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('[Temoignages Init Warning]:', err);
    callback([]);
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
