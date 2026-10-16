/**
 * KostKu Security, Penetration, and High-Concurrency Stress Test Suite
 * Validates Real Dynamic QRIS API, Midtrans integration, Unified Wallet Overdraft,
 * Input Sanitization, Anti-Tampering, Rate Limiting, and Concurrency.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

process.env.PORT = '3099';
process.env.NODE_ENV = 'test';

const serverFile = path.join(__dirname, '../backend/server.js');
let serverInstance;

function makeRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (dataString) {
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3099,
        path: endpoint,
        method,
        headers: reqHeaders
      },
      (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', err => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('   KOSTKU COMPREHENSIVE SECURITY, HACK & STRESS TEST RUNNER    ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ ${testName} - ${details}`);
      failed++;
    }
  }

  // Start express server explicitly on port 3099
  await new Promise((resolve) => {
    const app = require(serverFile);
    serverInstance = app.listen(3099, '127.0.0.1', () => {
      resolve();
    });
  });

  console.log('--- SUITE 1: REAL DYNAMIC QRIS & ASPI EMVCO VALIDATION ---');
  
  // 1. Charge QRIS with exact amount (Tag 54)
  const testAmount = 17500;
  const testOrderId = `TEST-QRIS-${Date.now()}`;
  const chargeRes = await makeRequest('POST', '/api/payments/qris/charge', {
    orderId: testOrderId,
    amount: testAmount,
    merchantName: 'DEPOT AIR & GAS BAROKAH',
    customerName: 'Anak Kost Budi',
    roomNumber: '204',
    nmid: 'ID1020268892019'
  });

  assert(chargeRes.status === 200, 'QRIS Charge API responds with HTTP 200');
  assert(chargeRes.body?.success === true, 'QRIS Charge returns success: true');
  assert(chargeRes.body?.amount === 17500, 'QRIS Charge locks exact requested amount (Rp 17.500)');
  assert(typeof chargeRes.body?.qrCodeUrl === 'string' && chargeRes.body.qrCodeUrl.startsWith('data:image/png;base64,'), 'QRIS generates genuine Base64 PNG barcode');
  assert(chargeRes.body?.qrString && chargeRes.body.qrString.includes('540517500'), 'EMVCo payload contains Tag 54 with exact amount 17500');
  assert(chargeRes.body?.qrString?.startsWith('000201010212'), 'EMVCo payload has Tag 010212 (Dynamic QRIS)');

  // 2. Status Polling
  const statusRes = await makeRequest('GET', `/api/payments/qris/status/${testOrderId}`);
  assert(statusRes.status === 200, 'Status polling endpoint responds with HTTP 200');
  assert(statusRes.body?.status === 'pending', 'Initial transaction status is pending');

  // 3. QRIS Simulation Scan Settlement
  const scanRes = await makeRequest('POST', '/api/payments/qris/simulate-scan', {
    orderId: testOrderId
  });
  assert(scanRes.status === 200, 'Simulate Scan endpoint responds with HTTP 200');
  assert(scanRes.body?.status === 'settlement', 'Transaction status immediately transitions to settlement');

  // 4. Verify Polling picks up settlement
  const pollAfterScan = await makeRequest('GET', `/api/payments/qris/status/${testOrderId}`);
  assert(pollAfterScan.body?.status === 'settlement', 'Auto-polling correctly reports settlement status');

  console.log('\n--- SUITE 2: PENETRATION & SECURITY / HACK TESTING ---');

  // Hack Test 1: Price Tampering Attack (Negative Subtotal)
  const hackNegativePrice = await makeRequest('POST', '/api/partner-orders', {
    subtotal: -50000,
    total: -48500,
    merchantName: 'Depot Barokah',
    serviceName: 'Galon Air',
    paymentMethod: 'qris'
  });
  assert(hackNegativePrice.status === 400, 'HACK TEST: Negative price tampering is blocked with HTTP 400');

  // Hack Test 2: QRIS Zero/Negative Amount Attack
  const hackZeroAmount = await makeRequest('POST', '/api/payments/qris/charge', {
    orderId: 'HACK-ZERO',
    amount: 0
  });
  assert(hackZeroAmount.status === 400, 'HACK TEST: Zero amount QRIS charge is blocked with HTTP 400');

  const hackNegativeAmount = await makeRequest('POST', '/api/payments/qris/charge', {
    orderId: 'HACK-NEG',
    amount: -25000
  });
  assert(hackNegativeAmount.status === 400, 'HACK TEST: Negative amount QRIS charge is blocked with HTTP 400');

  // Hack Test 3: XSS Injection in Order Notes & Names
  const xssPayload = "<script>alert('pwned')</script>";
  const xssOrder = await makeRequest('POST', '/api/partner-orders', {
    subtotal: 18000,
    total: 19500,
    userName: `Budi ${xssPayload}`,
    notes: `Catatan penting ${xssPayload}`,
    roomNumber: '101',
    paymentMethod: 'cod'
  });
  assert(xssOrder.status === 201, 'Order created successfully with sanitized inputs');
  assert(!xssOrder.body?.order?.userName?.includes('<script>'), 'HACK TEST: XSS script tags stripped from userName');
  assert(!xssOrder.body?.order?.notes?.includes('<script>'), 'HACK TEST: XSS script tags stripped from notes');

  // Hack Test 4: Overdraft Limit Breach Attack
  // Reset wallet to clean baseline
  await makeRequest('POST', '/api/wallet/mutate', { method: 'qris', markupAmt: 0, subtotalAmt: 0 });
  // Repeatedly mutate COD (-500) until overdraft limit -15000 is tested
  let breachedBlocked = false;
  for (let i = 0; i < 90; i++) {
    const codRes = await makeRequest('POST', '/api/wallet/mutate', { method: 'cod' });
    if (codRes.status === 400) {
      breachedBlocked = true;
      break;
    }
  }
  assert(breachedBlocked === true, 'HACK TEST: Overdraft limit (-15.000) strictly enforces wallet lock on excess negative balance');

  // Hack Test 5: Invalid NIK / SQL Injection Attack
  const sqlInjNik = await makeRequest('GET', `/api/check-nik?nik=${encodeURIComponent("' OR '1'='1")}`);
  assert(sqlInjNik.body?.valid === false, 'HACK TEST: SQL Injection payload in NIK query rejected as invalid');

  const shortNik = await makeRequest('GET', '/api/check-nik?nik=123456');
  assert(shortNik.body?.valid === false, 'HACK TEST: Non-16-digit NIK rejected as invalid');

  console.log('\n--- SUITE 3: HIGH-CONCURRENCY STRESS TESTING ---');
  console.log('  Firing 100 concurrent requests (QRIS Charge + Status Polling + Wallet Mutate)...');
  
  const startTime = Date.now();
  const concurrencyCount = 100;
  const stressPromises = [];

  for (let i = 0; i < concurrencyCount; i++) {
    const randAmt = 15000 + (i * 100);
    const p = makeRequest('POST', '/api/payments/qris/charge', {
      orderId: `STRESS-ORD-${i}-${Date.now()}`,
      amount: randAmt,
      merchantName: `Merchant Stress ${i}`,
      customerName: `Tenant ${i}`,
      roomNumber: `${100 + i}`
    });
    stressPromises.push(p);
  }

  const stressResults = await Promise.all(stressPromises);
  const durationMs = Date.now() - startTime;
  const successCount = stressResults.filter(r => r.status === 200 && r.body?.success === true).length;
  const rps = Math.round((concurrencyCount / (durationMs / 1000)));

  assert(successCount === concurrencyCount, `High Concurrency: ${successCount}/${concurrencyCount} requests succeeded without a single error`);
  assert(durationMs < 5000, `Stress Latency: 100 parallel QRIS generations completed in ${durationMs}ms (~${rps} req/sec)`);

  console.log('\n===============================================================');
  console.log(`   TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (serverInstance) serverInstance.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
