// TokenService: gère les tokens d'accès et de refresh en sessionStorage
// Fournit des helpers pour lecture/écriture et nettoyage

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const TokenService = {
  setTokens(accessToken, refreshToken) {
    try {
      if (accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {}
  },
  getAccessToken() {
    try {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefreshToken() {
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  clearTokens() {
    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
  },
  isAuthenticated() {
    return Boolean(this.getAccessToken());
  },
  async logout(onAfter = () => {}) {
    try {
      this.clearTokens();
    } catch {}
    try {
      // Nettoyer aussi les cookies de compat
      const { deleteCookie } = await import('./cookie');
      deleteCookie('jwt');
      deleteCookie('refresh_token');
    } catch {}
    try {
      const { auth } = await import('../firebase');
      const { signOut } = await import('firebase/auth');
      if (auth?.currentUser) {
        await signOut(auth).catch(() => {});
      }
    } catch {}
    try { onAfter(); } catch {}
    try {
      // Redirection automatique vers la page de connexion
      window.location.href = '/login';
    } catch {}
  },
};

export default TokenService;
