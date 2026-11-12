import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Store,
  Users,
  Utensils,
  RefreshCw,
  X,
  Award,
  DollarSign,
  ShoppingBag,
  Percent,
  CheckCircle2,
  ChevronRight,
  Info,
  Gift,
  ExternalLink,
  Clock,
  Wallet
} from 'lucide-react';

export default function KasirAnalyticsModal({
  isOpen,
  onClose,
  isLight,
  analyticsData,
  loadingAnalytics,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('perMenu'); // 'perMenu' | 'perStore' | 'crossBranch' | 'perCashier'

  if (!isOpen) return null;

  const bgModal = isLight ? '#ffffff' : '#0f172a';
  const bgCard = isLight ? '#f8fafc' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const borderLight = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)';

  const summary = analyticsData?.summary || {
    totalOrdersAll: 0,
    totalGrossOmset: 0,
    activeBranchesCount: 0,
    totalMenuItems: 0
  };

  const perMenu = analyticsData?.perMenu || [];
  const perStore = analyticsData?.perStore || [];
  const crossBranch = analyticsData?.crossBranchPerMenu || [];
  const perCashier = analyticsData?.perCashier || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.68)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '92vh',
        background: bgModal,
        borderRadius: '20px',
        border: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '16px 1.5rem',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isLight ? '#ffffff' : '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.3px' }}>
                Statistik &amp; Analitik Keuangan Multi-Dimensi
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: textSecondary }}>
                Data performa komprehensif per menu, per cabang/toko, matriks cross-cabang, dan leaderboard kasir.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loadingAnalytics}
              style={{
                background: isLight ? '#f1f5f9' : '#1e293b',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: textSecondary,
                fontSize: '0.74rem',
                fontWeight: 600
              }}
              title="Perbarui Data Analitik"
            >
              <RefreshCw size={13} className={loadingAnalytics ? 'animate-spin' : ''} />
              <span>{loadingAnalytics ? 'Memuat...' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: textSecondary,
                padding: '4px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {/* Top KPI Cards (4 Kolom) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <DollarSign size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Omset Penjualan
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                  Rp {Number(summary.totalGrossOmset || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Pesanan Selesai
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                  {summary.totalOrdersAll || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary }}>Trx</span>
                </div>
              </div>
            </div>

            <div style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Store size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                  Cabang / Mitra Terdaftar
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                  {summary.activeBranchesCount || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary }}>Toko</span>
                </div>
              </div>
            </div>

            <div style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isLight ? '#ede9fe' : 'rgba(139, 92, 246, 0.15)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Utensils size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                  Menu Aktif di Kasir
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                  {summary.totalMenuItems || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textSecondary }}>Menu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div style={{
            display: 'flex',
            borderBottom: `2px solid ${borderColor}`,
            gap: '10px',
            marginBottom: '1rem',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}>
            {[
              { id: 'perMenu', label: '🍜 Per Menu (Omset & HPP)', count: perMenu.length },
              { id: 'perStore', label: '🏪 Per Cabang / Toko', count: perStore.length },
              { id: 'crossBranch', label: '🌐 Semua Cabang per Menu (Matriks)', count: crossBranch.length },
              { id: 'perCashier', label: '👨‍💼 Per Karyawan / Kasir', count: perCashier.length },
              { id: 'escrowPromo', label: '🎁 Escrow & Loyalty (Rp 75 Promo)', count: 'Live' }
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    borderBottom: active ? '3px solid #4f46e5' : '3px solid transparent',
                    background: 'transparent',
                    color: active ? '#4f46e5' : textSecondary,
                    fontSize: '0.82rem',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    marginBottom: '-2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      background: active ? '#4f46e5' : (isLight ? '#e2e8f0' : '#334155'),
                      color: active ? '#ffffff' : textSecondary
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: PER MENU */}
          {activeTab === 'perMenu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                background: isLight ? '#f8fafc' : '#1e293b',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                overflowX: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: isLight ? '#f1f5f9' : '#0f172a', borderBottom: `1px solid ${borderColor}` }}>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Rank</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Menu &amp; Kategori</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Harga Jual</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Terjual (Qty)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Gross Omset</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>HPP / Porsi</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Total HPP</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Laba Kotor</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perMenu.map((item, idx) => {
                      const marginNum = parseFloat(item.marginPct) || 0;
                      return (
                        <tr key={item.productId || idx} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                            {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 800, color: textPrimary }}>{item.name}</div>
                                <span style={{
                                  fontSize: '0.66rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: isLight ? '#e2e8f0' : '#334155',
                                  color: textSecondary
                                }}>
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            Rp {Number(item.price || 0).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {item.totalQtySold || 0} porsi
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                            Rp {Number(item.totalRevenue || 0).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: textSecondary, fontFamily: 'var(--font-mono)' }}>
                            Rp {Number(item.hppPerPortion || 0).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: textSecondary, fontFamily: 'var(--font-mono)' }}>
                            Rp {Number(item.totalHPP || 0).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
                            Rp {Number(item.grossProfit || 0).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: marginNum >= 50 ? '#dcfce7' : marginNum >= 25 ? '#fef3c7' : '#f1f5f9',
                              color: marginNum >= 50 ? '#15803d' : marginNum >= 25 ? '#b45309' : '#64748b'
                            }}>
                              {item.marginPct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PER CABANG / TOKO */}
          {activeTab === 'perStore' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: isLight ? '#f8fafc' : '#1e293b',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                overflowX: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: isLight ? '#f1f5f9' : '#0f172a', borderBottom: `1px solid ${borderColor}` }}>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>No</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Nama Cabang / Toko</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Lokasi Fisik</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Total Pesanan</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Omset Tunai (Laci)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Omset QRIS</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Total Omset Kotor</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Biaya Nota (-Rp 100)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Omset Bersih Toko</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Saldo Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perStore.map((st, idx) => (
                      <tr key={st.storeId || idx} style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: textPrimary, display: 'block' }}>{st.storeName}</strong>
                          <span style={{ fontSize: '0.68rem', color: textSecondary }}>ID: {st.storeId}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: textSecondary }}>{st.location || '-'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {st.totalOrders || 0}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#d97706' }}>
                          Rp {Number(st.cashRevenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                          Rp {Number(st.qrisRevenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(st.grossRevenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                          -Rp {Number(st.notaFeeTotal || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(st.netRevenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(st.saldoNota ?? 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SEMUA CABANG PER MENU (CROSS-TABULATION MATRIX) */}
          {activeTab === 'crossBranch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)',
                border: '1px solid #bfdbfe',
                fontSize: '0.74rem',
                color: isLight ? '#1e40af' : '#93c5fd',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Info size={16} />
                <span>
                  Matriks ini memetakan pergerakan penjualan setiap menu pada seluruh cabang/toko mitra untuk mendeteksi cabang terlaris per produk.
                </span>
              </div>

              <div style={{
                background: isLight ? '#f8fafc' : '#1e293b',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                overflowX: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: isLight ? '#f1f5f9' : '#0f172a', borderBottom: `1px solid ${borderColor}` }}>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Menu</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Harga</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Total Semua Cabang</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Total Omset Nasional</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Cabang Terlaris</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Rincian Cabang Aktif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossBranch.map((cb, idx) => (
                      <tr key={cb.productId || idx} style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: textPrimary, display: 'block' }}>{cb.productName}</strong>
                          <span style={{ fontSize: '0.68rem', color: textSecondary }}>{cb.category}</span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(cb.price || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {cb.totalAllBranchesQty || 0} porsi
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(cb.totalAllBranchesRevenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                            color: '#b45309',
                            fontWeight: 700,
                            fontSize: '0.72rem'
                          }}>
                            ⭐ {cb.topBranchName || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {Object.values(cb.branches || {}).filter(b => b.qty > 0).map(b => (
                              <span
                                key={b.storeId}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isLight ? '#e2e8f0' : '#334155',
                                  color: textPrimary
                                }}
                              >
                                {b.storeName}: <strong>{b.qty}x</strong> (Rp {Number(b.revenue).toLocaleString('id-ID')})
                              </span>
                            ))}
                            {Object.values(cb.branches || {}).filter(b => b.qty > 0).length === 0 && (
                              <span style={{ fontSize: '0.68rem', color: textSecondary, fontStyle: 'italic' }}>
                                Belum ada order di cabang manapun
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PER KARYAWAN / KASIR */}
          {activeTab === 'perCashier' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: isLight ? '#f8fafc' : '#1e293b',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                overflowX: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: isLight ? '#f1f5f9' : '#0f172a', borderBottom: `1px solid ${borderColor}` }}>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Rank</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Nama Karyawan / Kasir</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Penugasan / Shift</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Total Transaksi</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Total Omset Kasir</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Uang Tunai Laci</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Digital QRIS</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Rata-rata Trx (ATV)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Rating Performa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perCashier.map((ck, idx) => (
                      <tr key={ck.cashierId || idx} style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                          {idx === 0 ? '👑 #1' : `#${idx + 1}`}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ color: textPrimary, display: 'block' }}>{ck.cashierName}</strong>
                          <span style={{ fontSize: '0.68rem', color: textSecondary }}>ID: {ck.cashierId}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: textSecondary }}>{ck.role}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {ck.ordersCount || 0} Trx
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(ck.revenue || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(ck.cashHandled || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(ck.qrisProcessed || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: textSecondary, fontFamily: 'var(--font-mono)' }}>
                          Rp {Number(ck.avgOrderValue || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: ck.ordersCount > 0 ? '#dcfce7' : (isLight ? '#f1f5f9' : '#334155'),
                            color: ck.ordersCount > 0 ? '#15803d' : textSecondary
                          }}>
                            {ck.performanceRating}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ESCROW & LOYALTY (RP 75 PROMO) */}
          {activeTab === 'escrowPromo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: bgCard,
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '5px'
                    }}>
                      ESCROW PROMO ENGINE
                    </span>
                    <span style={{ fontSize: '0.74rem', color: textSecondary }}>
                      Skema Biaya Admin Kasir POS
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                    Potongan Admin Berjenjang (Rp 25 Platform + Rp 75 Promo Ditahan)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: textSecondary, maxWidth: '600px', lineHeight: 1.4 }}>
                    Setiap struk kasir diterbitkan dengan QR unik 1x pakai. Jika pelanggan tidak mengklaim poin hingga <strong>Hari D+1 jam 23:59 WIB</strong>, dana Rp 75/nota otomatis di-refund kembali ke Saldo Aktif Anda pada pukul 00:01 WIB.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href="/keuangan?tab=escrow"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    <span>Buka Menu Keuangan</span>
                    <ExternalLink size={13} />
                  </a>

                  <a
                    href="/claim"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <span>Laman Klaim Pelanggan</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px'
              }}>
                <div style={{
                  background: bgCard,
                  borderRadius: '12px',
                  border: `1px solid ${borderColor}`,
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary }}>
                      Biaya Admin Dasar
                    </span>
                    <DollarSign size={16} color="#4f46e5" />
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#4f46e5' }}>
                    Rp 25 <span style={{ fontSize: '0.72rem', fontWeight: 600, color: textSecondary }}>/ nota</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                    Biaya operasional server & platform cloud.
                  </span>
                </div>

                <div style={{
                  background: bgCard,
                  borderRadius: '12px',
                  border: '1.5px solid #f59e0b',
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706' }}>
                      Dana Promo Tertahan (Held)
                    </span>
                    <Clock size={16} color="#d97706" />
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#d97706' }}>
                    Rp 75 <span style={{ fontSize: '0.72rem', fontWeight: 600, color: textSecondary }}>/ nota</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                    Ditahan selama masa klaim (Refund jika unclaimed).
                  </span>
                </div>

                <div style={{
                  background: bgCard,
                  borderRadius: '12px',
                  border: `1px solid ${borderColor}`,
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary }}>
                      Batas Waktu Klaim (Deadline)
                    </span>
                    <Gift size={16} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>
                    Hari D+1 23:59 WIB
                  </div>
                  <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                    Batch settlement cron otomatis jam 00:01 WIB.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div style={{
          padding: '12px 1.5rem',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isLight ? '#f8fafc' : '#0f172a'
        }}>
          <span style={{ fontSize: '0.74rem', color: textSecondary }}>
            💡 Data diperbarui otomatis secara real-time dari database POS kasir.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              background: 'transparent',
              color: textPrimary,
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
