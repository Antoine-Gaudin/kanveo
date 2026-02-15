import { useEffect, useState } from "react";

function SingleToast({ id, message, type = "info", duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, id]);

  if (!isVisible) return null;

  const typeStyles = {
    success: "from-green-600 to-green-700 border-green-500/50",
    error: "from-red-600 to-red-700 border-red-500/50",
    warning: "from-amber-600 to-amber-700 border-amber-500/50",
    info: "from-blue-600 to-blue-700 border-blue-500/50",
  };

  const typeIcons = {
    success: "\u2713",
    error: "\u2715",
    warning: "\u26A0\uFE0F",
    info: "\u2139\uFE0F",
  };

  return (
    <div
      className={`bg-gradient-to-r ${typeStyles[type]} border rounded-lg p-4 text-white max-w-sm animate-in slide-in-from-top-2`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{typeIcons[type]}</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

export default function Toast({ toasts, removeToast, message, type, duration, onClose }) {
  // Support both array mode (toasts + removeToast) and single mode (message + type + onClose)
  if (toasts && Array.isArray(toasts)) {
    if (toasts.length === 0) return null;
    return (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" role="alert" aria-live="polite">
        {toasts.map((toast) => (
          <SingleToast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    );
  }

  // Single toast fallback (legacy)
  if (!message) return null;
  return (
    <div className="fixed top-4 right-4 z-50">
      <SingleToast message={message} type={type} duration={duration} onClose={onClose} />
    </div>
  );
}
