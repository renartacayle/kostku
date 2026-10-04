import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, ShieldCheck, Wifi, Bath, Car, ChevronRight, ArrowUpRight, Download, LogIn, Sparkles, Building } from 'lucide-react';
import VideoScroll from '../components/VideoScroll';
import InstallModal from '../components/InstallModal';
import { apiGetPublicKosts } from '../services/api';

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
    <div style={{ background: '#080612', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      
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
          scrollMarginTop: '65px'
        }}
      >
        {/* Section header */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '5rem 2rem 3rem',
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
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: '800',
            color: 'white',
            margin: '0 0 1rem 0',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
          }}>
            Temukan Kost Impianmu
          </h2>

          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '1.05rem',
            maxWidth: '550px',
            margin: '0 auto 3rem',
            lineHeight: 1.7,
          }}>
            Semua kost terverifikasi dengan koordinat GPS akurat, foto asli ruangan, dan informasi lengkap dari pemilik.
          </p>

          {/* Premium Search Bar */}
          <div style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            gap: '0',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '1.5rem',
              color: 'rgba(255,255,255,0.25)',
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
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '0.95rem',
                padding: '16px 12px',
                outline: 'none',
              }}
            />
            <button style={{
              padding: '12px 28px',
              margin: '6px',
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              color: 'white',
              border: 'none',
              borderRadius: '100px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}>
              Cari <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Kost cards grid */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
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
                    {/* Image */}
                    <div style={{
                      height: '220px',
                      background: 'linear-gradient(135deg, #1a1828, #0e1628)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {kost.images && kost.images[0] ? (
                        <img
                          src={kost.images[0]}
                          alt={kost.kostName}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80';
                          }}
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s ease',
                          }}
                        />
                      ) : (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: '100%', color: 'rgba(255,255,255,0.15)',
                          fontSize: '3rem',
                          background: 'linear-gradient(135deg, #1a1828, #0e1628)',
                        }}>
                          🏠
                        </div>
                      )}

                      {/* Verified badge */}
                      <div style={{
                        position: 'absolute', top: '14px', right: '14px',
                        background: 'rgba(34, 197, 94, 0.9)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        padding: '5px 12px', borderRadius: '100px',
                        fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontWeight: '700',
                      }}>
                        <ShieldCheck size={12} /> Verified
                      </div>

                      {/* Bottom gradient */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '100px',
                        background: 'linear-gradient(to top, rgba(14,12,30,1), transparent)',
                      }} />
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        marginBottom: '6px',
                      }}>
                        <h3 style={{
                          margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'white',
                          lineHeight: 1.3,
                        }}>
                          {kost.kostName}
                        </h3>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '3px',
                          color: '#facc15', fontSize: '0.82rem', fontWeight: '600',
                          flexShrink: 0, marginLeft: '12px',
                        }}>
                          <Star size={13} fill="currentColor" /> 4.8
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
                        marginBottom: '1rem',
                      }}>
                        <MapPin size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {kost.address || 'Alamat tidak tersedia'}
                        </span>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.2rem' }}>
                        {[
                          { icon: <Wifi size={11} />, label: 'WiFi' },
                          { icon: <Bath size={11} />, label: 'KM Dalam' },
                          { icon: <Car size={11} />, label: 'Parkir' },
                        ].map((tag, i) => (
                          <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px',
                            background: 'rgba(59, 130, 246, 0.06)',
                            color: 'rgba(110, 168, 254, 0.7)',
                            borderRadius: '6px', fontSize: '0.72rem', fontWeight: '500',
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
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
                          Mulai dari
                        </span>
                        <span style={{
                          fontSize: '1.15rem', fontWeight: '800',
                          background: 'linear-gradient(135deg, #6ea8fe, #b48cfe)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
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
          padding: '2.5rem 2rem',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
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
