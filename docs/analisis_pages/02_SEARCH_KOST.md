# Analisis Halaman: Cari & Filter Kost (Search & Map View)

> **File Sumber:** `src/pages/SearchKost.jsx`  
> **Route URL:** `/search`, `/cari-kost`  
> **Target Pengguna:** Mahasiswa dan Karyawan yang menyaring kamar kost secara spesifik  
> **Core Theme:** *High-Density Spatial Search & Multi-Parametric Filter*  

---

## 1. Tujuan Halaman & User Journey

Halaman pencarian (`SearchKost.jsx`) dirancang untuk memproses filter multidimensi tanpa me-reload halaman (*zero-latency filtering*).

```
  [ Pengguna Menentukan Filter ]
  (Gender: Putra/Putri/Campur | Harga Min-Max | Fasilitas AC/K.Mandi Luar)
                 │
                 ▼
  [ Split View Engine (Tampilan Split) ]
       ┌─────────┴─────────┐
       ▼                   ▼
  [ Kolom Kiri:       [ Kolom Kanan: 
    Kartu Hasil Listing] Peta Interaktif Leaflet + Pin CAD ]
                 │
                 ▼
  [ Aksi Kartu: Klik Lihat Denah / Kalkulator Listrik / Detail Kost ]
```

---

## 2. Penerapan Core Color Palette

| Elemen UI | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas & Filter Bar** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Latar bersih tanpa distraksi visual. |
| **Pill Filter Aktif** | `--accent-primary` (`#2563EB`) | `--accent-primary` (`#2563EB`) | Indikator parameter filter yang sedang menyala. |
| **Harga Kost (Per Bulan)** | Font Mono + `#F8FAFC` | Font Mono + `#0F172A` | Menggunakan angka tabular mono (`JetBrains Mono`). |
| **Pin Peta Interaktif** | Biru Elektrik (`#2563EB`) | Biru Elektrik (`#1D4ED8`) | Pin harga mini di atas peta interaktif. |
| **Tag Gender (Putri)** | Soft Pink Tint (`rgba(244, 114, 182, 0.15)`) | Soft Pink Tint (`#FCE7F3`) | Tetap harmonis tanpa mendominasi palet core. |
| **Tag Gender (Putra)** | Electric Blue Tint (`rgba(59, 130, 246, 0.15)`) | Slate Tint (`#EFF6FF`) | Kategori kost pria. |
| **Fasilitas Kamar (AC/Wifi)**| Slate Muted (`#94A3B8`) | Slate Secondary (`#475569`) | Ikon minimalis abu-abu arsitektural. |

---

## 3. Komponen & Fitur Interaktif

1. **Top Filter Strip:**
   - Filter cepat berdasarkan tipe kamar (Standard, Deluxe, VIP).
   - Tipe penyewa (Putra, Putri, Pasutri/Campur).
   - Rentang anggaran menggunakan slider dinamis.
2. **Dual View Toggle (Grid vs Map Mode):**
   - Di mobile: Tombol mengambang di bawah (*Floating Toggle*) beralih dari daftar kartu ke layar penuh peta.
   - Di desktop: Tampilan 50:50 yang elegan (kartu di kiri, peta responsif di kanan).
3. **Empty State Handler:**
   - Jika filter terlalu ketat dan tidak menemukan hasil, ditampilkan ilustrasi arsitektur minimalis dengan tombol aksi satu-klik: *"Reset Semua Filter"*.

---

## 4. Evaluasi UX & Aksesibilitas

* **Perlindungan Layout Shift:** Kartu listing memiliki aspek rasio tetap `16:10` untuk gambar, mencegah pergeseran elemen saat gambar sedang di-load.
* **Keterbacaan Pin Peta:** Pin peta dilengkapi kontras warna putih tebal agar terbaca jelas di atas peta satelit maupun peta jalanan.
* **Keyboard Navigation:** Filter dropdown dapat dioperasikan penuh dengan tombol `Tab` dan `Enter`.

---

## 5. Rekomendasi Peningkatan
* Sinkronkan state URL dengan parameter query (misal: `?gender=putri&maxPrice=1500000`) agar pengguna dapat membagikan tautan hasil filter langsung ke WhatsApp.
