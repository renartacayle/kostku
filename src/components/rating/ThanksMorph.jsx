import React, { useState } from 'react';
import { Star, Check, RotateCcw } from 'lucide-react';

/**
 * ThanksMorph - UI Motion Prompts Rating #6
 * "Tap the 5th star: they fill, gather into one and morph into 'Thanks!'"
 */
export default function ThanksMorph({ onComplete }) {
  const [isMorphed, setIsMorphed] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [selectedStar, setSelectedStar] = useState(0);

  const handleStarClick = (starIndex) => {
    setSelectedStar(starIndex);

    // If 4th or 5th star tapped, trigger morph sequence
    setIsCollapsing(true);
    setTimeout(() => {
      setIsMorphed(true);
      setIsCollapsing(false);
      if (onComplete) onComplete(starIndex);
    }, 450);
  };

  const handleReset = () => {
    setIsMorphed(false);
    setSelectedStar(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '64px', justifyContent: 'center' }}>
      {!isMorphed ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isCollapsing ? 'scale(0.3) rotate(12deg)' : 'scale(1)',
          opacity: isCollapsing ? 0.2 : 1
        }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= selectedStar;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isFilled ? 'scale(1.2)' : 'scale(1)'
                }}
              >
                <Star
                  size={32}
                  fill={isFilled ? '#f59e0b' : 'none'}
                  color={isFilled ? '#f59e0b' : '#64748b'}
                  strokeWidth={1.8}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'thanksPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}>
          {/* Morphed Thanks Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '8px 22px',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.55), 0 4px 12px rgba(0, 0, 0, 0.25)',
            letterSpacing: '0.02em'
          }}>
            <Check size={18} strokeWidth={3} />
            <span>Thanks! 🎉</span>
          </div>

          {/* Reset Action */}
          <button
            type="button"
            onClick={handleReset}
            title="Beri rating ulang"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes thanksPop {
          0% { transform: scale(0.4); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
