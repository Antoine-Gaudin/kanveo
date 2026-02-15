// src/services/clientService.js
import { supabase } from '../lib/supabaseClient';

export class ClientService {
  // ═══════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════

  static async getClients(userId, workspaceId = null) {
    let query = supabase
      .from('clients')
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

  static async createClient(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        user_id: clientData.userId,
        workspace_id: clientData.workspaceId || null,
        prospect_id: clientData.prospectId || null,
        name: clientData.name,
        company: clientData.company || null,
        email: clientData.email || null,
        phone: clientData.phone || null,
        address: clientData.address || null,
        notes: clientData.notes || null,
        status: clientData.status || 'active',
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateClient(clientId, updates) {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteClient(clientId) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;
  }

  // Convertir un prospect en client
  static async convertProspect(userId, workspaceId, prospect) {
    return await this.createClient({
      userId,
      workspaceId,
      prospectId: prospect.id,
      name: prospect.company_name || prospect.name || 'Client',
      company: prospect.company_name || null,
      email: prospect.email || null,
      phone: prospect.phone || null,
      address: prospect.address || null,
      notes: `Converti depuis le pipeline le ${new Date().toLocaleDateString('fr-FR')}`,
    });
  }

  // Stats clients
  static async getClientStats(userId, workspaceId = null) {
    try {
      const clients = await this.getClients(userId, workspaceId);
      return {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
        archived: clients.filter(c => c.status === 'archived').length,
      };
    } catch (error) {
      return { total: 0, active: 0, inactive: 0, archived: 0 };
    }
  }

  // ═══════════════════════════════════════
  // CONTRATS
  // ═══════════════════════════════════════

  static async getContracts(userId, workspaceId = null, clientId = null) {
    let query = supabase
      .from('contracts')
      .select('*, clients(name, company)')
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createContract(contractData) {
    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        user_id: contractData.userId,
        workspace_id: contractData.workspaceId || null,
        client_id: contractData.clientId,
        title: contractData.title,
        description: contractData.description || null,
        amount: contractData.amount || 0,
        recurrence: contractData.recurrence || 'one_time',
        status: contractData.status || 'active',
        start_date: contractData.startDate || null,
        end_date: contractData.endDate || null,
        paid_amount: contractData.paidAmount || 0,
        payment_count: contractData.paymentCount || 1,
      }])
      .select('*, clients(name, company)')
      .single();

    if (error) throw error;
    return data;
  }

  static async updateContract(contractId, updates) {
    const { data, error } = await supabase
      .from('contracts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', contractId)
      .select('*, clients(name, company)')
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteContract(contractId) {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);

    if (error) throw error;
  }

  // ═══════════════════════════════════════
  // CHARGES / DÉPENSES
  // ═══════════════════════════════════════

