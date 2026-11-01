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
  AlertCircle,
  Tag,
  CheckSquare,
  Square,
  Layers,
  UserCheck,
  Calendar as CalendarIcon
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  apiGetOwnerStaff, 
  apiCreateStaff, 
  apiUpdateStaff, 
  apiDeleteStaff, 
  apiGetOwnerKosts 
} from '../services/api';

const AVAILABLE_ROLES = [
  { id: 'Penjaga Kost', label: 'Penjaga Kost (All-round)', color: '#10b981' },
  { id: 'Petugas Kebersihan', label: 'Petugas Kebersihan (Housekeeping)', color: '#06b6d4' },
  { id: 'Teknisi Listrik & Air', label: 'Teknisi Listrik, Pompa & Pipa Air', color: '#f59e0b' },
  { id: 'Satpam / Keamanan', label: 'Satpam / Keamanan & Ronda Malam', color: '#ec4899' },
  { id: 'Admin Pembukuan', label: 'Admin Pembukuan & Kas Kecil', color: '#8b5cf6' },
  { id: 'Resepsionis / Tour Kamar', label: 'Resepsionis / Tour Calon Penghuni', color: '#3b82f6' }
];

export default function StaffManagementCard({ user, selectedStaffId, onSelectStaff }) {
  const [staffList, setStaffList] = useState([]);
  const [ownedKosts, setOwnedKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  // Form State for creating staff
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    salary: '',
    kostUid: user?.kostUid || ''
  });
  const [formRoleMode, setFormRoleMode] = useState('single'); // 'single' | 'multiple'
  const [formSelectedRoles, setFormSelectedRoles] = useState(['Penjaga Kost']);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset Password State
  const [resetModalStaff, setResetModalStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Edit Role Modal State
  const [roleModalStaff, setRoleModalStaff] = useState(null);
  const [editRoleMode, setEditRoleMode] = useState('single');
  const [editSelectedRoles, setEditSelectedRoles] = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const loadStaffAndKosts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [staffData, kostsData] = await Promise.all([
        apiGetOwnerStaff(null, user.id).catch(() => []),
        apiGetOwnerKosts(user.id).catch(() => [])
      ]);
      const sList = Array.isArray(staffData) ? staffData : [];
      setStaffList(sList);
      if (onSelectStaff && sList.length > 0 && !selectedStaffId) {
        onSelectStaff(sList[0]);
      }
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
    if (formSelectedRoles.length === 0) {
      setErrorMsg('Pilih minimal 1 role penugasan karyawan.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiCreateStaff({
        ...formData,
        roles: formSelectedRoles,
        jobTitle: formSelectedRoles.join(', '),
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
        salary: '',
        kostUid: ownedKosts[0]?.uid || user?.kostUid || ''
      });
      setFormSelectedRoles(['Penjaga Kost']);
      setFormRoleMode('single');
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

  const handleOpenEditRoles = (staff) => {
    setRoleModalStaff(staff);
    const existingRoles = Array.isArray(staff.roles) && staff.roles.length > 0
      ? staff.roles
      : (staff.jobTitle ? staff.jobTitle.split(',').map(r => r.trim()).filter(Boolean) : ['Penjaga Kost']);
    setEditSelectedRoles(existingRoles);
    setEditRoleMode(existingRoles.length > 1 ? 'multiple' : 'single');
  };

  const handleSaveEditedRoles = async () => {
    if (!roleModalStaff) return;
    if (editSelectedRoles.length === 0) {
      alert('Pilih minimal 1 role untuk karyawan.');
      return;
    }
    setSavingRoles(true);
    try {
      await apiUpdateStaff(roleModalStaff.id, {
        roles: editSelectedRoles,
        jobTitle: editSelectedRoles.join(', ')
      });
      setRoleModalStaff(null);
      setActionMsg(`🏷️ Penugasan role untuk ${roleModalStaff.name} berhasil diperbarui.`);
      loadStaffAndKosts();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal memperbarui role: ' + err.message);
    } finally {
      setSavingRoles(false);
    }
  };

  const toggleFormRole = (roleId) => {
    if (formRoleMode === 'single') {
      setFormSelectedRoles([roleId]);
    } else {
      if (formSelectedRoles.includes(roleId)) {
        if (formSelectedRoles.length === 1) return; // Keep at least one
        setFormSelectedRoles(formSelectedRoles.filter(r => r !== roleId));
      } else {
        setFormSelectedRoles([...formSelectedRoles, roleId]);
      }
    }
  };

  const toggleEditRole = (roleId) => {
    if (editRoleMode === 'single') {
      setEditSelectedRoles([roleId]);
    } else {
      if (editSelectedRoles.includes(roleId)) {
        if (editSelectedRoles.length === 1) return;
        setEditSelectedRoles(editSelectedRoles.filter(r => r !== roleId));
      } else {
        setEditSelectedRoles([...editSelectedRoles, roleId]);
      }
    }
  };

  const copyCredentials = (staff) => {
    const rolesStr = Array.isArray(staff.roles) && staff.roles.length > 0 ? staff.roles.join(', ') : (staff.jobTitle || 'Penjaga Kost');
    const text = `Halo ${staff.name}, berikut adalah akun login aplikasi KostKu Anda:\n\n📧 Email: ${staff.email}\n🏢 Cabang Kost: ${staff.kostName}\n💼 Posisi / Peran: ${rolesStr}\n\nSilakan download dan login di aplikasi KostKu untuk mulai mengelola operasional kost. Terima kasih!`;
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
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              Profil & Role Karyawan ({staffList.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Kelola penugasan peran (Single Role atau Multiple Roles), kontak WhatsApp, dan akses login staf.
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setFormRoleMode('single');
            setFormSelectedRoles(['Penjaga Kost']);
            setShowModal(true);
          }}
          className="btn btn-primary btn-sm"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981', gap: '6px' }}
        >
          <Plus size={15} /> Tambah Karyawan Baru
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
          padding: '2.5rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px dashed var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <Users size={32} color="#64748b" style={{ margin: '0 auto 10px' }} />
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Belum ada akun login staf yang dibuat.
          </p>
          <span style={{ fontSize: '0.8rem' }}>
            Klik tombol <strong>"+ Tambah Karyawan Baru"</strong> untuk mendaftarkan staf dan menentukan peran kerja mereka.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {staffList.map(staff => {
            const rolesArr = Array.isArray(staff.roles) && staff.roles.length > 0
              ? staff.roles
              : (staff.jobTitle ? staff.jobTitle.split(',').map(r => r.trim()).filter(Boolean) : ['Penjaga Kost']);
            const isMultiRole = rolesArr.length > 1;
            const isSelected = selectedStaffId && String(selectedStaffId) === String(staff.id);

            return (
              <div
                key={staff.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '1.1rem',
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                  boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none',
                  transition: 'all 0.2s',
                  cursor: onSelectStaff ? 'pointer' : 'default'
                }}
              >
                {/* Staff Info & Role Pills */}
                <div 
                  onClick={() => onSelectStaff && onSelectStaff(staff)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: '240px', flex: 1 }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: 'white',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                  }}>
                    {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{staff.name}</strong>
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
                      {isSelected && (
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.25)',
                          color: '#93c5fd',
                          fontWeight: 700,
                          border: '1px solid #3b82f6'
                        }}>
                          ⭐ Kalender Aktif
                        </span>
                      )}
                      {staff.avgRating && (
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24',
                          fontWeight: 700,
                          border: '1px solid rgba(245, 158, 11, 0.35)'
                        }}>
                          ⭐ {staff.avgRating} ({staff.totalReviews || 0})
                        </span>
                      )}
                      {isMultiRole && (
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#c4b5fd',
                          fontWeight: 700,
                          border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}>
                          ⚡ Multiple Roles ({rolesArr.length})
                        </span>
                      )}
                    </div>

                    {/* Roles Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {rolesArr.map((r, i) => {
                        const matched = AVAILABLE_ROLES.find(ar => ar.id === r);
                        return (
                          <span 
                            key={i}
                            style={{
                              fontSize: '0.74rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: matched ? `${matched.color}20` : 'rgba(59, 130, 246, 0.15)',
                              color: matched ? matched.color : '#93c5fd',
                              fontWeight: 600,
                              border: matched ? `1px solid ${matched.color}50` : '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                          >
                            {r}
                          </span>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                      Cabang: <strong style={{ color: 'var(--text-primary)' }}>{staff.kostName}</strong>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {onSelectStaff && (
                    <button
                      type="button"
                      onClick={() => onSelectStaff(staff)}
                      className="btn btn-sm"
                      style={{
                        gap: '5px',
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(59, 130, 246, 0.15)',
                        color: 'white',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.3)',
                        boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
                        fontWeight: isSelected ? 700 : 500
                      }}
                      title="Buka Kalender Kerja & Riwayat Harian Karyawan Ini"
                    >
                      <CalendarIcon size={13} />
                      <span>{isSelected ? '✓ Kalender Aktif' : 'Buka Kalender'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEditRoles(staff)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '5px', fontSize: '0.78rem', padding: '6px 10px', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}
                    title="Ubah peran kerja (Single Role / Multiple Roles)"
                  >
                    <Tag size={13} />
                    <span>Atur Role</span>
                  </button>

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
                    title="Hapus akun staf"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE STAFF MODAL (WITH SINGLE / MULTIPLE ROLE SELECTOR) */}
      {showModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '20px',
            maxWidth: '540px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            maxHeight: '92vh',
            overflowY: 'auto'
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
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Buat Akun Staf Lapangan</h3>
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

              {/* ROLE MODE SWITCHER (SINGLE VS MULTIPLE ROLES) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="#60a5fa" /> Mode Penugasan Peran (Role) *
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormRoleMode('single');
                        setFormSelectedRoles(prev => prev.slice(0, 1));
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: formRoleMode === 'single' ? '#10b981' : 'var(--border-color)',
                        background: formRoleMode === 'single' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        color: formRoleMode === 'single' ? '#34d399' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Single Role
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormRoleMode('multiple')}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: formRoleMode === 'multiple' ? '#8b5cf6' : 'var(--border-color)',
                        background: formRoleMode === 'multiple' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: formRoleMode === 'multiple' ? '#c4b5fd' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Multiple Roles
                    </button>
                  </div>
                </div>

                <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                  {formRoleMode === 'single'
                    ? 'Pilih 1 peran fokus untuk staf ini.'
                    : 'Pilih beberapa peran sekaligus jika staf merangkap tugas (misal: Penjaga + Teknisi + Kebersihan).'}
                </p>

                {/* Role Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  {AVAILABLE_ROLES.map(r => {
                    const isSelected = formSelectedRoles.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => toggleFormRole(r.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isSelected ? `1.5px solid ${r.color}` : '1px solid var(--border-color)',
                          background: isSelected ? `${r.color}15` : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare size={16} color={r.color} />
                        ) : (
                          <Square size={16} color="#64748b" />
                        )}
                        <span style={{ fontSize: '0.82rem', color: isSelected ? 'white' : '#cbd5e1', fontWeight: isSelected ? 700 : 500 }}>
                          {r.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
        </div>,
        document.body
      )}

      {/* EDIT ROLE MODAL (SINGLE VS MULTIPLE) */}
      {roleModalStaff && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  Atur Penugasan Role Karyawan
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Staf: <strong>{roleModalStaff.name}</strong> ({roleModalStaff.kostName})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalStaff(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Tipe Penugasan:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditRoleMode('single');
                    setEditSelectedRoles(prev => prev.slice(0, 1));
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: editRoleMode === 'single' ? '#10b981' : 'var(--border-color)',
                    background: editRoleMode === 'single' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: editRoleMode === 'single' ? '#34d399' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Single Role
                </button>
                <button
                  type="button"
                  onClick={() => setEditRoleMode('multiple')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: editRoleMode === 'multiple' ? '#8b5cf6' : 'var(--border-color)',
                    background: editRoleMode === 'multiple' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: editRoleMode === 'multiple' ? '#c4b5fd' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Multiple Roles
                </button>
              </div>
            </div>

            {/* Checkbox list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
              {AVAILABLE_ROLES.map(r => {
                const isSelected = editSelectedRoles.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleEditRole(r.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isSelected ? `1.5px solid ${r.color}` : '1px solid var(--border-color)',
                      background: isSelected ? `${r.color}15` : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare size={16} color={r.color} />
                    ) : (
                      <Square size={16} color="#64748b" />
                    )}
                    <span style={{ fontSize: '0.82rem', color: isSelected ? 'white' : '#cbd5e1', fontWeight: isSelected ? 700 : 500 }}>
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRoleModalStaff(null)}
                className="btn btn-secondary"
                disabled={savingRoles}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedRoles}
                disabled={savingRoles || editSelectedRoles.length === 0}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
              >
                {savingRoles ? 'Menyimpan...' : 'Simpan Penugasan Role'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalStaff && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
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
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
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
        </div>,
        document.body
      )}

    </div>
  );
}
