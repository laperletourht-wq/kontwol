# Isolation des Rôles & Portail Client Sécurisé (Laperle Tour HT)

Mise en place d'un cloisonnement strict des accès par rôle (RBAC) pour garantir que les comptes clients ne puissent en aucun cas voir les finances globales de l'entreprise, la trésorerie générale, la gestion de la flotte ou les modules internes, tout en bénéficiant d'un espace client clair et personnalisé.

### Décisions de revue et choix critiques

> [!IMPORTANT]
> Les réponses aux questions de clarification ont défini les règles de cloisonnement suivantes :
> - **Tableau de bord client** : Remplacement des KPI de trésorerie et flotte de l'entreprise par les indicateurs personnels du client (ses réservations actives, ses devis en attente, ses factures à régler et ses courses terminées).
> - **Navigation latérale (Menu Client)** : Filtrage strict masquant tous les modules internes (Trésorerie, Flotte, Chauffeurs, Navette scolaire, Clients & Comptes, Planning général, Paramètres). Le menu client affiche uniquement : *Tableau de Bord*, *Mes Réservations*, *Mes Devis*, *Mes Factures* et *Support & Dispatch*.
> - **Espace Chauffeur** : Vue focalisée sur les missions assignées du jour, la fiche véhicule et la radio de bord.
> - **Direction / Super Admin** : Conservation de la vue complète (finance, trésorerie, régulation de flotte, gestion des utilisateurs et vitrine).

---

## 1. Vue d'ensemble & Cloisonnement des Données

### Ce que le système apporte
1. **Protection absolue des données financières** :
   - Les recettes totales encaissées, le solde net de trésorerie, les dépenses d'exploitation et la liste des autres clients sont réservés exclusivement aux administrateurs (`admin`), directeurs (`direction`) et comptables (`comptable`).
2. **Espace Client Dédié** :
   - Un client connecté (ex. `beto`) accède directement à son espace personnel avec un accueil chaleureux, des boutons d'action rapide (*Réserver une Course*, *Demander un Devis*), le suivi en temps réel de ses courses et l'historique de ses factures.
3. **Sécurité et Filtrage Automatique des Données** :
   - Les requêtes et affichages de réservations, devis et factures filtrent automatiquement les documents selon l'identifiant (`userId` / `clientId`) ou le nom du client connecté afin qu'aucun compte ne voie les courses d'un tiers.

---

## 2. Expérience Utilisateur & Design d'Interface

### Navigation Latérale (Sidebar) par Rôle
```
┌─────────────────────────────────────────────────────────┐
│ COMPTE CLIENT (Client / Particulier / Entreprise)        │
├─────────────────────────────────────────────────────────┤
│ • Tableau de Bord (Portail Client Personnel)           │
│ • Mes Réservations & Courses                            │
│ • Mes Devis / Proformas                                 │
│ • Mes Factures & Règlements                             │
│ • Support & Dispatch (Assistance directe)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMPTE CHAUFFEUR (Conducteur VIP / Navette)             │
├─────────────────────────────────────────────────────────┤
│ • Missions du Jour & Trajets Assignés                   │
│ • Fiche & État du Véhicule                              │
│ • Radio de Bord & Dispatch                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMPTE ADMIN / DIRECTION / COMPTABILITÉ                 │
├─────────────────────────────────────────────────────────┤
│ • Tableau de Bord Global (KPIs Entreprise & Trésorerie) │
│ • Planning & Dispatch Complet                           │
│ • Flotte Véhicules & Chauffeurs Staff                   │
│ • Navette Scolaire & Abonnements                        │
│ • Répertoire Clients & Comptes                         │
│ • Devis & Facturation Générale                          │
│ • Trésorerie & Dépenses d'Exploitation                 │
│ • Paramètres Société & Vitrine CMS                      │
└─────────────────────────────────────────────────────────┘
```

### Tableau de Bord Client (Nouvelle Vue Dédiée)
- **Bannière d'accueil client** : Salutation personnalisée avec statut client et accès en 1 clic pour commander un transport ou solliciter un devis proforma.
- **Grille de 4 cartes KPI Client** (chiffres réels et isolés) :
  1. *Mes Réservations en cours* (avec raccourci vers la liste)
  2. *Mes Devis à valider* (avec montant total devisé)
  3. *Mes Factures à régler* (avec alerte bienveillante et bouton de règlement)
  4. *Courses Effectuées* (historique et fidélité)
- **Section inférieure scindée en 2 blocs** :
  - *Gauche - Mes Prochaines Courses* : Affiche uniquement les trajets réservés par le client connecté (dates, lieux de prise en charge et de destination, chauffeur assigné si confirmé).
  - *Droite - Centre d'Assistance & Service Client* : Permet au client de poser une question directe à l'équipe de régulation, d'accéder au numéro d'urgence Laperle Tour et de consulter les consignes de prise en charge.

---

## 3. Architecture Technique & Flux de Données

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                      Session Utilisateur                        │
 │               (useAuth: user, profile, role)                    │
 └───────────────────────────────┬─────────────────────────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
     [role === 'client']                  [role === 'admin' | ...]
             │                                       │
 ┌───────────┴─────────────┐             ┌───────────┴─────────────┐
 │ Menu & Vues Restreints  │             │ Menu & Vues Complètes   │
 │ • ClientDashboardView   │             │ • AdminDashboardView    │
 │ • Filter: where(userId) │             │ • KPIs Trésorerie       │
 │ • Hidden: Trésorerie,   │             │ • Flotte & Staff        │
 │   Flotte, Staff, etc.   │             │ • Gestion Comptes       │
 └─────────────────────────┘             └─────────────────────────┘
```

### Composants et Fichiers Modifiés
1. **`src/components/layout/AppShell.tsx`** :
   - Conditionnement dynamique de `navGroups` selon `role`.
   - Si `role === 'client'`, génération exclusive des entrées *Tableau de Bord*, *Mes Réservations*, *Mes Devis*, *Mes Factures* et *Support*.
   - Protection de l'accès aux routes directes pour empêcher tout contournement par clic.
2. **`src/components/modules/DashboardView.tsx`** :
   - Intégration d'un sous-rendu conditionnel : si `role === 'client'`, affichage d'un tableau de bord 100% orienté client avec ses métriques privées.
   - Retrait immédiat de toute mention de solde d'entreprise, recettes globales, dépenses et liste des autres comptes pour les clients.
3. **`src/context/AppContext.tsx`** :
   - Vérification du filtrage strict des listes locales et des écouteurs Firestore : les états `reservations`, `proformas`, `factures` présentés à un client ne contiennent que ses propres enregistrements (`user.uid` ou `profile.nom`).
4. **`firestore.rules` & Règles de Sécurité** :
   - Déploiement et maintien des règles garantissant que seuls les administrateurs ont le droit de lister la collection `paiements` ou `finances`.

---

## 4. Vérification & Tests de Non-Régression
- Connexion avec un compte `client` :
  - Vérifier que la sidebar ne comporte aucun onglet financier ni flotte.
  - Vérifier que le tableau de bord affiche les 4 indicateurs client et aucune recette de l'entreprise.
- Connexion avec un compte `admin` (`laperletourht@gmail.com`) :
  - Vérifier que tous les modules opérationnels, financiers et de gestion de flotte restent pleinement fonctionnels.
- Validation de la compilation via `compile_applet`.
