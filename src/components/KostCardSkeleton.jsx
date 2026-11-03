import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * KostCardSkeleton
 * Polished, high-performance shimmer skeleton loader for KostKu marketplace & dashboard.
 * Uses exact .kost-responsive-grid and 4:3 aspect ratio to guarantee Zero Cumulative Layout Shift (CLS = 0).
 */
export function KostCardSkeleton({ count = 8, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i);
  const { isLight } = useTheme();

  return (
    <div 
      className={`kost-responsive-grid ${className}`}
      style={{
        width: '100%',
        margin: '1.25rem 0',
        boxSizing: 'border-box'
      }}
      aria-busy="true"
      aria-label="Memuat daftar hunian kost..."
    >
      <style>{`
        @keyframes kostShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .kost-skeleton-shimmer {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0.04) 25%, 
            rgba(255, 255, 255, 0.12) 50%, 
            rgba(255, 255, 255, 0.04) 75%
          );
          background-size: 200% 100%;
          animation: kostShimmer 1.6s infinite ease-in-out;
        }
        .light .kost-skeleton-shimmer, [data-theme="light"] .kost-skeleton-shimmer {
          background: linear-gradient(90deg, 
            rgba(15, 23, 42, 0.04) 25%, 
            rgba(15, 23, 42, 0.09) 50%, 
            rgba(15, 23, 42, 0.04) 75%
          );
          background-size: 200% 100%;
        }
      `}</style>
      
      {items.map((key) => (
        <div
          key={key}
          style={{
            background: isLight ? '#ffffff' : 'var(--bg-card, rgba(30, 41, 59, 0.7))',
            borderRadius: '20px',
            border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isLight ? '0 2px 10px rgba(15, 23, 42, 0.04)' : '0 4px 20px rgba(0, 0, 0, 0.15)',
            boxSizing: 'border-box',
            width: '100%',
            minWidth: 0
          }}
        >
          {/* Hero Image Skeleton (Strict 4:3 Aspect Ratio matching landing page) */}
          <div 
            className="kost-skeleton-shimmer"
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              position: 'relative'
            }}
          >
            {/* Top Badge Skeleton */}
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div 
                className="kost-skeleton-shimmer"
                style={{ width: 58, height: 20, borderRadius: 6 }} 
              />
              <div 
                className="kost-skeleton-shimmer"
                style={{ width: 68, height: 20, borderRadius: 6 }} 
              />
            </div>
          </div>

          {/* Card Body Skeleton */}
          <div style={{ 
            padding: '1.15rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            flex: 1,
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}>
            <div>
              {/* Title & Rating */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <div className="kost-skeleton-shimmer" style={{ width: '75%', height: 18, borderRadius: 6 }} />
                <div className="kost-skeleton-shimmer" style={{ width: 32, height: 16, borderRadius: 6 }} />
              </div>

              {/* City / Location Line */}
              <div className="kost-skeleton-shimmer" style={{ width: '55%', height: 13, borderRadius: 6, marginBottom: '12px' }} />

              {/* Essential Facilities Chips (3 badges matching KostCard) */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <div className="kost-skeleton-shimmer" style={{ width: 44, height: 18, borderRadius: 6 }} />
                <div className="kost-skeleton-shimmer" style={{ width: 64, height: 18, borderRadius: 6 }} />
                <div className="kost-skeleton-shimmer" style={{ width: 50, height: 18, borderRadius: 6 }} />
              </div>
            </div>

            {/* Price & CTA Divider */}
            <div style={{ 
              marginTop: 'auto', 
              paddingTop: '10px', 
              borderTop: isLight ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div className="kost-skeleton-shimmer" style={{ width: 40, height: 10, borderRadius: 4, marginBottom: 4 }} />
                <div className="kost-skeleton-shimmer" style={{ width: 85, height: 18, borderRadius: 6 }} />
              </div>
              <div className="kost-skeleton-shimmer" style={{ width: 75, height: 28, borderRadius: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KostCardSkeleton;
