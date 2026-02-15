import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer les dialogues de confirmation
 * 
 * Supporte 2 modes :
 * 
 * Mode promise (Clients.jsx) :
 *   const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
 *   const ok = await confirm('Supprimer ?');
 *   if (!ok) return;
 * 
 * Mode callback (KanbanBoard, Tasks, etc.) :
 *   const { isOpen, confirmConfig, confirm, close } = useConfirm();
 *   confirm({ title: '...', message: '...', onConfirm: () => doSomething() });
 */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Confirmer l'action");
  const [message, setMessage] = useState('');
  const [onConfirmCb, setOnConfirmCb] = useState(null);
  const resolveRef = useRef(null);

  // Cleanup: résoudre la Promise à false si le composant est démonté
  useEffect(() => {
    return () => {
      if (resolveRef.current) {
        resolveRef.current(false);
        resolveRef.current = null;
      }
    };
  }, []);

  const confirm = useCallback((arg) => {
    // Mode promise: confirm('message') ou confirm({ title, message })
    if (typeof arg === 'string' || (typeof arg === 'object' && !arg.onConfirm)) {
      const text = typeof arg === 'string' ? arg : arg?.message || "Êtes-vous sûr ?";
      const t = typeof arg === 'object' ? arg?.title : undefined;
      setMessage(text);
      setTitle(t || "Confirmer l'action");
      setOnConfirmCb(null);
      setIsOpen(true);
      // Résoudre l'ancienne Promise si elle existe (éviter un await suspendu)
      if (resolveRef.current) {
        resolveRef.current(false);
      }
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    }

    // Mode callback: confirm({ title, message, onConfirm })
    setTitle(arg.title || "Confirmer l'action");
    setMessage(arg.message || "Êtes-vous sûr de vouloir effectuer cette action ?");
    setOnConfirmCb(() => arg.onConfirm || (() => {}));
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    } else if (onConfirmCb) {
      onConfirmCb();
      setOnConfirmCb(null);
    }
  }, [onConfirmCb]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setOnConfirmCb(null);
  }, []);

  // Compat: ancienne API retourne { isOpen, confirmConfig, confirm, close }
  const confirmConfig = {
    title,
    message,
    onConfirm: handleConfirm,
  };

  // Nouvelle API retourne { confirmState, confirm, handleConfirm, handleCancel }
  const confirmState = {
    isOpen,
    title,
    message,
  };

  return {
    // Ancienne API (KanbanBoard, Tasks, etc.)
    isOpen,
    confirmConfig,
    close: handleCancel,
    // Nouvelle API (Clients.jsx)
    confirmState,
    handleConfirm,
    handleCancel,
    // Partagé
    confirm,
  };
}
