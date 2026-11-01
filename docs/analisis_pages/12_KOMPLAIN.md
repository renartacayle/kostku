# Analisis Halaman: Tiket Komplain & Perawatan (Maintenance Ticketing)

> **File Sumber:** `src/pages/Komplain.jsx`  
> **Route URL:** `/komplain`  
> **Target Pengguna:** Penghuni yang melaporkan kerusakan & Pemilik/Staf yang menangani perbaikan  
> **Core Theme:** *High-Urgency SLA Maintenance & Fast Resolution Helpdesk*  

---

## 1. Tujuan Halaman & User Journey

Halaman Komplain (`Komplain.jsx`) mencegah konflik antara anak kost dan bapak/ibu kost. Alih-alih komplain tenggelam di chat WhatsApp pribadi, sistem tiket ini mencatat masalah secara transparan beserta tingkat urgensi, foto bukti kerusakan, batas waktu penanganan (SLA), dan riwayat perbaikan teknisi.

```
  [ Penghuni Mengalami Masalah (cth: AC Tidak Dingin / Lampu Mati) ]
                               │
                               ▼
  [ Buat Tiket Baru: Pilih Kamar, Kategori Masalah, Unggah Foto Kerusakan ]
                               │
                               ▼
  [ Tingkat Urgensi: Rendah (Kuning) | Sedang (Oranye) | Darurat (Merah Bocor/Listrik Mati) ]
                               │
                               ▼
  [ Notifikasi Masuk ke Dashboard Pemilik & HP Petugas Maintenance ]
                               │
                               ▼
  [ Teknisi Datang ──► Tiket Berubah: "Sedang Dikerjakan" ──► "Selesai" (Hijau Emerald) ]
```

---

## 2. Penerapan Core Color Palette

| Status & Komponen | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Card Tiket Masalah** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Tampilan bento tiket tertata rapi. |
| **Status "Darurat / Emergency"**| Crimson Red (`#EF4444`) | Crimson Red (`#DC2626`) | Masalah genting (pipa air bocor, korsleting listrik). |
| **Status "Sedang Diproses"** | Aksen Teak Amber (`#F59E0B`) | Aksen Teak Amber (`#D97706`) | Teknisi sedang dalam perjalanan atau mengerjakan unit. |
| **Status "Selesai / Resolved"** | Emerald Green (`#10B981`) | Emerald Green (`#16A34A`) | Perbaikan tuntas dan diverifikasi penghuni. |
| **Nomor Tiket & Kode SLA** | Font Tabular Monospace | Font Tabular Monospace | Format kode `#TKT-2026-042` via `JetBrains Mono`. |
| **Tombol Kirim Laporan** | Gradient Electric Blue (`#2563EB`) | Gradient Electric Blue (`#2563EB`) | Aksi submit tiket laporan. |

---

## 3. Komponen Kunci & Fitur Helpdesk

1. **Category Quick Selector:**
   - Ikon siap pilih: *Listrik/Stopkontak, Air/Kran/Shower, AC/Remote, Kasur/Pintu/Kunci, Kebersihan Lorong, Gangguan Suara/Kenyamanan*.
2. **Kamera Unggah Bukti:**
   - Mendukung pengambilan foto langsung dari kamera smartphone untuk menunjukkan titik kerusakan kepada pemilik tanpa multitafsir.
3. **Rating Kepuasan Pasca-Perbaikan:**
   - Setelah tiket dinyatakan selesai oleh penjaga kost, penghuni dapat memberikan rating bintang (1-5) dan testimoni kepuasan.

---

## 4. Evaluasi UX & Aksesibilitas

* **Pemberian Bobot Urgensi Jelas:** Pengguna dilarang menandai tiket sebagai "Darurat" tanpa menyertakan foto dan deskripsi minimal 20 karakter untuk mencegah spam tiket palsu.
* **Filter Status Ramah Pengguna:** Filter tab atas (*Semua, Menunggu, Diproses, Selesai*) memudahkan pemilik menyaring pekerjaan yang belum beres di pagi hari.

---

## 5. Rekomendasi Peningkatan
* Integrasikan notifikasi bot WhatsApp otomatis ke grup staf penjaga kost saat ada tiket berkategori "Darurat" yang masuk di luar jam kerja.
