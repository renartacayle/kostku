const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CONVERSATION_ID = 'b788417c-3c96-465d-bb00-91b3b6640c0d';
const ARTIFACT_DIR = `/home/rena/.gemini/antigravity/brain/${CONVERSATION_ID}`;
const PROJECT_DIR = '/home/rena/.gemini/antigravity/scratch/kostku';
const PDF_OUTPUT_PROJECT = path.join(PROJECT_DIR, 'FITUR_LENGKAP_KASIR_POS_KOSTKU.pdf');
const PDF_OUTPUT_ARTIFACT = path.join(ARTIFACT_DIR, 'FITUR_LENGKAP_KASIR_POS_KOSTKU.pdf');

async function generatePdf() {
  console.log('🚀 Generating High-Quality 2-Page Executive PDF for Kasir Features...');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Fitur Lengkap Kasir POS & Order Meja KostKu</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

    @page {
      size: A4;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      font-size: 8.5pt;
    }

    .page {
      min-height: 270mm;
      position: relative;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
    }

    .page-break {
      page-break-before: always;
    }

    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    h1 {
      margin: 4px 0 2px;
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 8pt;
      color: #475569;
      margin: 0;
    }

    .meta-box {
      text-align: right;
      font-size: 7pt;
      color: #64748b;
    }

    .meta-box strong {
      color: #0f172a;
    }

    .executive-summary {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 9px 12px;
      margin-bottom: 12px;
      font-size: 8pt;
      color: #0369a1;
      line-height: 1.4;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 9px 11px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 5px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }

    .card-title .icon {
      font-size: 11pt;
    }

    .badge-pill {
      font-size: 6.5pt;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      margin-left: auto;
    }

    .badge-blue { background: #e0f2fe; color: #0284c7; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }

    ul {
      margin: 0;
      padding-left: 14px;
    }

    li {
      margin-bottom: 3px;
      font-size: 7.8pt;
      color: #334155;
    }

    li strong {
      color: #0f172a;
    }

    .highlight-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 5px 8px;
      margin-top: 5px;
      font-size: 7.2pt;
      color: #92400e;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 7.2pt;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 8px;
      text-align: left;
      font-weight: 700;
      font-size: 7.2pt;
    }

    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1 ==================== -->
  <div class="page">
    <div>
      <!-- HEADER -->
      <div class="header">
        <div>
          <div class="logo-badge">KostKu &amp; Riuph Cloud Ecosystem</div>
          <h1>Dokumen Spesifikasi Fitur Kasir POS &amp; Order Meja</h1>
          <p class="subtitle">Platform Operasional F&amp;B Kasir, Order QR Meja, Multi-Store &amp; Dompet Terpadu</p>
        </div>
        <div class="meta-box">
          <div>Dokumen: <strong>RIUPH-POS-SPEC-2026</strong></div>
          <div>Versi: <strong>v2.5 (Production Ready)</strong></div>
          <div>Update: <strong>November 2026</strong></div>
          <div>Domain: <strong>kasir.riuph.me • kostku.me</strong></div>
        </div>
      </div>

      <!-- EXECUTIVE SUMMARY -->
      <div class="executive-summary">
        <strong>Executive Overview:</strong> Modul Kasir POS (Point of Sale) &amp; Order Meja KostKu dirancang khusus untuk memadukan transaksi kasir langsung (*dine-in / walk-in*), pemesanan mandiri oleh pelanggan via QR barcode meja (*self-ordering*), sinkronisasi antrean dapur (*Kitchen Display System - KDS*), dan rekonsiliasi keuangan otomatis ke dalam <strong>1 Akun &amp; 1 Dompet Terpadu (Unified Wallet)</strong> dengan biaya admin flat hanya <strong>Rp 100 per transaksi</strong>.
      </div>

      <!-- GRID FITUR 1 - 4 -->
      <div class="grid-2">

        <!-- FITUR 1 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">🖥️</span>
            <span>1. Operasional Kasir (POS Register)</span>
            <span class="badge-pill badge-blue">Kasir Meja</span>
          </div>
          <ul>
            <li><strong>Dual View Mode:</strong> Beralih fleksibel antara <em>Visual Grid Mode</em> (kartu foto menu) dan <em>Quick List Mode</em> (list ramping kasir cepat).</li>
            <li><strong>Multi-Qty Quick Adder:</strong> Tombol instan (+1, +5, +10) tanpa lelah klik berulang kali saat pesanan dalam jumlah besar.</li>
            <li><strong>Dine-in &amp; Walk-in:</strong> Memilih nomor meja (Meja 01 s/d 10) atau pesanan langsung bawa pulang (*take-away*).</li>
            <li><strong>Wajib Nama Pemesan:</strong> Merekam nama pemesan dan nomor HP untuk mencegah pesanan tertukar.</li>
          </ul>
          <div class="highlight-box">
            ✦ Dilengkapi kalkulator diskon poin loyalitas otomatis dan preview rincian belanja.
          </div>
        </div>

        <!-- FITUR 2 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">🍳</span>
            <span>2. Kitchen Display System (KDS Dapur)</span>
            <span class="badge-pill badge-green">Real-Time</span>
          </div>
          <ul>
            <li><strong>Papan 4 Kolom Kanban Dapur:</strong>
              <br>1. Menunggu ACC Dapur (Bisa tolak jika bahan habis).
              <br>2. Menunggu Bayar (TriPay QRIS / Cash / Kamar).
              <br>3. Sedang Dimasak (Koki memproses menu).
              <br>4. Siap Saji / Selesai (Diantar ke meja).
            </li>
            <li><strong>Audio Chime Notification:</strong> Bunyi lonceng otomatis saat ada pesanan baru masuk dari meja pelanggan.</li>
            <li><strong>Item Checklist:</strong> Koki dapat mencentang menu yang sudah matang satu per satu.</li>
          </ul>
          <div class="highlight-box">
            ✦ Dapur tidak perlu cetak kertas bon pesanan, semua terkoordinasi di layar.
          </div>
        </div>

        <!-- FITUR 3 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">📱</span>
            <span>3. QR Table Self-Ordering</span>
            <span class="badge-pill badge-purple">Zero-Install</span>
          </div>
          <ul>
            <li><strong>Pindai QR Meja:</strong> Pelanggan cukup scan QR Code di meja pakai kamera HP, langsung membuka menu tanpa download aplikasi.</li>
            <li><strong>Catatan Khusus per Menu:</strong> Pelanggan bisa menulis request kustom (*"jangan pedas"*, *"es dipisah"*, *"tanpa daun bawang"*).</li>
            <li><strong>Live Status Tracker:</strong> HP pelanggan otomatis mengupdate status masakan (*Diterima ➔ Dimasak ➔ Diantar*).</li>
            <li><strong>Token Meja Terisolasi:</strong> Mencegah manipulasi pesanan dari luar area makan.</li>
          </ul>
          <div class="highlight-box">
            ✦ Efisiensi staf pelayan hingga 70% karena pelanggan pesan langsung dari meja.
          </div>
        </div>

        <!-- FITUR 4 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">💳</span>
            <span>4. Metode Pembayaran Real-Time</span>
            <span class="badge-pill badge-amber">Aman &amp; Pasti</span>
          </div>
          <ul>
            <li><strong>QRIS TriPay Otomatis:</strong> QR dinamis muncul di layar HP/kasir, otomatis lunas saat discan e-wallet/mobile banking.</li>
            <li><strong>Bayar Tunai (Cash di Kasir):</strong> Uang fisik masuk laci kasir, sistem memotong <strong>1 nota (Rp 100)</strong> dari saldo nota toko.</li>
            <li><strong>Gate Proteksi Saldo Nota:</strong> Transaksi tunai wajib memiliki saldo nota &ge; Rp 100; jika habis sistem memblokir dan meminta top up / redeem kode.</li>
            <li><strong>Anti-Nunggak (Arus Kas Aman):</strong> Opsi nunggak ke tagihan kamar ditiadakan agar kasir dan mitra selalu menerima dana instan tanpa risiko piutang macet.</li>
          </ul>
          <div class="highlight-box">
            ✦ Biaya admin flat cuma Rp 100 per transaksi, termurah di ekosistem POS Indonesia.
          </div>
        </div>

      </div>
    </div>

    <!-- FOOTER HALAMAN 1 -->
    <div class="footer">
      <div><strong>KostKu &amp; Riuph Cloud POS Platform</strong> • Dokumen Fitur Lengkap</div>
      <div>Halaman 1 dari 2</div>
    </div>
  </div>

  <!-- ==================== HALAMAN 2 ==================== -->
  <div class="page page-break">
    <div>
      <!-- HEADER MINI HALAMAN 2 -->
      <div class="header" style="margin-bottom: 10px; padding-bottom: 8px;">
        <div>
          <span class="logo-badge" style="font-size: 7pt; padding: 2px 6px;">KostKu &amp; Riuph POS</span>
          <h2 style="margin: 2px 0 0; font-size: 12pt; font-weight: 800; color: #0f172a;">
            Modul Manajemen Toko, Hardware, Finansial &amp; Loyalitas
          </h2>
        </div>
        <div class="meta-box">
          <div>Ref: <strong>RIUPH-POS-SPEC-2026</strong></div>
          <div>Status: <strong>Verified &amp; Certified</strong></div>
        </div>
      </div>

      <!-- GRID FITUR 5 - 8 -->
      <div class="grid-2">

        <!-- FITUR 5 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">💼</span>
            <span>5. Dompet Terpadu (Unified Wallet)</span>
            <span class="badge-pill badge-blue">1 UID Bersama</span>
          </div>
          <ul>
            <li><strong>1 UID Kasir &amp; Mitra:</strong> Menghilangkan keribetan 2 dompet terpisah; seluruh omset Kasir POS dan Mitra UMKM disatukan.</li>
            <li><strong>Auto-Deposit Omset Bersih:</strong> Dana TriPay langsung masuk ke saldo dompet toko setelah potong admin flat Rp 100.</li>
            <li><strong>Pencairan Instan (Payout BI-FAST / Flip):</strong> Tarik saldo omset langsung ke rekening bank terdaftar secara *real-time*.</li>
            <li><strong>Ledger Transparan:</strong> Riwayat mutasi mendata pemasukan kasir dan penarikan secara detail.</li>
          </ul>
        </div>

        <!-- FITUR 6 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">🏬</span>
            <span>6. Multi-Toko per Pemilik</span>
            <span class="badge-pill badge-green">1 Owner N Toko</span>
          </div>
          <ul>
            <li><strong>Banyak Toko 1 Akun:</strong> Owner kost bisa memiliki Kantin, Laundry Kiloan, Depot Air Galon, Servis AC, dan Toko Snack.</li>
            <li><strong>Store Switcher Header:</strong> Kasir atau owner dapat berganti toko aktif dalam hitungan detik.</li>
            <li><strong>Isolasi Keuangan &amp; Menu:</strong> Saldo nota, katalog menu, dan riwayat pesanan tetap terpisah rapi per unit usaha.</li>
            <li><strong>Bonus Kuota Selamat Datang:</strong> Setiap toko baru yang dibuka otomatis mendapatkan <strong>50 nota gratis (Rp 5.000)</strong>.</li>
          </ul>
        </div>

        <!-- FITUR 7 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">🖨️</span>
            <span>7. Cetak Struk Thermal Hardware</span>
            <span class="badge-pill badge-purple">ESC / POS</span>
          </div>
          <ul>
            <li><strong>Konektivitas Fleksibel:</strong> Support Bluetooth printer mini, kabel USB ESC/POS, dan standar Browser Print dialog.</li>
            <li><strong>Lebar Kertas 58mm &amp; 80mm:</strong> Format cetak struk rapi dan otomatis pas dengan ukuran kertas printer kasir.</li>
            <li><strong>Auto-Cut &amp; Open Drawer:</strong> Memicu pemotong kertas otomatis dan membuka laci uang kasir saat struk dicetak.</li>
            <li><strong>Test Print Hardware:</strong> Alat uji koneksi printer langsung dari tab pengaturan kasir.</li>
          </ul>
        </div>

        <!-- FITUR 8 -->
        <div class="card">
          <div class="card-title">
            <span class="icon">🎁</span>
            <span>8. Loyalitas &amp; Lucky Spin</span>
            <span class="badge-pill badge-amber">Gamifikasi</span>
          </div>
          <ul>
            <li><strong>Reward Poin Belanja:</strong> Pelanggan login otomatis mendapatkan poin belanja yang dapat ditukar diskon (100 poin = Rp 1.000).</li>
            <li><strong>Kartu Stamp Digital:</strong> Kasir bisa memberi stempel digital (kumpulkan 5 stamp gratis 1 menu porsi spesial).</li>
            <li><strong>Roda Putar (Lucky Spin):</strong> Pelanggan yang selesai membayar berhak memutar roda keberuntungan untuk ekstra poin.</li>
            <li><strong>Database Pelanggan:</strong> Riwayat nomor telepon dan kebiasaan jajan pelanggan tercatat rapi.</li>
          </ul>
        </div>

      </div>

      <!-- FITUR 9 -->
      <div class="card" style="margin-bottom: 8px;">
        <div class="card-title">
          <span class="icon">📊</span>
          <span>9. Laporan Keuangan, Export Excel (.xlsx), Redeem Kode &amp; Promo Makanan</span>
          <span class="badge-pill badge-blue">Multi-Role &amp; Finansial</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
          <div>
            <p style="margin: 0 0 3px; font-size: 7.6pt; color: #475569;"><strong>Export Excel &amp; Rekap:</strong></p>
            <ul>
              <li><strong>Multi-Sheet .xlsx:</strong> Unduh data transaksi, rekap menu terlaris, dan omset ke Excel.</li>
              <li><strong>Buku Kasir Real-Time:</strong> Audit omset kotor, QRIS vs Tunai, dan biaya nota Rp 100 transparan.</li>
            </ul>
          </div>
          <div>
            <p style="margin: 0 0 3px; font-size: 7.6pt; color: #475569;"><strong>Redeem Kode Kasir:</strong></p>
            <ul>
              <li><strong>Owner Bagi Kode:</strong> Terbitkan kode bonus kuota nota kasir dengan batas kuota klaim.</li>
              <li><strong>Anti-Abuse:</strong> Sistem kunci 1 toko 1 klaim, otomatis tolak saat kuota klaim habis.</li>
            </ul>
          </div>
          <div>
            <p style="margin: 0 0 3px; font-size: 7.6pt; color: #475569;"><strong>Engine Promo Makanan:</strong></p>
            <ul>
              <li><strong>Multi-Role Creator:</strong> Owner, Mitra, Kasir, atau Admin dapat membuat promo diskon menu.</li>
              <li><strong>Batas Fleksibel:</strong> Opsi limit Kuota (porsi), Tanggal (kadaluarsa), atau Keduanya (Hybrid).</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- TABEL SKEMA METODE BAYAR -->
      <div style="margin-bottom: 6px;">
        <div style="font-size: 8.5pt; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
          📋 Perbandingan Alur &amp; Skema Finansial per Fitur Kasir
        </div>
        <table>
          <thead>
            <tr>
              <th>Fitur / Metode</th>
              <th>Alur Dana / Pihak</th>
              <th>Biaya / Dampak</th>
              <th>Waktu Eksekusi</th>
              <th>Persyaratan &amp; Batasan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>QRIS TriPay (Online)</strong></td>
              <td>Pelanggan ➔ Master TriPay ➔ Dompet Terpadu</td>
              <td><span class="mono">Rp 100 / transaksi</span></td>
              <td>Real-Time Instan</td>
              <td>Terkoneksi API TriPay</td>
            </tr>
            <tr>
              <td><strong>Tunai (Cash di Laci)</strong></td>
              <td>Pelanggan ➔ Kasir Fisik Toko</td>
              <td><span class="mono">Rp 100 (Potong Nota)</span></td>
              <td>Saat Transaksi Fisik</td>
              <td>Saldo Nota &ge; Rp 100</td>
            </tr>
            <tr>
              <td><strong>Redeem Kode Kasir</strong></td>
              <td>Owner KostKu ➔ Kuota Nota Toko</td>
              <td><span class="mono">Rp 0 (Bonus Kuota)</span></td>
              <td>Instan saat Klaim</td>
              <td>Ada Kode &amp; Kuota Tersedia</td>
            </tr>
            <tr>
              <td><strong>Promo Makanan</strong></td>
              <td>Owner / Mitra / Kasir / Admin ➔ Meja &amp; POS</td>
              <td><span class="mono">Diskon Menu / Order</span></td>
              <td>Instan Saat Pesan</td>
              <td>Batas Kuota / Tanggal Aktif</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- FOOTER HALAMAN 2 -->
    <div class="footer">
      <div><strong>KostKu &amp; Riuph Cloud POS Platform</strong> • Semarang, Indonesia</div>
      <div>Halaman 2 dari 2 • Dokumen Resmi Terverifikasi</div>
    </div>
  </div>

</body>
</html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Generate PDF
    await page.pdf({
      path: PDF_OUTPUT_PROJECT,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '6mm',
        bottom: '6mm',
        left: '8mm',
        right: '8mm'
      }
    });

    // Copy to artifact directory
    fs.copyFileSync(PDF_OUTPUT_PROJECT, PDF_OUTPUT_ARTIFACT);

    const pageElements = await page.$$('.page');
    if (pageElements.length >= 2) {
      await pageElements[0].screenshot({ path: path.join(ARTIFACT_DIR, 'preview_pdf-1.png') });
      await pageElements[1].screenshot({ path: path.join(ARTIFACT_DIR, 'preview_pdf-2.png') });
      console.log('✅ Preview screenshots saved to artifact directory');
    }

    console.log('✅ 2-Page Executive PDF Successfully Generated:');
    console.log('1. Project File:', PDF_OUTPUT_PROJECT);
    console.log('2. Artifact File:', PDF_OUTPUT_ARTIFACT);

  } finally {
    await browser.close();
  }
}

generatePdf().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
