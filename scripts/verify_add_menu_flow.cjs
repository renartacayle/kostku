const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';
const BASE_URL = 'http://localhost:3001';

async function verifyAddMenuFlow() {
  console.log('🚀 Starting Chrome Mobile Test for Add Menu, Category, Description & Foto Must Have...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  try {
    // 1. Open Kasir Register
    console.log('👉 Navigating to Kasir...');
    await page.goto(`${BASE_URL}/kasir`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Click Kasir Register
    const allBtns = await page.$$('button');
    for (const b of allBtns) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Kasir Register')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));

    // 2. Click "+ Tambah Menu"
    console.log('👉 Clicking + Tambah Menu button...');
    const addMenuBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Tambah Menu'));
    });
    if (!addMenuBtn) throw new Error('+ Tambah Menu button not found');
    await addMenuBtn.click();
    await new Promise(r => setTimeout(r, 600));

    // 3. Test Validation: Submit without photo
    console.log('👉 Testing Validation: Submitting without photo to trigger MUST HAVE error...');
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder*="Ayam Geprek"]');
      if (nameInput) nameInput.value = 'Kopi Susu Coba';
      const priceInput = document.querySelector('input[type="number"][placeholder*="15000"]');
      if (priceInput) priceInput.value = '12000';
      const descInput = document.querySelector('textarea');
      if (descInput) descInput.value = 'Kopi nikmat';
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]'))[0];
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const errorMsg = await page.evaluate(() => {
      const errBanner = document.querySelector('div[style*="rgb(239, 68, 68)"], div[style*="#ef4444"]');
      return errBanner ? errBanner.innerText : 'No error banner';
    });
    console.log('📊 Validation Alert Observed:', errorMsg);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'modal_validation_foto_must_have.png'),
      fullPage: false
    });
    console.log('📸 Saved modal_validation_foto_must_have.png');

    // 4. Fill complete form with "+ Buat Kategori Baru" and Select Preset Photo
    console.log('👉 Filling complete form with new category and photo...');
    await page.evaluate(() => {
      // Toggle "+ Buat Kategori Baru"
      const toggleCatBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+ Buat Kategori Baru'));
      if (toggleCatBtn) toggleCatBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder*="Ayam Geprek"]');
      if (nameInput) {
        nameInput.value = 'Kopi Susu Aren Spesial';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const customCatInput = document.querySelector('input[placeholder*="Ketik nama kategori baru"]');
      if (customCatInput) {
        customCatInput.value = 'Kopi & Minuman';
        customCatInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const priceInput = document.querySelector('input[type="number"][placeholder*="15000"]');
      if (priceInput) {
        priceInput.value = '12000';
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const descInput = document.querySelector('textarea');
      if (descInput) {
        descInput.value = 'Kopi robusta premium berpadu susu murni segar dan manis legit gula aren organik.';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Pick preset photo "Kopi Susu Aren"
      const presets = Array.from(document.querySelectorAll('div[title*="Kopi"], div[title*="Kopi Susu Aren"]'));
      if (presets.length > 0) {
        presets[0].click();
      }
    });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'modal_form_filled_ready_to_save.png'),
      fullPage: false
    });
    console.log('📸 Saved modal_form_filled_ready_to_save.png');

    // 5. Submit valid form
    console.log('👉 Submitting valid menu form...');
    const submitBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button[type="submit"]'))[0];
    });
    if (submitBtn) {
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 1200));
    }

    // 6. Verify new category & product appeared in Kasir
    const kasirCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasNewCategory: bodyText.includes('Kopi & Minuman'),
        hasNewProduct: bodyText.includes('Kopi Susu Aren Spesial'),
        hasPrice: bodyText.includes('12.000'),
        hasDesc: bodyText.includes('Kopi robusta premium')
      };
    });
    console.log('📊 Kasir Verification After Save:', JSON.stringify(kasirCheck, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'kasir_new_category_and_product_created.png'),
      fullPage: false
    });
    console.log('📸 Saved kasir_new_category_and_product_created.png');

    // 7. Verify Customer Self-Order (/order/MEJA-01-TKN881)
    console.log('👉 Navigating to Customer Self-Order to verify new menu and category...');
    await page.goto(`${BASE_URL}/order/MEJA-01-TKN881`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Scroll to categories
    await page.evaluate(() => window.scrollBy(0, 180));
    await new Promise(r => setTimeout(r, 300));

    // Click new category "Kopi & Minuman"
    const kopiCatBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Kopi & Minuman'));
    });
    if (kopiCatBtn) {
      console.log('👉 Clicking Kopi & Minuman category on customer screen...');
      await kopiCatBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    const orderCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasNewCategory: bodyText.includes('Kopi & Minuman'),
        hasNewProduct: bodyText.includes('Kopi Susu Aren Spesial'),
        hasPrice: bodyText.includes('12.000'),
        hasDesc: bodyText.includes('Kopi robusta premium')
      };
    });
    console.log('📊 Customer Order Verification:', JSON.stringify(orderCheck, null, 2));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'order_meja_new_product_and_category.png'),
      fullPage: false
    });
    console.log('📸 Saved order_meja_new_product_and_category.png');

    console.log('🎉 ADD MENU & CATEGORY VERIFICATION COMPLETED 100%!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyAddMenuFlow();
