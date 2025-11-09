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

let refreshPromise = null; // single-flight

async function performRefresh() {
  const refreshToken = getCookie('refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await instrumentedFetch(`${import.meta.env.VITE_API_URL}/api/users/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': import.meta.env.VITE_API_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    }, { label: 'refresh-token-auto' });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json().catch(() => null);
    if (!data?.access_token) throw new Error('Missing access token');
    setCookie('jwt', data.access_token, 7, true);
    if (data.refresh_token) {
      setCookie('refresh_token', data.refresh_token, 30, true);
    }
    window.dispatchEvent(new CustomEvent('jwt-updated', { detail: data.access_token }));
    return data.access_token;
  } catch (err) {
    deleteCookie('jwt');
    deleteCookie('refresh_token');
    window.dispatchEvent(new CustomEvent('jwt-invalidated'));
    return null;
  }
}

async function ensureValidJwt() {
  let jwt = getCookie('jwt');
  if (jwt && !isJwtExpired(jwt)) return jwt;
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export default async function authFetch(url, options = {}, meta = {}) {
  const headers = new Headers(options.headers || {});
  let jwt = getCookie('jwt');
  if (jwt && isJwtExpired(jwt)) {
    jwt = await ensureValidJwt();
  }
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
  headers.set('X-API-KEY', import.meta.env.VITE_API_KEY);

  const initialRes = await instrumentedFetch(url, { ...options, headers }, meta);
  if (initialRes.status !== 401 && initialRes.status !== 403) {
    return initialRes;
  }
  // Tentative de refresh puis retry (une seule fois)
  const newJwt = await ensureValidJwt();
  if (!newJwt) {
    return initialRes; // échec, on renvoie la réponse d'origine
  }
  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set('Authorization', `Bearer ${newJwt}`);
  retryHeaders.set('X-API-KEY', import.meta.env.VITE_API_KEY);
  return instrumentedFetch(url, { ...options, headers: retryHeaders }, { ...meta, retried: true });
}

// Hook utilitaire : retourne booléen d'expiration imminente
export function isJwtNearExpiry(thresholdSec = 60) {
  const jwt = getCookie('jwt');
  if (!jwt) return true;
  const payload = decodeJwt(jwt);
  if (!payload?.exp) return true;
  const remaining = payload.exp * 1000 - Date.now();
  return remaining < thresholdSec * 1000;
}