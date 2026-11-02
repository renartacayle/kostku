import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Check } from 'lucide-react';

/**
 * SlideToConfirmButton - Inspired by Instagram Reel (ui_motion_prompts: Button Part 2 — Option 6 "Slide to Confirm")
 * "Drag the knob to the end: the track fills and the knob turns into a checkmark."
 */
export default function SlideToConfirmButton({
  label = 'Geser untuk Konfirmasi',
  confirmedLabel = 'Terkonfirmasi ✓',
  onConfirm,
  width = 280,
  className = '',
  style = {}
}) {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const knobSize = 42;
  const maxDrag = width - knobSize - 8;

  const handleStart = (clientX) => {
    if (isConfirmed) return;
    setIsDragging(true);
  };

  const handleMove = useCallback((clientX) => {
    if (!isDragging || isConfirmed || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const currentX = clientX - rect.left - knobSize / 2;
    const clampedX = Math.max(0, Math.min(currentX, maxDrag));
    const progress = clampedX / maxDrag;
    setDragProgress(progress);

    if (progress >= 0.9) {
      setIsDragging(false);
      setDragProgress(1);
      setIsConfirmed(true);
      onConfirm?.();
    }
  }, [isDragging, isConfirmed, maxDrag, onConfirm]);

  const handleEnd = useCallback(() => {
    if (isConfirmed) return;
    setIsDragging(false);
    if (dragProgress < 0.9) {
      setDragProgress(0);
    }
  }, [dragProgress, isConfirmed]);

  // Window listeners for mouse & touch drag release
  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => {
      if (e.touches?.[0]) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const currentX = dragProgress * maxDrag;

  return (
    <div
      ref={trackRef}
      className={`slide-to-confirm ${className}`}
      style={{
        position: 'relative',
        width: `${width}px`,
        maxWidth: '100%',
        height: '50px',
        borderRadius: '9999px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255, 255, 255, 0.16)',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: isConfirmed 
          ? '0 8px 25px rgba(16, 185, 129, 0.4)' 
          : '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.3s ease',
        ...style
      }}
    >
      {/* Dynamic Colored Track Fill */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${currentX + knobSize}px`,
          background: isConfirmed
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(90deg, rgba(37, 99, 235, 0.4), rgba(56, 189, 248, 0.6))',
          borderRadius: '9999px',
          transition: isDragging ? 'none' : 'width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none'
        }}
      />

      {/* Centered Track Label */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: '32px',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: isConfirmed ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
          pointerEvents: 'none',
          letterSpacing: '0.02em',
          transition: 'color 0.25s ease'
        }}
      >
        {isConfirmed ? confirmedLabel : label}
      </div>

      {/* Drag Knob */}
      <div
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => e.touches?.[0] && handleStart(e.touches[0].clientX)}
        style={{
          position: 'absolute',
          top: '3px',
          left: '4px',
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          borderRadius: '50%',
          background: isConfirmed 
            ? '#ffffff' 
            : 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
          color: isConfirmed ? '#10b981' : '#ffffff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isConfirmed ? 'default' : 'grab',
          transform: `translateX(${currentX}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 5
        }}
      >
        {isConfirmed ? (
          <Check size={22} strokeWidth={3} />
        ) : (
          <ChevronRight size={22} strokeWidth={2.5} />
        )}
      </div>
    </div>
  );
}
