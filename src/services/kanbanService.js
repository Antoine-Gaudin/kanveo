// src/services/kanbanService.js
import { supabase } from '../lib/supabaseClient';

export class KanbanService {
  // Récupérer tous les tableaux Kanban d'un utilisateur
  static async getUserKanbanBoards(userId, workspaceId = null, boardType = 'pipeline') {
    try {
      let query = supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .eq('board_type', boardType)
        .order('created_at', { ascending: true });

      // Si workspaceId est défini, filtrer par workspace
      // Si workspaceId est undefined/null, retourner TOUS les tableaux de l'utilisateur
      if (workspaceId !== null && workspaceId !== undefined) {
        query = query.eq('workspace_id', workspaceId);
      }
      // Sinon, on ne filtre pas par workspace_id, on retourne tous les tableaux

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur chargement tableaux Kanban:', error.message);
      throw error;
    }
  }

  // Statuts par défaut pour les boards de tâches (format riche)
  static DEFAULT_TASK_STATUSES = [
    { id: 'todo', label: 'À faire', icon: '📋', color: 'slate' },
    { id: 'in_progress', label: 'En cours', icon: '⚡', color: 'blue' },
    { id: 'blocked', label: 'Bloqué', icon: '❌', color: 'red' },
    { id: 'done', label: 'Terminé', icon: '✅', color: 'green' },
  ];

  // Créer un nouveau tableau Kanban
  static async createKanbanBoard(boardData) {
    const boardType = boardData.boardType || 'pipeline';

    // Déterminer les statuts par défaut en fonction du type
    let defaultStatuses;
    if (boardType === 'tasks') {
      defaultStatuses = this.DEFAULT_TASK_STATUSES;
    } else {
      defaultStatuses = ["prospect", "contacte", "attente", "client", "perdu"];

      if (boardData.workspaceId && !boardData.statuses) {
        try {
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('default_pipeline_columns')
            .eq('id', boardData.workspaceId)
            .single();

          if (workspace?.default_pipeline_columns) {
            defaultStatuses = workspace.default_pipeline_columns;
          }
        } catch (err) {
          // Utilisation des colonnes par défaut
        }
      }
    }

    const { data, error } = await supabase
      .from('kanban_boards')
      .insert([{
        name: boardData.name,
        user_id: boardData.userId,
        workspace_id: boardData.workspaceId || null,
        statuses: boardData.statuses || defaultStatuses,
        is_default: boardData.isDefault || false,
        board_type: boardType
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour un tableau Kanban
  static async updateKanbanBoard(boardId, updates) {
    const { data, error } = await supabase
      .from('kanban_boards')
      .update(updates)
      .eq('id', boardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer un tableau Kanban
  static async deleteKanbanBoard(boardId) {
    const { error } = await supabase
      .from('kanban_boards')
      .delete()
      .eq('id', boardId);

    if (error) throw error;
    return true;
  }

  // Définir un tableau comme par défaut
  static async setDefaultBoard(userId, boardId, workspaceId = null) {
    // Récupérer le tableau pour connaître son workspace_id et board_type
    const { data: targetBoard } = await supabase
      .from('kanban_boards')
      .select('workspace_id, board_type')
      .eq('id', boardId)
      .single();

    // Utiliser le workspace_id du tableau cible si workspaceId n'est pas fourni
    const effectiveWorkspaceId = workspaceId !== null && workspaceId !== undefined
      ? workspaceId
      : targetBoard?.workspace_id;

    const effectiveBoardType = targetBoard?.board_type || 'pipeline';

    // D'abord, enlever le statut par défaut de tous les autres tableaux du même type et workspace
    let resetQuery = supabase
      .from('kanban_boards')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('board_type', effectiveBoardType);

    if (effectiveWorkspaceId !== null && effectiveWorkspaceId !== undefined) {
      resetQuery = resetQuery.eq('workspace_id', effectiveWorkspaceId);
    } else {
      resetQuery = resetQuery.is('workspace_id', null);
    }

    const { error: resetError } = await resetQuery;

    if (resetError) {
      throw new Error('Erreur lors de la réinitialisation des tableaux par défaut: ' + resetError.message);
    }

    // Ensuite, définir le nouveau tableau par défaut
    const { data, error } = await supabase
      .from('kanban_boards')
      .update({ is_default: true })
      .eq('id', boardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Récupérer le tableau par défaut d'un utilisateur
  static async getDefaultBoard(userId, workspaceId = null, boardType = 'pipeline') {
    try {
      let query = supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .eq('board_type', boardType)
        .order('created_at', { ascending: true });

      // Si workspaceId est défini, filtrer par workspace
      // Si workspaceId est undefined/null, retourner le premier tableau par défaut trouvé
      if (workspaceId !== null && workspaceId !== undefined) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // S'il n'y a pas de tableau par défaut, en créer un
      if (!data || data.length === 0) {
        return await this.createDefaultBoard(userId, workspaceId, boardType);
      }

      // Retourner le premier tableau par défaut trouvé
      return data[0];
    } catch (error) {
      return await this.createDefaultBoard(userId, workspaceId, boardType);
    }
  }

  // Créer un tableau par défaut
  static async createDefaultBoard(userId, workspaceId = null, boardType = 'pipeline') {
    const name = boardType === 'tasks'
      ? 'Mes Tâches'
      : (workspaceId ? 'Pipeline Principal' : 'Pipeline Personnel');

    const defaultBoard = await this.createKanbanBoard({
      name,
      userId: userId,
      workspaceId: workspaceId,
      isDefault: true,
      boardType
    });

    return defaultBoard;
  }

  // Basculer tous les prospects d'un utilisateur vers un nouveau tableau par défaut
  static async migrateProspectsToBoard(userId, boardId, workspaceId = null) {
    let query = supabase
      .from('prospects')
      .update({ board_id: boardId })
      .eq('user_id', userId)
      .is('board_id', null); // Uniquement les prospects sans board_id

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }
}