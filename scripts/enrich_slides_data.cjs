const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'slides_data.json');
const slides = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Slide 01: Cover with metrics bullets
slides[0].authors = {
  institution: "Program Studi S1 Teknik Informatika • Fakultas Ilmu Komputer • Universitas Dian Nuswantoro (UDINUS)",
  course: "Mata Kuliah Rekayasa Perangkat Lunak (RPL) • Semester Genap 2025/2026",
  lead: "Oscar Herdian Wijaya (NIM: A11.2025.16309)",
  leadRole: "Lead Software Architect & Fullstack Developer",
  members: [
    { name: "Maulana Hadi Saputra (NIM: A11.2025.16307)", role: "Backend & Database Engineer" },
    { name: "Angelo Joe Lara Anugrah Wisanggeni Putra Tudjiyo (NIM: A11.2025.16337)", role: "UI/UX & Mobile QA Lead" }
  ]
};

slides[0].metrics = [
  {
    icon: "🎀",
    title: "0% Komisi Booking",
    desc: "Bebas biaya sewa tanpa komisi potongan perantara seumur hidup",
    bullets: [
      "Margin pendapatan pemilik kos 100% utuh",
      "Hilangkan insentif transaksi gelap/bypass",
      "Model SaaS terjangkau mulai Rp 49rb/bulan"
    ]
  },
  {
    icon: "📐",
    title: "<15 KB Vektor Denah",
    desc: "Denah SVG interaktif skala arsitektur presisi 1:50 near-zero latency",
    bullets: [
      "Dimuat instan <100ms bahkan pada sinyal 3G",
      "Tampilkan dimensi kasur & sisa ruang riil",
      "Bebas distorsi lensa cembung virtual tour"
    ]
  },
  {
    icon: "💻",
    title: "100% Local-First",
    desc: "Tetap operasional lancar tanpa koneksi internet (Zero-Offline Latency)",
    bullets: [
      "Pencatatan kamar & kWh mulus di blank spot",
      "Embedded SQLite & Cache lokal gawai klien",
      "Pangkas biaya komputasi cloud hingga 80%"
    ]
  }
];

// Slide 06: Hybrid Architecture (cards3 with structured points)
slides[5].cards = [
  {
    icon: "📱",
    badge: "Layer 1: Multi-Platform Clients",
    color: "pink",
    title: "React 18 + Capacitor + Electron",
    rows: [
      { icon: "⚡", bold: "Single Codebase:", text: "1 basis kode web terpadu untuk 3 runtime berbeda" },
      { icon: "🤖", bold: "Android APK:", text: "Dibungkus via Capacitor, akses hardware kamera & GPS" },
      { icon: "💻", bold: "Windows Desktop:", text: "Runtime Electron untuk pengelola kos minim gangguan" },
      { icon: "🌐", bold: "Web PWA:", text: "Tampilan responsif di perambah modern via Vercel" }
    ],
    takeaway: "Ekosistem Multi-Device 100% Terpadu"
  },
  {
    icon: "⚡",
    badge: "Layer 2: Local Processing Engine",
    color: "purple",
    title: "In-Memory Cache & Embedded SQLite",
    rows: [
      { icon: "🚫", bold: "Zero-Offline Latency:", text: "Input data kamar & listrik tak pernah macet di blank spot" },
      { icon: "💾", bold: "Local-First Storage:", text: "Pencatatan langsung ke memori lokal & IndexedDB/SQLite" },
      { icon: "🚀", bold: "Instant UI Response:", text: "Respon antarmuka <16ms tanpa menunggu handshake cloud" },
      { icon: "🔒", bold: "Data Sovereignty:", text: "Data pembukuan sensitif tersimpan aman di HP pengguna" }
    ],
    takeaway: "Operasional Lancar 100% Tanpa Internet"
  },
  {
    icon: "☁️",
    badge: "Layer 3: Cloud Backend & Sync",
    color: "blue",
    title: "Node.js Express + Supabase Cloud",
    rows: [
      { icon: "🔄", bold: "Delta-Sync Engine:", text: "Hanya mengirim selisih perubahan saat perangkat online" },
      { icon: "🔑", bold: "Google OAuth 2.0:", text: "Autentikasi terpusat & enkripsi token JWT standar" },
      { icon: "🛡️", bold: "Anti-Collision Logic:", text: "Penyelesaian konflik timestamp pada transaksi offline" },
      { icon: "💰", bold: "Cost Efficiency:", text: "Pangkas biaya compute cloud database hingga 80%" }
    ],
    takeaway: "Sinkronisasi Cloud Efisien & Skalabel"
  }
];

