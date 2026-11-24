import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, Flame, ShoppingBag, DollarSign, Sliders } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * KasirMobileBottomNav - Premium Animated 5-Slot Bottom Navigation for Kasir POS
 * Features:
 * - Fluid Spring Sliding Notch & Floating Bubble ("Bubble Geser")
 * - Dynamic Translation with cubic-bezier elastic curve
 * - Reactive Tab Badges (Pending Orders, POS Cart, Shift Online Dot, Inventory Alerts)
 * - Auto-Sync with in-page tabs and external URL search queries
 */
export default function KasirMobileBottomNav({
  activeTab,
  setActiveTab,
  showMobileMenuHub,
  setShowMobileMenuHub,
  cashierShift = {},
  pendingOrders = [],
  posCart = {},
  inventoryAlerts = [],
  MANAJEMEN_TABS = []
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Total cart quantity
  const cartCount = Object.values(posCart || {}).reduce((s, it) => s + (it.qty || 0), 0);

  // Compute active tab index (0 to 4)
  const getKasirActiveIdx = useCallback(() => {
    if (showMobileMenuHub) return 4;
    if (activeTab === 'dashboard') return 0;
    if (activeTab === 'kds') return 1;
    if (activeTab === 'pos') return 2;
    if (activeTab === 'settings') return 3;
    if (
      activeTab === 'tables' ||
      activeTab === 'hardware' ||
      (Array.isArray(MANAJEMEN_TABS) && MANAJEMEN_TABS.includes(activeTab))
    ) {
      return 4;
    }
    return 2; // Default to POS Kasir
  }, [activeTab, showMobileMenuHub, MANAJEMEN_TABS]);

  const activeIdx = getKasirActiveIdx();
  const [currentIdx, setCurrentIdx] = useState(activeIdx);
  const [isHopping, setIsHopping] = useState(false);
  const hoppingTimerRef = useRef(null);

  // Synchronize index whenever activeTab or showMobileMenuHub changes externally
  useEffect(() => {
    const newIdx = getKasirActiveIdx();
    if (newIdx !== currentIdx) {
      setIsHopping(true);
      setCurrentIdx(newIdx);
      if (hoppingTimerRef.current) clearTimeout(hoppingTimerRef.current);
      hoppingTimerRef.current = setTimeout(() => {
        setIsHopping(false);
      }, 440);
    }
  }, [getKasirActiveIdx, currentIdx]);

  // Tab definitions
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      testId: 'mobile-nav-dashboard',
      icon: <LayoutDashboard size={20} strokeWidth={2.3} />,
      activeIcon: <LayoutDashboard size={21} strokeWidth={2.5} color="#ffffff" />,
      badge: cashierShift?.isOpen ? (
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-3px',
            width: '7px',
            height: '7px',
            borderRadius: '999px',
            background: '#10b981',
            boxShadow: '0 0 6px #10b981'
          }}
          title="Shift Aktif / Kasir Buka"
        />
      ) : null,
      badgeOnBubble: cashierShift?.isOpen ? (
        <span
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            width: '10px',
            height: '10px',
            borderRadius: '999px',
            background: '#10b981',
            border: '2px solid #ffffff',
            boxShadow: '0 0 6px #10b981'
          }}
        />
      ) : null,
      onClick: () => {
        setActiveTab('dashboard');
        setShowMobileMenuHub(false);
      }
    },
    {
      id: 'kds',
      label: 'Dapur',
      testId: 'mobile-nav-dapur',
      icon: <Flame size={20} strokeWidth={2.3} />,
      activeIcon: <Flame size={21} strokeWidth={2.5} color="#ffffff" />,
      badge: pendingOrders.length > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-8px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.6rem',
            fontWeight: 900,
            borderRadius: '999px',
            padding: '1px 4px',
            lineHeight: 1,
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
          }}
        >
          {pendingOrders.length}
        </span>
      ) : null,
      badgeOnBubble: pendingOrders.length > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-5px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.62rem',
            fontWeight: 900,
            borderRadius: '999px',
            padding: '2px 5px',
            lineHeight: 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            border: '1.5px solid #ffffff'
          }}
        >
          {pendingOrders.length}
        </span>
      ) : null,
      onClick: () => {
        setActiveTab('kds');
        setShowMobileMenuHub(false);
      }
    },
    {
      id: 'pos',
      label: 'Kasir',
      testId: 'mobile-nav-kasir',
      icon: <ShoppingBag size={21} strokeWidth={2.3} />,
      activeIcon: <ShoppingBag size={22} strokeWidth={2.5} color="#ffffff" />,
      badge: cartCount > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-6px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.62rem',
            fontWeight: 900,
            borderRadius: '999px',
            padding: '1px 5px',
            lineHeight: 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: '1.5px solid #ffffff'
          }}
        >
          {cartCount}
        </span>
      ) : null,
      badgeOnBubble: cartCount > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-5px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.62rem',
            fontWeight: 900,
            borderRadius: '999px',
            padding: '2px 5px',
            lineHeight: 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            border: '1.5px solid #ffffff'
          }}
        >
          {cartCount}
        </span>
      ) : null,
      onClick: () => {
        setActiveTab('pos');
        setShowMobileMenuHub(false);
      }
    },
    {
      id: 'settings',
      label: 'Keuangan',
      testId: 'mobile-nav-keuangan-btn',
      icon: <DollarSign size={20} strokeWidth={2.3} />,
      activeIcon: <DollarSign size={21} strokeWidth={2.5} color="#ffffff" />,
      badge: null,
      badgeOnBubble: null,
      onClick: () => {
        setActiveTab('settings');
        setShowMobileMenuHub(false);
      }
    },
    {
      id: 'kelola',
      label: 'Kelola',
      testId: 'mobile-nav-kelola-btn',
      icon: <Sliders size={20} strokeWidth={2.3} />,
      activeIcon: <Sliders size={21} strokeWidth={2.5} color="#ffffff" />,
      badge: inventoryAlerts.length > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-4px',
            width: '8px',
            height: '8px',
            borderRadius: '999px',
            background: '#ef4444',
            boxShadow: '0 0 6px #ef4444'
          }}
        />
      ) : null,
      badgeOnBubble: inventoryAlerts.length > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: '-1px',
            right: '-1px',
            width: '10px',
            height: '10px',
            borderRadius: '999px',
            background: '#ef4444',
            border: '2px solid #ffffff',
            boxShadow: '0 0 6px #ef4444'
          }}
        />
      ) : null,
      onClick: () => {
        setShowMobileMenuHub(prev => !prev);
      }
    }
  ];

  const handleTabClick = (e, item, idx) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger instant hopping animation
    if (hoppingTimerRef.current) clearTimeout(hoppingTimerRef.current);
    setIsHopping(true);
    setCurrentIdx(idx);

    hoppingTimerRef.current = setTimeout(() => {
      setIsHopping(false);
    }, 440);

    item.onClick();
  };

  const activeItem = navItems[currentIdx] || navItems[2];

  return (
    <nav
      className="mobile-only"
      aria-label="Navigasi Kasir & Operasional Mobile"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${isLight ? 'rgba(226, 232, 240, 0.9)' : 'rgba(51, 65, 85, 0.7)'}`,
        boxShadow: isLight
          ? '0 -4px 24px rgba(15, 23, 42, 0.08)'
          : '0 -4px 24px rgba(0, 0, 0, 0.35)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
        paddingTop: '2px',
        overflow: 'visible'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
          position: 'relative',
          height: '58px',
          overflow: 'visible'
        }}
      >
        {/* ── SLIDING NOTCH & FLOATING BUBBLE UNIT ("BUBBLE GESER") ── */}
        <div
          style={{
            position: 'absolute',
            top: '-18px',
            left: 0,
            width: '20%',
            height: '76px',
            transform: `translateX(${currentIdx * 100}%)`,
            transition: 'transform 0.44s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Curved Notch Cutout Shape (Flush at top border) */}
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '62px',
              height: '24px',
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
              {/* Sunken crater fill */}
              <path
                d="M 0,0 C 12,0 16,24 37,24 C 58,24 62,0 74,0 Z"
                fill={isLight ? '#f8fafc' : '#0a0f1d'}
              />
              {/* Notch rim border */}
              <path
                d="M 0,1 C 12,1 16,24 37,24 C 58,24 62,1 74,1"
                fill="none"
                stroke={isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.16)'}
                strokeWidth="1.5"
              />
              {/* Concentric Glow Contour (Kasir Blue Accent) */}
              <path
                d="M 14,2 C 21,2 25,20 37,20 C 49,20 53,2 60,2"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.2"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* THE FLOATING BUBBLE (Hopper with Blue Gradient & Glow) */}
          <div
            style={{
              position: 'absolute',
              top: '0px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 25
            }}
          >
            <div
              key={`kasir-bubble-${currentIdx}`}
              className={isHopping ? 'kasir-bubble-hopping' : 'kasir-bubble-idle'}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: isLight ? '3.5px solid #ffffff' : '3.5px solid #0f172a',
                boxShadow: isLight
                  ? '0 8px 22px rgba(37, 99, 235, 0.5), 0 0 12px rgba(37, 99, 235, 0.3)'
                  : '0 8px 22px rgba(37, 99, 235, 0.6), 0 0 14px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                position: 'relative'
              }}
            >
              {/* Active Icon with pop-in rotation */}
              <div
                key={`kasir-active-icon-${currentIdx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'popKasirIconIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              >
                {activeItem.activeIcon}
              </div>

              {/* Badge attached directly to the floating bubble */}
              {activeItem.badgeOnBubble}
            </div>
          </div>
        </div>

        {/* ── 5 INTERACTIVE TAB BUTTONS ROW ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            zIndex: 5
          }}
        >
          {navItems.map((item, idx) => {
            const active = idx === currentIdx;
            return (
              <button
                type="button"
                key={item.id}
                data-testid={item.testId}
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
                  padding: '0 2px 7px',
                  cursor: 'pointer',
                  outline: 'none',
                  position: 'relative',
                  color: active ? '#2563eb' : (isLight ? '#64748b' : '#94a3b8'),
                  transition: 'color 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap'
                }}
                title={`Menu Kasir: ${item.label}`}
              >
                {/* Inactive Icon Slot with Badge */}
                <div
                  style={{
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: active ? 0 : 0.85,
                    transform: active ? 'translateY(-10px) scale(0.35)' : 'translateY(0) scale(1)',
                    transition: 'opacity 0.24s ease, transform 0.24s ease',
                    position: 'relative'
                  }}
                >
                  {item.icon}
                  {!active && item.badge}
                </div>

                {/* Tab Label Text */}
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: active ? 800 : 600,
                    color: active
                      ? (isLight ? '#1d4ed8' : '#38bdf8')
                      : (isLight ? '#64748b' : '#94a3b8'),
                    letterSpacing: '-0.01em',
                    marginTop: '3px',
                    transform: active ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.24s ease'
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Physics Keyframe Animations */}
      <style>{`
        .kasir-bubble-hopping {
          animation: kasirBallHopLeap 0.44s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .kasir-bubble-idle {
          transform: translateY(0) scale(1);
        }

        @keyframes kasirBallHopLeap {
          0% {
            transform: translateY(0) scale(1, 1);
          }
          35% {
            transform: translateY(-22px) scale(0.88, 1.22);
          }
          65% {
            transform: translateY(-12px) scale(1.08, 0.94);
          }
          85% {
            transform: translateY(2px) scale(1.12, 0.88);
          }
          100% {
            transform: translateY(0) scale(1, 1);
          }
        }

        @keyframes popKasirIconIn {
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
