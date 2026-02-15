// src/components/tasks/CreateTaskModal.jsx
import { useState } from "react";
import { getLocalDateString } from "../../utils/task-dates";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Circle,
  CheckCircle2,
  AlertCircle,
  Target,
  Loader2,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', icon: CheckCircle2, className: 'text-green-500 border-green-500/50' },
  { value: 'medium', label: 'Moyenne', icon: Circle, className: 'text-yellow-500 border-yellow-500/50' },
  { value: 'high', label: 'Haute', icon: Circle, className: 'text-orange-500 border-orange-500/50' },
  { value: 'urgent', label: 'Urgente', icon: AlertCircle, className: 'text-destructive border-destructive/50' }
];

export default function CreateTaskModal({ onClose, onCreate, prospectId = null, boardId = null, workspaceId = null, columns = [] }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    prospect_id: prospectId,
    board_id: boardId,
    workspace_id: workspaceId
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onCreate({
        ...formData,
        userId: user.id,
        dueDate: formData.due_date ? new Date(formData.due_date).toISOString() : null
      });
      onClose();
    } catch (error) {
      addToast("❌ Erreur lors de la création de la tâche", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label>Titre de la tâche *</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Contacter le prospect..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Détails de la tâche..."
            />
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITY_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.priority === option.value ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, priority: option.value })}
                    className={cn(
                      "justify-start",
                      formData.priority !== option.value && option.className
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Date d'échéance */}
          <div className="space-y-2">
            <Label>Date d'échéance</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={getLocalDateString()}
            />
          </div>

          {/* Statut initial */}
          {columns.length > 0 && (
            <div className="space-y-2">
              <Label>Statut initial</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.icon} {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Info prospect si lié */}
          {prospectId && (
            <Alert className="bg-primary/10 border-primary/30">
              <Target className="h-4 w-4" />
              <AlertDescription>
                Cette tâche sera liée au prospect sélectionné
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Créer la tâche
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}