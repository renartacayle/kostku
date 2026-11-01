const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

async function captureRealApp() {
  console.log('Launching browser to capture REAL KostKu app...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const brainDir = '/home/rena/.gemini/antigravity/brain/c34bb6a7-8e98-42a6-9015-86bef76e1a22';

  // 1. Capture HOME in Dark Mode
  console.log('Capturing Home (Dark)...');
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.removeItem('kostUser');
    localStorage.setItem('kostku_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(brainDir, 'real_home_dark.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // 2. Capture HOME in Light Mode
  console.log('Capturing Home (Light)...');
  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(brainDir, 'real_home_light.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // 3. Capture KOST DETAIL in Dark Mode & Light Mode
  console.log('Capturing Kost Detail...');
  await page.goto('http://localhost:5180/kost/KOST-JAKSEL-01', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(brainDir, 'real_detail_dark.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(brainDir, 'real_detail_light.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // 4. Capture OWNER DASHBOARD in Dark Mode & Light Mode
  console.log('Capturing Owner Dashboard...');
  await page.evaluate(() => {
    const ownerUser = {
      id: "owner-1",
      name: "H. Danu Saputra",
      email: "danu@kostku.id",
      role: "owner",
      kostUid: "KOST-JAKSEL-01"
    };
    localStorage.setItem('kostUser', JSON.stringify(ownerUser));
    localStorage.setItem('kostName', 'Kost Taman Sukun Co-Living & Exclusive');
    localStorage.setItem('kostku_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  });
  await page.goto('http://localhost:5180/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(brainDir, 'real_dashboard_owner_dark.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(brainDir, 'real_dashboard_owner_light.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // 5. Capture TENANT DASHBOARD & MITRA in Dark Mode & Light Mode
  console.log('Capturing Tenant Dashboard & Mitra...');
  await page.evaluate(() => {
    const tenantUser = {
      id: 1790690895764,
      name: "Rian Pratama",
      email: "penghuni@kostku.id",
      role: "user",
      kamar: "102",
      kostUid: "KOST-JAKSEL-01",
      loyalty_points: 350
    };
    localStorage.setItem('kostUser', JSON.stringify(tenantUser));
    localStorage.setItem('kostku_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  });
  await page.goto('http://localhost:5180/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(brainDir, 'real_tenant_dark.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(brainDir, 'real_tenant_light.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  await browser.close();
  console.log('All REAL screenshots captured successfully!');
}

captureRealApp().catch(err => {
  console.error('Error in captureRealApp:', err);
  process.exit(1);
});
