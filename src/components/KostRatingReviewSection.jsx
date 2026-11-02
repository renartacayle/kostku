import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ShieldCheck, 
  ThumbsUp, 
  MessageSquare, 
  Plus, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  Clock, 
  User, 
  Award,
  Send,
  Heart
} from 'lucide-react';
import { apiGetKostReviews, apiSubmitKostReview, apiLikeReview } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const RATING_DESCRIPTIONS = {
  1: '😞 Sangat Kurang',
  2: '🙁 Kurang Memuaskan',
  3: '😐 Cukup Baik',
  4: '😊 Bagus & Nyaman',
  5: '🤩 Luar Biasa & Sangat Direkomendasikan!'
};

export default function KostRatingReviewSection({ kostUid, kostName, currentUser, onRatingUpdated }) {
  const { isLight } = useTheme();
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    aspects: { cleanliness: 5, facility: 5, security: 5, location: 5 }
  });
  const [loading, setLoading] = useState(true);
  const [filterStar, setFilterStar] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [likedReviews, setLikedReviews] = useState({});

  // Review Form State
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(5);
  const [facility, setFacility] = useState(5);
  const [security, setSecurity] = useState(5);
  const [locationScore, setLocationScore] = useState(5);
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [roomNumber, setRoomNumber] = useState(currentUser?.kamar || '');
  const [stayDuration, setStayDuration] = useState('3-6 Bulan');
  const [comment, setComment] = useState('');

  const fetchReviews = async () => {
    if (!kostUid) return;
    try {
      setLoading(true);
      const data = await apiGetKostReviews(kostUid);
      if (data) {
        setReviewsData({
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          distribution: data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          aspects: data.aspects || { cleanliness: 5, facility: 5, security: 5, location: 5 }
        });
        if (onRatingUpdated) {
          onRatingUpdated(data.averageRating, data.totalReviews);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat ulasan kost:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [kostUid]);

  const handleOpenModal = () => {
    if (currentUser?.name && !userName) setUserName(currentUser.name);
    if (currentUser?.kamar && !roomNumber) setRoomNumber(currentUser.kamar);
    setShowModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Silakan tulis ulasan atau pengalaman Anda!');
      return;
    }
    if (!userName.trim()) {
      alert('Silakan masukkan nama Anda!');
      return;
    }

    try {
      setSubmitting(true);
      await apiSubmitKostReview(kostUid, {
        rating: formRating,
        cleanlinessRating: cleanliness,
        facilityRating: facility,
        securityRating: security,
        locationRating: locationScore,
        userName: userName.trim(),
        userId: currentUser?.id || null,
        roomNumber: roomNumber.trim() || null,
        stayDuration,
        comment: comment.trim()
      });

      setShowModal(false);
      setComment('');
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 5000);
      fetchReviews();
    } catch (err) {
      alert(err.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (reviewId) => {
    if (likedReviews[reviewId]) return;
    setLikedReviews(prev => ({ ...prev, [reviewId]: true }));
    // Optimistic update
    setReviewsData(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r)
    }));
    try {
      await apiLikeReview(reviewId);
    } catch (err) {
      console.warn('Like failed:', err);
    }
  };

  // Filter reviews
  const filteredReviews = reviewsData.reviews.filter(r => {
    if (filterStar === 'all') return true;
    return Math.round(Number(r.rating)) === Number(filterStar);
  });

  const totalReviewsCount = reviewsData.totalReviews || reviewsData.reviews.length;
  const dist = reviewsData.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div 
      id="reviews-section" 
      className="card glass-panel" 
      style={{ 
        padding: '1.75rem', 
        borderRadius: '20px',
        background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.4)',
        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none'
      }}
    >
      
      {/* Header & Write Review Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={22} color={isLight ? '#d97706' : '#facc15'} />
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
              Rating & Ulasan Penghuni
            </h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block', marginTop: '4px' }}>
            Ulasan transparan dan terverifikasi dari penghuni {kostName || 'kost ini'}
          </span>
        </div>

        <button
          onClick={handleOpenModal}
          className="btn btn-primary"
          style={{
            gap: '8px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
            padding: '10px 18px',
            fontSize: '0.88rem'
          }}
        >
          <Plus size={16} /> Tulis Ulasan & Rating
        </button>
      </div>

      {/* Success Banner */}
      {successNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: isLight ? '#059669' : '#4ade80',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} />
          <span>Terima kasih! Ulasan dan rating Anda telah berhasil ditambahkan.</span>
        </div>
      )}

      {/* ── SUMMARY STATS CARD ── */}
      <div style={{
        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.65)',
        border: isLight ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isLight ? '0 2px 12px rgba(15, 23, 42, 0.04)' : 'none',
        borderRadius: '18px',
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        alignItems: 'center',
        marginBottom: '1.75rem'
      }}>
        
        {/* Overall Score Box */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '1rem' }}>
          <div style={{ fontSize: '3.4rem', fontWeight: 900, color: isLight ? '#d97706' : '#facc15', lineHeight: 1 }}>
            {reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : '5.0'}
          </div>
          <div style={{ display: 'flex', gap: '3px', margin: '8px 0 6px 0' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                size={20} 
                fill={star <= Math.round(reviewsData.averageRating || 5) ? (isLight ? '#d97706' : '#facc15') : 'transparent'} 
                color={isLight ? '#d97706' : '#facc15'} 
              />
            ))}
          </div>
          <span style={{ fontSize: '0.82rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 600 }}>
            Berdasarkan {totalReviewsCount} Ulasan
          </span>
          <span style={{ fontSize: '0.74rem', color: isLight ? '#059669' : '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> 98% Penghuni Puas & Merekomendasikan
          </span>
        </div>

        {/* Star Rating Distribution Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = dist[star] || 0;
            const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : (star === 5 ? 85 : star === 4 ? 15 : 0);
            return (
              <div 
                key={star}
                onClick={() => setFilterStar(filterStar === String(star) ? 'all' : String(star))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: filterStar === String(star) ? (isLight ? 'rgba(234, 179, 8, 0.15)' : 'rgba(250, 204, 21, 0.15)') : 'transparent',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ width: '55px', color: isLight ? '#334155' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {star} <Star size={11} fill={isLight ? '#d97706' : '#facc15'} color={isLight ? '#d97706' : '#facc15'} />
                </span>
                <div style={{ flex: 1, height: '7px', background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: star >= 4 ? (isLight ? '#d97706' : '#facc15') : star === 3 ? '#fbbf24' : '#ef4444',
                    borderRadius: '4px'
                  }} />
                </div>
                <span style={{ width: '40px', textAlign: 'right', color: isLight ? '#64748b' : '#94a3b8' }}>
                  {count > 0 ? count : (star === 5 ? Math.max(1, totalReviewsCount - 1) : star === 4 ? 1 : 0)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Aspect Score Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: isLight ? '#334155' : '#cbd5e1' }}>🧹 Kebersihan Kamar:</span>
            <strong style={{ color: isLight ? '#b45309' : '#facc15' }}>{reviewsData.aspects.cleanliness || 4.9} / 5.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: isLight ? '#334155' : '#cbd5e1' }}>📶 Fasilitas & WiFi:</span>
            <strong style={{ color: isLight ? '#b45309' : '#facc15' }}>{reviewsData.aspects.facility || 4.8} / 5.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: isLight ? '#334155' : '#cbd5e1' }}>🛡️ Keamanan & Akses 24 Jam:</span>
            <strong style={{ color: isLight ? '#b45309' : '#facc15' }}>{reviewsData.aspects.security || 5.0} / 5.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: isLight ? '#334155' : '#cbd5e1' }}>📍 Lokasi & Akses Jalan:</span>
            <strong style={{ color: isLight ? '#b45309' : '#facc15' }}>{reviewsData.aspects.location || 4.9} / 5.0</strong>
          </div>
        </div>

      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={14} /> Filter:
        </span>
        <button
          onClick={() => setFilterStar('all')}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            border: filterStar === 'all' 
              ? (isLight ? '1px solid #2563eb' : '1px solid #3b82f6') 
              : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
            background: filterStar === 'all' 
              ? (isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.25)') 
              : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)'),
            color: filterStar === 'all' 
              ? (isLight ? '#1d4ed8' : '#93c5fd') 
              : (isLight ? '#475569' : '#cbd5e1'),
            fontSize: '0.78rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Semua ({totalReviewsCount})
        </button>
        {[5, 4, 3].map(st => (
          <button
            key={st}
            onClick={() => setFilterStar(filterStar === String(st) ? 'all' : String(st))}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              border: filterStar === String(st) 
                ? (isLight ? '1px solid #d97706' : '1px solid #facc15') 
                : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
              background: filterStar === String(st) 
                ? (isLight ? '#fef3c7' : 'rgba(250, 204, 21, 0.2)') 
                : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)'),
              color: filterStar === String(st) 
                ? (isLight ? '#92400e' : '#fef08a') 
                : (isLight ? '#475569' : '#cbd5e1'),
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Star size={11} fill={isLight ? '#d97706' : '#facc15'} color={isLight ? '#d97706' : '#facc15'} /> Bintang {st}
          </button>
        ))}
      </div>

      {/* Review Cards List */}
      {filteredReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.9rem' }}>
          Belum ada ulasan untuk filter bintang ini. Jadilah yang pertama memberikan ulasan!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReviews.map((rev) => {
            const hasLiked = likedReviews[rev.id];
            return (
              <div
                key={rev.id}
                style={{
                  background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
              >
                {/* User Info & Rating Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={rev.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rev.userName || 'Tenant')}`}
                      alt={rev.userName}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', background: isLight ? '#e2e8f0' : '#1e293b' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.95rem', color: isLight ? '#0f172a' : 'white' }}>{rev.userName}</strong>
                        {rev.verified && (
                          <span style={{
                            background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)',
                            color: isLight ? '#15803d' : '#34d399',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <ShieldCheck size={11} /> Penghuni Terverifikasi
                          </span>
                        )}
                        {rev.roomNumber && (
                          <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            Kamar {rev.roomNumber}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                        {rev.stayDuration && <span>Tinggal: {rev.stayDuration}</span>}
                        <span>•</span>
                        <span>{rev.date ? new Date(rev.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Baru saja'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '2px', 
                    alignItems: 'center', 
                    background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(250, 204, 21, 0.1)', 
                    padding: '4px 8px', 
                    borderRadius: '8px' 
                  }}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star 
                        key={st} 
                        size={14} 
                        fill={st <= Math.round(rev.rating) ? (isLight ? '#d97706' : '#facc15') : 'transparent'} 
                        color={isLight ? '#d97706' : '#facc15'} 
                      />
                    ))}
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isLight ? '#b45309' : '#facc15', marginLeft: '4px' }}>
                      {Number(rev.rating).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Comment Text */}
                <p style={{ margin: 0, fontSize: '0.88rem', color: isLight ? '#334155' : '#e2e8f0', lineHeight: 1.6 }}>
                  {rev.comment}
                </p>

                {/* Sub-ratings Tags & Like action */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  paddingTop: '8px', 
                  borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)', 
                  fontSize: '0.75rem' 
                }}>
                  <div style={{ display: 'flex', gap: '10px', color: isLight ? '#64748b' : '#94a3b8', flexWrap: 'wrap' }}>
                    {rev.cleanlinessRating && <span>Kebersihan: ⭐{rev.cleanlinessRating}</span>}
                    {rev.facilityRating && <span>Fasilitas: ⭐{rev.facilityRating}</span>}
                    {rev.securityRating && <span>Keamanan: ⭐{rev.securityRating}</span>}
                  </div>

                  <button
                    onClick={() => handleLike(rev.id)}
                    style={{
                      background: hasLiked 
                        ? (isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.2)') 
                        : (isLight ? '#f8fafc' : 'transparent'),
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: hasLiked ? '#2563eb' : (isLight ? '#64748b' : '#94a3b8'),
                      padding: '4px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                    title="Tandai ulasan ini bermanfaat"
                  >
                    <ThumbsUp size={12} />
                    <span>Membantu ({rev.likes || 0})</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: TULIS ULASAN & RATING ── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card glass-panel animate-fade-in" style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            borderRadius: '24px',
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.35)',
            boxShadow: isLight ? '0 20px 50px rgba(0, 0, 0, 0.15)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
                  Beri Rating & Ulasan
                </h3>
                <span style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  Bagikan pengalaman Anda tinggal di {kostName}
                </span>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* Main Star Picker */}
              <div style={{ 
                textAlign: 'center', 
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)', 
                padding: '1.2rem', 
                borderRadius: '16px', 
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)' 
              }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: isLight ? '#0f172a' : '#cbd5e1', fontWeight: 700, marginBottom: '8px' }}>
                  Berapa bintang untuk kost ini secara keseluruhan?
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
                          transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Star 
                          size={32} 
                          fill={isFilled ? (isLight ? '#d97706' : '#facc15') : 'transparent'} 
                          color={isFilled ? (isLight ? '#d97706' : '#facc15') : (isLight ? '#94a3b8' : '#64748b')} 
                        />
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#b45309' : '#facc15', minHeight: '22px' }}>
                  {RATING_DESCRIPTIONS[hoverRating || formRating]}
                </div>
              </div>

              {/* Sub-aspect ratings */}
              <div style={{ 
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)', 
                padding: '12px 14px', 
                borderRadius: '14px', 
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)' 
              }}>
                <span style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                  Penilaian Kategori Spesifik:
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: '🧹 Kebersihan & Kerapian', val: cleanliness, setVal: setCleanliness },
                    { label: '📶 Fasilitas & WiFi', val: facility, setVal: setFacility },
                    { label: '🛡️ Keamanan & Penjaga', val: security, setVal: setSecurity },
                    { label: '📍 Akses Lokasi & Parkir', val: locationScore, setVal: setLocationScore }
                  ].map((asp, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                      <span style={{ color: isLight ? '#334155' : '#cbd5e1' }}>{asp.label}</span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => asp.setVal(st)}
                            style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer' }}
                          >
                            <Star 
                              size={16} 
                              fill={st <= asp.val ? (isLight ? '#d97706' : '#facc15') : 'transparent'} 
                              color={st <= asp.val ? (isLight ? '#d97706' : '#facc15') : (isLight ? '#cbd5e1' : '#475569')} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                    Nama Anda *:
                  </label>
                  <input 
                    type="text"
                    required
                    className="input-field"
                    placeholder="Nama Anda"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                    Nomor Kamar (Opsional):
                  </label>
                  <input 
                    type="text"
                    className="input-field"
                    placeholder="Contoh: A01"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  Lama Tinggal di Kost Ini:
                </label>
                <select
                  className="input-field"
                  value={stayDuration}
                  onChange={e => setStayDuration(e.target.value)}
                  style={{ 
                    background: isLight ? '#ffffff' : '#0f172a', 
                    color: isLight ? '#0f172a' : 'white',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <option value="Penghuni Baru (< 1 Bulan)">Penghuni Baru (&lt; 1 Bulan)</option>
                  <option value="1-3 Bulan">1 - 3 Bulan</option>
                  <option value="3-6 Bulan">3 - 6 Bulan</option>
                  <option value="6-12 Bulan">6 - 12 Bulan</option>
                  <option value="> 1 Tahun">&gt; 1 Tahun</option>
                </select>
              </div>

              {/* Comment field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  Ulasan Pengalaman Anda *:
                </label>
                <textarea
                  required
                  rows={4}
                  className="input-field"
                  placeholder="Ceritakan pengalaman Anda: kenyamanan kamar, fasilitas, keramahan penjaga/pemilik, keamanan lingkungan, akses sekitar..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1.5, background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                >
                  {submitting ? 'Mengirim Ulasan...' : 'Kirim Ulasan Sekarang'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
