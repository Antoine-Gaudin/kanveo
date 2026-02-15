// src/components/prospecting/KanbanBoardSelector.jsx
import { useState } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Check, Star, X, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function KanbanBoardSelector({
  boards = [],
  activeBoard,
  onBoardSelect,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onSetDefaultBoard,
  loading = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim() || creating) return;

    try {
      setCreating(true);
      await onCreateBoard({ name: newBoardName.trim() });
      setNewBoardName('');
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (error) {
      // Erreur silencieuse
    } finally {
      setCreating(false);
    }
  };

  const handleRenameBoard = async (boardId) => {
    if (!editingBoardName.trim()) return;

    try {
      await onRenameBoard(boardId, editingBoardName.trim());
      setEditingBoardId(null);
      setEditingBoardName('');
    } catch (error) {
      // Erreur silencieuse
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tableau ? Les prospects seront déplacés vers le tableau par défaut.')) {
      try {
        await onDeleteBoard(boardId);
        setIsOpen(false);
      } catch (error) {
        // Erreur silencieuse
      }
    }
  };

  const handleSetDefault = async (boardId) => {
    try {
      await onSetDefaultBoard(boardId);
      setIsOpen(false);
    } catch (error) {
      // Erreur silencieuse
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            {activeBoard?.is_default && <Star className="h-3 w-3 text-amber-500" />}
            {loading ? 'Chargement...' : (activeBoard?.name || 'Sélectionner un tableau')}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        {/* Header avec bouton créer */}
        <div className="p-2">
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Nouveau tableau
            </Button>
          ) : (
            <form onSubmit={handleCreateBoard} className="space-y-2">
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Nom du tableau..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!newBoardName.trim() || creating}
                  size="sm"
                  className="flex-1"
                >
                  {creating ? 'Création...' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewBoardName('');
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Liste des tableaux */}
        <ScrollArea className="max-h-64">
          {boards.length === 0 && !showCreateForm && (
            <div className="p-4 text-center text-muted-foreground">
              <p>Aucun tableau disponible</p>
              <p className="text-sm mt-1">Créez votre premier tableau pour commencer</p>
            </div>
          )}

          {boards.map((board) => (
            <div key={board.id} className="group">
              {editingBoardId === board.id ? (
                <div className="p-2 space-y-2">
                  <Input
                    value={editingBoardName}
                    onChange={(e) => setEditingBoardName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRenameBoard(board.id)}
                      size="sm"
                      className="h-7 px-2"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingBoardId(null);
                        setEditingBoardName('');
                      }}
                      className="h-7 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      if (typeof onBoardSelect === 'function') {
                        onBoardSelect(board.id);
                        setIsOpen(false);
                      }
                    } catch (error) {
                      // Erreur silencieuse
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between cursor-pointer",
                    activeBoard?.id === board.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {board.is_default && <Star className="h-3 w-3 text-amber-500" />}
                    <span className="font-medium">{board.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {!board.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(board.id);
                        }}
                        title="Définir par défaut"
                      >
                        <Star className="h-3 w-3 text-amber-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoardId(board.id);
                        setEditingBoardName(board.name);
                      }}
                      title="Renommer"
                    >
                      <Edit2 className="h-3 w-3 text-primary" />
                    </Button>
                    {!board.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBoard(board.id);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
              )}
            </div>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}