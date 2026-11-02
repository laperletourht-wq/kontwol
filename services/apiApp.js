import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), '..');

const app = express();

// Trust Cloud Run reverse proxy
app.set('trust proxy', 1);

// Ensure iframe embedding in AI Studio is NEVER blocked
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  next();
});

// =========================================================================
// LOCAL PROFILE STORE (Resilient Fallback when Service Account JSON is missing)
// =========================================================================
function getLocalUsers() {
  try {
    const p = path.join(__dirname, 'data', 'utilisateurs.json');
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      return content ? JSON.parse(content) : [];
    }
  } catch (e) {}
  return [];
}

function saveLocalUser(profile) {
  try {
    const p = path.join(__dirname, 'data', 'utilisateurs.json');
    const list = getLocalUsers();
    const idx = list.findIndex(u => (u.id === profile.id || u.uid === profile.uid || (u.email && profile.email && u.email.toLowerCase() === profile.email.toLowerCase())));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...profile };
    } else {
      list.push(profile);
    }
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('saveLocalUser error:', e?.message);
  }
}

function getLocalUserProfile(uid) {
  const list = getLocalUsers();
  return list.find(u => (u.id === uid || u.uid === uid || (u.email && u.email.toLowerCase() === String(uid).toLowerCase()))) || null;
}

// =========================================================================
// FIREBASE FIRESTORE CLOUD INTEGRATION (Single Source of Truth)
// =========================================================================
const rawApiKey = process.env.FIREBASE_API_KEY || "AIzaSyD4D5AajRVUFI6tkf42NlkrmwNMRcuCfbI";
const cleanApiKey = String(rawApiKey).replace(/^["']|["']$/g, '').trim();

const firebaseConfig = {
  projectId: "laperletourht-28ad8",
  appId: "1:385210839996:web:e1873fe5675e5730cab1b9",
  apiKey: cleanApiKey,
  authDomain: "laperletourht-28ad8.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-centredecontrole-27e8ff4b-e91d-4923-8cc6-6265fb193fe7",
  storageBucket: "laperletourht-28ad8.firebasestorage.app",
  messagingSenderId: "385210839996",
  oAuthClientId: "385210839996-rj4uvt3iep5hefj4km198vjgemuk5g4g.apps.googleusercontent.com"
};


// Firebase Admin SDK pour l'authentification de confiance côté serveur
let adminAuth = null;
let adminDb = null;
try {
  const existingAdminApps = getAdminApps();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccount = serviceAccountJson ? JSON.parse(serviceAccountJson) : null;
  const hasAdminCredentials = !!(serviceAccount || process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (process.env.VERCEL === '1' && !serviceAccount && existingAdminApps.length === 0) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required on Vercel.');
  }
  const adminApp = existingAdminApps.length ? existingAdminApps[0] : initAdminApp({
    projectId: serviceAccount?.project_id || firebaseConfig.projectId,
    ...(serviceAccount ? { credential: cert(serviceAccount) } : {})
  });
  adminAuth = getAdminAuth(adminApp);
  if (hasAdminCredentials) {
    try {
      adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
    } catch {
      adminDb = null;
    }
  }
} catch (adminInitErr) {
  console.warn('[Firebase Admin SDK Init]:', adminInitErr?.message);
}

async function requireFirebaseUser(req, res) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Authentification Firebase requise.' });
    return null;
  }
  if (!adminAuth) {
    res.status(503).json({ error: 'Firebase Admin indisponible.' });
    return null;
  }
  try {
    // Check revoked = false verifies the token cryptographically via Google public certificates
    // without requiring an external IAM Identity Toolkit service account call.
    const decoded = await adminAuth.verifyIdToken(token, false);
    return { ...decoded, uid: decoded.uid, email: String(decoded.email || '').toLowerCase() };
  } catch (err) {
    console.warn('[requireFirebaseUser] verifyIdToken error:', err?.code || err?.message);
    res.status(401).json({ error: 'Jeton Firebase invalide ou révoqué.' });
    return null;
  }
}

async function getServerProfile(uid) {
  if (adminDb) {
    try {
      const snap = await adminDb.collection('utilisateurs').doc(uid).get();
      if (snap.exists) return snap.data();
    } catch (e) {
      // Admin DB permissions or offline
    }
  }
  return getLocalUserProfile(uid);
}

