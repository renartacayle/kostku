---
marp: true
theme: uncover
paginate: true
header: 'KostKu — Master SKPL Presentation'
footer: 'S1 Teknik Informatika UDINUS • 2026'
style: |
  :root {
    --primary: #1e3a8a;
    --primary-light: #2563eb;
    --accent: #0d9488;
    --bg-dark: #0a1628;
    --text-dark: #0f172a;
    --text-muted: #475569;
    --card-bg: #f8fafc;
    --border: #e2e8f0;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  }
  section {
    background: #ffffff;
    color: var(--text-dark);
    font-size: 18px;
    padding: 36px 48px;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  section.lead {
    background: linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%);
    color: #ffffff;
    justify-content: center;
    text-align: center;
  }
  h1 {
    font-size: 32px;
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  section.lead h1 {
    color: #ffffff;
    font-size: 42px;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: var(--primary-light);
    margin-bottom: 14px;
  }
  p {
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-muted);
    margin-bottom: 12px;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 10px;
  }
  .bento-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 10px;
  }
  .bento-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
  }
  .bento-card h3 {
    font-size: 16px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 6px;
  }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-user {
    background: #e0e7ff;
    color: #3730a3;
  }
  .badge-dev {
    background: #ccfbf1;
    color: #115e59;
  }
  .badge-green {
    background: #dcfce7;
    color: #15803d;
  }
  .badge-amber {
    background: #fef3c7;
    color: #b45309;
  }
  .badge-rose {
    background: #fee2e2;
    color: #b91c1c;
  }
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    background: #e2e8f0;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
  }
---

<!-- Slide 1: Cover Presentation -->
<!-- _class: lead -->

![width:90px](assets/udinus_logo.jpeg)

# KOSTKU PLATFORM
### Spesifikasi Kebutuhan Perangkat Lunak (SKPL)
**Smart Boarding & Hyperlocal Co-Living Ecosystem**

<p style="color: #94a3b8; font-size: 15px; margin-top: 20px;">
  Program Studi S1 Teknik Informatika, Fakultas Ilmu Komputer, Universitas Dian Nuswantoro (UDINUS)<br>
  <strong>Tim Penyusun:</strong> Oscar Herdian Wijaya (16309) • Yohanes Aryo Suryo (16479) • M. Mirza Fadilah (16354)
</p>

<span class="badge" style="background: rgba(255,255,255,0.15); color: #fff;">Versi Dokumen: 2.0 (Revisi G Final)</span>

<!--
Speaker Notes:
- Selamat pagi/siang dosen penguji dan rekan-rekan.
- Kami mempresentasikan Master SKPL KostKu yang merangkum aspek kebutuhan pengguna dan arsitektur pengembang dalam satu kesatuan sistem.
-->

---

<!-- Slide 2: Agenda & Navigasi Deck -->
# Agenda & Struktur Pembahasan

Presentasi ini membagi spesifikasi kebutuhan menjadi dua jalur terintegrasi:

<div class="bento-grid">
  <div class="bento-card" style="border-left: 4px solid #2563eb;">
    <span class="badge badge-user">Track 1: User & Bisnis</span>
    <h3 style="margin-top: 8px;">Pengalaman Pengguna & Solusi</h3>
    <ul style="font-size: 14px; padding-left: 18px; color: #475569;">
      <li>Problem statement & nilai unggulan</li>
      <li>Alur booking & pembayaran QRIS real-time</li>
      <li>Manajemen utilitas 3-jalur (air & listrik)</li>
      <li>Ekosistem UMKM hyperlocal sekitar kos</li>
      <li>Legalitas kontrak digital & tiket komplain</li>
    </ul>
  </div>
  <div class="bento-card" style="border-left: 4px solid #0d9488;">
    <span class="badge badge-dev">Track 2: Developer & QA</span>
    <h3 style="margin-top: 8px;">Arsitektur & Rekayasa Sistem</h3>
    <ul style="font-size: 14px; padding-left: 18px; color: #475569;">
      <li>Arsitektur monorepo multi-platform (Web/APK/Desktop)</li>
      <li>Diagram Konteks, DFD Level 1 & Level 2</li>
      <li>Skema basis data relasional 9 entitas & ERD</li>
      <li>Validasi keamanan NIK 16 digit & ErrorBoundary</li>
      <li>Matriks evolusi fitur & verifikasi unlazy QA</li>
    </ul>
  </div>
