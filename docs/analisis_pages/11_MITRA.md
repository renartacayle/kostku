# Analisis Halaman: Ekosistem Mitra Sekitar (Merchant & Services Ecosystem)

> **File Sumber:** `src/pages/Mitra.jsx`  
> **Route URL:** `/mitra`  
> **Target Pengguna:** Pengelola Toko Mitra (Warung FnB, Depot Galon, Laundry Kiloan, Jasa Bersih) & Penghuni Kost  
> **Core Theme:** *Hyperlocal Merchant Network & Shared Palette Integration*  

---

## 1. Tujuan Halaman & User Journey

Halaman Mitra (`Mitra.jsx`) adalah jembatan ekonomi hiperlokal KostKu. Halaman ini menghubungkan UMKM di radius 500 meter di sekitar gedung kost langsung dengan ratusan penghuni kamar. Kategori utama yang dikelola meliputi:
1. **FnB:** Katering harian, warmindo, warung makan, aneka es buah dan jus.
2. **Depot Air Minum / Galon:** Isi ulang galon air bersih, Aqua, Le Minerale.
3. **Laundry Kiloan:** Layanan cuci kering lipat, cuci setrika, dan express.
4. **Jasa Kebersihan:** Cuci AC dan bebersih kamar berkala.

```
  [ Mitra Membuka Dashboard /mitra atau Penghuni Melihat Menu Mitra ]
                               │
                               ▼
  [ Tab Kategori Layanan:
    ├── FnB (Katering & Makanan) ─────────► Aksen Merah/Oranye Selera
    ├── Galon Air Minum ──────────────────► Aksen Biru Aqua Higienis
    └── Laundry Kiloan ───────────────────► Aksen Ungu Lilac & Biru Langit ]
                               │
                               ▼
  [ Katalog Produk / Jasa + Harga Tabular + Estimasi Waktu Antar ]
                               │
                               ▼
  [ Pesan Cepat via WhatsApp Gateway / Teruskan ke Penghuni Kamar ]
```

---

## 2. Penerapan Core Color Palette & Integrasi Kategori Spesifik

Halaman Mitra mendemonstrasikan bagaimana warna inti KostKu (Electric Blue & Teak) berpadu harmonis dengan warna fungsional kategori lokal:

| Kategori / Elemen | Dark Mode Token | Light Mode Token | Makna & Alasan Persepsi Lokal |
| :--- | :--- | :--- | :--- |
| **Canvas & Shell Utama** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Selaras dengan seluruh halaman KostKu lainnya. |
| **Kategori FnB (Makanan)** | Merah Cabai / Oranye (`#EF5350` / `#FB923C`) | Merah Cabai / Oranye (`#D32F2F` / `#EA580C`) | Merangsang nafsu makan dan kelezatan masakan lokal. |
| **Kategori Depot Galon** | Biru Aqua Cyan (`#38BDF8` / `#22D3EE`) | Biru Aqua Cyan (`#0284C7` / `#0891B2`) | Persepsi air steril, bebas lumut, segar pegunungan. |
| **Kategori Laundry Kiloan** | Lilac Ungu / Soft Pink (`#A78BFA` / `#F472B6`) | Lilac Ungu / Soft Pink (`#7C3AED` / `#DB2777`) | Asosiasi semerbak wangi softener Downy/Molto tahan lama. |
| **Badge "Mitra Rekanan Resmi"**| Aksen Teak (`#F59E0B`) | Aksen Teak (`#D97706`) | Segel kepercayaan dari pemilik kost bahwa mitra amanah. |
| **Tombol Checkout / Pesan** | Gradient Electric Blue (`#2563EB`) | Gradient Electric Blue (`#2563EB`) | Menjaga konsistensi tombol aksi utama aplikasi. |

---

## 3. Komponen Kunci & Fitur Hyperlocal

1. **Category Pill Navigation:**
   - Navigasi horizontal yang mudah digeser di layar sentuh (*horizontal scroll snap*) untuk berpindah antara Galon, Laundry, dan Makanan.
2. **Order Matrix & Cart Tracker:**
   - Menghitung total tagihan belanjaan kebutuhan harian kamar kost secara instan.
   - Pilihan antar langsung ke depan pintu nomor kamar kost.
3. **Status Toko Buka/Tutup:**
   - Indikator lampu hijau/merah yang menunjukkan apakah warung makan atau tempat laundry sedang buka atau tutup saat jam malam.

---

## 4. Evaluasi UX & Aksesibilitas

* **Pembedaan Visual Non-Ambigu:** Warna kategori hanya digunakan sebagai aksen pada *badge*, *chip*, dan ikon kecil; latar belakang kartu tetap netral `--bg-primary` untuk mencegah kesan desain pasar malam yang berantakan (*visual clutter*).
* **Ukuran Tombol Pesan Cepat:** Tombol *"Pesan 1 Galon"* atau *"Pesan Cuci 5 Kg"* memiliki tinggi tap target `48px` agar tidak salah klik oleh pengguna yang terburu-buru.

---

## 5. Rekomendasi Peningkatan
* Integrasikan fitur pelacakan kurir galon/laundry sederhana: *Pesanan Diterima ──► Sedang Dicuci/Diisi ──► Kurir Menuju Kamar*.
