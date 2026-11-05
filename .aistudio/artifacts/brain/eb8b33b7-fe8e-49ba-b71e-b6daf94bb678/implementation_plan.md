# Plan d'implémentation — Saisie libre et envoi de demande de devis client

Plan court et adapté permettant aux clients de saisir librement leurs informations de trajet, véhicule et prestations avec suggestions interactives, d'envoyer leur demande en un clic, et d'être immédiatement redirigés vers leur liste « Mes devis » avec le statut « En attente ».

---

## Décisions validées & Retours utilisateur

> [!IMPORTANT]
> Décisions confirmées lors de la phase de cadrage :
> - **Mode de saisie** : Champs texte libres assistés par listes de suggestions interactives (`<input list="..." />` et `<datalist>`) pour une totale liberté de saisie (villes, adresses précises, hôtels, aéroports, types de véhicules personnalisés).
> - **Gestion du montant** : Estimation automatique pour les trajets fréquents, complétée par la mention explicite « À chiffrer par l'agence » en cas de trajet ou demande personnalisée.
> - **Comportement après envoi** : Enregistrement synchrone de la demande (statut « En attente »), affichage d'un toast de confirmation et redirection instantanée vers la liste « Mes devis ».

---

## 1. Vue d'ensemble & Objectif

Permettre à tout client (connecté ou prospect) de formuler une demande de devis sur mesure sans être contraint par des choix fermés :
1. **Origine & Destination libres** : Possibilité de saisir n'importe quelle adresse, commune ou repère (ex: *Aéroport Toussaint Louverture*, *Hôtel Karibe*, *Labadee*, etc.) tout en bénéficiant de suggestions rapides.
2. **Véhicule & Catégorie libres** : Saisie ouverte de la flotte souhaitée ou besoins spécifiques (ex: *Minibus climatisé avec chauffeur bilingue*, *Pick-up sécurisé*, etc.).
3. **Boutons d'action réactifs** : Rendre l'envoi de la demande fluide depuis les boutons ciblés (en haut et en bas du formulaire) avec retour visuel d'envoi et notification automatique transmise à la régulation.

---

## 2. Expérience utilisateur & Conception visuelle

```
┌────────────────────────────────────────────────────────────────────────┐
│  ESPACE CLIENT ➔ NOUVELLE DEMANDE DE DEVIS                             │
│                                                                        │
│  [ ← Retour à mes devis ]                 [ ✈️ Envoyer ma demande ]    │
│                                                                        │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ 1. CONFIGURATION DU TRAJET    │  │ 2. APERÇU OFFICIEL DU DEVIS   │  │
│  │                               │  │    (Document A4 en temps réel)│  │
│  │ • Prise en charge (Origine)   │  │                               │  │
│  │   [ Saisie libre + Datalist ] │  │  Réf: DEV-2025-XXXX           │  │
│  │ • Destination d'arrivée       │  │  Dossier: DEM-2025-XXXX       │  │
│  │   [ Saisie libre + Datalist ] │  │  Client: [Nom du client]      │  │
│  │ • Date & Heure du trajet      │  │  Statut: [ En attente ]       │  │
│  │ • Véhicule souhaité (Libre)   │  │  Montant: 45 000 HTG          │  │
│  │ • Nombre de passagers         │  │  (ou "À chiffrer régulation") │  │
│  │ • Prestation & Notes libres   │  │                               │  │
│  │                               │  │  [Conditions officielles]     │  │
│  │ [ ✈️ Envoyer ma demande ]     │  │                               │  │
│  └───────────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Détail des composants ciblés (Focus Mode)
- **Origine & Destination** : Remplacement des balises `<select>` fixes par des `<input type="text" list="..." />` stylisés avec bordures soignées `#cbd5e1`, typographie dense, et suggestions via `<datalist>` des villes et points d'intérêt principaux d'Haïti.
- **Véhicule & Prestation** : Champs combinés texte libre / suggestions pour permettre à l'utilisateur de spécifier son modèle ou son besoin exact.
- **Boutons d'envoi** : Stylisation soignée avec dégradé bleu royal, icône d'envoi, état de chargement désactivé (`isSubmittingReq`), et gestion complète des erreurs/validations.

---

## 3. Architecture technique & Flux de données

```
┌──────────────────────────────────────────────────────────────┐
│  ClientProformasView (Formulaire avec Datalist)              │
│  - reqOrigin (texte libre)        - reqDestination (libre)   │
│  - reqVehicle (texte libre)       - reqServiceType (libre)   │
│  - reqNotes (instructions libres) - estimatedAmount (HTG)    │
└──────────────────────────────┬───────────────────────────────┘
                               │ Clic sur "Envoyer ma demande"
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  handleSendQuoteRequest                                      │
│  1. Génération DEV-2025-XXXX & DEM-2025-XXXX                 │
│  2. saveProforma(...) [Firestore / Local State]              │
│  3. saveReservation(...) [Dossier lié pour régulation]       │
│  4. addNotification(...) [Alerte client + régulation]        │
│  5. showToast('Demande de devis transmise avec succès !')    │
│  6. setClientProformaViewMode('list')                        │
└──────────────────────────────┬───────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Redirection immédiate sur « Mes devis »                      │
│  - Nouveau devis affiché en première ligne                   │
│  - Badge « En attente » doré                                 │
│  - Menu d'actions (Voir A4, Imprimer, WhatsApp)              │
└──────────────────────────────────────────────────────────────┘
```

### Étapes de mise en œuvre :
1. **Mise à jour des champs de saisie (`ClientProformasView.tsx`)** :
   - Transformer `reqOrigin` et `reqDestination` en champs texte libres enrichis de listes `<datalist>` (Port-au-Prince, Cap-Haïtien, Pétion-Ville, Jacmel, Les Cayes, Aéroports, etc.).
   - Transformer `reqVehicle` et `reqServiceType` en champs texte libres avec suggestions prédéfinies.
   - Ajouter un champ d'adresse précise optionnel pour affiner la prise en charge.
2. **Logique de calcul & statut** :
   - Maintenir le calcul dynamique en HTG pour les trajets reconnus, et afficher un libellé clair « Sur devis — À chiffrer par l'agence » en cas de trajet sur mesure.
3. **Transmission & Redirection** :
   - Assurer la persistance synchrone du devis et de la réservation dans le store d'état.
   - Rediriger automatiquement vers `viewMode = 'list'` après confirmation toast.
4. **Validation & Compilation** :
   - Exécution conjointe de `compile_applet` et `lint_applet` pour valider l'intégrité du code.
