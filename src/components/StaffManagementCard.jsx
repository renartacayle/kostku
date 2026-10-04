import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Key, 
  Copy, 
  Check, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Building2, 
  Wrench,
  AlertCircle
} from 'lucide-react';
import { 
  apiGetOwnerStaff, 
  apiCreateStaff, 
  apiUpdateStaff, 
  apiDeleteStaff, 
  apiGetOwnerKosts 
} from '../services/api';

export default function StaffManagementCard({ user }) {
  const [staffList, setStaffList] = useState([]);
  const [ownedKosts, setOwnedKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    jobTitle: 'Penjaga Kost',
    salary: '',
    kostUid: user?.kostUid || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset Password State
  const [resetModalStaff, setResetModalStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const loadStaffAndKosts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [staffData, kostsData] = await Promise.all([
        apiGetOwnerStaff(null, user.id).catch(() => []),
        apiGetOwnerKosts(user.id).catch(() => [])
      ]);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      const kostList = Array.isArray(kostsData) ? kostsData : [];
      setOwnedKosts(kostList);
      if (kostList.length > 0 && !formData.kostUid) {
        setFormData(prev => ({ ...prev, kostUid: kostList[0].uid }));
      }
    } catch (err) {
      console.error('Failed loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffAndKosts();
  }, [user?.id, user?.kostUid]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.kostUid) {
      setErrorMsg('Harap lengkapi semua bidang wajib.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiCreateStaff({
        ...formData,
        ownerId: user.id
      });
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        jobTitle: 'Penjaga Kost',
        salary: '',
        kostUid: ownedKosts[0]?.uid || user?.kostUid || ''
      });
      setActionMsg('✅ Akun login staf berhasil dibuat!');
      setTimeout(() => setActionMsg(null), 4000);
      loadStaffAndKosts();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membuat akun staf.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus akses login untuk ${name}?`)) return;
    try {
      await apiDeleteStaff(id);
      setStaffList(prev => prev.filter(s => s.id !== id));
      setActionMsg(`🗑️ Akun staf ${name} berhasil dihapus.`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal menghapus akun staf: ' + err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalStaff || !newPassword) return;
    setResetting(true);
    try {
      await apiUpdateStaff(resetModalStaff.id, { newPassword });
      setResetModalStaff(null);
      setNewPassword('');
      setActionMsg(`🔑 Password untuk ${resetModalStaff.name} berhasil diubah.`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal reset password: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const copyCredentials = (staff) => {
    const text = `Halo ${staff.name}, berikut adalah akun login aplikasi KostKu Anda:\n\n📧 Email: ${staff.email}\n🏢 Cabang Kost: ${staff.kostName}\n💼 Posisi: ${staff.jobTitle}\n\nSilakan download dan login di aplikasi KostKu untuk mulai mengelola operasional kost. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number || 0);

  return (
    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Wrench size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>
              Akun Login Staf & Penjaga Kost ({staffList.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Berikan akses login terisolasi untuk staf mengelola kamar, keluhan, dan meteran.
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setShowModal(true);
          }}
          className="btn btn-primary btn-sm"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981', gap: '6px' }}
        >
          <Plus size={15} /> Buat Akun Staf Baru
        </button>
      </div>

      {actionMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#6ee7b7',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Staff List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Memuat data staf...
        </div>
      ) : staffList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px dashed var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <Users size={32} color="#64748b" style={{ margin: '0 auto 10px' }} />
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'white' }}>
            Belum ada akun login staf yang dibuat.
          </p>
          <span style={{ fontSize: '0.8rem' }}>
            Klik tombol <strong>"+ Buat Akun Staf Baru"</strong> untuk memberikan akses login kepada penjaga kost Anda.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {staffList.map(staff => (
            <div
              key={staff.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '1rem',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: 'white',
                  fontSize: '1.05rem',
                  flexShrink: 0
                }}>
                  {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.98rem', color: 'white' }}>{staff.name}</strong>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      fontWeight: 700
                    }}>
                      🟢 Login Aktif
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
                      {staff.jobTitle || 'Penjaga Kost'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      Cabang: <strong style={{ color: 'white' }}>{staff.kostName}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact info & salary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={12} color="#60a5fa" />
                    <span>{staff.email}</span>
                  </div>
                  {staff.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Phone size={12} color="#4ade80" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                </div>

                {staff.salary > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Gaji Pokok</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24' }}>
                      {formatRupiah(staff.salary)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => copyCredentials(staff)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '5px', fontSize: '0.78rem', padding: '6px 10px' }}
                  title="Salin pesan info login untuk dikirim ke WhatsApp staf"
                >
                  {copiedId === staff.id ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                  <span>{copiedId === staff.id ? 'Tersalin!' : 'Salin Info WA'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetModalStaff(staff);
                    setNewPassword('');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '5px', fontSize: '0.78rem', padding: '6px 10px' }}
                  title="Ganti atau reset password staf"
                >
                  <Key size={13} />
                  <span>Reset Sandi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteStaff(staff.id, staff.name)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Hapus akun login staf"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Users size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Buat Akun Staf Lapangan</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Staf bisa login langsung di aplikasi KostKu</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.82rem',
                marginBottom: '1rem'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Nama Lengkap Staf *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Joko Santoso"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Email Login *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="joko.penjaga@kostku.id"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Password Awal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    No WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Gaji Pokok (Rp/bulan)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 2000000"
                    value={formData.salary}
                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Posisi / Jabatan
                </label>
                <select
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="input-field"
                >
                  <option value="Penjaga Kost" style={{ background: '#0f172a' }}>Penjaga Kost (All-round)</option>
                  <option value="Kebersihan / Housekeeping" style={{ background: '#0f172a' }}>Kebersihan / Housekeeping</option>
                  <option value="Keamanan / Security" style={{ background: '#0f172a' }}>Keamanan / Security</option>
                  <option value="Teknisi Listrik & Air" style={{ background: '#0f172a' }}>Teknisi Listrik & Air</option>
                  <option value="Admin Operasional Lapangan" style={{ background: '#0f172a' }}>Admin Operasional Lapangan</option>
                </select>
              </div>

              {ownedKosts.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Tugaskan di Cabang Kost *
                  </label>
                  <select
                    value={formData.kostUid}
                    onChange={e => setFormData({ ...formData, kostUid: e.target.value })}
                    className="input-field"
                    required
                  >
                    {ownedKosts.map(k => (
                      <option key={k.uid} value={k.uid} style={{ background: '#0f172a' }}>
                        {k.kostName} ({k.totalRooms || k.roomCount || 0} Kamar)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '10px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  {submitting ? 'Membuat Akun...' : 'Simpan & Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalStaff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'white' }}>
              Reset Password Staf
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              Ganti password untuk <strong>{resetModalStaff.name}</strong> ({resetModalStaff.email}).
            </p>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Password Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan password baru"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setResetModalStaff(null)}
                  className="btn btn-secondary"
                  disabled={resetting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="btn btn-primary"
                >
                  {resetting ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
