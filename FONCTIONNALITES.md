# Kanveo — Liste exhaustive des fonctionnalités

> **Classification : SaaS MOYEN** (voir justification en fin de document)

---

## 🔐 Authentification & Autorisation

- Inscription email/mot de passe (prénom, nom, email, entreprise, mot de passe, confirmation, acceptation CGU)
- Inscription OAuth Google (avatar récupéré automatiquement)
- Connexion email/mot de passe avec option "Se souvenir de moi"
- Connexion OAuth Google
- Mot de passe oublié (envoi email de réinitialisation via Supabase)
- Refresh automatique de session au retour sur l'onglet
- 3 niveaux de rôles : Utilisateur (1), Team Lead (2), Admin (3)
- Routes protégées : vérification authentification + abonnement actif
- Routes publiques : `/`, `/auth`, `/pricing`, `/about`, `/terms`, `/privacy`
- Gate abonnement : statut `active` ou `trialing` requis pour les pages app

---

## 📊 Dashboard

### KPIs Prospection
- Total prospects
- Nombre de pipelines
- Taux de conversion (%)
- Nombre de tâches

### KPIs Financiers
- CA Contrats
- Charges / mois
- Encaissé
- Nombre de clients actifs

### Widgets
- Détails pipeline (stats par colonne, navigation au clic)
- Alertes tâches en retard
- Tâches à venir (7 jours)
- Résumé financier (CA, encaissé, charges, résultat)
- 5 derniers prospects ajoutés

---

## 🏢 Module SIRENE (Import données entreprises)

### Import
- Formats acceptés : CSV, XLSX, XLS (max 50 MB)
- Auto-détection du délimiteur CSV (`;`, `,`, `\t`, `|`)
- Détection automatique du format SIRENE (colonnes SIRET, dénomination, activité, contact)
- Normalisation des SIRET (notation scientifique, padding 14 chiffres)
- Import par batch de 10 lignes avec barre de progression
- Persistance dans Supabase (table `sirene_imports`)

### Filtres (persistés dans localStorage)
- Filtre diffusion : Oui / Partielle / Les deux
- Tri par date
- Filtre formes juridiques (12 types : Auto-entrepreneur, SARL, SAS, SASU, SA, EI, EURL, SNC, SCI, SCOP, Association, Autre)
- Masquer les [Non Diffusées]
- Afficher seulement avec identité
- Afficher seulement avec entreprise

### Table SIRENE
- Colonnes : Checkbox, Actions, Identité (nom + SIRET), Entreprise (dénomination + activité), Contact (tel + email), Notes
- Sélection multiple (tout / individuel)
- Suppression individuelle avec confirmation
- Notes inline éditables (sauvegarde temps réel)
- Clic sur ligne → modal détails
- Skeleton loading

### Modal Détails
- Affichage structuré : nom, dénomination, SIRET formaté, forme juridique (label complet), adresse, date de création, code APE + libellé
- Copie rapide (SIRET, adresse) en un clic
- Édition inline des champs avec sauvegarde
- Toggle "masquer les champs vides"
- Recherche Internet : Clearbit Autocomplete + DuckDuckGo (entreprise, personne, SIRET, LinkedIn)
- Lien vers Annuaire Entreprises officiel (data.gouv.fr)
- Ajout aux pipelines : sélection multi-pipeline

### Ajout Multiple aux Pipelines
- Sélection N prospects × M pipelines
- Progression avec barre (current/total)
- Extraction automatique des champs SIRENE → prospect

### Export
- Export CSV (séparateur `;`)
- Export XLSX

### Réinitialisation
- Suppression de toutes les données SIRENE de l'utilisateur

---

## 🎯 Module Prospection (Pipeline CRM)

### Pipelines (Boards)
- Créer / Renommer / Supprimer des pipelines
- Pipeline par défaut (paramétrable)
- Dernière sélection persistée par utilisateur
- Migration des prospects orphelins vers un pipeline
- Statuts par défaut : prospect → contacté → en attente → client → perdu (avec icônes/couleurs)

### Gestion des Colonnes
- Ajouter / Modifier / Supprimer des colonnes de pipeline
- Chaque colonne : label, icône (20 emojis au choix), couleur (10 couleurs)
- Réorganiser les colonnes (haut/bas)

