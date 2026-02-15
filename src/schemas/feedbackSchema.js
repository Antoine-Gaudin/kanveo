import { z } from 'zod';

export const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: '🐛 Bug / Problème' },
  { value: 'feature_request', label: '💡 Suggestion de fonctionnalité' },
  { value: 'feedback', label: '💬 Retour général' },
  { value: 'question', label: '❓ Question' },
  { value: 'other', label: '📝 Autre' },
];

export const FEEDBACK_STATUSES = [
  { value: 'new', label: 'Nouveau', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'En cours', color: 'bg-yellow-500' },
  { value: 'resolved', label: 'Résolu', color: 'bg-green-500' },
  { value: 'closed', label: 'Fermé', color: 'bg-gray-500' },
];

export const feedbackSchema = z.object({
  category: z.enum(['bug', 'feedback', 'feature_request', 'question', 'other'], {
    required_error: 'Veuillez choisir une catégorie',
  }),
  subject: z.string()
    .min(3, 'L\'objet doit contenir au moins 3 caractères')
    .max(200, 'L\'objet est trop long (200 caractères max)'),
  message: z.string()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(5000, 'Le message est trop long (5000 caractères max)'),
});

export function validateFeedback(data) {
  const result = feedbackSchema.safeParse(data);
  if (!result.success) {
    const errors = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (!errors[field]) errors[field] = issue.message;
    });
    return { valid: false, errors };
  }
  return { valid: true, errors: {} };
}
