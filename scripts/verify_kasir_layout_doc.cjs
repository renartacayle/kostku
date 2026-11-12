const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DOC_PATH = path.join(__dirname, '../docs/LAYOUT_KASIR_MOBILE_DESKTOP.md');

console.log('🔍 Checking Kasir Layout Documentation File...');
assert(fs.existsSync(DOC_PATH), `Documentation file does not exist at ${DOC_PATH}`);

const content = fs.readFileSync(DOC_PATH, 'utf8');

// Verify Essential Sections
const requiredSections = [
  '# BLUEPRINT & ARSITEKTUR LAYOUT KASIR POS KOSTKU (MOBILE & DESKTOP)',
  '## 1. EXECUTIVE SUMMARY & FILOSOFI RANCANG BANGUN',
  '## 2. BREAKPOINT & RESPONSIVE BEHAVIOR MATRIX',
  '## 3. WIREFRAME & TATA LETAK DESKTOP (> 900PX)',
  '## 4. WIREFRAME & TATA LETAK MOBILE (<= 900PX)',
  '## 5. BEDAH HIERARKI KOMPONEN LAYER-BY-LAYER',
  '## 6. INTEGRASI HARDWARE: LACI KASIR (RJ11) & PRINTER THERMAL',
  '## 7. SISTEM WARNA, ELEVASI, & Z-INDEX TOKENS',
  '## 8. ERGONOMI MOBILE THUMB-ZONE & AKSESIBILITAS WCAG',
  '## 9. DIAGRAM ALUR INTERAKSI TRANSAKSI POS (MERMAID)'
];

requiredSections.forEach(section => {
  assert(content.includes(section), `Missing required section: "${section}"`);
});

// Verify Detail & Zero-Shortcuts
assert(content.length > 5000, `Documentation content is too short (${content.length} chars), needs full unlazy detail`);
assert(!content.includes('// TODO'), 'Zero-shortcut violation: found "// TODO"');
assert(!content.includes('/* implement later */'), 'Zero-shortcut violation: found "implement later"');
assert(content.includes('ESC/POS'), 'Must document ESC/POS hardware kick pulse');
assert(content.includes('\\x1b\\x70\\x00'), 'Must document exact drawer pulse hex command');
assert(content.includes('repeat(auto-fit, minmax(320px, 1fr))'), 'Must document CSS grid specification');
assert(content.includes('desktop-only'), 'Must document desktop CSS viewport classes');
assert(content.includes('showMobileCartDrawer'), 'Must document mobile drawer state');

console.log('✅ Kasir Layout Documentation verified successfully with zero shortcuts!');
console.log(`📊 Total Word Count: ${content.split(/\s+/).length} words (${content.length} bytes)`);
