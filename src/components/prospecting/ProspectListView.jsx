// src/components/prospecting/ProspectListView.jsx
import { useState, useMemo } from "react";
import ProspectDetailsModal from "./ProspectDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { STATUS_CONFIG } from "../../config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, Building2, MapPin, Trash2, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProspectListView({
  prospects,
  onMoveProspect,
  onDeleteProspect,
  onUpdateProspect,
  onAddContact,
  board = null,
}) {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Obtenir les colonnes du tableau
  const boardColumns = useMemo(() => {
    if (!board?.statuses || !Array.isArray(board.statuses)) {
      return [
        { id: "prospect", label: "🆕 Prospects", color: "blue" },
        { id: "contacte", label: "📞 Contactés", color: "yellow" },
        { id: "attente", label: "⏳ En attente", color: "orange" },
        { id: "client", label: "✅ Client", color: "green" },
        { id: "perdu", label: "❌ Perdu", color: "red" }
      ];
    }

    const firstStatus = board.statuses[0];
    if (typeof firstStatus === 'object' && firstStatus !== null) {
      return board.statuses;
    } else {
      return board.statuses.map(status => ({
        id: status,
        label: STATUS_CONFIG[status]?.label || status,
        icon: STATUS_CONFIG[status]?.icon || "📋",
        color: STATUS_CONFIG[status]?.color || "slate"
      }));
    }
  }, [board]);

  // Trier les prospects par date de création (plus récents d'abord)
  const sortedProspects = useMemo(() => {
    return [...prospects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [prospects]);

  // Grouper les prospects par statut
  const groupedProspects = useMemo(() => {
    return boardColumns.map(column => ({
      ...column,
      prospects: sortedProspects.filter(p => p.status === column.id)
    }));
  }, [boardColumns, sortedProspects]);

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

  const handleStatusChange = (prospectId, newStatus) => {
    onMoveProspect(prospectId, newStatus);
    setEditingStatus(null);
  };

  const getStatusColor = (statusId) => {
    const column = boardColumns.find(c => c.id === statusId);
    return column?.color || "slate";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="space-y-6">
        {groupedProspects.map(column => (
          <Card key={column.id}>
            {/* Header de la colonne */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {column.label}
                  <Badge variant="secondary">
                    {column.prospects.length}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>

            {/* Liste des prospects */}
            <CardContent className="pt-0">
              {column.prospects.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">Aucun prospect dans cette étape</p>
                </div>
              ) : (
                <div className="divide-y">
                  {column.prospects.map(prospect => (
                    <div
                      key={prospect.id}
                      className="py-4 hover:bg-muted/50 transition-colors cursor-pointer -mx-6 px-6"
                      onClick={() => setSelectedProspect(prospect)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Informations principales */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium truncate">
                              {prospect.name || prospect.company || "Prospect sans nom"}
                            </h4>
                            {prospect.siret && (
                              <span className="text-xs text-muted-foreground font-mono">
                                SIRET: {prospect.siret}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {prospect.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {prospect.email}
                              </span>
                            )}
                            {prospect.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {prospect.phone}
                              </span>
                            )}
                            {prospect.juridicalForm && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> {prospect.juridicalForm}
                              </span>
                            )}
                          </div>

                          {prospect.address && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {prospect.address}
                            </p>
                          )}
                        </div>

                        {/* Actions et statut */}
                        <div className="flex items-center gap-3 ml-4">
                          {/* Date de création */}
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(prospect.created_at)}
                            </p>
                            {prospect.last_contact && (
                              <p className="text-xs text-primary">
                                Contact: {formatDate(prospect.last_contact)}
                              </p>
                            )}
                          </div>

                          {/* Sélecteur de statut */}
                          <Select
                            value={prospect.status}
                            onValueChange={(value) => handleStatusChange(prospect.id, value)}
                          >
                            <SelectTrigger 
                              className="w-[140px] h-8 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {boardColumns.map(col => (
                                <SelectItem key={col.id} value={col.id}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Actions rapides */}
                          <div className="flex items-center gap-1">
                            {prospect.email && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`mailto:${prospect.email}`, "_blank");
                                }}
                                title={`Envoyer un email à ${prospect.email}`}
                                className="text-purple-500 hover:text-purple-600"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateProspect(prospect.id, {
                                  ...(prospect.contact_count || 0) > 0 ? { last_contact: new Date().toISOString() } : {},
                                  contact_count: (prospect.contact_count || 0) + 1
                                });
                              }}
                              title="Contacter"
                              className="text-primary hover:text-primary/80"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWithConfirm(prospect);
                              }}
                              title="Supprimer"
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de détails du prospect */}
      {selectedProspect && (
        <ProspectDetailsModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdate={(updatedProspect) => {
            onUpdateProspect(selectedProspect.id, updatedProspect);
            setSelectedProspect(updatedProspect);
          }}
          onDelete={() => {
            onDeleteProspect(selectedProspect.id);
            setSelectedProspect(null);
          }}
          onAddContact={onAddContact}
          board={board}
          allProspects={sortedProspects}
          onNavigate={(p) => setSelectedProspect(p)}
        />
      )}

      {/* Dialogue de confirmation */}
      <ConfirmDialog
        isOpen={isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={close}
      />
    </>
  );
}