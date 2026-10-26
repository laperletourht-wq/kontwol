# Refonte Moderne des Tableaux & Listes Laperle Tour HT

Ce plan définit la modernisation visuelle et ergonomique de toutes les pages contenant des tableaux et des listes dans le centre de contrôle, en adoptant un design contemporain, aéré et fluide inspiré de votre référence visuelle, sans barre de recherche locale et avec un menu déroulant d'actions à trois points.

## User Review & Critical Decisions

> [!IMPORTANT]
> Décisions confirmées directement lors de la clarification :
> 1. **Maintien du basculement** : Conservation du sélecteur de mode d'affichage (`📋 Vue Cartes` et `📊 Vue Tableau`) pour offrir flexibilité et confort de lecture selon les préférences.
> 2. **Style visuel des tableaux** : Lignes blanches aériennes avec léger espacement, bordures douces (`border-slate-100`), coins subtilement arrondis et survol fluide (`hover:bg-slate-50/80`).
> 3. **Actions par ligne** : Remplacement des boutons horizontaux encombrants par un menu contextuel discret à trois points (`⋮`), s'ouvrant en popover avec fermeture automatique au clic extérieur.
> 4. **Suppression des barres de recherche locales** : Retrait des champs de saisie de recherche dans les barres d'outils de chaque liste (`sans barre de recherche`), recentrant l'en-tête sur les filtres par statut et le sélecteur de vue.

---

## 1. Overview & Core Concept

- **Objectif** : Unifier le design de l'ensemble des écrans de données du centre de contrôle avec un composant de tableau moderne réutilisable ou un modèle de balisage standardisé (`ModernTable`).
- **Modules concernés** :
  - `ReservationsView` (Réservations de trajets et circuits)
  - `ProformasView` (Devis proformas officiels)
  - `FacturesView` (Factures, règlements et preuves de paiement)
  - `ClientsView` (Répertoire clients & entreprises)
  - `ElevesView` (Ramassage scolaire)
  - `AbonnementsView` (Abonnements transport scolaire et corporatif)
  - `VehiculesView` (Parc et flotte de véhicules)
  - `ChauffeursView` (Chauffeurs assermentés)
  - `PlanningsView` (Planning des courses et missions)
  - `PaiementsView` (Historique des encaissements et trésorerie)
  - `UtilisateursView` (Gestion des comptes utilisateurs et rôles)

---

## 2. User Experience & Visual Design

### Agencement de la barre d'outils (Toolbar)
- Suppression de l'input de recherche texte local (`sans barre de recherche`).
- Maintien du menu déroulant de filtre par statut (ex: *Tous les statuts*, *En attente*, *Confirmée*, *Terminée*...).
- Préservation des boutons de bascule de vue segmentés : `📋 Vue Détaillée` | `📊 Tableau Allongé`.
- Bouton d'action principal bien détaché (ex: `+ Nouvelle Réservation`, `+ Nouveau Devis`).

### Structure du Tableau Moderne
- **Conteneur** : Surface blanche surélevée avec bordure douce (`border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden bg-white`).
- **En-tête de colonnes (`thead`)** :
  - Fond grisé très subtil (`#f8fafc`).
  - Typographie fine, lisible et aérée (`font-semibold text-xs text-slate-500 uppercase tracking-wider`).
  - Alignement rigoureux : texte à gauche, chiffres et montants avec typographie tabulaire (`tabular-nums`).
- **Lignes de données (`tbody tr`)** :
  - Hauteur de ligne confortable (`py-3.5 px-4`).
  - Transition de survol ultra-douce (`transition-all duration-150 hover:bg-sky-50/40`).
  - Séparateur horizontal discret (`border-b border-slate-100`).
  - Badges de référence cliquables (`DocRefBadge`) et statuts avec pastilles colorées harmonisées.
- **Menu d'actions à 3 points (`⋮`)** :
  - Bouton circulaire discret à droite de chaque ligne.
  - Déclenche un menu flottant élégant (`shadow-xl border border-slate-200 rounded-xl bg-white p-1 z-50`).
  - Regroupe les actions contextuelles : Modifier, Supprimer, WhatsApp, Générer Devis/Facture, Afficher justificatif.

---

## 3. Key Product Decisions & Trade-Offs

- **Décision 1 : Création d'un composant dropdown d'actions réutilisable (`RowActionMenu.tsx`)**
  - *Approche* : Isoler le menu à 3 points avec gestion du clic extérieur (`clickOutside`) et positionnement flottant.
  - *Raison* : Évite la duplication de code d'état d'ouverture de menu dans chaque vue et garantit un comportement fluide et robuste.
  
- **Décision 2 : Harmonisation des styles dans `styles.css`**
  - *Approche* : Définir les classes CSS globales `.modern-table-card`, `.modern-table`, `.modern-th`, `.modern-tr` et `.action-dropdown-menu`.
  - *Raison* : Permet une application instantanée et homogène à travers l'ensemble des modules sans perturber la logique métier.

---

## 4. Technical Architecture & Data Strategy

### Schéma d'Architecture de la Refonte

```
┌────────────────────────────────────────────────────────┐
│                   Vue Liste (Ex: ReservationsView)    │
└───────────────────────────┬────────────────────────────┘
                            │
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│     Barre d'outils épurée     │ │     Sélecteur de mode         │
│  (Filtre Statut + Action CTA) │ │  [📋 Cartes]  [📊 Tableau]    │
│  (Sans barre de recherche)    │ │                               │
└───────────────────────────────┘ └───────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Conteneur ModernTable                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ thead : Colonnes en uppercase tracking-wider     │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ tr : Ligne blanche aérienne avec survol doux     │  │
│  │      - Identifiant & Réf. Document               │  │
│  │      - Détails (Client, Trajet, Véhicule...)     │  │
│  │      - Tarifs (DualPrice tabular-nums)           │  │
│  │      - Statut                                    │  │
│  │      - Action : [ ⋮ RowActionMenu ] ─────────┐   │  │
│  └──────────────────────────────────────────────┼───┘  │
└─────────────────────────────────────────────────┼──────┘
                                                  ▼
                                 ┌────────────────────────────────┐
                                 │       Menu Flottant (⋮)        │
                                 │  - ✏️ Modifier                 │
                                 │  - 📋 Générer Devis / Facture  │
                                 │  - 💬 Contacter WhatsApp       │
                                 │  - 🗑️ Supprimer                │
                                 └────────────────────────────────┘
```

### Plan de Déploiement des Modifications
1. **Composant `src/components/common/RowActionMenu.tsx`** :
   - Création du bouton circulaire `⋮` avec icône SVG.
   - Menu flottant en portail / dropdown absolu avec auto-fermeture.
2. **Styles globaux dans `styles.css`** :
   - Ajout des règles pour les tableaux modernes sans barre de recherche (lignes aériennes, bordures douces, ombres subtiles).
3. **Mise à jour des vues** :
   - `ReservationsView.tsx` : retrait de l'input de recherche locale, application du nouveau tableau et du menu à trois points.
   - `ProformasView.tsx`, `FacturesView.tsx`, `ClientsView.tsx`, `VehiculesView.tsx`, etc. : alignement sur la même structure visuelle.
4. **Vérification** :
   - Compilation avec `compile_applet` et vérification responsive.
