import React from 'react';
import { Droplets, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import PlnTokenPanel from './PlnTokenPanel';
import PdamBillPanel from './PdamBillPanel';

const UTILITY_TAB_CONFIG = [
  {
    id: 'pln',
    title: 'Token PLN',
    subtitle: 'Listrik Prabayar 24 Jam',
    badge: 'Instan',
    Icon: Zap,
    borderColor: '#f59e0b',
    badgeBg: '#f59e0b',
    shadow: '0 8px 22px rgba(245, 158, 11, 0.16)',
    lightBg: '#fffbeb',
    darkBg: 'rgba(245, 158, 11, 0.16)',
    iconActiveBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    iconIdleLightBg: '#fef3c7',
    iconIdleDarkBg: 'rgba(245, 158, 11, 0.14)',
    iconIdleColor: '#d97706',
    activeLightText: '#92400e',
    activeDarkText: '#fbbf24'
  },
  {
    id: 'pdam',
    title: 'Air PDAM',
    subtitle: 'Cek & Bayar Tagihan',
    badge: '30+ Kota',
    Icon: Droplets,
    borderColor: '#06b6d4',
    badgeBg: '#0284c7',
    shadow: '0 8px 22px rgba(6, 182, 212, 0.16)',
    lightBg: '#f0f9ff',
    darkBg: 'rgba(6, 182, 212, 0.16)',
    iconActiveBg: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    iconIdleLightBg: '#e0f2fe',
    iconIdleDarkBg: 'rgba(6, 182, 212, 0.14)',
    iconIdleColor: '#0284c7',
    activeLightText: '#0369a1',
    activeDarkText: '#38bdf8'
  }
];

/**
 * Shared two-tab Token PLN & Air PDAM workspace embedded in /utilitas and /kasir.
 */
export default function UtilityServiceWorkspace({
  activeTab = 'pln',
  onSelectTab,
  user = null,
  roomNumber = '101',
  initialMeterNumber = '',
  initialCustomerNumber = ''
}) {
  const { isLight } = useTheme();
  const normalizedTab = activeTab === 'pdam' ? 'pdam' : 'pln';

  return (
    <div>
      <style>{`
        .utilitas-two-col {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.9fr);
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .utilitas-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Primary Segmented Switcher: Token PLN | Air PDAM */}
      <div
        role="tablist"
        aria-label="Pilih Layanan Utilitas"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '10px',
          marginBottom: '1.25rem'
        }}
      >
        {UTILITY_TAB_CONFIG.map((item) => {
          const isSelected = normalizedTab === item.id;
          const IconComponent = item.Icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              data-testid={`utilitas-tab-${item.id}`}
              onClick={() => onSelectTab?.(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '13px 16px',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                background: isSelected
                  ? (isLight ? item.lightBg : item.darkBg)
                  : 'var(--bg-card)',
                border: isSelected
                  ? `2px solid ${item.borderColor}`
                  : '1px solid var(--border-color)',
                boxShadow: isSelected ? item.shadow : 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: isSelected
                    ? item.iconActiveBg
                    : (isLight ? item.iconIdleLightBg : item.iconIdleDarkBg),
                  color: isSelected ? '#ffffff' : item.iconIdleColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={19} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong style={{
                    display: 'block',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: isSelected
                      ? (isLight ? item.activeLightText : item.activeDarkText)
                      : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.title}
                  </strong>
                  <span style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.subtitle}
                  </span>
                </div>
              </div>
              <span className="desktop-only" style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '999px',
                background: isSelected
                  ? item.badgeBg
                  : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)'),
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                flexShrink: 0
              }}>
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Utility Panel */}
      {normalizedTab === 'pdam' ? (
        <PdamBillPanel
          user={user}
          roomNumber={roomNumber}
          initialCustomerNumber={initialCustomerNumber}
        />
      ) : (
        <PlnTokenPanel
          user={user}
          roomNumber={roomNumber}
          initialMeterNumber={initialMeterNumber}
        />
      )}
    </div>
  );
}
