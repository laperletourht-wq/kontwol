# Plan de Résolution : Erreurs de Permissions Firestore (Missing or insufficient permissions)

Ce plan traite la résolution définitive des erreurs affichées dans la console lors de la connexion d'un compte client :
- `Firestore sync error on reservations: Missing or insufficient permissions.`
- `Firestore sync error on proformas: Missing or insufficient permissions.`
- `Firestore sync error on notifications: Missing or insufficient permissions.`
- `Firestore sync error on factures: Missing or insufficient permissions.`

---

## 1. Cause Racine Identifiée

1. **Règle fondamentale de Firestore : « Les règles de sécurité ne sont pas des filtres »** :
   - Lorsqu'un utilisateur client se connecte, `AppContext.tsx` exécutait `onSnapshot(collection(db, collectionName))` sur les collections globales `reservations`, `proformas`, `factures` et `notifications` sans clause de filtrage `where(...)`.
   - Firestore évalue si l'utilisateur a le droit de lire **tous les documents** de la collection. Or, les règles de sécurité interdisent légitimement à un client de consulter les dossiers, factures et devis d'autres clients.
   - En conséquence, Firestore rejette immédiatement la requête globale avec l'erreur `Missing or insufficient permissions`.

2. **Écoute inadaptée au rôle connecté** :
   - L'administrateur et le personnel autorisé (`isStaff`) ont le droit d'écouter la collection complète.
   - Le client doit écouter une requête ciblée sur ses propres dossiers : `query(collection(db, 'reservations'), where('clientId', '==', user.uid))`.

---

## 2. Modifications Proposées

### A. Adaptation des Souscriptions dans `src/context/AppContext.tsx`
- **Distinction claire selon le rôle** :
  - **Pour le personnel (`isStaff: admin, direction, comptabilite, secretaire, operations`)** :
    Écoute globale autorisée de `reservations`, `proformas`, `factures`, `notifications`.
  - **Pour les clients (`role === 'client' | 'prospect'`)** :
    Écoute ciblée par identifiant client :
    - `query(collection(db, 'reservations'), where('clientId', '==', user.uid))`
    - `query(collection(db, 'proformas'), where('clientId', '==', user.uid))`
    - `query(collection(db, 'factures'), where('clientId', '==', user.uid))`
    - `query(collection(db, 'notifications'), where('targetUid', '==', user.uid))`
  - **Pour les chauffeurs (`role === 'chauffeur'`)** :
    Écoute ciblée sur les missions et véhicules assignés.
- **Gestion des erreurs discrète et résiliente** :
  - En cas d'absence de données distantes ou d'initialisation, basculer proprement sur les données locales sans polluer la console avec des avertissements bloquants.

### B. Harmonisation des Règles dans `firestore.rules`
- **Règles de listage optimisées pour les requêtes indexées** :
  - Dans `match /reservations/{reservationId}`, s'assurer que la condition de `list` autorise explicitement `resource.data.clientId == request.auth.uid`.
  - Dans `match /proformas/{proformaId}`, autoriser explicitement `resource.data.clientId == request.auth.uid`.
  - Dans `match /factures/{factureId}`, autoriser explicitement `resource.data.clientId == request.auth.uid`.
  - Dans `match /notifications/{notificationId}`, autoriser explicitement `resource.data.targetUid == request.auth.uid`.
- **Déploiement immédiat** via `deploy_firebase` pour que le serveur Firebase distant applique ces règles sans délai.

---

## 3. Plan de Vérification

1. **Test avec compte client** :
   - Se connecter avec un compte client : vérifier dans la console que les 4 erreurs `Missing or insufficient permissions` ne se produisent plus.
   - Vérifier que le client voit correctement ses propres réservations, devis proforma, factures et notifications.
2. **Test avec compte personnel / administrateur** :
   - Vérifier que l'administration conserve la vue globale sur toutes les réservations, factures et opérations.
3. **Validation technique** :
   - Déploiement des règles via `deploy_firebase`.
   - Exécution de `lint_applet` et `compile_applet` avec 0 erreur.
