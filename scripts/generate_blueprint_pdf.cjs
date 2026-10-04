const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>KostKu - Blueprint Produk, Arsitektur UX & Analisis Bisnis</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, -apple-system, sans-serif',
        primaryColor: '#e0e7ff',
        primaryBorderColor: '#6366f1',
        primaryTextColor: '#1e1b4b',
        lineColor: '#4f46e5',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#ffffff'
      }
    });
  </script>
  <style>
    @page {
      size: A4;
      margin: 18mm 14mm 20mm 14mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.55;
      font-size: 10pt;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* Cover / Header Section */
    .cover-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #1e293b 100%);
      color: #ffffff;
      padding: 32px 28px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
    }

    .cover-badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(165, 180, 252, 0.4);
      color: #c7d2fe;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 22pt;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .cover-subtitle {
      font-size: 11pt;
      color: #cbd5e1;
      font-weight: 400;
      margin-bottom: 16px;
    }

    .cover-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 14px;
      font-size: 8.5pt;
      color: #94a3b8;
    }

    .cover-meta span strong {
      color: #e2e8f0;
    }

    /* Typography & Hierarchy */
    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: 800;
      line-height: 1.3;
    }

    h1 {
      font-size: 15pt;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h2 {
      font-size: 12pt;
      margin-top: 16px;
      margin-bottom: 8px;
      color: #334155;
    }

    h3 {
      font-size: 10.5pt;
      margin-top: 12px;
      margin-bottom: 6px;
      color: #475569;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
      color: #334155;
    }

    li {
      margin-bottom: 4px;
    }

    strong {
      color: #0f172a;
    }

    /* Callout Boxes */
    .callout {
      border-radius: 8px;
      padding: 12px 16px;
      margin: 12px 0;
      font-size: 9.5pt;
    }

    .callout-chat {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 5px solid #6366f1;
    }

    .callout-tip {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 5px solid #2563eb;
    }

    .callout-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 5px solid #10b981;
    }

    .callout-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 5px solid #f59e0b;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 8.5pt;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Persona Cards */
    .persona-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 12px 0;
    }

    .persona-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }

    .persona-header {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .persona-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14pt;
      font-weight: bold;
    }

    /* Mermaid diagrams container */
    .mermaid-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 14px 0;
      text-align: center;
    }

    /* Blueprint SVG container */
    .blueprint-frame {
      background: #071120;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 10px;
      margin: 14px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-purple { background: #ede9fe; color: #5b21b6; }
    .badge-amber { background: #fef3c7; color: #92400e; }

    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- COVER / HEADER -->
  <div class="cover-header">
    <div class="cover-badge">Dokumen Arsitektur Produk & Strategi Bisnis</div>
    <div class="cover-title">KostKu: Platform Manajemen & Marketplace Kost Pintar</div>
    <div class="cover-subtitle">Spesifikasi Menyeluruh: Value Proposition, Logika Sistem, UI/UX Architecture, dan Kelayakan Bisnis</div>
    <div class="cover-meta">
      <span><strong>Peran:</strong> Senior Product Manager & UX Architect</span>
      <span><strong>Versi Rilis:</strong> v1.0.3 (Production Build)</span>
      <span><strong>Platform:</strong> Web PWA, Android Capacitor APK, Windows Desktop</span>
      <span><strong>Tanggal:</strong> Oktober 2026</span>
    </div>
  </div>

  <!-- BAGIAN 0: BALASAN DISKUSI TIM -->
  <div class="callout callout-chat">
    <strong style="color: #4f46e5; font-size: 10pt;">💬 Format Siap Kirim untuk Diskusi Tim Proyek:</strong>
    <p style="margin-top: 6px; font-style: italic; color: #334155;">
      "Halo, selamat pagi! Terima kasih sudah menginisiasi diskusi. Agar proyek kita terarah, memiliki diferensiasi kuat, dan pembagian tugasnya jelas sejak hari pertama, berikut kerangka kerja yang sudah dirumuskan:
    </p>
    <ul style="margin-bottom: 6px; font-size: 9pt;">
      <li><strong>1. Topik Proyek:</strong> KostKu — Ekosistem Digital Terpadu Dua Sisi: Marketplace Pencarian Kost berbasis Denah Interaktif 2D/3D (Pencari Kost) terintegrasi dengan Dashboard Manajemen Operasional (Pemilik Kost).</li>
      <li><strong>2. Bahasa Pemrograman & Stack:</strong> React 18, Vite, Node.js Express REST API, SQLite / Structured Local JSON DB + Supabase Cloud Sync, Capacitor Android APK, dan Electron Desktop.</li>
      <li><strong>3. Desain:</strong> Modern Dark Twilight Palette (<code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">#0a1628</code>) beraksen Electric Blue, tata letak adaptif (Floating Bottom Nav di HP, Left Sidebar di Desktop).</li>
      <li><strong>4. Analisis:</strong> Memecahkan masalah foto kos manipulatif melalui transparansi dimensi denah arsitektur nyata, serta otomatisasi pencatatan tagihan listrik kWh dan kwitansi WhatsApp.</li>
      <li><strong>5. Persiapan & Pembagian Tugas:</strong> Frontend Specialist (UI & SVG Canvas), Backend Specialist (REST API & Auth), Mobile/Capacitor & QA Specialist (Build APK & PWA Testing)."</li>
    </ul>
  </div>

  <!-- BAGIAN 1: VALUE PROPOSITION & CUSTOMER HOOK -->
  <h1>1. Value Proposition & Customer Hook</h1>
  
  <h2>1.1 Masalah Utama yang Diselesaikan & Hook Pemicu Pertama</h2>
  <p>
    Pasar sewa properti kos-kosan di Indonesia memiliki friksi asimetris yang akut antara dua pihak:
  </p>
  <ul>
    <li>
      <strong>Sisi Pencari Kost (Mahasiswa / Pekerja Rantau):</strong> Terjebak dalam <em>The Reality Gap</em>. Foto promosi kamar seringkali menggunakan lensa sudut lebar (*ultra-wide*) yang manipulatif, menutupi fakta bahwa ventilasi udara minim, kasur sempit, atau tidak ada colokan di dekat meja kerja. Survei fisik memakan waktu, tenaga, dan ongkos transport.
      <br><em>Pemicu Pertama:</em> Menemukan tautan kamar dengan <strong>Interactive 2D Architectural Blueprint</strong> yang memperlihatkan skala nyata perabot (kasur 160x200cm, meja kerja, arah bukaan pintu, dan berkas sinar matahari jendela).
    </li>
    <li>
      <strong>Sisi Pemilik Kost (Pengelola / Juragan Kos):</strong> Terbebani <em>Operational Chaos</em>. Catatan sewa masih manual, meteran listrik pascabayar/token sering tekor karena tidak tercatat rapi, dan komplain fasilitas bocor disampaikan via chat WA berceceran.
      <br><em>Pemicu Pertama:</em> Fitur kalkulasi instan meteran kWh listrik dan pembuatan invoice otomatis yang langsung terkirim ke WhatsApp penghuni hanya dalam 1 klik.
    </li>
  </ul>

  <h2>1.2 Nir Eyal's Hook Model (Siklus Keterikatan Dua Sisi)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Fase Hook</th>
        <th style="width: 41%;">Sisi Pencari Kost</th>
        <th style="width: 41%;">Sisi Pemilik Kost</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Trigger</strong></td>
        <td><strong>External:</strong> Tautan kos dari teman/medsos, filter radius kampus.<br><strong>Internal:</strong> Cemas kehabisan kamar dekat kampus, takut tertipu foto palsu.</td>
        <td><strong>External:</strong> Notifikasi jatuh tempo sewa tanggal 1; pengajuan booking baru.<br><strong>Internal:</strong> Khawatir rugi operasional; jengkel menagih manual berulang kali.</td>
      </tr>
      <tr>
        <td><strong>2. Action</strong></td>
        <td>Mengetuk pin kost di peta, membuka <em>Live Blueprint 2D</em>, membandingkan tata letak kamar dalam 1 sentuhan.</td>
        <td>Menginput angka meteran listrik dan mengetuk tombol <em>"Kirim Kwitansi via WhatsApp"</em>.</td>
      </tr>
      <tr>
        <td><strong>3. Variable Reward</strong></td>
        <td>Menemukan kamar impian dengan kepastian dimensi nyata dan fasilitas lengkap; info ketersediaan kamar yang akurat.</td>
        <td>Melihat grafik okupansi kamar hijau 100%, konfirmasi pembayaran sewa masuk tanpa sengketa hitungan listrik.</td>
      </tr>
      <tr>
        <td><strong>4. Investment</strong></td>
        <td>Menyimpan kost ke daftar favorit, mengisi form profil calon penyewa untuk pengajuan sewa cepat.</td>
        <td>Memasukkan master data kamar, scan KTP penghuni, konfigurasi tarif utilitas. Makin banyak data tersimpan, <em>switching cost</em> ke software lain mustahil dilakukan.</td>
      </tr>
    </tbody>
  </table>

  <h2>1.3 Unique Selling Point (USP) vs Kompetitor Sejenis</h2>
  <ul>
    <li><strong>Spatial Blueprint Experience:</strong> Mengganti keraguan foto 2D datar dengan denah SVG arsitektur skala 1:50 interaktif. Calon penghuni dapat memastikan posisi meja belajar dan arah cahaya jendela alami.</li>
    <li><strong>Unified Dual-Sided Platform:</strong> Tidak membutuhkan dua aplikasi terpisah. Portal marketplace pencari kost dan back-office pemilik kost berada dalam satu platform adaptif.</li>
    <li><strong>Local-First & Multi-Device Cloud Sync:</strong> Bekerja super cepat secara offline dengan database lokal, dan dapat disinkronkan ke Supabase Cloud saat dibutuhkan akses multi-perangkat.</li>
    <li><strong>Zero Commission Friction:</strong> Menghubungkan calon penyewa langsung ke WhatsApp pemilik resmi tanpa potongan komisi sewa bulanan yang membebani pemilik.</li>
  </ul>

  <div class="page-break"></div>

  <!-- BAGIAN 2: FITUR UTAMA & CARA KERJANYA -->
  <h1>2. Fitur Utama & Logika Sistem Pemrosesan Data</h1>

  <h2>2.1 Rincian Fitur Inti (Core) & Pendukung (Supporting)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Kategori</th>
        <th style="width: 30%;">Nama Fitur</th>
        <th style="width: 45%;">Fungsi & Nilai Tambah</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="4"><strong>Fitur Inti (Core)</strong></td>
        <td><strong>Interactive 2D Blueprint Engine</strong></td>
        <td>Rendering denah vektor SVG dinamis skala 1:50 (kasur springbed, meja kerja, kamar mandi, jendela cahaya) per tipe kamar.</td>
      </tr>
      <tr>
        <td><strong>Discovery & Filter Marketplace</strong></td>
        <td>Pencarian multi-kriteria: Kota, Gender (Putra/Putri/Campur), Rentang Harga, dan Urutan Rating/Termurah.</td>
      </tr>
      <tr>
        <td><strong>Room & Occupancy Manager</strong></td>
        <td>Visualisasi kartu kamar real-time (Tersedia, Terisi, Perbaikan) dan bulk generator otomatis puluhan kamar.</td>
      </tr>
      <tr>
        <td><strong>Utility Billing & WhatsApp Invoice</strong></td>
        <td>Kalkulasi otomatis biaya listrik (kWh) + air (m³) + sewa pokok, digenerate menjadi kwitansi deep-link WhatsApp.</td>
      </tr>
      <tr>
        <td rowspan="3"><strong>Fitur Pendukung (Supporting)</strong></td>
        <td><strong>3D Blue Hour Facade</strong></td>
        <td>Visualisasi eksterior gedung kos 3D WebGL (Three.js) dengan ornamen arsitektur tropis nusantara (roster dan kisi jati).</td>
      </tr>
      <tr>
        <td><strong>Multiplatform Auto-Updater</strong></td>
        <td>Pengecekan versi server berkala, unduh biner APK mandiri tanpa dialihkan keluar, serta pembersihan cache PWA bersih.</td>
      </tr>
      <tr>
        <td><strong>Linen & Laundry Tracker</strong></td>
        <td>Pelacakan inventaris siklus penggantian dan pencucian seprai kamar kos agar kebersihan terjaga.</td>
      </tr>
    </tbody>
  </table>

  <h2>2.2 Cara Kerja & Formula Pemrosesan Data</h2>
  <div class="callout callout-tip avoid-break">
    <strong>Formula Otomatisasi Tagihan Listrik & Utilitas:</strong>
    <p style="margin-top: 6px; font-family: monospace; font-size: 9pt;">
      1. Pemakaian Listrik = Max(0, Meteran_Akhir_kWh - Meteran_Awal_kWh)<br>
      2. Biaya Listrik = Pemakaian Listrik × Tarif_per_kWh<br>
      3. Total Invoice = Sewa_Pokok + Biaya_Listrik + Biaya_Air + Biaya_Kebersihan<br>
      4. Dispatch Payload: wa.me/{nomor_penghuni}?text=Halo+{Nama},+Tagihan+Kamar+{Nomor}+Bulan+Ini:+Rp{Total}
    </p>
  </div>

  <!-- BAGIAN 3: DESAIN UI/UX & ANATOMI ANTARMUKA -->
  <h1>3. Desain UI/UX & Anatomi Antarmuka</h1>

  <h2>3.1 Struktur Navigasi Adaptif (Mobile vs Desktop)</h2>
  <ul>
    <li><strong>Mobile View (< 960px):</strong> Menggunakan <em>Floating Bottom Navigation</em> dengan padding <code>env(safe-area-inset-bottom)</code> agar mudah dioperasikan satu jempol. Di halaman detail kost terdapat <em>Floating Bottom Booking Bar</em> permanen.</li>
    <li><strong>Desktop View (>= 960px):</strong> Menggunakan <em>Left Fixed Glassmorphic Sidebar</em> yang memuat status koneksi cloud, navigasi modul keuangan, dan tombol unduh aplikasi.</li>
  </ul>

  <h2>3.2 Anatomi Denah 2D Arsitektural (Embedded SVG Scale 1:50)</h2>
  <p>Berikut adalah representasi visual skala denah kamar yang dirender langsung oleh komponen KostKu:</p>

  <div class="blueprint-frame avoid-break">
    <svg width="100%" height="auto" viewBox="0 0 600 280" style="display:block; margin:0 auto; max-width:100%;">
      <defs>
        <pattern id="bpGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(59, 130, 246, 0.15)" stroke-width="0.8" />
        </pattern>
        <pattern id="bpGridMaj" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1.2" />
        </pattern>
      </defs>
      <rect width="600" height="280" fill="#071120" />
      <rect width="600" height="280" fill="url(#bpGrid)" />
      <rect width="600" height="280" fill="url(#bpGridMaj)" />
      
      <!-- Room Outer Walls -->
      <rect x="40" y="30" width="520" height="220" fill="rgba(30, 58, 138, 0.1)" stroke="#60a5fa" stroke-width="3" rx="4" />
      
      <!-- Door Bottom Left -->
      <line x1="100" y1="250" x2="140" y2="250" stroke="#071120" stroke-width="5" />
      <path d="M 100 250 Q 100 210, 140 210" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" />
      <line x1="100" y1="250" x2="100" y2="210" stroke="#38bdf8" stroke-width="2" />
      <text x="90" y="240" fill="#38bdf8" font-size="8" font-weight="bold">PINTU MASUK</text>
      
      <!-- Window Top Right -->
      <line x1="380" y1="30" x2="480" y2="30" stroke="#0284c7" stroke-width="6" />
      <text x="430" y="44" fill="#facc15" font-size="8" font-weight="bold" text-anchor="middle">JENDELA LUAR (CAHAYA MATAHARI)</text>

      <!-- Springbed Center Right -->
      <g transform="translate(370, 70)">
        <rect width="140" height="130" fill="rgba(37, 99, 235, 0.3)" stroke="#3b82f6" stroke-width="1.5" rx="6" />
        <rect x="15" y="8" width="45" height="30" fill="rgba(255,255,255,0.7)" stroke="#60a5fa" rx="3" />
        <rect x="80" y="8" width="45" height="30" fill="rgba(255,255,255,0.7)" stroke="#60a5fa" rx="3" />
        <text x="70" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">KASUR SPRINGBED</text>
        <text x="70" y="105" fill="#bfdbfe" font-size="7.5" text-anchor="middle">160 x 200 cm (Queen Size)</text>
      </g>

      <!-- Work Desk Top Left -->
      <g transform="translate(60, 45)">
        <rect width="120" height="45" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1.5" rx="4" />
        <circle cx="60" cy="62" r="10" fill="rgba(16, 185, 129, 0.4)" stroke="#10b981" />
        <text x="60" y="35" fill="#34d399" font-size="8" font-weight="bold" text-anchor="middle">MEJA KERJA & LAPTOP</text>
      </g>

      <!-- Bathroom Left Center -->
      <g transform="translate(60, 115)">
        <rect width="100" height="85" fill="rgba(14, 165, 233, 0.2)" stroke="#0ea5e9" stroke-width="1.5" rx="4" />
        <circle cx="110" cy="135" r="12" fill="#0284c7" />
        <text x="110" y="138" fill="#ffffff" font-size="6.5" font-weight="bold" text-anchor="middle">CLOSET</text>
        <text x="95" y="180" fill="#7dd3fc" font-size="7.5" font-weight="bold">KAMAR MANDI DALAM</text>
      </g>

      <!-- Stamp Block -->
      <g transform="translate(390, 210)">
        <rect width="160" height="35" fill="rgba(15, 23, 42, 0.9)" stroke="#3b82f6" stroke-width="1" rx="4" />
        <text x="10" y="14" fill="#93c5fd" font-size="7" font-weight="bold" font-family="monospace">DENAH SKALA 1:50 ARCH</text>
        <text x="10" y="27" fill="#ffffff" font-size="8" font-weight="bold">DIMENSI: 4.0m x 4.5m (18 m²)</text>
      </g>
    </svg>
  </div>

  <div class="page-break"></div>

  <!-- BAGIAN 4: STEP-BY-STEP USER JOURNEY & FLOWCHART -->
  <h1>4. Step-by-Step Flowchart & User Journey</h1>

  <h2>4.1 Onboarding sampai Momen Kepuasan Utama (Aha-Moment)</h2>
  <ol>
    <li><strong>Titik Masuk:</strong> Calon penyewa membuka situs web KostKu via tautan WhatsApp atau membuka aplikasi Android.</li>
    <li><strong>Eksplorasi Cepat:</strong> Menggunakan filter kota dan gender kos (misal: "Putri" di "Semarang").</li>
    <li><strong>Pemeriksaan Tata Letak:</strong> Menekan tombol <em>"Pratinjau Denah"</em> pada kartu listing.</li>
    <li><strong>Aha-Moment:</strong> Pengguna melihat langsung denah arsitektur SVG dengan dimensi kasur nyata, posisi jendela luar, dan meja belajar tanpa takut tertipu ilusi sudut foto.</li>
    <li><strong>Konversi Aksi:</strong> Menekan tombol <em>"Ajukan Sewa"</em> atau <em>"Chat WA Pemilik"</em> untuk survei atau booking langsung.</li>
  </ol>

  <h2>4.2 Visualisasi Flowchart Logika Jalur (Mermaid Diagram)</h2>
  <div class="mermaid-box avoid-break">
    <div class="mermaid">
    graph TD
      Start([Mulai: Buka Aplikasi]) --> AuthCheck{Login Sebagai Apa?}
      AuthCheck -- Tamu / Pencari Kost --> SearchMarketplace[Cari & Filter Kost]
      AuthCheck -- Pemilik Kost --> OwnerDash[Dashboard Manajemen]
      
      SearchMarketplace --> ViewBlueprint[Buka Denah 2D Arsitektural]
      ViewBlueprint --> Decision{Tertarik Menyewa?}
      Decision -- Tidak --> SearchMarketplace
      Decision -- Ya --> ApplyBooking[Ajukan Sewa / Chat WhatsApp Pemilik]
      ApplyBooking --> FinishPencari([Selesai: Booking Tercatat])
      
      OwnerDash --> ManageOps{Pilih Modul Operasional}
      ManageOps -- Hitung Utilitas --> InputKwh[Input Meteran Listrik kWh]
      InputKwh --> AutoInvoice[Generate Kwitansi Otomatis]
      AutoInvoice --> SendWA[Kirim Tagihan via WhatsApp]
      SendWA --> FinishOwner([Selesai: Invoice Tersimpan])
      
      ManageOps -- Tangani Komplain --> ResolveComplaint[Update Status: Selesai Diperbaiki]
      ResolveComplaint --> FinishOwner
    </div>
  </div>

  <!-- BAGIAN 5: SEQUENCE DIAGRAM INTERAKSI SISTEM -->
  <h1>5. Sequence Diagram Interaksi Sistem</h1>
  <p>Alur paling krusial: <strong>Pengecekan Pembaruan Otomatis & Distribusi Biner (Auto-Update Check & Binary Dispatch)</strong>.</p>

  <div class="mermaid-box avoid-break">
    <div class="mermaid">
    sequenceDiagram
      autonumber
      actor User as Pengguna (App/PWA)
      participant UI as KostKu Frontend (React)
      participant SW as Service Worker (Cache)
      participant API as Backend (Node Express)
      participant File as File Storage (APK/Binaries)

      User->>UI: Ketuk "Periksa Pembaruan Sekarang"
      UI->>UI: Set checkingUpdate = true (Spin Animasi)
      UI->>API: GET /api/app-version (No-Cache Headers)
      API-->>UI: 200 OK { version: "1.0.3", build: 103, downloadUrls: {...} }
      UI->>UI: isNewerVersion(remote, local)
      
      alt Ada Versi Lebih Baru
        UI->>User: Munculkan AutoUpdateModal (Changelog & Tombol Unduh)
        opt Update di Android APK
          User->>UI: Klik "Unduh & Pasang APK"
          UI->>API: GET /apk (atau /downloads/KostKu-Android.apk)
          API->>File: Read stream KostKu.apk
          File-->>API: Stream bytes
          API-->>User: Kirim APK (MIME: vnd.android.package-archive)
        end
        opt Update di Web PWA
          User->>UI: Klik "Muat Ulang Halaman"
          UI->>SW: postMessage({ type: 'SKIP_WAITING' })
          UI->>SW: unregister()
          UI->>UI: caches.delete(allKeys)
          UI->>User: Reload Halaman dengan cache-buster
        end
      else Versi Sudah Terkini
        UI->>User: Toast "Aplikasi sudah dalam versi terbaru (v1.0.3)"
      end
      UI->>UI: Set checkingUpdate = false
    </div>
  </div>

  <div class="page-break"></div>

  <!-- BAGIAN 6: ANALISIS RETENSI & CELAH PENINGKATAN -->
  <h1>6. Analisis Retensi & Celah Peningkatan</h1>

  <h2>6.1 Faktor Retensi Tinggi (High Stickiness Drivers)</h2>
  <ul>
    <li><strong>High Switching Cost:</strong> Sekali pemilik kost memasukkan data 30 kamar, daftar penghuni, nomor darurat, serta histori meteran listrik, memindahkan data ke sistem lain membutuhkan energi yang terlalu besar.</li>
    <li><strong>Siklus Berulang Bulanan:</strong> Operasional kos memiliki ritme tetap setiap tanggal 25 s.d 5 (pencatatan meteran listrik, penagihan sewa, dan konfirmasi transfer), memastikan aplikasi dibuka minimal 3–5 kali setiap bulan.</li>
    <li><strong>Dokumentasi Bukti Kerusakan:</strong> Modul komplain menjadi arsip resmi saat penghuni mengklaim pengembalian uang jaminan (*deposit refund*).</li>
  </ul>

  <h2>6.2 Identifikasi Celah Friksi & Solusi Senior PM</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Area Friksi</th>
        <th style="width: 35%;">Dampak Pengguna</th>
        <th style="width: 40%;">Rekomendasi Solusi Arsitektural</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Verifikasi Pembayaran Manual</strong></td>
        <td>Pemilik harus mengecek mutasi rekening m-banking satu per satu dan mengubah status invoice secara manual.</td>
        <td>Integrasikan <strong>Payment Gateway QRIS / Virtual Account</strong> (Midtrans / Xendit). Callback webhook otomatis mengubah status menjadi <em>PAID</em>.</td>
      </tr>
      <tr>
        <td><strong>Input Meteran Listrik Berulang</strong></td>
        <td>Pemilik dengan 40+ kamar lelah mengetik form angka satu per satu setiap akhir bulan.</td>
        <td>Sediakan <strong>Batch Quick-Fill Table</strong> dengan navigasi tombol <em>Tab/Enter</em> otomatis ke baris berikutnya, atau opsi import file Excel.</td>
      </tr>
      <tr>
        <td><strong>Peringatan APK Mandiri</strong></td>
        <td>Android memunculkan dialog <em>"File mungkin berbahaya"</em> saat mengunduh APK dari server.</td>
        <td>Rilis APK bertanda tangan resmi (<em>Signed Keystore</em>) ke <strong>Google Play Store Closed Testing</strong> dan lengkapi PWA <em>One-Tap Install</em>.</td>
      </tr>
      <tr>
        <td><strong>Filter Jarak Radius Kampus</strong></td>
        <td>Pengguna belum bisa menyortir kos berdasarkan jarak radius meter ke kampus tujuan.</td>
        <td>Terapkan algoritma <strong>Haversine Distance Formula</strong> di query frontend berdasarkan koordinat latitude/longitude GPS yang sudah ada di database.</td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 7: ANALISIS PASAR & KELAYAKAN BISNIS -->
  <h1>7. Analisis Pasar & Kelayakan Bisnis</h1>

  <h2>7.1 Target Pengguna & Persona Mendalam</h2>
  <div class="persona-container avoid-break">
    <div class="persona-card">
      <div class="persona-header">
        <div class="persona-avatar">AP</div>
        <div>
          <strong style="font-size: 10.5pt; color: #1e1b4b;">Arya Pratama (20 Th)</strong>
          <div style="font-size: 8pt; color: #64748b;">Mahasiswa Rantau Teknik Informatika (Semarang)</div>
        </div>
      </div>
      <p style="font-size: 8.5pt; margin-bottom: 6px;">
        <strong>Demografis:</strong> Gen-Z, uang saku bulanan Rp 1.5jt - Rp 2.5jt, melek teknologi, aktif mobile.
      </p>
      <p style="font-size: 8.5pt; margin-bottom: 6px;">
        <strong>Psikografis:</strong> Menghargai privasi dan kenyamanan belajar, takut tertipu foto kos palsu, gemar membandingkan spesifikasi.
      </p>
      <p style="font-size: 8.5pt; margin-bottom: 0;">
        <strong>Pain Points Utama:</strong> Pernah menyewa kamar yang kasurnya ambles dan tidak ada colokan dekat meja belajar; malas berkeliling survei di bawah terik matahari.
      </p>
    </div>

    <div class="persona-card">
      <div class="persona-header">
        <div class="persona-avatar" style="background:#fef3c7; color:#b45309;">HN</div>
        <div>
          <strong style="font-size: 10.5pt; color: #1e1b4b;">Hj. Nurhayati (54 Th)</strong>
          <div style="font-size: 8pt; color: #64748b;">Pemilik Kos Putri "Graha Barokah" (28 Kamar)</div>
        </div>
      </div>
      <p style="font-size: 8.5pt; margin-bottom: 6px;">
        <strong>Demografis:</strong> Ibu rumah tangga & investor properti kos, menggunakan smartphone Android untuk WhatsApp harian.
      </p>
      <p style="font-size: 8.5pt; margin-bottom: 6px;">
        <strong>Psikografis:</strong> Ingin ketenangan pikiran (*peace of mind*), tidak suka sistem rumit berbayar mahal dengan potongan komisi tinggi.
      </p>
      <p style="font-size: 8.5pt; margin-bottom: 0;">
        <strong>Pain Points Utama:</strong> Pembukuan sewa masih di buku tulis berdebu; sering nombok tagihan listrik PLN karena telat menagih pemakaian anak kos.
      </p>
    </div>
  </div>

  <h2>7.2 Lanskap Kompetitor Head-to-Head & Competitive Moats</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Fitur / Aspek</th>
        <th style="width: 21%; background: #e0e7ff; color: #3730a3;">KostKu</th>
        <th style="width: 21%;">Mamikos</th>
        <th style="width: 20%;">Rukita / Cove</th>
        <th style="width: 20%;">OLX / KostHunter</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Visualisasi Kamar</strong></td>
        <td><strong>Denah 2D SVG Skala 1:50</strong> + 3D Facade</td>
        <td>Foto Standar + 360° Virtual Tour (Terbatas)</td>
        <td>Foto Interior Estetik Kurasi</td>
        <td>Foto Bebas Tanpa Kurasi</td>
      </tr>
      <tr>
        <td><strong>Model Integrasi</strong></td>
        <td><strong>Marketplace + SaaS Pemilik Terpadu</strong></td>
        <td>Marketplace + Singgahsini Operator</td>
        <td>Full Property Operator Co-Living</td>
        <td>Hanya Papan Iklan Baris Terbuka</td>
      </tr>
      <tr>
        <td><strong>Skema Komisi</strong></td>
        <td><strong>0% Komisi Transaksi</strong></td>
        <td>5% – 12% Komisi Booking</td>
        <td>Revenue Share Operator 20%–30%</td>
        <td>Gratis / Biaya Iklan Sundul</td>
      </tr>
      <tr>
        <td><strong>Pencatatan Utilitas</strong></td>
        <td><strong>Kalkulator Otomatis Listrik kWh & Air</strong></td>
        <td>Manual / Tagihan Gabungan</td>
        <td>Termasuk di Harga Sewa (Flat)</td>
        <td>Tidak Ada Fitur Manajemen</td>
      </tr>
      <tr>
        <td><strong>Kedaulatan Data</strong></td>
        <td><strong>Local-First + Cloud Sync</strong></td>
        <td>100% Closed Cloud Terpusat</td>
        <td>Internal Enterprise Cloud</td>
        <td>Tidak Menyimpan Data Sewa</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-success avoid-break">
    <strong style="color: #065f46;">4 Parit Pertahanan Kompetitif (Competitive Moats KostKu):</strong>
    <ol style="margin-top: 6px; font-size: 9pt; margin-bottom: 0;">
      <li><strong>Architectural Spatial Transparency:</strong> Denah interaktif memangkas rasio pembatalan survei hingga 60%.</li>
      <li><strong>Zero-Commission Loyalty:</strong> Pemilik kos menolak pindah ke platform yang memotong 5-10% dari omzet bulanan mereka.</li>
      <li><strong>Unified Two-Sided Platform:</strong> Membina ekosistem mandiri tanpa memerlukan dua aplikasi terpisah yang membingungkan.</li>
      <li><strong>Lightweight Multiplatform Engine:</strong> Aplikasi dapat dijalankan di web murah, Android hemat memori, dan desktop tanpa lag.</li>
    </ol>
  </div>

  <div class="page-break"></div>

  <h2>7.3 Model Bisnis, Monetisasi & Kelayakan Finansial</h2>
  <p>KostKu menerapkan strategi monetisasi berbasis volume dan utilitas nyata tanpa membebankan potongan komisi sewa:</p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Aliran Pendapatan</th>
        <th style="width: 35%;">Skema & Harga</th>
        <th style="width: 40%;">Analisis Kelayakan & Rasionalitas Pasar</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Freemium SaaS (Pemilik Kost)</strong></td>
        <td>
          • <strong>Free Tier:</strong> Hingga 5 kamar gratis selamanya.<br>
          • <strong>Starter:</strong> Rp 49.000 / bulan (6–20 kamar).<br>
          • <strong>Pro Business:</strong> Rp 99.000 / bulan (> 20 kamar + multi-gedung).
        </td>
        <td>
          <strong>Sangat Rasional.</strong> Pemilik kos dengan 15 kamar beromzet Rp 15jt - Rp 30jt/bulan hanya membayar Rp 49.000 (< 0.3% omzet). Jauh lebih murah daripada komisi kompetitor yang memotong Rp 1.5jt/bulan.
        </td>
      </tr>
      <tr>
        <td><strong>2. Featured Listing & Verified Badge</strong></td>
        <td>
          • <strong>Spotlight Kota:</strong> Rp 25.000 / minggu.<br>
          • <strong>Badge Terverifikasi Denah:</strong> Rp 50.000 / tahun (termasuk verifikasi denah arsitektur).
        </td>
        <td>
          Pemilik bersedia membayar biaya promosi kecil saat ada kamar kosong agar cepat terisi oleh mahasiswa baru di musim ajaran baru.
        </td>
      </tr>
      <tr>
        <td><strong>3. Fee Transaksi Payment Gateway</strong></td>
        <td>
          • Biaya administrasi Rp 2.500 per transaksi QRIS / Virtual Account (dibebankan ke penyewa).
        </td>
        <td>
          Sesuai standar industri perbankan nasional. Memberikan kemudahan bagi mahasiswa yang tidak memiliki rekening bank lokal yang sama.
        </td>
      </tr>
    </tbody>
  </table>

  <h2>7.4 Go-to-Market (GTM) Strategy & Taktik Akuisisi</h2>
  <ul>
    <li>
      <strong>Fase 1: Campus-Cluster Hyperlocal Attack (Bulan 1–2):</strong>
      <br>Fokus pada 1–2 kluster kampus dengan kepadatan kos tinggi (misal: kawasan Tembalang UNDIP atau Nakula UDINUS Semarang). Melakukan pemetaan denah kamar secara langsung untuk 50 kos pertama secara gratis sebagai katalog demo unggulan.
    </li>
    <li>
      <strong>Fase 2: Paguyuban Juragan Kost & Edukasi Door-to-Door (Bulan 3–4):</strong>
      <br>Mengadakan workshop santai di balai warga atau grup WhatsApp paguyuban kos lokal dengan tajuk: <em>"Cara Praktis Menghitung Meteran Listrik Kamar & Kwitansi WhatsApp Otomatis"</em>. Menawarkan instalasi gratis aplikasi ke HP pemilik kos.
    </li>
    <li>
      <strong>Fase 3: Viral Loop Mahasiswa & Program Cashback Listrik (Bulan 5–6):</strong>
      <br>Menyediakan program referral: Anak kos yang berhasil mengajak temannya memesan kamar via KostKu mendapatkan token subsidi listrik Rp 25.000, menciptakan efek jaringan (*network effect*) organik dari mulut ke mulut.
    </li>
  </ul>

  <!-- BAGIAN 8: BLUEPRINT PEMBAGIAN TUGAS TIM -->
  <h1>8. Blueprint Pembagian Tugas Tim (RACI Matrix & Roadmap)</h1>

  <h2>8.1 Matriks RACI Tim Pengembang</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 32%;">Modul Proyek</th>
        <th style="width: 17%;">Frontend Dev</th>
        <th style="width: 17%;">Backend Dev</th>
        <th style="width: 17%;">UI/UX Designer</th>
        <th style="width: 17%;">QA & Mobile Lead</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>UI Slicing & Responsive Layout</td>
        <td><span class="badge badge-green">R (Responsible)</span></td>
        <td>I (Informed)</td>
        <td><span class="badge badge-blue">A (Accountable)</span></td>
        <td>C (Consulted)</td>
      </tr>
      <tr>
        <td>Interactive 2D Blueprint SVG Engine</td>
        <td><span class="badge badge-green">R</span></td>
        <td>C</td>
        <td><span class="badge badge-blue">A</span></td>
        <td>C</td>
      </tr>
      <tr>
        <td>REST API & Structured Database Schema</td>
        <td>C</td>
        <td><span class="badge badge-green">R / A</span></td>
        <td>I</td>
        <td>C</td>
      </tr>
      <tr>
        <td>Cloud Sync Supabase & Google Auth</td>
        <td>C</td>
        <td><span class="badge badge-green">R / A</span></td>
        <td>I</td>
        <td>C</td>
      </tr>
      <tr>
        <td>Capacitor Android Build & Auto-Updater</td>
        <td>C</td>
        <td>C</td>
        <td>I</td>
        <td><span class="badge badge-green">R / A</span></td>
      </tr>
      <tr>
        <td>User Acceptance Testing & Laporan SRS</td>
        <td>C</td>
        <td>C</td>
        <td>C</td>
        <td><span class="badge badge-green">R / A</span></td>
      </tr>
    </tbody>
  </table>
  <p style="font-size: 8pt; color: #64748b; margin-top: 4px;">
    <em>Keterangan RACI: <strong>R</strong> = Pelaksana Utama, <strong>A</strong> = Penanggung Jawab Kualitas & Kelulusan, <strong>C</strong> = Tempat Konsultasi Teknis, <strong>I</strong> = Penerima Laporan Progres.</em>
  </p>

  <h2>8.2 Roadmap Pelaksanaan 4 Minggu (Sprint Schedule)</h2>
  <ul>
    <li><strong>Minggu 1 (Sprint 1 - Foundation & Architecture):</strong> Finalisasi skema database <code>db.json</code>, desain wireframe Figma, dan setup project Vite + React + Tailwind.</li>
    <li><strong>Minggu 2 (Sprint 2 - Core Engine & Interactivity):</strong> Pembuatan komponen <code>RoomBlueprintSvg</code> 2D, integrasi endpoint <code>/api/kosts</code>, dan kalkulator utilitas kWh.</li>
    <li><strong>Minggu 3 (Sprint 3 - Multiplatform & Cloud Integration):</strong> Setup sinkronisasi Supabase, konfigurasi Google OAuth, serta build APK Android dengan Capacitor.</li>
    <li><strong>Minggu 4 (Sprint 4 - In-App Updater, Testing & GTM):</strong> Uji coba Service Worker PWA, validasi unduhan biner APK tanpa bug, dan penyusunan proposal bisnis.</li>
  </ul>

  <div class="footer">
    <span>KostKu Ecosystem &bull; Dokumen Spesifikasi Produk & Arsitektur Bisnis</span>
    <span>Halaman Resmi Blueprint &bull; Dicetak Otomatis</span>
  </div>

</body>
</html>`;

const outputHtmlPath = path.join(__dirname, 'blueprint_render.html');
const outputPdfPath = path.join(__dirname, 'KostKu_Product_and_Business_Blueprint.pdf');
const brainPdfPath = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc/KostKu_Product_and_Business_Blueprint.pdf';
const distBinariesPdfPath = path.join(__dirname, 'dist-binaries', 'KostKu_Product_and_Business_Blueprint.pdf');

fs.writeFileSync(outputHtmlPath, htmlContent);
console.log('HTML written to:', outputHtmlPath);

// Compile to PDF via Google Chrome Headless with Virtual Time Budget for Mermaid Rendering
const chromeCmd = `google-chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer --virtual-time-budget=9000 --print-to-pdf="${outputPdfPath}" "${outputHtmlPath}"`;
console.log('Executing Chrome PDF generation...');
execSync(chromeCmd, { stdio: 'inherit' });

console.log('PDF generated at:', outputPdfPath);
const stat = fs.statSync(outputPdfPath);
console.log('PDF Size:', (stat.size / 1024).toFixed(1), 'KB');

// Copy to brain artifact directory and dist-binaries
fs.copyFileSync(outputPdfPath, brainPdfPath);
console.log('Copied to Brain Artifacts:', brainPdfPath);

if (!fs.existsSync(path.join(__dirname, 'dist-binaries'))) {
  fs.mkdirSync(path.join(__dirname, 'dist-binaries'), { recursive: true });
}
fs.copyFileSync(outputPdfPath, distBinariesPdfPath);
console.log('Copied to Dist-Binaries:', distBinariesPdfPath);
