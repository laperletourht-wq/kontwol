# Isolation Stricte des Tableaux de Bord, Traçabilité Documentaire & Justificatifs de Paiement

Système complet de cloisonnement étanche des tableaux de bord par rôle (Client, Chauffeur, Secrétariat, Direction), intégrant des numéros de référence cliquables avec prévisualisation instantanée, le routage asymétrique des notifications (les clients ne reçoivent pas leurs propres demandes), l'enregistrement des justificatifs de paiement multi-modes (MonCash, Virement, Chèque, Cash) et la double conversion monétaire permanente USD/HTG.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Règle absolue réaffirmée par l'utilisateur : "Chaque personne ne voit STRICTEMENT que son propre tableau de bord"**
> - **Espace Client** : Un client connecté ne voit **que son espace personnel**. Aucun chiffre d'affaires, aucune trésorerie globale, aucune réservation tierce, aucune fiche chauffeur ni véhicule de la flotte générale n'est accessible. La barre latérale et la navigation masquent hermétiquement les sections d'administration.
> - **Espace Chauffeur** : Un chauffeur connecté n'a accès qu'à son planning de courses assignées du jour, à son véhicule attribué et au canal radio/dispatch.
> - **Espace Secrétariat / Opérations** : Visualise le planning opérationnel, les réservations à affecter et la navette scolaire, sans accès à la comptabilité stratégique.
> - **Espace Direction / Admin / Comptabilité** : Seuls ces profils ont accès aux KPI globaux d'entreprise, à la trésorerie générale et aux bilans financiers de Laperle Tour HT.

- **Décision validée 1 (Paiements)** : Prise en charge des paiements MonCash, Virement Bancaire, Chèque et Cash, avec saisie obligatoire du code de transaction et téléversement de la photo/reçu du bordereau.
- **Décision validée 2 (Traçabilité)** : Tous les numéros de référence (`FAC-...`, `PRO-...`, `DEV-...`, `RES-...`, `PAI-...`) sont des badges interactifs ouvrant instantanément la prévisualisation officielle du document avec impression et téléchargement PDF.
- **Décision validée 3 (Devises)** : Double affichage systématique USD avec conversion instantanée en Gourdes Haïtiennes (HTG) selon le taux configuré (132 HTG / USD).
- **Décision validée 4 (Notifications)** : Routage asymétrique — les demandes de devis/factures envoyées par un client alertent uniquement les administrateurs ; le client ne reçoit sa notification que lorsque l'administration lui transmet le document validé.

---

### 1. Overview & Core Concept

