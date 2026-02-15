// src/components/tasks/KanbanTaskBoard.jsx
import { useState, useMemo, useCallback } from "react";
import { isTaskOverdue, parseDateOnly, getLocalDateString } from "../../utils/task-dates";
import TaskCard from "./TaskCard";
import TaskDetailsModal from "./TaskDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Zap,
  Ban,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Plus,
  Filter,
  ArrowUpDown,
  ArrowUp,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowDown,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INLINE_COLOR_OPTIONS = [
  { value: "slate", class: "bg-slate-500" },
  { value: "blue", class: "bg-blue-500" },
  { value: "red", class: "bg-red-500" },
  { value: "green", class: "bg-green-500" },
  { value: "purple", class: "bg-purple-500" },
  { value: "amber", class: "bg-amber-500" },
  { value: "pink", class: "bg-pink-500" },
  { value: "indigo", class: "bg-indigo-500" },
  { value: "cyan", class: "bg-cyan-500" },
  { value: "orange", class: "bg-orange-500" },
];

const INLINE_ICON_OPTIONS = [
  "📋", "⚡", "❌", "✅", "🔥", "⏳", "📅",
  "🆕", "📞", "💼", "🎯", "🚀", "⭐",
  "📊", "💰", "🔔", "💡", "🎉", "📈", "🏆"
];

// Configuration des statuts de tâches — fallback par défaut
const DEFAULT_TASK_STATUSES = [
  {
    id: 'todo',
    label: 'À faire',
    icon: FileText,
    color: 'slate',
    headerClass: 'border-l-4 border-muted-foreground bg-muted/50',
    badgeClass: 'bg-muted-foreground/20 text-muted-foreground',
    containerClass: 'bg-muted/30'
  },
  {
    id: 'in_progress',
    label: 'En cours',
    icon: Zap,
    color: 'blue',
    headerClass: 'border-l-4 border-primary bg-primary/20',
    badgeClass: 'bg-primary/30 text-primary',
    containerClass: 'bg-primary/5'
  },
  {
    id: 'blocked',
    label: 'Bloqué',
    icon: Ban,
    color: 'red',
    headerClass: 'border-l-4 border-destructive bg-destructive/20',
    badgeClass: 'bg-destructive/30 text-destructive',
    containerClass: 'bg-destructive/5'
  },
  {
    id: 'done',
    label: 'Terminé',
    icon: CheckCircle2,
    color: 'green',
    headerClass: 'border-l-4 border-green-500 bg-green-500/20',
    badgeClass: 'bg-green-500/30 text-green-500',
    containerClass: 'bg-green-500/5'
  }
];

// Palette de couleurs pour mapper le champ `color` des colonnes dynamiques
const COLOR_MAP = {
  slate:  { headerClass: 'border-l-4 border-muted-foreground bg-muted/50', badgeClass: 'bg-muted-foreground/20 text-muted-foreground', containerClass: 'bg-muted/30' },
  blue:   { headerClass: 'border-l-4 border-primary bg-primary/20', badgeClass: 'bg-primary/30 text-primary', containerClass: 'bg-primary/5' },
  red:    { headerClass: 'border-l-4 border-destructive bg-destructive/20', badgeClass: 'bg-destructive/30 text-destructive', containerClass: 'bg-destructive/5' },
  green:  { headerClass: 'border-l-4 border-green-500 bg-green-500/20', badgeClass: 'bg-green-500/30 text-green-500', containerClass: 'bg-green-500/5' },
  purple: { headerClass: 'border-l-4 border-purple-500 bg-purple-500/20', badgeClass: 'bg-purple-500/30 text-purple-500', containerClass: 'bg-purple-500/5' },
  amber:  { headerClass: 'border-l-4 border-amber-500 bg-amber-500/20', badgeClass: 'bg-amber-500/30 text-amber-500', containerClass: 'bg-amber-500/5' },
  pink:   { headerClass: 'border-l-4 border-pink-500 bg-pink-500/20', badgeClass: 'bg-pink-500/30 text-pink-500', containerClass: 'bg-pink-500/5' },
  indigo: { headerClass: 'border-l-4 border-indigo-500 bg-indigo-500/20', badgeClass: 'bg-indigo-500/30 text-indigo-500', containerClass: 'bg-indigo-500/5' },
  cyan:   { headerClass: 'border-l-4 border-cyan-500 bg-cyan-500/20', badgeClass: 'bg-cyan-500/30 text-cyan-500', containerClass: 'bg-cyan-500/5' },
  orange: { headerClass: 'border-l-4 border-orange-500 bg-orange-500/20', badgeClass: 'bg-orange-500/30 text-orange-500', containerClass: 'bg-orange-500/5' },
};

