# Cloisonnement & Confidentialité des Données par Rôle (Clients, Chauffeurs et Direction)

Mise en place d'un système robuste d'isolation et de restriction d'accès aux données : chaque client ou chauffeur n'accède qu'à ses propres réservations, devis proforma, factures, plannings et paiements, tandis que les rôles de gestion conservent une vue exhaustive.

### User Review & Critical Decisions

> [!IMPORTANT]
> Les choix de conception validés avec vous lors de la phase de clarification :
> - **Visibilité globale accordée** : `Direction`, `Administrateur` et `Comptabilité` conservent une visibilité intégrale sur l'ensemble des dossiers et des transactions financières de l'entreprise.
> - **Critères d'attribution multi-niveaux (1, 2 et 3 combinés)** : Pour garantir qu'aucun dossier ne soit égaré, l'association d'un dossier à un client ou chauffeur s'effectue par :
>   1. Identifiant unique (`uid` / `clientId`)
>   2. Adresse e-mail du compte connecté
>   3. Concordance du Nom complet et/ou du numéro de téléphone.

---

### 1. Vue d'ensemble & Objectif

- **Objectif métier** : Garantir la confidentialité stricte des données sensibles (montants facturés, trajets réservés, coordonnées, plannings de course). Aucun client ne doit pouvoir apercevoir les devis ou factures d'un autre client, et aucun chauffeur ne doit voir les courses ou plannings d'autres conducteurs.
- **Rôles concernés** :
  - **Client / Prospect** : Visualise exclusivement ses propres réservations, devis proforma reçus, factures à régler, paiements effectués, ainsi que ses abonnements scolaires ou corporatifs.
  - **Chauffeur** : Visualise exclusivement les missions, ramassages et plannings qui lui sont expressément assignés, ainsi que la fiche du véhicule qu'il conduit.
  - **Secrétariat & Opérations** : Visualisent l'opérationnel nécessaire à leur fonction (planning de courses, gestion des réservations et flotte).
  - **Direction, Administrateur, Comptabilité** : Accès global à 100% des documents administratifs, comptables et logistiques.

---

### 2. Expérience Utilisateur & Comportement de l'Interface

- **Pour le Client connecté** :
  - Le tableau de bord affiche son solde personnel, ses réservations en cours et ses dernières factures.
  - Les modules *Réservations*, *Devis*, *Factures* et *Paiements* ne listent que ses dossiers.
  - Lors d'une nouvelle réservation ou demande de devis, le système pré-remplit et verrouille automatiquement son nom, son e-mail, son téléphone et son `clientId` pour garantir l'attribution instantanée.
  - Message vide informatif personnalisé : *"Vous n'avez aucune facture en attente"* avec action rapide pour réserver ou demander un devis.
- **Pour le Chauffeur connecté** :
  - Le module *Plannings* n'affiche que sa feuille de route (courses programmées, départs, passagers et horaires qui lui sont confiés).
  - Les modules financiers et les factures lui sont inaccessibles conformément aux permissions de son rôle.
- **Pour la Direction & Comptabilité** :
  - Visibilité exhaustive avec sélecteur de filtre client/chauffeur pour inspecter facilement un dossier particulier ou avoir la vue d'ensemble de l'entreprise.

---

### 3. Décisions Clés & Architecture Technique

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Authentification (AuthContext)                       │
│     Profil Utilisateur (uid, role, nom, email, telephone, clientId)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Moteur de Filtrage Centralisé                     │
│                           (AppContext.tsx)                             │
├────────────────────────────────────────────────────────────────────────┤
│  Est-ce un profil Superviseur ? (Admin / Direction / Comptabilité)     │
│  ├─► OUI : Retourne la liste complète sans restriction                 │
│  └─► NON : Filtre par correspondance multi-critères :                  │
│       • item.clientId === user.uid || item.clientId === profile.id     │
│       • item.clientEmail === user.email || item.email === user.email   │
│       • item.client.toLowerCase() === profile.nom.toLowerCase()       │
│       • item.telephone === profile.telephone                           │
│       • Pour Chauffeur : item.chauffeur === profile.nom                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│ Réservations │            │  Proformas   │            │   Factures   │
│  filtrées    │            │   filtrés    │            │   filtrées   │
└──────────────┘            └──────────────┘            └──────────────┘
```

#### A. Centralisation dans `AppContext.tsx`
- Définition d'une fonction utilitaire réactive de vérification de propriété : `isItemOwnedByUser(item, user, profile, type)`.
- Création de sélecteurs mémorisés (`scopedReservations`, `scopedProformas`, `scopedFactures`, `scopedPlannings`, `scopedPaiements`, `scopedAbonnements`).
- Les vues consommatrices accèdent automatiquement aux collections cloisonnées sans altérer les boutons d'actions ou les calculs de totaux.

#### B. Marquage Automatique à la Création
- Lors de l'ajout d'une réservation, proforma ou facture, injection automatique de :
  - `clientId`: `user.uid`
  - `client`: `profile.nom` ou raison sociale
  - `email`: `user.email`
  - `telephone`: `profile.telephone`

#### C. Règles de Sécurité Firestore (`firestore.rules`)
- Consolidation des règles d'accès pour s'assurer que les rôles `direction`, `admin` et `comptabilite` bénéficient des permissions complètes de lecture sur les collections, tandis que les requêtes directes des clients et chauffeurs sont strictement cantonnées à leurs propres identifiants.

---

### 4. Plan de Déploiement & Étapes d'Exécution

1. **Étape 1 : Moteur de filtrage et sélecteurs de données dans `src/context/AppContext.tsx`**
   - Implémenter la logique multi-critères (UID + Email + Nom/Téléphone).
   - Exposer les listes cloisonnées selon le rôle de l'utilisateur connecté.
   - Injecter les métadonnées de l'utilisateur connecté lors des créations de devis / réservations.

2. **Étape 2 : Harmonisation des vues de modules**
   - Vérifier que `ReservationsView`, `ProformasView`, `FacturesView`, `PlanningsView` et `PaiementsView` utilisent la source de données appropriée.
   - Adapter les totaux et résumés financiers pour qu'un client ne voie que ses totaux personnels.

3. **Étape 3 : Mise à niveau des règles de sécurité Firestore (`firestore.rules`)**
   - Aligner les prédicats de lecture Firestore pour refléter les rôles `direction` et `comptabilite` sur les collections partagées.

4. **Étape 4 : Validation & Compilation**
   - Exécuter `lint_applet` et `compile_applet` pour garantir l'intégrité du code.
