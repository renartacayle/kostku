const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/24956631-2679-40ee-8e2f-108e0ae1b924';
const FRONTEND_PORT = 4188;

(async () => {
  console.log('🚀 Running Targeted Verification Screen Capture...');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Verify 2D Floorplan Modal
  console.log('Capturing action_03_modal_floorplan_2d.png...');
  await page.goto(`http://localhost:${FRONTEND_PORT}/`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('button', { timeout: 10000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText && (b.innerText.includes('Denah 2D') || b.innerText.includes('Denah Kamar') || b.innerText.includes('📐')));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'action_03_modal_floorplan_2d.png') });

  // 2. Verify Checkout Page
  console.log('Capturing page_13_checkout_page.png...');
  await page.goto(`http://localhost:${FRONTEND_PORT}/checkout?kostUid=KOST-OJN64X&room=122`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page_13_checkout_page.png') });

  // 3. Verify Karyawan / Staff Page
  console.log('Capturing page_28_karyawan_staff_page.png...');
  await page.evaluate(() => {
    const demoOwner = {
      id: 'demo-owner-1',
      name: 'Ibu Hj. Nurhasanah (Pemilik Kost)',
      email: 'pemilik@kostku.id',
      role: 'owner',
      isDemo: true,
      kostUid: 'KOST-BDG-02'
    };
    localStorage.setItem('user', JSON.stringify(demoOwner));
    localStorage.setItem('kostku_user', JSON.stringify(demoOwner));
    localStorage.setItem('kostku_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.goto(`http://localhost:${FRONTEND_PORT}/karyawan`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page_28_karyawan_staff_page.png') });

  await browser.close();
  console.log('✅ Targeted Verification Capture Completed!');
})();
