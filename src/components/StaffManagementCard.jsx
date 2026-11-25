import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Calendar as CalendarIcon,
  Link2,
  MessageCircle,
  ExternalLink,
  Clock,
  Send,
  X,
  CheckCircle2,
  Store,
  Crown
} from 'lucide-react';
import { createPortal } from 'react-dom';
import ActionTutorialBadge from './kasir/ActionTutorialBadge';
import {
  apiGetOwnerStaff,
  apiCreateStaff,
  apiUpdateStaff,
  apiUpdateStaffAccessRole,
  apiDeleteStaff,
  apiGetOwnerKosts,
  apiGetPosStores,
  apiGetStaffInvites,
  apiCreateStaffInvite,
  apiCancelStaffInvite
} from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { isPrimaryOwnerRole } from '../utils/staffRole';

const AVAILABLE_ROLES = [
  // POS & Bisnis UMKM Roles (Priority untuk Mitra)
  { id: 'Kasir Toko (Mitra POS)', label: 'Kasir Toko / Mitra POS', category: 'pos', desc: 'Melayani transaksi nota, laci kasir, & pembayaran QRIS/Tunai', color: '#2563eb' },
  { id: 'Staf Dapur & Pesanan', label: 'Staf Dapur & Pesanan (KDS)', category: 'pos', desc: 'Melihat pesanan masuk meja QR & update status masakan', color: '#db2777' },
  { id: 'Barista / Minuman', label: 'Barista / Racik Minuman', category: 'pos', desc: 'Fokus pesanan minuman cepat saji & racikan kopi', color: '#06b6d4' },
  { id: 'Pelayan / Waiter', label: 'Pelayan / Waiter Antar Meja', category: 'pos', desc: 'Antar pesanan ke nomor meja pelanggan & hospitality', color: '#f59e0b' },
  { id: 'Admin Pembukuan Toko', label: 'Admin Pembukuan Toko', category: 'pos', desc: 'Cek omset harian kasir & kelola stok bahan baku', color: '#8b5cf6' },

  // Operasional Kost Roles
  { id: 'Penjaga Kost', label: 'Penjaga Kost (All-round)', category: 'kost', desc: 'Pengawasan harian, kunci & operasional umum properti', color: '#10b981' },
  { id: 'Petugas Kebersihan', label: 'Petugas Kebersihan (Housekeeping)', category: 'kost', desc: 'Pembersihan lorong, fasilitas umum, & kamar kosong', color: '#06b6d4' },
  { id: 'Teknisi Listrik & Air', label: 'Teknisi Listrik, Pompa & Pipa Air', category: 'kost', desc: 'Perbaikan fasilitas fisik, AC, wifi, & saluran air', color: '#f59e0b' },
  { id: 'Satpam / Keamanan', label: 'Satpam / Keamanan & Ronda Malam', category: 'kost', desc: 'Penjagaan gerbang, parkiran, & ketertiban kost', color: '#ec4899' },
  { id: 'Admin Pembukuan', label: 'Admin Pembukuan & Kas Kecil Kost', category: 'kost', desc: 'Pencatatan uang sewa kamar, denda, & iuran kost', color: '#8b5cf6' },
  { id: 'Resepsionis / Tour Kamar', label: 'Resepsionis / Tour Calon Penghuni', category: 'kost', desc: 'Melayani survei calon penghuni & check-in', color: '#3b82f6' }
];

