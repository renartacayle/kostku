import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Sparkles, 
  Award, 
  DollarSign, 
  MessageSquare, 
  CheckCircle, 
  RefreshCw, 
  User, 
  Calendar,
  ThumbsUp
} from 'lucide-react';
import { apiGetStaffRatings } from '../services/api';

export default function StaffRatingsFeed({ staff, user }) {
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRatings = async () => {
    if (!staff?.id) return;
    setLoading(true);
    try {
      const res = await apiGetStaffRatings(staff.id);
      setRatingSummary(res);
    } catch (err) {
      console.error('Failed loading staff ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, [staff?.id]);

  const ratingsList = ratingSummary?.ratings || [];
  const avg = ratingSummary?.avgRating || 5.0;
  const total = ratingSummary?.totalReviews || 0;
  const totalTips = ratingSummary?.totalTips || 0;
  const badgesCount = ratingSummary?.badgesCount || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Scorecard Banner */}
      <div className="card glass-panel" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#fbbf24" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>
                Scorecard & Reputasi Staf: {staff.name}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Penilaian nyata dan apresiasi langsung dari anak kost paska penanganan komplain & perbaikan fasilitas.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRatings}
            className="btn btn-secondary btn-sm"
            title="Refresh ulasan"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '1.25rem' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>
              Rata-rata Rating Bintang
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(st => (
                  <Star key={st} size={16} fill={st <= Math.round(avg) ? '#fbbf24' : 'none'} color="#fbbf24" />
                ))}
              </div>
              <strong style={{ fontSize: '1.35rem', color: '#fbbf24' }}>
                {avg.toFixed(1)}
              </strong>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Dari {total} Ulasan Penghuni
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>
              Total Tip Apresiasi Diterima
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              Rp {totalTips.toLocaleString('id-ID')}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              100% langsung ke dompet staf
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>
              Tingkat Kepuasan Penghuni
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              {total > 0 ? `${Math.round((avg / 5) * 100)}%` : '100%'}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Indeks Pelayanan Prima
            </span>
          </div>

        </div>

        {/* Lencana Pujian Section */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed rgba(245, 158, 11, 0.25)' }}>
          <span style={{ fontSize: '0.76rem', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
            LENCANA PUJIAN DARI PENGHUNI:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: '⚡ Sangat Cepat & Tanggap', label: '⚡ Sangat Cepat & Tanggap' },
              { id: '✨ Pengerjaan Rapi & Bersih', label: '✨ Pengerjaan Rapi & Bersih' },
              { id: '🤝 Ramah, Sopan & Santun', label: '🤝 Ramah, Sopan & Santun' },
              { id: '🔧 Ahli, Teliti & Tuntas', label: '🔧 Ahli, Teliti & Tuntas' }
            ].map(b => (
              <span
                key={b.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  color: '#e2e8f0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{b.label}</span>
                <strong style={{ color: '#38bdf8' }}>({badgesCount[b.id] || 0})</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Feed Ulasan & Testimoni Anak Kost */}
      <div className="card glass-panel" style={{ padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'white' }}>
          Daftar Testimoni & Review Masuk ({ratingsList.length})
        </h4>

        {ratingsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
            <MessageSquare size={36} color="#64748b" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ margin: '0 0 4px', color: 'white' }}>Belum Ada Ulasan Masuk</h4>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>
              Saat komplain fasilitas diselesaikan, anak kost akan diarahkan untuk memberikan penilaian dan tip apresiasi.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ratingsList.map(r => (
              <div
                key={r.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star key={st} size={13} fill={st <= r.rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                      ))}
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>
                      {r.tenantName || 'Penghuni'} {r.kamar ? `(Kamar ${r.kamar})` : ''}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      • {new Date(r.ratedAt || r.date).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  {r.tipAmount > 0 && (
                    <span style={{
                      fontSize: '0.74rem',
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700
                    }}>
                      💸 Tip: Rp {Number(r.tipAmount).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                {r.badges?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                    {r.badges.map((b, i) => (
                      <span key={i} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                {r.review && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{r.review}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
