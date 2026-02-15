// src/components/tasks/TaskCardView.jsx
import { useState, useMemo, memo } from "react";
import TaskCard from "./TaskCard";
import TaskDetailsModal from "./TaskDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTaskColumns } from "../../config/taskConstants";

const TaskCardView = memo(function TaskCardView({
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Résoudre les colonnes
  const resolvedColumns = useMemo(() => resolveTaskColumns(columns), [columns]);

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter);
    }

    // Tri par priorité puis par date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...result].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [tasks, search, statusFilter]);

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

  return (
    <>
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {resolvedColumns.map(col => (
              <SelectItem key={col.id} value={col.id}>
                {col.icon} {col.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ajout rapide */}
      {onQuickCreateTask && (
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nouvelle tâche..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const title = newTaskTitle.trim();
                if (!title) return;
                try {
                  await onQuickCreateTask({ title, status: 'todo' });
                  setNewTaskTitle('');
                } catch {}
              }
            }}
          />
          <Button
            onClick={async () => {
              const title = newTaskTitle.trim();
              if (!title) return;
              try {
                await onQuickCreateTask({ title, status: 'todo' });
                setNewTaskTitle('');
              } catch {}
            }}
            disabled={!newTaskTitle.trim()}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      )}

      {/* Grille de cards */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search || statusFilter !== "all"
            ? "Aucune tâche ne correspond aux filtres"
            : "Aucune tâche"
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onView={() => setSelectedTask(task)}
              onDelete={() => handleDeleteWithConfirm(task)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {filteredTasks.length} tâche{filteredTasks.length > 1 ? "s" : ""} affichée{filteredTasks.length > 1 ? "s" : ""}
      </p>

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
});

export default TaskCardView;
