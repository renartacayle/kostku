const assert = require('assert');
const http = require('http');
const app = require('../backend/server');

async function testSingleUidUnifiedWallet() {
  console.log('--- 🧪 STARTING SINGLE UID UNIFIED WALLET (KASIR & MITRA) TEST ---');

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log('Test server active on', baseUrl);

  try {
    // 1. Get POS Store info
    const storeRes = await fetch(`${baseUrl}/api/pos/store`).then(r => r.json());
    console.log('1. POS Store Info fetched:', storeRes.storeName, 'UID:', storeRes.uid);
    assert(storeRes.uid, 'POS store must have a UID');

    const sharedUid = storeRes.uid;

    // 2. Query Unified Wallet via /api/wallet/account/:uid with store UID and with 'pos' alias
    const walletViaPosRes = await fetch(`${baseUrl}/api/wallet/account/pos`).then(r => r.json());
    assert(walletViaPosRes.success, 'Wallet via pos alias should succeed');
    assert.strictEqual(walletViaPosRes.unifiedUid, sharedUid, 'pos alias must resolve to shared UID');

    const walletViaUidRes = await fetch(`${baseUrl}/api/wallet/account/${sharedUid}`).then(r => r.json());
    assert(walletViaUidRes.success, 'Wallet via shared UID should succeed');
    assert.strictEqual(walletViaUidRes.wallet.balance, walletViaPosRes.wallet.balance, 'Balances must match exactly');
    console.log(`✅ 2. Single UID mapping verified: /api/wallet/account/pos resolves to ${sharedUid}`);

    const initialBalance = Number(walletViaUidRes.wallet.balance) || 0;
    console.log('Initial wallet balance:', initialBalance);

    // 3. Place and pay an order from POS Kasir
    const products = await fetch(`${baseUrl}/api/pos/products`).then(r => r.json());
    const tables = await fetch(`${baseUrl}/api/pos/tables`).then(r => r.json());
    assert(products.length > 0);
    assert(tables.length > 0);

    const posOrderPayload = {
      tableToken: tables[0].qrToken,
      customerName: 'Pelanggan Meja 01',
      customerPhone: '081234567899',
      isLoggedIn: true,
      items: [{ productId: products[0].id, qty: 1 }]
    };

    const posOrder = await fetch(`${baseUrl}/api/pos/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(posOrderPayload)
    }).then(r => r.json());

    // ACC order
    await fetch(`${baseUrl}/api/pos/orders/${posOrder.id}/acc`, { method: 'POST' });
    // Pay via TriPay
    await fetch(`${baseUrl}/api/pos/orders/${posOrder.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'TRIPAY' })
    });
    // Confirm payment
    await fetch(`${baseUrl}/api/pos/orders/${posOrder.id}/confirm-payment`, { method: 'POST' });

    const posNetAmount = Math.max(0, posOrder.totalAmount - 100);
    console.log(`✅ 3. POS Order ${posOrder.id} confirmed paid via TriPay. Net amount: Rp ${posNetAmount}`);

    // Verify wallet received POS net amount
    const walletAfterPos = await fetch(`${baseUrl}/api/wallet/account/${sharedUid}`).then(r => r.json());
    assert.strictEqual(walletAfterPos.wallet.balance, initialBalance + posNetAmount);
    console.log(`✅ Wallet balance after POS order: Rp ${walletAfterPos.wallet.balance}`);

    // 4. Place and pay an order from Mitra UMKM (sharing the SAME UID)
    const mitraOrderPayload = {
      kostUid: 'KOST-JAKSEL-01',
      userId: 'USER-TEST-1',
      userName: 'Penghuni Kamar 101',
      merchantId: sharedUid, // SAMA PERSIS DENGAN KASIR POS!
      merchantName: storeRes.storeName || 'Kantin Riuh & Mitra',
      subtotal: 35000,
      paymentMethod: 'qris'
    };

    const mitraOrder = await fetch(`${baseUrl}/api/partner-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mitraOrderPayload)
    }).then(r => r.json());

    assert(mitraOrder.success, 'Mitra order should succeed');
    console.log(`✅ 4. Mitra Order ${mitraOrder.order.id} paid via QRIS Platform.`);

    // 5. Verify the wallet balance has combined BOTH Kasir POS and Mitra UMKM into 1 single balance!
    const walletAfterMitra = await fetch(`${baseUrl}/api/wallet/account/${sharedUid}`).then(r => r.json());
    const expectedCombined = initialBalance + posNetAmount + 35000;
    assert.strictEqual(walletAfterMitra.wallet.balance, expectedCombined);
    console.log(`✅ 5. Combined Balance in Single Unified Wallet: Rp ${walletAfterMitra.wallet.balance}`);
    console.log(`   - Initial: Rp ${initialBalance}`);
    console.log(`   - + POS Kasir: +Rp ${posNetAmount}`);
    console.log(`   - + Mitra UMKM: +Rp 35.000`);
    console.log(`   - = TOTAL 1 DOMPET: Rp ${walletAfterMitra.wallet.balance}`);

    // Verify both transactions are in the history
    const history = walletAfterMitra.wallet.history;
    const hasPosTrx = history.some(h => h.orderId === posOrder.id);
    const hasMitraTrx = history.some(h => h.orderId === mitraOrder.order.id);
    assert(hasPosTrx, 'Wallet history must contain POS cashier order');
    assert(hasMitraTrx, 'Wallet history must contain Mitra UMKM order');
    console.log('✅ 6. History contains both POS Kasir and Mitra UMKM ledger entries.');

    // 6. Test Payout from the combined wallet
    const payoutRes = await fetch(`${baseUrl}/api/wallet/account/pos/mutate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 20000,
        type: 'payout',
        description: 'Tarik saldo gabungan Kasir & Mitra'
      })
    }).then(r => r.json());

    assert(payoutRes.success);
    assert.strictEqual(payoutRes.wallet.balance, expectedCombined - 20000);
    console.log(`✅ 7. Payout test successful. New combined balance: Rp ${payoutRes.wallet.balance}`);

    console.log('\n🎉 ALL SINGLE UID UNIFIED WALLET TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
  }
}

testSingleUidUnifiedWallet().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