### 4 Vues de visualisation
1. **Kanban** : colonnes par statut, drag-and-drop, cards avec badges statut/rappel
2. **Liste** : groupé par statut, sélecteur de statut inline, tri par date
3. **Cartes** : grille responsive (1–4 colonnes), recherche + filtre statut, tags, rappels
4. **Tableau** : table triable (nom, email, statut, SIRET, date), recherche + filtre statut

### Prospect CRUD
- Création manuelle : nom, email, téléphone, entreprise, secteur activité, adresse, notes
- Import depuis SIRENE (flow automatique entre pages)
- Mise à jour inline ou via modal détails
- Suppression avec confirmation
- Déplacement de statut : drag-and-drop (kanban) ou sélecteur (autres vues)

### Détails Prospect (modal complet)
- Données SIRENE extraites du JSON brut
- Gestion des tags
- Historique de contact + statistiques
- Édition inline de tous les champs
- Changement de statut

### Système de Tags (8 prédéfinis)
| Tag | Couleur |
|-----|---------|
| Priorité haute | Rouge |
| Priorité moyenne | Ambre |
| Priorité basse | Bleu |
| Décideur | Violet |
| Demande de devis | Vert |
| Qualifié | Émeraude |
| Non qualifié | Gris |
| À relancer | Orange |

### Historique de Contact
- Total des contacts
- Jours depuis dernier contact (alerte >7j jaune, >14j rouge)
- Date de création du prospect

### Recherche & Filtres
- Recherche textuelle : nom, entreprise, email, téléphone, notes
- Filtre par statut
- Filtre par tags (8 tags)
- Filtre par plage de dates

### Actions en Masse
- Sélection tout / individuelle
- Changer statut en masse
- Supprimer en masse
- Ajouter tag en masse
- Envoyer email en masse

### Email Prospect
- Envoi via `mailto:` (ouvre client email)
- 4 templates intégrés : Premier contact, Premier suivi, Deuxième suivi, Proposition de RDV
- 17 variables dynamiques : `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{sector}}`, `{{email}}`, `{{phone}}`, `{{address}}`, `{{city}}`, `{{postalCode}}`, `{{juridicalForm}}`, `{{siret}}`, `{{activityCode}}`, `{{creationDate}}`, `{{status}}`, `{{notes}}`, `{{tags}}`, `{{content}}`
- Syntaxe valeur par défaut : `{{variable : "valeur"}}`
- Mode single prospect ou bulk
- Copie dans le presse-papiers

---

## ✅ Module Tâches

### Boards de Tâches
- Boards indépendants des pipelines
- Créer / Renommer / Supprimer
- Colonnes par défaut : À faire, En cours, Bloqué, Terminé (avec icônes + couleurs)

### Gestion des Colonnes
- Même système que les pipelines : label, icône (20 emojis), couleur (10 couleurs)
- Ajouter / Modifier / Supprimer / Réorganiser

### 5 Vues de visualisation
1. **Kanban** : drag-and-drop, ajout rapide inline par colonne, filtre priorité, tri, gestion colonnes inline
2. **Todo** : checklist simple, barre de progression, ajout rapide, toggle done/todo, tri par priorité
3. **Liste** : groupé par statut (collapsible), ajout rapide inline, checkbox toggle
4. **Cartes** : grille responsive, recherche + filtre statut, tri priorité puis date
5. **Tableau** : table triable (titre, priorité, échéance, statut, date), recherche + filtre, ajout rapide

### Tâche CRUD
- Création complète : titre, description, priorité (4 niveaux), date d'échéance, liaison prospect, liaison board
- Ajout rapide inline (titre uniquement) dans toutes les vues
- Mise à jour tous les champs + checklist + notes
- Suppression avec confirmation
- Changement de statut : drag-and-drop / checkbox / select
- Auto-set `completed_at` quand statut → terminé

### Détails Tâche (modal 3 onglets)
- **Détails** : titre, description, statut, priorité (basse/moyenne/haute/urgente), échéance, lien prospect, dates, checklist
- **Checklist** : ajouter/toggle/supprimer des items, barre de progression visuelle
- **Notes** : éditeur Markdown avec toolbar (gras, italique, code, listes, titres), preview HTML, compteur mots/caractères, auto-save (1.5s)
- **Commentaires** : CRUD complet, avatar avec initiales, horodatage relatif, scroll auto, confirmation suppression

