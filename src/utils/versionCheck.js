import { APP_VERSION, APP_BUILD_NUMBER } from '../config/version';

const CACHE_VERSION_KEY = 'kostku_active_version';
const CACHE_BUILD_KEY = 'kostku_active_build_number';

/**
 * Smart Version Check Utility (Hemat Kuota & Loading Cepat)
 * 1. Jika versi lokal == versi server: Return isNewVersion: false -> Gunakan 100% Cache Lokal (0 Kuota).
 * 2. Jika versi lokal != versi server: Return isNewVersion: true -> Hapus cache usang & unduh modul baru.
 */
export async function checkAppVersion(forceNetwork = false) {
  if (typeof window === 'undefined') {
    return { isNewVersion: false, version: APP_VERSION, buildNumber: APP_BUILD_NUMBER };
  }

  // Check stored version
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY) || APP_VERSION;
  const storedBuild = parseInt(localStorage.getItem(CACHE_BUILD_KEY) || `${APP_BUILD_NUMBER}`, 10);

  // If not forcing network, return cached version status immediately
  if (!forceNetwork) {
    return {
      isNewVersion: false,
      version: storedVersion,
      buildNumber: storedBuild,
      localVersion: APP_VERSION
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    // Fetch tiny version.json (~60 bytes only)
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const remoteBuild = parseInt(data.buildNumber || '0', 10);
      const isNewer = remoteBuild > APP_BUILD_NUMBER || data.version !== APP_VERSION;

      if (isNewer) {
        console.log(`[KostKu] Terdeteksi versi baru di Cloudflare: v${data.version} (Build ${remoteBuild}).`);
        localStorage.setItem(CACHE_VERSION_KEY, data.version);
        localStorage.setItem(CACHE_BUILD_KEY, `${remoteBuild}`);
        return { isNewVersion: true, version: data.version, buildNumber: remoteBuild };
      }
    }
  } catch (err) {
    // Network timeout or offline -> safely fallback to current version without error
    console.debug('[KostKu] Pengecekan versi server dilewati:', err?.message);
  }

  return { isNewVersion: false, version: APP_VERSION, buildNumber: APP_BUILD_NUMBER };
}

/**
 * Bersihkan hanya cache aplikasi jika versi server berubah
 */
export async function clearStaleAppCache() {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => {
        // Only delete stale caches, preserve external if any
        if (k.startsWith('kostku-cache-')) {
          console.log('[KostKu] Membersihkan cache usang:', k);
          return caches.delete(k);
        }
        return Promise.resolve();
      })
    );
  } catch (_) {}
}