- **Ce que fait le module** : Fournit une expérience sur mesure pour chaque type d'acteur de la plateforme. Les clients disposent d'un portail VIP épuré pour piloter leurs voyages, demander des devis ou factures en un clic, régler par MonCash ou virement avec preuve photographique, et consulter leurs reçus. Les administrateurs gèrent la flotte et les encaissements avec une traçabilité totale des références et des pièces justificatives.
- **Public cible & Personas** :
  - *Clients (Particuliers, Entreprises, Parents d'élèves)* : Consultation exclusive de leurs dossiers et demandes de services.
  - *Chauffeurs* : Consultation directe de leur feuille de route quotidienne.
  - *Gestionnaires & Direction* : Pilotage complet de la flotte, validation comptable et archivage.
- **Bénéfice clé** : Confidentialité totale des données financières et d'exploitation, élimination des erreurs de facturation grâce aux références interconnectées cliquables, et réconciliation immédiate des paiements locaux en Haïti (MonCash / virements bancaires).

---

### 2. User Experience & Visual Design

#### Parcours Utilisateurs Clés

1. **Parcours Client - Consultation & Demande de Devis/Facture** :
   - Le client arrive sur son tableau de bord nominatif avec ses 4 indicateurs personnels (Courses actives, Devis en attente, Factures à régler, Historique).
   - Sur une réservation, il clique sur "Demander un devis" ou "Demander une facture".
   - Une confirmation sobre s'affiche à l'écran ("Demande transmise avec succès à l'équipe commerciale").
   - **Aucune notification parasite** n'est ajoutée dans la cloche du client ; en revanche, une alerte immédiate avec pastille rouge apparaît sur le poste de l'administrateur.
   - Dès que l'administrateur génère et transmet le document, le client reçoit une notification cliquable qui ouvre directement le document officiel.

2. **Parcours Traçabilité & Documents Cliquables** :
   - Partout où une référence apparaît (`RES-003`, `FAC-2026-001`, `PRO-2026-001`), elle est présentée sous forme de badge interactif avec une icône de document.
   - Au clic ou au tap, une fenêtre modale élégante s'ouvre avec la mise en page fidèle au format papier à en-tête de Laperle Tour HT, prête pour l'impression ou l'exportation.

3. **Parcours Soumission de Preuve de Paiement** :
   - Sur une facture impayée ou depuis l'historique des paiements, le client clique sur "Transmettre une preuve de paiement".
   - Il sélectionne son moyen de paiement : **MonCash**, **Virement Bancaire (SOGEBANK, UNIBANK, BUH)**, **Chèque** ou **Espèces/Cash**.
   - Il saisit la référence de transaction (ex: ID MonCash #991204) et joint la photo du bordereau/capture d'écran.
   - L'administration reçoit la preuve avec aperçu de l'image pour validation définitive en un clic.

#### Identité Visuelle & Thème

- **Direction Esthétique** : Interface institutionnelle caribéenne haut de gamme, mariant le bleu marine profond (`#0f172a`), l'or chaleureux de la perle (`#d97706` / `#f59e0b`) et des surfaces blanches lumineuses.
- **Structure des Tableaux & Cartes** :
  - **Lignes allongées et aérées** : Espacement vertical généreux (`padding: 16px 14px`), texte fluide sans troncature tronquée, typographie lisible (`line-height: 1.6`).
  - **Basculement Tableau / Vue Carte Détaillée** : Possibilité d'afficher chaque course ou facture sous forme de carte individuelle spacieuse avec badges d'itinéraires et détails passagers.
- **Double Affichage Monétaire** :
  - Typographie nette avec devise principale et conversion entre parenthèses : `$250.00 USD (33,000 HTG)` ou `33,000 HTG ($250.00 USD)`.

---

### 3. Key Product Decisions & Trade-Offs

- **Décision 1 : Cloisonnement Hermétique des Vues et Données** :
  - *Approche retenue* : Filtrage multi-niveaux à la source dans `AppContext` (par `clientId`, `driverId`, email normalisé et numéro de téléphone) et masquage total dans `AppShell` de tous les onglets d'administration pour les profils clients et chauffeurs.
  - *Raison* : Respect strict du secret d'affaires, protection des données personnelles des passagers et clarté maximale de l'espace client.
- **Décision 2 : Routage Asymétrique des Notifications** :
  - *Approche retenue* : Ajout des attributs `targetAudience` (`'admin' | 'client' | 'chauffeur'`) et `authorUid` sur les notifications. Le flux de notification de chaque profil exclut automatiquement les actions initiées par l'utilisateur lui-même.
  - *Raison* : Évite de notifier un client de sa propre action tout en alertant immédiatement le service commercial.
- **Décision 3 : Preuves de Paiement avec Stockage Image Direct** :
  - *Approche retenue* : Téléversement local avec encodage base64 sécurisé pour prévisualisation et archivage immédiat sans dépendance de serveur de stockage tiers.
  - *Raison* : Fonctionnement fluide et instantané sur tous les appareils (smartphones et ordinateurs).

---

### 4. Technical Architecture & Data Strategy

#### Architecture du Système & Flux des Vues

```
┌────────────────────────────────────────────────────────────────────────┐
│                          LAPERLE TOUR HT                               │
│                   Contrôle d'Accès & Tableaux                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│     ESPACE CLIENT & PROSPECT  │         │    ESPACE DIRECTION & ADMIN   │
│  - Dashboard Strictement Perso│         │  - Vue d'Ensemble Société     │
│  - 4 KPI Personnels Uniquement│         │  - KPI Chiffre d'Affaires/Trés│
│  - Mes Réservations / Courses │         │  - Gestion Flotte & Chauffeurs│
│  - Mes Devis & Factures Perso │         │  - Validation des Paiements   │
│  - Demande Devis / Facture    │         │  - Dispatch & Régulation      │
│  - Preuve MonCash/Virement    │         │  - Accès aux Pièces Jointes   │
└──────────────┬────────────────┘         └───────────────┬───────────────┘
               │                                          │
               │ [Action: Demande Devis/Facture]          │
               ├─────────────────────────────────────────►│ (Reçoit Alerte)
               │                                          │
               │◄─────────────────────────────────────────┤ (Envoi Document)
               │ [Reçoit Proforma / Facture Validée]      │
               │                                          │
               ▼                                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   COMPOSANTS TRANSVERSAUX PARTAGÉS                     │
│  - DocRefBadge : Badge cliquable -> Ouvre Aperçu Officiel Modal        │
│  - DualPrice   : Double affichage permanent USD / HTG (Taux 132)       │
│  - Table/Cards : Lignes allongées (16px) & Bascule vue cartes          │
│  - ProofModal  : Saisie code transaction + téléversement reçu photo    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Modèle de Données & Extensions

- **`NotificationItem`** :
  - `targetAudience?: 'admin' | 'client' | 'chauffeur' | 'all'`
  - `targetUid?: string` (UID du destinataire précis)
  - `authorUid?: string` (UID de l'émetteur pour empêcher l'auto-notification)
- **`Paiement` & `Facture`** :
  - `preuveImage?: string` (Data URI base64 du bordereau/capture)
  - `referenceTransaction?: string` (ID MonCash ou numéro de bordereau)
  - `modePaiement: 'MonCash' | 'Virement Bancaire' | 'Chèque' | 'Cash'`
- **Composants Clés** :
  - `DocRefBadge.tsx` : Composant compact avec bouton loupe/aperçu pour déclencher l'ouverture du document correspondant.
  - `DualPrice.tsx` : Rendu harmonisé des montants avec équivalence en monnaie locale.
  - `PaymentProofModal.tsx` : Formulaire avec téléversement drag-and-drop / prise de photo de la preuve et saisie de la référence.

---

### Vérification & Critères de Succès

1. **Isolation Vérifiée** : Connexion sous profil Client -> Aucune donnée d'exploitation globale n'est visible, les 4 KPI sont exclusivement personnels.
2. **Notifications Asymétriques** : Une demande de facture formulée par le client n'apparaît pas dans sa propre liste de notifications, mais apparaît instantanément pour l'administrateur.
3. **Traçabilité Cliquable** : Un clic sur n'importe quel numéro de document (`FAC-...`, `PRO-...`, `RES-...`) déclenche l'aperçu instantané.
4. **Preuve MonCash/Virement** : Téléversement d'une image de reçu avec code de transaction, visible et agrandissable côté administration.
5. **Double Affichage** : Tous les montants indiquent l'équivalent calculé en USD et HTG.
