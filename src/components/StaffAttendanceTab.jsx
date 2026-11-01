import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  User, 
  RefreshCw, 
  Upload, 
  X, 
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { apiGetStaffAttendance, apiCheckInStaff, apiCheckOutStaff, apiGetOwnerStaff } from '../services/api';

export default function StaffAttendanceTab({ user, currentKostUid }) {
  const [attendanceList, setAttendanceList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  // Modal State for Check-in / Check-out
  const [modalType, setModalType] = useState(null); // 'checkIn' | 'checkOut' | null
  const [modalStaffId, setModalStaffId] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState(null);

  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, attRes] = await Promise.all([
        apiGetOwnerStaff(currentKostUid, user?.id).catch(() => []),
        apiGetStaffAttendance({ ownerId: user?.id, kostUid: currentKostUid, date: selectedDate }).catch(() => [])
      ]);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      setAttendanceList(Array.isArray(attRes) ? attRes : []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, currentKostUid, user?.id]);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung deteksi lokasi GPS.');
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
      (err) => {
        setGpsLoading(false);
        setGpsError('Gagal mendeteksi lokasi GPS. Pastikan izin lokasi aktif pada perangkat.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleOpenAttendanceModal = (type, staffId = '') => {
    setModalType(type);
    setModalStaffId(staffId || (staffList[0]?.id ? String(staffList[0].id) : ''));
    setPhotoPreview(null);
    setGpsLocation(null);
    setGpsError(null);
    requestGps();
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // Create an image to compress if needed
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const scale = MAX_WIDTH / img.width;
        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scale : img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setPhotoPreview(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAttendance = async () => {
    if (!modalStaffId) {
      alert('Pilih karyawan terlebih dahulu.');
      return;
    }
    if (!photoPreview) {
      alert('Harap ambil atau unggah foto selfie di dekat area kost.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        staffId: modalStaffId,
        photo: photoPreview,
        lat: gpsLocation?.lat || null,
        lng: gpsLocation?.lng || null,
        locationName: gpsLocation ? `Lat: ${gpsLocation.lat}, Lng: ${gpsLocation.lng} (Akurasi ±${gpsLocation.accuracy}m)` : 'Area Sekitar Kost',
        kostUid: currentKostUid
      };

      let res;
      if (modalType === 'checkIn') {
        res = await apiCheckInStaff(payload);
      } else {
        res = await apiCheckOutStaff(payload);
      }

      setMessage({ type: 'success', text: res.message || 'Absensi berhasil diverifikasi!' });
      setModalType(null);
      fetchData();
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      alert('Gagal mencatat absensi: ' + (err.message || 'Error server'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAttendance = attendanceList.filter(a => {
    if (selectedStaffId && String(a.staffId) !== String(selectedStaffId)) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Controls Bar */}
      <div className="card glass-panel" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '1.1rem 1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Pilih Tanggal Absensi:
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
              style={{ fontSize: '0.85rem', padding: '6px 12px', height: '38px', minWidth: '180px' }}
            >
              <option value="">Semua Karyawan ({staffList.length})</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.jobTitle || 'Staf'})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenAttendanceModal('checkIn')}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
          >
            <Camera size={14} />
            <span>Absen Masuk (Foto + GPS)</span>
          </button>

          <button
            onClick={() => handleOpenAttendanceModal('checkOut')}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
          >
            <Clock size={14} />
            <span>Absen Selesai Kerja</span>
          </button>

          <button
            onClick={fetchData}
            className="btn btn-secondary btn-sm"
            title="Muat ulang absensi"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: message.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Attendance List */}
      {loading ? (
        <div className="card glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Memuat log absensi karyawan...
        </div>
      ) : filteredAttendance.length === 0 ? (
        <div className="card glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Clock size={36} color="#64748b" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ margin: '0 0 6px 0', color: 'white' }}>Belum Ada Data Absensi pada Tanggal {selectedDate}</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '460px', marginInline: 'auto' }}>
            Karyawan belum melakukan absen masuk dengan foto selfie dan GPS di dekat kost pada hari ini.
          </p>
          <button
            onClick={() => handleOpenAttendanceModal('checkIn')}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '1rem', gap: '6px' }}
          >
            <Camera size={14} /> Catat Absen Hari Ini
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAttendance.map(att => (
            <div 
              key={att.id}
              className="card glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                border: '1px solid var(--border-color)',
                borderRadius: '16px'
              }}
            >
              {/* Card Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1.1rem'
                  }}>
                    {att.staffName ? att.staffName.charAt(0).toUpperCase() : 'K'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'white' }}>{att.staffName}</strong>
                      <span className={`badge ${att.status === 'completed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                        {att.status === 'completed' ? '✓ Masuk & Selesai' : 'Sedang Masuk Kerja'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Tanggal: <strong>{new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> • Cabang: {att.kostName}
                    </span>
                  </div>
                </div>

                {att.checkOut?.workDurationHours > 0 && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#93c5fd',
                    fontWeight: 700
                  }}>
                    Total Jam Kerja: {att.checkOut.workDurationHours} Jam
                  </div>
                )}
              </div>

              {/* Attendance Details Grid: Masuk vs Selesai */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                
                {/* Check In Box */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  gap: '12px'
                }}>
                  {att.checkIn?.photo ? (
                    <img 
                      src={att.checkIn.photo}
                      alt="Foto Masuk"
                      onClick={() => setPreviewPhotoModal(att.checkIn.photo)}
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: '1.5px solid #10b981',
                        flexShrink: 0
                      }}
                      title="Klik untuk memperbesar foto masuk"
                    />
                  ) : (
                    <div style={{ width: '74px', height: '74px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={24} color="#64748b" />
                    </div>
                  )}

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                      <CheckCircle size={14} /> Jam Masuk: {att.checkIn?.time || '-'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="#38bdf8" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {att.checkIn?.locationName || 'Lokasi Dekat Kost'}
                      </span>
                    </div>
                    {att.checkIn?.lat && att.checkIn?.lng && (
                      <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
                        GPS: {att.checkIn.lat}, {att.checkIn.lng} 
                        {att.checkIn.distanceMeters !== null && ` • Jarak: ~${att.checkIn.distanceMeters}m`}
                        {att.checkIn.isNearKost && <span style={{ color: '#34d399', fontWeight: 700 }}> (✓ Radius Kost)</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Check Out Box */}
                <div style={{
                  background: att.checkOut ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: att.checkOut ? '1px solid rgba(59, 130, 246, 0.25)' : '1px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  gap: '12px'
                }}>
                  {att.checkOut?.photo ? (
                    <img 
                      src={att.checkOut.photo}
                      alt="Foto Selesai"
                      onClick={() => setPreviewPhotoModal(att.checkOut.photo)}
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: '1.5px solid #3b82f6',
                        flexShrink: 0
                      }}
                      title="Klik untuk memperbesar foto selesai"
                    />
                  ) : (
                    <div style={{ width: '74px', height: '74px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={24} color="#64748b" />
                    </div>
                  )}

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: att.checkOut ? '#60a5fa' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <Clock size={14} /> Jam Selesai: {att.checkOut?.time || 'Belum Selesai'}
                    </div>
                    {att.checkOut ? (
                      <>
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#38bdf8" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {att.checkOut?.locationName || 'Lokasi Dekat Kost'}
                          </span>
                        </div>
                        {att.checkOut?.lat && att.checkOut?.lng && (
                          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
                            GPS: {att.checkOut.lat}, {att.checkOut.lng}
                            {att.checkOut.distanceMeters !== null && ` • Jarak: ~${att.checkOut.distanceMeters}m`}
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Karyawan belum melakukan absensi selesai kerja hari ini.
                      </p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL: CHECK-IN / CHECK-OUT DIALOG */}
      {modalType && createPortal(
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
            maxWidth: '480px',
            width: '100%',
            padding: '1.75rem',
            border: '1px solid var(--border-light)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  {modalType === 'checkIn' ? '📸 Absensi Masuk Karyawan' : '🏁 Absensi Selesai Kerja'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Wajib foto di dekat kost dengan GPS lokasi aktif
                </span>
              </div>
              <button 
                onClick={() => setModalType(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Select Staff */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Pilih Karyawan:
                </label>
                <select
                  className="input-field"
                  value={modalStaffId}
                  onChange={e => setModalStaffId(e.target.value)}
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.jobTitle || 'Staf'})</option>
                  ))}
                </select>
              </div>

              {/* GPS Live Status Box */}
              <div style={{
                background: gpsLocation ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                border: gpsLocation ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: gpsLocation ? '#34d399' : 'white' }}>
                    <Compass size={15} />
                    {gpsLocation ? 'GPS Lokasi Aktif & Terkunci' : 'Mendeteksi Lokasi GPS...'}
                  </span>
                  <button 
                    type="button"
                    onClick={requestGps}
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    {gpsLoading ? 'Mencari...' : 'Perbarui GPS'}
                  </button>
                </div>

                {gpsLocation ? (
                  <div style={{ color: '#cbd5e1' }}>
                    Koordinat: {gpsLocation.lat}, {gpsLocation.lng} (Akurasi: ±{gpsLocation.accuracy}m)
                  </div>
                ) : gpsError ? (
                  <div style={{ color: '#f87171' }}>{gpsError}</div>
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>Meminta izin koordinat GPS dari perangkat Anda...</div>
                )}
              </div>

              {/* Photo Capture Area */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Foto Selfie di Dekat Kost (Wajib):
                </label>

                {photoPreview ? (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #10b981' }}>
                    <img 
                      src={photoPreview} 
                      alt="Preview Absensi" 
                      style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
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
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Camera size={38} color="#60a5fa" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>
                      Klik untuk Ambil Foto Kamera Selfie
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Gunakan kamera depan atau pilih foto wajah di depan kost
                    </span>
                  </div>
                )}

                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalType(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting || !photoPreview}
                  onClick={handleSubmitAttendance}
                  style={{ flex: 1, background: modalType === 'checkIn' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--accent-gradient)' }}
                >
                  {submitting ? 'Menyimpan...' : modalType === 'checkIn' ? 'Konfirmasi Masuk' : 'Konfirmasi Selesai'}
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FULL PREVIEW PHOTO MODAL */}
      {previewPhotoModal && createPortal(
        <div 
          onClick={() => setPreviewPhotoModal(null)}
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
          <div style={{ position: 'relative', maxWidth: '640px', width: '100%', textAlign: 'center' }}>
            <img 
              src={previewPhotoModal} 
              alt="Bukti Absensi" 
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
