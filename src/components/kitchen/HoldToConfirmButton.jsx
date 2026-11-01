import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

/**
 * HoldToConfirmButton - Inspired by "The Kitchen" by JP (dqnamo)
 * Deliberate press-and-hold action with fluid progress fill & haptic feel.
 */
export default function HoldToConfirmButton({
  onConfirm,
  label = 'Tahan untuk Konfirmasi',
  confirmedLabel = 'Berhasil Terkonfirmasi',
  duration = 1500, // ms
  variant = 'emerald', // 'emerald' | 'danger' | 'primary'
  icon = null,
  className = '',
  style = {}
}) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  const colors = {
    emerald: {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46',
      fill: '#059669',
      fillText: '#ffffff'
    },
    danger: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      fill: '#dc2626',
      fillText: '#ffffff'
    },
    primary: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      fill: '#2563eb',
      fillText: '#ffffff'
    }
  }[variant] || colors.emerald;

  const startHold = () => {
    if (isConfirmed) return;
    setIsHolding(true);
    startTimeRef.current = performance.now();

    const loop = (time) => {
      const elapsed = time - startTimeRef.current;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);

      if (p >= 100) {
        setIsConfirmed(true);
        setIsHolding(false);
        if (onConfirm) onConfirm();
      } else {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const endHold = () => {
    if (isConfirmed) return;
    setIsHolding(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    // Smooth reset
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      className={`hold-confirm-container ${className}`}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '220px',
        height: '44px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1.5px solid ${colors.border}`,
        backgroundColor: colors.bg,
        color: colors.text,
        fontWeight: 700,
        fontSize: '0.88rem',
        cursor: isConfirmed ? 'default' : 'pointer',
        userSelect: 'none',
        boxShadow: isHolding ? '0 0 12px rgba(5, 150, 105, 0.25)' : '0 2px 4px rgba(0,0,0,0.04)',
        transition: 'transform 0.1s ease, box-shadow 0.2s ease',
        transform: isHolding ? 'scale(0.98)' : 'scale(1)',
        ...style
      }}
    >
      {/* Background Layer: Base Text */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1,
          padding: '0 16px',
          transition: 'opacity 0.2s ease',
          opacity: isConfirmed ? 0 : 1
        }}
      >
        {icon}
        <span>{label}</span>
      </span>

      {/* Progress Fill Layer (Using clip-path) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.fill,
          color: colors.fillText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '0 16px',
          clipPath: `inset(0 calc(100% - ${progress}%) 0 0)`,
          zIndex: 2,
          pointerEvents: 'none',
          transition: isHolding ? 'none' : 'clip-path 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {icon}
        <span>{label}</span>
      </div>

      {/* Confirmed State Overlay */}
      {isConfirmed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: colors.fill,
            color: colors.fillText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 3,
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <Check size={18} strokeWidth={3} />
          <span>{confirmedLabel}</span>
        </div>
      )}
    </div>
  );
}
