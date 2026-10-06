const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Helper: Dynamic Email Transporter & Payment Receipt Email Sender
const sendPaymentReceiptEmail = async ({ toEmail, receiptNumber, invoice, kost, user }) => {
  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'Email tujuan tidak valid' };
  }

  try {
    let activeTransporter = null;
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      activeTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Ethereal test account fallback (safe for dev & free testing)
      const testAccount = await nodemailer.createTestAccount();
      activeTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const tenantName = user?.name || invoice.userName || 'Penghuni Kost';
    const roomNum = invoice.kamar || user?.kamar || '-';
    const propName = kost?.kostName || 'KostKu Residence';
    const totalRupiah = Number(invoice.total || 0).toLocaleString('id-ID');
    const payMethod = invoice.paymentMethod || 'QRIS / Online';
    const payDate = new Date(invoice.paidAt || Date.now()).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #38bdf8; letter-spacing: -0.5px;">KostKu</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-weight: 600; letter-spacing: 1px;">BUKTI PEMBAYARAN RESMI (E-RECEIPT)</p>
        </div>
        <div style="padding: 28px 24px; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed #cbd5e1;">
            <span style="background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 9999px; font-weight: 800; font-size: 12px; display: inline-block; margin-bottom: 12px;">✓ PEMBAYARAN LUNAS</span>
            <h3 style="margin: 0 0 6px 0; font-size: 22px; color: #0f172a;">No. Resi: ${receiptNumber}</h3>
            <p style="margin: 0; font-size: 13px; color: #64748b;">Diterbitkan pada: ${payDate}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Nama Penghuni</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">${tenantName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Nomor Kamar</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">Kamar ${roomNum}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Cabang Kost</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">${propName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Metode Pembayaran</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">${payMethod}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a;">
              <td style="padding: 14px 0; font-weight: 800; font-size: 16px; color: #0f172a;">TOTAL DIBAYAR</td>
              <td style="padding: 14px 0; text-align: right; font-weight: 900; font-size: 20px; color: #16a34a;">Rp ${totalRupiah}</td>
            </tr>
          </table>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
              Terima kasih telah melakukan pembayaran tepat waktu. Dokumen ini adalah tanda terima resmi yang sah dan diterbitkan secara digital oleh sistem KostKu.
            </p>
          </div>
          <div style="text-align: center; font-size: 11px; color: #94a3b8;">
            KostKu Smart Co-Living Management • Hak Cipta Dilindungi
          </div>
        </div>
      </div>
    `;

    const info = await activeTransporter.sendMail({
      from: '"KostKu Billing" <billing@kostku.id>',
      to: toEmail,
      subject: `[LUNAS] Bukti Pembayaran Sewa Kost - ${receiptNumber}`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.warn('Nodemailer sending error:', err.message);
    return { success: false, error: err.message };
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Serve binaries for direct in-app update downloads & browser downloads
const DIST_BINARIES_DIR = path.join(__dirname, '..', 'dist-binaries');

const handleApkDownload = (req, res) => {
  const apkPath = path.resolve(DIST_BINARIES_DIR, 'KostKu-Android.apk');
  if (!fs.existsSync(apkPath)) {
    return res.status(404).send('APK file not found on server.');
  }

  const stat = fs.statSync(apkPath);
  res.writeHead(200, {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Disposition': 'attachment; filename="KostKu.apk"',
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Connection': 'close',
    'Access-Control-Allow-Origin': '*'
  });

  const fileStream = fs.createReadStream(apkPath);
  fileStream.pipe(res);
};

// Explicit APK download routes with headers optimized for Android Chrome
app.get('/downloads/KostKu-Android.apk', handleApkDownload);
app.get('/api/download/apk', handleApkDownload);
app.get('/apk', handleApkDownload);

const handleExeDownload = (req, res) => {
  const exePath = path.resolve(DIST_BINARIES_DIR, 'KostKu-Windows.exe');
  if (!fs.existsSync(exePath)) {
    return res.status(404).send('Executable file not found on server.');
  }

  const stat = fs.statSync(exePath);
  res.writeHead(200, {
    'Content-Type': 'application/vnd.microsoft.portable-executable',
    'Content-Disposition': 'attachment; filename="KostKu-Setup.exe"',
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Connection': 'close',
    'Access-Control-Allow-Origin': '*'
  });

  const fileStream = fs.createReadStream(exePath);
  fileStream.pipe(res);
};

app.get(['/downloads/KostKu-Windows.exe', '/api/download/exe', '/exe'], handleExeDownload);

// Friendly Mobile Download Page
app.get(['/download', '/unduh'], (req, res) => {
  const apkPath = path.resolve(DIST_BINARIES_DIR, 'KostKu-Android.apk');
  const sizeMb = fs.existsSync(apkPath) ? (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1) : '20.0';
  
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unduh KostKu APK Android</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .logo {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
    p.subtitle { color: #94a3b8; font-size: 0.9rem; margin-bottom: 24px; }
    .badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .btn-download {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.05rem;
      padding: 16px 24px;
      border-radius: 16px;
      box-shadow: 0 10px 20px -5px rgba(34, 197, 94, 0.4);
      transition: transform 0.1s, opacity 0.2s;
    }
    .btn-download:active { transform: scale(0.98); }
    .guide {
      margin-top: 28px;
      text-align: left;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 16px;
      padding: 16px 18px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .guide-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.8rem;
      color: #94a3b8;
      margin-bottom: 10px;
    }
    .step:last-child { margin-bottom: 0; }
    .step-num {
      background: #334155;
      color: #e2e8f0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      flex-shrink: 0;
      margin-top: 1px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🏠</div>
    <h1>KostKu Android</h1>
    <div class="badge">Versi 1.0.3 • ${sizeMb} MB • Official Build</div>
    <p class="subtitle">Aplikasi Manajemen & Pencarian Kost Pintar</p>

    <a href="/downloads/KostKu-Android.apk" class="btn-download" download="KostKu.apk">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Unduh APK Sekarang
    </a>

    <div class="guide">
      <div class="guide-title">
        <span>💡</span> Cara Pasang APK di Android:
      </div>
      <div class="step">
        <div class="step-num">1</div>
        <div>Klik tombol <strong>Unduh APK Sekarang</strong> di atas.</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div>Jika muncul pesan <em>"File mungkin berbahaya"</em>, klik <strong>"Tetap download"</strong> (karena diunduh langsung dari server lokal).</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div>Setelah selesai, ketuk notifikasi atau buka <strong>Folder Download</strong> lalu klik <strong>KostKu.apk</strong> & pilih <strong>Install</strong>.</div>
      </div>
    </div>
  </div>
</body>
</html>`);
});

if (fs.existsSync(DIST_BINARIES_DIR)) {
  app.use('/downloads', express.static(DIST_BINARIES_DIR));
}

// Endpoint: App Version Check for Auto-Update (Supports both /api/app-version & /app-version)
app.get(['/api/app-version', '/app-version'], (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const host = req.get('host') || '192.168.18.6:3001';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  res.json({
    version: '1.0.3',
    buildNumber: 103,
    releaseDate: '2026-09-29',
    title: 'Pembaruan KostKu v1.0.3 Tersedia! 🚀',
    changelog: [
      'Tampilan UI Pencarian & Detail Kost adaptif responsif sesuai ukuran layar (HP, Tablet, Desktop)',
      'Denah 2D interaktif arsitektur kamar & gedung berskala proporsional',
      '10 Demo Kost lengkap dengan foto asli, spesifikasi, dan denah',
      'Floating Action Bar pemesanan sewa instan untuk pengguna Android'
    ],
    downloadUrls: {
      windows: 'https://drive.google.com/uc?id=1stAngBLzZ0CmGUZNPc1t66mBk5_R8O2K&export=download',
      windowsDriveView: 'https://drive.google.com/file/d/1stAngBLzZ0CmGUZNPc1t66mBk5_R8O2K/view?usp=sharing',
      android: '/downloads/KostKu-Android.apk',
      androidDirect: '/apk',
      androidAbsolute: `${baseUrl}/downloads/KostKu-Android.apk`,
      windowsAbsolute: 'https://drive.google.com/uc?id=1stAngBLzZ0CmGUZNPc1t66mBk5_R8O2K&export=download'
    },
    isCritical: false
  });
});

// ── In-memory Database (Vercel-compatible) ────────────────────────────────────
let _dbCache = null;

const loadSeedData = () => {
  try {
    const DB_FILE = path.join(__dirname, 'db.json');
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: [], kosts: [], complaints: [], activities: [], invoices: [], expenses: [], iot_meters: [], applications: [] };
  }
};

