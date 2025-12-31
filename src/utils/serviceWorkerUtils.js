/**
 * Gestionnaire d'enregistrement et de lifecycle du Service Worker
 * Gère l'installation, les mises à jour et les notifications
 */

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Les Service Workers ne sont pas supportés dans ce navigateur');
    return null;
  }

  try {
    // Enregistrement du service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Toujours chercher des mises à jour
    });

    console.log('[PWA] Service Worker enregistré avec succès', registration);

    // Vérifier les mises à jour toutes les heures
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // 1 heure

    // Gérer les mises à jour du SW
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nouveau SW disponible
          console.log('[PWA] Nouvelle version disponible');
          
          // Notifier l'utilisateur (peut être personnalisé avec un toast/modal)
          if (window.confirm('Une nouvelle version est disponible. Voulez-vous recharger ?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Quand un nouveau SW prend le contrôle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
    return null;
  }
};

/**
 * Désinscrire le service worker
 */
export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('[PWA] Service Worker désinscrit:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Erreur lors de la désinscription du Service Worker:', error);
    return false;
  }
};

/**
 * Vider tous les caches
 */
export const clearAllCaches = async () => {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[PWA] Tous les caches ont été vidés');
    return true;
  } catch (error) {
    console.error('[PWA] Erreur lors du vidage des caches:', error);
    return false;
  }
};

/**
 * Vérifier le statut de connexion
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Écouter les changements de statut de connexion
 */
export const addConnectionListener = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Retourner une fonction de nettoyage
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Vérifier si l'app est installée en PWA
 */
export const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Hook pour gérer l'installation de la PWA
 */
export const usePWAInstall = () => {
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher le navigateur d'afficher automatiquement le prompt
    e.preventDefault();
    deferredPrompt = e;
  });

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] Prompt d\'installation non disponible');
      return false;
    }

    // Afficher le prompt d'installation
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Résultat de l\'installation:', outcome);

    // Réinitialiser le prompt
    deferredPrompt = null;

    return outcome === 'accepted';
  };

  const canInstall = () => !!deferredPrompt;

  return { promptInstall, canInstall };
};

/**
 * Récupérer les statistiques de cache
 */
export const getCacheStats = async () => {
  if (!('caches' in window)) {
    return null;
  }

  try {
    const cacheNames = await caches.keys();
    const stats = await Promise.all(
      cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        return {
          name: cacheName,
          itemCount: keys.length,
          items: keys.map(req => req.url)
        };
      })
    );

    return {
      totalCaches: cacheNames.length,
      caches: stats
    };
  } catch (error) {
    console.error('[PWA] Erreur lors de la récupération des stats de cache:', error);
    return null;
  }
};
