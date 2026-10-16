import fs from 'fs';
import path from 'path';

const docPath = path.resolve('BLUEPRINT_SISTEM_KOST.md');

if (!fs.existsSync(docPath)) {
  console.error('FAIL: BLUEPRINT_SISTEM_KOST.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(docPath, 'utf8');

const requiredCollections = [
  'Collection: users',
  'Collection: properties',
  'Collection: mitra_umkm',
  'Collection: products',
  'Collection: orders'
];

for (const col of requiredCollections) {
  if (!content.includes(col)) {
    console.error(`FAIL: Missing collection header "${col}" in BLUEPRINT_SISTEM_KOST.md`);
    process.exit(1);
  }
}

const requiredFields = [
  'kyc_data',
  'nik',
  'ktp_image_url',
  'loyalty_points',
  'wallet',
  'owner_commission_balance',
  'mitra_escrow_balance',
  'overdraft_limit',
  'base_price_mitra',
  'platform_fee',
  'owner_markup_fee',
  'display_price_tenant',
  'sla_minutes',
  'order_status',
  'sla_deadline_at'
];

for (const field of requiredFields) {
  if (!content.includes(field)) {
    console.error(`FAIL: Missing required schema field "${field}" in BLUEPRINT_SISTEM_KOST.md`);
    process.exit(1);
  }
}

console.log('blueprint sistem kost schema verification passed');
process.exit(0);