</div>

<!--
Speaker Notes:
- Struktur presentasi sengaja kami pisahkan secara berimbang agar dosen penguji dapat melihat nilai fungsional nyata bagi pengguna sekaligus ketelitian rekayasa di balik layar.
-->

---

<!-- Slide 3: Problem Statement -->
<span class="badge badge-user">Track User</span>
# Problem Statement: Dilema Ekosistem Kost

Permasalahan mendasar pada manajemen dan pencarian indekos konvensional di Indonesia:

<div class="bento-grid-3">
  <div class="bento-card">
    <h3 style="color: #b91c1c;">Bagi Pencari Kos</h3>
    <p style="font-size: 13.5px;">Foto kamar sering menipu (*clickbait*), ketiadaan rincian meteran listrik, serta maraknya akun penipu meminta transfer uang muka tanpa verifikasi.</p>
  </div>
  <div class="bento-card">
    <h3 style="color: #b45309;">Bagi Pemilik Kos</h3>
    <p style="font-size: 13.5px;">Platform marketplace memotong komisi sewa 10%-20%, pembukuan kas masih manual di buku tulis, serta perselisihan kwh listrik antar-kamar.</p>
  </div>
  <div class="bento-card">
    <h3 style="color: #475569;">Bagi Warga Sekitar</h3>
    <p style="font-size: 13.5px;">UMKM laundry, katering, dan warung galon sekitar indekos tidak memiliki akses digital langsung untuk melayani ratusan anak kos.</p>
  </div>
</div>

<!--
Speaker Notes:
- Tiga masalah ini menjadi landasan mengapa platform KostKu diciptakan: bukan sekadar katalog kos biasa, melainkan ekosistem co-living terpadu.
-->

---

<!-- Slide 4: Nilai Unggulan KostKu -->
<span class="badge badge-user">Track User</span>
# Nilai Unggulan: Zero-Extraction PropTech

KostKu menolak model ekstraktif platform tradisional dengan tiga pilar filosofi:

<div class="bento-grid-3">
  <div class="bento-card" style="border-top: 4px solid #10b981;">
    <span class="badge badge-green">0% Komisi Booking</span>
    <h3 style="margin-top: 8px;">Bagi Pemilik Kos</h3>
    <p style="font-size: 13px;">Uang sewa bulanan 100% diterima penuh oleh pemilik kost tanpa potongan persentase seumur hidup.</p>
  </div>
  <div class="bento-card" style="border-top: 4px solid #f59e0b;">
    <span class="badge badge-amber">Sundul Kost Terjangkau</span>
    <h3 style="margin-top: 8px;">Promosi Berkeadilan</h3>
    <p style="font-size: 13px;">Hanya pemilik dengan kamar kosong yang membayar slot prioritas sebesar Rp 5.000 / 24 jam penayangan.</p>
  </div>
  <div class="bento-card" style="border-top: 4px solid #2563eb;">
    <span class="badge badge-user">Hyperlocal UMKM</span>
    <h3 style="margin-top: 8px;">Kemitraan Warga</h3>
    <p style="font-size: 13px;">Pemesanan laundry dan katering langsung antar ke kamar dengan fee administrasi tetap hanya <strong>Rp 500</strong>.</p>
  </div>
</div>

<!--
Speaker Notes:
- Model bisnis ini menutup biaya aktif API dan hosting tanpa membebani pemilik kos secara berlebihan.
-->

