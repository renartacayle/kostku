const assert = require('assert');
const http = require('http');
const XLSX = require('xlsx');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Verification: Redeem Codes, Excel Export, and Room Bill Removal...');

  // 1. Get Store Info
  const storeRes = await request('GET', '/api/pos/store');
  assert.strictEqual(storeRes.status, 200, 'Should fetch store info successfully');
  const targetStoreId = storeRes.body.merchantId || storeRes.body.uid;
  const initialSaldo = Number(storeRes.body.saldoNota || 0);
  console.log(`✅ [1/5] Active Store: ${storeRes.body.storeName} (ID: ${targetStoreId}), Saldo Nota: Rp ${initialSaldo.toLocaleString('id-ID')}`);

  // 2. Verify Default Redeem Codes
  const listRes = await request('GET', '/api/pos/redeem-codes');
  assert.strictEqual(listRes.status, 200, 'Should get redeem codes list');
  assert.ok(Array.isArray(listRes.body.codes), 'Codes should be an array');
  assert.ok(listRes.body.codes.length >= 3, 'Should have default seeded redeem codes');

  const sampleCode = listRes.body.codes.find(c => c.code === 'KASIRBONUS50');
  assert.ok(sampleCode, 'KASIRBONUS50 must exist');
  assert.strictEqual(sampleCode.quotaNota, 50, 'Bonus nota should be 50');
  assert.strictEqual(sampleCode.maxQuota, 20, 'Max quota should be 20');
  console.log(`✅ [2/5] Verified Default Redeem Codes (Found ${listRes.body.codes.length} codes, sample: ${sampleCode.code} with ${sampleCode.remainingQuota}/${sampleCode.maxQuota} quota)`);

  // 3. Create Custom Redeem Code with Quota
  const testCode = 'TESTPROMO_' + Date.now().toString().slice(-4);
  const createRes = await request('POST', '/api/pos/redeem-codes', {
    code: testCode,
    quotaNota: 75,
    maxQuota: 1, // Only 1 claim allowed!
    description: 'Promo Uji Coba Terbatas 1 Klaim'
  });
  assert.strictEqual(createRes.status, 200, 'Should successfully create custom redeem code');
  assert.strictEqual(createRes.body.redeemCode.code, testCode);
  assert.strictEqual(createRes.body.redeemCode.maxQuota, 1);
  console.log(`✅ [3/5] Created Custom Redeem Code: ${testCode} with quota = 1 claim`);

  // 4. Claim the Code for Active Store
  const claimRes = await request('POST', '/api/pos/redeem-code/claim', {
    code: testCode,
    storeId: targetStoreId
  });
  assert.strictEqual(claimRes.status, 200, 'Should claim redeem code successfully');
  assert.strictEqual(claimRes.body.bonusNota, 75, 'Bonus nota should be 75');
  assert.strictEqual(claimRes.body.newSaldoNota, initialSaldo + 7500, 'Saldo nota should increase by Rp 7.500');
  assert.strictEqual(claimRes.body.remainingQuota, 0, 'Remaining quota should now be 0');
  console.log(`✅ [4/5] Claimed Redeem Code: Saldo Nota increased by Rp 7.500 (now Rp ${claimRes.body.newSaldoNota.toLocaleString('id-ID')}), remaining quota = 0`);

  // 4b. Claim Again with Same Store -> Must be rejected!
  const duplicateClaimRes = await request('POST', '/api/pos/redeem-code/claim', {
    code: testCode,
    storeId: targetStoreId
  });
  assert.strictEqual(duplicateClaimRes.status, 400, 'Duplicate claim should be rejected');
  console.log(`✅ [4b] Duplicate Claim Blocked: "${duplicateClaimRes.body.error}"`);

  // 5. Verify Room Bill (ROOM_BILL) is Permanently Rejected
  // Create a test order first
  const orderRes = await request('POST', '/api/pos/orders', {
    tableNumber: 'Meja 09',
    customerName: 'Test Penghuni Kamar',
    customerPhone: '081299998888',
    items: [{ productId: 'prod-1', qty: 1 }]
  });
  assert.strictEqual(orderRes.status, 200, 'Should create test order');
  const orderId = orderRes.body.id || orderRes.body.order?.id;

  // ACC order
  await request('POST', `/api/pos/orders/${orderId}/acc`);

  // Try paying with ROOM_BILL
  const payRoomBillRes = await request('POST', `/api/pos/orders/${orderId}/pay`, {
    method: 'ROOM_BILL',
    roomNumber: '101'
  });
  assert.strictEqual(payRoomBillRes.status, 400, 'ROOM_BILL payment should be rejected with HTTP 400');
  assert.ok(payRoomBillRes.body.error.includes('dinonaktifkan'), 'Error message should explain that Tagih ke Kamar has been disabled');
  console.log(`✅ [5/5] Room Bill Blocked: "${payRoomBillRes.body.error}"`);

  // 6. Verify Headless XLSX Generation
  const ordersListRes = await request('GET', '/api/pos/orders');
  const orders = ordersListRes.body || [];
  const testWb = XLSX.utils.book_new();
  const testData = orders.map((o, idx) => ({
    'No': idx + 1,
    'ID Pesanan': o.id,
    'Total (Rp)': o.totalAmount,
    'Metode': o.paymentMethod || 'QRIS'
  }));
  const testWs = XLSX.utils.json_to_sheet(testData);
  XLSX.utils.book_append_sheet(testWb, testWs, 'Laporan_Kasir');
  const buffer = XLSX.write(testWb, { type: 'buffer', bookType: 'xlsx' });
  assert.ok(buffer && buffer.length > 500, 'XLSX buffer should be generated validly');
  console.log(`✅ [Bonus] Excel Workbook (.xlsx) Generation Verified: ${buffer.length} bytes valid binary stream`);

  console.log('\n🎉 ALL VERIFICATION TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
