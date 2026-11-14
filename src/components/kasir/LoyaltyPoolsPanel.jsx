import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Coins,
  Layers,
  Plus,
  Store,
  ArrowRightLeft,
  Search,
  BarChart3,
  Receipt,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  History,
  X
} from 'lucide-react';
import ActionTutorialBadge from './ActionTutorialBadge';
import {
  apiGetLoyaltyPools,
  apiCreateLoyaltyPool,
  apiUpdateLoyaltyPool,
  apiDeleteLoyaltyPool,
  apiAssignStoreLoyaltyPool,
  apiGetStorePoolHistory,
  apiGetLoyaltyPoolAnalytics,
  apiLookupPoolCustomer
} from '../../services/api';

const formatIdr = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function LoyaltyPoolsPanel({
  storeInfo,
  user,
  isLight,
  onStoreBillingUpdated
}) {
  const ownerId = user?.id || storeInfo?.allOwnerStores?.[0]?.ownerUserId || null;
  const activeStoreId = storeInfo?.merchantId || storeInfo?.uid || '';

  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState([]);
  const [ownerStores, setOwnerStores] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [notaBillingSummary, setNotaBillingSummary] = useState({
    tier1Count: 0,
    tier1TotalIdr: 0,
    tier2Count: 0,
    tier2TotalIdr: 0
  });
  const [recentNotaLedger, setRecentNotaLedger] = useState([]);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  // Form Create / Edit Pool
  const [showPoolForm, setShowPoolForm] = useState(false);
  const [editingPoolId, setEditingPoolId] = useState(null);
  const [savingPool, setSavingPool] = useState(false);
  const [confirmArchivePoolId, setConfirmArchivePoolId] = useState(null);
  const [poolForm, setPoolForm] = useState({
    name: '',
    description: '',
    min_spend_per_point: 10000,
    points_per_unit: 1,
    point_value_idr: 500,
    min_redeem_points: 1,
    max_redeem_percent: 50,
    storeIds: []
  });

  // Per-store assignment drafts
  const [assignDrafts, setAssignDrafts] = useState({});
  const [assigningStoreId, setAssigningStoreId] = useState(null);
  const [storeHistoryModal, setStoreHistoryModal] = useState(null); // { storeName, history: [] }

  // Selected pool per-store breakdown analytics
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [poolAnalytics, setPoolAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Member multi-pool lookup
  const [memberQuery, setMemberQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);

  const bgCard = isLight ? '#ffffff' : '#0f172a';
  const bgSub = isLight ? '#f8fafc' : '#1e293b';
  const borderColor = isLight ? '#e2e8f0' : '#334155';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';

  const loadPoolsData = useCallback(async (preferredPoolId = null) => {
    try {
      setLoading(true);
      const data = await apiGetLoyaltyPools(ownerId);
      const loadedPools = data.pools || [];
      const loadedStores = data.ownerStores || [];
      setPools(loadedPools);
      setOwnerStores(loadedStores);
      setRecentTransactions(data.recentPointTransactions || []);
      setNotaBillingSummary(data.notaBillingSummary || {
        tier1Count: 0,
        tier1TotalIdr: 0,
        tier2Count: 0,
        tier2TotalIdr: 0
      });
      setRecentNotaLedger(data.recentNotaLedger || []);

      const nextDrafts = {};
      loadedStores.forEach(s => {
        nextDrafts[s.id] = s.loyaltyPoolId || '';
      });
      setAssignDrafts(nextDrafts);

      const nextPoolToInspect = preferredPoolId || selectedPoolId || loadedPools[0]?.id || null;
      if (nextPoolToInspect && loadedPools.some(p => p.id === nextPoolToInspect)) {
        setSelectedPoolId(nextPoolToInspect);
      } else {
        setSelectedPoolId(loadedPools[0]?.id || null);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memuat daftar Loyalty Pool.' });
    } finally {
      setLoading(false);
    }
  }, [ownerId, selectedPoolId]);

  useEffect(() => {
    loadPoolsData();
  }, [ownerId, activeStoreId]);

  useEffect(() => {
    if (!selectedPoolId) {
      setPoolAnalytics(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingAnalytics(true);
        const res = await apiGetLoyaltyPoolAnalytics(selectedPoolId, ownerId);
        if (!cancelled) setPoolAnalytics(res);
      } catch (err) {
        if (!cancelled) setPoolAnalytics(null);
      } finally {
        if (!cancelled) setLoadingAnalytics(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPoolId, ownerId]);

  const openCreatePool = () => {
    setEditingPoolId(null);
    setPoolForm({
      name: '',
      description: '',
      min_spend_per_point: 10000,
      points_per_unit: 1,
      point_value_idr: 500,
      min_redeem_points: 1,
      max_redeem_percent: 50,
      storeIds: []
    });
    setShowPoolForm(true);
  };

  const openEditPool = (pool) => {
    setEditingPoolId(pool.id);
    setPoolForm({
      name: pool.name || '',
      description: pool.description || '',
      min_spend_per_point: Number(pool.min_spend_per_point) || 10000,
      points_per_unit: Number(pool.points_per_unit) || 1,
      point_value_idr: Number(pool.point_value_idr) || 500,
      min_redeem_points: Number(pool.min_redeem_points) || 1,
      max_redeem_percent: Number(pool.max_redeem_percent) || 50,
      storeIds: (pool.attachedStores || []).map(s => s.id)
    });
    setShowPoolForm(true);
  };

  const handleSavePool = async (e) => {
    e.preventDefault();
    if (!poolForm.name.trim()) {
      setFeedback({ type: 'error', text: 'Nama Loyalty Pool wajib diisi (contoh: Pool Kuliner Utama).' });
      return;
    }
    try {
      setSavingPool(true);
      if (editingPoolId) {
        const res = await apiUpdateLoyaltyPool(editingPoolId, {
          ...poolForm,
          ownerId
        });
        setFeedback({ type: 'success', text: res.message || 'Aturan pool berhasil diperbarui.' });
        setShowPoolForm(false);
        await loadPoolsData(editingPoolId);
      } else {
        const res = await apiCreateLoyaltyPool({
          ...poolForm,
          ownerId
        });
        setFeedback({ type: 'success', text: res.message || 'Loyalty Pool baru berhasil dibuat.' });
        setShowPoolForm(false);
        await loadPoolsData(res.pool?.id || null);
      }
      if (typeof onStoreBillingUpdated === 'function') onStoreBillingUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menyimpan Loyalty Pool.' });
    } finally {
      setSavingPool(false);
    }
  };

  const handleAssignStorePool = async (storeId) => {
    const chosen = assignDrafts[storeId] || '';
    const nextPoolId = chosen === '' ? null : chosen;
    try {
      setAssigningStoreId(storeId);
      const res = await apiAssignStoreLoyaltyPool(storeId, nextPoolId, ownerId);
      setFeedback({ type: 'success', text: res.message || 'Penghubungan toko ke pool diperbarui.' });
      await loadPoolsData(nextPoolId);
      if (typeof onStoreBillingUpdated === 'function') onStoreBillingUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memindahkan toko ke pool.' });
    } finally {
      setAssigningStoreId(null);
    }
  };

  const handleArchivePool = async (poolId) => {
    try {
      const res = await apiDeleteLoyaltyPool(poolId, ownerId);
      setFeedback({ type: 'success', text: res.message || 'Pool dinonaktifkan.' });
      setConfirmArchivePoolId(null);
      await loadPoolsData();
      if (typeof onStoreBillingUpdated === 'function') onStoreBillingUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menonaktifkan pool.' });
    }
  };

  const handleOpenStoreHistory = async (store) => {
    try {
      const res = await apiGetStorePoolHistory(store.id);
      setStoreHistoryModal({
        storeName: store.name,
        history: res.history || []
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memuat riwayat pool toko.' });
    }
  };

  const handleLookupCustomer = async (e) => {
    if (e) e.preventDefault();
    if (!memberQuery.trim()) {
      setFeedback({ type: 'error', text: 'Masukkan nomor HP/WA atau nama member untuk dicari.' });
      return;
    }
    try {
      setLookupLoading(true);
      const sid = activeStoreId || ownerStores[0]?.id || 'MTR-KASIR-MASTER';
      const res = await apiLookupPoolCustomer(sid, memberQuery.trim());
      setLookupResult(res);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mencari member Loyalty Pool.' });
    } finally {
      setLookupLoading(false);
    }
  };

  const tier1StoresCount = ownerStores.filter(s => !s.loyaltyPoolId).length;
  const tier2StoresCount = ownerStores.filter(s => Boolean(s.loyaltyPoolId)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', minWidth: 0 }}>
      {feedback && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: feedback.type === 'error'
            ? (isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.16)')
            : (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.16)'),
          color: feedback.type === 'error'
            ? (isLight ? '#991b1b' : '#fca5a5')
            : (isLight ? '#166534' : '#86efac'),
          border: `1px solid ${feedback.type === 'error' ? '#fca5a5' : '#86efac'}`,
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{feedback.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: '2px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. Ringkasan Billing Tier 1 (Rp 25) vs Tier 2 (Rp 100) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '10px'
      }}>
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '14px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase' }}>
              Tier 1 (Tanpa Fitur Poin)
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: isLight ? '#f1f5f9' : '#1e293b',
              color: textPrimary,
              border: `1px solid ${borderColor}`
            }}>
              Rp 25 / Nota
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: textPrimary }}>
            {tier1StoresCount} Toko • {notaBillingSummary.tier1Count} Nota
          </div>
          <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '3px' }}>
            Toko dengan `loyalty_pool_id = null` dikenakan tarif flat hemat Rp 25/transaksi (total tagihan tercatat: {formatIdr(notaBillingSummary.tier1TotalIdr)}).
          </div>
        </div>

        <div style={{
          background: bgCard,
          border: `1px solid ${isLight ? '#bfdbfe' : '#1d4ed8'}`,
          borderRadius: '16px',
          padding: '14px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
              Tier 2 (Shared Loyalty Pools)
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)',
              color: isLight ? '#1d4ed8' : '#93c5fd'
            }}>
              Rp 100 / Nota
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: textPrimary }}>
            {tier2StoresCount} Toko • {pools.length} Pool Aktif
          </div>
          <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '3px' }}>
            Pelanggan bebas kumpul dan tukar poin di semua cabang dalam 1 pool yang sama ({notaBillingSummary.tier2Count} nota • {formatIdr(notaBillingSummary.tier2TotalIdr)}).
          </div>
        </div>

        <div style={{
          background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(16, 185, 129, 0.3)'}`,
          borderRadius: '16px',
          padding: '14px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: isLight ? '#166534' : '#86efac', fontWeight: 800, fontSize: '0.76rem' }}>
            <ShieldCheck size={16} />
            <span>Isolasi Pool &amp; Saldo Aman</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#15803d' : '#a7f3d0', lineHeight: 1.45 }}>
            1 Owner dapat membuat banyak pool (misal Kuliner &amp; Otomotif). Jika toko dipindah ke pool lain atau dimatikan poinnya, saldo member lama tetap tersimpan di pool asal.
          </div>
        </div>
      </div>

      {/* 2. Header + Tombol Buat Loyalty Pool Baru */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '18px',
        padding: '16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 800, fontSize: '0.95rem', color: textPrimary }}>
              <Layers size={18} color="#2563eb" />
              <span>Daftar Multiple Shared Loyalty Pools</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginTop: '2px' }}>
              Atur rasio perolehan dan nilai tukar poin per grup pool, lalu hubungkan ke toko-toko milik Anda.
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={openCreatePool}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Buat Loyalty Pool Baru</span>
            </button>
            <ActionTutorialBadge
              title="Buat Loyalty Pool Bersama"
              description="Membuat grup poin baru (misal Pool Kuliner atau Pool Otomotif). Semua toko yang dihubungkan ke pool ini otomatis berbagi saldo poin pelanggan yang sama dan bertarif Rp 100/nota."
              steps={[
                'Isi nama pool (contoh: Pool Kuliner KostKu).',
                'Tentukan belanja minimal untuk dapat poin & nilai tukar 1 poin dalam Rupiah.',
                'Centang toko yang ingin langsung dihubungkan ke pool ini.'
              ]}
              size="sm"
              isLight={isLight}
            />
          </div>
        </div>

        {/* Form Create/Edit Inline Panel */}
        {showPoolForm && (
          <form
            onSubmit={handleSavePool}
            noValidate
            style={{
              background: bgSub,
              border: `1px solid ${borderColor}`,
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.84rem', color: textPrimary }}>
                {editingPoolId ? 'Edit Aturan Konversi Loyalty Pool' : 'Buat Loyalty Pool Baru'}
              </strong>
              <button
                type="button"
                onClick={() => setShowPoolForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Nama Loyalty Pool *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pool Kuliner"
                  value={poolForm.name}
                  onChange={e => setPoolForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  placeholder="Berlaku lintas Cafe & Resto cabang..."
                  value={poolForm.description}
                  onChange={e => setPoolForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Belanja per Unit Poin (Rp)
                </label>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={poolForm.min_spend_per_point}
                  onChange={e => setPoolForm(prev => ({ ...prev, min_spend_per_point: Number(e.target.value) || 10000 }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Poin Diperoleh per Kelipatan
                </label>
                <input
                  type="number"
                  min="1"
                  value={poolForm.points_per_unit}
                  onChange={e => setPoolForm(prev => ({ ...prev, points_per_unit: Number(e.target.value) || 1 }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Nilai Tukar 1 Poin (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  step="50"
                  value={poolForm.point_value_idr}
                  onChange={e => setPoolForm(prev => ({ ...prev, point_value_idr: Number(e.target.value) || 500 }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Maksimal Diskon Poin (% Tagihan)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={poolForm.max_redeem_percent}
                  onChange={e => setPoolForm(prev => ({ ...prev, max_redeem_percent: Number(e.target.value) || 50 }))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            {!editingPoolId && ownerStores.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textSecondary, marginBottom: '6px' }}>
                  Hubungkan Toko Milik Anda Langsung ke Pool Ini (Opsional):
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ownerStores.map(st => {
                    const checked = poolForm.storeIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${checked ? '#2563eb' : borderColor}`,
                          background: checked ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.2)') : bgCard,
                          color: textPrimary,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setPoolForm(prev => ({
                              ...prev,
                              storeIds: checked
                                ? prev.storeIds.filter(id => id !== st.id)
                                : [...prev.storeIds, st.id]
                            }));
                          }}
                        />
                        <span>{st.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowPoolForm(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9px',
                  border: `1px solid ${borderColor}`,
                  background: bgCard,
                  color: textSecondary,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="submit"
                  disabled={savingPool}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: savingPool ? 'wait' : 'pointer'
                  }}
                >
                  {savingPool ? 'Menyimpan...' : (editingPoolId ? 'Simpan Perubahan Pool' : 'Simpan & Aktifkan Pool')}
                </button>
                <ActionTutorialBadge
                  title="Simpan Loyalty Pool"
                  description="Menyimpan konfigurasi rasio earn/redeem pool secara seragam untuk seluruh toko yang terhubung."
                  size="sm"
                  isLight={isLight}
                />
              </div>
            </div>
          </form>
        )}

        {/* Daftar Pool Cards */}
        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: textSecondary, fontSize: '0.82rem' }}>
            Memuat data Shared Loyalty Pools...
          </div>
        ) : pools.length === 0 ? (
          <div style={{
            padding: '1.5rem',
            borderRadius: '14px',
            border: `1px dashed ${borderColor}`,
            textAlign: 'center',
            color: textSecondary,
            fontSize: '0.8rem'
          }}>
            Belum ada Shared Loyalty Pool aktif. Semua toko Anda saat ini berjalan dengan tarif <strong>Tier 1 (Rp 25/nota)</strong>. Klik <strong>Buat Loyalty Pool Baru</strong> untuk mengaktifkan poin lintas cabang (Rp 100/nota).
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '10px'
          }}>
            {pools.map(pool => {
              const isSelected = selectedPoolId === pool.id;
              return (
                <div
                  key={pool.id}
                  style={{
                    background: bgSub,
                    border: isSelected ? '2px solid #2563eb' : `1px solid ${borderColor}`,
                    borderRadius: '14px',
                    padding: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                    minWidth: 0
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: textPrimary }}>{pool.name}</div>
                      {pool.description && (
                        <div style={{ fontSize: '0.73rem', color: textSecondary }}>{pool.description}</div>
                      )}
                    </div>
                    <span style={{
                      flexShrink: 0,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)',
                      color: isLight ? '#1d4ed8' : '#93c5fd',
                      fontSize: '0.68rem',
                      fontWeight: 800
                    }}>
                      {pool.store_count || 0} Toko
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '10px',
                    background: bgCard,
                    border: `1px solid ${borderColor}`,
                    fontSize: '0.72rem'
                  }}>
                    <div>
                      <span style={{ color: textSecondary, display: 'block' }}>Aturan Earn:</span>
                      <strong style={{ color: textPrimary }}>
                        {formatIdr(pool.min_spend_per_point)} = +{pool.points_per_unit} pt
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: textSecondary, display: 'block' }}>Nilai Tukar:</span>
                      <strong style={{ color: '#16a34a' }}>
                        1 pt = {formatIdr(pool.point_value_idr)} (maks {pool.max_redeem_percent}%)
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.72rem' }}>
                    <span style={{ padding: '2px 7px', borderRadius: '6px', background: bgCard, border: `1px solid ${borderColor}`, color: textSecondary }}>
                      Member: <strong style={{ color: textPrimary }}>{pool.stats?.active_wallets || 0}</strong>
                    </span>
                    <span style={{ padding: '2px 7px', borderRadius: '6px', background: bgCard, border: `1px solid ${borderColor}`, color: textSecondary }}>
                      Saldo Poin Beredar: <strong style={{ color: '#d97706' }}>{pool.stats?.outstanding_points || 0}</strong>
                    </span>
                  </div>

                  {pool.attachedStores && pool.attachedStores.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {pool.attachedStores.map(st => (
                        <span
                          key={st.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.16)',
                            color: isLight ? '#166534' : '#86efac'
                          }}
                        >
                          <Store size={11} />
                          <span>{st.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPoolId(pool.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isSelected ? '#2563eb' : (isLight ? '#e2e8f0' : '#334155'),
                        color: isSelected ? '#ffffff' : textPrimary,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <BarChart3 size={13} />
                      <span>Performa Per Toko</span>
                    </button>
                    <ActionTutorialBadge
                      title="Lihat Performa Poin Per Toko"
                      description="Menampilkan rincian transaksi EARN dan REDEEM berdasarkan store_id asal di dalam Loyalty Pool ini."
                      size="sm"
                      isLight={isLight}
                    />

                    <button
                      type="button"
                      onClick={() => openEditPool(pool)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 9px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: bgCard,
                        color: textPrimary,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    {confirmArchivePoolId === pool.id ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleArchivePool(pool.id)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: '7px',
                            border: 'none',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Ya, Nonaktifkan
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmArchivePoolId(null)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '7px',
                            border: `1px solid ${borderColor}`,
                            background: bgCard,
                            color: textSecondary,
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmArchivePoolId(pool.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 9px',
                          borderRadius: '8px',
                          border: `1px solid ${borderColor}`,
                          background: bgCard,
                          color: '#ef4444',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>Nonaktifkan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Penghubungan Toko -> Pool (1 Toko Maksimal 1 Pool atau Null Rp 25/nota) */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '18px',
        padding: '16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 800, fontSize: '0.92rem', color: textPrimary }}>
              <ArrowRightLeft size={17} color="#0284c7" />
              <span>Penghubungan Toko ke Loyalty Pool (1 Toko = Maks. 1 Pool)</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '2px' }}>
              Pilih "Tanpa Poin" untuk tarif Tier 1 (Rp 25/nota) atau hubungkan ke pool untuk mengaktifkan poin bersama Tier 2 (Rp 100/nota).
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ownerStores.map(st => {
            const draftVal = assignDrafts[st.id] ?? '';
            const currentVal = st.loyaltyPoolId || '';
            const isTier2 = Boolean(st.loyaltyPoolId);
            return (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: bgSub,
                  border: `1px solid ${borderColor}`
                }}
              >
                <div style={{ minWidth: '180px', flex: '1 1 200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.84rem', color: textPrimary }}>{st.name}</strong>
                    <span style={{
                      fontSize: '0.67rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: isTier2
                        ? (isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)')
                        : (isLight ? '#f1f5f9' : '#334155'),
                      color: isTier2 ? (isLight ? '#1d4ed8' : '#93c5fd') : textSecondary
                    }}>
                      {isTier2 ? `Tier 2 • Rp 100/nota (${st.loyaltyPoolName})` : 'Tier 1 • Rp 25/nota (Tanpa Poin)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: textSecondary, marginTop: '2px' }}>
                    {st.location}{st.city ? ` • ${st.city}` : ''} • Saldo Nota: {formatIdr(st.saldoNota)} ({st.kuotaNota} nota)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: '1 1 260px', justifyContent: 'flex-end' }}>
                  <select
                    aria-label={`Pilih Loyalty Pool untuk ${st.name}`}
                    value={draftVal}
                    onChange={e => setAssignDrafts(prev => ({ ...prev, [st.id]: e.target.value }))}
                    style={{
                      flex: '1 1 180px',
                      minWidth: '170px',
                      padding: '7px 10px',
                      borderRadius: '9px',
                      border: `1px solid ${borderColor}`,
                      background: bgCard,
                      color: textPrimary,
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    <option value="">Tanpa Fitur Poin — Tier 1 (Rp 25/nota)</option>
                    {pools.map(p => (
                      <option key={p.id} value={p.id}>
                        Pool "{p.name}" — Tier 2 (Rp 100/nota)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAssignStorePool(st.id)}
                    disabled={assigningStoreId === st.id || String(draftVal) === String(currentVal)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '9px',
                      border: 'none',
                      background: String(draftVal) === String(currentVal) ? (isLight ? '#cbd5e1' : '#334155') : '#2563eb',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: assigningStoreId === st.id || String(draftVal) === String(currentVal) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {assigningStoreId === st.id ? 'Menyimpan...' : 'Terapkan'}
                  </button>
                  <ActionTutorialBadge
                    title="Ubah Pool Toko"
                    description="Menghubungkan atau memindahkan toko ke pool lain. Saldo poin member pada pool sebelumnya tidak akan terhapus."
                    size="sm"
                    isLight={isLight}
                  />

                  <button
                    type="button"
                    onClick={() => handleOpenStoreHistory(st)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 9px',
                      borderRadius: '9px',
                      border: `1px solid ${borderColor}`,
                      background: bgCard,
                      color: textSecondary,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Riwayat perpindahan pool"
                  >
                    <History size={13} />
                    <span>Riwayat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Analitik Performa Poin Per Toko & Pencarian Saldo Lintas Pool */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '12px'
      }}>
        {/* Per-Store Breakdown */}
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '18px',
          padding: '16px',
          boxSizing: 'border-box',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: textPrimary }}>
              <BarChart3 size={16} color="#2563eb" />
              <span>Laporan Poin Per Toko ({poolAnalytics?.pool?.name || 'Pilih Pool'})</span>
            </div>
          </div>

          {loadingAnalytics ? (
            <div style={{ fontSize: '0.78rem', color: textSecondary, padding: '1rem 0' }}>Memuat analitik pool...</div>
          ) : !poolAnalytics ? (
            <div style={{ fontSize: '0.78rem', color: textSecondary, padding: '1rem 0' }}>
              Pilih pool di atas untuk melihat rincian poin EARN &amp; REDEEM per cabang asal transaksi.
            </div>
          ) : (poolAnalytics.perStoreBreakdown || []).length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: textSecondary, padding: '1rem 0' }}>
              Belum ada transaksi poin (`point_transactions`) di pool "{poolAnalytics.pool?.name}".
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                <thead>
                  <tr style={{ background: bgSub, borderBottom: `1px solid ${borderColor}`, textAlign: 'left' }}>
                    <th style={{ padding: '7px 8px', color: textSecondary }}>Toko Asal</th>
                    <th style={{ padding: '7px 8px', color: textSecondary, textAlign: 'right' }}>+ Earn</th>
                    <th style={{ padding: '7px 8px', color: textSecondary, textAlign: 'right' }}>- Redeem</th>
                    <th style={{ padding: '7px 8px', color: textSecondary, textAlign: 'right' }}>Nilai Diskon</th>
                  </tr>
                </thead>
                <tbody>
                  {poolAnalytics.perStoreBreakdown.map(row => (
                    <tr key={row.store_id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: textPrimary }}>
                        {row.store_name}
                        <div style={{ fontSize: '0.66rem', color: textSecondary }}>{row.earn_tx_count + row.redeem_tx_count} transaksi</div>
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>
                        +{row.earned_points}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>
                        -{row.redeemed_points}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: textPrimary }}>
                        {formatIdr(row.redeem_discount_idr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Multi-Pool Customer Lookup */}
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '18px',
          padding: '16px',
          boxSizing: 'border-box',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: textPrimary, marginBottom: '8px' }}>
            <Coins size={16} color="#d97706" />
            <span>Cek Saldo Pelanggan Lintas Loyalty Pool</span>
          </div>

          <form onSubmit={handleLookupCustomer} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="No. WA / Nama member..."
              value={memberQuery}
              onChange={e => setMemberQuery(e.target.value)}
              style={{
                flex: '1 1 160px',
                minWidth: 0,
                padding: '8px 10px',
                borderRadius: '9px',
                border: `1px solid ${borderColor}`,
                background: bgSub,
                color: textPrimary,
                fontSize: '0.78rem'
              }}
            />
            <button
              type="submit"
              disabled={lookupLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '9px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              <Search size={13} />
              <span>{lookupLoading ? 'Mencari...' : 'Cek Saldo Pool'}</span>
            </button>
            <ActionTutorialBadge
              title="Cek Saldo Lintas Pool"
              description="Menampilkan rincian saldo poin pelanggan pada setiap pool yang dimiliki owner (saldo pool tetap aman walau toko berpindah pool)."
              size="sm"
              isLight={isLight}
            />
          </form>

          {lookupResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem' }}>
              {lookupResult.found && lookupResult.customer ? (
                <>
                  <div style={{ padding: '8px 10px', borderRadius: '9px', background: bgSub, border: `1px solid ${borderColor}` }}>
                    <strong style={{ color: textPrimary }}>{lookupResult.customer.name}</strong>
                    <span style={{ color: textSecondary, marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                      {lookupResult.customer.phone_display}
                    </span>
                  </div>
                  {(lookupResult.allPoolWallets || []).length === 0 ? (
                    <div style={{ color: textSecondary }}>Member belum memiliki saldo poin di pool mana pun.</div>
                  ) : (
                    lookupResult.allPoolWallets.map(w => (
                      <div
                        key={w.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 10px',
                          borderRadius: '9px',
                          background: bgSub,
                          border: w.is_active_pool_here ? '1.5px solid #16a34a' : `1px solid ${borderColor}`
                        }}
                      >
                        <div>
                          <strong style={{ color: textPrimary }}>{w.pool_name}</strong>
                          <div style={{ fontSize: '0.67rem', color: textSecondary }}>
                            Nilai tukar: {formatIdr(w.point_value_idr)}/poin {w.is_active_pool_here ? '• Aktif di toko ini' : ''}
                          </div>
                        </div>
                        <span style={{ fontWeight: 900, color: '#16a34a', fontSize: '0.84rem' }}>
                          {w.balance_points} Poin
                        </span>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div style={{ color: textSecondary }}>
                  Member belum terdaftar. Saldo poin pool akan dibuat otomatis saat transaksi pertama di toko Tier 2.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Ledger Nota Billing Terbaru (Rp 25 vs Rp 100) */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '18px',
        padding: '16px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 800, fontSize: '0.88rem', color: textPrimary, marginBottom: '10px' }}>
          <Receipt size={16} color="#16a34a" />
          <span>Ledger Penagihan Nota Terbaru (Tier 1 Rp 25 vs Tier 2 Rp 100)</span>
        </div>
        {recentNotaLedger.length === 0 ? (
          <div style={{ fontSize: '0.78rem', color: textSecondary }}>
            Belum ada potongan nota tercatat di `nota_billing_ledger`. Lakukan transaksi di kasir untuk melihat pemisahan tarif Rp 25 vs Rp 100.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
              <thead>
                <tr style={{ background: bgSub, borderBottom: `1px solid ${borderColor}`, textAlign: 'left' }}>
                  <th style={{ padding: '7px 8px', color: textSecondary }}>Invoice</th>
                  <th style={{ padding: '7px 8px', color: textSecondary }}>Toko</th>
                  <th style={{ padding: '7px 8px', color: textSecondary }}>Tier Billing</th>
                  <th style={{ padding: '7px 8px', color: textSecondary, textAlign: 'right' }}>Nominal</th>
                  <th style={{ padding: '7px 8px', color: textSecondary, textAlign: 'right' }}>Saldo Setelah</th>
                </tr>
              </thead>
              <tbody>
                {recentNotaLedger.slice(0, 12).map(entry => (
                  <tr key={entry.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: textPrimary }}>
                      {entry.invoice_number || entry.id}
                    </td>
                    <td style={{ padding: '7px 8px', color: textPrimary }}>{entry.store_name}</td>
                    <td style={{ padding: '7px 8px' }}>
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: '999px',
                        fontSize: '0.67rem',
                        fontWeight: 800,
                        background: entry.entry_type === 'NOTA_TIER_2'
                          ? (isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)')
                          : entry.entry_type === 'TOP_UP'
                            ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.2)')
                            : (isLight ? '#f1f5f9' : '#334155'),
                        color: entry.entry_type === 'NOTA_TIER_2'
                          ? (isLight ? '#1d4ed8' : '#93c5fd')
                          : entry.entry_type === 'TOP_UP'
                            ? '#16a34a'
                            : textSecondary
                      }}>
                        {entry.entry_type === 'NOTA_TIER_2'
                          ? `Tier 2 (${entry.loyalty_pool_name || 'Pool'})`
                          : entry.entry_type === 'TOP_UP'
                            ? 'Top Up Nota'
                            : 'Tier 1 Flat'}
                      </span>
                    </td>
                    <td style={{
                      padding: '7px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: Number(entry.amount_idr) >= 0 ? '#16a34a' : '#dc2626'
                    }}>
                      {Number(entry.amount_idr) >= 0 ? `+${formatIdr(entry.amount_idr)}` : `-${formatIdr(Math.abs(Number(entry.amount_idr)))}`}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: textPrimary }}>
                      {formatIdr(entry.balance_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Riwayat Perpindahan Pool per Toko */}
      {storeHistoryModal && (
        <div
          onClick={() => setStoreHistoryModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '18px',
              padding: '18px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ color: textPrimary, fontSize: '0.92rem' }}>
                Riwayat Loyalty Pool: {storeHistoryModal.storeName}
              </strong>
              <button
                type="button"
                onClick={() => setStoreHistoryModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}
              >
                <X size={16} />
              </button>
            </div>
            {(storeHistoryModal.history || []).length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: textSecondary, padding: '12px 0' }}>
                Toko ini belum memiliki riwayat perpindahan pool (masih berada di status default Tier 1 Rp 25/nota).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {storeHistoryModal.history.map(h => (
                  <div
                    key={h.id}
                    style={{
                      padding: '9px 11px',
                      borderRadius: '10px',
                      background: bgSub,
                      border: `1px solid ${borderColor}`,
                      fontSize: '0.76rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: textPrimary }}>{h.note}</div>
                    <div style={{ color: textSecondary, fontSize: '0.68rem', marginTop: '3px' }}>
                      {new Date(h.changed_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
