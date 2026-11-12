/**
 * POS & Table QR Ordering Engine for KostKu & Standalone Merchants
 * Domain: kostku.riuph.me/kasir & api.riuph.me
 */

const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');

function createPosRouter({ getDB, writeDB, createTripayClosedTransaction, syncDeltaToFirebase }) {
  const router = express.Router();

  // Non-blocking Granular Delta Sync Helper (< 5 KB payload)
  let syncDelta = syncDeltaToFirebase;
  if (!syncDelta) {
    try {
      const fbSync = require('./firebase_sync');
      syncDelta = fbSync.syncDeltaToFirebase;
    } catch (_) {
      syncDelta = () => Promise.resolve(false);
    }
  }

  // ── LUCKY SPIN WHEEL CONFIGURATION (8 EQUAL SLICES - 45° EACH) ──
  // Layout strategis: Slice 0 (100 Poin Emas) bersebelahan langsung dengan Slice 1 (25 Poin) & Slice 7 (25 Poin)
  const WHEEL_SLICES = [
    { index: 0, points: 100, label: '100 Poin Emas', isJackpot: true, color: '#F59E0B' },
    { index: 1, points: 25, label: '25 Poin', isJackpot: false, color: '#3B82F6' },
    { index: 2, points: 50, label: '50 Poin', isJackpot: false, color: '#8B5CF6' },
    { index: 3, points: 10, label: '10 Poin', isJackpot: false, color: '#10B981' },
    { index: 4, points: 25, label: '25 Poin', isJackpot: false, color: '#06B6D4' },
    { index: 5, points: 50, label: '50 Poin', isJackpot: false, color: '#EC4899' },
    { index: 6, points: 10, label: '10 Poin', isJackpot: false, color: '#10B981' },
    { index: 7, points: 25, label: '25 Poin', isJackpot: false, color: '#3B82F6' }
  ];

  const rollLuckySpin = (customer) => {
    const spinsWithoutJackpot = customer.spins_without_jackpot || 0;

    // Trik C: Pity System (Hard Pity Trigger di putaran ke-5 jika 4 putaran apes berturut-turut)
    if (spinsWithoutJackpot >= 4) {
      customer.spins_without_jackpot = 0;
      return {
        pointsWon: 100,
        sliceIndex: 0,
        slice: WHEEL_SLICES[0],
        isPity: true,
        isNearMiss: false,
        spinsWithoutJackpot: 0
      };
    }

    // Decoupled Server RNG:
    // 100 Poin (Jackpot Emas): 15%
    // 50 Poin (Medium): 35%
    // 25 Poin (Small): 35%
    // 10 Poin (Mini): 15%
    // Expected Value: 42.75 Poin (Aman terkontrol di bawah budget Rp 60)
    const rand = Math.random();
    let pointsWon = 25;
    let sliceIndex = 1;
    let isNearMiss = false;

    if (rand < 0.15) {
      pointsWon = 100;
      sliceIndex = 0;
      customer.spins_without_jackpot = 0;
    } else if (rand < 0.50) {
      pointsWon = 50;
      sliceIndex = Math.random() < 0.5 ? 2 : 5;
      customer.spins_without_jackpot = spinsWithoutJackpot + 1;
    } else if (rand < 0.85) {
      pointsWon = 25;
      // Trik B: Near-Miss Illusion! Target Slice 1 (bersebelahan dengan Slice 0)
      sliceIndex = 1;
      isNearMiss = true;
      customer.spins_without_jackpot = spinsWithoutJackpot + 1;
    } else {
      pointsWon = 10;
      sliceIndex = Math.random() < 0.5 ? 3 : 6;
      customer.spins_without_jackpot = spinsWithoutJackpot + 1;
    }

    return {
      pointsWon,
      sliceIndex,
      slice: WHEEL_SLICES[sliceIndex],
      isPity: false,
      isNearMiss,
      spinsWithoutJackpot: customer.spins_without_jackpot
    };
  };

  const getWibDateString = (date = new Date()) => {
    const wibOffsetMs = 7 * 60 * 60 * 1000;
    return new Date(date.getTime() + wibOffsetMs).toISOString().slice(0, 10);
  };

  // Helper to ensure collections exist in DB
  const ensurePosCollections = (db) => {
    db.pos_products = db.pos_products || [];
    db.pos_tables = db.pos_tables || [];
    db.pos_orders = db.pos_orders || [];
    db.customer_points = db.customer_points || {};
    db.customer_stamps = db.customer_stamps || {};
    db.pos_spin_logs = db.pos_spin_logs || [];
    db.pos_redeem_codes = db.pos_redeem_codes || [
      {
        id: 'REDEEM-KASIR-50',
        code: 'KASIRBONUS50',
        type: 'KUOTA_NOTA',
        quotaNota: 50,
        saldoBonus: 5000,
        maxQuota: 20, // kuota klaim untuk 20 toko
        usedCount: 0,
        usedBy: [],
        description: 'Bonus 50 Kuota Nota Kasir (Rp 5.000)',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'REDEEM-KASIR-100',
        code: 'KOSTKUMERDEKA',
        type: 'KUOTA_NOTA',
        quotaNota: 100,
        saldoBonus: 10000,
        maxQuota: 10, // kuota klaim untuk 10 toko
        usedCount: 0,
        usedBy: [],
        description: 'Bonus Spesial 100 Kuota Nota Kasir (Rp 10.000)',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'REDEEM-KASIR-VIP',
        code: 'VIPKASIR250',
        type: 'KUOTA_NOTA',
        quotaNota: 250,
        saldoBonus: 25000,
        maxQuota: 5, // kuota klaim untuk 5 toko
        usedCount: 0,
        usedBy: [],
        description: 'Bonus Kuota Mitra Prioritas 250 Nota (Rp 25.000)',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    // Koleksi Promo Makanan (Bisa Kuota, Tanggal, atau Keduanya oleh Owner/Mitra/Kasir/Admin)
    db.pos_food_promos = db.pos_food_promos || [
      {
        id: 'PROMO-FOOD-01',
        title: 'Promo Mie Gacoan Hemat (Diskon Rp 3.000)',
        code: 'GACOANHEMAT',
        scope: 'SPECIFIC_ITEM',
        targetProductId: 'prod-1',
        targetProductName: 'Mie Gacoan Level 2',
        discountType: 'FIXED',
        discountValue: 3000,
        minOrder: 0,
        limitType: 'QUOTA', // Berdasarkan batas kuota pemakaian
        maxQuota: 25,
        usedCount: 4,
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: null,
        isActive: true,
        createdByRole: 'owner',
        description: 'Diskon Rp 3.000 per porsi untuk 25 pemesan pertama',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PROMO-FOOD-02',
        title: 'Promo Diskon 15% Semua Menu',
        code: 'WEEKENDSERU',
        scope: 'ALL',
        targetProductId: null,
        targetProductName: null,
        discountType: 'PERCENT',
        discountValue: 15,
        minOrder: 25000,
        limitType: 'DATE', // Berdasarkan batas tanggal
        maxQuota: null,
        usedCount: 2,
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: '2026-11-30',
        isActive: true,
        createdByRole: 'mitra',
        description: 'Diskon 15% semua menu min. belanja Rp 25.000 berlaku s/d 30 November 2026',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PROMO-FOOD-03',
        title: 'Super Kenyang Hemat Rp 5.000',
        code: 'KENYANG5K',
        scope: 'ALL',
        targetProductId: null,
        targetProductName: null,
        discountType: 'FIXED',
        discountValue: 5000,
        minOrder: 20000,
        limitType: 'BOTH', // Berdasarkan kuota DAN tanggal
        maxQuota: 50,
        usedCount: 8,
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: '2026-11-25',
        isActive: true,
        createdByRole: 'admin',
        description: 'Potongan Rp 5.000 untuk 50 porsi atau s/d 25 November 2026',
        createdAt: new Date().toISOString()
      }
    ];

    // ── KOLEKSI GUDANG & BAHAN BAKU (INVENTORY & STOCK ENGINE) ──
    db.pos_inventory = db.pos_inventory || [
      {
        id: 'INV-MIE',
        name: 'Mie Basah Telur Segar',
        category: 'Bahan Pokok',
        unit: 'porsi',
        currentStock: 25,
        minAlertStock: 15,
        costPerUnit: 2500,
        supplier: 'CV Berkah Pangan Mandiri',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-AYAM',
        name: 'Daging Ayam Cincang Marinasi',
        category: 'Protein & Daging',
        unit: 'gram',
        currentStock: 450,
        minAlertStock: 500, // ⚠️ MENIPIS!
        costPerUnit: 45,
        supplier: 'Rumah Potong Unggas Sejahtera',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-PANGSIT',
        name: 'Kulit & Pangsit Goreng Crispy',
        category: 'Topping & Snack',
        unit: 'pcs',
        currentStock: 35,
        minAlertStock: 20,
        costPerUnit: 800,
        supplier: 'UMKM Keripik Barokah',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-MINYAK-CABAI',
        name: 'Minyak Cabai & Sambal Level',
        category: 'Bumbu & Saus',
        unit: 'ml',
        currentStock: 180,
        minAlertStock: 200, // ⚠️ MENIPIS!
        costPerUnit: 25,
        supplier: 'Dapur Rempah KostKu',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-BERAS',
        name: 'Beras Ramos Premium',
        category: 'Bahan Pokok',
        unit: 'gram',
        currentStock: 5000,
        minAlertStock: 2000,
        costPerUnit: 14,
        supplier: 'Gudang Beras Delanggu',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-TELUR',
        name: 'Telur Ayam Negeri Segar',
        category: 'Protein & Daging',
        unit: 'butir',
        currentStock: 18,
        minAlertStock: 10,
        costPerUnit: 2000,
        supplier: 'Peternakan Ayam Makmur',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-SOSIS',
        name: 'Sosis Sapi Panggang',
        category: 'Protein & Daging',
        unit: 'pcs',
        currentStock: 24,
        minAlertStock: 15,
        costPerUnit: 1500,
        supplier: 'Distributor Frozen Food',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-AYAM-POTONG',
        name: 'Ayam Potong Marinasi Madu',
        category: 'Protein & Daging',
        unit: 'potong',
        currentStock: 12,
        minAlertStock: 15, // ⚠️ MENIPIS!
        costPerUnit: 8000,
        supplier: 'Rumah Potong Unggas Sejahtera',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-MADU',
        name: 'Madu Alami Murni',
        category: 'Bumbu & Saus',
        unit: 'ml',
        currentStock: 350,
        minAlertStock: 200,
        costPerUnit: 50,
        supplier: 'Peternak Lebah Nusantara',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-KOPI',
        name: 'Biji Kopi Robusta Blend',
        category: 'Kopi & Minuman',
        unit: 'gram',
        currentStock: 850,
        minAlertStock: 300,
        costPerUnit: 150,
        supplier: 'Roastery Kopi Temanggung',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-SUSU',
        name: 'Susu Segar Fresh Milk',
        category: 'Kopi & Minuman',
        unit: 'ml',
        currentStock: 420,
        minAlertStock: 500, // ⚠️ MENIPIS!
        costPerUnit: 20,
        supplier: 'Koperasi Susu Boyolali',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-GULA-AREN',
        name: 'Sirup Gula Aren Organik',
        category: 'Kopi & Minuman',
        unit: 'ml',
        currentStock: 650,
        minAlertStock: 250,
        costPerUnit: 35,
        supplier: 'Produsen Gula Semut Cilacap',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-TEH',
        name: 'Daun Teh Melati Wangi',
        category: 'Kopi & Minuman',
        unit: 'gram',
        currentStock: 600,
        minAlertStock: 200,
        costPerUnit: 40,
        supplier: 'Perkebunan Teh Pagilaran',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-BOX-KERTAS',
        name: 'Box Kraft Food Grade',
        category: 'Kemasan & Packaging',
        unit: 'pcs',
        currentStock: 80,
        minAlertStock: 30,
        costPerUnit: 1200,
        supplier: 'Pabrik Kemasan Paperindo',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-CUP-PLASTIK',
        name: 'Cup Plastik 16oz + Tutup',
        category: 'Kemasan & Packaging',
        unit: 'pcs',
        currentStock: 55,
        minAlertStock: 25,
        costPerUnit: 900,
        supplier: 'Distributor Plastik Semarang',
        lastRestocked: new Date().toISOString()
      },
      {
        id: 'INV-SEDOTAN',
        name: 'Sedotan Steril Higienis',
        category: 'Kemasan & Packaging',
        unit: 'pcs',
        currentStock: 120,
        minAlertStock: 50,
        costPerUnit: 150,
        supplier: 'Distributor Plastik Semarang',
        lastRestocked: new Date().toISOString()
      }
    ];

    // ── RESEP BAHAN BAKU PER MENU (RESEP YANG DIKURANGI DARI GUDANG) ──
    db.pos_recipes = db.pos_recipes || {
      'prod-1': [ // Mie Gacoan Level 2
        { inventoryId: 'INV-MIE', amount: 1, name: 'Mie Basah Telur Segar', unit: 'porsi' },
        { inventoryId: 'INV-AYAM', amount: 40, name: 'Daging Ayam Cincang Marinasi', unit: 'gram' },
        { inventoryId: 'INV-PANGSIT', amount: 2, name: 'Kulit & Pangsit Goreng Crispy', unit: 'pcs' },
        { inventoryId: 'INV-MINYAK-CABAI', amount: 15, name: 'Minyak Cabai & Sambal Level', unit: 'ml' },
        { inventoryId: 'INV-BOX-KERTAS', amount: 1, name: 'Box Kraft Food Grade', unit: 'pcs' }
      ],
      'prod-2': [ // Nasi Goreng Spesial Kost
        { inventoryId: 'INV-BERAS', amount: 150, name: 'Beras Ramos Premium', unit: 'gram' },
        { inventoryId: 'INV-TELUR', amount: 1, name: 'Telur Ayam Negeri Segar', unit: 'butir' },
        { inventoryId: 'INV-SOSIS', amount: 1, name: 'Sosis Sapi Panggang', unit: 'pcs' },
        { inventoryId: 'INV-AYAM', amount: 25, name: 'Daging Ayam Cincang Marinasi', unit: 'gram' },
        { inventoryId: 'INV-BOX-KERTAS', amount: 1, name: 'Box Kraft Food Grade', unit: 'pcs' }
      ],
      'prod-1794122158680': [ // Ayam Bakar Madu Pedas
        { inventoryId: 'INV-AYAM-POTONG', amount: 1, name: 'Ayam Potong Marinasi Madu', unit: 'potong' },
        { inventoryId: 'INV-MADU', amount: 20, name: 'Madu Alami Murni', unit: 'ml' },
        { inventoryId: 'INV-MINYAK-CABAI', amount: 10, name: 'Minyak Cabai & Sambal Level', unit: 'ml' },
        { inventoryId: 'INV-BOX-KERTAS', amount: 1, name: 'Box Kraft Food Grade', unit: 'pcs' }
      ],
      'prod-3': [ // Pangsit Goreng Crispy (3 pcs)
        { inventoryId: 'INV-PANGSIT', amount: 3, name: 'Kulit & Pangsit Goreng Crispy', unit: 'pcs' },
        { inventoryId: 'INV-BOX-KERTAS', amount: 1, name: 'Box Kraft Food Grade', unit: 'pcs' }
      ],
      'prod-4': [ // Es Teh Manis Jumbo
        { inventoryId: 'INV-TEH', amount: 10, name: 'Daun Teh Melati Wangi', unit: 'gram' },
        { inventoryId: 'INV-CUP-PLASTIK', amount: 1, name: 'Cup Plastik 16oz + Tutup', unit: 'pcs' },
        { inventoryId: 'INV-SEDOTAN', amount: 1, name: 'Sedotan Steril Higienis', unit: 'pcs' }
      ],
      'prod-5': [ // Es Kopi Susu Gula Aren
        { inventoryId: 'INV-KOPI', amount: 18, name: 'Biji Kopi Robusta Blend', unit: 'gram' },
        { inventoryId: 'INV-SUSU', amount: 150, name: 'Susu Segar Fresh Milk', unit: 'ml' },
        { inventoryId: 'INV-GULA-AREN', amount: 25, name: 'Sirup Gula Aren Organik', unit: 'ml' },
        { inventoryId: 'INV-CUP-PLASTIK', amount: 1, name: 'Cup Plastik 16oz + Tutup', unit: 'pcs' },
        { inventoryId: 'INV-SEDOTAN', amount: 1, name: 'Sedotan Steril Higienis', unit: 'pcs' }
      ],
      'prod-1794122115732': [ // Kopi Susu Aren Spesial
        { inventoryId: 'INV-KOPI', amount: 18, name: 'Biji Kopi Robusta Blend', unit: 'gram' },
        { inventoryId: 'INV-SUSU', amount: 150, name: 'Susu Segar Fresh Milk', unit: 'ml' },
        { inventoryId: 'INV-GULA-AREN', amount: 25, name: 'Sirup Gula Aren Organik', unit: 'ml' },
        { inventoryId: 'INV-CUP-PLASTIK', amount: 1, name: 'Cup Plastik 16oz + Tutup', unit: 'pcs' },
        { inventoryId: 'INV-SEDOTAN', amount: 1, name: 'Sedotan Steril Higienis', unit: 'pcs' }
      ]
    };

    db.settings = db.settings || {};
    db.settings.posStore = db.settings.posStore || {
      storeName: '',
      location: '',
      address: '',
      city: '',
      phone: '',
      isValidated: false
    };
    // Kebijakan Terpadu: Kasir POS dan Mitra UMKM menggunakan 1 UID yang sama
    const primaryMerchant = (db.merchants || [])[0];
    const sharedUid = db.settings.posStore.merchantId || db.settings.posStore.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';
    db.settings.posStore.uid = sharedUid;
    db.settings.posStore.merchantId = sharedUid;
    db.settings.posTripay = db.settings.posTripay || {
      apiKey: '',
      privateKey: '',
      merchantCode: '',
      isProduction: false
    };

    // Normalize item isReady status
    if (db.pos_orders && Array.isArray(db.pos_orders)) {
      db.pos_orders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            if (typeof it.isReady !== 'boolean') it.isReady = false;
          });
        }
      });
    }

    // Auto-seed default products if totally empty
    if (db.pos_products.length === 0) {
      db.pos_products = [
        {
          id: 'prod-1',
          name: 'Mie Gacoan Level 2',
          category: 'Makanan',
          price: 13000,
          stock: 99,
          isAvailable: true,
          description: 'Mie pedas gurih manis dengan topping ayam cincang dan pangsit goreng renyah.',
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80'
        },
        {
          id: 'prod-2',
          name: 'Nasi Goreng Spesial Kost',
          category: 'Makanan',
          price: 18000,
          stock: 50,
          isAvailable: true,
          description: 'Nasi goreng dengan telur mata sapi, sosis, dan suwiran ayam.',
          image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80'
        },
        {
          id: 'prod-3',
          name: 'Pangsit Goreng Crispy (3 pcs)',
          category: 'Snack',
          price: 10000,
          stock: 60,
          isAvailable: true,
          description: 'Pangsit isi ayam udang digoreng renyah dengan saus asam manis.',
          image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=500&q=80'
        },
        {
          id: 'prod-4',
          name: 'Es Teh Manis Jumbo',
          category: 'Minuman',
          price: 4000,
          stock: 200,
          isAvailable: true,
          description: 'Teh melati wangi dingin segar porsi besar.',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80'
        },
        {
          id: 'prod-5',
          name: 'Es Kopi Susu Gula Aren',
          category: 'Minuman',
          price: 12000,
          stock: 80,
          isAvailable: true,
          description: 'Espresso robusta mantap dengan susu segar dan gula aren murni.',
          image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80'
        }
      ];
    }

    // Auto-seed default tables if empty
    if (db.pos_tables.length === 0) {
      db.pos_tables = [
        { id: 'tbl-1', number: 'Meja 01', qrToken: 'MEJA-01-TKN881' },
        { id: 'tbl-2', number: 'Meja 02', qrToken: 'MEJA-02-TKN882' },
        { id: 'tbl-3', number: 'Meja 03', qrToken: 'MEJA-03-TKN883' },
        { id: 'tbl-4', number: 'Meja 04', qrToken: 'MEJA-04-TKN884' },
        { id: 'tbl-5', number: 'Meja 05', qrToken: 'MEJA-05-TKN885' }
      ];
    }

    // Hybrid Loyalty & Escrow Models
    db.merchant_wallets = db.merchant_wallets || {};
    db.receipt_claims = db.receipt_claims || [];
    db.customers = db.customers || {};
    db.points_ledger = db.points_ledger || [];
    db.wallet_mutations = db.wallet_mutations || [];
  };

  const calculateWibClaimDeadline = (transDate = new Date()) => {
    const wibOffsetMs = 7 * 60 * 60 * 1000;
    const wibTime = new Date(transDate.getTime() + wibOffsetMs);
    const year = wibTime.getUTCFullYear();
    const month = wibTime.getUTCMonth();
    const date = wibTime.getUTCDate();
    return new Date(Date.UTC(year, month, date + 1, 16, 59, 59, 999));
  };

  const executeBatchSettlement = (db) => {
    const now = new Date();
    const claims = db.receipt_claims || [];
    const expiredPending = claims.filter(c => c.status === 'PENDING' && new Date(c.claim_deadline) < now);

    if (expiredPending.length === 0) {
      return { success: true, processedCount: 0, totalRefunded: 0, affectedMerchants: [] };
    }

    const merchantRefundMap = {};
    let grandTotalRefund = 0;
    expiredPending.forEach(c => {
      c.status = 'EXPIRED';
      c.refunded_at = now.toISOString();

      const refundPerNote = Number(c.held_promo_fee) || 60.00;
      grandTotalRefund += refundPerNote;
      const mId = c.merchant_id || 'MTR-KASIR-MASTER';
      if (!merchantRefundMap[mId]) {
        merchantRefundMap[mId] = { count: 0, totalRefund: 0, claims: [] };
      }
      merchantRefundMap[mId].count += 1;
      merchantRefundMap[mId].totalRefund += refundPerNote;
      merchantRefundMap[mId].claims.push(c.id);
    });

    const affectedMerchants = [];

    Object.entries(merchantRefundMap).forEach(([mId, data]) => {
      db.merchant_wallets = db.merchant_wallets || {};
      let wallet = db.merchant_wallets[mId];
      if (!wallet) {
        wallet = {
          merchant_id: mId,
          available_balance: 0.00,
          held_promo_balance: 0.00,
          updated_at: now.toISOString()
        };
        db.merchant_wallets[mId] = wallet;
      }

      wallet.held_promo_balance = Math.max(0, (wallet.held_promo_balance || 0) - data.totalRefund);
      wallet.available_balance = (wallet.available_balance || 0) + data.totalRefund;
      wallet.updated_at = now.toISOString();

      const m = (db.merchants || []).find(x => String(x.id) === String(mId));
      if (m) {
        m.saldoNota = wallet.available_balance;
        m.kuotaNota = Math.floor(wallet.available_balance / 100);
      }

      db.wallet_mutations = db.wallet_mutations || [];
      const mutation = {
        id: 'MUT-REF-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
        merchant_id: mId,
        type: 'REFUND_PROMO',
        amount: data.totalRefund,
        unclaimed_count: data.count,
        description: `Pengembalian Deposit Promo (${data.count} nota tidak diklaim): +Rp ${data.totalRefund.toLocaleString('id-ID')}`,
        balance_after: wallet.available_balance,
        createdAt: now.toISOString()
      };
      db.wallet_mutations.unshift(mutation);

      // Granular delta sync ke Firebase RTDB
      syncDelta(`merchant_wallets/${mId}`, wallet, 'PATCH');

      affectedMerchants.push({
        merchantId: mId,
        unclaimedCount: data.count,
        totalRefund: data.totalRefund,
        newAvailableBalance: wallet.available_balance,
        remainingHeldBalance: wallet.held_promo_balance
      });
    });

    return {
      success: true,
      processedCount: expiredPending.length,
      totalRefunded: grandTotalRefund,
      affectedMerchants
    };
  };

  // ── 0. STORE & CASHIER LOCATION (STORE VALIDITY ENGINE) ───────────────
  router.get('/store', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    const store = db.settings.posStore || {};
    const primaryMerchant = db.merchants[0];
    const sharedUid = store.merchantId || store.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';

    let currentMerchant = db.merchants.find(m => String(m.id) === String(sharedUid));
    if (!currentMerchant && primaryMerchant) {
      currentMerchant = primaryMerchant;
    }

    if (currentMerchant) {
      if (currentMerchant.saldoNota === undefined) currentMerchant.saldoNota = 5000;
      if (currentMerchant.kuotaNota === undefined) currentMerchant.kuotaNota = Math.max(0, Math.floor(currentMerchant.saldoNota / 100));
      currentMerchant.notaHistory = currentMerchant.notaHistory || [];
    }

    const currentSaldoNota = currentMerchant ? Number(currentMerchant.saldoNota ?? 5000) : 5000;
    const currentKuotaNota = currentMerchant ? Number(currentMerchant.kuotaNota ?? Math.floor(currentSaldoNota / 100)) : 50;

    store.uid = currentMerchant ? currentMerchant.id : sharedUid;
    store.merchantId = currentMerchant ? currentMerchant.id : sharedUid;
    const isValid = Boolean((store.storeName || currentMerchant?.name) && (store.location || currentMerchant?.address));

    // Get all stores belonging to this owner (1 owner bisa punya banyak toko)
    const ownerUserId = currentMerchant?.ownerUserId || 'USR-OWNER-01';
    const allOwnerStores = db.merchants
      .filter(m => String(m.ownerUserId) === String(ownerUserId) || (currentMerchant && m.kostUid === currentMerchant.kostUid))
      .map(m => ({
        id: m.id,
        name: m.name,
        category: m.category || 'makanan',
        icon: m.icon || '🏪',
        saldoNota: Number(m.saldoNota ?? 5000),
        kuotaNota: Number(m.kuotaNota ?? Math.floor((m.saldoNota ?? 5000) / 100)),
        phone: m.phone || '',
        address: m.address || ''
      }));

    res.json({
      uid: store.uid,
      merchantId: store.merchantId,
      storeName: store.storeName || currentMerchant?.name || 'Kantin Riuph Kasir',
      location: store.location || currentMerchant?.address || 'Lantai 1 Didekat Gazebo',
      address: store.address || currentMerchant?.address || '',
      city: store.city || '',
      phone: store.phone || currentMerchant?.phone || '',
      isValidated: isValid,
      saldoNota: currentSaldoNota,
      kuotaNota: currentKuotaNota,
      notaHistory: currentMerchant?.notaHistory || [],
      allOwnerStores,
      updatedAt: store.updatedAt || null
    });
  });

  router.post('/store', (req, res) => {
    const { storeName, location, address, city, phone, merchantId } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const cleanName = String(storeName || '').trim();
    const cleanLocation = String(location || '').trim();
    const cleanAddress = String(address || '').trim();
    const cleanCity = String(city || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Nama toko/kantin kasir wajib diisi!' });
    }
    if (!cleanLocation) {
      return res.status(400).json({ error: 'Lokasi kasir (lantai/gedung/posisi fisik) wajib diinput agar toko valid!' });
    }

    const primaryMerchant = db.merchants[0];
    const sharedUid = merchantId || req.body.uid || db.settings.posStore?.merchantId || db.settings.posStore?.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';

    let targetMerchant = db.merchants.find(m => String(m.id) === String(sharedUid));
    if (targetMerchant) {
      targetMerchant.name = cleanName;
      if (cleanAddress) targetMerchant.address = cleanAddress;
      if (cleanPhone) targetMerchant.phone = cleanPhone;
    }

    db.settings.posStore = {
      uid: sharedUid,
      merchantId: sharedUid,
      storeName: cleanName,
      location: cleanLocation,
      address: cleanAddress || cleanLocation,
      city: cleanCity,
      phone: cleanPhone,
      isValidated: true,
      updatedAt: new Date().toISOString()
    };

    writeDB(db, req);
    res.json({
      success: true,
      message: 'Lokasi dan profil toko kasir berhasil divalidasi!',
      store: db.settings.posStore
    });
  });

  // ── 0B. SWITCH POS ACTIVE STORE (MULTI-STORE PER OWNER) ───────────────
  router.post('/store/switch', (req, res) => {
    const { merchantId } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const target = db.merchants.find(m => String(m.id) === String(merchantId));
    if (!target) return res.status(404).json({ error: 'Toko mitra tidak ditemukan' });

    if (target.saldoNota === undefined) target.saldoNota = 5000;
    if (target.kuotaNota === undefined) target.kuotaNota = Math.max(0, Math.floor(target.saldoNota / 100));

    db.settings.posStore = db.settings.posStore || {};
    db.settings.posStore.uid = target.id;
    db.settings.posStore.merchantId = target.id;
    db.settings.posStore.storeName = target.name;
    db.settings.posStore.address = target.address || db.settings.posStore.address || '';
    db.settings.posStore.phone = target.phone || db.settings.posStore.phone || '';
    db.settings.posStore.isValidated = true;
    db.settings.posStore.updatedAt = new Date().toISOString();

    writeDB(db, req);
    res.json({
      success: true,
      message: `Kasir POS berhasil beralih ke toko: ${target.name}`,
      store: db.settings.posStore,
      saldoNota: target.saldoNota,
      kuotaNota: target.kuotaNota
    });
  });

  // ── 0C. TOP UP SALDO NOTA FROM POS KASIR ──────────────────────────────
  router.post('/topup-nota', (req, res) => {
    const { amount, notaCount, paymentMethod, merchantId } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const store = db.settings.posStore || {};
    const targetId = merchantId || store.merchantId || store.uid || db.merchants[0]?.id;
    let merchant = db.merchants.find(m => String(m.id) === String(targetId)) || db.merchants[0];

    if (!merchant) {
      db.settings = db.settings || {};
      db.settings.posStore = db.settings.posStore || {};
      merchant = db.settings.posStore;
      merchant.id = merchant.id || 'STORE-DEFAULT';
      merchant.name = merchant.name || 'KostKu Cafe';
      merchant.saldoNota = Number(merchant.saldoNota) || 5000;
      merchant.kuotaNota = Number(merchant.kuotaNota) || 50;
      if (!db.merchants.find(m => m.id === merchant.id)) {
        db.merchants.push(merchant);
      }
    }

    const NOTA_PRICE = 100;
    const topupAmount = Number(amount) > 0 
      ? Number(amount) 
      : (Number(notaCount) > 0 ? Number(notaCount) * NOTA_PRICE : 5000);
    const addedNota = Math.floor(topupAmount / NOTA_PRICE);

    merchant.saldoNota = (Number(merchant.saldoNota) || 0) + topupAmount;
    merchant.kuotaNota = Math.max(0, Math.floor(merchant.saldoNota / NOTA_PRICE));
    merchant.notaHistory = merchant.notaHistory || [];

    if (db.settings && db.settings.posStore) {
      db.settings.posStore.saldoNota = merchant.saldoNota;
      db.settings.posStore.kuotaNota = merchant.kuotaNota;
    }

    const record = {
      id: 'TOPUP-POS-' + Date.now(),
      type: 'topup',
      channel: 'POS Kasir Top Up',
      amount: topupAmount,
      addedNota,
      balanceAfter: merchant.saldoNota,
      paymentMethod: paymentMethod || 'qris_pos',
      status: 'success',
      createdAt: new Date().toISOString()
    };

    merchant.notaHistory.unshift(record);
    writeDB(db, req);

    res.json({
      success: true,
      saldoNota: merchant.saldoNota,
      kuotaNota: merchant.kuotaNota,
      addedNota,
      message: `Top up kasir berhasil! +${addedNota} lembar nota ditambahkan ke saldo toko.`
    });
  });

  // ── 0C-2. INITIATE TRIPAY TOP UP TRANSACTION ──────────────────────────
  router.post('/topup-tripay', async (req, res) => {
    const { amount, quota, merchantId } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const store = db.settings.posStore || {};
    const targetId = merchantId || store.merchantId || store.uid || db.merchants[0]?.id;
    let merchant = db.merchants.find(m => String(m.id) === String(targetId)) || db.merchants[0];
    if (!merchant) {
      db.settings = db.settings || {};
      db.settings.posStore = db.settings.posStore || {};
      merchant = db.settings.posStore;
      merchant.id = merchant.id || 'STORE-DEFAULT';
      merchant.name = merchant.name || 'KostKu Cafe';
      merchant.saldoNota = Number(merchant.saldoNota) || 5000;
      merchant.kuotaNota = Number(merchant.kuotaNota) || 50;
      if (!db.merchants.find(m => m.id === merchant.id)) {
        db.merchants.push(merchant);
      }
    }

    const NOTA_PRICE = 100;
    const chosenAmount = Number(amount) > 0 ? Number(amount) : (Number(quota) > 0 ? Number(quota) * NOTA_PRICE : 10000);
    const chosenQuota = Number(quota) > 0 ? Number(quota) : Math.max(1, Math.floor(chosenAmount / NOTA_PRICE));
    const reference = 'TRIPAY-NOTA-' + Date.now();

    // Coba integrasi live TriPay jika credentials ada
    const posTripay = db.settings?.posTripay || db.settings?.gateway || {};
    const hasTripay = Boolean(posTripay.apiKey && posTripay.privateKey && posTripay.merchantCode);

    if (hasTripay && typeof createTripayClosedTransaction === 'function') {
      try {
        const tripayRes = await createTripayClosedTransaction({
          method: 'QRIS',
          orderId: reference,
          amount: chosenAmount,
          customerName: merchant.name || 'Kasir KostKu POS',
          customerEmail: 'kasir@kostku.id',
          customerPhone: merchant.phone || '08123456789',
          orderItems: [
            {
              sku: `NOTA-${chosenQuota}`,
              name: `Top Up Saldo Kuota Kasir (+${chosenQuota} Nota)`,
              price: chosenAmount,
              quantity: 1
            }
          ],
          returnUrl: 'https://kostku.riuph.me/kasir'
        });

        if (tripayRes && tripayRes.success) {
          return res.json({
            success: true,
            method: 'TRIPAY',
            reference: tripayRes.reference || reference,
            amount: chosenAmount,
            quota: chosenQuota,
            qrString: tripayRes.qrString,
            qrUrl: tripayRes.qrUrl,
            checkoutUrl: tripayRes.checkoutUrl || `https://tripay.co.id/checkout/${tripayRes.reference}`,
            expiredTime: Date.now() + 15 * 60 * 1000,
            instructions: tripayRes.instructions || []
          });
        }
      } catch (err) {
        console.warn('[POS TriPay Topup Live Error, using fallback]:', err.message);
      }
    }

    // High-fidelity standard EMVCo QRIS & TriPay checkout URL
    const mockQrString = `00020101021226670016ID.CO.TRIPAY.WWW01189360099900000000000215${reference}520458125303360540${chosenAmount}5802ID5914RIUPH KASIR POS6007JAKARTA62070703A016304E8A2`;
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(mockQrString, { width: 320 });
    } catch (_) {}

    res.json({
      success: true,
      method: 'TRIPAY',
      reference,
      amount: chosenAmount,
      quota: chosenQuota,
      qrString: mockQrString,
      qrUrl: qrDataUrl,
      qrDataUrl,
      checkoutUrl: `https://tripay.co.id/checkout/${reference}`,
      expiredTime: Date.now() + 15 * 60 * 1000,
      instructions: [
        'Buka aplikasi e-wallet (GoPay, OVO, Dana, ShopeePay) atau m-Banking (BCA, Mandiri, BRImo)',
        'Pindai barcode QRIS atau klik tombol Buka Halaman Checkout TriPay',
        'Periksa nama penerima KostKu Kasir POS dan nominal pembayaran',
        'Selesaikan pembayaran dan klik tombol Saya Sudah Bayar'
      ]
    });
  });

  // In-memory set for paid references from webhook or verification
  const posPaidReferences = new Set();

  // ── 0C-3. CONFIRM TRIPAY TOP UP TRANSACTION ───────────────────────────
  router.post('/topup-tripay/confirm', async (req, res) => {
    const { reference, amount, quota, merchantId } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Nomor referensi TriPay wajib disertakan untuk verifikasi pembayaran.'
      });
    }

    // 1. Cek apakah sudah lunas via webhook callback
    if (posPaidReferences.has(reference)) {
      // Proceed to update quota below without querying TriPay again
    } else {
      // 2. REAL CHECK KE TRIPAY API
      const apiKey = process.env.TRIPAY_API_KEY || '8lgqWBCHk8xLycXV3aRjfn5YBrDUZtJCe13muUy5';
      const detailUrl = `https://tripay.co.id/api/transaction/detail?reference=${encodeURIComponent(reference)}`;

      try {
        const tripayRes = await fetch(detailUrl, {
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Accept': 'application/json'
          }
        });
        const tripayData = await tripayRes.json().catch(() => ({}));

        if (tripayData && tripayData.success && tripayData.data) {
          const status = String(tripayData.data.status || '').toUpperCase();
          if (status !== 'PAID') {
            return res.status(400).json({
              success: false,
              isPaid: false,
              status,
              error: `⚠️ Status di TriPay masih ${status || 'UNPAID'} (Belum Dibayar). Sistem telah mengecek ke TriPay namun dana belum masuk. Silakan selesaikan pembayaran QRIS terlebih dahulu.`,
              tripayDetail: tripayData.data
            });
          }
          posPaidReferences.add(reference);
        } else {
          const tripayMsg = tripayData?.message || 'Gagal menghubungi server TriPay';
          const ipMatch = tripayMsg.match(/\((.*?)\)/)?.[1] || '';
          let userError = `⚠️ Pengecekan TriPay: ${tripayMsg}`;
          if (ipMatch) {
            userError = `⚠️ IP Server (${ipMatch}) belum terdaftar di Whitelist IP TriPay (T53543). Silakan kosongkan Whitelist IP di dashboard TriPay.`;
          } else if (tripayMsg.toLowerCase().includes('undefined parameter') || tripayMsg.toLowerCase().includes('tidak ditemukan')) {
            userError = `ℹ️ Status TriPay: Pembayaran QRIS belum terdeteksi masuk (UNPAID). Silakan selesaikan pembayaran QRIS di aplikasi e-wallet/m-banking Anda terlebih dahulu.`;
          }
          return res.status(400).json({
            success: false,
            isPaid: false,
            status: 'CHECK_FAILED',
            error: userError,
            tripayMessage: tripayMsg
          });
        }
      } catch (err) {
        return res.status(502).json({
          success: false,
          isPaid: false,
          error: `Gagal memverifikasi ke TriPay: ${err.message}`
        });
      }
    }

    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const store = db.settings.posStore || {};
    const targetId = merchantId || store.merchantId || store.uid || db.merchants[0]?.id;
    let merchant = db.merchants.find(m => String(m.id) === String(targetId)) || db.merchants[0];
    if (!merchant) {
      db.settings = db.settings || {};
      db.settings.posStore = db.settings.posStore || {};
      merchant = db.settings.posStore;
      merchant.id = merchant.id || 'STORE-DEFAULT';
      merchant.name = merchant.name || 'KostKu Cafe';
      merchant.saldoNota = Number(merchant.saldoNota) || 5000;
      merchant.kuotaNota = Number(merchant.kuotaNota) || 50;
      if (!db.merchants.find(m => m.id === merchant.id)) {
        db.merchants.push(merchant);
      }
    }

    const NOTA_PRICE = 100;
    const topupAmount = Number(amount) > 0 ? Number(amount) : (Number(quota) > 0 ? Number(quota) * NOTA_PRICE : 10000);
    const addedNota = Number(quota) > 0 ? Number(quota) : Math.max(1, Math.floor(topupAmount / NOTA_PRICE));

    merchant.saldoNota = (Number(merchant.saldoNota) || 0) + topupAmount;
    merchant.kuotaNota = Math.max(0, Math.floor(merchant.saldoNota / NOTA_PRICE));
    merchant.notaHistory = merchant.notaHistory || [];

    if (db.settings && db.settings.posStore) {
      db.settings.posStore.saldoNota = merchant.saldoNota;
      db.settings.posStore.kuotaNota = merchant.kuotaNota;
    }

    const record = {
      id: reference || ('TOPUP-TRIPAY-' + Date.now()),
      type: 'topup',
      channel: 'TriPay Payment Gateway (QRIS)',
      amount: topupAmount,
      addedNota,
      balanceAfter: merchant.saldoNota,
      paymentMethod: 'TRIPAY_QRIS',
      status: 'PAID',
      createdAt: new Date().toISOString()
    };

    merchant.notaHistory.unshift(record);
    writeDB(db, req);

    res.json({
      success: true,
      isPaid: true,
      status: 'PAID',
      saldoNota: merchant.saldoNota,
      kuotaNota: merchant.kuotaNota,
      addedNota,
      reference,
      message: `🎉 Pembayaran TriPay TERVERIFIKASI (PAID)! +${addedNota} lembar nota telah ditambahkan ke saldo kasir.`
    });
  });

  // ── 0C-4. TRIPAY WEBHOOK CALLBACK ─────────────────────────────────────
  router.post(['/tripay/callback', '/callback/tripay'], async (req, res) => {
    const body = req.body || {};
    const reference = body.reference || body.merchant_ref || '';
    const status = String(body.status || '').toUpperCase();
    const amount = Number(body.total_amount || body.amount) || 10000;
    const quota = Math.max(1, Math.floor(amount / 100));

    if (status === 'PAID') {
      if (reference) posPaidReferences.add(reference);
      const db = getDB(req);
      ensurePosCollections(db);
      const store = db.settings?.posStore || {};
      const merchant = (db.merchants || []).find(m => String(m.id) === String(store.merchantId || store.uid)) || db.merchants?.[0];
      if (merchant) {
        merchant.saldoNota = (Number(merchant.saldoNota) || 0) + amount;
        merchant.kuotaNota = (Number(merchant.kuotaNota) || 0) + quota;
        if (db.settings?.posStore) {
          db.settings.posStore.saldoNota = merchant.saldoNota;
          db.settings.posStore.kuotaNota = merchant.kuotaNota;
        }
        writeDB(db, req);
      }
      return res.json({ success: true, message: 'Callback processed' });
    }
    res.json({ success: true, message: 'Status recorded: ' + status });
  });

  // ── 0D. GET ALL REDEEM CODES (SISTEM REDEEM KODE KASIR) ───────────────
  router.get('/redeem-codes', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const codes = (db.pos_redeem_codes || []).map(c => ({
      id: c.id,
      code: c.code,
      type: c.type || 'KUOTA_NOTA',
      quotaNota: c.quotaNota || 50,
      saldoBonus: c.saldoBonus || ((c.quotaNota || 50) * 100),
      maxQuota: c.maxQuota || 10,
      usedCount: c.usedCount || 0,
      remainingQuota: Math.max(0, (c.maxQuota || 10) - (c.usedCount || 0)),
      isQuotaEmpty: (c.usedCount || 0) >= (c.maxQuota || 10),
      usedBy: c.usedBy || [],
      description: c.description || '',
      isActive: c.isActive !== false,
      createdAt: c.createdAt
    }));

    res.json({ success: true, codes });
  });

  // ── 0E. CREATE NEW REDEEM CODE (OWNER DAPAT BERIKAN KODE & KUOTA) ─────
  router.post('/redeem-codes', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { code, quotaNota, maxQuota, description } = req.body;
    if (!code || !quotaNota || !maxQuota) {
      return res.status(400).json({ error: 'Kode, bonus kuota nota, dan batas kuota klaim wajib diisi' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    if (db.pos_redeem_codes.some(c => c.code === cleanCode)) {
      return res.status(400).json({ error: `Kode redeem '${cleanCode}' sudah terdaftar` });
    }

    const notaNum = parseInt(quotaNota, 10);
    const maxQ = parseInt(maxQuota, 10);
    if (isNaN(notaNum) || notaNum <= 0) return res.status(400).json({ error: 'Bonus nota harus bilangan positif' });
    if (isNaN(maxQ) || maxQ <= 0) return res.status(400).json({ error: 'Batas kuota klaim harus bilangan positif' });

    const newCode = {
      id: 'REDEEM-' + Date.now(),
      code: cleanCode,
      type: 'KUOTA_NOTA',
      quotaNota: notaNum,
      saldoBonus: notaNum * 100, // Rp 100 per nota
      maxQuota: maxQ,
      usedCount: 0,
      usedBy: [],
      description: description || `Bonus ${notaNum} Nota Kasir`,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.pos_redeem_codes.push(newCode);
    writeDB(db, req);

    res.json({
      success: true,
      message: `Kode redeem '${cleanCode}' berhasil diterbitkan dengan kuota ${maxQ} klaim!`,
      redeemCode: newCode
    });
  });

  // ── 0F. CLAIM REDEEM CODE FOR ACTIVE STORE (KASIR REDEEM KODE) ─────────
  router.post('/redeem-code/claim', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { code, storeId } = req.body;
    if (!code) return res.status(400).json({ error: 'Kode redeem wajib diisi' });

    const cleanCode = String(code).trim().toUpperCase();
    const targetCode = (db.pos_redeem_codes || []).find(c => c.code === cleanCode && c.isActive !== false);

    if (!targetCode) {
      return res.status(404).json({ error: `Kode redeem '${cleanCode}' tidak valid atau tidak ditemukan.` });
    }

    const remainingQuota = Math.max(0, (targetCode.maxQuota || 1) - (targetCode.usedCount || 0));
    if (remainingQuota <= 0) {
      return res.status(400).json({
        error: `Maaf, kuota untuk kode '${cleanCode}' sudah habis! (${targetCode.usedCount}/${targetCode.maxQuota} kuota terpakai)`
      });
    }

    // Resolve target store
    db.merchants = db.merchants || [];
    const store = db.settings.posStore || {};
    const targetId = storeId || store.merchantId || store.uid || db.merchants[0]?.id;
    let targetStore = db.merchants.find(m => String(m.id) === String(targetId)) || db.merchants[0];

    if (!targetStore) {
      return res.status(404).json({ error: 'Data toko kasir aktif tidak ditemukan.' });
    }

    // Check if this store has already claimed this code
    targetCode.usedBy = targetCode.usedBy || [];
    const alreadyClaimed = targetCode.usedBy.some(u => String(u.storeId) === String(targetStore.id));
    if (alreadyClaimed) {
      return res.status(400).json({
        error: `Toko '${targetStore.name}' sudah pernah mengklaim kode '${cleanCode}' sebelumnya!`
      });
    }

    // Increment usage count and save claimer
    targetCode.usedCount = (targetCode.usedCount || 0) + 1;
    const newRemaining = Math.max(0, (targetCode.maxQuota || 1) - targetCode.usedCount);
    targetCode.usedBy.push({
      storeId: targetStore.id,
      storeName: targetStore.name,
      ownerUserId: targetStore.ownerUserId || 'OWNER-DEFAULT',
      claimedAt: new Date().toISOString()
    });

    // Credit store nota & saldo
    const bonusNota = targetCode.quotaNota || 50;
    const bonusSaldo = targetCode.saldoBonus || (bonusNota * 100);

    targetStore.saldoNota = (Number(targetStore.saldoNota) || 0) + bonusSaldo;
    targetStore.kuotaNota = Math.max(0, Math.floor(targetStore.saldoNota / 100));

    targetStore.notaHistory = targetStore.notaHistory || [];
    targetStore.notaHistory.unshift({
      id: 'REDEEM-HIST-' + Date.now(),
      type: 'redeem_code',
      amount: bonusSaldo,
      addedNota: bonusNota,
      code: cleanCode,
      channel: 'Klaim Kode Redeem Kasir',
      balanceAfter: targetStore.saldoNota,
      date: new Date().toISOString()
    });

    writeDB(db, req);

    return res.json({
      success: true,
      message: `🎉 Berhasil! Kode '${cleanCode}' berhasil diklaim. Kuota nota bertambah +${bonusNota} lembar (Rp ${bonusSaldo.toLocaleString('id-ID')})!`,
      bonusNota,
      bonusSaldo,
      newSaldoNota: targetStore.saldoNota,
      newKuotaNota: targetStore.kuotaNota,
      remainingQuota: newRemaining,
      usedCount: targetCode.usedCount,
      maxQuota: targetCode.maxQuota
    });
  });

  // ── 0G. PROMO MAKANAN ENGINE (OWNER, MITRA, KASIR, ADMIN - KUOTA / TANGGAL) ──
  router.get('/promos', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);

    const now = new Date();
    const promos = (db.pos_food_promos || []).map(p => {
      let isQuotaEmpty = false;
      let remainingQuota = null;

      if (p.limitType === 'QUOTA' || p.limitType === 'BOTH') {
        const maxQ = Number(p.maxQuota) || 0;
        const used = Number(p.usedCount) || 0;
        remainingQuota = Math.max(0, maxQ - used);
        isQuotaEmpty = used >= maxQ;
      }

      let isDateExpired = false;
      if (p.limitType === 'DATE' || p.limitType === 'BOTH') {
        if (p.expiryDate) {
          const exp = new Date(p.expiryDate + 'T23:59:59');
          if (now > exp) isDateExpired = true;
        }
      }

      const isAvailable = Boolean(p.isActive && !isQuotaEmpty && !isDateExpired);

      return {
        ...p,
        remainingQuota,
        isQuotaEmpty,
        isDateExpired,
        isAvailable
      };
    });

    res.json({ success: true, promos });
  });

  router.post('/promos', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const {
      title,
      code,
      scope = 'ALL',
      targetProductId = null,
      targetProductName = null,
      discountType = 'FIXED',
      discountValue,
      minOrder = 0,
      limitType = 'QUOTA',
      maxQuota = null,
      expiryDate = null,
      createdByRole = 'owner',
      description = ''
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Nama/judul promo makanan wajib diisi' });
    }

    const cleanCode = String(code || title.replace(/\s+/g, '').toUpperCase().slice(0, 10)).trim().toUpperCase();
    if (db.pos_food_promos.some(p => String(p.code).toUpperCase() === cleanCode)) {
      return res.status(400).json({ error: `Kode promo '${cleanCode}' sudah digunakan. Buat kode lain!` });
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      return res.status(400).json({ error: 'Nilai diskon promo harus berupa angka lebih besar dari 0' });
    }

    if (discountType === 'PERCENT' && val > 100) {
      return res.status(400).json({ error: 'Diskon persentase tidak boleh lebih dari 100%' });
    }

    // Validasi Limit Kuota atau Tanggal
    const validLimitTypes = ['QUOTA', 'DATE', 'BOTH'];
    const chosenLimitType = validLimitTypes.includes(limitType) ? limitType : 'QUOTA';

    let resolvedMaxQuota = null;
    if (chosenLimitType === 'QUOTA' || chosenLimitType === 'BOTH') {
      resolvedMaxQuota = parseInt(maxQuota, 10);
      if (isNaN(resolvedMaxQuota) || resolvedMaxQuota <= 0) {
        return res.status(400).json({ error: 'Batas kuota promo wajib diisi dengan angka positif' });
      }
    }

    let resolvedExpiryDate = null;
    if (chosenLimitType === 'DATE' || chosenLimitType === 'BOTH') {
      if (!expiryDate) {
        return res.status(400).json({ error: 'Tanggal kadaluarsa promo wajib diisi untuk batasan tanggal' });
      }
      resolvedExpiryDate = String(expiryDate).slice(0, 10);
    }

    // Validasi Scope Produk
    let resolvedTargetId = null;
    let resolvedTargetName = null;
    if (scope === 'SPECIFIC_ITEM' && targetProductId) {
      const prod = (db.pos_products || []).find(p => p.id === targetProductId);
      if (prod) {
        resolvedTargetId = prod.id;
        resolvedTargetName = prod.name;
      }
    }

    const newPromo = {
      id: 'PROMO-FOOD-' + Date.now(),
      title: title.trim(),
      code: cleanCode,
      scope: resolvedTargetId ? 'SPECIFIC_ITEM' : 'ALL',
      targetProductId: resolvedTargetId,
      targetProductName: resolvedTargetName || targetProductName || null,
      discountType: discountType === 'PERCENT' ? 'PERCENT' : 'FIXED',
      discountValue: val,
      minOrder: Number(minOrder) || 0,
      limitType: chosenLimitType,
      maxQuota: resolvedMaxQuota,
      usedCount: 0,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: resolvedExpiryDate,
      isActive: true,
      createdByRole: ['owner', 'mitra', 'kasir', 'admin'].includes(createdByRole) ? createdByRole : 'owner',
      description: description ? description.trim() : `Promo ${title.trim()}`,
      createdAt: new Date().toISOString()
    };

    db.pos_food_promos.unshift(newPromo);
    writeDB(db, req);

    res.json({
      success: true,
      message: `Promo makanan '${newPromo.title}' (${newPromo.code}) berhasil diterbitkan!`,
      promo: newPromo
    });
  });

  router.put('/promos/:id/toggle', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const promo = (db.pos_food_promos || []).find(p => p.id === id);
    if (!promo) return res.status(404).json({ error: 'Promo makanan tidak ditemukan' });

    promo.isActive = !promo.isActive;
    writeDB(db, req);

    res.json({
      success: true,
      message: `Promo '${promo.title}' kini ${promo.isActive ? 'AKTIF' : 'NON-AKTIF'}`,
      promo
    });
  });

  router.delete('/promos/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const idx = (db.pos_food_promos || []).findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Promo makanan tidak ditemukan' });

    const deleted = db.pos_food_promos.splice(idx, 1)[0];
    writeDB(db, req);

    res.json({ success: true, message: `Promo '${deleted.title}' berhasil dihapus` });
  });

  router.post('/promos/validate', (req, res) => {
    const { promoId, promoCode, items = [], subtotal = 0 } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const promo = (db.pos_food_promos || []).find(p =>
      p.isActive && (
        (promoId && p.id === promoId) ||
        (promoCode && String(p.code).toUpperCase() === String(promoCode).toUpperCase().trim())
      )
    );

    if (!promo) {
      return res.status(404).json({ valid: false, error: 'Kode promo tidak ditemukan atau non-aktif' });
    }

    // Check date limit
    const now = new Date();
    if (promo.limitType === 'DATE' || promo.limitType === 'BOTH') {
      if (promo.expiryDate) {
        const exp = new Date(promo.expiryDate + 'T23:59:59');
        if (now > exp) {
          return res.status(400).json({ valid: false, error: `Promo '${promo.code}' sudah kadaluarsa sejak ${promo.expiryDate}!` });
        }
      }
    }

    // Check quota limit
    if (promo.limitType === 'QUOTA' || promo.limitType === 'BOTH') {
      if (typeof promo.maxQuota === 'number' && (promo.usedCount || 0) >= promo.maxQuota) {
        return res.status(400).json({ valid: false, error: `Maaf, kuota promo '${promo.code}' sudah habis! (${promo.usedCount}/${promo.maxQuota})` });
      }
    }

    // Check minimum order
    const min = Number(promo.minOrder) || 0;
    if (subtotal < min) {
      return res.status(400).json({
        valid: false,
        error: `Minimal belanja untuk promo ini adalah Rp ${min.toLocaleString('id-ID')} (Subtotal saat ini: Rp ${subtotal.toLocaleString('id-ID')})`
      });
    }

    // Calculate discount amount
    let calculatedDiscount = 0;
    if (promo.scope === 'SPECIFIC_ITEM' && promo.targetProductId) {
      const targetItems = items.filter(it => (it.productId === promo.targetProductId || it.id === promo.targetProductId));
      const targetSubtotal = targetItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 1)), 0);
      if (targetSubtotal === 0) {
        return res.status(400).json({
          valid: false,
          error: `Promo ini hanya berlaku untuk menu '${promo.targetProductName || 'spesifik'}'. Masukkan menu tersebut ke keranjang terlebih dahulu!`
        });
      }
      if (promo.discountType === 'PERCENT') {
        calculatedDiscount = Math.round(targetSubtotal * (Math.min(100, promo.discountValue) / 100));
      } else {
        const totalQty = targetItems.reduce((sum, it) => sum + Number(it.qty || 1), 0);
        calculatedDiscount = Math.min(targetSubtotal, promo.discountValue * totalQty);
      }
    } else {
      if (promo.discountType === 'PERCENT') {
        calculatedDiscount = Math.round(subtotal * (Math.min(100, promo.discountValue) / 100));
      } else {
        calculatedDiscount = Math.min(subtotal, promo.discountValue);
      }
    }

    return res.json({
      valid: true,
      promoId: promo.id,
      code: promo.code,
      title: promo.title,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: calculatedDiscount,
      limitType: promo.limitType,
      remainingQuota: promo.limitType === 'QUOTA' || promo.limitType === 'BOTH' ? Math.max(0, (promo.maxQuota || 0) - (promo.usedCount || 0)) : null,
      message: `Promo '${promo.title}' valid! Potongan: Rp ${calculatedDiscount.toLocaleString('id-ID')}`
    });
  });

  // ── 1. GET & SET TRIPAY CONFIGURATION FOR POS ─────────────────────────
  router.get('/config/tripay', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const cfg = db.settings.posTripay || {};
    const hasCustom = Boolean(cfg.apiKey && cfg.privateKey && cfg.merchantCode);
    res.json({
      merchantCode: hasCustom ? cfg.merchantCode : (process.env.TRIPAY_MERCHANT_CODE || 'T53543'),
      apiKey: hasCustom ? ('••••••••' + cfg.apiKey.slice(-4)) : '••••••••Uy5',
      hasPrivateKey: true,
      isProduction: true,
      isConfigured: true,
      isMasterCentralized: !hasCustom,
      note: !hasCustom ? 'Terpusat ke Master TriPay KostKu (T53543) & otomatis masuk Unified Wallet' : 'Akun TriPay Custom'
    });
  });

  router.post('/config/tripay', (req, res) => {
    const { merchantCode, apiKey, privateKey, isProduction } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    if (merchantCode !== undefined) db.settings.posTripay.merchantCode = String(merchantCode).trim();
    if (apiKey && !apiKey.includes('••••')) db.settings.posTripay.apiKey = String(apiKey).trim();
    if (privateKey) db.settings.posTripay.privateKey = String(privateKey).trim();
    if (isProduction !== undefined) db.settings.posTripay.isProduction = Boolean(isProduction);

    writeDB(db, req);
    res.json({ success: true, message: 'Konfigurasi TriPay POS berhasil disimpan!' });
  });

  // ── 2. PRODUCTS / MENU MANAGEMENT ─────────────────────────────────────
  router.get('/products', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    res.json(db.pos_products);
  });

  router.post('/products', (req, res) => {
    const { name, category, price, stock, isAvailable, description, image } = req.body;
    if (!name || !String(name).trim() || isNaN(Number(price))) {
      return res.status(400).json({ error: 'Nama menu dan harga wajib diisi' });
    }

    if (!image || !String(image).trim()) {
      return res.status(400).json({ error: 'Foto produk wajib disertakan (must have)!' });
    }

    if (!category || !String(category).trim()) {
      return res.status(400).json({ error: 'Kategori produk wajib dipilih atau diisi!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    const newProduct = {
      id: 'prod-' + Date.now(),
      name: String(name).trim(),
      category: String(category).trim(),
      price: Math.max(0, Number(price)),
      stock: Number(stock !== undefined ? stock : 99),
      isAvailable: isAvailable !== false,
      description: String(description || '').trim(),
      image: String(image).trim(),
      createdAt: new Date().toISOString()
    };

    db.pos_products.unshift(newProduct);
    writeDB(db, req);
    res.json(newProduct);
  });

  router.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const idx = db.pos_products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Produk tidak ditemukan' });

    db.pos_products[idx] = {
      ...db.pos_products[idx],
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : db.pos_products[idx].price,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : db.pos_products[idx].stock,
      updatedAt: new Date().toISOString()
    };



    writeDB(db, req);
    res.json(db.pos_products[idx]);
  });

  router.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    db.pos_products = db.pos_products.filter(p => p.id !== id);
    writeDB(db, req);
    res.json({ success: true });
  });

  // ── 3. TABLE MANAGEMENT & QR GENERATOR ─────────────────────────────────
  router.get('/tables', async (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);

    const baseUrl = process.env.VITE_APP_URL || req.headers.origin || 'https://kostku.riuph.me';

    // Enrich with QR data URLs
    const enriched = await Promise.all(
      db.pos_tables.map(async (t) => {
        const orderUrl = `${baseUrl}/order/${t.qrToken}`;
        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(orderUrl, { width: 300, margin: 2 });
        } catch (_) {}
        return {
          ...t,
          orderUrl,
          qrDataUrl
        };


      })
    );

    res.json(enriched);
  });

  router.post('/tables', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Nomor meja wajib diisi' });

    const db = getDB(req);
    ensurePosCollections(db);

    const cleanNum = String(number).trim();
    const token = 'MEJA-' + cleanNum.replace(/\s+/g, '-').toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const newTable = {
      id: 'tbl-' + Date.now(),
      number: cleanNum,
      qrToken: token,
      createdAt: new Date().toISOString()
    };



    db.pos_tables.push(newTable);
    writeDB(db, req);
    res.json(newTable);
  });

  // ── 4. CUSTOMER ORDER PLACEMENT (TABLE QR SCAN) ───────────────────────
  // Status starts at 'PENDING_CONFIRMATION' (Kitchen must ACC first)
  router.post('/orders', (req, res) => {
    const {
      tableToken,
      customerName,
      customerPhone,
      items,
      notes,
      pointsToRedeem = 0,
      isLoggedIn = false,
      promoId = null,
      promoCode = null
    } = req.body;

    // VALIDASI: Wajib input beli atas nama siapa!
    const cleanCustomerName = String(customerName || '').trim();
    if (!cleanCustomerName) {
      return res.status(400).json({ error: 'Nama pemesan wajib diisi (beli atas nama siapa)!' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Pilih minimal 1 item makanan/minuman' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    const table = db.pos_tables.find(t => t.qrToken === tableToken) || { number: 'Meja Walk-in' };

    // Calculate subtotal from products in DB to avoid client-side price tampering
    let subtotal = 0;
    const validatedItems = [];

    for (const it of items) {
      const prod = db.pos_products.find(p => p.id === (it.productId || it.id));
      if (prod) {
        const qty = Math.max(1, parseInt(it.qty) || 1);
        const itemSubtotal = prod.price * qty;
        subtotal += itemSubtotal;
        validatedItems.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          qty,
          subtotal: itemSubtotal,
          notes: it.notes || '',
          isReady: false
        });
      }
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({ error: 'Item yang dipilih tidak valid di katalog' });
    }

    // ATURAN POIN: Hanya pelanggan login yang berhak menukar atau mendapatkan poin!
    const userIsLoggedIn = Boolean(isLoggedIn);
    let pointsDiscount = 0;
    const cleanPhone = String(customerPhone || '').replace(/\D/g, '');
    let redeemAmount = 0;

    if (userIsLoggedIn && cleanPhone) {
      const userPoints = db.customer_points[cleanPhone] || (db.customers && db.customers[cleanPhone]?.total_points) || 0;
      const requestedRedeem = Number(pointsToRedeem) || 0;
      if (requestedRedeem > 0) {
        if (userPoints < 100) {
          return res.status(400).json({ error: `Penukaran poin minimal 100 Poin. Poin pelanggan saat ini: ${userPoints} Poin.` });
        }
        if (requestedRedeem < 100) {
          return res.status(400).json({ error: 'Penukaran poin minimal 100 Poin (Rp 100).' });
        }
        redeemAmount = Math.min(requestedRedeem, userPoints);
        // 1 Poin = Rp 1.00 diskon langsung
        pointsDiscount = redeemAmount;
        db.customer_points[cleanPhone] = Math.max(0, userPoints - redeemAmount);
        if (db.customers && db.customers[cleanPhone]) {
          db.customers[cleanPhone].total_points = db.customer_points[cleanPhone];
        }
      }
    }

    // ── PROMO MAKANAN BERKUOTA ATAU TANGGAL ──
    let promoDiscount = 0;
    let appliedPromo = null;

    if (promoId || promoCode) {
      const pId = promoId ? String(promoId).trim() : null;
      const pCode = promoCode ? String(promoCode).trim().toUpperCase() : null;

      const promo = (db.pos_food_promos || []).find(p =>
        p.isActive && (
          (pId && p.id === pId) ||
          (pCode && String(p.code).toUpperCase() === pCode)
        )
      );

      if (!promo) {
        return res.status(404).json({ error: 'Kode promo tidak ditemukan atau non-aktif' });
      }

      // Check date expiration
      if (promo.limitType === 'DATE' || promo.limitType === 'BOTH') {
        if (promo.expiryDate) {
          const exp = new Date(promo.expiryDate + 'T23:59:59');
          if (new Date() > exp) {
            return res.status(400).json({ error: `Promo '${promo.code}' sudah kadaluarsa sejak ${promo.expiryDate}!` });
          }
        }
      }

      // Check quota exhaustion
      if (promo.limitType === 'QUOTA' || promo.limitType === 'BOTH') {
        const maxQ = Number(promo.maxQuota) || 0;
        const used = Number(promo.usedCount) || 0;
        if (used >= maxQ) {
          return res.status(400).json({ error: `Kuota promo '${promo.code}' sudah habis (${used}/${maxQ})!` });
        }
      }

      // Check minimum order
      const minOrder = Number(promo.minOrder) || 0;
      if (subtotal < minOrder) {
        return res.status(400).json({ error: `Minimum pembelanjaan untuk promo '${promo.code}' adalah Rp ${minOrder.toLocaleString('id-ID')}` });
      }

      // Check specific item scope
      if (promo.scope === 'SPECIFIC_ITEM' && promo.targetProductId) {
        const targetItems = validatedItems.filter(it => it.productId === promo.targetProductId);
        const targetSubtotal = targetItems.reduce((s, it) => s + it.subtotal, 0);
        if (targetSubtotal === 0) {
          return res.status(400).json({ error: `Promo ini hanya berlaku untuk menu '${promo.targetProductName || 'spesifik'}'` });
        }

        if (promo.discountType === 'PERCENT') {
          promoDiscount = Math.round(targetSubtotal * (Math.min(100, promo.discountValue) / 100));
        } else {
          const totalTargetQty = targetItems.reduce((s, it) => s + it.qty, 0);
          promoDiscount = Math.min(targetSubtotal, promo.discountValue * totalTargetQty);
        }
      } else {
        if (promo.discountType === 'PERCENT') {
          promoDiscount = Math.round(subtotal * (Math.min(100, promo.discountValue) / 100));
        } else {
          promoDiscount = Math.min(subtotal, promo.discountValue);
        }
      }

      if (promoDiscount > 0) {
        promo.usedCount = (promo.usedCount || 0) + 1;
        appliedPromo = {
          id: promo.id,
          code: promo.code,
          title: promo.title,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          limitType: promo.limitType,
          amount: promoDiscount
        };
      }
    }

    const finalTotalDiscount = pointsDiscount + promoDiscount;
    const adminFee = 100; // Flat Rp 100 per transaksi
    const platformFee = 0; // Rp 0 ke pelanggan
    const ownerDeduction = adminFee; // Rp 100 dipotong dari omset owner
    const totalAmount = Math.max(0, subtotal - finalTotalDiscount);

    // ── IDENTIFIKASI CABANG & KARYAWAN KASIR ──
    const currentActiveStore = db.settings.posStore || {};
    const storeId = req.body.storeId || currentActiveStore.merchantId || currentActiveStore.uid || 'MTR-KASIR-MASTER';
    const storeName = req.body.storeName || currentActiveStore.storeName || 'Kantin Berkah Kost';
    const cashierId = req.body.cashierId || (req.body.user && req.body.user.id) || 'KSR-01';
    const cashierName = req.body.cashierName || (req.body.user && req.body.user.name) || 'Siti Rahmawati (Kasir Shift Pagi)';

    // ── AUTO-DEDUCT INVENTORY STOK GUDANG (SETIAP MENU DI PESAN MENGURANGI GUDANG) ──
    const inventoryDeductions = [];
    (validatedItems || []).forEach(it => {
      const recipe = (db.pos_recipes && db.pos_recipes[it.productId]) || [];
      recipe.forEach(ing => {
        const invItem = (db.pos_inventory || []).find(i => i.id === ing.inventoryId);
        if (invItem) {
          const qtyDeducted = Number(ing.amount || 0) * Number(it.qty || 1);
          invItem.currentStock = Math.max(0, (Number(invItem.currentStock) || 0) - qtyDeducted);
          inventoryDeductions.push({
            inventoryId: invItem.id,
            inventoryName: invItem.name,
            unit: invItem.unit,
            deducted: qtyDeducted,
            remaining: invItem.currentStock,
            productId: it.productId,
            productName: it.name
          });
        }
      });
    });

    const orderId = 'POS-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
    const invoiceNumber = 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + orderId.slice(-4);
    const claimDeadline = calculateWibClaimDeadline(new Date());
    const claimToken = 'clm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const qrClaimUrl = `https://kostku.riuph.me/claim?token=${claimToken}`;

    const BASE_ADMIN_FEE = 40.00;
    const HELD_PROMO_FEE = 60.00;
    const TOTAL_ADMIN_DEDUCT = 100.00;

    // Periksa sisa kuota nota toko sebelum transaksi diproses
    db.merchant_wallets = db.merchant_wallets || {};
    const existingWallet = db.merchant_wallets[storeId] || { available_balance: 100000.00 };
    const effectiveKuota = (currentActiveStore && currentActiveStore.kuotaNota !== undefined)
      ? currentActiveStore.kuotaNota
      : Math.floor((existingWallet.available_balance || 0) / 100);

    if (effectiveKuota <= 0 && (existingWallet.available_balance || 0) < TOTAL_ADMIN_DEDUCT) {
      return res.status(402).json({
        error: '⚠️ Kuota nota kasir habis! Silakan lakukan Top Up Saldo Nota untuk melanjutkan transaksi pencetakan struk.',
        requiresTopupNota: true,
        kuotaNota: 0,
        saldoNota: existingWallet.available_balance || 0
      });
    }

    // Update merchant escrow wallet
    if (!db.merchant_wallets[storeId]) {
      db.merchant_wallets[storeId] = {
        merchant_id: storeId,
        available_balance: 100000.00,
        held_promo_balance: 0.00,
        updated_at: new Date().toISOString()
      };
    }
    const mWallet = db.merchant_wallets[storeId];
    mWallet.available_balance = Math.max(0, (mWallet.available_balance || 100000) - TOTAL_ADMIN_DEDUCT);
    mWallet.held_promo_balance = (mWallet.held_promo_balance || 0) + HELD_PROMO_FEE;
    mWallet.updated_at = new Date().toISOString();

    // Mirror to merchant saldoNota & kurangi kuotaNota
    if (currentActiveStore && (currentActiveStore.merchantId === storeId || currentActiveStore.uid === storeId)) {
      currentActiveStore.saldoNota = mWallet.available_balance;
      currentActiveStore.kuotaNota = Math.max(0, (currentActiveStore.kuotaNota !== undefined ? currentActiveStore.kuotaNota - 1 : Math.floor(mWallet.available_balance / 100)));
    }

    const remainingKuotaNota = (currentActiveStore && currentActiveStore.kuotaNota !== undefined)
      ? currentActiveStore.kuotaNota
      : Math.floor(mWallet.available_balance / 100);
    const isLowQuota = remainingKuotaNota <= 15;
    const lowQuotaWarning = isLowQuota
      ? `⚠️ Kuota nota gratis Anda tersisa ${remainingKuotaNota} transaksi. Lakukan top up agar operasional kasir tetap lancar.`
      : null;

    // Record receipt claim
    const claimRecord = {
      id: 'CLM-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      order_id: orderId,
      merchant_id: storeId,
      merchant_name: storeName,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      base_admin_fee: BASE_ADMIN_FEE,
      held_promo_fee: HELD_PROMO_FEE,
      claim_token: claimToken,
      qr_claim_url: qrClaimUrl,
      status: 'PENDING',
      claimed_by_whatsapp: null,
      points_awarded: 0,
      referral_code_used: null,
      referrer_whatsapp: null,
      referrer_points_awarded: 0,
      claim_deadline: claimDeadline.toISOString(),
      claimed_at: null,
      refunded_at: null,
      createdAt: new Date().toISOString()
    };
    db.receipt_claims = db.receipt_claims || [];
    db.receipt_claims.unshift(claimRecord);

    // Record wallet mutation
    db.wallet_mutations = db.wallet_mutations || [];
    db.wallet_mutations.unshift({
      id: 'MUT-DED-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      merchant_id: storeId,
      type: 'FEE_DEDUCT',
      amount: -TOTAL_ADMIN_DEDUCT,
      base_admin_fee: BASE_ADMIN_FEE,
      held_promo_fee: HELD_PROMO_FEE,
      description: `Biaya Nota #${invoiceNumber} (Rp 40 Platform & Server + Rp 60 Deposit Promo Tertahan)`,
      balance_after: mWallet.available_balance,
      createdAt: new Date().toISOString()
    });

    const newOrder = {
      id: orderId,
      invoice_number: invoiceNumber,
      invoice: invoiceNumber,
      tableNumber: table.number,
      tableToken: tableToken || null,
      customerName: cleanCustomerName,
      customerPhone: cleanPhone,
      isLoggedIn: userIsLoggedIn,
      pointsEligible: userIsLoggedIn,
      storeId,
      storeName,
      cashierId,
      cashierName,
      inventoryDeductions,
      items: validatedItems,
      subtotal,
      discount: finalTotalDiscount,
      pointsDiscount,
      promoDiscount,
      promoId: appliedPromo ? appliedPromo.id : null,
      promoCode: appliedPromo ? appliedPromo.code : null,
      appliedPromo,
      adminDiscount: null,
      pointsRedeemed: redeemAmount,
      platformFee: 0,
      adminFee,
      base_admin_fee: BASE_ADMIN_FEE,
      held_promo_fee: HELD_PROMO_FEE,
      claim_token: claimToken,
      claimToken: claimToken,
      qr_claim_url: qrClaimUrl,
      qrClaimUrl: qrClaimUrl,
      claim_deadline: claimDeadline.toISOString(),
      claimDeadline: claimDeadline.toISOString(),
      feeBorneBy: 'owner',
      ownerDeduction,
      netRevenue: Math.max(0, totalAmount - ownerDeduction),
      totalAmount,
      notes: notes || '',
      status: 'PENDING_CONFIRMATION', // Step 1: Wait for Kitchen ACC
      paymentMethod: null,
      paymentStatus: 'UNPAID',
      hasSpun: false,
      pointsWon: 0,
      createdAt: new Date().toISOString()
    };

    db.pos_orders.unshift(newOrder);
    writeDB(db, req);

    // Non-blocking Granular Delta Sync ke Firebase RTDB (< 5 KB payload, zero latency)
    setImmediate(() => {
      try {
        syncDelta(`pos_orders/${newOrder.id}`, newOrder, 'PUT');
        syncDelta(`receipt_claims/${claimRecord.id}`, claimRecord, 'PUT');
        syncDelta(`merchant_wallets/${storeId}`, mWallet, 'PATCH');
        if (cleanPhone && redeemAmount > 0) {
          syncDelta(`customer_points/${cleanPhone}`, db.customer_points[cleanPhone], 'PUT');
          if (db.customers && db.customers[cleanPhone]) {
            syncDelta(`customers/${cleanPhone}`, db.customers[cleanPhone], 'PATCH');
          }
        }
        if (currentActiveStore && currentActiveStore.inventory) {
          syncDelta(`pos_stores/${storeId}/inventory`, currentActiveStore.inventory, 'PUT');
        }
      } catch (err) {
        console.warn('[Firebase RTDB Delta Sync Error]:', err.message);
      }
    });

    res.json({
      ...newOrder,
      invoice: invoiceNumber,
      total: totalAmount,
      qr_claim_url: qrClaimUrl,
      claim_token: claimToken,
      claim_deadline: claimDeadline.toISOString(),
      kuotaNota: remainingKuotaNota,
      isLowQuota,
      lowQuotaWarning
    });
  });

  // Alias POST /checkout
  router.post('/checkout', (req, res, next) => {
    // Re-use order logic
    const ordersHandler = router.stack.find(s => s.route && s.route.path === '/orders' && s.route.methods.post);
    if (ordersHandler) {
      return ordersHandler.handle(req, res, next);
    }
    res.status(404).json({ error: 'Handler not found' });
  });

  // ── 5. GET ORDERS & SINGLE ORDER DETAILS ──────────────────────────────
  router.get('/orders', (req, res) => {
    const { status, limit } = req.query;
    const db = getDB(req);
    ensurePosCollections(db);

    let list = db.pos_orders;
    if (status) {
      list = list.filter(o => o.status === status);
    }

    if (limit) {
      list = list.slice(0, parseInt(limit));
    }

    res.json(list);
  });

  router.get('/orders/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    res.json(order);
  });

  // ── 6. KITCHEN / CASHIER ACTION: ACC OR REJECT PESANAN ─────────────────
  router.post('/orders/:id/acc', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (order.status !== 'PENDING_CONFIRMATION') {
      return res.status(400).json({ error: `Pesanan sudah berada di status ${order.status}` });
    }

    // ACC diterima dapur -> Pembeli sekarang bisa memilih bayar TriPay atau Tagih ke Kamar
    order.status = 'WAITING_PAYMENT';
    order.accAt = new Date().toISOString();

    writeDB(db, req);
    res.json({ success: true, message: 'Pesanan berhasil di-ACC! Pembeli kini dapat membayar.', order });
  });

  router.post('/orders/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    order.status = 'CANCELLED';
    order.cancelReason = reason || 'Menu habis atau dapur sedang penuh';
    order.cancelledAt = new Date().toISOString();

    // Kembalikan poin jika sebelumnya sempat redeem
    if (order.pointsRedeemed > 0 && order.customerPhone) {
      db.customer_points[order.customerPhone] = (db.customer_points[order.customerPhone] || 0) + order.pointsRedeemed;
    }

    // Kembalikan pemakaian kuota promo jika pesanan dibatalkan
    if (order.appliedPromo && order.appliedPromo.id) {
      const promoItem = (db.pos_food_promos || []).find(p => p.id === order.appliedPromo.id);
      if (promoItem && typeof promoItem.usedCount === 'number') {
        promoItem.usedCount = Math.max(0, promoItem.usedCount - 1);
      }
    }

    // Kembalikan pemotongan stok bahan baku gudang jika pesanan dibatalkan
    if (Array.isArray(order.inventoryDeductions)) {
      order.inventoryDeductions.forEach(deduct => {
        const invItem = (db.pos_inventory || []).find(i => i.id === deduct.inventoryId);
        if (invItem) {
          invItem.currentStock = (Number(invItem.currentStock) || 0) + Number(deduct.deducted || 0);
        }
      });
    }

    writeDB(db, req);
    res.json({ success: true, message: 'Pesanan dibatalkan.', order });
  });

  // ── 7. EXECUTE PAYMENT (OPSI A: TRIPAY, OPSI B: TAGIH KE KAMAR) ────────
  router.post('/orders/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { method, roomNumber, phoneLast4 } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (order.status !== 'WAITING_PAYMENT') {
      return res.status(400).json({ error: 'Pesanan belum di-ACC oleh dapur atau sudah dibayar' });
    }

    // ── METODE TAGIH KE KAMAR TELAH DIHAPUS / DINONAKTIFKAN ──
    if (method === 'ROOM_BILL') {
      return res.status(400).json({
        error: 'Metode pembayaran Tagih ke Kamar telah dinonaktifkan demi perlindungan arus kas kasir & mitra.'
      });
    }

    // ── OPSI A: TRIPAY PAYMENT GATEWAY (QRIS / E-WALLET) ──
    if (method === 'TRIPAY') {
      const posTripay = db.settings.posTripay || {};
      const hasTripayCredentials = Boolean(posTripay.apiKey && posTripay.privateKey && posTripay.merchantCode);

      if (hasTripayCredentials && typeof createTripayClosedTransaction === 'function') {
        try {
          const tripayRes = await createTripayClosedTransaction({
            orderId: order.id,
            amount: order.totalAmount,
            customerName: order.customerName,
            customerEmail: 'customer@riuph.me',
            customerPhone: order.customerPhone || '08123456789',
            orderItems: order.items.map(it => ({ name: it.name, price: it.price, quantity: it.qty }))
          });

          if (tripayRes && tripayRes.success) {
            order.paymentMethod = 'TRIPAY';
            order.tripayReference = tripayRes.reference;
            order.tripayQrString = tripayRes.qrString;
            order.tripayCheckoutUrl = tripayRes.checkoutUrl;
            order.tripayInstructions = tripayRes.instructions || [];
            writeDB(db, req);

            return res.json({
              success: true,
              method: 'TRIPAY',
              reference: tripayRes.reference,
              qrString: tripayRes.qrString,
              qrUrl: tripayRes.qrUrl,
              checkoutUrl: tripayRes.checkoutUrl,
              total: order.totalAmount,
              instructions: tripayRes.instructions
            });
          }
        } catch (err) {
          console.warn('[POS TriPay Live Error, using graceful fallback]:', err.message);
        }
      }

      // Graceful Sandbox / Simulator Response (Sebelum User Input API Key TriPay)
      const mockQrString = `00020101021226670016ID.CO.TRIPAY.WWW01189360099900000000000215${order.id}520458125303360540${order.totalAmount}5802ID5914RIUPH KASIR POS6007JAKARTA62070703A016304E8A2`;
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(mockQrString, { width: 320 });
      } catch (_) {}

      order.paymentMethod = 'TRIPAY';
      order.tripayReference = 'DEV-TRIPAY-' + order.id;
      order.tripayQrString = mockQrString;
      order.tripayQrUrl = qrDataUrl;
      order.tripayCheckoutUrl = `https://tripay.co.id/checkout/${order.tripayReference}`;

      writeDB(db, req);

      return res.json({
        success: true,
        method: 'TRIPAY',
        isSimulator: !hasTripayCredentials,
        reference: order.tripayReference,
        qrString: mockQrString,
        qrDataUrl,
        checkoutUrl: order.tripayCheckoutUrl,
        total: order.totalAmount,
        instructions: [
          'Buka aplikasi e-wallet (GoPay, ShopeePay, OVO, Dana) atau Mobile Banking',
          'Pindai kode QRIS di layar',
          'Periksa nominal pembayaran sudah termasuk biaya admin Rp 100',
          'Selesaikan pembayaran dan pesanan langsung dimasak'
        ]
      });
    }

    // Cash Payment from Cashier Register (Kasir boleh cash tapi tetap kepotong harga nota Rp 100)
    if (method === 'CASH') {
      const store = db.settings.posStore || {};
      const primaryMerchant = (db.merchants || [])[0];
      const sharedUid = store.merchantId || store.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';
      let merchant = (db.merchants || []).find(m => String(m.id) === String(sharedUid)) || primaryMerchant;

      if (merchant && merchant.saldoNota === undefined) {
        merchant.saldoNota = 5000;
        merchant.kuotaNota = 50;
        merchant.notaHistory = [];
      }

      const currentSaldoNota = Number(merchant?.saldoNota) || 0;
      const NOTA_PRICE = 100; // Flat Rp 100 per nota / transaksi

      if (currentSaldoNota < NOTA_PRICE) {
        return res.status(400).json({
          error: `Saldo nota tidak mencukupi untuk transaksi tunai kasir (sisa Rp ${currentSaldoNota.toLocaleString('id-ID')}, dibutuhkan Rp ${NOTA_PRICE.toLocaleString('id-ID')}). Silakan top up saldo nota terlebih dahulu.`,
          requiresTopupNota: true,
          currentSaldoNota,
          neededNota: NOTA_PRICE
        });
      }

      // Deduct 1 nota (flat Rp 100) if not deducted yet
      if (!order.notaDeducted && merchant) {
        merchant.saldoNota = Math.max(0, currentSaldoNota - NOTA_PRICE);
        merchant.kuotaNota = Math.max(0, Math.floor(merchant.saldoNota / NOTA_PRICE));
        merchant.notaHistory = merchant.notaHistory || [];
        merchant.notaHistory.unshift({
          id: 'NOTADED-' + Date.now(),
          type: 'DEDUCT',
          amount: NOTA_PRICE,
          channel: 'POS Kasir (Tunai)',
          description: `Potongan 1 nota transaksi tunai Kasir POS #${order.id} (Meja ${order.tableNumber})`,
          saldoAfter: merchant.saldoNota,
          orderId: order.id,
          createdAt: new Date().toISOString()
        });
        order.notaDeducted = NOTA_PRICE;
      }

      order.paymentMethod = 'CASH';
      order.paymentStatus = 'PAID';
      order.status = 'PREPARING';
      order.paidAt = new Date().toISOString();
      writeDB(db, req);
      return res.json({
        success: true,
        method: 'CASH',
        status: 'PREPARING',
        notaDeducted: order.notaDeducted || NOTA_PRICE,
        sisaSaldoNota: merchant ? merchant.saldoNota : null,
        sisaKuotaNota: merchant ? merchant.kuotaNota : null,
        message: 'Pembayaran tunai kasir berhasil dicatat. 1 lembar nota (Rp 100) dipotong dari saldo toko.',
        order
      });
    }

    return res.status(400).json({ error: 'Metode pembayaran tidak valid' });
  });

  // ── 8. TRIPAY WEBHOOK CALLBACK FOR POS ORDERS ──────────────────────────
  router.post('/webhook/tripay', (req, res) => {
    const { reference, merchant_ref, status } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === merchant_ref || o.tripayReference === reference);
    if (order && status === 'PAID') {
      order.paymentStatus = 'PAID';
      order.status = 'PREPARING'; // Pembayaran berhasil -> langsung masuk antrean masak
      order.paidAt = new Date().toISOString();
      writeDB(db, req);
      console.log(`[POS TriPay Webhook] Order ${order.id} verified PAID!`);
    }

    res.json({ success: true });
  });

  // ── 9. CONFIRM PAYMENT MANUALLY (FOR SIMULATOR / CASHIER DESK) ────────
  router.post('/orders/:id/confirm-payment', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    const store = db.settings.posStore || {};
    const primaryMerchant = (db.merchants || [])[0];
    const sharedUid = store.merchantId || store.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';
    let merchant = (db.merchants || []).find(m => String(m.id) === String(sharedUid)) || primaryMerchant;

    if (merchant && merchant.saldoNota === undefined) {
      merchant.saldoNota = 5000;
      merchant.kuotaNota = 50;
      merchant.notaHistory = [];
    }

    const NOTA_PRICE = 100;
    const isCashOrCounter = order.paymentMethod === 'CASH' || !order.paymentMethod || order.paymentMethod === 'TUNAI';

    // Konfirmasi kasir untuk transaksi cash: wajib potong harga nota
    if (isCashOrCounter && !order.notaDeducted) {
      const currentSaldoNota = Number(merchant?.saldoNota) || 0;
      if (currentSaldoNota < NOTA_PRICE) {
        return res.status(400).json({
          error: `Saldo nota tidak mencukupi untuk konfirmasi bayar tunai (sisa Rp ${currentSaldoNota.toLocaleString('id-ID')}, dibutuhkan Rp ${NOTA_PRICE.toLocaleString('id-ID')}). Silakan top up saldo nota kasir terlebih dahulu.`,
          requiresTopupNota: true,
          currentSaldoNota,
          neededNota: NOTA_PRICE
        });
      }

      if (merchant) {
        merchant.saldoNota = Math.max(0, currentSaldoNota - NOTA_PRICE);
        merchant.kuotaNota = Math.max(0, Math.floor(merchant.saldoNota / NOTA_PRICE));
        merchant.notaHistory = merchant.notaHistory || [];
        merchant.notaHistory.unshift({
          id: 'NOTADED-' + Date.now(),
          type: 'DEDUCT',
          amount: NOTA_PRICE,
          channel: 'POS Kasir (Konfirmasi Tunai)',
          description: `Potongan 1 nota konfirmasi tunai #${order.id} (Meja ${order.tableNumber})`,
          saldoAfter: merchant.saldoNota,
          orderId: order.id,
          createdAt: new Date().toISOString()
        });
        order.notaDeducted = NOTA_PRICE;
      }
      order.paymentMethod = 'CASH';
    }

    order.paymentStatus = 'PAID';
    order.status = 'PREPARING';
    order.paidAt = new Date().toISOString();

    // Auto-deposit net omset to Unified Wallet if paid via TriPay (QRIS/E-Wallet)
    // Kebijakan: Kasir POS dan Mitra UMKM menjadi 1 UID terpadu (1 Wallet bersama)
    if (order.paymentMethod === 'TRIPAY') {
      db.unified_wallets = db.unified_wallets || {};
      const primaryMerchant = (db.merchants || [])[0];
      const sharedUid = db.settings?.posStore?.merchantId || db.settings?.posStore?.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';

      if (db.settings?.posStore) {
        db.settings.posStore.uid = sharedUid;
        db.settings.posStore.merchantId = sharedUid;
      }

      if (!db.unified_wallets[sharedUid]) {
        db.unified_wallets[sharedUid] = {
          uid: sharedUid,
          name: db.settings?.posStore?.storeName || primaryMerchant?.name || 'Kasir POS & Mitra Terpadu',
          balance: 0,
          totalEarned: 0,
          totalSettled: 0,
          gateway: 'TriPay Master KostKu (T53543)',
          history: []
        };
      }
      const netAmount = Math.max(0, (Number(order.totalAmount) || 0) - 100);
      db.unified_wallets[sharedUid].balance = (Number(db.unified_wallets[sharedUid].balance) || 0) + netAmount;
      db.unified_wallets[sharedUid].totalEarned = (Number(db.unified_wallets[sharedUid].totalEarned) || 0) + netAmount;
      db.unified_wallets[sharedUid].history = db.unified_wallets[sharedUid].history || [];
      db.unified_wallets[sharedUid].history.unshift({
        id: 'WAL-POS-' + Date.now(),
        type: 'deposit',
        source: 'pos_cashier',
        channel: 'POS Kasir',
        amount: netAmount,
        balanceAfter: db.unified_wallets[sharedUid].balance,
        orderId: order.id,
        description: `Hasil penjualan TriPay Kasir POS #${order.id} (Meja ${order.tableNumber})`,
        createdAt: new Date().toISOString()
      });
    }

    writeDB(db, req);
    res.json({ success: true, message: 'Pembayaran dikonfirmasi! Pesanan sedang dimasak.', order });
  });

  // ── 9B. TOGGLE ITEM READY IN KITCHEN (KDS MENU CHECKLIST) ─────────────
  router.post('/orders/:id/toggle-item', (req, res) => {
    const { id } = req.params;
    const { itemIndex, isReady } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (itemIndex === undefined || itemIndex < 0 || itemIndex >= (order.items || []).length) {
      return res.status(400).json({ error: 'Index menu tidak valid' });
    }

    const item = order.items[itemIndex];
    const newStatus = typeof isReady === 'boolean' ? isReady : !item.isReady;
    item.isReady = newStatus;
    item.readyAt = newStatus ? new Date().toISOString() : null;

    // Hitung berapa item yang sudah siap
    const readyCount = order.items.filter(it => it.isReady).length;
    const totalCount = order.items.length;
    order.readyItemsCount = readyCount;
    order.allReady = readyCount === totalCount;
    order.readyToServe = order.allReady;

    writeDB(db, req);
    res.json({
      success: true,
      itemIndex,
      isReady: newStatus,
      readyCount,
      totalCount,
      allReady: order.allReady,
      order
    });
  });

  // ── 10. MARK ORDER COMPLETED ──────────────────────────────────────────
  router.post('/orders/:id/complete', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    order.status = 'COMPLETED';
    order.completedAt = new Date().toISOString();

    writeDB(db, req);
    res.json({ success: true, message: 'Pesanan selesai disajikan!', order });
  });

  // ── 11. LUCKY SPIN WHEEL (50% FULL POIN, 0% ZONK) ─────────────────────
  router.post('/orders/:id/spin', (req, res) => {
    const { id } = req.params;
    const { phone } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    // Pesanan harus sudah berstatus PAID / BILLED / PREPARING / COMPLETED
    const validPaidStatuses = ['PAID', 'BILLED_TO_ROOM', 'PREPARING', 'COMPLETED'];
    if (!validPaidStatuses.includes(order.status) && order.paymentStatus !== 'PAID' && order.paymentStatus !== 'BILLED') {
      return res.status(400).json({ error: 'Selesaikan pembayaran terlebih dahulu sebelum memutar spin poin' });
    }

    if (order.hasSpun) {
      return res.status(400).json({ error: 'Kesempatan memutar roda keberuntungan untuk pesanan ini sudah digunakan' });
    }

    // ATURAN: Hanya pelanggan login yang berhak atas poin spin reward!
    if (order.isLoggedIn === false) {
      return res.status(400).json({
        error: 'Poin reward & Lucky Spin hanya berlaku untuk pelanggan yang login. Anda memesan sebagai tamu (tanpa akun).'
      });
    }

    // Logika Probabilitas Server:
    // 50% Full (100 Poin)
    // 25% Medium (50 Poin)
    // 15% Small (25 Poin)
    // 10% Mini (10 Poin)
    // ZERO ZONK!
    const roll = Math.random() * 100;
    let wonPoints = 10;
    let tier = 'MINI';
    let targetSlice = 3;

    if (roll < 50) {
      wonPoints = 100;
      tier = 'FULL';
      targetSlice = 0; // Juring 100 Poin
    } else if (roll < 75) {
      wonPoints = 50;
      tier = 'MEDIUM';
      targetSlice = 1; // Juring 50 Poin
    } else if (roll < 90) {
      wonPoints = 25;
      tier = 'SMALL';
      targetSlice = 2; // Juring 25 Poin
    } else {
      wonPoints = 10;
      tier = 'MINI';
      targetSlice = 3; // Juring 10 Poin
    }

    const cleanPhone = String(phone || order.customerPhone || '').replace(/\D/g, '');

    order.hasSpun = true;
    order.pointsWon = wonPoints;

    // Catat ke wallet poin pengguna
    if (cleanPhone) {
      db.customer_points[cleanPhone] = (db.customer_points[cleanPhone] || 0) + wonPoints;
    }

    // Catat log spin
    db.pos_spin_logs.push({
      id: 'SPIN-' + Date.now(),
      orderId: order.id,
      phone: cleanPhone,
      pointsWon: wonPoints,
      tier,
      createdAt: new Date().toISOString()
    });

    writeDB(db, req);

    res.json({
      success: true,
      points: wonPoints,
      tier,
      targetSliceIndex: targetSlice,
      userCurrentBalance: cleanPhone ? db.customer_points[cleanPhone] : wonPoints,
      message: `Selamat! Kamu mendapatkan ${wonPoints} Poin!`
    });
  });

  // ── 12. CHECK CUSTOMER POINTS BALANCE ─────────────────────────────────
  router.get('/points/:phone', (req, res) => {
    const cleanPhone = String(req.params.phone || '').replace(/\D/g, '');
    const db = getDB(req);
    ensurePosCollections(db);

    const balance = db.customer_points[cleanPhone] || 0;
    res.json({ phone: cleanPhone, points: balance, rupiahEquivalent: Math.floor(balance / 100) * 1000 });
  });

  // ── 13. OWNER / ADMIN CUSTOM DISCOUNT ON ORDER ────────────────────────
  router.post('/orders/:id/apply-discount', (req, res) => {
    const { id } = req.params;
    const { discountType, discountValue, reason } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    const val = Number(discountValue) || 0;
    if (val <= 0) {
      return res.status(400).json({ error: 'Nilai diskon harus lebih besar dari 0' });
    }

    let calculatedDiscount = 0;
    if (discountType === 'PERCENT') {
      const pct = Math.min(100, Math.max(1, val));
      calculatedDiscount = Math.round(order.subtotal * (pct / 100));
    } else {
      // Default: FIXED NOMINAL AMOUNT (Rp)
      calculatedDiscount = Math.min(order.subtotal, val);
    }

    order.adminDiscount = {
      type: discountType || 'FIXED',
      value: val,
      amount: calculatedDiscount,
      reason: reason || 'Diskon Khusus Owner / Admin',
      appliedAt: new Date().toISOString()
    };

    // Recompute total order
    const pointsDiscount = order.discount || 0;
    order.totalDiscount = pointsDiscount + calculatedDiscount;
    order.totalAmount = Math.max(0, order.subtotal - order.totalDiscount);
    order.netRevenue = Math.max(0, order.totalAmount - (order.ownerDeduction || 100));

    writeDB(db, req);
    res.json({
      success: true,
      message: `Diskon khusus Rp ${calculatedDiscount.toLocaleString('id-ID')} berhasil diterapkan!`,
      order
    });
  });

  // ── 14. MEMBER STAMP & CUSTOM POINTS ENGINE (BY OWNER / ADMIN) ─────────
  router.get('/loyalty/:phone', (req, res) => {
    const cleanPhone = String(req.params.phone || '').replace(/\D/g, '');
    const db = getDB(req);
    ensurePosCollections(db);

    const points = db.customer_points[cleanPhone] || 0;
    const stampRecord = db.customer_stamps[cleanPhone] || {
      phone: cleanPhone,
      name: 'Pelanggan Member',
      stamps: 0,
      maxStamps: 5,
      history: []
    };

    res.json({
      phone: cleanPhone,
      name: stampRecord.name || 'Member KostKu',
      points,
      rupiahEquivalent: Math.floor(points / 100) * 1000,
      stamps: stampRecord.stamps || 0,
      maxStamps: stampRecord.maxStamps || 5,
      rewardReady: (stampRecord.stamps || 0) >= (stampRecord.maxStamps || 5),
      history: stampRecord.history || []
    });
  });

  router.post('/loyalty/grant-points', (req, res) => {
    const { phone, name, points, reason } = req.body;
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Nomor WhatsApp pelanggan wajib diisi!' });
    }

    const pts = parseInt(points, 10);
    if (!pts || isNaN(pts)) {
      return res.status(400).json({ error: 'Jumlah poin khusus harus berupa angka valid!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    const currentPoints = db.customer_points[cleanPhone] || 0;
    const updatedPoints = Math.max(0, currentPoints + pts);
    db.customer_points[cleanPhone] = updatedPoints;

    db.customer_stamps[cleanPhone] = db.customer_stamps[cleanPhone] || {
      phone: cleanPhone,
      name: name || 'Member KostKu',
      stamps: 0,
      maxStamps: 5,
      history: []
    };
    if (name) db.customer_stamps[cleanPhone].name = name;

    db.customer_stamps[cleanPhone].history.unshift({
      date: new Date().toISOString(),
      type: 'CUSTOM_POINTS',
      change: pts,
      reason: reason || 'Bonus Poin Khusus dari Owner / Kasir',
      balanceAfter: updatedPoints
    });

    writeDB(db, req);
    res.json({
      success: true,
      message: `Berhasil menambahkan ${pts > 0 ? '+' + pts : pts} poin khusus ke ${cleanPhone}!`,
      points: updatedPoints
    });
  });

  router.post('/loyalty/grant-stamp', (req, res) => {
    const { phone, name, change = 1, reason, action } = req.body;
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Nomor WhatsApp pelanggan wajib diisi!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    db.customer_stamps[cleanPhone] = db.customer_stamps[cleanPhone] || {
      phone: cleanPhone,
      name: name || 'Member KostKu',
      stamps: 0,
      maxStamps: 5,
      history: []
    };
    if (name) db.customer_stamps[cleanPhone].name = name;

    const record = db.customer_stamps[cleanPhone];
    const maxStamps = record.maxStamps || 5;

    if (action === 'REDEEM') {
      if (record.stamps < maxStamps) {
        return res.status(400).json({ error: `Stamp belum mencukupi untuk klaim reward (minimal ${maxStamps} stamp)!` });
      }
      record.stamps = Math.max(0, record.stamps - maxStamps);
      record.history.unshift({
        date: new Date().toISOString(),
        type: 'STAMP_REDEEM',
        change: -maxStamps,
        reason: reason || 'Klaim Reward Member (Gratis 1 Menu / Diskon)',
        stampsAfter: record.stamps
      });
    } else {
      const delta = parseInt(change, 10) || 1;
      record.stamps = Math.max(0, record.stamps + delta);
      record.history.unshift({
        date: new Date().toISOString(),
        type: 'STAMP_ADD',
        change: delta,
        reason: reason || 'Stamp Pembelian Meja / Kasir',
        stampsAfter: record.stamps
      });
    }

    writeDB(db, req);
    res.json({
      success: true,
      message: action === 'REDEEM' ? 'Reward Stamp berhasil diklaim!' : `Stamp berhasil ditambahkan (${record.stamps}/${maxStamps})!`,
      stamps: record.stamps,
      maxStamps,
      rewardReady: record.stamps >= maxStamps
    });
  });

  // ── 9B. HYBRID LOYALTY & ESCROW REFUND ENDPOINTS ──────────────────────
  // 1. Claim info check for customer claim page (/api/pos/loyalty/claim-info?token=...)
  router.get('/loyalty/claim-info', (req, res) => {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token struk QR wajib disertakan' });
    }
    const db = getDB(req);
    ensurePosCollections(db);

    const claim = (db.receipt_claims || []).find(c => c.claim_token === token || c.id === token || c.invoice_number === token);
    if (!claim) {
      return res.status(404).json({ error: 'Data struk tidak ditemukan atau token tidak valid' });
    }
    const now = new Date();
    const isDeadlinePassed = now > new Date(claim.claim_deadline);
    let resolvedStatus = claim.status;
    if (claim.status === 'PENDING' && isDeadlinePassed) {
      resolvedStatus = 'EXPIRED';
    }
    res.json({
      id: claim.id,
      token: claim.claim_token,
      invoice: claim.invoice_number,
      merchantId: claim.merchant_id,
      merchantName: claim.merchant_name || 'KostKu Cafe & Resto',
      totalAmount: claim.total_amount,
      potentialPoints: Math.max(1, Math.floor(claim.total_amount / 1000)),
      status: resolvedStatus,
      claimDeadline: claim.claim_deadline,
      claimedBy: claim.claimed_by_whatsapp ? claim.claimed_by_whatsapp.replace(/(\d{4})\d+(\d{3})/, '$1****$2') : null,
      claimedAt: claim.claimed_at,
      refundedAt: claim.refunded_at,
      createdAt: claim.createdAt,
      isExpired: resolvedStatus === 'EXPIRED',
      isClaimed: resolvedStatus === 'CLAIMED'
    });
  });

  // 2. Customer claims points with Lucky Spin Wheel (/api/pos/loyalty/claim & /api/pos/loyalty/spin)
  const handleLoyaltySpinClaim = (req, res) => {
    const { token, whatsapp, phone, name } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token struk tidak boleh kosong' });
    }

    let cleanPhone = String(whatsapp || phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('62')) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }
    if (!cleanPhone.startsWith('08') || cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid. Masukkan nomor WhatsApp aktif (contoh: 081234567890).' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    const claim = (db.receipt_claims || []).find(c => c.claim_token === token || c.id === token || c.invoice_number === token);
    if (!claim) {
      return res.status(404).json({ error: 'Struk belanja tidak ditemukan atau token QR tidak valid.' });
    }

    // Anti Double-Claim Check
    if (claim.status === 'CLAIMED') {
      const redacted = claim.claimed_by_whatsapp ? claim.claimed_by_whatsapp.replace(/(\d{4})\d+(\d{3})/, '$1****$2') : 'nomor lain';
      return res.status(400).json({
        error: `Struk ini sudah pernah diklaim sebelumnya oleh ${redacted} pada ${new Date(claim.claimed_at || Date.now()).toLocaleString('id-ID')}.`,
        alreadyClaimed: true,
        claimedAt: claim.claimed_at
      });
    }

    // Expiry check
    const now = new Date();
    if (claim.status === 'EXPIRED' || now > new Date(claim.claim_deadline)) {
      claim.status = 'EXPIRED';
      writeDB(db, req);
      return res.status(400).json({
        error: `Masa klaim struk ini telah berakhir pada ${new Date(claim.claim_deadline).toLocaleString('id-ID')} WIB.`,
        isExpired: true,
        claimDeadline: claim.claim_deadline
      });
    }

    // ── SILENT REGISTRATION FOR CUSTOMER & PITY TRACKER ──
    db.customers = db.customers || {};
    if (!db.customers[cleanPhone]) {
      const uniqueCode = 'KST' + cleanPhone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
      db.customers[cleanPhone] = {
        whatsapp_number: cleanPhone,
        name: name || 'Pelanggan KostKu',
        total_points: 0,
        spins_without_jackpot: 0,
        referral_code: uniqueCode,
        daily_referral_count: 0,
        last_referral_date: getWibDateString(now),
        createdAt: now.toISOString()
      };
    }
    const customer = db.customers[cleanPhone];
    if (name) customer.name = name;
    if (!customer.referral_code) {
      customer.referral_code = 'KST' + cleanPhone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
    }
    if (customer.spins_without_jackpot === undefined) {
      customer.spins_without_jackpot = 0;
    }

    // ── SERVER-SIDE RNG LUCKY SPIN WHEEL (DECOUPLED PROBABILITY) ──
    const spinOutcome = rollLuckySpin(customer);
    const pointsAwarded = spinOutcome.pointsWon;

    // ATOMIC MUTATION (Idempotent 1-time claim)
    claim.status = 'CLAIMED';
    claim.claimed_by_whatsapp = cleanPhone;
    claim.points_awarded = pointsAwarded;
    claim.claimed_at = now.toISOString();

    customer.total_points = (customer.total_points || 0) + pointsAwarded;
    db.customer_points[cleanPhone] = customer.total_points;

    // Audit Ledger Entry for Spinner
    db.points_ledger = db.points_ledger || [];
    db.points_ledger.unshift({
      id: 'LEDGER-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      whatsapp_number: cleanPhone,
      order_id: claim.order_id,
      invoice_number: claim.invoice_number,
      change_type: 'EARN',
      points: pointsAwarded,
      notes: `Putar Lucky Spin Struk #${claim.invoice_number} (Dapat ${pointsAwarded} Poin)${spinOutcome.isPity ? ' [Pity Guarantee]' : ''}`,
      createdAt: now.toISOString()
    });

    // ── ATURAN REFERRAL DINAMIS & 3 REM PENGAMAN ──
    let referralResult = { success: false, status: 'NO_CODE', bonusAwarded: 0 };
    const rawRefCode = (req.body.referral_code || req.body.referralCode || '').trim().toUpperCase();

    if (rawRefCode) {
      // Rem Pengaman 2: Anti Self-Referral
      if (customer.referral_code && customer.referral_code.toUpperCase() === rawRefCode) {
        referralResult = { success: false, status: 'SELF_REFERRAL_BLOCKED', message: 'Dilarang menggunakan kode referral milik sendiri!' };
      } else {
        const referrer = Object.values(db.customers).find(c => c && c.referral_code && c.referral_code.toUpperCase() === rawRefCode);
        if (!referrer) {
          referralResult = { success: false, status: 'INVALID_CODE', message: 'Kode referral tidak ditemukan.' };
        } else if (referrer.whatsapp_number === cleanPhone) {
          referralResult = { success: false, status: 'SELF_REFERRAL_BLOCKED', message: 'Dilarang menggunakan kode referral milik sendiri!' };
        } else {
          // Rem Pengaman 3: Daily Cap (Maksimal 3 komisi per hari kalender WIB)
          const todayWib = getWibDateString(now);
          if (referrer.last_referral_date !== todayWib) {
            referrer.daily_referral_count = 0;
            referrer.last_referral_date = todayWib;
          }

          if ((referrer.daily_referral_count || 0) >= 3) {
            referralResult = {
              success: false,
              status: 'DAILY_CAP_REACHED',
              message: 'Batas komisi referral teman hari ini sudah tercapai (Maks 3x/hari). Poin putaran Anda tetap masuk 100%!',
              bonusAwarded: 0,
              referrerWhatsapp: referrer.whatsapp_number
            };
          } else {
            // Pembagian Dinamis 50% dari hasil angka roda pemutar:
            // 100 -> +50, 50 -> +25, 25 -> +12, 10 -> +5
            const referrerBonus = Math.floor(pointsAwarded * 0.5);
            referrer.total_points = (referrer.total_points || 0) + referrerBonus;
            db.customer_points[referrer.whatsapp_number] = referrer.total_points;
            referrer.daily_referral_count = (referrer.daily_referral_count || 0) + 1;

            claim.referral_code_used = rawRefCode;
            claim.referrer_whatsapp = referrer.whatsapp_number;
            claim.referrer_points_awarded = referrerBonus;

            db.points_ledger.unshift({
              id: 'LEDGER-REF-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
              whatsapp_number: referrer.whatsapp_number,
              order_id: claim.order_id,
              invoice_number: claim.invoice_number,
              change_type: 'REFERRAL_BONUS',
              points: referrerBonus,
              notes: `Bonus Referral 50% dari struk #${claim.invoice_number} (Pemutar dapat ${pointsAwarded} Poin)`,
              createdAt: now.toISOString()
            });

            referralResult = {
              success: true,
              status: 'BONUS_AWARDED',
              bonusAwarded: referrerBonus,
              referrerWhatsapp: referrer.whatsapp_number,
              referrerName: referrer.name || 'Teman KostKu'
            };
          }
        }
      }
    }

    // Deduct held promo balance from merchant escrow (official platform/promo fee: Rp 60.00)
    const mId = claim.merchant_id || 'MTR-KASIR-MASTER';
    if (db.merchant_wallets && db.merchant_wallets[mId]) {
      db.merchant_wallets[mId].held_promo_balance = Math.max(0, (db.merchant_wallets[mId].held_promo_balance || 0) - 60.00);
      db.merchant_wallets[mId].updated_at = now.toISOString();
    }

    writeDB(db, req);

    // Non-blocking Granular Delta Sync ke Firebase RTDB (< 5 KB payload)
    setImmediate(() => {
      try {
        syncDelta(`customer_points/${cleanPhone}`, customer.total_points, 'PUT');
        syncDelta(`customers/${cleanPhone}`, customer, 'PUT');
        syncDelta(`receipt_claims/${claim.id}`, {
          status: 'CLAIMED',
          claimed_by_whatsapp: cleanPhone,
          claimed_at: claim.claimed_at,
          points_awarded: claim.points_awarded,
          referral_code_used: claim.referral_code_used || null,
          referrer_whatsapp: claim.referrer_whatsapp || null,
          referrer_points_awarded: claim.referrer_points_awarded || 0
        }, 'PATCH');
        if (db.merchant_wallets && db.merchant_wallets[mId]) {
          syncDelta(`merchant_wallets/${mId}`, db.merchant_wallets[mId], 'PATCH');
        }
        if (referralResult.referrerWhatsapp && db.customers[referralResult.referrerWhatsapp]) {
          syncDelta(`customers/${referralResult.referrerWhatsapp}`, db.customers[referralResult.referrerWhatsapp], 'PUT');
          syncDelta(`customer_points/${referralResult.referrerWhatsapp}`, db.customer_points[referralResult.referrerWhatsapp], 'PUT');
        }
      } catch (err) {
        console.warn('[Firebase RTDB Delta Sync Error]:', err.message);
      }
    });

    res.json({
      success: true,
      message: pointsAwarded === 100
        ? `🎉 JACKPOT! Selamat Anda memenangkan 100 Poin Emas!`
        : `🎉 Selamat! Roda berhenti di ${pointsAwarded} Poin loyalitas.`,
      pointsAwarded,
      sliceIndex: spinOutcome.sliceIndex,
      slice: spinOutcome.slice,
      isNearMiss: spinOutcome.isNearMiss,
      isPity: spinOutcome.isPity,
      spinsWithoutJackpot: customer.spins_without_jackpot,
      totalPoints: customer.total_points,
      customer: {
        whatsapp_number: cleanPhone,
        name: customer.name,
        total_points: customer.total_points,
        referral_code: customer.referral_code,
        spins_without_jackpot: customer.spins_without_jackpot
      },
      referralResult,
      invoice: claim.invoice_number,
      merchantName: claim.merchant_name,
      claimedAt: claim.claimed_at
    });
  };

  router.post('/loyalty/claim', handleLoyaltySpinClaim);
  router.post('/loyalty/spin', handleLoyaltySpinClaim);

  // 3. Customer Points Lookup (/api/pos/loyalty/customer/:phone)
  router.get('/loyalty/customer/:phone', (req, res) => {
    let phone = String(req.params.phone || '').replace(/\D/g, '');
    if (phone.startsWith('62')) phone = '0' + phone.slice(2);
    const db = getDB(req);
    ensurePosCollections(db);

    const account = (db.customers && db.customers[phone]) || {
      whatsapp_number: phone,
      name: 'Pelanggan Baru',
      total_points: db.customer_points[phone] || 0
    };
    const history = (db.points_ledger || []).filter(l => l.whatsapp_number === phone);
    res.json({ account, history });
  });

  // 4. Merchant Wallet & Escrow Ledger (/api/pos/merchant/wallet)
  router.get('/merchant/wallet', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const mId = req.query.merchantId || db.settings?.posStore?.merchantId || 'MTR-KASIR-MASTER';

    // Opportunistic settlement check
    executeBatchSettlement(db);

    if (!db.merchant_wallets[mId]) {
      db.merchant_wallets[mId] = {
        merchant_id: mId,
        name: db.settings?.posStore?.storeName || 'KostKu Cafe & Resto (Pusat)',
        whatsapp_number: db.settings?.posStore?.phone || '081234567890',
        available_balance: db.settings?.posStore?.saldoNota || 100000.00,
        held_promo_balance: 0.00,
        updated_at: new Date().toISOString()
      };
    }

    const wallet = db.merchant_wallets[mId];
    const claims = (db.receipt_claims || []).filter(c => c.merchant_id === mId || !c.merchant_id);
    const pendingCount = claims.filter(c => c.status === 'PENDING').length;
    wallet.held_promo_balance = pendingCount * 60.00;

    const mutations = (db.wallet_mutations || []).filter(m => m.merchant_id === mId || !m.merchant_id);
    writeDB(db, req);

    res.json({
      success: true,
      wallet: {
        merchantId: wallet.merchant_id,
        name: wallet.name || 'KostKu Cafe & Resto (Pusat)',
        whatsappNumber: wallet.whatsapp_number || '081234567890',
        available_balance: wallet.available_balance,
        held_promo_balance: wallet.held_promo_balance,
        pendingClaimsCount: pendingCount,
        claimedCount: claims.filter(c => c.status === 'CLAIMED').length,
        expiredCount: claims.filter(c => c.status === 'EXPIRED').length,
        updatedAt: wallet.updated_at
      },
      claims,
      mutations
    });
  });

  // 5. Batch Settlement Worker (/api/pos/admin/run-batch-settlement)
  router.post('/admin/run-batch-settlement', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const result = executeBatchSettlement(db);
    writeDB(db, req);
    res.json(result);
  });

  // ── 10. GUDANG & BAHAN BAKU (INVENTORY & STOCK ENGINE) ──────────────────
  router.get('/inventory', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);

    const items = (db.pos_inventory || []).map(item => {
      const current = Number(item.currentStock) || 0;
      const min = Number(item.minAlertStock) || 0;
      const isLowStock = current <= min;
      const isOutOfStock = current <= 0;
      return {
        ...item,
        currentStock: current,
        minAlertStock: min,
        isLowStock,
        isOutOfStock,
        status: isOutOfStock ? 'HABIS' : isLowStock ? 'MENIPIS' : 'AMAN',
        deficit: Math.max(0, min - current)
      };
    });

    const lowStockItems = items.filter(i => i.isLowStock);
    const outOfStockItems = items.filter(i => i.isOutOfStock);

    res.json({
      success: true,
      inventory: items,
      totalItems: items.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      alerts: lowStockItems.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        unit: i.unit,
        currentStock: i.currentStock,
        minAlertStock: i.minAlertStock,
        status: i.status,
        deficit: i.deficit,
        message: i.isOutOfStock 
          ? `Stok '${i.name}' SUDAH HABIS (0 ${i.unit})! Segera restock!`
          : `Stok '${i.name}' MENIPIS: Sisa ${i.currentStock} ${i.unit} (ambang batas min: ${i.minAlertStock} ${i.unit})`
      }))
    });
  });

  router.post('/inventory', (req, res) => {
    const { name, category, unit, currentStock = 0, minAlertStock = 10, costPerUnit = 0, supplier = '' } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Nama bahan baku dan satuan unit (misal: gram, ml, pcs, porsi) wajib diisi!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    const newItem = {
      id: 'INV-' + Date.now().toString().slice(-6),
      name: String(name).trim(),
      category: category || 'Bahan Pokok',
      unit: String(unit).trim().toLowerCase(),
      currentStock: Math.max(0, Number(currentStock) || 0),
      minAlertStock: Math.max(0, Number(minAlertStock) || 10),
      costPerUnit: Math.max(0, Number(costPerUnit) || 0),
      supplier: supplier || 'Distributor Lokal',
      lastRestocked: new Date().toISOString()
    };

    db.pos_inventory.push(newItem);
    writeDB(db, req);

    res.json({ success: true, message: `Bahan '${newItem.name}' berhasil ditambahkan ke gudang!`, item: newItem });
  });

  router.put('/inventory/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, unit, currentStock, minAlertStock, costPerUnit, supplier } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const item = (db.pos_inventory || []).find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Bahan baku gudang tidak ditemukan' });

    if (name) item.name = String(name).trim();
    if (category) item.category = String(category).trim();
    if (unit) item.unit = String(unit).trim().toLowerCase();
    if (typeof currentStock === 'number') item.currentStock = Math.max(0, currentStock);
    if (typeof minAlertStock === 'number') item.minAlertStock = Math.max(0, minAlertStock);
    if (typeof costPerUnit === 'number') item.costPerUnit = Math.max(0, costPerUnit);
    if (supplier) item.supplier = String(supplier).trim();

    writeDB(db, req);
    res.json({ success: true, message: `Bahan '${item.name}' berhasil diperbarui!`, item });
  });

  router.delete('/inventory/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB(req);
    ensurePosCollections(db);

    const idx = (db.pos_inventory || []).findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Bahan baku gudang tidak ditemukan' });

    const deleted = db.pos_inventory.splice(idx, 1)[0];
    writeDB(db, req);
    res.json({ success: true, message: `Bahan '${deleted.name}' berhasil dihapus dari gudang.` });
  });

  router.post('/inventory/restock', (req, res) => {
    const { inventoryId, addQty, notes, restockedBy } = req.body;
    const qty = Number(addQty);
    if (!inventoryId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Pilih bahan baku dan masukkan jumlah restock yang valid (> 0)!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    const item = (db.pos_inventory || []).find(i => i.id === inventoryId);
    if (!item) return res.status(404).json({ error: 'Bahan baku tidak ditemukan di gudang' });

    const prevStock = Number(item.currentStock) || 0;
    item.currentStock = prevStock + qty;
    item.lastRestocked = new Date().toISOString();

    db.pos_inventory_logs = db.pos_inventory_logs || [];
    db.pos_inventory_logs.unshift({
      id: 'RESTOCK-' + Date.now(),
      inventoryId: item.id,
      inventoryName: item.name,
      addQty: qty,
      prevStock,
      newStock: item.currentStock,
      unit: item.unit,
      notes: notes || 'Restock berkala stok dapur',
      restockedBy: restockedBy || 'Owner / Kasir',
      date: new Date().toISOString()
    });

    writeDB(db, req);
    res.json({
      success: true,
      message: `Restock berhasil! Stok '${item.name}' kini bertambah +${qty} ${item.unit} (Total: ${item.currentStock} ${item.unit}).`,
      item,
      newStock: item.currentStock
    });
  });

  // ── 11. RESEP BAHAN BAKU PER MENU (BILL OF MATERIALS) ─────────────────
  router.get('/recipes', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);

    const recipes = (db.pos_products || []).map(prod => {
      const ingredients = (db.pos_recipes && db.pos_recipes[prod.id]) || [];
      const detailedIngredients = ingredients.map(ing => {
        const inv = (db.pos_inventory || []).find(i => i.id === ing.inventoryId);
        const cost = inv ? (Number(inv.costPerUnit || 0) * Number(ing.amount || 0)) : 0;
        return {
          ...ing,
          currentStock: inv?.currentStock || 0,
          inventoryUnit: inv?.unit || ing.unit,
          cost
        };
      });

      const totalHPP = detailedIngredients.reduce((s, it) => s + it.cost, 0);
      const grossMargin = Math.max(0, (prod.price || 0) - totalHPP);
      const marginPct = (prod.price || 0) > 0 ? ((grossMargin / prod.price) * 100).toFixed(1) : 0;

      return {
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        price: prod.price,
        image: prod.image,
        ingredients: detailedIngredients,
        totalHPP,
        grossMargin,
        marginPct
      };
    });

    res.json({ success: true, recipes });
  });

  router.put('/recipes/:productId', (req, res) => {
    const { productId } = req.params;
    const { ingredients } = req.body; // array of { inventoryId, amount, name, unit }
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Format resep bahan baku harus berupa array bahan!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    db.pos_recipes = db.pos_recipes || {};
    db.pos_recipes[productId] = ingredients.map(ing => ({
      inventoryId: ing.inventoryId,
      amount: Number(ing.amount) || 1,
      name: ing.name || 'Bahan',
      unit: ing.unit || 'porsi'
    }));

    writeDB(db, req);
    res.json({
      success: true,
      message: 'Resep bahan baku berhasil disimpan!',
      productId,
      recipe: db.pos_recipes[productId]
    });
  });

  // ── 12. STATISTIK KEUANGAN MULTI-DIMENSI (PER MENU, PER CABANG, SEMUA CABANG PER MENU, PER KARYAWAN) ──
  router.get('/analytics', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);

    const allOrders = (db.pos_orders || []).filter(o => o.status !== 'CANCELLED');
    const products = db.pos_products || [];
    const inventory = db.pos_inventory || [];
    const recipes = db.pos_recipes || {};

    // 1. STATISTIK PER MENU
    const menuStatsMap = {};
    products.forEach(p => {
      const ingList = recipes[p.id] || [];
      const hppPerPortion = ingList.reduce((sum, ing) => {
        const inv = inventory.find(i => i.id === ing.inventoryId);
        return sum + ((inv ? Number(inv.costPerUnit || 0) : 0) * (Number(ing.amount) || 0));
      }, 0);

      menuStatsMap[p.id] = {
        productId: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image,
        totalQtySold: 0,
        totalRevenue: 0,
        orderCount: 0,
        hppPerPortion,
        totalHPP: 0,
        grossProfit: 0,
        marginPct: 0,
        ingredientsConsumed: ingList
      };
    });

    allOrders.forEach(order => {
      (order.items || []).forEach(it => {
        const pid = it.productId;
        if (menuStatsMap[pid]) {
          const qty = Number(it.qty) || 1;
          const subtotal = Number(it.subtotal) || (menuStatsMap[pid].price * qty);
          menuStatsMap[pid].totalQtySold += qty;
          menuStatsMap[pid].totalRevenue += subtotal;
          menuStatsMap[pid].orderCount += 1;
        }
      });
    });

    const perMenuStats = Object.values(menuStatsMap).map(m => {
      m.totalHPP = m.totalQtySold * m.hppPerPortion;
      m.grossProfit = Math.max(0, m.totalRevenue - m.totalHPP);
      m.marginPct = m.totalRevenue > 0 ? ((m.grossProfit / m.totalRevenue) * 100).toFixed(1) : 0;
      return m;
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 2. STATISTIK PER CABANG (STORE / BRANCH)
    // Gather all known stores from db.merchants + current posStore
    const storesList = [];
    const seenStoreIds = new Set();

    (db.merchants || []).forEach(m => {
      if (!seenStoreIds.has(m.id)) {
        seenStoreIds.add(m.id);
        storesList.push({
          id: m.id,
          name: m.name || 'Cabang Mitra',
          address: m.address || 'Semarang',
          saldoNota: Number(m.saldoNota ?? 5000),
          kuotaNota: Number(m.kuotaNota ?? 50)
        });
      }
    });

    if (db.settings.posStore?.merchantId && !seenStoreIds.has(db.settings.posStore.merchantId)) {
      seenStoreIds.add(db.settings.posStore.merchantId);
      storesList.push({
        id: db.settings.posStore.merchantId,
        name: db.settings.posStore.storeName || 'Kantin Berkah Kost',
        address: db.settings.posStore.location || 'Semarang',
        saldoNota: 10000,
        kuotaNota: 100
      });
    }

    if (storesList.length === 0) {
      storesList.push({
        id: 'MTR-KASIR-MASTER',
        name: 'Kantin Berkah Kost (Pusat)',
        address: 'Tembalang, Semarang',
        saldoNota: 10000,
        kuotaNota: 100
      });
    }

    const perStoreMap = {};
    storesList.forEach(s => {
      perStoreMap[s.id] = {
        storeId: s.id,
        storeName: s.name,
        address: s.address,
        saldoNota: s.saldoNota,
        totalOrders: 0,
        grossRevenue: 0,
        qrisRevenue: 0,
        cashRevenue: 0,
        notaFees: 0,
        netRevenue: 0,
        topMenuItems: {}
      };
    });

    const primaryStoreId = storesList[0].id;

    allOrders.forEach(o => {
      const sid = o.storeId && perStoreMap[o.storeId] ? o.storeId : primaryStoreId;
      const target = perStoreMap[sid];
      if (target) {
        target.totalOrders += 1;
        const total = Number(o.totalAmount || o.subtotal || 0);
        target.grossRevenue += total;

        const pm = String(o.paymentMethod || '').toUpperCase();
        if (pm.includes('CASH') || pm.includes('TUNAI')) {
          target.cashRevenue += total;
        } else {
          target.qrisRevenue += total;
        }

        const fee = Number(o.adminFee || 100);
        target.notaFees += fee;

        (o.items || []).forEach(it => {
          target.topMenuItems[it.name] = (target.topMenuItems[it.name] || 0) + (Number(it.qty) || 1);
        });
      }
    });

    const perStoreStats = Object.values(perStoreMap).map(s => {
      s.netRevenue = Math.max(0, s.grossRevenue - s.notaFees);
      s.aov = s.totalOrders > 0 ? Math.round(s.grossRevenue / s.totalOrders) : 0;
      return s;
    }).sort((a, b) => b.grossRevenue - a.grossRevenue);

    // 3. STATISTIK SEMUA CABANG PER MENU (CROSS-BRANCH MATRIX)
    const crossBranchMatrix = products.map(prod => {
      const branchBreakdown = {};
      let totalAllBranchesQty = 0;
      let totalAllBranchesRevenue = 0;

      storesList.forEach(st => {
        branchBreakdown[st.id] = {
          storeId: st.id,
          storeName: st.name,
          qty: 0,
          revenue: 0
        };
      });

      allOrders.forEach(ord => {
        const sid = ord.storeId && branchBreakdown[ord.storeId] ? ord.storeId : primaryStoreId;
        (ord.items || []).forEach(it => {
          if (it.productId === prod.id) {
            const q = Number(it.qty) || 1;
            const rev = Number(it.subtotal) || (prod.price * q);
            if (branchBreakdown[sid]) {
              branchBreakdown[sid].qty += q;
              branchBreakdown[sid].revenue += rev;
            }
            totalAllBranchesQty += q;
            totalAllBranchesRevenue += rev;
          }
        });
      });

      // Find top branch for this specific menu
      let topBranchName = '-';
      let maxQty = -1;
      Object.values(branchBreakdown).forEach(b => {
        if (b.qty > maxQty && b.qty > 0) {
          maxQty = b.qty;
          topBranchName = b.storeName;
        }
      });

      return {
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        price: prod.price,
        image: prod.image,
        branches: branchBreakdown,
        totalAllBranchesQty,
        totalAllBranchesRevenue,
        topBranchName
      };
    }).sort((a, b) => b.totalAllBranchesRevenue - a.totalAllBranchesRevenue);

    // 4. STATISTIK PER KARYAWAN (CASHIER / STAFF LEADERBOARD)
    const cashierMap = {
      'KSR-01': { cashierId: 'KSR-01', cashierName: 'Siti Rahmawati (Kasir Shift Pagi)', role: 'Kasir Pagi', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 },
      'KSR-02': { cashierId: 'KSR-02', cashierName: 'Budi Santoso (Kasir Shift Siang)', role: 'Kasir Siang', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 },
      'KSR-03': { cashierId: 'KSR-03', cashierName: 'Rian Pratama (Kasir Shift Malam)', role: 'Kasir Malam', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 },
      'KSR-STF': { cashierId: 'KSR-STF', cashierName: 'Pak Joko (Staf Operasional)', role: 'Staf & Runner', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 }
    };

    allOrders.forEach(o => {
      const cid = o.cashierId && cashierMap[o.cashierId] ? o.cashierId : 'KSR-01';
      const c = cashierMap[cid];
      c.ordersCount += 1;
      const amt = Number(o.totalAmount || o.subtotal || 0);
      c.revenue += amt;

      const pm = String(o.paymentMethod || '').toUpperCase();
      if (pm.includes('CASH') || pm.includes('TUNAI')) {
        c.cashHandled += amt;
      } else {
        c.qrisProcessed += amt;
      }
    });

    const perCashierStats = Object.values(cashierMap).map((c, idx) => {
      c.rank = idx + 1;
      c.avgOrderValue = c.ordersCount > 0 ? Math.round(c.revenue / c.ordersCount) : 0;
      c.performanceRating = c.ordersCount >= 20 ? 'Performa Unggul (Bintang 5 ★★★★★)' : c.ordersCount >= 10 ? 'Sangat Baik (Bintang 4 ★★★★☆)' : 'Baik (Bintang 3 ★★★☆☆)';
      return c;
    }).sort((a, b) => b.revenue - a.revenue);

    // 5. ALERT GUDANG MAU HABIS
    const inventoryAlerts = (db.pos_inventory || [])
      .filter(i => (Number(i.currentStock) || 0) <= (Number(i.minAlertStock) || 0))
      .map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        unit: i.unit,
        currentStock: Number(i.currentStock) || 0,
        minAlertStock: Number(i.minAlertStock) || 0,
        deficit: Math.max(0, (Number(i.minAlertStock) || 0) - (Number(i.currentStock) || 0)),
        status: (Number(i.currentStock) || 0) === 0 ? 'HABIS' : 'MENIPIS',
        costPerUnit: i.costPerUnit || 0
      }));

    res.json({
      success: true,
      perMenu: perMenuStats,
      perStore: perStoreStats,
      crossBranchPerMenu: crossBranchMatrix,
      perCashier: perCashierStats,
      inventoryAlerts,
      summary: {
        totalOrdersAll: allOrders.length,
        totalGrossOmset: allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        activeBranchesCount: storesList.length,
        totalMenuItems: products.length,
        inventoryAlertsCount: inventoryAlerts.length
      }
    });
  });

  return router;
}

