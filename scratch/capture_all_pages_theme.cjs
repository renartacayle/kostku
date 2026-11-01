const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

async function runCaptureAllPages() {
  console.log('Launching headless browser for All-Pages Light/Dark Mode...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1400, deviceScaleFactor: 2 });

  const htmlPath = 'file://' + path.resolve(__dirname, 'all_pages_theme_showcase.html');
  console.log('Navigating to:', htmlPath);
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  await new Promise(r => setTimeout(r, 1200));

  const outPath = '/home/rena/.gemini/antigravity/brain/c34bb6a7-8e98-42a6-9015-86bef76e1a22/kostku_all_pages_light_vs_dark.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Successfully saved All-Pages Light/Dark Mode screenshot to:', outPath);

  await browser.close();
  console.log('Capture finished successfully!');
}

runCaptureAllPages().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
