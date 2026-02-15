// src/components/database/useLocalDatabase.js
import { useState, useRef, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";

// ==================== PARSING HELPERS ====================

function detectDelimiter(text) {
  const candidates = [";", ",", "\t", "|"];
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "").slice(0, 10);
  let best = { d: ",", score: -1 };

  for (const d of candidates) {
    let score = 0;
    for (const line of lines) {
      let inQ = false, count = 0;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQ = !inQ;
        else if (!inQ && c === d) count++;
      }
      score += count;
    }
    if (score > best.score) best = { d, score };
  }
  return best.d;
}

function parseCSVWith(text, delimiter) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQ && next === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (!inQ && (c === "\n" || (c === "\r" && next !== "\n"))) {
      row.push(cur); rows.push(row);
      row = []; cur = "";
    } else if (!inQ && c === delimiter) {
      row.push(cur); cur = "";
    } else if (c === "\r" && next === "\n") {
      // skip
    } else {
      cur += c;
    }
  }
  row.push(cur); rows.push(row);
  if (rows.length && rows[rows.length - 1].every((v) => v === "")) rows.pop();
  return rows;
}

function csvTextToObjects(text) {
  if (!text || text.trim() === "") return [];
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const delim = detectDelimiter(text);
  const aoa = parseCSVWith(text, delim);
  if (!aoa.length) return [];
  const headers = aoa[0].map((h) => String(h || "").trim());
  if (headers.every(h => !h)) return [];
  const out = [];
  for (let r = 1; r < aoa.length; r++) {
    const o = {};
    const row = aoa[r];
    let hasData = false;
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] || `COL_${c + 1}`;
      const val = row[c] ?? "";
      o[key] = val;
      if (val.trim()) hasData = true;
    }
    if (hasData) out.push(o);
  }
  return out;
}

// ==================== COLUMN MAPPING ====================

// Champs Kanveo normalisés
const KANVEO_FIELDS = [
  { id: "name", label: "Nom" },
  { id: "company", label: "Entreprise" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Téléphone" },
  { id: "address", label: "Adresse" },
  { id: "notes", label: "Notes" },
];

// Patterns pour l'auto-détection
const AUTO_DETECT_PATTERNS = {
  name: ["nom", "name", "contact", "prénom", "prenom", "lastname", "firstname", "nom_client", "nom client", "identité", "identite", "responsable"],
  company: ["entreprise", "société", "societe", "company", "raison_sociale", "raison sociale", "denomination", "organisation", "org", "enseigne"],
  email: ["email", "mail", "courriel", "e-mail", "e_mail", "adresse_mail", "adresse mail", "contact_email"],
  phone: ["telephone", "téléphone", "tel", "phone", "mobile", "portable", "num_tel", "numéro", "numero", "fixe", "gsm"],
  address: ["adresse", "address", "ville", "city", "code_postal", "cp", "rue", "localisation", "location", "lieu"],
  notes: ["notes", "note", "commentaire", "commentaires", "remarque", "remarques", "observation", "description", "info", "infos"],
};

/**
 * Auto-detect le mapping entre les colonnes du fichier et les champs Kanveo
 */
function autoDetectMapping(fileHeaders) {
  const mapping = {};

  for (const header of fileHeaders) {
    const normalized = header.toLowerCase().trim().replace(/[_\-\.]/g, " ");

    for (const [fieldId, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
      // Si ce champ est déjà mappé, skip
      if (Object.values(mapping).includes(fieldId)) continue;

      for (const pattern of patterns) {
        if (normalized === pattern || normalized.includes(pattern)) {
          mapping[header] = fieldId;
          break;
        }
      }
      if (mapping[header]) break;
    }

    // Si rien trouvé, marquer comme "ignore"
    if (!mapping[header]) {
      mapping[header] = "__ignore__";
    }
  }

  return mapping;
}

/**
 * Applique le mapping pour normaliser les données
 */
function applyMapping(rows, mapping) {
  return rows.map((row, index) => {
    const mapped = { __id: index, __raw: { ...row } };

    for (const [fileCol, kanveoField] of Object.entries(mapping)) {
      if (kanveoField === "__ignore__") continue;
      // Si on a déjà une valeur pour ce champ, concaténer (ex: prénom + nom)
      if (mapped[kanveoField] && row[fileCol]) {
        mapped[kanveoField] += " " + String(row[fileCol]).trim();
      } else {
        mapped[kanveoField] = String(row[fileCol] || "").trim();
      }
    }

    return mapped;
  });
}

// ==================== COLUMN CONFIG ====================

const STORAGE_KEY_COLUMNS = "kanveo_db_columns";
const STORAGE_KEY_DATA = "kanveo_db_data";
const STORAGE_KEY_FILES = "kanveo_db_files";

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : fallback;
    return parsed;
  } catch (err) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
  }
}

