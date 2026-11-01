/**
 * KostKu Unified Wallet (Single-Node Settlement) Test Suite
 * Validates:
 * 1. Initial State & Baseline Reset
 * 2. QRIS Digital Revenue Sharing (Owner Markup + Mitra Escrow)
 * 3. Cash on Delivery (COD) Platform Fee Deductions
 * 4. Overdraft Boundary Enforcement (Strict -15.000 limit)
 * 5. Overdraft Recovery via QRIS Inflow
 * 6. Mitra Escrow Settlement & Disbursal (Partial, Full, Over-settle clamp)
 * 7. Flip 1-Door Payout Integration
 * 8. High-Concurrency Stress Testing (50 Parallel Requests)
 */

const http = require('http');
const path = require('path');

process.env.PORT = '3098';
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
        port: 3098,
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

async function runWalletTests() {
  console.log('\n===============================================================');
  console.log('   KOSTKU UNIFIED WALLET (SINGLE-NODE SETTLEMENT) TEST RUNNER  ');
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

  // Start express server on port 3098
  await new Promise((resolve) => {
    const app = require(serverFile);
    serverInstance = app.listen(3098, '127.0.0.1', () => {
      resolve();
    });
  });

  // -----------------------------------------------------------------
  // SUITE 1: RESET & BASELINE INITIALIZATION
  // -----------------------------------------------------------------
  console.log('--- SUITE 1: RESET & BASELINE INITIALIZATION ---');

  const resetRes = await makeRequest('POST', '/api/wallet/reset');
  assert(resetRes.status === 200, 'Wallet reset responds with HTTP 200');
  assert(resetRes.body?.success === true, 'Wallet reset returns success: true');
  
  const getRes = await makeRequest('GET', '/api/wallet');
  assert(getRes.status === 200, 'GET /api/wallet responds with HTTP 200');
  const w0 = getRes.body;
  assert(w0.owner_commission_balance === 25000, 'Baseline owner commission balance is Rp 25.000');
  assert(w0.mitra_escrow_balance === 0, 'Baseline mitra escrow balance is Rp 0');
  assert(w0.overdraft_limit === -15000, 'Overdraft limit is locked at Rp -15.000');
  assert(w0.total_commission_earned === 25000, 'Total commission earned is initialized to Rp 25.000');
  assert(w0.total_mitra_settled === 0, 'Total mitra settled starts at Rp 0');
  assert(Array.isArray(w0.history) && w0.history.length >= 1, 'History ledger is initialized with reset audit record');

  // -----------------------------------------------------------------
  // SUITE 2: QRIS REVENUE SPLIT (MARKUP TO OWNER, SUBTOTAL TO MITRA)
  // -----------------------------------------------------------------
  console.log('\n--- SUITE 2: QRIS REVENUE SPLIT MUTATION ---');

  // Mutation 1: Depot Galon order (Subtotal 16.000, Markup 2.000)
  const qris1 = await makeRequest('POST', '/api/wallet/mutate', {
    method: 'qris',
    subtotalAmt: 16000,
    markupAmt: 2000,
    note: 'Order #1: Galon Aqua - Kamar 101'
  });
  assert(qris1.status === 200, 'QRIS Mutation #1 responds with HTTP 200');
  const w1 = qris1.body.wallet;
  assert(w1.owner_commission_balance === 27000, 'Owner commission increased by markup +2.000 -> Rp 27.000');
  assert(w1.mitra_escrow_balance === 16000, 'Mitra escrow increased by subtotal +16.000 -> Rp 16.000');
  assert(w1.total_commission_earned === 27000, 'Cumulative commission earned updated to Rp 27.000');

  // Mutation 2: Laundry Express order (Subtotal 12.000, Markup 1.500)
  const qris2 = await makeRequest('POST', '/api/wallet/mutate', {
    method: 'qris',
    subtotalAmt: 12000,
    markupAmt: 1500,
    note: 'Order #2: Laundry Kilat - Kamar 203'
  });
  assert(qris2.status === 200, 'QRIS Mutation #2 responds with HTTP 200');
  const w2 = qris2.body.wallet;
  assert(w2.owner_commission_balance === 28500, 'Owner commission increased by markup +1.500 -> Rp 28.500');
  assert(w2.mitra_escrow_balance === 28000, 'Mitra escrow increased by subtotal +12.000 -> Rp 28.000');
  assert(w2.history[0].note === 'Order #2: Laundry Kilat - Kamar 203', 'History correctly records custom order note');
  assert(w2.history[0].resultingBalance === 28500, 'History logs correct resulting balance (Rp 28.500)');

  // -----------------------------------------------------------------
  // SUITE 3: CASH ON DELIVERY (COD) PLATFORM FEE DEDUCTION
  // -----------------------------------------------------------------
  console.log('\n--- SUITE 3: CASH ON DELIVERY (COD) DEDUCTION ---');

  const cod1 = await makeRequest('POST', '/api/wallet/mutate', {
    method: 'cod',
    subtotalAmt: 25000,
    markupAmt: 0,
    note: 'Order #3: Nasi Goreng COD - Kamar 105'
  });
  assert(cod1.status === 200, 'COD Mutation responds with HTTP 200');
  const w3 = cod1.body.wallet;
  assert(w3.owner_commission_balance === 28000, 'Owner commission deducted by Rp 500 (platform fee) -> Rp 28.000');
  assert(w3.mitra_escrow_balance === 28000, 'Mitra escrow remains untouched on COD transactions (Rp 28.000)');

  // -----------------------------------------------------------------
  // SUITE 4: OVERDRAFT LIMIT & BOUNDARY ENFORCEMENT (-15.000)
  // -----------------------------------------------------------------
  console.log('\n--- SUITE 4: OVERDRAFT LIMIT & BOUNDARY ENFORCEMENT ---');

  // Currently at 28.000. Target is -15.000.
  // Difference = 28.000 - (-15.000) = 43.000.
  // Steps of 500 = 86 mutations.
  console.log('  Executing 86 sequential COD platform fee deductions to reach boundary...');
  for (let i = 0; i < 86; i++) {
    const r = await makeRequest('POST', '/api/wallet/mutate', { method: 'cod' });
    if (r.status !== 200) {
      console.error(`Unexpected failure at step ${i}:`, r.body);
      break;
    }
  }

  const wAtLimit = (await makeRequest('GET', '/api/wallet')).body;
  assert(wAtLimit.owner_commission_balance === -15000, 'Wallet reaches exact overdraft boundary (Rp -15.000)');

  // Attempt the 87th COD mutation (which would breach -15.000 to -15.500)
  const breachAttempt = await makeRequest('POST', '/api/wallet/mutate', {
    method: 'cod',
    note: 'Illegal breach transaction'
  });
  assert(breachAttempt.status === 400, 'Breach attempt is strictly rejected with HTTP 400');
  assert(
    typeof breachAttempt.body?.error === 'string' && breachAttempt.body.error.includes('-15.000'),
    'Error message explicitly warns user about overdraft limit Rp -15.000'
  );

  const wAfterBreach = (await makeRequest('GET', '/api/wallet')).body;
  assert(wAfterBreach.owner_commission_balance === -15000, 'Owner commission stays locked at -15.000 and did NOT drop to -15.500');
  assert(wAfterBreach.history[0].note !== 'Illegal breach transaction', 'Rejected transaction did not pollute history ledger');

  // -----------------------------------------------------------------
  // SUITE 5: RECOVERY FROM OVERDRAFT VIA QRIS INFLOW
  // -----------------------------------------------------------------
  console.log('\n--- SUITE 5: RECOVERY FROM OVERDRAFT VIA QRIS INFLOW ---');

  const recoveryInflow = await makeRequest('POST', '/api/wallet/mutate', {
    method: 'qris',
    subtotalAmt: 20000,
    markupAmt: 5000,
    note: 'Inflow #1: Pemulihan Kuota Overdraft (Markup Rp 5.000)'
  });
  assert(recoveryInflow.status === 200, 'Recovery QRIS inflow succeeds with HTTP 200');
  const wRecovered = recoveryInflow.body.wallet;
  assert(wRecovered.owner_commission_balance === -10000, 'Balance recovered from -15.000 to -10.000 (-15.000 + 5.000)');

  // Now COD should be unblocked again
  const codAfterRecovery = await makeRequest('POST', '/api/wallet/mutate', {
    method: 'cod',
    note: 'COD transaction unblocked after recovery'
  });
  assert(codAfterRecovery.status === 200, 'COD transaction allowed again after recovery from overdraft limit');
  assert(codAfterRecovery.body.wallet.owner_commission_balance === -10500, 'Balance decremented to -10.500');

  // -----------------------------------------------------------------
  // SUITE 6: MITRA ESCROW SETTLEMENT & CLEARING
  // -----------------------------------------------------------------
  console.log('\n--- SUITE 6: MITRA ESCROW SETTLEMENT & CLEARING ---');

  // Current escrow balance should be 28.000 (from Suite 2) + 20.000 (from Suite 5) = 48.000
  const currentEscrow = (await makeRequest('GET', '/api/wallet')).body.mitra_escrow_balance;
  assert(currentEscrow === 48000, `Current mitra escrow balance verified at Rp 48.000 (actual: ${currentEscrow})`);

  // Partial settlement: Disburse Rp 20.000 to Warung Bu Siti
  const partialSettle = await makeRequest('POST', '/api/wallet/settle-mitra', {
    amount: 20000
  });
  assert(partialSettle.status === 200, 'Partial mitra settlement responds with HTTP 200');
  const wSettle1 = partialSettle.body.wallet;
  assert(wSettle1.mitra_escrow_balance === 28000, 'Mitra escrow reduced by 20.000 -> Rp 28.000');
  assert(wSettle1.total_mitra_settled === 20000, 'Total mitra settled increased to Rp 20.000');
  assert(wSettle1.history[0].type === 'mitra_settlement', 'History logs entry with type mitra_settlement');

  // Full settlement: Disburse all remaining without passing amount (auto-settles full balance)
  const fullSettle = await makeRequest('POST', '/api/wallet/settle-mitra', {});
  assert(fullSettle.status === 200, 'Full mitra settlement responds with HTTP 200');
  const wSettle2 = fullSettle.body.wallet;
  assert(wSettle2.mitra_escrow_balance === 0, 'Mitra escrow completely cleared to Rp 0');
  assert(wSettle2.total_mitra_settled === 48000, 'Total mitra settled cumulative updated to Rp 48.000');

  // Clamp test: Disburse Rp 50.000 when escrow is already 0
  const overSettle = await makeRequest('POST', '/api/wallet/settle-mitra', { amount: 50000 });
  assert(overSettle.status === 200, 'Over-settlement request handled gracefully');
  assert(overSettle.body.wallet.mitra_escrow_balance === 0, 'Mitra escrow never becomes negative (clamped at 0)');

  // -----------------------------------------------------------------
  // SUITE 7: FLIP 1-DOOR PAYOUT INTEGRATION
  // -----------------------------------------------------------------
  console.log('\n--- SUITE 7: FLIP 1-DOOR PAYOUT INTEGRATION ---');

  // Reset wallet and credit owner commission to Rp 150.000
  await makeRequest('POST', '/api/wallet/reset');
  await makeRequest('POST', '/api/wallet/mutate', {
    method: 'qris',
    subtotalAmt: 0,
    markupAmt: 125000,
    note: 'Top up komisi owner'
  });

  const wBeforeFlip = (await makeRequest('GET', '/api/wallet')).body;
  assert(wBeforeFlip.owner_commission_balance === 150000, 'Owner balance ready for payout at Rp 150.000');

  // Execute Flip Disbursal
  const flipRes = await makeRequest('POST', '/api/payout/flip/disburse', {
    bank_code: 'BCA',
    account_number: '8830192831',
    account_holder: 'HJ. NURHASANAH',
    amount: 150000,
    remark: 'Penarikan Komisi Unified Wallet KostKu'
  });
  assert(flipRes.status === 200, 'Flip disburse endpoint responds with HTTP 200');
  assert(flipRes.body?.status === 'DONE', 'Flip disburse returns status DONE (Sandbox simulated disbursement)');

  const wAfterFlip = (await makeRequest('GET', '/api/wallet')).body;
  assert(wAfterFlip.owner_commission_balance === 0, 'Owner commission balance successfully disbursed and reset to Rp 0');
  assert(wAfterFlip.history[0].method === 'payout_flip', 'Wallet history logs payout_flip entry');
  assert(wAfterFlip.history[0].resultingBalance === 0, 'Wallet history logs resulting balance 0 after payout');

  // -----------------------------------------------------------------
  // SUITE 8: HIGH-CONCURRENCY STRESS TESTING
  // -----------------------------------------------------------------
  console.log('\n--- SUITE 8: HIGH-CONCURRENCY STRESS TESTING (50 PARALLEL MUTATIONS) ---');

  // Reset wallet
  await makeRequest('POST', '/api/wallet/reset');
  const initialBalance = 25000;
  
  // Fire 50 concurrent requests:
  // 30 QRIS (each adds +1000 markup and +5000 subtotal)
  // 20 COD (each deducts -500 platform fee)
  // Expected net owner commission: 25.000 + (30 * 1.000) - (20 * 500) = 25.000 + 30.000 - 10.000 = 45.000
  // Expected mitra escrow: 30 * 5.000 = 150.000
  
  console.log('  Firing 30 parallel QRIS + 20 parallel COD mutations concurrently...');
  const promises = [];
  const startStress = Date.now();

  for (let i = 0; i < 30; i++) {
    promises.push(makeRequest('POST', '/api/wallet/mutate', {
      method: 'qris',
      subtotalAmt: 5000,
      markupAmt: 1000,
      note: `Concurrent QRIS #${i}`
    }));
  }

  for (let i = 0; i < 20; i++) {
    promises.push(makeRequest('POST', '/api/wallet/mutate', {
      method: 'cod',
      note: `Concurrent COD #${i}`
    }));
  }

  const results = await Promise.all(promises);
  const stressTime = Date.now() - startStress;

  const all200 = results.every(r => r.status === 200);
  assert(all200, `All 50 parallel requests completed with HTTP 200 in ${stressTime}ms`);

  const wStress = (await makeRequest('GET', '/api/wallet')).body;
  console.log('  Final Wallet State after stress:');
  console.log(`    owner_commission_balance: Rp ${wStress.owner_commission_balance.toLocaleString('id-ID')}`);
  console.log(`    mitra_escrow_balance: Rp ${wStress.mitra_escrow_balance.toLocaleString('id-ID')}`);
  console.log(`    total_commission_earned: Rp ${wStress.total_commission_earned.toLocaleString('id-ID')}`);
  console.log(`    total_mitra_settled: Rp ${wStress.total_mitra_settled.toLocaleString('id-ID')}`);

  assert(
    wStress.owner_commission_balance === 45000,
    `Exact Mathematical Audit: Owner balance is exactly Rp 45.000 (actual: ${wStress.owner_commission_balance})`
  );
  assert(
    wStress.mitra_escrow_balance === 150000,
    `Exact Mathematical Audit: Mitra escrow is exactly Rp 150.000 (actual: ${wStress.mitra_escrow_balance})`
  );
  assert(wStress.history.length <= 50, `Ledger length cap: History bounded at maximum ${wStress.history.length} items (capped at 50)`);

  // Final Test Report
  console.log('\n===============================================================');
  console.log(`   TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (serverInstance) serverInstance.close();
  process.exit(failed > 0 ? 1 : 0);
}

runWalletTests().catch(err => {
  console.error('Fatal test error:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
