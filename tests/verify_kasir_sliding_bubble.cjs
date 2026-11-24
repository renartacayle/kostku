const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');
const backendApp = require('../backend/server');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/9b01eb42-92f6-4beb-a90f-e390a58ab3b3';

async function runTest() {
  console.log('--- 🧪 STARTING KASIR SLIDING BUBBLE VERIFICATION ---');

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

    // Pre-seed localStorage with authenticated Mitra user
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const user = {
        id: '1794729638012',
        name: 'Kantin KostKu',
        role: 'mitra',
        merchantId: 'MTR-usr-1794729638012',
        email: 'kantin@kostku.id',
        isDemo: true
      };
      localStorage.setItem('kostUser', JSON.stringify(user));
      localStorage.setItem('kostku_auth_token', 'demo_token_123');
      localStorage.setItem('kostku_is_demo_mode', 'true');
    });

    // Navigate to Kasir
    console.log('📱 Navigating to http://localhost:4173/kasir?tab=dashboard ...');
    await page.goto('http://localhost:4173/kasir?tab=dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Mobile Bottom Nav exists
    const navExists = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Navigasi Kasir & Operasional Mobile"]');
      return !!nav;
    });
    console.log(`Nav exists: ${navExists}`);
    assert(navExists, 'Mobile Bottom Nav must be visible on mobile viewport in Kasir');

    // 1. Initial State: Dashboard (Tab index 0)
    let activeTransform = await page.evaluate(() => {
      const carrier = document.querySelector('nav[aria-label="Navigasi Kasir & Operasional Mobile"] > div > div');
      return carrier ? carrier.style.transform : null;
    });
    console.log(`Initial tab (Dashboard) transform: ${activeTransform}`);
    assert(activeTransform.includes('translateX(0%)'), 'Bubble should be at 0% for Dashboard');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'nav_step1_dashboard.png') });

    // 2. Click Dapur (Tab index 1)
    console.log('👉 Clicking Dapur...');
    await page.click('[data-testid="mobile-nav-dapur"]');
    await new Promise(r => setTimeout(r, 550));
    activeTransform = await page.evaluate(() => {
      const carrier = document.querySelector('nav[aria-label="Navigasi Kasir & Operasional Mobile"] > div > div');
      return carrier ? carrier.style.transform : null;
    });
    console.log(`Dapur tab transform: ${activeTransform}`);
    assert(activeTransform.includes('translateX(100%)'), 'Bubble should slide to 100% for Dapur');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'nav_step2_dapur.png') });

    // 3. Click Kasir (Tab index 2)
    console.log('👉 Clicking Kasir POS...');
    await page.click('[data-testid="mobile-nav-kasir"]');
    await new Promise(r => setTimeout(r, 550));
    activeTransform = await page.evaluate(() => {
      const carrier = document.querySelector('nav[aria-label="Navigasi Kasir & Operasional Mobile"] > div > div');
      return carrier ? carrier.style.transform : null;
    });
    console.log(`Kasir tab transform: ${activeTransform}`);
    assert(activeTransform.includes('translateX(200%)'), 'Bubble should slide to 200% for Kasir POS');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'nav_step3_kasir.png') });

    // 4. Click Keuangan (Tab index 3) - The exact page from user's screenshot!
    console.log('👉 Clicking Keuangan...');
    await page.click('[data-testid="mobile-nav-keuangan-btn"]');
    await new Promise(r => setTimeout(r, 550));
    activeTransform = await page.evaluate(() => {
      const carrier = document.querySelector('nav[aria-label="Navigasi Kasir & Operasional Mobile"] > div > div');
      return carrier ? carrier.style.transform : null;
    });
    console.log(`Keuangan tab transform: ${activeTransform}`);
    assert(activeTransform.includes('translateX(300%)'), 'Bubble should slide to 300% for Keuangan');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'nav_step4_keuangan.png') });

    // 5. Click Kelola (Tab index 4)
    console.log('👉 Clicking Kelola...');
    await page.click('[data-testid="mobile-nav-kelola-btn"]');
    await new Promise(r => setTimeout(r, 550));
    activeTransform = await page.evaluate(() => {
      const carrier = document.querySelector('nav[aria-label="Navigasi Kasir & Operasional Mobile"] > div > div');
      return carrier ? carrier.style.transform : null;
    });
    console.log(`Kelola tab transform: ${activeTransform}`);
    assert(activeTransform.includes('translateX(400%)'), 'Bubble should slide to 400% for Kelola');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'nav_step5_kelola.png') });

    console.log('\n🎉 ALL 5 TABS SLIDING BUBBLE ANIMATION TESTS PASSED PERFECTLY!');
  } finally {
    if (browser) await browser.close();
    previewServer.kill('SIGTERM');
    backendServer.close();
  }
}

runTest().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
