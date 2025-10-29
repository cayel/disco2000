export function deleteCookie(name) {
  // Version sécurisée (prod)
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/; Secure; SameSite=Strict';
  // Version non sécurisée (localhost/dev)
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/;';
  // Sous-dossier (ex: /disco2000)
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/disco2000;';
  // Sans path (par défaut)
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;';
  // Sans path, secure
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Secure; SameSite=Strict';
// }
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
