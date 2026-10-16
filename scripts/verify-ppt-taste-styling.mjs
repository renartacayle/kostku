import fs from 'fs';
import path from 'path';

const pptPath = path.resolve('docs/PPT_SKPL_KOSTKU.md');

if (!fs.existsSync(pptPath)) {
  console.error('FAIL: docs/PPT_SKPL_KOSTKU.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(pptPath, 'utf8');

const stylingTokens = [
  'marp: true',
  'Plus Jakarta Sans',
  '1e3a8a',
  'badge',
  'bento'
];

for (const t of stylingTokens) {
  if (!content.toLowerCase().includes(t.toLowerCase())) {
    console.error(`FAIL: Missing Taste-Skill styling token: "${t}"`);
    process.exit(1);
  }
}

console.log('ppt taste styling verification passed');
process.exit(0);
