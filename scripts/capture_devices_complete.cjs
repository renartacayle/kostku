const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/1f4a4cfc-baa3-4329-b9a4-a1693b235b25';
const FRONTEND_PORT = 5180;
const BACKEND_PORT = 3001;

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode < 500);
    }).on('error', () => resolve(false));
  });
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkUrl(url)) return true;
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

(async () => {
  console.log('🚀 Starting Multi-Device Screenshot Engine for KostKu...');
  
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  let backendProcess = null;
  let viteProcess = null;

  try {
    // 1. Launch Backend if not already up
    const isBackendUp = await checkUrl(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
    if (!isBackendUp) {
      console.log('Launching backend server...');
      backendProcess = spawn('node', ['backend/server.js'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'ignore'
      });
      const ok = await waitForServer(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
      if (!ok) console.warn('Warning: Backend server slow to respond.');
      else console.log('✓ Backend ready.');
    } else {
      console.log('✓ Backend already running.');
    }

    // 2. Launch Vite Preview
    const isViteUp = await checkUrl(`http://localhost:${FRONTEND_PORT}/`);
    if (!isViteUp) {
      console.log('Launching Vite preview server...');
      viteProcess = spawn('npx', ['vite', 'preview', '--port', String(FRONTEND_PORT), '--strictPort'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'ignore'
      });
      const ok = await waitForServer(`http://localhost:${FRONTEND_PORT}/`);
      if (!ok) throw new Error('Failed to start Vite preview server.');
      console.log('✓ Vite preview ready.');
    } else {
      console.log('✓ Vite preview already running.');
    }

    // 3. Launch Chrome Headless
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars']
    });

    const page = await browser.newPage();
    const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

    const ownerUser = {
      id: "1790690000001",
      name: "Ibu Hj. Nurhayati",
      email: "owner@kostku.id",
      role: "owner",
      kostUid: "KOST-BDG-02",
      isDemo: false
    };

    const tenantUser = {
      id: 1790690895764,
      name: "Rian Pratama",
      email: "penghuni@kostku.id",
      role: "user",
      kamar: "102",
      kostUid: "KOST-BDG-02",
      isDemo: false
    };

    // ══════════════════════════════════════════════════════════
    // PROFILE 1: SMARTPHONE / MOBILE (390 x 844, DPR 2)
    // ══════════════════════════════════════════════════════════
    console.log('\n📱 Capturing Mobile Device Profile...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    // 1.1 Mobile Landing & Search Page
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_01_mobile_home.png') });
    console.log('  ✓ Saved: device_01_mobile_home.png');

    // 1.2 Mobile Login Page (Responsive & Zero Button Overflow)
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_02_mobile_login.png') });
    console.log('  ✓ Saved: device_02_mobile_login.png');

    // 1.3 Mobile Tenant Dashboard
    await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), tenantUser);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_03_mobile_tenant.png') });
    console.log('  ✓ Saved: device_03_mobile_tenant.png');

    // 1.4 Mobile Owner Dashboard (with mobile bottom nav)
    await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), ownerUser);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_04_mobile_owner.png') });
    console.log('  ✓ Saved: device_04_mobile_owner.png');

    // 1.5 Mobile Checkout Flow (TriPay / ASPI QRIS)
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_05_mobile_checkout.png') });
    console.log('  ✓ Saved: device_05_mobile_checkout.png');

    // ══════════════════════════════════════════════════════════
    // PROFILE 2: TABLET (820 x 1180, DPR 2)
    // ══════════════════════════════════════════════════════════
    console.log('\n📟 Capturing Tablet Device Profile...');
    await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    // 2.1 Tablet Marketplace / Search Kost
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_06_tablet_search.png') });
    console.log('  ✓ Saved: device_06_tablet_search.png');

    // 2.2 Tablet Owner Operations Dashboard
    await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), ownerUser);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_07_tablet_dashboard.png') });
    console.log('  ✓ Saved: device_07_tablet_dashboard.png');

    // 2.3 Tablet Keuangan & Unified Wallet
    await page.goto(`${BASE_URL}/keuangan`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_08_tablet_keuangan.png') });
    console.log('  ✓ Saved: device_08_tablet_keuangan.png');

    // ══════════════════════════════════════════════════════════
    // PROFILE 3: DESKTOP / LAPTOP (1440 x 900, DPR 1.5)
    // ══════════════════════════════════════════════════════════
    console.log('\n💻 Capturing Desktop & Laptop Device Profile...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5, isMobile: false, hasTouch: false });

    // 3.1 Desktop Landing Page
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_09_desktop_landing.png') });
    console.log('  ✓ Saved: device_09_desktop_landing.png');

    // 3.2 Desktop Owner Back-Office Suite (Full Sidebar & Overview)
    await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), ownerUser);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_10_desktop_owner_dashboard.png') });
    console.log('  ✓ Saved: device_10_desktop_owner_dashboard.png');

    // 3.3 Desktop Financials & Settlement Suite
    await page.goto(`${BASE_URL}/keuangan`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_11_desktop_keuangan.png') });
    console.log('  ✓ Saved: device_11_desktop_keuangan.png');

    // 3.4 Desktop Checkout & QRIS ASPI Dynamic Modal
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_12_desktop_checkout.png') });
    console.log('  ✓ Saved: device_12_desktop_checkout.png');

    await browser.close();
    console.log('\n🎉 ALL MULTI-DEVICE SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    if (viteProcess) {
      console.log('Shutting down Vite preview process...');
      viteProcess.kill('SIGTERM');
    }
    if (backendProcess) {
      console.log('Shutting down backend process...');
      backendProcess.kill('SIGTERM');
    }
  }
})();
