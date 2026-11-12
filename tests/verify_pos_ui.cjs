const puppeteer = require('puppeteer-core');
const path = require('path');
const http = require('http');
const app = require('../backend/server');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';

async function testUI() {
  console.log('Starting server for Puppeteer verification...');
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log('Server running at', baseUrl);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  try {
    const page = await browser.newPage();

    // 1. Test Kasir Terminal (Desktop / Tablet view)
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/kasir`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'kasir-terminal-kds.png'), fullPage: false });
    console.log('✅ Captured kasir-terminal-kds.png');

    // 2. Test Table Self-Ordering (Mobile View)
    await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
    await page.goto(`${baseUrl}/order/MEJA-01-TKN881`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'order-meja-mobile.png'), fullPage: false });
    console.log('✅ Captured order-meja-mobile.png');

  } finally {
    await browser.close();
    server.close();
  }

  console.log('🎉 UI VERIFICATION COMPLETED SUCCESSFULLY!');
}

testUI().catch(err => {
  console.error('Puppeteer verification failed:', err);
  process.exit(1);
});
