import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  PieChart, 
  Settings, 
  LogOut, 
  Home, 
  Cloud, 
  Download,
  AlertCircle,
  Search,
  Building2
} from 'lucide-react';

export default function Sidebar({ user, onLogout, onOpenInstall, onOpenCloudSync, onOpenPortfolio }) {
  const location = useLocation();

  const menuItems = [
    { path: '/', name: 'Halaman Utama', icon: <Home size={20} />, roles: ['owner', 'master', 'user', 'staff'] },
    { path: '/search', name: 'Cari Kost', icon: <Search size={20} />, roles: ['owner', 'master', 'user', 'staff'] },
    { path: '/dashboard', name: user?.role === 'staff' ? 'Dashboard Staf' : user?.role === 'owner' ? 'My Kost (Overview)' : 'Kost Saya', icon: <LayoutDashboard size={20} />, roles: ['owner', 'master', 'user', 'staff'] },
    { path: '/penghuni', name: 'Data Penghuni', icon: <Users size={20} />, roles: ['owner', 'master', 'staff'] },
    { path: '/komplain', name: 'Komplain Penghuni', icon: <AlertCircle size={20} />, roles: ['owner', 'master', 'staff'] },
    { path: '/keuangan', name: user?.role === 'staff' ? 'Pengeluaran Lapangan' : 'Keuangan', icon: <DollarSign size={20} />, roles: ['owner', 'master', 'staff'] },
    { path: '/laporan', name: 'Laporan', icon: <PieChart size={20} />, roles: ['owner', 'master'] },
    { path: '/pengaturan', name: user?.role === 'staff' ? 'Profil Staf' : 'Pengaturan', icon: <Settings size={20} />, roles: ['owner', 'master', 'user', 'staff'] },
  ];

  const allowedMenus = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside style={{
      width: '270px',
      background: 'rgba(15, 23, 42, 0.95)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
        <div style={{
          background: 'var(--accent-gradient)',
          padding: '10px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Home size={22} color="white" />
        </div>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.35rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
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
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {allowedMenus.map((item) => {
          const isActive = location.pathname === item.path;
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

        {(user?.role === 'owner' || user?.role === 'master') && onOpenPortfolio && (
          <button
            type="button"
            onClick={onOpenPortfolio}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              background: 'rgba(37, 99, 235, 0.12)',
              color: '#93c5fd',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.92rem',
              marginTop: '4px',
              textAlign: 'left',
              transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)'
            }}
          >
            <Building2 size={20} color="#60a5fa" />
            <span>Portofolio Kost</span>
          </button>
        )}
      </nav>

      {/* Cloud & Multi-Device Action Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Multi-Device Sync
          </span>
          <span className="status-dot online" />
        </div>
        <button
          onClick={onOpenCloudSync}
          style={{
            width: '100%',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#93c5fd',
            borderRadius: '10px',
            padding: '8px 10px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Cloud size={14} /> Atur Database Cloud
        </button>
      </div>

      {/* User Card & Logout */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '1rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '0.95rem'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name}
            </p>
            <span style={{ fontSize: '0.75rem', color: user?.role === 'staff' ? '#34d399' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {user?.role === 'staff' ? `Staf (${user?.jobTitle || 'Penjaga'})` : `${user?.role} Account`}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-danger btn-sm"
          style={{ width: '100%', padding: '8px', borderRadius: '10px', gap: '6px' }}
        >
          <LogOut size={15} /> Keluar
        </button>
      </div>
    </aside>
  );
}
