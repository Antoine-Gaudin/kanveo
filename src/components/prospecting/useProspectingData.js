// src/components/prospecting/useProspectingData.js
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STATUSES, STORAGE_KEYS } from "../../config/constants";
import { deleteProspect as deleteProspectFromSupabase } from "../../services/prospectService";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const EMPTY_PROSPECTS = [];

export default function useProspectingData(boardId = null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const queryKey = ['prospects', user?.id, boardId];

  // React Query : cache les prospects (persiste lors de la navigation)
  const {
    data: prospects = EMPTY_PROSPECTS,
    isLoading: prospectsLoading,
    error: prospectsError,
    refetch: refetchProspects,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospects")
        .select(`
          *,
          sirene_infos (
            siret,
            creation_date,
            legal_form,
            ape_code,
            address,
            sector,
            raw
          ),
          contacts (
            id,
            full_name,
            email,
            phone,
            notes,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .eq("board_id", boardId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      // Fusionner les données SIRENE et contacts dans l'objet prospect
      return (data || []).map(prospect => ({
        ...prospect,
        createdAt: prospect.created_at,
        siret: prospect.sirene_infos?.siret || null,
        creationDate: prospect.sirene_infos?.creation_date || null,
        juridicalForm: prospect.sirene_infos?.legal_form || null,
        activityCode: prospect.sirene_infos?.ape_code || null,
        activityLabel: prospect.sirene_infos?.sector || null,
        sireneRaw: prospect.sirene_infos?.raw || null,
        contacts: (prospect.contacts || []).map(contact => ({
          id: contact.id,
          name: contact.full_name,
          email: contact.email,
          phone: contact.phone,
          notes: contact.notes,
          date: contact.created_at,
          type: "contact"
        })),
        sirene_infos: undefined
      }));
    },
    enabled: !!user?.id && !!boardId,
    refetchOnWindowFocus: true,
  });

  // Helper : met à jour le cache React Query
  const setProspects = (valueOrUpdater) => {
    if (typeof valueOrUpdater === 'function') {
      qc.setQueryData(queryKey, (old) => valueOrUpdater(old || []));
    } else {
      qc.setQueryData(queryKey, valueOrUpdater);
    }
  };

  async function addProspect(data) {
    // Créer le prospect en local d'abord pour que ce soit instantané
    const localProspect = {
      id: Date.now().toString(),
      ...data,
      status: "prospect",
      createdAt: new Date().toISOString(),
      contacts: []
    };

    setProspects((p) => [...p, localProspect]);
    
    // Si utilisateur connecté, créer dans Supabase aussi EN ARRIÈRE-PLAN
    if (user?.id) {
      // Créer une promesse avec timeout
      const prospectInsertData = {
        user_id: user.id,
        name: data.name || null,
        company: data.company || null,
        email: data.email || null,
        phone: data.phone || null,
        status: "prospect",
        notes: data.notes || null,
        tags: [],
        activity_label: data.activityLabel || null,
        address: data.address || null,
      };

      // Ajouter board_id s'il existe
      if (boardId) {
        prospectInsertData.board_id = boardId;
      }

      const supabasePromise = supabase
        .from("prospects")
        .insert([prospectInsertData])
        .select()
        .single();

      // Ajouter un timeout de 15 secondes (plus réaliste pour Supabase)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout Supabase")), 15000)
      );

      try {
        const { data: newProspect, error } = await Promise.race([
          supabasePromise,
          timeoutPromise
        ]);

        if (error) {
          // Erreur Supabase silencieuse
        } else if (newProspect) {
          // Créer une entrée sirene_infos avec valeurs null (même si pas de SIRENE)
          const { error: sireneError } = await supabase
            .from("sirene_infos")
            .insert([
              {
                prospect_id: newProspect.id,
                siret: null,
                creation_date: null,
                legal_form: null,
                ape_code: null,
                address: null,
                sector: null,
                raw: null,
              },
            ]);
          
          if (sireneError) {
            // Erreur création sirene_infos non-bloquante
          }
          
          // Mettre à jour le local avec l'ID Supabase
          setProspects((p) =>
            p.map((prospect) =>
              prospect.id === localProspect.id ? { ...newProspect } : prospect
            )
          );
          return newProspect;
        }
      } catch (error) {
        // Erreur Supabase non-bloquante, données locales préservées
      }
    }

    return localProspect;
  }

  async function updateProspect(id, data) {
    // Mettre à jour en local d'abord
    setProspects((p) =>
      p.map((prospect) => (prospect.id === id ? { ...prospect, ...data } : prospect))
    );

    // Puis mettre à jour dans Supabase si c'est un UUID
    if (id && id.length > 10 && id.includes('-')) {
      try {
        // Ne garder que les colonnes valides de la table prospects
        const allowedColumns = [
          'name', 'company', 'email', 'phone', 'status', 'notes', 'tags',
          'siret', 'juridical_form', 'activity_code', 'activity_label',
          'address', 'creation_date', 'board_id'
        ];
        const sanitizedData = {};
        for (const key of allowedColumns) {
          if (data[key] !== undefined) {
            sanitizedData[key] = data[key];
          }
        }
        if (Object.keys(sanitizedData).length > 0) {
          await supabase
            .from("prospects")
            .update(sanitizedData)
            .eq("id", id);
        }
      } catch (error) {
        // Erreur silencieuse
      }
    }
  }

  async function deleteProspect(id) {
    // Supprimer de localStorage d'abord
    setProspects((p) => p.filter((prospect) => prospect.id !== id));
    
    // Puis supprimer de Supabase si c'est un UUID (36 caractères avec tirets)
    // UUID format: 8-4-4-4-12 = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    if (id && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        await deleteProspectFromSupabase(id);
      } catch (error) {
        // L'élément a été supprimé localement
      }
    }
  }

  function moveProspect(id, newStatus) {
    updateProspect(id, { status: newStatus });
  }

  async function addContact(prospectId, contactType, contactData) {
    const localContact = {
      id: Date.now().toString(),
      type: contactType,
      date: new Date().toISOString(),
      name: contactData.name || "",
      email: contactData.email || "",
      phone: contactData.phone || "",
      notes: contactData.notes || "",
    };

    setProspects((p) => {
      const updated = p.map((prospect) => {
        if (prospect.id === prospectId) {
          return {
            ...prospect,
            contacts: [
              ...(prospect.contacts || []),
              localContact,
            ],
          };
        }
        return prospect;
      });
      return updated;
    });

    // Si l'utilisateur est connecté et le prospect a un UUID Supabase, sauvegarder dans la table contacts
    if (user?.id && prospectId && prospectId.length > 10 && prospectId.includes('-')) {
      try {
        const contactToInsert = {
          user_id: user.id,
          prospect_id: prospectId,
          full_name: contactData.name || "",
          email: contactData.email || null,
          phone: contactData.phone || null,
          notes: contactData.notes || null,
        };

        const { data: newContact, error: insertError } = await supabase
          .from("contacts")
          .insert(contactToInsert)
          .select()
          .single();

        if (insertError) {
          return;
        }

        setProspects((p) =>
          p.map((prospect) => {
            if (prospect.id === prospectId) {
              return {
                ...prospect,
                contacts: prospect.contacts.map(contact =>
                  contact.id === localContact.id
                    ? { ...contact, id: newContact.id }
                    : contact
                ),
              };
            }
            return prospect;
          })
        );

      } catch (error) {
        // Erreur silencieuse
      }
    }
  }

  async function deleteContact(prospectId, contactId) {
    // Mettre à jour l'état local immédiatement
    setProspects((p) =>
      p.map((prospect) => {
        if (prospect.id === prospectId) {
          return {
            ...prospect,
            contacts: prospect.contacts.filter(contact => contact.id !== contactId),
          };
        }
        return prospect;
      })
    );

    // Si le contactId est un UUID Supabase, supprimer de la table contacts
    if (contactId && contactId.length > 10 && contactId.includes('-')) {
      try {
        const { error } = await supabase
          .from("contacts")
          .delete()
          .eq("id", contactId);

        if (error) {
          // Erreur silencieuse
        }
      } catch (error) {
        // Erreur silencieuse
      }
    }
  }

  return {
    prospects,
    STATUSES,
    addProspect,
    updateProspect,
    deleteProspect,
    moveProspect,
    addContact,
    deleteContact,
  };
}