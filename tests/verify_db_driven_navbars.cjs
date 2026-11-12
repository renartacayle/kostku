const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const assert = require('assert');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function verifyDbDrivenNavbars() {
  console.log('--- 🧪 STARTING DATABASE-DRIVEN CATEGORY NAVBARS VERIFICATION ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  try {
    // ══════════════════════════════════════════════════════════
    // TEST 1: GUEST / PENCARI KOST (Default Public Visitor)
    // ══════════════════════════════════════════════════════════
    console.log('\n[1/5] Testing Guest / Pencari Kost...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Assert: NO capsule switcher buttons exist
    const capsuleExists1 = await page.evaluate(() => Boolean(document.querySelector('.role-capsule-switcher')));
    assert.strictEqual(capsuleExists1, false, 'Kapsul switcher harus sudah dihapus dari DOM');

    // Extract tab labels
    const tabsGuest = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      return btns.map(b => b.innerText.trim());
    });
    console.log('Guest navbar tabs:', tabsGuest);
    assert.deepStrictEqual(tabsGuest, ['Beranda', 'Cari Kost', 'Layanan', 'Kost Saya']);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/db_navbar_pencari_kost.png` });
    console.log('✅ Guest / Pencari Kost verified! Screenshot saved.');

    // ══════════════════════════════════════════════════════════
    // TEST 2: OWNER USER (Auto-fetched from database /api/users/:id)
    // ══════════════════════════════════════════════════════════
    console.log('\n[2/5] Testing Owner User auto-sync from Database...');
    await page.evaluate(() => {
      // Simulate stored user session with only id
      localStorage.setItem('kostUser', JSON.stringify({ id: 1784987558042 }));
    });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Verify localStorage has synced role: 'owner' from database
    const syncedOwner = await page.evaluate(() => JSON.parse(localStorage.getItem('kostUser') || '{}'));
    console.log('Owner synced from DB:', { id: syncedOwner.id, name: syncedOwner.name, role: syncedOwner.role });
    assert.strictEqual(syncedOwner.role, 'owner');

    const capsuleExists2 = await page.evaluate(() => Boolean(document.querySelector('.role-capsule-switcher')));
    assert.strictEqual(capsuleExists2, false);

    const tabsOwner = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      return btns.map(b => b.innerText.trim());
    });
    console.log('Owner navbar tabs:', tabsOwner);
    assert.deepStrictEqual(tabsOwner, ['Kamar', 'Penghuni', 'Keuangan', 'Karyawan']);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/db_navbar_owner.png` });
    console.log('✅ Owner verified! Screenshot saved.');

    // ══════════════════════════════════════════════════════════
    // TEST 3: MITRA USER (Auto-fetched from database /api/users/:id)
    // ══════════════════════════════════════════════════════════
    console.log('\n[3/5] Testing Mitra User auto-sync from Database...');
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({ id: '1794126789381' }));
    });
    await page.goto('http://localhost:5173/mitra', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const syncedMitra = await page.evaluate(() => JSON.parse(localStorage.getItem('kostUser') || '{}'));
    console.log('Mitra synced from DB:', { id: syncedMitra.id, name: syncedMitra.name, role: syncedMitra.role });
    assert.strictEqual(syncedMitra.role, 'mitra');

    const tabsMitra = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      return btns.map(b => b.innerText.trim());
    });
    console.log('Mitra navbar tabs:', tabsMitra);
    assert.deepStrictEqual(tabsMitra, ['Katalog', 'Kasir POS', 'Meja QR', 'Omset']);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/db_navbar_mitra.png` });
    console.log('✅ Mitra verified! Screenshot saved.');

    // ══════════════════════════════════════════════════════════
    // TEST 4: PEGAWAI / STAFF USER (Auto-fetched from database /api/users/:id)
    // ══════════════════════════════════════════════════════════
    console.log('\n[4/5] Testing Pegawai / Staff User auto-sync from Database...');
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({ id: '1794126999999' }));
    });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const syncedStaff = await page.evaluate(() => JSON.parse(localStorage.getItem('kostUser') || '{}'));
    console.log('Staff synced from DB:', { id: syncedStaff.id, name: syncedStaff.name, role: syncedStaff.role });
    assert.strictEqual(syncedStaff.role, 'staff');

    const tabsStaff = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      return btns.map(b => b.innerText.trim());
    });
    console.log('Staff navbar tabs:', tabsStaff);
    assert.deepStrictEqual(tabsStaff, ['Tugas', 'Meteran', 'Inspeksi', 'Komplain']);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/db_navbar_pegawai.png` });
    console.log('✅ Pegawai / Staff verified! Screenshot saved.');

    // ══════════════════════════════════════════════════════════
    // TEST 5: REAL DATABASE LOGIN AUTHENTICATION (via /login Form)
    // ══════════════════════════════════════════════════════════
    console.log('\n[5/5] Testing Real Database Login Authentication via /login...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    // Fill in credentials for Mitra in DB
    await page.type('input[placeholder*="nama@email.com"]', 'mitra@kostku.id');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to /mitra and navbar render
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    const loggedInUser = await page.evaluate(() => JSON.parse(localStorage.getItem('kostUser') || '{}'));
    console.log('User logged in from DB:', { name: loggedInUser.name, role: loggedInUser.role });
    assert.strictEqual(loggedInUser.role, 'mitra');

    const tabsPostLogin = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.role-nav-bar button'));
      return btns.map(b => b.innerText.trim());
    });
    console.log('Post-login navbar tabs:', tabsPostLogin);
    assert.deepStrictEqual(tabsPostLogin, ['Katalog', 'Kasir POS', 'Meja QR', 'Omset']);

    await page.screenshot({ path: `${ARTIFACTS_DIR}/db_navbar_login_mitra_success.png` });
    console.log('✅ Real Database Login Flow verified! Screenshot saved.');

    console.log('\n🎉 ALL 5 DATABASE-DRIVEN NAVBAR TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

verifyDbDrivenNavbars().catch(err => {
  console.error(err);
  process.exit(1);
});