---

<!-- Slide 5: User Flow 1 - Booking & 3D Discovery -->
<span class="badge badge-user">Track User</span>
# Alur Pengguna: Eksplorasi 3D & Sewa Kamar

Pencarian interaktif hingga persetujuan kamar tanpa risiko penipuan:

<div class="bento-grid">
  <div class="bento-card">
    <h3>1. Eksplorasi Visual & GIS</h3>
    <p style="font-size: 13.5px;">Calon penyewa melihat fasad 3D WebGL bangunan kos, scrubbing video interior 60 FPS, serta radius kampus via peta interaktif Leaflet.</p>
  </div>
  <div class="bento-card">
    <h3>2. Pengajuan Sewa Berkas Asli</h3>
    <p style="font-size: 13.5px;">Mengisi durasi sewa, tanggal check-in, dan data identitas NIK yang tervalidasi 1 KTP 1 Akun.</p>
  </div>
  <div class="bento-card">
    <h3>3. Notifikasi Pemilik Kos</h3>
    <p style="font-size: 13.5px;">Pemilik meninjau permohonan melalui dashboard properti dan memilih tindakan: <em>Setujui</em> atau <em>Tolak</em>.</p>
  </div>
  <div class="bento-card">
    <h3>4. Kunci Ketersediaan Kamar</h3>
    <p style="font-size: 13.5px;">Saat permohonan disetujui, unit kamar otomatis berubah menjadi <code>occupied</code>, mencegah <em>double booking</em>.</p>
  </div>
</div>

<!--
Speaker Notes:
- Sistem simetri status kamar memastikan keandalan inventaris secara real-time.
-->

---

<!-- Slide 6: User Flow 2 - Pembayaran QRIS & E-Receipt -->
<span class="badge badge-user">Track User</span>
# Transaksi Real-Time: Pembayaran QRIS Terverifikasi

Menghilangkan transfer manual dan struk fisik yang rentan hilang:

<div class="bento-grid">
  <div class="bento-card">
    <h3>Penerbitan Invoice Digital</h3>
    <p style="font-size: 13.5px;">Sistem mengkalkulasi tarif pokok sewa kamar, selisih meteran utilitas, dan biaya deposit awal secara transparan.</p>
  </div>
  <div class="bento-card">
    <h3>Pembayaran QRIS Nasional</h3>
    <p style="font-size: 13.5px;">Penghuni memindai barcode QRIS resmi perbankan melalui aplikasi mobile banking atau e-wallet apa pun.</p>
  </div>
  <div class="bento-card">
    <h3>Settlement Otomatis</h3>
    <p style="font-size: 13.5px;">Saat dana terverifikasi, status tagihan seketika berubah menjadi <code>paid</code> dan dicatat ke arus kas masuk.</p>
  </div>
  <div class="bento-card">
    <h3>Automated E-Receipt & Token</h3>
    <p style="font-size: 13.5px;">Kuitansi resmi ber-nomor resi dikirim otomatis ke email penyewa via Nodemailer dan token listrik kamar aktif.</p>
  </div>
</div>

<!--
Speaker Notes:
- Menggantikan simulator fiktif versi awal dengan verifikasi payment gateway nyata.
-->

---

<!-- Slide 7: User Flow 3 - Utilitas 3-Jalur -->
<span class="badge badge-user">Track User</span>
# Transparansi: Skema Utilitas 3-Jalur

Solusi tuntas perselisihan tagihan listrik & air antar-penghuni kos:

