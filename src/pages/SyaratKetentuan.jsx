import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Scale, 
  CreditCard, 
  CheckCircle2, 
  ShieldAlert, 
  Gavel, 
  Building2, 
  HelpCircle,
  Store,
  Coins
} from 'lucide-react';
import Footer from '../components/Footer';

export default function SyaratKetentuan() {
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
            <FileText size={14} color="#60a5fa" />
            Dokumen Perjanjian Layanan & Perlindungan Hukum Platform
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            margin: '0 0 10px',
            color: '#ffffff',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)'
          }}>
            Syarat & Ketentuan Layanan (Terms of Service)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            Terakhir diperbarui: <strong>25 Oktober 2026</strong>. Dokumen ini memuat hak, kewajiban, batasan tanggung jawab hukum, pelepasan tuntutan, serta klausul ganti rugi dalam penggunaan sistem platform teknologi <strong>KostKu</strong> (<code>https://kostku.riuph.me</code>).
          </p>
        </div>
      </div>

      {/* Main Content Article */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem', flex: 1, lineHeight: 1.8 }}>
        
        {/* PEMBERITAHUAN PENTING (CALLOUT BOX) */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} color="#f87171" />
            <strong style={{ color: '#fca5a5', fontSize: '0.95rem' }}>
              PENTING DIBACA DENGAN SEKSAMA SEBELUM MENGGUNAKAN PLATFORM
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            Dengan mendaftar, mengakses, atau melakukan transaksi pembayaran melalui platform KostKu, Anda menyatakan telah membaca, memahami, dan menyetujui tanpa syarat seluruh klausul dalam Syarat & Ketentuan ini, termasuk <strong>Pelepasan Tanggung Jawab Platform</strong>, <strong>Batasan Nilai Ganti Rugi</strong>, serta <strong>Klausul Ganti Rugi Balik (Indemnification)</strong>. Apabila Anda tidak menyetujui sebagian atau seluruh ketentuan ini, Anda tidak diperkenankan menggunakan platform KostKu.
          </p>
        </div>

        {/* Pasal 1 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            Pasal 1: Kedudukan Hukum Platform (Penyedia Software & Perantara Teknologi)
          </h2>
          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>
              1.1. <strong>Platform Perantara Teknologi:</strong> Sesuai Surat Edaran Menteri Komunikasi dan Informatika Republik Indonesia No. 5 Tahun 2016 serta Undang-Undang Informasi dan Transaksi Elektronik (UU ITE), <strong>KostKu adalah murni penyedia sistem perangkat lunak (software application) dan sarana temu-kembali informasi digital (intermediary platform)</strong> yang memfasilitasi pencarian hunian serta pencatatan tagihan sewa.
            </p>
            <p style={{ margin: 0 }}>
              1.2. <strong>Bukan Pihak dalam Perjanjian Sewa-Menyewa Fisik:</strong> Hubungan hukum perjanjian sewa-menyewa kamar, penyerahan kunci, dan penggunaan fasilitas fisik terjadi <strong>secara langsung dan eksklusif antara Pemilik Kost dan Penyewa/Penghuni</strong>. KostKu BUKAN pemilik properti fisik, bukan agen real estat, bukan penjamin kelayakan bangunan, bukan pengelola kebersihan harian fisik, dan bukan pihak yang menanggung risiko fisik di lokasi hunian kost.
            </p>
            <p style={{ margin: 0 }}>
              1.3. <strong>Bukan Pihak Pemberi Kerja bagi Karyawan Lapangan:</strong> Pencatatan data staf, penjaga kost, atau teknisi pada sistem KostKu semata-mata merupakan alat bantu administrasi bagi Pemilik Properti. Hubungan kerja dan tanggung jawab ketenagakerjaan staf lapangan sepenuhnya merupakan beban hukum masing-masing Pemilik Kost.
            </p>
          </div>
        </section>

        {/* Pasal 2: BATASAN TANGGUNG JAWAB & PELEPASAN TUNTUTAN (LEGAL SHIELD) */}
        <section style={{
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '18px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <ShieldAlert size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Pasal 2: Pelepasan Tanggung Jawab Mutlak (Disclaimer of Liability & Hold Harmless)
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '0 0 1rem' }}>
            Sejauh diizinkan oleh peraturan perundang-undangan Negara Republik Indonesia, Pengguna dengan ini membebaskan platform KostKu, pengembang (Oscar H. W. / Mbak Rena), afiliasi, dan pengelola dari segala tuntutan hukum yang timbul dari hal-hal berikut:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px' }}>
              <strong>a. Kehilangan, Pencurian, atau Kerusakan Barang:</strong> KostKu tidak bertanggung jawab atas kehilangan barang berharga milik penghuni, pencurian di dalam kamar atau area kost, kerusakan kendaraan di area parkir, atau kerusakan perabot akibat kelalaian penghuni atau pihak lain.
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px' }}>
              <strong>b. Tindak Pidana, Kriminalitas, atau Pelanggaran Asusila:</strong> Segala perbuatan melanggar hukum di area kost (termasuk penyalahgunaan narkotika, miras, perjudian, pencurian, perkelahian, asusila, atau kekerasan) adalah tanggung jawab pidana dan perdata mutlak dari pelaku dan pemilik properti. KostKu terbebas 100% dari tuntutan hukum apa pun.
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px' }}>
              <strong>c. Kecelakaan Fisik, Cedera, atau Kematian:</strong> KostKu tidak bertanggung jawab atas cedera tubuh, sakit, kecelakaan (seperti kebakaran gedung, korsleting instalasi lama, kebocoran gas, terpeleset di kamar mandi), atau kematian yang terjadi di lingkungan properti mitra.
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px' }}>
              <strong>d. Ketidaksesuaian Fasilitas & Informasi Listing ("AS IS"):</strong> Informasi fasilitas dan foto diunggah oleh pemilik properti. Meskipun KostKu melakukan kurasi dan verifikasi bertahap, listing disediakan atas dasar <em>"AS IS"</em> (sebagaimana adanya). Calon penghuni wajib melakukan survei fisik langsung sebelum menyetujui kontrak sewa. Masalah air PDAM mati, AC rusak, atau ketidaknyamanan kamar diselesaikan langsung dengan pemilik properti.
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px' }}>
              <strong>e. Sengketa Uang Muka (DP), Deposit, & Pengembalian Sewa:</strong> Perselisihan penahanan uang deposit jaminan atau penolakan pengembalian sewa oleh Pemilik Kost merupakan sengketa privat antara kedua belah pihak di luar tanggung jawab KostKu.
            </div>
          </div>
        </section>

        {/* Pasal 3: PEMBATASAN NILAI GANTI RUGI MAKSIMAL (CAP OF LIABILITY) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            Pasal 3: Batasan Maksimal Tanggung Jawab Finansial (Limitation of Liability Cap)
          </h2>
          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>
              3.1. <strong>Batas Ganti Rugi Finansial Maksimal:</strong> Apabila berdasarkan suatu putusan badan peradilan berwenang yang telah berkekuatan hukum tetap (inkracht van gewijsde) KostKu dinyatakan terbukti bersalah melakukan kelalaian yang menimbulkan kerugian langsung pada Pengguna, maka <strong>total nilai pertanggungjawaban ganti rugi finansial KostKu secara kumulatif dibatasi paling banyak sebesar:</strong>
            </p>
            <div style={{
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#93c5fd',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              (i) Sebesar komisi atau biaya layanan platform yang benar-benar diterima oleh KostKu dari transaksi yang bersangkutan, ATAU<br />
              (ii) Maksimal sebesar Rp 100.000,- (Seratus Ribu Rupiah), mana yang nilainya lebih rendah.
            </div>
            <p style={{ margin: 0 }}>
              3.2. <strong>Pengecualian Kerugian Tidak Langsung:</strong> Dalam kondisi apa pun, KostKu TIDAK BERTANGGUNG JAWAB atas kerugian tidak langsung, kerugian konsekuensial, biaya pemindahan darurat, kehilangan pendapatan usaha, kehilangan kesempatan sewa (*loss of opportunity*), maupun kerugian immateriil.
            </p>
            <p style={{ margin: 0 }}>
              3.3. <strong>Larangan Gugatan Melebihi Batas & Hak Gugatan Rekonvensi (Gugat Balik):</strong> Pengguna dengan tegas dilarang dan melepaskan haknya untuk mengajukan gugatan atau tuntutan hukum yang melebihi batas nilai pertanggungjawaban yang telah disepakati dalam Pasal 3.1 ini. Apabila Pengguna tetap memaksakan gugatan yang melanggar batas tanggung jawab ini, maka tindakan tersebut dikualifikasikan sebagai Wanprestasi (Ingkar Janji terhadap Perjanjian Elektronik). KostKu memiliki hak mutlak untuk <strong>mengajukan Gugatan Rekonvensi (Gugat Balik / Countersuit)</strong> guna menuntut ganti rugi penuh atas biaya perkara, biaya jasa advokat/kuasa hukum, kerugian operasional, serta pemulihan kerugian reputasi bisnis KostKu.
            </p>
          </div>
        </section>

        {/* Pasal 4: KLAUSUL GANTI RUGI DARI PENGGUNA (INDEMNIFICATION) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            Pasal 4: Klausul Ganti Rugi dari Pengguna kepada Platform (Indemnification)
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            4.1. Setiap Pengguna (baik Pemilik Kost maupun Penghuni) <strong>setuju dan mengikatkan diri untuk membela, mengganti rugi (*indemnify*), dan membebaskan platform KostKu, pendiri (Oscar H. W. / Mbak Rena), mitra pengembang, dan staf</strong> dari dan terhadap setiap klaim, gugatan, tuntutan hukum, denda, ganti rugi, kewajiban, serta biaya kuasa hukum (advokat) yang timbul akibat:
          </p>
          <ul style={{ color: '#cbd5e1', fontSize: '0.92rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Pelanggaran Syarat & Ketentuan ini atau Kebijakan Privasi oleh Pengguna.</li>
            <li>Sengketa atau perselisihan yang terjadi antara Pemilik Kost dan Penghuni/Penyewa.</li>
            <li>Tindakan melanggar hukum, kelalaian, atau perbuatan melawan hukum (onrechtmatige daad) yang dilakukan oleh Pengguna di lokasi kost.</li>
            <li>Pelanggaran hak pihak ketiga, termasuk hak kekayaan intelektual (foto/logo) atau pencemaran nama baik yang diunggah oleh Pengguna.</li>
          </ul>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginTop: '10px' }}>
            4.2. <strong>Penggantian Biaya Jasa Hukum & Perkara (Legal Fee Recovery):</strong> Apabila timbul sengketa hukum di mana Pengguna menggugat KostKu dan gugatan Pengguna tersebut ditolak, dinyatakan tidak dapat diterima (NO), atau dimenangkan oleh pihak KostKu, maka Pengguna wajib membayar ganti rugi penuh atas seluruh biaya jasa kuasa hukum (advokat), biaya transportasi, saksi ahli, dan biaya kepaniteraan pengadilan yang telah dikeluarkan oleh KostKu dalam kurun waktu maksimal 14 (empat belas) hari kalender setelah putusan berkekuatan hukum tetap.
          </p>
        </section>

        {/* Pasal 5: TRANSAKSI DIGITAL & PAYMENT GATEWAY (TRIPAY & UTILITAS) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            Pasal 5: Transaksi Pembayaran Non-Tunai & Pihak Ketiga (TriPay, PLN, Bank)
          </h2>
          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>
              5.1. <strong>Payment Gateway Resmi Berlisensi:</strong> Pembayaran non-tunai melalui QRIS Dinamis dan Virtual Account diproses oleh mitra gerbang pembayaran berlisensi Bank Indonesia, <strong>TriPay (PT Tiga Rambu Unggul)</strong>.
            </p>
            <p style={{ margin: 0 }}>
              5.2. <strong>Gangguan Jaringan Pihak Ketiga:</strong> KostKu tidak bertanggung jawab atas keterlambatan konfirmasi pembayaran atau kegagalan transaksi yang diakibatkan oleh: pemadaman sistem kliring Bank Indonesia, gangguan server bank tujuan (BCA, Mandiri, BRI, BNI), gangguan jaringan internet penyedia e-wallet, atau maintenance server TriPay.
            </p>
            <p style={{ margin: 0 }}>
              5.3. <strong>Pembelian Token Listrik PLN & Air:</strong> Penerbitan 20-digit nomor token listrik PLN bergantung sepenuhnya pada ketersediaan sistem H2H server PLN Pusat. KostKu dibebaskan dari tanggung jawab apabila terjadi kesalahan input nomor meteran/ID Pelanggan yang dilakukan oleh pengguna sendiri.
            </p>
            <p style={{ margin: 0 }}>
              5.4. <strong>Kuitansi Digital Resmi:</strong> Sistem KostKu menerbitkan kuitansi digital otomatis saat status transaksi dinyatakan `PAID` oleh gateway. Kuitansi ini berlaku sebagai bukti pembayaran yang sah antara penyewa dan pemilik properti.
            </p>
          </div>
        </section>

        {/* Pasal 6: KETENTUAN KHUSUS MITRA PEMILIK PROPERTI (OWNER / JURAGAN KOST) */}
        <section style={{
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '18px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <Building2 size={22} color="#60a5fa" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Pasal 6: Ketentuan Khusus Mitra Pemilik Properti (Owner / Juragan Kost)
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
            Setiap pemilik, pengelola, atau pihak yang mendaftarkan dan memasarkan kamar kost di platform KostKu (selanjutnya disebut <strong>"Mitra Pemilik Properti"</strong>) tunduk dan terikat secara hukum pada klausul-klausul berikut:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', borderLeft: '3px solid #60a5fa' }}>
              <strong style={{ color: '#93c5fd' }}>6.1. Jaminan Legalitas & Hak Pengelolaan Properti (Title Warranty):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Mitra Pemilik Properti menyatakan dan menjamin secara hukum bahwa properti yang didaftarkan dimiliki secara sah berdasarkan bukti kepemilikan otentik (SHM/SHGB) atau surat kuasa resmi bermaterai dari pemilik sah. Properti dijamin bebas dari sengketa waris, sita jaminan perbankan, tuntutan ahli waris, maupun pelanggaran izin peruntukan bangunan daerah. Segala sengketa kepemilikan fisik sepenuhnya merupakan beban hukum Mitra Pemilik Properti, dan membebaskan platform KostKu 100% dari gugatan pihak mana pun.
              </p>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', borderLeft: '3px solid #38bdf8' }}>
              <strong style={{ color: '#7dd3fc' }}>6.2. Kebijakan Foto Asli & Transparansi Kamar ("Zero-Zonk Policy"):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Mitra Pemilik Properti wajib mengunggah foto, denah, dimensi ukuran, serta inventaris fasilitas yang benar-benar riil dan terkini. Dilarang keras menggunakan foto properti lain, foto hasil rekayasa kecerdasan buatan (AI) yang manipulatif, atau menjanjikan fasilitas fiktif (misal: klaim AC dingin / WiFi kencang padahal rusak total). Apabila penyewa mengajukan komplain resmi disertai bukti video saat check-in atas ketidaksesuaian fasilitas fatal (<em>Kamar Zonk</em>), KostKu berhak menahan dana sewa, membatalkan transaksi, melakukan pengembalian dana (*refund*) kepada penyewa, serta menonaktifkan status listing Mitra.
              </p>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', borderLeft: '3px solid #34d399' }}>
              <strong style={{ color: '#6ee7b7' }}>6.3. Penyaluran Dana Sewa (Payout / Settlement TriPay) & Akun Bank Mitra:</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                (a) Pembayaran sewa dari penyewa diproses secara terenkripsi melalui Payment Gateway TriPay dan dicatatkan pada saldo dompet digital sistem KostKu setelah dikurangi biaya transaksi (*MDR*) serta komisi layanan platform resmi.<br />
                (b) Penarikan dana (*payout*) hanya dapat dikirimkan ke rekening bank resmi di Indonesia dengan nama pemilik rekening yang sesuai dengan nama akun terdaftar Mitra.<br />
                (c) Kesalahan pengetikan nomor rekening atau nama bank tujuan penarikan oleh Mitra sepenuhnya merupakan kelalaian pribadi Mitra dan di luar tanggung jawab KostKu.<br />
                (d) <strong>Hak Penahanan Dana Sementara (Escrow Hold):</strong> KostKu berhak menahan pencairan dana sewa sementara apabila terdapat: laporan dugaan penipuan, sengketa aktif antara pemilik dan penyewa yang sedang dimediasi, indikasi transaksi mencurigakan, atau instruksi resmi dari aparat penegak hukum.
              </p>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', borderLeft: '3px solid #fbbf24' }}>
              <strong style={{ color: '#fde68a' }}>6.4. Integritas Harga Sewa & Larangan Biaya Siluman (No Hidden Surcharges):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Mitra Pemilik Properti wajib mencantumkan seluruh komponen harga secara transparan di dalam platform KostKu. Mitra dilarang keras menagih biaya tambahan liar secara sepihak di luar rincian resmi KostKu kepada penghuni (seperti pungutan uang kas tiba-tiba, biaya parkir tidak terdaftar, atau kenaikan tarif mendadak di luar perjanjian masa sewa berjalan).
              </p>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', borderLeft: '3px solid #f472b6' }}>
              <strong style={{ color: '#fbcfe8' }}>6.5. Pengelolaan Uang Jaminan / Deposit Kerusakan (Security Deposit):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Penerapan uang deposit jaminan merupakan kesepakatan perdata langsung antara Pemilik Kost dan Penyewa. KostKu tidak memegang fisik uang jaminan tersebut dan tidak bertanggung jawab atas sengketa pemotongan atau penolakan pengembalian deposit oleh Mitra Pemilik Properti. Mitra wajib mengembalikan sisa deposit secara jujur dan transparan kepada penyewa pada hari masa sewa berakhir jika tidak terdapat bukti kerusakan kamar fisik yang disebabkan oleh penyewa.
              </p>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', borderLeft: '3px solid #ef4444' }}>
              <strong style={{ color: '#fca5a5' }}>6.6. Standar Kelaikan Bangunan, Instalasi Listrik, & K3:</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Mitra Pemilik Properti memikul tanggung jawab hukum mutlak atas kelaikan fisik bangunan, keamanan instalasi kabel listrik standar PLN (mencegah bahaya korsleting dan kebakaran), ketersediaan saluran air bersih higienis, sistem sanitasi, serta ketertiban lingkungan RT/RW setempat. Segala musibah kebakaran bangunan, kecelakaan fisik, atau kerugian material yang menimpa penghuni akibat kelalaian fisik gedung adalah tanggung jawab pribadi Mitra Pemilik Properti.
              </p>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', borderLeft: '3px solid #a855f7' }}>
              <strong style={{ color: '#d8b4fe' }}>6.7. Larangan Disintermediasi (Bypass Transaksi Luar Sistem):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Mitra Pemilik Properti dilarang dengan sengaja memanfaatkan data calon penghuni yang diperoleh melalui sistem pencarian KostKu untuk membujuk penyewa membatalkan pemesanan resmi dan bertransaksi transfer manual pribadi demi menghindari sistem verifikasi platform. Pelanggaran klausul ini berakibat pada pemblokiran akun secara permanen (*blacklist*) dan penghapusan seluruh listing kamar dari KostKu.
              </p>
            </div>
          </div>
        </section>

        {/* Pasal 7: KETENTUAN KHUSUS MITRA LAYANAN & UMKM SEKITAR */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <Store size={20} color="#60a5fa" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>
              Pasal 7: Ketentuan Khusus Mitra Layanan & UMKM Sekitar Kost (Laundry, Katering, Galon)
            </h2>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>
              7.1. <strong>Kualitas & Higienitas Produk:</strong> Mitra UMKM (penyedia laundry kiloan, katering makan, galon air, gas LPG) bertanggung jawab penuh atas higienitas, kebersihan, kehalalan, mutu, dan kelaikan konsumsi produk yang dipasarkan kepada penghuni kost melalui KostKu.
            </p>
            <p style={{ margin: 0 }}>
              7.2. <strong>Komitmen Waktu Antar (SLA):</strong> Mitra UMKM wajib mematuhi perkiraan estimasi waktu penyelesaian dan pengantaran pesanan (*Service Level Agreement*) yang telah disepakati pada tiket order.
            </p>
            <p style={{ margin: 0 }}>
              7.3. <strong>Penyelesaian Sengketa Pesanan:</strong> Perselisihan mengenai pakaian luntur/rusak pada laundry atau komplain makanan diselesaikan secara musyawarah langsung antara Mitra UMKM dan Penghuni. KostKu berperan sebagai penyedia sistem pencatatan pemesanan dan settlement saldo semata.
            </p>
          </div>
        </section>

        {/* Pasal 8: HAK PREOGATIF PLATFORM (SUSPEND, BANNED, & REMOVAL) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            Pasal 8: Hak Moderasi, Penurunan Listing, & Pembekuan Akun
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            KostKu berhak secara sepihak, tanpa pemberitahuan sebelumnya dan tanpa kewajiban memberikan ganti rugi, untuk:
          </p>
          <ul style={{ color: '#cbd5e1', fontSize: '0.92rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Menolak, mengedit, menurunkan listing properti, atau membekukan akun yang terindikasi melakukan penipuan harga, manipulasi foto kamar, atau tidak memenuhi standar kebersihan/keamanan.</li>
            <li>Memblokir akun pengguna yang terindikasi menggunakan akun untuk aktivitas perjudian online, pencucian uang, prostitusi, penipuan uang muka sewa, atau peretasan sistem.</li>
            <li>Bekerja sama dengan aparat penegak hukum Republik Indonesia (Kepolisian RI) dalam menyerahkan data digital log apabila terjadi laporan dugaan tindak pidana.</li>
          </ul>
        </section>

        {/* Pasal 9: KEWAJIBAN PERPAJAKAN & PELEPASAN PEMUNGUTAN PAJAK */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <Scale size={20} color="#60a5fa" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>
              Pasal 9: Kebijakan Perpajakan, Pelepasan Pemungutan Pajak, & Pelaporan Mandiri
            </h2>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '12px', borderLeft: '3px solid #3b82f6' }}>
              <strong style={{ color: '#93c5fd' }}>9.1. KostKu Tidak Memotong / Menarik Pajak (Bukan Pemungut Pajak):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Platform KostKu beroperasi murni sebagai penyedia teknologi informasi dan sarana transaksi elektronik (PMSE/SaaS). Sesuai ketentuan hukum perpajakan dan UU HKPD No. 1 Tahun 2022 (tentang Hubungan Keuangan antara Pemerintah Pusat dan Pemerintahan Daerah), <strong>KostKu TIDAK menarik, memotong, menahan, atau memungut pajak dalam bentuk apa pun</strong>—termasuk Pajak Pertambahan Nilai (PPN), Pajak Barang dan Jasa Tertentu (PBJT Restoran/Makanan & Minuman), Pajak Penghasilan (PPh), maupun retribusi daerah lainnya—baik dari transaksi sewa kamar maupun transaksi pembelian produk/layanan toko mitra. Seluruh dana transaksi disalurkan utuh kepada pihak penerima hak setelah dikurangi biaya platform operasional yang disepakati.
              </p>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', borderLeft: '3px solid #10b981' }}>
              <strong style={{ color: '#6ee7b7' }}>9.2. Kewajiban Penyetoran & Pelaporan Mandiri Pemilik Kost (Owner):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Seluruh pemenuhan kewajiban perpajakan atas penerimaan sewa kamar kost merupakan <strong>tanggung jawab pribadi dan mandiri masing-masing Pemilik Kost</strong>. Pemilik Kost wajib menghitung, melaporkan, dan menyetorkan kewajiban pajak penghasilannya secara mandiri kepada Direktorat Jenderal Pajak (KPP / Kantor Pajak Pratama) sesuai ketentuan hukum yang berlaku di Indonesia (seperti PPh Final UMKM 0,5% berdasarkan PP No. 55 Tahun 2022, PPh Final Pasal 4 ayat 2, atau ketentuan tarif PPh Badan/Orang Pribadi lainnya).
              </p>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', borderLeft: '3px solid #f59e0b' }}>
              <strong style={{ color: '#fde68a' }}>9.3. Kewajiban Penyetoran & Pelaporan Mandiri Mitra Toko & Layanan (UMKM & Non-UMKM):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Seluruh Mitra Toko, Warung Makan/Katering, Jasa Laundry, Depot Air Minum Galon, dan penyedia layanan komersial lainnya (baik berstatus skala mikro/UMKM maupun Non-UMKM / badan hukum ber-PKP) <strong>bertanggung jawab penuh secara mandiri</strong> untuk menghitung, memungut (apabila usahanya berstatus Pengusaha Kena Pajak atau wajib pungut PBJT Pemda), menyetorkan, serta melaporkan kewajiban perpajakannya kepada Kantor Pajak atau Badan Pendapatan Daerah (Bapenda) setempat.
              </p>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', borderLeft: '3px solid #ef4444' }}>
              <strong style={{ color: '#fca5a5' }}>9.4. Pembebasan Tanggung Jawab Hukum Platform (Indemnifikasi):</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
                Pemilik Kost dan Mitra Usaha dengan ini membebaskan serta melepaskan KostKu, pengembang sistem, pemilik platform, dan afiliasinya dari segala bentuk tuntutan hukum, klaim penagihan pajak, sanksi administrasi, denda keterlambatan, atau pemeriksaan perpajakan yang diakibatkan oleh kelalaian, kegagalan, atau ketidakpatuhan Pemilik Kost atau Mitra Usaha dalam melaporkan atau membayarkan kewajiban perpajakan pribadinya kepada instansi pemerintah berwenang.
              </p>
            </div>
          </div>
        </section>

        {/* Pasal 10: FORCE MAJEURE (KEADAAN KAHAR) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>
            Pasal 10: Keadaan Kahar (Force Majeure)
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
            KostKu tidak dapat dianggap lalai atau melanggar perjanjian apabila terjadi keterlambatan atau kegagalan penyediaan platform yang disebabkan oleh peristiwa di luar kendali wajar (Keadaan Kahar), termasuk namun tidak terbatas pada: bencana alam (banjir, gempa bumi), kebakaran besar, kerusuhan publik, pemadaman listrik massal, embargo teknologi, gangguan kabel bawah laut telekomunikasi global, serangan siber terdistribusi (DDoS besar-besaran), atau regulasi darurat pemerintah.
          </p>
        </section>

        {/* Pasal 11: YURISDIKSI HUKUM & PENYELESAIAN SENGKETA */}
        <section style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <Gavel size={20} color="#34d399" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Pasal 11: Hukum yang Berlaku & Domisili Hukum Eksklusif
            </h2>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>
              11.1. Syarat dan Ketentuan ini diatur, ditafsirkan, dan tunduk secara mutlak pada <strong>hukum positif Negara Kesatuan Republik Indonesia</strong>.
            </p>
            <p style={{ margin: 0 }}>
              11.2. Apabila terjadi sengketa atau perselisihan hukum yang timbul dari atau sehubungan dengan penafsiran atau pelaksanaan Syarat & Ketentuan ini, para pihak sepakat untuk menyelesaikannya secara musyawarah untuk mufakat dalam waktu 30 (tiga puluh) hari kalender.
            </p>
            <p style={{ margin: 0 }}>
              11.3. Apabila musyawarah tidak mencapai mufakat, para pihak sepakat untuk memilih domisili hukum yang tetap dan tidak berubah di <strong>Kepaniteraan Pengadilan Negeri Semarang, Jawa Tengah</strong>, dengan mengesampingkan forum pengadilan di wilayah hukum lainnya.
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
