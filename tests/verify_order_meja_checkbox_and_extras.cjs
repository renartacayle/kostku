const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');
const backendApp = require('../backend/server');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/9b01eb42-92f6-4beb-a90f-e390a58ab3b3';
const DEMO_DB_PATH = path.join(__dirname, '../backend/demo_db.json');

async function runTest() {
  console.log('--- 🧪 STARTING E2E VERIFICATION: OWNER EXTRAS + CHECKBOX COMMON QUESTIONS + TAMPER-SAFE PRICING ---');

  const demoDbBackup = fs.readFileSync(DEMO_DB_PATH, 'utf8');

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

    // ── GATE 1: Owner UI in Kasir adds & manages Extra & Topping ──
    const ownerPage = await browser.newPage();
    await ownerPage.setViewport({ width: 1280, height: 800 });
    await ownerPage.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await ownerPage.evaluate(() => {
      const user = {
        id: 1790948804999,
        name: 'Bu Siti (Warung & Laundry Bu Siti)',
        role: 'mitra',
        merchantId: 'MTR-KASIR-MASTER',
        email: 'mitra@kostku.id',
        isDemo: true,
        umkmRegistered: true
      };
      localStorage.setItem('kostUser', JSON.stringify(user));
      localStorage.setItem('kostku_auth_token', 'demo_token_123');
      localStorage.setItem('kostku_is_demo_mode', 'true');
    });

    await ownerPage.goto('http://localhost:4173/kasir?tab=pos', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await ownerPage.waitForSelector('[data-testid="sidebar-extras-btn"]', { timeout: 12000 });
    await ownerPage.click('[data-testid="sidebar-extras-btn"]');
    await ownerPage.waitForSelector('[data-testid="kasir-extras-panel"]', { timeout: 8000 });
    await ownerPage.waitForSelector('[data-testid="kasir-extra-card-ext-demo-kerupuk"]', { timeout: 8000 });

    await ownerPage.type('[data-testid="extra-name-input"]', 'Extra Bakso Sapi');
    await ownerPage.type('[data-testid="extra-price-input"]', '3500');
    await ownerPage.select('[data-testid="extra-scope-select"]', 'ALL');
    await ownerPage.click('[data-testid="save-extra-btn"]');

    await ownerPage.waitForFunction(() => {
      const panel = document.querySelector('[data-testid="kasir-extras-panel"]');
      return panel && panel.innerText.includes('Extra Bakso Sapi') && panel.innerText.includes('3.500');
    }, { timeout: 8000 });
    await new Promise(r => setTimeout(r, 300));
    const kasirShot = path.join(ARTIFACTS_DIR, 'kasir_extras_management.png');
    await ownerPage.screenshot({ path: kasirShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${kasirShot}`);
    await ownerPage.close();
    console.log('✓ Gate 1: Kasir Owner UI created "Extra Bakso Sapi" (+Rp 3.500) & loaded seeded Extra Kerupuk');

    // ── GATE 2: Owner updates per-menu extra on prod-1 (Mie Gacoan Level 2) ──
    const putProdRes = await fetch('http://localhost:3001/api/pos/products/prod-1?demo=true', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extras: [
          { id: 'pext-keju', name: 'Extra Keju Parut', price: 2500, isAvailable: true }
        ]
      })
    });
    assert(putProdRes.ok, 'PUT /api/pos/products/prod-1 must succeed');
    const updatedProd = await putProdRes.json();
    assert.strictEqual(updatedProd.extras.length, 1, 'Product must store sanitized per-menu extra');
    console.log('✓ Gate 2: Owner saved per-menu Extra Keju Parut (+Rp 2.500) on Mie Gacoan Level 2');

    // ── GATE 3: OrderMeja Mobile UI — Common Question Checkboxes + Paid Extras Modal ──
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    let lastCreatedOrder = null;
    page.on('response', async (res) => {
      if (
        res.url().includes('/api/pos/orders') &&
        res.request().method() === 'POST' &&
        !res.url().includes('/pay') &&
        !res.url().includes('/confirm') &&
        !res.url().includes('/spin')
      ) {
        try {
          lastCreatedOrder = await res.json();
        } catch (_) {}
      }
    });

    await page.goto('http://localhost:4173/order/MEJA-01-TKN881?demo=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('[data-testid="promo-row-prod-1"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="promo-add-prod-1"]');
      return Boolean(btn);
    }, { timeout: 8000 });

    const initialQuota = await page.$eval('[data-testid="promo-row-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]', el => el.innerText);
    assert(initialQuota.includes('Sisa 21 kuota'), `Expected initial quota 21, got "${initialQuota}"`);

    // Scroll background page to verify scroll-lock & position restore when opening/closing bottom-sheet
    await page.evaluate(() => window.scrollTo(0, 220));
    await new Promise(r => setTimeout(r, 150));

    // Tap directly on the menu item title (not only + Tambah button) to verify full detail + description + extras sheet opens
    await page.click('[data-testid="promo-row-prod-1"] h4');
    await page.waitForSelector('[data-testid="menu-note-modal"]', { timeout: 6000 });
    await page.waitForSelector('[data-testid="menu-note-drag-handle"]', { timeout: 4000 });

    const lockCheck = await page.evaluate(() => {
      const body = document.querySelector('[data-testid="menu-note-scroll-body"]');
      return {
        bodyPos: document.body.style.position,
        bodyOverflow: document.body.style.overflow,
        htmlOverscroll: document.documentElement.style.overscrollBehavior,
        bodyOverscrollY: body ? window.getComputedStyle(body).overscrollBehaviorY : null
      };
    });
    assert.strictEqual(lockCheck.bodyPos, 'fixed', `Expected body.style.position='fixed' while modal open, got '${lockCheck.bodyPos}'`);
    assert.strictEqual(lockCheck.bodyOverflow, 'hidden', `Expected body.style.overflow='hidden' while modal open`);
    assert.strictEqual(lockCheck.htmlOverscroll, 'none', `Expected html.style.overscrollBehavior='none'`);
    assert.strictEqual(lockCheck.bodyOverscrollY, 'contain', `Expected modal scroll body overscrollBehaviorY='contain', got '${lockCheck.bodyOverscrollY}'`);

    // Swipe down (> 85px) on drag handle -> dismisses bottom-sheet & restores background scroll position cleanly
    await page.evaluate(() => {
      const handle = document.querySelector('[data-testid="menu-note-drag-handle"]');
      const r = handle.getBoundingClientRect();
      const cx = Math.round(r.left + r.width / 2);
      const emit = (type, y) => {
        const t = new Touch({ identifier: 1, target: handle, clientX: cx, clientY: y, pageX: cx, pageY: y });
        const list = type === 'touchend' ? [] : [t];
        handle.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: list, targetTouches: list, changedTouches: [t] }));
      };
      emit('touchstart', 200);
      emit('touchmove', 270);
      emit('touchmove', 340);
      emit('touchend', 340);
    });
    await page.waitForFunction(() => !document.querySelector('[data-testid="menu-note-modal"]'), { timeout: 5000 });
    await new Promise(r => setTimeout(r, 150));

    const postDismiss = await page.evaluate(() => ({
      bodyPos: document.body.style.position,
      scrollY: Math.round(window.scrollY)
    }));
    assert.strictEqual(postDismiss.bodyPos, '', `Expected body.style.position='' after swipe dismiss`);
    assert(postDismiss.scrollY >= 180, `Expected background scrollY >= 180 restored after dismiss, got ${postDismiss.scrollY}`);

    // Re-open modal and verify full description, checkboxes & multi-qty extras
    await page.click('[data-testid="promo-row-prod-1"] h4');
    await page.waitForSelector('[data-testid="menu-note-modal"]', { timeout: 6000 });
    await page.waitForSelector('[data-testid="menu-modal-description"]', { timeout: 5000 });
    const modalDesc = await page.$eval('[data-testid="menu-modal-description"]', el => el.innerText);
    assert(modalDesc.includes('Mie pedas gurih manis'), `Expected full menu description in modal, got "${modalDesc}"`);
    await page.waitForSelector('[data-testid="common-q-0"] input[type="checkbox"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="extra-option-ext-demo-kerupuk"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="extra-option-pext-keju"]', { timeout: 5000 });
    const modalExtrasText = await page.$eval('[data-testid="menu-note-modal"]', el => el.innerText);
    assert(modalExtrasText.includes('Extra Bakso Sapi'), 'Modal must display Owner-created "Extra Bakso Sapi" from Gate 1');

    // Check common questions: "Tidak Pedas" (0) & "Kuah Dipisah" (3)
    await page.click('[data-testid="common-q-0"]');
    await page.click('[data-testid="common-q-3"]');

    // Step Extra Kerupuk (+2.000) via -/+ stepper: 0 -> 1 -> 2 -> 3 -> 2 -> 3
    await page.click('[data-testid="extra-plus-ext-demo-kerupuk"]');
    await page.waitForSelector('[data-testid="extra-qty-ext-demo-kerupuk"]', { timeout: 3000 });
    await page.click('[data-testid="extra-plus-ext-demo-kerupuk"]');
    await page.click('[data-testid="extra-plus-ext-demo-kerupuk"]');
    await page.click('[data-testid="extra-minus-ext-demo-kerupuk"]');
    const kerupukQtyMid = await page.$eval('[data-testid="extra-qty-ext-demo-kerupuk"]', el => el.innerText.trim());
    assert.strictEqual(kerupukQtyMid, '2', `Expected Kerupuk qty 2 after minus, got ${kerupukQtyMid}`);
    await page.click('[data-testid="extra-plus-ext-demo-kerupuk"]');
    const kerupukQtyFinal = await page.$eval('[data-testid="extra-qty-ext-demo-kerupuk"]', el => el.innerText.trim());
    assert.strictEqual(kerupukQtyFinal, '3', `Expected Kerupuk qty 3 after plus, got ${kerupukQtyFinal}`);

    // Add 1x Extra Keju Parut (+2.500)
    await page.click('[data-testid="extra-plus-pext-keju"]');

    // Optional extra custom text note
    await page.type('[data-testid="item-note-input"]', 'Sambal dipisah');
    await new Promise(r => setTimeout(r, 250));

    // Verify common checkbox state & live total on CTA button: 10000 promo + (3*2000) + 2500 = 18500
    const modalBtnText = await page.$eval('[data-testid="confirm-add-menu-btn"]', el => el.innerText);
    assert(modalBtnText.includes('18.500'), `Modal CTA must display live total Rp 18.500, got "${modalBtnText}"`);

    const q0Checked = await page.$eval('[data-testid="common-q-0"] input[type="checkbox"]', el => el.checked);
    assert.strictEqual(q0Checked, true, 'Common question checkbox must be checked');

    const modalShot = path.join(ARTIFACTS_DIR, 'order_meja_checkbox_extras_modal.png');
    await page.screenshot({ path: modalShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${modalShot}`);
    console.log('✓ Gate 3: Common checkboxes + -/+ Extra steppers (3x Extra Kerupuk, 1x Keju) updated live modal total to Rp 18.500');

    // ── GATE 4: Add to Cart -> Promo Hold (21 -> 20) + Cart Drawer Breakdown ──
    await page.click('[data-testid="confirm-add-menu-btn"]');
    await page.waitForFunction(() => !document.querySelector('[data-testid="menu-note-modal"]'), { timeout: 5000 });
    await page.waitForSelector('[data-testid="promo-row-prod-1"] [data-testid="edit-note-prod-1"]', { timeout: 6000 });

    const chipText = await page.$eval('[data-testid="promo-row-prod-1"] [data-testid="edit-note-prod-1"]', el => el.innerText);
    assert(chipText.includes('8.500') && chipText.includes('Tidak Pedas'), `Note & extras chip unexpected: "${chipText}"`);

    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="promo-row-prod-1"] [data-testid="promo-quota-PROMO-FOOD-01"]');
      return el && el.innerText.includes('Sisa 20 kuota');
    }, { timeout: 6000 });

    // Open cart drawer & verify extras + price breakdown
    await page.waitForSelector('[data-testid="toggle-cart-drawer-btn"]', { timeout: 6000 });
    await page.click('[data-testid="toggle-cart-drawer-btn"]');
    await new Promise(r => setTimeout(r, 400));

    const drawerText = await page.evaluate(() => document.body.innerText);
    assert(
      drawerText.includes('3x Extra Kerupuk') &&
      drawerText.includes('6.000') &&
      drawerText.includes('Extra Keju Parut') &&
      drawerText.includes('Tidak Pedas, Kuah Dipisah, Sambal dipisah') &&
      drawerText.includes('18.500'),
      'Cart drawer must display 3x Extra Kerupuk (+Rp 6.000), Extra Keju Parut, checkbox notes, and total Rp 18.500'
    );

    const cartShot = path.join(ARTIFACTS_DIR, 'order_meja_extras_in_cart.png');
    await page.screenshot({ path: cartShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${cartShot}`);
    console.log('✓ Gate 4: Cart Drawer displays 3x Extra Kerupuk, checkbox notes, Rp 18.500 total & promo held 21 -> 20');

    // ── GATE 5: Checkout Order -> Verify DB Order Payload & Active Tracking UI ──
    lastCreatedOrder = null;
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Pesan Sekarang ke Dapur'));
      if (btn) btn.click();
    });

    await page.waitForFunction(() => Boolean(document.body.innerText.includes('Menunggu ACC Dapur') || document.body.innerText.includes('Siap Dibayar')), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 400));

    assert(lastCreatedOrder && lastCreatedOrder.id, 'Order must be created');
    assert.strictEqual(lastCreatedOrder.customerName, 'Meja 01', `Expected Meja 01, got ${lastCreatedOrder.customerName}`);
    assert.strictEqual(lastCreatedOrder.subtotal, 21500, `Expected subtotal 21500, got ${lastCreatedOrder.subtotal}`);
    assert.strictEqual(lastCreatedOrder.promoDiscount, 3000, `Expected promoDiscount 3000, got ${lastCreatedOrder.promoDiscount}`);
    assert.strictEqual(lastCreatedOrder.totalAmount, 18500, `Expected totalAmount 18500, got ${lastCreatedOrder.totalAmount}`);
    assert.strictEqual(lastCreatedOrder.items[0].extrasUnitTotal, 8500, 'extrasUnitTotal must equal 8500');
    assert.strictEqual(lastCreatedOrder.items[0].extras.length, 2, 'Order item must persist 2 extras');
    const kerupukSaved = lastCreatedOrder.items[0].extras.find(e => e.id === 'ext-demo-kerupuk');
    assert(kerupukSaved && kerupukSaved.qty === 3 && kerupukSaved.subtotal === 6000, 'Saved Extra Kerupuk must have qty 3 & subtotal 6000');
    assert.strictEqual(lastCreatedOrder.items[0].notes, 'Tidak Pedas, Kuah Dipisah, Sambal dipisah');
    assert.strictEqual(dialogAppeared, false, 'No native browser dialogs should appear');

    // Transition order via Kasir ACC + Confirm Payment -> PREPARING to verify live customer tracker renders extras & notes
    const accRes = await fetch(`http://localhost:3001/api/pos/orders/${lastCreatedOrder.id}/acc?demo=true`, { method: 'POST' });
    assert(accRes.ok, 'POST /acc must succeed');
    const confirmPayRes = await fetch(`http://localhost:3001/api/pos/orders/${lastCreatedOrder.id}/confirm-payment?demo=true`, { method: 'POST' });
    assert(confirmPayRes.ok, 'POST /confirm-payment must succeed');

    await page.waitForFunction(() => Boolean((document.body.textContent || '').includes('Status Kesiapan Tiap Menu')), { timeout: 10000 });
    const activeOrderText = await page.evaluate(() => document.body.textContent || '');
    assert(
      activeOrderText.includes('3x Extra Kerupuk') &&
      activeOrderText.includes('Extra Keju Parut') &&
      activeOrderText.includes('Tidak Pedas, Kuah Dipisah, Sambal dipisah'),
      'Active PREPARING order tracker must display 3x Extra Kerupuk and composed checkbox notes'
    );
    console.log(`✓ Gate 5: Checkout persisted Meja 01 order (${lastCreatedOrder.id}) with Rp 18.500 total, 3x Extra Kerupuk & live PREPARING UI`);

    // ── GATE 6: Server-Side Price & Negative-Qty Tamper Resistance ──
    const tamperRes = await fetch('http://localhost:3001/api/pos/orders?demo=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableToken: 'MEJA-01-TKN881',
        items: [
          {
            productId: 'prod-1',
            qty: 1,
            notes: 'Tidak Pedas',
            selectedExtras: [
              { id: 'ext-demo-kerupuk', name: 'Free Hacked Kerupuk', price: 0, qty: 3 },
              { id: 'ext-demo-telur', name: 'Negative Hacked Telur', price: 0, qty: -2 },
              { id: 'ext-fake-does-not-exist', name: 'Fake Extra', price: 1, qty: 5 }
            ]
          }
        ],
        appliedPromoIds: ['PROMO-FOOD-01']
      })
    });
    assert(tamperRes.ok, 'Tamper test order request must complete cleanly');
    const tamperedOrder = await tamperRes.json();
    assert.strictEqual(tamperedOrder.items[0].extras.length, 1, 'Unknown fake extra and negative qty extra must be stripped by server');
    assert.strictEqual(tamperedOrder.items[0].extras[0].price, 2000, 'Server must override tampered client price 0 with DB price 2000');
    assert.strictEqual(tamperedOrder.items[0].extras[0].qty, 3, 'Server must keep valid qty 3');
    assert.strictEqual(tamperedOrder.items[0].extras[0].subtotal, 6000, 'Server extra subtotal must be 2000 * 3 = 6000');
    assert.strictEqual(tamperedOrder.items[0].extrasUnitTotal, 6000, 'Server extrasUnitTotal must equal 6000');
    assert.strictEqual(tamperedOrder.items[0].subtotal, 19000, 'Server item subtotal must be 13000 + 6000 = 19000');
    assert.strictEqual(tamperedOrder.promoDiscount, 3000, 'Base promo discount remains 3000');
    assert.strictEqual(tamperedOrder.totalAmount, 16000, 'Server totalAmount must equal 19000 - 3000 = 16000');
    console.log('✓ Gate 6: Server enforced authoritative multi-qty Extra pricing & stripped negative/fake extras (2000*3=6000, total 16000)');

    console.log('\n🎉 ALL 6 OWNER EXTRAS + CHECKBOX QUESTIONS + TAMPER-SAFE PRICING GATES PASSED!');
  } finally {
    if (browser) await browser.close();
    previewServer.kill('SIGTERM');
    backendServer.close();
    fs.writeFileSync(DEMO_DB_PATH, demoDbBackup, 'utf8');
    console.log('🧹 Restored clean demo_db.json');
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E CHECKBOX & EXTRAS VERIFICATION FAILED:', err);
    process.exit(1);
  });
