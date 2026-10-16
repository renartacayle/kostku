import fs from 'fs';
import path from 'path';

const docPath = path.resolve('BLUEPRINT_SISTEM_KOST.md');

if (!fs.existsSync(docPath)) {
  console.error('FAIL: BLUEPRINT_SISTEM_KOST.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(docPath, 'utf8');

const requiredSections = [
  'GAMBARAN UMUM ARSITEKTUR & MODEL BISNIS',
  'ROLE PENGGUNA (USER ROLES)',
  'SKEMA DATABASE (CLOUD FIRESTORE)',
  'STEP-BY-STEP IMPLEMENTASI FITUR',
  'CHECKLIST HALAMAN UI'
];

for (const sec of requiredSections) {
  if (!content.includes(sec)) {
    console.error(`FAIL: Missing required section "${sec}" in BLUEPRINT_SISTEM_KOST.md`);
    process.exit(1);
  }
}

if (content.length < 8000) {
  console.error(`FAIL: Content too short (${content.length} chars, expected >= 8000).`);
  process.exit(1);
}

console.log('blueprint sistem kost doc verification passed');
process.exit(0);
