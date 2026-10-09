const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateTugasHtml() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tugas Kelompok Rekayasa Perangkat Lunak - Agile Software Model & Ide Perangkat Lunak KostKu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 14mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.8pt;
      line-height: 1.5;
      color: #1e293b;
      background: #ffffff;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }

    .sheet-page {
      page-break-after: always;
      break-after: page;
      height: 268mm;
      max-height: 268mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      position: relative;
    }

    .sheet-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Cover Styling */
    .cover-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2.5px solid #0f172a;
      padding: 18mm 16mm;
      background: #ffffff;
    }

    .cover-header {
      text-align: center;
      border-bottom: 3px double #0f172a;
      padding-bottom: 12mm;
    }

    .inst-name {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }

    .fak-name {
      font-size: 11pt;
      font-weight: 700;
      color: #334155;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1.5mm;
    }

    .prodi-name {
      font-size: 9.5pt;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .cover-body {
      text-align: center;
      margin: auto 0;
    }

    .doc-type {
      display: inline-block;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #0f172a;
      padding: 5px 16px;
      border-radius: 4px;
      margin-bottom: 5mm;
      border: 1px solid #cbd5e1;
    }

    .main-title {
      font-size: 19pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 4mm;
      letter-spacing: -0.02em;
    }

    .sub-title {
      font-size: 10.5pt;
      color: #475569;
      line-height: 1.5;
      max-width: 140mm;
      margin: 0 auto 6mm;
    }

    .matkul-badge {
      font-size: 9.5pt;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 5px 16px;
      border-radius: 6px;
      display: inline-block;
    }

    .cover-meta {
      border-top: 1px solid #e2e8f0;
      padding-top: 6mm;
    }

    .meta-table {
      width: 100%;
      margin: 0 auto 6mm;
      border-collapse: collapse;
      font-size: 9pt;
    }

    .meta-table td {
      padding: 4px 6px;
      vertical-align: top;
    }

    .meta-label {
      width: 32%;
      font-weight: 600;
      color: #475569;
    }

    .meta-sep {
      width: 4%;
      text-align: center;
      font-weight: 600;
    }

    .meta-val {
      width: 64%;
      font-weight: 700;
      color: #0f172a;
    }

    .cover-footer {
      text-align: center;
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-top: 1px solid #f1f5f9;
      padding-top: 3mm;
    }

    /* Content Typography */
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #94a3b8;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3pt;
      margin-bottom: 10pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 4pt;
      margin-top: 6pt;
    }

    h1.sec-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      border-left: 4px solid #2563eb;
      padding-left: 8px;
      margin: 0 0 8pt;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }

    h2.sub-sec {
      font-size: 10.5pt;
      font-weight: 700;
      color: #1e293b;
      margin: 8pt 0 4pt;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 2px;
    }

    h3.sub-sub-sec {
      font-size: 9.5pt;
      font-weight: 700;
      color: #334155;
      margin: 6pt 0 3pt;
    }

    p {
      text-align: justify;
      margin-bottom: 6pt;
      line-height: 1.5;
    }

    ul, ol {
      margin: 0 0 6pt 16pt;
    }

    li {
      margin-bottom: 3pt;
      line-height: 1.45;
    }

    /* Boxes & Callouts */
    .callout {
      background: #f8fafc;
      border-left: 3.5px solid #3b82f6;
      border-radius: 0 6px 6px 0;
      padding: 6pt 10pt;
      margin: 6pt 0;
      font-size: 8.4pt;
    }

    .callout-title {
      font-weight: 800;
      color: #1e3a8a;
      margin-bottom: 2pt;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .box-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8pt;
      margin: 6pt 0;
    }

    .box-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7pt 9pt;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .box-card-header {
      font-weight: 800;
      font-size: 8.8pt;
      color: #0f172a;
      margin-bottom: 4pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 3pt;
    }

    .badge-pill {
      font-size: 7pt;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 9999px;
      text-transform: uppercase;
    }

    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-rose { background: #ffe4e6; color: #9f1239; }

    /* Tables */
    table.academic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6pt 0;
      font-size: 8pt;
      line-height: 1.4;
    }

    table.academic-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 4pt 6pt;
      border: 1px solid #0f172a;
    }

    table.academic-table td {
      padding: 3.2pt 6pt;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }

    table.academic-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* References */
    .reference-list {
      list-style-type: none;
      margin-left: 0;
      counter-reset: ref-counter;
      font-size: 8pt;
      line-height: 1.45;
    }

    .reference-list li {
      counter-increment: ref-counter;
      position: relative;
      padding-left: 22pt;
      margin-bottom: 5pt;
      text-align: justify;
    }

    .reference-list li::before {
      content: "[" counter(ref-counter) "]";
      position: absolute;
      left: 0;
      top: 0;
      font-weight: 700;
      color: #2563eb;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1: COVER RESMI ==================== -->
  <div class="sheet-page">
    <div class="cover-container">
      <div class="cover-header">
        <div class="inst-name">UNIVERSITAS DIAN NUSWANTORO (UDINUS)</div>
        <div class="fak-name">FAKULTAS ILMU KOMPUTER</div>
        <div class="prodi-name">PROGRAM STUDI S1 TEKNIK INFORMATIKA • REKAYASA PERANGKAT LUNAK</div>
      </div>

      <div class="cover-body">
        <div class="doc-type">TUGAS KELOMPOK AKADEMIK</div>
        <h1 class="main-title">ANALISIS MODEL PROSES AGILE DAN PENGEMBANGAN SISTEM KOSTKU</h1>
        <p class="sub-title">
          Kajian Teori Ekstensif Agile Software Models (XP, Scrum, DSDM) Serta Penentuan & Justifikasi Model Proses Rekayasa Perangkat Lunak Platform KostKu
        </p>
        <div class="matkul-badge">
          Mata Kuliah: Rekayasa Perangkat Lunak (RPL)
        </div>
      </div>

      <div class="cover-meta">
        <table class="meta-table">
          <tr>
            <td class="meta-label">Disusun Oleh (Kelompok)</td>
            <td class="meta-sep">:</td>
            <td class="meta-val">
              1. Oscar Herdian Wijaya (A11.2025.16309)<br>
              2. Maulana Hadi Saputra (A11.2025.16307)<br>
              3. Angelo Joe Lara Anugrah Wisanggeni Putra Tudjiyo (A11.2025.16337)
            </td>
          </tr>
          <tr>
            <td class="meta-label">Program Studi / Kelas</td>
            <td class="meta-sep">:</td>
            <td class="meta-val">S1 Teknik Informatika / A11</td>
          </tr>
          <tr>
            <td class="meta-label">Dosen Pengampu</td>
            <td class="meta-sep">:</td>
            <td class="meta-val">Dosen Pengampu Mata Kuliah Rekayasa Perangkat Lunak</td>
          </tr>
          <tr>
            <td class="meta-label">Tanggal Pengumpulan</td>
            <td class="meta-sep">:</td>
            <td class="meta-val">Oktober 2026</td>
          </tr>
        </table>
      </div>

      <div class="cover-footer">
        SEMARANG • JAWA TENGAH • 2026
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 2: POIN 1 - IDE & KEMAMPUAN PERANGKAT LUNAK ==================== -->
  <div class="sheet-page">
    <div>
      <div class="running-header">
        <span>Tugas Kelompok RPL • Model Proses Agile</span>
        <span>Bagian 1: Ide & Kemampuan Sistem</span>
      </div>

      <h1 class="sec-title">BAGIAN 1: IDE PENGEMBANGAN PERANGKAT LUNAK (KOSTKU)</h1>

      <h2 class="sub-sec">1.1 Identifikasi & Deskripsi Ide Perangkat Lunak</h2>
      <p>
        Perangkat lunak yang dikembangkan diberi nama <strong>KostKu</strong> (<em>Smart Boarding Ecosystem & Architectural Blueprint Engine</em>). <strong>KostKu</strong> dirancang sebagai ekosistem digital dua sisi (<em>two-sided platform</em>) terpadu yang memadukan <strong>Marketplace Pencarian Kost Interaktif</strong> untuk pencari kos (mahasiswa dan perantau) serta <strong>Back-Office Property Management System</strong> untuk pemilik atau pengelola indekos.
      </p>
      <p>
        Latar belakang perancangan KostKu berangkat dari disparitas ekspektasi nyata (<em>reality gap</em>) dan friksi operasional di industri persewaan indekos Indonesia:
      </p>
      <ul>
        <li><strong>Friksi Pencari Kos:</strong> Maraknya manipulasi visual berupa foto kamar berlensa sudut lebar (<em>wide-angle</em>) yang mendistorsi persepsi ruang nyata, ketidakpastian apakah perabot bawaan (misal kasur 160×200 cm atau meja kerja) akan muat, serta minimnya transparansi ventilasi udara alami. Hal ini memaksa pencari kos menghabiskan waktu dan biaya untuk survei fisik yang kerap mengecewakan.</li>
        <li><strong>Friksi Pengelola Kos:</strong> Pembukuan manual berbasis buku tulis yang rentan rusak/hilang, sengketa penagihan utilitas listrik bulanan akibat keterlambatan mencatat angka kWh meteran, komplain fasilitas yang tercecer di chat WhatsApp pribadi, serta potongan komisi perantara aplikasi konvensional yang mencekik (5% hingga 15% per transaksi).</li>
      </ul>

      <h2 class="sub-sec">1.2 Kemampuan & Fitur Unggulan Perangkat Lunak (Feature Capabilities)</h2>
      <p>
        KostKu mengintegrasikan inovasi teknologi rekayasa web modern untuk menghadirkan keunggulan kompetitif yang memecahkan masalah di atas:
      </p>

      <div class="box-grid">
        <div class="box-card">
          <div class="box-card-header">
            <span>1. Architectural 2D Blueprint Engine</span>
            <span class="badge-pill badge-blue">&lt;15 KB SVG</span>
          </div>
          <p style="font-size: 8.2pt; margin: 0;">
            Mesin visualisasi denah arsitektur interaktif berbasis vektor SVG presisi skala <strong>1:50</strong>. Menggambarkan dimensi riil dinding, bukaan pintu, posisi jendela, meja kerja, dan kasur springbed secara akurat tanpa distorsi kamera. Berukuran ultra-ringan (&lt;15 KB) sehingga termuat seketika bahkan pada koneksi seluler hemat daya.
          </p>
        </div>

        <div class="box-card">
          <div class="box-card-header">
            <span>2. 3D Isometric Cutaway Viewer</span>
            <span class="badge-pill badge-purple">Three.js / WebGL</span>
          </div>
          <p style="font-size: 8.2pt; margin: 0;">
            Visualisasi kamar 3D isometrik dengan dinding terpotong (<em>cutaway</em>) yang memungkinkan calon penyewa memutar perspektif dari <strong>4 sudut pandang</strong> (Isometrik Kanan, Kiri, Top-Down 45°, Depan) serta beralih antara <strong>Mode Siang</strong> (<em>natural skylight</em>) dan <strong>Mode Malam</strong> (<em>warm 2700K ambient glow</em>).
          </p>
        </div>

        <div class="box-card">
          <div class="box-card-header">
            <span>3. AI Room Scanner & Questionnaire</span>
            <span class="badge-pill badge-green">Spatial AI</span>
          </div>
          <p style="font-size: 8.2pt; margin: 0;">
            Pemilik kos cukup mengunggah foto kamar tidur. AI Vision menganalisis batas ruang dan menyajikan kuesioner interaktif (ukuran kasur Single 90×200 s.d King 180×200, lemari, meja, kamar mandi dalam), kemudian men-<em>generate</em> denah arsitektur 2D dan model 3D secara otomatis tanpa keahlian CAD.
          </p>
        </div>

        <div class="box-card">
          <div class="box-card-header">
            <span>4. Anti-Bot 1 KTP 1 Akun & Validasi NIK</span>
            <span class="badge-pill badge-rose">Anti-Fraud</span>
          </div>
          <p style="font-size: 8.2pt; margin: 0;">
            Menjamin integritas dan keamanan ekosistem sewa melalui validasi NIK 16 digit resmi kependudukan via endpoint <code>/api/check-nik</code>, foto fisik e-KTP, verifikasi koordinat GPS Google Maps, dan fitur pemulihan akun mandiri (<em>account recovery</em>) berbasis NIK untuk mencegah akun bot/penipuan.
          </p>
        </div>
      </div>

      <div class="callout">
        <div class="callout-title">⚡ Otomatisasi Utilitas & 1-Click WhatsApp Dispatcher</div>
        <p style="margin: 0; font-size: 8.2pt;">
          Kalkulator matematis terintegrasi: <strong>Biaya Listrik = Max(0, Meter Akhir - Meter Awal) × Tarif per kWh</strong>. Menghasilkan rincian sewa transparan yang langsung dikirimkan ke WhatsApp penyewa melalui <em>deep-link formatting</em> (<code>wa.me</code>) dalam 1-klik tanpa pengetikan manual.
        </p>
      </div>

      <div class="callout" style="border-left-color: #8b5cf6;">
        <div class="callout-title" style="color: #6b21a8;">⚙️ Standar Operasional Prosedur (SOP) Enterprise Terintegrasi</div>
        <p style="margin: 0; font-size: 8.2pt;">
          Dilengkapi 3 protokol operasional baku: (1) <strong>SOP Maintenance Terjadwal</strong> pada jam sepi (01.00–04.00) didahului banner 24 jam & full backup data; (2) <strong>SOP Server Down & Error Kritis</strong> dengan auto-monitoring &lt;2m, failover halaman darurat &lt;5m, dan rollback &lt;15m; serta (3) <strong>SOP Komplain Pengguna</strong> dengan klasifikasi Mendesak (SLA respon 15–30 menit, selesai 2–4 jam) dan Biasa (SLA 1×24 jam).
        </p>
      </div>
    </div>

    <div class="page-footer">
      <span>KostKu ✦ Smart Boarding Platform</span>
      <span>Halaman 2 dari 7</span>
    </div>
  </div>

  <!-- ==================== HALAMAN 3: PENENTUAN MODEL SOFTWARE PROSES ==================== -->
  <div class="sheet-page">
    <div>
      <div class="running-header">
        <span>Tugas Kelompok RPL • Model Proses Agile</span>
        <span>Bagian 1: Penentuan Model Proses (Scrum)</span>
      </div>

      <h2 class="sub-sec" style="margin-top: 0;">1.3 Penentuan Model Software Proses yang Sesuai: Scrum Framework</h2>
      <p>
        Berdasarkan karakteristik teknis sistem, dinamika kebutuhan pengguna, serta batasan sumber daya tim pengembang mahasiswa, model proses perangkat lunak yang dipilih dan diterapkan untuk pengembangan <strong>KostKu</strong> adalah <strong>Agile Software Development Model dengan Framework SCRUM</strong>, yang diperkaya dengan praktik teknis terpilih dari <strong>Extreme Programming (XP)</strong>.
      </p>

      <h3 class="sub-sub-sec">A. Alasan Pemilihan Framework Scrum untuk KostKu</h3>
      <ol>
        <li>
          <strong>Kebutuhan Iterasi Pendek Berbasis Umpan Balik Cepat (Rapid Feedback Loop):</strong> KostKu memiliki dua persona pengguna yang sangat berbeda (mahasiswa melek teknologi vs bapak/ibu kos lansia). Perubahan antarmuka dan penyesuaian alur kerja memerlukan validasi berkala. Siklus <em>Sprint</em> berdurasi <strong>2 minggu</strong> memungkinkan tim merilis fungsionalitas bertahap (Sprint 1 Denah 2D, Sprint 2 Kalkulator Utilitas, Sprint 3 Verifikasi KTP, Sprint 4 AI Scanner) dan langsung menguji kegunaannya di lapangan.
        </li>
        <li>
          <strong>Tingginya Ketidakpastian Kebutuhan & Eksplorasi Inovasi Baru:</strong> Integrasi AI Vision Room Scanner dan rendering 3D WebGL di browser merupakan domain eksploratif. Menggunakan model sekuensial linier (seperti Waterfall) sangat berisiko gagal karena spesifikasi teknis AI dan grafis belum dapat dikunci di awal. Scrum memfasilitasi <em>Sprint Backlog Grooming</em> untuk merevisi prioritas sesuai kemajuan teknis.
        </li>
        <li>
          <strong>Struktur Tim Pengembang Skala Kecil yang Lintas-Fungsi (Cross-Functional Team):</strong> Tim proyek terdiri dari mahasiswa yang memegang peran jamak (Frontend, Backend, UI/UX, dan QA). Scrum menyediakan kerangka kerja akuntabilitas harian (<em>Daily Scrum</em>) yang menjaga sinkronisasi tugas tanpa birokrasi dokumentasi tebal.
        </li>
        <li>
          <strong>Penggabungan Praktik Rekayasa XP (Extreme Programming Hybrids):</strong> Tim mengadopsi teknik <em>Continuous Integration</em> (CI) via GitHub Actions, <em>Pair Programming</em> pada modul kritis (algoritma selisih kWh dan parsing SVG), serta <em>Refactoring</em> berkelanjutan guna memastikan kode tetap modular, bersih, dan minim regresi.
        </li>
      </ol>

      <h3 class="sub-sub-sec">B. Keuntungan Penggunaan Scrum pada Proyek KostKu</h3>
      <ul>
        <li><strong>Time-to-Market Sangat Cepat:</strong> Produk dapat dirilis ke lingkungan pengujian pengguna (<em>MVP - Minimum Viable Product</em>) hanya dalam 1 siklus Sprint pertama (versi fungsional marketplace publik).</li>
        <li><strong>Fleksibilitas Tinggi terhadap Perubahan Kebutuhan (Agility):</strong> Ketika muncul masukan penting (seperti kebutuhan fitur SOP Server Down atau pengetatan validasi NIK anti-bot), kebutuhan tersebut dapat segera dimasukkan ke dalam <em>Product Backlog</em> untuk dijadwalkan pada Sprint berikutnya tanpa mengacaukan arsitektur inti.</li>
        <li><strong>Transparansi dan Visibilitas Progres Terukur:</strong> Penggunaan papan kanban (<em>Scrum Board</em>), estimasi <em>Story Points</em>, dan grafik <em>Sprint Burndown</em> memberikan kepastian matriks ketercapaian target kepada seluruh anggota tim dan dosen pembimbing.</li>
        <li><strong>Peningkatan Kualitas Perangkat Lunak Berkelanjutan:</strong> Setiap akhir sprint diwajibkan melewati sesi <em>Sprint Review</em> dan <em>Sprint Retrospective</em> untuk mengevaluasi hambatan komunikasi teknis dan memperbaiki efisiensi kerja tim.</li>
      </ul>

      <h3 class="sub-sub-sec">C. Kerugian & Mitigasi Risiko Penggunaan Scrum pada Proyek KostKu</h3>
      <ul>
        <li>
          <strong>Risiko Scope Creep (Perluasan Fitur Tanpa Kendali):</strong> Fleksibilitas Scrum dapat memicu penambahan ide fitur baru secara terus-menerus sehingga peluncuran final tertunda.
          <br><em>Mitigasi:</em> Product Owner menerapkan teknik prioritisasi MoSCoW dan menegakkan <em>Definition of Done (DoD)</em> secara ketat sebelum fitur baru diizinkan masuk ke sprint.
        </li>
        <li>
          <strong>Ketergantungan Kuat pada Komitmen & Kolaborasi Anggota Tim:</strong> Jika salah satu anggota pasif atau absen pada Daily Scrum, koordinasi modul frontend-backend dapat tersendat.
          <br><em>Mitigasi:</em> Membagi antarmuka komunikasi API secara terstandarisasi sejak awal (REST contract) dan menerapkan repositori terpusat.
        </li>
        <li>
          <strong>Dokumentasi Arsitektur Berpotensi Terabaikan:</strong> Fokus berlebih pada kode yang berjalan cepat (<em>working software</em>) kerap membuat diagram UML dan catatan pemeliharaan terlewat.
          <br><em>Mitigasi:</em> Memasukkan penyusunan dokumentasi teknis dan blueprint sistem sebagai salah satu klausul wajib dalam <em>Definition of Done</em> (DoD).
        </li>
      </ul>
    </div>

    <div class="page-footer">
      <span>KostKu ✦ Smart Boarding Platform</span>
      <span>Halaman 3 dari 7</span>
    </div>
  </div>

  <!-- ==================== HALAMAN 4: TEORI AGILE - OVERVIEW & EXTREME PROGRAMMING ==================== -->
  <div class="sheet-page">
    <div>
      <div class="running-header">
        <span>Tugas Kelompok RPL • Model Proses Agile</span>
        <span>Bagian 2: Teori Extreme Programming (XP)</span>
      </div>

      <h1 class="sec-title">BAGIAN 2: TEORI DAN SUMBER PENDUKUNG MODEL AGILE</h1>

      <h2 class="sub-sec" style="margin: 6pt 0 3pt;">2.1 Pengantar & Paradigma Agile Software Development</h2>
      <p style="margin-bottom: 4pt;">
        Paradigma <strong>Agile</strong> lahir sebagai respon kritis terhadap kegagalan model sekuensial tradisional (<em>plan-driven models</em> seperti Waterfall) yang kaku, membutuhkan dokumentasi masif di awal, dan lambat merespon perubahan pasar. Dirumuskan dalam <em>Agile Manifesto</em> (Beck et al., 2001), pendekatan Agile menempatkan adaptabilitas, kolaborasi aktif, rilis perangkat lunak fungsional bertahap, dan kepuasan pengguna di atas rencana kaku yang telah ditentukan sebelumnya.
      </p>

      <h2 class="sub-sec" style="margin: 6pt 0 3pt;">2.2 Extreme Programming (XP)</h2>
      <p style="margin-bottom: 4pt;">
        <strong>Extreme Programming (XP)</strong> adalah metodologi pengembangan perangkat lunak berbasis Agile yang dicetuskan oleh <strong>Kent Beck</strong> pada akhir 1990-an saat memimpin proyek <em>Chrysler Comprehensive Compensation System (C3)</em>. XP berfokus ekstrem pada keunggulan teknis rekayasa perangkat lunak (<em>software engineering excellence</em>) dan efisiensi penulisan kode untuk menghadapi perubahan kebutuhan yang sangat dinamis.
      </p>

      <h3 class="sub-sub-sec" style="margin: 5pt 0 2pt;">A. Lima Nilai Inti Extreme Programming (XP Core Values)</h3>
      <ol style="margin-bottom: 4pt;">
        <li><strong>Communication:</strong> Menghilangkan sekat komunikasi formal antar-pengembang dan pemangku kepentingan melalui interaksi lisan langsung setiap hari.</li>
        <li><strong>Simplicity:</strong> Menganut prinsip "Lakukan hal paling sederhana yang mungkin bekerja hari ini" (<em>Do the simplest thing that could possibly work</em>). Menghindari arsitektur spekulatif (YAGNI).</li>
        <li><strong>Feedback:</strong> Mengoptimalkan perolehan umpan balik instan melalui pengujian otomatis skala menit, integrasi harian, dan demonstrasi berkala.</li>
        <li><strong>Courage:</strong> Berani melakukan refactoring kode berskala besar, membuang kode usang yang tidak efisien, dan memperbaiki kekeliruan desain sejak dini.</li>
        <li><strong>Respect:</strong> Saling menghormati kontribusi rekan kerja, menjamin kualitas kerja tim, dan tidak merusak integritas kode bersama.</li>
      </ol>

      <h3 class="sub-sub-sec">B. Dua Belas Praktik Rekayasa Inti XP (12 Core Engineering Practices)</h3>
      <table class="academic-table" style="font-size: 7.2pt; margin: 3pt 0;">
        <thead>
          <tr>
            <th style="width: 24%;">Kategori</th>
            <th style="width: 28%;">Praktik XP</th>
            <th style="width: 48%;">Deskripsi Operasional</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="4"><strong>Coding & Design</strong></td>
            <td><strong>Test-Driven Dev (TDD)</strong></td>
            <td>Menulis tes unit otomatis terlebih dahulu sebelum kode implementasi ditulis, memastikan code coverage tinggi.</td>
          </tr>
          <tr>
            <td><strong>Refactoring</strong></td>
            <td>Penyempurnaan struktur internal kode secara berkala tanpa mengubah perilaku eksternal demi menjaga keterbacaan kode.</td>
          </tr>
          <tr>
            <td><strong>Simple Design</strong></td>
            <td>Desain kode dibuat sesederhana mungkin untuk memenuhi kebutuhan saat ini tanpa kompleksitas arsitektur spekulatif.</td>
          </tr>
          <tr>
            <td><strong>System Metaphor</strong></td>
            <td>Menggunakan analogi bersama yang disepakati tim untuk menggambarkan alur kerja sistem secara mudah dipahami.</td>
          </tr>
          <tr>
            <td rowspan="4"><strong>Teamwork</strong></td>
            <td><strong>Pair Programming</strong></td>
            <td>Dua programmer bekerja bersama pada satu workstation: satu pembuat kode (Driver) dan satu peninjau logika (Navigator).</td>
          </tr>
          <tr>
            <td><strong>Collective Ownership</strong></td>
            <td>Seluruh anggota tim memiliki hak dan kewajiban untuk memperbaiki bagian mana pun dari kode tanpa birokrasi izin.</td>
          </tr>
          <tr>
            <td><strong>Coding Standards</strong></td>
            <td>Menetapkan konvensi penulisan sintaks seragam agar kode terasa seperti ditulis oleh satu orang.</td>
          </tr>
          <tr>
            <td><strong>Sustainable Pace</strong></td>
            <td>Menjaga batas jam kerja wajar (40-Hour Week) untuk mencegah kelelahan mental yang memicu kecacatan bug.</td>
          </tr>
          <tr>
            <td rowspan="4"><strong>Feedback & Release</strong></td>
            <td><strong>Continuous Integration</strong></td>
            <td>Penggabungan kode ke repositori utama dilakukan beberapa kali sehari disertai automated unit testing instan.</td>
          </tr>
          <tr>
            <td><strong>Small Releases</strong></td>
            <td>Merilis pembaruan perangkat lunak fungsional dalam siklus sangat singkat (1–3 minggu) ke tangan pengguna.</td>
          </tr>
          <tr>
            <td><strong>On-site Customer</strong></td>
            <td>Perwakilan klien berada langsung di ruang kerja tim untuk menjawab pertanyaan spesifikasi dan menguji hasil rilis.</td>
          </tr>
          <tr>
            <td><strong>Planning Game</strong></td>
            <td>Pertemuan perencanaan di mana klien menentukan User Stories dan pengembang memperkirakan estimasi teknis.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="page-footer">
      <span>KostKu ✦ Smart Boarding Platform</span>
      <span>Halaman 4 dari 7</span>
    </div>
  </div>

  <!-- ==================== HALAMAN 5: TEORI SCRUM FRAMEWORK ==================== -->
  <div class="sheet-page">
    <div>
      <div class="running-header">
        <span>Tugas Kelompok RPL • Model Proses Agile</span>
        <span>Bagian 2: Teori Scrum Framework</span>
      </div>

      <h2 class="sub-sec" style="margin-top: 0;">2.3 Scrum Framework</h2>
      <p>
        Diciptakan oleh <strong>Ken Schwaber</strong> dan <strong>Jeff Sutherland</strong> pada awal 1990-an dan dibukukan resmi dalam <em>The Scrum Guide</em>, <strong>Scrum</strong> adalah kerangka kerja manajemen adaptif yang ringan untuk menghasilkan solusi bernilai tinggi secara berulang bagi masalah-masalah yang kompleks. Scrum berakar kuat pada teori kontrol proses empiris (<strong>Empiricism</strong>) dan pemikiran ramping (<strong>Lean Thinking</strong>).
      </p>

      <h3 class="sub-sub-sec">A. Tiga Pilar Empirisme Scrum (Three Pillars of Empiricism)</h3>
      <ol>
        <li><strong>Transparansi (Transparency):</strong> Proses dan hasil kerja yang sedang berlangsung harus terlihat jelas dan nyata baik bagi pelaksana kerja maupun penerima hasil kerja. Tidak ada informasi tersembunyi.</li>
        <li><strong>Inspeksi (Inspection):</strong> Artefak dan kemajuan proyek Scrum harus diinspeksi secara berkala dan cermat untuk mendeteksi deviasi yang tidak diinginkan sedini mungkin.</li>
        <li><strong>Adaptasi (Adaptation):</strong> Jika ditemukan aspek proses yang melenceng di luar batas yang dapat diterima, penyesuaian proses atau materi yang dihasilkan harus segera dilakukan tanpa menunda.</li>
      </ol>

      <h3 class="sub-sub-sec">B. Tiga Peran Akuntabilitas dalam Scrum (Scrum Roles)</h3>
      <ul>
        <li><strong>Product Owner (PO):</strong> Bertanggung jawab memaksimalkan nilai bisnis produk yang dihasilkan. PO memiliki akuntabilitas tunggal atas pengelolaan efektif <em>Product Backlog</em> (menyusun, mengurutkan, dan memperjelas butir kebutuhan).</li>
        <li><strong>Scrum Master (SM):</strong> Pemimpin yang melayani (<em>servant leader</em>) yang bertindak sebagai fasilitator dan pelatih efektivitas tim Scrum. SM bertugas menghilangkan hambatan kerja (<em>impediments</em>) dan memastikan nilai-nilai Scrum dipahami serta dijalankan.</li>
        <li><strong>Developers (Tim Pengembang):</strong> Sekelompok profesional lintas-keahlian (desainer, programmer, analis, tester) yang berkomitmen untuk menciptakan aspek <em>Increment</em> yang dapat digunakan pada setiap akhir Sprint.</li>
      </ul>

      <h3 class="sub-sub-sec">C. Lima Acara / Seremoni Scrum (Scrum Events)</h3>
      <div class="box-grid">
        <div class="box-card">
          <div class="box-card-header">
            <span>1. The Sprint</span>
            <span class="badge-pill badge-blue">Wadah Utama (1–4 Minggu)</span>
          </div>
          <p style="font-size: 8pt; margin: 0;">
            Jantung dari Scrum berupa wadah berdurasi tetap (<em>time-box</em>) konsisten di mana ide diubah menjadi nilai nyata. Sprint baru segera dimulai tepat setelah Sprint sebelumnya selesai.
          </p>
        </div>

        <div class="box-card">
          <div class="box-card-header">
            <span>2. Sprint Planning</span>
            <span class="badge-pill badge-green">Maks. 8 Jam (Sprint 1 Bulan)</span>
          </div>
          <p style="font-size: 8pt; margin: 0;">
            Acara pembuka Sprint untuk menetapkan tujuan (<em>Sprint Goal</em>), memilih butir backlog dari Product Backlog, dan merencanakan bagaimana pekerjaan teknis akan diselesaikan.
          </p>
        </div>

        <div class="box-card">
          <div class="box-card-header">
            <span>3. Daily Scrum</span>
            <span class="badge-pill badge-purple">15 Menit Setiap Hari</span>
          </div>
          <p style="font-size: 8pt; margin: 0;">
            Pertemuan harian 15 menit bagi Developers untuk menginspeksi kemajuan menuju <em>Sprint Goal</em> dan menyesuaikan rencana kerja untuk 24 jam ke depan guna menghilangkan hambatan.
          </p>
        </div>

        <div class="box-card">
          <div class="box-card-header">
            <span>4. Sprint Review & Retrospective</span>
            <span class="badge-pill badge-amber">Evaluasi Akhir Sprint</span>
          </div>
          <p style="font-size: 8pt; margin: 0;">
            <strong>Review:</strong> Tim mendemonstrasikan hasil kerja kepada pemangku kepentingan. <strong>Retrospective:</strong> Tim mengevaluasi proses kerja, relasi anggota, dan merencanakan efisiensi.
          </p>
        </div>
      </div>

      <h3 class="sub-sub-sec">D. Tiga Artefak Scrum & Komitmen Kualitas</h3>
      <ul>
        <li><strong>Product Backlog:</strong> Daftar terurut kebutuhan, perbaikan, dan fitur yang dibutuhkan oleh produk (Komitmen: <em>Product Goal</em>).</li>
        <li><strong>Sprint Backlog:</strong> Sekumpulan butir Product Backlog terpilih untuk dikerjakan dalam satu Sprint, ditambah rencana kerja operasional (Komitmen: <em>Sprint Goal</em>).</li>
        <li><strong>Increment:</strong> Langkah konkret menuju tercapainya Product Goal. Sebuah increment bernilai guna tinggi dan memenuhi kriteria kualitas formal tim (Komitmen: <em>Definition of Done / DoD</em>).</li>
      </ul>
    </div>

    <div class="page-footer">
      <span>KostKu ✦ Smart Boarding Platform</span>
      <span>Halaman 5 dari 7</span>
    </div>
  </div>

  <!-- ==================== HALAMAN 6: TEORI DSDM & METODE MOSCOW ==================== -->
  <div class="sheet-page">
    <div>
      <div class="running-header">
        <span>Tugas Kelompok RPL • Model Proses Agile</span>
        <span>Bagian 2: Dynamic Systems Development Model (DSDM)</span>
      </div>

      <h2 class="sub-sec" style="margin-top: 0;">2.4 Dynamic Systems Development Model (DSDM)</h2>
      <p>
        <strong>DSDM</strong> didirikan pada tahun 1994 di Inggris oleh konsorsium vendor dan pengguna industri perangkat lunak (sekarang dikenal sebagai <em>Agile Business Consortium</em>). DSDM dirancang untuk menyediakan tata kelola terstruktur bagi pengembangan aplikasi cepat (<em>Rapid Application Development / RAD</em>) tanpa mengorbankan kualitas dan disiplin proyek tingkat enterprise.
      </p>

      <h3 class="sub-sub-sec">A. Filosofi Inti & Pembalikan Segitiga Proyek Tradisional</h3>
      <p>
        Filosofi fundamental DSDM menyatakan: <em>"Setiap proyek harus selaras dengan tujuan bisnis strategis dan memberikan manfaat nyata secara cepat."</em>
        Dalam manajemen proyek tradisional (Waterfall), <strong>Fungsionalitas / Fitur (Scope)</strong> dikunci di awal sebagai target tetap, sedangkan <strong>Waktu (Time)</strong> dan <strong>Biaya (Cost)</strong> bersifat variabel yang kerap membengkak. Sebaliknya, DSDM membalik paradigma tersebut: <strong>Waktu, Biaya, dan Kualitas bersifat TETAP (Fixed)</strong>, sedangkan <strong>Fungsionalitas / Fitur bersifat VARIABEL (Contingency)</strong> yang dikelola melalui teknik prioritisasi MoSCoW.
      </p>

      <h3 class="sub-sub-sec">B. Delapan Prinsip Utama DSDM (8 Core Principles)</h3>
      <ol>
        <li><strong>Focus on the business need:</strong> Setiap keputusan pengembangan harus memberikan nilai bisnis riil yang dapat diukur.</li>
        <li><strong>Deliver on time:</strong> Menjaga batas waktu rilis secara ketat melalui penetapan <em>timebox</em> yang tidak dapat ditawar.</li>
        <li><strong>Collaborate:</strong> Melibatkan pengguna bisnis dan pengembang secara terpadu sepanjang siklus proyek.</li>
        <li><strong>Never compromise quality:</strong> Kualitas sistem telah disepakati di awal dan tidak boleh diturunkan demi mengejar target waktu.</li>
        <li><strong>Build incrementally from firm foundations:</strong> Membangun fondasi arsitektur dan kelayakan yang solid sebelum iterasi fitur dimulai.</li>
        <li><strong>Develop iteratively:</strong> Menerapkan siklus perbaikan terus-menerus berdasarkan umpan balik pengguna langsung.</li>
        <li><strong>Communicate continuously and clearly:</strong> Mengutamakan komunikasi visual, modeling, dan demonstrasi dibanding dokumen tebal.</li>
        <li><strong>Demonstrate control:</strong> Pengelolaan proyek proaktif yang terukur menggunakan metrik transparansi berkala.</li>
      </ol>

      <h3 class="sub-sub-sec">C. Metode Prioritisasi MoSCoW dalam DSDM</h3>
      <p>
        DSDM menerapkan aturan alokasi sumber daya berbasis teknik MoSCoW untuk menjamin pengiriman tepat waktu:
      </p>
      <table class="academic-table">
        <thead>
          <tr>
            <th style="width: 20%;">Prioritas</th>
            <th style="width: 26%;">Definisi Kebutuhan</th>
            <th style="width: 36%;">Implikasi Terhadap Rilis</th>
            <th style="width: 18%;">Alokasi Beban</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Must Have (M)</strong></td>
            <td>Fitur fundamental yang wajib ada. Tanpa fitur ini, sistem tidak bernilai dan tidak layak diluncurkan.</td>
            <td>Ketidakberadaan fitur membatalkan kelayakan rilis.</td>
            <td><strong>Maksimal 60%</strong> kapasitas tim.</td>
          </tr>
          <tr>
            <td><strong>Should Have (S)</strong></td>
            <td>Fitur penting yang sangat diharapkan keberadaannya, namun sistem masih bisa beroperasi jika ada solusi alternatif.</td>
            <td>Fitur penting nomor dua, dikerjakan setelah seluruh Must Have selesai.</td>
            <td rowspan="2"><strong>Sekitar 40%</strong> (Penyangga / buffer).</td>
          </tr>
          <tr>
            <td><strong>Could Have (C)</strong></td>
            <td>Fitur pelengkap yang diinginkan jika waktu dan sumber daya masih tersisa. Berdampak bisnis lebih rendah.</td>
            <td>Fitur pertama yang dipangkas jika tenggat waktu terancam meleset.</td>
          </tr>
          <tr>
            <td><strong>Won't Have (W)</strong></td>
            <td>Fitur yang disepakati untuk tidak dikerjakan pada timebox saat ini, dialokasikan untuk fase mendatang.</td>
            <td>Mencegah scope creep dan menjaga fokus rilis tim saat ini.</td>
            <td>0% (Rilis mendatang).</td>
          </tr>
        </tbody>
      </table>

      <h3 class="sub-sub-sec">D. Empat Fase Siklus Hidup DSDM (DSDM Lifecycle)</h3>
      <ol>
        <li><strong>Pre-Project:</strong> Inisiasi proyek untuk mengidentifikasi sponsor dan lingkup ide bisnis secara ringkas.</li>
        <li><strong>Feasibility & Foundations:</strong> Investigasi kelayakan teknis/bisnis serta perumusan fondasi arsitektur dan tata kelola proyek.</li>
        <li><strong>Evolutionary Development:</strong> Iterasi gabungan antara eksplorasi desain, pembuatan kode fungsional, dan pengujian terintegrasi.</li>
        <li><strong>Deployment & Post-Project:</strong> Penerapan sistem ke lingkungan produksi pengguna dan evaluasi manfaat bisnis aktual pasca-rilis.</li>
      </ol>
    </div>

    <div class="page-footer">
      <span>KostKu ✦ Smart Boarding Platform</span>
      <span>Halaman 6 dari 7</span>
    </div>
  </div>

  <!-- ==================== HALAMAN 7: MATRIKS KOMPARASI, KESIMPULAN & REFERENSI ==================== -->
  <div class="sheet-page">
    <div>
      <div class="running-header">
        <span>Tugas Kelompok RPL • Model Proses Agile</span>
        <span>Bagian 2: Komparasi Model & Daftar Pustaka</span>
      </div>

      <h2 class="sub-sec" style="margin-top: 0;">2.5 Matriks Komparasi Komprehensif: XP vs Scrum vs DSDM</h2>
      <table class="academic-table" style="font-size: 7.6pt;">
        <thead>
          <tr>
            <th style="width: 15%;">Parameter</th>
            <th style="width: 28%;">Extreme Programming (XP)</th>
            <th style="width: 28%;">Scrum Framework</th>
            <th style="width: 29%;">DSDM (Dynamic Systems)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Fokus Utama</strong></td>
            <td>Praktik keunggulan teknis rekayasa kode (TDD, pair programming, refactoring).</td>
            <td>Kerangka kerja manajemen adaptif, transparansi empiris, dan produktivitas tim.</td>
            <td>Tata kelola proyek enterprise terstruktur dan keselarasan nilai bisnis strategis.</td>
          </tr>
          <tr>
            <td><strong>Durasi Iterasi</strong></td>
            <td>Sangat pendek (1 hingga 2 minggu).</td>
            <td>Pendek dan konsisten (1 hingga 4 minggu; umumnya 2 minggu).</td>
            <td>Terbagi dalam <em>Timebox</em> fleksibel (2 minggu hingga 6 minggu per timebox).</td>
          </tr>
          <tr>
            <td><strong>Aturan Praktik Teknis</strong></td>
            <td>Sangat ketat dan preskriptif (Wajib TDD, Pair Programming, CI, Simple Design).</td>
            <td>Agnostik / Terbuka (Tidak mewajibkan teknik coding tertentu, diserahkan ke tim).</td>
            <td>Menyediakan panduan terstruktur (Modeling, prototyping, configuration management).</td>
          </tr>
          <tr>
            <td><strong>Keterlibatan Klien</strong></td>
            <td><em>On-site Customer</em> (Pengguna berada langsung bersama tim setiap hari).</td>
            <td>Diwakili secara penuh oleh peran <em>Product Owner</em> dalam tim Scrum.</td>
            <td>Keterlibatan formal dari peran bisnis (<em>Business Ambassador, Visionary</em>).</td>
          </tr>
          <tr>
            <td><strong>Manajemen Kebutuhan</strong></td>
            <td>User Stories, Planning Game, refactoring instan saat ada cerita baru.</td>
            <td>Product Backlog, Sprint Planning, perubahan ditunda ke Sprint berikutnya.</td>
            <td>Metode prioritisasi MoSCoW (Must, Should, Could, Won't have).</td>
          </tr>
          <tr>
            <td><strong>Kelebihan Utama</strong></td>
            <td>Kualitas basis kode sangat tinggi, bug sangat minim karena TDD & pair programming.</td>
            <td>Sangat adaptif, mudah diadopsi tim multidisiplin, visibilitas progres tinggi.</td>
            <td>Kepastian tenggat waktu dan anggaran sangat kuat, cocok untuk korporasi besar.</td>
          </tr>
          <tr>
            <td><strong>Keterbatasan</strong></td>
            <td>Memerlukan kedisiplinan teknis tinggi, rentan kelelahan mental jika dipaksakan.</td>
            <td>Tidak memberikan panduan rekayasa teknis; rentan degradasi kode jika tim pemula.</td>
            <td>Beban tata kelola dan peran formal lebih banyak dibanding Scrum atau XP.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec">2.6 Kesimpulan Analisis & Rekomendasi Terapan untuk KostKu</h2>
      <p>
        Dari perbandingan ketiga model, sintesis terbaik untuk proyek <strong>KostKu</strong> adalah menerapkan <strong>Scrum sebagai kerangka kerja tata kelola proyek utama</strong> (memanfaatkan siklus Sprint 2 minggu, upacara Daily Standup, dan Sprint Review untuk mengakomodasi kebutuhan pengguna kos), kemudian memperkuatnya dengan <strong>praktik teknis terpilih dari XP</strong> (seperti Test-Driven Development pada modul kalkulator utilitas dan Continuous Integration pada pipeline build multi-platform). Pendekatan hibrida ini memberikan fleksibilitas manajerial sekaligus kepastian mutu kode tingkat tinggi.
      </p>

      <h2 class="sub-sec" style="margin-top: 6pt;">DAFTAR PUSTAKA & SUMBER REFERENSI PENDUKUNG</h2>
      <ol class="reference-list">
        <li>
          Beck, K., et al. (2001). <em>Manifesto for Agile Software Development</em>. Agile Alliance.
        </li>
        <li>
          Beck, K., & Andres, C. (2004). <em>Extreme Programming Explained: Embrace Change</em> (2nd Edition). Addison-Wesley Professional.
        </li>
        <li>
          Schwaber, K., & Sutherland, J. (2020). <em>The Scrum Guide: The Definitive Guide to Scrum</em>. Scrum.org.
        </li>
        <li>
          Agile Business Consortium. (2014). <em>The DSDM Agile Project Framework</em>. Agile Business Consortium Limited.
        </li>
        <li>
          Sommerville, I. (2016). <em>Software Engineering</em> (10th Edition). Pearson Education. (Chapter 3: Agile Software Engineering).
        </li>
        <li>
          Pressman, R. S., & Maxim, B. R. (2020). <em>Software Engineering: A Practitioner's Approach</em> (9th Edition). McGraw-Hill.
        </li>
        <li>
          Fowler, M. (2018). <em>Refactoring: Improving the Design of Existing Code</em> (2nd Edition). Addison-Wesley.
        </li>
        <li>
          Rubin, K. S. (2012). <em>Essential Scrum: A Practical Guide to the Most Popular Agile Process</em>. Addison-Wesley.
        </li>
      </ol>
    </div>

    <div class="page-footer">
      <span>KostKu ✦ Smart Boarding Platform</span>
      <span>Halaman 7 dari 7</span>
    </div>
  </div>

</body>
</html>`;
}

const htmlOut = path.join(__dirname, 'Tugas_Kelompok_RPL_Agile_KostKu.html');
const pdfTarget1 = '/home/rena/Downloads/Tugas_kelompok_A11.2025.16309_A11.2025.16307_A11.2025.16337.pdf';
const pdfTarget2 = '/home/rena/Downloads/Tugas_kelompok_Nim1_Nim2_Nim3.pdf';
const brainArtifactDir = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';

fs.writeFileSync(htmlOut, generateTugasHtml());
console.log('Tugas Kelompok HTML generated at:', htmlOut);

const pdfTemp = path.join(__dirname, 'Tugas_kelompok_Agile_RPL.pdf');
const chromeCmd = `google-chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfTemp}" "${htmlOut}"`;
console.log('Rendering A4 Academic PDF with Chrome...');
execSync(chromeCmd, { stdio: 'inherit' });

// Copy to destinations
fs.copyFileSync(pdfTemp, pdfTarget1);
fs.copyFileSync(pdfTemp, pdfTarget2);
fs.copyFileSync(pdfTemp, path.join(brainArtifactDir, 'Tugas_kelompok_A11.2025.16309_A11.2025.16307_A11.2025.16337.pdf'));
fs.copyFileSync(pdfTemp, path.join(brainArtifactDir, 'Tugas_kelompok_Nim1_Nim2_Nim3.pdf'));

console.log('PDF saved to:');
console.log('1.', pdfTarget1);
console.log('2.', pdfTarget2);

const stat = fs.statSync(pdfTarget1);
console.log('Size:', (stat.size / 1024).toFixed(1), 'KB');
