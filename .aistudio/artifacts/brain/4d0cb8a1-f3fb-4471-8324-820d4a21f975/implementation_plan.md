# Refonte Visuelle Haute-Fidélité des Pages Devis & Factures (Laperle Tour HT)

Plan architectural et ergonomique pour reproduire fidèlement l'interface des devis proformas et factures selon les maquettes fournies, avec volet récapitulatif latéral, fiche officielle au format A4 en Gourdes HTG, et conversion en 1 clic.

## Décisions Clés & Choix Confirmés

> [!IMPORTANT]
> Décisions validées avec l'utilisateur lors de la phase de cadrage :
> - **Navigation & Accès** : La vue détaillée haute-fidélité s'ouvre au clic sur un devis ou une facture dans la liste, avec fil d'Ariane (`Accueil > Mes devis > Devis n° DEV-2025-0018`) et possibilité de revenir à la liste en un clic.
> - **Devise Unique** : Affichage strictement en **Gourdes (HTG)** comme sur les maquettes (`45 000,00 HTG`), avec calcul automatique des sous-totaux, TVA et total TTC.
> - **Action "Accepter le devis"** : Convertit directement le devis en facture officielle enregistrée en base de données, lie la réservation et ouvre immédiatement la facture correspondante prête pour le règlement.

---

## 1. Vue d'Ensemble & Expérience Utilisateur

### Parcours Devis (Proforma)
1. L'utilisateur consulte ses devis dans la table générale.
2. En cliquant sur une ligne ou sur "Consulter", l'interface affiche l'écran scindé fidèle à la maquette :
   - **En-tête de page** : Titre *Devis*, fil d'Ariane cliquable, et barre d'actions rapide (`Télécharger (PDF)`, `Imprimer`, `Partager`, bouton vert `Accepter le devis`, bouton rouge `Refuser le devis`).
   - **Panneau Gauche (~35% de largeur)** :
     - Carte *Informations du devis* : N° de devis, date d'émission, date de validité, statut (badge jaune *En attente* ou vert *Accepté*), montant total mis en exergue en grand format bleu.
     - Carte *Demande associée* : N° de demande (`DEM-2025-0067`), trajet avec icône localisation, date et heure avec icône calendrier, véhicule demandé (`Toyota Hiace`), nombre de passagers (`10`).
   - **Panneau Droit (~65% de largeur - Fiche Officielle Blanche)** :
     - En-tête officiel avec logo Laperle Tour HT, slogan, coordonnées complètes (adresse, téléphone, email, site web).
     - Badge cartouche sombre `DEVIS`, N° officiel, dates d'émission et de validité.
     - Blocs bleu ciel d'information : *Devis pour* (Client, téléphone, email) et *Trajet* (Origine → Destination, date, véhicule, passagers).
     - Tableau des prestations avec colonnes Description, Quantité, Prix unitaire (HTG), Montant (HTG).
     - Lignes Sous-total, TVA (0%), et barre bleue d'accent *Total du devis*.
     - Bloc informatif *Notes* et vagues décoratives bleue et jaune en bas de document.

