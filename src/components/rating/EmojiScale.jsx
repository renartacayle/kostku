import React, { useState } from 'react';

/**
 * EmojiScale - UI Motion Prompts Rating #2
 * "Tap a face: it grows and lights up, the others shrink and turn gray."
 */
const EMOJIS = [
  { id: 1, label: 'Kecewa', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', eyes: 'x', mouth: 'down' },
  { id: 2, label: 'Kurang', color: '#f97316', glow: 'rgba(249, 115, 22, 0.6)', eyes: 'dot', mouth: 'frown' },
  { id: 3, label: 'Biasa', color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.6)', eyes: 'dot', mouth: 'line' },
  { id: 4, label: 'Good', color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.75)', eyes: 'dot', mouth: 'smile' },
  { id: 5, label: 'Puas Banget', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.75)', eyes: 'happy', mouth: 'laugh' }
];

export default function EmojiScale({ value = 4, onChange }) {
  const [selectedId, setSelectedId] = useState(value);
  const [hoverId, setHoverId] = useState(null);

  const activeId = hoverId !== null ? hoverId : selectedId;
  const activeEmoji = EMOJIS.find((e) => e.id === activeId) || EMOJIS[3];

  const handleSelect = (id) => {
    setSelectedId(id);
    if (onChange) onChange(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        onMouseLeave={() => setHoverId(null)}
      >
        {EMOJIS.map((item) => {
          const isSelected = item.id === activeId;
          const isMuted = activeId !== null && !isSelected;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              onMouseEnter={() => setHoverId(item.id)}
              aria-label={item.label}
              style={{
                width: isSelected ? '46px' : '32px',
                height: isSelected ? '46px' : '32px',
                borderRadius: '50%',
                background: isSelected 
                  ? item.color 
                  : (isMuted ? 'rgba(100, 116, 139, 0.35)' : 'rgba(148, 163, 184, 0.5)'),
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isSelected ? 'scale(1.15)' : (isMuted ? 'scale(0.85)' : 'scale(1)'),
                boxShadow: isSelected 
                  ? `0 0 20px ${item.glow}, 0 4px 10px rgba(0,0,0,0.3)` 
                  : 'none',
                opacity: isMuted ? 0.45 : 1
              }}
            >
              {/* Minimalist SVG Facial Expression */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                {/* Eyes */}
                {item.eyes === 'happy' ? (
                  <>
                    <path d="M 6 9 Q 8 6 10 9" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 14 9 Q 16 6 18 9" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : item.eyes === 'x' ? (
                  <>
                    <line x1="6" y1="7" x2="10" y2="11" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                    <line x1="10" y1="7" x2="6" y2="11" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                    <line x1="14" y1="7" x2="18" y2="11" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="7" x2="14" y2="11" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <circle cx="8" cy="9" r="1.5" fill="#0f172a" />
                    <circle cx="16" cy="9" r="1.5" fill="#0f172a" />
                  </>
                )}

                {/* Mouth */}
                {item.mouth === 'smile' && (
                  <path d="M 7 14 Q 12 18 17 14" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
                )}
                {item.mouth === 'laugh' && (
                  <path d="M 6 13 Q 12 20 18 13 Z" fill="#0f172a" />
                )}
                {item.mouth === 'line' && (
                  <line x1="8" y1="15" x2="16" y2="15" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                )}
                {item.mouth === 'frown' && (
                  <path d="M 7 16 Q 12 13 17 16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
                )}
                {item.mouth === 'down' && (
                  <path d="M 7 17 Q 12 12 17 17" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                )}
              </svg>
            </button>
          );
        })}
      </div>

      <span style={{
        fontSize: '0.85rem',
        fontWeight: 800,
        color: activeEmoji.color,
        minHeight: '20px',
        transition: 'color 0.2s ease',
        textShadow: `0 0 10px ${activeEmoji.glow}`
      }}>
        {activeEmoji.label}
      </span>
    </div>
  );
}
