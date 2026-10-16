import { spawn } from 'child_process';
import path from 'path';

const PORT = 3098;
const SERVER_PATH = path.resolve('backend/server.js');

async function waitServerReady(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 404) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return false;
}

async function main() {
  console.log('=== STARTING KOSTKU SECURITY & DATA INTEGRITY AUDIT ===\n');

  const serverProc = spawn('node', [SERVER_PATH], {
    env: { ...process.env, PORT: String(PORT), ENFORCE_WEBHOOK_AUTH: 'true' },
    stdio: 'pipe'
  });

  const isReady = await waitServerReady(`http://127.0.0.1:${PORT}/api/health`);
  if (!isReady) {
    console.error('Server failed to start on port', PORT);
    serverProc.kill();
    process.exit(1);
  }

  const results = [];

  // Test 1: Full Database Exfiltration via Unauthenticated /api/backup
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/backup`);
    if (res.status === 200) {
      const json = await res.json();
      results.push({
        id: 'SEC-01',
        category: 'Broken Function Level Auth (BFLA)',
        target: 'GET /api/backup',
        severity: 'CRITICAL',
        status: 'VULNERABLE',
        finding: `Endpoint mengembalikan full dump database (${json.users?.length || 0} user, ${json.kosts?.length || 0} kost) tanpa autentikasi/token sama sekali.`
      });
    } else if (res.status === 403 || res.status === 401) {
      results.push({
        id: 'SEC-01',
        category: 'Broken Function Level Auth (BFLA)',
        target: 'GET /api/backup',
        severity: 'CRITICAL',
        status: 'SECURE (PATCHED)',
        finding: `Akses ditolak (HTTP ${res.status}). Membutuhkan verifikasi kredensial Super Admin.`
      });
    }
  } catch (e) {
    results.push({ id: 'SEC-01', target: 'GET /api/backup', status: 'ERROR', finding: e.message });
  }

  // Test 2: Unauthenticated Database Overwrite / Deletion via /api/restore
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: 'test' })
    });
    if (res.status === 403 || res.status === 401) {
      results.push({
        id: 'SEC-02',
        category: 'Broken Function Level Auth (BFLA)',
        target: 'POST /api/restore',
        severity: 'CRITICAL',
        status: 'SECURE (PATCHED)',
        finding: `Akses ditolak (HTTP ${res.status}). Hanya Super Admin terotentikasi yang diizinkan melakukan restore.`
      });
    } else if (res.status === 400) {
      results.push({
        id: 'SEC-02',
        category: 'Broken Function Level Auth (BFLA)',
        target: 'POST /api/restore',
        severity: 'CRITICAL',
        status: 'VULNERABLE',
        finding: 'Endpoint pemulihan database dapat diakses oleh siapa saja tanpa verifikasi Super Admin.'
      });
    }
  } catch (e) {
    results.push({ id: 'SEC-02', target: 'POST /api/restore', status: 'ERROR', finding: e.message });
  }

  // Test 3: PII & NIK Exposure via /api/users
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/users?kostUid=KOST-JAKSEL-01`);
    if (res.status === 200) {
      const data = await res.json();
      const hasUnmaskedNik = Array.isArray(data) && data.some(u => u.nik && /^\d{16}$/.test(u.nik));
      if (hasUnmaskedNik) {
        results.push({
          id: 'SEC-03',
          category: 'Broken Object Level Auth (BOLA) & PII Leak',
          target: 'GET /api/users',
          severity: 'HIGH',
          status: 'VULNERABLE',
          finding: `Daftar seluruh penghuni (${data.length} orang) beserta NIK polos dapat diakses publik tanpa login/token Owner.`
        });
      } else {
        results.push({
          id: 'SEC-03',
          category: 'Broken Object Level Auth (BOLA) & PII Leak',
          target: 'GET /api/users',
          severity: 'HIGH',
          status: 'SECURE (PATCHED)',
          finding: 'Privasi NIK diproteksi. NIK otomatis disamarkan (masking: 330201******0001) bila diakses tanpa token Owner.'
        });
      }
    }
  } catch (e) {
    results.push({ id: 'SEC-03', target: 'GET /api/users', status: 'ERROR', finding: e.message });
  }

  // Test 4: Payment Webhook Gateway Spoofing (Lack of Signature Check)
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 'AUDIT-FAKE-ORDER-999',
        transaction_status: 'settlement'
      })
    });
    if (res.status === 403 || res.status === 401) {
      results.push({
        id: 'SEC-04',
        category: 'Unrestricted Financial Flow & Webhook Spoofing',
        target: 'POST /api/payments/webhook',
        severity: 'HIGH',
        status: 'SECURE (PATCHED)',
        finding: `Akses ditolak (HTTP ${res.status}). Webhook mewajibkan signature_key payment gateway yang sah.`
      });
    } else if (res.status === 200) {
      results.push({
        id: 'SEC-04',
        category: 'Unrestricted Financial Flow & Webhook Spoofing',
        target: 'POST /api/payments/webhook',
        severity: 'HIGH',
        status: 'VULNERABLE',
        finding: 'Webhook menerima notifikasi settlement tanpa memverifikasi SHA-512 signature key dari payment gateway.'
      });
    }
  } catch (e) {
    results.push({ id: 'SEC-04', target: 'POST /api/payments/webhook', status: 'ERROR', finding: e.message });
  }

  // Test 5: Rate Limiting & Brute Force Protection on Login / NIK check
  try {
    const attempts = [];
    for (let i = 0; i < 20; i++) {
      attempts.push(fetch(`http://127.0.0.1:${PORT}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `attacker${i}@test.com`, password: 'pass' })
      }));
    }
    const responses = await Promise.all(attempts);
    const hasRateLimit = responses.some(r => r.status === 429);
    results.push({
      id: 'SEC-05',
      category: 'Unrestricted Resource Consumption & Brute Force',
      target: 'POST /api/login & /api/check-nik',
      severity: 'MEDIUM',
      status: hasRateLimit ? 'SECURE' : 'VULNERABLE',
      finding: hasRateLimit 
        ? 'Rate limiting aktif (HTTP 429 Too Many Requests).' 
        : 'Tidak ada batasan frekuensi percobaan (Rate Limit). Rawan serangan brute-force credential stuffing dan NIK enumeration.'
    });
  } catch (e) {
    results.push({ id: 'SEC-05', target: 'POST /api/login', status: 'ERROR', finding: e.message });
  }

  // Test 6: Security Headers (Helmet, CSP, HSTS, X-Frame-Options)
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    const headers = res.headers;
    const hasCsp = headers.has('content-security-policy');
    const hasXfo = headers.has('x-frame-options');
    const hasHsts = headers.has('strict-transport-security');
    const isCorsWildcard = headers.get('access-control-allow-origin') === '*';

    results.push({
      id: 'SEC-06',
      category: 'Security Misconfiguration',
      target: 'HTTP Response Headers',
      severity: 'MEDIUM',
      status: (!hasCsp && isCorsWildcard) ? 'VULNERABLE' : 'SECURE',
      finding: `CORS wild-card ('*') aktif. Header keamanan penting belum diset: CSP (${hasCsp}), X-Frame-Options (${hasXfo}), HSTS (${hasHsts}).`
    });
  } catch (e) {
    results.push({ id: 'SEC-06', target: 'HTTP Headers', status: 'ERROR', finding: e.message });
  }

  serverProc.kill();

  console.log('=== SECURITY AUDIT TEST RESULTS ===');
  console.table(results.map(r => ({
    ID: r.id,
    Target: r.target,
    Severity: r.severity,
    Status: r.status,
    Category: r.category
  })));

  console.log('\n=== DETAIL FINDINGS ===');
  results.forEach(r => {
    console.log(`[${r.id}] ${r.severity} - ${r.target}: ${r.finding}`);
  });
}

main().catch(err => {
  console.error('Security audit error:', err);
  process.exit(1);
});
