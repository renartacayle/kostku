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
    loyalty_points: 350,
    isDemo: true
  };

  try {
    // ── 1. SCREENSHOT MOBILE GRID SHOWING NON-FNB WITH FULL COVER & CLEAN BADGES ──
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(u => {
        localStorage.setItem('kostUser', JSON.stringify(u));
        localStorage.setItem('kostku_ordered_merchants', JSON.stringify(['PTR-DEF-01']));
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

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_all_grid_fixed_non_fnb.png') });
      console.log('Saved: mobile_all_grid_fixed_non_fnb.png');

      // Scroll slightly down to capture the Non-FnB cards (Dago Clean Express, Depot Barokah) in full view
      await page.evaluate(() => {
        window.scrollBy({ top: 220, behavior: 'instant' });
      });
      await new Promise(r => setTimeout(r, 600));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_non_fnb_cards_focus.png') });
      console.log('Saved: mobile_non_fnb_cards_focus.png');

      await page.close();
    }

    // ── 2. SCREENSHOT LAUNDRY ORDER MODAL (CLEAN CATALOGUE, NO JARGON) ──
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(u => {
        localStorage.setItem('kostUser', JSON.stringify(u));
      }, tenantUser);

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1500));

      // Scroll to Mitra Marketplace
      await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
        const h = headings.find(el => el.innerText.includes('Mitra') || el.innerText.includes('Warung'));
        if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await new Promise(r => setTimeout(r, 600));

      // Click on Laundry Card (Dago Clean Express)
      await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const nameEl = allElements.find(el => el.children.length === 0 && el.textContent && el.textContent.includes('Dago Clean Express'));
        if (nameEl) {
          const card = nameEl.closest('[style*="cursor: pointer"]') || nameEl;
          card.click();
        }
      });
      await new Promise(r => setTimeout(r, 1500));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_laundry_order_modal_fixed.png') });
      console.log('Saved: mobile_laundry_order_modal_fixed.png');

      await page.close();
    }

    // ── 3. SCREENSHOT GALON & GAS ORDER MODAL ──
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(u => {
        localStorage.setItem('kostUser', JSON.stringify(u));
      }, tenantUser);

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1500));

      // Scroll to Mitra Marketplace
      await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
        const h = headings.find(el => el.innerText.includes('Mitra') || el.innerText.includes('Warung'));
        if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await new Promise(r => setTimeout(r, 600));

      // Click on Galon tab to easily reach Depot Barokah
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const galonTab = btns.find(b => b.textContent && b.textContent.includes('Galon'));
        if (galonTab) galonTab.click();
      });
      await new Promise(r => setTimeout(r, 800));

      // Click on Depot Air & Gas Barokah card
      await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const nameEl = allElements.find(el => el.children.length === 0 && el.textContent && el.textContent.includes('Depot Air & Gas'));
        if (nameEl) {
          const card = nameEl.closest('[style*="cursor: pointer"]') || nameEl;
          card.click();
        }
      });
      await new Promise(r => setTimeout(r, 1500));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_galon_order_modal_fixed.png') });
      console.log('Saved: mobile_galon_order_modal_fixed.png');

      await page.close();
    }

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

main();
