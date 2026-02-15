// src/utils/sirene-formatter.js
// Utilitaires pour formater les données SIRENE

import apeCodesData from "../data/ape_codes.json";

/**
 * Formate un numéro SIRET en corrigeant la notation scientifique
 * @param {string|number} siret - SIRET à formater
 * @returns {string} SIRET formaté sur 14 caractères
 */
export function formatSiret(siret) {
  if (!siret) return "";

  // Convertir en string si ce n'est pas déjà
  let siretStr = typeof siret === "string" ? siret : String(siret);

  // Si c'est en notation scientifique (ex: 1.23E+13 ou 1.23e+13), le convertir
  if (/[eE]/.test(siretStr)) {
    try {
      // BigInt gère les grands entiers sans perte de précision
      siretStr = BigInt(Math.round(Number(siret))).toString();
    } catch {
      // Fallback si BigInt échoue
      siretStr = Number(siret).toFixed(0);
    }
  }

  // Nettoyer et padder
  return siretStr.replace(/\s/g, "").padStart(14, "0");
}

/**
 * Construit une adresse complète à partir des champs SIRENE
 * @param {Object} data - Objet contenant les champs d'adresse
 * @param {Function} getField - Fonction pour récupérer un champ
 * @returns {string} Adresse complète
 */
export function buildFullAddress(data, getField) {
  const parts = [
    getField("complementAdresseEtablissement"),
    getField("numeroVoieEtablissement"),
    getField("typeVoieEtablissement"),
    getField("libelleVoieEtablissement"),
    getField("codePostalEtablissement"),
    getField("libelleCommuneEtablissement")
  ].filter(p => p && p.trim() !== "");

  return parts.join(" ");
}

/**
 * Construit le nom complet d'une personne à partir des champs SIRENE
 * @param {Object} data - Objet contenant les champs de personne
 * @param {Function} getField - Fonction pour récupérer un champ
 * @returns {string} Nom complet de la personne
 */
export function buildPersonFullName(data, getField) {
  const sexe = getField("sexeUniteLegale");
  const nomUsage = getField("nomUsageUniteLegale") || getField("nomUniteLegale") || "";
  const prenomUsuel = getField("prenomUsuelUniteLegale") || "";
  const prenom2 = getField("prenom2UniteLegale") || "";
  const prenom3 = getField("prenom3UniteLegale") || "";
  const prenom4 = getField("prenom4UniteLegale") || "";

  if (!nomUsage && !prenomUsuel) {
    return ""; // Pas de personne identifiée
  }

  let result = "";

  // Civilité
  if (sexe) {
    result += sexe === "M" ? "Mr " : sexe === "F" ? "Mme " : "";
  }

  // Nom d'usage ou nom principal
  result += nomUsage;

  // Prénom usuel
  if (prenomUsuel) {
    result += " " + prenomUsuel;
  }

  // Autres prénoms entre parenthèses
  const otherPrenoms = [prenom2, prenom3, prenom4].filter(p => p && p.trim()).join(", ");
  if (otherPrenoms) {
    result += ` (${otherPrenoms})`;
  }

  return result.trim();
}

/**
 * Récupère le libellé d'un code APE
 * @param {string} codeApe - Code APE (ex: "62.01Z")
 * @returns {string} Libellé du code APE
 */
export function getApeLabel(codeApe) {
  if (!codeApe) return "Code APE pas encore diffusé";
  const code = String(codeApe).trim();
  return apeCodesData[code] || "Code APE pas encore diffusé";
}

/**
 * Récupère la dénomination d'une entreprise (version insensible à la casse)
 * @param {Object} row - Ligne de données SIRENE
 * @param {Object} editedData - Données modifiées
 * @returns {string} Dénomination de l'entreprise
 */
export function getDenomination(row, editedData = {}) {
  // Chercher dans editedData d'abord (données modifiées)
  const editedKey = Object.keys(editedData).find(k =>
    k.toLowerCase().trim() === "denominationunitelegale"
  );
  if (editedKey) return editedData[editedKey];

  // Sinon chercher dans row (données originales)
  const rowKey = Object.keys(row).find(k =>
    k.toLowerCase().trim() === "denominationunitelegale"
  );
  return rowKey ? row[rowKey] : "";
}

/**
 * Crée un objet prospect à partir des données SIRENE
 * @param {Object} row - Ligne de données SIRENE
 * @param {Function} getField - Fonction pour récupérer un champ
 * @param {Object} editedData - Données modifiées
 * @returns {Object} Objet prospect formaté
 */
export function createProspectFromSireneRow(row, getField, editedData = {}) {
  return {
    // Identité - nom complet de la personne si disponible
    name: buildPersonFullName(row, getField),
    // Infos entreprise
    company: getDenomination(row, editedData) || getField("denomination") || "",
    siret: getField("siret") || getField("siretetablissement") || "",
    email: "",
    phone: "",
    // Infos SIRENE supplémentaires
    address: buildFullAddress(row, getField),
    juridicalForm: "", // À remplir avec getJuridicalFormShort
    activityCode: getField("activitePrincipaleEtablissement") || "",
    activityLabel: getApeLabel(getField("activitePrincipaleEtablissement")) || "",
    creationDate: "", // À formater avec formatDate
    notes: "",
    // Données SIRENE brutes
    sireneRaw: row,
  };
}
