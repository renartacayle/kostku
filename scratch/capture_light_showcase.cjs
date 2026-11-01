const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });

  // 1. Landing
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc/kostku_light_landing.png',
    fullPage: false
  });

  // 2. Search
  await page.goto('http://localhost:5173/search', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc/kostku_light_search.png',
    fullPage: false
  });

  // 3. Detail
  await page.goto('http://localhost:5173/kost/KOST-JKT-01', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc/kostku_light_kost_detail.png',
    fullPage: false
  });

  // 4. Owner Dashboard
  await page.evaluate(() => {
    const mockOwner = {
      id: 1,
      name: 'Bapak Kost Demo',
      email: 'owner@kostku.com',
      role: 'owner',
      kostUid: 'kost-demo-1'
    };
    localStorage.setItem('kostUser', JSON.stringify(mockOwner));
    localStorage.setItem('kostName', 'Kost Eksklusif Senayan');
  });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc/kostku_light_owner_dashboard.png',
    fullPage: false
  });

  console.log('Screenshots captured successfully!');
  await browser.close();
}

capture();
