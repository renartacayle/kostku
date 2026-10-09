const fs = require('fs');
const path = require('path');

const slides = [
  {
    num: "01",
    tag: "🌸 SIDANG UJIAN PROYEK REKAYASA PERANGKAT LUNAK (RPL)",
    title: "KOSTKU ✦ SMART BOARDING PLATFORM",
    subtitle: "Ekosistem Digital Terpadu Dua Sisi: Marketplace Denah Interaktif 2D & Back-Office Pengelola Kos",
    type: "cover",
    metrics: [
      { icon: "🎀", title: "0% Komisi Booking", desc: "Bebas biaya sewa tanpa komisi potongan mencekik seumur hidup" },
      { icon: "✨", title: "<15KB Vektor Denah", desc: "Denah SVG interaktif skala arsitektur presisi 1:50 near-zero latency" },
      { icon: "💻", title: "Local-First Architecture", desc: "Tetap operasional lancar tanpa koneksi internet (Zero-Offline Latency)" }
    ],
    script: "Selamat pagi Bapak dan Ibu Dosen/Guru Penguji. Mari kita mulai dengan sebuah fakta lapangan: Industri pencarian dan pengelolaan indekos di Indonesia saat ini terjebak dalam mismatch ekspektasi yang cukup tinggi.\n\nPencari kos sering kali tertipu oleh foto sudut lebar yang memanipulasi skala ruangan. Di sisi lain, pemilik kos berjuang secara manual mencatat pembayaran dan utilitas listrik di buku tulis yang rentan rusak.\n\nHari ini, kami memperkenalkan KostKu—ekosistem digital dua sisi yang memecahkan reality gap tersebut melalui pengintegrasian Architectural 2D Blueprint Engine dan sistem pengelolaan back-office berbasis local-first.",
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
        { icon: "🚪", title: "Buta Tata Letak & Ventilasi", desc: "Letak kamar mandi dalam dan jendela arah sinar matahari luar tidak jelas." },
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
        { icon: "🏷️", title: "Komisi Kompetitor Mencekik", desc: "Potongan 5% hingga 12% per transaksi membuat pemilik enggan memakai sistem." }
      ]
    },
    script: "Berdasarkan hasil analisis kebutuhan perangkat lunak yang kami lakukan, terdapat dua pilar masalah utama:\n\nPertama, dari sudut pandang penyewa: Foto promosi umum di marketplace kerap manipulatif. Penyewa tidak dapat mengetahui apakah kasur queen size atau meja kerja mereka benar-benar muat sebelum melakukan survei fisik.\n\nKedua, dari sudut pandang pengelola: Pengawasan pembayaran sewa dan perhitungan variabel utilitas seperti listrik meteran masih dilakukan secara manual. Hal ini memicu sengketa perhitungan angka kWh dan memerlukan waktu administrasi berjam-jam tiap bulannya.",
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
      { icon: "✨", title: "Ukuran File Sangat Ringan (<15 KB)", desc: "Dapat dimuat instan (near-zero latency) bahkan pada koneksi seluler 3G hemat daya." },
      { icon: "📐", title: "Skala Presisi Arsitektur 1:50", desc: "Menggambarkan proporsi riil kasur springbed (160x200), meja laptop, dan lemari pakaian." },
      { icon: "☀️", title: "Orientasi Cahaya Matahari & Jendela", desc: "Memperlihatkan arah bukaan ventilasi alami dan pencahayaan matahari luar ruangan." },
      { icon: "🟢", title: "Status Ketersediaan Kamar Dinamis", desc: "Hijau = Kamar Kosong, Merah = Terisi, Kuning = Dalam Masa Perbaikan (Maintenance)." }
    ],
    script: "Inilah fondasi inovasi teknis utama dari KostKu: Architectural 2D Blueprint Engine. Kami tidak mengandalkan foto statis atau media 360 derajat yang membutuhkan beban data besar. Kami merancang mesin rendering denah berbasis SVG interaktif berskala presisi 1:50.\n\nPencari kos dapat melihat objek ruangan secara aktual—termasuk proporsi kasur queen size 160x200 centimeter, tata letak meja kerja, hingga orientasi bukaan jendela terhadap arah datangnya sinar matahari.\n\nData denah ini bersifat dinamis. Ketika sebuah kamar terisi di sistem back-office, visualisasi denah di marketplace akan langsung mengupdate status ketersediaannya secara instan.",
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
        { icon: "📸", title: "Scan Foto Kamar via AI", desc: "AI Vision memindai foto kamar asli dan mengidentifikasi batas dinding & bukaan pintu." },
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
    script: "Pada evolusi produk terbaru kami, KostKu memperkenalkan AI Vision Room Scanner dan 3D Isometric Cutaway Viewer.\n\nPemilik kos tidak perlu memiliki keahlian arsitektur untuk membuat denah. Cukup unggah foto kamar, dan AI akan memindai ruang serta mengajukan kuesioner interaktif perabot—mulai dari ukuran kasur single hingga king size, AC, hingga kamar mandi dalam—lalu men-generate model 3D interaktif yang dapat diputar 4 sudut pandang dengan mode siang dan malam.",
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
        { icon: "5️⃣", title: "Nomor Referensi Unik", desc: "INV-{TIMESTAMP}-{NOMOR_KAMAR} tercatat otomatis di database" }
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
    script: "Selain menghadirkan pengalaman visual untuk pencari kos, KostKu menyederhanakan operasional pengelola melalui modul otomatisasi tagihan utilitas.\n\nSistem kami mengimplementasikan logika kalkulasi matematis otomatis untuk menghitung penggunaan variabel listrik. Pengelola cukup memasukkan angka meteran akhir, dan sistem secara otomatis mengkalkulasikan selisih pemakaian dikali tarif per kWh, kemudian menggabungkannya dengan biaya sewa pokok.\n\nSetelah tagihan terbuat, sistem memfasilitasi komunikasi lewat pemformatan deep-link 1-klik ke WhatsApp. Pengelola dapat mengirimkan transparansi rincian tagihan langsung ke nomor penyewa tanpa perlu mengetik ulang secara manual.",
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
        desc: "Satu basis kode terpadu untuk tiga runtime: Android APK (Capacitor), Windows Desktop (Electron), dan Web Browser (PWA) dengan antarmuka responsif."
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
        desc: "Sinkronisasi asinkron berbasis delta-sync saat online dan manajemen autentikasi Google OAuth 2.0 terpusat dengan integritas database relasional."
      }
    ],
    script: "Untuk menjamin keandalan sistem pada berbagai kondisi operasional, KostKu dibangun dengan pendekatan Hybrid Local-First Architecture.\n\nDi sisi frontend, kami memanfaatkan React 18 dan Vite. Di sisi runtime aplikasi, kami membungkus kode dasar yang sama menggunakan Capacitor untuk platform Android dan Electron untuk Desktop, serta PWA untuk dukungan perambah Web.\n\nPrinsip Local-First memastikan bahwa pengelola kos tetap dapat melakukan pembukuan dan mencatat transaksi meskipun koneksi internet terputus. Data disimpan di penyimpan lokal berbasis SQLite, yang kemudian secara asinkron disinkronkan ke cloud Supabase ketika koneksi internet kembali aktif.",
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
    script: "Sistem KostKu dirancang untuk melayani dua persona pengguna utama dengan alur kerja yang sangat terpisah namun terintegrasi dalam satu platform.\n\nPada Public Flow di atas, alur dibuat sangat efisien tanpa hambatan registrasi yang tidak perlu. Pencari kos dapat langsung mengeksplorasi denah 2D dan 3D, memfilter ketersediaan kamar, dan melakukan kontak langsung dengan pemilik kos.\n\nPada Admin Flow di bawah, alur diproteksi dengan otentikasi ketat. Pengelola dapat memantau tingkat hunian melalui dashboard, menyetujui pengajuan sewa dalam satu klik, mencatat pemakaian utilitas, menggenerate tagihan bulanan, hingga memantau tiket komplain.",
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
        { icon: "📍", title: "Verifikasi Lokasi Google Maps", desc: "Pendaftaran kos wajib menyertakan koordinat GPS dan tautan Google Maps nyata." }
      ]
    },
    colRight: {
      title: "🔑 Pemulihan Akun & Smart Approval",
      badge: "Account Lifecycle",
      color: "purple",
      items: [
        { icon: "🔄", title: "Pemulihan Akun via NIK", desc: "Reset sandi mandiri dengan mencocokkan NIK & nama e-KTP resmi kependudukan." },
        { icon: "⚡", title: "1-Click Booking Approval", desc: "Pemilik cukup klik Setujui, sistem auto-assign kamar & generate PIN pintu." },
        { icon: "🏢", title: "Multi-Branch Portfolio", desc: "Satu akun pemilik dapat mengelola banyak cabang kost dengan switch instan." },
        { icon: "✍️", title: "Kontrak Digital & E-Signature", desc: "Tanda tangan digital canvas untuk perjanjian staf dan penjaga kos." }
      ]
    },
    script: "Integritas ekosistem KostKu diperkuat dengan arsitektur Anti-Bot dan verifikasi identitas resmi.\n\nKami menerapkan aturan 1 KTP hanya untuk 1 Akun. Setiap pengguna wajib menyertakan NIK 16 digit yang divalidasi secara real-time dan mengunggah foto fisik e-KTP resmi. Fitur ini meniadakan akun spam, melindungi pemilik kos dari calon penyewa fiktif, serta menyediakan mekanisme pemulihan akun mandiri menggunakan data kependudukan resmi.",
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
    script: "Masuk ke pendalaman teknis sistem (technical deep dive), slide ini menggambarkan dua mekanisme kritis dalam lifecycle aplikasi KostKu.\n\nPada bagian kiri, diagram alur Auto-Update menunjukkan bagaimana aplikasi desktop Electron dan Android Capacitor memeriksa pembaruan versi biner secara berkala ke server update. Aplikasi secara mandiri melakukan unduhan patch secara efisien tanpa memerlukan instalasi ulang secara keseluruhan oleh pengguna.\n\nPada bagian kanan, kami memperlihatkan manajemen Service Worker pada versi PWA. Kami mengimplementasikan strategi Network-First with Dynamic Cache Fallback, serta skenario pengosongan cache otomatis saat terjadi pembaruan versi data, guna menghindari ketersediaan data basi pada perambah pengguna.",
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
    script: "Bagaimana KostKu bertahan dan memenangkan persaingan pasar? Jawabannya terletak pada model bisnis dan competitive moats yang kami bangun.\n\nPlatform pesaing umumnya memotong komisi transaksi sebesar 5 hingga 15 persen dari nilai sewa. Model ini memberatkan pemilik kos dan memicu transaksi gelap di luar sistem. KostKu menerapkan 0% komisi transaksi sewa, dan beralih ke model langganan perangkat lunak (SaaS) dengan tarif terjangkau sebesar 49 ribu hingga 99 ribu Rupiah per bulan untuk fitur pengelolaan back-office tingkat lanjut.\n\nNilai pertahanan utama kami terletak pada High Switching Cost. Ketika pengelola telah memasukkan riwayat data keuangan dan rancangan denah SVG di KostKu, biaya untuk berpindah ke sistem lain menjadi sangat tinggi, sehingga memberikan recurring revenue yang stabil bagi platform.",
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
    script: "Proyek Rekayasa Perangkat Lunak KostKu dirancang dan dieksekusi dalam siklus sprint 4 minggu yang terukur secara disiplin dengan RACI Matrix yang jelas.\n\nSetiap pilar utama—mulai dari mesin denah 2D/3D, pemindai AI Vision, verifikasi Anti-Bot e-KTP, pengujian lintas platform, hingga integrasi tautan WhatsApp—memiliki penanggung jawab (Responsible) dan pemegang keputusan (Accountable) yang terdefinisi dengan transparan.",
    tips: [
      "Gestur: Berdiri sejajar dengan tabel, gunakan gerakan tangan terbuka mengarah ke seluruh nama anggota tim.",
      "Pointer: Sorot baris-baris milestone penting pada matriks RACI.",
      "Penekanan: Tutup dengan nada tegas dan percaya diri."
    ]
  },
  {
    num: "12",
    tag: "🔄 METODOLOGI SOFTWARE PROSES",
    title: "Implementasi Scrum Framework pada Siklus KostKu",
    subtitle: "Iterasi cepat 2 minggu (Sprint), transparansi empiris, dan integrasi praktik teknis XP",
    type: "split",
    colLeft: {
      title: "⚡ Struktur Sprint & Upacara Scrum",
      badge: "Empirical Lifecycle",
      color: "pink",
      items: [
        { icon: "📅", title: "Siklus Sprint 2 Minggu", desc: "Sprint 1 Denah SVG ➔ Sprint 2 Utilitas/WA ➔ Sprint 3 Anti-Bot NIK ➔ Sprint 4 AI Scanner." },
        { icon: "🗣️", title: "Daily Scrum 15 Menit", desc: "Sinkronisasi harian modul frontend-backend dan eliminasi hambatan teknis seketika." },
        { icon: "🎯", title: "Sprint Review & Retrospektif", desc: "Demonstrasi live increment perangkat lunak dan evaluasi peningkatan efisiensi tim." },
        { icon: "✅", title: "Definition of Done (DoD) Ketat", desc: "Unit testing lulus 100%, zero lint error, responsif multi-device, dan blueprint terbarui." }
      ]
    },
    colRight: {
      title: "🎯 Alasan Pemilihan & Keuntungan",
      badge: "Strategic Justification",
      color: "purple",
      items: [
        { icon: "🚀", title: "Rapid Feedback Loop Pasar", desc: "Memvalidasi antarmuka langsung ke dua persona: mahasiswa perantau dan bapak/ibu kos." },
        { icon: "🤖", title: "Eksplorasi Inovasi Fleksibel", desc: "Mampu mengadopsi AI Vision Room Scanner & Three.js tanpa terhambat spesifikasi kaku." },
        { icon: "🛡️", title: "Mitigasi Scope Creep via MoSCoW", desc: "Product Owner mengunci fitur Must-Have (60%) agar rilis produk selalu tepat waktu." },
        { icon: "🛠️", title: "Adopsi Praktik Rekayasa XP", desc: "Diperkuat Pair Programming pada modul kritis dan CI/CD otomatis via GitHub Actions." }
      ]
    },
    script: "Untuk merekayasa perangkat lunak KostKu secara adaptif dan terukur, kami memilih metodologi Agile dengan Framework Scrum yang diperkaya praktik rekayasa Extreme Programming.\n\nDengan siklus Sprint 2 minggu, kami mampu merilis fungsionalitas produk bertahap—mulai dari MVP marketplace denah 2D, kalkulator utilitas, hingga AI Room Scanner. Daily Scrum menjaga sinkronisasi tim lintas-fungsi, sementara Definition of Done menjamin setiap kode yang dihasilkan bebas bug sebelum digabungkan.",
    tips: [
      "Gestur: Gerakan tangan berputar membentuk lingkaran untuk menggambarkan siklus Sprint 2 minggu.",
      "Pointer: Sorot urutan Sprint 1 hingga 4 lalu tunjukkan klausul Definition of Done.",
      "Penekanan: Tekan kata 'Rapid Feedback Loop' dan 'Sinergi Scrum dengan Praktik XP'."
    ]
  },
  {
    num: "13",
    tag: "📚 LANDASAN TEORI AGILE",
    title: "Komparasi Teori Model Agile: XP vs Scrum vs DSDM",
    subtitle: "Kajian komparatif filosofi, fokus rekayasa, dan tata kelola proyek perangkat lunak",
    type: "cards3",
    cards: [
      {
        icon: "💻",
        badge: "Extreme Programming (XP)",
        color: "pink",
        title: "Keunggulan Rekayasa Teknis",
        desc: "• Pencetus: Kent Beck (1999)\n• 5 Nilai: Komunikasi, Simplicity, Feedback, Courage, Respect\n• 12 Praktik: TDD, Pair Programming, CI, Refactoring, Simple Design, Small Releases\n• Fokus: Kualitas basis kode & minim bug."
      },
      {
        icon: "🔄",
        badge: "Scrum Framework",
        color: "purple",
        title: "Manajemen Adaptif & Empiris",
        desc: "• Pencetus: Schwaber & Sutherland (1995)\n• 3 Pilar Empirisme: Transparansi, Inspeksi, Adaptasi\n• 3 Peran: PO, Scrum Master, Developers\n• 5 Event: Sprint (1-4 mg), Planning, Daily, Review, Retro\n• 3 Artefak: Backlog, Sprint Backlog, Increment (DoD)."
      },
      {
        icon: "🏛️",
        badge: "DSDM (Dynamic Systems)",
        color: "mint",
        title: "Tata Kelola Bisnis Enterprise",
        desc: "• Konsorsium DSDM (1994, Inggris)\n• Filosofi: Waktu, Biaya, Kualitas TETAP; Fitur VARIABEL\n• 8 Prinsip: Deliver on time, Never compromise quality\n• MoSCoW: Must Have (60%), Should, Could, Won't have\n• 4 Fase Siklus: Feasibility s.d Deployment."
      }
    ],
    script: "Sebagai landasan ilmiah teoritis, kami membedah tiga model Agile utama dalam rekayasa perangkat lunak: Extreme Programming, Scrum, dan DSDM.\n\nXP berfokus ekstrem pada keunggulan teknis penulisan kode melalui TDD dan Pair Programming. Scrum berfokus pada manajemen empiris dan fleksibilitas tim melalui wadah Sprint dan akuntabilitas peran. Sedangkan DSDM berfokus pada tata kelola bisnis korporat dengan mengunci waktu dan biaya serta memvariasikan fitur menggunakan metode MoSCoW.\n\nKostKu mensintesis keunggulan Scrum sebagai payung manajerial dan mengadopsi disiplin XP untuk kualitas kodenya.",
    tips: [
      "Gestur: Tunjukkan perbandingan 3 kolom secara seimbang dari kiri ke kanan.",
      "Pointer: Sorot perbedaan fokus: XP (Engineering) vs Scrum (Management) vs DSDM (Business Governance).",
      "Penekanan: Tekan kesimpulan 'Sintesis terbaik: Scrum sebagai manajemen, XP sebagai disiplin kode'."
    ]
  },
  {
    num: "14",
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
    script: "Untuk menjamin ketersediaan sistem dan kepuasan pengguna di tingkat enterprise, KostKu menetapkan 3 pilar Standar Operasional Prosedur (SOP) baku:\n\nPertama, SOP Maintenance Terjadwal: Pemeliharaan server hanya dilakukan di jam sepi antara pukul 01.00 hingga 04.00 pagi, didahului banner pengumuman 24 jam dan full backup database.\n\nKedua, SOP Tanggap Darurat Server Down: Dilengkapi monitoring otomatis, failover ke halaman statis dalam waktu kurang dari 5 menit, dan prosedur rollback cepat di bawah 15 menit jika terdeteksi regresi rilis.\n\nKetiga, SOP Penanganan Komplain: Memiliki matriks SLA ketat, di mana komplain mendesak terkait keuangan atau akses kamar wajib direspons dalam 15 hingga 30 menit melalui siklus 3 langkah terstandarisasi.",
    tips: [
      "Gestur: Tunjukkan sikap bertanggung jawab dan profesional dalam tata kelola sistem.",
      "Pointer: Tunjukkan target SLA 15-30 menit untuk komplain mendesak.",
      "Penekanan: Tekan kata 'Full Backup Pra-Maintenance' dan 'Zero Data Loss'."
    ]
  },
  {
    num: "15",
    tag: "💖 KESIMPULAN & PENUTUP",
    title: "KostKu: Platform Manajemen & Marketplace Kost Pintar",
    subtitle: "Siap Mendemonstrasikan Sistem Secara Langsung di Hadapan Penguji",
    type: "closing",
    script: "Sekian pemaparan presentasi dari kami mengenai arsitektur, inovasi teknis, model bisnis, metodologi Agile Scrum, dan standar operasional prosedur KostKu. Kami siap mendemonstrasikan sistem secara langsung dan membuka sesi tanya-jawab kepada Bapak dan Ibu Penguji. Terima kasih banyak!",
    tips: [
      "Tersenyum ramah dan penuh percaya diri.",
      "Buka laptop / HP untuk mendemonstrasikan aplikasi secara live jika diminta.",
      "Persiapkan diri membuka slide panduan Q&A jika dosen mengajukan pertanyaan kritis."
    ]
  },
  {
    num: "16",
    tag: "🛡️ PERTAHANAN Q&A #1",
    title: "Kenapa Denah 2D SVG, Bukan Foto 360 / Virtual Tour?",
    subtitle: "Argumen efisiensi bandwidth, kepastian dimensi riil, dan kemudahan pemeliharaan",
    type: "qa",
    points: [
      { num: "1", title: "Ukuran File & Efisiensi Bandwidth", desc: "Foto 360° / Matterport memakan 10 MB - 50 MB per ruangan. Sebaliknya, denah vektor SVG kami berukuran rata-rata di bawah 15 Kilobytes (<15KB), dapat dimuat instan (near-zero latency) bahkan pada sinyal 3G." },
      { num: "2", title: "Kepastian Dimensi & Tata Letak Ruang", desc: "Foto 360° tetap memakai lensa cembung (fish-eye) yang kerap mendistorsi persepsi ruang. Denah 2D SVG kami menggunakan skala presisi 1:50 yang menunjukkan ukuran fisik riil kasur (160x200cm), sisa ruang gerak, dan lebar pintu." },
      { num: "3", title: "Kemudahan Maintenance & Update Data", desc: "Mengubah tata letak pada foto 360° membutuhkan foto ulang (reshooting) yang mahal. Pada denah SVG, perubahan posisi perabot hanya butuh update atribut koordinat XML/JSON sederhana di sisi frontend." }
    ],
    script: "Jika penguji bertanya: 'Kenapa tidak memakai 360 Virtual Tour seperti Matterport?', sampaikan 3 pilar: Bandwidth (<15KB vs 50MB), Presisi Skala (1:50 tanpa distorsi lensa cembung), dan Maintenance (cukup edit atribut JSON tanpa biaya foto ulang)."
  },
  {
    num: "17",
    tag: "🛡️ PERTAHANAN Q&A #2",
    title: "Kenapa Arsitektur Local-First, Bukan Full Cloud?",
    subtitle: "Argumen zero-offline latency, efisiensi operasional server, dan kedaulatan data",
    type: "qa",
    points: [
      { num: "1", title: "Ketahanan Operasional (Zero-Offline Latency)", desc: "Pemilik kos sering kali mencatat meteran listrik dan penerimaan sewa langsung di lokasi kosan yang sinyalnya lemah (blank spot). Dengan Local-First, operasi input tidak pernah gagal karena ditulis langsung ke SQLite lokal." },
      { num: "2", title: "Pengurangan Beban Operasional Server (Cost Efficiency)", desc: "Operasional read/write harian dialihkan sepenuhnya ke perangkat klien pengguna. Server cloud Supabase hanya menerima paket data selisih (delta sync), memangkas biaya infrastruktur cloud hingga 80%." },
      { num: "3", title: "Keamanan & Privasi Data Pengelola (Data Ownership)", desc: "Data pembukuan sensitif berada di bawah kendali lokal perangkat pemilik kos, mengurangi risiko kebocoran data terpusat pada server pihak ketiga." }
    ],
    script: "Jika penguji bertanya: 'Mengapa memilih SQLite lokal daripada Full Cloud Database terpusat?', sampaikan: 1. Zero-offline latency di area blank spot, 2. Penghematan biaya cloud compute hingga 80%, 3. Kedaulatan data sensitif pemilik kos terjamin."
  },
  {
    num: "18",
    tag: "🛡️ PERTAHANAN Q&A #3",
    title: "Kenapa 0% Komisi & Direct WhatsApp? Rawan Ditinggalkan?",
    subtitle: "Perubahan paradigma software house vs agen calo & retensi berbasis switching cost",
    type: "qa",
    points: [
      { num: "1", title: "Paradigma: Software House vs Marketplace Agent", desc: "KostKu diposisikan sebagai Property Management Software (SaaS), bukan calo perantara sewa. Pendapatan kami berasal dari biaya langganan fitur back-office (Rp 49rb - 99rb/bulan), bukan dari memotong komisi sewa." },
      { num: "2", title: "Menghilangkan Kebiasaan Bypass Transaksi", desc: "Pada platform dengan komisi 5-10%, pemilik dan penyewa selalu berusaha mencari celah bertukar nomor telepon di luar sistem. Dengan 0% komisi dan deep-link WhatsApp, kami merangkul perilaku alami pengguna, bukan melawannya." },
      { num: "3", title: "Menciptakan Retensi melalui High Switching Cost", desc: "Setelah pengelola terbiasa dengan kemudahan cetak kwitansi otomatis, laporan keuangan, dan integrasi data denah, mereka akan terus berlangganan SaaS KostKu karena efisiensi kerja yang didapat jauh melebihi harga langganannya." }
    ],
    script: "Jika penguji bertanya: 'Kenapa memberi kontak WhatsApp langsung? Bukankah platform rawan di-bypass?', sampaikan: Kami adalah SaaS perangkat lunak manajemen properti, bukan makelar komisi. 0% komisi justru menghilangkan niat pengguna untuk mem-bypass sistem dan menciptakan loyalitas retensi jangka panjang."
  },
  {
    num: "19",
    tag: "🛡️ PERTAHANAN Q&A #4",
    title: "Bagaimana Prosedur Server Down & Mitigasi Komplain?",
    subtitle: "Protokol tanggap darurat, failover otomatis, dan SLA komplain terukur",
    type: "qa",
    points: [
      { num: "1", title: "Failover Otomatis < 5 Menit", desc: "Sistem monitoring (Uptime/Sentry) mendeteksi down dalam <2 menit, lalu DNS/edge langsung mengalihkan rute ke halaman statis pemeliharaan darurat agar user tidak melihat layar putih atau error JSON." },
      { num: "2", title: "Strategi Rollback < 15 Menit", desc: "Jika bug terjadi pasca-rilis, kami memprioritaskan rollback commit stabil sebelumnya dibanding memaksakan hotfix live di produksi, menjamin stabilitas secepat mungkin." },
      { num: "3", title: "Service Level Agreement (SLA) Komplain", desc: "Komplain finansial atau akses kamar (P0) wajib direspons dalam 15-30 menit dan diselesaikan dalam 2-4 jam dengan siklus 3 langkah: Akui & Empati -> Berikan ETA -> Konfirmasi Penuntasan." }
    ],
    script: "Jika penguji bertanya: 'Bagaimana jika server Anda down saat penghuni ingin bayar atau masuk kamar?', sampaikan: Kami memiliki SOP Server Down dengan deteksi <2 menit, failover ke halaman statis <5 menit, dan rollback <15 menit. Untuk urusan darurat seperti kunci pintu atau nota double, tim support memiliki SLA respon 15-30 menit."
  }
];

const targetPath = path.join(__dirname, 'slides_data.json');
fs.writeFileSync(targetPath, JSON.stringify(slides, null, 2), 'utf-8');
console.log('Successfully updated slides_data.json with 19 slides at:', targetPath);
