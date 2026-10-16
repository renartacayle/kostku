import os
import sys
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# -------------------------------------------------------------
# TASTE-SKILL COLOR PALETTE (Blue Hour & Architecture System)
# -------------------------------------------------------------
BG_DARK = RGBColor(10, 22, 40)         # #0A1628
PRIMARY_NAVY = RGBColor(30, 58, 138)    # #1E3A8A
ELECTRIC_BLUE = RGBColor(37, 99, 235)   # #2563EB
TEAL_ACCENT = RGBColor(13, 148, 136)    # #0D9488
EMERALD_GREEN = RGBColor(16, 185, 129)  # #10B981
AMBER_GOLD = RGBColor(245, 158, 11)     # #F59E0B
ROSE_RED = RGBColor(239, 68, 68)        # #EF4444
TEXT_DARK = RGBColor(15, 23, 42)        # #0F172A
TEXT_MUTED = RGBColor(71, 85, 105)      # #475569
CARD_BG = RGBColor(248, 250, 252)       # #F8FAFC
CARD_BORDER = RGBColor(226, 232, 240)   # #E2E8F0
WHITE = RGBColor(255, 255, 255)
LIGHT_BLUE = RGBColor(56, 189, 248)     # #38BDF8
SLATE_LIGHT = RGBColor(203, 213, 225)   # #CBD5E1

FONT_FAMILY = "Plus Jakarta Sans"

def create_presentation():
    prs = Presentation()
    # Standard 16:9 widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    return prs, blank_layout

def add_solid_background(slide, color):
    bg_shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5)
    )
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = color
    bg_shape.line.fill.background()
    return bg_shape

def add_header(slide, title, category_badge=None, badge_color=ELECTRIC_BLUE):
    # Top progress bar accent
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.08))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = ELECTRIC_BLUE
    top_bar.line.fill.background()

    # Category Badge
    if category_badge:
        badge = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.2), Inches(0.35)
        )
        badge.fill.solid()
        badge.fill.fore_color.rgb = RGBColor(224, 231, 255) if badge_color == ELECTRIC_BLUE else RGBColor(204, 251, 241)
        badge.line.fill.background()
        tf = badge.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = category_badge.upper()
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_FAMILY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = badge_color

    # Title Box
    title_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.8), Inches(11.8), Inches(0.8))
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = FONT_FAMILY
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_NAVY

def add_bento_card(slide, left, top, width, height, title, body_text_list, border_top_color=None, bg_color=CARD_BG, border_color=CARD_BORDER):
    # Base rounded rectangle card
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.5)

    # Accent top border strip if specified
    if border_top_color:
        strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.08))
        strip.fill.solid()
        strip.fill.fore_color.rgb = border_top_color
        strip.line.fill.background()

    # Text container inside card
    txBox = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
    tf = txBox.text_frame
    tf.word_wrap = True

    # Title paragraph
    p_title = tf.paragraphs[0]
    p_title.text = title
    p_title.font.name = FONT_FAMILY
    p_title.font.size = Pt(14)
    p_title.font.bold = True
    p_title.font.color.rgb = PRIMARY_NAVY
    p_title.space_after = Pt(8)

    # Body paragraphs
    for item in body_text_list:
        p_body = tf.add_paragraph()
        p_body.text = item
        p_body.font.name = FONT_FAMILY
        p_body.font.size = Pt(11)
        p_body.font.color.rgb = TEXT_MUTED
        p_body.space_after = Pt(4)

def add_lead_slide(prs, blank_layout, title, subtitle, badge_text, metadata_lines, logo_path=None):
    slide = prs.slides.add_slide(blank_layout)
    add_solid_background(slide, BG_DARK)

    # Logo
    if logo_path and os.path.exists(logo_path):
        slide.shapes.add_picture(logo_path, Inches(5.9), Inches(1.1), width=Inches(1.5))

    # Badge Pill
    badge = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.6), Inches(2.8), Inches(4.1), Inches(0.45)
    )
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(30, 58, 138)
    badge.line.color.rgb = ELECTRIC_BLUE
    badge.line.width = Pt(1)
    tf = badge.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = badge_text.upper()
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_FAMILY
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = WHITE

    # Title
    t_box = slide.shapes.add_textbox(Inches(1.0), Inches(3.4), Inches(11.3), Inches(1.3))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_FAMILY
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = WHITE

    # Subtitle
    s_box = slide.shapes.add_textbox(Inches(1.0), Inches(4.7), Inches(11.3), Inches(0.8))
    tf = s_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = subtitle
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_FAMILY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = LIGHT_BLUE

    # Metadata box
    m_box = slide.shapes.add_textbox(Inches(1.0), Inches(5.6), Inches(11.3), Inches(1.2))
    tf = m_box.text_frame
    tf.word_wrap = True
    for idx, ml in enumerate(metadata_lines):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = ml
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_FAMILY
        p.font.size = Pt(12)
        p.font.color.rgb = SLATE_LIGHT

    return slide

