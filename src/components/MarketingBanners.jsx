import React, { useState, useEffect, useRef } from 'react';

export const MARKETING_BANNERS = [
  {
    id: 'banner-asli',
    badge: 'GARANSI KEASLIAN 100%',
    titleMain: 'Foto Fisik Asli',
    titleAccent: 'Tanpa Efek Lensa Palsu',
    desc: 'Tiap sudut kamar kami verifikasi mandiri. Yang Anda lihat di foto adalah apa yang Anda dapat saat kunci diserahkan.',
    icon: '📸',
    borderColor: '#3B82F6',
    badgeColor: '#60A5FA',
    accentColor: '#93C5FD',
    bgGradient: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.9) 100%)',
    track: 'banner-asli'
  },
  {
    id: 'banner-rp0',
    badge: 'ANTI BIAYA SILUMAN',
    titleMain: 'Transparansi Penuh',
    titleAccent: 'Rp 0 Biaya Calo & Admin',
    desc: 'Harga sewa langsung dari pemilik kos resmi. Tanpa mark-up perantara, tanpa uang survei, dan deposit tercatat legal.',
    icon: '⚡',
    borderColor: '#10B981',
    badgeColor: '#34D399',
    accentColor: '#6EE7B7',
    bgGradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.45) 0%, rgba(15, 23, 42, 0.9) 100%)',
    track: 'banner-rp0'
  },
  {
    id: 'banner-rating',
    badge: 'KOMUNITAS TERVERIFIKASI',
    titleMain: 'Rating & Ulasan',
    titleAccent: 'Murni dari Penghuni Nyata',
    desc: 'Hanya mahasiswa dan penghuni dengan kontrak aktif yang berhak memberikan ulasan. 0% review palsu atau titipan agen.',
    icon: '⭐',
    borderColor: '#F59E0B',
    badgeColor: '#FBBF24',
    accentColor: '#FDE68A',
    bgGradient: 'linear-gradient(135deg, rgba(120, 53, 15, 0.45) 0%, rgba(15, 23, 42, 0.9) 100%)',
    track: 'banner-rating'
  }
];

export default function MarketingBanners({ style = {} }) {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const bannerTouchStartX = useRef(0);
  const bannerTouchEndX = useRef(0);

  // Auto-scroll mobile banners every 4 seconds unless hovered/swiped
  useEffect(() => {
    if (isBannerPaused) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % MARKETING_BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isBannerPaused]);

  const handleBannerTouchStart = (e) => {
    setIsBannerPaused(true);
    bannerTouchStartX.current = e.touches[0].clientX;
    bannerTouchEndX.current = e.touches[0].clientX;
  };

  const handleBannerTouchMove = (e) => {
    bannerTouchEndX.current = e.touches[0].clientX;
  };

  const handleBannerTouchEnd = () => {
    const diff = bannerTouchStartX.current - bannerTouchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveBannerIndex((prev) => (prev + 1) % MARKETING_BANNERS.length);
      } else {
        setActiveBannerIndex((prev) => (prev - 1 + MARKETING_BANNERS.length) % MARKETING_BANNERS.length);
      }
    }
    setTimeout(() => setIsBannerPaused(false), 2000);
  };

  return (
    <div style={{ width: '100%', ...style }}>
      {/* Desktop View: 3 Kolom Grid Bersebelahan */}
      <div className="hero-marketing-desktop">
        {MARKETING_BANNERS.map((banner) => (
          <div
            key={banner.id}
            className="hero-marketing-banner-card"
            style={{ borderLeft: `4px solid ${banner.borderColor}` }}
            data-track={banner.track}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: banner.badgeColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {banner.badge}
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {banner.titleMain} <span style={{ color: banner.accentColor, fontSize: '1.25rem' }}>{banner.titleAccent}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {banner.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile View: Tampil Satu per Satu dengan Auto-Scroll Otomatis & Dot Indicators */}
      <div 
        className="hero-marketing-mobile-carousel"
        onTouchStart={handleBannerTouchStart}
        onTouchMove={handleBannerTouchMove}
        onTouchEnd={handleBannerTouchEnd}
        onMouseEnter={() => setIsBannerPaused(true)}
        onMouseLeave={() => setIsBannerPaused(false)}
      >
        {/* Sliding Track: Exactly 1 card visible at a time (100% width per slide) */}
        <div style={{
          display: 'flex',
          width: '100%',
          transform: `translate3d(-${activeBannerIndex * 100}%, 0, 0)`,
          transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
          willChange: 'transform'
        }}>
          {MARKETING_BANNERS.map((banner) => (
            <div 
              key={banner.id}
              style={{
                flex: '0 0 100%',
                width: '100%',
                boxSizing: 'border-box',
                padding: '0 2px'
              }}
            >
              <div 
                className="hero-marketing-banner-card"
                style={{ borderLeft: `4px solid ${banner.borderColor}`, width: '100%' }}
                data-track={banner.track}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: banner.badgeColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {banner.badge}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: '100px' }}>
                    {activeBannerIndex + 1}/3
                  </span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {banner.titleMain} <span style={{ color: banner.accentColor, fontSize: '1.15rem' }}>{banner.titleAccent}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {banner.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel Indicators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '10px'
        }}>
          {MARKETING_BANNERS.map((banner, idx) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setActiveBannerIndex(idx)}
              aria-label={`Lihat keunggulan ${idx + 1}`}
              style={{
                width: activeBannerIndex === idx ? '24px' : '7px',
                height: '7px',
                borderRadius: '100px',
                background: activeBannerIndex === idx ? banner.borderColor : 'var(--border-color)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
