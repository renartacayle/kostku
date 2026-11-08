import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import Footer from '../components/Footer';

export default function KebijakanPrivasi() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <header style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/logo.png" 
              alt="Logo KostKu" 
              style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'contain' }} 
            />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>KostKu</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '3rem 1.5rem 2rem'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#93c5fd',
            fontSize: '0.78rem',
            fontWeight: 800,
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={14} color="#60a5fa" />
            Dokumen Kebijakan Resmi & Legalitas Platform
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            margin: '0 0 10px',
            color: '#ffffff',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)'
          }}>
            Kebijakan Privasi (Privacy Policy)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            Terakhir diperbarui: <strong>25 Oktober 2026</strong>. Dokumen ini menjelaskan bagaimana KostKu (kostku.riuph.me) mengumpulkan, mengelola, menggunakan, dan melindungi data pribadi Anda sesuai Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).
          </p>
        </div>
      </div>

      {/* Main Content Article */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem', flex: 1, lineHeight: 1.8 }}>
        
        {/* Section 1 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            1. Informasi Umum & Komitmen Kami
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            Selamat datang di <strong>KostKu</strong> (dapat diakses melalui situs web resmi <code>https://kostku.riuph.me</code>). Kami sangat menghargai privasi setiap pengguna, baik pencari kost, calon penghuni, penghuni aktif, maupun mitra pemilik kost. Kebijakan Privasi ini merupakan bentuk komitmen nyata kami dalam menjaga kerahasiaan dan integritas setiap data pribadi yang Anda percayakan kepada kami.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            2. Data Pribadi yang Kami Kumpulkan
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            Kami hanya mengumpulkan data yang relevan dan dibutuhkan untuk menjalankan transaksi hunian serta operasional kost:
          </p>
          <ul style={{ color: '#cbd5e1', fontSize: '0.92rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Data Identitas Diri:</strong> Nama lengkap, alamat email aktif, dan nomor telepon/WhatsApp untuk keperluan konfirmasi reservasi hunian dan komunikasi layanan.</li>
            <li><strong>Data Transaksi Pembayaran:</strong> Riwayat tagihan sewa, nominal pembayaran, metode pembayaran yang dipilih (QRIS Dinamis, Virtual Account), status pembayaran (Pending/Paid), serta nomor seri kuitansi digital yang diterbitkan. Kami <em>tidak pernah</em> menyimpan nomor kartu debit, PIN, atau kredensial perbankan pribadi Anda.</li>
            <li><strong>Data Properti & Kamar (Bagi Pemilik):</strong> Nama kost, alamat lokasi, nomor rekening/e-wallet pencairan, daftar fasilitas, foto kamar asli, dan peraturan tata tertib kost.</li>
            <li><strong>Data Teknis:</strong> Alamat IP, jenis peramban (browser), informasi log aktivitas, dan data geolokasi GPS (hanya jika Anda secara eksplisit mengizinkan fitur "Gunakan Lokasi GPS Saya" untuk mencari kost terdekat).</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            3. Tujuan Pemrosesan & Penggunaan Data
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            Data pribadi Anda digunakan semata-mata untuk:
          </p>
          <ul style={{ color: '#cbd5e1', fontSize: '0.92rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Memfasilitasi reservasi kamar kost dan menghubungkan calon penghuni dengan pemilik kost secara transparan.</li>
            <li>Memproses pembayaran sewa dan utilitas kamar (listrik token PLN, air PDAM) melalui mitra Payment Gateway resmi berlisensi Bank Indonesia (TriPay).</li>
            <li>Menerbitkan Kuitansi Digital Resmi dengan nomor seri unik setelah transaksi berhasil divalidasi.</li>
            <li>Memberikan notifikasi pengingat jatuh tempo sewa, pembaharuan kontrak hunian, serta tiket tindak lanjut komplain fasilitas.</li>
            <li>Memenuhi kewajiban kepatuhan hukum, audit perpajakan, dan pencegahan tindak penipuan siber.</li>
          </ul>
        </section>

        {/* Section 4: Pembayaran & Pihak Ketiga */}
        <section style={{
          marginBottom: '2rem',
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '1.25rem'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} />
            4. Keamanan Transaksi & Mitra Payment Gateway (TriPay)
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            Seluruh transaksi pembayaran non-tunai di platform KostKu diproses melalui mitra resmi Payment Gateway <strong>TriPay (PT Tiga Rambu Unggul)</strong> yang telah terdaftar dan diawasi oleh <strong>Bank Indonesia</strong>. KostKu tidak memegang data sensitif perbankan Anda. Komunikasi data antara server KostKu, browser Anda, dan server TriPay dienkripsi menggunakan protokol standar industri <strong>SSL/TLS 256-bit (Let's Encrypt)</strong>.
          </p>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            5. Hak-Hak Pengguna
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            Sesuai regulasi UU Perlindungan Data Pribadi di Indonesia, Anda berhak untuk:
          </p>
          <ul style={{ color: '#cbd5e1', fontSize: '0.92rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Mengakses dan meninjau data profil Anda yang tersimpan di sistem KostKu.</li>
            <li>Memperbarui atau memperbaiki data pribadi yang keliru melalui menu Pengaturan Akun.</li>
            <li>Meminta penghapusan akun atau penarikan izin pemrosesan data tertentu dengan menghubungi Layanan Pelanggan kami.</li>
          </ul>
        </section>

        {/* Section 6: Kontak Resmi */}
        <section style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            6. Kontak Petugas Perlindungan Data & Layanan Pelanggan
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            Apabila Anda memiliki pertanyaan, masukan, atau kendala seputar Kebijakan Privasi ini, silakan menghubungi kami melalui:
          </p>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.86rem'
          }}>
            <div><strong>Pengelola Platform:</strong> KostKu (Oscar H. W. / Mbak Rena)</div>
            <div><strong>Alamat Operasional:</strong> Semarang, Jawa Tengah (Area Kampus UDINUS & Imam Bonjol)</div>
            <div><strong>WhatsApp Customer Service:</strong> <a href="https://wa.me/6281228263200" style={{ color: '#34d399', textDecoration: 'none', fontWeight: 700 }}>+62 812-2826-3200</a></div>
            <div><strong>Email Resmi:</strong> <a href="mailto:111202516309@mhs.dinus.ac.id" style={{ color: '#60a5fa', textDecoration: 'none' }}>111202516309@mhs.dinus.ac.id</a></div>
            <div><strong>Situs Web Resmi:</strong> <a href="https://kostku.riuph.me" style={{ color: '#38bdf8', textDecoration: 'none' }}>https://kostku.riuph.me</a></div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
