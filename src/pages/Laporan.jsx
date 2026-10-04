import React, { useState, useEffect } from 'react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Printer, 
  RefreshCw, 
  PieChart as PieIcon,
  BarChart2,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiGetInvoices, apiGetExpenses, apiGetSettings } from '../services/api';

const Laporan = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.kostUid) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dataInv, dataExp, dataSet] = await Promise.all([
        apiGetInvoices(user.kostUid).catch(() => []),
        apiGetExpenses(user.kostUid).catch(() => []),
        apiGetSettings(user.kostUid).catch(() => ({ rooms: [] }))
      ]);
      
      setInvoices(Array.isArray(dataInv) ? dataInv : []);
      setExpenses(Array.isArray(dataExp) ? dataExp : []);
      setSettings(dataSet);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(number || 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 1. Payment Status (Pie Chart)
  let paidCount = 0;
  let unpaidCount = 0;
  invoices.forEach(inv => {
    const invDate = new Date(inv.date);
    if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
      if (inv.status === 'lunas') paidCount++;
      else unpaidCount++;
    }
  });

  const paymentPieData = [
    { name: 'Sudah Lunas', value: paidCount || 0 },
    { name: 'Belum Bayar', value: unpaidCount || 0 },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  // 2. Financial Overview
  let incomeThisMonth = 0;
  let potentialIncomeThisMonth = 0;
  
  invoices.forEach(inv => {
    const invDate = new Date(inv.date);
    if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
      potentialIncomeThisMonth += Number(inv.total || 0);
      if (inv.status === 'lunas') {
        incomeThisMonth += Number(inv.total || 0);
      }
    }
  });

  let expenseThisMonth = 0;
  expenses.forEach(exp => {
    const expDate = new Date(exp.date);
    if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
      expenseThisMonth += Number(exp.amount || 0);
    }
  });

  const netProfit = incomeThisMonth - expenseThisMonth;

  // Monthly summary bar chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const barData = [
    {
      name: `${monthNames[currentMonth]} ${currentYear}`,
      Pemasukan: incomeThisMonth,
      Pengeluaran: expenseThisMonth,
      LabaBersih: netProfit
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Laporan & Analisis Statistik</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Periode: <strong style={{ color: 'white' }}>{monthNames[currentMonth]} {currentYear}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => window.print()} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Printer size={15} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-responsive-stats">
        <div className="card glass-panel">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LABA BERSIH (NET PROFIT)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <DollarSign size={22} color={netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'} />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {formatRupiah(netProfit)}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pemasukan dikurangi pengeluaran</span>
        </div>

        <div className="card glass-panel">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PEMASUKAN TEREALISASI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <TrendingUp size={22} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#60a5fa' }}>
              {formatRupiah(incomeThisMonth)}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Potensi total: {formatRupiah(potentialIncomeThisMonth)}</span>
        </div>

        <div className="card glass-panel">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL PENGELUARAN</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <TrendingDown size={22} color="var(--accent-danger)" />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-danger)' }}>
              {formatRupiah(expenseThisMonth)}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operasional kost bulan ini</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-responsive-equal">
        
        {/* Chart 1: Bar Chart */}
        <div className="card glass-panel" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <BarChart2 size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Arus Kas Masuk vs Keluar</h3>
          </div>
          <div style={{ flex: 1, minHeight: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `Rp${val/1000}k`} />
                <Tooltip 
                  formatter={(val) => formatRupiah(val)} 
                  contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                />
                <Legend />
                <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payment Status Pie Chart */}
        <div className="card glass-panel" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <PieIcon size={18} color="var(--accent-success)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Rasio Pembayaran Tagihan</h3>
          </div>
          <div style={{ flex: 1, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {paidCount === 0 && unpaidCount === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                Belum ada data tagihan bulan ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                  />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Laporan;
