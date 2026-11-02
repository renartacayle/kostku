import React, { useState } from 'react';
import { Send, Check } from 'lucide-react';

/**
 * PaperPlaneButton - Inspired by Instagram Reel (ui_motion_prompts: Button Part 2 — Option 2 "Paper Plane")
 * "The paper plane flies off with a trail and the label flips to 'Sent!'"
 */
export default function PaperPlaneButton({
  label = 'Kirim Pesan',
  sentLabel = 'Terkirim!',
  onSend,
  className = '',
  style = {}
}) {
  const [isSent, setIsSent] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  const handleClick = (e) => {
    if (isFlying || isSent) return;

    setIsFlying(true);
    onSend?.(e);

    // After plane launch trajectory, flip label
    setTimeout(() => {
      setIsSent(true);
      setIsFlying(false);
    }, 450);

    // Auto reset after 3s
    setTimeout(() => {
      setIsSent(false);
    }, 3200);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isFlying}
      className={`paper-plane-btn ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '12px 24px',
        minWidth: '154px',
        height: '46px',
        borderRadius: '9999px',
        background: isSent
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: '#ffffff',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: isSent
          ? '0 8px 24px rgba(16, 185, 129, 0.45)'
          : '0 8px 24px rgba(37, 99, 235, 0.4)',
        fontWeight: 700,
        fontSize: '0.88rem',
        letterSpacing: '0.01em',
        cursor: isFlying ? 'default' : 'pointer',
        overflow: 'hidden',
        transition: 'background 0.35s ease, box-shadow 0.35s ease, transform 0.15s ease',
        outline: 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!isFlying) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        if (!isFlying) e.currentTarget.style.transform = 'translateY(0) scale(1)';
      }}
    >
      {/* Dashed Flight Trail when launching */}
      {isFlying && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <path
            d="M 28 23 Q 65 8 130 14"
            fill="none"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeDashoffset="0"
            className="trail-dash"
          />
        </svg>
      )}

      {/* Paper Plane Icon / Flying Plane */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isFlying
            ? 'translate(85px, -35px) rotate(25deg) scale(0.6)'
            : isSent
              ? 'scale(0)'
              : 'translate(0, 0) rotate(0deg) scale(1)',
          opacity: isFlying ? 0 : isSent ? 0 : 1,
          transition: isFlying
            ? 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.45s ease'
            : 'transform 0.25s ease, opacity 0.2s ease'
        }}
      >
        <Send size={18} />
      </div>

      {/* Check Icon when Sent */}
      {isSent && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'popCheckIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <Check size={19} strokeWidth={3} />
        </div>
      )}

      {/* Flipping 3D Text Label */}
      <div
        style={{
          perspective: '400px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transform: isSent ? 'rotateX(0deg)' : isFlying ? 'rotateX(-90deg)' : 'rotateX(0deg)',
            opacity: isFlying ? 0 : 1,
            transition: 'transform 0.32s ease, opacity 0.25s ease'
          }}
        >
          {isSent ? sentLabel : label}
        </span>
      </div>

      {/* Embedded Flight Trail CSS */}
      <style>{`
        @keyframes popCheckIn {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </button>
  );
}
