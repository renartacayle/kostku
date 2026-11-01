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

  // 1. Mobile View: Normal Cards showing Real Terlaris (sales count) & Non-FnB/Camera badges
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(u => {
      localStorage.setItem('kostUser', JSON.stringify(u));
      localStorage.setItem('kostku_ordered_merchants', JSON.stringify(['PTR-DEF-01', 'PTR-SHARED-03-DEF']));
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

    // Screenshot normal cards (Semua filter)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_all_merchants_real_bestseller.png') });
    console.log('Saved: mobile_all_merchants_real_bestseller.png');

    // Click "⚡ Beli Lagi" filter button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Beli Lagi'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot Beli Lagi filtered view: Must ONLY show "⚡ Beli Lagi" badge, NO Best Seller, NO Non-FnB, and NO "🌐 Jaringan" badge!
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_beli_lagi_clean_no_jaringan.png') });
    console.log('Saved: mobile_beli_lagi_clean_no_jaringan.png');

    // Click on Depot Air & Gas Barokah card to open order modal
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[style*="cursor: pointer"]'));
      const c = cards.find(el => el.innerText.includes('Depot Air & Gas') || el.innerText.includes('Barokah'));
      if (c) c.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Screenshot order modal showing Real Terlaris with authentic sales count
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'modal_real_terlaris_sales_count.png') });
    console.log('Saved: modal_real_terlaris_sales_count.png');

    await page.close();
  }

  // 2. Desktop View: 4-Column Grid showing clean Beli Lagi & Real Best Seller
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(u => {
      localStorage.setItem('kostUser', JSON.stringify(u));
      localStorage.setItem('kostku_ordered_merchants', JSON.stringify(['PTR-DEF-01', 'PTR-SHARED-03-DEF']));
    }, tenantUser);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
      const h = headings.find(el => el.innerText.includes('Mitra') || el.innerText.includes('Warung'));
      if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 800));

    // Click "⚡ Beli Lagi" filter button on desktop
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Beli Lagi'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_beli_lagi_clean_no_jaringan.png') });
    console.log('Saved: desktop_beli_lagi_clean_no_jaringan.png');

    await page.close();
  }

  await browser.close();
  console.log('Verification script completed successfully!');
}

main().catch(err => {
  console.error('Error in verification:', err);
  process.exit(1);
});
