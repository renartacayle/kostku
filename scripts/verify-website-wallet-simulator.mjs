import fs from 'fs';
import path from 'path';

const blueprintPath = path.resolve('src/pages/BlueprintHub.jsx');

if (!fs.existsSync(blueprintPath)) {
  console.error('FAIL: src/pages/BlueprintHub.jsx does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(blueprintPath, 'utf8');

// Verify simulation logic and UI hooks
const requiredSimMechanics = [
  'owner_commission_balance',
  'mitra_escrow_balance',
  '-15000',
  '500',
  'QRIS',
  'COD',
  'reset',
  'base_price_mitra',
  'owner_markup_fee'
];

for (const mech of requiredSimMechanics) {
  if (!content.includes(mech)) {
    console.error(`FAIL: BlueprintHub.jsx does not contain wallet simulation logic for "${mech}".`);
    process.exit(1);
  }
}

console.log('website wallet simulator verification passed');
process.exit(0);
