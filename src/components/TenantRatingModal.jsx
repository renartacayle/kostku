import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, CheckCircle2, ShieldCheck, Sparkles, Send, ExternalLink } from 'lucide-react';
import { apiSubmitKostReview } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const RATING_DESCRIPTIONS = {
  1: '😞 Sangat Kurang',
  2: '🙁 Kurang Memuaskan',
  3: '😐 Cukup Baik',
  4: '😊 Bagus & Nyaman',
  5: '🤩 Luar Biasa & Sangat Direkomendasikan!'
};

export default function TenantRatingModal({
  isOpen,
  onClose,
  kostUid,
  kostName = 'KostKu Residence',
  currentUser,
  onSuccess
}) {
  const { isLight } = useTheme();

  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(5);
  const [facility, setFacility] = useState(5);
  const [security, setSecurity] = useState(5);
  const [locationScore, setLocationScore] = useState(5);
  const [userName, setUserName] = useState(currentUser?.name || 'Oscar Herdian W.');
  const [roomNumber, setRoomNumber] = useState(currentUser?.kamar || '122');
  const [stayDuration, setStayDuration] = useState('3-6 Bulan');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Silakan tulis ulasan atau pengalaman Anda selama tinggal!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiSubmitKostReview(kostUid || 'KOST-OJN64X', {
        rating: formRating,
        cleanlinessRating: cleanliness,
        facilityRating: facility,
        securityRating: security,
        locationRating: locationScore,
        userName: userName.trim() || currentUser?.name || 'Penghuni Kost',
        userId: currentUser?.id || 'usr-oscar',
        roomNumber: roomNumber.trim() || currentUser?.kamar || '122',
        stayDuration,
        comment: comment.trim()
      });

      setSubmitted(true);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      alert(err.message || 'Gagal mengirim rating kost.');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        borderRadius: '24px',
        background: isLight ? '#ffffff' : '#0f172a',
        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(250, 204, 21, 0.35)',
        boxShadow: isLight ? '0 20px 50px rgba(0, 0, 0, 0.15)' : '0 25px 60px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(250, 204, 21, 0.12)', color: '#facc15', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
              <Star size={12} fill="#facc15" color="#facc15" /> Ulasan Penghuni Terverifikasi
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
              Beri Rating & Ulasan Kost
            </h3>
            <span style={{ fontSize: '0.82rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              {kostName} • Kamar {roomNumber || '122'}
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#4ade80' }}>
              <CheckCircle2 size={40} />
            </div>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px 0', color: isLight ? '#0f172a' : 'white' }}>
              Rating Berhasil Dikirim! 🎉
            </h4>
            <p style={{ color: isLight ? '#475569' : '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Terima kasih <strong>{userName}</strong>! Ulasan bintang <strong>{formRating}</strong> Anda telah berhasil disimpan dan ditampilkan di halaman publik kost untuk membantu calon anak kost lainnya.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ padding: '8px 20px', borderRadius: '10px' }}
              >
                Selesai & Kembali ke Dashboard
              </button>
              {kostUid && (
                <Link
                  to={`/kost/${kostUid}#reviews`}
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Lihat di Halaman Kost
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Main Star Picker */}
            <div style={{ 
              textAlign: 'center', 
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)', 
              padding: '1.2rem', 
              borderRadius: '16px', 
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(250, 204, 21, 0.2)' 
            }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: isLight ? '#0f172a' : '#cbd5e1', fontWeight: 700, marginBottom: '8px' }}>
                Berapa bintang kepuasan Anda tinggal di kost ini?
              </span>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => {
                  const activeVal = hoverRating || formRating;
                  const isFilled = star <= activeVal;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transform: activeVal === star ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Star 
                        size={32} 
                        fill={isFilled ? '#facc15' : 'transparent'} 
                        color={isFilled ? '#facc15' : (isLight ? '#cbd5e1' : '#475569')} 
                      />
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#facc15', minHeight: '18px' }}>
                {RATING_DESCRIPTIONS[hoverRating || formRating]}
              </div>
            </div>

            {/* Sub-ratings Aspects (Cleanliness, Facilities, Security, Location) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
              padding: '12px',
              borderRadius: '14px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              {[
                { label: '🧹 Kebersihan', value: cleanliness, setter: setCleanliness },
                { label: '🛏️ Fasilitas', value: facility, setter: setFacility },
                { label: '🔒 Keamanan', value: security, setter: setSecurity },
                { label: '📍 Lokasi & Akses', value: locationScore, setter: setLocationScore }
              ].map(asp => (
                <div key={asp.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.74rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 600 }}>{asp.label}</span>
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => asp.setter(st)}
                        style={{ background: 'transparent', border: 'none', padding: '1px', cursor: 'pointer' }}
                      >
                        <Star 
                          size={15} 
                          fill={st <= asp.value ? '#f59e0b' : 'transparent'} 
                          color={st <= asp.value ? '#f59e0b' : (isLight ? '#cbd5e1' : '#475569')} 
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', marginLeft: '4px' }}>
                      {asp.value}.0
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Profile Info & Stay Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '4px' }}>
                  Nama Penghuni
                </label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={e => setUserName(e.target.value)}
                  className="input-field" 
                  placeholder="Nama Lengkap" 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }} 
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '4px' }}>
                  Lama Tinggal
                </label>
                <select 
                  value={stayDuration} 
                  onChange={e => setStayDuration(e.target.value)}
                  className="input-field" 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <option value="< 1 Bulan">&lt; 1 Bulan</option>
                  <option value="1-3 Bulan">1 - 3 Bulan</option>
                  <option value="3-6 Bulan">3 - 6 Bulan</option>
                  <option value="6-12 Bulan">6 - 12 Bulan</option>
                  <option value="> 1 Tahun">&gt; 1 Tahun</option>
                </select>
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: isLight ? '#64748b' : '#94a3b8', marginBottom: '4px' }}>
                Pengalaman Jujur Anda (Ulasan) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ceritakan kondisi kamar, keramahan pengelola, kecepatan WiFi, kebersihan area umum, dsb..."
                rows={3}
                className="input-field"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical' }}
                required
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="btn btn-primary" 
                style={{ 
                  padding: '8px 20px', 
                  fontSize: '0.85rem', 
                  background: 'linear-gradient(135deg, #eab308, #ca8a04)', 
                  border: 'none', 
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {submitting ? 'Mengirim...' : (
                  <>
                    <Send size={14} /> Kirim Rating & Ulasan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
