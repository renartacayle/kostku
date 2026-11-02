import React, { useState } from 'react';
import { PartyPopper } from 'lucide-react';

/**
 * ConfettiBurstButton - Inspired by Instagram Reel (ui_motion_prompts: Button Part 2 — Option 3 "Confetti Burst")
 * "A tap bursts confetti out of the button; the pieces flutter and fall."
 */
export default function ConfettiBurstButton({
  label = 'Rayakan Sukses 🎉',
  onClick,
  className = '',
  style = {}
}) {
  const [particles, setParticles] = useState([]);
  const [isBursting, setIsBursting] = useState(false);

  const colors = ['#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#8b5cf6', '#fbbf24'];

  const triggerBurst = (e) => {
    setIsBursting(true);
    onClick?.(e);

    // Generate 26 fluttering confetti particles with varied physics
    const newParticles = Array.from({ length: 26 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 26 + (Math.random() - 0.5) * 0.4;
      const velocity = 60 + Math.random() * 80;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 30; // initial upward bias
      const rot = Math.random() * 360;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 6;
      const shape = Math.random() > 0.4 ? 'rect' : 'circle';

      return {
        id: `confetti-${Date.now()}-${i}`,
        vx,
        vy,
        rot,
        color,
        size,
        shape
      };
    });

    setParticles(newParticles);

    // Reset button scale
    setTimeout(() => {
      setIsBursting(false);
    }, 180);

    // Clear particles after animation
    setTimeout(() => {
      setParticles([]);
    }, 1200);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={triggerBurst}
        className={`confetti-btn ${className}`}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 22px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          color: '#ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.45)',
          fontSize: '0.86rem',
          fontWeight: 700,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          outline: 'none',
          transform: isBursting ? 'scale(0.93)' : 'scale(1)',
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 2,
          ...style
        }}
        onMouseEnter={(e) => {
          if (!isBursting) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        }}
        onMouseLeave={(e) => {
          if (!isBursting) e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }}
      >
        <PartyPopper size={18} />
        <span>{label}</span>
      </button>

      {/* Render Confetti Particles in absolute space radiating from button */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${p.size}px`,
            height: p.shape === 'rect' ? `${p.size * 1.5}px` : `${p.size}px`,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            backgroundColor: p.color,
            pointerEvents: 'none',
            zIndex: 10,
            transform: `translate(-50%, -50%) translate(${p.vx}px, ${p.vy}px) rotate(${p.rot}deg)`,
            opacity: 0,
            transition: 'transform 0.95s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.95s ease'
          }}
          ref={(el) => {
            if (el) {
              // Trigger reflow to animate outwards
              requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = `translate(-50%, -50%) translate(${p.vx * 1.6}px, ${p.vy + 90}px) rotate(${p.rot + 260}deg)`;
                setTimeout(() => {
                  if (el) el.style.opacity = '0';
                }, 450);
              });
            }
          }}
        />
      ))}
    </div>
  );
}
