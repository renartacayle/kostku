/**
 * Multiple Shared Loyalty Pools & Tiered Nota Billing Engine (Rp 25 vs Rp 100)
 *
 * Tier 1 (Rp 25/nota): Flat transaction fee when store.loyalty_pool_id === null.
 * Tier 2 (Rp 100/nota): Applies when store is connected to an active loyalty_pool_id.
 * Balances are keyed strictly by (customer_id, loyalty_pool_id) so points earned
 * at Store A can be redeemed at Store B inside the same pool, and remain intact
 * if a store switches pools or disables points.
 */

const crypto = require('crypto');

const TIER_1_FEE_IDR = 25;
const TIER_2_FEE_IDR = 100;

function normalizePhoneDigits(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('620')) return '62' + digits.slice(3);
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('8')) return '62' + digits;
  return digits;
}

function getDisplayPhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  return digits;
}

function ensureLoyaltyCollections(db) {
  db.loyalty_pools = Array.isArray(db.loyalty_pools) ? db.loyalty_pools : [];
  db.loyalty_customers = Array.isArray(db.loyalty_customers) ? db.loyalty_customers : [];
  db.loyalty_pool_balances = Array.isArray(db.loyalty_pool_balances) ? db.loyalty_pool_balances : [];
  db.point_transactions = Array.isArray(db.point_transactions) ? db.point_transactions : [];
  db.nota_billing_ledger = Array.isArray(db.nota_billing_ledger) ? db.nota_billing_ledger : [];
  db.store_pool_history = Array.isArray(db.store_pool_history) ? db.store_pool_history : [];
}

/**
 * Resolves all alias IDs legitimately belonging to requestedOwnerId.
 * Prevents cross-tenant access: foreign ownerIds never inherit seeded workspace merchants.
 */
function buildAuthorizedOwnerAliasSet(db, requestedOwnerId) {
  const aliases = new Set();
  const cleanReq = requestedOwnerId !== undefined && requestedOwnerId !== null ? String(requestedOwnerId).trim() : '';
  if (cleanReq) aliases.add(cleanReq);

  const activeMerchants = (db.merchants || []).filter(m => m && m.status !== 'deleted');

  // Collect canonical ownerUserIds from any store directly linked to cleanReq
  activeMerchants.forEach(m => {
    const mOwner = m.ownerUserId ? String(m.ownerUserId) : '';
    const mPosOwner = m.posOwnerId ? String(m.posOwnerId) : '';
    if (cleanReq && (mOwner === cleanReq || mPosOwner === cleanReq)) {
      if (mOwner) aliases.add(mOwner);
      if (mPosOwner) aliases.add(mPosOwner);
    }
  });

  // Seeded workspace fallback ONLY for primary workspace owner account (e.g. db.users[0] / TEST_USER 1784987558042)
  // or omitted ownerId in local single-operator calls.
  const primarySeedOwner = (db.users || []).find(u => u && u.role === 'owner');
  const isPrimarySeedWorkspaceUser =
    !cleanReq || (primarySeedOwner && String(primarySeedOwner.id) === cleanReq);

  if (isPrimarySeedWorkspaceUser) {
    const curId = db.settings?.posStore?.merchantId || db.settings?.posStore?.uid;
    const curMerchant = activeMerchants.find(m => String(m.id) === String(curId)) || activeMerchants.find(m => m.kostUid === 'KOST-JAKSEL-01');
    if (curMerchant) {
      if (curMerchant.ownerUserId) aliases.add(String(curMerchant.ownerUserId));
      if (curMerchant.posOwnerId) aliases.add(String(curMerchant.posOwnerId));
    }
  }

  return aliases;
}

function doesOwnerOwnMerchant(db, requestedOwnerId, merchant) {
  if (!merchant || merchant.status === 'deleted') return false;
  if (!requestedOwnerId) return true;
  const aliases = buildAuthorizedOwnerAliasSet(db, requestedOwnerId);
  const mOwner = merchant.ownerUserId ? String(merchant.ownerUserId) : '';
  const mPosOwner = merchant.posOwnerId ? String(merchant.posOwnerId) : '';
  return (mOwner && aliases.has(mOwner)) || (mPosOwner && aliases.has(mPosOwner));
}

