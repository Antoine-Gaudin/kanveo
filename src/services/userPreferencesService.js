// src/services/userPreferencesService.js
import { supabase } from '../lib/supabaseClient';

export const UserPreferencesService = {
  /**
   * Récupère les préférences utilisateur pour un workspace spécifique
   */
  async getUserWorkspacePreferences(userId, workspaceId = null) {
    try {
      let query = supabase
        .from('user_workspace_preferences')
        .select('*')
        .eq('user_id', userId);

      // Gérer le cas où workspaceId est null
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      } else {
        query = query.is('workspace_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Sauvegarde le dernier board sélectionné par l'utilisateur
   */
  async saveLastSelectedBoard(userId, boardId, workspaceId = null) {
    try {
      const { data, error } = await supabase
        .from('user_workspace_preferences')
        .upsert({
          user_id: userId,
          workspace_id: workspaceId,
          last_selected_board_id: boardId
        }, {
          onConflict: workspaceId ? 'user_id,workspace_id' : 'user_id'
        })
        .select()
        .single();

      if (error) {
        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Récupère le dernier board sélectionné par l'utilisateur
   */
  async getLastSelectedBoard(userId, workspaceId = null) {
    try {
      const preferences = await this.getUserWorkspacePreferences(userId, workspaceId);
      return preferences?.last_selected_board_id || null;
    } catch (error) {
      return null;
    }
  }
};
