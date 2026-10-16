import fs from 'fs';
import path from 'path';

const genPath = path.resolve('scripts/generate_pptx.py');

if (!fs.existsSync(genPath)) {
  console.error('FAIL: scripts/generate_pptx.py does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(genPath, 'utf8');

const requiredKeywords = [
  'pptx',
  'Presentation',
  'slide_width',
  'slide_height',
  'add_slide',
  'add_shape',
  'Inches',
  'Pt',
  'RGBColor'
];

for (const kw of requiredKeywords) {
  if (!content.includes(kw)) {
    console.error(`FAIL: Missing required keyword "${kw}" in generate_pptx.py`);
    process.exit(1);
  }
}

console.log('pptx generator script verification passed');
process.exit(0);
