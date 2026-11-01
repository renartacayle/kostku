const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/24956631-2679-40ee-8e2f-108e0ae1b924';
const PORT = 4179;

async function runVerification() {
  console.log('1. Starting vite preview on port ' + PORT + '...');
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log('[Vite Preview]:', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('[Vite Preview Error]:', d.toString().trim()));

  // Wait for server to be ready
  await new Promise((r) => setTimeout(r, 1800));

  console.log('2. Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,1024'],
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960 });

    console.log('3. Navigating to http://localhost:' + PORT + '/...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));

    // Evaluate theme
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    console.log('Theme active on load:', theme);

    // Screenshot 1: Hero & Cockpit
    const heroPath = path.join(ARTIFACT_DIR, 'hero_light_tactile.png');
    await page.screenshot({ path: heroPath, clip: { x: 0, y: 0, width: 1280, height: 750 } });
    console.log('Saved hero screenshot to:', heroPath);

    // Screenshot 2: Clean KostCard with WhatsApp button
    const cardEl = await page.$('.koleksi-grid-4x2, .kost-responsive-grid');
    if (cardEl) {
      await page.evaluate(() => {
        const el = document.getElementById('search-results-section');
        if (el) el.scrollIntoView();
      });
      await new Promise((r) => setTimeout(r, 600));

      const cardPath = path.join(ARTIFACT_DIR, 'kost_card_clean_whatsapp.png');
      await page.screenshot({ path: cardPath, clip: { x: 0, y: 200, width: 1280, height: 750 } });
      console.log('Saved clean card screenshot to:', cardPath);
    }

    // Screenshot 3: The Kitchen Showcase (Receipt Printer & Hold to Confirm)
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2'));
      const kitchenH2 = headings.find(h => h.textContent.includes('Sentuhan Fisik') || h.textContent.includes('Struk Kasir'));
      if (kitchenH2) {
        kitchenH2.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise((r) => setTimeout(r, 1000));

    const kitchenPath = path.join(ARTIFACT_DIR, 'the_kitchen_tactile_showcase.png');
    await page.screenshot({ path: kitchenPath });
    console.log('Saved The Kitchen showcase screenshot to:', kitchenPath);

  } finally {
    await browser.close();
    server.kill();
    console.log('4. Browser and preview server closed.');
  }
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