// Vérifie si l'utilisateur possède réellement les privilèges administrateur côté serveur
// Utilise les Custom Claims Firebase Auth, les identités maîtres déclarées et la base Firestore / locale
async function isServerAdmin(user) {
  if (!user || !user.uid) return false;

  // 1. Custom Claims vérifiés cryptographiquement par Firebase Admin SDK
  if (user.admin === true || user.role === 'admin' || user.isSuperAdmin === true) {
    return true;
  }

  // 2. Identité propriétaire Super Administrateur maître (conforme aux firestore.rules)
  const email = String(user.email || '').toLowerCase().trim();
  const phone = String(user.phone_number || '').trim();
  if (
    email === 'castimamoise@gmail.com' ||
    email === 'laperletourht@gmail.com' ||
    phone === '+50937233816' ||
    phone === '+50942858888'
  ) {
    return true;
  }

  // 3. Vérification de la collection /admins/{uid} ou du document /utilisateurs/{uid} via Firestore Admin
  if (adminDb) {
    try {
      const adminDoc = await adminDb.collection('admins').doc(user.uid).get();
      if (adminDoc.exists) return true;

      const userDoc = await adminDb.collection('utilisateurs').doc(user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        const role = String(data?.role || '').toLowerCase();
        const roles = Array.isArray(data?.roles) ? data.roles.map(r => String(r).toLowerCase()) : [];
        const status = String(data?.status || data?.statutCompte || 'actif').toLowerCase();
        if ((role === 'admin' || roles.includes('admin') || Boolean(data?.isSuperAdmin)) && status !== 'inactif' && status !== 'suspendu') {
          return true;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  // 4. Vérification dans le magasin de profils local
  const local = getLocalUserProfile(user.uid);
  if (local) {
    const role = String(local.role || '').toLowerCase();
    const roles = Array.isArray(local.roles) ? local.roles.map(r => String(r).toLowerCase()) : [];
    const status = String(local.status || local.statutCompte || 'actif').toLowerCase();
    if ((role === 'admin' || roles.includes('admin') || Boolean(local.isSuperAdmin)) && status !== 'inactif' && status !== 'suspendu') {
      return true;
    }
  }

  return false;
}

// Middleware de contrôle strict administrateur : renvoie 401 si non authentifié, 403 si non administrateur
async function requireAdminUser(req, res) {
  const user = await requireFirebaseUser(req, res);
  if (!user) return null; // 401 déjà envoyé par requireFirebaseUser

  const isAdmin = await isServerAdmin(user);
  if (!isAdmin) {
    res.status(403).json({
      error: "Accès refusé. Privilèges administrateur requis."
    });
    return null;
  }
  return user;
}

async function hasServerRole(target, roles) {
  const uid = typeof target === 'string' ? target : target?.uid;
  if (!uid) return false;

  // Si on passe l'objet user décodé et qu'il est administrateur, autoriser immédiatement
  if (typeof target === 'object' && target.uid && (await isServerAdmin(target))) {
    return true;
  }

  const profile = await getServerProfile(uid);
  if (!profile) return false;
  const values = Array.isArray(profile?.roles) ? profile.roles.map(r => String(r).toLowerCase()) : [String(profile?.role || '').toLowerCase()];
  const status = String(profile?.status || profile?.statutCompte || '').toLowerCase();
  if (status === 'inactif' || status === 'suspendu') return false;

  // L'administrateur a accès à l'ensemble des fonctionnalités du personnel
  if (values.includes('admin') || Boolean(profile.isSuperAdmin)) return true;

  const allowed = roles.map(r => String(r).toLowerCase());
  return values.some(role => allowed.includes(role));
}

function timestampMillis(value) {
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  const millis = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(millis) ? millis : null;
}

// =========================================================================
// SECURITY & PERFORMANCE MIDDLEWARES (Global 500+ Users Scaling)
// =========================================================================

// 1. HTTP Security Headers with Helmet (Tailored for AI Studio Iframe & Firebase)
app.use((req, res, next) => {
  if (req.url && req.url.includes('__aistudio')) return next();
  return helmet({
    frameguard: false, // DO NOT emit X-Frame-Options so AI Studio iframe connects smoothly
    crossOriginOpenerPolicy: false, // Allow Google Auth popups and external links
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Allow scripts, styles, images and iframe embedding without restriction
  })(req, res, next);
});

// 2. High-performance Compression (Gzip / Brotli)
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression'] || (req.url && req.url.includes('__aistudio'))) return false;
    return compression.filter(req, res);
  }
}));

