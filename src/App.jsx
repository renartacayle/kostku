import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useLocation
} from 'react-router-dom';

// Automatically reset scroll position to top whenever route or search params change
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    } catch (_) {}
    // Reset any pending chunk retry flags on successful navigation
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('kostku_chunk_retry_')) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (_) {}
  }, [pathname, search]);
  return null;
}

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import InstallModal from './components/InstallModal';
import CloudSyncModal from './components/CloudSyncModal';
import AutoUpdateModal from './components/AutoUpdateModal';
import AddPropertyModal from './components/AddPropertyModal';
import ErrorBoundary from './components/ErrorBoundary';
import CustomerServiceFloatingButton from './components/CustomerServiceFloatingButton';
import RouteMetadataManager from './components/RouteMetadataManager';
import { apiSwitchOwnerKost } from './services/api';
import { lazyRetry, getAdaptiveBufferTimeout } from './utils/lazyRetry';

// Route-level code-splitting with resilient auto-retry across deployments
const Login = lazyRetry(() => import('./pages/Login'), 'Login');
const Register = lazyRetry(() => import('./pages/Register'), 'Register');
const Demo = lazyRetry(() => import('./pages/Demo'), 'Demo');
const Dashboard = lazyRetry(() => import('./pages/Dashboard'), 'Dashboard');
const Penghuni = lazyRetry(() => import('./pages/Penghuni'), 'Penghuni');
const Pengaturan = lazyRetry(() => import('./pages/Pengaturan'), 'Pengaturan');
const Karyawan = lazyRetry(() => import('./pages/Karyawan'), 'Karyawan');
const Keuangan = lazyRetry(() => import('./pages/Keuangan'), 'Keuangan');
const Komplain = lazyRetry(() => import('./pages/Komplain'), 'Komplain');
const Home = lazyRetry(() => import('./pages/Home'), 'Home');
const SearchKost = lazyRetry(() => import('./pages/SearchKost'), 'SearchKost');
const KostDetail = lazyRetry(() => import('./pages/KostDetail'), 'KostDetail');
const Mitra = lazyRetry(() => import('./pages/Mitra'), 'Mitra');
const Layanan = lazyRetry(() => import('./pages/Layanan'), 'Layanan');
const KebijakanPrivasi = lazyRetry(() => import('./pages/KebijakanPrivasi'), 'KebijakanPrivasi');
const SyaratKetentuan = lazyRetry(() => import('./pages/SyaratKetentuan'), 'SyaratKetentuan');
const TentangKami = lazyRetry(() => import('./pages/TentangKami'), 'TentangKami');
const Checkout = lazyRetry(() => import('./pages/Checkout'), 'Checkout');
const StressTestReport = lazyRetry(() => import('./pages/StressTestReport'), 'StressTestReport');

// Lightweight, tactile loading indicator during route chunks hydration with adaptive buffer feedback
const PageLoadingFallback = () => {
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    const adaptiveBuffer = getAdaptiveBufferTimeout(0);
    const timer = setTimeout(() => {
      setSlowNotice(true);
    }, adaptiveBuffer);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-main, #f1f5f9)',
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
      color: 'var(--text-muted, #64748b)'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        border: '3px solid rgba(37, 99, 235, 0.2)',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px' }}>
        {slowNotice ? 'Koneksi lambat, mencoba muat ulang modul...' : 'Memuat modul KostKu...'}
      </span>
      {slowNotice && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: '8px',
            fontSize: '12px',
            padding: '6px 14px',
            borderRadius: '8px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, rgba(15, 23, 42, 0.15))',
            color: 'var(--accent-primary, #2563eb)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Muat Ulang Sekarang
        </button>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Main Layout Component for Responsive Mobile & Laptop
const MainLayout = ({ children, user, onLogout, onSwitchKost }) => {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showAddKostModal, setShowAddKostModal] = useState(false);
  const [kostName, setKostName] = useState(localStorage.getItem('kostName') || 'KostKu');

  useEffect(() => {
    const savedName = localStorage.getItem('kostName');
    if (savedName) setKostName(savedName);
  }, [user?.kostUid]);

  useEffect(() => {
    const handleSwitched = (e) => {
      if (e.detail?.kostName) {
        setKostName(e.detail.kostName);
      }
    };
    window.addEventListener('kostku_property_switched', handleSwitched);
    return () => window.removeEventListener('kostku_property_switched', handleSwitched);
  }, []);

  const handleKostAdded = (newKost) => {
    if (onSwitchKost && newKost) {
      onSwitchKost(newKost.uid, newKost.kostName);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Laptop & Desktop Sidebar */}
      <div className="desktop-only">
        <Sidebar 
          user={user} 
          onLogout={onLogout} 
          onOpenInstall={() => setShowInstallModal(true)}
          onOpenCloudSync={() => setShowCloudSyncModal(true)}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        overflowX: 'hidden'
      }}>
        {/* Top Navbar */}
        <Navbar 
          user={user} 
          kostName={kostName}
          onOpenInstall={() => setShowInstallModal(true)}
          onOpenCloudSync={() => setShowCloudSyncModal(true)}
          onSwitchKost={onSwitchKost}
          onOpenAddKost={() => setShowAddKostModal(true)}
        />

        {/* Page View Container */}
        <main style={{ 
          flex: 1, 
          padding: 'clamp(1rem, 3vw, 1.75rem) clamp(0.75rem, 3vw, 1.75rem) calc(6rem + env(safe-area-inset-bottom, 0px))',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }} className="safe-pb">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <InstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
      />
      <CloudSyncModal 
        isOpen={showCloudSyncModal} 
        onClose={() => setShowCloudSyncModal(false)} 
      />
      <AddPropertyModal
        isOpen={showAddKostModal}
        onClose={() => setShowAddKostModal(false)}
        user={user}
        onKostAdded={handleKostAdded}
      />
    </div>
  );
};

