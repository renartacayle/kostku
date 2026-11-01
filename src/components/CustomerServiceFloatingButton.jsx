import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, HelpCircle } from 'lucide-react';
import CustomerServiceModal from './CustomerServiceModal';

export default function CustomerServiceFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('kostku:open-help', handleOpenEvent);
    return () => window.removeEventListener('kostku:open-help', handleOpenEvent);
  }, []);

  // Hide on checkout & payment to prevent covering forms and QRIS
  if (location.pathname === '/checkout' || location.pathname === '/bayar') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div 
        style={{
          position: 'fixed',
          bottom: 'calc(5.2rem + env(safe-area-inset-bottom, 0px))',
          right: 'clamp(0.75rem, 2.5vw, 1.75rem)',
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.4rem'
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Buka Pusat Bantuan & CS WhatsApp (081228263200)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.1rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45), 0 0 15px rgba(16, 185, 129, 0.3)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.82rem',
            letterSpacing: '0.01em',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageCircle size={19} />
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              boxShadow: '0 0 6px #4ade80'
            }}></span>
          </div>
          <span className="desktop-only" style={{ marginLeft: '4px' }}>Bantuan & CS</span>
        </button>
      </div>

      {/* Full Interactive Customer Service & FAQ Modal */}
      <CustomerServiceModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
