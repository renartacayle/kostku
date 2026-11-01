# Analisis Halaman: Masuk Akun (Dual-Role Authentication)

> **File Sumber:** `src/pages/Login.jsx`  
> **Route URL:** `/login`  
> **Target Pengguna:** Penyewa Kost, Pemilik Kost (Owner), dan Mitra Layanan  
> **Core Theme:** *Focused Secure Gateway with Role Separation*  

---

## 1. Tujuan Halaman & User Journey

Halaman Login (`Login.jsx`) bertugas memvalidasi identitas pengguna ke dalam tiga peran operasional: **Penyewa (Tenant)**, **Pemilik Kost (Owner/Master)**, dan **Mitra Layanan (Merchant)**.

```
  [ Pengguna Membuka /login ]
                 │
                 ▼
  [ Tab Pemilihan Peran: Penyewa Kost vs Pemilik Kost vs Mitra ]
                 │
                 ▼
  [ Input Nomor WhatsApp / Email & Kata Sandi ]
                 │
                 ▼
  [ Validasi Kredensial & Role Match ]
       ┌─────────┼─────────┐
       ▼         ▼         ▼
  [Penyewa]   [Owner]   [Mitra]
       │         │         │
  /dashboard  /dashboard /mitra
  (Tenant UI) (Owner UI) (Merchant UI)
```

---

## 2. Penerapan Core Color Palette

| Komponen Login | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Card Auth Tengah** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Kotak formulir terfokus di tengah layar. |
| **Active Tab Switcher** | `--accent-primary` (`#2563EB`) | `--accent-primary` (`#2563EB`) | Menandai tab peran yang sedang dipilih. |
| **Input Focus Ring** | Border Electric Blue (`#3B82F6`) | Border Electric Blue (`#2563EB`) | Outline fokus yang jelas untuk aksesibilitas. |
| **Aksen Teak (Logo/Icon)**| Teak Amber (`#D97706`) | Teak Amber (`#D97706`) | Aksen logo rumah KostKu yang ramah. |
| **Tombol Masuk Akun** | `--accent-gradient` (`#2563EB`) | `--accent-gradient` (`#2563EB`) | Aksi submit formulir. |

---

## 3. Fitur Keamanan & Penanganan Input

1. **Password Visibility Toggle:** Tombol intip sandi bermata siluet untuk mempermudah pengecekan tanpa resiko *shoulder surfing*.
2. **Demo Quick Access Pill:** Untuk kepentingan evaluasi sidang RPL atau investor, disediakan chip login instan satu-klik (Login sebagai Demo Owner / Demo Penghuni).
3. **Penyimpanan Sesi:** Sesi login disimpan secara aman di `localStorage` (`kostUser`) dengan token otorisasi yang divalidasi ke backend.

---

## 4. Evaluasi UX & Aksesibilitas

* **Autofocus Cerdas:** Saat halaman terbuka di desktop, kursor otomatis fokus pada kolom input nomor WhatsApp/email.
* **Pesan Error Informatif:** Menampilkan peringatan jelas jika kata sandi salah atau nomor belum terdaftar, tanpa membuat pengguna bingung.

---

## 5. Rekomendasi Peningkatan
* Integrasikan opsi login instan dengan *WhatsApp Magic Link* (OTP satu kali klik) untuk mempercepat login pengguna mobile tanpa harus menghafal kata sandi.