function App() {
  // Helper to ensure default role is 'user' (penghuni) unless explicitly demo pemilik/staff/mitra
  const normalizeDefaultRole = (u) => {
    if (!u) return null;
    const isExplicitOwner = Boolean(u.isDemo && u.role === 'owner') || (u.email && u.email.toLowerCase().includes('pemilik'));
    if (!isExplicitOwner && (u.role === 'owner' || !u.role)) {
      u.role = 'user';
      if (!u.kamar) u.kamar = '122';
    }
    return u;
  };

  // Synchronous initialization from localStorage to prevent redirect flashing on refresh or login
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kostUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const normalized = normalizeDefaultRole(parsed);
        if (JSON.stringify(normalized) !== savedUser) {
          localStorage.setItem('kostUser', JSON.stringify(normalized));
        }
        return normalized;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const getStoredUser = () => {
    try {
      const savedUser = localStorage.getItem('kostUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return normalizeDefaultRole(parsed);
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const activeUser = user || getStoredUser();

  // Listen for user profile updates across all pages (PFP, name, phone, etc.)
  useEffect(() => {
    const handleUserUpdated = (e) => {
      if (e.detail) {
        const normalized = normalizeDefaultRole(e.detail);
        setUser(normalized);
        localStorage.setItem('kostUser', JSON.stringify(normalized));
      }
    };
    window.addEventListener('kostku_user_updated', handleUserUpdated);
    return () => window.removeEventListener('kostku_user_updated', handleUserUpdated);
  }, []);

  const handleLogin = (userData, customKostName) => {
    const normalized = normalizeDefaultRole({ ...userData });
    localStorage.setItem('kostUser', JSON.stringify(normalized));
    setUser(normalized);
    if (customKostName) {
      localStorage.setItem('kostName', customKostName);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kostUser');
    localStorage.removeItem('kostName');
  };

  const handleSwitchKost = async (targetKostUid, targetKostName) => {
    if (!targetKostUid) return;

    const current = activeUser || {};
    const updatedUser = { ...current, kostUid: targetKostUid };

    // Update local storage immediately for responsive UX
    localStorage.setItem('kostUser', JSON.stringify(updatedUser));
    if (targetKostName) {
      localStorage.setItem('kostName', targetKostName);
    }
    setUser(updatedUser);

    // Broadcast property switch event across all open components
    window.dispatchEvent(new CustomEvent('kostku_property_switched', {
      detail: { kostUid: targetKostUid, kostName: targetKostName }
    }));

    // Synchronize active property with backend API
    try {
      if (current.id) {
        await apiSwitchOwnerKost(current.id, targetKostUid);
      }
    } catch (err) {
      console.warn('Backend sync for property switch fallback:', err);
    }
  };

  return (
    <Router>
      <ScrollToTop />
      <RouteMetadataManager />
      <AutoUpdateModal />
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public Landing & Marketplace */}
            <Route path="/" element={<Home user={activeUser} />} />
          <Route path="/search" element={<SearchKost user={activeUser} />} />
          <Route path="/cari-kost" element={<SearchKost user={activeUser} />} />
          <Route path="/cari" element={<Navigate to="/search" replace />} />
          <Route path="/kost/:id" element={<KostDetail user={activeUser} />} />
          
          {/* Checkout & On-Site Payment Flow (TriPay Verified Gateway) */}
          <Route path="/checkout" element={<Checkout user={activeUser} />} />
          <Route path="/bayar" element={<Navigate to="/checkout" replace />} />
          <Route path="/pembayaran" element={<Navigate to="/checkout" replace />} />
          
          {/* Static Compliance Pages (TriPay & Legal Bank Indonesia) */}
          <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />
          <Route path="/privacy-policy" element={<Navigate to="/kebijakan-privasi" replace />} />
          <Route path="/privacy" element={<Navigate to="/kebijakan-privasi" replace />} />
          
          <Route path="/syarat-ketentuan" element={<SyaratKetentuan />} />
          <Route path="/terms" element={<Navigate to="/syarat-ketentuan" replace />} />
          <Route path="/terms-and-conditions" element={<Navigate to="/syarat-ketentuan" replace />} />
          
          <Route path="/tentang-kami" element={<TentangKami />} />
          <Route path="/about" element={<Navigate to="/tentang-kami" replace />} />
          <Route path="/about-us" element={<Navigate to="/tentang-kami" replace />} />
          
          {/* Stress Test 500 Real Bedroom Photos & Auto-2D Benchmark Report */}
          <Route path="/stress-test-report" element={<StressTestReport />} />
          <Route path="/stress-test" element={<Navigate to="/stress-test-report" replace />} />
          <Route path="/denah-500" element={<Navigate to="/stress-test-report" replace />} />
          
          {/* Redirect legacy /blueprint routes */}
          <Route path="/blueprint" element={<Navigate to={activeUser ? "/dashboard" : "/"} replace />} />
          <Route path="/docs/blueprint" element={<Navigate to="/" replace />} />
          
          {/* Auth Pages (redirect to /dashboard if already logged in) */}
          <Route 
            path="/login" 
            element={activeUser ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={activeUser ? <Navigate to="/dashboard" replace /> : <Register onLogin={handleLogin} />} 
          />

          {/* Dedicated Demo Showcase & Interactive Sandbox (Separated from Real Login) */}
          <Route path="/demo" element={<Demo onLogin={handleLogin} />} />
          <Route path="/sandbox" element={<Navigate to="/demo" replace />} />
          <Route path="/demo-showcase" element={<Navigate to="/demo" replace />} />

          {/* Protected App Pages */}
          <Route 
            path="/dashboard" 
            element={activeUser ? (
              <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                <Dashboard user={activeUser} />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )} 
          />

          <Route 
            path="/penghuni" 
            element={activeUser ? (
              <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                {activeUser.role === 'owner' || activeUser.role === 'master' || activeUser.role === 'staff' ? <Penghuni user={activeUser} /> : <Navigate to="/dashboard" replace />}
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )} 
          />

          <Route 
            path="/keuangan" 
            element={activeUser ? (
              <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                {activeUser.role === 'owner' || activeUser.role === 'master' || activeUser.role === 'staff' ? <Keuangan user={activeUser} /> : <Navigate to="/dashboard" replace />}
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )} 
          />

          <Route 
            path="/layanan" 
            element={activeUser ? (
              <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                <Layanan user={activeUser} />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )} 
          />
          <Route path="/toko" element={<Navigate to="/layanan" replace />} />
          <Route path="/toko-sekitar" element={<Navigate to="/layanan" replace />} />

          <Route 
            path="/mitra" 
            element={activeUser ? (
              activeUser.role === 'user' ? (
                <Navigate to="/layanan" replace />
              ) : (
                <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                  <Mitra user={activeUser} />
                </MainLayout>
              )
            ) : (
              <Navigate to="/login" replace />
            )} 
          />

          <Route 
            path="/laporan" 
            element={<Navigate to="/keuangan" replace />} 
          />

          <Route 
            path="/komplain" 
            element={activeUser ? (
              <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                <Komplain user={activeUser} />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )} 
          />

          <Route 
            path="/pengaturan" 
            element={activeUser ? (
              <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                <Pengaturan user={activeUser} onUpdateUser={handleLogin} onLogout={handleLogout} />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )} 
          />
          <Route 
            path="/karyawan" 
            element={activeUser ? (
              <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
                {activeUser.role === 'owner' || activeUser.role === 'master' ? (
                  <Karyawan user={activeUser} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )} 
          />
          <Route path="/setting" element={<Navigate to="/pengaturan" replace />} />

          {/* Global Fallback Route */}
          <Route path="*" element={<Navigate to={activeUser ? "/dashboard" : "/"} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>

      {/* Global Customer Service & FAQ Floating Button */}
      <CustomerServiceFloatingButton />

      {/* Global Mobile Bottom Navigation Bar (Home, Search, My Kost, Settings) */}
      <MobileBottomNav user={activeUser} />
    </Router>
  );
}

export default App;
