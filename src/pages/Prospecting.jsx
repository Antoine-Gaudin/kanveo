import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import useProspectingData from "../components/prospecting/useProspectingData";
import useKanbanBoards from "../hooks/useKanbanBoards";
import KanbanBoard from "../components/prospecting/KanbanBoard";
import ProspectListView from "../components/prospecting/ProspectListView";
import ProspectCardView from "../components/prospecting/ProspectCardView";
import ProspectTableView from "../components/prospecting/ProspectTableView";
import KanbanBoardSelector from "../components/prospecting/KanbanBoardSelector";
import ProspectViewSelector from "../components/prospecting/ProspectViewSelector";
import PipelineColumnManager from "../components/prospecting/PipelineColumnManager";
import SearchFilter from "../components/prospecting/SearchFilter";
import BulkActions from "../components/prospecting/BulkActions";
import ManualProspectModal from "../components/prospecting/ManualProspectModal";
import EmailModal from "../components/prospecting/EmailModal";
import { KanbanColumnSkeleton, ProspectingSkeleton } from "../components/skeletons";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  Plus, 
  Settings2, 
  AlertCircle,
  Users,
  LayoutGrid,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Prospecting() {
  const location = useLocation();
  const isFirstMountRef = useRef(true);
  const [newProspectFromSirene, setNewProspectFromSirene] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [filteredProspects, setFilteredProspects] = useState([]);
  const lastProspectsLengthRef = useRef(0);
  const [prospectView, setProspectView] = useState('kanban'); // 'kanban', 'list', 'cards', 'table'
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailProspects, setBulkEmailProspects] = useState([]);
  const { user } = useAuth();
  // Hook pour gérer les tableaux Kanban
  const {
    boards,
    activeBoard,
    loading: boardsLoading,
    error: boardsError,
    createBoard,
    updateBoard,
    deleteBoard,
    setDefaultBoard,
    switchToBoard,
    renameBoard,
    updateBoardStatuses,
    refetch
  } = useKanbanBoards();
  // Forcer le refetch quand on revient sur la page (mais pas au premier montage)
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    if (refetch) {
      refetch();
    }
  }, [location.key]);

  // Hook pour gérer les données de prospection avec le tableau actif
  const {
    prospects,
    addProspect,
    updateProspect,
    deleteProspect,
    moveProspect,
    addContact,
  } = useProspectingData(activeBoard?.id);

  // Initialiser filteredProspects avec tous les prospects par défaut
  // Comparer par longueur + premier ID pour éviter la boucle infinie de références
  useEffect(() => {
    if (prospects === filteredProspects) return;
    if (prospects.length === 0 && filteredProspects.length === 0) return;
    setFilteredProspects(prospects);
    lastProspectsLengthRef.current = prospects.length;
  }, [prospects]);

  // Synchroniser isLoading avec boardsLoading (seulement quand ça change réellement)
  useEffect(() => {
    if (isLoading !== boardsLoading) {
      setIsLoading(boardsLoading);
    }
  }, [boardsLoading]);

  // Fallback : débloquer après 5s max
  useEffect(() => {
    const failsafe = setTimeout(() => {
      setIsLoading(false);
      setShowSkeleton(false);
    }, 5000);
    return () => clearTimeout(failsafe);
  }, []);

  // Simuler le chargement initial avec animation
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Vérifier si un prospect vient de SIRENE
  useEffect(() => {
    const prospectData = sessionStorage.getItem("newProspect");
    if (prospectData) {
      const prospect = JSON.parse(prospectData);
      setNewProspectFromSirene(prospect);
      setShowConfirmation(true);
      sessionStorage.removeItem("newProspect");
    }
  }, []);

  const handleAddProspectFromSirene = () => {
    if (newProspectFromSirene) {
      addProspect(newProspectFromSirene);
      setShowConfirmation(false);
      setNewProspectFromSirene(null);
    }
  };

  const handleAddProspectManually = async (prospectData) => {
    try {
      await addProspect(prospectData);
    } catch (error) {
      throw error;
    }
  };

  const handleBulkAction = async (action) => {
    if (action.type === "move") {
      action.prospectIds.forEach((id) => {
        moveProspect(id, action.data.status);
      });
    } else if (action.type === "delete") {
      const count = action.prospectIds.length;
      if (!window.confirm(`Supprimer ${count} prospect${count > 1 ? 's' : ''} ? Cette action est irréversible.`)) return;
      Promise.all(
        action.prospectIds.map((id) => deleteProspect(id))
      ).catch(() => {});
    } else if (action.type === "email") {
      setBulkEmailProspects(action.prospects || []);
      setShowBulkEmailModal(true);
    }
  };

  // Afficher le skeleton pendant le chargement initial
  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-background -mx-4 -my-8 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <ProspectingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background -mx-4 -my-8 px-4 py-8">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
                      Pipeline Commercial
                    </CardTitle>
                    {/* Sélecteur de tableau Kanban */}
                    <KanbanBoardSelector
                      boards={boards}
                      activeBoard={activeBoard}
                      onBoardSelect={(boardId) => {
                        const board = boards.find(b => b.id === boardId);
                        if (board) {
                          switchToBoard(boardId);
                        }
                      }}
                      onCreateBoard={createBoard}
                      onRenameBoard={renameBoard}
                      onDeleteBoard={deleteBoard}
                      onSetDefaultBoard={setDefaultBoard}
                      loading={boardsLoading}
                    />
                  </div>
                  <CardDescription className="text-base mt-1">
                    Gérez vos prospects à travers les étapes du pipeline
                  </CardDescription>
                  {activeBoard && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {activeBoard.name}
                      </Badge>
                      {activeBoard.is_default && (
                        <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                          <Star className="h-3 w-3 mr-1" />
                          Par défaut
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <ProspectViewSelector
                  currentView={prospectView}
                  onViewChange={setProspectView}
                />
                
                <Button
                  onClick={() => setShowManualForm(true)}
                  disabled={!activeBoard}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau prospect
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Actions pipeline */}
            {activeBoard && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {prospects?.length || 0} prospect{(prospects?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColumnManager(true)}
                  className="gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  Gérer les colonnes
                </Button>
              </div>
            )}

            {boardsError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erreur lors du chargement des tableaux : {boardsError}
                </AlertDescription>
              </Alert>
            )}

            {/* Stats par colonne */}
            {activeBoard && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                {(() => {
                  const columns = activeBoard.statuses || [];
                  const isNewFormat = columns.length > 0 && typeof columns[0] === 'object';

                  if (isNewFormat) {
                    return columns.map((column) => (
                      <div key={column.id} className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-primary">
                          {filteredProspects.filter(p => p.status === column.id).length}
                        </p>
                        <p className="text-sm text-muted-foreground">{column.icon} {column.label}</p>
                      </div>
                    ));
                  } else {
                    const statusLabels = {
                      "prospect": "🆕 Prospects",
                      "contacte": "📞 Contactés",
                      "attente": "⏳ En attente",
                      "client": "✅ Client",
                      "perdu": "❌ Perdu"
                    };

                    return columns.map((status) => {
                      const label = statusLabels[status] || `📋 ${status}`;
                      return (
                        <div key={status} className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-primary">
                            {filteredProspects.filter(p => p.status === status).length}
                          </p>
                          <p className="text-sm text-muted-foreground">{label}</p>
                        </div>
                      );
                    });
                  }
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Prospect Modal */}
      {showManualForm && (
        <ManualProspectModal
          onClose={() => setShowManualForm(false)}
          onAddProspect={handleAddProspectManually}
        />
      )}

      {/* Pipeline Column Manager */}
      {showColumnManager && activeBoard && (
        <PipelineColumnManager
          board={activeBoard}
          onUpdateBoard={updateBoard}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {/* Message si aucun tableau n'est sélectionné */}
      {!activeBoard && !boardsLoading && (
        <div className="max-w-7xl mx-auto relative z-10">
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Aucun tableau sélectionné</h2>
              <p className="text-muted-foreground max-w-md">
                Créez un nouveau tableau ou sélectionnez un tableau existant pour commencer à gérer vos prospects.
              </p>
              <div className="mt-4">
                <KanbanBoardSelector
                  boards={boards}
                  activeBoard={activeBoard}
                  onBoardSelect={(boardId) => {
                    const board = boards.find(b => b.id === boardId);
                    if (board) {
                      switchToBoard(boardId);
                    }
                  }}
                  onCreateBoard={createBoard}
                  onRenameBoard={renameBoard}
                  onDeleteBoard={deleteBoard}
                  onSetDefaultBoard={setDefaultBoard}
                  loading={boardsLoading}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && newProspectFromSirene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">Ajouter au Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              {/* Header Info - SIRENE Data */}
              <div className="bg-primary rounded-lg p-6 text-primary-foreground">
                <h3 className="text-2xl font-bold mb-2">{newProspectFromSirene.company || "Entreprise"}</h3>
                {newProspectFromSirene.siret && (
                  <p className="text-primary-foreground/80 font-mono">SIRET: {newProspectFromSirene.siret}</p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {newProspectFromSirene.juridicalForm && (
                    <div>
                      <p className="text-primary-foreground/70 text-sm">Forme juridique</p>
                      <p className="font-semibold">{newProspectFromSirene.juridicalForm}</p>
                    </div>
                  )}
                  {newProspectFromSirene.creationDate && (
                    <div>
                      <p className="text-primary-foreground/70 text-sm">Date de création</p>
                      <p className="font-semibold">{newProspectFromSirene.creationDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SIRENE Details */}
              <div className="space-y-4">
                {newProspectFromSirene.address && (
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-muted-foreground text-sm mb-2">📍 Adresse</p>
                    <p className="text-foreground">{newProspectFromSirene.address}</p>
                  </div>
                )}
                
                {newProspectFromSirene.activityLabel && (
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-muted-foreground text-sm mb-2">💼 Secteur d'Activité</p>
                    <div className="space-y-1">
                      {newProspectFromSirene.activityCode && (
                        <p className="text-muted-foreground text-sm">
                          Code APE: <span className="text-primary font-semibold">{newProspectFromSirene.activityCode}</span>
                        </p>
                      )}
                      <p className="text-foreground font-semibold">{newProspectFromSirene.activityLabel}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground mb-3 text-sm font-semibold">
                  Les informations de contact peuvent être remplies plus tard :
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📧 Email: <span className="text-foreground">{newProspectFromSirene.email || "Non spécifié"}</span></p>
                  <p>📱 Téléphone: <span className="text-foreground">{newProspectFromSirene.phone || "Non spécifié"}</span></p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowConfirmation(false);
                    setNewProspectFromSirene(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddProspectFromSirene}
                >
                  ✓ Ajouter au Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban Board - uniquement si un tableau est actif */}
      {activeBoard && (
        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          {isLoading || boardsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
              <KanbanColumnSkeleton />
            </div>
          ) : (
            <>
              {/* Filtres et actions pour toutes les vues */}
              <div className="space-y-4">
                <SearchFilter prospects={prospects} onFilter={setFilteredProspects} statuses={activeBoard?.statuses} />
                <BulkActions
                  prospects={prospects}
                  onBulkAction={handleBulkAction}
                  statuses={activeBoard?.statuses}
                />
              </div>

              {/* Afficher la vue sélectionnée */}
              {prospectView === 'kanban' && (
                <KanbanBoard
                  prospects={filteredProspects}
                  onMoveProspect={moveProspect}
                  onDeleteProspect={deleteProspect}
                  onUpdateProspect={updateProspect}
                  onAddContact={addContact}
                  board={activeBoard}
                />
              )}

              {prospectView === 'list' && (
                <ProspectListView
                  prospects={filteredProspects}
                  onMoveProspect={moveProspect}
                  onDeleteProspect={deleteProspect}
                  onUpdateProspect={updateProspect}
                  onAddContact={addContact}
                  board={activeBoard}
                />
              )}

              {prospectView === 'cards' && (
                <ProspectCardView
                  prospects={filteredProspects}
                  onMoveProspect={moveProspect}
                  onDeleteProspect={deleteProspect}
                  onUpdateProspect={updateProspect}
                  onAddContact={addContact}
                  board={activeBoard}
                />
              )}

              {prospectView === 'table' && (
                <ProspectTableView
                  prospects={filteredProspects}
                  onMoveProspect={moveProspect}
                  onDeleteProspect={deleteProspect}
                  onUpdateProspect={updateProspect}
                  onAddContact={addContact}
                  board={activeBoard}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>

    {/* Modal email groupé */}
    <EmailModal
      open={showBulkEmailModal}
      onOpenChange={setShowBulkEmailModal}
      prospects={bulkEmailProspects}
      boards={boards}
      allProspects={prospects}
      activeBoard={activeBoard}
    />
    </>
  );
}
