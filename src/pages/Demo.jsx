import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  ArrowLeft,
  Lock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info
} from 'lucide-react';
import { apiLogin } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const DEMO_ACCOUNTS = [
  {
    id: 'owner',
    role: 'owner',
    title: 'Pemilik Kost (Juragan)',
    badge: '👑 Owner / Juragan',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.85) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    name: 'Ibu Hj. Nurhasanah',
    email: 'pemilik@kostku.id',
    password: 'password123',
    targetKost: 'Kost Putri Griya Asri Dago & Kost Melati Indah (Multi-Cabang)',
    desc: 'Akses penuh pengelola: approval sewa masuk, manajemen penghuni & ekspor laporan, laporan laba rugi, mutasi payout Flip/Tripay, penugasan staf, & kontrol utilitas.',
    features: [
      '🏢 Multi-Cabang Dago & Melati',
      '🛏️ Manajemen Kamar & Denah Arsitektural',
      '👥 Manajemen Penghuni & Ekspor Laporan',
      '💰 Laporan Laba Rugi, Pemasukan, & Payout',
      '🛠️ Manajemen Staf Lapangan & Utilitas',
      '🔥 Sundul Kost Posisi #1 & Merchant UMKM'
    ]
  },
  {
    id: 'new_owner',
    role: 'owner',
    title: 'Pemilik Kost Baru (Baru Buka / Kosong)',
    badge: '🌱 Baru Buka (0 Penghuni)',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(15, 23, 42, 0.85) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    name: 'Bpk. Rahmat Hidayat (Pemilik Baru)',
    email: 'kostbaru@kostku.id',
    password: 'password123',
    targetKost: 'Kost Harmoni Asri Banyumanik (Baru Buka — 0 Penghuni)',
    desc: 'Simulasi pemilik kost yang baru merintis & grand opening: properti baru selesai dibangun, kamar 100% kosong (belum ada isinya), laporan keuangan Rp 0, siap onboarding dari awal.',
    features: [
      '🌱 Kost Baru Buka (0 Penghuni & 0 Tunggakan)',
      '🚪 6 Kamar Bersih Siap Huni (Status Kosong)',
      '💰 Laporan Finansial Awal (Mulai dari Rp 0)',
      '✨ Panduan Onboarding Kost Baru & Cek Denah',
      '👥 Uji Coba Daftarkan Penghuni Pertama'
    ]
  },
  {
    id: 'tenant',
    role: 'user',
    title: 'Anak Kost (Penghuni Kamar 101)',
    badge: '🏠 Penghuni Aktif',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, rgba(15, 23, 42, 0.85) 100%)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    name: 'Annisa Rahmawati',
    email: 'penghuni@kostku.id',
    password: 'password123',
    targetKost: 'Kost Putri Griya Asri Dago — Kamar 101',
    desc: 'Pengalaman anak kost: bayar sewa bulanan via Dynamic QRIS (dengan Simulator Bayar Instan), unduh e-kuitansi resmi ber-QR, token PLN, tagihan air PDAM, pesan makan/laundry warung, & loker paket.',
    features: [
      '💳 Dynamic QRIS (+ Simulator Bayar Realtime)',
      '🧾 Unduh E-Kuitansi Pembayaran Digital',
      '⚡ Token Listrik PLN & Tagihan PDAM',
      '🛍️ Order Hyperlocal Warung Makan & Laundry Kilat',
      '📦 Notifikasi Loker Paket Kurir (Kode OTP)',
      '🔧 Lapor Komplain Kerusakan Fasilitas Kamar'
    ]
  },
  {
    id: 'staff',
    role: 'staff',
    title: 'Staf Lapangan (Penjaga Kost)',
    badge: '🛠️ Penjaga & Teknisi',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.14) 0%, rgba(15, 23, 42, 0.85) 100%)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
    name: 'Pak Joko Susanto',
    email: 'staff@kostku.id',
    password: 'password123',
    targetKost: 'Kost Putri Griya Asri Dago (Operasional)',
    desc: 'Dashboard operasional lapangan: catat meteran utilitas (listrik kWh & air m³), intake paket kurir & buat kode OTP pickup untuk penghuni, proses tiket perbaikan, & kas kecil.',
    features: [
      '⚡ Catat Meteran Listrik & Air Bulanan',
      '📦 Intake Paket Masuk Kurir & Generate OTP',
      '🔧 Tiket Penugasan & Perbaikan Fasilitas',
      '💵 Kasbon & Pencatatan Pengeluaran Lapangan',
      '📅 Logbook Kehadiran & Patroli Keamanan'
    ]
  },
  {
    id: 'candidate',
    role: 'user',
    title: 'Calon Penghuni (Pencari Kost)',
    badge: '🔍 Calon Penyewa',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(15, 23, 42, 0.85) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
    name: 'Rizky Ramadhan',
    email: 'calon@kostku.id',
    password: 'password123',
    targetKost: 'Belum Terikat Kost (Eksplorasi Pencarian Bebas)',
    desc: 'Simulasi calon penghuni baru: cari kost radius kampus, filter fasilitas/tipe, hitung sewa, upload e-KTP KYC, dan ajukan sewa kamar online.',
    features: [
      '🔍 Jelajah Kost & Filter Kampus Terdekat',
      '📋 Form Pengajuan Sewa & Verifikasi KYC',
      '✍️ Tanda Tangan E-Kontrak Digital',
      '💳 Simulasi Pembayaran Uang Muka / Booking'
    ]
  },
  {
    id: 'merchant',
    role: 'mitra',
    title: 'Mitra UMKM Sekitar Kost (Warung & Laundry)',
    badge: '🛍️ Mitra Toko & Laundry',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.14) 0%, rgba(15, 23, 42, 0.85) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.45)',
    name: 'Bu Siti (Warung & Laundry Bu Siti)',
    email: 'mitra@kostku.id',
    password: 'password123',
    targetKost: 'Mitra Resmi Sekitar Kost Griya Asri & Melati',
    desc: 'Simulasi pedagang UMKM lokal: kelola katalog menu makanan / paket laundry, terima pesanan antar ke kamar kost, dan tarik hasil penjualan.',
    features: [
      '🍲 Manajemen Katalog Menu & Paket Laundry',
      '🔔 Notifikasi Pesanan Masuk Antar ke Kamar',
      '💰 Rekonsiliasi Dana Penjualan Otomatis',
      '⭐ Rating Layanan & Feedback Anak Kost'
    ]
  }
];

