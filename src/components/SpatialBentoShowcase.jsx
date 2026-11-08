import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  Store,
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Camera, 
  Maximize2, 
  TrendingUp, 
  FileText, 
  Lock, 
  MapPin, 
  Pause, 
  Play
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SpatialBentoShowcase() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Active audience tab: 'customer' (default) vs 'owner'
  const [activeTab, setActiveTab] = useState('customer');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const CUSTOMER_SLIDES = [
    {
      id: 'foto-asli',
      badge: '📸 FOTO ASLI & TERVERIFIKASI',
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      title: '100% Foto Asli Tanpa Lensa Tipu-Tipu',
      description: 'Tim kami mendatangi dan memotret langsung kondisi fisik hunian. Apa yang kamu lihat di aplikasi sama persis dengan apa yang kamu dapatkan di kamar nyata.',
      perks: [
        'Bebas distorsi lensa ultra-wide yang membuat kamar terlihat melar',
        'Titik koordinat GPS akurat terkunci tepat di depan pagar kost',
        'Pembaruan berkala ketersediaan kamar setiap minggu'
      ],
      statNumber: '100%',
      statLabel: 'Akurasi Foto Fisik',
      ctaText: 'Cari Kost Terverifikasi →',
      ctaLink: '/search',
      floatingBadge: '✓ Lolos Verifikasi Lapangan',
      floatingIcon: '📸',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'denah-nyata',
      badge: '📐 TATA RUANG & PERABOT',
      badgeColor: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      title: 'Ketahui Muat Apa Saja Sebelum Datang Survei',
      description: 'Setiap kamar dilengkapi denah tata ruang realistis. Kamu bisa tahu posisi kasur, meja belajar, lemari, hingga sisa ruang gerak sholat atau yoga sebelum melangkah.',
      perks: [
        'Pilihan ukuran kasur Single (100×200) atau Queen (160×200)',
        'Kamar mandi dalam dengan shower & sanitasi bersih',
        'Ventilasi jendela alami dengan sirkulasi udara segar'
      ],
      statNumber: '14 m²',
      statLabel: 'Rata-rata Kamar Nyaman',
      ctaText: 'Jelajahi Denah Kamar →',
      ctaLink: '/search',
      floatingBadge: '📐 Dimensi Realistis 1:50',
      floatingIcon: '📐',
      image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'listrik-transparan',
      badge: '⚡ BEBAS BIAYA SILUMAN',
      badgeColor: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      title: 'Token Listrik Mandiri Sesuai Tarif Resmi PLN',
      description: 'Nggak ada lagi drama kaget tagihan listrik di akhir bulan. Kamar dengan token mandiri memberi kamu kendali penuh mengatur pemakaian listrik sendiri.',
      perks: [
        'Tarif resmi PLN Rp 1.524 / kWh tanpa markup biaya pengelola',
        'Simulasi estimasi tagihan bulanan langsung sebelum booking',
        'Bebas biaya iuran sampah atau air tersembunyi'
      ],
      statNumber: 'Rp 0',
      statLabel: 'Biaya Tambahan Tersembunyi',
      ctaText: 'Cari Kost Listrik Mandiri →',
      ctaLink: '/search',
      floatingBadge: '⚡ Meteran Token Mandiri',
      floatingIcon: '⚡',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'bebas-calo',
      badge: '🛡️ KEAMANAN & ANTI-PENIPUAN',
      badgeColor: '#818CF8',
      badgeBg: 'rgba(129, 140, 248, 0.15)',
      title: 'Sewa Langsung ke Pemilik Sah Tanpa Calo',
      description: 'Semua properti kost terdaftar melalui konfirmasi kepemilikan dan kontak resmi. Uang muka (DP) kamu terlindungi dengan garansi uang kembali jika kamar tidak sesuai.',
      perks: [
        '100% pemilik sah dan pengelola terverifikasi langsung di lokasi',
        'Hubungi langsung via WhatsApp resmi tanpa perantara liar',
        'Bantuan mediasi customer support responsif 24 jam'
      ],
      statNumber: '10.000+',
      statLabel: 'Penghuni Tenang & Nyaman',
      ctaText: 'Temukan Kost Aman Sekarang →',
      ctaLink: '/search',
      floatingBadge: '🛡️ 100% Pemilik Terverifikasi',
      floatingIcon: '🛡️',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80'
    }
  ];

  const OWNER_SLIDES = [
    {
      id: 'kelola-okupansi',
      badge: '🏢 MANAJEMEN OKUPANSI KOST',
      badgeColor: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      title: 'Kelola Seluruh Kamar & Okupansi Otomatis',
      description: 'Pantau status kamar terisi, kamar kosong, tanggal masuk, dan perpanjangan sewa secara real-time dari satu dashboard praktis tanpa buku catatan manual.',
      perks: [
        'Status kamar terupdate instan (Tersedia, Terisi, Renovasi)',
        'Pengingat jatuh tempo sewa otomatis via WhatsApp',
        'Dukungan multi-cabang hunian kost dalam 1 akun terpusat'
      ],
      statNumber: '95%+',
      statLabel: 'Rata-rata Okupansi Mitra',
      ctaText: 'Daftarkan Kost Sekarang →',
      ctaLink: '/register?role=owner',
      floatingBadge: '📊 Monitoring Kamar Real-Time',
      floatingIcon: '📊',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'keuangan-otomatis',
      badge: '💰 KEUANGAN & PEMBUKUAN',
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      title: 'Pencatatan Keuangan & Kwitansi 1-Click WhatsApp',
      description: 'Kirim bukti pembayaran dan kwitansi sewa resmi langsung ke nomor WhatsApp anak kost dalam 1 klik. Laporan pemasukan dan pengeluaran tersusun rapi otomatis.',
      perks: [
        'Kwitansi digital resmi dengan rincian biaya sewa & listrik',
        'Laporan arus kas bulanan & tahunan siap diunduh PDF',
        'Pencatatan deposit / uang jaminan anti-selisih'
      ],
      statNumber: '1-Click',
      statLabel: 'Kirim Kwitansi WA Instan',
      ctaText: 'Mulai Kelola Keuangan →',
      ctaLink: '/register?role=owner',
      floatingBadge: '🧾 Kwitansi WA Digital Otomatis',
      floatingIcon: '🧾',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'penyewa-terverifikasi',
      badge: '✨ DATA PENYEWA TERTIB & AMAN',
      badgeColor: '#818CF8',
      badgeBg: 'rgba(129, 140, 248, 0.15)',
      title: 'Data Kontak Tertib, Komunikasi Penghuni Lancar & Nyaman',
      description: 'Hindari kontak palsu atau reservasi fiktif. Profil penyewa terhubung dengan nomor WhatsApp aktif sehingga komunikasi sewa dan konfirmasi kamar selalu transparan.',
      perks: [
        'Penyimpanan kontak dan riwayat sewa tersusun rapi',
        'Pemberlakuan peraturan tata tertib kost digital yang jelas',
        'Riwayat masa sewa & perpanjangan kamar otomatis'
      ],
      statNumber: '99.9%',
      statLabel: 'Komunikasi Lancar & Tertib',
      ctaText: 'Kelola Penyewa Praktis →',
      ctaLink: '/register?role=owner',
      floatingBadge: '✨ Profil Penyewa Rapi & Jelas',
      floatingIcon: '✨',
      image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'promosi-maksimal',
      badge: '🚀 PROMOSI & JANGKAUAN',
      badgeColor: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      title: 'Jangkau Ribuan Mahasiswa & Karyawan Tiap Hari',
      description: 'Listing kost Anda langsung muncul di pencarian GPS radius kampus terdekat (UDINUS, UNDIP, ITB, UI, UGM) tanpa potongan biaya komisi calo yang membebankan.',
      perks: [
        'Tampil di radar terdekat pencarian GPS & Google Maps',
        'Profil kost dilengkapi galeri foto HD & denah tata ruang',
        'Bebas potongan komisi persentase sewa bulanan'
      ],
      statNumber: '50.000+',
      statLabel: 'Pencari Aktif / Bulan',
      ctaText: 'Pasang Iklan Kost Gratis →',
      ctaLink: '/register?role=owner',
      floatingBadge: '🎯 Radar GPS Kampus Terdekat',
      floatingIcon: '🎯',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80'
    }
  ];

  const MITRA_SLIDES = [
    {
      id: 'pasar-hyperlocal',
      badge: '🏪 PASAR TETAP HYPERLOCAL',
      badgeColor: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      title: 'Pasar Pasti Ratusan Penghuni Kost di Radius Dekat',
      description: 'Usaha warung makan, laundry kiloan, atau depot galon Anda langsung terhubung ke ratusan anak kost di sekeliling hunian tanpa perlu sewa ruko baru.',
      perks: [
        'Radius hyperlocal 50–500 meter langsung menjangkau anak kost aktif',
        'Pesanan rutin kebutuhan pokok harian (makan, minum, cuci baju)',
        'Etalase menu & layanan resmi tampil langsung di aplikasi penghuni'
      ],
      statNumber: '100%',
      statLabel: 'Pasar Rutin Harian',
      ctaText: 'Daftarkan Toko Mitra Gratis →',
      ctaLink: '/mitra',
      floatingBadge: '🏪 Captive Market Kost',
      floatingIcon: '🏪',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'bebas-komisi-20',
      badge: '💸 TANPA POTONGAN BESAR',
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      title: 'Margin Penuh Milik Mitra, Tanpa Potongan Ojol 20%',
      description: 'Beda dengan platform pesan antar lain yang memotong 20% keuntungan Anda. Di KostKu harga jual tetap harga asli warung dan keuntungan 100% milik Anda.',
      perks: [
        'Bebas potongan komisi 20% yang membebani keuntungan pedagang kecil',
        'Platform fee super mikro (maks. Rp 500 flat per transaksi pesanan)',
        'Harga menu sama dengan harga offline, pelanggan kost jauh lebih loyal'
      ],
      statNumber: '0%',
      statLabel: 'Potongan Komisi Ojol',
      ctaText: 'Mulai Jualan di KostKu →',
      ctaLink: '/mitra',
      floatingBadge: '✓ Margin Bersih 100%',
      floatingIcon: '💰',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'qris-dan-kasir',
      badge: '💳 KASIR & QRIS OTOMATIS',
      badgeColor: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      title: 'Terima QRIS Otomatis & Tarik Saldo Fleksibel',
      description: 'Anak kost bayar instan via Dynamic QRIS berlisensi Bank Indonesia (TriPay). Saldo tercatat otomatis tanpa repot uang kembalian dan bisa ditarik kapan saja ke rekening atau e-wallet.',
      perks: [
        'Bebas risiko uang palsu dan tidak pusing mencari uang receh kembalian',
        'Pencairan dana fleksibel ke BCA, BRI, Mandiri, DANA, OVO, GoPay via TriPay',
        'Rekap transaksi harian dan laporan mutasi saldo tersusun rapi otomatis'
      ],
      statNumber: 'Instan',
      statLabel: 'Pencairan Saldo Fleksibel',
      ctaText: 'Lihat Integrasi QRIS Mitra →',
      ctaLink: '/mitra',
      floatingBadge: '⚡ QRIS Resmi Bank Indonesia',
      floatingIcon: '⚡',
      image: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'referral-loyalty',
      badge: '🎁 REFERRAL & LOYALTY WARUNG',
      badgeColor: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      title: 'Dipromosikan Langsung oleh Anak Kost & Pengelola',
      description: 'Penghuni kost mendapatkan bonus +500 Poin loyalty saat merekomendasikan warung langganan mereka, menciptakan promosi getok tular organik antar mahasiswa sekampus.',
      perks: [
        'Program referral aktif: anak kost mengajak teman-teman kos belanja di warung Anda',
        'Rekomendasi langsung dari pemilik kost kepada seluruh penyewa baru',
        'Fitur pesan ulang kilat (1-click reorder) untuk pelanggan langganan setia'
      ],
      statNumber: '+500',
      statLabel: 'Poin Loyalty Referral',
      ctaText: 'Gabung Jaringan Mitra Sekarang →',
      ctaLink: '/mitra',
      floatingBadge: '🎁 Bonus Referral Komunitas',
      floatingIcon: '🎁',
      image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1000&auto=format&fit=crop&q=80'
    }
  ];

  const slides = activeTab === 'customer' 
    ? CUSTOMER_SLIDES 
    : activeTab === 'owner' 
      ? OWNER_SLIDES 
      : MITRA_SLIDES;
  const currentItem = slides[currentSlide] || slides[0];

  // Auto-scroll Timer: advances slide every 5 seconds unless paused
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, slides.length, activeTab]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentSlide(0);
  };

  // Mobile Touch Swipe Navigation (Natural Thumb Flick Left/Right)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    const diffX = touchStartX.current - e.touches[0].clientX;
    const diffY = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 35) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  return (
    <div 
      className="spatial-bento-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        background: isLight 
          ? 'linear-gradient(145deg, #ffffff, #f8fafc)' 
          : 'linear-gradient(145deg, #0d1527, #070d1a)',
        borderRadius: '28px',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.09)',
        padding: 'clamp(1.75rem, 4vw, 3rem) clamp(1rem, 3vw, 2.5rem)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: isLight ? '#0f172a' : '#F8FAFC',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: isLight ? '0 10px 30px rgba(15, 23, 42, 0.06)' : '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
      }}
    >
      {/* Subtle Specular Glow Backgrounds */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '0',
        width: 'min(500px, 100%)',
        height: '500px',
        background: activeTab === 'customer' 
          ? 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)'
          : activeTab === 'owner'
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1160px', margin: '0 auto' }}>
        
        {/* ═══════════════════════════════════════════════════════════════════
            TOP BAR: AUDIENCE SEGMENTED TAB SWITCHER (CUSTOMER, OWNER, MITRA)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="spatial-bento-header-wrapper" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          {/* Section Eyebrow Badge */}
          <div className="spatial-bento-eyebrow" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.12)',
            border: isLight ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '100px',
            color: isLight ? '#1d4ed8' : '#60A5FA',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            <Sparkles size={14} />
            <span>SOLUSI TERLENGKAP KOSTKU</span>
          </div>

          <h2 className="spatial-bento-h2" style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 1.25rem 0',
            color: isLight ? '#0f172a' : '#FFFFFF'
          }}>
            Fitur Cerdas untuk{' '}
            <span style={{ 
              color: activeTab === 'customer' 
                ? (isLight ? '#0284c7' : '#38BDF8') 
                : activeTab === 'owner' 
                  ? (isLight ? '#059669' : '#34D399') 
                  : (isLight ? '#d97706' : '#F59E0B') 
            }}>
              {activeTab === 'customer' ? 'Pencari Kost' : activeTab === 'owner' ? 'Pemilik Kost' : 'Mitra Toko & Warung'}
            </span>
          </h2>

          {/* Interactive Toggle Switcher */}
          <div className="spatial-bento-tabs-container" style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            background: isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.85)',
            border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '100px',
            padding: '5px',
            boxShadow: isLight ? '0 2px 8px rgba(15, 23, 42, 0.05)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
            gap: '4px'
          }}>
            {/* Tab Customer */}
            <button
              type="button"
              className="spatial-bento-tab-btn"
              onClick={() => handleTabChange('customer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '100px',
                border: 'none',
                background: activeTab === 'customer' ? '#2563EB' : 'transparent',
                color: activeTab === 'customer' ? '#FFFFFF' : (isLight ? '#475569' : '#94A3B8'),
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                boxShadow: activeTab === 'customer' ? '0 4px 15px rgba(37, 99, 235, 0.4)' : 'none'
              }}
            >
              <Users size={16} />
              <span>Untuk Pencari Kost</span>
            </button>

            {/* Tab Owner */}
            <button
              type="button"
              className="spatial-bento-tab-btn"
              onClick={() => handleTabChange('owner')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '100px',
                border: 'none',
                background: activeTab === 'owner' ? '#059669' : 'transparent',
                color: activeTab === 'owner' ? '#FFFFFF' : (isLight ? '#475569' : '#94A3B8'),
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                boxShadow: activeTab === 'owner' ? '0 4px 15px rgba(5, 150, 105, 0.4)' : 'none'
              }}
            >
              <Building2 size={16} />
              <span>Untuk Pemilik Kost</span>
            </button>

            {/* Tab Mitra */}
            <button
              type="button"
              className="spatial-bento-tab-btn"
              onClick={() => handleTabChange('mitra')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '100px',
                border: 'none',
                background: activeTab === 'mitra' ? '#D97706' : 'transparent',
                color: activeTab === 'mitra' ? '#FFFFFF' : (isLight ? '#475569' : '#94A3B8'),
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                boxShadow: activeTab === 'mitra' ? '0 4px 15px rgba(217, 119, 6, 0.4)' : 'none'
              }}
            >
              <Store size={16} />
              <span>Untuk Mitra UMKM</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THE SINGLE INTERACTIVE SLIDE CAROUSEL CARD (TOUCH SWIPE ENABLED)
            ═══════════════════════════════════════════════════════════════════ */}
        <div 
          className="spatial-bento-card-shell"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            background: isLight ? '#ffffff' : '#131D33',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: isLight ? '0 10px 30px rgba(15, 23, 42, 0.08)' : '0 20px 50px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}
        >
          
          <div className="spatial-bento-grid-card">
            
            {/* ── LEFT COLUMN: TITLE, BENEFITS, STATS, AND CTA ── */}
            <div className="spatial-bento-content-col" style={{
              padding: 'clamp(1.5rem, 3.5vw, 2.75rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div>
                {/* Category Pill Badge */}
                <div className="spatial-bento-category-pill" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '100px',
                  background: currentItem.badgeBg,
                  color: currentItem.badgeColor,
                  border: `1px solid ${currentItem.badgeColor}40`,
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '1rem'
                }}>
                  <span>{currentItem.badge}</span>
                </div>

                {/* Main Headline */}
                <h3 className="spatial-bento-title" style={{
                  margin: '0 0 1rem 0',
                  fontSize: 'clamp(1.4rem, 2.4vw, 1.85rem)',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  color: isLight ? '#0f172a' : '#FFFFFF'
                }}>
                  {currentItem.title}
                </h3>

                {/* Description */}
                <p className="spatial-bento-desc" style={{
                  margin: '0 0 1.5rem 0',
                  color: isLight ? '#475569' : '#94A3B8',
                  fontSize: 'clamp(0.9rem, 1.6vw, 0.98rem)',
                  lineHeight: 1.6
                }}>
                  {currentItem.description}
                </p>

                {/* Perks Checklist */}
                <div className="spatial-bento-perks" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
                  {currentItem.perks.map((perk, idx) => (
                    <div 
                      key={idx} 
                      className={`spatial-bento-perk-item ${idx >= 2 ? 'desktop-only' : ''}`}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                    >
                      <CheckCircle2 size={18} color={currentItem.badgeColor} className="spatial-bento-check-icon" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span className="spatial-bento-perk-text" style={{ fontSize: '0.88rem', color: isLight ? '#1e293b' : '#E2E8F0', lineHeight: 1.4, fontWeight: 500 }}>
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action & Stat Row */}
              <div className="spatial-bento-action-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                paddingTop: '1.25rem',
                borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <Link
                  to={currentItem.ctaLink}
                  className="spatial-bento-cta-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    background: activeTab === 'customer' 
                      ? '#2563EB' 
                      : activeTab === 'owner' 
                        ? '#059669' 
                        : '#D97706',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    boxShadow: activeTab === 'customer' 
                      ? '0 4px 16px rgba(37, 99, 235, 0.4)' 
                      : activeTab === 'owner'
                        ? '0 4px 16px rgba(5, 150, 105, 0.4)'
                        : '0 4px 16px rgba(217, 119, 6, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span>{currentItem.ctaText}</span>
                </Link>

                <div className="spatial-bento-stat-block" style={{ textAlign: 'right' }}>
                  <div className="spatial-bento-stat-num" style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: currentItem.badgeColor,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1
                  }}>
                    {currentItem.statNumber}
                  </div>
                  <div className="spatial-bento-stat-lbl" style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94A3B8', fontWeight: 600, marginTop: '4px' }}>
                    {currentItem.statLabel}
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: HERO VISUAL WITH GLASS BADGE ── */}
            <div className="spatial-bento-image-col" style={{
              position: 'relative',
              minHeight: '280px',
              overflow: 'hidden',
              background: 'var(--bg-secondary)'
            }}>
              {/* Photo Background */}
              <img 
                src={currentItem.image} 
                alt={currentItem.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.6s ease'
                }}
              />
              {/* Gradient Vignette Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: isLight 
                  ? 'linear-gradient(to right, #ffffff 0%, rgba(255, 255, 255, 0.4) 30%, transparent 60%), linear-gradient(to top, #ffffff 0%, transparent 40%)'
                  : 'linear-gradient(to right, #131D33 0%, rgba(19, 29, 51, 0.4) 30%, transparent 60%), linear-gradient(to top, #131D33 0%, transparent 40%)'
              }} />

              {/* Floating Glassmorphism Badge */}
              <div className="spatial-bento-floating-badge" style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)',
                border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '100px',
                padding: '8px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: isLight ? '#0f172a' : '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                boxShadow: isLight ? '0 8px 20px rgba(15, 23, 42, 0.12)' : '0 8px 24px rgba(0, 0, 0, 0.5)'
              }}>
                <span style={{ fontSize: '1rem' }}>{currentItem.floatingIcon}</span>
                <span>{currentItem.floatingBadge}</span>
              </div>

              {/* Bottom Quick Tag */}
              <div className="spatial-bento-slide-tag" style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                background: isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
                border: isLight ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                color: isLight ? '#334155' : '#CBD5E1',
                fontWeight: 600
              }}>
                Slide {currentSlide + 1} dari {slides.length}
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CAROUSEL CONTROLS BAR: ARROWS & DOT PAGINATION WITH AUTOPLAY STATUS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="spatial-bento-controls" style={{
            padding: '12px 24px',
            background: isLight ? '#f8fafc' : 'var(--bg-card-hover)',
            borderTop: isLight ? '1px solid #e2e8f0' : '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            {/* Auto-scroll Status / Pause state */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="spatial-bento-pause-btn"
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: isPaused ? '#FBBF24' : (isLight ? '#059669' : '#34D399'),
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={isPaused ? 'Lanjutkan Auto-Scroll' : 'Jeda Auto-Scroll'}
              >
                {isPaused ? <Play size={13} fill="#FBBF24" /> : <Pause size={13} fill={isLight ? '#059669' : '#34D399'} />}
              </button>
              <span className="desktop-only" style={{ fontSize: '0.74rem', color: isLight ? '#475569' : '#94A3B8' }}>
                {isPaused ? 'Auto-scroll dijeda' : 'Auto-scroll tiap 5 detik (sorot untuk jeda)'}
              </span>
            </div>

            {/* Dots Pagination */}
            <div className="spatial-bento-dots-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {slides.map((_, idx) => {
                const active = currentSlide === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`spatial-bento-dot ${active ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      height: '8px',
                      width: active ? '28px' : '8px',
                      borderRadius: '100px',
                      background: active 
                        ? (activeTab === 'customer' 
                            ? '#2563EB' 
                            : activeTab === 'owner' 
                              ? '#059669' 
                              : '#D97706')
                        : (isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.2)'),
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      padding: 0
                    }}
                    title={`Pindah ke slide ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Prev / Next Arrow Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="spatial-bento-arrow-btn"
                onClick={handlePrev}
                aria-label="Slide Sebelumnya"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isLight ? '#0f172a' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="spatial-bento-arrow-btn"
                onClick={handleNext}
                aria-label="Slide Selanjutnya"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isLight ? '#0f172a' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
