const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function verifyHeadline() {
  console.log('🧪 --- MEMULAI VERIFIKASI HEADLINE GUEST VS LOGGED IN ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  try {
    // ----------------------------------------------------
    // TEST 1: GUEST USER (Belum Login)
    // ----------------------------------------------------
    console.log('\n[1/3] 🔍 Testing GUEST Mode (Belum Login)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const guestHeadlineText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });

    console.log('  Guest Headline:', guestHeadlineText.replace(/\n/g, ' '));
    assert(guestHeadlineText.includes('Bebas Calo, Foto Asli Tanpa Tipu-Tipu'), 'Headline harus muncul untuk Guest!');

    const ssGuest = path.join(ARTIFACTS_DIR, 'headline_guest_mode.png');
    await page.screenshot({ path: ssGuest, fullPage: false });
    console.log('  📸 Screenshot: headline_guest_mode.png');

    // ----------------------------------------------------
    // TEST 2: LOGGED-IN OWNER
    // ----------------------------------------------------
    console.log('\n[2/3] 👑 Testing LOGGED-IN Mode (Owner)...');
    await page.evaluate(() => {
      localStorage.clear();
      const ownerUser = {
        id: 1790329612917,
        email: 'budi.santoso@kostku.id',
        role: 'owner',
        kostUid: 'KOST-K12DQR',
        name: 'Bpk. Budi Santoso'
      };
      localStorage.setItem('kostUser', JSON.stringify(ownerUser));
      localStorage.setItem('kostUid', 'KOST-K12DQR');
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const ownerHeadlineText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });

    console.log('  Owner Headline:', ownerHeadlineText.replace(/\n/g, ' '));
    assert(!ownerHeadlineText.includes('Bebas Calo, Foto Asli Tanpa Tipu-Tipu'), 'Headline marketing Guest TIDAK BOLEH muncul untuk user login!');
    assert(ownerHeadlineText.includes('Selamat Datang Kembali'), 'Headline harus menyapa Owner!');

    const ssOwner = path.join(ARTIFACTS_DIR, 'headline_owner_logged_in.png');
    await page.screenshot({ path: ssOwner, fullPage: false });
    console.log('  📸 Screenshot: headline_owner_logged_in.png');

    // ----------------------------------------------------
    // TEST 3: LOGGED-IN TENANT / USER
    // ----------------------------------------------------
    console.log('\n[3/3] 🏠 Testing LOGGED-IN Mode (Penghuni / User)...');
    await page.evaluate(() => {
      localStorage.clear();
      const tenantUser = {
        id: 1790690390205,
        email: 'penghuni@kostku.id',
        role: 'user',
        name: 'Annisa Rahmawati'
      };
      localStorage.setItem('kostUser', JSON.stringify(tenantUser));
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const tenantHeadlineText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });

    console.log('  Tenant Headline:', tenantHeadlineText.replace(/\n/g, ' '));
    assert(!tenantHeadlineText.includes('Bebas Calo, Foto Asli Tanpa Tipu-Tipu'), 'Headline marketing Guest TIDAK BOLEH muncul untuk user login!');
    assert(tenantHeadlineText.includes('Annisa Rahmawati'), 'Headline harus menyapa Tenant!');

    const ssTenant = path.join(ARTIFACTS_DIR, 'headline_tenant_logged_in.png');
    await page.screenshot({ path: ssTenant, fullPage: false });
    console.log('  📸 Screenshot: headline_tenant_logged_in.png');

    console.log('\n🎉 SEMUA PENGUJIAN HEADLINE GUEST VS LOGGED IN BERHASIL 100%!');
  } catch (err) {
    console.error('❌ Error during headline verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyHeadline();
