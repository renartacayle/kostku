# Analisis Halaman: Detail Kost & Denah CAD (Kost Detail)

> **File Sumber:** `src/pages/KostDetail.jsx`  
> **Route URL:** `/kost/:id`  
> **Target Pengguna:** Calon penghuni yang mengevaluasi spesifikasi teknis kamar kost  
> **Core Theme:** *Architectural Blueprint & Spatial Environmental Intelligence*  

---

## 1. Tujuan Halaman & User Journey

Halaman Detail Kost (`KostDetail.jsx`) adalah halaman konversi paling krusial. Alih-alih hanya menyajikan galeri foto yang rawan manipulasi lensa *wide-angle*, halaman ini memberikan **fakta arsitektur transparan**: ukuran kamar riil, arah mata angin, simulasi cahaya matahari, dan rincian tarif utilitas.

```
  [ Pengguna Masuk dari Listing ]
                 │
                 ▼
  [ Header: Galeri Foto Asli + Badge Verifikasi e-KTP ]
                 │
                 ▼
  [ Blueprint 2D Vektor Skala 1:50 (Ukuran Dinding, Jendela, Pintu) ]
                 │
                 ▼
  [ Widget Orientasi Matahari (Pagi/Sore) & Arah Angin ]
                 │
                 ▼
  [ Live Kalkulator Token Listrik kWh & Biaya Tambahan ]
                 │
                 ▼
  [ Sticky Floating Bar: Harga Bulanan & Tombol "Ajukan Sewa / Booking" ]
                 │
                 ▼
  [ Redirect ke Checkout (/checkout) ]
```

---

## 2. Penerapan Core Color Palette

| Bagian Halaman | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Kedalaman panggung arsitektural. |
| **Container Denah 2D (CAD)**| Deep Void (`#050811`) | Grid Blueprint (`#F8FAFC`) | Latar grid milimeter presisi untuk denah kamar. |
| **Garis Dinding Denah** | Electric Blue (`#3B82F6`) | Blueprint Blue (`#1D4ED8`) | Garis CAD standar teknik arsitektur. |
| **Simulasi Cahaya Pagi/Sore**| Teak Amber (`#F59E0B`) | Teak Amber (`#D97706`) | Sinar matahari pagi/sore yang menembus jendela kamar. |
| **Kalkulator Listrik kWh** | Biru Aqua (`#00BCD4`) | Biru Laut (`#0284C7`) | Mengindikasikan utilitas listrik & air dingin. |
| **Tombol CTA Sticky** | `--accent-gradient` (`#2563EB`) | `--accent-gradient` (`#2563EB`) | Selalu terlihat di bagian bawah layar smartphone. |

---

## 3. Komponen Khusus & Bento Grid

1. **Denah CAD Vektor Skala 1:50:**
   - Menampilkan posisi kasur, meja belajar, lemari, dan kamar mandi dalam secara presisi.
   - Dilengkapi ukuran dimensi teks tabular monospace (`3.00 × 4.00 m`).
2. **Environmental Sun & Ventilation Compass:**
   - Kompas arah hadap kamar (misal: Menghadap Timur = sejuk di sore hari, hangat di pagi hari).
   - Indikator sirkulasi silang (*cross ventilation*) untuk kesehatan paru-paru penghuni.
3. **Owner Profile Card & Direct Chat:**
   - Foto pemilik terverifikasi dengan tingkat respon chat `< 15 menit`.
   - Tombol hubungi via WhatsApp terenkripsi.

---

## 4. Evaluasi UX & Aksesibilitas

* **Sticky Action Bar:** Di perangkat mobile, bilah harga dan tombol *"Sewa Kamar Ini"* terkunci di bagian bawah dengan `safe-area-inset-bottom` agar tidak tertutup gestur navigasi Android/iOS.
* **Perlindungan Data:** Nomor kontak pemilik tidak ditampilkan secara telanjang di HTML publik untuk mencegah *scraping* spam marketing pihak ketiga.

---

## 5. Rekomendasi Peningkatan
* Tambahkan toggle komparasi sekunder untuk membandingkan spesifikasi Kamar Tipe A vs Kamar Tipe B di properti yang sama tanpa meninggalkan halaman.
