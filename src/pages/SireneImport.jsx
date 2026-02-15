import { useState, useEffect, useMemo } from "react";
import useSireneData from "../components/sirene/useSireneData";
import SireneImporter from "../components/sirene/SireneImporter";
import SireneTable from "../components/sirene/SireneTable";
import SireneCardGrid from "../components/sirene/SireneCardGrid";
import SireneStats from "../components/sirene/SireneStats";
import ModalDetails from "../components/sirene/ModalDetails";
import MultiplePipelineSelector from "../components/sirene/MultiplePipelineSelector";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Toast from "../components/Toast";
import { SireneImportSkeleton } from "../components/skeletons";
import apeCodesData from "../data/ape_codes.json";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ExternalLink, ChevronDown, ChevronUp, Search, FilterX, SlidersHorizontal, LayoutGrid, List, Download } from "lucide-react";

export default function SireneImport() {
  const [showModal, setShowModal] = useState(false);
  const [showMultiplePipelineModal, setShowMultiplePipelineModal] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [infoOpen, setInfoOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [apeFilter, setApeFilter] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem("sirene_viewMode") || "table"; } catch { return "table"; }
  });

  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { isOpen: confirmOpen, confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const {
    rows,
    filteredRows,
    modalRow,
    setModalRow,
    fileRef,
    handleFile,
    clearFile,
    deleteRow,
    deleteMultipleRows,
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
    loadError,
    importProgress,
  } = useSireneData({ addToast });

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Fermer le bloc info quand des données sont chargées
  useEffect(() => {
    if (rows.length > 0) setInfoOpen(false);
  }, [rows.length]);

  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape") {
        if (showMultiplePipelineModal) {
          setShowMultiplePipelineModal(false);
        } else if (showModal) {
          setShowModal(false);
          setModalRow(null);
        }
      }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [setModalRow, showModal, showMultiplePipelineModal]);

  // Helper pour récupérer un champ
  const getFieldHelper = (row, candidates) => {
    const key = Object.keys(row).find((k) =>
      candidates.some((c) => k.toLowerCase().trim() === c.toLowerCase().trim())
    );
    return key ? String(row[key]).trim() : "";
  };

  // Recherche textuelle + filtres département/APE sur les filteredRows
  const searchedRows = useMemo(() => {
    let list = filteredRows;

    // Filtre département
    if (departmentFilter) {
      list = list.filter((row) => {
        const cp = getFieldHelper(row, ["codepostaletablissement", "codepostal"]);
        return cp && cp.startsWith(departmentFilter);
      });
    }

    // Filtre code APE
    if (apeFilter) {
      list = list.filter((row) => {
        const ape = getFieldHelper(row, [
          "activiteprincipaleunitelegale", "activiteprincipaleestablissement",
          "activiteprincipaleetablissement", "activite", "codeape", "naf"
        ]);
        return ape && ape.startsWith(apeFilter);
      });
    }

    // Recherche textuelle
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((row) => {
        return Object.values(row).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    return list;
  }, [filteredRows, searchQuery, departmentFilter, apeFilter]);

  // Détection doublons SIRET (ceux déjà dans les pipelines)
  const [pipelineSirets, setPipelineSirets] = useState(new Set());

  useEffect(() => {
    if (!user?.id || !rows.length) return;
    
    async function fetchPipelineSirets() {
      try {
        const { data } = await supabase
          .from("sirene_infos")
          .select("siret")
          .not("siret", "is", null);
        
        if (data) {
          setPipelineSirets(new Set(data.map(d => String(d.siret || "").replace(/[\s.-]/g, "").trim())));
        }
      } catch {}
    }

    fetchPipelineSirets();
  }, [user?.id, rows.length]);

  // Départements disponibles dans les données
  const availableDepartments = useMemo(() => {
    const depts = new Map();
    for (const row of filteredRows) {
      const cp = getFieldHelper(row, ["codepostaletablissement", "codepostal"]);
      if (cp && cp.length >= 2) {
        const dept = cp.substring(0, 2);
        depts.set(dept, (depts.get(dept) || 0) + 1);
      }
    }
    return Array.from(depts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRows]);

  // Codes APE disponibles dans les données  
  const availableApeCodes = useMemo(() => {
    const codes = new Map();
    for (const row of filteredRows) {
      const ape = getFieldHelper(row, [
        "activiteprincipaleunitelegale", "activiteprincipaleestablissement",
        "activiteprincipaleetablissement", "activite", "codeape", "naf"
      ]);
      if (ape) {
        // Prendre les 2 premiers chiffres (division APE)
        const division = ape.replace(/\./g, "").substring(0, 2);
        if (division && /^\d{2}$/.test(division)) {
          codes.set(division, (codes.get(division) || 0) + 1);
        }
      }
    }
    return Array.from(codes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, count]) => ({
        code,
        label: apeCodesData[code] || `Code ${code}`,
        count,
      }));
  }, [filteredRows]);

  const handleAddMultipleToPipeline = (prospects) => {
    setSelectedProspects(prospects);
    setShowMultiplePipelineModal(true);
  };

  const handleMultiplePipelineSuccess = (result) => {
    addToast(
      `${result.totalSuccess} prospect${result.totalSuccess > 1 ? 's' : ''} ajouté${result.totalSuccess > 1 ? 's' : ''} aux pipelines : ${result.boardNames.join(', ')}`,
      "success"
    );
    setSelectedProspects([]);
  };

  const handleClearWithConfirm = () => {
    confirm({
      title: "Réinitialiser toutes les données ?",
      message: `Voulez-vous vraiment supprimer les ${rows.length} lignes importées ? Cette action est irréversible.`,
      type: "danger",
      onConfirm: clearFile,
    });
  };

  const hasActiveFilters = diffusionFilter !== "both" || juridicalFilters.length > 0 || hideND !== true || showOnlyWithIdentity || showOnlyWithCompany || departmentFilter || apeFilter;

  const resetFilters = () => {
    setDiffusionFilter("both");
    setSortOrder(null);
    setJuridicalFilters([]);
    setHideND(true);
    setShowOnlyWithIdentity(false);
    setShowOnlyWithCompany(false);
    setDepartmentFilter("");
    setApeFilter("");
    setSearchQuery("");
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try { localStorage.setItem("sirene_viewMode", mode); } catch {}
  };

  const handleExportFiltered = (format) => {
    const dataToExport = searchedRows;
    if (format === "csv") exportCSV(dataToExport);
    else exportXLSX(dataToExport);
    addToast(`${dataToExport.length} ligne${dataToExport.length > 1 ? 's' : ''} exportée${dataToExport.length > 1 ? 's' : ''} en ${format.toUpperCase()}.`, "success");
  };

  const juridicalOptions = [
    { code: "1000", label: "Auto-entrepreneur (EI)" },
    { code: "5410", label: "SARL" },
    { code: "5710", label: "SAS" },
    { code: "5720", label: "SASU" },
    { code: "5520", label: "SA" },
    { code: "5790", label: "SELARL" },
    { code: "9220", label: "Association" },
    { code: "5110", label: "SNC" },
    { code: "5470", label: "SPFPL SARL" },
    { code: "5570", label: "SPFPL SA CA" },
    { code: "6110", label: "Mutuelle" },
    { code: "3210", label: "SCI" },
  ];

  if (showSkeleton) {
    return (
      <div className="max-w-7xl mx-auto">
        <SireneImportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec badge compteur */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Importer SIRENE</h1>
            {rows.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {rows.length} ligne{rows.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Importez vos données SIRENE et explorez les informations d'entreprises
          </p>
        </div>
      </div>

      {/* Erreur de chargement */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            {loadError} — Vos données SIRENE n'ont pas pu être récupérées. Vérifiez votre connexion et rechargez la page.
          </AlertDescription>
        </Alert>
      )}

      {/* Section info SIRENE — repliable */}
      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <Alert className="bg-primary/10 border-primary/30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="font-semibold text-sm">À propos de SIRENE</span>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {infoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <AlertDescription className="space-y-4 mt-3">
              <p className="text-sm">
                <span className="font-semibold">SIRENE</span> est le{' '}
                <span className="font-semibold">Système d'Identification du Répertoire des Entreprises et Établissements</span>{' '}
                géré par l'<span className="font-semibold">INSEE</span>.
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <Badge variant="secondary" className="gap-1">
                  Open Source & Gratuit
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  Gestion Publique
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  Données Officielles
                </Badge>
              </div>

              <div className="pt-2 border-t border-primary/20">
                <p className="text-sm mb-2 font-semibold text-foreground">Où récupérer les données SIRENE :</p>
                <Button size="sm" variant="default" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <a
                    href="https://annuaire-entreprises.data.gouv.fr/export-sirene"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Annuaire des Entreprises
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  L'ancien site SIRENE a fermé le 2 décembre 2024. Utilisez le nouveau site officiel.
                </p>
              </div>

              <div className="pt-2 border-t border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Format accepté :</span>{' '}
                  Fichiers CSV ou Excel (.xlsx) contenant les colonnes standard SIRENE
                </p>
              </div>
            </AlertDescription>
          </CollapsibleContent>
        </Alert>
      </Collapsible>

      <SireneImporter
        fileRef={fileRef}
        handleFile={handleFile}
        clearFile={handleClearWithConfirm}
        rowCount={rows.length}
        onExportCSV={exportCSV}
        onExportXLSX={exportXLSX}
      />

      {/* Progress Bar */}
      {importProgress.total > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Import en cours...</span>
              <Badge variant="secondary">
                {importProgress.current} / {importProgress.total}
              </Badge>
            </div>
            <Progress 
              value={(importProgress.current / importProgress.total) * 100} 
              className="h-3"
            />
            <p className="text-xs text-muted-foreground">
              Veuillez patienter pendant l'enregistrement des données dans la base de données...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters and Table */}
      {rows.length > 0 && (
        <div className="space-y-4">
          {/* Statistiques rapides */}
          <SireneStats rows={searchedRows} duplicateSirets={pipelineSirets} />

          {/* Barre de recherche + tri + vue + export */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, SIRET, activité..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="outline" className="whitespace-nowrap">
                {searchedRows.length} / {rows.length} résultat{searchedRows.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {/* Vue toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2 rounded-r-none"
                  onClick={() => handleViewModeChange("table")}
                  title="Vue tableau"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2 rounded-l-none"
                  onClick={() => handleViewModeChange("cards")}
                  title="Vue cartes"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>

              <Select value={diffusionFilter} onValueChange={setDiffusionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut diffusion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Tous les statuts</SelectItem>
                  <SelectItem value="O">Diffusion publique (O)</SelectItem>
                  <SelectItem value="P">Diffusion partielle (P)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortOrder || "none"} onValueChange={(v) => setSortOrder(v === "none" ? null : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tri par date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pas de tri</SelectItem>
                  <SelectItem value="asc">Date croissante</SelectItem>
                  <SelectItem value="desc">Date décroissante</SelectItem>
                </SelectContent>
              </Select>

              {/* Export filtré */}
              <div className="flex border rounded-md">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-r-none border-r-0 text-xs"
                  onClick={() => handleExportFiltered("csv")}
                  title="Exporter les résultats filtrés en CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-l-none text-xs"
                  onClick={() => handleExportFiltered("xlsx")}
                  title="Exporter les résultats filtrés en Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  XLSX
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Card — repliable */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filtres avancés
                      {hasActiveFilters && (
                        <Badge variant="default" className="text-xs">Actifs</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <FilterX className="w-3 h-3" />
                          Réinitialiser
                        </Button>
                      )}
                      {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 space-y-4">
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="hideND" 
                        checked={hideND}
                        onCheckedChange={setHideND}
                      />
                      <Label htmlFor="hideND" className="text-sm font-medium cursor-pointer">
                        Masquer [ND] sans adresse
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showIdentity" 
                        checked={showOnlyWithIdentity}
                        onCheckedChange={setShowOnlyWithIdentity}
                      />
                      <Label htmlFor="showIdentity" className="text-sm font-medium cursor-pointer">
                        Seulement avec identité connue
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="showCompany" 
                        checked={showOnlyWithCompany}
                        onCheckedChange={setShowOnlyWithCompany}
                      />
                      <Label htmlFor="showCompany" className="text-sm font-medium cursor-pointer">
                        Seulement avec entreprise connue
                      </Label>
                    </div>
                  </div>

                  {/* Département et Code APE */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Département :</Label>
                      <Select value={departmentFilter || "all"} onValueChange={(v) => setDepartmentFilter(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Tous les départements" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les départements</SelectItem>
                          {availableDepartments.map(([dept, count]) => (
                            <SelectItem key={dept} value={dept}>
                              {dept} ({count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Secteur d'activité (APE) :</Label>
                      <Select value={apeFilter || "all"} onValueChange={(v) => setApeFilter(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[320px]">
                          <SelectValue placeholder="Tous les secteurs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les secteurs</SelectItem>
                          {availableApeCodes.map(({ code, label, count }) => (
                            <SelectItem key={code} value={code}>
                              {code} — {label.length > 40 ? label.substring(0, 40) + "…" : label} ({count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Juridical Form Filters */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-sm font-semibold">Filtrer par forme juridique :</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {juridicalOptions.map(({ code, label }) => (
                        <div key={code} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`jur-${code}`}
                            checked={juridicalFilters.includes(code)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setJuridicalFilters([...juridicalFilters, code]);
                              } else {
                                setJuridicalFilters(juridicalFilters.filter((c) => c !== code));
                              }
                            }}
                          />
                          <Label htmlFor={`jur-${code}`} className="text-sm cursor-pointer">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Table ou Grille de cartes */}
          {viewMode === "table" ? (
            <SireneTable
              rows={searchedRows}
              isLoading={isLoading}
              onDeleteRow={deleteRow}
              onDeleteMultipleRows={deleteMultipleRows}
              onRowClick={(row, idx) => {
                setModalRow(row, idx);
                setShowModal(true);
              }}
              onAddMultipleToPipeline={handleAddMultipleToPipeline}
              duplicateSirets={pipelineSirets}
              userId={user?.id}
            />
          ) : (
            <SireneCardGrid
              rows={searchedRows}
              isLoading={isLoading}
              onDeleteRow={deleteRow}
              onDeleteMultipleRows={deleteMultipleRows}
              onRowClick={(row, idx) => {
                setModalRow(row, idx);
                setShowModal(true);
              }}
              onAddMultipleToPipeline={handleAddMultipleToPipeline}
              duplicateSirets={pipelineSirets}
              userId={user?.id}
            />
          )}
        </div>
      )}

      {showModal && modalRow && (
        <ModalDetails
          row={modalRow.row}
          rowIndex={modalRow.idx}
          onUpdateField={updateField}
          onClose={() => {
            setShowModal(false);
            setModalRow(null);
          }}
        />
      )}

      {showMultiplePipelineModal && (
        <MultiplePipelineSelector
          isOpen={showMultiplePipelineModal}
          onClose={() => {
            setShowMultiplePipelineModal(false);
            setSelectedProspects([]);
          }}
          selectedProspects={selectedProspects}
          onSuccess={handleMultiplePipelineSuccess}
        />
      )}

      {/* Confirm Dialog */}
      {confirmOpen && (
        <ConfirmDialog
          {...confirmConfig}
          onClose={closeConfirm}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
