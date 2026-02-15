// src/components/tasks/TaskTodoView.jsx
import { useState, useMemo, useRef } from "react";
import { isTaskOverdue, formatTaskDate } from "../../utils/task-dates";
import TaskDetailsModal from "./TaskDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Circle,
  CheckCircle2,
  Calendar,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveTaskColumns } from "../../config/taskConstants";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", className: "text-destructive", icon: AlertCircle },
  high: { label: "Haute", className: "text-orange-500", icon: Circle },
  medium: { label: "Moyenne", className: "text-yellow-500", icon: Circle },
  low: { label: "Basse", className: "text-green-500", icon: CheckCircle2 },
};

export default function TaskTodoView({
  tasks = [],
  onMoveTask,
  onDeleteTask,
  onUpdateTask,
  onQuickCreateTask,
  onDuplicateTask,
  columns = [],
  statusOptions = [],
}) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef(null);
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Séparer tâches actives et terminées
  const { activeTasks, doneTasks, progress } = useMemo(() => {
    const active = [];
    const done = [];
    tasks.forEach(t => {
      if (t.status === 'done') done.push(t);
      else active.push(t);
    });

    // Tri priorité pour les actives
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    active.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
    done.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    const total = tasks.length;
    const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

    return { activeTasks: active, doneTasks: done, progress: { done: done.length, total, pct } };
  }, [tasks]);

  const handleQuickAdd = async () => {
    const title = newTaskTitle.trim();
    if (!title || !onQuickCreateTask) return;
    setIsAdding(true);
    try {
      await onQuickCreateTask({ title, status: 'todo' });
      setNewTaskTitle("");
      inputRef.current?.focus();
    } catch {
      // parent gère l'erreur
    } finally {
      setIsAdding(false);
    }
  };

  const toggleDone = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    onMoveTask(task.id, newStatus);
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

  const isOverdue = (task) => isTaskOverdue(task);

  const formatDate = (dateString) => formatTaskDate(dateString);

  const TaskRow = ({ task }) => {
    const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const PrioIcon = prio.icon;
    const overdue = isOverdue(task);
    const isDone = task.status === 'done';

    return (
      <div className="flex items-center gap-3 py-2 group hover:bg-muted/20 rounded px-2 -mx-2 transition-colors">
        <Checkbox
          checked={isDone}
          onCheckedChange={() => toggleDone(task)}
          className="flex-shrink-0"
        />

        <PrioIcon className={cn("w-3.5 h-3.5 flex-shrink-0", isDone ? "text-muted-foreground" : prio.className)} />

        <span
          className={cn(
            "flex-1 text-sm cursor-pointer hover:text-primary transition-colors",
            isDone && "line-through text-muted-foreground"
          )}
          onClick={() => setSelectedTask(task)}
        >
          {task.title}
        </span>

        {task.due_date && (
          <span className={cn(
            "text-xs flex items-center gap-1 flex-shrink-0",
            isDone ? "text-muted-foreground" : overdue ? "text-orange-500 font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        )}

        {task.checklist && task.checklist.length > 0 && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {task.checklist.filter(c => c.done || c.completed).length}/{task.checklist.length}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedTask(task)}>
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => handleDeleteWithConfirm(task)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          {/* Barre de progression */}
          <div className="flex items-center gap-3">
            <Progress value={progress.pct} className="h-2 flex-1" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {progress.done}/{progress.total} terminée{progress.done > 1 ? "s" : ""}
            </span>
          </div>

          {/* Input d'ajout rapide */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Ajouter une tâche..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              disabled={isAdding}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleQuickAdd}
              disabled={!newTaskTitle.trim() || isAdding}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>

          {/* Tâches actives */}
          {activeTasks.length === 0 && doneTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune tâche. Commencez par en ajouter une !
            </p>
          ) : (
            <>
              <div className="divide-y divide-border/50">
                {activeTasks.map(task => <TaskRow key={task.id} task={task} />)}
              </div>

              {/* Tâches terminées */}
              {doneTasks.length > 0 && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Terminées ({doneTasks.length})
                  </p>
                  <div className="divide-y divide-border/30">
                    {doneTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
