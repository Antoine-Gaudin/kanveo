// src/services/feedbackService.js
import { supabase } from '../lib/supabaseClient';

export class FeedbackService {
  /**
   * Créer un nouveau feedback (utilisateur)
   */
  static async createFeedback({ userId, userEmail, userName, category, subject, message, pageUrl }) {
    const { data, error } = await supabase
      .from('user_feedback')
      .insert([{
        user_id: userId,
        user_email: userEmail,
        user_name: userName || null,
        category,
        subject,
        message,
        page_url: pageUrl || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Récupérer les feedbacks de l'utilisateur connecté
   */
  static async getUserFeedback(userId) {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer tous les feedbacks (admin)
   */
  static async getAllFeedback() {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Mettre à jour le statut d'un feedback (admin)
   */
  static async updateFeedbackStatus(feedbackId, status, adminNotes = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (adminNotes !== null) {
      updates.admin_notes = adminNotes;
    }

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .update(updates)
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer un feedback (admin)
   */
  static async deleteFeedback(feedbackId) {
    const { error } = await supabase
      .from('user_feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) throw error;
  }
}