const getDB = () => {
  if (!_dbCache) {
    _dbCache = loadSeedData();
    if (!_dbCache.complaints) _dbCache.complaints = [];
    if (!_dbCache.activities) _dbCache.activities = [];
    if (!_dbCache.invoices) _dbCache.invoices = [];
    if (!_dbCache.expenses) _dbCache.expenses = [];
    if (!_dbCache.iot_meters) _dbCache.iot_meters = [];
    if (!_dbCache.applications) _dbCache.applications = [];
    if (!_dbCache.transactions) _dbCache.transactions = [];
    if (!_dbCache.contracts) _dbCache.contracts = [];
    if (!_dbCache.packages) _dbCache.packages = [];
    if (!_dbCache.inspections) _dbCache.inspections = [];
    if (!_dbCache.staff) _dbCache.staff = [];
    if (!_dbCache.settings) _dbCache.settings = {};
    if (!_dbCache.google_config) _dbCache.google_config = {};
  }
  return _dbCache;
};

// writeDB: update in-memory; try file write (works locally, silently skip on Vercel read-only FS)
const writeDB = (data) => {
  _dbCache = data;
  try {
    const DB_FILE = path.join(__dirname, 'db.json');
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (_) { /* read-only FS on serverless — data stays in memory */ }
};

// Helper: Add Activity
const addActivity = (db, kostUid, type, text) => {
  db.activities.push({
    id: 'ACT-' + Date.now(),
    kostUid,
    type, 
    text,
    time: new Date().toISOString()
  });
};

// Endpoint: Check NIK Availability (Anti-Bot: 1 KTP 1 Akun)
app.get('/api/check-nik', (req, res) => {
  const nik = String(req.query.nik || '').trim();
  const db = getDB();
  
  if (!nik || !/^\d{16}$/.test(nik)) {
    return res.json({ 
      valid: false, 
      available: false, 
      message: 'NIK harus tepat 16 digit angka sesuai KTP' 
    });
  }

  const existing = db.users.find(u => u.nik && String(u.nik) === nik);
  if (existing) {
    return res.json({ 
      valid: true, 
      available: false, 
      message: 'NIK sudah terdaftar! 1 KTP hanya untuk 1 akun' 
    });
  }

  return res.json({ 
    valid: true, 
    available: true, 
    message: 'NIK valid & dapat digunakan' 
  });
});

// Endpoint: Pemulihan Akun dengan NIK & Nama Sesuai KTP
app.post('/api/recover-account', (req, res) => {
  const { nik, name, newPassword } = req.body;
  const db = getDB();

  const cleanNik = String(nik || '').trim();
  if (!cleanNik || !/^\d{16}$/.test(cleanNik)) {
    return res.status(400).json({ error: 'NIK wajib 16 digit angka' });
  }

  const user = db.users.find(u => u.nik && String(u.nik) === cleanNik);
  if (!user) {
    return res.status(404).json({ error: 'NIK tidak ditemukan dalam sistem. Pastikan NIK sudah pernah didaftarkan.' });
  }

  // Name verification (case-insensitive)
  const inputName = String(name || '').trim().toLowerCase();
  const userName = String(user.name || '').trim().toLowerCase();

  const isMatch = userName === inputName || 
                  userName.includes(inputName) || 
                  inputName.includes(userName);

  if (!isMatch) {
    return res.status(400).json({ 
      error: 'Nama tidak cocok dengan data NIK terdaftar! Masukkan nama lengkap persis seperti di KTP.' 
    });
  }

  // If new password is provided, reset password and auto-login
  if (newPassword) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }
    user.password = newPassword;
    addActivity(db, user.kostUid || 'GLOBAL', 'pengguna', `Akun ${user.name} berhasil dipulihkan dengan verifikasi NIK (${cleanNik})`);
    writeDB(db);

    const safeUser = { ...user };
    delete safeUser.password;

    let kostName = 'KostKu';
    if (user.role === 'owner') {
      const ownerKosts = db.kosts.filter(k => String(k.ownerId) === String(user.id) || (user.kostUid && k.uid === user.kostUid));
      const activeKost = ownerKosts.find(k => k.uid === user.kostUid) || ownerKosts[0];
      if (activeKost) kostName = activeKost.kostName;
    } else if (user.kostUid) {
      const kost = db.kosts.find(k => k.uid === user.kostUid);
      if (kost) kostName = kost.kostName;
    }

    return res.json({ 
      success: true, 
      message: 'Password berhasil diperbarui! Akun Anda telah dipulihkan.',
      user: safeUser,
      kostName
    });
  }

  // Verification step only
  const maskedEmail = user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '-';
  const maskedPhone = user.phone ? user.phone.replace(/(\d{3})\d+(\d{3})/, '$1****$2') : '-';

  return res.json({
    success: true,
    message: 'Data NIK & Nama terverifikasi cocok!',
    matchedUser: {
      id: user.id,
      name: user.name,
      role: user.role === 'owner' ? 'Pemilik Kost' : 'Anak Kost / Pencari',
      email: maskedEmail,
      phone: maskedPhone
    }
  });
});

// Endpoint: Register (Wajib NIK 16 digit, Foto KTP, & Nama Sesuai KTP - Anti Bot 1 KTP 1 Akun)
app.post('/api/register', (req, res) => {
  const { role, name, nik, ktpImage, email, password, kostName, kostUid, kamar, phone, address, lat, lng, imageFront, roomPhoto, gmapsUrl, floorPlan, description } = req.body;
  const db = getDB();

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Nama lengkap sesuai KTP wajib diisi' });
  }

  // Validate NIK
  const cleanNik = String(nik || '').trim();
  if (!cleanNik || !/^\d{16}$/.test(cleanNik)) {
    return res.status(400).json({ error: 'NIK wajib 16 digit angka sesuai KTP Anda' });
  }

  // Enforce 1 KTP 1 Akun
  const existingUserByNik = db.users.find(u => u.nik && String(u.nik) === cleanNik);
  if (existingUserByNik) {
    return res.status(400).json({ 
      error: 'NIK ini sudah terdaftar! 1 KTP hanya berlaku untuk 1 akun. Jika ini akun Anda, silakan gunakan fitur Pemulihan Akun dengan NIK.' 
    });
  }

  // Validate Foto KTP (Anti-Bot)
  if (!ktpImage) {
    return res.status(400).json({ error: 'Foto KTP wajib diunggah untuk verifikasi identitas resmi (anti-bot)!' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  if (email) {
    const existingEmail = db.users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: 'Email sudah terdaftar! Silakan gunakan email lain atau login.' });
    }
  }

  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    nik: cleanNik,
    ktpImage,
    email: email ? email.trim().toLowerCase() : '',
    phone: phone ? phone.trim() : '',
    password,
    role: role || 'user',
    verifiedKtp: true,
    createdAt: new Date().toISOString()
  };

  if (role === 'owner') {
    if (!email) return res.status(400).json({ error: 'Email harus diisi untuk pemilik kost' });

    // Validate GPS and Image for owner
    if (!lat || !lng) return res.status(400).json({ error: 'Lokasi GPS Kost wajib diisi untuk verifikasi' });
    if (!imageFront) return res.status(400).json({ error: 'Foto Depan Kost wajib diunggah untuk verifikasi' });

    const generatedUid = 'KOST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    newUser.kostUid = generatedUid;
    db.users.push(newUser);

    const defaultFloorPlan = floorPlan || {
      dimensions: '3.0m x 4.0m',
      bedType: 'super_single',
      furnitures: ['wardrobe', 'desk', 'bathroom', 'ac', 'window'],
      generated: true,
      mode: 'ai'
    };

    const initialRooms = [];
    for (let i = 1; i <= 6; i++) {
      const numStr = i < 10 ? `10${i}` : `1${i}`;
      initialRooms.push({
        id: `RM-${generatedUid}-${numStr}`,
        number: numStr,
        price: 1500000,
        size: defaultFloorPlan.dimensions || '3.0m x 4.0m',
        capacity: 1,
        status: 'available',
        roomPhoto: roomPhoto || '',
        floorPlan: defaultFloorPlan,
        facilities: ['WiFi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Meja Belajar', 'Lemari', 'AC']
      });
    }

    const kostImages = [imageFront];
    if (roomPhoto && !kostImages.includes(roomPhoto)) {
      kostImages.push(roomPhoto);
    }

    const effectiveLat = Number(lat) || -6.2088;
    const effectiveLng = Number(lng) || 106.8456;

    db.kosts.push({
      uid: generatedUid,
      kostName: kostName || 'Kost Baru',
      ownerId: newUser.id,
      address: address || '',
      location: { lat: effectiveLat, lng: effectiveLng },
      gmapsUrl: gmapsUrl || `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`,
      roomPhoto: roomPhoto || '',
      floorPlan: defaultFloorPlan,
      images: kostImages,
      description: description || '',
      status: 'verified',
      settings: {
        rooms: initialRooms,
        employees: [],
        bedsheetCount: 12,
        waterRate: 5000,
        electricityRate: 2000,
        depositAmount: 500000
      }
    });

    addActivity(db, generatedUid, 'pengguna', `Kost ${kostName || 'Baru'} didaftarkan oleh ${newUser.name} (NIK terverifikasi)`);
    writeDB(db);

    const safeUser = { ...newUser };
    delete safeUser.password;
    return res.json({ 
      message: 'Registrasi Pemilik Kost Berhasil! Identitas KTP terverifikasi.', 
      uid: generatedUid,
      user: safeUser,
      kostName: kostName || 'Kost Baru'
    });

  } else if (role === 'user') {
    db.users.push(newUser);
    addActivity(db, 'GLOBAL', 'pengguna', `Penghuni baru ${newUser.name} mendaftar (NIK terverifikasi)`);
    writeDB(db);

    const safeUser = { ...newUser };
    delete safeUser.password;
    return res.json({ 
      message: 'Berhasil mendaftar sebagai pencari kost! Identitas KTP terverifikasi.',
      user: safeUser
    });

  } else {
    return res.status(400).json({ error: 'Role tidak valid' });
  }
});

