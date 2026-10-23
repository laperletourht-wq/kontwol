# Plan d'Implémentation - Cohérence Métier, Déconnexion & Expérience Mobile/PC

Ce plan détaille les correctifs et améliorations à apporter suite à vos retours et réponses aux questions de cadrage :
1. **Redirection déconnexion** : retour propre vers la vitrine publique d'accueil avec réinitialisation de l'état.
2. **Menu Notifications interactif** : fenêtre flottante auto-fermante au clic extérieur, action « Tout marquer comme lu » et « Effacer », redirection fluide.
3. **Chaîne métier automatisée (1-clic)** : Réservation ➔ Devis Proforma ➔ Facture ➔ Enregistrement de Paiement ➔ Planning Dispatch avec mise à jour immédiate des statuts liés.
4. **Audit de cohérence Responsive Mobile & PC** : boutons 100% visibles et tactiles (min 44px), élimination de tout débordement horizontal, affichage optimisé des tableaux et formulaires.

---

## 1. Déconnexion Fiable & Redirection Vitrine (`#headerLogoutBtn`)
- **Problème identifié** : Le clic sur `#headerLogoutBtn` déconnectait la session Firebase mais ne réinitialisait pas l'affichage de l'application vers la vitrine publique (`setIsPublicLanding(true)`), laissant l'utilisateur dans l'interface interne sans profil actif.
- **Actions** :
  - Dans `AppShell.tsx`, enrichir le gestionnaire de clic de `#headerLogoutBtn` avec `await logout()`, `setIsPublicLanding(true)` et une notification toast bienveillante.
  - Dans `AuthContext.tsx`, garantir que `logout()` purge complètement l'état utilisateur, les caches locaux éventuels et réinitialise le rôle par défaut.
  - S'assurer que le bouton dispose d'un retour visuel instantané et d'un état désactivé durant l'exécution pour éviter les doubles clics.

---

## 2. Menu Déroulant des Notifications (`#notifDropdown`)
- **Problème identifié** : Le menu de notifications ne se refermait pas lorsqu'on cliquait ailleurs sur l'écran (absence d'écouteur de clic extérieur), et pouvait dépasser sur les écrans mobiles étroits (largeur fixe de 320px).
- **Actions** :
  - Ajouter un hook `useRef` et un écouteur d'événement (`mousedown` / `touchstart`) dans `AppShell.tsx` pour fermer automatiquement `#notifDropdown` lors d'un clic en dehors.
  - Adapter le style CSS pour mobile : `max-width: calc(100vw - 24px)`, largeur fluide et positionnement relatif sécurisé évitant tout débordement.
  - Ajouter l'action « Tout marquer comme lu » (`markAllNotificationsAsRead`) dans `AppContext.tsx` et dans l'en-tête du dropdown.
  - Permettre le clic sur chaque notification pour naviguer directement vers le document concerné (réservation, facture, planning) et fermer le menu.

---

## 3. Chaîne Métier & Interconnexion Fluide des Pages (1-Clic)
- **Objectif** : Transformer les pages isolées en un flux commercial et opérationnel continu et professionnel.
- **Actions** :
  - **Réservations ➔ Devis & Planning** :
    - Dans `ReservationsView.tsx`, ajouter des boutons d'action rapide dans le tableau et la fiche :
      - *« Convertir en Devis »* : génère automatiquement la proforma avec montants, TVA et items, met à jour le statut de réservation en « Devis envoyé » et bascule vers l'onglet Proformas.
      - *« Envoyer au Planning / Dispatch »* : assigne un véhicule et un chauffeur par défaut, crée le trajet dans `Plannings`, passe la réservation en « Confirmée » et bascule vers l'onglet Plannings.
  - **Devis Proforma ➔ Facture Officielle** :
    - Dans `ProformasView.tsx`, bouton d'action *« Convertir en Facture »* : génère la facture officielle `FAC-XXXXXX`, marque le devis comme « Validé & Facturé », et redirige l'utilisateur vers Factures.
  - **Facture ➔ Enregistrement du Paiement Caisse/Banque** :
    - Dans `AppContext.tsx`, créer `convertFactureToPaiement(facture, modePaiement, reference)` pour encaisser instantanément une facture en 1 clic.
    - Dans `FacturesView.tsx`, pour toute facture non soldée, ajouter le bouton rapide *« Encaisser le paiement »* qui génère le reçu dans `Paiements`, met à jour le montant payé et bascule la facture en « Payée ».
  - **Élèves Navette ➔ Abonnement** :
    - Renforcer le lien direct dans `ElevesView.tsx` pour générer en 1 clic l'abonnement mensuel et la facture récurrente.

---

## 4. Audit de Cohérence & Ergonomie Globale (Mobile & Desktop)
- **Actions** :
  - Vérifier toutes les vues (`ReservationsView`, `ProformasView`, `FacturesView`, `PlanningsView`, `VehiculesView`, `ChauffeursView`, `ClientsView`, `ParametresView`, `FinancesView`) :
    - Conteneurs défilables horizontalement sans casser la mise en page (`table-wrap` avec scrollbar douce).
    - Boutons d'action tactiles accessibles ($\ge 44\text{px}$) et bien espacés sur smartphone.
    - Uniformité des badges de statuts (Vert = Validé/Payé/Disponible, Orange = En attente/En cours, Rouge = Annulé/En retard).
    - Masquage des colonnes secondaires sur mobile au profit d'une présentation claire ou d'un bouton d'expansion.

---

## 5. Validation & Vérification
- Validation avec `compile_applet` pour s'assurer de 0 erreur TypeScript/React.
- Validation avec `lint_applet` pour vérifier la conformité du code.
- Test visuel et logique de l'ensemble du cycle de vie de transport et de facturation.
