// Firebase Realtime Database Cloud Sync for KostKu
// Project: kostku-10966
// Region: asia-southeast1 (Singapore)
// Hybrid Granular Delta Sync (< 5 KB) & Debounced Cold Snapshot (Anti-Lag & Zero Quota Waste)

const RTDB_URL = 'https://kostku-10966-default-rtdb.asia-southeast1.firebasedatabase.app';

// Helper: Build auth query parameter if secret is configured in environment
const getAuthQuery = () => {
  const secret = process.env.FIREBASE_DATABASE_SECRET || process.env.FIREBASE_AUTH_TOKEN || '';
  return secret ? `?auth=${encodeURIComponent(secret)}` : '';
};

/**
 * 1. Granular Delta Sync (Super Ringan: 50 byte - 2 KB)
 * Mengupdate hanya sub-node tertentu tanpa menyentuh data lainnya.
 * Contoh path: 'pos_orders/INV-001', 'customer_points/08123456789', 'receipt_claims/TKN-ABC', 'merchant_wallets/MTR-001'
 */
const syncDeltaToFirebase = async (nodePath, payload, method = 'PATCH') => {
  try {
    const cleanPath = String(nodePath).replace(/^\//, '');
    const url = `${RTDB_URL}/kostku_db/${cleanPath}.json${getAuthQuery()}`;
    const res = await fetch(url, {
      method: method, // 'PATCH' untuk partial update, 'PUT' untuk replace child node
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Firebase Delta Sync Error] Path: ${cleanPath} | Status: ${res.status}`, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Firebase Delta Sync Exception] Path: ${nodePath}:`, err.message);
    return false;
  }
};

/**
 * 2. Debounced Full Backup (Cold Snapshot)
 * Backup full database hanya berjalan jika sudah tidak ada mutasi selama X menit,
 * atau dipicu oleh Cron Job tengah malam.
 */
let _debounceTimer = null;
const scheduleFullBackupDebounced = (getFullDataFn, delayMs = 600000) => { // Default 10 menit
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(async () => {
    try {
      const data = typeof getFullDataFn === 'function' ? getFullDataFn() : getFullDataFn;
      if (data) {
        console.log('[Firebase RTDB] Executing scheduled cold snapshot backup (Full DB)...');
        await saveToFirebase(data);
        console.log('[Firebase RTDB] Cold snapshot completed successfully.');
      }
    } catch (e) {
      console.warn('[Firebase RTDB] Failed scheduled full backup:', e.message);
    }
  }, delayMs);
};

// Helper: Fetch real database from Firebase Cloud (digunakan saat cold boot server)
const fetchFromFirebase = async () => {
  try {
    const res = await fetch(`${RTDB_URL}/kostku_db.json${getAuthQuery()}`);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn('[Firebase RTDB] Permission denied. Check Rules tab or set FIREBASE_DATABASE_SECRET in .env');
      }
      return null;
    }
    const data = await res.json();
    if (data && typeof data === 'object' && Array.isArray(data.kosts)) {
      return data;
    }
    return null;
  } catch (err) {
    console.warn('[Firebase RTDB] Failed to fetch cloud data:', err.message);
    return null;
  }
};

// Helper: Save full database to Firebase Cloud
const saveToFirebase = async (data) => {
  try {
    const res = await fetch(`${RTDB_URL}/kostku_db.json${getAuthQuery()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[Firebase RTDB] Failed to write cloud data:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Firebase RTDB] Failed to write cloud data:', err.message);
    return false;
  }
};

module.exports = {
  RTDB_URL,
  fetchFromFirebase,
  saveToFirebase,
  syncDeltaToFirebase,
  scheduleFullBackupDebounced
};
