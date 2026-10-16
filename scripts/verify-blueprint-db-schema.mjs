import fs from 'fs';
import path from 'path';

const docPath = path.resolve('docs/BLUEPRINT_KOSTKU.md');

if (!fs.existsSync(docPath)) {
  console.error('FAIL: docs/BLUEPRINT_KOSTKU.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(docPath, 'utf8');

const requiredEntities = [
  'USERS',
  'KOSTS',
  'ROOMS',
  'APPLICATIONS',
  'INVOICES',
  'COMPLAINTS',
  'MERCHANTS',
  'PARTNER_ORDERS',
  'ACTIVITIES'
];

for (const ent of requiredEntities) {
  const pattern = new RegExp(`###\\s*.*${ent}`, 'i');
  if (!pattern.test(content)) {
    console.error(`FAIL: Missing entity schema documentation for: "${ent}"`);
    process.exit(1);
  }
}

console.log('blueprint database schema verification passed');
process.exit(0);
