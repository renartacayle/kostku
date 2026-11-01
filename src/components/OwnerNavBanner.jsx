import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  SlidersHorizontal,
  DollarSign,
  UserPlus,
  AlertCircle,
  Users,
  UserCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiGetSettings, apiGetUsers, apiGetComplaints } from '../services/api';
import GuestRegistrationModal from './GuestRegistrationModal';

export default function OwnerNavBanner({
  user,
  activeNav: propActiveNav,
  onTabChange,
  totalUnits: propTotalUnits,
  occupancyRate: propOccupancyRate,
  activeComplaints: propActiveComplaints,
  onRefresh,
  loading = false
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLight } = useTheme();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [stats, setStats] = useState({
    totalUnits: propTotalUnits ?? 0,
    occupancyRate: propOccupancyRate ?? 0,
    activeComplaints: propActiveComplaints ?? 0
  });

  const targetKostUid = user?.kostUid || localStorage.getItem('kostUid') || '';

  // Determine active nav key
  let currentNav = propActiveNav;
  if (!currentNav) {
    if (location.pathname === '/dashboard') {
      const tab = searchParams.get('tab');
      if (tab === 'komunitas') currentNav = 'mading';
      else if (tab === 'pengaturan') currentNav = 'pengaturan';
      else currentNav = 'overview';
    } else if (location.pathname === '/keuangan') {
      currentNav = 'keuangan';
    } else if (location.pathname === '/penghuni') {
      currentNav = 'penghuni';
    } else if (location.pathname === '/komplain') {
      currentNav = 'komplain';
    } else if (location.pathname === '/karyawan') {
      currentNav = 'karyawan';
    } else {
      currentNav = 'overview';
    }
  }

  // Fetch missing stats if not passed via props
  useEffect(() => {
    if (propTotalUnits !== undefined && propOccupancyRate !== undefined) {
      setStats({
        totalUnits: propTotalUnits,
        occupancyRate: propOccupancyRate,
        activeComplaints: propActiveComplaints ?? 0
      });
      return;
    }

    if (!targetKostUid) return;

    let isMounted = true;
    Promise.all([
      apiGetSettings(targetKostUid).catch(() => ({ rooms: [] })),
      apiGetUsers(targetKostUid).catch(() => []),
      apiGetComplaints(targetKostUid).catch(() => [])
    ]).then(([sets, usrs, comps]) => {
      if (!isMounted) return;
      const rooms = sets?.rooms || [];
      const tenants = Array.isArray(usrs) ? usrs : [];
      const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 1), 0);
      const rate = totalCapacity > 0 ? Math.round((tenants.length / totalCapacity) * 100) : 0;
      const activeC = Array.isArray(comps) ? comps.filter(c => c.status !== 'selesai').length : 0;

      setStats({
        totalUnits: rooms.length,
        occupancyRate: rate,
        activeComplaints: activeC
      });
    });

    return () => {
      isMounted = false;
    };
  }, [targetKostUid, propTotalUnits, propOccupancyRate, propActiveComplaints]);

  // Dynamic titles
  const titles = {
    overview: 'My Kost (Ringkasan)',
    mading: 'Mading & Komunitas Kost',
    pengaturan: 'Pengaturan Unit Kost',
    keuangan: 'Keuangan & Laporan Kost',
    penghuni: 'Data & Kelola Penghuni',
    komplain: 'Pusat Keluhan & Komplain',
    karyawan: 'Pengaturan Karyawan & Staf'
  };

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <div 
        className="owner-nav-banner glass-panel"
        style={{
          background: isLight ? 'var(--card-bg)' : 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid var(--border-color)',
          boxShadow: isLight ? 'var(--shadow-sm)' : '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        {/* Header Title + Stats + Refresh */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>
                {titles[currentNav] || 'My Kost (Overview)'}
              </h1>
              <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                <Sparkles size={11} /> Live Sync
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Kode: <strong style={{ color: 'var(--text-primary)' }}>{targetKostUid || '-'}</strong>
              {stats.totalUnits > 0 && <> • {stats.totalUnits} Unit</>}
              {stats.occupancyRate !== undefined && (
                <> • Okupansi: <strong style={{ color: 'var(--accent-success)' }}>{stats.occupancyRate}%</strong></>
              )}
            </p>
          </div>

          <button
            onClick={handleRefreshClick}
            className="btn btn-secondary btn-sm"
            title="Muat ulang data"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Shopee-style Unified Menu Grid (8 Icons - Zero Duplication) */}
        <div className="shopee-menu-grid" style={{
          marginTop: '1rem',
          paddingTop: '0.85rem',
          borderTop: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* 1. Ringkasan */}
          {location.pathname === '/dashboard' && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange('overview')}
              style={getItemBtnStyle()}
            >
              <div style={getIconBoxStyle(currentNav === 'overview', '#2563eb', '#1d4ed8', '#eff6ff', isLight)}>
                <LayoutDashboard size={20} strokeWidth={currentNav === 'overview' ? 2.5 : 2} />
              </div>
              <span style={getLabelStyle(currentNav === 'overview', '#2563eb', isLight)}>Ringkasan</span>
              {currentNav === 'overview' && <span style={getActiveDotStyle('#2563eb')} />}
            </button>
          ) : (
            <Link to="/dashboard" style={getItemLinkStyle()}>
              <div style={getIconBoxStyle(currentNav === 'overview', '#2563eb', '#1d4ed8', '#eff6ff', isLight)}>
                <LayoutDashboard size={20} strokeWidth={currentNav === 'overview' ? 2.5 : 2} />
              </div>
              <span style={getLabelStyle(currentNav === 'overview', '#2563eb', isLight)}>Ringkasan</span>
              {currentNav === 'overview' && <span style={getActiveDotStyle('#2563eb')} />}
            </Link>
          )}

          {/* 2. Mading */}
          {location.pathname === '/dashboard' && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange('komunitas')}
              style={getItemBtnStyle()}
            >
              <div style={getIconBoxStyle(currentNav === 'mading', '#0284c7', '#0369a1', '#f0f9ff', isLight)}>
                <Megaphone size={20} strokeWidth={currentNav === 'mading' ? 2.5 : 2} />
              </div>
              <span style={getLabelStyle(currentNav === 'mading', '#0284c7', isLight)}>Mading</span>
              {currentNav === 'mading' && <span style={getActiveDotStyle('#0284c7')} />}
            </button>
          ) : (
            <Link to="/dashboard?tab=komunitas" style={getItemLinkStyle()}>
              <div style={getIconBoxStyle(currentNav === 'mading', '#0284c7', '#0369a1', '#f0f9ff', isLight)}>
                <Megaphone size={20} strokeWidth={currentNav === 'mading' ? 2.5 : 2} />
              </div>
              <span style={getLabelStyle(currentNav === 'mading', '#0284c7', isLight)}>Mading</span>
              {currentNav === 'mading' && <span style={getActiveDotStyle('#0284c7')} />}
            </Link>
          )}

          {/* 3. Atur Unit */}
          {location.pathname === '/dashboard' && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange('pengaturan')}
              style={getItemBtnStyle()}
            >
              <div style={getIconBoxStyle(currentNav === 'pengaturan', '#4f46e5', '#4338ca', '#eef2ff', isLight)}>
                <SlidersHorizontal size={20} strokeWidth={currentNav === 'pengaturan' ? 2.5 : 2} />
              </div>
              <span style={getLabelStyle(currentNav === 'pengaturan', '#4f46e5', isLight)}>Atur Unit</span>
              {currentNav === 'pengaturan' && <span style={getActiveDotStyle('#4f46e5')} />}
            </button>
          ) : (
            <Link to="/dashboard?tab=pengaturan" style={getItemLinkStyle()}>
              <div style={getIconBoxStyle(currentNav === 'pengaturan', '#4f46e5', '#4338ca', '#eef2ff', isLight)}>
                <SlidersHorizontal size={20} strokeWidth={currentNav === 'pengaturan' ? 2.5 : 2} />
              </div>
              <span style={getLabelStyle(currentNav === 'pengaturan', '#4f46e5', isLight)}>Atur Unit</span>
              {currentNav === 'pengaturan' && <span style={getActiveDotStyle('#4f46e5')} />}
            </Link>
          )}

          {/* 4. Keuangan */}
          <Link to="/keuangan" style={getItemLinkStyle()}>
            <div style={getIconBoxStyle(currentNav === 'keuangan', '#10b981', '#059669', '#f0fdf4', isLight)}>
              <DollarSign size={20} strokeWidth={2.2} />
            </div>
            <span style={getLabelStyle(currentNav === 'keuangan', '#10b981', isLight)}>Keuangan</span>
            {currentNav === 'keuangan' && <span style={getActiveDotStyle('#10b981')} />}
          </Link>

          {/* 5. Penghuni */}
          <Link to="/penghuni" style={getItemLinkStyle()}>
            <div style={getIconBoxStyle(currentNav === 'penghuni', '#0d9488', '#0f766e', '#f0fdfa', isLight)}>
              <UserPlus size={20} strokeWidth={2.2} />
            </div>
            <span style={getLabelStyle(currentNav === 'penghuni', '#0d9488', isLight)}>Penghuni</span>
            {currentNav === 'penghuni' && <span style={getActiveDotStyle('#0d9488')} />}
          </Link>

          {/* 6. Komplain */}
          <Link to="/komplain" style={getItemLinkStyle()}>
            <div style={{
              ...getIconBoxStyle(currentNav === 'komplain', '#ef4444', '#dc2626', '#fef2f2', isLight),
              position: 'relative'
            }}>
              <AlertCircle size={20} strokeWidth={2.2} />
              {stats.activeComplaints > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  border: '1.5px solid var(--card-bg)',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}>
                  {stats.activeComplaints}
                </span>
              )}
            </div>
            <span style={getLabelStyle(currentNav === 'komplain', '#ef4444', isLight)}>Komplain</span>
            {currentNav === 'komplain' && <span style={getActiveDotStyle('#ef4444')} />}
          </Link>

          {/* 7. Buku Tamu (Modal Trigger) */}
          <button
            type="button"
            onClick={() => setShowGuestModal(true)}
            style={getItemBtnStyle()}
          >
            <div style={getIconBoxStyle(false, '#c026d3', '#a21caf', '#fdf4ff', isLight)}>
              <Users size={20} strokeWidth={2.2} />
            </div>
            <span style={getLabelStyle(false, '#c026d3', isLight)}>Buku Tamu</span>
          </button>

          {/* 8. Karyawan */}
          <Link to="/karyawan" style={getItemLinkStyle()}>
            <div style={getIconBoxStyle(currentNav === 'karyawan', '#8b5cf6', '#7c3aed', '#f5f3ff', isLight)}>
              <UserCheck size={20} strokeWidth={2.2} />
            </div>
            <span style={getLabelStyle(currentNav === 'karyawan', '#8b5cf6', isLight)}>Karyawan</span>
            {currentNav === 'karyawan' && <span style={getActiveDotStyle('#8b5cf6')} />}
          </Link>
        </div>
      </div>

      {/* Global Guest Modal accessible from any page */}
      <GuestRegistrationModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        user={user}
        kostUid={targetKostUid}
      />
    </>
  );
}

