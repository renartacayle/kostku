import React from 'react';
import { Link } from 'react-router-dom';
import { Building, ArrowLeft, GraduationCap, MapPin, Phone, Mail, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';

export default function TentangKami() {
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
            <Building size={14} color="#60a5fa" />
            Mengenal Lebih Dekat Ekosistem KostKu
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            margin: '0 0 10px',
            color: '#ffffff',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)'
          }}>
            Tentang Kami (About Us)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            Solusi digital manajemen hunian sewa pintar & co-living hyperlocal karya mahasiswa Fakultas Ilmu Komputer Universitas Dian Nuswantoro (UDINUS) Semarang.
          </p>
        </div>
      </div>

      {/* Main Content Article */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem', flex: 1, lineHeight: 1.8 }}>
        
        {/* Section 1: Profil */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            Transformasi Digital Hunian Kost Indonesia
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.94rem' }}>
            <strong>KostKu</strong> (<code>https://kostku.riuph.me</code>) lahir dari pengalaman nyata mahasiswa dan pemilik kost di area kampus Semarang yang kerap menghadapi kendala pencarian hunian: foto kamar palsu (zonk), perantara calo dengan harga dinaikkan sepihak, hingga pencatatan tagihan sewa manual di buku tulis yang rawan selisih dan sengketa.
          </p>
          <p style={{ color: '#cbd5e1', fontSize: '0.94rem' }}>
            Hadir sebagai platform <em>all-in-one</em>, KostKu menghubungkan pemilik properti dan penyewa melalui transparansi 100%: <strong>foto kamar asli terverifikasi</strong>, informasi fasilitas jujur, titik GPS peta akurat, kalkulator utilitas mandiri, serta integrasi sistem pembayaran QRIS Dinamis dan Virtual Account instan.
          </p>
        </section>

        {/* Section 2: Visi & Misi */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Sparkles size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Visi Kami</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Menjadi standar platform manajemen hunian sewa dan co-living nomor satu di Indonesia yang mengutamakan transparansi harga, keamanan transaksi perbankan digital, dan kenyamanan hidup komunitas penghuni.
            </p>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Award size={20} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Misi Kami</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Memberantas praktik mark-up calo liar di lingkungan kampus.</li>
              <li>Menghadirkan verifikasi foto kamar asli dan rute GPS akurat.</li>
              <li>Otomatisasi invoice dan kuitansi digital sah bagi pengelola.</li>
              <li>Integrasi pembayaran non-tunai resmi via TriPay Gateway.</li>
            </ul>
          </div>
        </div>

        {/* Section 3: Latar Belakang Riset & Identitas Legal */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '18px',
          padding: '1.5rem',
          marginBottom: '2.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <GraduationCap size={24} color="#60a5fa" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              Inovasi Teknologi Akademik UDINUS Semarang
            </h3>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
            KostKu dikembangkan secara profesional sebagai proyek inovasi rekayasa perangkat lunak di bawah naungan <strong>Program Studi S1 Teknik Informatika, Fakultas Ilmu Komputer, Universitas Dian Nuswantoro (UDINUS) Semarang</strong>. Platform ini mengimplementasikan spesifikasi kebutuhan perangkat lunak (SKPL) modern, arsitektur cloud serverless, dan standar keamanan perbankan Bank Indonesia.
          </p>

          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
            fontSize: '0.84rem'
          }}>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Pengembang & Lead Architect:</span>
              <strong style={{ color: '#ffffff' }}>Oscar Herdian Wijaya (Mbak Rena)</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>NIM / Institusi:</span>
              <strong style={{ color: '#93c5fd' }}>A11.2025.16309 • UDINUS</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>WhatsApp Kontak:</span>
              <strong style={{ color: '#34d399' }}>081228263200</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Domain Resmi:</span>
              <strong style={{ color: '#38bdf8' }}>kostku.riuph.me</strong>
            </div>
          </div>
        </section>

        {/* Section 4: Kontak & Dukungan */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Kunjungi atau Hubungi Kantor Layanan Kami
          </h2>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.88rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
              <MapPin size={18} color="#38bdf8" />
              <span>Gedung Fakultas Ilmu Komputer, Universitas Dian Nuswantoro, Jl. Imam Bonjol No. 207, Pendrikan Kidul, Semarang Tengah, Kota Semarang, Jawa Tengah 50131</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
              <Phone size={18} color="#34d399" />
              <a href="https://wa.me/6281228263200" style={{ color: '#34d399', textDecoration: 'none', fontWeight: 700 }}>+62 812-2826-3200 (CS Resmi KostKu)</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
              <Mail size={18} color="#60a5fa" />
              <a href="mailto:111202516309@mhs.dinus.ac.id" style={{ color: '#60a5fa', textDecoration: 'none' }}>111202516309@mhs.dinus.ac.id</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
