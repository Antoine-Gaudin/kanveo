// src/components/clients/ContractFormModal.jsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { FileText, Save, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

export default function ContractFormModal({ open, onOpenChange, onSave, clients = [], contract = null }) {
  const isEdit = !!contract;

  const [form, setForm] = useState({
    clientId: '',
    title: '',
    description: '',
    amount: '',
    recurrence: 'one_time',
    status: 'active',
    startDate: '',
    endDate: '',
    paidAmount: '',
    paymentCount: '1',
  });

  // Sync form state when contract prop changes (edit mode)
  useEffect(() => {
    if (open) {
      setForm({
        clientId: contract?.client_id || '',
        title: contract?.title || '',
        description: contract?.description || '',
        amount: contract?.amount ?? '',
        recurrence: contract?.recurrence || 'one_time',
        status: contract?.status || 'active',
        startDate: contract?.start_date || '',
        endDate: contract?.end_date || '',
        paidAmount: contract?.paid_amount ?? '0',
        paymentCount: contract?.payment_count ?? '1',
      });
    }
  }, [open, contract]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.clientId) return;
    try {
      await onSave(form);
      onOpenChange(false);
    } catch {
      // Error handled by parent
    }
  };

  const RECURRENCE_LABELS = {
    one_time: '💰 Ponctuel',
    monthly: '📅 Mensuel',
    quarterly: '📊 Trimestriel',
    yearly: '📆 Annuel',
  };

  const totalAmount = Number(form.amount) || 0;
  const paidAmount = Number(form.paidAmount) || 0;
  const remaining = Math.max(0, totalAmount - paidAmount);
  const paidPercent = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEdit ? 'Modifier le contrat' : 'Ajouter un contrat'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` — ${c.company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="title">Titre du contrat *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Maintenance site web"
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Montant total (€)</Label>
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
              <Label htmlFor="recurrence">Type</Label>
              <Select value={form.recurrence} onValueChange={(v) => setForm(f => ({ ...f, recurrence: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Date début</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date fin</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">✅ En cours</SelectItem>
                  <SelectItem value="completed">🏁 Terminé</SelectItem>
                  <SelectItem value="cancelled">❌ Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Paiement */}
          <Separator />
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              Suivi du paiement
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="paidAmount" className="text-xs">Montant reçu (€)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.amount || undefined}
                  value={form.paidAmount}
                  onChange={(e) => setForm(f => ({ ...f, paidAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="paymentCount" className="text-xs">Nb échéances</Label>
                <Input
                  id="paymentCount"
                  type="number"
                  min="1"
                  value={form.paymentCount}
                  onChange={(e) => setForm(f => ({ ...f, paymentCount: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Progress bar de paiement */}
            {totalAmount > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Reçu : <span className="font-medium text-green-500">{formatCurrency(paidAmount)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Reste : <span className={cn("font-medium", remaining > 0 ? "text-amber-500" : "text-green-500")}>
                      {formatCurrency(remaining)}
                    </span>
                  </span>
                </div>
                <Progress value={paidPercent} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {paidPercent.toFixed(0)}% encaissé
                  {Number(form.paymentCount) > 1 && (
                    <> — {form.paymentCount} échéance{Number(form.paymentCount) > 1 ? 's' : ''}</>
                  )}
                </p>
              </div>
            )}
          </div>

          <Separator />
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Détails du contrat..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!form.title.trim() || !form.clientId}>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
