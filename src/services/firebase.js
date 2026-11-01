// Firebase Cloud Realtime Database & Firestore SDK for KostKu
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  child 
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCDQKNDkPyhnwrSGY4f5FAt-1k8cCzoZJw",
  authDomain: "kostku-10966.firebaseapp.com",
  projectId: "kostku-10966",
  storageBucket: "kostku-10966.firebasestorage.app",
  messagingSenderId: "305934403602",
  appId: "1:305934403602:web:e857ac90657f4dc4e170cb",
  measurementId: "G-WZNNPGL437",
  databaseURL: "https://kostku-10966-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

// Configuration getters & setters for CloudSyncModal
const STORAGE_FB_PROJECT_ID = 'kostku_fb_project_id';
const STORAGE_FB_API_KEY = 'kostku_fb_api_key';
const STORAGE_FB_ENABLED = 'kostku_fb_enabled';

export const getFirebaseConfig = () => {
  if (typeof window === 'undefined') {
    return {
      projectId: firebaseConfig.projectId,
      apiKey: firebaseConfig.apiKey,
      isConfigured: true
    };
  }
  return {
    projectId: localStorage.getItem(STORAGE_FB_PROJECT_ID) || firebaseConfig.projectId,
    apiKey: localStorage.getItem(STORAGE_FB_API_KEY) || firebaseConfig.apiKey,
    isConfigured: true
  };
};

export const setFirebaseConfig = (projectId, apiKey, enable = true) => {
  if (typeof window === 'undefined') return;
  if (projectId) localStorage.setItem(STORAGE_FB_PROJECT_ID, projectId.trim());
  if (apiKey) localStorage.setItem(STORAGE_FB_API_KEY, apiKey.trim());
  localStorage.setItem(STORAGE_FB_ENABLED, enable ? 'true' : 'false');
  window.dispatchEvent(new Event('kostku_connection_changed'));
};

export const testFirebaseConnection = async (projectId = null, apiKey = null) => {
  const pId = projectId || firebaseConfig.projectId;
  const start = performance.now();
  try {
    const url = `https://${pId}-default-rtdb.asia-southeast1.firebasedatabase.app/system_health.json`;
    const res = await fetch(url);
    const latency = Math.round(performance.now() - start);
    if (res.ok) {
      return { ok: true, latency, error: null };
    }
    const errText = await res.text().catch(() => '');
    return { ok: false, latency, error: `HTTP ${res.status}: ${errText || 'Akses ditolak'}` };
  } catch (err) {
    return { ok: false, latency: 0, error: err.message || 'Gagal tersambung ke Firebase' };
  }
};

export { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  child 
};

export default app;
