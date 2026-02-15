// src/hooks/useDebounce.js
import { useRef, useCallback, useEffect } from "react";

/**
 * Hook pour créer une fonction debounced
 * @param {Function} callback - Fonction à debouncer
 * @param {number} delay - Délai en millisecondes (par défaut 500ms)
 * @returns {Function} - Fonction debouncée
 */
export function useDebounceCallback(callback, delay = 500) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Garder la référence du callback à jour sans recréer la fonction debouncée
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}
