// Centralized API and Cloud Connection Layer for KostKu Multi-Device

const STORAGE_KEY_CLOUD_URL = 'kostku_cloud_url';
const STORAGE_KEY_USE_CLOUD = 'kostku_use_cloud';

// Get active API base URL
export const getApiBaseUrl = () => {
  const useCloud = localStorage.getItem(STORAGE_KEY_USE_CLOUD) === 'true';
  const customCloudUrl = localStorage.getItem(STORAGE_KEY_CLOUD_URL);
  
  if (useCloud && customCloudUrl && customCloudUrl.trim() !== '') {
    // Strip trailing slash
    return customCloudUrl.trim().replace(/\/+$/, '') + '/api';
  }

  // If running inside Capacitor Android APK
  if (typeof window !== 'undefined') {
    const isCapacitor = window.location.protocol === 'capacitor:' || 
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port === '' && window.navigator?.userAgent?.includes('Android'));

    if (isCapacitor) {
      const savedHost = localStorage.getItem('kostku_server_ip') || 'http://192.168.18.6:3001';
      return savedHost.replace(/\/+$/, '') + '/api';
    }
  }

  return '/api';
};

// Set custom online cloud API URL
export const setCloudApiUrl = (url, enable = true) => {
  if (url) {
    localStorage.setItem(STORAGE_KEY_CLOUD_URL, url.trim().replace(/\/+$/, ''));
  }
  localStorage.setItem(STORAGE_KEY_USE_CLOUD, enable ? 'true' : 'false');
  window.dispatchEvent(new Event('kostku_connection_changed'));
};

export const getCloudConfig = () => {
  return {
    url: localStorage.getItem(STORAGE_KEY_CLOUD_URL) || '',
    useCloud: localStorage.getItem(STORAGE_KEY_USE_CLOUD) === 'true',
    activeUrl: getApiBaseUrl()
  };
};

// Test connection to current or specific API server
export const testApiConnection = async (targetUrl = null) => {
  const base = targetUrl ? targetUrl.trim().replace(/\/+$/, '') + '/api' : getApiBaseUrl();
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    // We check /public/kosts or /health
    const res = await fetch(`${base}/public/kosts`, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    
    const latency = Math.round(performance.now() - startTime);
    return { ok: res.ok, latency, error: null };
  } catch (err) {
    return { ok: false, latency: 0, error: err.message || 'Gagal tersambung' };
  }
};

