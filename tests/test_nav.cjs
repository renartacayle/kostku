const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/5e83a2a2-d5d9-4295-9341-ea6fca47602c';

async function testMobileTransition() {
  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: '/home/rena/.gemini/antigravity/scratch/kostku',
    stdio: 'pipe'
  });

  await new Promise(r => setTimeout(r, 2000));

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const framesDir = path.join(ARTIFACTS_DIR, 'nav_transition_frames');
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    await page.screenshot({ path: path.join(framesDir, 'frame_00.png') });

    // Evaluate clicking the 2nd tab ('Cari Kost')
    console.log('Clicking Cari Kost...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav.mobile-only a'));
      if (links[1]) links[1].click();
    });

    for (let i = 1; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 50));
      await page.screenshot({ path: path.join(framesDir, `frame_${i.toString().padStart(2, '0')}.png`) });
    }

    console.log('All transition frames captured!');
    await browser.close();
  } finally {
    server.kill();
  }
}

testMobileTransition().catch(console.error);
