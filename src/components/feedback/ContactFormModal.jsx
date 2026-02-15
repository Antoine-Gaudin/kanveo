// src/components/feedback/ContactFormModal.jsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FeedbackService } from '@/services/feedbackService';

export default function ContactFormModal({ open, onOpenChange }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: profile?.full_name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      });
      setErrors({});
      setSuccess(false);
    }
  }, [open, user, profile]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Veuillez entrer votre nom';
    if (!form.email.trim()) errs.email = 'Veuillez entrer votre email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (!form.subject.trim() || form.subject.trim().length < 3)
      errs.subject = "L'objet doit contenir au moins 3 caractères";
    if (!form.message.trim() || form.message.trim().length < 10)
      errs.message = 'Le message doit contenir au moins 10 caractères';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await FeedbackService.createFeedback({
        userId: user?.id || null,
        userEmail: form.email,
        userName: form.name,
        category: 'question',
        subject: `[Contact] ${form.subject}`,
        message: form.message,
        pageUrl: window.location.pathname,
      });
      setSuccess(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold">Message envoyé !</h3>
            <p className="text-muted-foreground">
              Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Nous contacter
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nom *</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Votre nom"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="votre@email.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-subject">Objet *</Label>
            <Input
              id="contact-subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="L'objet de votre message"
              maxLength={200}
            />
            {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">Message *</Label>
            <Textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Décrivez votre demande..."
              rows={5}
              maxLength={5000}
            />
            <div className="flex justify-between">
              {errors.message ? (
                <p className="text-sm text-destructive">{errors.message}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">{form.message.length}/5000</span>
            </div>
          </div>

          {errors.submit && <p className="text-sm text-destructive text-center">{errors.submit}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
