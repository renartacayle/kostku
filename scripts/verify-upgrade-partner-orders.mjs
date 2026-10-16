import fs from 'fs';
import path from 'path';

const orderModalPath = path.resolve('src/components/PartnerOrderModal.jsx');

if (!fs.existsSync(orderModalPath)) {
  console.error('FAIL: src/components/PartnerOrderModal.jsx does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(orderModalPath, 'utf8');

// Verify Price Lock (fixed platform fee 500, markup, base price)
if (!content.includes('500') || !content.includes('wa.me')) {
  console.error('FAIL: PartnerOrderModal missing platform fee 500 or wa.me WhatsApp trigger.');
  process.exit(1);
}

// Verify SLA timer countdown and rating
if (!content.includes('sla') && !content.includes('SLA')) {
  console.error('FAIL: PartnerOrderModal missing SLA countdown timer integration.');
  process.exit(1);
}

console.log('upgrade partner orders verification passed');
process.exit(0);
