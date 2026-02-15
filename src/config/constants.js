// src/config/constants.js
// Centralisation de toutes les constantes de l'application

// Statuts du pipeline de prospection
export const STATUSES = ["prospect", "contacte", "attente", "client", "perdu"];

// Configuration visuelle des statuts
export const STATUS_CONFIG = {
  "prospect": {
    header: "bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-l-4 border-blue-500",
    badge: "bg-blue-600/20 text-blue-300",
    icon: "🆕",
    label: "Prospects",
    color: "blue"
  },
  "contacte": {
    header: "bg-gradient-to-r from-purple-600/20 to-purple-500/10 border-l-4 border-purple-500",
    badge: "bg-purple-600/20 text-purple-300",
    icon: "📞",
    label: "Contactés",
    color: "purple"
  },
  "attente": {
    header: "bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-l-4 border-amber-500",
    badge: "bg-amber-600/20 text-amber-300",
    icon: "⏳",
    label: "En attente",
    color: "amber"
  },
  "client": {
    header: "bg-gradient-to-r from-green-600/20 to-green-500/10 border-l-4 border-green-500",
    badge: "bg-green-600/20 text-green-300",
    icon: "✅",
    label: "Client",
    color: "green"
  },
  "perdu": {
    header: "bg-gradient-to-r from-red-600/20 to-red-500/10 border-l-4 border-red-500",
    badge: "bg-red-600/20 text-red-300",
    icon: "❌",
    label: "Perdu",
    color: "red"
  },
};

// Paramètres par défaut de l'application
export const DEFAULT_SETTINGS = {
  reminderDays: 7, // Rappel après 7 jours sans contact
  overdueDays: 14, // Alerte après 14 jours sans contact
  enableReminders: true,
  enableToastNotifications: true,
  autoTemplateEnabled: false,
  defaultTemplate: "Bonjour {{firstName}},\n\nJe vous contacte suite à notre intérêt pour {{company}}.\n\nCordialement",
  emailTemplates: [], // Templates email personnalisés de l'utilisateur
};

// Clés de stockage localStorage
export const STORAGE_KEYS = {
  PROSPECTS: "prospectingData",
  SETTINGS: "appSettings",
  SIRENE_DATA: "sireneData",
};

// Types de contacts
export const CONTACT_TYPES = [
  "Appel téléphonique",
  "Email",
  "Rencontre",
  "Message LinkedIn",
  "Autre"
];

// Templates de messages par défaut
export const DEFAULT_TEMPLATES = [
  {
    id: "initial",
    name: "Premier contact",
    content: "Bonjour {{firstName}},\n\nJe vous contacte suite à notre intérêt pour {{company}}.\n\nCordialement"
  },
  {
    id: "followup",
    name: "Relance",
    content: "Bonjour {{firstName}},\n\nJe me permets de revenir vers vous concernant {{company}}.\n\nCordialement"
  },
  {
    id: "meeting",
    name: "Proposition de rencontre",
    content: "Bonjour {{firstName}},\n\nSeriez-vous disponible pour un échange concernant {{company}} ?\n\nCordialement"
  }
];