// Generic fetch wrapper with timeout & error handling
async function request(endpoint, options = {}) {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    // Handle non-JSON or error status
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP Error ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[API Error ${endpoint}]:`, err);
    throw err;
  }
}

// ── Auth Endpoints ──────────────────────────────────────────
export const apiLogin = (loginId, password) => {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password })
  });
};

export const apiGoogleAuth = (emailOrPayload, name, role, extra = {}) => {
  const payload = typeof emailOrPayload === 'object' && emailOrPayload !== null
    ? emailOrPayload
    : { email: emailOrPayload, name, role, ...extra };

  return request('/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const apiCheckEmail = (email) => {
  return request(`/auth/check-email?email=${encodeURIComponent(email)}`);
};

export const apiGetGoogleClientId = () => {
  return request('/config/google-client-id');
};

export const apiSetGoogleClientId = (clientId) => {
  return request('/config/google-client-id', {
    method: 'POST',
    body: JSON.stringify({ clientId })
  });
};

export const apiRegister = (userData) => {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const apiUpdateProfile = (profileData) => {
  return request('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
};

// ── Public Marketplace Endpoints ────────────────────────────
export const apiGetPublicKosts = () => request('/public/kosts');

export const apiApplyKost = (data) => {
  return request('/kosts/apply', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── Application Approval Endpoints ──────────────────────────
export const apiGetApplications = (kostUid) => request(`/applications?kostUid=${kostUid}`);

export const apiProcessApplication = (id, action) => {
  return request(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ action })
  });
};

// ── Tenants (Penghuni) Endpoints ────────────────────────────
export const apiGetUsers = (kostUid) => request(`/users?kostUid=${kostUid}`);

export const apiDeleteUser = (id) => {
  return request(`/users/${id}`, { method: 'DELETE' });
};

export const apiUpdateBedsheets = (id, bedsheets) => {
  return request(`/users/${id}/bedsheets`, {
    method: 'PUT',
    body: JSON.stringify({ bedsheets })
  });
};

// ── Settings Endpoints ──────────────────────────────────────
export const apiGetSettings = (kostUid) => request(`/settings?kostUid=${kostUid}`);

export const apiUpdateSettings = (kostUid, settingsData) => {
  return request(`/settings?kostUid=${kostUid}`, {
    method: 'PUT',
    body: JSON.stringify(settingsData)
  });
};

// ── Invoices (Tagihan) Endpoints ────────────────────────────
export const apiGetInvoices = (kostUid = null, userId = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  if (userId) params.append('userId', userId);
  return request(`/invoices?${params.toString()}`);
};

export const apiVerifyInvoice = (id) => {
  return request(`/invoices/${id}/verify`, { method: 'PUT' });
};

// ── Expenses (Pengeluaran) Endpoints ────────────────────────
export const apiGetExpenses = (kostUid) => request(`/expenses?kostUid=${kostUid}`);

export const apiAddExpense = (kostUid, title, amount, category) => {
  return request('/expenses', {
    method: 'POST',
    body: JSON.stringify({ kostUid, title, amount, category })
  });
};

export const apiDeleteExpense = (id) => {
  return request(`/expenses/${id}`, { method: 'DELETE' });
};

// ── Complaints (Komplain) Endpoints ─────────────────────────
export const apiGetComplaints = (kostUid = null, userId = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  if (userId) params.append('userId', userId);
  return request(`/complaints?${params.toString()}`);
};

export const apiCreateComplaint = (data) => {
  return request('/complaints', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiUpdateComplaintStatus = (id, status) => {
  return request(`/complaints/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

// ── Activities & IoT ────────────────────────────────────────
export const apiGetActivities = (kostUid) => request(`/activities?kostUid=${kostUid}`);

export const apiGetIoTMeteran = (kostUid, month = null) => {
  const params = new URLSearchParams({ kostUid });
  if (month) params.append('month', month);
  return request(`/iot/meteran?${params.toString()}`);
};

export const apiSaveIoTMeteran = (kostUid, kamar, type, value) => {
  return request('/iot/meteran', {
    method: 'POST',
    body: JSON.stringify({ kostUid, kamar, type, value })
  });
};

// ── Multi-Property Owner Endpoints ─────────────────────────
export const apiGetOwnerKosts = (ownerId) => request(`/owner/kosts?ownerId=${ownerId}`);

export const apiCreateOwnerKost = (data) => {
  return request('/owner/kosts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetOwnerPortfolio = (ownerId) => request(`/owner/portfolio?ownerId=${ownerId}`);

export const apiSwitchOwnerKost = (userId, targetKostUid) => {
  return request('/owner/switch-kost', {
    method: 'PUT',
    body: JSON.stringify({ userId, targetKostUid })
  });
};

// ── Staff Management Endpoints ─────────────────────────────
export const apiGetOwnerStaff = (kostUid = null, ownerId = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  if (ownerId) params.append('ownerId', ownerId);
  return request(`/owner/staff?${params.toString()}`);
};

export const apiCreateStaff = (data) => {
  return request('/owner/staff', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiUpdateStaff = (id, data) => {
  return request(`/owner/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiDeleteStaff = (id) => {
  return request(`/owner/staff/${id}`, {
    method: 'DELETE'
  });
};

// ── Payment Gateway & Transactions ─────────────────────────
export const apiCreatePaymentTransaction = (data) => {
  return request('/payments/create-transaction', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiSimulatePaymentSuccess = (data) => {
  return request('/payments/simulate-success', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetPaymentReceipt = (invoiceId) => {
  return request(`/payments/receipt/${invoiceId}`);
};

// ── Digital Contracts & E-Signature ────────────────────────
export const apiSignContract = (data) => {
  return request('/contracts/sign', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetContract = (userId) => {
  return request(`/contracts/${userId}`);
};

// ── Digital Package Locker (Titipan Paket) ─────────────────
export const apiGetPackages = (kostUid = null, userId = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  if (userId) params.append('userId', userId);
  return request(`/packages?${params.toString()}`);
};

export const apiCreatePackage = (data) => {
  return request('/packages', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiPickupPackage = (id) => {
  return request(`/packages/${id}/pickup`, {
    method: 'PUT'
  });
};

// ── Inspeksi Kamar & Deposit ────────────────────────────────
export const apiGetInspections = (kostUid = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  return request(`/inspections?${params.toString()}`);
};

export const apiCreateInspection = (data) => {
  return request('/inspections', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── Smart Lock PIN & Listrik Token ──────────────────────────
export const apiGenerateSmartLockPin = (data) => {
  return request('/smart-lock/generate-pin', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiTopUpElectricity = (data) => {
  return request('/electricity/top-up', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};


