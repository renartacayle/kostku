import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_SEO = {
  '/': {
    title: 'KostKu - Platform Manajemen Hunian & Kos Pintar Modern',
    description: 'Aplikasi all-in-one kelola kamar kos modern: denah arsitektur 2D interaktif, penagihan sewa otomatis QRIS/VA, dan integrasi ekosistem UMKM sekitar kampus.',
    canonical: 'https://kostku.riuph.me/'
  },
  '/cari-kost': {
    title: 'Cari & Survei Kamar Kost Terverifikasi - KostKu',
    description: 'Pencarian kos putra, putri, dan campur dekat kampus (UDINUS, Semarang & sekitarnya) dengan titik GPS akurat, denah 2D transparan, dan simulasi listrik PLN.',
    canonical: 'https://kostku.riuph.me/cari-kost'
  },
  '/search': {
    title: 'Jelajahi Kost & Mitra UMKM Sekitar Kampus - KostKu',
    description: 'Temukan pilihan kost terbaik dan layanan pendukung seperti laundry, warung makan, air galon, dan jasa servis terpercaya di KostKu.',
    canonical: 'https://kostku.riuph.me/cari-kost' // Canonical points to /cari-kost to prevent duplicate indexing
  },
  '/demo': {
    title: 'Sandbox Demo Interaktif Pemilik Kost - KostKu',
    description: 'Uji coba fitur lengkap KostKu tanpa registrasi: denah kamar interaktif, simulasi penagihan sewa otomatis TriPay, dan monitoring utilitas IoT.',
    canonical: 'https://kostku.riuph.me/demo',
    robots: 'noindex, nofollow'
  },
  '/mitra': {
    title: 'Portal Mitra UMKM & Warung Sekitar Kost - KostKu',
    description: 'Daftarkan bisnis warung makan, air minum galon, jasa laundry, atau servis di platform KostKu untuk menjangkau ribuan penghuni kos.',
    canonical: 'https://kostku.riuph.me/mitra'
  },
  '/login': {
    title: 'Masuk Akun Pengelola & Penghuni - KostKu',
    description: 'Login ke dashboard manajemen properti kos atau akun mitra UMKM KostKu.',
    canonical: 'https://kostku.riuph.me/login'
  },
  '/register': {
    title: 'Daftar Akun Pengelola Kost Baru - KostKu',
    description: 'Daftarkan rumah kost Anda dan mulai kelola kamar, sewa, serta penghuni secara otomatis dan profesional bersama KostKu.',
    canonical: 'https://kostku.riuph.me/register'
  },
  '/checkout': {
    title: 'Pembayaran Sewa & Tagihan Digital - KostKu',
    description: 'Sistem pembayaran aman dan otomatis berlisensi Bank Indonesia via QRIS Dinamis dan Virtual Account di KostKu.',
    canonical: 'https://kostku.riuph.me/',
    robots: 'noindex, nofollow'
  },
  '/bayar': {
    title: 'Pembayaran Sewa & Tagihan Digital - KostKu',
    description: 'Sistem pembayaran aman dan otomatis berlisensi Bank Indonesia via QRIS Dinamis dan Virtual Account di KostKu.',
    canonical: 'https://kostku.riuph.me/',
    robots: 'noindex, nofollow'
  },
  '/pembayaran': {
    title: 'Pembayaran Sewa & Tagihan Digital - KostKu',
    description: 'Sistem pembayaran aman dan otomatis berlisensi Bank Indonesia via QRIS Dinamis dan Virtual Account di KostKu.',
    canonical: 'https://kostku.riuph.me/',
    robots: 'noindex, nofollow'
  },
  '/tentang-kami': {
    title: 'Tentang KostKu - Smart Co-Living & Kos Platform (UDINUS)',
    description: 'Mengenal KostKu: Inovasi platform manajemen hunian pintar mahasiswa oleh Oscar Herdian Wijaya (FIK S1 Teknik Informatika UDINUS Semarang).',
    canonical: 'https://kostku.riuph.me/tentang-kami'
  },
  '/syarat-ketentuan': {
    title: 'Syarat & Ketentuan Layanan - KostKu',
    description: 'Ketentuan penggunaan platform manajemen kost, sistem reservasi kamar, dan kepatuhan transaksi digital KostKu.',
    canonical: 'https://kostku.riuph.me/syarat-ketentuan'
  },
  '/kebijakan-privasi': {
    title: 'Kebijakan Privasi Pengguna - KostKu',
    description: 'Komitmen perlindungan data pribadi penghuni, pemilik kost, dan keamanan transaksi gateway berstandar enkripsi SSL.',
    canonical: 'https://kostku.riuph.me/kebijakan-privasi'
  },
  '/dashboard': {
    title: 'Dashboard Manajemen Properti - KostKu',
    description: 'Ringkasan operasional hunian kos: okupansi kamar, arus kas masuk, tagihan tertunda, dan verifikasi penghuni.',
    canonical: 'https://kostku.riuph.me/dashboard'
  },
  '/penghuni': {
    title: 'Data Penghuni & Manajemen Kamar - KostKu',
    description: 'Kelola database penyewa kost, durasi sewa, tanggal jatuh tempo, dan kontak profil penyewa secara aman.',
    canonical: 'https://kostku.riuph.me/penghuni'
  },
  '/keuangan': {
    title: 'Laporan Keuangan & Arus Kas Sewa - KostKu',
    description: 'Pantau riwayat pembayaran sewa bulanan, pengeluaran operasional, dan mutasi saldo otomatis di KostKu.',
    canonical: 'https://kostku.riuph.me/keuangan'
  },
  '/komplain': {
    title: 'Tiket Komplain & Pusat Bantuan Kamar - KostKu',
    description: 'Monitoring laporan kendala fasilitas, perbaikan kamar, dan keluhan penyewa kos secara realtime.',
    canonical: 'https://kostku.riuph.me/komplain'
  },
  '/karyawan': {
    title: 'Manajemen Staf & Pengelola Kos - KostKu',
    description: 'Pengaturan hak akses staf operasional, penjaga kost, dan teknisi pemeliharaan kamar.',
    canonical: 'https://kostku.riuph.me/karyawan'
  },
  '/pengaturan': {
    title: 'Pengaturan Properti & Integrasi TriPay - KostKu',
    description: 'Konfigurasi profil kost, rekening pencairan saldo sewa, webhook payment gateway, dan preferensi notifikasi.',
    canonical: 'https://kostku.riuph.me/pengaturan'
  }
};

export default function RouteMetadataManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    let seo = ROUTE_SEO[pathname];

    // Fallback for dynamic routes like /kost/:id
    if (!seo && pathname.startsWith('/kost/')) {
      seo = {
        title: 'Detail Kamar & Survei Kost - KostKu',
        description: 'Lihat denah 2D, fasilitas kamar, ukuran kasur, simulasi token listrik, dan reservasi langsung via KostKu.',
        canonical: `https://kostku.riuph.me${pathname}`
      };
    }

    if (!seo) {
      seo = {
        title: 'KostKu - Manajemen Hunian & Kos Pintar Modern',
        description: 'Platform All-in-One Manajemen Hunian & Kos Pintar Modern berbasis denah arsitektur 2D interaktif dan pembayaran otomatis QRIS.',
        canonical: `https://kostku.riuph.me${pathname}`
      };
    }

    // 1. Update Title
    document.title = seo.title;

    // 2. Update Meta Description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seo.description);

    // 3. Update Open Graph Title & Description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', seo.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', seo.description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', seo.canonical);

    // 4. Update Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', seo.canonical);

    // 5. Update Robots Meta Tag (Enforce noindex on demo sandbox, index follow on public pages)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', seo.robots || 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  }, [location.pathname]);

  return null;
}