<div class="bento-grid-3">
  <div class="bento-card">
    <span class="badge badge-green">Skema 1: All-Kost</span>
    <h3 style="margin-top: 6px;">Bebas Biaya</h3>
    <p style="font-size: 13px;">Listrik dan air PDAM ditanggung penuh pemilik kost, sudah termasuk dalam tarif kamar bulanan.</p>
  </div>
  <div class="bento-card">
    <span class="badge badge-amber">Skema 2: Mandiri</span>
    <h3 style="margin-top: 6px;">Tagihan Terpisah</h3>
    <p style="font-size: 13px;">Penyewa membayar sendiri kwh listrik prabayar (token PLN) dan air sesuai angka meteran fisik.</p>
  </div>
  <div class="bento-card">
    <span class="badge badge-user">Skema 3: Parsial</span>
    <h3 style="margin-top: 6px;">Kombinasi Adil</h3>
    <p style="font-size: 13px;">Listrik kamar mandiri melalui meteran individual, sedangkan air bersih ditanggung pemilik fasilitas.</p>
  </div>
</div>

<p style="font-size: 13px; margin-top: 14px; color: #64748b;">
  *Staf operasional kos cukup menginput angka meteran fisik awal bulan melalui aplikasi mobile, sistem menghitung selisih tagihan otomatis.
</p>

<!--
Speaker Notes:
- Opsi ini fleksibel untuk berbagai tipe kost: dari kost mahasiswa ekonomis hingga kost eksekutif.
-->

---

<!-- Slide 8: User Flow 4 - Mitra Hyperlocal -->
<span class="badge badge-user">Track User</span>
# Pemberdayaan Warga: Mitra Hyperlocal Flat Rp 500

Menghubungkan penghuni kost dengan ekosistem UMKM sekitar secara adil:

<div class="bento-grid">
  <div class="bento-card">
    <h3>Katalog Bersyarat Radius</h3>
    <p style="font-size: 13.5px;">Menu layanan laundry dan katering hanya muncul jika ada mitra UMKM aktif di sekitar indekos.</p>
  </div>
  <div class="bento-card">
    <h3>Kebebasan Memilih Layanan</h3>
    <p style="font-size: 13.5px;">Penghuni bebas membandingkan harga antar-mitra (contoh: paket kilat 1 hari vs reguler hemat).</p>
  </div>
  <div class="bento-card">
    <h3>Biaya Mikro Terjangkau: Rp 500</h3>
    <p style="font-size: 13.5px;">Fee platform dipatok flat tepat <strong>Rp 500</strong> per transaksi, bukan potongan persentase yang mencekik mitra.</p>
  </div>
  <div class="bento-card">
    <h3>Antar Langsung ke Pintu Kamar</h3>
    <p style="font-size: 13.5px;">Notifikasi pesanan diteruskan langsung ke WhatsApp mitra disertai nomor kamar tujuan pengantaran.</p>
  </div>
</div>

<!--
Speaker Notes:
- Ini menjawab langsung permintaan user mengenai integrasi UMKM dan batasan komisi maksimal 500 perak.
-->

---

<!-- Slide 9: User Flow 5 - Kontrak & Komplain -->
<span class="badge badge-user">Track User</span>
# Keamanan Hunian: E-Signature & Tiket Komplain

Pengelolaan operasional harian yang tertib dan berpayung hukum:

<div class="bento-grid">
  <div class="bento-card">
    <h3>E-Signature Kontrak Digital</h3>
    <p style="font-size: 13.5px;">Penghuni membubuhkan tanda tangan elektronik di layar sentuh gawai untuk perjanjian sewa sah tanpa cetak kertas.</p>
  </div>
  <div class="bento-card">
    <h3>Tiket Komplain Disertai Foto</h3>
    <p style="font-size: 13.5px;">Laporan kerusakan AC, kran bocor, atau wifi mati dikirim langsung dengan bukti foto kamera ponsel.</p>
  </div>
  <div class="bento-card">
    <h3>Pelacakan Siklus 3-Tahap</h3>
    <p style="font-size: 13.5px;">Status tiket transparan: <span class="badge badge-amber">Diajukan</span> → <span class="badge badge-user">Diproses</span> → <span class="badge badge-green">Selesai</span>.</p>
  </div>
  <div class="bento-card">
    <h3>Audit Jejak Aktivitas Kos</h3>
    <p style="font-size: 13.5px;">Setiap tindak lanjut keluhan dan pergantian barang tercatat dalam buku log aktivitas digital properti.</p>
  </div>
