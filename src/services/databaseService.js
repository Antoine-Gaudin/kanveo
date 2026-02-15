// src/services/databaseService.js
import { supabase } from '../lib/supabaseClient';

// Sanitize search input to prevent PostgREST filter injection
// Escapes characters that have special meaning in PostgREST .or() filters
function sanitizeSearchTerm(term) {
  return term.replace(/[,.()\\/]/g, '');
}

export class DatabaseService {
  // ═══════════════════════════════════════
  // COLUMN CONFIG
  // ═══════════════════════════════════════

  static async getColumnConfig(userId) {
    const { data, error } = await supabase
      .from('database_column_configs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async saveColumnConfig(userId, columns) {
    const { data, error } = await supabase
      .from('database_column_configs')
      .upsert(
        { user_id: userId, columns },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ═══════════════════════════════════════
  // IMPORTS
  // ═══════════════════════════════════════

  static async getImports(userId, workspaceId = null) {
    let query = supabase
      .from('database_imports')
      .select('*')
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createImport(userId, workspaceId, { file_name, row_count, mapping }) {
    const { data, error } = await supabase
      .from('database_imports')
      .insert([{
        user_id: userId,
        workspace_id: workspaceId || null,
        file_name,
        row_count,
        mapping,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteImport(importId) {
    const { error } = await supabase
      .from('database_imports')
      .delete()
      .eq('id', importId);

    if (error) throw error;
  }

  // ═══════════════════════════════════════
  // ROWS
  // ═══════════════════════════════════════

  static async getRows(userId, workspaceId = null, { page = 0, pageSize = 25, search = '', importId = null } = {}) {
    let query = supabase
      .from('database_rows')
      .select('*')
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    if (importId) {
      query = query.eq('import_id', importId);
    }

    if (search.trim()) {
      const term = `%${sanitizeSearchTerm(search.trim())}%`;
      query = query.or(
        `data->>name.ilike.${term},data->>company.ilike.${term},data->>email.ilike.${term},data->>phone.ilike.${term},data->>address.ilike.${term},data->>city.ilike.${term},notes.ilike.${term}`
      );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getRowCount(userId, workspaceId = null, { search = '', importId = null } = {}) {
    let query = supabase
      .from('database_rows')
      .select('*', { count: 'exact', head: true });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    if (importId) {
      query = query.eq('import_id', importId);
    }

    if (search.trim()) {
      const term = `%${sanitizeSearchTerm(search.trim())}%`;
      query = query.or(
        `data->>name.ilike.${term},data->>company.ilike.${term},data->>email.ilike.${term},data->>phone.ilike.${term},data->>address.ilike.${term},data->>city.ilike.${term},notes.ilike.${term}`
      );
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  static async insertRows(rows) {
    const { data, error } = await supabase
      .from('database_rows')
      .insert(rows)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async updateRow(rowId, updates) {
    const { data, error } = await supabase
      .from('database_rows')
      .update(updates)
      .eq('id', rowId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteRow(rowId) {
    const { error } = await supabase
      .from('database_rows')
      .delete()
      .eq('id', rowId);

    if (error) throw error;
  }

  static async markAsPipelined(rowIds) {
    const { data, error } = await supabase
      .from('database_rows')
      .update({ is_pipelined: true })
      .in('id', rowIds)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async getAllFilteredRows(userId, workspaceId = null, { search = '', importId = null } = {}) {
    let query = supabase
      .from('database_rows')
      .select('*')
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    if (importId) {
      query = query.eq('import_id', importId);
    }

    if (search.trim()) {
      const term = `%${sanitizeSearchTerm(search.trim())}%`;
      query = query.or(
        `data->>name.ilike.${term},data->>company.ilike.${term},data->>email.ilike.${term},data->>phone.ilike.${term},data->>address.ilike.${term},data->>city.ilike.${term},notes.ilike.${term}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}