export default function StaffManagementCard({ user, selectedStaffId, onSelectStaff }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const modalBg = isLight ? '#ffffff' : '#0f172a';
  const modalText = isLight ? '#0f172a' : '#f8fafc';
  const modalSubText = isLight ? '#475569' : '#94a3b8';
  const modalPanelBg = isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const modalBorder = isLight ? '#e2e8f0' : 'var(--border-color)';

  const [staffList, setStaffList] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [ownedKosts, setOwnedKosts] = useState([]);
  const [posStores, setPosStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const isMitraContext = Boolean(user?.role === 'mitra' || user?.isMitra || user?.merchantId);
  const prioritizedRoles = [...AVAILABLE_ROLES].sort((a, b) => {
    if (isMitraContext) {
      if (a.category === 'pos' && b.category !== 'pos') return -1;
      if (a.category !== 'pos' && b.category === 'pos') return 1;
    } else {
      if (a.category === 'kost' && b.category !== 'kost') return -1;
      if (a.category !== 'kost' && b.category === 'kost') return 1;
    }
    return 0;
  });

  const [copiedInviteId, setCopiedInviteId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Add Mode: 'invite' (via WA / Gmail link — employee clicks link to add) | 'direct' (immediate manual)
  const [addMode, setAddMode] = useState('invite');
  const [inviteChannel, setInviteChannel] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [createdInviteResult, setCreatedInviteResult] = useState(null);

  // Form State for creating staff or sending invite
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    salary: '',
    kostUid: user?.kostUid || ''
  });
  const [formRoleMode, setFormRoleMode] = useState('single'); // 'single' | 'multiple'
  const [formAccountRole, setFormAccountRole] = useState('staff'); // 'staff' | 'admin'
  const [formSelectedRoles, setFormSelectedRoles] = useState(['Penjaga Kost']);
  const [formAssignedStoreIds, setFormAssignedStoreIds] = useState(['all']);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset Password State
  const [resetModalStaff, setResetModalStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  // Edit Role & Branch Modal State
  const [roleModalStaff, setRoleModalStaff] = useState(null);
  const [editRoleMode, setEditRoleMode] = useState('single');
  const [editSelectedRoles, setEditSelectedRoles] = useState([]);
  const [editAssignedStoreIds, setEditAssignedStoreIds] = useState(['all']);
  const [editRoleError, setEditRoleError] = useState('');
  const [savingRoles, setSavingRoles] = useState(false);

  // Inline Confirm Delete Staff State (Zero window.confirm)
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(false);
  const [promotingStaffId, setPromotingStaffId] = useState(null);

  const canManageAdminRoles = ['owner', 'mitra', 'master', 'admin'].includes(String(user?.role || '').toLowerCase());
  const effectiveOwnerId = (String(user?.role || '').toLowerCase() === 'admin' && user?.ownerId)
    ? user.ownerId
    : user?.id;

  const loadStaffAndKosts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [staffData, kostsData, invitesData, storesData] = await Promise.all([
        apiGetOwnerStaff(null, effectiveOwnerId || user.id).catch(() => []),
        apiGetOwnerKosts(effectiveOwnerId || user.id).catch(() => []),
        apiGetStaffInvites(null, effectiveOwnerId || user.id, 'pending').catch(() => []),
        apiGetPosStores(effectiveOwnerId || user.id).catch(() => [])
      ]);
      const sList = Array.isArray(staffData) ? staffData : [];
      setStaffList(sList);
      setPendingInvites(Array.isArray(invitesData) ? invitesData : []);
      const storeArr = Array.isArray(storesData)
        ? storesData
        : Array.isArray(storesData?.stores)
          ? storesData.stores
          : (Array.isArray(storesData?.allOwnerStores) ? storesData.allOwnerStores : []);
      setPosStores(storeArr);
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

  const defaultStaffRoles = (user?.role === 'mitra' || (ownedKosts.length === 0 && posStores.length > 0))
    ? ['Kasir Toko (Mitra POS)']
    : ['Penjaga Kost'];

  const resetFormFields = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      salary: '',
      kostUid: ownedKosts[0]?.uid || user?.kostUid || ''
    });
    setFormSelectedRoles(defaultStaffRoles);
    setFormAssignedStoreIds(['all']);
    setFormAccountRole('staff');
    setFormRoleMode('single');
    setErrorMsg('');
  };

  const handleOpenAddModal = () => {
    resetFormFields();
    setAddMode('invite');
    setInviteChannel('whatsapp');
    setCreatedInviteResult(null);
    setShowModal(true);
  };

  const handleCreateStaffOrInvite = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const effectiveKostUid = formData.kostUid || ownedKosts[0]?.uid || user?.kostUid || '';
    if (formSelectedRoles.length === 0) {
      setErrorMsg('Pilih minimal 1 role penugasan karyawan.');
      return;
    }

    if (addMode === 'invite') {
      if (inviteChannel === 'whatsapp') {
        const cleanDigits = String(formData.phone || '').replace(/\D/g, '');
        if (cleanDigits.length < 9) {
          setErrorMsg('Masukkan nomor WhatsApp karyawan minimal 9 digit (contoh: 08123456789).');
          return;
        }
      } else {
        const cleanEmail = String(formData.email || '').trim();
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          setErrorMsg('Masukkan alamat Gmail karyawan yang valid.');
          return;
        }
      }

      setSubmitting(true);
      try {
        const res = await apiCreateStaffInvite({
          ownerId: effectiveOwnerId || user.id,
          kostUid: effectiveKostUid,
          channel: inviteChannel,
          target: inviteChannel === 'whatsapp' ? formData.phone.trim() : formData.email.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          name: formData.name.trim(),
          salary: formData.salary,
          accountRole: formAccountRole,
          targetRole: formAccountRole,
          roles: formSelectedRoles,
          jobTitle: formSelectedRoles.join(', '),
          assignedStoreIds: formAssignedStoreIds
        });
        setCreatedInviteResult(res);
        setActionMsg(res.message || 'Link undangan karyawan berhasil dibuat!');
        setTimeout(() => setActionMsg(null), 5000);
        loadStaffAndKosts();
      } catch (err) {
        setErrorMsg(err.message || 'Gagal membuat link undangan karyawan.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Direct / manual creation mode (requires Name and at least WA OR Gmail)
    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap karyawan wajib diisi.');
      return;
    }
    const cleanEmail = String(formData.email || '').trim();
    const cleanPhoneDigits = String(formData.phone || '').replace(/\D/g, '');
    if (!cleanEmail && cleanPhoneDigits.length < 9) {
      setErrorMsg('Isi minimal alamat Gmail atau nomor WhatsApp aktif karyawan.');
      return;
    }
    if (!effectiveKostUid && posStores.length === 0) {
      setErrorMsg('Pilih cabang penempatan karyawan terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const effectivePassword = formData.password && formData.password.trim() ? formData.password.trim() : 'kostku123';
      const res = await apiCreateStaff({
        ...formData,
        kostUid: effectiveKostUid,
        password: effectivePassword,
        accountRole: formAccountRole,
        targetRole: formAccountRole,
        roles: formSelectedRoles,
        jobTitle: formSelectedRoles.join(', '),
        assignedStoreIds: formAssignedStoreIds,
        ownerId: effectiveOwnerId || user.id
      });
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setShowModal(false);
      resetFormFields();
      setActionMsg(formAccountRole === 'admin'
        ? 'Akun Admin berhasil dibuat (akses setara Owner tanpa izin tarik dana).'
        : 'Akun login staf berhasil dibuat!');
      setTimeout(() => setActionMsg(null), 4000);
      loadStaffAndKosts();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membuat akun staf.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInviteLink = (inv) => {
    const link = inv?.inviteUrl || `${window.location.origin}/invite-staff/${inv.token}`;
    navigator.clipboard.writeText(link);
    setCopiedInviteId(inv.id);
    setTimeout(() => setCopiedInviteId(null), 3000);
  };

  const handleCancelPendingInvite = async (inv) => {
    try {
      await apiCancelStaffInvite(inv.id);
      setPendingInvites(prev => prev.filter(item => item.id !== inv.id));
      setActionMsg(`Undangan link untuk ${inv.target} dibatalkan.`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      setActionError('Gagal membatalkan undangan: ' + (err.message || 'Kesalahan server'));
      setTimeout(() => setActionError(null), 5000);
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;
    setDeletingStaff(true);
    try {
      await apiDeleteStaff(deleteConfirmStaff.id);
      setStaffList(prev => prev.filter(s => s.id !== deleteConfirmStaff.id));
      setActionMsg(`Akun staf ${deleteConfirmStaff.name} berhasil dihapus.`);
      setTimeout(() => setActionMsg(null), 4000);
      setDeleteConfirmStaff(null);
    } catch (err) {
      setActionError('Gagal menghapus akun staf: ' + (err.message || 'Terjadi kesalahan'));
      setTimeout(() => setActionError(null), 5000);
      setDeleteConfirmStaff(null);
    } finally {
      setDeletingStaff(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalStaff || !newPassword.trim()) {
      setResetError('Masukkan password baru terlebih dahulu.');
      return;
    }
    setResetting(true);
    setResetError('');
    try {
      await apiUpdateStaff(resetModalStaff.id, { newPassword: newPassword.trim() });
      setResetModalStaff(null);
      setNewPassword('');
      setActionMsg(`Password untuk ${resetModalStaff.name} berhasil diubah.`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      setResetError('Gagal reset password: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setResetting(false);
    }
  };

  const handleOpenEditRoles = (staff) => {
    setRoleModalStaff(staff);
    setEditRoleError('');
    const existingRoles = Array.isArray(staff.roles) && staff.roles.length > 0
      ? staff.roles
      : (staff.jobTitle ? staff.jobTitle.split(',').map(r => r.trim()).filter(Boolean) : ['Penjaga Kost']);
    setEditSelectedRoles(existingRoles);
    setEditAssignedStoreIds(
      Array.isArray(staff.assignedStoreIds) && staff.assignedStoreIds.length > 0 ? staff.assignedStoreIds : ['all']
    );
    setEditRoleMode(existingRoles.length > 1 ? 'multiple' : 'single');
  };

  const handleSaveEditedRoles = async () => {
    if (!roleModalStaff) return;
    if (editSelectedRoles.length === 0) {
      setEditRoleError('Pilih minimal 1 role untuk karyawan.');
      return;
    }
    setSavingRoles(true);
    setEditRoleError('');
    try {
      await apiUpdateStaff(roleModalStaff.id, {
        roles: editSelectedRoles,
        jobTitle: editSelectedRoles.join(', '),
        assignedStoreIds: editAssignedStoreIds
      });
      setRoleModalStaff(null);
      setActionMsg(`Penugasan role & cabang untuk ${roleModalStaff.name} berhasil diperbarui.`);
      loadStaffAndKosts();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      setEditRoleError('Gagal memperbarui role: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSavingRoles(false);
    }
  };

  const handleToggleAdminRole = async (staff) => {
    if (!canManageAdminRoles || !staff?.id || promotingStaffId) return;
    const isCurrentlyAdmin = String(staff.role || '').toLowerCase() === 'admin';
    const nextRole = isCurrentlyAdmin ? 'staff' : 'admin';
    setPromotingStaffId(staff.id);
    setActionError(null);
    setActionMsg(null);
    try {
      const res = await apiUpdateStaffAccessRole(staff.id, nextRole, user?.id);
      setStaffList(prev => prev.map(s => (String(s.id) === String(staff.id) ? { ...s, role: nextRole } : s)));
      setActionMsg(
        res?.message || (nextRole === 'admin'
          ? `${staff.name} berhasil dinaikkan menjadi Admin!`
          : `${staff.name} diturunkan kembali menjadi Karyawan.`)
      );
      setTimeout(() => setActionMsg(null), 4500);
    } catch (err) {
      setActionError(err?.message || 'Gagal mengubah level Admin/Karyawan.');
    } finally {
      setPromotingStaffId(null);
    }
  };

  const toggleStoreSelection = (currentIds, targetStoreId) => {
    if (targetStoreId === 'all') return ['all'];
    const withoutAll = (currentIds || []).filter(id => id !== 'all');
    if (withoutAll.includes(targetStoreId)) {
      const next = withoutAll.filter(id => id !== targetStoreId);
      return next.length === 0 ? ['all'] : next;
    }
    return [...withoutAll, targetStoreId];
  };

  const resolveAssignedStoreLabels = (assignedIds, assignedNames) => {
    const ids = Array.isArray(assignedIds) && assignedIds.length > 0 ? assignedIds : ['all'];
    if (ids.includes('all')) return ['Semua Cabang'];
    if (Array.isArray(assignedNames) && assignedNames.length > 0) return assignedNames;
    return ids.map(sid => {
      const matched = posStores.find(st => String(st.id) === String(sid));
      return matched ? matched.name : sid;
    });
  };

  const renderStoreAssignmentPicker = (selectedIds, onChangeIds, prefix) => {
    const activeIds = Array.isArray(selectedIds) && selectedIds.length > 0 ? selectedIds : ['all'];
    const isAll = activeIds.includes('all');
    return (
      <div style={{
        padding: '12px',
        borderRadius: '12px',
        background: modalPanelBg,
        border: `1px solid ${modalBorder}`,
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: modalText, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Store size={14} color="#10b981" /> Penugasan Cabang Toko POS
          </label>
          <span style={{ fontSize: '0.7rem', color: modalSubText }}>
            {isAll ? 'Akses semua cabang' : `${activeIds.length} cabang dipilih`}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            data-testid={`${prefix}-store-all`}
            onClick={() => onChangeIds(toggleStoreSelection(activeIds, 'all'))}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              border: isAll ? '1.5px solid #10b981' : `1px solid ${modalBorder}`,
              background: isAll ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
              color: isAll ? (isLight ? '#047857' : '#34d399') : modalSubText,
              fontSize: '0.74rem',
              fontWeight: isAll ? 800 : 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {isAll ? <CheckSquare size={13} color="#10b981" /> : <Square size={13} color="#64748b" />}
            <span>Semua Cabang</span>
          </button>
          {posStores.map((st) => {
            const sid = String(st.id);
            const checked = !isAll && activeIds.includes(sid);
            return (
              <button
                key={sid}
                type="button"
                data-testid={`${prefix}-store-${sid}`}
                onClick={() => onChangeIds(toggleStoreSelection(activeIds, sid))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: checked ? '1.5px solid #2563eb' : `1px solid ${modalBorder}`,
                  background: checked ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  color: checked ? (isLight ? '#1d4ed8' : '#93c5fd') : modalSubText,
                  fontSize: '0.74rem',
                  fontWeight: checked ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {checked ? <CheckSquare size={13} color="#2563eb" /> : <Square size={13} color="#64748b" />}
                <span>{st.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const toggleFormRole = (roleId) => {
    if (formRoleMode === 'single') {
      setFormSelectedRoles([roleId]);
    } else {
      if (formSelectedRoles.includes(roleId)) {
        if (formSelectedRoles.length === 1) return;
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
    const loginLine = [
      staff.email ? `Gmail: ${staff.email}` : '',
      staff.phone ? `No. WhatsApp: ${staff.phone}` : ''
    ].filter(Boolean).join('\n');
    const text = `Halo ${staff.name}, berikut adalah akun login aplikasi KostKu Anda:\n\n${loginLine}\nCabang: ${staff.kostName}\nPosisi / Peran: ${rolesStr}\n\nSilakan buka aplikasi KostKu dan masuk menggunakan Gmail atau No. WhatsApp terdaftar. Terima kasih!`;
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
              Profil &amp; Role Karyawan ({staffList.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Undang karyawan via link WhatsApp / Gmail (klik link langsung bergabung) atau buat akun manual.
            </span>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981', gap: '6px' }}
          >
            <Plus size={15} /> Tambah Karyawan Baru
          </button>
          <ActionTutorialBadge
            isLight={isLight}
            title="Tambah Karyawan Baru"
            steps={[
              'Pilih mode Link Undangan via WhatsApp atau Gmail agar karyawan tinggal klik link lalu bergabung otomatis.',
              'Atau pilih Input Langsung jika ingin membuat akun & password secara manual.',
              'Tentukan role tugas dan cabang toko POS tempat karyawan berjaga.'
            ]}
          />
        </div>
      </div>

      {actionMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: isLight ? '#065f46' : '#6ee7b7',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} style={{ flexShrink: 0 }} />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionError && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: isLight ? '#991b1b' : '#fca5a5',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {actionError}
          </span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Pending Invitation Links List (Menunggu Karyawan Klik Link) */}
      {pendingInvites.length > 0 && (
        <div style={{
          background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.88rem', color: isLight ? '#92400e' : '#fcd34d' }}>
              <Clock size={16} />
              <span>Undangan Link Menunggu Konfirmasi ({pendingInvites.length})</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: isLight ? '#b45309' : '#fde68a' }}>
              Karyawan otomatis masuk daftar aktif begitu mereka klik link &amp; konfirmasi.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingInvites.map(inv => {
              const linkUrl = inv.inviteUrl || `${window.location.origin}/invite-staff/${inv.token}`;
              return (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
                    border: `1px solid ${modalBorder}`
                  }}
                >
                  <div style={{ minWidth: '210px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: inv.channel === 'email' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(16, 185, 129, 0.16)',
                        color: inv.channel === 'email' ? '#ef4444' : '#10b981',
                        border: `1px solid ${inv.channel === 'email' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {inv.channel === 'email' ? <Mail size={11} /> : <MessageCircle size={11} />}
                        {inv.channel === 'email' ? 'Via Gmail' : 'Via WhatsApp'}
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: modalText }}>
                        {inv.suggestedName ? `${inv.suggestedName} (${inv.target})` : inv.target}
                      </strong>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                        color: isLight ? '#b45309' : '#fbbf24',
                        fontWeight: 700
                      }}>
                        Belum Klik Link
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: modalSubText }}>
                      Peran: <strong style={{ color: modalText }}>{inv.jobTitle}</strong> · Cabang Kost: {inv.kostName} · Toko POS:{' '}
                      <strong style={{ color: modalText }}>
                        {resolveAssignedStoreLabels(inv.assignedStoreIds, inv.assignedStoreNames).join(', ')}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyInviteLink(inv)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '4px', fontSize: '0.74rem', padding: '5px 9px' }}
                      title="Salin link undangan"
                    >
                      {copiedInviteId === inv.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedInviteId === inv.id ? 'Tersalin!' : 'Salin Link'}</span>
                    </button>

                    {inv.channel === 'whatsapp' && inv.waDirectUrl && (
                      <a
                        href={inv.waDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{
                          gap: '4px',
                          fontSize: '0.74rem',
                          padding: '5px 10px',
                          background: '#10b981',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Send size={12} /> Kirim WA
                      </a>
                    )}

                    <Link
                      to={`/invite-staff/${inv.token}`}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '4px', fontSize: '0.74rem', padding: '5px 9px', textDecoration: 'none' }}
                      title={linkUrl}
                    >
                      <ExternalLink size={12} /> Buka Link
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleCancelPendingInvite(inv)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        gap: '4px',
                        fontSize: '0.74rem',
                        padding: '5px 9px',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <X size={12} /> Batalkan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
                  {staff.picture ? (
                    <img 
                      src={staff.picture} 
                      alt={staff.name || 'Staff'} 
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: isSelected ? '2px solid #3b82f6' : '1.5px solid var(--border-color)',
                        flexShrink: 0,
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                      }}
                    />
                  ) : (
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
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{staff.name}</strong>
                      <span
                        data-testid={`staff-level-badge-${staff.id}`}
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: staff.role === 'admin'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.16)',
                          color: staff.role === 'admin'
                            ? (isLight ? '#b45309' : '#fbbf24')
                            : (isLight ? '#047857' : '#6ee7b7'),
                          border: staff.role === 'admin'
                            ? '1px solid rgba(245, 158, 11, 0.45)'
                            : '1px solid rgba(16, 185, 129, 0.35)',
                          fontWeight: 800
                        }}
                      >
                        {staff.role === 'admin' ? <><Crown size={11} /> Admin &bull; Tanpa Tarik Dana</> : 'Karyawan'}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#6ee7b7',
                        fontWeight: 700
                      }}>
                        Login Aktif
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
                          Kalender Aktif
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
                          {staff.avgRating} ({staff.totalReviews || 0})
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
                          Multiple Roles ({rolesArr.length})
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

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>Cabang Kost: <strong style={{ color: 'var(--text-primary)' }}>{staff.kostName}</strong></span>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <Store size={12} color="#10b981" />
                        {resolveAssignedStoreLabels(staff.assignedStoreIds, staff.assignedStoreNames).map((stName, idx) => (
                          <span
                            key={idx}
                            data-testid="staff-assigned-store-badge"
                            style={{
                              fontSize: '0.7rem',
                              padding: '1px 7px',
                              borderRadius: '5px',
                              background: 'rgba(16, 185, 129, 0.14)',
                              color: isLight ? '#047857' : '#6ee7b7',
                              border: '1px solid rgba(16, 185, 129, 0.28)',
                              fontWeight: 700
                            }}
                          >
                            {stName}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact info & salary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.78rem', color: modalSubText, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {staff.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(239, 68, 68, 0.14)',
                          color: isLight ? '#dc2626' : '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}>
                          <Mail size={10} /> Gmail
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{staff.email}</span>
                      </div>
                    )}
                    {staff.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(16, 185, 129, 0.14)',
                          color: isLight ? '#059669' : '#4ade80',
                          border: '1px solid rgba(16, 185, 129, 0.28)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}>
                          <MessageCircle size={10} /> WA
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{staff.phone}</span>
                      </div>
                    )}
                  </div>

                  {staff.salary > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: modalSubText, display: 'block' }}>Gaji Pokok</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isLight ? '#d97706' : '#fbbf24' }}>
                        {formatRupiah(staff.salary)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {onSelectStaff && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => onSelectStaff(staff)}
                        className="btn btn-sm"
                        style={{
                          gap: '5px',
                          fontSize: '0.78rem',
                          padding: '6px 12px',
                          background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(59, 130, 246, 0.15)',
                          color: isSelected ? '#ffffff' : (isLight ? '#1d4ed8' : '#ffffff'),
                          border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.35)',
                          boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.35)' : 'none',
                          fontWeight: isSelected ? 700 : 600
                        }}
                        title="Buka Kalender Kerja & Riwayat Harian Karyawan Ini"
                      >
                        {isSelected ? <Check size={13} /> : <CalendarIcon size={13} />}
                        <span>{isSelected ? 'Kalender Aktif' : 'Buka Kalender'}</span>
                      </button>
                      <ActionTutorialBadge
                        isLight={isLight}
                        size="sm"
                        title="Kalender Tugas Karyawan"
                        description="Menampilkan jadwal absensi dan laporan foto kerja harian milik karyawan ini."
                      />
                    </div>
                  )}

                  {canManageAdminRoles && String(staff.id) !== String(user?.id) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        data-testid={`toggle-admin-btn-${staff.id}`}
                        disabled={promotingStaffId === staff.id}
                        onClick={() => handleToggleAdminRole(staff)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          gap: '5px',
                          fontSize: '0.78rem',
                          padding: '6px 10px',
                          background: staff.role === 'admin' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(139, 92, 246, 0.15)',
                          color: staff.role === 'admin' ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#6d28d9' : '#c4b5fd'),
                          borderColor: staff.role === 'admin' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(139, 92, 246, 0.38)',
                          fontWeight: 700
                        }}
                        title={staff.role === 'admin' ? 'Turunkan kembali dari Admin ke Karyawan biasa' : 'Naikkan level akses karyawan menjadi Admin'}
                      >
                        <Crown size={13} />
                        <span>
                          {promotingStaffId === staff.id
                            ? 'Memproses...'
                            : (staff.role === 'admin' ? 'Turunkan ke Karyawan' : 'Naikkan Jadi Admin')}
                        </span>
                      </button>
                      <ActionTutorialBadge
                        isLight={isLight}
                        size="sm"
                        title="Akses Admin Karyawan"
                        description="Hanya Pemilik (Owner) atau Admin yang bisa menaikkan/menurunkan karyawan menjadi Admin agar bisa ikut mengelola kost, keuangan, & karyawan."
                      />
                    </div>
                  )}

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditRoles(staff)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '5px', fontSize: '0.78rem', padding: '6px 10px', color: isLight ? '#2563eb' : '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)' }}
                      title="Ubah peran kerja & penugasan cabang toko"
                    >
                      <Tag size={13} />
                      <span>Atur Role &amp; Cabang</span>
                    </button>
                    <ActionTutorialBadge
                      isLight={isLight}
                      size="sm"
                      title="Atur Role & Cabang"
                      description="Ubah tugas (Single / Multiple Roles) serta pilih cabang toko POS mana saja yang dikelola karyawan ini."
                    />
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => copyCredentials(staff)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '5px', fontSize: '0.78rem', padding: '6px 10px' }}
                      title="Salin pesan info login untuk dikirim ke WhatsApp staf"
                    >
                      {copiedId === staff.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{copiedId === staff.id ? 'Tersalin!' : 'Salin Info WA'}</span>
                    </button>
                    <ActionTutorialBadge
                      isLight={isLight}
                      size="sm"
                      title="Salin Info Login WA"
                      description="Menyalin teks ringkasan akun Gmail/WA & cabang ke clipboard untuk dikirim ulang ke karyawan."
                    />
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalStaff(staff);
                        setNewPassword('');
                        setResetError('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '5px', fontSize: '0.78rem', padding: '6px 10px' }}
                      title="Ganti atau reset password staf"
                    >
                      <Key size={13} />
                      <span>Reset Sandi</span>
                    </button>
                    <ActionTutorialBadge
                      isLight={isLight}
                      size="sm"
                      title="Reset Sandi Karyawan"
                      description="Mengatur ulang kata sandi login jika karyawan lupa password."
                    />
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmStaff(staff)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        gap: '5px',
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: isLight ? '#dc2626' : '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Hapus akun karyawan dan cabut hak akses dari sistem kost"
                    >
                      <Trash2 size={13} />
                      <span>Hapus Akses</span>
                    </button>
                    <ActionTutorialBadge
                      isLight={isLight}
                      size="sm"
                      title="Hapus Akses Karyawan"
                      description="Mencabut akses login karyawan dari sistem secara permanen (memerlukan konfirmasi di layar)."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / INVITE STAFF MODAL (LINK VIA WA / GMAIL OR DIRECT CREATE) */}
      {showModal && createPortal(
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div
            data-testid="staff-add-modal"
            onClick={e => e.stopPropagation()}
            style={{
              background: modalBg,
              color: modalText,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  <Users size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: modalText }}>
                    Tambah Karyawan
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: modalSubText }}>
                    {addMode === 'invite'
                      ? 'Kirim link ke No. WhatsApp atau Gmail — karyawan klik link untuk bergabung'
                      : 'Aktifkan akun karyawan langsung menggunakan No. WhatsApp atau Gmail'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Tutup modal"
                style={{
                  background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: modalSubText,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher: Via Link Undangan vs Buat Akun Langsung */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              padding: '4px',
              borderRadius: '12px',
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${modalBorder}`,
              marginBottom: '1rem'
            }}>
              <button
                type="button"
                onClick={() => {
                  setAddMode('invite');
                  setCreatedInviteResult(null);
                  setErrorMsg('');
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: addMode === 'invite' ? '#10b981' : 'transparent',
                  color: addMode === 'invite' ? '#ffffff' : modalSubText
                }}
              >
                <Link2 size={14} />
                <span>Via Link (WA / Gmail)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMode('direct');
                  setCreatedInviteResult(null);
                  setErrorMsg('');
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: addMode === 'direct' ? '#2563eb' : 'transparent',
                  color: addMode === 'direct' ? '#ffffff' : modalSubText
                }}
              >
                <UserCheck size={14} />
                <span>Tambah Langsung</span>
              </button>
            </div>

            {errorMsg && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: isLight ? '#b91c1c' : '#fca5a5',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {addMode === 'invite' && createdInviteResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <CheckCircle2 size={22} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isLight ? '#065f46' : '#6ee7b7' }}>
                      Link Undangan Karyawan Siap!
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: isLight ? '#047857' : '#a7f3d0', lineHeight: 1.45 }}>
                      {createdInviteResult.message}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: modalPanelBg,
                  border: `1px solid ${modalBorder}`
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: modalSubText, marginBottom: '4px' }}>
                    Link Konfirmasi Karyawan:
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    color: modalText,
                    wordBreak: 'break-all',
                    marginBottom: '8px'
                  }}>
                    {createdInviteResult.inviteUrl}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyInviteLink(createdInviteResult.invite)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '5px', fontSize: '0.76rem' }}
                    >
                      {copiedInviteId === createdInviteResult.invite?.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{copiedInviteId === createdInviteResult.invite?.id ? 'Link Tersalin!' : 'Salin Link'}</span>
                    </button>

                    {createdInviteResult.waDirectUrl && (
                      <a
                        href={createdInviteResult.waDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{
                          gap: '5px',
                          fontSize: '0.76rem',
                          background: '#10b981',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 12px'
                        }}
                      >
                        <MessageCircle size={13} /> Kirim ke WhatsApp
                      </a>
                    )}

                    {createdInviteResult.emailPreviewUrl && (
                      <a
                        href={createdInviteResult.emailPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '5px', fontSize: '0.76rem', textDecoration: 'none' }}
                      >
                        <Mail size={13} /> Preview Email
                      </a>
                    )}

                    {createdInviteResult.invite?.token && (
                      <Link
                        to={`/invite-staff/${createdInviteResult.invite.token}`}
                        onClick={() => setShowModal(false)}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '5px', fontSize: '0.76rem', textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} /> Buka Halaman Link
                      </Link>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      resetFormFields();
                      setCreatedInviteResult(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Undang Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedInviteResult(null);
                      setShowModal(false);
                    }}
                    className="btn btn-primary"
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateStaffOrInvite} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {addMode === 'invite' ? (
                  <>
                    {/* Channel Selection: Via No. WA vs Via Gmail */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: modalSubText, marginBottom: '6px' }}>
                        Kirim Link Undangan Melalui *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => { setInviteChannel('whatsapp'); setErrorMsg(''); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: inviteChannel === 'whatsapp' ? '2px solid #10b981' : `1px solid ${modalBorder}`,
                            background: inviteChannel === 'whatsapp'
                              ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)')
                              : modalPanelBg,
                            color: inviteChannel === 'whatsapp' ? (isLight ? '#047857' : '#34d399') : modalSubText,
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '7px'
                          }}
                        >
                          <MessageCircle size={15} />
                          <span>No. WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInviteChannel('email'); setErrorMsg(''); }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: inviteChannel === 'email' ? '2px solid #ef4444' : `1px solid ${modalBorder}`,
                            background: inviteChannel === 'email'
                              ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.16)')
                              : modalPanelBg,
                            color: inviteChannel === 'email' ? (isLight ? '#b91c1c' : '#fca5a5') : modalSubText,
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '7px'
                          }}
                        >
                          <Mail size={15} />
                          <span>Alamat Gmail</span>
                        </button>
                      </div>
                    </div>

                    {inviteChannel === 'whatsapp' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: modalText, marginBottom: '4px' }}>
                          No. WhatsApp Karyawan *
                        </label>
                        <input
                          type="tel"
                          placeholder="Contoh: 081234567890"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="input-field"
                        />
                        <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'block', marginTop: '3px' }}>
                          Sistem membuat link undangan khusus WA. Karyawan klik link baru resmi masuk daftar staf.
                        </span>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: modalText, marginBottom: '4px' }}>
                          Alamat Gmail Karyawan *
                        </label>
                        <input
                          type="email"
                          placeholder="Contoh: budi.karyawan@gmail.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="input-field"
                        />
                        <span style={{ fontSize: '0.7rem', color: isLight ? '#dc2626' : '#fca5a5', display: 'block', marginTop: '3px' }}>
                          Undangan dikirim ke Gmail &amp; link dapat disalin. Karyawan klik link baru resmi masuk daftar staf.
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
                          Nama Calon Karyawan (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="Isi sendiri saat staf klik link"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
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
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
                        Nama Lengkap Karyawan *
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso (Kasir / Koki)"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
                          No. WhatsApp (WA / Gmail min. 1)
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
                        <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
                          Alamat Gmail (WA / Gmail min. 1)
                        </label>
                        <input
                          type="email"
                          placeholder="budi.karyawan@gmail.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
                          Password Awal (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="Default: kostku123"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
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
                  </>
                )}

                {/* LEVEL AKSES AKUN (STAF BIASA VS ADMIN SETARA OWNER) */}
                {canManageAdminRoles && (
                  <div style={{
                    background: modalPanelBg,
                    border: `1px solid ${modalBorder}`,
                    borderRadius: '12px',
                    padding: '12px'
                  }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: modalText, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Crown size={14} color="#f59e0b" /> Tingkat Akses Akun *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        data-testid="select-account-role-staff"
                        onClick={() => setFormAccountRole('staff')}
                        style={{
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: formAccountRole === 'staff' ? '2px solid #10b981' : `1px solid ${modalBorder}`,
                          background: formAccountRole === 'staff' ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)') : 'transparent',
                          color: formAccountRole === 'staff' ? (isLight ? '#047857' : '#34d399') : modalSubText,
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>Karyawan / Kasir</div>
                        <div style={{ fontSize: '0.67rem', opacity: 0.85, marginTop: '2px' }}>Operasional sesuai tugas shift</div>
                      </button>
                      <button
                        type="button"
                        data-testid="select-account-role-admin"
                        onClick={() => setFormAccountRole('admin')}
                        style={{
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: formAccountRole === 'admin' ? '2px solid #f59e0b' : `1px solid ${modalBorder}`,
                          background: formAccountRole === 'admin' ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.16)') : 'transparent',
                          color: formAccountRole === 'admin' ? (isLight ? '#b45309' : '#fbbf24') : modalSubText,
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Crown size={12} /> Admin Pengelola
                        </div>
                        <div style={{ fontSize: '0.67rem', opacity: 0.9, marginTop: '2px' }}>Hak akses sama Owner, tidak bisa tarik/keluarkan dana</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ROLE MODE SWITCHER (SINGLE VS MULTIPLE ROLES) */}
                <div style={{
                  background: modalPanelBg,
                  border: `1px solid ${modalBorder}`,
                  borderRadius: '12px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: modalText, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} color="#3b82f6" /> Mode Penugasan Peran (Role) *
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
                          borderColor: formRoleMode === 'single' ? '#10b981' : modalBorder,
                          background: formRoleMode === 'single' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                          color: formRoleMode === 'single' ? (isLight ? '#047857' : '#34d399') : modalSubText,
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
                          borderColor: formRoleMode === 'multiple' ? '#8b5cf6' : modalBorder,
                          background: formRoleMode === 'multiple' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                          color: formRoleMode === 'multiple' ? (isLight ? '#6d28d9' : '#c4b5fd') : modalSubText,
                          cursor: 'pointer'
                        }}
                      >
                        Multiple Roles
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: modalSubText }}>
                    {formRoleMode === 'single'
                      ? 'Pilih 1 peran fokus untuk staf ini.'
                      : 'Pilih beberapa peran sekaligus jika staf merangkap tugas.'}
                  </p>

                  {/* Role Options */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {prioritizedRoles.map((r, idx) => {
                      const isSelected = formSelectedRoles.includes(r.id);
                      const prev = prioritizedRoles[idx - 1];
                      const isNewCategory = !prev || prev.category !== r.category;
                      return (
                        <React.Fragment key={r.id}>
                          {isNewCategory && (
                            <div style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: r.category === 'pos' ? '#2563eb' : '#10b981',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              marginTop: idx > 0 ? '8px' : '0px',
                              marginBottom: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span>{r.category === 'pos' ? '🏪 Peran Kasir & Usaha Toko (UMKM)' : '🏠 Peran Operasional Kost'}</span>
                            </div>
                          )}
                          <div
                            onClick={() => toggleFormRole(r.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: isSelected ? `1.5px solid ${r.color}` : `1px solid ${modalBorder}`,
                              background: isSelected ? `${r.color}18` : 'transparent',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare size={16} color={r.color} />
                            ) : (
                              <Square size={16} color="#64748b" />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.82rem', color: isSelected ? modalText : modalSubText, fontWeight: isSelected ? 700 : 500 }}>
                                {r.label}
                              </span>
                              {r.desc && (
                                <span style={{ fontSize: '0.68rem', color: isSelected ? r.color : modalSubText, marginTop: '2px' }}>
                                  {r.desc}
                                </span>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {ownedKosts.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
                      Tugaskan di Cabang Kost *
                    </label>
                    <select
                      value={formData.kostUid}
                      onChange={e => setFormData({ ...formData, kostUid: e.target.value })}
                      className="input-field"
                      required
                    >
                      {ownedKosts.map(k => (
                        <option key={k.uid} value={k.uid}>
                          {k.kostName} ({k.totalRooms || k.roomCount || 0} Kamar)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {posStores.length > 0 && renderStoreAssignmentPicker(formAssignedStoreIds, setFormAssignedStoreIds, 'add-staff')}

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '10px',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap'
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
                    {submitting
                      ? 'Memproses...'
                      : (addMode === 'invite' ? 'Buat & Kirim Link Undangan' : 'Simpan & Buat Akun')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* EDIT ROLE MODAL (SINGLE VS MULTIPLE) */}
      {roleModalStaff && createPortal(
        <div
          onClick={() => setRoleModalStaff(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: modalBg,
              color: modalText,
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: modalText }}>
                  Atur Role &amp; Penugasan Cabang Toko
                </h3>
                <span style={{ fontSize: '0.78rem', color: modalSubText }}>
                  Staf: <strong>{roleModalStaff.name}</strong> ({roleModalStaff.kostName})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalStaff(null)}
                style={{ background: 'none', border: 'none', color: modalSubText, cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {editRoleError && (
              <div style={{
                padding: '9px 12px',
                borderRadius: '8px',
                background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)',
                color: isLight ? '#b91c1c' : '#fca5a5',
                fontSize: '0.8rem',
                marginBottom: '10px'
              }}>
                {editRoleError}
              </div>
            )}

            {/* Mode Switcher */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              background: modalPanelBg,
              border: `1px solid ${modalBorder}`,
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '0.8rem', color: modalText, fontWeight: 600 }}>Tipe Penugasan:</span>
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
                    borderColor: editRoleMode === 'single' ? '#10b981' : modalBorder,
                    background: editRoleMode === 'single' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: editRoleMode === 'single' ? (isLight ? '#047857' : '#34d399') : modalSubText,
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
                    borderColor: editRoleMode === 'multiple' ? '#8b5cf6' : modalBorder,
                    background: editRoleMode === 'multiple' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: editRoleMode === 'multiple' ? (isLight ? '#6d28d9' : '#c4b5fd') : modalSubText,
                    cursor: 'pointer'
                  }}
                >
                  Multiple Roles
                </button>
              </div>
            </div>

            {/* Checkbox list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
              {prioritizedRoles.map((r, idx) => {
                const isSelected = editSelectedRoles.includes(r.id);
                const prev = prioritizedRoles[idx - 1];
                const isNewCategory = !prev || prev.category !== r.category;
                return (
                  <React.Fragment key={r.id}>
                    {isNewCategory && (
                      <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: r.category === 'pos' ? '#2563eb' : '#10b981',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginTop: idx > 0 ? '8px' : '0px',
                        marginBottom: '2px'
                      }}>
                        {r.category === 'pos' ? '🏪 Peran Kasir & Usaha Toko (UMKM)' : '🏠 Peran Operasional Kost'}
                      </div>
                    )}
                    <div
                      key={r.id}
                      onClick={() => toggleEditRole(r.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: isSelected ? `1.5px solid ${r.color}` : `1px solid ${modalBorder}`,
                        background: isSelected ? `${r.color}18` : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} color={r.color} />
                      ) : (
                        <Square size={16} color="#64748b" />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.82rem', color: isSelected ? modalText : modalSubText, fontWeight: isSelected ? 700 : 500 }}>
                          {r.label}
                        </span>
                        {r.desc && (
                          <span style={{ fontSize: '0.68rem', color: isSelected ? r.color : modalSubText, marginTop: '2px' }}>
                            {r.desc}
                          </span>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {posStores.length > 0 && renderStoreAssignmentPicker(editAssignedStoreIds, setEditAssignedStoreIds, 'edit-staff')}

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
                {savingRoles ? 'Menyimpan...' : 'Simpan Role & Cabang'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalStaff && createPortal(
        <div
          onClick={() => setResetModalStaff(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: modalBg,
              color: modalText,
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.5rem',
              boxSizing: 'border-box'
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: modalText }}>
              Reset Password Staf
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: modalSubText }}>
              Ganti password untuk <strong>{resetModalStaff.name}</strong> ({resetModalStaff.email || resetModalStaff.phone}).
            </p>

            {resetError && (
              <div style={{
                padding: '9px 12px',
                borderRadius: '8px',
                background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)',
                color: isLight ? '#b91c1c' : '#fca5a5',
                fontSize: '0.8rem',
                marginBottom: '10px'
              }}>
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: modalSubText, marginBottom: '4px' }}>
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

      {/* INLINE DELETE STAFF CONFIRM MODAL */}
      {deleteConfirmStaff && createPortal(
        <div
          onClick={() => !deletingStaff && setDeleteConfirmStaff(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: modalBg,
              color: modalText,
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.5rem',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <AlertCircle size={22} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.08rem', color: modalText }}>Hapus Akses Karyawan?</h3>
            </div>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.84rem', color: modalSubText, lineHeight: 1.5 }}>
              Yakin ingin mencabut akses login dan menghapus <strong>{deleteConfirmStaff.name}</strong> dari daftar staf?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="btn btn-secondary"
                disabled={deletingStaff}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                disabled={deletingStaff}
                className="btn"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                {deletingStaff ? 'Menghapus...' : 'Ya, Hapus Akses'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
