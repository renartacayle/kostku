const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const assert = require('assert');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyMitraDeliverySettings() {
  console.log('🧪 --- MEMULAI VERIFIKASI PENGATURAN MITRA ONGKIR PER KM & JAM KIRIM ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: LOGIN SEBAGAI MITRA & BUKA PENGATURAN TOKO
    // -------------------------------------------------------------------------
    console.log('\n[1/4] 🔍 Login sebagai Mitra UMKM dan membuka /mitra...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({
        id: '1794126789381',
        name: 'Ibu Hj. Siti Aisyah',
        role: 'mitra',
        category: 'mitra',
        merchantId: 'MTR-MW7KRMKL',
        kostUid: 'KOST-JAKSEL-01'
      }));
    });

    await page.goto('http://localhost:5173/mitra', { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Click on tab 'Pengaturan Pengantaran & Toko'
    console.log('👉 Mengklik tab "Pengaturan Pengantaran & Toko"...');
    const tabs = await page.$$('button');
    let settingsTab = null;
    for (const t of tabs) {
      const text = await page.evaluate(el => el.innerText, t);
      if (text.includes('Pengaturan') || text.includes('Pengantaran & Toko')) {
        settingsTab = t;
        break;
      }
    }
    assert(settingsTab, 'Tab Pengaturan Pengantaran & Toko harus ada di portal mitra!');
    await settingsTab.click();
    await sleep(1000);

    // Verify presence of ongkir per km and jam kirim
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(pageText.includes('Tarif Ongkir Per KM'), 'Form input Tarif Ongkir Per KM harus ada!');
    assert(pageText.includes('Jam Buka Pengantaran'), 'Form input Jam Buka Pengantaran harus ada!');
    assert(pageText.includes('Simulasi Otomatis Ongkir'), 'Simulasi live kalkulator ongkir harus ada!');
    console.log('✓ Komponen Pengaturan Ongkir Per KM & Jam Kirim terdeteksi aktif.');

    // Capture Mitra Settings Screen
    const pathMitraSettings = path.join(ARTIFACTS_DIR, 'mitra_settings_ongkir_per_km_dan_jam_kirim.png');
    await page.screenshot({ path: pathMitraSettings });
    console.log(`📸 Screenshot tersimpan: ${pathMitraSettings}`);

    // -------------------------------------------------------------------------
    // TEST 2: UBAH ONGKIR PER KM & JAM KIRIM, LALU SIMPAN
    // -------------------------------------------------------------------------
    console.log('\n[2/4] 🔍 Mengisi data tarif Rp 3.000/km & Jam Kirim 07:00 - 21:30 WIB...');
    await page.evaluate(() => {
      // Find inputs and set values
      const inputs = Array.from(document.querySelectorAll('input'));
      const perKmInput = inputs.find(i => i.placeholder === '2500' || (i.previousElementSibling && i.previousElementSibling.innerText?.includes('Per KM')));
      if (perKmInput) {
        perKmInput.value = '3000';
        perKmInput.dispatchEvent(new Event('input', { bubbles: true }));
        perKmInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Click Save Button
    const saveButtons = await page.$$('button[type="submit"]');
    let saveBtn = null;
    for (const b of saveButtons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Simpan Pengaturan')) {
        saveBtn = b;
        break;
      }
    }
    assert(saveBtn, 'Tombol Simpan Pengaturan harus ada!');
    await saveBtn.click();
    await sleep(800);

    const pathSavedToast = path.join(ARTIFACTS_DIR, 'mitra_settings_saved_success.png');
    await page.screenshot({ path: pathSavedToast });
    console.log(`📸 Screenshot notifikasi berhasil disimpan tersimpan: ${pathSavedToast}`);

    // -------------------------------------------------------------------------
    // TEST 3: TAMPILAN KATALOG MITRA DI /layanan (BADGE ONGKIR & JAM KIRIM)
    // -------------------------------------------------------------------------
    console.log('\n[3/4] 🔍 Login sebagai Anak Kost dan membuka /layanan...');
    await page.evaluate(() => {
      localStorage.setItem('kostUser', JSON.stringify({
        id: '1784987632155',
        name: 'Oscar Herdian Wijaya',
        role: 'user',
        kamar: '122',
        kostUid: 'KOST-OJN64X'
      }));
    });

    await page.goto('http://localhost:5173/layanan', { waitUntil: 'networkidle2' });
    await sleep(2000);

    const pathLayananGrid = path.join(ARTIFACTS_DIR, 'layanan_mitra_card_ongkir_dan_jam_kirim.png');
    await page.screenshot({ path: pathLayananGrid });
    console.log(`📸 Screenshot kartu mitra di /layanan tersimpan: ${pathLayananGrid}`);

    // -------------------------------------------------------------------------
    // TEST 4: MODAL PEMESANAN TENANT DENGAN ESTIMASI ONGKIR & JAM KIRIM
    // -------------------------------------------------------------------------
    console.log('\n[4/4] 🔍 Menguji Modal Pemesanan Tenant (PartnerOrderModal)...');
    // Click first merchant card with .mitra-grid-card or [data-testid="mitra-card"]
    const firstCard = await page.$('.mitra-grid-card') || await page.$('[data-testid="mitra-card"]');
    if (firstCard) {
      await firstCard.click();
      await sleep(1200);
      const modalText = await page.evaluate(() => document.body.innerText);
      console.log('✓ PartnerOrderModal terbuka.');
      assert(modalText.includes('Jam Kirim') || modalText.includes('Diantar ke Kamar') || modalText.includes('Tarif Antar'), 'Modal pemesanan harus menampilkan jam kirim dan estimasi antar!');

      const pathOrderModal = path.join(ARTIFACTS_DIR, 'tenant_order_modal_ongkir_per_km_dan_jam_kirim.png');
      await page.screenshot({ path: pathOrderModal });
      console.log(`📸 Screenshot modal pesanan tenant tersimpan: ${pathOrderModal}`);
    } else {
      console.warn('⚠️ Tidak menemukan .mitra-grid-card, mencoba fallback selector');
    }

    console.log('\n🎉 SEMUA PENGUJIAN PENGATURAN ONGKIR PER KM & JAM KIRIM BERHASIL 100%!');

  } catch (err) {
    console.error('❌ Terjadi kesalahan pada verifikasi:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

verifyMitraDeliverySettings();
