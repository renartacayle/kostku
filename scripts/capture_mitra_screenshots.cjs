const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('🚀 Starting Puppeteer Screenshot Capture for Bagian Mitra...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  // Pre-seed localStorage before navigation
  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await delay(1200);

  // ==========================================
  // 1. OWNER VIEW: Manajemen Mitra & Komisi Pasif
  // ==========================================
  console.log('📌 1. Capturing Owner View - Manajemen Mitra...');
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

  await page.goto('http://localhost:5173/dashboard?tab=pengaturan', { waitUntil: 'networkidle2' });
  await delay(2000);

  // Scroll smoothly down to the Mitra section
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('span, h3, h4'));
    const target = headings.find(el => el.textContent.includes('Mitra Pribadi & Toko Affiliate') || el.textContent.includes('Mitra Pribadi'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, -60); // give some breathing room
    }
  });
  await delay(800);

  const shot1 = path.join(ARTIFACT_DIR, 'mitra_owner_management_dashboard.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('✅ Captured Shot 1:', shot1);

  // ==========================================
  // 2. OWNER VIEW: Modal Tambah Mitra Pribadi
  // ==========================================
  console.log('📌 2. Capturing Owner View - Modal Tambah Mitra...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Tambah Mitra') || b.textContent.includes('+ Tambah Mitra Pribadi'));
    if (addBtn) addBtn.click();
  });
  await delay(1000);

  const shot2 = path.join(ARTIFACT_DIR, 'mitra_owner_add_modal.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('✅ Captured Shot 2:', shot2);

  // Close the modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Tutup') || b.getAttribute('aria-label') === 'close');
    if (closeBtn) closeBtn.click();
  });
  await delay(600);

  // ==========================================
  // 3. TENANT VIEW: Marketplace Layanan Mitra Sekitar Kost
  // ==========================================
  console.log('📌 3. Capturing Tenant View - Layanan Mitra Sekitar Kost...');
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

  // Scroll to "Layanan Toko & Mitra Sekitar Kost"
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3, h4, span'));
    const target = headings.find(el => el.textContent.includes('Layanan Toko & Mitra Sekitar Kost') || el.textContent.includes('Layanan Sekitar Kost'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, -60);
    }
  });
  await delay(800);

  const shot3 = path.join(ARTIFACT_DIR, 'mitra_tenant_marketplace_view.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('✅ Captured Shot 3:', shot3);

  // ==========================================
  // 4. TENANT VIEW: Modal Order Layanan Mitra (Concierge Delivery)
  // ==========================================
  console.log('📌 4. Capturing Tenant View - Modal Order Layanan Mitra...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const orderBtn = btns.find(b => b.textContent.includes('Pilih Merek & Pesan'));
    if (orderBtn) {
      orderBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
      orderBtn.click();
    }
  });
  await delay(1500);

  const shot4 = path.join(ARTIFACT_DIR, 'mitra_tenant_order_checkout_modal.png');
  await page.screenshot({ path: shot4, fullPage: false });
  console.log('✅ Captured Shot 4:', shot4);

  // Close order modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('Batal') || b.textContent.includes('Tutup') || b.querySelector('svg.lucide-x') || b.getAttribute('aria-label') === 'close');
    if (closeBtn) closeBtn.click();
  });
  await delay(600);

  // ==========================================
  // 5. FINANCE VIEW: Titipan Escrow Mitra UMKM
  // ==========================================
  console.log('📌 5. Capturing Finance View - Titipan Escrow Mitra UMKM...');
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

  await page.goto('http://localhost:5173/keuangan', { waitUntil: 'networkidle2' });
  await delay(2000);

  // Scroll to Unified Wallet / Escrow Mitra card
  await page.evaluate(() => {
    const textNodes = Array.from(document.querySelectorAll('span, div, h3'));
    const target = textNodes.find(el => el.textContent.includes('TITIPAN ESCROW MITRA') || el.textContent.includes('mitra_escrow_balance'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await delay(800);

  const shot5 = path.join(ARTIFACT_DIR, 'mitra_finance_escrow_settlement.png');
  await page.screenshot({ path: shot5, fullPage: false });
  console.log('✅ Captured Shot 5:', shot5);

  await browser.close();
  console.log('\n🎉 All Mitra Screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
