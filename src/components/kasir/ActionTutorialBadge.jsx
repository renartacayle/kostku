import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TUTORIAL_EVENT = 'kostku:action-tutorial-open';

/**
 * Tutorial badge bertanda seru (!) dilingkari abu-abu pudar untuk setiap aksi.
 * Aman dipakai sebagai sibling button atau di dalam card tanpa memicu klik induk.
 */
export default function ActionTutorialBadge({
  title,
  description,
  steps = [],
  size = 'md',
  isLight: isLightProp,
  style = {}
}) {
  const { theme } = useTheme();
  const isLight = isLightProp !== undefined ? isLightProp : theme === 'light';
  const badgeId = useId();
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 290 });

  const computePosition = () => {
    const el = triggerRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const popWidth = Math.min(300, Math.max(230, window.innerWidth - 24));
    const estHeight = 175;
    const preferBelow = rect.bottom + 8 + estHeight <= window.innerHeight - 12;
    const top = preferBelow
      ? rect.bottom + 8
      : Math.max(12, rect.top - estHeight - 8);
    const idealLeft = rect.left + rect.width / 2 - popWidth / 2;
    const left = Math.max(12, Math.min(idealLeft, window.innerWidth - popWidth - 12));
    setCoords({ top, left, width: popWidth });
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) {
      computePosition();
      window.dispatchEvent(new CustomEvent(TUTORIAL_EVENT, { detail: { id: badgeId } }));
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    const onOtherOpen = (ev) => {
      if (ev?.detail?.id !== badgeId) {
        setOpen(false);
      }
    };
    window.addEventListener(TUTORIAL_EVENT, onOtherOpen);
    return () => window.removeEventListener(TUTORIAL_EVENT, onOtherOpen);
  }, [badgeId]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleReposition = () => computePosition();

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open]);

  const dim = size === 'sm' ? 16 : 19;
  const fontSz = size === 'sm' ? '10px' : '11.5px';
  const stepList = Array.isArray(steps) ? steps.filter(Boolean) : [];

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-label={`Tutorial aksi: ${title || 'Panduan'}`}
        aria-expanded={open}
        data-testid="action-tutorial-badge"
        title={`Tutorial: ${title || 'Cara pakai aksi ini'}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggle(e);
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${dim}px`,
          height: `${dim}px`,
          minWidth: `${dim}px`,
          borderRadius: '9999px',
          border: open || hovered
            ? `1.5px solid ${isLight ? 'rgba(100, 116, 139, 0.72)' : 'rgba(148, 163, 184, 0.75)'}`
            : `1.5px solid ${isLight ? 'rgba(148, 163, 184, 0.55)' : 'rgba(148, 163, 184, 0.42)'}`,
          background: open || hovered
            ? (isLight ? 'rgba(148, 163, 184, 0.24)' : 'rgba(148, 163, 184, 0.22)')
            : (isLight ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.1)'),
          color: open || hovered
            ? (isLight ? '#475569' : '#cbd5e1')
            : (isLight ? '#94a3b8' : '#94a3b8'),
          fontSize: fontSz,
          fontWeight: 900,
          lineHeight: 1,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s ease',
          flexShrink: 0,
          ...style
        }}
      >
        !
      </span>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Tutorial ${title || 'Aksi'}`}
          data-testid="action-tutorial-popover"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxWidth: 'calc(100vw - 24px)',
            zIndex: 1000050,
            background: isLight ? '#ffffff' : '#0f172a',
            color: isLight ? '#0f172a' : '#f8fafc',
            border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(148, 163, 184, 0.3)'}`,
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: isLight
              ? '0 16px 38px -10px rgba(15, 23, 42, 0.22)'
              : '0 20px 44px -10px rgba(0, 0, 0, 0.68)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '9999px',
                border: `1.5px solid ${isLight ? 'rgba(100, 116, 139, 0.5)' : 'rgba(148, 163, 184, 0.45)'}`,
                background: isLight ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.14)',
                color: isLight ? '#64748b' : '#94a3b8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 900,
                flexShrink: 0
              }}>
                !
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Panduan Aksi
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc', lineHeight: 1.25 }}>
                  {title}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup tutorial"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <X size={15} />
            </button>
          </div>

          {description && (
            <p style={{
              margin: '0 0 6px',
              fontSize: '0.75rem',
              lineHeight: 1.45,
              color: isLight ? '#475569' : '#cbd5e1'
            }}>
              {description}
            </p>
          )}

          {stepList.length > 0 && (
            <ol style={{
              margin: 0,
              paddingLeft: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.73rem',
              lineHeight: 1.4,
              color: isLight ? '#334155' : '#94a3b8'
            }}>
              {stepList.map((st, idx) => (
                <li key={idx}>{st}</li>
              ))}
            </ol>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
