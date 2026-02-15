// src/components/database/ColumnConfig.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Save, Columns3, Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

const FIELD_TYPES = [
  { value: "text", label: "Texte" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telephone" },
  { value: "url", label: "URL" },
];

export default function ColumnConfig({ columnConfig, onSave, defaultColumns }) {
  const [columns, setColumns] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (columnConfig && columnConfig.length > 0) {
      setColumns(columnConfig.map(c => ({ ...c })));
    }
  }, [columnConfig]);

  const handleToggle = (index, enabled) => {
    setColumns(prev => prev.map((c, i) => i === index ? { ...c, enabled } : c));
  };

  const handleLabelChange = (index, label) => {
    setColumns(prev => prev.map((c, i) => i === index ? { ...c, label } : c));
  };

  const handleTypeChange = (index, type) => {
    setColumns(prev => prev.map((c, i) => i === index ? { ...c, type } : c));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setColumns(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= columns.length - 1) return;
    setColumns(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleAddCustom = () => {
    const id = `custom_${Date.now()}`;
    setColumns(prev => [...prev, { id, label: "Nouveau champ", type: "text", enabled: true }]);
  };

  const handleRemoveCustom = (index) => {
    const col = columns[index];
    // Only allow removing custom fields (those starting with "custom_")
    if (!col.id.startsWith("custom_")) return;
    setColumns(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(columns);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save column config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setColumns(defaultColumns.map(c => ({ ...c })));
  };

  const enabledCount = columns.filter(c => c.enabled).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Columns3 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Configuration des colonnes</CardTitle>
            <CardDescription>
              Activez, renommez et reordonnez les champs de votre base de donnees
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column list */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            {enabledCount} champ{enabledCount > 1 ? "s" : ""} actif{enabledCount > 1 ? "s" : ""} sur {columns.length}
          </Label>
          <div className="space-y-1.5">
            {columns.map((col, index) => (
              <div
                key={col.id}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                  col.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                }`}
              >
                {/* Toggle */}
                <Switch
                  checked={col.enabled}
                  onCheckedChange={(checked) => handleToggle(index, checked)}
                  className="shrink-0"
                />

                {/* Label */}
                <Input
                  value={col.label}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  className="h-8 flex-1 min-w-0"
                  placeholder="Nom du champ"
                />

                {/* Type selector */}
                <Select value={col.type} onValueChange={(v) => handleTypeChange(index, v)}>
                  <SelectTrigger className="h-8 w-[110px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* ID badge */}
                <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
                  {col.id}
                </Badge>

                {/* Move buttons */}
                <div className="flex flex-col shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-6"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-6"
                    onClick={() => handleMoveDown(index)}
                    disabled={index >= columns.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Remove (custom only) */}
                {col.id.startsWith("custom_") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleRemoveCustom(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleAddCustom}>
            <Plus className="h-4 w-4" />
            Ajouter un champ
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reinitialiser
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSave} className="gap-2" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </Button>
        </div>

        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <Settings2 className="h-4 w-4" />
            Configuration sauvegardee
          </p>
        )}
      </CardContent>
    </Card>
  );
}
