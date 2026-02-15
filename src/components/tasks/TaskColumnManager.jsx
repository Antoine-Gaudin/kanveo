// src/components/tasks/TaskColumnManager.jsx
import { useState } from "react";
import { useConfirm } from "../../hooks/useConfirm";
import ConfirmDialog from "../ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_TASK_COLUMNS } from "../../config/taskConstants";

const COLOR_OPTIONS = [
  { value: "slate", label: "Gris", class: "bg-slate-500" },
  { value: "blue", label: "Bleu", class: "bg-blue-500" },
  { value: "red", label: "Rouge", class: "bg-red-500" },
  { value: "green", label: "Vert", class: "bg-green-500" },
  { value: "purple", label: "Violet", class: "bg-purple-500" },
  { value: "amber", label: "Ambre", class: "bg-amber-500" },
  { value: "pink", label: "Rose", class: "bg-pink-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
];

const ICON_OPTIONS = [
  "📋", "⚡", "❌", "✅", "🔥", "⏳", "📅",
  "🆕", "📞", "💼", "🎯", "🚀", "⭐",
  "📊", "💰", "🔔", "💡", "🎉", "📈", "🏆"
];

export default function TaskColumnManager({ board, onSave, onClose }) {
  const [columns, setColumns] = useState(
    () => {
      const statuses = board?.statuses;
      if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
        return DEFAULT_TASK_COLUMNS.map(s => ({ ...s }));
      }
      // Si format ancien (strings), convertir
      if (typeof statuses[0] === 'string') {
        return statuses.map(s => ({ id: s, label: s, icon: '📋', color: 'slate' }));
      }
      return statuses.map(s => ({ ...s }));
    }
  );

  const [editingIndex, setEditingIndex] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColumn, setNewColumn] = useState({ id: '', label: '', icon: '📋', color: 'slate' });
  const [saving, setSaving] = useState(false);
  const { isOpen: confirmOpen, confirmConfig, confirm, close: closeConfirm } = useConfirm();

  const handleAddColumn = () => {
    const id = newColumn.id.trim();
    const label = newColumn.label.trim();
    if (!id || !label) return;

    if (columns.some(c => c.id === id)) return;

    setColumns(prev => [...prev, { ...newColumn, id, label }]);
    setShowAddForm(false);
    setNewColumn({ id: '', label: '', icon: '📋', color: 'slate' });
  };

  const handleUpdateColumn = (index, updates) => {
    setColumns(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleDeleteColumn = (index) => {
    const col = columns[index];
    confirm({
      title: "Supprimer cette colonne ?",
      message: `Supprimer la colonne "${col.label}" ? Les tâches avec ce statut devront être déplacées manuellement.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        setColumns(prev => prev.filter((_, i) => i !== index));
        if (editingIndex === index) setEditingIndex(null);
      }
    });
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setColumns(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    if (editingIndex === index) setEditingIndex(index - 1);
    else if (editingIndex === index - 1) setEditingIndex(index);
  };

  const handleMoveDown = (index) => {
    if (index === columns.length - 1) return;
    setColumns(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    if (editingIndex === index) setEditingIndex(index + 1);
    else if (editingIndex === index + 1) setEditingIndex(index);
  };

  const handleSave = async () => {
    if (columns.length === 0) return;
    setSaving(true);
    try {
      await onSave(board.id, columns);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gérer les colonnes</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Info banner */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-muted-foreground">
              💡 Personnalisez les colonnes de votre board : ajoutez, renommez, réordonnez ou supprimez des colonnes.
            </div>

            {/* Column list */}
            <div className="space-y-2">
              {columns.map((col, index) => (
                <div key={`${col.id}-${index}`} className="rounded-lg border border-border bg-card p-3">
                  {editingIndex === index ? (
                    /* — Edit mode — */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">ID (technique)</label>
                          <Input value={col.id} disabled className="opacity-50 cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Label</label>
                          <Input
                            value={col.label}
                            onChange={(e) => handleUpdateColumn(index, { label: e.target.value })}
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Icons */}
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Icône</label>
                        <div className="flex flex-wrap gap-1">
                          {ICON_OPTIONS.map(icon => (
                            <button
                              key={icon}
                              onClick={() => handleUpdateColumn(index, { icon })}
                              className={cn(
                                "text-xl p-1.5 rounded transition",
                                col.icon === icon
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Colors */}
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Couleur</label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleUpdateColumn(index, { color: opt.value })}
                              className={cn(
                                opt.class, "w-8 h-8 rounded-full transition",
                                col.color === opt.value
                                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                                  : "opacity-60 hover:opacity-100"
                              )}
                              title={opt.label}
                            />
                          ))}
                        </div>
                      </div>

                      <Button size="sm" onClick={() => setEditingIndex(null)}>
                        <Check className="w-4 h-4 mr-1" /> Valider
                      </Button>
                    </div>
                  ) : (
                    /* — View mode — */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                        <span className="text-xl">{col.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{col.label}</p>
                          <p className="text-xs text-muted-foreground">ID: {col.id}</p>
                        </div>
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            COLOR_OPTIONS.find(c => c.value === col.color)?.class || 'bg-slate-500'
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === columns.length - 1}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteColumn(index)}
                          disabled={columns.length <= 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add form */}
            {showAddForm ? (
              <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3 space-y-3">
                <p className="text-sm font-medium">Ajouter une colonne</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">ID (sans espaces)</label>
                    <Input
                      value={newColumn.id}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                      placeholder="ex: review"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Label</label>
                    <Input
                      value={newColumn.label}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="ex: En revue"
                    />
                  </div>
                </div>

                {/* Icons */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Icône</label>
                  <div className="flex flex-wrap gap-1">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewColumn(prev => ({ ...prev, icon }))}
                        className={cn(
                          "text-xl p-1.5 rounded transition",
                          newColumn.icon === icon
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setNewColumn(prev => ({ ...prev, color: opt.value }))}
                        className={cn(
                          opt.class, "w-8 h-8 rounded-full transition",
                          newColumn.color === opt.value
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "opacity-60 hover:opacity-100"
                        )}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddColumn}
                    disabled={!newColumn.id.trim() || !newColumn.label.trim() || columns.some(c => c.id === newColumn.id.trim())}
                  >
                    <Check className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setNewColumn({ id: '', label: '', icon: '📋', color: 'slate' }); }}>
                    <X className="w-4 h-4 mr-1" /> Annuler
                  </Button>
                </div>
                {columns.some(c => c.id === newColumn.id.trim()) && newColumn.id.trim() && (
                  <p className="text-xs text-destructive">Cet ID existe déjà</p>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter une colonne
              </Button>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={columns.length === 0 || saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog for column deletion */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={closeConfirm}
        {...confirmConfig}
      />
    </>
  );
}