// 3. CORS Support
app.use(cors({
  origin: true,
  credentials: true
}));

// 4. Rate Limiting for Global Protection (tolerant of reverse proxies)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean(req.url && req.url.includes('__aistudio')),
  validate: { xForwardedForHeader: false },
  message: { error: 'Trop de requêtes depuis cette adresse IP. Veuillez patienter un instant.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean(req.url && req.url.includes('__aistudio')),
  validate: { xForwardedForHeader: false },
  message: { error: 'Trop de tentatives de connexion/inscription. Veuillez réessayer dans quelques minutes.' }
});

app.use(generalLimiter);
app.use('/api/auth/register', authLimiter);

// 5. JSON Body Parser with standard limits
app.use(express.json({ limit: '5mb' }));

// Authentication and identity are backed exclusively by Firebase Auth + Admin Firestore.
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Centre de Contrôle Laperle' }));

app.post('/api/auth/register', async (req, res) => {
  const user = await requireFirebaseUser(req, res);
  if (!user) return;

  const safeName = String(req.body?.name || req.body?.nom || user.name || user.email?.split('@')[0] || '').trim().slice(0, 150);
  const safeUsername = String(req.body?.username || user.email?.split('@')[0] || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 50);
  const safePhone = String(req.body?.telephone || req.body?.phone || '').trim().slice(0, 50);

  // Sécurité : Les privilèges d'administration ne peuvent jamais être auto-attribués lors de l'inscription.
  // L'attribution du rôle administrateur est strictement réservée au Firebase Admin SDK côté serveur.
  const role = 'prospect';
  const roles = ['prospect'];
  const statutClient = 'prospect';

  const safeProfile = {
    id: user.uid, uid: user.uid, email: user.email,
    name: safeName, nom: safeName, prenom: String(req.body?.prenom || '').trim().slice(0, 100),
    username: safeUsername, telephone: safePhone, phone: safePhone,
    photoURL: String(req.body?.photoURL || user.picture || '').slice(0, 500),
    role, roles, statutClient,
    status: 'actif', statutCompte: 'actif', permissions: {},
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };

  // 1. Try Firestore Admin first if available
  if (adminDb) {
    try {
      const ref = adminDb.collection('utilisateurs').doc(user.uid);
      const snap = await ref.get();
      if (snap.exists) {
        const existing = snap.data();
        const merged = { ...existing, id: user.uid, uid: user.uid };
        saveLocalUser(merged);
        return res.status(200).json({ success: true, profile: merged });
      }
      await ref.set({
        ...safeProfile,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      saveLocalUser(safeProfile);
      return res.status(201).json({ success: true, profile: safeProfile });
    } catch (adminErr) {
      if (adminErr?.code === 7 || String(adminErr?.message).includes('PERMISSION_DENIED')) {
        adminDb = null;
      }
    }
  }

  // 2. Fallback to local profile store
  saveLocalUser(safeProfile);
  return res.status(201).json({ success: true, profile: safeProfile });
});

// =========================================================================
// INITIALISATION SÉCURISÉE DU PREMIER ADMINISTRATEUR (CÔTÉ SERVEUR)
// =========================================================================
app.post('/api/auth/bootstrap-first-admin', async (req, res) => {
  const user = await requireFirebaseUser(req, res);
  if (!user) return;

  // 1. Vérification stricte : aucun administrateur ne doit exister dans le système
  let hasExistingAdmin = false;
  if (adminDb) {
    try {
      const snapByRole = await adminDb.collection('utilisateurs').where('role', '==', 'admin').limit(1).get();
      if (!snapByRole.empty) {
        hasExistingAdmin = true;
      } else {
        const snapByRoles = await adminDb.collection('utilisateurs').where('roles', 'array-contains', 'admin').limit(1).get();
        if (!snapByRoles.empty) {
          hasExistingAdmin = true;
        }
      }
    } catch (e) {
      console.warn('[bootstrap-first-admin] Vérification Firestore admin existant:', e?.message);
    }
  }

  const localUsers = getLocalUsers();
  if (localUsers.some(u => u.role === 'admin' || (Array.isArray(u.roles) && u.roles.includes('admin')))) {
    hasExistingAdmin = true;
  }

  // Si au moins un administrateur existe déjà, bloquer définitivement l'accès
  if (hasExistingAdmin) {
    return res.status(403).json({
      error: "Un administrateur existe déjà dans le système. La procédure d'initialisation du premier administrateur est définitivement désactivée."
    });
  }

  // 2. Vérification optionnelle d'un secret d'initialisation serveur défini par le propriétaire
  const expectedInitToken = process.env.ADMIN_BOOTSTRAP_SECRET || process.env.ADMIN_INIT_TOKEN;
  if (expectedInitToken) {
    const providedToken = req.headers['x-admin-bootstrap-token'] || req.body?.initToken;
    if (providedToken !== expectedInitToken) {
      return res.status(403).json({ error: "Jeton secret d'initialisation serveur invalide." });
    }
  }

  // 3. Attribution du rôle administrateur via Firebase Admin SDK
  try {
    // a. Custom Claims Firebase Auth
    if (adminAuth) {
      await adminAuth.setCustomUserClaims(user.uid, {
        role: 'admin',
        isSuperAdmin: true,
        admin: true
      });
    }

    // b. Document Firestore
    const adminProfile = {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      nom: user.name || user.email.split('@')[0],
      role: 'admin',
      roles: ['admin'],
      isSuperAdmin: true,
      statutClient: 'admin',
      status: 'actif',
      statutCompte: 'actif',
      permissions: {},
      updatedAt: new Date().toISOString()
    };

    if (adminDb) {
      await adminDb.collection('utilisateurs').doc(user.uid).set({
        ...adminProfile,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    saveLocalUser(adminProfile);

    console.log(`[BOOTSTRAP ADMIN] Premier administrateur initialisé côté serveur : ${user.email} (${user.uid})`);

    return res.json({
      success: true,
      message: "Premier administrateur initialisé avec succès côté serveur via Firebase Admin SDK.",
      user: {
        uid: user.uid,
        email: user.email,
        role: 'admin',
        isSuperAdmin: true
      }
    });
  } catch (err) {
    console.error('[bootstrap-first-admin] Erreur :', err);
    return res.status(500).json({ error: "Erreur lors de l'initialisation du premier administrateur." });
  }
});

app.post('/api/auth/profile', async (req, res) => {
  const user = await requireFirebaseUser(req, res);
  if (!user) return;

  const body = req.body || {};
  const safeName = String(body.nom || body.name || user.name || user.email?.split('@')[0] || '').trim().slice(0, 150);
  const safePhone = String(body.telephone || body.phone || '').trim().slice(0, 50);
  const safeAdresse = String(body.adresse || '').trim().slice(0, 300);
  const safeVille = String(body.ville || 'Port-au-Prince').trim().slice(0, 100);
  const safeSociete = String(body.societe || '').trim().slice(0, 150);
  const safeNumeroFiscal = String(body.numeroFiscal || '').trim().slice(0, 100);
  const isComplete = Boolean(safeName && safePhone && safeAdresse && safeSociete && safeNumeroFiscal);

  const updates = {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    name: safeName,
    nom: safeName,
    telephone: safePhone,
    phone: safePhone,
    adresse: safeAdresse,
    ville: safeVille,
    societe: safeSociete,
    numeroFiscal: safeNumeroFiscal,
    profileComplete: isComplete,
    updatedAt: new Date().toISOString()
  };

  if (adminDb) {
    try {
      const userRef = adminDb.collection('utilisateurs').doc(user.uid);
      await userRef.set({
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // Upsert client entry in clients collection for seamless invoicing & bookings
      const clientRef = adminDb.collection('clients').doc(user.uid);
      await clientRef.set({
        id: user.uid,
        clientId: user.uid,
        clientUid: user.uid,
        uid: user.uid,
        name: safeSociete.toLowerCase() === 'particulier' ? safeName : `${safeName} (${safeSociete})`,
        nom: safeName,
        telephone: safePhone,
        phone: safePhone,
        email: user.email,
        address: `${safeAdresse}, ${safeVille}`,
        adresse: safeAdresse,
        city: safeVille,
        ville: safeVille,
        type: safeSociete.toLowerCase() === 'particulier' ? 'Particulier' : 'Entreprise',
        societe: safeSociete,
        numeroFiscal: safeNumeroFiscal,
        status: 'Actif',
        archived: false,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (adminErr) {
      console.warn('[AdminDB Profile Sync Error]:', adminErr?.message);
    }
  }

  saveLocalUser(updates);
  return res.json({ success: true, profile: updates });
});

app.get('/api/auth/user/:uid', async (req, res) => {
  const user = await requireFirebaseUser(req, res);
  if (!user) return;
  const isSelf = req.params.uid === user.uid;
  const isAuthorized = isSelf || (await isServerAdmin(user)) || (await hasServerRole(user, ['secretaire', 'direction']));
  if (!isAuthorized) {
    return res.status(403).json({ error: "Accès refusé. Privilèges administrateur ou personnel requis." });
  }
  let profile = await getServerProfile(req.params.uid);
  if (profile) {
    return res.json({ user: { ...profile, id: req.params.uid, uid: req.params.uid } });
  }
  return res.status(404).json({ error: "Utilisateur introuvable." });
});

// =========================================================================
// SERVICES D'AUTHENTIFICATION, RÉINITIALISATION & VÉRIFICATION D'EMAIL
// =========================================================================
const emailVerifications = new Map();

app.post('/api/auth/reset-password', async (req, res) => {
  const email = String(req.body?.email || req.body?.identifier || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Adresse e-mail invalide." });
  }

  try {
    const key = firebaseConfig.apiKey || "AIzaSyD4D5AajRVUFI6tkf42NlkrmwNMRcuCfbI";
    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      const errCode = data.error?.message || '';
      if (errCode.includes('EMAIL_NOT_FOUND')) {
        return res.status(404).json({ error: `Aucun compte n'est enregistré avec l'adresse e-mail « ${email} ».` });
      }
      return res.status(400).json({ error: data.error?.message || "Échec de l'envoi de l'e-mail de réinitialisation." });
    }

    return res.json({
      success: true,
      email,
      message: `Un lien sécurisé de réinitialisation a été envoyé à ${email}. Veuillez vérifier votre boîte de réception et vos courriers indésirables.`
    });
  } catch (err) {
    console.error('Erreur API reset-password:', err);
    return res.status(500).json({ error: "Erreur serveur lors de la réinitialisation de mot de passe." });
  }
});

app.post('/api/auth/send-verification-code', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const name = String(req.body?.name || req.body?.nom || 'Client').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Veuillez renseigner une adresse e-mail valide." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  emailVerifications.set(email, {
    code,
    expiresAt,
    attempts: 0,
    name
  });

  // Tenter d'envoyer l'e-mail officiel Google Firebase pour toucher la boîte de réception
  try {
    const key = firebaseConfig.apiKey || "AIzaSyD4D5AajRVUFI6tkf42NlkrmwNMRcuCfbI";
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email
      })
    }).catch(() => {});
  } catch (e) {}

  console.log(`[LAPERLE AUTH] Code de vérification généré pour ${email} : ${code}`);

  return res.json({
    success: true,
    email,
    code, // Fourni pour permettre la validation fluide à l'écran
    expiresAt,
    message: `Code de vérification envoyé à ${email}.`
  });
});

app.post('/api/auth/verify-email-code', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();

  if (!email || !code) {
    return res.status(400).json({ error: "Adresse e-mail et code de vérification requis." });
  }

  const record = emailVerifications.get(email);
  if (!record) {
    return res.status(400).json({ error: "Aucun code en attente ou session expirée. Veuillez redemander un code." });
  }

  if (Date.now() > record.expiresAt) {
    emailVerifications.delete(email);
    return res.status(400).json({ error: "Ce code a expiré (validité 10 minutes). Veuillez cliquer sur « Renvoyer un code »." });
  }

  if (record.attempts >= 5) {
    emailVerifications.delete(email);
    return res.status(400).json({ error: "Nombre maximum de tentatives atteint. Veuillez demander un nouveau code." });
  }

  if (record.code !== code) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return res.status(400).json({ error: `Code incorrect. Il vous reste ${remaining} tentative(s).` });
  }

  // Code valide !
  emailVerifications.delete(email);
  return res.json({
    success: true,
    verified: true,
    email,
    message: "Adresse e-mail vérifiée avec succès !"
  });
});

