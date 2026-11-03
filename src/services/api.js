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

  // If running inside native mobile container
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

// ── Performance Optimization: In-flight Deduplication & Short-lived Read Cache ──
// Item #3: Prevent duplicate API calls
// Item #12: Set timeouts for external / internal API calls
const inFlightGetRequests = new Map();
const apiReadCache = new Map();
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

// Helper to clear read cache on mutations
export const invalidateApiCache = (prefix = '') => {
  if (!prefix) {
    apiReadCache.clear();
  } else {
    for (const key of apiReadCache.keys()) {
      if (key.includes(prefix)) {
        apiReadCache.delete(key);
      }
    }
  }
};

// Generic fetch wrapper with timeout, deduplication & error handling
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;
  const isGet = method === 'GET';

  // Invalidate read cache on write operations
  if (!isGet) {
    invalidateApiCache();
  }

  // Check TTL cache for GET requests if caching enabled
  const cacheTtlMs = options.cacheTtlMs || (endpoint.startsWith('/public/kosts') ? 15000 : 0);
  if (isGet && cacheTtlMs > 0) {
    const cached = apiReadCache.get(url);
    if (cached && (Date.now() - cached.timestamp < cacheTtlMs)) {
      return cached.data;
    }
  }

  // Item #3: Prevent duplicate API calls - Deduplicate concurrent identical in-flight GET requests
  if (isGet && inFlightGetRequests.has(url)) {
    return inFlightGetRequests.get(url);
  }

  let isDemoSession = false;
  let activeUserId = null;
  let activeUserRole = null;
  try {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/demo') || window.location.search.includes('demo=true')) {
        isDemoSession = true;
      } else {
        const stored = localStorage.getItem('kostUser');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.id) activeUserId = String(u.id);
          if (u?.role) activeUserRole = String(u.role);
          if (u?.isDemo || u?.email?.endsWith('@kostku.id')) {
            isDemoSession = true;
          }
        }
      }
    }
  } catch (_) {}

  const headers = {
    'Content-Type': 'application/json',
    ...(activeUserId ? { 'x-user-id': activeUserId } : {}),
    ...(activeUserRole ? { 'x-user-role': activeUserRole } : {}),
    ...(isDemoSession ? { 'x-demo-mode': 'true' } : {}),
    ...(options.headers || {})
  };

  // Item #12: Request Timeout Controller
  const timeoutMs = options.timeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timeout (${timeoutMs}ms) exceeded`));
  }, timeoutMs);

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal
      });
      clearTimeout(timeoutId);

      // Handle non-JSON or error status
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP Error ${response.status}`);
      }

      // Store in memory cache if eligible
      if (isGet && cacheTtlMs > 0) {
        apiReadCache.set(url, { timestamp: Date.now(), data });
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`[API Error ${endpoint}]:`, err);
      throw err;
    } finally {
      if (isGet) {
        inFlightGetRequests.delete(url);
      }
    }
  })();

  if (isGet) {
    inFlightGetRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}

// ── Auth Endpoints ──────────────────────────────────────────
export const apiLogin = (loginId, password, extra = {}) => {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password, ...extra })
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

