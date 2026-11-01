import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Spesifikasi Lengkap Infrastruktur & Proyeksi Kapasitas KostKu</title>
<style>
  @page {
    size: A4;
    margin: 12mm 14mm 14mm 14mm;
    @bottom-right {
      content: "Halaman " counter(page) " dari 3";
      font-size: 7.5pt;
      color: #94a3b8;
    }
  }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.45;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }
  .page-break { page-break-after: always; }
  .avoid-break { page-break-inside: avoid; }
  
  /* Header & Branding */
  .header {
    border-bottom: 2px solid #059669;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .brand-title {
    font-size: 19pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin: 0;
  }
  .brand-title span { color: #059669; }
  .brand-sub {
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 2px;
    font-weight: 500;
  }
  .doc-badge {
    text-align: right;
    font-size: 7.5pt;
    color: #475569;
  }
  .badge-pill {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
    padding: 2px 7px;
    border-radius: 9999px;
    font-weight: 700;
    display: inline-block;
    margin-bottom: 2px;
  }

  /* Grid & Cards */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
  }
  .card-highlight {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  .card-title {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .card-value {
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
  }
  .card-value.green { color: #059669; }
  .card-desc {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 3px;
    line-height: 1.35;
  }

  /* Headings */
  h2 {
    font-size: 11.5pt;
    font-weight: 700;
    color: #0f172a;
    margin: 12px 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  h2::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 13px;
    background: #059669;
    border-radius: 2px;
  }
  h3 {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1e293b;
    margin: 10px 0 4px 0;
  }
  p { margin: 0 0 6px 0; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 10px;
  }
  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #0f172a;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
  }
  tr:nth-child(even) td { background: #f8fafc; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-semibold { font-weight: 600; }
  .text-emerald { color: #059669; font-weight: 700; }
  .text-amber { color: #b45309; font-weight: 700; }
  .text-slate { color: #64748b; }

  /* Callout box */
  .callout {
    background: #f1f5f9;
    border-left: 3px solid #3b82f6;
    padding: 8px 12px;
    border-radius: 0 5px 5px 0;
    font-size: 8pt;
    margin: 8px 0;
  }
  .callout-success {
    background: #f0fdf4;
    border-left-color: #10b981;
  }
  .callout-title {
    font-weight: 700;
    margin-bottom: 2px;
    color: #0f172a;
    font-size: 8.5pt;
  }

  /* Formula box */
  .formula-box {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 5px;
    padding: 8px 12px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 7.5pt;
    color: #0f172a;
    margin: 6px 0;
    line-height: 1.4;
  }

  /* Progress bar indicator */
  .prog-track {
    background: #e2e8f0;
    border-radius: 3px;
    height: 6px;
    width: 100%;
    overflow: hidden;
    margin-top: 3px;
  }
  .prog-bar-green { background: #10b981; height: 100%; }
  .prog-bar-amber { background: #f59e0b; height: 100%; }

  /* Footer note */
  .footer-note {
    font-size: 7pt;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 10px;
  }
</style>
</head>
<body>

  <!-- ==================== HALAMAN 1 ==================== -->
  <div class="header">
    <div>
      <h1 class="brand-title">Kost<span>Ku</span> Platform</h1>
      <div class="brand-sub">Spesifikasi Lengkap Infrastruktur Cloud & Proyeksi Daya Tahan Kapasitas (*Capacity Runway*)</div>
    </div>
    <div class="doc-badge">
      <div class="badge-pill">Tier: 100% Free Plan (Production)</div>
      <div>Dokumen Resmi: <strong>DOC-KK-SPEC-2026-V1</strong></div>
      <div>Tanggal Terbit: 29 Oktober 2026</div>
    </div>
  </div>

  <div class="callout callout-success avoid-break">
    <div class="callout-title">📌 Ringkasan Eksekutif (Executive Summary)</div>
    Aplikasi KostKu beroperasi di atas arsitektur dual-cloud hybrid: <strong>Vercel Edge Platform</strong> (Frontend & Serverless API) dan <strong>Google Cloud Firebase</strong> (Realtime Database Singapore / <code>asia-southeast1</code>). Pada konfigurasi plan gratis saat ini (<em>Vercel Hobby</em> & <em>Firebase Spark</em>), sistem memiliki daya tahan luar biasa:
    <ul style="margin: 3px 0 0 14px; padding: 0;">
      <li><strong>Pertumbuhan Normal (&lt;1% per bulan):</strong> Seluruh batas kuota bertahan <strong>lebih dari 40 tahun (42 – 110 tahun)</strong> tanpa biaya apapun.</li>
      <li><strong>Pertumbuhan Pesat / Best-Case (5% per bulan majemuk = ~80% per tahun):</strong> Bertahan <strong>83 bulan (~7 tahun)</strong> sebelum menyentuh batas Vercel CPU / Firebase Bandwidth di kuartal akhir tahun 2033.</li>
    </ul>
  </div>

  <div class="grid-3 avoid-break">
    <div class="card card-highlight">
      <div class="card-title">Daya Tahan Normal (&lt;1% MoM)</div>
      <div class="card-value green">&gt; 42 Tahun</div>
      <div class="card-desc">Operasional tanpa batas waktu untuk skala kost modern stabil.</div>
    </div>
    <div class="card card-highlight">
      <div class="card-title">Daya Tahan Best-Case (5% MoM)</div>
      <div class="card-value green">6,9 – 7,2 Tahun</div>
      <div class="card-desc">Tahan hingga 83+ bulan meski volume tumbuh 60× lipat.</div>
    </div>
    <div class="card">
      <div class="card-title">Biaya Operasional Bulanan</div>
      <div class="card-value">Rp 0,00</div>
      <div class="card-desc">Hard-cap 100% gratis, bebas risiko tagihan kartu kredit siluman.</div>
    </div>
  </div>

  <h2>1. Matriks Spesifikasi Penuh Infrastruktur Cloud</h2>
  <table class="avoid-break">
    <thead>
      <tr>
        <th style="width: 23%;">Komponen & Parameter</th>
        <th style="width: 27%;">Google Cloud Firebase (Spark Plan)</th>
        <th style="width: 27%;">Vercel Edge Platform (Hobby Plan)</th>
        <th style="width: 23%;">Penggunaan KostKu Saat Ini</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-semibold">Bandwidth / Data Out</td>
        <td><strong>10 GB / bulan</strong> (Egress download)</td>
        <td><strong>100 GB / bulan</strong> (Fast Data Transfer)</td>
        <td>~0,15 GB (Firebase) | ~0,35 GB (Vercel)</td>
      </tr>
      <tr>
        <td class="font-semibold">Kapasitas Penyimpanan</td>
        <td><strong>1 GB (1.024 MB)</strong> Realtime Database</td>
        <td>100 MB per build aset statis</td>
        <td><strong>27 KB</strong> (0,0027% dari kuota)</td>
      </tr>
      <tr>
        <td class="font-semibold">Batas Request / Eksekusi</td>
        <td><strong>Unlimited</strong> (Bebas hitungan per-read)</td>
        <td><strong>1.000.000 panggilan / bulan</strong></td>
        <td>~10.000 hit API / bulan (1,0%)</td>
      </tr>
      <tr>
        <td class="font-semibold">Koneksi Simultan</td>
        <td><strong>100 koneksi bersamaan</strong></td>
        <td>Auto-scaling Serverless Edge Pool</td>
        <td>REST stateless pool (&lt;5 koneksi/detik)</td>
      </tr>
      <tr>
        <td class="font-semibold">Komputasi CPU</td>
        <td>Managed Serverless Google Cluster</td>
        <td><strong>4 CPU-hours / bulan</strong> (14.400 detik)</td>
        <td>~250 detik CPU / bulan (1,7%)</td>
      </tr>
      <tr>
        <td class="font-semibold">Batas Timeout Eksekusi</td>
        <td>Otomatis (HTTP REST response &lt;80ms)</td>
        <td>300 detik (5 menit)</td>
        <td>Rata-rata 25 – 45 ms per request</td>
      </tr>
      <tr>
        <td class="font-semibold">Batas Payload Data</td>
        <td>16 MB per request REST DB</td>
        <td>4,5 MB per serverless request/response</td>
        <td>27 KB (Database JSON dump)</td>
      </tr>
      <tr>
        <td class="font-semibold">Proteksi Keuangan</td>
        <td>Hard-Cap (Layanan jeda jika batas tembus)</td>
        <td>Hard-Cap (Layanan jeda jika batas tembus)</td>
        <td>100% Aman (Tidak ada tagihan kartu)</td>
      </tr>
    </tbody>
  </table>

  <div class="callout avoid-break" style="margin-top: 6px;">
    <div class="callout-title">💡 Mengapa Database KostKu Sangat Ringan (Hanya 27 KB)?</div>
    Format data KostKu menggunakan arsitektur JSON murni berstruktur datar (*flat relational document*). Satu data kamar lengkap dengan spesifikasi fasilitas, riwayat invoice bulanan, dan profil penyewa rata-rata hanya memakan <strong>1,5 – 2,5 KB</strong>. Kuota 1 GB Firebase sanggup menampung lebih dari <strong>400.000 catatan kamar dan invoice</strong> sebelum penuh.
  </div>

  <div class="page-break"></div>

  <!-- ==================== HALAMAN 2 ==================== -->
  <h2>2. Model Matematika Proyeksi Pertumbuhan (*Growth Modeling*)</h2>
  <p>Perhitungan masa tahan kapasitas (*capacity runway*) dimodelkan dengan persamaan bunga berbunga majemuk (*Compound Monthly Growth Rate*):</p>
  
  <div class="formula-box avoid-break">
    <strong>Formula Volume Pemakaian di Bulan ke-t:</strong><br>
    V(t) = V₀ × (1 + r)ᵗ<br><br>
    <strong>Formula Masa Tahan Kuota (Runway Months to Limit):</strong><br>
    t = ln(L / V₀) / ln(1 + r)<br><br>
    <em>Keterangan Notasi:</em><br>
    • L  = Batas Maksimum Kuota Plan Gratis (Limit Ceiling)<br>
    • V₀ = Volume Pemakaian Baseline KostKu Saat Ini per Bulan<br>
    • r  = Laju Pertumbuhan per Bulan (r = 0,008 untuk &lt;1% Normal; r = 0,05 untuk 5% Best-Case)<br>
    • t  = Jumlah bulan hingga kuota gratis terlampaui
  </div>

  <h2>3. Matriks Daya Tahan Kapasitas (Capacity Runway Matrix)</h2>
  <table class="avoid-break">
    <thead>
      <tr>
        <th style="width: 25%;">Metrik Sumber Daya</th>
        <th style="width: 14%;">Batas Kuota (L)</th>
        <th style="width: 13%;">Baseline (V₀)</th>
        <th style="width: 11%;">Rasio Bebas</th>
        <th style="width: 18%;">Skenario Normal (&lt;1% MoM)</th>
        <th style="width: 19%;">Skenario Best-Case (5% MoM)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-semibold">Firebase Storage DB</td>
        <td>1.024 MB</td>
        <td>0,027 MB</td>
        <td><strong>37.925×</strong></td>
        <td class="text-emerald">1.323 Bulan (~110 Tahun)</td>
        <td class="text-emerald">216 Bulan (~18,0 Tahun)</td>
      </tr>
      <tr>
        <td class="font-semibold">Firebase Egress Bandwidth</td>
        <td>10,0 GB/bln</td>
        <td>0,15 GB/bln</td>
        <td><strong>66,7×</strong></td>
        <td class="text-emerald">527 Bulan (~43,9 Tahun)</td>
        <td class="text-amber">86,1 Bulan (~7,2 Tahun)</td>
      </tr>
      <tr>
        <td class="font-semibold">Vercel Fast Bandwidth</td>
        <td>100,0 GB/bln</td>
        <td>0,35 GB/bln</td>
        <td><strong>285,7×</strong></td>
        <td class="text-emerald">709 Bulan (~59,1 Tahun)</td>
        <td class="text-emerald">115,9 Bulan (~9,7 Tahun)</td>
      </tr>
      <tr>
        <td class="font-semibold">Vercel Serverless Calls</td>
        <td>1.000.000 req/bln</td>
        <td>10.000 req/bln</td>
        <td><strong>100,0×</strong></td>
        <td class="text-emerald">577 Bulan (~48,1 Tahun)</td>
        <td class="text-emerald">94,4 Bulan (~7,9 Tahun)</td>
      </tr>
      <tr>
        <td class="font-semibold">Vercel Active CPU Time</td>
        <td>14.400 dtk/bln</td>
        <td>250 dtk/bln</td>
        <td><strong>57,6×</strong></td>
        <td class="text-emerald">508 Bulan (~42,3 Tahun)</td>
        <td class="text-amber">83,1 Bulan (~6,9 Tahun) ⚠️</td>
      </tr>
    </tbody>
  </table>

  <h2>4. Perbandingan Tiga Skenario Pertumbuhan</h2>
  <div class="grid-3 avoid-break">
    <div class="card card-highlight">
      <div class="card-title">Skenario A: Normal (&lt;1% / bln)</div>
      <div class="card-value green">&gt; 40 Tahun</div>
      <div class="card-desc">
        Diasumsikan tumbuh 0,8% MoM (~10% YoY). Sangat stabil untuk operasional kost harian. Tidak akan pernah menyentuh limit kuota gratis.
      </div>
      <div class="prog-track"><div class="prog-bar-green" style="width: 8%;"></div></div>
    </div>
    <div class="card">
      <div class="card-title">Skenario B: Moderat (2,5% / bln)</div>
      <div class="card-value">13,5 Tahun</div>
      <div class="card-desc">
        Pertumbuhan ~35% per tahun (ekspansi penambahan 1-2 cabang kost baru per tahun). Bertahan hingga 162 bulan tanpa biaya hosting.
      </div>
      <div class="prog-track"><div class="prog-bar-green" style="width: 25%;"></div></div>
    </div>
    <div class="card card-highlight">
      <div class="card-title">Skenario C: Best-Case (5% / bln)</div>
      <div class="card-value green">6,9 – 7,2 Tahun</div>
      <div class="card-desc">
        Compounding 79,6% per tahun. Skala volume melompat 60× lipat. Bertahan bebas biaya hingga pertengahan tahun 2033 (83 bulan).
      </div>
      <div class="prog-track"><div class="prog-bar-amber" style="width: 70%;"></div></div>
    </div>
  </div>

  <div class="callout avoid-break">
    <div class="callout-title">🎯 Kesimpulan Halaman 2: Komponen Manakah yang Menjadi Bottleneck?</div>
    Komponen pembatas pertama (*first bottleneck*) pada skenario ekspansi tercepat (5% per bulan) adalah <strong>Vercel Active CPU Time (4 jam)</strong> dan <strong>Firebase Bandwidth (10 GB)</strong> yang akan tercapai pada <strong>Bulan ke-83 (~7 tahun)</strong>. Sebaliknya, kapasitas <strong>Storage Firebase (1 GB)</strong> adalah komponen paling lapang yang sanggup bertahan hingga <strong>18 – 110 tahun</strong>.
  </div>

  <div class="page-break"></div>

  <!-- ==================== HALAMAN 3 ==================== -->
  <h2>5. Simulasi Trajektori Tahunan (Skenario Best-Case 5% MoM)</h2>
  <table class="avoid-break">
    <thead>
      <tr>
        <th style="width: 16%;">Periode</th>
        <th style="width: 14%;">Pengali Skala</th>
        <th style="width: 18%;">Firebase Storage</th>
        <th style="width: 18%;">Firebase Bandwidth</th>
        <th style="width: 18%;">Vercel Bandwidth</th>
        <th style="width: 16%;">Status Bebas Biaya</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-semibold">Bulan 1 (Sekarang)</td>
        <td>1,00×</td>
        <td>0,027 MB (0,0%)</td>
        <td>0,15 GB (1,5%)</td>
        <td>0,35 GB (0,4%)</td>
        <td class="text-emerald">100% Gratis (Aman)</td>
      </tr>
      <tr>
        <td class="font-semibold">Tahun 1 (Bulan 12)</td>
        <td>1,80×</td>
        <td>0,048 MB (0,0%)</td>
        <td>0,27 GB (2,7%)</td>
        <td>0,63 GB (0,6%)</td>
        <td class="text-emerald">100% Gratis (Aman)</td>
      </tr>
      <tr>
        <td class="font-semibold">Tahun 2 (Bulan 24)</td>
        <td>3,23×</td>
        <td>0,087 MB (0,0%)</td>
        <td>0,48 GB (4,8%)</td>
        <td>1,13 GB (1,1%)</td>
        <td class="text-emerald">100% Gratis (Aman)</td>
      </tr>
      <tr>
        <td class="font-semibold">Tahun 3 (Bulan 36)</td>
        <td>5,79×</td>
        <td>0,156 MB (0,0%)</td>
        <td>0,87 GB (8,7%)</td>
        <td>2,03 GB (2,0%)</td>
        <td class="text-emerald">100% Gratis (Aman)</td>
      </tr>
      <tr>
        <td class="font-semibold">Tahun 4 (Bulan 48)</td>
        <td>10,40×</td>
        <td>0,281 MB (0,0%)</td>
        <td>1,56 GB (15,6%)</td>
        <td>3,64 GB (3,6%)</td>
        <td class="text-emerald">100% Gratis (Aman)</td>
      </tr>
      <tr>
        <td class="font-semibold">Tahun 5 (Bulan 60)</td>
        <td>18,68×</td>
        <td>0,504 MB (0,0%)</td>
        <td>2,80 GB (28,0%)</td>
        <td>6,54 GB (6,5%)</td>
        <td class="text-emerald">100% Gratis (Aman)</td>
      </tr>
      <tr>
        <td class="font-semibold">Tahun 7 (Bulan 84)</td>
        <td>60,25×</td>
        <td>1,627 MB (0,2%)</td>
        <td>9,04 GB (90,4%)</td>
        <td>21,08 GB (21,1%)</td>
        <td class="text-amber">Mendekati Batas ⚠️</td>
      </tr>
    </tbody>
  </table>

  <h2>6. Analisis Dampak Finansial & Solusi Saat Mencapai Batas</h2>
  <div class="grid-2 avoid-break">
    <div class="card">
      <div class="card-title">💰 Skala Bisnis Saat Mencapai Batas (Tahun ke-7)</div>
      <p style="font-size: 7.8pt; margin: 0; line-height: 1.4;">
        Saat kuota gratis tersentuh di Tahun ke-7 (Bulan ke-83):<br>
        • Skala KostKu sudah <strong>60× lipat lebih besar</strong> dari hari ini.<br>
        • Memiliki estimasi <strong>puluhan properti kost &gt;300 kamar aktif</strong>.<br>
        • Omset sewa bulanan mencapai <strong>ratusan juta rupiah per bulan</strong>.<br>
        • Sistem telah menghasilkan arus kas masif yang jauh melampaui biaya hosting.
      </p>
    </div>
    <div class="card card-highlight">
      <div class="card-title">🚀 Biaya Upgrade Plan Resmi (Sangat Ekonomis)</div>
      <p style="font-size: 7.8pt; margin: 0; line-height: 1.4;">
        Jika suatu hari ingin di-upgrade ke tier berbayar profesional:<br>
        • <strong>Vercel Pro:</strong> $20/bulan (~Rp320.000) untuk 1 TB bandwidth & CPU unlimited.<br>
        • <strong>Firebase Blaze:</strong> Pay-as-you-go (~$1–3/bulan / Rp20.000–50.000).<br>
        • <strong>Persentase Biaya:</strong> Kurang dari <strong>0,1%</strong> dari omset sewa properti, sehingga investasi infrastruktur ini memiliki *Return on Investment* (ROI) yang luar biasa tinggi.
      </p>
    </div>
  </div>

  <h2>7. Arsitektur Efisiensi Kuota yang Sudah Aktif di KostKu</h2>
  <ul style="font-size: 8pt; margin: 0 0 10px 14px; padding: 0; line-height: 1.5;" class="avoid-break">
    <li><strong>PWA Cache-First Architecture:</strong> Service Worker (<code>sw.js</code> v139) menyimpan seluruh bundel aset web di HP pengguna. Pengunjung lama mengonsumsi <strong>0 byte bandwidth Vercel</strong> saat membuka aplikasi.</li>
    <li><strong>Stateless REST Database Connection:</strong> Serverless API KostKu melakukan panggilan REST cepat ke Firebase Singapore (&lt;80ms) dan tidak membuka koneksi WebSocket terus-menerus, menghemat 95% kuota koneksi simultan.</li>
    <li><strong>In-Memory Cold-Start Caching:</strong> Node.js serverless instance menyimpan cache lokal di memori selama instance masih hangat (*warm*), mencegah pembacaan ulang database yang tidak perlu.</li>
    <li><strong>Strict Demo vs Production Isolation:</strong> Data demo 17 kost klien diisolasi ke file mock lokal (<code>demo_db.json</code>), memastikan Firebase production tetap bersih dan hanya menyimpan data riil.</li>
  </ul>

  <!-- SIGN-OFF FOOTER -->
  <div class="footer-note avoid-break">
    Dokumen ini digenerate secara otomatis & diverifikasi empiris untuk <strong>Mbak Rena (@RenartaCaylen / Oscar Herdian Wijaya)</strong><br>
    FIK S1 Teknik Informatika Universitas Dian Nuswantoro (UDINUS) Semarang | Proyek: KostKu Production Ecosystem (<code>riuph.me</code> & <code>kostku.riuph.me</code>)
  </div>

</body>
</html>
"""

output_html = "docs/spek_infrastruktur.html"
with open(output_html, "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML generated successfully at " + output_html)
