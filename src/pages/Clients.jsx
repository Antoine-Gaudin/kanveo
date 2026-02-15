// src/pages/Clients.jsx
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useClients, useContracts, useExpenses } from '@/hooks/useClients';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

import ClientList from '@/components/clients/ClientList';
import ContractList from '@/components/clients/ContractList';
import ExpenseList from '@/components/clients/ExpenseList';
import FinancialDashboard from '@/components/clients/FinancialDashboard';
import ClientFormModal from '@/components/clients/ClientFormModal';
import ContractFormModal from '@/components/clients/ContractFormModal';
import ExpenseFormModal from '@/components/clients/ExpenseFormModal';

import { Users, FileText, Receipt, BarChart3 } from 'lucide-react';

export default function Clients() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  // Hooks data
  const { clients, loading: clientsLoading, createClient, updateClient, deleteClient } = useClients(user?.id);
  const { contracts, loading: contractsLoading, createContract, updateContract, deleteContract } = useContracts(user?.id);
  const { expenses, loading: expensesLoading, createExpense, updateExpense, deleteExpense } = useExpenses(user?.id);

  // Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal states
  const [clientModal, setClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [contractModal, setContractModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [expenseModal, setExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const loading = clientsLoading || contractsLoading || expensesLoading;

  // ═══════════════════════════════════════
  // CLIENTS handlers
  // ═══════════════════════════════════════
  const handleAddClient = () => {
    setEditingClient(null);
    setClientModal(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setClientModal(true);
  };

  const handleSaveClient = async (form) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, form);
        addToast('Client modifié', 'success');
      } else {
        await createClient(form);
        addToast('Client ajouté', 'success');
      }
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleDeleteClient = async (clientId) => {
    const ok = await confirm('Supprimer ce client ? Les contrats associés seront également supprimés.');
    if (!ok) return;
    try {
      await deleteClient(clientId);
      addToast('Client supprimé', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  // ═══════════════════════════════════════
  // CONTRACTS handlers
  // ═══════════════════════════════════════
  const handleAddContract = () => {
    setEditingContract(null);
    setContractModal(true);
  };

  const handleEditContract = (contract) => {
    setEditingContract(contract);
    setContractModal(true);
  };

  const handleSaveContract = async (form) => {
    try {
      if (editingContract) {
        await updateContract(editingContract.id, {
          client_id: form.clientId,
          title: form.title,
          description: form.description,
          amount: Number(form.amount) || 0,
          recurrence: form.recurrence,
          status: form.status,
          start_date: form.startDate || null,
          end_date: form.endDate || null,
          paid_amount: Number(form.paidAmount) || 0,
          payment_count: Number(form.paymentCount) || 1,
        });
        addToast('Contrat modifié', 'success');
      } else {
        await createContract({
          clientId: form.clientId,
          title: form.title,
          description: form.description,
          amount: Number(form.amount) || 0,
          recurrence: form.recurrence,
          status: form.status,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          paidAmount: Number(form.paidAmount) || 0,
          paymentCount: Number(form.paymentCount) || 1,
        });
        addToast('Contrat ajouté', 'success');
      }
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleDeleteContract = async (contractId) => {
    const ok = await confirm('Supprimer ce contrat ?');
    if (!ok) return;
    try {
      await deleteContract(contractId);
      addToast('Contrat supprimé', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  // ═══════════════════════════════════════
  // EXPENSES handlers
  // ═══════════════════════════════════════
  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseModal(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseModal(true);
  };

  const handleSaveExpense = async (form) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          label: form.label,
          category: form.category,
          amount: Number(form.amount) || 0,
          recurrence: form.recurrence,
          date: form.date || null,
        });
        addToast('Charge modifiée', 'success');
      } else {
        await createExpense({
          label: form.label,
          category: form.category,
          amount: Number(form.amount) || 0,
          recurrence: form.recurrence,
          date: form.date || null,
        });
        addToast('Charge ajoutée', 'success');
      }
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const ok = await confirm('Supprimer cette charge ?');
    if (!ok) return;
    try {
      await deleteExpense(expenseId);
      addToast('Charge supprimée', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-border border-t-primary rounded-full mb-4 shadow-lg shadow-primary/20 animate-spin" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients & Finances</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos clients, contrats et charges
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {clients.length} client{clients.length > 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {contracts.length} contrat{contracts.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Bilan</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clients</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contrats</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Charges</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <FinancialDashboard
            clients={clients}
            contracts={contracts}
            expenses={expenses}
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientList
            clients={clients}
            onAdd={handleAddClient}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <ContractList
            contracts={contracts}
            onAdd={handleAddContract}
            onEdit={handleEditContract}
            onDelete={handleDeleteContract}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpenseList
            expenses={expenses}
            onAdd={handleAddExpense}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ClientFormModal
        open={clientModal}
        onOpenChange={setClientModal}
        onSave={handleSaveClient}
        client={editingClient}
      />

      <ContractFormModal
        open={contractModal}
        onOpenChange={setContractModal}
        onSave={handleSaveContract}
        clients={clients}
        contract={editingContract}
      />

      <ExpenseFormModal
        open={expenseModal}
        onOpenChange={setExpenseModal}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />

      {/* Toast + Confirm */}
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
