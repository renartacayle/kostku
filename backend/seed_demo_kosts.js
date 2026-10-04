const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const demoKosts = [
  {
    uid: "KOST-JAKSEL-01",
    kostName: "Kost Taman Sukun Co-Living & Exclusive",
    type: "Campur",
    city: "Jakarta",
    address: "Jl. Tebet Barat Dalam Raya No. 42, Tebet, Jakarta Selatan",
    location: { lat: -6.2383, lng: 106.8532 },
    rating: 4.95,
    reviewCount: 48,
    status: "verified",
    description: "Kost Co-Living modern bergaya tropis kontemporer di jantung Jakarta Selatan. Hanya 5 menit ke Stasiun Tebet dan area perkantoran Kuningan/Casablanca. Dilengkapi rooftop lounge, communal kitchen mewah, sistem access card pintar, dan kamar mandi dalam di setiap unit.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "4.0m x 5.0m",
      roomArea: "20 m²",
      buildingArea: "480 m² (3 Lantai)",
      totalFloors: 3,
      totalRooms: 12,
      bathroomType: "Kamar Mandi Dalam (Water Heater & Kloset Duduk)",
      windowFacing: "Jendela Hadap Luar (Balkon Privat)",
      features: [
        "Kasur Queen Springbed (160x200 cm)",
        "Meja Kerja Ergonomis & Lemari 3 Pintu",
        "Kamar Mandi Dalam dengan Partisi Kaca",
        "Balkon Pribadi dengan Pemandangan Kota",
        "Stopkontak di Samping Tempat Tidur & Meja",
        "Sirkulasi Udara Silang (Cross Ventilation)"
      ]
    },
    facilities: [
      "AC Daikin Inverter",
      "WiFi 100 Mbps",
      "KM Dalam Water Heater",
      "Smart TV 32\"",
      "Rooftop Cafe & Lounge",
      "Dapur Bersama Mewah",
      "Parkir Mobil & Motor",
      "Access Card 24 Jam",
      "CCTV 24 Jam"
    ],
    rules: [
      "Akses 24 Jam dengan Kartu Pintar",
      "Dilarang Merokok di Dalam Kamar",
      "Tamu Menginap Maksimal 2 Malam (Izin Pengelola)",
      "Menjaga Ketenangan setelah Pukul 22.00"
    ],
    settings: {
      rooms: [
        { id: "RM-JKT-101", number: "101", price: 2400000, size: "4x5", capacity: 1, status: "available" },
        { id: "RM-JKT-102", number: "102", price: 2400000, size: "4x5", capacity: 1, status: "available" },
        { id: "RM-JKT-201", number: "201", price: 2600000, size: "4x5", capacity: 1, status: "available" },
        { id: "RM-JKT-202", number: "202", price: 2800000, size: "5x5", capacity: 2, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-BDG-02",
    kostName: "Kost Putri Griya Asri Dago",
    type: "Putri",
    city: "Bandung",
    address: "Jl. Dago Asri No. 18, Coblong, Kota Bandung",
    location: { lat: -6.8795, lng: 107.6186 },
    rating: 4.98,
    reviewCount: 62,
    status: "verified",
    description: "Kost khusus putri yang tenang, asri, dan aman di kawasan Dago Atas Bandung. Sangat dekat dengan kampus ITB, Unpad Dipatiukur, dan UNIKOM. Suasana sejuk dengan taman tengah (inner courtyard) yang rimbun dan penjagaan ibu kost 24 jam.",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "3.5m x 4.0m",
      roomArea: "14 m²",
      buildingArea: "320 m² (2 Lantai)",
      totalFloors: 2,
      totalRooms: 10,
      bathroomType: "Kamar Mandi Dalam (Shower & Air Hangat)",
      windowFacing: "Jendela Hadap Taman Tengah",
      features: [
        "Kasur Single Springbed Nyaman (120x200)",
        "Lemari Pakaian 2 Pintu & Cermin Full-Body",
        "Meja Belajar Kayu Pinus & Rak Buku",
        "Ventilasi Alami Udara Sejuk Dago",
        "Kamar Mandi Dalam Bersih & Higienis"
      ]
    },
    facilities: [
      "WiFi Cepat 75 Mbps",
      "Kamar Mandi Dalam Air Panas",
      "Dapur Lengkap Kompor Tanam",
      "Kulkas & Dispenser RO Tiap Lantai",
      "Taman Dalam (Inner Courtyard)",
      "Parkir Motor Berkanopi",
      "Penjaga Kost 24 Jam",
      "CCTV 16 Titik"
    ],
    rules: [
      "Khusus Mahasiswi / Karyawati Putri",
      "Tamu Pria Hanya di Ruang Tamu Depan",
      "Jam Malam Gerbang Pukul 23.00 (Kunci Khusus Tersedia)",
      "Bebas Asap Rokok & Minuman Keras"
    ],
    settings: {
      rooms: [
        { id: "RM-BDG-101", number: "101", price: 1650000, size: "3.5x4", capacity: 1, status: "available" },
        { id: "RM-BDG-102", number: "102", price: 1650000, size: "3.5x4", capacity: 1, status: "available" },
        { id: "RM-BDG-201", number: "201", price: 1750000, size: "3.5x4", capacity: 1, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-BSD-03",
    kostName: "Kost Urban Loft BSD Smart Living",
    type: "Campur",
    city: "Tangerang",
    address: "Kawasan Edutown BSD Blok B3 No. 7, Pagedangan, Tangerang Selatan",
    location: { lat: -6.3015, lng: 106.6521 },
    rating: 4.88,
    reviewCount: 35,
    status: "verified",
    description: "Kost berkonsep Loft Industrial Modern dengan plafon tinggi (high ceiling 3.6m) dan mezzanine bed. Terletak di kawasan prestisius Edutown BSD, selangkah ke Prasetiya Mulya, ICE BSD, AEON Mall, dan The Breeze.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "4.0m x 4.0m (Tinggi 3.6m Mezzanine)",
      roomArea: "16 m² (+ Mezzanine 8 m²)",
      buildingArea: "520 m² (3 Lantai)",
      totalFloors: 3,
      totalRooms: 15,
      bathroomType: "KM Dalam Rain Shower Minimalis",
      windowFacing: "Jendela Kaca Lebar Menghadap Boulevard",
      features: [
        "Tempat Tidur di Lantai Mezzanine Atas",
        "Area Kerja & Sofa Santai di Lantai Bawah",
        "Smart Door Lock (PIN & RFID)",
        "Jendela Kaca Ganda Kedap Suara",
        "Pencahayaan LED Ambience Tersembunyi"
      ]
    },
    facilities: [
      "Smart Door Lock",
      "Fiber WiFi 150 Mbps",
      "AC Inverter Hemat Energi",
      "Co-Working Space & Cafe Mini",
      "Gym Mini & Tenis Meja",
      "Free Laundry 2 stel/hari",
      "Parkir Mobil Basement & Motor",
      "Dispenser Air Alkali Gratis"
    ],
    rules: [
      "Akses Digital 24 Jam",
      "Dilarang Hewan Peliharaan",
      "Kebersihan Kamar Dijaga Bersama"
    ],
    settings: {
      rooms: [
        { id: "RM-BSD-01", number: "Loft-01", price: 2800000, size: "4x4", capacity: 1, status: "available" },
        { id: "RM-BSD-02", number: "Loft-02", price: 2800000, size: "4x4", capacity: 1, status: "available" },
        { id: "RM-BSD-03", number: "Loft-03", price: 3100000, size: "4x5", capacity: 2, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-JOG-04",
    kostName: "Kost Java Residence Malioboro",
    type: "Campur",
    city: "Yogyakarta",
    address: "Jl. Sosrowijayan Wetan No. 88, Gedongtengen, Kota Yogyakarta",
    location: { lat: -7.7915, lng: 110.3642 },
    rating: 4.92,
    reviewCount: 54,
    status: "verified",
    description: "Kost bernuansa etnik Jawa modern yang hangat dan ramah di pusat kota Jogja. Dekat Stasiun Tugu, Malioboro, dan akses mudah ke kampus UGM/UNY. Memiliki pendopo komunal yang luas untuk belajar dan bersantai.",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "3.0m x 4.0m",
      roomArea: "12 m²",
      buildingArea: "400 m² (2 Lantai)",
      totalFloors: 2,
      totalRooms: 14,
      bathroomType: "KM Dalam Kloset Duduk & Shower",
      windowFacing: "Jendela Hadap Pendopo & Taman",
      features: [
        "Dipan Kayu Jati Solid dengan Kasur Tebal",
        "Meja Belajar Jati & Lemari Tradisional Modern",
        "Lantai Granit Dingin & Sejuk",
        "Ventilasi Kisi-kisi Udara Alami Jogja"
      ]
    },
    facilities: [
      "AC Dingin",
      "WiFi 50 Mbps",
      "Kamar Mandi Dalam",
      "Pendopo Santai & Gazebo",
      "Dapur Bersama Lengkap",
      "Parkir Mobil & Motor Luas",
      "Kulkas & Dispenser Bersama",
      "CCTV 24 Jam"
    ],
    rules: [
      "Akses Kunci Pagar Masing-Masing",
      "Menghormati Norma Kesopanan & Ketenangan",
      "Tamu Sopan di Pendopo"
    ],
    settings: {
      rooms: [
        { id: "RM-JOG-101", number: "101", price: 1350000, size: "3x4", capacity: 1, status: "available" },
        { id: "RM-JOG-102", number: "102", price: 1350000, size: "3x4", capacity: 1, status: "available" },
        { id: "RM-JOG-201", number: "201", price: 1450000, size: "3x4", capacity: 1, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-MLG-05",
    kostName: "Kost De Lavender Dinoyo Co-Living",
    type: "Putri",
    city: "Malang",
    address: "Jl. M.T. Haryono Gg. 9 No. 15, Dinoyo, Lowokwaru, Kota Malang",
    location: { lat: -7.9525, lng: 112.6083 },
    rating: 4.87,
    reviewCount: 41,
    status: "verified",
    description: "Kost putri aesthetic minimalis favorit mahasiswa Universitas Brawijaya (UB), Polinema, dan UIN Malang. Bangunan baru 3 lantai dengan fasilitas laundry, dapur di tiap lantai, dan balkon jemur tertutup yang aman dari hujan.",
    images: [
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "3.0m x 3.5m",
      roomArea: "10.5 m²",
      buildingArea: "280 m² (3 Lantai)",
      totalFloors: 3,
      totalRooms: 12,
      bathroomType: "KM Dalam Water Heater & Shower",
      windowFacing: "Jendela Luar Sirkulasi Bagus",
      features: [
        "Kasur Busa Tebal Inoac Anti-Kempes",
        "Meja Belajar Aesthetic Putih & Kursi Putar",
        "Lemari 2 Pintu dengan Gantungan Baju",
        "Kamar Mandi Dalam dengan Exhaust Fan"
      ]
    },
    facilities: [
      "Kamar Mandi Dalam",
      "Water Heater",
      "WiFi Cepat 50 Mbps",
      "Dapur Tiap Lantai",
      "Mesin Cuci Bersama",
      "Balkon Jemur Atap Transparan",
      "Parkir Motor Tertutup",
      "Gerbang Access Card & CCTV"
    ],
    rules: [
      "Khusus Mahasiswi / Karyawati",
      "Tidak Menerima Tamu Menginap Pria",
      "Dilarang Membawa Hewan"
    ],
    settings: {
      rooms: [
        { id: "RM-MLG-101", number: "Kamar 01", price: 1200000, size: "3x3.5", capacity: 1, status: "available" },
        { id: "RM-MLG-102", number: "Kamar 02", price: 1200000, size: "3x3.5", capacity: 1, status: "available" },
        { id: "RM-MLG-201", number: "Kamar 05", price: 1300000, size: "3x3.5", capacity: 1, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-SBY-06",
    kostName: "Kost Grand Surya Executive Rungkut",
    type: "Putra",
    city: "Surabaya",
    address: "Jl. Rungkut Madya No. 45, Gunung Anyar, Kota Surabaya",
    location: { lat: -7.3325, lng: 112.7845 },
    rating: 4.89,
    reviewCount: 29,
    status: "verified",
    description: "Kost eksekutif khusus putra di Surabaya Timur. Dekat kampus UPN Veteran Jatim, UBAYA Rungkut, dan kawasan SIER. Dilengkapi AC super dingin, carport berkanopi muat 8 mobil, serta layanan laundry gratis.",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "3.5m x 4.0m",
      roomArea: "14 m²",
      buildingArea: "380 m² (2 Lantai)",
      totalFloors: 2,
      totalRooms: 12,
      bathroomType: "KM Dalam Kloset Duduk TOTO",
      windowFacing: "Jendela Hadap Halaman Depan",
      features: [
        "Kasur Springbed 120x200 Rebounded",
        "Meja Komputer Luas untuk Kerja/Gaming",
        "AC Split 1/2 PK Dingin Maksimal",
        "Kamar Mandi Dalam Kloset Duduk"
      ]
    },
    facilities: [
      "AC Split 1/2 PK",
      "WiFi 100 Mbps Anti-Lag",
      "Kamar Mandi Dalam",
      "Free Laundry 15 kg/bulan",
      "Carport Mobil Berkanopi (Muat 8 Mobil)",
      "Parkir Motor Luas",
      "Ruang Tamu Ber-AC",
      "CCTV 24 Jam"
    ],
    rules: [
      "Khusus Pria (Mahasiswa / Karyawan)",
      "Bebas Jam Malam (Kunci Gerbang Sendiri)",
      "Dilarang Narkoba & Minuman Keras"
    ],
    settings: {
      rooms: [
        { id: "RM-SBY-A1", number: "A-01", price: 1500000, size: "3.5x4", capacity: 1, status: "available" },
        { id: "RM-SBY-A2", number: "A-02", price: 1500000, size: "3.5x4", capacity: 1, status: "available" },
        { id: "RM-SBY-B1", number: "B-01", price: 1700000, size: "4x4", capacity: 1, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-SCBD-07",
    kostName: "Kost Senopati Boutique Residence",
    type: "Campur",
    city: "Jakarta",
    address: "Jl. Senopati Dalam II No. 19, Kebayoran Baru, Jakarta Selatan",
    location: { lat: -6.2312, lng: 106.8124 },
    rating: 4.98,
    reviewCount: 73,
    status: "verified",
    description: "Kost butik eksklusif di kawasan elit Senopati / SCBD Jakarta Selatan. Dilengkapi fasilitas setara hotel berbintang: private pool, gym mini, smart TV 43 inci dengan Netflix, bathtub, dan cleaning service gratis 3x seminggu.",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "5.0m x 5.0m",
      roomArea: "25 m²",
      buildingArea: "650 m² (3 Lantai)",
      totalFloors: 3,
      totalRooms: 8,
      bathroomType: "KM Dalam Bathtub, Water Heater & Marmer",
      windowFacing: "Balkon Privat Menghadap Swimming Pool",
      features: [
        "King Bed Luxury 180x200 Pillowtop",
        "Smart TV 43 Inch 4K Netflix Ready",
        "Kulkas Pribadi 2 Pintu di Dalam Kamar",
        "Bathtub & Shower Terpisah",
        "Walk-in Closet Lemari Pakaian"
      ]
    },
    facilities: [
      "Swimming Pool & Jacuzzi",
      "Gym Mini & Sauna",
      "Smart TV 43\" Netflix",
      "Cleaning Service 3x/minggu",
      "Valet Parking Mobil",
      "Kulkas Pribadi",
      "Bathtub & Water Heater",
      "Keamanan Security 24 Jam"
    ],
    rules: [
      "Akses Kartu RFID 24 Jam",
      "Tamu Diwajibkan Menitipkan Identitas",
      "Dilarang Mengganggu Kenyamanan Penghuni Lain"
    ],
    settings: {
      rooms: [
        { id: "RM-SCBD-01", number: "Suite-01", price: 3500000, size: "5x5", capacity: 2, status: "available" },
        { id: "RM-SCBD-02", number: "Suite-02", price: 3800000, size: "5x6", capacity: 2, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-TEBET-08",
    kostName: "Kost Sakura Tebet Harmoni",
    type: "Putri",
    city: "Jakarta",
    address: "Jl. Tebet Timur Dalam Raya No. 11, Tebet, Jakarta Selatan",
    location: { lat: -6.2341, lng: 106.8589 },
    rating: 4.90,
    reviewCount: 44,
    status: "verified",
    description: "Kost putri berkonsep Japandi (Japanese-Scandinavian) bernuansa kayu terang dan pencahayaan hangat. Lokasi sangat strategis, hanya 300 meter dari Stasiun KRL Tebet dan dekat pusat kuliner hits Tebet Timur.",
    images: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "3.0m x 4.0m",
      roomArea: "12 m²",
      buildingArea: "310 m² (2 Lantai)",
      totalFloors: 2,
      totalRooms: 10,
      bathroomType: "KM Dalam Shower & Kloset Duduk",
      windowFacing: "Jendela Menghadap Halaman Samping Asri",
      features: [
        "Kasur Single Springbed Nyaman (120x200)",
        "Meja Belajar & Kursi Kayu Japandi",
        "Lemari 2 Pintu dengan Kaca Rias",
        "Ventilasi & Pencahayaan Alami Optimal"
      ]
    },
    facilities: [
      "AC 1/2 PK Dingin",
      "WiFi Cepat 75 Mbps",
      "Kamar Mandi Dalam",
      "Dapur Bersama Lengkap",
      "Dispenser Air Minum Gratis",
      "Parkir Motor Aman Berpagar",
      "Penjaga Kost Siaga 24 Jam"
    ],
    rules: [
      "Khusus Mahasiswi / Karyawati Putri",
      "Tamu Pria Hanya di Teras / Ruang Tamu",
      "Pintu Gerbang Ditutup Pukul 23.00 (Tersedia Kunci Darurat)"
    ],
    settings: {
      rooms: [
        { id: "RM-TBT-101", number: "101", price: 1850000, size: "3x4", capacity: 1, status: "available" },
        { id: "RM-TBT-102", number: "102", price: 1850000, size: "3x4", capacity: 1, status: "available" },
        { id: "RM-TBT-201", number: "201", price: 1950000, size: "3.5x4", capacity: 1, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-SMG-09",
    kostName: "Kost Cempaka Paviliun Tembalang",
    type: "Putra",
    city: "Semarang",
    address: "Jl. Banjarsari Selatan No. 22, Tembalang, Kota Semarang",
    location: { lat: -7.0531, lng: 110.4398 },
    rating: 4.82,
    reviewCount: 38,
    status: "verified",
    description: "Kost putra terjangkau dan nyaman dekat Kampus Universitas Diponegoro (Undip) Tembalang dan Politeknik Negeri Semarang (Polines). Bangunan paviliun 2 lantai dengan halaman parkir motor luas berkanopi dan bebas jam malam.",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "3.0m x 3.0m",
      roomArea: "9 m²",
      buildingArea: "260 m² (2 Lantai)",
      totalFloors: 2,
      totalRooms: 14,
      bathroomType: "KM Luar Bersih (Rasio 1 KM untuk 2 Kamar)",
      windowFacing: "Jendela Menghadap Koridor Terbuka",
      features: [
        "Kasur Busa Inoac Tebal & Sprei Bersih",
        "Meja Belajar Mahasiswa & Kursi",
        "Lemari Pakaian Kayu Minimalis",
        "Kipas Angin Dinding / AC Pilihan"
      ]
    },
    facilities: [
      "WiFi Cepat 50 Mbps",
      "Kamar Mandi Luar Bersih",
      "Dapur Bersama Kompor Gas",
      "Garasi Motor Tertutup & Terkunci",
      "Dispenser Air Galon Gratis",
      "Ruang Santai TV Bersama"
    ],
    rules: [
      "Khusus Pria / Mahasiswa",
      "Bebas Jam Malam (Kunci Gerbang Masing-Masing)",
      "Wajib Menjaga Kebersihan Kamar Mandi Bersama"
    ],
    settings: {
      rooms: [
        { id: "RM-SMG-01", number: "P-01", price: 950000, size: "3x3", capacity: 1, status: "available" },
        { id: "RM-SMG-02", number: "P-02", price: 950000, size: "3x3", capacity: 1, status: "available" },
        { id: "RM-SMG-03", number: "P-03", price: 1200000, size: "3x3.5", capacity: 1, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  },
  {
    uid: "KOST-BALI-10",
    kostName: "Kost Sunset Paradise Canggu",
    type: "Campur",
    city: "Bali",
    address: "Jl. Pantai Batu Bolong No. 58, Canggu, Kuta Utara, Badung, Bali",
    location: { lat: -8.6534, lng: 115.1328 },
    rating: 4.97,
    reviewCount: 52,
    status: "verified",
    description: "Tropical Co-Living & Kost Premium di pusat Canggu Bali. Cocok untuk digital nomad, pekerja remote, dan ekspatriat. Memiliki kolam renang tropis di tengah villa, Starlink WiFi berkecepatan 200 Mbps, kitchen bar terbuka, dan bale bengong untuk kerja.",
    images: [
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&auto=format&fit=crop&q=80"
    ],
    layoutImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80",
    layoutInfo: {
      roomDimensions: "4.5m x 5.0m",
      roomArea: "22.5 m²",
      buildingArea: "600 m² (Villa Kompleks)",
      totalFloors: 2,
      totalRooms: 8,
      bathroomType: "KM Dalam Semi-Open Tropis (Batu Alam & Shower)",
      windowFacing: "Teras Menghadap Kolam Renang & Pohon Kelapa",
      features: [
        "King Bed Nyaman dengan Kelambu Tropis",
        "Meja Kerja Kayu Jati View Kolam Renang",
        "Kamar Mandi Semi-Open Gaya Villa Bali",
        "Teras Pribadi dengan Kursi Santai (Daybed)"
      ]
    },
    facilities: [
      "Tropical Shared Swimming Pool",
      "Starlink Super WiFi 200 Mbps",
      "AC Inverter Dingin",
      "Bale Bengong Co-Working Area",
      "Kitchen Bar Lengkap & Espresso Machine",
      "Parkir Scooter & Mobil",
      "Housekeeping Rutin",
      "CCTV 24 Jam"
    ],
    rules: [
      "Suasana Tenang untuk Bekerja & Beristirahat",
      "Respect sesama penghuni multikultural",
      "Tamu Menginap Maks 3 Malam dengan Konfirmasi"
    ],
    settings: {
      rooms: [
        { id: "RM-BLI-01", number: "Villa 1", price: 3200000, size: "4.5x5", capacity: 2, status: "available" },
        { id: "RM-BLI-02", number: "Villa 2", price: 3200000, size: "4.5x5", capacity: 2, status: "available" },
        { id: "RM-BLI-03", number: "Villa 3", price: 3600000, size: "5x5", capacity: 2, status: "available" }
      ],
      waterRate: 0,
      electricityRate: 0
    }
  }
];

// Read existing DB
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// Filter out old demo kosts if any, keep owner kosts
const existingKosts = (db.kosts || []).filter(k => 
  !k.uid.startsWith('KOST-JAKSEL-') &&
  !k.uid.startsWith('KOST-BDG-') &&
  !k.uid.startsWith('KOST-BSD-') &&
  !k.uid.startsWith('KOST-JOG-') &&
  !k.uid.startsWith('KOST-MLG-') &&
  !k.uid.startsWith('KOST-SBY-') &&
  !k.uid.startsWith('KOST-SCBD-') &&
  !k.uid.startsWith('KOST-TEBET-') &&
  !k.uid.startsWith('KOST-SMG-') &&
  !k.uid.startsWith('KOST-BALI-')
);

// Merge demo kosts
db.kosts = [...demoKosts, ...existingKosts];

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully seeded ${demoKosts.length} demo kosts into ${DB_PATH}!`);
