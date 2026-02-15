// src/components/sirene/BoardSelectorModal.jsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Loader2, 
  Check,
  Star,
  Kanban,
  AlertCircle
} from "lucide-react";

export default function BoardSelectorModal({
  isOpen,
  onClose,
  boards = [],
  selectedBoards = [],
  onConfirm,
  loading = false
}) {
  const [tempSelectedBoards, setTempSelectedBoards] = useState(selectedBoards);

  if (!isOpen) return null;

  const handleToggleBoard = (boardId) => {
    setTempSelectedBoards(prev => {
      if (prev.includes(boardId)) {
        return prev.filter(id => id !== boardId);
      } else {
        return [...prev, boardId];
      }
    });
  };

  const handleSelectAll = () => {
    if (tempSelectedBoards.length === boards.length) {
      setTempSelectedBoards([]);
    } else {
      setTempSelectedBoards(boards.map(board => board.id));
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedBoards);
    onClose();
  };

  const selectedCount = tempSelectedBoards.length;
  const totalCount = boards.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Kanban className="w-5 h-5" />
                Choisir les pipelines
              </CardTitle>
              <CardDescription>
                Sélectionnez un ou plusieurs pipelines où ajouter ce prospect
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Actions rapides */}
        <div className="px-6 py-3 flex items-center justify-between border-b bg-muted/30">
          <Button
            variant="link"
            size="sm"
            onClick={handleSelectAll}
            className="p-0 h-auto"
          >
            {selectedCount === totalCount ? 'Désélectionner tout' : 'Sélectionner tout'}
          </Button>
          <Badge variant="secondary">
            {selectedCount} / {totalCount} sélectionné(s)
          </Badge>
        </div>

        {/* Liste des tableaux */}
        <ScrollArea className="flex-1">
          <CardContent className="p-4 space-y-2">
            {boards.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun pipeline disponible</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Créez d'abord un pipeline depuis la page de prospection
                </p>
              </div>
            ) : (
              boards.map((board) => (
                <Card
                  key={board.id}
                  className={`cursor-pointer transition-all ${
                    tempSelectedBoards.includes(board.id)
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggleBoard(board.id)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          tempSelectedBoards.includes(board.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/30'
                        }`}>
                          {tempSelectedBoards.includes(board.id) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{board.name}</span>
                            {board.is_default && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Star className="w-3 h-3" />
                                Par défaut
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {board.statuses?.length || 5} étapes
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-4 flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || loading}
            className="flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              `Ajouter au pipeline (${selectedCount})`
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
