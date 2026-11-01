# Analisis Halaman: Portal Mandiri Penghuni (Tenant Dashboard & Smart Living)

> **File Sumber:** `src/pages/UserDashboard.jsx`  
> **Route URL:** `/dashboard` (Saat login sebagai Penghuni/Tenant)  
> **Target Pengguna:** Mahasiswa dan Karyawan yang sedang aktif menyewa kamar kost  
> **Core Theme:** *Personal Smart PropTech Hub & Daily Living Portal*  

---

## 1. Tujuan Halaman & User Journey

Halaman Portal Mandiri Penghuni (`UserDashboard.jsx`) adalah asisten pribadi harian anak kost. Halaman ini menghapus kerepotan manual: penghuni dapat mengecek masa aktif sewa, membuka pintu pintar (*Smart Lock PIN*), memantau pemakaian listrik, mengajukan komplain kerusakan, hingga memesan galon dan laundry langsung dari kamarnya.

```
  [ Penghuni Membuka Dashboard di Smartphone ]
                        │
                        ▼
  [ Kartu Status Kamar: No. Kamar, Sisa Hari Masa Sewa, Status Lunas ]
                        │
                        ▼
  [ Widget Smart-Lock PIN & Akses Gerbang Kost Digital ]
                        │
                        ▼
  [ Quick Service Bento:
    ├─ Galon Air Minum (Pesan Isi Ulang / Aqua) ──► Warna Aqua Cyan
    ├─ Laundry Kiloan (Pesan Cuci Lipat/Setrika) ─► Warna Lilac Softener
    └─ FnB Sekitar (Katering Harian & Warung) ───► Warna Oranye/Merah ]
                        │
                        ▼
  [ Tombol Darurat & Lapor Kerusakan Fasilitas (/komplain) ]
```

---

## 2. Penerapan Core Color Palette

| Elemen UI Penghuni | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Card Status Kamar** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Tampilan status sewa elegan. |
| **Badge "Sewa Aktif/Lunas"** | Emerald Green (`#10B981`) | Emerald Green (`#16A34A`) | Ketenangan pikiran bahwa sewa sudah terbayar. |
| **PIN Smart Lock Digital** | Electric Blue (`#3B82F6`) | Electric Blue (`#2563EB`) | Angka kode akses pintu dengan tombol sembunyikan PIN. |
| **Shortcut Pesan Galon** | Aqua Cyan (`#00BCD4` / `#0284C7`) | Aqua Cyan (`#0284C7`) | Visual air segar higienis. |
| **Shortcut Pesan Laundry** | Lilac Purple (`#8B5CF6`) | Lilac Purple (`#7C3AED`) | Visual wangi softener pakaian bersih. |
| **Shortcut FnB / Makan** | Merah Cabai / Oranye (`#EA580C`) | Oranye Hangat (`#EA580C`) | Visual makanan lezat sekitar kost. |

---

## 3. Komponen Kunci & Fitur Smart Living

1. **Smart Lock & Gate Access:**
   - Menampilkan kode PIN dinamis 6-digit untuk membuka gerbang elektronik kost tanpa kunci fisik.
   - Peringatan jika jam malam kost telah berlaku (misal: pukul 23:00 WIB).
2. **"Beli Lagi" Layanan Mitra Sekitar:**
   - Integrasi langsung dengan toko galon dan laundry rekanan pemilik kost terdekat.
   - Penghuni cukup menekan *"Pesan 1 Galon"* dan pesanan langsung diteruskan ke kurir mitra via WhatsApp API.
3. **Billing Countdown & Perpanjangan Satu Klik:**
   - Menghitung mundur sisa masa sewa (misal: *Tersisa 5 Hari*).
   - Tombol perpanjang langsung membawa ke halaman checkout TriPay tanpa perlu konfirmasi manual yang berbelit.

---

## 4. Evaluasi UX & Aksesibilitas

* **Optimasi Mobile-First:** Komponen ditata dalam tata letak kartu bento vertikal yang nyaman diakses menggunakan satu ibu jari (*thumb zone friendly*).
* **Kontras Kode PIN:** Angka PIN smart lock menggunakan ukuran huruf besar `2.25rem` berjarak renggang (`letter-spacing: 0.25em`) untuk kemudahan membaca di kondisi minim cahaya.

---

## 5. Rekomendasi Peningkatan
* Hadirkan fitur notifikasi push browser (PWA Push Notifications) untuk pengingat jadwal penjemputan laundry atau kedatangan kurir galon.