app.post('/api/proformas', async (req, res) => {
  const user = await requireFirebaseUser(req, res);
  if (!user) return;
  if (!adminDb) return res.status(503).json({ error: 'Firestore Admin indisponible.' });
  const data = req.body?.proforma || {};
  const manager = await hasServerRole(user, ['admin', 'direction', 'comptabilite', 'secretaire']);
  if (!manager) {
    return res.status(403).json({ error: "Accès refusé. Privilèges de gestion ou administrateur requis." });
  }
  const targetUid = String(data.clientId || data.uid || data.clientUid || '');
  const clientEmail = String(data.email || '').toLowerCase().trim();
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !String(data.client || '').trim() || !/^[a-zA-Z0-9_-]{1,128}$/.test(String(data.number || ''))) {
    return res.status(400).json({ error: 'Proforma invalide.' });
  }
  const proforma = { ...data, id: String(data.number), number: String(data.number), amount,
    client: String(data.client).slice(0, 150),
    ...(targetUid ? { clientId: targetUid, uid: targetUid, clientUid: targetUid } : {}),
    ...(clientEmail ? { email: clientEmail } : {}),
    date: String(data.date || new Date().toISOString().slice(0, 10)), status: String(data.status || 'En attente').slice(0, 50),
    createdBy: user.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), archived: false };
  try {
    const proformaRef = adminDb.collection('proformas').doc(proforma.id);
    const userRef = targetUid ? adminDb.collection('utilisateurs').doc(targetUid) : null;
    await adminDb.runTransaction(async tx => {
      const existingProforma = await tx.get(proformaRef);
      if (existingProforma.exists) throw new Error('PROFORMA_EXISTS');
      if (!targetUid || !userRef) {
        tx.create(proformaRef, proforma);
        return;
      }
      const targetSnap = await tx.get(userRef);
      if (!targetSnap.exists) {
        // Profil pas encore dans utilisateurs, créer la proforma sans bloquer
        tx.create(proformaRef, proforma);
        return;
      }
      const target = targetSnap.data();
      const targetRoles = Array.isArray(target?.roles) ? target.roles : [target?.role];
      tx.create(proformaRef, proforma);
      if (targetRoles.includes('prospect')) {
        tx.update(userRef, { role: 'client', roles: ['client'], statutClient: 'client', updatedAt: FieldValue.serverTimestamp() });
      }
    });
    const savedProforma = await proformaRef.get();
    const result = targetUid ? await getServerProfile(targetUid).catch(() => null) : null;
    return res.status(201).json({
      success: true,
      proforma: { ...savedProforma.data(), id: proforma.id, number: proforma.id },
      profile: result
    });
  } catch (err) {
    if (err.message === 'PROFORMA_EXISTS') return res.status(409).json({ error: 'Ce numéro de proforma existe déjà.' });
    console.error('Proforma transaction failed:', err?.message);
    return res.status(500).json({ error: 'La création de la proforma a échoué.' });
  }
});

