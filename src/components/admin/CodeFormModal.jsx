// src/components/admin/CodeFormModal.jsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Tag, Loader2 } from 'lucide-react';

export default function CodeFormModal({ open, onOpenChange, onSave, code = null }) {
  const isEdit = !!code;

  const [form, setForm] = useState({
    code: '',
    influencer_name: '',
    email: '',
    stripe_coupon_id: '',
    max_uses: '',
    commission_amount_cents: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        code: code?.code || '',
        influencer_name: code?.influencer_name || '',
        email: code?.email || '',
        stripe_coupon_id: code?.stripe_coupon_id || '',
        max_uses: code?.max_uses ?? '',
        commission_amount_cents: code?.commission_amount_cents ?? 500,
      });
    }
  }, [open, code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.influencer_name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        code: form.code.toUpperCase().trim(),
        influencer_name: form.influencer_name.trim(),
        email: form.email.trim() || null,
        stripe_coupon_id: form.stripe_coupon_id.trim() || null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        commission_amount_cents: form.commission_amount_cents !== '' ? Number(form.commission_amount_cents) : 500,
      });
      onOpenChange(false);
    } catch {
      // Error handled externally via toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {isEdit ? 'Modifier le code' : 'Nouveau code influenceur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="EX: MONCODE"
                required
              />
            </div>
            <div>
              <Label htmlFor="influencer_name">Nom de l'influenceur *</Label>
              <Input
                id="influencer_name"
                value={form.influencer_name}
                onChange={(e) => setForm(f => ({ ...f, influencer_name: e.target.value }))}
                placeholder="Nom ou pseudo"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email de l'affilié</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="affilié@email.com"
              />
              <p className="text-xs text-muted-foreground mt-1">Utilisé pour le compte Stripe Connect</p>
            </div>
            <div>
              <Label htmlFor="commission">Commission (centimes)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                value={form.commission_amount_cents}
                onChange={(e) => setForm(f => ({ ...f, commission_amount_cents: e.target.value }))}
                placeholder="500 (= 5.00€)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.commission_amount_cents !== '' ? `${(Number(form.commission_amount_cents) / 100).toFixed(2)} €` : '5.00 € par défaut'}
              </p>
            </div>
            <div>
              <Label htmlFor="stripe_coupon_id">Coupon Stripe ID</Label>
              <Input
                id="stripe_coupon_id"
                value={form.stripe_coupon_id}
                onChange={(e) => setForm(f => ({ ...f, stripe_coupon_id: e.target.value }))}
                placeholder="ex: 0kmZNB4X (depuis le dashboard Stripe)"
              />
              <p className="text-xs text-muted-foreground mt-1">ID du coupon Stripe lié à ce code promo (visible dans Produits → Coupons)</p>
            </div>
            <div>
              <Label htmlFor="max_uses">Utilisations max (vide = illimité)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="Illimité"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!form.code.trim() || !form.influencer_name.trim() || saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
