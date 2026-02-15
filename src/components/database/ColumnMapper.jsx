// src/components/database/ColumnMapper.jsx
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, FileSpreadsheet, Check, Ban, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const KANVEO_FIELDS = [
  { id: "__ignore__", label: "-- Ignorer --", icon: Ban },
  { id: "name", label: "Nom" },
  { id: "company", label: "Entreprise" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Telephone" },
  { id: "address", label: "Adresse" },
  { id: "city", label: "Ville" },
  { id: "postal_code", label: "Code postal" },
  { id: "siret", label: "SIRET" },
  { id: "website", label: "Site web" },
  { id: "job_title", label: "Poste" },
  { id: "notes", label: "Notes" },
];

export default function ColumnMapper({
  isOpen,
  fileName,
  headers,
  mapping,
  pendingData,
  duplicateWarnings = [],
  getMappingConfidence,
  onUpdateMapping,
  onConfirm,
  onCancel,
}) {
  // Preview first 5 rows
  const previewRows = useMemo(() => {
    if (!pendingData) return [];
    return pendingData.slice(0, 5);
  }, [pendingData]);

  const mappedCount = useMemo(() => {
    return Object.values(mapping).filter(v => v !== "__ignore__").length;
  }, [mapping]);

  const totalRows = pendingData?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Mapping des colonnes
          </DialogTitle>
          <DialogDescription>
            Associez les colonnes de <strong>{fileName}</strong> aux champs Kanveo.
            <span className="ml-1 text-foreground font-medium">{totalRows} ligne{totalRows > 1 ? "s" : ""}</span> detectee{totalRows > 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-2">
            {/* Duplicate email warning */}
            {duplicateWarnings.length > 0 && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <strong>{duplicateWarnings.length} doublon{duplicateWarnings.length > 1 ? "s" : ""} email detecte{duplicateWarnings.length > 1 ? "s" : ""}</strong> :{" "}
                  {duplicateWarnings.slice(0, 3).map(d => `${d.email} (x${d.count})`).join(", ")}
                  {duplicateWarnings.length > 3 && ` et ${duplicateWarnings.length - 3} autre(s)...`}
                </AlertDescription>
              </Alert>
            )}

            {/* Column mapping */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Association des colonnes ({mappedCount} mappee{mappedCount > 1 ? "s" : ""})</Label>
              <div className="grid gap-2">
                {headers.map((header) => {
                  const currentValue = mapping[header] || "__ignore__";
                  const isMapped = currentValue !== "__ignore__";
                  const confidence = getMappingConfidence ? getMappingConfidence(header, currentValue) : "none";

                  return (
                    <div
                      key={header}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        isMapped
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30 border-border"
                      )}
                    >
                      {/* File column */}
                      <div className="flex-1 min-w-0">
                        <Badge
                          variant={isMapped ? "default" : "outline"}
                          className="text-sm truncate max-w-full"
                        >
                          {header}
                        </Badge>
                      </div>

                      {/* Confidence indicator */}
                      {isMapped && (
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            confidence === "exact" && "bg-green-500",
                            confidence === "partial" && "bg-yellow-500",
                            confidence === "none" && "bg-gray-400"
                          )}
                          title={
                            confidence === "exact" ? "Correspondance exacte"
                              : confidence === "partial" ? "Correspondance partielle"
                                : "Mapping manuel"
                          }
                        />
                      )}

                      {/* Arrow */}
                      <ArrowRight className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isMapped ? "text-primary" : "text-muted-foreground"
                      )} />

                      {/* Kanveo field selector */}
                      <div className="w-48">
                        <Select
                          value={currentValue}
                          onValueChange={(value) => onUpdateMapping(header, value)}
                        >
                          <SelectTrigger className={cn(
                            "h-9",
                            isMapped && "border-primary/30"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {KANVEO_FIELDS.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data preview - 5 rows */}
            {previewRows.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Apercu des donnees ({Math.min(5, totalRows)} premieres lignes)</Label>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {headers
                              .filter(h => mapping[h] !== "__ignore__")
                              .map((header) => (
                                <TableHead key={header} className="text-xs whitespace-nowrap">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground">{header}</span>
                                    <Badge variant="secondary" className="text-[10px] w-fit">
                                      → {KANVEO_FIELDS.find(f => f.id === mapping[header])?.label || "?"}
                                    </Badge>
                                  </div>
                                </TableHead>
                              ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.map((row, i) => (
                            <TableRow key={i}>
                              {headers
                                .filter(h => mapping[h] !== "__ignore__")
                                .map((header) => (
                                  <TableCell key={header} className="text-sm">
                                    {String(row[header] || "").substring(0, 50)}
                                  </TableCell>
                                ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm} className="gap-2" disabled={mappedCount === 0}>
            <Check className="h-4 w-4" />
            Importer {totalRows} ligne{totalRows > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
