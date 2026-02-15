# 📋 TODO LIST - Kanveo

Feuille de route pour l'amélioration du projet Kanveo.

---

## 🎯 Légende

- ✅ Terminé
- 🚧 En cours
- ⏳ À faire
- ❌ Bloqué

---

## Phase 1 : 🚨 CRITIQUE & SÉCURITÉ (Priorité Maximale)

### 1. 🚨 Sécuriser les clés Supabase
**Status:** ⏳ À faire
**Priorité:** CRITIQUE
**Temps estimé:** 30 minutes

**Tâches:**
- [ ] Créer fichier `.env.local` à la racine
- [ ] Ajouter variables d'environnement :
  ```
  VITE_SUPABASE_URL=https://aqhdhaxcxyguyicqwlmy.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- [ ] Modifier `src/lib/supabaseClient.js` pour utiliser `import.meta.env`
- [ ] Ajouter `.env.local` au `.gitignore`
- [ ] Créer `.env.example` avec des valeurs d'exemple
- [ ] **IMPORTANT:** Si le repo est public, régénérer les clés dans Supabase

**Fichiers concernés:**
- `src/lib/supabaseClient.js`
- `.gitignore`
- `.env.local` (nouveau)
- `.env.example` (nouveau)

---

### 2. 🔥 Ajouter Error Boundaries React
**Status:** ⏳ À faire
**Priorité:** HAUTE
**Temps estimé:** 1 heure

**Tâches:**
- [ ] Créer composant `ErrorBoundary.jsx` dans `src/components/`
- [ ] Créer page `ErrorPage.jsx` pour afficher les erreurs
- [ ] Envelopper `<App />` dans `ErrorBoundary` dans `main.jsx`
- [ ] Ajouter logging des erreurs (console + optionnel Sentry)

**Fichiers concernés:**
- `src/components/ErrorBoundary.jsx` (nouveau)
- `src/pages/ErrorPage.jsx` (nouveau)
- `src/main.jsx`

---

### 3. 🔥 Validation des formulaires
**Status:** ⏳ À faire
**Priorité:** HAUTE
**Temps estimé:** 3-4 heures

**Tâches:**
- [ ] Installer Zod : `npm install zod`
- [ ] Créer schémas de validation dans `src/schemas/`
  - [ ] `prospectSchema.js` (nom, email, téléphone, SIRET)
  - [ ] `authSchema.js` (email, password, nom complet)
  - [ ] `contactSchema.js` (type, date, notes)
- [ ] Intégrer validation dans les formulaires :
  - [ ] `Auth.jsx` (inscription/connexion)
  - [ ] `ContactModal.jsx`
  - [ ] Formulaires de création/édition de prospects
- [ ] Afficher messages d'erreur clairs en français

**Fichiers concernés:**
- `src/schemas/` (nouveau dossier)
- `src/pages/Auth.jsx`
- `src/components/prospecting/ContactModal.jsx`

---

### 4. ✅ Code Splitting avec lazy loading
**Status:** ✅ Terminé
**Priorité:** HAUTE

**Réalisé:**
- ✅ Import lazy de toutes les pages
- ✅ Composant `PageLoader` créé
- ✅ `<Suspense>` ajouté autour des routes
- ✅ Bundle initial réduit de ~1.2 MB à ~137 KB

**Résultat:** Temps de chargement initial divisé par 3-4 !

---

### 5. 🔥 Système de backup/export automatique
**Status:** ⏳ À faire
**Priorité:** HAUTE
**Temps estimé:** 4-5 heures

**Tâches:**
- [ ] Créer fonction d'export complet CRM (prospects + contacts + settings)
- [ ] Format : JSON + option CSV/Excel
- [ ] Bouton "Exporter mes données" dans Settings
- [ ] Fonction d'import pour restaurer les données
- [ ] Sauvegarde automatique locale (localStorage backup)
- [ ] Optionnel : Export automatique vers Google Drive API

**Fichiers concernés:**
- `src/pages/Settings.jsx`
- `src/utils/backup.js` (nouveau)

---

## Phase 2 : ⚡ QUICK WINS (Gains rapides)

### 6. ⚡ Confirmations avant suppression
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 1 heure

**Tâches:**
- [ ] Créer composant `ConfirmDialog.jsx` réutilisable
- [ ] Ajouter confirmation avant :
  - [ ] Suppression de prospect
  - [ ] Suppression de contact
  - [ ] Suppression de template
  - [ ] Suppression de tag
- [ ] Style dark mode avec message clair

**Fichiers concernés:**
- `src/components/ConfirmDialog.jsx` (nouveau)
- `src/components/prospecting/KanbanBoard.jsx`
- `src/components/prospecting/TemplateManager.jsx`

---

### 7. ⚡ Loading Skeleton au lieu de spinners
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 2 heures

**Tâches:**
- [ ] Créer composants skeleton :
  - [ ] `ProspectCardSkeleton.jsx`
  - [ ] `TableRowSkeleton.jsx`
  - [ ] `DashboardSkeleton.jsx`
- [ ] Remplacer spinners par skeletons dans :
  - [ ] Dashboard
  - [ ] Prospecting (Kanban)
  - [ ] SireneImport (table)

**Fichiers concernés:**
- `src/components/skeletons/` (nouveau dossier)
- `src/pages/Dashboard.jsx`
- `src/pages/Prospecting.jsx`
- `src/pages/SireneImport.jsx`

---

### 8. ⚡ Copier dans le presse-papier
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 1 heure

**Tâches:**
- [ ] Créer fonction utilitaire `copyToClipboard(text)`
- [ ] Ajouter boutons "Copier" avec icône pour :
  - [ ] Email (avec toast "Email copié !")
  - [ ] SIRET (avec toast "SIRET copié !")
  - [ ] Téléphone
  - [ ] Adresse
- [ ] Animation visuelle lors du clic

**Fichiers concernés:**
- `src/utils/clipboard.js` (nouveau)
- `src/components/prospecting/ProspectDetailsModal.jsx`
- `src/components/sirene/ModalDetails.jsx`

---

### 9. ⚡ Bouton Undo après actions
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 2-3 heures

**Tâches:**
- [ ] Implémenter système d'historique des actions
- [ ] Toast avec bouton "Annuler" après :
  - [ ] Suppression de prospect (restaurer dans les 5 secondes)
  - [ ] Déplacement de statut
  - [ ] Modification de données
- [ ] Stocker dernière action en mémoire
- [ ] Fonction `undo()` pour chaque type d'action

**Fichiers concernés:**
- `src/hooks/useUndo.js` (nouveau)
- `src/components/Toast.jsx`
- `src/components/prospecting/useProspectingData.js`

---

### 10. ⚡ Filtres persistants (localStorage)
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 1 heure

**Tâches:**
- [ ] Sauvegarder filtres SIRENE dans localStorage :
  - [ ] Diffusion publique/partielle
  - [ ] Formes juridiques sélectionnées
  - [ ] Masquer [ND]
  - [ ] Tri par date
- [ ] Restaurer filtres au rechargement de la page
- [ ] Bouton "Réinitialiser les filtres"

**Fichiers concernés:**
- `src/components/sirene/useSireneData.js`
- `src/pages/SireneImport.jsx`

---

## Phase 3 : ⭐ FONCTIONNALITÉS MOYENNES

### 11. ⭐ Notifications push pour rappels
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 4-5 heures

**Tâches:**
- [ ] Demander permission notifications navigateur
- [ ] Créer service worker pour notifications
- [ ] Vérifier rappels quotidiennement
- [ ] Envoyer notification si prospects à relancer
- [ ] Intégration optionnelle : email de rappel via API

**Fichiers concernés:**
- `public/sw.js` (nouveau - service worker)
- `src/services/notifications.js` (nouveau)
- `src/pages/Settings.jsx` (activer/désactiver)

---

### 12. ⭐ Système de scoring de prospects
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 5-6 heures

**Tâches:**
- [ ] Créer algorithme de scoring :
  - Taille entreprise (effectifs, CA)
  - Nombre de contacts effectués
  - Réactivité (délai de réponse)
  - Secteur d'activité (APE pertinent)
- [ ] Afficher score 0-100 sur chaque prospect
- [ ] Couleur du score (vert > 70, orange 40-70, rouge < 40)
- [ ] Filtrer/trier par score
- [ ] Graphique distribution des scores dans Dashboard

**Fichiers concernés:**
- `src/utils/scoring.js` (nouveau)
- `src/components/prospecting/prospectCard.jsx`
- `src/pages/Dashboard.jsx`

---

### 13. ⭐ Workflow automation
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 1 semaine

**Tâches:**
- [ ] Créer page "Workflows"
- [ ] Définir déclencheurs :
  - Nouveau prospect créé
  - Statut changé
  - X jours sans contact
- [ ] Définir actions :
  - Envoyer email automatique
  - Créer rappel
  - Changer statut
  - Ajouter tag
- [ ] Interface drag & drop pour créer workflows
- [ ] Historique des workflows exécutés

**Fichiers concernés:**
- `src/pages/Workflows.jsx` (nouveau)
- `src/components/workflows/` (nouveau dossier)
- Ajouter route dans `App.jsx`

---

### 14. ⭐ Recherche avancée full-text
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 4-5 heures

**Tâches:**
- [ ] Installer Fuse.js (recherche fuzzy côté client)
- [ ] Recherche dans :
  - Nom entreprise
  - Email
  - Téléphone
  - Notes de contacts
  - Tags
  - Adresse
- [ ] Highlights des résultats
- [ ] Recherche avec Cmd+K (raccourci)
- [ ] Filtres sauvegardables

**Fichiers concernés:**
- `src/components/GlobalSearch.jsx` (nouveau)
- `src/hooks/useSearch.js` (nouveau)

---

## Phase 4 : 💡 AMÉLIORATIONS UX/UI

### 15. 💡 Onboarding utilisateur
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 1 semaine

**Tâches:**
- [ ] Créer tutoriel interactif étape par étape
- [ ] Tooltips sur les fonctionnalités clés
- [ ] Données de démonstration (prospects fictifs)
- [ ] Checklist de progression (importer SIRENE, créer prospect, etc.)
- [ ] Vidéo de démo embarquée

**Fichiers concernés:**
- `src/components/onboarding/` (nouveau dossier)
- `src/pages/Home.jsx`

---

### 16. 💡 Raccourcis clavier
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 3-4 heures

**Tâches:**
- [ ] Implémenter raccourcis :
  - `Cmd+K` : Recherche rapide
  - `Cmd+N` : Nouveau prospect
  - `Cmd+S` : Sauvegarder
  - `Esc` : Fermer modal
  - `Cmd+/` : Aide raccourcis
- [ ] Modal d'aide avec tous les raccourcis
- [ ] Support Windows (Ctrl) et Mac (Cmd)

**Fichiers concernés:**
- `src/hooks/useKeyboardShortcuts.js` (nouveau)
- `src/components/ShortcutsHelp.jsx` (nouveau)

---

### 17. 💡 Dark/Light mode toggle
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 4-5 heures

**Tâches:**
- [ ] Créer thème clair (actuellement seulement dark)
- [ ] Toggle dans Navbar
- [ ] Sauvegarder préférence dans localStorage
- [ ] Transition douce entre modes
- [ ] Respecter préférence système (prefers-color-scheme)

**Fichiers concernés:**
- `src/context/ThemeContext.jsx` (nouveau)
- `src/components/Navbar.jsx`
- `tailwind.config.js`

---

### 18. 💡 Progressive Web App (PWA)
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 1 semaine

**Tâches:**
- [ ] Installer plugin Vite PWA : `npm install vite-plugin-pwa`
- [ ] Créer manifest.json
- [ ] Générer icônes (192x192, 512x512)
- [ ] Service Worker pour mode hors-ligne
- [ ] Sync automatique quand connexion revient
- [ ] Banner "Installer l'app" sur mobile

**Fichiers concernés:**
- `vite.config.js`
- `public/manifest.json` (nouveau)
- `public/icons/` (nouveau dossier)

---

## Phase 5 : 🛠️ INFRASTRUCTURE TECHNIQUE

### 19. 🛠️ Migration vers TypeScript
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 2-3 semaines

**Tâches:**
- [ ] Installer TypeScript : `npm install -D typescript @types/react @types/react-dom`
- [ ] Créer `tsconfig.json`
- [ ] Renommer fichiers `.jsx` → `.tsx` progressivement
- [ ] Définir types/interfaces :
  - [ ] `Prospect`
  - [ ] `Contact`
  - [ ] `Template`
  - [ ] `User`
  - [ ] `Settings`
- [ ] Corriger toutes les erreurs TypeScript

**Note:** Migration progressive recommandée (1 page par jour)

---

### 20. 🛠️ Tests automatisés
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 1-2 semaines

**Tâches:**
- [ ] Tests unitaires (Vitest) :
  - [ ] `npm install -D vitest @testing-library/react`
  - [ ] Tester hooks (useProspectingData, useSettings)
  - [ ] Tester fonctions utilitaires
  - [ ] Tester composants simples
- [ ] Tests E2E (Playwright) :
  - [ ] `npm install -D @playwright/test`
  - [ ] Scénarios : inscription, création prospect, déplacement Kanban
- [ ] CI/CD : tests automatiques sur chaque commit

**Fichiers concernés:**
- `vitest.config.js` (nouveau)
- `playwright.config.js` (nouveau)
- `tests/` (nouveau dossier)

---

### 21. 🛠️ State Management moderne
**Status:** ⏳ À faire
**Priorité:** MOYENNE
**Temps estimé:** 1 semaine

**Tâches:**
- [ ] Installer Zustand : `npm install zustand`
- [ ] Installer TanStack Query : `npm install @tanstack/react-query`
- [ ] Migrer état local vers stores Zustand :
  - [ ] `useProspectStore`
  - [ ] `useSettingsStore`
  - [ ] `useUIStore`
- [ ] Utiliser React Query pour appels Supabase
- [ ] DevTools pour debugging

**Fichiers concernés:**
- `src/stores/` (nouveau dossier)
- Tous les composants avec état complexe

---

### 22. 🛠️ Logging & Monitoring
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 3-4 heures

**Tâches:**
- [ ] Créer compte Sentry (gratuit)
- [ ] Installer : `npm install @sentry/react`
- [ ] Configurer dans `main.jsx`
- [ ] Capturer erreurs JavaScript
- [ ] Capturer erreurs réseau
- [ ] Optionnel : PostHog pour analytics

**Fichiers concernés:**
- `src/main.jsx`
- `src/lib/sentry.js` (nouveau)

---

## Phase 6 : 📊 ANALYTICS & REPORTING

### 23. 📊 Rapports avancés
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 1 semaine

**Tâches:**
- [ ] Créer page "Rapports"
- [ ] Export PDF avec jsPDF
- [ ] Graphiques personnalisables (choisir KPIs)
- [ ] Période personnalisable
- [ ] Comparaison mois/mois, année/année
- [ ] Prévisions basées sur historique

**Fichiers concernés:**
- `src/pages/Reports.jsx` (nouveau)
- `src/utils/pdfExport.js` (nouveau)

---

### 24. 📊 KPIs additionnels
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 3-4 heures

**Tâches:**
- [ ] Calculer et afficher :
  - [ ] Temps moyen de conversion (Prospect → Client)
  - [ ] Valeur vie client (LTV)
  - [ ] Coût d'acquisition (CAC)
  - [ ] ROI par canal
  - [ ] Taux de désabonnement (churn)
- [ ] Ajouter au Dashboard
- [ ] Graphiques d'évolution

**Fichiers concernés:**
- `src/pages/Dashboard.jsx`
- `src/utils/analytics.js` (nouveau)

---

## Phase 7 : 🔗 INTÉGRATIONS

### 25. 🔗 Intégrations APIs tierces
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 2-3 semaines

**Tâches:**
- [ ] Gmail API (envoi d'emails)
- [ ] Google Calendar (créer événements)
- [ ] Hunter.io (enrichissement emails)
- [ ] Pappers (données entreprises françaises)
- [ ] Calendly (prise de RDV)
- [ ] Slack (notifications)

**Note:** Chaque intégration = 2-3 jours de travail

---

### 26. 🔗 API publique REST
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 2 semaines

**Tâches:**
- [ ] Créer API backend avec Supabase Edge Functions
- [ ] Endpoints :
  - `GET /prospects`
  - `POST /prospects`
  - `GET /analytics`
- [ ] Documentation OpenAPI/Swagger
- [ ] Authentification JWT
- [ ] Rate limiting

**Fichiers concernés:**
- `supabase/functions/` (nouveau)

---

## Phase 8 : 🎯 COLLABORATION

### 27. 🎯 Multi-utilisateurs
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 3-4 semaines

**Tâches:**
- [ ] Système d'équipes (team_id dans DB)
- [ ] Attribution de prospects à un utilisateur
- [ ] Commentaires sur prospects
- [ ] Permissions (admin, team lead, commercial)
- [ ] Activité en temps réel (qui édite quoi)
- [ ] Notifications in-app

**Note:** Nécessite refonte DB Supabase

---

## Phase 9 : 🎨 POLISH & FINITIONS

### 28. 🎨 Animations micro-interactions
**Status:** ⏳ À faire
**Priorité:** TRÈS BASSE
**Temps estimé:** 1 semaine

**Tâches:**
- [ ] Installer Framer Motion : `npm install framer-motion`
- [ ] Animations :
  - [ ] Entrée/sortie de cartes Kanban
  - [ ] Hover sur boutons
  - [ ] Transitions de pages
  - [ ] Modals
  - [ ] Toasts

**Fichiers concernés:**
- Tous les composants visuels

---

### 29. 🎨 Toasts améliorées
**Status:** ⏳ À faire
**Priorité:** TRÈS BASSE
**Temps estimé:** 2-3 heures

**Tâches:**
- [ ] Icônes pour chaque type (✅ success, ❌ error, ⚠️ warning)
- [ ] Animations entrée/sortie
- [ ] Barre de progression (temps restant)
- [ ] Actions personnalisées dans toasts
- [ ] Stack de toasts (max 3 visibles)

**Fichiers concernés:**
- `src/components/Toast.jsx`

---

### 30. 🔍 Enrichissement automatique
**Status:** ⏳ À faire
**Priorité:** BASSE
**Temps estimé:** 1 semaine

**Tâches:**
- [ ] Bouton "Enrichir" sur prospects
- [ ] API Hunter.io pour trouver emails
- [ ] API Pappers pour données financières
- [ ] Scraping réseaux sociaux (LinkedIn, Twitter)
- [ ] Remplissage automatique des champs

**Fichiers concernés:**
- `src/services/enrichment.js` (nouveau)
- `src/components/prospecting/ProspectDetailsModal.jsx`

---

## 📊 Statistiques

**Total tâches:** 30
**Terminées:** 1 ✅
**En cours:** 0 🚧
**À faire:** 29 ⏳

**Progression:** 3.3% ███░░░░░░░░░░░░░░░░░░░░░░░░░░

---

## 🎯 Prochaines étapes recommandées

1. **URGENT :** Sécuriser les clés Supabase
2. Ajouter Error Boundaries
3. Implémenter validation formulaires
4. Quick Wins (confirmations, skeletons, copier)
5. Tests et monitoring

---

## 📝 Notes

- Garder ce fichier à jour après chaque tâche complétée
- Estimer temps réel vs temps estimé
- Documenter les décisions importantes
- Ajouter screenshots des nouvelles fonctionnalités

---

**Dernière mise à jour :** 2025-12-14
**Version :** 1.0
