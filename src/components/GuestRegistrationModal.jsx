import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  LogOut, 
  FileText, 
  RefreshCw,
  Phone,
  UserCheck
} from 'lucide-react';
import { 
  apiGetGuestLogs, 
  apiCreateGuestLog, 
  apiCheckoutGuestLog 
} from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function GuestRegistrationModal({ isOpen, onClose, user, kostUid }) {
  const { isLight } = useTheme();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'register' | 'history'
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [relationship, setRelationship] = useState('Keluarga / Saudara');
  const [roomNumber, setRoomNumber] = useState(user?.kamar || '101');
  const [tenantName, setTenantName] = useState(user?.name || 'Penghuni Kost');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(1);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [notes, setNotes] = useState('');

  const isOwnerOrStaff = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'admin';
  const OVERNIGHT_RATE_PER_NIGHT = 25000; // Standar biaya inap tamu tambahan per malam

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const data = await apiGetGuestLogs({ kostUid: kostUid || user?.kostUid });
      if (Array.isArray(data)) {
        setGuests(data);
      }
    } catch (err) {
      console.error('Failed to fetch guest logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [kostUid, user?.kostUid]);

  const handleRegisterGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Nama dan nomor telepon tamu wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const totalFee = Number(durationDays) * OVERNIGHT_RATE_PER_NIGHT;
      await apiCreateGuestLog({
        kostUid: kostUid || user?.kostUid || null,
        tenantName: tenantName.trim(),
        roomNumber: roomNumber.trim(),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        relationship,
        startDate,
        durationDays: Number(durationDays),
        feePerNight: OVERNIGHT_RATE_PER_NIGHT,
        totalFee,
        vehiclePlate: vehiclePlate.trim() || '-',
        notes: notes.trim()
      });

      // Reset form
      setGuestName('');
      setGuestPhone('');
      setVehiclePlate('');
      setNotes('');
      setDurationDays(1);
      setActiveTab('active');
      await fetchGuests();
      alert('✅ Izin tamu menginap berhasil didaftarkan ke sistem manajemen kost!');
    } catch (err) {
      alert('Gagal mendaftarkan tamu: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutGuest = async (id, guestName) => {
    if (!window.confirm(`Tandai tamu "${guestName}" telah selesai menginap & check-out?`)) return;
    try {
      await apiCheckoutGuestLog(id);
      await fetchGuests();
    } catch (err) {
      alert('Gagal check-out tamu: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const activeGuests = guests.filter(g => g.status === 'aktif');
  const pastGuests = guests.filter(g => g.status === 'selesai' || g.status === 'checkout');

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '1rem'
    }} className="animate-fade-in">
      <div style={{
        background: isLight ? '#ffffff' : '#0a101f',
        border: isLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '620px',
        padding: '1.75rem',
        boxShadow: isLight ? '0 25px 60px -15px rgba(15, 23, 42, 0.15)' : '0 25px 70px -15px rgba(0, 0, 0, 0.9)',
        maxHeight: '92vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: 'white',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
            }}>
              <Users size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
                Buku Tamu Menginap Digital (Overnight Pass)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Pencatatan resmi izin tamu menginap sesuai tata tertib keamanan & ketertiban kost
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isLight ? '#475569' : '#94a3b8',
              cursor: 'pointer',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'active' ? '#0284c7' : 'transparent',
              color: activeTab === 'active' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={14} />
            Tamu Aktif ({activeGuests.length})
          </button>

          <button
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'register' ? '#10b981' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} />
            Daftarkan Tamu Inap
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? (isLight ? '#cbd5e1' : '#64748b') : 'transparent',
              color: activeTab === 'history' ? (isLight ? '#0f172a' : 'white') : (isLight ? '#64748b' : '#94a3b8'),
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Clock size={14} />
            Riwayat ({pastGuests.length})
          </button>
        </div>

        {/* Tab 1: Active Guests */}
        {activeTab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                <span>Memuat data tamu...</span>
              </div>
            ) : activeGuests.length === 0 ? (
              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
                border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: isLight ? '#64748b' : '#64748b'
              }}>
                <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <h5 style={{ color: isLight ? '#1e293b' : '#cbd5e1', margin: '0 0 4px', fontSize: '0.95rem' }}>Tidak Ada Tamu Menginap Saat Ini</h5>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>Semua kamar saat ini bersih dari tamu menginap yang tercatat.</p>
                <button
                  onClick={() => setActiveTab('register')}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                >
                  <Plus size={14} /> Daftarkan Tamu Baru
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeGuests.map(g => (
                  <div
                    key={g.id}
                    style={{
                      background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.85)',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
                            {g.guestName}
                          </h4>
                          <span style={{
                            background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)',
                            color: isLight ? '#059669' : '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            AKTIF MENGINAP
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px', display: 'block' }}>
                          Hubungan: <strong style={{ color: isLight ? '#1e293b' : '#cbd5e1' }}>{g.relationship || 'Teman / Keluarga'}</strong> • Kamar: <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>{g.roomNumber}</strong> ({g.tenantName})
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#64748b', display: 'block' }}>Biaya Inap</span>
                        <strong style={{ fontSize: '0.9rem', color: isLight ? '#059669' : '#34d399', fontFamily: 'monospace' }}>
                          Rp {(g.totalFee || 0).toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '8px',
                      background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      border: isLight ? '1px solid #e2e8f0' : 'none',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      color: isLight ? '#334155' : '#cbd5e1'
                    }}>
                      <div>
                        <span style={{ color: isLight ? '#64748b' : '#64748b', display: 'block' }}>Mulai Inap:</span>
                        <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{g.startDate} ({g.durationDays} malam)</strong>
                      </div>
                      <div>
                        <span style={{ color: isLight ? '#64748b' : '#64748b', display: 'block' }}>No HP Tamu:</span>
                        <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{g.guestPhone}</strong>
                      </div>
                      <div>
                        <span style={{ color: isLight ? '#64748b' : '#64748b', display: 'block' }}>Plat Kendaraan:</span>
                        <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{g.vehiclePlate || '-'}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={() => handleCheckoutGuest(g.id, g.guestName)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.76rem', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        <LogOut size={13} /> Tandai Selesai / Check-out Tamu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Register Guest Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterGuest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: isLight ? '#f0f9ff' : 'rgba(56, 189, 248, 0.08)',
              border: isLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <ShieldCheck size={20} color={isLight ? '#0284c7' : '#38bdf8'} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.76rem', color: isLight ? '#0f172a' : '#cbd5e1', lineHeight: '1.4' }}>
                <strong>Ketentuan Inap Tamu Kost:</strong> Tamu wajib didaftarkan sebelum jam 21.00 WIB. Biaya inap kebersihan & air: <span style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 700 }}>Rp 25.000 / malam</span>.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Lengkap Tamu:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dimas Ramadhan"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nomor HP / WA Tamu:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081298765432"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Hubungan dengan Penghuni:
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                >
                  <option value="Keluarga / Saudara">👨‍👩‍👦 Keluarga / Saudara Kandung</option>
                  <option value="Orang Tua">👵 Orang Tua</option>
                  <option value="Teman Kuliah / Kampus">🎓 Teman Kuliah / Kampus</option>
                  <option value="Rekan Kerja">💼 Rekan Kerja</option>
                  <option value="Lainnya">🤝 Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Kamar Penghuni yang Dituju:
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Nomor Kamar"
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Tanggal Mulai Menginap:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Lama Menginap:
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                >
                  <option value={1}>1 Malam (Rp 25.000)</option>
                  <option value={2}>2 Malam (Rp 50.000)</option>
                  <option value={3}>3 Malam (Rp 75.000)</option>
                  <option value={4}>4 Malam (Rp 100.000)</option>
                  <option value={5}>5 Malam (Rp 125.000)</option>
                  <option value={7}>1 Minggu / 7 Malam (Rp 175.000)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Plat Nomor Kendaraan Tamu (Bila Membawa Motor/Mobil):
              </label>
              <input
                type="text"
                placeholder="Contoh: B 4521 KLZ / D 1892 AB (Motor)"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Menginap untuk hadir acara wisuda kampus"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{
              background: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.1)',
              border: isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: isLight ? '#475569' : '#94a3b8', display: 'block' }}>Total Biaya Inap Tambahan:</span>
                <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#64748b' }}>{durationDays} malam x Rp 25.000</span>
              </div>
              <strong style={{ fontSize: '1.25rem', color: isLight ? '#059669' : '#34d399', fontFamily: 'monospace' }}>
                Rp {(durationDays * OVERNIGHT_RATE_PER_NIGHT).toLocaleString('id-ID')}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.84rem' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 2, fontSize: '0.84rem', fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
              >
                {submitting ? 'Mendaftarkan...' : 'Kirim Pendaftaran Tamu'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pastGuests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: isLight ? '#64748b' : '#64748b' }}>
                Belum ada riwayat tamu terdahulu.
              </div>
            ) : (
              pastGuests.map(g => (
                <div
                  key={g.id}
                  style={{
                    background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  <div>
                    <strong style={{ color: isLight ? '#0f172a' : 'white', display: 'block' }}>{g.guestName}</strong>
                    <span style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.74rem' }}>
                      Kamar {g.roomNumber} ({g.tenantName}) • {g.startDate} ({g.durationDays} malam)
                    </span>
                  </div>
                  <span style={{
                    background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)',
                    color: isLight ? '#475569' : '#94a3b8',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem'
                  }}>
                    CHECK-OUT SELESAI
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