// Slide 10: Monetization Strategy (cards3 with structured points)
slides[9].cards = [
  {
    icon: "🎀",
    badge: "Aliran 1: Freemium SaaS",
    color: "pink",
    title: "Rp 49rb - 99rb / Bulan",
    rows: [
      { icon: "🎁", bold: "Free Tier:", text: "Gratis hingga 5 kamar untuk pengelola kos rintisan" },
      { icon: "💼", bold: "Pro Tier:", text: "Rp 49.000/bln (fitur WhatsApp billing & meteran kWh)" },
      { icon: "🏢", bold: "Enterprise:", text: "Rp 99.000/bln (multi-cabang, smart lock, staf unlimited)" },
      { icon: "📊", bold: "Rasio Beban:", text: "Hanya <0.3% omzet sewa, jauh lebih murah dari calo" }
    ],
    takeaway: "Model SaaS Ramah Pemilik Kos"
  },
  {
    icon: "✨",
    badge: "Aliran 2: Featured Listing",
    color: "purple",
    title: "Spotlight Kota & Verified Badge",
    rows: [
      { icon: "📍", bold: "Priority Slot:", text: "Rp 25.000/minggu untuk slot teratas pencarian kota" },
      { icon: "🎓", bold: "Musim Kuliah:", text: "Sangat diminati saat pendaftaran mahasiswa baru" },
      { icon: "🛡️", bold: "Verified Badge:", text: "Lencana centang hijau setelah inspeksi denah 1:50" },
      { icon: "📈", bold: "CTR Naik 3x:", text: "Tingkat konversi penyewa 300% lebih cepat terisi" }
    ],
    takeaway: "Pendapatan Iklan Non-Intrusif"
  },
  {
    icon: "🏰",
    badge: "4 Parit Pertahanan (Moats)",
    color: "mint",
    title: "High Switching Cost & Retensi",
    rows: [
      { icon: "📐", bold: "Moat 1: Vektor SVG:", text: "Data denah arsitektur presisi sulit dipindahkan manual" },
      { icon: "💸", bold: "Moat 2: 0% Komisi:", text: "Pemilik kos loyal seumur hidup tanpa potongan transaksi" },
      { icon: "🆔", bold: "Moat 3: Anti-Bot NIK:", text: "Ekosistem terpercaya bebas akun fiktif dan penipuan" },
      { icon: "📱", bold: "Moat 4: Ringan di HP:", text: "Bisa jalan mulus di Android murah tanpa lag" }
    ],
    takeaway: "Kunci Retensi Pengguna Jangka Panjang"
  }
];

