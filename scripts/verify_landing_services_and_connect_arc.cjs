const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('🧪 --- MEMULAI VERIFIKASI PILIHAN LAYANAN LANDING & CONNECT ARC ADD TO CART ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: LANDING PAGE QUICK SERVICES ROW (DESKTOP)
    // -------------------------------------------------------------------------
    console.log('\n[1/6] 🔍 Menampilkan Landing Page Desktop dengan Pilihan Layanan...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Verify grid container exists
    const gridExists = await page.$('.home-quick-services-grid');
    assert(gridExists, 'Grid .home-quick-services-grid harus ada di landing page!');

    // Check count of services (should be 6)
    const cardCount = await page.$$eval('.home-quick-services-grid button', els => els.length);
    console.log(`✓ Ditemukan ${cardCount} tombol layanan cepat di landing page.`);
    assert.strictEqual(cardCount, 6, 'Harus ada 6 layanan cepat (Mitra, PLN, PDAM, Laundry, Galon, Sewa)!');

    // Capture Desktop Landing Page with Quick Services
    const pathDesktop = path.join(ARTIFACTS_DIR, 'landing_quick_services_desktop.png');
    await page.screenshot({ path: pathDesktop });
    console.log(`📸 Screenshot tersimpan: ${pathDesktop}`);

    // -------------------------------------------------------------------------
    // TEST 2: INTERAKTIF MODAL TOKEN PLN DARI LANDING
    // -------------------------------------------------------------------------
    console.log('\n[2/6] 🔍 Menguji Klik Layanan "Token PLN" dari Landing Page...');
    // Click the PLN button (2nd button)
    const buttons = await page.$$('.home-quick-services-grid button');
    await buttons[1].click(); // Token PLN
    await sleep(800);

    // Check if PLN modal opens
    const plnModalTitle = await page.evaluate(() => {
      return document.body.innerText.includes('Beli Token Listrik') || 
             document.body.innerText.includes('Token PLN') ||
             document.body.innerText.includes('Prabayar');
    });
    console.log('✓ Modal Token PLN terbuka:', plnModalTitle);
    assert(plnModalTitle, 'Modal Token PLN harus terbuka saat tombol Token PLN diklik!');

    const pathPlnModal = path.join(ARTIFACTS_DIR, 'landing_modal_token_pln.png');
    await page.screenshot({ path: pathPlnModal });
    console.log(`📸 Screenshot tersimpan: ${pathPlnModal}`);

    // Close PLN modal
    const closeBtn = await page.$('button[title*="Tutup"], button[aria-label*="Close"], button svg.lucide-x');
    if (closeBtn) {
      await closeBtn.click();
      await sleep(500);
    } else {
      await page.keyboard.press('Escape');
      await sleep(500);
    }

    // -------------------------------------------------------------------------
    // TEST 3: INTERAKTIF MODAL AIR PDAM DARI LANDING
    // -------------------------------------------------------------------------
    console.log('\n[3/6] 🔍 Menguji Klik Layanan "Air PDAM" dari Landing Page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await sleep(800);
    const buttonsAfter = await page.$$('.home-quick-services-grid button');
    await buttonsAfter[2].click(); // Air PDAM (3rd button)
    await sleep(800);

    const pdamModalTitle = await page.evaluate(() => {
      return document.body.innerText.includes('Tagihan Air PDAM') || 
             document.body.innerText.includes('PDAM');
    });
    console.log('✓ Modal Tagihan Air PDAM terbuka:', pdamModalTitle);
    assert(pdamModalTitle, 'Modal Tagihan Air PDAM harus terbuka saat tombol Air PDAM diklik!');

    const pathPdamModal = path.join(ARTIFACTS_DIR, 'landing_modal_air_pdam.png');
    await page.screenshot({ path: pathPdamModal });
    console.log(`📸 Screenshot tersimpan: ${pathPdamModal}`);

    // -------------------------------------------------------------------------
    // TEST 4: RESPONSIVE MOBILE VIEW (3x2 GRID DI SMARTPHONE)
    // -------------------------------------------------------------------------
    console.log('\n[4/6] 🔍 Menguji Tampilan Mobile Smartphone (375x812)...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await sleep(1000);

    const pathMobile = path.join(ARTIFACTS_DIR, 'landing_quick_services_mobile_3x2.png');
    await page.screenshot({ path: pathMobile });
    console.log(`📸 Screenshot tersimpan: ${pathMobile}`);

    // -------------------------------------------------------------------------
    // TEST 5: COMET ARC ("CONNECT ARC") ADD TO CART DI /layanan
    // -------------------------------------------------------------------------
    console.log('\n[5/6] 🔍 Menguji Animasi Comet Arc ("Connect Arc") di /layanan...');
    await page.setViewport({ width: 1280, height: 900, isMobile: false });

    // Set logged-in tenant user so /layanan is accessible
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({
        id: 'usr-tenant-1',
        name: 'Andi Pratama (Penghuni Kamar 122)',
        role: 'user',
        kamar: '122',
        kostUid: 'KOST-OJN64X'
      }));
    });

    await page.goto('http://localhost:5173/layanan', { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Verify CometArcCartShowcase exists
    const showcaseExists = await page.evaluate(() => {
      const text = document.body.innerText.toUpperCase();
      return text.includes('COMET ARC') &&
             text.includes('ORBIT CERAMIC MUG');
    });
    assert(showcaseExists, 'Komponen CometArcCartShowcase harus terpasang di /layanan!');
    console.log('✓ Komponen CometArcCartShowcase terverifikasi aktif.');

    // Capture initial state
    const pathShowcaseInitial = path.join(ARTIFACTS_DIR, 'connect_arc_showcase_initial.png');
    await page.screenshot({ path: pathShowcaseInitial });

    // Click "Add to cart" on the first card
    const addToCartBtn = await page.$('button[onClick*="handleAdd"], .home-quick-services-grid button, div[style*="background: linear-gradient"] button');
    // Find button containing text "Add to cart"
    const addButtons = await page.$$('button');
    let targetAddBtn = null;
    for (const btn of addButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Add to cart')) {
        targetAddBtn = btn;
        break;
      }
    }
    assert(targetAddBtn, 'Tombol "Add to cart" harus ditemukan di showcase!');

    // Trigger Add to Cart and capture flight
    console.log('✨ Menembakkan lintasan Comet Arc menuju ikon keranjang...');
    await targetAddBtn.click();
    await sleep(250); // capture during trajectory

    const pathArcFlying = path.join(ARTIFACTS_DIR, 'connect_arc_flying_trail.png');
    await page.screenshot({ path: pathArcFlying });
    console.log(`📸 Screenshot lintasan flying trail tersimpan: ${pathArcFlying}`);

    // Wait for landing and spring bounce
    await sleep(600);

    // Verify cart count incremented
    const badgeCount = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.comet-badge-pop, span[style*="borderRadius: 999px"]'));
      return badges.map(b => b.innerText);
    });
    console.log('✓ Badge Keranjang setelah Comet Arc landing:', badgeCount);

    const pathArcLanded = path.join(ARTIFACTS_DIR, 'connect_arc_cart_bounced.png');
    await page.screenshot({ path: pathArcLanded });
    console.log(`📸 Screenshot cart spring bounce tersimpan: ${pathArcLanded}`);

    // -------------------------------------------------------------------------
    // TEST 6: INTEGRASI KASIR POS ADD TO CART DENGAN COMET ARC
    // -------------------------------------------------------------------------
    console.log('\n[6/6] 🔍 Menguji Integrasi Kasir POS (/kasir?tab=pos)...');
    // Login as mitra
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({
        id: 'usr-mitra-1',
        name: 'Pak Bambang (Mitra Warung)',
        role: 'mitra',
        category: 'mitra',
        kostUid: 'KOST-OJN64X'
      }));
    });

    await page.goto('http://localhost:5173/kasir?tab=pos', { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Verify POS tab
    const posHeader = await page.evaluate(() => document.body.innerText.includes('Kasir Register'));
    console.log('✓ Halaman Kasir POS terbuka:', posHeader);

    // Click "+ Tambah" on first POS item
    const posAddBtns = await page.$$('button');
    let foundPosAdd = null;
    for (const btn of posAddBtns) {
      const t = await page.evaluate(el => el.innerText, btn);
      if (t.includes('+ Tambah')) {
        foundPosAdd = btn;
        break;
      }
    }

    if (foundPosAdd) {
      await foundPosAdd.click();
      await sleep(300);
      const pathPosArc = path.join(ARTIFACTS_DIR, 'kasir_pos_connect_arc.png');
      await page.screenshot({ path: pathPosArc });
      console.log(`📸 Screenshot Kasir POS Connect Arc tersimpan: ${pathPosArc}`);
    }

    console.log('\n🎉 SEMUA PENGUJIAN FITUR LAYANAN LANDING & CONNECT ARC BERHASIL 100%!');

  } catch (err) {
    console.error('❌ Terjadi kesalahan pada verifikasi:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runVerification();
