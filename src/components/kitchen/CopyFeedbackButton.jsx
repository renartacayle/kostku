import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * CopyFeedbackButton - Inspired by Instagram Reel (ui_motion_prompts: Button Part 2 — Option 4 "Copy Feedback")
 * "The copy icon morphs into a checkmark and a 'Copied!' tooltip pops up."
 */
export default function CopyFeedbackButton({
  textToCopy = '081228263200',
  label = 'Salin No. Rekening',
  copiedTooltip = 'Tersalin! ✓',
  className = '',
  style = {}
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
    } catch {
      // Fallback
    }

    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2400);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Popping Tooltip Speech Bubble */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: isCopied
            ? 'translateX(-50%) translateY(0) scale(1)'
            : 'translateX(-50%) translateY(6px) scale(0.6)',
          opacity: isCopied ? 1 : 0,
          pointerEvents: 'none',
          transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
          background: '#0f172a',
          color: '#ffffff',
          fontSize: '0.74rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
          whiteSpace: 'nowrap',
          zIndex: 20
        }}
      >
        {copiedTooltip}
        {/* Tooltip Downward Arrow Pointer */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '8px',
            height: '8px',
            background: '#0f172a',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        />
      </div>

      {/* Main Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`copy-feedback-btn ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '12px',
          background: isCopied
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(255, 255, 255, 0.08)',
          color: isCopied ? '#10b981' : 'var(--text-primary, #ffffff)',
          border: isCopied
            ? '1.5px solid rgba(16, 185, 129, 0.45)'
            : '1.5px solid var(--border-color, rgba(255, 255, 255, 0.14))',
          fontSize: '0.84rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.22s ease',
          ...style
        }}
        onMouseEnter={(e) => {
          if (!isCopied) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
        }}
        onMouseLeave={(e) => {
          if (!isCopied) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        {/* Morphing Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isCopied ? 'scale(1.1) rotate(0deg)' : 'scale(1)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {isCopied ? (
            <Check size={16} strokeWidth={3} color="#10b981" />
          ) : (
            <Copy size={16} />
          )}
        </div>

        <span>{label}</span>
      </button>
    </div>
  );
}
