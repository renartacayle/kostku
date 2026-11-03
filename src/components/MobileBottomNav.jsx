import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Building, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * MobileBottomNav - Pure CSS & SVG "Floating Notch" Tab Bar
 * Inspired by Instagram Reel (ui_motion_prompts: Tab Bar Part 1 — Option 3 "Floating Notch")
 * "A floating ball rides a curved notch to the new tab, hopping on the way."
 *
 * Implements:
 * 1. Immediate touch/click reactivity (no lag, no delayed useEffect transition).
 * 2. High parabolic leap animation (translateY -26px with vertical stretch and squish landing).
 * 3. Physical curved notch cutout that moves horizontally with 100% percentage scaling.
 * 4. Concentric cyan glow contour underneath the floating ball.
 * 5. Dynamic pop-in icon rotation upon landing.
 */
export default function MobileBottomNav({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  // If on login, register, checkout, stress-test report, or kost detail page, hide bottom nav
  if (
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname === '/checkout' || 
    location.pathname === '/bayar' || 
    location.pathname === '/stress-test-report' ||
    location.pathname.startsWith('/stress-test') ||
    location.pathname.startsWith('/kost/')
  ) {
    return null;
  }

  const isOwner = user?.role === 'owner' || user?.role === 'master';
  const isStaff = user?.role === 'staff';

  const navItems = [
    {
      id: 'home',
      path: '/',
      label: 'Utama',
      icon: <Home size={20} strokeWidth={2} />,
      isActive: location.pathname === '/'
    },
    {
      id: 'search',
      path: '/search',
      label: 'Cari Kost',
      icon: <Search size={20} strokeWidth={2} />,
      isActive: location.pathname === '/search' || location.pathname === '/cari-kost'
    },
    {
      id: 'kost',
      path: user?.role === 'mitra' ? '/mitra' : (user ? '/dashboard' : '/login'),
      label: user?.role === 'mitra' ? 'Toko Saya' : (isOwner ? 'My Kost' : isStaff ? 'Tugas Staf' : 'Kost Saya'),
      icon: <Building size={20} strokeWidth={2} />,
      badge: user?.role === 'mitra' ? 'Mitra' : (isOwner ? 'Owner' : isStaff ? 'Staf' : null),
      isActive: ['/dashboard', '/penghuni', '/keuangan', '/laporan', '/komplain', '/karyawan', '/mitra', '/layanan', '/toko'].includes(location.pathname)
    },
    {
      id: 'settings',
      path: user ? '/pengaturan' : '/login',
      label: 'Setting',
      icon: <Settings size={20} strokeWidth={2} />,
      isActive: location.pathname === '/pengaturan' || location.pathname === '/setting'
    }
  ];

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const activeIndex = navItems.findIndex((item) => item.isActive);
  const isAnyActive = activeIndex >= 0;
  const validIndex = isAnyActive ? activeIndex : 0;

  const [currentIdx, setCurrentIdx] = useState(validIndex);
  const [isHopping, setIsHopping] = useState(false);
  const hoppingTimerRef = useRef(null);

  // Sync index on external route changes (e.g. browser back/forward)
  useEffect(() => {
    if (isAnyActive && activeIndex !== currentIdx && !isHopping) {
      setIsHopping(true);
      setCurrentIdx(activeIndex);
      if (hoppingTimerRef.current) clearTimeout(hoppingTimerRef.current);
      hoppingTimerRef.current = setTimeout(() => {
        setIsHopping(false);
      }, 460);
    }
  }, [activeIndex, isAnyActive, currentIdx, isHopping]);

  // Immediate Click/Touch Trigger: Start animation on first millisecond of touch
  const handleTabClick = useCallback((e, item, idx) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent re-navigation only if user is already on the exact target path
    if (location.pathname === item.path) return;

    if (hoppingTimerRef.current) clearTimeout(hoppingTimerRef.current);

    // Trigger hop animation immediately!
    setIsHopping(true);
    setCurrentIdx(idx);

    // Start router transition immediately
    navigate(item.path);

    hoppingTimerRef.current = setTimeout(() => {
      setIsHopping(false);
    }, 460);
  }, [location.pathname, navigate]);

  return (
    <nav
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 800,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '480px',
          margin: '0 auto',
          pointerEvents: 'auto',
          filter: 'drop-shadow(0 -10px 28px rgba(0, 0, 0, 0.35))'
        }}
      >
        {/* Main Tab Bar Body */}
        <div
          style={{
            position: 'relative',
            background: 'var(--bg-glass, rgba(14, 23, 38, 0.95))',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            borderRadius: '24px 24px 0 0',
            height: '62px',
            overflow: 'visible'
          }}
        >
          {/* SLIDING NOTCH & FLOATING BALL UNIT */}
          {isAnyActive && (
            <div
              style={{
                position: 'absolute',
                top: '-18px',
                left: 0,
                width: '25%',
                height: '80px',
                transform: `translateX(${currentIdx * 100}%)`,
                transition: 'transform 0.44s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              {/* Curved Notch Cutout Shape (Visually dips into the tab bar) */}
              <div
                style={{
                  position: 'absolute',
                  top: '17px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '74px',
                  height: '24px',
                  pointerEvents: 'none',
                  overflow: 'visible'
                }}
              >
                <svg
                  viewBox="0 0 74 24"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                >
                  {/* Physical Notch Fill that matches page background */}
                  <path
                    d="M 0,0 C 13,0 18,22 37,22 C 56,22 61,0 74,0 L 74,24 L 0,24 Z"
                    fill={isLight ? '#f1f5f9' : 'var(--bg-main, #080d1a)'}
                  />
                  {/* Notch Rim Border */}
                  <path
                    d="M 0,0 C 13,0 18,22 37,22 C 56,22 61,0 74,0"
                    fill="none"
                    stroke={isLight ? 'rgba(15, 23, 42, 0.12)' : 'var(--border-color, rgba(255, 255, 255, 0.15))'}
                    strokeWidth="1.5"
                  />
                {/* Concentric Cyan Glow Contour (from Reel 4 Option 3) */}
                <path
                  d="M 14,2 C 22,2 27,18 37,18 C 47,18 52,2 60,2"
                  fill="none"
                  stroke="var(--accent-primary, #38bdf8)"
                  strokeWidth="2.5"
                  opacity="0.85"
                />
              </svg>

              {/* Small glowing dot indicator inside notch cutout */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8'
                }}
              />
            </div>

            {/* THE FLOATING BALL (Hopper that rides the notch) */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 25
              }}
            >
              <div
                key={`ball-${currentIdx}`}
                className={isHopping ? 'notch-ball-hopping' : 'notch-ball-idle'}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary, #2563eb) 0%, #38bdf8 100%)',
                  border: '2.5px solid #ffffff',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.6), 0 0 16px rgba(56, 189, 248, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                {/* Active Icon with pop-in rotation */}
                <div
                  key={`icon-${navItems[currentIdx].id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'popIconIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                >
                  {navItems[currentIdx].icon}
                </div>
              </div>
            </div>
          </div>
        )}

          {/* TAB BUTTONS ROW */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              zIndex: 5
            }}
          >
            {navItems.map((item, idx) => {
              const active = isAnyActive && idx === currentIdx;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={(e) => handleTabClick(e, item, idx)}
                  style={{
                    flex: 1,
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingBottom: '8px',
                    cursor: 'pointer',
                    outline: 'none',
                    position: 'relative',
                    color: active ? 'var(--accent-primary, #38bdf8)' : 'var(--text-secondary, #94a3b8)',
                    transition: 'color 0.2s ease',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {/* Inactive Icon Slot (Fades out when active as it elevates into Floating Ball) */}
                  <div
                    style={{
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: active ? 0 : 0.85,
                      transform: active ? 'translateY(-10px) scale(0.4)' : 'translateY(0) scale(1)',
                      transition: 'opacity 0.25s ease, transform 0.25s ease'
                    }}
                  >
                    {item.icon}

                    {/* Badge if present */}
                    {item.badge && !active && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '20%',
                          fontSize: '0.52rem',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          lineHeight: 1
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Tab Label Text */}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: active ? 800 : 500,
                      color: active ? 'var(--text-primary, #ffffff)' : 'var(--text-muted, #64748b)',
                      letterSpacing: '-0.01em',
                      marginTop: '3px',
                      transform: active ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Physics Keyframe Animations for Floating Notch */}
      <style>{`
        .notch-ball-hopping {
          animation: ballHopLeap 0.44s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .notch-ball-idle {
          transform: translateY(0) scale(1);
        }

        @keyframes ballHopLeap {
          0% {
            transform: translateY(0) scale(1, 1);
          }
          35% {
            transform: translateY(-26px) scale(0.85, 1.25);
          }
          65% {
            transform: translateY(-16px) scale(1.08, 0.94);
          }
          85% {
            transform: translateY(2px) scale(1.16, 0.84);
          }
          100% {
            transform: translateY(0) scale(1, 1);
          }
        }

        @keyframes popIconIn {
          0% {
            transform: scale(0.2) rotate(-45deg);
            opacity: 0;
          }
          65% {
            transform: scale(1.2) rotate(6deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </nav>
  );
}
