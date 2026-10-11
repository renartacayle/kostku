import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
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

export default function SpatialBentoShowcase() {
  const navigate = useNavigate();

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
      description: 'Semua pemilik kost wajib lolos verifikasi identitas fisik. Uang muka (DP) kamu terlindungi dengan garansi uang kembali jika kamar tidak sesuai.',
      perks: [
        '100% pemilik sah dan pengelola terverifikasi identitas KTP',
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
      ctaLink: '/register',
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
      ctaLink: '/register',
      floatingBadge: '🧾 Kwitansi WA Digital Otomatis',
      floatingIcon: '🧾',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'penyewa-terverifikasi',
      badge: '🔒 SCREENING PENYEWA AMAN',
      badgeColor: '#818CF8',
      badgeBg: 'rgba(129, 140, 248, 0.15)',
      title: 'Penyewa Terverifikasi KTP, Kost Lebih Aman & Tertib',
      description: 'Hindari penyewa bermasalah atau fiktif. Setiap calon penghuni melalui proses validasi identitas resmi sehingga lingkungan kost Anda tetap aman dan kondusif.',
      perks: [
        'Penyimpanan arsip identitas penyewa terenkripsi aman',
        'Pemberlakuan peraturan kost digital yang mengikat',
        'Riwayat masa sewa & catatan kedisiplinan penghuni'
      ],
      statNumber: '99.9%',
      statLabel: 'Bebas Masalah & Kondusif',
      ctaText: 'Dapatkan Penyewa Berkualitas →',
      ctaLink: '/register',
      floatingBadge: '🔒 Verifikasi Identitas Sah',
      floatingIcon: '🔒',
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
      ctaLink: '/register',
      floatingBadge: '🎯 Radar GPS Kampus Terdekat',
      floatingIcon: '🎯',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80'
    }
  ];

  const slides = activeTab === 'customer' ? CUSTOMER_SLIDES : OWNER_SLIDES;
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

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        background: 'linear-gradient(145deg, #0d1527, #070d1a)',
        borderRadius: '28px',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        padding: 'clamp(1.75rem, 4vw, 3rem) clamp(1rem, 3vw, 2.5rem)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#F8FAFC',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
      }}
    >
      {/* Subtle Specular Glow Backgrounds */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: activeTab === 'customer' 
          ? 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1160px', margin: '0 auto' }}>
        
        {/* ═══════════════════════════════════════════════════════════════════
            TOP BAR: AUDIENCE SEGMENTED TAB SWITCHER (CUSTOMER VS OWNER)
            ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          {/* Section Eyebrow Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '100px',
            color: '#60A5FA',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            <Sparkles size={14} />
            <span>SOLUSI TERLENGKAP KOSTKU</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 1.25rem 0',
            color: '#FFFFFF'
          }}>
            Fitur Cerdas untuk{' '}
            <span style={{ color: activeTab === 'customer' ? '#38BDF8' : '#34D399' }}>
              {activeTab === 'customer' ? 'Pencari Kost' : 'Pemilik Kost'}
            </span>
          </h2>

          {/* Interactive Toggle Switcher */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '100px',
            padding: '5px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            gap: '4px'
          }}>
            {/* Tab Customer */}
            <button
              type="button"
              onClick={() => handleTabChange('customer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '100px',
                border: 'none',
                background: activeTab === 'customer' ? '#2563EB' : 'transparent',
                color: activeTab === 'customer' ? '#FFFFFF' : '#94A3B8',
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
              onClick={() => handleTabChange('owner')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '100px',
                border: 'none',
                background: activeTab === 'owner' ? '#059669' : 'transparent',
                color: activeTab === 'owner' ? '#FFFFFF' : '#94A3B8',
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
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THE SINGLE INTERACTIVE SLIDE CAROUSEL CARD
            ═══════════════════════════════════════════════════════════════════ */}
        <div style={{
          background: '#131D33',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'stretch',
            minHeight: '440px'
          }}>
            
            {/* ── LEFT COLUMN: TITLE, BENEFITS, STATS, AND CTA ── */}
            <div style={{
              padding: 'clamp(1.5rem, 3.5vw, 2.75rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div>
                {/* Category Pill Badge */}
                <div style={{
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
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: 'clamp(1.4rem, 2.4vw, 1.85rem)',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  color: '#FFFFFF'
                }}>
                  {currentItem.title}
                </h3>

                {/* Description */}
                <p style={{
                  margin: '0 0 1.5rem 0',
                  color: '#94A3B8',
                  fontSize: 'clamp(0.9rem, 1.6vw, 0.98rem)',
                  lineHeight: 1.6
                }}>
                  {currentItem.description}
                </p>

                {/* Perks Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
                  {currentItem.perks.map((perk, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color={currentItem.badgeColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.88rem', color: '#E2E8F0', lineHeight: 1.4, fontWeight: 500 }}>
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action & Stat Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <Link
                  to={currentItem.ctaLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    background: activeTab === 'customer' ? '#2563EB' : '#059669',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    boxShadow: activeTab === 'customer' 
                      ? '0 4px 16px rgba(37, 99, 235, 0.4)' 
                      : '0 4px 16px rgba(5, 150, 105, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span>{currentItem.ctaText}</span>
                </Link>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: currentItem.badgeColor,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1
                  }}>
                    {currentItem.statNumber}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, marginTop: '4px' }}>
                    {currentItem.statLabel}
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: HERO VISUAL WITH GLASS BADGE ── */}
            <div style={{
              position: 'relative',
              minHeight: '280px',
              overflow: 'hidden',
              background: '#070D1A'
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
                background: 'linear-gradient(to right, #131D33 0%, rgba(19, 29, 51, 0.4) 30%, transparent 60%), linear-gradient(to top, #131D33 0%, transparent 40%)'
              }} />

              {/* Floating Glassmorphism Badge */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '100px',
                padding: '8px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
              }}>
                <span style={{ fontSize: '1rem' }}>{currentItem.floatingIcon}</span>
                <span>{currentItem.floatingBadge}</span>
              </div>

              {/* Bottom Quick Tag */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                color: '#CBD5E1',
                fontWeight: 600
              }}>
                Slide {currentSlide + 1} dari {slides.length}
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CAROUSEL CONTROLS BAR: ARROWS & DOT PAGINATION WITH AUTOPLAY STATUS
              ═══════════════════════════════════════════════════════════════════ */}
          <div style={{
            padding: '12px 24px',
            background: 'rgba(11, 19, 43, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            {/* Auto-scroll Status / Pause state */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: isPaused ? '#FBBF24' : '#34D399',
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
                {isPaused ? <Play size={13} fill="#FBBF24" /> : <Pause size={13} fill="#34D399" />}
              </button>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                {isPaused ? 'Auto-scroll dijeda' : 'Auto-scroll tiap 5 detik (sorot untuk jeda)'}
              </span>
            </div>

            {/* Dots Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {slides.map((_, idx) => {
                const active = currentSlide === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      height: '8px',
                      width: active ? '28px' : '8px',
                      borderRadius: '100px',
                      background: active 
                        ? (activeTab === 'customer' ? '#38BDF8' : '#34D399')
                        : 'rgba(255, 255, 255, 0.2)',
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
                onClick={handlePrev}
                aria-label="Slide Sebelumnya"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
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
                onClick={handleNext}
                aria-label="Slide Selanjutnya"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
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
