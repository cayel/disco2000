// authFetch: wrapper autour instrumentedFetch/fetch gérant automatiquement
// - Ajout du JWT dans Authorization
// - Détection 401/403 -> tentative de refresh (single-flight)
// - Rejeu transparent de la requête initiale après refresh
// - Invalidation + nettoyage cookies si refresh impossible
//
// Utilisation:
// import authFetch from '../utils/authFetch';
// const res = await authFetch(url, { method: 'GET' }, { label: 'fetchAlbums' });

import instrumentedFetch from './instrumentedFetch';
import { getCookie, setCookie, deleteCookie } from './cookie';
import { isJwtExpired, decodeJwt } from './jwt';
import TokenService from './tokenService';

let refreshPromise = null; // single-flight
let lastInvalidationEmit = 0; // throttle 'jwt-invalidated' events

async function performRefresh() {
  const refreshToken = TokenService.getRefreshToken() || getCookie('refresh_token');
  
  if (!refreshToken) {
    if (import.meta.env.DEV) {
      console.warn('[AUTH] performRefresh:abort - No refresh_token available');
    }
    return null;
  }
  
  try {
    if (import.meta.env.DEV) {
      console.log('[AUTH] performRefresh:start');
    }
    
    const res = await instrumentedFetch(`${import.meta.env.VITE_API_URL}/api/users/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': import.meta.env.VITE_API_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include',
    }, { label: 'refresh-token-auto' });
    
    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.warn('[AUTH] performRefresh:failed', res.status);
      }
      return null;
    }
    
    const data = await res.json().catch(() => null);
    if (!data?.access_token) throw new Error('Missing access token');
    
    // Store tokens
    TokenService.setTokens(data.access_token, data.refresh_token || refreshToken);
    setCookie('jwt', data.access_token, 7, true);
    if (data.refresh_token) setCookie('refresh_token', data.refresh_token, 30, true);
    
    window.dispatchEvent(new CustomEvent('jwt-updated', { detail: data.access_token }));
    
    if (import.meta.env.DEV) {
      console.log('[AUTH] performRefresh:success');
    }
    
    return data.access_token;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[AUTH] performRefresh:error', err?.message);
    }
    TokenService.clearTokens();
    deleteCookie('jwt');
    deleteCookie('refresh_token');
    // Throttle invalidation event to avoid floods
    const now = Date.now();
    if (now - lastInvalidationEmit > 60_000) {
      window.dispatchEvent(new CustomEvent('jwt-invalidated'));
      lastInvalidationEmit = now;
    }
    return null;
  }
}

// Fallback: re-login silencieux via Firebase pour obtenir un nouvel access token
async function performSilentRelogin() {
  try {
    const { auth } = await import('../firebase');
    const apiBase = import.meta.env.VITE_API_URL;
    const apiKey = import.meta.env.VITE_API_KEY;
    const user = auth?.currentUser;
    if (!user) return null;
    const idToken = await user.getIdToken(true).catch(() => null);
    if (!idToken) return null;
    if (import.meta.env.DEV) {
      console.log('[AUTH] performSilentRelogin:start');
    }
    // Essayer /auth puis fallback /token
    const tryAuth = async () => {
      const res = await instrumentedFetch(`${apiBase}/api/users/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        credentials: 'include',
        body: JSON.stringify({ id_token: idToken }),
      }, { label: 'silent-relogin-auth' });
      return res?.ok ? res : null;
    };
    let res = await tryAuth();
    if (!res) {
      res = await instrumentedFetch(`${apiBase}/api/users/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        credentials: 'include',
        body: JSON.stringify({ id_token: idToken }),
      }, { label: 'silent-relogin-token' });
      if (!res.ok) return null;
    }
    const data = await res.json().catch(() => null);
    const access = data?.access_token;
    const refresh = data?.refresh_token || data?.refresh || data?.refreshToken;
    if (!access) return null;
    
    TokenService.setTokens(access, refresh || TokenService.getRefreshToken() || getCookie('refresh_token'));
    setCookie('jwt', access, 7, true);
    if (refresh) setCookie('refresh_token', refresh, 30, true);
    
    window.dispatchEvent(new CustomEvent('jwt-updated', { detail: access }));
    
    if (import.meta.env.DEV) {
      console.log('[AUTH] performSilentRelogin:success');
    }
    
    return access;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[AUTH] performSilentRelogin:error', err?.message);
    }
    return null;
  }
}

async function ensureValidJwt() {
  let jwt = TokenService.getAccessToken() || getCookie('jwt');
  if (jwt && !isJwtExpired(jwt)) return jwt;
  // Toujours tenter un refresh (cookie httpOnly possible), single-flight pour éviter les doublons
  if (!refreshPromise) {
    if (import.meta.env.DEV) {
      console.log('[AUTH] ensureValidJwt:trigger-refresh', {
        hadJwt: !!jwt,
        jwtExpired: !!jwt,
        time: new Date().toISOString(),
      });
    }
    refreshPromise = (async () => {
      const refreshed = await performRefresh();
      if (refreshed) return refreshed;
      // Fallback: tentative de re-login silencieux
      return performSilentRelogin();
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export default async function authFetch(url, options = {}, meta = {}) {
  const headers = new Headers(options.headers || {});
  let jwt = TokenService.getAccessToken() || getCookie('jwt');
  if (jwt && isJwtExpired(jwt)) {
    jwt = await ensureValidJwt();
  }
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
  headers.set('X-API-KEY', import.meta.env.VITE_API_KEY);

  const initialRes = await instrumentedFetch(url, { ...options, headers }, meta);
  const isRefreshEndpoint = String(url).includes('/api/users/refresh');
  if (isRefreshEndpoint || (initialRes.status !== 401 && initialRes.status !== 403)) {
    return initialRes;
  }
  // Tentative de refresh puis retry (une seule fois)
  const newJwt = await ensureValidJwt();
  if (!newJwt) {
    try {
      const now = Date.now();
      if (now - lastInvalidationEmit > 60_000) {
        window.dispatchEvent(new CustomEvent('jwt-invalidated'));
        lastInvalidationEmit = now;
      }
    } catch {}
    return initialRes; // échec, on renvoie la réponse d'origine
  }
  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set('Authorization', `Bearer ${newJwt}`);
  retryHeaders.set('X-API-KEY', import.meta.env.VITE_API_KEY);
  return instrumentedFetch(url, { ...options, headers: retryHeaders }, { ...meta, retried: true });
}

// Hook utilitaire : retourne booléen d'expiration imminente
export function isJwtNearExpiry(thresholdSec = 60) {
  const jwt = TokenService.getAccessToken() || getCookie('jwt');
  // Si aucun JWT, ne pas considérer "bientôt expiré" pour éviter les pings en boucle
  if (!jwt) return false;
  const payload = decodeJwt(jwt);
  if (!payload?.exp) return false;
  const remaining = payload.exp * 1000 - Date.now();
  return remaining < thresholdSec * 1000;
}

// Dev/test helper: forcer un refresh explicite indépendamment de l'état du JWT
export async function forceRefresh() {
  return ensureValidJwt();
}

// Dev helper: exposer globalement pour tests console
if (import.meta.env.DEV) {
  window.__debugAuth = {
    forceRefresh,
    getTokens: () => ({
      access: TokenService.getAccessToken(),
      refresh: TokenService.getRefreshToken(),
      jwtCookie: getCookie('jwt'),
      refreshCookie: getCookie('refresh_token'),
    }),
    clearTokens: () => {
      TokenService.clearTokens();
      deleteCookie('jwt');
      deleteCookie('refresh_token');
      console.log('[DEBUG] Tokens cleared');
    },
  };
  console.log('[DEBUG] Auth helpers exposés: window.__debugAuth');
}