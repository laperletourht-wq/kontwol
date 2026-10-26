import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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

export const SUPER_ADMIN_EMAILS = [
  'castimamoise@gmail.com', 
  'laperletourht@gmail.com'
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
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
  registerWithEmail: (data: { email: string; pass: string; nom: string; telephone?: string }) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserRoleAndZones: (targetUserId: string, newRole: UserRole, allowedModules: string[], status?: 'actif' | 'inactif') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'dashboard', 'reservations', 'proformas', 'factures', 'clients', 
    'eleves', 'abonnements', 'vehicules', 'chauffeurs', 'plannings', 
    'paiements', 'finances', 'utilisateurs', 'vitrine', 'parametres'
  ],
  direction: [
    'dashboard', 'reservations', 'proformas', 'factures', 'clients', 
    'eleves', 'abonnements', 'vehicules', 'chauffeurs', 'plannings', 
    'paiements', 'finances', 'vitrine', 'parametres'
  ],
  comptabilite: [
    'dashboard', 'proformas', 'factures', 'clients', 'abonnements', 
    'paiements', 'finances'
  ],
  secretaire: [
    'dashboard', 'reservations', 'proformas', 'factures', 'clients', 
    'eleves', 'abonnements', 'plannings'
  ],
  operations: [
    'dashboard', 'reservations', 'vehicules', 'chauffeurs', 'plannings'
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

  const fetchProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'utilisateurs', firebaseUser.uid);
      const snap = await getDoc(userRef);
      const isSuper = isSuperAdminEmail(firebaseUser.email);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const assignedRole: UserRole = isSuper ? 'admin' : (data.role || 'client');
        const assignedRoles: UserRole[] = isSuper 
          ? ['admin'] 
          : (Array.isArray(data.roles) && data.roles.length ? data.roles : [assignedRole]);
        const assignedAllowedModules = Array.isArray(data.allowedModules) && data.allowedModules.length > 0
          ? data.allowedModules
          : (ROLE_PERMISSIONS[assignedRole] || []);

        const fullProfile: UserProfile = {
          ...data,
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: data.nom || data.name || firebaseUser.displayName || 'Utilisateur',
          role: assignedRole,
          roles: assignedRoles,
          allowedModules: assignedAllowedModules,
          status: data.status || 'actif'
        };
        setProfile(fullProfile);
        return;
      }

      // Automatically initialize default profile for new user
      const defaultRole: UserRole = isSuper ? 'admin' : 'client';
      const newProfile: UserProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        nom: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur',
        name: firebaseUser.displayName || 'Utilisateur',
        role: defaultRole,
        roles: [defaultRole],
        status: 'actif',
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(userRef, newProfile);
      } catch (writeErr) {
        console.warn('Could not write initial profile to Firestore (using memory profile):', writeErr);
      }
      setProfile(newProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Fallback
      const isSuper = isSuperAdminEmail(firebaseUser.email);
      setProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: isSuper ? 'admin' : 'client',
        roles: isSuper ? ['admin'] : ['client'],
        status: 'actif',
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
    return isSuperAdminEmail(user?.email || profile?.email);
  }, [user?.email, profile?.email]);

  const role: UserRole = useMemo(() => {
    if (isSuperAdmin) return 'admin';
    return profile?.role || 'lecture_seule';
  }, [isSuperAdmin, profile?.role]);

  const roles: UserRole[] = useMemo(() => {
    if (isSuperAdmin) return ['admin'];
    return profile?.roles || [role];
  }, [isSuperAdmin, profile?.roles, role]);

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
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await fetchProfile(cred.user);
    }
  };

  const registerWithEmail = async ({ email, pass, nom, telephone }: { email: string; pass: string; nom: string; telephone?: string }) => {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      try {
        await updateProfile(cred.user, { displayName: nom });
      } catch (e) {}

      const isSuper = isSuperAdminEmail(email);
      const defaultRole: UserRole = isSuper ? 'admin' : 'client';
      const initialProfile: UserProfile = {
        id: cred.user.uid,
        uid: cred.user.uid,
        email,
        nom,
        name: nom,
        telephone: telephone || '',
        phone: telephone || '',
        role: defaultRole,
        roles: [defaultRole],
        status: 'actif',
        statutCompte: 'actif',
        statutClient: defaultRole === 'admin' ? 'admin' : 'client',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'utilisateurs', cred.user.uid), initialProfile);
      } catch (e) {
        console.warn('Initial registration setDoc fallback:', e);
      }
      setProfile(initialProfile);
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
    const villeVal = (data.ville ?? profile?.ville ?? '').trim();
    const societeVal = (data.societe ?? profile?.societe ?? '').trim();
    const nifVal = (data.numeroFiscal ?? profile?.numeroFiscal ?? '').trim();

    const isComplete = Boolean(nomVal && phoneVal && adresseVal && societeVal && nifVal);

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
      updatedAt: new Date().toISOString()
    };

    try {
      const userRef = doc(db, 'utilisateurs', user.uid);
      await setDoc(userRef, {
        nom: nomVal,
        name: nomVal,
        telephone: phoneVal,
        phone: phoneVal,
        adresse: adresseVal,
        ville: villeVal,
        societe: societeVal,
        numeroFiscal: nifVal,
        profileComplete: isComplete,
        updatedAt: updatedProfile.updatedAt,
        status: updatedProfile.status || 'actif',
        statutCompte: updatedProfile.statutCompte || 'actif',
        statutClient: updatedProfile.statutClient || 'client',
        role: updatedProfile.role || 'client',
        roles: updatedProfile.roles || [updatedProfile.role || 'client']
      }, { merge: true });
    } catch (err) {
      console.warn("Mise à jour Firestore en attente / mémoire locale :", err);
    }

    setProfile(updatedProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const updateUserRoleAndZones = async (
    targetUserId: string,
    newRole: UserRole,
    allowedModules: string[],
    status: 'actif' | 'inactif' = 'actif'
  ) => {
    if (role !== 'admin' && !isSuperAdmin) {
      throw new Error("Seul l'administrateur peut modifier le rôle d'une personne et lui attribuer l'accès aux zones.");
    }
    const userRef = doc(db, 'utilisateurs', targetUserId);
    const updatePayload = {
      role: newRole,
      roles: [newRole],
      allowedModules,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'admin'
    };
    await setDoc(userRef, updatePayload, { merge: true });
    if (user?.uid === targetUserId) {
      setProfile((prev) => (prev ? { ...prev, ...updatePayload } : null));
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
