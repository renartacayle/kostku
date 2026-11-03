import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarCascade - UI Motion Prompts Rating #1
 * "Tap the 4th star: the stars fill one by one with a pop and a gold glow."
 */
export default function StarCascade({ value = 4, onChange, maxStars = 5 }) {
  const [rating, setRating] = useState(value);
  const [hoverRating, setHoverRating] = useState(0);
  const [animatingStars, setAnimatingStars] = useState([]);

  const labels = ['Buruk', 'Kurang', 'Cukup', 'Great!', 'Luar Biasa!'];

  const handleSelect = (starIndex) => {
    setRating(starIndex);
    // Cascade fill animation: trigger pop sequentially for stars 1 to starIndex
    const active = [];
    for (let i = 1; i <= starIndex; i++) {
      setTimeout(() => {
        setAnimatingStars((prev) => [...new Set([...prev, i])]);
      }, (i - 1) * 60);
    }
    // Clean up animation flags after sequence finishes
    setTimeout(() => {
      setAnimatingStars([]);
    }, starIndex * 60 + 350);

    if (onChange) onChange(starIndex);
  };

  const activeRating = hoverRating || rating;
  const currentLabel = activeRating > 0 ? labels[activeRating - 1] : 'Beri Nilai';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;
          const isPop = animatingStars.includes(star);

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleSelect(star)}
              onMouseEnter={() => setHoverRating(star)}
              aria-label={`Beri bintang ${star}`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                outline: 'none',
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease',
                transform: isPop 
                  ? 'scale(1.35) rotate(-6deg)' 
                  : (isFilled ? 'scale(1.08)' : 'scale(1)'),
                filter: isFilled 
                  ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.75))' 
                  : 'none'
              }}
            >
              <Star
                size={34}
                fill={isFilled ? '#f59e0b' : 'none'}
                color={isFilled ? '#f59e0b' : '#64748b'}
                strokeWidth={isFilled ? 1.5 : 1.8}
                style={{
                  transition: 'fill 0.2s ease, color 0.2s ease'
                }}
              />
            </button>
          );
        })}
      </div>

      <span style={{
        fontSize: '0.85rem',
        fontWeight: 800,
        color: '#f59e0b',
        letterSpacing: '0.02em',
        minHeight: '20px',
        transition: 'all 0.2s ease',
        textShadow: '0 0 12px rgba(245, 158, 11, 0.4)'
      }}>
        {currentLabel}
      </span>
    </div>
  );
}
