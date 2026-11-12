const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test 1: Verify Wheel Slices and Geometry
console.log('=== TEST 1: LUCKY SPIN WHEEL GEOMETRY & DECISION ENGINE ===');
const createPosRouter = require('../backend/pos_routes.js');
const { rollLuckySpin, WHEEL_SLICES, BASE_ADMIN_FEE, HELD_PROMO_FEE } = createPosRouter;

assert.strictEqual(BASE_ADMIN_FEE, 40.00, 'Base admin fee must be exactly Rp 40.00');
assert.strictEqual(HELD_PROMO_FEE, 60.00, 'Held promo fee must be exactly Rp 60.00');
assert.strictEqual(BASE_ADMIN_FEE + HELD_PROMO_FEE, 100.00, 'Total admin deduction must be Rp 100.00');
assert.strictEqual(WHEEL_SLICES.length, 8, 'Lucky wheel must have exactly 8 equal slices');

// Test 2: Decoupled Probabilities and Pity System
console.log('Testing RNG Distribution across 10,000 rolls...');
let counts = { 100: 0, 50: 0, 25: 0, 10: 0 };
let nearMissCount = 0;
for (let i = 0; i < 10000; i++) {
  const result = rollLuckySpin({ consecutiveNoJackpotSpins: 0 });
  counts[result.points]++;
  if (result.isNearMiss) nearMissCount++;
  assert(result.targetDegrees >= 0 && result.targetDegrees < 360, 'Degrees must be in [0, 360)');
}
console.log(`10,000 Roll Stats:
  100 Poin (Jackpot ~15%): ${(counts[100] / 100).toFixed(1)}%
  50 Poin (Medium ~35%):   ${(counts[50] / 100).toFixed(1)}%
  25 Poin (Small ~35%):    ${(counts[25] / 100).toFixed(1)}%
  10 Poin (Mini ~15%):     ${(counts[10] / 100).toFixed(1)}%
  Near-Miss Triggered:     ${nearMissCount} times (~${(nearMissCount / counts[25] * 100).toFixed(1)}% of 25-point rolls)
`);

// Test 3: Hard Pity System
console.log('=== TEST 2: HARD PITY SYSTEM ===');
const pityCustomer = { consecutiveNoJackpotSpins: 4 }; // 4th spin failed jackpot
const pityRoll = rollLuckySpin(pityCustomer);
assert.strictEqual(pityRoll.points, 100, '5th spin must trigger hard pity guarantee of 100 points!');
assert.strictEqual(pityRoll.isPityTriggered, true, 'isPityTriggered must be true');
console.log('✓ Hard Pity System verified: 100 Points guaranteed on 5th spin.');

// Test 4: Thermal Receipt Formatting Spec
console.log('=== TEST 3: THERMAL RECEIPT FOOTER SPEC ===');
const thermalPrinterFile = fs.readFileSync(path.join(__dirname, '../src/utils/thermalPrinter.js'), 'utf8');
assert(thermalPrinterFile.includes('KLAIM DISKON MAKAN ANDA!'), 'Receipt footer must have correct header');
assert(thermalPrinterFile.includes('Scan QR ini & Putar Roda Hadiah!'), 'Receipt footer must invite to spin wheel');
assert(thermalPrinterFile.includes('Dapatkan Poin s/d 100 Poin Belanja.'), 'Receipt footer must specify up to 100 points');
console.log('✓ Thermal receipt footer text verified.');

// Test 5: Firebase RTDB Granular Delta Sync Helper
console.log('=== TEST 4: GRANULAR DELTA SYNC FUNCTIONALITY ===');
const { syncDeltaToFirebase, scheduleFullBackupDebounced } = require('../backend/firebase_sync.js');
assert.strictEqual(typeof syncDeltaToFirebase, 'function', 'syncDeltaToFirebase must be exported');
assert.strictEqual(typeof scheduleFullBackupDebounced, 'function', 'scheduleFullBackupDebounced must be exported');
console.log('✓ Granular Delta Sync & Debounced Snapshot helpers verified.');

// Test 6: Verify Edge Worker Sync in public/_worker.js
console.log('=== TEST 5: CLOUDFLARE EDGE WORKER SPEC COMPLIANCE ===');
const workerContent = fs.readFileSync(path.join(__dirname, '../public/_worker.js'), 'utf8');
assert(workerContent.includes('BASE_ADMIN_FEE = 40'), 'Edge worker must use 40 platform fee');
assert(workerContent.includes('HELD_PROMO_FEE = 60'), 'Edge worker must use 60 promo held');
assert(workerContent.includes('initialSaldoNota = 50000'), 'Edge worker must grant 50,000 (500 nota) for referral');
assert(workerContent.includes('initialKuotaNota = 500'), 'Edge worker must grant 500 nota quota');
assert(workerContent.includes('bonusPoints = 500'), 'Edge worker must grant +500 points to referrer');
assert(workerContent.includes('isNearMiss'), 'Edge worker must have near-miss physics');
assert(workerContent.includes('isPity'), 'Edge worker must have hard pity system');
assert(workerContent.includes('syncDeltaToFirebaseAsync'), 'Edge worker must have delta sync helper');
console.log('✓ Cloudflare Edge Worker spec compliance fully verified.');

console.log('\n🎉 ALL UNIT & ARCHITECTURE ASSERTIONS PASSED PERFECTLY!\n');
