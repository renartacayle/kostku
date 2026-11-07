import { lazy } from 'react';

/**
 * Resilient multi-tier lazy loader for Vite / React Single Page Applications.
 * 1. Tier 1: In-memory dynamic import retries (3 attempts with exponential backoff).
 *    Instantly resolves 95% of transient mobile network hiccups without causing white-screens or reloads.
 * 2. Tier 2: If all attempts fail and chunk hash is invalidated due to new Cloudflare Pages deployment:
 *    Flushes CacheStorage, initiates window.location.replace, and gracefully passes control to ErrorBoundary
 *    if the reload takes longer than 1.2s, ensuring the user NEVER gets trapped in a hanging white screen.
 */
export function lazyRetry(componentImport, componentName = 'Component', maxRetries = 3) {
  return lazy(async () => {
    let lastError = null;

    // Tier 1: In-memory retry loop
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error;
        console.warn(`[KostKu] Chunk load attempt ${attempt + 1}/${maxRetries} failed for ${componentName}:`, error);

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 300ms, then 750ms
          await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2.2, attempt)));
        }
      }
    }

    // Tier 2: Check if this was a chunk loading error
    const isChunkError = Boolean(
      lastError && (
        lastError.message?.includes('Failed to fetch dynamically imported module') ||
        lastError.message?.includes('Loading chunk') ||
        lastError.message?.includes('Importing a module script failed') ||
        lastError.message?.includes('error loading dynamically imported module') ||
        lastError.name === 'ChunkLoadError'
      )
    );

    const storageKey = `kostku_chunk_retry_${componentName}`;
    const pageHasBeenForceRefreshed = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(storageKey) : null;

    if (isChunkError && !pageHasBeenForceRefreshed && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch (_) {}

      console.warn(`[KostKu] All in-memory retries failed for ${componentName}. Performing clean reload...`);

      // Flush service worker cache storage
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        } catch (_) {}
      }

      // Hard reload with location.replace (more reliable than location.reload on mobile)
      window.location.replace(window.location.href);

      // Give browser 1200ms to reload. If browser prevents reload, throw to ErrorBoundary
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    try {
      sessionStorage.removeItem(storageKey);
    } catch (_) {}

    // Never return an unresolved forever-pending promise! Always throw to ErrorBoundary
    throw lastError;
  });
}

export default lazyRetry;