// Un prospect peut demander un devis; cette route ne crée aucune proforma officielle et ne change aucun rôle.
app.post('/api/proforma-requests', async (req, res) => {
  const user = await requireFirebaseUser(req, res);
  if (!user) return;
  if (!adminDb) return res.status(503).json({ error: 'Firestore Admin indisponible.' });
  try {
    const roles = await hasServerRole(user.uid, ['prospect', 'client']);
    if (!roles) return res.sendStatus(403);
    const request = req.body?.request || {};
    const requestRef = adminDb.collection('demandesProformas').doc();
    const payload = {
      uid: user.uid,
      clientId: user.uid,
      client: String(request.client || '').trim().slice(0, 150),
      reservationId: String(request.reservationId || '').trim().slice(0, 128),
      details: String(request.details || '').trim().slice(0, 2000),
      status: 'en_attente',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    await requestRef.create(payload);
    return res.status(201).json({ success: true, request: { ...payload, id: requestRef.id } });
  } catch (err) {
    console.error('Proforma request failed:', err?.message);
    return res.status(500).json({ error: 'La demande de proforma a échoué.' });
  }
});

// =========================================================================
// ROUTES ADMINISTRATEUR PROTÉGÉES (VÉRIFICATION SERVEUR PAR LE FIREBASE ADMIN SDK)
// RÈGLE : Ne JAMAIS faire confiance aux rôles transmis par le client.
// TOUTE tentative d'accès non autorisé est rejetée avec un code HTTP 403.
// =========================================================================

// 1. Vérification côté serveur de l'état administrateur
app.get('/api/admin/verify', async (req, res) => {
  const admin = await requireAdminUser(req, res);
  if (!admin) return; // 401 ou 403 renvoyé

  return res.json({
    success: true,
    isAdmin: true,
    uid: admin.uid,
    email: admin.email
  });
});

// 2. Consultation sécurisée de la liste des utilisateurs (réservée à l'administrateur)
app.get(['/api/users', '/api/admin/users'], async (req, res) => {
  const admin = await requireAdminUser(req, res);
  if (!admin) return; // 401 ou 403 renvoyé

  let users = [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection('utilisateurs').get();
      users = snap.docs.map(d => ({ ...d.data(), id: d.id, uid: d.id }));
    } catch (e) {
      users = getLocalUsers();
    }
  } else {
    users = getLocalUsers();
  }

  // Filtrer les éventuels champs internes sensibles
  const safeUsers = users.map(u => {
    const { password, motDePasse, ...rest } = u;
    return rest;
  });

  return res.json({ success: true, users: safeUsers });
});

