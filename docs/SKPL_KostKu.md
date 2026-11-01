SKPL
SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK
KostKu (Smart Boarding & Hyperlocal Co-Living Ecosystem)
untuk: 
Pemilik Kos & Pencari Kos Indonesia
Dipersiapkan oleh:
Kelompok RPL - S1 Teknik Informatika UDINUS:
1. Oscar Herdian Wijaya (NIM: A11.2025.16309)
2. Yohanes Aryo Suryo Rahardjo (NIM: A11.2025.16479)
3. M. Mirza Fadilah (NIM: A11.2025.16354)
Program Studi Teknik Informatika
FIK - UDINUS
Jl. Imam Bonjol no. 207, Semarang

| ![Logo UDINUS](assets/udinus_logo.jpeg) | Program Studi Teknik Informatika FIK – UDINUS | Nomor Dokumen: SKPL-UDINUS-KOSTKU-2026 | Halaman: 1 dari 52 |
|---|---|---|---|
| | | SKPL-KOSTKU-V2 | Rev I |
| | | Revisi: I | Tgl: 25 Oktober 2026 |

DAFTAR PERUBAHAN
| Revisi | Deskripsi |
| A | Inisiasi KostKu V1.0 (Manajemen kamar, sewa, data anak kost dasar, dan pembukuan kas manual) |
| B | Integrasi Utilitas & Tagihan (Kwh token listrik PLN prabayar, meteran air PDAM, skema utilitas 3-jalur, dan broadcast WhatsApp) |
| C | PWA, Multi-Platform & Smart Operations (PWA Service Worker, Capacitor Android APK, Electron Desktop, Smart Lock, Inspeksi Kamar, E-Signature kontrak) |
| D | Modernisasi Marketplace Visual (3D WebGL Three.js, Video Scroll Scrubbing Canvas, Spatial Bento Showcase, Filter Peta Interaktif Leaflet GPS) |
| E | Multi-Kost & Keamanan Akun (Property switcher multi-properti owner, verifikasi 1 KTP 1 Akun NIK 16-digit anti-bot, dan pemulihan akun via NIK) |
| F | Monetisasi Real & Sundul Kost (Sundul Kost promoted listing slot #1 via QRIS merchant, live countdown, In-App Chat konsultasi, eliminasi simulasi pembayaran fiktif) |
| G | Ekosistem Mitra Afiliasi & Hardening Zero-Error (Mitra UMKM laundry/katering sekitar kost dengan batas komisi Rp 500, simetri siklus kamar terisi/tersedia, React ErrorBoundary, dan pengujian otomatis 14 rute) |
| H | Privacy-First & Zero-KTP Hardening (Penghapusan permanen penyimpanan KTP/NIK di cloud, penggantian anti-bot dengan Cloudflare Turnstile & WhatsApp OTP terenkripsi, protokol offline lapor RT/RW, dan kepatuhan mutlak UU No. 27/2022 PDP) |
| I | Payment Gateway TriPay Compliance, Legal Terms Shield & Filter Modal (Integrasi resmi Payment Gateway TriPay berlisensi Bank Indonesia Merchant T53542 untuk QRIS Dinamis & Virtual Account, penambahan dokumen statis Kebijakan Privasi, Tentang Kami, dan Syarat & Ketentuan dengan klausul perlindungan hukum platform/Cap Rp 100.000/Gugatan Rekonvensi PN Semarang, perlindungan khusus Mitra Pemilik Kost & Mitra UMKM, implementasi Clickwrap Agreement pada registrasi sesuai UU ITE, refactor filter pencarian menjadi modal bottom-sheet, penambahan kontak bantuan CS WhatsApp 081228263200, serta sinkronisasi aset identitas visual logo resmi "K"). |

| INDEX TGL | - | A | B | C | D | E | F | G | H | I |
| Ditulis oleh | Tim Pengembang | 01/08/26 | 15/08/26 | 01/09/26 | 15/09/26 | 01/10/26 | 10/10/26 | 16/10/26 | 18/10/26 | 25/10/26 |
| Diperiksa oleh | Quality Assurance / Lead Architect | 03/08/26 | 17/08/26 | 03/09/26 | 17/09/26 | 03/10/26 | 12/10/26 | 16/10/26 | 18/10/26 | 25/10/26 |
| Disetujui oleh | Dosen Pembimbing / Stakeholder | 05/08/26 | 20/08/26 | 05/09/26 | 20/09/26 | 05/10/26 | 14/10/26 | 16/10/26 | 18/10/26 | 25/10/26 |

Daftar Isi
1. Pendahuluan	4
1.1	Tujuan Penulisan Dokumen	4
1.2	Lingkup Masalah	4
1.3	Definisi, Istilah  dan Singkatan	4
1.4	Aturan Penomoran	5
1.5	Referensi	5
1.6	Deskripsi umum Dokumen (Ikhtisar)	5
2	Deskripsi Umum Perangkat Lunak	6
2.1	Deskripsi Umum Sistem	6
2.2	Karakteristik Pengguna	7
2.3	Batasan	7
2.4	Lingkungan Operasi	8
3	Deskripsi Kebutuhan	9
3.1	Kebutuhan Antarmuka Eksternal	9
3.1.1	Antarmuka pemakai	9
3.1.2	Antarmuka Perangkat Keras	9
3.1.3	Antarmuka Perangkat Lunak	9
3.1.4	Antarmuka Komunikasi	10
3.2	Kebutuhan Fungsional	10
3.2.1	Diagram Konteks	13
3.2.2	DFD Level 1	14
3.2.2.1	DFD Level 2 (Manajemen Kamar & Properti)	15
3.2.2.2	DFD Level 2 (Transaksi Sewa, Pembayaran & Mitra Afiliasi)	16
3.2.3	Data Store	17
3.3	Kebutuhan Data	18
3.3.1	E-R diagram	19
3.4	Kebutuhan Non Fungsional	20
3.5	Batasan Perancangan	22
3.6	Kerunutan (traceability)	23
3.6.1	Kebutuhan Fungsional vs Proses	23
3.6.2	Data Store vs E-R	24
3.7	Ringkasan Kebutuhan	25
3.7.1	Kebutuhan Fungsional	25
3.7.2	Kebutuhan Non Fungsional	26
4	Matriks Evolusi & Riwayat Perubahan Fitur (Ditambah, Diubah, Dihapus)	27
4.1	Fitur yang Ditambahkan (Added Features)	27
4.2	Fitur yang Diubah / Dimodifikasi (Modified Features)	30
4.3	Fitur yang Dihapus / Dieliminasi (Removed Features)	32
5	Reasoning & Justifikasi Ilmiah Penghapusan KTP (Zero-KTP Rationale)	34
5.1	Aspek Kepatuhan Hukum & Yuridis (UU PDP No. 27 Tahun 2022)	34
5.2	Aspek Rekayasa Keamanan Siber (Defensive Engineering)	34
5.3	Aspek Efektivitas Teknis: Mengapa KTP Gagal Menyaring Bot	35
5.4	Aspek Psikologi Pengguna & Konversi Bisnis (UX & Funnel)	35
5.5	Aspek Harmonisasi Regulasi RT/RW (UU No. 23/2006) & PSE Komdigi	35
6	Reasoning & Landasan Yuridis Perlindungan Platform & Kemitraan Owner (Legal Shield Rationale)	36
6.1	Kedudukan Hukum Intermediary Platform & Safe Harbor (SE Menkominfo No. 5/2016)	36
6.2	Prinsip Pembatasan Ganti Rugi Finansial Maksimal (Cap of Liability Rp 100.000)	36
6.3	Hak Gugatan Rekonvensi & Pemulihan Biaya Kuasa Hukum (Pasal 132a HIR)	37
6.4	Keabsahan Perjanjian Elektronik Berbasis Centang (Clickwrap Agreement UU ITE)	37
6.5	Pemisahan Resiko Properti Mitra Owner & Larangan Pungutan Siluman	37

---

# 1. Pendahuluan

## 1.1 Tujuan Penulisan Dokumen
Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL) ini disusun sebagai dokumen acuan formal dan pedoman rekayasa perangkat lunak dalam perancangan, pengembangan, pengujian (*quality assurance*), serta penggelaran (*deployment*) platform **KostKu (Smart Boarding & Hyperlocal Co-Living Ecosystem)**. 

Dokumen ini ditujukan untuk digunakan oleh:
1. **Tim Pengembang (*Software Engineering Team*)**: Sebagai spesifikasi implementasi kode, skema basis data, arsitektur API, dan komponen antarmuka.
2. **Dosen Pembimbing & Penguji Akademik Program Studi Teknik Informatika FIK - UDINUS**: Sebagai dasar evaluasi pemenuhan standar rekayasa perangkat lunak, metodologi pemodelan fungsional (DFD & ERD), serta ketertelusuran kebutuhan (*traceability*).
3. **Pemilik Kost (*Owners*) & Mitra Komersial**: Sebagai pemahaman kontrak fungsionalitas sistem back-office manajemen sewa, tata kelola utilitas, promosi Sundul Kost, kepatuhan syarat & ketentuan kemitraan, serta pembagian komisi transaksi mikro mitra.
4. **Pencari dan Penghuni Kost (*Tenants*)**: Sebagai kepastian transparansi informasi denah kamar 2D/3D riil, rincian pembayaran tagihan non-COD via Payment Gateway berlisensi Bank Indonesia (TriPay), dan layanan pesanan mitra lokal sekitar hunian.

## 1.2 Lingkup Masalah
**KostKu** adalah platform ekosistem digital dua sisi (*two-sided marketplace & back-office SaaS*) yang mengintegrasikan pencarian indekos berbasis denah arsitektur akurat, peta geospasial Leaflet real-time, filter modal interaktif, dan estimasi beban utilitas mandiri bagi pencari kost, dengan sistem otomatisasi manajemen operasional harian bagi pemilik kost (pencatatan sewa, penerbitan invoice otomatis, inspeksi kamar, smart lock token, pemantauan kWh listrik/air PDAM, broadcast WhatsApp, pendaftaran multi-properti, serta promosi berbayar Sundul Kost). Platform ini juga memadukan jaringan mitra afiliasi UMKM hyperlocal di sekitar lokasi indekos (seperti penyedia jasa laundry, katering harian, dan air mineral galon) dengan tarif komisi mikro yang adil dan transparan (maksimal Rp 500 per transaksi) serta didukung oleh gerbang pembayaran resmi berlisensi Bank Indonesia (TriPay) dan benteng perlindungan hukum komprehensif (*Legal Shield & Terms of Service*) guna menciptakan ekosistem hunian modern yang terjangkau, efisien, berkepastian hukum, dan bebas manipulasi.

