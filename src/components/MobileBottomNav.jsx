import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Store, 
  Building, 
  Users, 
  DollarSign, 
  UserCheck, 
  Receipt, 
  QrCode, 
  Wrench, 
  Zap, 
  ClipboardCheck, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Settings,
  LayoutDashboard,
  Flame,
  ShoppingBag,
  Sliders
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { isOwnerRole, isMitraRole, isEmployeeRole, isMitraStaff } from '../utils/staffRole';

/**
 * MobileBottomNav - Dedicated Navbars for Each User Category
 * 1. Owner: Kamar, Penghuni, Keuangan, Karyawan
 * 2. Mitra: Katalog, Kasir POS, Meja QR, Omset
 * 3. Pegawai: Tugas, Meteran, Inspeksi, Komplain
 * 4. Pencari Kost: Beranda, Cari Kost, Layanan, Kost Saya
 *
 * Plus: Integrated Category Capsule Switcher with signature SVG Floating Notch & Jumping Ball physics!
 */
export default function MobileBottomNav({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Role Metadata & Visual Branding
  const ROLE_METAS = {
    user: {
      key: 'user',
      label: 'Pencari',
      emoji: '',
      title: 'Pencari Kost',
      rootPath: '/search',
      color: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.45)',
      activeBg: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
    },
    owner: {
      key: 'owner',
      label: 'Owner',
      emoji: '',
      title: 'Pemilik Kost (Juragan)',
      rootPath: '/dashboard',
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.45)',
      activeBg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
    },
    mitra: {
      key: 'mitra',
      label: 'Mitra',
      emoji: '',
      title: 'Mitra UMKM / Kantin',
      rootPath: '/mitra',
      color: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.45)',
      activeBg: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)'
    },
    staff: {
      key: 'staff',
      label: 'Pegawai',
      emoji: '',
      title: 'Pegawai / Staf Lapangan',
      rootPath: '/dashboard',
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.45)',
      activeBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    }
  };

  // Dedicated Navbars for each Category (5 items including Setting User for mobile thumb access)
  const CATEGORY_NAV_ITEMS = {
    user: [
      { id: 'user-home', label: 'Beranda', path: '/', icon: <Home size={19} strokeWidth={2.2} /> },
      { id: 'user-search', label: 'Cari Kost', path: '/search', icon: <Search size={19} strokeWidth={2.2} /> },
      { id: 'user-layanan', label: 'Layanan', path: '/layanan', icon: <Store size={19} strokeWidth={2.2} /> },
      { id: 'user-kost', label: 'Kost Saya', path: '/dashboard', icon: <Building size={19} strokeWidth={2.2} /> },
      { id: 'user-setting', label: 'Setting', path: '/pengaturan', testId: 'mobile-nav-setting-btn', icon: <Settings size={19} strokeWidth={2.2} /> }
    ],
    owner: [
      { id: 'owner-kamar', label: 'Kamar', path: '/dashboard', icon: <Building size={19} strokeWidth={2.2} /> },
      { id: 'owner-penghuni', label: 'Penghuni', path: '/penghuni', icon: <Users size={19} strokeWidth={2.2} /> },
      { id: 'owner-keuangan', label: 'Keuangan', path: '/keuangan', icon: <DollarSign size={19} strokeWidth={2.2} /> },
      { id: 'owner-karyawan', label: 'Karyawan', path: '/karyawan', icon: <UserCheck size={19} strokeWidth={2.2} /> },
      { id: 'owner-setting', label: 'Setting', path: '/pengaturan', testId: 'mobile-nav-setting-btn', icon: <Settings size={19} strokeWidth={2.2} /> }
    ],
    mitra: [
      { id: 'mitra-dashboard', label: 'Dashboard', path: '/kasir?tab=dashboard', testId: 'mobile-nav-mitra-dashboard', icon: <LayoutDashboard size={19} strokeWidth={2.2} /> },
      { id: 'mitra-dapur', label: 'Dapur', path: '/kasir?tab=kds', testId: 'mobile-nav-mitra-dapur', icon: <Flame size={19} strokeWidth={2.2} /> },
      { id: 'mitra-kasir', label: 'Kasir', path: '/kasir?tab=pos', testId: 'mobile-nav-mitra-kasir', icon: <ShoppingBag size={19} strokeWidth={2.2} /> },
      { id: 'mitra-keuangan', label: 'Keuangan', path: '/kasir?tab=settings', testId: 'mobile-nav-mitra-keuangan', icon: <DollarSign size={19} strokeWidth={2.2} /> },
      { id: 'mitra-setting', label: 'Setting', path: '/pengaturan', testId: 'mobile-nav-setting-btn', icon: <Settings size={19} strokeWidth={2.2} /> }
    ],
    staff: [
      { id: 'staff-tugas', label: 'Tugas', path: '/dashboard?tab=tasks', testId: 'mobile-nav-staff-tugas', icon: <Wrench size={19} strokeWidth={2.2} /> },
      { id: 'staff-meteran', label: 'Meteran', path: '/dashboard?tab=meteran', action: 'meteran', testId: 'mobile-nav-staff-meteran', icon: <Zap size={19} strokeWidth={2.2} /> },
      { id: 'staff-inspeksi', label: 'Inspeksi', path: '/dashboard?tab=inspeksi', action: 'inspeksi', testId: 'mobile-nav-staff-inspeksi', icon: <ClipboardCheck size={19} strokeWidth={2.2} /> },
      { id: 'staff-komplain', label: 'Komplain', path: '/komplain', testId: 'mobile-nav-staff-komplain', icon: <AlertCircle size={19} strokeWidth={2.2} /> },
      { id: 'staff-setting', label: 'Setting', path: '/pengaturan', testId: 'mobile-nav-setting-btn', icon: <Settings size={19} strokeWidth={2.2} /> }
    ]
  };

  // Separate Kost staff vs Mitra/POS staff directly from user scope
  const getActiveCategory = useCallback(() => {
    if (isOwnerRole(user?.role)) return 'owner';
    if (isMitraRole(user?.role) || isMitraStaff(user)) return 'mitra';
    if (isEmployeeRole(user?.role)) return 'staff';
    return 'user'; // default: Pencari Kost (Anak Kost / Calon Penghuni / Pengunjung)
  }, [user]);

  const activeCategory = getActiveCategory();
  const currentNavItems = CATEGORY_NAV_ITEMS[activeCategory] || CATEGORY_NAV_ITEMS.user;
  const currentMeta = ROLE_METAS[activeCategory] || ROLE_METAS.user;

  // Compute active tab index within current category
  const getActiveItemIdx = useCallback(() => {
    const p = location.pathname;
    const tabParam = new URLSearchParams(location.search || '').get('tab');
    if (p === '/pengaturan' || p === '/setting') {
      return Math.max(0, currentNavItems.length - 1);
    }
    if (activeCategory === 'owner') {
      if (p === '/karyawan') return 3;
      if (p === '/keuangan' || p === '/laporan') return 2;
      if (p === '/penghuni') return 1;
      if (p === '/dashboard') return 0;
    } else if (activeCategory === 'mitra') {
      if (p === '/keuangan') return 3;
      if (p === '/mitra' || p.startsWith('/order') || p.startsWith('/meja')) return 4;
      if (p.startsWith('/kasir') || p.startsWith('/pos')) {
        if (tabParam === 'settings') return 3;
        if (tabParam === 'kds') return 1;
        if (tabParam === 'dashboard') return 0;
        if (tabParam && tabParam !== 'pos') return 4;
        return 2;
      }
      return 2;
    } else if (activeCategory === 'staff') {
      if (p === '/komplain') return 3;
      if (p === '/dashboard') {
        if (tabParam === 'inspeksi' || tabParam === 'rooms') return 2;
        if (tabParam === 'meteran' || tabParam === 'inputs') return 1;
        return 0;
      }
    } else {
      // user (Pencari Kost)
      if (p === '/dashboard') return 3;
      if (p === '/layanan') return 2;
      if (p === '/search' || p === '/cari-kost' || p.startsWith('/kost/')) return 1;
      if (p === '/') return 0;
    }

    const foundIdx = currentNavItems.findIndex(it => it.path === p);
    return foundIdx >= 0 ? foundIdx : 0;
  }, [activeCategory, location.pathname, location.search, currentNavItems]);

  const activeIndex = getActiveItemIdx();
  const [currentIdx, setCurrentIdx] = useState(activeIndex);
  const [isHopping, setIsHopping] = useState(false);
  const hoppingTimerRef = useRef(null);

  // Sync index on route or category change
  useEffect(() => {
    const newIdx = getActiveItemIdx();
    if (newIdx !== currentIdx) {
      setIsHopping(true);
      setCurrentIdx(newIdx);
      if (hoppingTimerRef.current) clearTimeout(hoppingTimerRef.current);
      hoppingTimerRef.current = setTimeout(() => {
        setIsHopping(false);
      }, 440);
    }
  }, [getActiveItemIdx, currentIdx]);

  // Handle tab click within the active category navbar
  const handleTabClick = useCallback((e, item, idx) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger hop animation immediately!
    if (hoppingTimerRef.current) clearTimeout(hoppingTimerRef.current);
    setIsHopping(true);
    setCurrentIdx(idx);

    hoppingTimerRef.current = setTimeout(() => {
      setIsHopping(false);
    }, 460);

    // Navigate with query tab and smoothly scroll target section into view
    if (item.action === 'meteran') {
      navigate('/dashboard?tab=meteran');
      setTimeout(() => {
        const el = document.getElementById('meteran-section') || document.querySelector('[data-section="meteran"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return;
    }

    if (item.action === 'inspeksi') {
      navigate('/dashboard?tab=inspeksi');
      setTimeout(() => {
        const sectionEl = document.getElementById('inspeksi-section');
        if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return;
    }

    navigate(item.path);
  }, [navigate]);

  // Responsive Screen Check: Khusus Mobile Only (<= 900px)
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 900 : true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sembunyikan navbar bawah pada:
  // 1. Desktop (> 900px, navigasi menggunakan Sidebar & Top Navbar)
  // 2. Auth Flow (Login, Register, Demo, Sandbox)
  // 3. Checkout & Payment flow (/checkout, /bayar, /pembayaran)
  // 4. Meja / QR Self-Ordering (/order/*, /meja/*)
  // 5. Stress test / diagnostik teknis
  const shouldHide = 
    !isMobileScreen ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/demo' ||
    location.pathname === '/sandbox' ||
    location.pathname === '/demo-showcase' ||
    location.pathname === '/checkout' || 
    location.pathname === '/bayar' || 
    location.pathname === '/pembayaran' ||
    location.pathname === '/stress-test-report' ||
    location.pathname.startsWith('/stress-test') ||
    location.pathname.startsWith('/order') ||
    location.pathname.startsWith('/meja') ||
    location.pathname.startsWith('/kasir') ||
    location.pathname.startsWith('/pos') ||
    location.pathname.startsWith('/invite-staff') ||
    location.pathname.startsWith('/gabung-karyawan');

  if (shouldHide) {
    return null;
  }

  return (
    <nav
      className="role-bottom-nav mobile-only"
      aria-label="Navigasi Halaman Utama Mobile KostKu"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 800,
        paddingBottom: 0,
        pointerEvents: 'none'
      }}
    >
      <div
        className="role-nav-inner"
        style={{
          position: 'relative',
          maxWidth: '520px',
          margin: '0 auto',
          pointerEvents: 'auto',
          transform: 'translateZ(0)'
        }}
      >
        {/* DEDICATED CATEGORY TAB BAR (5 items including Setting with SVG Floating Notch) */}
        <div
          className="role-nav-bar"
          style={{
            position: 'relative',
            background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(14, 23, 38, 0.98)',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            borderRadius: '12px 12px 0 0',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            overflow: 'visible'
          }}
        >
          <div style={{ position: 'relative', height: '62px', overflow: 'visible' }}>
          {/* SLIDING NOTCH & FLOATING BALL UNIT */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: 0,
              width: `${100 / Math.max(1, currentNavItems.length)}%`,
              height: '82px',
              transform: `translateX(${currentIdx * 100}%)`,
              transition: 'transform 0.44s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            {/* Curved Notch Cutout Shape: flush at bar borderTop */}
            <div
              style={{
                position: 'absolute',
                top: '19px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '58px',
                height: '25px',
                pointerEvents: 'none',
                overflow: 'visible'
              }}
            >
              <svg
                viewBox="0 0 74 26"
                preserveAspectRatio="none"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
              >
                {/* True Sunken U-Notch Crater Fill */}
                <path
                  d="M 0,0 C 12,0 16,24 37,24 C 58,24 62,0 74,0 Z"
                  fill={isLight ? '#f8fafc' : '#0a0f1d'}
                />
                {/* Notch Rim Border */}
                <path
                  d="M 0,1 C 12,1 16,24 37,24 C 58,24 62,1 74,1"
                  fill="none"
                  stroke={isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.16)'}
                  strokeWidth="1.5"
                />
                {/* Concentric Glow Contour (Dynamic Category Color) */}
                <path
                  d="M 14,2 C 21,2 25,20 37,20 C 49,20 53,2 60,2"
                  fill="none"
                  stroke={currentMeta.color}
                  strokeWidth="2.2"
                  opacity="0.85"
                />
              </svg>

            </div>

            {/* THE FLOATING BALL (Hopper with Role Gradient) */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 25
              }}
            >
              <div
                key={`ball-${activeCategory}-${currentIdx}`}
                className={isHopping ? 'notch-ball-hopping' : 'notch-ball-idle'}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: currentMeta.activeBg,
                  border: '2.5px solid #ffffff',
                  boxShadow: `0 6px 18px ${currentMeta.glowColor}, 0 0 12px ${currentMeta.glowColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                {/* Active Icon with pop-in rotation */}
                <div
                  key={`icon-${activeCategory}-${currentNavItems[currentIdx]?.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'popIconIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                >
                  {currentNavItems[currentIdx]?.icon}
                </div>
              </div>
            </div>
          </div>

          {/* TAB BUTTONS ROW (Category-Specific) */}
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
            {currentNavItems.map((item, idx) => {
              const active = idx === currentIdx;
              return (
                <button
                  type="button"
                  key={item.id}
                  data-testid={item.testId || `mobile-nav-${item.id}`}
                  onClick={(e) => handleTabClick(e, item, idx)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 2px 8px',
                    cursor: 'pointer',
                    outline: 'none',
                    position: 'relative',
                    color: active ? currentMeta.color : 'var(--text-secondary, #94a3b8)',
                    transition: 'color 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                    whiteSpace: 'nowrap'
                  }}
                  title={`Menu ${currentMeta.label}: ${item.label}`}
                >
                  {/* Inactive Icon Slot */}
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
      </div>

      {/* Physics Keyframe Animations */}
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

        @keyframes fadeInUpToast {
          0% {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </nav>
  );
}
