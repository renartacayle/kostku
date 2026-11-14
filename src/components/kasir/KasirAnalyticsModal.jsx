import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import ActionTutorialBadge from './ActionTutorialBadge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Store,
  Users,
  Utensils,
  RefreshCw,
  X,
  ShoppingBag,
  Calendar,
  SlidersHorizontal,
  Layers,
  RotateCcw,
  Tag,
  Wallet,
  ArrowLeft,
  Filter,
  Download,
  FileSpreadsheet,
  Clock,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

const CHART_COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#14b8a6'
];

const DATE_PRESETS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'week', label: 'Minggu Ini' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'year', label: 'Tahun Ini' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom Tanggal' }
];

const FILTER_MODES = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'item', label: 'Per Item', icon: Utensils },
  { id: 'category', label: 'Per Kategori', icon: Tag },
  { id: 'store', label: 'Per Toko', icon: Store },
  { id: 'employee', label: 'Per Karyawan', icon: Users },
  { id: 'combine', label: 'Combine', icon: SlidersHorizontal }
];

const METRICS = [
  { id: 'revenue', label: 'Omset (Rp)' },
  { id: 'qty', label: 'Qty Terjual' },
  { id: 'orders', label: 'Transaksi' }
];

const formatIDR = (val) => `Rp ${Math.round(Number(val) || 0).toLocaleString('id-ID')}`;

