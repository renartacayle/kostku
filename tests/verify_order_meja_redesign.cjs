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
  console.log('--- 🧪 STARTING ORDER MEJA REDESIGN VERIFICATION ---');

  const demoDbBackup = fs.readFileSync(DEMO_DB_PATH, 'utf8');

  // 1. Start backend server on port 3001
  const backendServer = http.createServer(backendApp);
  await new Promise(resolve => backendServer.listen(3001, resolve));
  console.log('✅ Backend API running on port 3001');

  // 2. Spawn Vite Preview server on port 4173
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
    // Simulate Mobile Viewport (Android Xiaomi / 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // Navigate to Order Meja with valid table token and demo mode
    console.log('📱 Navigating to http://localhost:4173/order/MEJA-01-TKN881?demo=true ...');
    await page.goto('http://localhost:4173/order/MEJA-01-TKN881?demo=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('main', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Check Store Hero Card (Store name, rating, reviews, description)
    const storeHero = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return null;
      const text = main.innerText;
      return {
        hasStoreName: text.includes('Kantin') || text.includes('KostKu'),
        hasStarRating: text.includes('4.9') || text.includes('ulasan'),
        hasDescription: text.includes('Kantin lezat') || text.includes('higienis'),
        hasVerifiedBadge: text.includes('Terverifikasi') || text.includes('Self-Order')
      };
    });
    console.log('Store Hero Evaluation:', storeHero);
    assert(storeHero && storeHero.hasStarRating, 'Store Hero with star rating must exist');

    // Screenshot 1: Top Hero & View Mode Switcher
    const screenshotTopPath = path.join(ARTIFACTS_DIR, 'order_meja_top_hero.png');
    await page.screenshot({ path: screenshotTopPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${screenshotTopPath}`);

    // 2. Check View Mode Switcher (Default List Mode + No Typo + Switcher Order)
    const viewModeButtons = await page.evaluate(() => {
      const mainText = document.querySelector('main')?.innerText || '';
      const gridBtn = document.querySelector('[data-testid="view-mode-grid"]');
      const listBtn = document.querySelector('[data-testid="view-mode-list"]');
      const listRect = listBtn?.getBoundingClientRect();
      const gridRect = gridBtn?.getBoundingClientRect();
      return {
        hasGridBtn: !!gridBtn,
        hasListBtn: !!listBtn,
        defaultListActive: mainText.includes('List Ramping (Daftar)') && !mainText.includes('Kotak Box Box'),
        listBeforeGrid: listRect && gridRect ? listRect.left < gridRect.left : false,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    console.log('ViewMode Switcher Evaluation:', viewModeButtons);
    assert(viewModeButtons.hasGridBtn && viewModeButtons.hasListBtn, 'View mode toggle buttons must exist');
    assert(viewModeButtons.defaultListActive, 'Default view mode must be List Ramping (Daftar) without Kotak Box Box typo');
    assert(viewModeButtons.listBeforeGrid, 'List button must appear before Kotak Box button');
    assert(viewModeButtons.scrollWidth <= viewModeButtons.clientWidth, 'Initial mobile load must have zero horizontal overflow');

    // 3. Check Promo Section (Vertical Unclipped List & Responsive Claim Status)
    const promoSection = await page.evaluate(() => {
      const main = document.querySelector('main');
      const textUpper = (main?.innerText || '').toUpperCase();
      return textUpper.includes('PROMO MAKANAN') || textUpper.includes('DISKON MEJA');
    });
    console.log('Promo Section Exists:', promoSection);
    assert(promoSection, 'Promo Makanan section must exist');

    // Click KENYANG5K on empty cart -> immediately shows Dipilih + 20.000 shortfall banner
    await page.waitForSelector('[data-testid="store-promo-pill-PROMO-FOOD-03"]', { timeout: 6000 });
    await page.evaluate(() => {
      document.querySelector('[data-testid="store-promo-pill-PROMO-FOOD-03"]').scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.click('[data-testid="store-promo-pill-PROMO-FOOD-03"]');
    await page.waitForSelector('[data-testid="store-promo-status"]', { timeout: 4000 });

    const claimedEmptyEval = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('[data-testid^="store-promo-pill-"]'));
      const kenPill = document.querySelector('[data-testid="store-promo-pill-PROMO-FOOD-03"]');
      const statusCard = document.querySelector('[data-testid="store-promo-status"]');
      return {
        pillText: kenPill?.innerText || '',
        statusText: statusCard?.innerText || '',
        allFitViewport: pills.every(p => p.getBoundingClientRect().right <= 390 && p.getBoundingClientRect().width >= 300),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    console.log('Claimed Store Promo on Empty Cart:', claimedEmptyEval);
    assert(claimedEmptyEval.pillText.includes('Dipilih'), 'Voucher card must immediately show Dipilih when clicked');
    assert(claimedEmptyEval.statusText.includes('20.000'), `Store promo status must show Rp 20.000 min order hint: "${claimedEmptyEval.statusText}"`);
    assert(claimedEmptyEval.allFitViewport, 'All Diskon Tambahan Keranjang cards must stack full-width cleanly within 390px');
    assert(claimedEmptyEval.scrollWidth <= claimedEmptyEval.clientWidth, 'No horizontal overflow after selecting store promo');

    // Screenshot 2: List Mode (Default) + Vertical Diskon Tambahan Keranjang + Live Status
    await new Promise(r => setTimeout(r, 300));
    const screenshotListPath = path.join(ARTIFACTS_DIR, 'order_meja_list_view.png');
    await page.screenshot({ path: screenshotListPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${screenshotListPath}`);

    // Add 2x Mie Gacoan Level 2 (Rp 26.000 >= Rp 20.000) -> KENYANG5K auto-activates!
    await page.click('[data-testid="promo-add-prod-1"]');
    await page.waitForSelector('[data-testid="menu-note-modal"]', { timeout: 5000 });
    await page.click('[data-testid="modal-qty-plus"]');
    await page.click('[data-testid="confirm-add-menu-btn"]');
    await page.waitForFunction(() => !document.querySelector('[data-testid="menu-note-modal"]'), { timeout: 5000 });
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-testid="store-promo-status"]');
      const pill = document.querySelector('[data-testid="store-promo-pill-PROMO-FOOD-03"]');
      return status && pill && pill.innerText.includes('Aktif') && status.innerText.includes('Hemat Rp 5.000');
    }, { timeout: 6000 });
    console.log('✓ KENYANG5K auto-activated (Hemat Rp 5.000) after cart subtotal reached Rp 26.000!');

    // Unselect KENYANG5K and remove test item cleanly before accordion/grid checks
    await page.click('[data-testid="store-promo-pill-PROMO-FOOD-03"]');

    // 4. Check Menu Baru & Rekomendasi Section
    const menuBaruSection = await page.evaluate(() => {
      const main = document.querySelector('main');
      const textUpper = (main?.innerText || '').toUpperCase();
      return textUpper.includes('MENU BARU') || textUpper.includes('REKOMENDASI');
    });
    console.log('Menu Baru Section Exists:', menuBaruSection);
    assert(menuBaruSection, 'Menu Baru & Rekomendasi section must exist');

    // 5. Check Category Accordion Dropdown (Default Kebuka!)
    const categoryAccordions = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('[data-testid^="category-header-"]'));
      return headers.map(h => ({
        id: h.getAttribute('data-testid'),
        text: h.innerText,
        isOpen: h.innerText.includes('Tutup') // If open, label is "Tutup"
      }));
    });
    console.log('Category Accordions Status (Default Open):', categoryAccordions);
    assert(categoryAccordions.length > 0, 'Category accordions must be rendered');
    const allDefaultOpen = categoryAccordions.every(c => c.isOpen);
    console.log(`All categories default open: ${allDefaultOpen}`);
    assert(allDefaultOpen, 'Categories must be default OPEN (kebuka)!');

    // 6. Switch to Grid Mode and capture screenshot, then switch back to List
    console.log('🔄 Switching to Grid view mode...');
    await page.click('[data-testid="view-mode-grid"]');
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => window.scrollTo(0, 620));
    await new Promise(r => setTimeout(r, 400));
    const screenshotGridPath = path.join(ARTIFACTS_DIR, 'order_meja_grid_view.png');
    await page.screenshot({ path: screenshotGridPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${screenshotGridPath}`);

    await page.click('[data-testid="view-mode-list"]');
    await new Promise(r => setTimeout(r, 400));

    // 7. Test closing and opening accordion
    console.log('🔄 Testing category accordion collapse & expand...');
    const firstCatHeader = await page.$('[data-testid^="category-header-"]');
    if (firstCatHeader) {
      await firstCatHeader.click();
      await new Promise(r => setTimeout(r, 500));
      const afterClickLabel = await page.evaluate(el => el.innerText, firstCatHeader);
      console.log('First Category after collapse click:', afterClickLabel);
      assert(afterClickLabel.includes('Buka'), 'Category should now be collapsed (label "Buka")');
      
      // Re-open it
      await firstCatHeader.click();
      await new Promise(r => setTimeout(r, 500));
      const afterReopenLabel = await page.evaluate(el => el.innerText, firstCatHeader);
      console.log('First Category after re-open click:', afterReopenLabel);
      assert(afterReopenLabel.includes('Tutup'), 'Category should now be re-opened (label "Tutup")');
    }

    console.log('🎉 ALL ORDER MEJA REDESIGN VERIFICATIONS PASSED SUCCESSFULLY!');
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
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
