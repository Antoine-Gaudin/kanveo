// src/components/tasks/TaskTableView.jsx
import { useState, useMemo } from "react";
import { isTaskOverdue, formatTaskDate } from "../../utils/task-dates";
import TaskDetailsModal from "./TaskDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Circle,
  CheckCircle2,
  Clock,
  Calendar,
  Eye,
  Trash2,
  ArrowUpDown,
  Search,
  Plus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { resolveTaskColumns } from "../../config/taskConstants";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", className: "bg-destructive/20 text-destructive border-destructive/50", icon: AlertCircle, order: 0 },
  high: { label: "Haute", className: "bg-orange-500/20 text-orange-500 border-orange-500/50", icon: Circle, order: 1 },
  medium: { label: "Moyenne", className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50", icon: Circle, order: 2 },
  low: { label: "Basse", className: "bg-green-500/20 text-green-500 border-green-500/50", icon: CheckCircle2, order: 3 },
};

export default function TaskTableView({
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Résoudre les colonnes
  const resolvedColumns = useMemo(() => resolveTaskColumns(columns), [columns]);

  const colMap = useMemo(() => {
    const map = {};
    resolvedColumns.forEach(c => { map[c.id] = c; });
    return map;
  }, [resolvedColumns]);

  // Filtrer et trier
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filtre recherche
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    // Filtre statut
    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter);
    }

    // Tri
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "priority": {
          const pa = PRIORITY_CONFIG[a.priority]?.order ?? 2;
          const pb = PRIORITY_CONFIG[b.priority]?.order ?? 2;
          cmp = pa - pb;
          break;
        }
        case "due_date":
          cmp = (a.due_date || "9999") < (b.due_date || "9999") ? -1 : 1;
          break;
        case "status": {
          const si = resolvedColumns.findIndex(c => c.id === a.status);
          const sj = resolvedColumns.findIndex(c => c.id === b.status);
          cmp = si - sj;
          break;
        }
        case "created_at":
        default:
          cmp = (a.created_at || "") < (b.created_at || "") ? -1 : 1;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tasks, search, statusFilter, sortKey, sortDir, resolvedColumns]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return formatTaskDate(dateString, { includeYear: true }) || "—";
  };

  const isOverdue = (task) => isTaskOverdue(task);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map(t => t.id)));
    }
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

  const SortHeader = ({ label, field }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("w-3.5 h-3.5", sortKey === field ? "text-primary" : "text-muted-foreground/50")} />
      </div>
    </TableHead>
  );

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

      {/* Tableau */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {onDeleteMultiple && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={filteredTasks.length > 0 && selectedIds.size === filteredTasks.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <SortHeader label="Titre" field="title" />
              <SortHeader label="Statut" field="status" />
              <SortHeader label="Priorité" field="priority" />
              <SortHeader label="Échéance" field="due_date" />
              <TableHead>Checklist</TableHead>
              <SortHeader label="Créé le" field="created_at" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onDeleteMultiple ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  {search || statusFilter !== "all" ? "Aucune tâche ne correspond aux filtres" : "Aucune tâche"}
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map(task => {
                const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const PrioIcon = prio.icon;
                const col = colMap[task.status];
                const overdue = isOverdue(task);
                const checklist = task.checklist || [];
                const done = checklist.filter(c => c.done || c.completed).length;

                return (
                  <TableRow
                    key={task.id}
                    className="group hover:bg-muted/20 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    {onDeleteMultiple && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(task.id)}
                          onCheckedChange={() => toggleSelect(task.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium max-w-[250px]">
                      <span className={cn(task.status === 'done' && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(val) => {
                          onMoveTask(task.id, val);
                        }}
                      >
                        <SelectTrigger
                          className="w-[140px] h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resolvedColumns.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.icon} {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", prio.className)}>
                        <PrioIcon className="w-3 h-3 mr-1" />
                        {prio.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-sm flex items-center gap-1",
                        overdue ? "text-orange-500 font-medium" : "text-muted-foreground"
                      )}>
                        {overdue && <Clock className="w-3.5 h-3.5" />}
                        {formatDate(task.due_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {checklist.length > 0 ? (
                        <span className="text-sm text-muted-foreground">{done}/{checklist.length}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(task.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedTask(task)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteWithConfirm(task)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
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
}
