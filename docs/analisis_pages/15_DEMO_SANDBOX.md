# Analisis Halaman: Sandbox Showcase & Demo (Interactive Demo Sandbox)

> **File Sumber:** `src/pages/Demo.jsx`  
> **Route URL:** `/demo`, `/sandbox`, `/demo-showcase`  
> **Target Pengguna:** Penguji Sidang RPL, Dosen Pembimbing, Calon Investor, dan Pengguna Baru yang Ingin Mencoba  
> **Core Theme:** *Zero-Registration Interactive Simulation Environment*  

---

## 1. Tujuan Halaman & User Journey

Halaman Demo (`Demo.jsx`) dirancang untuk memamerkan seluruh kecanggihan fitur KostKu tanpa mengharuskan penguji atau calon pengguna mendaftar atau memasukkan kartu identitas asli. Ini adalah arena sandbox yang aman dengan data simulasi realistis.

```
  [ Penguji / Calon Klien Membuka /demo ]
                     │
                     ▼
  [ Banner Mode Sandbox Interaktif (Badge "Simulasi Aktif") ]
                     │
                     ▼
  [ Pilihan Persona Simulasi:
    ├── Masuk sebagai Pemilik Kost (Kost Graha Kirana - 18 Kamar)
    ├── Masuk sebagai Anak Kost (Kamar 204 - Habis 3 Hari Lagi)
    └── Masuk sebagai Mitra Depot Galon & Laundry Kiloan ]
                     │
                     ▼
  [ Eksplorasi Fitur Bebas: Uji Denah 2D, Uji Smart Lock PIN, Uji Checkout TriPay Simulasi ]
                     │
                     ▼
  [ Tombol "Reset Data Sandbox" ke Kondisi Semula ]
```

---

## 2. Penerapan Core Color Palette

| Komponen Sandbox | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Kedalaman panggung interaktif. |
| **Banner Header Sandbox** | Gradient Biru Elektrik ke Ungu Lembut | Gradient Biru ke Ungu Lembut | Menandai lingkungan simulasi aman. |
| **Card Persona Pilihan** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Tiga kartu peran bento yang dapat diklik langsung. |
| **Badge "Data Demo Dummy"** | Aksen Teak Amber (`#F59E0B`) | Aksen Teak Amber (`#D97706`) | Pengingat bahwa transaksi tidak memotong uang asli. |
| **Tombol Masuk Simulasi** | Gradient Electric Blue (`#2563EB`) | Gradient Electric Blue (`#2563EB`) | Tombol aksi login instan bypass. |

---

## 3. Komponen Kunci & Skenario Uji

1. **Preset Persona Siap Uji:**
   - **Bapak Haji Danu (Pemilik):** Memiliki 18 kamar, 15 terisi, 3 kosong, omset Rp 24.500.000/bulan.
   - **Rizky Pratama (Mahasiswa Tingkat 3):** Penghuni Kamar 204, sewa jatuh tempo 3 hari lagi.
   - **Mbak Siti (Mitra Berkah Laundry):** Merchant rekanan siap terima order cuci kilat.
2. **Instant Sandbox Reset:**
   - Tombol satu-sentuhan untuk mengembalikan seluruh mutasi kas, komplain, dan data kamar ke kondisi awal demo dalam waktu 1 detik.

---

## 4. Evaluasi UX & Aksesibilitas

* **Isolasi Database:** Aksi yang dilakukan di dalam mode demo tidak mencemari basis data produksi PostgreSQL / Supabase yang sebenarnya.
* **Jelas & Anti-Bingung:** Pengguna selalu diingatkan dengan bilah kecil di atas layar bahwa mereka sedang berada di sesi demo.

---

## 5. Rekomendasi Peningkatan
* Sediakan tur interaktif dengan sorotan langkah (*guided tooltip tour*) yang memandu penguji langkah demi langkah mencoba fitur unggulan.
