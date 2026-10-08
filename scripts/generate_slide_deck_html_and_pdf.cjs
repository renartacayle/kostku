const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const slidesData = [
  {
    num: "01",
    tag: "🌸 SIDANG UJIAN PROYEK REKAYASA PERANGKAT LUNAK (RPL)",
    title: "KOSTKU ✦ SMART BOARDING PLATFORM",
    subtitle: "Ekosistem Digital Terpadu Dua Sisi: Marketplace Denah Interaktif 2D & Back-Office Pengelola Kos",
    type: "cover",
    metrics: [
      { icon: "🎀", title: "0% Komisi Booking", desc: "Bebas biaya sewa tanpa komisi potongan mencekik" },
      { icon: "✨", title: "<15KB Vektor Denah", desc: "Denah SVG interaktif skala arsitektur presisi 1:50" },
      { icon: "💻", title: "Local-First Architecture", desc: "Tetap operasional lancar tanpa koneksi internet" }
    ],
    script: `Selamat pagi Bapak dan Ibu Dosen/Guru Penguji. Mari kita mulai dengan sebuah fakta lapangan: Industri pencarian dan pengelolaan indekos di Indonesia saat ini terjebak dalam mismatch ekspektasi yang cukup tinggi.

Pencari kos sering kali tertipu oleh foto sudut lebar yang memanipulasi skala ruangan. Di sisi lain, pemilik kos berjuang secara manual mencatat pembayaran dan utilitas listrik di buku tulis yang rentan rusak.

Hari ini, kami memperkenalkan KostKu—ekosistem digital dua sisi yang memecahkan reality gap tersebut melalui pengintegrasian Architectural 2D Blueprint Engine dan sistem pengelolaan back-office berbasis local-first.`,
    tips: [
      "Gestur: Berdiri tegak di tengah, tatap mata dosen penguji secara bergantian.",
      "Pointer: Gunakan laser pointer untuk menunjuk kontras panel aplikasi modern vs cara lama.",
      "Penekanan: Berikan jeda suara tepat setelah mengucapkan 'KostKu' untuk efek impresif."
    ]
  },
  {
    num: "02",
    tag: "💡 IDENTIFIKASI MASALAH",
    title: "Market Friction: Reality Gap vs Operational Chaos",
    subtitle: "Dua pilar masalah utama yang menghambat efisiensi sewa indekos di Indonesia",
    type: "split",
    colLeft: {
      title: "👧 Sisi Pencari Kos (Anak Rantau)",
      badge: "The Reality Gap",
      color: "pink",
      items: [
        { icon: "📷", title: "Foto Lensa Wide-Angle Palsu", desc: "Kamar tampak luas di foto iklan, tapi aslinya sempit, gelap, dan sirkulasi pengap." },
        { icon: "📐", title: "Skala Ruangan Tidak Akurat", desc: "Penyewa tidak tahu apakah kasur queen size (160x200) atau meja kerja muat di kamar." },
        { icon: "🚪", title: "Buta Tata Letak & Ventilasi", desc: "Letak kamar mandi dalam dan jendela arah sinar matahari tidak jelas." },
        { icon: "💸", title: "Waktu & Biaya Survei Terbuang", desc: "Macet dan panas keliling survei fisik hanya untuk kecewa di lokasi." }
      ]
    },
    colRight: {
      title: "👵 Sisi Pemilik Kos (Pengelola)",
      badge: "Operational Friction",
      color: "purple",
      items: [
        { icon: "📒", title: "Pembukuan Buku Tulis Usang", desc: "Pencatatan manual di buku tulis rentan robek, hilang, atau terkena tumpahan air." },
        { icon: "⚡", title: "Sengketa Tagihan Listrik", desc: "Nombok tagihan listrik PLN karena telat mencatat angka meteran kWh anak kos." },
        { icon: "💬", title: "Komplain Fasilitas Tercecer", desc: "Laporan kran bocor atau genteng rembes tenggelam di chat WhatsApp pribadi." },
        { icon: "🏷️", title: "Komisi Aplikasi Kompetitor Mencekik", desc: "Potongan 5% hingga 12% per transaksi membuat pemilik enggan memakai sistem." }
      ]
    },
    script: `Berdasarkan hasil analisis kebutuhan perangkat lunak yang kami lakukan, terdapat dua pilar masalah utama:

Pertama, dari sudut pandang penyewa: Foto promosi umum di marketplace kerap manipulatif. Penyewa tidak dapat mengetahui apakah kasur queen size atau meja kerja mereka benar-benar muat sebelum melakukan survei fisik.

Kedua, dari sudut pandang pengelola: Pengawasan pembayaran sewa dan perhitungan variabel utilitas seperti listrik meteran masih dilakukan secara manual. Hal ini memicu sengketa perhitungan angka kWh dan memerlukan waktu administrasi berjam-jam tiap bulannya.`,
    tips: [
      "Gestur: Gunakan telapak tangan terbuka saat membandingkan dua problem (kiri untuk penyewa, kanan untuk pengelola).",
      "Pointer: Sorot perbandingan foto wide-angle vs realita.",
      "Penekanan: Tegaskan frasa 'sengketa perhitungan' untuk membangun urgensi solusi teknis."
    ]
  },
  {
    num: "03",
    tag: "🎀 THE KILLER FEATURE",
    title: "Architectural 2D Blueprint Engine (Vektor SVG)",
    subtitle: "Solusi transparansi visual presisi skala 1:50 tanpa beban kuota data foto 360",
    type: "blueprint",
    bullets: [
      { icon: "✨", title: "Ukuran File Sangat Ringan (<15 KB)", desc: "Dapat dimuat instan (near-zero latency) bahkan pada koneksi seluler 3G." },
      { icon: "📐", title: "Skala Presisi Arsitektur 1:50", desc: "Menggambarkan proporsi kasur springbed (160x200), meja laptop, dan lemari pakaian." },
      { icon: "☀️", title: "Orientasi Cahaya Matahari & Jendela", desc: "Memperlihatkan arah datangnya angin alami dan pencahayaan matahari luar." },
      { icon: "🟢", title: "Status Ketersediaan Kamar Dinamis", desc: "Hijau = Kamar Kosong, Merah = Terisi, Kuning = Dalam Masa Perbaikan." }
    ],
    script: `Inilah fondasi inovasi teknis utama dari KostKu: Architectural 2D Blueprint Engine. Kami tidak mengandalkan foto statis atau media 360 derajat yang membutuhkan beban data besar. Kami merancang mesin rendering denah berbasis SVG interaktif berskala presisi 1:50.

Pencari kos dapat melihat objek ruangan secara aktual—termasuk proporsi kasur queen size 160x200 centimeter, tata letak meja kerja, hingga orientasi bukaan jendela terhadap arah datangnya sinar matahari.

Data denah ini bersifat dinamis. Ketika sebuah kamar terisi di sistem back-office, visualisasi denah di marketplace akan langsung mengupdate status ketersediaannya secara instan.`,
    tips: [
      "Gestur: Bergerak mendekati layar atau gunakan pointer menyusuri garis denah SVG.",
      "Pointer: Tunjukkan objek kasur dan bukaan jendela di dalam denah saat menjelaskan ukuran real.",
      "Penekanan: Tekan kata 'skala presisi 1:50' dan 'ukuran aktual' dengan artikulasi jelas."
    ]
  },
  {
    num: "04",
    tag: "🤖 AI SPATIAL & DUAL VIEWER",
    title: "AI Room Scanner & 3D Isometric Cutaway Viewer",
    subtitle: "Inovasi generasi denah otomatis via AI Vision & visualisasi 3D isometrik 4 sudut pandang",
    type: "split",
    colLeft: {
      title: "📐 AI Vision & Kuesioner Interaktif",
      badge: "Spatial AI Engine",
      color: "pink",
      items: [
        { icon: "📸", title: "Scan Foto Kamar via AI", desc: "AI Vision memindai foto kamar asli dan mengidentifikasi batas dinding & bukaan." },
        { icon: "🛏️", title: "Deteksi Kasur & Fasilitas", desc: "Kuesioner konfirmasi: Single (90x200) s.d King (180x200), AC, lemari, & KM dalam." },
        { icon: "✨", title: "1-Click Generate Denah", desc: "Sekali klik langsung menghasilkan denah 2D arsitektural dan model 3D isometrik." },
        { icon: "📍", title: "Google Maps GPS Pinning", desc: "Deteksi GPS instan dan link navigasi rute langsung ke gerbang kos." }
      ]
    },
    colRight: {
      title: "🎮 3D Isometric Cutaway Viewer",
      badge: "Three.js / WebGL",
      color: "purple",
      items: [
        { icon: "🔄", title: "Angle Switcher 4 Sudut", desc: "Putar sudut pandang: Isometrik Kanan, Kiri, Tampak Atas 45°, dan Tampak Depan." },
        { icon: "☀️", title: "Pencahayaan Dinamis", desc: "Mode Siang Hari (Natural Skylight) vs Mode Malam Cozy (Warm 2700K Glow)." },
        { icon: "🪵", title: "Tekstur Parket Kayu Asli", desc: "Lantai kayu fotorealistik, partisi kaca shower, dan layar laptop berpendar." },
        { icon: "📷", title: "Komparasi Foto Asli Nyata", desc: "Foto fisik kamar disandingkan langsung dengan hasil denah terverifikasi AI." }
      ]
    },
    script: `Pada evolusi produk terbaru kami, KostKu memperkenalkan AI Vision Room Scanner dan 3D Isometric Cutaway Viewer.
    
Pemilik kos tidak perlu memiliki keahlian arsitektur untuk membuat denah. Cukup unggah foto kamar, dan AI akan memindai ruang serta mengajukan kuesioner interaktif perabot—mulai dari ukuran kasur single hingga king size, AC, hingga kamar mandi dalam—lalu men-generate model 3D interaktif yang dapat diputar 4 sudut pandang dengan mode siang dan malam.`,
    tips: [
      "Gestur: Tunjukkan gestur memutar pergelangan tangan untuk menggambarkan rotasi 3D.",
      "Pointer: Sorot tombol rotasi 4 sudut dan perbandingan foto asli kamar tidur.",
      "Penekanan: Tekan kata 'AI Vision Scanner' dan '3D Isometrik Cutaway'."
    ]
  },
  {
    num: "05",
    tag: "⚡ OTOMATISASI OPERASIONAL",
    title: "Automated Utility & WhatsApp Billing Engine",
    subtitle: "Kalkulasi matematis konsumsi listrik kWh & kwitansi instan 1-klik ke WhatsApp",
    type: "split",
    colLeft: {
      title: "🧮 Formula Kalkulasi Utilitas",
      badge: "Logika Matematika",
      color: "indigo",
      items: [
        { icon: "1️⃣", title: "Selisih Pemakaian kWh Listrik", desc: "kWh_Pakai = Max(0, Meteran_Akhir - Meteran_Awal)" },
        { icon: "2️⃣", title: "Biaya Variabel Listrik", desc: "Biaya_Listrik = kWh_Pakai × Tarif_per_kWh" },
        { icon: "3️⃣", title: "Biaya Variabel Air", desc: "Biaya_Air = m3_Pakai × Tarif_per_m3" },
        { icon: "4️⃣", title: "Akumulasi Total Tagihan", desc: "Total = Sewa_Pokok + Biaya_Listrik + Biaya_Air + Denda" },
        { icon: "5️⃣", title: "Nomor Referensi Unik", desc: "INV-{TIMESTAMP}-{NOMOR_KAMAR} tercatat di database" }
      ]
    },
    colRight: {
      title: "📲 1-Click WhatsApp Dispatcher",
      badge: "wa.me Deep Link",
      color: "green",
      items: [
        { icon: "💬", title: "Pesan Terformat Otomatis", desc: "Halo Kak Arya (Kamar 102), berikut rincian sewa bulan ini:" },
        { icon: "💵", title: "Rincian Transparan", desc: "Sewa: Rp 1.5jt | Listrik (42 kWh @2rb): Rp 84rb | Air: Rp 35rb" },
        { icon: "💳", title: "Total Instan: Rp 1.619.000", desc: "Status tagihan: Menunggu Pembayaran via transfer/QRIS." },
        { icon: "🚀", title: "Zero Typing Friction", desc: "Pengelola cukup klik 1 tombol tanpa perlu menyusun kalimat manual." }
      ]
    },
    script: `Selain menghadirkan pengalaman visual untuk pencari kos, KostKu menyederhanakan operasional pengelola melalui modul otomatisasi tagihan utilitas.

Sistem kami mengimplementasikan logika kalkulasi matematis otomatis untuk menghitung penggunaan variabel listrik. Pengelola cukup memasukkan angka meteran akhir, dan sistem secara otomatis mengkalkulasikan selisih pemakaian dikali tarif per kWh, kemudian menggabungkannya dengan biaya sewa pokok.

Setelah tagihan terbuat, sistem memfasilitasi komunikasi lewat pemformatan deep-link 1-klik ke WhatsApp. Pengelola dapat mengirimkan transparansi rincian tagihan langsung ke nomor penyewa tanpa perlu mengetik ulang secara manual.`,
    tips: [
      "Gestur: Gerakan tangan menunjuk dari input data ke hasil akhir pesan WA.",
      "Pointer: Sorot formula Meter_Akhir - Meter_Awal lalu tunjukkan hasil pesan WhatsApp.",
      "Penekanan: Berikan penekanan pada frasa '1-klik ke WhatsApp' sebagai nilai kepraktisan sistem."
    ]
  },
  {
    num: "06",
    tag: "💻 ARSITEKTUR SISTEM RPL",
    title: "Hybrid Local-First & Cross-Platform Architecture",
    subtitle: "Kombinasi ketahanan offline, kecepatan proses lokal, dan sinkronisasi cloud",
    type: "cards3",
    cards: [
      {
        icon: "📱",
        badge: "Layer 1: Multi-Platform Clients",
        color: "pink",
        title: "React 18 + Capacitor + Electron + PWA",
        desc: "Satu basis kode terpadu untuk tiga runtime: Android APK (Capacitor), Windows Desktop (Electron), dan Web Browser (PWA) dengan tampilan responsif."
      },
      {
        icon: "⚡",
        badge: "Layer 2: Local Processing Engine",
        color: "purple",
        title: "In-Memory Cache & Embedded SQLite",
        desc: "Menjamin Zero-Offline Latency. Operasi pencatatan kamar, meteran listrik, dan pembukuan tetap berjalan mulus meskipun koneksi internet terputus."
      },
      {
        icon: "☁️",
        badge: "Layer 3: Cloud Backend & Sync",
        color: "blue",
        title: "Node.js Express + Supabase Cloud",
        desc: "Sinkronisasi asinkron berbasis delta-sync saat online dan manajemen autentikasi Google OAuth 2.0 terpusat."
      }
    ],
    script: `Untuk menjamin keandalan sistem pada berbagai kondisi operasional, KostKu dibangun dengan pendekatan Hybrid Local-First Architecture.

Di sisi frontend, kami memanfaatkan React 18 dan Vite. Di sisi runtime aplikasi, kami membungkus kode dasar yang sama menggunakan Capacitor untuk platform Android dan Electron untuk Desktop, serta PWA untuk dukungan perambah Web.

Prinsip Local-First memastikan bahwa pengelola kos tetap dapat melakukan pembukuan dan mencatat transaksi meskipun koneksi internet terputus. Data disimpan di penyimpan lokal berbasis SQLite, yang kemudian secara asinkron disinkronkan ke cloud Supabase ketika koneksi internet kembali aktif.`,
    tips: [
      "Gestur: Tangan merentang horisontal untuk menunjukkan cakupan cross-platform.",
      "Pointer: Tunjukkan jalur sinkronisasi antara Embedded Local SQLite dan Cloud Supabase.",
      "Penekanan: Tegaskan kata 'tetap dapat bekerja meskipun internet terputus'."
    ]
  },
  {
    num: "07",
    tag: "🗺️ ALUR PENGGUNA",
    title: "Dual-Sided Unified Architecture & Flow",
    subtitle: "Dua alur kerja terpisah namun terintegrasi harmonis dalam satu platform",
    type: "flow",
    flow1: {
      title: "🌸 Public Flow (Pencari Kos) — Zero Friction",
      badge: "Pencari Kos",
      color: "pink",
      steps: [
        "1. Buka Marketplace ➔ Jelajahi kos & navigasi Google Maps langsung",
        "2. Filter Spesifik ➔ Pilih kota, tipe gender, rentang harga, dan fasilitas",
        "3. Live 2D/3D Blueprint ➔ Cek denah asli perabot kasur, meja, & jendela",
        "4. Direct Action ➔ Klik 'Ajukan Sewa' atau chat langsung ke WhatsApp pemilik"
      ]
    },
    flow2: {
      title: "👩‍💼 Admin Flow (Pemilik Kos) — High Security",
      badge: "Pengelola Kos",
      color: "purple",
      steps: [
        "1. Autentikasi ➔ Registrasi e-KTP anti-bot atau login Google OAuth 2.0",
        "2. Dashboard Okupansi ➔ Pantau status kamar kosong vs terisi secara real-time",
        "3. Approval Sewa ➔ 1-Klik Setujui: auto-assign kamar, invoice, & PIN Smart Lock",
        "4. Dispatch & Komplain ➔ Kirim tagihan via WhatsApp & kelola tiket perbaikan"
      ]
    },
    script: `Sistem KostKu dirancang untuk melayani dua persona pengguna utama dengan alur kerja yang sangat terpisah namun terintegrasi dalam satu platform.

Pada Public Flow di atas, alur dibuat sangat efisien tanpa hambatan registrasi yang tidak perlu. Pencari kos dapat langsung mengeksplorasi denah 2D dan 3D, memfilter ketersediaan kamar, dan melakukan kontak langsung dengan pemilik kos.

Pada Admin Flow di bawah, alur diproteksi dengan otentikasi ketat. Pengelola dapat memantau tingkat hunian melalui dashboard, menyetujui pengajuan sewa dalam satu klik, mencatat pemakaian utilitas, menggenerate tagihan bulanan, hingga memantau tiket komplain.`,
    tips: [
      "Gestur: Bergerak dari atas ke bawah mengikuti dua jalur pengguna pada slide.",
      "Pointer: Telusuri garis panah dari titik entry hingga titik action akhir.",
      "Penekanan: Sebutkan kata '1-Klik Approval Sewa' dan 'Auto-Assign Kamar'."
    ]
  },
  {
    num: "08",
    tag: "🛡️ KEAMANAN & INTEGRITAS DATA",
    title: "Sistem Anti-Bot 1 KTP 1 Akun & Validasi NIK Resmi",
    subtitle: "Menjamin keamanan ekosistem sewa dari bot, akun palsu, dan penipuan listing",
    type: "split",
    colLeft: {
      title: "🆔 Validasi Identitas Kependudukan",
      badge: "Anti-Fraud Architecture",
      color: "pink",
      items: [
        { icon: "🔢", title: "Validasi NIK 16 Digit", desc: "Format regex matematis & pengecekan ketersediaan instan (/api/check-nik)." },
        { icon: "🚫", title: "Enforce 1 KTP = 1 Akun", desc: "Mencegah duplikasi pendaftaran; 1 NIK hanya berlaku untuk 1 akun pengguna." },
        { icon: "📸", title: "Upload Fisik e-KTP Wajib", desc: "Verifikasi foto e-KTP asli demi akuntabilitas hukum pemilik & penyewa." },
        { icon: "📍", title: "Verifikasi Lokasi Google Maps", desc: "Pendaftaran kos wajib koordinat GPS dan tautan Google Maps nyata." }
      ]
    },
    colRight: {
      title: "🔑 Pemulihan Akun & Smart Approval",
      badge: "Account Lifecycle",
      color: "purple",
      items: [
        { icon: "🔄", title: "Pemulihan Akun via NIK", desc: "Reset sandi mandiri dengan mencocokkan NIK & nama e-KTP resmi." },
        { icon: "⚡", title: "1-Click Booking Approval", desc: "Pemilik cukup klik Setujui, sistem auto-assign kamar & buat PIN pintu." },
        { icon: "🏢", title: "Multi-Branch Portfolio", desc: "Satu akun pemilik dapat mengelola banyak cabang kost dengan switch instan." },
        { icon: "✍️", title: "Kontrak Digital & E-Signature", desc: "Tanda tangan digital canvas untuk perjanjian staf dan penjaga kos." }
      ]
    },
    script: `Integritas ekosistem KostKu diperkuat dengan arsitektur Anti-Bot dan verifikasi identitas resmi.

Kami menerapkan aturan 1 KTP hanya untuk 1 Akun. Setiap pengguna wajib menyertakan NIK 16 digit yang divalidasi secara real-time dan mengunggah foto fisik e-KTP resmi. Fitur ini meniadakan akun spam, melindungi pemilik kos dari calon penyewa fiktif, serta menyediakan mekanisme pemulihan akun mandiri menggunakan data kependudukan resmi.`,
    tips: [
      "Gestur: Tunjukkan sikap tegas saat membahas keamanan data kependudukan.",
      "Pointer: Tunjukkan proses pengecekan keunikan NIK dan modal pemulihan akun.",
      "Penekanan: Tekan kata '1 KTP 1 Akun' dan 'Perlindungan dari Akun Fiktif'."
    ]
  },
  {
    num: "09",
    tag: "🔍 TECHNICAL DEEP DIVE",
    title: "Sequence Diagram: Auto-Update & Cache Strategy",
    subtitle: "Mekanisme pembaruan biner mandiri & strategi pembersihan cache PWA",
    type: "split",
    colLeft: {
      title: "📲 Android & Desktop Auto-Update",
      badge: "Differential Binary Lifecycle",
      color: "pink",
      items: [
        { icon: "1️⃣", title: "Handshake Versi Server", desc: "GET /api/app-version dengan header Cache-Control: no-cache" },
        { icon: "2️⃣", title: "Evaluasi SemVer 3-Tier", desc: "isNewerVersion(remote, local) membandingkan versi matematis (Cegah loop)" },
        { icon: "3️⃣", title: "Modal Changelog", desc: "Menampilkan fitur baru & tombol 'Unduh APK Sekarang'" },
        { icon: "4️⃣", title: "Stream APK Mandiri", desc: "Server memancarkan biner KostKu.apk resmi tanpa dialihkan ke link luar" }
      ]
    },
    colRight: {
      title: "🌐 PWA Service Worker Invalidation",
      badge: "Network-First Navigation",
      color: "purple",
      items: [
        { icon: "1️⃣", title: "Network-First Strategy", desc: "index.html selalu dicek ke server terlebih dahulu sebelum fallback cache" },
        { icon: "2️⃣", title: "SKIP_WAITING Signal", desc: "Service Worker baru langsung aktif tanpa menunggu penutupan browser" },
        { icon: "3️⃣", title: "Clean Cache Storage", desc: "Mengeksekusi caches.delete(allKeys) saat pengguna klik muat ulang" },
        { icon: "4️⃣", title: "Reload Cache-Buster", desc: "Halaman direload otomatis dengan parameter unik timestamp (?_cb=now)" }
      ]
    },
    script: `Masuk ke pendalaman teknis sistem (technical deep dive), slide ini menggambarkan dua mekanisme kritis dalam lifecycle aplikasi KostKu.

Pada bagian kiri, diagram alur Auto-Update menunjukkan bagaimana aplikasi desktop Electron dan Android Capacitor memeriksa pembaruan versi biner secara berkala ke server update. Aplikasi secara mandiri melakukan unduhan patch secara efisien tanpa memerlukan instalasi ulang secara keseluruhan oleh pengguna.

Pada bagian kanan, kami memperlihatkan manajemen Service Worker pada versi PWA. Kami mengimplementasikan strategi Network-First with Dynamic Cache Fallback, serta skenario pengosongan cache otomatis saat terjadi pembaruan versi data, guna menghindari ketersediaan data basi pada perambah pengguna.`,
    tips: [
      "Gestur: Postur tubuh lebih tenang dan profesional, menunjukkan kapasitas teknis yang matang.",
      "Pointer: Tunjukkan urutan panah pemanggilan method dari atas ke bawah.",
      "Penekanan: Gunakan istilah teknis seperti 'Network-First', 'Cache Invalidation', dan 'Differential Patch' secara presisi."
    ]
  },
  {
    num: "10",
    tag: "📊 STRATEGI & KELAYAKAN BISNIS",
    title: "Monetization Strategy & 4 Competitive Moats",
    subtitle: "Bagaimana KostKu bertahan, memenangkan pasar, dan menghasilkan pendapatan berulang",
    type: "cards3",
    cards: [
      {
        icon: "🎀",
        badge: "Aliran 1: Freemium SaaS",
        color: "pink",
        title: "Rp 49rb - 99rb / Bulan",
        desc: "Free Tier hingga 5 kamar. Biaya langganan <0.3% omzet kos. Jauh lebih diminati dibanding komisi kompetitor yang memotong Rp 1.5jt/bulan!"
      },
      {
        icon: "✨",
        badge: "Aliran 2: Featured Listing",
        color: "purple",
        title: "Spotlight Kota & Verified Badge",
        desc: "Rp 25.000/minggu untuk slot teratas pencarian kota. Sangat diminati pemilik kos saat musim ajaran baru mahasiswa kampus."
      },
      {
        icon: "🏰",
        badge: "4 Parit Pertahanan (Moats)",
        color: "mint",
        title: "High Switching Cost & Retensi",
        desc: "1. Vektor Denah SVG & 3D Cutaway\n2. 0% Komisi Seumur Hidup\n3. Anti-Bot 1 KTP 1 Akun Terpercaya\n4. Aplikasi Ringan di HP Android Murah"
      }
    ],
    script: `Bagaimana KostKu bertahan dan memenangkan persaingan pasar? Jawabannya terletak pada model bisnis dan competitive moats yang kami bangun.

Platform pesaing umumnya memotong komisi transaksi sebesar 5 hingga 15 persen dari nilai sewa. Model ini memberatkan pemilik kos dan memicu transaksi gelap di luar sistem. KostKu menerapkan 0% komisi transaksi sewa, dan beralih ke model langganan perangkat lunak (SaaS) dengan tarif terjangkau sebesar 49 ribu hingga 99 ribu Rupiah per bulan untuk fitur pengelolaan back-office tingkat lanjut.

Nilai pertahanan utama kami terletak pada High Switching Cost. Ketika pengelola telah memasukkan riwayat data keuangan dan rancangan denah SVG di KostKu, biaya untuk berpindah ke sistem lain menjadi sangat tinggi, sehingga memberikan recurring revenue yang stabil bagi platform.`,
    tips: [
      "Gestur: Tunjukkan telapak tangan mengepal secara mantap saat menyebutkan kata 'High Switching Cost'.",
      "Pointer: Tunjukkan titik potong efisiensi biaya pada grafik perbandingan SaaS vs Komisi Persenan.",
      "Penekanan: Tekan frasa '0% komisi transaksi' dan 'SaaS terjangkau' sebagai nilai tawar bisnis."
    ]
  },
  {
    num: "11",
    tag: "🤝 TATA KELOLA & EKSEKUSI",
    title: "Tim Pengembang & RACI Execution Matrix",
    subtitle: "Siklus pengembangan 4 minggu (4-Week Sprint) & akuntabilitas peran terukur",
    type: "table",
    headers: ["Milestone / Task", "Frontend Lead", "Backend Lead", "UI/UX Designer", "QA & Mobile Lead"],
    rows: [
      ["Interactive 2D Blueprint SVG & 3D Viewer", "R (Responsible)", "C (Consulted)", "A (Accountable)", "I (Informed)"],
      ["AI Vision Room Scanner & Questionnaire", "R (Responsible)", "A (Accountable)", "C (Consulted)", "C (Consulted)"],
      ["Anti-Bot e-KTP Verification (1 KTP 1 Akun)", "C (Consulted)", "R / A (Lead)", "I (Informed)", "C (Consulted)"],
      ["Utility Calculator & WhatsApp Deep-Link", "R (Responsible)", "R (Responsible)", "I (Informed)", "A (Accountable)"],
      ["Testing & Multiplatform Build (APK/Electron)", "I (Informed)", "I (Informed)", "C (Consulted)", "R / A (Lead)"]
    ],
    script: `Proyek Rekayasa Perangkat Lunak KostKu dirancang dan dieksekusi dalam siklus sprint 4 minggu yang terukur secara disiplin dengan RACI Matrix yang jelas.

Setiap pilar utama—mulai dari mesin denah 2D/3D, pemindai AI Vision, verifikasi Anti-Bot e-KTP, pengujian lintas platform, hingga integrasi tautan WhatsApp—memiliki penanggung jawab (Responsible) dan pemegang keputusan (Accountable) yang terdefinisi dengan transparan.`,
    tips: [
      "Gestur: Berdiri sejajar dengan tabel, gunakan gerakan tangan terbuka mengarah ke seluruh nama anggota tim.",
      "Pointer: Sorot baris-baris milestone penting pada matriks RACI.",
      "Penekanan: Tutup dengan nada tegas dan percaya diri."
    ]
  },
  {
    num: "12",
    tag: "⚙️ STANDAR OPERASIONAL PROSEDUR",
    title: "SOP Maintenance, Server Down & Komplain Pengguna",
    subtitle: "Protokol enterprise untuk keandalan infrastruktur dan Service Level Agreement (SLA)",
    type: "split",
    colLeft: {
      title: "🛠️ SOP Maintenance & Tanggap Darurat",
      badge: "Infrastruktur & Reliability",
      color: "pink",
      items: [
        { icon: "🌙", title: "Maintenance Jam Sepi (01.00 - 04.00)", desc: "Eksekusi hanya pada jam sepi trafik dengan banner pengumuman minimal 24 jam sebelumnya." },
        { icon: "💾", title: "Full Backup Pra-Maintenance", desc: "Pencadangan penuh database (db.json/cloud) & storage aset sebelum utak-atik server." },
        { icon: "🚨", title: "Monitoring & Failover < 5 Menit", desc: "Jika server mati, otomatis dialihkan ke halaman statis darurat (tanpa layar putih polos)." },
        { icon: "⏪", title: "Rollback Cepat < 15 Menit", desc: "Langsung rollback ke versi stabil sebelumnya jika bug dari rilis terbaru." }
      ]
    },
    colRight: {
      title: "🎧 SOP Penanganan Komplain & SLA",
      badge: "Customer Care SLA",
      color: "purple",
      items: [
        { icon: "📞", title: "Satu Pintu Aduan Resmi", desc: "Tombol bantuan langsung WhatsApp Admin (wa.me) & tiket digital terpusat di aplikasi." },
        { icon: "⚡", title: "Komplain Mendesak (SLA 15-30 Mnt)", desc: "Urusan uang (nota double, bukti gagal) & akses kamar (smart lock error). Tuntas 2-4 jam." },
        { icon: "📋", title: "Komplain Biasa (SLA 1x24 Jam)", desc: "Bug tampilan minor, saran fitur, atau panduan pakai. Tuntas maksimal 2x24 jam." },
        { icon: "🔄", title: "Siklus Respons 3 Langkah", desc: "1. Akui & Empati ➔ 2. Berikan Estimasi Waktu (ETA) ➔ 3. Konfirmasi Penuntasan." }
      ]
    },
    script: `Untuk menjamin ketersediaan sistem dan kepuasan pengguna di tingkat enterprise, KostKu menetapkan 3 pilar Standar Operasional Prosedur (SOP) baku:

Pertama, SOP Maintenance Terjadwal: Pemeliharaan server hanya dilakukan di jam sepi antara pukul 01.00 hingga 04.00 pagi, didahului banner pengumuman 24 jam dan full backup database.

Kedua, SOP Tanggap Darurat Server Down: Dilengkapi monitoring otomatis, failover ke halaman statis dalam waktu kurang dari 5 menit, dan prosedur rollback cepat di bawah 15 menit jika terdeteksi regresi rilis.

Ketiga, SOP Penanganan Komplain: Memiliki matriks SLA ketat, di mana komplain mendesak terkait keuangan atau akses kamar wajib direspons dalam 15 hingga 30 menit melalui siklus 3 langkah terstandarisasi.`,
    tips: [
      "Gestur: Tunjukkan sikap bertanggung jawab dan profesional dalam tata kelola sistem.",
      "Pointer: Tunjukkan target SLA 15-30 menit untuk komplain mendesak.",
      "Penekanan: Tekan kata 'Full Backup Pra-Maintenance' dan 'Zero Data Loss'."
    ]
  },
  {
    num: "13",
    tag: "💖 KESIMPULAN & PENUTUP",
    title: "KostKu: Platform Manajemen & Marketplace Kost Pintar",
    subtitle: "Siap Mendemonstrasikan Sistem Secara Langsung di Hadapan Penguji",
    type: "closing",
    script: `Sekian pemaparan presentasi dari kami mengenai arsitektur, inovasi teknis, model bisnis, dan standar operasional prosedur KostKu. Kami siap mendemonstrasikan sistem secara langsung dan membuka sesi tanya-jawab kepada Bapak dan Ibu Penguji. Terima kasih banyak!`,
    tips: [
      "Tersenyum ramah dan penuh percaya diri.",
      "Buka laptop / HP untuk mendemonstrasikan aplikasi secara live jika diminta.",
      "Persiapkan diri membuka slide panduan Q&A jika dosen mengajukan pertanyaan kritis."
    ]
  },
  {
    num: "14",
    tag: "🛡️ PERTAHANAN Q&A #1",
    title: "Kenapa Denah 2D SVG, Bukan Foto 360 / Virtual Tour?",
    subtitle: "Argumen efisiensi bandwidth, kepastian dimensi riil, dan kemudahan pemeliharaan",
    type: "qa",
    points: [
      { num: "1", title: "Ukuran File & Efisiensi Bandwidth", desc: "Foto 360° / Matterport memakan 10 MB - 50 MB per ruangan. Sebaliknya, denah vektor SVG kami berukuran rata-rata di bawah 15 Kilobytes (<15KB), dapat dimuat instan (near-zero latency) bahkan pada sinyal 3G." },
      { num: "2", title: "Kepastian Dimensi & Tata Letak Ruang", desc: "Foto 360° tetap memakai lensa cembung (fish-eye) yang kerap mendistorsi persepsi ruang. Denah 2D SVG kami menggunakan skala presisi 1:50 yang menunjukkan ukuran fisik riil kasur (160x200cm), sisa ruang gerak, dan lebar pintu." },
      { num: "3", title: "Kemudahan Maintenance & Update Data", desc: "Mengubah tata letak pada foto 360° membutuhkan foto ulang (reshooting) yang mahal. Pada denah SVG, perubahan posisi perabot hanya butuh update atribut koordinat XML/JSON sederhana di sisi frontend." }
    ],
    script: `Jika penguji bertanya: 'Kenapa tidak memakai 360 Virtual Tour seperti Matterport?', sampaikan 3 pilar: Bandwidth (<15KB vs 50MB), Presisi Skala (1:50 tanpa distorsi lensa cembung), dan Maintenance (cukup edit atribut JSON tanpa biaya foto ulang).`
  },
  {
    num: "15",
    tag: "🛡️ PERTAHANAN Q&A #2",
    title: "Kenapa Arsitektur Local-First, Bukan Full Cloud?",
    subtitle: "Argumen zero-offline latency, efisiensi operasional server, dan kedaulatan data",
    type: "qa",
    points: [
      { num: "1", title: "Ketahanan Operasional (Zero-Offline Latency)", desc: "Pemilik kos sering kali mencatat meteran listrik dan penerimaan sewa langsung di lokasi kosan yang sinyalnya lemah (blank spot). Dengan Local-First, operasi input tidak pernah gagal karena ditulis langsung ke SQLite lokal." },
      { num: "2", title: "Pengurangan Beban Operasional Server (Cost Efficiency)", desc: "Operasional read/write harian dialihkan sepenuhnya ke perangkat klien pengguna. Server cloud Supabase hanya menerima paket data selisih (delta sync), memangkas biaya infrastruktur cloud hingga 80%." },
      { num: "3", title: "Keamanan & Privasi Data Pengelola (Data Ownership)", desc: "Data pembukuan sensitif berada di bawah kendali lokal perangkat pemilik kos, mengurangi risiko kebocoran data terpusat pada server pihak ketiga." }
    ],
    script: `Jika penguji bertanya: 'Mengapa memilih SQLite lokal daripada Full Cloud Database terpusat?', sampaikan: 1. Zero-offline latency di area blank spot, 2. Penghematan biaya cloud compute hingga 80%, 3. Kedaulatan data sensitif pemilik kos terjamin.`
  },
  {
    num: "16",
    tag: "🛡️ PERTAHANAN Q&A #3",
    title: "Kenapa 0% Komisi & Direct WhatsApp? Rawan Ditinggalkan?",
    subtitle: "Perubahan paradigma software house vs agen calo & retensi berbasis switching cost",
    type: "qa",
    points: [
      { num: "1", title: "Paradigma: Software House vs Marketplace Agent", desc: "KostKu diposisikan sebagai Property Management Software (SaaS), bukan calo perantara sewa. Pendapatan kami berasal dari biaya langganan fitur back-office (Rp 49rb - 99rb/bulan), bukan dari memotong komisi sewa." },
      { num: "2", title: "Menghilangkan Kebiasaan Bypass Transaksi", desc: "Pada platform dengan komisi 5-10%, pemilik dan penyewa selalu berusaha mencari celah bertukar nomor telepon di luar sistem. Dengan 0% komisi dan deep-link WhatsApp, kami merangkul perilaku alami pengguna, bukan melawannya." },
      { num: "3", title: "Menciptakan Retensi melalui High Switching Cost", desc: "Setelah pengelola terbiasa dengan kemudahan cetak kwitansi otomatis, laporan keuangan, dan integrasi data denah, mereka akan terus berlangganan SaaS KostKu karena efisiensi kerja yang didapat jauh melebihi harga langganannya." }
    ],
    script: `Jika penguji bertanya: 'Kenapa memberi kontak WhatsApp langsung? Bukankah platform rawan di-bypass?', sampaikan: Kami adalah SaaS perangkat lunak manajemen properti, bukan makelar komisi. 0% komisi justru menghilangkan niat pengguna untuk mem-bypass sistem dan menciptakan loyalitas retensi jangka panjang.`
  },
  {
    num: "17",
    tag: "🛡️ PERTAHANAN Q&A #4",
    title: "Bagaimana Prosedur Server Down & Mitigasi Komplain?",
    subtitle: "Protokol tanggap darurat, failover otomatis, dan SLA komplain terukur",
    type: "qa",
    points: [
      { num: "1", title: "Failover Otomatis < 5 Menit", desc: "Sistem monitoring (Uptime/Sentry) mendeteksi down dalam <2 menit, lalu DNS/edge langsung mengalihkan rute ke halaman statis pemeliharaan darurat agar user tidak melihat layar putih atau error JSON." },
      { num: "2", title: "Strategi Rollback < 15 Menit", desc: "Jika bug terjadi pasca-rilis, kami memprioritaskan rollback commit stabil sebelumnya dibanding memaksakan hotfix live di produksi, menjamin stabilitas secepat mungkin." },
      { num: "3", title: "Service Level Agreement (SLA) Komplain", desc: "Komplain finansial atau akses kamar (P0) wajib direspons dalam 15-30 menit dan diselesaikan dalam 2-4 jam dengan siklus 3 langkah: Akui & Empati -> Berikan ETA -> Konfirmasi Penuntasan." }
    ],
    script: `Jika penguji bertanya: 'Bagaimana jika server Anda down saat penghuni ingin bayar atau masuk kamar?', sampaikan: Kami memiliki SOP Server Down dengan deteksi <2 menit, failover ke halaman statis <5 menit, dan rollback <15 menit. Untuk urusan darurat seperti kunci pintu atau nota double, tim support memiliki SLA respon 15-30 menit.`
  }
];

