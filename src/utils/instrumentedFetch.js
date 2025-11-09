// instrumentedFetch: mesure durée + taille, émet un évènement 'api-metric'
// Usage: instrumentedFetch(url, options, { label: 'fetch-albums' })
// L'évènement detail: { url, method, status, durationMs, sizeBytes, label, retried, time }

export default async function instrumentedFetch(url, options = {}, meta = {}) {
  const start = performance.now();
  let response;
  let sizeBytes = 0;
  try {
    response = await fetch(url, options);
    // On clone pour lire sans consommer l'original (laisse le body dispo pour l'appelant)
    const cloned = response.clone();
    // Essayer d'obtenir la taille brute (JSON ou texte)
    const text = await cloned.text().catch(() => '');
    sizeBytes = new TextEncoder().encode(text).length;
    return response;
  } finally {
    const end = performance.now();
    const detail = {
      url,
      method: (options && options.method) || 'GET',
      status: response ? response.status : 0,
      durationMs: Math.round(end - start),
      sizeBytes,
      label: meta.label || null,
      retried: !!meta.retried,
      time: Date.now()
    };
    try {
      window.dispatchEvent(new CustomEvent('api-metric', { detail }));
    } catch {}
    if (import.meta.env.DEV) {
      // Log compact en dev
      console.log('[API]', detail.label || '', detail.method, detail.status, detail.durationMs + 'ms', sizeBytes + 'B', url);
    }
  }
}
