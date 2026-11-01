const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1100, deviceScaleFactor: 2 });

  const BASE_URL = 'https://kostku.riuph.me';
  const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492';

  console.log('Navigating to Mitra page...');
  await page.goto(`${BASE_URL}/mitra`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    // Set Mitra user
    const mitraUser = {
      id: "1792490000002",
      name: "Bu Siti",
      email: "busiti@kostku.id",
      role: "mitra",
      merchantId: "PTR-DEF-03",
      kostUid: "KOST-BDG-02"
    };
    localStorage.setItem('kostUser', JSON.stringify(mitraUser));
  });

  await page.goto(`${BASE_URL}/mitra`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Switch to Setting Menu tab & Open Add Menu Modal
  console.log('Switching to Setting Menu tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tabBtn = btns.find(b => b.innerText.includes('Setting Menu'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Opening Add Menu Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Tambah Menu') || b.innerText.includes('Menu Baru'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 2. Click Real Camera Preset Button
  console.log('Testing Real Camera preset...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const camBtn = btns.find(b => b.innerText.includes('Uji Jepretan Kamera HP Asli'));
    if (camBtn) camBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mitra_ai_detector_real_camera.png') });
  console.log('Captured: mitra_ai_detector_real_camera.png');

  // 3. Click AI Synthetic Render Preset Button
  console.log('Testing AI Synthetic Render preset...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aiBtn = btns.find(b => b.innerText.includes('Uji Render AI Murni'));
    if (aiBtn) aiBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mitra_ai_detector_ai_rejected.png') });
  console.log('Captured: mitra_ai_detector_ai_rejected.png');

  // 4. Click Stock Internet Food Preset Button
  console.log('Testing Stock Internet Food preset...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const stockBtn = btns.find(b => b.innerText.includes('Uji Foto Stock Internet'));
    if (stockBtn) stockBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mitra_ai_detector_stock_rejected.png') });
  console.log('Captured: mitra_ai_detector_stock_rejected.png');

  // 5. Check Tenant Dashboard (Anak Kost view)
  console.log('Checking Tenant Dashboard badges...');
  await page.evaluate(() => {
    const tenantUser = {
      id: 1790690895764,
      name: "Rian Pratama",
      email: "penghuni@kostku.id",
      role: "user",
      kamar: "102",
      kostUid: "KOST-BDG-02",
      isDemo: true
    };
    localStorage.setItem('kostUser', JSON.stringify(tenantUser));
  });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
    const mitraHeading = headings.find(h => h.innerText.includes('Mitra') || h.innerText.includes('Warung') || h.innerText.includes('Layanan'));
    if (mitraHeading) mitraHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tenant_dashboard_camera_badges.png') });
  console.log('Captured: tenant_dashboard_camera_badges.png');

  // 6. Click on Bu Siti to open modal
  console.log('Opening PartnerOrderModal in Tenant view...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('Bu Siti'));
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Mulai Pilih') || b.innerText.includes('Pesan'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tenant_modal_camera_verified.png') });
  console.log('Captured: tenant_modal_camera_verified.png');

  await browser.close();
  console.log('All verification screenshots complete!');
}

run().catch(console.error);