  static async getExpenses(userId, workspaceId = null) {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.is('workspace_id', null).eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createExpense(expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: expenseData.userId,
        workspace_id: expenseData.workspaceId || null,
        label: expenseData.label,
        category: expenseData.category || 'other',
        amount: expenseData.amount || 0,
        recurrence: expenseData.recurrence || 'monthly',
        date: expenseData.date || new Date().toISOString().split('T')[0],
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateExpense(expenseId, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteExpense(expenseId) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  }

  // ═══════════════════════════════════════
  // BILAN FINANCIER
  // ═══════════════════════════════════════

  // Revenus mensuels RÉCURRENTS uniquement (monthly/quarterly/yearly)
  static calculateRecurringMonthlyRevenue(contracts) {
    return contracts
      .filter(c => c.status === 'active' && c.recurrence !== 'one_time')
      .reduce((sum, c) => {
        const amount = Number(c.amount) || 0;
        switch (c.recurrence) {
          case 'monthly': return sum + amount;
          case 'quarterly': return sum + (amount / 3);
          case 'yearly': return sum + (amount / 12);
          default: return sum;
        }
      }, 0);
  }

  // Total des contrats ponctuels (non annulés)
  static calculateOneTimeRevenue(contracts) {
    return contracts
      .filter(c => c.recurrence === 'one_time' && c.status !== 'cancelled')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  // Montant total encaissé (paid_amount)
  static calculateTotalPaid(contracts) {
    return contracts
      .filter(c => c.status !== 'cancelled')
      .reduce((sum, c) => sum + (Number(c.paid_amount) || 0), 0);
  }

  // Montant total restant à encaisser
  static calculateTotalUnpaid(contracts) {
    return contracts
      .filter(c => c.status !== 'cancelled')
      .reduce((sum, c) => {
        const total = Number(c.amount) || 0;
        const paid = Number(c.paid_amount) || 0;
        return sum + Math.max(0, total - paid);
      }, 0);
  }

  static calculateTotalContractValue(contracts) {
    return contracts
      .filter(c => c.status !== 'cancelled')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  static calculateMonthlyExpenses(expenses) {
    return expenses.reduce((sum, e) => {
      const amount = Number(e.amount) || 0;
      switch (e.recurrence) {
        case 'monthly': return sum + amount;
        case 'quarterly': return sum + (amount / 3);
        case 'yearly': return sum + (amount / 12);
        case 'one_time': return sum;
        default: return sum;
      }
    }, 0);
  }

  static calculateTotalExpenses(expenses) {
    return expenses.reduce((sum, e) => {
      const amount = Number(e.amount) || 0;
      return sum + amount;
    }, 0);
  }

  static getFinancialSummary(contracts, expenses) {
    const recurringMonthly = this.calculateRecurringMonthlyRevenue(contracts);
    const oneTimeTotal = this.calculateOneTimeRevenue(contracts);
    const totalPaid = this.calculateTotalPaid(contracts);
    const totalUnpaid = this.calculateTotalUnpaid(contracts);
    const totalContractValue = this.calculateTotalContractValue(contracts);
    const monthlyExpenses = this.calculateMonthlyExpenses(expenses);
    const totalExpenses = this.calculateTotalExpenses(expenses);

    // Bénéfice récurrent (sans les ponctuels)
    const recurringMonthlyProfit = recurringMonthly - monthlyExpenses;

    return {
      // Revenus récurrents
      recurringMonthly,
      recurringYearly: recurringMonthly * 12,
      // Revenus ponctuels (total fixe, pas multiplié)
      oneTimeTotal,
      // Encaissements
      totalPaid,
      totalUnpaid,
      // Charges
      monthlyExpenses,
      yearlyExpenses: monthlyExpenses * 12,
      totalExpenses,
      // Bénéfice récurrent
      recurringMonthlyProfit,
      recurringYearlyProfit: recurringMonthlyProfit * 12,
      // Totaux
      totalContractValue,
      // Marge sur le récurrent
      profitMargin: recurringMonthly > 0 ? ((recurringMonthlyProfit / recurringMonthly) * 100) : 0,
      // Compteurs
      activeContracts: contracts.filter(c => c.status === 'active').length,
      completedContracts: contracts.filter(c => c.status === 'completed').length,
      oneTimeContracts: contracts.filter(c => c.recurrence === 'one_time' && c.status !== 'cancelled').length,
      recurringContracts: contracts.filter(c => c.recurrence !== 'one_time' && c.status === 'active').length,
      expensesByCategory: this.getExpensesByCategory(expenses),
    };
  }

  static getExpensesByCategory(expenses) {
    const categories = {};
    expenses.forEach(e => {
      if (!categories[e.category]) categories[e.category] = 0;
      const amount = Number(e.amount) || 0;
      switch (e.recurrence) {
        case 'monthly': categories[e.category] += amount; break;
        case 'quarterly': categories[e.category] += amount / 3; break;
        case 'yearly': categories[e.category] += amount / 12; break;
        case 'one_time': break; // Exclure les dépenses ponctuelles (cohérent avec calculateMonthlyExpenses)
      }
    });
    return categories;
  }
}
