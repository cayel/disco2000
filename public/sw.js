// Version du cache - À INCRÉMENTER À CHAQUE DÉPLOIEMENT
const CACHE_VERSION = '2.0.0';
const BUILD_DATE = '2026-01-01'; // Date du build

const CACHE_NAME = `disco2000-v${CACHE_VERSION}`;
const API_CACHE_NAME = `disco2000-api-v${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `disco2000-images-v${CACHE_VERSION}`;

// Assets à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css',
];

// Durée de validité du cache API (en millisecondes)
const API_CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const IMAGE_CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 jours

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log(`[SW] Installation en cours... Version: ${CACHE_VERSION} (${BUILD_DATE})`);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des assets statiques');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).catch(err => {
      console.error('[SW] Erreur lors de la mise en cache initiale:', err);
    })
  );
  
  // Force le nouveau SW à devenir actif immédiatement
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME) {
            console.log('[SW] Suppression du cache obsolète:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prend le contrôle de toutes les pages immédiatement
  return self.clients.claim();
});

// Stratégie de cache pour les images
async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Vérifier la fraîcheur du cache
    const cachedDate = new Date(cached.headers.get('sw-cached-date'));
    const now = new Date();
    
    if (now - cachedDate < IMAGE_CACHE_DURATION) {
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-date', new Date().toISOString());
      
      const blob = await responseToCache.blob();
      const cachedResponse = new Response(blob, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (error) {
    // En cas d'erreur réseau, retourner le cache même périmé
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stratégie Network First avec cache de secours pour les APIs
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Mettre en cache seulement les GET
      if (request.method === 'GET') {
        const responseToCache = response.clone();
        const headers = new Headers(responseToCache.headers);
        headers.append('sw-cached-date', new Date().toISOString());
        
        const blob = await responseToCache.blob();
        const cachedResponse = new Response(blob, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        
        cache.put(request, cachedResponse);
      }
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Erreur réseau, utilisation du cache pour:', request.url);
    
    const cached = await cache.match(request);
    if (cached) {
      // Ajouter un header pour indiquer que c'est du cache
      const headers = new Headers(cached.headers);
      headers.append('x-from-cache', 'true');
      
      const blob = await cached.blob();
      return new Response(blob, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }
    
    throw error;
  }
}

// Stratégie Cache First pour les assets statiques
async function cacheFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Erreur de chargement:', request.url, error);
    throw error;
  }
}

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET sauf pour le cache API
  if (request.method !== 'GET' && !url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Ignorer les requêtes Chrome extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Images (Discogs, etc.)
  if (request.destination === 'image' || 
      url.hostname.includes('discogs.com') ||
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(cacheFirstImage(request));
    return;
  }
  
  // API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }
  
  // Assets statiques (JS, CSS, fonts)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }
  
  // Par défaut: network only
  event.respondWith(fetch(request));
});

// Message du client (pour forcer le refresh du cache)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      })
    );
  }
});

// Sync en arrière-plan (si supporté)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-albums') {
    event.waitUntil(syncAlbums());
  }
});

async function syncAlbums() {
  // Logique de synchronisation personnalisée
  console.log('[SW] Synchronisation des albums en arrière-plan...');
}

console.log('[SW] Service Worker chargé');
