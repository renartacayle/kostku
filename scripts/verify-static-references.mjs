import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let errors = [];

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match Lucide icon usage: <IconName size=... or <IconName color=...
  const tagMatches = content.matchAll(/<([A-Z][a-zA-Z0-9]+)\s+[^>]*\b(size|color)=/g);
  
  // Collect all imported names
  const importedNames = new Set();
  const importBlocks = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['\"][^'\"]+['\"]/g);
  for (const block of importBlocks) {
    const rawNames = block[1].split(',');
    rawNames.forEach(n => {
      const trimmed = n.trim();
      if (trimmed.includes(' as ')) {
        const parts = trimmed.split(' as ');
        importedNames.add(parts[1].trim());
      } else if (trimmed) {
        importedNames.add(trimmed);
      }
    });
  }

  // Default imports
  const defaultImports = content.matchAll(/import\s+([A-Za-z0-9_]+)\s+from/g);
  for (const imp of defaultImports) {
    importedNames.add(imp[1].trim());
  }

  for (const m of tagMatches) {
    const tagName = m[1];
    // Ignore native SVG or common non-lucide tags
    if (['svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'mesh', 'group', 'Canvas'].includes(tagName)) continue;
    if (!importedNames.has(tagName) && 
        !content.includes('const ' + tagName) && 
        !content.includes('function ' + tagName) && 
        !content.includes('class ' + tagName)) {
      errors.push(`${filePath}: missing import or declaration for <${tagName} />`);
    }
  }
});

if (errors.length > 0) {
  console.error('Static reference audit failed:');
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
}

console.log('static reference audit passed with zero errors');
process.exit(0);
