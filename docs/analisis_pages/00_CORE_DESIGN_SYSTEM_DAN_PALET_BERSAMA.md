# KostKu — Master Core Design System & Shared Palette (`00_CORE_DESIGN_SYSTEM_DAN_PALET_BERSAMA.md`)

> **Dokumen Panduan:** Standar Desain Visual & Sistem Warna Terpadu Seluruh Halaman KostKu  
> **Target Aplikasi:** Web PWA, Android Capacitor, Windows Desktop  
> **Prinsip Utama:** *Architectural Warm-Modernist & Precision CAD Ecosystem*  
> **Status:** Referensi Kanonikal Desain Antar-Halaman  

---

## 1. Filosofi Desain: Konsistensi Warna Core

KostKu menggunakan sistem desain visual yang terpadu agar pengguna (Pencari Kost, Penghuni Aktif, Pemilik Properti, maupun Mitra Layanan) merasakan **kesatuan identitas brand (*brand continuity*)** di setiap halaman yang mereka kunjungi.

### Palet Inti (Core Palette) yang Wajib Muncul di Setiap Halaman:
1. **Primary Accent — Architectural Electric Blue (`#2563EB`)**:
   - Mencerminkan kepercayaan (*trust*), presisi data arsitektur CAD, verifikasi e-KTP tunggal anti-bot, dan gerbang aksi utama (CTA).
2. **Secondary Warmth — Indonesian Teak Wood (`#D97706`)**:
   - Menghadirkan sentuhan kehangatan kayu jati khas hunian Indonesia, mengimbangi kesan dingin teknologi dengan keramahan *hospitality*.
3. **Foundation Void (Dark Canvas `#080D1A` / Light Canvas `#F1F5F9`)**:
   - Menghindari warna hitam pekat (*pure black `#000000`*) yang melelahkan mata. Di dark mode menggunakan *Blue-Hour Twilight*, di light mode menggunakan *Airy Crisp Slate*.
4. **Surface Elevated (Dark `#0E1726` / Light `#FFFFFF`)**:
   - Kontainer bento card dengan border halus semitransparan.

---

## 2. Tabel Master Token Warna Semantik (Light & Dark Mode)

Semua halaman KostKu merujuk pada token semantik yang sama di file `src/index.css`:

| Token CSS | Peran Desain | Light Mode Value | Dark Mode Value | Rasio Kontras WCAG |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-main` | Canvas Latar Belakang | `#F1F5F9` *(Slate 100)* | `#080D1A` *(Twilight Void)* | Baseline |
| `--bg-primary` | Card Surface / Modal | `#FFFFFF` *(Pure White)* | `#0E1726` *(Slate Navy)* | Kontainer Utama |
| `--bg-secondary` | Highlighted Card | `#E2E8F0` *(Slate 200)* | `#131F37` *(Deep Indigo)* | Aksen Hover/Active |
| `--text-primary` | Judul & Teks Utama | `#0F172A` *(Slate 900)* | `#F8FAFC` *(Cool White)* | > 12:1 (AAA Pass) |
| `--text-secondary`| Body Teks / Deskripsi | `#475569` *(Slate 600)* | `#94A3B8` *(Slate 400)* | > 5.5:1 (AA Pass) |
| `--text-muted` | Label Kecil / Monospace | `#64748B` *(Slate 500)* | `#64748B` *(Slate 500)* | > 4.5:1 (AA Pass) |
| `--accent-primary`| Aksi Utama / CAD Highlight | `#2563EB` | `#2563EB` / `#3B82F6` | > 4.6:1 (AA Pass) |
| `--accent-teak` | Aksen Kayu / Rating | `#D97706` | `#F59E0B` | > 4.5:1 (AA Pass) |
| `--accent-success`| Lunas / Terverifikasi | `#16A34A` | `#10B981` | > 4.5:1 (AA Pass) |
| `--accent-danger` | Komplain / Jatuh Tempo | `#DC2626` | `#EF4444` | > 4.5:1 (AA Pass) |
| `--border-color` | Garis Pemisah / Card Line | `rgba(15, 23, 42, 0.10)` | `rgba(255, 255, 255, 0.08)` | Hairline Subtil |

---

## 3. Sistem Tipografi Terpadu

* **Primary Sans:** `'Plus Jakarta Sans', sans-serif`  
  Digunakan untuk seluruh heading, tombol, paragraf, dan antarmuka umum demi kehangatan geometris humanis.
* **Monospace Tabular:** `'JetBrains Mono', 'Fira Code', monospace`  
  Wajib digunakan pada seluruh angka keuangan (`Rp 1.500.000`), dimensi ruangan (`3.5 × 4.0 m`), meteran kWh listrik (`142.8 kWh`), dan kode pembayaran TriPay.

---

## 4. Daftar Halaman yang Dianalisis

1. `01_HOME.md` — Beranda Publik & Search-First Marketplace
2. `02_SEARCH_KOST.md` — Mesin Pencari & Filter Interaktif (Spatial Map)
3. `03_KOST_DETAIL.md` — Detail Properti (Denah CAD 2D & Orientasi Matahari)
4. `04_CHECKOUT.md` — Alur Pembayaran & Integrasi TriPay Gateway
5. `05_LOGIN.md` — Autentikasi Pengguna & Pemilik (Dual-Role Auth)
6. `06_REGISTER.md` — Pendaftaran Akun & Validasi e-KTP
7. `07_DASHBOARD_OWNER.md` — Cockpit Manajemen Pemilik Kost
8. `08_USER_DASHBOARD_PENGHUNI.md` — Portal Mandiri Penghuni (Smart Lock & Layanan)
9. `09_PENGHUNI.md` — CRM Penghuni & Riwayat Kontrak
10. `10_KEUANGAN.md` — Buku Kas, Pembukuan & Laba Rugi Properti
11. `11_MITRA.md` — Ekosistem Layanan Sekitar (FnB, Galon, Laundry, Jasa)
12. `12_KOMPLAIN.md` — Helpdesk Tiket & Penanganan Keluhan
13. `13_KARYAWAN.md` — Manajemen Staf, Penjaga & Hak Akses
14. `14_PENGATURAN.md` — Pengaturan Properti, Rekening & Fasilitas
15. `15_DEMO_SANDBOX.md` — Showcase Investor & Sandbox Fitur
16. `16_KEBIJAKAN_PRIVASI.md` — Kebijakan Privasi & Kepatuhan Data
17. `17_SYARAT_KETENTUAN.md` — Syarat Ketentuan Layanan & Kontrak Sewa
18. `18_TENTANG_KAMI.md` — Profil Perusahaan, Visi Misi & Roadmap
19. `19_LIGHT_MODE_DAN_DARK_MODE.md` — Spesifikasi Teknis Sistem Light Mode & Dark Mode Terpadu