</div>

<!--
Speaker Notes:
- Memberikan kenyamanan bagi penghuni dan akuntabilitas bagi pemilik kost.
-->

---

<!-- Slide 10: Jembatan Kebutuhan ke Arsitektur -->
<!-- _class: lead -->

<span class="badge" style="background: rgba(255,255,255,0.2); color: #fff;">Jembatan Rekayasa</span>
# DARI USER EXPERIENCE KE ARSITEKTUR SOFTWARE
### Bagaimana Kebutuhan Fungsional Diterjemahkan ke Kode & Basis Data

<p style="max-width: 750px; margin: 20px auto 0 auto; color: #cbd5e1; font-size: 16px;">
  Bagian selanjutnya membedah lapisan teknis yang menjamin performa 60 FPS, keamanan NIK 1 KTP, integritas 9 entitas basis data, dan ketiadaan galat runtime.
</p>

<!--
Speaker Notes:
- Transisi dari perspektif bisnis/user ke perspektif teknik informatika murni.
-->

---

<!-- Slide 11: Arsitektur Monorepo Multi-Platform -->
<span class="badge badge-dev">Track Developer</span>
# Arsitektur Monorepo Multi-Platform

Satu basis kode terintegrasi untuk Web, Mobile Android, dan Desktop:

<div class="bento-grid">
  <div class="bento-card">
    <h3>Front-End: React 18 + Vite 5</h3>
    <p style="font-size: 13px;">Single Page Application modular dengan HMR kilat, declarative router v6, context state management, dan CSS Tailwind.</p>
  </div>
  <div class="bento-card">
    <h3>Back-End: Node.js + Express API</h3>
    <p style="font-size: 13px;">REST core menyediakan 10+ controller, middleware CORS, session auth guard, dan generator e-receipt Nodemailer.</p>
  </div>
  <div class="bento-card">
    <h3>Mobile: Capacitor v8 Native APK</h3>
    <p style="font-size: 13px;"><code>BridgeActivity.java</code> mengemas aset web ke APK Android native dengan akses kamera & hardware GPS.</p>
  </div>
  <div class="bento-card">
    <h3>Desktop: Electron v44 Runtime</h3>
    <p style="font-size: 13px;"><code>main.cjs</code> mengelola window OS desktop dan dikemas menjadi installer <code>.exe</code> NSIS / AppImage.</p>
  </div>
</div>

<!--
Speaker Notes:
- Pendekatan multi-platform menghemat waktu pengembangan dan menjamin konsistensi fitur lintas gawai.
-->

---

<!-- Slide 12: Diagram Konteks & DFD Level 1 -->
<span class="badge badge-dev">Track Developer</span>
# Aliran Data Sistem: Konteks & DFD Level 1

Struktur aliran data terpetakan jelas antara entitas eksternal dan penyimpanan:

<div class="bento-grid">
  <div class="bento-card">
    <h3>Diagram Konteks (Level 0)</h3>
    <p style="font-size: 13px;">Membatasi sistem terhadap <strong>7 Entitas Eksternal</strong>: Pencari Kos, Penghuni, Pemilik, Staf, Mitra UMKM, Payment Gateway QRIS, dan WhatsApp Gateway.</p>
  </div>
  <div class="bento-card">
    <h3>DFD Level 1: 6 Proses Utama</h3>
    <p style="font-size: 13px;">
      1.0 Autentikasi NIK 1 KTP<br>
      2.0 Eksplorasi Visual & GIS<br>
      3.0 Siklus Sewa & Approval<br>
      4.0 Tagihan & QRIS Settlement<br>
      5.0 Operasional & Komplain<br>
      6.0 Sundul Kost & Mitra UMKM
    </p>
  </div>
