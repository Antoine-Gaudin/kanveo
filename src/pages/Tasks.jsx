// src/pages/Tasks.jsx
import { useState, useEffect, useMemo } from "react";
import { isTaskOverdue } from "../utils/task-dates";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { useConfirm } from "../hooks/useConfirm";
import useTaskBoards from "../hooks/useTaskBoards";
import useTasks from "../hooks/useTasks";
import KanbanTaskBoard from "../components/tasks/KanbanTaskBoard";
import TaskListView from "../components/tasks/TaskListView";
import TaskTableView from "../components/tasks/TaskTableView";
import TaskCardView from "../components/tasks/TaskCardView";
import TaskTodoView from "../components/tasks/TaskTodoView";
import TaskViewSelector from "../components/tasks/TaskViewSelector";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import TaskColumnManager from "../components/tasks/TaskColumnManager";
import ConfirmDialog from "../components/ConfirmDialog";
import { KanbanColumnSkeleton } from "../components/skeletons";
import { DEFAULT_TASK_COLUMNS, COLOR_KPI_MAP } from "../config/taskConstants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ListTodo,
  Plus,
  AlertCircle,
  Layers,
  MoreVertical,
  Pencil,
  Trash2,
  FolderPlus,
  Columns3,
  Download,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Tasks() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isOpen: confirmOpen, confirmConfig, confirm, close: closeConfirm } = useConfirm();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [taskView, setTaskView] = useState(() => localStorage.getItem('kanveo_task_view') || 'kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Board management state
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showRenameBoard, setShowRenameBoard] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [renameBoardId, setRenameBoardId] = useState(null);
  const [renameBoardName, setRenameBoardName] = useState('');

  const {
    boards: taskBoards,
    activeBoard,
    loading: boardsLoading,
    error: boardsError,
    createBoard,
    renameBoard,
    deleteBoard,
    switchToBoard,
    updateBoardStatuses,
  } = useTaskBoards();

  // Charger les tâches du board actif
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask: removeTask,
    deleteMultipleTasks,
    changeTaskStatus,
    loading: tasksLoading,
  } = useTasks(
    user?.id,
    null,
    activeBoard?.id || null
  );

  // Skeleton timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const failsafe = setTimeout(() => setShowSkeleton(false), 5000);
    return () => clearTimeout(failsafe);
  }, []);

  // Persistance de la vue
  const handleViewChange = (view) => {
    setTaskView(view);
    localStorage.setItem('kanveo_task_view', view);
  };

  // Filtrage global (recherche + priorité)
  const filteredTasks = useMemo(() => {
    let result = tasks || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, searchQuery, priorityFilter]);

  // Stats dynamiques basées sur les colonnes du board
  const stats = useMemo(() => {
    const t = filteredTasks;
    const cols = activeBoard?.statuses;
    const resolvedCols = (cols && Array.isArray(cols) && cols.length > 0 && typeof cols[0] === 'object')
      ? cols
      : DEFAULT_TASK_COLUMNS;
    const columnStats = resolvedCols.map(col => ({
      id: col.id,
      label: col.label,
      icon: col.icon,
      color: col.color,
      count: t.filter(x => x.status === col.id).length,
    }));
    const overdue = t.filter(x => isTaskOverdue(x)).length;
    return { total: t.length, columns: columnStats, overdue };
  }, [filteredTasks, activeBoard?.statuses]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowCreateTask(true);
      }
      const viewKeys = { '1': 'kanban', '2': 'todo', '3': 'list', '4': 'cards', '5': 'table' };
      if (viewKeys[e.key] && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleViewChange(viewKeys[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Options de statut dérivées du board actif (pour les modales)
  const statusOptions = useMemo(() => {
    const cols = activeBoard?.statuses;
    if (!cols || cols.length === 0) return [];
    return cols.map(c => ({ value: c.id, label: c.label, icon: c.icon || '' }));
  }, [activeBoard?.statuses]);

  // === Board management handlers ===
  const handleCreateBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    try {
      const newBoard = await createBoard(name);
      switchToBoard(newBoard.id);
      setShowCreateBoard(false);
      setNewBoardName('');
      addToast(`Board "${name}" créé`, "success");
    } catch (error) {
      addToast("❌ Erreur lors de la création du board", "error");
    }
  };

  const handleRenameBoard = async () => {
    const name = renameBoardName.trim();
    if (!name || !renameBoardId) return;
    try {
      await renameBoard(renameBoardId, name);
      setShowRenameBoard(false);
      setRenameBoardId(null);
      setRenameBoardName('');
      addToast("Board renommé", "success");
    } catch (error) {
      addToast("❌ Erreur lors du renommage", "error");
    }
  };

  const handleDeleteBoard = (board) => {
    confirm({
      title: "Supprimer ce board ?",
      message: `Supprimer "${board.name}" et toutes ses tâches ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteBoard(board.id);
          addToast(`Board "${board.name}" supprimé`, "success");
        } catch (error) {
          addToast("❌ Erreur lors de la suppression", "error");
        }
      }
    });
  };

  const openRenameDialog = (board) => {
    setRenameBoardId(board.id);
    setRenameBoardName(board.name);
    setShowRenameBoard(true);
  };

  // === Task handlers ===
  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      addToast("Tâche créée avec succès", "success");
    } catch (error) {
      addToast("❌ Erreur lors de la création de la tâche", "error");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await updateTask(taskId, updates);
    } catch (error) {
      addToast("❌ Erreur lors de la mise à jour", "error");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await removeTask(taskId);
      addToast("Tâche supprimée", "success");
    } catch (error) {
      addToast("❌ Erreur lors de la suppression", "error");
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      await changeTaskStatus(taskId, newStatus);
    } catch (error) {
      addToast("❌ Erreur lors du déplacement", "error");
    }
  };

  const handleDuplicateTask = async (taskData) => {
    try {
      await createTask({
        title: `${taskData.title} (copie)`,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        userId: user.id,
        boardId: activeBoard?.id || null,
        workspaceId: null,
        dueDate: taskData.due_date ? new Date(taskData.due_date).toISOString() : null,
      });
      addToast("Tâche dupliquée", "success");
    } catch {
      addToast("❌ Erreur lors de la duplication", "error");
    }
  };

  const handleDeleteMultipleTasks = async (taskIds) => {
    try {
      await deleteMultipleTasks(taskIds);
      addToast(`${taskIds.length} tâche(s) supprimée(s)`, "success");
    } catch {
      addToast("❌ Erreur lors de la suppression", "error");
    }
  };

  const handleExportCSV = () => {
    const t = filteredTasks;
    if (t.length === 0) {
      addToast("Aucune tâche à exporter", "error");
      return;
    }
    const headers = ['Titre', 'Description', 'Statut', 'Priorité', 'Date échéance', 'Créé le'];
    const rows = t.map(task => [
      task.title || '',
      (task.description || '').replace(/"/g, '""'),
      task.status || '',
      task.priority || '',
      task.due_date ? new Date(task.due_date + 'T12:00:00').toLocaleDateString('fr-FR') : '',
      task.created_at ? new Date(task.created_at).toLocaleDateString('fr-FR') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taches_${activeBoard?.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`${t.length} tâche(s) exportée(s)`, "success");
  };

  // === Column management handlers ===
  const handleColumnAdd = async (newCol) => {
    if (!activeBoard) return;
    try {
      const currentStatuses = activeBoard.statuses || [];
      // Vérifier l'ID unique
      if (currentStatuses.some(c => c.id === newCol.id)) {
        addToast("❌ Une colonne avec cet ID existe déjà", "error");
        return;
      }
      await updateBoardStatuses(activeBoard.id, [...currentStatuses, newCol]);
      addToast(`Colonne "${newCol.label}" ajoutée`, "success");
    } catch {
      addToast("❌ Erreur lors de l'ajout de la colonne", "error");
    }
  };

  const handleColumnUpdate = async (colId, updatedCol) => {
    if (!activeBoard) return;
    try {
      const updated = (activeBoard.statuses || []).map(c => c.id === colId ? updatedCol : c);
      await updateBoardStatuses(activeBoard.id, updated);
      addToast("Colonne mise à jour", "success");
    } catch {
      addToast("❌ Erreur lors de la mise à jour de la colonne", "error");
    }
  };

  const handleColumnDelete = async (colId) => {
    if (!activeBoard) return;
    try {
      const filtered = (activeBoard.statuses || []).filter(c => c.id !== colId);
      await updateBoardStatuses(activeBoard.id, filtered);
      addToast("Colonne supprimée", "success");
    } catch {
      addToast("❌ Erreur lors de la suppression de la colonne", "error");
    }
  };

  const handleColumnMove = async (colId, direction) => {
    if (!activeBoard) return;
    try {
      const statuses = [...(activeBoard.statuses || [])];
      const idx = statuses.findIndex(c => c.id === colId);
      if (idx < 0) return;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= statuses.length) return;
      [statuses[idx], statuses[target]] = [statuses[target], statuses[idx]];
      await updateBoardStatuses(activeBoard.id, statuses);
    } catch {
      addToast("❌ Erreur lors du déplacement de la colonne", "error");
    }
  };

  const isLoading = showSkeleton || boardsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background -mx-4 -my-8 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-32 rounded-lg bg-muted/50 animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KanbanColumnSkeleton />
            <KanbanColumnSkeleton />
            <KanbanColumnSkeleton />
            <KanbanColumnSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background -mx-4 -my-8 px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <ListTodo className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
                    Mes Tâches
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Gérez vos tâches avec des boards indépendants
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Sélecteur de board */}
                <div className="flex items-center gap-1">
                  {taskBoards.length > 0 && (
                    <Select
                      value={activeBoard?.id || ''}
                      onValueChange={(id) => switchToBoard(id)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <Layers className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Sélectionner un board" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskBoards.map(board => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Menu de gestion du board */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowCreateBoard(true)}>
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Nouveau board
                      </DropdownMenuItem>
                      {activeBoard && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openRenameDialog(activeBoard)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Renommer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowColumnManager(true)}>
                            <Columns3 className="w-4 h-4 mr-2" />
                            Gérer les colonnes
                          </DropdownMenuItem>
                          {taskBoards.length > 1 && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteBoard(activeBoard)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <TaskViewSelector currentView={taskView} onViewChange={handleViewChange} />

                <Button
                  onClick={() => setShowCreateTask(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle tâche
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* KPIs dynamiques */}
            <div className="flex flex-wrap gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50 flex-1 min-w-[80px]">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              {stats.columns.map(col => {
                const colors = COLOR_KPI_MAP[col.color] || COLOR_KPI_MAP.slate;
                return (
                  <div key={col.id} className={cn("text-center p-3 rounded-lg flex-1 min-w-[80px]", colors.bg)}>
                    <p className={cn("text-2xl font-bold", colors.text)}>{col.count}</p>
                    <p className="text-xs text-muted-foreground">{col.label}</p>
                  </div>
                );
              })}
              <div className={cn(
                "text-center p-3 rounded-lg flex-1 min-w-[80px]",
                stats.overdue > 0
                  ? "bg-orange-500/10 border border-orange-500/20"
                  : "bg-muted/50"
              )}>
                <p className={cn(
                  "text-2xl font-bold",
                  stats.overdue > 0 ? "text-orange-500" : "text-muted-foreground"
                )}>{stats.overdue}</p>
                <p className={cn(
                  "text-xs",
                  stats.overdue > 0 ? "text-orange-500" : "text-muted-foreground"
                )}>En retard</p>
              </div>
            </div>

            {/* Recherche, filtres & export */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une tâche... (n: nouvelle, 1-5: vues)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  <SelectItem value="high">🟠 Haute</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="low">🟢 Basse</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </div>

            {boardsError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erreur lors du chargement : {boardsError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Vues des tâches */}
        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KanbanColumnSkeleton />
            <KanbanColumnSkeleton />
            <KanbanColumnSkeleton />
            <KanbanColumnSkeleton />
          </div>
        ) : (
          <>
            {taskView === 'kanban' && (
              <KanbanTaskBoard
                tasks={filteredTasks}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                onCreateTask={() => setShowCreateTask(true)}
                onQuickCreateTask={handleCreateTask}
                onDuplicateTask={handleDuplicateTask}
                boardId={activeBoard?.id || null}
                workspaceId={null}
                columns={activeBoard?.statuses || null}
                onColumnAdd={handleColumnAdd}
                onColumnUpdate={handleColumnUpdate}
                onColumnDelete={handleColumnDelete}
                onColumnMove={handleColumnMove}
              />
            )}

            {taskView === 'todo' && (
              <TaskTodoView
                tasks={filteredTasks}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                onQuickCreateTask={handleCreateTask}
                onDuplicateTask={handleDuplicateTask}
                columns={activeBoard?.statuses || null}
                statusOptions={statusOptions}
              />
            )}

            {taskView === 'list' && (
              <TaskListView
                tasks={filteredTasks}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                onQuickCreateTask={handleCreateTask}
                onDuplicateTask={handleDuplicateTask}
                onDeleteMultiple={handleDeleteMultipleTasks}
                columns={activeBoard?.statuses || null}
                statusOptions={statusOptions}
              />
            )}

            {taskView === 'cards' && (
              <TaskCardView
                tasks={filteredTasks}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                onQuickCreateTask={handleCreateTask}
                onDuplicateTask={handleDuplicateTask}
                columns={activeBoard?.statuses || null}
                statusOptions={statusOptions}
              />
            )}

            {taskView === 'table' && (
              <TaskTableView
                tasks={filteredTasks}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                onQuickCreateTask={handleCreateTask}
                onDuplicateTask={handleDuplicateTask}
                onDeleteMultiple={handleDeleteMultipleTasks}
                columns={activeBoard?.statuses || null}
                statusOptions={statusOptions}
              />
            )}
          </>
        )}
      </div>

      {/* Modal création de tâche */}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreate={handleCreateTask}
          boardId={activeBoard?.id || null}
          workspaceId={null}
          columns={activeBoard?.statuses || null}
        />
      )}

      {/* Dialog création de board */}
      <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau board de tâches</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Nom du board..."
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateBoard(false); setNewBoardName(''); }}>
              Annuler
            </Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
              <FolderPlus className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog renommage de board */}
      <Dialog open={showRenameBoard} onOpenChange={setShowRenameBoard}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer le board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Nouveau nom..."
              value={renameBoardName}
              onChange={(e) => setRenameBoardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameBoard()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowRenameBoard(false); setRenameBoardId(null); }}>
              Annuler
            </Button>
            <Button onClick={handleRenameBoard} disabled={!renameBoardName.trim()}>
              <Pencil className="w-4 h-4 mr-2" />
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column manager */}
      {showColumnManager && activeBoard && (
        <TaskColumnManager
          board={activeBoard}
          onSave={async (boardId, columns) => {
            try {
              await updateBoardStatuses(boardId, columns);
              addToast("Colonnes mises à jour", "success");
            } catch {
              addToast("❌ Erreur lors de la mise à jour des colonnes", "error");
              throw new Error();
            }
          }}
          onClose={() => setShowColumnManager(false)}
        />
      )}

      {/* Dialog de confirmation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={closeConfirm}
        {...confirmConfig}
      />
    </div>
  );
}
