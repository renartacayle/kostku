import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';

async function main() {
  console.log('--- TESTING TAMBAH KOST AUTH GUARD FLOW ---');
  
  // Start preview server
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    preview.stdout.on('data', (d) => {
      if (d.toString().includes('http')) resolve();
    });
    setTimeout(resolve, 3000);
  });

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // TEST 1: Unauthenticated on Home page clicking "Tambah Properti Kost Baru"
  console.log('1. Navigating to Home (http://localhost:4173/)...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });

  // Clear any existing localStorage user to simulate clean unauthenticated visitor
  await page.evaluate(() => {
    localStorage.removeItem('kostUser');
    localStorage.removeItem('kostName');
    localStorage.removeItem('kostku_user_added_kosts');
  });
  await page.reload({ waitUntil: 'networkidle2' });

  // Find the button "Tambah Properti Kost Baru"
  console.log('2. Clicking "Tambah Properti Kost Baru" button in empty state card...');
  const addBtn = await page.waitForSelector('button ::-p-text(Tambah Properti Kost Baru)', { timeout: 8000 });
  if (!addBtn) throw new Error('Tambah Properti Kost Baru button not found');
  
  await addBtn.click();
  await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 6000 });

  const currentUrl = page.url();
  console.log('   Redirected URL:', currentUrl);
  if (!currentUrl.includes('/login') || !currentUrl.includes('action=add-kost')) {
    throw new Error(`Expected redirect to /login with action=add-kost, got: ${currentUrl}`);
  }
  console.log('   ✓ Successfully redirected to login with action=add-kost!');

  // Check that the alert notice is visible on login page
  await page.waitForSelector('::-p-text(Akses Tambah Kost: Silakan masuk terlebih dahulu)', { timeout: 6000 });
  console.log('   ✓ Notice displayed clearly on login page!');

  // TEST 2: Unauthenticated on Search page
  console.log('3. Navigating to /search and testing Add Kost button...');
  await page.goto('http://localhost:4173/search', { waitUntil: 'networkidle2' });
  const searchAddBtn = await page.waitForSelector('button ::-p-text(Tambah Properti Kost Baru)', { timeout: 8000 });
  await searchAddBtn.click();
  await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 6000 });

  const searchRedirectUrl = page.url();
  console.log('   Search Redirected URL:', searchRedirectUrl);
  if (!searchRedirectUrl.includes('/login') || !searchRedirectUrl.includes('redirect=search')) {
    throw new Error(`Expected redirect to /login with redirect=search, got: ${searchRedirectUrl}`);
  }
  console.log('   ✓ Search page also correctly enforces login!');

  // TEST 3: Authenticated user on Home
  console.log('4. Simulating logged-in user on Home with ?action=add-kost...');
  await page.evaluate(() => {
    localStorage.setItem('kostUser', JSON.stringify({
      id: 'usr-owner-test',
      name: 'Budi Pemilik Kost',
      role: 'owner',
      phone: '08123456789'
    }));
  });
  await page.goto('http://localhost:4173/?action=add-kost', { waitUntil: 'networkidle2' });

  // Check that TambahKostModal is open
  const modalHeader = await page.waitForSelector('::-p-text(Ayok, Mari Tambah Kost Baru!)', { timeout: 6000 });
  console.log('   Modal found open:', Boolean(modalHeader));
  if (!modalHeader) throw new Error('Expected TambahKostModal to be open for logged in user');
  console.log('   ✓ TambahKostModal opens directly for authenticated user!');

  await page.screenshot({ path: '/home/rena/.gemini/antigravity/brain/c1714e47-f9f7-4e52-9afc-552c02ccddff/tambah_kost_modal_verified.png' });

  await browser.close();
  preview.kill();
  console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