</div>

<p style="font-size: 13px; margin-top: 14px; color: #64748b;">
  *Didukung 7 Data Store terstruktur: <code>D1: Users</code>, <code>D2: Kosts</code>, <code>D3: Applications</code>, <code>D4: Invoices</code>, <code>D5: Complaints</code>, <code>D6: Merchants & Orders</code>, <code>D7: Activities</code>.
</p>

<!--
Speaker Notes:
- Seluruh DFD terbebas dari black hole dan miracle store, memenuhi kaidah perancangan terstruktur.
-->

---

<!-- Slide 13: DFD Level 2 - Kamar & Transaksi -->
<span class="badge badge-dev">Track Developer</span>
# Dekomposisi Fungsional: DFD Level 2

Rincian proses mikro pada modul paling krusial:

<div class="bento-grid">
  <div class="bento-card">
    <h3>DFD 2.0: Manajemen Kamar & Properti</h3>
    <ul style="font-size: 13px; padding-left: 18px; color: #475569;">
      <li><code>2.1</code> Registrasi master data kos & koordinat GPS</li>
      <li><code>2.2</code> Pemetaan unit kamar & tarif bulanan dasar</li>
      <li><code>2.3</code> Konfigurasi pembebanan skema 3-jalur utilitas</li>
      <li><code>2.4</code> Sinkronisasi status okupansi (available/occupied)</li>
    </ul>
  </div>
  <div class="bento-card">
    <h3>DFD 4.0 & 6.0: Transaksi & Kemitraan</h3>
    <ul style="font-size: 13px; padding-left: 18px; color: #475569;">
      <li><code>4.1</code> Kalkulasi tagihan sewa & utilitas</li>
      <li><code>4.2</code> Verifikasi settlement QRIS real-time</li>
      <li><code>4.3</code> Pembuatan kuitansi digital e-receipt</li>
      <li><code>6.1</code> Pilihan katalog hyperlocal mitra UMKM</li>
      <li><code>6.2</code> Perhitungan subtotal + fee mikro Rp 500</li>
    </ul>
  </div>
</div>

<!--
Speaker Notes:
- Dekomposisi level 2 membuktikan tidak ada proses bisnis yang tersembunyi tanpa spesifikasi.
-->

---

<!-- Slide 14: Desain Basis Data - 9 Entitas -->
<span class="badge badge-dev">Track Developer</span>
# Skema Basis Data: 9 Entitas & ERD Relasional

Penyimpanan atomic JSON document store berstruktur relasi yang ketat:

<div class="bento-grid-3">
  <div class="bento-card">
    <h3 style="font-size: 14px;">Identitas & Akun</h3>
    <p style="font-size: 12.5px;"><code>USERS</code><br>id, name, email, phone, nik (16-char), password, role, kostUid, kamar.</p>
  </div>
  <div class="bento-card">
    <h3 style="font-size: 14px;">Properti & Unit</h3>
    <p style="font-size: 12.5px;"><code>KOSTS</code> & <code>ROOMS</code><br>uid, ownerId, location {lat, lng}, utilityScheme, floor, status, electricMeterLast.</p>
  </div>
  <div class="bento-card">
    <h3 style="font-size: 14px;">Sewa & Kontrak</h3>
    <p style="font-size: 12.5px;"><code>APPLICATIONS</code><br>id, kostUid, userId, duration, checkInDate, status: pending/approved/rejected.</p>
  </div>
  <div class="bento-card">
    <h3 style="font-size: 14px;">Finansial & Tagihan</h3>
    <p style="font-size: 12.5px;"><code>INVOICES</code><br>id, kostUid, userId, basePrice, waterCost, electricityCost, total, status, receiptNumber.</p>
  </div>
  <div class="bento-card">
    <h3 style="font-size: 14px;">Fasilitas & Keluhan</h3>
    <p style="font-size: 12.5px;"><code>COMPLAINTS</code><br>id, kostUid, userId, category, title, description, photoUrl, status: diajukan/proses/selesai.</p>
  </div>
  <div class="bento-card">
    <h3 style="font-size: 14px;">Ekosistem UMKM</h3>
    <p style="font-size: 12.5px;"><code>MERCHANTS</code> & <code>ORDERS</code><br>menuItems, subtotal, adminFee (Rp 500), tenantId, merchantId, status pengantaran.</p>
  </div>
