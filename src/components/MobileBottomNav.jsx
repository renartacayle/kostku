import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Building, Settings, User } from 'lucide-react';

export default function MobileBottomNav({ user }) {
  const location = useLocation();

  // If on login or register, hide bottom nav to keep authentication clean
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const isOwner = user?.role === 'owner' || user?.role === 'master';
  const isStaff = user?.role === 'staff';

  // 4 Primary Navigation Items requested by user:
  // 1. Halaman Utama (Home)
  // 2. Search Kost (Cari Kost)
  // 3. My Kost List (Owner) / Kost Saya (Tenant/Guest) / Tugas Staf (Staff)
  // 4. User Setting + App Setting (Pengaturan)
  const navItems = [
    {
      id: 'home',
      path: '/',
      label: 'Utama',
      icon: <Home size={20} />,
      isActive: location.pathname === '/'
    },
    {
      id: 'search',
      path: '/search',
      label: 'Cari Kost',
      icon: <Search size={20} />,
      isActive: location.pathname === '/search' || location.pathname.startsWith('/kost/')
    },
    {
      id: 'kost',
      path: user ? '/dashboard' : '/login',
      label: isOwner ? 'My Kost' : isStaff ? 'Tugas Staf' : 'Kost Saya',
      icon: <Building size={20} />,
      badge: isOwner ? 'Owner' : isStaff ? 'Staf' : null,
      isActive: ['/dashboard', '/penghuni', '/keuangan', '/laporan', '/komplain'].includes(location.pathname)
    },
    {
      id: 'settings',
      path: user ? '/pengaturan' : '/login',
      label: 'Pengaturan',
      icon: user?.picture ? (
        <img 
          src={user.picture} 
          alt="Avatar" 
          style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
        />
      ) : (
        <Settings size={20} />
      ),
      isActive: location.pathname === '/pengaturan'
    }
  ];

  return (
    <nav className="mobile-only" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9000,
      background: 'rgba(10, 15, 29, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      paddingTop: '6px',
      boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.6)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '0 8px'
      }}>
        {navItems.map((item) => {
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '6px 14px',
                borderRadius: '16px',
                textDecoration: 'none',
                color: active ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                minWidth: '64px',
                background: active ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                border: active ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent'
              }}
            >
              {/* Icon Container with active indicator dot */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: active ? 'scale(1.12)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                color: active ? '#60a5fa' : '#94a3b8'
              }}>
                {item.icon}

                {/* Role badge if applicable */}
                {item.badge && !active && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}>
                    {item.badge}
                  </span>
                )}

                {/* Glow Dot for Active Tab */}
                {active && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    boxShadow: '0 0 8px #3b82f6'
                  }} />
                )}
              </div>

              {/* Text Label */}
              <span style={{
                fontSize: '0.68rem',
                fontWeight: active ? 700 : 500,
                color: active ? '#ffffff' : '#94a3b8',
                letterSpacing: '-0.01em',
                marginTop: '1px'
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