export const apiSendOtp = (payload) => {
  return request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const apiVerifyOtp = (payload) => {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const apiRecoverAccount = (data) => {
  return request('/recover-account', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiUpdateProfile = (profileData) => {
  return request('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
};

export const apiGetUserProfile = (userId) => request(`/users/${userId}`);

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

// ── Staff Attendance (GPS & Photo) ─────────────────────────
export const apiGetStaffAttendance = (params = {}) => {
  const q = new URLSearchParams();
  if (params.staffId) q.append('staffId', params.staffId);
  if (params.kostUid) q.append('kostUid', params.kostUid);
  if (params.ownerId) q.append('ownerId', params.ownerId);
  if (params.date) q.append('date', params.date);
  return request(`/staff/attendance?${q.toString()}`);
};

export const apiCheckInStaff = (data) => {
  return request('/staff/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiCheckOutStaff = (data) => {
  return request('/staff/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── Staff Leaves & Leave Settings ──────────────────────────
export const apiGetLeaveSettings = (params = {}) => {
  const q = new URLSearchParams();
  if (params.ownerId) q.append('ownerId', params.ownerId);
  if (params.kostUid) q.append('kostUid', params.kostUid);
  return request(`/owner/staff/leave-settings?${q.toString()}`);
};

export const apiUpdateLeaveSettings = (data) => {
  return request('/owner/staff/leave-settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiGetStaffLeaves = (params = {}) => {
  const q = new URLSearchParams();
  if (params.staffId) q.append('staffId', params.staffId);
  if (params.ownerId) q.append('ownerId', params.ownerId);
  if (params.kostUid) q.append('kostUid', params.kostUid);
  return request(`/staff/leaves?${q.toString()}`);
};

export const apiApplyLeave = (data) => {
  return request('/staff/leaves', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiProcessLeave = (id, data) => {
  return request(`/staff/leaves/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// ── Staff Daily Work Logs & Photo Proof ────────────────────
export const apiGetStaffWorkLogs = (params = {}) => {
  const q = new URLSearchParams();
  if (params.staffId) q.append('staffId', params.staffId);
  if (params.ownerId) q.append('ownerId', params.ownerId);
  if (params.kostUid) q.append('kostUid', params.kostUid);
  if (params.date) q.append('date', params.date);
  return request(`/staff/work-logs?${q.toString()}`);
};

export const apiSubmitWorkLog = (data) => {
  return request('/staff/work-logs', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiDeleteWorkLog = (id) => {
  return request(`/staff/work-logs/${id}`, {
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

export const apiVerifyPayment = (data) => {
  return request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetPaymentStatus = (orderId, options = {}) => {
  const headers = {};
  try {
    const rawGw = localStorage.getItem('kostku_gateway_config');
    if (rawGw) {
      const gw = JSON.parse(rawGw);
      if (gw?.serverKey) headers['x-midtrans-server-key'] = gw.serverKey;
      if (gw?.isSandbox !== undefined) headers['x-midtrans-is-production'] = gw.isSandbox ? 'false' : 'true';
    }
  } catch (e) {}
  return request(`/payments/status/${orderId}`, { headers: { ...headers, ...(options.headers || {}) } });
};

export const apiSimulatePaymentSuccess = (data) => {
  return apiVerifyPayment(data);
};

export const apiGetPaymentReceipt = (invoiceId) => {
  return request(`/payments/receipt/${invoiceId}`);
};

export const apiSendReceiptEmail = (invoiceId, email) => {
  return request('/payments/send-receipt-email', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, email })
  });
};

// ── Real Dynamic QRIS (Midtrans Core API & ASPI EMVCo) ─────
export const apiChargeQris = (data) => {
  const headers = {};
  try {
    const rawGw = localStorage.getItem('kostku_gateway_config');
    if (rawGw) {
      const gw = JSON.parse(rawGw);
      if (gw?.serverKey) headers['x-midtrans-server-key'] = gw.serverKey;
      if (gw?.isSandbox !== undefined) headers['x-midtrans-is-production'] = gw.isSandbox ? 'false' : 'true';
    }
  } catch (e) {}
  return request('/payments/qris/charge', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
};

export const apiCheckQrisStatus = (orderId, options = {}) => {
  const headers = {};
  try {
    const rawGw = localStorage.getItem('kostku_gateway_config');
    if (rawGw) {
      const gw = JSON.parse(rawGw);
      if (gw?.serverKey) headers['x-midtrans-server-key'] = gw.serverKey;
      if (gw?.isSandbox !== undefined) headers['x-midtrans-is-production'] = gw.isSandbox ? 'false' : 'true';
    }
  } catch (e) {}
  return request(`/payments/qris/status/${orderId}`, { headers: { ...headers, ...(options.headers || {}) } });
};

export const apiSimulateQrisScan = (data) => {
  return request('/payments/qris/simulate-scan', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetGatewayConfig = () => {
  return request('/payments/gateway-config');
};

export const apiSaveGatewayConfig = (config) => {
  return request('/payments/gateway-config', {
    method: 'POST',
    body: JSON.stringify(config)
  });
};

// ── Unified Wallet (Blueprint: Single-Node Settlement) ─────
export const apiGetWallet = () => {
  return request('/wallet');
};

export const apiMutateWallet = (data) => {
  return request('/wallet/mutate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiSettleMitraWallet = (amount) => {
  return request('/wallet/settle-mitra', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
};

export const apiResetWallet = () => {
  return request('/wallet/reset', {
    method: 'POST'
  });
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

// ── Token Listrik PLN (TriPay PPOB & Payment Gateway) ──────────
export const apiInquiryPln = (meterNumber) => {
  return request('/electricity/inquiry', {
    method: 'POST',
    body: JSON.stringify({ meterNumber })
  });
};

export const apiCreateElectricityOrder = (data) => {
  return request('/electricity/order', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetElectricityHistory = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/electricity/history${query ? `?${query}` : ''}`);
};

export const apiTopUpElectricity = (data) => {
  return request('/electricity/top-up', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── Tagihan Air PDAM (TriPay PPOB & Payment Gateway) ──────────
export const apiGetPdamOperators = () => {
  return request('/pdam/operators');
};

export const apiInquiryPdam = (data) => {
  return request('/pdam/inquiry', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiCreatePdamOrder = (data) => {
  return request('/pdam/order', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetPdamHistory = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/pdam/history${query ? `?${query}` : ''}`);
};

export const apiPayPdamDirect = (data) => {
  return request('/pdam/pay-direct', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── Rating & Ulasan Kost ──────────────────────────────────
export const apiGetKostReviews = (kostUid) => {
  return request(`/kosts/${encodeURIComponent(kostUid)}/reviews`);
};

export const apiSubmitKostReview = (kostUid, data) => {
  return request(`/kosts/${encodeURIComponent(kostUid)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiLikeReview = (reviewId) => {
  return request(`/reviews/${encodeURIComponent(reviewId)}/like`, {
    method: 'POST'
  });
};

// ── Promoted Listing (Sundul Kost) & Pro Quota ─────────────
export const apiPromoteKost = (data) => {
  return request('/kosts/promote', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── In-App Direct Chat (Eliminates Fake WA Spam) ─────────────
export const apiGetMessages = (kostUid = null, userId = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  if (userId) params.append('userId', userId);
  return request(`/messages?${params.toString()}`);
};

export const apiSendMessage = (data) => {
  return request('/messages', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiMarkMessagesRead = (kostUid, userId) => {
  return request('/messages/mark-read', {
    method: 'PUT',
    body: JSON.stringify({ kostUid, userId })
  });
};

// ── In-App Partner Service Orders & Merchant Ecosystem ────
export const apiGetPartnerOrders = (kostUid = null, userId = null, merchantId = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  if (userId) params.append('userId', userId);
  if (merchantId) params.append('merchantId', merchantId);
  return request(`/partner-orders?${params.toString()}`);
};

export const apiUpdatePartnerOrderStatus = (id, data) => {
  return request(`/partner-orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiCreatePartnerOrder = (data) => {
  return request('/partner-orders', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetMerchants = (kostUid = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  return request(`/merchants?${params.toString()}`);
};

export const apiCreateMerchant = (data) => {
  return request('/merchants', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiUpdateMerchant = (id, data) => {
  return request(`/merchants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiUpdateOwnerMerchantSettings = (data) => {
  return request('/merchants/owner-settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiDeleteMerchant = (id) => {
  return request(`/merchants/${id}`, {
    method: 'DELETE'
  });
};

export const apiGetMerchantSummary = (kostUid = null) => {
  const params = new URLSearchParams();
  if (kostUid) params.append('kostUid', kostUid);
  return request(`/merchants/summary?${params.toString()}`);
};

// ── Flip Business Payout & Disbursement API ──────────────────
export const apiGetFlipConfig = () => request('/payout/flip/config');

export const apiFlipInquiry = (data) => {
  return request('/payout/flip/inquiry', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiFlipDisburse = (data) => {
  return request('/payout/flip/disburse', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── PAKET 1: BUKU MUTASI DIGITAL (SHIFT HANDOVER LOGBOOK) ───────────────────
export const apiGetStaffMutations = (params = {}) => {
  const q = new URLSearchParams();
  if (params.kostUid) q.append('kostUid', params.kostUid);
  if (params.ownerId) q.append('ownerId', params.ownerId);
  if (params.staffId) q.append('staffId', params.staffId);
  if (params.date) q.append('date', params.date);
  return request(`/staff/mutations?${q.toString()}`);
};

export const apiCreateStaffMutation = (data) => {
  return request('/staff/mutations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiHandoverStaffMutation = (id, data) => {
  return request(`/staff/mutations/${id}/handover`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// ── PAKET 1: KASBON & CLOSED-LOOP PAYROLL ENGINE ────────────────────────────
export const apiGetStaffKasbon = (params = {}) => {
  const q = new URLSearchParams();
  if (params.staffId) q.append('staffId', params.staffId);
  if (params.ownerId) q.append('ownerId', params.ownerId);
  if (params.kostUid) q.append('kostUid', params.kostUid);
  return request(`/staff/kasbon?${q.toString()}`);
};

export const apiCreateStaffKasbon = (data) => {
  return request('/staff/kasbon', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiUpdateStaffKasbon = (id, data) => {
  return request(`/staff/kasbon/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiDeleteStaffKasbon = (id) => {
  return request(`/staff/kasbon/${id}`, {
    method: 'DELETE'
  });
};

export const apiCalculateStaffPayroll = (staffId, month) => {
  const q = new URLSearchParams({ staffId });
  if (month) q.append('month', month);
  return request(`/staff/payroll/calculate?${q.toString()}`);
};

export const apiGenerateStaffPayroll = (data) => {
  return request('/staff/payroll/generate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetStaffPayrolls = (params = {}) => {
  const q = new URLSearchParams();
  if (params.staffId) q.append('staffId', params.staffId);
  if (params.ownerId) q.append('ownerId', params.ownerId);
  return request(`/staff/payrolls?${q.toString()}`);
};

// ── PAKET 2: DISPOSISI KOMPLAIN KE KALENDER STAF & RESOLVE DENGAN FOTO ───────
export const apiAssignComplaintToStaff = (id, data) => {
  return request(`/complaints/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiResolveComplaintWithProof = (id, data) => {
  return request(`/complaints/${id}/resolve`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiGetStaffTasks = (params = {}) => {
  const q = new URLSearchParams();
  if (params.staffId) q.append('staffId', params.staffId);
  if (params.kostUid) q.append('kostUid', params.kostUid);
  if (params.status) q.append('status', params.status);
  return request(`/staff/tasks?${q.toString()}`);
};

// ── PAKET 2: RATING, ULASAN & TIPS SUKARELA STAF ─────────────────────────────
export const apiSubmitComplaintRating = (id, data) => {
  return request(`/complaints/${id}/rating`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetStaffRatings = (staffId) => {
  return request(`/staff/${staffId}/ratings`);
};

// ── PAKET 3: FINTECH DUNNING, DENDA DINAMIS, SPLIT PAYMENT, BANK RECONCILE ──
export const apiGetDunningSettings = () => {
  return request('/fintech/dunning/settings');
};

export const apiUpdateDunningSettings = (data) => {
  return request('/fintech/dunning/settings', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiSendDunningReminder = (data) => {
  return request('/fintech/dunning/send-reminder', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetDunningLogs = (kostUid = null) => {
  const q = new URLSearchParams();
  if (kostUid) q.append('kostUid', kostUid);
  return request(`/fintech/dunning/logs?${q.toString()}`);
};

export const apiSplitInvoiceTerms = (invoiceId, data) => {
  return request(`/invoices/${invoiceId}/split-terms`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiPayInvoiceTerm = (invoiceId, data) => {
  return request(`/invoices/${invoiceId}/pay-term`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiGetBankMutations = () => {
  return request('/fintech/mutations');
};

export const apiSimulateBankMutation = (data) => {
  return request('/fintech/mutations/simulate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiReconcileBankMutation = (mutationId, data) => {
  return request(`/fintech/mutations/${mutationId}/reconcile`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// ── PAKET 5: MADING DIGITAL, BUKU TAMU, PRELOVED MARKETPLACE, SMART LOCK & BEBAN ELEKTRONIK ──
export const apiGetBulletinPosts = (kostUid = null) => {
  const q = new URLSearchParams();
  if (kostUid) q.append('kostUid', kostUid);
  return request(`/community/bulletin?${q.toString()}`);
};

export const apiCreateBulletinPost = (data) => {
  return request('/community/bulletin', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiDeleteBulletinPost = (id) => {
  return request(`/community/bulletin/${id}`, {
    method: 'DELETE'
  });
};

export const apiGetGuestLogs = (params = {}) => {
  const q = new URLSearchParams();
  if (params.kostUid) q.append('kostUid', params.kostUid);
  if (params.status) q.append('status', params.status);
  return request(`/community/guests?${q.toString()}`);
};

export const apiCreateGuestLog = (data) => {
  return request('/community/guests', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiCheckoutGuestLog = (id) => {
  return request(`/community/guests/${id}/checkout`, {
    method: 'PUT'
  });
};

export const apiGetPrelovedItems = (params = {}) => {
  const q = new URLSearchParams();
  if (params.kostUid) q.append('kostUid', params.kostUid);
  if (params.category) q.append('category', params.category);
  if (params.status) q.append('status', params.status);
  return request(`/community/preloved?${q.toString()}`);
};

export const apiCreatePrelovedItem = (data) => {
  return request('/community/preloved', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiUpdatePrelovedStatus = (id, data) => {
  return request(`/community/preloved/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const apiDeletePrelovedItem = (id) => {
  return request(`/community/preloved/${id}`, {
    method: 'DELETE'
  });
};

export const apiGetSmartLock = (roomId) => {
  return request(`/iot/smartlock/${roomId}`);
};

export const apiGenerateSmartLockPin = (data) => {
  return request('/iot/smartlock/generate-pin', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const apiGetAppliances = (params = {}) => {
  const q = new URLSearchParams();
  if (params.kostUid) q.append('kostUid', params.kostUid);
  if (params.roomNumber) q.append('roomNumber', params.roomNumber);
  return request(`/iot/appliances?${q.toString()}`);
};

export const apiDeclareRoomAppliances = (data) => {
  return request('/iot/appliances/declare-room', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

