import fs from 'fs';
import path from 'path';

const pptPath = path.resolve('docs/PPT_SKPL_KOSTKU.md');

if (!fs.existsSync(pptPath)) {
  console.error('FAIL: docs/PPT_SKPL_KOSTKU.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(pptPath, 'utf8');

// Count slides delimited by \n---\n
// If starts with frontmatter --- ... ---, handle it
let cleanContent = content;
if (cleanContent.startsWith('---')) {
  const secondDash = cleanContent.indexOf('\n---', 3);
  if (secondDash !== -1) {
    cleanContent = cleanContent.slice(secondDash + 4);
  }
}

const slides = cleanContent.split(/\n---\s*\n/).filter(s => s.trim().length > 0);
const count = slides.length + 1; // plus the first slide

console.log(`Found ${count} slides.`);

if (count < 15 || count > 20) {
  console.error(`FAIL: Slide count must be between 15 and 20 slides, found ${count}.`);
  process.exit(1);
}

console.log('ppt slide count verification passed');
process.exit(0);