### Parcours Facture
1. Au clic sur une facture (ou suite à l'acceptation d'un devis), la vue détaillée facture reprend la même composition :
   - **En-tête de page** : Titre *Facture*, fil d'Ariane (`Accueil > Mes factures > Facture n° FAC-2025-0032`), actions (`Télécharger (PDF)`, `Imprimer`, `Partager`).
   - **Panneau Gauche** : Informations de la facture (N°, date d'émission, échéance, statut vert *Payée* ou orange *En attente*, mode de paiement) et *Réservation associée*.
   - **Panneau Droit** : Facture officielle avec tampon filigrané vert `✓ PAYÉE` (ou bouton de règlement avec preuve si impayée), total à payer en HTG et vagues Laperle.

---

## 2. Architecture Technique & Composants

```
┌────────────────────────────────────────────────────────────────────────┐
│ AppShell / Navigation (Module 'proformas' ou 'factures')               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
      ┌───────────────────────┐         ┌───────────────────────┐
      │ ProformasView.tsx     │         │ FacturesView.tsx      │
      │ Mode: 'list' | 'detail│         │ Mode: 'list' | 'detail│
      └───────────┬───────────┘         └───────────┬───────────┘
                  │                                 │
                  └────────────────┬────────────────┘
                                   ▼
          ┌──────────────────────────────────────────────────┐
          │ DocumentDetailView (Composant dédié réutilisable)│
          │  ├─ Breadcrumb & Actions Bar Top                 │
          │  ├─ Left Column: Summary & Linked Demand Cards   │
          │  └─ Right Column: Official A4 Sheet Document     │
          │       ├─ Brand Header & Blue Cartouche           │
          │       ├─ Customer & Journey Cards (Light Blue)   │
          │       ├─ Items Table (HTG tabular-nums)          │
          │       ├─ Total Highlight Bar & Paid Stamp        │
          │       └─ Brand Waves SVG Footer                  │
          └────────────────────────┬─────────────────────────┘
                                   │
                                   ▼
          ┌──────────────────────────────────────────────────┐
          │ Firestore Integration & Lifecycle Transitions    │
          │  - convertProformaToFacture (en 1 clic)          │
          │  - downloadPdf / window.print() natif sans bug   │
          │  - Partage par lien / WhatsApp pré-rempli        │
          └──────────────────────────────────────────────────┘
```

---

## 3. Spécifications Détaillées des Éléments

### Typographie & Couleurs
- **Couleur Primaire Document** : Bleu marine `#082b70` pour les cartouches, en-têtes et textes d'accent.
- **Bleu Marque Laperle** : `#0066f5` pour les montants forts et boutons actifs.
- **Vert Validation** : `#16a34a` (badge Payée, bouton Accepter le devis).
- **Rouge Alerte** : `#dc2626` (bouton Refuser le devis).
- **Surfaces** : Fonds bleu ciel doux `#f0f7ff` pour les cartouches clients/trajets, fond blanc immaculé `#ffffff` pour la feuille officielle avec ombre douce.
- **Typographie Financière** : `font-variant-numeric: tabular-nums` pour l'alignement strict des montants en Gourdes (`45 000,00 HTG`).

### Actions Interactives Fonctionnelles
- **Télécharger (PDF)** : Déclenche l'export / impression optimisée via la feuille CSS d'impression dédiée `@media print` qui n'imprime que la fiche document sans les barres de navigation.
- **Imprimer** : Ouvre directement la boîte de dialogue d'impression système.
- **Partager** : Copie l'URL du devis/facture dans le presse-papier avec toast de confirmation, et propose l'envoi WhatsApp en 1 clic.
- **Accepter le devis** :
  1. Met à jour le statut du devis en `'Acceptée'` et `'Convertie en facture'` dans Firestore.
  2. Crée immédiatement la facture correspondante (numérotée `FAC-2025-XXXX`) liée à la réservation.
  3. Bascule l'affichage directement sur la facture nouvellement générée avec toast de succès.
- **Refuser le devis** : Met à jour le statut en `'Refusée'` avec notification commerciale.

---

## 4. Plan de Déploiement par Étapes (après approbation)

1. **Création du composant de vue détaillée (`DocumentDetailView.tsx`)** :
   - Mise en page bi-colonne exacte selon les deux captures d'écran.
   - En-tête avec fil d'Ariane et boutons d'action.
   - Volet gauche avec cartes d'information et métadonnées de réservation.
   - Fiche document A4 droite avec logo, cartouche `DEVIS` / `FACTURE`, tableaux de prix en HTG, tampon payé et vagues graphiques.
2. **Intégration dans `ProformasView.tsx` et `FacturesView.tsx`** :
   - Gestion de l'état `selectedDocument` (ou URL param) : passage fluide entre la liste tabulaire et la vue détaillée.
   - Déclenchement au clic sur n'importe quel devis ou facture.
3. **Branchement des Actions & Handlers Réels** :
   - Acceptation / Refus de devis avec persistance Firestore.
   - Actions PDF, Impression et Partage.
4. **Validation finale** :
   - `npx tsc --noEmit` & `compile_applet`.
   - `lint_applet` & redémarrage du serveur de développement.
