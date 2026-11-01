import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Clock, 
  Wrench, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  Eye,
  X,
  Share2,
  UserCheck,
  Star,
  Sparkles,
  DollarSign,
  CheckSquare,
  Upload,
  Calendar,
  Layers
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  apiGetComplaints, 
  apiUpdateComplaintStatus,
  apiGetOwnerStaff,
  apiAssignComplaintToStaff,
  apiResolveComplaintWithProof
} from '../services/api';

const Komplain = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'diproses', 'selesai'
  const [activePhoto, setActivePhoto] = useState(null);
  const [staffList, setStaffList] = useState([]);

  // Assignment Modal State
  const [assignModalComplaint, setAssignModalComplaint] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState('Teknisi Listrik & Air');
  const [scheduledDate, setScheduledDate] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Resolution with Proof Photo Modal State
  const [resolveModalComplaint, setResolveModalComplaint] = useState(null);
  const [resolvedPhotoPreview, setResolvedPhotoPreview] = useState(null);
  const [resolvedNotes, setResolvedNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await apiGetComplaints(user?.kostUid, user?.role === 'user' ? user.id : null);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (user?.role === 'user') return;
    try {
      const s = await apiGetOwnerStaff(null, user?.id);
      setStaffList(Array.isArray(s) ? s : []);
    } catch (err) {
      console.warn('Could not load staff list for assignment:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComplaints();
      fetchStaff();
    }
  }, [user]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiUpdateComplaintStatus(id, newStatus);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status komplain');
    }
  };

  const handleOpenAssignModal = (complaint) => {
    setAssignModalComplaint(complaint);
    setSelectedStaffId(complaint.assignedStaffId ? String(complaint.assignedStaffId) : (staffList[0]?.id ? String(staffList[0].id) : ''));
    setSelectedStaffRole(complaint.assignedStaffRole || 'Teknisi Listrik & Air');
    setScheduledDate(complaint.scheduledDate || new Date().toISOString().split('T')[0]);
    setAssignmentNote(complaint.assignmentNote || '');
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      alert('Pilih staf teknisi/penjaga yang akan ditugaskan');
      return;
    }
    const staffObj = staffList.find(s => String(s.id) === String(selectedStaffId));
    setAssigning(true);
    try {
      await apiAssignComplaintToStaff(assignModalComplaint.id, {
        staffId: selectedStaffId,
        staffName: staffObj?.name || 'Staf Lapangan',
        staffRole: selectedStaffRole,
        scheduledDate,
        note: assignmentNote
      });
      setAssignModalComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Gagal menugaskan komplain');
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenResolveModal = (complaint) => {
    setResolveModalComplaint(complaint);
    setResolvedPhotoPreview(null);
    setResolvedNotes('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar (maksimal 8MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setResolvedPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!resolvedPhotoPreview) {
      alert('Harap unggah foto bukti pengerjaan/hasil perbaikan fasilitas');
      return;
    }
    setResolving(true);
    try {
      await apiResolveComplaintWithProof(resolveModalComplaint.id, {
        staffId: resolveModalComplaint.assignedStaffId || user?.id,
        staffName: resolveModalComplaint.assignedStaffName || user?.name || 'Teknisi Lapangan',
        resolvedPhoto: resolvedPhotoPreview,
        resolvedNotes: resolvedNotes || 'Fasilitas selesai diperbaiki dan siap digunakan kembali'
      });
      setResolveModalComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Gagal menyelesaikan komplain');
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="badge badge-warning"><Clock size={12}/> Menunggu</span>;
      case 'diproses': 
        return <span className="badge badge-primary"><Wrench size={12}/> Diproses</span>;
      case 'selesai': 
        return <span className="badge badge-success"><CheckCircle size={12}/> Selesai</span>;
      default: 
        return null;
    }
  };

  const handleForwardToTechnician = (complaint) => {
    const message = `*Laporan Komplain Penghuni Kost*\n` +
      `Kamar: *${complaint.kamar}*\n` +
      `Penghuni: *${complaint.userName}*\n` +
      `Masalah: "${complaint.text}"\n` +
      `Tanggal: ${new Date(complaint.date).toLocaleDateString('id-ID')}\n\n` +
      `Mohon tim teknisi segera memeriksa fasilitas terkait. Terima kasih.`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filtered = complaints.filter(c => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Pusat Keluhan & Komplain</h1>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              ⚡ Disposisi Kalender Staf & Rating
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Disposisi komplain fasilitas ke kalender staf, unggah foto bukti before-after, dan monitor ulasan serta tip apresiasi anak kost.
          </p>
        </div>

        <button 
          onClick={fetchComplaints} 
          className="btn btn-secondary btn-sm"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        {[
          { key: 'all', label: `Semua (${complaints.length})` },
          { key: 'pending', label: `Menunggu (${complaints.filter(c => c.status === 'pending').length})` },
          { key: 'diproses', label: `Diproses (${complaints.filter(c => c.status === 'diproses').length})` },
          { key: 'selesai', label: `Selesai (${complaints.filter(c => c.status === 'selesai').length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: statusFilter === tab.key ? 'var(--accent-primary)' : 'transparent',
              color: statusFilter === tab.key ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaint List */}
      <div>
        {filtered.length === 0 ? (
          <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={40} style={{ margin: '0 auto 10px', color: 'var(--accent-success)' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Tidak ada komplain aktif saat ini.</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>Semua fasilitas dan kamar dalam kondisi optimal.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filtered.map(c => (
              <div 
                key={c.id}
                className="card glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  padding: '1.25rem',
                  borderLeft: `4px solid ${c.status === 'selesai' ? 'var(--accent-success)' : c.status === 'diproses' ? 'var(--accent-primary)' : 'var(--accent-warning)'}`
                }}
              >
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                    
                    {/* Photos Thumbnail: Before & After */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {/* Photo Before */}
                      {c.photo ? (
                        <button
                          type="button"
                          onClick={() => setActivePhoto({ url: c.photo, title: `Kamar ${c.kamar} - ${c.userName} (Keluhan Awal)`, text: c.text })}
                          style={{
                            background: 'none',
                            border: '2px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '12px',
                            padding: 0,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            width: '74px',
                            height: '74px',
                            position: 'relative',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                          }}
                          title="Foto keluhan awal (Before)"
                        >
                          <img src={c.photo} alt="Bukti Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fbbf24',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '1px 0'
                          }}>
                            BEFORE
                          </div>
                        </button>
                      ) : (
                        <div style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)'
                        }}>
                          <MessageSquare size={20} />
                        </div>
                      )}

                      {/* Photo After (if resolved) */}
                      {c.resolvedPhoto && (
                        <button
                          type="button"
                          onClick={() => setActivePhoto({ url: c.resolvedPhoto, title: `Hasil Perbaikan Kamar ${c.kamar} (Oleh ${c.resolvedByStaffName || 'Teknisi'})`, text: c.resolvedNotes || 'Perbaikan selesai.' })}
                          style={{
                            background: 'none',
                            border: '2px solid rgba(16, 185, 129, 0.6)',
                            borderRadius: '12px',
                            padding: 0,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            width: '74px',
                            height: '74px',
                            position: 'relative',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                          }}
                          title="Foto hasil pengerjaan (After)"
                        >
                          <img src={c.resolvedPhoto} alt="Foto Selesai" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(16, 185, 129, 0.85)',
                            color: 'white',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            textAlign: 'center',
                            padding: '1px 0'
                          }}>
                            AFTER ✓
                          </div>
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">Kamar {c.kamar}</span>
                        <strong style={{ fontSize: '1rem' }}>{c.userName}</strong>
                        {getStatusBadge(c.status)}

                        {/* Assigned Staff Tag */}
                        {c.assignedStaffName && (
                          <span style={{
                            fontSize: '0.72rem',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Wrench size={11} color="#60a5fa" />
                            Teknisi: <strong>{c.assignedStaffName}</strong>
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        "{c.text}"
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <span>
                          Dilaporkan: {new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {c.scheduledDate && (
                          <span style={{ color: '#38bdf8' }}>
                            📅 Jadwal: {c.scheduledDate}
                          </span>
                        )}
                        {c.resolvedAt && (
                          <span style={{ color: '#34d399' }}>
                            ✅ Selesai: {new Date(c.resolvedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Owner & Staff */}
                  {user?.role !== 'user' && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleForwardToTechnician(c)}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '4px', fontSize: '0.76rem', padding: '6px 10px' }}
                        title="Kirim detail komplain ini ke kontak WhatsApp teknisi / tukang"
                      >
                        <Share2 size={12} /> WA Teknisi
                      </button>

                      {/* Tombol Tugaskan ke Staf */}
                      {c.status !== 'selesai' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(c)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            gap: '4px',
                            fontSize: '0.76rem',
                            padding: '6px 10px',
                            color: '#93c5fd',
                            border: '1px solid rgba(59, 130, 246, 0.4)'
                          }}
                          title="Tugaskan penanganan komplain ini ke salah satu karyawan/teknisi"
                        >
                          <UserCheck size={13} /> {c.assignedStaffName ? 'Ubah Penugasan' : 'Tugaskan Staf'}
                        </button>
                      )}

                      {/* Tombol Selesaikan & Upload Foto Bukti */}
                      {c.status !== 'selesai' && (
                        <button 
                          onClick={() => handleOpenResolveModal(c)}
                          className="btn btn-success btn-sm"
                          style={{ gap: '4px', fontSize: '0.76rem', padding: '6px 12px' }}
                          title="Upload foto hasil perbaikan untuk menyelesaikan tiket ini"
                        >
                          <Camera size={13} /> Selesaikan + Foto Bukti
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating & Ulasan Anak Kost Section (if rated) */}
                {c.ratingData && (
                  <div style={{
                    marginTop: '4px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 800 }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              size={14} 
                              fill={star <= (c.ratingData.rating || 5) ? '#fbbf24' : 'none'} 
                              color="#fbbf24" 
                            />
                          ))}
                        </div>
                        <span>{c.ratingData.rating}.0 / 5.0</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.74rem' }}>
                          • Dinilai oleh {c.ratingData.tenantName || c.userName} (Kamar {c.kamar})
                        </span>
                      </div>

                      {c.ratingData.tipAmount > 0 && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          💸 Tip Diterima Staf: Rp {Number(c.ratingData.tipAmount).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    {c.ratingData.badges?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                        {c.ratingData.badges.map((b, i) => (
                          <span 
                            key={i} 
                            style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              background: 'rgba(255, 255, 255, 0.08)', 
                              color: '#f8fafc',
                              fontWeight: 600,
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}

                    {c.ratingData.review && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{c.ratingData.review}"
                      </p>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: TUGASKAN KE STAF (DISPOSISI KOMPLAIN) */}
      {assignModalComplaint && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '18px',
            padding: '1.5rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Disposisi Tugas Komplain</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Kamar {assignModalComplaint.kamar} • {assignModalComplaint.userName}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setAssignModalComplaint(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Pilih Staf Lapangan / Teknisi:
                </label>
                {staffList.length === 0 ? (
                  <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.78rem', color: '#f87171' }}>
                    Belum ada akun karyawan yang terdaftar. Tambahkan karyawan terlebih dahulu di menu <strong>Karyawan</strong>.
                  </div>
                ) : (
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '10px 12px' }}
                    required
                  >
                    <option value="">-- Pilih Staf --</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.jobTitle || 'Staf Lapangan'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Kategori Tugas / Keahlian:
                </label>
                <select
                  value={selectedStaffRole}
                  onChange={(e) => setSelectedStaffRole(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="Teknisi Listrik & Air">🔧 Teknisi Listrik & Air (Pompa/Kran/MCB)</option>
                  <option value="Petugas Kebersihan">🧹 Petugas Kebersihan & Sanitasi Kamar</option>
                  <option value="Penjaga Kost">🏠 Penjaga Kost (General Maintenance)</option>
                  <option value="Keamanan & Kunci">🛡️ Keamanan & Kunci Pintu / Gembok</option>
                  <option value="Ganti Sprei & Linen">🛏️ Ganti Sprei & Kasur</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Tanggal Pengerjaan Target:
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Catatan Instruksi untuk Staf:
                </label>
                <textarea
                  rows="3"
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="Contoh: Bawa kunci pas 12 dan seal cadangan. Cek rembesan bawah wastafel."
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setAssignModalComplaint(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={assigning || staffList.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', gap: '6px' }}
                >
                  {assigning ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
                  {assigning ? 'Menugaskan...' : 'Tugaskan ke Kalender Staf'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: SELESAIKAN KOMPLAIN DENGAN BUKTI FOTO (BEFORE - AFTER) */}
      {resolveModalComplaint && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '18px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Upload Foto Bukti Perbaikan</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Kamar {resolveModalComplaint.kamar} • "{resolveModalComplaint.text}"
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setResolveModalComplaint(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Foto Hasil Pengerjaan Selesai (After-Repair Photo):
                </label>
                
                {resolvedPhotoPreview ? (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(16, 185, 129, 0.5)', maxHeight: '220px' }}>
                    <img 
                      src={resolvedPhotoPreview} 
                      alt="Hasil Perbaikan" 
                      style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} 
                    />
                    <button
                      type="button"
                      onClick={() => setResolvedPhotoPreview(null)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '2rem 1rem',
                    border: '2px dashed rgba(16, 185, 129, 0.4)',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.04)',
                    cursor: 'pointer'
                  }}>
                    <Camera size={28} color="#34d399" />
                    <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                      Ambil Foto / Upload Bukti Selesai
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Mendukung kamera HP atau galeri foto
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      style={{ display: 'none' }} 
                      required
                    />
                  </label>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Catatan Hasil Pengerjaan untuk Penghuni:
                </label>
                <textarea
                  rows="3"
                  value={resolvedNotes}
                  onChange={(e) => setResolvedNotes(e.target.value)}
                  placeholder="Contoh: Kran wastafel telah diganti baru, pipa tidak bocor lagi, dan area sudah dipel bersih."
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: '#6ee7b7'
              }}>
                ✨ Foto ini otomatis tersimpan di kalender kerja harian staf dan langsung muncul di dashboard anak kost agar mereka dapat memberikan ulasan & tip apresiasi.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setResolveModalComplaint(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resolving || !resolvedPhotoPreview}
                  className="btn btn-success"
                  style={{ padding: '8px 18px', gap: '6px' }}
                >
                  {resolving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {resolving ? 'Menyimpan...' : 'Tandai Selesai & Simpan Bukti'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox Zoom Modal for Photo Inspection */}
      {activePhoto && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            position: 'relative',
            background: '#090e1a',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '20px',
            padding: '1.25rem',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: 0, color: 'white', fontSize: '1.05rem' }}>{activePhoto.title}</h4>
                <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>"{activePhoto.text}"</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', textAlign: 'center', borderRadius: '12px', background: '#030712' }}>
              <img 
                src={activePhoto.url} 
                alt="Foto Kerusakan Penuh" 
                style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Komplain;
