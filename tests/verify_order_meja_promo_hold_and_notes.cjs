const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');
const backendApp = require('../backend/server');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/9b01eb42-92f6-4beb-a90f-e390a58ab3b3';

async function fetchPromoState(promoId, sessionId = 'OTHER_TABLE_CHECK') {
  const res = await fetch(`http://localhost:3001/api/pos/promos?demo=true&sessionId=${encodeURIComponent(sessionId)}`);
  assert(res.ok, 'GET /api/pos/promos must succeed');
  const data = await res.json();
  return (data.promos || []).find(p => p.id === promoId);
}

async function runTest() {
  console.log('--- 🧪 STARTING E2E VERIFICATION: PROMO HOLD + PER-MENU NOTES + AUTO TABLE NAME ---');

  const backendServer = http.createServer(backendApp);
  await new Promise(resolve => backendServer.listen(3001, resolve));
  console.log('✅ Backend API running on port 3001');

  const previewServer = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: '/home/rena/.gemini/antigravity/scratch/kostku',
    stdio: 'pipe'
  });

  await new Promise(r => setTimeout(r, 2000));

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      console.error('Unexpected alert/dialog:', dialog.message());
      await dialog.dismiss();
    });

    let lastCreatedOrder = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/pos/orders') && res.request().method() === 'POST' && !res.url().includes('/pay') && !res.url().includes('/confirm') && !res.url().includes('/spin')) {
        try {
          lastCreatedOrder = await res.json();
        } catch (_) {}
      }
    });

    console.log('📱 Navigating to http://localhost:4173/order/MEJA-01-TKN881?demo=true ...');
    await page.goto('http://localhost:4173/order/MEJA-01-TKN881?demo=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('main', { timeout: 10000 });
    await page.waitForSelector('[data-testid="promo-card-prod-1"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Capture fresh Top Hero screenshot
    const heroPath = path.join(ARTIFACTS_DIR, 'order_meja_top_hero.png');
    await page.screenshot({ path: heroPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${heroPath}`);

    // 1. Verify NO "Atas Nama" input inside <main>
    const hasAtasNamaInput = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return false;
      const inputs = Array.from(main.querySelectorAll('input'));
      const textMatch = main.innerText.includes('Atas Nama:');
      const inputMatch = inputs.some(i => (i.placeholder || '').toLowerCase().includes('nama pemesan'));
      return textMatch || inputMatch;
    });
    assert.strictEqual(hasAtasNamaInput, false, 'Main section must NOT have "Atas Nama" input anymore');
    console.log('✓ Gate 1: No "Atas Nama" input inside <main>');

    // 2. Verify Promo Makanan shows Mie Gacoan Level 2 promo card with Rp 10.000, strikethrough Rp 13.000, and Sisa 21 kuota
    const promoCardText = await page.$eval('[data-testid="promo-card-prod-1"]', el => el.innerText);
    const quotaText0 = await page.$eval('[data-testid="promo-card-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]', el => el.innerText);
    assert(promoCardText.includes('Mie Gacoan Level 2'), 'Promo card must render Mie Gacoan Level 2');
    assert(promoCardText.includes('10.000') && promoCardText.includes('13.000'), 'Promo card must display Rp 10.000 promo & Rp 13.000 original price');
    assert(quotaText0.includes('Sisa 21 kuota'), `Initial quota must be "Sisa 21 kuota", got "${quotaText0}"`);
    console.log(`✓ Gate 2: Promo Menu Card rendered with live quota "${quotaText0}"`);

    // 3. Click + Tambah on Mie Gacoan promo card -> opens Per-Menu Note Modal
    await page.click('[data-testid="promo-add-prod-1"]');
    await page.waitForSelector('[data-testid="menu-note-modal"]', { timeout: 5000 });
    await page.type('[data-testid="item-note-input"]', 'Tidak pedas, kuah dipisah');
    await new Promise(r => setTimeout(r, 300));

    const modalShotPath = path.join(ARTIFACTS_DIR, 'order_meja_note_modal.png');
    await page.screenshot({ path: modalShotPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${modalShotPath}`);
    console.log('✓ Gate 3: Per-Menu Note Modal opens when adding menu item');

    // 4. Confirm add -> note saved + quota drops 21 -> 20 immediately in UI & backend for other sessions
    await page.click('[data-testid="confirm-add-menu-btn"]');
    await page.waitForSelector('[data-testid="promo-card-prod-1"] [data-testid="edit-note-prod-1"]', { timeout: 5000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="promo-card-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]');
        return el && el.innerText.includes('Sisa 20 kuota');
      },
      { timeout: 5000 }
    );

    const noteChipText = await page.$eval('[data-testid="promo-card-prod-1"] [data-testid="edit-note-prod-1"]', el => el.innerText);
    assert(noteChipText.includes('Tidak pedas, kuah dipisah'), `Note chip must display saved note, got "${noteChipText}"`);

    const promoAfterAdd = await fetchPromoState('PROMO-FOOD-01');
    assert.strictEqual(promoAfterAdd.remainingQuota, 20, 'Other table must see remainingQuota === 20 while 1 unit is in cart');
    assert.strictEqual(promoAfterAdd.heldCount, 1, 'Backend heldCount must equal 1');

    await page.evaluate(() => {
      document.querySelector('[data-testid="promo-makanan-section"]')?.scrollIntoView({ block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));
    const promoHeldPath = path.join(ARTIFACTS_DIR, 'order_meja_promo_held.png');
    await page.screenshot({ path: promoHeldPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${promoHeldPath}`);
    console.log('✓ Gate 4: Cart add holds 1 quota (21 -> 20) in UI & API + persists per-menu note');

    // 5. Increment qty 1 -> 2 -> quota drops 20 -> 19
    await page.click('[data-testid="promo-card-prod-1"] [data-testid="qty-plus-prod-1"]');
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="promo-card-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]');
        return el && el.innerText.includes('Sisa 19 kuota');
      },
      { timeout: 5000 }
    );
    const promoAfterPlus = await fetchPromoState('PROMO-FOOD-01');
    assert.strictEqual(promoAfterPlus.remainingQuota, 19, 'Incrementing qty to 2 must drop remainingQuota to 19');
    assert.strictEqual(promoAfterPlus.heldCount, 2, 'heldCount must equal 2');
    console.log('✓ Gate 5: Increment qty 1 -> 2 holds 2nd quota (20 -> 19)');

    // 6. Decrement qty 2 -> 1 -> 0 -> quota returns 19 -> 20 -> 21
    await page.click('[data-testid="promo-card-prod-1"] [data-testid="qty-minus-prod-1"]');
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="promo-card-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]');
        return el && el.innerText.includes('Sisa 20 kuota');
      },
      { timeout: 5000 }
    );
    await page.click('[data-testid="promo-card-prod-1"] [data-testid="qty-minus-prod-1"]');
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="promo-card-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]');
        return el && el.innerText.includes('Sisa 21 kuota');
      },
      { timeout: 5000 }
    );
    const promoAfterRemove = await fetchPromoState('PROMO-FOOD-01');
    assert.strictEqual(promoAfterRemove.remainingQuota, 21, 'Removing item from cart must restore remainingQuota back to 21');
    assert.strictEqual(promoAfterRemove.heldCount, 0, 'heldCount must drop back to 0');
    console.log('✓ Gate 6: Decrementing & removing from cart releases held quota back (19 -> 20 -> 21)');

    // 7. Re-add 1 Mie Gacoan with note "Pedas sedang" -> Submit order without customer name
    await page.click('[data-testid="promo-add-prod-1"]');
    await page.waitForSelector('[data-testid="item-note-input"]', { timeout: 5000 });
    await page.type('[data-testid="item-note-input"]', 'Pedas sedang');
    await page.click('[data-testid="confirm-add-menu-btn"]');
    await page.waitForSelector('[data-testid="submit-order-btn"]', { timeout: 5000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="promo-card-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]');
        return el && el.innerText.includes('Sisa 20 kuota');
      },
      { timeout: 5000 }
    );

    await page.click('[data-testid="submit-order-btn"]');
    await page.waitForFunction(
      () => (document.body.textContent || '').toUpperCase().includes('STATUS PESANAN MEJA'),
      { timeout: 10000 }
    );
    await new Promise(r => setTimeout(r, 500));

    assert.strictEqual(dialogAppeared, false, 'Order placement must succeed with zero browser alerts/dialogs');
    assert(lastCreatedOrder && lastCreatedOrder.id, 'POST /api/pos/orders response must be captured');
    assert.strictEqual(lastCreatedOrder.customerName, 'Meja 01', `Expected customerName "Meja 01", got "${lastCreatedOrder.customerName}"`);
    assert.strictEqual(lastCreatedOrder.items?.[0]?.notes, 'Pedas sedang', `Expected item note "Pedas sedang", got "${lastCreatedOrder.items?.[0]?.notes}"`);
    assert.strictEqual(lastCreatedOrder.promoDiscount, 3000, `Expected promoDiscount 3000, got ${lastCreatedOrder.promoDiscount}`);

    const promoAfterCheckout = await fetchPromoState('PROMO-FOOD-01');
    assert.strictEqual(promoAfterCheckout.usedCount, 5, 'Checkout must convert 1 hold into permanent usedCount (4 -> 5)');
    assert.strictEqual(promoAfterCheckout.heldCount, 0, 'Session hold must be cleared after checkout (no double deduction)');
    assert.strictEqual(promoAfterCheckout.remainingQuota, 20, 'Remaining quota after checkout must remain 20 (zero double deduction)');
    console.log('✓ Gate 7: Order auto-uses "Meja 01", persists per-item note, and converts hold cleanly without double deduction!');

    console.log('🎉 ALL PROMO HOLD + PER-MENU NOTES + AUTO TABLE NAME E2E TESTS PASSED!');
  } finally {
    if (browser) await browser.close();
    previewServer.kill('SIGTERM');
    backendServer.close();
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
