import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Camera, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Settings, 
  Eye, 
  X, 
  Sparkles,
  Compass,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CalendarCheck2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import StaffShiftMutations from './StaffShiftMutations';
import StaffPayrollAndKasbon from './StaffPayrollAndKasbon';
import StaffRatingsFeed from './StaffRatingsFeed';
import { 
  apiGetStaffAttendance, 
  apiGetStaffWorkLogs, 
  apiGetStaffLeaves, 
  apiGetLeaveSettings,
  apiUpdateLeaveSettings,
  apiCheckInStaff,
  apiCheckOutStaff,
  apiSubmitWorkLog,
  apiApplyLeave,
  apiGetStaffTasks,
  apiResolveComplaintWithProof
} from '../services/api';

const DAYS_HEADER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WORK_CATEGORIES = [
  { id: 'Kebersihan', label: '🧹 Kebersihan & Sapu/Pel', color: '#10b981' },
  { id: 'Perbaikan', label: '🔧 Perbaikan & Servis Teknisi', color: '#f59e0b' },
  { id: 'Ganti Sprei', label: '🛏️ Ganti Sprei & Linen', color: '#8b5cf6' },
  { id: 'Cek Meteran', label: '⚡ Cek Meteran PLN / Air PDAM', color: '#3b82f6' },
  { id: 'Keamanan', label: '🛡️ Keamanan, Kunci & Ronda Malam', color: '#ec4899' },
  { id: 'Fasilitas Kost', label: '🏢 Pengecekan Fasilitas Umum Kost', color: '#14b8a6' }
];

