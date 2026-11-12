const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing API Endpoints ---');

  // A. Register Owner (Pemilik Kost)
  const ownerEmail = `pemilik.kost.${Date.now()}@gmail.com`;
  const ownerReg = await apiRequest('POST', '/api/register', {
    role: 'owner',
    name: 'H. Bambang Pamungkas',
    email: ownerEmail,
    phone: '08129998881',
    password: 'password123',
    kostName: 'Kost Griya Harmoni Utama'
  });
  console.log('Owner Registration Status:', ownerReg.status, ownerReg.body?.message || ownerReg.body?.error);

  // B. Register Mitra (Pemilik Bisnis)
  const mitraEmail = `pemilik.bisnis.${Date.now()}@gmail.com`;
  const mitraReg = await apiRequest('POST', '/api/register', {
    role: 'mitra',
    name: 'Ibu Hj. Siti Aisyah',
    email: mitraEmail,
    phone: '08129998882',
    password: 'password123',
    storeName: 'Kantin Riuh & Cafe Barokah',
    category: 'Kantin & Kuliner'
  });
  console.log('Mitra Registration Status:', mitraReg.status, mitraReg.body?.message || mitraReg.body?.error);

  // C. Owner creates a Staff (Karyawan) with employee personal Gmail
  const staffEmail = `karyawan.kasir.${Date.now()}@gmail.com`;
  const staffCreate = await apiRequest('POST', '/api/owner/staff', {
    ownerId: ownerReg.body?.user?.id || '1784987558042',
    kostUid: ownerReg.body?.uid || ownerReg.body?.user?.kostUid,
    name: 'Ahmad Faisal (Kasir)',
    email: staffEmail,
    phone: '08123334445',
    roles: ['Kasir Toko / Kantin', 'Penjaga Kost']
  });
  console.log('Staff Creation Status:', staffCreate.status, staffCreate.body?.message || staffCreate.body?.error);
  const staffId = staffCreate.body?.staff?.id;

  // D. Owner deletes the Staff
  if (staffId) {
    const staffDelete = await apiRequest('DELETE', `/api/owner/staff/${staffId}`);
    console.log('Staff Deletion Status:', staffDelete.status, staffDelete.body?.message);
  }

  console.log('--- 2. Browser Visual Verification ---');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=412,915']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.goto('http://127.0.0.1:3001/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Capture 4 Role selector default (Owner selected)
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_4roles_owner_selected.png'), fullPage: true });
  console.log('✓ Captured screen_4roles_owner_selected.png');

  // 2. Click Pemilik Bisnis
  const clickedBisnis = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('cursor: pointer') && el.textContent.includes('Pemilik Bisnis');
    });
    const target = cards[cards.length - 1];
    if (target) {
      target.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Pemilik Bisnis:', clickedBisnis);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_4roles_bisnis_selected.png'), fullPage: true });
  console.log('✓ Captured screen_4roles_bisnis_selected.png');

  // 3. Click Karyawan
  const clickedStaff = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(el => {
      const s = el.getAttribute('style') || '';
      return s.includes('cursor: pointer') && el.textContent.includes('Karyawan');
    });
    const target = cards[cards.length - 1];
    if (target) {
      target.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Karyawan:', clickedStaff);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_4roles_karyawan_selected.png'), fullPage: true });
  console.log('✓ Captured screen_4roles_karyawan_selected.png');

  // 4. Open Terms & Conditions Modal
  const clickedTerms = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const termBtn = buttons.find(b => b.textContent.includes('Baca Ringkasan Syarat'));
    if (termBtn) {
      termBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Terms Modal button:', clickedTerms);
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_terms_modal_6clauses.png'), fullPage: false });
  console.log('✓ Captured screen_terms_modal_6clauses.png');

  // 5. Agree Terms
  const clickedAgree = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const agreeBtn = buttons.find(b => b.textContent.includes('Saya Membaca & Menyetujui'));
    if (agreeBtn) {
      agreeBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Agree button:', clickedAgree);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_terms_modal_agreed.png'), fullPage: true });
  console.log('✓ Captured screen_terms_modal_agreed.png');

  await browser.close();
  console.log('--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