// ==================== MAIN HOOK ====================

export default function useLocalDatabase() {
  const fileRef = useRef(null);

  // Configuration des colonnes utilisateur
  const [userColumns, setUserColumns] = useState(() =>
    loadFromStorage(STORAGE_KEY_COLUMNS, [])
  );

  // Fichiers importés (métadonnées)
  const [importedFiles, setImportedFiles] = useState(() =>
    loadFromStorage(STORAGE_KEY_FILES, [])
  );

  // Données importées (toutes les lignes, toutes sources confondues)
  const [allRows, setAllRows] = useState(() =>
    loadFromStorage(STORAGE_KEY_DATA, [])
  );

  // État UI
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [pendingData, setPendingData] = useState(null); // Données en attente de mapping
  const [pendingHeaders, setPendingHeaders] = useState([]); // Headers du fichier uploadé
  const [pendingMapping, setPendingMapping] = useState({}); // Mapping en cours
  const [pendingFileName, setPendingFileName] = useState("");

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFileFilter, setActiveFileFilter] = useState("all");

  // ==================== COLUMN CONFIG ====================

  /**
   * Parse la chaîne de colonnes (auto-détecte , ou ;)
   */
  const parseColumnString = useCallback((str) => {
    if (!str || !str.trim()) return [];
    const separator = str.includes(";") ? ";" : ",";
    return str.split(separator)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }, []);

  /**
   * Sauvegarde la config des colonnes
   */
  const saveColumns = useCallback((columnString) => {
    const columns = typeof columnString === "string"
      ? parseColumnString(columnString)
      : columnString;
    setUserColumns(columns);
    saveToStorage(STORAGE_KEY_COLUMNS, columns);
    return columns;
  }, [parseColumnString]);

  // ==================== FILE IMPORT ====================

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setPendingData(null);

    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let rawRows = [];

      if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        rawRows = csvTextToObjects(text);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
      } else {
        throw new Error("Format non supporté. Utilisez CSV, XLSX ou XLS.");
      }
      if (!rawRows.length) {
        throw new Error("Le fichier est vide ou ne contient aucune donnée.");
      }

      // Récupérer les headers
      const headers = Object.keys(rawRows[0]);
      // Auto-détecter le mapping
      const autoMapping = autoDetectMapping(headers);
      // Stocker en attente pour que l'utilisateur valide le mapping
      setPendingData(rawRows);
      setPendingHeaders(headers);
      setPendingMapping(autoMapping);
      setPendingFileName(file.name);
    } catch (err) {
      setImportError(err.message || "Erreur lors de l'import du fichier");
    } finally {
      setIsImporting(false);
    }
  }, []);

  /**
   * Confirme le mapping et importe les données
   */
  const confirmImport = useCallback(() => {
    if (!pendingData || !pendingMapping) {
      return;
    }

    const mapped = applyMapping(pendingData, pendingMapping);
    // Ajouter les métadonnées de source
    const fileId = Date.now().toString();
    const enriched = mapped.map((row, i) => ({
      ...row,
      __id: `${fileId}_${i}`,
      __source: pendingFileName,
      __fileId: fileId,
      __addedToPipeline: false,
    }));

    const newRows = [...allRows, ...enriched];
    setAllRows(newRows);
    saveToStorage(STORAGE_KEY_DATA, newRows);

    // Enregistrer le fichier
    const newFile = {
      id: fileId,
      name: pendingFileName,
      rowCount: enriched.length,
      importedAt: new Date().toISOString(),
      mapping: pendingMapping,
    };
    const newFiles = [...importedFiles, newFile];
    setImportedFiles(newFiles);
    saveToStorage(STORAGE_KEY_FILES, newFiles);
    // Reset pending
    setPendingData(null);
    setPendingHeaders([]);
    setPendingMapping({});
    setPendingFileName("");

    // Reset file input
    if (fileRef.current) fileRef.current.value = "";

    return enriched.length;
  }, [pendingData, pendingMapping, pendingFileName, allRows, importedFiles]);

  /**
   * Annule l'import en cours
   */
  const cancelImport = useCallback(() => {
    setPendingData(null);
    setPendingHeaders([]);
    setPendingMapping({});
    setPendingFileName("");
    setImportError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  /**
   * Met à jour le mapping d'une colonne
   */
  const updateMapping = useCallback((fileHeader, kanveoField) => {
    setPendingMapping(prev => ({
      ...prev,
      [fileHeader]: kanveoField,
    }));
  }, []);

  // ==================== DATA OPERATIONS ====================

  const deleteRow = useCallback((rowId) => {
    const newRows = allRows.filter(r => r.__id !== rowId);
    setAllRows(newRows);
    saveToStorage(STORAGE_KEY_DATA, newRows);
  }, [allRows]);

  const deleteFile = useCallback((fileId) => {
    const newRows = allRows.filter(r => r.__fileId !== fileId);
    setAllRows(newRows);
    saveToStorage(STORAGE_KEY_DATA, newRows);

    const newFiles = importedFiles.filter(f => f.id !== fileId);
    setImportedFiles(newFiles);
    saveToStorage(STORAGE_KEY_FILES, newFiles);
  }, [allRows, importedFiles]);

  const clearAll = useCallback(() => {
    setAllRows([]);
    setImportedFiles([]);
    saveToStorage(STORAGE_KEY_DATA, []);
    saveToStorage(STORAGE_KEY_FILES, []);
  }, []);

  const markAsPipelined = useCallback((rowIds) => {
    const idSet = new Set(rowIds);
    const newRows = allRows.map(r =>
      idSet.has(r.__id) ? { ...r, __addedToPipeline: true } : r
    );
    setAllRows(newRows);
    saveToStorage(STORAGE_KEY_DATA, newRows);
  }, [allRows]);

  const updateRowNote = useCallback((rowId, notes) => {
    const newRows = allRows.map(r =>
      r.__id === rowId ? { ...r, notes } : r
    );
    setAllRows(newRows);
    saveToStorage(STORAGE_KEY_DATA, newRows);
  }, [allRows]);

  // ==================== FILTERED DATA ====================

  const filteredRows = useMemo(() => {
    let result = allRows;

    // Filtre par fichier source
    if (activeFileFilter !== "all") {
      result = result.filter(r => r.__fileId === activeFileFilter);
    }

    // Recherche textuelle
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        (row.name || "").toLowerCase().includes(term) ||
        (row.company || "").toLowerCase().includes(term) ||
        (row.email || "").toLowerCase().includes(term) ||
        (row.phone || "").toLowerCase().includes(term) ||
        (row.address || "").toLowerCase().includes(term) ||
        (row.notes || "").toLowerCase().includes(term)
      );
    }

    return result;
  }, [allRows, activeFileFilter, searchTerm]);

  // ==================== EXPORT ====================

  const exportCSV = useCallback(() => {
    if (!filteredRows.length) return;

    const headers = ["Nom", "Entreprise", "Email", "Téléphone", "Adresse", "Notes", "Source"];
    const csvRows = filteredRows.map(r => [
      r.name || "",
      r.company || "",
      r.email || "",
      r.phone || "",
      r.address || "",
      r.notes || "",
      r.__source || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanveo-base-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRows]);

  const exportXLSX = useCallback(() => {
    if (!filteredRows.length) return;

    const data = filteredRows.map(r => ({
      Nom: r.name || "",
      Entreprise: r.company || "",
      Email: r.email || "",
      Téléphone: r.phone || "",
      Adresse: r.address || "",
      Notes: r.notes || "",
      Source: r.__source || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base");
    XLSX.writeFile(wb, `kanveo-base-${new Date().toISOString().split("T")[0]}.xlsx`);
  }, [filteredRows]);

  return {
    // Column config
    userColumns,
    saveColumns,
    parseColumnString,
    KANVEO_FIELDS,

    // File import
    fileRef,
    handleFile,
    isImporting,
    importError,

    // Mapping step
    pendingData,
    pendingHeaders,
    pendingMapping,
    pendingFileName,
    updateMapping,
    confirmImport,
    cancelImport,

    // Data
    allRows,
    filteredRows,
    importedFiles,

    // Data operations
    deleteRow,
    deleteFile,
    clearAll,
    markAsPipelined,
    updateRowNote,

    // Filters
    searchTerm,
    setSearchTerm,
    activeFileFilter,
    setActiveFileFilter,

    // Export
    exportCSV,
    exportXLSX,
  };
}