export default function StaffCalendarView({ staff, user, onStaffUpdated }) {
  const [activeSubTab, setActiveSubTab] = useState('calendar'); // 'calendar' | 'handover' | 'payroll' | 'ratings'
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [workLogsData, setWorkLogsData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [leaveQuota, setLeaveQuota] = useState(null);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // Quick Resolve Complaint State
  const [complaintToResolve, setComplaintToResolve] = useState(null);
  const [resolveProofPhoto, setResolveProofPhoto] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolvingComplaint, setResolvingComplaint] = useState(false);

  // Selected Date Inspector Modal
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Hover Tooltip State
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Photo viewer modal
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);

  // Leave Ratio Setting Modal
  const [showRatioModal, setShowRatioModal] = useState(false);
  const [workDaysRequired, setWorkDaysRequired] = useState(20);
  const [leaveDaysEarned, setLeaveDaysEarned] = useState(2);
  const [savingRatio, setSavingRatio] = useState(false);

  // Quick Action Modals (Absen Masuk / Selesai / Upload Tugas)
  const [quickModal, setQuickModal] = useState(null); // 'checkIn' | 'checkOut' | 'uploadTask'
  const [targetDateForAction, setTargetDateForAction] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [taskCategory, setTaskCategory] = useState('Kebersihan');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const fileInputRef = useRef(null);

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  const loadData = async () => {
    if (!staff?.id) return;
    setLoading(true);
    try {
      const [attRes, logsRes, leavesRes, settingsRes, tasksRes] = await Promise.all([
        apiGetStaffAttendance({ staffId: staff.id, ownerId: user?.id, kostUid: staff.kostUid }).catch(() => []),
        apiGetStaffWorkLogs({ staffId: staff.id, ownerId: user?.id, kostUid: staff.kostUid }).catch(() => []),
        apiGetStaffLeaves({ staffId: staff.id, ownerId: user?.id, kostUid: staff.kostUid }).catch(() => ({ leaves: [], quota: null })),
        apiGetLeaveSettings({ ownerId: user?.id, kostUid: staff.kostUid }).catch(() => ({ workDaysRequired: 20, leaveDaysEarned: 2 })),
        apiGetStaffTasks({ staffId: staff.id }).catch(() => [])
      ]);

      setAttendanceData(Array.isArray(attRes) ? attRes : []);
      setWorkLogsData(Array.isArray(logsRes) ? logsRes : []);
      setLeavesData(leavesRes?.leaves || []);
      setLeaveQuota(leavesRes?.quota || null);
      setAssignedComplaints(Array.isArray(tasksRes) ? tasksRes : []);
      if (settingsRes) {
        setWorkDaysRequired(settingsRes.workDaysRequired || 20);
        setLeaveDaysEarned(settingsRes.leaveDaysEarned || 2);
      }
    } catch (err) {
      console.error('Failed loading staff calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [staff?.id, user?.id]);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung deteksi lokasi GPS.');
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
        setGpsError('Gagal mendeteksi GPS. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIndex - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIndex + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  // Monday start (0=Mon, 6=Sun)
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7;

  const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();

  const calendarDays = [];

  // Previous month padding
  for (let i = startingDay - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const m = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const y = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: dayNum,
      dateString: dateStr,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: true
    });
  }

  // Next month padding to complete 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
    const y = currentMonthIndex === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false
    });
  }

  // Helper to get data for a date
  const getDayDetails = (dateStr) => {
    const attendance = attendanceData.find(a => a.date === dateStr);
    const tasks = workLogsData.filter(w => w.date === dateStr);
    const leave = leavesData.find(l => l.startDate <= dateStr && l.endDate >= dateStr && l.status === 'approved');
    const assignedTasks = assignedComplaints.filter(c => 
      c.scheduledDate === dateStr || (c.date && c.date.startsWith(dateStr))
    );

    return { dateStr, attendance, tasks, leave, assignedTasks };
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Month stats
  const monthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const monthAttendances = attendanceData.filter(a => a.date.startsWith(monthPrefix));
  const monthCompleted = monthAttendances.filter(a => a.status === 'completed');
  const monthTasks = workLogsData.filter(w => w.date.startsWith(monthPrefix));
  const totalWorkHoursMonth = monthCompleted.reduce((acc, curr) => acc + (Number(curr.checkOut?.workDurationHours) || 0), 0);

  const handleMouseEnterCell = (e, details) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 12
    });
    setHoveredDay(details);
  };

  const handleMouseLeaveCell = () => {
    setHoveredDay(null);
  };

  const handleSaveRatio = async (e) => {
    e.preventDefault();
    setSavingRatio(true);
    try {
      const res = await apiUpdateLeaveSettings({
        ownerId: user?.id,
        kostUid: staff.kostUid,
        workDaysRequired: Number(workDaysRequired),
        leaveDaysEarned: Number(leaveDaysEarned)
      });
      setActionMsg(res.message || 'Aturan cuti berhasil disimpan!');
      setShowRatioModal(false);
      loadData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal menyimpan aturan: ' + err.message);
    } finally {
      setSavingRatio(false);
    }
  };

  // Quick Action: Handle Photo Capture
  const handlePhotoCapture = (e) => {
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
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAction = (type, dateStr) => {
    setQuickModal(type);
    setTargetDateForAction(dateStr);
    setPhotoPreview(null);
    setTaskTitle('');
    setTaskDesc('');
    setGpsLocation(null);
    setGpsError(null);
    requestGps();
  };

  const handleSubmitQuickAction = async (e) => {
    e.preventDefault();
    if (!photoPreview) {
      alert('Foto bukti wajib disertakan.');
      return;
    }
    setActionSubmitting(true);
    try {
      if (quickModal === 'checkIn') {
        await apiCheckInStaff({
          staffId: staff.id,
          photo: photoPreview,
          lat: gpsLocation?.lat || null,
          lng: gpsLocation?.lng || null,
          kostUid: staff.kostUid
        });
        setActionMsg('✅ Absensi masuk berhasil dicatat!');
      } else if (quickModal === 'checkOut') {
        await apiCheckOutStaff({
          staffId: staff.id,
          photo: photoPreview,
          lat: gpsLocation?.lat || null,
          lng: gpsLocation?.lng || null
        });
        setActionMsg('✅ Absensi selesai kerja berhasil dicatat!');
      } else if (quickModal === 'uploadTask') {
        await apiSubmitWorkLog({
          staffId: staff.id,
          ownerId: user?.id,
          kostUid: staff.kostUid,
          category: taskCategory,
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          photo: photoPreview,
          lat: gpsLocation?.lat || null,
          lng: gpsLocation?.lng || null
        });
        setActionMsg('✅ Laporan foto tugas berhasil diunggah!');
      }
      setQuickModal(null);
      loadData();
      // If modal inspector was open, refresh it
      if (selectedDayDetail) {
        setTimeout(() => {
          setSelectedDayDetail(getDayDetails(targetDateForAction));
        }, 600);
      }
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal memproses aksi: ' + err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="card glass-panel animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      padding: '1.25rem',
      borderRadius: '20px',
      border: '1px solid rgba(59, 130, 246, 0.35)',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%)'
    }}>
      
      {/* Calendar Header with Staff Name & Month Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Kalender & Manajemen Staf: {staff.name}
              </h3>
              <span style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                {staff.jobTitle || 'Penjaga Kost'}
              </span>
              {staff.avgRating && (
                <span style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  ⭐ {staff.avgRating} ({staff.totalReviews || 0} Ulasan)
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Kelola jadwal tugas, buku mutasi shift harian, kasbon & kalkulasi slip gaji, dan rating layanan staf.
            </p>
          </div>
        </div>

        {/* Month Navigation (Only for Calendar tab) */}
        {activeSubTab === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={prevMonth}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px' }}
              title="Bulan sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              minWidth: '150px',
              textAlign: 'center',
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              {MONTH_NAMES[currentMonthIndex]} {currentYear}
            </span>

            <button
              onClick={nextMonth}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px' }}
              title="Bulan berikutnya"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={goToToday}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Hari Ini
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        borderBottom: '1px solid var(--border-color)',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'calendar', label: '📅 Kalender & Tugas Harian', icon: <CalendarIcon size={16} /> },
          { id: 'handover', label: '📖 Buku Mutasi & Titipan Paket', icon: <FileText size={16} /> },
          { id: 'payroll', label: '💰 Kasbon & Slip Gaji', icon: <Briefcase size={16} /> },
          { id: 'ratings', label: '⭐ Rating & Ulasan', icon: <Sparkles size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: activeSubTab === tab.id ? '1px solid #3b82f6' : '1px solid var(--border-color)',
              background: activeSubTab === tab.id ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)' : 'rgba(255, 255, 255, 0.03)',
              color: activeSubTab === tab.id ? '#60a5fa' : 'var(--text-secondary)',
              fontWeight: activeSubTab === tab.id ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Action Notification */}
      {actionMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
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

      {activeSubTab === 'calendar' && (
        <>
          {/* Monthly Summary Statistics Chips */}
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Hadir Bulan Ini</span>
            <strong style={{ fontSize: '1.15rem', color: '#34d399' }}>{monthCompleted.length} Hari</strong>
          </div>
          <CheckCircle size={22} color="#10b981" />
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Total Jam Kerja</span>
            <strong style={{ fontSize: '1.15rem', color: '#60a5fa' }}>{totalWorkHoursMonth.toFixed(1)} Jam</strong>
          </div>
          <Clock size={22} color="#3b82f6" />
        </div>

        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Laporan Foto Tugas</span>
            <strong style={{ fontSize: '1.15rem', color: '#c4b5fd' }}>{monthTasks.length} Foto</strong>
          </div>
          <Camera size={22} color="#8b5cf6" />
        </div>

        <div 
          onClick={() => setShowRatioModal(true)}
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Klik untuk mengubah aturan rasio cuti (Owner Setting)"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Saldo Cuti Aktif</span>
              <Settings size={12} color="#fbbf24" />
            </div>
            <strong style={{ fontSize: '1.15rem', color: '#fbbf24' }}>
              {leaveQuota?.remainingLeaveDays ?? 0} Hari Cuti
            </strong>
          </div>
          <span style={{
            fontSize: '0.68rem',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fef08a',
            padding: '3px 6px',
            borderRadius: '6px',
            fontWeight: 700
          }}>
            {workDaysRequired}h = {leaveDaysEarned}c
          </span>
        </div>
      </div>

      {/* Legend Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '0.74rem',
        color: 'var(--text-secondary)',
        padding: '6px 10px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px'
      }}>
        <span style={{ fontWeight: 700, color: '#cbd5e1' }}>Status Kalender:</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          Hadir Penuh (Masuk & Keluar)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          Sedang Bekerja (Baru Masuk)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
          Ada Foto Laporan Tugas
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
          Izin / Cuti
        </span>
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
        position: 'relative'
      }}>
        {/* Day Name Headers */}
        {DAYS_HEADER.map((dayName, idx) => (
          <div key={idx} style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: idx >= 5 ? '#f87171' : '#94a3b8',
            padding: '6px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {dayName}
          </div>
        ))}

        {/* Days Cells */}
        {calendarDays.map((cell, idx) => {
          const details = getDayDetails(cell.dateString);
          const hasAtt = Boolean(details.attendance);
          const isComplete = details.attendance?.status === 'completed';
          const isCheckedInOnly = details.attendance?.status === 'checked_in';
          const hasTasks = details.tasks.length > 0;
          const hasLeave = Boolean(details.leave);
          const isToday = cell.dateString === todayStr;

          // Determine border & background
          let borderColor = 'var(--border-color)';
          let bgColor = cell.isCurrentMonth ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)';
          
          if (isComplete) {
            borderColor = 'rgba(16, 185, 129, 0.4)';
            bgColor = 'rgba(16, 185, 129, 0.08)';
          } else if (isCheckedInOnly) {
            borderColor = 'rgba(245, 158, 11, 0.4)';
            bgColor = 'rgba(245, 158, 11, 0.08)';
          } else if (hasLeave) {
            borderColor = 'rgba(236, 72, 153, 0.4)';
            bgColor = 'rgba(236, 72, 153, 0.08)';
          }

          if (isToday) {
            borderColor = '#38bdf8';
          }

          return (
            <div
              key={idx}
              onClick={() => setSelectedDayDetail(details)}
              onMouseEnter={(e) => handleMouseEnterCell(e, details)}
              onMouseLeave={handleMouseLeaveCell}
              style={{
                minHeight: '85px',
                padding: '6px',
                borderRadius: '12px',
                border: `1.5px solid ${borderColor}`,
                background: bgColor,
                opacity: cell.isCurrentMonth ? 1 : 0.45,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: isToday ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                position: 'relative'
              }}
            >
              {/* Date Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: isToday ? 800 : 600,
                  color: isToday ? '#38bdf8' : cell.isCurrentMonth ? 'white' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isToday ? '22px' : 'auto',
                  height: isToday ? '22px' : 'auto',
                  borderRadius: isToday ? '50%' : '0',
                  background: isToday ? 'rgba(56, 189, 248, 0.2)' : 'transparent'
                }}>
                  {cell.dayNumber}
                </span>

                {isToday && (
                  <span style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: 700 }}>HARI INI</span>
                )}
              </div>

              {/* Attendance Mini Badges */}
              {details.attendance?.checkIn && (
                <div style={{
                  fontSize: '0.68rem',
                  padding: '2px 4px',
                  borderRadius: '5px',
                  background: isComplete ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: isComplete ? '#34d399' : '#fbbf24',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <Clock size={10} />
                  <span>
                    {details.attendance.checkIn.time}
                    {details.attendance.checkOut?.time && ` - ${details.attendance.checkOut.time}`}
                  </span>
                </div>
              )}

              {/* Task Proof Count Badge */}
              {hasTasks && (
                <div style={{
                  fontSize: '0.68rem',
                  padding: '2px 4px',
                  borderRadius: '5px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#c4b5fd',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <Camera size={10} />
                  <span>{details.tasks.length} Tugas</span>
                </div>
              )}

              {/* Assigned Complaint Tasks Badge */}
              {details.assignedTasks?.length > 0 && (
                <div style={{
                  fontSize: '0.66rem',
                  padding: '2px 4px',
                  borderRadius: '5px',
                  background: 'rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <AlertCircle size={9} />
                  <span>{details.assignedTasks.length} Komplain</span>
                </div>
              )}

              {/* Leave Status Badge */}
              {hasLeave && (
                <div style={{
                  fontSize: '0.68rem',
                  padding: '2px 4px',
                  borderRadius: '5px',
                  background: details.leave.type === 'sakit' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                  color: details.leave.type === 'sakit' ? '#fca5a5' : '#f472b6',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span>{details.leave.type === 'sakit' ? '🏥 Sakit' : '🏖️ Cuti'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* SUBTAB 2: BUKU MUTASI SHIFT & TITIPAN PAKET */}
      {activeSubTab === 'handover' && (
        <StaffShiftMutations staff={staff} user={user} />
      )}

      {/* SUBTAB 3: KASBON & SLIP GAJI OTOMATIS */}
      {activeSubTab === 'payroll' && (
        <StaffPayrollAndKasbon staff={staff} user={user} />
      )}

      {/* SUBTAB 4: RATING & ULASAN LAYANAN */}
      {activeSubTab === 'ratings' && (
        <StaffRatingsFeed staff={staff} user={user} />
      )}

      {/* FLOATING HOVER TOOLTIP (DESKTOP) */}
      {hoveredDay && (
        <div style={{
          position: 'fixed',
          top: Math.max(16, Math.min(window.innerHeight - 180, tooltipPos.y - 130)),
          left: Math.max(16, Math.min(window.innerWidth - 280, tooltipPos.x - 130)),
          pointerEvents: 'none',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.6)',
          zIndex: 99999,
          width: '260px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
            📅 {new Date(hoveredDay.dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>

          {hoveredDay.attendance ? (
            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ color: '#34d399', fontWeight: 700 }}>
                ✓ Masuk: {hoveredDay.attendance.checkIn?.time || '-'}
              </div>
              <div style={{ color: hoveredDay.attendance.checkOut ? '#60a5fa' : '#fbbf24', fontWeight: 700 }}>
                {hoveredDay.attendance.checkOut ? `✓ Selesai: ${hoveredDay.attendance.checkOut.time} (${hoveredDay.attendance.checkOut.workDurationHours} Jam)` : '⏳ Belum Absen Selesai'}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Tidak ada absensi masuk
            </div>
          )}

          {hoveredDay.tasks.length > 0 && (
            <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#c4b5fd', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
              📸 <strong>{hoveredDay.tasks.length} Laporan Tugas:</strong>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                {hoveredDay.tasks.map(t => t.title).join(', ')}
              </div>
            </div>
          )}

          {hoveredDay.assignedTasks?.length > 0 && (
            <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#fbbf24', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
              ⚡ <strong>{hoveredDay.assignedTasks.length} Tugas Komplain:</strong>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                {hoveredDay.assignedTasks.map(t => `Kamar ${t.kamar || t.roomNumber || '-'}: ${t.text || t.title}`).join(', ')}
              </div>
            </div>
          )}

          {hoveredDay.leave && (
            <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#f472b6', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
              🏖️ {hoveredDay.leave.type.toUpperCase()}: {hoveredDay.leave.reason}
            </div>
          )}

          <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#64748b', textAlign: 'right' }}>
            Klik untuk detail foto & bukti
          </div>
        </div>
      )}

      {/* MODAL: DETAIL HARIAN (CLICKED DAY INSPECTION SHEET) */}
      {selectedDayDetail && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          overflowY: 'auto',
          zIndex: 999999,
          padding: '1.25rem'
        }}>
          <div className="card glass-panel animate-fade-in" style={{
            margin: 'auto',
            maxWidth: '640px',
            width: '100%',
            padding: '1.75rem',
            border: '1px solid var(--border-light)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={20} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontWeight: 800 }}>
                    {new Date(selectedDayDetail.dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Aktivitas & Riwayat Tugas: <strong style={{ color: 'white' }}>{staff.name}</strong> ({staff.jobTitle || 'Staf'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* SECTION 1: LOG ABSENSI MASUK & SELESAI */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} color="#38bdf8" /> Absensi Harian (Foto Selfie & GPS)
                  </h4>
                  {selectedDayDetail.attendance?.checkOut?.workDurationHours > 0 && (
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#93c5fd',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      Total: {selectedDayDetail.attendance.checkOut.workDurationHours} Jam Kerja
                    </span>
                  )}
                </div>

                {selectedDayDetail.attendance ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                    
                    {/* Check In Box */}
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      padding: '10px',
                      display: 'flex',
                      gap: '10px'
                    }}>
                      {selectedDayDetail.attendance.checkIn?.photo ? (
                        <img 
                          src={selectedDayDetail.attendance.checkIn.photo}
                          alt="Foto Masuk"
                          onClick={() => setFullscreenPhoto(selectedDayDetail.attendance.checkIn.photo)}
                          style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', border: '1.5px solid #10b981', flexShrink: 0 }}
                          title="Klik untuk memperbesar foto selfie masuk"
                        />
                      ) : (
                        <div style={{ width: '70px', height: '70px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={20} color="#64748b" />
                        </div>
                      )}
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Jam Masuk: {selectedDayDetail.attendance.checkIn?.time}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#38bdf8" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedDayDetail.attendance.checkIn?.locationName || 'Area Sekitar Kost'}
                          </span>
                        </div>
                        {selectedDayDetail.attendance.checkIn?.distanceMeters !== null && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                            Radius Kost: ~{selectedDayDetail.attendance.checkIn.distanceMeters}m {selectedDayDetail.attendance.checkIn.isNearKost && <span style={{ color: '#34d399', fontWeight: 700 }}>(✓ Di Kost)</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Check Out Box */}
                    <div style={{
                      background: selectedDayDetail.attendance.checkOut ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: selectedDayDetail.attendance.checkOut ? '1px solid rgba(59, 130, 246, 0.3)' : '1px dashed var(--border-color)',
                      borderRadius: '12px',
                      padding: '10px',
                      display: 'flex',
                      gap: '10px'
                    }}>
                      {selectedDayDetail.attendance.checkOut?.photo ? (
                        <img 
                          src={selectedDayDetail.attendance.checkOut.photo}
                          alt="Foto Selesai"
                          onClick={() => setFullscreenPhoto(selectedDayDetail.attendance.checkOut.photo)}
                          style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', border: '1.5px solid #3b82f6', flexShrink: 0 }}
                          title="Klik untuk memperbesar foto selfie selesai"
                        />
                      ) : (
                        <div style={{ width: '70px', height: '70px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Clock size={20} color="#64748b" />
                        </div>
                      )}
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ color: selectedDayDetail.attendance.checkOut ? '#60a5fa' : '#94a3b8', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> Jam Selesai: {selectedDayDetail.attendance.checkOut?.time || 'Belum Absen Keluar'}
                        </div>
                        {selectedDayDetail.attendance.checkOut ? (
                          <>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} color="#38bdf8" />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {selectedDayDetail.attendance.checkOut.locationName || 'Area Sekitar Kost'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                              Durasi: {selectedDayDetail.attendance.checkOut.workDurationHours} Jam
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAction('checkOut', selectedDayDetail.dateStr)}
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: '6px', fontSize: '0.72rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)', gap: '4px' }}
                          >
                            <Clock size={12} /> Catat Selesai Sekarang
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    <p style={{ margin: '0 0 8px 0' }}>Belum ada log absensi masuk pada tanggal ini.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAction('checkIn', selectedDayDetail.dateStr)}
                      className="btn btn-primary btn-sm"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981', gap: '6px' }}
                    >
                      <Camera size={13} /> Catat Absen Masuk (Foto + GPS)
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: HASIL TUGAS & LAPORAN FOTO PEKERJAAN */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={16} color="#c4b5fd" /> Hasil Tugas & Bukti Pekerjaan ({selectedDayDetail.tasks.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenAction('uploadTask', selectedDayDetail.dateStr)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', gap: '4px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', borderColor: '#8b5cf6' }}
                  >
                    <Plus size={13} /> + Upload Tugas
                  </button>
                </div>

                {selectedDayDetail.tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Tidak ada laporan foto pekerjaan yang diunggah pada tanggal ini.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                    {selectedDayDetail.tasks.map(task => {
                      const cat = WORK_CATEGORIES.find(c => c.id === task.category) || { color: '#60a5fa', label: task.category };
                      return (
                        <div key={task.id} style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          overflow: 'hidden'
                        }}>
                          <div 
                            onClick={() => setFullscreenPhoto(task.photo)}
                            style={{ height: '140px', background: '#090d16', cursor: 'pointer', position: 'relative' }}
                            title="Klik untuk memperbesar foto tugas"
                          >
                            <img 
                              src={task.photo} 
                              alt={task.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                            />
                            <div style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              background: 'rgba(0,0,0,0.7)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: cat.color
                            }}>
                              {task.category}
                            </div>
                            <div style={{
                              position: 'absolute',
                              bottom: '6px',
                              right: '6px',
                              background: 'rgba(0,0,0,0.75)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              color: 'white'
                            }}>
                              {task.time || 'Tugas'}
                            </div>
                          </div>

                          <div style={{ padding: '8px 10px' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'white', display: 'block' }}>{task.title}</strong>
                            {task.description && (
                              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.3 }}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: TUGAS KOMPLAIN DARI OWNER (DISPOSISI) */}
              {selectedDayDetail.assignedTasks?.length > 0 && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '14px',
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} color="#fbbf24" /> Disposisi Tugas Komplain ({selectedDayDetail.assignedTasks.length})
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedDayDetail.assignedTasks.map(t => (
                      <div key={t.id} style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginRight: '6px' }}>
                              Kamar {t.kamar || t.roomNumber || '-'}
                            </span>
                            <strong style={{ fontSize: '0.9rem', color: 'white' }}>{t.text || t.title}</strong>
                            {t.category && (
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '6px' }}>({t.category})</span>
                            )}
                          </div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: t.status === 'selesai' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: t.status === 'selesai' ? '#34d399' : '#fbbf24'
                          }}>
                            {t.status === 'selesai' ? '✓ Selesai' : '⏳ Dalam Pengerjaan'}
                          </span>
                        </div>

                        {t.assignmentNotes && (
                          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '6px' }}>
                            <strong>Instruksi Owner:</strong> {t.assignmentNotes}
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {t.photo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Foto Masalah:</span>
                              <img 
                                src={t.photo} 
                                alt="Foto Masalah" 
                                onClick={() => setFullscreenPhoto(t.photo)}
                                style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                              />
                            </div>
                          )}

                          {t.resolvedPhoto && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', color: '#34d399' }}>Bukti Selesai:</span>
                              <img 
                                src={t.resolvedPhoto} 
                                alt="Bukti Selesai" 
                                onClick={() => setFullscreenPhoto(t.resolvedPhoto)}
                                style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #10b981' }}
                              />
                            </div>
                          )}

                          {t.status !== 'selesai' && (
                            <button
                              type="button"
                              onClick={() => {
                                setComplaintToResolve(t);
                                setResolveProofPhoto(null);
                                setResolveNotes('');
                              }}
                              className="btn btn-sm"
                              style={{
                                marginLeft: 'auto',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Camera size={13} /> Selesaikan & Upload Foto Hasil
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: CUTI / IZIN (IF APPLICABLE) */}
              {selectedDayDetail.leave && (
                <div style={{
                  background: 'rgba(236, 72, 153, 0.08)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ec4899',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800
                  }}>
                    🏖️
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'white' }}>
                      Status: {selectedDayDetail.leave.type === 'sakit' ? '🏥 Izin Sakit' : '🏖️ Cuti Tahunan'}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: '#f472b6', marginTop: '2px' }}>
                      Alasan: {selectedDayDetail.leave.reason} ({selectedDayDetail.leave.daysCount} hari)
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: OWNER LEAVE RATIO SETTING */}
      {showRatioModal && createPortal(
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
            padding: '1.75rem',
            border: '1px solid rgba(245, 158, 11, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#fbbf24" /> Pengaturan Rasio Cuti Karyawan
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Tentukan berapa hari masuk kerja yang harus diselesaikan staf untuk memperoleh saldo cuti aktif.
            </p>

            <form onSubmit={handleSaveRatio} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Target Hari Masuk Kerja (Hadir Lengkap):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={workDaysRequired}
                    onChange={e => setWorkDaysRequired(e.target.value)}
                    className="input-field"
                    style={{ fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Hari Kerja</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Hak Saldo Cuti yang Didapatkan:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={leaveDaysEarned}
                    onChange={e => setLeaveDaysEarned(e.target.value)}
                    className="input-field"
                    style={{ fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Hari Cuti</span>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 10px', borderRadius: '8px' }}>
                ℹ️ <strong>Rasio Aktif:</strong> Setiap {workDaysRequired} hari kerja hadir penuh = dapat {leaveDaysEarned} hari cuti.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRatioModal(false)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRatio}
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#2563eb', borderColor: '#2563eb' }}
                >
                  {savingRatio ? 'Menyimpan...' : 'Simpan Aturan Rasio'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* QUICK ACTION MODAL: ABSEN MASUK / SELESAI / UPLOAD TUGAS */}
      {quickModal && createPortal(
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
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'white' }}>
              {quickModal === 'checkIn' ? '📸 Absen Masuk Karyawan' : quickModal === 'checkOut' ? '🏁 Absen Selesai Kerja' : '📸 Upload Laporan Foto Tugas'}
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Staf: <strong>{staff.name}</strong> • Tanggal: {targetDateForAction}
            </p>

            <form onSubmit={handleSubmitQuickAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickModal === 'uploadTask' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Kategori Tugas *
                    </label>
                    <select
                      className="input-field"
                      value={taskCategory}
                      onChange={e => setTaskCategory(e.target.value)}
                      style={{ background: '#0f172a', color: 'white' }}
                    >
                      {WORK_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Judul Tugas yang Dikerjakan *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Bersihkan Toren Air & Ganti Kran Kamar 3"
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Keterangan Pengerjaan (Opsional)
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="Kran sudah terpasang kencang dan tidak ada kebocoran."
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </>
              )}

              {/* Photo Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  {quickModal === 'uploadTask' ? 'Foto Hasil Tugas (Wajib) *' : 'Foto Selfie Kamera di Dekat Kost (Wajib) *'}
                </label>

                {photoPreview ? (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #10b981' }}>
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
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
                    <Camera size={32} color="#60a5fa" style={{ margin: '0 auto 6px' }} />
                    <p style={{ margin: '0 0 2px', fontWeight: 600, color: 'white', fontSize: '0.88rem' }}>
                      Klik untuk Ambil Foto Kamera / Pilih File
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Gunakan kamera HP atau upload foto bukti
                    </span>
                  </div>
                )}

                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture={quickModal === 'uploadTask' ? 'environment' : 'user'}
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                />
              </div>

              {/* GPS status notice */}
              <div style={{ fontSize: '0.75rem', color: gpsLocation ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} />
                <span>
                  {gpsLocation ? `Koordinat GPS terkunci: ${gpsLocation.lat}, ${gpsLocation.lng}` : gpsError ? gpsError : 'Mendeteksi koordinat lokasi GPS...'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setQuickModal(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting || !photoPreview}
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  {actionSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* QUICK RESOLVE COMPLAINT MODAL (PROOF OF WORK) */}
      {complaintToResolve && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          overflowY: 'auto',
          zIndex: 9999999,
          padding: '1.25rem'
        }}>
          <div className="card glass-panel animate-fade-in" style={{
            margin: 'auto',
            maxWidth: '500px',
            width: '100%',
            padding: '1.75rem',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white', fontWeight: 800 }}>
                  Selesaikan Tiket Komplain
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setComplaintToResolve(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '1rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700 }}>
                Kamar {complaintToResolve.kamar || complaintToResolve.roomNumber || '-'} • {complaintToResolve.category || 'Keluhan'}
              </div>
              <strong style={{ fontSize: '0.9rem', color: 'white', display: 'block', marginTop: '2px' }}>
                {complaintToResolve.text || complaintToResolve.title}
              </strong>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!resolveProofPhoto) {
                alert('Foto bukti hasil pengerjaan wajib disertakan!');
                return;
              }
              setResolvingComplaint(true);
              try {
                await apiResolveComplaintWithProof(complaintToResolve.id, {
                  resolvedPhoto: resolveProofPhoto,
                  resolvedNotes: resolveNotes.trim(),
                  resolvedByStaffId: staff.id,
                  resolvedByStaffName: staff.name
                });
                setActionMsg('✅ Komplain berhasil diselesaikan & bukti pengerjaan tersimpan!');
                setComplaintToResolve(null);
                loadData();
                if (selectedDayDetail) {
                  setTimeout(() => {
                    setSelectedDayDetail(getDayDetails(selectedDayDetail.dateStr));
                  }, 600);
                }
                setTimeout(() => setActionMsg(null), 4000);
              } catch (err) {
                alert('Gagal menyelesaikan komplain: ' + err.message);
              } finally {
                setResolvingComplaint(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Foto Bukti Selesai (After Photo) *
                </label>
                {resolveProofPhoto ? (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #10b981' }}>
                    <img 
                      src={resolveProofPhoto} 
                      alt="Bukti Selesai" 
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => setResolveProofPhoto(null)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.75rem 1rem',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)'
                  }}>
                    <Camera size={28} color="#10b981" style={{ marginBottom: '6px' }} />
                    <span style={{ fontSize: '0.84rem', color: 'white', fontWeight: 600 }}>Ambil Foto Bukti Selesai</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Gunakan kamera atau upload foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
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
                            setResolveProofPhoto(canvas.toDataURL('image/jpeg', 0.8));
                          };
                          img.src = reader.result;
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Catatan Pengerjaan / Keterangan
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  placeholder="Contoh: Sudah diperbaiki seal kran dan pipa dibersihkan. Air mengalir normal."
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setComplaintToResolve(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resolvingComplaint || !resolveProofPhoto}
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  {resolvingComplaint ? 'Menyimpan...' : 'Selesaikan Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* FULLSCREEN PHOTO LIGHTBOX */}
      {fullscreenPhoto && createPortal(
        <div 
          onClick={() => setFullscreenPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '1rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '720px', width: '100%', textAlign: 'center' }}>
            <img 
              src={fullscreenPhoto} 
              alt="Foto Detail" 
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