// Slide 13: Agile Theory Comparison (cards3 with structured points)
slides[12].cards = [
  {
    icon: "💻",
    badge: "Extreme Programming (XP)",
    color: "pink",
    title: "Disiplin Rekayasa Teknis",
    rows: [
      { icon: "👤", bold: "Pencetus:", text: "Kent Beck (1999) & Ward Cunningham" },
      { icon: "💎", bold: "5 Nilai Inti:", text: "Komunikasi, Kesederhanaan, Feedback, Keberanian, Respect" },
      { icon: "🛠️", bold: "12 Praktik:", text: "TDD, Pair Programming, CI, Refactoring, Simple Design, Small Releases" },
      { icon: "🎯", bold: "Fokus Utama:", text: "Kualitas basis kode level tinggi & pencegahan cacat software sejak dini" }
    ],
    takeaway: "Fondasi Kualitas Kode & Bebas Bug"
  },
  {
    icon: "🔄",
    badge: "Scrum Framework",
    color: "purple",
    title: "Manajemen Adaptif & Empiris",
    rows: [
      { icon: "👤", bold: "Pencetus:", text: "Ken Schwaber & Jeff Sutherland (1995)" },
      { icon: "🏛️", bold: "3 Pilar Empiris:", text: "Transparansi, Inspeksi berkala, dan Adaptasi berkelanjutan" },
      { icon: "👥", bold: "3 Peran & Event:", text: "Product Owner, Scrum Master, Developer (Sprint 2 Minggu)" },
      { icon: "🎯", bold: "Fokus Utama:", text: "Penyampaian value bisnis bertahap via Definition of Done (DoD) ketat" }
    ],
    takeaway: "Pilihan Utama Metodologi KostKu"
  },
  {
    icon: "🏛️",
    badge: "DSDM (Dynamic Systems)",
    color: "mint",
    title: "Tata Kelola Bisnis Enterprise",
    rows: [
      { icon: "👤", bold: "Pencetus:", text: "DSDM Consortium UK (1994, Arie van Bennekum)" },
      { icon: "🔺", bold: "Segitiga Terbalik:", text: "Waktu, Biaya, Kualitas TETAP; Fitur VARIABEL (Scope Flex)" },
      { icon: "⚖️", bold: "MoSCoW Rules:", text: "Must Have (60%), Should Have, Could Have, Won't Have" },
      { icon: "🎯", bold: "Fokus Utama:", text: "Ketepatan tenggat waktu & kesesuaian strategis korporasi" }
    ],
    takeaway: "Disiplin Tenggat Waktu & Anggaran Bisnis"
  }
];

// Slides 16, 17, 18, 19: QA Defense slides with 3 structured breakdown sections per point
slides[15].points = [
  {
    num: "01",
    tag: "BANDWIDTH & LATENSI",
    title: "Ukuran File Ekstrem (<15 KB)",
    sections: [
      { label: "📌 Argumen Landasan", text: "Mengatasi hambatan konektivitas anak kos dan pengelola di wilayah bersinyal minim." },
      { label: "📊 Fakta Teknis", text: "Foto 360° / Matterport: 15-50 MB per ruang. Vektor SVG KostKu: <15 KB (<0.1% beban data)." },
      { label: "🎯 Dampak Nyata", text: "Dimuat instan <100ms di jaringan seluler 3G tanpa menyedot kuota internet pengguna." }
    ],
    takeaway: "Hemat kuota hingga 99.9% ✦ Near-Zero Latency"
  },
  {
    num: "02",
    tag: "PRESI KONSISTENSI FISIK",
    title: "Skala Arsitektur 1:50 Presisi",
    sections: [
      { label: "📌 Argumen Landasan", text: "Menghapus manipulasi visual lensa wide-angle yang sering mengecewakan pencari kos." },
      { label: "📊 Fakta Teknis", text: "Kamera 360° memakai lensa cembung yang mendistorsi ruang. SVG KostKu mengunci skala CAD 1:50." },
      { label: "🎯 Dampak Nyata", text: "Penyewa pasti tahu apakah kasur queen (160x200), meja laptop, dan lemari muat secara presisi." }
    ],
    takeaway: "Bebas distorsi lensa ✦ Dimensi riil terverifikasi"
  },
  {
    num: "03",
    tag: "EFISIENSI PEMELIHARAAN",
    title: "Update Dinamis Tanpa Reshoot",
    sections: [
      { label: "📌 Argumen Landasan", text: "Meminimalkan biaya pemeliharaan konten saat perabot kamar diperbarui pemilik." },
      { label: "📊 Fakta Teknis", text: "Virtual tour 360° butuh foto ulang mahal. Pada SVG, cukup ubah atribut koordinat JSON." },
      { label: "🎯 Dampak Nyata", text: "Pemilik kos dapat mengubah tata letak kamar dalam 10 detik tanpa fotografer profesional." }
    ],
    takeaway: "Zero reshooting cost ✦ Update instan via JSON"
  }
];

