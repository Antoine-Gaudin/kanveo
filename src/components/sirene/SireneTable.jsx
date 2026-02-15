// src/components/sirene/SireneTable.jsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { TableRowSkeleton } from "../skeletons";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, PlusCircle, X, CheckCheck, Info, Eye, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle } from "lucide-react";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function SireneTable({
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
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const tableRef = useRef(null);
  const [pageSize, setPageSize] = useState(() => {
    try {
      if (!userId) return 25;
      const saved = localStorage.getItem(`sirene_pageSize_${userId}`);
      return saved ? Number(saved) : 25;
    } catch { return 25; }
  });

  // Pagination
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

  // Fonctions pour la sélection multiple
  const handleSelectRow = (idx, isSelected) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(idx);
      } else {
        newSet.delete(idx);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedRows(new Set(rows.map((_, idx) => idx)));
    } else {
      setSelectedRows(new Set());
    }
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

  // Raccourcis clavier
  const handleKeyDown = useCallback((e) => {
    if (!rows.length || isLoading) return;
    const start = (safeCurrentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, rows.length);
    const pageLen = end - start;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx(prev => {
        const next = prev < start ? start : Math.min(prev + 1, end - 1);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx(prev => {
        const next = prev <= start ? start : prev - 1;
        return next;
      });
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      const row = rows[focusedIdx];
      if (row) onRowClick(row, focusedIdx);
    } else if (e.key === " " && focusedIdx >= 0) {
      e.preventDefault();
      handleSelectRow(focusedIdx, !selectedRows.has(focusedIdx));
    }
  }, [rows, isLoading, safeCurrentPage, pageSize, focusedIdx, selectedRows, onRowClick]);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset page when rows change
  const prevRowsLength = useMemo(() => rows.length, [rows]);
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }

  return (
    <>
      {/* Barre d'actions pour la sélection multiple */}
      {selectedRows.size > 0 && (
        <Alert className="mb-4 bg-primary/10 border-primary/30">
          <CheckCheck className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="font-semibold">
              {selectedRows.size} ligne{selectedRows.size > 1 ? 's' : ''} sélectionnée{selectedRows.size > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddSelectedToPipeline}
                className="gap-2"
              >
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRows(new Set())}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Désélectionner
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          <div ref={tableRef} tabIndex={0} className="overflow-x-auto max-h-[70vh] overflow-y-auto focus:outline-none">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={rows.length > 0 && selectedRows.size === rows.length}
                      onCheckedChange={(checked) => handleSelectAll(checked)}
                    />
                  </TableHead>
                  <TableHead>Identité</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <TableRowSkeleton columns={4} />
                    <TableRowSkeleton columns={4} />
                    <TableRowSkeleton columns={4} />
                    <TableRowSkeleton columns={4} />
                    <TableRowSkeleton columns={4} />
                  </>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Info className="w-8 h-8" />
                        <p>Aucune donnée SIRENE importée</p>
                        <p className="text-sm">Importez un fichier CSV ou XLSX pour commencer</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row, pageIdx) => {
                    const idx = (safeCurrentPage - 1) * pageSize + pageIdx;
                    const siret = getField(row, ["siret", "siretetablissement"]);
                    const nom = getField(row, ["nom", "nomunitelegale"]);
                    const societe = getField(row, ["denomination", "denominationunitelegale"]);
                    const activite = getField(row, ["activite", "activiteprincipaleunitelegale"]);
                    const isDuplicate = siret && duplicateSirets.has(String(siret).replace(/[\s.-]/g, ""));
                    const isFocused = focusedIdx === idx;

                    return (
                      <TableRow
                        key={idx}
                        onClick={() => onRowClick(row, idx)}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedRows.has(idx) ? 'bg-muted/30' : ''
                        } ${isFocused ? 'ring-1 ring-inset ring-primary' : ''} ${isDuplicate ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRows.has(idx)}
                            onCheckedChange={(checked) => handleSelectRow(idx, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {(nom && nom !== "_") ? nom : "Non renseigné"}
                            </p>
                            {siret && (
                              <a
                                href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${String(siret).replace(/[\s.-]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:opacity-80 transition-opacity inline-block"
                                title="Voir sur l'Annuaire des Entreprises"
                              >
                                <Badge variant="secondary" className="font-mono text-xs gap-1 cursor-pointer">
                                  <ExternalLink className="w-3 h-3" />
                                  SIRET {siret}
                                </Badge>
                              </a>
                            )}
                            {isDuplicate && (
                              <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                Déjà dans un pipeline
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {(societe && societe !== "_") ? societe : "Non renseigné"}
                            </p>
                            {activite && (
                              <p className="text-xs text-muted-foreground">{activite}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRowClick(row, idx);
                              }}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {rows.length > PAGE_SIZE_OPTIONS[0] && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Lignes par page :</span>
                <Select value={String(pageSize)} onValueChange={(v) => {
                  const newSize = Number(v);
                  setPageSize(newSize);
                  setCurrentPage(1);
                  try { if (userId) localStorage.setItem(`sirene_pageSize_${userId}`, String(newSize)); } catch {}
                }}>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {isOpen && (
        <ConfirmDialog
          {...confirmConfig}
          onClose={close}
        />
      )}
    </>
  );
}
