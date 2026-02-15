import { useState, useCallback, useEffect } from "react";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../config/constants";

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      // Erreur lecture silencieuse
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch (e) {
        // Erreur sauvegarde silencieuse
      }
      return updated;
    });
  }, []);

  return { settings, updateSettings };
}
