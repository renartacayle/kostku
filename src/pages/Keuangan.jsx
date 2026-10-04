import React, { useState, useEffect } from 'react';
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
  CreditCard
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

const Keuangan = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upgrade Modals State
  const [payInvoice, setPayInvoice] = useState(null);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState(null);

  // Tabs: 'tagihan' | 'pengeluaran'
  const [activeTab, setActiveTab] = useState(user?.role === 'staff' ? 'pengeluaran' : 'tagihan');
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Expense form
  const [newExp, setNewExp] = useState({ title: '', amount: '', category: 'Operasional' });
  const [submitting, setSubmitting] = useState(false);

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

  // Calculations
  const totalPemasukan = invoices
    .filter(i => i.status === 'lunas')
    .reduce((sum, i) => sum + Number(i.total || 0), 0);

  const totalPengeluaran = expenses
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const labaBersih = totalPemasukan - totalPengeluaran;

  const totalPending = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + Number(i.total || 0), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Laporan & Arus Kas Keuangan</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Pantau pembayaran sewa, tagihan utilitas, dan pengeluaran operasional
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchData} 
            className="btn btn-secondary btn-sm"
            title="Refresh data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowExpenseModal(true)}
          >
            <Plus size={15} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Financial Stat Cards (Restricted for Staff) */}
      {user?.role === 'staff' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}>
          {/* Pengeluaran */}
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
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content',
        gap: '4px'
      }}>
        {user?.role !== 'staff' && (
          <button
            onClick={() => setActiveTab('tagihan')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'tagihan' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'tagihan' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            Tagihan Sewa ({invoices.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('pengeluaran')}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            background: activeTab === 'pengeluaran' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'pengeluaran' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          Catatan Pengeluaran ({expenses.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tagihan' ? (
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
                        <span>Sewa: {formatRupiah(inv.basePrice)}</span>
                        {Number(inv.deposit) > 0 && <span>• Deposit: {formatRupiah(inv.deposit)}</span>}
                        {Number(inv.waterCost) > 0 && <span>• Air: {formatRupiah(inv.waterCost)}</span>}
                        <span>• Tanggal: {new Date(inv.date).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL TAGIHAN</span>
                        <strong style={{ fontSize: '1.2rem', color: isPaid ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                          {formatRupiah(inv.total)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      ) : (
        /* Expenses Tab */
        <div>
          {expenses.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Belum ada catatan pengeluaran.
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
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{exp.title}</h3>
                      <span className="badge badge-primary">{exp.category || 'Operasional'}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                      Tanggal: {new Date(exp.date).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--accent-danger)' }}>
                      - {formatRupiah(exp.amount)}
                    </strong>
                    <button
                      onClick={() => handleDeleteExpense(exp.id, exp.title)}
                      className="btn btn-danger btn-sm"
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

    </div>
  );
};

export default Keuangan;
