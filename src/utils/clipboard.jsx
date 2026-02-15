/**
 * Utilitaires pour copier dans le presse-papier
 */
import React from 'react';

/**
 * Copie un texte dans le presse-papier
 * @param {string} text - Texte à copier
 * @param {Function} onSuccess - Callback de succès
 * @param {Function} onError - Callback d'erreur
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text, onSuccess, onError) {
  try {
    // Méthode moderne (Clipboard API)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      if (onSuccess) onSuccess();
      return true;
    }

    // Méthode fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      if (onSuccess) onSuccess();
      return true;
    } else {
      throw new Error('Commande de copie échouée');
    }
  } catch (err) {
    if (onError) onError(err);
    return false;
  }
}

/**
 * Composant bouton "Copier" réutilisable
 *
 * @example
 * <CopyButton text="test@example.com" label="Email" />
 */
export function CopyButton({ text, label, className = '', onCopy }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation(); // Empêche la propagation du clic

    const success = await copyToClipboard(
      text,
      () => {
        setCopied(true);
        if (onCopy) onCopy();
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        // Erreur silencieuse
      }
    );
  };

  if (!text || text === '') return null;

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm transition-all duration-200 cursor-pointer transform hover:scale-105 ${copied ? 'bg-green-600 hover:bg-green-700 text-white animate-in fade-in-0 zoom-in-95 duration-300' : ''} ${className}`}
      title={`Copier ${label || 'le texte'}`}
    >
      <span className={`transition-transform duration-200 ${copied ? 'animate-bounce' : ''}`}>
        {copied ? '✓' : '📋'}
      </span>
      <span className="font-medium">{copied ? 'Copié !' : label || 'Copier'}</span>
    </button>
  );
}

/**
 * Hook personnalisé pour copier dans le presse-papier
 *
 * @returns {{ copy: Function, copied: boolean }}
 *
 * @example
 * const { copy, copied } = useCopyToClipboard();
 *
 * <button onClick={() => copy(email, () => addToast('Email copié!'))}>
 *   {copied ? 'Copié !' : 'Copier'}
 * </button>
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = React.useState(false);

  const copy = async (text, onSuccess) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setCopied(false), 2000);
    }
    return success;
  };

  return { copy, copied };
}
