import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  Clock, 
  Trash2, 
  Filter, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Sparkles,
  Eye,
  Wrench,
  ShieldCheck,
  Check
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  apiGetStaffWorkLogs, 
  apiSubmitWorkLog, 
  apiDeleteWorkLog, 
  apiGetOwnerStaff 
} from '../services/api';

const WORK_CATEGORIES = [
  { id: 'Kebersihan', label: '🧹 Kebersihan & Sapu/Pel', color: '#10b981' },
  { id: 'Perbaikan', label: '🔧 Perbaikan & Servis Teknisi', color: '#f59e0b' },
  { id: 'Ganti Sprei', label: '🛏️ Ganti Sprei & Linen', color: '#8b5cf6' },
  { id: 'Cek Meteran', label: '⚡ Cek Meteran PLN / Air PDAM', color: '#3b82f6' },
  { id: 'Keamanan', label: '🛡️ Keamanan, Kunci & Ronda Malam', color: '#ec4899' },
  { id: 'Fasilitas Kost', label: '🏢 Pengecekan Fasilitas Umum Kost', color: '#14b8a6' }
];

export default function StaffWorkLogsTab({ user, currentKostUid }) {
  const [logsList, setLogsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  // Modal State for Upload Work Log
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalStaffId, setModalStaffId] = useState('');
  const [category, setCategory] = useState('Kebersihan');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, logsRes] = await Promise.all([
        apiGetOwnerStaff(currentKostUid, user?.id).catch(() => []),
        apiGetStaffWorkLogs({
          ownerId: user?.id,
          kostUid: currentKostUid,
          date: selectedDate || undefined,
          staffId: selectedStaffId || undefined
        }).catch(() => [])
      ]);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      setLogsList(Array.isArray(logsRes) ? logsRes : []);
    } catch (err) {
      console.error('Failed to load work logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedStaffId, currentKostUid, user?.id]);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung deteksi GPS.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy)
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setGpsError('Gagal mendeteksi koordinat GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleOpenUploadModal = () => {
    setModalStaffId(selectedStaffId || (staffList[0]?.id ? String(staffList[0].id) : ''));
    setCategory('Kebersihan');
    setTitle('');
    setDescription('');
    setPhotoPreview(null);
    setGpsLocation(null);
    setGpsError(null);
    requestGps();
    setShowUploadModal(true);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const scale = MAX_WIDTH / img.width;
        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scale : img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setPhotoPreview(compressed);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWorkLog = async (e) => {
    e.preventDefault();
    if (!modalStaffId || !photoPreview || !title.trim()) {
      alert('Harap pilih karyawan, judul pekerjaan, dan sertakan foto bukti hasil kerja.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiSubmitWorkLog({
        staffId: modalStaffId,
        ownerId: user?.id,
        kostUid: currentKostUid,
        category,
        title: title.trim(),
        description: description.trim(),
        photo: photoPreview,
        lat: gpsLocation?.lat || null,
        lng: gpsLocation?.lng || null
      });

      setShowUploadModal(false);
      setActionMsg(res.message || 'Laporan pekerjaan harian berhasil diunggah!');
      fetchData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal mengunggah foto kerja: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id, taskTitle) => {
    if (!window.confirm(`Hapus laporan foto kerja: "${taskTitle}"?`)) return;
    try {
      await apiDeleteWorkLog(id);
      setLogsList(prev => prev.filter(l => l.id !== id));
      setActionMsg('🗑️ Laporan foto kerja berhasil dihapus.');
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal menghapus laporan: ' + err.message);
    }
  };

  const filteredLogs = logsList.filter(l => {
    if (selectedCategory && l.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Filter & Action Bar */}
      <div className="card glass-panel" style={{
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Pilih Tanggal:
            </label>
            <input 
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '6px 12px', height: '38px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Filter Karyawan:
            </label>
            <select
              className="input-field"
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '6px 12px', height: '38px', minWidth: '170px' }}
            >
              <option value="">Semua Karyawan ({staffList.length})</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.jobTitle || 'Staf'})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Kategori Tugas:
            </label>
            <select
              className="input-field"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '6px 12px', height: '38px' }}
            >
              <option value="">Semua Kategori</option>
              {WORK_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleOpenUploadModal}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
          >
            <Camera size={14} />
            <span>+ Upload Laporan Foto Kerja</span>
          </button>

          <button
            onClick={fetchData}
            className="btn btn-secondary btn-sm"
            title="Muat ulang laporan kerja"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {actionMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Gallery / Feed Cards */}
      {loading ? (
        <div className="card glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Memuat laporan foto kerja harian...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Camera size={42} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px 0', color: 'white' }}>Belum Ada Laporan Foto Kerja pada Tanggal {selectedDate}</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '480px', marginInline: 'auto' }}>
            Karyawan wajib mengunggah foto bukti pekerjaan tiap hari (kebersihan, perawatan pipa/pompa, ganti sprei, cek meteran, ronda malam) agar Owner dapat memantau dengan transparan.
          </p>
          <button
            onClick={handleOpenUploadModal}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '1.25rem', gap: '6px' }}
          >
            <Camera size={14} /> Ambil & Upload Foto Kerja
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredLogs.map(log => {
            const cat = WORK_CATEGORIES.find(c => c.id === log.category) || { color: '#60a5fa', label: log.category };

            return (
              <div 
                key={log.id}
                className="card glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  padding: 0
                }}
              >
                {/* Photo Header */}
                <div 
                  onClick={() => setPreviewPhoto(log.photo)}
                  style={{
                    position: 'relative',
                    height: '210px',
                    width: '100%',
                    background: '#090d16',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                  title="Klik untuk memperbesar foto"
                >
                  <img 
                    src={log.photo}
                    alt={log.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(6px)',
                    color: cat.color,
                    border: `1px solid ${cat.color}60`,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {log.category}
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(6px)',
                    color: '#e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={12} />
                    <span>{log.time || 'Waktu Kerja'}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'white', fontWeight: 700 }}>
                      {log.title}
                    </h4>
                    {log.description && (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {log.description}
                      </p>
                    )}
                  </div>

                  {/* Staff & Kost Tag */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div>
                      Oleh: <strong style={{ color: 'white' }}>{log.staffName}</strong>
                    </div>
                    <span>{log.kostName}</span>
                  </div>

                  {/* GPS & Owner Check Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                    {log.lat && log.lng ? (
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> GPS Terverifikasi
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Foto Area Kost</span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewPhoto(log.photo)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', gap: '4px' }}
                        title="Buka foto besar"
                      >
                        <Eye size={12} /> Detail
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id, log.title)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Hapus foto laporan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: UPLOAD WORK LOG */}
      {showUploadModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          overflowY: 'auto',
          zIndex: 999999,
          padding: '1.25rem'
        }}>
          <div className="card glass-panel" style={{
            margin: 'auto',
            maxWidth: '500px',
            width: '100%',
            padding: '1.75rem',
            border: '1px solid var(--border-light)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  📸 Upload Laporan Foto Kerja
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Ambil foto bukti pekerjaan harian untuk dipantau oleh Owner
                </span>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitWorkLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Select Staff */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Karyawan Pelaksana *
                </label>
                <select
                  className="input-field"
                  required
                  value={modalStaffId}
                  onChange={e => setModalStaffId(e.target.value)}
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.jobTitle || 'Staf'})</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Kategori Tugas / Bidang Kerja *
                </label>
                <select
                  className="input-field"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  {WORK_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Judul Pekerjaan yang Dikerjakan *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Pembersihan Koridor Lt.2 & Kuras Toren Air"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Keterangan / Catatan Pengerjaan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Keran air nomor 4 sudah diganti sil karetnya, lantai sudah disapu dan dipel bersih."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Photo Upload / Capture Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Foto Bukti Hasil Kerja (Wajib) *
                </label>

                {photoPreview ? (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #10b981' }}>
                    <img 
                      src={photoPreview} 
                      alt="Preview Kerja" 
                      style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '6px',
                        cursor: 'pointer'
                      }}
                      title="Ambil ulang foto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      padding: '1.75rem 1rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={34} color="#60a5fa" style={{ margin: '0 auto 6px' }} />
                    <p style={{ margin: '0 0 2px', fontWeight: 600, color: 'white', fontSize: '0.88rem' }}>
                      Klik untuk Ambil Foto Kamera / Pilih File
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Foto sudut ruangan, fasilitas yang diperbaiki, atau hasil bersih-bersih
                    </span>
                  </div>
                )}

                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                />
              </div>

              {/* GPS status notice */}
              <div style={{ fontSize: '0.75rem', color: gpsLocation ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} />
                <span>
                  {gpsLocation ? `Koordinat GPS terkunci: ${gpsLocation.lat}, ${gpsLocation.lng}` : gpsError ? gpsError : 'Mendeteksi koordinat lokasi pengerjaan...'}
                </span>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !photoPreview}
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  {submitting ? 'Mengunggah...' : 'Upload Laporan Kerja'}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* FULL PHOTO VIEWER MODAL */}
      {previewPhoto && createPortal(
        <div 
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '1rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '700px', width: '100%', textAlign: 'center' }}>
            <img 
              src={previewPhoto} 
              alt="Bukti Pekerjaan" 
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}
            />
            <p style={{ color: 'white', marginTop: '10px', fontSize: '0.85rem' }}>Klik di mana saja untuk menutup</p>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
