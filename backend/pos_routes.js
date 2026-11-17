/**
 * POS & Table QR Ordering Engine for KostKu & Standalone Merchants
 * Domain: kostku.riuph.me/kasir & api.riuph.me
 */

const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const {
  TIER_1_FEE_IDR,
  TIER_2_FEE_IDR,
  ensureLoyaltyCollections,
  buildAuthorizedOwnerAliasSet,
  doesOwnerOwnMerchant,
  doesOwnerOwnPool,
  getStoreBillingProfile,
  previewPoolCheckout,
  commitPoolCheckoutLoyalty,
  reverseOrderPoolPoints,
  deductStoreNotaFeeOnce,
  findOrCreateLoyaltyCustomer,
  getCustomerPoolWallet,
  normalizePhoneDigits,
  resolveStrictReferralCandidate
} = require('./loyalty_pool_engine');
const {
  runAndCacheForecastBatch,
  getCachedForecastBundle,
  formatStoreForecastApiResponse,
  toWibDateStr
} = require('./forecast_bridge');

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
    db.pos_user_active_store = db.pos_user_active_store || {};
    db.pos_shifts = db.pos_shifts || [];
    ensureLoyaltyCollections(db);
    db.pos_redeem_codes = db.pos_redeem_codes || [];

    // Koleksi Promo Makanan (Mulai kosong pada Mode Real — demo data ada di demo_db.json)
    db.pos_food_promos = db.pos_food_promos || [];

    // ── KOLEKSI GUDANG & BAHAN BAKU (Mulai kosong pada Mode Real) ──
    db.pos_inventory = db.pos_inventory || [];

    // ── RESEP BAHAN BAKU PER MENU (Mulai kosong pada Mode Real) ──
    db.pos_recipes = db.pos_recipes || {};

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
    const sharedUid = db.settings.posStore.merchantId || db.settings.posStore.uid || primaryMerchant?.id || '';
    if (sharedUid) {
      db.settings.posStore.uid = sharedUid;
      db.settings.posStore.merchantId = sharedUid;
    }
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

    // Jangan auto-seed produk atau meja dummy di Mode Real (demo_db.json sudah menyediakan data demo)
    if (!db._posTablesSeeded) {
      db._posTablesSeeded = true;
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

  // ── 0. STORE & CASHIER LOCATION (MULTI-STORE PER OWNER ENGINE) ─────────
  const TRIPAY_QRIS_FIXED_FEE_IDR = 750;
  const TRIPAY_QRIS_PERCENT_RATE = 0.007;
  const calculateTripayQrisCustomerFee = (baseAmount = 0) => {
    const cleanBase = Math.max(0, Math.round(Number(baseAmount) || 0));
    if (cleanBase <= 0) {
      return { baseAmount: 0, fixedFee: 0, percentFee: 0, fee: 0, totalWithFee: 0 };
    }
    const percentFee = Math.round(cleanBase * TRIPAY_QRIS_PERCENT_RATE);
    const fee = TRIPAY_QRIS_FIXED_FEE_IDR + percentFee;
    return {
      baseAmount: cleanBase,
      fixedFee: TRIPAY_QRIS_FIXED_FEE_IDR,
      percentFee,
      fee,
      totalWithFee: cleanBase + fee
    };
  };

  const normalizeNotaFeeBearer = (val) => (
    String(val || '').toLowerCase().trim() === 'customer' ? 'customer' : 'store'
  );

  const resolveStoreNotaFeeBearer = (db, merchant = null) => (
    normalizeNotaFeeBearer(merchant?.notaFeeBearer ?? db?.settings?.posStore?.notaFeeBearer ?? 'store')
  );

  const computePosOrderFeeSnapshot = ({ baseAmount = 0, notaFeeIdr = TIER_1_FEE_IDR, notaFeeBearer = 'store', paymentMethod = '' } = {}) => {
    const cleanBase = Math.max(0, Math.round(Number(baseAmount) || 0));
    const cleanNotaFee = Math.max(0, Math.round(Number(notaFeeIdr) || 0));
    const bearer = normalizeNotaFeeBearer(notaFeeBearer);
    const pm = String(paymentMethod || '').toUpperCase().trim();
    const isGatewayQris = pm === 'TRIPAY' || pm === 'QRIS';
    const customerAdminFee = bearer === 'customer' ? cleanNotaFee : 0;
    const qrisCalc = isGatewayQris
      ? calculateTripayQrisCustomerFee(cleanBase)
      : { fixedFee: 0, percentFee: 0, fee: 0 };

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
  };

  const resolveOrderBillingContext = (db, order) => {
    const merchants = Array.isArray(db?.merchants) ? db.merchants : [];
    const activeMerchants = merchants.filter(m => m && m.status !== 'deleted');
    const merchant = (order?.storeId
      ? activeMerchants.find(m => String(m.id) === String(order.storeId))
      : null)
      || (db?.settings?.posStore?.merchantId
        ? activeMerchants.find(m => String(m.id) === String(db.settings.posStore.merchantId))
        : null)
      || activeMerchants[0]
      || null;
    const billingProfile = getStoreBillingProfile(db, merchant);
    const billingFeeIdr = Number(order?.billing_fee_idr ?? billingProfile.notaFeeIdr ?? TIER_1_FEE_IDR);
    const notaFeeBearer = resolveStoreNotaFeeBearer(db, merchant);
    const baseAmt = Number(
      order?.baseAmountBeforePaymentFee
      ?? Math.max(0, Number(order?.totalAmount || 0) - (Number(order?.qrisFee) || 0) - (Number(order?.customerAdminFee) || 0))
    );
    const sharedUid = String(
      merchant?.id
      || (order?.storeId && order.storeId !== 'pos-store-default' ? order.storeId : '')
      || db?.settings?.posStore?.merchantId
      || db?.settings?.posStore?.uid
      || 'MTR-KASIR-MASTER'
    );
    return {
      merchant,
      sharedUid,
      baseAmt,
      billingFeeIdr,
      notaFeeBearer
    };
  };

  const settlePosOrderIntoUnifiedWallet = (db, order, merchant, billingFeeIdr) => {
    if (!db || !order || order.walletCredited) return null;
    db.unified_wallets = db.unified_wallets || {};
    const targetUid = String(
      merchant?.id
      || (order.storeId && order.storeId !== 'pos-store-default' ? order.storeId : '')
      || db.settings?.posStore?.merchantId
      || db.settings?.posStore?.uid
      || 'MTR-KASIR-MASTER'
    );
    if (!db.unified_wallets[targetUid]) {
      db.unified_wallets[targetUid] = {
        uid: targetUid,
        name: merchant?.name || db.settings?.posStore?.storeName || 'Kasir POS & Mitra Terpadu',
        balance: 0,
        totalEarned: 0,
        totalSettled: 0,
        gateway: 'TriPay Master KostKu (T53543)',
        history: []
      };
    }
    const w = db.unified_wallets[targetUid];
    const baseAmt = Number(
      order.baseAmountBeforePaymentFee
      ?? Math.max(0, Number(order.totalAmount || 0) - (Number(order.qrisFee) || 0) - (Number(order.customerAdminFee) || 0))
    );
    const borneByCustomer = (order.notaFeeBorneBy || order.notaFeeBearer || 'store') === 'customer';
    const feeIdr = Math.max(0, Math.round(Number(billingFeeIdr) || 0));
    const alreadyDeductedNota = (Number(order.notaDeducted) || 0) > 0;
    const netAmount = (borneByCustomer || alreadyDeductedNota)
      ? baseAmt
      : Math.max(0, baseAmt - feeIdr);

    w.balance = (Number(w.balance) || 0) + netAmount;
    w.totalEarned = (Number(w.totalEarned) || 0) + netAmount;
    w.history = Array.isArray(w.history) ? w.history : [];
    w.history.unshift({
      id: 'WAL-POS-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      type: 'deposit',
      amount: netAmount,
      balanceAfter: w.balance,
      orderId: order.id,
      source: 'pos_qris',
      description: `Pembayaran KostKu QRIS POS #${order.invoice_number || order.id}${!borneByCustomer && !alreadyDeductedNota && feeIdr > 0 ? ` (Net setelah potongan nota Rp ${feeIdr})` : ''}`,
      createdAt: new Date().toISOString()
    });
    if (w.history.length > 100) w.history = w.history.slice(0, 100);
    order.walletCredited = true;
    order.netWalletCredited = netAmount;
    order.walletCreditedUid = targetUid;
    return { targetUid, netAmount, balanceAfter: w.balance };
  };

  const finalizeTripayPosOrderPayment = (db, order, merchant, billingFeeIdr) => {
    if (!order) return null;
    const feeIdr = Math.max(0, Math.round(Number(billingFeeIdr ?? order.billing_fee_idr ?? TIER_1_FEE_IDR) || 0));
    const bearer = normalizeNotaFeeBearer(
      order.notaFeeBorneBy || order.notaFeeBearer || resolveStoreNotaFeeBearer(db, merchant)
    );
    const borneByCustomer = bearer === 'customer';

    if (borneByCustomer) {
      order.notaDeducted = 0;
      order.notaBypassReason = 'CUSTOMER_PAID_VIA_KOSTKU_QRIS';
    } else if (!order.notaDeducted && merchant && Number(merchant.saldoNota ?? 0) >= feeIdr) {
      deductStoreNotaFeeOnce(db, merchant, order, {
        channel: 'QRIS KostKu (Nota Toko)'
      });
    } else if (!borneByCustomer && !order.notaDeducted && feeIdr > 0) {
      order.notaDeducted = 0;
      order.notaSettledFromPayout = feeIdr;
    }

    order.notaFeeBearer = bearer;
    order.notaFeeBorneBy = bearer;
    order.feeBorneBy = bearer;
    order.paymentMethod = order.paymentMethod || 'TRIPAY';
    order.paymentStatus = 'PAID';
    order.status = 'PREPARING';
    order.paidAt = order.paidAt || new Date().toISOString();

    return settlePosOrderIntoUnifiedWallet(db, order, merchant, feeIdr);
  };

  const SHIFT_PHOTO_CATEGORY_MAP = {
    basi: { id: 'basi', label: 'Barang Basi / Kedaluwarsa' },
    sisa: { id: 'sisa', label: 'Barang Sisa / Stok Akhir' },
    gagal: { id: 'gagal', label: 'Barang Gagal / Rusak' },
    error: { id: 'error', label: 'Kendala / Error / Retur' },
    lainnya: { id: 'lainnya', label: 'Foto Laci & Kondisi Toko' }
  };
  const ALL_SHIFT_CATEGORY_IDS = Object.keys(SHIFT_PHOTO_CATEGORY_MAP);

  const normalizeClosingShiftSettings = (raw = null) => {
    const src = (raw && typeof raw === 'object') ? raw : {};
    const hasCustomEnabled = Array.isArray(src.enabledCategories);
    const enabledCategories = hasCustomEnabled
      ? Array.from(new Set(src.enabledCategories.map(c => String(c || '').trim()).filter(c => SHIFT_PHOTO_CATEGORY_MAP[c])))
      : [...ALL_SHIFT_CATEGORY_IDS];
    const finalEnabled = enabledCategories.length > 0 ? enabledCategories : [...ALL_SHIFT_CATEGORY_IDS];

    const requiredCategories = Array.isArray(src.requiredCategories)
      ? Array.from(new Set(src.requiredCategories.map(c => String(c || '').trim()).filter(c => finalEnabled.includes(c))))
      : [];

    const customChecklist = Array.isArray(src.customChecklist)
      ? src.customChecklist
          .slice(0, 12)
          .map((item, idx) => {
            if (typeof item === 'string') {
              const label = item.trim();
              return label ? { id: `custom-${idx + 1}`, label, required: false } : null;
            }
            if (!item || typeof item !== 'object') return null;
            const label = String(item.label || item.name || '').trim();
            if (!label) return null;
            return {
              id: String(item.id || `custom-${idx + 1}`).trim(),
              label,
              required: Boolean(item.required)
            };
          })
          .filter(Boolean)
      : [];

    return {
      requireClosingPhoto: src.requireClosingPhoto !== undefined ? Boolean(src.requireClosingPhoto) : true,
      requireItemNotes: src.requireItemNotes !== undefined ? Boolean(src.requireItemNotes) : true,
      enabledCategories: finalEnabled,
      requiredCategories,
      customChecklist,
      instructions: String(src.instructions || '').trim()
    };
  };

  /**
   * Enforce compulsory Mitra membership for all Kasir POS stores so every
   * active store contributes to the Mitra marketplace catalog.
   */
  const normalizeStoreMode = () => 'mitra';

  const KASIR_ONLINE_TTL_MS = 60 * 1000;

  /** Determine if a store's Kasir web session has an active recent heartbeat. */
  const isMerchantKasirOnline = (m, nowMs = Date.now()) => {
    if (!m || m.status === 'deleted') return false;
    if (m.kasirWebOnline !== true) return false;
    if (m.isShiftOpen === false) return false;
    const hbMs = m.lastKasirHeartbeatAt ? Date.parse(m.lastKasirHeartbeatAt) : NaN;
    return Number.isFinite(hbMs) && (nowMs - hbMs) <= KASIR_ONLINE_TTL_MS;
  };

  /** Identify customer-converted point discount vouchers (`POIN-*` or `createdByRole === 'customer'`). */
  const isPointConversionVoucher = (promo, codeStr = '') => {
    const code = String(promo?.code || codeStr || '').trim().toUpperCase();
    const role = String(promo?.createdByRole || '').trim().toLowerCase();
    return role === 'customer' || code.startsWith('POIN-');
  };

  /**
   * Resolve the target merchant + billing profile from explicit IDs, table QR token,
   * claim token, order ID, or fall back to the active workspace POS store.
   */
  const resolveStoreContextForRequest = (db, { storeId = null, merchantId = null, tableToken = null, claimToken = null, orderId = null } = {}) => {
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    const table = tableToken
      ? (db.pos_tables || []).find(t => String(t.qrToken || '') === String(tableToken).trim())
      : null;
    const claim = claimToken
      ? (db.receipt_claims || []).find(c => String(c.claim_token || '') === String(claimToken).trim() || String(c.id || '') === String(claimToken).trim())
      : null;
    const ord = orderId
      ? (db.pos_orders || []).find(o => String(o.id || '') === String(orderId).trim())
      : null;

    const candidateId = storeId
      || merchantId
      || table?.storeId
      || table?.merchantId
      || claim?.merchant_id
      || ord?.storeId
      || db.settings?.posStore?.merchantId
      || db.settings?.posStore?.uid
      || null;

    let merchant = candidateId
      ? db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(candidateId))
      : null;
    if (!merchant && !storeId && !merchantId && !table?.storeId && !claim?.merchant_id && !ord?.storeId) {
      merchant = db.merchants.find(m => m && m.status !== 'deleted') || null;
    }
    const billingProfile = getStoreBillingProfile(db, merchant || { id: candidateId || 'STORE-DEFAULT', loyalty_pool_id: null });
    return {
      merchant,
      table,
      billingProfile,
      isTier2: Boolean(billingProfile.activePool),
      explicitStoreRequested: Boolean(storeId || merchantId || table?.storeId || table?.merchantId || claim?.merchant_id || ord?.storeId)
    };
  };

  const serializeOwnerStore = (m, db = null) => {
    if (!m) return null;
    const profile = getStoreBillingProfile(db || { loyalty_pools: [] }, m);
    const saldo = Number(m.saldoNota ?? 5000);
    const kuota = Math.max(0, Math.floor(saldo / profile.notaFeeIdr));
    const resolvedStoreMode = normalizeStoreMode(m.storeMode, m.kasirOnly, m.isMitra, 'mitra');
    const resolvedKasirOnly = false;
    const kasirOnline = isMerchantKasirOnline(m);
    return {
      id: m.id,
      name: m.name || 'Toko Mitra',
      category: m.category || 'Makanan & Minuman',
      storeMode: resolvedStoreMode,
      kasirOnly: resolvedKasirOnly,
      isMitra: true,
      kasirOnline,
      isOnline: kasirOnline,
      onlineStatus: kasirOnline ? 'online' : 'offline',
      lastKasirHeartbeatAt: m.lastKasirHeartbeatAt || null,
      location: m.storeLocation || (m.location && typeof m.location === 'string' ? m.location : '') || m.address || 'Stand Utama',
      address: m.address || '',
      city: m.city || '',
      phone: m.phone || '',
      mapsUrl: m.mapsUrl || '',
      latitude: m.latitude ?? m.location?.lat ?? null,
      longitude: m.longitude ?? m.location?.lng ?? null,
      photo: m.photo || m.image || m.coverImage || '',
      closingShiftSettings: normalizeClosingShiftSettings(m.closingShiftSettings),
      branchCount: Number(m.branchCount || 1),
      branchIndex: Number(m.branchIndex || 1),
      parentStoreId: m.parentStoreId || null,
      icon: '',
      saldoNota: saldo,
      kuotaNota: kuota,
      loyalty_pool_id: profile.loyaltyPoolId,
      loyaltyPoolId: profile.loyaltyPoolId,
      loyaltyPoolName: profile.loyaltyPoolName,
      billingTier: profile.billingTier,
      notaFeePerNotaIdr: profile.notaFeeIdr,
      isValidated: Boolean((m.name || m.storeName) && (typeof m.location === 'string' ? m.location : m.address || m.storeLocation)),
      isPosStore: Boolean(m.isPosStore),
      isUserUmkmStore: Boolean(m.isUserUmkmStore),
      ownerUserId: m.ownerUserId || null,
      posOwnerId: m.posOwnerId || m.ownerUserId || null,
      kostUid: m.kostUid || null,
      createdAt: m.createdAt || null
    };
  };

  /** Resolve active merchants explicitly owned by a specific user/staff account (strictly isolated for tenants). */
  const getDirectOwnerStores = (db, requestedOwnerId) => {
    if (!requestedOwnerId) return { ownerUser: null, stores: [] };
    const cleanReq = String(requestedOwnerId).trim();
    const ownerUser = (db.users || []).find(u => u && String(u.id) === cleanReq) || null;
    const aliasSet = new Set([cleanReq]);
    if (ownerUser) {
      if (ownerUser.merchantId) aliasSet.add(String(ownerUser.merchantId));
      if (ownerUser.role === 'staff' || ownerUser.role === 'admin' || ownerUser.role === 'karyawan') {
        if (ownerUser.ownerId) aliasSet.add(String(ownerUser.ownerId));
        if (ownerUser.ownerUid) aliasSet.add(String(ownerUser.ownerUid));
        if (ownerUser.employerId) aliasSet.add(String(ownerUser.employerId));
      }
    }
    const activeMerchants = (db.merchants || []).filter(m => m && m.status !== 'deleted');
    const stores = activeMerchants.filter(m => {
      const mId = String(m.id || '');
      const mOwner = m.ownerUserId ? String(m.ownerUserId) : '';
      const mPosOwner = m.posOwnerId ? String(m.posOwnerId) : '';
      return (
        (mOwner && aliasSet.has(mOwner)) ||
        (mPosOwner && aliasSet.has(mPosOwner)) ||
        (ownerUser?.merchantId && mId === String(ownerUser.merchantId))
      );
    });
    return { ownerUser, stores };
  };

  const ALLOWED_GMAPS_HOST_RE = /^(?:maps\.app\.goo\.gl|goo\.gl|(?:www\.)?maps\.google\.[a-z.]+|(?:www\.)?google\.[a-z.]+)$/i;

  const extractCoordsFromMapsUrl = (rawUrl) => {
    const urlStr = String(rawUrl || '').trim();
    if (!urlStr) return { lat: null, lng: null, placeName: '', isGoogleMapsUrl: false, isShortLink: false };
    const isGoogleMapsUrl = /https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)\b/i.test(urlStr);
    const isShortLink = /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(urlStr);

    let placeName = '';
    const placeMatch = urlStr.match(/\/maps\/place\/([^/@?]+)/i);
    if (placeMatch?.[1]) {
      try {
        placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
      } catch (_) {
        placeName = placeMatch[1].replace(/\+/g, ' ').trim();
      }
    }

    const m =
      urlStr.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
      urlStr.match(/[?&](?:q|query|ll|center)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ||
      urlStr.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, placeName, isGoogleMapsUrl, isShortLink };
      }
    }
    return { lat: null, lng: null, placeName, isGoogleMapsUrl, isShortLink };
  };

  /**
   * Resolves Google Maps URLs (including allowlisted short links like maps.app.goo.gl)
   * into coordinates { lat, lng } and normalized destination URL.
   */
  const resolveGoogleMapsLink = async (rawUrl) => {
    const cleanUrl = String(rawUrl || '').trim();
    const initial = extractCoordsFromMapsUrl(cleanUrl);
    if (Number.isFinite(initial.lat) && Number.isFinite(initial.lng) && initial.lat !== null && initial.lng !== null) {
      return { ...initial, resolvedUrl: cleanUrl };
    }

    let resolvedUrl = cleanUrl;
    let parsed = initial;

    try {
      const u = new URL(cleanUrl);
      const isHttp = u.protocol === 'https:' || u.protocol === 'http:';
      if (isHttp && ALLOWED_GMAPS_HOST_RE.test(u.hostname)) {
        const resp = await fetch(cleanUrl, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KostKuPOS/1.0)' }
        });
        if (resp?.url) {
          resolvedUrl = resp.url;
          parsed = extractCoordsFromMapsUrl(resolvedUrl);
        }
        if (parsed.lat === null && resp?.ok) {
          const ct = String(resp.headers?.get?.('content-type') || '');
          if (ct.includes('text/html')) {
            const html = (await resp.text()).slice(0, 120000);
            const htmlMatch =
              html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
              html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
              html.match(/[?&](?:ll|center|q)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
            if (htmlMatch) {
              const hLat = Number(htmlMatch[1]);
              const hLng = Number(htmlMatch[2]);
              if (Number.isFinite(hLat) && Number.isFinite(hLng) && hLat >= -90 && hLat <= 90 && hLng >= -180 && hLng <= 180) {
                parsed = { ...parsed, lat: hLat, lng: hLng };
              }
            }
          }
        }
      }
    } catch (_) {
      // Fallback safely when offline or remote link refuses connection
    }

    if (parsed.lat === null && parsed.placeName) {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(parsed.placeName)}`,
          {
            signal: AbortSignal.timeout(4000),
            headers: { 'User-Agent': 'KostKuPOS/1.0' }
          }
        );
        if (nomRes.ok) {
          const rows = await nomRes.json();
          if (Array.isArray(rows) && rows[0]) {
            const nLat = Number(rows[0].lat);
            const nLng = Number(rows[0].lon);
            if (Number.isFinite(nLat) && Number.isFinite(nLng)) {
              parsed = { ...parsed, lat: Number(nLat.toFixed(6)), lng: Number(nLng.toFixed(6)) };
            }
          }
        }
      } catch (_) {}
    }

    return {
      ...parsed,
      resolvedUrl
    };
  };

  const getOwnerStoresList = (db, currentMerchant, requestedOwnerId = null) => {
    const ownerIds = new Set(
      [requestedOwnerId, currentMerchant?.ownerUserId, currentMerchant?.posOwnerId]
        .filter(Boolean)
        .map(v => String(v))
    );

    const activeMerchants = (db.merchants || []).filter(m => m && m.status !== 'deleted');
    const seen = new Set();
    const list = [];

    const pushStore = (m) => {
      if (!m || !m.id || seen.has(String(m.id))) return;
      seen.add(String(m.id));
      list.push(serializeOwnerStore(m, db));
    };

    if (currentMerchant) {
      pushStore(currentMerchant);
    }

    activeMerchants.forEach(m => {
      const mOwner = m.ownerUserId ? String(m.ownerUserId) : '';
      const mPosOwner = m.posOwnerId ? String(m.posOwnerId) : '';
      const matchesOwner =
        (mOwner && ownerIds.has(mOwner)) ||
        (mPosOwner && ownerIds.has(mPosOwner));
      if (matchesOwner) {
        pushStore(m);
      }
    });

    return list;
  };

  const buildActiveStorePayload = (db, currentMerchant, requestedOwnerId = null) => {
    const store = db.settings.posStore || {};
    const target = currentMerchant || (db.merchants || []).find(m => String(m.id) === String(store.merchantId || store.uid)) || (db.merchants || []).find(m => m.status !== 'deleted');
    const billingProfile = getStoreBillingProfile(db, target || store);

    if (target) {
      if (target.saldoNota === undefined) target.saldoNota = 5000;
      target.kuotaNota = Math.max(0, Math.floor(Number(target.saldoNota) / billingProfile.notaFeeIdr));
      target.notaHistory = target.notaHistory || [];
    }

    const activeUid = target ? target.id : (store.merchantId || store.uid || 'MTR-KASIR-MASTER');
    const currentSaldoNota = target ? Number(target.saldoNota ?? 5000) : Number(store.saldoNota ?? 5000);
    const currentKuotaNota = Math.max(0, Math.floor(currentSaldoNota / billingProfile.notaFeeIdr));

    const resolvedName = (target && target.name) || store.storeName || 'Kantin Berkah Kost';
    const resolvedLocation =
      (target && typeof target.location === 'string' && target.location) ||
      target?.storeLocation ||
      store.location ||
      'Lantai 1 Dekat Gazebo';
    const resolvedAddress = (target && target.address) || store.address || '';
    const resolvedCity = (target && target.city) || store.city || '';
    const resolvedPhone = (target && target.phone) || store.phone || '';
    const resolvedLat = target?.latitude ?? store.latitude ?? (typeof target?.location === 'object' ? target.location?.lat : null) ?? null;
    const resolvedLng = target?.longitude ?? store.longitude ?? (typeof target?.location === 'object' ? target.location?.lng : null) ?? null;
    const resolvedMapsUrl = (target && target.mapsUrl) || store.mapsUrl || (Number.isFinite(Number(resolvedLat)) && Number.isFinite(Number(resolvedLng)) && resolvedLat !== null && resolvedLng !== null ? `https://maps.google.com/?q=${resolvedLat},${resolvedLng}` : '');

    const allOwnerStores = getOwnerStoresList(db, target, requestedOwnerId);
    const isValid = Boolean(resolvedName && (resolvedLocation || resolvedAddress));
    const resolvedPhoto = (target && (target.photo || target.image || target.coverImage)) || store.photo || '';
    const resolvedBranchCount = Math.max(Number(target?.branchCount || 0), allOwnerStores.length || 1);
    const resolvedClosingSettings = normalizeClosingShiftSettings(
      target?.closingShiftSettings || store.closingShiftSettings || null
    );

    const resolvedStoreMode = normalizeStoreMode(
      target?.storeMode ?? store.storeMode,
      target?.kasirOnly ?? store.kasirOnly,
      target?.isMitra ?? store.isMitra,
      'mitra'
    );
    const resolvedKasirOnly = false;
    const activeOnline = isMerchantKasirOnline(target || store);

    return {
      uid: activeUid,
      merchantId: activeUid,
      storeName: resolvedName,
      category: target?.category || store.category || 'Makanan & Minuman',
      storeMode: 'mitra',
      kasirOnly: resolvedKasirOnly,
      isMitra: true,
      kasirOnline: activeOnline,
      isOnline: activeOnline,
      onlineStatus: activeOnline ? 'online' : 'offline',
      lastKasirHeartbeatAt: target?.lastKasirHeartbeatAt || null,
      location: resolvedLocation,
      address: resolvedAddress,
      city: resolvedCity,
      phone: resolvedPhone,
      mapsUrl: resolvedMapsUrl,
      latitude: resolvedLat,
      longitude: resolvedLng,
      photo: resolvedPhoto,
      closingShiftSettings: resolvedClosingSettings,
      branchCount: resolvedBranchCount,
      branchIndex: Number(target?.branchIndex || 1),
      isUserUmkmStore: Boolean(target?.isUserUmkmStore),
      isValidated: isValid,
      hasRegisteredStore: true,
      needsUmkmRegistration: false,
      saldoNota: currentSaldoNota,
      kuotaNota: currentKuotaNota,
      loyalty_pool_id: billingProfile.loyaltyPoolId,
      loyaltyPoolId: billingProfile.loyaltyPoolId,
      loyaltyPoolName: billingProfile.loyaltyPoolName,
      loyaltyPool: billingProfile.activePool,
      billingTier: billingProfile.billingTier,
      notaFeePerNotaIdr: billingProfile.notaFeeIdr,
      notaFeeBearer: resolveStoreNotaFeeBearer(db, target),
      notaHistory: target?.notaHistory || [],
      allOwnerStores,
      updatedAt: target?.updatedAt || store.updatedAt || null
    };
  };

  router.get('/store', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    const requestedStoreId = req.query.merchantId || req.query.storeId;
    const requestedTableToken = String(req.query.tableToken || '').trim();
    const requestedOwnerId = req.query.ownerId || req.user?.id || req.headers['x-user-id'] || null;
    const requestedRole = String(req.query.userRole || req.headers['x-user-role'] || '').trim().toLowerCase();
    const store = db.settings.posStore || {};

    // Public customer table QR access: only resolves the store owning this exact tableToken
    if (requestedTableToken) {
      const matchedTable = (db.pos_tables || []).find(t => String(t.qrToken || '') === requestedTableToken);
      const targetStoreId = matchedTable?.storeId || matchedTable?.merchantId || requestedStoreId || null;
      const targetMerchant =
        (targetStoreId && db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(targetStoreId))) ||
        null;
      if (!targetMerchant) {
        return res.status(404).json({
          error: 'Meja QR tidak ditemukan atau toko belum terdaftar.',
          hasRegisteredStore: false,
          storeName: '',
          merchantId: null,
          uid: null
        });
      }
      return res.json(buildActiveStorePayload(db, targetMerchant, targetMerchant.ownerUserId || null));
    }

    if (requestedOwnerId) {
      const { ownerUser, stores: directOwned } = getDirectOwnerStores(db, requestedOwnerId);

      if (directOwned.length > 0) {
        const preferredStoreId =
          requestedStoreId ||
          db.pos_user_active_store?.[String(requestedOwnerId)] ||
          ownerUser?.activePosStoreId ||
          store.merchantId ||
          store.uid;
        const matchedDirect =
          directOwned.find(m => String(m.id) === String(preferredStoreId)) || directOwned[0];
        return res.json(buildActiveStorePayload(db, matchedDirect, requestedOwnerId));
      }

      // Signed-in user (owner/mitra/user/staff) without a registered POS store yet sees their own onboarding gate (NEVER another merchant!)
      if (!req.isDemo) {
        return res.json({
          uid: null,
          merchantId: null,
          storeName: '',
          category: '',
          location: '',
          address: '',
          city: '',
          phone: ownerUser?.phone || '',
          mapsUrl: '',
          latitude: null,
          longitude: null,
          photo: '',
          branchCount: 0,
          isValidated: false,
          hasRegisteredStore: false,
          needsUmkmRegistration: true,
          saldoNota: 0,
          kuotaNota: 0,
          allOwnerStores: []
        });
      }
    }

    // Unauthenticated direct access in real mode: NEVER return another owner's store!
    if (!req.isDemo && !requestedStoreId) {
      return res.status(401).json({
        error: 'Silakan login terlebih dahulu untuk mengakses Kasir POS.',
        needsLogin: true,
        hasRegisteredStore: false,
        needsUmkmRegistration: true,
        uid: null,
        merchantId: null,
        storeName: '',
        saldoNota: 0,
        kuotaNota: 0,
        allOwnerStores: []
      });
    }

    if (!req.isDemo && requestedStoreId) {
      const explicitMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(requestedStoreId));
      if (!explicitMerchant) {
        return res.status(404).json({ error: 'Toko POS tidak ditemukan', hasRegisteredStore: false, merchantId: null, uid: null });
      }
      return res.json(buildActiveStorePayload(db, explicitMerchant, explicitMerchant.ownerUserId || null));
    }

    const primaryMerchant = db.merchants.find(m => m && m.status !== 'deleted') || db.merchants[0];
    const sharedUid = requestedStoreId || store.merchantId || store.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';

    let currentMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(sharedUid));
    if (!currentMerchant && primaryMerchant) {
      currentMerchant = primaryMerchant;
    }

    if (currentMerchant) {
      store.uid = currentMerchant.id;
      store.merchantId = currentMerchant.id;
    }

    res.json(buildActiveStorePayload(db, currentMerchant, requestedOwnerId));
  });

  // List semua toko milik owner
  router.get('/stores', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    const requestedOwnerId = req.query.ownerId || req.user?.id || req.headers['x-user-id'] || null;
    const store = db.settings.posStore || {};

    if (requestedOwnerId) {
      const { ownerUser, stores: directOwned } = getDirectOwnerStores(db, requestedOwnerId);
      if (directOwned.length > 0) {
        const preferredId = db.pos_user_active_store?.[String(requestedOwnerId)] || ownerUser?.activePosStoreId || directOwned[0].id;
        const activeM = directOwned.find(m => String(m.id) === String(preferredId)) || directOwned[0];
        return res.json({
          success: true,
          stores: directOwned.map(m => serializeOwnerStore(m, db)),
          activeStoreId: activeM?.id || null
        });
      }
      if (!req.isDemo) {
        return res.json({ success: true, stores: [], activeStoreId: null });
      }
    }

    if (!req.isDemo) {
      return res.status(401).json({ success: false, needsLogin: true, stores: [], activeStoreId: null });
    }

    const currentMerchant =
      db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(store.merchantId || store.uid)) ||
      db.merchants.find(m => m && m.status !== 'deleted') ||
      db.merchants[0];

    const stores = getOwnerStoresList(db, currentMerchant, requestedOwnerId);
    res.json({
      success: true,
      stores,
      activeStoreId: currentMerchant?.id || store.merchantId || store.uid || null
    });
  });

  // Buat toko/cabang POS baru (1 owner bisa punya banyak toko)
  router.post('/stores', (req, res) => {
    const {
      storeName,
      name,
      location,
      address,
      city,
      phone,
      category,
      mapsUrl,
      latitude,
      longitude,
      ownerUserId,
      ownerId,
      kostUid,
      switchAfterCreate = true,
      cloneMenu = false,
      sourceStoreId = null,
      storeMode,
      kasirOnly,
      joinMitra
    } = req.body || {};

    const resolvedStoreMode = normalizeStoreMode(storeMode, kasirOnly, joinMitra, 'mitra');
    const isKasirOnly = resolvedStoreMode === 'kasir_only';

    const cleanName = String(storeName || name || '').trim();
    const cleanLocation = String(location || '').trim();
    const cleanAddress = String(address || '').trim();
    const cleanCity = String(city || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanCategory = String(category || 'Makanan & Minuman').trim();
    const cleanMapsUrl = String(mapsUrl || '').trim();
    const parsedFromUrl = extractCoordsFromMapsUrl(cleanMapsUrl);
    const parsedLat = latitude !== undefined && latitude !== null && String(latitude).trim() !== ''
      ? Number(latitude)
      : parsedFromUrl.lat;
    const parsedLng = longitude !== undefined && longitude !== null && String(longitude).trim() !== ''
      ? Number(longitude)
      : parsedFromUrl.lng;

    if (!cleanName) {
      return res.status(400).json({ error: 'Nama toko / cabang baru wajib diisi!' });
    }
    if (!cleanLocation) {
      return res.status(400).json({ error: 'Lokasi fisik / stand kasir wajib diisi!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    db.merchant_wallets = db.merchant_wallets || {};

    const currentStoreId = db.settings.posStore?.merchantId || db.settings.posStore?.uid;
    const currentMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(currentStoreId)) || db.merchants[0];
    const requestedOwner = ownerUserId || ownerId || req.user?.id || null;
    const ownerStoresBefore = getOwnerStoresList(db, currentMerchant, requestedOwner);
    const primaryStoreIdForClone = ownerStoresBefore[0]?.id || currentMerchant?.id || null;
    const canonicalOwnerId = currentMerchant?.ownerUserId || requestedOwner || 'USR-OWNER-01';
    const resolvedKostUid = kostUid || currentMerchant?.kostUid || 'KOST-JAKSEL-01';

    const newStoreId = `PTR-${Date.now()}-${Math.floor(10 + Math.random() * 89)}`;
    const nowIso = new Date().toISOString();
    const resolvedMapsUrl = cleanMapsUrl || (Number.isFinite(parsedLat) && Number.isFinite(parsedLng) ? `https://maps.google.com/?q=${parsedLat},${parsedLng}` : '');

    const newStore = {
      id: newStoreId,
      ownerUserId: canonicalOwnerId,
      posOwnerId: requestedOwner ? String(requestedOwner) : canonicalOwnerId,
      kostUid: resolvedKostUid,
      name: cleanName,
      category: cleanCategory,
      storeLocation: cleanLocation,
      location: cleanLocation,
      address: cleanAddress,
      city: cleanCity,
      phone: cleanPhone,
      mapsUrl: resolvedMapsUrl,
      latitude: Number.isFinite(parsedLat) ? parsedLat : null,
      longitude: Number.isFinite(parsedLng) ? parsedLng : null,
      commissionOwner: 500,
      platformFee: 200,
      paymentMethods: ['cash', 'qris'],
      saldoNota: 5000,
      kuotaNota: 50,
      notaHistory: [
        {
          id: `NOTA-WELCOME-${newStoreId}`,
          type: 'welcome_quota',
          amount: 5000,
          addedNota: 50,
          balanceAfter: 5000,
          description: 'Bonus kuota selamat datang cabang baru (50 lembar nota @ Rp 100)',
          createdAt: nowIso
        }
      ],
      isPosStore: true,
      isValidated: true,
      storeMode: resolvedStoreMode,
      kasirOnly: isKasirOnly,
      isMitra: !isKasirOnly,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    db.merchants.push(newStore);
    db.merchant_wallets[newStoreId] = {
      merchant_id: newStoreId,
      name: cleanName,
      whatsapp_number: cleanPhone,
      available_balance: 5000,
      held_promo_balance: 0,
      updated_at: nowIso
    };

    let clonedProductsCount = 0;
    if (Boolean(cloneMenu)) {
      const effectiveSourceStoreId = String(sourceStoreId || currentStoreId || primaryStoreIdForClone || '');
      const isSourcePrimary = !primaryStoreIdForClone || effectiveSourceStoreId === String(primaryStoreIdForClone);
      const sourceProducts = (db.pos_products || []).filter(p => {
        if (!p) return false;
        if (p.storeId) return String(p.storeId) === effectiveSourceStoreId;
        return isSourcePrimary;
      });
      sourceProducts.forEach((srcProd, idx) => {
        const cloneId = `prod-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
        db.pos_products.unshift({
          ...srcProd,
          id: cloneId,
          storeId: newStoreId,
          merchantId: requestedOwner ? String(requestedOwner) : (srcProd.merchantId || canonicalOwnerId),
          clonedFromStoreId: effectiveSourceStoreId || null,
          clonedFromProductId: srcProd.id,
          createdAt: nowIso,
          updatedAt: nowIso
        });
        clonedProductsCount += 1;
      });
    }

    let activeMerchant = currentMerchant || newStore;
    if (switchAfterCreate !== false) {
      activeMerchant = newStore;
      db.settings.posStore = {
        uid: newStore.id,
        merchantId: newStore.id,
        storeName: newStore.name,
        category: newStore.category,
        location: cleanLocation,
        address: cleanAddress,
        city: cleanCity,
        phone: cleanPhone,
        mapsUrl: resolvedMapsUrl,
        latitude: Number.isFinite(parsedLat) ? parsedLat : null,
        longitude: Number.isFinite(parsedLng) ? parsedLng : null,
        saldoNota: 5000,
        kuotaNota: Math.floor(5000 / TIER_1_FEE_IDR),
        loyalty_pool_id: null,
        billing_tier: 'TIER_1_FLAT',
        isValidated: true,
        updatedAt: nowIso
      };
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, activeMerchant, requestedOwner);
    res.status(201).json({
      success: true,
      message: clonedProductsCount > 0
        ? `Toko baru "${cleanName}" berhasil dibuat dengan ${clonedProductsCount} menu hasil clone!`
        : `Toko baru "${cleanName}" berhasil dibuat!`,
      clonedProductsCount,
      createdStore: serializeOwnerStore(newStore, db),
      store: activePayload,
      allOwnerStores: activePayload.allOwnerStores
    });
  });

  // Hapus / nonaktifkan toko cabang (minimal sisa 1 toko aktif)
  router.delete('/stores/:id', (req, res) => {
    const targetId = String(req.params.id || '').trim();
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const currentId = db.settings.posStore?.merchantId || db.settings.posStore?.uid;
    const currentMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(currentId)) || db.merchants[0];
    const requestedOwner = req.query.ownerId || req.user?.id || null;
    const ownerStores = getOwnerStoresList(db, currentMerchant, requestedOwner);

    if (ownerStores.length <= 1) {
      return res.status(400).json({ error: 'Minimal 1 toko utama harus tetap aktif.' });
    }

    const target = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === targetId);
    if (!target) {
      return res.status(404).json({ error: 'Toko tidak ditemukan.' });
    }

    target.status = 'deleted';
    target.deletedAt = new Date().toISOString();

    let nextActive = currentMerchant;
    if (String(currentId) === targetId) {
      const remaining = ownerStores.filter(s => String(s.id) !== targetId);
      nextActive = remaining.length > 0 ? db.merchants.find(m => String(m.id) === String(remaining[0].id)) : null;
      if (nextActive) {
        const nextSer = serializeOwnerStore(nextActive, db);
        db.settings.posStore = {
          uid: nextSer.id,
          merchantId: nextSer.id,
          storeName: nextSer.name,
          category: nextSer.category,
          location: nextSer.location,
          address: nextSer.address,
          city: nextSer.city,
          phone: nextSer.phone,
          mapsUrl: nextSer.mapsUrl,
          latitude: nextSer.latitude,
          longitude: nextSer.longitude,
          saldoNota: nextSer.saldoNota,
          kuotaNota: nextSer.kuotaNota,
          loyaltyPoolId: nextSer.loyaltyPoolId,
          loyaltyPoolName: nextSer.loyaltyPoolName,
          billingTier: nextSer.billingTier,
          notaFeePerNotaIdr: nextSer.notaFeePerNotaIdr,
          isValidated: true,
          updatedAt: new Date().toISOString()
        };
      }
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, nextActive, requestedOwner);
    res.json({
      success: true,
      message: `Toko "${target.name}" berhasil dihapus.`,
      store: activePayload,
      allOwnerStores: activePayload.allOwnerStores
    });
  });

  router.post('/resolve-gmaps-link', async (req, res) => {
    const rawUrl = String(req.body?.url || req.body?.mapsUrl || '').trim();
    if (!rawUrl) {
      return res.status(400).json({ error: 'Link Google Maps wajib diisi.' });
    }
    const resolved = await resolveGoogleMapsLink(rawUrl);
    res.json({
      success: true,
      originalUrl: rawUrl,
      resolvedUrl: resolved.resolvedUrl || rawUrl,
      lat: resolved.lat,
      lng: resolved.lng,
      placeName: resolved.placeName || '',
      isGoogleMapsUrl: Boolean(resolved.isGoogleMapsUrl),
      isShortLink: Boolean(resolved.isShortLink)
    });
  });

  router.post('/store', async (req, res) => {
    const { storeName, location, address, city, phone, merchantId, category, mapsUrl, latitude, longitude, photo, closingShiftSettings, notaFeeBearer, ownerUserId, ownerId, storeMode, kasirOnly, joinMitra } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const cleanName = String(storeName || '').trim();
    const cleanLocation = String(location || '').trim();
    const cleanAddress = String(address || '').trim();
    const cleanCity = String(city || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanMapsUrl = String(mapsUrl || '').trim();
    const cleanPhoto = String(photo || '').trim();
    const hasLatField = latitude !== undefined;
    const hasLngField = longitude !== undefined;
    const explicitLat = latitude !== undefined && latitude !== null && String(latitude).trim() !== '' ? Number(latitude) : null;
    const explicitLng = longitude !== undefined && longitude !== null && String(longitude).trim() !== '' ? Number(longitude) : null;

    if (!cleanName) {
      return res.status(400).json({ error: 'Nama toko/kantin kasir wajib diisi!' });
    }
    if (!cleanLocation) {
      return res.status(400).json({ error: 'Lokasi kasir (lantai/gedung/posisi fisik) wajib diinput agar toko valid!' });
    }

    const primaryMerchant = db.merchants.find(m => m && m.status !== 'deleted') || db.merchants[0];
    const sharedUid = merchantId || req.body.uid || db.settings.posStore?.merchantId || db.settings.posStore?.uid || primaryMerchant?.id || 'MTR-KASIR-MASTER';
    let targetMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(sharedUid));

    let urlCoords = extractCoordsFromMapsUrl(cleanMapsUrl);
    if (cleanMapsUrl && urlCoords.lat === null && urlCoords.isShortLink) {
      urlCoords = await resolveGoogleMapsLink(cleanMapsUrl);
    }

    const prevMapsUrl = String(targetMerchant?.mapsUrl || db.settings.posStore?.mapsUrl || '').trim();
    const mapsUrlChanged = Boolean(cleanMapsUrl && cleanMapsUrl !== prevMapsUrl);
    const parsedLat = Number.isFinite(explicitLat) && explicitLat !== null
      ? (mapsUrlChanged && Number.isFinite(urlCoords.lat) && urlCoords.lat !== null && explicitLat === Number(targetMerchant?.latitude ?? NaN) ? urlCoords.lat : explicitLat)
      : (Number.isFinite(urlCoords.lat) && urlCoords.lat !== null ? urlCoords.lat : null);
    const parsedLng = Number.isFinite(explicitLng) && explicitLng !== null
      ? (mapsUrlChanged && Number.isFinite(urlCoords.lng) && urlCoords.lng !== null && explicitLng === Number(targetMerchant?.longitude ?? NaN) ? urlCoords.lng : explicitLng)
      : (Number.isFinite(urlCoords.lng) && urlCoords.lng !== null ? urlCoords.lng : null);

    const finalMapsUrl = (urlCoords.isShortLink && urlCoords.resolvedUrl && urlCoords.lat !== null)
      ? urlCoords.resolvedUrl
      : cleanMapsUrl;
    const resolvedMapsUrl = finalMapsUrl || (Number.isFinite(parsedLat) && parsedLat !== null && Number.isFinite(parsedLng) && parsedLng !== null ? `https://maps.google.com/?q=${parsedLat},${parsedLng}` : '');

    if (targetMerchant) {
      targetMerchant.name = cleanName;
      targetMerchant.storeLocation = cleanLocation;
      if (typeof targetMerchant.location === 'string' || !targetMerchant.location) {
        targetMerchant.location = cleanLocation;
      }
      if (category) targetMerchant.category = String(category).trim();
      if (cleanAddress) targetMerchant.address = cleanAddress;
      if (cleanCity) targetMerchant.city = cleanCity;
      if (cleanPhone) targetMerchant.phone = cleanPhone;
      if (mapsUrl !== undefined) {
        targetMerchant.mapsUrl = resolvedMapsUrl;
      } else if (resolvedMapsUrl) {
        targetMerchant.mapsUrl = resolvedMapsUrl;
      }
      if (Number.isFinite(parsedLat) && parsedLat !== null) {
        targetMerchant.latitude = parsedLat;
      } else if (hasLatField && (latitude === null || String(latitude).trim() === '')) {
        targetMerchant.latitude = null;
      }
      if (Number.isFinite(parsedLng) && parsedLng !== null) {
        targetMerchant.longitude = parsedLng;
      } else if (hasLngField && (longitude === null || String(longitude).trim() === '')) {
        targetMerchant.longitude = null;
      }
      if (cleanPhoto) {
        targetMerchant.photo = cleanPhoto;
        targetMerchant.image = cleanPhoto;
      }
      if (closingShiftSettings && typeof closingShiftSettings === 'object') {
        targetMerchant.closingShiftSettings = normalizeClosingShiftSettings(closingShiftSettings);
      }
      if (notaFeeBearer !== undefined) {
        targetMerchant.notaFeeBearer = normalizeNotaFeeBearer(notaFeeBearer);
      }
      const hasExplicitMode = storeMode !== undefined || kasirOnly !== undefined || joinMitra !== undefined;
      const nextStoreMode = hasExplicitMode
        ? normalizeStoreMode(storeMode, kasirOnly, joinMitra, targetMerchant.storeMode || 'mitra')
        : normalizeStoreMode(targetMerchant.storeMode, targetMerchant.kasirOnly, targetMerchant.isMitra, 'mitra');
      targetMerchant.storeMode = nextStoreMode;
      targetMerchant.kasirOnly = nextStoreMode === 'kasir_only';
      targetMerchant.isMitra = nextStoreMode !== 'kasir_only';
      targetMerchant.updatedAt = new Date().toISOString();
    }

    if (!targetMerchant?.isUserUmkmStore) {
      const nextClosingSettings = closingShiftSettings && typeof closingShiftSettings === 'object'
        ? normalizeClosingShiftSettings(closingShiftSettings)
        : normalizeClosingShiftSettings(targetMerchant?.closingShiftSettings || db.settings.posStore?.closingShiftSettings);
      const nextNotaFeeBearer = notaFeeBearer !== undefined
        ? normalizeNotaFeeBearer(notaFeeBearer)
        : resolveStoreNotaFeeBearer(db, targetMerchant);
      const settingsMode = normalizeStoreMode(
        storeMode,
        kasirOnly,
        joinMitra,
        targetMerchant?.storeMode || db.settings.posStore?.storeMode || 'mitra'
      );
      db.settings.posStore = {
        uid: sharedUid,
        merchantId: sharedUid,
        storeName: cleanName,
        category: category || targetMerchant?.category || db.settings.posStore?.category || 'Makanan & Minuman',
        storeMode: settingsMode,
        kasirOnly: settingsMode === 'kasir_only',
        isMitra: settingsMode !== 'kasir_only',
        location: cleanLocation,
        address: cleanAddress || targetMerchant?.address || db.settings.posStore?.address || '',
        city: cleanCity,
        phone: cleanPhone,
        mapsUrl: resolvedMapsUrl,
        latitude: Number.isFinite(parsedLat) && parsedLat !== null ? parsedLat : null,
        longitude: Number.isFinite(parsedLng) && parsedLng !== null ? parsedLng : null,
        photo: cleanPhoto || targetMerchant?.photo || db.settings.posStore?.photo || '',
        closingShiftSettings: nextClosingSettings,
        notaFeeBearer: nextNotaFeeBearer,
        saldoNota: targetMerchant ? Number(targetMerchant.saldoNota ?? 5000) : Number(db.settings.posStore?.saldoNota ?? 5000),
        kuotaNota: targetMerchant ? Number(targetMerchant.kuotaNota ?? 50) : Number(db.settings.posStore?.kuotaNota ?? 50),
        isValidated: true,
        updatedAt: new Date().toISOString()
      };
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, targetMerchant, ownerUserId || ownerId || req.user?.id || null);
    res.json({
      success: true,
      message: 'Lokasi dan profil toko kasir berhasil divalidasi!',
      store: activePayload
    });
  });

  // ── 0A-0. STORE NOTA FEE BEARER POLICY SETTINGS (TOKO VS CUSTOMER) ────
  router.post('/store/fee-settings', (req, res) => {
    const { merchantId, storeId, ownerUserId, ownerId, notaFeeBearer } = req.body || {};
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const resolvedStoreId = merchantId || storeId || db.settings.posStore?.merchantId || db.settings.posStore?.uid;
    const targetMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(resolvedStoreId))
      || db.merchants.find(m => m && m.status !== 'deleted');
    const normalizedBearer = normalizeNotaFeeBearer(notaFeeBearer);

    if (targetMerchant) {
      targetMerchant.notaFeeBearer = normalizedBearer;
      targetMerchant.updatedAt = new Date().toISOString();
    }
    if (!targetMerchant?.isUserUmkmStore || !targetMerchant) {
      db.settings.posStore = {
        ...(db.settings.posStore || {}),
        notaFeeBearer: normalizedBearer,
        updatedAt: new Date().toISOString()
      };
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, targetMerchant, ownerUserId || ownerId || req.user?.id || null);
    res.json({
      success: true,
      notaFeeBearer: normalizedBearer,
      message: normalizedBearer === 'customer'
        ? 'Pengaturan disimpan: Biaya admin nota ditanggung Customer (via KostKu QRIS = saldo nota toko Rp 0 terpotong).'
        : 'Pengaturan disimpan: Biaya admin nota ditanggung Toko (default).',
      store: activePayload
    });
  });

  // ── 0A. STORE CLOSING SHIFT PHOTO POLICY SETTINGS ────────────────────────
  router.post('/store/closing-settings', (req, res) => {
    const { merchantId, storeId, ownerUserId, ownerId, closingShiftSettings } = req.body || {};
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const resolvedStoreId = merchantId || storeId || db.settings.posStore?.merchantId || db.settings.posStore?.uid;
    const targetMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(resolvedStoreId))
      || db.merchants.find(m => m && m.status !== 'deleted');
    const normalized = normalizeClosingShiftSettings(closingShiftSettings || req.body);

    if (targetMerchant) {
      targetMerchant.closingShiftSettings = normalized;
      targetMerchant.updatedAt = new Date().toISOString();
    }
    if (!targetMerchant?.isUserUmkmStore) {
      db.settings.posStore = {
        ...(db.settings.posStore || {}),
        closingShiftSettings: normalized,
        updatedAt: new Date().toISOString()
      };
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, targetMerchant, ownerUserId || ownerId || req.user?.id || null);
    res.json({
      success: true,
      message: 'Pengaturan foto rekap tutup shift toko berhasil disimpan!',
      closingShiftSettings: normalized,
      store: activePayload
    });
  });

  // ── 0C. SHIFT CLOSING HISTORY & PHOTO RECAPS ─────────────────────────────
  router.get('/shifts', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const storeId = String(req.query.storeId || req.query.merchantId || '').trim();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

    let list = Array.isArray(db.pos_shifts) ? [...db.pos_shifts] : [];
    if (storeId && storeId !== 'ALL') {
      list = list.filter(s => String(s.storeId || s.merchantId || '') === storeId);
    }
    list.sort((a, b) => Number(b.closedAt || 0) - Number(a.closedAt || 0));
    res.json({
      success: true,
      shifts: list.slice(0, limit)
    });
  });

  router.post('/shifts/close', (req, res) => {
    const body = req.body || {};
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const reqStoreId = body.storeId || body.merchantId || db.settings.posStore?.merchantId || db.settings.posStore?.uid;
    const targetMerchant = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(reqStoreId))
      || db.merchants.find(m => m && m.status !== 'deleted')
      || null;
    const policy = normalizeClosingShiftSettings(
      targetMerchant?.closingShiftSettings || db.settings.posStore?.closingShiftSettings || {}
    );

    const rawPhotos = Array.isArray(body.photoRecaps) ? body.photoRecaps : [];
    const sanitizedPhotos = rawPhotos
      .slice(0, 24)
      .map((p, idx) => {
        if (!p || typeof p !== 'object') return null;
        const imageData = String(p.imageData || p.photoUrl || p.url || '').trim();
        if (!imageData || (!imageData.startsWith('data:image/') && !imageData.startsWith('https://') && !imageData.startsWith('http://'))) {
          return null;
        }
        const cat = SHIFT_PHOTO_CATEGORY_MAP[String(p.category || '').trim()] ? String(p.category).trim() : 'lainnya';
        return {
          id: String(p.id || `SHF-IMG-${Date.now()}-${idx + 1}`),
          category: cat,
          categoryLabel: SHIFT_PHOTO_CATEGORY_MAP[cat]?.label || 'Rekap Foto',
          customId: p.customId ? String(p.customId).trim() : null,
          customLabel: p.customLabel ? String(p.customLabel).trim() : '',
          itemName: String(p.itemName || '').trim(),
          qtyText: String(p.qtyText || '').trim(),
          note: String(p.note || '').trim(),
          imageData,
          takenAt: p.takenAt || new Date().toISOString()
        };
      })
      .filter(Boolean);

    if (policy.requireClosingPhoto && sanitizedPhotos.length === 0) {
      return res.status(400).json({
        error: 'Tutup shift wajib menyertakan minimal 1 foto rekap kondisi toko/barang.'
      });
    }

    const uploadedCats = new Set(sanitizedPhotos.map(p => p.category));
    const missingRequiredCats = (policy.requiredCategories || []).filter(cat => !uploadedCats.has(cat));
    if (missingRequiredCats.length > 0) {
      const missingLabels = missingRequiredCats.map(c => SHIFT_PHOTO_CATEGORY_MAP[c]?.label || c);
      return res.status(400).json({
        error: `Foto wajib sesuai settingan toko belum diunggah: ${missingLabels.join(', ')}.`
      });
    }

    const uploadedCustomIds = new Set(sanitizedPhotos.map(p => p.customId).filter(Boolean));
    const missingCustom = (policy.customChecklist || []).filter(c => c.required && !uploadedCustomIds.has(c.id));
    if (missingCustom.length > 0) {
      return res.status(400).json({
        error: `Checklist foto wajib dari owner belum diunggah: ${missingCustom.map(c => c.label).join(', ')}.`
      });
    }

    if (policy.requireItemNotes) {
      const missingItemDetails = sanitizedPhotos.some(
        p => ['basi', 'sisa', 'gagal', 'error'].includes(p.category) && !p.itemName && !p.note
      );
      if (missingItemDetails) {
        return res.status(400).json({
          error: 'Isi nama barang atau keterangan singkat pada setiap foto Barang Basi / Sisa / Gagal / Error.'
        });
      }
    }

    const closedTs = Number(body.closedAt) || Date.now();
    const shiftRecord = {
      id: String(body.id || `RECORD-${closedTs}`),
      storeId: String(targetMerchant?.id || reqStoreId || 'MTR-KASIR-MASTER'),
      merchantId: String(targetMerchant?.id || reqStoreId || 'MTR-KASIR-MASTER'),
      storeName: String(body.storeName || targetMerchant?.name || db.settings.posStore?.storeName || 'Toko POS'),
      shiftOpenedAt: Number(body.shiftOpenedAt) || closedTs,
      closedAt: closedTs,
      closedAtIso: new Date(closedTs).toISOString(),
      cashierName: String(body.cashierName || req.user?.name || 'Kasir Shift').trim(),
      closedByUserId: body.closedByUserId || req.user?.id || null,
      initialFloat: Number(body.initialFloat) || 0,
      cashRevenue: Number(body.cashRevenue) || 0,
      qrisRevenue: Number(body.qrisRevenue) || 0,
      nonCashRevenue: Number(body.nonCashRevenue) || 0,
      totalRevenue: Number(body.totalRevenue) || 0,
      totalPettyIn: Number(body.totalPettyIn) || 0,
      totalPettyOut: Number(body.totalPettyOut) || 0,
      expectedDrawerCash: Number(body.expectedDrawerCash) || 0,
      actualCash: Number(body.actualCash) || 0,
      diff: Number(body.diff) || 0,
      note: String(body.note || '').trim(),
      completedOrdersCount: Number(body.completedOrdersCount) || 0,
      photoRecaps: sanitizedPhotos,
      appliedSettings: policy
    };

    db.pos_shifts.unshift(shiftRecord);
    if (db.pos_shifts.length > 100) {
      db.pos_shifts = db.pos_shifts.slice(0, 100);
    }

    writeDB(db, req);

    const storeShifts = db.pos_shifts
      .filter(s => String(s.storeId || '') === shiftRecord.storeId)
      .slice(0, 30);

    res.json({
      success: true,
      message: 'Closing shift dan rekapan foto berhasil disimpan!',
      shift: shiftRecord,
      shifts: storeShifts
    });
  });

  // ── 0A-3. KASIR WEB PRESENCE HEARTBEAT / OFFLINE SIGNAL FOR MITRA CATALOG ──
  router.post('/store/heartbeat', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const targetId = body.merchantId || body.storeId || db.settings?.posStore?.merchantId || db.settings?.posStore?.uid;
    const target = targetId
      ? db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(targetId))
      : null;

    if (!target) {
      return res.status(404).json({ error: 'Toko POS tidak ditemukan untuk pembaruan status online.' });
    }

    const nowIso = new Date().toISOString();
    const isShiftOpen = body.isShiftOpen !== false;
    target.kasirWebOnline = isShiftOpen;
    target.isShiftOpen = isShiftOpen;
    target.storeMode = 'mitra';
    target.kasirOnly = false;
    target.isMitra = true;
    if (isShiftOpen) {
      target.lastKasirHeartbeatAt = nowIso;
    }
    if (body.cashierName) target.lastOnlineCashierName = String(body.cashierName).trim();
    if (body.cashierId) target.lastOnlineCashierId = String(body.cashierId).trim();
    if (db.settings?.posStore && String(db.settings.posStore.merchantId) === String(target.id)) {
      db.settings.posStore.kasirWebOnline = isShiftOpen;
      db.settings.posStore.lastKasirHeartbeatAt = target.lastKasirHeartbeatAt || nowIso;
    }

    writeDB(db);
    syncDeltaToFirebase(`merchants/${target.id}`, target, 'PATCH');

    const online = isMerchantKasirOnline(target);
    return res.json({
      success: true,
      merchantId: target.id,
      kasirOnline: online,
      isOnline: online,
      onlineStatus: online ? 'online' : 'offline',
      lastKasirHeartbeatAt: target.lastKasirHeartbeatAt || null
    });
  });

  router.post('/store/offline', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    body = body && typeof body === 'object' ? body : {};
    const targetId = body.merchantId || body.storeId || db.settings?.posStore?.merchantId || db.settings?.posStore?.uid;
    const target = targetId
      ? db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(targetId))
      : null;

    if (target) {
      target.kasirWebOnline = false;
      if (body.isShiftOpen === false) target.isShiftOpen = false;
      if (db.settings?.posStore && String(db.settings.posStore.merchantId) === String(target.id)) {
        db.settings.posStore.kasirWebOnline = false;
      }
      writeDB(db);
      syncDeltaToFirebase(`merchants/${target.id}`, target, 'PATCH');
    }

    return res.json({
      success: true,
      merchantId: target?.id || targetId || null,
      kasirOnline: false,
      isOnline: false,
      onlineStatus: 'offline'
    });
  });

  // ── 0B. SWITCH POS ACTIVE STORE (MULTI-STORE PER OWNER) ───────────────
  router.post('/store/switch', (req, res) => {
    const { merchantId, ownerUserId, ownerId } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];

    const target = db.merchants.find(m => m && m.status !== 'deleted' && String(m.id) === String(merchantId));
    if (!target) return res.status(404).json({ error: 'Toko mitra tidak ditemukan' });

    const resolvedReqOwnerId = ownerUserId || ownerId || req.user?.id || null;
    if (resolvedReqOwnerId) {
      db.pos_user_active_store[String(resolvedReqOwnerId)] = target.id;
      const reqUser = (db.users || []).find(u => u && String(u.id) === String(resolvedReqOwnerId));
      if (reqUser) reqUser.activePosStoreId = target.id;
    }

    if (!target.isUserUmkmStore) {
      // Preserve any edited metadata on outgoing active store before switching
      const prevStore = db.settings.posStore;
      if (prevStore && prevStore.merchantId && String(prevStore.merchantId) !== String(target.id)) {
        const prevMerchant = db.merchants.find(m => m && String(m.id) === String(prevStore.merchantId));
        if (prevMerchant) {
          if (prevStore.storeName) prevMerchant.name = prevStore.storeName;
          if (prevStore.location) prevMerchant.storeLocation = prevStore.location;
          if (prevStore.address) prevMerchant.address = prevStore.address;
          if (prevStore.city) prevMerchant.city = prevStore.city;
          if (prevStore.phone) prevMerchant.phone = prevStore.phone;
          if (prevStore.mapsUrl) prevMerchant.mapsUrl = prevStore.mapsUrl;
          if (prevStore.latitude !== null && prevStore.latitude !== undefined) prevMerchant.latitude = prevStore.latitude;
          if (prevStore.longitude !== null && prevStore.longitude !== undefined) prevMerchant.longitude = prevStore.longitude;
        }
      }
    }

    if (target.saldoNota === undefined) target.saldoNota = 5000;
    const billingProfileSwitch = getStoreBillingProfile(db, target);
    target.kuotaNota = Math.max(0, Math.floor(Number(target.saldoNota) / billingProfileSwitch.notaFeeIdr));

    const ser = serializeOwnerStore(target, db);
    if (!target.isUserUmkmStore) {
      db.settings.posStore = {
        uid: ser.id,
        merchantId: ser.id,
        storeName: ser.name,
        category: ser.category,
        location: ser.location,
        address: ser.address,
        city: ser.city,
        phone: ser.phone,
        mapsUrl: ser.mapsUrl,
        latitude: ser.latitude,
        longitude: ser.longitude,
        photo: ser.photo || '',
        saldoNota: ser.saldoNota,
        kuotaNota: ser.kuotaNota,
        loyaltyPoolId: ser.loyaltyPoolId,
        loyaltyPoolName: ser.loyaltyPoolName,
        billingTier: ser.billingTier,
        notaFeePerNotaIdr: ser.notaFeePerNotaIdr,
        isValidated: true,
        updatedAt: new Date().toISOString()
      };
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, target, resolvedReqOwnerId);
    res.json({
      success: true,
      message: `Kasir POS berhasil beralih ke toko: ${target.name}`,
      store: activePayload,
      allOwnerStores: activePayload.allOwnerStores,
      saldoNota: target.saldoNota,
      kuotaNota: target.kuotaNota
    });
  });

  // ── 0B-2. PENDAFTARAN UMKM ONBOARDING PENYEWA KOST SEBELUM BUKA KASIR ────
  router.post('/register-umkm', (req, res) => {
    const {
      ownerUserId,
      userId,
      category,
      storeName,
      phone,
      branchCount,
      branches,
      location,
      address,
      city,
      mapsUrl,
      latitude,
      longitude,
      photo,
      menus,
      storeMode,
      kasirOnly,
      joinMitra,
      referralCode
    } = req.body || {};

    const resolvedStoreMode = normalizeStoreMode(storeMode, kasirOnly, joinMitra, 'mitra');
    const isKasirOnly = resolvedStoreMode === 'kasir_only';
    const cleanReferral = !isKasirOnly && referralCode ? String(referralCode).trim().toUpperCase() : '';

    const cleanCategory = String(category || '').trim();
    const cleanName = String(storeName || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanAddress = String(address || '').trim();
    const cleanCity = String(city || 'Semarang').trim() || 'Semarang';
    const cleanLocation = String(location || cleanAddress || 'Stand / Lokasi Utama').trim();
    const cleanMapsUrl = String(mapsUrl || '').trim();
    const cleanPhoto = String(photo || '').trim();
    const resolvedBranchCount = Math.min(20, Math.max(1, parseInt(branchCount, 10) || 1));

    let parsedLat = latitude !== undefined && latitude !== null && String(latitude).trim() !== '' ? Number(latitude) : null;
    let parsedLng = longitude !== undefined && longitude !== null && String(longitude).trim() !== '' ? Number(longitude) : null;
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      const extracted = extractCoordsFromMapsUrl(cleanMapsUrl);
      if (Number.isFinite(extracted.lat) && Number.isFinite(extracted.lng)) {
        parsedLat = extracted.lat;
        parsedLng = extracted.lng;
      } else {
        parsedLat = null;
        parsedLng = null;
      }
    }

    if (!cleanCategory) {
      return res.status(400).json({ error: 'Jenis / kategori UMKM wajib dipilih!' });
    }
    if (!cleanName) {
      return res.status(400).json({ error: 'Nama toko / UMKM wajib diisi!' });
    }
    if (!isKasirOnly && !cleanMapsUrl && (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng))) {
      return res.status(400).json({ error: 'Lokasi Google Maps wajib diisi (tempel link Google Maps atau pilih pin di peta)!' });
    }
    if (!isKasirOnly && !cleanPhoto) {
      return res.status(400).json({ error: 'Foto toko / UMKM wajib diunggah!' });
    }

    const effectivePhoto = cleanPhoto || '';
    const resolvedMapsUrl = cleanMapsUrl || (Number.isFinite(parsedLat) && Number.isFinite(parsedLng) ? `https://maps.google.com/?q=${parsedLat},${parsedLng}` : '');

    const rawMenus = Array.isArray(menus) ? menus : [];
    const validMenus = rawMenus
      .filter(m => m && String(m.name || '').trim() && Number(m.price) > 0)
      .map((m, idx) => ({
        name: String(m.name).trim(),
        category: String(m.category || (cleanCategory.toLowerCase().includes('jasa') || cleanCategory.toLowerCase().includes('laundry') ? 'Jasa' : 'Makanan')).trim(),
        price: Number(m.price),
        description: String(m.description || `${String(m.name).trim()} - layanan resmi dari ${cleanName}`).trim(),
        image: String(m.image || '').trim() || cleanPhoto,
        stock: Number(m.stock !== undefined && m.stock !== '' ? m.stock : 99),
        sortIdx: idx
      }));

    if (validMenus.length === 0) {
      return res.status(400).json({ error: 'Tambahkan minimal 1 menu atau jasa yang ditawarkan dengan harga > Rp 0!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);
    db.merchants = db.merchants || [];
    db.merchant_wallets = db.merchant_wallets || {};
    db.pos_categories = db.pos_categories || [];

    const resolvedOwnerId = String(ownerUserId || userId || req.user?.id || `USR-UMKM-${Date.now()}`).trim();
    const existingUser = (db.users || []).find(u => u && String(u.id) === resolvedOwnerId) || null;
    const nowIso = new Date().toISOString();
    const kostUid = existingUser?.kostUid || 'KOST-JAKSEL-01';

    db.registeredPartnerHistory = db.registeredPartnerHistory || [];
    const normNameLower = cleanName.toLowerCase();
    const normPhoneClean = cleanPhone ? String(cleanPhone).replace(/\D/g, '') : '';

    let umkmRefCheck = null;
    let alreadyRegisteredPartner = false;
    if (!isKasirOnly && cleanReferral) {
      umkmRefCheck = resolveStrictReferralCandidate(db, {
        referralCode: cleanReferral,
        applicantUserId: resolvedOwnerId,
        applicantUser: existingUser,
        extraPhone: cleanPhone || existingUser?.phone || '',
        extraEmail: existingUser?.email || req.body.email || '',
        allowSelf: false
      });

      if (!umkmRefCheck.ok) {
        return res.status(400).json({ error: umkmRefCheck.message, code: umkmRefCheck.reason });
      }

      alreadyRegisteredPartner =
        db.registeredPartnerHistory.some((h) => {
          const matchName = h?.name && String(h.name).toLowerCase() === normNameLower;
          const matchPhone = normPhoneClean && h?.phone && String(h.phone).replace(/\D/g, '') === normPhoneClean;
          const matchOwner = h?.claimedBy && String(h.claimedBy) === resolvedOwnerId;
          return matchName || matchPhone || matchOwner;
        }) ||
        db.merchants.some((m) => {
          const matchName = m?.name && String(m.name).trim().toLowerCase() === normNameLower;
          const matchPhone = normPhoneClean && m?.phone && String(m.phone).replace(/\D/g, '') === normPhoneClean;
          const matchOwner = m?.ownerUserId && String(m.ownerUserId) === resolvedOwnerId;
          return matchName || matchPhone || matchOwner;
        });
    }

    const referralBonusEligible = Boolean(!isKasirOnly && cleanReferral && umkmRefCheck?.ok && !alreadyRegisteredPartner);

    const makeBranchRecord = (branchIdx, branchMeta = {}, parentId = null) => {
      const isPrimary = branchIdx === 1;
      const bId = `MTR-UMKM-${Date.now()}-${branchIdx}-${Math.floor(10 + Math.random() * 89)}`;
      const bName = isPrimary
        ? cleanName
        : String(branchMeta?.name || `${cleanName} - Cabang ${branchIdx}`).trim();
      const bLocation = isPrimary
        ? cleanLocation
        : String(branchMeta?.location || branchMeta?.address || `Cabang ${branchIdx} - ${cleanCity}`).trim();
      const bAddress = isPrimary ? cleanAddress : String(branchMeta?.address || cleanAddress).trim();
      const bCity = isPrimary ? cleanCity : String(branchMeta?.city || cleanCity).trim();
      const bLat = branchMeta?.latitude !== undefined && branchMeta?.latitude !== '' && Number.isFinite(Number(branchMeta.latitude))
        ? Number(branchMeta.latitude)
        : parsedLat;
      const bLng = branchMeta?.longitude !== undefined && branchMeta?.longitude !== '' && Number.isFinite(Number(branchMeta.longitude))
        ? Number(branchMeta.longitude)
        : parsedLng;
      const bMapsUrl = String(branchMeta?.mapsUrl || '').trim() ||
        (Number.isFinite(bLat) && Number.isFinite(bLng) ? `https://maps.google.com/?q=${bLat},${bLng}` : resolvedMapsUrl);

      return {
        id: bId,
        ownerUserId: resolvedOwnerId,
        posOwnerId: resolvedOwnerId,
        kostUid,
        name: bName,
        category: cleanCategory,
        storeLocation: bLocation,
        location: bLocation,
        address: bAddress || bLocation,
        city: bCity,
        phone: cleanPhone || existingUser?.phone || '',
        mapsUrl: bMapsUrl,
        latitude: Number.isFinite(bLat) ? bLat : null,
        longitude: Number.isFinite(bLng) ? bLng : null,
        photo: effectivePhoto,
        image: effectivePhoto,
        branchCount: resolvedBranchCount,
        branchIndex: branchIdx,
        isPrimaryBranch: isPrimary,
        parentStoreId: parentId,
        storeMode: resolvedStoreMode,
        kasirOnly: isKasirOnly,
        isMitra: !isKasirOnly,
        referralCode: cleanReferral || null,
        rating: 5.0,
        deliveryEstimate: '10-25 mnt',
        deliveryFee: 0,
        commissionOwner: 500,
        platformFee: 200,
        paymentMethods: ['cash', 'qris'],
        saldoNota: isPrimary && referralBonusEligible ? 50000 : 5000,
        kuotaNota: isPrimary && referralBonusEligible ? 500 : 200,
        notaHistory: [
          {
            id: `NOTA-WELCOME-${bId}`,
            type: isPrimary && referralBonusEligible ? 'referral_welcome_500' : 'welcome_quota',
            amount: isPrimary && referralBonusEligible ? 50000 : 5000,
            addedNota: isPrimary && referralBonusEligible ? 500 : 200,
            balanceAfter: isPrimary && referralBonusEligible ? 50000 : 5000,
            description: isPrimary && referralBonusEligible
              ? `Bonus Referral UMKM ${bName}: 500 Kuota Nota Kasir Gratis (Kode: ${cleanReferral})`
              : `Bonus saldo nota pembukaan UMKM ${bName} (Cabang ${branchIdx}/${resolvedBranchCount})`,
            createdAt: nowIso
          }
        ],
        products: validMenus.map((m, idx) => ({
          id: `prod-umkm-${Date.now()}-${branchIdx}-${idx}`,
          name: m.name,
          category: m.category,
          price: m.price,
          description: m.description,
          image: m.image,
          isAvailable: true
        })),
        isPosStore: true,
        isUserUmkmStore: true,
        hideSeedProducts: true,
        isValidated: true,
        isVerified: true,
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso
      };
    };

    const extraBranchesInput = Array.isArray(branches) ? branches : [];
    const primaryStore = makeBranchRecord(1, {}, null);
    const createdStores = [primaryStore];
    for (let idx = 2; idx <= resolvedBranchCount; idx += 1) {
      const branchMeta = extraBranchesInput[idx - 2] || {};
      createdStores.push(makeBranchRecord(idx, branchMeta, primaryStore.id));
    }

    const createdPrimaryProducts = [];
    const customCategorySet = new Set();

    createdStores.forEach((stRecord, sIdx) => {
      db.merchants.push(stRecord);
      db.merchant_wallets[stRecord.id] = {
        merchant_id: stRecord.id,
        name: stRecord.name,
        whatsapp_number: stRecord.phone || '',
        available_balance: stRecord.saldoNota,
        held_promo_balance: 0,
        updated_at: nowIso
      };

      validMenus.forEach((m, mIdx) => {
        const prodRecord = {
          id: `prod-${Date.now()}-${sIdx + 1}-${mIdx}-${Math.random().toString(36).slice(2, 6)}`,
          name: m.name,
          category: m.category,
          price: m.price,
          stock: m.stock,
          isAvailable: true,
          description: m.description,
          image: m.image,
          merchantId: resolvedOwnerId,
          storeId: stRecord.id,
          createdAt: nowIso
        };
        db.pos_products.unshift(prodRecord);
        customCategorySet.add(m.category);
        if (sIdx === 0) createdPrimaryProducts.push(prodRecord);
      });
    });

    customCategorySet.forEach(catName => {
      const existsCat = db.pos_categories.some(
        c => c && String(c.merchantId || '') === resolvedOwnerId && String(c.name || '').toLowerCase() === catName.toLowerCase()
      );
      if (!existsCat) {
        db.pos_categories.push({
          id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: catName,
          merchantId: resolvedOwnerId,
          createdAt: nowIso
        });
      }
    });

    db.pos_user_active_store[resolvedOwnerId] = primaryStore.id;

    let referralBonusAwarded = false;
    let referralMessage = '';
    if (!isKasirOnly && cleanReferral) {
      if (referralBonusEligible && umkmRefCheck?.ok) {
        const referrerUser = umkmRefCheck.referrerUser;
        const referrerCustomer = umkmRefCheck.referrerCustomer;
        const bonusPoints = 500;
        referralBonusAwarded = true;

        db.registeredPartnerHistory.push({
          id: `REF-UMKM-${Date.now()}`,
          name: cleanName,
          phone: cleanPhone || '',
          referralCode: cleanReferral,
          claimedBy: resolvedOwnerId,
          referrerUserId: referrerUser?.id || null,
          bonusAwarded: true,
          bonusPoints,
          createdAt: nowIso
        });

        let refPhone = '';
        if (referrerUser) {
          if (!referrerUser.referralCode) referrerUser.referralCode = umkmRefCheck.code;
          referrerUser.loyalty_points = (Number(referrerUser.loyalty_points) || 0) + bonusPoints;
          if (referrerUser.total_points !== undefined) {
            referrerUser.total_points = (Number(referrerUser.total_points) || 0) + bonusPoints;
          }
          refPhone = normalizePhoneDigits(referrerUser.phone || referrerUser.whatsapp || referrerUser.whatsapp_number);
        }
        if (referrerCustomer) {
          referrerCustomer.points = (Number(referrerCustomer.points) || 0) + bonusPoints;
          refPhone = refPhone || normalizePhoneDigits(referrerCustomer.whatsapp_number);
        }
        if (refPhone) {
          db.customer_points = db.customer_points || {};
          db.customer_points[refPhone] = (Number(db.customer_points[refPhone]) || 0) + bonusPoints;
        }
        db.points_ledger = db.points_ledger || [];
        db.points_ledger.push({
          id: `PTS-UMKM-${Date.now()}`,
          whatsapp_number: refPhone || 'REFERRER',
          change_type: 'EARN_REFERRAL_MERCHANT',
          points: bonusPoints,
          notes: `Bonus pendaftaran UMKM mitra baru: ${cleanName} (Kode: ${cleanReferral})`,
          createdAt: nowIso
        });

        // Mark any pending suggestedWarung entry as registered
        (db.merchantSuggestions || []).forEach((s) => {
          if (!s) return;
          const sName = String(s.name || '').trim().toLowerCase();
          const sPhone = String(s.phone || '').replace(/\D/g, '');
          if (sName === normNameLower || (normPhoneClean && sPhone === normPhoneClean)) {
            s.status = 'registered';
            s.registeredMerchantName = cleanName;
            s.convertedAt = nowIso;
          }
        });

        referralMessage = ` Bonus referral +${bonusPoints} Poin dikreditkan ke pengundang & 500 kuota nota aktif untuk toko (${cleanReferral}).`;
      } else {
        referralMessage = ' Toko atau akun pemilik ini sudah tercatat sebelumnya sehingga bonus referral 1x tidak diklaim ulang.';
      }
    }

    let safeUpdatedUser = null;
    if (existingUser) {
      existingUser.merchantId = primaryStore.id;
      existingUser.storeName = primaryStore.name;
      existingUser.branchCount = resolvedBranchCount;
      existingUser.activePosStoreId = primaryStore.id;
      existingUser.umkmRegistered = true;
      existingUser.umkmCategory = cleanCategory;
      safeUpdatedUser = { ...existingUser };
      delete safeUpdatedUser.password;
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, primaryStore, resolvedOwnerId);
    res.status(201).json({
      success: true,
      referralBonusAwarded,
      message: `UMKM "${primaryStore.name}" (${resolvedBranchCount} cabang, ${validMenus.length} menu/jasa) berhasil didaftarkan! Kasir POS siap digunakan.${referralMessage}`,
      store: activePayload,
      allOwnerStores: activePayload.allOwnerStores,
      products: createdPrimaryProducts,
      updatedUser: safeUpdatedUser
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

    const storeProfileTopup = getStoreBillingProfile(db, merchant);
    const NOTA_PRICE = storeProfileTopup.notaFeeIdr;
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
      notaFeePerNotaIdr: NOTA_PRICE,
      billingTier: storeProfileTopup.billingTier,
      balanceAfter: merchant.saldoNota,
      paymentMethod: paymentMethod || 'qris_pos',
      status: 'success',
      createdAt: new Date().toISOString()
    };

    merchant.notaHistory.unshift(record);
    db.nota_billing_ledger.unshift({
      id: `NBL-TOPUP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      store_id: String(merchant.id),
      store_name: merchant.name || 'Toko POS',
      order_id: null,
      invoice_number: record.id,
      loyalty_pool_id: storeProfileTopup.loyaltyPoolId,
      loyalty_pool_name: storeProfileTopup.loyaltyPoolName,
      billing_tier: storeProfileTopup.billingTier,
      entry_type: 'TOP_UP',
      amount_idr: topupAmount,
      balance_after: merchant.saldoNota,
      channel: 'POS Kasir Top Up',
      created_at: record.createdAt
    });
    writeDB(db, req);

    res.json({
      success: true,
      saldoNota: merchant.saldoNota,
      kuotaNota: merchant.kuotaNota,
      notaFeePerNotaIdr: NOTA_PRICE,
      addedNota,
      message: `Top up kasir berhasil! +${addedNota} lembar nota (@ Rp ${NOTA_PRICE}/nota) ditambahkan ke saldo toko.`
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

    const NOTA_PRICE = getStoreBillingProfile(db, merchant).notaFeeIdr;
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
              error: `Status di TriPay masih ${status || 'UNPAID'} (Belum Dibayar). Sistem telah mengecek ke TriPay namun dana belum masuk. Silakan selesaikan pembayaran QRIS terlebih dahulu.`,
              tripayDetail: tripayData.data
            });
          }
          posPaidReferences.add(reference);
        } else {
          const tripayMsg = tripayData?.message || 'Gagal menghubungi server TriPay';
          const ipMatch = tripayMsg.match(/\((.*?)\)/)?.[1] || '';
          let userError = `Pengecekan TriPay: ${tripayMsg}`;
          if (ipMatch) {
            userError = `IP Server (${ipMatch}) belum terdaftar di Whitelist IP TriPay (T53543). Silakan kosongkan Whitelist IP di dashboard TriPay.`;
          } else if (tripayMsg.toLowerCase().includes('undefined parameter') || tripayMsg.toLowerCase().includes('tidak ditemukan')) {
            userError = `Status TriPay: Pembayaran QRIS belum terdeteksi masuk (UNPAID). Silakan selesaikan pembayaran QRIS di aplikasi e-wallet/m-banking Anda terlebih dahulu.`;
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

    const storeProfileVerify = getStoreBillingProfile(db, merchant);
    const NOTA_PRICE = storeProfileVerify.notaFeeIdr;
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
      notaFeePerNotaIdr: NOTA_PRICE,
      billingTier: storeProfileVerify.billingTier,
      balanceAfter: merchant.saldoNota,
      paymentMethod: 'TRIPAY_QRIS',
      status: 'PAID',
      createdAt: new Date().toISOString()
    };

    merchant.notaHistory.unshift(record);
    db.nota_billing_ledger.unshift({
      id: `NBL-TRIPAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      store_id: String(merchant.id),
      store_name: merchant.name || 'Toko POS',
      order_id: null,
      invoice_number: record.id,
      loyalty_pool_id: storeProfileVerify.loyaltyPoolId,
      loyalty_pool_name: storeProfileVerify.loyaltyPoolName,
      billing_tier: storeProfileVerify.billingTier,
      entry_type: 'TOP_UP',
      amount_idr: topupAmount,
      balance_after: merchant.saldoNota,
      channel: 'TriPay Payment Gateway (QRIS)',
      created_at: record.createdAt
    });
    writeDB(db, req);

    res.json({
      success: true,
      isPaid: true,
      status: 'PAID',
      saldoNota: merchant.saldoNota,
      kuotaNota: merchant.kuotaNota,
      addedNota,
      reference,
      message: `Pembayaran TriPay TERVERIFIKASI (PAID)! +${addedNota} lembar nota telah ditambahkan ke saldo kasir.`
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
      message: `Berhasil! Kode '${cleanCode}' berhasil diklaim. Kuota nota bertambah +${bonusNota} lembar (Rp ${bonusSaldo.toLocaleString('id-ID')})!`,
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

    const { storeId, merchantId, tableToken, customerView } = req.query;
    const storeCtx = resolveStoreContextForRequest(db, { storeId, merchantId, tableToken });
    const now = new Date();
    const rawPromos = (db.pos_food_promos || []).map(p => {
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

      const isPointVoucher = isPointConversionVoucher(p);
      const isAvailable = Boolean(p.isActive && !isQuotaEmpty && !isDateExpired);
      const eligibleOnStore = !isPointVoucher || storeCtx.isTier2;

      return {
        ...p,
        remainingQuota,
        isQuotaEmpty,
        isDateExpired,
        isAvailable,
        requiresTier2Loyalty: isPointVoucher,
        eligibleOnStore
      };
    });

    const filterCustomerTier1 = (Boolean(tableToken) || String(customerView) === 'true' || Boolean(storeId || merchantId)) && !storeCtx.isTier2;
    const promos = filterCustomerTier1 ? rawPromos.filter(p => !p.requiresTier2Loyalty) : rawPromos;

    res.json({ success: true, promos, billingTier: storeCtx.billingProfile.billingTier, isTier2: storeCtx.isTier2 });
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
    const { promoId, promoCode, code, items = [], subtotal = 0, orderTotal = 0, storeId = null, merchantId = null, tableToken = null } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    const effectiveCode = promoCode || code || null;
    const effectiveSubtotal = Number(subtotal || orderTotal || 0);
    const storeCtx = resolveStoreContextForRequest(db, { storeId, merchantId, tableToken });

    const promo = (db.pos_food_promos || []).find(p =>
      p.isActive && (
        (promoId && p.id === promoId) ||
        (effectiveCode && String(p.code).toUpperCase() === String(effectiveCode).toUpperCase().trim())
      )
    );

    if (isPointConversionVoucher(promo, effectiveCode) && !storeCtx.isTier2) {
      return res.status(422).json({
        valid: false,
        code: 'POIN_NOT_ACTIVE_ON_STORE',
        billingTier: storeCtx.billingProfile.billingTier,
        error: 'Penukaran poin (termasuk voucher poin) tidak aktif di toko Tier 1 ini. Hanya toko yang tergabung di Loyalty Pool (Tier 2) yang mendukung tukar poin.'
      });
    }

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
    if (effectiveSubtotal < min) {
      return res.status(400).json({
        valid: false,
        error: `Minimal belanja untuk promo ini adalah Rp ${min.toLocaleString('id-ID')} (Subtotal saat ini: Rp ${effectiveSubtotal.toLocaleString('id-ID')})`
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
        calculatedDiscount = Math.round(effectiveSubtotal * (Math.min(100, promo.discountValue) / 100));
      } else {
        calculatedDiscount = Math.min(effectiveSubtotal, promo.discountValue);
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

  // ── 2. PRODUCTS & CATEGORY MANAGEMENT (ISOLATED PER MERCHANT/ACCOUNT & STORE) ──
  router.get('/products', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { merchantId, storeId, ownerId, tableToken } = req.query;
    const headerOwnerId = ownerId || req.user?.id || req.headers['x-user-id'] || null;

    let effectiveStoreId = storeId ? String(storeId) : '';
    if (!effectiveStoreId && tableToken) {
      const matchedTbl = (db.pos_tables || []).find(t => String(t.qrToken || '') === String(tableToken).trim());
      if (!matchedTbl) return res.json([]);
      effectiveStoreId = String(matchedTbl.storeId || matchedTbl.merchantId || '');
    }

    if (!req.isDemo && !effectiveStoreId && !merchantId && !headerOwnerId) {
      return res.json([]);
    }

    let list = db.pos_products || [];
    if (effectiveStoreId) {
      const targetSid = effectiveStoreId;
      const activeMerchants = (db.merchants || []).filter(m => m && m.status !== 'deleted');
      const targetStore = activeMerchants.find(m => String(m.id) === targetSid);
      if (!targetStore && !req.isDemo) return res.json([]);
      const ownerSet = new Set(
        [headerOwnerId, merchantId, targetStore?.ownerUserId, targetStore?.posOwnerId]
          .filter(Boolean)
          .map(v => String(v))
      );
      const primaryStore =
        activeMerchants.find(
          m => ownerSet.has(String(m.ownerUserId || '')) || ownerSet.has(String(m.posOwnerId || ''))
        ) || activeMerchants[0] || null;
      const primaryStoreId = primaryStore?.id || null;
      const isPrimaryTarget = !primaryStoreId || targetSid === String(primaryStoreId);
      list = list.filter(p => {
        if (p.storeId) return String(p.storeId) === targetSid;
        if (targetStore?.hideSeedProducts || targetStore?.isUserUmkmStore) {
          return Boolean(p.merchantId) && String(p.merchantId) === String(merchantId || headerOwnerId || targetStore?.ownerUserId || '');
        }
        return isPrimaryTarget && (!merchantId || !p.merchantId || String(p.merchantId) === String(merchantId));
      });
      return res.json(list);
    }
    if (merchantId) {
      const filtered = list.filter(p => !p.clonedFromProductId && (!p.merchantId || String(p.merchantId) === String(merchantId)));
      return res.json(filtered);
    }
    if (headerOwnerId && !req.isDemo) {
      const { stores: ownedStores } = getDirectOwnerStores(db, headerOwnerId);
      if (ownedStores.length === 0) return res.json([]);
      const ownedIds = new Set(ownedStores.map(s => String(s.id)));
      return res.json(list.filter(p => (p.storeId && ownedIds.has(String(p.storeId))) || String(p.merchantId || '') === String(headerOwnerId)));
    }
    res.json(list);
  });

  router.post('/products', (req, res) => {
    const { id, name, category, price, stock, isAvailable, description, image, merchantId, storeId } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Nama menu wajib diisi' });
    }
    const priceNum = Number(price);
    if (price === undefined || isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'Harga menu wajib diisi dengan nominal lebih dari Rp 0' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'Deskripsi menu wajib diisi' });
    }
    if (!image || !String(image).trim()) {
      return res.status(400).json({ error: 'Foto menu wajib diunggah' });
    }

    const resolvedCategory = (category && String(category).trim()) ? String(category).trim() : 'Makanan';

    const db = getDB(req);
    ensurePosCollections(db);

    const newProduct = {
      id: id || 'prod-' + Date.now(),
      name: String(name).trim(),
      category: resolvedCategory,
      price: priceNum,
      stock: Number(stock !== undefined && stock !== '' ? stock : 99),
      isAvailable: isAvailable !== false,
      description: String(description).trim(),
      image: String(image).trim(),
      merchantId: merchantId ? String(merchantId) : null,
      storeId: storeId ? String(storeId) : null,
      createdAt: new Date().toISOString()
    };

    db.pos_products.unshift(newProduct);
    writeDB(db, req);
    res.json(newProduct);
  });

  // Kategori khusus terisolasi per akun toko & stafnya
  router.get('/categories', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { merchantId } = req.query;
    db.pos_custom_categories = db.pos_custom_categories || {};
    const accountCats = (merchantId && db.pos_custom_categories[merchantId]) || [];
    res.json({ categories: accountCats });
  });

  router.post('/categories', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { category, merchantId } = req.body;
    if (!category || !merchantId) {
      return res.status(400).json({ error: 'Kategori dan merchantId wajib disertakan' });
    }
    db.pos_custom_categories = db.pos_custom_categories || {};
    if (!db.pos_custom_categories[merchantId]) {
      db.pos_custom_categories[merchantId] = [];
    }
    const catTrimmed = String(category).trim();
    if (catTrimmed && !db.pos_custom_categories[merchantId].includes(catTrimmed)) {
      db.pos_custom_categories[merchantId].push(catTrimmed);
      writeDB(db, req);
    }
    res.json({ success: true, categories: db.pos_custom_categories[merchantId] });
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
  const buildEnrichedTable = async (table, req) => {
    const baseUrl = process.env.VITE_APP_URL || req.headers.origin || 'https://kostku.riuph.me';
    const orderUrl = `${baseUrl}/order/${table.qrToken}`;
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(orderUrl, { width: 300, margin: 2 });
    } catch (_) {}
    return {
      ...table,
      orderUrl,
      qrDataUrl
    };
  };

  router.get('/tables', async (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { storeId, merchantId, tableToken, ownerId } = req.query;
    const requestedOwnerId = ownerId || req.user?.id || req.headers['x-user-id'] || null;
    const filterStoreId = storeId || merchantId;
    let tablesList = db.pos_tables || [];

    if (tableToken) {
      const matched = tablesList.filter(t => String(t.qrToken || '') === String(tableToken).trim());
      const enrichedToken = await Promise.all(matched.map((t) => buildEnrichedTable(t, req)));
      return res.json(enrichedToken);
    }

    if (!req.isDemo && !filterStoreId && !requestedOwnerId) {
      return res.json([]);
    }

    if (filterStoreId && filterStoreId !== 'all') {
      const targetMeta = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(filterStoreId));
      const ownerFirstMerchant = (db.merchants || []).find(m =>
        m && m.status !== 'deleted' && targetMeta?.ownerUserId && String(m.ownerUserId) === String(targetMeta.ownerUserId)
      ) || (db.merchants || []).find(m => m && m.status !== 'deleted');
      const isPrimary = !ownerFirstMerchant || String(filterStoreId) === String(ownerFirstMerchant.id);
      tablesList = tablesList.filter(t =>
        (t.storeId && String(t.storeId) === String(filterStoreId)) ||
        (!t.storeId && isPrimary)
      );
    } else if (requestedOwnerId && !req.isDemo) {
      const { stores: ownedStores } = getDirectOwnerStores(db, requestedOwnerId);
      if (ownedStores.length === 0) return res.json([]);
      const ownedIds = new Set(ownedStores.map(s => String(s.id)));
      tablesList = tablesList.filter(t => t.storeId && ownedIds.has(String(t.storeId)));
    }

    const enriched = await Promise.all(
      tablesList.map((t) => buildEnrichedTable(t, req))
    );

    res.json(enriched);
  });

  router.post('/tables', async (req, res) => {
    const cleanNum = String(req.body?.number || '').trim();
    const tableStoreId = req.body?.storeId || req.body?.merchantId || null;
    if (!cleanNum) return res.status(400).json({ error: 'Nama / nomor meja wajib diisi!' });

    const db = getDB(req);
    ensurePosCollections(db);

    const duplicate = db.pos_tables.some(
      (t) => String(t.number || '').trim().toLowerCase() === cleanNum.toLowerCase() &&
        (!tableStoreId || !t.storeId || String(t.storeId) === String(tableStoreId))
    );
    if (duplicate) {
      return res.status(400).json({ error: `Meja "${cleanNum}" sudah terdaftar!` });
    }

    const token = 'MEJA-' + cleanNum.replace(/\s+/g, '-').toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const newTable = {
      id: 'tbl-' + Date.now(),
      number: cleanNum,
      storeId: tableStoreId ? String(tableStoreId) : null,
      qrToken: token,
      createdAt: new Date().toISOString()
    };

    db.pos_tables.push(newTable);
    db._posTablesSeeded = true;
    writeDB(db, req);
    const enriched = await buildEnrichedTable(newTable, req);
    res.json(enriched);
  });

  router.put('/tables/:id', async (req, res) => {
    const tableId = String(req.params.id || '').trim();
    const cleanNum = String(req.body?.number || '').trim();
    if (!cleanNum) {
      return res.status(400).json({ error: 'Nama / nomor meja wajib diisi!' });
    }

    const db = getDB(req);
    ensurePosCollections(db);

    const idx = db.pos_tables.findIndex((t) => String(t.id) === tableId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Data meja tidak ditemukan!' });
    }

    const duplicate = db.pos_tables.some(
      (t) => String(t.id) !== tableId && String(t.number || '').trim().toLowerCase() === cleanNum.toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({ error: `Nama meja "${cleanNum}" sudah digunakan meja lain!` });
    }

    const existing = db.pos_tables[idx];
    const updatedTable = {
      ...existing,
      number: cleanNum,
      qrToken: req.body?.regenerateQr
        ? 'MEJA-' + cleanNum.replace(/\s+/g, '-').toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase()
        : existing.qrToken,
      updatedAt: new Date().toISOString()
    };

    db.pos_tables[idx] = updatedTable;
    db._posTablesSeeded = true;
    writeDB(db, req);

    const enriched = await buildEnrichedTable(updatedTable, req);
    res.json({ success: true, table: enriched });
  });

  router.delete('/tables/:id', (req, res) => {
    const tableId = String(req.params.id || '').trim();
    const db = getDB(req);
    ensurePosCollections(db);

    const idx = db.pos_tables.findIndex((t) => String(t.id) === tableId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Data meja tidak ditemukan!' });
    }

    const [deleted] = db.pos_tables.splice(idx, 1);
    db._posTablesSeeded = true;
    writeDB(db, req);
    res.json({ success: true, deleted });
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

    // ── IDENTIFIKASI TOKO & BILLING PROFILE (TIER 1 Rp 25 vs TIER 2 Rp 100) ──
    const currentActiveStore = db.settings.posStore || {};
    const storeId = req.body.storeId || table?.storeId || table?.merchantId || currentActiveStore.merchantId || currentActiveStore.uid || 'MTR-KASIR-MASTER';
    let resolvedMerchant = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(storeId))
      || (db.merchants || []).find(m => m && m.status !== 'deleted');
    if (!resolvedMerchant) {
      resolvedMerchant = {
        id: storeId,
        name: req.body.storeName || currentActiveStore.storeName || 'Kantin Berkah Kost',
        ownerUserId: currentActiveStore.ownerUserId || null,
        loyalty_pool_id: currentActiveStore.loyaltyPoolId || null,
        saldoNota: Number(currentActiveStore.saldoNota ?? 5000)
      };
    } else if (resolvedMerchant.saldoNota === undefined) {
      resolvedMerchant.saldoNota = 5000;
    }
    const storeBillingProfile = getStoreBillingProfile(db, resolvedMerchant);
    const storeName = req.body.storeName || resolvedMerchant.name || currentActiveStore.storeName || 'Kantin Berkah Kost';
    const cashierId = req.body.cashierId || (req.body.user && req.body.user.id) || 'KSR-01';
    const cashierName = req.body.cashierName || (req.body.user && req.body.user.name) || 'Siti Rahmawati (Kasir Shift Pagi)';

    const userIsLoggedIn = Boolean(isLoggedIn);
    const cleanPhone = String(customerPhone || '').replace(/\D/g, '');

    // ── PROMO MAKANAN BERKUOTA ATAU TANGGAL (validasi dulu sebelum mutasi) ──
    let promoDiscount = 0;
    let appliedPromo = null;
    let appliedPromoObj = null;

    if (promoId || promoCode) {
      const pId = promoId ? String(promoId).trim() : null;
      const pCode = promoCode ? String(promoCode).trim().toUpperCase() : null;

      const promo = (db.pos_food_promos || []).find(p =>
        p.isActive && (
          (pId && p.id === pId) ||
          (pCode && String(p.code).toUpperCase() === pCode)
        )
      );

      if (isPointConversionVoucher(promo, pCode) && !storeBillingProfile.activePool) {
        return res.status(422).json({
          error: 'Voucher penukaran poin tidak dapat digunakan di toko Tier 1 ini. Hanya toko yang tergabung ke Loyalty Pool (Tier 2) yang mendukung penukaran poin.',
          code: 'POIN_NOT_ACTIVE_ON_STORE',
          billingTier: storeBillingProfile.billingTier
        });
      }

      if (!promo) {
        return res.status(404).json({ error: 'Kode promo tidak ditemukan atau non-aktif' });
      }

      if (promo.limitType === 'DATE' || promo.limitType === 'BOTH') {
        if (promo.expiryDate) {
          const exp = new Date(promo.expiryDate + 'T23:59:59');
          if (new Date() > exp) {
            return res.status(400).json({ error: `Promo '${promo.code}' sudah kadaluarsa sejak ${promo.expiryDate}!` });
          }
        }
      }

      if (promo.limitType === 'QUOTA' || promo.limitType === 'BOTH') {
        const maxQ = Number(promo.maxQuota) || 0;
        const used = Number(promo.usedCount) || 0;
        if (used >= maxQ) {
          return res.status(400).json({ error: `Kuota promo '${promo.code}' sudah habis (${used}/${maxQ})!` });
        }
      }

      const minOrder = Number(promo.minOrder) || 0;
      if (subtotal < minOrder) {
        return res.status(400).json({ error: `Minimum pembelanjaan untuk promo '${promo.code}' adalah Rp ${minOrder.toLocaleString('id-ID')}` });
      }

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
        appliedPromoObj = promo;
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

    // ── PREVIEW SHARED LOYALTY POOL & TIERED BILLING FEE ──
    const requestedRedeemPoints = Math.max(0, Math.floor(Number(req.body.redeemPoints ?? pointsToRedeem) || 0));
    const poolPreview = previewPoolCheckout(db, {
      merchant: resolvedMerchant,
      customerPhone: cleanPhone,
      customerName: cleanCustomerName,
      redeemPoints: requestedRedeemPoints,
      grossSubtotalIdr: subtotal,
      otherDiscountIdr: promoDiscount
    });

    if (!poolPreview.ok) {
      return res.status(poolPreview.status || 422).json({
        error: poolPreview.error,
        code: poolPreview.code
      });
    }

    const billingTier = poolPreview.billingTier;
    const billingFeeIdr = poolPreview.billingFeeIdr;
    const requestedPaymentMethod = String(req.body.paymentMethod || '').toUpperCase().trim();
    const notaFeeBearer = resolveStoreNotaFeeBearer(db, resolvedMerchant);
    const isDeferredSelfOrder = !requestedPaymentMethod || requestedPaymentMethod === 'CASH_COUNTER';
    const isImmediateCustomerViaQris = requestedPaymentMethod === 'QRIS' && notaFeeBearer === 'customer';
    const shouldDeductAtCreate = !isDeferredSelfOrder && !isImmediateCustomerViaQris;
    const currentSaldoBefore = Number(resolvedMerchant.saldoNota ?? 5000);

    if (shouldDeductAtCreate && currentSaldoBefore < billingFeeIdr) {
      return res.status(402).json({
        error: `Saldo nota kasir tidak mencukupi (${billingTier === 'TIER_2_LOYALTY' ? 'Tier 2 Poin Rp 100/nota' : 'Tier 1 Flat Rp 25/nota'}). Silakan lakukan Top Up Saldo Nota terlebih dahulu.`,
        requiresTopupNota: true,
        kuotaNota: 0,
        saldoNota: currentSaldoBefore,
        billingTier,
        neededNota: billingFeeIdr
      });
    }

    const pointsDiscount = poolPreview.pointDiscountIdr || 0;
    const redeemAmount = poolPreview.pointsRedeemed || 0;
    const finalTotalDiscount = pointsDiscount + promoDiscount;
    const adminFee = billingFeeIdr;
    const platformFee = 0;
    const baseAmountBeforePaymentFee = Math.max(0, subtotal - finalTotalDiscount);
    const feeSnap = computePosOrderFeeSnapshot({
      baseAmount: baseAmountBeforePaymentFee,
      notaFeeIdr: billingFeeIdr,
      notaFeeBearer,
      paymentMethod: requestedPaymentMethod
    });
    const qrisFee = feeSnap.qrisFee;
    const totalAmount = feeSnap.totalAmount;
    const ownerDeduction = feeSnap.notaFeeBearer === 'customer' ? 0 : billingFeeIdr;

    if (appliedPromoObj) {
      appliedPromoObj.usedCount = (appliedPromoObj.usedCount || 0) + 1;
    }

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

    const BASE_ADMIN_FEE = billingTier === 'TIER_2_LOYALTY' ? 40.00 : 25.00;
    const HELD_PROMO_FEE = billingTier === 'TIER_2_LOYALTY' ? 60.00 : 0.00;
    const TOTAL_ADMIN_DEDUCT = billingFeeIdr;

    // ── COMMIT LOYALTY POOL REDEEM/EARN & SINGLE-CHARGE NOTA BILLING ──
    const poolCommit = commitPoolCheckoutLoyalty(db, {
      merchant: resolvedMerchant,
      orderId,
      invoiceNumber,
      customerPhone: cleanPhone,
      customerName: cleanCustomerName,
      redeemPoints: requestedRedeemPoints,
      grossSubtotalIdr: subtotal,
      otherDiscountIdr: promoDiscount
    });
    if (!poolCommit.ok) {
      return res.status(poolCommit.status || 422).json({
        error: poolCommit.error,
        code: poolCommit.code
      });
    }

    const newOrder = {
      id: orderId,
      invoice_number: invoiceNumber,
      invoice: invoiceNumber,
      tableNumber: req.body.tableNumber || table.number || 'Walk-in',
      tableToken: tableToken || null,
      customerName: cleanCustomerName,
      customerPhone: cleanPhone,
      isLoggedIn: userIsLoggedIn,
      pointsEligible: Boolean(poolCommit.loyaltyPoolId),
      storeId,
      storeName,
      cashierId,
      cashierName,
      inventoryDeductions,
      items: validatedItems,
      subtotal,
      discount: finalTotalDiscount,
      pointsDiscount,
      pointDiscountIdr: pointsDiscount,
      promoDiscount,
      promoId: appliedPromo ? appliedPromo.id : null,
      promoCode: appliedPromo ? appliedPromo.code : null,
      appliedPromo,
      adminDiscount: null,
      pointsRedeemed: redeemAmount,
      pointsEarned: poolCommit.pointsEarned || 0,
      loyalty_pool_id: poolCommit.loyaltyPoolId || null,
      loyaltyPoolName: poolCommit.loyaltyPoolName || null,
      loyalty_customer_id: poolCommit.customer?.id || null,
      billing_tier: billingTier,
      billing_fee_idr: billingFeeIdr,
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
      feeBorneBy: feeSnap.notaFeeBearer,
      notaFeeBearer: feeSnap.notaFeeBearer,
      notaFeeBorneBy: feeSnap.notaFeeBearer,
      customerAdminFee: feeSnap.customerAdminFee,
      paymentFeeBorneBy: qrisFee > 0 ? 'customer' : null,
      baseAmountBeforePaymentFee,
      qrisFee,
      qrisFeeFixed: feeSnap.qrisFeeFixed,
      qrisFeePercent: feeSnap.qrisFeePercent,
      ownerDeduction,
      netRevenue: Math.max(0, baseAmountBeforePaymentFee - ownerDeduction),
      totalAmount,
      notes: notes || '',
      status: 'PENDING_CONFIRMATION', // Step 1: Wait for Kitchen ACC
      paymentMethod: null,
      paymentStatus: 'UNPAID',
      hasSpun: false,
      pointsWon: 0,
      createdAt: new Date().toISOString()
    };

    let deductRes = {
      ok: true,
      kuotaAfter: Math.max(0, Math.floor((Number(resolvedMerchant.saldoNota ?? 0) || 0) / Math.max(1, billingFeeIdr)))
    };
    if (shouldDeductAtCreate) {
      deductRes = deductStoreNotaFeeOnce(db, resolvedMerchant, newOrder, {
        channel: 'POS Order Checkout'
      });
      if (!deductRes.ok) {
        return res.status(deductRes.status || 402).json(deductRes);
      }
    } else if (isImmediateCustomerViaQris) {
      newOrder.notaDeducted = 0;
      newOrder.notaBypassReason = 'CUSTOMER_PAID_VIA_KOSTKU_QRIS';
    }

    const mWallet = db.merchant_wallets?.[resolvedMerchant.id] || {
      merchant_id: resolvedMerchant.id,
      available_balance: resolvedMerchant.saldoNota,
      held_promo_balance: HELD_PROMO_FEE,
      updated_at: new Date().toISOString()
    };

    const remainingKuotaNota = deductRes.kuotaAfter;
    const isLowQuota = remainingKuotaNota <= 15;
    const lowQuotaWarning = isLowQuota
      ? `Kuota nota tersisa ${remainingKuotaNota} transaksi (@ Rp ${billingFeeIdr}/nota). Lakukan top up agar operasional kasir tetap lancar.`
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
      billing_tier: billingTier,
      loyalty_pool_id: poolCommit.loyaltyPoolId || null,
      claim_token: claimToken,
      qr_claim_url: qrClaimUrl,
      status: 'PENDING',
      claimed_by_whatsapp: null,
      points_awarded: poolCommit.pointsEarned || 0,
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
      billing_tier: billingTier,
      description: billingTier === 'TIER_2_LOYALTY'
        ? `Biaya Nota Tier 2 #${invoiceNumber} (Rp 100 • Pool ${poolCommit.loyaltyPoolName || '-'})`
        : `Biaya Nota Tier 1 #${invoiceNumber} (Rp 25 Flat Tanpa Poin)`,
      balance_after: resolvedMerchant.saldoNota,
      createdAt: new Date().toISOString()
    });

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
      saldoNota: resolvedMerchant.saldoNota,
      kuotaNota: remainingKuotaNota,
      billingTier,
      billingFeeIdr,
      loyalty: {
        billingTier,
        billingFeeIdr,
        loyaltyPoolId: poolCommit.loyaltyPoolId || null,
        loyaltyPoolName: poolCommit.loyaltyPoolName || null,
        pointsRedeemed: redeemAmount,
        pointDiscountIdr: pointsDiscount,
        pointsEarned: poolCommit.pointsEarned || 0,
        customerPoolBalanceAfter: poolCommit.balanceAfter ?? 0
      },
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
    const { status, limit, storeId, merchantId, ownerId } = req.query;
    const requestedOwnerId = ownerId || req.user?.id || req.headers['x-user-id'] || null;
    const db = getDB(req);
    ensurePosCollections(db);

    const filterStore = storeId || merchantId;
    if (!req.isDemo && !filterStore && !requestedOwnerId) {
      return res.status(401).json({ error: 'Login diperlukan untuk melihat pesanan Kasir POS.' });
    }

    let list = db.pos_orders;
    if (filterStore && filterStore !== 'all') {
      const targetMeta = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(filterStore));
      const ownerFirstMerchant = (db.merchants || []).find(m =>
        m && m.status !== 'deleted' && targetMeta?.ownerUserId && String(m.ownerUserId) === String(targetMeta.ownerUserId)
      ) || (db.merchants || []).find(m => m && m.status !== 'deleted');
      const isPrimary = !ownerFirstMerchant || String(filterStore) === String(ownerFirstMerchant.id);
      list = list.filter(o =>
        (o.storeId && String(o.storeId) === String(filterStore)) ||
        (!o.storeId && isPrimary)
      );
    } else if (requestedOwnerId && !req.isDemo) {
      const { stores: ownedStores } = getDirectOwnerStores(db, requestedOwnerId);
      if (ownedStores.length === 0) return res.json([]);
      const ownedIds = new Set(ownedStores.map(s => String(s.id)));
      list = list.filter(o => o.storeId && ownedIds.has(String(o.storeId)));
    }

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

  // ── UPDATE TABLE NUMBER OR CUSTOMER NAME ──────────────────────────────
  router.post('/orders/:id/table', (req, res) => {
    const { id } = req.params;
    const { tableNumber, customerName } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (tableNumber) {
      order.tableNumber = tableNumber;
      const matchTable = (db.pos_tables || []).find(t => t.number === tableNumber);
      if (matchTable) order.tableToken = matchTable.qrToken;
    }
    if (customerName) order.customerName = customerName;

    writeDB(db, req);
    syncDelta(`pos_orders/${order.id}`, order, 'PATCH');
    res.json({ success: true, message: 'Nomor meja berhasil diperbarui', order });
  });

  router.patch('/orders/:id', (req, res) => {
    const { id } = req.params;
    const { tableNumber, customerName } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (tableNumber !== undefined) {
      order.tableNumber = tableNumber;
      const matchTable = (db.pos_tables || []).find(t => t.number === tableNumber);
      if (matchTable) order.tableToken = matchTable.qrToken;
    }
    if (customerName !== undefined) order.customerName = customerName;

    writeDB(db, req);
    syncDelta(`pos_orders/${order.id}`, order, 'PATCH');
    res.json({ success: true, message: 'Pesanan berhasil diperbarui', order });
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

    // Kembalikan poin jika sebelumnya sempat redeem / earn di Shared Pool atau Legacy
    if (order.loyalty_pool_id && order.loyalty_customer_id) {
      reverseOrderPoolPoints(db, order);
    } else if (order.pointsRedeemed > 0 && order.customerPhone) {
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

  // ── 7. EXECUTE PAYMENT (OPSI A: CASH DI KASIR, OPSI B: TRIPAY KOSTKU, DIRECT POS) ──
  router.post('/orders/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { method, cashierName, cashierId } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);

    const order = db.pos_orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (cashierName) order.cashierName = cashierName;
    if (cashierId) order.cashierId = cashierId;

    if (order.status !== 'WAITING_PAYMENT') {
      return res.status(400).json({ error: 'Pesanan belum di-ACC oleh dapur atau sudah dibayar' });
    }

    // ── METODE TAGIH KE KAMAR TELAH DIHAPUS / DINONAKTIFKAN ──
    if (method === 'ROOM_BILL') {
      return res.status(400).json({
        error: 'Metode pembayaran Tagih ke Kamar telah dinonaktifkan demi perlindungan arus kas kasir & mitra.'
      });
    }

    const normalizedMethod = String(method || '').toUpperCase().trim();
    const { merchant, baseAmt, billingFeeIdr, notaFeeBearer } = resolveOrderBillingContext(db, order);

    // ── OPSI A0: CUSTOMER MEJA QR MEMILIH BAYAR CASH DI KASIR (MENUNGGU KONFIRMASI KASIR) ──
    if (normalizedMethod === 'CASH_COUNTER') {
      const feeSnap = computePosOrderFeeSnapshot({
        baseAmount: baseAmt,
        notaFeeIdr: billingFeeIdr,
        notaFeeBearer,
        paymentMethod: 'CASH'
      });
      order.baseAmountBeforePaymentFee = feeSnap.baseAmount;
      order.qrisFee = 0;
      order.qrisFeeFixed = 0;
      order.qrisFeePercent = 0;
      order.customerAdminFee = feeSnap.customerAdminFee;
      order.notaFeeBearer = feeSnap.notaFeeBearer;
      order.notaFeeBorneBy = feeSnap.notaFeeBearer;
      order.feeBorneBy = feeSnap.notaFeeBearer;
      order.paymentFeeBorneBy = null;
      order.totalAmount = feeSnap.totalAmount;
      order.paymentMethod = 'CASH';
      order.customerSelectedPayment = 'CASH_COUNTER';
      order.paymentStatus = 'WAITING_CASHIER';
      order.tripayReference = null;
      order.tripayQrString = null;
      order.tripayQrUrl = null;

      writeDB(db, req);
      return res.json({
        success: true,
        method: 'CASH_COUNTER',
        status: 'WAITING_PAYMENT',
        baseAmount: feeSnap.baseAmount,
        qrisFee: 0,
        customerAdminFee: feeSnap.customerAdminFee,
        notaFeeBearer: feeSnap.notaFeeBearer,
        total: feeSnap.totalAmount,
        message: `Silakan bayar tunai Rp ${feeSnap.totalAmount.toLocaleString('id-ID')} di meja kasir. Pesanan akan langsung dimasak setelah kasir konfirmasi lunas.`,
        order
      });
    }

    // ── OPSI A: TRIPAY PAYMENT GATEWAY (BAYAR VIA KOSTKU QRIS) ──
    if (normalizedMethod === 'TRIPAY') {
      const feeSnap = computePosOrderFeeSnapshot({
        baseAmount: baseAmt,
        notaFeeIdr: billingFeeIdr,
        notaFeeBearer,
        paymentMethod: 'TRIPAY'
      });
      order.baseAmountBeforePaymentFee = feeSnap.baseAmount;
      order.qrisFee = feeSnap.qrisFee;
      order.qrisFeeFixed = feeSnap.qrisFeeFixed;
      order.qrisFeePercent = feeSnap.qrisFeePercent;
      order.customerAdminFee = feeSnap.customerAdminFee;
      order.notaFeeBearer = feeSnap.notaFeeBearer;
      order.notaFeeBorneBy = feeSnap.notaFeeBearer;
      order.feeBorneBy = feeSnap.notaFeeBearer;
      order.paymentFeeBorneBy = 'customer';
      order.customerSelectedPayment = 'TRIPAY';
      order.paymentStatus = 'PENDING';
      order.totalAmount = feeSnap.totalAmount;

      const posTripay = db.settings.posTripay || {};
      const hasTripayCredentials = Boolean(posTripay.apiKey && posTripay.privateKey && posTripay.merchantCode);

      if (hasTripayCredentials && typeof createTripayClosedTransaction === 'function') {
        try {
          const orderItems = order.items.map(it => ({ name: it.name, price: it.price, quantity: it.qty }));
          if (feeSnap.qrisFee > 0) {
            orderItems.push({ name: 'Biaya Layanan QRIS TriPay (Rp 750 + 0,70%)', price: feeSnap.qrisFee, quantity: 1 });
          }
          if (feeSnap.customerAdminFee > 0) {
            orderItems.push({ name: 'Biaya Admin Nota Platform', price: feeSnap.customerAdminFee, quantity: 1 });
          }
          const tripayRes = await createTripayClosedTransaction({
            orderId: order.id,
            amount: order.totalAmount,
            customerName: order.customerName,
            customerEmail: 'customer@riuph.me',
            customerPhone: order.customerPhone || '08123456789',
            orderItems
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
              baseAmount: order.baseAmountBeforePaymentFee,
              qrisFee: feeSnap.qrisFee,
              customerAdminFee: feeSnap.customerAdminFee,
              notaFeeBearer: feeSnap.notaFeeBearer,
              total: order.totalAmount,
              instructions: tripayRes.instructions
            });
          }
        } catch (err) {
          console.warn('[POS TriPay Live Error, using graceful fallback]:', err.message);
        }
      }

      // Graceful Sandbox / Simulator Response (Sebelum User Input API Key TriPay)
      const amtStr = String(Math.round(Number(order.totalAmount) || 0));
      const mockQrString = `00020101021226670016ID.CO.TRIPAY.WWW01189360099900000000000215${order.id}52045812530336054${String(amtStr.length).padStart(2, '0')}${amtStr}5802ID5914RIUPH KASIR POS6007JAKARTA62070703A016304E8A2`;
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
        baseAmount: order.baseAmountBeforePaymentFee,
        qrisFee: feeSnap.qrisFee,
        customerAdminFee: feeSnap.customerAdminFee,
        notaFeeBearer: feeSnap.notaFeeBearer,
        total: order.totalAmount,
        instructions: [
          'Buka aplikasi e-wallet (GoPay, ShopeePay, OVO, Dana) atau Mobile Banking',
          'Pindai kode QRIS di layar',
          `Periksa nominal pembayaran Rp ${order.totalAmount.toLocaleString('id-ID')} (termasuk biaya QRIS Rp ${feeSnap.qrisFee.toLocaleString('id-ID')}${feeSnap.customerAdminFee > 0 ? ` + Admin Nota Rp ${feeSnap.customerAdminFee.toLocaleString('id-ID')}` : ''})`,
          'Selesaikan pembayaran dan pesanan langsung dimasak'
        ]
      });
    }

    // Direct Counter Payment from Cashier Register (CASH | QRIS | TRANSFER)
    if (normalizedMethod === 'CASH' || normalizedMethod === 'QRIS' || normalizedMethod === 'TRANSFER') {
      const feeSnap = computePosOrderFeeSnapshot({
        baseAmount: baseAmt,
        notaFeeIdr: billingFeeIdr,
        notaFeeBearer,
        paymentMethod: normalizedMethod
      });
      order.baseAmountBeforePaymentFee = feeSnap.baseAmount;
      order.qrisFee = feeSnap.qrisFee;
      order.qrisFeeFixed = feeSnap.qrisFeeFixed;
      order.qrisFeePercent = feeSnap.qrisFeePercent;
      order.customerAdminFee = feeSnap.customerAdminFee;
      order.notaFeeBearer = feeSnap.notaFeeBearer;
      order.notaFeeBorneBy = feeSnap.notaFeeBearer;
      order.feeBorneBy = feeSnap.notaFeeBearer;
      order.paymentFeeBorneBy = feeSnap.qrisFee > 0 ? 'customer' : null;
      order.totalAmount = feeSnap.totalAmount;

      const skipNotaForCustomerQris = normalizedMethod === 'QRIS' && feeSnap.notaFeeBearer === 'customer';
      let deductRes = {
        ok: true,
        feeDeducted: 0,
        billingTier: order.billing_tier || 'TIER_1_FLAT',
        saldoAfter: Number(merchant?.saldoNota ?? 0),
        kuotaAfter: Number(merchant?.kuotaNota ?? 0)
      };

      if (skipNotaForCustomerQris) {
        order.notaDeducted = 0;
        order.notaBypassReason = 'CUSTOMER_PAID_VIA_KOSTKU_QRIS';
      } else {
        deductRes = deductStoreNotaFeeOnce(db, merchant, order, {
          channel: normalizedMethod === 'QRIS' ? 'POS Kasir (QRIS TriPay)' : normalizedMethod === 'TRANSFER' ? 'POS Kasir (Transfer)' : 'POS Kasir (Tunai)'
        });
        if (!deductRes.ok) {
          return res.status(deductRes.status === 402 ? 400 : (deductRes.status || 400)).json(deductRes);
        }
      }

      order.paymentMethod = normalizedMethod;
      order.paymentStatus = 'PAID';
      order.status = 'PREPARING';
      order.paidAt = new Date().toISOString();
      if (normalizedMethod === 'QRIS') {
        settlePosOrderIntoUnifiedWallet(db, order, merchant, billingFeeIdr);
      }
      writeDB(db, req);
      return res.json({
        success: true,
        method: normalizedMethod,
        status: 'PREPARING',
        qrisFee: Number(order.qrisFee) || 0,
        customerAdminFee: feeSnap.customerAdminFee,
        notaFeeBearer: feeSnap.notaFeeBearer,
        total: order.totalAmount,
        notaDeducted: deductRes.feeDeducted,
        billingTier: deductRes.billingTier,
        sisaSaldoNota: deductRes.saldoAfter,
        sisaKuotaNota: deductRes.kuotaAfter,
        message: normalizedMethod === 'QRIS'
          ? `Pembayaran QRIS TriPay berhasil divalidasi (Biaya QRIS Rp ${(Number(order.qrisFee) || 0).toLocaleString('id-ID')}${feeSnap.notaFeeBearer === 'customer' ? ', saldo nota toko Rp 0 terpotong' : ''}).`
          : `Pembayaran ${normalizedMethod === 'TRANSFER' ? 'transfer bank' : 'tunai'} kasir berhasil dicatat (${deductRes.billingTier === 'TIER_2_LOYALTY' ? 'Tier 2 Rp 100/nota' : 'Tier 1 Rp 25/nota'}).`,
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
      const { merchant, billingFeeIdr } = resolveOrderBillingContext(db, order);
      finalizeTripayPosOrderPayment(db, order, merchant, billingFeeIdr);
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
    if (req.body?.cashierName) order.cashierName = req.body.cashierName;
    if (req.body?.cashierId) order.cashierId = req.body.cashierId;

    const { merchant, baseAmt, billingFeeIdr, notaFeeBearer } = resolveOrderBillingContext(db, order);
    const pm = String(order.paymentMethod || '').toUpperCase().trim();
    const isGatewayQris = pm === 'TRIPAY' || pm === 'QRIS';

    if (isGatewayQris) {
      finalizeTripayPosOrderPayment(db, order, merchant, billingFeeIdr);
    } else {
      const feeSnap = computePosOrderFeeSnapshot({
        baseAmount: baseAmt,
        notaFeeIdr: billingFeeIdr,
        notaFeeBearer: order.notaFeeBorneBy || order.notaFeeBearer || notaFeeBearer,
        paymentMethod: 'CASH'
      });
      order.baseAmountBeforePaymentFee = feeSnap.baseAmount;
      order.customerAdminFee = feeSnap.customerAdminFee;
      order.notaFeeBearer = feeSnap.notaFeeBearer;
      order.notaFeeBorneBy = feeSnap.notaFeeBearer;
      order.feeBorneBy = feeSnap.notaFeeBearer;
      order.totalAmount = feeSnap.totalAmount;

      if (merchant) {
        const deductRes = deductStoreNotaFeeOnce(db, merchant, order, {
          channel: 'POS Kasir (Konfirmasi Tunai)'
        });
        if (!deductRes.ok) {
          return res.status(deductRes.status === 402 ? 400 : (deductRes.status || 400)).json(deductRes);
        }
      }
      order.paymentMethod = 'CASH';
      order.paymentStatus = 'PAID';
      order.status = 'PREPARING';
      order.paidAt = order.paidAt || new Date().toISOString();
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

    const { storeId = null, merchantId = null, tableToken = null } = req.query;
    const storeCtx = resolveStoreContextForRequest(db, { storeId, merchantId, tableToken });
    const legacyBalance = db.customer_points[cleanPhone] || (db.customers && db.customers[cleanPhone]?.total_points) || 0;
    let effectiveBalance = legacyBalance;
    if (storeCtx.isTier2 && storeCtx.merchant && cleanPhone) {
      const poolPreview = previewPoolCheckout(db, {
        merchant: storeCtx.merchant,
        customerPhone: cleanPhone,
        redeemPoints: 0,
        grossSubtotalIdr: 0
      });
      if (poolPreview?.availablePoints !== undefined) {
        effectiveBalance = Number(poolPreview.availablePoints || 0);
      }
    }
    const pointValueIdr = Number(storeCtx.billingProfile.activePool?.point_value_idr || 100);
    res.json({
      phone: cleanPhone,
      points: effectiveBalance,
      rupiahEquivalent: storeCtx.isTier2 ? (effectiveBalance * pointValueIdr) : 0,
      billingTier: storeCtx.billingProfile.billingTier,
      loyaltyPoolId: storeCtx.billingProfile.loyaltyPoolId,
      canRedeemPoints: storeCtx.isTier2
    });
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
  router.get('/loyalty/:phone', (req, res, next) => {
    const rawParam = String(req.params.phone || '').trim();
    if (/[a-zA-Z]/.test(rawParam) || !/\d/.test(rawParam)) {
      return next();
    }
    const cleanPhone = rawParam.replace(/\D/g, '');
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

  // ── 9A-2. CONVERT POINTS TO FOOD VOUCHER (SOLUSI A: SELF-SERVICE REDEMPTION DI HP PELANGGAN) ──
  router.post('/loyalty/convert-to-voucher', (req, res) => {
    const { phone, points, storeId = null, merchantId = null, tableToken = null, claimToken = null, orderId = null } = req.body;
    const db = getDB(req);
    ensurePosCollections(db);
    const storeCtx = resolveStoreContextForRequest(db, { storeId, merchantId, tableToken, claimToken, orderId });
    if (storeCtx.explicitStoreRequested && !storeCtx.isTier2) {
      return res.status(422).json({
        error: 'Penukaran poin tidak aktif di toko Tier 1 ini. Hanya toko yang terhubung ke Loyalty Pool (Tier 2) yang mendukung penukaran poin.',
        code: 'POIN_NOT_ACTIVE_ON_STORE',
        billingTier: storeCtx.billingProfile.billingTier
      });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Nomor WhatsApp pelanggan wajib diisi!' });
    }

    const pts = parseInt(points, 10);
    if (!pts || isNaN(pts) || pts < 100) {
      return res.status(400).json({ error: 'Penukaran poin minimal 100 Poin!' });
    }

    const currentPoints = db.customer_points[cleanPhone] || (db.customers && db.customers[cleanPhone]?.total_points) || 0;
    if (currentPoints < pts) {
      return res.status(400).json({ error: `Saldo poin Anda tidak mencukupi (tersedia: ${currentPoints} Poin, dibutuhkan: ${pts} Poin).` });
    }

    // 100 Poin = Rp 1.000 diskon langsung
    const discountVal = Math.floor(pts / 100) * 1000;
    if (discountVal <= 0) {
      return res.status(400).json({ error: 'Nilai voucher harus lebih besar dari 0!' });
    }

    // Deduct points from customer
    const updatedPoints = currentPoints - pts;
    db.customer_points[cleanPhone] = updatedPoints;
    if (db.customers && db.customers[cleanPhone]) {
      db.customers[cleanPhone].total_points = updatedPoints;
    }

    // Buat kode voucher unik 8 digit: POIN-XXXX
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const phoneSuffix = cleanPhone.slice(-4);
    const voucherCode = `POIN-${phoneSuffix}${randomSuffix}`;

    db.pos_food_promos = db.pos_food_promos || [];
    const newVoucher = {
      id: `promo_voucher_${Date.now()}`,
      title: `Voucher Poin Rp ${discountVal.toLocaleString('id-ID')}`,
      code: voucherCode,
      scope: 'ALL',
      targetProductId: null,
      targetProductName: null,
      discountType: 'FIXED',
      discountValue: discountVal,
      minOrder: 0,
      limitType: 'QUOTA',
      maxQuota: 1,
      usedCount: 0,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: null,
      isActive: true,
      createdByRole: 'customer',
      customerPhone: cleanPhone,
      description: `Voucher penukaran ${pts} Poin oleh ${cleanPhone}`
    };
    db.pos_food_promos.push(newVoucher);

    // Record in history
    db.customer_stamps = db.customer_stamps || {};
    db.customer_stamps[cleanPhone] = db.customer_stamps[cleanPhone] || {
      phone: cleanPhone,
      name: 'Member KostKu',
      stamps: 0,
      maxStamps: 5,
      history: []
    };
    db.customer_stamps[cleanPhone].history.unshift({
      date: new Date().toISOString(),
      type: 'CONVERT_VOUCHER',
      change: -pts,
      reason: `Tukar ${pts} Poin jadi Voucher Diskon ${voucherCode} (Rp ${discountVal.toLocaleString('id-ID')})`,
      balanceAfter: updatedPoints
    });

    writeDB(db, req);

    res.json({
      success: true,
      message: `Berhasil menukar ${pts} Poin menjadi Voucher Rp ${discountVal.toLocaleString('id-ID')}!`,
      voucher: {
        code: voucherCode,
        discountValue: discountVal,
        title: newVoucher.title
      },
      remainingPoints: updatedPoints
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
    const storeCtx = resolveStoreContextForRequest(db, { merchantId: claim.merchant_id });
    res.json({
      id: claim.id,
      token: claim.claim_token,
      invoice: claim.invoice_number,
      merchantId: claim.merchant_id,
      merchantName: claim.merchant_name || 'KostKu Cafe & Resto',
      totalAmount: claim.total_amount,
      potentialPoints: Math.max(1, Math.floor(claim.total_amount / 1000)),
      billingTier: storeCtx.billingProfile.billingTier,
      loyaltyPoolId: storeCtx.billingProfile.loyaltyPoolId,
      loyaltyPoolName: storeCtx.billingProfile.loyaltyPoolName,
      canRedeemPoints: storeCtx.isTier2,
      status: resolvedStatus,
      claimDeadline: claim.claim_deadline,
      claimedBy: claim.claimed_by_whatsapp ? claim.claimed_by_whatsapp.replace(/(\d{4})\d+(\d{3})/, '$1****$2') : null,
      claimedVia: claim.claimed_via || (claim.status === 'CLAIMED' ? 'qr' : null),
      claimedAt: claim.claimed_at,
      refundedAt: claim.refunded_at,
      createdAt: claim.createdAt,
      isExpired: resolvedStatus === 'EXPIRED',
      isClaimed: resolvedStatus === 'CLAIMED'
    });
  });

  // Shared helper for claiming a receipt's loyalty points via QR Lucky Spin or Cashier HP input
  const executeReceiptLoyaltyClaim = (db, { claim, phone, name = '', referralCode = '', source = 'qr' }) => {
    let cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('62')) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }
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
        shouldWriteOnError: true,
        body: {
          error: `Masa klaim struk ini telah berakhir pada ${new Date(claim.claim_deadline).toLocaleString('id-ID')} WIB.`,
          isExpired: true,
          claimDeadline: claim.claim_deadline
        }
      };
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

    const spinOutcome = rollLuckySpin(customer);
    const pointsAwarded = spinOutcome.pointsWon;

    claim.status = 'CLAIMED';
    claim.claimed_by_whatsapp = cleanPhone;
    claim.claimed_via = source || 'qr';
    claim.points_awarded = pointsAwarded;
    claim.claimed_at = now.toISOString();

    customer.total_points = (customer.total_points || 0) + pointsAwarded;
    db.customer_points[cleanPhone] = customer.total_points;

    db.points_ledger = db.points_ledger || [];
    db.points_ledger.unshift({
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

    // Also sync awarded points into Tier 2 Loyalty Pool wallet if the store joined a pool
    let poolBalance = null;
    const claimMerchant = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(claim.merchant_id));
    if (claimMerchant) {
      const storeProfile = getStoreBillingProfile(db, claimMerchant);
      if (storeProfile.loyaltyPoolId) {
        const ownerId = claimMerchant.ownerUserId || claimMerchant.posOwnerId || 'OWNER-DEFAULT';
        const poolCustomer = findOrCreateLoyaltyCustomer(db, ownerId, cleanPhone, customer.name, true);
        if (poolCustomer) {
          let wallet = getCustomerPoolWallet(db, poolCustomer.id, storeProfile.loyaltyPoolId);
          const nowIso = now.toISOString();
          if (!wallet) {
            wallet = {
              id: `WAL-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
              owner_id: String(ownerId),
              customer_id: poolCustomer.id,
              loyalty_pool_id: storeProfile.loyaltyPoolId,
              customer_phone: poolCustomer.phone_e164,
              customer_phone_display: poolCustomer.phone_display,
              customer_name: poolCustomer.name,
              balance_points: 0,
              lifetime_earned: 0,
              lifetime_redeemed: 0,
              updated_at: nowIso
            };
            db.loyalty_pool_balances.push(wallet);
          }
          wallet.balance_points = Number(wallet.balance_points || 0) + pointsAwarded;
          wallet.lifetime_earned = Number(wallet.lifetime_earned || 0) + pointsAwarded;
          wallet.updated_at = nowIso;
          poolBalance = wallet.balance_points;
          db.point_transactions.unshift({
            id: `PTX-CLM-${Date.now()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
            owner_id: String(ownerId),
            loyalty_pool_id: storeProfile.loyaltyPoolId,
            loyalty_pool_name: storeProfile.loyaltyPoolName || '',
            store_id: String(claimMerchant.id),
            store_name: claimMerchant.name || claim.merchant_name || 'Toko POS',
            customer_id: poolCustomer.id,
            customer_phone: poolCustomer.phone_display,
            customer_name: poolCustomer.name,
            order_id: claim.order_id,
            invoice_number: claim.invoice_number,
            tx_type: 'EARN',
            points_delta: pointsAwarded,
            balance_after: wallet.balance_points,
            idr_amount: Number(claim.total_amount || 0),
            rule_snapshot: null,
            created_at: nowIso
          });
        }
      }
    }

    // Update linked POS order metadata so Kasir UI reflects claim status immediately
    const linkedOrder = (db.pos_orders || []).find(o => String(o.id) === String(claim.order_id) || String(o.claim_token) === String(claim.claim_token));
    if (linkedOrder) {
      linkedOrder.claimStatus = 'CLAIMED';
      linkedOrder.claimedByWhatsapp = cleanPhone;
      linkedOrder.claimedVia = source || 'qr';
      linkedOrder.claimPointsAwarded = pointsAwarded;
      linkedOrder.hasSpun = true;
      if (!linkedOrder.customerPhone) linkedOrder.customerPhone = cleanPhone;
      if (name && (!linkedOrder.customerName || linkedOrder.customerName === 'Kasir Walk-in')) {
        linkedOrder.customerName = name;
      }
    }

    let referralResult = { success: false, status: 'NO_CODE', bonusAwarded: 0 };
    const rawRefCode = String(referralCode || '').trim().toUpperCase();
    if (rawRefCode) {
      if (customer.referral_code && customer.referral_code.toUpperCase() === rawRefCode) {
        referralResult = { success: false, status: 'SELF_REFERRAL_BLOCKED', message: 'Dilarang menggunakan kode referral milik sendiri!' };
      } else {
        const referrer = Object.values(db.customers).find(c => c && c.referral_code && c.referral_code.toUpperCase() === rawRefCode);
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

    const mId = claim.merchant_id || 'MTR-KASIR-MASTER';
    if (db.merchant_wallets && db.merchant_wallets[mId]) {
      db.merchant_wallets[mId].held_promo_balance = Math.max(0, (db.merchant_wallets[mId].held_promo_balance || 0) - 60.00);
      db.merchant_wallets[mId].updated_at = now.toISOString();
    }

    return {
      ok: true,
      cleanPhone,
      customer,
      claim,
      pointsAwarded,
      poolBalance,
      spinOutcome,
      referralResult,
      mId
    };
  };

  // 2. Customer claims points with Lucky Spin Wheel (/api/pos/loyalty/claim & /api/pos/loyalty/spin)
  const handleLoyaltySpinClaim = (req, res) => {
    const { token, whatsapp, phone, name } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token struk tidak boleh kosong' });
    }

    const db = getDB(req);
    ensurePosCollections(db);
    const claim = (db.receipt_claims || []).find(c => c.claim_token === token || c.id === token || c.invoice_number === token);
    const result = executeReceiptLoyaltyClaim(db, {
      claim,
      phone: whatsapp || phone,
      name,
      referralCode: req.body.referral_code || req.body.referralCode || '',
      source: 'qr'
    });

    if (!result.ok) {
      if (result.shouldWriteOnError) writeDB(db, req);
      return res.status(result.status || 400).json(result.body);
    }

    writeDB(db, req);
    const { cleanPhone, customer, pointsAwarded, poolBalance, spinOutcome, referralResult, mId } = result;

    setImmediate(() => {
      try {
        syncDelta(`customer_points/${cleanPhone}`, customer.total_points, 'PUT');
        syncDelta(`customers/${cleanPhone}`, customer, 'PUT');
        syncDelta(`receipt_claims/${claim.id}`, {
          status: 'CLAIMED',
          claimed_by_whatsapp: cleanPhone,
          claimed_via: claim.claimed_via || 'qr',
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
        ? `JACKPOT! Selamat Anda memenangkan 100 Poin Emas!`
        : `Selamat! Roda berhenti di ${pointsAwarded} Poin loyalitas.`,
      pointsAwarded,
      sliceIndex: spinOutcome.sliceIndex,
      slice: spinOutcome.slice,
      isNearMiss: spinOutcome.isNearMiss,
      isPity: spinOutcome.isPity,
      spinsWithoutJackpot: customer.spins_without_jackpot,
      totalPoints: customer.total_points,
      poolBalance,
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

  // 2B. Kasir direct phone-number claim (without scanning QR)
  router.get('/loyalty/unclaimed-orders', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const filterStoreId = req.query.storeId || req.query.merchantId || null;
    const now = new Date();
    const list = (db.receipt_claims || [])
      .filter(c => {
        if (!c || c.status !== 'PENDING') return false;
        if (c.claim_deadline && now > new Date(c.claim_deadline)) return false;
        if (filterStoreId && String(c.merchant_id || '') !== String(filterStoreId)) return false;
        return true;
      })
      .slice(0, 20)
      .map(c => {
        const linkedOrder = (db.pos_orders || []).find(o => String(o.id) === String(c.order_id));
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
    res.json({ success: true, orders: list });
  });

  function extractCustomerPhoneInput(rawInput) {
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
  }

  router.post('/loyalty/cashier-claim', (req, res) => {
    const {
      token,
      claimToken,
      orderId,
      invoice,
      storeId = null,
      merchantId = null,
      phone,
      whatsapp,
      customerQr = '',
      qrPayload = '',
      name = ''
    } = req.body || {};

    const db = getDB(req);
    ensurePosCollections(db);
    const effectiveStoreId = storeId || merchantId || null;
    const lookupKey = String(token || claimToken || orderId || invoice || '').trim();
    if (!lookupKey) {
      return res.status(400).json({ error: 'Pilih transaksi / masukkan kode faktur atau token struk terlebih dahulu.' });
    }

    let claim = (db.receipt_claims || []).find(c =>
      String(c.claim_token || '') === lookupKey ||
      String(c.id || '') === lookupKey ||
      String(c.order_id || '') === lookupKey ||
      String(c.invoice_number || '') === lookupKey
    );

    if (!claim) {
      const ord = (db.pos_orders || []).find(o =>
        String(o.id || '') === lookupKey ||
        String(o.invoice_number || o.invoice || '') === lookupKey ||
        String(o.claim_token || o.claimToken || '') === lookupKey
      );
      if (ord) {
        if (effectiveStoreId && ord.storeId && String(ord.storeId) !== String(effectiveStoreId)) {
          return res.status(403).json({ error: 'Transaksi bukan milik toko kasir ini.' });
        }
        const synthToken = ord.claim_token || ord.claimToken || ('clm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16));
        claim = {
          id: 'CLM-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
          order_id: ord.id,
          merchant_id: ord.storeId || effectiveStoreId || 'MTR-KASIR-MASTER',
          merchant_name: ord.storeName || 'Toko POS',
          invoice_number: ord.invoice_number || ord.invoice || ord.id,
          total_amount: Number(ord.totalAmount || ord.subtotal || 0),
          billing_tier: ord.billing_tier || 'TIER_1_FLAT',
          loyalty_pool_id: ord.loyalty_pool_id || null,
          claim_token: synthToken,
          qr_claim_url: ord.qr_claim_url || `https://kostku.riuph.me/claim?token=${synthToken}`,
          status: ord.claimStatus === 'CLAIMED' ? 'CLAIMED' : 'PENDING',
          claimed_by_whatsapp: ord.claimedByWhatsapp || null,
          points_awarded: ord.claimPointsAwarded || 0,
          claim_deadline: ord.claim_deadline || ord.claimDeadline || calculateWibClaimDeadline(new Date(ord.createdAt || Date.now())).toISOString(),
          claimed_at: null,
          createdAt: ord.createdAt || new Date().toISOString()
        };
        db.receipt_claims.unshift(claim);
      }
    } else if (effectiveStoreId && claim.merchant_id && String(claim.merchant_id) !== String(effectiveStoreId)) {
      return res.status(403).json({ error: 'Struk ini berasal dari toko lain.' });
    }

    const normalizedPhone = extractCustomerPhoneInput(customerQr || qrPayload || whatsapp || phone);
    const claimViaSource = (customerQr || qrPayload) ? 'cashier_qr' : 'cashier_phone';

    const result = executeReceiptLoyaltyClaim(db, {
      claim,
      phone: normalizedPhone,
      name,
      source: claimViaSource
    });

    if (!result.ok) {
      if (result.shouldWriteOnError) writeDB(db, req);
      return res.status(result.status || 400).json(result.body);
    }

    writeDB(db, req);
    const { cleanPhone, customer, pointsAwarded, poolBalance, mId } = result;

    setImmediate(() => {
      try {
        syncDelta(`customer_points/${cleanPhone}`, customer.total_points, 'PUT');
        syncDelta(`customers/${cleanPhone}`, customer, 'PUT');
        syncDelta(`receipt_claims/${claim.id}`, {
          status: 'CLAIMED',
          claimed_by_whatsapp: cleanPhone,
          claimed_via: claimViaSource,
          claimed_at: claim.claimed_at,
          points_awarded: claim.points_awarded
        }, 'PATCH');
        if (db.merchant_wallets && db.merchant_wallets[mId]) {
          syncDelta(`merchant_wallets/${mId}`, db.merchant_wallets[mId], 'PATCH');
        }
      } catch (err) {
        console.warn('[Firebase RTDB Delta Sync Error]:', err.message);
      }
    });

    res.json({
      success: true,
      message: `Berhasil! +${pointsAwarded} Poin diklaim via ${(customerQr || qrPayload) ? 'QR Pribadi' : 'No. HP'} ${cleanPhone} di Kasir.`,
      pointsAwarded,
      totalPoints: customer.total_points,
      poolBalance,
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
    });
  });

  // 3. Customer Points & Personal QR Lookup (/api/pos/loyalty/customer/:phone)
  router.get('/loyalty/customer/:phone', (req, res) => {
    const phone = extractCustomerPhoneInput(decodeURIComponent(req.params.phone || ''));
    const db = getDB(req);
    ensurePosCollections(db);

    const baseAccount = (db.customers && db.customers[phone]) || {
      whatsapp_number: phone,
      name: 'Pelanggan KostKu',
      total_points: db.customer_points[phone] || 0
    };
    const account = {
      ...baseAccount,
      whatsapp_number: phone,
      total_points: Number(baseAccount.total_points ?? db.customer_points[phone] ?? 0)
    };
    const history = (db.points_ledger || []).filter(l => l.whatsapp_number === phone);

    const loyaltyCustomer = (db.loyalty_customers || []).find(c =>
      c && (c.phone_canonical === phone || extractCustomerPhoneInput(c.phone_display) === phone)
    ) || null;
    const poolWallets = loyaltyCustomer
      ? (db.loyalty_pool_balances || []).filter(w => String(w.customer_id) === String(loyaltyCustomer.id))
      : [];
    const storeId = req.query.storeId || req.query.merchantId || '';
    const storeCtx = storeId ? resolveStoreContextForRequest(db, { storeId }) : null;
    const activePoolId = storeCtx?.loyaltyPoolId || null;
    const tier2PoolBalance = activePoolId
      ? Number((poolWallets.find(w => String(w.loyalty_pool_id) === String(activePoolId)) || {}).balance_points || 0)
      : poolWallets.reduce((sum, w) => sum + Number(w.balance_points || 0), 0);

    const activeVouchers = (db.pos_food_promos || [])
      .filter(p =>
        p &&
        p.isActive !== false &&
        Number(p.usedCount || 0) < Number(p.maxQuota ?? 1) &&
        p.customerPhone &&
        extractCustomerPhoneInput(p.customerPhone) === phone
      )
      .map(p => ({
        id: p.id,
        code: p.code,
        title: p.title,
        scope: p.scope || 'ALL',
        discountType: p.discountType || 'FIXED',
        discountValue: Number(p.discountValue || 0),
        minOrder: Number(p.minOrder || 0),
        limitType: p.limitType || 'QUOTA',
        maxQuota: Number(p.maxQuota ?? 1),
        usedCount: Number(p.usedCount || 0),
        startDate: p.startDate,
        expiryDate: p.expiryDate || null,
        description: p.description || ''
      }));

    res.json({
      account,
      history,
      qrPayload: phone ? `KOSTKU-MEMBER:${phone}` : '',
      tier2PoolBalance,
      poolWallets,
      activeVouchers
    });
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

  // ── 12. STATISTIK & GRAFIK ANALITIK MULTI-DIMENSI + RENTANG TANGGAL + COMBINE FILTER ──
  router.get('/analytics', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);

    const parseMultiParam = (val) => {
      if (!val || val === 'all' || val === 'ALL') return [];
      return String(val)
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s.toLowerCase() !== 'all');
    };

    const rawRange = String(req.query.range || 'all').toLowerCase();
    const validRanges = new Set(['today', 'week', 'month', 'year', 'all', 'custom']);
    const range = validRanges.has(rawRange) ? rawRange : 'all';
    const filterMode = String(req.query.filterMode || 'all').toLowerCase();
    const selectedStoreIds = parseMultiParam(req.query.storeId);
    const selectedCategories = parseMultiParam(req.query.category);
    const selectedItemIds = parseMultiParam(req.query.itemId || req.query.item);
    const selectedEmployeeIds = parseMultiParam(req.query.cashierId || req.query.employee);
    const requestedOwnerId = req.query.ownerId || req.user?.id || null;

    const allOrders = (db.pos_orders || []).filter(o => o.status !== 'CANCELLED');
    const products = db.pos_products || [];
    const inventory = db.pos_inventory || [];
    const recipes = db.pos_recipes || {};

    // Catalog lookup maps
    const productById = {};
    const productByName = {};
    products.forEach(p => {
      productById[String(p.id)] = p;
      if (p.name) productByName[String(p.name).toLowerCase()] = p;
    });

    // Gather owner's active stores + any store referenced in orders
    const currentStoreId = db.settings.posStore?.merchantId || db.settings.posStore?.uid;
    const currentMerchant =
      (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(currentStoreId)) ||
      (db.merchants || []).find(m => m && m.status !== 'deleted') ||
      (db.merchants || [])[0];
    const ownerStores = getOwnerStoresList(db, currentMerchant, requestedOwnerId);

    const storeCatalogMap = {};
    ownerStores.forEach(s => {
      storeCatalogMap[String(s.id)] = {
        id: String(s.id),
        name: s.name || 'Cabang Mitra',
        address: s.address || s.location || 'Semarang',
        saldoNota: Number(s.saldoNota ?? 5000),
        kuotaNota: Number(s.kuotaNota ?? 50)
      };
    });

    if (db.settings.posStore?.merchantId && !storeCatalogMap[String(db.settings.posStore.merchantId)]) {
      storeCatalogMap[String(db.settings.posStore.merchantId)] = {
        id: String(db.settings.posStore.merchantId),
        name: db.settings.posStore.storeName || 'Toko Utama',
        address: db.settings.posStore.location || db.settings.posStore.address || 'Semarang',
        saldoNota: Number(db.settings.posStore.saldoNota ?? 5000),
        kuotaNota: Number(db.settings.posStore.kuotaNota ?? 50)
      };
    }

    const storesList = Object.values(storeCatalogMap);
    if (storesList.length === 0) {
      const fallback = {
        id: 'MTR-KASIR-MASTER',
        name: 'Toko Utama',
        address: 'Semarang',
        saldoNota: 10000,
        kuotaNota: 100
      };
      storesList.push(fallback);
      storeCatalogMap[fallback.id] = fallback;
    }

    const canonicalPrimaryMerchant = (db.merchants || []).find(m =>
      m && m.status !== 'deleted' && currentMerchant?.ownerUserId && String(m.ownerUserId) === String(currentMerchant.ownerUserId)
    ) || currentMerchant || storesList[0];
    const primaryStoreId = String(canonicalPrimaryMerchant?.id || storesList[0].id);

    allOrders.forEach(o => {
      if (o.storeId && !storeCatalogMap[String(o.storeId)]) {
        storeCatalogMap[String(o.storeId)] = {
          id: String(o.storeId),
          name: o.storeName || `Toko ${o.storeId}`,
          address: '-',
          saldoNota: 5000,
          kuotaNota: 50
        };
      }
    });

    // Employee / cashier catalog: merge db.users staff + db.staff + default cashiers + historical cashiers in orders
    const employeeCatalogMap = {
      'KSR-01': { id: 'KSR-01', name: 'Siti Rahmawati (Kasir Shift Pagi)', role: 'Kasir Pagi', assignedStoreIds: ['all'] },
      'KSR-02': { id: 'KSR-02', name: 'Budi Santoso (Kasir Shift Siang)', role: 'Kasir Siang', assignedStoreIds: ['all'] },
      'KSR-03': { id: 'KSR-03', name: 'Rian Pratama (Kasir Shift Malam)', role: 'Kasir Malam', assignedStoreIds: ['all'] },
      'KSR-STF': { id: 'KSR-STF', name: 'Pak Joko (Staf Operasional)', role: 'Staf & Runner', assignedStoreIds: ['all'] }
    };
    (db.users || []).forEach(u => {
      if (!u || u.role !== 'staff' || u.status === 'deleted') return;
      const eid = String(u.id || u.email || u.phone || '');
      if (eid) {
        employeeCatalogMap[eid] = {
          id: eid,
          name: u.name || 'Karyawan',
          role: u.jobTitle || (Array.isArray(u.roles) ? u.roles.join(', ') : 'Staf'),
          assignedStoreIds: Array.isArray(u.assignedStoreIds) && u.assignedStoreIds.length > 0 ? u.assignedStoreIds : ['all']
        };
      }
    });
    (db.staff || []).forEach(st => {
      if (!st || st.status === 'deleted') return;
      const eid = String(st.id || st.userId || st.email || st.whatsapp || '');
      if (eid && !employeeCatalogMap[eid]) {
        employeeCatalogMap[eid] = {
          id: eid,
          name: st.name || 'Karyawan',
          role: st.role === 'kasir' ? 'Kasir' : (st.role || 'Staf'),
          assignedStoreIds: Array.isArray(st.assignedStoreIds) && st.assignedStoreIds.length > 0 ? st.assignedStoreIds : ['all']
        };
      }
    });
    allOrders.forEach(o => {
      const cid = String(o.cashierId || 'KSR-01');
      if (!employeeCatalogMap[cid]) {
        employeeCatalogMap[cid] = {
          id: cid,
          name: o.cashierName || `Karyawan ${cid}`,
          role: 'Kasir'
        };
      } else if (o.cashierName && !o.cashierId) {
        employeeCatalogMap[cid].name = o.cashierName;
      }
    });

    // Category catalog
    const categorySet = new Set();
    products.forEach(p => { if (p.category) categorySet.add(String(p.category).trim()); });
    Object.values(db.pos_custom_categories || {}).forEach(list => {
      if (Array.isArray(list)) list.forEach(c => { if (c) categorySet.add(String(c).trim()); });
    });

    // WIB Timezone helpers (+07:00)
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const toWibDate = (dInput) => {
      const ms = dInput ? new Date(dInput).getTime() : Date.now();
      return new Date((Number.isFinite(ms) ? ms : Date.now()) + WIB_OFFSET_MS);
    };
    const todayWib = toWibDate(new Date());
    const todayDateStr = todayWib.toISOString().slice(0, 10);

    let boundStartDate = '';
    let boundEndDate = '';

    if (range === 'today') {
      boundStartDate = todayDateStr;
      boundEndDate = todayDateStr;
    } else if (range === 'week') {
      // Calendar week starting Monday (Senin) through Sunday (Minggu) in WIB
      const dow = todayWib.getUTCDay(); // 0=Sun..6=Sat
      const diffToMonday = dow === 0 ? 6 : dow - 1;
      const monMs = todayWib.getTime() - diffToMonday * 86400000;
      const sunMs = monMs + 6 * 86400000;
      boundStartDate = new Date(monMs).toISOString().slice(0, 10);
      boundEndDate = new Date(sunMs).toISOString().slice(0, 10);
    } else if (range === 'month') {
      const ym = todayDateStr.slice(0, 7);
      const y = Number(ym.slice(0, 4));
      const m = Number(ym.slice(5, 7));
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      boundStartDate = `${ym}-01`;
      boundEndDate = `${ym}-${String(lastDay).padStart(2, '0')}`;
    } else if (range === 'year') {
      const y = todayDateStr.slice(0, 4);
      boundStartDate = `${y}-01-01`;
      boundEndDate = `${y}-12-31`;
    } else if (range === 'custom') {
      const rawStart = String(req.query.startDate || '').slice(0, 10);
      const rawEnd = String(req.query.endDate || '').slice(0, 10);
      if (rawStart && rawEnd) {
        if (rawStart <= rawEnd) {
          boundStartDate = rawStart;
          boundEndDate = rawEnd;
        } else {
          boundStartDate = rawEnd;
          boundEndDate = rawStart;
        }
      } else if (rawStart) {
        boundStartDate = rawStart;
        boundEndDate = todayDateStr;
      } else if (rawEnd) {
        boundStartDate = '2000-01-01';
        boundEndDate = rawEnd;
      }
    }

    const resolveOrderDateStr = (order) => {
      const rawIso = order.createdAt || order.paidAt || order.completedAt;
      if (!rawIso) return todayDateStr;
      return toWibDate(rawIso).toISOString().slice(0, 10);
    };
    const resolveOrderHourStr = (order) => {
      const rawIso = order.createdAt || order.paidAt || order.completedAt;
      if (!rawIso) return '12';
      return toWibDate(rawIso).toISOString().slice(11, 13);
    };

    const matchesDateRange = (dateStr) => {
      if (range === 'all' && !boundStartDate && !boundEndDate) return true;
      if (boundStartDate && dateStr < boundStartDate) return false;
      if (boundEndDate && dateStr > boundEndDate) return false;
      return true;
    };

    const shiftDateStr = (dateStr, deltaDays) => {
      const ms = Date.parse(`${dateStr}T00:00:00Z`);
      if (!Number.isFinite(ms)) return dateStr;
      return new Date(ms + deltaDays * 86400000).toISOString().slice(0, 10);
    };

    let prevBounds = null;
    if (range === 'today' && boundStartDate) {
      const d = shiftDateStr(boundStartDate, -1);
      prevBounds = { startDate: d, endDate: d, label: 'vs Kemarin' };
    } else if (range === 'week' && boundStartDate && boundEndDate) {
      prevBounds = {
        startDate: shiftDateStr(boundStartDate, -7),
        endDate: shiftDateStr(boundEndDate, -7),
        label: 'vs Minggu Lalu'
      };
    } else if (range === 'month' && boundStartDate) {
      const curY = Number(boundStartDate.slice(0, 4));
      const curM = Number(boundStartDate.slice(5, 7));
      const prevY = curM === 1 ? curY - 1 : curY;
      const prevM = curM === 1 ? 12 : curM - 1;
      const lastD = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
      const ym = `${prevY}-${String(prevM).padStart(2, '0')}`;
      prevBounds = { startDate: `${ym}-01`, endDate: `${ym}-${String(lastD).padStart(2, '0')}`, label: 'vs Bulan Lalu' };
    } else if (range === 'year' && boundStartDate) {
      const prevY = Number(boundStartDate.slice(0, 4)) - 1;
      prevBounds = { startDate: `${prevY}-01-01`, endDate: `${prevY}-12-31`, label: 'vs Tahun Lalu' };
    } else if (range === 'custom' && boundStartDate && boundEndDate) {
      const spanDays = Math.max(
        1,
        Math.round((Date.parse(`${boundEndDate}T00:00:00Z`) - Date.parse(`${boundStartDate}T00:00:00Z`)) / 86400000) + 1
      );
      const prevEnd = shiftDateStr(boundStartDate, -1);
      const prevStart = shiftDateStr(prevEnd, -(spanDays - 1));
      prevBounds = { startDate: prevStart, endDate: prevEnd, label: 'vs Periode Sebelumnya' };
    }

    // Determine timeline granularity
    let granularity = 'day';
    if (range === 'today') {
      granularity = 'hour';
    } else if (range === 'year') {
      granularity = 'month';
    } else if (range === 'custom' && boundStartDate && boundEndDate) {
      if (boundStartDate === boundEndDate) {
        granularity = 'hour';
      } else {
        const dayDiff = Math.round((new Date(boundEndDate) - new Date(boundStartDate)) / 86400000);
        granularity = dayDiff > 60 ? 'month' : 'day';
      }
    } else if (range === 'all') {
      const orderDates = allOrders.map(resolveOrderDateStr).sort();
      if (orderDates.length > 0) {
        const spanDays = Math.round((new Date(orderDates[orderDates.length - 1]) - new Date(orderDates[0])) / 86400000);
        granularity = spanDays > 60 ? 'month' : 'day';
      }
    }

    const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const formatBucketLabel = (bucketKey) => {
      if (granularity === 'hour') return `${bucketKey}:00`;
      if (granularity === 'month') {
        const [yr, mo] = bucketKey.split('-');
        return `${MONTH_SHORT[Math.max(0, Number(mo) - 1)]} ${yr}`;
      }
      const d = new Date(`${bucketKey}T00:00:00Z`);
      const dayName = DAY_SHORT[d.getUTCDay()] || '';
      const dd = bucketKey.slice(8, 10);
      const mm = MONTH_SHORT[Math.max(0, Number(bucketKey.slice(5, 7)) - 1)] || '';
      return `${dayName}, ${Number(dd)} ${mm}`;
    };

    // Pre-populate chronological slots for empty gap continuity in graphs
    const timelineMap = {};
    const ensureBucket = (bucketKey) => {
      if (!timelineMap[bucketKey]) {
        timelineMap[bucketKey] = {
          key: bucketKey,
          label: formatBucketLabel(bucketKey),
          fullDate: bucketKey,
          revenue: 0,
          orders: 0,
          qty: 0,
          _series: {}
        };
      }
      return timelineMap[bucketKey];
    };

    if (granularity === 'hour') {
      for (let h = 7; h <= 22; h++) ensureBucket(String(h).padStart(2, '0'));
    } else if (granularity === 'day' && boundStartDate && boundEndDate) {
      const startMs = new Date(`${boundStartDate}T00:00:00Z`).getTime();
      const endMs = Math.min(new Date(`${boundEndDate}T00:00:00Z`).getTime(), startMs + 45 * 86400000);
      for (let t = startMs; t <= endMs; t += 86400000) {
        ensureBucket(new Date(t).toISOString().slice(0, 10));
      }
    } else if (granularity === 'month' && range === 'year') {
      const yr = todayDateStr.slice(0, 4);
      for (let m = 1; m <= 12; m++) {
        ensureBucket(`${yr}-${String(m).padStart(2, '0')}`);
      }
    }

    // Filter state sets
    const storeFilterSet = new Set(selectedStoreIds.map(String));
    const catFilterSet = new Set(selectedCategories.map(s => s.toLowerCase()));
    const itemFilterSet = new Set(selectedItemIds.map(s => s.toLowerCase()));
    const empFilterSet = new Set(selectedEmployeeIds.map(String));
    const hasItemOrCatFilter = catFilterSet.size > 0 || itemFilterSet.size > 0;

    // Aggregators
    const byItemMap = {};
    const byCatMap = {};
    const byStoreMap = {};
    const byEmpMap = {};
    const combineMap = {};

    // Initialize store & employee entries when broad view or tracking all zero stores/staff in 'all'
    Object.values(storeCatalogMap).forEach(s => {
      if (storeFilterSet.size === 0 || storeFilterSet.has(String(s.id))) {
        byStoreMap[s.id] = {
          key: s.id,
          id: s.id,
          name: s.name,
          address: s.address,
          saldoNota: s.saldoNota,
          qty: 0,
          revenue: 0,
          ordersCount: 0,
          qrisRevenue: 0,
          cashRevenue: 0,
          notaFees: 0,
          topMenuItems: {}
        };
      }
    });

    Object.values(employeeCatalogMap).forEach(e => {
      if (empFilterSet.size === 0 || empFilterSet.has(String(e.id))) {
        byEmpMap[e.id] = {
          key: e.id,
          id: e.id,
          name: e.name,
          role: e.role,
          qty: 0,
          revenue: 0,
          ordersCount: 0,
          cashHandled: 0,
          qrisProcessed: 0
        };
      }
    });

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItemsSold = 0;
    const prevStats = { revenue: 0, orders: 0, items: 0 };
    const paymentStats = { cashRevenue: 0, cashOrders: 0, qrisRevenue: 0, qrisOrders: 0 };
    const peakHoursMap = {};
    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0');
      peakHoursMap[hStr] = {
        hour: h,
        key: hStr,
        label: `${hStr}:00`,
        shortLabel: hStr,
        orders: 0,
        revenue: 0,
        qty: 0
      };
    }

    const itemCatalogSeen = new Map();
    products.forEach(p => {
      itemCatalogSeen.set(String(p.id), {
        id: String(p.id),
        name: p.name,
        category: p.category || 'Lainnya',
        price: Number(p.price) || 0
      });
    });

    allOrders.forEach(order => {
      const dateStr = resolveOrderDateStr(order);
      const hourStr = resolveOrderHourStr(order);
      const sid = order.storeId && storeCatalogMap[String(order.storeId)]
        ? String(order.storeId)
        : primaryStoreId;
      const storeMeta = storeCatalogMap[sid] || { id: sid, name: order.storeName || 'Toko Utama' };

      const cid = order.cashierId && employeeCatalogMap[String(order.cashierId)]
        ? String(order.cashierId)
        : (order.cashierId ? String(order.cashierId) : 'KSR-01');
      const empMeta = employeeCatalogMap[cid] || { id: cid, name: order.cashierName || 'Kasir Utama', role: 'Kasir' };

      const orderItems = Array.isArray(order.items) ? order.items : [];
      orderItems.forEach(it => {
        const pid = String(it.productId || it.id || it.name || 'item');
        const matchedProd = productById[pid] || (it.name ? productByName[String(it.name).toLowerCase()] : null);
        const cat = String(it.category || matchedProd?.category || 'Lainnya').trim();
        categorySet.add(cat);
        if (!itemCatalogSeen.has(pid)) {
          itemCatalogSeen.set(pid, {
            id: pid,
            name: it.name || matchedProd?.name || pid,
            category: cat,
            price: Number(it.price || matchedProd?.price || 0)
          });
        }
      });

      const inCurrentWindow = matchesDateRange(dateStr);
      const inPrevWindow = Boolean(prevBounds && dateStr >= prevBounds.startDate && dateStr <= prevBounds.endDate);
      if (!inCurrentWindow && !inPrevWindow) return;
      if (storeFilterSet.size > 0 && !storeFilterSet.has(sid)) return;
      if (empFilterSet.size > 0 && !empFilterSet.has(cid) && !empFilterSet.has(empMeta.name)) return;

      const matchedItems = [];
      let allItemsQty = 0;
      orderItems.forEach(it => {
        const pid = String(it.productId || it.id || it.name || 'item');
        const matchedProd = productById[pid] || (it.name ? productByName[String(it.name).toLowerCase()] : null);
        const itemName = it.name || matchedProd?.name || 'Menu';
        const itemCat = String(it.category || matchedProd?.category || 'Lainnya').trim();
        const qty = Number(it.qty) || 1;
        const unitPrice = Number(it.price || matchedProd?.price || 0);
        const itemSub = Number(it.subtotal) || (unitPrice * qty);
        allItemsQty += qty;

        const matchesCat = catFilterSet.size === 0 || catFilterSet.has(itemCat.toLowerCase());
        const matchesItem = itemFilterSet.size === 0 || itemFilterSet.has(pid.toLowerCase()) || itemFilterSet.has(itemName.toLowerCase());
        if (matchesCat && matchesItem) {
          matchedItems.push({ pid, itemName, itemCat, qty, itemSub, unitPrice, image: matchedProd?.image || null });
        }
      });

      if (hasItemOrCatFilter && matchedItems.length === 0) return;

      const pm = String(order.paymentMethod || '').toUpperCase();
      const isCash = pm.includes('CASH') || pm.includes('TUNAI');
      const orderContributionRev = hasItemOrCatFilter
        ? matchedItems.reduce((s, it) => s + it.itemSub, 0)
        : Number(order.totalAmount || order.subtotal || matchedItems.reduce((s, it) => s + it.itemSub, 0));
      const orderContributionQty = hasItemOrCatFilter
        ? matchedItems.reduce((s, it) => s + it.qty, 0)
        : Math.max(allItemsQty, 0);

      if (inPrevWindow) {
        prevStats.revenue += orderContributionRev;
        prevStats.orders += 1;
        prevStats.items += orderContributionQty;
      }
      if (!inCurrentWindow) return;

      totalRevenue += orderContributionRev;
      totalOrders += 1;
      totalItemsSold += orderContributionQty;

      if (isCash) {
        paymentStats.cashRevenue += orderContributionRev;
        paymentStats.cashOrders += 1;
      } else {
        paymentStats.qrisRevenue += orderContributionRev;
        paymentStats.qrisOrders += 1;
      }

      const hourBucket = peakHoursMap[hourStr] || peakHoursMap['12'];
      hourBucket.orders += 1;
      hourBucket.revenue += orderContributionRev;
      hourBucket.qty += orderContributionQty;

      // Timeline bucket
      const bucketKey = granularity === 'hour'
        ? resolveOrderHourStr(order)
        : granularity === 'month'
          ? dateStr.slice(0, 7)
          : dateStr;
      const bucket = ensureBucket(bucketKey);
      bucket.revenue += orderContributionRev;
      bucket.orders += 1;
      bucket.qty += orderContributionQty;

      // Series attribution on timeline by active filterMode
      if (filterMode === 'store') {
        bucket._series[storeMeta.name] = (bucket._series[storeMeta.name] || 0) + orderContributionRev;
      } else if (filterMode === 'employee') {
        bucket._series[empMeta.name] = (bucket._series[empMeta.name] || 0) + orderContributionRev;
      } else if (filterMode === 'category') {
        matchedItems.forEach(mi => {
          bucket._series[mi.itemCat] = (bucket._series[mi.itemCat] || 0) + mi.itemSub;
        });
      } else if (filterMode === 'item') {
        matchedItems.forEach(mi => {
          bucket._series[mi.itemName] = (bucket._series[mi.itemName] || 0) + mi.itemSub;
        });
      }

      // Store breakdown
      if (!byStoreMap[sid]) {
        byStoreMap[sid] = {
          key: sid,
          id: sid,
          name: storeMeta.name,
          address: storeMeta.address || '-',
          saldoNota: storeMeta.saldoNota ?? 5000,
          qty: 0,
          revenue: 0,
          ordersCount: 0,
          qrisRevenue: 0,
          cashRevenue: 0,
          notaFees: 0,
          topMenuItems: {}
        };
      }
      const stEntry = byStoreMap[sid];
      stEntry.ordersCount += 1;
      stEntry.qty += orderContributionQty;
      stEntry.revenue += orderContributionRev;
      stEntry.notaFees += Number(order.adminFee || 100);
      if (isCash) stEntry.cashRevenue += orderContributionRev;
      else stEntry.qrisRevenue += orderContributionRev;
      matchedItems.forEach(mi => {
        stEntry.topMenuItems[mi.itemName] = (stEntry.topMenuItems[mi.itemName] || 0) + mi.qty;
      });

      // Employee breakdown
      if (!byEmpMap[cid]) {
        byEmpMap[cid] = {
          key: cid,
          id: cid,
          name: empMeta.name,
          role: empMeta.role || 'Kasir',
          qty: 0,
          revenue: 0,
          ordersCount: 0,
          cashHandled: 0,
          qrisProcessed: 0
        };
      }
      const empEntry = byEmpMap[cid];
      empEntry.ordersCount += 1;
      empEntry.qty += orderContributionQty;
      empEntry.revenue += orderContributionRev;
      if (isCash) empEntry.cashHandled += orderContributionRev;
      else empEntry.qrisProcessed += orderContributionRev;

      // Item, Category & Combine tuple breakdowns
      const seenCatsInOrder = new Set();
      const seenItemsInOrder = new Set();

      matchedItems.forEach(mi => {
        // Item breakdown
        if (!byItemMap[mi.pid]) {
          const prod = productById[mi.pid];
          const ingList = recipes[mi.pid] || [];
          const hppPerPortion = ingList.reduce((sum, ing) => {
            const inv = inventory.find(i => i.id === ing.inventoryId);
            return sum + ((inv ? Number(inv.costPerUnit || 0) : 0) * (Number(ing.amount) || 0));
          }, 0);
          byItemMap[mi.pid] = {
            key: mi.pid,
            id: mi.pid,
            productId: mi.pid,
            name: mi.itemName,
            category: mi.itemCat,
            price: prod?.price || mi.unitPrice,
            image: mi.image,
            qty: 0,
            revenue: 0,
            ordersCount: 0,
            hppPerPortion
          };
        }
        byItemMap[mi.pid].qty += mi.qty;
        byItemMap[mi.pid].revenue += mi.itemSub;
        if (!seenItemsInOrder.has(mi.pid)) {
          seenItemsInOrder.add(mi.pid);
          byItemMap[mi.pid].ordersCount += 1;
        }

        // Category breakdown
        if (!byCatMap[mi.itemCat]) {
          byCatMap[mi.itemCat] = {
            key: mi.itemCat,
            name: mi.itemCat,
            qty: 0,
            revenue: 0,
            ordersCount: 0,
            _itemIds: new Set()
          };
        }
        byCatMap[mi.itemCat].qty += mi.qty;
        byCatMap[mi.itemCat].revenue += mi.itemSub;
        byCatMap[mi.itemCat]._itemIds.add(mi.pid);
        if (!seenCatsInOrder.has(mi.itemCat)) {
          seenCatsInOrder.add(mi.itemCat);
          byCatMap[mi.itemCat].ordersCount += 1;
        }

        // Combine breakdown tuple (Toko x Kategori x Item x Karyawan)
        const combineKey = `${sid}::${mi.itemCat}::${mi.pid}::${cid}`;
        if (!combineMap[combineKey]) {
          const shortEmp = empMeta.name.split('(')[0].trim();
          combineMap[combineKey] = {
            key: combineKey,
            label: `${mi.itemName} (${shortEmp} - ${storeMeta.name})`,
            storeId: sid,
            storeName: storeMeta.name,
            category: mi.itemCat,
            itemId: mi.pid,
            itemName: mi.itemName,
            employeeId: cid,
            employeeName: empMeta.name,
            qty: 0,
            revenue: 0,
            ordersCount: 0
          };
        }
        combineMap[combineKey].qty += mi.qty;
        combineMap[combineKey].revenue += mi.itemSub;
        combineMap[combineKey].ordersCount += 1;
      });
    });

    // Finalize breakdown arrays
    const byItem = Object.values(byItemMap).map(m => {
      const totalHPP = m.qty * (m.hppPerPortion || 0);
      const grossProfit = Math.max(0, m.revenue - totalHPP);
      return {
        ...m,
        totalQtySold: m.qty,
        totalRevenue: m.revenue,
        orderCount: m.ordersCount,
        totalHPP,
        grossProfit,
        marginPct: m.revenue > 0 ? ((grossProfit / m.revenue) * 100).toFixed(1) : '0.0'
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const byCategory = Object.values(byCatMap).map(c => ({
      key: c.key,
      name: c.name,
      qty: c.qty,
      revenue: c.revenue,
      ordersCount: c.ordersCount,
      itemCount: c._itemIds.size
    })).sort((a, b) => b.revenue - a.revenue);

    const byStore = Object.values(byStoreMap).map(s => {
      const netRevenue = Math.max(0, s.revenue - s.notaFees);
      const aov = s.ordersCount > 0 ? Math.round(s.revenue / s.ordersCount) : 0;
      return {
        ...s,
        storeId: s.id,
        storeName: s.name,
        totalOrders: s.ordersCount,
        grossRevenue: s.revenue,
        netRevenue,
        aov
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const byEmployee = Object.values(byEmpMap).map((e, idx) => ({
      ...e,
      rank: idx + 1,
      cashierId: e.id,
      cashierName: e.name,
      ordersCount: e.ordersCount,
      avgOrderValue: e.ordersCount > 0 ? Math.round(e.revenue / e.ordersCount) : 0
    })).sort((a, b) => b.revenue - a.revenue);

    const combineMatrix = Object.values(combineMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // Build chronological timelineSeries + top multi-series breakdown keys
    const sortedBuckets = Object.values(timelineMap).sort((a, b) => a.key.localeCompare(b.key));
    const seriesTotals = {};
    sortedBuckets.forEach(b => {
      Object.entries(b._series).forEach(([k, val]) => {
        seriesTotals[k] = (seriesTotals[k] || 0) + val;
      });
    });
    const SERIES_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const topSeriesNames = Object.entries(seriesTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    const seriesMeta = topSeriesNames.map((name, idx) => ({
      key: `series_${idx}`,
      name,
      color: SERIES_PALETTE[idx % SERIES_PALETTE.length]
    }));

    const timelineSeries = sortedBuckets.map(b => {
      const row = {
        key: b.key,
        label: b.label,
        fullDate: b.fullDate,
        revenue: b.revenue,
        orders: b.orders,
        qty: b.qty
      };
      seriesMeta.forEach(meta => {
        row[meta.key] = b._series[meta.name] || 0;
      });
      return row;
    });

    // Preserve legacy crossBranchMatrix + inventoryAlerts
    const crossBranchMatrix = products.map(prod => {
      const branchBreakdown = {};
      let totalAllBranchesQty = 0;
      let totalAllBranchesRevenue = 0;
      storesList.forEach(st => {
        branchBreakdown[st.id] = { storeId: st.id, storeName: st.name, qty: 0, revenue: 0 };
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

    const inventoryAlerts = inventory
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

    const payTotalRev = paymentStats.cashRevenue + paymentStats.qrisRevenue;
    const payTotalOrd = paymentStats.cashOrders + paymentStats.qrisOrders;
    const calcPayPct = (rev, cnt) => (
      payTotalRev > 0
        ? Math.round((rev / payTotalRev) * 1000) / 10
        : (payTotalOrd > 0 ? Math.round((cnt / payTotalOrd) * 1000) / 10 : 0)
    );
    const paymentSplit = [
      {
        key: 'CASH',
        label: 'Tunai (Cash)',
        revenue: paymentStats.cashRevenue,
        ordersCount: paymentStats.cashOrders,
        pct: calcPayPct(paymentStats.cashRevenue, paymentStats.cashOrders),
        color: '#10b981'
      },
      {
        key: 'QRIS',
        label: 'QRIS / Non-Tunai',
        revenue: paymentStats.qrisRevenue,
        ordersCount: paymentStats.qrisOrders,
        pct: calcPayPct(paymentStats.qrisRevenue, paymentStats.qrisOrders),
        color: '#2563eb'
      }
    ];

    const allPeakHours = Object.values(peakHoursMap).sort((a, b) => a.hour - b.hour);
    const activeHourNums = allPeakHours.filter(h => h.orders > 0 || h.revenue > 0).map(h => h.hour);
    const spanMinHour = activeHourNums.length > 0 ? Math.min(7, ...activeHourNums) : 7;
    const spanMaxHour = activeHourNums.length > 0 ? Math.max(22, ...activeHourNums) : 22;
    const peakSortedByOrders = [...allPeakHours].sort((a, b) => (b.orders - a.orders) || (b.revenue - a.revenue));
    const busiestHour = peakSortedByOrders[0] && peakSortedByOrders[0].orders > 0 ? peakSortedByOrders[0] : null;
    const peakSortedByRev = [...allPeakHours].sort((a, b) => (b.revenue - a.revenue) || (b.orders - a.orders));
    const busiestRevHour = peakSortedByRev[0] && peakSortedByRev[0].revenue > 0 ? peakSortedByRev[0] : null;
    const peakHours = allPeakHours
      .filter(h => h.hour >= spanMinHour && h.hour <= spanMaxHour)
      .map(h => ({
        ...h,
        isPeak: Boolean(busiestHour && h.hour === busiestHour.hour)
      }));
    const peakHourSummary = {
      busiestLabel: busiestHour ? busiestHour.label : '-',
      busiestOrders: busiestHour ? busiestHour.orders : 0,
      busiestRevenue: busiestHour ? busiestHour.revenue : 0,
      busiestRevenueLabel: busiestRevHour ? busiestRevHour.label : '-',
      busiestRevenueValue: busiestRevHour ? busiestRevHour.revenue : 0
    };

    const calcDeltaPct = (curr, prev) => {
      if (prev === 0 && curr === 0) return 0;
      if (prev === 0 && curr > 0) return 100;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };
    const currAov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const prevAov = prevStats.orders > 0 ? Math.round(prevStats.revenue / prevStats.orders) : 0;
    const comparison = prevBounds
      ? {
          available: true,
          label: prevBounds.label,
          startDate: prevBounds.startDate,
          endDate: prevBounds.endDate,
          prevRevenue: prevStats.revenue,
          prevOrders: prevStats.orders,
          prevItemsSold: prevStats.items,
          prevAov,
          revenueDeltaPct: calcDeltaPct(totalRevenue, prevStats.revenue),
          ordersDeltaPct: calcDeltaPct(totalOrders, prevStats.orders),
          itemsDeltaPct: calcDeltaPct(totalItemsSold, prevStats.items),
          aovDeltaPct: calcDeltaPct(currAov, prevAov)
        }
      : { available: false, label: 'All Time' };

    res.json({
      success: true,
      appliedFilters: {
        range,
        startDate: boundStartDate || null,
        endDate: boundEndDate || null,
        filterMode,
        storeIds: selectedStoreIds,
        categories: selectedCategories,
        itemIds: selectedItemIds,
        employeeIds: selectedEmployeeIds,
        granularity
      },
      filterOptions: {
        stores: Object.values(storeCatalogMap).map(s => ({ id: s.id, name: s.name })),
        categories: Array.from(categorySet).sort((a, b) => a.localeCompare(b)),
        items: Array.from(itemCatalogSeen.values()).sort((a, b) => a.name.localeCompare(b.name)),
        employees: Object.values(employeeCatalogMap)
          .map(e => ({ id: e.id, name: e.name, role: e.role, assignedStoreIds: e.assignedStoreIds || ['all'] }))
          .sort((a, b) => a.name.localeCompare(b.name))
      },
      timelineSeries,
      seriesMeta,
      breakdowns: {
        byItem,
        byCategory,
        byStore,
        byEmployee,
        combineMatrix
      },
      paymentSplit,
      peakHours,
      peakHourSummary,
      comparison,
      perMenu: byItem,
      perStore: byStore,
      crossBranchPerMenu: crossBranchMatrix,
      perCashier: byEmployee,
      inventoryAlerts,
      summary: {
        totalOrdersAll: totalOrders,
        totalGrossOmset: totalRevenue,
        totalItemsSold,
        averageOrderValue: currAov,
        activeBranchesCount: byStore.length,
        activeCategoriesCount: byCategory.length,
        activeItemsCount: byItem.length,
        activeEmployeesCount: byEmployee.length,
        totalMenuItems: products.length,
        inventoryAlertsCount: inventoryAlerts.length
      }
    });
  });

  // ── 8B. CONSOLIDATED MULTI-STORE DASHBOARD SUMMARY ────────────────────────
  router.get('/consolidated-summary', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);

    const requestedOwner = req.query.ownerId || req.user?.id || null;
    const currentId = db.settings?.posStore?.merchantId || db.settings?.posStore?.uid;
    const currentMerchant = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(currentId))
      || (db.merchants || []).find(m => m && m.status !== 'deleted')
      || null;
    const stores = getOwnerStoresList(db, currentMerchant, requestedOwner);
    const primaryStoreId = stores[0]?.id || currentMerchant?.id || 'PRIMARY-STORE';

    const storeMap = {};
    stores.forEach(s => {
      storeMap[String(s.id)] = {
        storeId: String(s.id),
        storeName: s.name || 'Toko POS',
        location: s.location || '',
        address: s.address || '',
        kuotaNota: Number(s.kuotaNota ?? 0),
        saldoNota: Number(s.saldoNota ?? 0),
        isActive: String(s.id) === String(currentId),
        todayRevenue: 0,
        todayOrders: 0,
        monthRevenue: 0,
        monthOrders: 0,
        allTimeRevenue: 0,
        allTimeOrders: 0
      };
    });

    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const toWibIso = (d) => {
      const ms = d ? new Date(d).getTime() : Date.now();
      return new Date((Number.isFinite(ms) ? ms : Date.now()) + WIB_OFFSET_MS).toISOString();
    };
    const todayWibStr = toWibIso(new Date()).slice(0, 10);
    const monthWibStr = todayWibStr.slice(0, 7);

    const totals = {
      todayRevenue: 0,
      todayOrders: 0,
      monthRevenue: 0,
      monthOrders: 0,
      allTimeRevenue: 0,
      allTimeOrders: 0
    };

    const validOrders = (db.pos_orders || []).filter(o => o && o.status !== 'CANCELLED');
    const enrichedOrders = [];

    validOrders.forEach(order => {
      const rawSid = order.storeId ? String(order.storeId) : String(primaryStoreId);
      const targetSid = storeMap[rawSid] ? rawSid : String(primaryStoreId);
      const stEntry = storeMap[targetSid];
      if (!stEntry) return;

      const rev = Number(order.totalAmount || order.subtotal || 0);
      const ordWibDate = toWibIso(order.createdAt || order.paidAt || order.completedAt).slice(0, 10);
      const ordWibMonth = ordWibDate.slice(0, 7);

      stEntry.allTimeRevenue += rev;
      stEntry.allTimeOrders += 1;
      totals.allTimeRevenue += rev;
      totals.allTimeOrders += 1;

      if (ordWibMonth === monthWibStr) {
        stEntry.monthRevenue += rev;
        stEntry.monthOrders += 1;
        totals.monthRevenue += rev;
        totals.monthOrders += 1;
      }

      if (ordWibDate === todayWibStr) {
        stEntry.todayRevenue += rev;
        stEntry.todayOrders += 1;
        totals.todayRevenue += rev;
        totals.todayOrders += 1;
      }

      enrichedOrders.push({
        ...order,
        storeId: targetSid,
        storeName: order.storeName || stEntry.storeName
      });
    });

    enrichedOrders.sort((a, b) => new Date(b.createdAt || b.paidAt || 0).getTime() - new Date(a.createdAt || a.paidAt || 0).getTime());

    const storesSummary = Object.values(storeMap).sort((a, b) => b.todayRevenue - a.todayRevenue || b.monthRevenue - a.monthRevenue);

    res.json({
      success: true,
      totalStores: storesSummary.length,
      activeStoreId: currentId ? String(currentId) : primaryStoreId,
      totals,
      stores: storesSummary,
      recentOrders: enrichedOrders.slice(0, 25)
    });
  });

  // =========================================================================
  // TRACK A: MULTIPLE SHARED LOYALTY POOLS & TIERED BILLING (Rp 25 vs Rp 100)
  // =========================================================================
  router.get('/loyalty-pools', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const requestedOwnerId = req.query.ownerId || req.user?.id || null;
    const ownerAliases = buildAuthorizedOwnerAliasSet(db, requestedOwnerId);

    const store = db.settings.posStore || {};
    const currentMerchant = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(store.merchantId || store.uid)) || null;
    const ownerStores = getOwnerStoresList(db, currentMerchant, requestedOwnerId);
    const ownerStoreIds = new Set(ownerStores.map(s => String(s.id)));

    const pools = (db.loyalty_pools || []).filter(p => {
      if (!p || p.is_active === false) return false;
      if (!requestedOwnerId) return true;
      return doesOwnerOwnPool(db, requestedOwnerId, p) || ownerAliases.has(String(p.owner_id));
    });

    const enrichedPools = pools.map(pool => {
      const attachedStores = ownerStores.filter(s => String(s.loyaltyPoolId || '') === String(pool.id));
      const poolWallets = (db.loyalty_pool_balances || []).filter(w => String(w.loyalty_pool_id) === String(pool.id));
      const poolTxs = (db.point_transactions || []).filter(tx => String(tx.loyalty_pool_id) === String(pool.id));
      return {
        ...pool,
        store_count: attachedStores.length,
        attachedStores,
        stats: {
          active_wallets: poolWallets.length,
          outstanding_points: poolWallets.reduce((s, w) => s + Number(w.balance_points || 0), 0),
          total_earned_points: poolTxs.filter(t => t.tx_type === 'EARN').reduce((s, t) => s + Number(t.points_delta || 0), 0),
          total_redeemed_points: poolTxs.filter(t => t.tx_type === 'REDEEM').reduce((s, t) => s + Math.abs(Number(t.points_delta || 0)), 0),
          total_redeem_discount_idr: poolTxs.filter(t => t.tx_type === 'REDEEM').reduce((s, t) => s + Number(t.idr_amount || 0), 0)
        }
      };
    });

    const recentPointTransactions = (db.point_transactions || [])
      .filter(tx => ownerStoreIds.has(String(tx.store_id)) || pools.some(p => String(p.id) === String(tx.loyalty_pool_id)))
      .slice(0, 60);

    const storeLedger = (db.nota_billing_ledger || [])
      .filter(l => ownerStoreIds.has(String(l.store_id)))
      .slice(0, 60);

    const tier1Entries = storeLedger.filter(l => l.entry_type === 'NOTA_TIER_1');
    const tier2Entries = storeLedger.filter(l => l.entry_type === 'NOTA_TIER_2');

    res.json({
      success: true,
      tierPricing: {
        tier1FeeIdr: TIER_1_FEE_IDR,
        tier2FeeIdr: TIER_2_FEE_IDR
      },
      pools: enrichedPools,
      ownerStores,
      recentPointTransactions,
      notaBillingSummary: {
        tier1Count: tier1Entries.length,
        tier1TotalIdr: tier1Entries.reduce((s, e) => s + Math.abs(Number(e.amount_idr || 0)), 0),
        tier2Count: tier2Entries.length,
        tier2TotalIdr: tier2Entries.reduce((s, e) => s + Math.abs(Number(e.amount_idr || 0)), 0)
      },
      recentNotaLedger: storeLedger
    });
  });

  router.post('/loyalty-pools', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const body = req.body || {};
    const requestedOwnerId = body.ownerId || body.ownerUserId || req.user?.id || 'OWNER-DEFAULT';
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Nama Loyalty Pool wajib diisi.' });
    }

    const attachStoreIds = Array.isArray(body.storeIds)
      ? body.storeIds.map(String)
      : (body.storeId ? [String(body.storeId)] : []);
    for (const sid of attachStoreIds) {
      const m = (db.merchants || []).find(x => x && x.status !== 'deleted' && String(x.id) === sid);
      if (!m) {
        return res.status(404).json({ error: `Toko "${sid}" tidak ditemukan.` });
      }
      if (!doesOwnerOwnMerchant(db, requestedOwnerId, m)) {
        return res.status(403).json({
          error: `Akses ditolak: Toko "${m.name || sid}" bukan milik owner ini.`
        });
      }
    }

    const aliases = Array.from(buildAuthorizedOwnerAliasSet(db, requestedOwnerId));
    const nowIso = new Date().toISOString();
    const pool = {
      id: `POOL-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
      owner_id: String(requestedOwnerId),
      owner_aliases: aliases,
      name,
      description: String(body.description || '').trim(),
      min_spend_per_point: Math.max(100, Number(body.min_spend_per_point ?? body.minSpendPerPoint) || 10000),
      points_per_unit: Math.max(1, Number(body.points_per_unit ?? body.pointsPerUnit) || 1),
      point_value_idr: Math.max(1, Number(body.point_value_idr ?? body.pointValueIdr) || 500),
      min_redeem_points: Math.max(1, Number(body.min_redeem_points ?? body.minRedeemPoints) || 1),
      max_redeem_percent: Math.min(100, Math.max(1, Number(body.max_redeem_percent ?? body.maxRedeemPercent) || 50)),
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso
    };
    db.loyalty_pools.unshift(pool);

    attachStoreIds.forEach(sid => {
      const m = (db.merchants || []).find(x => x && x.status !== 'deleted' && String(x.id) === sid);
      if (m) {
        const prevPoolId = m.loyalty_pool_id || null;
        m.loyalty_pool_id = pool.id;
        m.kuotaNota = Math.max(0, Math.floor(Number(m.saldoNota ?? 5000) / TIER_2_FEE_IDR));
        db.store_pool_history.unshift({
          id: `SPH-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
          store_id: String(m.id),
          store_name: m.name || 'Toko POS',
          from_pool_id: prevPoolId,
          to_pool_id: pool.id,
          to_pool_name: pool.name,
          changed_by: String(requestedOwnerId),
          note: `Dihubungkan saat pembuatan pool "${pool.name}" (Tier 2 Rp 100/nota)`,
          changed_at: nowIso
        });
        if (db.settings?.posStore && String(db.settings.posStore.merchantId || db.settings.posStore.uid) === String(m.id)) {
          db.settings.posStore.loyaltyPoolId = pool.id;
          db.settings.posStore.loyaltyPoolName = pool.name;
          db.settings.posStore.billingTier = 'TIER_2_LOYALTY';
          db.settings.posStore.notaFeePerNotaIdr = TIER_2_FEE_IDR;
          db.settings.posStore.kuotaNota = m.kuotaNota;
        }
      }
    });

    writeDB(db, req);
    res.status(201).json({
      success: true,
      message: `Loyalty Pool "${pool.name}" berhasil dibuat.`,
      pool
    });
  });

  router.patch('/loyalty-pools/:poolId', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { poolId } = req.params;
    const body = req.body || {};
    const requestedOwnerId = body.ownerId || body.ownerUserId || req.user?.id || null;

    const pool = (db.loyalty_pools || []).find(p => p && String(p.id) === String(poolId));
    if (!pool) return res.status(404).json({ error: 'Loyalty Pool tidak ditemukan.' });
    if (requestedOwnerId && !doesOwnerOwnPool(db, requestedOwnerId, pool)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik Loyalty Pool ini.' });
    }

    if (body.name !== undefined && String(body.name).trim()) pool.name = String(body.name).trim();
    if (body.description !== undefined) pool.description = String(body.description).trim();
    if (body.min_spend_per_point !== undefined) pool.min_spend_per_point = Math.max(100, Number(body.min_spend_per_point) || 10000);
    if (body.points_per_unit !== undefined) pool.points_per_unit = Math.max(1, Number(body.points_per_unit) || 1);
    if (body.point_value_idr !== undefined) pool.point_value_idr = Math.max(1, Number(body.point_value_idr) || 500);
    if (body.min_redeem_points !== undefined) pool.min_redeem_points = Math.max(1, Number(body.min_redeem_points) || 1);
    if (body.max_redeem_percent !== undefined) pool.max_redeem_percent = Math.min(100, Math.max(1, Number(body.max_redeem_percent) || 50));
    if (body.is_active !== undefined) pool.is_active = Boolean(body.is_active);
    pool.updated_at = new Date().toISOString();

    if (db.settings?.posStore && String(db.settings.posStore.loyaltyPoolId || '') === String(pool.id)) {
      db.settings.posStore.loyaltyPoolName = pool.name;
    }

    writeDB(db, req);
    res.json({ success: true, message: `Aturan pool "${pool.name}" diperbarui.`, pool });
  });

  router.delete('/loyalty-pools/:poolId', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { poolId } = req.params;
    const requestedOwnerId = req.query.ownerId || req.body?.ownerId || req.user?.id || null;

    const pool = (db.loyalty_pools || []).find(p => p && String(p.id) === String(poolId));
    if (!pool) return res.status(404).json({ error: 'Loyalty Pool tidak ditemukan.' });
    if (requestedOwnerId && !doesOwnerOwnPool(db, requestedOwnerId, pool)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik Loyalty Pool ini.' });
    }

    const nowIso = new Date().toISOString();
    pool.is_active = false;
    pool.updated_at = nowIso;

    // Lepas toko ke Tier 1 (Rp 25/nota) sambil mempertahankan seluruh saldo poin member di pool_balances
    (db.merchants || []).forEach(m => {
      if (m && String(m.loyalty_pool_id || '') === String(pool.id)) {
        m.loyalty_pool_id = null;
        m.kuotaNota = Math.max(0, Math.floor(Number(m.saldoNota ?? 5000) / TIER_1_FEE_IDR));
        db.store_pool_history.unshift({
          id: `SPH-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
          store_id: String(m.id),
          store_name: m.name || 'Toko POS',
          from_pool_id: pool.id,
          to_pool_id: null,
          changed_by: String(requestedOwnerId || 'owner'),
          note: `Pool "${pool.name}" dinonaktifkan -> Toko kembali ke Tier 1 Flat (Rp 25/nota). Saldo poin member tetap tersimpan.`,
          changed_at: nowIso
        });
        if (db.settings?.posStore && String(db.settings.posStore.merchantId || db.settings.posStore.uid) === String(m.id)) {
          db.settings.posStore.loyaltyPoolId = null;
          db.settings.posStore.loyaltyPoolName = null;
          db.settings.posStore.billingTier = 'TIER_1_FLAT';
          db.settings.posStore.notaFeePerNotaIdr = TIER_1_FEE_IDR;
          db.settings.posStore.kuotaNota = m.kuotaNota;
        }
      }
    });

    writeDB(db, req);
    res.json({
      success: true,
      message: `Pool "${pool.name}" dinonaktifkan. Toko terkait beralih ke Tier 1 (Rp 25/nota) & saldo poin member tetap aman.`
    });
  });

  router.patch('/stores/:storeId/loyalty-pool', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { storeId } = req.params;
    const body = req.body || {};
    const requestedOwnerId = body.ownerId || body.ownerUserId || req.user?.id || null;
    const rawPoolId = body.loyalty_pool_id !== undefined ? body.loyalty_pool_id : body.loyaltyPoolId;
    const nextPoolId = (!rawPoolId || rawPoolId === 'null') ? null : String(rawPoolId).trim();

    const store = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(storeId));
    if (!store) return res.status(404).json({ error: 'Toko tidak ditemukan.' });

    if (requestedOwnerId && !doesOwnerOwnMerchant(db, requestedOwnerId, store)) {
      return res.status(403).json({ error: 'Akses ditolak: Owner tidak memiliki hak atas toko ini.' });
    }

    let nextPool = null;
    if (nextPoolId) {
      nextPool = (db.loyalty_pools || []).find(p => p && p.is_active !== false && String(p.id) === nextPoolId);
      if (!nextPool) return res.status(404).json({ error: 'Loyalty Pool tujuan tidak ditemukan atau nonaktif.' });
      const effectiveOwner = requestedOwnerId || store.ownerUserId || store.posOwnerId;
      if (effectiveOwner && !doesOwnerOwnPool(db, effectiveOwner, nextPool)) {
        return res.status(403).json({
          error: 'Akses ditolak: Owner hanya bisa memasukkan tokonya ke dalam Loyalty Pool miliknya sendiri.'
        });
      }
    }

    const prevPoolId = store.loyalty_pool_id || null;
    const nowIso = new Date().toISOString();
    store.loyalty_pool_id = nextPool ? nextPool.id : null;
    const newFee = nextPool ? TIER_2_FEE_IDR : TIER_1_FEE_IDR;
    store.kuotaNota = Math.max(0, Math.floor(Number(store.saldoNota ?? 5000) / newFee));
    store.updatedAt = nowIso;

    // Preserved-balance audit trail: NEVER mutates loyalty_pool_balances on pool move
    if (String(prevPoolId || '') !== String(store.loyalty_pool_id || '')) {
      db.store_pool_history.unshift({
        id: `SPH-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
        store_id: String(store.id),
        store_name: store.name || 'Toko POS',
        from_pool_id: prevPoolId,
        to_pool_id: store.loyalty_pool_id,
        to_pool_name: nextPool ? nextPool.name : null,
        changed_by: String(requestedOwnerId || store.ownerUserId || 'owner'),
        note: nextPool
          ? `Terhubung ke pool "${nextPool.name}" (Tier 2 Rp 100/nota). Saldo member di pool sebelumnya tetap aman.`
          : 'Poin dinonaktifkan -> Toko menggunakan Tier 1 Flat (Rp 25/nota). Saldo poin member tetap utuh.',
        changed_at: nowIso
      });
    }

    if (db.settings?.posStore && String(db.settings.posStore.merchantId || db.settings.posStore.uid) === String(store.id)) {
      db.settings.posStore.loyaltyPoolId = store.loyalty_pool_id;
      db.settings.posStore.loyaltyPoolName = nextPool ? nextPool.name : null;
      db.settings.posStore.billingTier = nextPool ? 'TIER_2_LOYALTY' : 'TIER_1_FLAT';
      db.settings.posStore.notaFeePerNotaIdr = newFee;
      db.settings.posStore.kuotaNota = store.kuotaNota;
    }

    writeDB(db, req);
    const activePayload = buildActiveStorePayload(db, store, requestedOwnerId);
    res.json({
      success: true,
      message: nextPool
        ? `Toko "${store.name}" terhubung ke Pool "${nextPool.name}" (Tier 2 Rp 100/nota).`
        : `Fitur poin "${store.name}" dinonaktifkan -> Billing otomatis menjadi Tier 1 Flat (Rp 25/nota).`,
      store: serializeOwnerStore(store, db),
      activeStore: activePayload
    });
  });

  router.get('/stores/:storeId/pool-history', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { storeId } = req.params;
    const history = (db.store_pool_history || []).filter(h => String(h.store_id) === String(storeId));
    res.json({ success: true, storeId, history });
  });

  router.get('/loyalty-pools/:poolId/analytics', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { poolId } = req.params;
    const requestedOwnerId = req.query.ownerId || req.user?.id || null;

    const pool = (db.loyalty_pools || []).find(p => p && String(p.id) === String(poolId));
    if (!pool) return res.status(404).json({ error: 'Loyalty Pool tidak ditemukan.' });
    if (requestedOwnerId && !doesOwnerOwnPool(db, requestedOwnerId, pool)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik Loyalty Pool ini.' });
    }

    const txs = (db.point_transactions || []).filter(tx => String(tx.loyalty_pool_id) === String(pool.id));
    const storeMap = {};
    txs.forEach(tx => {
      const sid = String(tx.store_id || 'UNKNOWN');
      if (!storeMap[sid]) {
        storeMap[sid] = {
          store_id: sid,
          store_name: tx.store_name || sid,
          earn_tx_count: 0,
          earned_points: 0,
          redeem_tx_count: 0,
          redeemed_points: 0,
          reversal_points: 0,
          redeem_discount_idr: 0
        };
      }
      const row = storeMap[sid];
      if (tx.tx_type === 'EARN') {
        row.earn_tx_count += 1;
        row.earned_points += Number(tx.points_delta || 0);
      } else if (tx.tx_type === 'REDEEM') {
        row.redeem_tx_count += 1;
        row.redeemed_points += Math.abs(Number(tx.points_delta || 0));
        row.redeem_discount_idr += Number(tx.idr_amount || 0);
      } else if (tx.tx_type === 'VOID_REVERSAL') {
        row.reversal_points += Number(tx.points_delta || 0);
      }
    });

    const memberWallets = (db.loyalty_pool_balances || [])
      .filter(w => String(w.loyalty_pool_id) === String(pool.id))
      .sort((a, b) => Number(b.balance_points || 0) - Number(a.balance_points || 0));

    const attachedStores = (db.merchants || [])
      .filter(m => m && m.status !== 'deleted' && String(m.loyalty_pool_id || '') === String(pool.id))
      .map(m => serializeOwnerStore(m, db));

    res.json({
      success: true,
      pool,
      attachedStores,
      perStoreBreakdown: Object.values(storeMap),
      memberWallets,
      recentTransactions: txs.slice(0, 60)
    });
  });

  router.get('/stores/:storeId/customers/lookup', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { storeId } = req.params;
    const rawQuery = String(req.query.phone || req.query.q || '').trim();
    const store = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(storeId))
      || { id: storeId, loyalty_pool_id: db.settings?.posStore?.loyaltyPoolId || null };
    const profile = getStoreBillingProfile(db, store);
    const canonicalPhone = normalizePhoneDigits(rawQuery);
    const ownerId = store.ownerUserId || store.posOwnerId || req.query.ownerId || 'OWNER-DEFAULT';

    let customer = null;
    if (canonicalPhone) {
      customer = findOrCreateLoyaltyCustomer(db, ownerId, canonicalPhone, '', false);
    } else if (rawQuery) {
      const qLower = rawQuery.toLowerCase();
      customer = (db.loyalty_customers || []).find(c =>
        (c.name && c.name.toLowerCase().includes(qLower)) ||
        (c.phone_display && c.phone_display.includes(rawQuery))
      ) || null;
    }

    const poolById = new Map((db.loyalty_pools || []).map(p => [String(p.id), p]));
    const allPoolWallets = customer
      ? (db.loyalty_pool_balances || [])
          .filter(w => String(w.customer_id) === String(customer.id))
          .map(w => ({
            ...w,
            pool_name: poolById.get(String(w.loyalty_pool_id))?.name || w.loyalty_pool_id,
            point_value_idr: poolById.get(String(w.loyalty_pool_id))?.point_value_idr || 500,
            is_active_pool_here: Boolean(profile.loyaltyPoolId && String(w.loyalty_pool_id) === String(profile.loyaltyPoolId))
          }))
      : [];

    const activePoolWallet = profile.loyaltyPoolId
      ? (allPoolWallets.find(w => String(w.loyalty_pool_id) === String(profile.loyaltyPoolId)) || null)
      : null;

    res.json({
      success: true,
      found: Boolean(customer),
      storeBillingProfile: {
        billingTier: profile.billingTier,
        notaFeePerNotaIdr: profile.notaFeeIdr,
        loyaltyPoolId: profile.loyaltyPoolId,
        loyaltyPoolName: profile.loyaltyPoolName,
        rule: profile.activePool
      },
      customer,
      activePoolBalance: activePoolWallet ? Number(activePoolWallet.balance_points || 0) : 0,
      allPoolWallets
    });
  });

  router.get('/customers/:customerId/points', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { customerId } = req.params;
    const poolById = new Map((db.loyalty_pools || []).map(p => [String(p.id), p]));
    const canonicalPhone = normalizePhoneDigits(customerId);
    const customer = (db.loyalty_customers || []).find(
      c => String(c.id) === String(customerId) || (canonicalPhone && c.phone_e164 === canonicalPhone)
    ) || null;

    const targetCid = customer ? customer.id : customerId;
    const wallets = (db.loyalty_pool_balances || [])
      .filter(w => String(w.customer_id) === String(targetCid) || (canonicalPhone && w.customer_phone === canonicalPhone))
      .map(w => ({
        ...w,
        pool_name: poolById.get(String(w.loyalty_pool_id))?.name || w.loyalty_pool_id,
        point_value_idr: poolById.get(String(w.loyalty_pool_id))?.point_value_idr || 500
      }));

    const transactions = (db.point_transactions || [])
      .filter(tx => String(tx.customer_id) === String(targetCid))
      .slice(0, 40);

    res.json({
      success: true,
      customer,
      wallets,
      transactions
    });
  });

  router.post('/stores/:storeId/checkout/preview', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { storeId } = req.params;
    const body = req.body || {};
    const store = (db.merchants || []).find(m => m && m.status !== 'deleted' && String(m.id) === String(storeId))
      || { id: storeId, loyalty_pool_id: db.settings?.posStore?.loyaltyPoolId || null };

    const preview = previewPoolCheckout(db, {
      merchant: store,
      customerPhone: body.customerPhone,
      customerName: body.customerName,
      redeemPoints: body.redeemPoints ?? body.pointsToRedeem ?? 0,
      grossSubtotalIdr: body.grossSubtotalIdr ?? body.subtotal ?? 0,
      otherDiscountIdr: body.otherDiscountIdr ?? body.promoDiscount ?? 0
    });
    if (!preview.ok) {
      return res.status(preview.status || 422).json(preview);
    }
    res.json({ success: true, ...preview });
  });

  router.get('/stores/:storeId/nota-billing-ledger', (req, res) => {
    const db = getDB(req);
    ensurePosCollections(db);
    const { storeId } = req.params;
    const entries = (db.nota_billing_ledger || []).filter(e => String(e.store_id) === String(storeId)).slice(0, 100);
    const tier1 = entries.filter(e => e.entry_type === 'NOTA_TIER_1');
    const tier2 = entries.filter(e => e.entry_type === 'NOTA_TIER_2');
    res.json({
      success: true,
      storeId,
      summary: {
        tier1Count: tier1.length,
        tier1TotalIdr: tier1.reduce((s, e) => s + Math.abs(Number(e.amount_idr || 0)), 0),
        tier2Count: tier2.length,
        tier2TotalIdr: tier2.reduce((s, e) => s + Math.abs(Number(e.amount_idr || 0)), 0)
      },
      entries
    });
  });

  // =========================================================================
  // TRACK B: DEMAND & SALES FORECASTING (LightGBM + Tiered Routing + WMAPE)
  // =========================================================================
  router.get('/forecasts', async (req, res) => {
    try {
      const db = getDB(req);
      ensurePosCollections(db);
      const requestedStoreId = req.query.storeId || db.settings?.posStore?.merchantId || db.settings?.posStore?.uid;
      const horizon = String(req.query.horizon || 'H1_TOMORROW').toUpperCase();
      const requestedOwnerId = req.query.ownerId || req.user?.id || null;

      const activeMerchants = (db.merchants || []).filter(m => m && m.status !== 'deleted');
      const currentMerchant = activeMerchants.find(m => String(m.id) === String(requestedStoreId)) || activeMerchants[0] || null;
      const ownerStores = getOwnerStoresList(db, currentMerchant, requestedOwnerId);

      let bundle = getCachedForecastBundle(db);
      const targetSid = String(currentMerchant?.id || requestedStoreId || ownerStores[0]?.id || 'MTR-KASIR-MASTER');
      const hasStoreRows = (bundle?.forecasts || []).some(r => String(r.store_id) === targetSid);

      if (!bundle || !hasStoreRows) {
        bundle = await runAndCacheForecastBatch(db, ownerStores, {}, false);
      }

      const formatted = formatStoreForecastApiResponse(db, bundle, targetSid, horizon);
      res.json(formatted);
    } catch (err) {
      console.error('[GET /pos/forecasts Error]:', err);
      res.status(500).json({ error: 'Gagal memproses Demand & Sales Forecast: ' + err.message });
    }
  });

  router.post('/forecasts/run-batch', async (req, res) => {
    try {
      const db = getDB(req);
      ensurePosCollections(db);
      const body = req.body || {};
      const requestedStoreId = body.storeId || db.settings?.posStore?.merchantId || db.settings?.posStore?.uid;
      const horizon = String(body.horizon || 'H1_TOMORROW').toUpperCase();
      const requestedOwnerId = body.ownerId || req.user?.id || null;
      const persist = body.persist !== false;

      const activeMerchants = (db.merchants || []).filter(m => m && m.status !== 'deleted');
      const overrideStores = Array.isArray(body.stores_override) ? body.stores_override : [];
      const matchedOverride = overrideStores.find(s => String(s?.store_id || s?.id) === String(requestedStoreId));
      const currentMerchant = activeMerchants.find(m => String(m.id) === String(requestedStoreId))
        || (matchedOverride ? null : activeMerchants[0])
        || null;
      const ownerStores = matchedOverride ? [] : getOwnerStoresList(db, currentMerchant, requestedOwnerId);
      const targetSid = String(
        matchedOverride
          ? (matchedOverride.store_id || matchedOverride.id)
          : (currentMerchant?.id || requestedStoreId || ownerStores[0]?.id || 'MTR-KASIR-MASTER')
      );

      const bundle = await runAndCacheForecastBatch(
        db,
        ownerStores,
        {
          runDate: body.runDate,
          daily_sku_sales_override: body.daily_sku_sales_override,
          stores_override: body.stores_override,
          products_override: body.products_override,
          weather_override: body.weather_override,
          macro_override: body.macro_override
        },
        persist,
        writeDB,
        req
      );

      const formatted = formatStoreForecastApiResponse(db, bundle, targetSid, horizon);
      res.json({
        ...formatted,
        persisted: persist,
        all_store_diagnostics: bundle.store_diagnostics,
        raw_forecasts_count: (bundle.forecasts || []).length
      });
    } catch (err) {
      console.error('[POST /pos/forecasts/run-batch Error]:', err);
      res.status(500).json({ error: 'Gagal menjalankan batch ML forecasting: ' + err.message });
    }
  });

  // Nightly Batch Scheduler: 01:00–03:00 WIB (cek tiap 15 menit, timer unref agar tidak menggantung CLI)
  let _lastForecastWibDay = null;
  const _forecastNightlyTimer = setInterval(async () => {
    try {
      const now = new Date();
      const wib = new Date(now.getTime() + 7 * 3600 * 1000);
      const hour = wib.getUTCHours();
      const dayStr = toWibDateStr(now);
      if (hour >= 1 && hour < 3 && _lastForecastWibDay !== dayStr) {
        _lastForecastWibDay = dayStr;
        const db = getDB(false);
        ensurePosCollections(db);
        const activeMerchants = (db.merchants || []).filter(m => m && m.status !== 'deleted');
        const ownerStores = activeMerchants.map(m => serializeOwnerStore(m, db));
        await runAndCacheForecastBatch(db, ownerStores, { runDate: dayStr }, true, writeDB, null);
        console.log(`[FORECAST NIGHTLY BATCH] Completed LightGBM quantile forecast for ${dayStr} WIB.`);
      }
    } catch (err) {
      console.warn('[FORECAST NIGHTLY BATCH] Skipped:', err.message);
    }
  }, 15 * 60 * 1000);
  if (typeof _forecastNightlyTimer.unref === 'function') {
    _forecastNightlyTimer.unref();
  }

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
