import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Check, X, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BulkActions({ prospects, onBulkAction, statuses }) {
  const [selectedProspects, setSelectedProspects] = useState(new Set());
  const [showActions, setShowActions] = useState(false);
  const [actionType, setActionType] = useState("move");
  const [newStatus, setNewStatus] = useState("contacte");

  const handleToggleSelect = (prospectId) => {
    const newSet = new Set(selectedProspects);
    if (newSet.has(prospectId)) {
      newSet.delete(prospectId);
    } else {
      newSet.add(prospectId);
    }
    setSelectedProspects(newSet);
  };

  const handleSelectAll = () => {
    if (selectedProspects.size === prospects.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(prospects.map((p) => p.id)));
    }
  };

  const handleBulkAction = () => {
    if (selectedProspects.size === 0) return;

    const selectedProspectObjects = prospects.filter(p => selectedProspects.has(p.id));

    const action = {
      type: actionType,
      prospectIds: Array.from(selectedProspects),
      prospects: selectedProspectObjects,
      data: { status: newStatus },
    };

    onBulkAction?.(action);
    if (actionType !== "email") {
      setSelectedProspects(new Set());
      setShowActions(false);
    }
  };

  if (prospects.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedProspects.size === prospects.length && prospects.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedProspects.size > 0
                  ? `${selectedProspects.size} sélectionné${selectedProspects.size > 1 ? "s" : ""}`
                  : "Sélectionner tous"}
              </span>
            </label>
          </div>

          {selectedProspects.size > 0 && (
            <div className="flex gap-2">
              {!showActions ? (
                <Button onClick={() => setShowActions(true)}>
                  <Zap className="w-4 h-4 mr-2" />
                  Actions ({selectedProspects.size})
                </Button>
              ) : (
                <>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="move">Changer statut</SelectItem>
                      <SelectItem value="delete">Supprimer</SelectItem>
                      <SelectItem value="tag">Ajouter tag</SelectItem>
                      <SelectItem value="email">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-purple-500" />
                          Envoyer un email
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {actionType === "move" && (
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(statuses || ["prospect", "contacte", "attente", "client", "perdu"]).map((s) => {
                          const label = typeof s === 'object' ? s.label : s;
                          const value = typeof s === 'object' ? s.id : s;
                          return (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}

                  <Button variant="default" onClick={handleBulkAction} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-1" />
                    Appliquer
                  </Button>
                  <Button variant="secondary" onClick={() => setShowActions(false)}>
                    Annuler
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selection List (compact) */}
        {selectedProspects.size > 0 && (
          <ScrollArea className="max-h-32 rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap gap-2">
              {prospects
                .filter((p) => selectedProspects.has(p.id))
                .map((p) => (
                  <Badge
                    key={p.id}
                    variant="outline"
                    className="flex items-center gap-2 bg-primary/20 border-primary/50 text-primary"
                  >
                    <span>{p.name || p.company}</span>
                    <button
                      onClick={() => handleToggleSelect(p.id)}
                      className="hover:text-primary/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
