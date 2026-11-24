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
  console.log('--- 🧪 STARTING E2E VERIFICATION: PHONE MODE OWNER SETUP (EXTRAS + EDIT MENU) ---');

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

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
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

    // ── GATE 1: Mobile 390x844 Extra & Topping Tab (/kasir?tab=extras) ──
    await page.goto('http://localhost:4173/kasir?tab=extras', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('[data-testid="kasir-extras-panel"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="mobile-extras-tabs"]', { timeout: 6000 });
    await page.waitForSelector('[data-testid="kasir-extra-card-ext-demo-kerupuk"]', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 400));

    const gate1List = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="kasir-extras-panel"]');
      const panelCS = window.getComputedStyle(panel);
      const tabsEl = document.querySelector('[data-testid="mobile-extras-tabs"]');
      const tabsRect = tabsEl.getBoundingClientRect();
      const formInput = document.querySelector('[data-testid="extra-name-input"]');
      const formContainer = formInput ? formInput.closest('.kasir-extras-mobile-hidden') : null;
      const cards = Array.from(document.querySelectorAll('[data-testid^="kasir-extra-card-"]'));
      const cardRects = cards.map(c => {
        const r = c.getBoundingClientRect();
        return { testid: c.getAttribute('data-testid'), width: Math.round(r.width), right: Math.round(r.right), height: Math.round(r.height) };
      });
      const kerupukCard = document.querySelector('[data-testid="kasir-extra-card-ext-demo-kerupuk"]');
      const kerupukBtns = Array.from(kerupukCard.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        height: Math.round(b.getBoundingClientRect().height),
        width: Math.round(b.getBoundingClientRect().width)
      }));
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        paddingBottom: parseFloat(panelCS.paddingBottom) || 0,
        tabsVisible: tabsRect.width >= 340 && tabsRect.height >= 40,
        formHidden: formContainer ? window.getComputedStyle(formContainer).display === 'none' : formInput.offsetHeight === 0,
        cardCount: cards.length,
        cardRects,
        kerupukBtns
      };
    });

    assert(gate1List.scrollWidth <= gate1List.clientWidth, `Mobile Extras list overflow: ${gate1List.scrollWidth} > ${gate1List.clientWidth}`);
    assert(gate1List.tabsVisible, 'Segmented tabs [mobile-extras-tabs] must be visible on mobile');
    assert(gate1List.formHidden, 'Form card must be hidden by default when Daftar tab is active on mobile');
    assert.strictEqual(gate1List.cardCount, 4, `Expected 4 seeded extra cards, got ${gate1List.cardCount}`);
    assert(gate1List.cardRects.every(c => c.width > 300 && c.right <= 390), `Card overflowed 390px: ${JSON.stringify(gate1List.cardRects)}`);
    assert(gate1List.kerupukBtns.length === 3 && gate1List.kerupukBtns.every(b => b.height >= 34), `Action buttons must be >= 34px tall: ${JSON.stringify(gate1List.kerupukBtns)}`);
    assert(gate1List.paddingBottom >= 100, `Bottom padding must be >= 100px above bottom nav, got ${gate1List.paddingBottom}`);

    const listShot = path.join(ARTIFACTS_DIR, 'kasir_extras_mobile_list.png');
    await page.screenshot({ path: listShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${listShot}`);

    // Switch to "+ Tambah Baru" tab
    await page.click('[data-testid="mobile-extras-tab-form"]');
    await new Promise(r => setTimeout(r, 250));

    const gate1Form = await page.evaluate(() => {
      const nameR = document.querySelector('[data-testid="extra-name-input"]').getBoundingClientRect();
      const priceR = document.querySelector('[data-testid="extra-price-input"]').getBoundingClientRect();
      const scopeR = document.querySelector('[data-testid="extra-scope-select"]').getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        nameWidth: Math.round(nameR.width),
        priceWidth: Math.round(priceR.width),
        scopeWidth: Math.round(scopeR.width)
      };
    });

    assert(gate1Form.scrollWidth <= gate1Form.clientWidth, `Mobile Extras form overflow: ${gate1Form.scrollWidth} > ${gate1Form.clientWidth}`);
    assert(gate1Form.nameWidth >= 280, `extra-name-input width must be >= 280px, got ${gate1Form.nameWidth}`);
    assert(gate1Form.priceWidth >= 280, `extra-price-input width must be >= 280px, got ${gate1Form.priceWidth}`);
    assert(gate1Form.scopeWidth >= 280, `extra-scope-select width must be >= 280px, got ${gate1Form.scopeWidth}`);

    const formShot = path.join(ARTIFACTS_DIR, 'kasir_extras_mobile_form.png');
    await page.screenshot({ path: formShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${formShot}`);

    // Create "Extra Kerupuk Bawang" + Rp 2.500 and verify auto-return to list
    await page.type('[data-testid="extra-name-input"]', 'Extra Kerupuk Bawang');
    await page.type('[data-testid="extra-price-input"]', '2500');
    await page.click('[data-testid="save-extra-btn"]');

    await page.waitForFunction(() => {
      const panel = document.querySelector('[data-testid="kasir-extras-panel"]');
      const cards = Array.from(document.querySelectorAll('[data-testid^="kasir-extra-card-"]'));
      return panel && panel.innerText.includes('Extra Kerupuk Bawang') && cards.some(c => c.innerText.includes('Extra Kerupuk Bawang') && c.getBoundingClientRect().height > 0);
    }, { timeout: 8000 });

    const afterSaveOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    assert(afterSaveOverflow.scrollWidth <= afterSaveOverflow.clientWidth, 'Overflow after saving new Extra on mobile');

    // Click Edit on "Extra Kerupuk Bawang" and verify auto-switch to populated form
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="kasir-extra-card-"]'));
      const target = cards.find(c => c.innerText.includes('Extra Kerupuk Bawang'));
      if (!target) throw new Error('New Extra Kerupuk Bawang card not found');
      const editBtn = Array.from(target.querySelectorAll('button')).find(b => b.innerText.trim() === 'Edit');
      if (!editBtn) throw new Error('Edit button missing on new card');
      editBtn.click();
    });

    await page.waitForFunction(() => {
      const input = document.querySelector('[data-testid="extra-name-input"]');
      return input && input.getBoundingClientRect().height > 0 && input.value === 'Extra Kerupuk Bawang';
    }, { timeout: 5000 });
    console.log('✓ Gate 1: Mobile 390x844 Extra & Topping segmented UI, presets/stacking, save->list & edit->form transitions work cleanly');

    // ── GATE 2: Mobile 390x844 Edit Menu Bottom-Sheet Modal (/kasir?tab=pos) ──
    let putProductMeta = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/pos/products/prod-1') && res.request().method() === 'PUT') {
        let jsonBody = null;
        try {
          jsonBody = await res.json();
        } catch (_) {}
        putProductMeta = {
          status: res.status(),
          xDemoMode: res.request().headers()['x-demo-mode'] || null,
          body: jsonBody
        };
      }
    });

    await page.goto('http://localhost:4173/kasir?tab=pos', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('button[aria-label="Edit Mie Gacoan Level 2"]', { timeout: 10000 });
    await page.click('button[aria-label="Edit Mie Gacoan Level 2"]');
    await page.waitForSelector('.kasir-menu-modal-sheet', { timeout: 6000 });
    await new Promise(r => setTimeout(r, 250));

    const modalGeometry = await page.evaluate(() => {
      const sheet = document.querySelector('.kasir-menu-modal-sheet');
      const sheetR = sheet.getBoundingClientRect();
      const spans = Array.from(sheet.querySelectorAll('span'));
      const pillSpan = spans.find(s => /Siap Dipakai|Wajib Diunggah/i.test(s.innerText || ''));
      const pillHeight = pillSpan ? Math.round(pillSpan.getBoundingClientRect().height) : 999;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        sheetWidth: Math.round(sheetR.width),
        sheetBottom: Math.round(sheetR.bottom),
        pillHeight
      };
    });

    assert(modalGeometry.scrollWidth <= modalGeometry.clientWidth, `Modal overflow: ${modalGeometry.scrollWidth} > ${modalGeometry.clientWidth}`);
    assert(modalGeometry.sheetWidth >= 380 && modalGeometry.sheetBottom >= 835, `Expected mobile bottom-sheet geometry: ${JSON.stringify(modalGeometry)}`);
    assert(modalGeometry.pillHeight <= 32, `Foto Produk status pill must stay single-line (<= 32px), got ${modalGeometry.pillHeight}px`);

    // Add per-menu extra row and verify 2-row mobile stacking
    await page.click('[data-testid="add-menu-extra-row-btn"]');
    await page.waitForSelector('.kasir-menu-extra-row .kasir-menu-extra-name', { timeout: 4000 });

    const extraRowGeometry = await page.evaluate(() => {
      const nameR = document.querySelector('.kasir-menu-extra-row .kasir-menu-extra-name').getBoundingClientRect();
      const priceR = document.querySelector('.kasir-menu-extra-row .kasir-menu-extra-price').getBoundingClientRect();
      return {
        nameWidth: Math.round(nameR.width),
        nameBottom: Math.round(nameR.bottom),
        priceTop: Math.round(priceR.top),
        priceWidth: Math.round(priceR.width)
      };
    });

    assert(extraRowGeometry.nameWidth >= 260, `Expected full-width extra name input (>= 260px), got ${extraRowGeometry.nameWidth}`);
    assert(extraRowGeometry.priceTop > extraRowGeometry.nameBottom - 2, `Expected price input on row 2 below name: ${JSON.stringify(extraRowGeometry)}`);

    await page.type('.kasir-menu-extra-row .kasir-menu-extra-name', 'Extra Sambal Ijo');
    await page.type('.kasir-menu-extra-row .kasir-menu-extra-price', '2000');
    await page.type('[data-testid="menu-extras-editor"] input[placeholder*="Tidak Pedas"]', 'Tidak Pedas, Kuah Dipisah');

    await page.waitForSelector('[data-testid="common-notes-preview"]', { timeout: 4000 });
    const previewChipsCount = await page.$$eval('[data-testid="common-notes-preview"] > span', els => els.length);
    assert.strictEqual(previewChipsCount, 2, `Expected 2 preview checkbox chips, got ${previewChipsCount}`);

    await page.evaluate(() => {
      const editor = document.querySelector('[data-testid="menu-extras-editor"]');
      if (editor) editor.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 300));

    const modalShot = path.join(ARTIFACTS_DIR, 'kasir_edit_menu_mobile.png');
    await page.screenshot({ path: modalShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${modalShot}`);

    // Submit Simpan Perubahan and verify PUT HTTP 200 with x-demo-mode: true
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.kasir-menu-modal-sheet form button[type="submit"]'));
      const submitBtn = btns.find(b => b.innerText.includes('Simpan Perubahan'));
      if (!submitBtn) throw new Error('Simpan Perubahan button not found');
      submitBtn.click();
    });

    await page.waitForFunction(() => !document.querySelector('[data-testid="menu-extras-editor"]'), { timeout: 8000 });
    await new Promise(r => setTimeout(r, 350));

    assert(putProductMeta, 'PUT /api/pos/products/prod-1 request was not captured');
    assert.strictEqual(putProductMeta.status, 200, `Expected HTTP 200 on PUT product, got ${putProductMeta.status}`);
    assert.strictEqual(putProductMeta.xDemoMode, 'true', `Expected x-demo-mode: true header, got ${putProductMeta.xDemoMode}`);
    assert(putProductMeta.body && Array.isArray(putProductMeta.body.extras) && putProductMeta.body.extras.some(e => e.name === 'Extra Sambal Ijo' && e.price === 2000), 'Saved per-menu extra missing');
    assert.deepStrictEqual(putProductMeta.body.commonNotes, ['Tidak Pedas', 'Kuah Dipisah'], 'Saved commonNotes mismatch');

    console.log('✓ Gate 2: Mobile 390x844 Edit Menu bottom-sheet, stacked extra row, preview chips & PUT x-demo-mode persist passed');
    console.log('\n🎉 ALL PHONE MODE OWNER SETUP E2E GATES PASSED!');
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
    console.error('❌ E2E PHONE OWNER SETUP VERIFICATION FAILED:', err);
    process.exit(1);
  });
