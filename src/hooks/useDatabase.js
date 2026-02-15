// src/hooks/useDatabase.js
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { DatabaseService } from "../services/databaseService";

// ==================== DEFAULT COLUMN CONFIG ====================

const DEFAULT_COLUMNS = [
  { id: "name", label: "Nom", type: "text", enabled: true },
  { id: "company", label: "Entreprise", type: "text", enabled: true },
  { id: "email", label: "Email", type: "email", enabled: true },
  { id: "phone", label: "Telephone", type: "phone", enabled: true },
  { id: "address", label: "Adresse", type: "text", enabled: true },
  { id: "city", label: "Ville", type: "text", enabled: true },
  { id: "postal_code", label: "Code postal", type: "text", enabled: true },
  { id: "siret", label: "SIRET", type: "text", enabled: false },
  { id: "website", label: "Site web", type: "url", enabled: false },
  { id: "job_title", label: "Poste", type: "text", enabled: false },
  { id: "notes", label: "Notes", type: "text", enabled: true },
];

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

function detectEncoding(buffer) {
  const bytes = new Uint8Array(buffer);
  // UTF-8 BOM
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return "utf-8";
  // UTF-16 LE BOM
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return "utf-16le";
  // UTF-16 BE BOM
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return "utf-16be";
  // Check for corrupted characters (common in Latin-1 misread as UTF-8)
  let hasHighBytes = false;
  for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
    if (bytes[i] > 127) { hasHighBytes = true; break; }
  }
  if (hasHighBytes) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      return "utf-8";
    } catch {
      return "windows-1252";
    }
  }
  return "utf-8";
}

function csvTextToObjects(buffer) {
  const encoding = detectEncoding(buffer);
  let text = new TextDecoder(encoding).decode(buffer);

  if (!text || text.trim() === "") return [];
  // Strip BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const delim = detectDelimiter(text);
  const aoa = parseCSVWith(text, delim);
  if (!aoa.length) return [];

  const headers = aoa[0].map((h, i) => {
    const trimmed = String(h || "").trim();
    return trimmed || `COL_${i + 1}`;
  });
  if (headers.every(h => h.startsWith("COL_"))) return [];

  const out = [];
  for (let r = 1; r < aoa.length; r++) {
    const o = {};
    const row = aoa[r];
    let hasData = false;
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      const val = row[c] ?? "";
      o[key] = val;
      if (String(val).trim()) hasData = true;
    }
    if (hasData) out.push(o);
  }
  return out;
}

// ==================== COLUMN MAPPING ====================

const AUTO_DETECT_PATTERNS = {
  name: ["nom", "name", "contact", "prenom", "lastname", "firstname", "nom_client", "nom client", "identite", "responsable"],
  company: ["entreprise", "societe", "company", "raison_sociale", "raison sociale", "denomination", "organisation", "org", "enseigne"],
  email: ["email", "mail", "courriel", "e-mail", "e_mail", "adresse_mail", "adresse mail", "contact_email"],
  phone: ["telephone", "tel", "phone", "mobile", "portable", "num_tel", "numero", "fixe", "gsm"],
  address: ["adresse", "address", "rue", "localisation", "location", "lieu"],
  city: ["ville", "city", "commune", "localite"],
  postal_code: ["code_postal", "cp", "zip", "zipcode", "code postal", "postal"],
  siret: ["siret", "siren", "numero_siret", "n_siret"],
  website: ["site", "site_web", "website", "url", "web", "site internet"],
  job_title: ["poste", "fonction", "job", "title", "job_title", "role", "metier", "intitule"],
  notes: ["notes", "note", "commentaire", "commentaires", "remarque", "remarques", "observation", "description", "info", "infos"],
};