slides[16].points = [
  {
    num: "01",
    tag: "RELIABILITAS LAPANGAN",
    title: "Zero-Offline Latency",
    sections: [
      { label: "📌 Argumen Landasan", text: "Lorong kos dan lantai dasar sering kali menjadi area blank-spot sinyal beton tebal." },
      { label: "📊 Fakta Teknis", text: "Data ditulis seketika ke SQLite/Cache lokal perangkat (<5ms) tanpa blocking cloud." },
      { label: "🎯 Dampak Nyata", text: "Pencatatan meteran kWh listrik dan sewa kamar tetap 100% lancar walau internet mati total." }
    ],
    takeaway: "Aplikasi tak pernah macet saat kehilangan sinyal"
  },
  {
    num: "02",
    tag: "EFISIENSI BIAYA SERVER",
    title: "Pangkas Cloud Compute 80%",
    sections: [
      { label: "📌 Argumen Landasan", text: "Menekan biaya infrastruktur operasional backend agar platform dapat gratis/murah." },
      { label: "📊 Fakta Teknis", text: "Komputasi read/write ditanggung gawai klien. Cloud Supabase hanya terima delta-sync selisih." },
      { label: "🎯 Dampak Nyata", text: "Biaya sewa server hemat hingga 80%, memungkinkan penerapan skema biaya sewa 0% komisi." }
    ],
    takeaway: "Beban server rendah & biaya operasional hemat 80%"
  },
  {
    num: "03",
    tag: "KEDAULATAN DATA PRIBADI",
    title: "Privasi Finansial Pengelola Kos",
    sections: [
      { label: "📌 Argumen Landasan", text: "Menjamin kerahasiaan data omzet dan kontak penyewa kos sesuai prinsip desentralisasi." },
      { label: "📊 Fakta Teknis", text: "Basis data sensitif tersimpan terenkripsi di penyimpanan lokal pemilik kos masing-masing." },
      { label: "🎯 Dampak Nyata", text: "Meniadakan risiko kebocoran data massal yang kerap terjadi pada arsitektur cloud terpusat." }
    ],
    takeaway: "Kedaulatan data di tangan pemilik kos seutuhnya"
  }
];

slides[17].points = [
  {
    num: "01",
    tag: "PARADIGMA BISNIS",
    title: "SaaS Software vs Calo Komisi",
    sections: [
      { label: "📌 Argumen Landasan", text: "Mendefinisikan ulang posisi KostKu sebagai Software Manajemen Properti, bukan calo." },
      { label: "📊 Fakta Teknis", text: "Pendapatan stabil dari langganan modul back-office (Rp 49rb-99rb/bln) via model SaaS." },
      { label: "🎯 Dampak Nyata", text: "Margin keuntungan pemilik kos utuh 100%, menghasilkan Monthly Recurring Revenue (MRR) stabil." }
    ],
    takeaway: "Margin pemilik utuh 100% ✦ Platform raih MRR stabil"
  },
  {
    num: "02",
    tag: "ELIMINASI BYPASS",
    title: "Hapus Transaksi Gelap",
    sections: [
      { label: "📌 Argumen Landasan", text: "Komisi 5-15% selalu memicu pengguna bertukar kontak diam-diam di luar sistem." },
      { label: "📊 Fakta Teknis", text: "Dengan 0% komisi & deep-link WhatsApp, kami merangkul kebiasaan alami pengguna." },
      { label: "🎯 Dampak Nyata", text: "Pengguna merasa nyaman bertransaksi terbuka tanpa rasa curiga dipotong biaya terselubung." }
    ],
    takeaway: "Zero user bypass ✦ Transparansi transaksi 100%"
  },
  {
    num: "03",
    tag: "PARIT RETENSI TINGGI",
    title: "High Switching Cost yang Kuat",
    sections: [
      { label: "📌 Argumen Landasan", text: "Menciptakan daya ikat pengguna melalui nilai guna operasional harian yang esensial." },
      { label: "📊 Fakta Teknis", text: "Data kamar, denah vektor, histori kwitansi, dan rumus kWh tersimpan rapi di sistem." },
      { label: "🎯 Dampak Nyata", text: "Biaya waktu dan kerumitan untuk pindah ke aplikasi lain sangat tinggi, menjamin retensi loyal." }
    ],
    takeaway: "Switching cost tinggi menjamin retensi jangka panjang"
  }
];