// Icônes emoji → lucide fallback
const ICON_MAP = {
  '📋': FileText,
  '⚡': Zap,
  '❌': Ban,
  '✅': CheckCircle2,
  '🔥': AlertCircle,
  '⏳': Clock,
  '📅': Calendar,
};

// Convertir les colonnes DB (format riche {id, label, icon, color}) en format UI
function resolveColumns(boardStatuses) {
  if (!boardStatuses || !Array.isArray(boardStatuses) || boardStatuses.length === 0) {
    return DEFAULT_TASK_STATUSES;
  }

  // Si format ancien (tableau de strings), utiliser le fallback
  if (typeof boardStatuses[0] === 'string') {
    return DEFAULT_TASK_STATUSES;
  }

  // Format riche : mapper vers les classes CSS
  return boardStatuses.map(col => {
    const colorClasses = COLOR_MAP[col.color] || COLOR_MAP.slate;
    const IconComponent = ICON_MAP[col.icon] || FileText;

    return {
      id: col.id,
      label: col.label,
      icon: IconComponent,
      color: col.color || 'slate',
      ...colorClasses,
    };
  });
}

export default function KanbanTaskBoard({
  tasks = [],
  onMoveTask,
  onDeleteTask,
  onUpdateTask,
  onCreateTask,
  onQuickCreateTask,
  boardId = null,
  workspaceId = null,
  compact = false,
  columns = null,
  onColumnAdd,
  onColumnUpdate,
  onColumnDelete,
  onColumnMove,
  onDuplicateTask,
}) {
  // Résoudre les colonnes à afficher
  const resolvedColumns = useMemo(() => resolveColumns(columns), [columns]);
  const canManageColumns = !!(onColumnAdd && onColumnUpdate && onColumnDelete && onColumnMove);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [filter, setFilter] = useState('all');
  const [inlineInputs, setInlineInputs] = useState({});
  const [sortConfig, setSortConfig] = useState({});
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Inline column editing state
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editColumnLabel, setEditColumnLabel] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [newColumnIcon, setNewColumnIcon] = useState('📋');
  const [newColumnColor, setNewColumnColor] = useState('slate');
  const [showEditDialog, setShowEditDialog] = useState(null); // column id
  const [editDialogIcon, setEditDialogIcon] = useState('📋');
  const [editDialogColor, setEditDialogColor] = useState('slate');

  // Column management handlers
  const handleStartRenameColumn = (col) => {
    setEditingColumnId(col.id);
    setEditColumnLabel(col.label);
  };

  const handleConfirmRenameColumn = () => {
    if (!editingColumnId || !editColumnLabel.trim()) return;
    const col = columns?.find(c => c.id === editingColumnId);
    if (col && onColumnUpdate) {
      onColumnUpdate(editingColumnId, { ...col, label: editColumnLabel.trim() });
    }
    setEditingColumnId(null);
    setEditColumnLabel('');
  };

  const handleDeleteColumn = (colId) => {
    if (!onColumnDelete) return;
    const col = columns?.find(c => c.id === colId);
    confirm({
      title: "Supprimer cette colonne ?",
      message: `Voulez-vous vraiment supprimer la colonne "${col?.label || colId}" ? Les tâches dans cette colonne devront être déplacées.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => onColumnDelete(colId)
    });
  };

  const handleAddColumn = () => {
    const label = newColumnLabel.trim();
    if (!label || !onColumnAdd) return;
    const id = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || `col_${Date.now()}`;
    onColumnAdd({ id, label, icon: newColumnIcon, color: newColumnColor });
    setNewColumnLabel('');
    setNewColumnIcon('📋');
    setNewColumnColor('slate');
    setShowAddColumn(false);
  };

  const handleOpenEditDialog = (col) => {
    const rawCol = columns?.find(c => c.id === col.id);
    setShowEditDialog(col.id);
    setEditDialogIcon(rawCol?.icon || '📋');
    setEditDialogColor(rawCol?.color || col.color || 'slate');
  };

  const handleSaveEditDialog = () => {
    if (!showEditDialog || !onColumnUpdate) return;
    const col = columns?.find(c => c.id === showEditDialog);
    if (col) {
      onColumnUpdate(showEditDialog, { ...col, icon: editDialogIcon, color: editDialogColor });
    }
    setShowEditDialog(null);
  };

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;

    const todayStr = getLocalDateString();

    return tasks.filter(task => {
      const dueDateStr = parseDateOnly(task.due_date);
      switch (filter) {
        case 'urgent':
          return task.priority === 'urgent';
        case 'overdue':
          return dueDateStr && dueDateStr < todayStr && task.status !== 'done';
        case 'today':
          return dueDateStr === todayStr;
        default:
          return true;
      }
    });
  }, [tasks, filter]);

  // Calcul des stats par colonne
  const statusStats = useMemo(() => {
    const stats = {};
    resolvedColumns.forEach((status) => {
      const statusTasks = filteredTasks.filter((t) => t.status === status.id);
      const urgent = statusTasks.filter(t => t.priority === 'urgent').length;
      const overdue = statusTasks.filter(t => isTaskOverdue(t)).length;

      stats[status.id] = {
        total: statusTasks.length,
        urgent,
        overdue
      };
    });
    return stats;
  }, [filteredTasks, resolvedColumns]);

  // Tri des tâches par colonne
  const sortTasks = useCallback((tasksToSort, statusId) => {
    const sort = sortConfig[statusId];
    if (!sort) return tasksToSort;

    return [...tasksToSort].sort((a, b) => {
      if (sort === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      }
      if (sort === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return 0;
    });
  }, [sortConfig]);

  // Inline quick task creation
  const handleInlineCreate = async (statusId) => {
    const title = (inlineInputs[statusId] || '').trim();
    if (!title || !onQuickCreateTask) return;
    try {
      await onQuickCreateTask({ title, status: statusId });
      setInlineInputs(prev => ({ ...prev, [statusId]: '' }));
    } catch (e) {
      // handled by parent
    }
  };

  const handleDeleteWithConfirm = (task) => {
    confirm({
      title: "Supprimer cette tâche ?",
      message: `Voulez-vous vraiment supprimer "${task.title}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => onDeleteTask(task.id)
    });
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    // Add visual feedback via class after a tick
    requestAnimationFrame(() => {
      e.target.classList.add('opacity-50');
    });
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedTask(null);
    setDragOverStatus(null);
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

    if (draggedTask && draggedTask.status !== targetStatus) {
      onMoveTask(draggedTask.id, targetStatus);
    }
    setDraggedTask(null);
  };

  // Label du filtre actif (pour mobile dropdown)
  const filterLabel = {
    all: 'Tout',
    urgent: 'Urgent',
    overdue: 'En retard',
    today: "Aujourd'hui"
  }[filter];

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Filtres — Desktop */}
          <div className="hidden md:flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tout
            </Button>
            <Button
              variant={filter === 'urgent' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilter('urgent')}
              className={filter !== 'urgent' ? 'text-destructive border-destructive/50' : ''}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Urgent
            </Button>
            <Button
              variant={filter === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('overdue')}
              className={cn(
                filter === 'overdue' ? 'bg-orange-600 hover:bg-orange-700' : 'text-orange-500 border-orange-500/50'
              )}
            >
              <Clock className="w-4 h-4 mr-1" />
              En retard
            </Button>
            <Button
              variant={filter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('today')}
              className={cn(
                filter === 'today' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-500 border-purple-500/50'
              )}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Aujourd'hui
            </Button>
          </div>

          {/* Filtres — Mobile dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  {filterLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter('all')}>Tout</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('urgent')}>
                  <AlertCircle className="w-4 h-4 mr-2 text-destructive" /> Urgent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('overdue')}>
                  <Clock className="w-4 h-4 mr-2 text-orange-500" /> En retard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('today')}>
                  <Calendar className="w-4 h-4 mr-2 text-purple-500" /> Aujourd'hui
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Board Kanban — horizontal scroll with visible scrollbar */}
      <ScrollArea className="w-full pb-4">
        <div
          className="flex gap-6 pb-4"
          style={{ minWidth: `${(resolvedColumns.length + (canManageColumns ? 1 : 0)) * 280}px` }}
        >
        {resolvedColumns.map((status, colIndex) => {
          const statusTasks = sortTasks(
            filteredTasks.filter((t) => t.status === status.id),
            status.id
          );
          const isDropTarget = dragOverStatus === status.id;
          const stats = statusStats[status.id];
          const StatusIcon = status.icon;

          return (
            <div key={status.id} className="flex flex-col min-w-[260px] flex-1">
              {/* Column Header */}
              <div className={cn("rounded-t-lg px-4 py-3 border-b", status.headerClass)}>
                <div className="flex items-center justify-between mb-2">
                  {editingColumnId === status.id ? (
                    <div className="flex items-center gap-1 flex-1 mr-1">
                      <Input
                        value={editColumnLabel}
                        onChange={(e) => setEditColumnLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRenameColumn();
                          if (e.key === 'Escape') { setEditingColumnId(null); setEditColumnLabel(''); }
                        }}
                        className="h-7 text-sm font-bold"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleConfirmRenameColumn}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      </Button>
                    </div>
                  ) : (
                    <h3 className="font-bold flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className={compact ? 'text-sm' : ''}>{status.label}</span>
                    </h3>
                  )}
                  <div className="flex items-center gap-1">
                    {/* Sort dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortConfig(c => ({ ...c, [status.id]: undefined }))}>
                          Par défaut
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig(c => ({ ...c, [status.id]: 'priority' }))}>
                          <ArrowUp className="w-4 h-4 mr-2" /> Priorité
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig(c => ({ ...c, [status.id]: 'due_date' }))}>
                          <Calendar className="w-4 h-4 mr-2" /> Échéance
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Column management ⋮ menu */}
                    {canManageColumns && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStartRenameColumn(status)}>
                            <Pencil className="w-4 h-4 mr-2" /> Renommer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(status)}>
                            <Palette className="w-4 h-4 mr-2" /> Icône & couleur
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {colIndex > 0 && (
                            <DropdownMenuItem onClick={() => onColumnMove(status.id, 'up')}>
                              <ArrowUp className="w-4 h-4 mr-2" /> Déplacer à gauche
                            </DropdownMenuItem>
                          )}
                          {colIndex < resolvedColumns.length - 1 && (
                            <DropdownMenuItem onClick={() => onColumnMove(status.id, 'down')}>
                              <ArrowDown className="w-4 h-4 mr-2" /> Déplacer à droite
                            </DropdownMenuItem>
                          )}
                          {resolvedColumns.length > 1 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteColumn(status.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <Badge variant="secondary" className={status.badgeClass}>
                      {stats.total}
                    </Badge>
                  </div>
                </div>

                {/* Indicateurs */}
                {stats.total > 0 && (stats.urgent > 0 || stats.overdue > 0) && (
                  <div className="flex items-center gap-3 text-xs">
                    {stats.urgent > 0 && (
                      <span className="text-destructive font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {stats.urgent}
                      </span>
                    )}
                    {stats.overdue > 0 && (
                      <span className="text-orange-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {stats.overdue}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Tasks Container */}
              <div
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status.id)}
                className={cn(
                  "flex-1 rounded-b-lg border border-t-0 p-3 space-y-3 overflow-y-auto transition-all min-h-[400px]",
                  status.containerClass,
                  isDropTarget && "border-primary bg-primary/10",
                  draggedTask && "cursor-grabbing"
                )}
              >
                {statusTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                    <div className="text-center">
                      <p className="text-lg mb-1">−</p>
                      <p className={compact ? 'text-xs' : ''}>Aucune tâche</p>
                      {draggedTask && <p className="text-xs mt-1">Déposez ici</p>}
                    </div>
                  </div>
                ) : (
                  statusTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing transition-opacity"
                    >
                      <TaskCard
                        task={task}
                        onView={() => setSelectedTask(task)}
                        onDelete={() => handleDeleteWithConfirm(task)}
                      />
                    </div>
                  ))
                )}

                {/* Inline quick-add input */}
                <div className="flex gap-1 mt-2">
                  <Input
                    type="text"
                    value={inlineInputs[status.id] || ''}
                    onChange={(e) => setInlineInputs(prev => ({ ...prev, [status.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleInlineCreate(status.id)}
                    placeholder="+ Ajouter une tâche..."
                    className="h-8 text-sm bg-background/50"
                  />
                  {(inlineInputs[status.id] || '').trim() && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleInlineCreate(status.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* "+ Ajouter une colonne" card at the end */}
        {canManageColumns && (
          <div className="flex flex-col min-w-[260px] flex-1">
            {showAddColumn ? (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Nouvelle colonne</h3>
                <Input
                  value={newColumnLabel}
                  onChange={(e) => setNewColumnLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') { setShowAddColumn(false); setNewColumnLabel(''); }
                  }}
                  placeholder="Nom de la colonne..."
                  className="h-8 text-sm"
                  autoFocus
                />

                {/* Icône */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Icône</p>
                  <div className="flex flex-wrap gap-1">
                    {INLINE_ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewColumnIcon(icon)}
                        className={cn(
                          "text-lg p-1.5 rounded transition",
                          newColumnIcon === icon ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleur */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Couleur</p>
                  <div className="flex flex-wrap gap-1.5">
                    {INLINE_COLOR_OPTIONS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setNewColumnColor(c.value)}
                        className={cn(
                          c.class,
                          "w-6 h-6 rounded-full transition",
                          newColumnColor === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddColumn} disabled={!newColumnLabel.trim()}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddColumn(false); setNewColumnLabel(''); }}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddColumn(true)}
                className="flex-1 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all min-h-[200px] cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Ajouter une colonne</span>
              </button>
            )}
          </div>
        )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Modal détails tâche */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            onUpdateTask(selectedTask.id, updatedTask);
            setSelectedTask({ ...selectedTask, ...updatedTask });
          }}
          onDelete={() => {
            const taskToDelete = selectedTask;
            setSelectedTask(null);
            // Fermer le modal d'abord, puis afficher la confirmation
            setTimeout(() => {
              handleDeleteWithConfirm(taskToDelete);
            }, 100);
          }}
          onDuplicate={onDuplicateTask}
          statusOptions={resolvedColumns.map(col => ({
            value: col.id,
            label: col.label,
            icon: col.icon
          }))}
        />
      )}

      {/* Dialog icône & couleur */}
      <Dialog open={!!showEditDialog} onOpenChange={(open) => !open && setShowEditDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Icône & couleur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Icône</p>
              <div className="flex flex-wrap gap-1.5">
                {INLINE_ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setEditDialogIcon(icon)}
                    className={cn(
                      "text-xl p-2 rounded transition",
                      editDialogIcon === icon ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Couleur</p>
              <div className="flex flex-wrap gap-2">
                {INLINE_COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setEditDialogColor(c.value)}
                    className={cn(
                      c.class,
                      "w-8 h-8 rounded-full transition",
                      editDialogColor === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(null)}>Annuler</Button>
            <Button onClick={handleSaveEditDialog}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        {...confirmConfig}
      />
    </>
  );
}