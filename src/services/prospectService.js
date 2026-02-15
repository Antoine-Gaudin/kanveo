// src/services/prospectService.js
import { supabase } from "../lib/supabaseClient";

/**
 * Crée un prospect et ses infos SIRENE associées dans Supabase
 * @param {Object} prospectData - Données du prospect
 * @param {Object} sireneData - Données SIRENE brutes
 * @param {string} userId - ID de l'utilisateur connecté
 * @param {string} workspaceId - ID du workspace
 * @returns {Promise<Object>} Le prospect créé
 */
export async function createProspectFromSirene(prospectData, sireneData, userId, workspaceId) {
  // Validation des paramètres requis
  if (!userId) {
    throw new Error("L'ID utilisateur est requis pour créer un prospect");
  }
  if (!workspaceId) {
    throw new Error("L'ID du workspace est requis pour créer un prospect");
  }
  if (!prospectData || typeof prospectData !== "object") {
    throw new Error("Les données du prospect sont invalides");
  }

  // 1. Créer le prospect dans la table prospects
  const prospectInsertData = {
    user_id: userId,
    name: prospectData.name || null,
    company: prospectData.company || null,
    email: prospectData.email || null,
    phone: prospectData.phone || null,
    status: "prospect",
    notes: prospectData.notes || null,
    siret: prospectData.siret || null,
    juridical_form: prospectData.juridicalForm || null,
    activity_code: prospectData.activityCode || null,
    activity_label: prospectData.activityLabel || null,
    address: prospectData.address || null,
    creation_date: prospectData.creationDate || null,
    tags: [],
  };

  // Ajouter workspace_id s'il y a un workspaceId (la colonne peut exister ou non)
  if (workspaceId) {
    prospectInsertData.workspace_id = workspaceId;
  }

  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .insert([prospectInsertData])
    .select()
    .single();

  if (prospectError) {
    throw new Error(`Erreur lors de la création du prospect: ${prospectError.message}`);
  }

  // 2. Créer les infos SIRENE complètes dans la table sirene_infos
  if (prospect && sireneData && sireneData.raw) {
    const { error: sireneError } = await supabase
      .from("sirene_infos")
      .insert([
        {
          prospect_id: prospect.id,
          siret: prospectData.siret || null,
          creation_date: prospectData.creationDate || null,
          legal_form: prospectData.juridicalForm || null,
          ape_code: prospectData.activityCode || null,
          address: prospectData.address || null,
          sector: prospectData.activityLabel || null,
          raw: sireneData.raw, // Données SIRENE complètes en JSON
        },
      ]);

    if (sireneError) {
      console.warn('Erreur SIRENE (prospect créé sans enrichissement):', sireneError.message);
    }
  }

  return prospect;
}

/**
 * Récupère tous les prospects de l'utilisateur dans un workspace
 * @param {string} userId - ID de l'utilisateur
 * @param {string} workspaceId - ID du workspace
 * @returns {Promise<Array>} Liste des prospects
 */
export async function getProspects(userId, workspaceId) {
  if (!userId) {
    throw new Error("L'ID utilisateur est requis pour récupérer les prospects");
  }

  // Récupérer les prospects de l'utilisateur
  let query = supabase
    .from("prospects")
    .select("*")
    .eq("user_id", userId);

  // Ajouter le filtre workspace s'il existe
  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false });

  if (error) {
    // Si l'erreur parle de colonne manquante, on continue sans filtre workspace
    if (error.message && error.message.includes("workspace_id")) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("prospects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (fallbackError) {
        throw fallbackError;
      }
      return fallbackData || [];
    }
    throw error;
  }
  return data || [];
}

/**
 * Met à jour un prospect
 * @param {string} prospectId - ID du prospect
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>} Le prospect mis à jour
 */
export async function updateProspect(prospectId, updates) {
  if (!prospectId) {
    throw new Error("L'ID du prospect est requis pour la mise à jour");
  }
  if (!updates || typeof updates !== "object" || Object.keys(updates).length === 0) {
    throw new Error("Les données de mise à jour sont invalides ou vides");
  }

  const { data, error } = await supabase
    .from("prospects")
    .update(updates)
    .eq("id", prospectId)
    .select()
    .single();

  if (error) {
    throw new Error(`Impossible de mettre à jour le prospect: ${error.message}`);
  }
  return data;
}

/**
 * Supprime un prospect (et ses infos SIRENE associées)
 * @param {string} prospectId - ID du prospect à supprimer
 * @returns {Promise<void>}
 */
export async function deleteProspect(prospectId) {
  if (!prospectId) {
    throw new Error("L'ID du prospect est requis pour la suppression");
  }

  // Les infos SIRENE seront supprimées automatiquement grâce au ON DELETE CASCADE
  const { error } = await supabase
    .from("prospects")
    .delete()
    .eq("id", prospectId);

  if (error) {
    throw new Error(`Impossible de supprimer le prospect: ${error.message}`);
  }
}

/**
 * Ajoute un contact à un prospect
 * @param {string} prospectId - ID du prospect
 * @param {Object} contactData - Données du contact
 * @returns {Promise<Object>} Le contact créé
 */
export async function addProspectContact(prospectId, contactData) {
  if (!prospectId) {
    throw new Error("L'ID du prospect est requis pour ajouter un contact");
  }
  if (!contactData || typeof contactData !== "object") {
    throw new Error("Les données du contact sont invalides");
  }

  const { data, error } = await supabase
    .from("prospect_contacts")
    .insert([
      {
        prospect_id: prospectId,
        name: contactData.name || null,
        email: contactData.email || null,
        phone: contactData.phone || null,
        type: contactData.type || "contact",
        notes: contactData.notes || null,
        date: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Impossible d'ajouter le contact: ${error.message}`);
  }
  return data;
}

/**
 * Récupère les contacts d'un prospect
 * @param {string} prospectId - ID du prospect
 * @returns {Promise<Array>} Liste des contacts
 */
export async function getProspectContacts(prospectId) {
  if (!prospectId) {
    throw new Error("L'ID du prospect est requis pour récupérer les contacts");
  }

  const { data, error } = await supabase
    .from("prospect_contacts")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Impossible de récupérer les contacts: ${error.message}`);
  }
  return data || [];
}

/**
 * Supprime un contact
 * @param {string} contactId - ID du contact
 * @returns {Promise<void>}
 */
export async function deleteProspectContact(contactId) {
  if (!contactId) {
    throw new Error("L'ID du contact est requis pour la suppression");
  }

  const { error } = await supabase
    .from("prospect_contacts")
    .delete()
    .eq("id", contactId);

  if (error) {
    throw new Error(`Impossible de supprimer le contact: ${error.message}`);
  }
}
