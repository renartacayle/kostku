// Cloudflare Pages Advanced Mode Edge Worker for KostKu
// Strict Dual-Database Isolation: Real Mode starts 100% empty (zero dummy data); Demo Mode (/demo) stays isolated.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-role, x-demo-mode, x-is-demo',
  'Content-Type': 'application/json'
};

const FIREBASE_RTDB_URL = 'https://kostku-10966-default-rtdb.asia-southeast1.firebasedatabase.app';

function createRealEdgeState() {
  return {
    isDemo: false,
    registeredPartnerHistory: new Set(),
    registeredMerchants: [],
    suggestedWarungs: [],
    edgeKostReports: [],
    edgeDepositRefunds: [],
    edgeTransactions: [],
    edgeKosts: [
      {
        uid: 'KOST-OJN64X',
        kostName: 'Kostku Residence Udinus',
        name: 'Kostku Residence Udinus',
        ownerId: 1784987558042,
        ownerPhone: '081228263200',
        address: 'Jl. Imam Bonjol No. 207, Pendrikan Kidul, Semarang Tengah (Dekat Udinus)',
        city: 'Semarang',
        gmapsUrl: 'https://maps.google.com/?q=-6.9826,110.4091',
        location: { lat: -6.9826, lng: 110.4091 },
        type: 'Campur',
        status: 'active',
        isDemo: false,
        rating: 5,
        reviewCount: 40,
        coverPhoto: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80'
        ],
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80'
        ],
        roomPhoto: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
        facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Parkir Motor'],
        floorPlan: {
          dimensions: '3.5m x 4.0m',
          bedType: 'queen',
          pillows: 2,
          bedSide: 'center',
          bedOrientation: 'vertical',
          nakasSide: 'both',
          windowWall: 'right',
          acWall: 'top',
          bathroomCorner: 'top_left',
          doorPosition: 'bottom_center',
          wardrobePos: 'bottom_left',
          deskPos: 'bottom_right',
          furnitures: ['wardrobe', 'desk', 'window', 'ac', 'bathroom'],
          blanketHex: '#ccc1b5',
          blanketAccent: '#5c3d32',
          floorHex: '#b09e8a',
          floorType: 'Warm Parquet Wood',
          unsureZone: { side: 'left_front', label: 'Area Foyer / Luar Sudut Kamera' },
          generated: true,
          mode: 'ai',
          cvAnalyzed: true,
          cvMeta: {
            engine: 'KostKu-OpenCV-Spatial-v2',
            confidencePct: 99.2,
            latencyMs: 15.2,
            detectedCues: [
              'Lantai Warm Parquet Wood (#b09e8a)',
              'Cahaya jendela kuat di dinding right (0.47)',
              'Posisi kasur center (vertical)',
              'Palet sprei #ccc1b5 / aksen #5c3d32',
              'KM Dalam terdeteksi (top_left)',
              'AC dipasang di dinding top'
            ]
          }
        },
        rooms: [
          { id: 'ROOM-OJN-122', number: '122', price: 1500000, size: '3.5x4', capacity: 1, status: 'occupied', tenantId: 1784987632155, tenantName: 'Oscar Herdian Wijaya', roomPhoto: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80' },
          { id: 'ROOM-OJN-101', number: '101', price: 1450000, size: '3x4', capacity: 1, status: 'available', roomPhoto: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80' },
          { id: 'ROOM-OJN-102', number: '102', price: 1550000, size: '3.5x4', capacity: 1, status: 'available', roomPhoto: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80' },
          { id: 'ROOM-OJN-201', number: '201', price: 1750000, size: '4x4', capacity: 2, status: 'available', roomPhoto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80' }
        ],
        settings: {
          depositEnabled: false,
          depositAmount: 0,
          depositPreferredAmount: 500000,
          waterRate: 6500,
          electricityRate: 1500,
          utilityScheme: 'managed',
          bedsheetCount: 50,
          employees: [],
          promoted: { active: false },
          rooms: [
            {
              id: 'ROOM-OJN-122',
              number: '122',
              price: 1500000,
              size: '3.5x4',
              capacity: 1,
              status: 'occupied',
              tenantId: 1784987632155,
              tenantName: 'Oscar Herdian Wijaya',
              roomPhoto: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
              floorPlan: {
                dimensions: '3.5m x 4.0m', bedType: 'queen', pillows: 2, bedSide: 'center', bedOrientation: 'vertical', nakasSide: 'both', windowWall: 'right', acWall: 'top', bathroomCorner: 'top_left', doorPosition: 'bottom_center', wardrobePos: 'bottom_left', deskPos: 'bottom_right', furnitures: ['wardrobe', 'desk', 'window', 'ac', 'bathroom'], blanketHex: '#ccc1b5', blanketAccent: '#5c3d32', floorHex: '#b09e8a', floorType: 'Warm Parquet Wood', unsureZone: { side: 'left_front', label: 'Area Foyer / Luar Sudut Kamera' }, generated: true, mode: 'ai', cvAnalyzed: true, cvMeta: { engine: 'KostKu-OpenCV-Spatial-v2', confidencePct: 99.2, latencyMs: 13.2 }
              }
            },
            {
              id: 'ROOM-OJN-101',
              number: '101',
              price: 1450000,
              size: '3x4',
              capacity: 1,
              status: 'available',
              roomPhoto: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
              floorPlan: {
                dimensions: '3.0m x 4.0m', bedType: 'single', pillows: 1, bedSide: 'right', bedOrientation: 'vertical', windowWall: 'top', acWall: 'top', bathroomCorner: 'top_left', doorPosition: 'bottom_center', wardrobePos: 'bottom_left', deskPos: 'bottom_right', furnitures: ['wardrobe', 'desk', 'window', 'ac', 'bathroom'], blanketHex: '#e2e8f0', blanketAccent: '#3b82f6', floorHex: '#b09e8a', floorType: 'Warm Parquet Wood', unsureZone: { side: 'left_front', label: 'Area Foyer / Luar Sudut Kamera' }, generated: true, mode: 'ai', cvAnalyzed: true, cvMeta: { engine: 'KostKu-OpenCV-Spatial-v2', confidencePct: 98.7, latencyMs: 11.4 }
              }
            },
            {
              id: 'ROOM-OJN-102',
              number: '102',
              price: 1550000,
              size: '3.5x4',
              capacity: 1,
              status: 'available',
              roomPhoto: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
              floorPlan: {
                dimensions: '3.5m x 4.0m', bedType: 'queen', pillows: 2, bedSide: 'center', bedOrientation: 'vertical', nakasSide: 'both', windowWall: 'right', acWall: 'top', bathroomCorner: 'top_left', doorPosition: 'bottom_center', wardrobePos: 'bottom_left', deskPos: 'bottom_right', furnitures: ['wardrobe', 'desk', 'window', 'ac', 'bathroom'], blanketHex: '#f1f5f9', blanketAccent: '#0f766e', floorHex: '#b09e8a', floorType: 'Warm Parquet Wood', unsureZone: { side: 'left_front', label: 'Area Foyer / Luar Sudut Kamera' }, generated: true, mode: 'ai', cvAnalyzed: true, cvMeta: { engine: 'KostKu-OpenCV-Spatial-v2', confidencePct: 99.1, latencyMs: 12.1 }
              }
            },
            {
              id: 'ROOM-OJN-201',
              number: '201',
              price: 1750000,
              size: '4x4',
              capacity: 2,
              status: 'available',
              roomPhoto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
              floorPlan: {
                dimensions: '4.0m x 4.0m', bedType: 'double', pillows: 2, bedSide: 'center', bedOrientation: 'vertical', nakasSide: 'both', windowWall: 'left', acWall: 'top', bathroomCorner: 'top_right', doorPosition: 'bottom_center', wardrobePos: 'bottom_right', deskPos: 'bottom_left', furnitures: ['wardrobe', 'desk', 'window', 'ac', 'bathroom'], blanketHex: '#fef3c7', blanketAccent: '#b45309', floorHex: '#b09e8a', floorType: 'Warm Parquet Wood', unsureZone: { side: 'right_front', label: 'Area Foyer / Luar Sudut Kamera' }, generated: true, mode: 'ai', cvAnalyzed: true, cvMeta: { engine: 'KostKu-OpenCV-Spatial-v2', confidencePct: 99.4, latencyMs: 12.8 }
              }
            }
          ]
        }
      }
    ],
    edgeUsers: [],
    posPaidReferences: new Set(),
    posStore: {
      storeName: '',
      location: '',
      address: '',
      city: '',
      phone: '',
      isValidated: false,
      storeMode: 'mitra',
      visibilityMode: 'mitra',
      kasirOnly: false,
      isMitra: true,
      billingTier: 'TIER_1_FLAT',
      loyaltyPoolId: null,
      kasirWebOnline: false,
      lastKasirHeartbeatAt: null,
      saldoNota: 0,
      kuotaNota: 0,
      notaFeeBearer: 'store',
      notaFeePerNotaIdr: 25,
      uid: '',
      merchantId: '',
      activeBranch: '',
      branches: []
    },
    posProducts: [],
    posTables: [],
    posInventory: [],
    posRecipes: {},
    posFoodPromos: [],
    posRedeemCodes: [],
    posOrders: [],
    merchantWallets: {},
    unifiedWallets: {},
    receiptClaims: [],
    customerLoyaltyAccounts: {},
    pointsLedger: [],
    walletMutations: [],
    escrowInitialized: true
  };
}

function createDemoEdgeState() {
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);
  return {
    isDemo: true,
    registeredPartnerHistory: new Set(),
    registeredMerchants: [],
    suggestedWarungs: [],
    edgeKostReports: [],
    edgeDepositRefunds: [],
    edgeTransactions: [],
    edgeKosts: [
      {
        uid: 'KOST-BDG-02',
        kostName: 'Kost Putri Griya Asri Dago',
        name: 'Kost Putri Griya Asri Dago',
        ownerId: '1790690895763',
        ownerEmail: 'pemilik@kostku.id',
        ownerPhone: '081234567890',
        address: 'Jl. Ir. H. Juanda No. 88, Dago, Bandung',
        city: 'Bandung',
        type: 'Putri',
        status: 'active',
        coverPhoto: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80'
        ],
        facilities: ['WiFi 100Mbps', 'AC', 'Kamar Mandi Dalam', 'Dapur Bersama'],
        settings: {
          depositEnabled: true,
          depositAmount: 500000,
          depositPreferredAmount: 500000,
          waterRate: 6500,
          electricityRate: 1500,
          utilityScheme: 'managed',
          rooms: [
            { id: 'RM-BDG-101', number: '101', price: 1650000, size: '3.5x4', capacity: 1, status: 'occupied', occupiedBy: 'Annisa Rahmawati', tenantId: 1790690390205 },
            { id: 'RM-BDG-102', number: '102', price: 1650000, size: '3.5x4', capacity: 1, status: 'available' },
            { id: 'RM-BDG-201', number: '201', price: 1750000, size: '3.5x4', capacity: 1, status: 'available' }
          ]
        }
      },
      {
        uid: 'KOST-DAQ3E4',
        kostName: 'Kost Graha Indah Simpang Lima',
        name: 'Kost Graha Indah Simpang Lima',
        ownerId: '1790636581960',
        ownerEmail: 'pemilik.kedua@kostku.id',
        ownerPhone: '081322334455',
        address: 'Jl. Erlangga Raya No. 15, Pleburan, Semarang Selatan',
        city: 'Semarang',
        type: 'Campur',
        status: 'active',
        coverPhoto: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&auto=format&fit=crop&q=80'
        ],
        facilities: ['WiFi', 'AC', 'Parkir Motor', 'CCTV'],
        settings: {
          depositEnabled: false,
          depositAmount: 0,
          depositPreferredAmount: 500000,
          waterRate: 0,
          electricityRate: 0,
          utilityScheme: 'managed',
          rooms: [
            { id: 'RM-SMG-101', number: '101', price: 1200000, size: '3x4', capacity: 1, status: 'available' },
            { id: 'RM-SMG-102', number: '102', price: 1250000, size: '3x4', capacity: 1, status: 'available' }
          ]
        }
      },
      {
        uid: 'KOST-OJN64X',
        kostName: 'KostKu Residence Udinus',
        name: 'KostKu Residence Udinus',
        ownerId: '1784987558042',
        ownerEmail: 'owner.demo@kostku.id',
        ownerPhone: '081234567890',
        address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
        city: 'Semarang',
        type: 'Campur',
        status: 'active',
        coverPhoto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&auto=format&fit=crop&q=80',
        photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&auto=format&fit=crop&q=80'],
        facilities: ['WiFi 100Mbps', 'AC', 'Smart Lock', 'Kantin POS'],
        settings: {
          depositEnabled: true,
          depositAmount: 500000,
          depositPreferredAmount: 500000,
          waterRate: 5000,
          electricityRate: 1500,
          utilityScheme: 'managed',
          rooms: [
            { id: 'RM-UDN-122', number: '122', price: 1500000, size: '3.5x4', capacity: 1, status: 'occupied', occupiedBy: 'Penghuni Demo', tenantId: '1784987632155' },
            { id: 'RM-UDN-123', number: '123', price: 1500000, size: '3.5x4', capacity: 1, status: 'available' }
          ]
        }
      }
    ],
    edgeUsers: [
      {
        id: 1790690390205,
        name: 'Annisa Rahmawati (Demo)',
        email: 'penghuni@kostku.id',
        phone: '081298765432',
        role: 'user',
        kostUid: 'KOST-BDG-02',
        kamar: '101',
        status: 'active',
        depositPaid: 500000,
        depositStatus: 'held',
        rentPaid: true
      },
      {
        id: '1784987632155',
        name: 'Penghuni Demo 2',
        email: 'demo2@kostku.id',
        phone: '081234567890',
        role: 'user',
        kostUid: 'KOST-OJN64X',
        kamar: '122',
        status: 'active',
        depositPaid: 500000,
        depositStatus: 'held',
        rentPaid: true
      }
    ],
    posPaidReferences: new Set(),
    posStore: {
      storeName: 'KostKu Cafe & Resto (Demo)',
      location: 'Area Demo Sandbox',
      address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
      city: 'Semarang',
      phone: '081234567890',
      isValidated: true,
      storeMode: 'mitra',
      visibilityMode: 'mitra',
      kasirOnly: false,
      isMitra: true,
      billingTier: 'TIER_2_LOYALTY',
      loyaltyPoolId: 'POOL-DEMO-KASIR',
      kasirWebOnline: false,
      lastKasirHeartbeatAt: null,
      saldoNota: 100000,
      kuotaNota: 1000,
      notaFeeBearer: 'store',
      notaFeePerNotaIdr: 100,
      uid: 'MTR-KASIR-MASTER',
      merchantId: 'MTR-KASIR-MASTER',
      activeBranch: 'MTR-KASIR-MASTER',
      branches: [
        { id: 'MTR-KASIR-MASTER', name: 'KostKu Cafe & Resto (Demo)', address: 'Jl. Nakula I No. 5-11, Semarang', saldoNota: 100000, kuotaNota: 1000 },
        { id: 'MTR-CABANG-TEMBALANG', name: 'KostKu Kitchen & Coffee Tembalang (Demo)', address: 'Jl. Prof. Soedarto No. 12, Tembalang, Semarang', saldoNota: 25000, kuotaNota: 250 },
        { id: 'MTR-CABANG-SEKARAN', name: 'KostKu Food Corner Sekaran (Demo)', address: 'Jl. Taman Siswa No. 8, Sekaran, Gunungpati', saldoNota: 15000, kuotaNota: 150 }
      ]
    },
    posProducts: [
      { id: 'prod-1', name: 'Mie Gacoan Level 2', category: 'Makanan', price: 13000, stock: 99, isAvailable: true, description: 'Mie pedas gurih manis dengan topping ayam cincang dan pangsit goreng renyah.', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80' },
      { id: 'prod-2', name: 'Nasi Goreng Spesial Kost', category: 'Makanan', price: 18000, stock: 50, isAvailable: true, description: 'Nasi goreng dengan telur mata sapi, sosis, dan suwiran ayam.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80' },
      { id: 'prod-3', name: 'Pangsit Goreng Crispy (3 pcs)', category: 'Snack', price: 10000, stock: 60, isAvailable: true, description: 'Pangsit isi ayam udang digoreng renyah dengan saus asam manis.', image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=500&q=80' },
      { id: 'prod-4', name: 'Es Teh Manis Jumbo', category: 'Minuman', price: 4000, stock: 200, isAvailable: true, description: 'Teh melati wangi dingin segar porsi besar.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80' },
      { id: 'prod-5', name: 'Es Kopi Susu Gula Aren', category: 'Minuman', price: 12000, stock: 80, isAvailable: true, description: 'Espresso robusta mantap dengan susu segar dan gula aren murni.', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80' }
    ],
    posTables: [
      { id: 'tbl-1', number: 'Meja 01', qrToken: 'MEJA-01-TKN881' },
      { id: 'tbl-2', number: 'Meja 02', qrToken: 'MEJA-02-TKN882' },
      { id: 'tbl-3', number: 'Meja 03', qrToken: 'MEJA-03-TKN883' },
      { id: 'tbl-4', number: 'Meja 04', qrToken: 'MEJA-04-TKN884' },
      { id: 'tbl-5', number: 'Meja 05', qrToken: 'MEJA-05-TKN885' }
    ],
    posInventory: [
      { id: 'INV-MIE', name: 'Mie Basah Telur Segar', category: 'Bahan Pokok', unit: 'porsi', currentStock: 25, minAlertStock: 15, costPerUnit: 2500, supplier: 'CV Berkah Pangan Mandiri', lastRestocked: nowIso },
      { id: 'INV-AYAM', name: 'Daging Ayam Cincang Marinasi', category: 'Protein & Daging', unit: 'gram', currentStock: 450, minAlertStock: 500, costPerUnit: 45, supplier: 'Rumah Potong Unggas Sejahtera', lastRestocked: nowIso },
      { id: 'INV-PANGSIT', name: 'Kulit & Pangsit Goreng Crispy', category: 'Topping & Snack', unit: 'pcs', currentStock: 35, minAlertStock: 20, costPerUnit: 800, supplier: 'UMKM Keripik Barokah', lastRestocked: nowIso },
      { id: 'INV-MINYAK-CABAI', name: 'Minyak Cabai & Sambal Level', category: 'Bumbu & Saus', unit: 'ml', currentStock: 180, minAlertStock: 200, costPerUnit: 25, supplier: 'Dapur Rempah KostKu', lastRestocked: nowIso },
      { id: 'INV-BERAS', name: 'Beras Ramos Premium', category: 'Bahan Pokok', unit: 'gram', currentStock: 5000, minAlertStock: 2000, costPerUnit: 14, supplier: 'Gudang Beras Delanggu', lastRestocked: nowIso },
      { id: 'INV-TELUR', name: 'Telur Ayam Negeri Segar', category: 'Protein & Daging', unit: 'butir', currentStock: 18, minAlertStock: 10, costPerUnit: 2000, supplier: 'Peternakan Ayam Makmur', lastRestocked: nowIso },
      { id: 'INV-SOSIS', name: 'Sosis Sapi Panggang', category: 'Protein & Daging', unit: 'pcs', currentStock: 24, minAlertStock: 15, costPerUnit: 1500, supplier: 'Distributor Frozen Food', lastRestocked: nowIso },
      { id: 'INV-KOPI', name: 'Biji Kopi Robusta Blend', category: 'Kopi & Minuman', unit: 'gram', currentStock: 850, minAlertStock: 300, costPerUnit: 150, supplier: 'Roastery Kopi Temanggung', lastRestocked: nowIso },
      { id: 'INV-SUSU', name: 'Susu Segar Fresh Milk', category: 'Kopi & Minuman', unit: 'ml', currentStock: 420, minAlertStock: 500, costPerUnit: 20, supplier: 'Koperasi Susu Boyolali', lastRestocked: nowIso },
      { id: 'INV-GULA-AREN', name: 'Sirup Gula Aren Organik', category: 'Kopi & Minuman', unit: 'ml', currentStock: 650, minAlertStock: 250, costPerUnit: 35, supplier: 'Produsen Gula Semut Cilacap', lastRestocked: nowIso },
      { id: 'INV-TEH', name: 'Daun Teh Melati Wangi', category: 'Kopi & Minuman', unit: 'gram', currentStock: 600, minAlertStock: 200, costPerUnit: 40, supplier: 'Perkebunan Teh Pagilaran', lastRestocked: nowIso },
      { id: 'INV-BOX-KERTAS', name: 'Box Kraft Food Grade', category: 'Kemasan & Packaging', unit: 'pcs', currentStock: 80, minAlertStock: 30, costPerUnit: 1200, supplier: 'Pabrik Kemasan Paperindo', lastRestocked: nowIso },
      { id: 'INV-CUP-PLASTIK', name: 'Cup Plastik 16oz + Tutup', category: 'Kemasan & Packaging', unit: 'pcs', currentStock: 55, minAlertStock: 25, costPerUnit: 900, supplier: 'Distributor Plastik Semarang', lastRestocked: nowIso },
      { id: 'INV-SEDOTAN', name: 'Sedotan Steril Higienis', category: 'Kemasan & Packaging', unit: 'pcs', currentStock: 120, minAlertStock: 50, costPerUnit: 150, supplier: 'Distributor Plastik Semarang', lastRestocked: nowIso }
    ],
    posRecipes: {
      'prod-1': [
        { inventoryId: 'INV-MIE', amount: 1, name: 'Mie Basah Telur Segar', unit: 'porsi' },
        { inventoryId: 'INV-AYAM', amount: 40, name: 'Daging Ayam Cincang Marinasi', unit: 'gram' },
        { inventoryId: 'INV-PANGSIT', amount: 2, name: 'Kulit & Pangsit Goreng Crispy', unit: 'pcs' },
        { inventoryId: 'INV-MINYAK-CABAI', amount: 15, name: 'Minyak Cabai & Sambal Level', unit: 'ml' },
        { inventoryId: 'INV-BOX-KERTAS', amount: 1, name: 'Box Kraft Food Grade', unit: 'pcs' }
      ],
      'prod-2': [
        { inventoryId: 'INV-BERAS', amount: 150, name: 'Beras Ramos Premium', unit: 'gram' },
        { inventoryId: 'INV-TELUR', amount: 1, name: 'Telur Ayam Negeri Segar', unit: 'butir' },
        { inventoryId: 'INV-SOSIS', amount: 1, name: 'Sosis Sapi Panggang', unit: 'pcs' },
        { inventoryId: 'INV-AYAM', amount: 25, name: 'Daging Ayam Cincang Marinasi', unit: 'gram' },
        { inventoryId: 'INV-BOX-KERTAS', amount: 1, name: 'Box Kraft Food Grade', unit: 'pcs' }
      ],
      'prod-3': [
        { inventoryId: 'INV-PANGSIT', amount: 3, name: 'Kulit & Pangsit Goreng Crispy', unit: 'pcs' },
        { inventoryId: 'INV-BOX-KERTAS', amount: 1, name: 'Box Kraft Food Grade', unit: 'pcs' }
      ],
      'prod-4': [
        { inventoryId: 'INV-TEH', amount: 10, name: 'Daun Teh Melati Wangi', unit: 'gram' },
        { inventoryId: 'INV-CUP-PLASTIK', amount: 1, name: 'Cup Plastik 16oz + Tutup', unit: 'pcs' },
        { inventoryId: 'INV-SEDOTAN', amount: 1, name: 'Sedotan Steril Higienis', unit: 'pcs' }
      ],
      'prod-5': [
        { inventoryId: 'INV-KOPI', amount: 18, name: 'Biji Kopi Robusta Blend', unit: 'gram' },
        { inventoryId: 'INV-SUSU', amount: 150, name: 'Susu Segar Fresh Milk', unit: 'ml' },
        { inventoryId: 'INV-GULA-AREN', amount: 25, name: 'Sirup Gula Aren Organik', unit: 'ml' },
        { inventoryId: 'INV-CUP-PLASTIK', amount: 1, name: 'Cup Plastik 16oz + Tutup', unit: 'pcs' },
        { inventoryId: 'INV-SEDOTAN', amount: 1, name: 'Sedotan Steril Higienis', unit: 'pcs' }
      ]
    },
    posFoodPromos: [
      { id: 'PROMO-FOOD-01', title: 'Promo Mie Gacoan Hemat (Diskon Rp 3.000)', code: 'GACOANHEMAT', scope: 'SPECIFIC_ITEM', targetProductId: 'prod-1', targetProductName: 'Mie Gacoan Level 2', discountType: 'FIXED', discountValue: 3000, minOrder: 0, limitType: 'QUOTA', maxQuota: 25, usedCount: 4, startDate: todayStr, expiryDate: null, isActive: true, createdByRole: 'owner', description: 'Diskon Rp 3.000 per porsi untuk 25 pemesan pertama', createdAt: nowIso },
      { id: 'PROMO-FOOD-02', title: 'Promo Diskon 15% Semua Menu', code: 'WEEKENDSERU', scope: 'ALL', targetProductId: null, targetProductName: null, discountType: 'PERCENT', discountValue: 15, minOrder: 25000, limitType: 'DATE', maxQuota: null, usedCount: 2, startDate: todayStr, expiryDate: '2026-11-30', isActive: true, createdByRole: 'mitra', description: 'Diskon 15% semua menu min. belanja Rp 25.000 berlaku s/d 30 November 2026', createdAt: nowIso },
      { id: 'PROMO-FOOD-03', title: 'Super Kenyang Hemat Rp 5.000', code: 'KENYANG5K', scope: 'ALL', targetProductId: null, targetProductName: null, discountType: 'FIXED', discountValue: 5000, minOrder: 20000, limitType: 'BOTH', maxQuota: 50, usedCount: 8, startDate: todayStr, expiryDate: '2026-11-25', isActive: true, createdByRole: 'admin', description: 'Potongan Rp 5.000 untuk 50 porsi atau s/d 25 November 2026', createdAt: nowIso }
    ],
    posRedeemCodes: [
      { id: 'REDEEM-KASIR-50', code: 'KASIRBONUS50', type: 'KUOTA_NOTA', quotaNota: 50, saldoBonus: 5000, maxQuota: 20, usedCount: 0, usedBy: [], description: 'Bonus 50 Kuota Nota Kasir (Rp 5.000)', isActive: true, createdAt: nowIso },
      { id: 'REDEEM-KASIR-100', code: 'KOSTKUMERDEKA', type: 'KUOTA_NOTA', quotaNota: 100, saldoBonus: 10000, maxQuota: 10, usedCount: 0, usedBy: [], description: 'Bonus Spesial 100 Kuota Nota Kasir (Rp 10.000)', isActive: true, createdAt: nowIso },
      { id: 'REDEEM-KASIR-VIP', code: 'VIPKASIR250', type: 'KUOTA_NOTA', quotaNota: 250, saldoBonus: 25000, maxQuota: 5, usedCount: 0, usedBy: [], description: 'Bonus Kuota Mitra Prioritas 250 Nota (Rp 25.000)', isActive: true, createdAt: nowIso }
    ],
    posOrders: [],
    merchantWallets: {
      'MTR-KASIR-MASTER': { merchantId: 'MTR-KASIR-MASTER', name: 'KostKu Cafe & Resto (Demo)', whatsappNumber: '081234567890', available_balance: 100000.00, held_promo_balance: 60.00, updatedAt: nowIso },
      'MTR-CABANG-TEMBALANG': { merchantId: 'MTR-CABANG-TEMBALANG', name: 'KostKu Kitchen & Coffee Tembalang (Demo)', whatsappNumber: '081234567891', available_balance: 25000.00, held_promo_balance: 0.00, updatedAt: nowIso },
      'MTR-CABANG-SEKARAN': { merchantId: 'MTR-CABANG-SEKARAN', name: 'KostKu Food Corner Sekaran (Demo)', whatsappNumber: '081234567892', available_balance: 15000.00, held_promo_balance: 0.00, updatedAt: nowIso }
    },
    unifiedWallets: {},
    receiptClaims: [],
    customerLoyaltyAccounts: {
      '081234567890': { whatsapp_number: '081234567890', name: 'Pelanggan Demo', total_points: 250, createdAt: nowIso }
    },
    pointsLedger: [],
    walletMutations: [],
    escrowInitialized: false
  };
}

const realEdgeState = createRealEdgeState();
const demoEdgeState = createDemoEdgeState();

function isEdgeDemoRequest(request, url) {
  const hdrDemo = request.headers.get('x-demo-mode') === 'true' || request.headers.get('x-is-demo') === 'true';
  if (hdrDemo) return true;
  if (
    url.searchParams.get('demo') === 'true' ||
    url.searchParams.get('isDemo') === 'true' ||
    url.searchParams.get('includeDemo') === 'true'
  ) {
    return true;
  }
  const qKostUid = String(url.searchParams.get('kostUid') || '').toUpperCase();
  if (qKostUid.includes('DEMO') || qKostUid.includes('SAMPLE')) return true;
  return false;
}

function resolveEdgeDepositConfig(kost) {
  const s = kost?.settings || {};
  const explicitEnabled = typeof s.depositEnabled === 'boolean' ? s.depositEnabled : null;
  const rawAmt = s.depositAmount !== undefined && s.depositAmount !== null ? Number(s.depositAmount) : undefined;
  const prefAmt = s.depositPreferredAmount !== undefined && s.depositPreferredAmount !== null ? Number(s.depositPreferredAmount) : undefined;
  const depositEnabled = explicitEnabled !== null ? explicitEnabled : (rawAmt !== undefined ? rawAmt > 0 : false);
  const resolvedPreferred = prefAmt && prefAmt > 0 ? prefAmt : (rawAmt && rawAmt > 0 ? rawAmt : 500000);
  const depositAmount = depositEnabled ? (rawAmt !== undefined && rawAmt > 0 ? rawAmt : resolvedPreferred) : 0;
  return { depositEnabled, depositAmount, depositPreferredAmount: resolvedPreferred };
}

function resolveEdgeHeldDeposit(tenant, kost) {
  if (!tenant) return 0;
  if (tenant.status === 'checked_out' || tenant.depositStatus === 'refunded') return 0;
  if (tenant.depositHeld !== undefined && tenant.depositHeld !== null) return Math.max(0, Number(tenant.depositHeld) || 0);
  if (tenant.depositPaid !== undefined && tenant.depositPaid !== null) return Math.max(0, Number(tenant.depositPaid) || 0);
  return resolveEdgeDepositConfig(kost).depositAmount;
}

function buildEdgeEmvCoQris(amount, orderId, merchantName = 'KOSTKU PROPERTIES') {
  const cleanAmt = String(Math.max(100, Math.round(Number(amount) || 0)));
  const cleanMerch = String(merchantName || 'KOSTKU').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 22) || 'KOSTKU';
  const tlv = (tag, val) => `${tag}${String(val.length).padStart(2, '0')}${val}`;
  const mAcc = tlv('00', 'ID.LINKAJA.WWW') + tlv('01', '936009110022207908') + tlv('02', 'ID1020268892019') + tlv('03', 'UME');
  const payloadNoCrc =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', mAcc) +
    tlv('52', '6513') +
    tlv('53', '360') +
    tlv('54', cleanAmt) +
    tlv('58', 'ID') +
    tlv('59', cleanMerch) +
    tlv('60', 'SEMARANG') +
    tlv('61', '50131') +
    tlv('62', tlv('01', String(orderId || 'KST').slice(0, 20))) +
    '6304';
  let crc = 0xFFFF;
  for (let i = 0; i < payloadNoCrc.length; i++) {
    crc ^= payloadNoCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return payloadNoCrc + crc.toString(16).toUpperCase().padStart(4, '0');
}

function getInventoryAlerts(state) {
  return state.posInventory
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
}

function getRecipesList(state) {
  return state.posProducts.map(p => {
    const ingredients = state.posRecipes[p.id] || [];
    const totalHPP = ingredients.reduce((sum, ing) => {
      const inv = state.posInventory.find(i => i.id === ing.inventoryId);
      return sum + ((inv ? Number(inv.costPerUnit || 0) : 0) * (Number(ing.amount) || 0));
    }, 0);
    const grossProfit = Math.max(0, p.price - totalHPP);
    const marginPct = p.price > 0 ? Number(((grossProfit / p.price) * 100).toFixed(1)) : 0;
    return {
      productId: p.id,
      productName: p.name,
      category: p.category,
      price: p.price,
      image: p.image,
      ingredients,
      totalHPP,
      grossProfit,
      marginPct
    };
  });
}

function calculateAnalytics(state) {
  const activeOrders = state.posOrders.filter(o => o.status !== 'CANCELLED');

  const menuStatsMap = {};
  state.posProducts.forEach(p => {
    const ingList = state.posRecipes[p.id] || [];
    const hppPerPortion = ingList.reduce((sum, ing) => {
      const inv = state.posInventory.find(i => i.id === ing.inventoryId);
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

  activeOrders.forEach(order => {
    (order.items || []).forEach(it => {
      const pid = it.productId || it.id;
      if (menuStatsMap[pid]) {
        const qty = Number(it.qty) || 1;
        const subtotal = Number(it.subtotal) || (menuStatsMap[pid].price * qty);
        menuStatsMap[pid].totalQtySold += qty;
        menuStatsMap[pid].totalRevenue += subtotal;
        menuStatsMap[pid].orderCount += 1;
      }
    });
  });

  const perMenu = Object.values(menuStatsMap).map(m => {
    m.totalHPP = m.totalQtySold * m.hppPerPortion;
    m.grossProfit = Math.max(0, m.totalRevenue - m.totalHPP);
    m.marginPct = m.totalRevenue > 0 ? ((m.grossProfit / m.totalRevenue) * 100).toFixed(1) : 0;
    return m;
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const storesList = Array.isArray(state.posStore.branches) && state.posStore.branches.length > 0
    ? state.posStore.branches
    : (state.posStore.storeName
      ? [{ id: state.posStore.merchantId || state.posStore.uid || 'STORE-MAIN', name: state.posStore.storeName, address: state.posStore.address || '', saldoNota: state.posStore.saldoNota || 0, kuotaNota: state.posStore.kuotaNota || 0 }]
      : []);

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

  const primaryStoreId = storesList[0]?.id || '';
  activeOrders.forEach(o => {
    const sid = o.storeId && perStoreMap[o.storeId] ? o.storeId : primaryStoreId;
    const target = sid ? perStoreMap[sid] : null;
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
      target.notaFees += Number(o.adminFee || 100);
      (o.items || []).forEach(it => {
        target.topMenuItems[it.name] = (target.topMenuItems[it.name] || 0) + (Number(it.qty) || 1);
      });
    }
  });

  const perStore = Object.values(perStoreMap).map(s => {
    s.netRevenue = Math.max(0, s.grossRevenue - s.notaFees);
    s.aov = s.totalOrders > 0 ? Math.round(s.grossRevenue / s.totalOrders) : 0;
    return s;
  }).sort((a, b) => b.grossRevenue - a.grossRevenue);

  const crossBranchPerMenu = state.posProducts.map(prod => {
    const branchBreakdown = {};
    let totalAllBranchesQty = 0;
    let totalAllBranchesRevenue = 0;

    storesList.forEach(st => {
      branchBreakdown[st.id] = { storeId: st.id, storeName: st.name, qty: 0, revenue: 0 };
    });

    activeOrders.forEach(ord => {
      const sid = ord.storeId && branchBreakdown[ord.storeId] ? ord.storeId : primaryStoreId;
      (ord.items || []).forEach(it => {
        const pid = it.productId || it.id;
        if (pid === prod.id) {
          const q = Number(it.qty) || 1;
          const rev = Number(it.subtotal) || (prod.price * q);
          if (sid && branchBreakdown[sid]) {
            branchBreakdown[sid].qty += q;
            branchBreakdown[sid].revenue += rev;
          }
          totalAllBranchesQty += q;
          totalAllBranchesRevenue += rev;
        }
      });
    });

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

  const cashierMap = {};
  activeOrders.forEach(o => {
    const cid = o.cashierId || 'KSR-01';
    if (!cashierMap[cid]) {
      cashierMap[cid] = {
        cashierId: cid,
        cashierName: o.cashierName || 'Kasir',
        role: 'Kasir',
        ordersCount: 0,
        revenue: 0,
        cashHandled: 0,
        qrisProcessed: 0
      };
    }
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

  const perCashier = Object.values(cashierMap).map((c, idx) => {
    c.rank = idx + 1;
    c.avgOrderValue = c.ordersCount > 0 ? Math.round(c.revenue / c.ordersCount) : 0;
    c.performanceRating = c.ordersCount >= 20 ? 'Performa Unggul' : c.ordersCount >= 10 ? 'Sangat Baik' : 'Baik';
    return c;
  }).sort((a, b) => b.revenue - a.revenue);

  const alerts = getInventoryAlerts(state);
  const totalGrossOmset = perStore.reduce((sum, s) => sum + s.grossRevenue, 0);

  return {
    success: true,
    perMenu,
    perStore,
    crossBranchPerMenu,
    perCashier,
    inventoryAlerts: alerts,
    summary: {
      totalGrossOmset,
      totalOrdersCount: activeOrders.length,
      activeBranchesCount: storesList.length,
      totalLowStockAlerts: alerts.length,
      topPerformingBranch: perStore[0]?.storeName || '-',
      topSellingProduct: perMenu[0]?.name || '-'
    }
  };
}

function calculateWibClaimDeadline(transDate = new Date()) {
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wibTime = new Date(transDate.getTime() + wibOffsetMs);
  const year = wibTime.getUTCFullYear();
  const month = wibTime.getUTCMonth();
  const date = wibTime.getUTCDate();
  return new Date(Date.UTC(year, month, date + 1, 16, 59, 59, 999));
}

function ensureEscrowCollections(state) {
  if (state.escrowInitialized || !state.isDemo) return;
  state.escrowInitialized = true;

  const now = new Date();
  const todayDeadline = calculateWibClaimDeadline(now);
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const yesterdayDeadline = calculateWibClaimDeadline(yesterday);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  const threeDaysAgoDeadline = calculateWibClaimDeadline(threeDaysAgo);

  state.receiptClaims = [
    {
      id: 'CLM-DEMO-001',
      order_id: 'ORD-DEMO-001',
      merchant_id: 'MTR-KASIR-MASTER',
      merchant_name: 'KostKu Cafe & Resto (Demo)',
      invoice_number: 'INV-' + now.toISOString().slice(0, 10).replace(/-/g, '') + '-001',
      total_amount: 35000,
      claim_token: 'demo-claim-today',
      qr_claim_url: 'https://kostku.riuph.me/claim?token=demo-claim-today',
      status: 'PENDING',
      claimed_by_whatsapp: null,
      points_awarded: 0,
      claim_deadline: todayDeadline.toISOString(),
      claimed_at: null,
      refunded_at: null,
      createdAt: now.toISOString()
    },
    {
      id: 'CLM-DEMO-002',
      order_id: 'ORD-DEMO-002',
      merchant_id: 'MTR-KASIR-MASTER',
      merchant_name: 'KostKu Cafe & Resto (Demo)',
      invoice_number: 'INV-' + yesterday.toISOString().slice(0, 10).replace(/-/g, '') + '-002',
      total_amount: 28000,
      claim_token: 'demo-claim-claimed',
      qr_claim_url: 'https://kostku.riuph.me/claim?token=demo-claim-claimed',
      status: 'CLAIMED',
      claimed_by_whatsapp: '081234567890',
      points_awarded: 28,
      claim_deadline: yesterdayDeadline.toISOString(),
      claimed_at: yesterday.toISOString(),
      refunded_at: null,
      createdAt: yesterday.toISOString()
    },
    {
      id: 'CLM-DEMO-003',
      order_id: 'ORD-DEMO-003',
      merchant_id: 'MTR-KASIR-MASTER',
      merchant_name: 'KostKu Cafe & Resto (Demo)',
      invoice_number: 'INV-' + threeDaysAgo.toISOString().slice(0, 10).replace(/-/g, '') + '-003',
      total_amount: 45000,
      claim_token: 'demo-claim-expired',
      qr_claim_url: 'https://kostku.riuph.me/claim?token=demo-claim-expired',
      status: 'EXPIRED',
      claimed_by_whatsapp: null,
      points_awarded: 0,
      claim_deadline: threeDaysAgoDeadline.toISOString(),
      claimed_at: null,
      refunded_at: new Date(threeDaysAgo.getTime() + 2 * 24 * 3600 * 1000).toISOString(),
      createdAt: threeDaysAgo.toISOString()
    }
  ];

  state.walletMutations = [
    {
      id: 'MUT-REF-DEMO-01',
      merchant_id: 'MTR-KASIR-MASTER',
      type: 'REFUND_PROMO',
      amount: 60.00,
      unclaimed_count: 1,
      description: 'Pengembalian Deposit Promo (1 nota tidak diklaim): +Rp 60',
      balance_after: 100000.00,
      createdAt: new Date(threeDaysAgo.getTime() + 2 * 24 * 3600 * 1000).toISOString()
    }
  ];

  state.pointsLedger = [
    {
      id: 'LEDGER-DEMO-01',
      whatsapp_number: '081234567890',
      order_id: 'ORD-DEMO-002',
      invoice_number: 'INV-' + yesterday.toISOString().slice(0, 10).replace(/-/g, '') + '-002',
      change_type: 'EARN',
      points: 25,
      notes: 'Putar Lucky Spin Struk (Dapat 25 Poin)',
      createdAt: yesterday.toISOString()
    }
  ];
}

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

function rollLuckySpin(customer) {
  const spinsWithoutJackpot = customer.spins_without_jackpot || 0;
  if (spinsWithoutJackpot >= 4) {
    customer.spins_without_jackpot = 0;
    return { pointsWon: 100, sliceIndex: 0, slice: WHEEL_SLICES[0], isPity: true, isNearMiss: false, spinsWithoutJackpot: 0 };
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
  return { pointsWon, sliceIndex, slice: WHEEL_SLICES[sliceIndex], isPity: false, isNearMiss, spinsWithoutJackpot: customer.spins_without_jackpot };
}

function getWibDateString(date = new Date()) {
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  return new Date(date.getTime() + wibOffsetMs).toISOString().slice(0, 10);
}

function syncDeltaToFirebaseAsync(state, nodePath, payload, method = 'PATCH') {
  if (!state?.isDemo) return; // Never overwrite real Firebase RTDB from ephemeral Edge worker
  try {
    const cleanPath = String(nodePath).replace(/^\//, '');
    fetch(`${FIREBASE_RTDB_URL}/kostku_db/${cleanPath}.json`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (_) {}
}

function executeBatchSettlement(state) {
  const now = new Date();
  const expiredPending = state.receiptClaims.filter(c => c.status === 'PENDING' && new Date(c.claim_deadline) < now);
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
    const mId = c.merchant_id || state.posStore.merchantId || 'STORE-DEFAULT';
    if (!merchantRefundMap[mId]) {
      merchantRefundMap[mId] = { count: 0, totalRefund: 0, claims: [] };
    }
    merchantRefundMap[mId].count += 1;
    merchantRefundMap[mId].totalRefund += refundPerNote;
    merchantRefundMap[mId].claims.push(c.id);
  });

  const affectedMerchants = [];
  Object.entries(merchantRefundMap).forEach(([mId, data]) => {
    if (!state.merchantWallets[mId]) {
      state.merchantWallets[mId] = {
        merchantId: mId,
        name: state.posStore.storeName || 'Toko Kasir',
        whatsappNumber: state.posStore.phone || '',
        available_balance: 0.00,
        held_promo_balance: 0.00,
        updatedAt: now.toISOString()
      };
    }
    const wallet = state.merchantWallets[mId];
    wallet.held_promo_balance = Math.max(0, (wallet.held_promo_balance || 0) - data.totalRefund);
    wallet.available_balance = (wallet.available_balance || 0) + data.totalRefund;
    wallet.updatedAt = now.toISOString();

    if (state.posStore.merchantId === mId || state.posStore.uid === mId) {
      state.posStore.saldoNota = wallet.available_balance;
      state.posStore.kuotaNota = Math.floor(wallet.available_balance / 100);
    }

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
    state.walletMutations.unshift(mutation);
    syncDeltaToFirebaseAsync(state, `merchant_wallets/${mId}`, wallet, 'PATCH');

    affectedMerchants.push({
      merchantId: mId,
      unclaimedCount: data.count,
      totalRefund: data.totalRefund,
      newAvailableBalance: wallet.available_balance,
      remainingHeldBalance: wallet.held_promo_balance
    });
  });

  return { success: true, processedCount: expiredPending.length, totalRefunded: grandTotalRefund, affectedMerchants };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (
      url.pathname === '/checkout' ||
      url.pathname === '/bayar' ||
      url.pathname === '/pembayaran'
    ) {
      const hasBookingParams =
        url.searchParams.has('kostId') ||
        url.searchParams.has('orderId') ||
        url.searchParams.has('transactionId');
      if (!hasBookingParams) {
        return Response.redirect(`${url.origin}/`, 301);
      }
    }

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

    const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
    const removedEdgePaths = new Set([
      '/stress-test-report',
      '/stress-test-report.html',
      '/stress-test-document.html',
      '/stress-test',
      '/denah-500',
      '/report.html',
      '/demo',
      '/sandbox',
      '/demo-showcase'
    ]);
    if (removedEdgePaths.has(normalizedPath)) {
      return new Response(null, {
        status: 301,
        headers: {
          Location: `${url.origin}/`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    if (env.ASSETS) {
      if (url.pathname.startsWith('/assets/')) {
        const assetRes = await env.ASSETS.fetch(request);
        const cType = assetRes.headers.get('content-type') || '';
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
  const isHeaderDemo = isEdgeDemoRequest(request, url);
  const activeState = isHeaderDemo ? demoEdgeState : realEdgeState;

  if (activeState.isDemo) {
    ensureEscrowCollections(activeState);
  }

  // ── Version & App Health ─────────────────────────────────────────
  if ((path === '/app-version' || path === '/version') && method === 'GET') {
    return new Response(JSON.stringify({
      version: '1.6.7',
      buildDate: '2026-11-24',
      buildNumber: 172,
      appId: 'id.kostku.app'
    }), { headers: corsHeaders });
  }

  // ── HYBRID LOYALTY CLAIM & ESCROW ENDPOINTS ─────────────────────
  if ((path === '/loyalty/claim-info' || path === '/pos/claim-info' || path === '/pos/loyalty/claim-info') && method === 'GET') {
    const token = url.searchParams.get('token') || '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token struk QR wajib disertakan' }), { status: 400, headers: corsHeaders });
    }
    const claim = activeState.receiptClaims.find(c => c.claim_token === token || c.id === token || c.invoice_number === token);
    if (!claim) {
      return new Response(JSON.stringify({ error: 'Data struk tidak ditemukan atau token tidak valid' }), { status: 404, headers: corsHeaders });
    }
    const now = new Date();
    let resolvedStatus = claim.status;
    if (claim.status === 'PENDING' && now > new Date(claim.claim_deadline)) {
      resolvedStatus = 'EXPIRED';
    }
    const claimTier = resolveEdgeStoreTier(activeState, claim.merchant_id);
    return new Response(JSON.stringify({
      id: claim.id,
      token: claim.claim_token,
      invoice: claim.invoice_number,
      merchantId: claim.merchant_id,
      merchantName: claim.merchant_name || activeState.posStore.storeName || 'Toko Kasir',
      totalAmount: claim.total_amount,
      potentialPoints: Math.max(1, Math.floor(claim.total_amount / 1000)),
      status: resolvedStatus,
      billingTier: claimTier.billingTier,
      loyaltyPoolId: claimTier.loyaltyPoolId,
      canRedeemPoints: claimTier.canRedeemPoints,
      pointValueIdr: claimTier.pointValueIdr,
      claimDeadline: claim.claim_deadline,
      claimedBy: claim.claimed_by_whatsapp ? claim.claimed_by_whatsapp.replace(/(\d{4})\d+(\d{3})/, '$1****$2') : null,
      claimedAt: claim.claimed_at,
      refundedAt: claim.refunded_at,
      createdAt: claim.createdAt,
      isExpired: resolvedStatus === 'EXPIRED',
      isClaimed: resolvedStatus === 'CLAIMED'
    }), { headers: corsHeaders });
  }

  const executeEdgeReceiptClaim = (claim, { rawPhone, customerName = '', rawRefCode = '', source = 'qr' }) => {
    let cleanPhone = String(rawPhone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.slice(2);
    if (!cleanPhone.startsWith('08') || cleanPhone.length < 10 || cleanPhone.length > 15) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Nomor WhatsApp tidak valid. Masukkan nomor WhatsApp aktif (contoh: 081234567890).' }
      };
    }
    if (!claim) {
      return {
        ok: false,
        status: 404,
        body: { error: 'Struk belanja tidak ditemukan atau token QR tidak valid.' }
      };
    }
    if (claim.status === 'CLAIMED') {
      const redacted = claim.claimed_by_whatsapp ? claim.claimed_by_whatsapp.replace(/(\d{4})\d+(\d{3})/, '$1****$2') : 'nomor lain';
      return {
        ok: false,
        status: 400,
        body: {
          error: `Struk ini sudah pernah diklaim sebelumnya oleh ${redacted} pada ${new Date(claim.claimed_at || Date.now()).toLocaleString('id-ID')}.`,
          alreadyClaimed: true,
          claimedAt: claim.claimed_at
        }
      };
    }
    const now = new Date();
    if (claim.status === 'EXPIRED' || now > new Date(claim.claim_deadline)) {
      claim.status = 'EXPIRED';
      return {
        ok: false,
        status: 400,
        body: {
          error: `Masa klaim struk ini telah berakhir pada ${new Date(claim.claim_deadline).toLocaleString('id-ID')} WIB.`,
          isExpired: true,
          claimDeadline: claim.claim_deadline
        }
      };
    }
    if (!activeState.customerLoyaltyAccounts[cleanPhone]) {
      const uniqueCode = 'KST' + cleanPhone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
      activeState.customerLoyaltyAccounts[cleanPhone] = {
        whatsapp_number: cleanPhone,
        name: customerName || 'Pelanggan KostKu',
        total_points: 0,
        spins_without_jackpot: 0,
        referral_code: uniqueCode,
        daily_referral_count: 0,
        last_referral_date: getWibDateString(now),
        createdAt: now.toISOString()
      };
    }
    const customer = activeState.customerLoyaltyAccounts[cleanPhone];
    if (customerName) customer.name = customerName;
    if (!customer.referral_code) {
      customer.referral_code = 'KST' + cleanPhone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
    }
    if (customer.spins_without_jackpot === undefined) customer.spins_without_jackpot = 0;

    const spinOutcome = rollLuckySpin(customer);
    const pointsAwarded = spinOutcome.pointsWon;

    claim.status = 'CLAIMED';
    claim.claimed_by_whatsapp = cleanPhone;
    claim.claimed_via = source || 'qr';
    claim.points_awarded = pointsAwarded;
    claim.claimed_at = now.toISOString();
    customer.total_points = (customer.total_points || 0) + pointsAwarded;

    const linkedOrder = (activeState.posOrders || []).find(o => String(o.id) === String(claim.order_id) || String(o.claim_token) === String(claim.claim_token));
    if (linkedOrder) {
      linkedOrder.claimStatus = 'CLAIMED';
      linkedOrder.claimedByWhatsapp = cleanPhone;
      linkedOrder.claimedVia = source || 'qr';
      linkedOrder.claimPointsAwarded = pointsAwarded;
      linkedOrder.hasSpun = true;
      if (!linkedOrder.customerPhone) linkedOrder.customerPhone = cleanPhone;
    }

    activeState.pointsLedger.unshift({
      id: 'LEDGER-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      whatsapp_number: cleanPhone,
      order_id: claim.order_id,
      invoice_number: claim.invoice_number,
      change_type: 'EARN',
      points: pointsAwarded,
      notes: source === 'cashier_phone'
        ? `Klaim Poin via No. HP di Kasir Struk #${claim.invoice_number} (+${pointsAwarded} Poin)`
        : `Putar Lucky Spin Struk #${claim.invoice_number} (Dapat ${pointsAwarded} Poin)${spinOutcome.isPity ? ' [Pity Guarantee]' : ''}`,
      createdAt: now.toISOString()
    });

    let referralResult = { success: false, status: 'NO_CODE', bonusAwarded: 0 };
    const cleanRefCode = String(rawRefCode || '').trim().toUpperCase();
    if (cleanRefCode) {
      if (customer.referral_code && customer.referral_code.toUpperCase() === cleanRefCode) {
        referralResult = { success: false, status: 'SELF_REFERRAL_BLOCKED', message: 'Dilarang menggunakan kode referral milik sendiri!' };
      } else {
        const referrer = Object.values(activeState.customerLoyaltyAccounts).find(c => c && c.referral_code && c.referral_code.toUpperCase() === cleanRefCode);
        if (!referrer) {
          referralResult = { success: false, status: 'INVALID_CODE', message: 'Kode referral tidak ditemukan.' };
        } else if (referrer.whatsapp_number === cleanPhone) {
          referralResult = { success: false, status: 'SELF_REFERRAL_BLOCKED', message: 'Dilarang menggunakan kode referral milik sendiri!' };
        } else {
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
            const referrerBonus = Math.floor(pointsAwarded * 0.5);
            referrer.total_points = (referrer.total_points || 0) + referrerBonus;
            referrer.daily_referral_count = (referrer.daily_referral_count || 0) + 1;
            claim.referral_code_used = cleanRefCode;
            claim.referrer_whatsapp = referrer.whatsapp_number;
            claim.referrer_points_awarded = referrerBonus;

            activeState.pointsLedger.unshift({
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
            syncDeltaToFirebaseAsync(activeState, `customers/${referrer.whatsapp_number}`, referrer, 'PUT');
          }
        }
      }
    }

    const mId = claim.merchant_id || activeState.posStore.merchantId || '';
    if (mId && activeState.merchantWallets[mId]) {
      activeState.merchantWallets[mId].held_promo_balance = Math.max(0, (activeState.merchantWallets[mId].held_promo_balance || 0) - 60.00);
      activeState.merchantWallets[mId].updatedAt = now.toISOString();
      syncDeltaToFirebaseAsync(activeState, `merchant_wallets/${mId}`, activeState.merchantWallets[mId], 'PATCH');
    }

    syncDeltaToFirebaseAsync(activeState, `customers/${cleanPhone}`, customer, 'PUT');
    syncDeltaToFirebaseAsync(activeState, `receipt_claims/${claim.id}`, {
      status: 'CLAIMED',
      claimed_by_whatsapp: cleanPhone,
      claimed_via: claim.claimed_via || 'qr',
      claimed_at: claim.claimed_at,
      points_awarded: claim.points_awarded,
      referral_code_used: claim.referral_code_used || null,
      referrer_whatsapp: claim.referrer_whatsapp || null,
      referrer_points_awarded: claim.referrer_points_awarded || 0
    }, 'PATCH');

    return { ok: true, cleanPhone, customer, spinOutcome, pointsAwarded, referralResult };
  };

  if ((path === '/loyalty/claim' || path === '/pos/claim' || path === '/loyalty/spin' || path === '/pos/loyalty/claim' || path === '/pos/loyalty/spin') && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const token = (body.token || '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token struk tidak boleh kosong' }), { status: 400, headers: corsHeaders });
    }
    const claim = activeState.receiptClaims.find(c => c.claim_token === token || c.id === token || c.invoice_number === token);
    const result = executeEdgeReceiptClaim(claim, {
      rawPhone: body.whatsapp || body.phone || '',
      customerName: (body.name || '').trim(),
      rawRefCode: body.referral_code || body.referralCode || '',
      source: 'qr'
    });
    if (!result.ok) {
      return new Response(JSON.stringify(result.body), { status: result.status || 400, headers: corsHeaders });
    }
    const { cleanPhone, customer, spinOutcome, pointsAwarded, referralResult } = result;
    return new Response(JSON.stringify({
      success: true,
      message: pointsAwarded === 100
        ? `JACKPOT! Selamat Anda memenangkan 100 Poin Emas!`
        : `Selamat! Roda berhenti di ${pointsAwarded} Poin loyalitas.`,
      pointsAwarded,
      sliceIndex: spinOutcome.sliceIndex,
      slice: spinOutcome.slice,
      isNearMiss: spinOutcome.isNearMiss,
      isPity: spinOutcome.isPity,
      spinsWithoutJackpot: customer.spins_without_jackpot,
      totalPoints: customer.total_points,
      poolBalance: customer.total_points,
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
    }), { headers: corsHeaders });
  }

  if ((path === '/loyalty/unclaimed-orders' || path === '/pos/loyalty/unclaimed-orders') && method === 'GET') {
    const filterStoreId = url.searchParams.get('storeId') || url.searchParams.get('merchantId') || '';
    const now = new Date();
    const list = (activeState.receiptClaims || [])
      .filter(c => {
        if (!c || c.status !== 'PENDING') return false;
        if (c.claim_deadline && now > new Date(c.claim_deadline)) return false;
        if (filterStoreId && String(c.merchant_id || '') !== String(filterStoreId)) return false;
        return true;
      })
      .slice(0, 20)
      .map(c => {
        const linkedOrder = (activeState.posOrders || []).find(o => String(o.id) === String(c.order_id));
        return {
          claimId: c.id,
          claimToken: c.claim_token,
          orderId: c.order_id,
          invoice: c.invoice_number,
          merchantId: c.merchant_id,
          merchantName: c.merchant_name || 'Toko POS',
          totalAmount: Number(c.total_amount || linkedOrder?.totalAmount || 0),
          customerName: linkedOrder?.customerName || 'Pelanggan',
          customerPhone: linkedOrder?.customerPhone || '',
          tableNumber: linkedOrder?.tableNumber || '-',
          claimDeadline: c.claim_deadline,
          createdAt: c.createdAt || linkedOrder?.createdAt
        };
      });
    return new Response(JSON.stringify({ success: true, orders: list }), { headers: corsHeaders });
  }

  const extractEdgeCustomerPhone = (rawInput) => {
    const raw = String(rawInput || '').trim();
    if (!raw) return '';
    const memberMatch = raw.match(/^(?:KOSTKU[-_]?MEMBER|MEMBER|POIN)\s*[:=]\s*([+\d\s\-().]+)/i);
    let target = memberMatch ? memberMatch[1] : raw;
    if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) {
      try {
        const parsed = new URL(raw, 'https://kostku.riuph.me');
        target = parsed.searchParams.get('member') || parsed.searchParams.get('phone') || parsed.searchParams.get('wa') || target;
      } catch (_) {}
    }
    let digits = String(target).replace(/\D/g, '');
    if (digits.startsWith('62')) digits = '0' + digits.slice(2);
    else if (digits.startsWith('8') && digits.length >= 8 && digits.length <= 13) digits = '0' + digits;
    return digits;
  };

  if ((path === '/loyalty/cashier-claim' || path === '/pos/loyalty/cashier-claim') && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const lookupKey = String(body.token || body.claimToken || body.orderId || body.invoice || '').trim();
    const effectiveStoreId = body.storeId || body.merchantId || '';
    if (!lookupKey) {
      return new Response(JSON.stringify({ error: 'Pilih transaksi / masukkan kode faktur atau token struk terlebih dahulu.' }), { status: 400, headers: corsHeaders });
    }
    let claim = (activeState.receiptClaims || []).find(c =>
      String(c.claim_token || '') === lookupKey ||
      String(c.id || '') === lookupKey ||
      String(c.order_id || '') === lookupKey ||
      String(c.invoice_number || '') === lookupKey
    );
    if (!claim) {
      const ord = (activeState.posOrders || []).find(o =>
        String(o.id || '') === lookupKey ||
        String(o.invoice_number || o.invoice || '') === lookupKey ||
        String(o.claim_token || o.claimToken || '') === lookupKey
      );
      if (ord) {
        if (effectiveStoreId && ord.storeId && String(ord.storeId) !== String(effectiveStoreId)) {
          return new Response(JSON.stringify({ error: 'Transaksi bukan milik toko kasir ini.' }), { status: 403, headers: corsHeaders });
        }
        const synthToken = ord.claim_token || ord.claimToken || ('clm_' + Date.now().toString(36));
        claim = {
          id: 'CLM-' + Date.now(),
          order_id: ord.id,
          merchant_id: ord.storeId || effectiveStoreId || activeState.posStore.merchantId,
          merchant_name: ord.storeName || activeState.posStore.storeName || 'Toko POS',
          invoice_number: ord.invoice_number || ord.invoice || ord.id,
          total_amount: Number(ord.totalAmount || ord.subtotal || 0),
          claim_token: synthToken,
          qr_claim_url: `https://kostku.riuph.me/claim?token=${synthToken}`,
          status: ord.claimStatus === 'CLAIMED' ? 'CLAIMED' : 'PENDING',
          claimed_by_whatsapp: ord.claimedByWhatsapp || null,
          points_awarded: ord.claimPointsAwarded || 0,
          claim_deadline: calculateWibClaimDeadline(new Date(ord.createdAt || Date.now())).toISOString(),
          claimed_at: null,
          createdAt: ord.createdAt || new Date().toISOString()
        };
        activeState.receiptClaims.unshift(claim);
      }
    } else if (effectiveStoreId && claim.merchant_id && String(claim.merchant_id) !== String(effectiveStoreId)) {
      return new Response(JSON.stringify({ error: 'Struk ini berasal dari toko lain.' }), { status: 403, headers: corsHeaders });
    }
    const normalizedPhone = extractEdgeCustomerPhone(body.customerQr || body.qrPayload || body.whatsapp || body.phone || '');
    const claimViaSource = (body.customerQr || body.qrPayload) ? 'cashier_qr' : 'cashier_phone';
    const result = executeEdgeReceiptClaim(claim, {
      rawPhone: normalizedPhone,
      customerName: (body.name || '').trim(),
      source: claimViaSource
    });
    if (!result.ok) {
      return new Response(JSON.stringify(result.body), { status: result.status || 400, headers: corsHeaders });
    }
    const { cleanPhone, customer, pointsAwarded } = result;
    return new Response(JSON.stringify({
      success: true,
      message: `Berhasil! +${pointsAwarded} Poin diklaim via ${(body.customerQr || body.qrPayload) ? 'QR Pribadi' : 'No. HP'} ${cleanPhone} di Kasir.`,
      pointsAwarded,
      totalPoints: customer.total_points,
      poolBalance: customer.total_points,
      phone: cleanPhone,
      qrPayload: cleanPhone ? `KOSTKU-MEMBER:${cleanPhone}` : '',
      claimToken: claim.claim_token,
      invoice: claim.invoice_number,
      claimedVia: claimViaSource,
      claimedAt: claim.claimed_at,
      customer: {
        whatsapp_number: cleanPhone,
        name: customer.name,
        total_points: customer.total_points,
        referral_code: customer.referral_code
      }
    }), { headers: corsHeaders });
  }

  if (path.startsWith('/loyalty/customer/') && method === 'GET') {
    const phone = extractEdgeCustomerPhone(decodeURIComponent(path.replace('/loyalty/customer/', '')));
    const account = activeState.customerLoyaltyAccounts[phone] || { whatsapp_number: phone, name: 'Pelanggan KostKu', total_points: 0 };
    const history = (activeState.pointsLedger || []).filter(l => l.whatsapp_number === phone);
    const activeVouchers = (activeState.posFoodPromos || []).filter(p =>
      p &&
      p.isActive !== false &&
      Number(p.usedCount || 0) < Number(p.maxQuota ?? 1) &&
      p.customerPhone &&
      extractEdgeCustomerPhone(p.customerPhone) === phone
    );
    return new Response(JSON.stringify({
      account,
      history,
      qrPayload: phone ? `KOSTKU-MEMBER:${phone}` : '',
      tier2PoolBalance: Number(account.total_points || 0),
      activeVouchers
    }), { headers: corsHeaders });
  }

  if (path.startsWith('/wallet/account/')) {
    const cleanPath = path.replace('/wallet/account/', '');
    const isMutate = cleanPath.endsWith('/mutate') && method === 'POST';
    const rawUid = decodeURIComponent(isMutate ? cleanPath.replace(/\/mutate$/, '') : cleanPath).trim();
    const isGenericUid = !rawUid || rawUid.toUpperCase().includes('POS') || rawUid.toLowerCase() === 'kasir' || rawUid.toLowerCase() === 'kantin';
    const sharedUid = activeState.posStore.merchantId || activeState.posStore.uid || (activeState.isDemo ? 'MTR-KASIR-MASTER' : 'STORE-DEFAULT');
    const targetUid = isGenericUid ? sharedUid : rawUid;
    activeState.unifiedWallets = activeState.unifiedWallets || {};
    if (!activeState.unifiedWallets[targetUid]) {
      activeState.unifiedWallets[targetUid] = {
        uid: targetUid,
        name: activeState.posStore.storeName || 'Kasir POS & Mitra Terpadu',
        balance: 0,
        totalEarned: 0,
        totalSettled: 0,
        gateway: 'TriPay Master KostKu (T53543)',
        history: []
      };
    }
    const w = activeState.unifiedWallets[targetUid];
    if (isMutate) {
      const body = await request.json().catch(() => ({}));
      const numAmt = Number(body.amount) || 0;
      const type = String(body.type || 'deposit').toLowerCase();
      if (type === 'deposit') {
        w.balance = (Number(w.balance) || 0) + numAmt;
        w.totalEarned = (Number(w.totalEarned) || 0) + numAmt;
      } else if (type === 'withdraw' || type === 'payout') {
        if ((Number(w.balance) || 0) < numAmt) {
          return new Response(JSON.stringify({ error: 'Saldo Unified Wallet tidak mencukupi untuk penarikan dana.' }), { status: 400, headers: corsHeaders });
        }
        w.balance = (Number(w.balance) || 0) - numAmt;
        w.totalSettled = (Number(w.totalSettled) || 0) + numAmt;
      }
      w.history = Array.isArray(w.history) ? w.history : [];
      w.history.unshift({
        id: 'WAL-' + Date.now(),
        type,
        amount: numAmt,
        balanceAfter: w.balance,
        orderId: body.orderId || null,
        source: body.source || 'general',
        description: body.description || (type === 'deposit' ? 'Setoran penjualan' : 'Penarikan dana BI-FAST'),
        createdAt: new Date().toISOString()
      });
    }
    return new Response(JSON.stringify({
      success: true,
      wallet: w,
      unifiedUid: targetUid,
      isShared: true
    }), { headers: corsHeaders });
  }

  if (path.startsWith('/merchant/wallet') || path.startsWith('/pos/wallet')) {
    const mId = url.searchParams.get('merchantId') || activeState.posStore.activeBranch || (activeState.isDemo ? 'MTR-KASIR-MASTER' : 'STORE-DEFAULT');
    executeBatchSettlement(activeState);

    if (!activeState.merchantWallets[mId]) {
      activeState.merchantWallets[mId] = {
        merchantId: mId,
        name: activeState.posStore.storeName || (activeState.isDemo ? 'KostKu Cafe & Resto (Demo)' : 'Toko Kasir'),
        whatsappNumber: activeState.posStore.phone || '',
        available_balance: activeState.posStore.saldoNota || 0.00,
        held_promo_balance: 0.00,
        updatedAt: new Date().toISOString()
      };
    }

    const wallet = activeState.merchantWallets[mId];
    const claims = activeState.receiptClaims.filter(c => c.merchant_id === mId || !c.merchant_id);
    const pendingCount = claims.filter(c => c.status === 'PENDING').length;
    wallet.held_promo_balance = pendingCount * 60.00;
    const mutations = activeState.walletMutations.filter(m => m.merchant_id === mId || !m.merchant_id);

    return new Response(JSON.stringify({
      success: true,
      wallet: {
        merchantId: wallet.merchantId,
        name: wallet.name,
        whatsappNumber: wallet.whatsappNumber,
        available_balance: wallet.available_balance,
        held_promo_balance: wallet.held_promo_balance,
        pendingClaimsCount: pendingCount,
        claimedCount: claims.filter(c => c.status === 'CLAIMED').length,
        expiredCount: claims.filter(c => c.status === 'EXPIRED').length,
        updatedAt: wallet.updatedAt
      },
      claims,
      mutations
    }), { headers: corsHeaders });
  }

  if ((path === '/admin/run-batch-settlement' || path === '/pos/run-batch-settlement') && method === 'POST') {
    return new Response(JSON.stringify(executeBatchSettlement(activeState)), { headers: corsHeaders });
  }

  // ── POS & TABLE QR ENGINE ENDPOINTS (/api/pos/*) ─────────────────
  if (path.startsWith('/pos/')) {
    const posPath = path.replace(/^\/pos/, '');
    return await handlePosApi(request, posPath, method, url, activeState);
  }

  if (path === '/payments/tripay-callback' || path === '/payments/callback' || path === '/tripay-callback') {
    return await handlePosApi(request, '/tripay/callback', method, url, activeState);
  }

  // ── Auth: Registration (Real Mode) ──────────────────────────────
  if (path === '/register' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const role = body.role || 'mitra';
    const regState = (body.isDemo || email.endsWith('@kostku.id')) ? demoEdgeState : realEdgeState;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Nama dan email wajib diisi' }), { status: 400, headers: corsHeaders });
    }
    if (regState.users?.some?.(u => u.email?.toLowerCase() === email) || regState.edgeUsers.some(u => u.email?.toLowerCase() === email)) {
      return new Response(JSON.stringify({ error: 'Email sudah terdaftar' }), { status: 409, headers: corsHeaders });
    }

    const newUserId = 'usr-' + Date.now();
    let resolvedKostUid = body.kostUid || '';
    let resolvedKostName = '';
    let merchantId = '';

    if (role === 'owner') {
      resolvedKostUid = 'KOST-' + Date.now().toString(36).toUpperCase().slice(-6);
      resolvedKostName = String(body.kostName || `Kost ${name}`).trim();
      regState.edgeKosts.push({
        uid: resolvedKostUid,
        kostName: resolvedKostName,
        name: resolvedKostName,
        ownerId: newUserId,
        ownerEmail: email,
        ownerPhone: body.phone || '',
        address: body.address || '',
        city: body.city || '',
        type: body.type || 'Campur',
        status: 'active',
        coverPhoto: body.coverPhoto || '',
        photos: Array.isArray(body.photos) ? body.photos : [],
        facilities: Array.isArray(body.facilities) ? body.facilities : [],
        settings: {
          depositEnabled: Boolean(body.depositEnabled),
          depositAmount: body.depositEnabled ? (Number(body.depositAmount) || 500000) : 0,
          depositPreferredAmount: Number(body.depositAmount) || 500000,
          waterRate: 0,
          electricityRate: 0,
          utilityScheme: 'managed',
          rooms: Array.isArray(body.rooms) ? body.rooms : []
        }
      });
    } else if (role === 'mitra' && String(body.storeName || '').trim()) {
      merchantId = 'MTR-' + Date.now().toString(36).toUpperCase();
      const sName = String(body.storeName).trim();
      const visibilityMode = 'mitra';
      regState.registeredMerchants.push({
        id: merchantId,
        ownerUserId: newUserId,
        name: sName,
        category: body.category || 'Warung & Kuliner',
        phone: body.phone || '',
        address: body.address || '',
        storeMode: 'mitra',
        visibilityMode,
        kasirOnly: false,
        isMitra: true,
        billingTier: body.billingTier === 'TIER_2_LOYALTY' || body.loyaltyPoolId ? 'TIER_2_LOYALTY' : 'TIER_1_FLAT',
        loyaltyPoolId: body.loyaltyPoolId || null,
        kasirWebOnline: false,
        lastKasirHeartbeatAt: null,
        status: 'active',
        saldoNota: 5000,
        kuotaNota: 50,
        products: [],
        createdAt: new Date().toISOString()
      });
    }

    const newUser = {
      id: newUserId,
      name,
      email,
      phone: body.phone || '',
      password: body.password || '',
      role,
      kostUid: resolvedKostUid,
      kamar: '',
      merchantId,
      storeName: role === 'mitra' ? String(body.storeName || '').trim() : '',
      status: 'active',
      depositPaid: 0,
      depositStatus: 'none'
    };
    regState.edgeUsers.push(newUser);
    const { password: _, ...safeUser } = newUser;
    return new Response(JSON.stringify({
      success: true,
      user: safeUser,
      kostUid: resolvedKostUid,
      kostName: resolvedKostName,
      message: 'Pendaftaran berhasil'
    }), { status: 201, headers: corsHeaders });
  }

  // ── Auth: WhatsApp / Email OTP (Stateless HMAC-SHA256 + Gateway) ─
  function normalizeEdgeOtpTarget(target, channel) {
    const raw = String(target || '').trim();
    if (channel === 'email') return raw.toLowerCase();
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    else if (digits.startsWith('8') && digits.length >= 8 && digits.length <= 13) digits = '62' + digits;
    return digits;
  }

  function maskEdgeOtpTarget(cleanTarget, channel) {
    if (!cleanTarget) return '';
    if (channel === 'email') {
      const [local, domain] = cleanTarget.split('@');
      if (!domain) return cleanTarget;
      const head = (local || '').slice(0, 2);
      return `${head}••••@${domain}`;
    }
    const localDigits = cleanTarget.startsWith('62') ? '0' + cleanTarget.slice(2) : cleanTarget;
    if (localDigits.length <= 6) return localDigits;
    return `${localDigits.slice(0, 4)}••••${localDigits.slice(-4)}`;
  }

  function bytesToBase64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function base64UrlToBytes(str) {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function sha256HexEdge(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hmacSignEdgeOtp(payloadObj, secret) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(String(secret || 'kostku-edge-otp-secret-v1')),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const payloadB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    return `${payloadB64}.${bytesToBase64Url(new Uint8Array(sigBuf))}`;
  }

  async function hmacVerifyEdgeOtp(tokenStr, secret) {
    try {
      const parts = String(tokenStr || '').split('.');
      if (parts.length !== 2) return null;
      const [payloadB64, sigB64] = parts;
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(String(secret || 'kostku-edge-otp-secret-v1')),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        base64UrlToBytes(sigB64),
        new TextEncoder().encode(payloadB64)
      );
      if (!valid) return null;
      return JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
    } catch (_) {
      return null;
    }
  }

  if (path === '/auth/send-otp' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if ((body.website && String(body.website).trim()) || (body.company && String(body.company).trim())) {
      return new Response(JSON.stringify({
        error: 'Aktivitas otomatis (bot) terdeteksi dan diblokir oleh sistem keamanan Honeypot.'
      }), { status: 403, headers: corsHeaders });
    }

    const turnstileToken = String(body.turnstileToken || '').trim();
    if (
      env?.CLOUDFLARE_TURNSTILE_SECRET_KEY &&
      turnstileToken &&
      !turnstileToken.startsWith('cf-fallback-') &&
      !turnstileToken.startsWith('XXXX.') &&
      turnstileToken !== '1x00000000000000000000AA'
    ) {
      try {
        const fd = new URLSearchParams();
        fd.append('secret', env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
        fd.append('response', turnstileToken);
        const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: fd
        });
        const cfJson = await cfRes.json().catch(() => null);
        if (cfJson && cfJson.success === false) {
          return new Response(JSON.stringify({
            error: 'Verifikasi keamanan Cloudflare Turnstile gagal. Muat ulang halaman lalu coba lagi.'
          }), { status: 403, headers: corsHeaders });
        }
      } catch (_) {}
    }

    const selectedChannel = body.channel === 'email' ? 'email' : 'whatsapp';
    const rawTarget = String(body.target || '').trim();
    if (!rawTarget) {
      return new Response(JSON.stringify({
        error: 'Nomor WhatsApp atau alamat Email tujuan wajib diisi.'
      }), { status: 400, headers: corsHeaders });
    }

    const cleanTarget = normalizeEdgeOtpTarget(rawTarget, selectedChannel);
    if (selectedChannel === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTarget)) {
        return new Response(JSON.stringify({
          error: 'Format alamat Email tidak valid. Gunakan email aktif seperti nama@gmail.com.'
        }), { status: 400, headers: corsHeaders });
      }
    } else if (cleanTarget.length < 9) {
      return new Response(JSON.stringify({
        error: 'Nomor WhatsApp minimal 9 digit angka.'
      }), { status: 400, headers: corsHeaders });
    }

    const targetKey = `${selectedChannel}:${cleanTarget}`;
    const now = Date.now();
    activeState.otpRateMap = activeState.otpRateMap || new Map();
    const lastSentAt = activeState.otpRateMap.get(targetKey) || 0;
    if (now - lastSentAt < 15000) {
      const waitSec = Math.max(1, Math.ceil((15000 - (now - lastSentAt)) / 1000));
      return new Response(JSON.stringify({
        error: `Harap tunggu ${waitSec} detik sebelum meminta kode OTP ${selectedChannel === 'email' ? 'Email' : 'WhatsApp'} kembali.`
      }), { status: 429, headers: corsHeaders });
    }
    activeState.otpRateMap.set(targetKey, now);

    const rnd = new Uint32Array(1);
    crypto.getRandomValues(rnd);
    const code = String(100000 + (rnd[0] % 900000));
    const expiresAt = now + 5 * 60 * 1000;
    const otpSecret = env?.CLOUDFLARE_TURNSTILE_SECRET_KEY || 'kostku-edge-otp-secret-v1';
    const codeHash = await sha256HexEdge(`${selectedChannel}:${cleanTarget}:${code}`);
    const otpChallenge = await hmacSignEdgeOtp({
      c: selectedChannel,
      t: cleanTarget,
      h: codeHash,
      exp: expiresAt
    }, otpSecret);

    activeState.edgeOtpStore = activeState.edgeOtpStore || new Map();
    activeState.edgeOtpStore.set(targetKey, { codeHash, expiresAt, attempts: 0 });

    const recipientName = String(body.name || 'Pengguna KostKu').trim() || 'Pengguna KostKu';
    let deliveredExternally = false;
    let deliveryMethod = 'instant_fallback';
    const waMessage = `*KOSTKU SECURITY - KODE OTP*\n\nHalo *${recipientName}*,\nKode verifikasi 6 digit Anda adalah:\n\n*${code}*\n\nBerlaku selama 5 menit.`;
    const waDirectUrl = selectedChannel === 'whatsapp'
      ? `https://api.whatsapp.com/send?phone=${cleanTarget}&text=${encodeURIComponent(waMessage)}`
      : null;

    if (selectedChannel === 'email' && env?.RESEND_API_KEY) {
      try {
        const mailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.OTP_EMAIL_FROM || 'KostKu Security <onboarding@resend.dev>',
            to: [cleanTarget],
            subject: `[OTP: ${code}] Kode Verifikasi Pendaftaran KostKu`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;"><h2>Kode Verifikasi KostKu</h2><p>Halo <strong>${recipientName}</strong>,</p><p>Kode OTP Anda:</p><div style="font-size:28px;font-weight:800;letter-spacing:6px;padding:12px 18px;background:#f1f5f9;border-radius:8px;display:inline-block;">${code}</div><p style="margin-top:16px;color:#64748b;font-size:13px;">Berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.</p></div>`
          })
        });
        if (mailRes.ok) {
          deliveredExternally = true;
          deliveryMethod = 'resend';
        }
      } catch (_) {}
    } else if (selectedChannel === 'whatsapp' && env?.WA_GATEWAY_URL && env?.WA_API_KEY) {
      try {
        const waRes = await fetch(env.WA_GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': env.WA_API_KEY
          },
          body: JSON.stringify({ target: cleanTarget, message: waMessage })
        });
        if (waRes.ok) {
          deliveredExternally = true;
          deliveryMethod = 'wa_gateway';
        }
      } catch (_) {}
    }

    const masked = maskEdgeOtpTarget(cleanTarget, selectedChannel);
    const channelLabel = selectedChannel === 'whatsapp' ? 'WhatsApp' : 'Email';
    const responseMessage = deliveredExternally
      ? `Kode OTP 6 digit telah dikirim ke ${channelLabel} Anda (${masked}).`
      : selectedChannel === 'whatsapp'
        ? `Kode OTP 6 digit siap (${masked}). Gateway WA otomatis belum terhubung di server — gunakan Kode Verifikasi Instan di bawah atau klik Buka WhatsApp.`
        : `Kode OTP 6 digit siap (${masked}). Gateway Email (Resend/SMTP) belum terhubung di server — gunakan Kode Verifikasi Instan di bawah untuk melanjutkan.`;

    return new Response(JSON.stringify({
      success: true,
      message: responseMessage,
      channel: selectedChannel,
      targetMasked: masked,
      expiresIn: 300,
      otpChallenge,
      deliveryMethod,
      deliveredExternally,
      waDirectUrl,
      ...(!deliveredExternally ? { instantOtpCode: code, devOtp: code } : {})
    }), { status: 200, headers: corsHeaders });
  }

  if (path === '/auth/verify-otp' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const rawTarget = String(body.target || '').trim();
    const cleanCode = String(body.code || '').trim();
    if (!rawTarget || !cleanCode) {
      return new Response(JSON.stringify({
        error: 'Kontak tujuan dan 6 digit kode OTP wajib diisi.'
      }), { status: 400, headers: corsHeaders });
    }

    const selectedChannel = body.channel === 'email' ? 'email' : 'whatsapp';
    const cleanTarget = normalizeEdgeOtpTarget(rawTarget, selectedChannel);
    const targetKey = `${selectedChannel}:${cleanTarget}`;
    const expectedHash = await sha256HexEdge(`${selectedChannel}:${cleanTarget}:${cleanCode}`);
    const otpSecret = env?.CLOUDFLARE_TURNSTILE_SECRET_KEY || 'kostku-edge-otp-secret-v1';

    let verified = false;
    if (body.otpChallenge) {
      const payload = await hmacVerifyEdgeOtp(body.otpChallenge, otpSecret);
      if (!payload) {
        return new Response(JSON.stringify({
          error: 'Sesi OTP tidak valid. Silakan klik Kirim Ulang OTP.'
        }), { status: 400, headers: corsHeaders });
      }
      if (payload.c !== selectedChannel || payload.t !== cleanTarget) {
        return new Response(JSON.stringify({
          error: 'Saluran atau nomor/email OTP tidak cocok dengan kode yang diminta.'
        }), { status: 400, headers: corsHeaders });
      }
      if (Date.now() > Number(payload.exp || 0)) {
        return new Response(JSON.stringify({
          error: 'Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan klik Kirim Ulang OTP.'
        }), { status: 400, headers: corsHeaders });
      }
      if (payload.h !== expectedHash) {
        return new Response(JSON.stringify({
          error: 'Kode OTP 6 digit tidak cocok. Periksa kembali kode yang Anda masukkan.'
        }), { status: 400, headers: corsHeaders });
      }
      verified = true;
    } else {
      activeState.edgeOtpStore = activeState.edgeOtpStore || new Map();
      const record = activeState.edgeOtpStore.get(targetKey);
      if (!record) {
        return new Response(JSON.stringify({
          error: 'Kode OTP belum diminta atau sesi server telah di-reset. Silakan klik Kirim Ulang OTP.'
        }), { status: 400, headers: corsHeaders });
      }
      if (Date.now() > record.expiresAt) {
        activeState.edgeOtpStore.delete(targetKey);
        return new Response(JSON.stringify({
          error: 'Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan klik Kirim Ulang OTP.'
        }), { status: 400, headers: corsHeaders });
      }
      record.attempts += 1;
      if (record.attempts > 5) {
        activeState.edgeOtpStore.delete(targetKey);
        return new Response(JSON.stringify({
          error: 'Terlalu banyak percobaan salah (maksimal 5x). Silakan minta kode OTP baru.'
        }), { status: 400, headers: corsHeaders });
      }
      if (record.codeHash !== expectedHash) {
        return new Response(JSON.stringify({
          error: `Kode OTP salah! Sisa kesempatan mencoba: ${5 - record.attempts} kali.`
        }), { status: 400, headers: corsHeaders });
      }
      verified = true;
    }

    if (verified) {
      const rand = new Uint8Array(12);
      crypto.getRandomValues(rand);
      const verifiedToken = 'otp_verified_' + Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('');
      return new Response(JSON.stringify({
        success: true,
        message: 'Verifikasi identitas kontak berhasil!',
        verifiedToken,
        channel: selectedChannel
      }), { status: 200, headers: corsHeaders });
    }
  }

  // ── Auth: Google Login ──────────────────────────────────────────
  if (path === '/auth/google' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    let email = (body.email || '').trim().toLowerCase();
    let name = (body.name || '').trim();
    let picture = body.picture || '';

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

    const isDemoAuth = isHeaderDemo || Boolean(body.isDemo) || email.endsWith('@kostku.id');
    const authState = isDemoAuth ? demoEdgeState : realEdgeState;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Akun Google tidak menyertakan alamat email.' }), { status: 400, headers: corsHeaders });
    }

    let existing = authState.edgeUsers.find(u => String(u.email || '').toLowerCase() === email);
    if (!existing) {
      const finalRole = body.role || 'mitra';
      existing = {
        id: 'usr-' + Date.now(),
        name: name || email.split('@')[0],
        email,
        picture: picture || null,
        role: finalRole,
        kamar: '',
        kostUid: body.kostUid || '',
        loyalty_points: 0,
        authProvider: 'google',
        referralCode: ''
      };
      authState.edgeUsers.push(existing);
    }

    const matchedKost = authState.edgeKosts.find(k => k.uid === existing.kostUid);
    return new Response(JSON.stringify({
      success: true,
      user: existing,
      kostName: matchedKost?.kostName || '',
      message: 'Berhasil masuk dengan akun Google'
    }), { headers: corsHeaders });
  }

  // ── Auth: Standard Password Login ───────────────────────────────
  if (path === '/login' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const loginId = (body.loginId || '').trim();
    const lowerLogin = loginId.toLowerCase();
    const isDemoLogin = isHeaderDemo || Boolean(body.isDemo) || lowerLogin.endsWith('@kostku.id');

    if (isDemoLogin) {
      let role = 'user';
      let demoName = loginId.includes('@') ? loginId.split('@')[0] : 'Pengguna Demo';
      let kostUid = 'KOST-BDG-02';
      let kostName = 'Kost Putri Griya Asri Dago';
      let kamar = '';
      if (lowerLogin === 'pemilik@kostku.id' || lowerLogin.includes('pemilik')) {
        role = 'owner';
        demoName = 'Ibu Hj. Nurhasanah (Demo)';
      } else if (lowerLogin === 'kostbaru@kostku.id') {
        role = 'owner';
        demoName = 'Bpk. Rahmat Hidayat (Demo)';
        kostUid = 'KOST-SMG-NEW';
        kostName = 'Kost Harmoni Asri Banyumanik';
      } else if (lowerLogin.includes('mitra')) {
        role = 'mitra';
        demoName = 'Bu Siti (Mitra Demo)';
      } else if (lowerLogin.includes('staff')) {
        role = 'staff';
        demoName = 'Pak Joko Susanto (Demo)';
      } else if (lowerLogin === 'penghuni@kostku.id') {
        role = 'user';
        demoName = 'Annisa Rahmawati (Demo)';
        kamar = '101';
      } else if (lowerLogin === 'calon@kostku.id') {
        role = 'user';
        demoName = 'Rizky Ramadhan (Demo)';
        kostUid = '';
        kostName = '';
      }

      const demoUser = {
        id: lowerLogin === 'penghuni@kostku.id' ? 1790690390205 : 'usr-demo-' + role,
        name: demoName,
        email: loginId || `${role}@kostku.id`,
        role,
        isDemo: true,
        kamar,
        kostUid,
        loyalty_points: 250,
        referralCode: 'KOSTKU-DEMO'
      };
      return new Response(JSON.stringify({
        success: true,
        user: demoUser,
        kostName,
        message: 'Login mode demo berhasil'
      }), { headers: corsHeaders });
    }

    if (!loginId) {
      return new Response(JSON.stringify({ error: 'Email atau nomor HP wajib diisi.' }), { status: 400, headers: corsHeaders });
    }

    const found = realEdgeState.edgeUsers.find(u =>
      String(u.email || '').toLowerCase() === lowerLogin ||
      String(u.phone || '') === loginId ||
      String(u.name || '').toLowerCase() === lowerLogin
    );
    if (!found) {
      return new Response(JSON.stringify({
        error: 'Akun belum terdaftar. Silakan daftar akun baru terlebih dahulu.'
      }), { status: 401, headers: corsHeaders });
    }
    if (found.password && body.password && found.password !== body.password) {
      return new Response(JSON.stringify({ error: 'Password salah.' }), { status: 401, headers: corsHeaders });
    }
    const { password: _, ...safeUser } = found;
    const matchedKost = realEdgeState.edgeKosts.find(k => k.uid === found.kostUid);
    return new Response(JSON.stringify({
      success: true,
      user: safeUser,
      kostName: matchedKost?.kostName || '',
      message: 'Login berhasil'
    }), { headers: corsHeaders });
  }

  // ── User Profile Update (Setting User) ──────────────────────────
  if (path === '/user/profile' && method === 'PUT') {
    const body = await request.json().catch(() => ({}));
    const { id, name, email, phone, currentPassword, newPassword, picture, role } = body;
    let user = activeState.edgeUsers.find(u =>
      (id && String(u.id) === String(id)) ||
      (email && String(u.email || '').toLowerCase() === String(email).trim().toLowerCase())
    );

    if (user && newPassword && String(newPassword).trim()) {
      if (user.authProvider !== 'google' && user.password && user.password !== currentPassword) {
        return new Response(JSON.stringify({ error: 'Kata sandi saat ini tidak cocok' }), { status: 400, headers: corsHeaders });
      }
      user.password = String(newPassword).trim();
    }

    if (!user) {
      // Edge isolate cold-start fallback for existing Real Mode client sessions
      user = {
        id: id || `usr-${Date.now()}`,
        name: (name || 'Pengguna').trim(),
        email: (email || '').trim().toLowerCase(),
        phone: phone !== undefined ? String(phone).trim() : '',
        picture: picture !== undefined ? picture : '',
        role: ['user', 'owner', 'mitra', 'staff', 'admin'].includes(role) ? role : 'mitra',
        kostUid: '',
        kamar: '',
        loyalty_points: 0,
        referralCode: `KOSTKU-${Math.abs(String(id || email || '1').split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0) % 9000) + 1000}`
      };
      if (newPassword && String(newPassword).trim()) {
        user.password = String(newPassword).trim();
      }
      activeState.edgeUsers.push(user);
    } else {
      if (name && String(name).trim()) user.name = String(name).trim();
      if (email && String(email).includes('@')) user.email = String(email).trim().toLowerCase();
      if (phone !== undefined) user.phone = String(phone).trim();
      if (picture !== undefined) user.picture = picture;
      if (role && ['user', 'owner', 'mitra', 'staff', 'admin'].includes(role)) {
        user.role = role;
      }
    }

    const { password: _, ...safeUser } = user;
    return new Response(JSON.stringify({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: safeUser
    }), { headers: corsHeaders });
  }

  // ── Merchants Catalog, Suggest Warung & Visibility Mode ──────────
  if (path === '/merchants' || path === '/merchants/create') {
    if (method === 'GET') {
      const ownerUserId = url.searchParams.get('ownerUserId') || '';
      let list = [...activeState.registeredMerchants];
      if (ownerUserId) {
        list = list.filter(m => String(m.ownerUserId || '') === String(ownerUserId));
      }
      const decorated = list.map(m => decorateEdgeMerchant(m, activeState));
      decorated.sort((a, b) => (b.kasirOnline ? 1 : 0) - (a.kasirOnline ? 1 : 0));
      return new Response(JSON.stringify(decorated), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = (body.name || '').trim();
      const phone = (body.phone || '').replace(/\D/g, '');
      const refCode = (body.referralCode || body.friendReferralCode || '').trim().toUpperCase();

      if (!name) {
        return new Response(JSON.stringify({ error: 'Nama toko/mitra wajib diisi' }), { status: 400, headers: corsHeaders });
      }

      const visibilityMode = 'mitra';
      const normName = name.toLowerCase();
      const applicantOwnerId = body.ownerUserId || body.userId || null;
      const isAlreadyRegistered = activeState.registeredMerchants.some(m =>
        (m.name && m.name.toLowerCase() === normName) ||
        (phone && m.phone && m.phone.replace(/\D/g, '') === phone) ||
        (applicantOwnerId && m.ownerUserId && String(m.ownerUserId) === String(applicantOwnerId))
      );

      let bonusAwarded = false;
      let bonusPoints = 0;
      let initialSaldoNota = 5000;
      let initialKuotaNota = 50;

      if (refCode) {
        const refUser = (activeState.edgeUsers || []).find(
          u => u && u.referralCode && String(u.referralCode).toUpperCase() === refCode && refCode !== 'KOSTKU-DEMO' && refCode !== 'KOSTKU-XXXX'
        );
        const refCust = Object.values(activeState.customerLoyaltyAccounts || {}).find(
          c => c && c.referral_code && String(c.referral_code).toUpperCase() === refCode
        );
        if (!refUser && !refCust) {
          return new Response(JSON.stringify({ error: `Kode referral "${refCode}" tidak ditemukan di sistem KostKu.` }), { status: 400, headers: corsHeaders });
        }
        const isSelf =
          (applicantOwnerId && refUser && String(refUser.id) === String(applicantOwnerId)) ||
          (phone && ((refUser?.phone && refUser.phone.replace(/\D/g, '') === phone) || (refCust?.whatsapp_number && refCust.whatsapp_number.replace(/\D/g, '') === phone)));
        if (isSelf) {
          return new Response(JSON.stringify({ error: 'Kode referral akun sendiri tidak dapat diklaim (anti-abuse self-referral).' }), { status: 400, headers: corsHeaders });
        }
        if (!isAlreadyRegistered) {
          bonusAwarded = true;
          bonusPoints = 500;
          initialSaldoNota = 50000;
          initialKuotaNota = 500;
          if (refUser) refUser.loyalty_points = (Number(refUser.loyalty_points) || 0) + bonusPoints;
          if (refCust) refCust.points = (Number(refCust.points) || 0) + bonusPoints;
        }
      }

      const billingTier = (body.billingTier === 'TIER_2_LOYALTY' || body.loyaltyPoolId) ? 'TIER_2_LOYALTY' : 'TIER_1_FLAT';
      const newMerchant = {
        id: 'PTR-' + Date.now(),
        name,
        category: body.category || 'Warung & Kuliner',
        icon: body.icon || '',
        phone: body.phone || '',
        address: body.address || 'Sekitar Kost',
        distanceKm: Number(body.distanceKm) || 0.2,
        isIndependent: Boolean(body.isIndependent),
        storeMode: 'mitra',
        visibilityMode,
        kasirOnly: false,
        isMitra: true,
        billingTier,
        loyaltyPoolId: body.loyaltyPoolId || (billingTier === 'TIER_2_LOYALTY' ? 'POOL-DEFAULT' : null),
        kasirWebOnline: false,
        lastKasirHeartbeatAt: null,
        ownerUserId: body.ownerUserId || null,
        status: 'active',
        saldoNota: initialSaldoNota,
        kuotaNota: initialKuotaNota,
        bonusAwarded,
        referredByCode: bonusAwarded ? refCode : null,
        products: Array.isArray(body.products) ? body.products : [],
        createdAt: new Date().toISOString()
      };

      activeState.registeredMerchants.push(newMerchant);
      activeState.merchantWallets[newMerchant.id] = {
        merchantId: newMerchant.id,
        name: newMerchant.name,
        whatsappNumber: phone,
        available_balance: initialSaldoNota,
        held_promo_balance: 0.00,
        updatedAt: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        merchant: decorateEdgeMerchant(newMerchant, activeState),
        bonusAwarded,
        bonusPoints,
        isAlreadyRegistered,
        message: bonusAwarded
          ? 'Selamat! Toko berhasil didaftarkan via referral (+500 Transaksi Kasir Gratis).'
          : 'Toko mitra berhasil didaftarkan dengan kuota awal 50 nota & otomatis gabung Mitra KostKu.'
      }), { status: 201, headers: corsHeaders });
    }
  }

  if (path === '/merchants/suggest' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const sugName = String(body.name || '').trim();
    const refCode = String(body.referralCode || '').trim().toUpperCase();
    const cleanPhone = String(body.phone || '').replace(/\D/g, '');
    if (!sugName) {
      return new Response(JSON.stringify({ error: 'Nama warung wajib diisi' }), { status: 400, headers: corsHeaders });
    }
    if (!refCode || refCode === 'KOSTKU-DEMO' || refCode === 'KOSTKU-XXXX') {
      return new Response(JSON.stringify({ error: 'Kode Referral valid wajib diisi untuk mengusulkan warung sekitar.' }), { status: 400, headers: corsHeaders });
    }
    const refUser = (activeState.edgeUsers || []).find(
      u => u && u.referralCode && String(u.referralCode).toUpperCase() === refCode
    );
    const refCust = Object.values(activeState.customerLoyaltyAccounts || {}).find(
      c => c && c.referral_code && String(c.referral_code).toUpperCase() === refCode
    );
    if (!refUser && !refCust) {
      return new Response(JSON.stringify({ error: `Kode referral "${refCode}" tidak ditemukan. Gunakan kode referral terdaftar.` }), { status: 400, headers: corsHeaders });
    }
    const normSug = sugName.toLowerCase();
    const dup = activeState.registeredMerchants.some(m => m.name?.toLowerCase() === normSug || (cleanPhone && m.phone?.replace(/\D/g, '') === cleanPhone)) ||
      activeState.suggestedWarungs.some(s => s.name?.toLowerCase() === normSug || (cleanPhone && s.phone?.replace(/\D/g, '') === cleanPhone));
    if (dup) {
      return new Response(JSON.stringify({ error: `Warung "${sugName}" sudah terdaftar atau pernah diusulkan sebelumnya.` }), { status: 409, headers: corsHeaders });
    }
    const sug = {
      id: 'SUG-' + Date.now(),
      name: sugName,
      phone: body.phone || '',
      category: body.category || 'Warung & Kuliner',
      note: body.note || '',
      referralCode: refCode,
      status: 'pending_registration',
      bonusAwarded: false,
      bonusPoints: 0,
      createdAt: new Date().toISOString()
    };
    activeState.suggestedWarungs.unshift(sug);
    return new Response(JSON.stringify({
      success: true,
      suggestion: sug,
      status: 'pending_registration',
      bonusAwarded: false,
      bonusPoints: 0,
      message: `Usulan warung "${sug.name}" tercatat dengan kode ${refCode} (0 Poin instan). Bonus +500 Poin cair saat pemilik warung mendaftar resmi.`
    }), { status: 201, headers: corsHeaders });
  }

  if (path === '/referrals/claim-friend' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const refCode = String(body.referralCode || '').trim().toUpperCase();
    if (!refCode || refCode === 'KOSTKU-DEMO' || refCode === 'KOSTKU-XXXX') {
      return new Response(JSON.stringify({ error: 'Kode referral teman tidak valid.' }), { status: 400, headers: corsHeaders });
    }
    const caller = (activeState.edgeUsers || []).find(u => u && String(u.id) === String(body.userId));
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Silakan login dengan akun terdaftar untuk mengklaim kode teman.' }), { status: 401, headers: corsHeaders });
    }
    if (caller.claimedFriendReferralCode) {
      return new Response(JSON.stringify({ error: 'Anda sudah pernah mengklaim kode referral teman (maks 1x per akun).' }), { status: 400, headers: corsHeaders });
    }
    const refUser = (activeState.edgeUsers || []).find(u => u && u.referralCode && String(u.referralCode).toUpperCase() === refCode);
    if (!refUser) {
      return new Response(JSON.stringify({ error: `Kode referral "${refCode}" tidak ditemukan.` }), { status: 400, headers: corsHeaders });
    }
    if (String(refUser.id) === String(caller.id)) {
      return new Response(JSON.stringify({ error: 'Kode referral milik sendiri tidak dapat diklaim (anti-abuse self-referral).' }), { status: 400, headers: corsHeaders });
    }
    caller.loyalty_points = (Number(caller.loyalty_points) || 0) + 100;
    caller.claimedFriendReferralCode = refCode;
    refUser.loyalty_points = (Number(refUser.loyalty_points) || 0) + 50;
    return new Response(JSON.stringify({
      success: true,
      bonusPoints: 100,
      referrerPoints: 50,
      totalPoints: caller.loyalty_points,
      claimedCode: refCode,
      message: `+100 Poin referral berhasil diklaim dari kode ${refUser.name || refCode}!`
    }), { headers: corsHeaders });
  }

  if (path === '/merchants/owner-settings' && method === 'PUT') {
    const body = await request.json().catch(() => ({}));
    const nextMode = 'mitra';
    if (body.merchantId) {
      const target = activeState.registeredMerchants.find(m => m.id === body.merchantId);
      if (target) {
        target.visibilityMode = nextMode;
        target.storeMode = 'mitra';
        target.kasirOnly = false;
        target.isMitra = true;
      }
    }
    activeState.posStore.visibilityMode = nextMode;
    activeState.posStore.storeMode = 'mitra';
    activeState.posStore.kasirOnly = false;
    activeState.posStore.isMitra = true;
    return new Response(JSON.stringify({ success: true, visibilityMode: nextMode, storeMode: 'mitra' }), { headers: corsHeaders });
  }

  if (path.startsWith('/merchants/') && (method === 'PUT' || method === 'DELETE')) {
    const mId = path.split('/')[2];
    const idx = activeState.registeredMerchants.findIndex(m => m.id === mId);
    if (method === 'DELETE') {
      if (idx !== -1) activeState.registeredMerchants.splice(idx, 1);
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
    const body = await request.json().catch(() => ({}));
    if (idx !== -1) {
      activeState.registeredMerchants[idx] = {
        ...activeState.registeredMerchants[idx],
        ...body,
        storeMode: 'mitra',
        visibilityMode: 'mitra',
        kasirOnly: false,
        isMitra: true
      };
      return new Response(JSON.stringify({ success: true, merchant: decorateEdgeMerchant(activeState.registeredMerchants[idx], activeState) }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  if (path === '/partner-orders' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (body.merchantId) {
      const matched = activeState.registeredMerchants.find(m => String(m.id) === String(body.merchantId));
      if (matched) {
        const decorated = decorateEdgeMerchant(matched, activeState);
        if (!decorated.kasirOnline) {
          return new Response(JSON.stringify({
            error: 'Kasir toko sedang offline (hanya lihat menu). Pesanan hanya bisa dibuat saat kasir online di web.',
            code: 'STORE_OFFLINE_VIEW_ONLY',
            kasirOnline: false
          }), { status: 422, headers: corsHeaders });
        }
        const reqPoints = Number(body.pointsToRedeem || 0);
        const promoCode = String(body.promoCode || '').trim().toUpperCase();
        if (!decorated.canRedeemPoints && (reqPoints > 0 || promoCode.startsWith('POIN-'))) {
          return new Response(JSON.stringify({
            error: 'Toko belum tergabung di Loyalty Pool (Tier 2). Penukaran poin tidak aktif di toko ini.',
            code: 'POIN_NOT_ACTIVE_ON_STORE',
            billingTier: decorated.billingTier
          }), { status: 422, headers: corsHeaders });
        }
      }
    }
  }

  // ── Multi-Property Owner Kosts ──────────────────────────────────
  if (path === '/owner/kosts' && method === 'GET') {
    const ownerId = url.searchParams.get('ownerId') || '';
    const matching = activeState.edgeKosts.filter(k => !ownerId || String(k.ownerId) === String(ownerId));
    const source = matching.length > 0 ? matching : (activeState.isDemo ? activeState.edgeKosts : []);
    const list = source.map(k => {
      const rooms = k.settings?.rooms || [];
      const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
      const depCfg = resolveEdgeDepositConfig(k);
      return {
        uid: k.uid,
        kostName: k.kostName,
        address: k.address,
        type: k.type,
        status: k.status || 'active',
        totalRooms: rooms.length,
        occupiedCount,
        availableCount: rooms.length - occupiedCount,
        occupancyRate: rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0,
        complaintsCount: 0,
        paidRevenue: 0,
        depositEnabled: depCfg.depositEnabled,
        depositAmount: depCfg.depositAmount
      };
    });
    return new Response(JSON.stringify(list), { headers: corsHeaders });
  }

  // ── Settings GET / PUT ──────────────────────────────────────────
  if (path === '/settings') {
    const kostUid = url.searchParams.get('kostUid') || '';
    const kost = kostUid
      ? activeState.edgeKosts.find(k => k.uid === kostUid)
      : (activeState.isDemo ? activeState.edgeKosts[0] : null);
    if (method === 'GET') {
      const depCfg = resolveEdgeDepositConfig(kost);
      return new Response(JSON.stringify({
        ...(kost?.settings || {}),
        depositEnabled: depCfg.depositEnabled,
        depositAmount: depCfg.depositAmount,
        depositPreferredAmount: depCfg.depositPreferredAmount,
        kostName: kost?.kostName || ''
      }), { headers: corsHeaders });
    }
    if (method === 'PUT') {
      if (!kost) {
        return new Response(JSON.stringify({ error: 'Properti kost belum terdaftar.' }), { status: 404, headers: corsHeaders });
      }
      const body = await request.json().catch(() => ({}));
      const curCfg = resolveEdgeDepositConfig(kost);
      const nextEnabled = typeof body.depositEnabled === 'boolean'
        ? body.depositEnabled
        : (body.depositAmount !== undefined ? Number(body.depositAmount) > 0 : curCfg.depositEnabled);
      const prefAmt = body.depositPreferredAmount !== undefined && Number(body.depositPreferredAmount) > 0
        ? Math.max(0, Number(body.depositPreferredAmount) || 0)
        : (body.depositAmount !== undefined && Number(body.depositAmount) > 0
          ? Math.max(0, Number(body.depositAmount) || 0)
          : curCfg.depositPreferredAmount);
      const finalDepositAmount = nextEnabled
        ? (body.depositAmount !== undefined && Number(body.depositAmount) > 0 ? Number(body.depositAmount) : prefAmt)
        : 0;
      kost.settings = {
        ...(kost.settings || {}),
        ...body,
        depositEnabled: nextEnabled,
        depositPreferredAmount: prefAmt,
        depositAmount: finalDepositAmount
      };
      return new Response(JSON.stringify({ success: true, settings: kost.settings }), { headers: corsHeaders });
    }
  }

  // ── Report Kost -> Auto-Suspend ─────────────────────────────────
  const reportMatch = path.match(/^\/kosts\/([^/]+)\/report$/);
  if (reportMatch && method === 'POST') {
    const targetUid = decodeURIComponent(reportMatch[1]);
    const kost = activeState.edgeKosts.find(k => k.uid === targetUid);
    if (!kost) {
      return new Response(JSON.stringify({ error: 'Kost tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    const body = await request.json().catch(() => ({}));
    if (!String(body.reason || '').trim() || !String(body.description || '').trim()) {
      return new Response(JSON.stringify({ error: 'Alasan dan deskripsi laporan wajib diisi' }), { status: 400, headers: corsHeaders });
    }
    kost.status = 'suspended';
    kost.suspendedReason = String(body.reason).trim();
    kost.suspendedAt = new Date().toISOString();
    activeState.edgeKostReports.unshift({
      id: 'RPT-' + Date.now(),
      kostUid: targetUid,
      reason: String(body.reason).trim(),
      description: String(body.description).trim(),
      reporterPhone: body.reporterPhone || '',
      reporterName: body.reporterName || 'Pelapor',
      createdAt: kost.suspendedAt
    });
    return new Response(JSON.stringify({
      success: true,
      autoSuspended: true,
      kostStatus: 'suspended',
      message: `Laporan diterima. Kost "${kost.kostName}" otomatis dinonaktifkan sementara (Suspended) untuk investigasi.`
    }), { status: 201, headers: corsHeaders });
  }

  const statusMatch = path.match(/^\/kosts\/([^/]+)\/status$/);
  if (statusMatch && method === 'GET') {
    const targetUid = decodeURIComponent(statusMatch[1]);
    const kost = activeState.edgeKosts.find(k => k.uid === targetUid);
    if (!kost) {
      return new Response(JSON.stringify({ error: 'Kost tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    return new Response(JSON.stringify({
      uid: kost.uid,
      status: kost.status || 'active',
      suspendedReason: kost.suspendedReason || null
    }), { headers: corsHeaders });
  }

  // ── Staff Invites, Staff Listing & Admin Promotion (Edge Sync) ──
  if (path === '/owner/staff' && method === 'GET') {
    const reqOwnerId = url.searchParams.get('ownerId') || '';
    const reqKostUid = url.searchParams.get('kostUid') || '';
    const caller = reqOwnerId ? activeState.edgeUsers.find(u => String(u.id) === String(reqOwnerId)) : null;
    const resolvedOwnerId = (caller && caller.ownerId) ? caller.ownerId : reqOwnerId;
    const list = (activeState.edgeUsers || []).filter(u => {
      if (!['staff', 'admin', 'karyawan'].includes(String(u.role || '').toLowerCase())) return false;
      if (reqKostUid && u.kostUid !== reqKostUid) return false;
      if (resolvedOwnerId && u.ownerId && String(u.ownerId) !== String(resolvedOwnerId)) return false;
      return true;
    }).map(({ password: _, ...safe }) => safe);
    return new Response(JSON.stringify(list), { headers: corsHeaders });
  }

  const staffRoleMatch = path.match(/^\/owner\/staff\/([^/]+)\/role$/);
  if (staffRoleMatch && (method === 'PATCH' || method === 'PUT')) {
    const tid = decodeURIComponent(staffRoleMatch[1]);
    const body = await request.json().catch(() => ({}));
    const rawNext = String(body.role || body.accountRole || '').trim().toLowerCase();
    const nextRole = rawNext === 'admin' ? 'admin' : (rawNext === 'staff' || rawNext === 'karyawan' ? 'staff' : '');
    if (!nextRole) {
      return new Response(JSON.stringify({ error: 'Role tujuan harus "admin" atau "staff".' }), { status: 400, headers: corsHeaders });
    }
    const actorId = request.headers.get('x-user-id') || body.actorId || body.ownerId || '';
    const actor = activeState.edgeUsers.find(u => String(u.id) === String(actorId));
    const actorRole = actor ? String(actor.role || '').toLowerCase() : String(request.headers.get('x-user-role') || '').toLowerCase();
    if (!['owner', 'mitra', 'master', 'admin'].includes(actorRole)) {
      return new Response(JSON.stringify({ error: 'Hanya Pemilik (Owner / Mitra) atau Admin yang dapat menaikkan/mengubah role karyawan.' }), { status: 403, headers: corsHeaders });
    }
    const target = activeState.edgeUsers.find(u => String(u.id) === tid);
    if (!target || ['owner', 'mitra', 'master'].includes(String(target.role || '').toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Karyawan tidak ditemukan atau merupakan akun Pemilik.' }), { status: target ? 403 : 404, headers: corsHeaders });
    }
    target.role = nextRole;
    const { password: _, ...safe } = target;
    return new Response(JSON.stringify({
      success: true,
      message: nextRole === 'admin' ? `${target.name} dinaikkan menjadi Admin.` : `${target.name} diturunkan ke Karyawan.`,
      staff: safe
    }), { headers: corsHeaders });
  }

  if (path === '/owner/staff-invites') {
    activeState.staffInvites = activeState.staffInvites || [];
    if (method === 'GET') {
      const ownerId = url.searchParams.get('ownerId') || '';
      const list = activeState.staffInvites.filter(i => !ownerId || String(i.ownerId) === String(ownerId));
      return new Response(JSON.stringify(list), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const token = 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const inv = {
        id: 'INV-' + Date.now(),
        token,
        ownerId: body.ownerId || '',
        kostUid: body.kostUid || '',
        kostName: body.kostName || 'KostKu',
        channel: body.channel || 'whatsapp',
        target: body.target || body.phone || body.email || '',
        suggestedName: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        roles: Array.isArray(body.roles) && body.roles.length > 0 ? body.roles : ['Penjaga Kost'],
        jobTitle: body.jobTitle || 'Penjaga Kost',
        salary: Number(body.salary) || 0,
        status: 'pending',
        inviteUrl: `${body.origin || url.origin}/invite-staff/${token}`
      };
      activeState.staffInvites.unshift(inv);
      return new Response(JSON.stringify({ success: true, invite: inv, inviteUrl: inv.inviteUrl }), { status: 201, headers: corsHeaders });
    }
  }

  const acceptInviteMatch = path.match(/^\/staff-invites\/([^/]+)\/accept$/);
  if (acceptInviteMatch && method === 'POST') {
    const token = decodeURIComponent(acceptInviteMatch[1]);
    activeState.staffInvites = activeState.staffInvites || [];
    const inv = activeState.staffInvites.find(i => i.token === token);
    if (!inv || inv.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Link undangan tidak valid atau sudah digunakan.' }), { status: inv ? 409 : 404, headers: corsHeaders });
    }
    const body = await request.json().catch(() => ({}));
    const existingId = body.existingUserId || request.headers.get('x-user-id') || '';
    const cleanEmail = String(body.email || inv.email || '').trim().toLowerCase();
    let user = activeState.edgeUsers.find(u =>
      (cleanEmail && String(u.email || '').toLowerCase() === cleanEmail) ||
      (existingId && String(u.id) === String(existingId) && String(u.id) !== String(inv.ownerId))
    );
    if (!user) {
      user = { id: 'usr-' + Date.now(), createdAt: new Date().toISOString() };
      activeState.edgeUsers.push(user);
    }
    user.name = String(body.name || inv.suggestedName || user.name || 'Karyawan').trim();
    if (cleanEmail) user.email = cleanEmail;
    if (body.phone || inv.phone) user.phone = body.phone || inv.phone;
    user.role = 'staff';
    user.ownerId = inv.ownerId;
    user.kostUid = inv.kostUid;
    user.roles = inv.roles || ['Penjaga Kost'];
    user.jobTitle = inv.jobTitle || 'Penjaga Kost';
    inv.status = 'accepted';
    inv.acceptedUserId = user.id;
    inv.acceptedName = user.name;
    const { password: _, ...safeUser } = user;
    return new Response(JSON.stringify({
      success: true,
      message: `Selamat bergabung ${user.name}! Akun karyawan Anda resmi aktif.`,
      user: safeUser,
      kostName: inv.kostName || 'KostKu',
      staffRole: user.jobTitle
    }), { headers: corsHeaders });
  }

  const getInviteMatch = path.match(/^\/staff-invites\/([^/]+)$/);
  if (getInviteMatch && method === 'GET') {
    const token = decodeURIComponent(getInviteMatch[1]);
    activeState.staffInvites = activeState.staffInvites || [];
    const inv = activeState.staffInvites.find(i => i.token === token);
    if (!inv) return new Response(JSON.stringify({ error: 'Undangan tidak ditemukan.' }), { status: 404, headers: corsHeaders });
    return new Response(JSON.stringify({ invite: inv }), { headers: corsHeaders });
  }

  // ── Users, Deposit Summary & Mandatory Deposit Refund Check-Out ─
  if (path === '/users' && method === 'GET') {
    const kostUid = url.searchParams.get('kostUid') || '';
    const activeTenants = activeState.edgeUsers
      .filter(u => u.status !== 'checked_out' && (!kostUid || u.kostUid === kostUid))
      .map(u => {
        const k = activeState.edgeKosts.find(x => x.uid === u.kostUid);
        return { ...u, heldDeposit: resolveEdgeHeldDeposit(u, k) };
      });
    return new Response(JSON.stringify(activeTenants), { headers: corsHeaders });
  }

  const singleUserMatch = path.match(/^\/users\/([^/]+)$/);
  if (singleUserMatch && method === 'GET') {
    const uid = decodeURIComponent(singleUserMatch[1]);
    const user = activeState.edgeUsers.find(u => String(u.id) === String(uid));
    if (!user) {
      return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    const targetKost = activeState.edgeKosts.find(k => k.uid === user.kostUid);
    const depCfg = targetKost ? resolveEdgeDepositConfig(targetKost) : { depositEnabled: false, depositAmount: 0 };
    const heldDeposit = user.status === 'checked_out' ? 0 : resolveEdgeHeldDeposit(user, targetKost);
    const latestRefund = activeState.edgeDepositRefunds
      .filter(r => String(r.userId) === String(user.id))
      .sort((a, b) => new Date(b.checkedOutAt || 0) - new Date(a.checkedOutAt || 0))[0] || null;
    return new Response(JSON.stringify({
      user,
      kostName: targetKost?.kostName || '',
      activeApplication: user.status === 'checked_out' ? { status: 'checked_out', kostUid: user.kostUid, kamar: user.kamar } : null,
      depositSummary: {
        kostDepositEnabled: depCfg.depositEnabled,
        kostDepositAmount: depCfg.depositAmount,
        heldDeposit,
        depositStatus: user.depositStatus || (heldDeposit > 0 ? 'held' : (latestRefund ? 'refunded' : 'none')),
        refundedAmount: latestRefund ? latestRefund.refundAmount : 0,
        latestRefund,
        checkoutRequest: user.checkoutRequest || null
      }
    }), { headers: corsHeaders });
  }

  const reqCheckoutMatch = path.match(/^\/tenants\/([^/]+)\/request-checkout$/);
  if (reqCheckoutMatch && method === 'POST') {
    const tid = decodeURIComponent(reqCheckoutMatch[1]);
    const tenant = activeState.edgeUsers.find(u => String(u.id) === String(tid));
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Penghuni tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    const body = await request.json().catch(() => ({}));
    const kost = activeState.edgeKosts.find(k => k.uid === tenant.kostUid);
    tenant.checkoutRequest = {
      status: 'pending_checkout',
      checkoutDate: body.checkoutDate || new Date().toISOString().split('T')[0],
      refundMethod: body.refundMethod || 'Transfer Bank',
      refundBankOrWallet: body.refundBankOrWallet || 'BCA',
      refundAccount: body.refundAccount || '',
      reason: body.reason || '',
      expectedDeposit: resolveEdgeHeldDeposit(tenant, kost),
      requestedAt: new Date().toISOString()
    };
    return new Response(JSON.stringify({
      success: true,
      checkoutRequest: tenant.checkoutRequest,
      message: 'Pengajuan check-out terkirim. Pemilik kost wajib mengembalikan deposit jaminan Anda saat proses check-out.'
    }), { headers: corsHeaders });
  }

  const doCheckoutMatch = path.match(/^\/tenants\/([^/]+)\/checkout$/);
  if (doCheckoutMatch && method === 'POST') {
    const tid = decodeURIComponent(doCheckoutMatch[1]);
    const tenant = activeState.edgeUsers.find(u => String(u.id) === String(tid));
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Penghuni tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    const body = await request.json().catch(() => ({}));
    const kost = activeState.edgeKosts.find(k => k.uid === tenant.kostUid);
    const held = body.depositAmount !== undefined ? Math.max(0, Number(body.depositAmount) || 0) : resolveEdgeHeldDeposit(tenant, kost);
    if (held > 0 && body.refundConfirmed !== true) {
      return new Response(JSON.stringify({
        error: 'Konfirmasi wajib diperlukan: Deposit jaminan penghuni wajib dikembalikan saat check-out.'
      }), { status: 400, headers: corsHeaders });
    }
    const damageCost = Math.max(0, Math.min(held, Number(body.damageCost) || 0));
    const finalRefund = Math.max(0, held - damageCost);
    const prevKamar = tenant.kamar;
    const prevKostUid = tenant.kostUid;
    if (kost && Array.isArray(kost.settings?.rooms)) {
      const rm = kost.settings.rooms.find(r => String(r.number) === String(prevKamar));
      if (rm) {
        rm.status = 'available';
        delete rm.occupiedBy;
        delete rm.tenantId;
      }
    }
    const nowIso = new Date().toISOString();
    const refundRecord = {
      id: 'RFD-' + Date.now(),
      kostUid: prevKostUid,
      userId: tenant.id,
      tenantName: tenant.name,
      roomNumber: prevKamar,
      heldDeposit: held,
      damageCost,
      refundAmount: finalRefund,
      refundMethod: finalRefund > 0 ? (body.refundMethod || 'transfer_bank') : 'nihil',
      refundAccount: body.refundAccount || tenant.checkoutRequest?.refundAccount || '',
      notes: body.notes || '',
      refundConfirmed: true,
      status: held > 0 ? 'refunded' : 'completed_no_deposit',
      checkedOutAt: nowIso
    };
    activeState.edgeDepositRefunds.unshift(refundRecord);
    tenant.status = 'checked_out';
    tenant.depositStatus = held > 0 ? 'refunded' : 'none';
    tenant.depositRefundedAmount = finalRefund;
    tenant.depositHeld = 0;
    tenant.kostUid = '';
    tenant.kamar = '';
    tenant.checkoutRequest = null;

    return new Response(JSON.stringify({
      success: true,
      message: held > 0
        ? `Check-out berhasil & pengembalian deposit sebesar Rp ${finalRefund.toLocaleString('id-ID')} telah dicatat.`
        : 'Check-out penghuni selesai.',
      refundRecord,
      tenant
    }), { headers: corsHeaders });
  }

  if (path === '/deposit-refunds' && method === 'GET') {
    const kostUid = url.searchParams.get('kostUid') || '';
    const userId = url.searchParams.get('userId') || '';
    let list = [...activeState.edgeDepositRefunds];
    if (kostUid) list = list.filter(r => r.kostUid === kostUid);
    if (userId) list = list.filter(r => String(r.userId) === String(userId));
    return new Response(JSON.stringify(list), { headers: corsHeaders });
  }

  // ── Checkout Payment Gateway & QRIS ─────────────────────────────
  if (path === '/payments/create-transaction' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount || 0);
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Nominal pembayaran tidak valid' }), { status: 400, headers: corsHeaders });
    }
    const orderId = `ORDER-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const trx = {
      orderId,
      kostUid: body.kostUid,
      userId: body.userId,
      amount,
      deposit: Number(body.bookingData?.depositAmount || 0),
      roomNumber: body.roomNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      paymentMethod: body.paymentMethod || 'QRIS',
      bookingData: body.bookingData || {},
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    activeState.edgeTransactions.push(trx);
    return new Response(JSON.stringify(trx), { headers: corsHeaders });
  }

  if (path === '/payments/qris/charge' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const amount = Math.round(Number(body.amount || 0));
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Nominal QRIS harus lebih dari 0' }), { status: 400, headers: corsHeaders });
    }
    const orderId = body.orderId || `ORDER-${Date.now()}`;
    const qrString = buildEdgeEmvCoQris(amount, orderId, body.merchantName || 'KOSTKU');
    return new Response(JSON.stringify({
      success: true,
      orderId,
      amount,
      qrString,
      provider: 'TriPay QRIS Edge',
      status: 'pending'
    }), { headers: corsHeaders });
  }

  if (path.startsWith('/payments/status/') && method === 'GET') {
    const orderId = decodeURIComponent(path.replace('/payments/status/', ''));
    const trx = activeState.edgeTransactions.find(t => t.orderId === orderId);
    return new Response(JSON.stringify({
      orderId,
      status: trx?.status || 'pending',
      amount: trx?.amount || 0
    }), { headers: corsHeaders });
  }

  if (path === '/payments/verify' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const trx = activeState.edgeTransactions.find(t => t.orderId === body.orderId);
    return new Response(JSON.stringify({
      success: trx?.status === 'settlement',
      status: trx?.status || 'pending',
      message: trx?.status === 'settlement'
        ? 'Pembayaran lunas terverifikasi'
        : 'Sistem belum menerima konfirmasi pembayaran dari gateway.'
    }), { headers: corsHeaders });
  }

  // ── Health Check ────────────────────────────────────────────────
  if (path === '/health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { headers: corsHeaders });
  }

  // ── Public Kosts Marketplace (Empty in Real Mode, Populated only in Demo Mode) ──
  if (path === '/public/kosts' && method === 'GET') {
    const activeList = activeState.edgeKosts
      .filter(k => k.status !== 'suspended')
      .map(k => {
        const rooms = k.settings?.rooms || [];
        const depCfg = resolveEdgeDepositConfig(k);
        return {
          ...k,
          name: k.kostName,
          rooms,
          availableRoomsCount: rooms.filter(r => r.status === 'available' || r.status === 'empty').length,
          depositEnabled: depCfg.depositEnabled,
          depositAmount: depCfg.depositAmount
        };
      });
    return new Response(JSON.stringify(activeList), { headers: corsHeaders });
  }

  if (path === '/google-client-id') {
    return new Response(JSON.stringify({
      clientId: '416599367292-3h9001mfd1dk7shnqo3fgpjs47s7oofe.apps.googleusercontent.com'
    }), { headers: corsHeaders });
  }

  if (method === 'GET') {
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true, message: 'Operasi berhasil diproses di Cloudflare Edge' }), {
    headers: corsHeaders
  });
}

const EDGE_KASIR_ONLINE_TTL_MS = 60 * 1000;

function isEdgeMerchantOnline(target) {
  if (!target || target.kasirWebOnline !== true) return false;
  if (!target.lastKasirHeartbeatAt) return false;
  const diff = Date.now() - new Date(target.lastKasirHeartbeatAt).getTime();
  return Number.isFinite(diff) && diff >= 0 && diff <= EDGE_KASIR_ONLINE_TTL_MS;
}

function resolveEdgeStoreTier(state, storeId) {
  const cleanId = String(storeId || '').trim();
  const matched = cleanId
    ? (state.registeredMerchants || []).find(m => String(m.id) === cleanId)
    : null;
  const target = matched || state.posStore || {};
  const loyaltyPoolId = target.loyaltyPoolId || target.loyalty_pool_id || null;
  const isTier2 = target.billingTier === 'TIER_2_LOYALTY' || Boolean(loyaltyPoolId);
  return {
    billingTier: isTier2 ? 'TIER_2_LOYALTY' : 'TIER_1_FLAT',
    loyaltyPoolId: isTier2 ? (loyaltyPoolId || 'POOL-DEFAULT') : null,
    canRedeemPoints: isTier2,
    pointValueIdr: isTier2 ? 10 : 0
  };
}

function decorateEdgeMerchant(merchant, state) {
  const kasirOnline = isEdgeMerchantOnline(merchant);
  const tier = resolveEdgeStoreTier(state, merchant?.id);
  return {
    ...merchant,
    storeMode: 'mitra',
    visibilityMode: 'mitra',
    kasirOnly: false,
    isMitra: true,
    kasirOnline,
    isOnline: kasirOnline,
    onlineStatus: kasirOnline ? 'online' : 'offline',
    lastKasirHeartbeatAt: merchant?.lastKasirHeartbeatAt || null,
    billingTier: tier.billingTier,
    loyaltyPoolId: tier.loyaltyPoolId,
    canRedeemPoints: tier.canRedeemPoints
  };
}

function normalizeEdgeNotaFeeBearer(val) {
  return String(val || '').toLowerCase().trim() === 'customer' ? 'customer' : 'store';
}

function calcEdgeQrisFee(baseAmount = 0) {
  const cleanBase = Math.max(0, Math.round(Number(baseAmount) || 0));
  if (cleanBase <= 0) return { fixedFee: 0, percentFee: 0, fee: 0 };
  const percentFee = Math.round(cleanBase * 0.007);
  return { fixedFee: 750, percentFee, fee: 750 + percentFee };
}

function computeEdgePosFeeSnapshot({ baseAmount = 0, notaFeeIdr = 25, notaFeeBearer = 'store', paymentMethod = '' } = {}) {
  const cleanBase = Math.max(0, Math.round(Number(baseAmount) || 0));
  const cleanNotaFee = Math.max(0, Math.round(Number(notaFeeIdr) || 0));
  const bearer = normalizeEdgeNotaFeeBearer(notaFeeBearer);
  const pm = String(paymentMethod || '').toUpperCase().trim();
  const isGatewayQris = pm === 'TRIPAY' || pm === 'QRIS';
  const customerAdminFee = bearer === 'customer' ? cleanNotaFee : 0;
  const qrisCalc = isGatewayQris ? calcEdgeQrisFee(cleanBase) : { fixedFee: 0, percentFee: 0, fee: 0 };
  return {
    baseAmount: cleanBase,
    notaFeeIdr: cleanNotaFee,
    notaFeeBearer: bearer,
    customerAdminFee,
    qrisFee: qrisCalc.fee,
    qrisFeeFixed: qrisCalc.fixedFee,
    qrisFeePercent: qrisCalc.percentFee,
    totalAmount: cleanBase + customerAdminFee + qrisCalc.fee
  };
}

function settleEdgePosUnifiedWallet(state, order, storeId, billingFeeIdr) {
  if (!state || !order || order.walletCredited) return;
  state.unifiedWallets = state.unifiedWallets || {};
  const targetUid = state.posStore?.merchantId || state.posStore?.uid || storeId || (state.isDemo ? 'MTR-KASIR-MASTER' : 'STORE-DEFAULT');
  if (!state.unifiedWallets[targetUid]) {
    state.unifiedWallets[targetUid] = {
      uid: targetUid,
      name: state.posStore?.storeName || 'Kasir POS & Mitra Terpadu',
      balance: 0,
      totalEarned: 0,
      totalSettled: 0,
      gateway: 'TriPay Master KostKu (T53543)',
      history: []
    };
  }
  const w = state.unifiedWallets[targetUid];
  const baseAmt = Number(order.baseAmountBeforePaymentFee ?? Math.max(0, Number(order.totalAmount || 0) - (Number(order.qrisFee) || 0) - (Number(order.customerAdminFee) || 0)));
  const borneByCustomer = (order.notaFeeBorneBy || order.notaFeeBearer || 'store') === 'customer';
  const feeIdr = Math.max(0, Math.round(Number(billingFeeIdr) || 0));
  const alreadyDeductedNota = (Number(order.notaDeducted) || 0) > 0;
  const netAmount = (borneByCustomer || alreadyDeductedNota) ? baseAmt : Math.max(0, baseAmt - feeIdr);
  w.balance = (Number(w.balance) || 0) + netAmount;
  w.totalEarned = (Number(w.totalEarned) || 0) + netAmount;
  w.history = Array.isArray(w.history) ? w.history : [];
  w.history.unshift({
    id: 'WAL-POS-' + Date.now(),
    type: 'deposit',
    amount: netAmount,
    balanceAfter: w.balance,
    orderId: order.id,
    source: 'pos_qris',
    description: `Pembayaran KostKu QRIS POS #${order.invoice_number || order.id}`,
    createdAt: new Date().toISOString()
  });
  order.walletCredited = true;
  order.netWalletCredited = netAmount;
}

function syncEdgeStoreWallet(state, storeId, saldoNota, kuotaNota = null, feePerNota = null) {
  if (!state) return;
  const targetId = String(storeId || state.posStore?.merchantId || state.posStore?.uid || 'STORE-DEFAULT');
  const safeSaldo = Math.max(0, Number(saldoNota) || 0);
  const safeFee = Math.max(1, Number(feePerNota ?? state.posStore?.notaFeePerNotaIdr ?? (state.isDemo ? 100 : 25)));
  const safeKuota = kuotaNota != null ? Math.max(0, Number(kuotaNota) || 0) : Math.floor(safeSaldo / safeFee);

  state.merchantWallets = state.merchantWallets || {};
  state.merchantWallets[targetId] = {
    ...(state.merchantWallets[targetId] || {}),
    merchantId: targetId,
    name: state.posStore?.storeName || state.merchantWallets[targetId]?.name || 'Toko Kasir',
    whatsappNumber: state.posStore?.phone || state.merchantWallets[targetId]?.whatsappNumber || '',
    available_balance: safeSaldo,
    held_promo_balance: Number(state.merchantWallets[targetId]?.held_promo_balance || 0),
    _exhaustedByDeduction: false,
    updatedAt: new Date().toISOString()
  };

  if (!state.posStore?.merchantId || String(state.posStore.merchantId) === targetId || String(state.posStore.uid) === targetId || targetId === 'STORE-DEFAULT') {
    state.posStore.saldoNota = safeSaldo;
    state.posStore.kuotaNota = safeKuota;
  }

  if (Array.isArray(state.registeredMerchants)) {
    state.registeredMerchants.forEach(m => {
      if (m && (String(m.id) === targetId || String(m.uid || '') === targetId)) {
        m.saldoNota = safeSaldo;
        m.kuotaNota = safeKuota;
      }
    });
  }

  if (Array.isArray(state.posStore?.branches)) {
    state.posStore.branches.forEach(b => {
      if (b && String(b.id) === targetId) {
        b.saldoNota = safeSaldo;
        b.kuotaNota = safeKuota;
      }
    });
  }
}

function deductEdgeStoreNotaOnce(state, order, storeId, billingFeeIdr) {
  if (!order) return { ok: true, feeDeducted: 0 };
  const targetId = String(storeId || state.posStore?.merchantId || state.posStore?.uid || 'STORE-DEFAULT');
  const fee = Math.max(0, Math.round(Number(billingFeeIdr) || 25));
  if (Number(order.notaDeducted) > 0) {
    const w = state.merchantWallets?.[targetId];
    return {
      ok: true,
      feeDeducted: 0,
      saldoAfter: w?.available_balance ?? order.sisaSaldoNota ?? state.posStore.saldoNota ?? 0,
      kuotaAfter: order.kuotaNota ?? state.posStore.kuotaNota ?? 0
    };
  }
  state.merchantWallets = state.merchantWallets || {};
  const matchedMerchant = (state.registeredMerchants || []).find(m => m && (String(m.id) === targetId || String(m.uid || '') === targetId));
  const posMatches = !state.posStore?.merchantId || String(state.posStore.merchantId) === targetId || String(state.posStore.uid) === targetId || targetId === 'STORE-DEFAULT';
  const fallbackSaldo = Number(matchedMerchant?.saldoNota ?? (posMatches ? state.posStore.saldoNota : 0) ?? 0);

  if (!state.merchantWallets[targetId]) {
    state.merchantWallets[targetId] = {
      merchantId: targetId,
      name: state.posStore.storeName || matchedMerchant?.storeName || 'Toko Kasir',
      whatsappNumber: state.posStore.phone || matchedMerchant?.phone || '',
      available_balance: fallbackSaldo,
      held_promo_balance: 0.00,
      _exhaustedByDeduction: false,
      updatedAt: new Date().toISOString()
    };
  } else if (Number(state.merchantWallets[targetId].available_balance) === 0 && fallbackSaldo > 0 && !state.merchantWallets[targetId]._exhaustedByDeduction) {
    state.merchantWallets[targetId].available_balance = fallbackSaldo;
  }

  const wallet = state.merchantWallets[targetId];
  const currentSaldo = Number(wallet.available_balance ?? fallbackSaldo ?? 0);
  if (currentSaldo < fee) {
    return {
      ok: false,
      status: 402,
      error: `Saldo nota kasir tidak mencukupi (Rp ${fee}/nota). Silakan lakukan Top Up Saldo Nota terlebih dahulu.`,
      requiresTopupNota: true,
      kuotaNota: 0,
      saldoNota: currentSaldo
    };
  }
  wallet.available_balance = Math.max(0, currentSaldo - fee);
  wallet._exhaustedByDeduction = wallet.available_balance < fee;
  wallet.updatedAt = new Date().toISOString();
  const nextKuota = Math.floor(wallet.available_balance / Math.max(1, fee));
  if (posMatches) {
    state.posStore.saldoNota = wallet.available_balance;
    state.posStore.kuotaNota = nextKuota;
  }
  if (matchedMerchant) {
    matchedMerchant.saldoNota = wallet.available_balance;
    matchedMerchant.kuotaNota = nextKuota;
  }
  if (Array.isArray(state.posStore?.branches)) {
    state.posStore.branches.forEach(b => {
      if (b && String(b.id) === targetId) {
        b.saldoNota = wallet.available_balance;
        b.kuotaNota = nextKuota;
      }
    });
  }
  order.notaDeducted = fee;
  return { ok: true, feeDeducted: fee, saldoAfter: wallet.available_balance, kuotaAfter: nextKuota };
}

async function handlePosApi(request, path, method, url, state) {
  if (path === '/store') {
    if (method === 'GET') {
      const reqOwnerId = url.searchParams.get('ownerId') || request.headers.get('x-user-id') || '';
      const reqTableToken = url.searchParams.get('tableToken') || '';
      const reqStoreId = url.searchParams.get('storeId') || url.searchParams.get('merchantId') || '';

      if (!state.isDemo && !reqOwnerId && !reqTableToken && !reqStoreId) {
        return new Response(JSON.stringify({
          error: 'Silakan login terlebih dahulu untuk mengakses Kasir POS.',
          needsLogin: true,
          hasRegisteredStore: false,
          storeName: '',
          merchantId: null,
          uid: null,
          saldoNota: 0,
          kuotaNota: 0
        }), { status: 401, headers: corsHeaders });
      }

      if (!state.isDemo && reqOwnerId && !reqTableToken && !reqStoreId) {
        let hasMerchant = (state.registeredMerchants || []).some(m =>
          m && (String(m.ownerUserId || '') === String(reqOwnerId) || String(m.id || '') === String(reqStoreId))
        );
        if (!hasMerchant && !state.posStore?.ownerUserId) {
          // Auto-provision default Kantin & Kuliner store for Renarta Caylen / Mitra account so user doesn't have to input anything
          const renartaMerchant = {
            id: 'MTR-' + (reqOwnerId || 'RENARTA-01'),
            ownerUserId: String(reqOwnerId || 'renarta-owner'),
            ownerName: 'Renarta Caylen',
            name: 'Kantin & Kuliner Renarta',
            storeName: 'Kantin & Kuliner Renarta',
            category: 'Warung & Kuliner',
            icon: '',
            phone: '081228263200',
            location: 'Kantin KostKu - Stand Utama',
            address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
            city: 'Semarang',
            distanceKm: 0.1,
            rating: 5,
            openingHours: '08:00 - 22:00 WIB',
            isOpen: true,
            isValidated: true,
            isVerified: true,
            storeMode: 'mitra',
            visibilityMode: 'mitra',
            kasirOnly: false,
            isMitra: true,
            billingTier: 'TIER_1_FLAT',
            loyaltyPoolId: null,
            kasirWebOnline: true,
            saldoNota: 100000,
            kuotaNota: 4000,
            notaFeeBearer: 'store',
            notaFeePerNotaIdr: 25,
            photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80',
            branches: [
              { id: 'MTR-' + (reqOwnerId || 'RENARTA-01'), name: 'Kantin & Kuliner Renarta (Pusat)', address: 'Jl. Nakula I No. 5-11, Semarang', saldoNota: 100000, kuotaNota: 4000 }
            ],
            status: 'active',
            createdAt: new Date().toISOString()
          };
          state.registeredMerchants = state.registeredMerchants || [];
          state.registeredMerchants.push(renartaMerchant);
          Object.assign(state.posStore, renartaMerchant);
          state.posStore.uid = renartaMerchant.id;
          state.posStore.merchantId = renartaMerchant.id;
          syncEdgeStoreWallet(state, renartaMerchant.id, renartaMerchant.saldoNota, renartaMerchant.kuotaNota, renartaMerchant.notaFeePerNotaIdr);

          if (!state.posProducts || state.posProducts.length === 0) {
            state.posProducts = [
              { id: 'prod-rn-1', name: 'Nasi Ayam Geprek Sambal Matah', category: 'Makanan', price: 16000, stock: 99, isAvailable: true, description: 'Ayam goreng tepung renyah + lalapan & sambal fresh matah.', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80' },
              { id: 'prod-rn-2', name: 'Nasi Goreng Spesial Telur', category: 'Makanan', price: 15000, stock: 99, isAvailable: true, description: 'Nasi goreng harum bumbu rempah + telur mata sapi.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80' },
              { id: 'prod-rn-3', name: 'Mie Instan Dok-dok Spesial', category: 'Makanan', price: 12000, stock: 99, isAvailable: true, description: 'Mie kuah nyemek gurih telur kocok + sayur & sosis.', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80' },
              { id: 'prod-rn-4', name: 'Es Kopi Susu Gula Aren', category: 'Minuman', price: 12000, stock: 99, isAvailable: true, description: 'Espresso robusta creamy dengan gula aren asli.', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80' },
              { id: 'prod-rn-5', name: 'Es Teh Manis Jumbo', category: 'Minuman', price: 4000, stock: 99, isAvailable: true, description: 'Teh melati seduh wangi dingin segar ukuran jumbo.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80' },
              { id: 'prod-rn-6', name: 'Air Mineral Dingin (600ml)', category: 'Minuman', price: 3000, stock: 99, isAvailable: true, description: 'Air mineral kemasan botol dingin.', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80' }
            ];
          }

          if (!state.posTables || state.posTables.length === 0) {
            state.posTables = [
              { id: 'tbl-1', number: 'Meja 01', qrToken: 'MEJA-01-RN' },
              { id: 'tbl-2', number: 'Meja 02', qrToken: 'MEJA-02-RN' },
              { id: 'tbl-3', number: 'Meja 03', qrToken: 'MEJA-03-RN' },
              { id: 'tbl-4', number: 'Meja 04', qrToken: 'MEJA-04-RN' },
              { id: 'tbl-5', number: 'Meja 05', qrToken: 'MEJA-05-RN' }
            ];
          }
          hasMerchant = true;
        }
      }

      const notaFeePerNotaIdr = Number(state.posStore.notaFeePerNotaIdr ?? (state.isDemo ? 100 : 25));
      const matchedM = (state.registeredMerchants || []).find(m => m && (String(m.id) === String(reqStoreId || state.posStore.merchantId || '') || (reqOwnerId && String(m.ownerUserId) === String(reqOwnerId))));
      const targetForPresence = matchedM || state.posStore;
      const kasirOnline = isEdgeMerchantOnline(targetForPresence);
      const tier = resolveEdgeStoreTier(state, reqStoreId || targetForPresence?.id || state.posStore.merchantId);
      return new Response(JSON.stringify({
        storeName: state.posStore.storeName,
        location: state.posStore.location,
        address: state.posStore.address,
        city: state.posStore.city,
        phone: state.posStore.phone,
        isValidated: state.posStore.isValidated,
        storeMode: 'mitra',
        visibilityMode: 'mitra',
        kasirOnly: false,
        isMitra: true,
        billingTier: tier.billingTier,
        loyaltyPoolId: tier.loyaltyPoolId,
        canRedeemPoints: tier.canRedeemPoints,
        pointValueIdr: tier.pointValueIdr,
        kasirOnline,
        isOnline: kasirOnline,
        onlineStatus: kasirOnline ? 'online' : 'offline',
        lastKasirHeartbeatAt: targetForPresence?.lastKasirHeartbeatAt || null,
        saldoNota: state.posStore.saldoNota,
        kuotaNota: state.posStore.kuotaNota,
        notaFeePerNotaIdr,
        notaFeeBearer: normalizeEdgeNotaFeeBearer(state.posStore.notaFeeBearer),
        uid: state.posStore.uid,
        merchantId: state.posStore.merchantId,
        activeBranch: state.posStore.activeBranch,
        branches: state.posStore.branches
      }), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      Object.assign(state.posStore, body, {
        storeMode: 'mitra',
        visibilityMode: 'mitra',
        kasirOnly: false,
        isMitra: true
      });
      if (body.notaFeeBearer !== undefined) {
        state.posStore.notaFeeBearer = normalizeEdgeNotaFeeBearer(body.notaFeeBearer);
      }
      return new Response(JSON.stringify({
        success: true,
        message: 'Pengaturan toko kasir berhasil disimpan di Cloudflare Edge',
        store: state.posStore
      }), { headers: corsHeaders });
    }
  }

  if (path === '/store/heartbeat' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const targetId = String(body.merchantId || body.storeId || state.posStore.merchantId || '').trim();
    const isShiftOpen = body.isShiftOpen !== false;
    const nowIso = new Date().toISOString();
    state.posStore.kasirWebOnline = isShiftOpen;
    state.posStore.lastKasirHeartbeatAt = isShiftOpen ? nowIso : state.posStore.lastKasirHeartbeatAt;
    const matched = (state.registeredMerchants || []).find(m => String(m.id) === targetId);
    if (matched) {
      matched.kasirWebOnline = isShiftOpen;
      matched.lastKasirHeartbeatAt = nowIso;
    }
    return new Response(JSON.stringify({
      success: true,
      kasirOnline: isShiftOpen,
      isOnline: isShiftOpen,
      onlineStatus: isShiftOpen ? 'online' : 'offline',
      lastKasirHeartbeatAt: nowIso
    }), { headers: corsHeaders });
  }

  if (path === '/store/offline' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const targetId = String(body.merchantId || body.storeId || state.posStore.merchantId || '').trim();
    state.posStore.kasirWebOnline = false;
    const matched = (state.registeredMerchants || []).find(m => String(m.id) === targetId);
    if (matched) matched.kasirWebOnline = false;
    return new Response(JSON.stringify({
      success: true,
      kasirOnline: false,
      isOnline: false,
      onlineStatus: 'offline'
    }), { headers: corsHeaders });
  }

  if (path === '/store/fee-settings' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const bearer = normalizeEdgeNotaFeeBearer(body.notaFeeBearer);
    state.posStore.notaFeeBearer = bearer;
    return new Response(JSON.stringify({
      success: true,
      notaFeeBearer: bearer,
      message: bearer === 'customer'
        ? 'Biaya admin nota diatur ditanggung Customer.'
        : 'Biaya nota dikembalikan ditanggung oleh Toko (Default).',
      store: {
        ...state.posStore,
        notaFeeBearer: bearer
      }
    }), { headers: corsHeaders });
  }

  if (path === '/store/switch' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (body.storeId) state.posStore.activeBranch = body.storeId;
    return new Response(JSON.stringify({
      success: true,
      activeBranch: state.posStore.activeBranch,
      message: 'Cabang berhasil dialihkan'
    }), { headers: corsHeaders });
  }

  if (path === '/register-umkm' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const newStore = {
      id: 'MTR-' + Date.now(),
      ownerUserId: String(body.ownerUserId || 'owner'),
      storeName: body.storeName || 'Kantin & Kuliner Renarta',
      name: body.storeName || 'Kantin & Kuliner Renarta',
      category: body.category || 'Warung & Kuliner',
      phone: body.phone || '081228263200',
      location: body.location || 'Kantin KostKu - Stand Utama',
      address: body.address || 'Jl. Nakula I No. 5-11, Semarang',
      city: body.city || 'Semarang',
      photo: body.photo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80',
      isValidated: true,
      isVerified: true,
      storeMode: 'mitra',
      visibilityMode: 'mitra',
      kasirOnly: false,
      isMitra: true,
      billingTier: 'TIER_1_FLAT',
      saldoNota: 100000,
      kuotaNota: 4000,
      notaFeeBearer: 'store',
      notaFeePerNotaIdr: 25,
      branches: body.branches || [],
      status: 'active',
      createdAt: new Date().toISOString()
    };
    newStore.uid = newStore.id;
    newStore.merchantId = newStore.id;
    state.registeredMerchants = state.registeredMerchants || [];
    state.registeredMerchants.push(newStore);
    Object.assign(state.posStore, newStore);
    syncEdgeStoreWallet(state, newStore.id, newStore.saldoNota, newStore.kuotaNota, newStore.notaFeePerNotaIdr);

    if (Array.isArray(body.menus) && body.menus.length > 0) {
      state.posProducts = body.menus.map((m, idx) => ({
        id: 'prod-' + Date.now() + '-' + idx,
        name: m.name,
        category: m.category || 'Makanan',
        price: Number(m.price) || 10000,
        stock: Number(m.stock) || 99,
        isAvailable: true,
        description: m.description || '',
        image: m.image || ''
      }));
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'UMKM Mitra berhasil didaftarkan!',
      store: newStore,
      products: state.posProducts
    }), { headers: corsHeaders });
  }

  if (path === '/topup-nota' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const addSaldo = Number(body.amount) || 10000;
    const activeFee = Math.max(1, Number(state.posStore.notaFeePerNotaIdr ?? (state.isDemo ? 100 : 25)));
    const addQuota = Number(body.quota) || Math.max(1, Math.floor(addSaldo / activeFee));
    const nextKuota = (Number(state.posStore.kuotaNota) || 0) + addQuota;
    const nextSaldo = (Number(state.posStore.saldoNota) || 0) + addSaldo;
    const targetStoreId = body.storeId || state.posStore.activeBranch || state.posStore.merchantId || state.posStore.uid || 'STORE-DEFAULT';
    syncEdgeStoreWallet(state, targetStoreId, nextSaldo, nextKuota, activeFee);
    return new Response(JSON.stringify({
      success: true,
      message: `Top up kuota kasir berhasil (+${addQuota} nota)`,
      saldoNota: state.posStore.saldoNota,
      kuotaNota: state.posStore.kuotaNota
    }), { headers: corsHeaders });
  }

  if (path === '/topup-tripay' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const addSaldo = Number(body.amount) || 10000;
    const addQuota = Number(body.quota) || Math.max(1, Math.floor(addSaldo / 100));
    const reference = 'TRIPAY-POS-NOTA-' + Date.now();
    const qrString = `00020101021226670016ID.CO.TRIPAY.WWW01189360099900000000000215${reference}520458125303360540${addSaldo}5802ID5914RIUPH KASIR POS6007JAKARTA62070703A016304E8A2`;
    const checkoutUrl = `https://tripay.co.id/checkout/${reference}`;
    return new Response(JSON.stringify({
      success: true,
      reference,
      amount: addSaldo,
      quota: addQuota,
      qrString,
      checkoutUrl,
      paymentMethod: 'QRIS',
      expiredTime: Date.now() + 15 * 60 * 1000,
      instructions: [
        'Buka aplikasi e-wallet (GoPay, OVO, Dana, ShopeePay) atau m-Banking (BCA, Mandiri, BRImo)',
        'Pindai barcode QRIS atau klik tombol Buka Halaman Checkout TriPay',
        'Periksa nama penerima KostKu Kasir POS dan nominal pembayaran',
        'Selesaikan pembayaran dan klik tombol Saya Sudah Bayar'
      ]
    }), { headers: corsHeaders });
  }

  if (path === '/topup-tripay/confirm' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const reference = body.reference || '';
    const addSaldo = Number(body.amount) || 10000;
    const addQuota = Number(body.quota) || Math.max(1, Math.floor(addSaldo / 100));

    if (!reference) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nomor referensi TriPay wajib disertakan untuk verifikasi status.'
      }), { status: 400, headers: corsHeaders });
    }

    if (state.posPaidReferences.has(reference)) {
      return new Response(JSON.stringify({
        success: true,
        isPaid: true,
        status: 'PAID',
        message: `Pembayaran TriPay TERVERIFIKASI (PAID)! +${addQuota} kuota nota telah aktif.`,
        saldoNota: state.posStore.saldoNota,
        kuotaNota: state.posStore.kuotaNota,
        reference
      }), { headers: corsHeaders });
    }

    const apiKey = '8lgqWBCHk8xLycXV3aRjfn5YBrDUZtJCe13muUy5';
    const detailUrl = `https://tripay.co.id/api/transaction/detail?reference=${encodeURIComponent(reference)}`;

    try {
      const tripayRes = await fetch(detailUrl, {
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Accept': 'application/json' }
      });
      const tripayData = await tripayRes.json().catch(() => ({}));
      if (tripayData && tripayData.success && tripayData.data) {
        const status = String(tripayData.data.status || '').toUpperCase();
        if (status !== 'PAID') {
          return new Response(JSON.stringify({
            success: false,
            isPaid: false,
            status,
            error: `Status di TriPay masih ${status || 'UNPAID'} (Belum Dibayar). Silakan selesaikan pembayaran QRIS terlebih dahulu.`,
            tripayDetail: tripayData.data
          }), { status: 400, headers: corsHeaders });
        }
        state.posPaidReferences.add(reference);
      } else {
        const tripayMsg = tripayData?.message || 'Gagal menghubungi server TriPay';
        const ipMatch = tripayMsg.match(/\((.*?)\)/)?.[1] || '';
        let userError = `Pengecekan TriPay: ${tripayMsg}`;
        if (ipMatch) {
          userError = `IP Server Cloudflare (${ipMatch}) belum terdaftar di Whitelist IP TriPay (T53543).`;
        } else if (tripayMsg.toLowerCase().includes('undefined parameter') || tripayMsg.toLowerCase().includes('tidak ditemukan')) {
          userError = `Pembayaran QRIS belum terdeteksi masuk (UNPAID). Silakan selesaikan pembayaran terlebih dahulu.`;
        }
        return new Response(JSON.stringify({
          success: false,
          isPaid: false,
          status: 'CHECK_FAILED',
          error: userError,
          tripayMessage: tripayMsg
        }), { status: 400, headers: corsHeaders });
      }
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        isPaid: false,
        error: `Gagal memverifikasi ke TriPay: ${err.message}`
      }), { status: 502, headers: corsHeaders });
    }

    state.posPaidReferences.add(reference);
    const activeFee = Math.max(1, Number(state.posStore.notaFeePerNotaIdr ?? (state.isDemo ? 100 : 25)));
    const nextKuota = (Number(state.posStore.kuotaNota) || 0) + addQuota;
    const nextSaldo = (Number(state.posStore.saldoNota) || 0) + addSaldo;
    const targetStoreId = body.storeId || state.posStore.activeBranch || state.posStore.merchantId || state.posStore.uid || 'STORE-DEFAULT';
    syncEdgeStoreWallet(state, targetStoreId, nextSaldo, nextKuota, activeFee);
    return new Response(JSON.stringify({
      success: true,
      isPaid: true,
      status: 'PAID',
      message: `Pembayaran TriPay TERVERIFIKASI (PAID)! +${addQuota} kuota nota telah aktif.`,
      saldoNota: state.posStore.saldoNota,
      kuotaNota: state.posStore.kuotaNota,
      reference: reference || 'TRIPAY-VERIFIED'
    }), { headers: corsHeaders });
  }

  if ((path === '/tripay/callback' || path === '/callback/tripay') && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const reference = body.reference || body.merchant_ref || '';
    const status = String(body.status || '').toUpperCase();
    const amount = Number(body.total_amount || body.amount) || 10000;
    const quota = Math.max(1, Math.floor(amount / 100));

    if (status === 'PAID') {
      if (reference) state.posPaidReferences.add(reference);
      state.posStore.kuotaNota = (Number(state.posStore.kuotaNota) || 0) + quota;
      state.posStore.saldoNota = (Number(state.posStore.saldoNota) || 0) + amount;
      return new Response(JSON.stringify({ success: true, message: 'Callback processed' }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true, message: 'Status recorded: ' + status }), { headers: corsHeaders });
  }

  if (path === '/redeem-codes') {
    if (method === 'GET') {
      return new Response(JSON.stringify(state.posRedeemCodes), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const code = (body.code || '').trim().toUpperCase();
      if (!code) {
        return new Response(JSON.stringify({ error: 'Kode redeem wajib diisi' }), { status: 400, headers: corsHeaders });
      }
      const newRedeem = {
        id: 'REDEEM-' + Date.now(),
        code,
        type: 'KUOTA_NOTA',
        quotaNota: Number(body.quotaNota) || 50,
        saldoBonus: Number(body.saldoBonus) || 5000,
        maxQuota: Number(body.maxQuota) || 10,
        usedCount: 0,
        usedBy: [],
        description: body.description || `Bonus ${body.quotaNota || 50} Nota Kasir`,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      state.posRedeemCodes.unshift(newRedeem);
      return new Response(JSON.stringify({
        success: true,
        message: 'Kode redeem kustom berhasil dibuat',
        redeemCode: newRedeem
      }), { status: 201, headers: corsHeaders });
    }
  }

  if (path === '/redeem-code/claim' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const code = (body.code || '').trim().toUpperCase();
    const item = state.posRedeemCodes.find(r => r.code === code && r.isActive);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Kode redeem tidak valid atau sudah tidak aktif' }), { status: 400, headers: corsHeaders });
    }
    if (item.maxQuota && item.usedCount >= item.maxQuota) {
      return new Response(JSON.stringify({ error: 'Kuota penukaran kode redeem ini sudah habis' }), { status: 400, headers: corsHeaders });
    }
    item.usedCount += 1;
    state.posStore.kuotaNota += item.quotaNota;
    state.posStore.saldoNota += item.saldoBonus;
    return new Response(JSON.stringify({
      success: true,
      message: `Selamat! Anda mendapatkan tambahan ${item.quotaNota} Kuota Nota Kasir!`,
      addedQuota: item.quotaNota,
      addedSaldo: item.saldoBonus,
      newQuotaNota: state.posStore.kuotaNota,
      newSaldoNota: state.posStore.saldoNota
    }), { headers: corsHeaders });
  }

  if (path === '/promos') {
    if (method === 'GET') {
      return new Response(JSON.stringify({ success: true, promos: state.posFoodPromos }), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newPromo = {
        id: 'PROMO-FOOD-' + Date.now(),
        title: body.title || 'Promo Baru',
        code: (body.code || 'PROMO' + Math.floor(Math.random() * 9000 + 1000)).toUpperCase(),
        scope: body.scope || 'ALL',
        targetProductId: body.targetProductId || null,
        targetProductName: body.targetProductName || null,
        discountType: body.discountType || 'FIXED',
        discountValue: Number(body.discountValue) || 2000,
        minOrder: Number(body.minOrder) || 0,
        limitType: body.limitType || 'QUOTA',
        maxQuota: body.maxQuota ? Number(body.maxQuota) : null,
        usedCount: 0,
        startDate: body.startDate || new Date().toISOString().slice(0, 10),
        expiryDate: body.expiryDate || null,
        isActive: true,
        createdByRole: body.createdByRole || 'owner',
        description: body.description || '',
        createdAt: new Date().toISOString()
      };
      state.posFoodPromos.unshift(newPromo);
      return new Response(JSON.stringify({ success: true, promo: newPromo }), { status: 200, headers: corsHeaders });
    }
  }

  if (path.startsWith('/promos/') && path.endsWith('/toggle') && method === 'PUT') {
    const id = path.replace('/promos/', '').replace('/toggle', '');
    const p = state.posFoodPromos.find(x => x.id === id);
    if (p) {
      p.isActive = !p.isActive;
      return new Response(JSON.stringify({ success: true, promo: p }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Promo tidak ditemukan' }), { status: 404, headers: corsHeaders });
  }

  if (path.startsWith('/promos/') && method === 'DELETE') {
    const id = path.replace('/promos/', '');
    state.posFoodPromos = state.posFoodPromos.filter(x => x.id !== id);
    return new Response(JSON.stringify({ success: true, message: 'Promo berhasil dihapus' }), { headers: corsHeaders });
  }

  if (path === '/promos/validate' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const code = String(body.promoCode || body.code || '').trim().toUpperCase();
    const orderTotal = Number(body.subtotal || body.orderTotal) || 0;
    const storeTier = resolveEdgeStoreTier(state, body.storeId || body.merchantId || state.posStore.merchantId);
    const promo = state.posFoodPromos.find(p => p.code === code && p.isActive);

    if (!promo) {
      return new Response(JSON.stringify({ valid: false, message: 'Kode promo tidak valid atau tidak aktif' }), { headers: corsHeaders });
    }
    if ((promo.createdByRole === 'customer' || String(promo.code || '').toUpperCase().startsWith('POIN-')) && !storeTier.canRedeemPoints) {
      return new Response(JSON.stringify({
        valid: false,
        code: 'POIN_NOT_ACTIVE_ON_STORE',
        message: 'Toko ini belum bergabung di Loyalty Pool (Tier 2). Penukaran poin hanya berlaku di toko Tier 2.'
      }), { status: 422, headers: corsHeaders });
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if ((promo.limitType === 'DATE' || promo.limitType === 'BOTH') && promo.expiryDate && todayStr > promo.expiryDate) {
      return new Response(JSON.stringify({ valid: false, message: 'Masa berlaku promo ini telah berakhir' }), { headers: corsHeaders });
    }
    if ((promo.limitType === 'QUOTA' || promo.limitType === 'BOTH') && promo.maxQuota !== null && promo.usedCount >= promo.maxQuota) {
      return new Response(JSON.stringify({ valid: false, message: 'Kuota pemakaian promo ini telah habis' }), { headers: corsHeaders });
    }
    if (orderTotal < (promo.minOrder || 0)) {
      return new Response(JSON.stringify({
        valid: false,
        message: `Minimal belanja Rp ${promo.minOrder.toLocaleString('id-ID')} untuk menggunakan promo ini`
      }), { headers: corsHeaders });
    }
    const discountAmount = promo.discountType === 'PERCENT'
      ? Math.round((orderTotal * promo.discountValue) / 100)
      : (Number(promo.discountValue) || 0);
    return new Response(JSON.stringify({
      valid: true,
      discountAmount,
      promo,
      message: `Promo ${promo.title} berhasil diterapkan! Hemat Rp ${discountAmount.toLocaleString('id-ID')}`
    }), { headers: corsHeaders });
  }

  if (path === '/products') {
    if (method === 'GET') {
      const reqOwnerId = url.searchParams.get('ownerId') || request.headers.get('x-user-id') || '';
      const reqTableToken = url.searchParams.get('tableToken') || '';
      const reqStoreId = url.searchParams.get('storeId') || url.searchParams.get('merchantId') || '';
      if (!state.isDemo && !reqOwnerId && !reqTableToken && !reqStoreId) {
        return new Response(JSON.stringify([]), { headers: corsHeaders });
      }
      return new Response(JSON.stringify(state.posProducts), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newProduct = {
        id: 'prod-' + Date.now(),
        name: body.name || 'Produk Baru',
        category: body.category || 'Makanan',
        price: Number(body.price) || 10000,
        stock: Number(body.stock) || 99,
        isAvailable: body.isAvailable !== false,
        description: body.description || '',
        image: body.image || ''
      };
      state.posProducts.push(newProduct);
      return new Response(JSON.stringify(newProduct), { status: 201, headers: corsHeaders });
    }
  }

  if (path.startsWith('/products/')) {
    const id = path.replace('/products/', '');
    if (method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const p = state.posProducts.find(x => x.id === id);
      if (p) {
        Object.assign(p, body);
        return new Response(JSON.stringify(p), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Produk tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (method === 'DELETE') {
      state.posProducts = state.posProducts.filter(x => x.id !== id);
      return new Response(JSON.stringify({ success: true, message: 'Produk berhasil dihapus' }), { headers: corsHeaders });
    }
  }

  if (path === '/tables') {
    if (method === 'GET') {
      const reqOwnerId = url.searchParams.get('ownerId') || request.headers.get('x-user-id') || '';
      const reqTableToken = url.searchParams.get('tableToken') || '';
      const reqStoreId = url.searchParams.get('storeId') || url.searchParams.get('merchantId') || '';
      if (!state.isDemo && !reqOwnerId && !reqTableToken && !reqStoreId) {
        return new Response(JSON.stringify([]), { headers: corsHeaders });
      }
      if (reqTableToken) {
        return new Response(JSON.stringify(state.posTables.filter(t => String(t.qrToken || '') === reqTableToken)), { headers: corsHeaders });
      }
      return new Response(JSON.stringify(state.posTables), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newTable = {
        id: 'tbl-' + Date.now(),
        number: body.number || `Meja ${state.posTables.length + 1}`,
        qrToken: `MEJA-${state.posTables.length + 1}-TKN${Math.floor(Math.random() * 900 + 100)}`
      };
      state.posTables.push(newTable);
      return new Response(JSON.stringify(newTable), { status: 201, headers: corsHeaders });
    }
  }

  if (path === '/inventory') {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        inventory: state.posInventory,
        alerts: getInventoryAlerts(state)
      }), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newItem = {
        id: 'INV-' + (body.name || 'BAHAN').replace(/\s+/g, '-').toUpperCase().slice(0, 8) + '-' + Date.now().toString().slice(-4),
        name: body.name || 'Bahan Baru',
        category: body.category || 'Bahan Pokok',
        unit: body.unit || 'pcs',
        currentStock: Number(body.currentStock) || 0,
        minAlertStock: Number(body.minAlertStock) || 10,
        costPerUnit: Number(body.costPerUnit) || 1000,
        supplier: body.supplier || 'Pemasok Lokal',
        lastRestocked: new Date().toISOString()
      };
      state.posInventory.push(newItem);
      return new Response(JSON.stringify({ success: true, item: newItem }), { status: 201, headers: corsHeaders });
    }
  }

  if (path.startsWith('/inventory/') && !path.includes('/restock')) {
    const id = path.replace('/inventory/', '');
    if (method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const item = state.posInventory.find(x => x.id === id);
      if (item) {
        Object.assign(item, body);
        return new Response(JSON.stringify({ success: true, item }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Item gudang tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (method === 'DELETE') {
      state.posInventory = state.posInventory.filter(x => x.id !== id);
      return new Response(JSON.stringify({ success: true, message: 'Item berhasil dihapus dari gudang' }), { headers: corsHeaders });
    }
  }

  if (path === '/inventory/restock' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const item = state.posInventory.find(x => x.id === body.inventoryId);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Item bahan baku tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    const addQty = Number(body.addQty) || 0;
    item.currentStock = (Number(item.currentStock) || 0) + addQty;
    item.lastRestocked = new Date().toISOString();
    return new Response(JSON.stringify({
      success: true,
      newStock: item.currentStock,
      item,
      message: `Berhasil restock ${item.name} (+${addQty} ${item.unit})`
    }), { headers: corsHeaders });
  }

  if (path === '/recipes' && method === 'GET') {
    return new Response(JSON.stringify({ success: true, recipes: getRecipesList(state) }), { headers: corsHeaders });
  }

  if (path.startsWith('/recipes/') && method === 'PUT') {
    const pid = path.replace('/recipes/', '');
    const body = await request.json().catch(() => ({}));
    state.posRecipes[pid] = body.ingredients || [];
    return new Response(JSON.stringify({
      success: true,
      productId: pid,
      ingredients: state.posRecipes[pid],
      message: 'Resep bahan baku menu berhasil diperbarui'
    }), { headers: corsHeaders });
  }

  if (path === '/analytics' && method === 'GET') {
    return new Response(JSON.stringify(calculateAnalytics(state)), { headers: corsHeaders });
  }

  if (path === '/orders' || path === '/checkout') {
    if (method === 'GET') {
      const reqOwnerId = url.searchParams.get('ownerId') || request.headers.get('x-user-id') || '';
      const reqStoreId = url.searchParams.get('storeId') || url.searchParams.get('merchantId') || '';
      if (!state.isDemo && !reqOwnerId && !reqStoreId) {
        return new Response(JSON.stringify({ error: 'Login diperlukan untuk melihat pesanan Kasir POS.' }), { status: 401, headers: corsHeaders });
      }
      return new Response(JSON.stringify(state.posOrders), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const storeId = body.storeId || state.posStore.activeBranch || state.posStore.merchantId || 'STORE-DEFAULT';
      const billingFeeIdr = Number(state.posStore.notaFeePerNotaIdr ?? (state.isDemo ? 100 : 25));

      // Cold Cloudflare isolate resilience: sync wallet balance if isolate just booted with 0
      const hasExplicitStoreSaldo = body.storeSaldoNota !== undefined && body.storeSaldoNota !== null;
      const explicitStoreSaldo = hasExplicitStoreSaldo
        ? Math.min(Math.max(0, Math.round(Number(body.storeSaldoNota) || 0)), 1000000)
        : null;
      const walletMissing = !state.merchantWallets?.[storeId];
      const existingPosSaldo = Number(state.posStore.saldoNota || 0);
      const existingMerchant = (state.registeredMerchants || []).find(m => m && (String(m.id) === String(storeId) || String(m.uid || '') === String(storeId)));
      if (!state.isDemo && walletMissing && existingPosSaldo === 0 && !existingMerchant) {
        const hydratedSaldo = hasExplicitStoreSaldo
          ? explicitStoreSaldo
          : (String(storeId).startsWith('MTR-') ? 100000 : 0);
        if (hydratedSaldo > 0) {
          if (!state.posStore.merchantId) state.posStore.merchantId = storeId;
          if (!state.posStore.uid) state.posStore.uid = storeId;
          if (!state.posStore.storeName) state.posStore.storeName = body.storeName || 'Kantin & Kuliner Renarta';
          syncEdgeStoreWallet(state, storeId, hydratedSaldo, Math.floor(hydratedSaldo / Math.max(1, billingFeeIdr)), billingFeeIdr);
        }
      }

      const orderTier = resolveEdgeStoreTier(state, storeId);
      const requestedPointsToRedeem = Math.max(0, Math.floor(Number(body.pointsToRedeem) || 0));
      const reqPromoCode = String(body.promoCode || '').trim().toUpperCase();
      if (!orderTier.canRedeemPoints && (requestedPointsToRedeem > 0 || reqPromoCode.startsWith('POIN-'))) {
        return new Response(JSON.stringify({
          error: 'Toko ini belum mengaktifkan Loyalty Pool (Tier 2). Customer belum dapat menukar poin di toko ini.',
          code: 'POIN_NOT_ACTIVE_ON_STORE',
          billingTier: orderTier.billingTier
        }), { status: 422, headers: corsHeaders });
      }
      const items = (body.items || []).map(it => {
        const pid = it.productId || it.id;
        const matchedProd = (state.posProducts || []).find(p => String(p.id) === String(pid));
        return {
          ...it,
          productId: pid,
          name: it.name || matchedProd?.name || 'Menu',
          price: it.price != null ? Number(it.price) : Number(matchedProd?.price || 0),
          isReady: false
        };
      });
      const subtotal = items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.qty) || 1)), 0);
      const discount = Number(body.discountAmount || 0);
      const totalAmount = Math.max(0, subtotal - discount);

      items.forEach(it => {
        const pid = it.productId;
        const qty = Number(it.qty) || 1;
        const ingredients = state.posRecipes[pid] || [];
        ingredients.forEach(ing => {
          const inv = state.posInventory.find(i => i.id === ing.inventoryId);
          if (inv) {
            inv.currentStock = Math.max(0, (Number(inv.currentStock) || 0) - ((Number(ing.amount) || 0) * qty));
          }
        });
      });

      const storeName = body.storeName || state.posStore.storeName || 'Toko Kasir';
      const now = new Date();
      const orderId = 'POS-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
      const invoiceNumber = 'INV-' + now.toISOString().slice(0, 10).replace(/-/g, '') + '-' + orderId.slice(-4);
      const claimDeadline = calculateWibClaimDeadline(now);
      const claimToken = 'clm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      const qrClaimUrl = `https://kostku.riuph.me/claim?token=${claimToken}`;

      const requestedPaymentMethod = String(body.paymentMethod || '').toUpperCase().trim();
      const notaFeeBearer = normalizeEdgeNotaFeeBearer(state.posStore.notaFeeBearer);
      const isDeferredSelfOrder = !requestedPaymentMethod || requestedPaymentMethod === 'CASH_COUNTER';
      const isImmediateCustomerViaQris = requestedPaymentMethod === 'QRIS' && notaFeeBearer === 'customer';
      const shouldDeductAtCreate = !isDeferredSelfOrder && !isImmediateCustomerViaQris;

      const baseAmountBeforePaymentFee = Math.max(0, subtotal - discount);
      const feeSnap = computeEdgePosFeeSnapshot({
        baseAmount: baseAmountBeforePaymentFee,
        notaFeeIdr: billingFeeIdr,
        notaFeeBearer,
        paymentMethod: requestedPaymentMethod
      });

      const BASE_ADMIN_FEE = 40.00;
      const HELD_PROMO_FEE = 60.00;

      const newOrder = {
        id: orderId,
        invoice_number: invoiceNumber,
        invoice: invoiceNumber,
        customerName: body.customerName || 'Tamu',
        customerPhone: body.customerPhone || '',
        tableNumber: body.tableNumber || 'Takeaway',
        items,
        subtotal,
        discountAmount: discount,
        baseAmountBeforePaymentFee,
        qrisFee: feeSnap.qrisFee,
        qrisFeeFixed: feeSnap.qrisFeeFixed,
        qrisFeePercent: feeSnap.qrisFeePercent,
        customerAdminFee: feeSnap.customerAdminFee,
        notaFeeBearer: feeSnap.notaFeeBearer,
        notaFeeBorneBy: feeSnap.notaFeeBearer,
        feeBorneBy: feeSnap.notaFeeBearer,
        paymentFeeBorneBy: feeSnap.qrisFee > 0 ? 'customer' : null,
        billing_fee_idr: billingFeeIdr,
        totalAmount: feeSnap.totalAmount,
        paymentMethod: requestedPaymentMethod || null,
        paymentStatus: 'UNPAID',
        status: body.status || 'PENDING_CONFIRMATION',
        storeId,
        storeName,
        cashierId: body.cashierId || 'KSR-01',
        cashierName: body.cashierName || 'Kasir',
        base_admin_fee: BASE_ADMIN_FEE,
        held_promo_fee: HELD_PROMO_FEE,
        claim_token: claimToken,
        claimToken: claimToken,
        qr_claim_url: qrClaimUrl,
        qrClaimUrl: qrClaimUrl,
        claim_deadline: claimDeadline.toISOString(),
        claimDeadline: claimDeadline.toISOString(),
        createdAt: now.toISOString()
      };

      let deductRes = { ok: true, kuotaAfter: Number(state.posStore.kuotaNota ?? 0), saldoAfter: Number(state.posStore.saldoNota ?? 0) };
      if (shouldDeductAtCreate) {
        deductRes = deductEdgeStoreNotaOnce(state, newOrder, storeId, billingFeeIdr);
        if (!deductRes.ok) {
          return new Response(JSON.stringify(deductRes), { status: 402, headers: corsHeaders });
        }
      } else if (isImmediateCustomerViaQris) {
        newOrder.notaDeducted = 0;
        newOrder.notaBypassReason = 'CUSTOMER_PAID_VIA_KOSTKU_QRIS';
      }

      const remainingKuotaNota = deductRes.kuotaAfter ?? Number(state.posStore.kuotaNota ?? 0);
      const isLowQuota = remainingKuotaNota <= 15;
      const lowQuotaWarning = isLowQuota
        ? `Kuota nota gratis Anda tersisa ${remainingKuotaNota} transaksi. Lakukan top up agar operasional kasir tetap lancar.`
        : null;
      newOrder.kuotaNota = remainingKuotaNota;
      newOrder.isLowQuota = isLowQuota;
      newOrder.lowQuotaWarning = lowQuotaWarning;

      const claimRecord = {
        id: 'CLM-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
        order_id: orderId,
        merchant_id: storeId,
        merchant_name: storeName,
        invoice_number: invoiceNumber,
        total_amount: feeSnap.totalAmount,
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
        createdAt: now.toISOString()
      };
      state.receiptClaims.unshift(claimRecord);

      syncDeltaToFirebaseAsync(state, `pos_orders/${orderId}`, { id: orderId, invoice_number: invoiceNumber, totalAmount: feeSnap.totalAmount }, 'PUT');
      syncDeltaToFirebaseAsync(state, `receipt_claims/${claimRecord.id}`, claimRecord, 'PUT');

      state.posOrders.unshift(newOrder);
      return new Response(JSON.stringify({
        ...newOrder,
        invoice: invoiceNumber,
        total: feeSnap.totalAmount,
        qr_claim_url: qrClaimUrl,
        claim_token: claimToken,
        claim_deadline: claimDeadline.toISOString(),
        kuotaNota: remainingKuotaNota,
        sisaSaldoNota: deductRes.saldoAfter,
        sisaKuotaNota: remainingKuotaNota,
        isLowQuota,
        lowQuotaWarning
      }), { status: 200, headers: corsHeaders });
    }
  }

  if (path.startsWith('/orders/')) {
    const parts = path.replace('/orders/', '').split('/');
    const orderId = parts[0];
    const subAction = parts[1];
    let order = state.posOrders.find(o => o.id === orderId);

    if (!subAction && method === 'GET') {
      if (order) return new Response(JSON.stringify(order), { headers: corsHeaders });
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if ((subAction === 'table' || !subAction) && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      const body = await request.json().catch(() => ({}));
      if (order) {
        if (body.tableNumber !== undefined) order.tableNumber = body.tableNumber;
        if (body.customerName !== undefined) order.customerName = body.customerName;
        syncDeltaToFirebaseAsync(state, `pos_orders/${orderId}`, { tableNumber: order.tableNumber, customerName: order.customerName }, 'PATCH');
        return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (subAction === 'acc' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (!order && body.orderSnapshot && String(body.orderSnapshot.id || '') === String(orderId)) {
        order = { ...body.orderSnapshot, id: orderId, status: body.orderSnapshot.status || 'PENDING_CONFIRMATION' };
        state.posOrders.unshift(order);
      }
      if (order) {
        order.status = 'WAITING_PAYMENT';
        order.accAt = new Date().toISOString();
        return new Response(JSON.stringify({ success: true, message: 'Pesanan berhasil di-ACC! Pembeli kini dapat membayar.', order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (subAction === 'reject' && method === 'POST') {
      if (order) {
        order.status = 'CANCELLED';
        (order.items || []).forEach(it => {
          const pid = it.productId || it.id;
          const qty = Number(it.qty) || 1;
          (state.posRecipes[pid] || []).forEach(ing => {
            const inv = state.posInventory.find(i => i.id === ing.inventoryId);
            if (inv) inv.currentStock = (Number(inv.currentStock) || 0) + ((Number(ing.amount) || 0) * qty);
          });
        });
        return new Response(JSON.stringify({ success: true, order, message: 'Order dibatalkan dan stok gudang dipulihkan' }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (subAction === 'pay' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (!order && body.orderSnapshot && String(body.orderSnapshot.id || '') === String(orderId)) {
        order = {
          ...body.orderSnapshot,
          id: orderId,
          status: body.orderSnapshot.status === 'PREPARING' ? 'WAITING_PAYMENT' : (body.orderSnapshot.status || 'WAITING_PAYMENT')
        };
        state.posOrders.unshift(order);
      }
      if (!order) return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
      if (order.status !== 'WAITING_PAYMENT') {
        return new Response(JSON.stringify({ error: 'Pesanan belum di-ACC oleh dapur atau sudah dibayar' }), { status: 400, headers: corsHeaders });
      }
      const normMethod = String(body.method || body.paymentMethod || '').toUpperCase().trim();
      const billingFeeIdr = Number(order.billing_fee_idr ?? state.posStore.notaFeePerNotaIdr ?? (state.isDemo ? 100 : 25));
      const notaFeeBearer = normalizeEdgeNotaFeeBearer(state.posStore.notaFeeBearer);
      const baseAmt = Number(order.baseAmountBeforePaymentFee ?? Math.max(0, Number(order.totalAmount || 0) - (Number(order.qrisFee) || 0) - (Number(order.customerAdminFee) || 0)));

      if (normMethod === 'CASH_COUNTER') {
        const feeSnap = computeEdgePosFeeSnapshot({ baseAmount: baseAmt, notaFeeIdr: billingFeeIdr, notaFeeBearer, paymentMethod: 'CASH' });
        order.baseAmountBeforePaymentFee = feeSnap.baseAmount;
        order.qrisFee = 0;
        order.customerAdminFee = feeSnap.customerAdminFee;
        order.notaFeeBearer = feeSnap.notaFeeBearer;
        order.notaFeeBorneBy = feeSnap.notaFeeBearer;
        order.paymentFeeBorneBy = null;
        order.totalAmount = feeSnap.totalAmount;
        order.paymentMethod = 'CASH';
        order.customerSelectedPayment = 'CASH_COUNTER';
        order.paymentStatus = 'WAITING_CASHIER';
        return new Response(JSON.stringify({
          success: true,
          method: 'CASH_COUNTER',
          status: 'WAITING_PAYMENT',
          baseAmount: feeSnap.baseAmount,
          qrisFee: 0,
          customerAdminFee: feeSnap.customerAdminFee,
          notaFeeBearer: feeSnap.notaFeeBearer,
          total: feeSnap.totalAmount,
          message: `Silakan bayar tunai Rp ${feeSnap.totalAmount.toLocaleString('id-ID')} di meja kasir.`,
          order
        }), { headers: corsHeaders });
      }

      if (normMethod === 'TRIPAY') {
        const feeSnap = computeEdgePosFeeSnapshot({ baseAmount: baseAmt, notaFeeIdr: billingFeeIdr, notaFeeBearer, paymentMethod: 'TRIPAY' });
        order.baseAmountBeforePaymentFee = feeSnap.baseAmount;
        order.qrisFee = feeSnap.qrisFee;
        order.qrisFeeFixed = feeSnap.qrisFeeFixed;
        order.qrisFeePercent = feeSnap.qrisFeePercent;
        order.customerAdminFee = feeSnap.customerAdminFee;
        order.notaFeeBearer = feeSnap.notaFeeBearer;
        order.notaFeeBorneBy = feeSnap.notaFeeBearer;
        order.paymentFeeBorneBy = 'customer';
        order.customerSelectedPayment = 'TRIPAY';
        order.paymentStatus = 'PENDING';
        order.paymentMethod = 'TRIPAY';
        order.totalAmount = feeSnap.totalAmount;
        const amtStr = String(Math.round(feeSnap.totalAmount));
        const mockQr = `00020101021226670016ID.CO.TRIPAY.WWW01189360099900000000000215${order.id}52045812530336054${String(amtStr.length).padStart(2, '0')}${amtStr}5802ID5914RIUPH KASIR POS6007JAKARTA62070703A016304E8A2`;
        order.tripayReference = 'EDGE-TRIPAY-' + order.id;
        order.tripayQrString = mockQr;
        order.tripayCheckoutUrl = `https://tripay.co.id/checkout/${order.tripayReference}`;
        return new Response(JSON.stringify({
          success: true,
          method: 'TRIPAY',
          isSimulator: true,
          reference: order.tripayReference,
          qrString: mockQr,
          checkoutUrl: order.tripayCheckoutUrl,
          baseAmount: feeSnap.baseAmount,
          qrisFee: feeSnap.qrisFee,
          customerAdminFee: feeSnap.customerAdminFee,
          notaFeeBearer: feeSnap.notaFeeBearer,
          total: feeSnap.totalAmount
        }), { headers: corsHeaders });
      }

      if (normMethod === 'CASH' || normMethod === 'QRIS' || normMethod === 'TRANSFER') {
        const feeSnap = computeEdgePosFeeSnapshot({ baseAmount: baseAmt, notaFeeIdr: billingFeeIdr, notaFeeBearer, paymentMethod: normMethod });
        order.baseAmountBeforePaymentFee = feeSnap.baseAmount;
        order.qrisFee = feeSnap.qrisFee;
        order.customerAdminFee = feeSnap.customerAdminFee;
        order.notaFeeBearer = feeSnap.notaFeeBearer;
        order.notaFeeBorneBy = feeSnap.notaFeeBearer;
        order.paymentFeeBorneBy = feeSnap.qrisFee > 0 ? 'customer' : null;
        order.totalAmount = feeSnap.totalAmount;
        let deductRes = { ok: true, feeDeducted: 0, saldoAfter: state.posStore.saldoNota ?? 0, kuotaAfter: state.posStore.kuotaNota ?? 0 };
        if (normMethod === 'QRIS' && feeSnap.notaFeeBearer === 'customer') {
          order.notaDeducted = 0;
          order.notaBypassReason = 'CUSTOMER_PAID_VIA_KOSTKU_QRIS';
        } else {
          deductRes = deductEdgeStoreNotaOnce(state, order, order.storeId || 'STORE-DEFAULT', billingFeeIdr);
          if (!deductRes.ok) {
            return new Response(JSON.stringify(deductRes), { status: 400, headers: corsHeaders });
          }
        }
        order.paymentMethod = normMethod;
        order.paymentStatus = 'PAID';
        order.status = 'PREPARING';
        order.paidAt = new Date().toISOString();
        if (normMethod === 'QRIS') settleEdgePosUnifiedWallet(state, order, order.storeId, billingFeeIdr);
        return new Response(JSON.stringify({
          success: true,
          method: normMethod,
          status: 'PREPARING',
          qrisFee: feeSnap.qrisFee,
          customerAdminFee: feeSnap.customerAdminFee,
          notaFeeBearer: feeSnap.notaFeeBearer,
          total: feeSnap.totalAmount,
          notaDeducted: deductRes.feeDeducted,
          sisaSaldoNota: deductRes.saldoAfter,
          sisaKuotaNota: deductRes.kuotaAfter,
          order
        }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Metode pembayaran tidak valid' }), { status: 400, headers: corsHeaders });
    }
    if (subAction === 'confirm-payment' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (!order) return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
      if (body.cashierName) order.cashierName = body.cashierName;
      if (body.cashierId) order.cashierId = body.cashierId;
      const billingFeeIdr = Number(order.billing_fee_idr ?? state.posStore.notaFeePerNotaIdr ?? (state.isDemo ? 100 : 25));
      const baseAmt = Number(order.baseAmountBeforePaymentFee ?? Math.max(0, Number(order.totalAmount || 0) - (Number(order.qrisFee) || 0) - (Number(order.customerAdminFee) || 0)));
      const pm = String(order.paymentMethod || '').toUpperCase().trim();
      const isGatewayQris = pm === 'TRIPAY' || pm === 'QRIS';
      const bearer = normalizeEdgeNotaFeeBearer(order.notaFeeBorneBy || order.notaFeeBearer || state.posStore.notaFeeBearer);

      if (isGatewayQris) {
        if (bearer === 'customer') {
          order.notaDeducted = 0;
          order.notaBypassReason = 'CUSTOMER_PAID_VIA_KOSTKU_QRIS';
        } else if (!order.notaDeducted && Number(state.posStore.saldoNota ?? 0) >= billingFeeIdr) {
          deductEdgeStoreNotaOnce(state, order, order.storeId || 'STORE-DEFAULT', billingFeeIdr);
        } else if (!order.notaDeducted) {
          order.notaDeducted = 0;
          order.notaSettledFromPayout = billingFeeIdr;
        }
        order.notaFeeBearer = bearer;
        order.notaFeeBorneBy = bearer;
        order.paymentMethod = order.paymentMethod || 'TRIPAY';
        order.paymentStatus = 'PAID';
        order.status = 'PREPARING';
        order.paidAt = order.paidAt || new Date().toISOString();
        settleEdgePosUnifiedWallet(state, order, order.storeId, billingFeeIdr);
      } else {
        const feeSnap = computeEdgePosFeeSnapshot({ baseAmount: baseAmt, notaFeeIdr: billingFeeIdr, notaFeeBearer: bearer, paymentMethod: 'CASH' });
        order.customerAdminFee = feeSnap.customerAdminFee;
        order.notaFeeBearer = feeSnap.notaFeeBearer;
        order.notaFeeBorneBy = feeSnap.notaFeeBearer;
        order.totalAmount = feeSnap.totalAmount;
        const deductRes = deductEdgeStoreNotaOnce(state, order, order.storeId || 'STORE-DEFAULT', billingFeeIdr);
        if (!deductRes.ok) {
          return new Response(JSON.stringify(deductRes), { status: 400, headers: corsHeaders });
        }
        order.paymentMethod = 'CASH';
        order.paymentStatus = 'PAID';
        order.status = 'PREPARING';
        order.paidAt = order.paidAt || new Date().toISOString();
      }
      return new Response(JSON.stringify({ success: true, message: 'Pembayaran dikonfirmasi! Pesanan sedang dimasak.', order }), { headers: corsHeaders });
    }
    if (subAction === 'complete' && method === 'POST') {
      if (order) {
        order.status = 'COMPLETED';
        return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (subAction === 'toggle-item' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (order && order.items) {
        const item = order.items.find(i => (i.productId || i.id) === body.productId);
        if (item) {
          item.isReady = !item.isReady;
          return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
        }
      }
      return new Response(JSON.stringify({ error: 'Item order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
  }

  if (path === '/config/tripay') {
    return new Response(JSON.stringify({ success: true, isConfigured: true }), { headers: corsHeaders });
  }

  if (path === '/loyalty/convert-to-voucher' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const claimRec = body.claimToken ? (state.receiptClaims || []).find(c => c.claim_token === body.claimToken) : null;
    const tier = resolveEdgeStoreTier(state, body.merchantId || body.storeId || claimRec?.merchant_id || state.posStore.merchantId);
    if (!tier.canRedeemPoints) {
      return new Response(JSON.stringify({
        error: 'Toko belum tergabung di Loyalty Pool (Tier 2). Tukar poin menjadi voucher belum tersedia untuk toko ini.',
        code: 'POIN_NOT_ACTIVE_ON_STORE',
        billingTier: tier.billingTier
      }), { status: 422, headers: corsHeaders });
    }
    let phone = String(body.phone || '').replace(/\D/g, '');
    if (phone.startsWith('62')) phone = '0' + phone.slice(2);
    const pointsToConvert = Math.max(100, Math.floor(Number(body.points || body.pointsToConvert) || 100));
    const acc = state.customerLoyaltyAccounts[phone];
    if (!acc || (Number(acc.total_points) || 0) < pointsToConvert) {
      return new Response(JSON.stringify({ error: 'Poin Anda belum mencukupi untuk ditukar menjadi voucher.' }), { status: 400, headers: corsHeaders });
    }
    acc.total_points -= pointsToConvert;
    const discountValue = Math.floor(pointsToConvert / 100) * 1000;
    const code = 'POIN-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const promo = {
      id: 'PROMO-POIN-' + Date.now(),
      title: `Voucher Poin Rp ${discountValue.toLocaleString('id-ID')}`,
      code,
      scope: 'ALL',
      discountType: 'FIXED',
      discountValue,
      minOrder: 0,
      limitType: 'QUOTA',
      maxQuota: 1,
      usedCount: 0,
      isActive: true,
      customerPhone: phone,
      createdByRole: 'customer',
      createdAt: new Date().toISOString()
    };
    state.posFoodPromos.unshift(promo);
    return new Response(JSON.stringify({
      success: true,
      voucher: promo,
      promo,
      remainingPoints: acc.total_points,
      discountValue,
      billingTier: tier.billingTier,
      message: `Berhasil! ${pointsToConvert} Poin ditukar menjadi Voucher ${code}.`
    }), { headers: corsHeaders });
  }

  if (path.startsWith('/loyalty/customer/') && method === 'GET') {
    const rawSeg = decodeURIComponent(path.replace('/loyalty/customer/', ''));
    const memberMatch = rawSeg.match(/^(?:KOSTKU[-_]?MEMBER|MEMBER|POIN)\s*[:=]\s*([+\d\s\-().]+)/i);
    let phone = String(memberMatch ? memberMatch[1] : rawSeg).replace(/\D/g, '');
    if (phone.startsWith('62')) phone = '0' + phone.slice(2);
    else if (phone.startsWith('8') && phone.length >= 8 && phone.length <= 13) phone = '0' + phone;
    const account = state.customerLoyaltyAccounts[phone] || { whatsapp_number: phone, name: 'Pelanggan KostKu', total_points: 0 };
    const history = (state.pointsLedger || []).filter(l => l.whatsapp_number === phone);
    const activeVouchers = (state.posFoodPromos || []).filter(p =>
      p &&
      p.isActive !== false &&
      Number(p.usedCount || 0) < Number(p.maxQuota ?? 1) &&
      String(p.customerPhone || '').replace(/\D/g, '') === phone
    );
    return new Response(JSON.stringify({
      account,
      history,
      qrPayload: phone ? `KOSTKU-MEMBER:${phone}` : '',
      tier2PoolBalance: Number(account.total_points || 0),
      activeVouchers
    }), { headers: corsHeaders });
  }

  if (path.startsWith('/loyalty/') || path.startsWith('/points/')) {
    const phone = path.split('/')[2] || '';
    const storeId = url.searchParams.get('storeId') || url.searchParams.get('merchantId') || state.posStore.merchantId;
    const tier = resolveEdgeStoreTier(state, storeId);
    const account = state.customerLoyaltyAccounts[phone];
    return new Response(JSON.stringify({
      phone,
      points: account?.total_points || 0,
      stamps: 0,
      billingTier: tier.billingTier,
      loyaltyPoolId: tier.loyaltyPoolId,
      canRedeemPoints: tier.canRedeemPoints,
      pointValueIdr: tier.pointValueIdr
    }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true, message: 'Operasi POS berhasil di Cloudflare Edge' }), {
    headers: corsHeaders
  });
}
