import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Pin, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Wrench, 
  Shield, 
  Calendar, 
  Info, 
  Check, 
  X, 
  Search, 
  Filter, 
  RefreshCw 
} from 'lucide-react';
import { apiGetBulletinPosts, apiCreateBulletinPost, apiDeleteBulletinPost } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const CATEGORY_MAP = {
  semua: { label: 'Semua Info', icon: Megaphone, color: '#38bdf8' },
  pemeliharaan: { label: 'Pemeliharaan', icon: Wrench, color: '#f59e0b' },
  keamanan: { label: 'Keamanan', icon: Shield, color: '#ef4444' },
  acara: { label: 'Acara & Kumpul', icon: Calendar, color: '#a855f7' },
  umum: { label: 'Info Umum', icon: Info, color: '#10b981' }
};

export default function CommunityBulletinBoard({ user, kostUid, isCompact = false }) {
  const { isLight } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New post form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('pemeliharaan');
  const [newContent, setNewContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const isOwnerOrStaff = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'admin';

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await apiGetBulletinPosts(kostUid || user?.kostUid);
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch bulletin posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [kostUid, user?.kostUid]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Judul dan isi pengumuman wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateBulletinPost({
        kostUid: kostUid || user?.kostUid || null,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        author: user?.name || (user?.role === 'owner' ? 'Pemilik Kost' : 'Pengelola Kost'),
        authorRole: user?.role === 'owner' ? 'Owner Kost' : (user?.jobTitle || 'Staf Lapangan'),
        isPinned: Boolean(isPinned),
        isUrgent: Boolean(isUrgent)
      });

      setNewTitle('');
      setNewContent('');
      setNewCategory('pemeliharaan');
      setIsPinned(false);
      setIsUrgent(false);
      setShowCreateModal(false);
      await fetchPosts();
    } catch (err) {
      alert('Gagal membuat pengumuman: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id, title) => {
    if (!window.confirm(`Hapus pengumuman "${title}"?`)) return;
    try {
      await apiDeleteBulletinPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Gagal menghapus pengumuman: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchCategory = activeCategory === 'semua' || post.category === activeCategory;
    const matchSearch = (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (post.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: 'white',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)'
          }}>
            <Megaphone size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
              Mading Digital Kost (Community Bulletin)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Papan informasi resmi, jadwal servis fasilitas (WiFi & Toren), tata tertib, dan kabar komunitas anak kost
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchPosts}
            className="btn btn-secondary btn-sm"
            title="Segarkan pengumuman"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {isOwnerOrStaff && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', padding: '8px 16px', fontWeight: 700 }}
            >
              <Plus size={15} /> Buat Pengumuman Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter and search bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Category tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {Object.entries(CATEGORY_MAP).map(([key, item]) => {
            const Icon = item.icon;
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? item.color : 'transparent',
                  color: isActive ? '#0f172a' : '#94a3b8',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Memuat pengumuman mading...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Megaphone size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h4 style={{ color: '#cbd5e1', margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>Belum Ada Pengumuman</h4>
          <p style={{ margin: 0, fontSize: '0.82rem' }}>
            {searchQuery ? 'Tidak ada pengumuman yang sesuai dengan kata kunci pencarian.' : 'Papan mading masih bersih. Belum ada pengumuman baru untuk kost ini.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1rem'
        }}>
          {filteredPosts.map(post => {
            const catInfo = CATEGORY_MAP[post.category] || CATEGORY_MAP.umum;
            const CatIcon = catInfo.icon;

            return (
              <div
                key={post.id}
                style={{
                  background: post.isPinned 
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                    : 'rgba(15, 23, 42, 0.75)',
                  border: post.isPinned 
                    ? '1.5px solid rgba(56, 189, 248, 0.45)' 
                    : (post.isUrgent ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'),
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  boxShadow: post.isPinned ? '0 10px 25px -5px rgba(56, 189, 248, 0.15)' : 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Badges bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {post.isPinned && (
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Pin size={11} /> PINNED
                      </span>
                    )}

                    {post.isUrgent && (
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <AlertCircle size={11} /> PENTING
                      </span>
                    )}

                    <span style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: catInfo.color,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CatIcon size={12} />
                      {catInfo.label}
                    </span>
                  </div>

                  {isOwnerOrStaff && (
                    <button
                      onClick={() => handleDeletePost(post.id, post.title)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        transition: 'color 0.2s'
                      }}
                      title="Hapus Pengumuman"
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Title */}
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white', lineHeight: '1.35' }}>
                  {post.title}
                </h4>

                {/* Content */}
                <p style={{
                  margin: 0,
                  fontSize: '0.84rem',
                  color: '#cbd5e1',
                  lineHeight: '1.55',
                  whiteSpace: 'pre-line'
                }}>
                  {post.content}
                </p>

                {/* Author & Footer */}
                <div style={{
                  marginTop: 'auto',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: '#64748b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      color: '#0f172a',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.62rem'
                    }}>
                      {(post.author || 'P')[0]}
                    </div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                      {post.author} <span style={{ opacity: 0.7 }}>({post.authorRole || 'Pengelola'})</span>
                    </span>
                  </div>

                  <span>
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }} className="animate-fade-in">
          <div style={{
            background: isLight ? '#ffffff' : '#0a101f',
            border: isLight ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: isLight ? '0 25px 65px rgba(0, 0, 0, 0.15)' : '0 25px 65px rgba(0, 0, 0, 0.85)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Megaphone size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
                  Buat Pengumuman Mading Baru
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Kategori Pengumuman:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                >
                  <option value="pemeliharaan">🔧 Pemeliharaan (WiFi, Toren Air, Listrik, Sampah)</option>
                  <option value="keamanan">🛡️ Keamanan & Jam Malam (Gembok Gerbang, Tamu)</option>
                  <option value="acara">📅 Acara & Komunitas (Makan Bersama, Buka Puasa, Bersih-bersih)</option>
                  <option value="umum">📢 Pengumuman Umum / Tata Tertib Kost</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Judul Pengumuman:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pemadaman Air Sementara & Kuras Toren (Sabtu 10:00)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Isi Pengumuman Lengkap:
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan detail waktu, antisipasi yang harus dilakukan anak kost, atau kontak penanggung jawab..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem', resize: 'vertical' }}
                />
              </div>

              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: isLight ? '#334155' : '#cbd5e1' }}>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  <span>📌 <strong>Sematkan di Paling Atas (Pinned Post)</strong></span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: isLight ? '#dc2626' : '#f87171' }}>
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <span>🚨 <strong>Tandai Sebagai Urgent / Penting</strong></span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.84rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2, fontSize: '0.84rem', fontWeight: 700 }}
                >
                  {submitting ? 'Memublikasikan...' : 'Terbitkan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
