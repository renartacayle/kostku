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
  console.log('🚀 Capturing Landing Page Pop-up Filter Showcase...');
  
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  let backendProcess = null;
  let viteProcess = null;

  try {
    const isBackendUp = await checkUrl(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
    if (!isBackendUp) {
      backendProcess = spawn('node', ['backend/server.js'], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
      await waitForServer(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
    }

    const isViteUp = await checkUrl(`http://localhost:${FRONTEND_PORT}/`);
    if (!isViteUp) {
      viteProcess = spawn('npx', ['vite', 'preview', '--port', String(FRONTEND_PORT), '--strictPort'], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
      await waitForServer(`http://localhost:${FRONTEND_PORT}/`);
    }

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars']
    });

    const page = await browser.newPage();
    const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

    // 1. Mobile Clean Landing (No Clutter)
    console.log('📱 Capturing 1.1 Mobile Landing (Clean Streamlined Search)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_01_mobile_home.png') });

    // 2. Mobile Filter Pop-Up Open
    console.log('📱 Capturing 1.2 Mobile Filter Pop-up (Bottom Sheet Modal)...');
    const filterBtnMobile = await page.$('button[title="Buka Filter Pop-up"]');
    if (filterBtnMobile) {
      await filterBtnMobile.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_landing_popup_mobile.png') });
      
      // Close modal by clicking apply or close
      const closeBtn = await page.$('button[title="Tutup filter"]');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 3. Desktop Clean Landing
    console.log('💻 Capturing 2.1 Desktop Landing (Clean Streamlined Search)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_09_desktop_landing.png') });

    // 4. Desktop Filter Pop-Up Open
    console.log('💻 Capturing 2.2 Desktop Filter Pop-up (Centered Modal)...');
    const filterBtnDesktop = await page.$('button[title="Buka Filter Pop-up"]');
    if (filterBtnDesktop) {
      await filterBtnDesktop.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'device_landing_popup_desktop.png') });
    }

    console.log('✨ All Landing Page Pop-up Filter Screenshots Captured Successfully!');
    await browser.close();

  } catch (err) {
    console.error('❌ Error capturing screenshots:', err);
  } finally {
    if (backendProcess) backendProcess.kill();
    if (viteProcess) viteProcess.kill();
  }
})();