### Indicateurs visuels
- Badge priorité coloré (urgent=rouge, haute=orange, moyenne=jaune, basse=vert)
- Badge "Retard" si overdue
- Indicateurs : lié à un prospect, présence de notes
- Barre de progression checklist
- KPIs en haut de page : Total, À faire, En cours, Bloqué, Terminé, En retard

---

## 💼 Module Clients & Finances

### Clients CRUD
- Champs : nom, entreprise, email, téléphone, adresse, notes, statut (actif/inactif/archivé)
- Table avec recherche (nom, entreprise, email)
- Menu contextuel par ligne (Modifier, Supprimer)
- Conversion prospect → client

### Contrats CRUD
- Champs : client, titre, description, montant total, récurrence (ponctuel/mensuel/trimestriel/annuel), statut (en cours/terminé/annulé), dates début/fin, montant reçu, nombre d'échéances
- Suivi paiement : barre de progression (reçu vs total), badges (Payé / XX% / Non payé)
- Table avec recherche (titre, nom client, entreprise)

### Charges / Dépenses CRUD
- Champs : intitulé, catégorie, montant, récurrence, date
- 9 catégories : Loyer/Local, Logiciels/Abonnements, Salaires, Marketing/Publicité, Impôts/Taxes, Assurances, Fournitures, Déplacements, Autre
- Affichage montant en rouge négatif

### Tableau de bord Financier
- 4 KPIs : CA Contrats, Encaissé, Charges/mois, Clients actifs
- Suivi financier détaillé : CA total, récurrent vs ponctuel, charges mensuelles, barre encaissement
- Répartition des charges : top 5 catégories avec barres de progression
- Graphique mensuel (Recharts BarChart) : CA, Encaissé, Charges par mois + sélecteur d'année

---

## 📁 Module Base de Données Personnalisée

- Import fichiers : CSV, XLSX, XLS, TXT
- Auto-détection du délimiteur CSV
- Mapping colonnes fichier → champs Kanveo (Nom, Entreprise, Email, Téléphone, Adresse, Notes, ou Ignorer)
- Auto-détection des colonnes par patterns
- Aperçu des 3 premières lignes
- Table paginée (25 lignes/page) avec navigation
- Tri par colonne (nom, entreprise, email, téléphone, adresse)
- Recherche globale
- Filtre par fichier source
- Sélection multiple + ajout au pipeline
- Configuration des colonnes affichées
- Export CSV / XLSX
- Persistance dans localStorage

---

## ⚙️ Paramètres

### Profil
- Édition : prénom, nom, nom complet, entreprise
- Avatar avec initiales (auto-calculées)

### Abonnement
- Badge statut (active, trialing, past_due, etc.)
- Date de renouvellement
- Lien vers portail de facturation Stripe

### Apparence
- Toggle dark / light mode
- Détection préférence système
- Persistance localStorage

### Sécurité
- Changement de mot de passe
- Déconnexion

### Zone Danger
- Export de toutes les données en JSON (prospects + tâches)
- Suppression de compte (saisie "SUPPRIMER" requise + confirmation)

---

## 🛡️ Administration (Admin uniquement, role_level 3)

### Gestion Utilisateurs
- Liste de tous les utilisateurs
- Modification du rôle (1=User, 2=Team Lead, 3=Admin)

### Codes Influenceurs
- CRUD complet : code, coupon Stripe, limite d'usage
- Toggle actif / inactif

### Parrainages (Referrals)
- Suivi des parrainages par influenceur
- Statistiques agrégées : total, par influenceur

---

## 💳 Paiement Stripe

- Tarif unique : 15€ HT/mois (1ère année, Early Adopter -21%), puis 19€ HT/mois
- Checkout : validation code promo/influenceur → prix réduit à 9,99€
- Redirection vers Stripe Checkout via Supabase Edge Function
- Portail de facturation Stripe (gestion abonnement, carte, factures)
- Pages de confirmation post-paiement

---

## 🎨 Interface & UX

### Navigation
- **Non connecté** : barre horizontale (Pricing, About, Login)
- **Connecté** : sidebar latérale collapsible, responsive mobile (hamburger), tooltips quand collapsed
- Badge "Beta"
- Avatar utilisateur + email + bouton logout

### Composants partagés
- Système de notifications Toast (info/success/error, auto-dismiss 5s)
- Dialogues de confirmation (mode promise + callback)
- Error Boundary (capture erreurs React)
- Animations de transition entre pages
- Skeleton loading (tables, modals, détails)
- Bouton copie presse-papiers avec feedback

