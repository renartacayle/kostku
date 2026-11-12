const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');

(async () => {
  console.log('📱 Testing Mobile Kasir Viewport & Smooth Scroll on https://kostku.riuph.me/kasir ...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Exact modern mobile phone viewport (Xiaomi / Redmi / Samsung / iPhone)
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  await page.goto('https://kostku.riuph.me/kasir', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  console.log(`📍 Page URL: ${page.url()}`);

  // 1. Check if MobileBottomNav is hidden
  const bottomNavExists = await page.$('.role-bottom-nav');
  console.log(`🔍 MobileBottomNav visible on Kasir: ${bottomNavExists !== null ? '❌ STILL VISIBLE' : '✅ HIDDEN (CORRECT)'}`);

  // 2. Check if FAB button is hidden
  const fabExists = await page.$('[aria-label*="Bantuan"], .fab-fan-container');
  console.log(`🔍 FAB Fan Button visible on Kasir: ${fabExists !== null ? '❌ STILL VISIBLE' : '✅ HIDDEN (CORRECT)'}`);

  // 3. Check Sticky Header Height
  const headerHeight = await page.evaluate(() => {
    const hdr = document.querySelector('header');
    return hdr ? hdr.getBoundingClientRect().height : 0;
  });
  console.log(`🔍 Sticky Header Height: ${headerHeight}px (should be ~50-65px, NOT 450px)`);

  // 4. Check active tab
  const activeTabContent = await page.evaluate(() => {
    return document.body.innerText.includes('Katalog Menu Kasir') ? 'Kasir Register (pos)' : 'Other';
  });
  console.log(`🔍 Active Tab loaded: ${activeTabContent}`);

  // 5. Screenshot Top of Mobile Screen
  const screenshotTop = '/home/rena/.gemini/antigravity/brain/b788417c-3c96-465d-bb00-91b3b6640c0d/mobile_kasir_top.png';
  await page.screenshot({ path: screenshotTop });
  console.log(`📸 Top screenshot saved to: ${screenshotTop}`);

  // 6. Scroll down 400px
  console.log('📜 Scrolling down 400px...');
  await page.evaluate(() => {
    window.scrollBy({ top: 400, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const scrollY = await page.evaluate(() => window.scrollY);
  console.log(`📍 Scroll Y position: ${scrollY}px`);

  // 7. Check if menu products are now visible in the viewport
  const visibleProducts = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(d => d.innerText && d.innerText.includes('Rp 13.000'));
    return cards.length > 0;
  });
  console.log(`🔍 Menu products visible while scrolled: ${visibleProducts}`);

  // 8. Screenshot Scrolled Position
  const screenshotScrolled = '/home/rena/.gemini/antigravity/brain/b788417c-3c96-465d-bb00-91b3b6640c0d/mobile_kasir_scrolled.png';
  await page.screenshot({ path: screenshotScrolled });
  console.log(`📸 Scrolled screenshot saved to: ${screenshotScrolled}`);

  await browser.close();
  console.log('🎉 Mobile Scroll Verification Finished!');
})();