function autoDetectMapping(fileHeaders) {
  const mapping = {};

  for (const header of fileHeaders) {
    const normalized = header.toLowerCase().trim().replace(/[_\-\.]/g, " ");

    for (const [fieldId, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
      if (Object.values(mapping).includes(fieldId)) continue;
      for (const pattern of patterns) {
        if (normalized === pattern || normalized.includes(pattern)) {
          mapping[header] = fieldId;
          break;
        }
      }
      if (mapping[header]) break;
    }

    if (!mapping[header]) {
      mapping[header] = "__ignore__";
    }
  }

  return mapping;
}

/**
 * Compute mapping confidence: 'exact' | 'partial' | 'none'
 */
function getMappingConfidence(header, fieldId) {
  if (fieldId === "__ignore__") return "none";
  const patterns = AUTO_DETECT_PATTERNS[fieldId];
  if (!patterns) return "none";
  const normalized = header.toLowerCase().trim().replace(/[_\-\.]/g, " ");
  for (const pattern of patterns) {
    if (normalized === pattern) return "exact";
  }
  for (const pattern of patterns) {
    if (normalized.includes(pattern)) return "partial";
  }
  return "none";
}

function applyMapping(rows, mapping) {
  return rows.map((row) => {
    const data = {};
    const raw = { ...row };

    for (const [fileCol, kanveoField] of Object.entries(mapping)) {
      if (kanveoField === "__ignore__") continue;
      if (data[kanveoField] && row[fileCol]) {
        data[kanveoField] += " " + String(row[fileCol]).trim();
      } else {
        data[kanveoField] = String(row[fileCol] || "").trim();
      }
    }

    return { data, raw };
  });
}

function detectDuplicateEmails(rows) {
  const emailCounts = {};
  for (const row of rows) {
    const email = Object.values(row).find(v => {
      const s = String(v || "").trim().toLowerCase();
      return s.includes("@") && s.includes(".");
    });
    if (email) {
      const normalized = String(email).trim().toLowerCase();
      emailCounts[normalized] = (emailCounts[normalized] || 0) + 1;
    }
  }
  return Object.entries(emailCounts)
    .filter(([, count]) => count > 1)
    .map(([email, count]) => ({ email, count }));
}

// ==================== LOCALSTORAGE KEYS (for migration) ====================

const LS_COLUMNS = "kanveo_db_columns";
const LS_DATA = "kanveo_db_data";
const LS_FILES = "kanveo_db_files";
const LS_MIGRATED = "kanveo_db_migrated_to_supabase";

// ==================== BATCH INSERT ====================

const BATCH_SIZE = 500;

async function batchInsert(rows, onProgress) {
  const results = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const inserted = await DatabaseService.insertRows(batch);
    results.push(...inserted);
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, rows.length), rows.length);
    }
  }
  return results;
}

// ==================== MAIN HOOK ====================