// Endpoint: Update Tenant Bedsheets
app.put('/api/users/:id/bedsheets', (req, res) => {
  const { id } = req.params;
  const { bedsheets } = req.body;
  const db = getDB();
  
  const user = db.users.find(u => String(u.id) === String(id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.bedsheets = bedsheets;
  writeDB(db);
  res.json({ message: 'Bedsheets updated', bedsheets });
});

// Endpoint: Login (Mendukung Login via Email, Nama, atau NIK)
app.post('/api/login', (req, res) => {
  const identifier = (req.body.loginId || req.body.email || req.body.username || req.body.nik || '').trim();
  const password = req.body.password;
  const db = getDB();

  const user = db.users.find(u => 
    (
      (u.email && u.email.toLowerCase() === identifier.toLowerCase()) || 
      (u.name && u.name.toLowerCase() === identifier.toLowerCase()) ||
      (u.nik && String(u.nik) === identifier)
    ) && 
    u.password === password
  );
  if (!user) return res.status(401).json({ error: 'Email/NIK/Nama atau password salah' });

  const safeUser = { ...user };
  delete safeUser.password;

  if (user.role === 'owner') {
    const ownerKosts = db.kosts.filter(k => String(k.ownerId) === String(user.id) || (user.kostUid && k.uid === user.kostUid));
    const activeKost = ownerKosts.find(k => k.uid === user.kostUid) || ownerKosts[0];
    if (activeKost) {
      user.kostUid = activeKost.uid;
      safeUser.kostUid = activeKost.uid;
    }
    return res.json({ 
      user: safeUser, 
      kostName: activeKost ? activeKost.kostName : 'KostKu',
      ownedKosts: ownerKosts.map(k => ({
        uid: k.uid,
        kostName: k.kostName,
        address: k.address || '',
        roomCount: k.settings?.rooms?.length || 0,
        images: k.images || []
      }))
    });
  } else if (user.role === 'staff') {
    const kost = db.kosts.find(k => k.uid === user.kostUid);
    return res.json({ 
      user: safeUser, 
      kostName: kost ? kost.kostName : 'KostKu',
      staffRole: user.jobTitle || 'Penjaga Kost'
    });
  } else if (user.role === 'user') {
    const kost = db.kosts.find(k => k.uid === user.kostUid);
    return res.json({ user: safeUser, kostName: kost ? kost.kostName : 'KostKu' });
  } else {
    return res.json({ user: safeUser, kostName: 'KostKu Admin' });
  }
});

// Endpoint: Get Users
app.get('/api/users', (req, res) => {
  const { kostUid } = req.query;
  const db = getDB();

  let filtered = db.users.filter(u => u.kostUid === kostUid && u.role === 'user');
  
  filtered = filtered.map(u => {
    const safe = { ...u };
    delete safe.password;
    return safe;
  });

  res.json(filtered);
});

// Endpoint: Get Single User Profile & Status (Auto-sync for tenant & owner)
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  let user = db.users.find(u => String(u.id) === String(id));

  // If user not in memory (stateless lambda restart), search in applications
  if (!user) {
    const app = (db.applications || []).find(a => String(a.userId) === String(id));
    if (app) {
      user = {
        id: app.userId,
        name: app.userName,
        email: app.userEmail || '',
        phone: app.phone || '',
        role: 'user',
        kostUid: app.status === 'approved' ? app.kostUid : undefined,
        kamar: app.status === 'approved' ? app.kamar : undefined
      };
      db.users.push(user);
    }
  }

  // Graceful fallback for new or unassigned users
  if (!user) {
    user = {
      id,
      name: 'Penghuni',
      role: 'user'
    };
  }

  const safeUser = { ...user };
  delete safeUser.password;

  let kostName = 'KostKu';
  if (user.kostUid) {
    const kost = db.kosts.find(k => k.uid === user.kostUid);
    if (kost) kostName = kost.kostName;
  }

  // Find latest application if tenant
  const latestApp = (db.applications || [])
    .filter(a => String(a.userId) === String(user.id) || (user.email && a.userEmail === user.email) || (user.phone && a.phone === user.phone))
    .sort((a,b) => new Date(b.date) - new Date(a.date))[0] || null;

  if (latestApp && (!kostName || kostName === 'KostKu') && latestApp.kostUid) {
    const k = db.kosts.find(k => k.uid === latestApp.kostUid);
    if (k) kostName = k.kostName;
  }

  res.json({
    user: safeUser,
    kostName,
    activeApplication: latestApp
  });
});

// Endpoint: Delete User
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  
  const index = db.users.findIndex(u => String(u.id) === String(id) && u.role === 'user');
  if (index === -1) return res.status(404).json({ error: 'Penghuni tidak ditemukan' });
  
  const removedUser = db.users[index];
  db.users.splice(index, 1);
  
  addActivity(db, removedUser.kostUid, 'pengguna', `Penghuni Kamar ${removedUser.kamar} (${removedUser.name}) telah dihapus`);
  
  writeDB(db);
  res.json({ message: 'Penghuni berhasil dihapus' });
});

// ── OWNER MULTI-PROPERTIES (MULTI-KOST) ENDPOINTS ───────────────

// Endpoint: Get all kosts owned by an owner
app.get('/api/owner/kosts', (req, res) => {
  const { ownerId } = req.query;
  if (!ownerId) return res.status(400).json({ error: 'ownerId diperlukan' });
  const db = getDB();

  const owner = db.users.find(u => String(u.id) === String(ownerId));
  if (!owner) return res.status(404).json({ error: 'Akun owner tidak ditemukan' });

  // Find all kosts where ownerId matches OR owner's current kostUid matches
  const kosts = db.kosts.filter(k => 
    String(k.ownerId) === String(ownerId) || 
    (owner.kostUid && k.uid === owner.kostUid)
  );

  const enrichedKosts = kosts.map(k => {
    const rooms = k.settings?.rooms || [];
    const totalRooms = rooms.length;
    const occupiedUsers = db.users.filter(u => u.kostUid === k.uid && u.role === 'user');
    const occupiedCount = occupiedUsers.length;
    const complaintsCount = (db.complaints || []).filter(c => c.kostUid === k.uid && c.status !== 'selesai').length;
    
    // Revenue calculations
    const activeInvoices = (db.invoices || []).filter(i => i.kostUid === k.uid);
    const paidRevenue = activeInvoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const potentialRevenue = rooms.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

    return {
      uid: k.uid,
      kostName: k.kostName,
      address: k.address || '',
      type: k.type || 'Campur',
      images: k.images || [],
      location: k.location || null,
      totalRooms,
      occupiedCount,
      availableCount: Math.max(0, totalRooms - occupiedCount),
      occupancyRate: totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0,
      complaintsCount,
      paidRevenue,
      potentialRevenue,
      isCurrentlyActive: owner.kostUid === k.uid
    };
  });

  res.json(enrichedKosts);
});

