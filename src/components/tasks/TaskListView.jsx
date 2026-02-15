// src/components/tasks/TaskListView.jsx
import { useState, useMemo } from "react";
import { isTaskOverdue, formatTaskDate } from "../../utils/task-dates";
import TaskDetailsModal from "./TaskDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Circle,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resolveTaskColumns } from "../../config/taskConstants";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", className: "text-destructive", icon: AlertCircle },
  high: { label: "Haute", className: "text-orange-500", icon: Circle },
  medium: { label: "Moyenne", className: "text-yellow-500", icon: Circle },
  low: { label: "Basse", className: "text-green-500", icon: CheckCircle2 },
};

export default function TaskListView({
  tasks = [],
  onMoveTask,
  onDeleteTask,
  onUpdateTask,
  onQuickCreateTask,
  onDuplicateTask,
  onDeleteMultiple,
  columns = [],
  statusOptions = [],
}) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [inlineInputs, setInlineInputs] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Résoudre les colonnes
  const resolvedColumns = useMemo(() => resolveTaskColumns(columns), [columns]);

  // Grouper les tâches par statut
  const groupedTasks = useMemo(() => {
    return resolvedColumns.map(col => ({
      ...col,
      tasks: tasks
        .filter(t => t.status === col.id)
        .sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
        }),
    }));
  }, [tasks, resolvedColumns]);

  const toggleGroup = (id) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteWithConfirm = (task) => {
    confirm({
      title: "Supprimer cette tâche ?",
      message: `Voulez-vous vraiment supprimer "${task.title}" ?`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => onDeleteTask(task.id),
    });
  };

  const toggleDone = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    onMoveTask(task.id, newStatus);
  };

  const isOverdue = (task) => isTaskOverdue(task);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0 || !onDeleteMultiple) return;
    confirm({
      title: `Supprimer ${selectedIds.size} tâche(s) ?`,
      message: "Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        onDeleteMultiple([...selectedIds]);
        setSelectedIds(new Set());
      }
    });
  };

  const formatDate = (dateString) => formatTaskDate(dateString);

  return (
    <>
      {/* Barre d'actions en lot */}
      {selectedIds.size > 0 && onDeleteMultiple && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <span className="text-sm font-medium">{selectedIds.size} sélectionnée(s)</span>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Annuler
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {groupedTasks.map((group) => {
          const isCollapsed = collapsedGroups[group.id];
          return (
            <Card key={group.id} className="border-border/50">
              <CardHeader
                className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{group.icon}</span>
                    {group.label}
                  </CardTitle>
                  <Badge variant="secondary">{group.tasks.length}</Badge>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="pt-0">
                  {/* Ajout rapide inline */}
                  {onQuickCreateTask && (
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder={`Ajouter à "${group.label}"...`}
                        value={inlineInputs[group.id] || ''}
                        onChange={(e) => setInlineInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const title = (inlineInputs[group.id] || '').trim();
                            if (!title) return;
                            try {
                              await onQuickCreateTask({ title, status: group.id });
                              setInlineInputs(prev => ({ ...prev, [group.id]: '' }));
                            } catch {}
                          }
                        }}
                        className="flex-1 h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        disabled={!(inlineInputs[group.id] || '').trim()}
                        onClick={async () => {
                          const title = (inlineInputs[group.id] || '').trim();
                          if (!title) return;
                          try {
                            await onQuickCreateTask({ title, status: group.id });
                            setInlineInputs(prev => ({ ...prev, [group.id]: '' }));
                          } catch {}
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {group.tasks.length === 0 && !onQuickCreateTask ? (
                    <p className="text-sm text-muted-foreground py-3 text-center">Aucune tâche</p>
                  ) : group.tasks.length === 0 ? null : (
                    <div className="space-y-2">
                      {group.tasks.map((task) => {
                        const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        const PrioIcon = prio.icon;
                        const overdue = isOverdue(task);
                        const checklist = task.checklist || [];
                        const checkDone = checklist.filter(c => c.done || c.completed).length;

                        return (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 group hover:bg-muted/30 rounded-lg border border-transparent hover:border-border/50 transition-all cursor-pointer"
                            onClick={() => setSelectedTask(task)}
                          >
                            {/* Checkbox done */}
                            <Checkbox
                              checked={task.status === 'done'}
                              onCheckedChange={(e) => {
                                toggleDone(task);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 mt-0.5"
                            />

                            {/* Sélection pour suppression en lot */}
                            {onDeleteMultiple && (
                              <Checkbox
                                checked={selectedIds.has(task.id)}
                                onCheckedChange={() => toggleSelect(task.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-shrink-0 mt-0.5 border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                              />
                            )}

                            {/* Contenu principal */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className={cn(
                                    "text-sm font-medium truncate",
                                    task.status === 'done' && "line-through text-muted-foreground"
                                  )}
                                >
                                  {task.title}
                                </span>
                              </div>

                              {/* Description preview */}
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                  {task.description}
                                </p>
                              )}

                              {/* Metadata row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", prio.className === 'text-destructive' ? 'border-destructive/50 text-destructive' : prio.className === 'text-orange-500' ? 'border-orange-500/50 text-orange-500' : prio.className === 'text-yellow-500' ? 'border-yellow-500/50 text-yellow-500' : 'border-green-500/50 text-green-500')}>
                                  <PrioIcon className="w-3 h-3 mr-0.5" />
                                  {prio.label}
                                </Badge>

                                {task.due_date && (
                                  <span className={cn(
                                    "text-[11px] flex items-center gap-1",
                                    overdue ? "text-orange-500 font-medium" : "text-muted-foreground"
                                  )}>
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(task.due_date)}
                                  </span>
                                )}

                                {checklist.length > 0 && (
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {checkDone}/{checklist.length}
                                  </span>
                                )}

                                {task.notes && task.notes.trim() && (
                                  <span className="text-[11px] text-muted-foreground">📝</span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDeleteWithConfirm(task); }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal détails */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            onUpdateTask(selectedTask.id, updatedTask);
            setSelectedTask({ ...selectedTask, ...updatedTask });
          }}
          onDelete={() => {
            const t = selectedTask;
            setSelectedTask(null);
            setTimeout(() => handleDeleteWithConfirm(t), 100);
          }}
          onDuplicate={onDuplicateTask}
          statusOptions={statusOptions}
        />
      )}

      <ConfirmDialog isOpen={isOpen} onClose={close} {...confirmConfig} />
    </>
  );
}
