// src/utils/task-dates.js
// Utilitaires partagés pour les dates de tâches et prospects

/**
 * Retourne la date du jour au format YYYY-MM-DD en timezone locale
 * Remplace: new Date().toISOString().split('T')[0] qui retourne une date UTC
 * @returns {string} Date locale au format YYYY-MM-DD
 */
export function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retourne un objet Date à minuit locale (00:00:00.000) pour aujourd'hui
 * @returns {Date}
 */
export function getLocalToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Extrait la partie date YYYY-MM-DD d'une chaîne date (ISO ou YYYY-MM-DD)
 * Évite les bugs UTC en ne passant pas par new Date()
 * @param {string} dateString - Date au format YYYY-MM-DD ou ISO
 * @returns {string|null} Date au format YYYY-MM-DD ou null
 */
export function parseDateOnly(dateString) {
  if (!dateString) return null;
  // ISO: "2026-02-15T10:30:00.000Z" → "2026-02-15"
  // Plain: "2026-02-15" → "2026-02-15"
  const match = String(dateString).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Vérifie si une tâche est en retard (date-only, timezone locale)
 * Méthode unique et consistante pour toute l'app
 * @param {Object} task - Objet tâche avec due_date et status
 * @returns {boolean}
 */
export function isTaskOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  const dueDateStr = parseDateOnly(task.due_date);
  if (!dueDateStr) return false;
  const todayStr = getLocalDateString();
  return dueDateStr < todayStr; // Comparaison lexicographique YYYY-MM-DD
}

/**
 * Compare une date avec aujourd'hui de manière sûre (date-only)
 * @param {string} dateString - Date à comparer
 * @returns {{ isOverdue: boolean, isToday: boolean, isFuture: boolean }}
 */
export function compareDateToToday(dateString) {
  const dateStr = parseDateOnly(dateString);
  const todayStr = getLocalDateString();
  if (!dateStr) return { isOverdue: false, isToday: false, isFuture: false };
  return {
    isOverdue: dateStr < todayStr,
    isToday: dateStr === todayStr,
    isFuture: dateStr > todayStr
  };
}

/**
 * Formate une date pour affichage dans les tâches (ex: "15 févr." ou "15 févr. 2024")
 * Gère correctement les ISO et les YYYY-MM-DD sans bug UTC
 * @param {string} dateString - Date au format ISO ou YYYY-MM-DD
 * @param {Object} [options] - Options de formatage
 * @param {boolean} [options.includeYear=false] - Inclure l'année
 * @returns {string|null}
 */
export function formatTaskDate(dateString, { includeYear = false } = {}) {
  if (!dateString) return null;
  const dateOnly = parseDateOnly(dateString);
  if (!dateOnly) return null;
  
  // Créer la date à midi UTC pour éviter les décalages de timezone
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  
  const opts = { day: 'numeric', month: 'short' };
  if (includeYear) opts.year = 'numeric';
  
  return date.toLocaleDateString('fr-FR', opts);
}
