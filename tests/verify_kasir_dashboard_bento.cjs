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
  console.log('--- 🧪 STARTING E2E VERIFICATION: KASIR DASHBOARD 3x2 BENTO GRID ---');

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

    // ── GATE 1: Desktop 1280x800 3x2 Bento Geometry ──
    await page.setViewport({ width: 1280, height: 800 });
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

    await page.goto('http://localhost:4173/kasir?tab=dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('[data-testid="kasir-dashboard-bento"]', { timeout: 12000 });
    await new Promise(r => setTimeout(r, 700));

    const desktopEval = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="kasir-dashboard-bento"]');
      const tiles = Array.from(document.querySelectorAll('[data-testid="kasir-dashboard-bento"] > .pos-dashboard-bento-tile'));
      const style = window.getComputedStyle(grid);
      const colCount = style.gridTemplateColumns.trim().split(/\s+/).length;
      const rects = tiles.map(t => {
        const r = t.getBoundingClientRect();
        return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
      });
      return {
        tileCount: tiles.length,
        colCount,
        rects,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    assert.strictEqual(desktopEval.tileCount, 6, `Expected exactly 6 bento tiles, got ${desktopEval.tileCount}`);
    assert.strictEqual(desktopEval.colCount, 3, `Expected 3 CSS grid columns at 1280px, got ${desktopEval.colCount}`);
    assert(desktopEval.scrollWidth <= desktopEval.clientWidth, `Desktop overflow: ${desktopEval.scrollWidth} > ${desktopEval.clientWidth}`);

    const [r0, r1, r2, r3, r4, r5] = desktopEval.rects;
    assert(Math.abs(r1.top - r0.top) <= 4 && Math.abs(r2.top - r0.top) <= 4, `Row 1 tiles misaligned: ${JSON.stringify([r0, r1, r2])}`);
    assert(Math.abs(r4.top - r3.top) <= 4 && Math.abs(r5.top - r3.top) <= 4, `Row 2 tiles misaligned: ${JSON.stringify([r3, r4, r5])}`);
    assert(r3.top > r0.top + 100, `Row 2 must sit cleanly below Row 1 (${r3.top} vs ${r0.top})`);
    assert(r0.left < r1.left && r1.left < r2.left, 'Row 1 tiles must order left-to-right across 3 columns');
    assert(r3.left < r4.left && r4.left < r5.left, 'Row 2 tiles must order left-to-right across 3 columns');

    const desktopShot = path.join(ARTIFACTS_DIR, 'kasir_dashboard_bento_desktop.png');
    await page.screenshot({ path: desktopShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${desktopShot}`);
    console.log('✓ Gate 1: Desktop 1280x800 renders 3x2 Bento Grid cleanly with zero horizontal overflow');

    // ── GATE 2: Interactive Controls & No Duplicated Staff Card ──
    await page.click('[data-testid="revenue-bubble-1"]');
    await new Promise(r => setTimeout(r, 200));
    const bubble1Pressed = await page.$eval('[data-testid="revenue-bubble-1"]', el => el.getAttribute('aria-pressed'));
    assert.strictEqual(bubble1Pressed, 'true', 'Bulanan bubble must be active after click');

    await page.click('[data-testid="revenue-bubble-2"]');
    await new Promise(r => setTimeout(r, 200));
    const bubble2Pressed = await page.$eval('[data-testid="revenue-bubble-2"]', el => el.getAttribute('aria-pressed'));
    assert.strictEqual(bubble2Pressed, 'true', 'Tahunan bubble must be active after click');
    await page.click('[data-testid="revenue-bubble-0"]');

    await page.click('[data-testid="receipt-scope-all"]');
    await new Promise(r => setTimeout(r, 150));
    await page.click('[data-testid="receipt-scope-active"]');

    const hasSaldoNota = await page.evaluate(() => Boolean(document.querySelector('[data-testid="dashboard-saldo-nota-value"]')));
    const hasTutupShift = await page.evaluate(() => Boolean(document.querySelector('[data-testid="open-tutup-shift-page-btn"]')));
    assert.strictEqual(hasSaldoNota && hasTutupShift, true, 'Saldo Nota and Tutup Shift controls must exist');

    const staffCardHeadingCount = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('[data-testid="kasir-dashboard-bento"] span, [data-testid="kasir-dashboard-bento"] h3'));
      return spans.filter(el => el.children.length === 0 && /tim online|karyawan yg online/i.test(el.textContent || '')).length;
    });
    assert.strictEqual(staffCardHeadingCount, 1, `Expected 1 unified Tim Online tile, found ${staffCardHeadingCount}`);
    console.log('✓ Gate 2: Interactive Bento toggles (Harian/Bulanan/Tahunan & Receipt Scope) work with 1 unified Tim Online tile');

    // ── GATE 3: Mobile 390x844 Hero-First Layout, Balanced KPI Pair, Segmented Tabs & Zero Overflow ──
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 400));

    const mobileInit = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          height: Math.round(r.height),
          display: cs.display,
          bg: cs.backgroundColor
        };
      };
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hero: rect(document.querySelector('[data-bento-tile="1"]')),
        kpi1: rect(document.querySelector('[data-bento-tile="2"]')),
        kpi2: rect(document.querySelector('[data-bento-tile="3"]')),
        tabs: rect(document.querySelector('[data-testid="mobile-dashboard-tabs"]')),
        terlaris: rect(document.querySelector('[data-bento-tile="4"]')),
        nota: rect(document.querySelector('[data-bento-tile="5"]')),
        ringkasan: rect(document.querySelector('[data-bento-tile="6"]')),
        heroHasShiftControl: Boolean(document.querySelector('[data-bento-tile="1"] [data-testid="mobile-tutup-shift-btn"], [data-bento-tile="1"] button'))
      };
    });

    assert(mobileInit.scrollWidth <= mobileInit.clientWidth, `Mobile overflow: ${mobileInit.scrollWidth} > ${mobileInit.clientWidth}`);
    assert(mobileInit.hero && mobileInit.hero.width >= 340 && mobileInit.hero.right <= 390, `Mobile Hero Omset must be full-width without overflow: ${JSON.stringify(mobileInit.hero)}`);
    assert.notStrictEqual(mobileInit.hero.bg, 'rgb(15, 23, 42)', 'Hero card must not be dark charcoal in Light Mode');
    assert(mobileInit.heroHasShiftControl, 'Mobile Hero Omset must contain integrated shift/period controls');
    assert(mobileInit.kpi1 && mobileInit.kpi2, 'Mobile KPI pair (Saldo Nota & Tim Online) must exist');
    assert(Math.abs(mobileInit.kpi2.top - mobileInit.kpi1.top) <= 4, `Mobile KPI pair misaligned vertically: ${mobileInit.kpi1.top} vs ${mobileInit.kpi2.top}`);
    assert(mobileInit.kpi1.right < mobileInit.kpi2.left && mobileInit.kpi2.right <= 390, `Mobile KPI pair must sit side-by-side cleanly: ${JSON.stringify([mobileInit.kpi1, mobileInit.kpi2])}`);
    assert(mobileInit.kpi1.top >= mobileInit.hero.bottom - 1, `KPI pair must sit below Hero card: kpi1.top=${mobileInit.kpi1.top}, hero.bottom=${mobileInit.hero.bottom}`);
    assert(mobileInit.tabs && mobileInit.tabs.width >= 340 && mobileInit.tabs.top >= mobileInit.kpi1.bottom - 1, `Segmented tabs bar invalid: ${JSON.stringify(mobileInit.tabs)}`);
    assert(mobileInit.nota && mobileInit.nota.width >= 340 && mobileInit.nota.right <= 390, `Default active sheet (Nota) must be full-width: ${JSON.stringify(mobileInit.nota)}`);
    assert(mobileInit.nota.bottom <= 780, `Hero + KPI pair + Tabs + Nota sheet must fit cleanly above bottom nav (nota.bottom=${mobileInit.nota.bottom} > 780)`);
    assert(mobileInit.terlaris && mobileInit.terlaris.display === 'none' && mobileInit.terlaris.width === 0, 'Inactive Terlaris sheet must be hidden on Nota tab');
    assert(mobileInit.ringkasan && mobileInit.ringkasan.display === 'none' && mobileInit.ringkasan.width === 0, 'Inactive Ringkasan sheet must be hidden on Nota tab');

    await page.click('[data-testid="mobile-dash-tab-terlaris"]');
    await new Promise(r => setTimeout(r, 200));
    const afterTerlaris = await page.evaluate(() => {
      const r4 = document.querySelector('[data-bento-tile="4"]').getBoundingClientRect();
      const r5 = document.querySelector('[data-bento-tile="5"]').getBoundingClientRect();
      const r6 = document.querySelector('[data-bento-tile="6"]').getBoundingClientRect();
      return {
        t4: { width: Math.round(r4.width), right: Math.round(r4.right) },
        t5w: Math.round(r5.width),
        t6w: Math.round(r6.width)
      };
    });
    assert(afterTerlaris.t4.width >= 340 && afterTerlaris.t4.right <= 390, `Terlaris sheet must render full-width when active: ${JSON.stringify(afterTerlaris)}`);
    assert(afterTerlaris.t5w === 0 && afterTerlaris.t6w === 0, 'Other sheets must hide when Terlaris is active');

    await page.click('[data-testid="mobile-dash-tab-ringkasan"]');
    await new Promise(r => setTimeout(r, 200));
    const afterRingkasan = await page.evaluate(() => {
      const r4 = document.querySelector('[data-bento-tile="4"]').getBoundingClientRect();
      const r5 = document.querySelector('[data-bento-tile="5"]').getBoundingClientRect();
      const r6 = document.querySelector('[data-bento-tile="6"]').getBoundingClientRect();
      return {
        t6: { width: Math.round(r6.width), right: Math.round(r6.right) },
        t4w: Math.round(r4.width),
        t5w: Math.round(r5.width)
      };
    });
    assert(afterRingkasan.t6.width >= 340 && afterRingkasan.t6.right <= 390, `Ringkasan sheet must render full-width when active: ${JSON.stringify(afterRingkasan)}`);
    assert(afterRingkasan.t4w === 0 && afterRingkasan.t5w === 0, 'Other sheets must hide when Ringkasan is active');

    await page.click('[data-testid="mobile-dash-tab-nota"]');
    await new Promise(r => setTimeout(r, 200));
    const afterBackToNota = await page.evaluate(() => {
      const r5 = document.querySelector('[data-bento-tile="5"]').getBoundingClientRect();
      return {
        width: Math.round(r5.width),
        bottom: Math.round(r5.bottom),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    assert(afterBackToNota.width >= 340 && afterBackToNota.bottom <= 780, `Nota sheet restore failed: ${JSON.stringify(afterBackToNota)}`);
    assert(afterBackToNota.scrollWidth <= afterBackToNota.clientWidth, 'Overflow after switching tabs back to Nota');

    const mobileShot = path.join(ARTIFACTS_DIR, 'kasir_dashboard_bento_mobile.png');
    await page.screenshot({ path: mobileShot, fullPage: false });
    console.log(`📸 Screenshot saved: ${mobileShot}`);
    console.log(`✓ Gate 3: Mobile 390x844 Hero-First layout (bottom=${afterBackToNota.bottom}px) & segmented sheets work with zero horizontal overflow`);

    console.log('\n🎉 ALL 3 KASIR DASHBOARD HERO-FIRST MOBILE & 3x2 DESKTOP BENTO GATES PASSED!');
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
    console.error('❌ E2E DASHBOARD BENTO VERIFICATION FAILED:', err);
    process.exit(1);
  });
