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
    // ── PAGE 1: MANDIRI FILTER TAB ──
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
      await new Promise(r => setTimeout(r, 600));

      // Click exact Tab "🏪 Mandiri" Filter (not the banner button)
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tab = btns.find(b => b.textContent && b.textContent.trim() === '🏪 Mandiri');
        if (tab) tab.click();
      });
      await new Promise(r => setTimeout(r, 1000));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_mandiri_tab_filtered.png') });
      console.log('Saved: mobile_mandiri_tab_filtered.png');

      await page.close();
    }

    // ── PAGE 2: ORDER MODAL NEWCOMER PROMO ──
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

      // Find the card for Juice Bar & Camilan Mas Dimas and trigger click
      await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const nameEl = allElements.find(el => el.children.length === 0 && el.textContent && el.textContent.includes('Juice Bar & Camilan Mas Dimas'));
        if (nameEl) {
          const card = nameEl.closest('[style*="cursor: pointer"]') || nameEl;
          card.click();
        }
      });
      await new Promise(r => setTimeout(r, 1500));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tenant_order_modal_newcomer_promo.png') });
      console.log('Saved: tenant_order_modal_newcomer_promo.png');

      await page.close();
    }

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

main();
