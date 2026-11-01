const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('🚀 Starting Comprehensive REAL KostKu Application Screen Capture...');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const brainDir = '/home/rena/.gemini/antigravity/brain/c34bb6a7-8e98-42a6-9015-86bef76e1a22';
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const ownerUser = {
    id: "owner-1",
    name: "H. Danu Saputra",
    email: "danu@kostku.id",
    role: "owner",
    kostUid: "KOST-JAKSEL-01"
  };

  const tenantUser = {
    id: 1790690895764,
    name: "Rian Pratama",
    email: "penghuni@kostku.id",
    role: "user",
    kamar: "102",
    kostUid: "KOST-JAKSEL-01",
    loyalty_points: 350
  };

  // Helper function to capture a page in a specific theme
  async function capturePage({ url, user, theme, outputFile, clipHeight = 900 }) {
    console.log(`📸 Capturing ${path.basename(outputFile)} (${theme.toUpperCase()})...`);
    
    // Navigate to about:blank to set clean state
    await page.goto('http://localhost:5180/', { waitUntil: 'networkidle0' });
    
    // Set localStorage before navigating to target url
    await page.evaluate((themeVal, userVal) => {
      localStorage.setItem('kostku_theme', themeVal);
      document.documentElement.setAttribute('data-theme', themeVal);
      document.body.setAttribute('data-theme', themeVal);
      if (userVal) {
        localStorage.setItem('kostUser', JSON.stringify(userVal));
        localStorage.setItem('kostName', 'Kost Taman Sukun Co-Living & Exclusive');
      } else {
        localStorage.removeItem('kostUser');
      }
    }, theme, user);

    // Now navigate to the actual target URL
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Ensure theme attribute is strictly applied
    await page.evaluate((themeVal) => {
      document.documentElement.setAttribute('data-theme', themeVal);
      document.body.setAttribute('data-theme', themeVal);
      localStorage.setItem('kostku_theme', themeVal);
    }, theme);

    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(brainDir, outputFile),
      clip: { x: 0, y: 0, width: 1440, height: clipHeight }
    });
    console.log(`✅ Saved: ${outputFile}`);
  }

  // 1. Home
  await capturePage({ url: 'http://localhost:5180/', user: null, theme: 'dark', outputFile: 'real_home_dark.png' });
  await capturePage({ url: 'http://localhost:5180/', user: null, theme: 'light', outputFile: 'real_home_light.png' });

  // 2. Kost Detail & Blueprint
  await capturePage({ url: 'http://localhost:5180/kost/KOST-JAKSEL-01', user: null, theme: 'dark', outputFile: 'real_detail_dark.png' });
  await capturePage({ url: 'http://localhost:5180/kost/KOST-JAKSEL-01', user: null, theme: 'light', outputFile: 'real_detail_light.png' });

  // 3. Owner Dashboard
  await capturePage({ url: 'http://localhost:5180/dashboard', user: ownerUser, theme: 'dark', outputFile: 'real_dashboard_owner_dark.png' });
  await capturePage({ url: 'http://localhost:5180/dashboard', user: ownerUser, theme: 'light', outputFile: 'real_dashboard_owner_light.png' });

  // 4. Tenant Dashboard
  await capturePage({ url: 'http://localhost:5180/dashboard', user: tenantUser, theme: 'dark', outputFile: 'real_tenant_dark.png' });
  await capturePage({ url: 'http://localhost:5180/dashboard', user: tenantUser, theme: 'light', outputFile: 'real_tenant_light.png' });

  // 5. Mitra & Toko Sekitar
  await capturePage({ url: 'http://localhost:5180/mitra', user: ownerUser, theme: 'dark', outputFile: 'real_mitra_dark.png' });
  await capturePage({ url: 'http://localhost:5180/mitra', user: ownerUser, theme: 'light', outputFile: 'real_mitra_light.png' });

  // 6. Keuangan & Pembukuan
  await capturePage({ url: 'http://localhost:5180/keuangan', user: ownerUser, theme: 'dark', outputFile: 'real_keuangan_dark.png' });
  await capturePage({ url: 'http://localhost:5180/keuangan', user: ownerUser, theme: 'light', outputFile: 'real_keuangan_light.png' });

  // Helper to create Side-by-Side comparison cards
  async function generateSideBySide({ title, subtitle, darkImg, lightImg, outputFile }) {
    console.log(`🖼️ Generating Side-by-Side: ${outputFile}...`);
    const darkBase64 = fs.readFileSync(path.join(brainDir, darkImg)).toString('base64');
    const lightBase64 = fs.readFileSync(path.join(brainDir, lightImg)).toString('base64');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif; }
        body {
          background: #0b1120;
          color: #f8fafc;
          padding: 32px 40px;
          width: 1920px;
          height: 1080px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
        }
        .header {
          display: flex;
          justifyContent: space-between;
          align-items: flex-end;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header .subtitle {
          font-size: 15px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .badge-system {
          background: rgba(37, 99, 235, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #93c5fd;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .grid-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          flex: 1;
        }
        .panel {
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
          position: relative;
        }
        .panel-dark {
          border: 1.5px solid rgba(59, 130, 246, 0.35);
          background: #080d1a;
        }
        .panel-light {
          border: 1.5px solid rgba(226, 232, 240, 0.6);
          background: #f1f5f9;
        }
        .panel-header {
          padding: 12px 20px;
          display: flex;
          justifyContent: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 700;
        }
        .dark-header {
          background: #0e1726;
          color: #60a5fa;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .light-header {
          background: #ffffff;
          color: #1e3a8a;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }
        .image-frame {
          flex: 1;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: flex-start;
          justifyContent: center;
        }
        .image-frame img {
          width: 100%;
          height: auto;
          display: block;
        }
        .footer {
          margin-top: 20px;
          display: flex;
          justifyContent: space-between;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 14px;
        }
        .footer strong { color: #38bdf8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <div class="subtitle">${subtitle}</div>
        </div>
        <div class="badge-system">100% REAL RUNNING KOSTKU WEB APP (NO PRODUCTION DEPLOY)</div>
      </div>

      <div class="grid-container">
        <!-- Dark Mode Panel -->
        <div class="panel panel-dark">
          <div class="panel-header dark-header">
            <span>🌙 DARK MODE — Twilight Blue-Hour Void (#080d1a)</span>
            <span style="font-size: 12px; color: #94a3b8;">Text: #f8fafc | Accent: #2563eb</span>
          </div>
          <div class="image-frame">
            <img src="data:image/png;base64,${darkBase64}" alt="Dark Mode" />
          </div>
        </div>

        <!-- Light Mode Panel -->
        <div class="panel panel-light">
          <div class="panel-header light-header">
            <span>☀️ LIGHT MODE — Modern Architectural Slate (#f1f5f9)</span>
            <span style="font-size: 12px; color: #475569;">Text: #0f172a | Accent: #2563eb</span>
          </div>
          <div class="image-frame">
            <img src="data:image/png;base64,${lightBase64}" alt="Light Mode" />
          </div>
        </div>
      </div>

      <div class="footer">
        <div>🎯 Calibrated Indonesian Visual Psychology: <strong>60% Canvas</strong> (Slate/Ivory) • <strong>30% Structure</strong> (White/Charcoal) • <strong>10% Accent</strong> (Trust Blue + Amber)</div>
        <div>Vite Preview Port 5180 • Backend Mock DB Port 3001</div>
      </div>
    </body>
    </html>
    `;

    const compositePage = await browser.newPage();
    await compositePage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await compositePage.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await compositePage.screenshot({
      path: path.join(brainDir, outputFile),
      fullPage: true
    });
    await compositePage.close();
    console.log(`✅ Composite saved: ${outputFile}`);
  }

  // Generate Side-by-Side Comparisons
  await generateSideBySide({
    title: 'Halaman Utama & Pencarian Cepat (Home)',
    subtitle: 'Direktori pencarian hunian kampus terverifikasi, hero headline, dan triple benefit USP card',
    darkImg: 'real_home_dark.png',
    lightImg: 'real_home_light.png',
    outputFile: 'compare_home_dark_light.png'
  });

  await generateSideBySide({
    title: 'Detail Kost, Galeri & Blueprint 2D (Kost Detail)',
    subtitle: 'Foto asli kamar, skema utilitas PLN/PDAM transparan, kalkulator sewa, dan tombol checkout',
    darkImg: 'real_detail_dark.png',
    lightImg: 'real_detail_light.png',
    outputFile: 'compare_detail_dark_light.png'
  });

  await generateSideBySide({
    title: 'Dashboard Pemilik Kost (Owner Overview)',
    subtitle: 'Property switcher, status okupansi real-time, financial quick view, dan manajemen kamar',
    darkImg: 'real_dashboard_owner_dark.png',
    lightImg: 'real_dashboard_owner_light.png',
    outputFile: 'compare_owner_dark_light.png'
  });

  await generateSideBySide({
    title: 'Portal Penghuni & Layanan Kamar (Tenant Dashboard)',
    subtitle: 'Status sewa, pelaporan keluhan/kerusakan langsung ke teknisi, kupon cuci sprei, dan paket digital',
    darkImg: 'real_tenant_dark.png',
    lightImg: 'real_tenant_light.png',
    outputFile: 'compare_tenant_dark_light.png'
  });

  await generateSideBySide({
    title: 'Ekosistem UMKM & Toko Sekitar Kost (Mitra)',
    subtitle: 'Kemitraan lokal: laundry kiloan, galon isi ulang, catering harian, dan pulsa listrik tanpa komisi',
    darkImg: 'real_mitra_dark.png',
    lightImg: 'real_mitra_light.png',
    outputFile: 'compare_mitra_dark_light.png'
  });

  await generateSideBySide({
    title: 'Keuangan & Laporan Buku Kas (Financial Accounting)',
    subtitle: 'Catatan mutasi pemasukan/pengeluaran, status jatuh tempo sewa, dan ekspor laporan keuangan',
    darkImg: 'real_keuangan_dark.png',
    lightImg: 'real_keuangan_light.png',
    outputFile: 'compare_keuangan_dark_light.png'
  });

  await browser.close();
  console.log('🎉 ALL PAGES CAPTURED & COMPOSITES GENERATED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Error executing capture script:', err);
  process.exit(1);
});
