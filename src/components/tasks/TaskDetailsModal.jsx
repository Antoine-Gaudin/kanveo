// src/components/tasks/TaskDetailsModal.jsx
import { useState, useEffect, useCallback } from "react";
import { getLocalDateString, parseDateOnly } from "../../utils/task-dates";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useDebounceCallback } from "../../hooks/useDebounce";
import NotesEditor from "./NotesEditor";
import TaskComments from "./TaskComments";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  MessageSquare,
  Target,
  Trash2,
  Plus,
  Save,
  Loader2,
  Circle,
  CheckCircle2,
  AlertCircle,
  Zap,
  Ban,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', icon: CheckCircle2, className: 'text-green-500' },
  { value: 'medium', label: 'Moyenne', icon: Circle, className: 'text-yellow-500' },
  { value: 'high', label: 'Haute', icon: Circle, className: 'text-orange-500' },
  { value: 'urgent', label: 'Urgente', icon: AlertCircle, className: 'text-destructive' }
];

const DEFAULT_STATUS_OPTIONS = [
  { value: 'todo', label: 'À faire', icon: FileText },
  { value: 'in_progress', label: 'En cours', icon: Zap },
  { value: 'blocked', label: 'Bloqué', icon: Ban },
  { value: 'done', label: 'Terminé', icon: CheckCircle2 }
];

export default function TaskDetailsModal({ task, onClose, onUpdate, onDelete, statusOptions, onDuplicate }) {
  const resolvedStatusOptions = statusOptions && statusOptions.length > 0
    ? statusOptions
    : DEFAULT_STATUS_OPTIONS;
  const { user } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    status: 'todo',
    priority: 'medium',
    due_date: ''
  });
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [notesSaved, setNotesSaved] = useState(false);

  // Auto-save notes avec debounce
  const autoSaveNotes = useDebounceCallback(
    useCallback(async (notes) => {
      try {
        await onUpdate({ notes });
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } catch {
        // Will be saved on manual save
      }
    }, [onUpdate]),
    1500
  );

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        notes: task.notes || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date ? parseDateOnly(task.due_date) || '' : ''
      });
      setChecklist(task.checklist || []);
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate({
        ...formData,
        checklist,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      });
      onClose();
    } catch (error) {
      addToast("❌ Erreur lors de la sauvegarde de la tâche", "error");
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([
        ...checklist,
        { id: Date.now(), text: newChecklistItem.trim(), completed: false }
      ]);
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = (id) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeChecklistItem = (id) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  if (!task) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Détails de la tâche</DialogTitle>
        </DialogHeader>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              Détails
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Commentaires
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6">
              {/* Contenu de l'onglet Détails */}
              <TabsContent value="details" className="mt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Titre */}
                  <div className="space-y-2">
                    <Label>Titre de la tâche</Label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  {/* Description courte */}
                  <div className="space-y-2">
                    <Label>Description courte</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Résumé rapide de la tâche..."
                    />
                  </div>

                  {/* Aperçu des notes */}
                  {formData.notes && formData.notes.trim() && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Notes (aperçu)
                      </Label>
                      <div className="p-3 bg-muted/50 rounded-lg border max-h-32 overflow-y-auto">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {formData.notes.length > 200
                            ? formData.notes.substring(0, 200) + '...'
                            : formData.notes
                          }
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setActiveTab('notes')}
                          className="p-0 h-auto mt-2"
                        >
                          Voir les notes complètes →
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Statut et Priorité */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {resolvedStatusOptions.map(option => {
                              const Icon = typeof option.icon === 'function' ? option.icon : null;
                              const emojiIcon = typeof option.icon === 'string' ? option.icon : null;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    {Icon && <Icon className="w-4 h-4" />}
                                    {emojiIcon && <span>{emojiIcon}</span>}
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Priorité</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map(option => {
                              const Icon = option.icon;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className={cn("w-4 h-4", option.className)} />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Date d'échéance</Label>
                        <Input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                      </div>

                      {/* Infos prospect si lié */}
                      {task.prospect_id && (
                        <Alert className="bg-primary/10 border-primary/30">
                          <Target className="h-4 w-4" />
                          <AlertDescription>
                            <span className="font-medium">Prospect lié</span>
                            <br />
                            <span className="text-xs">ID: {task.prospect_id}</span>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Infos création */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Créée le: {new Date(task.created_at).toLocaleDateString('fr-FR')}</p>
                        {task.completed_at && (
                          <p>Terminée le: {new Date(task.completed_at).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2">
                      <Label>Checklist</Label>

                      {/* Ajouter un item */}
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                          placeholder="Ajouter un item..."
                          className="flex-1"
                        />
                        <Button type="button" onClick={addChecklistItem}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Liste des items */}
                      <ScrollArea className="max-h-60">
                        <div className="space-y-2">
                          {checklist.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={() => toggleChecklistItem(item.id)}
                              />
                              <span className={cn("flex-1 text-sm", item.completed && "line-through text-muted-foreground")}>
                                {item.text}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => removeChecklistItem(item.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex gap-3">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={onClose}>
                        Annuler
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {onDuplicate && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            onDuplicate(formData);
                            onClose();
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Dupliquer
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              {/* Contenu de l'onglet Notes */}
              <TabsContent value="notes" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Notes détaillées
                    </h3>
                    <NotesEditor
                      value={formData.notes}
                      onChange={(value) => {
                        setFormData({ ...formData, notes: value });
                        autoSaveNotes(value);
                      }}
                      placeholder="Ajoutez ici des notes détaillées sur la tâche. Vous pouvez utiliser le formatage Markdown : **gras**, *italique*, `code`, listes, etc."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    {notesSaved && (
                      <span className="text-xs text-green-500 animate-in fade-in">✓ Sauvegardé automatiquement</span>
                    )}
                    <Button
                      onClick={() => onUpdate({ notes: formData.notes })}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder les notes
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Fermer
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Contenu de l'onglet Commentaires */}
              <TabsContent value="comments" className="mt-0">
                <div className="space-y-4">
                  <TaskComments taskId={task.id} user={user} />

                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                      Fermer
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}