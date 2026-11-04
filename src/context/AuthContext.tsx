import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc,
  type User
} from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const SUPER_ADMIN_EMAILS: string[] = [];

export function isSuperAdminEmail(_email?: string | null): boolean {
  return false;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  roles: UserRole[];
  loading: boolean;
  isSuperAdmin: boolean;
  isProfileComplete: boolean;
  canAccess: (moduleKey: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (data: { 
    email: string; 
    pass: string; 
    nom: string; 
    telephone?: string;
    adresse?: string;
    ville?: string;
    societe?: string;
    numeroFiscal?: string;
  }) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserRoleAndZones: (targetUserId: string, newRole: UserRole, allowedModules: string[], status?: 'actif' | 'inactif') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'dashboard', 'vendeur', 'reservations', 'proformas', 'factures', 'clients', 
    'eleves', 'abonnements', 'vehicules', 'chauffeurs', 'plannings', 
    'paiements', 'finances', 'utilisateurs', 'vitrine', 'parametres'
  ],
  direction: [
    'dashboard', 'vendeur', 'reservations', 'proformas', 'factures', 'clients', 
    'eleves', 'abonnements', 'vehicules', 'chauffeurs', 'plannings', 
    'paiements', 'finances', 'vitrine', 'parametres'
  ],
  comptabilite: [
    'dashboard', 'proformas', 'factures', 'clients', 'abonnements', 
    'paiements', 'finances'
  ],
  secretaire: [
    'dashboard', 'reservations', 'proformas', 'factures', 'clients', 
    'eleves', 'abonnements', 'plannings', 'paiements'
  ],
  operations: [
    'dashboard', 'reservations', 'vehicules', 'chauffeurs', 'plannings'
  ],
  vendeur: [
    'dashboard', 'vendeur', 'proformas', 'factures', 'clients', 'reservations', 'parametres'
  ],
  chauffeur: [
    'dashboard', 'plannings', 'vehicules', 'parametres'
  ],
  client: [
    'dashboard', 'reservations', 'proformas', 'factures', 'parametres'
  ],
  prospect: [
    'dashboard', 'reservations', 'proformas', 'parametres'
  ],
  lecture_seule: [
    'dashboard', 'reservations', 'proformas', 'factures', 'clients', 
    'eleves', 'abonnements', 'vehicules', 'chauffeurs', 'plannings', 
    'paiements', 'finances'
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isRegisteringRef = useRef(false);

  const fetchProfile = async (firebaseUser: User) => {
    try {
      // 1. Contrôle des Custom Claims Firebase Auth pour garantir la cohérence
      let isSuperAdminFromClaims = false;
      let isAdminFromClaims = false;
      try {
        const tokenRes = await firebaseUser.getIdTokenResult();
        if (tokenRes?.claims) {
          if (tokenRes.claims.isSuperAdmin === true) isSuperAdminFromClaims = true;
          if (tokenRes.claims.role === 'admin' || tokenRes.claims.admin === true) isAdminFromClaims = true;
        }
      } catch (claimErr) {
        // Ignorer les erreurs ponctuelles de récupération de claims
      }

      const userRef = doc(db, 'utilisateurs', firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const finalIsSuperAdmin = Boolean(data.isSuperAdmin || (data.role === 'admin' && data.isSuperAdmin) || isSuperAdminFromClaims);
        const assignedRole: UserRole = (finalIsSuperAdmin || isAdminFromClaims || data.role === 'admin')
          ? 'admin'
          : (data.role || 'client');

        const assignedRoles: UserRole[] = Array.isArray(data.roles) && data.roles.length 
          ? data.roles 
          : [assignedRole];
        const assignedAllowedModules = Array.isArray(data.allowedModules) && data.allowedModules.length > 0
          ? data.allowedModules
          : (ROLE_PERMISSIONS[assignedRole] || []);

        const nomVal = data.nom || data.name || firebaseUser.displayName || 'Utilisateur';
        const phoneVal = data.telephone || data.phone || '';
        const adresseVal = data.adresse || (data as any).address || '';
        const villeVal = data.ville || (data as any).city || 'Port-au-Prince';
        const societeVal = data.societe || '';
        const nifVal = data.numeroFiscal || '';
        const isComplete = data.profileComplete !== undefined
          ? Boolean(data.profileComplete)
          : Boolean(nomVal && phoneVal && adresseVal && societeVal && nifVal);

        const fullProfile: UserProfile = {
          ...data,
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email || '',
          nom: nomVal,
          name: nomVal,
          telephone: phoneVal,
          phone: phoneVal,
          adresse: adresseVal,
          ville: villeVal,
          societe: societeVal,
          numeroFiscal: nifVal,
          profileComplete: isComplete,
          role: assignedRole,
          roles: assignedRoles,
          isSuperAdmin: finalIsSuperAdmin,
          allowedModules: assignedAllowedModules,
          status: data.status || 'actif'
        };
        setProfile(fullProfile);
        return;
      }

      // Si l'inscription via registerWithEmail est en cours d'exécution, ne pas écraser avec un profil vide
      if (isRegisteringRef.current) {
        return;
      }

      // Initialisation sécurisée du profil pour nouvel utilisateur si absent de Firestore
      const finalIsSuperAdmin = isSuperAdminFromClaims;
      const defaultRole: UserRole = (finalIsSuperAdmin || isAdminFromClaims) ? 'admin' : 'client';
      const defaultName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur';
      const nowIso = new Date().toISOString();

      const newProfile: UserProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        nom: defaultName,
        name: defaultName,
        telephone: firebaseUser.phoneNumber || '',
        phone: firebaseUser.phoneNumber || '',
        adresse: '',
        ville: 'Port-au-Prince',
        societe: '',
        numeroFiscal: '',
        profileComplete: false,
        role: defaultRole,
        roles: [defaultRole],
        isSuperAdmin: finalIsSuperAdmin,
        status: 'actif',
        statutCompte: 'actif',
        statutClient: defaultRole === 'admin' ? 'admin' : 'client',
        photoURL: firebaseUser.photoURL || '',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      try {
        await setDoc(userRef, newProfile, { merge: true });
      } catch (writeErr) {
        console.warn('Could not write initial profile to Firestore (using memory profile):', writeErr);
      }

      // Synchronisation d'arrière-plan avec le serveur
      try {
        const token = await firebaseUser.getIdToken();
        if (token) {
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newProfile)
          });
        }
      } catch (syncErr) {
        // Ignorer les erreurs de synchronisation non bloquantes
      }

      setProfile(newProfile);
    } catch (err: any) {
      console.warn('Notice fetching user profile (using memory fallback):', err?.message || err);
      // Fallback
      setProfile({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: 'client',
        roles: ['client'],
        isSuperAdmin: false,
        status: 'actif',
        nom: firebaseUser.displayName || 'Utilisateur',
        name: firebaseUser.displayName || 'Utilisateur'
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isSuperAdmin = useMemo(() => {
    return Boolean(profile?.isSuperAdmin || (profile?.role === 'admin' && profile?.isSuperAdmin));
  }, [profile?.isSuperAdmin, profile?.role]);

  const role: UserRole = useMemo(() => {
    return profile?.role || 'lecture_seule';
  }, [profile?.role]);

  const roles: UserRole[] = useMemo(() => {
    return profile?.roles || (profile?.role ? [profile.role] : ['lecture_seule']);
  }, [profile?.roles, profile?.role]);

  const canAccess = (moduleKey: string): boolean => {
    if (isSuperAdmin || role === 'admin') return true;
    // 1. Zones personnalisées attribuées spécifiquement par l'Administrateur
    if (profile?.allowedModules && Array.isArray(profile.allowedModules) && profile.allowedModules.length > 0) {
      return profile.allowedModules.includes(moduleKey);
    }
    // 2. Dictionnaire fin de permissions
    if (profile?.permissions && profile.permissions[moduleKey] !== undefined) {
      return Boolean(profile.permissions[moduleKey]);
    }
    // 3. Fallback basé sur les rôles par défaut
    for (const r of roles) {
      const allowed = ROLE_PERMISSIONS[r] || [];
      if (allowed.includes(moduleKey)) return true;
    }
    return false;
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      await fetchProfile(cred.user);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    if (cred.user) {
      await fetchProfile(cred.user);
    }
  };

  const registerWithEmail = async (data: { 
    email: string; 
    pass: string; 
    nom: string; 
    telephone?: string;
    adresse?: string;
    ville?: string;
    societe?: string;
    numeroFiscal?: string;
  }) => {
    isRegisteringRef.current = true;
    try {
      const { email, pass, nom, telephone, adresse, ville, societe, numeroFiscal } = data;
      const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth');
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        try {
          await updateProfile(cred.user, { displayName: nom });
        } catch (e) {}

        // Envoi officiel du mail de vérification Firebase Authentication
        try {
          await sendEmailVerification(cred.user);
        } catch (verifErr) {
          console.warn('[Firebase Auth] sendEmailVerification notice:', verifErr);
        }

        const defaultRole: UserRole = 'client';
        const nomVal = (nom || '').trim();
        const phoneVal = (telephone || '').trim();
        const adresseVal = (adresse || '').trim();
        const villeVal = (ville || 'Port-au-Prince').trim();
        const societeVal = (societe || '').trim();
        const nifVal = (numeroFiscal || '').trim();
        const isComplete = Boolean(nomVal && phoneVal && adresseVal && societeVal && nifVal);
        const nowIso = new Date().toISOString();

        const initialProfile: UserProfile = {
          id: cred.user.uid,
          uid: cred.user.uid,
          email,
          nom: nomVal,
          name: nomVal,
          telephone: phoneVal,
          phone: phoneVal,
          adresse: adresseVal,
          ville: villeVal,
          societe: societeVal,
          numeroFiscal: nifVal,
          profileComplete: isComplete,
          role: defaultRole,
          roles: [defaultRole],
          isSuperAdmin: false,
          status: 'actif',
          statutCompte: 'actif',
          statutClient: 'client',
          createdAt: nowIso,
          updatedAt: nowIso
        };

        // 1. Enregistrement direct du profil utilisateur dans Firestore
        try {
          await setDoc(doc(db, 'utilisateurs', cred.user.uid), initialProfile, { merge: true });
        } catch (e) {
          console.warn('Initial registration setDoc fallback:', e);
        }

        // 2. Création automatique de la fiche client pour le cycle commercial
        if ((defaultRole as string) !== 'admin') {
          const clientDoc = {
            id: cred.user.uid,
            clientId: cred.user.uid,
            clientUid: cred.user.uid,
            uid: cred.user.uid,
            name: societeVal.toLowerCase() === 'particulier' ? nomVal : (societeVal ? `${nomVal} (${societeVal})` : nomVal),
            nom: nomVal,
            telephone: phoneVal,
            phone: phoneVal,
            email,
            address: adresseVal ? `${adresseVal}, ${villeVal}` : '',
            adresse: adresseVal,
            city: villeVal,
            ville: villeVal,
            type: societeVal.toLowerCase() === 'particulier' ? 'Particulier' : 'Entreprise',
            societe: societeVal,
            numeroFiscal: nifVal,
            status: 'Actif',
            archived: false,
            createdAt: nowIso,
            updatedAt: nowIso
          };
          try {
            await setDoc(doc(db, 'clients', cred.user.uid), clientDoc, { merge: true });
          } catch (clientErr) {
            console.warn('Clients sync on register notice:', clientErr);
          }
        }

        // 3. Synchronisation côté serveur
        try {
          const token = await cred.user.getIdToken();
          if (token) {
            await fetch('/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(initialProfile)
            });
          }
        } catch (apiErr) {
          console.warn('Backend API register sync notice:', apiErr);
        }

        setProfile(initialProfile);
      }
    } finally {
      isRegisteringRef.current = false;
    }
  };

  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    const hasNom = Boolean(profile.nom?.trim() || profile.name?.trim());
    const hasPhone = Boolean(profile.telephone?.trim() || profile.phone?.trim());
    const hasAdresse = Boolean(profile.adresse?.trim());
    const hasSociete = Boolean(profile.societe?.trim());
    const hasNif = Boolean(profile.numeroFiscal?.trim());
    return Boolean(hasNom && hasPhone && hasAdresse && hasSociete && hasNif);
  }, [profile]);

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("Utilisateur non connecté");

    const nomVal = (data.nom ?? profile?.nom ?? data.name ?? profile?.name ?? '').trim();
    const phoneVal = (data.telephone ?? profile?.telephone ?? data.phone ?? profile?.phone ?? '').trim();
    const adresseVal = (data.adresse ?? profile?.adresse ?? '').trim();
    const villeVal = (data.ville ?? profile?.ville ?? 'Port-au-Prince').trim();
    const societeVal = (data.societe ?? profile?.societe ?? '').trim();
    const nifVal = (data.numeroFiscal ?? profile?.numeroFiscal ?? '').trim();

    const isComplete = Boolean(nomVal && phoneVal && adresseVal && societeVal && nifVal);
    const nowIso = new Date().toISOString();

    const updatedProfile: UserProfile = {
      ...(profile || {
        id: user.uid,
        email: user.email || '',
        role: 'client',
        roles: ['client'],
        status: 'actif'
      }),
      ...data,
      id: user.uid,
      uid: user.uid,
      email: user.email || profile?.email || '',
      nom: nomVal,
      name: nomVal,
      telephone: phoneVal,
      phone: phoneVal,
      adresse: adresseVal,
      ville: villeVal,
      societe: societeVal,
      numeroFiscal: nifVal,
      profileComplete: isComplete,
      updatedAt: nowIso
    };

    const userRef = doc(db, 'utilisateurs', user.uid);
    const updateData: Record<string, any> = {
      nom: nomVal,
      name: nomVal,
      telephone: phoneVal,
      phone: phoneVal,
      adresse: adresseVal,
      ville: villeVal,
      societe: societeVal,
      numeroFiscal: nifVal,
      profileComplete: isComplete,
      updatedAt: nowIso
    };

    // If profile was empty or not in Firestore yet, supply identity fields
    if (!profile) {
      updateData.id = user.uid;
      updateData.uid = user.uid;
      updateData.email = user.email || '';
      updateData.role = 'client';
      updateData.roles = ['client'];
      updateData.status = 'actif';
      updateData.statutCompte = 'actif';
      updateData.statutClient = 'client';
      updateData.createdAt = nowIso;
    }

    // 1. Direct Firestore write
    try {
      await setDoc(userRef, updateData, { merge: true });
    } catch (err: any) {
      console.warn("Direct Firestore setDoc notice, continuing to client and backend sync:", err?.message || err);
    }

    // 2. Direct Firestore 'clients' directory upsert
    try {
      const clientDoc = {
        id: user.uid,
        clientId: user.uid,
        clientUid: user.uid,
        uid: user.uid,
        name: societeVal.toLowerCase() === 'particulier' ? nomVal : (societeVal ? `${nomVal} (${societeVal})` : nomVal),
        nom: nomVal,
        telephone: phoneVal,
        phone: phoneVal,
        email: user.email || profile?.email || '',
        address: adresseVal ? `${adresseVal}, ${villeVal}` : '',
        adresse: adresseVal,
        city: villeVal,
        ville: villeVal,
        type: societeVal.toLowerCase() === 'particulier' ? 'Particulier' : 'Entreprise',
        societe: societeVal,
        numeroFiscal: nifVal,
        status: 'Actif',
        archived: false,
        updatedAt: nowIso
      };
      await setDoc(doc(db, 'clients', user.uid), clientDoc, { merge: true });
    } catch (clientWriteErr) {
      console.warn('Direct Firestore client record sync notice:', clientWriteErr);
    }

    // 3. Server-side sync via /api/auth/profile
    try {
      const token = await user.getIdToken();
      if (token) {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
      }
    } catch (apiErr) {
      console.warn('Backend API profile sync notice:', apiErr);
    }

    setProfile(updatedProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        await auth.currentUser.getIdToken(true);
      } catch (e) {}
      setUser(auth.currentUser);
      await fetchProfile(auth.currentUser);
    } else if (user) {
      await fetchProfile(user);
    }
  };

  const updateUserRoleAndZones = async (
    targetUserId: string,
    newRole: UserRole,
    allowedModules: string[],
    status: 'actif' | 'inactif' = 'actif'
  ) => {
    if (!user) {
      throw new Error("Authentification Firebase requise.");
    }
    const token = await user.getIdToken();
    if (!token) {
      throw new Error("Jeton Firebase introuvable.");
    }

    // 1. Validation et exécution stricte côté serveur via Firebase Admin SDK
    const response = await fetch(`/api/admin/users/${targetUserId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        role: newRole,
        roles: [newRole],
        allowedModules,
        status
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        throw new Error(errorData.error || "Accès refusé. Privilèges administrateur requis côté serveur.");
      }
      throw new Error(errorData.error || `Erreur serveur (${response.status}) lors de la modification des permissions.`);
    }

    // 2. Synchronisation miroir locale
    const userRef = doc(db, 'utilisateurs', targetUserId);
    const updatePayload = {
      role: newRole,
      roles: [newRole],
      allowedModules,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'admin'
    };
    try {
      await setDoc(userRef, updatePayload, { merge: true });
    } catch (e) {
      console.warn('Notice sync local Firestore après validation serveur:', e);
    }

    if (user?.uid === targetUserId) {
      setProfile((prev) => (prev ? { ...prev, ...updatePayload } : null));
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        roles,
        loading,
        isSuperAdmin,
        isProfileComplete,
        canAccess,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        updateUserProfile,
        logout,
        refreshProfile,
        resendVerificationEmail,
        updateUserRoleAndZones
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
