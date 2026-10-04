const fs = require('fs');

let serverFile = fs.readFileSync('server.js', 'utf8');

// 1. Add applications to DB init
serverFile = serverFile.replace(
  "invoices: [], expenses: [], iot_meters: []",
  "invoices: [], expenses: [], iot_meters: [], applications: []"
);

serverFile = serverFile.replace(
  "if (!db.iot_meters) db.iot_meters = [];\n  return db;",
  "if (!db.iot_meters) db.iot_meters = [];\n  if (!db.applications) db.applications = [];\n  return db;"
);

// 2. Replace /api/register to include GPS, image, etc.
const newRegisterCode = `// Endpoint: Register
app.post('/api/register', (req, res) => {
  const { role, name, email, password, kostName, kostUid, kamar, phone, address, lat, lng, imageFront, description } = req.body;
  const db = readDB();

  if (!password || !name) {
    return res.status(400).json({ error: 'Password dan Nama harus diisi' });
  }

  const newUser = {
    id: Date.now().toString(),
    name, password, role
  };

  if (role === 'owner') {
    if (!email) return res.status(400).json({ error: 'Email harus diisi untuk pemilik' });
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email sudah terdaftar!' });
    }
    
    // Validate GPS and Image for owner
    if (!lat || !lng) return res.status(400).json({ error: 'Lokasi GPS Kost wajib diisi untuk verifikasi' });
    if (!imageFront) return res.status(400).json({ error: 'Foto Depan Kost wajib diunggah untuk verifikasi' });

    newUser.email = email;
    const generatedUid = 'KOST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    newUser.kostUid = generatedUid;
    db.users.push(newUser);
    
    db.kosts.push({
      uid: generatedUid,
      kostName: kostName || 'Kost Baru',
      ownerId: newUser.id,
      address: address || '',
      location: { lat, lng },
      images: [imageFront],
      description: description || '',
      status: 'verified', // Auto verified for demo
      settings: {
        rooms: [],
        employees: [],
        bedsheetCount: 0,
        waterRate: 0,
        electricityRate: 0,
        depositAmount: 0
      }
    });
    
    addActivity(db, generatedUid, 'pengguna', \`Kost \${kostName || 'Baru'} berhasil dibuat dan diverifikasi\`);
    writeDB(db);
    
    return res.json({ message: 'Registrasi Owner Berhasil!', uid: generatedUid });
    
  } else if (role === 'user') {
    // Normal user registration (tenant doesn't need to join kost immediately)
    if (email) newUser.email = email;
    if (phone) newUser.phone = phone;
    
    db.users.push(newUser);
    writeDB(db);

    return res.json({ message: 'Berhasil mendaftar sebagai pencari kost' });
  } else {
    res.status(400).json({ error: 'Role tidak valid' });
  }
});`;

serverFile = serverFile.replace(/\/\/ Endpoint: Register[\s\S]*?\/\/ Endpoint: Update Tenant Bedsheets/, newRegisterCode + "\n\n// Endpoint: Update Tenant Bedsheets");


// 3. Add New Endpoints before app.listen
const newEndpoints = `
// --- NEW ENDPOINTS FOR MARKETPLACE ---

// Endpoint: Mock Google Auth
app.post('/api/auth/google', (req, res) => {
  const { email, name, role } = req.body;
  const db = readDB();
  
  let user = db.users.find(u => u.email === email);
  if (!user) {
    user = {
      id: Date.now().toString(),
      name,
      email,
      role: role || 'user',
      password: 'google-oauth-mock'
    };
    db.users.push(user);
    writeDB(db);
  }
  
  const safeUser = { ...user };
  delete safeUser.password;
  
  let kostName = 'KostKu';
  if (user.role === 'owner') {
    const kost = db.kosts.find(k => k.ownerId === user.id);
    if (kost) kostName = kost.kostName;
  } else if (user.role === 'user' && user.kostUid) {
    const kost = db.kosts.find(k => k.uid === user.kostUid);
    if (kost) kostName = kost.kostName;
  }
  
  return res.json({ user: safeUser, kostName });
});

// Endpoint: Public Kost List
app.get('/api/public/kosts', (req, res) => {
  const db = readDB();
  const verifiedKosts = db.kosts.filter(k => k.status === 'verified').map(k => {
    // Only send public safe data
    return {
      uid: k.uid,
      kostName: k.kostName,
      address: k.address,
      location: k.location,
      images: k.images,
      description: k.description,
      rooms: (k.settings?.rooms || []).map(r => ({ number: r.number, price: r.price, capacity: r.capacity }))
    };
  });
  res.json(verifiedKosts);
});

// Endpoint: Apply to Kost
app.post('/api/kosts/apply', (req, res) => {
  const { kostUid, userId, kamar, phone } = req.body;
  const db = readDB();
  
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  
  const kost = db.kosts.find(k => k.uid === kostUid);
  if (!kost) return res.status(404).json({ error: 'Kost tidak ditemukan' });
  
  // Check if already applied
  if (db.applications.find(a => a.userId === userId && a.status === 'pending')) {
    return res.status(400).json({ error: 'Anda sudah memiliki pengajuan yang pending' });
  }
  
  db.applications.push({
    id: 'APP-' + Date.now(),
    kostUid,
    userId,
    userName: user.name,
    kamar,
    phone,
    status: 'pending',
    date: new Date().toISOString()
  });
  
  addActivity(db, kostUid, 'pengguna', \`Ada pengajuan sewa baru dari \${user.name} untuk Kamar \${kamar}\`);
  writeDB(db);
  
  res.json({ message: 'Pengajuan sewa berhasil dikirim ke pemilik kost' });
});

// Endpoint: Get Applications (Owner Dashboard)
app.get('/api/applications', (req, res) => {
  const { kostUid } = req.query;
  const db = readDB();
  const apps = db.applications.filter(a => a.kostUid === kostUid);
  res.json(apps.sort((a,b) => new Date(b.date) - new Date(a.date)));
});

// Endpoint: Process Application
app.put('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'
  const db = readDB();
  
  const appIndex = db.applications.findIndex(a => a.id === id);
  if (appIndex === -1) return res.status(404).json({ error: 'Aplikasi tidak ditemukan' });
  
  const application = db.applications[appIndex];
  
  if (action === 'approve') {
    application.status = 'approved';
    const user = db.users.find(u => u.id === application.userId);
    if (user) {
      user.kostUid = application.kostUid;
      user.kamar = application.kamar;
      user.phone = application.phone;
      user.bedsheets = 0;
      
      const kost = db.kosts.find(k => k.uid === application.kostUid);
      const roomSettings = (kost.settings?.rooms || []).find(r => r.number === application.kamar);
      
      // Generate Invoice
      const deposit = kost.settings?.depositAmount || 0;
      const basePrice = roomSettings?.price || 0;
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
      
      addActivity(db, application.kostUid, 'pengguna', \`Pengajuan sewa \${user.name} (Kamar \${application.kamar}) telah disetujui\`);
    }
  } else {
    application.status = 'rejected';
  }
  
  writeDB(db);
  res.json(application);
});

app.listen(PORT,`;

serverFile = serverFile.replace("app.listen(PORT,", newEndpoints);

fs.writeFileSync('server.js', serverFile);
console.log('Server updated!');
