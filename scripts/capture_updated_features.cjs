const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';
const BASE_URL = 'http://localhost:3001';

async function captureAllArtifactScreenshots() {
  console.log('📸 Capturing mobile screenshots of updated categories & qty adder...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  const page = await browser.newPage();
  // Standard modern mobile viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  try {
    // 1. KASIR REGISTER: CATEGORIES 2-COLUMN GRID (NO SCROLL)
    await page.goto(`${BASE_URL}/kasir`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Switch to Kasir Register tab
    const btns = await page.$$('button');
    for (const b of btns) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Kasir Register')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));

    // Capture Kasir Register initial state (2-column categories, 2-column menu)
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'kasir_categories_2col_grid.png'),
      fullPage: false
    });
    console.log('✅ Captured kasir_categories_2col_grid.png');

    // Test Qty Stepper in Kasir: Increase Mie Gacoan to qty 5, then click Tambah
    const kasirInputs = await page.$$('div > div > input[type="number"]');
    if (kasirInputs.length > 0) {
      const firstInput = kasirInputs[0];
      const parentCard = await page.evaluateHandle(el => el.closest('div[style*="border-radius: 16px"]'), firstInput);
      const cardBtns = await parentCard.$$('button');

      // Click Plus button 4 times to set qty to 5
      await cardBtns[1].click();
      await cardBtns[1].click();
      await cardBtns[1].click();
      await cardBtns[1].click();
      await new Promise(r => setTimeout(r, 200));

      // Capture state before adding (showing Qty = 5 and "+ Tambah (5)" button)
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'kasir_qty_stepper_5_selected.png'),
        fullPage: false
      });
      console.log('✅ Captured kasir_qty_stepper_5_selected.png');

      // Click Add Button
      await cardBtns[2].click();
      await new Promise(r => setTimeout(r, 400));

      // Capture state after adding: badge shows "5 di Kasir", and stepper RESETS TO 1!
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'kasir_qty_added_and_reset_to_1.png'),
        fullPage: false
      });
      console.log('✅ Captured kasir_qty_added_and_reset_to_1.png');
    }

    // 2. CUSTOMER SELF-ORDER: CATEGORIES 2-COLUMN GRID (NO SCROLL)
    await page.goto(`${BASE_URL}/order/MEJA-01-TKN881`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Scroll slightly down to focus on categories and menu
    await page.evaluate(() => window.scrollBy(0, 180));
    await new Promise(r => setTimeout(r, 300));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'order_categories_2col_grid.png'),
      fullPage: false
    });
    console.log('✅ Captured order_categories_2col_grid.png');

    // Test Qty Stepper on Customer Order: Increase second product (Nasi Goreng) to qty 3
    const orderInputs = await page.$$('div > div > input[type="number"]');
    if (orderInputs.length > 1) {
      const targetInput = orderInputs[1];
      const parentCard = await page.evaluateHandle(el => el.closest('div[style*="border-radius: 16px"]'), targetInput);
      const cardBtns = await parentCard.$$('button');

      // Click Plus 2 times -> qty 3
      await cardBtns[1].click();
      await cardBtns[1].click();
      await new Promise(r => setTimeout(r, 200));

      // Click Add Button
      await cardBtns[2].click();
      await new Promise(r => setTimeout(r, 400));

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'order_qty_added_and_reset_to_1.png'),
        fullPage: false
      });
      console.log('✅ Captured order_qty_added_and_reset_to_1.png');
    }

    console.log('🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureAllArtifactScreenshots();
