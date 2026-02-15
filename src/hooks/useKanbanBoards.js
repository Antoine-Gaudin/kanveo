// src/hooks/useKanbanBoards.js
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KanbanService } from '../services/kanbanService';
import { UserPreferencesService } from '../services/userPreferencesService';
import { useAuth } from '../context/AuthContext';

const EMPTY_BOARDS = [];

export default function useKanbanBoards() {
  const [activeBoard, setActiveBoard] = useState(null);
  const boardSelectedRef = useRef(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const queryKey = ['kanbanBoards', user?.id];

  // Charger les tableaux Kanban via React Query (cache 5 min)
  const { data: boards = EMPTY_BOARDS, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const userBoards = await KanbanService.getUserKanbanBoards(user.id);
      const defaultBoard = await KanbanService.getDefaultBoard(user.id);

      if (defaultBoard && !userBoards.find(b => b.id === defaultBoard.id)) {
        return [...userBoards, defaultBoard];
      }
      return userBoards;
    },
    enabled: !!user?.id,
  });

  const error = queryError?.message || null;

  // Sélectionner le board actif quand les données changent
  useEffect(() => {
    if (!boards.length || !user?.id) {
      setActiveBoard(null);
      boardSelectedRef.current = false;
      return;
    }

    // Si on a déjà un board sélectionné et qu'il est toujours valide, juste mettre à jour ses données
    if (boardSelectedRef.current && activeBoard) {
      const updatedBoard = boards.find(b => b.id === activeBoard.id);
      if (updatedBoard) {
        if (updatedBoard !== activeBoard) setActiveBoard(updatedBoard);
        return;
      }
    }

    // Sinon, sélectionner le board depuis les préférences
    const selectBoard = async () => {
      let lastSelectedBoardId = null;
      try {
        lastSelectedBoardId = await UserPreferencesService.getLastSelectedBoard(user.id);
      } catch {
        // ignore
      }

      let boardToActivate = null;
      if (lastSelectedBoardId) {
        boardToActivate = boards.find(b => b.id === lastSelectedBoardId);
      }
      if (!boardToActivate) {
        boardToActivate = boards.find(b => b.is_default) || boards[0] || null;
      }

      setActiveBoard(boardToActivate);
      boardSelectedRef.current = true;
    };

    selectBoard();
  }, [boards, user?.id]);

  // Créer un nouveau tableau
  const createBoard = async (boardData) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    const newBoard = await KanbanService.createKanbanBoard({
      ...boardData,
      userId: user.id,
    });

    qc.setQueryData(queryKey, (old) => [...(old || []), newBoard]);
    return newBoard;
  };

  // Mettre à jour un tableau
  const updateBoard = async (boardId, updates) => {
    const updatedBoard = await KanbanService.updateKanbanBoard(boardId, updates);

    qc.setQueryData(queryKey, (old) =>
      old?.map(b => b.id === boardId ? updatedBoard : b) || []
    );

    if (activeBoard?.id === boardId) {
      setActiveBoard(updatedBoard);
    }

    return updatedBoard;
  };

  // Supprimer un tableau
  const deleteBoard = async (boardId) => {
    await KanbanService.deleteKanbanBoard(boardId);

    qc.setQueryData(queryKey, (old) => old?.filter(b => b.id !== boardId) || []);

    if (activeBoard?.id === boardId) {
      const remaining = boards.filter(b => b.id !== boardId);
      setActiveBoard(remaining.find(b => b.is_default) || remaining[0] || null);
    }

    return true;
  };

  // Définir un tableau comme par défaut
  const setDefaultBoard = async (boardId) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    const updatedBoard = await KanbanService.setDefaultBoard(user.id, boardId);

    qc.setQueryData(queryKey, (old) =>
      old?.map(b => ({ ...b, is_default: b.id === boardId })) || []
    );

    if (activeBoard?.id !== boardId) {
      setActiveBoard(updatedBoard);
    } else {
      setActiveBoard(prev => ({ ...prev, is_default: true }));
    }

    try {
      await UserPreferencesService.saveLastSelectedBoard(user.id, boardId);
    } catch {
      // ignore
    }

    return updatedBoard;
  };

  // Changer le tableau actif
  const switchToBoard = async (boardId) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setActiveBoard(board);
      boardSelectedRef.current = true;

      if (user?.id) {
        try {
          await UserPreferencesService.saveLastSelectedBoard(user.id, boardId);
        } catch {
          // ignore
        }
      }
    }
  };

  // Renommer un tableau
  const renameBoard = async (boardId, newName) => {
    return await updateBoard(boardId, { name: newName });
  };

  // Mettre à jour les statuts personnalisés d'un tableau
  const updateBoardStatuses = async (boardId, statuses) => {
    return await updateBoard(boardId, { statuses });
  };

  return {
    boards,
    activeBoard,
    loading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    setDefaultBoard,
    switchToBoard,
    renameBoard,
    updateBoardStatuses,
    refetch
  };
}