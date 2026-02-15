// src/hooks/useClients.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientService } from '../services/clientService';

const EMPTY_CLIENTS = [];
const EMPTY_CONTRACTS = [];
const EMPTY_EXPENSES = [];

// ═══════════════════════════════════════
// Hook Clients
// ═══════════════════════════════════════
export function useClients(userId, workspaceId = null) {
  const qc = useQueryClient();
  const queryKey = ['clients', userId, workspaceId];

  const { data: clients = EMPTY_CLIENTS, isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => ClientService.getClients(userId, workspaceId),
    enabled: !!userId,
  });

  const error = queryError?.message || null;

  const createClient = async (clientData) => {
    const newClient = await ClientService.createClient({ ...clientData, userId, workspaceId });
    qc.setQueryData(queryKey, (old) => [newClient, ...(old || [])]);
    return newClient;
  };

  const updateClient = async (clientId, updates) => {
    const updated = await ClientService.updateClient(clientId, updates);
    qc.setQueryData(queryKey, (old) =>
      old?.map(c => c.id === clientId ? updated : c) || []
    );
    return updated;
  };

  const deleteClient = async (clientId) => {
    await ClientService.deleteClient(clientId);
    qc.setQueryData(queryKey, (old) => old?.filter(c => c.id !== clientId) || []);
    // Aussi nettoyer les contrats liés du cache
    qc.invalidateQueries({ queryKey: ['contracts', userId] });
  };

  const convertProspect = async (prospect) => {
    const newClient = await ClientService.convertProspect(userId, workspaceId, prospect);
    qc.setQueryData(queryKey, (old) => [newClient, ...(old || [])]);
    return newClient;
  };

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    convertProspect,
  };
}

// ═══════════════════════════════════════
// Hook Contrats
// ═══════════════════════════════════════
export function useContracts(userId, workspaceId = null) {
  const qc = useQueryClient();
  const queryKey = ['contracts', userId, workspaceId];

  const { data: contracts = EMPTY_CONTRACTS, isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => ClientService.getContracts(userId, workspaceId),
    enabled: !!userId,
  });

  const error = queryError?.message || null;

  const createContract = async (contractData) => {
    const newContract = await ClientService.createContract({ ...contractData, userId, workspaceId });
    qc.setQueryData(queryKey, (old) => [newContract, ...(old || [])]);
    return newContract;
  };

  const updateContract = async (contractId, updates) => {
    const updated = await ClientService.updateContract(contractId, updates);
    qc.setQueryData(queryKey, (old) =>
      old?.map(c => c.id === contractId ? updated : c) || []
    );
    return updated;
  };

  const deleteContract = async (contractId) => {
    await ClientService.deleteContract(contractId);
    qc.setQueryData(queryKey, (old) => old?.filter(c => c.id !== contractId) || []);
  };

  return {
    contracts,
    loading,
    error,
    createContract,
    updateContract,
    deleteContract,
  };
}

// ═══════════════════════════════════════
// Hook Charges
// ═══════════════════════════════════════
export function useExpenses(userId, workspaceId = null) {
  const qc = useQueryClient();
  const queryKey = ['expenses', userId, workspaceId];

  const { data: expenses = EMPTY_EXPENSES, isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => ClientService.getExpenses(userId, workspaceId),
    enabled: !!userId,
  });

  const error = queryError?.message || null;

  const createExpense = async (expenseData) => {
    const newExpense = await ClientService.createExpense({ ...expenseData, userId, workspaceId });
    qc.setQueryData(queryKey, (old) => [newExpense, ...(old || [])]);
    return newExpense;
  };

  const updateExpense = async (expenseId, updates) => {
    const updated = await ClientService.updateExpense(expenseId, updates);
    qc.setQueryData(queryKey, (old) =>
      old?.map(e => e.id === expenseId ? updated : e) || []
    );
    return updated;
  };

  const deleteExpense = async (expenseId) => {
    await ClientService.deleteExpense(expenseId);
    qc.setQueryData(queryKey, (old) => old?.filter(e => e.id !== expenseId) || []);
  };

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