</div>

<!--
Speaker Notes:
- Seluruh entitas terisolasi per tenant via kostUid dan ownerId untuk keamanan multi-kost.
-->

---

<!-- Slide 15: Keamanan & Integritas Data -->
<span class="badge badge-dev">Track Developer</span>
# Keamanan & Integritas: 1 KTP 1 Akun NIK 16 Digit

Mencegah akun palsu, multi-akun nakal, dan kebocoran otorisasi:

<div class="bento-grid">
  <div class="bento-card">
    <h3>Validasi Matematika NIK 16 Digit</h3>
    <p style="font-size: 13.5px;">Setiap pendaftar wajib menginput NIK 16 digit yang divalidasi struktur kode wilayah dan tanggal lahirnya. 1 NIK hanya boleh terikat pada 1 akun aktif.</p>
  </div>
  <div class="bento-card">
    <h3>Hash Sandi & Token Sesi</h3>
    <p style="font-size: 13.5px;">Kata sandi disimpan dalam bentuk hash terenkripsi, sesi pengguna divalidasi melalui token peran (<code>owner</code>, <code>user</code>, <code>staff</code>, <code>master</code>).</p>
  </div>
  <div class="bento-card">
    <h3>Isolasi Multi-Tenant</h3>
    <p style="font-size: 13.5px;">Pemilik kost hanya dapat mengakses dan memodifikasi data properti yang cocok dengan <code>ownerId</code> miliknya via switcher multi-kost.</p>
  </div>
  <div class="bento-card">
    <h3>Audit Trail Activities</h3>
    <p style="font-size: 13.5px;">Koleksi <code>ACTIVITIES</code> merekam setiap penambahan kamar, perubahan harga, pembayaran, dan komplain demi transparansi hukum.</p>
  </div>
</div>

<!--
Speaker Notes:
- Aturan NIK 16 digit terbukti efektif mengeliminasi akun booking fiktif yang merugikan pemilik kost.
-->

---

<!-- Slide 16: Resiliensi Front-End & Performa -->
<span class="badge badge-dev">Track Developer</span>
# Resiliensi Front-End & Optimasi Performa

Stabilitas antarmuka berkecepatan tinggi tanpa layar putih (*blank screen*):

<div class="bento-grid">
  <div class="bento-card">
    <h3>React ErrorBoundary Global</h3>
    <p style="font-size: 13.5px;">Komponen pelindung runtime membungkus rute aplikasi. Jika terjadi galat tak terduga, sistem menyajikan layar pemulihan interaktif.</p>
  </div>
  <div class="bento-card">
    <h3>Kanvas Video 60 FPS Controller</h3>
    <p style="font-size: 13.5px;"><code>VideoScroll.jsx</code> memanfaatkan requestAnimationFrame dan DPR scaling untuk animasi tur kamar yang mulus dan bebas lag.</p>
  </div>
  <div class="bento-card">
    <h3>Three.js 3D WebGL Building</h3>
    <p style="font-size: 13.5px;">Menggunakan material terakota realistis, kisi-kisi jati, dan pencahayaan Blue Hour dengan pemakaian memori GPU efisien.</p>
  </div>
  <div class="bento-card">
    <h3>Service Worker PWA Offline Support</h3>
    <p style="font-size: 13.5px;">Strategi caching <code>stale-while-revalidate</code> memungkinkan aplikasi tetap responsif saat koneksi internet gawai terputus.</p>
  </div>
