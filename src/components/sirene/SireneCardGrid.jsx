// src/components/sirene/SireneCardGrid.jsx
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { 
  Trash2, PlusCircle, X, CheckCheck, Info, Eye, 
  ChevronLeft, ChevronRight, ExternalLink, Building2, 
  MapPin, AlertTriangle 
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function SireneCardGrid({
  rows,
  isLoading,
  onDeleteRow,
  onDeleteMultipleRows,
  onRowClick,
  onAddMultipleToPipeline,
  duplicateSirets = new Set(),
  userId,
}) {
  const { isOpen, confirmConfig, confirm, close } = useConfirm();
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      if (!userId) return 12;
      const saved = localStorage.getItem(`sirene_cardPageSize_${userId}`);
      return saved ? Number(saved) : 12;
    } catch { return 12; }
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safeCurrentPage, pageSize]);

  const getField = (row, candidates) => {
    const key = Object.keys(row).find((k) =>
      candidates.some((c) => k.toLowerCase().trim() === c.toLowerCase().trim())
    );
    return key ? row[key] : "";
  };

  const handleSelectRow = (idx, isSelected) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(idx);
      else newSet.delete(idx);
      return newSet;
    });
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) setSelectedRows(new Set(rows.map((_, idx) => idx)));
    else setSelectedRows(new Set());
  };

  const handleAddSelectedToPipeline = () => {
    if (selectedRows.size === 0) return;
    const selectedData = Array.from(selectedRows).map(idx => ({ row: rows[idx], idx }));
    onAddMultipleToPipeline(selectedData);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    confirm({
      title: `Supprimer ${selectedRows.size} ligne${selectedRows.size > 1 ? 's' : ''} ?`,
      message: `Voulez-vous vraiment supprimer ${selectedRows.size} entrée${selectedRows.size > 1 ? 's' : ''} ? Cette action est irréversible.`,
      type: "danger",
      onConfirm: () => {
        onDeleteMultipleRows(Array.from(selectedRows));
        setSelectedRows(new Set());
      },
    });
  };

  if (safeCurrentPage !== currentPage) setCurrentPage(safeCurrentPage);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-4 pb-3 px-4 space-y-3">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Info className="w-8 h-8" />
            <p>Aucune donnée SIRENE importée</p>
            <p className="text-sm">Importez un fichier CSV ou XLSX pour commencer</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Barre d'actions multi-sélection */}
      {selectedRows.size > 0 && (
        <Alert className="mb-4 bg-primary/10 border-primary/30">
          <CheckCheck className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="font-semibold">
              {selectedRows.size} ligne{selectedRows.size > 1 ? 's' : ''} sélectionnée{selectedRows.size > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddSelectedToPipeline} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Ajouter aux pipelines
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedRows(new Set())} className="gap-2">
                <X className="w-4 h-4" />
                Désélectionner
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Select All */}
      <div className="flex items-center gap-2 mb-3">
        <Checkbox
          checked={rows.length > 0 && selectedRows.size === rows.length}
          onCheckedChange={(checked) => handleSelectAll(checked)}
        />
        <span className="text-sm text-muted-foreground">Tout sélectionner</span>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paginatedRows.map((row, pageIdx) => {
          const idx = (safeCurrentPage - 1) * pageSize + pageIdx;
          const siret = getField(row, ["siret", "siretetablissement"]);
          const nom = getField(row, ["nom", "nomunitelegale"]);
          const societe = getField(row, ["denomination", "denominationunitelegale"]);
          const activite = getField(row, ["activite", "activiteprincipaleunitelegale"]);
          const cp = getField(row, ["codepostaletablissement", "codepostal"]);
          const commune = getField(row, ["libellecommuneetablissement", "commune"]);
          const isDuplicate = siret && duplicateSirets.has(siret.replace(/[\s.-]/g, ""));

          return (
            <Card
              key={idx}
              onClick={() => onRowClick(row, idx)}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${
                selectedRows.has(idx) ? 'ring-2 ring-primary bg-primary/5' : ''
              } ${isDuplicate ? 'border-amber-400/50' : ''}`}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedRows.has(idx)}
                        onCheckedChange={(checked) => handleSelectRow(idx, checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <p className="font-semibold text-sm truncate">
                        {(societe && societe !== "_") ? societe : "Non renseigné"}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground truncate">
                      {(nom && nom !== "_") ? nom : "Identité inconnue"}
                    </p>

                    {activite && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activite}
                      </p>
                    )}

                    {(cp || commune) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{[cp, commune].filter(Boolean).join(" ")}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {siret && (
                        <a
                          href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${String(siret).replace(/[\s.-]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:opacity-80 transition-opacity"
                          title="Voir sur l'Annuaire des Entreprises"
                        >
                          <Badge variant="secondary" className="font-mono text-[10px] gap-1 cursor-pointer">
                            <ExternalLink className="w-2.5 h-2.5" />
                            {siret}
                          </Badge>
                        </a>
                      )}
                      {isDuplicate && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-400">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Doublon
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => { e.stopPropagation(); onRowClick(row, idx); }}
                      title="Détails"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirm({
                          title: "Supprimer cette ligne ?",
                          message: `Voulez-vous vraiment supprimer "${societe || nom || 'cette entrée'}" ?`,
                          type: "danger",
                          onConfirm: () => onDeleteRow(idx),
                        });
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {rows.length > PAGE_SIZE_OPTIONS[0] && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Par page :</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                const newSize = Number(v);
                setPageSize(newSize);
                setCurrentPage(1);
                try { if (userId) localStorage.setItem(`sirene_cardPageSize_${userId}`, String(newSize)); } catch {}
              }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {(safeCurrentPage - 1) * pageSize + 1}–{Math.min(safeCurrentPage * pageSize, rows.length)} sur {rows.length}
            </span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {isOpen && <ConfirmDialog {...confirmConfig} onClose={close} />}
    </>
  );
}
