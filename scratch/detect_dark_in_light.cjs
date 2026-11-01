const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const routes = [
    { name: 'landing', url: 'http://localhost:5173/' },
    { name: 'login', url: 'http://localhost:5173/login' },
    { name: 'register', url: 'http://localhost:5173/register' },
    { name: 'owner_dashboard', url: 'http://localhost:5173/dashboard' },
    { name: 'penghuni', url: 'http://localhost:5173/penghuni' },
    { name: 'kamar', url: 'http://localhost:5173/kamar' },
    { name: 'keuangan', url: 'http://localhost:5173/keuangan' },
    { name: 'laporan', url: 'http://localhost:5173/laporan' },
    { name: 'mitra', url: 'http://localhost:5173/mitra' },
    { name: 'karyawan', url: 'http://localhost:5173/karyawan' },
    { name: 'pengaturan', url: 'http://localhost:5173/pengaturan' }
  ];

  const results = [];

  for (const r of routes) {
    try {
      await page.goto(r.url, { waitUntil: 'networkidle2', timeout: 10000 });
      await page.evaluate(() => {
        localStorage.setItem('kostku_theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.setAttribute('data-theme', 'light');
      });
      await new Promise(res => setTimeout(res, 800));

      const darkElements = await page.evaluate(() => {
        const issues = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          if (['SVG', 'PATH', 'IMG', 'SCRIPT', 'STYLE'].includes(el.tagName)) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width < 10 || rect.height < 10) continue;
          
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const bgImg = style.backgroundImage;
          
          // Check RGB of background color
          const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (match) {
            const red = parseInt(match[1], 10);
            const green = parseInt(match[2], 10);
            const blue = parseInt(match[3], 10);
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
            
            // Check if dark background
            if (a > 0.4 && red < 40 && green < 50 && blue < 65) {
              const textSnippet = (el.innerText || '').slice(0, 50).replace(/\n/g, ' ');
              issues.push({
                tag: el.tagName,
                id: el.id,
                className: (el.className || '').toString().slice(0, 40),
                bg,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                textSnippet
              });
            }
          }
          
          if (bgImg && (bgImg.includes('rgb(15, 23, 42)') || bgImg.includes('rgb(8, 13, 26)') || bgImg.includes('rgb(30, 41, 59)'))) {
            const textSnippet = (el.innerText || '').slice(0, 50).replace(/\n/g, ' ');
            issues.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className || '').toString().slice(0, 40),
              bgImg: bgImg.slice(0, 70),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              textSnippet
            });
          }
        }
        return issues;
      });

      const shotPath = `/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc/scan_light_${r.name}.png`;
      await page.screenshot({ path: shotPath, fullPage: true });

      results.push({
        route: r.name,
        darkElementsCount: darkElements.length,
        sampleIssues: darkElements.slice(0, 6)
      });
    } catch (err) {
      results.push({ route: r.name, error: err.message });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

run();
