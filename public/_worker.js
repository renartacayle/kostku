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

// ============================================================================
// IN-MEMORY POS STORE ON CLOUDFLARE EDGE
// ============================================================================
const posPaidReferences = new Set();
const posStore = {
  storeName: 'KostKu Cafe & Resto (Pusat)',
  location: 'Kawasan KostKu Residence Udinus',
  address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
  city: 'Semarang',
  phone: '081234567890',
  isValidated: true,
  saldoNota: 100000,
  kuotaNota: 1000,
  uid: 'MTR-KASIR-MASTER',
  merchantId: 'MTR-KASIR-MASTER',
  activeBranch: 'MTR-KASIR-MASTER',
  branches: [
    {
      id: 'MTR-KASIR-MASTER',
      name: 'KostKu Cafe & Resto (Pusat)',
      address: 'Jl. Nakula I No. 5-11, Semarang',
      saldoNota: 100000,
      kuotaNota: 1000
    },
    {
      id: 'MTR-CABANG-TEMBALANG',
      name: 'KostKu Kitchen & Coffee Tembalang',
      address: 'Jl. Prof. Soedarto No. 12, Tembalang, Semarang',
      saldoNota: 25000,
      kuotaNota: 250
    },
    {
      id: 'MTR-CABANG-SEKARAN',
      name: 'KostKu Food Corner Unnes Sekaran',
      address: 'Jl. Taman Siswa No. 8, Sekaran, Gunungpati',
      saldoNota: 15000,
      kuotaNota: 150
    }
  ]
};

