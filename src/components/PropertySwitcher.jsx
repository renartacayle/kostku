import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  Layers, 
  Sparkles, 
  Home, 
  MapPin,
  ArrowRight
} from 'lucide-react';
import { apiGetOwnerKosts } from '../services/api';

export default function PropertySwitcher({ 
  user, 
  activeKostUid, 
  activeKostName, 
  onSwitchKost, 
  onOpenAddModal, 
  onOpenPortfolioModal 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchKosts = async () => {
    if (!user?.id || (user.role !== 'owner' && user.role !== 'master')) return;
    setLoading(true);
    try {
      const data = await apiGetOwnerKosts(user.id);
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

  const currentKost = kosts.find(k => k.uid === activeKostUid) || {
    kostName: activeKostName || 'KostKu',
    uid: activeKostUid,
    totalRooms: 0,
    occupancyRate: 0
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Property Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '14px',
          padding: '6px 12px 6px 10px',
          cursor: 'pointer',
          color: '#f8fafc',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: '#2563eb',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Building2 size={16} color="white" />
        </div>

        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontWeight: 800,
              fontSize: '0.88rem',
              color: 'white',
              maxWidth: '180px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentKost.kostName}
            </span>
            <ChevronDown 
              size={14} 
              color="#93c5fd" 
              style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.2s' 
              }} 
            />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {kosts.length > 1 ? `${kosts.length} Cabang • Ganti Kost` : '1 Cabang Aktif'}
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
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '18px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.15)',
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
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Daftar Properti Kost ({kosts.length})
            </span>
            <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600 }}>
              Akun Owner
            </span>
          </div>

          {/* List of Properties */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {kosts.map((k) => {
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
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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
                      background: isActive ? '#3b82f6' : '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'white'
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
                        color: isActive ? '#93c5fd' : 'white'
                      }}>
                        {k.kostName}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
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
            })}
          </div>

          {/* Action Buttons Footer */}
          <div style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenPortfolioModal) onOpenPortfolioModal();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#c7d2fe',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Layers size={14} />
              <span>Ringkasan Portofolio (Semua Kost)</span>
            </button>

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
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#86efac',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>Tambah Cabang Kost Baru</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