// Endpoint: Create a new kost for an existing owner
app.post('/api/owner/kosts', (req, res) => {
  const { ownerId, kostName, address, lat, lng, imageFront, roomPhoto, gmapsUrl, floorPlan, description, type, roomsCount, defaultPrice } = req.body;
  const db = getDB();

  if (!ownerId) return res.status(400).json({ error: 'ownerId wajib disertakan' });
  if (!kostName || !kostName.trim()) return res.status(400).json({ error: 'Nama kost wajib diisi' });

  const owner = db.users.find(u => String(u.id) === String(ownerId));
  if (!owner) return res.status(404).json({ error: 'Akun owner tidak ditemukan' });

  // Generate unique UID
  const generatedUid = 'KOST-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const defaultFloorPlan = floorPlan || {
    dimensions: '3.0m x 4.0m',
    bedType: 'super_single',
    furnitures: ['wardrobe', 'desk', 'bathroom', 'ac', 'window'],
    generated: true,
    mode: 'ai'
  };

  // Generate initial rooms if requested
  const initialRooms = [];
  const count = Number(roomsCount) || 8;
  const price = Number(defaultPrice) || 1500000;
  for (let i = 1; i <= count; i++) {
    const numStr = i < 10 ? `10${i}` : `1${i}`;
    initialRooms.push({
      id: `RM-${generatedUid}-${numStr}`,
      number: numStr,
      price: price,
      size: defaultFloorPlan.dimensions || '3.0m x 4.0m',
      capacity: 1,
      status: 'available',
      roomPhoto: roomPhoto || '',
      floorPlan: defaultFloorPlan,
      facilities: ['WiFi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Meja Belajar', 'Lemari', 'AC']
    });
  }

  const defaultImage = imageFront || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80';
  const kostImages = [defaultImage];
  if (roomPhoto && !kostImages.includes(roomPhoto)) {
    kostImages.push(roomPhoto);
  }

  const effectiveLat = Number(lat) || -6.9827;
  const effectiveLng = Number(lng) || 110.4091;

  const newKost = {
    uid: generatedUid,
    kostName: kostName.trim(),
    ownerId: owner.id,
    address: address || '',
    type: type || 'Campur',
    location: {
      lat: effectiveLat,
      lng: effectiveLng
    },
    gmapsUrl: gmapsUrl || `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`,
    roomPhoto: roomPhoto || '',
    floorPlan: defaultFloorPlan,
    images: kostImages,
    description: description || `Properti cabang baru ${kostName} dikelola oleh ${owner.name}`,
    status: 'verified',
    settings: {
      rooms: initialRooms,
      employees: [],
      bedsheetCount: count * 2,
      waterRate: 5000,
      electricityRate: 2000,
      depositAmount: 500000
    }
  };

  db.kosts.push(newKost);

  // Set as active kost for the owner
  owner.kostUid = generatedUid;

  addActivity(db, generatedUid, 'pengaturan', `Cabang baru "${kostName}" berhasil ditambahkan ke portofolio`);
  writeDB(db);

  res.json({
    message: 'Properti Kost berhasil ditambahkan!',
    kost: newKost,
    activeKostUid: generatedUid
  });
});

// Endpoint: Switch active kost
app.put('/api/owner/switch-kost', (req, res) => {
  const { userId, targetKostUid } = req.body;
  if (!userId || !targetKostUid) return res.status(400).json({ error: 'userId dan targetKostUid wajib disertakan' });
  const db = getDB();

  const user = db.users.find(u => String(u.id) === String(userId));
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

  const targetKost = db.kosts.find(k => k.uid === targetKostUid);
  if (!targetKost) return res.status(404).json({ error: 'Properti kost tujuan tidak ditemukan' });

  user.kostUid = targetKostUid;
  writeDB(db);

  const safe = { ...user };
  delete safe.password;

  res.json({
    message: `Berhasil beralih ke properti ${targetKost.kostName}`,
    user: safe,
    activeKostUid: targetKostUid,
    activeKostName: targetKost.kostName
  });
});

// Endpoint: Portfolio Overview across all owned kosts
app.get('/api/owner/portfolio', (req, res) => {
  const { ownerId } = req.query;
  if (!ownerId) return res.status(400).json({ error: 'ownerId diperlukan' });
  const db = getDB();

  const owner = db.users.find(u => String(u.id) === String(ownerId));
  if (!owner) return res.status(404).json({ error: 'Akun owner tidak ditemukan' });

  const kosts = db.kosts.filter(k => 
    String(k.ownerId) === String(ownerId) || 
    (owner.kostUid && k.uid === owner.kostUid)
  );

  let totalRooms = 0;
  let totalOccupied = 0;
  let totalPaidRevenue = 0;
  let totalPotentialRevenue = 0;
  let totalComplaints = 0;

  const propertySummaries = kosts.map(k => {
    const rooms = k.settings?.rooms || [];
    const roomsLen = rooms.length;
    const occupied = db.users.filter(u => u.kostUid === k.uid && u.role === 'user').length;
    const complaints = (db.complaints || []).filter(c => c.kostUid === k.uid && c.status !== 'selesai').length;
    const paid = (db.invoices || []).filter(i => i.kostUid === k.uid && i.status === 'paid').reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const potential = rooms.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

    totalRooms += roomsLen;
    totalOccupied += occupied;
    totalPaidRevenue += paid;
    totalPotentialRevenue += potential;
    totalComplaints += complaints;

    return {
      uid: k.uid,
      kostName: k.kostName,
      address: k.address || '',
      type: k.type || 'Campur',
      images: k.images || [],
      totalRooms: roomsLen,
      occupiedCount: occupied,
      availableCount: Math.max(0, roomsLen - occupied),
      occupancyRate: roomsLen > 0 ? Math.round((occupied / roomsLen) * 100) : 0,
      complaintsCount: complaints,
      paidRevenue: paid,
      potentialRevenue: potential,
      isCurrentlyActive: owner.kostUid === k.uid
    };
  });

  const overallOccupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;

  res.json({
    ownerName: owner.name,
    totalProperties: kosts.length,
    totalRooms,
    totalOccupied,
    totalAvailable: Math.max(0, totalRooms - totalOccupied),
    overallOccupancyRate,
    totalPaidRevenue,
    totalPotentialRevenue,
    totalComplaints,
    properties: propertySummaries
  });
});

// Endpoint: Update User Profile (User Setting)
app.put('/api/user/profile', (req, res) => {
  const { id, name, email, phone, currentPassword, newPassword, picture } = req.body;
  const db = getDB();

  const user = db.users.find(u => String(u.id) === String(id));
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

  // If changing password, verify current password (unless google auth without password)
  if (newPassword && newPassword.trim()) {
    if (user.authProvider !== 'google' && user.password && user.password !== currentPassword) {
      return res.status(400).json({ error: 'Kata sandi saat ini tidak cocok' });
    }
    user.password = newPassword.trim();
  }

  if (name && name.trim()) user.name = name.trim();
  if (email && email.includes('@')) user.email = email.trim().toLowerCase();
  if (phone !== undefined) user.phone = phone.trim();
  if (picture !== undefined) user.picture = picture;

  writeDB(db);

  const safe = { ...user };
  delete safe.password;
  res.json({ message: 'Profil berhasil diperbarui', user: safe });
});

// Endpoint: Get Settings
app.get('/api/settings', (req, res) => {
  const { kostUid } = req.query;
  const db = getDB();
  
  const kost = db.kosts.find(k => k.uid === kostUid);
  if (!kost) return res.status(404).json({ error: 'Kost tidak ditemukan' });
  
  const s = kost.settings || {};
  if (!s.rooms) s.rooms = [];
  if (!s.employees) s.employees = [];
  
  res.json(s);
});

// Endpoint: Update Settings
app.put('/api/settings', (req, res) => {
  const { kostUid } = req.query;
  const { rooms, employees, bedsheetCount, waterRate, electricityRate, depositAmount } = req.body;
  const db = getDB();
  
  const index = db.kosts.findIndex(k => k.uid === kostUid);
  if (index === -1) return res.status(404).json({ error: 'Kost tidak ditemukan' });
  
  db.kosts[index].settings = {
    rooms: Array.isArray(rooms) ? rooms : [],
    employees: Array.isArray(employees) ? employees : [],
    bedsheetCount: Number(bedsheetCount) || 0,
    waterRate: Number(waterRate) || 0,
    electricityRate: Number(electricityRate) || 0,
    depositAmount: Number(depositAmount) || 0
  };
  
  addActivity(db, kostUid, 'pengaturan', 'Pengaturan kost telah diperbarui');
  writeDB(db);
  
  res.json(db.kosts[index].settings);
});

// ── OWNER STAFF MANAGEMENT ENDPOINTS ───────────────────────

// Endpoint: Get list of staff for a kost or owner
app.get('/api/owner/staff', (req, res) => {
  const { kostUid, ownerId } = req.query;
  const db = getDB();

  let staffList = db.users.filter(u => u.role === 'staff');
  if (kostUid) {
    staffList = staffList.filter(u => u.kostUid === kostUid);
  } else if (ownerId) {
    const ownedKostUids = db.kosts.filter(k => String(k.ownerId) === String(ownerId)).map(k => k.uid);
    staffList = staffList.filter(u => ownedKostUids.includes(u.kostUid) || String(u.ownerId) === String(ownerId));
  }

  const enrichedStaff = staffList.map(u => {
    const assignedKost = db.kosts.find(k => k.uid === u.kostUid);
    const safe = { ...u };
    delete safe.password;
    safe.kostName = assignedKost ? assignedKost.kostName : 'KostKu';
    return safe;
  });

  res.json(enrichedStaff);
});