let posProducts = [
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

let posTables = [
  { id: 'tbl-1', number: 'Meja 01', qrToken: 'MEJA-01-TKN881' },
  { id: 'tbl-2', number: 'Meja 02', qrToken: 'MEJA-02-TKN882' },
  { id: 'tbl-3', number: 'Meja 03', qrToken: 'MEJA-03-TKN883' },
  { id: 'tbl-4', number: 'Meja 04', qrToken: 'MEJA-04-TKN884' },
  { id: 'tbl-5', number: 'Meja 05', qrToken: 'MEJA-05-TKN885' }
];

let posInventory = [
  { id: 'INV-MIE', name: 'Mie Basah Telur Segar', category: 'Bahan Pokok', unit: 'porsi', currentStock: 25, minAlertStock: 15, costPerUnit: 2500, supplier: 'CV Berkah Pangan Mandiri', lastRestocked: new Date().toISOString() },
  { id: 'INV-AYAM', name: 'Daging Ayam Cincang Marinasi', category: 'Protein & Daging', unit: 'gram', currentStock: 450, minAlertStock: 500, costPerUnit: 45, supplier: 'Rumah Potong Unggas Sejahtera', lastRestocked: new Date().toISOString() },
  { id: 'INV-PANGSIT', name: 'Kulit & Pangsit Goreng Crispy', category: 'Topping & Snack', unit: 'pcs', currentStock: 35, minAlertStock: 20, costPerUnit: 800, supplier: 'UMKM Keripik Barokah', lastRestocked: new Date().toISOString() },
  { id: 'INV-MINYAK-CABAI', name: 'Minyak Cabai & Sambal Level', category: 'Bumbu & Saus', unit: 'ml', currentStock: 180, minAlertStock: 200, costPerUnit: 25, supplier: 'Dapur Rempah KostKu', lastRestocked: new Date().toISOString() },
  { id: 'INV-BERAS', name: 'Beras Ramos Premium', category: 'Bahan Pokok', unit: 'gram', currentStock: 5000, minAlertStock: 2000, costPerUnit: 14, supplier: 'Gudang Beras Delanggu', lastRestocked: new Date().toISOString() },
  { id: 'INV-TELUR', name: 'Telur Ayam Negeri Segar', category: 'Protein & Daging', unit: 'butir', currentStock: 18, minAlertStock: 10, costPerUnit: 2000, supplier: 'Peternakan Ayam Makmur', lastRestocked: new Date().toISOString() },
  { id: 'INV-SOSIS', name: 'Sosis Sapi Panggang', category: 'Protein & Daging', unit: 'pcs', currentStock: 24, minAlertStock: 15, costPerUnit: 1500, supplier: 'Distributor Frozen Food', lastRestocked: new Date().toISOString() },
  { id: 'INV-AYAM-POTONG', name: 'Ayam Potong Marinasi Madu', category: 'Protein & Daging', unit: 'potong', currentStock: 12, minAlertStock: 15, costPerUnit: 8000, supplier: 'Rumah Potong Unggas Sejahtera', lastRestocked: new Date().toISOString() },
  { id: 'INV-MADU', name: 'Madu Alami Murni', category: 'Bumbu & Saus', unit: 'ml', currentStock: 350, minAlertStock: 200, costPerUnit: 50, supplier: 'Peternak Lebah Nusantara', lastRestocked: new Date().toISOString() },
  { id: 'INV-KOPI', name: 'Biji Kopi Robusta Blend', category: 'Kopi & Minuman', unit: 'gram', currentStock: 850, minAlertStock: 300, costPerUnit: 150, supplier: 'Roastery Kopi Temanggung', lastRestocked: new Date().toISOString() },
  { id: 'INV-SUSU', name: 'Susu Segar Fresh Milk', category: 'Kopi & Minuman', unit: 'ml', currentStock: 420, minAlertStock: 500, costPerUnit: 20, supplier: 'Koperasi Susu Boyolali', lastRestocked: new Date().toISOString() },
  { id: 'INV-GULA-AREN', name: 'Sirup Gula Aren Organik', category: 'Kopi & Minuman', unit: 'ml', currentStock: 650, minAlertStock: 250, costPerUnit: 35, supplier: 'Produsen Gula Semut Cilacap', lastRestocked: new Date().toISOString() },
  { id: 'INV-TEH', name: 'Daun Teh Melati Wangi', category: 'Kopi & Minuman', unit: 'gram', currentStock: 600, minAlertStock: 200, costPerUnit: 40, supplier: 'Perkebunan Teh Pagilaran', lastRestocked: new Date().toISOString() },
  { id: 'INV-BOX-KERTAS', name: 'Box Kraft Food Grade', category: 'Kemasan & Packaging', unit: 'pcs', currentStock: 80, minAlertStock: 30, costPerUnit: 1200, supplier: 'Pabrik Kemasan Paperindo', lastRestocked: new Date().toISOString() },
  { id: 'INV-CUP-PLASTIK', name: 'Cup Plastik 16oz + Tutup', category: 'Kemasan & Packaging', unit: 'pcs', currentStock: 55, minAlertStock: 25, costPerUnit: 900, supplier: 'Distributor Plastik Semarang', lastRestocked: new Date().toISOString() },
  { id: 'INV-SEDOTAN', name: 'Sedotan Steril Higienis', category: 'Kemasan & Packaging', unit: 'pcs', currentStock: 120, minAlertStock: 50, costPerUnit: 150, supplier: 'Distributor Plastik Semarang', lastRestocked: new Date().toISOString() }
];

let posRecipes = {
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
};

let posFoodPromos = [
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
    limitType: 'QUOTA',
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
    limitType: 'DATE',
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
    limitType: 'BOTH',
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

let posRedeemCodes = [
  {
    id: 'REDEEM-KASIR-50',
    code: 'KASIRBONUS50',
    type: 'KUOTA_NOTA',
    quotaNota: 50,
    saldoBonus: 5000,
    maxQuota: 20,
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
    maxQuota: 10,
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
    maxQuota: 5,
    usedCount: 0,
    usedBy: [],
    description: 'Bonus Kuota Mitra Prioritas 250 Nota (Rp 25.000)',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

let posOrders = [];

function getInventoryAlerts() {
  return posInventory
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

function getRecipesList() {
  return posProducts.map(p => {
    const ingredients = posRecipes[p.id] || [];
    const totalHPP = ingredients.reduce((sum, ing) => {
      const inv = posInventory.find(i => i.id === ing.inventoryId);
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

function calculateAnalytics() {
  const activeOrders = posOrders.filter(o => o.status !== 'CANCELLED');

  // 1. Per Menu Stats
  const menuStatsMap = {};
  posProducts.forEach(p => {
    const ingList = posRecipes[p.id] || [];
    const hppPerPortion = ingList.reduce((sum, ing) => {
      const inv = posInventory.find(i => i.id === ing.inventoryId);
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

  // 2. Per Branch / Store Stats
  const storesList = posStore.branches || [
    { id: 'MTR-KASIR-MASTER', name: 'KostKu Cafe & Resto (Pusat)', address: 'Semarang', saldoNota: 100000, kuotaNota: 1000 }
  ];

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
  activeOrders.forEach(o => {
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

  const perStore = Object.values(perStoreMap).map(s => {
    s.netRevenue = Math.max(0, s.grossRevenue - s.notaFees);
    s.aov = s.totalOrders > 0 ? Math.round(s.grossRevenue / s.totalOrders) : 0;
    return s;
  }).sort((a, b) => b.grossRevenue - a.grossRevenue);

  // 3. Cross-Branch Matrix Per Menu
  const crossBranchPerMenu = posProducts.map(prod => {
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

    activeOrders.forEach(ord => {
      const sid = ord.storeId && branchBreakdown[ord.storeId] ? ord.storeId : primaryStoreId;
      (ord.items || []).forEach(it => {
        const pid = it.productId || it.id;
        if (pid === prod.id) {
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

  // 4. Per Cashier Stats
  const cashierMap = {
    'KSR-01': { cashierId: 'KSR-01', cashierName: 'Siti Rahmawati (Kasir Shift Pagi)', role: 'Kasir Pagi', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 },
    'KSR-02': { cashierId: 'KSR-02', cashierName: 'Budi Santoso (Kasir Shift Siang)', role: 'Kasir Siang', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 },
    'KSR-03': { cashierId: 'KSR-03', cashierName: 'Rian Pratama (Kasir Shift Malam)', role: 'Kasir Malam', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 },
    'KSR-STF': { cashierId: 'KSR-STF', cashierName: 'Pak Joko (Staf Operasional)', role: 'Staf & Runner', ordersCount: 0, revenue: 0, cashHandled: 0, qrisProcessed: 0 }
  };

  activeOrders.forEach(o => {
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

  const perCashier = Object.values(cashierMap).map((c, idx) => {
    c.rank = idx + 1;
    c.avgOrderValue = c.ordersCount > 0 ? Math.round(c.revenue / c.ordersCount) : 0;
    c.performanceRating = c.ordersCount >= 20 ? 'Performa Unggul (Bintang 5 ★★★★★)' : c.ordersCount >= 10 ? 'Sangat Baik (Bintang 4 ★★★★☆)' : 'Baik (Bintang 3 ★★★☆☆)';
    return c;
  }).sort((a, b) => b.revenue - a.revenue);

  const alerts = getInventoryAlerts();
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

// ============================================================================
// HYBRID LOYALTY & DYNAMIC ADMIN FEE WITH EOD BATCH ESCROW DATA MODELS
// ============================================================================
function calculateWibClaimDeadline(transDate = new Date()) {
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wibTime = new Date(transDate.getTime() + wibOffsetMs);
  const year = wibTime.getUTCFullYear();
  const month = wibTime.getUTCMonth();
  const date = wibTime.getUTCDate();
  // Hari D + 1 jam 23:59:59.999 WIB (= 16:59:59.999 UTC)
  return new Date(Date.UTC(year, month, date + 1, 16, 59, 59, 999));
}

const merchantWallets = {
  'MTR-KASIR-MASTER': {
    merchantId: 'MTR-KASIR-MASTER',
    name: 'KostKu Cafe & Resto (Pusat)',
    whatsappNumber: '081234567890',
    available_balance: 100000.00,
    held_promo_balance: 60.00, // 1 pending demo claim * 60
    updatedAt: new Date().toISOString()
  },
  'MTR-CABANG-TEMBALANG': {
    merchantId: 'MTR-CABANG-TEMBALANG',
    name: 'KostKu Kitchen & Coffee Tembalang',
    whatsappNumber: '081234567891',
    available_balance: 25000.00,
    held_promo_balance: 0.00,
    updatedAt: new Date().toISOString()
  },
  'MTR-CABANG-SEKARAN': {
    merchantId: 'MTR-CABANG-SEKARAN',
    name: 'KostKu Food Corner Unnes Sekaran',
    whatsappNumber: '081234567892',
    available_balance: 15000.00,
    held_promo_balance: 0.00,
    updatedAt: new Date().toISOString()
  }
};

let receiptClaims = [];
let customerLoyaltyAccounts = {
  '081234567890': {
    whatsapp_number: '081234567890',
    name: 'Oscar Herdian Wijaya',
    total_points: 250,
    createdAt: new Date().toISOString()
  }
};
let pointsLedger = [];
let walletMutations = [];

let _isEscrowInitialized = false;
function ensureEscrowCollections() {
  if (_isEscrowInitialized) return;
  _isEscrowInitialized = true;

  const now = new Date();
  const todayDeadline = calculateWibClaimDeadline(now);
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const yesterdayDeadline = calculateWibClaimDeadline(yesterday);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  const threeDaysAgoDeadline = calculateWibClaimDeadline(threeDaysAgo);

  receiptClaims = [
    {
      id: 'CLM-DEMO-001',
      order_id: 'ORD-DEMO-001',
      merchant_id: 'MTR-KASIR-MASTER',
      merchant_name: 'KostKu Cafe & Resto (Pusat)',
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
      merchant_name: 'KostKu Cafe & Resto (Pusat)',
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
      merchant_name: 'KostKu Cafe & Resto (Pusat)',
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

  walletMutations = [
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

  pointsLedger = [
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

// ── LUCKY SPIN WHEEL CONFIGURATION (8 EQUAL SLICES - 45° EACH) ──
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

  // Trik C: Pity System (Hard Pity Trigger di putaran ke-5 jika 4 putaran berturut-turut belum jackpot)
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
  // 100 Poin: 15% | 50 Poin: 35% | 25 Poin: 35% | 10 Poin: 15%
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
    sliceIndex = 1; // Near-miss adjacent to 100
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
}

function getWibDateString(date = new Date()) {
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  return new Date(date.getTime() + wibOffsetMs).toISOString().slice(0, 10);
}

const FIREBASE_RTDB_URL = 'https://kostku-10966-default-rtdb.asia-southeast1.firebasedatabase.app';
function syncDeltaToFirebaseAsync(nodePath, payload, method = 'PATCH') {
  try {
    const cleanPath = String(nodePath).replace(/^\//, '');
    fetch(`${FIREBASE_RTDB_URL}/kostku_db/${cleanPath}.json`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (_) {}
}

function executeBatchSettlement() {
  const now = new Date();
  const expiredPending = receiptClaims.filter(c => c.status === 'PENDING' && new Date(c.claim_deadline) < now);
  
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
    if (!merchantWallets[mId]) {
      merchantWallets[mId] = {
        merchantId: mId,
        name: 'Mitra KostKu',
        whatsappNumber: '081234567890',
        available_balance: 0.00,
        held_promo_balance: 0.00,
        updatedAt: now.toISOString()
      };
    }
    
    const wallet = merchantWallets[mId];
    wallet.held_promo_balance = Math.max(0, (wallet.held_promo_balance || 0) - data.totalRefund);
    wallet.available_balance = (wallet.available_balance || 0) + data.totalRefund;
    wallet.updatedAt = now.toISOString();

    if (posStore.merchantId === mId || posStore.uid === mId) {
      posStore.saldoNota = wallet.available_balance;
      posStore.kuotaNota = Math.floor(wallet.available_balance / 100);
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
    walletMutations.unshift(mutation);

    syncDeltaToFirebaseAsync(`merchant_wallets/${mId}`, wallet, 'PATCH');

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
}

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

    // 4. Serve static assets via Cloudflare Pages
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

  // Lazy runtime initialization for Escrow collections with real runtime Date
  ensureEscrowCollections();

  // ── Version & App Health ─────────────────────────────────────────
  if ((path === '/app-version' || path === '/version') && method === 'GET') {
    return new Response(JSON.stringify({
      version: '1.5.2',
      buildDate: '2026-11-12',
      buildNumber: 157,
      appId: 'id.kostku.app'
    }), { headers: corsHeaders });
  }

  // ── HYBRID LOYALTY CLAIM & ESCROW ENDPOINTS ─────────────────────
  // 1. Claim info check for customer claim page (/api/loyalty/claim-info?token=...)
  if ((path === '/loyalty/claim-info' || path === '/pos/claim-info') && method === 'GET') {
    const token = url.searchParams.get('token') || '';
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token struk QR wajib disertakan' }), { status: 400, headers: corsHeaders });
    }
    const claim = receiptClaims.find(c => c.claim_token === token || c.id === token || c.invoice_number === token);
    if (!claim) {
      return new Response(JSON.stringify({ error: 'Data struk tidak ditemukan atau token tidak valid' }), { status: 404, headers: corsHeaders });
    }
    const now = new Date();
    const isDeadlinePassed = now > new Date(claim.claim_deadline);
    let resolvedStatus = claim.status;
    if (claim.status === 'PENDING' && isDeadlinePassed) {
      resolvedStatus = 'EXPIRED';
    }
    return new Response(JSON.stringify({
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
    }), { headers: corsHeaders });
  }

  // 2. Customer claims points with Lucky Spin Wheel (/api/loyalty/claim, /api/pos/claim, /api/loyalty/spin)
  if ((path === '/loyalty/claim' || path === '/pos/claim' || path === '/loyalty/spin' || path === '/pos/loyalty/claim' || path === '/pos/loyalty/spin') && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const token = (body.token || '').trim();
    let rawPhone = String(body.whatsapp || body.phone || '').trim();
    const customerName = (body.name || '').trim();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token struk tidak boleh kosong' }), { status: 400, headers: corsHeaders });
    }

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('62')) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }
    if (!cleanPhone.startsWith('08') || cleanPhone.length < 10 || cleanPhone.length > 15) {
      return new Response(JSON.stringify({ error: 'Nomor WhatsApp tidak valid. Masukkan nomor WhatsApp aktif (contoh: 081234567890).' }), { status: 400, headers: corsHeaders });
    }

    const claim = receiptClaims.find(c => c.claim_token === token || c.id === token || c.invoice_number === token);
    if (!claim) {
      return new Response(JSON.stringify({ error: 'Struk belanja tidak ditemukan atau token QR tidak valid.' }), { status: 404, headers: corsHeaders });
    }

    // Anti Double-Claim Check
    if (claim.status === 'CLAIMED') {
      const redacted = claim.claimed_by_whatsapp ? claim.claimed_by_whatsapp.replace(/(\d{4})\d+(\d{3})/, '$1****$2') : 'nomor lain';
      return new Response(JSON.stringify({
        error: `Struk ini sudah pernah diklaim sebelumnya oleh ${redacted} pada ${new Date(claim.claimed_at || Date.now()).toLocaleString('id-ID')}.`,
        alreadyClaimed: true,
        claimedAt: claim.claimed_at
      }), { status: 400, headers: corsHeaders });
    }

    // Expiry check
    const now = new Date();
    if (claim.status === 'EXPIRED' || now > new Date(claim.claim_deadline)) {
      claim.status = 'EXPIRED';
      return new Response(JSON.stringify({
        error: `Masa klaim struk ini telah berakhir pada ${new Date(claim.claim_deadline).toLocaleString('id-ID')} WIB.`,
        isExpired: true,
        claimDeadline: claim.claim_deadline
      }), { status: 400, headers: corsHeaders });
    }

    // ── SILENT REGISTRATION FOR CUSTOMER & PITY TRACKER ──
    if (!customerLoyaltyAccounts[cleanPhone]) {
      const uniqueCode = 'KST' + cleanPhone.slice(-4) + Math.random().toString(36).substring(2, 5).toUpperCase();
      customerLoyaltyAccounts[cleanPhone] = {
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
    const customer = customerLoyaltyAccounts[cleanPhone];
    if (customerName) customer.name = customerName;
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

    // Audit Ledger Entry for Spinner
    pointsLedger.unshift({
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
    const rawRefCode = (body.referral_code || body.referralCode || '').trim().toUpperCase();

    if (rawRefCode) {
      // Rem Pengaman 2: Anti Self-Referral
      if (customer.referral_code && customer.referral_code.toUpperCase() === rawRefCode) {
        referralResult = { success: false, status: 'SELF_REFERRAL_BLOCKED', message: 'Dilarang menggunakan kode referral milik sendiri!' };
      } else {
        const referrer = Object.values(customerLoyaltyAccounts).find(c => c && c.referral_code && c.referral_code.toUpperCase() === rawRefCode);
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
            referrer.daily_referral_count = (referrer.daily_referral_count || 0) + 1;

            claim.referral_code_used = rawRefCode;
            claim.referrer_whatsapp = referrer.whatsapp_number;
            claim.referrer_points_awarded = referrerBonus;

            pointsLedger.unshift({
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

            syncDeltaToFirebaseAsync(`customers/${referrer.whatsapp_number}`, referrer, 'PUT');
          }
        }
      }
    }

    // Deduct held promo balance from merchant escrow (official platform/promo fee: Rp 60.00)
    const mId = claim.merchant_id || 'MTR-KASIR-MASTER';
    if (merchantWallets[mId]) {
      merchantWallets[mId].held_promo_balance = Math.max(0, (merchantWallets[mId].held_promo_balance || 0) - 60.00);
      merchantWallets[mId].updatedAt = now.toISOString();
      syncDeltaToFirebaseAsync(`merchant_wallets/${mId}`, merchantWallets[mId], 'PATCH');
    }

    // Granular non-blocking delta sync to Firebase RTDB (< 5 KB)
    syncDeltaToFirebaseAsync(`customers/${cleanPhone}`, customer, 'PUT');
    syncDeltaToFirebaseAsync(`receipt_claims/${claim.id}`, {
      status: 'CLAIMED',
      claimed_by_whatsapp: cleanPhone,
      claimed_at: claim.claimed_at,
      points_awarded: claim.points_awarded,
      referral_code_used: claim.referral_code_used || null,
      referrer_whatsapp: claim.referrer_whatsapp || null,
      referrer_points_awarded: claim.referrer_points_awarded || 0
    }, 'PATCH');

    return new Response(JSON.stringify({
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
    }), { headers: corsHeaders });
  }

  // 3. Customer Points Lookup (/api/loyalty/customer/:phone)
  if (path.startsWith('/loyalty/customer/') && method === 'GET') {
    let phone = path.replace('/loyalty/customer/', '').replace(/\D/g, '');
    if (phone.startsWith('62')) phone = '0' + phone.slice(2);
    const account = customerLoyaltyAccounts[phone] || { whatsapp_number: phone, name: 'Pelanggan Baru', total_points: 0 };
    const history = pointsLedger.filter(l => l.whatsapp_number === phone);
    return new Response(JSON.stringify({
      account,
      history
    }), { headers: corsHeaders });
  }

  // 4. Merchant Wallet & Escrow Ledger (/api/merchant/wallet or /api/pos/wallet)
  if (path.startsWith('/merchant/wallet') || path.startsWith('/pos/wallet')) {
    const mId = url.searchParams.get('merchantId') || posStore.activeBranch || 'MTR-KASIR-MASTER';
    
    // Opportunistic settlement check: if any overdue claims exist, auto settle them
    executeBatchSettlement();

    if (!merchantWallets[mId]) {
      merchantWallets[mId] = {
        merchantId: mId,
        name: posStore.storeName || 'KostKu Cafe & Resto (Pusat)',
        whatsappNumber: posStore.phone || '081234567890',
        available_balance: posStore.saldoNota || 100000.00,
        held_promo_balance: 0.00,
        updatedAt: new Date().toISOString()
      };
    }

    const wallet = merchantWallets[mId];
    const claims = receiptClaims.filter(c => c.merchant_id === mId || !c.merchant_id);
    const pendingCount = claims.filter(c => c.status === 'PENDING').length;
    
    // Recalculate held_promo_balance strictly: pendingCount * 60
    wallet.held_promo_balance = pendingCount * 60.00;

    const mutations = walletMutations.filter(m => m.merchant_id === mId || !m.merchant_id);

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

  // 5. Batch Settlement Worker (Cron 00:01 WIB / Manual Admin Trigger)
  if ((path === '/admin/run-batch-settlement' || path === '/pos/run-batch-settlement') && method === 'POST') {
    const result = executeBatchSettlement();
    return new Response(JSON.stringify(result), { headers: corsHeaders });
  }

  // ── POS & TABLE QR ENGINE ENDPOINTS (/api/pos/*) ─────────────────
  if (path.startsWith('/pos/')) {
    const posPath = path.replace(/^\/pos/, '');
    return await handlePosApi(request, posPath, method, url);
  }

  // ── Universal TriPay Webhook Callback listener ───────────────────
  if (path === '/payments/tripay-callback' || path === '/payments/callback' || path === '/tripay-callback') {
    return await handlePosApi(request, '/tripay/callback', method, url);
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

  // ── Merchants Catalog & Registration (/merchants or /merchants/create) ──
  if (path === '/merchants' || path === '/merchants/create') {
    if (method === 'GET') {
      return new Response(JSON.stringify(registeredMerchants), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = (body.name || '').trim();
      const phone = (body.phone || '').replace(/\D/g, '');
      const refCode = (body.referralCode || body.friendReferralCode || '').trim().toUpperCase();

      if (!name) {
        return new Response(JSON.stringify({ error: 'Nama toko/mitra wajib diisi' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const normName = name.toLowerCase();
      // Deduplication check
      const isAlreadyRegistered = registeredMerchants.some(m => 
        (m.name && m.name.toLowerCase() === normName) ||
        (phone && m.phone && m.phone.replace(/\D/g, '') === phone)
      );

      let bonusAwarded = false;
      let bonusPoints = 0;
      let initialSaldoNota = 5000;
      let initialKuotaNota = 50;

      if (refCode) {
        if (isAlreadyRegistered) {
          bonusAwarded = false;
        } else {
          bonusAwarded = true;
          bonusPoints = 500;
          initialSaldoNota = 50000; // 500 Nota Gratis (Rp 50.000 non-withdrawable)
          initialKuotaNota = 500;

          // Award +500 Poin to Referrer
          const referrer = Object.values(customerLoyaltyAccounts).find(c => 
            (c.referral_code && c.referral_code.toUpperCase() === refCode) ||
            (c.whatsapp_number && c.whatsapp_number.replace(/\D/g, '') === refCode.replace(/\D/g, ''))
          );

          if (referrer) {
            referrer.total_points = (referrer.total_points || 0) + bonusPoints;
            pointsLedger.unshift({
              id: 'REF-MITRA-' + Date.now(),
              whatsapp_number: referrer.whatsapp_number,
              change_type: 'EARN_REFERRAL_MERCHANT',
              points: bonusPoints,
              notes: `Bonus pendaftaran mitra baru: ${name} (Kode: ${refCode})`,
              createdAt: new Date().toISOString()
            });
            syncDeltaToFirebaseAsync(`customers/${referrer.whatsapp_number}`, referrer, 'PUT');
          }
        }
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
        saldoNota: initialSaldoNota,
        kuotaNota: initialKuotaNota,
        bonusAwarded,
        referredByCode: bonusAwarded ? refCode : null,
        products: body.products || [],
        createdAt: new Date().toISOString()
      };

      registeredMerchants.push(newMerchant);
      
      merchantWallets[newMerchant.id] = {
        merchantId: newMerchant.id,
        name: newMerchant.name,
        whatsappNumber: phone,
        available_balance: initialSaldoNota,
        held_promo_balance: 0.00,
        updatedAt: new Date().toISOString()
      };

      syncDeltaToFirebaseAsync(`merchants/${newMerchant.id}`, newMerchant, 'PUT');
      syncDeltaToFirebaseAsync(`merchant_wallets/${newMerchant.id}`, merchantWallets[newMerchant.id], 'PUT');

      return new Response(JSON.stringify({
        success: true,
        merchant: newMerchant,
        bonusAwarded,
        bonusPoints,
        isAlreadyRegistered,
        message: bonusAwarded
          ? `🎉 Selamat! Toko berhasil didaftarkan via referral. Anda mendapatkan 500 Transaksi Kasir GRATIS (Rp 50.000)!`
          : 'Toko mitra berhasil didaftarkan dengan kuota awal 50 nota.'
      }), { status: 201, headers: corsHeaders });
    }
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
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  // ── Google Client ID ────────────────────────────────────────────
  if (path === '/google-client-id') {
    return new Response(JSON.stringify({
      clientId: '416599367292-3h9001mfd1dk7shnqo3fgpjs47s7oofe.apps.googleusercontent.com'
    }), { headers: corsHeaders });
  }

  // Fallback GET
  if (method === 'GET') {
    return new Response(JSON.stringify([]), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true, message: 'Operasi berhasil diproses di Cloudflare Edge' }), {
    headers: corsHeaders
  });
}

// ============================================================================
// POS ROUTER HANDLER FOR CLOUDFLARE EDGE
// ============================================================================
async function handlePosApi(request, path, method, url) {
  // 1. GET /pos/store
  if (path === '/store') {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        storeName: posStore.storeName,
        location: posStore.location,
        address: posStore.address,
        city: posStore.city,
        phone: posStore.phone,
        isValidated: posStore.isValidated,
        saldoNota: posStore.saldoNota,
        kuotaNota: posStore.kuotaNota,
        uid: posStore.uid,
        merchantId: posStore.merchantId,
        activeBranch: posStore.activeBranch,
        branches: posStore.branches
      }), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      Object.assign(posStore, body);
      return new Response(JSON.stringify({
        success: true,
        message: 'Pengaturan toko kasir berhasil disimpan di Cloudflare Edge',
        store: posStore
      }), { headers: corsHeaders });
    }
  }

  // 2. POST /pos/store/switch
  if (path === '/store/switch' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (body.storeId) {
      posStore.activeBranch = body.storeId;
    }
    return new Response(JSON.stringify({
      success: true,
      activeBranch: posStore.activeBranch,
      message: 'Cabang berhasil dialihkan'
    }), { headers: corsHeaders });
  }

  // 3. POST /pos/topup-nota
  if (path === '/topup-nota' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const addSaldo = Number(body.amount) || 10000;
    const addQuota = Number(body.quota) || Math.max(1, Math.floor(addSaldo / 100));
    posStore.kuotaNota = (Number(posStore.kuotaNota) || 0) + addQuota;
    posStore.saldoNota = (Number(posStore.saldoNota) || 0) + addSaldo;
    if (Array.isArray(posStore.branches)) {
      posStore.branches.forEach(b => {
        if (b.id === posStore.activeBranch) {
          b.saldoNota = posStore.saldoNota;
          b.kuotaNota = posStore.kuotaNota;
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: `Top up kuota kasir berhasil (+${addQuota} nota)`,
      saldoNota: posStore.saldoNota,
      kuotaNota: posStore.kuotaNota
    }), { headers: corsHeaders });
  }

  // 3B. POST /pos/topup-tripay
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

  // 3C. POST /pos/topup-tripay/confirm
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

    // 1. Cek apakah sudah lunas via webhook callback sebelumnya
    if (posPaidReferences.has(reference)) {
      return new Response(JSON.stringify({
        success: true,
        isPaid: true,
        status: 'PAID',
        message: `🎉 Pembayaran TriPay TERVERIFIKASI (PAID via Webhook)! +${addQuota} kuota nota telah aktif.`,
        saldoNota: posStore.saldoNota,
        kuotaNota: posStore.kuotaNota,
        reference
      }), { headers: corsHeaders });
    }

    // 2. Cek langsung ke TriPay Transaction Detail API
    const apiKey = '8lgqWBCHk8xLycXV3aRjfn5YBrDUZtJCe13muUy5';
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
          return new Response(JSON.stringify({
            success: false,
            isPaid: false,
            status,
            error: `⚠️ Status di TriPay masih ${status || 'UNPAID'} (Belum Dibayar). Sistem telah mengecek ke TriPay namun dana belum masuk. Silakan selesaikan pembayaran QRIS terlebih dahulu.`,
            tripayDetail: tripayData.data
          }), { status: 400, headers: corsHeaders });
        }
        posPaidReferences.add(reference);
      } else {
        // TriPay returned notice/error (e.g. Unauthorized IP or not found)
        const tripayMsg = tripayData?.message || 'Gagal menghubungi server TriPay';
        const ipMatch = tripayMsg.match(/\((.*?)\)/)?.[1] || '';
        let userError = `⚠️ Pengecekan TriPay: ${tripayMsg}`;
        if (ipMatch) {
          userError = `⚠️ IP Server Cloudflare (${ipMatch}) belum terdaftar di Whitelist IP TriPay (T53543). Silakan kosongkan Whitelist IP di dashboard TriPay.`;
        } else if (tripayMsg.toLowerCase().includes('undefined parameter') || tripayMsg.toLowerCase().includes('tidak ditemukan')) {
          userError = `ℹ️ Status TriPay: Pembayaran QRIS belum terdeteksi masuk (UNPAID). Silakan selesaikan pembayaran QRIS di aplikasi e-wallet/m-banking Anda terlebih dahulu.`;
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

    // Hanya jika TriPay terverifikasi PAID
    posPaidReferences.add(reference);
    posStore.kuotaNota = (Number(posStore.kuotaNota) || 0) + addQuota;
    posStore.saldoNota = (Number(posStore.saldoNota) || 0) + addSaldo;
    if (Array.isArray(posStore.branches)) {
      posStore.branches.forEach(b => {
        if (b.id === posStore.activeBranch) {
          b.saldoNota = posStore.saldoNota;
          b.kuotaNota = posStore.kuotaNota;
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      isPaid: true,
      status: 'PAID',
      message: `🎉 Pembayaran TriPay TERVERIFIKASI (PAID)! +${addQuota} kuota nota telah aktif.`,
      saldoNota: posStore.saldoNota,
      kuotaNota: posStore.kuotaNota,
      reference: reference || 'TRIPAY-VERIFIED'
    }), { headers: corsHeaders });
  }

  // 3D. POST /pos/tripay/callback (Official Webhook Callback dari TriPay)
  if ((path === '/tripay/callback' || path === '/callback/tripay') && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const reference = body.reference || body.merchant_ref || '';
    const status = String(body.status || '').toUpperCase();
    const amount = Number(body.total_amount || body.amount) || 10000;
    const quota = Math.max(1, Math.floor(amount / 100));

    if (status === 'PAID') {
      if (reference) posPaidReferences.add(reference);
      posStore.kuotaNota = (Number(posStore.kuotaNota) || 0) + quota;
      posStore.saldoNota = (Number(posStore.saldoNota) || 0) + amount;
      return new Response(JSON.stringify({ success: true, message: 'Callback processed' }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true, message: 'Status recorded: ' + status }), { headers: corsHeaders });
  }

  // 4. GET /pos/redeem-codes
  if (path === '/redeem-codes') {
    if (method === 'GET') {
      return new Response(JSON.stringify(posRedeemCodes), { headers: corsHeaders });
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
      posRedeemCodes.unshift(newRedeem);
      return new Response(JSON.stringify({
        success: true,
        message: 'Kode redeem kustom berhasil dibuat',
        redeemCode: newRedeem
      }), { status: 201, headers: corsHeaders });
    }
  }

  // 5. POST /pos/redeem-code/claim
  if (path === '/redeem-code/claim' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const code = (body.code || '').trim().toUpperCase();
    const item = posRedeemCodes.find(r => r.code === code && r.isActive);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Kode redeem tidak valid atau sudah tidak aktif' }), { status: 400, headers: corsHeaders });
    }
    if (item.maxQuota && item.usedCount >= item.maxQuota) {
      return new Response(JSON.stringify({ error: 'Kuota penukaran kode redeem ini sudah habis' }), { status: 400, headers: corsHeaders });
    }
    item.usedCount += 1;
    posStore.kuotaNota += item.quotaNota;
    posStore.saldoNota += item.saldoBonus;
    return new Response(JSON.stringify({
      success: true,
      message: `Selamat! Anda mendapatkan tambahan ${item.quotaNota} Kuota Nota Kasir!`,
      addedQuota: item.quotaNota,
      addedSaldo: item.saldoBonus,
      newQuotaNota: posStore.kuotaNota,
      newSaldoNota: posStore.saldoNota
    }), { headers: corsHeaders });
  }

  // 6. GET & POST /pos/promos
  if (path === '/promos') {
    if (method === 'GET') {
      return new Response(JSON.stringify({ success: true, promos: posFoodPromos }), { headers: corsHeaders });
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
      posFoodPromos.unshift(newPromo);
      return new Response(JSON.stringify({ success: true, promo: newPromo }), { status: 200, headers: corsHeaders });
    }
  }

  // 7. PUT /pos/promos/:id/toggle
  if (path.startsWith('/promos/') && path.endsWith('/toggle') && method === 'PUT') {
    const id = path.replace('/promos/', '').replace('/toggle', '');
    const p = posFoodPromos.find(x => x.id === id);
    if (p) {
      p.isActive = !p.isActive;
      return new Response(JSON.stringify({ success: true, promo: p }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Promo tidak ditemukan' }), { status: 404, headers: corsHeaders });
  }

  // 8. DELETE /pos/promos/:id
  if (path.startsWith('/promos/') && method === 'DELETE') {
    const id = path.replace('/promos/', '');
    posFoodPromos = posFoodPromos.filter(x => x.id !== id);
    return new Response(JSON.stringify({ success: true, message: 'Promo berhasil dihapus' }), { headers: corsHeaders });
  }

  // 9. POST /pos/promos/validate
  if (path === '/promos/validate' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const code = (body.code || '').trim().toUpperCase();
    const orderTotal = Number(body.orderTotal) || 0;
    const promo = posFoodPromos.find(p => p.code === code && p.isActive);

    if (!promo) {
      return new Response(JSON.stringify({ valid: false, message: 'Kode promo tidak valid atau tidak aktif' }), { headers: corsHeaders });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (promo.limitType === 'DATE' || promo.limitType === 'BOTH') {
      if (promo.expiryDate && todayStr > promo.expiryDate) {
        return new Response(JSON.stringify({ valid: false, message: 'Masa berlaku promo ini telah berakhir' }), { headers: corsHeaders });
      }
    }
    if (promo.limitType === 'QUOTA' || promo.limitType === 'BOTH') {
      if (promo.maxQuota !== null && promo.usedCount >= promo.maxQuota) {
        return new Response(JSON.stringify({ valid: false, message: 'Kuota pemakaian promo ini telah habis' }), { headers: corsHeaders });
      }
    }
    if (orderTotal < (promo.minOrder || 0)) {
      return new Response(JSON.stringify({
        valid: false,
        message: `Minimal belanja Rp ${promo.minOrder.toLocaleString('id-ID')} untuk menggunakan promo ini`
      }), { headers: corsHeaders });
    }

    let discountAmount = 0;
    if (promo.discountType === 'PERCENT') {
      discountAmount = Math.round((orderTotal * promo.discountValue) / 100);
    } else {
      discountAmount = Number(promo.discountValue) || 0;
    }

    return new Response(JSON.stringify({
      valid: true,
      discountAmount,
      promo,
      message: `Promo ${promo.title} berhasil diterapkan! Hemat Rp ${discountAmount.toLocaleString('id-ID')}`
    }), { headers: corsHeaders });
  }

  // 10. GET & POST /pos/products
  if (path === '/products') {
    if (method === 'GET') {
      return new Response(JSON.stringify(posProducts), { headers: corsHeaders });
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
        image: body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
      };
      posProducts.push(newProduct);
      return new Response(JSON.stringify(newProduct), { status: 201, headers: corsHeaders });
    }
  }

  // 11. PUT & DELETE /pos/products/:id
  if (path.startsWith('/products/')) {
    const id = path.replace('/products/', '');
    if (method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const p = posProducts.find(x => x.id === id);
      if (p) {
        Object.assign(p, body);
        return new Response(JSON.stringify(p), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Produk tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (method === 'DELETE') {
      posProducts = posProducts.filter(x => x.id !== id);
      return new Response(JSON.stringify({ success: true, message: 'Produk berhasil dihapus' }), { headers: corsHeaders });
    }
  }

  // 12. GET & POST /pos/tables
  if (path === '/tables') {
    if (method === 'GET') {
      return new Response(JSON.stringify(posTables), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newTable = {
        id: 'tbl-' + Date.now(),
        number: body.number || `Meja ${posTables.length + 1}`,
        qrToken: `MEJA-${posTables.length + 1}-TKN${Math.floor(Math.random() * 900 + 100)}`
      };
      posTables.push(newTable);
      return new Response(JSON.stringify(newTable), { status: 201, headers: corsHeaders });
    }
  }

  // 13. GET & POST /pos/inventory
  if (path === '/inventory') {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        inventory: posInventory,
        alerts: getInventoryAlerts()
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
      posInventory.push(newItem);
      return new Response(JSON.stringify({ success: true, item: newItem }), { status: 201, headers: corsHeaders });
    }
  }

  // 14. PUT & DELETE /pos/inventory/:id
  if (path.startsWith('/inventory/') && !path.includes('/restock')) {
    const id = path.replace('/inventory/', '');
    if (method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const item = posInventory.find(x => x.id === id);
      if (item) {
        Object.assign(item, body);
        return new Response(JSON.stringify({ success: true, item }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Item gudang tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }
    if (method === 'DELETE') {
      posInventory = posInventory.filter(x => x.id !== id);
      return new Response(JSON.stringify({ success: true, message: 'Item berhasil dihapus dari gudang' }), { headers: corsHeaders });
    }
  }

  // 15. POST /pos/inventory/restock
  if (path === '/inventory/restock' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const item = posInventory.find(x => x.id === body.inventoryId);
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

  // 16. GET /pos/recipes
  if (path === '/recipes') {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        recipes: getRecipesList()
      }), { headers: corsHeaders });
    }
  }

  // 17. PUT /pos/recipes/:productId
  if (path.startsWith('/recipes/') && method === 'PUT') {
    const pid = path.replace('/recipes/', '');
    const body = await request.json().catch(() => ({}));
    posRecipes[pid] = body.ingredients || [];
    return new Response(JSON.stringify({
      success: true,
      productId: pid,
      ingredients: posRecipes[pid],
      message: 'Resep bahan baku menu berhasil diperbarui'
    }), { headers: corsHeaders });
  }

  // 18. GET /pos/analytics
  if (path === '/analytics' && method === 'GET') {
    return new Response(JSON.stringify(calculateAnalytics()), { headers: corsHeaders });
  }

  // 19. GET & POST /pos/orders or /pos/checkout
  if (path === '/orders' || path === '/checkout') {
    if (method === 'GET') {
      return new Response(JSON.stringify(posOrders), { headers: corsHeaders });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const items = (body.items || []).map(it => ({
        ...it,
        productId: it.productId || it.id,
        isReady: false
      }));

      const subtotal = items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.qty) || 1)), 0);
      const discount = Number(body.discountAmount || 0);
      const totalAmount = Math.max(0, subtotal - discount);

      // AUTOMATIC INVENTORY DEDUCTION FROM RECIPES
      items.forEach(it => {
        const pid = it.productId;
        const qty = Number(it.qty) || 1;
        const ingredients = posRecipes[pid] || [];
        ingredients.forEach(ing => {
          const inv = posInventory.find(i => i.id === ing.inventoryId);
          if (inv) {
            inv.currentStock = Math.max(0, (Number(inv.currentStock) || 0) - ((Number(ing.amount) || 0) * qty));
          }
        });
      });

      const storeId = body.storeId || posStore.activeBranch || 'MTR-KASIR-MASTER';
      const storeName = body.storeName || posStore.storeName || 'KostKu Cafe & Resto (Pusat)';
      const now = new Date();
      const orderId = 'POS-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
      const invoiceNumber = 'INV-' + now.toISOString().slice(0, 10).replace(/-/g, '') + '-' + orderId.slice(-4);
      const claimDeadline = calculateWibClaimDeadline(now);
      const claimToken = 'clm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      const qrClaimUrl = `https://kostku.riuph.me/claim?token=${claimToken}`;

      // HYBRID DYNAMIC FEE: Rp 40 Flat Platform Base + Rp 60 Held Promo Escrow
      const BASE_ADMIN_FEE = 40.00;
      const HELD_PROMO_FEE = 60.00;
      const TOTAL_ADMIN_DEDUCT = 100.00;

      if (!merchantWallets[storeId]) {
        merchantWallets[storeId] = {
          merchantId: storeId,
          name: storeName,
          whatsappNumber: '081234567890',
          available_balance: 100000.00,
          held_promo_balance: 0.00,
          updatedAt: now.toISOString()
        };
      }

      const wallet = merchantWallets[storeId];
      const effectiveKuota = (posStore.merchantId === storeId || posStore.uid === storeId)
        ? (posStore.kuotaNota ?? 50)
        : Math.floor((wallet.available_balance || 0) / 100);

      if (effectiveKuota <= 0 && (wallet.available_balance || 0) < TOTAL_ADMIN_DEDUCT) {
        return new Response(JSON.stringify({
          error: '⚠️ Kuota nota kasir habis! Silakan lakukan Top Up Saldo Nota untuk melanjutkan pencetakan struk transaksi.',
          requiresTopupNota: true,
          kuotaNota: 0,
          saldoNota: wallet.available_balance || 0
        }), { status: 402, headers: corsHeaders });
      }

      wallet.available_balance = Math.max(0, (wallet.available_balance || 100000) - TOTAL_ADMIN_DEDUCT);
      wallet.held_promo_balance = (wallet.held_promo_balance || 0) + HELD_PROMO_FEE;
      wallet.updatedAt = now.toISOString();

      if (posStore.merchantId === storeId || posStore.uid === storeId) {
        posStore.saldoNota = wallet.available_balance;
        posStore.kuotaNota = Math.max(0, (posStore.kuotaNota !== undefined ? posStore.kuotaNota - 1 : Math.floor(wallet.available_balance / 100)));
      }

      const remainingKuotaNota = (posStore.merchantId === storeId || posStore.uid === storeId)
        ? posStore.kuotaNota
        : Math.floor(wallet.available_balance / 100);
      const isLowQuota = remainingKuotaNota <= 15;
      const lowQuotaWarning = isLowQuota
        ? `⚠️ Kuota nota gratis Anda tersisa ${remainingKuotaNota} transaksi. Lakukan top up agar operasional kasir tetap lancar.`
        : null;

      // Record 1-time single use receipt claim
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
        createdAt: now.toISOString()
      };
      receiptClaims.unshift(claimRecord);

      // Record wallet mutation
      walletMutations.unshift({
        id: 'MUT-DED-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
        merchant_id: storeId,
        type: 'FEE_DEDUCT',
        amount: -TOTAL_ADMIN_DEDUCT,
        base_admin_fee: BASE_ADMIN_FEE,
        held_promo_fee: HELD_PROMO_FEE,
        description: `Biaya Nota #${invoiceNumber} (Rp 40 Platform & Server + Rp 60 Deposit Promo Tertahan)`,
        balance_after: wallet.available_balance,
        createdAt: now.toISOString()
      });

      // Granular Delta Sync ke Firebase RTDB (< 5 KB payload)
      syncDeltaToFirebaseAsync(`pos_orders/${orderId}`, { id: orderId, invoice_number: invoiceNumber, totalAmount }, 'PUT');
      syncDeltaToFirebaseAsync(`receipt_claims/${claimRecord.id}`, claimRecord, 'PUT');
      syncDeltaToFirebaseAsync(`merchant_wallets/${storeId}`, wallet, 'PATCH');

      const newOrder = {
        id: orderId,
        invoice_number: invoiceNumber,
        invoice: invoiceNumber,
        customerName: body.customerName || 'Tamu Resto',
        customerPhone: body.customerPhone || '',
        tableNumber: body.tableNumber || 'Takeaway',
        items,
        subtotal,
        discountAmount: discount,
        totalAmount,
        paymentMethod: body.paymentMethod || 'CASH',
        status: body.status || 'PENDING_CONFIRMATION',
        storeId,
        storeName,
        cashierId: body.cashierId || 'KSR-01',
        cashierName: body.cashierName || 'Siti Rahmawati (Kasir)',
        base_admin_fee: BASE_ADMIN_FEE,
        held_promo_fee: HELD_PROMO_FEE,
        claim_token: claimToken,
        claimToken: claimToken,
        qr_claim_url: qrClaimUrl,
        qrClaimUrl: qrClaimUrl,
        claim_deadline: claimDeadline.toISOString(),
        claimDeadline: claimDeadline.toISOString(),
        kuotaNota: remainingKuotaNota,
        isLowQuota,
        lowQuotaWarning,
        createdAt: now.toISOString()
      };

      posOrders.unshift(newOrder);
      return new Response(JSON.stringify({
        ...newOrder,
        invoice: invoiceNumber,
        total: totalAmount,
        qr_claim_url: qrClaimUrl,
        claim_token: claimToken,
        claim_deadline: claimDeadline.toISOString(),
        kuotaNota: remainingKuotaNota,
        isLowQuota,
        lowQuotaWarning
      }), { status: 200, headers: corsHeaders });
    }
  }

  // 20. Single Order Operations (/pos/orders/:id/*)
  if (path.startsWith('/orders/')) {
    const parts = path.replace('/orders/', '').split('/');
    const orderId = parts[0];
    const subAction = parts[1];

    const order = posOrders.find(o => o.id === orderId);

    if (!subAction && method === 'GET') {
      if (order) return new Response(JSON.stringify(order), { headers: corsHeaders });
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }

    if (subAction === 'table' && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      const body = await request.json().catch(() => ({}));
      if (order) {
        if (body.tableNumber) order.tableNumber = body.tableNumber;
        if (body.customerName) order.customerName = body.customerName;
        syncDeltaToFirebaseAsync(`pos_orders/${orderId}`, { tableNumber: order.tableNumber, customerName: order.customerName }, 'PATCH');
        return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }

    if (!subAction && method === 'PATCH') {
      const body = await request.json().catch(() => ({}));
      if (order) {
        if (body.tableNumber !== undefined) order.tableNumber = body.tableNumber;
        if (body.customerName !== undefined) order.customerName = body.customerName;
        syncDeltaToFirebaseAsync(`pos_orders/${orderId}`, { tableNumber: order.tableNumber, customerName: order.customerName }, 'PATCH');
        return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }

    if (subAction === 'acc' && method === 'POST') {
      if (order) {
        order.status = 'CONFIRMED';
        return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }

    if (subAction === 'reject' && method === 'POST') {
      if (order) {
        order.status = 'CANCELLED';
        // RESTORE INVENTORY
        (order.items || []).forEach(it => {
          const pid = it.productId || it.id;
          const qty = Number(it.qty) || 1;
          const ingredients = posRecipes[pid] || [];
          ingredients.forEach(ing => {
            const inv = posInventory.find(i => i.id === ing.inventoryId);
            if (inv) {
              inv.currentStock = (Number(inv.currentStock) || 0) + ((Number(ing.amount) || 0) * qty);
            }
          });
        });
        return new Response(JSON.stringify({ success: true, order, message: 'Order dibatalkan dan stok gudang dipulihkan' }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }

    if (subAction === 'pay' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (order) {
        order.status = 'PAID';
        order.paymentMethod = body.paymentMethod || order.paymentMethod || 'CASH';
        return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
    }

    if (subAction === 'confirm-payment' && method === 'POST') {
      if (order) {
        order.status = 'PAID';
        return new Response(JSON.stringify({ success: true, order }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Order tidak ditemukan' }), { status: 404, headers: corsHeaders });
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

  // 21. Config Tripay
  if (path === '/config/tripay') {
    return new Response(JSON.stringify({ success: true, isConfigured: true }), { headers: corsHeaders });
  }

  // 22. Loyalty & Points
  if (path.startsWith('/loyalty/') || path.startsWith('/points/')) {
    const phone = path.split('/')[2] || '';
    return new Response(JSON.stringify({ phone, points: 250, stamps: 3 }), { headers: corsHeaders });
  }

  // Default fallback
  return new Response(JSON.stringify({ success: true, message: 'Operasi POS berhasil di Cloudflare Edge' }), {
    headers: corsHeaders
  });
}
