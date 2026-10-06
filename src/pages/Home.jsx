import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ShieldCheck, Wifi, Bath, Car, ChevronRight, ChevronLeft, ArrowUpRight, Download, LogIn, Sparkles, Building, X } from 'lucide-react';
import VideoScroll from '../components/VideoScroll';
import InstallModal from '../components/InstallModal';
import { apiGetPublicKosts } from '../services/api';

// Interactive & Swipeable Image Slider for Kost Cards
function KostCardImageSlider({ images, kostName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const imgList = (images && images.length > 0) ? images : [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'
  ];

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : imgList.length - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < imgList.length - 1 ? prev + 1 : 0));
  };

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
      e.preventDefault();
      e.stopPropagation();
      if (diffX > 0) {
        handleNext(e);
      } else {
        handlePrev(e);
      }
    }
  };

  return (
    <div 
      className="kost-slider-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        maxWidth: '100%',
        height: '220px',
        background: 'linear-gradient(135deg, #1a1828, #0e1628)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* Sliding Track */}
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        transform: `translateX(-${currentIndex * 100}%)`,
        transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
      }}>
        {imgList.map((src, i) => (
          <div key={i} style={{ flex: '0 0 100%', width: '100%', maxWidth: '100%', minWidth: 0, height: '100%', position: 'relative' }}>
            <img 
              src={src}
              alt={`${kostName} - foto ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        ))}
      </div>

      {/* Verified badge */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        background: 'rgba(34, 197, 94, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: 'white',
        padding: '4px 10px', borderRadius: '100px',
        fontSize: '0.72rem',
        display: 'flex', alignItems: 'center', gap: '4px',
        fontWeight: '700',
        zIndex: 4,
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <ShieldCheck size={12} /> Verified
      </div>

      {/* Photo count indicator */}
      {imgList.length > 1 && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#e2e8f0',
          padding: '3px 8px', borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: '700',
          zIndex: 4,
          pointerEvents: 'none'
        }}>
          {currentIndex + 1} / {imgList.length}
        </div>
      )}

      {/* Navigation Arrow Buttons */}
      {imgList.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Foto sebelumnya"
            className="slider-nav-btn"
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Foto selanjutnya"
            className="slider-nav-btn"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {imgList.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '5px',
          zIndex: 4,
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '3px 8px',
          borderRadius: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          {imgList.map((_, dotIdx) => (
            <span
              key={dotIdx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(dotIdx);
              }}
              style={{
                width: currentIndex === dotIdx ? '16px' : '5px',
                height: '5px',
                borderRadius: '3px',
                background: currentIndex === dotIdx ? '#38bdf8' : 'rgba(255, 255, 255, 0.45)',
                transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '60px',
        background: 'linear-gradient(to top, rgba(14,12,30,0.85), transparent)',
        pointerEvents: 'none',
        zIndex: 2
      }} />
    </div>
  );
}

export default function Home({ user }) {
  const [kosts, setKosts] = useState([]);
  const [search, setSearch] = useState('');
  const [showInstall, setShowInstall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Fetch kost listings safely
  const fetchKosts = () => {
    setLoading(true);
    setLoadError(null);
    apiGetPublicKosts()
      .then(data => setKosts(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load marketplace kosts:', err);
        setLoadError('Tidak dapat memuat daftar kost saat ini.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKosts();
  }, []);

  // Safe null-guarded search filter
  const filtered = (kosts || []).filter(k => {
    if (!k) return false;
    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    const name = (k.kostName || '').toLowerCase();
    const addr = (k.address || '').toLowerCase();
    const city = (k.city || '').toLowerCase();
    return name.includes(q) || addr.includes(q) || city.includes(q);
  });

  return (
    <div style={{ 
      background: '#080612', 
      paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      
      {/* ═══════ FLOATING TOP NAVBAR ═══════ */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(8, 6, 18, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800
          }}>
            K
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            KostKu
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/search"
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <Search size={14} color="#60a5fa" />
            <span>Cari Kost</span>
          </Link>

          <button
            onClick={() => setShowInstall(true)}
            className="btn btn-secondary btn-sm desktop-only"
            style={{ gap: '6px' }}
          >
            <Download size={14} color="#60a5fa" />
            <span>Pasang Aplikasi</span>
          </button>

          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <LogIn size={14} />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </header>

      {/* ═══════ SECTION 1: CINEMATIC 60FPS VIDEO SCROLL ANIMATION ═══════ */}
      <VideoScroll />

      {/* ═══════════════════════════════════════
          SECTION 2: MARKETPLACE LISTING
          ═══════════════════════════════════════ */}
      <div
        id="listing"
        style={{
          position: 'relative',
          zIndex: 5,
          background: '#0e0c1e',
          minHeight: '100vh',
          paddingBottom: '6rem',
          scrollMarginTop: '65px',
          overflowX: 'hidden',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Section header */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 4.5rem) clamp(1rem, 3vw, 2rem) clamp(1.5rem, 4vw, 2.5rem)',
          textAlign: 'center',
        }}>
          {/* Decorative line */}
          <div style={{
            width: '60px',
            height: '3px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            margin: '0 auto 2rem',
            borderRadius: '2px',
          }} />

          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            borderRadius: '100px',
            color: '#6ea8fe',
            fontSize: '0.8rem',
            fontWeight: '700',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            ✨ Verified Kost Listings
          </span>

          <h2 style={{
            fontSize: 'clamp(1.9rem, 4vw, 3.2rem)',
            fontWeight: '800',
            color: 'white',
            margin: '0 0 1rem 0',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
          }}>
            Temukan Kost Impianmu
          </h2>

          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 'clamp(0.92rem, 2vw, 1.05rem)',
            maxWidth: '550px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}>
            Semua kost terverifikasi dengan koordinat GPS akurat, foto asli ruangan, dan informasi lengkap dari pemilik.
          </p>

          {/* Premium Responsive Search Bar */}
          <div style={{
            maxWidth: '640px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '1rem',
              color: 'rgba(255,255,255,0.4)',
              flexShrink: 0
            }}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari nama kost atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                padding: '14px 8px 14px 10px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <X size={16} />
              </button>
            )}
            <button 
              type="button"
              onClick={() => {
                const gridEl = document.querySelector('.kost-responsive-grid');
                if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                flexShrink: 0,
                padding: '10px clamp(14px, 3vw, 22px)',
                margin: '4px',
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '100px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: 'clamp(0.8rem, 2.2vw, 0.9rem)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Cari</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Kost cards grid */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 clamp(1rem, 3vw, 2rem)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              color: 'rgba(255,255,255,0.4)',
            }}>
              <div style={{
                width: '80px', height: '80px', margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
              }}>🏠</div>
              <h3 style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontWeight: 700 }}>
                Belum ada kost yang terdaftar
              </h3>
              <p style={{ marginBottom: '2rem' }}>Jadilah yang pertama mendaftarkan kost Anda!</p>
              <Link to="/register" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                color: 'white',
                borderRadius: '100px',
                textDecoration: 'none',
                fontWeight: '700',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              }}>
                Daftarkan Kost Anda <ArrowUpRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="kost-responsive-grid">
              {filtered.map((kost, index) => (
                <Link
                  to={`/kost/${kost.uid}`}
                  key={kost.uid}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    animation: `fadeInUp 0.6s ease ${index * 0.08}s both`,
                    display: 'block',
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
                      e.currentTarget.style.boxShadow = '0 24px 48px rgba(59, 130, 246, 0.12), 0 0 0 1px rgba(59, 130, 246, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {/* Interactive & Swipeable Image Slider */}
                    <KostCardImageSlider images={kost.images} kostName={kost.kostName} />

                    {/* Card body */}
                    <div style={{ padding: 'clamp(0.9rem, 3vw, 1.35rem)', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        marginBottom: '6px',
                        gap: '8px',
                        minWidth: 0,
                      }}>
                        <h3 style={{
                          margin: 0, fontSize: 'clamp(0.98rem, 2.5vw, 1.1rem)', fontWeight: '700', color: 'white',
                          lineHeight: 1.3,
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                        }}>
                          {kost.kostName}
                        </h3>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '3px',
                          color: '#facc15', fontSize: '0.82rem', fontWeight: '600',
                          flexShrink: 0,
                        }}>
                          <Star size={13} fill="currentColor" /> 4.8
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
                        marginBottom: '1rem',
                        minWidth: 0,
                      }}>
                        <MapPin size={12} style={{ flexShrink: 0 }} />
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                          flex: 1,
                        }}>
                          {kost.address || 'Alamat tidak tersedia'}
                        </span>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.2rem', minWidth: 0 }}>
                        {[
                          { icon: <Wifi size={11} />, label: 'WiFi' },
                          { icon: <Bath size={11} />, label: 'KM Dalam' },
                          { icon: <Car size={11} />, label: 'Parkir' },
                        ].map((tag, i) => (
                          <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px',
                            background: 'rgba(59, 130, 246, 0.06)',
                            color: 'rgba(110, 168, 254, 0.7)',
                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: '500',
                            whiteSpace: 'nowrap',
                          }}>
                            {tag.icon} {tag.label}
                          </span>
                        ))}
                      </div>

                      {/* Price */}
                      <div style={{
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: '8px',
                        minWidth: 0,
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', flexShrink: 0 }}>
                          Mulai dari
                        </span>
                        <span style={{
                          fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', fontWeight: '800',
                          background: 'linear-gradient(135deg, #6ea8fe, #b48cfe)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                          whiteSpace: 'nowrap',
                          textAlign: 'right',
                        }}>
                          Rp {kost.rooms?.length > 0
                            ? Math.min(...kost.rooms.map(r => r.price)).toLocaleString()
                            : '0'}
                          <span style={{
                            fontSize: '0.72rem', fontWeight: '500',
                            WebkitTextFillColor: 'rgba(255,255,255,0.3)',
                          }}> /bln</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          maxWidth: '1200px',
          margin: '6rem auto 0',
          padding: '2.5rem clamp(1rem, 3vw, 2rem)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 'bold', color: 'white',
              }}>K</div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.95rem' }}>
                KostKu
              </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
              © 2026 KostKu — Platform Pencarian Kost Terverifikasi
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Tentang', 'Syarat & Ketentuan', 'Kontak'].map(link => (
              <a key={link} href="#" style={{
                color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem',
                textDecoration: 'none', transition: 'color 0.2s',
              }}>{link}</a>
            ))}
          </div>
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { 
          background: rgba(59, 130, 246, 0.3); 
          border-radius: 3px; 
        }
        ::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
      `}</style>

      <InstallModal isOpen={showInstall} onClose={() => setShowInstall(false)} />
    </div>
  );
}
