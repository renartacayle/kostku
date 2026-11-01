const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  const BASE_URL = 'https://kostku.riuph.me';
  const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492';

  // 1. Mobile Tenant Dashboard
  const tenantUser = {
    id: 1790690895764,
    name: "Rian Pratama",
    email: "penghuni@kostku.id",
    role: "user",
    kamar: "102",
    kostUid: "KOST-BDG-02",
    isDemo: true
  };
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), tenantUser);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
    const h = headings.find(el => el.innerText.includes('Mitra') || el.innerText.includes('Warung'));
    if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_tenant_camera_badges.png') });
  console.log('Saved: mobile_tenant_camera_badges.png');

  // 2. Mobile Mitra Portal - Add Menu Modal with Detector
  const mitraUser = {
    id: "1792490000002",
    name: "Bu Siti",
    email: "busiti@kostku.id",
    role: "mitra",
    merchantId: "PTR-DEF-03",
    kostUid: "KOST-BDG-02"
  };
  await page.goto(`${BASE_URL}/mitra`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), mitraUser);
  await page.goto(`${BASE_URL}/mitra`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tabBtn = btns.find(b => b.innerText.includes('Setting Menu'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Tambah Menu') || b.innerText.includes('Menu Baru'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Test real camera preset on mobile
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const camBtn = btns.find(b => b.innerText.includes('Uji Jepretan Kamera HP Asli'));
    if (camBtn) camBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_mitra_ai_detector.png') });
  console.log('Saved: mobile_mitra_ai_detector.png');

  await browser.close();
}

run().catch(console.error);
