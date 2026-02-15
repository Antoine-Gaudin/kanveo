// src/components/sirene/useSireneData.js
import { useState, useRef, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

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
  try {
    if (!text || text.trim() === "") {
      throw new Error("Le fichier est vide");
    }
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const delim = detectDelimiter(text);
    const aoa = parseCSVWith(text, delim);
    if (!aoa.length) return [];
    const headers = aoa[0].map((h) => String(h || "").trim());
    if (headers.every(h => !h)) {
      throw new Error("Aucun en-tête valide trouvé dans le fichier");
    }
    const out = [];
    for (let r = 1; r < aoa.length; r++) {
      const o = {};
      const row = aoa[r];
      for (let c = 0; c < headers.length; c++) {
        const key = headers[c] || `COL_${c + 1}`;
        o[key] = row[c] ?? "";
      }
      out.push(o);
    }
    return out;
  } catch (error) {
    throw error;
  }
}

function isSireneFile(normHeaders) {
  // Variantes de noms de colonnes SIRET
  const siretVariants = [
    "siret",
    "siretetablissement",
    "siren",
    "siretunitelegale",
    "numsiren",
    "numsiretetablissement",
    "siret_found",
    "numsiretetablissement",
  ];

  // Variantes de noms pour dénomination/raison sociale
  const denomVariants = [
    "denominationunitelegale",
    "denomination",
    "raisonsociale",
    "denominationubiquitaire",
    "nomunitelegale",
    "enseigne",
    "nomcommercial",
    "name_candidate",
    "name",
  ];

  // Variantes de noms pour activité
  const activityVariants = [
    "activiteprincipaleunitelegale",
    "activite",
    "codeape",
    "activiteprincipale",
    "naf",
    "nafu",
  ];

  // Variantes de noms pour téléphone/contact
  const contactVariants = [
    "phone",
    "phone_found",
    "telephone",
    "tel",
    "email",
    "contact",
  ];

  // Chercher si au moins une variante de chaque catégorie existe
  const hasSiret = normHeaders.some(h => siretVariants.some(v => h.includes(v)));
  const hasDenom = normHeaders.some(h => denomVariants.some(v => h.includes(v)));
  const hasActivity = normHeaders.some(h => activityVariants.some(v => h.includes(v)));
  const hasContact = normHeaders.some(h => contactVariants.some(v => h.includes(v)));

  // CRITÈRES FLEXIBLES:
  // 1. Si a SIRET + Denom = accepter (fichier SIRENE standard)
  if (hasSiret && hasDenom) return true;

  // 2. Si a SIRET + Contact = accepter (fichier SIRENE avec contact)
  if (hasSiret && hasContact) return true;

  // 3. Si a SIRET + Activity = accepter (fichier SIRENE avec activité)
  if (hasSiret && hasActivity) return true;

  // 4. Si a juste SIRET + n'importe quelle autre colonne utile = accepter
  if (hasSiret && (hasDenom || hasActivity || hasContact || normHeaders.length >= 3)) return true;

  // Sinon rejeter
  return false;
}

function formatSiretValue(siret) {
  if (!siret) return "";
  const siretStr = String(siret);
  if (siretStr.includes("E")) {
    const num = parseFloat(siret);
    return num.toFixed(0).padStart(14, "0");
  }
  return siretStr.replace(/\s/g, "").padStart(14, "0");
}

function normalizeSireneData(rows) {
  return rows.map(row => {
    const normalized = { ...row };
    // Formater les champs SIRET
    if (normalized.siret) {
      normalized.siret = formatSiretValue(normalized.siret);
    }
    if (normalized.siretetablissement) {
      normalized.siretetablissement = formatSiretValue(normalized.siretetablissement);
    }
    return normalized;
  });
}

