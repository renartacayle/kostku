import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomDropdown
 * Pengganti native <select> dengan arsitektur UI premium glassmorphism.
 * - Desain terintegrasi dengan tema Dark Slate & Electric Blue
 * - Popover menu melayang dengan animasi halus
 * - Indikator pilihan aktif + dukungan ikon & badge
 * - Penutupan otomatis saat klik di luar area (click outside)
 */
export default function CustomDropdown({
  label,
  icon: IconComponent,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih Opsi',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        width: '100%',
        minWidth: 0,
        ...style 
      }}
    >
      {/* ── Trigger Box ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          background: isOpen ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.75)',
          borderRadius: '16px',
          border: isOpen ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.25), 0 8px 20px rgba(0,0,0,0.4)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
          boxSizing: 'border-box',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.85)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
          }
        }}
      >
        {/* Leading Icon */}
        {IconComponent && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60A5FA',
            flexShrink: 0
          }}>
            {IconComponent}
          </div>
        )}

        {/* Text Container */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {label && (
            <span style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '2px',
              userSelect: 'none'
            }}>
              {label}
            </span>
          )}
          <div style={{
            color: '#FFFFFF',
            fontSize: '0.9rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {selectedOption?.icon && <span>{selectedOption.icon}</span>}
            <span>{selectedOption?.label || placeholder}</span>
          </div>
        </div>

        {/* Trailing Chevron Icon with animated rotation */}
        <div style={{
          color: isOpen ? '#60A5FA' : '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0
        }}>
          <ChevronDown size={17} />
        </div>
      </button>

      {/* ── Floating Popover Menu ── */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: '#1E293B',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(37, 99, 235, 0.2)',
          zIndex: 999,
          padding: '6px',
          overflow: 'hidden',
          animation: 'dropdownFadeIn 0.15s cubic-bezier(0.2, 0, 0, 1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
          <div style={{
            maxHeight: '260px',
            overflowY: 'auto',
            paddingRight: '2px'
          }}>
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: isSelected ? '#60A5FA' : '#E2E8F0',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease',
                    marginBottom: '2px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#E2E8F0';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {opt.icon && <span style={{ fontSize: '1rem' }}>{opt.icon}</span>}
                    <div>
                      <span style={{ display: 'block', lineHeight: 1.2 }}>{opt.label}</span>
                      {opt.subtitle && (
                        <span style={{
                          display: 'block',
                          fontSize: '0.72rem',
                          color: '#94A3B8',
                          marginTop: '2px',
                          fontWeight: 500
                        }}>
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Badge or Checkmark */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {opt.badge && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: opt.badgeBg || 'rgba(255, 255, 255, 0.1)',
                        color: opt.badgeColor || '#FFFFFF'
                      }}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check size={16} color="#60A5FA" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded Keyframe Animation Style */}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
