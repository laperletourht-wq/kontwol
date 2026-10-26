# Cycle Opérationnel Unifié des Courses & Facturation · LAPERLE TOUR HT

Ce plan établit le cycle de vie complet, fluide et professionnel d'une commande au sein de LAPERLE TOUR HT, reliant le Client, la Secrétaire/Régulation, la Comptabilité et le Chauffeur avec des boutons d'actions contextuels actifs à chaque étape.

---

## Synthèse des Décisions Validées

> [!IMPORTANT]
> **Choix confirmés suite à vos réponses :**
> - **Assignation Chauffeur & Véhicule** : Choix manuel par l'équipe (secrétaire ou admin) lors de la validation du dossier.
> - **Canal de transmission au chauffeur** : Notification haute priorité dans l'application mobile/web + bouton d'ordre de mission WhatsApp pré-formaté avec tous les détails du trajet.
> - **Clôture de la course** : Bouton simple et direct en un clic « 🏁 Terminer la course » depuis l'espace chauffeur, déclenchant automatiquement la notification de fin de mission à la régulation.

---

## 1. Vue d'Ensemble & Diagramme des Transitions d'États

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     CYCLE DE VIE OPÉRATIONNEL LAPERLE TOUR HT                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  [1. CLIENT]               [2. SECRÉTAIRE / ADMIN]           [3. CLIENT]
  Fait une réservation   ➔   Édite & Chiffre le dossier    ➔  Reçoit le devis
  Statut: "En attente"      [📋 Transformer en Devis]         [🧾 Demander Facture & Payer]
                                     │                                    │
                                     ▼                                    ▼
                          [4. COMPTABILITÉ / ADMIN]           [5. CLIENT]
                          [🧾 Émettre la Facture]         ➔   Transmet preuve de paiement
                          Génère bordereau officiel           (MonCash / Virement / Chèque)
                                     │
                                     ▼
                          [6. COMPTABILITÉ / ADMIN]
                          [✅ Valider Facture & Paiement]
                          (Encaissement certifié USD/HTG)
                                     │
                                     ▼
                          [7. RÉGULATION / SECRÉTAIRE]
                          [🚗 Assigner Chauffeur & Véhicule]
                          ➔ Notification App Chauffeur + WhatsApp Ordre de Mission
                                     │
                                     ▼
                          [8. CHAUFFEUR ASSIGNÉ]
                          Mission active sur le terrain
                          ➔ [🏁 Terminer la Course] (en 1 clic)
                                     │
                                     ▼
                          [9. NOTIFICATION GÉNÉRALE]
                          🔔 "Course N°... terminée par [Chauffeur] pour [Client]"
                          Statut final: "Terminée"
