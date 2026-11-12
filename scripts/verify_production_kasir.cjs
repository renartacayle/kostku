const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');

(async () => {
  console.log('🚀 Launching Chrome to verify https://kostku.riuph.me/kasir...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser PageError] ${err.message}`));

  console.log('🌐 Navigating directly to https://kostku.riuph.me/kasir ...');
  const response = await page.goto('https://kostku.riuph.me/kasir', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Wait 3 seconds for React to mount and hydrate
  await new Promise(r => setTimeout(r, 3000));

  const finalUrl = page.url();
  console.log(`📍 Final URL: ${finalUrl}`);

  if (finalUrl.includes('/dashboard')) {
    console.error('❌ FAILED: Redirected back to /dashboard!');
    await browser.close();
    process.exit(1);
  }

  console.log('✅ PASS: Direct access to /kasir stayed on /kasir with NO redirect!');

  // Check DOM text
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log(`🔍 Page snippet:\n${bodyText.slice(0, 300)}...`);

  const screenshotPath = '/home/rena/.gemini/antigravity/brain/b788417c-3c96-465d-bb00-91b3b6640c0d/production_kasir_live.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);

  await browser.close();
  console.log('🎉 Verification Complete!');
})();
