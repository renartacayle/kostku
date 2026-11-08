import fs from 'fs';
import path from 'path';

const bentoPath = path.resolve('src/components/SpatialBentoShowcase.jsx');

if (!fs.existsSync(bentoPath)) {
  console.error('FAIL: src/components/SpatialBentoShowcase.jsx does not exist.');
  process.exit(1);
}

const bentoContent = fs.readFileSync(bentoPath, 'utf8');

// Verify 3 tabs: Customer, Owner, Mitra
if (!bentoContent.includes("activeTab === 'customer'") || 
    !bentoContent.includes("activeTab === 'owner'") || 
    !bentoContent.includes("activeTab === 'mitra'")) {
  console.error('FAIL: SpatialBentoShowcase missing 3 active tabs.');
  process.exit(1);
}

// Verify CUSTOMER_SLIDES has 4 items
const customerMatch = bentoContent.match(/const CUSTOMER_SLIDES\s*=\s*\[([\s\S]*?)\];/);
if (!customerMatch) {
  console.error('FAIL: CUSTOMER_SLIDES not found.');
  process.exit(1);
}

// Verify OWNER_SLIDES has 4 items
const ownerMatch = bentoContent.match(/const OWNER_SLIDES\s*=\s*\[([\s\S]*?)\];/);
if (!ownerMatch) {
  console.error('FAIL: OWNER_SLIDES not found.');
  process.exit(1);
}

// Verify MITRA_SLIDES has 4 items
const mitraMatch = bentoContent.match(/const MITRA_SLIDES\s*=\s*\[([\s\S]*?)\];/);
if (!mitraMatch) {
  console.error('FAIL: MITRA_SLIDES not found.');
  process.exit(1);
}

// Verify zero KTP in SpatialBentoShowcase
if (bentoContent.toLowerCase().includes('ktp')) {
  console.error('FAIL: SpatialBentoShowcase still contains KTP.');
  process.exit(1);
}

console.log('spatial bento showcase tabs verification passed');
process.exit(0);
