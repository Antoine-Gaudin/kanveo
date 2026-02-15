// src/components/prospecting/KanbanBoard.jsx
import { useState, useMemo, useEffect } from "react";
import ProspectCard from "./ProspectCard";
import ProspectDetailsModal from "./ProspectDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { STATUSES, STATUS_CONFIG } from "../../config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Fonction pour obtenir les colonnes depuis le tableau ou utiliser les colonnes par défaut
const getBoardColumns = (board) => {
  if (!board?.statuses || !Array.isArray(board.statuses)) {
    // Pas de statuts définis, utiliser les valeurs par défaut
    return STATUSES.map(status => ({
      id: status,
      label: STATUS_CONFIG[status]?.label || status,
      icon: STATUS_CONFIG[status]?.icon || "📋",
      color: STATUS_CONFIG[status]?.color || "neutral",
      header: STATUS_CONFIG[status]?.header || "bg-gradient-to-r from-muted/50 to-muted/30 border-l-4 border-border",
      badge: STATUS_CONFIG[status]?.badge || "bg-muted text-muted-foreground",
    }));
  }

  // Vérifier si c'est le nouveau format (objets) ou l'ancien format (strings)
  const firstStatus = board.statuses[0];

  if (typeof firstStatus === 'object' && firstStatus !== null) {
    // Nouveau format : tableau d'objets avec configuration complète
    return board.statuses;
  } else {
    // Ancien format : tableau de strings, convertir en objets
    return board.statuses.map(status => ({
      id: status,
      label: STATUS_CONFIG[status]?.label || status,
      icon: STATUS_CONFIG[status]?.icon || "📋",
      color: STATUS_CONFIG[status]?.color || "neutral",
      header: STATUS_CONFIG[status]?.header || "bg-gradient-to-r from-muted/50 to-muted/30 border-l-4 border-border",
      badge: STATUS_CONFIG[status]?.badge || "bg-muted text-muted-foreground",
    }));
  }
};

export default function KanbanBoard({
  prospects,
  onMoveProspect,
  onDeleteProspect,
  onUpdateProspect,
  onAddContact,
  board = null,
}) {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [draggedProspect, setDraggedProspect] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Obtenir les colonnes personnalisées du tableau
  const boardColumns = getBoardColumns(board);

  // DEBUG - Log ce qui se passe dans KanbanBoard
  useEffect(() => {
    // Pour chaque colonne, compter les prospects
    boardColumns.forEach(column => {
      const statusProspects = prospects?.filter(p => p.status === column.id) || [];
    });
  }, [board, boardColumns, prospects]);

  // Fonction pour supprimer avec confirmation
  const handleDeleteWithConfirm = (prospect) => {
    confirm({
      title: "Supprimer ce prospect ?",
      message: `Voulez-vous vraiment supprimer "${prospect.name || prospect.company}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => onDeleteProspect(prospect.id)
    });
  };

  const handleDragStart = (e, prospect) => {
    setDraggedProspect(prospect);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    
    if (draggedProspect && draggedProspect.status !== targetStatus) {
      onMoveProspect(draggedProspect.id, targetStatus);
    }
    setDraggedProspect(null);
  };

  // Calcul des stats par colonne
  const statusStats = useMemo(() => {
    const stats = {};
    boardColumns.forEach((column) => {
      const statusProspects = prospects.filter((p) => p.status === column.id);
      const withContacts = statusProspects.filter((p) => p.contacts && p.contacts.length > 0).length;
      const noContacts = statusProspects.length - withContacts;

      stats[column.id] = {
        total: statusProspects.length,
        withContacts,
        noContacts,
        avgDays: statusProspects.length > 0
          ? Math.round(
              statusProspects.reduce((sum, p) => {
                const lastContact = p.contacts?.[p.contacts.length - 1];
                const refDate = lastContact ? new Date(lastContact.date) : new Date(p.createdAt || p.created_at);
                const days = Math.floor((new Date() - refDate) / (1000 * 60 * 60 * 24));
                return sum + days;
              }, 0) / statusProspects.length
            )
          : 0
      };
    });
    return stats;
  }, [prospects, boardColumns]);

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className={`grid gap-6 auto-rows-max min-w-max ${boardColumns.length === 5 ? 'lg:grid-cols-5' : boardColumns.length === 4 ? 'lg:grid-cols-4' : boardColumns.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`} style={{ gridTemplateColumns: `repeat(${boardColumns.length}, minmax(250px, 1fr))` }}>
        {boardColumns.map((column) => {
          const statusProspects = prospects.filter((p) => p.status === column.id);
          const isDropTarget = dragOverStatus === column.id;
          const stats = statusStats[column.id];

          return (
            <div key={column.id} className="flex flex-col h-screen sticky top-0">
              {/* Column Header - Enhanced */}
              <Card className={cn(
                "rounded-b-none border-b-0",
                isDropTarget && "ring-2 ring-primary"
              )}>
                <CardHeader className="pb-3">
                  {/* Main Header */}
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <span>{column.icon}</span>
                      {column.label}
                    </CardTitle>
                    <Badge variant="secondary" className="font-bold">
                      {statusProspects.length}
                    </Badge>
                  </div>

                  {/* Stats Line */}
                  {statusProspects.length > 0 && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <span className="flex items-center gap-1" title="Avec contacts">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {stats.withContacts}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500" title="Sans contact">
                        <AlertCircle className="w-3 h-3" />
                        {stats.noContacts}
                      </span>
                      <span className="flex items-center gap-1" title="Jours moyens">
                        <Clock className="w-3 h-3" />
                        {stats.avgDays}j
                      </span>
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* Cards Container - Drag & Drop Zone */}
              <ScrollArea
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                className={cn(
                  "flex-1 rounded-b-lg rounded-t-none border border-t-0 bg-muted/30 p-3 transition-all",
                  isDropTarget && "border-primary bg-primary/5",
                  draggedProspect && "cursor-grabbing"
                )}
              >
                <div className="space-y-2">
                  {statusProspects.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground/50 text-sm">
                      <div className="text-center">
                        <p className="text-2xl mb-2">−</p>
                        <p>Aucun prospect</p>
                        {draggedProspect && <p className="text-xs text-muted-foreground mt-2">Déposez ici</p>}
                      </div>
                    </div>
                  ) : (
                    statusProspects.map((prospect) => (
                      <div
                        key={prospect.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, prospect)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <ProspectCard
                          prospect={prospect}
                          allStatuses={boardColumns}
                          variant="compact"
                          onMove={(newStatus) => onMoveProspect(prospect.id, newStatus)}
                          onDelete={() => handleDeleteWithConfirm(prospect)}
                          onView={() => setSelectedProspect(prospect)}
                          onAddContact={(type, notes) =>
                            onAddContact(prospect.id, type, notes)
                          }
                        />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
        </div>
      </div>

      {selectedProspect && (
        <ProspectDetailsModal
          prospect={selectedProspect}
          allStatuses={boardColumns}
          onClose={() => setSelectedProspect(null)}
          onUpdate={(updatedProspect) => {
            onUpdateProspect(selectedProspect.id, updatedProspect);
            setSelectedProspect(updatedProspect);
          }}
          onMove={(newStatus) => {
            onMoveProspect(selectedProspect.id, newStatus);
          }}
          onDelete={() => {
            handleDeleteWithConfirm(selectedProspect);
            setSelectedProspect(null);
          }}
          onAddContact={onAddContact}
          allProspects={prospects}
          onNavigate={(p) => setSelectedProspect(p)}
        />
      )}

      {/* Dialog de confirmation */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        {...confirmConfig}
      />
    </>
  );
}