const formatAxisCompact = (val, metric) => {
  const num = Number(val) || 0;
  if (metric !== 'revenue') return num.toLocaleString('id-ID');
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}jt`;
  if (num >= 1000) return `${Math.round(num / 1000)}rb`;
  return String(num);
};

const truncateText = (txt, maxLen = 16) => {
  const str = String(txt || '-');
  return str.length > maxLen ? `${str.slice(0, maxLen - 1)}...` : str;
};

export default function KasirAnalyticsModal({
  isOpen,
  onClose,
  isLight,
  analyticsData,
  loadingAnalytics,
  onRefresh,
  filters,
  onFilterChange,
  isFullPage = false
}) {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [metric, setMetric] = useState('revenue'); // 'revenue' | 'qty' | 'orders'
  const [exportFeedback, setExportFeedback] = useState(null);

  if (!isOpen) return null;

  const activeFilters = filters || {
    range: 'all',
    startDate: '',
    endDate: '',
    filterMode: 'all',
    storeId: 'all',
    category: 'all',
    itemId: 'all',
    cashierId: 'all'
  };

  const bgModal = isLight ? '#ffffff' : '#0f172a';
  const bgCard = isLight ? '#ffffff' : '#1e293b';
  const bgSubtle = isLight ? '#f8fafc' : '#0f172a';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const gridStroke = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.14)';

  const summary = analyticsData?.summary || {
    totalOrdersAll: 0,
    totalGrossOmset: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
    activeBranchesCount: 0,
    totalMenuItems: 0
  };

  const filterOptions = analyticsData?.filterOptions || {
    stores: [],
    categories: [],
    items: [],
    employees: []
  };

  const timelineSeries = analyticsData?.timelineSeries || [];
  const seriesMeta = analyticsData?.seriesMeta || [];
  const breakdowns = analyticsData?.breakdowns || {};
  const byItem = (breakdowns.byItem || analyticsData?.perMenu || []).slice(0, 12);
  const byCategory = breakdowns.byCategory || [];
  const byStore = breakdowns.byStore || analyticsData?.perStore || [];
  const byEmployee = breakdowns.byEmployee || analyticsData?.perCashier || [];
  const combineMatrix = breakdowns.combineMatrix || [];
  const paymentSplit = analyticsData?.paymentSplit || [];
  const peakHours = analyticsData?.peakHours || [];
  const peakHourSummary = analyticsData?.peakHourSummary || {};
  const comparison = analyticsData?.comparison || { available: false };

  const renderDeltaBadge = (deltaPct) => {
    if (!comparison?.available || deltaPct === undefined || deltaPct === null) return null;
    const val = Number(deltaPct);
    const isPos = val > 0;
    const isNeg = val < 0;
    const bg = isPos
      ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)')
      : isNeg
        ? (isLight ? '#fff1f2' : 'rgba(244, 63, 94, 0.16)')
        : (isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.14)');
    const fg = isPos
      ? (isLight ? '#047857' : '#34d399')
      : isNeg
        ? (isLight ? '#be123c' : '#fb7185')
        : textSecondary;
    return (
      <span
        data-testid="kpi-delta-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          marginTop: '4px',
          padding: '2px 7px',
          borderRadius: '999px',
          background: bg,
          color: fg,
          fontSize: '0.67rem',
          fontWeight: 800
        }}
      >
        {isPos ? <ArrowUpRight size={11} /> : isNeg ? <ArrowDownRight size={11} /> : <Minus size={11} />}
        <span>{isPos ? `+${val}%` : `${val}%`} {comparison.label}</span>
      </span>
    );
  };

  const buildExportSections = () => {
    const presetLabel = DATE_PRESETS.find(d => d.id === activeFilters.range)?.label || activeFilters.range || 'All Time';
    const modeLabel = FILTER_MODES.find(m => m.id === activeFilters.filterMode)?.label || activeFilters.filterMode || 'All';
    const summaryRows = [
      { Metrik: 'Periode', Nilai: presetLabel },
      { Metrik: 'Rentang Tanggal', Nilai: analyticsData?.appliedFilters?.startDate ? `${analyticsData.appliedFilters.startDate} s/d ${analyticsData.appliedFilters.endDate}` : 'Semua Waktu' },
      { Metrik: 'Mode Filter', Nilai: modeLabel },
      { Metrik: 'Total Omset (Rp)', Nilai: Number(summary.totalGrossOmset || 0) },
      { Metrik: 'Total Transaksi (Nota)', Nilai: Number(summary.totalOrdersAll || 0) },
      { Metrik: 'Item Terjual (Porsi)', Nilai: Number(summary.totalItemsSold || 0) },
      { Metrik: 'Rata-Rata Order (Rp)', Nilai: Number(summary.averageOrderValue || 0) },
      ...(comparison?.available ? [
        { Metrik: `Perbandingan Omset (${comparison.label})`, Nilai: `${comparison.revenueDeltaPct >= 0 ? '+' : ''}${comparison.revenueDeltaPct}%` },
        { Metrik: `Perbandingan Transaksi (${comparison.label})`, Nilai: `${comparison.ordersDeltaPct >= 0 ? '+' : ''}${comparison.ordersDeltaPct}%` }
      ] : [])
    ];
    return {
      Ringkasan: summaryRows,
      Timeline: timelineSeries.map(t => ({ Waktu: t.label, Omset_Rp: Number(t.revenue || 0), Transaksi: Number(t.orders || 0), Qty: Number(t.qty || 0) })),
      Metode_Pembayaran: paymentSplit.map(p => ({ Metode: p.label, Transaksi: Number(p.ordersCount || 0), Omset_Rp: Number(p.revenue || 0), Persentase_Persen: Number(p.pct || 0) })),
      Jam_Ramai: peakHours.map(h => ({ Jam_WIB: h.label, Transaksi: Number(h.orders || 0), Omset_Rp: Number(h.revenue || 0), Qty: Number(h.qty || 0) })),
      Per_Item: byItem.map(it => ({ Nama_Menu: it.name, Kategori: it.category || '-', Qty: Number(it.qty || 0), Omset_Rp: Number(it.revenue || 0), Order: Number(it.ordersCount || 0) })),
      Per_Kategori: byCategory.map(c => ({ Kategori: c.name, Qty: Number(c.qty || 0), Omset_Rp: Number(c.revenue || 0), Order: Number(c.ordersCount || 0) })),
      Per_Toko: byStore.map(s => ({ Toko_Cabang: s.name, Transaksi: Number(s.ordersCount || 0), Omset_Rp: Number(s.revenue || 0), Tunai_Rp: Number(s.cashRevenue || 0), QRIS_Rp: Number(s.qrisRevenue || 0) })),
      Per_Karyawan: byEmployee.map(e => ({ Karyawan: e.name, Role: e.role || '-', Transaksi: Number(e.ordersCount || 0), Omset_Rp: Number(e.revenue || 0) }))
    };
  };

  const getExportFilename = (ext) => {
    const stamp = new Date().toISOString().slice(0, 10);
    return `statistik-pos-${activeFilters.range || 'all'}-${activeFilters.filterMode || 'all'}-${stamp}.${ext}`;
  };

  const handleExportCsv = () => {
    if (!analyticsData) {
      setExportFeedback({ type: 'error', text: 'Data statistik belum tersedia untuk diexport.' });
      return;
    }
    try {
      const sections = buildExportSections();
      const lines = [];
      const escapeCsv = (v) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      Object.entries(sections).forEach(([title, rows]) => {
        if (!rows || rows.length === 0) return;
        lines.push(`[${title}]`);
        const headers = Object.keys(rows[0]);
        lines.push(headers.map(escapeCsv).join(','));
        rows.forEach(r => lines.push(headers.map(h => escapeCsv(r[h])).join(',')));
        lines.push('');
      });
      const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getExportFilename('csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportFeedback({ type: 'success', text: `Laporan CSV (${getExportFilename('csv')}) berhasil diunduh!` });
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err) {
      setExportFeedback({ type: 'error', text: 'Gagal export CSV: ' + (err.message || 'Kesalahan') });
    }
  };

  const handleExportExcel = () => {
    if (!analyticsData) {
      setExportFeedback({ type: 'error', text: 'Data statistik belum tersedia untuk diexport.' });
      return;
    }
    try {
      const sections = buildExportSections();
      const wb = XLSX.utils.book_new();
      Object.entries(sections).forEach(([sheetName, rows]) => {
        const safeRows = rows && rows.length > 0 ? rows : [{ Info: 'Tidak ada data pada filter ini' }];
        const ws = XLSX.utils.json_to_sheet(safeRows);
        XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
      });
      const filename = getExportFilename('xlsx');
      XLSX.writeFile(wb, filename);
      setExportFeedback({ type: 'success', text: `Laporan Excel (${filename}) berhasil diunduh!` });
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err) {
      setExportFeedback({ type: 'error', text: 'Gagal export Excel: ' + (err.message || 'Kesalahan') });
    }
  };

  const updateFilters = (patch) => {
    const next = { ...activeFilters, ...patch };
    if (onFilterChange) {
      onFilterChange(next);
    } else if (onRefresh) {
      onRefresh(next);
    }
  };

  const handleModeSelect = (modeId) => {
    if (modeId === 'all') {
      updateFilters({
        filterMode: 'all',
        storeId: 'all',
        category: 'all',
        itemId: 'all',
        cashierId: 'all'
      });
    } else {
      updateFilters({ filterMode: modeId });
    }
  };

  const handleResetFilters = () => {
    updateFilters({
      range: 'all',
      startDate: '',
      endDate: '',
      filterMode: 'all',
      storeId: 'all',
      category: 'all',
      itemId: 'all',
      cashierId: 'all'
    });
  };

  const metricLabel = METRICS.find(m => m.id === metric)?.label || 'Omset (Rp)';
  const formatMetricValue = (val) => {
    if (metric === 'revenue') return formatIDR(val);
    if (metric === 'qty') return `${Number(val || 0).toLocaleString('id-ID')} item`;
    return `${Number(val || 0).toLocaleString('id-ID')} trx`;
  };

  const renderTooltipContent = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div style={{
        background: isLight ? '#ffffff' : '#0f172a',
        border: `1px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '10px 12px',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)',
        color: textPrimary,
        fontSize: '0.76rem',
        maxWidth: '240px'
      }}>
        <div style={{ fontWeight: 800, marginBottom: '6px', color: textPrimary }}>
          {label}
        </div>
        {payload.map((entry, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '3px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: textSecondary }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '99px', background: entry.color || '#2563eb' }} />
              <span>{truncateText(entry.name, 20)}</span>
            </span>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: textPrimary }}>
              {entry.dataKey === 'revenue' || String(entry.dataKey).startsWith('series_')
                ? formatIDR(entry.value)
                : entry.dataKey === 'qty'
                  ? `${Number(entry.value || 0).toLocaleString('id-ID')} item`
                  : entry.dataKey === 'orders' || entry.dataKey === 'ordersCount'
                    ? `${Number(entry.value || 0).toLocaleString('id-ID')} trx`
                    : formatMetricValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Pick dimension dataset for non-All single-focus modes
  const focusedData = useMemo(() => {
    if (activeFilters.filterMode === 'item') {
      return {
        title: 'Grafik Penjualan Per Item Menu',
        subtitle: 'Peringkat item berdasarkan rentang tanggal & filter aktif',
        rows: byItem.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount }))
      };
    }
    if (activeFilters.filterMode === 'category') {
      return {
        title: 'Grafik Penjualan Per Kategori',
        subtitle: 'Performa & porsi kontribusi tiap kategori menu',
        rows: byCategory.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount }))
      };
    }
    if (activeFilters.filterMode === 'store') {
      return {
        title: 'Grafik Performa Per Toko / Cabang',
        subtitle: 'Perbandingan omset dan volume transaksi antar cabang toko',
        rows: byStore.map(x => ({
          name: x.name,
          revenue: x.revenue,
          qty: x.qty,
          orders: x.ordersCount,
          cashRevenue: x.cashRevenue || 0,
          qrisRevenue: x.qrisRevenue || 0
        }))
      };
    }
    if (activeFilters.filterMode === 'employee') {
      return {
        title: 'Grafik Performa Per Karyawan / Kasir',
        subtitle: 'Total omset dan jumlah transaksi yang diproses per karyawan',
        rows: byEmployee.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount }))
      };
    }
    if (activeFilters.filterMode === 'combine') {
      return {
        title: 'Grafik Kombinasi Multi-Filter (Combine)',
        subtitle: 'Hasil silang Toko x Kategori x Item x Karyawan pada periode terpilih',
        rows: combineMatrix.slice(0, 10).map(x => ({ name: x.label, revenue: x.revenue, qty: x.qty, orders: x.ordersCount }))
      };
    }
    return null;
  }, [activeFilters.filterMode, byItem, byCategory, byStore, byEmployee, combineMatrix]);

  const activeFilterBadges = useMemo(() => {
    const badges = [];
    if (activeFilters.storeId && activeFilters.storeId !== 'all') {
      const st = filterOptions.stores.find(s => String(s.id) === String(activeFilters.storeId));
      badges.push({ key: 'storeId', label: `Toko: ${st?.name || activeFilters.storeId}` });
    }
    if (activeFilters.category && activeFilters.category !== 'all') {
      badges.push({ key: 'category', label: `Kategori: ${activeFilters.category}` });
    }
    if (activeFilters.itemId && activeFilters.itemId !== 'all') {
      const it = filterOptions.items.find(i => String(i.id) === String(activeFilters.itemId));
      badges.push({ key: 'itemId', label: `Item: ${it?.name || activeFilters.itemId}` });
    }
    if (activeFilters.cashierId && activeFilters.cashierId !== 'all') {
      const emp = filterOptions.employees.find(e => String(e.id) === String(activeFilters.cashierId));
      badges.push({ key: 'cashierId', label: `Karyawan: ${emp?.name || activeFilters.cashierId}` });
    }
    return badges;
  }, [activeFilters, filterOptions]);

  const showMultiSeriesOnTimeline =
    metric === 'revenue' &&
    seriesMeta.length > 1 &&
    ['item', 'category', 'store', 'employee'].includes(activeFilters.filterMode);

  const renderEmptyGraph = (msg = 'Belum ada transaksi pada rentang tanggal & filter yang dipilih.') => (
    <div style={{
      minHeight: '220px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '1.5rem',
      textAlign: 'center',
      color: textSecondary,
      background: bgSubtle,
      borderRadius: '14px',
      border: `1px dashed ${borderColor}`
    }}>
      <BarChart3 size={28} color={textSecondary} />
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary }}>{msg}</div>
      {(activeFilterBadges.length > 0 || activeFilters.range !== 'all') && (
        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            padding: '6px 12px',
            borderRadius: '9px',
            border: `1px solid ${borderColor}`,
            background: bgCard,
            color: '#2563eb',
            fontWeight: 800,
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <RotateCcw size={13} />
          <span>Reset Filter &amp; Tanggal</span>
        </button>
      )}
    </div>
  );

  const renderSelectControl = (label, icon, value, onChange, optionsList, allLabel) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
      <label style={{
        fontSize: '0.7rem',
        fontWeight: 800,
        color: textSecondary,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        textTransform: 'uppercase'
      }}>
        {icon}
        <span>{label}</span>
      </label>
      <select
        value={value || 'all'}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: '10px',
          border: `1px solid ${borderColor}`,
          background: bgSubtle,
          color: textPrimary,
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
      >
        <option value="all">{allLabel}</option>
        {optionsList.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderHorizontalRankChart = (dataRows, chartMetric = metric, height = 270) => {
    const cleanRows = (dataRows || []).filter(r => (Number(r[chartMetric]) || 0) > 0).slice(0, 8);
    if (cleanRows.length === 0) return renderEmptyGraph();
    return (
      <div style={{ width: '100%', height: `${height}px`, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={cleanRows} layout="vertical" margin={{ top: 6, right: 16, left: 4, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis
              type="number"
              stroke={textSecondary}
              fontSize={11}
              tickFormatter={(v) => formatAxisCompact(v, chartMetric)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={118}
              stroke={textSecondary}
              fontSize={11}
              tickFormatter={(v) => truncateText(v, 15)}
            />
            <Tooltip content={renderTooltipContent} />
            <Bar dataKey={chartMetric} name={metricLabel} radius={[0, 6, 6, 0]} maxBarSize={24}>
              {cleanRows.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieShareChart = (dataRows, chartMetric = metric, height = 270) => {
    const cleanRows = (dataRows || []).filter(r => (Number(r[chartMetric]) || 0) > 0).slice(0, 7);
    if (cleanRows.length === 0) return renderEmptyGraph();
    const total = cleanRows.reduce((s, r) => s + (Number(r[chartMetric]) || 0), 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: 0 }}>
        <div style={{ width: '100%', height: `${height - 44}px`, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={height - 44}>
            <PieChart>
              <Pie
                data={cleanRows}
                dataKey={chartMetric}
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="48%"
                outerRadius="82%"
                paddingAngle={2}
              >
                {cleanRows.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderTooltipContent} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {cleanRows.map((row, idx) => {
            const pct = total > 0 ? Math.round(((Number(row[chartMetric]) || 0) / total) * 100) : 0;
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: bgSubtle,
                  border: `1px solid ${borderColor}`,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: textPrimary
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                <span>{truncateText(row.name, 16)} ({pct}%)</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const headerSection = (
    <div style={{
      padding: isFullPage ? '0 0 12px' : '16px 1.5rem',
      borderBottom: `1px solid ${borderColor}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px',
      background: isFullPage ? 'transparent' : bgModal
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          flexShrink: 0
        }}>
          <BarChart3 size={20} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: isFullPage ? '1.15rem' : '1.05rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.3px' }}>
            Grafik Statistik Penjualan Multi-Filter
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: textSecondary }}>
            Visualisasi grafik tren &amp; perbandingan per item, kategori, toko, karyawan, maupun gabungan filter &amp; rentang tanggal.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loadingAnalytics || !analyticsData}
            style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              padding: '7px 11px',
              cursor: loadingAnalytics || !analyticsData ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: textPrimary,
              fontSize: '0.75rem',
              fontWeight: 700
            }}
            title="Download Laporan Statistik Terfilter (.csv)"
          >
            <Download size={13} color="#2563eb" />
            <span>Export CSV</span>
          </button>
          <ActionTutorialBadge
            isLight={isLight}
            size="sm"
            title="Export CSV"
            description="Mengunduh data statistik sesuai filter tanggal & dimensi yang sedang aktif ke format CSV (UTF-8)."
            steps={['Atur rentang tanggal dan filter grafik yang diinginkan.', 'Klik Export CSV lalu buka file di Excel atau Google Sheets.']}
          />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loadingAnalytics || !analyticsData}
            style={{
              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '10px',
              padding: '7px 11px',
              cursor: loadingAnalytics || !analyticsData ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: isLight ? '#047857' : '#34d399',
              fontSize: '0.75rem',
              fontWeight: 800
            }}
            title="Download Workbook Statistik Lengkap (.xlsx)"
          >
            <FileSpreadsheet size={13} />
            <span>Export Excel</span>
          </button>
          <ActionTutorialBadge
            isLight={isLight}
            size="sm"
            title="Export Excel (.xlsx)"
            description="Mengunduh workbook Excel multi-sheet berisi Ringkasan, Timeline, Metode Pembayaran, Jam Ramai, Item, Kategori, Toko, dan Karyawan."
          />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => (onRefresh ? onRefresh(activeFilters) : null)}
            disabled={loadingAnalytics}
            style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              padding: '7px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: textPrimary,
              fontSize: '0.76rem',
              fontWeight: 700
            }}
          >
            <RefreshCw size={13} className={loadingAnalytics ? 'animate-spin' : ''} />
            <span>{loadingAnalytics ? 'Memuat...' : 'Refresh Grafik'}</span>
          </button>
          <ActionTutorialBadge
            isLight={isLight}
            size="sm"
            title="Refresh Grafik"
            description="Memuat ulang angka omset, transaksi, dan grafik terbaru langsung dari database server."
          />
        </div>
        {isFullPage ? (
          onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: '10px',
                padding: '7px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: textPrimary,
                fontSize: '0.76rem',
                fontWeight: 700
              }}
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Keuangan</span>
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
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
        )}
      </div>
    </div>
  );

  const showCategorySelect = ['category', 'combine'].includes(activeFilters.filterMode);
  const showItemSelect = ['item', 'combine'].includes(activeFilters.filterMode);
  const showStoreSelect = ['store', 'combine'].includes(activeFilters.filterMode);
  const showEmployeeSelect = ['employee', 'combine'].includes(activeFilters.filterMode);

  const bodySection = (
    <div style={{
      padding: isFullPage ? '0' : '1.25rem',
      overflowY: isFullPage ? 'visible' : 'auto',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      minWidth: 0
    }}>
      {exportFeedback && (
        <div
          role="status"
          style={{
            padding: '9px 14px',
            borderRadius: '12px',
            background: exportFeedback.type === 'error'
              ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.16)')
              : (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)'),
            border: `1px solid ${exportFeedback.type === 'error' ? '#ef4444' : '#10b981'}`,
            color: exportFeedback.type === 'error'
              ? (isLight ? '#b91c1c' : '#fca5a5')
              : (isLight ? '#047857' : '#34d399'),
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <span>{exportFeedback.text}</span>
          <button
            type="button"
            onClick={() => setExportFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {/* ── FILTER & DATE CONTROL PANEL ── */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Row 1: Rentang Tanggal Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: textSecondary, display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
              <Calendar size={14} color="#2563eb" />
              <span>Periode Tanggal</span>
              <ActionTutorialBadge
                isLight={isLight}
                size="sm"
                title="Periode & Rentang Tanggal"
                description="Pilih preset Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini, All Time, atau Custom Tanggal untuk menyaring seluruh grafik sekaligus melihat persentase naik/turun terhadap periode sebelumnya."
              />
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {METRICS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetric(m.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: metric === m.id ? '1px solid #2563eb' : `1px solid ${borderColor}`,
                    background: metric === m.id ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.22)') : 'transparent',
                    color: metric === m.id ? '#2563eb' : textSecondary,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {DATE_PRESETS.map((preset) => {
              const isActive = activeFilters.range === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (preset.id === 'custom') {
                      const todayIso = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
                      updateFilters({
                        range: 'custom',
                        startDate: activeFilters.startDate || todayIso,
                        endDate: activeFilters.endDate || todayIso
                      });
                    } else {
                      updateFilters({ range: preset.id });
                    }
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: isActive ? '1.5px solid #2563eb' : `1px solid ${borderColor}`,
                    background: isActive ? '#2563eb' : bgSubtle,
                    color: isActive ? '#ffffff' : textPrimary,
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {activeFilters.range === 'custom' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '8px',
              padding: '10px',
              borderRadius: '12px',
              background: bgSubtle,
              border: `1px solid ${borderColor}`,
              alignItems: 'end'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  aria-label="Dari Tanggal"
                  value={activeFilters.startDate || ''}
                  onChange={(e) => updateFilters({ range: 'custom', startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  aria-label="Sampai Tanggal"
                  value={activeFilters.endDate || ''}
                  onChange={(e) => updateFilters({ range: 'custom', endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => updateFilters({ range: 'custom' })}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Terapkan Tanggal
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Mode Filter Dimensi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: `1px solid ${borderColor}`, paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: textSecondary, display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
              <Filter size={14} color="#4f46e5" />
              <span>Filter Dimensi Grafik</span>
              <ActionTutorialBadge
                isLight={isLight}
                size="sm"
                title="Filter Dimensi & Combine"
                description="Gunakan All untuk ringkasan total, Per Item/Kategori/Toko/Karyawan untuk fokus satu dimensi, atau Combine untuk menggabungkan beberapa filter secara bersamaan."
              />
            </span>

            {activeFilterBadges.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: bgSubtle,
                  color: '#dc2626',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
                <span>Reset Filter ({activeFilterBadges.length})</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FILTER_MODES.map((mode) => {
              const IconComp = mode.icon;
              const isActive = activeFilters.filterMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleModeSelect(mode.id)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: isActive ? '1.5px solid #4f46e5' : `1px solid ${borderColor}`,
                    background: isActive ? '#4f46e5' : bgSubtle,
                    color: isActive ? '#ffffff' : textPrimary,
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <IconComp size={14} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {(showStoreSelect || showCategorySelect || showItemSelect || showEmployeeSelect) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
              border: `1px solid ${borderColor}`
            }}>
              {showStoreSelect && renderSelectControl(
                'Filter Toko',
                <Store size={12} color="#2563eb" />,
                activeFilters.storeId,
                (val) => updateFilters({ storeId: val }),
                (filterOptions.stores || []).map(s => ({ value: s.id, label: s.name })),
                'Semua Toko'
              )}

              {showCategorySelect && renderSelectControl(
                'Filter Kategori',
                <Tag size={12} color="#10b981" />,
                activeFilters.category,
                (val) => updateFilters({ category: val }),
                (filterOptions.categories || []).map(c => ({ value: c, label: c })),
                'Semua Kategori'
              )}

              {showItemSelect && renderSelectControl(
                'Filter Item Menu',
                <Utensils size={12} color="#f59e0b" />,
                activeFilters.itemId,
                (val) => updateFilters({ itemId: val }),
                (filterOptions.items || []).map(i => ({ value: i.id, label: `${i.name} (${i.category})` })),
                'Semua Item Menu'
              )}

              {showEmployeeSelect && renderSelectControl(
                'Filter Karyawan',
                <Users size={12} color="#8b5cf6" />,
                activeFilters.cashierId,
                (val) => updateFilters({ cashierId: val }),
                (filterOptions.employees || []).map(e => ({ value: e.id, label: e.name })),
                'Semua Karyawan'
              )}
            </div>
          )}

          {activeFilterBadges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 700 }}>Filter Aktif:</span>
              {activeFilterBadges.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => updateFilters({ [b.key]: 'all' })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    border: '1px solid rgba(79, 70, 229, 0.35)',
                    background: isLight ? '#eef2ff' : 'rgba(79, 70, 229, 0.2)',
                    color: isLight ? '#3730a3' : '#c7d2fe',
                    fontSize: '0.71rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>{b.label}</span>
                  <X size={11} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI SUMMARY STRIP (4 RINGKASAN ANGKA UTAMA) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
        gap: '10px'
      }}>
        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: 0
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.18)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Wallet size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Total Omset</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
              {formatIDR(summary.totalGrossOmset)}
            </div>
            {renderDeltaBadge(comparison.revenueDeltaPct)}
          </div>
        </div>

        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: 0
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.18)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShoppingBag size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Total Transaksi</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
              {Number(summary.totalOrdersAll || 0).toLocaleString('id-ID')} nota
            </div>
            {renderDeltaBadge(comparison.ordersDeltaPct)}
          </div>
        </div>

        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: 0
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.18)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Utensils size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Item Terjual</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
              {Number(summary.totalItemsSold || 0).toLocaleString('id-ID')} porsi
            </div>
            {renderDeltaBadge(comparison.itemsDeltaPct)}
          </div>
        </div>

        <div style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: 0
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isLight ? '#eef2ff' : 'rgba(139, 92, 246, 0.18)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', color: textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Rata-Rata Order</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
              {formatIDR(summary.averageOrderValue)}
            </div>
            {renderDeltaBadge(comparison.aovDeltaPct)}
          </div>
        </div>
      </div>

      {/* ── CHART 1: GRAFIK TREN PENJUALAN UTAMA ── */}
      <div style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '18px',
        padding: '16px',
        boxShadow: 'var(--shadow-sm)',
        minWidth: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '7px' }}>
              <TrendingUp size={16} color="#2563eb" />
              <span>Grafik Tren {metricLabel}</span>
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.73rem', color: textSecondary }}>
              {DATE_PRESETS.find(d => d.id === activeFilters.range)?.label || 'All Time'}
              {analyticsData?.appliedFilters?.startDate ? ` (${analyticsData.appliedFilters.startDate} s/d ${analyticsData.appliedFilters.endDate})` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setChartType('area')}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: chartType === 'area' ? '1px solid #2563eb' : `1px solid ${borderColor}`,
                background: chartType === 'area' ? '#2563eb' : bgSubtle,
                color: chartType === 'area' ? '#ffffff' : textSecondary,
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Grafik Garis/Area
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: chartType === 'bar' ? '1px solid #2563eb' : `1px solid ${borderColor}`,
                background: chartType === 'bar' ? '#2563eb' : bgSubtle,
                color: chartType === 'bar' ? '#ffffff' : textSecondary,
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Grafik Batang
            </button>
          </div>
        </div>

        {timelineSeries.length === 0 ? (
          renderEmptyGraph()
        ) : (
          <div style={{ width: '100%', height: '290px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={290}>
              {chartType === 'area' ? (
                <AreaChart data={timelineSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kasirRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" stroke={textSecondary} fontSize={11} minTickGap={16} />
                  <YAxis stroke={textSecondary} fontSize={11} width={54} tickFormatter={(v) => formatAxisCompact(v, metric)} />
                  <Tooltip content={renderTooltipContent} />
                  {showMultiSeriesOnTimeline ? (
                    <>
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      {seriesMeta.map((s) => (
                        <Area
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={s.name}
                          stroke={s.color}
                          strokeWidth={2}
                          fill={s.color}
                          fillOpacity={0.14}
                        />
                      ))}
                    </>
                  ) : (
                    <Area
                      type="monotone"
                      dataKey={metric}
                      name={metricLabel}
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="url(#kasirRevGrad)"
                    />
                  )}
                </AreaChart>
              ) : (
                <BarChart data={timelineSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" stroke={textSecondary} fontSize={11} minTickGap={16} />
                  <YAxis stroke={textSecondary} fontSize={11} width={54} tickFormatter={(v) => formatAxisCompact(v, metric)} />
                  <Tooltip content={renderTooltipContent} />
                  {showMultiSeriesOnTimeline ? (
                    <>
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      {seriesMeta.map((s) => (
                        <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[5, 5, 0, 0]} maxBarSize={28} />
                      ))}
                    </>
                  ) : (
                    <Bar dataKey={metric} name={metricLabel} fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── BREAKDOWN GRAPHS: ALL (4 GRAFIK) ATAU MODE TERFOKUS (2 GRAFIK) ── */}
      {activeFilters.filterMode === 'all' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
          gap: '14px'
        }}>
          {/* Graph A: Per Item */}
          <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Utensils size={15} color="#f59e0b" />
              <span>Grafik Per Item Menu</span>
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: textSecondary }}>Top item berdasarkan {metricLabel}</p>
            {renderHorizontalRankChart(byItem.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount })))}
          </div>

          {/* Graph B: Per Kategori (Pie Donut) */}
          <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={15} color="#10b981" />
              <span>Grafik Per Kategori</span>
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: textSecondary }}>Distribusi kontribusi per kategori menu</p>
            {renderPieShareChart(byCategory.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount })))}
          </div>

          {/* Graph C: Per Toko */}
          <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Store size={15} color="#2563eb" />
              <span>Grafik Per Toko / Cabang</span>
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: textSecondary }}>Performa antar seluruh toko milik owner</p>
            {renderHorizontalRankChart(byStore.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount })))}
          </div>

          {/* Graph D: Per Karyawan */}
          <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} color="#8b5cf6" />
              <span>Grafik Per Karyawan / Kasir</span>
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: textSecondary }}>Perbandingan kontribusi setiap kasir &amp; staf</p>
            {renderHorizontalRankChart(byEmployee.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount })))}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '14px'
        }}>
          {/* Focused Bar Graph */}
          <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={15} color="#2563eb" />
              <span>{focusedData?.title || 'Grafik Perbandingan'}</span>
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: textSecondary }}>
              {focusedData?.subtitle}
            </p>
            {renderHorizontalRankChart(focusedData?.rows || [], metric, 300)}
          </div>

          {/* Focused Share Donut + Payment Split / Category Share */}
          <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={15} color="#10b981" />
              <span>
                {activeFilters.filterMode === 'combine'
                  ? 'Distribusi Kategori Hasil Filter Combine'
                  : 'Proporsi Peringkat Teratas (%)'}
              </span>
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: textSecondary }}>
              Persentase kontribusi berdasarkan filter aktif saat ini
            </p>
            {renderPieShareChart(
              activeFilters.filterMode === 'combine'
                ? byCategory.map(x => ({ name: x.name, revenue: x.revenue, qty: x.qty, orders: x.ordersCount }))
                : (focusedData?.rows || []),
              metric,
              300
            )}
          </div>
        </div>
      )}

      {/* ── PAYMENT SPLIT (TUNAI VS QRIS) & PEAK HOURS (JAM RAMAI) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '14px'
      }}>
        {/* Payment Method Donut Chart */}
        <div
          data-testid="payment-split-card"
          style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={15} color="#10b981" />
                <span>Grafik Metode Pembayaran (Tunai vs QRIS)</span>
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: textSecondary }}>
                Komposisi pendapatan &amp; jumlah nota berdasarkan kanal pembayaran
              </p>
            </div>
          </div>

          {paymentSplit.every(p => p.revenue === 0 && p.ordersCount === 0) ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: textSecondary, fontSize: '0.8rem' }}>
              Belum ada transaksi pada rentang filter ini
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentSplit.filter(p => (metric === 'orders' ? p.ordersCount : p.revenue) > 0)}
                      dataKey={metric === 'orders' ? 'ordersCount' : 'revenue'}
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={4}
                    >
                      {paymentSplit
                        .filter(p => (metric === 'orders' ? p.ordersCount : p.revenue) > 0)
                        .map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload;
                        return (
                          <div style={{
                            background: isLight ? '#ffffff' : '#0f172a',
                            border: `1px solid ${borderColor}`,
                            borderRadius: '10px',
                            padding: '8px 12px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
                            fontSize: '0.75rem'
                          }}>
                            <div style={{ fontWeight: 800, color: textPrimary, marginBottom: '2px' }}>{row.label} ({row.pct}%)</div>
                            <div style={{ color: row.color, fontWeight: 700 }}>{formatIDR(row.revenue)}</div>
                            <div style={{ color: textSecondary }}>{row.ordersCount} transaksi</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {paymentSplit.map((pm) => (
                  <div
                    key={pm.key}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: bgSubtle,
                      border: `1px solid ${borderColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: pm.color, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: pm.color }} />
                        {pm.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: textPrimary }}>{pm.pct}%</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: textPrimary, fontFamily: 'var(--font-mono)' }}>
                      {formatIDR(pm.revenue)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: textSecondary }}>
                      {Number(pm.ordersCount || 0).toLocaleString('id-ID')} transaksi
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Peak Hours Bar Chart */}
        <div
          data-testid="peak-hours-card"
          style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: '18px', padding: '16px', minWidth: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#f59e0b" />
                <span>Grafik Jam Ramai (Peak Hours WIB)</span>
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: textSecondary }}>
                Distribusi kepadatan order per jam operasional toko
              </p>
            </div>
            {peakHourSummary?.busiestOrders > 0 && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '999px',
                background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: isLight ? '#b45309' : '#fbbf24',
                fontSize: '0.7rem',
                fontWeight: 800
              }}>
                Jam Tersibuk: {peakHourSummary.busiestLabel} ({peakHourSummary.busiestOrders} trx)
              </span>
            )}
          </div>

          {peakHours.length === 0 || peakHours.every(h => h.orders === 0 && h.revenue === 0) ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: textSecondary, fontSize: '0.8rem' }}>
              Belum ada aktivitas jam transaksi pada rentang filter ini
            </div>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="shortLabel" tick={{ fill: textSecondary, fontSize: 11 }} tickLine={false} axisLine={{ stroke: borderColor }} />
                  <YAxis
                    tickFormatter={(v) => formatAxisCompact(v, metric === 'qty' ? 'qty' : (metric === 'revenue' ? 'revenue' : 'orders'))}
                    tick={{ fill: textSecondary, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={46}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload;
                      return (
                        <div style={{
                          background: isLight ? '#ffffff' : '#0f172a',
                          border: `1px solid ${borderColor}`,
                          borderRadius: '10px',
                          padding: '8px 12px',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
                          fontSize: '0.75rem'
                        }}>
                          <div style={{ fontWeight: 800, color: textPrimary, marginBottom: '2px' }}>
                            Pukul {row.label} WIB {row.isPeak ? '(Puncak)' : ''}
                          </div>
                          <div style={{ color: '#2563eb', fontWeight: 700 }}>{row.orders} transaksi</div>
                          <div style={{ color: '#10b981', fontWeight: 700 }}>{formatIDR(row.revenue)}</div>
                          <div style={{ color: textSecondary }}>{row.qty} porsi terjual</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey={metric === 'qty' ? 'qty' : (metric === 'revenue' ? 'revenue' : 'orders')} radius={[6, 6, 0, 0]} maxBarSize={26}>
                    {peakHours.map((entry) => (
                      <Cell key={entry.key} fill={entry.isPeak ? '#f59e0b' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <main style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0.5rem auto 0',
        padding: '0 2% 2rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {headerSection}
        {bodySection}
      </main>
    );
  }

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
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1120px',
        maxHeight: '92vh',
        background: bgModal,
        borderRadius: '20px',
        border: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
      }}>
        {headerSection}
        {bodySection}
      </div>
    </div>
  );
}
