import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Settings, 
  RefreshCw, 
  MessageSquare, 
  ArrowRight, 
  Calendar, 
  CreditCard, 
  Split, 
  Layers, 
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Plus
} from 'lucide-react';
import { 
  apiGetDunningSettings, 
  apiUpdateDunningSettings, 
  apiSendDunningReminder, 
  apiGetDunningLogs,
  apiGetInvoices,
  apiSplitInvoiceTerms,
  apiGetBankMutations,
  apiSimulateBankMutation,
  apiReconcileBankMutation
} from '../services/api';

export default function FintechDunningAndReconcile({ user, kostUid }) {
  const [activeSubTab, setActiveSubTab] = useState('pipeline'); // 'pipeline' | 'mutations' | 'split'
  const [settings, setSettings] = useState({
    enabled: true,
    reminderHMinus3: true,
    reminderHMinus1: true,
    reminderDueDate: true,
    reminderOverdue: true,
    dailyLateFee: 5000,
    gracePeriodDays: 2,
    customTemplate: ''
  });
  const [dunningLogs, setDunningLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bankMutations, setBankMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Split Payment Modal State
  const [splitModalInvoice, setSplitModalInvoice] = useState(null);
  const [splitDueDateTerm2, setSplitDueDateTerm2] = useState('');
  const [splittingInvoice, setSplittingInvoice] = useState(false);

  // Bank Reconcile Modal State
  const [reconcileMutation, setReconcileMutation] = useState(null);
  const [reconcileTargetInvoiceId, setReconcileTargetInvoiceId] = useState('');
  const [reconciling, setReconciling] = useState(false);

  // Simulation State
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simBank, setSimBank] = useState('BCA');
  const [simAmount, setSimAmount] = useState('1650000');
  const [simSender, setSimSender] = useState('ANNISA RAHMAWATI');
  const [simDesc, setSimDesc] = useState('TRANSFER SEWA KAMAR 101 OKTOBER');
  const [simulating, setSimulating] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const activeKost = kostUid || user?.kostUid;
      const [settRes, logsRes, invRes, mutRes] = await Promise.all([
        apiGetDunningSettings().catch(() => ({})),
        apiGetDunningLogs(activeKost).catch(() => []),
        apiGetInvoices(activeKost).catch(() => []),
        apiGetBankMutations().catch(() => [])
      ]);

      if (settRes && Object.keys(settRes).length > 0) {
        setSettings(prev => ({ ...prev, ...settRes }));
      }
      setDunningLogs(Array.isArray(logsRes) ? logsRes : []);
      setInvoices(Array.isArray(invRes) ? invRes : []);
      setBankMutations(Array.isArray(mutRes) ? mutRes : []);
    } catch (err) {
      console.error('Failed to load dunning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [kostUid, user?.kostUid]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiUpdateDunningSettings(settings);
      setActionMsg('✅ Pengaturan otomatisasi dunning & denda harian berhasil disimpan!');
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerReminder = async (invoice, reminderType) => {
    try {
      const res = await apiSendDunningReminder({
        invoiceId: invoice.id,
        reminderType
      });
      setActionMsg(`✅ Pesan pengingat (${reminderType}) siap dikirim ke Kamar ${invoice.kamar}!`);
      loadAllData();
      if (res.waLink) {
        window.open(res.waLink, '_blank');
      }
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal memproses pengingat: ' + err.message);
    }
  };

  const handleSplitInvoice = async (e) => {
    e.preventDefault();
    if (!splitModalInvoice) return;
    setSplittingInvoice(true);
    try {
      await apiSplitInvoiceTerms(splitModalInvoice.id, {
        secondDueDate: splitDueDateTerm2
      });
      setActionMsg(`✅ Opsi cicilan (Split Payment 2x) berhasil diaktifkan untuk Kamar ${splitModalInvoice.kamar}!`);
      setSplitModalInvoice(null);
      loadAllData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal membagi termin: ' + err.message);
    } finally {
      setSplittingInvoice(false);
    }
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!reconcileMutation || !reconcileTargetInvoiceId) {
      alert('Pilih invoice kamar yang sesuai dengan mutasi ini');
      return;
    }
    setReconciling(true);
    try {
      await apiReconcileBankMutation(reconcileMutation.id, {
        invoiceId: reconcileTargetInvoiceId
      });
      setActionMsg(`✅ Mutasi Bank ${reconcileMutation.bank} berhasil direkonsiliasi otomatis! Tagihan lunas.`);
      setReconcileMutation(null);
      loadAllData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal merekonsiliasi: ' + err.message);
    } finally {
      setReconciling(false);
    }
  };

  const handleSimulateMutation = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      await apiSimulateBankMutation({
        bank: simBank,
        amount: Number(simAmount),
        senderName: simSender,
        description: simDesc
      });
      setActionMsg('✅ Mutasi bank baru berhasil disimulasikan di pipeline rekening!');
      setShowSimulateModal(false);
      loadAllData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      alert('Gagal simulasi mutasi: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const formatRupiah = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  // Compute late days & status for each invoice
  const today = new Date();
  const unpaidInvoices = invoices.filter(i => i.status !== 'Lunas');

  return (
    <div className="card glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
          }}>
            <Send size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>
                Fintech Dunning, Denda Dinamis & Rekonsiliasi Bank
              </h3>
              <span style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                Paket 3 Otomasi Kas
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Pipeline pengingat sewa WhatsApp terjadwal, kalkulasi denda harian, split payment cicilan mahasiswa, dan pencocokan mutasi bank.
            </p>
          </div>
        </div>

        <button
          onClick={loadAllData}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Segarkan
        </button>
      </div>

      {actionMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Subtab Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
        {[
          { id: 'pipeline', label: '📱 WhatsApp Dunning & Denda Dinamis', count: unpaidInvoices.length },
          { id: 'mutations', label: '🏦 Rekonsiliasi Mutasi Bank', count: bankMutations.filter(m => m.status === 'pending').length },
          { id: 'split', label: '✂️ Opsi Cicilan (Split Payment 2x)', count: invoices.filter(i => i.isSplit).length }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: activeSubTab === tab.id ? '1px solid #3b82f6' : '1px solid var(--border-color)',
              background: activeSubTab === tab.id ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)' : 'rgba(255, 255, 255, 0.03)',
              color: activeSubTab === tab.id ? '#60a5fa' : 'var(--text-secondary)',
              fontWeight: activeSubTab === tab.id ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span style={{
                background: activeSubTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '10px',
                fontWeight: 800
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 1: WHATSAPP DUNNING PIPELINE & DENDA HARIAN DINAMIS            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Rule Settings Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} color="#60a5fa" /> Aturan Dunning Terjadwal & Denda Keterlambatan
            </h4>

            <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              
              {/* Checkboxes schedule */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>Jadwal Pengingat WhatsApp Aktif:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.reminderHMinus3}
                    onChange={e => setSettings({ ...settings, reminderHMinus3: e.target.checked })}
                  />
                  <span><strong>H-3:</strong> Pemberitahuan Ramah Awal</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.reminderHMinus1}
                    onChange={e => setSettings({ ...settings, reminderHMinus1: e.target.checked })}
                  />
                  <span><strong>H-1:</strong> Pengingat Besok Jatuh Tempo</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.reminderDueDate}
                    onChange={e => setSettings({ ...settings, reminderDueDate: e.target.checked })}
                  />
                  <span><strong>Hari H:</strong> Alert Jatuh Tempo Hari Ini (23:59 WIB)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.reminderOverdue}
                    onChange={e => setSettings({ ...settings, reminderOverdue: e.target.checked })}
                  />
                  <span><strong>H+1+:</strong> Peringatan Keterlambatan (+ Denda Otomatis)</span>
                </label>
              </div>

              {/* Late Fee inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Nominal Denda Harian (Per Hari Keterlambatan):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Rp</span>
                    <input 
                      type="number"
                      min="0"
                      step="1000"
                      value={settings.dailyLateFee}
                      onChange={e => setSettings({ ...settings, dailyLateFee: Number(e.target.value) })}
                      className="input-field"
                      style={{ fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>/ hari</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Masa Tenggang Toleransi (Grace Period):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number"
                      min="0"
                      max="14"
                      value={settings.gracePeriodDays}
                      onChange={e => setSettings({ ...settings, gracePeriodDays: Number(e.target.value) })}
                      className="input-field"
                      style={{ fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Hari bebas denda setelah jatuh tempo</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: '6px', background: '#2563eb', borderColor: '#2563eb' }}
                >
                  {savingSettings ? 'Menyimpan...' : 'Simpan Aturan Dunning'}
                </button>
              </div>

            </form>
          </div>

          {/* Unpaid Invoices Pipeline Queue */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#fbbf24" /> Antrean Tagihan Sewa Belum Lunas ({unpaidInvoices.length})
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Denda harian terhitung otomatis jika melewati batas toleransi ({settings.gracePeriodDays} hari)
              </span>
            </div>

            {unpaidInvoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: '#34d399' }}>
                🎉 Luar biasa! Semua tagihan sewa periode ini telah lunas.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {unpaidInvoices.map(inv => {
                  const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date();
                  const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = diffDays > settings.gracePeriodDays;
                  const lateDays = isOverdue ? diffDays - settings.gracePeriodDays : 0;
                  const lateFee = lateDays * (settings.dailyLateFee || 5000);
                  const grandTotal = Number(inv.total || 0) + lateFee;

                  return (
                    <div key={inv.id} style={{
                      background: isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                      border: isOverdue ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            marginRight: '6px'
                          }}>
                            Kamar {inv.kamar}
                          </span>
                          <strong style={{ fontSize: '0.95rem', color: 'white' }}>{inv.userName || 'Penghuni'}</strong>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isOverdue ? '#fca5a5' : '#fbbf24'
                        }}>
                          {isOverdue ? `⚠️ Lewat ${diffDays} Hari` : `Jatuh Tempo: ${inv.dueDate}`}
                        </span>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                          <span>Sewa Pokok:</span>
                          <strong style={{ color: 'white' }}>{formatRupiah(inv.total)}</strong>
                        </div>
                        {lateFee > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5', marginTop: '2px' }}>
                            <span>Denda Keterlambatan ({lateDays}h):</span>
                            <strong>+{formatRupiah(lateFee)}</strong>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px', fontWeight: 800 }}>
                          <span>Total Tagihan:</span>
                          <span>{formatRupiah(grandTotal)}</span>
                        </div>
                      </div>

                      {/* Quick WhatsApp Reminder Triggers */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleTriggerReminder(inv, isOverdue ? 'overdue' : 'dueDate')}
                          className="btn btn-sm"
                          style={{
                            flex: 1,
                            background: isOverdue ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '6px 10px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Send size={13} />
                          <span>{isOverdue ? 'Alert Denda WA' : 'Kirim Reminder WA'}</span>
                        </button>

                        {!inv.isSplit && (
                          <button
                            type="button"
                            onClick={() => {
                              setSplitModalInvoice(inv);
                              const t2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                              setSplitDueDateTerm2(t2);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                            title="Aktifkan opsi cicilan sewa 2x bagi anak kost"
                          >
                            <Split size={13} /> Cicil 2x
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dunning Send History Log */}
          {dunningLogs.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.25rem'
            }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="#60a5fa" /> Riwayat Pengingat WhatsApp Terkirim ({dunningLogs.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {dunningLogs.slice(0, 10).map(log => (
                  <div key={log.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem'
                  }}>
                    <div>
                      <span style={{ color: '#60a5fa', fontWeight: 700 }}>Kamar {log.kamar}</span>
                      <span style={{ color: '#cbd5e1', marginLeft: '6px' }}>({log.tenantName})</span>
                      <span style={{ color: '#94a3b8', marginLeft: '6px' }}>• {log.reminderTitle}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                      {new Date(log.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}, {new Date(log.sentAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 2: REKONSILIASI MUTASI BANK OTOMATIS                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'mutations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#10b981" /> Feed Mutasi Rekening Bank Masuk
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Mencocokkan transfer masuk rekening BCA, Mandiri, dan BRI ke invoice sewa kamar secara instan tanpa perlu cek struk fisik.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSimulateModal(true)}
              className="btn btn-primary btn-sm"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981', gap: '6px' }}
            >
              <Plus size={14} /> + Simulasi Transfer Masuk
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bankMutations.map(mut => {
              const isMatched = mut.status === 'matched';
              return (
                <div key={mut.id} style={{
                  background: isMatched ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                  border: isMatched ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: mut.bank === 'BCA' ? '#0060af' : mut.bank === 'MANDIRI' ? '#003d79' : '#00529c',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {mut.bank}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#34d399' }}>
                          +{formatRupiah(mut.amount)}
                        </strong>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isMatched ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isMatched ? '#34d399' : '#fbbf24',
                          fontWeight: 700
                        }}>
                          {isMatched ? '✓ Cocok & Terekonsiliasi' : '⏳ Menunggu Rekonsiliasi'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'white', marginTop: '2px', fontWeight: 600 }}>
                        {mut.senderName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {mut.description} • {mut.date}
                      </div>
                    </div>
                  </div>

                  <div>
                    {!isMatched ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReconcileMutation(mut);
                          // Auto select matching invoice if amount matches
                          const matchedInv = unpaidInvoices.find(i => Number(i.total) === Number(mut.amount));
                          setReconcileTargetInvoiceId(matchedInv ? matchedInv.id : (unpaidInvoices[0]?.id || ''));
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.78rem', gap: '6px', background: '#2563eb', borderColor: '#2563eb' }}
                      >
                        <Check size={14} /> Cocokkan ke Kamar
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Terkait Invoice #{mut.reconciledInvoiceId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 3: OPSI CICILAN MAHASISWA (SPLIT PAYMENT 2X)                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'split' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.82rem',
            color: '#cbd5e1'
          }}>
            ℹ️ <strong>Tentang Fitur Split Payment:</strong> Dirancang khusus untuk mahasiswa dan pekerja yang memiliki siklus uang kiriman 2 kali sebulan (tanggal 1 dan tanggal 15). Opsi ini memecah tagihan menjadi Termin 1 (50%) dan Termin 2 (50%) secara otomatis tanpa biaya tambahan.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {invoices.filter(i => i.isSplit).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
                Belum ada invoice yang diaktifkan opsi cicilan 2x. Anda dapat mengaktifkannya dari tab "WhatsApp Dunning".
              </div>
            ) : (
              invoices.filter(i => i.isSplit).map(inv => (
                <div key={inv.id} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'white' }}>
                        Kamar {inv.kamar} — {inv.userName}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>
                        Total Sewa: {formatRupiah(inv.total)} • Status Tagihan: <strong style={{ color: inv.status === 'Lunas' ? '#34d399' : '#fbbf24' }}>{inv.status}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 2 Terms Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '8px' }}>
                    {(inv.splitTerms || []).map(t => (
                      <div key={t.term} style={{
                        background: t.status === 'paid' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        border: t.status === 'paid' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '10px',
                        padding: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'white' }}>
                            Termin {t.term} (50%)
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: t.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: t.status === 'paid' ? '#34d399' : '#fbbf24',
                            fontWeight: 700
                          }}>
                            {t.status === 'paid' ? '✓ LUNAS' : 'BELUM DIBAYAR'}
                          </span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: t.status === 'paid' ? '#34d399' : '#fbbf24', marginTop: '4px' }}>
                          {formatRupiah(t.amount)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          Jatuh Tempo: {t.dueDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: AKTIFKAN SPLIT PAYMENT 2X                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {splitModalInvoice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div className="card glass-panel" style={{ margin: 'auto', maxWidth: '440px', width: '100%', padding: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Split size={18} color="#60a5fa" /> Aktifkan Opsi Cicilan 2x
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Kamar {splitModalInvoice.kamar} ({splitModalInvoice.userName}) — Total {formatRupiah(splitModalInvoice.total)}
            </p>

            <form onSubmit={handleSplitInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Termin 1 (50%):</span>
                  <strong style={{ color: 'white' }}>{formatRupiah(Math.round(splitModalInvoice.total / 2))}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginTop: '4px' }}>
                  <span>Termin 2 (50%):</span>
                  <strong style={{ color: 'white' }}>{formatRupiah(splitModalInvoice.total - Math.round(splitModalInvoice.total / 2))}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Jatuh Tempo Termin 2:
                </label>
                <input 
                  type="date"
                  required
                  value={splitDueDateTerm2}
                  onChange={e => setSplitDueDateTerm2(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSplitModalInvoice(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={splittingInvoice}
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#2563eb', borderColor: '#2563eb' }}
                >
                  {splittingInvoice ? 'Memproses...' : 'Aktifkan Cicilan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: REKONSILIASI MUTASI BANK KE INVOICE                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {reconcileMutation && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div className="card glass-panel" style={{ margin: 'auto', maxWidth: '460px', width: '100%', padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" /> Rekonsiliasi Mutasi Bank
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Hubungkan transfer masuk ini ke tagihan sewa kamar untuk melunasi otomatis.
            </p>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Transfer Masuk {reconcileMutation.bank}:</div>
              <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>+{formatRupiah(reconcileMutation.amount)}</strong>
              <div style={{ fontSize: '0.75rem', color: 'white', marginTop: '2px' }}>Pengirim: {reconcileMutation.senderName}</div>
            </div>

            <form onSubmit={handleReconcile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Pilih Tagihan Kamar yang Sesuai:
                </label>
                <select
                  className="input-field"
                  value={reconcileTargetInvoiceId}
                  onChange={e => setReconcileTargetInvoiceId(e.target.value)}
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  {unpaidInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      Kamar {inv.kamar} - {inv.userName} ({formatRupiah(inv.total)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReconcileMutation(null)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={reconciling || !reconcileTargetInvoiceId}
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
                >
                  {reconciling ? 'Menyimpan...' : 'Konfirmasi Lunas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: SIMULASI MUTASI BANK MASUK                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showSimulateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div className="card glass-panel" style={{ margin: 'auto', maxWidth: '440px', width: '100%', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: 'white' }}>
              Simulasi Transfer Masuk Bank
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Uji coba penerimaan dana transfer rekening untuk pembuktian auto-reconcile.
            </p>

            <form onSubmit={handleSimulateMutation} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '2px' }}>Pilihan Bank:</label>
                <select className="input-field" value={simBank} onChange={e => setSimBank(e.target.value)} style={{ background: '#0f172a' }}>
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="MANDIRI">Bank Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '2px' }}>Nominal Transfer (Rp):</label>
                <input type="number" required value={simAmount} onChange={e => setSimAmount(e.target.value)} className="input-field" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '2px' }}>Nama Pengirim Rekening:</label>
                <input type="text" required value={simSender} onChange={e => setSimSender(e.target.value)} className="input-field" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '2px' }}>Berita Acara / Keterangan Transfer:</label>
                <input type="text" value={simDesc} onChange={e => setSimDesc(e.target.value)} className="input-field" />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSimulateModal(false)} style={{ flex: 1 }}>Batal</button>
                <button type="submit" disabled={simulating} className="btn btn-primary" style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}>
                  {simulating ? 'Menyimpan...' : 'Simulasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