function generateHtml() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KostKu ✦ Slide Deck Presentasi Sidang RPL (Aesthetic Edition)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-cream: #fdfaf7;
      --bg-pink-soft: #fff1f5;
      --pink-primary: #f43f5e;
      --pink-soft: #ffe4e6;
      --pink-border: #fbcfe8;
      --lavender-primary: #8b5cf6;
      --lavender-soft: #f3e8ff;
      --lavender-border: #ddd6fe;
      --mint-primary: #10b981;
      --mint-soft: #ecfdf5;
      --mint-border: #a7f3d0;
      --indigo-dark: #1e1b4b;
      --slate-body: #475569;
      --white-card: rgba(255, 255, 255, 0.94);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #0f172a;
      color: var(--indigo-dark);
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    /* Presentation Viewport */
    #deck-container {
      flex: 1;
      position: relative;
      width: 100vw;
      height: calc(100vh - 65px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 10% 20%, #1e1b4b 0%, #0f172a 100%);
      padding: 16px;
    }

    .slide {
      display: none;
      width: 100%;
      max-width: 1280px;
      aspect-ratio: 16 / 9;
      max-height: calc(100vh - 90px);
      background: linear-gradient(135deg, #fff7fa 0%, #ffffff 50%, #fbf8ff 100%);
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
      padding: 40px 48px;
      flex-direction: column;
      border: 3px solid #fbcfe8;
    }

    .slide.active {
      display: flex;
      animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: scale(0.97) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Top Cute Header */
    .slide-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: #ffe4e6;
      border: 1.5px solid #f43f5e;
      color: #be123c;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .slide-counter-badge {
      font-family: 'Quicksand', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.8);
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
    }

    .slide-title-area h1 {
      font-size: 2.1rem;
      font-weight: 800;
      color: var(--indigo-dark);
      line-height: 1.2;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }

    .slide-title-area p {
      font-size: 1.05rem;
      color: #64748b;
      margin-bottom: 24px;
    }

    /* Card Layouts */
    .split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      flex: 1;
    }

    .cards-3-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      flex: 1;
    }

    .cute-card {
      background: var(--white-card);
      border-radius: 18px;
      padding: 22px 24px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
      border: 1.5px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .cute-card.pink {
      background: #fff5f8;
      border-color: #fbcfe8;
    }

    .cute-card.purple {
      background: #fbf8ff;
      border-color: #ddd6fe;
    }

    .cute-card.mint {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .cute-card.indigo {
      background: #eef2ff;
      border-color: #c7d2fe;
    }

    .card-header-cute {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
      padding-bottom: 10px;
    }

    .card-header-cute h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--indigo-dark);
    }

    .mini-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.05);
    }

    .item-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .list-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .list-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .list-text strong {
      display: block;
      font-size: 0.92rem;
      color: var(--indigo-dark);
      font-weight: 700;
    }

    .list-text span {
      font-size: 0.82rem;
      color: var(--slate-body);
      line-height: 1.4;
      display: block;
    }

    /* Cover Slide Specific */
    .cover-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    .cover-main h1 {
      font-size: 3.2rem;
      font-weight: 900;
      color: var(--indigo-dark);
      line-height: 1.1;
      margin: 12px 0;
      letter-spacing: -0.03em;
    }

    .cover-main h1 span {
      background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-main p {
      font-size: 1.3rem;
      color: #64748b;
      max-width: 850px;
    }

    /* Table Slide */
    .raci-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border-radius: 16px;
      overflow: hidden;
      border: 1.5px solid #e2e8f0;
      background: #ffffff;
      font-size: 0.9rem;
    }

    .raci-table th {
      background: #f8fafc;
      color: var(--indigo-dark);
      padding: 14px 16px;
      font-weight: 800;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }

    .raci-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: var(--slate-body);
    }

    .raci-table tr:last-child td {
      border-bottom: none;
    }

    .tag-r { background: #ffe4e6; color: #be123c; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 0.78rem; }
    .tag-a { background: #ede9fe; color: #5b21b6; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 0.78rem; }
    .tag-c { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; }
    .tag-i { background: #f1f5f9; color: #64748b; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; }

    /* Bottom Control Bar */
    #bottom-bar {
      height: 65px;
      background: #090d16;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
    }

    .nav-btn-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-ctrl {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn-ctrl:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-ctrl.pink-btn {
      background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%);
      border: none;
      color: white;
      font-weight: 700;
    }

    .btn-ctrl.pink-btn:hover {
      box-shadow: 0 0 15px rgba(244, 63, 94, 0.5);
    }

    /* Speaker Notes Drawer (Collapsible) */
    #notes-drawer {
      position: fixed;
      bottom: 65px;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.98);
      backdrop-filter: blur(20px);
      border-top: 2px solid #f43f5e;
      padding: 24px 32px;
      color: #f8fafc;
      transform: translateY(100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 100;
      max-height: 45vh;
      overflow-y: auto;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
    }

    #notes-drawer.open {
      transform: translateY(0);
    }

    .notes-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #fda4af;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .notes-script-box {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #e2e8f0;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 14px;
      white-space: pre-line;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .notes-tips-box {
      font-size: 0.85rem;
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .notes-tips-box strong {
      color: #fde047;
    }

    /* PDF Print Styles */
    @page {
      size: 16in 9in;
      margin: 0;
    }

    @media print {
      html, body {
        font-size: 19px !important;
        background: #0f172a !important;
        overflow: visible !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #bottom-bar, #notes-drawer {
        display: none !important;
      }
      #deck-container {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        display: block !important;
        width: 16in !important;
        height: auto !important;
      }
      .slide {
        display: flex !important;
        page-break-after: always !important;
        break-after: page !important;
        width: 16in !important;
        height: 9in !important;
        max-width: 16in !important;
        max-height: 9in !important;
        min-height: 9in !important;
        border-radius: 0 !important;
        border: none !important;
        box-shadow: none !important;
        box-sizing: border-box !important;
        padding: 0.65in 0.85in !important;
        overflow: hidden !important;
        background: linear-gradient(135deg, #fff7fa 0%, #ffffff 50%, #fbf8ff 100%) !important;
      }
      .slide.active {
        animation: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- VIEWPORT SLIDES -->
  <div id="deck-container">
    ${slidesData.map((s, idx) => `
      <div class="slide ${idx === 0 ? 'active' : ''}" id="slide-${idx}">
        <div class="slide-topbar">
          <div class="badge-pill">${s.tag}</div>
          <div class="slide-counter-badge">${s.num} / ${slidesData.length} ✦ KostKu RPL</div>
        </div>

        <div class="slide-title-area">
          <h1>${s.title}</h1>
          <p>${s.subtitle}</p>
        </div>

        ${s.type === 'cover' ? `
          <div class="cards-3-grid" style="margin-top: 10px;">
            ${s.metrics.map(m => `
              <div class="cute-card pink">
                <div style="font-size: 2rem; margin-bottom: 8px;">${m.icon}</div>
                <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e1b4b; margin-bottom: 6px;">${m.title}</h3>
                <p style="font-size: 0.88rem; color: #64748b;">${m.desc}</p>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 24px; font-size: 0.9rem; color: #94a3b8; font-weight: 600;">
            ✦ Karya Siswi Rekayasa Perangkat Lunak (RPL) ✦ v1.0.4 Production Release
          </div>
        ` : ''}

        ${s.type === 'split' ? `
          <div class="split-grid">
            <div class="cute-card ${s.colLeft.color}">
              <div class="card-header-cute">
                <h3>${s.colLeft.title}</h3>
                <span class="mini-badge">${s.colLeft.badge}</span>
              </div>
              <div class="item-list">
                ${s.colLeft.items.map(it => `
                  <div class="list-row">
                    <span class="list-icon">${it.icon}</span>
                    <div class="list-text">
                      <strong>${it.title}</strong>
                      <span>${it.desc}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="cute-card ${s.colRight.color}">
              <div class="card-header-cute">
                <h3>${s.colRight.title}</h3>
                <span class="mini-badge">${s.colRight.badge}</span>
              </div>
              <div class="item-list">
                ${s.colRight.items.map(it => `
                  <div class="list-row">
                    <span class="list-icon">${it.icon}</span>
                    <div class="list-text">
                      <strong>${it.title}</strong>
                      <span>${it.desc}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        ${s.type === 'blueprint' ? `
          <div class="split-grid">
            <div class="cute-card pink">
              <div class="card-header-cute">
                <h3>Fitur Unggulan Arsitektur</h3>
                <span class="mini-badge">Skala 1:50 Presisi</span>
              </div>
              <div class="item-list">
                ${s.bullets.map(b => `
                  <div class="list-row">
                    <span class="list-icon">${b.icon}</span>
                    <div class="list-text">
                      <strong>${b.title}</strong>
                      <span>${b.desc}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="cute-card" style="background: #071120; border-color: #38bdf8; color: white;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 8px; margin-bottom: 12px;">
                <span style="font-family: monospace; font-size: 0.75rem; color: #38bdf8; font-weight: bold;">SVG BLUEPRINT SCALE 1:50 ARCH</span>
                <span style="font-size: 0.75rem; color: #facc15;">Dimensi: 4.0m x 4.5m (18 m²)</span>
              </div>
              <svg width="100%" height="auto" viewBox="0 0 500 240" style="display:block; margin: 0 auto;">
                <rect width="500" height="240" fill="#071120" />
                <rect x="20" y="20" width="460" height="200" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="2" rx="4" />
                <!-- Door -->
                <line x1="60" y1="220" x2="100" y2="220" stroke="#071120" stroke-width="4" />
                <path d="M 60 220 Q 60 180, 100 180" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" />
                <line x1="60" y1="220" x2="60" y2="180" stroke="#38bdf8" stroke-width="2" />
                <text x="50" y="210" fill="#38bdf8" font-size="9" font-weight="bold">PINTU</text>
                <!-- Window -->
                <line x1="320" y1="20" x2="420" y2="20" stroke="#facc15" stroke-width="4" />
                <text x="370" y="36" fill="#facc15" font-size="9" font-weight="bold" text-anchor="middle">JENDELA LUAR</text>
                <!-- Bed -->
                <g transform="translate(300, 60)">
                  <rect width="150" height="130" fill="rgba(59, 130, 246, 0.25)" stroke="#60a5fa" stroke-width="2" rx="6" />
                  <rect x="15" y="10" width="50" height="30" fill="white" rx="3" />
                  <rect x="85" y="10" width="50" height="30" fill="white" rx="3" />
                  <text x="75" y="85" fill="white" font-size="11" font-weight="bold" text-anchor="middle">KASUR QUEEN</text>
                  <text x="75" y="102" fill="#bfdbfe" font-size="8.5" text-anchor="middle">160 x 200 cm</text>
                </g>
                <!-- Desk -->
                <g transform="translate(40, 40)">
                  <rect width="110" height="45" fill="rgba(16, 185, 129, 0.25)" stroke="#34d399" stroke-width="2" rx="4" />
                  <circle cx="55" cy="55" r="10" fill="#10b981" />
                  <text x="55" y="30" fill="#34d399" font-size="9" font-weight="bold" text-anchor="middle">MEJA BELAJAR</text>
                </g>
              </svg>
            </div>
          </div>
        ` : ''}

        ${s.type === 'cards3' ? `
          <div class="cards-3-grid">
            ${s.cards.map(c => `
              <div class="cute-card ${c.color}">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">${c.icon}</div>
                <span class="mini-badge" style="align-self: flex-start; margin-bottom: 8px;">${c.badge}</span>
                <h3 style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin-bottom: 8px;">${c.title}</h3>
                <p style="font-size: 0.88rem; color: #475569; white-space: pre-line; line-height: 1.5;">${c.desc}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.type === 'flow' ? `
          <div class="split-grid">
            <div class="cute-card ${s.flow1.color}">
              <div class="card-header-cute">
                <h3>${s.flow1.title}</h3>
                <span class="mini-badge">${s.flow1.badge}</span>
              </div>
              <div class="item-list">
                ${s.flow1.steps.map(step => `
                  <div style="background: white; border-radius: 10px; padding: 12px 14px; border: 1px solid #fbcfe8; font-size: 0.9rem; font-weight: 600; color: #1e1b4b;">
                    ${step}
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="cute-card ${s.flow2.color}">
              <div class="card-header-cute">
                <h3>${s.flow2.title}</h3>
                <span class="mini-badge">${s.flow2.badge}</span>
              </div>
              <div class="item-list">
                ${s.flow2.steps.map(step => `
                  <div style="background: white; border-radius: 10px; padding: 12px 14px; border: 1px solid #ddd6fe; font-size: 0.9rem; font-weight: 600; color: #1e1b4b;">
                    ${step}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        ${s.type === 'table' ? `
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <table class="raci-table">
              <thead>
                <tr>
                  ${s.headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${s.rows.map(r => `
                  <tr>
                    <td style="font-weight: 700; color: #1e1b4b;">${r[0]}</td>
                    <td><span class="tag-r">${r[1]}</span></td>
                    <td><span class="tag-c">${r[2]}</span></td>
                    <td><span class="tag-a">${r[3]}</span></td>
                    <td><span class="${r[4].includes('Lead') ? 'tag-r' : 'tag-i'}">${r[4]}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 14px; font-size: 0.8rem; color: #64748b;">
              <strong>RACI Framework:</strong> 
              <span class="tag-r">R = Responsible</span> (Pelaksana Utama), 
              <span class="tag-a">A = Accountable</span> (Pemegang Keputusan & Kelulusan), 
              <span class="tag-c">C = Consulted</span> (Konsultan Teknis), 
              <span class="tag-i">I = Informed</span> (Penerima Informasi).
            </div>
          </div>
        ` : ''}

        ${s.type === 'closing' ? `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 12px;">🌸✨🎀</div>
            <h2 style="font-size: 2.4rem; font-weight: 900; color: #be123c; margin-bottom: 8px;">TERIMA KASIH BANYAK!</h2>
            <p style="font-size: 1.2rem; color: #475569; max-width: 700px; margin-bottom: 24px;">
              Kami siap mendemonstrasikan sistem secara langsung dan menyambut sesi tanya-jawab dari Bapak dan Ibu Dewan Penguji.
            </p>
            <div style="display: flex; gap: 14px;">
              <span class="badge-pill" style="font-size: 0.9rem; padding: 8px 18px;">📱 Android APK Ready</span>
              <span class="badge-pill" style="font-size: 0.9rem; padding: 8px 18px; background: #ede9fe; border-color: #8b5cf6; color: #5b21b6;">💻 Desktop Electron Ready</span>
              <span class="badge-pill" style="font-size: 0.9rem; padding: 8px 18px; background: #ecfdf5; border-color: #10b981; color: #065f46;">🌐 Web PWA Live</span>
            </div>
          </div>
        ` : ''}

        ${s.type === 'qa' ? `
          <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
            ${s.points.map(p => `
              <div class="cute-card" style="padding: 16px 20px; background: #ffffff; border-color: #fbcfe8;">
                <h4 style="font-size: 1.05rem; font-weight: 800; color: #be123c; margin-bottom: 4px;">
                  ✦ ${p.title}
                </h4>
                <p style="font-size: 0.9rem; color: #475569; line-height: 1.5;">${p.desc}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <!-- BOTTOM CONTROLS BAR -->
  <div id="bottom-bar">
    <div style="display: flex; align-items: center; gap: 12px; color: #e2e8f0; font-size: 0.9rem; font-weight: 700;">
      <span>🏠 KostKu RPL Deck</span>
      <span style="color: #64748b;">•</span>
      <span id="slide-indicator" style="color: #f43f5e;">Slide 1 dari ${slidesData.length}</span>
    </div>

    <div class="nav-btn-group">
      <button class="btn-ctrl" onclick="prevSlide()" title="Slide Sebelumnya (Panah Kiri)">⬅ Sebelumnya</button>
      <button class="btn-ctrl pink-btn" onclick="nextSlide()" title="Slide Selanjutnya (Panah Kanan)">Selanjutnya ➡</button>
      <button class="btn-ctrl" onclick="toggleNotes()" id="btn-notes" title="Buka Catatan Pembicara (Speaker Script)">🎙️ Catatan Pembicara</button>
      <button class="btn-ctrl" onclick="toggleFullscreen()" title="Layar Penuh (F)">⛶ Fullscreen</button>
    </div>
  </div>

  <!-- SPEAKER NOTES DRAWER -->
  <div id="notes-drawer">
    <div class="notes-title">
      <span>🎙️ NASKAH PRESENTASI & TIPS PEMBAWAAN (SPEAKER SCRIPT)</span>
      <button onclick="toggleNotes()" style="background: none; border: none; color: #f43f5e; font-weight: 800; cursor: pointer; font-size: 1rem;">✕ Tutup</button>
    </div>
    <div class="notes-script-box" id="notes-content-script"></div>
    <div class="notes-tips-box" id="notes-content-tips"></div>
  </div>

  <script>
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    let currentSlide = 0;

    const scriptsData = ${JSON.stringify(slidesData.map(s => ({ script: s.script || '', tips: s.tips || [] })))};

    function updateSlide() {
      slides.forEach((sl, idx) => {
        sl.classList.toggle('active', idx === currentSlide);
      });
      document.getElementById('slide-indicator').textContent = 'Slide ' + (currentSlide + 1) + ' dari ' + totalSlides;

      // Update speaker script
      const data = scriptsData[currentSlide];
      document.getElementById('notes-content-script').textContent = data.script || 'Tidak ada naskah khusus untuk slide ini.';
      
      const tipsContainer = document.getElementById('notes-content-tips');
      tipsContainer.innerHTML = '';
      if (data.tips && data.tips.length > 0) {
        tipsContainer.innerHTML = '<strong>💡 Catatan & Tips Pembawaan:</strong>' + data.tips.map(t => '<div>• ' + t + '</div>').join('');
      }
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
      }
    }

    function toggleNotes() {
      const drawer = document.getElementById('notes-drawer');
      drawer.classList.toggle('open');
      const btn = document.getElementById('btn-notes');
      btn.style.borderColor = drawer.classList.contains('open') ? '#f43f5e' : 'rgba(255, 255, 255, 0.15)';
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'n' || e.key === 'N') {
        toggleNotes();
      }
    });

    // Initialize
    updateSlide();
  </script>
</body>
</html>`;
}

const htmlOut = path.join(__dirname, 'KostKu_Presentasi_Sidang_RPL_Aesthetic.html');
const pdfOut = path.join(__dirname, 'KostKu_Slide_Presentasi_Aesthetic.pdf');

fs.writeFileSync(htmlOut, generateHtml());
console.log('Slide Deck HTML created at:', htmlOut);

// Render each slide to PDF using Google Chrome
const chromeCmd = `google-chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfOut}" "${htmlOut}"`;
console.log('Rendering 16:9 PDF slide deck...');
execSync(chromeCmd, { stdio: 'inherit' });

console.log('Slide Deck PDF saved at:', pdfOut);
const stat = fs.statSync(pdfOut);
console.log('PDF Size:', (stat.size / 1024).toFixed(1), 'KB');

// Copy to Downloads & Artifacts
const downloadsDir = '/home/rena/Downloads';
const brainArtifactDir = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';

fs.copyFileSync(htmlOut, path.join(downloadsDir, 'KostKu_Presentasi_Sidang_RPL_Aesthetic.html'));
fs.copyFileSync(pdfOut, path.join(downloadsDir, 'KostKu_Slide_Presentasi_Aesthetic.pdf'));
fs.copyFileSync(htmlOut, path.join(brainArtifactDir, 'KostKu_Presentasi_Sidang_RPL_Aesthetic.html'));
fs.copyFileSync(pdfOut, path.join(brainArtifactDir, 'KostKu_Slide_Presentasi_Aesthetic.pdf'));

console.log('Files successfully copied to Downloads and Artifacts!');