### Thème
- Mode sombre / clair
- Détection automatique de la préférence système

---

## 📄 Pages Statiques & Légales

- **Landing** : page marketing avec features, stats, CTA
- **Pricing** : plan unique, liste fonctionnalités, FAQ (6 questions)
- **About** : informations sur le produit
- **Documentation** : guide interactif avec accordéons (tous les modules)
- **Conditions d'utilisation** (CGU)
- **Politique de confidentialité**
- **Page 404** personnalisée

---

## 🚧 Fonctionnalités en développement

1. **Templates Email** : page affiche "En cours de développement" (code sous-jacent avec CRUD templates, variables dynamiques, preview, campagnes)
2. **Pièces jointes tâches** : UI placeholder visible (formats prévus : Images, PDF, Word, Excel, limite 50MB/fichier)
3. **Recherche Internet SIRENE** : partiellement fonctionnel (Clearbit + DuckDuckGo)

---

## 🏗️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite 7 |
| Routing | React Router v6 |
| UI | shadcn/ui + Tailwind CSS v4 + Radix UI + Lucide Icons |
| State / Cache | TanStack React Query (optimistic updates) |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions, RLS) |
| Paiement | Stripe (Checkout, Billing Portal, Promo Codes) |
| Import/Export | XLSX.js (CSV, XLSX, XLS) |
| Graphiques | Recharts |
| Langue UI | Français intégral |
| Lazy Loading | React.lazy + Suspense sur toutes les pages (sauf Landing) |

---

## 📊 Classification du SaaS

### Verdict : **SaaS MOYEN** (mid-weight)

### Grille d'évaluation

| Critère | Léger | Moyen | Lourd | Kanveo |
|---------|-------|-------|-------|---------|
| Nombre de modules | 1-2 | 3-6 | 7+ | **6** (SIRENE, Prospection, Tâches, Clients/Finances, Database, Admin) |
| Complexité CRUD | Basique | Multi-entités liées | Workflows complexes | **Multi-entités liées** (prospects → clients → contrats → charges) |
| Vues de données | 1-2 | 3-5 | 5+ | **4-5** par module (Kanban, Liste, Cartes, Tableau, Todo) |
| Intégrations externes | 0-1 | 2-3 | 4+ | **3** (Stripe, API SIRENE/Clearbit, Supabase Auth) |
| Gestion utilisateurs | Login basique | Rôles + abonnement | Multi-tenant + RBAC | **Rôles + abonnement** |
| Paiement | Non | Checkout simple | Plans multiples + facturation | **Checkout + portail facturation** |
| Import/Export | Non | CSV basique | Multi-format + mapping | **Multi-format + mapping auto** |
| Dashboard | Non | KPIs simples | Graphiques + analytics | **KPIs + graphiques + alertes** |
| Drag & Drop | Non | 1 module | Multi-modules | **2 modules** (Prospection + Tâches) |
| Mode offline | Non | localStorage partiel | Service Worker + sync | **localStorage partiel** |

### Pourquoi pas "léger" ?
- Trop de modules interconnectés (6)
- CRUD multi-entités avec relations (prospect → client → contrat → charge)
- Système de pipeline Kanban avec colonnes personnalisables
- Gestion financière avec graphiques
- Import/export multi-format avec mapping automatique
- Système de rôles + abonnement + admin

### Pourquoi pas "lourd" ?
- Pas de multi-tenant / workspaces actifs (supprimé)
- Pas de collaboration temps réel (ni websocket, ni presence)
- Pas de système de notifications push
- Pas d'API publique / webhooks
- Pas de plans de tarification multiples
- Pas de reporting avancé (exports PDF, rapports personnalisés)
- Pas d'automatisations / workflows (Zapier-like)
- Pas d'intégration calendrier/email native (SMTP, IMAP)
- Pas de mobile app / PWA
- Pas d'internationalisation (français uniquement)

### Pour passer en SaaS "lourd", il faudrait ajouter :
- Multi-tenant avec espaces de travail
- Collaboration temps réel
- API REST publique
- Plans de tarification multiples
- Automatisations (triggers, actions, workflows)
- Intégration email native (envoi depuis l'app, pas via mailto:)
- Notifications push (email + in-app)
- Reporting avancé (PDF, tableaux de bord personnalisables)
