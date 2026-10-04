import React, { useState, useEffect } from 'react';
import { Cloud, Wifi, Database, CheckCircle, AlertCircle, RefreshCw, X, Server, Download, Upload, Shield } from 'lucide-react';
import { getCloudConfig, setCloudApiUrl, testApiConnection } from '../services/api';
import { getSupabaseConfig, setSupabaseConfig, testSupabaseConnection } from '../services/supabase';

export default function CloudSyncModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('server'); // 'server' or 'supabase' or 'backup'
  
  // Server state
  const [cloudUrl, setCloudUrl] = useState('');
  const [useCloud, setUseCloud] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Supabase state
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [sbTesting, setSbTesting] = useState(false);
  const [sbResult, setSbResult] = useState(null);

  // Backup / Restore
  const [restoreMessage, setRestoreMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cfg = getCloudConfig();
      setCloudUrl(cfg.url);
      setUseCloud(cfg.useCloud);

      const sbCfg = getSupabaseConfig();
      setSbUrl(sbCfg.url);
      setSbKey(sbCfg.key);

      setTestResult(null);
      setSbResult(null);
      setRestoreMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestServer = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testApiConnection(useCloud ? cloudUrl : null);
    setTesting(false);
    setTestResult(res);
  };

  const handleSaveServer = () => {
    setCloudApiUrl(cloudUrl, useCloud);
    handleTestServer();
  };

  const handleTestSupabase = async () => {
    setSbTesting(true);
    setSbResult(null);
    const res = await testSupabaseConnection(sbUrl, sbKey);
    setSbTesting(false);
    setSbResult(res);
  };

  const handleSaveSupabase = () => {
    setSupabaseConfig(sbUrl, sbKey);
    handleTestSupabase();
  };

  const handleBackupDownload = () => {
    window.open('/api/backup', '_blank');
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        const data = await res.json();
        if (res.ok) {
          setRestoreMessage(`Berhasil memulihkan database! (${data.count} pengguna)`);
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setRestoreMessage(`Gagal: ${data.error}`);
        }
      } catch (err) {
        setRestoreMessage('Gagal membaca file JSON backup');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="card glass-panel" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '10px',
              borderRadius: '12px',
              color: 'white',
              display: 'flex'
            }}>
              <Cloud size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Sinkronisasi Database Online</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Akses database dari banyak HP & Laptop bersamaan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '1.25rem',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('server')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'server' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'server' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Server size={16} /> Cloud API Server
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'supabase' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'supabase' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Database size={16} /> Supabase DB
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'backup' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'backup' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Download size={16} /> Backup / Restore
          </button>
        </div>

        {/* Tab 1: Cloud Server */}
        {activeTab === 'server' && (
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              border: '1px solid var(--border-color)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={useCloud} 
                  onChange={(e) => setUseCloud(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                />
                Gunakan URL Server Cloud Publik
              </label>
              <p style={{ margin: '6px 0 0 28px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Aktifkan jika aplikasi di HP/Laptop lain mengakses server online (contoh: Render, VPS, atau Pinggy HTTPS Tunnel).
              </p>
            </div>

            {useCloud && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  URL Server Cloud Online:
                </label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="https://xyz.pinggy.link atau https://kostku-api.onrender.com"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Contoh: <code>https://kostku-backend.onrender.com</code>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleTestServer}
                disabled={testing}
                style={{ flex: 1 }}
              >
                <RefreshCw size={16} className={testing ? 'animate-spin' : ''} /> 
                {testing ? 'Menguji...' : 'Uji Koneksi'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveServer}
                style={{ flex: 1 }}
              >
                Simpan Konfigurasi
              </button>
            </div>

            {/* Test Status Banner */}
            {testResult && (
              <div style={{
                background: testResult.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${testResult.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem'
              }}>
                {testResult.ok ? (
                  <>
                    <CheckCircle size={18} color="var(--accent-success)" />
                    <div>
                      <strong style={{ color: 'var(--accent-success)' }}>Terhubung Online!</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        Respons: {testResult.latency} ms. Semua HP dan laptop sekarang sinkron!
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} color="var(--accent-danger)" />
                    <div>
                      <strong style={{ color: 'var(--accent-danger)' }}>Koneksi Gagal:</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>{testResult.error}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              💡 <strong>Tips Multi-Device:</strong> Jalankan script <code>bash scripts/start-online.sh</code> di terminal untuk membuat link online HTTPS gratis via Pinggy secara instan!
            </div>
          </div>
        )}

        {/* Tab 2: Supabase */}
        {activeTab === 'supabase' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Hubungkan ke <strong>Supabase</strong> (Database PostgreSQL Cloud Gratis). Data kost tersimpan di cloud 24/7 dan tersinkronisasi otomatis di semua device.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Supabase Project URL:
              </label>
              <input 
                type="text" 
                className="input-field"
                placeholder="https://abcdefghijkl.supabase.co"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Supabase Anon / Public Key:
              </label>
              <input 
                type="password" 
                className="input-field"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleTestSupabase}
                disabled={sbTesting}
                style={{ flex: 1 }}
              >
                <RefreshCw size={16} className={sbTesting ? 'animate-spin' : ''} /> 
                {sbTesting ? 'Menguji...' : 'Uji Supabase'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveSupabase}
                style={{ flex: 1 }}
              >
                Simpan Kredensial
              </button>
            </div>

            {sbResult && (
              <div style={{
                background: sbResult.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${sbResult.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem'
              }}>
                {sbResult.ok ? (
                  <>
                    <CheckCircle size={18} color="var(--accent-success)" />
                    <span style={{ color: 'var(--accent-success)' }}>
                      Berhasil tersambung ke Supabase Cloud Database! (Latensi {sbResult.latency} ms)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} color="var(--accent-danger)" />
                    <span style={{ color: 'var(--accent-danger)' }}>{sbResult.error}</span>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              📄 <strong>File SQL Schema:</strong> Skema database lengkap telah disediakan di file <code>supabase-schema.sql</code>. Anda cukup copy-paste ke SQL Editor Supabase!
            </div>
          </div>
        )}

        {/* Tab 3: Backup & Restore */}
        {activeTab === 'backup' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Cadangkan (backup) seluruh data kost, penghuni, dan tagihan ke file JSON, atau pulihkan (restore) ke perangkat lain.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleBackupDownload}
                style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <Download size={24} color="var(--accent-primary)" />
                <strong>Download Backup</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Simpan file database JSON</span>
              </button>

              <label 
                className="btn btn-secondary" 
                style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
              >
                <Upload size={24} color="var(--accent-success)" />
                <strong>Restore Database</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Upload file JSON backup</span>
                <input type="file" accept=".json" onChange={handleRestoreFile} style={{ display: 'none' }} />
              </label>
            </div>

            {restoreMessage && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                textAlign: 'center',
                color: '#93c5fd'
              }}>
                {restoreMessage}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
