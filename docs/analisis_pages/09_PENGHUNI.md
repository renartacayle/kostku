# Analisis Halaman: Manajemen Penghuni (Occupant CRM & Contracts)

> **File Sumber:** `src/pages/Penghuni.jsx`  
> **Route URL:** `/penghuni`  
> **Target Pengguna:** Pemilik Kost dan Manajer Operasional Properti  
> **Core Theme:** *High-Precision Resident CRM & Legal e-KTP Database*  

---

## 1. Tujuan Halaman & User Journey

Halaman Manajemen Penghuni (`Penghuni.jsx`) adalah basis data terpusat seluruh penyewa yang tinggal di gedung kost. Halaman ini menyelesaikan masalah klasik pemilik kost: berkas fotokopi KTP yang tercecer, nomor kontak darurat orang tua yang hilang saat terjadi insiden darurat, dan lupa tanggal jatuh tempo perpanjangan kamar.

```
  [ Pemilik Masuk ke /penghuni ]
                 │
                 ▼
  [ Header: Filter Status (Semua | Aktif | Segera Habis | Menunggak | Alumni) ]
                 │
                 ▼
  [ Tabel CRM Penghuni (Foto, Nama Lengkap, No. Kamar, No. WhatsApp, Kontak Darurat, Tanggal Masuk) ]
                 │
                 ▼
  [ Klik Baris Penghuni: Modal Rincian Profil & Berkas Digital e-KTP ]
                 │
                 ▼
  [ Aksi Cepat: Cetak Surat Perjanjian Sewa / Hubungi Orang Tua / Checkout Penghuni ]
```

---

## 2. Penerapan Core Color Palette

| Elemen CRM | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Latar Tabel & Panel** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Tampilan tabular profesional ala enterprise. |
| **Badge "Aktif & Lunas"** | Emerald Green (`#10B981`) | Emerald Green (`#16A34A`) | Kontrak sewa aktif dan pembayaran lancar. |
| **Badge "Segera Habis"** | Aksen Teak (`#F59E0B`) | Aksen Teak (`#D97706`) | Sisa masa sewa `< 7 hari`. |
| **Badge "Menunggak"** | Crimson Red (`#EF4444`) | Crimson Red (`#DC2626`) | Menunggak pembayaran sewa bulanan. |
| **Tombol Chat WhatsApp** | WhatsApp Emerald (`#22C55E`) | WhatsApp Emerald (`#16A34A`) | Menghubungi penyewa langsung dari web. |
| **Nomor Kamar & NIK** | Font Tabular Monospace | Font Tabular Monospace | Format data teknis menggunakan `JetBrains Mono`. |

---

## 3. Komponen Kunci & Fitur CRM

1. **Pencarian Cepat Instan:**
   - Pencarian real-time berdasarkan nama penyewa, nomor kamar, asal universitas/kantor, atau nomor telepon tanpa delay.
2. **Modal Berkas Legal e-KTP:**
   - Menyimpan arsip foto e-KTP penyewa dengan enkripsi akses, mencegah kebocoran data sensitif penyewa.
3. **Ekspor Data RT/RW & Wajib Lapor:**
   - Menghasilkan laporan CSV/PDF berstandar peraturan RT/RW setempat mengenai data penghuni pendatang secara otomatis dalam satu klik.

---

## 4. Evaluasi UX & Aksesibilitas

* **Responsif Tabel:** Di layar smartphone sempit, tabel bertransformasi secara elegan menjadi tumpukan kartu kontak (*contact cards*) agar pemilik tetap mudah mencari nomor darurat orang tua penyewa saat berada di jalan.
* **Aksesibilitas Label:** Status kontrak tidak hanya mengandalkan warna, tetapi juga dilengkapi ikon visual dan teks deskriptif agar tetap terbaca oleh pengguna buta warna (*color-blind safe*).

---

## 5. Rekomendasi Peningkatan
* Tambahkan integrasi tanda tangan digital (e-Signature) pada surat perjanjian sewa kost saat onboarding penyewa baru.