</div>

<!--
Speaker Notes:
- Semua optimasi performa telah diuji pada WebView Android dan browser desktop.
-->

---

<!-- Slide 17: Matriks Evolusi Fitur -->
<span class="badge badge-dev">Track Developer</span>
# Matriks Evolusi Fitur: Added, Modified, Removed

Dokumentasi riwayat penyempurnaan fitur dari versi inisiasi hingga saat ini:

<div class="bento-grid-3">
  <div class="bento-card" style="border-top: 4px solid #10b981;">
    <span class="badge badge-green">Ditambahkan (Added)</span>
    <p style="font-size: 12.5px; margin-top: 8px;">
      • Token PLN & meteran air (Rev B)<br>
      • Capacitor APK & Electron (Rev C)<br>
      • Three.js 3D & Video Scroll (Rev D)<br>
      • 1 KTP 1 NIK 16 digit (Rev E)<br>
      • Sundul Kost QRIS (Rev F)<br>
      • Mitra UMKM fee Rp 500 (Rev G)<br>
      • Global ErrorBoundary (Rev G)
    </p>
  </div>
  <div class="bento-card" style="border-top: 4px solid #f59e0b;">
    <span class="badge badge-amber">Diubah (Modified)</span>
    <p style="font-size: 12.5px; margin-top: 8px;">
      • Status kamar auto-occupied saat sewa disetujui (Rev G)<br>
      • Penggantian simulasi bayar ke QRIS perbankan riil (Rev F)<br>
      • Katalog mitra tampil dinamis sesuai ketersediaan (Rev G)<br>
      • Declarative routing modern
    </p>
  </div>
  <div class="bento-card" style="border-top: 4px solid #ef4444;">
    <span class="badge badge-rose">Dihapus (Removed)</span>
    <p style="font-size: 12.5px; margin-top: 8px;">
      • Virtual Tour 360 fisheye (>30MB boros bandwidth)<br>
      • Iklan pop-up pihak ketiga pengganggu privasi<br>
      • Komisi sewa potongan 10-20% bagi pemilik kost
    </p>
  </div>
</div>

<!--
Speaker Notes:
- Setiap penghapusan fitur memiliki alasan rekayasa yang terukur: efisiensi data dan etika bisnis.
-->

---

<!-- Slide 18: Kesimpulan & Q&A -->
<!-- _class: lead -->

<span class="badge badge-green" style="font-size: 13px;">Verifikasi QA: 100% PASS</span>
# KESIMPULAN & TANYA JAWAB
### KostKu Siap Digelar sebagai Solusi Co-Living Modern Indonesia

<div style="max-width: 700px; margin: 24px auto 0 auto; text-align: left; background: rgba(255,255,255,0.08); padding: 20px 28px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);">
  <p style="color: #ffffff; margin-bottom: 6px; font-size: 15px;">✓ <strong>Kepatuhan Akademik:</strong> Memenuhi standar baku Program Studi S1 Teknik Informatika UDINUS.</p>
  <p style="color: #ffffff; margin-bottom: 6px; font-size: 15px;">✓ <strong>Kesiapan Produksi:</strong> Multi-platform (Web, Android APK, Desktop) teruji bebas error pada 14 rute.</p>
  <p style="color: #ffffff; margin-bottom: 0; font-size: 15px;">✓ <strong>Dampak Nyata:</strong> Melindungi pemilik kost (0% komisi) dan memajukan UMKM lokal sekitar kos.</p>
</div>

<p style="color: #94a3b8; font-size: 16px; margin-top: 24px;">
  Terima kasih atas perhatian Dewan Penguji. Kami membuka sesi tanya jawab.
</p>

<!--
Speaker Notes:
- Menutup presentasi dan mempersilakan dosen penguji memberikan pertanyaan dan masukan.
-->