function doesOwnerOwnPool(db, requestedOwnerId, pool) {
  if (!pool) return false;
  if (!requestedOwnerId) return true;
  const aliases = buildAuthorizedOwnerAliasSet(db, requestedOwnerId);
  if (pool.owner_id && aliases.has(String(pool.owner_id))) return true;
  if (Array.isArray(pool.owner_aliases)) {
    return pool.owner_aliases.some(a => aliases.has(String(a)));
  }
  return false;
}

function getStoreBillingProfile(db, merchant) {
  ensureLoyaltyCollections(db);
  const poolId = merchant?.loyalty_pool_id ? String(merchant.loyalty_pool_id) : null;
  const activePool = poolId
    ? (db.loyalty_pools || []).find(p => String(p.id) === poolId && p.is_active !== false)
    : null;

  if (activePool) {
    return {
      loyaltyPoolId: String(activePool.id),
      loyaltyPoolName: activePool.name,
      activePool,
      billingTier: 'TIER_2_LOYALTY',
      notaFeeIdr: TIER_2_FEE_IDR
    };
  }

  return {
    loyaltyPoolId: null,
    loyaltyPoolName: null,
    activePool: null,
    billingTier: 'TIER_1_FLAT',
    notaFeeIdr: TIER_1_FEE_IDR
  };
}