slides[18].points = [
  {
    num: "01",
    tag: "DETEKSI & FAILOVER",
    title: "Deteksi <2 Mnt & Failover <5 Mnt",
    sections: [
      { label: "📌 Argumen Landasan", text: "Mencegah pengguna menemui layar putih polos (white screen) saat terjadi insiden jaringan." },
      { label: "📊 Fakta Teknis", text: "Monitoring otomatis Uptime/Sentry mendeteksi kegagalan <2 menit dan alihkan edge DNS." },
      { label: "🎯 Dampak Nyata", text: "Pengguna langsung disuguhkan halaman pemeliharaan darurat resmi dengan informasi jelas." }
    ],
    takeaway: "User selalu mendapat kepastian status sistem"
  },
  {
    num: "02",
    tag: "STRATEGI ROLLBACK",
    title: "Rollback Stabil <15 Menit",
    sections: [
      { label: "📌 Argumen Landasan", text: "Mengutamakan pemulihan stabilitas operasional dibanding coba-coba hotfix di produksi." },
      { label: "📊 Fakta Teknis", text: "Protokol mewajibkan rollback langsung ke commit rilis stabil sebelumnya dalam <15 menit." },
      { label: "🎯 Dampak Nyata", text: "Sistem kembali online normal seketika, investigasi bug dilakukan di staging offline." }
    ],
    takeaway: "Stabilitas pulih cepat tanpa eksperimen live"
  },
  {
    num: "03",
    tag: "SLA KOMPLAIN TERUKUR",
    title: "Respon 15-30 Mnt & Tuntas <4 Jam",
    sections: [
      { label: "📌 Argumen Landasan", text: "Menjamin kepastian penyelesaian kendala vital pengguna terkait uang atau akses fisik." },
      { label: "📊 Fakta Teknis", text: "Klasifikasi tegas Masalah Mendesak (P0: pembayaran/pintu) wajib respons SLA 15-30 menit." },
      { label: "🎯 Dampak Nyata", text: "Siklus 3 langkah terstandarisasi: 1) Akui, 2) Berikan estimasi ETA, 3) Konfirmasi tuntas." }
    ],
    takeaway: "Kepastian hukum operasional & kepuasan pengguna"
  }
];

// Slide 15: Closing enhancement
slides[14].stats = [
  { icon: "📐", label: "Interactive 2D & 3D", val: "<15 KB Scalable Vector" },
  { icon: "🛡️", label: "Keamanan Ekosistem", val: "Anti-Bot 1 KTP 1 Akun" },
  { icon: "⚡", label: "Ketahanan Sistem", val: "100% Local-First Offline" },
  { icon: "🔄", label: "Metodologi RPL", val: "Agile Scrum + Praktik XP" }
];

fs.writeFileSync(jsonPath, JSON.stringify(slides, null, 2), 'utf8');
console.log('Successfully enriched slides_data.json!');
