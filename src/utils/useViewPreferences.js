import { useState, useEffect } from 'react';

const STORAGE_KEY = 'disco2000_view_preferences';

const DEFAULT_PREFERENCES = {
  viewMode: 'grid',
  gridSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 5,
};

/**
 * Hook personnalisé pour gérer les préférences de vue
 * Sauvegarde automatiquement dans localStorage
 */
export function useViewPreferences() {
  // Initialisation à partir du localStorage
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sur mobile, limiter la taille minimale à 2
        if (typeof window !== 'undefined' && window.innerWidth < 768 && parsed.gridSize > 3) {
          parsed.gridSize = 2;
        }
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  // Sauvegarde dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
    }
  }, [preferences]);

  const setViewMode = (viewMode) => {
    setPreferences(prev => ({ ...prev, viewMode }));
  };

  const setGridSize = (gridSize) => {
    setPreferences(prev => ({ ...prev, gridSize }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    viewMode: preferences.viewMode,
    gridSize: preferences.gridSize,
    setViewMode,
    setGridSize,
    resetPreferences,
  };
}
