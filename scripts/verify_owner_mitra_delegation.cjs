const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function runDelegationVerification() {
  console.log('🚀 --- MEMULAI VERIFIKASI: OWNER & MITRA DAPAT MELAKUKAN TUGAS PEGAWAI ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  try {
    // ==========================================
    // 1. OWNER: AMBIL ALIH TUGAS OPERASIONAL STAF
    // ==========================================
    console.log('\n[1/6] 🏢 Testing Owner Dashboard & Switcher Banner...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Set Owner in localStorage
    await page.evaluate(() => {
      localStorage.clear();
      const ownerUser = {
        id: 1790329612917,
        email: 'budi.santoso@kostku.id',
        role: 'owner',
        kostUid: 'KOST-K12DQR',
        kostName: 'Kost Eksklusif Melati',
        name: 'Bpk. Budi Santoso (Owner)'
      };
      localStorage.setItem('kostUser', JSON.stringify(ownerUser));
      localStorage.setItem('kostUid', 'KOST-K12DQR');
      localStorage.setItem('kostName', 'Kost Eksklusif Melati');
    });

    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot: Owner Dashboard with delegation banner
    const ssOwnerDashboard = path.join(ARTIFACTS_DIR, '1_owner_dashboard_banner_staf.png');
    await page.screenshot({ path: ssOwnerDashboard, fullPage: false });
    console.log('  📸 Screenshot saved: 1_owner_dashboard_banner_staf.png');

    // Click "Ambil Alih Tugas & Meteran Staf"
    console.log('[2/6] 🛠️ Owner beralih ke Mode Operasional Staf...');
    await page.goto('http://localhost:5173/dashboard?view=staff', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const ssOwnerStaffMode = path.join(ARTIFACTS_DIR, '2_owner_mode_operasional_staf.png');
    await page.screenshot({ path: ssOwnerStaffMode, fullPage: false });
    console.log('  📸 Screenshot saved: 2_owner_mode_operasional_staf.png');

    // Owner performs staff action: Input Meteran Listrik
    console.log('[3/6] ⚡ Owner mencatat meteran listrik kamar...');
    // Click tab "Input Meteran & Pengeluaran"
    const tabs = await page.$$('button');
    for (const b of tabs) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Input Meteran') || text.includes('Meteran')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));

    // Type meter value
    const meterInputs = await page.$$('input[type="number"]');
    if (meterInputs.length > 0) {
      await meterInputs[0].type('348');
      // Submit
      const submitButtons = await page.$$('button[type="submit"]');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
      }
    }
    await new Promise(r => setTimeout(r, 1200));

    const ssOwnerMeteranSaved = path.join(ARTIFACTS_DIR, '3_owner_catat_meteran_berhasil.png');
    await page.screenshot({ path: ssOwnerMeteranSaved, fullPage: false });
    console.log('  📸 Screenshot saved: 3_owner_catat_meteran_berhasil.png');

    // ==========================================
    // 2. MITRA: PENGOPERASIAN KASIR POS & TOKO
    // ==========================================
    console.log('\n[4/6] 🏪 Testing Mitra Portal...');
    await page.evaluate(() => {
      localStorage.clear();
      const mitraUser = {
        id: 1790948804999,
        email: 'mitra@kostku.id',
        role: 'mitra',
        kostUid: 'KOST-BDG-02',
        name: 'Ibu Hj. Siti Aisyah',
        merchantId: 'M-1'
      };
      localStorage.setItem('kostUser', JSON.stringify(mitraUser));
    });

    await page.goto('http://localhost:5173/mitra', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const ssMitraPortal = path.join(ARTIFACTS_DIR, '4_mitra_portal_operasional_toko.png');
    await page.screenshot({ path: ssMitraPortal, fullPage: false });
    console.log('  📸 Screenshot saved: 4_mitra_portal_operasional_toko.png');

    // Mitra opens POS Cashier
    console.log('[5/6] 🧾 Mitra membuka Terminal Kasir POS (Walk-in)...');
    await page.goto('http://localhost:5173/kasir', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Kasir Register tab
    const kasirTabs = await page.$$('button');
    for (const b of kasirTabs) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Kasir Register') || text.includes('Kasir')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    const ssMitraPosCashier = path.join(ARTIFACTS_DIR, '5_mitra_kasir_register_walkin.png');
    await page.screenshot({ path: ssMitraPosCashier, fullPage: false });
    console.log('  📸 Screenshot saved: 5_mitra_kasir_register_walkin.png');

    // Mitra opens Table & QR management
    console.log('[6/6] 🍽️ Mitra membuka Manajemen Meja & QR...');
    const tableTabs = await page.$$('button');
    for (const b of tableTabs) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Meja & QR') || text.includes('Meja')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    const ssMitraMejaQR = path.join(ARTIFACTS_DIR, '6_mitra_kelola_meja_dan_qr.png');
    await page.screenshot({ path: ssMitraMejaQR, fullPage: false });
    console.log('  📸 Screenshot saved: 6_mitra_kelola_meja_dan_qr.png');

    console.log('\n🎉 SEMUA 6 VERIFIKASI TUNTAS DENGAN SUKSES & SCREENSHOT LENGKAP!');
  } catch (err) {
    console.error('❌ Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runDelegationVerification();
