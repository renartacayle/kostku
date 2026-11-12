const assert = require('assert');
const http = require('http');
const app = require('../backend/server');

async function runPosTests() {
  console.log('--- 🧪 STARTING POS & TABLE QR API TESTS ---');

  // Start app on test port
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log('Test server started on', baseUrl);

  try {
    // 1. Get Products
    const resProducts = await fetch(`${baseUrl}/api/pos/products`).then(r => r.json());
    assert(Array.isArray(resProducts));
    assert(resProducts.length > 0);
    console.log('✅ 1. Products fetched successfully. Count:', resProducts.length);

    // 2. Get Tables
    const resTables = await fetch(`${baseUrl}/api/pos/tables`).then(r => r.json());
    assert(Array.isArray(resTables));
    assert(resTables.length > 0);
    const table = resTables[0];
    console.log('✅ 2. Tables fetched successfully. Sample table:', table.number, 'QR Token:', table.qrToken);

    // 3. Customer places Order from Table QR
    const orderPayload = {
      tableToken: table.qrToken,
      customerName: 'Budi Santoso',
      customerPhone: '081234567890',
      isLoggedIn: true,
      items: [
        { productId: resProducts[0].id, qty: 2 },
        { productId: resProducts[1].id, qty: 1 }
      ],
      notes: 'Jangan terlalu pedas ya'
    };

    const order = await fetch(`${baseUrl}/api/pos/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).then(r => r.json());

    assert.strictEqual(order.status, 'PENDING_CONFIRMATION');
    // Policy update: Customer has 0 platform fee, flat Rp 500 admin fee deducted from owner
    assert.strictEqual(order.platformFee, 0);
    assert.strictEqual(order.ownerDeduction, 100);
    assert.strictEqual(order.totalAmount, order.subtotal);
    console.log('✅ 3. Customer Order created successfully. ID:', order.id, 'Status:', order.status, 'Total (Customer fee Rp 0, Owner deduction Rp 100):', order.totalAmount);

    // 4. Kitchen / Cashier ACC the order
    const resAcc = await fetch(`${baseUrl}/api/pos/orders/${order.id}/acc`, {
      method: 'POST'
    }).then(r => r.json());

    assert.strictEqual(resAcc.success, true);
    assert.strictEqual(resAcc.order.status, 'WAITING_PAYMENT');
    console.log('✅ 4. Order ACC by Kitchen successfully. Status updated to WAITING_PAYMENT');

    // 5. Test Payment Option A (TriPay)
    const resPayTripay = await fetch(`${baseUrl}/api/pos/orders/${order.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'TRIPAY' })
    }).then(r => r.json());

    assert.strictEqual(resPayTripay.success, true);
    assert(resPayTripay.reference);
    assert(resPayTripay.qrString);
    console.log('✅ 5. TriPay Payment invoice generated successfully. Ref:', resPayTripay.reference);

    // Confirm payment
    await fetch(`${baseUrl}/api/pos/orders/${order.id}/confirm-payment`, { method: 'POST' });

    // 6. Test Lucky Spin Wheel & Login Policy
    // Guest spin should be rejected
    const guestOrder = await fetch(`${baseUrl}/api/pos/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderPayload, isLoggedIn: false })
    }).then(r => r.json());
    await fetch(`${baseUrl}/api/pos/orders/${guestOrder.id}/acc`, { method: 'POST' });
    await fetch(`${baseUrl}/api/pos/orders/${guestOrder.id}/confirm-payment`, { method: 'POST' });

    const guestSpinRes = await fetch(`${baseUrl}/api/pos/orders/${guestOrder.id}/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '081234567890' })
    }).then(r => r.json());
    assert(guestSpinRes.error, 'Guest cannot spin wheel');
    console.log('✅ 6A. Guest without login correctly blocked from Lucky Spin & Points.');

    // Logged in user spin
    let fullCount = 0;
    const iterations = 50;
    const loggedInOrderPayload = { ...orderPayload, isLoggedIn: true };
    for (let i = 0; i < iterations; i++) {
      const o = await fetch(`${baseUrl}/api/pos/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loggedInOrderPayload)
      }).then(r => r.json());

      await fetch(`${baseUrl}/api/pos/orders/${o.id}/acc`, { method: 'POST' });
      await fetch(`${baseUrl}/api/pos/orders/${o.id}/confirm-payment`, { method: 'POST' });

      const spinRes = await fetch(`${baseUrl}/api/pos/orders/${o.id}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '081234567890' })
      }).then(r => r.json());

      assert.strictEqual(spinRes.success, true);
      assert(spinRes.points > 0, 'Points must be > 0 (Zero ZONK rule)');
      if (spinRes.tier === 'FULL') {
        fullCount++;
        assert.strictEqual(spinRes.points, 100);
        assert.strictEqual(spinRes.targetSliceIndex, 0);
      }
    }

    const fullPercentage = (fullCount / iterations) * 100;
    console.log(`✅ 6. Lucky Spin Wheel verified over ${iterations} spins:`);
    console.log(`   - Full Poin (100 Pts) won: ${fullCount}/${iterations} times (${fullPercentage}%)`);
    console.log(`   - Zero ZONK verified: 100% of spins won points!`);
    assert(fullPercentage >= 30 && fullPercentage <= 70, 'Distribution should hover around ~50%');

    // Test Anti-Double Spin
    const doubleSpin2 = await fetch(`${baseUrl}/api/pos/orders/${order.id}/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '081234567890' })
    });
    // First spin on this order was not done yet, let's do first spin
    const spin1 = await doubleSpin2.json();
    assert.strictEqual(spin1.success, true);

    // Second spin on same order MUST be rejected with HTTP 400
    const doubleSpin3 = await fetch(`${baseUrl}/api/pos/orders/${order.id}/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '081234567890' })
    });
    assert.strictEqual(doubleSpin3.status, 400);
    console.log('✅ 7. Anti-double spin cheat protection verified successfully.');

    // 8. Test Option B: Tagih ke Kamar Kost (Room Bill)
    const oRoom = await fetch(`${baseUrl}/api/pos/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).then(r => r.json());

    await fetch(`${baseUrl}/api/pos/orders/${oRoom.id}/acc`, { method: 'POST' });

    const payRoomRes = await fetch(`${baseUrl}/api/pos/orders/${oRoom.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'ROOM_BILL', roomNumber: '101' })
    }).then(r => r.json());

    assert.strictEqual(payRoomRes.success, true);
    assert.strictEqual(payRoomRes.order.status, 'PREPARING');
    assert.strictEqual(payRoomRes.order.paymentStatus, 'BILLED');
    console.log('✅ 8. Option B (Tagih ke Kamar 101) verified successfully. Status:', payRoomRes.order.status);

    console.log('🎉 ALL 8 BACKEND POS TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
  }
  process.exit(0);
}

runPosTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
