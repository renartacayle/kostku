import { lazy } from 'react';

/**
 * Resilient lazy loader for Vite / React Single Page Applications.
 * Automatically recovers from failed dynamic module imports (TypeError: Failed to fetch dynamically imported module)
 * which typically occur when a new production build invalidates old chunk hashes.
 */
export function lazyRetry(componentImport, componentName = 'Component') {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = sessionStorage.getItem(`kostku_chunk_retry_${componentName}`);

    try {
      return await componentImport();
    } catch (error) {
      console.warn(`[KostKu] Chunk load failed for ${componentName}. Error:`, error);

      // If we haven't tried to refresh for this component yet in this session
      if (!pageHasBeenForceRefreshed) {
        sessionStorage.setItem(`kostku_chunk_retry_${componentName}`, 'true');

        // Aggressively clear cache storage to ensure fresh index.html & chunks
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          } catch (_) {}
        }

        // Hard reload the current page from the network
        window.location.reload();

        // Return an unresolved promise to prevent ErrorBoundary flash while page reloads
        return new Promise(() => {});
      }

      // If already refreshed once and still failing (e.g. genuinely offline or broken code)
      sessionStorage.removeItem(`kostku_chunk_retry_${componentName}`);
      throw error;
    }
  });
}

export default lazyRetry;
