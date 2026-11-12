import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Settings, 
  LogOut, 
  Home, 
  Download,
  AlertCircle,
  Search,
  User as UserIcon,
  UserCheck,
  Store,
  Sun,
  Moon,
  Sparkles,
  Wrench
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ user, onLogout, onOpenInstall, onOpenCloudSync }) {
  const location = useLocation();
  const { theme, toggleTheme, isLight } = useTheme();
  const isDemoSession = Boolean(user?.isDemo || user?.email?.endsWith('@kostku.id'));

  const getRoleSpecificMenus = (role) => {
    if (role === 'owner' || role === 'master') {
      return [
        { path: '/dashboard', name: 'Kamar & Overview', icon: <LayoutDashboard size={20} /> },
        { path: '/dashboard?view=staff', name: '🛠️ Tugas & Meteran Staf', icon: <Wrench size={20} /> },
        { path: '/penghuni', name: 'Data Penghuni', icon: <Users size={20} /> },
        { path: '/keuangan', name: 'Keuangan & Laporan', icon: <DollarSign size={20} /> },
        { path: '/kasir', name: 'Terminal Kasir POS', icon: <Store size={20} /> },
        { path: '/karyawan', name: 'Karyawan & Staf', icon: <UserCheck size={20} /> },
        { path: '/mitra', name: 'Mitra UMKM Sekitar', icon: <Store size={20} /> },
        { path: '/komplain', name: 'Komplain Penghuni', icon: <AlertCircle size={20} /> }
      ];
    }
    if (role === 'mitra') {
      return [
        { path: '/mitra', name: 'Katalog & Menu Toko', icon: <Store size={20} /> },
        { path: '/kasir', name: 'Terminal Kasir POS', icon: <Store size={20} /> },
        { path: '/order', name: 'Pesanan Meja QR', icon: <LayoutDashboard size={20} /> },
        { path: '/keuangan', name: 'Omset & Settlement', icon: <DollarSign size={20} /> }
      ];
    }
    if (role === 'staff') {
      return [
        { path: '/dashboard', name: 'Tugas & Meteran', icon: <LayoutDashboard size={20} /> },
        { path: '/komplain', name: 'Komplain Lapangan', icon: <AlertCircle size={20} /> },
        { path: '/penghuni', name: 'Data Penghuni', icon: <Users size={20} /> }
      ];
    }
    // Default: Pencari Kost / Penghuni
    return [
      { path: '/', name: 'Halaman Utama', icon: <Home size={20} /> },
      { path: '/search', name: 'Cari & Filter Kost', icon: <Search size={20} /> },
      { path: '/layanan', name: 'Toko & Mitra Sekitar', icon: <Store size={20} /> },
      { path: '/dashboard', name: 'Kost Saya / Sewa', icon: <LayoutDashboard size={20} /> },
      { path: '/komplain', name: 'Komplain & Bantuan', icon: <AlertCircle size={20} /> }
    ];
  };

  const allowedMenus = getRoleSpecificMenus(user?.role);

  return (
    <aside style={{
      width: '270px',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border-color)',
      padding: '1.75rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem', paddingLeft: '0.5rem', textDecoration: 'none' }}>
        <img 
          src="/logo.png" 
          alt="Logo KostKu" 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            objectFit: 'contain',
            boxShadow: 'var(--shadow-glow)'
          }} 
        />
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.35rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            KostKu
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            Pro Edition v2.0
          </span>
        </div>
      </Link>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {allowedMenus.map((item) => {
          const isStaffView = item.path === '/dashboard?view=staff';
          const isActive = isStaffView
            ? location.pathname === '/dashboard' && location.search.includes('view=staff')
            : (item.path === '/dashboard'
                ? location.pathname === '/dashboard' && !location.search.includes('view=staff')
                : (location.pathname === item.path || (item.path === '/karyawan' && (location.pathname === '/karyawan' || (location.pathname === '/pengaturan' && location.search.includes('tab=karyawan'))))));
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive 
                  ? 'rgba(37, 99, 235, 0.16)' 
                  : 'transparent',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.92rem'
              }}
            >
              <span style={{
                color: isActive ? 'var(--accent-primary)' : 'inherit',
                display: 'flex',
                transition: 'transform 0.2s'
              }}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Environment Mode Status Pill (Only visible in Demo Sandbox) */}
      {isDemoSession && (
        <div style={{
          marginBottom: '12px',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 6px #f59e0b'
            }} />
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#f59e0b'
            }}>
              Sandbox Demo
            </span>
          </div>
          <Link
            to="/login"
            title="Masuk ke Akun Real"
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              textDecoration: 'none'
            }}
          >
            Ke Real ↗
          </Link>
        </div>
      )}

      {/* User Card, Setting & Logout (Bawah Kiri) */}
      <div style={{
        marginTop: 'auto',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '0.85rem 1rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
      }}>
        {/* User Info & PFP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name || 'User'}
              referrerPolicy="no-referrer"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '1.5px solid rgba(59, 130, 246, 0.6)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'white',
              fontSize: '0.95rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              flexShrink: 0
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
            </div>
          )}
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'Pengguna'}
            </p>
            <span style={{ fontSize: '0.72rem', color: user?.role === 'staff' ? '#34d399' : user?.role === 'mitra' ? '#f59e0b' : user?.role === 'user' ? '#60a5fa' : 'var(--text-secondary)', fontWeight: 600 }}>
              {user?.role === 'staff' ? `Staf (${user?.jobTitle || 'Penjaga'})` : user?.role === 'mitra' ? 'Mitra UMKM Sekitar' : user?.role === 'user' ? `Penghuni (Kamar ${user?.kamar || '122'})` : user?.role === 'owner' ? 'Pemilik Kost' : 'Akun Pengguna'}
            </span>
          </div>
        </div>

        {/* Theme Switcher in Sidebar */}
        <button
          onClick={toggleTheme}
          type="button"
          data-testid="sidebar-theme-toggle"
          title={isLight ? "Beralih ke Mode Gelap" : "Beralih ke Mode Terang"}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '10px',
            marginBottom: '8px',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLight ? <Sun size={15} color="#d97706" /> : <Moon size={15} color="#60a5fa" />}
            <span>{isLight ? 'Mode Terang' : 'Mode Gelap'}</span>
          </div>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 7px',
            borderRadius: '6px',
            background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
            color: 'var(--text-secondary)',
            fontWeight: 800
          }}>
            {isLight ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* Setting User & Keluar Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Link
            to="/pengaturan"
            className="btn btn-secondary btn-sm"
            title="Buka Pengaturan Akun & Profil"
            style={{
              padding: '7px 8px',
              borderRadius: '10px',
              gap: '5px',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
          >
            <Settings size={14} color="#93c5fd" /> Setting
          </Link>

          <button
            onClick={onLogout}
            className="btn btn-danger btn-sm"
            title="Keluar dari Akun"
            style={{
              padding: '7px 8px',
              borderRadius: '10px',
              gap: '5px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}
