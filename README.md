# Centre de Contrôle Laperle (LAPERLE TOUR HT)

Application complète de gestion des opérations de transport, circuits touristiques, réservations VIP, navettes scolaires, facturation et dispatch pour **LAPERLE TOUR HT** (« *Un coup d'œil sur Haïti* »), réécrite en **React 19 + TypeScript + Vite**.

## Fonctionnalités Principales

1. **Vitrine Publique LAPERLE TOUR HT** :
   - Présentation de la flotte (Toyota Land Cruiser Prado TXL, HiAce VIP Grand Cabin, Coasters scolaires)
   - Circuits d'exception en Haïti (Citadelle Laferrière, Côte des Arcadins, Bassin Bleu Jacmel, Kenscoff)
   - Simulateur interactif de devis et réservation en temps réel avec conversion USD / HTG et contact direct WhatsApp
2. **Authentification & Gestion des Rôles (RBAC)** :
   - Système multi-rôles : Administrateur, Direction, Comptabilité, Secrétariat, Opérations, Chauffeur, Client
   - Connexion Google Firebase Popup & Email/Mot de passe avec vérification de compte
3. **Tableau de Bord & Indicateurs KPI** :
   - Suivi en temps réel des courses, clients, véhicules en ligne, chauffeurs mobilisés
   - Graphique analytique des recettes et dépenses mensuelles
   - Répartition par prestations
4. **Gestion Opérationnelle Complète** :
   - **Réservations** : Planning, suivi des statuts, génération d'itinéraires GPS, messagerie WhatsApp directe
   - **Devis Proformas & Facturation** : Création avec calcul automatique de TVA, transformation de proforma en facture, relances clients
   - **Génération & Impression PDF** : Feuilles officielles aux normes DGI avec coordonnées fiscales et cachet
   - **Flotte & Chauffeurs** : Fiches techniques des véhicules, suivi kilométrique, contrôle des permis
   - **Plannings & Dispatch** : Trajets quotidiens avec prévention des conflits d'horaires
   - **Caisse & Finances** : Suivi des encaissements (MonCash, Natcash, virements bancaires, espèces), bilans exportables en CSV
   - **Live Dispatch Radio** : Messagerie instantanée par canaux (Direction, Dispatch, Chauffeurs)

## Stack Technique

- **Frontend** : React 19, TypeScript, Vite
- **Styles** : CSS original Laperle haute fidélité (`styles.css`) avec design bicolore bleu marine et orange signature
- **Backend & Données** : Express (server.ts), Firebase Auth, Cloud Firestore (db: `ai-studio-centredecontrole-27e8ff4b-e91d-4923-8cc6-6265fb193fe7`)

## Démarrage

```bash
# Développement
npm run dev

# Compilation de production
npm run build

# Démarrage production
npm start
```