export default function useDatabase(userId, workspaceId = null) {
  const qc = useQueryClient();
  const fileRef = useRef(null);

  // Transient UI state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [pendingHeaders, setPendingHeaders] = useState([]);
  const [pendingMapping, setPendingMapping] = useState({});
  const [pendingFileName, setPendingFileName] = useState("");
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);

  // Server-side pagination/search/filter
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeImportFilter, setActiveImportFilter] = useState(null);

  // Import progress
  const [importProgress, setImportProgress] = useState(null); // { current, total }

  // Migration state
  const [migrationDone, setMigrationDone] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [activeImportFilter]);

  // ==================== QUERIES ====================

  // Column config
  const configQueryKey = ["database", "config", userId];
  const { data: configData } = useQuery({
    queryKey: configQueryKey,
    queryFn: () => DatabaseService.getColumnConfig(userId),
    enabled: !!userId,
  });

  const columnConfig = useMemo(() => {
    if (configData?.columns && Array.isArray(configData.columns) && configData.columns.length > 0) {
      return configData.columns;
    }
    return DEFAULT_COLUMNS;
  }, [configData]);

  const enabledColumns = useMemo(() => {
    return columnConfig.filter(c => c.enabled);
  }, [columnConfig]);

  // Imports
  const importsQueryKey = ["database", "imports", userId, workspaceId];
  const { data: imports = [] } = useQuery({
    queryKey: importsQueryKey,
    queryFn: () => DatabaseService.getImports(userId, workspaceId),
    enabled: !!userId,
  });

  // Rows (paginated)
  const rowsQueryKey = ["database", "rows", userId, workspaceId, page, debouncedSearch, activeImportFilter];
  const { data: rows = [], isLoading: rowsLoading } = useQuery({
    queryKey: rowsQueryKey,
    queryFn: () => DatabaseService.getRows(userId, workspaceId, {
      page,
      pageSize,
      search: debouncedSearch,
      importId: activeImportFilter,
    }),
    enabled: !!userId,
  });

  // Total count
  const countQueryKey = ["database", "count", userId, workspaceId, debouncedSearch, activeImportFilter];
  const { data: totalCount = 0 } = useQuery({
    queryKey: countQueryKey,
    queryFn: () => DatabaseService.getRowCount(userId, workspaceId, {
      search: debouncedSearch,
      importId: activeImportFilter,
    }),
    enabled: !!userId,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // ==================== COLUMN CONFIG ====================

  const saveColumnConfig = useCallback(async (columns) => {
    try {
      const result = await DatabaseService.saveColumnConfig(userId, columns);
      qc.setQueryData(configQueryKey, result);
      return result;
    } catch (error) {
      throw error;
    }
  }, [userId, qc, configQueryKey]);

  // ==================== FILE IMPORT ====================

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setPendingData(null);
    setDuplicateWarnings([]);

    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let rawRows = [];

      if (ext === "csv" || ext === "txt") {
        const buffer = await file.arrayBuffer();
        rawRows = csvTextToObjects(buffer);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
      } else {
        throw new Error("Format non supporte. Utilisez CSV, XLSX ou XLS.");
      }

      if (!rawRows.length) {
        throw new Error("Le fichier est vide ou ne contient aucune donnee.");
      }

      const headers = Object.keys(rawRows[0]);
      const autoMapping = autoDetectMapping(headers);
      const duplicates = detectDuplicateEmails(rawRows);

      setPendingData(rawRows);
      setPendingHeaders(headers);
      setPendingMapping(autoMapping);
      setPendingFileName(file.name);
      setDuplicateWarnings(duplicates);
    } catch (err) {
      setImportError(err.message || "Erreur lors de l'import du fichier");
    } finally {
      setIsImporting(false);
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!pendingData || !pendingMapping || !userId) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: pendingData.length });

    try {
      const mapped = applyMapping(pendingData, pendingMapping);

      // Create import record
      const importRecord = await DatabaseService.createImport(userId, workspaceId, {
        file_name: pendingFileName,
        row_count: mapped.length,
        mapping: pendingMapping,
      });

      // Prepare rows for insertion
      const dbRows = mapped.map(({ data, raw }) => ({
        user_id: userId,
        workspace_id: workspaceId || null,
        import_id: importRecord.id,
        data,
        raw_data: raw,
        is_pipelined: false,
      }));

      // Batch insert with progress
      await batchInsert(dbRows, (current, total) => {
        setImportProgress({ current, total });
      });

      // Invalidate queries
      qc.invalidateQueries({ queryKey: ["database", "rows"] });
      qc.invalidateQueries({ queryKey: ["database", "count"] });
      qc.invalidateQueries({ queryKey: ["database", "imports"] });

      // Reset pending
      setPendingData(null);
      setPendingHeaders([]);
      setPendingMapping({});
      setPendingFileName("");
      setDuplicateWarnings([]);
      setImportProgress(null);

      if (fileRef.current) fileRef.current.value = "";

      return mapped.length;
    } catch (err) {
      setImportError(err.message || "Erreur lors de l'import en base");
      setImportProgress(null);
      throw err;
    } finally {
      setIsImporting(false);
    }
  }, [pendingData, pendingMapping, pendingFileName, userId, workspaceId, qc]);

  const cancelImport = useCallback(() => {
    setPendingData(null);
    setPendingHeaders([]);
    setPendingMapping({});
    setPendingFileName("");
    setImportError(null);
    setDuplicateWarnings([]);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const updateMapping = useCallback((fileHeader, kanveoField) => {
    setPendingMapping(prev => ({
      ...prev,
      [fileHeader]: kanveoField,
    }));
  }, []);

  // ==================== DATA OPERATIONS ====================

  const deleteRow = useCallback(async (rowId) => {
    await DatabaseService.deleteRow(rowId);
    qc.invalidateQueries({ queryKey: ["database", "rows"] });
    qc.invalidateQueries({ queryKey: ["database", "count"] });
  }, [qc]);

  const deleteImport = useCallback(async (importId) => {
    await DatabaseService.deleteImport(importId);
    qc.invalidateQueries({ queryKey: ["database", "rows"] });
    qc.invalidateQueries({ queryKey: ["database", "count"] });
    qc.invalidateQueries({ queryKey: ["database", "imports"] });
    if (activeImportFilter === importId) {
      setActiveImportFilter(null);
    }
  }, [qc, activeImportFilter]);

  const clearAll = useCallback(async () => {
    // Delete all imports (CASCADE deletes rows)
    for (const imp of imports) {
      await DatabaseService.deleteImport(imp.id);
    }
    qc.invalidateQueries({ queryKey: ["database"] });
  }, [imports, qc]);

  const markAsPipelined = useCallback(async (rowIds) => {
    await DatabaseService.markAsPipelined(rowIds);
    qc.invalidateQueries({ queryKey: ["database", "rows"] });
  }, [qc]);

  const updateRowNote = useCallback(async (rowId, notes) => {
    await DatabaseService.updateRow(rowId, { notes });
    qc.invalidateQueries({ queryKey: ["database", "rows"] });
  }, [qc]);

  // ==================== EXPORT ====================

  const exportCSV = useCallback(async () => {
    const allRows = await DatabaseService.getAllFilteredRows(userId, workspaceId, {
      search: debouncedSearch,
      importId: activeImportFilter,
    });
    if (!allRows.length) return;

    const cols = enabledColumns;
    const headerLabels = [...cols.map(c => c.label), "Source"];
    const csvRows = allRows.map(r => {
      const values = cols.map(c => r.data?.[c.id] || "");
      // Find source from imports
      const imp = imports.find(i => i.id === r.import_id);
      values.push(imp?.file_name || "");
      return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headerLabels.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanveo-base-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [userId, workspaceId, debouncedSearch, activeImportFilter, enabledColumns, imports]);

  const exportXLSX = useCallback(async () => {
    const allRows = await DatabaseService.getAllFilteredRows(userId, workspaceId, {
      search: debouncedSearch,
      importId: activeImportFilter,
    });
    if (!allRows.length) return;

    const cols = enabledColumns;
    const data = allRows.map(r => {
      const obj = {};
      for (const c of cols) {
        obj[c.label] = r.data?.[c.id] || "";
      }
      const imp = imports.find(i => i.id === r.import_id);
      obj["Source"] = imp?.file_name || "";
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base");
    XLSX.writeFile(wb, `kanveo-base-${new Date().toISOString().split("T")[0]}.xlsx`);
  }, [userId, workspaceId, debouncedSearch, activeImportFilter, enabledColumns, imports]);

  // ==================== LOCALSTORAGE MIGRATION ====================

  useEffect(() => {
    if (!userId || migrationDone) return;

    const alreadyMigrated = localStorage.getItem(LS_MIGRATED);
    if (alreadyMigrated) {
      setMigrationDone(true);
      return;
    }

    const lsData = localStorage.getItem(LS_DATA);
    const lsFiles = localStorage.getItem(LS_FILES);
    if (!lsData && !lsFiles) {
      setMigrationDone(true);
      return;
    }

    let parsedData = [];
    let parsedFiles = [];
    try { parsedData = JSON.parse(lsData) || []; } catch { /* empty */ }
    try { parsedFiles = JSON.parse(lsFiles) || []; } catch { /* empty */ }

    if (parsedData.length === 0) {
      localStorage.setItem(LS_MIGRATED, "true");
      setMigrationDone(true);
      return;
    }

    // Check if Supabase already has data
    (async () => {
      try {
        const existingCount = await DatabaseService.getRowCount(userId, workspaceId);
        if (existingCount > 0) {
          localStorage.setItem(LS_MIGRATED, "true");
          setMigrationDone(true);
          return;
        }

        // Migrate column config
        const lsColumns = localStorage.getItem(LS_COLUMNS);
        if (lsColumns) {
          try {
            const parsedCols = JSON.parse(lsColumns);
            if (Array.isArray(parsedCols) && parsedCols.length > 0) {
              // Convert old string[] format to new object[] format
              const newCols = DEFAULT_COLUMNS.map(dc => ({
                ...dc,
                enabled: parsedCols.some(old =>
                  String(old).toLowerCase().trim() === dc.label.toLowerCase().trim() ||
                  String(old).toLowerCase().trim() === dc.id.toLowerCase().trim()
                ) ? true : dc.enabled,
              }));
              await DatabaseService.saveColumnConfig(userId, newCols);
            }
          } catch { /* ignore */ }
        }

        // Create a single migration import
        const importRecord = await DatabaseService.createImport(userId, workspaceId, {
          file_name: "Migration localStorage",
          row_count: parsedData.length,
          mapping: null,
        });

        // Convert old rows to new format
        const dbRows = parsedData.map(oldRow => {
          const data = {};
          const knownFields = ["name", "company", "email", "phone", "address", "notes"];
          for (const field of knownFields) {
            if (oldRow[field]) data[field] = oldRow[field];
          }

          const raw = oldRow.__raw || {};

          return {
            user_id: userId,
            workspace_id: workspaceId || null,
            import_id: importRecord.id,
            data,
            raw_data: raw,
            is_pipelined: oldRow.__addedToPipeline || false,
            notes: oldRow.notes || null,
          };
        });

        await batchInsert(dbRows, () => {});

        // Clear localStorage
        localStorage.removeItem(LS_DATA);
        localStorage.removeItem(LS_FILES);
        localStorage.removeItem(LS_COLUMNS);
        localStorage.setItem(LS_MIGRATED, "true");

        // Refresh queries
        qc.invalidateQueries({ queryKey: ["database"] });

        setMigrationDone(true);
        setMigrationMessage("Donnees migrees avec succes depuis le stockage local !");
      } catch (err) {
        console.error("[useDatabase] Migration failed:", err);
        setMigrationDone(true);
      }
    })();
  }, [userId, workspaceId, migrationDone, qc]);

  // Clear migration message after 5s
  useEffect(() => {
    if (migrationMessage) {
      const t = setTimeout(() => setMigrationMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [migrationMessage]);

  return {
    // Column config
    columnConfig,
    enabledColumns,
    saveColumnConfig,
    DEFAULT_COLUMNS,

    // File import
    fileRef,
    handleFile,
    isImporting,
    importError,
    importProgress,

    // Mapping step
    pendingData,
    pendingHeaders,
    pendingMapping,
    pendingFileName,
    duplicateWarnings,
    updateMapping,
    confirmImport,
    cancelImport,
    getMappingConfidence,
    AUTO_DETECT_PATTERNS,

    // Data
    rows,
    totalCount,
    loading: rowsLoading,
    imports,

    // Data operations
    deleteRow,
    deleteImport,
    clearAll,
    markAsPipelined,
    updateRowNote,

    // Pagination
    page,
    setPage,
    pageSize,
    totalPages,

    // Search / Filter
    searchTerm,
    setSearchTerm,
    activeImportFilter,
    setActiveImportFilter,

    // Export
    exportCSV,
    exportXLSX,

    // Migration
    migrationMessage,
  };
}