def generate_all_slides():
    prs, blank_layout = create_presentation()
    logo_path = 'docs/assets/udinus_logo.jpeg'

    # -------------------------------------------------------------
    # SLIDE 1: COVER (LEAD DARK)
    # -------------------------------------------------------------
    add_lead_slide(
        prs, blank_layout,
        title="KOSTKU PLATFORM",
        subtitle="Spesifikasi Kebutuhan Perangkat Lunak (SKPL) — Smart Boarding & Hyperlocal Co-Living",
        badge_text="Versi 2.0 (Revisi G Final) • UDINUS",
        metadata_lines=[
            "Program Studi S1 Teknik Informatika, Fakultas Ilmu Komputer, Universitas Dian Nuswantoro Semarang",
            "Tim Penyusun: Oscar Herdian Wijaya (16309) • Yohanes Aryo Suryo (16479) • M. Mirza Fadilah (16354)"
        ],
        logo_path=logo_path
    )

    # -------------------------------------------------------------
    # SLIDE 2: AGENDA (DUAL-TRACK NAVIGATION)
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Agenda & Struktur Pembahasan Deck", "Navigasi Deck")
    add_bento_card(
        s2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
        title="Track 1: User & Bisnis (Solusi Pengguna)",
        body_text_list=[
            "• Problem statement & dilema ekosistem kost konvensional",
            "• Tiga pilar nilai unggulan: 0% Komisi, Sundul Kost, & UMKM",
            "• User Flow 1: Eksplorasi 3D WebGL & sewa kamar terverifikasi",
            "• User Flow 2: Pembayaran QRIS real-time & automated e-receipt",
            "• User Flow 3: Skema utilitas 3-jalur (air PDAM & listrik token)",
            "• User Flow 4: Integrasi mitra hyperlocal UMKM fee flat Rp 500",
            "• User Flow 5: Keamanan hunian, kontrak digital e-sign & komplain"
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s2, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
        title="Track 2: Developer & QA (Rekayasa Sistem)",
        body_text_list=[
            "• Arsitektur monorepo multi-platform (React 18, Express, APK, Desktop)",
            "• Aliran data sistem: Diagram Konteks Level 0 & DFD Level 1",
            "• Dekomposisi proses fungsional: DFD Level 2.1 & Level 2.2",
            "• Desain basis data: Kamus data 9 entitas & ERD relasional",
            "• Standar keamanan: Validasi matematika NIK 16 digit 1 KTP 1 Akun",
            "• Resiliensi front-end: React ErrorBoundary & canvas 60 FPS",
            "• Matriks evolusi fitur: Ditambahkan, diubah, dihapus (Rev A-G)"
        ],
        border_top_color=TEAL_ACCENT
    )

    # -------------------------------------------------------------
    # SLIDE 3: PROBLEM STATEMENT
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Problem Statement: Dilema Ekosistem Kost Konvensional", "Track User", ELECTRIC_BLUE)
    add_bento_card(
        s3, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0),
        title="Bagi Pencari Kos",
        body_text_list=[
            "• Foto kamar sering manipulatif dan tidak sesuai kondisi fisik asli.",
            "• Informasi kwh listrik dan air tidak transparan, memicu sengketa.",
            "• Maraknya akun palsu yang meminta uang muka sebelum survei.",
            "• Ketiadaan kontrak sewa formal berkekuatan hukum."
        ],
        border_top_color=ROSE_RED
    )
    add_bento_card(
        s3, Inches(4.8), Inches(1.8), Inches(3.6), Inches(5.0),
        title="Bagi Pemilik Kos",
        body_text_list=[
            "• Marketplace komersial memotong komisi sewa tinggi 10% - 20%.",
            "• Pembukuan kas masuk dan pengeluaran masih manual di buku catatan.",
            "• Kamar kosong sulit terisi cepat tanpa promosi berbiaya mahal.",
            "• Kesulitan menagih tunggakan listrik berlebih dari penghuni."
        ],
        border_top_color=AMBER_GOLD
    )
    add_bento_card(
        s3, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.0),
        title="Bagi UMKM Sekitar",
        body_text_list=[
            "• Usaha laundry kiloan dan katering sekitar kost terisolasi digital.",
            "• Tidak memiliki platform pesan-antar langsung ke pintu kamar penghuni.",
            "• Terbebani potongan fee aplikasi ojek online yang sangat besar.",
            "• Kehilangan potensi pasar ratusan mahasiswa/pekerja kos."
        ],
        border_top_color=TEXT_MUTED
    )

    # -------------------------------------------------------------
    # SLIDE 4: NILAI UNGGULAN
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Nilai Unggulan: Filosofi Zero-Extraction PropTech", "Track User", ELECTRIC_BLUE)
    add_bento_card(
        s4, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0),
        title="0% Komisi Booking",
        body_text_list=[
            "• Jaminan 100% uang sewa diterima utuh oleh pemilik kost.",
            "• Tidak ada potongan persentase sepeser pun seumur hidup.",
            "• Pemilik tidak terbebani potongan biaya operasional platform.",
            "• Menumbuhkan loyalitas tinggi pemilik untuk mendaftarkan properti."
        ],
        border_top_color=EMERALD_GREEN
    )
    add_bento_card(
        s4, Inches(4.8), Inches(1.8), Inches(3.6), Inches(5.0),
        title="Sundul Kost Terjangkau",
        body_text_list=[
            "• Opsi promosi sukarela khusus saat ada kamar yang kosong.",
            "• Tarif mikro terjangkau: Rp 5.000 untuk 24 jam penayangan.",
            "• Listing menempati posisi slot #1 di beranda & pencarian.",
            "• Timer hitung mundur 24 jam transparan dan terukur."
        ],
        border_top_color=AMBER_GOLD
    )
    add_bento_card(
        s4, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.0),
        title="Mitra UMKM Flat Rp 500",
        body_text_list=[
            "• Menghubungkan warung katering, laundry, & galon air warga.",
            "• Biaya administrasi pemeliharaan platform dipatok flat Rp 500.",
            "• Sangat murah bagi anak kos dan tidak memotong omset mitra.",
            "• Menutup biaya aktif server dan API secara berkelanjutan."
        ],
        border_top_color=ELECTRIC_BLUE
    )

    # -------------------------------------------------------------
    # SLIDE 5: USER FLOW 1 - BOOKING & 3D
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "User Flow 1: Eksplorasi 3D & Pengajuan Sewa Kamar", "Track User", ELECTRIC_BLUE)
    add_bento_card(
        s5, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3),
        title="1. Eksplorasi Visual & Peta GIS",
        body_text_list=[
            "• Calon penghuni memutar model 3D WebGL fasad bangunan tropis.",
            "• Scrubbing video canvas 60 FPS untuk melihat interior kamar.",
            "• Filter radius kampus via peta interaktif Leaflet OpenStreetMap."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s5, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3),
        title="2. Pengajuan Sewa Berkas Asli",
        body_text_list=[
            "• Calon penyewa menentukan durasi sewa & rencana tanggal check-in.",
            "• Menginput NIK 16 digit yang divalidasi keunikan 1 KTP 1 Akun.",
            "• Menuliskan catatan khusus atau preferensi fasilitas tambahan."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s5, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
        title="3. Approval Dashboard Pemilik",
        body_text_list=[
            "• Pemilik kos menerima notifikasi pengajuan baru secara instan.",
            "• Meninjau profil pemohon, durasi, dan data identitas berkas.",
            "• Keputusan satu klik: 'Setujui Permohonan' atau 'Tolak'."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s5, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.3),
        title="4. Penguncian Kamar Otomatis",
        body_text_list=[
            "• Unit kamar otomatis berubah status dari available ke occupied.",
            "• Mencegah insiden double booking atas kamar yang sama.",
            "• Menerbitkan faktur tagihan sewa awal ke akun penyewa."
        ],
        border_top_color=EMERALD_GREEN
    )

    # -------------------------------------------------------------
    # SLIDE 6: USER FLOW 2 - PEMBAYARAN QRIS
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "User Flow 2: Pembayaran QRIS & Automated E-Receipt", "Track User", ELECTRIC_BLUE)
    add_bento_card(
        s6, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Penerbitan Invoice Digital",
        body_text_list=[
            "• Sistem menghitung tarif pokok kamar, selisih utilitas, & deposit.",
            "• Rincian biaya dijabarkan transparan tanpa biaya siluman.",
            "• Status tagihan awal terbit berstatus 'pending'."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s6, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Scan QRIS Nasional",
        body_text_list=[
            "• Penghuni memindai barcode QRIS resmi perbankan.",
            "• Kompatibel dengan BCA, Mandiri, BRI, BNI, GoPay, OVO, & Dana.",
            "• Mengeliminasi verifikasi manual slip bukti transfer fisik."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s6, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Settlement Otomatis",
        body_text_list=[
            "• Notifikasi settlement QRIS memvalidasi dana masuk seketika.",
            "• Status invoice berubah otomatis dari 'pending' menjadi 'paid'.",
            "• Catatan arus kas masuk terbukukan langsung di neraca keuangan."
        ],
        border_top_color=EMERALD_GREEN
    )
    add_bento_card(
        s6, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Automated E-Receipt & Token",
        body_text_list=[
            "• Kuitansi resmi bernomor seri unik dikirim otomatis ke email penyewa.",
            "• Engine Nodemailer menyematkan bukti transaksi lunas berkas PDF.",
            "• Nomor token listrik PLN kamar aktif seketika di dashboard penghuni."
        ],
        border_top_color=TEAL_ACCENT
    )

    # -------------------------------------------------------------
    # SLIDE 7: USER FLOW 3 - UTILITAS 3-JALUR
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "User Flow 3: Transparansi Skema Utilitas Listrik & Air", "Track User", ELECTRIC_BLUE)
    add_bento_card(
        s7, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.0),
        title="Skema 1: All-Kost",
        body_text_list=[
            "• Seluruh biaya utilitas (air PDAM & listrik) digabung ke harga sewa.",
            "• Penghuni tidak perlu membayar tagihan tambahan apa pun.",
            "• Cocok untuk kost mahasiswa reguler berkapasitas besar."
        ],
        border_top_color=EMERALD_GREEN
    )
    add_bento_card(
        s7, Inches(4.8), Inches(1.8), Inches(3.6), Inches(4.0),
        title="Skema 2: Mandiri",
        body_text_list=[
            "• Penghuni mengisi token listrik prabayar sendiri per kamar.",
            "• Pemakaian air PDAM dihitung berdasar selisih angka meteran fisik.",
            "• Menghilangkan sengketa anak kos yang merasa memakai listrik sedikit."
        ],
        border_top_color=AMBER_GOLD
    )
    add_bento_card(
        s7, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.0),
        title="Skema 3: Parsial",
        body_text_list=[
            "• Kombinasi adil: listrik mandiri per unit, air bersih ditanggung kos.",
            "• Populer untuk indekos ber-AC di mana konsumsi listrik bervariasi.",
            "• Pemilik menetapkan kebijakan melalui switcher pengaturan kos."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    # Footnote bar
    fn = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.0), Inches(11.7), Inches(0.8))
    fn.fill.solid()
    fn.fill.fore_color.rgb = RGBColor(241, 245, 249)
    fn.line.color.rgb = CARD_BORDER
    p = fn.text_frame.paragraphs[0]
    p.text = "💡 Mekanisme Operasional: Staf kos cukup menginput angka meteran fisik awal bulan via aplikasi mobile, sistem menghitung kalkulasi selisih tagihan otomatis ke invoice bulanan."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(11)
    p.font.color.rgb = PRIMARY_NAVY

    # -------------------------------------------------------------
    # SLIDE 8: USER FLOW 4 - MITRA HYPERLOCAL
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "User Flow 4: Pemberdayaan UMKM Hyperlocal Flat Rp 500", "Track User", ELECTRIC_BLUE)
    add_bento_card(
        s8, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Katalog Bersyarat Radius",
        body_text_list=[
            "• Menu laundry dan katering hanya muncul jika ada mitra aktif di radius kos.",
            "• Jika belum ada mitra di area tersebut, antarmuka otomatis disembunyikan.",
            "• Menghindarkan kekecewaan penghuni akibat memesan toko fiktif."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s8, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Kebebasan Memilih Layanan",
        body_text_list=[
            "• Penghuni bebas membandingkan harga dan ulasan antar-mitra sekitar.",
            "• Pilihan paket fleksibel: paket express 1 hari vs reguler ekonomis.",
            "• Katering makanan sehat mingguan atau bulanan langsung ke kos."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s8, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Biaya Mikro Transparan: Rp 500",
        body_text_list=[
            "• Fee administrasi platform dipatok flat tepat Rp 500 per pesanan.",
            "• Sangat murah bagi penghuni, tanpa potongan persentase ke mitra.",
            "• Menutup biaya operasional server dan pengiriman pesan gateway."
        ],
        border_top_color=EMERALD_GREEN
    )
    add_bento_card(
        s8, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Delivery Langsung ke Pintu Kamar",
        body_text_list=[
            "• Rincian pesanan diteruskan instan ke WhatsApp mitra UMKM.",
            "• Disertai nomor kamar dan nama penghuni untuk pengantaran tepat sasaran.",
            "• Status pesanan terpantau: menunggu -> diproses -> dikirim -> selesai."
        ],
        border_top_color=TEAL_ACCENT
    )

    # -------------------------------------------------------------
    # SLIDE 9: USER FLOW 5 - KONTRAK & KOMPLAIN
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "User Flow 5: Keamanan Hunian, E-Sign & Tiket Komplain", "Track User", ELECTRIC_BLUE)
    add_bento_card(
        s9, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3),
        title="E-Signature Kontrak Digital",
        body_text_list=[
            "• Penghuni menandatangani perjanjian sewa di layar sentuh ponsel/laptop.",
            "• Kontrak terbit dalam format digital PDF sah tanpa kertas fisik.",
            "• Mengikat hak dan kewajiban kedua pihak secara berkekuatan hukum."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s9, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Tiket Komplain Berfoto",
        body_text_list=[
            "• Laporan kendala AC mati, kran bocor, atau wifi lambat disertai foto.",
            "• Bukti foto diambil langsung melalui kamera ponsel saat melapor.",
            "• Menghilangkan perselisihan kondisi awal versus kerusakan penghuni."
        ],
        border_top_color=AMBER_GOLD
    )
    add_bento_card(
        s9, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Pelacakan Siklus 3-Tahap",
        body_text_list=[
            "• Status penanganan transparan: Diajukan -> Diproses -> Selesai.",
            "• Pemilik kos atau staf dapat mendisposisikan tugas ke teknisi.",
            "• Penghuni menerima pembaruan status penyelesaian kendala."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s9, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Audit Trail Log Aktivitas",
        body_text_list=[
            "• Setiap aksi penting tercatat abadi di buku log digital properti.",
            "• Memantau mutasi kamar, perubahan harga, pembayaran, dan tiket.",
            "• Menjaga transparansi operasional kos yang terpercaya."
        ],
        border_top_color=TEAL_ACCENT
    )

    # -------------------------------------------------------------
    # SLIDE 10: TRANSITION SLIDE (LEAD DARK)
    # -------------------------------------------------------------
    add_lead_slide(
        prs, blank_layout,
        title="DARI USER EXPERIENCE KE ARSITEKTUR SOFTWARE",
        subtitle="Bagaimana Kebutuhan Pengguna Diterjemahkan ke Rekayasa Perangkat Lunak & Basis Data",
        badge_text="Jembatan Rekayasa Sistem",
        metadata_lines=[
            "Peralihan Pembahasan: Dari Kebutuhan Fungsional Pengguna ke Spesifikasi Teknis Pengembang",
            "Fokus: Arsitektur Monorepo, Data Flow Diagrams (DFD), Relasi Basis Data 9 Entitas, & Keamanan NIK"
        ]
    )

    # -------------------------------------------------------------
    # SLIDE 11: ARSITEKTUR MONOREPO
    # -------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Arsitektur Monorepo Multi-Platform Terpadu", "Track Developer", TEAL_ACCENT)
    add_bento_card(
        s11, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Front-End: React 18 + Vite 5",
        body_text_list=[
            "• Single Page Application (SPA) berbasis Functional Components & Hooks.",
            "• Vite 5 HMR kilat sub-detik dengan bundling tree-shaking agresif.",
            "• State management via AuthContext & KostContext terisolasi."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s11, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Back-End: Node.js + Express API",
        body_text_list=[
            "• REST core menyediakan 10+ controller (Auth, Rooms, Invoices, Sundul).",
            "• Middleware CORS, authentication guard, & error-handling terpadu.",
            "• Automated e-receipt engine Nodemailer dengan fallback Ethereal."
        ],
        border_top_color=TEAL_ACCENT
    )
    add_bento_card(
        s11, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Mobile: Capacitor v8 Native APK",
        body_text_list=[
            "• BridgeActivity.java mengemas aset web ke APK Android native.",
            "• Akses izin native gawai: kamera foto kamar & GPS geolokasi presisi.",
            "• Performa Webview 60 FPS setara aplikasi native murni."
        ],
        border_top_color=AMBER_GOLD
    )
    add_bento_card(
        s11, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Desktop: Electron v44 Runtime",
        body_text_list=[
            "• main.cjs mengelola window OS desktop dan jembatan IPC.",
            "• Pengemasan installer satu klik Windows (.exe NSIS) & Linux AppImage.",
            "• Kemampuan offline PWA dengan cache-first Service Worker."
        ],
        border_top_color=PRIMARY_NAVY
    )

    # -------------------------------------------------------------
    # SLIDE 12: ALIRAN DATA - KONTEKS & DFD 1
    # -------------------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Aliran Data: Diagram Konteks Level 0 & DFD Level 1", "Track Developer", TEAL_ACCENT)
    add_bento_card(
        s12, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
        title="Diagram Konteks (Level 0) — 7 Entitas",
        body_text_list=[
            "• Batasan sistem KostKu berinteraksi dengan 7 entitas luar:",
            "  1. Pencari Kos (kriteria filter, formulir sewa, koordinat GPS)",
            "  2. Penghuni Kos (konfirmasi bayar, tiket komplain, pesanan mitra)",
            "  3. Pemilik Kos (approval sewa, data kamar, aktivasi sundul kost)",
            "  4. Staf Kos (input meteran fisik, inspeksi kelayakan kamar)",
            "  5. Mitra Afiliasi (katalog menu layanan, penerimaan pesanan)",
            "  6. Payment Gateway QRIS (request settlement, verifikasi status)",
            "  7. WhatsApp Gateway (pengingat jatuh tempo, tiket order mitra)",
            "• Seluruh aliran data masuk dan keluar terdefinisi tanpa celah."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s12, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
        title="DFD Level 1 — 6 Proses Bisnis Inti",
        body_text_list=[
            "• 1.0 Autentikasi & Akun: Registrasi 1 KTP 1 NIK 16 digit & sesi peran",
            "• 2.0 Eksplorasi Visual: Filter GIS Leaflet, 3D WebGL, & video 60 FPS",
            "• 3.0 Siklus Sewa: Pengajuan sewa kamar & kunci status kamar",
            "• 4.0 Tagihan & QRIS: Penerbitan invoice & settlement pembayaran",
            "• 5.0 Layanan & Operasional: Catatan meteran & tiket komplain",
            "• 6.0 Sundul & Kemitraan: Promosi 24 jam & order mitra fee Rp 500",
            "• Terhubung ke 7 Data Store: D1:Users, D2:Kosts, D3:Applications, D4:Invoices, D5:Complaints, D6:Merchants, D7:Activities."
        ],
        border_top_color=TEAL_ACCENT
    )

    # -------------------------------------------------------------
    # SLIDE 13: DFD LEVEL 2 - KAMAR & TRANSAKSI
    # -------------------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "Dekomposisi Fungsional: DFD Level 2 Mikro", "Track Developer", TEAL_ACCENT)
    add_bento_card(
        s13, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0),
        title="DFD 2.0: Manajemen Kamar & Properti",
        body_text_list=[
            "• 2.1 Registrasi Identitas Properti Kos:",
            "  Menyimpan nama kos, alamat, kota, dan titik koordinat GPS ke D2.",
            "• 2.2 Pemetaan Tata Letak & Fasilitas Kamar:",
            "  Mencatat nomor unit, lantai, tipe, dan harga dasar ke D2.",
            "• 2.3 Konfigurasi Skema 3-Jalur Utilitas:",
            "  Menyimpan formula tagihan (All-Kost / Mandiri / Parsial) ke D2.",
            "• 2.4 Sinkronisasi Status Okupansi Kamar:",
            "  Memvalidasi status kamar (available / occupied) secara simetris.",
            "  Mencatat mutasi status ke audit log D7: Activities."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s13, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0),
        title="DFD 4.0 & 6.0: Transaksi & Mitra Afiliasi",
        body_text_list=[
            "• 4.1 Kalkulasi Tagihan Pokok & Utilitas:",
            "  Membaca skema kos dan tarif kamar, menerbitkan invoice di D4.",
            "• 4.2 Settlement Transaksi QRIS Real-Time:",
            "  Validasi callback payment gateway, ubah invoice menjadi paid di D4.",
            "• 4.3 Penerbitan Kuitansi Digital Lunas:",
            "  Generate nomor resi unik, trigger kirim email berkas PDF ke user.",
            "• 6.1 Katalog Hyperlocal Mitra UMKM Sekitar:",
            "  Penyaringan dinamis mitra terdaftar di radius kos dari D6.",
            "• 6.2 Pembagian Hasil & Mikro Komisi Rp 500:",
            "  Hitung subtotal + fee flat Rp 500, teruskan tiket pesanan ke WA mitra."
        ],
        border_top_color=TEAL_ACCENT
    )

    # -------------------------------------------------------------
    # SLIDE 14: BASIS DATA - 9 ENTITAS
    # -------------------------------------------------------------
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "Desain Basis Data: 9 Entitas & Kardinalitas ERD", "Track Developer", TEAL_ACCENT)
    add_bento_card(
        s14, Inches(0.8), Inches(1.8), Inches(3.6), Inches(2.4),
        title="1. USERS & KOSTS",
        body_text_list=[
            "• USERS (id, name, email, phone, nik 16-char, password, role)",
            "• KOSTS (uid, ownerId, location, utilityScheme, priceMonthly)",
            "• Relasi: 1 Pemilik dapat mengelola N Properti Kos (1:N)."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s14, Inches(4.8), Inches(1.8), Inches(3.6), Inches(2.4),
        title="2. ROOMS & APPLICATIONS",
        body_text_list=[
            "• ROOMS (id, kostUid, number, floor, basePrice, status)",
            "• APPLICATIONS (id, kostUid, userId, duration, status)",
            "• Relasi: 1 Kos memiliki N Kamar; 1 Kamar disewa 1 User."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s14, Inches(8.8), Inches(1.8), Inches(3.7), Inches(2.4),
        title="3. INVOICES & ACTIVITIES",
        body_text_list=[
            "• INVOICES (id, kostUid, userId, waterCost, total, status, receiptNo)",
            "• ACTIVITIES (id, kostUid, type, text, timestamp)",
            "• Relasi: 1 Kos menerbitkan N Invoices & mencatat N Activities."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s14, Inches(0.8), Inches(4.6), Inches(3.6), Inches(2.4),
        title="4. COMPLAINTS",
        body_text_list=[
            "• COMPLAINTS (id, kostUid, userId, title, photoUrl, status)",
            "• Kategori: AC, plumbing, listrik, kebersihan, lainnya.",
            "• Relasi: 1 Penghuni dapat mengajukan N Tiket Komplain."
        ],
        border_top_color=AMBER_GOLD
    )
    add_bento_card(
        s14, Inches(4.8), Inches(4.6), Inches(3.6), Inches(2.4),
        title="5. MERCHANTS",
        body_text_list=[
            "• MERCHANTS (id, kostUid, name, category, phone, rating)",
            "• Katalog: laundry kiloan, katering sehat, galon air mineral.",
            "• Relasi: 1 Kos dapat memiliki N Mitra UMKM terdaftar."
        ],
        border_top_color=TEAL_ACCENT
    )
    add_bento_card(
        s14, Inches(8.8), Inches(4.6), Inches(3.7), Inches(2.4),
        title="6. PARTNER_ORDERS",
        body_text_list=[
            "• PARTNER_ORDERS (id, kostUid, tenantId, subtotal, adminFee Rp 500)",
            "• Menyimpan rincian menu pesanan dan nomor kamar tujuan.",
            "• Relasi: 1 Mitra melayani N Pesanan dari Penghuni Kos."
        ],
        border_top_color=EMERALD_GREEN
    )

    # -------------------------------------------------------------
    # SLIDE 15: KEAMANAN & NIK 16 DIGIT
    # -------------------------------------------------------------
    s15 = prs.slides.add_slide(blank_layout)
    add_header(s15, "Keamanan & Integritas: Validasi NIK 16 Digit 1 KTP 1 Akun", "Track Developer", TEAL_ACCENT)
    add_bento_card(
        s15, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Validasi Matematika NIK 16 Digit",
        body_text_list=[
            "• Pendaftar wajib menginput NIK 16 digit yang divalidasi regex dan panjang.",
            "• 1 NIK hanya boleh terikat pada 1 akun aktif di seluruh basis data.",
            "• Mengeliminasi akun ganda dan pelaku booking fiktif secara permanen."
        ],
        border_top_color=PRIMARY_NAVY
    )
    add_bento_card(
        s15, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Hash Sandi & Token Peran",
        body_text_list=[
            "• Kata sandi pengguna tidak disimpan dalam plaintext, melainkan di-hash.",
            "• Autentikasi sesi berbasis otorisasi peran (owner, user, staff, master).",
            "• Endpoint API terproteksi menolak akses peran yang tidak berwenang."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s15, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Isolasi Multi-Tenant",
        body_text_list=[
            "• Pemilik kost hanya dapat melihat & mengedit kos miliknya (ownerId matching).",
            "• Switcher multi-properti mempartisi data kos secara ketat dan aman.",
            "• Penghuni hanya dapat melihat tagihan dan kamar miliknya sendiri."
        ],
        border_top_color=EMERALD_GREEN
    )
    add_bento_card(
        s15, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Audit Trail Log Digital",
        body_text_list=[
            "• Koleksi ACTIVITIES mencatat mutasi data, waktu, dan aktor eksekutor.",
            "• Memberikan bukti hukum digital jika terjadi sengketa sewa-menyewa.",
            "• Berkas database atomic JSON menjamin keamanan data bebas korupsi."
        ],
        border_top_color=TEAL_ACCENT
    )

    # -------------------------------------------------------------
    # SLIDE 16: RESILIENSI FRONT-END
    # -------------------------------------------------------------
    s16 = prs.slides.add_slide(blank_layout)
    add_header(s16, "Resiliensi Front-End & Optimasi Performa Layar", "Track Developer", TEAL_ACCENT)
    add_bento_card(
        s16, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.3),
        title="React ErrorBoundary Global",
        body_text_list=[
            "• ErrorBoundary membungkus rute utama pada App.jsx.",
            "• Menangkap runtime exception tak terduga tanpa layar putih (blank screen).",
            "• Menyajikan UI pemulihan dengan tombol soft reload yang ramah pengguna."
        ],
        border_top_color=ROSE_RED
    )
    add_bento_card(
        s16, Inches(6.9), Inches(1.8), Inches(5.6), Inches(2.3),
        title="Video Scrubbing Canvas 60 FPS",
        body_text_list=[
            "• VideoScroll.jsx memanfaatkan requestAnimationFrame & DPR scaling.",
            "• Sinkronisasi presisi posisi scroll mouse dengan frame video kamar.",
            "• Caching frame WebP efisien di memori tanpa membebani GPU ponsel."
        ],
        border_top_color=ELECTRIC_BLUE
    )
    add_bento_card(
        s16, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
        title="Three.js 3D WebGL Building",
        body_text_list=[
            "• KostBuilding.jsx & KostScene.jsx merender model 3D fasad kos tropis.",
            "• Dilengkapi panel roster ventilasi beton, tritisan atap, & kisi-kisi kayu jati.",
            "• Pencahayaan atmosferik Blue Hour dengan konsumsi memori GPU hemat."
        ],
        border_top_color=TEAL_ACCENT
    )
    add_bento_card(
        s16, Inches(6.9), Inches(4.5), Inches(5.6), Inches(2.3),
        title="PWA Offline Service Worker",
        body_text_list=[
            "• public/sw.js menerapkan strategi caching stale-while-revalidate.",
            "• Aplikasi tetap dapat dimuat seketika saat gawai offline / sinyal lemah.",
            "• Manifest.json memungkinkan instalasi aplikasi di layar utama gawai."
        ],
        border_top_color=PRIMARY_NAVY
    )

    # -------------------------------------------------------------
    # SLIDE 17: MATRIKS EVOLUSI FITUR
    # -------------------------------------------------------------
    s17 = prs.slides.add_slide(blank_layout)
    add_header(s17, "Matriks Evolusi Fitur: Added, Modified, Removed (Rev A-G)", "Track Developer", TEAL_ACCENT)
    add_bento_card(
        s17, Inches(0.8), Inches(1.8), Inches(3.6), Inches(5.0),
        title="Ditambahkan (Added)",
        body_text_list=[
            "• Token PLN & meteran PDAM (Rev B)",
            "• Capacitor APK & Electron (Rev C)",
            "• E-Signature kontrak digital (Rev C)",
            "• Three.js 3D & Video Canvas (Rev D)",
            "• 1 KTP 1 NIK 16 digit validasi (Rev E)",
            "• Sundul Kost promosi 24 jam (Rev F)",
            "• Mitra UMKM komisi Rp 500 (Rev G)",
            "• Global ErrorBoundary (Rev G)"
        ],
        border_top_color=EMERALD_GREEN
    )
    add_bento_card(
        s17, Inches(4.8), Inches(1.8), Inches(3.6), Inches(5.0),
        title="Diubah (Modified)",
        body_text_list=[
            "• Status kamar auto-occupied saat sewa disetujui (mencegah double booking)",
            "• Penggantian simulator fiktif ke verifikasi QRIS perbankan riil",
            "• Katalog mitra tampil bersyarat jika ada mitra aktif di radius kos",
            "• Migrasi navigasi manual ke react-router-dom declarative routing",
            "• Sinkronisasi data offline PWA"
        ],
        border_top_color=AMBER_GOLD
    )
    add_bento_card(
        s17, Inches(8.8), Inches(1.8), Inches(3.7), Inches(5.0),
        title="Dihapus (Removed)",
        body_text_list=[
            "• Virtual Tour 360 Panorama:",
            "  Dihapus karena distorsi fisheye & file >30MB memperlambat Android.",
            "• Iklan Pop-up Pihak Ketiga:",
            "  Dihapus demi menjaga estetika visual UI & privasi data pengguna.",
            "• Komisi Potongan Sewa 10%-20%:",
            "  Dihapus untuk menegakkan 0% komisi sewa bagi pemilik seumur hidup."
        ],
        border_top_color=ROSE_RED
    )

    # -------------------------------------------------------------
    # SLIDE 18: KESIMPULAN & Q&A (LEAD DARK)
    # -------------------------------------------------------------
    add_lead_slide(
        prs, blank_layout,
        title="KESIMPULAN & SESI TANYA JAWAB (Q&A)",
        subtitle="KostKu Siap Digelar sebagai Solusi Digital Co-Living Modern Indonesia",
        badge_text="Verifikasi QA: 100% Pass (Unlazy Gates Verified)",
        metadata_lines=[
            "✓ Kepatuhan Akademik: Memenuhi standar kurikulum S1 Teknik Informatika UDINUS Semarang",
            "✓ Kesiapan Produksi: Multi-platform (Web, Android APK, Desktop) teruji bebas galat pada 14 rute",
            "✓ Dampak Ekosistem: Menjamin 0% komisi bagi pemilik kos dan memberdayakan UMKM warga sekitar",
            "",
            "Terima kasih atas perhatian Dewan Penguji & Dosen Pembimbing. Kami membuka sesi tanya jawab."
        ]
    )

    out_pptx = '/home/rena/Desktop/KostKu_SKPL_Presentation.pptx'
    prs.save(out_pptx)
    print(f"Generated 18-slide native PPTX at: {out_pptx}")

if __name__ == '__main__':
    generate_all_slides()
