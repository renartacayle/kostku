const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function runRoleNavVerification() {
  console.log('--- 🧪 STARTING 4-ROLE BOTTOM NAV VERIFICATION ---');

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

    // 1. Test on Desktop Viewport (1280x800)
    console.log('\n🖥️ [TEST 1] Verifying on Desktop Viewport (1280x800)...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Verify 4 role buttons exist
    const buttonsText = await page.evaluate(() => {
      const nav = document.querySelector('nav.role-bottom-nav');
      if (!nav) return null;
      const btns = Array.from(nav.querySelectorAll('button'));
      return btns.map(b => b.innerText.replace(/\n/g, ' '));
    });

    console.log('Detected nav items on desktop:', buttonsText);
    assert(buttonsText && buttonsText.length === 4, 'Expected 4 role buttons in bottom nav');
    assert(buttonsText.some(t => t.includes('Cari Kost')), 'Cari Kost button missing');
    assert(buttonsText.some(t => t.includes('Owner')), 'Owner button missing');
    assert(buttonsText.some(t => t.includes('Mitra')), 'Mitra button missing');
    assert(buttonsText.some(t => t.includes('Pegawai')), 'Pegawai button missing');
    console.log('✅ Desktop bottom nav correctly renders all 4 roles: Cari Kost, Owner, Mitra, Pegawai!');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_nav_desktop_landing.png') });

    // 2. Test Clicking "Owner" Tab
    console.log('\n👑 [TEST 2] Clicking "Owner" tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('nav.role-bottom-nav button'));
      const ownerBtn = btns.find(b => b.innerText.includes('Owner'));
      if (ownerBtn) ownerBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const currentUrlAfterOwner = page.url();
    console.log('URL after clicking Owner:', currentUrlAfterOwner);
    assert(currentUrlAfterOwner.includes('/dashboard'), 'Expected to be on /dashboard');
    console.log('✅ Successfully switched to Owner Dashboard!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_nav_desktop_owner.png') });

    // 3. Test Clicking "Mitra" Tab
    console.log('\n🏪 [TEST 3] Clicking "Mitra" tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('nav.role-bottom-nav button'));
      const mitraBtn = btns.find(b => b.innerText.includes('Mitra'));
      if (mitraBtn) mitraBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const currentUrlAfterMitra = page.url();
    console.log('URL after clicking Mitra:', currentUrlAfterMitra);
    assert(currentUrlAfterMitra.includes('/mitra'), 'Expected to be on /mitra');
    console.log('✅ Successfully switched to Mitra UMKM Portal!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_nav_desktop_mitra.png') });

    // 4. Test Clicking "Pegawai" Tab
    console.log('\n👔 [TEST 4] Clicking "Pegawai" tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('nav.role-bottom-nav button'));
      const staffBtn = btns.find(b => b.innerText.includes('Pegawai'));
      if (staffBtn) staffBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const currentUrlAfterStaff = page.url();
    console.log('URL after clicking Pegawai:', currentUrlAfterStaff);
    assert(currentUrlAfterStaff.includes('/dashboard') || currentUrlAfterStaff.includes('/karyawan'), 'Expected to be on staff view');
    const isStaffActive = await page.evaluate(() => {
      const savedUser = JSON.parse(localStorage.getItem('kostUser') || '{}');
      return savedUser.role === 'staff';
    });
    assert(isStaffActive, 'Expected user session to be adapted to staff');
    console.log('✅ Successfully switched to Pegawai/Staff view with staff role session!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_nav_desktop_pegawai.png') });

    // 5. Test Clicking "Cari Kost" Tab
    console.log('\n🔍 [TEST 5] Clicking "Cari Kost" tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('nav.role-bottom-nav button'));
      const cariBtn = btns.find(b => b.innerText.includes('Cari Kost'));
      if (cariBtn) cariBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const currentUrlAfterCari = page.url();
    console.log('URL after clicking Cari Kost:', currentUrlAfterCari);
    assert(currentUrlAfterCari.includes('/search'), 'Expected to be on /search');
    console.log('✅ Successfully switched back to Cari Kost Marketplace!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_nav_desktop_cari_kost.png') });

    // 6. Test on Mobile Viewport (390x844 iPhone 13/14)
    console.log('\n📱 [TEST 6] Verifying Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4173/search', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const mobileButtonsText = await page.evaluate(() => {
      const nav = document.querySelector('nav.role-bottom-nav');
      if (!nav) return null;
      const btns = Array.from(nav.querySelectorAll('button'));
      return btns.map(b => b.innerText.replace(/\n/g, ' '));
    });
    console.log('Detected nav items on mobile:', mobileButtonsText);
    assert(mobileButtonsText && mobileButtonsText.length === 4, 'Expected 4 role buttons in mobile bottom nav');
    console.log('✅ Mobile bottom nav verified cleanly!');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_nav_mobile_search.png') });

    console.log('\n🎉 ALL 6 VERIFICATION CHECKS PASSED PERFECTLY!');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

runRoleNavVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
