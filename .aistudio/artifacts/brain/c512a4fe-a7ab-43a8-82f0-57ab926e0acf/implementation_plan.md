# Plan d'adaptation : Mes devis, Mes factures & Mes paiements

Harmonisation visuelle et fonctionnelle des trois pages de l'espace client sur la structure exacte de la page **Réservations** (selon la maquette fournie `image_34b4a4ea.png`).

---

## 1. Structure commune & Logique des 3 pages

Chaque page intègre les 4 blocs standardisés de la page Réservations :

1. **Bandeau d'en-tête immersif** : Titre du module, description et visuel de flotte en arrière-plan transparent.
2. **Ligne de KPI d'état cliquables** : Filtrage instantané (Total, En attente, Validé / Payé, Soldé, Annulé).
3. **Bandeau d'appel à l'action supérieur** :
   - **Mes devis** : Icône document bleu + Titre *"Demande de devis & tarification"* + Bouton bleu `+ Demander un devis`.
   - **Mes factures** : Icône facture bleu + Titre *"Factures & règlements"* + Bouton bleu `+ Régler une facture`.
   - **Mes paiements** : Icône carte/monnaie bleu + Titre *"Justificatifs & reçus"* + Bouton bleu `+ Transmettre un justificatif`.
4. **Tableau principal aéré** :
   - Barre de commande : Titre (*Mes devis*, *Mes factures*, *Mes paiements*), champ de recherche dynamique et filtre déroulant par statut.
   - Badge de référence stylisé (`DEV-2025-XXXX`, `FAC-2025-XXXX`, `PAY-2025-XXXX`) en fond bleu doux.
   - Détail associé (trajet, date/échéance, référence course).
   - Montant **exclusivement en Gourdes (HTG)** formaté avec séparateurs de milliers.
   - Statut en badge couleur (Vert pour validé/payé, Ambre pour en attente, Rouge pour annulé/impayé).
   - **Dernière colonne d'action avec bouton & menu déroulant** : Actions contextuelles (Consulter la fiche A4 officielle, Télécharger/Imprimer, Partager WhatsApp, Procéder au paiement / Envoyer la preuve).

---

## 2. Adaptation spécifique par page

| Page | Colonnes du tableau | Action principale | Menu contextuel d'actions |
| :--- | :--- | :--- | :--- |
| **Mes devis** | N° de devis, Trajet / Prestation, Date d'émission & Validité, Montant (HTG), Statut, Actions | `+ Demander un devis` | • Voir le devis A4<br>• Accepter le devis en 1 clic<br>• Télécharger / Imprimer<br>• Contacter l'agence |
| **Mes factures** | N° de facture, N° Dossier / Trajet, Date d'émission & Échéance, Montant TTC (HTG), Statut, Actions | `+ Régler une facture` | • Voir la facture A4<br>• Payer en ligne (MonCash, Virement, Carte)<br>• Télécharger PDF / Reçu<br>• Transmettre un justificatif |
| **Mes paiements** | Réf. Paiement, Facture associée, Date & Méthode, Montant encaissé (HTG), Statut, Actions | `+ Transmettre un justificatif` | • Voir le reçu officiel<br>• Consulter la preuve transmise<br>• Télécharger l'attestation<br>• Facture liée |

---

## 3. Plan d'exécution

1. **Création des composants clients dédiés** :
   - `ClientProformasView.tsx` pour l'espace *Mes devis*.
   - `ClientFacturesView.tsx` pour l'espace *Mes factures*.
   - `ClientPaiementsView.tsx` pour l'espace *Mes paiements*.
2. **Intégration transparente** :
   - Branchement dans `ProformasView.tsx`, `FacturesView.tsx` et `PaiementsView.tsx` dès que le rôle connecté est `client` ou `prospect`.
3. **Validation & compilation** :
   - Vérification de la compatibilité responsive, des formats monétaires HTG et exécution de `compile_applet`.
