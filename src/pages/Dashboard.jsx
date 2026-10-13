import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Home, 
  Bed, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  Phone,
  Settings as SettingsIcon,
  BedDouble,
  Droplet,
  Zap,
  Save,
  Trash2,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  SlidersHorizontal,
  LayoutDashboard,
  MessageCircle,
  ExternalLink,
  Tag,
  Percent,
  Calendar,
  Search,
  Copy
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  apiGetActivities, 
  apiGetSettings, 
  apiUpdateSettings,
  apiGetUsers, 
  apiGetComplaints, 
  apiGetInvoices,
  apiGetApplications,
  apiGetOwnerKosts,
  apiGetUtilityInquiry,
  apiPromoteKost
} from '../services/api';
import UserDashboard from './UserDashboard';
import StaffDashboard from '../components/StaffDashboard';
import StaffManagementCard from '../components/StaffManagementCard';

const Dashboard = ({ user }) => {
  // If role is tenant, show UserDashboard
  if (user?.role === 'user') {
    return <UserDashboard user={user} />;
  }

  // If role is staff / penjaga kost, show StaffDashboard
  if (user?.role === 'staff') {
    return <StaffDashboard user={user} />;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'pengaturan' ? 'pengaturan' : 'overview');

  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState({ 
    rooms: [], 
    employees: [], 
    bedsheetCount: 0,
    utilityScheme: 'all_kost',
    waterRate: 0,
    electricityRate: 0,
    depositAmount: 0,
    discount: {
      enabled: false,
      type: 'percent',
      value: 10,
      durationMonths: '1',
      validUntil: '',
      label: 'Promo Spesial'
    },
    promoted: {
      active: false,
      plan: '7d',
      badgeText: '🔥 Rekomendasi Utama',
      expiresAt: ''
    },
    waBotQuota: 25,
    isPro: false
  });
  const [tenants, setTenants] = useState([]);
  const [activeComplaints, setActiveComplaints] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState('all'); // 'all', 'empty', 'occupied'
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);

  // Active Kost UID Resolver
  const [currentKostUid, setCurrentKostUid] = useState(user?.kostUid || localStorage.getItem('kostUid') || '');

  useEffect(() => {
    if (user?.kostUid) {
      setCurrentKostUid(user.kostUid);
    } else if (user?.id) {
      apiGetOwnerKosts(user.id).then(kosts => {
        if (Array.isArray(kosts) && kosts.length > 0) {
          const first = kosts[0].uid;
          setCurrentKostUid(first);
          localStorage.setItem('kostUid', first);
        }
      }).catch(() => {});
    }
  }, [user?.kostUid, user?.id]);

  useEffect(() => {
    const handlePropertySwitch = (e) => {
      if (e.detail?.kostUid) {
        setCurrentKostUid(e.detail.kostUid);
      }
    };
    window.addEventListener('kostku_property_switched', handlePropertySwitch);
    return () => window.removeEventListener('kostku_property_switched', handlePropertySwitch);
  }, []);

  // Settings State in Overview
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [newRoom, setNewRoom] = useState({ number: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '', plnMeterNo: '', pdamMeterNo: '' });
  const [bulkConfig, setBulkConfig] = useState({ prefix: '', count: '', startNumber: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Utility PLN & PDAM Inquiry Simulator States
  const [utilityModalOpen, setUtilityModalOpen] = useState(false);
  const [utilityInquiryType, setUtilityInquiryType] = useState('pln'); // 'pln' or 'pdam'
  const [utilityMeterQuery, setUtilityMeterQuery] = useState('');
  const [utilityInquiryLoading, setUtilityInquiryLoading] = useState(false);
  const [utilityInquiryResult, setUtilityInquiryResult] = useState(null);
  const [utilityInquiryError, setUtilityInquiryError] = useState(null);

  const handleCheckUtilityMeter = async (typeOverride, numberOverride) => {
    const typeToUse = typeOverride || utilityInquiryType;
    const numToUse = numberOverride || utilityMeterQuery;
    if (!numToUse || numToUse.trim().length < 5) {
      setUtilityInquiryError('Masukkan nomor meter / ID pelanggan yang valid (minimal 6 digit)');
      return;
    }
    setUtilityInquiryLoading(true);
    setUtilityInquiryError(null);
    setUtilityInquiryResult(null);
    try {
      const res = await apiGetUtilityInquiry(typeToUse, numToUse.trim());
      setUtilityInquiryResult(res);
    } catch (err) {
      setUtilityInquiryError(err.message || 'Gagal memeriksa ID pelanggan utilitas');
    } finally {
      setUtilityInquiryLoading(false);
    }
  };

  const handleBulkPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar (maksimal 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBulkConfig(prev => ({ ...prev, roomPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (tabFromUrl === 'pengaturan' || tabFromUrl === 'overview') {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'pengaturan') {
      setSearchParams({ tab: 'pengaturan' });
    } else {
      setSearchParams({});
    }
  };

  const targetKostUid = currentKostUid || user?.kostUid;

  const loadData = async () => {
    if (!targetKostUid) return;
    setLoading(true);
    try {
      const [acts, sets, usrs, comps, invs, apps] = await Promise.all([
        apiGetActivities(targetKostUid).catch(() => []),
        apiGetSettings(targetKostUid).catch(() => ({ rooms: [], employees: [] })),
        apiGetUsers(targetKostUid).catch(() => []),
        apiGetComplaints(targetKostUid).catch(() => []),
        apiGetInvoices(targetKostUid).catch(() => []),
        apiGetApplications(targetKostUid).catch(() => [])
      ]);

      setActivities(Array.isArray(acts) ? acts : []);
      if (sets && !sets.error) {
        setSettings({
          rooms: sets.rooms || [],
          employees: sets.employees || [],
          bedsheetCount: sets.bedsheetCount || 0,
          utilityScheme: sets.utilityScheme || 'all_kost',
          waterRate: sets.waterRate || 0,
          electricityRate: sets.electricityRate || 0,
          depositAmount: sets.depositAmount || 0,
          discount: sets.discount || {
            enabled: false,
            type: 'percent',
            value: 10,
            durationMonths: '1',
            validUntil: '',
            label: 'Promo Spesial'
          },
          promoted: sets.promoted || {
            active: false,
            plan: '7d',
            badgeText: '🔥 Rekomendasi Utama',
            expiresAt: ''
          },
          waBotQuota: sets.waBotQuota ?? 25,
          isPro: Boolean(sets.isPro)
        });
      }
      setTenants(Array.isArray(usrs) ? usrs : []);
      if (Array.isArray(comps)) {
        setActiveComplaints(comps.filter(c => c.status !== 'selesai').length);
      }
      setInvoices(Array.isArray(invs) ? invs : []);
      if (Array.isArray(apps)) {
        setPendingApplications(apps.filter(a => a.status === 'pending'));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetKostUid]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(number || 0);
  };

  // Save Settings Handlers
  const handleSaveKostSettings = async (overrideSettings) => {
    if (!targetKostUid) return;
    const toSave = overrideSettings || settings;
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await apiUpdateSettings(targetKostUid, toSave);
      setSettingsMessage({ type: 'success', text: 'Pengaturan kost & tarif berhasil disimpan!' });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      setSettingsMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan kost' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Promoted Listing (Sundul Kost) & WA Bot Quota Handler (0% UX Disruption Monetization)
  const [promotingKost, setPromotingKost] = useState(false);

  const handlePromoteKostAction = async (action, plan = '7d', badgeText = '🔥 Rekomendasi Utama', topUpQuota = 100) => {
    if (!targetKostUid) return;
    setPromotingKost(true);
    setSettingsMessage(null);
    try {
      const res = await apiPromoteKost({
        kostUid: targetKostUid,
        action,
        plan,
        badgeText,
        topUpQuota
      });
      if (res) {
        setSettings(prev => ({
          ...prev,
          promoted: res.promoted !== undefined ? res.promoted : prev.promoted,
          waBotQuota: res.waBotQuota !== undefined ? res.waBotQuota : prev.waBotQuota
        }));
      }
      const msg = action === 'topup_wa'
        ? `Berhasil top-up +${topUpQuota} kuota pesan WhatsApp Bot Otomatis!`
        : action === 'deactivate'
          ? 'Status Sundul Kost berhasil dinonaktifkan.'
          : `🚀 Sundul Kost aktif! Properti Anda kini berada di posisi #1 halaman Cari Kost.`;
      setSettingsMessage({ type: 'success', text: msg });
      setTimeout(() => setSettingsMessage(null), 4000);
    } catch (err) {
      setSettingsMessage({ type: 'error', text: err.message || 'Gagal memperbarui status promosi kost' });
    } finally {
      setPromotingKost(false);
    }
  };

  // Rooms Photo Upload & Management
  const handleRoomPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar (maksimal 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRoom(prev => ({ ...prev, roomPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateRoomCardPhoto = (roomId, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto terlalu besar (maksimal 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const updatedRooms = settings.rooms.map(r => 
        r.id === roomId ? { ...r, roomPhoto: reader.result, photo: reader.result } : r
      );
      const newSettings = { ...settings, rooms: updatedRooms };
      setSettings(newSettings);
      try {
        await apiUpdateSettings(targetKostUid, newSettings);
        setSettingsMessage({ type: 'success', text: 'Foto unit kamar berhasil diperbarui!' });
        setTimeout(() => setSettingsMessage(null), 3000);
      } catch (err) {
        console.error('Failed to update photo:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.number || !newRoom.price) return;
    
    if (!newRoom.roomPhoto) {
      alert('Foto unit kamar wajib diunggah untuk setiap kamar baru! Silakan pilih foto fisik asli unit terlebih dahulu.');
      return;
    }

    if (settings.rooms.some(r => r.number === newRoom.number)) {
      alert(`Kamar dengan nomor ${newRoom.number} sudah terdaftar!`);
      return;
    }

    const createdRoom = { 
      ...newRoom, 
      id: Date.now().toString(), 
      price: Number(newRoom.price), 
      capacity: Number(newRoom.capacity) || 1,
      roomPhoto: newRoom.roomPhoto,
      photo: newRoom.roomPhoto
    };

    const updatedRooms = [...settings.rooms, createdRoom];
    const newSettings = { ...settings, rooms: updatedRooms };
    setSettings(newSettings);
    setNewRoom({ number: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });

    try {
      await apiUpdateSettings(targetKostUid, newSettings);
      setSettingsMessage({ type: 'success', text: `Unit Kamar ${createdRoom.number} berhasil ditambahkan dan disimpan!` });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      console.error('Auto save failed:', err);
    }
  };

  const handleDeleteRoom = async (id, roomNumber) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Kamar ${roomNumber || ''}?`)) return;
    const updatedRooms = settings.rooms.filter(r => r.id !== id);
    const newSettings = { ...settings, rooms: updatedRooms };
    setSettings(newSettings);

    try {
      await apiUpdateSettings(targetKostUid, newSettings);
      setSettingsMessage({ type: 'success', text: `Kamar ${roomNumber || ''} berhasil dihapus!` });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    const count = parseInt(bulkConfig.count);
    const startNum = parseInt(bulkConfig.startNumber);
    const price = Number(bulkConfig.price);
    const capacity = Number(bulkConfig.capacity) || 1;
    
    if (!count || !startNum || !price) return;

    if (!bulkConfig.roomPhoto) {
      alert('Silakan pilih 1 foto fisik asli kamar untuk unit-unit yang digenerate massal!');
      return;
    }

    let generated = [];
    for (let i = 0; i < count; i++) {
      const roomNumber = `${bulkConfig.prefix}${startNum + i}`;
      if (!settings.rooms.some(r => r.number === roomNumber)) {
        generated.push({
          id: `BULK-${Date.now()}-${i}`,
          number: roomNumber,
          price: price,
          size: bulkConfig.size || '3x4m',
          capacity: capacity,
          roomPhoto: bulkConfig.roomPhoto,
          photo: bulkConfig.roomPhoto
        });
      }
    }

    const updatedRooms = [...settings.rooms, ...generated];
    const newSettings = { ...settings, rooms: updatedRooms };
    setSettings(newSettings);
    setShowBulkModal(false);
    setBulkConfig({ prefix: '', count: '', startNumber: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });

    try {
      await apiUpdateSettings(targetKostUid, newSettings);
      setSettingsMessage({ type: 'success', text: `${generated.length} unit kamar berhasil digenerate dengan foto fisik identik!` });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      console.error('Bulk generate failed:', err);
    }
  };

  const totalKamar = settings.rooms ? settings.rooms.length : 0;
  
  // Real stats calculation
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  let incomeThisMonth = 0;
  let unpaidCount = 0;

  invoices.forEach(inv => {
    const invDate = new Date(inv.date || Date.now());
    const isThisMonth = invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    const amt = Number(inv.amount || inv.total || 0);

    if (inv.status === 'lunas') {
      if (isThisMonth) {
        incomeThisMonth += amt;
      }
    } else if (inv.status === 'pending' || inv.status === 'belum' || inv.status === 'unpaid') {
      unpaidCount++;
    }
  });

  // Calculate potential monthly revenue from active occupied beds
  const occupiedRevenue = (settings.rooms || []).reduce((acc, r) => {
    const hasOccupant = tenants.some(t => t.kamar === r.number);
    return hasOccupant ? acc + Number(r.price || 0) : acc;
  }, 0);

  const displayIncome = incomeThisMonth > 0 ? incomeThisMonth : occupiedRevenue;

  // Filter rooms
  const rooms = settings.rooms || [];
  const filteredRooms = rooms.filter(room => {
    const occupants = tenants.filter(t => t.kamar === room.number);
    if (roomFilter === 'empty') return occupants.length === 0;
    if (roomFilter === 'occupied') return occupants.length > 0;
    return true;
  });

  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 1), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((tenants.length / totalCapacity) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Title & Main Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
              {activeTab === 'pengaturan' ? 'Pengaturan Kost' : 'My Kost (Overview)'}
            </h1>
            <span className="badge badge-primary">
              <Sparkles size={12} /> Live Sync
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Kode Kost: <strong style={{ color: 'white' }}>{targetKostUid || '-'}</strong> • {totalKamar} Unit Kamar • Okupansi: <strong style={{ color: 'var(--accent-success)' }}>{occupancyRate}%</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={loadData} 
            className="btn btn-secondary btn-sm"
            title="Muat ulang data"
            style={{ borderRadius: '10px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/penghuni" className="btn btn-primary btn-sm" style={{ borderRadius: '10px', gap: '6px' }}>
            <Plus size={14} /> Penghuni Baru
          </Link>
          <Link to="/keuangan" className="btn btn-secondary btn-sm" style={{ borderRadius: '10px', gap: '6px' }}>
            <DollarSign size={14} /> Keuangan & Laporan
          </Link>
        </div>
      </div>

      {/* Main Tab Navigation: Modern Segmented Control */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={() => handleTabChange('overview')}
          style={{
            padding: '11px 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.92rem',
            background: activeTab === 'overview' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
            color: activeTab === 'overview' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <LayoutDashboard size={18} />
          <span>Ringkasan & Ketersediaan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('pengaturan')}
          style={{
            padding: '11px 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.92rem',
            background: activeTab === 'pengaturan' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
            color: activeTab === 'pengaturan' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'pengaturan' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <SettingsIcon size={18} />
          <span>Pengaturan Kost & Kamar</span>
          <span style={{
            fontSize: '0.72rem',
            background: activeTab === 'pengaturan' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 700
          }}>
            {totalKamar} Unit
          </span>
        </button>
      </div>

      {/* Global Feedback Banner for Settings */}
      {settingsMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: settingsMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${settingsMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: settingsMessage.type === 'success' ? '#34d399' : '#f87171',
          animation: 'fadeIn 0.2s ease'
        }}>
          {settingsMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{settingsMessage.text}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 1: RINGKASAN & HUNIAN (OVERVIEW)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Notification Banner for Pending Applications */}
          {pendingApplications.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              boxShadow: '0 4px 20px rgba(234, 179, 8, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  background: '#eab308',
                  color: '#000',
                  padding: '0.6rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Ada {pendingApplications.length} Pengajuan Sewa Baru Menunggu Persetujuan!
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Calon penghuni telah memilih kamar dari fitur Cari Kost. Klik untuk meninjau dan menerima pengajuan.
                  </p>
                </div>
              </div>
              <Link 
                to="/penghuni?tab=aplikasi"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Tinjau Pengajuan <ArrowUpRight size={18} />
              </Link>
            </div>
          )}

          {/* Banner Status Program Diskon Kost */}
          <div style={{
            background: settings.discount?.enabled 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)' 
              : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${settings.discount?.enabled ? 'rgba(52, 211, 153, 0.35)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                background: settings.discount?.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.12)',
                color: settings.discount?.enabled ? '#34d399' : '#94a3b8',
                padding: '0.65rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Tag size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {settings.discount?.enabled 
                      ? `Program Promo Aktif: Diskon ${settings.discount.type === 'percent' ? `${settings.discount.value}%` : formatRupiah(settings.discount.value)}` 
                      : 'Program Diskon: Nonaktif (Harga Normal)'}
                  </h4>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: settings.discount?.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                    color: settings.discount?.enabled ? '#34d399' : '#94a3b8'
                  }}>
                    {settings.discount?.enabled ? 'SEDANG BERJALAN' : 'NORMAL'}
                  </span>
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {settings.discount?.enabled ? (
                    <>
                      Dipromosikan untuk <strong>{settings.discount.durationMonths === 'all' ? 'Sepanjang Masa Sewa' : `${settings.discount.durationMonths} Bulan Pertama`}</strong>
                      {settings.discount.validUntil ? ` • Berlaku s.d ${new Date(settings.discount.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ' • Berlaku Berkelanjutan'}
                    </>
                  ) : (
                    'Semua unit kamar disewakan dengan tarif standar tanpa potongan. Anda dapat mengaktifkan diskon kapan saja untuk menarik calon penyewa.'
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('pengaturan')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.1rem',
                background: settings.discount?.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                border: `1px solid ${settings.discount?.enabled ? 'rgba(52, 211, 153, 0.4)' : 'rgba(59, 130, 246, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                color: settings.discount?.enabled ? '#34d399' : '#60a5fa',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              {settings.discount?.enabled ? 'Kelola Diskon' : 'Atur Diskon Promo'} <ArrowUpRight size={16} />
            </button>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid-responsive-stats">
            
            {/* Card 1: Penghuni Aktif */}
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-primary)',
                display: 'flex',
                flexShrink: 0
              }}>
                <Users size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>PENGHUNI AKTIF</span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>
                  {tenants.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalCapacity} bed</span>
                </h2>
              </div>
            </div>

            {/* Card 2: Pemasukan Bulan Ini */}
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-success)',
                display: 'flex',
                flexShrink: 0
              }}>
                <DollarSign size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {incomeThisMonth > 0 ? 'PEMASUKAN BULAN INI' : 'EST. PEMASUKAN'}
                </span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-success)', whiteSpace: 'nowrap' }}>
                  {formatRupiah(displayIncome)}
                </h2>
              </div>
            </div>

            {/* Card 3: Tagihan Pending */}
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-danger)',
                display: 'flex',
                flexShrink: 0
              }}>
                <AlertTriangle size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>BELUM BAYAR</span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: unpaidCount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {unpaidCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>tagihan</span>
                </h2>
              </div>
            </div>

            {/* Card 4: Komplain */}
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-warning)',
                display: 'flex',
                flexShrink: 0
              }}>
                <FileText size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>KOMPLAIN AKTIF</span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: activeComplaints > 0 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                  {activeComplaints} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>tiket</span>
                </h2>
              </div>
            </div>

          </div>

          {/* Main Content Grid: Rooms Status (2fr) + Activity Feed (1fr) */}
          <div className="grid-responsive-2col">
            
            {/* Left Column: Room Grid */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Status & Ketersediaan Kamar</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Total {totalKamar} kamar terdaftar
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Filter Buttons */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    padding: '3px',
                    gap: '4px'
                  }}>
                    {['all', 'empty', 'occupied'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setRoomFilter(mode)}
                        style={{
                          background: roomFilter === mode ? 'var(--accent-primary)' : 'transparent',
                          color: roomFilter === mode ? 'white' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {mode === 'all' ? 'Semua' : mode === 'empty' ? 'Kosong' : 'Terisi'}
                      </button>
                    ))}
                  </div>

                  {/* Shortcut to Pengaturan Kost */}
                  <button
                    onClick={() => handleTabChange('pengaturan')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '0.78rem' }}
                  >
                    <SettingsIcon size={13} /> Atur Kamar
                  </button>
                </div>
              </div>

              {/* Rooms Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.85rem',
                flex: 1
              }}>
                {rooms.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <Bed size={36} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
                    <p style={{ margin: '0 0 10px 0' }}>Belum ada kamar yang didaftarkan.</p>
                    <button onClick={() => handleTabChange('pengaturan')} className="btn btn-primary btn-sm">
                      + Atur Kamar Sekarang di Sini
                    </button>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    Tidak ada kamar dengan filter yang dipilih.
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const occupants = tenants.filter(t => t.kamar === room.number);
                    const capacity = Number(room.capacity) || 1;
                    const isEmpty = occupants.length === 0;
                    const isFull = occupants.length >= capacity;

                    let borderC = 'rgba(16, 185, 129, 0.35)';
                    let bgC = 'rgba(16, 185, 129, 0.08)';
                    let statusLabel = 'Kosong';
                    let statusColor = 'var(--accent-success)';

                    if (isFull) {
                      borderC = 'rgba(239, 68, 68, 0.35)';
                      bgC = 'rgba(239, 68, 68, 0.08)';
                      statusLabel = 'Penuh';
                      statusColor = 'var(--accent-danger)';
                    } else if (!isEmpty) {
                      borderC = 'rgba(245, 158, 11, 0.35)';
                      bgC = 'rgba(245, 158, 11, 0.08)';
                      statusLabel = `Sisa ${capacity - occupants.length}`;
                      statusColor = 'var(--accent-warning)';
                    }

                    return (
                      <div
                        key={room.id || room.number}
                        onClick={() => setSelectedRoomDetail({
                          room,
                          occupants,
                          isEmpty,
                          isFull,
                          statusLabel,
                          statusColor
                        })}
                        style={{
                          border: `1px solid ${borderC}`,
                          background: bgC,
                          borderRadius: '14px',
                          padding: '1rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '125px',
                          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title="Klik untuk detail & penghuni unit kamar ini"
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>KAMAR</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor }}>
                              {statusLabel}
                            </span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>
                            {room.number}
                          </h3>
                        </div>

                        <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                            {formatRupiah(room.price)}
                          </span>
                          {occupants.length > 0 ? (
                            <span style={{ fontSize: '0.7rem', color: '#93c5fd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              👤 {occupants.map(o => o.name).join(', ')}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#34d399', display: 'block' }}>
                              ✓ Siap Huni
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Activity Timeline */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Aktivitas Realtime</h3>
                <span className="badge badge-primary">
                  <Clock size={12} /> Log
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto',
                paddingRight: '6px',
                flex: 1
              }}>
                {activities.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    padding: '2rem 1rem',
                    fontSize: '0.85rem'
                  }}>
                    Belum ada aktivitas tercatat.
                  </div>
                ) : (
                  activities.slice(0, 15).map((act) => {
                    const dateObj = new Date(act.time);
                    const timeString = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
                    const dateString = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                    let dotColor = 'var(--accent-primary)';
                    if (act.type === 'keuangan') dotColor = 'var(--accent-success)';
                    if (act.type === 'komplain') dotColor = 'var(--accent-warning)';
                    if (act.type === 'pengguna') dotColor = '#38bdf8';

                    return (
                      <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: dotColor,
                          boxShadow: `0 0 8px ${dotColor}`,
                          marginTop: '6px',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                            {act.text}
                          </p>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {dateString} • {timeString}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: PENGATURAN KOST & KAMAR (EMBEDDED IN OVERVIEW)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'pengaturan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Action Card */}
          <div className="card glass-panel" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: '12px', color: 'white', display: 'flex' }}>
                <SettingsIcon size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>
                  Pengaturan Operasional Kost & Kamar
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Atur tarif listrik/air, deposit, unit kamar fisik, foto unit kamar asli, serta staf penjaga kost Anda
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveKostSettings()}
              disabled={savingSettings}
              className="btn btn-primary"
              style={{ gap: '8px', padding: '10px 22px' }}
            >
              <Save size={16} />
              <span>{savingSettings ? 'Menyimpan...' : 'Simpan Semua Pengaturan Kost'}</span>
            </button>
          </div>

          {/* SECTION 1: UTILITIES & RATES */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  padding: '10px',
                  borderRadius: '12px',
                  color: '#60a5fa',
                  display: 'flex'
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Skema Tagihan Utilitas & Ketentuan Kost</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Atur apakah tagihan listrik & air dikelola kost atau dibayar mandiri oleh penghuni (Token PLN / PDAM)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUtilityMeterQuery('');
                  setUtilityInquiryResult(null);
                  setUtilityInquiryError(null);
                  setUtilityModalOpen(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontSize: '0.8rem' }}
              >
                🔍 Cek ID Pelanggan PLN / PDAM
              </button>
            </div>

            {/* Pilihan 3 Skema Utilitas Utama */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Pilih Skema Pengelolaan Listrik & Air:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {[
                  {
                    id: 'all_kost',
                    icon: <span style={{ display: 'flex', gap: '2px' }}><Zap size={16} color="#eab308" /><Droplet size={16} color="#38bdf8" /></span>,
                    title: 'Air & Listrik dari Kost',
                    badge: 'Dikelola Kost',
                    desc: 'Listrik & air disediakan pihak kost (sudah include atau ditagih per meteran kost).'
                  },
                  {
                    id: 'electric_mandiri',
                    icon: <Zap size={18} color="#eab308" />,
                    title: 'Listrik Mandiri (Token PLN)',
                    badge: 'Token Mandiri',
                    desc: 'Penghuni isi token listrik PLN sendiri per kamar. Air disediakan oleh pihak kost.'
                  },
                  {
                    id: 'water_mandiri',
                    icon: <Droplet size={18} color="#38bdf8" />,
                    title: 'Air Mandiri (PDAM)',
                    badge: 'Air Mandiri',
                    desc: 'Penghuni membayar meteran air sendiri. Listrik disediakan & dikelola kost.'
                  },
                  {
                    id: 'all_mandiri',
                    icon: <span style={{ display: 'flex', gap: '2px' }}><Zap size={16} color="#eab308" /><Droplet size={16} color="#38bdf8" /></span>,
                    title: 'Listrik & Air Mandiri',
                    badge: 'Keduanya Mandiri',
                    desc: 'Penghuni bayar token PLN & air sendiri. Kost hanya menagih uang sewa pokok kamar.'
                  }
                ].map(opt => {
                  const isSelected = (settings.utilityScheme || 'all_kost') === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSettings(prev => ({ ...prev, utilityScheme: opt.id }))}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(15, 23, 42, 0.6) 100%)' : 'rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {opt.icon}
                          <strong style={{ fontSize: '0.88rem', color: isSelected ? '#93c5fd' : '#f8fafc' }}>
                            {opt.title}
                          </strong>
                        </div>
                        <input
                          type="radio"
                          name="overviewUtilityScheme"
                          checked={isSelected}
                          onChange={() => setSettings(prev => ({ ...prev, utilityScheme: opt.id }))}
                          style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Input Tarif Utilitas & Deposit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '6px' }}>
              
              {/* Tarif Air */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <Droplet size={14} color="#3b82f6" /> Tarif Air (Rp / m³)
                </label>
                {(settings.utilityScheme === 'water_mandiri' || settings.utilityScheme === 'all_mandiri') ? (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px dashed rgba(56, 189, 248, 0.3)',
                    fontSize: '0.8rem',
                    color: '#38bdf8'
                  }}>
                    💧 <strong>Air Mandiri:</strong> Penghuni bayar PDAM/meteran sendiri (Rp 0 ke kost).
                  </div>
                ) : (
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="Contoh: 5000 (0 jika gratis/include)"
                    value={settings.waterRate || ''} 
                    onChange={e => setSettings({...settings, waterRate: e.target.value})} 
                  />
                )}
              </div>
              
              {/* Tarif Listrik */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <Zap size={14} color="#f59e0b" /> Tarif Listrik (Rp / kWh)
                </label>
                {(settings.utilityScheme === 'electric_mandiri' || settings.utilityScheme === 'all_mandiri') ? (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px dashed rgba(245, 158, 11, 0.3)',
                    fontSize: '0.8rem',
                    color: '#fbbf24'
                  }}>
                    ⚡ <strong>Listrik Mandiri:</strong> Penghuni beli token PLN sendiri per kamar (Rp 0 ke kost).
                  </div>
                ) : (
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="Contoh: 1500 (0 jika gratis/include)"
                    value={settings.electricityRate || ''} 
                    onChange={e => setSettings({...settings, electricityRate: e.target.value})} 
                  />
                )}
              </div>

              {/* Uang Deposit */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <DollarSign size={14} color="#10b981" /> Uang Deposit Awal (Rp)
                </label>
                <input 
                  type="number" 
                  className="input-field"
                  placeholder="Contoh: 500000"
                  value={settings.depositAmount || ''} 
                  onChange={e => setSettings({...settings, depositAmount: e.target.value})} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button 
                type="button" 
                onClick={() => handleSaveKostSettings()} 
                disabled={savingSettings}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <Save size={14} /> Simpan Skema & Tarif Utilitas
              </button>
            </div>
          </div>

          {/* SECTION 2: PROGRAM DISKON & PROMO SEWA KOST */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: settings.discount?.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '12px',
                  color: settings.discount?.enabled ? '#10b981' : 'var(--text-secondary)',
                  display: 'flex'
                }}>
                  <Tag size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Program Diskon & Promo Sewa Kost</h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: settings.discount?.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      color: settings.discount?.enabled ? '#34d399' : '#94a3b8',
                      border: `1px solid ${settings.discount?.enabled ? 'rgba(52, 211, 153, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`
                    }}>
                      {settings.discount?.enabled ? '● PROMO AKTIF' : '○ NONAKTIF (HARGA NORMAL)'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Tentukan sendiri apakah kost Anda memberikan diskon, berapa besar potongannya, dan berapa lama durasi diskonnya
                  </span>
                </div>
              </div>

              {/* Master Switch Toggle */}
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                background: settings.discount?.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                padding: '8px 14px',
                borderRadius: '12px',
                border: `1px solid ${settings.discount?.enabled ? 'rgba(52, 211, 153, 0.4)' : 'var(--border-color)'}`,
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox"
                  checked={!!settings.discount?.enabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setSettings(prev => ({
                      ...prev,
                      discount: {
                        ...(prev.discount || { type: 'percent', value: 10, durationMonths: '1', validUntil: '', label: 'Promo Spesial' }),
                        enabled
                      }
                    }));
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: settings.discount?.enabled ? '#34d399' : 'var(--text-secondary)' }}>
                  {settings.discount?.enabled ? 'Diskon Promo Aktif' : 'Aktifkan Diskon Promo'}
                </span>
              </label>
            </div>

            {!settings.discount?.enabled ? (
              <div style={{
                padding: '1.5rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-color)',
                textAlign: 'center'
              }}>
                <Tag size={32} style={{ margin: '0 auto 8px', color: '#64748b', opacity: 0.6 }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Saat ini tidak ada program diskon aktif
                </h4>
                <p style={{ margin: '0 auto', maxWidth: '580px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Semua kamar kost disewakan dengan harga penuh (normal) tanpa potongan durasi sewa. Centang opsi <strong>"Aktifkan Diskon Promo"</strong> di atas jika Anda ingin menarik minat calon penyewa baru.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Form Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.1rem' }}>
                  
                  {/* 1. Tipe & Besaran Diskon */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <Percent size={14} color="#3b82f6" /> Tipe & Besaran Potongan
                    </label>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${settings.discount?.type === 'percent' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          discount: { ...prev.discount, type: 'percent', value: prev.discount?.type === 'percent' ? prev.discount.value : 10 }
                        }))}
                      >
                        Persentase (%)
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${settings.discount?.type === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          discount: { ...prev.discount, type: 'fixed', value: prev.discount?.type === 'fixed' ? prev.discount.value : 100000 }
                        }))}
                      >
                        Nominal (Rp)
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number"
                        className="input-field"
                        placeholder={settings.discount?.type === 'percent' ? 'Contoh: 10' : 'Contoh: 100000'}
                        value={settings.discount?.value || ''}
                        min={1}
                        max={settings.discount?.type === 'percent' ? 100 : undefined}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setSettings(prev => ({
                            ...prev,
                            discount: { ...prev.discount, value: val }
                          }));
                        }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.82rem', color: '#94a3b8', pointerEvents: 'none' }}>
                        {settings.discount?.type === 'percent' ? '%' : 'Rp / bln'}
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>Preset:</span>
                      {settings.discount?.type === 'percent' ? (
                        [5, 10, 15, 20, 25].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, discount: { ...prev.discount, value: p } }))}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              background: settings.discount?.value === p ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                              color: settings.discount?.value === p ? '#60a5fa' : '#94a3b8',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              cursor: 'pointer'
                            }}
                          >
                            {p}%
                          </button>
                        ))
                      ) : (
                        [50000, 100000, 150000, 200000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, discount: { ...prev.discount, value: amt } }))}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              background: settings.discount?.value === amt ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                              color: settings.discount?.value === amt ? '#60a5fa' : '#94a3b8',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              cursor: 'pointer'
                            }}
                          >
                            {amt / 1000}rb
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 2. Durasi Sewa yang Didiskon */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <Clock size={14} color="#f59e0b" /> Durasi Sewa yang Didiskon
                    </label>
                    <select
                      className="input-field"
                      value={settings.discount?.durationMonths || '1'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        discount: { ...prev.discount, durationMonths: e.target.value }
                      }))}
                      style={{ width: '100%', marginBottom: '8px' }}
                    >
                      <option value="1">1 Bulan Pertama (Welcome Promo)</option>
                      <option value="3">3 Bulan Pertama</option>
                      <option value="6">6 Bulan Pertama</option>
                      <option value="all">Sepanjang Masa Sewa (Semua Bulan Terdiskon)</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', lineHeight: '1.3' }}>
                      {settings.discount?.durationMonths === '1' && '💡 Penyewa hanya mendapat diskon di bulan pertama masuk, bulan berikutnya bayar harga normal.'}
                      {settings.discount?.durationMonths === '3' && '💡 Diskon dipotong untuk maksimal 3 bulan sewa pertama.'}
                      {settings.discount?.durationMonths === '6' && '💡 Diskon dipotong untuk maksimal 6 bulan sewa pertama.'}
                      {settings.discount?.durationMonths === 'all' && '💡 Diskon berlaku penuh untuk setiap bulan yang disewa.'}
                    </span>
                  </div>

                  {/* 3. Batas Waktu Promo (Masa Berlaku) */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <Calendar size={14} color="#ec4899" /> Batas Waktu Promo (Expired Date)
                    </label>
                    <input 
                      type="date"
                      className="input-field"
                      value={settings.discount?.validUntil || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        discount: { ...prev.discount, validUntil: e.target.value }
                      }))}
                      style={{ width: '100%', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {settings.discount?.validUntil 
                          ? `Berakhir: ${new Date(settings.discount.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` 
                          : 'Promo berkelanjutan tanpa batas akhir'}
                      </span>
                      {settings.discount?.validUntil && (
                        <button
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, discount: { ...prev.discount, validUntil: '' } }))}
                          style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                        >
                          Hapus Batas
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4. Label / Nama Promo */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <Tag size={14} color="#10b981" /> Nama / Judul Promo
                    </label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="Contoh: Promo Mahasiswa Baru"
                      value={settings.discount?.label || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        discount: { ...prev.discount, label: e.target.value }
                      }))}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      Ditampilkan pada rincian pemesanan dan kartu sewa calon penyewa
                    </span>
                  </div>
                </div>

                {/* Interactive Simulation Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Sparkles size={16} color="#60a5fa" />
                    <strong style={{ fontSize: '0.88rem', color: '#93c5fd' }}>Simulasi Perhitungan Calon Penyewa</strong>
                  </div>
                  
                  {(() => {
                    const samplePrice = Number(settings.rooms?.[0]?.price) || 1200000;
                    const sampleDur = 3; // sewa 3 bulan
                    const discountMonths = settings.discount?.durationMonths === 'all' ? sampleDur : Math.min(sampleDur, Number(settings.discount?.durationMonths) || 1);
                    const cutPerMonth = settings.discount?.type === 'percent'
                      ? Math.round(samplePrice * ((Number(settings.discount?.value) || 0) / 100))
                      : Math.min(samplePrice, Number(settings.discount?.value) || 0);
                    const totalCut = cutPerMonth * discountMonths;
                    const totalRent = (samplePrice * sampleDur) - totalCut;

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Contoh Tarif Kamar:</span>
                          <strong style={{ color: 'white' }}>{formatRupiah(samplePrice)} / bln</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Potongan per bln:</span>
                          <strong style={{ color: '#34d399' }}>- {formatRupiah(cutPerMonth)}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Durasi didiskon:</span>
                          <strong style={{ color: '#38bdf8' }}>{discountMonths} Bulan</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Total sewa 3 bln:</span>
                          <strong style={{ color: '#60a5fa', fontSize: '0.95rem' }}>
                            {formatRupiah(totalRent)}{' '}
                            <span style={{ fontSize: '0.72rem', color: '#34d399' }}>(Hemat {formatRupiah(totalCut)})</span>
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => handleSaveKostSettings()} 
                    disabled={savingSettings}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Save size={14} /> Simpan Pengaturan Diskon
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2B: 0% DISRUPTION MONETIZATION (SUNDUL KOST, WA BOT QUOTA & PARTNER DIRECTORY) */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: settings.promoted?.active ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: settings.promoted?.active ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: settings.promoted?.active ? '#fbbf24' : '#60a5fa'
                }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Sundul Kost & Ekosistem Layanan (0% Gangguan Iklan)</h3>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      background: settings.promoted?.active ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                      color: settings.promoted?.active ? '#fbbf24' : '#34d399',
                      border: settings.promoted?.active ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {settings.promoted?.active ? '🔥 Aktif di Posisi #1 Cari Kost' : '✅ Bebas Iklan Mengganggu'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Naikkan kost ke urutan teratas saat ada kamar kosong, kelola kuota pesan otomatis, & akses mitra perawatan kost
                  </span>
                </div>
              </div>

              <Link
                to="/cari-kost"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                <ExternalLink size={13} /> Cek Posisi di Cari Kost
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Card 1: Sundul Kost (Promoted Listing) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: settings.promoted?.active ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚀 Fitur "Sundul Kost" (Boost Posisi #1)
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      Biaya Pasif
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Kamar sedang kosong? Tampilkan properti Anda di urutan #1 halaman Cari Kost dengan badge prioritas agar cepat dilihat calon penyewa.
                  </p>

                  {/* Plan Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                    {[
                      { id: '7d', label: '7 Hari', price: 'Rp 20rb', sub: 'Cepat Laku' },
                      { id: '14d', label: '14 Hari', price: 'Rp 35rb', sub: 'Hemat 12%' },
                      { id: '30d', label: '30 Hari', price: 'Rp 65rb', sub: 'Terlaris' }
                    ].map(p => {
                      const isSel = (settings.promoted?.plan || '7d') === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            promoted: { ...(prev.promoted || {}), plan: p.id }
                          }))}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '10px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: isSel ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                            background: isSel ? 'rgba(245, 158, 11, 0.14)' : 'rgba(0,0,0,0.2)',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: isSel ? '#fbbf24' : '#e2e8f0' }}>{p.label}</div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'white', margin: '2px 0' }}>{p.price}</div>
                          <div style={{ fontSize: '0.64rem', color: isSel ? '#fde68a' : '#94a3b8' }}>{p.sub}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Badge Selector */}
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Pilih Label Badge Prioritas:
                    </label>
                    <select
                      className="input-field"
                      value={settings.promoted?.badgeText || '🔥 Rekomendasi Utama'}
                      onChange={e => setSettings(prev => ({
                        ...prev,
                        promoted: { ...(prev.promoted || {}), badgeText: e.target.value }
                      }))}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <option value="🔥 Rekomendasi Utama">🔥 Rekomendasi Utama</option>
                      <option value="⚡ Prioritas Pencarian">⚡ Prioritas Pencarian</option>
                      <option value="🌟 Kost Terverifikasi Unggulan">🌟 Kost Terverifikasi Unggulan</option>
                    </select>
                  </div>
                </div>

                {settings.promoted?.active ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      color: '#34d399',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>✅ Aktif ({settings.promoted.badgeText})</span>
                      {settings.promoted.expiresAt && (
                        <span>s.d {new Date(settings.promoted.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={promotingKost}
                        onClick={() => handlePromoteKostAction('activate', settings.promoted?.plan || '7d', settings.promoted?.badgeText)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 700, border: 'none' }}
                      >
                        Perbarui Boost
                      </button>
                      <button
                        type="button"
                        disabled={promotingKost}
                        onClick={() => handlePromoteKostAction('deactivate')}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#f87171' }}
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={promotingKost}
                    onClick={() => handlePromoteKostAction('activate', settings.promoted?.plan || '7d', settings.promoted?.badgeText || '🔥 Rekomendasi Utama')}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#000',
                      fontWeight: 800,
                      border: 'none',
                      gap: '6px'
                    }}
                  >
                    🚀 Sundul Kost ke Posisi #1 Sekarang
                  </button>
                )}
              </div>

              {/* Card 2: Kuota Robot WhatsApp & Biaya Transaksi (Self-Liquidating Active Cost) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🤖 Kuota WA Bot & Proteksi Biaya Aktif
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      Biaya Aktif
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Fitur dasar KostKu <strong>100% Gratis Selamanya</strong>. Biaya API aktif hanya dikenakan sesuai pemakaian agar aplikasi bebas dari iklan spam.
                  </p>

                  {/* Quota Display Box */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Sisa Kuota WA Bot Otomatis:</span>
                      <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{settings.waBotQuota ?? 25} Pesan</strong>
                    </div>
                    <button
                      type="button"
                      disabled={promotingKost}
                      onClick={() => handlePromoteKostAction('topup_wa', '7d', '', 100)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#7dd3fc' }}
                    >
                      +100 Kuota (Rp 25rb)
                    </button>
                  </div>

                  {/* Cost Mapping List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Kirim Tagihan WA Manual (Klik `wa.me`):</span>
                      <strong style={{ color: '#34d399' }}>GRATIS (Rp 0)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Pembukuan Kamar, Keuangan & Komplain:</span>
                      <strong style={{ color: '#34d399' }}>GRATIS (Rp 0)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Biaya Layanan Checkout Digital / Token:</span>
                      <strong style={{ color: '#fbbf24' }}>Rp 2.000 / trx</strong>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.72rem',
                  color: '#a7f3d0'
                }}>
                  💡 <strong>Zero-Ads Policy:</strong> Halaman keuangan, tagihan, dan komplain dijamin 100% bersih tanpa iklan pihak ketiga.
                </div>
              </div>
            </div>

            {/* Contextual B2B & B2C Partner Directory (Non-Annoying Value-Added Partners) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.9rem 1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🤝 Direktori Partner Kebutuhan Operasional Kost (Diskon Khusus Owner & Penghuni)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Partner resmi terkurasi • Tanpa pop-up
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {[
                  { icon: '❄️', title: 'Service & Cuci AC Kost', desc: 'Rp 45rb/unit (Min. 5 kamar)', link: 'https://wa.me/6281234567890?text=Halo%20Mitra%20KostKu,%20saya%20ingin%20pesan%20paket%20cuci%20AC%20kost' },
                  { icon: '📶', title: 'WiFi Dedicated Kost', desc: 'Promo Biznet / IndiHome Kost', link: 'https://wa.me/6281234567890?text=Halo%20Mitra%20KostKu,%20saya%20ingin%20info%20promo%20WiFi%20kost' },
                  { icon: '🧺', title: 'Mitra Laundry Kiloan', desc: 'Komisi 10% bagi pemilik kost', link: 'https://wa.me/6281234567890?text=Halo%20Mitra%20KostKu,%20saya%20tertarik%20kerjasama%20laundry%20kost' },
                  { icon: '🛏️', title: 'Grosir Kasur & Sprei', desc: 'Diskon 20% standar hotel', link: 'https://wa.me/6281234567890?text=Halo%20Mitra%20KostKu,%20saya%20ingin%20lihat%20katalog%20kasur%20dan%20sprei' }
                ].map((partner, idx) => (
                  <a
                    key={idx}
                    href={partner.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: 'none',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.15rem' }}>{partner.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>{partner.title}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{partner.desc}</div>
                      </div>
                    </div>
                    <ExternalLink size={12} color="#60a5fa" style={{ flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: ROOMS MANAGEMENT */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BedDouble size={20} color="var(--accent-primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Daftar Unit Kamar ({settings.rooms.length})</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tambah unit satu per satu dengan foto asli atau gunakan generate massal</span>
                </div>
              </div>
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowBulkModal(true)}
              >
                ⚡ Generate Massal
              </button>
            </div>

            {/* Add single room form */}
            <form onSubmit={handleAddRoom} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(255,255,255,0.02)',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} color="#3b82f6" /> Tambah Unit Kamar Baru (Wajib Foto Fisik Asli)
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Calon penyewa di Cari Kost wajib melihat foto fisik asli tiap unit kamar
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nomor Kamar *</label>
                  <input type="text" required placeholder="Contoh: A01" value={newRoom.number} onChange={e => setNewRoom({...newRoom, number: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Harga Sewa (Rp) *</label>
                  <input type="number" required placeholder="1500000" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kapasitas Bed</label>
                  <input type="number" min="1" required value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ukuran Kamar</label>
                  <input type="text" placeholder="Contoh: 3.5x4m" value={newRoom.size || ''} onChange={e => setNewRoom({...newRoom, size: e.target.value})} className="input-field" />
                </div>
                {(settings.utilityScheme === 'electric_mandiri' || settings.utilityScheme === 'all_mandiri') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#fbbf24', marginBottom: '4px' }}>⚡ No. Meter PLN (Token)</label>
                    <input type="text" placeholder="11-12 digit No Meter" value={newRoom.plnMeterNo || ''} onChange={e => setNewRoom({...newRoom, plnMeterNo: e.target.value})} className="input-field" />
                  </div>
                )}
                {(settings.utilityScheme === 'water_mandiri' || settings.utilityScheme === 'all_mandiri') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#38bdf8', marginBottom: '4px' }}>💧 No. Pelanggan PDAM</label>
                    <input type="text" placeholder="No Rekening PDAM" value={newRoom.pdamMeterNo || ''} onChange={e => setNewRoom({...newRoom, pdamMeterNo: e.target.value})} className="input-field" />
                  </div>
                )}
              </div>

              {/* Upload Foto Kamar Asli (Wajib) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  📸 Foto Fisik Kamar Ini (Wajib Diunggah) <span style={{ color: '#ef4444' }}>*</span>
                </label>

                {newRoom.roomPhoto ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <img 
                      src={newRoom.roomPhoto} 
                      alt="Preview Kamar" 
                      style={{ width: '90px', height: '65px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '0.82rem', fontWeight: 700 }}>
                        <CheckCircle size={15} /> Foto Kamar {newRoom.number || ''} Terpilih
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        Foto ini akan ditampilkan kepada calon penyewa saat melihat ketersediaan unit kamar ini.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', fontSize: '0.75rem', gap: '4px' }}>
                        <Upload size={13} /> Ganti Foto
                        <input type="file" accept="image/*" onChange={handleRoomPhotoUpload} hidden />
                      </label>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setNewRoom(prev => ({ ...prev, roomPhoto: '' }))}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    border: '2px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: '14px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    cursor: 'pointer',
                    gap: '6px',
                    transition: 'border 0.2s'
                  }}>
                    <Camera size={26} color="#60a5fa" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      Pilih / Jepret Foto Fisik Kamar (Wajib)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Format JPG, PNG, atau WEBP (Maksimal 5MB)
                    </span>
                    <input type="file" accept="image/*" onChange={handleRoomPhotoUpload} hidden />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '10px 24px', fontWeight: 700, fontSize: '0.88rem', gap: '8px' }}
                >
                  <Plus size={16} /> Simpan Unit Kamar ({newRoom.number || 'Baru'})
                </button>
              </div>
            </form>

            {/* Room items grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '14px'
            }}>
              {settings.rooms.map(room => {
                const occupants = tenants.filter(t => t.kamar === room.number);
                const isOccupied = occupants.length > 0;
                const photoSrc = room.roomPhoto || room.photo;

                return (
                  <div 
                    key={room.id || room.number}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: isOccupied ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    {/* Delete button */}
                    <button 
                      onClick={() => handleDeleteRoom(room.id, room.number)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--accent-danger)',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                        transition: 'transform 0.15s ease'
                      }}
                      title="Hapus Kamar"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Room Photo Thumbnail */}
                    <div style={{
                      width: '100%',
                      height: '135px',
                      background: '#0a0f1d',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {photoSrc ? (
                        <>
                          <img 
                            src={photoSrc} 
                            alt={`Foto Kamar ${room.number}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(10, 15, 29, 0.85) 0%, transparent 60%)',
                            pointerEvents: 'none'
                          }} />
                          
                          <span style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'rgba(16, 185, 129, 0.85)',
                            backdropFilter: 'blur(4px)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px'
                          }}>
                            Foto Fisik
                          </span>

                          <label style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#93c5fd',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                          }}>
                            <Camera size={11} /> Ganti Foto
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={e => handleUpdateRoomCardPhoto(room.id, e.target.files?.[0])} 
                              hidden 
                            />
                          </label>
                        </>
                      ) : (
                        <label style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          padding: '12px',
                          textAlign: 'center',
                          width: '100%',
                          height: '100%',
                          justifyContent: 'center',
                          background: 'rgba(239, 68, 68, 0.05)',
                          border: '1px dashed rgba(239, 68, 68, 0.3)'
                        }}>
                          <Camera size={22} color="#f87171" />
                          <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700 }}>
                            ⚠️ Belum Ada Foto
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#38bdf8', textDecoration: 'underline' }}>
                            Upload Foto
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleUpdateRoomCardPhoto(room.id, e.target.files?.[0])} 
                            hidden 
                          />
                        </label>
                      )}
                    </div>

                    {/* Room Details */}
                    <div 
                      onClick={() => setSelectedRoomDetail({
                        room,
                        occupants,
                        isEmpty: !isOccupied,
                        isFull: isOccupied && occupants.length >= (room.capacity || 1),
                        statusLabel: isOccupied ? (occupants.length >= (room.capacity || 1) ? 'Terisi Penuh' : 'Terisi Sebagian') : 'Tersedia',
                        statusColor: isOccupied ? (occupants.length >= (room.capacity || 1) ? '#3b82f6' : '#f59e0b') : '#10b981'
                      })}
                      style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}
                      title="Klik untuk detail & penghuni unit kamar ini"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>
                          {room.number}
                        </h4>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-secondary)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            {room.capacity || 1} Bed
                          </span>
                          {room.size && (
                            <span style={{
                              fontSize: '0.68rem',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-secondary)',
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              {room.size}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.92rem', color: '#60a5fa', fontWeight: 800 }}>
                          {formatRupiah(room.price)}
                        </span>
                        {isOccupied ? (
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#93c5fd',
                            background: 'rgba(59, 130, 246, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            Terisi ({occupants[0]?.name || 'Penghuni'})
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            Tersedia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: KELOLA AKUN LOGIN STAF & PENJAGA KOST */}
          <StaffManagementCard user={user} />
        </div>
      )}

      {/* ROOM DETAIL & OCCUPANT MODAL */}
      {selectedRoomDetail && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={() => setSelectedRoomDetail(null)}
        >
          <div 
            className="card glass-panel" 
            style={{ 
              maxWidth: '460px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              padding: '1.5rem', 
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Home size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                    Kamar {selectedRoomDetail.room?.number}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: selectedRoomDetail.statusColor || '#10b981',
                      background: `${selectedRoomDetail.statusColor || '#10b981'}20`,
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}>
                      {selectedRoomDetail.statusLabel || (selectedRoomDetail.isEmpty ? 'Tersedia' : 'Terisi')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ID: {selectedRoomDetail.room?.id || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedRoomDetail(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Room Photo Preview */}
            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '1.25rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <img
                src={selectedRoomDetail.room?.roomPhoto || selectedRoomDetail.room?.photo || selectedRoomDetail.room?.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'}
                alt={`Kamar ${selectedRoomDetail.room?.number}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10, 15, 29, 0.8) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                right: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {formatRupiah(selectedRoomDetail.room?.price)}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#e2e8f0' }}> / bulan</span>
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {selectedRoomDetail.room?.size ? `Ukuran ${selectedRoomDetail.room.size}` : 'Tipe Standar'}
                </span>
              </div>
            </div>

            {/* Room Quick Specs Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '8px 10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>KAPASITAS</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                  {selectedRoomDetail.room?.capacity || 1} Bed
                </span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '8px 10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>STATUS</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: selectedRoomDetail.occupants?.length > 0 ? '#38bdf8' : '#34d399'
                }}>
                  {selectedRoomDetail.occupants?.length > 0 ? `${selectedRoomDetail.occupants.length} Dihuni` : 'Kosong'}
                </span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '8px 10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>SISA SLOT</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                  {Math.max(0, (selectedRoomDetail.room?.capacity || 1) - (selectedRoomDetail.occupants?.length || 0))} Bed
                </span>
              </div>
            </div>

            {/* Utility Meter Info for Room */}
            <div style={{
              marginBottom: '1.25rem',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={13} color="#fbbf24" /> Utilitas Kamar {selectedRoomDetail.room?.number}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  background: settings.utilityScheme === 'all_kost' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: settings.utilityScheme === 'all_kost' ? '#60a5fa' : '#fbbf24'
                }}>
                  {settings.utilityScheme === 'electric_mandiri' ? '⚡ Listrik Mandiri' :
                   settings.utilityScheme === 'water_mandiri' ? '💧 Air Mandiri' :
                   settings.utilityScheme === 'all_mandiri' ? '⚡💧 Listrik & Air Mandiri' : '🏢 Utilitas Dikelola Kost'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Meter PLN:</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <strong style={{ color: selectedRoomDetail.room?.plnMeterNo ? '#fef08a' : '#94a3b8' }}>
                      {selectedRoomDetail.room?.plnMeterNo || 'Belum diisi'}
                    </strong>
                    {selectedRoomDetail.room?.plnMeterNo && (
                      <button
                        type="button"
                        onClick={() => {
                          setUtilityInquiryType('pln');
                          setUtilityMeterQuery(selectedRoomDetail.room.plnMeterNo);
                          setUtilityModalOpen(true);
                          handleCheckUtilityMeter('pln', selectedRoomDetail.room.plnMeterNo);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0 2px' }}
                        title="Cek Token PLN"
                      >
                        <Search size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>ID PDAM:</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <strong style={{ color: selectedRoomDetail.room?.pdamMeterNo ? '#7dd3fc' : '#94a3b8' }}>
                      {selectedRoomDetail.room?.pdamMeterNo || 'Belum diisi'}
                    </strong>
                    {selectedRoomDetail.room?.pdamMeterNo && (
                      <button
                        type="button"
                        onClick={() => {
                          setUtilityInquiryType('pdam');
                          setUtilityMeterQuery(selectedRoomDetail.room.pdamMeterNo);
                          setUtilityModalOpen(true);
                          handleCheckUtilityMeter('pdam', selectedRoomDetail.room.pdamMeterNo);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0 2px' }}
                        title="Cek Tagihan PDAM"
                      >
                        <Search size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Occupants Section */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                  Penghuni Kamar ({selectedRoomDetail.occupants?.length || 0})
                </span>
              </div>

              {selectedRoomDetail.occupants && selectedRoomDetail.occupants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedRoomDetail.occupants.map((occ, idx) => (
                    <div 
                      key={occ.id || idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {occ.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {occ.name}
                            {occ.verifiedKtp && (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 5px', borderRadius: '4px' }}>
                                KTP OK
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            {occ.email || occ.phone || 'Penghuni aktif'}
                          </span>
                        </div>
                      </div>

                      {occ.phone && (
                        <a
                          href={`https://wa.me/${occ.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#4ade80'
                          }}
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle size={13} /> WA
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-light)',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Belum ada penghuni di kamar ini
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Kamar berstatus siap huni dan tersedia untuk pemohon baru.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedRoomDetail(null)}
              >
                Tutup
              </button>
              <Link
                to="/penghuni"
                className="btn btn-primary"
                style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setSelectedRoomDetail(null)}
              >
                <Users size={15} /> Kelola Penghuni
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* BULK GENERATE MODAL */}
      {showBulkModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div className="card glass-panel" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Generate Kamar Massal</h3>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Prefix (Huruf)</label>
                  <input type="text" placeholder="Contoh: A" value={bulkConfig.prefix} onChange={e => setBulkConfig({...bulkConfig, prefix: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mulai Nomor</label>
                  <input type="number" required placeholder="101" value={bulkConfig.startNumber} onChange={e => setBulkConfig({...bulkConfig, startNumber: e.target.value})} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jumlah Kamar</label>
                  <input type="number" required placeholder="10" value={bulkConfig.count} onChange={e => setBulkConfig({...bulkConfig, count: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kapasitas (Bed)</label>
                  <input type="number" min="1" required value={bulkConfig.capacity} onChange={e => setBulkConfig({...bulkConfig, capacity: e.target.value})} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Harga Sewa (Rp)</label>
                  <input type="number" required placeholder="1500000" value={bulkConfig.price} onChange={e => setBulkConfig({...bulkConfig, price: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ukuran Kamar</label>
                  <input type="text" placeholder="Contoh: 3x4m" value={bulkConfig.size || ''} onChange={e => setBulkConfig({...bulkConfig, size: e.target.value})} className="input-field" />
                </div>
              </div>

              {/* Upload 1 Foto Kamar Identik */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  📸 1 Foto Fisik Kamar (Otomatis Diterapkan ke Semua Unit) <span style={{ color: '#ef4444' }}>*</span>
                </label>

                {bulkConfig.roomPhoto ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '8px 12px',
                    borderRadius: '10px'
                  }}>
                    <img 
                      src={bulkConfig.roomPhoto} 
                      alt="Preview Foto Massal" 
                      style={{ width: '70px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80', fontSize: '0.78rem', fontWeight: 700 }}>
                        <CheckCircle size={14} /> Foto Tipe Kamar Terpilih
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Akan diterapkan ke {bulkConfig.count || 'seluruh'} unit kamar
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}>
                        <Upload size={12} /> Ganti
                        <input type="file" accept="image/*" onChange={handleBulkPhotoUpload} hidden />
                      </label>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        onClick={() => setBulkConfig(prev => ({ ...prev, roomPhoto: '' }))}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    border: '2px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    gap: '4px'
                  }}>
                    <Camera size={22} color="#60a5fa" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                      Pilih 1 Foto Fisik Kamar (Wajib)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Foto ini otomatis dipakai untuk semua kamar massal karena identik
                    </span>
                    <input type="file" accept="image/*" onChange={handleBulkPhotoUpload} hidden />
                  </label>
                )}
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.76rem',
                color: '#93c5fd',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={15} style={{ flexShrink: 0 }} color="#60a5fa" />
                <span>Cukup unggah 1 foto untuk seluruh unit kamar yang digenerate karena tipe kamar identik. Foto per unit tetap dapat diganti kemudian.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)} style={{ flex: 1 }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Generate Kamar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UTILITY METER INQUIRY MODAL (PLN & PDAM) */}
      {utilityModalOpen && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '18px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: utilityInquiryType === 'pln' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {utilityInquiryType === 'pln' ? <Zap size={18} color="#fbbf24" /> : <Droplet size={18} color="#38bdf8" />}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                    Inquiry & Cek Meter Utilitas
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Validasi nomor meteran, daya terdaftar, status pelanggan, dan pembelian token
                </p>
              </div>
              <button 
                onClick={() => setUtilityModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Type Switcher */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'rgba(0,0,0,0.3)',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '1.25rem'
            }}>
              <button
                type="button"
                onClick={() => {
                  setUtilityInquiryType('pln');
                  setUtilityInquiryResult(null);
                  setUtilityInquiryError(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: utilityInquiryType === 'pln' ? '#f59e0b' : 'transparent',
                  color: utilityInquiryType === 'pln' ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <Zap size={14} /> PLN (Token / Tagihan)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUtilityInquiryType('pdam');
                  setUtilityInquiryResult(null);
                  setUtilityInquiryError(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: utilityInquiryType === 'pdam' ? '#0284c7' : 'transparent',
                  color: utilityInquiryType === 'pdam' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <Droplet size={14} /> PDAM (Air Minum)
              </button>
            </div>

            {/* Input & Search Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleCheckUtilityMeter(); }} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {utilityInquiryType === 'pln' ? 'Nomor Meter PLN / ID Pelanggan (11-12 digit):' : 'Nomor Pelanggan PDAM:'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={utilityInquiryType === 'pln' ? 'Contoh: 14285930219' : 'Contoh: 0029412'}
                  value={utilityMeterQuery}
                  onChange={(e) => setUtilityMeterQuery(e.target.value)}
                  className="input-field"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={utilityInquiryLoading}
                  className="btn btn-primary"
                  style={{ gap: '6px', padding: '0 16px', flexShrink: 0 }}
                >
                  {utilityInquiryLoading ? (
                    <RefreshCw size={14} className="spin-animation" />
                  ) : (
                    <Search size={14} />
                  )}
                  {utilityInquiryLoading ? 'Cek...' : 'Cek ID'}
                </button>
              </div>

              {/* Sample Shortcuts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>Contoh Cepat:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = utilityInquiryType === 'pln' ? '14285930219' : '0029412';
                    setUtilityMeterQuery(sample);
                    handleCheckUtilityMeter(utilityInquiryType, sample);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-light)',
                    color: '#38bdf8',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: '0.72rem'
                  }}
                >
                  {utilityInquiryType === 'pln' ? '14285930219 (Kamar A01)' : '0029412 (PDAM)'}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {utilityInquiryError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '1rem',
                color: '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{utilityInquiryError}</span>
              </div>
            )}

            {/* Inquiry Result Card */}
            {utilityInquiryResult && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15} color="#34d399" />
                    <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                      {utilityInquiryResult.type === 'pln' ? 'Data Meteran PLN Ditemukan' : 'Data Pelanggan PDAM Ditemukan'}
                    </strong>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {utilityInquiryResult.status || 'Aktif'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Nama Pelanggan:</span>
                    <strong style={{ color: '#ffffff' }}>{utilityInquiryResult.name || utilityInquiryResult.subscriberName || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Nomor ID / Meter:</span>
                    <strong style={{ color: '#38bdf8' }}>{utilityInquiryResult.customerId || utilityInquiryResult.idNumber || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Tarif / Daya:</span>
                    <strong style={{ color: '#fbbf24' }}>{utilityInquiryResult.tariff || utilityInquiryResult.tariffPower || utilityInquiryResult.category || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Tipe Layanan / Wilayah:</span>
                    <span style={{ color: '#e2e8f0' }}>{utilityInquiryResult.meterType || utilityInquiryResult.region || utilityInquiryResult.unitName || utilityInquiryResult.city || '-'}</span>
                  </div>
                </div>

                {/* Direct Purchase & Payment Links */}
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-light)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    🔗 Shortcut Pembelian Token & Pembayaran:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {utilityInquiryResult.type === 'pln' ? (
                      <>
                        <a
                          href="https://web.pln.co.id/"
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> Portal PLN
                        </a>
                        <a
                          href="https://www.tokopedia.com/top-up/token-listrik/"
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> Beli di Tokopedia
                        </a>
                        <a
                          href="https://shopee.co.id/m/pulsa-tagihan-dan-hiburan"
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> Beli di Shopee
                        </a>
                      </>
                    ) : (
                      <>
                        <a
                          href="https://www.tokopedia.com/tagihan/pdam/"
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> Bayar via Tokopedia
                        </a>
                        <a
                          href="https://shopee.co.id/m/pulsa-tagihan-dan-hiburan"
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                        >
                          <ExternalLink size={12} /> Bayar via Shopee
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* B2B API Explanation Card */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.75rem',
              color: '#93c5fd',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#60a5fa" /> Seputar Integrasi API PLN & PDAM Resmi
              </div>
              <p style={{ margin: '0 0 6px 0', color: '#cbd5e1' }}>
                PLN dan PDAM tidak menyediakan Open API publik gratis. Di industri perbankan & fintech Indonesia, integrasi live PLN dan PDAM dilakukan melalui <strong>Aggregator B2B PPOB</strong> (seperti Ayoconnect, Digiflazz, atau Alterra Bills).
              </p>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                KostKu telah menyiapkan endpoint simulator & format data kamar standar. Jika Anda memiliki akun B2B PPOB, kredensial API Key dapat langsung dihubungkan untuk auto-inquiry dan topup otomatis.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setUtilityModalOpen(false)}
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Dashboard;