## 1.3 Definisi, Istilah dan Singkatan
* **SKPL**: Spesifikasi Kebutuhan Perangkat Lunak (padanan *Software Requirements Specification* / SRS).
* **KostKu**: Nama resmi sistem perangkat lunak marketplace dan manajemen kos pintar yang dikembangkan.
* **DFD**: *Data Flow Diagram*, diagram pemodelan aliran data berjenjang yang menggambarkan transformasi data oleh proses-proses sistem.
* **ERD**: *Entity Relationship Diagram*, model konseptual data yang menunjukkan entitas, atribut, dan relasi antarentitas dalam sistem.
* **PWA**: *Progressive Web App*, aplikasi web yang memanfaatkan Service Worker dan Web App Manifest sehingga dapat diinstal layaknya aplikasi native pada gawai pintar dan desktop.
* **Capacitor**: Framework runtime cross-platform yang mengompilasi kode web front-end menjadi biner aplikasi mobile native Android (.apk).
* **Electron**: Framework runtime untuk mengemas aplikasi web menjadi aplikasi desktop mandiri (.exe / AppImage).
* **Sundul Kost**: Fitur promosi berbayar mandiri (*boosted listing*) oleh pemilik kos untuk menempatkan propertinya pada peringkat teratas (#1 Pinned Slot) berlabel lencana emas dengan batas waktu aktif hitung mundur (*live countdown*).
* **Mitra Afiliasi**: Pelaku usaha lokal di sekitar lingkungan indekos (warung makan, binatu/laundry, agen galon/gas) yang terhubung ke dashboard penghuni untuk penyediaan kebutuhan harian dengan biaya jasa admin transparan.
* **TriPay**: Mitra gerbang pembayaran (*Payment Gateway*) resmi berlisensi Bank Indonesia (PT Tiga Rambu Unggul) yang memproses pembayaran QRIS Dinamis dan Virtual Account antar-bank secara otomatis dan terenkripsi.
* **QRIS**: *Quick Response Code Indonesian Standard*, standar pembayaran nontunai nasional berbasis QR code yang diterbitkan oleh Bank Indonesia dan ASPI.
* **Cloudflare Turnstile & WhatsApp OTP**: Arsitektur verifikasi identitas dan pertahanan anti-bot non-intrusif berbasis Machine Learning dan sandi sekali pakai ke nomor seluler aktif guna menjamin integritas akun pengguna (1 Nomor WhatsApp = 1 Akun Sah) tanpa menyimpan data kependudukan sensitif.
* **Clickwrap Agreement**: Metode pembentukan kontrak elektronik yang sah secara hukum di mana pengguna wajib secara aktif mencentang kotak persetujuan Syarat & Ketentuan serta Kebijakan Privasi sebelum pendaftaran akun diproses.
* **Legal Shield**: Klausul pembatasan tanggung jawab finansial (maksimal Rp 100.000), hak gugatan rekonvensi (gugat balik), dan pelepasan tanggung jawab fisik atas properti mitra.
* **Token PLN**: Kode 20-digit prabayar yang diisikan ke meteran listrik prabayar kamar kos.
* **Local-First**: Paradigma arsitektur di mana aplikasi mengutamakan pembacaan dan penulisan data ke memori lokal klien terlebih dahulu, sehingga tetap responsif saat koneksi internet lambat atau terputus.

## 1.4 Aturan Penomoran
Dokumen ini menerapkan aturan penomoran sistematis sebagai berikut:
1. Kebutuhan Fungsional: Menggunakan format SKPL-F<nomor>, dimulai dari SKPL-F01 sampai SKPL-F26.
2. Kebutuhan Non-Fungsional: Menggunakan format SKPL-NF<nomor>, dimulai dari SKPL-NF01 sampai SKPL-NF10.
3. Proses DFD: Menggunakan notasi numerik hierarki, seperti Proses 0 (Diagram Konteks), Proses 1.0 s/d Proses 6.0 (DFD Level 1), dan Proses 2.1, Proses 3.1 (DFD Level 2).
4. Data Store: Menggunakan format D<nomor>, dimulai dari D1 sampai D7.
5. Entitas Basis Data: Menggunakan nama entitas PascalCase jamak, misalnya Users, Kosts, Rooms, Invoices, Complaints.

## 1.5 Referensi
1. IEEE Std 830-1998, *IEEE Recommended Practice for Software Requirements Specifications*, IEEE Computer Society.
2. Panduan Penyusunan Dokumen Rekayasa Perangkat Lunak (SKPL & DPPL), Program Studi Teknik Informatika, Fakultas Ilmu Komputer, Universitas Dian Nuswantoro (UDINUS) Semarang.
3. Pressman, R. S. & Maxim, B. R. (2020), *Software Engineering: A Practitioner's Approach*, 9th Edition, McGraw-Hill Education.
4. Somerville, I. (2016), *Software Engineering*, 10th Edition, Pearson Education.
5. Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
6. Undang-Undang Republik Indonesia Nomor 1 Tahun 2024 tentang Perubahan Kedua atas UU ITE.
7. Surat Edaran Menteri Komunikasi dan Informatika Republik Indonesia Nomor 5 Tahun 2016 tentang Batasan Tanggung Jawab Penyedia Platform Internet.
8. Dokumentasi Resmi React 18, Vite 5, Leaflet GIS, Three.js, Express.js, TriPay Payment Gateway API, dan Capacitor Android.

## 1.6 Deskripsi umum Dokumen (Ikhtisar)
Dokumen SKPL ini terbagi menjadi 6 bab utama:
* **Bab 1 - Pendahuluan**: Memaparkan tujuan dokumen, ruang lingkup masalah platform KostKu, definisi istilah, aturan penomoran, serta referensi yang dirujuk.
* **Bab 2 - Deskripsi Umum Perangkat Lunak**: Menjelaskan arsitektur global sistem, pembagian karakteristik dan hak akses aktor pengguna, batasan operasional sistem, serta lingkungan operasi perangkat keras dan perangkat lunak.
* **Bab 3 - Deskripsi Kebutuhan**: Membedah kebutuhan antarmuka eksternal (pengguna, perangkat keras, perangkat lunak, komunikasi), kebutuhan fungsional (Diagram Konteks, DFD Level 1, DFD Level 2, Data Store), kebutuhan data konseptual (ERD), kebutuhan non-fungsional, batasan perancangan, matriks ketertelusuran (*traceability*), serta ringkasan kebutuhan.
* **Bab 4 - Matriks Evolusi & Riwayat Perubahan Fitur**: Menguraikan secara komprehensif seluruh evolusi fitur dari versi awal hingga rilis mutakhir (Revisi A s/d I), membagi secara tegas fitur-fitur yang Ditambahkan, Diubah, dan Dihapus/Dieliminasi.
* **Bab 5 - Reasoning & Justifikasi Ilmiah Penghapusan KTP (Zero-KTP Rationale)**: Membedah 5 pilar pertimbangan ilmiah dan yuridis terkait kepatuhan penuh terhadap UU No. 27/2022 PDP.
* **Bab 6 - Reasoning & Landasan Yuridis Perlindungan Platform & Kemitraan Owner (Legal Shield Rationale)**: Menguraikan dasar hukum pembatasan tanggung jawab platform (*Safe Harbor*), batasan ganti rugi Rp 100.000, hak gugatan rekonvensi, dan klausul khusus kemitraan pemilik kost.

---

# 2 Deskripsi Umum Perangkat Lunak

## 2.1 Deskripsi Umum Sistem
Perangkat lunak KostKu dirancang sebagai sistem monolitik modular berperforma tinggi (*high-throughput low-latency architecture*). Pada sisi front-end, aplikasi memanfaatkan React 18 dengan SPA (*Single Page Application*) yang di-build menggunakan Vite 5, diperkaya dengan engine kanvas 3D Three.js, peta Leaflet GIS, serta modal filter bottom-sheet responsif. Pada sisi back-end, aplikasi ditenagai oleh RESTful API server Express.js yang menangani autentikasi berbasis WhatsApp OTP & Cloudflare Turnstile (Zero-KTP), agregasi multi-properti pemilik, verifikasi pembayaran payment gateway resmi TriPay (Merchant T53542), kalkulasi biaya utilitas, integrasi WhatsApp Gateway, katalog afiliasi lokal, serta penegakan kesepakatan hukum elektronik (*clickwrap agreement*).

Berikut adalah diagram arsitektur konseptual interaksi KostKu dengan dunia luar:

```mermaid
flowchart TD
    subgraph Aktor Eksternal
        PK["Pencari Kos / Calon Penghuni"]
        AK["Anak Kos / Penghuni Aktif"]
        PM["Pemilik Kos (Owner)"]
        ST["Staf / Pengelola Operasional"]
        MT["Mitra Afiliasi Sekitar Kos"]
    end

    subgraph Ekosistem KostKu
        FE["Front-End Multi-Device (Web / PWA / Android / Windows)"]
        BE["KostKu Express Core API & WebSocket Server"]
        EB["React ErrorBoundary & Persistent Data Guarder"]
        DS[("KostKu Data Store (JSON Engine & Cloud Sync)")]
    end

    subgraph Layanan Eksternal
        TPG["TriPay Payment Gateway (QRIS & Virtual Account)"]
        WAG["WhatsApp Notification Service"]
        GIS["Google Maps & OpenStreetMap GIS Tiles"]
        CF["Cloudflare Turnstile Anti-Bot Engine"]
    end

    PK -->|Eksplorasi Denah, Peta GPS, Pengajuan Sewa| FE
    AK -->|Bayar Tagihan, Lapor Komplain, Pesan Mitra| FE
    PM -->|Kelola Kamar, Multi-Kost, Sundul Listing| FE
    ST -->|Input Meteran Air/Listrik, Inspeksi Kamar| FE
    MT -->|Katalog Produk & Disposisi Pesanan| FE

    FE <-->|REST API & Payload Validated HMAC| BE
    FE --- EB
    BE <-->|Query & Transaction Data| DS
    BE <-->|Notifikasi Webhook Signature| TPG
    BE -->|Kirim Bukti Kuitansi & Pengingat Sewa| WAG
    FE -->|Render Peta & Rute Lokasi| GIS
    FE <-->|Verifikasi Token Anti-Bot| CF
```

## 2.2 Karakteristik Pengguna
Karakteristik dan hak akses pengguna dalam ekosistem KostKu diklasifikasikan ke dalam 5 kategori peran (*roles*):

| Kategori Pengguna | Tugas | Hak Akses ke aplikasi |
|---|---|---|
| **Pencari Kos (Tamu / Pengunjung)** | Menjelajahi katalog kos, memfilter kriteria via modal bottom-sheet, melihat denah arsitektur 2D/3D kamar, menghitung simulasi kWh utilitas, melihat lokasi GPS, membaca Syarat & Ketentuan serta Kebijakan Privasi, dan mengirim pengajuan sewa (*booking*). | Akses publik: Halaman Beranda (`/`), Pencarian (`/search`), Detail Kost (`/kost/:id`), Syarat & Ketentuan (`/syarat-ketentuan`), Kebijakan Privasi (`/kebijakan-privasi`), Tentang Kami (`/tentang-kami`), simulasi kalkulator utilitas, registrasi pencari kos. |
| **Penghuni Kos (Anak Kost)** | Membayar tagihan sewa bulanan via Payment Gateway TriPay (QRIS & Virtual Account), melihat token listrik PLN prabayar kamar, memantau kubikasi air, melaporkan komplain kerusakan, melihat status paket di locker, memesan layanan mitra afiliasi sekitar, menghubungi CS WhatsApp, dan mengunduh kuitansi digital. | Akses portal penghuni: Dashboard Penghuni (`/dashboard`), riwayat invoice, formulir tiket komplain, modal pemesanan mitra UMKM, customer service modal, dan kuitansi pembayaran. |
| **Pemilik Kos (Owner)** | Mendaftarkan kos baru via verifikasi kontak resmi WhatsApp/Email, menyetujui S&K Mitra Properti, mengelola multi-properti kos, mengatur unit kamar dan tarif, menyetujui pengajuan sewa, mendaftarkan penghuni offline/walk-in, memonitor kas & laporan keuangan, menyundul iklan kos (Sundul Kost), dan mengonfigurasi skema utilitas. | Akses penuh manajemen: Dashboard Pemilik (`/dashboard`), Manajemen Penghuni (`/penghuni`), Keuangan (`/keuangan`), Tagihan (`/tagihan`), Komplain (`/komplain`), Pengaturan Properti (`/pengaturan`), Inventaris (`/inventaris`), dan Air (`/air`). |
| **Staf / Penjaga Kos** | Membantu operasional harian di lapangan: mencatat meteran fisik air & listrik, mengecek kondisi fasilitas kamar (inspeksi check-in & check-out), menerima paket kurir, dan memvalidasi tiket komplain fisik. | Akses operasional lapangan: Dashboard Staf, form input meteran utilitas, modul inspeksi kamar, dan status penanganan komplain. |
| **Mitra Afiliasi Sekitar** | Menyediakan barang dan jasa kebutuhan harian anak kost (warung makan, laundry, isi ulang galon, gas LPG) dengan lokasi GPS terverifikasi, mematuhi standar higienitas dan SLA antar kamar, serta menerima pesanan dari anak kos. | Akses katalog mitra: Tampil pada modal pemesanan penghuni dan menerima notifikasi pesanan barang/jasa tanpa biaya komisi memberatkan. |

## 2.3 Batasan
Sistem KostKu memiliki sejumlah batasan fungsional dan operasional yang telah disepakati:
1. **Validasi Anti-Bot & Keamanan Akun**: Registrasi akun publik mengandalkan integrasi Cloudflare Turnstile dan verifikasi One-Time Password (OTP) nomor WhatsApp aktif (prinsip 1 Nomor WA 1 Akun). Sistem secara ketat TIDAK menyimpan dokumen fisik KTP atau 16-digit NIK di basis data guna menegakkan prinsip minimalisasi data UU PDP No. 27/2022.
2. **Persetujuan Elektronik Terikat (*Clickwrap Obligation*)**: Pengguna tidak dapat menyelesaikan proses registrasi akun tanpa mencentang persetujuan aktif terhadap Syarat & Ketentuan dan Kebijakan Privasi platform sesuai UU ITE No. 1/2024.
3. **Batasan Pertanggungjawaban Finansial Platform (*Cap of Liability*)**: Nilai ganti rugi maksimal kumulatif yang dapat dituntut kepada KostKu dibatasi maksimal sebesar Rp 100.000 atau senilai biaya layanan yang diterima, dengan hak gugatan rekonvensi (gugat balik) di Pengadilan Negeri Semarang jika terjadi pelanggaran perjanjian oleh pengguna.
4. **Administrasi RT/RW Mandiri Terpadu**: Pemenuhan kewajiban lapor RT/RW (UU No. 23/2006) diselesaikan melalui modul cetak mandiri "Formulir Surat Pengantar Tamu / Buku Tamu RT/RW (PDF)" berbasis data nama dan kontak penyewa, di mana pemeriksaan fisik KTP asli dilakukan secara langsung (offline/on-site) oleh pemilik kos pada saat serah terima kunci kamar tanpa berkas KTP menyentuh server cloud.
5. **Plafon Biaya Komisi Mitra Hyperlocal**: Biaya administrasi/komisi platform untuk pemesanan barang dan jasa mitra lokal dibatasi secara tegas maksimal Rp 500 per transaksi guna melindungi daya beli mahasiswa dan margin UMKM.
6. **Sistem Pembayaran Terlisensi Bank Indonesia**: Pembayaran tagihan sewa diproses melalui Payment Gateway TriPay (PT Tiga Rambu Unggul) berlisensi Bank Indonesia (QRIS Dinamis dan Virtual Account BCA, Mandiri, BRI, BNI) dengan verifikasi otomatis instan.
7. **Kemandirian Multi-Platform**: Aplikasi wajib dapat berjalan mulus pada peramban web modern (Chrome, Firefox, Safari, Edge), dapat diinstal sebagai PWA, serta dapat dikemas sebagai APK Android (via Capacitor) dan executable desktop Windows (via Electron).

## 2.4 Lingkungan Operasi
Sistem KostKu beroperasi pada spesifikasi lingkungan sebagai berikut:
* **Sisi Server (Back-End)**:
  * Sistem Operasi: Linux (Ubuntu 22.04 LTS / Debian 12) atau Serverless Node.js Runtime (Vercel).
  * Web Server / API Runtime: Node.js v18.x - v24.x dengan Express.js v4.22.x.
  * DBMS / Data Store: JSON File Database dengan skema ACID in-memory atomic cache, siap migrasi ke PostgreSQL/MongoDB.
* **Sisi Klien (Front-End & Mobile)**:
  * Web Browser: Google Chrome >= 90, Mozilla Firefox >= 88, Safari >= 14, Microsoft Edge >= 90 (mendukung WebGL, ES6, Web Workers, dan Service Worker).
  * Mobile Android: Android 8.0 (Oreo / API Level 26) ke atas via Capacitor Android WebView engine.
  * Desktop: Windows 10/11 64-bit atau Linux x86_64 via Electron 44.x.

---

# 3 Deskripsi Kebutuhan

## 3.1 Kebutuhan Antarmuka Eksternal

### 3.1.1 Antarmuka pemakai
Antarmuka pengguna (*User Interface*) KostKu dirancang berorientasi pada kemudahan navigasi gawai layar sentuh (*mobile-first*) dan kenyamanan monitor lebar (*desktop widescreen*):
* **Mode Interaksi**: Keyboard, mouse, touchpad, dan layar sentuh multi-touch.
* **Gaya Visual**: *Modern Architectural Blue-Hour Palette* dengan aksen warna Indigo (#2563eb), Slate (#0f172a), dan teks kontras tinggi berstandar aksesibilitas WCAG AA.
* **Komponen Responsif**: Menggunakan Sidebar lipat untuk desktop, Navbar transparan dengan efek kaca (*glassmorphism*), modal filter bottom-sheet responsif, dan *Mobile Bottom Navigation Bar* untuk gawai layar kecil.
* **Kanvas Grafis**: Canvas HTML5 untuk *scrubbing video scroll* berkecepatan 60 FPS dan peta interaktif Leaflet GIS dengan kontrol zoom/pan responsif.

### 3.1.2 Antarmuka Perangkat Keras
Perangkat lunak KostKu tidak memerlukan kartu ekstensi (*hardware cards*) eksklusif, namun mengoptimalkan sensor bawaan pada gawai pengguna:
* **Modul GPS / Geolocation Hardware**: Digunakan untuk membaca koordinat lintang dan bujur pengguna saat mencari kos terdekat.
* **Kamera Ponsel**: Digunakan pemilik kost saat mengambil foto tampak depan kos, foto unit kamar, serta foto meteran utilitas.
* **Layar Sentuh (Touch Digitizer)**: Digunakan penghuni saat membubuhkan tanda tangan digital (*E-Signature*) pada dokumen kontrak sewa elektronik.

### 3.1.3 Antarmuka Perangkat Lunak
KostKu berkomunikasi dengan antarmuka perangkat lunak eksternal berikut:
* **TriPay Payment Gateway API**: Antarmuka gerbang pembayaran berlisensi Bank Indonesia (PT Tiga Rambu Unggul) untuk pembuatan tagihan QRIS Dinamis dan Virtual Account otomatis serta verifikasi webhook signature HMAC-SHA256.
* **Leaflet GIS Engine & OpenStreetMap Tile Server**: Pustaka pemetaan berbasis JavaScript untuk merender layer peta interaktif dan penandaan lokasi kos.
* **Google Maps API Protocol (`https://maps.google.com/?q=lat,lng`)**: Protokol deep-link untuk membuka navigasi rute turn-by-turn dari posisi pengguna ke lokasi kos.
* **Cloudflare Turnstile API**: Protokol verifikasi anti-bot tanpa captcha visual berbasis machine learning.
* **Capacitor Core Bridge**: Menghubungkan antarmuka web dengan API sistem operasi Android (status bar, storage, notifications).
* **Electron IPC**: Mengatur komunikasi proses render dan proses utama pada aplikasi desktop Windows.
* **Nodemailer / SMTP Interface**: Protokol pengiriman email kuitansi digital pembayaran lunas.

### 3.1.4 Antarmuka Komunikasi
* **Protokol Jaringan**: HTTP/1.1 dan HTTP/2 terenkripsi Transport Layer Security (HTTPS/WSS pada port 443).
* **Format Pertukaran Data**: RESTful API menggunakan payload JavaScript Object Notation (JSON) dengan header `Content-Type: application/json`.
* **CORS (Cross-Origin Resource Sharing)**: Dikonfigurasi aman untuk menerima permintaan resmi dari domain web produksi (`https://kostku.riuph.me` dan `https://riuph.me`) serta origin lokal aplikasi mobile/desktop.

## 3.2 Kebutuhan Fungsional
Berikut adalah daftar kebutuhan fungsional perangkat lunak KostKu:

| ID | Kebutuhan | Penjelasan |
|---|---|---|
| **SKPL-F01** | Eksplorasi Katalog & Detail Kos | Sistem harus menampilkan daftar properti kos terverifikasi lengkap dengan foto, alamat, rentang harga, fasilitas utama, rating ulasan, serta indikator status kamar riil (*Siap Huni* atau *Terisi*). |
| **SKPL-F02** | Pencarian & Filter Multi-Kriteria Bottom-Sheet | Sistem harus menyediakan fitur pencarian nama/lokasi serta filter interaktif berbasis modal popup bottom-sheet (tipe kos, rentang harga slider, 16 multi-pilih fasilitas, radius jarak GPS, dan landmark kampus). |
| **SKPL-F03** | Peta Interaktif & Navigasi GPS | Sistem harus menampilkan sebaran properti kos pada peta interaktif Leaflet GIS, mendeteksi lokasi GPS pengguna, menghitung jarak dalam kilometer, dan menyediakan tombol navigasi Google Maps. |
| **SKPL-F04** | Visualisasi Arsitektur & Video Scroll | Sistem harus menampilkan simulasi bangunan kos modern interaktif pada beranda menggunakan kanvas grafis responsive scrubbing. |
| **SKPL-F05** | Simulasi Kalkulator Utilitas Listrik & Air | Sistem harus menyediakan kalkulator interaktif untuk memprediksi estimasi pengeluaran bulanan anak kos berdasarkan skema utilitas (All-in, Token Mandiri, Air Mandiri). |
| **SKPL-F06** | Pengajuan Sewa (*Booking Application*) | Calon penghuni harus dapat memilih nomor unit kamar yang masih berstatus *Siap Huni*, menentukan durasi sewa (1, 3, 6, 12 bulan), menginput data diri, dan mengirimkan aplikasi ke pemilik kos. |
| **SKPL-F07** | Pencegahan Booking Kamar Penuh | Sistem harus secara otomatis memblokir aksi booking (*disabled button*) dan memberikan peringatan jika calon penyewa memilih kamar yang berstatus *Terisi*. |
| **SKPL-F08** | Proteksi Akun & Verifikasi WhatsApp OTP | Sistem harus memvalidasi keaslian pengguna baru menggunakan proteksi Cloudflare Turnstile anti-bot serta verifikasi 6-digit kode OTP melalui WhatsApp resmi sebelum akun dinyatakan aktif (Prinsip 1 Nomor WhatsApp = 1 Akun Sah). |
| **SKPL-F09** | Pemulihan Akun via OTP WhatsApp | Pengguna yang lupa kata sandi dapat memulihkan akun secara mandiri melalui kode token verifikasi 6-digit berbatas waktu 5 menit yang dikirimkan ke nomor WhatsApp terdaftar. |
| **SKPL-F10** | Pendaftaran Penghuni Cepat Tanpa Beban KTP | Pemilik kos harus dapat menambahkan data penghuni yang datang langsung (*walk-in / cash*) secara cepat tanpa kewajiban unggah dokumen fisik KTP. |
| **SKPL-F11** | Sinkronisasi Siklus Okupansi Kamar | Sistem harus secara otomatis mengubah status kamar menjadi *occupied* saat sewa disetujui, dan mengembalikannya ke status *available* saat penghuni dihapus/checkout. |
| **SKPL-F12** | Manajemen Multi-Properti (*Portfolio Switcher*) | Pemilik kos yang memiliki lebih dari satu properti kos harus dapat berpindah (*switch*) konteks properti dengan satu klik tanpa perlu keluar akun (*logout*). |
| **SKPL-F13** | Pembayaran Tagihan via Payment Gateway TriPay Real | Sistem harus mengenerasi tagihan sewa bulanan dan memproses pembayaran non-tunai melalui Payment Gateway berlisensi Bank Indonesia (TriPay) dengan QRIS Dinamis dan Virtual Account (BCA, Mandiri, BRI, BNI) serta deteksi penyelesaian instan (*auto-settlement*). |
| **SKPL-F14** | Penerbitan Kuitansi Digital Otomatis | Sistem harus mengenerasi kuitansi digital resmi (*Digital Receipt*) berpenomoran unik sesaat setelah pembayaran tagihan dinyatakan lunas. |
| **SKPL-F15** | Portal Smart Lock & Token PLN Kamar | Penghuni harus dapat melihat nomor meteran PLN kamar, menyalin nomor meteran untuk pembelian token, serta melihat kode akses pintu pintar (*smart lock*). |
| **SKPL-F16** | Pelaporan & Pelacakan Komplain | Penghuni harus dapat mengirimkan tiket laporan kendala/kerusakan fasilitas kos, dan pemilik kos dapat memperbarui statusnya (*diajukan*, *diproses*, *selesai*). |
| **SKPL-F17** | Manajemen Loker Paket Kurir | Penghuni harus dapat melihat status paket barang kiriman kurir yang telah tiba di loker penerimaan kos beserta kode pembuka loker. |
| **SKPL-F18** | Tanda Tangan Kontrak Elektronik (*E-Sign*) | Sistem harus menyediakan kanvas pembubuhan tanda tangan digital bagi pemilik dan penghuni untuk pengesahan surat perjanjian sewa kos. |
| **SKPL-F19** | Promosi Unggulan Sundul Kost | Pemilik kos harus dapat mengaktifkan fitur promosi berbayar *Sundul Kost* via QRIS untuk menempatkan propertinya pada peringkat teratas (#1 Pinned Slot) dengan lencana emas dan timer hitung mundur. |
| **SKPL-F20** | Ekosistem Mitra Afiliasi Sekitar Kos | Sistem harus menampilkan direktori mitra UMKM terdekat (laundry, warung makan, galon) di portal anak kos dengan rincian harga transparan. |
| **SKPL-F21** | Pembatasan Komisi Mikro Mitra (Maks Rp 500) | Sistem harus membatasi biaya administrasi transaksi pemesanan mitra maksimal Rp 500 per transaksi, dan memisahkan uang pokok 100% langsung untuk mitra. |
| **SKPL-F22** | Konsultasi Langsung In-App Chat | Pencari kos dan pemilik kos harus dapat berkonsultasi langsung melalui antarmuka chat internal tanpa memicu spam tautan WhatsApp eksternal. |
| **SKPL-F23** | Pembukuan Keuangan & Arus Kas | Sistem harus mencatat arus kas masuk (sewa, utilitas) dan arus kas keluar (biaya operasional, perbaikan) serta menyajikan grafik neraca laba-rugi. |
| **SKPL-F24** | Pelindung Error Antarmuka (*ErrorBoundary*) | Sistem harus mencegah terjadinya layar putih kosong (*blank white screen*) dengan menangkap error rendering komponen dan menampilkan kartu pemulihan mandiri. |
| **SKPL-F25** | Kesepakatan Elektronik Terikat (*Clickwrap Agreement*) | Calon pengguna pada formulir pendaftaran wajib secara eksplisit mencentang kotak persetujuan Syarat & Ketentuan serta Kebijakan Privasi dengan tautan aktif yang dapat dibuka sebelum pendaftaran diproses, sesuai Pasal 18 & 20 UU ITE. |
| **SKPL-F26** | Dokumentasi Hukum & Perlindungan Tanggung Jawab Platform | Sistem harus menyediakan halaman statis publik permanen untuk Syarat & Ketentuan Layanan (`/syarat-ketentuan`), Kebijakan Privasi (`/kebijakan-privasi`), dan Tentang Kami (`/tentang-kami`) yang memuat pelepasan tanggung jawab fisik platform, batasan nilai ganti rugi maksimal Rp 100.000, hak gugatan rekonvensi/gugat balik, perlindungan terhadap sengketa Mitra Owner dan UMKM, serta klausul domisili hukum eksklusif di Pengadilan Negeri Semarang. |

---

### 3.2.1 Diagram Konteks
Diagram konteks menggambarkan batasan sistem KostKu dengan entitas-entitas luar yang berinteraksi secara langsung:

```mermaid
flowchart TD
    subgraph Entitas Eksternal
        PK["Pencari Kos"]
        AK["Penghuni Kos"]
        PM["Pemilik Kos"]
        ST["Staf Kos"]
        MT["Mitra Afiliasi"]
        PG["Payment Gateway TriPay (QRIS & VA)"]
        WAG["WhatsApp Gateway"]
    end

    SYS["(0.0)<br>SISTEM PLATFORM TERPADU KOSTKU"]

    PK -->|Data Pencarian, GPS User, Formulir Aplikasi Booking, Persetujuan S&K| SYS
    SYS -->|Daftar Kos, Peta GIS, Rincian Kamar, Status Booking, Dokumen Legalitas| PK

    AK -->|Konfirmasi Bayar, Formulir Komplain, Pesanan Mitra, E-Signature| SYS
    SYS -->|Tagihan Invoice, Token Listrik, Loker Paket, Struk Digital TriPay| AK

    PM -->|Data Kos, Data Kamar, Verifikasi Kontak, Approval Sewa, Sundul Kost, S&K Mitra| SYS
    SYS -->|Notifikasi Pengajuan, Laporan Keuangan, Rekap Komplain, Settlement Dana| PM

    ST -->|Catatan Meteran Air/Listrik, Hasil Inspeksi Kamar| SYS
    SYS -->|Daftar Tugas Harian, Status Kamar| ST

    MT -->|Katalog Produk & Harga Layanan| SYS
    SYS -->|Data Order Penghuni & Penerusan Dana Jasa| MT

    SYS -->|Permintaan Generate QRIS/VA & Verifikasi Pembayaran| PG
    PG -->|Notifikasi Webhook Settlement Transaksi Berhasil| SYS

    SYS -->|Pesan Pengingat Tagihan, OTP & Kuitansi Digital| WAG
```

---

### 3.2.2 DFD Level 1
DFD Level 1 menguraikan sistem KostKu menjadi 6 proses utama yang mengelola aliran data antara entitas eksternal dan data store:

```mermaid
flowchart TD
    PK["Pencari Kos"]
    AK["Penghuni Kos"]
    PM["Pemilik Kos"]
    MT["Mitra Afiliasi"]
    PG["Payment Gateway TriPay"]
    WAG["WhatsApp Gateway"]

    P1["(1.0)<br>Manajemen Autentikasi, Akun & Kepatuhan Legal"]
    P2["(2.0)<br>Eksplorasi Katalog, Modal Filter & Denah Kos"]
    P3["(3.0)<br>Pengajuan & Siklus Sewa Kamar"]
    P4["(4.0)<br>Pembayaran & Transaksi TriPay"]
    P5["(5.0)<br>Operasional & Layanan Penghuni"]
    P6["(6.0)<br>Mitra Afiliasi & Promosi Sundul"]

    D1[("D1: Users")]
    D2[("D2: Kosts")]
    D3[("D3: Applications")]
    D4[("D4: Invoices")]
    D5[("D5: Complaints")]
    D6[("D6: Merchants & Orders")]
    D7[("D7: Activities & Logs")]

    %% P1 Autentikasi & Legal
    PK -->|Registrasi OTP WA, Turnstile & Centang S&K| P1
    PM -->|Registrasi Akun Owner, Verifikasi Kontak| P1
    AK -->|Login & Pemulihan Akun via OTP| P1
    P1 <-->|Read / Write Akun User| D1
    P1 -->|Session Token & Hak Akses| PK
    P1 -->|Session Token & Hak Akses| PM
    P1 -->|Session Token & Hak Akses| AK

    %% P2 Eksplorasi & Filter Modal
    PK -->|Kriteria Modal Filter, Radius GPS & Landmark| P2
    P2 <-->|Read Katalog Properti & Kamar| D2
    P2 -->|Hasil Pencarian & Peta GIS Leaflet| PK

    %% P3 Pengajuan Sewa
    PK -->|Kirim Formulir Booking Kamar| P3
    P3 <-->|Tulis / Update Status Aplikasi| D3
    P3 -->|Validasi Pengajuan Baru| PM
    PM -->|Konfirmasi Approval Sewa| P3
    P3 -->|Update Status Kamar Available/Occupied| D2
    P3 -->|Trigger Invoice Baru| P4

    %% P4 Pembayaran TriPay
    P4 <-->|Tulis Tagihan & Status Lunas| D4
    P4 -->|Request / Status QRIS & VA Dinamis| PG
    PG -->|Callback Webhook Signature Settlement| P4
    P4 -->|Kirim Bukti Pembayaran Digital| WAG
    AK -->|Konfirmasi Pembayaran Tagihan| P4

    %% P5 Operasional & CS
    AK -->|Kirim Laporan Kerusakan / Komplain| P5
    P5 <-->|Tulis / Update Komplain| D5
    P5 -->|Disposisi Komplain ke Pemilik & Staf| PM
    P5 -->|Pemberitahuan Loker & Lock Smart| AK

    %% P6 Mitra & Sundul
    AK -->|Pesan Layanan Laundry/Katering/Galon| P6
    P6 <-->|Tulis Order Mitra (Fee Rp 500)| D6
    P6 -->|Penerusan Order ke Mitra Lokal| MT
    PM -->|Aktivasi Sundul Kost QRIS| P6
    P6 -->|Update Badge Promosi & Timer Pinned #1| D2

    %% Audit Log
    P1 -.->|Catat Log Audit| D7
    P3 -.->|Catat Log Audit| D7
    P4 -.->|Catat Log Audit| D7
    P6 -.->|Catat Log Audit| D7
```

---

#### 3.2.2.1 DFD Level 2 (Manajemen Kamar & Properti)
Proses 2.0 (Manajemen Kamar & Properti) diuraikan lebih rinci untuk menggambarkan bagaimana status kamar, skema utilitas, dan multi-kost dikelola:

```mermaid
flowchart TD
    PM["Pemilik Kos (Owner)"]

    P21["(2.1)<br>Validasi Kepemilikan Multi-Kost"]
    P22["(2.2)<br>Konfigurasi Data Properti & Alamat GPS"]
    P23["(2.3)<br>Pengaturan Kamar & Penetapan Status"]
    P24["(2.4)<br>Sinkronisasi Skema Tarif Utilitas"]

    D1[("D1: Users")]
    D2[("D2: Kosts")]
    D7[("D7: Activities")]

    PM -->|Input ID Pemilik & Switch Properti| P21
    P21 -->|Verifikasi Akses Owner| D1
    D2 -->|Ambil Daftar Kos Milik Owner| P21
    P21 -->|Properti Terpilih Aktif| PM

    PM -->|Update Nama, Alamat, Koordinat Lat/Lng| P22
    P22 -->|Simpan Informasi Properti| D2

    PM -->|Tambah/Edit Unit Kamar & Foto Ruang| P23
    P23 -->|Simpan Unit Kamar & Status Available/Occupied| D2
    P23 -->|Catat Log Aktivitas Kamar| D7

    PM -->|Pilih Skema: All-In / Mandiri Listrik / Mandiri Air| P24
    P24 -->|Simpan Tarif Air & Listrik Properti| D2
```

---

#### 3.2.2.2 DFD Level 2 (Transaksi Sewa, Pembayaran & Mitra Afiliasi)
Proses 4.0 dan 6.0 diuraikan untuk memodelkan proses pembayaran non-COD via TriPay, pemisahan dana, dan komisi mikro mitra:

```mermaid
flowchart TD
    AK["Penghuni Kos"]
    PG["Payment Gateway TriPay"]
    MT["Mitra Afiliasi"]

    P41["(4.1)<br>Generate Tagihan & QRIS/VA Dinamis"]
    P42["(4.2)<br>Pemrosesan Settlement TriPay Webhook"]
    P43["(4.3)<br>Penerbitan Kuitansi Digital Lunas"]

    P61["(6.1)<br>Pemesanan Layanan Mitra Hyperlocal"]
    P62["(6.2)<br>Pemisahan Biaya Pokok & Admin Rp 500"]

    D4[("D4: Invoices")]
    D6[("D6: Merchants & Orders")]

    AK -->|Pilih Menu Makanan / Paket Laundry| P61
    P61 -->|Hitung Subtotal Pesanan| P62
    P62 -->|Teruskan Notifikasi & Alamat Kamar| MT
    P62 -->|Simpan Record Order Mitra| D6
    P62 -->|Tambahkan Admin Fee Maks Rp 500| P41

    D4 -->|Data Invoice Pending| P41
    P41 -->|Tampilkan QRIS & Breakdown Admin| AK

    AK -->|Scan & Bayar QRIS / Transfer VA| PG
    PG -->|Notifikasi Settlement Sukses HMAC| P42
    P42 -->|Update Status Lunas di Database| D4
    P42 -->|Trigger Cetak Struk| P43
    P43 -->|Unduh Kuitansi Digital PDF/Web| AK
```

---

### 3.2.3 Data Store
Sistem KostKu memiliki 7 data store utama yang terstruktur:
1. **D1: Users (`db.users`)**: Menyimpan data akun pengguna (`id: UUIDv4`, nama lengkap, email, nomor HP/WhatsApp, password hash, status verifikasi OTP, role: `owner` | `user` | `staff` | `master`, `kostUid` terkait, kamar terkait, tanggal registrasi, serta status persetujuan `agreedTermsAt`). *Catatan Kepatuhan UU PDP: Seluruh atribut NIK dan foto KTP secara permanen ditiadakan dari basis data.*
2. **D2: Kosts (`db.kosts`)**: Menyimpan profil properti indekos (`uid`, `kostName`, `ownerId`, `address`, koordinat location `{lat, lng}`, images, status verifikasi, `utilityScheme: all_kost | electric_mandiri | water_mandiri | all_mandiri`, settings, data array `rooms` dan status promosi `promoted`).
3. **D3: Applications (`db.applications`)**: Menyimpan riwayat pengajuan sewa (`id`, `kostUid`, `userId`, `userName`, `kamar`, `phone`, `duration`, `checkInDate`, `notes`, `status: pending | approved | rejected`, `date`).
4. **D4: Invoices (`db.invoices`)**: Menyimpan tagihan pembayaran (`id`, `kostUid`, `userId`, `userName`, `kamar`, `basePrice`, `deposit`, `waterCost`, `electricityCost`, `convenienceFee`, `total`, `status: pending | paid | settled`, `paymentMethod: tripay_qris | tripay_va`, `tripayReference`, `receiptNumber`, `paidAt`).
5. **D5: Complaints (`db.complaints`)**: Menyimpan data tiket komplain kendala kos (`id`, `kostUid`, `userId`, `userName`, `kamar`, `category`, `title`, `description`, `photoUrl`, `status: diajukan | diproses | selesai`, `createdAt`, `updatedAt`).
6. **D6: Merchants & Orders (`db.merchants`, `db.partner_orders`)**: Menyimpan profil mitra UMKM (`id`, `name`, `category`, `phone`, `location`, `menu/items`, `rating`) serta transaksi pemesanan penghuni (`orderId`, `tenantId`, `tenantName`, `kamar`, `merchantId`, `merchantName`, `items`, `subtotal`, `adminFee: Rp 500`, `total`, `status`).
7. **D7: Activities & Logs (`db.activities`)**: Menyimpan catatan jejak audit aktivitas sistem (*audit trails*) untuk seluruh tindakan penting per properti kos (`id`, `kostUid`, `type: pengguna | keuangan | pengaturan | komplain`, `text`, `time`).

## 3.3 Kebutuhan Data

### 3.3.1 E-R diagram
Entity-Relationship Diagram (ERD) menggambarkan entitas data, atribut utama, serta derajat relasi (*cardinality*) antarentitas dalam sistem KostKu:

```mermaid
erDiagram
    USERS ||--o{ KOSTS : "memiliki (owner Id)"
    USERS ||--o{ APPLICATIONS : "mengajukan (userId)"
    USERS ||--o{ INVOICES : "membayar (userId)"
    USERS ||--o{ COMPLAINTS : "melaporkan (userId)"
    USERS ||--o{ PARTNER_ORDERS : "memesan (tenantId)"

    KOSTS ||--|{ ROOMS : "memuat unit kamar"
    KOSTS ||--o{ APPLICATIONS : "menerima permohonan"
    KOSTS ||--o{ INVOICES : "menerbitkan tagihan"
    KOSTS ||--o{ COMPLAINTS : "menerima keluhan"
    KOSTS ||--o{ ACTIVITIES : "merekam log aktivitas"
    KOSTS ||--o{ MERCHANTS : "bermitra hyperlocal"

    MERCHANTS ||--o{ PARTNER_ORDERS : "menerima pesanan"

    USERS {
        string id PK
        string name
        string email
        string phone
        string password
        string role "owner / user / staff"
        string kostUid FK
        string kamar
        timestamp agreedTermsAt
    }

    KOSTS {
        string uid PK
        string kostName
        string ownerId FK
        string address
        float lat
        float lng
        string utilityScheme
        boolean isPromoted
    }

    ROOMS {
        string id PK
        string kostUid FK
        string number
        decimal price
        string size
        string status "available / occupied"
        string plnMeterNo
        string pdamMeterNo
    }

    APPLICATIONS {
        string id PK
        string kostUid FK
        string userId FK
        string kamar
        int duration
        string status "pending / approved / rejected"
    }

    INVOICES {
        string id PK
        string kostUid FK
        string userId FK
        string kamar
        decimal basePrice
        decimal convenienceFee
        decimal total
        string paymentMethod "tripay_qris / tripay_va"
        string tripayReference
        string status "pending / paid"
        string receiptNumber
    }

    COMPLAINTS {
        string id PK
        string kostUid FK
        string userId FK
        string kamar
        string title
        string status "diajukan / diproses / selesai"
    }

    MERCHANTS {
        string id PK
        string kostUid FK
        string name
        string category "laundry / katering / galon"
        float lat
        float lng
    }

    PARTNER_ORDERS {
        string id PK
        string merchantId FK
        string tenantId FK
        decimal subtotal
        decimal adminFee "max Rp 500"
        decimal total
        string status
    }

    ACTIVITIES {
        string id PK
        string kostUid FK
        string type
        string text
        timestamp time
    }
```

## 3.4 Kebutuhan Non Fungsional
Uraian kebutuhan non-fungsional perangkat lunak KostKu disusun pada tabel berikut:

| ID | Parameter | Kebutuhan |
|---|---|---|
| **SKPL-NF01** | Availability | Sistem KostKu harus menjamin ketersediaan operasional minimal 99,5% (24 jam per hari, 7 hari per minggu) dengan arsitektur serverless redundan dan fallback in-memory state. |
| **SKPL-NF02** | Reliability | Sistem menerapkan fault-tolerant UI dengan membungkus seluruh rute menggunakan React ErrorBoundary. Kesalahan tak terduga pada satu subkomponen tidak boleh mematikan seluruh aplikasi (*zero blank screen crashes*). |
| **SKPL-NF03** | Ergonomy | Antarmuka pengguna harus intuitif, memenuhi standar ergonomi visual WCAG AA dengan rasio kontras teks minimal 4,5:1 terhadap latar belakang gelap, serta mendukung kontrol layar sentuh dengan ukuran target sentuh (*tap target*) minimal 44×44 piksel dan modal filter bottom-sheet ergonomis. |
| **SKPL-NF04** | Portability | Front-end aplikasi harus dapat dijalankan tanpa modifikasi kode pada Web Browser modern, diinstal sebagai PWA, dikompilasi ke Android APK via Capacitor, dan dibundel ke desktop Windows via Electron. |
| **SKPL-NF05** | Memory | Kapasitas memori runtime front-end pada gawai klien dibatasi maksimal 120 MB RAM untuk memastikan kelancaran eksekusi pada gawai Android berspesifikasi rendah (*low-end device*). |
| **SKPL-NF06** | Response time | Waktu respons pemuatan halaman pertama (*First Contentful Paint*) harus di bawah 1,5 detik pada koneksi 4G, dan waktu respons pemanggilan API backend rata-rata di bawah 250 milidetik. |
| **SKPL-NF07** | Safety | *Not Applicable* (N/A) - Aplikasi tidak mengendalikan instrumen fisik kritis yang berpotensi mencederai keselamatan jiwa manusia. |
| **SKPL-NF08** | Security | Sandi akun wajib terenkripsi hash satu arah (bcrypt). Otentikasi identitas publik diperkuat proteksi Cloudflare Turnstile dan verifikasi WhatsApp OTP. Komunikasi jaringan wajib HTTPS/TLS 1.3, sistem menerapkan arsitektur Zero-PII Storage (bebas KTP/NIK) demi kepatuhan mutlak UU No. 27/2022 (UU PDP), serta kepatuhan penuh regulasi transaksi elektronik UU ITE No. 1/2024 dan SE Menkominfo No. 5/2016. |
| **SKPL-NF09** | Others 1: Bahasa komunikasi | Seluruh label antarmuka, dialog konfirmasi, pesan kesalahan, invoice, syarat & ketentuan, dan komunikasi pengguna harus disajikan dalam Bahasa Indonesia yang baku dan komunikatif. |
| **SKPL-NF10** | Others 2: Identitas Akademik | Dokumentasi SKPL dan halaman rilis sistem wajib mencantumkan identitas resmi Program Studi Teknik Informatika FIK - UDINUS Semarang beserta logo resmi Universitas Dian Nuswantoro. |

## 3.5 Batasan Perancangan
Perancangan dan implementasi perangkat lunak KostKu terikat pada batasan-batasan teknis berikut:
1. **Pustaka Front-End**: Wajib menggunakan ekosistem React 18, React Router v6, Lucide React icons, Leaflet JS, dan Three.js tanpa library komponen CSS pihak ketiga yang bloatware (seperti Bootstrap atau Material UI) demi efisiensi ukuran bundel.
2. **Kesesuaian Kode**: Menghindari elemen HTML usang dan benturan spesifikasi (seperti larangan bersarang elemen `<a>` di dalam elemen `<a>`), sehingga seluruh elemen interaktif tombol wajib menggunakan tag `<button type="button">`.
3. **Penyimpanan Data Terisolasi**: Sisi klien menggunakan penyimpanan `localStorage` terisolasi per sesi pengguna dan `sw.js` Cache Storage berstrategi *Network-First* pada rute navigasi untuk mencegah kebocoran data (*stale cache*).
4. **Kebijakan Moneter & Komisi**: Sistem tidak boleh mengenakan biaya persentase sewa kos yang merugikan margin pemilik kost (0% potongan sewa kos), dan komisi transaksi mitra dibatasi maksimal flat Rp 500 per pesanan.
5. **Kepatuhan Payment Gateway**: Transaksi pembayaran non-COD wajib mengikuti spesifikasi standar integrasi API TriPay berlisensi Bank Indonesia dengan validasi HMAC signature pada callback webhook.

## 3.6 Kerunutan (traceability)

### 3.6.1 Kebutuhan Fungsional vs Proses
Matriks kerunutan berikut memetakan kebutuhan fungsional terhadap proses-proses DFD yang mengeksekusinya:

| ID Kebutuhan Fungsional | Nomor Proses pada DFD | Deskripsi Proses |
|---|---|---|
| SKPL-F01 | Proses 2.0 | Eksplorasi Katalog & Denah Kos |
| SKPL-F02 | Proses 2.0 | Filter Multi-Kriteria Bottom-Sheet Pencarian Kos |
| SKPL-F03 | Proses 2.0 | Render Peta GIS Leaflet & Rute GPS |
| SKPL-F04 | Proses 2.0 | Render Kanvas Animasi 3D & Beranda |
| SKPL-F05 | Proses 2.4 | Kalkulasi Simulasi Utilitas Mandiri |
| SKPL-F06 | Proses 3.0 | Pemrosesan Pengajuan Sewa Kamar |
| SKPL-F07 | Proses 2.3 & 3.0 | Validasi Status Okupansi Kamar Siap Huni |
| SKPL-F08 | Proses 1.0 | Validasi Registrasi Akun Turnstile & OTP Anti-Bot |
| SKPL-F09 | Proses 1.0 | Verifikasi Identitas Pemulihan Akun via OTP |
| SKPL-F10 | Proses 1.0 & 2.3 | Registrasi Penghuni Offline Cepat oleh Pemilik |
| SKPL-F11 | Proses 2.3 & 3.0 | Sinkronisasi Simetris Status Kamar Available/Occupied |
| SKPL-F12 | Proses 2.1 | Pengalihan Multi-Properti (*Portfolio Switcher*) |
| SKPL-F13 | Proses 4.1 & 4.2 | Penerbitan Tagihan & Settlement Payment Gateway TriPay |
| SKPL-F14 | Proses 4.3 | Pembuatan Kuitansi Digital Lunas |
| SKPL-F15 | Proses 5.0 | Penayangan Token Listrik PLN & Kode Akses Kamar |
| SKPL-F16 | Proses 5.0 | Pencatatan & Disposisi Tiket Komplain Kerusakan |
| SKPL-F17 | Proses 5.0 | Pengelolaan Status Loker Paket Kurir |
| SKPL-F18 | Proses 3.0 | Perekaman Tanda Tangan Kontrak Elektronik |
| SKPL-F19 | Proses 6.0 | Manajemen Promosi Berbayar Sundul Kost QRIS |
| SKPL-F20 | Proses 6.1 | Katalog Hyperlocal Mitra Afiliasi UMKM Sekitar |
| SKPL-F21 | Proses 6.2 | Kalkulasi Biaya Pokok & Fee Admin Mitra Rp 500 |
| SKPL-F22 | Proses 5.0 | Pertukaran Pesan Langsung In-App Chat |
| SKPL-F23 | Proses 4.0 | Pembukuan Neraca & Arus Kas Keuangan Kos |
| SKPL-F24 | Proses 1.0 - 6.0 | Penanganan Error Boundary Global Front-End |
| SKPL-F25 | Proses 1.0 | Penegakan Kesepakatan Elektronik Terikat (*Clickwrap Agreement*) |
| SKPL-F26 | Proses 1.0 & 2.0 | Penayangan Dokumen Kepatuhan Hukum & Perlindungan Platform |

### 3.6.2 Data Store vs E-R
Matriks kerunutan berikut memetakan data store pada DFD dengan entitas dan relasi pada Entity Relationship Diagram (ERD):

| Data Store | Entity | Relasi |
|---|---|---|
| D1 | USERS (Data Akun Pengguna) | Berelasi satu-ke-banyak (1:N) dengan KOSTS, APPLICATIONS, INVOICES, COMPLAINTS, dan PARTNER_ORDERS. |
| D2 | KOSTS, ROOMS (Profil Kos & Kamar) | Entitas KOSTS berelasi satu-ke-banyak (1:N) dengan entitas unit ROOMS, serta berelasi dengan INVOICES dan APPLICATIONS. |
| D3 | APPLICATIONS (Pengajuan Sewa) | Menghubungkan entitas USERS (sebagai pemohon) dan KOSTS (sebagai tujuan sewa) dengan kardinalitas N:1. |
| D4 | INVOICES (Tagihan & Pembayaran) | Menghubungkan entitas USERS dan KOSTS untuk mencatat transaksi sewa kamar berstatus pending atau paid. |
| D5 | COMPLAINTS (Komplain & Keluhan) | Menghubungkan entitas USERS dan KOSTS untuk memantau siklus tiket kendala fasilitas indekos. |
| D6 | MERCHANTS, PARTNER_ORDERS (Mitra & Pesanan) | Entitas MERCHANTS berelasi satu-ke-banyak (1:N) dengan PARTNER_ORDERS yang dipesan oleh entitas USERS. |
| D7 | ACTIVITIES (Log Aktivitas Kos) | Mencatat riwayat peristiwa penting yang dimiliki oleh entitas KOSTS (1:N). |

## 3.7 Ringkasan Kebutuhan

### 3.7.1 Kebutuhan Fungsional
Tabel ringkasan kebutuhan fungsional perangkat lunak:

| ID | Deskripsi |
|---|---|
| SKPL-F01 | Penayangan katalog kos dan rincian unit kamar lengkap dengan status okupansi riil. |
| SKPL-F02 | Pencarian cerdas dan pemfilteran multi-kriteria berbasis modal bottom-sheet responsif. |
| SKPL-F03 | Pemetaan GIS interaktif Leaflet dengan deteksi GPS dan deep-link rute Google Maps. |
| SKPL-F04 | Visualisasi kanvas animasi beranda 60 FPS dengan scrubbing interaktif. |
| SKPL-F05 | Kalkulasi simulasi utilitas listrik token PLN dan air PDAM mandiri. |
| SKPL-F06 | Alur pengajuan sewa kamar (*booking*) dengan durasi fleksibel (1 s/d 12 bulan). |
| SKPL-F07 | Proteksi otomatis pemblokiran booking untuk unit kamar yang telah terisi. |
| SKPL-F08 | Proteksi pendaftaran anti-bot berlandaskan Cloudflare Turnstile dan verifikasi OTP WhatsApp resmi. |
| SKPL-F09 | Pemulihan akses akun secara mandiri melalui verifikasi kode OTP WhatsApp. |
| SKPL-F10 | Pendaftaran cepat anak kos offline/tunai oleh pemilik kos tanpa beban upload KTP. |
| SKPL-F11 | Sinkronisasi siklus hidup kamar secara simetris (*available* <-> *occupied*). |
| SKPL-F12 | Pengalihan multi-properti kos (*property switcher*) instan dalam satu akun pemilik. |
| SKPL-F13 | Integrasi pembayaran tagihan nontunai real via Payment Gateway TriPay berlisensi Bank Indonesia (QRIS & Virtual Account). |
| SKPL-F14 | Pembuatan kuitansi digital otomatis berpenomoran unik sesaat setelah lunas. |
| SKPL-F15 | Penayangan nomor meteran PLN kamar, kode pintu pintar, dan pengingat token. |
| SKPL-F16 | Pengelolaan siklus tiket komplain kerusakan fasilitas (*diajukan*, *proses*, *selesai*). |
| SKPL-F17 | Pemantauan paket kiriman kurir di loker penerimaan kos beserta kode buka loker. |
| SKPL-F18 | Pembubuhan tanda tangan elektronik (*E-Signature*) pada dokumen kontrak sewa. |
| SKPL-F19 | Pengaktifan slot promosi berbayar *Sundul Kost* peringkat #1 via QRIS dan timer aktif. |
| SKPL-F20 | Direktori mitra UMKM hyperlocal terdekat di lingkungan indekos (laundry, makanan). |
| SKPL-F21 | Pembatasan biaya komisi administrasi transaksi mitra maksimal Rp 500 per transaksi. |
| SKPL-F22 | Fitur perpesanan langsung internal (*In-App Chat*) antara penyewa dan pemilik kos. |
| SKPL-F23 | Pencatatan buku kas masuk/keluar dan visualisasi grafik laba-rugi keuangan kos. |
| SKPL-F24 | Penanganan kegagalan render antarmuka global menggunakan React Error Boundary. |
| SKPL-F25 | Penegakan kesepakatan elektronik terikat (*Clickwrap Agreement*) pada formulir registrasi pengguna. |
| SKPL-F26 | Penyediaan dokumentasi hukum statis Syarat & Ketentuan, Kebijakan Privasi, dan perlindungan hukum platform (*Legal Shield*). |

### 3.7.2 Kebutuhan Non Fungsional
Tabel ringkasan kebutuhan non-fungsional perangkat lunak:

| ID | Deskripsi |
|---|---|
| SKPL-NF01 | Ketersediaan sistem operasional mencapai 99,5% (24/7). |
| SKPL-NF02 | Keandalan sistem berbasis *zero blank screen crash* dengan Error Boundary. |
| SKPL-NF03 | Standar ergonomi antarmuka visual WCAG AA (kontras >= 4,5:1, target sentuh >= 44px, bottom-sheet modal). |
| SKPL-NF04 | Portabilitas multi-platform (Web PWA, Android APK, Desktop Windows EXE). |
| SKPL-NF05 | Batasan konsumsi memori front-end di bawah 120 MB RAM pada gawai klien. |
| SKPL-NF06 | Kecepatan respons FCP di bawah 1,5 detik dan API response time di bawah 250 ms. |
| SKPL-NF07 | Parameter keselamatan fisik manusia dinyatakan *Not Applicable* (N/A). |
| SKPL-NF08 | Keamanan transmisi terenkripsi TLS 1.3, sandi ter-hash, kepatuhan penuh UU PDP No. 27/2022 (Zero-KTP Storage), dan UU ITE No. 1/2024. |
| SKPL-NF09 | Seluruh bahasa komunikasi antarmuka dan sistem wajib berbahasa Indonesia. |
| SKPL-NF10 | Dokumentasi dan atribut rilis wajib menyertakan identitas akademik resmi FIK UDINUS. |

---

# 4 Matriks Evolusi & Riwayat Perubahan Fitur (Ditambah, Diubah, Dihapus)

Bagian ini mendokumentasikan secara lengkap riwayat metamorfosis platform KostKu dari versi inisiasi (V1.0) hingga arsitektur produksi mutakhir (Revisi A s/d I). Seluruh modifikasi dikelompokkan ke dalam tiga kategori utama: **Fitur yang Ditambahkan**, **Fitur yang Diubah / Dimodifikasi**, dan **Fitur yang Dihapus / Dieliminasi**.

```mermaid
timeline
    title Kronologi Evolusi Platform KostKu (Revisi A - I)
    Revisi A (Inisiasi) : Manajemen Kamar Dasar : Buku Kas Manual
    Revisi B (Utilitas) : Skema Token PLN Mandiri : Meteran Air PDAM : Broadcast WA
    Revisi C (Multi-Platform) : PWA & Android APK : Electron Desktop : Smart Lock : E-Sign
    Revisi D (Visual Marketplace) : 3D Three.js : Video Scroll Canvas : Leaflet GIS Map
    Revisi E (Keamanan Identitas) : Multi-Kost Switcher : Verifikasi NIK Anti-Bot : KTP Recovery
    Revisi F (Monetisasi Real) : Sundul Kost QRIS #1 : In-App Chat : Eliminasi Fake Payment
    Revisi G (Ekosistem Mitra & Hardening) : Mitra Hyperlocal Fee Rp 500 : Simetri Kamar : React ErrorBoundary
    Revisi H (Privacy-First Zero-KTP) : Hapus Data KTP : Cloudflare Turnstile : WhatsApp OTP
    Revisi I (TriPay & Legal Shield) : TriPay Gateway Resmi : S&K Cap 100rb & Rekonvensi : Clickwrap : Filter Modal
```

---

## 4.1 Fitur yang Ditambahkan (Added Features)

Daftar kapabilitas dan modul baru yang dirancang serta diimplementasikan ke dalam sistem:

1. **Mesin Tiga Dimensi & Kanvas Animasi Beranda (Three.js WebGL & Canvas Scrubbing)**
   * *Latar Belakang & Rationale*: Foto sudut lebar 2D konvensional sering memanipulasi persepsi calon penyewa. Kanvas interaktif dan visualisasi 3D memberikan gambaran spasial yang jujur dan imersif.
   * *Implementasi Teknis*: Memanfaatkan pustaka `@react-three/fiber` dan kanvas rendering 60 FPS di `src/pages/Home.jsx` serta `src/components/3d/KostScene.jsx`.
   * *Rilis Milestone*: Revisi D.

2. **Kompilasi Multi-Platform Mandiri (PWA, Capacitor Android, & Electron Desktop)**
   * *Latar Belakang & Rationale*: Pemilik kos sering menggunakan laptop/komputer kasir, sedangkan anak kos dominan menggunakan smartphone Android.
   * *Implementasi Teknis*: Konfigurasi `public/sw.js` (PWA Cache Network-First), `@capacitor/android` untuk menghasilkan berkas biner `KostKu-Android.apk`, serta `electron-builder` untuk menghasilkan installer `KostKu-Windows.exe`.
   * *Rilis Milestone*: Revisi C.

3. **Proteksi Identitas Anti-Bot Modern (Cloudflare Turnstile & WhatsApp OTP) & Self-Recovery**
   * *Latar Belakang & Rationale*: Mencegah perambahan akun spam, bot pencari kos palsu, dan penipuan listing kos bodong tanpa mengumpulkan dokumen kependudukan sensitif.
   * *Implementasi Teknis*: Integrasi API Cloudflare Turnstile untuk deteksi bot tak kasat mata dan verifikasi 6-digit OTP kriptografis pada `backend/server.js`, serta formulir pemulihan akun berbasis kode verifikasi WhatsApp pada `src/components/AccountRecoveryModal.jsx`.
   * *Rilis Milestone*: Revisi E (Dimutakhirkan ke Zero-KTP pada Revisi H).

4. **Pengalih Properti Multi-Kost (*Multi-Property Portfolio Switcher*)**
   * *Latar Belakang & Rationale*: Banyak pengusaha kos memiliki 2 hingga 5 cabang kos di berbagai lokasi yang sebelumnya merepotkan jika harus logout-login berulang.
   * *Implementasi Teknis*: Penambahan endpoint `/api/owner/kosts` dan komponen `src/components/PropertySwitcher.jsx` yang memungkinkan pergantian konteks kos aktif secara instan pada state global.
   * *Rilis Milestone*: Revisi E.

5. **Skema Utilitas 3-Jalur & Pemantau Meteran Listrik/Air per Kamar**
   * *Latar Belakang & Rationale*: Ketidakadilan pembagian biaya utilitas di kos konvensional (anak kos hemat subsidi anak kos boros AC).
   * *Implementasi Teknis*: Konfigurasi 3 opsi kebijakan sewa (`all_kost`, `electric_mandiri`, `water_mandiri`, `all_mandiri`), penyimpanan nomor meteran PLN dan PDAM per unit kamar, serta integrasi simulasi kWh utilitas pada `src/components/KwhUtilityCalculatorModal.jsx`.
   * *Rilis Milestone*: Revisi B.

6. **Promosi Listing Teratas Berbayar (*Sundul Kost Boost System*)**
   * *Latar Belakang & Rationale*: Pemilik kos membutuhkan instrumen promosi instan saat kamar kosnya mengalami kekosongan (*vacancy*), tanpa harus berlangganan iklan bulanan yang mahal.
   * *Implementasi Teknis*: Pilihan durasi sundul (3 hari, 7 hari, 30 hari), pembayaran instan via QRIS, pemosisian otomatis pada slot #1 di beranda dan halaman pencarian dengan lencana emas (*Golden Badge*), serta penghitung waktu mundur kedaluwarsa (*live expiration timer*).
   * *Rilis Milestone*: Revisi F.

7. **Ekosistem Mitra Afiliasi Hyperlocal dengan Batas Komisi Flat Rp 500**
   * *Latar Belakang & Rationale*: Menghubungkan anak kos dengan warung makan, binatu (laundry), dan toko galon sekitar tanpa membebani biaya aplikasi tinggi.
   * *Implementasi Teknis*: Komponen `src/components/PartnerOrderModal.jsx` dan endpoint `backend/server.js:2312` (`/api/partner-orders`) dengan visualisasi transparansi pembagian dana (100% biaya pokok diserahkan ke mitra, fee admin platform maksimal hanya Rp 500).
   * *Rilis Milestone*: Revisi G.

8. **Perpesanan Langsung Antara Tamu & Pemilik (*In-App Direct Chat*)**
   * *Latar Belakang & Rationale*: Menghilangkan ketergantungan pada tautan eksternal WhatsApp yang rentan disalahgunakan sebagai sarana penipuan atau spam nomor pribadi.
   * *Implementasi Teknis*: Modul dialog pesan internal `src/components/InAppChatModal.jsx` yang menyimpan percakapan tanya jawab unit kamar langsung di database sistem.
   * *Rilis Milestone*: Revisi F.

9. **Pelindung Kegagalan Antarmuka (*React Error Boundary Component*)**
   * *Latar Belakang & Rationale*: Menjamin keandalan tingkat tinggi (*zero blank-screen crash*) ketika terjadi anomali runtime pada salah satu komponen anak.
   * *Implementasi Teknis*: Komponen `src/components/ErrorBoundary.jsx` yang membungkus seluruh rute pada `src/App.jsx` lengkap dengan antarmuka pemulihan diri (*self-recovery UI*).
   * *Rilis Milestone*: Revisi G.

10. **Gerbang Pembayaran Resmi Berlisensi Bank Indonesia (TriPay Payment Gateway Merchant T53542)**
    * *Latar Belakang & Rationale*: Memenuhi regulasi sistem pembayaran nasional Bank Indonesia dan memastikan verifikasi mutasi dana sewa berlangsung otomatis tanpa resiko kuitansi palsu.
    * *Implementasi Teknis*: Integrasi API TriPay (PT Tiga Rambu Unggul) pada `src/components/PaymentGatewayModal.jsx` dan endpoint backend callback dengan verifikasi signature HMAC-SHA256, mendukung QRIS Dinamis dan Virtual Account multi-bank (BCA, Mandiri, BRI, BNI).
    * *Rilis Milestone*: Revisi I.

11. **Benteng Perlindungan Hukum Platform & Dokumen Kepatuhan Statis (Legal Shield & Terms of Service)**
    * *Latar Belakang & Rationale*: Melindungi pengembang dan platform dari tuntutan hukum perdata/pidana akibat sengketa properti, musibah fisik, kehilangan barang, atau kelalaian Mitra Owner dan Mitra UMKM.
    * *Implementasi Teknis*: Halaman statis `src/pages/SyaratKetentuan.jsx`, `src/pages/KebijakanPrivasi.jsx`, dan `src/pages/TentangKami.jsx` yang memuat klausul Safe Harbor (SE Menkominfo No. 5/2016), batasan ganti rugi maksimal Rp 100.000 (Pasal 3), hak gugatan rekonvensi/gugat balik di PN Semarang (Pasal 3.3 & Pasal 11), ketentuan khusus Mitra Owner (Pasal 6), dan ketentuan khusus Mitra UMKM (Pasal 7).
    * *Rilis Milestone*: Revisi I.

12. **Persetujuan Elektronik Terikat (*Clickwrap Agreement Checkbox*)**
    * *Latar Belakang & Rationale*: Mengikat calon pengguna secara hukum positif sebelum mengakses platform, sesuai ketentuan Pasal 18 & 20 UU ITE dan Pasal 1338 KUHPerdata.
    * *Implementasi Teknis*: State `agreedTerms` dan checkbox persetujuan wajib yang menonaktifkan tombol submit pendaftaran pada `src/pages/Register.jsx` sebelum kotak persetujuan S&K dan Kebijakan Privasi dicentang oleh pendaftar.
    * *Rilis Milestone*: Revisi I.

13. **Antarmuka Modal Filter Pencarian Responsif (*Mobile Bottom-Sheet Filter*)**
    * *Latar Belakang & Rationale*: Menghilangkan penumpukan chip filter inline di halaman pencarian yang mengaburkan kartu listing kos pada gawai berlayar sentuh kecil.
    * *Implementasi Teknis*: Komponen `src/components/KostFilterModal.jsx` dengan modal popup/bottom-sheet interaktif, filter radius GPS, slider rentang harga, dan pemilih 16 fasilitas kamar terpadu pada `src/pages/SearchKost.jsx`.
    * *Rilis Milestone*: Revisi I.

14. **Pusat Bantuan Pelanggan Terpadu & FAQ Interaktif (Customer Service Support)**
    * *Latar Belakang & Rationale*: Memberikan kanal klarifikasi cepat bagi pencari kos dan pemilik kos tanpa kebingungan mencari kontak pengembang.
    * *Implementasi Teknis*: Komponen `src/components/CustomerServiceModal.jsx` yang memuat FAQ interaktif serta integrasi direct-chat WhatsApp Customer Service resmi (`081228263200`).
    * *Rilis Milestone*: Revisi I.

---

## 4.2 Fitur yang Diubah / Dimodifikasi (Modified Features)

Penyesuaian, perbaikan logika bisnis, dan refactoring arsitektur dari fitur yang sudah ada sebelumnya:

1. **Struktur Komisi & Biaya Monetisasi (Dari Persentase Tinggi ke Mikro Flat Rp 500 & Rp 1.500)**
   * *Kondisi Sebelumnya*: Model bisnis komisi persentase sewa kamar (5% - 15%) ala OTA/marketplace komersial yang diprotes pemilik kos karena memotong margin dan memicu transaksi bypass gelap di luar sistem.
   * *Perubahan yang Diterapkan*: Menghapus komisi booking sewa kos menjadi 0% (sewa pokok 100% utuh untuk pemilik kos). Monetisasi dialihkan ke biaya kenyamanan wajar (*convenience fee*) senilai Rp 1.500 saat checkout pembayaran tagihan serta biaya admin mikro flat maksimal Rp 500 pada pemesanan mitra UMKM.
   * *Rilis Milestone*: Dimodifikasi pada Revisi F dan Revisi G.

2. **Mekanisme Pembayaran (Dari Simulasi Fiktif Menjadi Transaksi TriPay Real)**
   * *Kondisi Sebelumnya*: Tombol bayar pada portal penghuni menggunakan simulasi saldo fiktif dan popup alert keberhasilan instan tanpa adanya mutasi dana yang dapat diverifikasi.
   * *Perubahan yang Diterapkan*: Mengintegrasikan alur pembayaran non-COD Payment Gateway TriPay real (`src/components/PaymentGatewayModal.jsx`). Penghuni disajikan QRIS Dinamis dan nomor Virtual Account berlisensi, mutasi diverifikasi otomatis melalui webhook callback, status tagihan beralih menjadi lunas (*settlement*), dan kuitansi digital resmi diterbitkan dengan nomor seri unik.
   * *Rilis Milestone*: Dimodifikasi pada Revisi F dan dimutakhirkan ke TriPay pada Revisi I.

3. **Sinkronisasi Siklus Hidup Okupansi Kamar (Siklus Simetris Terisi <-> Tersedia)**
   * *Kondisi Sebelumnya*: Pada `backend/server.js`, saat pengajuan sewa disetujui, hanya data `kost.settings.rooms` yang diperbarui tetapi `kost.rooms` (untuk publik) tidak tersinkron. Selain itu, saat pemilik menghapus penghuni via `DELETE /api/users/:id`, kamar tersebut tetap tertinggal berstatus `occupied` selamanya. Di sisi front-end (`KostDetail.jsx`), kamar berstatus terisi tetap menampilkan label hijau "Siap Huni".
   * *Perubahan yang Diterapkan*: Menyinkronkan pembaruan status kamar pada kedua array secara paralel. Saat penghuni disetujui, unit kamar menjadi `occupied`. Saat penghuni dihapus, status unit kamar otomatis dikembalikan menjadi `available`. Pada `KostDetail.jsx`, kamar terisi menampilkan lencana merah "Terisi" dan tombol sewa dinonaktifkan (*disabled*).
   * *Rilis Milestone*: Dimodifikasi pada Revisi G.

4. **Eliminasi Penimbunan KTP & Fleksibilitas Pendaftaran Penghuni Offline**
   * *Kondisi Sebelumnya*: Endpoint registrasi awal sempat bereksperimen dengan validasi NIK 16 digit dan foto KTP kaku yang menimbulkan kerentanan hukum UU PDP No. 27/2022, ancaman denda 2% omzet, resistensi calon penyewa, serta memblokir pendaftaran penghuni tunai (walk-in) pemilik kos.
   * *Perubahan yang Diterapkan*: Menghapus total atribut NIK dan unggahan KTP dari seluruh alur pendaftaran. Proteksi dialihkan ke WhatsApp OTP dan Cloudflare Turnstile, serta pendaftaran penghuni tunai di dashboard kasir pemilik kos dapat dilakukan instan cukup dengan nama dan nomor kontak.
   * *Rilis Milestone*: Dimodifikasi pada Revisi G dan dituntaskan pada Revisi H.

5. **Elemen Navigasi Rute Peta (Pembersihan Validasi DOM Nesting)**
   * *Kondisi Sebelumnya*: Komponen `KostCard` dibungkus tag `<Link>` (elemen `<a>`), dan di dalamnya terdapat tag `<a href="gmaps...">` untuk rute Google Maps. Hal ini melanggar spesifikasi HTML5 dan memicu warning React `validateDOMNesting: <a> cannot appear as a descendant of <a>`, serta menyebabkan benturan klik ganda pada smartphone.
   * *Perubahan yang Diterapkan*: Mengganti elemen rute menjadi `<button type="button">` yang mengisolasi event navigasi dengan `e.stopPropagation()` dan `window.open(url, '_blank')`.
   * *Rilis Milestone*: Dimodifikasi pada Revisi G.

6. **Engine Peta Geospasial (Dari SVG Sintetis ke Leaflet GIS Nyata)**
   * *Kondisi Sebelumnya*: Tampilan peta pada versi awal menggunakan ilustrasi vektor SVG statis tanpa koordinat nyata.
   * *Perubahan yang Diterapkan*: Mengganti total dengan peta GIS dinamis Leaflet (`src/components/InteractiveMarketplaceMap.jsx`), menggunakan koordinat GPS lintang/bujur riil di Indonesia, clustering penanda kos, serta popover ringkasan harga sewa.
   * *Rilis Milestone*: Dimodifikasi pada Revisi D.

7. **Mekanisme Filter Pencarian (Dari Inline Chips Panjang ke Modal Bottom-Sheet Terpadu)**
   * *Kondisi Sebelumnya*: Filter fasilitas dan tipe kost di halaman pencarian (`SearchKost.jsx`) dirender langsung secara inline sebagai puluhan deretan tombol chips yang memakan 60% ruang vertikal layar ponsel.
   * *Perubahan yang Diterapkan*: Merekreasi filter menjadi tombol pemicu ringkas `[ 🎛️ Filter (N) ]` yang membuka modal dialog / bottom sheet responsif (`KostFilterModal.jsx`) dengan slider jarak radius GPS, filter harga, dan 16 kategori fasilitas terorganisir rapi.
   * *Rilis Milestone*: Dimodifikasi pada Revisi I.

8. **Identitas Visual & Branding Logo (Dari Variasi Logo Heterogen ke Standarisasi Logo Resmi "K")**
   * *Kondisi Sebelumnya*: Penggunaan aset logo di berbagai halaman sempat tidak seragam (perbedaan logo header dengan logo favicon), memicu penolakan review identitas merchant dari pihak Payment Gateway TriPay.
   * *Perubahan yang Diterapkan*: Menstandarisasi logo resmi tunggal berupa logo squircle modern dengan gradasi biru royal dan huruf "K" putih tajam resolusi tinggi (512×512) di seluruh aset `public/logo.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.png`, navbar, login, footer, dan profil merchant TriPay.
   * *Rilis Milestone*: Dimodifikasi pada Revisi I.

---

## 4.3 Fitur yang Dihapus / Dieliminasi (Removed Features)

Fitur dan komponen yang dinilai tidak efektif, menurunkan performa, atau memicu distorsi pengalaman pengguna sehingga diputuskan untuk dihapus secara permanen dari sistem:

1. **Tur Virtual 360 Derajat Panorama (*Virtual Tour 360*)**
   * *Alasan Penghapusan*: Pengujian lapangan membuktikan foto panorama 360 derajat menghasilkan distorsi kelengkungan lensa (*fisheye effect*) yang membuat ruangan kos sempit tampak luas secara tidak wajar. Hal ini memicu kekecewaan (*reality gap*) bagi pencari kos saat survei fisik. Selain itu, aset panorama 360 berukuran sangat berat (>30 MB) yang membebani kuota data mahasiswa.
   * *Alternatif Pengganti*: Digantikan oleh foto resolusi tinggi sudut normal yang jujur serta gambar denah arsitektur 2D berskala riil 1:50.
   * *Rilis Milestone Dihapus*: Dieliminasi pada Revisi D (Commit `f17215f`).

2. **Iklan Pop-up & Banner Pihak Ketiga (*Intrusive Display Ads*)**
   * *Alasan Penghapusan*: Eksperimen monetisasi awal sempat mempertimbangkan integrasi iklan Google AdSense / banner pihak ketiga. Namun, dewan evaluasi produk memutuskan iklan pop-up merusak reputasi aplikasi, mengganggu kenyamanan pemilik kos saat mengelola pembukuan, dan mengaburkan estetika antarmuka.
   * *Alternatif Pengganti*: Digantikan sepenuhnya oleh model monetisasi non-invasif: promosi Sundul Kost mandiri oleh pemilik dan direktori native mitra UMKM hyperlocal sekitar kos.
   * *Rilis Milestone Dihapus*: Dieliminasi pada Revisi F.

3. **Simulasi Booking & Checkout Fiktif (*Mockup Payment Simulator*)**
   * *Alasan Penghapusan*: Tombol konfirmasi sewa lama yang hanya memunculkan dialog pura-pura berhasil dinilai menyesatkan dan tidak siap untuk operasional dunia nyata (*production-unready*).
   * *Alternatif Pengganti*: Digantikan oleh alur verifikasi transaksi Payment Gateway TriPay real berlisensi Bank Indonesia dengan nomor kuitansi digital unik dan penyimpanan riwayat transaksi ke data store.
   * *Rilis Milestone Dihapus*: Dieliminasi pada Revisi F dan disempurnakan pada Revisi I.

4. **Skema Komisi Booking Persentase Tinggi (10% - 20%)**
   * *Alasan Penghapusan*: Kebijakan komisi persentase sewa kos warisan platform konvensional ditolak mentah-mentah oleh komunitas pemilik kos di Semarang dan kota-kota universitas lainnya karena memotong laba bersih kos secara sepihak.
   * *Alternatif Pengganti*: Dihapus total menjadi 0% komisi booking kamar kos seumur hidup bagi pemilik kos.
   * *Rilis Milestone Dihapus*: Dieliminasi pada Revisi F dan G.

5. **Penyimpanan Foto KTP & Input NIK 16-Digit**
   * *Alasan Penghapusan*: Analisis regulasi mendalam terhadap UU No. 27 Tahun 2022 (UU PDP) membuktikan bahwa penyimpanan foto KTP dan NIK pada sistem berbasis cloud menimbulkan risiko hukum yang tidak proporsional bagi pengembang dan pemilik kos (ancaman denda administratif hingga 2% omzet per tahun serta kewajiban sertifikasi audit ISO 27001). Selain itu, kewajiban upload KTP menciptakan resistensi calon penyewa (*drop-off rate* tinggi) dan tidak efektif menyaring bot cerdas.
   * *Alternatif Pengganti*: Digantikan sepenuhnya oleh verifikasi One-Time Password (OTP) WhatsApp resmi dan Cloudflare Turnstile untuk proteksi anti-bot, serta pencetakan lembar pengantar RT/RW digital untuk verifikasi fisik langsung (*on-site*) saat serah terima kunci.
   * *Rilis Milestone Dihapus*: Dieliminasi pada Revisi H.

---

# 5 Reasoning & Justifikasi Ilmiah Penghapusan KTP (Zero-KTP Rationale)

Keputusan dewan arsitektur sistem KostKu untuk menghapus secara permanen penyimpanan foto KTP dan NIK dari infrastruktur cloud didasarkan pada 5 pilar pertimbangan multidisipliner:

## 5.1 Aspek Kepatuhan Hukum & Yuridis (UU PDP No. 27 Tahun 2022)
1. **Prinsip Minimalisasi Data (Pasal 16 UU PDP)**: Pengendali data pribadi wajib membatasi pengumpulan data hanya pada data yang benar-benar esensial. KostKu adalah platform direktori dan perantara sewa, bukan lembaga keuangan yang diwajibkan e-KYC oleh regulasi perbankan. Menimbun KTP tanpa kewajiban hukum adalah pelanggaran asas proporsionalitas.
2. **Mitigasi Sanksi Denda Administratif 2% Omzet (Pasal 57 UU PDP)**: Jika terjadi kebocoran basis data KTP, sanksi administratif mencapai 2% dari total pendapatan tahunan usaha. Bagi startup atau bisnis mikro, ancaman ini merupakan risiko fatal yang tidak sebanding dengan manfaat fungsionalnya.
3. **Kewajiban Notifikasi Kebocoran 3x24 Jam (Pasal 46 UU PDP)**: Insiden peretasan mewajibkan pemberitahuan resmi terbuka ke otoritas PDP dan seluruh pemilik data dalam waktu maksimal 72 jam, yang memicu kehancuran reputasi dan tuntutan pidana.

## 5.2 Aspek Rekayasa Keamanan Siber (Defensive Engineering)
1. **Meniadakan Target "Honeypot"**: Server yang menyimpan berkas identitas negara adalah sasaran utama peretas (*data brokers*). Dengan meniadakan data KTP, KostKu mengadopsi postur *Zero-Value Data Store*—tidak ada data sensitif yang dapat dicuri.
2. **Enkripsi Tidak Menghapus Tanggung Jawab Hukum**: Sekalipun sistem menggunakan enkripsi AES-256 dan TLS 1.3, di hadapan audit hukum UU PDP, pengembang tetap memikul tanggung jawab penuh jika terjadi insiden kompromi kredensial atau *internal breach*.
3. **Beban Kepatuhan ISO 27001**: Pengelolaan data kependudukan skala nasional mewajibkan sertifikasi keamanan informasi tingkat enterprise yang sangat membebani biaya operasional UMKM.

## 5.3 Aspek Efektivitas Teknis: Mengapa KTP Gagal Menyaring Bot
Riset membuktikan bahwa mewajibkan upload KTP sama sekali tidak efektif memblokir bot canggih. Pelaku kejahatan siber memiliki akses ke jutaan data KTP hasil kebocoran publik di internet yang dapat diunggah secara terprogram via API dalam hitungan milidetik.

Sebagai gantinya, KostKu menerapkan:
* **Cloudflare Turnstile**: Memeriksa telemetri interaksi pengguna berbasis machine learning di balik layar (*invisible challenge*), 100% memblokir otomasi skrip bot tanpa tebak-tebakan gambar.
* **WhatsApp OTP (1 Nomor HP = 1 Akun)**: Bot tidak memiliki akses murah terhadap nomor kartu SIM WhatsApp aktif Indonesia. Verifikasi 6-digit OTP membuktikan kepemilikan manusia riil dengan biaya mendekati nol.

## 5.4 Aspek Psikologi Pengguna & Konversi Bisnis (UX & Funnel)
1. **Menghilangkan Ketakutan Pinjol Ilegal**: Calon mahasiswa perantau di era digital sangat sensitif jika dimintai foto KTP di website yang baru pertama kali dibuka. Menghapus syarat KTP melenyapkan keraguan calon penyewa dan melesatkan rasio konversi booking hingga di atas 94%.
2. **Karakteristik Pemilik Kos Indonesia**: Pemilik kos cenderung mencari celah mengalihkan kesalahan ke pengembang jika terjadi sengketa kamar. Dengan tidak memegang KTP di server, pengembang platform terbebas dari sengketa perdata antara anak kos dan pemilik kos.

## 5.5 Aspek Harmonisasi Regulasi RT/RW (UU No. 23/2006) & PSE Komdigi
1. **Verifikasi Fisik Langsung di Lapangan (*On-Site Physical Inspection*)**: Kewajiban lapor RT/RW adalah tanggung jawab pemilik kos saat serah terima kunci. Sistem KostKu membantu dengan mencetak Buku Tamu / Surat Pengantar RT/RW (PDF) secara otomatis, lalu pemilik kos memeriksa fisik KTP asli penyewa di tempat tanpa berkas KTP tersebut harus disimpan di server internet.
2. **Persetujuan Kilat PSE Komdigi**: Di sistem Kementerian Komunikasi dan Digital, pengajuan Tanda Daftar PSE Lingkup Privat yang tidak mencentang data kependudukan/KTP disetujui secara instan tanpa persyaratan audit regulasi sektoral.

---

# 6 Reasoning & Landasan Yuridis Perlindungan Platform & Kemitraan Owner (Legal Shield Rationale)

Perkembangan mutakhir pada **Revisi I (25 Oktober 2026)** melengkapi platform KostKu dengan kerangka perlindungan hukum komprehensif guna memastikan platform tidak menjadi sasaran tuntutan balik (*zero backfire*) dari pihak pengguna maupun pemilik properti:

## 6.1 Kedudukan Hukum Intermediary Platform & Safe Harbor (SE Menkominfo No. 5/2016)
Berdasarkan Surat Edaran Menteri Komunikasi dan Informatika No. 5 Tahun 2016, KostKu berkedudukan murni sebagai **Penyedia Platform Teknologi dan Sarana Temu-Kembali Informasi Digital (*Intermediary Platform*)**. Hubungan hukum perjanjian sewa-menyewa fisik terjadi secara langsung dan eksklusif antara Pemilik Kos dan Penyewa. KostKu bukan pemilik gedung, bukan agen real estat, bukan penjamin kelaikan fisik bangunan, dan bukan pihak yang menanggung risiko fisik di lokasi hunian.

## 6.2 Prinsip Pembatasan Ganti Rugi Finansial Maksimal (Cap of Liability Rp 100.000)
Dalam praktik kontrak komersial internasional dan nasional (*limitation of liability clause*), penyedia platform berhak membatasi nilai risiko finansial maksimal. Pada Pasal 3 Syarat & Ketentuan KostKu, tanggung jawab ganti rugi platform dibatasi maksimal senilai komisi layanan yang diterima atau maksimal **Rp 100.000 (Seratus Ribu Rupiah)**, mana yang lebih rendah. Klausul ini menutup celah bagi penggugat oportunis yang menuntut ganti rugi immateriil puluhan juta rupiah atas masalah kamar fisik.

## 6.3 Hak Gugatan Rekonvensi & Pemulihan Biaya Kuasa Hukum (Pasal 132a HIR)
Apabila ada pengguna yang melanggar kesepakatan batasan tanggung jawab dan tetap memaksakan gugatan hukum melebihi nilai ambang batas Rp 100.000, tindakan tersebut dikualifikasikan sebagai **Wanprestasi (Ingkar Janji terhadap Perjanjian Elektronik)**. KostKu memiliki hak hukum mutlak untuk:
1. **Mengajukan Gugatan Rekonvensi (Gugat Balik)** dalam forum perkara yang sama untuk menuntut ganti rugi penuh atas kerugian operasional dan pencemaran reputasi merk dagang KostKu.
2. **Pemulihan Biaya Advokat (*Legal Fee Recovery*)**: Pihak penggugat yang kalah wajib menanggung 100% seluruh biaya jasa advokat, saksi ahli, dan biaya perkara pengadilan yang dikeluarkan oleh pihak KostKu.

## 6.4 Keabsahan Perjanjian Elektronik Berbasis Centang (Clickwrap Agreement UU ITE)
Berdasarkan Pasal 18 & 20 UU ITE serta asas kebebasan berkontrak Pasal 1338 KUHPerdata, kesepakatan yang dilakukan dengan mencentang kotak persetujuan (*checkbox*) pada saat registrasi akun (`Register.jsx`) yang menyertakan tautan aktif dokumen Syarat & Ketentuan serta Kebijakan Privasi merupakan **perjanjian elektronik yang sah, mengikat, dan berlaku sebagai undang-undang bagi para pihak**.

## 6.5 Pemisahan Resiko Properti Mitra Owner & Larangan Pungutan Siluman
Pada Pasal 6 Syarat & Ketentuan, hak dan kewajiban Mitra Pemilik Properti diikat secara ketat:
1. **Jaminan Sertifikat & Hak Kelola**: Owner menjamin properti bebas dari sengketa waris atau sita perbankan (*Title Warranty*).
2. **Kebijakan Kamar Tanpa Zonk (*Zero-Zonk Policy*)**: Larangan penggunaan foto manipulatif dan kewajiban kesesuaian fasilitas riil.
3. **Penyaluran Hasil Sewa TriPay & Escrow Hold**: Pencairan dana sewa dikirim ke rekening ber-KTP terverifikasi dengan hak penahanan dana jika terjadi sengketa aktif atau dugaan penipuan.
4. **Pemisahan Tanggung Jawab Deposit & Fisik Gedung**: Urusan uang deposit jaminan kerusakan dan kelaikan instalasi listrik/kebakaran adalah tanggung jawab pribadi Owner, membebaskan platform KostKu 100% dari tuntutan hukum penghuni.