export default function Demo({ onLogin }) {
  const navigate = useNavigate();
  const [loggingInDemoId, setLoggingInDemoId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [error, setError] = useState('');

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInstantDemoLogin = async (demo) => {
    setLoggingInDemoId(demo.id);
    setError('');

    try {
      const data = await apiLogin(demo.email, demo.password);
      const demoUser = {
        ...data.user,
        isDemo: true,
        demoRoleId: demo.id
      };

      if (data.kostName) {
        localStorage.setItem('kostName', data.kostName);
      }
      localStorage.setItem('kostUser', JSON.stringify(demoUser));
      localStorage.setItem('kostku_is_demo_mode', 'true');

      if (onLogin) {
        onLogin(demoUser, data.kostName);
      }

      const targetPath = demoUser.role === 'mitra' ? '/mitra' : '/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || `Gagal login simulasi sebagai ${demo.title}.`);
    } finally {
      setLoggingInDemoId(null);
    }
  };

  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div style={{
      minHeight: '100vh',
      background: isLight ? '#f8fafc' : 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.18) 0%, var(--bg-main) 70%)',
      padding: '2.5rem 1.25rem 4rem',
      color: isLight ? '#0f172a' : '#f8fafc',
      boxSizing: 'border-box'
    }}>
      {/* Top Header & Navigation */}
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logo.png" 
            alt="KostKu Logo" 
            style={{ width: '42px', height: '42px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em', color: isLight ? '#0f172a' : '#ffffff' }}>
                KostKu Sandbox
              </h2>
              <span style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 900,
                letterSpacing: '0.04em'
              }}>
                DEMO SHOWCASE
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Pusat Eksplorasi Fitur & Simulasi Klien Terisolasi
            </span>
          </div>
        </div>

        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
            color: isLight ? '#0f172a' : '#ffffff',
            padding: '8px 18px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            transition: 'all 0.2s',
            boxShadow: isLight ? '0 2px 6px rgba(0, 0, 0, 0.06)' : '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
        >
          <ArrowLeft size={16} />
          Masuk ke Akun Real (Produksi)
        </Link>
      </div>

      {/* Main Content Container */}
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Info & Data Isolation Banner */}
        <div style={{
          background: isLight ? '#ffffff' : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: isLight ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '18px',
          padding: '1.5rem 1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          boxShadow: isLight ? '0 4px 16px rgba(15, 23, 42, 0.05)' : '0 10px 30px rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '10px',
            borderRadius: '12px',
            color: '#2563eb',
            flexShrink: 0
          }}>
            <ShieldCheck size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
              Lingkungan Demo Sandbox Terpisah 100% dari Data Real
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: isLight ? '#475569' : '#cbd5e1', lineHeight: 1.55 }}>
              Halaman ini disediakan khusus untuk <strong style={{ color: isLight ? '#0f172a' : 'white' }}>calon klien, pemilik properti, dan investor</strong> yang ingin menguji seluruh skenario operasional KostKu. Data simulasi (kamar Dago & Banyumanik, tagihan demo, mutasi kasir) <strong style={{ color: isLight ? '#0f172a' : 'white' }}>tidak akan tumpang tindih</strong> dengan akun atau properti real Anda.
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Demo Roles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem'
        }}>
          {DEMO_ACCOUNTS.map((demo) => {
            const isLoggingThis = loggingInDemoId === demo.id;
            return (
              <div 
                key={demo.id}
                style={{
                  background: isLight ? '#ffffff' : demo.gradient,
                  border: isLight ? `1.5px solid ${demo.color}40` : `1px solid ${demo.borderColor}`,
                  borderRadius: '18px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  boxShadow: isLight ? '0 4px 16px rgba(15, 23, 42, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 14px 30px ${demo.color}25`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isLight ? '0 4px 16px rgba(15, 23, 42, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.35)';
                }}
              >
                <div>
                  {/* Badge & Title */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: demo.color,
                      background: `${demo.color}1a`,
                      border: `1px solid ${demo.color}45`,
                      padding: '3px 10px',
                      borderRadius: '8px'
                    }}>
                      {demo.badge}
                    </span>

                    <span style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }}>
                      ID: {demo.id}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.18rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                    {demo.name}
                  </h3>

                  <span style={{ fontSize: '0.78rem', color: isLight ? '#0284c7' : '#38bdf8', display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                    📍 {demo.targetKost}
                  </span>

                  <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: isLight ? '#334155' : '#e2e8f0', lineHeight: 1.5 }}>
                    {demo.desc}
                  </p>

                  {/* Feature Checklist */}
                  <div style={{
                    background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    marginBottom: '14px'
                  }}>
                    {demo.features.map((feat, idx) => (
                      <span key={idx} style={{ fontSize: '0.74rem', color: isLight ? '#1e293b' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Copy Credentials Bar */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyText(demo.email, `${demo.id}-email`)}
                      style={{
                        flex: 1,
                        background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: copiedKey === `${demo.id}-email` ? '#059669' : (isLight ? '#334155' : '#cbd5e1'),
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {copiedKey === `${demo.id}-email` ? <Check size={12} /> : <Copy size={12} />}
                      {demo.email}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(demo.password, `${demo.id}-pwd`)}
                      style={{
                        background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: copiedKey === `${demo.id}-pwd` ? '#059669' : (isLight ? '#334155' : '#cbd5e1'),
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {copiedKey === `${demo.id}-pwd` ? <Check size={12} /> : <Copy size={12} />}
                      password123
                    </button>
                  </div>
                </div>

                {/* Instant Launch Button */}
                <button
                  type="button"
                  disabled={isLoggingThis}
                  onClick={() => handleInstantDemoLogin(demo)}
                  style={{
                    background: `linear-gradient(135deg, ${demo.color} 0%, ${demo.color}cc 100%)`,
                    border: 'none',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    cursor: isLoggingThis ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: `0 4px 14px ${demo.color}40`,
                    transition: 'all 0.2s',
                    marginTop: '8px'
                  }}
                >
                  {isLoggingThis ? (
                    'Memuat Sesi Sandbox...'
                  ) : (
                    <>
                      <span>Masuk Mode Demo {demo.title}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div style={{
          marginTop: '3rem',
          textAlign: 'center',
          padding: '1.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px'
        }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
            Siap Menggunakan KostKu untuk Properti Kos Asli Anda?
          </h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Daftarkan kos Anda sekarang untuk menikmati seluruh otomatisasi manajemen, penagihan QRIS instan, dan kontrol staf.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '9px 20px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              Daftar Pemilik Kos Baru
            </Link>
            <Link
              to="/login"
              style={{
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '9px 20px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              Masuk Akun Real
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
