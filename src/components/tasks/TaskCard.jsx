// src/components/tasks/TaskCard.jsx
import { useMemo, memo } from "react";
import { isTaskOverdue, formatTaskDate } from "../../utils/task-dates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Circle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Target,
  FileText,
  Eye,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  urgent: {
    variant: "destructive",
    icon: AlertCircle,
    label: "Urgent"
  },
  high: {
    variant: "default",
    className: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    icon: Circle,
    label: "Haute"
  },
  medium: {
    variant: "default",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    icon: Circle,
    label: "Moyenne"
  },
  low: {
    variant: "default",
    className: "bg-green-500/20 text-green-400 border-green-500/50",
    icon: CheckCircle2,
    label: "Basse"
  }
};

const TaskCard = memo(function TaskCard({ task, onView, onDelete }) {
  // Calculer si la tâche est en retard
  const isOverdue = useMemo(() => isTaskOverdue(task), [task.due_date, task.status]);

  // Vérifier si la tâche a des notes
  const hasNotes = useMemo(() => {
    return task.notes && task.notes.trim().length > 0;
  }, [task.notes]);

  // Vérifier si la tâche est récente (< 24h)
  const isNew = useMemo(() => {
    if (!task.created_at) return false;
    return Date.now() - new Date(task.created_at).getTime() < 24 * 60 * 60 * 1000;
  }, [task.created_at]);

  // Calculer le statut de la checklist
  const checklistProgress = useMemo(() => {
    if (!task.checklist || task.checklist.length === 0) return null;
    const completed = task.checklist.filter(item => item.completed).length;
    const total = task.checklist.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [task.checklist]);

  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const PriorityIcon = priorityConfig.icon;

  const formatDate = (dateString) => formatTaskDate(dateString);

  return (
    <Card
      onClick={() => onView()}
      className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
    >
      <CardContent className="p-4">
        {/* Header avec priorité */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <Badge
            variant={priorityConfig.variant}
            className={cn("flex items-center gap-1", priorityConfig.className)}
          >
            <PriorityIcon className="w-3 h-3" />
            {priorityConfig.label}
          </Badge>

          {/* Badge en retard */}
          {isOverdue && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Retard
            </Badge>
          )}

          {/* Badge nouveau */}
          {isNew && !isOverdue && (
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-[10px]">
              Nouveau
            </Badge>
          )}
        </div>

        {/* Titre */}
        <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition line-clamp-2 mb-2">
          {task.title}
        </h4>

        {/* Description si présente */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Indicateurs de contenu supplémentaire */}
        {(task.prospect_id || hasNotes) && (
        <div className="mb-3 pb-2 border-b space-y-2">
          {/* Infos prospect si lié */}
          {task.prospect_id && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Target className="w-3 h-3" />
              <span className="truncate">Lié à un prospect</span>
            </div>
          )}

          {/* Indicateurs notes */}
          {hasNotes && (
          <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                <FileText className="w-3 h-3 mr-1" />
                Notes
              </Badge>
          </div>
          )}
        </div>
        )}

        {/* Checklist progress */}
        {checklistProgress && (
          <div className="mb-3 pb-2 border-b">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Checklist</span>
              <span className="font-medium">
                {checklistProgress.completed}/{checklistProgress.total}
              </span>
            </div>
            <Progress value={checklistProgress.percentage} className="h-2" />
          </div>
        )}

        {/* Footer avec date et assignation */}
        <div className="flex items-center justify-between text-xs">
          {/* Date d'échéance */}
          {task.due_date && (
            <div className={cn(
              "flex items-center gap-1",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}

          {/* Assigné à */}
          {task.assigned_to && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[100px]">Assigné</span>
            </div>
          )}
        </div>

        {/* Boutons d'action - visibles au survol */}
        <div
          className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-3 pt-3 border-t"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex-1"
          >
            <Eye className="w-3 h-3 mr-1" />
            Voir
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default TaskCard;
