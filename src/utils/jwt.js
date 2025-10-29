// Vérifie si un JWT est expiré (retourne true si expiré ou invalide)
export function isJwtExpired(token) {
  if (!token) return true;
  try {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return true;
    // exp est en secondes depuis epoch
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}
// Décodage JWT simple (sans vérification de signature)
export function decodeJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
