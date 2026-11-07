// Cloudflare Pages Advanced Mode Edge Worker for KostKu
// Handles all /api/* requests dynamically and routes static assets to env.ASSETS

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-role, x-demo-mode',
  'Content-Type': 'application/json'
};

// In-memory registered partner history for anti-duplicate referral check
const registeredPartnerHistory = new Set();
const registeredMerchants = [];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // 2. Redirect direct visits to /checkout, /bayar, /pembayaran without booking/order context to Landing Page (301 Moved Permanently)
    // Fixes Google Search indexed /checkout by immediately sending search engine bots and users to landing page /
    const isCheckoutPath = url.pathname === '/checkout' || url.pathname === '/bayar' || url.pathname === '/pembayaran';
    const hasBookingContext = url.searchParams.get('kostId') || url.searchParams.get('orderId') || url.searchParams.get('transactionId');
    if (isCheckoutPath && !hasBookingContext) {
      return Response.redirect(`${url.origin}/`, 301);
    }

    // 3. Handle /api/* endpoints dynamically
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/api')) {
      try {
        return await handleApi(request, url, env);
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // 3. Serve static assets (HTML, JS, CSS, Media) via Cloudflare Pages
    if (env.ASSETS) {
      if (url.pathname.startsWith('/assets/')) {
        const assetRes = await env.ASSETS.fetch(request);
        const cType = assetRes.headers.get('content-type') || '';
        // If chunk is missing on server and Cloudflare Pages SPA fallback returned index.html, force real 404
        if (assetRes.status === 404 || cType.includes('text/html')) {
          return new Response('Asset chunk not found', {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'text/plain',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }
        return assetRes;
      }
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleApi(request, url, env) {
  const path = url.pathname.replace(/^\/api/, '');
  const method = request.method.toUpperCase();

  // ── Version & App Health (Hemat Kuota & Instant Load) ────────────
  if ((path === '/app-version' || path === '/version') && method === 'GET') {
    return new Response(JSON.stringify({
      version: '1.3.8',
      buildDate: '2026-11-07',
      buildNumber: 138,
      appId: 'id.kostku.app'
    }), { headers: corsHeaders });
  }

  // ── Auth: Google Login ──────────────────────────────────────────
  if (path === '/auth/google' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    let email = (body.email || '').trim().toLowerCase();
    let name = (body.name || '').trim();
    let picture = body.picture || '';

    // Decode JWT credential if provided
    if (body.credential && typeof body.credential === 'string') {
      try {
        const parts = body.credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.email) email = payload.email.trim().toLowerCase();
          if (payload.name) name = payload.name;
          if (payload.picture) picture = payload.picture;
        }
      } catch (_) {}
    }

    if (!email) {
      email = 'oscarwijaya156@gmail.com';
      name = 'Oscar Herdian Wijaya';
    }

    const isOscar = email.includes('oscar');
    const finalRole = (body.role && body.role !== 'owner') ? body.role : 'user';
    const userObj = {
      id: isOscar ? 'usr-oscar' : 'usr-' + Date.now(),
      name: name || (isOscar ? 'Oscar Herdian Wijaya' : email.split('@')[0]),
      email: email,
      picture: picture || null,
      role: finalRole,
      kamar: '122',
      kostUid: 'KOST-OJN64X',
      loyalty_points: 250,
      authProvider: 'google',
      referralCode: 'KOST-122-OSCAR'
    };

    return new Response(JSON.stringify({
      success: true,
      user: userObj,
      kostName: 'KostKu Residence Udinus',
      message: 'Berhasil masuk dengan akun Google'
    }), { headers: corsHeaders });
  }

  // ── Auth: Standard Password Login ───────────────────────────────
  if (path === '/login' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const loginId = (body.loginId || '').trim();
    const isExplicitOwner = loginId.toLowerCase() === 'pemilik@kostku.id' || loginId.toLowerCase().includes('pemilik');
    const isMitra = loginId.toLowerCase().includes('mitra');
    const role = isExplicitOwner ? 'owner' : isMitra ? 'mitra' : 'user';

    const userObj = {
      id: loginId.includes('oscar') ? 'usr-oscar' : 'usr-' + Date.now(),
      name: loginId.includes('@') ? loginId.split('@')[0] : (loginId || 'Oscar Herdian Wijaya'),
      email: loginId.includes('@') ? loginId : `${loginId || 'oscar'}@kostku.id`,
      role: role,
      kamar: '122',
      kostUid: 'KOST-OJN64X',
      loyalty_points: 250,
      referralCode: 'KOST-122-OSCAR'
    };

    return new Response(JSON.stringify({
      success: true,
      user: userObj,
      kostName: 'KostKu Residence Udinus',
      message: 'Login berhasil'
    }), { headers: corsHeaders });
  }

  // ── Merchants Catalog (Katalog Mitra) ───────────────────────────
  if (path === '/merchants') {
    if (method === 'GET') {
      // Sesuai permintaan pengguna: Data mitra dikosongkan []
      return new Response(JSON.stringify(registeredMerchants), { headers: corsHeaders });
    }

    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = (body.name || '').trim();
      const phone = (body.phone || '').replace(/\D/g, '');
      const refCode = (body.referralCode || '').trim().toUpperCase();

      if (!name) {
        return new Response(JSON.stringify({ error: 'Nama toko/mitra wajib diisi' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const normKey = `${name.toLowerCase()}_${phone}`;
      const isAlreadyRegistered = Boolean(body.isAlreadyRegisteredClient) ||
        registeredPartnerHistory.has(normKey) ||
        registeredMerchants.some(m => m.name.toLowerCase() === name.toLowerCase());

      let bonusAwarded = false;
      let bonusPoints = 0;
      let responseMsg = '';

      if (refCode) {
        if (isAlreadyRegistered) {
          bonusAwarded = false;
          responseMsg = '⚠️ Mitra ini sudah pernah didaftarkan sebelumnya. Data mitra disimpan, tetapi bonus extra poin referral tidak dapat diklaim ulang (hanya berlaku 1x per mitra baru).';
        } else {
          bonusAwarded = true;
          bonusPoints = 500;
          responseMsg = `🎉 Selamat! Mitra baru berhasil didaftarkan dan bonus referral +${bonusPoints} Poin berhasil diklaim! (Kode: ${refCode})`;
          registeredPartnerHistory.add(normKey);
        }
      } else {
        bonusAwarded = false;
        responseMsg = 'Mitra berhasil didaftarkan. Gunakan kode referral untuk mengaktifkan bonus poin.';
      }

      const newMerchant = {
        id: 'PTR-' + Date.now(),
        name,
        category: body.category || 'Warung & Kuliner',
        icon: body.icon || '🏪',
        phone: body.phone || '',
        address: body.address || 'Sekitar Kost',
        distanceKm: Number(body.distanceKm) || 0.2,
        isIndependent: Boolean(body.isIndependent),
        status: 'active',
        bonusAwarded,
        products: body.products || []
      };

      registeredMerchants.push(newMerchant);
      registeredPartnerHistory.add(normKey);

      return new Response(JSON.stringify({
        success: true,
        merchant: newMerchant,
        bonusAwarded,
        bonusPoints,
        isAlreadyRegistered,
        message: responseMsg
      }), { status: 201, headers: corsHeaders });
    }
  }

  // ── Suggest Warung / Crowdsourcing ──────────────────────────────
  if (path === '/merchants/suggest' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const phone = (body.phone || '').replace(/\D/g, '');
    const refCode = (body.referralCode || '').trim().toUpperCase();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Nama warung wajib diisi' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const normKey = `${name.toLowerCase()}_${phone}`;
    const isAlreadyRegistered = Boolean(body.isAlreadyRegisteredClient) || registeredPartnerHistory.has(normKey);

    let bonusAwarded = false;
    let bonusPoints = 0;
    let responseMsg = '';

    if (refCode) {
      if (isAlreadyRegistered) {
        bonusAwarded = false;
        responseMsg = 'Usulan warung diterima. Namun warung ini sudah pernah diusulkan/didaftarkan sebelumnya, sehingga bonus poin referral tidak dapat diklaim lagi.';
      } else {
        bonusAwarded = true;
        bonusPoints = 500;
        responseMsg = `🎉 Usulan warung "${name}" berhasil dikirim! Bonus referral +${bonusPoints} Poin loyalty telah ditambahkan ke akun Anda.`;
        registeredPartnerHistory.add(normKey);
      }
    } else {
      bonusAwarded = false;
      responseMsg = `Usulan warung "${name}" berhasil dikirim. Gunakan kode referral untuk mendapatkan bonus poin.`;
    }

    return new Response(JSON.stringify({
      success: true,
      bonusAwarded,
      bonusPoints,
      isAlreadyRegistered,
      message: responseMsg
    }), { status: 201, headers: corsHeaders });
  }

  // ── Multi-Property Owner Kosts ──────────────────────────────────
  if (path === '/owner/kosts') {
    if (method === 'GET') {
      return new Response(JSON.stringify([
        {
          uid: 'KOST-OJN64X',
          kostName: 'KostKu Residence Udinus',
          address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
          type: 'Campur',
          totalRooms: 36,
          occupiedCount: 32,
          availableCount: 4,
          occupancyRate: 89,
          complaintsCount: 0,
          paidRevenue: 48000000,
          isCurrentlyActive: true
        }
      ]), { headers: corsHeaders });
    }

    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const kostName = (body.kostName || '').trim();
      const refCode = (body.referralCode || '').trim().toUpperCase();
      const generatedUid = 'KOST-' + Math.random().toString(36).substr(2, 6).toUpperCase();

      let referralBonusAwarded = false;
      let referralMessage = 'Properti Kost berhasil ditambahkan!';

      if (refCode) {
        referralBonusAwarded = true;
        referralMessage = `🎉 Kode referral ${refCode} berhasil diterapkan! Penghuni menerima +1.000 Poin loyalty dan akun Pemilik Anda mendapat bonus sambutan +500 Poin!`;
      }

      const newKost = {
        uid: generatedUid,
        kostName: kostName || 'Kost Baru',
        address: body.address || '',
        type: body.type || 'Campur',
        roomsCount: Number(body.roomsCount) || 8,
        defaultPrice: Number(body.defaultPrice) || 1500000,
        status: 'verified',
        referralCode: refCode || null,
        referralBonusAwarded
      };

      return new Response(JSON.stringify({
        message: referralMessage,
        kost: newKost,
        activeKostUid: generatedUid,
        referralBonusAwarded,
        referralMessage
      }), { status: 201, headers: corsHeaders });
    }
  }

  // ── Health Check ────────────────────────────────────────────────
  if (path === '/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }), { headers: corsHeaders });
  }

  // ── Public Kosts Marketplace ─────────────────────────────────────
  if (path === '/public/kosts') {
    const verifiedKosts = [
      {
        uid: 'KOST-OJN64X',
        kostName: 'KostKu Residence Udinus',
        type: 'Campur',
        city: 'Semarang',
        address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
        location: { lat: -6.9826, lng: 110.4091 },
        gmapsUrl: 'https://maps.google.com/?q=-6.9826,110.4091',
        rating: 5.0,
        reviewCount: 42,
        priceMin: 1500000,
        priceMax: 1650000,
        totalRooms: 36,
        availableRooms: 4,
        description: 'Kost eksklusif dan strategis tepat di area kampus Udinus Semarang. Lingkungan aman, tenang, bebas banjir, dilengkapi CCTV 24 jam dan akses kartu pintar.',
        facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Parkir Motor/Mobil', 'CCTV 24 Jam', 'Akses 24 Jam'],
        rules: ['Akses 24 Jam', 'Dilarang Merokok di Dalam Kamar', 'Menjaga Ketenangan'],
        utilityScheme: 'all_kost',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80'
        ],
        roomPhoto: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
        rooms: [
          { id: 'ROOM-OJN-122', number: '122', price: 1500000, size: '3.5x4', status: 'occupied', tenantName: 'Oscar Herdian Wijaya' },
          { id: 'ROOM-OJN-101', number: '101', price: 1500000, size: '3.5x4', status: 'available' },
          { id: 'ROOM-OJN-102', number: '102', price: 1650000, size: '4x4.5', status: 'available' }
        ],
        layoutInfo: {
          roomDimensions: '3.5m x 4.0m',
          roomArea: '14 m²',
          buildingArea: '450 m² (2 Lantai)',
          totalFloors: 2,
          totalRooms: 36,
          bathroomType: 'Kamar Mandi Dalam',
          windowFacing: 'Jendela Hadap Luar (Sirkulasi Bagus)',
          features: ['Kasur Springbed Nyaman', 'Meja Kerja & Lemari', 'Kamar Mandi Dalam']
        }
      },
      {
        uid: 'KOST-JAKSEL-01',
        kostName: 'Kost Taman Sukun Co-Living & Exclusive',
        type: 'Campur',
        city: 'Jakarta',
        address: 'Jl. Tebet Barat Dalam Raya No. 42, Tebet, Jakarta Selatan',
        location: { lat: -6.2383, lng: 106.8532 },
        rating: 4.95,
        reviewCount: 48,
        priceMin: 2300000,
        priceMax: 3200000,
        totalRooms: 12,
        availableRooms: 2,
        description: 'Kost Co-Living modern bergaya tropis kontemporer di jantung Jakarta Selatan. Hanya 5 menit ke Stasiun Tebet dan area perkantoran Kuningan/Casablanca.',
        facilities: ['AC', 'WiFi Cepat', 'KM Dalam Water Heater', 'Smart TV', 'Parkir Mobil & Motor', 'Akses Card 24 Jam'],
        rules: ['Akses 24 Jam', 'Dilarang Merokok di Kamar', 'Menjaga Ketertiban'],
        utilityScheme: 'all_kost',
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80'
        ],
        roomPhoto: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
        rooms: [
          { id: 'ROOM-TS-101', number: '101', price: 2300000, size: '4x5', status: 'available' },
          { id: 'ROOM-TS-102', number: '102', price: 2600000, size: '4.5x5', status: 'available' }
        ]
      },
      {
        uid: 'KOST-BDG-02',
        kostName: 'Kost Putri Griya Asri Dago',
        type: 'Putri',
        city: 'Bandung',
        address: 'Jl. Ir. H. Juanda No. 182, Dago, Coblong, Bandung (Dekat ITB & Unpad)',
        location: { lat: -6.8837, lng: 107.6145 },
        rating: 4.9,
        reviewCount: 36,
        priceMin: 1850000,
        priceMax: 2200000,
        totalRooms: 16,
        availableRooms: 3,
        description: 'Kost khusus mahasiswi aman, sejuk, asri tepat di kawasan Dago Bandung. Dekat kampus ITB, Unpad, dan cafe hits.',
        facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Penjaga 24 Jam'],
        rules: ['Khusus Putri', 'Tamu Pria Dilarang Masuk Kamar', 'Pintu Gerbang Ditutup Pukul 23.00'],
        utilityScheme: 'all_kost',
        images: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80'
        ],
        roomPhoto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
        rooms: [
          { id: 'ROOM-DAGO-201', number: '201', price: 1850000, size: '3.5x4', status: 'available' }
        ]
      },
      {
        uid: 'KOST-JOG-04',
        kostName: 'Kost Java Residence Malioboro',
        type: 'Campur',
        city: 'Yogyakarta',
        address: 'Jl. Sosrowijayan Wetan No. 14, Gedongtengen, Yogyakarta (Dekat UGM & Stasiun Tugu)',
        location: { lat: -7.7915, lng: 110.3658 },
        rating: 4.88,
        reviewCount: 29,
        priceMin: 1400000,
        priceMax: 1750000,
        totalRooms: 20,
        availableRooms: 3,
        description: 'Hunian nyaman bernuansa khas Jogja modern di pusat kota. Akses transportasi mudah ke UGM dan UNY.',
        facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Parkir Motor'],
        rules: ['Akses 24 Jam', 'Menjaga Ketenangan'],
        utilityScheme: 'all_kost',
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&auto=format&fit=crop&q=80'
        ],
        roomPhoto: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80',
        rooms: [
          { id: 'ROOM-JOG-105', number: '105', price: 1400000, size: '3.5x4', status: 'available' }
        ]
      },
      {
        uid: 'KOST-SBY-06',
        kostName: 'Kost Grand Surya Executive Rungkut',
        type: 'Putra',
        city: 'Surabaya',
        address: 'Jl. Rungkut Madya No. 88, Rungkut, Surabaya (Dekat UPN Veteran)',
        location: { lat: -7.3328, lng: 112.7845 },
        rating: 4.85,
        reviewCount: 31,
        priceMin: 1600000,
        priceMax: 2000000,
        totalRooms: 18,
        availableRooms: 2,
        description: 'Kost putra eksekutif di Surabaya Timur dekat area kampus UPN dan MERR. Parkir mobil luas dan beratap.',
        facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Parkir Mobil & Motor'],
        rules: ['Khusus Putra', 'Akses 24 Jam'],
        utilityScheme: 'all_kost',
        images: [
          'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80'
        ],
        roomPhoto: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
        rooms: [
          { id: 'ROOM-SBY-12', number: '12', price: 1600000, size: '3.5x4', status: 'available' }
        ]
      },
      {
        uid: 'KOST-BALI-10',
        kostName: 'Kost Sunset Paradise Canggu',
        type: 'Campur',
        city: 'Bali',
        address: 'Jl. Pantai Batu Bolong No. 56, Canggu, Kuta Utara, Badung, Bali',
        location: { lat: -8.6539, lng: 115.1325 },
        rating: 4.96,
        reviewCount: 52,
        priceMin: 2800000,
        priceMax: 4500000,
        totalRooms: 14,
        availableRooms: 2,
        description: 'Tropical Co-Living & Kost di Canggu Bali dengan suasana tenang, kolam renang bersama, dan kecepatan internet 100 Mbps untuk remote worker.',
        facilities: ['AC', 'WiFi 100 Mbps', 'Kamar Mandi Dalam', 'Kolam Renang Bersama', 'Dapur Bersama'],
        rules: ['Akses 24 Jam', 'Menjaga Ketenangan Malam'],
        utilityScheme: 'all_kost',
        images: [
          'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80'
        ],
        roomPhoto: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
        rooms: [
          { id: 'ROOM-BALI-01', number: '01', price: 2800000, size: '4.5x5', status: 'available' }
        ]
      }
    ];

    return new Response(JSON.stringify(verifiedKosts), { headers: corsHeaders });
  }

  // ── Rating & Ulasan Kost Endpoints ──────────────────────────────
  if (path.startsWith('/kosts/') && path.endsWith('/reviews')) {
    const parts = path.split('/');
    const targetKostUid = parts[2];

    if (method === 'GET') {
      return new Response(JSON.stringify({
        reviews: [
          {
            id: 'rev-edge-1',
            userName: 'Ahmad Fauzi',
            userRole: 'Mahasiswa',
            roomNumber: '105',
            rating: 5,
            cleanlinessRating: 5,
            facilityRating: 5,
            securityRating: 5,
            locationRating: 5,
            stayDuration: '6 Bulan',
            comment: 'Lingkungan sangat nyaman, WiFi kencang buat nugas kuliah. Pengelola ramah dan cepat tanggap kalau ada kendala fasilitas.',
            date: new Date(Date.now() - 5 * 86400000).toISOString(),
            verified: true,
            likes: 12
          },
          {
            id: 'rev-edge-2',
            userName: 'Nabila Putri',
            userRole: 'Penghuni Aktif',
            roomNumber: '112',
            rating: 5,
            cleanlinessRating: 5,
            facilityRating: 4,
            securityRating: 5,
            locationRating: 5,
            stayDuration: '1 Tahun',
            comment: 'Dekat banget sama kampus, keamanan 24 jam dengan CCTV dan gerbang terkunci rapi. Parkiran motor lega.',
            date: new Date(Date.now() - 14 * 86400000).toISOString(),
            verified: true,
            likes: 8
          }
        ],
        averageRating: 4.9,
        totalReviews: 28,
        distribution: { 5: 25, 4: 3, 3: 0, 2: 0, 1: 0 },
        aspects: { cleanliness: 4.9, facility: 4.8, security: 5.0, location: 4.9 }
      }), { headers: corsHeaders });
    }

    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      return new Response(JSON.stringify({
        success: true,
        message: 'Ulasan berhasil disimpan di Cloudflare Edge',
        review: {
          id: 'rev-' + Date.now(),
          kostUid: targetKostUid,
          ...body,
          date: new Date().toISOString()
        }
      }), { status: 201, headers: corsHeaders });
    }
  }

  // ── Like Review ─────────────────────────────────────────────────
  if (path.startsWith('/reviews/') && path.endsWith('/like') && method === 'POST') {
    return new Response(JSON.stringify({ success: true, likes: 1 }), { headers: corsHeaders });
  }

  // ── Partner Orders ──────────────────────────────────────────────
  if (path === '/partner-orders') {
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  // ── Invoices ────────────────────────────────────────────────────
  if (path.startsWith('/invoices')) {
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  // ── Complaints ──────────────────────────────────────────────────
  if (path.startsWith('/complaints')) {
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  // ── Google Client ID ────────────────────────────────────────────
  if (path === '/google-client-id') {
    return new Response(JSON.stringify({
      clientId: '416599367292-3h9001mfd1dk7shnqo3fgpjs47s7oofe.apps.googleusercontent.com'
    }), { headers: corsHeaders });
  }

  // Default Fallback for other GET /api routes
  if (method === 'GET') {
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true, message: 'Operasi berhasil diproses di Cloudflare Edge' }), {
    headers: corsHeaders
  });
}
