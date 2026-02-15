// src/components/feedback/FeedbackFormModal.jsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquarePlus, Send, Loader2 } from 'lucide-react';
import { FEEDBACK_CATEGORIES } from '@/schemas/feedbackSchema';
import { validateFeedback } from '@/schemas/feedbackSchema';

export default function FeedbackFormModal({ open, onOpenChange, onSave }) {
  const [form, setForm] = useState({
    category: 'feedback',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setForm({ category: 'feedback', subject: '', message: '' });
      setErrors({});
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation Zod
    const validation = validateFeedback(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Envoyer un feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="feedback-category">Catégorie *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm(f => ({ ...f, category: v }))}
            >
              <SelectTrigger id="feedback-category">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="feedback-subject">Objet *</Label>
            <Input
              id="feedback-subject"
              value={form.subject}
              onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Résumez votre feedback en quelques mots"
              maxLength={200}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message *</Label>
            <Textarea
              id="feedback-message"
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Décrivez votre problème, suggestion ou question en détail..."
              rows={5}
              maxLength={5000}
            />
            <div className="flex justify-between">
              {errors.message ? (
                <p className="text-sm text-destructive">{errors.message}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {form.message.length}/5000
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
