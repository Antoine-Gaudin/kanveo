import { z } from 'zod';

// Expression régulière pour SIRET (14 chiffres)
const siretRegex = /^\d{14}$/;

// Expression régulière pour téléphone français
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

/**
 * Schéma de validation pour un prospect
 */
export const prospectSchema = z.object({
  company: z.string()
    .min(1, 'Le nom de l\'entreprise est obligatoire')
    .max(200, 'Le nom de l\'entreprise est trop long'),

  name: z.string()
    .max(200, 'Le nom du contact est trop long')
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('Email invalide')
    .max(200, 'L\'email est trop long')
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .regex(phoneRegex, 'Numéro de téléphone invalide (format français attendu)')
    .optional()
    .or(z.literal('')),

  siret: z.string()
    .regex(siretRegex, 'SIRET invalide (14 chiffres attendus)')
    .optional()
    .or(z.literal('')),

  address: z.string()
    .max(500, 'L\'adresse est trop longue')
    .optional()
    .or(z.literal('')),

  activityCode: z.string()
    .max(10, 'Code APE invalide')
    .optional()
    .or(z.literal('')),

  activityLabel: z.string()
    .max(500, 'Libellé d\'activité trop long')
    .optional()
    .or(z.literal('')),

  juridicalForm: z.string()
    .max(200, 'Forme juridique trop longue')
    .optional()
    .or(z.literal('')),

  creationDate: z.string()
    .optional()
    .or(z.literal('')),

  tags: z.array(z.string()).optional().default([]),

  notes: z.string()
    .max(5000, 'Les notes sont trop longues')
    .optional()
    .or(z.literal('')),

  status: z.enum(['prospect', 'contacte', 'attente', 'client', 'perdu'])
    .default('prospect'),
});

/**
 * Schéma partiel pour la mise à jour (tous les champs optionnels)
 */
export const prospectUpdateSchema = prospectSchema.partial();

/**
 * Fonction utilitaire pour valider un prospect
 */
export function validateProspect(data) {
  try {
    const validatedData = prospectSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { success: false, errors };
    }
    return { success: false, errors: [{ field: 'unknown', message: error.message }] };
  }
}

/**
 * Fonction utilitaire pour valider une mise à jour partielle
 */
export function validateProspectUpdate(data) {
  try {
    const validatedData = prospectUpdateSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { success: false, errors };
    }
    return { success: false, errors: [{ field: 'unknown', message: error.message }] };
  }
}
