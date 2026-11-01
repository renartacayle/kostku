const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492';
const BASE_URL = 'https://riuph.me';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const tenantUser = {
    id: 1790690895764,
    name: "Mbak Rena",
    email: "penghuni@kostku.id",
    role: "user",
    kamar: "102",
    kostUid: "KOST-BDG-02",
    isDemo: true
  };

  // 1. Mobile Tenant Dashboard: Showcase Non-FnB Logo Cards & Beli Lagi filter
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(u => {
      localStorage.setItem('kostUser', JSON.stringify(u));
      localStorage.setItem('kostku_ordered_merchants', JSON.stringify(['PTR-DEF-01', 'PTR-DEF-03']));
    }, tenantUser);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll directly to Mitra Marketplace section
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
      const h = headings.find(el => el.innerText.includes('Mitra') || el.innerText.includes('Warung'));
      if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture mobile 2-column grid showing Non-FnB (Depot Barokah with logo/icon) alongside FnB cards
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_non_fnb_logo_showcase.png') });
    console.log('Saved: mobile_non_fnb_logo_showcase.png');

    // Click on "⚡ Beli Lagi" filter button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Beli Lagi'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Beli Lagi filtered view
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_beli_lagi_filtered.png') });
    console.log('Saved: mobile_beli_lagi_filtered.png');

    // Click on Depot Air & Gas Barokah card to open order modal
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[style*="cursor: pointer"]'));
      const c = cards.find(el => el.innerText.includes('Depot Air & Gas') || el.innerText.includes('Barokah'));
      if (c) c.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Capture Order Modal showing Non-FnB logo and "🏷️ Layanan Resmi" badge
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tenant_modal_non_fnb_logo.png') });
    console.log('Saved: tenant_modal_non_fnb_logo.png');

    await page.close();
  }

  // 2. Desktop View: 4-Column Grid with "⚡ Beli Lagi" filter
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(u => {
      localStorage.setItem('kostUser', JSON.stringify(u));
      localStorage.setItem('kostku_ordered_merchants', JSON.stringify(['PTR-DEF-01', 'PTR-DEF-03']));
    }, tenantUser);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to Mitra Marketplace
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
      const h = headings.find(el => el.innerText.includes('Mitra') || el.innerText.includes('Warung'));
      if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Desktop view showing Non-FnB logo cards and Beli Lagi tab
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_beli_lagi_showcase.png') });
    console.log('Saved: desktop_beli_lagi_showcase.png');

    await page.close();
  }

  // 3. Mitra Portal: Non-FnB Add Menu Modal (Depot Barokah)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    const nonFnbMitra = {
      id: "1792490000001",
      name: "Pak Slamet (Depot Barokah)",
      email: "barokah@kostku.id",
      role: "mitra",
      merchantId: "PTR-DEF-01",
      kostUid: "KOST-BDG-02"
    };

    await page.goto(`${BASE_URL}/mitra`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), nonFnbMitra);
    await page.goto(`${BASE_URL}/mitra`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Depot Barokah if needed
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const barokahBtn = btns.find(b => b.innerText.includes('Depot Air & Gas') || b.innerText.includes('Barokah'));
      if (barokahBtn) barokahBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Click Setting Menu
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tabBtn = btns.find(b => b.innerText.includes('Setting Menu') || b.innerText.includes('Katalog'));
      if (tabBtn) tabBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Click Tambah Menu Baru
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Tambah Menu') || b.innerText.includes('Menu Baru') || b.innerText.includes('Layanan'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Mitra Add Menu Modal showing Non-FnB Logo Banner and direct submit
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mitra_non_fnb_add_service_modal.png') });
    console.log('Saved: mitra_non_fnb_add_service_modal.png');

    await page.close();
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