// Endpoint: Create a new staff account with login credentials
app.post('/api/owner/staff', (req, res) => {
  const { ownerId, kostUid, name, email, password, phone, jobTitle, salary } = req.body;
  if (!name || !email || !password || !kostUid) {
    return res.status(400).json({ error: 'Nama, email, password, dan cabang kost wajib diisi' });
  }

  const db = getDB();
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = db.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'Email sudah terdaftar untuk akun lain' });
  }

  const assignedKost = db.kosts.find(k => k.uid === kostUid);
  if (!assignedKost) {
    return res.status(404).json({ error: 'Cabang kost tidak ditemukan' });
  }

  const newStaff = {
    id: Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: password.trim(),
    phone: phone || '',
    role: 'staff',
    jobTitle: jobTitle || 'Penjaga Kost',
    salary: Number(salary) || 0,
    kostUid,
    ownerId: ownerId || assignedKost.ownerId,
    createdAt: new Date().toISOString()
  };

  db.users.push(newStaff);

  // Sync to assigned kost settings.employees if present
  if (assignedKost.settings) {
    if (!assignedKost.settings.employees) assignedKost.settings.employees = [];
    const empIndex = assignedKost.settings.employees.findIndex(e => e.email === cleanEmail);
    if (empIndex === -1) {
      assignedKost.settings.employees.push({
        id: String(newStaff.id),
        name: newStaff.name,
        role: newStaff.jobTitle,
        salary: newStaff.salary,
        phone: newStaff.phone,
        email: newStaff.email,
        hasLogin: true
      });
    }
  }

  addActivity(db, kostUid, 'pengaturan', `Akun staf baru "${newStaff.name}" (${newStaff.jobTitle}) berhasil dibuat`);
  writeDB(db);

  const safe = { ...newStaff };
  delete safe.password;
  safe.kostName = assignedKost.kostName;

  res.status(201).json({
    message: 'Akun login staf berhasil dibuat!',
    staff: safe
  });
});

// Endpoint: Update staff details or reset password
app.put('/api/owner/staff/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, jobTitle, salary, kostUid, newPassword } = req.body;
  const db = getDB();

  const staff = db.users.find(u => String(u.id) === String(id) && u.role === 'staff');
  if (!staff) return res.status(404).json({ error: 'Akun staf tidak ditemukan' });

  if (name) staff.name = name.trim();
  if (phone !== undefined) staff.phone = phone;
  if (jobTitle) staff.jobTitle = jobTitle;
  if (salary !== undefined) staff.salary = Number(salary);
  if (kostUid) staff.kostUid = kostUid;
  if (newPassword && newPassword.trim()) staff.password = newPassword.trim();

  // Sync with kost settings.employees
  const assignedKost = db.kosts.find(k => k.uid === staff.kostUid);
  if (assignedKost?.settings?.employees) {
    const emp = assignedKost.settings.employees.find(e => String(e.id) === String(id) || e.email === staff.email);
    if (emp) {
      emp.name = staff.name;
      emp.role = staff.jobTitle;
      emp.salary = staff.salary;
      emp.phone = staff.phone;
    }
  }

  writeDB(db);

  const safe = { ...staff };
  delete safe.password;
  safe.kostName = assignedKost ? assignedKost.kostName : 'KostKu';

  res.json({ message: 'Data staf berhasil diperbarui', staff: safe });
});

// Endpoint: Delete staff account
app.delete('/api/owner/staff/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const index = db.users.findIndex(u => String(u.id) === String(id) && u.role === 'staff');
  if (index === -1) return res.status(404).json({ error: 'Akun staf tidak ditemukan' });

  const staff = db.users[index];
  db.users.splice(index, 1);

  // Remove from settings.employees
  const assignedKost = db.kosts.find(k => k.uid === staff.kostUid);
  if (assignedKost?.settings?.employees) {
    assignedKost.settings.employees = assignedKost.settings.employees.filter(e => String(e.id) !== String(id) && e.email !== staff.email);
  }

  writeDB(db);
  res.json({ message: 'Akun staf berhasil dihapus' });
});

// --- IOT METERAN ENDPOINTS ---
app.post('/api/iot/meteran', (req, res) => {
  const { kostUid, kamar, type, value } = req.body;
  if (!kostUid || !kamar || !type || value === undefined) {
    return res.status(400).json({ error: 'Parameter tidak lengkap (kostUid, kamar, type, value)' });
  }

  const db = getDB();
  const dateStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  // Find existing record for this month
  let meter = db.iot_meters.find(m => m.kostUid === kostUid && m.kamar === kamar && m.type === type && m.month === dateStr);
  
  if (meter) {
    meter.value = value;
    meter.lastUpdate = new Date().toISOString();
  } else {
    db.iot_meters.push({
      id: 'METER-' + Date.now(),
      kostUid,
      kamar,
      type, // 'air' or 'listrik'
      month: dateStr,
      value: value,
      lastUpdate: new Date().toISOString()
    });
  }

  writeDB(db);
  res.json({ message: 'Data meteran berhasil disimpan', data: { kamar, type, value, month: dateStr } });
});

app.get('/api/iot/meteran', (req, res) => {
  const { kostUid, month } = req.query;
  const db = getDB();
  let filtered = db.iot_meters.filter(m => m.kostUid === kostUid);
  if (month) {
    filtered = filtered.filter(m => m.month === month);
  }
  res.json(filtered);
});

// --- INVOICES (TAGIHAN) ---
app.get('/api/invoices', (req, res) => {
  const { kostUid, userId } = req.query;
  const db = getDB();
  let filtered = db.invoices;
  if (kostUid) filtered = filtered.filter(i => i.kostUid === kostUid);
  if (userId) filtered = filtered.filter(i => String(i.userId) === String(userId));
  res.json(filtered.sort((a,b) => new Date(b.date) - new Date(a.date)));
});

app.put('/api/invoices/:id/verify', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  
  const inv = db.invoices.find(i => String(i.id) === String(id));
  if (!inv) return res.status(404).json({ error: 'Tagihan tidak ditemukan' });
  
  inv.status = 'lunas';
  inv.verifyDate = new Date().toISOString();
  
  addActivity(db, inv.kostUid, 'keuangan', `Tagihan Kamar ${inv.kamar} (${inv.userName}) sebesar Rp ${inv.total} telah dilunasi`);
  writeDB(db);
  res.json(inv);
});

// --- EXPENSES (PENGELUARAN) ---
app.get('/api/expenses', (req, res) => {
  const { kostUid } = req.query;
  const db = getDB();
  const filtered = db.expenses.filter(e => e.kostUid === kostUid);
  res.json(filtered.sort((a,b) => new Date(b.date) - new Date(a.date)));
});

app.post('/api/expenses', (req, res) => {
  const { kostUid, title, amount, category } = req.body;
  if (!title || !amount) return res.status(400).json({ error: 'Data tidak lengkap' });
  
  const db = getDB();
  const exp = {
    id: 'EXP-' + Date.now(),
    kostUid,
    title,
    amount: Number(amount),
    category: category || 'Operasional',
    date: new Date().toISOString()
  };
  db.expenses.push(exp);
  
  addActivity(db, kostUid, 'keuangan', `Pengeluaran baru: ${title} (Rp ${amount})`);
  writeDB(db);
  res.json(exp);
});

app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const index = db.expenses.findIndex(e => String(e.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Tidak ditemukan' });
  db.expenses.splice(index, 1);
  writeDB(db);
  res.json({ message: 'Deleted' });
});


