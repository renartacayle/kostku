const assert = require('assert');
const http = require('http');
const app = require('../backend/server');
const fs = require('fs');
const path = require('path');

async function testCashNotaAndMultiStore() {
  console.log('--- 🧪 STARTING CASH NOTA DEDUCTION & MULTI-STORE TEST ---');

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log('Test server active on', baseUrl);

  try {
    // ── PART 1: MULTI-STORE PER OWNER ───────────────────────────────────
    console.log('\n[TEST 1] Registering multiple stores under 1 owner...');
    const ownerUserId = 'USR-OWNER-TEST-' + Date.now();

    // 1A. Create Store 1: Kantin Kost
    const store1Res = await fetch(`${baseUrl}/api/merchants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kantin Berkah Kost',
        category: 'makanan',
        icon: '🍱',
        phone: '081299990001',
        address: 'Lantai 1 Belakang Gazebo',
        deliveryType: 'both',
        deliveryFee: 2000,
        ownerUserId: ownerUserId
      })
    }).then(r => r.json());

    assert(store1Res.success, 'Store 1 should be created successfully');
    assert.strictEqual(store1Res.merchant.ownerUserId, ownerUserId, 'Store 1 ownerUserId must match');
    assert.strictEqual(store1Res.merchant.saldoNota, 5000, 'Store 1 should have 5000 welcome saldo nota');
    assert.strictEqual(store1Res.merchant.kuotaNota, 50, 'Store 1 should have 50 welcome kuota nota');
    const store1Id = store1Res.merchant.id;
    console.log(`✅ Store 1 created: "${store1Res.merchant.name}" (ID: ${store1Id}, Saldo: Rp ${store1Res.merchant.saldoNota})`);

    // 1B. Create Store 2: Laundry Express under THE SAME OWNER
    const store2Res = await fetch(`${baseUrl}/api/merchants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Laundry Kilat 24 Jam',
        category: 'laundry',
        icon: '🧺',
        phone: '081299990001', // Same phone number of owner
        address: 'Ruko Depan Gerbang Kost',
        deliveryType: 'delivery',
        deliveryFee: 3000,
        ownerUserId: ownerUserId
      })
    }).then(r => r.json());

    assert(store2Res.success, 'Store 2 should be created successfully without error');
    assert.strictEqual(store2Res.merchant.ownerUserId, ownerUserId, 'Store 2 ownerUserId must match');
    assert.strictEqual(store2Res.merchant.saldoNota, 5000, 'Store 2 should have 5000 welcome saldo nota');
    const store2Id = store2Res.merchant.id;
    console.log(`✅ Store 2 created: "${store2Res.merchant.name}" (ID: ${store2Id}, Saldo: Rp ${store2Res.merchant.saldoNota})`);

    // 1C. Query stores for this owner
    const ownerStores = await fetch(`${baseUrl}/api/merchants?ownerUserId=${ownerUserId}`).then(r => r.json());
    assert(Array.isArray(ownerStores), 'Should return array of stores');
    assert(ownerStores.length >= 2, 'Owner should have at least 2 stores');
    const foundS1 = ownerStores.find(s => s.id === store1Id);
    const foundS2 = ownerStores.find(s => s.id === store2Id);
    assert(foundS1, 'Store 1 should be in owner store list');
    assert(foundS2, 'Store 2 should be in owner store list');
    console.log(`✅ Multi-Store query verified: 1 Owner has ${ownerStores.length} stores registered!`);

    // ── PART 2: SWITCHING POS STORE ──────────────────────────────────────
    console.log('\n[TEST 2] Switching POS active store...');
    const switchRes = await fetch(`${baseUrl}/api/pos/store/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: store2Id })
    }).then(r => r.json());

    assert(switchRes.success, 'Store switch should succeed');
    assert.strictEqual(switchRes.store.merchantId, store2Id, 'Active store must be Store 2');

    const posStoreInfo = await fetch(`${baseUrl}/api/pos/store`).then(r => r.json());
    assert.strictEqual(posStoreInfo.merchantId, store2Id, 'GET /store should reflect Store 2');
    assert.strictEqual(posStoreInfo.storeName, 'Laundry Kilat 24 Jam');
    assert(Array.isArray(posStoreInfo.allOwnerStores), 'Should return allOwnerStores');
    assert(posStoreInfo.allOwnerStores.length >= 2, 'allOwnerStores should list multiple stores');
    console.log(`✅ Active POS store switched to "${posStoreInfo.storeName}" with Saldo: Rp ${posStoreInfo.saldoNota}`);

    // Switch back to Store 1 for cash order testing
    await fetch(`${baseUrl}/api/pos/store/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: store1Id })
    });

    // ── PART 3: CASH PAYMENT & NOTA DEDUCTION GATE ───────────────────────
    console.log('\n[TEST 3] Testing Cash payment with Nota deduction gate...');

    // 3A. Place an order
    const products = await fetch(`${baseUrl}/api/pos/products`).then(r => r.json());
    const tables = await fetch(`${baseUrl}/api/pos/tables`).then(r => r.json());
    assert(products.length > 0 && tables.length > 0);

    const order1 = await fetch(`${baseUrl}/api/pos/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableToken: tables[0].qrToken,
        customerName: 'Budi Tunai',
        customerPhone: '081122334455',
        isLoggedIn: true,
        items: [{ productId: products[0].id, qty: 1 }]
      })
    }).then(r => r.json());

    await fetch(`${baseUrl}/api/pos/orders/${order1.id}/acc`, { method: 'POST' });

    // 3B. Set store 1 saldoNota to 50 (< 100) via API to test rejection gate
    await fetch(`${baseUrl}/api/merchants/${store1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saldoNota: 50, kuotaNota: 0 })
    });

    // Try paying with CASH when saldoNota is 50 -> MUST FAIL
    const failedPayRes = await fetch(`${baseUrl}/api/pos/orders/${order1.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'CASH' })
    });
    const failedPayData = await failedPayRes.json();
    assert.strictEqual(failedPayRes.status, 400, 'Pay cash should fail with status 400 when saldoNota < 100');
    assert.strictEqual(failedPayData.requiresTopupNota, true, 'Response must flag requiresTopupNota');
    console.log(`✅ Cash Gate verified: Transaksi ditolak saat saldo nota Rp 50 (< Rp 100): "${failedPayData.error}"`);

    // 3C. Top up saldo nota via POS Kasir endpoint
    const topupRes = await fetch(`${baseUrl}/api/pos/topup-nota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 10000,
        merchantId: store1Id
      })
    }).then(r => r.json());

    assert(topupRes.success, 'Topup nota should succeed');
    assert.strictEqual(topupRes.saldoNota, 10050, 'Saldo nota should be 50 + 10000 = 10050');
    assert.strictEqual(topupRes.kuotaNota, 100, 'Kuota nota should be 100');
    console.log(`✅ Top Up Saldo Nota verified: Berhasil top up Rp 10.000 (+100 Nota). Saldo baru: Rp ${topupRes.saldoNota}`);

    // 3D. Retry paying with CASH -> MUST SUCCEED & DEDUCT 1 NOTA (RP 100)
    const successPayRes = await fetch(`${baseUrl}/api/pos/orders/${order1.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'CASH' })
    });
    const successPayData = await successPayRes.json();
    assert(successPayRes.ok, 'Pay cash should succeed after topup');
    assert.strictEqual(successPayData.method, 'CASH', 'Payment method should be CASH');
    assert.strictEqual(successPayData.status, 'PREPARING', 'Order should transition to PREPARING');
    assert.strictEqual(successPayData.notaDeducted, 100, 'Order should have notaDeducted = 100');
    assert.strictEqual(successPayData.sisaSaldoNota, 9950, 'Saldo nota should be deducted by 100: 10050 - 100 = 9950');
    console.log(`✅ Cash Pay verified: Berhasil bayar tunai & saldo nota terpotong Rp 100 -> Sisa Saldo: Rp ${successPayData.sisaSaldoNota}`);

    // 3E. Verify idempotency: paying again or confirming does NOT double-deduct
    const confirmRes = await fetch(`${baseUrl}/api/pos/orders/${order1.id}/confirm-payment`, {
      method: 'POST'
    }).then(r => r.json());
    assert(confirmRes.success);
    const storeAfter = await fetch(`${baseUrl}/api/pos/store`).then(r => r.json());
    assert.strictEqual(storeAfter.saldoNota, 9950, 'Double deduction must not happen on already deducted order');
    console.log('✅ Idempotency verified: Saldo tetap Rp 9.950 (tidak terpotong ganda)');

    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED! CASH NOTA DEDUCTION & MULTI-STORE FULLY VERIFIED!');
    console.log('======================================================');

  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

testCashNotaAndMultiStore();
