import React, { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Package,
  AlertTriangle,
  ShieldCheck,
  CloudRain,
  Activity,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import ActionTutorialBadge from './ActionTutorialBadge';
import {
  apiGetPosForecasts,
  apiRunPosForecastBatch
} from '../../services/api';

const HORIZONS = [
  { code: 'H1_TOMORROW', label: 'Besok (H+1)', short: 'H+1 Besok' },
  { code: 'H7_NEXT_WEEK', label: 'Minggu Depan (H+1..7)', short: 'H+7 Minggu Depan' },
  { code: 'H30_NEXT_MONTH', label: 'Bulan Depan (H+1..30)', short: 'H+30 Bulan Depan' }
];

const formatIdr = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const tierLabelText = (tierCode) => {
  switch (tierCode) {
    case 'TIER_3_LGBM_QUANTILE':
      return 'Tier 3: Global LightGBM Quantile (45–180 Hari)';
    case 'TIER_3_FALLBACK_BASELINE':
      return 'Tier 3 Safety Fallback -> Statistical Baseline (WMAPE Guard)';
    case 'TIER_2_STATISTICAL_BASELINE':
      return 'Tier 2: Statistical Baseline (14–45 Hari)';
    case 'TIER_1_CATEGORY_BENCHMARK':
    default:
      return 'Tier 1: Cold-Start Benchmark Kategori & UMK (<14 Hari)';
  }
};

export default function DemandForecastPanel({
  storeInfo,
  user,
  isLight
}) {
  const activeStoreId = storeInfo?.merchantId || storeInfo?.uid || '';
  const ownerId = user?.id || storeInfo?.allOwnerStores?.[0]?.ownerUserId || null;

  const [horizon, setHorizon] = useState('H1_TOMORROW');
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const bgCard = isLight ? '#ffffff' : '#0f172a';
  const bgSub = isLight ? '#f8fafc' : '#1e293b';
  const borderColor = isLight ? '#e2e8f0' : '#334155';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#64748b' : '#94a3b8';

  const loadForecasts = useCallback(async (chosenHorizon = horizon) => {
    try {
      setLoading(true);
      const data = await apiGetPosForecasts(activeStoreId, chosenHorizon);
      setForecastData(data);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memuat prediksi permintaan SKU.' });
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, horizon]);

  useEffect(() => {
    loadForecasts(horizon);
  }, [activeStoreId, horizon, loadForecasts]);

  const handleRunBatchNow = async () => {
    try {
      setRunningBatch(true);
      const res = await apiRunPosForecastBatch({
        storeId: activeStoreId,
        ownerId,
        horizon,
        persist: true
      });
      setForecastData(res);
      setFeedback({
        type: 'success',
        text: `Batch LightGBM selesai untuk ${res.summary?.total_skus || 0} SKU (${res.diagnostic?.selected_tier || 'TIERED'}).`
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menjalankan batch ML forecasting.' });
    } finally {
      setRunningBatch(false);
    }
  };

  const diag = forecastData?.diagnostic;
  const macro = forecastData?.macro_context;
  const summary = forecastData?.summary || {
    total_skus: 0,
    total_predicted_p10: 0,
    total_predicted_p50: 0,
    total_predicted_p90: 0,
    total_projected_revenue_p50_idr: 0,
    skus_need_restock_p50: 0,
    total_restock_cost_p50_idr: 0
  };
  const items = forecastData?.items || [];
  const restockMaterials = forecastData?.restock_materials || [];

  const chartData = items.slice(0, 8).map(item => ({
    name: String(item.product_name || item.product_id).slice(0, 16),
    P10_Min: Number(item.p10_qty || 0),
    P50_Target: Number(item.p50_qty || 0),
    P90_Max: Number(item.p90_qty || 0),
    Stok_Saat_Ini: item.current_stock !== null && item.current_stock !== undefined ? Number(item.current_stock) : 0
  }));

  const isFallbackTriggered = diag?.selected_tier === 'TIER_3_FALLBACK_BASELINE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', minWidth: 0 }}>
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
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            {feedback.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
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

      {/* Header Controls + Horizon Switcher */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 900, fontSize: '0.94rem', color: textPrimary }}>
              <TrendingUp size={18} color="#2563eb" />
              <span>Demand &amp; Sales Forecasting (ML P10–P90)</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '2px' }}>
              Prediksi unit terjual rentang P10–P50–P90 menggunakan Tiered Routing + sensor `is_stockout` + jadwal Nightly Batch 01:00–03:00 WIB.
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleRunBatchNow}
              disabled={runningBatch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 13px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: runningBatch ? 'wait' : 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>{runningBatch ? 'Menjalankan Batch ML...' : 'Jalankan Batch ML Sekarang'}</span>
            </button>
            <ActionTutorialBadge
              title="Jalankan Batch Python LightGBM"
              description="Memicu microservice Python LightGBM Quantile (alpha 0.1, 0.5, 0.9) sekarang secara manual untuk menghitung ulang prediksi H+1, H+7, dan H+30 di luar jadwal rutin 01:00–03:00 WIB."
              size="sm"
              isLight={isLight}
            />
          </div>
        </div>

        {/* Horizon Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {HORIZONS.map(h => {
            const active = horizon === h.code;
            return (
              <div key={h.code} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setHorizon(h.code)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 12px',
                    borderRadius: '999px',
                    border: active ? '1.5px solid #2563eb' : `1px solid ${borderColor}`,
                    background: active ? '#2563eb' : bgSub,
                    color: active ? '#ffffff' : textPrimary,
                    fontSize: '0.75rem',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer'
                  }}
                >
                  <Calendar size={12} />
                  <span>{h.label}</span>
                </button>
              </div>
            );
          })}
          <ActionTutorialBadge
            title="Pilih Horizon Prediksi"
            description="H+1 untuk belanja stok besok, H+7 untuk mingguan, dan H+30 untuk perencanaan bulanan (dengan layer sentimen makro ritel terbatasi ±10%)."
            size="sm"
            isLight={isLight}
          />
        </div>
      </div>

      {/* Diagnostic & Tier Routing Banner */}
      {diag && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '10px'
        }}>
          <div style={{
            background: bgCard,
            border: `1px solid ${isFallbackTriggered ? '#f59e0b' : borderColor}`,
            borderRadius: '14px',
            padding: '12px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
              <ShieldCheck size={14} />
              <span>Tier Routing &amp; Walk-Forward WMAPE</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: textPrimary, marginTop: '4px' }}>
              {tierLabelText(diag.selected_tier)}
            </div>
            <div style={{ fontSize: '0.72rem', color: textSecondary, marginTop: '4px' }}>
              Histori toko: <strong>{diag.history_days} hari</strong>
              {diag.wmape_ml !== null && diag.wmape_ml !== undefined && (
                <> • WMAPE ML: <strong>{(diag.wmape_ml * 100).toFixed(1)}%</strong></>
              )}
              {diag.wmape_baseline !== null && diag.wmape_baseline !== undefined && (
                <> • Baseline: <strong>{(diag.wmape_baseline * 100).toFixed(1)}%</strong></>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: textSecondary, marginTop: '2px' }}>
              {diag.routing_reason}
            </div>
          </div>

          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '14px',
            padding: '12px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
              <Layers size={14} />
              <span>Total Estimasi Permintaan ({HORIZONS.find(h => h.code === horizon)?.short})</span>
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.15rem', color: textPrimary, marginTop: '4px' }}>
              {summary.total_predicted_p50} Unit <span style={{ fontSize: '0.76rem', color: textSecondary, fontWeight: 700 }}>(Rentang {summary.total_predicted_p10}–{summary.total_predicted_p90})</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: textSecondary, marginTop: '3px' }}>
              Proyeksi Omzet P50: <strong style={{ color: '#16a34a' }}>{formatIdr(summary.total_projected_revenue_p50_idr)}</strong> • {summary.skus_need_restock_p50} SKU perlu restock
            </div>
          </div>

          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '14px',
            padding: '12px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
              <CloudRain size={14} />
              <span>Konteks UMK Wilayah &amp; Makro</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: textPrimary, marginTop: '4px' }}>
              {macro?.city || diag.city || 'Semarang'} ({macro?.umk_tier || 'TIER_2_MEDIUM'})
            </div>
            <div style={{ fontSize: '0.72rem', color: textSecondary, marginTop: '3px' }}>
              UMK: <strong>{formatIdr(macro?.umk_idr ?? macro?.umk_monthly_idr)}</strong> • Inflasi Pangan: <strong>{macro?.food_inflation_yoy ?? macro?.food_inflation_yoy_pct ?? 3.1}%</strong> • Tren Ritel 30d: <strong>{Number(macro?.retail_index_30d_trend ?? macro?.retail_index_30d_return_pct ?? 0) >= 0 ? `+${macro?.retail_index_30d_trend ?? macro?.retail_index_30d_return_pct ?? 0}%` : `${macro?.retail_index_30d_trend ?? macro?.retail_index_30d_return_pct}%`}</strong> (Clamp H+30 maks ±10%)
            </div>
          </div>
        </div>
      )}

      {/* Visual Chart P10 vs P50 vs P90 vs Current Stock */}
      {loading ? (
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          color: textSecondary,
          fontSize: '0.82rem'
        }}>
          Menghitung &amp; memuat proyeksi permintaan Python LightGBM...
        </div>
      ) : (
        <>
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            padding: '14px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.86rem', color: textPrimary }}>
                <Activity size={16} color="#2563eb" />
                <span>Grafik Permintaan P10 / P50 / P90 vs Stok Tersedia ({HORIZONS.find(h => h.code === horizon)?.label})</span>
              </div>
              <ActionTutorialBadge
                title="Cara Membaca P10, P50, dan P90"
                description="P10 adalah skenario sepi, P50 adalah target utama paling mungkin, P90 adalah antisipasi lonjakan ramai, sedangkan bar abu-abu/biru muda menunjukkan kapasitas stok bahan baku saat ini."
                size="sm"
                isLight={isLight}
              />
            </div>

            {chartData.length === 0 ? (
              <div style={{ textAlign: 'center', color: textSecondary, padding: '1.5rem 0', fontSize: '0.8rem' }}>
                Belum ada SKU untuk ditampilkan pada toko ini.
              </div>
            ) : (
              <div style={{ width: '100%', height: '270px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                    <XAxis dataKey="name" tick={{ fill: textSecondary, fontSize: 11 }} />
                    <YAxis tick={{ fill: textSecondary, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: bgCard,
                        borderColor,
                        color: textPrimary,
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="P10_Min" name="Min (P10)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="P50_Target" name="Target (P50)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="P90_Max" name="Maks (P90)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Stok_Saat_Ini" name="Stok Tersedia" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* SKU Prediction & Restock Recommendation Table */}
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: '16px',
            padding: '14px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: textPrimary }}>
                <Package size={16} color="#ef4444" />
                <span>Prediksi Per SKU &amp; Rekomendasi Restock</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: textSecondary }}>
                Diurutkan berdasarkan prioritas kekurangan stok (shortfall P50)
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: bgSub, borderBottom: `1px solid ${borderColor}`, textAlign: 'left' }}>
                    <th style={{ padding: '8px', color: textSecondary }}>Produk / SKU</th>
                    <th style={{ padding: '8px', color: textSecondary, textAlign: 'right' }}>Min (P10)</th>
                    <th style={{ padding: '8px', color: textSecondary, textAlign: 'right' }}>Target (P50)</th>
                    <th style={{ padding: '8px', color: textSecondary, textAlign: 'right' }}>Maks (P90)</th>
                    <th style={{ padding: '8px', color: textSecondary, textAlign: 'right' }}>Stok</th>
                    <th style={{ padding: '8px', color: textSecondary, textAlign: 'right' }}>Kurang Stok</th>
                    <th style={{ padding: '8px', color: textSecondary }}>Alasan Prediksi (Explainability)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(row => {
                    const needRestock = Number(row.restock_shortfall_p50 || 0) > 0;
                    const tightP90 = !needRestock && Number(row.restock_shortfall_p90 || 0) > 0;
                    return (
                      <tr key={`${row.store_id}-${row.product_id}-${row.horizon_code}`} style={{ borderBottom: `1px solid ${borderColor}` }}>
                        <td style={{ padding: '8px', fontWeight: 700, color: textPrimary }}>
                          {row.product_name}
                          <div style={{ fontSize: '0.67rem', color: textSecondary }}>{row.category} • {formatIdr(row.unit_price_idr)}</div>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: textSecondary, fontFamily: 'var(--font-mono)' }}>
                          {row.p10_qty}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 900, color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                          {row.p50_qty}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#0284c7', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {row.p90_qty}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: textPrimary }}>
                          {row.current_stock !== null && row.current_stock !== undefined ? row.current_stock : 'Tidak dibatasi'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {needRestock ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontWeight: 800,
                              fontSize: '0.68rem'
                            }}>
                              <AlertTriangle size={11} />
                              <span>-{row.restock_shortfall_p50} (P90: -{row.restock_shortfall_p90})</span>
                            </span>
                          ) : tightP90 ? (
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: '#fef3c7',
                              color: '#b45309',
                              fontWeight: 800,
                              fontSize: '0.68rem'
                            }}>
                              Siaga P90 (-{row.restock_shortfall_p90})
                            </span>
                          ) : (
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '999px',
                              background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.2)',
                              color: '#16a34a',
                              fontWeight: 800,
                              fontSize: '0.68rem'
                            }}>
                              Aman
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px', color: textSecondary, maxWidth: '300px', lineHeight: 1.4 }}>
                          {row.explainability_summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rekomendasi Belanja Bahan Baku Gudang */}
          {restockMaterials.length > 0 && (
            <div style={{
              background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.35)'}`,
              borderRadius: '16px',
              padding: '14px',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 800, fontSize: '0.88rem', color: isLight ? '#92400e' : '#fcd34d' }}>
                  <ShoppingCart size={16} />
                  <span>Rekomendasi Belanja Bahan Baku Gudang (Berdasarkan Resep SKU)</span>
                </div>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: textPrimary }}>
                  Estimasi Modal Belanja P50: {formatIdr(summary.total_restock_cost_p50_idr)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '8px' }}>
                {restockMaterials.map(mat => (
                  <div
                    key={mat.inventory_id}
                    style={{
                      background: bgCard,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '11px',
                      padding: '10px',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: textPrimary }}>{mat.inventory_name}</div>
                    <div style={{ color: textSecondary, marginTop: '3px' }}>
                      Stok Gudang: <strong>{mat.current_stock} {mat.unit}</strong> • Butuh P50: <strong>{mat.required_p50} {mat.unit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontWeight: 800 }}>
                      <span style={{ color: '#dc2626' }}>Beli +{mat.shortfall_p50} {mat.unit}</span>
                      <span style={{ color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                        {formatIdr(mat.estimated_restock_cost_p50_idr)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
