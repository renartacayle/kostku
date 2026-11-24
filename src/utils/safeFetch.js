// Global fetch timeout safety net so buttons never stay stuck spinning indefinitely
const SLOW_ENDPOINT_PATTERNS = [
  '/api/vision/',
  '/api/restore',
  '/api/backup',
  '/forecast',
  '/api/payments/midtrans',
  '/api/payments/tripay'
];

export function installSafeFetchTimeout() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (window.__kostkuSafeFetchInstalled) return;
  window.__kostkuSafeFetchInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const urlStr = typeof input === 'string'
      ? input
      : (typeof Request !== 'undefined' && input instanceof Request ? input.url : '');

    // Respect explicit caller AbortSignal, keepalive beacons, or Request objects that carry a signal
    const hasCallerSignal = Boolean(
      init?.signal ||
      init?.keepalive ||
      (typeof Request !== 'undefined' && input instanceof Request && input.signal)
    );
    if (hasCallerSignal) {
      return nativeFetch(input, init);
    }

    const isSlowOp =
      (typeof FormData !== 'undefined' && init?.body instanceof FormData) ||
      SLOW_ENDPOINT_PATTERNS.some((pattern) => urlStr.includes(pattern));

    const timeoutMs = Number(init?.timeoutMs) > 0
      ? Number(init.timeoutMs)
      : (isSlowOp ? 35000 : 15000);

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      try {
        controller.abort(new Error(`Koneksi ke server melebihi batas waktu (${Math.round(timeoutMs / 1000)} detik).`));
      } catch (_) {
        controller.abort();
      }
    }, timeoutMs);

    try {
      return await nativeFetch(input, {
        ...init,
        signal: controller.signal
      });
    } catch (err) {
      if (timedOut || err?.name === 'AbortError') {
        throw new Error('Koneksi ke server melebihi batas waktu (timeout). Silakan coba lagi.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}
