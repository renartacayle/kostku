import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  RefreshCw,
  Wallet,
  AlertCircle,
  X,
  Receipt,
  QrCode,
  CreditCard,
  Printer,
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { 
  apiGetInvoices, 
  apiGetExpenses, 
  apiVerifyInvoice, 
  apiAddExpense, 
  apiDeleteExpense 
} from '../services/api';

import PaymentGatewayModal from '../components/PaymentGatewayModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';

const PIE_COLORS = ['#10b981', '#ef4444'];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

const Keuangan = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upgrade Modals State
  const [payInvoice, setPayInvoice] = useState(null);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState(null);

  // Unified Wallet State (Single-Node Settlement & Overdraft Limit)
  const [unifiedWallet, setUnifiedWallet] = useState(() => {
    try {
      const stored = localStorage.getItem('kostku_unified_wallet');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      owner_commission_balance: 25000,
      mitra_escrow_balance: 0,
      overdraft_limit: -15000
    };
  });
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [payoutBank, setPayoutBank] = useState({ 
    bank_name: 'BCA', 
    account_number: '8830192831', 
    account_holder: user?.name || 'Owner Kost' 
  });

  useEffect(() => {
    const handleWalletSync = () => {
      try {
        const stored = localStorage.getItem('kostku_unified_wallet');
        if (stored) setUnifiedWallet(JSON.parse(stored));
      } catch (e) {}
    };
    window.addEventListener('kostku_wallet_updated', handleWalletSync);
    return () => window.removeEventListener('kostku_wallet_updated', handleWalletSync);
  }, []);

  const handleExecutePayout = () => {
    const totalWithdraw = (Number(unifiedWallet.owner_commission_balance) || 0) + (Number(unifiedWallet.mitra_escrow_balance) || 0);
    if (totalWithdraw <= 0) {
      alert('Saldo dompet tidak mencukupi untuk penarikan.');
      return;
    }
    const updated = {
      ...unifiedWallet,
      owner_commission_balance: 0,
      mitra_escrow_balance: 0
    };
    setUnifiedWallet(updated);
    localStorage.setItem('kostku_unified_wallet', JSON.stringify(updated));
    setShowPayoutModal(false);
    alert(`Pencairan Satu Pintu (Payout) berhasil diproses sebesar Rp ${totalWithdraw.toLocaleString('id-ID')} ke rekening ${payoutBank.bank_name} ${payoutBank.account_number} (${payoutBank.account_holder}).`);
  };

  const handleExecuteSetorMitra = () => {
    const escrowAmt = Number(unifiedWallet.mitra_escrow_balance) || 0;
    const updated = {
      ...unifiedWallet,
      mitra_escrow_balance: 0
    };
    setUnifiedWallet(updated);
    localStorage.setItem('kostku_unified_wallet', JSON.stringify(updated));
    setShowSetorModal(false);
    alert(`Titipan dana UMKM sebesar Rp ${escrowAmt.toLocaleString('id-ID')} telah ditandai lunas disetor ke mitra secara fisik/offline.`);
  };

  // Tabs: 'laporan' | 'tagihan' | 'pengeluaran'
  const defaultTab = user?.role === 'staff' 
    ? 'pengeluaran' 
    : (['laporan', 'tagihan', 'pengeluaran'].includes(requestedTab) ? requestedTab : 'laporan');
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Expense form
  const [newExp, setNewExp] = useState({ title: '', amount: '', category: 'Operasional' });
  const [submitting, setSubmitting] = useState(false);

  // Synchronize tab with query param if requestedTab changes
  useEffect(() => {
    if (requestedTab && ['laporan', 'tagihan', 'pengeluaran'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchData = async () => {
    if (!user?.kostUid) return;
    setLoading(true);
    try {
      const [dataInv, dataExp] = await Promise.all([
        apiGetInvoices(user.kostUid).catch(() => []),
        apiGetExpenses(user.kostUid).catch(() => [])
      ]);
      
      setInvoices(Array.isArray(dataInv) ? dataInv : []);
      setExpenses(Array.isArray(dataExp) ? dataExp : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.kostUid]);

  const handleVerify = async (id, userName, kamar) => {
    if (!window.confirm(`Verifikasi bahwa tagihan Kamar ${kamar} (${userName}) telah lunas diterima?`)) return;
    try {
      await apiVerifyInvoice(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal memverifikasi tagihan');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExp.title || !newExp.amount) return;
    setSubmitting(true);

    try {
      await apiAddExpense(user.kostUid, newExp.title, newExp.amount, newExp.category);
      setNewExp({ title: '', amount: '', category: 'Operasional' });
      setShowExpenseModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengeluaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id, title) => {
    if (!window.confirm(`Hapus catatan pengeluaran "${title}"?`)) return;
    try {
      await apiDeleteExpense(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(number || 0);
  };

  // Calculations for all-time totals
  const totalPemasukan = invoices
    .filter(i => String(i.status).toLowerCase() === 'lunas')
    .reduce((sum, i) => sum + Number(i.total || i.amount || 0), 0);

  const totalPengeluaran = expenses
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const labaBersih = totalPemasukan - totalPengeluaran;

  const totalPending = invoices
    .filter(i => String(i.status).toLowerCase() !== 'lunas')
    .reduce((sum, i) => sum + Number(i.total || i.amount || 0), 0);

  // Available Periods
  const availablePeriods = useMemo(() => {
    const map = new Map();
    [...invoices, ...expenses].forEach(item => {
      if (item.date) {
        const d = new Date(item.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        map.set(key, label);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [invoices, expenses]);

  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const now = new Date();

  // Filtered period calculations
  const {
    periodInvoices,
    periodExpenses,
    periodIncome,
    periodPotentialIncome,
    periodExpenseTotal,
    periodNetProfit,
    periodPaidCount,
    periodUnpaidCount,
    periodLabel
  } = useMemo(() => {
    let pInvoices = invoices;
    let pExpenses = expenses;
    let label = 'Semua Periode';

    if (selectedPeriod !== 'all') {
      const [sYear, sMonth] = selectedPeriod.split('-').map(Number);
      label = `${MONTH_NAMES[sMonth - 1]} ${sYear}`;
      pInvoices = invoices.filter(inv => {
        if (!inv.date) return false;
        const d = new Date(inv.date);
        return d.getMonth() === (sMonth - 1) && d.getFullYear() === sYear;
      });
      pExpenses = expenses.filter(exp => {
        if (!exp.date) return false;
        const d = new Date(exp.date);
        return d.getMonth() === (sMonth - 1) && d.getFullYear() === sYear;
      });
    }

    let paidCount = 0;
    let unpaidCount = 0;
    let income = 0;
    let potential = 0;

    pInvoices.forEach(inv => {
      const val = Number(inv.total || inv.amount || 0);
      potential += val;
      if (String(inv.status).toLowerCase() === 'lunas') {
        paidCount++;
        income += val;
      } else {
        unpaidCount++;
      }
    });

    const expenseTotal = pExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const netProfit = income - expenseTotal;

    return {
      periodInvoices: pInvoices,
      periodExpenses: pExpenses,
      periodIncome: income,
      periodPotentialIncome: potential,
      periodExpenseTotal: expenseTotal,
      periodNetProfit: netProfit,
      periodPaidCount: paidCount,
      periodUnpaidCount: unpaidCount,
      periodLabel: label
    };
  }, [invoices, expenses, selectedPeriod]);

  // Overall counts
  const allPaidCount = invoices.filter(i => String(i.status).toLowerCase() === 'lunas').length;
  const allUnpaidCount = invoices.filter(i => String(i.status).toLowerCase() !== 'lunas').length;

  const paymentPieData = [
    { name: 'Sudah Lunas', value: periodPaidCount },
    { name: 'Belum Bayar', value: periodUnpaidCount }
  ];

  // 6-Month Cash Flow Bar Chart Data
  const monthlyCashflow = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = `${MONTH_NAMES[m]} ${y}`;
      
      let inc = 0;
      invoices.forEach(inv => {
        if (!inv.date) return;
        const invDate = new Date(inv.date);
        if (invDate.getMonth() === m && invDate.getFullYear() === y && String(inv.status).toLowerCase() === 'lunas') {
          inc += Number(inv.total || inv.amount || 0);
        }
      });
      
      let exp = 0;
      expenses.forEach(e => {
        if (!e.date) return;
        const expDate = new Date(e.date);
        if (expDate.getMonth() === m && expDate.getFullYear() === y) {
          exp += Number(e.amount || 0);
        }
      });
      
      months.push({
        name: label,
        Pemasukan: inc,
        Pengeluaran: exp,
        LabaBersih: inc - exp
      });
    }
    return months;
  }, [invoices, expenses]);

  // Expenses category distribution
  const expenseByCategory = useMemo(() => {
    const cats = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'Operasional';
      cats[cat] = (cats[cat] || 0) + Number(exp.amount || 0);
    });
    return Object.entries(cats).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalPengeluaran > 0 ? ((amount / totalPengeluaran) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses, totalPengeluaran]);

  const paymentCollectionRate = (allPaidCount + allUnpaidCount) > 0
    ? Math.round((allPaidCount / (allPaidCount + allUnpaidCount)) * 100)
    : 100;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          aside, nav, .sidebar, .btn, .no-print, header, .mobile-bottom-nav, .tab-controls {
            display: none !important;
          }
          .card, .glass-panel {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
          .print-header {
            display: block !important;
            margin-bottom: 1.5rem;
          }
        }
      `}</style>

      {/* Header Bar */}
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            {user?.role === 'staff' ? 'Pengeluaran Lapangan' : 'Keuangan & Laporan'}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {user?.role === 'staff'
              ? 'Pencatatan pengeluaran operasional dan pemeliharaan kost'
              : 'Analisis arus kas, grafik performa, penagihan sewa, dan pengeluaran operasional'}
          </p>
        </div>

        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={fetchData} 
            className="btn btn-secondary btn-sm"
            title="Segarkan data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          
          {user?.role !== 'staff' && (
            <button 
              onClick={() => window.print()} 
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
              title="Cetak atau unduh laporan keuangan sebagai PDF"
            >
              <Printer size={15} /> Cetak Laporan
            </button>
          )}

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowExpenseModal(true)}
            style={{ gap: '6px' }}
          >
            <Plus size={15} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Financial Stat KPI Cards */}
      {user?.role === 'staff' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}>
          {/* Pengeluaran Staff */}
          <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #ef4444' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '14px',
              borderRadius: '16px',
              color: 'var(--accent-danger)',
              display: 'flex'
            }}>
              <TrendingDown size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL PENGELUARAN OPERASIONAL</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-danger)' }}>
                {formatRupiah(totalPengeluaran)}
              </h2>
            </div>
          </div>

          <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '14px',
              borderRadius: '16px',
              color: '#34d399',
              display: 'flex'
            }}>
              <Wallet size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL TRANSAKSI PENGELUARAN</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                {expenses.length} Catatan
              </h2>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-responsive-stats">
          {/* Pemasukan */}
          <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '14px',
              borderRadius: '16px',
              color: 'var(--accent-success)',
              display: 'flex'
            }}>
              <TrendingUp size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL PEMASUKAN</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                {formatRupiah(totalPemasukan)}
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{allPaidCount} tagihan terealisasi</span>
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '14px',
              borderRadius: '16px',
              color: 'var(--accent-danger)',
              display: 'flex'
            }}>
              <TrendingDown size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL PENGELUARAN</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-danger)' }}>
                {formatRupiah(totalPengeluaran)}
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{expenses.length} transaksi operasional</span>
            </div>
          </div>

          {/* Laba Bersih */}
          <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '14px',
              borderRadius: '16px',
              color: 'var(--accent-primary)',
              display: 'flex'
            }}>
              <Wallet size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SALDO / LABA BERSIH</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: labaBersih >= 0 ? '#60a5fa' : 'var(--accent-danger)' }}>
                {formatRupiah(labaBersih)}
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pemasukan - pengeluaran</span>
            </div>
          </div>

          {/* Tagihan Tertunda */}
          <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '14px',
              borderRadius: '16px',
              color: 'var(--accent-warning)',
              display: 'flex'
            }}>
              <AlertCircle size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TAGIHAN TERTUNDA</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: totalPending > 0 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                {formatRupiah(totalPending)}
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{allUnpaidCount} tagihan pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Wallet & Single-Node Settlement (Hyperlocal UMKM) */}
      {user?.role !== 'staff' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '10px',
                borderRadius: '12px',
                color: '#38bdf8'
              }}>
                <Wallet size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                    Unified Wallet (Single-Node Settlement)
                  </h3>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    1 Pintu Payout
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Pusat perputaran komisi hak Owner & titipan dana tunai warung UMKM (Platform Fee tetap Rp500/transaksi)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <ArrowUpRight size={14} /> Tarik Seluruh Dana (Payout 1 Pintu)
              </button>
              <button
                onClick={() => setShowSetorModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <CheckCircle2 size={14} color="#34d399" /> Tandai Sudah Disetor ke Mitra (Reset Titipan)
              </button>
              <Link
                to="/blueprint?tab=simulator"
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', textDecoration: 'none' }}
              >
                <span>Buka Simulator</span> →
              </Link>
            </div>
          </div>

          {/* Overdraft Warning Banner */}
          {Number(unifiedWallet.owner_commission_balance) < 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f87171'
            }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Perhatian: Saldo komisi owner minus (Rp {(Number(unifiedWallet.owner_commission_balance) || 0).toLocaleString('id-ID')}). Beroperasi dalam kuota overdraft limit -15.000.
              </span>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                SALDO KOMISI OWNER (BERSIH) • owner_commission_balance
              </span>
              <h4 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: 800, color: Number(unifiedWallet.owner_commission_balance) < 0 ? '#ef4444' : '#38bdf8', fontFamily: 'monospace' }}>
                Rp {(Number(unifiedWallet.owner_commission_balance) || 0).toLocaleString('id-ID')}
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Hak owner + kuota talangan COD</span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                TITIPAN ESCROW MITRA (UMKM) • mitra_escrow_balance
              </span>
              <h4 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                Rp {(Number(unifiedWallet.mitra_escrow_balance) || 0).toLocaleString('id-ID')}
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Uang titipan mitra_escrow_balance pesanan QRIS</span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                BATAS OVERDRAFT LIMIT (-15.000)
              </span>
              <h4 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                -15.000
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Toleransi overdraft 30 transaksi COD talangan (Rp -15.000)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="tab-controls no-print" style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content',
        gap: '4px',
        flexWrap: 'wrap'
      }}>
        {user?.role !== 'staff' && (
          <button
            onClick={() => handleTabChange('laporan')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'laporan' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'laporan' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <BarChart2 size={16} /> Analisis & Laporan
          </button>
        )}

        {user?.role !== 'staff' && (
          <button
            onClick={() => handleTabChange('tagihan')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'tagihan' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'tagihan' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Receipt size={16} /> Tagihan Sewa ({invoices.length})
          </button>
        )}

        <button
          onClick={() => handleTabChange('pengeluaran')}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: activeTab === 'pengeluaran' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'pengeluaran' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Wallet size={16} /> Catatan Pengeluaran ({expenses.length})
        </button>
      </div>

      {/* Tab Content 1: Analisis & Laporan */}
      {activeTab === 'laporan' && user?.role !== 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Period Selector Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'rgba(30, 41, 59, 0.4)',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white' }}>Periode Laporan:</span>
              <span className="badge badge-primary">{periodLabel}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="input-field"
                style={{ width: 'auto', padding: '6px 14px', fontSize: '0.85rem', background: '#0f172a', color: 'white', borderRadius: '8px' }}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="all">Semua Periode (Ringkasan Total)</option>
                {availablePeriods.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Executive Mini Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            <div className="card glass-panel" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LABA BERSIH ({periodLabel})</span>
                <span className="badge badge-primary">{periodLabel}</span>
              </div>
              <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.3rem', fontWeight: 800, color: periodNetProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {formatRupiah(periodNetProfit)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Pemasukan {formatRupiah(periodIncome)} - Pengeluaran {formatRupiah(periodExpenseTotal)}
              </span>
            </div>

            <div className="card glass-panel" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RASIO PELUNASAN KOST</span>
                <CheckCircle2 size={16} color="var(--accent-success)" />
              </div>
              <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>
                {(periodPaidCount + periodUnpaidCount) > 0 ? Math.round((periodPaidCount / (periodPaidCount + periodUnpaidCount)) * 100) : 100}% Lunas
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {periodPaidCount} lunas dari {periodPaidCount + periodUnpaidCount} total tagihan
              </span>
            </div>

            <div className="card glass-panel" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>POTENSI PEMASUKAN</span>
                <ArrowUpRight size={16} color="#60a5fa" />
              </div>
              <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>
                {formatRupiah(periodPotentialIncome)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Terealisasi: {formatRupiah(periodIncome)}
              </span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid-responsive-equal">
            
            {/* Chart 1: Bar Chart (6 Months Cashflow) */}
            <div className="card glass-panel" style={{ minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} color="var(--accent-primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Tren Arus Kas (Pemasukan vs Pengeluaran)</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6 Bulan Terakhir</span>
              </div>
              
              <div style={{ flex: 1, minHeight: '270px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCashflow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(val) => `Rp${(val/1000).toLocaleString('id-ID')}k`} />
                    <Tooltip 
                      formatter={(val) => formatRupiah(val)} 
                      contentStyle={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                    />
                    <Legend />
                    <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="LabaBersih" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Payment Status Pie Chart */}
            <div className="card glass-panel" style={{ minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieIcon size={18} color="var(--accent-success)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Rasio Pembayaran Tagihan</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Tagihan Aktif</span>
              </div>
              
              <div style={{ flex: 1, minHeight: '270px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(allPaidCount === 0 && allUnpaidCount === 0) ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Belum ada data tagihan terdaftar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={paymentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

          {/* Expense Category Breakdown & Audit Summary */}
          <div className="grid-responsive-equal">
            
            {/* Category Breakdown */}
            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Layers size={18} color="var(--accent-warning)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Distribusi Beban Pengeluaran</h3>
              </div>

              {expenseByCategory.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                  Belum ada catatan pengeluaran operasional.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {expenseByCategory.map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {formatRupiah(cat.amount)} <strong style={{ color: 'white' }}>({cat.percentage}%)</strong>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${cat.percentage}%`,
                          height: '100%',
                          background: idx === 0 ? 'var(--accent-danger)' : idx === 1 ? 'var(--accent-warning)' : 'var(--accent-primary)',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Financial Health Card */}
            <div className="card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ringkasan Audit Finansial</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Tagihan Diterbitkan:</span>
                    <strong>{invoices.length} Tagihan</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tagihan Lunas Diterima:</span>
                    <strong style={{ color: 'var(--accent-success)' }}>{allPaidCount} ({formatRupiah(totalPemasukan)})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tagihan Belum Dilunasi:</span>
                    <strong style={{ color: 'var(--accent-warning)' }}>{allUnpaidCount} ({formatRupiah(totalPending)})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Beban Biaya:</span>
                    <strong style={{ color: 'var(--accent-danger)' }}>{formatRupiah(totalPengeluaran)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                    <span style={{ fontWeight: 700 }}>Profit Margin Kas:</span>
                    <strong style={{ color: labaBersih >= 0 ? '#34d399' : 'var(--accent-danger)', fontSize: '1rem' }}>
                      {totalPemasukan > 0 ? `${((labaBersih / totalPemasukan) * 100).toFixed(1)}%` : '0%'}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleTabChange('tagihan')}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  Kelola Tagihan →
                </button>
                <button
                  onClick={() => handleTabChange('pengeluaran')}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  Kelola Pengeluaran →
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab Content 2: Tagihan Sewa */}
      {activeTab === 'tagihan' && user?.role !== 'staff' && (
        <div>
          {invoices.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Belum ada riwayat tagihan terbit. Tagihan otomatis dibuat saat pengajuan sewa disetujui.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {invoices.map((inv) => {
                const isPaid = inv.status === 'lunas';
                return (
                  <div
                    key={inv.id}
                    className="card glass-panel"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1.25rem',
                      borderLeft: `4px solid ${isPaid ? 'var(--accent-success)' : 'var(--accent-warning)'}`
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{inv.userName}</h3>
                        <span className="badge badge-primary">Kamar {inv.kamar}</span>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                          {isPaid ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Sewa: {formatRupiah(inv.basePrice || inv.total || inv.amount)}</span>
                        {Number(inv.deposit) > 0 && <span>• Deposit: {formatRupiah(inv.deposit)}</span>}
                        {Number(inv.waterCost) > 0 && <span>• Air: {formatRupiah(inv.waterCost)}</span>}
                        <span>• Tanggal: {inv.date ? new Date(inv.date).toLocaleDateString('id-ID') : '-'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL TAGIHAN</span>
                        <strong style={{ fontSize: '1.2rem', color: isPaid ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                          {formatRupiah(inv.total || inv.amount)}
                        </strong>
                      </div>

                      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isPaid ? (
                          <>
                            <button
                              onClick={() => setPayInvoice(inv)}
                              className="btn btn-primary btn-sm"
                              style={{ gap: '6px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                              title="Bayar Otomatis via QRIS / VA"
                            >
                              <QrCode size={14} /> Bayar QRIS
                            </button>
                            <button
                              onClick={() => handleVerify(inv.id, inv.userName, inv.kamar)}
                              className="btn btn-success btn-sm"
                              style={{ gap: '6px' }}
                            >
                              <CheckCircle size={14} /> Verifikasi
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setReceiptInvoiceId(inv.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '6px', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.4)' }}
                            title="Lihat Kuitansi Resmi"
                          >
                            <Receipt size={14} /> Kuitansi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Catatan Pengeluaran */}
      {activeTab === 'pengeluaran' && (
        <div>
          {expenses.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Belum ada catatan pengeluaran. Tekan tombol "Catat Pengeluaran" untuk menambahkan.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="card glass-panel"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1.1rem 1.25rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{exp.title || exp.description || 'Pengeluaran Operasional'}</h3>
                      <span className="badge badge-primary">{exp.category || 'Operasional'}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                      Tanggal: {exp.date ? new Date(exp.date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--accent-danger)' }}>
                      - {formatRupiah(exp.amount)}
                    </strong>
                    <button
                      onClick={() => handleDeleteExpense(exp.id, exp.title)}
                      className="btn btn-danger btn-sm no-print"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Catat Pengeluaran Baru</h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Keterangan Pengeluaran:
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  placeholder="Contoh: Tagihan Listrik PLN / Token"
                  value={newExp.title}
                  onChange={e => setNewExp({ ...newExp, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Jumlah (Nominal Rp):
                </label>
                <input 
                  type="number" 
                  className="input-field" 
                  required
                  placeholder="Contoh: 350000"
                  value={newExp.amount}
                  onChange={e => setNewExp({ ...newExp, amount: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Kategori:
                </label>
                <select 
                  className="input-field"
                  value={newExp.category}
                  onChange={e => setNewExp({ ...newExp, category: e.target.value })}
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  <option value="Listrik">Listrik & PLN</option>
                  <option value="Air">Air & PDAM</option>
                  <option value="Kebersihan">Kebersihan & Sampah</option>
                  <option value="Maintenance">Perbaikan & Perawatan</option>
                  <option value="Gaji">Gaji Karyawan</option>
                  <option value="Internet">Internet / WiFi</option>
                  <option value="Operasional">Operasional Lainnya</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)} style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Modals */}
      {payInvoice && (
        <PaymentGatewayModal
          isOpen={!!payInvoice}
          onClose={() => setPayInvoice(null)}
          invoice={payInvoice}
          user={user}
          onPaymentSuccess={() => {
            fetchData();
          }}
          onOpenReceipt={(invId) => {
            setReceiptInvoiceId(invId);
          }}
        />
      )}

      {receiptInvoiceId && (
        <DigitalReceiptModal
          isOpen={!!receiptInvoiceId}
          onClose={() => setReceiptInvoiceId(null)}
          invoiceId={receiptInvoiceId}
        />
      )}

      {/* Payout 1 Pintu Modal */}
      {showPayoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }} className="animate-fade-in">
          <div style={{
            background: '#0a101f',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            padding: '1.5rem',
            boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Wallet size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                  Pencairan Satu Pintu (Payout)
                </h3>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '1.25rem'
            }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Total Dana Ditarik (Owner + Mitra):</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px', fontFamily: 'monospace' }}>
                Rp {((Number(unifiedWallet.owner_commission_balance) || 0) + (Number(unifiedWallet.mitra_escrow_balance) || 0)).toLocaleString('id-ID')}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                💡 Single-Node Settlement: Cukup 1x biaya transfer bank dari platform ke rekening owner.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Bank Tujuan:
                </label>
                <select
                  value={payoutBank.bank_name}
                  onChange={e => setPayoutBank({ ...payoutBank, bank_name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.84rem' }}
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nomor Rekening:
                </label>
                <input
                  type="text"
                  value={payoutBank.account_number}
                  onChange={e => setPayoutBank({ ...payoutBank, account_number: e.target.value })}
                  placeholder="Contoh: 8830192831"
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Pemilik Rekening:
                </label>
                <input
                  type="text"
                  value={payoutBank.account_holder}
                  onChange={e => setPayoutBank({ ...payoutBank, account_holder: e.target.value })}
                  placeholder="Contoh: Bpk. H. Rahmat"
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.82rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePayout}
                className="btn btn-primary"
                style={{ flex: 2, fontSize: '0.82rem', fontWeight: 700 }}
              >
                Konfirmasi Tarik Dana (Payout)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setor ke Mitra Modal */}
      {showSetorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }} className="animate-fade-in">
          <div style={{
            background: '#0a101f',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '1.5rem',
            boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#22c55e" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                  Konfirmasi Setor Titipan Mitra
                </h3>
              </div>
              <button
                onClick={() => setShowSetorModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '1.25rem'
            }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Total Titipan Escrow Mitra:</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4ade80', marginTop: '2px', fontFamily: 'monospace' }}>
                Rp {(Number(unifiedWallet.mitra_escrow_balance) || 0).toLocaleString('id-ID')}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Konfirmasi bahwa uang titipan pesanan QRIS ini telah Anda serahkan secara fisik (tunai/transfer langsung) kepada warung mitra sekitar kost.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowSetorModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.82rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSetorMitra}
                className="btn btn-primary"
                style={{ flex: 2, fontSize: '0.82rem', fontWeight: 700, background: '#22c55e', borderColor: '#22c55e' }}
              >
                Tandai Sudah Disetor ke Mitra
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Keuangan;
