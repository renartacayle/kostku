import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Zap,
  Plus, 
  X,
  Bell,
  ChevronRight,
  MessageCircle, 
  CreditCard, 
  AlertCircle,
  UserPlus,
  Send,
  Building,
  Receipt,
  Store,
  QrCode,
  Package,
  Wrench,
  CheckCircle2,
  Clock,
  Check
} from 'lucide-react';
import CustomerServiceModal from './CustomerServiceModal';
import { useTheme } from '../context/ThemeContext';
import { 
  apiGetComplaints, 
  apiGetInvoices, 
  apiGetPackages 
} from '../services/api';

/**
 * FabFanMenu - Minimalist Role-Adaptive Quick Actions & Notification Hub
 * Designed with modern minimalist aesthetic:
 * 1. Single sculpted frosted-glass popover card (No cluttered rainbow balls).
 * 2. Integrated real-time Notification Feed & Unread Badge Counter.
 * 3. Monochromatic quiet-luxury design with refined typography.
 * 4. Pure 2D spring physics (Zero 3D).
 */
export default function FabFanMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions' | 'notifications'
  const [isCsModalOpen, setIsCsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Read active user session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kostUser') || '{}');
    } catch (_) {
      return {};
    }
  });

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      } else {
        try {
          setCurrentUser(JSON.parse(localStorage.getItem('kostUser') || '{}'));
        } catch (_) {}
      }
    };
    window.addEventListener('kostku_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('kostku_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  // Close on ESC key or route navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Sembunyikan FAB pada halaman Auth, Checkout, Meja Order, dan Testing
  const shouldHideFab = 
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/demo' ||
    location.pathname === '/sandbox' ||
    location.pathname === '/demo-showcase' ||
    location.pathname === '/checkout' || 
    location.pathname === '/bayar' ||
    location.pathname === '/pembayaran' ||
    location.pathname === '/stress-test-report' ||
    location.pathname.startsWith('/stress-test') ||
    location.pathname.startsWith('/order') ||
    location.pathname.startsWith('/meja') ||
    location.pathname.startsWith('/kasir') ||
    location.pathname.startsWith('/pos');

  // Determine current active role
  const role = (currentUser?.role || '').toLowerCase();
  const targetKostUid = currentUser?.kostUid || localStorage.getItem('kostUid') || 'KOST-OJN64X';

  // ── NOTIFICATION ENGINE ──────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('kostku_read_notifs') || '[]');
    } catch (_) {
      return [];
    }
  });

  // Fetch contextual notifications based on role
  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        let items = [];
        const [complaintsRes, invoicesRes, packagesRes] = await Promise.all([
          apiGetComplaints(targetKostUid).catch(() => []),
          apiGetInvoices(targetKostUid).catch(() => []),
          apiGetPackages(targetKostUid).catch(() => [])
        ]);

        if (!isMounted) return;

        const activeComplaints = Array.isArray(complaintsRes) ? complaintsRes.filter(c => c.status !== 'selesai') : [];
        const unpaidInvoices = Array.isArray(invoicesRes) ? invoicesRes.filter(i => i.status !== 'lunas') : [];
        const activePackages = Array.isArray(packagesRes) ? packagesRes.filter(p => p.status !== 'picked_up') : [];

        if (role === 'owner' || role === 'master') {
          // Owner notifications
          if (activeComplaints.length > 0) {
            items.push({
              id: 'notif-comp-owner',
              title: `${activeComplaints.length} Komplain Kamar Menunggu`,
              desc: activeComplaints[0].text ? `Kamar ${activeComplaints[0].kamar || ''}: "${activeComplaints[0].text.substring(0, 42)}..."` : 'Ada keluhan fasilitas kamar perlu ditinjau',
              time: 'Baru saja',
              type: 'complaint',
              path: '/komplain'
            });
          }
          if (unpaidInvoices.length > 0) {
            items.push({
              id: 'notif-inv-owner',
              title: `${unpaidInvoices.length} Tagihan Sewa Belum Lunas`,
              desc: 'Penyewa belum menyelesaikan pembayaran bulan berjalan',
              time: 'Hari ini',
              type: 'invoice',
              path: '/keuangan'
            });
          }
          items.push({
            id: 'notif-staff-mode',
            title: 'Mode Ambil Alih Staf Aktif',
            desc: 'Anda memiliki akses catat meteran & terima paket kurir',
            time: 'Aktif',
            type: 'staff',
            path: '/dashboard?view=staff'
          });
        } else if (role === 'mitra' || role === 'bisnis' || role === 'merchant') {
          // Mitra notifications
          items.push(
            {
              id: 'notif-pos-mitra',
              title: 'Terminal Kasir POS Siap',
              desc: 'Input pesanan pelanggan walk-in & cetak struk instan',
              time: 'Realtime',
              type: 'pos',
              path: '/kasir'
            },
            {
              id: 'notif-table-mitra',
              title: 'Layanan Meja & QR Resto',
              desc: 'Pantau pemesanan meja makan dan antrean masak dapur',
              time: '5m lalu',
              type: 'table',
              path: '/order'
            }
          );
        } else if (role === 'staff' || role === 'karyawan' || role === 'pegawai') {
          // Staff notifications
          if (activeComplaints.length > 0) {
            items.push({
              id: 'notif-task-staff',
              title: `${activeComplaints.length} Tugas Perbaikan Aktif`,
              desc: `Tiket Kamar ${activeComplaints[0].kamar || 'Kost'}: ${activeComplaints[0].text ? activeComplaints[0].text.substring(0, 36) : 'Perlu penanganan'}`,
              time: 'Prioritas',
              type: 'task',
              path: '/dashboard'
            });
          }
          items.push({
            id: 'notif-meteran-staff',
            title: 'Jadwal Catat Meteran Bulan Ini',
            desc: 'Pastikan angka kWh PLN & meteran PDAM tiap kamar tercatat',
            time: 'Bulan ini',
            type: 'meteran',
            path: '/dashboard'
          });
          if (activePackages.length > 0) {
            items.push({
              id: 'notif-pkg-staff',
              title: `${activePackages.length} Paket Kurir Masuk`,
              desc: 'Titipan barang di resepsionis siap diambil penghuni',
              time: '1 jam lalu',
              type: 'package',
              path: '/dashboard'
            });
          }
        } else {
          // Tenant / User notifications
          items.push(
            {
              id: 'notif-bill-user',
              title: 'Tagihan Sewa Bulan Berjalan',
              desc: 'Bayar mudah lewat QRIS Dinamis atau Virtual Account',
              time: 'Jatuh tempo',
              type: 'invoice',
              path: '/dashboard'
            },
            {
              id: 'notif-pkg-user',
              title: 'Titipan Paket Kurir',
              desc: 'Cek kode OTP pengambilan paket di resepsionis kost',
              time: 'Hari ini',
              type: 'package',
              path: '/dashboard'
            }
          );
        }

        setNotifications(items);
      } catch (err) {
        console.warn('Failed loading notifications in FabFanMenu:', err);
      }
    }

    loadNotifications();
  }, [role, targetKostUid]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readNotifIds.includes(n.id)).length;
  }, [notifications, readNotifIds]);

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      sessionStorage.setItem('kostku_read_notifs', JSON.stringify(allIds));
    } catch (_) {}
  };

  const handleNotificationClick = (item) => {
    if (!readNotifIds.includes(item.id)) {
      const updated = [...readNotifIds, item.id];
      setReadNotifIds(updated);
      try {
        sessionStorage.setItem('kostku_read_notifs', JSON.stringify(updated));
      } catch (_) {}
    }
    setIsOpen(false);
    navigate(item.path);
  };

  // ── ROLE ACTIONS DATA ────────────────────────────────────────────────
  const roleMeta = useMemo(() => {
    if (role === 'owner' || role === 'master') {
      return {
        label: 'Aksi Juragan',
        roleBadge: '👑 Owner'
      };
    }
    if (role === 'mitra' || role === 'bisnis' || role === 'merchant') {
      return {
        label: 'Aksi Toko & Kasir',
        roleBadge: '🏪 Mitra UMKM'
      };
    }
    if (role === 'staff' || role === 'karyawan' || role === 'pegawai') {
      return {
        label: 'Aksi Staf Lapangan',
        roleBadge: '👔 Pegawai'
      };
    }
    return {
      label: 'Aksi Cepat Penghuni',
      roleBadge: '🔍 Pencari Kost'
    };
  }, [role]);

  const quickActions = useMemo(() => {
    if (role === 'owner' || role === 'master') {
      return [
        {
          id: 'owner-add-tenant',
          label: 'Tambah Penghuni Baru',
          desc: 'Input data sewa & terbitkan kamar',
          icon: <UserPlus size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            if (location.pathname === '/dashboard') {
              window.dispatchEvent(new CustomEvent('kostku:open-penghuni-modal'));
            } else {
              navigate('/dashboard');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('kostku:open-penghuni-modal'));
              }, 300);
            }
          }
        },
        {
          id: 'owner-staff-mode',
          label: 'Tugas & Meteran Staf',
          desc: 'Ambil alih catat meteran, paket & kamar',
          icon: <Wrench size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/dashboard?view=staff');
          }
        },
        {
          id: 'owner-remind-bill',
          label: 'Tagih Sewa Penghuni',
          desc: 'Kirim invoice & pesan WA otomatis',
          icon: <Send size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/keuangan');
          }
        },
        {
          id: 'owner-add-kost',
          label: 'Tambah Properti Kost',
          desc: 'Daftarkan cabang gedung baru',
          icon: <Building size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('kostku:open-add-kost'));
          }
        },
        {
          id: 'owner-cs',
          label: 'Bantuan CS & Panduan',
          desc: 'Pusat bantuan & FAQ operasional',
          icon: <MessageCircle size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            setIsCsModalOpen(true);
          }
        }
      ];
    }

    if (role === 'mitra' || role === 'bisnis' || role === 'merchant') {
      return [
        {
          id: 'mitra-pos',
          label: 'Terminal Kasir POS',
          desc: 'Layani transaksi pelanggan walk-in',
          icon: <Receipt size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/kasir');
          }
        },
        {
          id: 'mitra-add-menu',
          label: 'Kelola Menu & Stok',
          desc: 'Buka tutup ketersediaan menu toko',
          icon: <Store size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/mitra');
          }
        },
        {
          id: 'mitra-tables',
          label: 'Manajemen Meja & QR',
          desc: 'Pantau pesanan meja tamu dine-in',
          icon: <QrCode size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/order');
          }
        },
        {
          id: 'mitra-cs',
          label: 'Bantuan CS Mitra',
          desc: 'Hubungi dukungan merchant',
          icon: <MessageCircle size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            setIsCsModalOpen(true);
          }
        }
      ];
    }

    if (role === 'staff' || role === 'karyawan' || role === 'pegawai') {
      return [
        {
          id: 'staff-meteran',
          label: 'Catat Meteran Kamar',
          desc: 'Input angka kWh PLN & air PDAM',
          icon: <Zap size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/dashboard');
            setTimeout(() => {
              const el = document.getElementById('meteran-section') || document.querySelector('[data-section="meteran"]');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 200);
          }
        },
        {
          id: 'staff-parcel',
          label: 'Terima Paket Kurir',
          desc: 'Input paket & generate OTP pickup',
          icon: <Package size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/dashboard');
          }
        },
        {
          id: 'staff-complaint',
          label: 'Tiket Perbaikan Kamar',
          desc: 'Perbarui status komplain fasilitas',
          icon: <AlertCircle size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            navigate('/komplain');
          }
        },
        {
          id: 'staff-cs',
          label: 'Hubungi Juragan / CS',
          desc: 'Konsultasi masalah operasional',
          icon: <MessageCircle size={18} strokeWidth={2.2} />,
          onClick: () => {
            setIsOpen(false);
            setIsCsModalOpen(true);
          }
        }
      ];
    }

    // Default: Pencari Kost / Anak Kost
    return [
      {
        id: 'user-pay',
        label: 'Bayar Sewa (QRIS)',
        desc: 'Konfirmasi instan tanpa verifikasi manual',
        icon: <CreditCard size={18} strokeWidth={2.2} />,
        onClick: () => {
          setIsOpen(false);
          navigate('/dashboard');
        }
      },
      {
        id: 'user-report',
        label: 'Lapor Kerusakan Kamar',
        desc: 'Ajukan tiket perbaikan ke staf kost',
        icon: <AlertCircle size={18} strokeWidth={2.2} />,
        onClick: () => {
          setIsOpen(false);
          navigate('/komplain');
        }
      },
      {
        id: 'user-order-food',
        label: 'Pesan Makanan & Laundry',
        desc: 'Mitra UMKM sekitar diantar ke kamar',
        icon: <Store size={18} strokeWidth={2.2} />,
        onClick: () => {
          setIsOpen(false);
          navigate('/layanan');
        }
      },
      {
        id: 'user-cs',
        label: 'Bantuan CS 24 Jam',
        desc: 'Solusi seputar fasilitas & sewa',
        icon: <MessageCircle size={18} strokeWidth={2.2} />,
        onClick: () => {
          setIsOpen(false);
          setIsCsModalOpen(true);
        }
      }
    ];
  }, [role, location.pathname, navigate]);

  if (shouldHideFab) {
    return null;
  }

  return (
    <>
      {/* Minimalist Frosted Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9980,
            animation: 'quickFadeIn 0.18s ease forwards'
          }}
        />
      )}

      {/* Floating Action Container */}
      <div
        className="fab-fan-container"
        style={{
          position: 'fixed',
          bottom: 'calc(5.2rem + env(safe-area-inset-bottom, 0px))',
          right: 'clamp(0.85rem, 3vw, 1.85rem)',
          zIndex: 9990,
          pointerEvents: 'none'
        }}
      >
        <div style={{ position: 'relative', width: '50px', height: '50px', pointerEvents: 'auto' }}>
          
          {/* ── MINIMALIST FLOATING COMMAND CARD ─────────────────────── */}
          {isOpen && (
            <div
              className="quick-action-card"
              style={{
                position: 'absolute',
                bottom: '62px',
                right: 0,
                width: 'clamp(290px, 86vw, 330px)',
                background: isLight 
                  ? 'rgba(255, 255, 255, 0.96)' 
                  : 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderRadius: '20px',
                border: isLight 
                  ? '1px solid rgba(15, 23, 42, 0.08)' 
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isLight
                  ? '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)'
                  : '0 24px 60px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 9992,
                animation: 'quickScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                transformOrigin: 'bottom right'
              }}
            >
              {/* Minimalist Top Header with Segmented Tabs */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {/* Segmented Control */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.06)',
                  padding: '3px',
                  borderRadius: '11px',
                  gap: '2px'
                }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('actions')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'actions' 
                        ? (isLight ? '#ffffff' : '#1e293b') 
                        : 'transparent',
                      color: activeTab === 'actions'
                        ? (isLight ? '#0f172a' : '#ffffff')
                        : (isLight ? '#64748b' : '#94a3b8'),
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: activeTab === 'actions' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    <Zap size={13} strokeWidth={2.4} />
                    <span>Aksi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'notifications' 
                        ? (isLight ? '#ffffff' : '#1e293b') 
                        : 'transparent',
                      color: activeTab === 'notifications'
                        ? (isLight ? '#0f172a' : '#ffffff')
                        : (isLight ? '#64748b' : '#94a3b8'),
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: activeTab === 'notifications' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    <Bell size={13} strokeWidth={2.4} />
                    <span>Notif</span>
                    {unreadCount > 0 && (
                      <span style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '999px',
                        lineHeight: 1
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Role Label & Close Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: isLight ? '#64748b' : '#94a3b8',
                    letterSpacing: '-0.01em'
                  }}>
                    {roleMeta.roleBadge}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: 'none',
                      background: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)',
                      color: isLight ? '#64748b' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    title="Tutup menu"
                  >
                    <X size={13} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              {/* ── TAB 1: QUICK ACTIONS LIST (MINIMALIST) ─────────── */}
              {activeTab === 'actions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  
                  {/* Subtle Unread Notification Teaser Bar if unread exists */}
                  {unreadCount > 0 && (
                    <div
                      onClick={() => setActiveTab('notifications')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '10px',
                        background: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.14)',
                        border: '1px solid rgba(239, 68, 68, 0.22)',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          display: 'inline-block'
                        }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f87171' }}>
                          {unreadCount} Notifikasi Penting
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: isLight ? '#dc2626' : '#fca5a5', fontWeight: 600 }}>
                        Buka →
                      </span>
                    </div>
                  )}

                  {quickActions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        transition: 'background 0.15s ease, transform 0.15s ease',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '9px',
                          background: isLight ? '#f1f5f9' : '#1e293b',
                          border: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isLight ? '#1e293b' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2 }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={14} color={isLight ? '#94a3b8' : '#64748b'} />
                    </button>
                  ))}
                </div>
              )}

              {/* ── TAB 2: NOTIFICATIONS FEED (MINIMALIST) ─────────── */}
              {activeTab === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 4px 6px'
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8' }}>
                      Pemberitahuan Terbaru
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#2563eb',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px 10px',
                      color: isLight ? '#64748b' : '#94a3b8',
                      fontSize: '0.8rem'
                    }}>
                      <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 6px' }} />
                      <div>Semua beres! Tidak ada notifikasi baru.</div>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const isUnread = !readNotifIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '12px',
                            background: isUnread 
                              ? (isLight ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.1)')
                              : 'transparent',
                            border: isUnread 
                              ? '1px solid rgba(37, 99, 235, 0.15)' 
                              : (isLight ? '1px solid rgba(15, 23, 42, 0.04)' : '1px solid rgba(255, 255, 255, 0.05)'),
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isUnread 
                              ? (isLight ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.1)')
                              : 'transparent';
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isLight ? '#f1f5f9' : '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isUnread ? '#3b82f6' : '#94a3b8',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            <Bell size={14} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px'
                            }}>
                              <span style={{
                                fontSize: '0.78rem',
                                fontWeight: isUnread ? 800 : 600,
                                color: isLight ? '#0f172a' : '#f8fafc',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {item.title}
                              </span>
                              <span style={{ fontSize: '0.64rem', color: '#94a3b8', flexShrink: 0 }}>
                                {item.time}
                              </span>
                            </div>
                            <p style={{
                              margin: '2px 0 0 0',
                              fontSize: '0.72rem',
                              color: isLight ? '#64748b' : '#94a3b8',
                              lineHeight: 1.3
                            }}>
                              {item.desc}
                            </p>
                          </div>

                          {isUnread && (
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              alignSelf: 'center',
                              flexShrink: 0
                            }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── MINIMALIST CIRCULAR FLOATING TRIGGER ───────────────── */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Tutup Menu Aksi' : `Menu Aksi Cepat (${unreadCount} notifikasi)`}
            style={{
              position: 'relative',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: isOpen
                ? (isLight ? '#0f172a' : '#ffffff')
                : (isLight ? '#0f172a' : '#1e293b'),
              border: isLight ? '1.5px solid rgba(15, 23, 42, 0.1)' : '1.5px solid rgba(255, 255, 255, 0.18)',
              boxShadow: isLight
                ? '0 10px 24px rgba(15, 23, 42, 0.22), 0 2px 6px rgba(15, 23, 42, 0.1)'
                : '0 12px 28px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOpen
                ? (isLight ? '#ffffff' : '#0f172a')
                : '#ffffff',
              transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 9995,
              outline: 'none',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Minimalist 2D Spring Rotate Icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)',
                transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <Plus size={22} strokeWidth={2.4} />
            </div>

            {/* Notification Badge Counter on Trigger */}
            {!isOpen && unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isLight ? '2px solid #ffffff' : '2px solid #0f172a',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.45)',
                  lineHeight: 1
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Customer Service & FAQ Modal */}
      <CustomerServiceModal isOpen={isCsModalOpen} onClose={() => setIsCsModalOpen(false)} />

      {/* Pure 2D Smooth Keyframe Animations */}
      <style>{`
        @keyframes quickFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes quickScaleUp {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (min-width: 901px) {
          .fab-fan-container {
            bottom: 24px !important;
            right: 28px !important;
          }
        }
      `}</style>
    </>
  );
}
