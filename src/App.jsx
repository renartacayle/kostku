import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import InstallModal from './components/InstallModal';
import CloudSyncModal from './components/CloudSyncModal';
import AutoUpdateModal from './components/AutoUpdateModal';
import AddPropertyModal from './components/AddPropertyModal';
import PortfolioOverviewModal from './components/PortfolioOverviewModal';
import { apiSwitchOwnerKost } from './services/api';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Penghuni from './pages/Penghuni';
import Pengaturan from './pages/Pengaturan';
import Keuangan from './pages/Keuangan';
import Laporan from './pages/Laporan';
import Komplain from './pages/Komplain';
import Home from './pages/Home';
import SearchKost from './pages/SearchKost';
import KostDetail from './pages/KostDetail';

// Main Layout Component for Responsive Mobile & Laptop
const MainLayout = ({ children, user, onLogout, onSwitchKost }) => {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showAddKostModal, setShowAddKostModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
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
          onOpenPortfolio={() => setShowPortfolioModal(true)}
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
          onOpenPortfolio={() => setShowPortfolioModal(true)}
        />

        {/* Page View Container */}
        <main style={{ 
          flex: 1, 
          padding: '1.75rem',
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
      <PortfolioOverviewModal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        user={user}
        activeKostUid={user?.kostUid}
        onSwitchKost={onSwitchKost}
        onOpenAddModal={() => setShowAddKostModal(true)}
      />
    </div>
  );
};

function App() {
  // Synchronous initialization from localStorage to prevent redirect flashing on refresh or login
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kostUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const getStoredUser = () => {
    try {
      const savedUser = localStorage.getItem('kostUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  };

  const activeUser = user || getStoredUser();

  const handleLogin = (userData, customKostName) => {
    localStorage.setItem('kostUser', JSON.stringify(userData));
    setUser(userData);
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
      <AutoUpdateModal />
      <Routes>
        {/* Public Landing & Marketplace */}
        <Route path="/" element={<Home user={activeUser} />} />
        <Route path="/search" element={<SearchKost user={activeUser} />} />
        <Route path="/cari" element={<Navigate to="/search" replace />} />
        <Route path="/kost/:id" element={<KostDetail user={activeUser} />} />
        
        {/* Auth Pages (redirect to /dashboard if already logged in) */}
        <Route 
          path="/login" 
          element={activeUser ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={activeUser ? <Navigate to="/dashboard" replace /> : <Register onLogin={handleLogin} />} 
        />

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
          path="/laporan" 
          element={activeUser ? (
            <MainLayout user={activeUser} onLogout={handleLogout} onSwitchKost={handleSwitchKost}>
              {activeUser.role === 'owner' || activeUser.role === 'master' ? <Laporan user={activeUser} /> : <Navigate to="/dashboard" replace />}
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )} 
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

        {/* Global Fallback Route */}
        <Route path="*" element={<Navigate to={activeUser ? "/dashboard" : "/"} replace />} />
      </Routes>

      {/* Global Mobile Bottom Navigation Bar (Home, Search, My Kost, Settings) */}
      <MobileBottomNav user={activeUser} />
    </Router>
  );
}

export default App;
