import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  LogIn,
  Moon,
  Search,
  Sun,
  UserCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import UtilityServiceWorkspace from '../components/utilities/UtilityServiceWorkspace';

export default function Utilitas({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLight, toggleTheme } = useTheme();

  const routeTargetUser = location.state?.targetUser || null;
  const returnTo = location.state?.returnTo || null;
  const [useSelfProfile, setUseSelfProfile] = useState(false);

  const paramRoom = searchParams.get('room') || '';
  const paramMeter = searchParams.get('meter') || '';
  const paramPdamNo = searchParams.get('pdamNo') || '';
  const paramName = searchParams.get('name') || '';

  const activeTab = searchParams.get('tab') === 'pdam' ? 'pdam' : 'pln';

  const effectiveUser = useMemo(() => {
    if (!useSelfProfile && routeTargetUser) {
      return routeTargetUser;
    }
    if (!useSelfProfile && (paramName || paramRoom)) {
      return {
        ...(user || {}),
        name: paramName || user?.name || 'Penghuni Kost',
        kamar: paramRoom || user?.kamar || '101'
      };
    }
    return user || null;
  }, [useSelfProfile, routeTargetUser, paramName, paramRoom, user]);

  const effectiveRoom = (!useSelfProfile && (routeTargetUser?.kamar || paramRoom))
    ? (routeTargetUser?.kamar || paramRoom)
    : (user?.kamar || '101');

  const handleSelectTab = (nextTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleGoBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const handleResetToSelf = () => {
    setUseSelfProfile(true);
    const nextParams = new URLSearchParams();
    nextParams.set('tab', activeTab);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)'
    }}>
      {/* Top Sticky Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.8rem clamp(0.85rem, 3vw, 1.5rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <button
            type="button"
            data-testid="utilitas-back-btn"
            onClick={handleGoBack}
            className="btn btn-secondary btn-sm"
            style={{ gap: '5px', padding: '5px 9px', flexShrink: 0 }}
          >
            <ArrowLeft size={14} />
            <span>Kembali</span>
          </button>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              textDecoration: 'none',
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            <img
              src="/logo.png"
              alt="Logo KostKu"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <span style={{
              fontSize: 'clamp(0.95rem, 3.2vw, 1.1rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              KostKu
            </span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleTheme}
            data-testid="utilitas-theme-toggle"
            className="btn btn-secondary btn-sm"
            title={isLight ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang'}
            style={{ padding: '6px 10px', gap: '6px' }}
          >
            {isLight ? <Moon size={14} color="#f59e0b" /> : <Sun size={14} color="#f59e0b" />}
            <span className="desktop-only" style={{ fontSize: '0.8rem' }}>
              {isLight ? 'Gelap' : 'Terang'}
            </span>
          </button>

          <Link
            to="/search"
            className="btn btn-secondary btn-sm desktop-only"
            style={{ gap: '6px', textDecoration: 'none' }}
          >
            <Search size={14} color="#60a5fa" />
            <span>Cari Kost</span>
          </Link>

          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ gap: '6px', textDecoration: 'none' }}>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ gap: '6px', textDecoration: 'none' }}>
              <LogIn size={14} />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '1120px',
        margin: '0 auto',
        padding: 'clamp(1.25rem, 3vw, 2rem) clamp(0.9rem, 3vw, 1.5rem) 2.5rem',
        boxSizing: 'border-box'
      }}>
        {/* Compact Page Header */}
        <div style={{ marginBottom: '1.35rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 11px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.16)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                border: isLight ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(59, 130, 246, 0.3)',
                marginBottom: '8px'
              }}>
                Utilitas &amp; Tagihan PPOB Resmi
              </span>
              <h1 style={{
                margin: '0 0 6px',
                fontSize: 'clamp(1.35rem, 3vw, 1.9rem)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}>
                Token Listrik PLN &amp; Air PDAM
              </h1>
              <p style={{
                margin: 0,
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                maxWidth: '640px',
                lineHeight: 1.5
              }}>
                Beli token listrik prabayar 24 jam atau cek &amp; bayar tagihan air PDAM 30+ kota dalam satu halaman via QRIS Realtime.
              </p>
            </div>
          </div>

          {!useSelfProfile && (routeTargetUser || paramRoom) && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.14)',
              border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.32)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#1e40af' : '#bfdbfe', fontWeight: 700 }}>
                <UserCheck size={16} />
                <span>
                  Target Kamar {effectiveRoom}
                  {effectiveUser?.name ? ` • ${effectiveUser.name}` : ''}
                </span>
              </div>
              {user && (
                <button
                  type="button"
                  onClick={handleResetToSelf}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLight ? '#2563eb' : '#60a5fa',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Pakai data akun saya
                </button>
              )}
            </div>
          )}
        </div>

        {/* Shared Segmented Switcher & Active Utility Panel */}
        <UtilityServiceWorkspace
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          user={effectiveUser}
          roomNumber={effectiveRoom}
          initialMeterNumber={paramMeter}
          initialCustomerNumber={paramPdamNo}
        />
      </main>

      <Footer />
    </div>
  );
}
