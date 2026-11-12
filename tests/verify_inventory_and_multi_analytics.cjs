const assert = require('assert');

async function runTests() {
  console.log('🧪 Starting Verification of Inventory, Recipe Deduction, and Multi-Dimensional Analytics...\n');
  const baseUrl = 'http://localhost:3001';

  // 1. GET /api/pos/inventory
  console.log('1. Testing GET /api/pos/inventory...');
  const resInv = await fetch(`${baseUrl}/api/pos/inventory`);
  assert.strictEqual(resInv.status, 200, 'GET /api/pos/inventory should return 200');
  const invData = await resInv.json();
  assert.strictEqual(invData.success, true, 'success should be true');
  assert.ok(Array.isArray(invData.inventory), 'inventory should be array');
  assert.ok(invData.inventory.length >= 10, 'inventory should contain seeded items');
  assert.ok(Array.isArray(invData.alerts), 'alerts should be array');
  console.log(`   ✅ Inventory fetched: ${invData.inventory.length} items, ${invData.alerts.length} low-stock alerts.`);

  // 2. GET /api/pos/recipes
  console.log('\n2. Testing GET /api/pos/recipes...');
  const resRec = await fetch(`${baseUrl}/api/pos/recipes`);
  assert.strictEqual(resRec.status, 200, 'GET /api/pos/recipes should return 200');
  const recData = await resRec.json();
  assert.strictEqual(recData.success, true, 'recipes success should be true');
  assert.ok(Array.isArray(recData.recipes), 'recipes should be array');
  assert.ok(recData.recipes.length > 0, 'recipes should contain items');
  const mieRecipe = recData.recipes.find(r => r.productId === 'prod-1');
  assert.ok(mieRecipe, 'prod-1 (Mie Gacoan) recipe should exist');
  assert.ok(mieRecipe.totalHPP > 0, 'totalHPP should be calculated and > 0');
  console.log(`   ✅ Recipes verified: prod-1 HPP is Rp ${mieRecipe.totalHPP}, margin ${mieRecipe.marginPct}%.`);

  // 3. POST /api/pos/inventory/restock
  console.log('\n3. Testing POST /api/pos/inventory/restock...');
  const targetInvId = 'INV-AYAM';
  const beforeItem = invData.inventory.find(i => i.id === targetInvId);
  const beforeStock = beforeItem.currentStock;
  const addQty = 100;

  const resRestock = await fetch(`${baseUrl}/api/pos/inventory/restock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventoryId: targetInvId,
      addQty,
      notes: 'Test Restock via Automated Test',
      restockedBy: 'Test Runner'
    })
  });
  assert.strictEqual(resRestock.status, 200, 'Restock should return 200');
  const restockRes = await resRestock.json();
  assert.strictEqual(restockRes.success, true);
  assert.strictEqual(restockRes.newStock, beforeStock + addQty);
  console.log(`   ✅ Restock verified: ${targetInvId} increased from ${beforeStock} to ${restockRes.newStock}.`);

  // 4. POST /api/pos/orders with Recipe Deduction
  console.log('\n4. Testing POST /api/pos/orders with Automatic Inventory Deduction...');
  const stockBeforeOrderRes = await fetch(`${baseUrl}/api/pos/inventory`);
  const stockBeforeOrder = await stockBeforeOrderRes.json();
  const mieBahanBefore = stockBeforeOrder.inventory.find(i => i.id === 'INV-MIE').currentStock;

  const resOrder = await fetch(`${baseUrl}/api/pos/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Budi Verifikasi Stok',
      customerPhone: '081299990001',
      items: [
        {
          id: 'prod-1',
          name: 'Mie Gacoan Level 2',
          price: 13000,
          qty: 2,
          category: 'Makanan'
        }
      ],
      paymentMethod: 'CASH',
      status: 'PENDING_CONFIRMATION'
    })
  });
  assert.strictEqual(resOrder.status, 200, 'Create order should return 200');
  const orderData = await resOrder.json();
  assert.ok(orderData.id, 'order should have ID');

  const stockAfterOrderRes = await fetch(`${baseUrl}/api/pos/inventory`);
  const stockAfterOrder = await stockAfterOrderRes.json();
  const mieBahanAfter = stockAfterOrder.inventory.find(i => i.id === 'INV-MIE').currentStock;
  // Mie Gacoan takes 1 porsi per portion, so 2 portions = -2 porsi
  assert.strictEqual(mieBahanAfter, mieBahanBefore - 2, 'INV-MIE should decrease by 2 porsi');
  console.log(`   ✅ Order deduction verified: INV-MIE decreased by 2 (${mieBahanBefore} -> ${mieBahanAfter}).`);

  // 5. POST /api/pos/orders/:id/reject with Inventory Restoration
  console.log('\n5. Testing POST /api/pos/orders/:id/reject with Automatic Inventory Restoration...');
  const resReject = await fetch(`${baseUrl}/api/pos/orders/${orderData.id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Dapur kehabisan bumbu - Test Cancel' })
  });
  assert.strictEqual(resReject.status, 200, 'Reject order should return 200');

  const stockAfterRejectRes = await fetch(`${baseUrl}/api/pos/inventory`);
  const stockAfterReject = await stockAfterRejectRes.json();
  const mieBahanRestored = stockAfterReject.inventory.find(i => i.id === 'INV-MIE').currentStock;
  assert.strictEqual(mieBahanRestored, mieBahanBefore, 'INV-MIE should be fully restored to original stock');
  console.log(`   ✅ Order cancellation restoration verified: INV-MIE restored back to ${mieBahanRestored}.`);

  // 6. GET /api/pos/analytics
  console.log('\n6. Testing GET /api/pos/analytics Multi-Dimensional Financial Performance...');
  const resAnalytics = await fetch(`${baseUrl}/api/pos/analytics`);
  assert.strictEqual(resAnalytics.status, 200, 'GET /api/pos/analytics should return 200');
  const aData = await resAnalytics.json();
  assert.strictEqual(aData.success, true);
  assert.ok(Array.isArray(aData.perMenu), 'perMenu should be array');
  assert.ok(Array.isArray(aData.perStore), 'perStore should be array');
  assert.ok(Array.isArray(aData.crossBranchPerMenu), 'crossBranchPerMenu should be array');
  assert.ok(Array.isArray(aData.perCashier), 'perCashier should be array');
  assert.ok(aData.summary, 'summary should exist');
  assert.ok(aData.summary.totalGrossOmset >= 0, 'totalGrossOmset should be valid');

  console.log(`   ✅ Multi-Dimensional Analytics Verified:`);
  console.log(`      - Summary: Rp ${aData.summary.totalGrossOmset.toLocaleString('id-ID')} gross omset across ${aData.summary.activeBranchesCount} branches`);
  console.log(`      - Per Menu Breakdown: ${aData.perMenu.length} menus evaluated`);
  console.log(`      - Per Store Breakdown: ${aData.perStore.length} branches tracked`);
  console.log(`      - Cross-Branch Matrix: ${aData.crossBranchPerMenu.length} products mapped`);
  console.log(`      - Cashier Leaderboard: ${aData.perCashier.length} cashiers tracked`);

  console.log('\n🎉 ALL ACCEPTANCE GATES PASSED 100% SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
