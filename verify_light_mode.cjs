const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492';

async function verifyLightMode() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Visit Home and set theme to light
  console.log('Navigating to Home...');
  await page.goto('https://kostku.riuph.me/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'kostku_v2_home_light.png') });
  console.log('Captured kostku_v2_home_light.png');

  // Scroll to Bento and Room Cards
  await page.evaluate(() => window.scrollBy(0, 1100));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'kostku_v2_home_cards_light.png') });
  console.log('Captured kostku_v2_home_cards_light.png');

  // Scroll to Footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'kostku_v2_home_footer_light.png') });
  console.log('Captured kostku_v2_home_footer_light.png');

  // 2. Visit Cari Kost
  console.log('Navigating to Cari Kost...');
  await page.goto('https://kostku.riuph.me/cari-kost', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'kostku_v2_cari_light.png') });
  console.log('Captured kostku_v2_cari_light.png');

  // 3. Visit Login
  console.log('Navigating to Login...');
  await page.goto('https://kostku.riuph.me/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'kostku_v2_login_light.png') });
  console.log('Captured kostku_v2_login_light.png');

  // 4. Visit Register
  console.log('Navigating to Register...');
  await page.goto('https://kostku.riuph.me/register', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'kostku_v2_register_light.png') });
  console.log('Captured kostku_v2_register_light.png');

  await browser.close();
  console.log('All verification screenshots captured!');
}

verifyLightMode().catch(console.error);
