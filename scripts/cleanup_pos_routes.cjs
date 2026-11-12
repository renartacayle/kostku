const fs = require('fs');
const file = '/home/rena/.gemini/antigravity/scratch/kostku/backend/pos_routes.js';
let content = fs.readFileSync(file, 'utf8');

const target = `    // Normalize item isReady status
    if (db.pos_orders && Array.isArray(db.pos_orders)) {
      db.pos_orders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            if (typeof it.isReady !== 'boolean') it.isReady = false;
          });
        }
      });
    }`;

let count = 0;
content = content.replaceAll(target, () => {
  count++;
  if (count === 1) return target;
  return '';
});

fs.writeFileSync(file, content, 'utf8');
console.log('Cleaned up duplicates, kept only 1. Total occurrences were:', count);
