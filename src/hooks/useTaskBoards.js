// src/hooks/useTaskBoards.js
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KanbanService } from '../services/kanbanService';
import { useAuth } from '../context/AuthContext';

const EMPTY_BOARDS = [];

export default function useTaskBoards() {
  const [activeBoard, setActiveBoard] = useState(null);
  const boardSelectedRef = useRef(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const queryKey = ['taskBoards', user?.id];

  // Charger les boards de tâches (board_type = 'tasks')
  const { data: boards = EMPTY_BOARDS, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const userBoards = await KanbanService.getUserKanbanBoards(user.id, null, 'tasks');

      // Seulement créer un board par défaut s'il n'y en a aucun
      if (userBoards.length === 0) {
        const defaultBoard = await KanbanService.getDefaultBoard(user.id, null, 'tasks');
        return defaultBoard ? [defaultBoard] : [];
      }

      return userBoards;
    },
    enabled: !!user?.id,
  });

  const error = queryError?.message || null;

  // Sélectionner le board actif
  useEffect(() => {
    if (!boards.length || !user?.id) {
      setActiveBoard(null);
      boardSelectedRef.current = false;
      return;
    }

    if (boardSelectedRef.current && activeBoard) {
      const updatedBoard = boards.find(b => b.id === activeBoard.id);
      if (updatedBoard) {
        if (updatedBoard !== activeBoard) setActiveBoard(updatedBoard);
        return;
      }
    }

    const boardToActivate = boards.find(b => b.is_default) || boards[0] || null;
    setActiveBoard(boardToActivate);
    boardSelectedRef.current = true;
  }, [boards, user?.id]);

  // Créer un nouveau board de tâches
  const createBoard = async (name) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    const newBoard = await KanbanService.createKanbanBoard({
      name,
      userId: user.id,
      workspaceId: null,
      boardType: 'tasks',
      isDefault: boards.length === 0, // Premier board = default
    });

    qc.setQueryData(queryKey, (old) => [...(old || []), newBoard]);
    return newBoard;
  };

  // Renommer un board
  const renameBoard = async (boardId, newName) => {
    const updatedBoard = await KanbanService.updateKanbanBoard(boardId, { name: newName });

    qc.setQueryData(queryKey, (old) =>
      old?.map(b => b.id === boardId ? updatedBoard : b) || []
    );

    if (activeBoard?.id === boardId) {
      setActiveBoard(updatedBoard);
    }

    return updatedBoard;
  };

  // Supprimer un board
  const deleteBoard = async (boardId) => {
    await KanbanService.deleteKanbanBoard(boardId);

    qc.setQueryData(queryKey, (old) => old?.filter(b => b.id !== boardId) || []);

    if (activeBoard?.id === boardId) {
      const remaining = boards.filter(b => b.id !== boardId);
      setActiveBoard(remaining.find(b => b.is_default) || remaining[0] || null);
    }

    return true;
  };

  // Changer le board actif
  const switchToBoard = (boardId) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setActiveBoard(board);
      boardSelectedRef.current = true;
    }
  };

  // Mettre à jour les colonnes (statuses) d'un board
  const updateBoardStatuses = async (boardId, statuses) => {
    const updatedBoard = await KanbanService.updateKanbanBoard(boardId, { statuses });

    qc.setQueryData(queryKey, (old) =>
      old?.map(b => b.id === boardId ? updatedBoard : b) || []
    );

    if (activeBoard?.id === boardId) {
      setActiveBoard(updatedBoard);
    }

    return updatedBoard;
  };

  return {
    boards,
    activeBoard,
    loading,
    error,
    createBoard,
    renameBoard,
    deleteBoard,
    switchToBoard,
    updateBoardStatuses,
    refetch
  };
}
