# Analisis Halaman: Manajemen Karyawan (Staff & Access Control)

> **File Sumber:** `src/pages/Karyawan.jsx`  
> **Route URL:** `/karyawan`  
> **Target Pengguna:** Pemilik Kost (Owner/Master) yang mempekerjakan penjaga, satpam, atau petugas kebersihan  
> **Core Theme:** *Role-Based Access Control (RBAC) & Task Delegation*  

---

## 1. Tujuan Halaman & User Journey

Halaman Manajemen Karyawan (`Karyawan.jsx`) memungkinkan pemilik kost mendelegasikan tugas harian kepada staf lapangan tanpa khawatir data keuangan rahasia diintip. Sistem ini membagi hak akses ke dalam beberapa level: **Manajer Properti**, **Petugas Kebersihan (Cleaning)**, **Satpam (Security)**, dan **Teknisi Maintenance**.

```
  [ Pemilik Masuk ke /karyawan ]
                 │
                 ▼
  [ Daftar Staf Aktif (Foto, Nama, Jabatan, Nomor WhatsApp, Cabang Properti) ]
                 │
                 ▼
  [ Tambah Staf Baru / Edit Hak Akses (Role Permissions) ]
                 │
                 ▼
  [ Matriks Izin Akses:
    ├─ Boleh Lihat Komplain? (Ya)
    ├─ Boleh Update Meteran Listrik/Air? (Ya)
    └─ Boleh Lihat Laba/Rugi & Rekening Bank? (TIDAK) ]
                 │
                 ▼
  [ Generate Akun & Kirim Kredensial Login ke WhatsApp Staf ]
```

---

## 2. Penerapan Core Color Palette

| Elemen Antarmuka Staf | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Card Profil Karyawan** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Tampilan kartu staf terorganisir. |
| **Badge Jabatan (Manager)**| Electric Blue (`#3B82F6`) | Electric Blue (`#2563EB`) | Peran manajemen tinggi. |
| **Badge Jabatan (Staf)** | Slate Blue (`#64748B`) | Slate Neutral (`#475569`) | Peran operasional lapangan. |
| **Status "Staf Aktif"** | Emerald Green (`#10B981`) | Emerald Green (`#16A34A`) | Karyawan aktif bertugas. |
| **Status "Nonaktif / Cuti"**| Aksen Teak Amber (`#F59E0B`) | Aksen Teak Amber (`#D97706`) | Karyawan sedang libur atau tidak aktif. |
| **Tombol Tambah Karyawan**| Gradient Electric Blue (`#2563EB`) | Gradient Electric Blue (`#2563EB`) | Tombol aksi utama halaman. |

---

## 3. Komponen Kunci & Pengaturan Izin

1. **Role Permission Matrix:**
   - Checkbox izin spesifik per modul: Dashboard Ringkasan, CRM Penghuni, Tiket Komplain, dan Keuangan.
2. **Riwayat Aktivitas Staf (Audit Trail):**
   - Mencatat log aksi yang dilakukan staf (misal: *"Pak Joko menyelesaikan tiket perbaikan kran Kamar 104 pada pukul 14:15"*).
3. **Emergency Staff Contact:**
   - Tombol panggil darurat satu-sentuhan ke nomor ponsel staf yang sedang bertugas malam.

---

## 4. Evaluasi UX & Aksesibilitas

* **Pencegahan Penghapusan Fatal:** Tombol hapus staf dilengkapi konfirmasi ganda modal dialog (*Are you sure?*) untuk mencegah penghapusan akun staf yang sedang memiliki tiket kerja aktif.
* **Keterbacaan Hak Akses:** Tabel izin menggunakan tanda centang hijau emerald dan tanda silang abu-abu redup yang mudah dipindai secara visual.

---

## 5. Rekomendasi Peningkatan
* Sediakan fitur absensi kehadiran staf berbasis swafoto dan GPS Geolocation saat tiba di lokasi properti kost.
