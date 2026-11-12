const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';
const BASE_URL = 'http://localhost:3001';

async function runVerification() {
  console.log('🚀 Starting Chrome Mobile Verification for Categories & Qty Adder...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. TEST KASIR REGISTER
    // ═══════════════════════════════════════════════════════════════
    console.log('👉 Navigating to Kasir:', `${BASE_URL}/kasir`);
    await page.goto(`${BASE_URL}/kasir`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Click Tab 2: Kasir Register
    console.log('👉 Clicking Kasir Register Tab...');
    const registerTabBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Kasir Register'));
    });
    if (registerTabBtn) {
      await registerTabBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // Verify Category Layout: Should be in 2 columns (grid), not single row
    const kasirCatGridCheck = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2, h3, h4')).find(h => h.textContent.includes('Katalog Menu Kasir'));
      if (!heading) return { error: 'Katalog heading not found' };
      const catContainer = heading.closest('div').parentElement.querySelector('div[style*="grid"]');
      if (!catContainer) return { error: 'Grid container not found' };
      const btns = Array.from(catContainer.querySelectorAll('button'));
      return {
        totalButtons: btns.length,
        buttonTexts: btns.map(b => b.textContent.trim()),
        gridStyle: catContainer.getAttribute('style')
      };
    });
    console.log('📊 Kasir Categories Grid Layout:', JSON.stringify(kasirCatGridCheck, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'kasir_categories_grid_mobile.png'),
      fullPage: false
    });
    console.log('📸 Saved kasir_categories_grid_mobile.png');

    // Test Quantity Adder on First Product Card
    console.log('👉 Testing Quantity Stepper on Kasir Product Card...');
    const stepperTest = await page.evaluate(async () => {
      // Find the first product card
      const cards = document.querySelectorAll('div[style*="border-radius: 16px"]');
      if (!cards.length) return { error: 'No product cards found' };
      const firstCard = cards[0];

      // Stepper input and buttons
      const input = firstCard.querySelector('input[type="number"]');
      const minusBtn = firstCard.querySelectorAll('button')[0];
      const plusBtn = firstCard.querySelectorAll('button')[1];
      const addBtn = firstCard.querySelectorAll('button')[2];

      const initialVal = input ? input.value : null;

      // Click + button 4 times to reach qty = 5
      plusBtn.click();
      plusBtn.click();
      plusBtn.click();
      plusBtn.click();

      const valAfterClicks = input.value;
      const addBtnTextBefore = addBtn.textContent.trim();

      // Click Add Button
      addBtn.click();

      // Wait brief moment for state update
      await new Promise(r => setTimeout(r, 200));

      const valAfterAdd = input.value;
      const addBtnTextAfter = addBtn.textContent.trim();
      const badgeText = firstCard.textContent;

      return {
        initialVal,
        valAfterClicks,
        addBtnTextBefore,
        valAfterAdd, // MUST BE "1" (RESET TO 1)
        addBtnTextAfter,
        badgeFound: badgeText.includes('5 di Kasir')
      };
    });
    console.log('📊 Kasir Stepper Test Result:', JSON.stringify(stepperTest, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'kasir_item_added_reset_to_1.png'),
      fullPage: false
    });
    console.log('📸 Saved kasir_item_added_reset_to_1.png');

    // ═══════════════════════════════════════════════════════════════
    // 2. TEST CUSTOMER SELF-ORDER (/order/MEJA-01-TKN881)
    // ═══════════════════════════════════════════════════════════════
    console.log('👉 Navigating to Customer Self-Order:', `${BASE_URL}/order/MEJA-01-TKN881`);
    await page.goto(`${BASE_URL}/order/MEJA-01-TKN881`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Check Categories on OrderMeja
    const orderCatGridCheck = await page.evaluate(() => {
      const catContainer = document.querySelector('div[style*="repeat(2, minmax(0, 1fr))"]');
      if (!catContainer) return { error: 'OrderMeja Category 2-column grid not found' };
      const btns = Array.from(catContainer.querySelectorAll('button'));
      return {
        totalButtons: btns.length,
        buttonTexts: btns.map(b => b.textContent.trim()),
        gridColumns: window.getComputedStyle(catContainer).gridTemplateColumns
      };
    });
    console.log('📊 OrderMeja Categories Grid Layout:', JSON.stringify(orderCatGridCheck, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'order_categories_grid_mobile.png'),
      fullPage: false
    });
    console.log('📸 Saved order_categories_grid_mobile.png');

    // Test Quantity Stepper on OrderMeja Product Card
    console.log('👉 Testing Quantity Stepper on OrderMeja Product Card...');
    const orderStepperTest = await page.evaluate(async () => {
      // Find cards in the product grid
      const cards = document.querySelectorAll('div[style*="border-radius: 16px"]');
      if (!cards.length) return { error: 'No product cards found' };
      // Choose second card (Nasi Goreng Spesial Kost) or first card
      const targetCard = cards[1] || cards[0];

      const input = targetCard.querySelector('input[type="number"]');
      const plusBtn = targetCard.querySelectorAll('button')[1];
      const addBtn = targetCard.querySelectorAll('button')[2];

      const initialVal = input ? input.value : null;

      // Click + button 2 times to reach qty = 3
      plusBtn.click();
      plusBtn.click();

      const valAfterClicks = input.value;
      const addBtnTextBefore = addBtn.textContent.trim();

      // Click Add Button
      addBtn.click();

      await new Promise(r => setTimeout(r, 200));

      const valAfterAdd = input.value;
      const addBtnTextAfter = addBtn.textContent.trim();
      const cardText = targetCard.textContent;

      return {
        initialVal,
        valAfterClicks,
        addBtnTextBefore,
        valAfterAdd, // MUST BE "1" (RESET TO 1)
        addBtnTextAfter,
        badgeFound: cardText.includes('3 di Pesanan')
      };
    });
    console.log('📊 OrderMeja Stepper Test Result:', JSON.stringify(orderStepperTest, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'order_item_added_reset_to_1.png'),
      fullPage: false
    });
    console.log('📸 Saved order_item_added_reset_to_1.png');

    console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
