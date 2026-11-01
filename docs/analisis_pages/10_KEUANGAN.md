# Analisis Halaman: Pembukuan & Arus Kas (Financial Ledger & P&L)

> **File Sumber:** `src/pages/Keuangan.jsx`  
> **Route URL:** `/keuangan`, `/laporan`  
> **Target Pengguna:** Pemilik Kost dan Bagian Akuntansi Properti  
> **Core Theme:** *Architectural Financial Cockpit & Cashflow Precision*  

---

## 1. Tujuan Halaman & User Journey

Halaman Keuangan (`Keuangan.jsx`) adalah modul akuntansi otomatis properti kost. Modul ini mencatat seluruh arus kas masuk (pembayaran sewa, deposit, parkir motor, listrik tambahan) dan arus kas keluar (tagihan PDAM, token listrik komunal PLN, gaji penjaga kost, biaya sampah RT/RW, dan perbaikan fasilitas).

```
  [ Pemilik Membuka /keuangan ]
                 │
                 ▼
  [ Ringkasan Keuangan Bulan Ini: Total Pemasukan vs Total Pengeluaran vs Laba Bersih (Net Profit) ]
                 │
                 ▼
  [ Filter Periode: Bulan Ini, Bulan Lalu, Tahun Berjalan, Custom Range ]
                 │
                 ▼
  [ Buku Kas Terperinci (Tabel Mutasi Masuk/Keluar + Bukti Transfer) ]
                 │
                 ▼
  [ Aksi: Catat Pengeluaran Baru / Unduh Laporan PDF & Excel untuk SPT Pajak ]
```

---

## 2. Penerapan Core Color Palette

| Indikator Keuangan | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Card Ringkasan Laba Bersih**| `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Kartu metrik utama laporan keuangan. |
| **Pemasukan Kas (Cash In)** | Emerald Green (`#10B981`) | Emerald Green (`#16A34A`) | Sinyal pendapatan positif (+). |
| **Pengeluaran Kas (Cash Out)**| Crimson Red (`#EF4444`) | Crimson Red (`#DC2626`) | Sinyal beban biaya operasional (-). |
| **Aset Modal / Saldo Kas** | Electric Blue (`#3B82F6`) | Electric Blue (`#2563EB`) | Saldo likuid yang tersedia di rekening. |
| **Aksen Teak (Kategori Biaya)**| Teak Amber (`#D97706`) | Teak Amber (`#D97706`) | Pengeluaran untuk perawatan furnitur/kayu. |
| **Semua Angka Rupiah** | Font Tabular Monospace | Font Tabular Monospace | `JetBrains Mono` untuk presisi akuntansi. |

---

## 3. Komponen Kunci & Fitur Pembukuan

1. **Auto-Categorization Expense Modal:**
   - Modal pencatatan pengeluaran dengan kategori siap pakai: *Listrik/PLN, Air/PDAM, WiFi/Indihome, Gaji Karyawan, Maintenance, Kebersihan & Keamanan*.
   - Unggah foto nota/bon fisik sebagai bukti audit.
2. **Kalkulator Margin Laba Riil (Net Yield):**
   - Menghitung persentase imbal hasil tahunan (*yield ROI*) dari nilai investasi gedung kost berdasarkan omset bersih.
3. **Ekspor Satu Klik ke Excel / PDF:**
   - Menghasilkan laporan pembukuan rapi berstandar PSAK yang siap diserahkan ke konsultan pajak atau mitra perbankan.

---

## 4. Evaluasi UX & Aksesibilitas

* **Pencegahan Human Error:** Input angka rupiah dilengkapi pemformat otomatis pemisah ribuan (*thousand separator `1.500.000`*) saat diketik secara langsung.
* **Perlindungan Privasi:** Tombol mata (*Eye Toggle*) untuk menyembunyikan angka total pendapatan saat pemilik membuka layar di tempat umum.

---

## 5. Rekomendasi Peningkatan
* Sediakan grafik proyeksi arus kas 6 bulan ke depan (*forecasting*) berdasarkan tanggal berakhirnya kontrak penyewa aktif.
