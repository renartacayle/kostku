// Firebase Cloud Firestore Direct Service for KostKu
// Uses Firebase Firestore REST API for zero-dependency high speed performance on Web, Capacitor, & Electron

const STORAGE_FIREBASE_PROJECT_ID = 'kostku_firebase_project_id';
const STORAGE_FIREBASE_API_KEY = 'kostku_firebase_api_key';
const STORAGE_USE_FIREBASE = 'kostku_use_firebase';

export const getFirebaseConfig = () => {
  return {
    projectId: localStorage.getItem(STORAGE_FIREBASE_PROJECT_ID) || '',
    apiKey: localStorage.getItem(STORAGE_FIREBASE_API_KEY) || '',
    useFirebase: localStorage.getItem(STORAGE_USE_FIREBASE) === 'true',
    isConfigured: Boolean(localStorage.getItem(STORAGE_FIREBASE_PROJECT_ID))
  };
};

export const setFirebaseConfig = (projectId, apiKey = '', enable = true) => {
  if (projectId) {
    localStorage.setItem(STORAGE_FIREBASE_PROJECT_ID, projectId.trim());
    if (apiKey) localStorage.setItem(STORAGE_FIREBASE_API_KEY, apiKey.trim());
    localStorage.setItem(STORAGE_USE_FIREBASE, enable ? 'true' : 'false');
  } else {
    localStorage.removeItem(STORAGE_FIREBASE_PROJECT_ID);
    localStorage.removeItem(STORAGE_FIREBASE_API_KEY);
    localStorage.setItem(STORAGE_USE_FIREBASE, 'false');
  }
  window.dispatchEvent(new Event('kostku_connection_changed'));
};

// Test connection to Firebase Firestore REST API
export const testFirebaseConnection = async (testProjectId = null, testApiKey = null) => {
  const cfg = getFirebaseConfig();
  const projectId = (testProjectId || cfg.projectId || '').trim();
  const apiKey = (testApiKey || cfg.apiKey || '').trim();

  if (!projectId) {
    return { ok: false, error: 'Project ID Firebase belum diisi' };
  }

  const startTime = performance.now();
  try {
    // Check Firestore default database documents endpoint
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents${apiKey ? `?key=${apiKey}` : ''}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - startTime);

    if (res.ok) {
      return { ok: true, latency, error: null };
    } else {
      const data = await res.json().catch(() => ({}));
      let errMsg = data.error?.message || `HTTP Error ${res.status}`;
      if (res.status === 404) {
        errMsg = `Project ID "${projectId}" tidak ditemukan atau Cloud Firestore belum diaktifkan di Firebase Console.`;
      } else if (res.status === 403) {
        errMsg = 'Akses ditolak. Pastikan Security Rules Firestore mengizinkan akses baca (allow read: if true;) untuk mode demo/pengembangan.';
      }
      return { ok: false, latency, error: errMsg };
    }
  } catch (err) {
    return { ok: false, latency: 0, error: err.message || 'Gagal menghubungi server Firebase Firestore' };
  }
};
