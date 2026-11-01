import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Share2, 
  Printer, 
  X, 
  RefreshCw, 
  Clock, 
  Sparkles,
  TrendingUp,
  Receipt,
  Trash2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  apiGetStaffKasbon, 
  apiCreateStaffKasbon, 
  apiUpdateStaffKasbon, 
  apiDeleteStaffKasbon,
  apiCalculateStaffPayroll, 
  apiGenerateStaffPayroll, 
  apiGetStaffPayrolls 
} from '../services/api';

const MONTH_OPTIONS = [
  { val: '2026-10', label: 'Oktober 2026' },
  { val: '2026-11', label: 'November 2026' },
  { val: '2026-12', label: 'Desember 2026' },
  { val: '2026-09', label: 'September 2026' }
];

export default function StaffPayrollAndKasbon({ staff, user }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [payrollCalculation, setPayrollCalculation] = useState(null);
  const [kasbonList, setKasbonList] = useState([]);
  const [payrollsHistory, setPayrollsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // Modal Kasbon Baru
  const [showKasbonModal, setShowKasbonModal] = useState(false);
  const [kasbonAmount, setKasbonAmount] = useState('');
  const [kasbonReason, setKasbonReason] = useState('');
  const [kasbonMonth, setKasbonMonth] = useState(selectedMonth);
  const [submittingKasbon, setSubmittingKasbon] = useState(false);

  // Modal Slip Gaji Terbit / View
  const [viewingSlip, setViewingSlip] = useState(null);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  const loadData = async () => {
    if (!staff?.id) return;
    setLoading(true);
    try {
      const [calcRes, kasRes, paysRes] = await Promise.all([
        apiCalculateStaffPayroll(staff.id, selectedMonth).catch(() => null),
        apiGetStaffKasbon({ staffId: staff.id, ownerId: user?.id, kostUid: staff.kostUid }).catch(() => []),
        apiGetStaffPayrolls({ staffId: staff.id, ownerId: user?.id }).catch(() => [])
      ]);
      setPayrollCalculation(calcRes);
      setKasbonList(Array.isArray(kasRes) ? kasRes : []);
      setPayrollsHistory(Array.isArray(paysRes) ? paysRes : []);
    } catch (err) {
      console.error('Failed loading payroll & kasbon:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [staff?.id, selectedMonth]);

  const handleCreateKasbon = async (e) => {
    e.preventDefault();
    if (!kasbonAmount || Number(kasbonAmount) <= 0) {
      alert('Masukkan nominal kasbon yang valid');
      return;
    }
    setSubmittingKasbon(true);
    try {
      await apiCreateStaffKasbon({
        staffId: staff.id,
        staffName: staff.name,
        ownerId: user?.id,
        kostUid: staff.kostUid,
        amount: Number(kasbonAmount),
        reason: kasbonReason || 'Kasbon kebutuhan mendesak',
        installmentMonth: kasbonMonth
      });
      setShowKasbonModal(false);
      setKasbonAmount('');
      setKasbonReason('');
      setActionMsg('✅ Pencatatan kasbon berhasil disimpan!');
      setTimeout(() => setActionMsg(null), 4000);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal mencatat kasbon');
    } finally {
      setSubmittingKasbon(false);
    }
  };

  const handleDeleteKasbon = async (id) => {
    if (!window.confirm('Yakin ingin menghapus catatan kasbon ini?')) return;
    try {
      await apiDeleteStaffKasbon(id);
      setActionMsg('🗑️ Catatan kasbon dihapus.');
      setTimeout(() => setActionMsg(null), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus kasbon');
    }
  };

  const handleGenerateOfficialPayroll = async () => {
    if (!payrollCalculation) return;
    if (!window.confirm(`Terbitkan Slip Gaji resmi untuk ${staff.name} periode ${selectedMonth} sebesar Rp ${payrollCalculation.netSalary.toLocaleString('id-ID')}?`)) return;

    setGeneratingPayroll(true);
    try {
      const res = await apiGenerateStaffPayroll({
        staffId: staff.id,
        month: selectedMonth,
        baseSalary: payrollCalculation.baseSalary,
        totalBonus: payrollCalculation.totalBonus,
        bonusDetails: `${payrollCalculation.workLogsCount} Tugas Lapangan (Rp ${payrollCalculation.taskBonus.toLocaleString('id-ID')}) + ${payrollCalculation.resolvedComplaintsCount} Komplain Selesai (Rp ${payrollCalculation.complaintBonus.toLocaleString('id-ID')})`,
        kasbonDeduction: payrollCalculation.kasbonDeduction,
        netSalary: payrollCalculation.netSalary,
        notes: `Gaji dihitung dari ${payrollCalculation.presentDays} hari kehadiran (${payrollCalculation.totalHoursWorked} jam kerja).`
      });

      if (res?.payroll) {
        setViewingSlip(res.payroll);
      }
      setActionMsg('✅ Slip gaji resmi berhasil diterbitkan!');
      setTimeout(() => setActionMsg(null), 4000);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menerbitkan slip gaji');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const handleSendSlipViaWhatsApp = (slip) => {
    const phone = slip.phone || staff.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const message = 
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *SLIP GAJI KARYAWAN KOSTKU*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `No. Slip : *${slip.slipNumber}*\n` +
      `Periode  : *${slip.month}*\n` +
      `Nama     : *${slip.staffName}*\n` +
      `Jabatan  : *${slip.jobTitle || 'Penjaga Kost'}*\n` +
      `Tanggal  : ${slip.formattedDate || new Date().toLocaleDateString('id-ID')}\n\n` +
      `*RINCIAN PENERIMAAN (EARNINGS):*\n` +
      `• Gaji Pokok       : Rp ${Number(slip.baseSalary).toLocaleString('id-ID')}\n` +
      `• Bonus & Insentif : Rp ${Number(slip.totalBonus).toLocaleString('id-ID')}\n` +
      `  ↳ ${slip.bonusDetails || 'Insentif tugas & komplain selesai'}\n` +
      `*Total Penerimaan  : Rp ${(Number(slip.baseSalary) + Number(slip.totalBonus)).toLocaleString('id-ID')}*\n\n` +
      `*POTONGAN (DEDUCTIONS):*\n` +
      `• Potongan Kasbon  : Rp ${Number(slip.kasbonDeduction).toLocaleString('id-ID')}\n` +
      `*Total Potongan    : Rp ${Number(slip.kasbonDeduction).toLocaleString('id-ID')}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*GAJI BERSIH (TAKE HOME PAY):*\n` +
      `💰 *Rp ${Number(slip.netSalary).toLocaleString('id-ID')}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Status: *LUNAS & DITRANSFER*\n\n` +
      `Terima kasih atas kerja keras dan dedikasi Anda menjaga keamanan & kenyamanan hunian kost. 🙏✨`;

    const url = waNumber 
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const activeKasbonTotal = kasbonList
    .filter(k => k.status === 'aktif')
    .reduce((acc, cur) => acc + (cur.remainingAmount || cur.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Alert */}
      {actionMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px',
          padding: '10px 14px',
          color: '#34d399',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Top 4 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        
        {/* KPI 1: Gaji Pokok */}
        <div className="card glass-panel" style={{ padding: '1.15rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Gaji Pokok Terdaftar
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
            Rp {Number(payrollCalculation?.baseSalary || staff.salary || 2500000).toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {staff.jobTitle || 'Penjaga Kost'}
          </span>
        </div>

        {/* KPI 2: Kehadiran Riil */}
        <div className="card glass-panel" style={{ padding: '1.15rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Kehadiran Bulan Ini
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
            {payrollCalculation?.presentDays || 0} Hari
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Total {payrollCalculation?.totalHoursWorked || 0} Jam Kerja
          </span>
        </div>

        {/* KPI 3: Kasbon Aktif */}
        <div className="card glass-panel" style={{ padding: '1.15rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Kasbon Aktif Bulan Ini
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: activeKasbonTotal > 0 ? '#f87171' : '#34d399' }}>
            Rp {activeKasbonTotal.toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {kasbonList.filter(k => k.status === 'aktif').length} cicilan aktif
          </span>
        </div>

        {/* KPI 4: Gaji Bersih Estimasi */}
        <div className="card glass-panel" style={{ padding: '1.15rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Take Home Pay (Gaji Bersih)
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>
            Rp {Number(payrollCalculation?.netSalary || 0).toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Pokok + Bonus - Kasbon
          </span>
        </div>

      </div>

      {/* Mesin Kalkulasi Otomatis (Closed-Loop Engine) */}
      <div className="card glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>
                Kalkulasi Gaji Bersih Otomatis ({selectedMonth})
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Dihitung otomatis dari riwayat absensi, tugas foto harian selesai, komplain tertangani, dan potongan cicilan kasbon.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              {MONTH_OPTIONS.map(m => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleGenerateOfficialPayroll}
              disabled={generatingPayroll || !payrollCalculation}
              className="btn btn-success btn-sm"
              style={{ gap: '6px', fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Receipt size={14} /> Terbitkan Slip Gaji Resmi
            </button>
          </div>
        </div>

        {/* Breakdown Table */}
        {payrollCalculation ? (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              
              {/* Kolom Kiri: Penerimaan (Earnings) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '4px' }}>
                  (+) KOMPONEN PENERIMAAN
                </span>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#e2e8f0' }}>Gaji Pokok Bulanan:</span>
                  <strong style={{ color: '#ffffff' }}>Rp {payrollCalculation.baseSalary.toLocaleString('id-ID')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#e2e8f0' }}>Bonus Tugas Lapangan ({payrollCalculation.workLogsCount} Foto Tugas):</span>
                  <strong style={{ color: '#38bdf8' }}>+ Rp {payrollCalculation.taskBonus.toLocaleString('id-ID')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#e2e8f0' }}>Bonus Komplain Selesai ({payrollCalculation.resolvedComplaintsCount} Tiket):</span>
                  <strong style={{ color: '#38bdf8' }}>+ Rp {payrollCalculation.complaintBonus.toLocaleString('id-ID')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '6px', borderTop: '1px dashed var(--border-light)' }}>
                  <strong style={{ color: '#34d399' }}>Total Penerimaan:</strong>
                  <strong style={{ color: '#34d399' }}>
                    Rp {(payrollCalculation.baseSalary + payrollCalculation.totalBonus).toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

              {/* Kolom Kanan: Potongan (Deductions) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '4px' }}>
                  (-) KOMPONEN POTONGAN
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#e2e8f0' }}>Potongan Kasbon Periode Ini:</span>
                  <strong style={{ color: '#f87171' }}>
                    - Rp {payrollCalculation.kasbonDeduction.toLocaleString('id-ID')}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#e2e8f0' }}>Denda Mangkir / Keterlambatan:</span>
                  <strong style={{ color: '#94a3b8' }}>
                    Rp {payrollCalculation.absencePenalty.toLocaleString('id-ID')}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '6px', borderTop: '1px dashed var(--border-light)' }}>
                  <strong style={{ color: '#f87171' }}>Total Potongan:</strong>
                  <strong style={{ color: '#f87171' }}>
                    - Rp {payrollCalculation.kasbonDeduction.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

            </div>

            {/* Total Net Take Home Pay Banner */}
            <div style={{
              marginTop: '14px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#a7f3d0', display: 'block', fontWeight: 700 }}>
                  GAJI BERSIH YANG DITRANSFER KE KARYAWAN:
                </span>
                <span style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                  Periode {selectedMonth} • {staff.name}
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399' }}>
                Rp {payrollCalculation.netSalary.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            Memuat kalkulasi gaji...
          </div>
        )}
      </div>

      {/* Grid: Manajemen Kasbon & Riwayat Slip Gaji */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Section 1: Manajemen Kasbon Staf */}
        <div className="card glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Pencatatan Kasbon Staf</h4>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Cicilan kasbon otomatis memotong gaji bulan berjalan
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowKasbonModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '4px', fontSize: '0.74rem' }}
            >
              <Plus size={13} /> Tambah Kasbon
            </button>
          </div>

          {kasbonList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Belum ada riwayat kasbon untuk karyawan ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {kasbonList.map(k => (
                <div
                  key={k.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                        Rp {Number(k.amount).toLocaleString('id-ID')}
                      </strong>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: k.status === 'lunas' ? 'rgba(16, 185, 129, 0.15)' : k.status === 'dipotong_gaji' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: k.status === 'lunas' ? '#34d399' : k.status === 'dipotong_gaji' ? '#60a5fa' : '#fbbf24',
                        fontWeight: 700
                      }}>
                        {k.status === 'dipotong_gaji' ? 'Dipotong Gaji' : k.status === 'lunas' ? 'Lunas' : 'Aktif'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                      {k.reason} • Periode {k.installmentMonth}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteKasbon(k.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Hapus kasbon"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Riwayat Slip Gaji Terbit */}
        <div className="card glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Riwayat Slip Gaji Terbit</h4>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Arsip slip gaji resmi yang siap dikirim via WhatsApp
              </span>
            </div>
          </div>

          {payrollsHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Belum ada slip gaji yang diterbitkan. Klik "Terbitkan Slip Gaji Resmi" di atas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payrollsHistory.map(slip => (
                <div
                  key={slip.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                        {slip.slipNumber}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                        Lunas
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                      Periode {slip.month} • <strong>Rp {Number(slip.netSalary).toLocaleString('id-ID')}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setViewingSlip(slip)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      <FileText size={12} /> Lihat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendSlipViaWhatsApp(slip)}
                      className="btn btn-success btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      title="Kirim ke WhatsApp Staf"
                    >
                      <Share2 size={12} /> WA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: CATAT KASBON BARU */}
      {showKasbonModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '18px',
            padding: '1.5rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>Pencatatan Kasbon Staf</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Karyawan: {staff.name}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowKasbonModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateKasbon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Nominal Kasbon (Rp):
                </label>
                <input
                  type="number"
                  value={kasbonAmount}
                  onChange={(e) => setKasbonAmount(e.target.value)}
                  placeholder="Contoh: 200000"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Bulan Pemotongan Gaji:
                </label>
                <select
                  value={kasbonMonth}
                  onChange={(e) => setKasbonMonth(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  {MONTH_OPTIONS.map(m => (
                    <option key={m.val} value={m.val}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Alasan / Keterangan Kasbon:
                </label>
                <textarea
                  rows="2"
                  value={kasbonReason}
                  onChange={(e) => setKasbonReason(e.target.value)}
                  placeholder="Contoh: Beli sparepart motor dinas / biaya berobat anak"
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowKasbonModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingKasbon}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', gap: '6px' }}
                >
                  {submittingKasbon ? <RefreshCw size={14} className="animate-spin" /> : <CreditCard size={14} />}
                  {submittingKasbon ? 'Menyimpan...' : 'Simpan Kasbon'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: VIEW RESMI SLIP GAJI & WHATSAPP SENDER */}
      {viewingSlip && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '1.75rem',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95)'
          }}>
            {/* Kop Slip Gaji */}
            <div style={{ borderBottom: '2px solid rgba(16, 185, 129, 0.3)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.5px' }}>
                    KOSTKU PAYROLL
                  </h2>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    Sistem Slip Gaji Resmi Staf Hunian
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setViewingSlip(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Slip Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', marginBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Nomor Slip:</span>
                <strong style={{ color: '#38bdf8' }}>{viewingSlip.slipNumber}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Periode:</span>
                <strong style={{ color: '#ffffff' }}>{viewingSlip.month}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Nama Karyawan:</span>
                <strong style={{ color: '#ffffff' }}>{viewingSlip.staffName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Jabatan:</span>
                <span style={{ color: '#e2e8f0' }}>{viewingSlip.jobTitle || 'Penjaga Kost'}</span>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                [+] PENERIMAAN
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: '#e2e8f0' }}>Gaji Pokok:</span>
                <strong style={{ color: 'white' }}>Rp {Number(viewingSlip.baseSalary).toLocaleString('id-ID')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: '#e2e8f0' }}>Bonus & Insentif:</span>
                <strong style={{ color: '#38bdf8' }}>Rp {Number(viewingSlip.totalBonus).toLocaleString('id-ID')}</strong>
              </div>
              {viewingSlip.bonusDetails && (
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '4px' }}>
                  ↳ {viewingSlip.bonusDetails}
                </div>
              )}
            </div>

            {/* Deductions Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                [-] POTONGAN
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#e2e8f0' }}>Potongan Cicilan Kasbon:</span>
                <strong style={{ color: '#f87171' }}>Rp {Number(viewingSlip.kasbonDeduction).toLocaleString('id-ID')}</strong>
              </div>
            </div>

            {/* Total Take Home Pay */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '0.76rem', color: '#a7f3d0', fontWeight: 700, display: 'block' }}>
                  GAJI BERSIH (TAKE HOME PAY)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#e2e8f0' }}>
                  Status: Lunas & Ditransfer
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#34d399' }}>
                Rp {Number(viewingSlip.netSalary).toLocaleString('id-ID')}
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Close */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewingSlip(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleSendSlipViaWhatsApp(viewingSlip)}
                className="btn btn-success"
                style={{ padding: '8px 18px', fontSize: '0.82rem', gap: '6px' }}
              >
                <Share2 size={14} /> Kirim ke WhatsApp Staf
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
