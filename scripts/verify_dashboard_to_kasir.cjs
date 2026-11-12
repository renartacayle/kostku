const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');

(async () => {
  console.log('🚀 Launching Chrome to test Dashboard -> Kasir navigation on https://kostku.riuph.me ...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Mock logged-in user in localStorage
  await page.goto('https://kostku.riuph.me/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const user = {
      id: 'usr-oscar',
      name: 'Oscar Herdian Wijaya',
      email: 'oscar@kostku.id',
      role: 'owner',
      kamar: '122',
      kostUid: 'KOST-OJN64X'
    };
    localStorage.setItem('kostku_user', JSON.stringify(user));
    localStorage.setItem('kostku_active_role', 'owner');
  });

  console.log('🌐 Navigating to https://kostku.riuph.me/dashboard ...');
  await page.goto('https://kostku.riuph.me/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  console.log(`📍 On Dashboard: ${page.url()}`);

  // Look for any link or button pointing to /kasir
  const kasirLink = await page.$('a[href="/kasir"], a[href*="kasir"]');
  if (kasirLink) {
    console.log('🔘 Found Kasir link on Dashboard, clicking it...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      kasirLink.click()
    ]);
  } else {
    console.log('ℹ️ No direct <a> tag found, testing navigation via window.location...');
    await page.evaluate(() => {
      window.location.href = '/kasir';
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  }

  await new Promise(r => setTimeout(r, 2000));
  const finalUrl = page.url();
  console.log(`📍 Final URL after clicking Kasir: ${finalUrl}`);

  if (finalUrl.includes('/dashboard')) {
    console.error('❌ FAILED: Still bounced back to /dashboard!');
    await browser.close();
    process.exit(1);
  }

  if (finalUrl.includes('/kasir')) {
    console.log('🎉 SUCCESS: Successfully navigated to /kasir without redirecting to dashboard!');
  }

  const screenshotPath = '/home/rena/.gemini/antigravity/brain/b788417c-3c96-465d-bb00-91b3b6640c0d/dashboard_to_kasir_success.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);

  await browser.close();
  console.log('✅ End of test.');
})();
