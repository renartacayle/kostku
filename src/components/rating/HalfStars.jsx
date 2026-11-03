import React, { useState, useRef } from 'react';
import { Star } from 'lucide-react';

/**
 * HalfStars - UI Motion Prompts Rating #3
 * "Drag across the stars: they fill in half steps and the score follows."
 */
export default function HalfStars({ value = 3.5, onChange }) {
  const [score, setScore] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const calculateScoreFromPointer = (clientX) => {
    if (!containerRef.current) return score;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const totalWidth = rect.width;
    const rawRatio = Math.max(0, Math.min(1, relativeX / totalWidth));
    // 5 stars with 0.5 steps -> 10 discrete steps from 0.5 to 5.0
    const rawScore = rawRatio * 5;
    const stepScore = Math.max(0.5, Math.round(rawScore * 2) / 2);
    return stepScore;
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    const newScore = calculateScoreFromPointer(e.clientX);
    setScore(newScore);
    if (onChange) onChange(newScore);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      const newScore = calculateScoreFromPointer(e.clientX);
      setScore(newScore);
      if (onChange) onChange(newScore);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: '14px', userSelect: 'none' }}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'ew-resize',
          padding: '6px 4px',
          touchAction: 'none'
        }}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          // Determine fill: 1.0 (full), 0.5 (half), or 0 (empty)
          let fillRatio = 0;
          if (score >= starIndex) {
            fillRatio = 1;
          } else if (score >= starIndex - 0.5) {
            fillRatio = 0.5;
          }

          return (
            <div
              key={starIndex}
              style={{
                position: 'relative',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease',
                transform: isDragging ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {/* Background Empty Star */}
              <Star
                size={30}
                color="#64748b"
                strokeWidth={1.8}
                fill="none"
                style={{ position: 'absolute', top: 1, left: 1 }}
              />

              {/* Foreground Filled Star with Clip Path */}
              {fillRatio > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 1,
                    left: 1,
                    width: '30px',
                    height: '30px',
                    overflow: 'hidden',
                    clipPath: fillRatio === 0.5 ? 'inset(0 50% 0 0)' : 'none',
                    filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
                  }}
                >
                  <Star
                    size={30}
                    color="#f59e0b"
                    strokeWidth={1.5}
                    fill="#f59e0b"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Dynamic Score Tag */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
        padding: '4px 10px',
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '8px'
      }}>
        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>
          {score.toFixed(1)}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
          / 5.0
        </span>
      </div>
    </div>
  );
}
