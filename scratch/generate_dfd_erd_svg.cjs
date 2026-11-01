// scratch/generate_dfd_erd_svg.cjs
// Script to generate high-resolution, perfectly-aligned DFD and ERD diagrams in SVG format for KostKu documentation

const fs = require('fs');
const path = require('path');

// =========================================================================
// 1. DFD (DATA FLOW DIAGRAM) LEVEL 0 & LEVEL 1
// =========================================================================
function generateDfdSvg() {
  const width = 1920;
  const height = 1450;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #070B14; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="dfdGlowCyan" cx="20%" cy="15%" r="40%">
      <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#070B14" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dfdGlowIndigo" cx="80%" cy="15%" r="40%">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#070B14" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dfdGlowEmerald" cx="50%" cy="60%" r="50%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#070B14" stop-opacity="0"/>
    </radialGradient>

    <!-- Card Gradients -->
    <linearGradient id="cardDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111C33"/>
      <stop offset="100%" stop-color="#0B1324"/>
    </linearGradient>
    <linearGradient id="entityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="processGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064E3B" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0B1324"/>
    </linearGradient>
    <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0B1324"/>
    </linearGradient>

    <!-- Markers -->
    <marker id="arrowCyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#06B6D4"/>
    </marker>
    <marker id="arrowEmerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981"/>
    </marker>
    <marker id="arrowIndigo" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#818CF8"/>
    </marker>
    <marker id="arrowAmber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B"/>
    </marker>

    <!-- Grid -->
    <pattern id="dfdGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" stroke-width="0.5" stroke-opacity="0.35"/>
    </pattern>
  </defs>

  <rect width="${width}" height="${height}" fill="#070B14"/>
  <rect width="${width}" height="${height}" fill="url(#dfdGrid)"/>
  <rect width="${width}" height="${height}" fill="url(#dfdGlowCyan)"/>
  <rect width="${width}" height="${height}" fill="url(#dfdGlowIndigo)"/>
  <rect width="${width}" height="${height}" fill="url(#dfdGlowEmerald)"/>

  <!-- ============================================================== -->
  <!-- HEADER                                                         -->
  <!-- ============================================================== -->
  <g transform="translate(60, 35)">
    <rect x="0" y="0" width="48" height="48" rx="12" fill="#0891B2"/>
    <text x="14" y="32" font-size="22" font-weight="900" fill="#FFFFFF">⇄</text>
    <text x="64" y="28" font-size="24" font-weight="800" fill="#FFFFFF">KostKu <tspan fill="#22D3EE" font-size="18" font-weight="600">DATA FLOW DIAGRAM (DFD)</tspan></text>
    <text x="64" y="46" font-size="13" fill="#94A3B8">Aliran Data Level 0 (Diagram Konteks) &amp; Level 1 (Dekomposisi Proses &amp; Data Store) Platform PropTech KostKu</text>

    <!-- Badges -->
    <g transform="translate(1250, 10)">
      <rect x="0" y="0" width="160" height="32" rx="8" fill="#1E293B" stroke="#334155"/>
      <circle cx="16" cy="16" r="4" fill="#06B6D4"/>
      <text x="28" y="20" font-size="11" font-weight="600" fill="#E2E8F0">Gane &amp; Sarson Notation</text>

      <rect x="175" y="0" width="150" height="32" rx="8" fill="#1E293B" stroke="#334155"/>
      <circle cx="191" cy="16" r="4" fill="#10B981"/>
      <text x="203" y="20" font-size="11" font-weight="600" fill="#E2E8F0">7 External Entities</text>

      <rect x="340" y="0" width="180" height="32" rx="8" fill="#1E293B" stroke="#334155"/>
      <circle cx="356" cy="16" r="4" fill="#818CF8"/>
      <text x="368" y="20" font-size="11" font-weight="600" fill="#E2E8F0">7 Core Data Stores (D1-D7)</text>
    </g>
  </g>

  <line x1="60" y1="100" x2="1860" y2="100" stroke="#1E293B" stroke-width="1.5"/>

  <!-- ============================================================== -->
  <!-- BAGIAN 1: DFD LEVEL 0 (DIAGRAM KONTEKS)                        -->
  <!-- ============================================================== -->
  <g transform="translate(60, 120)">
    <rect width="1800" height="420" rx="14" fill="#0B1324" stroke="#1E293B" stroke-width="1.5"/>
    <text x="24" y="30" font-size="14" font-weight="800" fill="#38BDF8" letter-spacing="1">BAGIAN 1 · DFD LEVEL 0 (DIAGRAM KONTEKS SISTEM KOSTKU)</text>
    <text x="24" y="48" font-size="11" fill="#64748B">Menggambarkan batasan sistem (system boundary) dengan 7 entitas eksternal yang berinteraksi langsung.</text>

    <!-- ENTITAS EKSTERNAL (TERMINATOR) -->

    <!-- Entitas 1: Pencari Kost (Kiri Atas) -->
    <g transform="translate(40, 80)">
      <rect width="210" height="75" rx="8" fill="url(#entityGrad)" stroke="#38BDF8" stroke-width="1.5"/>
      <text x="14" y="26" font-size="13" font-weight="700" fill="#38BDF8">E1. Pencari Kost</text>
      <text x="14" y="44" font-size="10" fill="#94A3B8">• Kriteria pencarian &amp; filter</text>
      <text x="14" y="60" font-size="10" fill="#94A3B8">• Data booking &amp; bayar DP</text>
    </g>

    <!-- Entitas 2: Anak Kost (Kiri Tengah) -->
    <g transform="translate(40, 185)">
      <rect width="210" height="75" rx="8" fill="url(#entityGrad)" stroke="#34D399" stroke-width="1.5"/>
      <text x="14" y="26" font-size="13" font-weight="700" fill="#34D399">E2. Anak Kost (Penghuni)</text>
      <text x="14" y="44" font-size="10" fill="#94A3B8">• Pembayaran sewa &amp; listrik</text>
      <text x="14" y="60" font-size="10" fill="#94A3B8">• Order mitra, komplain kamar</text>
    </g>

    <!-- Entitas 3: Pemilik Kost (Kiri Bawah) -->
    <g transform="translate(40, 290)">
      <rect width="210" height="75" rx="8" fill="url(#entityGrad)" stroke="#818CF8" stroke-width="1.5"/>
      <text x="14" y="26" font-size="13" font-weight="700" fill="#818CF8">E3. Pemilik Kost (Owner)</text>
      <text x="14" y="44" font-size="10" fill="#94A3B8">• Data kamar, tarif, &amp; staf</text>
      <text x="14" y="60" font-size="10" fill="#94A3B8">• Setting % ads mitra owner</text>
    </g>

    <!-- PROSES PUSAT LEVEL 0: SISTEM KOSTKU (TENGAH) -->
    <g transform="translate(680, 120)">
      <rect width="440" height="220" rx="20" fill="url(#processGrad)" stroke="#10B981" stroke-width="2.5"/>
      <!-- Header bubble number -->
      <rect x="180" y="16" width="80" height="26" rx="13" fill="#065F46"/>
      <text x="220" y="34" font-size="13" font-weight="800" fill="#34D399" text-anchor="middle">0.0</text>
      <text x="220" y="70" font-size="18" font-weight="800" fill="#FFFFFF" text-anchor="middle">SISTEM INFORMASI &amp; MARKETPLACE</text>
      <text x="220" y="92" font-size="20" font-weight="900" fill="#34D399" text-anchor="middle">KOSTKU</text>

      <line x1="40" y1="110" x2="400" y2="110" stroke="#1E293B" stroke-width="1.5"/>

      <text x="60" y="132" font-size="11" fill="#CBD5E1">✓ Marketplace &amp; 3D Bento Room Catalog</text>
      <text x="60" y="152" font-size="11" fill="#CBD5E1">✓ Dynamic Multi-Mitra Split &amp; Tiered Delivery Engine</text>
      <text x="60" y="172" font-size="11" fill="#CBD5E1">✓ Presensi GPS Anti-Mock &amp; QR Patrol Checkpoint</text>
      <text x="60" y="192" font-size="11" fill="#CBD5E1">✓ Automated Invoicing &amp; Dynamic ASPI QRIS</text>
    </g>

    <!-- ENTITAS EKSTERNAL (KANAN) -->

    <!-- Entitas 4: Staf Operasional (Kanan Atas) -->
    <g transform="translate(1550, 70)">
      <rect width="210" height="70" rx="8" fill="url(#entityGrad)" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="14" y="24" font-size="13" font-weight="700" fill="#FBBF24">E4. Staf Operasional</text>
      <text x="14" y="42" font-size="10" fill="#94A3B8">• Presensi GPS + Selfie asli</text>
      <text x="14" y="58" font-size="10" fill="#94A3B8">• Scan QR ronda &amp; task selesai</text>
    </g>

    <!-- Entitas 5: Mitra UMKM (Kanan Tengah-Atas) -->
    <g transform="translate(1550, 155)">
      <rect width="210" height="70" rx="8" fill="url(#entityGrad)" stroke="#FB7185" stroke-width="1.5"/>
      <text x="14" y="24" font-size="13" font-weight="700" fill="#FB7185">E5. Mitra UMKM (Vendor)</text>
      <text x="14" y="42" font-size="10" fill="#94A3B8">• Katalog menu, harga &amp; logo</text>
      <text x="14" y="58" font-size="10" fill="#94A3B8">• Konfirmasi pesanan &amp; antar</text>
    </g>

    <!-- Entitas 6: Payment Gateway (Kanan Tengah-Bawah) -->
    <g transform="translate(1550, 240)">
      <rect width="210" height="70" rx="8" fill="url(#entityGrad)" stroke="#38BDF8" stroke-width="1.5"/>
      <text x="14" y="24" font-size="13" font-weight="700" fill="#38BDF8">E6. Payment Gateway</text>
      <text x="14" y="42" font-size="10" fill="#94A3B8">• QRIS Dynamic Webhook</text>
      <text x="14" y="58" font-size="10" fill="#94A3B8">• Settlement &amp; Auto-Disburse</text>
    </g>

    <!-- Entitas 7: WhatsApp Gateway (Kanan Bawah) -->
    <g transform="translate(1550, 325)">
      <rect width="210" height="70" rx="8" fill="url(#entityGrad)" stroke="#34D399" stroke-width="1.5"/>
      <text x="14" y="24" font-size="13" font-weight="700" fill="#34D399">E7. WhatsApp Gateway</text>
      <text x="14" y="42" font-size="10" fill="#94A3B8">• Billing Reminder (H-3/H-1/H)</text>
      <text x="14" y="58" font-size="10" fill="#94A3B8">• Alert pesanan mitra &amp; kuitansi</text>
    </g>

    <!-- ARROWS LEVEL 0 (DATA FLOWS) -->
    <g stroke-width="1.5" fill="none">
      <!-- E1 <-> Process 0.0 -->
      <path d="M 250 105 L 680 160" stroke="#38BDF8" marker-end="url(#arrowCyan)"/>
      <path d="M 680 180 L 250 135" stroke="#38BDF8" stroke-dasharray="3 3" marker-end="url(#arrowCyan)"/>

      <!-- E2 <-> Process 0.0 -->
      <path d="M 250 215 L 680 220" stroke="#34D399" marker-end="url(#arrowEmerald)"/>
      <path d="M 680 235 L 250 240" stroke="#34D399" stroke-dasharray="3 3" marker-end="url(#arrowEmerald)"/>

      <!-- E3 <-> Process 0.0 -->
      <path d="M 250 315 L 680 280" stroke="#818CF8" marker-end="url(#arrowIndigo)"/>
      <path d="M 680 300 L 250 335" stroke="#818CF8" stroke-dasharray="3 3" marker-end="url(#arrowIndigo)"/>

      <!-- Process 0.0 <-> E4 -->
      <path d="M 1120 170 L 1550 105" stroke="#F59E0B" marker-end="url(#arrowAmber)"/>
      <path d="M 1550 125 L 1120 185" stroke="#F59E0B" stroke-dasharray="3 3" marker-end="url(#arrowAmber)"/>

      <!-- Process 0.0 <-> E5 -->
      <path d="M 1120 205 L 1550 180" stroke="#FB7185" marker-end="url(#arrowAmber)"/>
      <path d="M 1550 200 L 1120 220" stroke="#FB7185" stroke-dasharray="3 3" marker-end="url(#arrowAmber)"/>

      <!-- Process 0.0 <-> E6 -->
      <path d="M 1120 250 L 1550 265" stroke="#38BDF8" marker-end="url(#arrowCyan)"/>
      <path d="M 1550 280 L 1120 270" stroke="#38BDF8" stroke-dasharray="3 3" marker-end="url(#arrowCyan)"/>

      <!-- Process 0.0 <-> E7 -->
      <path d="M 1120 295 L 1550 345" stroke="#34D399" marker-end="url(#arrowEmerald)"/>
    </g>

    <!-- Legend Level 0 -->
    <g transform="translate(680, 360)">
      <rect width="440" height="40" rx="8" fill="#111C33" stroke="#1E293B"/>
      <line x1="20" y1="20" x2="60" y2="20" stroke="#38BDF8" stroke-width="2"/>
      <text x="70" y="24" font-size="10.5" fill="#CBD5E1">Inbound Input Data</text>
      <line x1="210" y1="20" x2="250" y2="20" stroke="#34D399" stroke-width="2" stroke-dasharray="3 3"/>
      <text x="260" y="24" font-size="10.5" fill="#CBD5E1">Outbound Output Data</text>
    </g>
  </g>

  <!-- ============================================================== -->
  <!-- BAGIAN 2: DFD LEVEL 1 (DEKOMPOSISI PROSES & DATA STORES)       -->
  <!-- ============================================================== -->
  <g transform="translate(60, 560)">
    <rect width="1800" height="840" rx="14" fill="#0B1324" stroke="#1E293B" stroke-width="1.5"/>
    <text x="24" y="30" font-size="14" font-weight="800" fill="#34D399" letter-spacing="1">BAGIAN 2 · DFD LEVEL 1 (DEKOMPOSISI FUNGSIONAL &amp; 7 DATA STORE)</text>
    <text x="24" y="48" font-size="11" fill="#64748B">Rincian proses bisnis inti, relasi antar proses, serta penyimpanan data master (D1 - D7).</text>

    <!-- 6 CORE PROCESSES (P1 to P6) -->

    <!-- Process 1.0: Manajemen Akun & Auth -->
    <g transform="translate(40, 75)">
      <rect width="360" height="95" rx="12" fill="url(#processGrad)" stroke="#10B981" stroke-width="1.5"/>
      <rect x="14" y="12" width="40" height="22" rx="6" fill="#065F46"/>
      <text x="34" y="27" font-size="11" font-weight="800" fill="#34D399" text-anchor="middle">1.0</text>
      <text x="65" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Autentikasi &amp; Kontrol Akses Peran</text>
      <text x="14" y="52" font-size="10.5" fill="#CBD5E1">• Registrasi &amp; Login (Owner, Tenant, Staf, Mitra)</text>
      <text x="14" y="68" font-size="10.5" fill="#CBD5E1">• Validasi NIK, JWT Session &amp; Keamanan Role</text>
      <text x="14" y="84" font-size="10" fill="#94A3B8">In: Kredensial User | Out: Token &amp; State Profil</text>
    </g>

    <!-- Process 2.0: Manajemen Kamar & Discovery -->
    <g transform="translate(40, 195)">
      <rect width="360" height="95" rx="12" fill="url(#processGrad)" stroke="#10B981" stroke-width="1.5"/>
      <rect x="14" y="12" width="40" height="22" rx="6" fill="#065F46"/>
      <text x="34" y="27" font-size="11" font-weight="800" fill="#34D399" text-anchor="middle">2.0</text>
      <text x="65" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Katalog Kamar &amp; Discovery Bento 3D</text>
      <text x="14" y="52" font-size="10.5" fill="#CBD5E1">• Input Data Kamar, Tarif, &amp; Denah Spasial</text>
      <text x="14" y="68" font-size="10.5" fill="#CBD5E1">• Filter Radius Kampus &amp; Galeri Fasilitas</text>
      <text x="14" y="84" font-size="10" fill="#94A3B8">In: Data Kamar | Out: Daftar Kost &amp; Status Kamar</text>
    </g>

    <!-- Process 3.0: Booking & Kontrak Sewa -->
    <g transform="translate(40, 315)">
      <rect width="360" height="95" rx="12" fill="url(#processGrad)" stroke="#10B981" stroke-width="1.5"/>
      <rect x="14" y="12" width="40" height="22" rx="6" fill="#065F46"/>
      <text x="34" y="27" font-size="11" font-weight="800" fill="#34D399" text-anchor="middle">3.0</text>
      <text x="65" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Booking Lock &amp; Kontrak Sewa Digital</text>
      <text x="14" y="52" font-size="10.5" fill="#CBD5E1">• 15-Minute Inventory Lock Anti Double-Booking</text>
      <text x="14" y="68" font-size="10.5" fill="#CBD5E1">• Generate Surat Perjanjian Sewa Digital (PDF)</text>
      <text x="14" y="84" font-size="10" fill="#94A3B8">In: Pengajuan Sewa | Out: Kontrak &amp; Alokasi Kamar</text>
    </g>

    <!-- Process 4.0: Tagihan Sewa & QRIS -->
    <g transform="translate(40, 435)">
      <rect width="360" height="95" rx="12" fill="url(#processGrad)" stroke="#10B981" stroke-width="1.5"/>
      <rect x="14" y="12" width="40" height="22" rx="6" fill="#065F46"/>
      <text x="34" y="27" font-size="11" font-weight="800" fill="#34D399" text-anchor="middle">4.0</text>
      <text x="65" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Invoicing Sewa, Utilitas &amp; QRIS</text>
      <text x="14" y="52" font-size="10.5" fill="#CBD5E1">• Tagihan Bulanan + Denda Keterlambatan Otomatis</text>
      <text x="14" y="68" font-size="10.5" fill="#CBD5E1">• Dynamic ASPI QRIS &amp; WhatsApp Bot Reminder</text>
      <text x="14" y="84" font-size="10" fill="#94A3B8">In: Tarif &amp; Pemakaian | Out: Kuitansi Lunas Digital</text>
    </g>

    <!-- Process 5.0: Hyperlocal Mitra Commerce -->
    <g transform="translate(40, 555)">
      <rect width="360" height="95" rx="12" fill="url(#processGrad)" stroke="#10B981" stroke-width="1.5"/>
      <rect x="14" y="12" width="40" height="22" rx="6" fill="#065F46"/>
      <text x="34" y="27" font-size="11" font-weight="800" fill="#34D399" text-anchor="middle">5.0</text>
      <text x="65" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Pesanan Mitra &amp; Split Fee Multi-Owner</text>
      <text x="14" y="52" font-size="10.5" fill="#CBD5E1">• Order Laundry / Catering (Grid 2x HP / 4x Desk)</text>
      <text x="14" y="68" font-size="10.5" fill="#CBD5E1">• Flat Rp 500 KostKu + % Ads Owner + Ongkir Jarak</text>
      <text x="14" y="84" font-size="10" fill="#94A3B8">In: Cart &amp; Jarak | Out: Order Dispatch &amp; Split Ledger</text>
    </g>

    <!-- Process 6.0: Staf Lapangan & Patroli -->
    <g transform="translate(40, 675)">
      <rect width="360" height="95" rx="12" fill="url(#processGrad)" stroke="#10B981" stroke-width="1.5"/>
      <rect x="14" y="12" width="40" height="22" rx="6" fill="#065F46"/>
      <text x="34" y="27" font-size="11" font-weight="800" fill="#34D399" text-anchor="middle">6.0</text>
      <text x="65" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Presensi GPS, Patroli QR &amp; Tugas</text>
      <text x="14" y="52" font-size="10.5" fill="#CBD5E1">• Presensi Geofence Anti-Mock Location &amp; Selfie</text>
      <text x="14" y="68" font-size="10.5" fill="#CBD5E1">• Checkpoint QR Fisik &amp; Auto-Task Pembersihan</text>
      <text x="14" y="84" font-size="10" fill="#94A3B8">In: Lokasi &amp; Foto Ronda | Out: Log Patroli &amp; Task Selesai</text>
    </g>

    <!-- DATA STORES (D1 - D7) (TENGAH & KANAN) -->
    <g transform="translate(480, 75)">
      <!-- Store D1 -->
      <g transform="translate(0, 0)">
        <rect width="380" height="75" rx="6" fill="url(#storeGrad)" stroke="#818CF8" stroke-width="1.2"/>
        <line x1="60" y1="0" x2="60" y2="75" stroke="#818CF8" stroke-width="1.2"/>
        <text x="30" y="44" font-size="16" font-weight="900" fill="#818CF8" text-anchor="middle">D1</text>
        <text x="75" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Data Pengguna &amp; Profil Hak Akses</text>
        <text x="75" y="46" font-size="10.5" fill="#CBD5E1">User ID, Nama, NIK, Password Hash, Role, No HP</text>
        <text x="75" y="62" font-size="10" fill="#94A3B8">Menyimpan kredensial &amp; identitas terverifikasi</text>
      </g>

      <!-- Store D2 -->
      <g transform="translate(0, 110)">
        <rect width="380" height="75" rx="6" fill="url(#storeGrad)" stroke="#818CF8" stroke-width="1.2"/>
        <line x1="60" y1="0" x2="60" y2="75" stroke="#818CF8" stroke-width="1.2"/>
        <text x="30" y="44" font-size="16" font-weight="900" fill="#818CF8" text-anchor="middle">D2</text>
        <text x="75" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Data Properti Kost &amp; Kamar</text>
        <text x="75" y="46" font-size="10.5" fill="#CBD5E1">Kost UID, Nama Kost, Denah Bento, Kamar ID, Harga, Status</text>
        <text x="75" y="62" font-size="10" fill="#94A3B8">Katalog inventaris kamar &amp; fasilitas properti</text>
      </g>

      <!-- Store D3 -->
      <g transform="translate(0, 220)">
        <rect width="380" height="75" rx="6" fill="url(#storeGrad)" stroke="#818CF8" stroke-width="1.2"/>
        <line x1="60" y1="0" x2="60" y2="75" stroke="#818CF8" stroke-width="1.2"/>
        <text x="30" y="44" font-size="16" font-weight="900" fill="#818CF8" text-anchor="middle">D3</text>
        <text x="75" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Data Booking, Sewa &amp; Kontrak</text>
        <text x="75" y="46" font-size="10.5" fill="#CBD5E1">Booking ID, Kamar ID, Tgl Mulai, Lock Timer, Dokumen Kontrak PDF</text>
        <text x="75" y="62" font-size="10" fill="#94A3B8">Status sewa aktif &amp; arsip hukum digital</text>
      </g>

      <!-- Store D4 -->
      <g transform="translate(0, 330)">
        <rect width="380" height="75" rx="6" fill="url(#storeGrad)" stroke="#818CF8" stroke-width="1.2"/>
        <line x1="60" y1="0" x2="60" y2="75" stroke="#818CF8" stroke-width="1.2"/>
        <text x="30" y="44" font-size="16" font-weight="900" fill="#818CF8" text-anchor="middle">D4</text>
        <text x="75" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Data Invoicing, Tagihan &amp; QRIS</text>
        <text x="75" y="46" font-size="10.5" fill="#CBD5E1">Invoice ID, Nominal Sewa, Air/Listrik, Denda, Status Bayar</text>
        <text x="75" y="62" font-size="10" fill="#94A3B8">Payload transaksi QRIS &amp; bukti pelunasan</text>
      </g>

      <!-- Store D5 -->
      <g transform="translate(0, 440)">
        <rect width="380" height="75" rx="6" fill="url(#storeGrad)" stroke="#818CF8" stroke-width="1.2"/>
        <line x1="60" y1="0" x2="60" y2="75" stroke="#818CF8" stroke-width="1.2"/>
        <text x="30" y="44" font-size="16" font-weight="900" fill="#818CF8" text-anchor="middle">D5</text>
        <text x="75" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Data Mitra UMKM, Menu &amp; Pesanan</text>
        <text x="75" y="46" font-size="10.5" fill="#CBD5E1">Mitra ID, Toko, Logo, Menu, Order ID, Ongkir, Split Rincian</text>
        <text x="75" y="62" font-size="10" fill="#94A3B8">Pemesanan layanan &amp; integrasi multi-owner</text>
      </g>

      <!-- Store D6 -->
      <g transform="translate(0, 550)">
        <rect width="380" height="75" rx="6" fill="url(#storeGrad)" stroke="#818CF8" stroke-width="1.2"/>
        <line x1="60" y1="0" x2="60" y2="75" stroke="#818CF8" stroke-width="1.2"/>
        <text x="30" y="44" font-size="16" font-weight="900" fill="#818CF8" text-anchor="middle">D6</text>
        <text x="75" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Data Operasional, Presensi &amp; Patroli</text>
        <text x="75" y="46" font-size="10.5" fill="#CBD5E1">Staff ID, Geofence GPS, Foto Selfie, QR Checkpoint, Task Status</text>
        <text x="75" y="62" font-size="10" fill="#94A3B8">Bukti inspeksi fisik &amp; kepatuhan kerja staf</text>
      </g>

      <!-- Store D7 -->
      <g transform="translate(0, 660)">
        <rect width="380" height="75" rx="6" fill="url(#storeGrad)" stroke="#818CF8" stroke-width="1.2"/>
        <line x1="60" y1="0" x2="60" y2="75" stroke="#818CF8" stroke-width="1.2"/>
        <text x="30" y="44" font-size="16" font-weight="900" fill="#818CF8" text-anchor="middle">D7</text>
        <text x="75" y="28" font-size="13" font-weight="700" fill="#FFFFFF">Buku Kas, Mutasi &amp; Payout Disbursement</text>
        <text x="75" y="46" font-size="10.5" fill="#CBD5E1">Ledger ID, Pemasukan/Pengeluaran, Rekening Tujuan, Status Payout</text>
        <text x="75" y="62" font-size="10" fill="#94A3B8">Buku kas otomatis &amp; settlement bank Flip/Tripay</text>
      </g>
    </g>

    <!-- RIGHT SUMMARY PANEL: DATA FLOW EXCHANGES -->
    <g transform="translate(920, 75)">
      <rect width="840" height="735" rx="12" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
      <text x="24" y="32" font-size="14" font-weight="700" fill="#38BDF8">MATRIKS ALIRAN DATA UTAMA (DATA STORE INTERACTION)</text>
      <text x="24" y="52" font-size="11" fill="#94A3B8">Pola Read (R) dan Write (W) dari masing-masing proses terhadap database pusat:</text>

      <!-- Table Rows -->
      <g transform="translate(24, 70)">
        <!-- Header -->
        <rect width="790" height="32" rx="4" fill="#1E293B"/>
        <text x="14" y="21" font-size="11" font-weight="700" fill="#94A3B8">ID PROSES</text>
        <text x="100" y="21" font-size="11" font-weight="700" fill="#94A3B8">NAMA PROSES</text>
        <text x="360" y="21" font-size="11" font-weight="700" fill="#94A3B8">INPUT DARI STORE</text>
        <text x="560" y="21" font-size="11" font-weight="700" fill="#94A3B8">OUTPUT KE STORE</text>

        <!-- Row 1 -->
        <g transform="translate(0, 42)">
          <text x="14" y="20" font-size="11" font-weight="700" fill="#34D399">1.0</text>
          <text x="100" y="20" font-size="11" fill="#FFFFFF">Autentikasi &amp; Hak Akses</text>
          <text x="360" y="20" font-size="11" fill="#CBD5E1">D1 (Kredensial User)</text>
          <text x="560" y="20" font-size="11" fill="#34D399">D1 (Update Profil / Auth)</text>
        </g>
        <line x1="0" y1="72" x2="790" y2="72" stroke="#1E293B" stroke-width="1"/>

        <!-- Row 2 -->
        <g transform="translate(0, 82)">
          <text x="14" y="20" font-size="11" font-weight="700" fill="#34D399">2.0</text>
          <text x="100" y="20" font-size="11" fill="#FFFFFF">Katalog Kamar &amp; Bento 3D</text>
          <text x="360" y="20" font-size="11" fill="#CBD5E1">D1 (Owner ID), D2 (Kost/Kamar)</text>
          <text x="560" y="20" font-size="11" fill="#34D399">D2 (Simpan Kamar &amp; Status)</text>
        </g>
        <line x1="0" y1="112" x2="790" y2="112" stroke="#1E293B" stroke-width="1"/>

        <!-- Row 3 -->
        <g transform="translate(0, 122)">
          <text x="14" y="20" font-size="11" font-weight="700" fill="#34D399">3.0</text>
          <text x="100" y="20" font-size="11" fill="#FFFFFF">Booking Lock &amp; Kontrak</text>
          <text x="360" y="20" font-size="11" fill="#CBD5E1">D1 (Tenant), D2 (Kamar Status)</text>
          <text x="560" y="20" font-size="11" fill="#34D399">D3 (Booking/Kontrak), D2 (Lock)</text>
        </g>
        <line x1="0" y1="152" x2="790" y2="152" stroke="#1E293B" stroke-width="1"/>

        <!-- Row 4 -->
        <g transform="translate(0, 162)">
          <text x="14" y="20" font-size="11" font-weight="700" fill="#34D399">4.0</text>
          <text x="100" y="20" font-size="11" fill="#FFFFFF">Invoicing Sewa &amp; QRIS</text>
          <text x="360" y="20" font-size="11" fill="#CBD5E1">D3 (Sewa Aktif), D4 (Due Date)</text>
          <text x="560" y="20" font-size="11" fill="#34D399">D4 (Kuitansi Lunas), D7 (Kas Masuk)</text>
        </g>
        <line x1="0" y1="192" x2="790" y2="192" stroke="#1E293B" stroke-width="1"/>

        <!-- Row 5 -->
        <g transform="translate(0, 202)">
          <text x="14" y="20" font-size="11" font-weight="700" fill="#34D399">5.0</text>
          <text x="100" y="20" font-size="11" fill="#FFFFFF">Mitra Order &amp; Split Fee</text>
          <text x="360" y="20" font-size="11" fill="#CBD5E1">D5 (Menu/Toko), D2 (Kost Lat/Lng)</text>
          <text x="560" y="20" font-size="11" fill="#34D399">D5 (Order Masuk), D7 (Auto-Payout)</text>
        </g>
        <line x1="0" y1="232" x2="790" y2="232" stroke="#1E293B" stroke-width="1"/>

        <!-- Row 6 -->
        <g transform="translate(0, 242)">
          <text x="14" y="20" font-size="11" font-weight="700" fill="#34D399">6.0</text>
          <text x="100" y="20" font-size="11" fill="#FFFFFF">Staf Lapangan &amp; Patroli</text>
          <text x="360" y="20" font-size="11" fill="#CBD5E1">D1 (Staff ID), D2 (Titik Kost QR)</text>
          <text x="560" y="20" font-size="11" fill="#34D399">D6 (Presensi Valid &amp; Patrol Log)</text>
        </g>
      </g>

      <!-- Key Insights Box -->
      <g transform="translate(24, 380)">
        <rect width="790" height="250" rx="8" fill="#111C33" stroke="#1E293B"/>
        <text x="20" y="28" font-size="13" font-weight="700" fill="#FBBF24">⭐ KARAKTERISTIK DATA FLOW UNIK KOSTKU</text>

        <text x="20" y="58" font-size="11" font-weight="700" fill="#38BDF8">1. Multi-Owner Split Ledger Routing (Proses 5.0 → D5 &amp; D7):</text>
        <text x="20" y="74" font-size="10.5" fill="#CBD5E1">Toko mitra dari Owner A dapat ditampilkan ke anak kost di Kost milik Owner B. Saat pesanan dibayar,</text>
        <text x="20" y="90" font-size="10.5" fill="#CBD5E1">sistem memecah Rp 500 (KostKu), Rp 10.000 Ads Cut ke Owner A (bukan Owner B), dan net menu ke Toko.</text>

        <text x="20" y="118" font-size="11" font-weight="700" fill="#34D399">2. Dynamic Tiered Delivery Pipeline (Proses 5.0):</text>
        <text x="20" y="134" font-size="10.5" fill="#CBD5E1">Jarak dihitung real-time menggunakan koordinat (lat/lng) toko mitra terhadap koordinat properti kost.</text>
        <text x="20" y="150" font-size="10.5" fill="#CBD5E1">Radius ≤ 2 km otomatis Rp 2.000, radius > 2 km otomatis Rp 2.000 + (jarak - 2) × Rp 2.500/km.</text>

        <text x="20" y="178" font-size="11" font-weight="700" fill="#818CF8">3. Anti-Mocking GPS &amp; Physical Checkpoint Ledger (Proses 6.0 → D6):</text>
        <text x="20" y="194" font-size="10.5" fill="#CBD5E1">Setiap presensi memeriksa mock flag, dan setiap titik ronda (gerbang, toren, MCB) divalidasi dengan</text>
        <text x="20" y="210" font-size="10.5" fill="#CBD5E1">hash token QR fisik dinamis agar staf tidak bisa melakukan scan palsu dari luar gedung kost.</text>
      </g>
    </g>

    <!-- Connectors between Processes and Stores -->
    <g stroke-width="1.8" fill="none">
      <path d="M 400 120 L 480 110" stroke="#818CF8" marker-end="url(#arrowIndigo)"/>
      <path d="M 400 240 L 480 220" stroke="#818CF8" marker-end="url(#arrowIndigo)"/>
      <path d="M 400 360 L 480 330" stroke="#818CF8" marker-end="url(#arrowIndigo)"/>
      <path d="M 400 480 L 480 440" stroke="#818CF8" marker-end="url(#arrowIndigo)"/>
      <path d="M 400 600 L 480 550" stroke="#818CF8" marker-end="url(#arrowIndigo)"/>
      <path d="M 400 720 L 480 660" stroke="#818CF8" marker-end="url(#arrowIndigo)"/>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(60, 1420)">
    <text x="0" y="0" font-size="11" fill="#64748B">KostKu Data Flow Specification · Formal Gane &amp; Sarson Methodology · Architectural Blueprint</text>
    <text x="1800" y="0" font-size="11" fill="#64748B" text-anchor="end">Internal Engineering Documentation v1.1.0</text>
  </g>
</svg>`;
}

// =========================================================================
// 2. ERD (ENTITY RELATIONSHIP DIAGRAM) RELATIONAL SCHEMA
// =========================================================================
function generateErdSvg() {
  const width = 1920;
  const height = 1450;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #070B14; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="erdGlowIndigo" cx="20%" cy="10%" r="45%">
      <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#070B14" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="erdGlowEmerald" cx="80%" cy="20%" r="45%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#070B14" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="erdGlowCyan" cx="50%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#0891B2" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#070B14" stop-opacity="0"/>
    </radialGradient>

    <!-- Table Card Fill -->
    <linearGradient id="erdCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111C33"/>
      <stop offset="100%" stop-color="#0B1324"/>
    </linearGradient>

    <!-- Table Header Gradients -->
    <linearGradient id="tblHeadIndigo" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3730A3"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
    <linearGradient id="tblHeadEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="tblHeadAmber" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#78350F"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="tblHeadCyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#155E75"/>
      <stop offset="100%" stop-color="#0891B2"/>
    </linearGradient>
    <linearGradient id="tblHeadRose" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#881337"/>
      <stop offset="100%" stop-color="#E11D48"/>
    </linearGradient>

    <!-- Grid -->
    <pattern id="erdGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" stroke-width="0.5" stroke-opacity="0.35"/>
    </pattern>

    <!-- Drop Shadow -->
    <filter id="erdShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="#070B14"/>
  <rect width="${width}" height="${height}" fill="url(#erdGrid)"/>
  <rect width="${width}" height="${height}" fill="url(#erdGlowIndigo)"/>
  <rect width="${width}" height="${height}" fill="url(#erdGlowEmerald)"/>
  <rect width="${width}" height="${height}" fill="url(#erdGlowCyan)"/>

  <!-- ============================================================== -->
  <!-- HEADER                                                         -->
  <!-- ============================================================== -->
  <g transform="translate(60, 35)">
    <rect x="0" y="0" width="48" height="48" rx="12" fill="#4F46E5"/>
    <text x="14" y="32" font-size="22" font-weight="900" fill="#FFFFFF">🗄️</text>
    <text x="64" y="28" font-size="24" font-weight="800" fill="#FFFFFF">KostKu <tspan fill="#818CF8" font-size="18" font-weight="600">ENTITY RELATIONSHIP DIAGRAM (ERD)</tspan></text>
    <text x="64" y="46" font-size="13" fill="#94A3B8">Skema Database Relasional PostgreSQL / Supabase, Relasi Antar Entitas, Primary/Foreign Keys, &amp; Kardinalitas</text>

    <!-- Status Badges -->
    <g transform="translate(1260, 10)">
      <rect x="0" y="0" width="165" height="32" rx="8" fill="#1E293B" stroke="#334155"/>
      <circle cx="16" cy="16" r="4" fill="#818CF8"/>
      <text x="28" y="20" font-size="11" font-weight="600" fill="#E2E8F0">Crow's Foot Notation</text>

      <rect x="180" y="0" width="160" height="32" rx="8" fill="#1E293B" stroke="#334155"/>
      <circle cx="196" cy="16" r="4" fill="#34D399"/>
      <text x="208" y="20" font-size="11" font-weight="600" fill="#E2E8F0">ACID Compliant Ledger</text>

      <rect x="355" y="0" width="160" height="32" rx="8" fill="#1E293B" stroke="#334155"/>
      <circle cx="371" cy="16" r="4" fill="#F59E0B"/>
      <text x="383" y="20" font-size="11" font-weight="600" fill="#E2E8F0">Multi-Tenant Scoped</text>
    </g>
  </g>

  <line x1="60" y1="100" x2="1860" y2="100" stroke="#1E293B" stroke-width="1.5"/>

  <!-- ============================================================== -->
  <!-- ENTITY CARDS GRID                                              -->
  <!-- ============================================================== -->

  <!-- ROW 1 (Y: 120): USER CORE & PROPERTY HIERARCHY -->

  <!-- TABLE 1: USERS -->
  <g transform="translate(60, 120)" filter="url(#erdShadow)">
    <rect width="280" height="250" rx="10" fill="url(#erdCard)" stroke="#4F46E5" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadIndigo)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">USERS (Tabel Pengguna)</text>

    <!-- Columns -->
    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="54" font-size="11" fill="#E2E8F0">name</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">VARCHAR(255)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">email</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">VARCHAR(255) U</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">phone / nik</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">password_hash</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="134" font-size="11" font-weight="600" fill="#34D399">role</text>
      <text x="180" y="134" font-size="10.5" fill="#64748B">VARCHAR(30)</text>

      <text x="30" y="154" font-size="11" fill="#E2E8F0">kamar_no</text>
      <text x="180" y="154" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="174" font-size="11" fill="#E2E8F0">wallet_balance</text>
      <text x="180" y="174" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="194" font-size="10" fill="#64748B">created_at</text>
      <text x="180" y="194" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 2: KOSTS (PROPERTIES) -->
  <g transform="translate(420, 120)" filter="url(#erdShadow)">
    <rect width="280" height="250" rx="10" fill="url(#erdCard)" stroke="#059669" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadEmerald)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">KOSTS (Properti Kost)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id / uid</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID / VARCHAR</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">owner_id</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">UUID (Users)</text>

      <text x="30" y="54" font-size="11" fill="#E2E8F0">kost_name</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">VARCHAR(255)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">address</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="94" font-size="11" font-weight="600" fill="#F59E0B">lat, lng</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">DOUBLE PREC</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">water_rate</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="134" font-size="11" fill="#E2E8F0">electricity_rate</text>
      <text x="180" y="134" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="154" font-size="11" fill="#E2E8F0">deposit_amount</text>
      <text x="180" y="154" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="174" font-size="11" fill="#E2E8F0">bento_layout</text>
      <text x="180" y="174" font-size="10.5" fill="#64748B">JSONB</text>

      <text x="30" y="194" font-size="10" fill="#64748B">created_at</text>
      <text x="180" y="194" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 3: ROOMS -->
  <g transform="translate(780, 120)" filter="url(#erdShadow)">
    <rect width="280" height="250" rx="10" fill="url(#erdCard)" stroke="#059669" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadEmerald)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">ROOMS (Kamar Kost)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="54" font-size="11" fill="#E2E8F0">room_number</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">price</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">capacity</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">INT</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">facilities</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">TEXT[]</text>

      <text x="30" y="134" font-size="11" font-weight="600" fill="#FBBF24">status</text>
      <text x="180" y="134" font-size="10.5" fill="#64748B">VARCHAR(30)</text>

      <text x="30" y="154" font-size="11" fill="#E2E8F0">smart_lock_pin</text>
      <text x="180" y="154" font-size="10.5" fill="#64748B">VARCHAR(20)</text>

      <text x="30" y="174" font-size="11" fill="#E2E8F0">bento_spatial_data</text>
      <text x="180" y="174" font-size="10.5" fill="#64748B">JSONB</text>

      <text x="30" y="194" font-size="10" fill="#64748B">created_at</text>
      <text x="180" y="194" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 4: BOOKINGS & CONTRACTS -->
  <g transform="translate(1140, 120)" filter="url(#erdShadow)">
    <rect width="280" height="250" rx="10" fill="url(#erdCard)" stroke="#0891B2" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadCyan)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">BOOKINGS (Pemesanan Kamar)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">room_id</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">UUID (Rooms)</text>

      <text x="0" y="54" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="54" font-size="11" fill="#E2E8F0">user_id</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">UUID (Users)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">start_date</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">DATE</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">duration_months</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">INT</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">total_amount</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="134" font-size="11" font-weight="600" fill="#F43F5E">lock_expires_at</text>
      <text x="180" y="134" font-size="10.5" fill="#64748B">TIMESTAMPTZ</text>

      <text x="30" y="154" font-size="11" fill="#E2E8F0">contract_pdf_url</text>
      <text x="180" y="154" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="174" font-size="11" fill="#E2E8F0">status</text>
      <text x="180" y="174" font-size="10.5" fill="#64748B">VARCHAR(30)</text>

      <text x="30" y="194" font-size="10" fill="#64748B">created_at</text>
      <text x="180" y="194" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 5: INVOICES (TAGIHAN & SEWA) -->
  <g transform="translate(1500, 120)" filter="url(#erdShadow)">
    <rect width="360" height="250" rx="10" fill="url(#erdCard)" stroke="#0891B2" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 350 0 C 355.5 0 360 4.5 360 10 L 360 32 L 0 32 Z" fill="url(#tblHeadCyan)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">INVOICES (Tagihan Sewa &amp; Utilitas)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="240" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">kost_uid / user_id</text>
      <text x="240" y="34" font-size="10.5" fill="#64748B">VARCHAR / UUID</text>

      <text x="30" y="54" font-size="11" fill="#E2E8F0">base_price, deposit</text>
      <text x="240" y="54" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">water_cost, electricity_cost</text>
      <text x="240" y="74" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="94" font-size="11" font-weight="700" fill="#F43F5E">late_fee_denda</text>
      <text x="240" y="94" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="114" font-size="11" font-weight="700" fill="#34D399">total</text>
      <text x="240" y="114" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="134" font-size="11" fill="#E2E8F0">status ('pending', 'lunas')</text>
      <text x="240" y="134" font-size="10.5" fill="#64748B">VARCHAR(30)</text>

      <text x="30" y="154" font-size="11" fill="#E2E8F0">qris_transaction_id</text>
      <text x="240" y="154" font-size="10.5" fill="#64748B">VARCHAR(100)</text>

      <text x="30" y="174" font-size="11" fill="#E2E8F0">due_date / verify_date</text>
      <text x="240" y="174" font-size="10.5" fill="#64748B">TIMESTAMPTZ</text>

      <text x="30" y="194" font-size="10" fill="#64748B">created_at</text>
      <text x="240" y="194" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ROW 2 (Y: 410): HYPERLOCAL MITRA & SPLIT-FEE ECOSYSTEM -->

  <!-- TABLE 6: MITRA_SHOPS -->
  <g transform="translate(60, 420)" filter="url(#erdShadow)">
    <rect width="320" height="240" rx="10" fill="url(#erdCard)" stroke="#E11D48" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 310 0 C 315.5 0 320 4.5 320 10 L 320 32 L 0 32 Z" fill="url(#tblHeadRose)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">MITRA_SHOPS (Toko Vendor Mitra)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="210" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">vendor_user_id</text>
      <text x="210" y="34" font-size="10.5" fill="#64748B">UUID (Users)</text>

      <text x="0" y="54" font-size="11" font-weight="700" fill="#FBBF24">FK</text>
      <text x="30" y="54" font-size="11" font-weight="700" fill="#FBBF24">origin_owner_id</text>
      <text x="210" y="54" font-size="10.5" fill="#64748B">UUID (Users)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">shop_name, category</text>
      <text x="210" y="74" font-size="10.5" fill="#64748B">VARCHAR(100)</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">logo_url, banner_url</text>
      <text x="210" y="94" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="114" font-size="11" font-weight="600" fill="#34D399">is_mitra_utama</text>
      <text x="210" y="114" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="134" font-size="11" fill="#E2E8F0">lat, lng (Koordinat)</text>
      <text x="210" y="134" font-size="10.5" fill="#64748B">DOUBLE PREC</text>

      <text x="30" y="154" font-size="11" fill="#E2E8F0">status_buka</text>
      <text x="210" y="154" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="174" font-size="10" fill="#64748B">created_at</text>
      <text x="210" y="174" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 7: MITRA_OWNER_CONFIGS -->
  <g transform="translate(420, 420)" filter="url(#erdShadow)">
    <rect width="280" height="240" rx="10" fill="url(#erdCard)" stroke="#E11D48" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadRose)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">MITRA_OWNER_CONFIGS</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="0" y="54" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="54" font-size="11" fill="#E2E8F0">mitra_shop_id</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">UUID (Shops)</text>

      <text x="30" y="74" font-size="11" font-weight="700" fill="#F59E0B">custom_ads_pct</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">NUMERIC (e.g. 10%)</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">is_pinned_top</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">is_cross_listed</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="134" font-size="10" fill="#64748B">updated_at</text>
      <text x="180" y="134" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 8: MENU_ITEMS -->
  <g transform="translate(740, 420)" filter="url(#erdShadow)">
    <rect width="280" height="240" rx="10" fill="url(#erdCard)" stroke="#E11D48" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadRose)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">MENU_ITEMS (Katalog Produk)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">mitra_shop_id</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">UUID (Shops)</text>

      <text x="30" y="54" font-size="11" fill="#E2E8F0">item_name</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">VARCHAR(255)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">price</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">image_url</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">is_available</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="134" font-size="10" fill="#64748B">created_at</text>
      <text x="180" y="134" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 9: MITRA_ORDERS -->
  <g transform="translate(1060, 420)" filter="url(#erdShadow)">
    <rect width="360" height="240" rx="10" fill="url(#erdCard)" stroke="#059669" stroke-width="1.8"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 350 0 C 355.5 0 360 4.5 360 10 L 360 32 L 0 32 Z" fill="url(#tblHeadEmerald)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">MITRA_ORDERS (Split Fee &amp; Ongkir)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="240" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">user_id / mitra_shop_id</text>
      <text x="240" y="34" font-size="10.5" fill="#64748B">UUID / UUID</text>

      <text x="0" y="54" font-size="11" font-weight="700" fill="#FBBF24">FK</text>
      <text x="30" y="54" font-size="11" font-weight="700" fill="#FBBF24">origin_owner_id</text>
      <text x="240" y="54" font-size="10.5" fill="#64748B">UUID (Users)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">subtotal_menu</text>
      <text x="240" y="74" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="94" font-size="11" font-weight="600" fill="#38BDF8">delivery_fee (Tiered)</text>
      <text x="240" y="94" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="114" font-size="11" font-weight="700" fill="#34D399">flat_platform_fee</text>
      <text x="240" y="114" font-size="10.5" fill="#64748B">NUMERIC (500)</text>

      <text x="30" y="134" font-size="11" font-weight="700" fill="#818CF8">owner_ads_cut</text>
      <text x="240" y="134" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="154" font-size="11" font-weight="700" fill="#FFFFFF">total_paid</text>
      <text x="240" y="154" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="174" font-size="11" fill="#E2E8F0">distance_km, status</text>
      <text x="240" y="174" font-size="10.5" fill="#64748B">NUMERIC, VARCHAR</text>
    </g>
  </g>

  <!-- TABLE 10: CASHFLOW_LEDGER & PAYOUTS -->
  <g transform="translate(1460, 420)" filter="url(#erdShadow)">
    <rect width="400" height="240" rx="10" fill="url(#erdCard)" stroke="#4F46E5" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 390 0 C 395.5 0 400 4.5 400 10 L 400 32 L 0 32 Z" fill="url(#tblHeadIndigo)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">CASHFLOW_LEDGER &amp; PAYOUTS</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="280" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">kost_uid / recipient_id</text>
      <text x="280" y="34" font-size="10.5" fill="#64748B">VARCHAR / UUID</text>

      <text x="30" y="54" font-size="11" font-weight="700" fill="#34D399">type ('inflow', 'outflow')</text>
      <text x="280" y="54" font-size="10.5" fill="#64748B">VARCHAR(30)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">category ('sewa', 'ads', 'gaji', 'payout')</text>
      <text x="280" y="74" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="94" font-size="11" font-weight="700" fill="#FFFFFF">amount</text>
      <text x="280" y="94" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">payout_gateway ('flip', 'tripay')</text>
      <text x="280" y="114" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="134" font-size="11" fill="#E2E8F0">disbursement_status</text>
      <text x="280" y="134" font-size="10.5" fill="#64748B">VARCHAR(30)</text>

      <text x="30" y="154" font-size="10" fill="#64748B">timestamp / created_at</text>
      <text x="280" y="154" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ROW 3 (Y: 700): FIELD CREW, SECURITY PATROLS & OPERATIONS -->

  <!-- TABLE 11: STAFF_PROFILES -->
  <g transform="translate(60, 700)" filter="url(#erdShadow)">
    <rect width="280" height="240" rx="10" fill="url(#erdCard)" stroke="#D97706" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadAmber)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">STAFF_PROFILES (Profil Staf)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">user_id</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">UUID (Users)</text>

      <text x="0" y="54" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="54" font-size="11" fill="#E2E8F0">kost_uid</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">job_title</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">VARCHAR(100)</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">base_salary</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">NUMERIC</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">shift_schedule</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="134" font-size="11" fill="#E2E8F0">is_active</text>
      <text x="180" y="134" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="154" font-size="10" fill="#64748B">hired_at</text>
      <text x="180" y="154" font-size="10" fill="#64748B">DATE</text>
    </g>
  </g>

  <!-- TABLE 12: ATTENDANCES (PRESENSI GPS) -->
  <g transform="translate(380, 700)" filter="url(#erdShadow)">
    <rect width="320" height="240" rx="10" fill="url(#erdCard)" stroke="#D97706" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 310 0 C 315.5 0 320 4.5 320 10 L 320 32 L 0 32 Z" fill="url(#tblHeadAmber)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">ATTENDANCES (Presensi Anti-Mock)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="210" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">staff_id</text>
      <text x="210" y="34" font-size="10.5" fill="#64748B">UUID (Staff)</text>

      <text x="30" y="54" font-size="11" fill="#E2E8F0">check_in_time</text>
      <text x="210" y="54" font-size="10.5" fill="#64748B">TIMESTAMPTZ</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">check_out_time</text>
      <text x="210" y="74" font-size="10.5" fill="#64748B">TIMESTAMPTZ</text>

      <text x="30" y="94" font-size="11" font-weight="700" fill="#F59E0B">lat, lng</text>
      <text x="210" y="94" font-size="10.5" fill="#64748B">DOUBLE PREC</text>

      <text x="30" y="114" font-size="11" font-weight="700" fill="#F43F5E">is_mock_location</text>
      <text x="210" y="114" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="134" font-size="11" fill="#E2E8F0">selfie_photo_url</text>
      <text x="210" y="134" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="154" font-size="11" font-weight="600" fill="#34D399">status_valid</text>
      <text x="210" y="154" font-size="10.5" fill="#64748B">VARCHAR(30)</text>
    </g>
  </g>

  <!-- TABLE 13: PATROL_CHECKPOINTS -->
  <g transform="translate(740, 700)" filter="url(#erdShadow)">
    <rect width="280" height="240" rx="10" fill="url(#erdCard)" stroke="#D97706" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 270 0 C 275.5 0 280 4.5 280 10 L 280 32 L 0 32 Z" fill="url(#tblHeadAmber)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">PATROL_CHECKPOINTS (Titik QR)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="180" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="54" font-size="11" fill="#E2E8F0">checkpoint_name</text>
      <text x="180" y="54" font-size="10.5" fill="#64748B">VARCHAR(100)</text>

      <text x="30" y="74" font-size="11" font-weight="700" fill="#38BDF8">qr_code_hash</text>
      <text x="180" y="74" font-size="10.5" fill="#64748B">VARCHAR(255) U</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">location_spot</text>
      <text x="180" y="94" font-size="10.5" fill="#64748B">VARCHAR(100)</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">required_schedule</text>
      <text x="180" y="114" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="134" font-size="10" fill="#64748B">created_at</text>
      <text x="180" y="134" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 14: PATROL_LOGS & TASKS -->
  <g transform="translate(1060, 700)" filter="url(#erdShadow)">
    <rect width="360" height="240" rx="10" fill="url(#erdCard)" stroke="#D97706" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 350 0 C 355.5 0 360 4.5 360 10 L 360 32 L 0 32 Z" fill="url(#tblHeadAmber)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">PATROL_LOGS &amp; TASKS (Ronda &amp; Tugas)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="240" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">checkpoint_id</text>
      <text x="240" y="34" font-size="10.5" fill="#64748B">UUID (Checkpoints)</text>

      <text x="0" y="54" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="54" font-size="11" fill="#E2E8F0">staff_id / room_id</text>
      <text x="240" y="54" font-size="10.5" fill="#64748B">UUID / UUID</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">task_type</text>
      <text x="240" y="74" font-size="10.5" fill="#64748B">VARCHAR(50)</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">inspection_photo_url</text>
      <text x="240" y="94" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="114" font-size="11" fill="#E2E8F0">security_notes</text>
      <text x="240" y="114" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="134" font-size="11" font-weight="600" fill="#34D399">is_passed</text>
      <text x="240" y="134" font-size="10.5" fill="#64748B">BOOLEAN</text>

      <text x="30" y="154" font-size="10" fill="#64748B">scanned_at / done_at</text>
      <text x="240" y="154" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TABLE 15: COMPLAINTS & PACKAGES -->
  <g transform="translate(1460, 700)" filter="url(#erdShadow)">
    <rect width="400" height="240" rx="10" fill="url(#erdCard)" stroke="#0891B2" stroke-width="1.5"/>
    <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 390 0 C 395.5 0 400 4.5 400 10 L 400 32 L 0 32 Z" fill="url(#tblHeadCyan)"/>
    <text x="14" y="22" font-size="13" font-weight="800" fill="#FFFFFF">COMPLAINTS &amp; PACKAGES (Layanan Kamar)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="700" fill="#FBBF24">PK</text>
      <text x="30" y="14" font-size="11" font-weight="600" fill="#FFFFFF">id</text>
      <text x="280" y="14" font-size="10.5" fill="#64748B">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="34" font-size="11" fill="#E2E8F0">kost_uid / user_id</text>
      <text x="280" y="34" font-size="10.5" fill="#64748B">VARCHAR / UUID</text>

      <text x="0" y="54" font-size="11" font-weight="700" fill="#38BDF8">FK</text>
      <text x="30" y="54" font-size="11" fill="#E2E8F0">assigned_staff_id</text>
      <text x="280" y="54" font-size="10.5" fill="#64748B">UUID (Staff)</text>

      <text x="30" y="74" font-size="11" fill="#E2E8F0">complaint_text</text>
      <text x="280" y="74" font-size="10.5" fill="#64748B">TEXT</text>

      <text x="30" y="94" font-size="11" fill="#E2E8F0">photo_url / courier</text>
      <text x="280" y="94" font-size="10.5" fill="#64748B">TEXT / VARCHAR</text>

      <text x="30" y="114" font-size="11" font-weight="600" fill="#FBBF24">status ('pending', 'proses', 'selesai')</text>
      <text x="280" y="114" font-size="10.5" fill="#64748B">VARCHAR(30)</text>

      <text x="30" y="134" font-size="10" fill="#64748B">date / created_at</text>
      <text x="280" y="134" font-size="10" fill="#64748B">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ============================================================== -->
  <!-- CARDINALITY & RELATIONSHIP CONNECTORS (CROW'S FOOT NOTATION)    -->
  <!-- ============================================================== -->
  <g stroke-width="1.8" fill="none">
    <!-- USERS (1) -> KOSTS (N) [Owner owns Kosts] -->
    <path d="M 340 200 L 420 200" stroke="#818CF8"/>
    <!-- Crow's foot on KOSTS -->
    <path d="M 405 194 L 420 200 L 405 206" stroke="#818CF8"/>

    <!-- KOSTS (1) -> ROOMS (N) [Kost has Rooms] -->
    <path d="M 700 200 L 780 200" stroke="#059669"/>
    <path d="M 765 194 L 780 200 L 765 206" stroke="#059669"/>

    <!-- ROOMS (1) -> BOOKINGS (N) [Room has Bookings] -->
    <path d="M 1060 200 L 1140 200" stroke="#0891B2"/>
    <path d="M 1125 194 L 1140 200 L 1125 206" stroke="#0891B2"/>

    <!-- BOOKINGS (1) -> INVOICES (N) [Booking produces Invoices] -->
    <path d="M 1420 200 L 1500 200" stroke="#0891B2"/>
    <path d="M 1485 194 L 1500 200 L 1485 206" stroke="#0891B2"/>

    <!-- USERS (1) -> MITRA_SHOPS (N) [Owner owns Mitra Shop] -->
    <path d="M 200 370 L 200 420" stroke="#E11D48"/>
    <path d="M 194 405 L 200 420 L 206 405" stroke="#E11D48"/>

    <!-- MITRA_SHOPS (1) -> MITRA_OWNER_CONFIGS (N) -->
    <path d="M 380 500 L 420 500" stroke="#E11D48"/>
    <path d="M 405 494 L 420 500 L 405 506" stroke="#E11D48"/>

    <!-- MITRA_SHOPS (1) -> MENU_ITEMS (N) -->
    <path d="M 700 500 L 740 500" stroke="#E11D48"/>
    <path d="M 725 494 L 740 500 L 725 506" stroke="#E11D48"/>

    <!-- MENU_ITEMS (1) -> MITRA_ORDERS (N) -->
    <path d="M 1020 500 L 1060 500" stroke="#059669"/>
    <path d="M 1045 494 L 1060 500 L 1045 506" stroke="#059669"/>

    <!-- MITRA_ORDERS (1) -> CASHFLOW_LEDGER (N) [Order triggers split payout] -->
    <path d="M 1420 500 L 1460 500" stroke="#4F46E5"/>
    <path d="M 1445 494 L 1460 500 L 1445 506" stroke="#4F46E5"/>

    <!-- USERS (1) -> STAFF_PROFILES (N) -->
    <path d="M 200 660 L 200 700" stroke="#D97706"/>
    <path d="M 194 685 L 200 700 L 206 685" stroke="#D97706"/>

    <!-- STAFF_PROFILES (1) -> ATTENDANCES (N) -->
    <path d="M 340 780 L 380 780" stroke="#D97706"/>
    <path d="M 365 774 L 380 780 L 365 786" stroke="#D97706"/>

    <!-- KOSTS (1) -> PATROL_CHECKPOINTS (N) -->
    <path d="M 560 370 L 560 680 L 740 780" stroke="#D97706" stroke-dasharray="3 3"/>
    <path d="M 725 774 L 740 780 L 725 786" stroke="#D97706"/>

    <!-- PATROL_CHECKPOINTS (1) -> PATROL_LOGS (N) -->
    <path d="M 1020 780 L 1060 780" stroke="#D97706"/>
    <path d="M 1045 774 L 1060 780 L 1045 786" stroke="#D97706"/>

    <!-- KOSTS / USERS -> COMPLAINTS (N) -->
    <path d="M 1420 780 L 1460 780" stroke="#0891B2"/>
    <path d="M 1445 774 L 1460 780 L 1445 786" stroke="#0891B2"/>
  </g>

  <!-- ============================================================== -->
  <!-- BOTTOM PANEL: ARCHITECTURAL EXPLANATION & CONSTRAINTS          -->
  <!-- ============================================================== -->
  <g transform="translate(60, 970)">
    <rect width="1800" height="420" rx="14" fill="#0B1324" stroke="#1E293B" stroke-width="1.5"/>
    <text x="24" y="30" font-size="14" font-weight="800" fill="#818CF8" letter-spacing="1">BAGIAN 3 · INTEGRITAS RELASIONAL &amp; ATURAN BISNIS DATABASE KOSTKU</text>

    <!-- 3 Explanation Columns -->
    <!-- Col 1 -->
    <g transform="translate(24, 55)">
      <rect width="560" height="340" rx="10" fill="#111C33" stroke="#1E293B"/>
      <text x="18" y="28" font-size="13" font-weight="700" fill="#34D399">1. Multi-Owner Mitra &amp; Revenue Routing</text>
      <text x="18" y="52" font-size="11" fill="#CBD5E1">Setiap toko (<tspan font-weight="700" fill="#FFFFFF">mitra_shops</tspan>) memiliki <tspan font-weight="700" fill="#FBBF24">origin_owner_id</tspan> yang merujuk</text>
      <text x="18" y="70" font-size="11" fill="#CBD5E1">pada Owner pemilik toko aslinya:</text>
      <text x="18" y="96" font-size="10.5" fill="#94A3B8">• Relasi Many-to-Many via <tspan fill="#38BDF8">mitra_owner_configs</tspan> mengizinkan</text>
      <text x="28" y="114" font-size="10.5" fill="#94A3B8">toko ditampilkan lintas kost milik owner lain.</text>
      <text x="18" y="140" font-size="10.5" fill="#94A3B8">• Ketika pesanan terjadi di kost B, field <tspan fill="#FBBF24">origin_owner_id</tspan> pada</text>
      <text x="28" y="158" font-size="10.5" fill="#94A3B8"><tspan fill="#34D399">mitra_orders</tspan> memastikan bagian Ads Cut masuk ke</text>
      <text x="28" y="176" font-size="10.5" fill="#94A3B8">wallet Owner A (pemilik toko), bukan Owner B.</text>
      <text x="18" y="204" font-size="10.5" fill="#94A3B8">• Jika <tspan fill="#34D399">is_mitra_utama = true</tspan> pada kost tersebut, toko dipin</text>
      <text x="28" y="222" font-size="10.5" fill="#94A3B8">paling atas dan owner kost bersangkutan dapat full hak.</text>

      <rect x="18" y="250" width="524" height="65" rx="6" fill="#064E3B" fill-opacity="0.3" stroke="#059669" stroke-width="0.8"/>
      <text x="28" y="272" font-size="10.5" font-weight="600" fill="#6EE7B7">⚡ Aturan Flat Admin KostKu:</text>
      <text x="28" y="290" font-size="9.5" fill="#A7F3D0">Field flat_platform_fee selalu fixed Rp 500 dan dialokasikan ke rekening</text>
      <text x="28" y="304" font-size="9.5" fill="#A7F3D0">platform KostKu otomatis pada setiap transaksi pemesanan mitra.</text>
    </g>

    <!-- Col 2 -->
    <g transform="translate(620, 55)">
      <rect width="560" height="340" rx="10" fill="#111C33" stroke="#1E293B"/>
      <text x="18" y="28" font-size="13" font-weight="700" fill="#38BDF8">2. Dynamic Delivery Fee Tier Calculation</text>
      <text x="18" y="52" font-size="11" fill="#CBD5E1">Perhitungan ongkos kirim kurir disimpan presisi pada</text>
      <text x="18" y="70" font-size="11" fill="#CBD5E1">tabel <tspan font-weight="700" fill="#FFFFFF">mitra_orders</tspan> melalui field <tspan font-weight="700" fill="#38BDF8">distance_km</tspan>:</text>
      <text x="18" y="96" font-size="10.5" fill="#94A3B8">• Jarak dihitung dari titik koordinat <tspan fill="#F59E0B">lat, lng</tspan> toko terhadap</text>
      <text x="28" y="114" font-size="10.5" fill="#94A3B8">titik koordinat properti kost (<tspan fill="#059669">kosts.lat, lng</tspan>).</text>
      <text x="18" y="140" font-size="10.5" fill="#94A3B8">• Rumus Evaluasi:</text>
      <text x="28" y="160" font-size="11" font-weight="700" fill="#34D399">IF distance_km ≤ 2.0 THEN delivery_fee = 2.000</text>
      <text x="28" y="180" font-size="11" font-weight="700" fill="#F59E0B">ELSE delivery_fee = 2.000 + ((distance_km - 2.0) * 2.500)</text>
      <text x="18" y="206" font-size="10.5" fill="#94A3B8">• Driver menerima 100% dari delivery_fee tanpa potongan</text>
      <text x="28" y="224" font-size="10.5" fill="#94A3B8">dan dicairkan langsung via payment disburse engine.</text>

      <rect x="18" y="250" width="524" height="65" rx="6" fill="#0C4A6E" fill-opacity="0.3" stroke="#0891B2" stroke-width="0.8"/>
      <text x="28" y="272" font-size="10.5" font-weight="600" fill="#7DD3FC">🛵 Combined Transparent Checkout:</text>
      <text x="28" y="292" font-size="10" fill="#BAE6FD">Total tagihan = subtotal_menu + delivery_fee + flat_platform_fee (Rp 500) ditampilkan dalam 1 rincian ringkas.</text>
    </g>

    <!-- Col 3 -->
    <g transform="translate(1215, 55)">
      <rect width="560" height="340" rx="10" fill="#111C33" stroke="#1E293B"/>
      <text x="18" y="28" font-size="13" font-weight="700" fill="#FBBF24">3. Staf Lapangan &amp; Anti-Cheat Security</text>
      <text x="18" y="52" font-size="11" fill="#CBD5E1">Keamanan fisik dan absensi staf diatur dengan integritas data</text>
      <text x="18" y="70" font-size="11" fill="#CBD5E1">tingkat tinggi pada <tspan font-weight="700" fill="#FFFFFF">attendances</tspan> dan <tspan font-weight="700" fill="#FFFFFF">patrol_checkpoints</tspan>:</text>
      <text x="18" y="96" font-size="10.5" fill="#94A3B8">• Flag <tspan fill="#F43F5E">is_mock_location</tspan> menolak otomatis jika staf</text>
      <text x="28" y="114" font-size="10.5" fill="#94A3B8">menggunakan aplikasi Fake GPS atau Android Mock Provider.</text>
      <text x="18" y="140" font-size="10.5" fill="#94A3B8">• Geofence Check: Memvalidasi jarak staf ≤ 50m dari kost.</text>
      <text x="18" y="166" font-size="10.5" fill="#94A3B8">• Tabel <tspan fill="#FBBF24">patrol_checkpoints</tspan> menyimpan hash QR code</text>
      <text x="28" y="184" font-size="10.5" fill="#94A3B8">fisik di lokasi rawan (pintu gerbang, toren air, ruang MCB).</text>
      <text x="18" y="210" font-size="10.5" fill="#94A3B8">• Setiap scan dicatat pada <tspan fill="#FBBF24">patrol_logs</tspan> beserta foto kamera</text>
      <text x="28" y="228" font-size="10.5" fill="#94A3B8">inspeksi dan catatan temuan keamanan real-time.</text>

      <rect x="18" y="250" width="524" height="65" rx="6" fill="#78350F" fill-opacity="0.3" stroke="#D97706" stroke-width="0.8"/>
      <text x="28" y="272" font-size="10.5" font-weight="600" fill="#FDE68A">🛡️ Room Turnover Automation:</text>
      <text x="28" y="292" font-size="10" fill="#FEF3C7">Saat booking berakhir, sistem otomatis meng-generate tugas pembersihan di patrol_logs &amp; tasks untuk cleaner.</text>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(60, 1420)">
    <text x="0" y="0" font-size="11" fill="#64748B">KostKu Relational Database ERD Specification · Crow's Foot Cardinality Notation · Architectural Blueprint</text>
    <text x="1800" y="0" font-size="11" fill="#64748B" text-anchor="end">Internal Engineering Documentation v1.1.0</text>
  </g>
</svg>`;
}

// Write DFD SVG
const dfdSvg = generateDfdSvg();
const dfdPath = '/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_dfd.svg';
fs.writeFileSync(dfdPath, dfdSvg, 'utf8');
console.log('Successfully written DFD SVG to:', dfdPath);

// Also copy to artifact dir
const artifactDir = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';
fs.writeFileSync(path.join(artifactDir, 'kostku_dfd.svg'), dfdSvg, 'utf8');

// Write ERD SVG
const erdSvg = generateErdSvg();
const erdPath = '/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_erd.svg';
fs.writeFileSync(erdPath, erdSvg, 'utf8');
console.log('Successfully written ERD SVG to:', erdPath);

fs.writeFileSync(path.join(artifactDir, 'kostku_erd.svg'), erdSvg, 'utf8');
console.log('All DFD & ERD SVGs successfully generated and saved to docs/assets/diagrams!');
