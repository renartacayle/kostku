import fs from 'fs';
import path from 'path';

const diagramsDir = path.resolve('docs/assets/diagrams');

const requiredDiagrams = [
  'architecture.png',
  'context_diagram.png',
  'dfd_level1.png',
  'dfd_level2_kamar.png',
  'dfd_level2_transaksi.png',
  'erd.png',
  'traceability_flow.png'
];

for (const d of requiredDiagrams) {
  const p = path.join(diagramsDir, d);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    console.error(`FAIL: Missing or empty diagram: ${d}`);
    process.exit(1);
  }
}

const docPath = path.resolve('docs/BLUEPRINT_KOSTKU.md');
if (fs.existsSync(docPath)) {
  const content = fs.readFileSync(docPath, 'utf8');
  const userFlowTokens = ['Alur Booking & QRIS', 'Alur Sundul Kost', 'Alur Mitra Afiliasi', 'Alur Utilitas'];
  for (const t of userFlowTokens) {
    if (!content.includes(t)) {
      console.error(`FAIL: Missing user flow: "${t}" in docs/BLUEPRINT_KOSTKU.md`);
      process.exit(1);
    }
  }
}

console.log('blueprint diagrams verification passed');
process.exit(0);
