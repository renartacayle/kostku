import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Sparkles, ExternalLink } from 'lucide-react';

/**
 * GooeyToast - Inspired by Instagram Reel (ui_motion_prompts: Notifications Part 2 — Option 1 "Gooey Drop")
 * "A gooey drop falls from the top, then melts and spreads into a toast."
 *
 * Utilizes SVG gooey filter (feGaussianBlur + feColorMatrix) to achieve viscous,
 * organic liquid separation and droplet melting physics before blooming into a full toast card.
 */

// Singleton event dispatcher for triggering toasts anywhere in KostKu
export const showGooeyToast = ({
  title,
  message,
  type = 'success', // 'success' | 'info' | 'warning' | 'error' | 'promo'
  duration = 4200,
  action = null // { label: string, onClick: () => void }
}) => {
  window.dispatchEvent(
    new CustomEvent('kostku:gooey-toast', {
      detail: {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title,
        message,
        type,
        duration,
        action
      }
    })
  );
};

export default function GooeyToast() {
  const [activeToast, setActiveToast] = useState(null);
  const [animationStage, setAnimationStage] = useState('idle'); // 'dropping' | 'melting' | 'bloomed' | 'exiting'
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const [progress, setProgress] = useState(100);

  // Close with smooth reverse melt / shrink
  const closeToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    setAnimationStage('exiting');
    setTimeout(() => {
      setActiveToast(null);
      setAnimationStage('idle');
      setProgress(100);
    }, 450);
  }, []);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const toastData = e.detail;
      if (!toastData) return;

      // Reset any active toast
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      setActiveToast(toastData);
      setProgress(100);
      setAnimationStage('dropping');

      // Stage 1: Drop & liquid squish (0 - 240ms)
      setTimeout(() => {
        setAnimationStage('melting');
      }, 240);

      // Stage 2: Melt & expand bloom (240 - 520ms)
      setTimeout(() => {
        setAnimationStage('bloomed');
      }, 520);

      // Stage 3: Auto-dismiss countdown
      const startTime = Date.now();
      const totalDuration = toastData.duration || 4200;

      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / totalDuration) * 100);
        setProgress(remaining);
      }, 50);

      timerRef.current = setTimeout(() => {
        closeToast();
      }, totalDuration);
    };

    window.addEventListener('kostku:gooey-toast', handleToastEvent);
    // Backward compatibility with legacy custom events
    window.addEventListener('kostku:toast', handleToastEvent);

    return () => {
      window.removeEventListener('kostku:gooey-toast', handleToastEvent);
      window.removeEventListener('kostku:toast', handleToastEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [closeToast]);

  if (!activeToast && animationStage === 'idle') {
    return null;
  }

  // Visual Theme Configuration based on toast type
  const typeConfigs = {
    success: {
      accentColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.28)',
      borderColor: 'rgba(16, 185, 129, 0.45)',
      gradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)',
      liquidColor: '#10b981',
      icon: <CheckCircle2 size={19} color="#34d399" />
    },
    info: {
      accentColor: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.28)',
      borderColor: 'rgba(56, 189, 248, 0.45)',
      gradient: 'linear-gradient(135deg, rgba(12, 74, 110, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)',
      liquidColor: '#38bdf8',
      icon: <Info size={19} color="#38bdf8" />
    },
    warning: {
      accentColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.28)',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      gradient: 'linear-gradient(135deg, rgba(120, 53, 15, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)',
      liquidColor: '#f59e0b',
      icon: <AlertTriangle size={19} color="#fbbf24" />
    },
    error: {
      accentColor: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.28)',
      borderColor: 'rgba(239, 68, 68, 0.45)',
      gradient: 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)',
      liquidColor: '#ef4444',
      icon: <AlertCircle size={19} color="#f87171" />
    },
    promo: {
      accentColor: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.28)',
      borderColor: 'rgba(168, 85, 247, 0.45)',
      gradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(15, 23, 42, 0.96) 100%)',
      liquidColor: '#c084fc',
      icon: <Sparkles size={19} color="#d8b4fe" />
    }
  };

  const currentConfig = typeConfigs[activeToast?.type] || typeConfigs.success;

  return (
    <>
      {/* SVG Gooey Filter Definition (Zero layout footprint) */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="kostku-gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Fixed Root Notification Portal */}
      <div
        style={{
          position: 'fixed',
          top: 'max(env(safe-area-inset-top, 0px), 18px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100000,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '430px',
          padding: '0 16px'
        }}
      >
        {/* Gooey Liquid Droplet Container */}
        <div
          className="gooey-toast-wrapper"
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Animated Dropping Fluid Blob (visible during dropping & melting phases) */}
          {(animationStage === 'dropping' || animationStage === 'melting') && (
            <div
              style={{
                position: 'absolute',
                top: '-24px',
                width: animationStage === 'dropping' ? '18px' : '36px',
                height: animationStage === 'dropping' ? '38px' : '20px',
                borderRadius: '50%',
                background: currentConfig.liquidColor,
                filter: 'url(#kostku-gooey-filter)',
                boxShadow: `0 0 20px ${currentConfig.liquidColor}`,
                animation: 'gooeyDropPhysics 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              }}
            />
          )}

          {/* Main Bloomed Toast Card */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: currentConfig.gradient,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1.5px solid ${currentConfig.borderColor}`,
              boxShadow: `0 14px 40px rgba(0, 0, 0, 0.45), 0 0 25px ${currentConfig.bgGlow}`,
              borderRadius: animationStage === 'dropping' ? '9999px' : '20px',
              padding: animationStage === 'dropping' 
                ? '0' 
                : animationStage === 'melting'
                  ? '6px 12px'
                  : '12px 16px',
              width: animationStage === 'dropping'
                ? '24px'
                : animationStage === 'melting'
                  ? '160px'
                  : 'clamp(280px, 90vw, 420px)',
              height: animationStage === 'dropping' ? '24px' : 'auto',
              minHeight: animationStage === 'dropping' ? '24px' : '56px',
              transform: animationStage === 'dropping'
                ? 'translateY(-15px) scale(0.6)'
                : animationStage === 'melting'
                  ? 'translateY(4px) scale(1.08, 0.88)'
                  : animationStage === 'exiting'
                    ? 'translateY(-20px) scale(0.7)'
                    : 'translateY(0) scale(1)',
              opacity: animationStage === 'exiting' ? 0 : 1,
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.3s ease, opacity 0.35s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {/* Liquid Shine Sheen */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)'
              }}
            />

            {/* Inner Content (Fades in once blooming begins) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: animationStage === 'bloomed' ? 1 : 0,
                transform: animationStage === 'bloomed' ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 0.22s ease 0.08s, transform 0.22s ease 0.08s'
              }}
            >
              {/* Type Icon Badge with Liquid Droplet Glow */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${currentConfig.bgGlow}`
                }}
              >
                {currentConfig.icon}
              </div>

              {/* Text Description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {activeToast?.title && (
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                      marginBottom: '2px'
                    }}
                  >
                    {activeToast.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'rgba(255, 255, 255, 0.82)',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {activeToast?.message}
                </div>
              </div>

              {/* Optional Custom Action Button */}
              {activeToast?.action && (
                <button
                  type="button"
                  onClick={() => {
                    activeToast.action.onClick?.();
                    closeToast();
                  }}
                  style={{
                    background: currentConfig.liquidColor,
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  {activeToast.action.label}
                  <ExternalLink size={12} />
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={closeToast}
                title="Tutup Notifikasi"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.55)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Bottom Liquid Timeout Progress Bar */}
            {animationStage === 'bloomed' && (
              <div
                style={{
                  width: '100%',
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginTop: '4px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: currentConfig.liquidColor,
                    boxShadow: `0 0 8px ${currentConfig.liquidColor}`,
                    transition: 'width 0.05s linear'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded CSS Physics Animations */}
      <style>{`
        @keyframes gooeyDropPhysics {
          0% {
            transform: translateY(-40px) scale(0.5, 1.8);
            opacity: 0.2;
          }
          60% {
            transform: translateY(18px) scale(0.9, 1.3);
            opacity: 1;
          }
          85% {
            transform: translateY(24px) scale(1.4, 0.7);
          }
          100% {
            transform: translateY(16px) scale(1, 1);
          }
        }
      `}</style>
    </>
  );
}
