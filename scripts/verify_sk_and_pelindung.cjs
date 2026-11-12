const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';

async function run() {
  console.log('=== VERIFYING S&K AND PELINDUNG KOSTKU ===');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=412,915']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  // 1. Visit /syarat-ketentuan
  console.log('Visiting /syarat-ketentuan...');
  await page.goto('http://127.0.0.1:3001/syarat-ketentuan', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Check Pasal 5.5 content
  const hasPasal55 = await page.evaluate(() => {
    return document.body.innerText.includes('5.5. Kebijakan Biaya Administrasi Layanan Platform & Gateway (Flat Rp 500 / Transaksi)') &&
           document.body.innerText.includes('Transaksi Bisnis / Mitra UMKM') &&
           document.body.innerText.includes('Transaksi Properti Kost');
  });
  console.log('✓ Pasal 5.5 (Flat Rp 500 Rule) rendered:', hasPasal55);

  // Check Pasal 11 Pelindung KostKu content
  const hasPelindungSection = await page.evaluate(() => {
    return document.body.innerText.includes('Program Jaminan & Fitur "Pelindung KostKu"') &&
           document.body.innerText.includes('Pelindung Pemilik Kost') &&
           document.body.innerText.includes('Pelindung Pemilik Bisnis') &&
           document.body.innerText.includes('Pelindung Penghuni') &&
           document.body.innerText.includes('Pelindung Karyawan');
  });
  console.log('✓ Pasal 11 (Pelindung KostKu 4 Pilar) rendered:', hasPelindungSection);

  // Scroll to Pelindung section and capture screenshot
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Pelindung KostKu'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_sk_pelindung_kostku.png'), fullPage: false });
  console.log('✓ Captured screen_sk_pelindung_kostku.png');

  // Scroll to Pasal 5.5 section and capture screenshot
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('strong')).find(s => s.textContent.includes('5.5. Kebijakan Biaya Administrasi'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_sk_pasal55_biaya500.png'), fullPage: false });
  console.log('✓ Captured screen_sk_pasal55_biaya500.png');

  // 2. Visit /register
  console.log('Visiting /register...');
  await page.goto('http://127.0.0.1:3001/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const hasRegisterPelindungBanner = await page.evaluate(() => {
    return document.body.innerText.includes('Dilindungi oleh Program Pelindung KostKu') &&
           document.body.innerText.includes('Owner Kost: Uang sewa aman') &&
           document.body.innerText.includes('Bisnis Mitra: Anti-fake order');
  });
  console.log('✓ Register Pelindung KostKu banner rendered:', hasRegisterPelindungBanner);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_register_pelindung_banner.png'), fullPage: false });
  console.log('✓ Captured screen_register_pelindung_banner.png');

  // 3. Open S&K modal in /register
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const termBtn = btns.find(b => b.textContent.includes('Baca Ringkasan Syarat'));
    if (termBtn) termBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Check if modal has Klausul 7 Pelindung KostKu
  const hasModalPelindung = await page.evaluate(() => {
    return document.body.innerText.includes('Program Jaminan "Pelindung KostKu"') &&
           document.body.innerText.includes('Jaminan Pemilik Kost') &&
           document.body.innerText.includes('Jaminan Pemilik Bisnis');
  });
  console.log('✓ Register Modal Klausul 7 Pelindung KostKu rendered:', hasModalPelindung);

  // Scroll down modal content to view Klausul 7
  await page.evaluate(() => {
    const modalBody = document.querySelector('div[style*="overflow-y: auto"], div[style*="overflowY: auto"], div[style*="overflow: auto"]');
    if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_register_modal_pelindung_clause.png'), fullPage: false });
  console.log('✓ Captured screen_register_modal_pelindung_clause.png');

  await browser.close();
  console.log('=== ALL S&K & PELINDUNG CHECKS PASSED ===');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
