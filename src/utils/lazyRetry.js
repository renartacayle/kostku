import { lazy } from 'react';
import { checkAppVersion, clearStaleAppCache } from './versionCheck';

/**
 * Smart Multi-Tier Lazy Loader with Version Check & 3-Second Timeout Buffer (Hemat Kuota & Anti-Macet)
 *
 * 1. 3-Detik Buffer Timeout:
 *    Setiap percobaan import dibatasi maksimal 3000ms.
 *    Jika dalam 3 detik modul macet / tidak kunjung selesai (akibat sinyal HP nge-drop/stall),
 *    timer langsung membatalkan penantian dan memicu "try load baru".
 *
 * 2. Cek Versi (Hemat Kuota & Instant Loading):
 *    - Sebelum memuat ulang, sistem memverifikasi versi app.
 *    - Jika versi sama: Gunakan 100% cache lokal yang sudah tersimpan (0 byte kuota, instan < 30ms).
 *    - Jika versi berbeda (ada deployment baru di Cloudflare): Bersihkan cache modul lama,
 *      lalu muat modul versi terbaru.
 *
 * 3. Max Retries:
 *    Mencoba hingga 2 kali "try load baru" dengan jeda cerdas sebelum fallback ke reload terukur.
 */

// Helper to enforce the 3-second buffer limit per load attempt
function importWith3sBuffer(importFn, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    let hasSettled = false;

    const timer = setTimeout(() => {
      if (!hasSettled) {
        hasSettled = true;
        const timeoutErr = new Error(`TIMEOUT_3S: Modul tidak merespons dalam ${timeoutMs / 1000} detik`);
        timeoutErr.isTimeout = true;
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
      try {
        // Jalankan import dengan batas waktu buffer 3 detik!
        return await importWith3sBuffer(componentImport, 3000);
      } catch (error) {
        lastError = error;
        const isTimeout = Boolean(error?.isTimeout || error?.message?.includes('TIMEOUT_3S'));
        
        if (isTimeout) {
          console.warn(`[KostKu] ⏳ Buffer 3 detik habis untuk ${componentName}! Sinyal lambat, memicu try load baru (Percobaan ke-${attempt + 1})...`);
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

    // Jika setelah semua retry dengan buffer 3 detik tetap gagal:
    console.error(`[KostKu] Gagal memuat modul ${componentName} setelah beberapa kali try load:`, lastError);

    // Cek apakah kesalahan karena chunk lama di-invalidasi oleh build baru
    const isChunkError = Boolean(
      lastError && (
        lastError.message?.includes('Failed to fetch dynamically imported module') ||
        lastError.message?.includes('Loading chunk') ||
        lastError.message?.includes('Importing a module script failed') ||
        lastError.message?.includes('error loading dynamically imported module') ||
        lastError.message?.includes('TIMEOUT_3S') ||
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
