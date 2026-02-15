# 🚀 Kanveo - CRM de prospection B2B

Une application complète de gestion de pipeline commercial avec outils d'importation SIRENE, automatisation des rappels, et analyse en temps réel.

## 📋 Fonctionnalités Principales

### 1. **Import SIRENE Avancé** 📊
- Import de fichiers CSV/XLSX depuis l'API SIRENE française
- Auto-détection du format de fichier
- Normalisation des SIRET (conversion notation scientifique → 14 chiffres)
- Résolution des codes APE (688+ secteurs d'activité)
- Filtrage avancé :
  - Par statut de diffusion (ND, Non diffusé, etc.)
  - Par forme juridique (60+ types)
  - Par secteur d'activité
  - Tri configurable
- Export en CSV/XLSX
- Persistance des données avec localStorage
- Documentation sur la source des données

### 2. **Pipeline Prospection Kanban** 🎯
- Tableau Kanban interactif avec drag & drop
- 5 statuts configurables : Prospects, Contactés, En attente, Client, Perdu
- Création de prospects manuels ou depuis SIRENE
- Gestion complète des prospects

### 3. **Dashboard Analytique** 📈
- Statistiques en temps réel
- Gestion intelligente des rappels
- Historique des derniers contacts
- Notifications toast automatiques

### 4. **Automatisation & Rappels** ⏰
- Notifications pour prospects en retard
- Seuils de rappels personnalisables (1-30 jours)
- Suivi complet des contacts
- Historique avec timestamps

### 5. **Templates de Messages** 📋
- 5 templates prédéfinis
- Substitution de variables automatique
- Templates personnalisés dans paramètres

### 6. **Gestion Avancée** 🏷️
- Tags et catégories pour prospécts
- Recherche avancée multi-critères
- Actions en masse (changement statut, suppression)
- Historique complet des interactions

### 7. **Paramètres Avancés** ⚙️
- Configuration des seuils de rappels
- Gestion des templates personnalisés
- Toggle notifications toast

## 🛠️ Technologies

- **React 18+** avec Hooks
- **React Router v6** pour navigation
- **Tailwind CSS** dark theme
- **Vite** pour build
- **localStorage** pour persistance
- **SIRENE API** pour données entreprises

## 🚀 Démarrage

```bash
npm install
npm run dev
```

Accès: http://localhost:5173 (ou 5174)

## 📊 Flux de Travail

1. **Importer** données SIRENE (CSV/XLSX)
2. **Créer** prospects dans le pipeline
3. **Gérer** avec drag & drop
4. **Suivre** via le Dashboard
5. **Analyser** statistiques en temps réel

## 💾 Données

Tous les données sont sauvegardés automatiquement:
- `sireneData` : Données SIRENE importées
- `prospectingData` : Pipeline de prospects
- `appSettings` : Paramètres utilisateur

Limite: ~5-10MB per domain

## 📱 Design

- Mobile responsive (1 colonne)
- Tablet adapté (2-3 colonnes)
- Desktop optimisé (5+ colonnes)

## 📈 Roadmap Phase 3

- Authentification utilisateur
- Équipes collaboratives
- Intégration email
- Export PDF
- Prévisions IA
- API REST backend

---

**Version** : 1.0.0 | **Décembre 2025** | Production Ready ✅
