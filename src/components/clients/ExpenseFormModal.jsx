// src/components/clients/ExpenseFormModal.jsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Save } from 'lucide-react';

const CATEGORIES = {
  rent: { label: '🏢 Loyer / Local', color: 'text-blue-400' },
  software: { label: '💻 Logiciels / Abonnements', color: 'text-purple-400' },
  salary: { label: '👥 Salaires', color: 'text-green-400' },
  marketing: { label: '📢 Marketing / Publicité', color: 'text-pink-400' },
  taxes: { label: '🏛️ Impôts / Taxes', color: 'text-red-400' },
  insurance: { label: '🛡️ Assurances', color: 'text-cyan-400' },
  supplies: { label: '📦 Fournitures', color: 'text-amber-400' },
  travel: { label: '✈️ Déplacements', color: 'text-indigo-400' },
  other: { label: '📄 Autre', color: 'text-gray-400' },
};

export { CATEGORIES };

export default function ExpenseFormModal({ open, onOpenChange, onSave, expense = null }) {
  const isEdit = !!expense;

  const [form, setForm] = useState({
    label: '',
    category: 'other',
    amount: '',
    recurrence: 'monthly',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open) {
      setForm({
        label: expense?.label || '',
        category: expense?.category || 'other',
        amount: expense?.amount ?? '',
        recurrence: expense?.recurrence || 'monthly',
        date: expense?.date || new Date().toISOString().split('T')[0],
      });
    }
  }, [open, expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    try {
      await onSave(form);
      onOpenChange(false);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {isEdit ? 'Modifier la charge' : 'Ajouter une charge'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="label">Intitulé *</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Ex: Abonnement Notion"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Montant (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="recurrence">Récurrence</Label>
              <Select value={form.recurrence} onValueChange={(v) => setForm(f => ({ ...f, recurrence: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">💰 Ponctuel</SelectItem>
                  <SelectItem value="monthly">📅 Mensuel</SelectItem>
                  <SelectItem value="quarterly">📊 Trimestriel</SelectItem>
                  <SelectItem value="yearly">📆 Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!form.label.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
