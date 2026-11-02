import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  Sparkles, 
  Home, 
  MapPin,
  ArrowRight
} from 'lucide-react';
import { apiGetOwnerKosts } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function PropertySwitcher({ 
  user, 
  activeKostUid, 
  activeKostName, 
  onSwitchKost, 
  onOpenAddModal 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const { isLight } = useTheme();

  const fetchKosts = async () => {
    if (!user?.id || (user?.role !== 'owner' && user?.role !== 'master')) return;
    setLoading(true);
    try {
      const data = await apiGetOwnerKosts(user?.id);
      setKosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load owned kosts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKosts();
  }, [user?.id, activeKostUid]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (user?.role !== 'owner' && user?.role !== 'master') {
    return null;
  }

  const hasNoKosts = !loading && kosts.length === 0;
  const currentKost = kosts.find(k => k.uid === activeKostUid) || (kosts.length > 0 ? kosts[0] : null);

  const displayTitle = currentKost ? currentKost.kostName : (hasNoKosts ? '+ Buat Kost Baru' : (activeKostName || 'KostKu'));
  const displaySubtitle = hasNoKosts 
    ? 'Belum Ada Kost' 
    : (kosts.length > 1 ? `${kosts.length} Cabang • Ganti Kost` : (kosts.length === 1 ? '1 Cabang Aktif' : 'Memuat properti...'));

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Property Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (hasNoKosts && onOpenAddModal) {
            onOpenAddModal();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isLight 
            ? '#ffffff' 
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: hasNoKosts 
            ? (isLight ? '1px dashed #2563eb' : '1px dashed #3b82f6')
            : (isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(59, 130, 246, 0.4)'),
          borderRadius: '12px',
          padding: '5px 10px 5px 8px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          boxShadow: isLight ? '0 2px 8px rgba(15, 23, 42, 0.06)' : '0 4px 14px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: 'min(240px, 45vw)',
          minWidth: 0,
          flexShrink: 1
        }}
      >
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          background: hasNoKosts 
            ? (isLight ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.25)')
            : (isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.15)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {hasNoKosts ? (
            <Plus size={15} color={isLight ? '#16a34a' : '#4ade80'} strokeWidth={2.5} />
          ) : (
            <Building2 size={15} color={isLight ? '#2563eb' : '#60a5fa'} strokeWidth={2} />
          )}
        </div>

        <div style={{ textAlign: 'left', lineHeight: 1.2, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <span style={{
              fontWeight: 800,
              fontSize: '0.88rem',
              color: hasNoKosts ? (isLight ? '#16a34a' : '#4ade80') : 'var(--text-primary)',
              maxWidth: 'clamp(95px, 28vw, 160px)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block'
            }}>
              {displayTitle}
            </span>
            <ChevronDown 
              size={14} 
              color={isLight ? '#2563eb' : '#93c5fd'} 
              style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.2s',
                flexShrink: 0
              }} 
            />
          </div>
          <span className="desktop-only" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {displaySubtitle}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '320px',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '18px',
          boxShadow: isLight ? '0 12px 30px rgba(15, 23, 42, 0.12)' : '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.15)',
          padding: '8px',
          zIndex: 1000,
          animation: 'fadeIn 0.15s ease-out',
          backdropFilter: 'blur(16px)'
        }}>
          {/* Section Header */}
          <div style={{
            padding: '8px 10px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Daftar Properti Kost ({kosts.length})
            </span>
            <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>
              Akun Owner
            </span>
          </div>

          {/* List of Properties */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {kosts.length === 0 ? (
              <div style={{
                padding: '1.25rem 1rem',
                textAlign: 'center',
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.1)'
              }}>
                <Building2 size={28} color={isLight ? '#94a3b8' : '#64748b'} style={{ margin: '0 auto 6px', display: 'block' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Belum Ada Kost Terdaftar
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Klik tombol di bawah untuk mendaftarkan properti pertama Anda.
                </div>
              </div>
            ) : (
              kosts.map((k) => {
                const isActive = k.uid === activeKostUid;
                return (
                  <button
                    key={k.uid}
                    type="button"
                    onClick={() => {
                      onSwitchKost(k.uid, k.kostName);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '12px',
                      background: isActive ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)') : 'transparent',
                      border: isActive ? (isLight ? '1px solid #93c5fd' : '1px solid rgba(59, 130, 246, 0.35)') : '1px solid transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isActive ? '#3b82f6' : (isLight ? '#e2e8f0' : '#1e293b'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: isActive ? 'white' : (isLight ? '#475569' : '#94a3b8')
                      }}>
                        <Home size={16} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{
                          display: 'block',
                          fontSize: '0.86rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: isActive ? (isLight ? '#1d4ed8' : '#93c5fd') : 'var(--text-primary)'
                        }}>
                          {k.kostName}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {k.totalRooms} Kamar • {k.occupancyRate}% Terisi
                        </span>
                      </div>
                    </div>

                    {isActive ? (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Check size={13} color="white" />
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Action Buttons Footer */}
          <div style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenAddModal) onOpenAddModal();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: isLight ? '#15803d' : '#86efac',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>{kosts.length === 0 ? 'Buat Kost Sekarang' : 'Tambah Cabang Kost Baru'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
