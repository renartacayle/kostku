import fs from 'fs';
import path from 'path';

const skplPath = path.resolve('docs/SKPL_KostKu.md');

if (!fs.existsSync(skplPath)) {
  console.error('FAIL: docs/SKPL_KostKu.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(skplPath, 'utf8');

// Check for Mermaid diagrams: Context, DFD 1, DFD 2, ERD
const diagramTokens = [
  'Diagram Konteks',
  'DFD Level 1',
  'DFD Level 2',
  'E-R diagram',
  '```mermaid'
];

for (const dt of diagramTokens) {
  if (!content.includes(dt)) {
    console.error(`FAIL: Missing diagram token: "${dt}"`);
    process.exit(1);
  }
}

// Ensure at least 4 mermaid diagrams exist
const mermaidCount = (content.match(/```mermaid/g) || []).length;
if (mermaidCount < 4) {
  console.error(`FAIL: Expected at least 4 Mermaid diagrams, found ${mermaidCount}.`);
  process.exit(1);
}

console.log('skpl diagrams and requirements verification passed');
process.exit(0);
