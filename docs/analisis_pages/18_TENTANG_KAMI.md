# Analisis Halaman: Tentang Kami (About Us & Vision Mission)

> **File Sumber:** `src/pages/TentangKami.jsx`  
> **Route URL:** `/tentang-kami`, `/about`, `/about-us`  
> **Target Pengguna:** Mahasiswa, Mitra, Investor, Dosen Penguji Sidang RPL, dan Calon Partner Bisnis  
> **Core Theme:** *PropTech Engineering Storytelling & Architectural Vision*  

---

## 1. Tujuan Halaman & User Journey

Halaman Tentang Kami (`TentangKami.jsx`) menceritakan narasi di balik kelahiran KostKu: kegelisahan mahasiswa rantau terhadap foto kost palsu yang memanipulasi sudut pandang, pemilik kost tradisional yang kewalahan menagih sewa dengan buku kas manual yang sering hilang, dan potensi UMKM sekitar kost yang terabaikan. Halaman ini membangun ikatan emosional dan kepercayaan brand (*brand affinity & trust*).

```
  [ Pengunjung Masuk ke /tentang-kami ]
                     │
                     ▼
  [ Hero: "Membangun Standar Baru Hunian Mahasiswa & Ekosistem Kost Indonesia" ]
                     │
                     ▼
  [ Tiga Pilar Masalah yang Diselesaikan:
    ├─ 1. Transparansi Arsitektur (Bebas Lensa Menipu via Denah 2D CAD Skala 1:50)
    ├─ 2. Automasi Finansial Pemilik (Pembukuan Otomatis & Gateway Bank Indonesia)
    └─ 3. Ekonomi Hiperlokal (Jaringan Mitra Galon, Laundry & Warung Makan) ]
                     │
                     ▼
  [ Tim Pengembang & Nilai Budaya Engineering (UDINUS Software Engineering) ]
                     │
                     ▼
  [ CTA Bergabung: Pasang Iklan Kost Gratis / Hubungi Kemitraan ]
```

---

## 2. Penerapan Core Color Palette

| Bagian Halaman | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Latar panggung cerita inovasi. |
| **Heading Hero** | Gradient Electric Blue (`#2563EB` ──► `#60A5FA`) | Gradient Electric Blue (`#1D4ED8` ──► `#2563EB`) | Semangat visi teknologi pintar. |
| **Pilar Nilai Inovasi** | Kartu Bento `--bg-primary` | Kartu Bento `--bg-primary` | 3 kartu pilar inovasi KostKu. |
| **Aksen Teak (Pilar Hunian)**| Aksen Teak Amber (`#D97706`) | Aksen Teak Amber (`#D97706`) | Kehangatan filosofi hunian anak kos. |
| **Tombol Kemitraan** | Gradient Electric Blue (`#2563EB`) | Gradient Electric Blue (`#2563EB`) | Tombol hubungi tim pengembang. |

---

## 3. Komponen Kunci & Storytelling

1. **Pilar Transformasi Digital (Bento Grid 3 Kolom):**
   - **Pilar 1: Kejujuran Ruang (Spatial Honesty):** Mengedepankan denah dimensi nyata dan arah pencahayaan matahari.
   - **Pilar 2: Bebas Tunggakan (Financial Peace):** Mengotomatiskan tagihan dan kuitansi digital.
   - **Pilar 3: Ekosistem Berdaya (Local Empowerment):** Merangkul pedagang UMKM sekitar kost.
2. **Kredensial Akademik & Sertifikasi:**
   - Menyebutkan standar rekayasa perangkat lunak berstandar IEEE 830 / ISO/IEC 25010 hasil riset mahasiswa Universitas Dian Nuswantoro (UDINUS).
3. **Statistik Pertumbuhan Komunitas:**
   - Menampilkan metrik kamar terkelola, transaksi sukses, dan mitra UMKM aktif dengan font tabular monospace.

---

## 4. Evaluasi UX & Aksesibilitas

* **Penceritaan Mengalir:** Menggunakan teknik *narrative flow* dengan kontras visual tinggi yang membimbing mata pembaca dari masalah, solusi, hingga aksi nyata.
* **Performa Gambar:** Foto tim dan ilustrasi arsitektur dioptimalkan dengan format WebP kompresi tinggi untuk kecepatan buka seketika.

---

## 5. Rekomendasi Peningkatan
* Sertakan peta perjalanan produk (*Roadmap 2026/2027*) seperti rencana peluncuran integrasi Smart Water Meter IoT dan AI Dynamic Room Pricing.