```

---

## 2. Parcours Détaillé Étape par Étape & Boutons Actifs

### Étape 1 : Création de la Réservation par le Client
- **Action Client** : Formulaire simplifié (Départ, Destination, Date, Heure, Type de véhicule VIP, Passagers, Coordonnées).
- **Statut Réservation** : `En attente`.
- **Feedback Immédiat** : Badge visuel *En attente*, alerte instantanée dans le centre de notifications de la secrétaire.

### Étape 2 : Prise en charge & Chiffrage en Devis par la Secrétaire
- **Interface Secrétaire** : Dans `ReservationsView` ou `SecretaireDashboard`, la réservation affiche le bouton actif :
  - **`📋 Transformer en Devis`**
- **Comportement** : Ouvre le modal de devis pré-rempli avec les informations du trajet. La secrétaire ajuste le montant en $ USD (conversion automatique en HTG selon le taux configuré), ajoute d'éventuelles options (escorte, accueil aéroport) et enregistre.
- **Liaison Traçable** : La réservation stocke la référence `devisRef` (ex: `DEV-2026-0042`) et passe au statut `Devis émis`.

### Étape 3 : Consultation Client & Demande de Facture / Paiement
- **Interface Client** : Dans `ClientDashboard` ou `ProformasView`, le client visualise son chiffrage exact.
- **Bouton Actif Client** :
  - **`🧾 Demander une Facture & Payer`** (avec indication des modes acceptés : MonCash, Virement SOGEBANK/UNIBANK, Chèque d'entreprise).
- **Impact** : Notification immédiate envoyée à la comptabilité et à la secrétaire.

### Étape 4 : Émission de la Facture Officielle
- **Interface Comptable/Secrétaire** : Sur le devis, clic sur :
  - **`🧾 Convertir en Facture Officielle`**
- **Comportement** : Génère automatiquement la facture numérotée (ex: `FAC-2026-0038`) conforme DGI avec date d'échéance et bordereau de règlement.
- **Statut Facture** : `En attente de règlement`.

### Étape 5 : Réception de la Preuve & Validation de l'Encaissement
- **Action Client** : Envoi de la référence de transaction ou capture de bordereau via le modal sécurisé *Transmettre preuve de paiement*.
- **Action Comptabilité** : Inspection de la preuve photographique / numéro de transaction, puis clic sur :
  - **`✅ Valider le Paiement & la Facture`**
- **Impact** :
  - La facture passe au statut `Payée`.
  - Le flux financier est automatiquement consigné dans le journal de trésorerie (`FinancesView`).
  - La réservation liée est débloquée pour la planification terrain.

### Étape 6 : Assignation Chauffeur & Ordre de Mission
- **Interface Régulation / Secrétaire** :
  - La réservation payée propose le bouton : **`🚗 Assigner Chauffeur & Véhicule`**.
  - Liste déroulante des chauffeurs assermentés et véhicules disponibles avec leur statut de révision.
  - Clic de validation : la réservation passe au statut `Confirmée` (ou `En mission`).
- **Transmission Chauffeur** :
  - Notification push / in-app sur le profil du chauffeur : *"Nouvelle mission assignée : [Client] à [Heure] - [Trajet]"*.
  - Bouton rapide **`📲 WhatsApp Ordre de Mission`** permettant d'envoyer en 1 clic au chauffeur la fiche récapitulative complète (lieu, heure de vol/prise en charge, contact client).

### Étape 7 : Réalisation & Clôture en 1 Clic par le Chauffeur
- **Interface Chauffeur** (`ClientDashboard` adapté chauffeur ou `PlanningsView`) :
  - La mission en cours s'affiche en tête avec le bouton proéminent :
  - **`🏁 Terminer la Course`**
- **Conséquence Immédiate** :
  - La réservation passe au statut `Terminée`.
  - Le véhicule et le chauffeur repassent au statut `Disponible`.
  - Une notification haute priorité est diffusée à la direction, la secrétaire et la comptabilité :
    *« 🏁 Course N°[REF] terminée avec succès par [Nom du Chauffeur] pour [Nom du Client]. Dossier complet archivé. »*

---

## 3. Architecture Technique & Modifications Prévues

### A. Context & Modèle de Données (`AppContext.tsx`, `types/index.ts`)
- Ajout des liaisons croisées bidirectionnelles :
  - `Reservation` : `status` ('En attente' | 'Devis émis' | 'Facturé' | 'Confirmée' | 'En cours' | 'Terminée' | 'Annulée'), `driverId`, `driverName`, `vehicleId`, `devisRef`, `factureRef`.
  - `Facture` : `reservationId`, `devisRef`, `proofImage`, `paymentStatus`.
- Nouvelles méthodes utilitaires directes :
  - `convertReservationToProforma(reservationId, proformaData)`
  - `assignDriverAndDispatch(reservationId, chauffeurId, vehiculeId)`
  - `completeMissionByDriver(reservationId)` (génère la notification globale aux administrateurs et secrétaires).

### B. Composants Impactés
1. **`ReservationsView.tsx`** :
   - Ajout du bouton d'action contextuel `📋 Transformer en Devis` sur chaque réservation en attente.
   - Ajout du modal d'assignation manuelle Chauffeur / Véhicule avec bouton WhatsApp ordre de mission.
2. **`ProformasView.tsx`** :
   - Bouton `🧾 Demander Facture & Payer` côté client et `Convertir en Facture` côté staff.
3. **`FacturesView.tsx`** :
   - Bouton de validation d'encaissement `✅ Valider Facture & Paiement` mettant à jour la réservation associée.
4. **`ClientDashboard.tsx` & `SecretaireDashboard.tsx`** :
   - Espace chauffeur : affichage des missions du jour avec le bouton en 1 clic `🏁 Terminer la Course`.
   - Espace secrétaire : indicateur de flux en temps réel sur chaque étape de la chaîne.
