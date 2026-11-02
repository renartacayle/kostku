import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * ShineSweepButton - Inspired by Instagram Reel (ui_motion_prompts: Button Part 2 — Option 5 "Shine Sweep")
 * "A diagonal shine sweeps across the button and sparkles twinkle."
 */
export default function ShineSweepButton({
  label = 'Upgrade KostKu Pro',
  onClick,
  className = '',
  style = {}
}) {
  const [isSweeping, setIsSweeping] = useState(false);

  const handleTrigger = (e) => {
    setIsSweeping(true);
    onClick?.(e);
    setTimeout(() => {
      setIsSweeping(false);
    }, 750);
  };

  return (
    <button
      type="button"
      onClick={handleTrigger}
      className={`shine-sweep-btn ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        borderRadius: '9999px',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#ffffff',
        border: '1.5px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
        fontSize: '0.86rem',
        fontWeight: 800,
        letterSpacing: '0.01em',
        cursor: 'pointer',
        overflow: 'hidden',
        outline: 'none',
        transform: 'translateY(0)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        setIsSweeping(true);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        setIsSweeping(false);
      }}
    >
      {/* Sweeping Diagonal Light Beam */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '60px',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent)',
          transform: isSweeping 
            ? 'translateX(280px) skewX(-25deg)' 
            : 'translateX(-100px) skewX(-25deg)',
          transition: isSweeping ? 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* Sparkle 1 Twinkle */}
      <span
        style={{
          position: 'absolute',
          top: '6px',
          right: '16px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 8px #ffffff',
          opacity: isSweeping ? 1 : 0,
          transform: isSweeping ? 'scale(1.4) rotate(45deg)' : 'scale(0)',
          transition: 'all 0.3s ease 0.25s',
          pointerEvents: 'none'
        }}
      />

      {/* Sparkle 2 Twinkle */}
      <span
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '18px',
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 6px #ffffff',
          opacity: isSweeping ? 1 : 0,
          transform: isSweeping ? 'scale(1.3) rotate(45deg)' : 'scale(0)',
          transition: 'all 0.3s ease 0.4s',
          pointerEvents: 'none'
        }}
      />

      <Sparkles size={17} />
      <span style={{ position: 'relative', zIndex: 4 }}>{label}</span>
    </button>
  );
}
