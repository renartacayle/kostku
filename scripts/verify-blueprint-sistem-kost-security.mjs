import fs from 'fs';
import path from 'path';

const docPath = path.resolve('BLUEPRINT_SISTEM_KOST.md');

if (!fs.existsSync(docPath)) {
  console.error('FAIL: BLUEPRINT_SISTEM_KOST.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(docPath, 'utf8');

const securityTokens = [
  'service firebase.storage',
  'ktp_uploads/{propertyId}/{tenantUid}.jpg',
  'request.auth.uid == tenantUid',
  'owner_uid == request.auth.uid',
  '^[0-9]{16}$'
];

for (const tok of securityTokens) {
  if (!content.includes(tok)) {
    console.error(`FAIL: Missing security rule token "${tok}" in BLUEPRINT_SISTEM_KOST.md`);
    process.exit(1);
  }
}

console.log('blueprint sistem kost security verification passed');
process.exit(0);
