import fs from 'fs';
import path from 'path';

const enginePath = path.resolve('scripts/generate_ppt_deck.mjs');

if (!fs.existsSync(enginePath)) {
  console.error('FAIL: scripts/generate_ppt_deck.mjs does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(enginePath, 'utf8');

const engineKeywords = [
  'ArrowRight',
  'ArrowLeft',
  'currentSlide',
  'showSlide',
  'docs/PPT_SKPL_KOSTKU.md'
];

for (const kw of engineKeywords) {
  if (!content.includes(kw)) {
    console.error(`FAIL: Missing interactive engine feature: "${kw}" in generate_ppt_deck.mjs`);
    process.exit(1);
  }
}

console.log('ppt interactive engine verification passed');
process.exit(0);
