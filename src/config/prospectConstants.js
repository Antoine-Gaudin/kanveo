// Constantes partagées pour les composants prospect (Card, Modal, TagManager)

export const AVAILABLE_TAGS = [
  { id: "priority-high", label: "Priorité haute", color: "red" },
  { id: "priority-medium", label: "Priorité moyenne", color: "amber" },
  { id: "priority-low", label: "Priorité basse", color: "blue" },
  { id: "decision-maker", label: "Décideur", color: "purple" },
  { id: "needs-proposal", label: "Demande de devis", color: "green" },
  { id: "qualified", label: "Qualifié", color: "emerald" },
  { id: "unqualified", label: "Non qualifié", color: "gray" },
  { id: "follow-up", label: "À relancer", color: "orange" },
];

// Couleurs de tags — compatible light & dark mode
export const TAG_COLOR_MAP = {
  red: "bg-red-600/20 border-red-500/50 text-red-600 dark:text-red-400",
  amber: "bg-amber-600/20 border-amber-500/50 text-amber-600 dark:text-amber-400",
  blue: "bg-blue-600/20 border-blue-500/50 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-600/20 border-purple-500/50 text-purple-600 dark:text-purple-400",
  green: "bg-green-600/20 border-green-500/50 text-green-600 dark:text-green-400",
  emerald: "bg-emerald-600/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
  gray: "bg-gray-600/20 border-gray-500/50 text-gray-600 dark:text-gray-400",
  orange: "bg-orange-600/20 border-orange-500/50 text-orange-600 dark:text-orange-400",
};

// Couleurs de statuts par défaut (fallback pour statuts hardcodés)
export const DEFAULT_STATUS_COLORS = {
  prospect: "from-blue-600 to-blue-700",
  contacte: "from-purple-600 to-purple-700",
  attente: "from-amber-600 to-amber-700",
  client: "from-green-600 to-green-700",
  perdu: "from-red-600 to-red-700",
};

// Palette de couleurs dynamiques pour les statuts custom
const DYNAMIC_STATUS_PALETTE = [
  "from-cyan-600 to-cyan-700",
  "from-teal-600 to-teal-700",
  "from-indigo-600 to-indigo-700",
  "from-pink-600 to-pink-700",
  "from-rose-600 to-rose-700",
  "from-lime-600 to-lime-700",
  "from-sky-600 to-sky-700",
  "from-fuchsia-600 to-fuchsia-700",
];

/**
 * Retourne la classe gradient pour un statut donné.
 * Supporte les statuts custom en leur assignant une couleur dynamique.
 */
export function getStatusColor(statusId, allStatuses = []) {
  if (DEFAULT_STATUS_COLORS[statusId]) {
    return DEFAULT_STATUS_COLORS[statusId];
  }
  // Pour les statuts custom, assigner une couleur basée sur l'index
  const customStatuses = allStatuses
    .map((s) => (typeof s === "object" ? s.id : s))
    .filter((id) => !DEFAULT_STATUS_COLORS[id]);
  const idx = customStatuses.indexOf(statusId);
  if (idx >= 0) {
    return DYNAMIC_STATUS_PALETTE[idx % DYNAMIC_STATUS_PALETTE.length];
  }
  return "from-slate-600 to-slate-700";
}

/**
 * Retourne le label affiché d'un statut (avec emoji si disponible).
 */
export function getStatusLabel(statusId, allStatuses = []) {
  for (const s of allStatuses) {
    if (typeof s === "object" && s.id === statusId) {
      return s.icon ? `${s.icon} ${s.label}` : s.label;
    }
  }
  return statusId;
}

/**
 * Retourne le label d'un tag à partir de son ID.
 */
export function getTagLabel(tagId) {
  const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
  return tag?.label || tagId;
}

/**
 * Retourne la couleur d'un tag à partir de son ID.
 */
export function getTagColor(tagId) {
  const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
  return tag?.color || "slate";
}

/**
 * Retourne le meilleur nom à afficher pour un prospect.
 */
export function getDisplayName(prospect) {
  if (prospect.name && prospect.name.trim()) return prospect.name;
  if (prospect.company && prospect.company.trim()) return prospect.company;
  return "Prospect sans nom";
}

/**
 * Retourne le sous-titre (entreprise) si un nom de personne est affiché.
 */
export function getDisplaySubtitle(prospect) {
  if (
    prospect.name &&
    prospect.name.trim() &&
    prospect.company &&
    prospect.company.trim()
  ) {
    return prospect.company;
  }
  return "";
}
