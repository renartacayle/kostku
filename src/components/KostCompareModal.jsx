import React from 'react';
import { X, Check, Star, ShieldCheck, MapPin, ArrowRight, Bed, DollarSign, Ruler } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function KostCompareModal({ isOpen, onClose, kosts = [] }) {
  if (!isOpen || kosts.length === 0) return null;

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);

  const getMinPrice = (kost) => {
    if (!kost.rooms || kost.rooms.length === 0) return 1000000;
    const prices = kost.rooms.map(r => Number(r.price) || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 1000000;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        maxWidth: '960px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.2)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
              ⚖️ Bandingkan Pilihan Kost ({kosts.length} Kost)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Bandingkan harga, fasilitas, dan tata ruang untuk menentukan pilihan terbaik
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Comparison Grid Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${kosts.length}, 1fr)`,
            gap: '16px'
          }}>
            {kosts.map((k) => {
              const minPrice = getMinPrice(k);
              const mainImg = k.images && k.images.length > 0 ? k.images[0] : null;

              return (
                <div key={k.uid} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Photo Thumbnail */}
                  <div style={{ position: 'relative', height: '140px', background: '#1e293b' }}>
                    {mainImg ? (
                      <img src={mainImg} alt={k.kostName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: k.type === 'Putri' ? '#ec4899' : k.type === 'Putra' ? '#2563eb' : '#059669',
                      color: 'white'
                    }}>
                      {k.type}
                    </span>
                  </div>

                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                        {k.kostName}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#60a5fa" />
                        <span>{k.city || 'Kota'}</span>
                      </p>
                    </div>

                    {/* Price Block */}
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#93c5fd' }}>Mulai dari</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#60a5fa' }}>
                        {formatRupiah(minPrice)}
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'normal' }}> / bln</span>
                      </div>
                    </div>

                    {/* Specifications List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Ukuran Kamar:</span>
                        <strong style={{ color: '#e2e8f0' }}>{k.layoutInfo?.roomDimensions || '4.0m x 4.5m'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Kamar Mandi:</span>
                        <strong style={{ color: '#e2e8f0' }}>{k.layoutInfo?.bathroomType || 'Dalam'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Total Kamar:</span>
                        <strong style={{ color: '#e2e8f0' }}>{k.rooms?.length || 0} Kamar</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Rating:</span>
                        <strong style={{ color: '#facc15', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Star size={12} fill="#facc15" /> {k.rating || 4.9}
                        </strong>
                      </div>
                    </div>

                    {/* Facilities Chips */}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Fasilitas Utama:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(k.facilities || ['AC', 'WiFi', 'KM Dalam']).slice(0, 4).map((f, i) => (
                          <span key={i} style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#cbd5e1'
                          }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA Link */}
                    <Link
                      to={`/kost/${k.uid}`}
                      onClick={onClose}
                      className="btn btn-primary"
                      style={{
                        padding: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        marginTop: '4px'
                      }}
                    >
                      Pilih Kost Ini <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
