import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Layers, 
  Users, 
  Database, 
  Wallet, 
  ShieldCheck, 
  CheckSquare, 
  ArrowRight, 
  Copy, 
  Check, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  QrCode, 
  Send, 
  Building2, 
  RefreshCw,
  Code2,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function BlueprintHub({ user }) {
  const [activeTab, setActiveTab] = useState('arsitektur');
  const [copiedKey, setCopiedKey] = useState(null);

  // Simulator State
  const [ownerCommission, setOwnerCommission] = useState(25000); // bonus awal
  const [mitraEscrow, setMitraEscrow] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [basePrice, setBasePrice] = useState(18000);
  const [ownerMarkup, setOwnerMarkup] = useState(1000);
  const platformFee = 500;
  const overdraftLimit = -15000;
  const [simulationLogs, setSimulationLogs] = useState([
    { id: 1, type: 'init', desc: 'Bonus Saldo Awal Owner diberikan: Rp25.000', time: 'Awal Sistem' }
  ]);

  const displayPriceTenant = Number(basePrice) + Number(ownerMarkup) + platformFee;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Simulator actions
  const handleSimulateQRIS = () => {
    const markup = Number(ownerMarkup);
    const base = Number(basePrice);
    setOwnerCommission(prev => prev + markup);
    setMitraEscrow(prev => prev + base);
    setPlatformRevenue(prev => prev + platformFee);
    setSimulationLogs(prev => [
      {
        id: Date.now(),
        type: 'qris',
        desc: `Pesanan QRIS Rp${displayPriceTenant.toLocaleString('id-ID')} lunas: Owner +Rp${markup.toLocaleString('id-ID')}, Escrow Mitra +Rp${base.toLocaleString('id-ID')}, Platform +Rp500`,
        time: new Date().toLocaleTimeString('id-ID')
      },
      ...prev
    ]);
  };

  const handleSimulateCOD = () => {
    const newBal = ownerCommission - platformFee;
    setOwnerCommission(newBal);
    setPlatformRevenue(prev => prev + platformFee);
    setSimulationLogs(prev => [
      {
        id: Date.now(),
        type: 'cod',
        desc: `Pesanan COD (Tunai) diantar: Uang fisik dipegang Mitra/Owner. Saldo Owner didebit -Rp500 (talangan fee platform).`,
        time: new Date().toLocaleTimeString('id-ID')
      },
      ...prev
    ]);
  };

  const handlePayout = () => {
    const totalWithdrawn = ownerCommission + mitraEscrow;
    if (totalWithdrawn <= 0) {
      alert('Tidak ada saldo positif untuk ditarik!');
      return;
    }
    setSimulationLogs(prev => [
      {
        id: Date.now(),
        type: 'payout',
        desc: `Pencairan 1 Pintu (Single-Node Settlement): Rp${totalWithdrawn.toLocaleString('id-ID')} ditransfer ke rekening bank Owner (cukup 1x biaya admin bank).`,
        time: new Date().toLocaleTimeString('id-ID')
      },
      ...prev
    ]);
    setOwnerCommission(0);
    setMitraEscrow(0);
  };

  const handleSetorMitra = () => {
    if (mitraEscrow <= 0) {
      alert('Tidak ada titipan dana mitra yang perlu disetor.');
      return;
    }
    setSimulationLogs(prev => [
      {
        id: Date.now(),
        type: 'setor',
        desc: `Owner menyerahkan uang fisik Rp${mitraEscrow.toLocaleString('id-ID')} ke warung offline & menekan tombol [Tandai Sudah Disetor]. Nilai piutang mitra di-reset ke Rp0.`,
        time: new Date().toLocaleTimeString('id-ID')
      },
      ...prev
    ]);
    setMitraEscrow(0);
  };

  const handleResetSimulator = () => {
    setOwnerCommission(25000);
    setMitraEscrow(0);
    setPlatformRevenue(0);
    setBasePrice(18000);
    setOwnerMarkup(1000);
    setSimulationLogs([
      { id: Date.now(), type: 'init', desc: 'Simulator di-reset: Saldo Awal Owner Rp25.000', time: new Date().toLocaleTimeString('id-ID') }
    ]);
  };

  const schemaUsers = `{
  "uid": "string (Document ID / Firebase Auth UID)",
  "role": "tenant | owner | mitra | super_admin",
  "name": "string",
  "phone": "string (format 628xxx untuk WA)",
  "property_id": "string (referensi ke properties)",
  "room_number": "string (khusus tenant)",
  "loyalty_points": "number (default: 0, khusus tenant)",
  "kyc_data": {
    "nik": "string (16 digit angka tervalidasi)",
    "ktp_image_url": "string (path di Firebase Storage)",
    "verified_status": "pending | verified | rejected",
    "rtrw_sync_status": "boolean (persiapan integrasi ekspor RT/RW)"
  },
  "created_at": "timestamp"
}`;

  const schemaProperties = `{
  "property_id": "string (Document ID)",
  "owner_uid": "string",
  "property_name": "string",
  "property_type": "kost | kontrakan | hotel",
  "address": "string",
  "wallet": {
    "owner_commission_balance": "number (Saldo bersih hak owner + kuota COD, default bonus awal: 25000)",
    "mitra_escrow_balance": "number (Total uang titipan UMKM dari transaksi Online/QRIS)",
    "overdraft_limit": "number (default: -15000, batas maksimal saldo minus)"
  },
  "bank_account": {
    "bank_name": "string",
    "account_number": "string",
    "account_holder": "string"
  }
}`;

  const schemaMitra = `{
  "mitra_id": "string (Document ID)",
  "property_id": "string",
  "mitra_name": "string",
  "category": "galon | makanan | laundry | listrik",
  "whatsapp_number": "string (format 628xxx)",
  "rating_avg": "number (default: 5.0)",
  "rating_count": "number (default: 0)",
  "timeout_cancel_count": "number (default: 0)",
  "is_active": "boolean (default: true)",
  "unsettled_balance": "number (piutang belum disetor)"
}`;

  const schemaProducts = `{
  "product_id": "string (Document ID)",
  "mitra_id": "string",
  "property_id": "string",
  "product_name": "string",
  "base_price_mitra": "number (contoh: 18000 - termasuk antar)",
  "platform_fee": "number (Fixed: 500)",
  "owner_markup_fee": "number (Diatur Owner, misal: 1000)",
  "display_price_tenant": "number (base_price + platform_fee + owner_markup)",
  "sla_minutes": "number (Batas waktu antar)"
}`;

  const schemaOrders = `{
  "order_id": "string (Document ID)",
  "property_id": "string",
  "tenant_uid": "string",
  "room_number": "string",
  "mitra_id": "string",
  "items": [],
  "payment_method": "QRIS | COD",
  "qris_admin_fee": "number",
  "total_tenant_pay": "number",
  "order_status": "waiting_payment | pending_accept | processing | completed | cancelled_timeout",
  "sla_deadline_at": "timestamp",
  "rating_given": "number (1 - 5)",
  "created_at": "timestamp",
  "completed_at": "timestamp"
}`;

  const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /ktp_uploads/{propertyId}/{tenantUid}.jpg {
      allow read, write: if request.auth != null && 
        (request.auth.uid == tenantUid || 
         firestore.get(/databases/(default)/documents/properties/$(propertyId)).data.owner_uid == request.auth.uid);
    }
  }
}`;

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '1.5rem',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* Top Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Accent */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: '1rem'
            }}>
              <Code2 size={15} /> TECHNICAL BLUEPRINT & SYSTEM SPECIFICATION
            </div>
            
            <h1 style={{
              margin: '0 0 0.75rem 0',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Sistem Manajemen Properti & Ekosistem Hyperlocal UMKM
            </h1>

            <p style={{
              margin: 0,
              fontSize: '1rem',
              color: '#94a3b8',
              maxWidth: '820px',
              lineHeight: 1.6
            }}>
              Arsitektur terpadu platform KostKu berbasis <strong>B2B2C Freemium SaaS Hook</strong>, integrasi <strong>Cloud Firestore</strong>, protokol finansial <strong>Unified Wallet</strong> (Single-Node Settlement), perlindungan <strong>Overdraft Limit (-15000)</strong>, serta engine kontrol kualitas mitra UMKM sekitar properti.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                ✓ Sewa Kamar 0% Komisi
              </span>
              <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                ⚡ Platform Fee Rp500 Tetap
              </span>
              <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                🛡️ KYC KTP & Wajib Lapor RT/RW
              </span>
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                💰 Single-Node Settlement
              </span>
            </div>
          </div>

          {/* Download Center Pill Actions */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: '240px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Unduh Dokumen Resmi
            </span>

            <a
              href="/downloads/KostKu_Full_Blueprint.pdf"
              download="KostKu_Full_Blueprint.pdf"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Download size={15} /> Unduh PDF Lengkap (Blueprint)
            </a>

            <a
              href="/downloads/KostKu_SKPL_Presentation.pptx"
              download="KostKu_SKPL_Presentation.pptx"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              <FileSpreadsheet size={15} color="#38bdf8" /> Slide Presentasi (PPTX)
            </a>

            <a
              href="/downloads/BLUEPRINT_SISTEM_KOST.md"
              download="BLUEPRINT_SISTEM_KOST.md"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.8rem'
              }}
            >
              <FileText size={14} /> Berkas Raw Markdown (.md)
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '8px',
        padding: '6px',
        background: 'rgba(15, 23, 42, 0.8)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '2rem'
      }}>
        {[
          { id: 'arsitektur', label: '1. Model Bisnis & Arsitektur', icon: <Layers size={16} /> },
          { id: 'roles', label: '2. Role Pengguna', icon: <Users size={16} /> },
          { id: 'database', label: '3. Skema Database', icon: <Database size={16} /> },
          { id: 'simulator', label: '4. Simulator Unified Wallet', icon: <Wallet size={16} /> },
          { id: 'implementasi', label: '5. Tahap Dev & Security', icon: <ShieldCheck size={16} /> },
          { id: 'checklist', label: '6. Checklist Halaman UI', icon: <CheckSquare size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--accent-primary, #3b82f6)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.88rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: ARSITEKTUR & MODEL BISNIS */}
      {activeTab === 'arsitektur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Freemium SaaS Hook (0% Komisi)</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Manajemen sewa kamar kost/kontrakan/hotel diberikan secara <strong>100% GRATIS</strong> tanpa memotong biaya komisi pemilik properti. Pendekatan ini mengeliminasi penolakan adopsi oleh pemilik kost, sekaligus mewajibkan seluruh penghuni mendaftarkan NIK 16 digit dan unggah foto KTP asli sebagai prasyarat hukum check-in.
              </p>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <TrendingUp size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Monetisasi Hyperlocal UMKM (Rp500)</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Platform mengambil biaya layanan tetap (<strong>Platform Fee</strong>) sebesar <strong>Rp500 per transaksi</strong> dari pemenuhan kebutuhan harian anak kost (Air Galon, Laundry, Katering/Warung Makan, Token Listrik PLN). Karena transaksi harian terjadi berulang, unit ekonomi platform tetap stabil dan profitable.
              </p>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                  <Wallet size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Pencairan 1 Pintu (Single-Node Settlement)</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Seluruh dana (komisi Owner & uang titipan UMKM) dipusatkan pada <strong>1 Dompet Terpadu (Unified Wallet)</strong> milik Owner. Skema ini mengeliminasi beban biaya transfer antarbank ganda dan merangkul mitra UMKM sekitar kost yang belum memiliki rekening bank (*unbanked*).
              </p>
            </div>
          </div>

          {/* Arsitektur Pipeline Diagram Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
              Alur Perputaran Dana & Settlement (QRIS vs COD)
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8', fontSize: '0.95rem' }}>1. Transaksi QRIS Online</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Tenant bayar via Midtrans/Xendit → Platform ambil Rp500 → Dompet Owner bertambah +Markup (misal +Rp1.000) → Escrow Mitra bertambah +Harga Dasar (misal +Rp18.000).
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#f59e0b', fontSize: '0.95rem' }}>2. Transaksi COD Tunai</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Tenant bayar fisik langsung ke Mitra/Owner → Uang fisik di tangan offline → Saldo komisi Owner di sistem didebit -Rp500 (talangan fee aplikasi).
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#10b981', fontSize: '0.95rem' }}>3. Payout 1 Pintu</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Owner tarik total dompet ke rekening bank pribadi (cukup 1x biaya admin) → Owner serahkan uang tunai titipan ke warung offline & klik [Tandai Sudah Disetor].
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ROLE PENGGUNA */}
      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              role: 'super_admin',
              title: 'Super Admin (Platform Owner)',
              badge: 'System Authority',
              color: '#c084fc',
              points: [
                'Memantau total pendapatan Platform Fee tetap Rp500 per transaksi harian',
                'Mengawasi rasio pesanan QRIS vs COD dan integritas audit dompet',
                'Memproses pencairan dana (*payout*) ke rekening bank para pemilik properti'
              ]
            },
            {
              role: 'owner',
              title: 'Owner (Pemilik Properti)',
              badge: 'Property Controller',
              color: '#38bdf8',
              points: [
                'Mengelola inventaris kamar kost, kontrakan, atau hotel secara gratis',
                'Memverifikasi keaslian foto KTP & ekspor data wajib lapor RT/RW',
                'Mendaftarkan warung UMKM dan mengunci harga produk (*Price Lock*)',
                'Mengatur markup komisi sendiri dan mencairkan Unified Wallet 1 pintu'
              ]
            },
            {
              role: 'tenant',
              title: 'Tenant (Penghuni Kost)',
              badge: 'End Consumer',
              color: '#34d399',
              points: [
                'Melakukan check-in mandiri dengan validasi 16 digit NIK & upload foto KTP',
                'Memesan kebutuhan harian (Galon, Makanan, Laundry, Listrik) via QRIS/COD',
                'Mengumpulkan poin loyalitas dan memberikan rating ulasan kepada Mitra'
              ]
            },
            {
              role: 'mitra',
              title: 'Mitra UMKM (Warung Lokal)',
              badge: 'Hyperlocal Provider',
              color: '#fbbf24',
              points: [
                'Menerima pesanan masuk melalui Dashboard web ringan atau notifikasi WhatsApp wa.me',
                'Mengantarkan pesanan langsung ke nomor kamar penghuni kost',
                'Menerima pembayaran tunai langsung (COD) atau rekapitulasi setoran dari Owner (QRIS)'
              ]
            }
          ].map(r => (
            <div
              key={r.role}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: r.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {r.badge}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                  {r.role}
                </span>
              </div>

              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                {r.title}
              </h3>

              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 }}>
                {r.points.map((p, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 3: SKEMA DATABASE FIRESTORE */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { name: 'Collection: users', desc: 'Menyimpan data akun semua role & KYC NIK 16 digit', schema: schemaUsers, key: 'users' },
            { name: 'Collection: properties', desc: 'Menyimpan gedung properti & saldo Unified Wallet milik Owner', schema: schemaProperties, key: 'properties' },
            { name: 'Collection: mitra_umkm', desc: 'Menyimpan warung/mitra yang terikat pada kost tertentu', schema: schemaMitra, key: 'mitra' },
            { name: 'Collection: products', desc: 'Katalog produk dengan mekanisme Price Lock oleh Owner', schema: schemaProducts, key: 'products' },
            { name: 'Collection: orders', desc: 'Transaksi pesanan kebutuhan harian & hitung mundur SLA', schema: schemaOrders, key: 'orders' }
          ].map(col => (
            <div
              key={col.key}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '1rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                    {col.name}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    {col.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(col.schema, col.key)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  {copiedKey === col.key ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copiedKey === col.key ? 'Disalin!' : 'Salin JSON'}</span>
                </button>
              </div>

              <pre style={{
                margin: 0,
                padding: '1.25rem 1.5rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.84rem',
                color: '#e2e8f0',
                lineHeight: 1.5,
                overflowX: 'auto',
                background: 'rgba(0, 0, 0, 0.3)'
              }}>
                <code>{col.schema}</code>
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 4: SIMULATOR UNIFIED WALLET & OVERDRAFT */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Overdraft Alert Banner if Negative */}
          {ownerCommission < 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <AlertTriangle size={28} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, color: '#fca5a5', fontSize: '1rem', fontWeight: 800 }}>
                  Peringatan Saldo Minus: Rp{ownerCommission.toLocaleString('id-ID')} (Overdraft Aktif)
                </h4>
                <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
                  Sistem tetap mengizinkan pesanan anak kost berjalan normal hingga batas overdraft limit <strong>-Rp15.000</strong> (setara kuota 30 transaksi COD talangan). Jika di akhir bulan saldo masih minus, fitur cetak kuitansi sewa & buka KTP penghuni baru akan dikunci sementara sampai owner melunasi saldo minusnya.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Financial Cockpit */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            {/* Owner Commission Balance */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '18px',
              border: `1px solid ${ownerCommission < 0 ? '#ef4444' : 'rgba(56, 189, 248, 0.3)'}`,
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Saldo Komisi Owner (Hak Bersih)
                </span>
                <Wallet size={18} color="#38bdf8" />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 900,
                color: ownerCommission < 0 ? '#ef4444' : '#38bdf8',
                fontFamily: 'monospace'
              }}>
                Rp{ownerCommission.toLocaleString('id-ID')}
              </h2>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                Batas Overdraft: <strong style={{ color: '#ef4444' }}>-Rp15.000</strong>
              </div>
            </div>

            {/* Mitra Escrow Balance */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '18px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Titipan Escrow Mitra (Uang Warung)
                </span>
                <DollarSign size={18} color="#fbbf24" />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#fbbf24',
                fontFamily: 'monospace'
              }}>
                Rp{mitraEscrow.toLocaleString('id-ID')}
              </h2>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                Diserahkan tunai offline oleh Owner
              </div>
            </div>

            {/* Platform Revenue */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '18px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Pendapatan Platform (Rp500/Tx)
                </span>
                <TrendingUp size={18} color="#34d399" />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#34d399',
                fontFamily: 'monospace'
              }}>
                Rp{platformRevenue.toLocaleString('id-ID')}
              </h2>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                Fixed fee berkelanjutan
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '1.75rem'
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 800 }}>
              Uji Coba Mutasi Transaksi (Price Lock & Settlement)
            </h3>

            {/* Inputs for Price Calculation */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.25rem',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  Harga Dasar Mitra (Termasuk Antar):
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  Owner Markup Fee (Komisi Pemilik):
                </label>
                <input
                  type="number"
                  value={ownerMarkup}
                  onChange={(e) => setOwnerMarkup(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  Platform Fee (Fixed):
                </label>
                <input
                  type="text"
                  disabled
                  value="Rp 500"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#38bdf8',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginBottom: '6px' }}>
                  Harga Tampil Tenant (Price Lock):
                </label>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  fontFamily: 'monospace'
                }}>
                  Rp{displayPriceTenant.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Simulator Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                onClick={handleSimulateQRIS}
                className="btn btn-primary"
                style={{ padding: '10px 18px', gap: '8px', borderRadius: '10px' }}
              >
                <QrCode size={16} /> Simulasikan Order QRIS (Online)
              </button>

              <button
                onClick={handleSimulateCOD}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                <DollarSign size={16} /> Simulasikan Order COD (Tunai -500 Fee)
              </button>

              <button
                onClick={handlePayout}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', gap: '8px', borderRadius: '10px' }}
              >
                <ExternalLink size={16} /> Tarik Dana 1 Pintu (Owner Payout)
              </button>

              <button
                onClick={handleSetorMitra}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', gap: '8px', borderRadius: '10px' }}
              >
                <Send size={16} /> Tandai Sudah Disetor ke Mitra
              </button>

              <button
                onClick={handleResetSimulator}
                className="btn btn-secondary"
                style={{ padding: '10px 14px', gap: '6px', borderRadius: '10px', marginLeft: 'auto' }}
              >
                <RefreshCw size={14} /> Reset
              </button>
            </div>

            {/* Simulation Log Feed */}
            <div style={{ marginTop: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Histori Mutasi Simulasi:
              </span>
              <div style={{
                marginTop: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {simulationLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '0.82rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ color: '#e2e8f0' }}>{log.desc}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace', flexShrink: 0 }}>
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 5: TAHAP DEV & SECURITY RULES */}
      {activeTab === 'implementasi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tahap 1: Auth & Storage Rules */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <ShieldCheck size={22} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                TAHAP 1: Autentikasi, Upload KTP & Firebase Storage Rules
              </h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
              Validasi NIK wajib 16 digit angka: <code style={{ color: '#38bdf8' }}>RegExp(r'^[0-9]&#123;16&#125;$')</code>. Foto KTP disimpan pada path privat <code style={{ color: '#38bdf8' }}>ktp_uploads/&#123;property_id&#125;/&#123;tenant_uid&#125;.jpg</code> dengan aturan keamanan ketat:
            </p>

            <div style={{ position: 'relative' }}>
              <pre style={{
                background: '#090d16',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#34d399',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                margin: 0,
                overflowX: 'auto'
              }}>
                <code>{storageRules}</code>
              </pre>
              <button
                onClick={() => handleCopy(storageRules, 'storageRules')}
                className="btn btn-secondary btn-sm"
                style={{ position: 'absolute', top: '10px', right: '10px', gap: '6px' }}
              >
                {copiedKey === 'storageRules' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copiedKey === 'storageRules' ? 'Disalin' : 'Salin Rules'}</span>
              </button>
            </div>
          </div>

          {/* Tahap 2, 3, 4 Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: 800, color: '#fbbf24' }}>
                TAHAP 2: Logika Unified Wallet & Mutasi Saldo
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Menggunakan <strong>Firestore Transaction (runTransaction)</strong> untuk menjaga konsistensi mutasi keuangan. Proteksi overdraft (-15.000) mencegah penolakan pesanan saat komisi owner kosong.
              </p>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
                TAHAP 3: Pencairan Dana 1 Pintu (Single-Node)
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Owner menarik total saldo (komisi hak pribadi + escrow mitra) ke rekening bank terdaftar. Lalu menyerahkan uang tunai titipan ke warung sekitar secara berkala dan menekan tombol reset piutang.
              </p>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: 800, color: '#f43f5e' }}>
                TAHAP 4: Kontrol Kualitas & SLA Mitra
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Pemicu notifikasi WhatsApp instan via <strong>wa.me</strong>, hitung mundur SLA pengantaran (auto-cancel jika telat), serta auto-suspend warung jika rating rata-rata &lt; 3.5 atau pembatalan $\ge 3$.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: CHECKLIST HALAMAN UI */}
      {activeTab === 'checklist' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          padding: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
            Checklist Halaman & Fitur UI (Kesiapan Aplikasi)
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#34d399', fontSize: '1rem', fontWeight: 800 }}>
                A. Tenant (Anak Kost)
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <li>✓ Onboarding/Check-in (Input NIK 16 Digit & Foto KTP)</li>
                <li>✓ Home Dashboard (Katalog & Poin Loyalitas)</li>
                <li>✓ Halaman Checkout (Pilihan QRIS Dinamis & COD)</li>
                <li>✓ Tracking Order & Modal Rating Ulasan</li>
              </ul>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '1rem', fontWeight: 800 }}>
                B. Owner (Pemilik Properti)
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <li>✓ Manajemen Kamar & Verifikasi KTP Penghuni</li>
                <li>✓ Tombol Export Data Wajib Lapor RT/RW</li>
                <li>✓ Manajemen Mitra UMKM & Price Lock</li>
                <li>✓ Unified Wallet Dashboard & Indikator Overdraft</li>
              </ul>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '1rem', fontWeight: 800 }}>
                C. Mitra UMKM & Super Admin
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <li>✓ Dashboard Ringan Penerimaan Pesanan</li>
                <li>✓ Notifikasi WhatsApp Otomatis (wa.me)</li>
                <li>✓ Monitoring Fee Platform Rp500 (Super Admin)</li>
                <li>✓ Otorisasi Pencairan Dana ke Rekening Owner</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/penghuni" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              Buka Halaman Penghuni (RT/RW Export) →
            </Link>
            <Link to="/keuangan" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              Buka Halaman Keuangan (Unified Wallet) →
            </Link>
            <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              Buka Dashboard Utama →
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
