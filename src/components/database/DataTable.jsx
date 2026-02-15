// src/components/database/DataTable.jsx
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Trash2,
  PlusCircle,
  X,
  CheckCheck,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  Filter,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataTable({
  rows,
  imports,
  enabledColumns,
  searchTerm,
  onSearchChange,
  activeImportFilter,
  onImportFilterChange,
  onDeleteRow,
  onRowClick,
  onAddToPipeline,
  // Server-side pagination
  page,
  onPageChange,
  pageSize,
  totalCount,
  totalPages,
  loading,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  // Réinitialiser la sélection au changement de page
  useEffect(() => {
    setSelectedRows(new Set());
  }, [page]);

  // Client-side sort on current page data
  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    return [...rows].sort((a, b) => {
      const va = (a.data?.[sortField] || "").toLowerCase();
      const vb = (b.data?.[sortField] || "").toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleSelectRow = (rowId, checked) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(sortedRows.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleAddSelectedToPipeline = () => {
    if (selectedRows.size === 0) return;
    const selected = rows.filter(r => selectedRows.has(r.id));
    onAddToPipeline(selected);
    setSelectedRows(new Set());
  };

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom, entreprise, email..."
            className="pl-10"
          />
        </div>
        {imports.length > 1 && (
          <Select
            value={activeImportFilter || "all"}
            onValueChange={(v) => onImportFilterChange(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[220px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tous les fichiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les fichiers</SelectItem>
              {imports.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.file_name} ({f.row_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Selection bar */}
      {selectedRows.size > 0 && (
        <Alert className="bg-primary/10 border-primary/30">
          <CheckCheck className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="font-semibold">
              {selectedRows.size} ligne{selectedRows.size > 1 ? "s" : ""} selectionnee{selectedRows.size > 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddSelectedToPipeline} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Ajouter au pipeline
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedRows(new Set())} className="gap-2">
                <X className="w-4 h-4" />
                Deselectionner
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={sortedRows.length > 0 && selectedRows.size === sortedRows.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  {enabledColumns.filter(c => c.id !== "notes").map(col => (
                    <TableHead
                      key={col.id}
                      className="cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.id)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortField === col.id ? "text-primary" : "text-muted-foreground/40"
                        )} />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-32">Source</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={enabledColumns.filter(c => c.id !== "notes").length + 3} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Chargement...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={enabledColumns.filter(c => c.id !== "notes").length + 3} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Info className="w-8 h-8" />
                        <p>Aucune donnee</p>
                        <p className="text-sm">Importez un fichier CSV ou Excel pour commencer</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.map((row) => {
                    const imp = imports.find(i => i.id === row.import_id);
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          selectedRows.has(row.id) && "bg-muted/30",
                          row.is_pipelined && "opacity-60"
                        )}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRows.has(row.id)}
                            onCheckedChange={(checked) => handleSelectRow(row.id, checked)}
                          />
                        </TableCell>
                        {enabledColumns.filter(c => c.id !== "notes").map((col, colIdx) => (
                          <TableCell
                            key={col.id}
                            onClick={() => onRowClick(row)}
                            className={cn(
                              colIdx === 0 && "font-medium",
                              col.type === "email" && "text-blue-600 dark:text-blue-400",
                              col.id === "address" && "max-w-[200px] truncate"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {row.data?.[col.id] || <span className="text-muted-foreground">--</span>}
                              {colIdx === 0 && row.is_pipelined && (
                                <Badge variant="outline" className="text-[10px] text-green-600 border-green-600/30">
                                  Pipeline
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] truncate max-w-[120px]">
                            {imp?.file_name || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onRowClick(row)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDeleteRow(row.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {from}–{to} sur {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="h-8 px-3 flex items-center">
              {page + 1} / {totalPages}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
