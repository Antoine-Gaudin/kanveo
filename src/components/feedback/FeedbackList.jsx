// src/components/feedback/FeedbackList.jsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  FileText,
  Clock,
  User,
  Mail,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  Save,
} from 'lucide-react';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from '@/schemas/feedbackSchema';

const CATEGORY_ICONS = {
  bug: Bug,
  feature_request: Lightbulb,
  feedback: MessageSquare,
  question: HelpCircle,
  other: FileText,
};

function StatusBadge({ status }) {
  const statusInfo = FEEDBACK_STATUSES.find(s => s.value === status) || FEEDBACK_STATUSES[0];
  const variants = {
    new: 'default',
    in_progress: 'secondary',
    resolved: 'outline',
    closed: 'outline',
  };
  return (
    <Badge variant={variants[status] || 'default'} className="text-xs">
      <span className={`w-2 h-2 rounded-full ${statusInfo.color} mr-1.5 inline-block`} />
      {statusInfo.label}
    </Badge>
  );
}

function CategoryLabel({ category }) {
  const cat = FEEDBACK_CATEGORIES.find(c => c.value === category);
  return <span className="text-sm">{cat?.label || category}</span>;
}

export default function FeedbackList({
  feedbacks = [],
  loading = false,
  onUpdateStatus,
  onDelete,
  onConfirm,
  isAdmin = false,
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [editNotes, setEditNotes] = useState({});
  const [savingId, setSavingId] = useState(null);

  const filtered = filterStatus === 'all'
    ? feedbacks
    : feedbacks.filter(f => f.status === filterStatus);

  const counts = {
    all: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    in_progress: feedbacks.filter(f => f.status === 'in_progress').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
    closed: feedbacks.filter(f => f.status === 'closed').length,
  };

  const handleStatusChange = async (feedbackId, newStatus) => {
    setSavingId(feedbackId);
    try {
      const notes = editNotes[feedbackId] !== undefined ? editNotes[feedbackId] : null;
      await onUpdateStatus(feedbackId, newStatus, notes);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNotes = async (feedbackId, currentStatus) => {
    setSavingId(feedbackId);
    try {
      await onUpdateStatus(feedbackId, currentStatus, editNotes[feedbackId] || '');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (feedbackId) => {
    const confirmed = await onConfirm(
      'Supprimer ce feedback ?',
      'Cette action est irréversible.'
    );
    if (confirmed) {
      await onDelete(feedbackId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {isAdmin && (
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {[
            { value: 'all', label: 'Tous' },
            ...FEEDBACK_STATUSES,
          ].map((s) => (
            <Button
              key={s.value}
              variant={filterStatus === s.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(s.value)}
              className="gap-1.5"
            >
              {s.label}
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {counts[s.value] || 0}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              {feedbacks.length === 0
                ? (isAdmin ? 'Aucun feedback reçu pour le moment.' : 'Vous n\'avez envoyé aucun feedback.')
                : 'Aucun feedback avec ce filtre.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feedback items */}
      {filtered.map((fb) => {
        const Icon = CATEGORY_ICONS[fb.category] || MessageSquare;
        const isExpanded = expandedId === fb.id;

        return (
          <Card key={fb.id} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-4 pb-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground truncate">{fb.subject}</h4>
                      <StatusBadge status={fb.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <CategoryLabel category={fb.category} />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(fb.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isAdmin && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {fb.user_name || 'Anonyme'}
                        </span>
                      )}
                      {isAdmin && fb.user_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {fb.user_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Message */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{fb.message}</p>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="space-y-3">
                      {/* Status change */}
                      <div className="flex items-center gap-3">
                        <Select
                          value={fb.status}
                          onValueChange={(v) => handleStatusChange(fb.id, v)}
                          disabled={savingId === fb.id}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FEEDBACK_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${s.color} inline-block`} />
                                  {s.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {savingId === fb.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>

                      {/* Admin notes */}
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Notes internes (visibles uniquement par l'admin)..."
                          value={editNotes[fb.id] !== undefined ? editNotes[fb.id] : (fb.admin_notes || '')}
                          onChange={(e) => setEditNotes(prev => ({ ...prev, [fb.id]: e.target.value }))}
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveNotes(fb.id, fb.status)}
                            disabled={savingId === fb.id}
                            className="gap-1.5"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Sauvegarder les notes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(fb.id)}
                            className="text-destructive hover:text-destructive gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User view: admin notes visible if resolved/closed */}
                  {!isAdmin && fb.admin_notes && ['resolved', 'closed'].includes(fb.status) && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-primary mb-1">Réponse de l'équipe</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{fb.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
