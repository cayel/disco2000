export function deleteCookie(name) {
  // Supprime le cookie pour tous les chemins possibles
  const paths = ['/', '/disco2000'];
  const isSecure = window.location.protocol === 'https:';
  
  paths.forEach(path => {
    // Version standard
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=${path}; SameSite=Strict`;
    // Version sécurisée si HTTPS
    if (isSecure) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=${path}; Secure; SameSite=Strict`;
    }
  });
  // Suppression sans path (par défaut)
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;`;
}
// Utilitaires pour manipuler les cookies JWT
export function setCookie(name, value, days = 7, secure = true) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  let cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
  if (secure) cookie += '; Secure; SameSite=Strict';
  document.cookie = cookie;
}

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
