const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

async function runCapture() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });

  const htmlPath = 'file://' + path.resolve(__dirname, 'before_after_showcase.html');
  console.log('Navigating to:', htmlPath);
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  // Wait a short moment for fonts & styles to settle
  await new Promise(r => setTimeout(r, 1200));

  const outPath1 = '/home/rena/.gemini/antigravity/brain/c34bb6a7-8e98-42a6-9015-86bef76e1a22/kostku_before_after_evolution.png';
  await page.screenshot({ path: outPath1, fullPage: true });
  console.log('Successfully saved full comparison to:', outPath1);

  // Also capture just the side-by-side comparison grid for close-up viewing
  const gridEl = await page.$('.comparison-grid');
  if (gridEl) {
    const outPath2 = '/home/rena/.gemini/antigravity/brain/c34bb6a7-8e98-42a6-9015-86bef76e1a22/kostku_before_after_closeup.png';
    await gridEl.screenshot({ path: outPath2 });
    console.log('Successfully saved closeup grid to:', outPath2);
  }

  // Also capture the local services (Mitra FnB, Galon, Laundry) specific comparison
  const servicesEls = await page.$$('.services-showcase');
  if (servicesEls.length >= 2) {
    const outPath3 = '/home/rena/.gemini/antigravity/brain/c34bb6a7-8e98-42a6-9015-86bef76e1a22/kostku_mitra_palette_comparison.png';
    // Take screenshot of the bottom palette summary
    const paletteSummary = await page.$('.palette-summary');
    if (paletteSummary) {
      await paletteSummary.screenshot({ path: outPath3 });
      console.log('Successfully saved palette tokens summary to:', outPath3);
    }
  }

  await browser.close();
  console.log('All screenshots completed successfully!');
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
