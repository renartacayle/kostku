/**
 * Automated Verification Script: Food Promo Engine (Owner, Mitra, Kasir, Admin - Quota vs Date Limit)
 * Run: node tests/verify_food_promos_quota_and_date.cjs
 */

const BASE_URL = 'http://localhost:3001';

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('🧪 VERIFYING FOOD PROMO ENGINE (QUOTA & DATE LIMITS)');
  console.log('======================================================\n');

  // 1. Fetch initial promos
  console.log('--- TEST 1: Initial Promo Catalog Retrieval ---');
  const getPromosRes = await fetchJson('/api/pos/promos');
  assert(getPromosRes.ok, 'GET /api/pos/promos returns HTTP 200');
  assert(Array.isArray(getPromosRes.data.promos), 'promos array exists in response');
  assert(getPromosRes.data.promos.length >= 3, 'Pre-seeded promos exist (Quota, Date, and Both types)');

  const initialPromos = getPromosRes.data.promos;
  console.log(`  Found ${initialPromos.length} existing food promos.`);

  // 2. Test Promo Creation by Role: OWNER (QUOTA ONLY)
  console.log('\n--- TEST 2: Create Promo by Role OWNER (Quota Limit) ---');
  const ownerPromoPayload = {
    title: 'Owner Test Promo Quota 3',
    code: 'OWNERQ3_' + Date.now().toString().slice(-4),
    scope: 'ALL',
    targetProductId: null,
    discountType: 'FIXED',
    discountValue: 4000,
    minOrder: 10000,
    limitType: 'QUOTA',
    maxQuota: 3,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: null,
    createdByRole: 'owner',
    description: 'Owner created 3 portions quota promo'
  };

  const createOwnerRes = await fetchJson('/api/pos/promos', {
    method: 'POST',
    body: JSON.stringify(ownerPromoPayload)
  });
  assert(createOwnerRes.ok, 'Owner can create promo with HTTP 200');
  assert(createOwnerRes.data.promo.createdByRole === 'owner', 'Creator role is recorded as owner');
  assert(createOwnerRes.data.promo.limitType === 'QUOTA', 'Limit type is QUOTA');
  assert(createOwnerRes.data.promo.maxQuota === 3, 'Max quota is set to 3');
  const ownerPromo = createOwnerRes.data.promo;

  // 3. Test Promo Creation by Role: MITRA (DATE LIMIT)
  console.log('\n--- TEST 3: Create Promo by Role MITRA (Date Limit) ---');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const expiryDateStr = futureDate.toISOString().split('T')[0];

  const mitraPromoPayload = {
    title: 'Mitra Test Promo Date Limit',
    code: 'MITRADATE_' + Date.now().toString().slice(-4),
    scope: 'ALL',
    targetProductId: null,
    discountType: 'PERCENT',
    discountValue: 20,
    minOrder: 15000,
    limitType: 'DATE',
    maxQuota: null,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: expiryDateStr,
    createdByRole: 'mitra',
    description: 'Mitra created 20% discount until next week'
  };

  const createMitraRes = await fetchJson('/api/pos/promos', {
    method: 'POST',
    body: JSON.stringify(mitraPromoPayload)
  });
  assert(createMitraRes.ok, 'Mitra can create promo with HTTP 200');
  assert(createMitraRes.data.promo.createdByRole === 'mitra', 'Creator role is recorded as mitra');
  assert(createMitraRes.data.promo.limitType === 'DATE', 'Limit type is DATE');
  assert(createMitraRes.data.promo.expiryDate === expiryDateStr, `Expiry date correctly stored as ${expiryDateStr}`);
  const mitraPromo = createMitraRes.data.promo;

  // 4. Test Promo Creation by Role: KASIR (BOTH QUOTA & DATE)
  console.log('\n--- TEST 4: Create Promo by Role KASIR (Both Quota & Date) ---');
  const kasirPromoPayload = {
    title: 'Kasir Test Promo Hybrid',
    code: 'KASIRHYB_' + Date.now().toString().slice(-4),
    scope: 'SPECIFIC_ITEM',
    targetProductId: 'prod-1',
    targetProductName: 'Mie Gacoan Level 2',
    discountType: 'FIXED',
    discountValue: 2500,
    minOrder: 0,
    limitType: 'BOTH',
    maxQuota: 2,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: expiryDateStr,
    createdByRole: 'kasir',
    description: 'Kasir created hybrid promo for specific item'
  };

  const createKasirRes = await fetchJson('/api/pos/promos', {
    method: 'POST',
    body: JSON.stringify(kasirPromoPayload)
  });
  assert(createKasirRes.ok, 'Kasir can create promo with HTTP 200');
  assert(createKasirRes.data.promo.createdByRole === 'kasir', 'Creator role is recorded as kasir');
  assert(createKasirRes.data.promo.limitType === 'BOTH', 'Limit type is BOTH');
  assert(createKasirRes.data.promo.maxQuota === 2, 'Max quota is set to 2');
  const kasirPromo = createKasirRes.data.promo;

  // 5. Test Promo Creation by Role: ADMIN (Expired Date test promo)
  console.log('\n--- TEST 5: Create Promo by Role ADMIN (Expired Date) ---');
  const adminPromoPayload = {
    title: 'Admin Test Expired Promo',
    code: 'EXPIRED_' + Date.now().toString().slice(-4),
    scope: 'ALL',
    targetProductId: null,
    discountType: 'FIXED',
    discountValue: 5000,
    minOrder: 0,
    limitType: 'DATE',
    maxQuota: null,
    startDate: '2026-01-01',
    expiryDate: '2026-01-02', // past date
    createdByRole: 'admin',
    description: 'Past promo for testing expiry rejection'
  };

  const createAdminRes = await fetchJson('/api/pos/promos', {
    method: 'POST',
    body: JSON.stringify(adminPromoPayload)
  });
  assert(createAdminRes.ok, 'Admin can create promo with HTTP 200');
  const expiredPromo = createAdminRes.data.promo;

  // 6. Test Promo Validation Endpoint (/api/pos/promos/validate)
  console.log('\n--- TEST 6: Promo Validation Endpoint Testing ---');
  
  // 6a. Valid Quota Promo
  const valQuota = await fetchJson('/api/pos/promos/validate', {
    method: 'POST',
    body: JSON.stringify({
      promoCode: ownerPromo.code,
      items: [{ productId: 'prod-1', qty: 2 }],
      subtotal: 24000
    })
  });
  assert(valQuota.ok && valQuota.data.valid, 'Owner Quota promo validates successfully');
  assert(valQuota.data.discountAmount === 4000, 'Discount amount matches Rp 4.000');
  assert(valQuota.data.remainingQuota === 3, 'Remaining quota reports 3');

  // 6b. Expired Promo Rejection
  const valExp = await fetchJson('/api/pos/promos/validate', {
    method: 'POST',
    body: JSON.stringify({
      promoCode: expiredPromo.code,
      items: [{ productId: 'prod-1', qty: 1 }],
      subtotal: 12000
    })
  });
  assert(valExp.status === 400 && !valExp.data.valid, 'Expired promo is rejected with HTTP 400 and valid: false');
  console.log(`  Expected error message: "${valExp.data.error}"`);

  // 6c. Specific Item Promo with non-matching item
  const valMismatch = await fetchJson('/api/pos/promos/validate', {
    method: 'POST',
    body: JSON.stringify({
      promoCode: kasirPromo.code,
      items: [{ productId: 'prod-other', qty: 1 }],
      subtotal: 15000
    })
  });
  assert(valMismatch.status === 400 && !valMismatch.data.valid, 'Specific-item promo rejects order missing the target item');

  // 7. Test Order Placement with Promo & Quota Consumption
  console.log('\n--- TEST 7: Order Placement Consuming Promo Quota ---');
  const orderPayload = {
    tableToken: 'table-test-1',
    customerName: 'Budi Tester Promo',
    customerPhone: '081234567890',
    items: [{ productId: 'prod-1', qty: 2 }], // 2 x 12.000 = 24.000
    promoId: ownerPromo.id,
    promoCode: ownerPromo.code
  };

  const orderRes = await fetchJson('/api/pos/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  });
  assert(orderRes.ok, 'Order with promo placed successfully');
  const orderData = orderRes.data;
  assert(orderData.promoId === ownerPromo.id, 'Order recorded applied promoId');
  assert(orderData.promoDiscount === 4000, 'Order recorded promoDiscount of Rp 4.000');
  assert(orderData.totalAmount === orderData.subtotal - 4000, `Order totalAmount reflects subtotal - discount (${orderData.subtotal} - 4000 = ${orderData.totalAmount})`);

  // Verify that promo quota was decremented (usedCount incremented from 0 to 1)
  const promoCheckRes = await fetchJson('/api/pos/promos');
  const updatedOwnerPromo = promoCheckRes.data.promos.find(p => p.id === ownerPromo.id);
  assert(updatedOwnerPromo.usedCount === 1, 'Promo usedCount incremented to 1');
  assert(updatedOwnerPromo.remainingQuota === 2, 'Promo remainingQuota decreased to 2');

  // 8. Test Quota Restoration on Order Rejection
  console.log('\n--- TEST 8: Quota Restoration on Order Rejection ---');
  const rejectRes = await fetchJson(`/api/pos/orders/${orderData.id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: 'Out of stock' })
  });
  assert(rejectRes.ok, 'Order rejected successfully');

  // Check that usedCount was restored back to 0
  const promoRestoredRes = await fetchJson('/api/pos/promos');
  const restoredOwnerPromo = promoRestoredRes.data.promos.find(p => p.id === ownerPromo.id);
  assert(restoredOwnerPromo.usedCount === 0, 'Promo usedCount safely decremented back to 0 on order rejection');
  assert(restoredOwnerPromo.remainingQuota === 3, 'Promo remainingQuota restored back to 3');

  // 9. Test Quota Exhaustion (Quota reaching 0)
  console.log('\n--- TEST 9: Quota Exhaustion & Rejection When Quota = 0 ---');
  // kasirPromo has maxQuota = 2. Place 2 orders:
  for (let i = 1; i <= 2; i++) {
    const oRes = await fetchJson('/api/pos/orders', {
      method: 'POST',
      body: JSON.stringify({
        tableToken: 'table-test-1',
        customerName: `Tester Quota ${i}`,
        items: [{ productId: 'prod-1', qty: 1 }],
        promoId: kasirPromo.id,
        promoCode: kasirPromo.code
      })
    });
    assert(oRes.ok, `Order #${i} using kasirPromo placed successfully`);
  }

  // Check promo state: should be quota exhausted (isQuotaEmpty: true, isAvailable: false)
  const promoCheck2 = await fetchJson('/api/pos/promos');
  const exhaustedKasirPromo = promoCheck2.data.promos.find(p => p.id === kasirPromo.id);
  assert(exhaustedKasirPromo.usedCount === 2, 'kasirPromo usedCount reached 2/2');
  assert(exhaustedKasirPromo.remainingQuota === 0, 'kasirPromo remainingQuota is 0');
  assert(exhaustedKasirPromo.isQuotaEmpty === true, 'kasirPromo isQuotaEmpty is true');
  assert(exhaustedKasirPromo.isAvailable === false, 'kasirPromo isAvailable is false');

  // Attempting 3rd order with exhausted promo must fail
  const thirdOrderRes = await fetchJson('/api/pos/orders', {
    method: 'POST',
    body: JSON.stringify({
      tableToken: 'table-test-1',
      customerName: 'Tester Quota Overflow',
      items: [{ productId: 'prod-1', qty: 1 }],
      promoId: kasirPromo.id,
      promoCode: kasirPromo.code
    })
  });
  assert(thirdOrderRes.status === 400, '3rd order with exhausted promo rejected with HTTP 400');
  console.log(`  Rejection response: "${thirdOrderRes.data.error}"`);

  // 10. Clean up test promos
  console.log('\n--- TEST 10: Toggle and Delete Promo Cleanup ---');
  const toggleRes = await fetchJson(`/api/pos/promos/${ownerPromo.id}/toggle`, { method: 'PUT' });
  assert(toggleRes.ok, 'Promo toggle active status works');

  const delRes1 = await fetchJson(`/api/pos/promos/${ownerPromo.id}`, { method: 'DELETE' });
  assert(delRes1.ok, 'Owner test promo deleted');
  const delRes2 = await fetchJson(`/api/pos/promos/${mitraPromo.id}`, { method: 'DELETE' });
  assert(delRes2.ok, 'Mitra test promo deleted');
  const delRes3 = await fetchJson(`/api/pos/promos/${kasirPromo.id}`, { method: 'DELETE' });
  assert(delRes3.ok, 'Kasir test promo deleted');
  const delRes4 = await fetchJson(`/api/pos/promos/${expiredPromo.id}`, { method: 'DELETE' });
  assert(delRes4.ok, 'Admin test promo deleted');

  console.log('\n======================================================');
  console.log('🎉 ALL 10 FOOD PROMO ENGINE VERIFICATION GATES PASSED!');
  console.log('======================================================\n');
}

runVerification().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
