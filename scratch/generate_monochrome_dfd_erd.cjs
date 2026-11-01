// scratch/generate_monochrome_dfd_erd.cjs
// Script to generate 100% standard academic MONOCHROME (black & white) DFD and ERD diagrams
// Based on Yourdon & DeMarco notation (DFD) and Martin / Crow's Foot notation (ERD).
// Strictly for internal documentation in docs/assets/diagrams/ (NEVER in public/ or live web).

const fs = require('fs');
const path = require('path');

// =========================================================================
// 1. DFD (DATA FLOW DIAGRAM) LEVEL 0 & LEVEL 1 - PURE MONOCHROME
// Standard: Yourdon & DeMarco (Academic Textbook RPL / SKPL / IEEE / Kendall)
// Background: Pure White (#FFFFFF), Strokes & Text: Pure Black (#000000)
// =========================================================================
function generateMonochromeDfd() {
  const width = 1920;
  const height = 1520;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #FFFFFF; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
  <defs>
    <!-- Arrow Marker Pure Black -->
    <marker id="arrowBlack" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#000000"/>
    </marker>
    <!-- Arrow Marker Reverse (Read from Store) -->
    <marker id="arrowBlackRev" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 9 1.5 L 0 5 L 9 8.5 z" fill="#000000"/>
    </marker>
    <style>
      .halo-text {
        paint-order: stroke fill;
        stroke: #FFFFFF;
        stroke-width: 6px;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    </style>
  </defs>

  <!-- Canvas Background -->
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>

  <!-- ============================================================== -->
  <!-- HEADER STANDAR DOKUMEN SKPL / RPL                              -->
  <!-- ============================================================== -->
  <g transform="translate(60, 40)">
    <!-- Header Box -->
    <rect x="0" y="0" width="1800" height="70" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <line x1="1250" y1="0" x2="1250" y2="70" stroke="#000000" stroke-width="1.5"/>
    <line x1="1520" y1="0" x2="1520" y2="70" stroke="#000000" stroke-width="1.5"/>

    <text x="24" y="30" font-size="20" font-weight="900" fill="#000000" letter-spacing="0.5">DATA FLOW DIAGRAM (DFD) — KOSTKU SYSTEM</text>
    <text x="24" y="52" font-size="12" font-weight="500" fill="#000000">Standar Notasi Buku Teks: Yourdon &amp; DeMarco (Academic Monochrome Engineering Edition)</text>

    <text x="1265" y="28" font-size="10" font-weight="700" fill="#000000">DOKUMEN:</text>
    <text x="1265" y="48" font-size="12" font-weight="800" fill="#000000">SKPL / ARSITEKTUR</text>

    <text x="1535" y="28" font-size="10" font-weight="700" fill="#000000">LEVEL:</text>
    <text x="1535" y="48" font-size="12" font-weight="800" fill="#000000">LEVEL 0 &amp; LEVEL 1</text>
  </g>

  <!-- ============================================================== -->
  <!-- BAGIAN A: DFD LEVEL 0 (DIAGRAM KONTEKS STANDAR MONOKROM)        -->
  <!-- Kaidah: 1 Lingkaran Pusat (Proses 0), Entitas Kotak, NO STORE  -->
  <!-- ============================================================== -->
  <g transform="translate(60, 130)">
    <!-- Section Outer Frame -->
    <rect width="1800" height="470" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="380" height="28" fill="#000000"/>
    <text x="14" y="19" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="1">BAGIAN 1 · DFD LEVEL 0 (DIAGRAM KONTEKS)</text>

    <!-- ENTITAS EKSTERNAL (TERMINATOR: KOTAK PERSEGI PANJANG HITAM PUTIH) -->

    <!-- Entitas 1: Pencari Kost (Kiri Atas) -->
    <g transform="translate(40, 60)">
      <rect width="190" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <text x="95" y="28" font-size="13" font-weight="800" fill="#000000" text-anchor="middle">PENCARI KOST</text>
      <text x="95" y="44" font-size="9.5" fill="#000000" text-anchor="middle">(External Entity E1)</text>
    </g>

    <!-- Entitas 2: Anak Kost / Penghuni (Kiri Tengah) -->
    <g transform="translate(40, 205)">
      <rect width="190" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <text x="95" y="28" font-size="13" font-weight="800" fill="#000000" text-anchor="middle">PENGHUNI KOST</text>
      <text x="95" y="44" font-size="9.5" fill="#000000" text-anchor="middle">(External Entity E2)</text>
    </g>

    <!-- Entitas 3: Pemilik Kost / Owner (Kiri Bawah) -->
    <g transform="translate(40, 350)">
      <rect width="190" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <text x="95" y="28" font-size="13" font-weight="800" fill="#000000" text-anchor="middle">PEMILIK KOST</text>
      <text x="95" y="44" font-size="9.5" fill="#000000" text-anchor="middle">(External Entity E3)</text>
    </g>

    <!-- PROSES PUSAT: LINGKARAN BESAR STANDAR YOURDON & DEMARCO (TENGAH) -->
    <g transform="translate(900, 240)">
      <!-- Circle Process -->
      <circle cx="0" cy="0" r="110" fill="#FFFFFF" stroke="#000000" stroke-width="2.5"/>
      <line x1="-100" y1="-32" x2="100" y2="-32" stroke="#000000" stroke-width="1.5"/>
      <line x1="-100" y1="36" x2="100" y2="36" stroke="#000000" stroke-width="1.5"/>

      <!-- Process Number Top -->
      <text x="0" y="-48" font-size="18" font-weight="900" fill="#000000" text-anchor="middle">0</text>

      <!-- Process Name Center -->
      <text x="0" y="-10" font-size="14" font-weight="800" fill="#000000" text-anchor="middle">SISTEM INFORMASI</text>
      <text x="0" y="10" font-size="14" font-weight="800" fill="#000000" text-anchor="middle">&amp; MARKETPLACE</text>
      <text x="0" y="28" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">KOSTKU</text>

      <!-- Process Subtitle / System Boundary -->
      <text x="0" y="54" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">PROSES SISTEM PUSAT</text>
    </g>

    <!-- ENTITAS EKSTERNAL (KANAN) -->

    <!-- Entitas 4: Staf Operasional (Kanan Atas) -->
    <g transform="translate(1570, 45)">
      <rect width="190" height="55" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <text x="95" y="26" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">STAF OPERASIONAL</text>
      <text x="95" y="42" font-size="9.5" fill="#000000" text-anchor="middle">(External Entity E4)</text>
    </g>

    <!-- Entitas 5: Mitra UMKM (Kanan Tengah-Atas) -->
    <g transform="translate(1570, 145)">
      <rect width="190" height="55" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <text x="95" y="26" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">MITRA UMKM</text>
      <text x="95" y="42" font-size="9.5" fill="#000000" text-anchor="middle">(External Entity E5)</text>
    </g>

    <!-- Entitas 6: Payment Gateway (Kanan Tengah-Bawah) -->
    <g transform="translate(1570, 245)">
      <rect width="190" height="55" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <text x="95" y="26" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">PAYMENT GATEWAY</text>
      <text x="95" y="42" font-size="9.5" fill="#000000" text-anchor="middle">(External Entity E6)</text>
    </g>

    <!-- Entitas 7: WhatsApp Gateway (Kanan Bawah) -->
    <g transform="translate(1570, 345)">
      <rect width="190" height="55" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <text x="95" y="26" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">WHATSAPP GATEWAY</text>
      <text x="95" y="42" font-size="9.5" fill="#000000" text-anchor="middle">(External Entity E7)</text>
    </g>

    <!-- ARUS DATA LEVEL 0 (GARIS HITAM SOLID DENGAN ROUTING JELAS) -->
    <g stroke="#000000" stroke-width="1.4" fill="none">
      <!-- 1. Pencari Kost <-> Sistem -->
      <!-- Inflow: Form Pencarian, Booking Kamar -->
      <path d="M 230 75 L 530 75 L 805 170" marker-end="url(#arrowBlack)"/>
      <!-- Outflow: Info Kost, Bento 3D, Kuitansi Booking -->
      <path d="M 795 195 L 530 105 L 230 105" marker-end="url(#arrowBlack)"/>

      <!-- 2. Penghuni Kost <-> Sistem -->
      <!-- Inflow: Bayar Sewa, Order Menu Mitra, Tiket Komplain -->
      <path d="M 230 220 L 530 220 L 790 230" marker-end="url(#arrowBlack)"/>
      <!-- Outflow: Tagihan Sewa, Status Order, Solusi Komplain -->
      <path d="M 790 250 L 530 250 L 230 250" marker-end="url(#arrowBlack)"/>

      <!-- 3. Pemilik Kost <-> Sistem -->
      <!-- Inflow: Input Kamar, Setting Ads Mitra, Jadwal Staf -->
      <path d="M 230 365 L 530 365 L 805 305" marker-end="url(#arrowBlack)"/>
      <!-- Outflow: Laporan Okupansi, Buku Kas, Rekap Payout Mitra -->
      <path d="M 795 325 L 530 395 L 230 395" marker-end="url(#arrowBlack)"/>

      <!-- 4. Sistem <-> Staf Operasional -->
      <!-- Inflow: Presensi GPS, Scan QR Ronda, Laporan Tugas -->
      <path d="M 1570 65 L 1260 65 L 995 170" marker-end="url(#arrowBlack)"/>
      <!-- Outflow: Validasi Presensi, Jadwal Ronda, Tiket Servis -->
      <path d="M 1005 190 L 1260 90 L 1570 90" marker-end="url(#arrowBlack)"/>

      <!-- 5. Sistem <-> Mitra UMKM -->
      <!-- Inflow: Data Menu & Logo, Konfirmasi Order, Bukti Antar -->
      <path d="M 1570 160 L 1260 160 L 1008 215" marker-end="url(#arrowBlack)"/>
      <!-- Outflow: Notifikasi Order Masuk, Rekap Settlement Bersih -->
      <path d="M 1008 235 L 1260 185 L 1570 185" marker-end="url(#arrowBlack)"/>

      <!-- 6. Sistem <-> Payment Gateway -->
      <!-- Outflow: Request Dynamic QRIS ASPI, Instruksi Split Payout -->
      <path d="M 1008 255 L 1260 260 L 1570 260" marker-end="url(#arrowBlack)"/>
      <!-- Inflow: Callback Webhook Lunas QRIS, Konfirmasi Payout Bank -->
      <path d="M 1570 285 L 1260 285 L 998 275" marker-end="url(#arrowBlack)"/>

      <!-- 7. Sistem -> WhatsApp Gateway -->
      <!-- Outflow: Broadcast Billing Pengingat (H-3 s/d Denda), Kuitansi PDF -->
      <path d="M 985 295 L 1260 365 L 1570 365" marker-end="url(#arrowBlack)"/>
    </g>

    <!-- DATA FLOW LABELS (TEKS HITAM DENGAN HALO PUTIH ANTI-TABRAKAN) -->
    <!-- Kiri (User/Owner) -->
    <text class="halo-text" x="380" y="68" font-size="10" font-weight="700" fill="#000000">Data Pencarian, Form Booking Kamar</text>
    <text class="halo-text" x="380" y="118" font-size="10" font-weight="700" fill="#000000">Katalog Kamar, Tur Bento 3D, Kuitansi Booking</text>

    <text class="halo-text" x="380" y="214" font-size="10" font-weight="700" fill="#000000">Pembayaran Sewa, Order Menu Mitra, Tiket Komplain</text>
    <text class="halo-text" x="380" y="264" font-size="10" font-weight="700" fill="#000000">E-Bill Tagihan, Status Pesanan, Solusi Komplain</text>

    <text class="halo-text" x="380" y="358" font-size="10" font-weight="700" fill="#000000">Input Kamar, Tarif, Setting % Ads Mitra, Shift Staf</text>
    <text class="halo-text" x="380" y="408" font-size="10" font-weight="700" fill="#000000">Laporan Okupansi, Buku Kas, Rekap Payout Mitra</text>

    <!-- Kanan (Staf/Mitra/Gateway) -->
    <text class="halo-text" x="1400" y="58" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">Presensi GPS, Scan QR Ronda, Laporan Tugas Selesai</text>
    <text class="halo-text" x="1400" y="105" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">Verifikasi Anti-Mock, Jadwal Ronda, Tiket Servis</text>

    <text class="halo-text" x="1400" y="152" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">Katalog Menu &amp; Logo, Konfirmasi Order, Bukti Antar</text>
    <text class="halo-text" x="1400" y="198" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">Notifikasi Order Baru Masuk, Settlement Dana Bersih</text>

    <text class="halo-text" x="1400" y="252" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">Request Dynamic ASPI QRIS, Instruksi Payout Disburse</text>
    <text class="halo-text" x="1400" y="298" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">Callback Webhook Lunas QRIS, Konfirmasi Payout Bank</text>

    <text class="halo-text" x="1400" y="356" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">Broadcast Billing Pengingat (H-3 s/d Denda), Kuitansi PDF</text>
  </g>

  <!-- ============================================================== -->
  <!-- BAGIAN B: DFD LEVEL 1 (DEKOMPOSISI FUNGSIONAL & DATA STORE)    -->
  <!-- Kaidah: Lingkaran Proses 1.0 - 6.0, Data Store Garis Paralel = -->
  <!-- ============================================================== -->
  <g transform="translate(60, 620)">
    <rect width="1800" height="850" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="460" height="28" fill="#000000"/>
    <text x="14" y="19" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="1">BAGIAN 2 · DFD LEVEL 1 (DEKOMPOSISI PROSES &amp; DATA STORE)</text>

    <!-- KOLOM KIRI: 6 PROSES (LINGKARAN STANDAR YOURDON & DEMARCO DENGAN RADIUS 54PX) -->

    <!-- Proses 1.0 -->
    <g transform="translate(180, 105)">
      <circle cx="0" cy="0" r="54" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <line x1="-52" y1="-14" x2="52" y2="-14" stroke="#000000" stroke-width="1.5"/>
      <text x="0" y="-24" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">1.0</text>
      <text x="0" y="6" font-size="10.5" font-weight="800" fill="#000000" text-anchor="middle">AUTENTIKASI &amp;</text>
      <text x="0" y="22" font-size="10.5" font-weight="800" fill="#000000" text-anchor="middle">AKUN USER</text>
    </g>

    <!-- Proses 2.0 -->
    <g transform="translate(180, 230)">
      <circle cx="0" cy="0" r="54" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <line x1="-52" y1="-14" x2="52" y2="-14" stroke="#000000" stroke-width="1.5"/>
      <text x="0" y="-24" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">2.0</text>
      <text x="0" y="6" font-size="10.5" font-weight="800" fill="#000000" text-anchor="middle">KATALOG KAMAR</text>
      <text x="0" y="22" font-size="10.5" font-weight="800" fill="#000000" text-anchor="middle">&amp; BENTO 3D</text>
    </g>

    <!-- Proses 3.0 -->
    <g transform="translate(180, 355)">
      <circle cx="0" cy="0" r="54" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <line x1="-52" y1="-14" x2="52" y2="-14" stroke="#000000" stroke-width="1.5"/>
      <text x="0" y="-24" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">3.0</text>
      <text x="0" y="6" font-size="10" font-weight="800" fill="#000000" text-anchor="middle">BOOKING LOCK &amp;</text>
      <text x="0" y="22" font-size="10" font-weight="800" fill="#000000" text-anchor="middle">KONTRAK SEWA</text>
    </g>

    <!-- Proses 4.0 -->
    <g transform="translate(180, 480)">
      <circle cx="0" cy="0" r="54" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <line x1="-52" y1="-14" x2="52" y2="-14" stroke="#000000" stroke-width="1.5"/>
      <text x="0" y="-24" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">4.0</text>
      <text x="0" y="6" font-size="10.5" font-weight="800" fill="#000000" text-anchor="middle">INVOICING SEWA</text>
      <text x="0" y="22" font-size="10.5" font-weight="800" fill="#000000" text-anchor="middle">&amp; QRIS ASPI</text>
    </g>

    <!-- Proses 5.0 -->
    <g transform="translate(180, 605)">
      <circle cx="0" cy="0" r="54" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <line x1="-52" y1="-14" x2="52" y2="-14" stroke="#000000" stroke-width="1.5"/>
      <text x="0" y="-24" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">5.0</text>
      <text x="0" y="6" font-size="10" font-weight="800" fill="#000000" text-anchor="middle">ORDER MITRA &amp;</text>
      <text x="0" y="22" font-size="10" font-weight="800" fill="#000000" text-anchor="middle">SPLIT FEE OWNER</text>
    </g>

    <!-- Proses 6.0 -->
    <g transform="translate(180, 730)">
      <circle cx="0" cy="0" r="54" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <line x1="-52" y1="-14" x2="52" y2="-14" stroke="#000000" stroke-width="1.5"/>
      <text x="0" y="-24" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">6.0</text>
      <text x="0" y="6" font-size="10" font-weight="800" fill="#000000" text-anchor="middle">PRESENSI GPS &amp;</text>
      <text x="0" y="22" font-size="10" font-weight="800" fill="#000000" text-anchor="middle">PATROLI QR</text>
    </g>

    <!-- KOLOM TENGAH: 7 DATA STORE (STANDAR DUA GARIS PARALEL TERBUKA) -->

    <!-- Store D1: Data Pengguna -->
    <g transform="translate(450, 80)">
      <line x1="0" y1="0" x2="440" y2="0" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="50" x2="440" y2="50" stroke="#000000" stroke-width="2"/>
      <line x1="60" y1="0" x2="60" y2="50" stroke="#000000" stroke-width="1.5"/>
      <text x="30" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">D1</text>
      <text x="75" y="22" font-size="12" font-weight="800" fill="#000000">DATA PENGGUNA &amp; PROFIL HAK AKSES</text>
      <text x="75" y="38" font-size="10" fill="#000000">id, nama, email, phone, role, password_hash, wallet_balance</text>
    </g>

    <!-- Store D2: Data Kost & Kamar -->
    <g transform="translate(450, 185)">
      <line x1="0" y1="0" x2="440" y2="0" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="50" x2="440" y2="50" stroke="#000000" stroke-width="2"/>
      <line x1="60" y1="0" x2="60" y2="50" stroke="#000000" stroke-width="1.5"/>
      <text x="30" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">D2</text>
      <text x="75" y="22" font-size="12" font-weight="800" fill="#000000">DATA PROPERTI KOST &amp; UNIT KAMAR</text>
      <text x="75" y="38" font-size="10" fill="#000000">kost_uid, owner_id, room_number, price, status, bento_spatial</text>
    </g>

    <!-- Store D3: Data Booking & Kontrak -->
    <g transform="translate(450, 290)">
      <line x1="0" y1="0" x2="440" y2="0" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="50" x2="440" y2="50" stroke="#000000" stroke-width="2"/>
      <line x1="60" y1="0" x2="60" y2="50" stroke="#000000" stroke-width="1.5"/>
      <text x="30" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">D3</text>
      <text x="75" y="22" font-size="12" font-weight="800" fill="#000000">DATA BOOKING, SEWA &amp; KONTRAK DIGITAL</text>
      <text x="75" y="38" font-size="10" fill="#000000">booking_id, room_id, user_id, lock_timer, contract_pdf_url</text>
    </g>

    <!-- Store D4: Data Invoicing & Tagihan -->
    <g transform="translate(450, 395)">
      <line x1="0" y1="0" x2="440" y2="0" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="50" x2="440" y2="50" stroke="#000000" stroke-width="2"/>
      <line x1="60" y1="0" x2="60" y2="50" stroke="#000000" stroke-width="1.5"/>
      <text x="30" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">D4</text>
      <text x="75" y="22" font-size="12" font-weight="800" fill="#000000">DATA INVOICING, TAGIHAN &amp; QRIS</text>
      <text x="75" y="38" font-size="10" fill="#000000">invoice_id, base_price, denda, total, status_bayar, qris_ref</text>
    </g>

    <!-- Store D5: Data Mitra, Menu & Orders -->
    <g transform="translate(450, 500)">
      <line x1="0" y1="0" x2="440" y2="0" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="50" x2="440" y2="50" stroke="#000000" stroke-width="2"/>
      <line x1="60" y1="0" x2="60" y2="50" stroke="#000000" stroke-width="1.5"/>
      <text x="30" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">D5</text>
      <text x="75" y="22" font-size="12" font-weight="800" fill="#000000">DATA MITRA, MENU &amp; ORDER SPLIT</text>
      <text x="75" y="38" font-size="10" fill="#000000">mitra_id, origin_owner_id, delivery_fee, flat_fee_500, ads_cut</text>
    </g>

    <!-- Store D6: Data Presensi, Patroli & Tugas -->
    <g transform="translate(450, 605)">
      <line x1="0" y1="0" x2="440" y2="0" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="50" x2="440" y2="50" stroke="#000000" stroke-width="2"/>
      <line x1="60" y1="0" x2="60" y2="50" stroke="#000000" stroke-width="1.5"/>
      <text x="30" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">D6</text>
      <text x="75" y="22" font-size="12" font-weight="800" fill="#000000">DATA PRESENSI, PATROLI &amp; TUGAS STAF</text>
      <text x="75" y="38" font-size="10" fill="#000000">attendance_id, mock_flag, qr_hash, checkpoint, foto_inspeksi</text>
    </g>

    <!-- Store D7: Buku Kas & Payout -->
    <g transform="translate(450, 710)">
      <line x1="0" y1="0" x2="440" y2="0" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="50" x2="440" y2="50" stroke="#000000" stroke-width="2"/>
      <line x1="60" y1="0" x2="60" y2="50" stroke="#000000" stroke-width="1.5"/>
      <text x="30" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">D7</text>
      <text x="75" y="22" font-size="12" font-weight="800" fill="#000000">BUKU KAS, MUTASI &amp; DISBURSEMENT PAYOUT</text>
      <text x="75" y="38" font-size="10" fill="#000000">ledger_id, tipe_mutasi, nominal, flip_tripay_ref, status_payout</text>
    </g>

    <!-- ARROWS PROCESS TO STORES (READ & WRITE ALIRAN DATA DENGAN MARKER DUA ARAH) -->
    <g stroke="#000000" stroke-width="1.4" fill="none">
      <!-- 1.0 <-> D1 (Read User Data & Update User) -->
      <path d="M 235 105 L 450 105" marker-start="url(#arrowBlackRev)" marker-end="url(#arrowBlack)"/>
      
      <!-- 2.0 <-> D2 (Read Rooms & Write Room Catalog) -->
      <path d="M 235 230 L 450 210" marker-start="url(#arrowBlackRev)" marker-end="url(#arrowBlack)"/>
      
      <!-- 3.0 <-> D2 (Read Room Status) & D3 (Write Booking Contract) -->
      <path d="M 235 345 L 340 345 L 450 225" marker-end="url(#arrowBlack)"/>
      <path d="M 235 365 L 340 365 L 450 315" marker-end="url(#arrowBlack)"/>
      
      <!-- 4.0 <-> D3 (Read Booking) & D4 (Write Invoice) & D7 (Write Kas Masuk) -->
      <path d="M 235 470 L 330 470 L 450 325" marker-start="url(#arrowBlackRev)"/>
      <path d="M 235 480 L 450 420" marker-end="url(#arrowBlack)"/>
      <path d="M 225 505 L 340 505 L 340 735 L 450 735" marker-end="url(#arrowBlack)"/>
      
      <!-- 5.0 <-> D5 (Read Menu / Write Order) & D7 (Write Split Fee & Payout) -->
      <path d="M 235 605 L 450 525" marker-start="url(#arrowBlackRev)" marker-end="url(#arrowBlack)"/>
      <path d="M 225 625 L 360 625 L 360 725 L 450 725" marker-end="url(#arrowBlack)"/>
      
      <!-- 6.0 <-> D6 (Read Shift / Write Attendance & Patrol Log) -->
      <path d="M 235 730 L 450 630" marker-start="url(#arrowBlackRev)" marker-end="url(#arrowBlack)"/>
    </g>

    <!-- KOLOM KANAN: MATRIKS DETAIL ALIRAN DATA MASUK & KELUAR -->
    <g transform="translate(940, 80)">
      <rect width="820" height="715" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>

      <!-- Table Header -->
      <rect x="0" y="0" width="820" height="32" fill="#000000"/>
      <text x="14" y="21" font-size="11" font-weight="900" fill="#FFFFFF">ID</text>
      <text x="60" y="21" font-size="11" font-weight="900" fill="#FFFFFF">NAMA PROSES</text>
      <text x="280" y="21" font-size="11" font-weight="900" fill="#FFFFFF">INPUT (DARI)</text>
      <text x="540" y="21" font-size="11" font-weight="900" fill="#FFFFFF">OUTPUT (MENUJU)</text>

      <!-- Table Rows (Black and White Borders) -->
      <!-- Row 1.0 -->
      <g transform="translate(0, 32)">
        <text x="14" y="24" font-size="11" font-weight="900" fill="#000000">1.0</text>
        <text x="60" y="24" font-size="11" font-weight="700" fill="#000000">Autentikasi &amp; Akun User</text>
        <text x="280" y="18" font-size="10" fill="#000000">• Kredensial User (E1-E5)</text>
        <text x="280" y="32" font-size="10" fill="#000000">• Data User (D1)</text>
        <text x="540" y="18" font-size="10" fill="#000000">• Token JWT, Profil User (E1-E5)</text>
        <text x="540" y="32" font-size="10" fill="#000000">• Update Record User (D1)</text>
        <line x1="0" y1="46" x2="820" y2="46" stroke="#000000" stroke-width="1"/>
      </g>

      <!-- Row 2.0 -->
      <g transform="translate(0, 78)">
        <text x="14" y="24" font-size="11" font-weight="900" fill="#000000">2.0</text>
        <text x="60" y="24" font-size="11" font-weight="700" fill="#000000">Katalog Kamar &amp; Bento 3D</text>
        <text x="280" y="18" font-size="10" fill="#000000">• Form Kamar (E3 Owner)</text>
        <text x="280" y="32" font-size="10" fill="#000000">• Filter Kamar (E1 Pencari)</text>
        <text x="540" y="18" font-size="10" fill="#000000">• Simpan Kamar (D2)</text>
        <text x="540" y="32" font-size="10" fill="#000000">• Tampilan Bento 3D (E1 Pencari)</text>
        <line x1="0" y1="46" x2="820" y2="46" stroke="#000000" stroke-width="1"/>
      </g>

      <!-- Row 3.0 -->
      <g transform="translate(0, 124)">
        <text x="14" y="24" font-size="11" font-weight="900" fill="#000000">3.0</text>
        <text x="60" y="24" font-size="11" font-weight="700" fill="#000000">Booking Lock &amp; Kontrak</text>
        <text x="280" y="18" font-size="10" fill="#000000">• Pengajuan Booking (E1)</text>
        <text x="280" y="32" font-size="10" fill="#000000">• Status Kamar (D2)</text>
        <text x="540" y="18" font-size="10" fill="#000000">• 15-Min Lock Status (D2)</text>
        <text x="540" y="32" font-size="10" fill="#000000">• Surat Kontrak PDF (D3, E1)</text>
        <line x1="0" y1="46" x2="820" y2="46" stroke="#000000" stroke-width="1"/>
      </g>

      <!-- Row 4.0 -->
      <g transform="translate(0, 170)">
        <text x="14" y="24" font-size="11" font-weight="900" fill="#000000">4.0</text>
        <text x="60" y="24" font-size="11" font-weight="700" fill="#000000">Invoicing Sewa &amp; QRIS</text>
        <text x="280" y="18" font-size="10" fill="#000000">• Jadwal Jatuh Tempo (D3)</text>
        <text x="280" y="32" font-size="10" fill="#000000">• Callback Lunas (E6 PG)</text>
        <text x="540" y="18" font-size="10" fill="#000000">• E-Bill &amp; Denda Harian (D4, E2, E7)</text>
        <text x="540" y="32" font-size="10" fill="#000000">• Kas Masuk Sewa (D7)</text>
        <line x1="0" y1="46" x2="820" y2="46" stroke="#000000" stroke-width="1"/>
      </g>

      <!-- Row 5.0 -->
      <g transform="translate(0, 216)">
        <text x="14" y="24" font-size="11" font-weight="900" fill="#000000">5.0</text>
        <text x="60" y="24" font-size="11" font-weight="700" fill="#000000">Order Mitra &amp; Split Fee</text>
        <text x="280" y="18" font-size="10" fill="#000000">• Cart &amp; Titik Antar (E2)</text>
        <text x="280" y="32" font-size="10" fill="#000000">• Koordinat Mitra (D5)</text>
        <text x="540" y="18" font-size="10" fill="#000000">• Order Baru Masuk (D5, E5)</text>
        <text x="540" y="32" font-size="10" fill="#000000">• Split Rp 500, Ads Cut, Driver (D7)</text>
        <line x1="0" y1="46" x2="820" y2="46" stroke="#000000" stroke-width="1"/>
      </g>

      <!-- Row 6.0 -->
      <g transform="translate(0, 262)">
        <text x="14" y="24" font-size="11" font-weight="900" fill="#000000">6.0</text>
        <text x="60" y="24" font-size="11" font-weight="700" fill="#000000">Presensi GPS &amp; Patroli QR</text>
        <text x="280" y="18" font-size="10" fill="#000000">• Geofence &amp; Selfie (E4)</text>
        <text x="280" y="32" font-size="10" fill="#000000">• Scan QR Checkpoint (E4)</text>
        <text x="540" y="18" font-size="10" fill="#000000">• Presensi Valid (D6)</text>
        <text x="540" y="32" font-size="10" fill="#000000">• Log Ronda &amp; Task Selesai (D6, E3)</text>
        <line x1="0" y1="46" x2="820" y2="46" stroke="#000000" stroke-width="1"/>
      </g>

      <!-- Technical Engineering Notes -->
      <g transform="translate(20, 325)">
        <rect width="780" height="360" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
        <text x="20" y="28" font-size="13" font-weight="900" fill="#000000">KAIDAH &amp; ATURAN FORMAL DFD SISTEM KOSTKU (BUKU TEKS TEKNIK)</text>

        <text x="20" y="58" font-size="11" font-weight="800" fill="#000000">1. Konvensi Penamaan &amp; Simbol Yourdon &amp; DeMarco:</text>
        <text x="20" y="76" font-size="10.5" fill="#000000">• Entitas Luar (Terminator E1-E7) disimbolkan dengan Persegi Panjang (Rectangle).</text>
        <text x="20" y="94" font-size="10.5" fill="#000000">• Proses (0 &amp; 1.0-6.0) disimbolkan dengan Lingkaran (Circle / Bubble) bergaris pemisah nomor proses.</text>
        <text x="20" y="112" font-size="10.5" fill="#000000">• Penyimpanan Data (Data Store D1-D7) disimbolkan dengan Dua Garis Horizontal Terbuka (=).</text>
        <text x="20" y="130" font-size="10.5" fill="#000000">• Aliran Data (Data Flow) disimbolkan dengan Panah Berarah (Arrow) disertai label nama data (noun phrase).</text>

        <text x="20" y="158" font-size="11" font-weight="800" fill="#000000">2. Integritas Diagram Konteks &amp; Konservasi Aliran Data (Balancing Rule):</text>
        <text x="20" y="176" font-size="10.5" fill="#000000">• Tidak ada Data Store pada Diagram Konteks (Level 0) karena hanya fokus pada batas sistem luar.</text>
        <text x="20" y="194" font-size="10.5" fill="#000000">• Setiap aliran data dari entitas luar pada Level 0 terdistribusi konsisten ke sub-proses Level 1 (Balancing Rule).</text>
        <text x="20" y="212" font-size="10.5" fill="#000000">• Menolak Black Hole (proses tanpa output), Miracle (proses tanpa input), dan Grey Hole (input tidak mencukupi).</text>

        <text x="20" y="240" font-size="11" font-weight="800" fill="#000000">3. Logika Khusus Multi-Owner &amp; Tiered Delivery (Proses 5.0):</text>
        <text x="20" y="258" font-size="10.5" fill="#000000">• Pemesanan mitra membaca koordinat toko dan kost untuk menentukan ongkir bertingkat:</text>
        <text x="35" y="276" font-size="10.5" font-weight="700" fill="#000000">Jarak ≤ 2 km = Rp 2.000 | Jarak > 2 km = Rp 2.000 + (jarak - 2) * Rp 2.500/km.</text>
        <text x="20" y="294" font-size="10.5" fill="#000000">• Flat platform fee Rp 500 disatukan transparan ke invoice checkout QRIS.</text>
        <text x="20" y="312" font-size="10.5" fill="#000000">• Potongan Ads Cut owner otomatis dialirkan ke rekening wallet pemilik toko aslinya (origin_owner_id).</text>
        <text x="20" y="330" font-size="10.5" fill="#000000">• Driver menerima 100% ongkir tanpa potongan komisi sepeser pun.</text>
      </g>
    </g>
  </g>

  <!-- Footer Etiket Standar Teknik -->
  <g transform="translate(60, 1485)">
    <text x="0" y="0" font-size="11" font-weight="700" fill="#000000">KEMENTERIAN PENDIDIKAN / REKAYASA PERANGKAT LUNAK · DIAGRAM ALIR DATA RESMI (MONOCHROME SPECIFICATION)</text>
    <text x="1800" y="0" font-size="11" font-weight="700" fill="#000000" text-anchor="end">STATUS: FINAL VERIFIED · REVISI 2.0.0 (MONOCHROME TEXTBOOK EDITION)</text>
  </g>
</svg>`;
}

// =========================================================================
// 2. ERD (ENTITY RELATIONSHIP DIAGRAM) - PURE MONOCHROME
// Standard: Crow's Foot Notation (Martin / Finkelstein Notation)
// Strict Database Schema PostgreSQL / Supabase, Relational Connectors & Integrity
// =========================================================================
function generateMonochromeErd() {
  const width = 1920;
  const height = 1520;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #FFFFFF; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
  <defs>
    <!-- Crow's Foot Symbols / Custom Notation Markers -->
    <marker id="oneMandatory" viewBox="0 0 16 16" refX="8" refY="8" markerWidth="10" markerHeight="10" orient="auto">
      <line x1="5" y1="2" x2="5" y2="14" stroke="#000000" stroke-width="2"/>
      <line x1="10" y1="2" x2="10" y2="14" stroke="#000000" stroke-width="2"/>
    </marker>
    <marker id="crowFootMany" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="12" markerHeight="12" orient="auto">
      <path d="M 2 2 L 14 8 L 2 14" fill="none" stroke="#000000" stroke-width="2"/>
      <line x1="8" y1="2" x2="8" y2="14" stroke="#000000" stroke-width="1.8"/>
    </marker>
  </defs>

  <rect width="${width}" height="${height}" fill="#FFFFFF"/>

  <!-- HEADER BOX MONOKROM -->
  <g transform="translate(60, 40)">
    <rect x="0" y="0" width="1800" height="70" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <line x1="1250" y1="0" x2="1250" y2="70" stroke="#000000" stroke-width="1.5"/>
    <line x1="1520" y1="0" x2="1520" y2="70" stroke="#000000" stroke-width="1.5"/>

    <text x="24" y="30" font-size="20" font-weight="900" fill="#000000" letter-spacing="0.5">ENTITY RELATIONSHIP DIAGRAM (ERD) — KOSTKU DATABASE</text>
    <text x="24" y="52" font-size="12" font-weight="500" fill="#000000">Standar Notasi: Martin / Crow's Foot Relational Schema (PostgreSQL / Supabase ACID Compliant)</text>

    <text x="1265" y="28" font-size="10" font-weight="700" fill="#000000">DOKUMEN:</text>
    <text x="1265" y="48" font-size="12" font-weight="800" fill="#000000">SKPL / DATABASE ERD</text>

    <text x="1535" y="28" font-size="10" font-weight="700" fill="#000000">NOTASI:</text>
    <text x="1535" y="48" font-size="12" font-weight="800" fill="#000000">CROW'S FOOT (B&amp;W)</text>
  </g>

  <!-- ============================================================== -->
  <!-- BARIS 1 (Y: 130): USERS, KOSTS, ROOMS, BOOKINGS, INVOICES      -->
  <!-- ============================================================== -->

  <!-- TBL 1: USERS -->
  <g transform="translate(60, 130)">
    <rect width="280" height="260" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">USERS (Tabel Pengguna)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="54" font-size="11" fill="#000000">name</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">VARCHAR(255)</text>

      <text x="30" y="74" font-size="11" fill="#000000">email</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">VARCHAR(255) U</text>

      <text x="30" y="94" font-size="11" fill="#000000">phone / nik</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="114" font-size="11" fill="#000000">password_hash</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="134" font-size="11" font-weight="700" fill="#000000">role</text>
      <text x="180" y="134" font-size="10.5" fill="#000000">VARCHAR(30)</text>

      <text x="30" y="154" font-size="11" fill="#000000">kamar_no</text>
      <text x="180" y="154" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="174" font-size="11" fill="#000000">wallet_balance</text>
      <text x="180" y="174" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="194" font-size="10" fill="#000000">created_at</text>
      <text x="180" y="194" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 2: KOSTS -->
  <g transform="translate(420, 130)">
    <rect width="280" height="260" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">KOSTS (Properti Kost)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id / uid</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID / VARCHAR</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">owner_id</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">UUID (Users)</text>

      <text x="30" y="54" font-size="11" fill="#000000">kost_name</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">VARCHAR(255)</text>

      <text x="30" y="74" font-size="11" fill="#000000">address</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="94" font-size="11" font-weight="700" fill="#000000">lat, lng</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">DOUBLE PREC</text>

      <text x="30" y="114" font-size="11" fill="#000000">water_rate</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="134" font-size="11" fill="#000000">electricity_rate</text>
      <text x="180" y="134" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="154" font-size="11" fill="#000000">deposit_amount</text>
      <text x="180" y="154" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="174" font-size="11" fill="#000000">bento_layout</text>
      <text x="180" y="174" font-size="10.5" fill="#000000">JSONB</text>

      <text x="30" y="194" font-size="10" fill="#000000">created_at</text>
      <text x="180" y="194" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 3: ROOMS -->
  <g transform="translate(780, 130)">
    <rect width="280" height="260" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">ROOMS (Kamar Kost)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="54" font-size="11" fill="#000000">room_number</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="74" font-size="11" fill="#000000">price</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="94" font-size="11" fill="#000000">capacity</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">INT</text>

      <text x="30" y="114" font-size="11" fill="#000000">facilities</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">TEXT[]</text>

      <text x="30" y="134" font-size="11" font-weight="700" fill="#000000">status</text>
      <text x="180" y="134" font-size="10.5" fill="#000000">VARCHAR(30)</text>

      <text x="30" y="154" font-size="11" fill="#000000">smart_lock_pin</text>
      <text x="180" y="154" font-size="10.5" fill="#000000">VARCHAR(20)</text>

      <text x="30" y="174" font-size="11" fill="#000000">bento_spatial_data</text>
      <text x="180" y="174" font-size="10.5" fill="#000000">JSONB</text>

      <text x="30" y="194" font-size="10" fill="#000000">created_at</text>
      <text x="180" y="194" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 4: BOOKINGS -->
  <g transform="translate(1140, 130)">
    <rect width="280" height="260" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">BOOKINGS (Reservasi)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">room_id</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">UUID (Rooms)</text>

      <text x="0" y="54" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="54" font-size="11" fill="#000000">user_id</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">UUID (Users)</text>

      <text x="30" y="74" font-size="11" fill="#000000">start_date</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">DATE</text>

      <text x="30" y="94" font-size="11" fill="#000000">duration_months</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">INT</text>

      <text x="30" y="114" font-size="11" fill="#000000">total_amount</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="134" font-size="11" font-weight="700" fill="#000000">lock_expires_at</text>
      <text x="180" y="134" font-size="10.5" fill="#000000">TIMESTAMPTZ</text>

      <text x="30" y="154" font-size="11" fill="#000000">contract_pdf_url</text>
      <text x="180" y="154" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="174" font-size="11" fill="#000000">status</text>
      <text x="180" y="174" font-size="10.5" fill="#000000">VARCHAR(30)</text>

      <text x="30" y="194" font-size="10" fill="#000000">created_at</text>
      <text x="180" y="194" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 5: INVOICES -->
  <g transform="translate(1500, 130)">
    <rect width="360" height="260" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="360" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">INVOICES (Tagihan Sewa)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="240" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">kost_uid / user_id</text>
      <text x="240" y="34" font-size="10.5" fill="#000000">VARCHAR / UUID</text>

      <text x="30" y="54" font-size="11" fill="#000000">base_price, deposit</text>
      <text x="240" y="54" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="74" font-size="11" fill="#000000">water_cost, electricity_cost</text>
      <text x="240" y="74" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="94" font-size="11" font-weight="700" fill="#000000">late_fee_denda</text>
      <text x="240" y="94" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="114" font-size="11" font-weight="700" fill="#000000">total</text>
      <text x="240" y="114" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="134" font-size="11" fill="#000000">status ('pending', 'lunas')</text>
      <text x="240" y="134" font-size="10.5" fill="#000000">VARCHAR(30)</text>

      <text x="30" y="154" font-size="11" fill="#000000">qris_transaction_id</text>
      <text x="240" y="154" font-size="10.5" fill="#000000">VARCHAR(100)</text>

      <text x="30" y="174" font-size="11" fill="#000000">due_date / verify_date</text>
      <text x="240" y="174" font-size="10.5" fill="#000000">TIMESTAMPTZ</text>

      <text x="30" y="194" font-size="10" fill="#000000">created_at</text>
      <text x="240" y="194" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ============================================================== -->
  <!-- BARIS 2 (Y: 430): MITRA, OWNER CONFIGS, MENU, ORDERS, LEDGER   -->
  <!-- ============================================================== -->

  <!-- TBL 6: MITRA_SHOPS -->
  <g transform="translate(60, 430)">
    <rect width="320" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="320" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">MITRA_SHOPS (Toko Vendor Mitra)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="210" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">vendor_user_id</text>
      <text x="210" y="34" font-size="10.5" fill="#000000">UUID (Users)</text>

      <text x="0" y="54" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="54" font-size="11" font-weight="900" fill="#000000">origin_owner_id</text>
      <text x="210" y="54" font-size="10.5" fill="#000000">UUID (Users)</text>

      <text x="30" y="74" font-size="11" fill="#000000">shop_name, category</text>
      <text x="210" y="74" font-size="10.5" fill="#000000">VARCHAR(100)</text>

      <text x="30" y="94" font-size="11" fill="#000000">logo_url, banner_url</text>
      <text x="210" y="94" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="114" font-size="11" font-weight="700" fill="#000000">is_mitra_utama</text>
      <text x="210" y="114" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="134" font-size="11" fill="#000000">lat, lng (Koordinat Toko)</text>
      <text x="210" y="134" font-size="10.5" fill="#000000">DOUBLE PREC</text>

      <text x="30" y="154" font-size="11" fill="#000000">status_buka</text>
      <text x="210" y="154" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="174" font-size="10" fill="#000000">created_at</text>
      <text x="210" y="174" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 7: MITRA_OWNER_CONFIGS -->
  <g transform="translate(420, 430)">
    <rect width="280" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">MITRA_OWNER_CONFIGS</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="0" y="54" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="54" font-size="11" fill="#000000">mitra_shop_id</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">UUID (Shops)</text>

      <text x="30" y="74" font-size="11" font-weight="700" fill="#000000">custom_ads_pct</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">NUMERIC (10%)</text>

      <text x="30" y="94" font-size="11" fill="#000000">is_pinned_top</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="114" font-size="11" fill="#000000">is_cross_listed</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="134" font-size="10" fill="#000000">updated_at</text>
      <text x="180" y="134" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 8: MENU_ITEMS -->
  <g transform="translate(740, 430)">
    <rect width="280" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">MENU_ITEMS (Katalog Produk)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">mitra_shop_id</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">UUID (Shops)</text>

      <text x="30" y="54" font-size="11" fill="#000000">item_name</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">VARCHAR(255)</text>

      <text x="30" y="74" font-size="11" fill="#000000">price</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="94" font-size="11" fill="#000000">image_url</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="114" font-size="11" fill="#000000">is_available</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="134" font-size="10" fill="#000000">created_at</text>
      <text x="180" y="134" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 9: MITRA_ORDERS -->
  <g transform="translate(1060, 430)">
    <rect width="360" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="360" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">MITRA_ORDERS (Pesanan &amp; Split)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="240" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">user_id / shop_id</text>
      <text x="240" y="34" font-size="10.5" fill="#000000">UUID / UUID</text>

      <text x="0" y="54" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="54" font-size="11" font-weight="900" fill="#000000">origin_owner_id</text>
      <text x="240" y="54" font-size="10.5" fill="#000000">UUID (Users)</text>

      <text x="30" y="74" font-size="11" fill="#000000">subtotal_menu</text>
      <text x="240" y="74" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="94" font-size="11" font-weight="700" fill="#000000">delivery_fee (Tiered)</text>
      <text x="240" y="94" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="114" font-size="11" font-weight="900" fill="#000000">flat_platform_fee</text>
      <text x="240" y="114" font-size="10.5" fill="#000000">NUMERIC (500)</text>

      <text x="30" y="134" font-size="11" font-weight="700" fill="#000000">owner_ads_cut</text>
      <text x="240" y="134" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="154" font-size="11" font-weight="900" fill="#000000">total_paid</text>
      <text x="240" y="154" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="174" font-size="11" fill="#000000">distance_km, status</text>
      <text x="240" y="174" font-size="10.5" fill="#000000">NUMERIC, VARCHAR</text>
    </g>
  </g>

  <!-- TBL 10: CASHFLOW_LEDGER -->
  <g transform="translate(1460, 430)">
    <rect width="400" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="400" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">CASHFLOW_LEDGER &amp; PAYOUTS</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="280" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">kost_uid / recipient_id</text>
      <text x="280" y="34" font-size="10.5" fill="#000000">VARCHAR / UUID</text>

      <text x="30" y="54" font-size="11" font-weight="700" fill="#000000">type ('inflow', 'outflow')</text>
      <text x="280" y="54" font-size="10.5" fill="#000000">VARCHAR(30)</text>

      <text x="30" y="74" font-size="11" fill="#000000">category ('sewa', 'ads', 'payout')</text>
      <text x="280" y="74" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="94" font-size="11" font-weight="900" fill="#000000">amount</text>
      <text x="280" y="94" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="114" font-size="11" fill="#000000">payout_gateway ('flip', 'tripay')</text>
      <text x="280" y="114" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="134" font-size="11" fill="#000000">disbursement_status</text>
      <text x="280" y="134" font-size="10.5" fill="#000000">VARCHAR(30)</text>

      <text x="30" y="154" font-size="10" fill="#000000">timestamp / created_at</text>
      <text x="280" y="154" font-size="10" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ============================================================== -->
  <!-- BARIS 3 (Y: 720): STAFF, ATTENDANCE, CHECKPOINT, PATROL, COMPLAINT -->
  <!-- ============================================================== -->

  <!-- TBL 11: STAFF_PROFILES -->
  <g transform="translate(60, 720)">
    <rect width="280" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">STAFF_PROFILES (Profil Staf)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">user_id</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">UUID (Users)</text>

      <text x="0" y="54" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="54" font-size="11" fill="#000000">kost_uid</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="74" font-size="11" fill="#000000">job_title</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">VARCHAR(100)</text>

      <text x="30" y="94" font-size="11" fill="#000000">base_salary</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">NUMERIC</text>

      <text x="30" y="114" font-size="11" fill="#000000">shift_schedule</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="134" font-size="11" fill="#000000">is_active</text>
      <text x="180" y="134" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="154" font-size="10" fill="#000000">hired_at</text>
      <text x="180" y="154" font-size="10.5" fill="#000000">DATE</text>
    </g>
  </g>

  <!-- TBL 12: ATTENDANCES -->
  <g transform="translate(380, 720)">
    <rect width="320" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="320" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">ATTENDANCES (Presensi Anti-Mock)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="210" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">staff_id</text>
      <text x="210" y="34" font-size="10.5" fill="#000000">UUID (Staff)</text>

      <text x="30" y="54" font-size="11" fill="#000000">check_in_time</text>
      <text x="210" y="54" font-size="10.5" fill="#000000">TIMESTAMPTZ</text>

      <text x="30" y="74" font-size="11" fill="#000000">check_out_time</text>
      <text x="210" y="74" font-size="10.5" fill="#000000">TIMESTAMPTZ</text>

      <text x="30" y="94" font-size="11" font-weight="700" fill="#000000">lat, lng</text>
      <text x="210" y="94" font-size="10.5" fill="#000000">DOUBLE PREC</text>

      <text x="30" y="114" font-size="11" font-weight="900" fill="#000000">is_mock_location</text>
      <text x="210" y="114" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="134" font-size="11" fill="#000000">selfie_photo_url</text>
      <text x="210" y="134" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="154" font-size="11" font-weight="700" fill="#000000">status_valid</text>
      <text x="210" y="154" font-size="10.5" fill="#000000">VARCHAR(30)</text>
    </g>
  </g>

  <!-- TBL 13: PATROL_CHECKPOINTS -->
  <g transform="translate(740, 720)">
    <rect width="280" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">PATROL_CHECKPOINTS (Titik QR)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="180" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">kost_uid</text>
      <text x="180" y="34" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="54" font-size="11" fill="#000000">checkpoint_name</text>
      <text x="180" y="54" font-size="10.5" fill="#000000">VARCHAR(100)</text>

      <text x="30" y="74" font-size="11" font-weight="700" fill="#000000">qr_code_hash</text>
      <text x="180" y="74" font-size="10.5" fill="#000000">VARCHAR(255)</text>

      <text x="30" y="94" font-size="11" fill="#000000">location_spot</text>
      <text x="180" y="94" font-size="10.5" fill="#000000">VARCHAR(100)</text>

      <text x="30" y="114" font-size="11" fill="#000000">required_schedule</text>
      <text x="180" y="114" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="134" font-size="10" fill="#000000">created_at</text>
      <text x="180" y="134" font-size="10.5" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 14: PATROL_LOGS -->
  <g transform="translate(1060, 720)">
    <rect width="360" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="360" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">PATROL_LOGS &amp; TASKS (Ronda)</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="240" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">checkpoint_id</text>
      <text x="240" y="34" font-size="10.5" fill="#000000">UUID (Points)</text>

      <text x="0" y="54" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="54" font-size="11" fill="#000000">staff_id / room_id</text>
      <text x="240" y="54" font-size="10.5" fill="#000000">UUID / UUID</text>

      <text x="30" y="74" font-size="11" fill="#000000">task_type</text>
      <text x="240" y="74" font-size="10.5" fill="#000000">VARCHAR(50)</text>

      <text x="30" y="94" font-size="11" fill="#000000">inspection_photo_url</text>
      <text x="240" y="94" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="114" font-size="11" fill="#000000">security_notes</text>
      <text x="240" y="114" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="134" font-size="11" font-weight="700" fill="#000000">is_passed</text>
      <text x="240" y="134" font-size="10.5" fill="#000000">BOOLEAN</text>

      <text x="30" y="154" font-size="10" fill="#000000">scanned_at / done_at</text>
      <text x="240" y="154" font-size="10.5" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- TBL 15: COMPLAINTS & PACKAGES -->
  <g transform="translate(1460, 720)">
    <rect width="400" height="250" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="400" height="30" fill="#000000"/>
    <text x="14" y="20" font-size="12" font-weight="900" fill="#FFFFFF">COMPLAINTS &amp; PACKAGES</text>

    <g transform="translate(14, 48)">
      <text x="0" y="14" font-size="11" font-weight="900" fill="#000000">PK</text>
      <text x="30" y="14" font-size="11" font-weight="700" fill="#000000">id</text>
      <text x="280" y="14" font-size="10.5" fill="#000000">UUID</text>

      <text x="0" y="34" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="34" font-size="11" fill="#000000">kost_uid / user_id</text>
      <text x="280" y="34" font-size="10.5" fill="#000000">VARCHAR / UUID</text>

      <text x="0" y="54" font-size="11" font-weight="900" fill="#000000">FK</text>
      <text x="30" y="54" font-size="11" fill="#000000">assigned_staff_id</text>
      <text x="280" y="54" font-size="10.5" fill="#000000">UUID (Staff)</text>

      <text x="30" y="74" font-size="11" fill="#000000">complaint_text</text>
      <text x="280" y="74" font-size="10.5" fill="#000000">TEXT</text>

      <text x="30" y="94" font-size="11" fill="#000000">photo_url / courier</text>
      <text x="280" y="94" font-size="10.5" fill="#000000">TEXT / VARCHAR</text>

      <text x="30" y="114" font-size="11" font-weight="700" fill="#000000">status ('pending', 'proses', 'selesai')</text>
      <text x="280" y="114" font-size="10.5" fill="#000000">VARCHAR(30)</text>

      <text x="30" y="134" font-size="10" fill="#000000">date / created_at</text>
      <text x="280" y="134" font-size="10.5" fill="#000000">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ============================================================== -->
  <!-- RELATIONAL CONNECTORS (CROW'S FOOT NOTATION HITAM PUTIH RESMI) -->
  <!-- Simbol: || (One Mandatory) dan |< (Many Mandatory)             -->
  <!-- ============================================================== -->
  <g stroke="#000000" stroke-width="1.8" fill="none">
    <!-- 1. USERS (1) -> KOSTS (N) [owner_id] -->
    <path d="M 340 210 L 420 210"/>
    <!-- One side tick marks at 346 -->
    <line x1="348" y1="203" x2="348" y2="217"/>
    <line x1="354" y1="203" x2="354" y2="217"/>
    <!-- Crow foot at 420 -->
    <path d="M 405 203 L 420 210 L 405 217"/>
    <line x1="405" y1="203" x2="405" y2="217"/>

    <!-- 2. KOSTS (1) -> ROOMS (N) [kost_uid] -->
    <path d="M 700 210 L 780 210"/>
    <line x1="708" y1="203" x2="708" y2="217"/>
    <line x1="714" y1="203" x2="714" y2="217"/>
    <path d="M 765 203 L 780 210 L 765 217"/>
    <line x1="765" y1="203" x2="765" y2="217"/>

    <!-- 3. ROOMS (1) -> BOOKINGS (N) [room_id] -->
    <path d="M 1060 210 L 1140 210"/>
    <line x1="1068" y1="203" x2="1068" y2="217"/>
    <line x1="1074" y1="203" x2="1074" y2="217"/>
    <path d="M 1125 203 L 1140 210 L 1125 217"/>
    <line x1="1125" y1="203" x2="1125" y2="217"/>

    <!-- 4. BOOKINGS (1) -> INVOICES (1) [user_id & room_id] -->
    <path d="M 1420 210 L 1500 210"/>
    <line x1="1428" y1="203" x2="1428" y2="217"/>
    <line x1="1434" y1="203" x2="1434" y2="217"/>
    <!-- 1:1 relation to invoice -->
    <line x1="1488" y1="203" x2="1488" y2="217"/>
    <line x1="1494" y1="203" x2="1494" y2="217"/>

    <!-- 5. USERS (1) -> MITRA_SHOPS (N) [vendor_user_id & origin_owner_id] -->
    <path d="M 200 390 L 200 430"/>
    <line x1="193" y1="398" x2="207" y2="398"/>
    <line x1="193" y1="404" x2="207" y2="404"/>
    <path d="M 193 418 L 200 430 L 207 418"/>
    <line x1="193" y1="418" x2="207" y2="418"/>

    <!-- 6. MITRA_SHOPS (1) -> MITRA_OWNER_CONFIGS (N) [mitra_shop_id] -->
    <path d="M 380 510 L 420 510"/>
    <line x1="388" y1="503" x2="388" y2="517"/>
    <line x1="394" y1="503" x2="394" y2="517"/>
    <path d="M 405 503 L 420 510 L 405 517"/>
    <line x1="405" y1="503" x2="405" y2="517"/>

    <!-- 7. MITRA_SHOPS (1) -> MENU_ITEMS (N) [mitra_shop_id] -->
    <!-- Bus line from bottom of MITRA_SHOPS to bottom of MENU_ITEMS -->
    <path d="M 220 680 L 220 705 L 880 705 L 880 680"/>
    <line x1="213" y1="688" x2="227" y2="688"/>
    <line x1="213" y1="694" x2="227" y2="694"/>
    <path d="M 873 692 L 880 680 L 887 692"/>
    <line x1="873" y1="692" x2="887" y2="692"/>

    <!-- 8. MENU_ITEMS (1) -> MITRA_ORDERS (N) -->
    <path d="M 1020 510 L 1060 510"/>
    <line x1="1028" y1="503" x2="1028" y2="517"/>
    <line x1="1034" y1="503" x2="1034" y2="517"/>
    <path d="M 1045 503 L 1060 510 L 1045 517"/>
    <line x1="1045" y1="503" x2="1045" y2="517"/>

    <!-- 9. MITRA_ORDERS (1) -> CASHFLOW_LEDGER (N) [amount & ads_cut] -->
    <path d="M 1420 510 L 1460 510"/>
    <line x1="1428" y1="503" x2="1428" y2="517"/>
    <line x1="1434" y1="503" x2="1434" y2="517"/>
    <path d="M 1445 503 L 1460 510 L 1445 517"/>
    <line x1="1445" y1="503" x2="1445" y2="517"/>

    <!-- 10. KOSTS (1) -> STAFF_PROFILES (N) [kost_uid] -->
    <!-- Line from bottom of KOSTS down to STAFF_PROFILES -->
    <path d="M 500 390 L 500 415 L 120 415 L 120 720"/>
    <line x1="493" y1="398" x2="507" y2="398"/>
    <line x1="493" y1="404" x2="507" y2="404"/>
    <path d="M 113 708 L 120 720 L 127 708"/>
    <line x1="113" y1="708" x2="127" y2="708"/>

    <!-- 11. STAFF_PROFILES (1) -> ATTENDANCES (N) [staff_id] -->
    <path d="M 340 800 L 380 800"/>
    <line x1="348" y1="793" x2="348" y2="807"/>
    <line x1="354" y1="793" x2="354" y2="807"/>
    <path d="M 365 793 L 380 800 L 365 807"/>
    <line x1="365" y1="793" x2="365" y2="807"/>

    <!-- 12. KOSTS (1) -> PATROL_CHECKPOINTS (N) [kost_uid] -->
    <!-- Line from bottom of KOSTS down to PATROL_CHECKPOINTS -->
    <path d="M 560 390 L 560 415 L 820 415 L 820 720"/>
    <line x1="553" y1="398" x2="567" y2="398"/>
    <line x1="553" y1="404" x2="567" y2="404"/>
    <path d="M 813 708 L 820 720 L 827 708"/>
    <line x1="813" y1="708" x2="827" y2="708"/>

    <!-- 13. PATROL_CHECKPOINTS (1) -> PATROL_LOGS (N) [checkpoint_id] -->
    <path d="M 1020 800 L 1060 800"/>
    <line x1="1028" y1="793" x2="1028" y2="807"/>
    <line x1="1034" y1="793" x2="1034" y2="807"/>
    <path d="M 1045 793 L 1060 800 L 1045 807"/>
    <line x1="1045" y1="793" x2="1045" y2="807"/>

    <!-- 14. STAFF_PROFILES (1) -> COMPLAINTS & PACKAGES (N) [assigned_staff_id] -->
    <!-- Bus line from bottom of ATTENDANCES area to COMPLAINTS -->
    <path d="M 1420 800 L 1460 800"/>
    <line x1="1428" y1="793" x2="1428" y2="807"/>
    <line x1="1434" y1="793" x2="1434" y2="807"/>
    <path d="M 1445 793 L 1460 800 L 1445 807"/>
    <line x1="1445" y1="793" x2="1445" y2="807"/>
  </g>

  <!-- ============================================================== -->
  <!-- BOTTOM PANEL: ATURAN BISNIS DATABASE MONOKROM                  -->
  <!-- ============================================================== -->
  <g transform="translate(60, 1000)">
    <rect width="1800" height="430" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="460" height="28" fill="#000000"/>
    <text x="14" y="19" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="1">BAGIAN 3 · INTEGRITAS RELASIONAL &amp; ATURAN BISNIS BASIS DATA</text>

    <!-- 3 Box Columns -->
    <g transform="translate(24, 45)">
      <rect width="560" height="360" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <text x="18" y="30" font-size="13" font-weight="900" fill="#000000">1. Multi-Owner Mitra &amp; Hak Ads Cut</text>
      <text x="18" y="56" font-size="11" fill="#000000">• Entitas mitra_shops menyimpan origin_owner_id (pemilik toko).</text>
      <text x="18" y="78" font-size="11" fill="#000000">• Relasi Many-to-Many via mitra_owner_configs mengizinkan menu</text>
      <text x="28" y="96" font-size="11" fill="#000000">toko ditampilkan lintas kost milik owner lain.</text>
      <text x="18" y="122" font-size="11" fill="#000000">• Ketika pesanan terjadi di kost B, field origin_owner_id pada</text>
      <text x="28" y="140" font-size="11" fill="#000000">mitra_orders memastikan Ads Cut masuk ke wallet Owner A.</text>
      <text x="18" y="166" font-size="11" fill="#000000">• Flag is_mitra_utama = true mem-pin toko paling atas.</text>
      <text x="18" y="188" font-size="11" fill="#000000">• Filter 'Hanya Mitra Utama' menyaring toko prioritas.</text>

      <rect x="18" y="235" width="524" height="105" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="28" y="258" font-size="11" font-weight="900" fill="#000000">Aturan Biaya Flat Platform KostKu:</text>
      <text x="28" y="280" font-size="10.5" fill="#000000">Kolom flat_platform_fee selalu fixed Rp 500 pada setiap order</text>
      <text x="28" y="300" font-size="10.5" fill="#000000">dan dialokasikan otomatis ke rekening platform pusat untuk</text>
      <text x="28" y="320" font-size="10.5" fill="#000000">menutup operational server &amp; dynamic QRIS API.</text>
    </g>

    <g transform="translate(620, 45)">
      <rect width="560" height="360" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <text x="18" y="30" font-size="13" font-weight="900" fill="#000000">2. Kalkulasi Ongkir Bertingkat (Tiered Delivery)</text>
      <text x="18" y="56" font-size="11" fill="#000000">• Jarak dihitung dari koordinat mitra_shops (lat, lng) ke kosts (lat, lng).</text>
      <text x="18" y="78" font-size="11" fill="#000000">• Nilai jarak disimpan dalam distance_km pada mitra_orders.</text>
      <text x="18" y="104" font-size="11" font-weight="800" fill="#000000">Rumus Relasional:</text>
      <text x="28" y="126" font-size="11" font-weight="700" fill="#000000">IF distance_km ≤ 2.0 THEN delivery_fee = 2000</text>
      <text x="28" y="146" font-size="11" font-weight="700" fill="#000000">ELSE delivery_fee = 2000 + ((distance_km - 2.0) * 2500)</text>
      <text x="18" y="176" font-size="11" fill="#000000">• Driver menerima 100% dari delivery_fee tanpa potongan komisi.</text>
      <text x="18" y="198" font-size="11" fill="#000000">• Sorting terdekat mengurutkan berdasarkan distance_km.</text>

      <rect x="18" y="235" width="524" height="105" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="28" y="258" font-size="11" font-weight="900" fill="#000000">Total Tagihan Gabungan Transparan:</text>
      <text x="28" y="280" font-size="10.5" fill="#000000">total_paid = subtotal_menu + delivery_fee + flat_platform_fee</text>
      <text x="28" y="300" font-size="10.5" fill="#000000">disajikan dalam satu nominal pembayaran QRIS tanpa biaya</text>
      <text x="28" y="320" font-size="10.5" fill="#000000">tersembunyi bagi anak kost.</text>
    </g>

    <g transform="translate(1215, 45)">
      <rect width="560" height="360" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <text x="18" y="30" font-size="13" font-weight="900" fill="#000000">3. Integritas Keamanan Presensi &amp; Patroli Staf</text>
      <text x="18" y="56" font-size="11" fill="#000000">• Kolom is_mock_location menolak absensi jika fake GPS terdeteksi.</text>
      <text x="18" y="78" font-size="11" fill="#000000">• Validasi jarak staf ke koordinat kosts wajib ≤ 50 meter.</text>
      <text x="18" y="100" font-size="11" fill="#000000">• Tabel patrol_checkpoints mencatat token qr_code_hash unik fisik.</text>
      <text x="18" y="122" font-size="11" fill="#000000">• Setiap scan ronda disimpan di patrol_logs beserta foto bukti.</text>
      <text x="18" y="144" font-size="11" fill="#000000">• Tugas pembersihan kamar otomatis di-assign saat tenant checkout.</text>
      <text x="18" y="166" font-size="11" fill="#000000">• Log komplain penghuni teresolusi terikat ke assigned_staff_id.</text>

      <rect x="18" y="235" width="524" height="105" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="28" y="258" font-size="11" font-weight="900" fill="#000000">ACID Transaction Ledger:</text>
      <text x="28" y="280" font-size="10.5" fill="#000000">Setiap mutasi sewa, ads mitra, dan payout Flip/Tripay wajib</text>
      <text x="28" y="300" font-size="10.5" fill="#000000">tercatat atomik pada tabel cashflow_ledger untuk rekonsiliasi</text>
      <text x="28" y="320" font-size="10.5" fill="#000000">keuangan akurat dan anti-selisih.</text>
    </g>
  </g>

  <!-- Footer Etiket Standar Teknik -->
  <g transform="translate(60, 1485)">
    <text x="0" y="0" font-size="11" font-weight="700" fill="#000000">KEMENTERIAN PENDIDIKAN / REKAYASA PERANGKAT LUNAK · DIAGRAM HUBUNGAN ENTITAS (MONOCHROME ERD)</text>
    <text x="1800" y="0" font-size="11" font-weight="700" fill="#000000" text-anchor="end">STATUS: FINAL VERIFIED · REVISI 2.0.0 (MONOCHROME TEXTBOOK EDITION)</text>
  </g>
</svg>`;
}

// Generate files
const dfdSvg = generateMonochromeDfd();
const dfdPath = '/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_dfd.svg';
fs.writeFileSync(dfdPath, dfdSvg, 'utf8');
console.log('Saved Monochrome DFD to:', dfdPath);

const erdSvg = generateMonochromeErd();
const erdPath = '/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_erd.svg';
fs.writeFileSync(erdPath, erdSvg, 'utf8');
console.log('Saved Monochrome ERD to:', erdPath);

// Also copy to artifact dir
const artifactDir = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';
fs.writeFileSync(path.join(artifactDir, 'kostku_dfd.svg'), dfdSvg, 'utf8');
fs.writeFileSync(path.join(artifactDir, 'kostku_erd.svg'), erdSvg, 'utf8');
console.log('Successfully saved to docs and artifacts directory!');
