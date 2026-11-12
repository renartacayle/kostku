const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';
const BASE_URL = 'http://localhost:3001';

async function captureArtifacts() {
  console.log('📸 Capturing Add Menu & Foto Must Have Artifact Screenshots...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  try {
    // 1. Open Kasir Register
    await page.goto(`${BASE_URL}/kasir`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Kasir Register')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));

    // 2. Open Modal
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Tambah Menu')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Fill form partly (without photo)
    const nameInput = await page.$('input[placeholder*="Ayam Geprek"]');
    await nameInput.type('Ayam Bakar Madu Pedas');

    const priceInput = await page.$('input[type="number"][placeholder*="15000"]');
    await priceInput.type('22000');

    const descInput = await page.$('textarea');
    await descInput.type('Ayam panggang oven lembut dengan marinasi madu murni dan rempah nusantara.');

    // Click Submit to show "Foto WAJIB (MUST HAVE)" validation error
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_tambah_menu_validation_foto_wajib.png'),
      fullPage: false
    });
    console.log('✅ Captured screen_tambah_menu_validation_foto_wajib.png');

    // 3. Now select photo & custom category
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Buat Kategori Baru')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 300));

    const catInput = await page.$('input[placeholder*="Ketik nama kategori baru"]');
    await catInput.type('Paket Spesial');

    // Pick Ayam Geprek preset photo
    const presetCard = (await page.$$('div[title*="Ayam"]'))[0];
    if (presetCard) await presetCard.click();
    await new Promise(r => setTimeout(r, 400));

    // Capture filled form with photo preview
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_tambah_menu_modal_filled.png'),
      fullPage: false
    });
    console.log('✅ Captured screen_tambah_menu_modal_filled.png');

    // 4. Save product
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    // Capture Kasir Register showing the new menu
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_kasir_new_menu_added.png'),
      fullPage: false
    });
    console.log('✅ Captured screen_kasir_new_menu_added.png');

    // 5. Open Customer Self-Order
    await page.goto(`${BASE_URL}/order/MEJA-01-TKN881`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Scroll to category & click Paket Spesial
    await page.evaluate(() => window.scrollBy(0, 180));
    await new Promise(r => setTimeout(r, 300));

    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Paket Spesial')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'screen_order_meja_new_menu_and_category.png'),
      fullPage: false
    });
    console.log('✅ Captured screen_order_meja_new_menu_and_category.png');

    console.log('🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureArtifacts();
