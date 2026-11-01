import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Settings, 
  User, 
  FileText, 
  Paperclip, 
  Check, 
  X, 
  Sparkles,
  Info,
  CalendarCheck2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  apiGetStaffLeaves, 
  apiApplyLeave, 
  apiProcessLeave, 
  apiGetLeaveSettings, 
  apiUpdateLeaveSettings, 
  apiGetOwnerStaff 
} from '../services/api';

export default function StaffLeaveTab({ user, currentKostUid }) {
  const [leavesList, setLeavesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveQuota, setLeaveQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // Leave Ratio Settings State (Owner configurable)
  const [workDaysRequired, setWorkDaysRequired] = useState(20);
  const [leaveDaysEarned, setLeaveDaysEarned] = useState(2);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettingsCard, setShowSettingsCard] = useState(false);

  // Modal State for Apply Leave
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalStaffId, setModalStaffId] = useState('');
  const [leaveType, setLeaveType] = useState('cuti');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');
  const [attachmentPhoto, setAttachmentPhoto] = useState(null);

  // Review modal state
  const [reviewModalLeave, setReviewModalLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, leavesRes, settingsRes] = await Promise.all([
        apiGetOwnerStaff(currentKostUid, user?.id).catch(() => []),
        apiGetStaffLeaves({ 
          ownerId: user?.id, 
          kostUid: currentKostUid, 
          staffId: selectedStaffId || undefined 
        }).catch(() => ({ leaves: [], quota: null })),
        apiGetLeaveSettings({ ownerId: user?.id, kostUid: currentKostUid }).catch(() => ({ workDaysRequired: 20, leaveDaysEarned: 2 }))
      ]);

      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      setLeavesList(leavesRes?.leaves || []);
      setLeaveQuota(leavesRes?.quota || null);
      if (settingsRes) {
        setWorkDaysRequired(settingsRes.workDaysRequired || 20);
        setLeaveDaysEarned(settingsRes.leaveDaysEarned || 2);
      }
    } catch (err) {
      console.error('Failed to load leaves data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, currentKostUid, selectedStaffId]);

  // Recalculate days count whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysCount(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, endDate]);

  const handleSaveRatioSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await apiUpdateLeaveSettings({
        ownerId: user?.id,
        kostUid: currentKostUid,
        workDaysRequired: Number(workDaysRequired),
        leaveDaysEarned: Number(leaveDaysEarned)
      });
      setActionMsg(res.message || 'Aturan rasio cuti berhasil diperbarui!');
      setShowSettingsCard(false);
      fetchData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal menyimpan aturan cuti: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenApplyModal = (staffId = '') => {
    const defaultStaff = staffId || selectedStaffId || (staffList[0]?.id ? String(staffList[0].id) : '');
    setModalStaffId(defaultStaff);
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setDaysCount(1);
    setReason('');
    setAttachmentPhoto(null);
    setLeaveType('cuti');
    setShowApplyModal(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const scale = MAX_WIDTH / img.width;
        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scale : img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAttachmentPhoto(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitApply = async (e) => {
    e.preventDefault();
    if (!modalStaffId || !startDate || !endDate || !reason) {
      alert('Mohon lengkapi semua data wajib pengajuan.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiApplyLeave({
        staffId: modalStaffId,
        ownerId: user?.id,
        kostUid: currentKostUid,
        type: leaveType,
        startDate,
        endDate,
        daysCount: Number(daysCount),
        reason,
        attachmentPhoto
      });

      setShowApplyModal(false);
      setActionMsg(res.message || 'Pengajuan cuti berhasil dikirim.');
      fetchData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal mengirim pengajuan cuti: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessLeave = async () => {
    if (!reviewModalLeave) return;
    setProcessingReview(true);
    try {
      const res = await apiProcessLeave(reviewModalLeave.id, {
        status: reviewStatus,
        notes: reviewNotes
      });
      setReviewModalLeave(null);
      setReviewNotes('');
      setActionMsg(res.message || 'Status pengajuan cuti berhasil diperbarui.');
      fetchData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal memproses cuti: ' + err.message);
    } finally {
      setProcessingReview(false);
    }
  };

  const filteredLeaves = leavesList.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner: Ratio Setting Quick Trigger & Controls */}
      <div className="card glass-panel" style={{
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>
              Izin & Rasio Cuti Karyawan
            </h3>
            <span style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              Aturan: {workDaysRequired} Hari Kerja = {leaveDaysEarned} Hari Cuti
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Pantau saldo cuti otomatis berdasarkan kehadiran absensi masuk & verifikasi pengajuan izin staf.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowSettingsCard(!showSettingsCard)}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px', fontSize: '0.82rem' }}
          >
            <Settings size={14} />
            <span>{showSettingsCard ? 'Tutup Pengaturan Rasio' : 'Atur Rasio Cuti'}</span>
          </button>

          <button
            onClick={() => handleOpenApplyModal()}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
          >
            <Plus size={14} />
            <span>Ajukan Izin / Cuti Baru</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
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

      {/* OWNER SETTING CARD: Aturan Rasio Hari Masuk Kerja vs Cuti */}
      {showSettingsCard && (
        <div className="card glass-panel animate-fade-in" style={{
          padding: '1.25rem',
          border: '1.5px solid rgba(59, 130, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#60a5fa" />
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>
              Pengaturan Aturan Perolehan Cuti (Owner Setting)
            </h4>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Sistem secara otomatis menghitung kehadiran absensi masuk karyawan. Setiap karyawan mencapai target hari masuk kerja, sistem otomatis menambah saldo cuti aktif yang dapat mereka ambil.
          </p>

          <form onSubmit={handleSaveRatioSettings} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Hari Kerja Wajib (Hadir Masuk):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={workDaysRequired}
                  onChange={e => setWorkDaysRequired(e.target.value)}
                  className="input-field"
                  style={{ width: '100px', fontSize: '0.9rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Hari Kerja</span>
              </div>
            </div>

            <div style={{ fontSize: '1.2rem', color: '#60a5fa', fontWeight: 800, paddingBottom: '8px' }}>
              ➔ Mendapatkan
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Hak Saldo Cuti Didapat:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={leaveDaysEarned}
                  onChange={e => setLeaveDaysEarned(e.target.value)}
                  className="input-field"
                  style={{ width: '90px', fontSize: '0.9rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Hari Cuti</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => setShowSettingsCard(false)}
                className="btn btn-secondary btn-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="btn btn-primary btn-sm"
                style={{ background: '#2563eb', borderColor: '#2563eb' }}
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan Aturan Rasio Cuti'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 12px', borderRadius: '8px' }}>
            ℹ️ <strong>Contoh:</strong> Jika disetel 20 hari kerja = 2 hari cuti, maka staf yang telah hadir 40 hari kerja akan mendapatkan total 4 hari cuti aktif.
          </div>
        </div>
      )}

      {/* FILTER & STAFF QUOTA CARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        
        {/* Selector & Filter */}
        <div className="card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Lihat Cuti Berdasarkan Karyawan:
            </label>
            <select
              className="input-field"
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: 'white' }}
            >
              <option value="">Semua Karyawan ({staffList.length})</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.jobTitle || 'Staf'})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Status Pengajuan:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pending', label: '⏳ Menunggu' },
                { id: 'approved', label: '✓ Disetujui' },
                { id: 'rejected', label: '✕ Ditolak' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    border: '1px solid',
                    borderColor: statusFilter === f.id ? '#3b82f6' : 'var(--border-color)',
                    background: statusFilter === f.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: statusFilter === f.id ? '#60a5fa' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: statusFilter === f.id ? 700 : 500
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Quota Progress Bar (when single staff selected) */}
        {leaveQuota && (
          <div className="card glass-panel" style={{
            padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarCheck2 size={16} /> Saldo Cuti Staf Aktif
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {leaveQuota.totalWorkDays} Hari Kerja Tercatat
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', margin: '8px 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Total Hak Cuti</span>
                <strong style={{ fontSize: '1.1rem', color: '#60a5fa' }}>{leaveQuota.earnedLeaveDays} Hari</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Cuti Terpakai</span>
                <strong style={{ fontSize: '1.1rem', color: '#f87171' }}>{leaveQuota.usedLeaveDays} Hari</strong>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'block' }}>Sisa Saldo Cuti</span>
                <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{leaveQuota.remainingLeaveDays} Hari</strong>
              </div>
            </div>

            {/* Progress to next earned leave */}
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '3px' }}>
                <span>Progres cuti berikutnya ({leaveQuota.progressToNext}/{leaveQuota.workDaysRequired} hari):</span>
                <span><strong>{leaveQuota.daysUntilNextLeave} hari kerja lagi</strong></span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (leaveQuota.progressToNext / leaveQuota.workDaysRequired) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                  borderRadius: '3px'
                }} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* LEAVES LIST */}
      {loading ? (
        <div className="card glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Memuat data pengajuan cuti dan izin...
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="card glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Calendar size={36} color="#64748b" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ margin: '0 0 6px 0', color: 'white' }}>Belum Ada Riwayat Pengajuan Izin atau Cuti</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '460px', marginInline: 'auto' }}>
            Karyawan dapat mengajukan izin sakit, keperluan mendesak, atau cuti tahunan dengan formulir digital.
          </p>
          <button
            onClick={() => handleOpenApplyModal()}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '1rem', gap: '6px' }}
          >
            <Plus size={14} /> Ajukan Izin / Cuti Sekarang
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredLeaves.map(leave => {
            const isApproved = leave.status === 'approved';
            const isRejected = leave.status === 'rejected';
            const isPending = leave.status === 'pending';

            return (
              <div
                key={leave.id}
                className="card glass-panel"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: isApproved ? '1px solid rgba(16, 185, 129, 0.3)' : isRejected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: leave.type === 'sakit' ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {leave.staffName ? leave.staffName.charAt(0).toUpperCase() : 'K'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.05rem', color: 'white' }}>{leave.staffName}</strong>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: leave.type === 'sakit' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: leave.type === 'sakit' ? '#fca5a5' : '#93c5fd',
                          border: leave.type === 'sakit' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          {leave.type === 'sakit' ? '🏥 Izin Sakit' : leave.type === 'izin' ? '📋 Izin Khusus' : '🏖️ Cuti Tahunan'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Cabang: {leave.kostName} • Diajukan: {new Date(leave.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: isApproved ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isApproved ? '#34d399' : isRejected ? '#f87171' : '#fbbf24',
                      border: isApproved ? '1px solid #10b981' : isRejected ? '1px solid #ef4444' : '1px solid #f59e0b'
                    }}>
                      {isApproved && <CheckCircle size={14} />}
                      {isRejected && <XCircle size={14} />}
                      {isPending && <Clock size={14} />}
                      {isApproved ? 'Disetujui Owner' : isRejected ? 'Ditolak' : 'Menunggu Review'}
                    </span>
                  </div>
                </div>

                {/* Date & Reason Info */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                    <Calendar size={15} color="#38bdf8" />
                    <span>
                      Periode: <strong>{new Date(leave.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> s/d <strong>{new Date(leave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> ({leave.daysCount} Hari)
                    </span>
                  </div>

                  <div style={{ color: '#e2e8f0', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Alasan: </span>
                    {leave.reason}
                  </div>

                  {leave.notes && (
                    <div style={{ fontSize: '0.78rem', color: '#93c5fd', marginTop: '4px', background: 'rgba(59, 130, 246, 0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                      💬 Catatan Owner: {leave.notes}
                    </div>
                  )}
                </div>

                {/* Footer: Attachment & Owner Review Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {leave.attachmentPhoto ? (
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(leave.attachmentPhoto)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', fontSize: '0.78rem', color: '#38bdf8' }}
                    >
                      <Paperclip size={13} />
                      <span>Lihat Lampiran Foto Bukti / Surat</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tanpa lampiran dokumen</span>
                  )}

                  {/* Owner Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewModalLeave(leave);
                        setReviewStatus('approved');
                        setReviewNotes('');
                      }}
                      className="btn btn-sm"
                      style={{
                        background: isApproved ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: '1px solid #10b981',
                        fontSize: '0.78rem',
                        gap: '4px'
                      }}
                    >
                      <Check size={13} />
                      <span>{isApproved ? 'Ubah Catatan' : 'Setujui Cuti'}</span>
                    </button>

                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalLeave(leave);
                          setReviewStatus('rejected');
                          setReviewNotes('');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: '0.78rem', gap: '4px' }}
                      >
                        <X size={13} />
                        <span>Tolak</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: AJUKAN IZIN / CUTI */}
      {showApplyModal && createPortal(
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Form Pengajuan Izin & Cuti
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Isi tanggal dan alasan pengajuan untuk persetujuan Owner
                </span>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Select Staff */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Karyawan Pemohon *
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

              {/* Leave Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Jenis Pengajuan *
                </label>
                <select
                  className="input-field"
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  <option value="cuti">🏖️ Cuti Tahunan (Potong Kuota Cuti)</option>
                  <option value="sakit">🏥 Izin Sakit (Lampirkan Surat Dokter)</option>
                  <option value="izin">📋 Izin Keperluan Mendesak / Keluarga</option>
                </select>
              </div>

              {/* Date Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Tanggal Selesai *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>
                Durasi Pengajuan: {daysCount} Hari
              </div>

              {/* Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Alasan / Keterangan *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Demam tinggi butuh istirahat / Keperluan keluarga di kampung..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Document / Photo Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Lampiran Bukti (Opsional, Surat Dokter / Tiket / Foto)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="input-field"
                  style={{ fontSize: '0.8rem' }}
                />
                {attachmentPhoto && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={attachmentPhoto} 
                      alt="Preview Lampiran" 
                      style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} 
                    />
                    <span style={{ fontSize: '0.75rem', color: '#34d399' }}>✓ Lampiran foto terpasang</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApplyModal(false)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: REVIEW LEAVE (OWNER APPROVAL / REJECTION) */}
      {reviewModalLeave && createPortal(
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
            maxWidth: '460px',
            width: '100%',
            padding: '1.5rem',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'white' }}>
              {reviewStatus === 'approved' ? 'Setujui Pengajuan Cuti / Izin' : 'Tolak Pengajuan Cuti / Izin'}
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Staf: <strong>{reviewModalLeave.staffName}</strong> • {reviewModalLeave.daysCount} hari ({reviewModalLeave.startDate} s/d {reviewModalLeave.endDate})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Keputusan:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('approved')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: reviewStatus === 'approved' ? '#10b981' : 'var(--border-color)',
                      background: reviewStatus === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: reviewStatus === 'approved' ? '#34d399' : 'white',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: reviewStatus === 'rejected' ? '#ef4444' : 'var(--border-color)',
                      background: reviewStatus === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                      color: reviewStatus === 'rejected' ? '#f87171' : 'white',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Tolak
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Catatan untuk Karyawan (Opsional):
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Selamat beristirahat, pekerjaan digantikan sementara oleh staf lain."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReviewModalLeave(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={processingReview}
                  onClick={handleProcessLeave}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: reviewStatus === 'approved' ? 'linear-gradient(135deg, #10b981, #059669)' : '#ef4444',
                    borderColor: reviewStatus === 'approved' ? '#10b981' : '#ef4444'
                  }}
                >
                  {processingReview ? 'Memproses...' : reviewStatus === 'approved' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FULL PHOTO PREVIEW MODAL */}
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
          <div style={{ position: 'relative', maxWidth: '640px', width: '100%', textAlign: 'center' }}>
            <img 
              src={previewPhoto} 
              alt="Lampiran Dokumen Cuti" 
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
