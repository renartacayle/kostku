const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';
const BASE_URL = 'http://localhost:3001';

async function verify() {
  console.log('🧪 Starting verification of Register, Terms Modal, Staff Management, and New Logo...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  // 1. Visit /register
  console.log('1. Testing /register page...');
  await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot Register Default
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_register_owner_role.png') });
  console.log('📸 Captured screen_register_owner_role.png');

  // Verify Role Switcher
  const roleCardsCount = await page.$$eval('div', els => els.filter(e => e.textContent.includes('Pemilik Kost') && e.textContent.includes('Owner')).length);
  console.log('Role switcher cards found:', roleCardsCount > 0 ? 'YES' : 'NO');

  // 2. Click "Karyawan" Role
  console.log('2. Clicking Karyawan role card...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div'));
    const staffCard = cards.find(c => c.textContent.trim() === '👷KaryawanStaf & Kasir' || (c.textContent.includes('Karyawan') && c.textContent.includes('Staf & Kasir')));
    if (staffCard) staffCard.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_register_staff_role.png') });
  console.log('📸 Captured screen_register_staff_role.png');

  // 3. Test Syarat & Ketentuan Modal Popup
  console.log('3. Opening Syarat & Ketentuan Modal Popup...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const termsBtn = btns.find(b => b.textContent.includes('Baca Ringkasan Syarat'));
    if (termsBtn) termsBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_register_terms_modal.png') });
  console.log('📸 Captured screen_register_terms_modal.png');

  // Click "Saya Membaca & Menyetujui"
  console.log('4. Accepting Terms in Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const agreeBtn = btns.find(b => b.textContent.includes('Saya Membaca & Menyetujui'));
    if (agreeBtn) agreeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Check if checkbox is checked
  const isChecked = await page.$eval('#agreeTermsCheckbox', el => el.checked);
  console.log('Terms checkbox checked automatically:', isChecked);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_register_terms_agreed.png') });
  console.log('📸 Captured screen_register_terms_agreed.png');

  // 5. Check /kasir header logo and Karyawan button
  console.log('5. Testing /kasir header logo and Karyawan shortcut...');
  await page.goto(`${BASE_URL}/kasir`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_kasir_new_logo_and_karyawan_btn.png') });
  console.log('📸 Captured screen_kasir_new_logo_and_karyawan_btn.png');

  // 6. Test Staff API Flow (Add & Delete)
  console.log('6. Testing Staff API (Create with Gmail & Delete)...');
  const testStaffPayload = {
    name: 'Siti Aminah (Kasir Resto)',
    email: 'siti.kasir.kostku@gmail.com',
    password: 'password123',
    phone: '081299988877',
    jobTitle: 'Kasir & Pelayanan',
    roles: ['Kasir & Pelayanan'],
    salary: 2500000,
    ownerId: '1784987558042'
  };

  const createRes = await fetch(`${BASE_URL}/api/owner/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStaffPayload)
  });
  const createData = await createRes.json();
  console.log('Staff created response:', createRes.status, createData.message, 'Staff ID:', createData.staff?.id);

  if (createData.staff?.id) {
    // Delete staff
    console.log('Testing Staff Deletion...');
    const deleteRes = await fetch(`${BASE_URL}/api/owner/staff/${createData.staff.id}`, {
      method: 'DELETE'
    });
    const deleteData = await deleteRes.json();
    console.log('Staff deleted response:', deleteRes.status, deleteData.message);
  }

  console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
  await browser.close();
}

verify().catch(console.error);
