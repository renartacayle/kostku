import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  X, 
  SlidersHorizontal, 
  MapPin, 
  Sparkles, 
  Check, 
  RotateCcw,
  Navigation,
  Building,
  DollarSign,
  Compass
} from 'lucide-react';

export default function KostFilterModal({
  isOpen,
  onClose,
  selectedCity,
  setSelectedCity,
  cityBadges = [],
  selectedType,
  setSelectedType,
  types = [],
  selectedPriceRange,
  setSelectedPriceRange,
  selectedFacilities = [],
  handleToggleFacility,
  handleClearFacilities,
  facilityOptions = [],
  userLocation,
  handleGetGpsLocation,
  handleSelectLandmark,
  handleClearLocation,
  isLocating,
  locatingError,
  setLocatingError,
  popularLandmarks = [],
  maxDistanceRadius,
  setMaxDistanceRadius,
  totalResults = 0,
  onResetAll,
  activeFilterCount = 0
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 10, 24, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end', // Bottom sheet on mobile
        justifyContent: 'center',
        padding: '0',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="kost-filter-modal-container"
        style={{
          backgroundColor: isLight ? '#ffffff' : '#0b1329',
          color: isLight ? '#0f172a' : '#f8fafc',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isLight 
            ? '0 -10px 40px rgba(15, 23, 42, 0.15)' 
            : '0 -10px 40px rgba(0, 0, 0, 0.6), 0 0 50px rgba(37, 99, 235, 0.25)',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.25)',
          borderBottom: 'none',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '10px',
          paddingBottom: '4px'
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px'
          }} />
        </div>

        {/* Modal Header */}
        <div style={{
          padding: '1rem 1.25rem 1rem',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLight 
            ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' 
            : 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 19, 41, 0.95) 100%)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}>
              <SlidersHorizontal size={18} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
                  Filter Kost & Fasilitas
                </h3>
                {activeFilterCount > 0 && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {activeFilterCount} Aktif
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Sesuaikan patokan lokasi, harga, tipe, dan fasilitas
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetAll}
                style={{
                  background: isLight ? 'rgba(239, 68, 68, 0.10)' : 'rgba(239, 68, 68, 0.12)',
                  border: isLight ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: isLight ? '#b91c1c' : '#fca5a5',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Hapus semua filter"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isLight ? '#475569' : '#94a3b8',
                borderRadius: '10px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Tutup filter"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '1.25rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent'
        }}>

          {/* Section 1: Lokasi & Patokan Kampus */}
          <div style={{
            background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '1.1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 800,
                color: isLight ? '#0f172a' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <MapPin size={16} color={isLight ? '#059669' : '#34d399'} />
                Lokasi GPS & Patokan Kampus
              </span>
              {userLocation && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  ✕ Hapus Patokan
                </button>
              )}
            </div>

            {/* GPS Trigger Button */}
            <button
              type="button"
              onClick={handleGetGpsLocation}
              disabled={isLocating}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px 16px',
                borderRadius: '14px',
                border: userLocation?.isGps 
                  ? '1px solid #10b981' 
                  : isLight ? '1px solid #93c5fd' : '1px solid rgba(59, 130, 246, 0.4)',
                background: userLocation?.isGps
                  ? (isLight ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))')
                  : isLocating
                    ? (isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)')
                    : (isLight ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(59, 130, 246, 0.08))' : 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(59, 130, 246, 0.15))'),
                color: userLocation?.isGps 
                  ? (isLight ? '#047857' : '#34d399') 
                  : (isLight ? '#1d4ed8' : '#93c5fd'),
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: isLocating ? 'wait' : 'pointer',
                marginBottom: '10px',
                transition: 'all 0.2s ease'
              }}
            >
              {isLocating ? (
                <>
                  <div className="animate-spin" style={{ width: '15px', height: '15px', border: '2px solid rgba(147, 197, 253, 0.3)', borderTopColor: isLight ? '#1d4ed8' : '#93c5fd', borderRadius: '50%' }} />
                  <span>Mendeteksi Titik GPS Anda...</span>
                </>
              ) : userLocation?.isGps ? (
                <>
                  <Navigation size={16} />
                  <span>📍 GPS Aktif: {userLocation.label}</span>
                </>
              ) : (
                <>
                  <Navigation size={16} />
                  <span>📍 Gunakan Lokasi GPS Saya (Terdekat)</span>
                </>
              )}
            </button>

            {locatingError && (
              <div style={{
                marginBottom: '10px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: isLight ? '#b91c1c' : '#fca5a5',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <span>⚠️ {locatingError}</span>
                <button
                  type="button"
                  onClick={() => setLocatingError(null)}
                  style={{ background: 'transparent', border: 'none', color: isLight ? '#b91c1c' : '#fca5a5', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Campus shortcuts */}
            <div>
              <span style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Atau pilih patokan kampus sekitar:
              </span>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                {popularLandmarks.map(lm => {
                  const isActive = userLocation?.label === lm.name;
                  return (
                    <button
                      key={lm.id}
                      type="button"
                      onClick={() => handleSelectLandmark(lm)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        border: isActive 
                          ? '1px solid #10b981' 
                          : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                        background: isActive 
                          ? (isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.25)') 
                          : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                        color: isActive 
                          ? (isLight ? '#047857' : '#34d399') 
                          : (isLight ? '#334155' : '#cbd5e1'),
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={lm.full}
                    >
                      🎓 {lm.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance Radius (only if userLocation is active) */}
            {userLocation && (
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>Maks. Jarak Radius:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'all', label: 'Semua Jarak' },
                    { id: '2', label: '< 2 km' },
                    { id: '5', label: '< 5 km' },
                    { id: '10', label: '< 10 km' }
                  ].map(rad => (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => setMaxDistanceRadius(rad.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        border: maxDistanceRadius === rad.id 
                          ? '1px solid #10b981' 
                          : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                        background: maxDistanceRadius === rad.id 
                          ? (isLight ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)') 
                          : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'),
                        color: maxDistanceRadius === rad.id 
                          ? (isLight ? '#047857' : '#34d399') 
                          : (isLight ? '#334155' : '#cbd5e1'),
                        fontSize: '0.74rem',
                        fontWeight: maxDistanceRadius === rad.id ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {rad.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Kota / Wilayah */}
          <div>
            <span style={{
              fontSize: '0.86rem',
              fontWeight: 800,
              color: isLight ? '#0f172a' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <Building size={16} color="#2563eb" />
              Kota / Wilayah
            </span>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {cityBadges.map((c) => {
                const isActive = selectedCity === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCity(c.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '20px',
                      border: isActive ? '1px solid #2563eb' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                      background: isActive ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                      color: isActive ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Tipe Kost */}
          <div>
            <span style={{
              fontSize: '0.86rem',
              fontWeight: 800,
              color: isLight ? '#0f172a' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <Compass size={16} color={isLight ? '#7c3aed' : '#a78bfa'} />
              Tipe Kost
            </span>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {types.map(t => {
                const isActive = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '14px',
                      border: isActive ? '1px solid #8b5cf6' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                      background: isActive 
                        ? (isLight ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.25)') 
                        : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                      color: isActive ? (isLight ? '#6d28d9' : '#c4b5fd') : (isLight ? '#334155' : '#cbd5e1'),
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Rentang Harga */}
          <div>
            <span style={{
              fontSize: '0.86rem',
              fontWeight: 800,
              color: isLight ? '#0f172a' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <DollarSign size={16} color={isLight ? '#d97706' : '#fbbf24'} />
              Rentang Harga Sewa per Bulan
            </span>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {[
                { id: 'all', label: 'Semua Harga' },
                { id: 'under-1.5m', label: '< 1.5 Jt' },
                { id: '1.5m-2.5m', label: '1.5 - 2.5 Jt' },
                { id: 'over-2.5m', label: '> 2.5 Jt' }
              ].map(p => {
                const isActive = selectedPriceRange === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPriceRange(p.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '14px',
                      border: isActive ? '1px solid #f59e0b' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                      background: isActive 
                        ? (isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.25)') 
                        : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                      color: isActive ? (isLight ? '#b45309' : '#fde68a') : (isLight ? '#334155' : '#cbd5e1'),
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Fasilitas Kost & Kamar (Multi-Select) */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 800,
                color: isLight ? '#0f172a' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={16} color="#2563eb" />
                Fasilitas Kost & Kamar (Bisa Banyak)
              </span>
              {selectedFacilities.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearFacilities}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isLight ? '#dc2626' : '#f87171',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  ✕ Hapus Pilihan ({selectedFacilities.length})
                </button>
              )}
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {/* Option: Semua Fasilitas */}
              <button
                type="button"
                onClick={handleClearFacilities}
                style={{
                  padding: '7px 14px',
                  borderRadius: '16px',
                  border: selectedFacilities.length === 0 ? '1px solid #2563eb' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                  background: selectedFacilities.length === 0 ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                  color: selectedFacilities.length === 0 ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                  fontSize: '0.78rem',
                  fontWeight: selectedFacilities.length === 0 ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Semua Fasilitas
              </button>

              {/* Dynamic Facility Options */}
              {facilityOptions.map(fac => {
                const isSelected = selectedFacilities.includes(fac.id);
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => handleToggleFacility(fac.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 13px',
                      borderRadius: '16px',
                      border: isSelected ? '1px solid #2563eb' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                      background: isSelected 
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                        : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                      color: isSelected ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 800 : 500,
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} color="#ffffff" />}
                    <span>{fac.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Sticky Footer */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          background: isLight 
            ? 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' 
            : 'linear-gradient(180deg, rgba(11, 19, 41, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', display: 'block' }}>
              Ditemukan <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>{totalResults}</strong> Kost
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLight ? '#64748b' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 12px'
                }}
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
              }}
            >
              <Check size={16} />
              <span>Terapkan Filter ({totalResults})</span>
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (min-width: 640px) {
          .kost-filter-modal-container {
            border-bottom-left-radius: 24px !important;
            border-bottom-right-radius: 24px !important;
            border-bottom: 1px solid rgba(59, 130, 246, 0.25) !important;
            margin-bottom: 2rem !important;
            animation: modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
