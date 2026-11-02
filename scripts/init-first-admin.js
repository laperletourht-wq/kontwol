#!/usr/bin/env node
/**
 * Procédure d'initialisation sécurisée du premier administrateur côté serveur.
 * Utilise exclusivement le Firebase Admin SDK avec privilèges élevés.
 * Aucun mot de passe n'est codé en dur.
 *
 * Utilisation :
 *   node scripts/init-first-admin.js <email_ou_uid> [--force]
 * ou
 *   npm run init:admin -- <email_ou_uid> [--force]
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), '..');

// Lecture de la configuration Firebase du projet
let firebaseConfig = {
  projectId: 'laperletourht-28ad8',
  firestoreDatabaseId: 'ai-studio-centredecontrole-27e8ff4b-e91d-4923-8cc6-6265fb193fe7'
};

try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (raw.projectId) firebaseConfig.projectId = raw.projectId;
    if (raw.firestoreDatabaseId) firebaseConfig.firestoreDatabaseId = raw.firestoreDatabaseId;
  }
} catch (e) {
  // Conserver la configuration par défaut
}

// Initialisation de Firebase Admin SDK
const existingApps = getAdminApps();
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_JSON contient un JSON invalide.');
  }
} else {
  const saCandidates = ['service-account.json', 'firebase-service-account.json'];
  for (const filename of saCandidates) {
    const p = path.join(__dirname, filename);
    if (fs.existsSync(p)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
        console.log(`🔑 Clé de compte de service chargée depuis ${filename}`);
        break;
      } catch {}
    }
  }
}

const adminApp = existingApps.length
  ? existingApps[0]
  : initAdminApp({
      projectId: serviceAccount?.project_id || firebaseConfig.projectId,
      ...(serviceAccount ? { credential: cert(serviceAccount) } : {})
    });

const adminAuth = getAdminAuth(adminApp);
let adminDb = null;
try {
  adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  try {
    adminDb = getAdminFirestore(adminApp);
  } catch {
    adminDb = null;
  }
}

// Utilitaires de secours local
function getLocalUsers() {
  try {
    const p = path.join(__dirname, 'data', 'utilisateurs.json');
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      return content ? JSON.parse(content) : [];
    }
  } catch {}
  return [];
}

function saveLocalUser(profile) {
  try {
    const p = path.join(__dirname, 'data', 'utilisateurs.json');
    const list = getLocalUsers();
    const idx = list.findIndex(
      (u) =>
        u.id === profile.id ||
        u.uid === profile.uid ||
        (u.email && profile.email && u.email.toLowerCase() === profile.email.toLowerCase())
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...profile };
    } else {
      list.push(profile);
    }
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('[saveLocalUser warning]:', e?.message);
  }
}

async function run() {
  const rawArgs = process.argv.slice(2);
  const isForce = rawArgs.includes('--force');
  const target = rawArgs.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();

  console.log('\n======================================================');
  console.log(' CENTRE DE CONTRÔLE LAPERLE - INITIALISATION ADMIN');
  console.log('======================================================\n');

  if (!target) {
    console.error('❌ ERREUR : Aucun identifiant fourni.');
    console.log('\nUsage :');
    console.log('  npm run init:admin -- <adresse_email_ou_uid> [--force]');
    console.log('\nExemples :');
    console.log('  npm run init:admin -- proprietaire@laperletourht.com');
    console.log('  npm run init:admin -- laperletourht@gmail.com\n');
    process.exit(1);
  }

  // 1. Recherche du compte dans Firebase Authentication
  console.log(`🔍 Recherche de l'utilisateur "${target}" dans Firebase Auth...`);
  let userRecord = null;
  try {
    if (target.includes('@')) {
      userRecord = await adminAuth.getUserByEmail(target);
    } else {
      userRecord = await adminAuth.getUser(target);
    }
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`\n❌ Compte introuvable dans Firebase Auth pour "${target}".`);
      console.error('👉 Veuillez d’abord créer le compte sur l’application (via inscription ou connexion Google).');
      console.error('   Une fois le compte créé dans Firebase Auth, relancez cette commande.\n');
      process.exit(1);
    }
    
    const localMatch = getLocalUsers().find((u) => (u.email && u.email.toLowerCase() === target) || u.id === target || u.uid === target);
    if (localMatch) {
      console.log(`ℹ️  Utilisateur local détecté (${localMatch.email || localMatch.id}) avec UID ${localMatch.uid || localMatch.id}`);
      userRecord = {
        uid: localMatch.uid || localMatch.id,
        email: localMatch.email || target,
        displayName: localMatch.name || localMatch.nom || target.split('@')[0]
      };
    } else {
      console.error(`\n❌ Erreur Firebase Auth (${err.code || 'inconnue'}) :`, err.message);
      if (!serviceAccount) {
        console.error('\n💡 Conseils de configuration :');
        console.error('   1. Configurez FIREBASE_SERVICE_ACCOUNT_JSON dans les variables d’environnement du serveur');
        console.error('      (ou déposez le fichier service-account.json à la racine).');
        console.error('   2. Ou connectez-vous d’abord sur le site, puis utilisez l’initialisation unitaire sécurisée.');
      }
      process.exit(1);
    }
  }

  console.log(`✅ Compte Firebase Auth identifié :`);
  console.log(`   - UID   : ${userRecord.uid}`);
  console.log(`   - Email : ${userRecord.email}`);
  console.log(`   - Nom   : ${userRecord.displayName || '(Non défini)'}`);

  // 2. Vérification de l'existence préalable d'administrateurs (contrôle de premier démarrage)
  let existingAdminCount = 0;
  if (adminDb) {
    try {
      const snap = await adminDb.collection('utilisateurs').where('role', '==', 'admin').get();
      existingAdminCount = snap.size;
    } catch (e) {
      console.warn('⚠️  Avertissement lecture Firestore:', e?.message);
    }
  }
  const localList = getLocalUsers();
  const localAdminCount = localList.filter((u) => u.role === 'admin' || (Array.isArray(u.roles) && u.roles.includes('admin'))).length;
  const totalAdminsFound = Math.max(existingAdminCount, localAdminCount);

  if (totalAdminsFound > 0 && !isForce) {
    console.log(`\n⚠️  Information : ${totalAdminsFound} administrateur(s) existe(nt) déjà dans le système.`);
    console.log('   Pour confirmer la promotion de cet utilisateur en tant qu’administrateur, utilisez :');
    console.log(`   npm run init:admin -- ${target} --force\n`);
    process.exit(0);
  }

  // 3. Attribution du rôle Administrateur via Firebase Admin SDK
  console.log('\n🔒 Attribution des privilèges Administrateur via Firebase Admin SDK...');

  // a) Custom User Claims (Sécurisation cryptographique dans le jeton d'authentification)
  try {
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      isSuperAdmin: true,
      admin: true
    });
    console.log('   ✅ Custom User Claims configurés (role: admin, isSuperAdmin: true)');
  } catch (err) {
    console.warn('   ⚠️  Impossible de définir les Custom Claims:', err?.message);
  }

  // b) Enregistrement du profil dans Firestore (utilisateurs/{uid})
  const safeName = userRecord.displayName || userRecord.email?.split('@')[0] || 'Administrateur';
  const adminProfile = {
    id: userRecord.uid,
    uid: userRecord.uid,
    email: userRecord.email,
    name: safeName,
    nom: safeName,
    role: 'admin',
    roles: ['admin'],
    isSuperAdmin: true,
    statutClient: 'admin',
    status: 'actif',
    statutCompte: 'actif',
    updatedAt: new Date().toISOString()
  };

  if (adminDb) {
    try {
      const docRef = adminDb.collection('utilisateurs').doc(userRecord.uid);
      const snap = await docRef.get();
      await docRef.set(
        {
          ...adminProfile,
          updatedAt: FieldValue.serverTimestamp(),
          ...(!snap.exists ? { createdAt: FieldValue.serverTimestamp() } : {})
        },
        { merge: true }
      );
      console.log('   ✅ Document Firestore `utilisateurs/' + userRecord.uid + '` mis à jour avec rôle admin');
    } catch (dbErr) {
      console.warn('   ⚠️  Impossible d’écrire dans Firestore Admin:', dbErr?.message);
    }
  }

  // c) Enregistrement dans le fallback local
  saveLocalUser(adminProfile);
  console.log('   ✅ Profil synchronisé dans le stockage local data/utilisateurs.json');

  console.log('\n🎉 SUCCÈS : Le premier administrateur est configuré !');
  console.log(`   - Compte : ${userRecord.email}`);
  console.log(`   - Rôle   : admin (Super Administrateur)`);
  console.log('   - Accès  : Total à toutes les zones de gestion');
  console.log('   - Note   : Lors de sa prochaine connexion, l’utilisateur aura accès direct au tableau de bord administrateur.\n');
}

run().catch((err) => {
  console.error('\n❌ Échec de la procédure :', err);
  process.exit(1);
});
