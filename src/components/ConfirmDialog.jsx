/**
 * Composant de dialogue de confirmation réutilisable
 * Utilisé pour confirmer les actions destructives (suppression, etc.)
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "danger" // "danger", "warning", "info"
}) {
  if (!isOpen) return null;

  const close = onCancel || onClose || (() => {});

  const typeStyles = {
    danger: {
      bg: "from-red-600 to-red-700 dark:from-red-600 dark:to-red-700",
      hoverClass: "hover:from-red-700 hover:to-red-800",
      border: "border-red-500/50 dark:border-red-500/50",
      icon: "🗑️"
    },
    warning: {
      bg: "from-amber-600 to-amber-700 dark:from-amber-600 dark:to-amber-700",
      hoverClass: "hover:from-amber-700 hover:to-amber-800",
      border: "border-amber-500/50 dark:border-amber-500/50",
      icon: "⚠️"
    },
    info: {
      bg: "from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700",
      hoverClass: "hover:from-blue-700 hover:to-blue-800",
      border: "border-blue-500/50 dark:border-blue-500/50",
      icon: "ℹ️"
    }
  };

  const style = typeStyles[type] || typeStyles.danger;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else close();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  // Fermeture avec Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md mx-4">
        {/* Dialog */}
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${style.bg} p-6 border-b ${style.border}`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{style.icon}</span>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-foreground text-lg leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="bg-muted/50 p-6 flex gap-3">
            <button
              onClick={close}
              className="flex-1 px-6 py-3 rounded-lg border border-border text-foreground hover:bg-muted font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-6 py-3 rounded-lg bg-gradient-to-r ${style.bg} ${style.hoverClass} text-white font-medium transition-all duration-200 shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