// Endpoint: Get Complaints
app.get('/api/complaints', (req, res) => {
  const { kostUid, userId } = req.query;
  const db = getDB();

  let filtered = db.complaints;
  if (kostUid) filtered = filtered.filter(c => c.kostUid === kostUid);
  else if (userId) filtered = filtered.filter(c => String(c.userId) === String(userId));

  res.json(filtered.sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// Endpoint: Create Complaint
app.post('/api/complaints', (req, res) => {
  const { kostUid, userId, userName, kamar, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Keluhan tidak boleh kosong' });

  const db = getDB();
  const newComplaint = {
    id: 'COMP-' + Date.now(),
    kostUid, userId, userName, kamar, text,
    status: 'pending', 
    date: new Date().toISOString()
  };

  db.complaints.push(newComplaint);
  addActivity(db, kostUid, 'komplain', `Komplain baru dari Kamar ${kamar}: "${text.length > 20 ? text.substring(0,20)+'...' : text}"`);
  writeDB(db);

  res.json(newComplaint);
});

// Endpoint: Update Complaint Status
app.put('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const db = getDB();
  const index = db.complaints.findIndex(c => String(c.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Komplain tidak ditemukan' });
  
  db.complaints[index].status = status;
  
  const statusText = status === 'selesai' ? 'telah selesai' : 'sedang diproses';
  addActivity(db, db.complaints[index].kostUid, 'komplain', `Komplain Kamar ${db.complaints[index].kamar} ${statusText}`);
  writeDB(db);
  
  res.json(db.complaints[index]);
});

// Endpoint: Get Activities
app.get('/api/activities', (req, res) => {
  const { kostUid } = req.query;
  const db = getDB();

  let filtered = db.activities || [];
  if (kostUid) filtered = filtered.filter(a => a.kostUid === kostUid);

  res.json(filtered.sort((a,b) => new Date(b.time) - new Date(a.time)));
});


// --- NEW ENDPOINTS FOR MARKETPLACE ---

// --- GOOGLE AUTH & OAUTH CONFIG ENDPOINTS ---

// Endpoint: Real Google OAuth & Personal Google Account Auth
app.post('/api/auth/google', (req, res) => {
  const { credential, email, name, role, picture, googleId, kostName } = req.body;
  const db = getDB();

  let effectiveEmail = (email || '').trim().toLowerCase();
  let effectiveName = (name || '').trim();
  let effectivePicture = picture || '';
  let effectiveGoogleId = googleId || '';

  // If a real Google JWT credential token is provided, decode payload safely
  if (credential && typeof credential === 'string') {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = Buffer.from(base64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);
        if (payload.email) effectiveEmail = payload.email.trim().toLowerCase();
        if (payload.name) effectiveName = payload.name;
        if (payload.picture) effectivePicture = payload.picture;
        if (payload.sub) effectiveGoogleId = payload.sub;
      }
    } catch (e) {
      console.warn('[Google Auth] Gagal mengurai JWT credential token:', e.message);
    }
  }

  if (!effectiveEmail || !effectiveEmail.includes('@')) {
    return res.status(400).json({ error: 'Email Google yang valid diperlukan' });
  }

  // Find existing user by email (case-insensitive)
  let user = db.users.find(u => u.email && u.email.toLowerCase() === effectiveEmail);
  let resolvedKostName = 'KostKu';

  if (user) {
    // Existing user: Update Google metadata if provided
    if (effectivePicture && !user.picture) user.picture = effectivePicture;
    if (effectiveGoogleId && !user.googleId) user.googleId = effectiveGoogleId;
    user.authProvider = 'google';

    // Locate Kost
    if (user.role === 'owner') {
      const kost = db.kosts.find(k => String(k.ownerId) === String(user.id) || (user.kostUid && k.uid === user.kostUid));
      if (kost) {
        resolvedKostName = kost.kostName;
        user.kostUid = kost.uid;
      }
    } else if (user.kostUid) {
      const kost = db.kosts.find(k => k.uid === user.kostUid);
      if (kost) resolvedKostName = kost.kostName;
    }

    addActivity(db, user.kostUid || 'GLOBAL', 'pengguna', `${user.name} berhasil masuk via Akun Google (${effectiveEmail})`);
    writeDB(db);
  } else {
    // New user registration via Google
    const targetRole = role === 'owner' ? 'owner' : 'user';
    const newUserId = Date.now();
    const finalName = effectiveName || effectiveEmail.split('@')[0];

    if (targetRole === 'owner') {
      const generatedUid = 'KOST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const finalKostName = kostName || `Kost ${finalName}`;

      const newKost = {
        uid: generatedUid,
        kostName: finalKostName,
        ownerId: newUserId,
        address: 'Jl. Utama No. 1',
        location: { lat: -6.2088, lng: 106.8456 },
        images: [],
        status: 'verified',
        description: `Kost terverifikasi milik ${finalName}`,
        settings: {
          rooms: [
            { id: String(Date.now() + 1), number: '101', price: 1200000, size: '3x4', capacity: 1 },
            { id: String(Date.now() + 2), number: '102', price: 1500000, size: '4x4', capacity: 1 }
          ],
          employees: [],
          bedsheetCount: 20,
          waterRate: 0,
          electricityRate: 0,
          depositAmount: 0
        }
      };

      db.kosts.push(newKost);

      user = {
        id: newUserId,
        name: finalName,
        email: effectiveEmail,
        role: 'owner',
        kostUid: generatedUid,
        picture: effectivePicture || '',
        authProvider: 'google',
        googleId: effectiveGoogleId || '',
        password: 'google-oauth-' + Math.random().toString(36).substring(2, 8)
      };

      db.users.push(user);
      resolvedKostName = finalKostName;
      addActivity(db, generatedUid, 'pengguna', `Pemilik baru ${finalName} terdaftar via Akun Google (${effectiveEmail}) dan Kost otomatis dibuat`);
    } else {
      user = {
        id: newUserId,
        name: finalName,
        email: effectiveEmail,
        role: 'user',
        picture: effectivePicture || '',
        authProvider: 'google',
        googleId: effectiveGoogleId || '',
        password: 'google-oauth-' + Math.random().toString(36).substring(2, 8)
      };

      db.users.push(user);
      resolvedKostName = 'KostKu';
      addActivity(db, 'GLOBAL', 'pengguna', `Penghuni baru ${finalName} terdaftar via Akun Google (${effectiveEmail})`);
    }

    writeDB(db);
  }

  const safeUser = { ...user };
  delete safeUser.password;

  let ownedKosts = [];
  if (user.role === 'owner') {
    const kList = db.kosts.filter(k => String(k.ownerId) === String(user.id) || (user.kostUid && k.uid === user.kostUid));
    ownedKosts = kList.map(k => ({
      uid: k.uid,
      kostName: k.kostName,
      address: k.address || '',
      roomCount: k.settings?.rooms?.length || 0,
      images: k.images || []
    }));
  }

  return res.json({
    user: safeUser,
    kostName: resolvedKostName,
    ownedKosts,
    token: `token_google_${safeUser.id}_${Date.now()}`
  });
});

// Endpoint: Check email status for Google account preview
app.get('/api/auth/check-email', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email parameter diperlukan' });
  const db = getDB();
  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
  if (user) {
    let kostName = 'KostKu';
    if (user.role === 'owner') {
      const kost = db.kosts.find(k => String(k.ownerId) === String(user.id) || (user.kostUid && k.uid === user.kostUid));
      if (kost) kostName = kost.kostName;
    } else if (user.kostUid) {
      const kost = db.kosts.find(k => k.uid === user.kostUid);
      if (kost) kostName = kost.kostName;
    }
    return res.json({
      exists: true,
      name: user.name,
      role: user.role,
      jobTitle: user.jobTitle || (user.role === 'staff' ? 'Penjaga Kost' : undefined),
      kostName,
      picture: user.picture || ''
    });
  }
  return res.json({ exists: false });
});

// Endpoint: Google Client ID Configuration
app.get('/api/config/google-client-id', (req, res) => {
  const db = getDB();
  const clientId = db.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
  res.json({ clientId });
});

app.post('/api/config/google-client-id', (req, res) => {
  const { clientId } = req.body;
  const db = getDB();
  db.googleClientId = (clientId || '').trim();
  writeDB(db);
  res.json({ ok: true, clientId: db.googleClientId });
});

// Endpoint: Public Kost List
app.get('/api/public/kosts', (req, res) => {
  const db = getDB();
  const verifiedKosts = (db.kosts || []).filter(k => k.status === 'verified' || !k.status).map(k => {
    // Only send public safe data
    return {
      uid: k.uid,
      kostName: k.kostName,
      type: k.type || 'Campur',
      city: k.city || 'Jakarta',
      address: k.address,
      location: k.location || { lat: -6.2088, lng: 106.8456 },
      gmapsUrl: k.gmapsUrl || (k.location?.lat ? `https://maps.google.com/?q=${k.location.lat},${k.location.lng}` : ''),
      roomPhoto: k.roomPhoto || '',
      floorPlan: k.floorPlan || null,
      rating: k.rating || 4.9,
      reviewCount: k.reviewCount || 25,
      images: k.images || [],
      layoutImage: k.layoutImage || '',
      layoutInfo: k.layoutInfo || {
        roomDimensions: "3.5m x 4.0m",
        roomArea: "14 m²",
        buildingArea: "350 m² (2 Lantai)",
        totalFloors: 2,
        totalRooms: 10,
        bathroomType: "Kamar Mandi Dalam",
        windowFacing: "Jendela Hadap Luar (Sirkulasi Bagus)",
        features: ["Kasur Springbed Nyaman", "Meja Kerja & Lemari", "Kamar Mandi Dalam"]
      },
      facilities: k.facilities || ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Parkir Motor/Mobil'],
      rules: k.rules || ['Akses 24 Jam', 'Dilarang Merokok di Dalam Kamar', 'Menjaga Ketenangan'],
      description: k.description || '',
      rooms: (k.settings?.rooms || []).map(r => ({
        id: r.id,
        number: r.number,
        price: r.price,
        size: r.size || '3x4',
        capacity: r.capacity || 1,
        status: r.status || 'available',
        roomPhoto: r.roomPhoto || k.roomPhoto || '',
        floorPlan: r.floorPlan || k.floorPlan || null
      }))
    };
  });
  res.json(verifiedKosts);
});

// Endpoint: Apply to Kost
app.post('/api/kosts/apply', (req, res) => {
  const { kostUid, userId, kamar, phone, userName, userEmail, duration, checkInDate, job, notes } = req.body;
  const db = getDB();
  
  // Find user by ID, email, or phone
  let user = db.users.find(u => 
    (userId && String(u.id) === String(userId)) || 
    (userEmail && u.email && u.email.toLowerCase() === String(userEmail).toLowerCase()) ||
    (phone && u.phone && u.phone === phone)
  );

  // If user doesn't exist in serverless in-memory DB, auto-register or synthesize user object!
  if (!user) {
    const effectiveId = userId || ('USER-' + Date.now());
    const effectiveName = userName || (userEmail ? userEmail.split('@')[0] : 'Calon Penghuni');
    user = {
      id: effectiveId,
      name: effectiveName,
      email: userEmail || '',
      phone: phone || '',
      role: 'user',
      job: job || 'Mahasiswa'
    };
    db.users.push(user);
    writeDB(db);
  }
  
  const kost = db.kosts.find(k => k.uid === kostUid);
  if (!kost) return res.status(404).json({ error: 'Kost tidak ditemukan' });
  
  // Check if already applied with pending status for this kost
  const existingPending = db.applications.find(a => 
    (String(a.userId) === String(user.id) || (phone && a.phone === phone)) && 
    a.kostUid === kostUid && 
    a.status === 'pending'
  );
  if (existingPending) {
    return res.status(400).json({ error: 'Anda sudah memiliki pengajuan yang pending untuk kost ini' });
  }
  
  const newApp = {
    id: 'APP-' + Date.now(),
    kostUid,
    userId: user.id,
    userName: userName || user.name || 'Calon Penghuni',
    userEmail: userEmail || user.email || '',
    kamar,
    phone: phone || user.phone || '',
    duration: duration || 1,
    checkInDate: checkInDate || new Date().toISOString(),
    job: job || 'Mahasiswa',
    notes: notes || '',
    status: 'pending',
    date: new Date().toISOString()
  };

  db.applications.push(newApp);
  
  addActivity(db, kostUid, 'pengguna', `Ada pengajuan sewa baru dari ${newApp.userName} untuk Kamar ${kamar}`);
  writeDB(db);
  
  res.json({ message: 'Pengajuan sewa berhasil dikirim ke pemilik kost', application: newApp });
});

// Endpoint: Get Applications (Owner Dashboard)
app.get('/api/applications', (req, res) => {
  const { kostUid } = req.query;
  const db = getDB();
  const apps = db.applications.filter(a => a.kostUid === kostUid);
  res.json(apps.sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// Endpoint: Process Application
app.put('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'
  const db = getDB();
  
  const appIndex = db.applications.findIndex(a => String(a.id) === String(id));
  if (appIndex === -1) return res.status(404).json({ error: 'Aplikasi tidak ditemukan' });
  
  const application = db.applications[appIndex];
  
  if (action === 'approve') {
    application.status = 'approved';
    let user = db.users.find(u => String(u.id) === String(application.userId));
    if (!user && (application.userEmail || application.phone)) {
      user = db.users.find(u => 
        (application.userEmail && u.email && u.email.toLowerCase() === application.userEmail.toLowerCase()) ||
        (application.phone && u.phone && u.phone === application.phone)
      );
    }
    if (!user) {
      user = {
        id: application.userId || ('USER-' + Date.now()),
        name: application.userName || 'Penghuni',
        email: application.userEmail || '',
        phone: application.phone || '',
        role: 'user'
      };
      db.users.push(user);
    }

    user.kostUid = application.kostUid;
    user.kamar = application.kamar;
    user.phone = application.phone || user.phone;
    user.bedsheets = user.bedsheets || 0;
    
    const kost = db.kosts.find(k => k.uid === application.kostUid);
    const roomSettings = (kost?.settings?.rooms || []).find(r => r.number === application.kamar);
    
    // Mark room occupied in kost settings
    if (kost && kost.settings && kost.settings.rooms) {
      const room = kost.settings.rooms.find(r => r.number === application.kamar);
      if (room) {
        room.status = 'occupied';
        room.tenantId = user.id;
        room.tenantName = user.name;
      }
    }

    // Generate Invoice if not already created
    const deposit = kost?.settings?.depositAmount || 0;
    const basePrice = roomSettings?.price || 0;
    const existingInv = (db.invoices || []).find(i => 
      String(i.userId) === String(user.id) && 
      i.kostUid === application.kostUid && 
      i.kamar === application.kamar && 
      i.status === 'pending'
    );

    if (!existingInv) {
      db.invoices.push({
        id: 'INV-' + Date.now(),
        kostUid: application.kostUid,
        userId: user.id,
        userName: user.name,
        kamar: application.kamar,
        date: new Date().toISOString(),
        basePrice: basePrice,
        deposit: deposit,
        waterCost: 0,
        electricityCost: 0,
        total: Number(basePrice) + Number(deposit),
        status: 'pending'
      });
    }
    
    addActivity(db, application.kostUid, 'pengguna', `Pengajuan sewa ${user.name} (Kamar ${application.kamar}) telah disetujui`);
  } else {
    application.status = 'rejected';
    addActivity(db, application.kostUid, 'pengguna', `Pengajuan sewa ${application.userName} (Kamar ${application.kamar}) ditolak`);
  }
  
  writeDB(db);
  res.json(application);
});

// ── UPGRADE: PAYMENT GATEWAY (MIDTRANS / QRIS / VA) ─────────────
app.post('/api/payments/create-transaction', (req, res) => {
  const { invoiceId, kostUid, userId, amount, customerName, roomNumber, paymentMethod } = req.body;
  const db = getDB();
  db.transactions = db.transactions || [];

  const orderId = `ORDER-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
  
  const bankPrefixes = { BCA: '12888', MANDIRI: '89888', BRI: '02888', BNI: '98888' };
  const methodUpper = (paymentMethod || 'QRIS').toUpperCase();
  let vaNumber = null;
  if (methodUpper.includes('BCA') || methodUpper.includes('MANDIRI') || methodUpper.includes('BRI') || methodUpper.includes('BNI')) {
    const bankKey = methodUpper.includes('BCA') ? 'BCA' : methodUpper.includes('MANDIRI') ? 'MANDIRI' : methodUpper.includes('BRI') ? 'BRI' : 'BNI';
    vaNumber = `${bankPrefixes[bankKey]}${String(userId || Math.floor(100000 + Math.random() * 900000)).slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
  }

  const transaction = {
    id: Date.now(),
    orderId,
    invoiceId: invoiceId ? String(invoiceId) : null,
    kostUid,
    userId,
    customerName: customerName || 'Penghuni Kost',
    roomNumber: roomNumber || '-',
    amount: Number(amount || 0),
    paymentMethod: methodUpper,
    vaNumber,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiryTime
  };

  db.transactions.push(transaction);
  writeDB(db);
  res.json(transaction);
});

app.post('/api/payments/simulate-success', (req, res) => {
  const { transactionId, invoiceId } = req.body;
  const db = getDB();
  db.transactions = db.transactions || [];
  db.invoices = db.invoices || [];

  let trx = null;
  if (transactionId) {
    trx = db.transactions.find(t => String(t.id) === String(transactionId) || t.orderId === transactionId);
  }
  
  let invoice = null;
  if (invoiceId) {
    invoice = db.invoices.find(i => String(i.id) === String(invoiceId));
  } else if (trx && trx.invoiceId) {
    invoice = db.invoices.find(i => String(i.id) === String(trx.invoiceId));
  }

  if (trx) {
    trx.status = 'settlement';
    trx.settledAt = new Date().toISOString();
  }

  const receiptNumber = `RCP-KST-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;

  if (invoice) {
    invoice.status = 'lunas';
    invoice.paidAt = new Date().toISOString();
    invoice.paymentMethod = trx ? trx.paymentMethod : 'QRIS INSTANT';
    invoice.receiptNumber = receiptNumber;

    addActivity(db, invoice.kostUid, 'transaksi', `Pembayaran otomatis ${receiptNumber} (${invoice.kamar || ''}) sebesar Rp ${Number(invoice.total || 0).toLocaleString('id-ID')} LUNAS via ${invoice.paymentMethod}`);
    
    // Auto-dispatch receipt email if tenant has email
    const tenantUser = (db.users || []).find(u => String(u.id) === String(invoice.userId)) || {};
    const kost = (db.kosts || []).find(k => k.uid === invoice.kostUid) || {};
    if (tenantUser.email) {
      sendPaymentReceiptEmail({
        toEmail: tenantUser.email,
        receiptNumber,
        invoice,
        kost,
        user: tenantUser
      }).catch(err => console.warn('Auto receipt email fallback:', err.message));
    }
  }

  writeDB(db);
  res.json({
    success: true,
    message: 'Pembayaran berhasil diverifikasi otomatis!',
    receiptNumber,
    invoice,
    transaction: trx
  });
});

// Endpoint: Send Payment Receipt to Email explicitly
app.post('/api/payments/send-receipt-email', async (req, res) => {
  const { invoiceId, email } = req.body;
  const db = getDB();
  const invoice = (db.invoices || []).find(i => String(i.id) === String(invoiceId));
  if (!invoice) return res.status(404).json({ error: 'Tagihan tidak ditemukan' });

  const kost = (db.kosts || []).find(k => k.uid === invoice.kostUid) || {};
  const user = (db.users || []).find(u => String(u.id) === String(invoice.userId)) || {};

  const targetEmail = (email || user.email || '').trim().toLowerCase();
  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({ error: 'Email tujuan tidak valid' });
  }

  const receiptNumber = invoice.receiptNumber || `RCP-KST-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
  invoice.receiptNumber = receiptNumber;
  writeDB(db);

  const emailRes = await sendPaymentReceiptEmail({
    toEmail: targetEmail,
    receiptNumber,
    invoice,
    kost,
    user
  });

  res.json({
    ...emailRes,
    emailSentTo: targetEmail,
    receiptNumber
  });
});

app.get('/api/payments/receipt/:invoiceId', (req, res) => {
  const { invoiceId } = req.params;
  const db = getDB();
  const invoice = (db.invoices || []).find(i => String(i.id) === String(invoiceId));
  if (!invoice) return res.status(404).json({ error: 'Kuitansi tidak ditemukan' });

  const kost = (db.kosts || []).find(k => k.uid === invoice.kostUid) || {};
  const user = (db.users || []).find(u => String(u.id) === String(invoice.userId)) || {};

  res.json({
    receiptNumber: invoice.receiptNumber || `RCP-KST-${invoice.id}`,
    invoice,
    kostName: kost.kostName || 'KostKu Residence',
    kostAddress: kost.address || 'Indonesia',
    tenantName: user.name || invoice.userName || 'Penghuni',
    roomNumber: invoice.kamar,
    paidAt: invoice.paidAt || invoice.date,
    paymentMethod: invoice.paymentMethod || 'QRIS Digital'
  });
});

// ── UPGRADE: E-SIGNATURE & DIGITAL CONTRACT ─────────────────────
app.post('/api/contracts/sign', (req, res) => {
  const { kostUid, userId, signatureDataUrl, signerName, contractTermsVersion } = req.body;
  const db = getDB();
  db.contracts = db.contracts || [];

  const user = (db.users || []).find(u => String(u.id) === String(userId));
  const signedAt = new Date().toISOString();

  const contract = {
    id: Date.now(),
    kostUid,
    userId,
    signerName: signerName || (user ? user.name : 'Penghuni'),
    signatureDataUrl,
    signedAt,
    contractTermsVersion: contractTermsVersion || 'v2.1-2026',
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
    status: 'signed'
  };

  const existingIdx = db.contracts.findIndex(c => String(c.userId) === String(userId) && c.kostUid === kostUid);
  if (existingIdx >= 0) {
    db.contracts[existingIdx] = contract;
  } else {
    db.contracts.push(contract);
  }

  if (user) {
    user.contractSigned = true;
    user.contractSignedAt = signedAt;
    user.signatureDataUrl = signatureDataUrl;
  }

  addActivity(db, kostUid, 'pengguna', `Surat Perjanjian Sewa telah ditandatangani secara digital oleh ${contract.signerName}`);

  writeDB(db);
  res.json({ success: true, contract });
});

app.get('/api/contracts/:userId', (req, res) => {
  const { userId } = req.params;
  const db = getDB();
  const contract = (db.contracts || []).find(c => String(c.userId) === String(userId));
  res.json({ contract: contract || null });
});

// ── UPGRADE: TITIPAN PAKET DIGITAL (PACKAGE LOCKER) ─────────────
app.get('/api/packages', (req, res) => {
  const { kostUid, userId } = req.query;
  const db = getDB();
  db.packages = db.packages || [];

  let list = db.packages;
  if (kostUid) list = list.filter(p => p.kostUid === kostUid);
  if (userId) list = list.filter(p => String(p.userId) === String(userId));

  list = list.sort((a, b) => new Date(b.arrivedAt) - new Date(a.arrivedAt));
  res.json(list);
});

app.post('/api/packages', (req, res) => {
  const { kostUid, userId, tenantName, roomNumber, courier, trackingNumber, note, photoUrl, receivedByStaff } = req.body;
  const db = getDB();
  db.packages = db.packages || [];

  const pkg = {
    id: Date.now(),
    kostUid,
    userId: userId || null,
    tenantName,
    roomNumber,
    courier: courier || 'J&T Express',
    trackingNumber: trackingNumber || `RES-${Math.floor(10000000 + Math.random() * 90000000)}`,
    note: note || '',
    photoUrl: photoUrl || '',
    status: 'di_resepsionis',
    arrivedAt: new Date().toISOString(),
    receivedByStaff: receivedByStaff || 'Penjaga Kost'
  };

  db.packages.push(pkg);
  addActivity(db, kostUid, 'paket', `Paket kurir ${pkg.courier} untuk Kamar ${roomNumber} (${tenantName}) telah tiba di pos jaga`);
  writeDB(db);
  res.json(pkg);
});

app.put('/api/packages/:id/pickup', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.packages = db.packages || [];

  const pkg = db.packages.find(p => String(p.id) === String(id));
  if (!pkg) return res.status(404).json({ error: 'Paket tidak ditemukan' });

  pkg.status = 'sudah_diambil';
  pkg.pickedUpAt = new Date().toISOString();

  addActivity(db, pkg.kostUid, 'paket', `Paket (${pkg.courier}) untuk Kamar ${pkg.roomNumber} telah diambil oleh penghuni`);
  writeDB(db);
  res.json(pkg);
});

// ── UPGRADE: INSPEKSI KAMAR & KALKULATOR DEPOSIT ────────────────
app.get('/api/inspections', (req, res) => {
  const { kostUid } = req.query;
  const db = getDB();
  db.inspections = db.inspections || [];
  let list = db.inspections;
  if (kostUid) list = list.filter(i => i.kostUid === kostUid);
  res.json(list);
});

app.post('/api/inspections', (req, res) => {
  const { kostUid, userId, tenantName, roomNumber, type, checklist, damageCost, depositAmount, finalRefund, notes } = req.body;
  const db = getDB();
  db.inspections = db.inspections || [];

  const inspection = {
    id: Date.now(),
    kostUid,
    userId,
    tenantName,
    roomNumber,
    type: type || 'check_out',
    checklist: checklist || {},
    damageCost: Number(damageCost || 0),
    depositAmount: Number(depositAmount || 0),
    finalRefund: Number(finalRefund || 0),
    notes: notes || '',
    inspectedAt: new Date().toISOString()
  };

  db.inspections.push(inspection);
  addActivity(db, kostUid, 'kamar', `Inspeksi ${type === 'check_out' ? 'Check-out' : 'Check-in'} Kamar ${roomNumber} (${tenantName}) selesai. Refund deposit: Rp ${inspection.finalRefund.toLocaleString('id-ID')}`);
  writeDB(db);
  res.json(inspection);
});

// ── UPGRADE: TOKEN LISTRIK KWH MANDIRI ──────────────────────────
app.post('/api/electricity/top-up', (req, res) => {
  const { kostUid, roomNumber, amount } = req.body;
  const segments = [];
  for (let i = 0; i < 5; i++) {
    segments.push(String(Math.floor(1000 + Math.random() * 9000)));
  }
  const token = segments.join('-');
  const kwhAdded = Math.round((Number(amount || 50000) / 1444) * 10) / 10;

  res.json({
    success: true,
    token,
    kwhAdded,
    nominal: Number(amount || 50000),
    generatedAt: new Date().toISOString()
  });
});

// --- MULTI-DEVICE CLOUD & SYNC ENDPOINTS ---
app.get('/api/health', (req, res) => {
  const db = getDB();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    server: 'KostKu Multi-Device Cloud API',
    stats: {
      totalKosts: db.kosts.length,
      totalUsers: db.users.length,
      totalInvoices: (db.invoices || []).length
    }
  });
});

app.get('/api/backup', (req, res) => {
  const db = getDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=kostku-backup-${Date.now()}.json`);
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/restore', (req, res) => {
  const newData = req.body;
  if (!newData || typeof newData !== 'object' || !newData.users) {
    return res.status(400).json({ error: 'Format data backup tidak valid' });
  }
  writeDB(newData);
  res.json({ message: 'Database berhasil dipulihkan', count: newData.users.length });
});

// Serve built SPA static files if dist folder exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start server only when run directly (local dev), not when required by Vercel serverless
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KostKu API running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
