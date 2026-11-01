const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🚀 Starting Puppeteer Verification for Paket 3 & Paket 5...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Pre-seed localStorage before navigation
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  // 1. Verify Owner View - Keuangan Dunning Tab
  console.log('📌 Testing Owner View - Keuangan Dunning Tab...');
  await page.evaluate(() => {
    const ownerUser = {
      id: 'USR-OWNER-01',
      name: 'Ibu Hj. Nurhasanah',
      role: 'owner',
      kostUid: 'KOST-BDG-02',
      phone: '081234567890',
      email: 'pemilik@kostku.id'
    };
    localStorage.setItem('kostUser', JSON.stringify(ownerUser));
    localStorage.setItem('kostName', 'Kost Putri Griya Asri Dago');
    localStorage.setItem('kostUid', 'KOST-BDG-02');
  });

  await page.goto('http://localhost:5173/keuangan?tab=dunning', { waitUntil: 'networkidle2' });
  await delay(1800);

  const shot1 = path.join(ARTIFACT_DIR, 'paket3_fintech_dunning_and_reconcile.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('✅ Captured:', shot1);

  // 2. Verify Owner View - Komunitas Tab (Mading & Preloved)
  console.log('📌 Testing Owner View - Dashboard Komunitas Tab...');
  await page.goto('http://localhost:5173/dashboard?tab=komunitas', { waitUntil: 'networkidle2' });
  await delay(1800);

  const shot2 = path.join(ARTIFACT_DIR, 'paket5_owner_community_and_bulletin.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('✅ Captured:', shot2);

  // 3. Open Guest Registration Modal in Owner View
  console.log('📌 Testing Guest Registration Modal in Owner View...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Buku Tamu') || el.textContent.includes('Tamu Inap'));
    if (b) b.click();
  });
  await delay(1000);

  const shot3 = path.join(ARTIFACT_DIR, 'paket5_guest_registration_modal.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('✅ Captured:', shot3);

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="close"], div[style*="fixed"] button');
    if (closeBtn) closeBtn.click();
  });
  await delay(500);

  // 4. Switch to Tenant / Anak Kost Session
  console.log('📌 Testing Tenant View - UserDashboard with IoT SmartLock & Community Hub...');
  await page.evaluate(() => {
    const tenantUser = {
      id: 'USR-TENANT-01',
      name: 'Rian Pratama',
      role: 'user',
      kamar: '101',
      kostUid: 'KOST-BDG-02',
      phone: '081234567891',
      email: 'penghuni@kostku.id',
      bedsheets: 2,
      loyalty_points: 250
    };
    localStorage.setItem('kostUser', JSON.stringify(tenantUser));
    localStorage.setItem('kostName', 'Kost Putri Griya Asri Dago');
    localStorage.setItem('kostUid', 'KOST-BDG-02');
  });

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await delay(2000);

  const shot4 = path.join(ARTIFACT_DIR, 'paket5_tenant_dashboard_with_iot_and_preloved.png');
  await page.screenshot({ path: shot4, fullPage: false });
  console.log('✅ Captured:', shot4);

  // 5. Scroll down to IoT SmartLock & Community Section
  await page.evaluate(() => {
    window.scrollBy(0, 700);
  });
  await delay(800);

  const shot5 = path.join(ARTIFACT_DIR, 'paket5_tenant_iot_smartlock_and_mading.png');
  await page.screenshot({ path: shot5, fullPage: false });
  console.log('✅ Captured:', shot5);

  // 6. Switch to Pasar Preloved tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const prelovedBtn = btns.find(b => b.textContent.includes('Pasar Preloved'));
    if (prelovedBtn) prelovedBtn.click();
  });
  await delay(1000);

  const shot6 = path.join(ARTIFACT_DIR, 'paket5_tenant_preloved_marketplace.png');
  await page.screenshot({ path: shot6, fullPage: false });
  console.log('✅ Captured:', shot6);

  // 7. Switch SmartLock Card to "Beban Elektronik" tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const applianceBtn = btns.find(b => b.textContent.includes('Beban Elektronik'));
    if (applianceBtn) applianceBtn.click();
  });
  await delay(1000);

  const shot7 = path.join(ARTIFACT_DIR, 'paket5_tenant_appliance_calculator.png');
  await page.screenshot({ path: shot7, fullPage: false });
  console.log('✅ Captured:', shot7);

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
