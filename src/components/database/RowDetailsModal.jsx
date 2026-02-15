// src/components/database/RowDetailsModal.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Copy, Check, FileText } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

export default function RowDetailsModal({
  row,
  open,
  onOpenChange,
  onUpdateNote,
  onAddToPipeline,
  enabledColumns = [],
  imports = [],
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [note, setNote] = useState(row?.notes || "");

  // Sync note when opening a different row
  useEffect(() => {
    if (row) setNote(row.notes || "");
  }, [row?.id]);

  const handleCopy = useCallback((value, key) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const handleSaveNote = () => {
    if (row) onUpdateNote(row.id, note);
  };

  if (!row) return null;

  const imp = imports.find(i => i.id === row.import_id);

  // Raw data fields (columns not in the config)
  const rawFields = row.raw_data
    ? Object.entries(row.raw_data).filter(([k]) => {
        return !enabledColumns.some(c => c.id === k) && k !== "__ignore__";
      })
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Details de la ligne
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dynamic fields from config */}
          <div className="grid gap-3">
            {enabledColumns.map(({ id, label }) => {
              const value = row.data?.[id];
              if (!value) return null;
              return (
                <div key={id} className="flex items-start justify-between gap-3 group">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium break-words">{value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(value, id)}
                  >
                    {copiedField === id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              Source : {imp?.file_name || "—"}
            </Badge>
            {row.is_pipelined && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">
                Ajoute au pipeline
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Importe le {new Date(row.created_at).toLocaleDateString("fr-FR")}
            </Badge>
          </div>

          {/* Raw data fields */}
          {rawFields.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Donnees brutes
                </p>
                <div className="grid gap-2 bg-muted/30 rounded-lg p-3">
                  {rawFields.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 group">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">{key}</p>
                        <p className="text-xs break-words">{String(value)}</p>
                      </div>
                      {value && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(String(value), key)}
                        >
                          {copiedField === key ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <Separator />
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajouter une note..."
              rows={3}
            />
            {note !== (row.notes || "") && (
              <Button size="sm" onClick={handleSaveNote}>
                Sauvegarder la note
              </Button>
            )}
          </div>

          {/* Actions */}
          {!row.is_pipelined && (
            <>
              <Separator />
              <Button className="w-full gap-2" onClick={() => onAddToPipeline([row])}>
                <PlusCircle className="w-4 h-4" />
                Ajouter au pipeline
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