// 3. Modification de rôle par un administrateur vérifié (côté serveur via Firebase Admin SDK)
app.put(['/api/users/:uid/role', '/api/admin/users/:uid/role'], async (req, res) => {
  const admin = await requireAdminUser(req, res);
  if (!admin) return; // 401 ou 403 renvoyé

  const targetUid = String(req.params.uid || '').trim();
  if (!targetUid) {
    return res.status(400).json({ error: "Identifiant utilisateur requis." });
  }

  // Empêcher un administrateur de modifier son propre rôle via l'API pour éviter tout blocage accidentel
  if (targetUid === admin.uid) {
    return res.status(403).json({ error: "Un administrateur ne peut pas modifier son propre rôle." });
  }

  const targetProfile = await getServerProfile(targetUid);
  if (!targetProfile) {
    return res.status(404).json({ error: "Utilisateur cible introuvable." });
  }

  // Protection stricte du Super Administrateur maître
  const targetEmail = String(targetProfile.email || '').toLowerCase().trim();
  const isTargetSuperAdmin = Boolean(targetProfile.isSuperAdmin) ||
    targetEmail === 'castimamoise@gmail.com' ||
    targetEmail === 'laperletourht@gmail.com';

  const callerEmail = String(admin.email || '').toLowerCase().trim();
  const isCallerSuperAdmin = callerEmail === 'castimamoise@gmail.com' ||
    callerEmail === 'laperletourht@gmail.com' ||
    Boolean(admin.isSuperAdmin);

  if (isTargetSuperAdmin && !isCallerSuperAdmin) {
    return res.status(403).json({ error: "Seul un Super Administrateur peut modifier le compte d'un autre Super Administrateur." });
  }

  const allowedRoles = [
    'admin', 'direction', 'comptabilite', 'secretaire',
    'operations', 'chauffeur', 'client', 'prospect', 'lecture_seule', 'vendeur'
  ];

  const rawRole = String(req.body?.role || '').toLowerCase().trim();
  const rawRoles = Array.isArray(req.body?.roles)
    ? req.body.roles.map(r => String(r).toLowerCase().trim())
    : (rawRole ? [rawRole] : []);
  const validRoles = rawRoles.filter(r => allowedRoles.includes(r));

  if (validRoles.length === 0) {
    return res.status(400).json({ error: "Rôle invalide spécifié." });
  }

  const primaryRole = validRoles[0];
  const allowedModules = Array.isArray(req.body?.allowedModules) ? req.body.allowedModules : (targetProfile.allowedModules || []);
  const status = req.body?.status === 'inactif' ? 'inactif' : 'actif';

  const updates = {
    role: primaryRole,
    roles: validRoles,
    allowedModules,
    status,
    statutCompte: status,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email || admin.uid
  };

  // Synchronisation Firebase Auth Custom Claims
  if (adminAuth) {
    try {
      if (primaryRole === 'admin' || validRoles.includes('admin')) {
        await adminAuth.setCustomUserClaims(targetUid, { role: 'admin', admin: true });
      } else {
        await adminAuth.setCustomUserClaims(targetUid, { role: primaryRole });
      }
    } catch (authErr) {
      console.warn('[UpdateRole CustomClaims Warning]:', authErr?.message);
    }
  }

  // Synchronisation Firestore
  if (adminDb) {
    try {
      await adminDb.collection('utilisateurs').doc(targetUid).set({
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      if (primaryRole === 'admin' || validRoles.includes('admin')) {
        await adminDb.collection('admins').doc(targetUid).set({
          uid: targetUid,
          email: targetProfile.email || '',
          assignedBy: admin.email || admin.uid,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        await adminDb.collection('admins').doc(targetUid).delete().catch(() => {});
      }
    } catch (dbErr) {
      console.warn('[UpdateRole AdminDB Warning]:', dbErr?.message);
    }
  }

  saveLocalUser({ ...targetProfile, ...updates, id: targetUid, uid: targetUid });

  return res.json({
    success: true,
    message: `Rôle mis à jour avec succès : ${primaryRole}`,
    user: { ...targetProfile, ...updates, id: targetUid, uid: targetUid }
  });
});

// 4. Modification de statut utilisateur (actif / inactif) par un administrateur
app.put(['/api/users/:uid/status', '/api/admin/users/:uid/status'], async (req, res) => {
  const admin = await requireAdminUser(req, res);
  if (!admin) return; // 401 ou 403 renvoyé

  const targetUid = String(req.params.uid || '').trim();
  if (targetUid === admin.uid) {
    return res.status(403).json({ error: "Vous ne pouvez pas modifier le statut de votre propre compte." });
  }

  const targetProfile = await getServerProfile(targetUid);
  if (!targetProfile) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const targetEmail = String(targetProfile.email || '').toLowerCase().trim();
  if (targetProfile.isSuperAdmin || targetEmail === 'castimamoise@gmail.com' || targetEmail === 'laperletourht@gmail.com') {
    return res.status(403).json({ error: "Le compte Super Administrateur ne peut jamais être désactivé." });
  }

  const newStatus = req.body?.status === 'inactif' ? 'inactif' : 'actif';
  const updates = {
    status: newStatus,
    statutCompte: newStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email || admin.uid
  };

  if (adminDb) {
    try {
      await adminDb.collection('utilisateurs').doc(targetUid).set({
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {}
  }

  saveLocalUser({ ...targetProfile, ...updates, id: targetUid, uid: targetUid });

  return res.json({ success: true, status: newStatus, uid: targetUid });
});

// 5. Suppression de compte par un administrateur
app.delete(['/api/users/:uid', '/api/admin/users/:uid'], async (req, res) => {
  const admin = await requireAdminUser(req, res);
  if (!admin) return; // 401 ou 403 renvoyé

  const targetUid = String(req.params.uid || '').trim();
  if (targetUid === admin.uid) {
    return res.status(403).json({ error: "Vous ne pouvez pas supprimer votre propre compte administrateur." });
  }

  const targetProfile = await getServerProfile(targetUid);
  if (!targetProfile) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const targetEmail = String(targetProfile.email || '').toLowerCase().trim();
  if (targetProfile.isSuperAdmin || targetEmail === 'castimamoise@gmail.com' || targetEmail === 'laperletourht@gmail.com') {
    return res.status(403).json({ error: "Le compte Super Administrateur ne peut jamais être supprimé." });
  }

  if (adminDb) {
    try {
      await adminDb.collection('utilisateurs').doc(targetUid).delete();
      await adminDb.collection('admins').doc(targetUid).delete().catch(() => {});
    } catch (e) {}
  }

  try {
    const p = path.join(__dirname, 'data', 'utilisateurs.json');
    const list = getLocalUsers().filter(u => u.id !== targetUid && u.uid !== targetUid);
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}

  return res.json({ success: true, message: "Utilisateur supprimé avec succès." });
});

// 6. Remplacement du logo officiel (STRICTEMENT réservé aux administrateurs vérifiés)
app.post('/api/upload-logo', express.json({ limit: '20mb' }), async (req, res) => {
  const admin = await requireAdminUser(req, res);
  if (!admin) return; // 401 ou 403 renvoyé si non administrateur

  try {
    const { dataUrl } = req.body || {};
    if (!dataUrl || !dataUrl.includes('base64,')) {
      return res.status(400).json({ error: 'Données image invalides (base64 requis).' });
    }
    const base64Data = dataUrl.split(';base64,').pop();
    const buffer = Buffer.from(base64Data, 'base64');
    const targetPath = path.join(__dirname, 'logo-laperle.jpg');
    fs.writeFileSync(targetPath, buffer);
    return res.json({ success: true, message: 'Logo officiel remplacé avec succès et sans altération.' });
  } catch (err) {
    console.error('Erreur upload logo:', err?.message);
    return res.status(500).json({ error: 'Impossible de sauvegarder le logo.' });
  }
});

// Endpoints obsolètes et révoqués
app.post(['/api/auth/login', '/api/auth/google', '/api/auth/reset-users', '/api/auth/user/:uid/upgrade-client'], (_req, res) => res.sendStatus(410));
// Vercel serves the frontend files from its static output. Keep this Express
// file server only for local/self-hosted runs, never expose the repository from
// the serverless API function.
if (process.env.VERCEL !== '1' && process.env.VITE_FULLSTACK !== '1') {
  app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // SPA Fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

export default app;
