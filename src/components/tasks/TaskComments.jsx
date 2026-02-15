// src/components/tasks/TaskComments.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { TaskService } from "../../services/taskService";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../hooks/useConfirm";
import ConfirmDialog from "../ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TaskComments({ taskId, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const commentsEndRef = useRef(null);
  const { addToast } = useToast();
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Charger les commentaires
  useEffect(() => {
    if (taskId) {
      loadComments();
    }
  }, [taskId]);

  // Scroll vers le bas quand de nouveaux commentaires sont ajoutés
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadComments = async () => {
    try {
      const data = await TaskService.getComments(taskId);
      setComments(data);
    } catch (error) {
      addToast("Impossible de charger les commentaires", "error");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const comment = await TaskService.addComment(taskId, user.id, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      addToast("❌ Erreur lors de l'ajout du commentaire", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    confirm({
      title: "Supprimer ce commentaire ?",
      message: "Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: async () => {
        try {
          await TaskService.deleteComment(commentId);
          setComments(prev => prev.filter(c => c.id !== commentId));
          addToast("Commentaire supprimé", "success");
        } catch (error) {
          addToast("❌ Erreur lors de la suppression", "error");
        }
      }
    });
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const updatedComment = await TaskService.updateComment(commentId, editText.trim());
      setComments(prev => prev.map(c =>
        c.id === commentId ? updatedComment : c
      ));
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      addToast("❌ Erreur lors de la modification", "error");
    }
  };

  const startEdit = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <div className="space-y-4">
      {/* Formulaire d'ajout */}
      <form onSubmit={handleAddComment} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Écrivez un commentaire..."
          rows={3}
          disabled={loading}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Ajouter un commentaire
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun commentaire pour le moment</p>
            <p className="text-sm mt-1">Soyez le premier à commenter !</p>
          </div>
        ) : (
          <>
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Commentaires ({comments.length})
            </h4>

            <ScrollArea className="max-h-96">
              <div className="space-y-3 pr-4">
                {comments.map((comment) => {
                  const isOwnComment = comment.user_id === user?.id;
                  const userInitials = getInitials(
                    comment.user?.first_name,
                    comment.user?.last_name,
                    comment.user?.email
                  );

                  return (
                    <Card
                      key={comment.id}
                      className={cn(
                        isOwnComment && "bg-primary/5 border-primary/20"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-sm">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            {/* Header du commentaire */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {comment.user?.first_name || comment.user?.email || 'Utilisateur'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.created_at)}
                                </span>
                                {comment.updated_at && comment.updated_at !== comment.created_at && (
                                  <Pencil className="w-3 h-3 text-primary" title="Modifié" />
                                )}
                              </div>

                              {/* Actions */}
                              {isOwnComment && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => startEdit(comment)}
                                    title="Modifier"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Contenu du commentaire */}
                            {editingComment === comment.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditComment(comment.id)}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Sauvegarder
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Référence pour le scroll automatique */}
      <div ref={commentsEndRef} />

      {/* Dialog de confirmation */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        {...confirmConfig}
      />
    </div>
  );
}