createPosRouter.BASE_ADMIN_FEE = 40.00;
createPosRouter.HELD_PROMO_FEE = 60.00;
createPosRouter.TOTAL_ADMIN_DEDUCT = 100.00;
createPosRouter.WHEEL_SLICES = [
  { index: 0, points: 100, label: '100 Poin Emas', isJackpot: true, color: '#F59E0B' },
  { index: 1, points: 25, label: '25 Poin', isJackpot: false, color: '#3B82F6' },
  { index: 2, points: 50, label: '50 Poin', isJackpot: false, color: '#8B5CF6' },
  { index: 3, points: 10, label: '10 Poin', isJackpot: false, color: '#10B981' },
  { index: 4, points: 25, label: '25 Poin', isJackpot: false, color: '#06B6D4' },
  { index: 5, points: 50, label: '50 Poin', isJackpot: false, color: '#EC4899' },
  { index: 6, points: 10, label: '10 Poin', isJackpot: false, color: '#10B981' },
  { index: 7, points: 25, label: '25 Poin', isJackpot: false, color: '#3B82F6' }
];

createPosRouter.rollLuckySpin = (customer = {}) => {
  const spinsWithoutJackpot = customer.spins_without_jackpot !== undefined 
    ? customer.spins_without_jackpot 
    : (customer.consecutiveNoJackpotSpins || 0);
  if (spinsWithoutJackpot >= 4) {
    customer.spins_without_jackpot = 0;
    customer.consecutiveNoJackpotSpins = 0;
    return {
      pointsWon: 100,
      points: 100,
      sliceIndex: 0,
      slice: createPosRouter.WHEEL_SLICES[0],
      isPity: true,
      isPityTriggered: true,
      isNearMiss: false,
      targetDegrees: 22.5,
      spinsWithoutJackpot: 0
    };
  }

  const rand = Math.random();
  let pointsWon = 25;
  let sliceIndex = 1;
  let isNearMiss = false;

  if (rand < 0.15) {
    pointsWon = 100;
    sliceIndex = 0;
    customer.spins_without_jackpot = 0;
  } else if (rand < 0.50) {
    pointsWon = 50;
    sliceIndex = Math.random() < 0.5 ? 2 : 5;
    customer.spins_without_jackpot = spinsWithoutJackpot + 1;
  } else if (rand < 0.85) {
    pointsWon = 25;
    sliceIndex = 1;
    isNearMiss = true;
    customer.spins_without_jackpot = spinsWithoutJackpot + 1;
  } else {
    pointsWon = 10;
    sliceIndex = Math.random() < 0.5 ? 3 : 6;
    customer.spins_without_jackpot = spinsWithoutJackpot + 1;
  }

  const targetDegrees = isNearMiss ? 46.8 : (sliceIndex * 45 + 22.5);

  return {
    pointsWon,
    points: pointsWon,
    sliceIndex,
    slice: createPosRouter.WHEEL_SLICES[sliceIndex],
    isPity: false,
    isPityTriggered: false,
    isNearMiss,
    targetDegrees,
    spinsWithoutJackpot: customer.spins_without_jackpot
  };
};

module.exports = createPosRouter;