export default function useSireneData() {
  const { user } = useAuth();

  // États pour les données
  const [rows, setRows] = useState([]);
  const [modalRow, setModalRowState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef(null);

  // Filtres persistants avec localStorage (préférences UI seulement)
  const [diffusionFilter, setDiffusionFilter] = useState(() => {
    try {
      if (!user?.id) return "both";
      return localStorage.getItem(`sirene_diffusionFilter_${user.id}`) || "both";
    } catch {
      return "both";
    }
  });

  const [sortOrder, setSortOrder] = useState(() => {
    try {
      if (!user?.id) return null;
      const saved = localStorage.getItem(`sirene_sortOrder_${user.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [juridicalFilters, setJuridicalFilters] = useState(() => {
    try {
      if (!user?.id) return [];
      const saved = localStorage.getItem(`sirene_juridicalFilters_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [hideND, setHideND] = useState(() => {
    try {
      if (!user?.id) return true;
      const saved = localStorage.getItem(`sirene_hideND_${user.id}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [showOnlyWithIdentity, setShowOnlyWithIdentity] = useState(() => {
    try {
      if (!user?.id) return false;
      const saved = localStorage.getItem(`sirene_showOnlyWithIdentity_${user.id}`);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [showOnlyWithCompany, setShowOnlyWithCompany] = useState(() => {
    try {
      if (!user?.id) return false;
      const saved = localStorage.getItem(`sirene_showOnlyWithCompany_${user.id}`);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Charger les données depuis Supabase au montage ou quand l'utilisateur change
  useEffect(() => {
    let isMounted = true;

    async function loadDataFromSupabase() {
      if (!user?.id) {
        if (isMounted) {
          setRows([]);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from('sirene_imports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (error) {
          setRows([]);
          setIsLoading(false);
          return;
        }

        // Convertir les données Supabase en format rows (data + note)
        const loadedRows = (data || []).map(item => ({
          ...item.data,
          __note: item.note || "",
          __id: item.id, // Garder l'ID Supabase pour les mises à jour
        }));

        setRows(loadedRows);
        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          setRows([]);
          setIsLoading(false);
        }
      }
    }

    loadDataFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Sauvegarder les filtres dans localStorage à chaque changement
  useEffect(() => {
    try {
      if (user?.id) {
        localStorage.setItem(`sirene_diffusionFilter_${user.id}`, diffusionFilter);
      }
    } catch {}
  }, [diffusionFilter, user?.id]);

  useEffect(() => {
    try {
      if (user?.id) {
        localStorage.setItem(`sirene_sortOrder_${user.id}`, JSON.stringify(sortOrder));
      }
    } catch {}
  }, [sortOrder, user?.id]);

  useEffect(() => {
    try {
      if (user?.id) {
        localStorage.setItem(`sirene_juridicalFilters_${user.id}`, JSON.stringify(juridicalFilters));
      }
    } catch {}
  }, [juridicalFilters, user?.id]);

  useEffect(() => {
    try {
      if (user?.id) {
        localStorage.setItem(`sirene_hideND_${user.id}`, JSON.stringify(hideND));
      }
    } catch {}
  }, [hideND, user?.id]);

  useEffect(() => {
    try {
      if (user?.id) {
        localStorage.setItem(`sirene_showOnlyWithIdentity_${user.id}`, JSON.stringify(showOnlyWithIdentity));
      }
    } catch {}
  }, [showOnlyWithIdentity, user?.id]);

  useEffect(() => {
    try {
      if (user?.id) {
        localStorage.setItem(`sirene_showOnlyWithCompany_${user.id}`, JSON.stringify(showOnlyWithCompany));
      }
    } catch {}
  }, [showOnlyWithCompany, user?.id]);

  // Vider les données quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!user?.id) {
      setRows([]);
      setModalRowState(null);
    }
  }, [user?.id]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      notify("❌ Vous devez être connecté pour importer des données.", "error");
      return;
    }

    // Validation de la taille du fichier (max 50 MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_FILE_SIZE) {
      notify(`❌ Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)} MB). Taille maximale : 50 MB.`, "error");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const isCSV = /\.csv$/i.test(file.name);
    const isXLSX = /\.(xlsx?|xls)$/i.test(file.name);

    if (!isCSV && !isXLSX) {
      notify("❌ Format de fichier non supporté. Veuillez utiliser un fichier CSV ou Excel (.xlsx, .xls).", "error");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let json = [];
        if (isCSV) {
          const text = String(evt.target.result);
          json = csvTextToObjects(text);
        } else {
          const data = new Uint8Array(evt.target.result);
          const wb = XLSX.read(data, { type: "array" });
          if (!wb.SheetNames.length) {
            throw new Error("Le fichier Excel ne contient aucune feuille");
          }
          const ws = wb.Sheets[wb.SheetNames[0]];
          json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        }

        if (!json.length) {
          notify("❌ Le fichier ne contient aucune donnée valide.", "error");
          setIsLoading(false);
          return;
        }

        const hdrs = Object.keys(json[0] ?? {});
        const normHeaders = hdrs.map((h) => h.toLowerCase().trim());

        if (!isSireneFile(normHeaders)) {
          const columnsList = hdrs.slice(0, 10).join(", ");
          const moreColumns = hdrs.length > 10 ? `\n... et ${hdrs.length - 10} colonnes supplémentaires` : "";
          notify(`❌ Ce fichier ne semble pas contenir de colonne SIRET.\n\nColonnes trouvées :\n${columnsList}${moreColumns}\n\nVérifiez que votre fichier contient au moins une colonne avec les SIRET (nommée siret, siret_found, numsiren, etc.).`, "error");
          setIsLoading(false);
          return;
        }

        const normalizedRows = normalizeSireneData(json);

        // Initialiser la progression
        setImportProgress({ current: 0, total: normalizedRows.length });

        // Insérer les lignes par batch de 10 pour suivre la progression
        const BATCH_SIZE = 10;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < normalizedRows.length; i += BATCH_SIZE) {
          const batch = normalizedRows.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(row =>
            supabase.from('sirene_imports').insert({
              user_id: user.id,
              data: row,
              note: ""
            }).select()
          );

          const results = await Promise.all(batchPromises);

          // Compter les succès et erreurs
          const batchErrors = results.filter(r => r.error);
          successCount += results.length - batchErrors.length;
          errorCount += batchErrors.length;

          // Mettre à jour la progression
          setImportProgress({ current: i + batch.length, total: normalizedRows.length });
        }

        // Afficher un message si des erreurs se sont produites
        if (errorCount > 0) {
          notify(`⚠️ ${errorCount} ligne${errorCount > 1 ? 's' : ''} n'ont pas pu être importées.`, "success");
        }

        // Recharger les données depuis Supabase
        const { data: reloadedData, error: reloadError } = await supabase
          .from('sirene_imports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (reloadError) {
        } else {
          const loadedRows = (reloadedData || []).map(item => ({
            ...item.data,
            __note: item.note || "",
            __id: item.id,
          }));
          setRows(loadedRows);
        }

        setModalRowState(null);
        setIsLoading(false);
        setImportProgress({ current: 0, total: 0 });
        notify(`✅ ${successCount} ligne${successCount > 1 ? 's' : ''} importée${successCount > 1 ? 's' : ''} avec succès !`, "success");
      } catch (err) {
        const errorMessage = err.message || "Erreur inconnue lors de la lecture du fichier";
        notify(`❌ Erreur de lecture du fichier :\n\n${errorMessage}`, "error");
        setIsLoading(false);
        setImportProgress({ current: 0, total: 0 });
      }
    };

    reader.onerror = () => {
      notify("❌ Impossible de lire le fichier. Veuillez réessayer.", "error");
      setIsLoading(false);
      setImportProgress({ current: 0, total: 0 });
    };

    if (isCSV) reader.readAsText(file, "utf-8");
    else reader.readAsArrayBuffer(file);
  }

  async function clearFile() {
    if (!user?.id) return;

    if (fileRef.current) fileRef.current.value = "";

    try {
      // Supprimer toutes les données de l'utilisateur dans Supabase
      const { error } = await supabase
        .from('sirene_imports')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        notify("❌ Erreur lors de la suppression des données.", "error");
        return;
      }

      setRows([]);
      setModalRowState(null);
    } catch (err) {
    }
  }

  async function deleteRow(idx) {
    if (!user?.id) return;

    const row = rows[idx];
    if (!row?.__id) return;

    try {
      const { error } = await supabase
        .from('sirene_imports')
        .delete()
        .eq('id', row.__id)
        .eq('user_id', user.id);

      if (error) {
        return;
      }

      setRows((r) => r.filter((_, i) => i !== idx));
    } catch (err) {
    }
  }

  async function updateNote(idx, val) {
    if (!user?.id) return;

    const row = rows[idx];
    if (!row?.__id) return;

    try {
      const { error } = await supabase
        .from('sirene_imports')
        .update({ note: val })
        .eq('id', row.__id)
        .eq('user_id', user.id);

      if (error) {
        return;
      }

      setRows((r) => {
        const copy = [...r];
        copy[idx] = { ...copy[idx], __note: val };
        return copy;
      });
    } catch (err) {
    }
  }

  async function updateField(idx, key, value) {
    if (!user?.id) return;

    const row = rows[idx];
    if (!row?.__id) return;

    try {
      // Copier les données actuelles et mettre à jour le champ
      const { __note, __id, ...currentData } = row;
      const updatedData = { ...currentData, [key]: value };

      const { error } = await supabase
        .from('sirene_imports')
        .update({ data: updatedData })
        .eq('id', row.__id)
        .eq('user_id', user.id);

      if (error) {
        return;
      }

      setRows((r) => {
        const copy = [...r];
        copy[idx] = { ...copy[idx], [key]: value };
        return copy;
      });
    } catch (err) {
    }
  }

  function exportCSV() {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sirene_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportXLSX() {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prospects");
    XLSX.writeFile(wb, "sirene_export.xlsx");
  }

  function getDiffusionStatut(row) {
    const key = Object.keys(row).find((k) => k.toLowerCase().trim() === "statutdiffusionunitelegale");
    const val = key ? String(row[key]).trim().toUpperCase() : "";
    return val === "O" || val === "P" ? val : "";
  }

  function hasAddress(row) {
    // Chercher une clé qui ressemble à une adresse
    const addressKeys = [
      "numerovoeestablissement",
      "voieestablissement",
      "codepostalestablissement",
      "communeestablissement",
      "address",
      "adresse",
      "localisation",
    ];

    for (const key of addressKeys) {
      const foundKey = Object.keys(row).find((k) => k.toLowerCase().trim().includes(key.toLowerCase()));
      if (foundKey) {
        const address = String(row[foundKey]).trim();
        if (address && address !== "" && address !== "[ND]") {
          return true;
        }
      }
    }
    return false;
  }

  function isND(row) {
    // Chercher une clé de dénomination/nom
    const denominationKeys = [
      "denominationunitelegale",
      "denomination",
      "name_candidate",
      "name",
      "raison_sociale",
      "raisonsociale",
    ];

    for (const key of denominationKeys) {
      const foundKey = Object.keys(row).find((k) => k.toLowerCase().trim().includes(key.toLowerCase()));
      if (foundKey) {
        const denomination = String(row[foundKey]).trim();
        if (denomination.includes("[ND]")) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper function - même logique que getField dans SireneTable
  function getField(row, candidates) {
    const key = Object.keys(row).find((k) =>
      candidates.some((c) => k.toLowerCase().trim() === c.toLowerCase().trim())
    );
    return key ? row[key] : "";
  }

  function hasIdentity(row) {
    // Utiliser la même logique que l'affichage : si nom est vide ou "_", c'est "No name"
    const nom = getField(row, ["nom", "nomunitelegale"]);
    const nomTrimmed = String(nom).trim();

    // Retourner true seulement si le nom n'est pas vide et n'est pas "_"
    return nomTrimmed && nomTrimmed !== "" && nomTrimmed !== "_";
  }

  function hasCompany(row) {
    // Utiliser la même logique que l'affichage : si societe est vide ou "_", c'est "No name"
    const societe = getField(row, ["denomination", "denominationunitelegale"]);
    const societeTrimmed = String(societe).trim();

    // Retourner true seulement si la societe n'est pas vide et n'est pas "_"
    return societeTrimmed && societeTrimmed !== "" && societeTrimmed !== "_";
  }

  const filteredRows = useMemo(() => {
    let list = rows;

    if (diffusionFilter !== "both") {
      list = list.filter((r) => getDiffusionStatut(r) === diffusionFilter);
    }

    // Filtre [ND] : exclure si [ND] ET pas d'adresse
    if (hideND) {
      list = list.filter((r) => {
        if (isND(r)) {
          return hasAddress(r); // Garder seulement si adresse
        }
        return true;
      });
    }

    // Filtre identité : afficher seulement ceux avec identité connue
    if (showOnlyWithIdentity) {
      list = list.filter((r) => hasIdentity(r));
    }

    // Filtre entreprise : afficher seulement ceux avec nom d'entreprise connu
    if (showOnlyWithCompany) {
      list = list.filter((r) => hasCompany(r));
    }

    // Filtre formes juridiques (multi-choix)
    if (juridicalFilters.length > 0) {
      list = list.filter((r) => {
        const key = Object.keys(r).find((k) => k.toLowerCase().trim() === "categoriejuridiqueunitelegale");
        const code = key ? String(r[key]).trim() : "";
        return juridicalFilters.includes(code);
      });
    }

    return list;
  }, [rows, diffusionFilter, hideND, showOnlyWithIdentity, showOnlyWithCompany, juridicalFilters]);

  function setModalRow(row, idx) {
    setModalRowState({ row, idx });
  }

  return {
    rows,
    filteredRows,
    modalRow,
    setModalRow,
    fileRef,
    handleFile,
    clearFile,
    deleteRow,
    updateNote,
    updateField,
    exportCSV,
    exportXLSX,
    diffusionFilter,
    setDiffusionFilter,
    sortOrder,
    setSortOrder,
    juridicalFilters,
    setJuridicalFilters,
    hideND,
    setHideND,
    showOnlyWithIdentity,
    setShowOnlyWithIdentity,
    showOnlyWithCompany,
    setShowOnlyWithCompany,
    isLoading,
    importProgress,
  };
}
