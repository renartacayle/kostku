# Analisis Halaman: Dashboard Pemilik (Owner Cockpit & Property Management)

> **File Sumber:** `src/pages/Dashboard.jsx`  
> **Route URL:** `/dashboard` (Saat login sebagai Owner/Master)  
> **Target Pengguna:** Pemilik Kost dan Pengelola Properti  
> **Core Theme:** *High-Density Architectural Operations Cockpit*  

---

## 1. Tujuan Halaman & User Journey

Halaman Dashboard Pemilik (`Dashboard.jsx`) adalah pusat komando operasional seluruh properti kost. Pemilik dapat memantau tingkat okupansi kamar, arus kas masuk harian, status jatuh tempo sewa penghuni, serta merespons tiket komplain mendesak.

```
  [ Pemilik Membuka Dashboard ]
                 │
                 ▼
  [ Ringkasan Metrik Utama (4 Kartu Bento: Okupansi, Pendapatan, Tagihan Aktif, Komplain) ]
                 │
                 ▼
  [ Switcher Properti Aktif (Jika Pemilik Punya > 1 Cabang Kost) ]
                 │
                 ▼
  [ Matriks Visual Kamar (Kamar Terisi [Hijau] vs Kamar Kosong [Biru] vs Terlambat [Merah]) ]
                 │
                 ▼
  [ Aksi Cepat: Tambah Kamar Baru / Kirim Tagihan WhatsApp / Verifikasi Pembayaran ]
```

---

## 2. Penerapan Core Color Palette

| Bagian Dashboard | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Latar kerja profesional minim kelelahan mata. |
| **Bento Metric Cards** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Kartu metrik dengan border semitransparan. |
| **Kamar Terisi (Occupied)** | Emerald Green (`#10B981`) | Emerald Green (`#16A34A`) | Menandakan kamar menghasilkan pendapatan aktif. |
| **Kamar Kosong (Vacant)** | Electric Blue (`#3B82F6`) | Electric Blue (`#2563EB`) | Kamar siap disewakan kembali ke publik. |
| **Kamar Jatuh Tempo** | Crimson Red (`#EF4444`) | Crimson Red (`#DC2626`) | Menandai penghuni yang menunggak pembayaran. |
| **Aksen Teak (Aset Properti)**| Teak Amber (`#D97706`) | Teak Amber (`#D97706`) | Aksen nama gedung dan fasilitas kamar. |

---

## 3. Komponen Kunci & Fitur Cockpit

1. **Multi-Property Switcher (`Navbar` & `AddPropertyModal`):**
   - Pemilik yang mengelola lebih dari satu gedung kost dapat beralih properti dalam satu klik tanpa logout.
2. **Interactive Room Grid Matrix:**
   - Grid visual lantai 1, lantai 2, dan lantai 3 yang menampilkan nomor kamar, nama penghuni, dan sisa hari masa sewa.
   - Klik kartu kamar langsung membuka modal rincian penyewa dan riwayat pembayaran.
3. **Quick Broadcast via WhatsApp Gateway:**
   - Tombol satu-klik untuk mengirim pengingat tagihan sewa bulanan dengan format teks rapi dan sopan langsung ke nomor WhatsApp penyewa.

---

## 4. Evaluasi UX & Aksesibilitas

* **Visual Density:** Menggunakan rasio kepadatan visual `5 / 10`, memastikan data numerik tebal dan terbaca jelas dari layar laptop maupun tablet kasir.
* **Format Angka Keuangan:** Seluruh nilai rupiah menggunakan font `JetBrains Mono` bertipe tabular angka (`font-variant-numeric: tabular-nums`) agar rapi sejajar secara vertikal.

---

## 5. Rekomendasi Peningkatan
* Tambahkan widget grafik garis tren arus kas masuk mingguan untuk memproyeksikan target omset sewa bulanan.
