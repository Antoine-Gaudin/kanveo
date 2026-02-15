// src/hooks/useTasks.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '../services/taskService';

const EMPTY_TASKS = [];

export default function useTasks(userId, workspaceId = null, boardId = null) {
  const qc = useQueryClient();
  const queryKey = ['tasks', userId, workspaceId, boardId];

  // Charger les tâches
  const { data: tasks = EMPTY_TASKS, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      return TaskService.getTasks(userId, workspaceId, boardId);
    },
    enabled: !!userId,
  });

  const error = queryError?.message || null;

  // Créer une tâche
  const createTask = async (taskData) => {
    const newTask = await TaskService.createTask({
      ...taskData,
      userId,
      workspaceId,
      boardId
    });
    qc.setQueryData(queryKey, (old) => [newTask, ...(old || [])]);
    return newTask;
  };

  // Mettre à jour une tâche
  const updateTask = async (taskId, updates) => {
    const updatedTask = await TaskService.updateTask(taskId, updates);
    qc.setQueryData(queryKey, (old) =>
      old?.map(t => t.id === taskId ? updatedTask : t) || []
    );
    return updatedTask;
  };

  // Changer le statut d'une tâche
  const changeTaskStatus = async (taskId, newStatus) => {
    const updatedTask = await TaskService.changeTaskStatus(taskId, newStatus);
    qc.setQueryData(queryKey, (old) =>
      old?.map(t => t.id === taskId ? updatedTask : t) || []
    );
    return updatedTask;
  };

  // Supprimer une tâche
  const deleteTask = async (taskId) => {
    await TaskService.deleteTask(taskId);
    qc.setQueryData(queryKey, (old) => old?.filter(t => t.id !== taskId) || []);
  };

  // Supprimer plusieurs tâches
  const deleteMultipleTasks = async (taskIds) => {
    await TaskService.deleteMultipleTasks(taskIds);
    qc.setQueryData(queryKey, (old) => old?.filter(t => !taskIds.includes(t.id)) || []);
  };

  // Mettre à jour la checklist
  const updateChecklist = async (taskId, checklist) => {
    const updatedTask = await TaskService.updateChecklist(taskId, checklist);
    qc.setQueryData(queryKey, (old) =>
      old?.map(t => t.id === taskId ? updatedTask : t) || []
    );
    return updatedTask;
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    changeTaskStatus,
    deleteTask,
    deleteMultipleTasks,
    updateChecklist,
    refreshTasks: refetch
  };
}