function findOrCreateLoyaltyCustomer(db, ownerId, rawPhone, rawName, autoCreate = false) {
  ensureLoyaltyCollections(db);
  const canonicalPhone = normalizePhoneDigits(rawPhone);
  if (!canonicalPhone) return null;

  const aliases = buildAuthorizedOwnerAliasSet(db, ownerId);
  let cust = db.loyalty_customers.find(
    c => c.phone_e164 === canonicalPhone && (aliases.has(String(c.owner_id)) || String(c.owner_id) === String(ownerId))
  );

  if (!cust && autoCreate) {
    const cleanName = String(rawName || '').trim() || `Member ${getDisplayPhone(canonicalPhone)}`;
    cust = {
      id: `CUST-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      owner_id: String(ownerId),
      phone_e164: canonicalPhone,
      phone_display: getDisplayPhone(canonicalPhone),
      name: cleanName,
      created_at: new Date().toISOString()
    };
    db.loyalty_customers.push(cust);
  } else if (cust && rawName && String(rawName).trim() && String(cust.name || '').startsWith('Member ')) {
    cust.name = String(rawName).trim();
  }

  return cust || null;
}

function getCustomerPoolWallet(db, customerId, loyaltyPoolId) {
  ensureLoyaltyCollections(db);
  if (!customerId || !loyaltyPoolId) return null;
  return db.loyalty_pool_balances.find(
    w => String(w.customer_id) === String(customerId) && String(w.loyalty_pool_id) === String(loyaltyPoolId)
  ) || null;
}

/**
 * Pure simulation + validation for Loyalty Pool points BEFORE checkout commit.
 */
function previewPoolCheckout(db, { merchant, customerPhone, customerName, redeemPoints = 0, grossSubtotalIdr = 0, otherDiscountIdr = 0 }) {
  ensureLoyaltyCollections(db);
  const profile = getStoreBillingProfile(db, merchant);
  const reqRedeem = Math.max(0, Math.floor(Number(redeemPoints) || 0));
  const netPrePoint = Math.max(0, Math.round((Number(grossSubtotalIdr) || 0) - (Number(otherDiscountIdr) || 0)));

  if (!profile.activePool) {
    if (reqRedeem > 0) {
      return {
        ok: false,
        status: 422,
        code: 'POIN_NOT_ACTIVE_ON_STORE',
        error: 'Toko ini belum terhubung ke Loyalty Pool manapun (Tier 1 Rp 25/nota). Penukaran poin tidak tersedia.'
      };
    }
    return {
      ok: true,
      billingTier: 'TIER_1_FLAT',
      billingFeeIdr: TIER_1_FEE_IDR,
      loyaltyPoolId: null,
      loyaltyPoolName: null,
      customer: null,
      currentPoolBalance: 0,
      pointsRedeemed: 0,
      pointDiscountIdr: 0,
      finalTotalIdr: netPrePoint,
      pointsEarned: 0,
      balanceAfter: 0,
      maxRedeemablePoints: 0
    };
  }

  const pool = profile.activePool;
  const ownerId = merchant?.ownerUserId || merchant?.posOwnerId || 'OWNER-DEFAULT';
  const canonicalPhone = normalizePhoneDigits(customerPhone);
  const customer = canonicalPhone
    ? findOrCreateLoyaltyCustomer(db, ownerId, canonicalPhone, customerName, false)
    : null;

  if (!canonicalPhone) {
    if (reqRedeem > 0) {
      return {
        ok: false,
        status: 400,
        code: 'CUSTOMER_PHONE_REQUIRED',
        error: 'Masukkan nomor HP/WhatsApp member untuk menukar poin Loyalty Pool.'
      };
    }
    // Guest checkout on Tier 2 store still pays Tier 2 billing fee (Rp 100/nota), 0 points
    return {
      ok: true,
      billingTier: 'TIER_2_LOYALTY',
      billingFeeIdr: TIER_2_FEE_IDR,
      loyaltyPoolId: pool.id,
      loyaltyPoolName: pool.name,
      customer: null,
      currentPoolBalance: 0,
      pointsRedeemed: 0,
      pointDiscountIdr: 0,
      finalTotalIdr: netPrePoint,
      pointsEarned: 0,
      balanceAfter: 0,
      maxRedeemablePoints: 0
    };
  }

  const wallet = customer ? getCustomerPoolWallet(db, customer.id, pool.id) : null;
  const currentBalance = Number(wallet?.balance_points || 0);
  const pointValueIdr = Math.max(1, Number(pool.point_value_idr) || 100);
  const minRedeem = Math.max(1, Number(pool.min_redeem_points) || 1);
  const maxRedeemPct = Math.min(100, Math.max(1, Number(pool.max_redeem_percent) || 100));
  const minSpendPerPt = Math.max(1, Number(pool.min_spend_per_point) || 10000);
  const ptsPerUnit = Math.max(1, Number(pool.points_per_unit) || 1);

  const maxAllowedDiscount = Math.floor((netPrePoint * maxRedeemPct) / 100);
  const maxByOrderCap = Math.floor(maxAllowedDiscount / pointValueIdr);
  const maxRedeemablePoints = Math.min(currentBalance, maxByOrderCap);

  if (reqRedeem > 0) {
    if (currentBalance < reqRedeem) {
      return {
        ok: false,
        status: 422,
        code: 'INSUFFICIENT_POINTS',
        error: `Saldo poin member di pool "${pool.name}" tidak cukup (saldo: ${currentBalance} poin, diminta: ${reqRedeem} poin).`
      };
    }
    if (reqRedeem < minRedeem) {
      return {
        ok: false,
        status: 422,
        code: 'BELOW_MIN_REDEEM',
        error: `Minimal penukaran di pool "${pool.name}" adalah ${minRedeem} poin.`
      };
    }
    if (reqRedeem > maxByOrderCap) {
      return {
        ok: false,
        status: 422,
        code: 'EXCEEDS_MAX_REDEEM_CAP',
        error: `Maksimal penukaran untuk transaksi ini adalah ${maxByOrderCap} poin (${maxRedeemPct}% dari total belanja).`
      };
    }
  }

  const pointDiscountIdr = reqRedeem * pointValueIdr;
  const finalTotalIdr = Math.max(0, netPrePoint - pointDiscountIdr);
  // Anti-point-looping: earn computed strictly from actual paid net spend
  const pointsEarned = Math.floor(finalTotalIdr / minSpendPerPt) * ptsPerUnit;
  const balanceAfter = Math.max(0, currentBalance - reqRedeem + pointsEarned);

  return {
    ok: true,
    billingTier: 'TIER_2_LOYALTY',
    billingFeeIdr: TIER_2_FEE_IDR,
    loyaltyPoolId: pool.id,
    loyaltyPoolName: pool.name,
    ruleSnapshot: {
      min_spend_per_point: minSpendPerPt,
      points_per_unit: ptsPerUnit,
      point_value_idr: pointValueIdr,
      min_redeem_points: minRedeem,
      max_redeem_percent: maxRedeemPct
    },
    customer,
    canonicalPhone,
    customerName: customer?.name || customerName || `Member ${getDisplayPhone(canonicalPhone)}`,
    currentPoolBalance: currentBalance,
    pointsRedeemed: reqRedeem,
    pointDiscountIdr,
    finalTotalIdr,
    pointsEarned,
    balanceAfter,
    maxRedeemablePoints
  };
}

/**
 * Commits REDEEM + EARN mutations atomically to customer_points & point_transactions with store_id attribution.
 */
function commitPoolCheckoutLoyalty(
  db,
  {
    merchant,
    orderId,
    invoiceNumber,
    customerPhone,
    customerName,
    redeemPoints = 0,
    grossSubtotalIdr = 0,
    otherDiscountIdr = 0
  }
) {
  const sim = previewPoolCheckout(db, {
    merchant,
    customerPhone,
    customerName,
    redeemPoints,
    grossSubtotalIdr,
    otherDiscountIdr
  });
  if (!sim.ok) return sim;
  if (!sim.loyaltyPoolId || !sim.canonicalPhone) {
    return sim;
  }

  const ownerId = merchant?.ownerUserId || merchant?.posOwnerId || 'OWNER-DEFAULT';
  const customer = findOrCreateLoyaltyCustomer(db, ownerId, sim.canonicalPhone, sim.customerName, true);
  let wallet = getCustomerPoolWallet(db, customer.id, sim.loyaltyPoolId);
  const nowIso = new Date().toISOString();

  if (!wallet) {
    wallet = {
      id: `WAL-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      owner_id: String(ownerId),
      customer_id: customer.id,
      loyalty_pool_id: sim.loyaltyPoolId,
      customer_phone: customer.phone_e164,
      customer_phone_display: customer.phone_display,
      customer_name: customer.name,
      balance_points: 0,
      lifetime_earned: 0,
      lifetime_redeemed: 0,
      updated_at: nowIso
    };
    db.loyalty_pool_balances.push(wallet);
  }

  if (sim.pointsRedeemed > 0) {
    wallet.balance_points = Math.max(0, Number(wallet.balance_points) - sim.pointsRedeemed);
    wallet.lifetime_redeemed = Number(wallet.lifetime_redeemed || 0) + sim.pointsRedeemed;
    wallet.updated_at = nowIso;
    db.point_transactions.unshift({
      id: `PTX-RED-${Date.now()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      owner_id: String(ownerId),
      loyalty_pool_id: sim.loyaltyPoolId,
      loyalty_pool_name: sim.loyaltyPoolName,
      store_id: String(merchant.id),
      store_name: merchant.name || 'Toko POS',
      customer_id: customer.id,
      customer_phone: customer.phone_display,
      customer_name: customer.name,
      order_id: orderId,
      invoice_number: invoiceNumber,
      tx_type: 'REDEEM',
      points_delta: -sim.pointsRedeemed,
      balance_after: wallet.balance_points,
      idr_amount: sim.pointDiscountIdr,
      rule_snapshot: sim.ruleSnapshot,
      created_at: nowIso
    });
  }

  if (sim.pointsEarned > 0) {
    wallet.balance_points = Number(wallet.balance_points || 0) + sim.pointsEarned;
    wallet.lifetime_earned = Number(wallet.lifetime_earned || 0) + sim.pointsEarned;
    wallet.updated_at = nowIso;
    db.point_transactions.unshift({
      id: `PTX-ERN-${Date.now()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      owner_id: String(ownerId),
      loyalty_pool_id: sim.loyaltyPoolId,
      loyalty_pool_name: sim.loyaltyPoolName,
      store_id: String(merchant.id),
      store_name: merchant.name || 'Toko POS',
      customer_id: customer.id,
      customer_phone: customer.phone_display,
      customer_name: customer.name,
      order_id: orderId,
      invoice_number: invoiceNumber,
      tx_type: 'EARN',
      points_delta: sim.pointsEarned,
      balance_after: wallet.balance_points,
      idr_amount: sim.finalTotalIdr,
      rule_snapshot: sim.ruleSnapshot,
      created_at: nowIso
    });
  }

  return {
    ...sim,
    customer,
    balanceAfter: wallet.balance_points
  };
}

/**
 * Reverses EARN and REDEEM points inside the exact snapshot pool_id when an order is rejected/voided.
 */
function reverseOrderPoolPoints(db, order) {
  if (!order || !order.loyalty_pool_id || !order.loyalty_customer_id) return null;
  if (order.poolPointsReversed) return null;
  ensureLoyaltyCollections(db);

  const wallet = getCustomerPoolWallet(db, order.loyalty_customer_id, order.loyalty_pool_id);
  if (!wallet) return null;

  const earned = Number(order.pointsEarned || 0);
  const redeemed = Number(order.pointsRedeemed || 0);
  const delta = redeemed - earned;
  if (delta === 0) return null;

  const nowIso = new Date().toISOString();
  wallet.balance_points = Math.max(0, Number(wallet.balance_points || 0) + delta);
  if (redeemed > 0) wallet.lifetime_redeemed = Math.max(0, Number(wallet.lifetime_redeemed || 0) - redeemed);
  if (earned > 0) wallet.lifetime_earned = Math.max(0, Number(wallet.lifetime_earned || 0) - earned);
  wallet.updated_at = nowIso;

  db.point_transactions.unshift({
    id: `PTX-REV-${Date.now()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
    owner_id: String(wallet.owner_id),
    loyalty_pool_id: String(order.loyalty_pool_id),
    loyalty_pool_name: order.loyaltyPoolName || '',
    store_id: String(order.storeId),
    store_name: order.storeName || 'Toko POS',
    customer_id: String(order.loyalty_customer_id),
    customer_phone: order.customerPhone || wallet.customer_phone_display,
    customer_name: order.customerName || wallet.customer_name,
    order_id: order.id,
    invoice_number: order.invoice_number || order.invoice || order.id,
    tx_type: 'VOID_REVERSAL',
    points_delta: delta,
    balance_after: wallet.balance_points,
    idr_amount: Number(order.pointDiscountIdr || 0),
    rule_snapshot: null,
    created_at: nowIso
  });

  order.poolPointsReversed = true;
  return wallet.balance_points;
}

/**
 * Single atomic billing deduction per order (Rp 25 Tier 1 vs Rp 100 Tier 2).
 * Prevents double-deduction across /orders + /pay + /confirm-payment.
 */
function deductStoreNotaFeeOnce(db, merchant, order, { channel = 'POS Kasir', forceCharge = false } = {}) {
  ensureLoyaltyCollections(db);
  if (!merchant) {
    return { ok: false, status: 404, error: 'Toko POS tidak ditemukan.' };
  }

  if (merchant.saldoNota === undefined) merchant.saldoNota = 5000;
  const profile = getStoreBillingProfile(db, merchant);
  const fee = profile.notaFeeIdr;
  const currentSaldo = Number(merchant.saldoNota) || 0;

  if (order?.notaDeducted && !forceCharge) {
    return {
      ok: true,
      alreadyDeducted: true,
      feeDeducted: Number(order.notaDeducted),
      billingTier: order.billing_tier || profile.billingTier,
      saldoAfter: currentSaldo,
      kuotaAfter: Math.max(0, Math.floor(currentSaldo / fee))
    };
  }

  if (currentSaldo < fee) {
    return {
      ok: false,
      status: 402,
      requiresTopupNota: true,
      error: `Saldo nota toko tidak mencukupi (sisa Rp ${currentSaldo.toLocaleString('id-ID')}, dibutuhkan Rp ${fee.toLocaleString('id-ID')} untuk ${profile.billingTier === 'TIER_2_LOYALTY' ? 'Tier 2 Poin' : 'Tier 1 Flat'}). Silakan top up saldo nota terlebih dahulu.`,
      currentSaldoNota: currentSaldo,
      neededNota: fee,
      billingTier: profile.billingTier
    };
  }

  const nextSaldo = Math.max(0, currentSaldo - fee);
  const nextKuota = Math.max(0, Math.floor(nextSaldo / fee));
  const nowIso = new Date().toISOString();

  merchant.saldoNota = nextSaldo;
  merchant.kuotaNota = nextKuota;
  merchant.notaHistory = merchant.notaHistory || [];
  merchant.notaHistory.unshift({
    id: `NOTADED-${Date.now()}-${Math.floor(10 + Math.random() * 89)}`,
    type: 'DEDUCT',
    amount: fee,
    billingTier: profile.billingTier,
    loyaltyPoolId: profile.loyaltyPoolId,
    channel,
    description: `Potongan 1 nota ${profile.billingTier === 'TIER_2_LOYALTY' ? `Tier 2 Loyalty (${profile.loyaltyPoolName}, Rp 100)` : 'Tier 1 Flat (Tanpa Poin, Rp 25)'} #${order?.invoice_number || order?.id || ''}`,
    saldoAfter: nextSaldo,
    orderId: order?.id || null,
    createdAt: nowIso
  });

  db.nota_billing_ledger.unshift({
    id: `NBL-${Date.now()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
    store_id: String(merchant.id),
    store_name: merchant.name || 'Toko POS',
    order_id: order?.id || null,
    invoice_number: order?.invoice_number || order?.invoice || null,
    loyalty_pool_id: profile.loyaltyPoolId,
    loyalty_pool_name: profile.loyaltyPoolName,
    billing_tier: profile.billingTier,
    entry_type: profile.billingTier === 'TIER_2_LOYALTY' ? 'NOTA_TIER_2' : 'NOTA_TIER_1',
    amount_idr: -fee,
    balance_after: nextSaldo,
    channel,
    created_at: nowIso
  });

  db.merchant_wallets = db.merchant_wallets || {};
  const mWallet = db.merchant_wallets[merchant.id] || {
    merchant_id: merchant.id,
    available_balance: currentSaldo,
    held_promo_balance: 0,
    updated_at: nowIso
  };
  mWallet.available_balance = nextSaldo;
  if (profile.billingTier === 'TIER_2_LOYALTY') {
    mWallet.held_promo_balance = Number(mWallet.held_promo_balance || 0) + 60;
  }
  mWallet.updated_at = nowIso;
  db.merchant_wallets[merchant.id] = mWallet;

  if (db.settings?.posStore && String(db.settings.posStore.merchantId || db.settings.posStore.uid) === String(merchant.id)) {
    db.settings.posStore.saldoNota = nextSaldo;
    db.settings.posStore.kuotaNota = nextKuota;
    db.settings.posStore.billingTier = profile.billingTier;
    db.settings.posStore.notaFeePerNotaIdr = fee;
    db.settings.posStore.loyaltyPoolId = profile.loyaltyPoolId;
    db.settings.posStore.loyaltyPoolName = profile.loyaltyPoolName;
  }

  if (order) {
    order.notaDeducted = fee;
    order.billing_tier = profile.billingTier;
    order.billing_fee_idr = fee;
    order.loyalty_pool_id = profile.loyaltyPoolId;
    order.loyaltyPoolName = profile.loyaltyPoolName;
  }

  return {
    ok: true,
    alreadyDeducted: false,
    feeDeducted: fee,
    billingTier: profile.billingTier,
    loyaltyPoolId: profile.loyaltyPoolId,
    loyaltyPoolName: profile.loyaltyPoolName,
    saldoAfter: nextSaldo,
    kuotaAfter: nextKuota
  };
}

function computeDeterministicReferralCode(userId) {
  const uid = String(userId || 'usr-1');
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash) + uid.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = Math.abs(hash % 9000) + 1000;
  return `KOSTKU-${codeNum}`;
}

function getUserReferralCode(user) {
  if (!user) return '';
  const raw = String(user.referralCode || '').trim().toUpperCase();
  const isBlockedLegacy = !raw || raw.includes('OSCAR') || raw.includes('122') || raw.includes('ANAKKOST') || raw === 'KOSTKU-DEMO' || raw === 'KOSTKU-XXXX';
  if (!isBlockedLegacy) {
    return raw;
  }
  return computeDeterministicReferralCode(user.id);
}

/**
 * Validates that a referral code belongs to a real registered KostKu account
 * and blocks self-referral across user ID, own referral code, phone, and email.
 */
function resolveStrictReferralCandidate(db, {
  referralCode,
  applicantUserId = null,
  applicantUser = null,
  extraPhone = '',
  extraEmail = '',
  allowSelf = false
} = {}) {
  const cleanCode = String(referralCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { ok: false, reason: 'EMPTY_CODE', message: 'Kode referral kosong.' };
  }

  const invalidSamples = new Set(['KOSTKU-DEMO', 'KOSTKU-XXXX', 'ANAKKOST123', 'PROMO', 'GRATIS']);
  if (invalidSamples.has(cleanCode) || cleanCode.includes('OSCAR')) {
    return {
      ok: false,
      reason: 'INVALID_CODE',
      message: `Kode referral "${cleanCode}" tidak valid. Gunakan Kode Referral KostKu asli milik akun terdaftar.`
    };
  }

  const users = Array.isArray(db?.users) ? db.users : [];
  let referrerUser = users.find((u) => {
    if (!u) return false;
    const explicit = String(u.referralCode || '').trim().toUpperCase();
    if (explicit && explicit === cleanCode) return true;
    return cleanCode.startsWith('KOSTKU-') && computeDeterministicReferralCode(u.id) === cleanCode;
  }) || null;

  let referrerCustomer = null;
  if (!referrerUser && db?.customers && typeof db.customers === 'object') {
    referrerCustomer = Object.values(db.customers).find(
      (c) => c && c.referral_code && String(c.referral_code).trim().toUpperCase() === cleanCode
    ) || null;
    if (referrerCustomer?.whatsapp_number) {
      const custDigits = normalizePhoneDigits(referrerCustomer.whatsapp_number);
      if (custDigits) {
        referrerUser = users.find(
          (u) => normalizePhoneDigits(u?.phone || u?.whatsapp || u?.whatsapp_number) === custDigits
        ) || null;
      }
    }
  }

  if (!referrerUser && !referrerCustomer) {
    return {
      ok: false,
      reason: 'INVALID_CODE',
      message: `Kode referral "${cleanCode}" tidak ditemukan. Pastikan kode referral terdaftar pada akun KostKu aktif.`
    };
  }

  const resolvedApplicant = applicantUser || (applicantUserId ? users.find((u) => String(u.id) === String(applicantUserId)) : null);
  const referrerPhones = [
    referrerUser?.phone,
    referrerUser?.whatsapp,
    referrerUser?.whatsapp_number,
    referrerCustomer?.whatsapp_number
  ].map(normalizePhoneDigits).filter((p) => p.length >= 8);

  const applicantPhones = [
    resolvedApplicant?.phone,
    resolvedApplicant?.whatsapp,
    resolvedApplicant?.whatsapp_number,
    extraPhone
  ].map(normalizePhoneDigits).filter((p) => p.length >= 8);

  const referrerEmail = String(referrerUser?.email || '').trim().toLowerCase();
  const applicantEmails = [
    resolvedApplicant?.email,
    extraEmail
  ].map((e) => String(e || '').trim().toLowerCase()).filter(Boolean);

  const sameId = Boolean(applicantUserId && referrerUser && String(referrerUser.id) === String(applicantUserId));
  const sameOwnCode = Boolean(resolvedApplicant && getUserReferralCode(resolvedApplicant) === cleanCode);
  const samePhone = referrerPhones.some((rp) => applicantPhones.includes(rp));
  const sameEmail = Boolean(referrerEmail && applicantEmails.includes(referrerEmail));
  const isSelfReferral = sameId || sameOwnCode || samePhone || sameEmail;

  if (!allowSelf && isSelfReferral) {
    return {
      ok: false,
      reason: 'SELF_REFERRAL_BLOCKED',
      isSelfReferral: true,
      referrerUser,
      referrerCustomer,
      code: cleanCode,
      message: 'Kode referral akun sendiri / identitas yang sama tidak dapat diklaim (anti-abuse self-referral).'
    };
  }

  return {
    ok: true,
    isSelfReferral,
    code: cleanCode,
    referrerUser,
    referrerCustomer
  };
}

module.exports = {
  TIER_1_FEE_IDR,
  TIER_2_FEE_IDR,
  normalizePhoneDigits,
  getDisplayPhone,
  computeDeterministicReferralCode,
  getUserReferralCode,
  resolveStrictReferralCandidate,
  ensureLoyaltyCollections,
  buildAuthorizedOwnerAliasSet,
  doesOwnerOwnMerchant,
  doesOwnerOwnPool,
  getStoreBillingProfile,
  findOrCreateLoyaltyCustomer,
  getCustomerPoolWallet,
  previewPoolCheckout,
  commitPoolCheckoutLoyalty,
  reverseOrderPoolPoints,
  deductStoreNotaFeeOnce
};
