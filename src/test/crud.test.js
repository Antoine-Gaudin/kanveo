// src/test/crud.test.js
// Tests CRUD : prospectService, clientService, taskService
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Supabase ────────────────────────────────────────
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();
const mockIs = vi.fn();

function createChain(finalResult) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
  };
  // Make all chain methods return the chain
  Object.keys(chain).forEach((key) => {
    if (key !== 'single') {
      chain[key].mockReturnValue(chain);
    }
  });
  return chain;
}

let currentChain;

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => currentChain),
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// ─── PROSPECT SERVICE ─────────────────────────────────────
describe('prospectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProspectFromSirene', () => {
    it('crée un prospect avec les données valides', async () => {
      const mockProspect = { id: 'p-1', name: 'Test', company: 'Acme' };

      // First call: insert prospect → returns prospect
      const insertChain = createChain({ data: mockProspect, error: null });
      // Second call: insert sirene_infos
      const sireneChain = createChain({ data: {}, error: null });
      
      let callCount = 0;
      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockImplementation((table) => {
        if (table === 'prospects') return insertChain;
        if (table === 'sirene_infos') return sireneChain;
        return insertChain;
      });

      const { createProspectFromSirene } = await import('../services/prospectService');

      const result = await createProspectFromSirene(
        { name: 'Test', company: 'Acme', siret: '12345678901234' },
        { raw: { some: 'data' } },
        'user-1',
        'ws-1'
      );

      expect(result).toEqual(mockProspect);
      expect(supabase.from).toHaveBeenCalledWith('prospects');
    });

    it('rejette sans userId', async () => {
      const { createProspectFromSirene } = await import('../services/prospectService');
      
      await expect(
        createProspectFromSirene({ name: 'Test' }, {}, null, 'ws-1')
      ).rejects.toThrow("L'ID utilisateur est requis");
    });

    it('rejette sans workspaceId', async () => {
      const { createProspectFromSirene } = await import('../services/prospectService');
      
      await expect(
        createProspectFromSirene({ name: 'Test' }, {}, 'user-1', null)
      ).rejects.toThrow("L'ID du workspace est requis");
    });

    it('rejette avec données prospect invalides', async () => {
      const { createProspectFromSirene } = await import('../services/prospectService');
      
      await expect(
        createProspectFromSirene(null, {}, 'user-1', 'ws-1')
      ).rejects.toThrow('invalides');
    });
  });

  describe('getProspects', () => {
    it('récupère les prospects avec userId', async () => {
      const mockProspects = [
        { id: 'p-1', name: 'Prospect 1' },
        { id: 'p-2', name: 'Prospect 2' },
      ];

      const chain = createChain({ data: null, error: null });
      // Override order to resolve directly (not .single())
      chain.order.mockResolvedValue({ data: mockProspects, error: null });
      
      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { getProspects } = await import('../services/prospectService');
      const result = await getProspects('user-1', 'ws-1');

      expect(result).toEqual(mockProspects);
    });

    it('rejette sans userId', async () => {
      const { getProspects } = await import('../services/prospectService');
      await expect(getProspects(null)).rejects.toThrow("L'ID utilisateur est requis");
    });
  });

  describe('updateProspect', () => {
    it('met à jour un prospect', async () => {
      const updated = { id: 'p-1', name: 'Updated' };
      const chain = createChain({ data: updated, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { updateProspect } = await import('../services/prospectService');
      const result = await updateProspect('p-1', { name: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('rejette sans prospectId', async () => {
      const { updateProspect } = await import('../services/prospectService');
      await expect(updateProspect(null, { name: 'X' })).rejects.toThrow("L'ID du prospect est requis");
    });

    it('rejette avec updates vides', async () => {
      const { updateProspect } = await import('../services/prospectService');
      await expect(updateProspect('p-1', {})).rejects.toThrow('invalides ou vides');
    });
  });

  describe('deleteProspect', () => {
    it('supprime un prospect', async () => {
      const chain = createChain({ data: null, error: null });
      chain.eq.mockResolvedValue({ error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { deleteProspect } = await import('../services/prospectService');
      await expect(deleteProspect('p-1')).resolves.toBeUndefined();
    });

    it('rejette sans prospectId', async () => {
      const { deleteProspect } = await import('../services/prospectService');
      await expect(deleteProspect(null)).rejects.toThrow("L'ID du prospect est requis");
    });
  });

  describe('addProspectContact', () => {
    it('rejette sans prospectId', async () => {
      const { addProspectContact } = await import('../services/prospectService');
      await expect(addProspectContact(null, { name: 'Contact' })).rejects.toThrow("L'ID du prospect est requis");
    });

    it('rejette avec données contact invalides', async () => {
      const { addProspectContact } = await import('../services/prospectService');
      await expect(addProspectContact('p-1', null)).rejects.toThrow('invalides');
    });
  });

  describe('getProspectContacts', () => {
    it('rejette sans prospectId', async () => {
      const { getProspectContacts } = await import('../services/prospectService');
      await expect(getProspectContacts(null)).rejects.toThrow("L'ID du prospect est requis");
    });
  });

  describe('deleteProspectContact', () => {
    it('rejette sans contactId', async () => {
      const { deleteProspectContact } = await import('../services/prospectService');
      await expect(deleteProspectContact(null)).rejects.toThrow("L'ID du contact est requis");
    });
  });
});

// ─── CLIENT SERVICE ───────────────────────────────────────
describe('ClientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClients', () => {
    it('récupère les clients avec workspace', async () => {
      const mockClients = [{ id: 'c-1', name: 'Client 1' }];
      const chain = createChain({ data: null, error: null });
      chain.order.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ data: mockClients, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      const result = await ClientService.getClients('user-1', 'ws-1');

      expect(result).toEqual(mockClients);
    });

    it('retourne array vide si data est null', async () => {
      const chain = createChain({ data: null, error: null });
      chain.order.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ data: null, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      const result = await ClientService.getClients('user-1', 'ws-1');

      expect(result).toEqual([]);
    });
  });

  describe('createClient', () => {
    it('crée un client avec les données', async () => {
      const mockClient = { id: 'c-1', name: 'New', company: 'Corp' };
      const chain = createChain({ data: mockClient, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      const result = await ClientService.createClient({
        userId: 'u-1',
        name: 'New',
        company: 'Corp',
      });

      expect(result).toEqual(mockClient);
      expect(supabase.from).toHaveBeenCalledWith('clients');
    });
  });

  describe('updateClient', () => {
    it('met à jour un client', async () => {
      const updated = { id: 'c-1', name: 'Updated' };
      const chain = createChain({ data: updated, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      const result = await ClientService.updateClient('c-1', { name: 'Updated' });

      expect(result).toEqual(updated);
    });
  });

  describe('deleteClient', () => {
    it('supprime un client', async () => {
      const chain = createChain({ data: null, error: null });
      chain.eq.mockResolvedValue({ error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      await expect(ClientService.deleteClient('c-1')).resolves.toBeUndefined();
    });

    it('lance une erreur Supabase', async () => {
      const chain = createChain({ data: null, error: null });
      chain.eq.mockResolvedValue({ error: { message: 'FK constraint' } });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      await expect(ClientService.deleteClient('c-1')).rejects.toThrow();
    });
  });

  describe('getClientStats', () => {
    it('calcule les stats clients correctement', async () => {
      const clients = [
        { id: '1', status: 'active' },
        { id: '2', status: 'active' },
        { id: '3', status: 'inactive' },
        { id: '4', status: 'archived' },
      ];

      const chain = createChain({ data: null, error: null });
      chain.order.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ data: clients, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      const stats = await ClientService.getClientStats('u-1', 'ws-1');

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.archived).toBe(1);
    });

    it('retourne stats à zéro en cas d\'erreur', async () => {
      const chain = createChain({ data: null, error: null });
      chain.order.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ data: null, error: { message: 'fail' } });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { ClientService } = await import('../services/clientService');
      const stats = await ClientService.getClientStats('u-1');

      expect(stats).toEqual({ total: 0, active: 0, inactive: 0, archived: 0 });
    });
  });
});

// ─── TASK SERVICE ─────────────────────────────────────────
describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasks', () => {
    it('récupère les tâches filtrées par workspace', async () => {
      const mockTasks = [{ id: 't-1', title: 'Task 1' }];
      const chain = createChain({ data: null, error: null });
      chain.order.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ data: mockTasks, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { TaskService } = await import('../services/taskService');
      const result = await TaskService.getTasks('u-1', 'ws-1');

      expect(result).toEqual(mockTasks);
    });
  });

  describe('createTask', () => {
    it('crée une tâche', async () => {
      const mockTask = { id: 't-1', title: 'New Task', status: 'todo' };
      const chain = createChain({ data: mockTask, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { TaskService } = await import('../services/taskService');
      const result = await TaskService.createTask({
        userId: 'u-1',
        title: 'New Task',
        status: 'todo',
        priority: 'high',
      });

      expect(result).toEqual(mockTask);
      expect(supabase.from).toHaveBeenCalledWith('tasks');
    });
  });

  describe('updateTask', () => {
    it('met à jour une tâche', async () => {
      const updated = { id: 't-1', title: 'Updated', status: 'in_progress' };
      const chain = createChain({ data: updated, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { TaskService } = await import('../services/taskService');
      const result = await TaskService.updateTask('t-1', { title: 'Updated' });

      expect(result).toEqual(updated);
    });
  });

  describe('changeTaskStatus', () => {
    it('ajoute completed_at quand status=done', async () => {
      const chain = createChain({ data: { id: 't-1', status: 'done' }, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { TaskService } = await import('../services/taskService');
      const result = await TaskService.changeTaskStatus('t-1', 'done');

      // The update should have been called — we verify via chain
      expect(chain.update).toHaveBeenCalled();
      // Check that completed_at was included
      const updateCall = chain.update.mock.calls[0][0];
      expect(updateCall.status).toBe('done');
      expect(updateCall.completed_at).toBeDefined();
    });

    it('reset completed_at quand status != done', async () => {
      const chain = createChain({ data: { id: 't-1', status: 'todo' }, error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { TaskService } = await import('../services/taskService');
      await TaskService.changeTaskStatus('t-1', 'todo');

      const updateCall = chain.update.mock.calls[0][0];
      expect(updateCall.completed_at).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('supprime une tâche', async () => {
      const chain = createChain({ data: null, error: null });
      chain.eq.mockResolvedValue({ error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { TaskService } = await import('../services/taskService');
      const result = await TaskService.deleteTask('t-1');

      expect(result).toBe(true);
    });
  });

  describe('deleteMultipleTasks', () => {
    it('supprime plusieurs tâches', async () => {
      const chain = createChain({ data: null, error: null });
      chain.in.mockResolvedValue({ error: null });

      const { supabase } = await import('../lib/supabaseClient');
      supabase.from.mockReturnValue(chain);

      const { TaskService } = await import('../services/taskService');
      const result = await TaskService.deleteMultipleTasks(['t-1', 't-2', 't-3']);

      expect(result).toBe(true);
    });
  });
});
