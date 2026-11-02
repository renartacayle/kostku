import React from 'react';

/**
 * KostCardSkeleton
 * Polished, high-performance shimmer skeleton loader for KostKu marketplace & dashboard.
 * Prevents Layout Shift (CLS = 0) and delivers instant perceived performance.
 */
export function KostCardSkeleton({ count = 6, viewMode = 'grid' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div 
      className={viewMode === 'grid' ? 'kost-grid' : 'kost-list'}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%',
        margin: '1.5rem 0'
      }}
      aria-busy="true"
      aria-label="Memuat daftar kost..."
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
          animation: kostShimmer 1.8s infinite ease-in-out;
        }
        .light .kost-skeleton-shimmer, [data-theme="light"] .kost-skeleton-shimmer {
          background: linear-gradient(90deg, 
            rgba(0, 0, 0, 0.04) 25%, 
            rgba(0, 0, 0, 0.09) 50%, 
            rgba(0, 0, 0, 0.04) 75%
          );
          background-size: 200% 100%;
        }
      `}</style>
      
      {items.map((key) => (
        <div
          key={key}
          style={{
            background: 'var(--card-bg, rgba(30, 41, 59, 0.7))',
            borderRadius: '20px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Hero Image Skeleton */}
          <div 
            className="kost-skeleton-shimmer"
            style={{
              width: '100%',
              aspectRatio: '16/10',
              position: 'relative'
            }}
          >
            {/* Top Badge Skeleton */}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
              <div 
                className="kost-skeleton-shimmer"
                style={{ width: 64, height: 22, borderRadius: 999 }} 
              />
              <div 
                className="kost-skeleton-shimmer"
                style={{ width: 50, height: 22, borderRadius: 999 }} 
              />
            </div>
          </div>

          {/* Card Body Skeleton */}
          <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {/* City & Rating Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="kost-skeleton-shimmer" style={{ width: '40%', height: 14, borderRadius: 6 }} />
              <div className="kost-skeleton-shimmer" style={{ width: '20%', height: 14, borderRadius: 6 }} />
            </div>

            {/* Title Line */}
            <div className="kost-skeleton-shimmer" style={{ width: '85%', height: 20, borderRadius: 6 }} />
            <div className="kost-skeleton-shimmer" style={{ width: '60%', height: 14, borderRadius: 6 }} />

            {/* Facilities Chips */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <div className="kost-skeleton-shimmer" style={{ width: 56, height: 20, borderRadius: 6 }} />
              <div className="kost-skeleton-shimmer" style={{ width: 68, height: 20, borderRadius: 6 }} />
              <div className="kost-skeleton-shimmer" style={{ width: 60, height: 20, borderRadius: 6 }} />
            </div>

            {/* Price & CTA Divider */}
            <div style={{ 
              marginTop: 'auto', 
              paddingTop: '14px', 
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div className="kost-skeleton-shimmer" style={{ width: 45, height: 11, borderRadius: 4, marginBottom: 4 }} />
                <div className="kost-skeleton-shimmer" style={{ width: 100, height: 20, borderRadius: 6 }} />
              </div>
              <div className="kost-skeleton-shimmer" style={{ width: 85, height: 34, borderRadius: 12 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KostCardSkeleton;
