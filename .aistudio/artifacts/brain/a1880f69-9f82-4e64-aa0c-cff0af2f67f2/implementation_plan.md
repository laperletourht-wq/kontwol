# Page Dédiée de Demande de Devis Client

Plan architectural pour l'ouverture d'une page complète dédiée lors du clic sur **« Demander un devis »** dans l'Espace Client, conforme à la maquette haute fidélité (`WhatsApp Image 2026-11-04 at 12.22.40.jpeg`).

---

## Décisions Confirmées avec l'Utilisateur

- **Format d'affichage** : Page complète dédiée intégrée à l'Espace Client (vue scindée avec formulaire à gauche et aperçu officiel A4 à droite), remplaçant la modale générique.
- **Action après envoi** : Enregistrement immédiat de la demande dans le système et affichage direct du devis officiel généré avec le badge orange **« En attente »** et les actions PDF / Imprimer / Accepter.
- **Devise officielle** : Tarification exclusive en **Gourdes (HTG)** avec taux de référence opérationnel.

---

## 1. Expérience Utilisateur & Flux Visuel

```
┌────────────────────────────────────────────────────────────────────────┐
│ Espace Client ➔ Mes Devis                                             │
│                                                                        │
│ [ Clic sur « Demander un devis » ]                                     │
│                  │                                                     │
│                  ▼                                                     │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Fil d'Ariane : Accueil > Mes devis > Nouvelle demande de devis     │ │
│ │ Bouton supérieur : [ ← Retour aux devis ]     [ 🚀 Envoyer ]       │ │
│ ├──────────────────────────────────┬─────────────────────────────────┤ │
│ │ VOLET GAUCHE : FORMULAIRE        │ VOLET DROIT : FEUILLE A4 BLANCHE│ │
│ │ • Lieu de départ & Arrivée       │ • Entête officiel Laperle Tour  │ │
│ │ • Date & Heure du trajet         │ • Badge bleu « DEMANDE DE DEVIS»│ │
│ │ • Catégorie de véhicule          │ • Encadrés Client & Mission     │ │
│ │ • Nombre de passagers            │ • Tableau chiffré en Gourdes    │ │
│ │ • Notes & Précisions             │ • Total HTG dynamique           │ │
│ │ • Bouton principal [ Envoyer ]   │ • Vague décorative bleue & or   │ │
│ └──────────────────────────────────┴─────────────────────────────────┘ │
│                  │                                                     │
│                  ▼ [ Clic sur « Envoyer » ]                            │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Page Devis Officiel (Maquette exacte fournie)                      │ │
│ │ • N° DEV-2025-XXXX généré                                          │ │
│ │ • Statut « En attente » (badge ambre)                              │ │
│ │ • Actions actives : [PDF] [Imprimer] [Partager] [Accepter le devis] │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Entrée dans la vue** : Le clic sur le bouton bleu « Demander un devis » dans `ClientProformasView` bascule instantanément l'affichage en mode page dédiée (`viewMode = 'new-request'`) avec fil d'Ariane et bouton retour.
2. **Saisie & synchronisation en direct** : Pendant que le client renseigne son trajet, son véhicule et sa date, la feuille A4 officielle à droite se met à jour en temps réel avec le calcul tarifaire estimé en HTG.
3. **Validation & Envoi en 1 clic** : Le clic sur **« Envoyer ma demande de devis »** enregistre le devis dans Firestore / AppContext et bascule automatiquement sur la page officielle du devis en attente avec les boutons d'export et d'acceptation.

---

## 2. Architecture & Modèle de Données

```
┌─────────────────────────────────┐
│ AppContext / Firestore Service  │
│  - proformas (CRUD temps réel)  │
│  - saveProforma()               │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ ClientProformasView (Gestionnaire de vues de l'Espace Devis)│
│                                                             │
│  ├── [viewMode === 'list']        ➔ Liste & KPIs            │
│  ├── [viewMode === 'new-request'] ➔ Page complète scindée   │
│  └── [selectedProforma !== null]  ➔ DocumentDetailView      │
└─────────────────────────────────────────────────────────────┘
```

- **Données créées lors de l'envoi** :
  - `id` / `number` : `DEV-2025-XXXX` auto-incrémenté
  - `dossierId` : `DEM-2025-XXXX`
  - `clientId` / `client` / `telephone` / `email` : coordonnées du profil connecté
  - `service` / `origin` / `destination` / `date` / `time` / `vehicle` / `passengers`
  - `amount` & `currency` : montant chiffré en `HTG`
  - `status` : `'En attente'`
  - `createdAt` / `updatedAt` : horodatage serveur

---

## 3. Plan d'Exécution Synthétique

1. **Composant Page Dédiée dans `ClientProformasView`** :
   - Intégrer l'état `viewMode: 'list' | 'new-request'`.
   - Brancher le clic du bouton d'action supérieur « Demander un devis » sur `setViewMode('new-request')`.
2. **Mise en page scindée (Formulaire + Document A4 en direct)** :
   - Panneau gauche : carte épurée avec inputs pour le départ, l'arrivée, la date, l'heure, le véhicule souhaité et les notes.
   - Panneau droit : rendu A4 fidèle à l'image fournie (logo, coordonnées complètes, encadrés grisés, tableau de chiffrage en HTG et signature graphique).
3. **Bouton d'envoi & Transition d'état** :
   - Action d'envoi asynchrone sécurisée avec toast de confirmation.
   - Enregistrement immédiat dans Firestore / `AppContext` et passage direct à la vue officielle du devis généré au statut **« En attente »**.
4. **Vérification & Non-régression** :
   - Validation de la compilation (`compile_applet`), vérification du linter (`lint_applet`) et respect strict des règles de hooks.
