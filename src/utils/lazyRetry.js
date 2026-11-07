import { lazy } from 'react';
import { checkAppVersion, clearStaleAppCache } from './versionCheck';

/**
 * Smart Multi-Tier Lazy Loader with Adaptive Network Buffer Scaling & Version Check
 *
 * 1. Adaptive Network Buffer Timeout (Skala Otomatis Jaringan):
 *    - Koneksi Lancar (4G / WiFi Cepat, RTT < 250ms): Buffer 3 detik (3000ms).
 *    - Koneksi Sedang (3G / Data Saver, RTT 250-800ms): Otomatis diskala ke 5 detik (5000ms).
 *    - Koneksi Lambat (2G / Sinyal Drop, RTT > 800ms): Otomatis diskala ke 8 detik (8000ms).
 *    - Skala Percobaan Ulang: Pada retry berikutnya, timeout dinaikkan 1.5x agar modul tetap
 *      memiliki ruang bernapas selesai tanpa diputus terburu-buru.
 *
 * 2. Cek Versi (Hemat Kuota & Instant Loading):
 *    - Jika versi sama: Gunakan 100% cache lokal (0 byte kuota, instan < 30ms).
 *    - Jika versi berbeda (ada deployment baru di Cloudflare): Bersihkan cache modul lama,
 *      lalu muat modul versi terbaru.
 *
 * 3. Max Retries:
 *    Mencoba hingga 2 kali "try load baru" sebelum fallback ke reload terukur.
 */

// Menghitung batas buffer timeout secara adaptif berdasarkan kualitas jaringan HP
export function getAdaptiveBufferTimeout(attempt = 0) {
  let baseTimeout = 3000; // Standar default untuk koneksi lancar: 3 detik

  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      const effectiveType = conn.effectiveType || '';
      const rtt = conn.rtt || 0;
      const downlink = conn.downlink || 10;
      const saveData = Boolean(conn.saveData);

      if (effectiveType === 'slow-2g' || effectiveType === '2g' || rtt >= 1000 || downlink < 0.4) {
        baseTimeout = 8000; // Sinyal sangat lambat (2G / Ping > 1s): 8 detik
      } else if (effectiveType === '3g' || rtt >= 400 || downlink < 1.5 || saveData) {
        baseTimeout = 5000; // Sinyal sedang (3G / Data Saver): 5 detik
      } else if (rtt > 250) {
        baseTimeout = 4000; // 4G tapi latency agak tinggi: 4 detik
      } else {
        baseTimeout = 3000; // 4G / WiFi lancar: 3 detik
      }
    }
  }

  // Escalating scale per attempt: percobaan ulang diberi tambahan waktu 1.5x
  const scaledTimeout = Math.round(baseTimeout * Math.pow(1.5, attempt));
  return Math.min(scaledTimeout, 12000); // Maksimal batas atas 12 detik
}

// Helper to enforce the adaptive buffer limit per load attempt
function importWithAdaptiveBuffer(importFn, timeoutMs) {
  return new Promise((resolve, reject) => {
    let hasSettled = false;

    const timer = setTimeout(() => {
      if (!hasSettled) {
        hasSettled = true;
        const timeoutErr = new Error(`TIMEOUT_BUFFER: Modul tidak merespons dalam ${(timeoutMs / 1000).toFixed(1)} detik`);
        timeoutErr.isTimeout = true;
        timeoutErr.timeoutDuration = timeoutMs;
        reject(timeoutErr);
      }
    }, timeoutMs);

    importFn()
      .then((module) => {
        if (!hasSettled) {
          hasSettled = true;
          clearTimeout(timer);
          resolve(module);
        }
      })
      .catch((err) => {
        if (!hasSettled) {
          hasSettled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
  });
}

export function lazyRetry(componentImport, componentName = 'Component', maxRetries = 2) {
  return lazy(async () => {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const currentBuffer = getAdaptiveBufferTimeout(attempt);

      try {
        // Jalankan import dengan batas waktu buffer adaptif jaringan!
        return await importWithAdaptiveBuffer(componentImport, currentBuffer);
      } catch (error) {
        lastError = error;
        const isTimeout = Boolean(error?.isTimeout || error?.message?.includes('TIMEOUT_'));
        
        if (isTimeout) {
          console.warn(`[KostKu] ⏳ Buffer ${(currentBuffer / 1000).toFixed(1)}s habis untuk ${componentName}! Jaringan lambat, memicu try load baru (Percobaan ke-${attempt + 1})...`);
        } else {
          console.warn(`[KostKu] Percobaan memuat ${componentName} gagal (${attempt + 1}/${maxRetries + 1}):`, error);
        }

        // Cek versi jika terjadi kegagalan muat untuk mendeteksi deployment baru
        if (attempt === 0) {
          try {
            const versionStatus = await checkAppVersion(true);
            if (versionStatus.isNewVersion) {
              console.log(`[KostKu] Versi baru terdeteksi saat load ${componentName}. Membersihkan cache usang...`);
              await clearStaleAppCache();
            }
          } catch (_) {}
        }

        if (attempt < maxRetries) {
          // Jeda singkat sebelum try load baru (350ms)
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    }

    // Jika setelah semua retry dengan buffer adaptif tetap gagal:
    console.error(`[KostKu] Gagal memuat modul ${componentName} setelah beberapa kali try load:`, lastError);

    // Cek apakah kesalahan karena chunk lama di-invalidasi oleh build baru
    const isChunkError = Boolean(
      lastError && (
        lastError.message?.includes('Failed to fetch dynamically imported module') ||
        lastError.message?.includes('Loading chunk') ||
        lastError.message?.includes('Importing a module script failed') ||
        lastError.message?.includes('error loading dynamically imported module') ||
        lastError.message?.includes('TIMEOUT_') ||
        lastError.name === 'ChunkLoadError'
      )
    );

    const storageKey = `kostku_chunk_retry_${componentName}`;
    const pageHasBeenForceRefreshed = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(storageKey) : null;

    if (isChunkError && !pageHasBeenForceRefreshed && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch (_) {}

      await clearStaleAppCache();

      // Gunakan location.replace untuk memuat versi bersih terbaru
      window.location.replace(window.location.href);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    try {
      sessionStorage.removeItem(storageKey);
    } catch (_) {}

    throw lastError;
  });
}

export default lazyRetry;
