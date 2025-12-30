import { useState, useEffect } from 'react';

const STORAGE_KEY = 'disco2000_view_preferences';

const DEFAULT_PREFERENCES = {
  viewMode: 'grid',
  gridSize: 5,
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
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
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
