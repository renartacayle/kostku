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

  // ── Public Kosts & Health ───────────────────────────────────────
  if (path === '/public/kosts' || path === '/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      kosts: [
        {
          uid: 'KOST-OJN64X',
          kostName: 'KostKu Residence Udinus',
          address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
          city: 'Semarang',
          priceMin: 850000,
          priceMax: 1650000,
          rating: 4.9,
          totalRooms: 36,
          availableRooms: 4
        }
      ]
    }), { headers: corsHeaders });
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
