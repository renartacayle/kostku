import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  BedDouble, 
  TrendingUp, 
  AlertCircle, 
  X, 
  CheckCircle, 
  Plus, 
  Sparkles,
  MapPin,
  DollarSign,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { apiGetOwnerPortfolio } from '../services/api';

export default function PortfolioOverviewModal({ 
  isOpen, 
  onClose, 
  user, 
  activeKostUid, 
  onSwitchKost, 
  onOpenAddModal 
}) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiGetOwnerPortfolio(user.id);
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPortfolio();
    }
  }, [isOpen, user?.id, activeKostUid]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
            }}>
              <Building2 size={22} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                  Portofolio Multi-Kost
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  {portfolio?.totalProperties || 0} Cabang Aktif
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Ringkasan eksekutif seluruh properti kost di bawah akun {user?.name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                onClose();
                if (onOpenAddModal) onOpenAddModal();
              }}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Plus size={15} /> Tambah Cabang
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Aggregated KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 16px'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>Total Properti</span>
              <strong style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                {portfolio?.totalProperties || 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Kost</span>
              </strong>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 16px'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>Total Kapasitas</span>
              <strong style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                {portfolio?.totalRooms || 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Kamar</span>
              </strong>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              padding: '14px 16px'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#34d399', display: 'block' }}>Rata-rata Okupansi</span>
              <strong style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                {portfolio?.overallOccupancyRate || 0}%
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                {portfolio?.totalOccupied || 0} terisi • {portfolio?.totalAvailable || 0} kosong
              </span>
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '16px',
              padding: '14px 16px'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#a5b4fc', display: 'block' }}>Potensi Omzet/Bln</span>
              <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#a5b4fc' }}>
                Rp {((portfolio?.totalPotentialRevenue || 0) / 1000000).toFixed(1)} <span style={{ fontSize: '0.85rem' }}>Jt</span>
              </strong>
            </div>
          </div>

          {/* List of Properties */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                Daftar Cabang Kost ({portfolio?.properties?.length || 0})
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Klik tombol "Kelola Properti Ini" untuk beralih aktif
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                Memuat data portofolio...
              </div>
            ) : portfolio?.properties?.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px dashed rgba(255, 255, 255, 0.15)'
              }}>
                <Building2 size={36} color="#64748b" style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Belum ada cabang kost terdaftar.</p>
                <p style={{ margin: '4px 0 16px', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Tambahkan properti kedua atau ketiga untuk mulai mengelola portofolio multi-kost.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenAddModal) onOpenAddModal();
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} /> Tambah Kost Sekarang
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {portfolio?.properties?.map((prop) => {
                  const isActive = prop.uid === activeKostUid;
                  return (
                    <div
                      key={prop.uid}
                      style={{
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)' 
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isActive ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '18px',
                        padding: '16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Left: Thumbnail & Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
                        <div style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          background: '#1e293b',
                          flexShrink: 0
                        }}>
                          <img
                            src={prop.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80'}
                            alt={prop.kostName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                              {prop.kostName}
                            </h4>
                            {isActive && (
                              <span style={{
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }}>
                                Sedang Aktif
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#64748b" />
                            {prop.address || 'Alamat belum diatur'}
                          </p>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            Kode UID: <strong style={{ color: '#cbd5e1' }}>{prop.uid}</strong> • Tipe: {prop.type}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Stats */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '0 1 auto' }}>
                        <div style={{ textAlign: 'center', minWidth: '70px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Kamar</span>
                          <strong style={{ fontSize: '1rem', color: 'white' }}>
                            {prop.occupiedCount}/{prop.totalRooms}
                          </strong>
                        </div>

                        <div style={{ textAlign: 'center', minWidth: '70px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Okupansi</span>
                          <strong style={{
                            fontSize: '1rem',
                            color: prop.occupancyRate >= 80 ? '#34d399' : prop.occupancyRate >= 50 ? '#facc15' : '#f87171'
                          }}>
                            {prop.occupancyRate}%
                          </strong>
                        </div>

                        <div style={{ textAlign: 'center', minWidth: '85px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Omzet/Bln</span>
                          <strong style={{ fontSize: '0.92rem', color: '#a5b4fc' }}>
                            Rp {((prop.potentialRevenue || 0) / 1000000).toFixed(1)}Jt
                          </strong>
                        </div>
                      </div>

                      {/* Right: Switch Action Button */}
                      <div>
                        {isActive ? (
                          <button
                            disabled
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              color: '#93c5fd',
                              padding: '8px 16px',
                              borderRadius: '12px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'default',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <CheckCircle size={15} /> Aktif Sekarang
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onSwitchKost(prop.uid, prop.kostName);
                              onClose();
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ gap: '6px', padding: '8px 16px' }}
                          >
                            Kelola Properti Ini <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
