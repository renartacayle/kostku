const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');
const backendApp = require('../backend/server');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/9b01eb42-92f6-4beb-a90f-e390a58ab3b3';

async function runTest() {
  console.log('--- 🧪 STARTING ORDER MEJA CART INTERACTION TEST ---');

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

    console.log('📱 Navigating to http://localhost:4173/order/MEJA-01-TKN881?demo=true ...');
    await page.goto('http://localhost:4173/order/MEJA-01-TKN881?demo=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('main', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to Menu Baru
    await page.evaluate(() => window.scrollTo(0, 300));
    await new Promise(r => setTimeout(r, 600));

    // Find and click the first "+ Tambah" button
    const buttons = await page.$$('button');
    let tambahBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text && text.includes('Tambah')) {
        tambahBtn = btn;
        break;
      }
    }
    assert(tambahBtn, 'Must find a "+ Tambah" button');
    console.log('🛒 Clicking first "+ Tambah" button...');
    await tambahBtn.click();
    await page.waitForSelector('[data-testid="menu-note-modal"]', { timeout: 5000 });
    await page.type('[data-testid="item-note-input"]', 'Porsi pas, mantap');
    await page.click('[data-testid="confirm-add-menu-btn"]');
    await new Promise(r => setTimeout(r, 800));

    // Take screenshot of morphed card and floating cart bar
    const cartScreenshotPath = path.join(ARTIFACTS_DIR, 'order_meja_cart_active.png');
    await page.screenshot({ path: cartScreenshotPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${cartScreenshotPath}`);

    // Verify floating bottom cart is rendered
    const hasCartBar = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('div, button')).map(el => el.innerText || '');
      return texts.some(t => t.includes('Pesan Sekarang ke Dapur'));
    });
    console.log('Floating Cart Bar Active:', hasCartBar);
    assert(hasCartBar, 'Floating bottom cart bar must appear when items are in cart');

    // Release cart hold cleanly before closing Chrome so demo_db remains tidy
    const minusBtn = await page.$('[data-testid^="qty-minus-"]');
    if (minusBtn) {
      await minusBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    console.log('🎉 CART INTERACTION TEST PASSED!');
  } finally {
    if (browser) await browser.close();
    previewServer.kill('SIGTERM');
    backendServer.close();
  }
}

runTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
