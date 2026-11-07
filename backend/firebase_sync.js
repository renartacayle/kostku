// Firebase Realtime Database Cloud Sync for KostKu
// Project: kostku-10966
// Region: asia-southeast1 (Singapore)

const RTDB_URL = 'https://kostku-10966-default-rtdb.asia-southeast1.firebasedatabase.app';

// Helper: Build auth query parameter if secret is configured in environment
const getAuthQuery = () => {
  const secret = process.env.FIREBASE_DATABASE_SECRET || process.env.FIREBASE_AUTH_TOKEN || '';
  return secret ? `?auth=${encodeURIComponent(secret)}` : '';
};

// Helper: Fetch real database from Firebase Cloud
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

// Helper: Save database to Firebase Cloud
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
  saveToFirebase
};
