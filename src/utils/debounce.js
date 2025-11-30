/**
 * Fonction debounce pour limiter la fréquence d'exécution d'une fonction
 * @param {Function} func - Fonction à exécuter
 * @param {number} wait - Délai d'attente en millisecondes
 * @returns {Function} Fonction debounced
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default debounce;
