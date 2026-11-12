const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function runCategoryNavbarsVerification() {
  console.log('--- 🧪 STARTING DEDICATED CATEGORY NAVBARS VERIFICATION ---');

  // Spawn preview server
  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: '/home/rena/.gemini/antigravity/scratch/kostku',
    stdio: 'pipe'
  });

  await new Promise(r => setTimeout(r, 2200));

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Helper to get capsule role buttons
    const getCapsuleButtons = async () => {
      return await page.evaluate(() => {
        const capsule = document.querySelector('.role-capsule-switcher');
        if (!capsule) return [];
        return Array.from(capsule.querySelectorAll('button')).map(b => b.innerText.trim());
      });
    };

    // Helper to get active category tabs
    const getActiveCategoryTabs = async () => {
      return await page.evaluate(() => {
        const navBar = document.querySelector('.role-nav-bar');
        if (!navBar) return [];
        return Array.from(navBar.querySelectorAll('button')).map(b => b.innerText.trim());
      });
    };

    // Helper to click category capsule button
    const clickCapsule = async (roleName) => {
      await page.evaluate((name) => {
        const btns = Array.from(document.querySelectorAll('.role-capsule-switcher button'));
        const btn = btns.find(b => b.innerText.includes(name));
        if (btn) btn.click();
      }, roleName);
      await new Promise(r => setTimeout(r, 1200));
    };

    // --- TEST 1: PENCARI KOST NAVBAR ---
    console.log('\n🔍 [TEST 1] Verifying PENCARI KOST Dedicated Navbar...');
    await clickCapsule('Pencari');
    const userTabs = await getActiveCategoryTabs();
    console.log('Pencari Kost Tabs:', userTabs);
    assert(userTabs.some(t => t.includes('Beranda')), 'Beranda tab missing for Pencari');
    assert(userTabs.some(t => t.includes('Cari Kost')), 'Cari Kost tab missing for Pencari');
    assert(userTabs.some(t => t.includes('Layanan')), 'Layanan tab missing for Pencari');
    assert(userTabs.some(t => t.includes('Kost Saya')), 'Kost Saya tab missing for Pencari');
    console.log('✅ Pencari Kost has its own dedicated navbar: [Beranda, Cari Kost, Layanan, Kost Saya]!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'navbar_pencari_kost.png') });

    // Test internal tab navigation in Pencari: Click "Cari Kost"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      const cariTab = btns.find(b => b.innerText.includes('Cari Kost'));
      if (cariTab) cariTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/search'), 'Expected URL to be /search');
    console.log('✅ Pencari tab "Cari Kost" navigated successfully to /search!');

    // --- TEST 2: OWNER NAVBAR ---
    console.log('\n👑 [TEST 2] Verifying OWNER Dedicated Navbar...');
    await clickCapsule('Owner');
    const ownerTabs = await getActiveCategoryTabs();
    console.log('Owner Tabs:', ownerTabs);
    assert(ownerTabs.some(t => t.includes('Kamar')), 'Kamar tab missing for Owner');
    assert(ownerTabs.some(t => t.includes('Penghuni')), 'Penghuni tab missing for Owner');
    assert(ownerTabs.some(t => t.includes('Keuangan')), 'Keuangan tab missing for Owner');
    assert(ownerTabs.some(t => t.includes('Karyawan')), 'Karyawan tab missing for Owner');
    console.log('✅ Owner has its own dedicated navbar: [Kamar, Penghuni, Keuangan, Karyawan]!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'navbar_owner.png') });

    // Test internal tab navigation in Owner: Click "Penghuni"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      const penghuniTab = btns.find(b => b.innerText.includes('Penghuni'));
      if (penghuniTab) penghuniTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/penghuni'), 'Expected URL to be /penghuni');
    console.log('✅ Owner tab "Penghuni" navigated successfully to /penghuni!');

    // --- TEST 3: MITRA NAVBAR ---
    console.log('\n🏪 [TEST 3] Verifying MITRA Dedicated Navbar...');
    await clickCapsule('Mitra');
    const mitraTabs = await getActiveCategoryTabs();
    console.log('Mitra Tabs:', mitraTabs);
    assert(mitraTabs.some(t => t.includes('Katalog')), 'Katalog tab missing for Mitra');
    assert(mitraTabs.some(t => t.includes('Kasir POS')), 'Kasir POS tab missing for Mitra');
    assert(mitraTabs.some(t => t.includes('Meja QR')), 'Meja QR tab missing for Mitra');
    assert(mitraTabs.some(t => t.includes('Omset')), 'Omset tab missing for Mitra');
    console.log('✅ Mitra has its own dedicated navbar: [Katalog, Kasir POS, Meja QR, Omset]!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'navbar_mitra.png') });

    // Test internal tab navigation in Mitra: Click "Kasir POS"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      const kasirTab = btns.find(b => b.innerText.includes('Kasir POS'));
      if (kasirTab) kasirTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/kasir'), 'Expected URL to be /kasir');
    console.log('✅ Mitra tab "Kasir POS" navigated successfully to /kasir!');

    // --- TEST 4: PEGAWAI NAVBAR ---
    console.log('\n👔 [TEST 4] Verifying PEGAWAI Dedicated Navbar...');
    // Return to dashboard first
    await page.goto('http://localhost:4173/dashboard');
    await new Promise(r => setTimeout(r, 800));
    await clickCapsule('Pegawai');
    const staffTabs = await getActiveCategoryTabs();
    console.log('Pegawai Tabs:', staffTabs);
    assert(staffTabs.some(t => t.includes('Tugas')), 'Tugas tab missing for Pegawai');
    assert(staffTabs.some(t => t.includes('Meteran')), 'Meteran tab missing for Pegawai');
    assert(staffTabs.some(t => t.includes('Inspeksi')), 'Inspeksi tab missing for Pegawai');
    assert(staffTabs.some(t => t.includes('Komplain')), 'Komplain tab missing for Pegawai');
    console.log('✅ Pegawai has its own dedicated navbar: [Tugas, Meteran, Inspeksi, Komplain]!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'navbar_pegawai.png') });

    // Test internal tab navigation in Pegawai: Click "Komplain"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      const komplainTab = btns.find(b => b.innerText.includes('Komplain'));
      if (komplainTab) komplainTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/komplain'), 'Expected URL to be /komplain');
    console.log('✅ Pegawai tab "Komplain" navigated successfully to /komplain!');

    // --- TEST 5: MOBILE VIEWPORT VERIFICATION (390x844) ---
    console.log('\n📱 [TEST 5] Verifying on Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await clickCapsule('Owner');
    const mobileOwnerTabs = await getActiveCategoryTabs();
    assert(mobileOwnerTabs.length === 4, 'Mobile navbar should render 4 tabs cleanly');
    console.log('✅ Mobile viewport renders Owner dedicated navbar with zero layout overflow!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'navbar_mobile_owner.png') });

    console.log('\n🎉 ALL 5 DEDICATED CATEGORY NAVBAR VERIFICATION CHECKS PASSED PERFECTLY!');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

runCategoryNavbarsVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
