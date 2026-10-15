import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');

const BASE_URL = 'http://localhost:5180';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });

  page.on('dialog', async d => await d.accept());

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('chrome-extension')) {
        consoleErrors.push({ url: page.url(), text });
      }
    }
  });

  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  try {
    // 1. Public Pages
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.goto(`${BASE_URL}/kost/KOST-K12DQR`, { waitUntil: 'networkidle0', timeout: 30000 });

    // 2. Tenant Dashboard
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({
        id: 1790329612919,
        name: 'Siti Rahma',
        email: 'siti.rahma@gmail.com',
        role: 'user',
        kostUid: 'KOST-K12DQR',
        kamar: 'A02'
      }));
      localStorage.setItem('kostUid', 'KOST-K12DQR');
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0', timeout: 30000 });

    // 3. Owner Dashboard & Protected Pages
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({
        id: 1790329612917,
        name: 'Budi Santoso',
        email: 'budi.santoso@kostku.id',
        role: 'owner',
        kostUid: 'KOST-K12DQR'
      }));
      localStorage.setItem('kostUid', 'KOST-K12DQR');
    });

    const ownerRoutes = [
      '/dashboard',
      '/penghuni',
      '/keuangan',
      '/tagihan',
      '/komplain',
      '/pengaturan',
      '/inventaris',
      '/air',
      '/pengeluaran',
      '/laporan'
    ];

    for (const route of ownerRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
    }

    if (consoleErrors.length > 0) {
      console.error('Console errors detected during E2E sweep:');
      consoleErrors.forEach(e => console.error(`  [${e.url}] ${e.text}`));
      process.exit(1);
    }

    if (failedRequests.length > 0) {
      console.error('Failed network requests detected:');
      failedRequests.forEach(r => console.error(`  ${r.url} - ${r.failure}`));
      process.exit(1);
    }

    console.log('e2e audit passed with zero console errors and zero failed requests');
    process.exit(0);

  } catch (err) {
    console.error('E2E audit runner error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
