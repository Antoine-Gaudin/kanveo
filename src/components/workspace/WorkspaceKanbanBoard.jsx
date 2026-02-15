import { useState, useMemo } from "react";
import ProspectCard from "../prospecting/ProspectCard";
import ProspectDetailsModal from "../prospecting/ProspectDetailsModal";
import Toast from "../Toast";
import { STATUSES, STATUS_CONFIG } from "../../config/constants";
import { supabase } from "../../lib/supabaseClient";

export default function WorkspaceKanbanBoard({ prospects = [], onProspectUpdate }) {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [draggedProspect, setDraggedProspect] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [toast, setToast] = useState(null);

  // Calcul des stats par status
  const statusStats = useMemo(() => {
    const stats = {};
    STATUSES.forEach((status) => {
      const statusProspects = prospects.filter((p) => p.status === status);
      const withContacts = statusProspects.filter((p) => p.contacts && p.contacts.length > 0).length;
      const noContacts = statusProspects.length - withContacts;
      
      stats[status] = {
        total: statusProspects.length,
        withContacts,
        noContacts,
        avgDays: statusProspects.length > 0 
          ? Math.round(
              statusProspects.reduce((sum, p) => {
                const lastContact = p.contacts?.[p.contacts.length - 1];
                const refDate = lastContact ? new Date(lastContact.date) : new Date(p.createdAt);
                const days = Math.floor((new Date() - refDate) / (1000 * 60 * 60 * 24));
                return sum + days;
              }, 0) / statusProspects.length
            )
          : 0
      };
    });
    return stats;
  }, [prospects]);

  // Fonction pour gérer le drag start
  const handleDragStart = (e, prospect) => {
    setDraggedProspect(prospect);
    e.dataTransfer.effectAllowed = "move";
  };

  // Fonction pour gérer le drag over
  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  // Fonction pour gérer le drag leave
  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  // Fonction pour gérer le drop
  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverStatus(null);

    if (!draggedProspect || draggedProspect.status === targetStatus) {
      setDraggedProspect(null);
      return;
    }

    try {
      // Mettre à jour dans Supabase
      const { error } = await supabase
        .from("prospects")
        .update({ status: targetStatus })
        .eq("id", draggedProspect.id);

      if (error) throw error;

      // Notifier le parent de la mise à jour
      if (onProspectUpdate) {
        onProspectUpdate({ ...draggedProspect, status: targetStatus });
      }

      setToast({
        type: "success",
        message: `Prospect déplacé vers "${targetStatus}"`,
      });
    } catch (err) {
      setToast({
        type: "error",
        message: "Erreur lors du déplacement du prospect",
      });
    }

    setDraggedProspect(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 auto-rows-max">
        {STATUSES.map((status) => {
          const statusProspects = prospects.filter((p) => p.status === status);
          const config = STATUS_CONFIG[status];
          const stats = statusStats[status];
          const isDropTarget = dragOverStatus === status;

          return (
            <div key={status} className="flex flex-col h-screen sticky top-0">
              {/* Column Header */}
              <div className={`rounded-t-lg px-6 py-4 border-b-2 border-border ${config.header}`}>
                {/* Main Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                    <span>{config.icon}</span>
                    {status}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${config.badge}`}>
                    {statusProspects.length}
                  </div>
                </div>

                {/* Stats Line */}
                {statusProspects.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-t border-border/30 pt-2">
                    <div className="flex gap-3">
                      <span title="Avec contacts">
                        ✓ {stats.withContacts}
                      </span>
                      <span title="Sans contact" className="text-amber-500">
                        ⚠️ {stats.noContacts}
                      </span>
                      <span title="Jours moyens" className="text-muted-foreground">
                        ⏱️ {stats.avgDays}j
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cards Container */}
              <div
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex-1 rounded-b-lg border-2 border-border border-t-0 bg-card/50 p-4 space-y-3 overflow-y-auto transition-all ${
                  isDropTarget ? "border-border bg-muted/30" : ""
                } ${draggedProspect ? "cursor-grabbing" : ""}`}
              >
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
                        allStatuses={STATUSES}
                        onView={() => setSelectedProspect(prospect)}
                        isReadOnly={false}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProspect && (
        <ProspectDetailsModal
          prospect={selectedProspect}
          allStatuses={STATUSES}
          onClose={() => setSelectedProspect(null)}
          isReadOnly={false}
          allProspects={prospects}
          onNavigate={(p) => setSelectedProspect(p)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
