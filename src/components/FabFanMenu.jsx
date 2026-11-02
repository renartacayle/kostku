import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  MessageCircle, 
  Search, 
  CreditCard, 
  AlertCircle, 
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import CustomerServiceModal from './CustomerServiceModal';
import { showGooeyToast } from './GooeyToast';

/**
 * FabFanMenu - Inspired by Instagram Reel (ui_motion_prompts: Menu Part 1 — Option 3 "FAB Fan")
 * "The + turns into x as five buttons shoot up and fan out on an arc."
 *
 * Arc distribution: 5 buttons fanning out on a 90-degree radial quadrant arc (90° up to 180° left)
 * with staggered spring physics (cubic-bezier overshoot) and interactive tooltips.
 */
export default function FabFanMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCsModalOpen, setIsCsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close on ESC key or route navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Hide on checkout & direct payment to avoid covering payment details
  if (location.pathname === '/checkout' || location.pathname === '/bayar') {
    return null;
  }

  // 5 Arc action items with math coordinates
  const radius = 108; // pixels distance from FAB center
  const arcItems = [
    {
      id: 'cs',
      label: 'Bantuan CS',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      icon: <MessageCircle size={18} color="#ffffff" />,
      angle: 90, // Straight Up
      onClick: () => {
        setIsOpen(false);
        setIsCsModalOpen(true);
      }
    },
    {
      id: 'search',
      label: 'Cari Kost',
      color: '#38bdf8',
      gradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
      icon: <Search size={18} color="#ffffff" />,
      angle: 112.5,
      onClick: () => {
        setIsOpen(false);
        navigate('/search');
      }
    },
    {
      id: 'pay',
      label: 'Bayar Sewa',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      icon: <CreditCard size={18} color="#ffffff" />,
      angle: 135, // Diagonal Up-Left
      onClick: () => {
        setIsOpen(false);
        navigate('/checkout');
      }
    },
    {
      id: 'komplain',
      label: 'Lapor Tiket',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      icon: <AlertCircle size={18} color="#ffffff" />,
      angle: 157.5,
      onClick: () => {
        setIsOpen(false);
        navigate('/komplain');
      }
    },
    {
      id: 'gooey',
      label: 'Gooey Drop',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      icon: <Sparkles size={18} color="#ffffff" />,
      angle: 180, // Straight Left
      onClick: () => {
        setIsOpen(false);
        showGooeyToast({
          type: 'success',
          title: 'Gooey Drop Aktif! 💧',
          message: 'Notifikasi meleleh dan mekar dengan fisika viskositas dinamis.',
          duration: 4000
        });
      }
    }
  ];

  return (
    <>
      {/* Dimmed Blurred Backdrop when Fan is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 10, 20, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9980,
            animation: 'fadeInOverlay 0.2s ease forwards'
          }}
        />
      )}

      {/* FAB Fan Container fixed at bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(5.2rem + env(safe-area-inset-bottom, 0px))',
          right: 'clamp(0.85rem, 3vw, 1.85rem)',
          zIndex: 9990,
          pointerEvents: 'none'
        }}
      >
        <div style={{ position: 'relative', width: '56px', height: '56px', pointerEvents: 'auto' }}>
          
          {/* Arc Action Buttons (Shoot up and fan out) */}
          {arcItems.map((item, index) => {
            // Convert polar to cartesian coordinates:
            // Angle in radians: angle * PI / 180
            const rad = (item.angle * Math.PI) / 180;
            const x = Math.round(radius * Math.cos(rad));
            const y = Math.round(-radius * Math.sin(rad)); // inverted because Y goes down in CSS

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  width: '44px',
                  height: '44px',
                  transform: isOpen
                    ? `translate(${x}px, ${y}px) scale(1)`
                    : 'translate(0px, 0px) scale(0)',
                  opacity: isOpen ? 1 : 0,
                  transition: `transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 38}ms, opacity 0.25s ease ${index * 38}ms`,
                  zIndex: 9991,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Floating Tooltip Label */}
                <div
                  style={{
                    position: 'absolute',
                    right: '52px',
                    whiteSpace: 'nowrap',
                    background: 'rgba(15, 23, 42, 0.92)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    pointerEvents: 'none',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateX(0)' : 'translateX(10px)',
                    transition: `opacity 0.2s ease ${index * 38 + 120}ms, transform 0.25s ease ${index * 38 + 120}ms`
                  }}
                >
                  {item.label}
                </div>

                {/* Circular Action Button */}
                <button
                  type="button"
                  onClick={item.onClick}
                  title={item.label}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: item.gradient,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: `0 8px 20px rgba(0, 0, 0, 0.35), 0 0 14px ${item.color}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.45), 0 0 20px ${item.color}aa`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.35), 0 0 14px ${item.color}55`;
                  }}
                >
                  {item.icon}
                </button>
              </div>
            );
          })}

          {/* Central Trigger FAB Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Tutup Menu' : 'Buka Menu Cepat KostKu'}
            style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isOpen
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '2.5px solid rgba(255, 255, 255, 0.35)',
              boxShadow: isOpen
                ? '0 10px 30px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)'
                : '0 10px 30px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 9995,
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* The + turns into x smoothly with 135deg spring rotation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <Plus size={26} strokeWidth={2.5} />
            </div>

            {/* Unread / Active indicator dot when closed */}
            {!isOpen && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
                  boxShadow: '0 0 8px #4ade80',
                  border: '2px solid #059669'
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Customer Service & FAQ Modal */}
      <CustomerServiceModal isOpen={isCsModalOpen} onClose={() => setIsCsModalOpen(false)} />

      {/* Embedded Animation */}
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
