// src/services/taskService.js
import { supabase } from '../lib/supabaseClient';

export class TaskService {
  // Récupérer toutes les tâches d'un utilisateur ou workspace
  static async getTasks(userId, workspaceId = null, boardId = null) {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      // Tâches personnelles
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    if (boardId) {
      query = query.eq('board_id', boardId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // Récupérer les tâches d'un prospect
  static async getTasksByProspect(prospectId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Créer une nouvelle tâche
  static async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: taskData.userId,
        workspace_id: taskData.workspaceId || null,
        board_id: taskData.boardId || null,
        prospect_id: taskData.prospectId || null,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        due_date: taskData.dueDate || null,
        assigned_to: taskData.assignedTo || null,
        checklist: taskData.checklist || []
      }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour une tâche
  static async updateTask(taskId, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Changer le statut d'une tâche
  static async changeTaskStatus(taskId, newStatus) {
    const updates = { status: newStatus };

    // Si la tâche passe à 'done', ajouter la date de complétion
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    return await this.updateTask(taskId, updates);
  }

  // Supprimer une tâche
  static async deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return true;
  }

  // Supprimer plusieurs tâches en lot
  static async deleteMultipleTasks(taskIds) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds);

    if (error) throw error;
    return true;
  }

  // Mettre à jour la checklist d'une tâche
  static async updateChecklist(taskId, checklist) {
    return await this.updateTask(taskId, { checklist });
  }

  // Récupérer les commentaires d'une tâche
  static async getComments(taskId) {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Ajouter un commentaire
  static async addComment(taskId, userId, content) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert([{
        task_id: taskId,
        user_id: userId,
        content
      }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour un commentaire
  static async updateComment(commentId, content) {
    const { data, error } = await supabase
      .from('task_comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer un commentaire
  static async deleteComment(commentId) {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return true;
  }

  // Obtenir les statistiques des tâches
  static async getTaskStats(userId, workspaceId = null) {
    let query = supabase
      .from('tasks')
      .select('status, priority');

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total: data.length,
      todo: data.filter(t => t.status === 'todo').length,
      in_progress: data.filter(t => t.status === 'in_progress').length,
      done: data.filter(t => t.status === 'done').length,
      blocked: data.filter(t => t.status === 'blocked').length,
      urgent: data.filter(t => t.priority === 'urgent').length,
      high: data.filter(t => t.priority === 'high').length,
      medium: data.filter(t => t.priority === 'medium').length,
      low: data.filter(t => t.priority === 'low').length,
    };

    return stats;
  }

  // Obtenir les tâches en retard
  static async getOverdueTasks(userId, workspaceId = null) {
    let query = supabase
      .from('tasks')
      .select('*')
      .lt('due_date', new Date().toISOString())
      .neq('status', 'done')
      .order('due_date', { ascending: true });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
}
