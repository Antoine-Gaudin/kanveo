// src/utils/date-formatter.js
// Utilitaires pour formater les dates

/**
 * Formate une date au format jj/mm/aaaa depuis un format YYYY-MM-DD
 * @param {string} dateString - Date au format YYYY-MM-DD
 * @returns {string} Date formatée au format jj/mm/aaaa
 */
export function formatDate(dateString) {
  if (!dateString) return "";

  // Extraire la partie date YYYY-MM-DD (gère aussi les ISO comme "2026-02-15T10:30:00.000Z")
  const dateOnly = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  }

  return dateString;
}

/**
 * Formate une date ISO en format français lisible
 * @param {string} isoString - Date au format ISO (2024-01-15T10:30:00.000Z)
 * @returns {string} Date formatée (15/01/2024)
 */
export function formatDateFromISO(isoString) {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return isoString;
  }
}

/**
 * Formate une date ISO en format français avec heure
 * @param {string} isoString - Date au format ISO
 * @returns {string} Date et heure formatées (15/01/2024 à 10:30)
 */
export function formatDateTime(isoString) {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  } catch (error) {
    return isoString;
  }
}

/**
 * Calcule le nombre de jours entre deux dates
 * @param {string|Date} date1 - Première date
 * @param {string|Date} date2 - Deuxième date (par défaut: aujourd'hui)
 * @returns {number} Nombre de jours entre les deux dates
 */
export function daysBetween(date1, date2 = new Date()) {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Formate une date de manière relative (il y a X jours)
 * @param {string|Date} date - Date à formater
 * @returns {string} Texte relatif (ex: "il y a 3 jours", "aujourd'hui")
 */
export function formatRelativeDate(date) {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now - target;
  const isFuture = diffMs < 0;
  const days = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

  if (days === 0) return "aujourd'hui";

  if (isFuture) {
    if (days === 1) return "demain";
    if (days < 7) return `dans ${days} jours`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `dans ${weeks} semaine${weeks > 1 ? "s" : ""}`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `dans ${months} mois`;
    }
    const years = Math.floor(days / 365);
    return `dans ${years} an${years > 1 ? "s" : ""}`;
  }

  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `il y a ${months} mois`;
  }

  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

/**
 * Convertit une date du format DD/MM/YYYY vers YYYY-MM-DD (format SQL)
 * @param {string} dateStr - Date au format DD/MM/YYYY ou déjà YYYY-MM-DD
 * @returns {string|null} Date au format YYYY-MM-DD ou null si invalide
 */
export function convertDateFormat(dateStr) {
  if (!dateStr) return null;

  // Si format DD/MM/YYYY
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    if (day && month && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  // Si déjà au bon format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return null;
}
