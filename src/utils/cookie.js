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