// Helper Styles
function getItemLinkStyle() {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    gap: '5px',
    padding: '6px 2px',
    borderRadius: '10px',
    transition: 'transform 0.15s ease',
    width: '100%',
    position: 'relative'
  };
}

function getItemBtnStyle() {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    gap: '5px',
    padding: '6px 2px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
    width: '100%',
    position: 'relative'
  };
}

function getIconBoxStyle(isActive, color, activeGradientEnd, lightBg, isLight) {
  if (isActive) {
    return {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${color}, ${activeGradientEnd})`,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 12px ${color}55`,
      border: '2px solid rgba(255, 255, 255, 0.6)',
      transition: 'all 0.2s ease'
    };
  }

  return {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: isLight ? lightBg : `${color}22`,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isLight ? `0 2px 6px ${color}1a` : 'none',
    border: isLight ? `1px solid ${color}33` : `1px solid ${color}33`,
    transition: 'all 0.2s ease'
  };
}

function getLabelStyle(isActive, activeColor, isLight) {
  return {
    fontSize: '0.72rem',
    fontWeight: isActive ? 800 : 600,
    color: isActive ? activeColor : (isLight ? '#1e293b' : '#f1f5f9'),
    textAlign: 'center',
    whiteSpace: 'nowrap'
  };
}

function getActiveDotStyle(color) {
  return {
    position: 'absolute',
    bottom: '0px',
    width: '14px',
    height: '3px',
    borderRadius: '2px',
    background: color
  };
}
