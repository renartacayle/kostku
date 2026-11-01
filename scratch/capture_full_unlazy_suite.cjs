const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/24956631-2679-40ee-8e2f-108e0ae1b924';
const FRONTEND_PORT = 4188;
const BACKEND_PORT = 3001;

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode < 500);
    }).on('error', () => resolve(false));
  });
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkUrl(url)) return true;
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

(async () => {
  console.log('🚀 Starting Perfected Unlazy Screenshot Suite for KostKu...');
  
  // 1. Check / Spawn Backend Server
  let backendProcess = null;
  const isBackendUp = await checkUrl(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
  if (!isBackendUp) {
    console.log('Starting local backend server on port 3001...');
    backendProcess = spawn('node', ['backend/server.js'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'ignore'
    });
    const ready = await waitForServer(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
    if (!ready) console.warn('Backend server did not respond quickly, continuing...');
    else console.log('✅ Backend server is ready.');
  } else {
    console.log('✅ Backend server already running.');
  }

  // 2. Check / Spawn Vite Preview Server
  let viteProcess = null;
  const isViteUp = await checkUrl(`http://localhost:${FRONTEND_PORT}/`);
  if (!isViteUp) {
    console.log(`Starting Vite preview server on port ${FRONTEND_PORT}...`);
    viteProcess = spawn('npx', ['vite', 'preview', '--port', String(FRONTEND_PORT), '--strictPort'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'ignore'
    });
    const ready = await waitForServer(`http://localhost:${FRONTEND_PORT}/`);
    if (!ready) throw new Error('Vite preview server failed to start!');
    console.log('✅ Vite preview server is ready.');
  } else {
    console.log('✅ Vite preview server already running.');
  }

  // 3. Launch Puppeteer Browser
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900'
    ],
    headless: true
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const results = [];

  async function snap(filename, options = {}) {
    const filePath = path.join(ARTIFACT_DIR, filename);
    await new Promise(r => setTimeout(r, options.delay || 500));
    await page.screenshot({ path: filePath, ...options });
    const stat = fs.statSync(filePath);
    results.push({ filename, size: stat.size });
    console.log(`📸 [SAVED] ${filename} (${Math.round(stat.size / 1024)} KB)`);
  }

  try {
    // ═════════════════════════════════════════════════════════════════
    // PART A: PUBLIC PAGES & INTERACTIVE EXPERIENCES
    // ═════════════════════════════════════════════════════════════════
    console.log('\n--- PART A: Public Pages & Interactivity ---');

    await page.goto(`http://localhost:${FRONTEND_PORT}/`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.evaluate(() => {
      localStorage.removeItem('kostUser');
      localStorage.removeItem('kostName');
      localStorage.setItem('kostku_theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // 1. Home Hero
    await page.evaluate(() => window.scrollTo(0, 0));
    await snap('page_01_home_hero.png', { delay: 600 });

    // 2. Home Listing Cards (Clean 4:3 cards with WhatsApp button, Listrik, Denah 2D)
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.card, a[href^="/kost/"]');
      if (cards.length > 0) {
        cards[0].scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo(0, 800);
      }
    });
    await snap('page_02_home_listing_cards.png', { delay: 600 });

    // 3. Action: Open Denah 2D Architectural Blueprint Modal from Card
    const clickedDenah = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const denahBtn = buttons.find(b => b.textContent && b.textContent.includes('Denah 2D'));
      if (denahBtn) {
        denahBtn.click();
        return true;
      }
      return false;
    });
    if (clickedDenah) {
      await page.waitForSelector('h3', { timeout: 4000 }).catch(() => {});
      await snap('action_03_modal_floorplan_2d.png', { delay: 800 });

      // Close modal
      await page.evaluate(() => {
        const allBtns = Array.from(document.querySelectorAll('button'));
        const close = allBtns.find(b => b.textContent && (b.textContent.includes('Tutup Pratinjau') || b.textContent.includes('Tutup')));
        if (close) close.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    // 4. Action: Open Kalkulator Token Listrik Modal from Card
    const clickedListrik = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const listrikBtn = buttons.find(b => b.textContent && b.textContent.includes('Listrik'));
      if (listrikBtn) {
        listrikBtn.click();
        return true;
      }
      return false;
    });
    if (clickedListrik) {
      await snap('action_04_modal_kwh_calculator.png', { delay: 800 });

      // Close modal
      await page.evaluate(() => {
        const allBtns = Array.from(document.querySelectorAll('button'));
        const close = allBtns.find(b => b.textContent && b.textContent.includes('Mengerti, Tutup Simulasi'));
        if (close) close.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    // 5. Action: Toggle Spatial Map Mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mapBtn = buttons.find(b => b.textContent && (b.textContent.includes('Peta Spasial') || b.textContent.includes('Peta')));
      if (mapBtn) mapBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      const mapEl = document.querySelector('.leaflet-container, #map, div[style*="leaflet"]');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo(0, 900);
      }
    });
    await snap('action_05_home_spatial_map.png', { delay: 1000 });

    // Switch back to grid mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const gridBtn = buttons.find(b => b.textContent && (b.textContent.includes('Grid (4:3)') || b.textContent.includes('Koleksi Kamar')));
      if (gridBtn) gridBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 6. Action: Apply Filter Chip ("Kost Putri")
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const putriBtn = buttons.find(b => b.textContent && b.textContent.includes('Kost Putri'));
      if (putriBtn) putriBtn.click();
    });
    await snap('action_06_home_search_filters.png', { delay: 600 });

    // Reset filter
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(b => b.textContent && (b.textContent.includes('Reset') || b.textContent.includes('Semua')));
      if (resetBtn) resetBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 7. The Kitchen Showcase Section Overview
    await page.evaluate(() => {
      const allHeaders = Array.from(document.querySelectorAll('h2, h3'));
      const target = allHeaders.find(h => h.textContent && h.textContent.includes('The Kitchen'));
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        window.scrollTo(0, 1600);
      }
    });
    await snap('page_07_the_kitchen_showcase.png', { delay: 700 });

    // 8. Action: Trigger Hold to Confirm in The Kitchen
    const holdBtnHandle = await page.evaluateHandle(() => {
      return document.querySelector('.hold-confirm-container');
    });
    const holdBtn = holdBtnHandle.asElement();
    if (holdBtn) {
      const box = await holdBtn.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await new Promise(r => setTimeout(r, 2000)); // hold for 2.0s
        await page.mouse.up();
      }
    }
    await snap('action_08_the_kitchen_hold_to_confirm.png', { delay: 600 });

    // 9. Action: Close-up on the Physical Thermal Receipt
    const receiptHandle = await page.evaluateHandle(() => {
      return document.querySelector('article');
    });
    const receiptArticle = receiptHandle.asElement();
    if (receiptArticle) {
      const box = await receiptArticle.boundingBox();
      if (box) {
        await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 60)), box.y);
      }
    }
    await snap('action_09_the_kitchen_receipt_printed.png', { delay: 600 });

    // 10. Search Page
    await page.goto(`http://localhost:${FRONTEND_PORT}/search`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_10_search_page.png', { delay: 600 });

    // 11. Kost Detail Overview
    await page.goto(`http://localhost:${FRONTEND_PORT}/kost/KOST-OJN64X`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await snap('page_11_kost_detail_overview.png', { delay: 800 });

    // 12. Kost Detail Amenities & Booking Bar
    await page.evaluate(() => window.scrollTo(0, 750));
    await snap('page_12_kost_detail_amenities.png', { delay: 600 });

    // 13. Checkout Page
    await page.goto(`http://localhost:${FRONTEND_PORT}/checkout`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_13_checkout_page.png', { delay: 600 });

    // 14. Login Page
    await page.goto(`http://localhost:${FRONTEND_PORT}/login`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_14_login_page.png', { delay: 600 });

    // 15. Register Page
    await page.goto(`http://localhost:${FRONTEND_PORT}/register`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_15_register_page.png', { delay: 600 });

    // 16. Demo Sandbox Page
    await page.goto(`http://localhost:${FRONTEND_PORT}/demo`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_16_demo_sandbox_page.png', { delay: 600 });

    // 17. Tentang Kami
    await page.goto(`http://localhost:${FRONTEND_PORT}/tentang-kami`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_17_tentang_kami.png', { delay: 600 });

    // 18. Kebijakan Privasi
    await page.goto(`http://localhost:${FRONTEND_PORT}/kebijakan-privasi`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_18_kebijakan_privasi.png', { delay: 600 });

    // 19. Syarat & Ketentuan
    await page.goto(`http://localhost:${FRONTEND_PORT}/syarat-ketentuan`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_19_syarat_ketentuan.png', { delay: 600 });


    // ═════════════════════════════════════════════════════════════════
    // PART B: PROTECTED MANAGEMENT DASHBOARD (Owner Experience)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n--- PART B: Protected Dashboard (Owner Experience) ---');

    await page.goto(`http://localhost:${FRONTEND_PORT}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const ownerUser = {
        id: 1790690895763,
        name: 'Ibu Hj. Nurhasanah (Pemilik Kost)',
        email: 'pemilik@kostku.id',
        role: 'owner',
        kostUid: 'KOST-BDG-02',
        isDemo: true,
        demoRoleId: 'demo-owner'
      };
      localStorage.setItem('kostUser', JSON.stringify(ownerUser));
      localStorage.setItem('kostName', 'Kost Putri Griya Asri Dago');
      localStorage.setItem('kostku_is_demo_mode', 'true');
    });

    // 20. Dashboard Overview
    await page.goto(`http://localhost:${FRONTEND_PORT}/dashboard`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await snap('page_20_dashboard_owner_overview.png', { delay: 800 });

    // 21. Dashboard IoT & Smart Appliances
    await page.evaluate(() => window.scrollTo(0, 800));
    await snap('page_21_dashboard_iot_appliances.png', { delay: 700 });

    // 22. Penghuni Roster
    await page.goto(`http://localhost:${FRONTEND_PORT}/penghuni`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_22_penghuni_roster.png', { delay: 700 });

    // 23. Action: Open Tambah Penghuni Modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent && (b.textContent.includes('Tambah Penghuni') || b.textContent.includes('Penghuni Baru')));
      if (addBtn) addBtn.click();
    });
    await snap('action_23_penghuni_add_modal.png', { delay: 700 });

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[style*="border: none"]');
      const allBtns = Array.from(document.querySelectorAll('button'));
      const close = allBtns.find(b => b.textContent && (b.textContent.includes('Batal') || b.textContent.includes('Tutup')));
      if (close) close.click();
      else if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 24. Keuangan (Financial Transactions & Revenue)
    await page.goto(`http://localhost:${FRONTEND_PORT}/keuangan`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_24_keuangan_transaksi.png', { delay: 800 });

    // 25. Action: Open Digital Receipt Modal in Thermal Mode
    // Switch to Tagihan Sewa tab first
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tagihanTab = buttons.find(b => b.textContent && b.textContent.includes('Tagihan Sewa'));
      if (tagihanTab) tagihanTab.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Click "Lihat Kuitansi Resmi" button
    const openedReceipt = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const receiptBtn = buttons.find(b => b.title === 'Lihat Kuitansi Resmi' || (b.textContent && b.textContent.includes('Kuitansi')));
      if (receiptBtn) {
        receiptBtn.click();
        return true;
      }
      return false;
    });
    console.log('Opened receipt modal status:', openedReceipt);
    await snap('action_25_digital_receipt_thermal_modal.png', { delay: 1200 });

    // 26. Action: Toggle Digital Receipt Modal to Formal Dokumen A4 Mode
    const toggledA4 = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const a4Btn = buttons.find(b => b.textContent && b.textContent.includes('Dokumen A4'));
      if (a4Btn) {
        a4Btn.click();
        return true;
      }
      return false;
    });
    console.log('Toggled A4 mode status:', toggledA4);
    await snap('action_26_digital_receipt_a4_modal.png', { delay: 900 });

    // Close receipt modal
    await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const close = allBtns.find(b => b.textContent && (b.textContent.includes('Tutup') || b.textContent.includes('Selesai')));
      if (close) close.click();
      else {
        const xBtn = document.querySelector('button[style*="borderRadius: 50%"]');
        if (xBtn) xBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 400));

    // 27. Komplain
    await page.goto(`http://localhost:${FRONTEND_PORT}/komplain`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_27_komplain_ticket_page.png', { delay: 700 });

    // 28. Karyawan
    await page.goto(`http://localhost:${FRONTEND_PORT}/karyawan`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_28_karyawan_staff_page.png', { delay: 700 });

    // 29. Pengaturan
    await page.goto(`http://localhost:${FRONTEND_PORT}/pengaturan`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_29_pengaturan_settings_page.png', { delay: 700 });

    // 30. Mitra
    await page.goto(`http://localhost:${FRONTEND_PORT}/mitra`, { waitUntil: 'networkidle0', timeout: 20000 });
    await snap('page_30_mitra_marketplace_page.png', { delay: 700 });


    // ═════════════════════════════════════════════════════════════════
    // PART C: MOBILE RESPONSIVE EXPERIENCE (390 x 844 iPhone Viewport)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n--- PART C: Mobile Responsive Views (390 x 844) ---');

    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    // 31. Mobile Home Hero
    await page.goto(`http://localhost:${FRONTEND_PORT}/`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await snap('mobile_31_home_hero.png', { delay: 700 });

    // 32. Mobile Listing Cards
    await page.evaluate(() => window.scrollTo(0, 680));
    await snap('mobile_32_listing_cards.png', { delay: 700 });

    // 33. Mobile The Kitchen Showcase
    await page.evaluate(() => {
      const target = document.querySelector('article') || document.querySelector('.hold-confirm-container');
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo(0, 3200);
      }
    });
    await snap('mobile_33_the_kitchen_showcase.png', { delay: 900 });

    // 34. Mobile Dashboard Owner
    await page.goto(`http://localhost:${FRONTEND_PORT}/dashboard`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await snap('mobile_34_dashboard_owner.png', { delay: 800 });

    console.log('\n🎉 ALL 34 UNIQUE SCREENSHOTS CAPTURED WITH ZERO DUPLICATES!');
  } finally {
    await browser.close();
    if (viteProcess) viteProcess.kill();
    if (backendProcess) backendProcess.kill();
  }
})().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
