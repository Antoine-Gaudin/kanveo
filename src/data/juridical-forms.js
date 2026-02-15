// src/data/juridical-forms.js
// Mapping des catégories juridiques françaises (codes INSEE)

export const JURIDICAL_FORMS = {
  "0000": "OPCVM (Organisme de placement collectif en valeurs mobilières sans personnalité morale)",
  "1000": "EI (Entrepreneur individuel)",
  "2000": "Indivision (Indivision)",
  "2400": "Fiducie (Fiducie)",
  "2800": "Assujetti TVA (Assujetti unique à la TVA)",
  "3210": "SCI (Société civile immobilière)",
  "3270": "SCP (Société civile professionnelle)",
  "3290": "Société civile (Autre société civile)",
  "3310": "GAEC (Groupement agricole d'exploitation en commun)",
  "3470": "Société civile d'attribution (Société civile d'attribution)",
  "3490": "SCI autre (Autre société civile immobilière)",
  "3580": "GIE (Groupement d'intérêt économique)",
  "4110": "Congrégation (Congrégation / ordre religieux)",
  "5110": "SNC (Société en nom collectif)",
  "5120": "SCS (Société en commandite simple)",
  "5130": "SCA (Société en commandite par actions)",
  "5310": "SLP (Société en libre partenariat)",
  "5370": "SPFPL SCA (Société de participations financières de professions libérales – SCA)",
  "5410": "SARL (Société à responsabilité limitée)",
  "5458": "SCOP SARL (SARL coopérative de production)",
  "5470": "SPFPL SARL (Société de participations financières de professions libérales – SARL)",
  "5520": "SA CA (Société anonyme à conseil d'administration)",
  "5570": "SPFPL SA CA (Société de participations financières de professions libérales – SA à CA)",
  "5620": "SA Directoire (Société anonyme à directoire)",
  "5670": "SPFPL SA Directoire (Société de participations financières de professions libérales – SA à directoire)",
  "5710": "SAS (Société par actions simplifiée)",
  "5720": "SASU (Société par actions simplifiée unipersonnelle)",
  "5770": "SPFPL SAS (Société de participations financières de professions libérales – SAS)",
  "5785": "SELAS (Société d'exercice libéral par actions simplifiée)",
  "5790": "SELARL (Société d'exercice libéral à responsabilité limitée)",
  "5800": "SE (Société européenne)",
  "6110": "Mutuelle (Mutuelle)",
  "6511": "SISA (Société interprofessionnelle de soins ambulatoires)",
  "6544": "SCI accession progressive (Société civile immobilière d'accession progressive à la propriété)",
  "6901": "Personne RCS (Autres personnes de droit privé inscrites au RCS)",
  "7112": "AAI (Autorité administrative ou publique indépendante)",
  "7210": "Commune (Commune et commune nouvelle)",
  "7225": "Collectivité Outre-Mer (Collectivité et territoire d'Outre-Mer)",
  "7340": "Pôle métropolitain (Pôle métropolitain)",
  "7344": "Métropole (Métropole)",
  "7354": "Syndicat mixte fermé (Syndicat mixte fermé)",
  "7355": "Syndicat mixte ouvert (Syndicat mixte ouvert)",
  "7357": "PETR (Pôle d'équilibre territorial et rural)",
  "7367": "CIAS (Centre intercommunal d'action sociale)",
  "7372": "SDIS (Service départemental d'incendie et de secours)",
  "8110": "Fondation (Fondation)",
  "8310": "CSE entreprise (Comité social et économique d'entreprise)",
  "8311": "CSE établissement (Comité social et économique d'établissement)",
  "9220": "Association (Association déclarée)",
  "9224": "Association d'avocats (Association d'avocats à responsabilité professionnelle individuelle)",
  "9300": "Fondation reconnue (Fondation reconnue d'utilité publique)",
  "9970": "GCS privé (Groupement de coopération sanitaire à gestion privée)"
};

/**
 * Récupère le libellé d'une forme juridique à partir de son code
 * @param {string} code - Code de la catégorie juridique
 * @returns {string} Libellé de la forme juridique
 */
export function getJuridicalFormLabel(code) {
  if (!code) return "Forme juridique pas encore connue";
  return JURIDICAL_FORMS[code] || "Forme juridique pas encore connue";
}

/**
 * Récupère le sigle court d'une forme juridique (ex: "SARL" depuis "SARL (Société à responsabilité limitée)")
 * @param {string} code - Code de la catégorie juridique
 * @returns {string} Sigle court
 */
export function getJuridicalFormShort(code) {
  const fullLabel = getJuridicalFormLabel(code);
  return fullLabel.split("(")[0].trim();
}
