const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const FRONTEND_PORT = 5180;
const BACKEND_PORT = 3001;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode < 500);
    }).on('error', () => resolve(false));
  });
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkUrl(url)) return true;
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

(async () => {
  let backendProcess = null;
  let viteProcess = null;

  try {
    const isBackendUp = await checkUrl(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
    if (!isBackendUp) {
      backendProcess = spawn('node', ['backend/server.js'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'ignore'
      });
      await waitForServer(`http://127.0.0.1:${BACKEND_PORT}/api/public/kosts`);
    }

    const isViteUp = await checkUrl(`http://localhost:${FRONTEND_PORT}/`);
    if (!isViteUp) {
      viteProcess = spawn('npx', ['vite', 'preview', '--port', String(FRONTEND_PORT), '--strictPort'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'ignore'
      });
      await waitForServer(`http://localhost:${FRONTEND_PORT}/`);
    }
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  const ownerUser = {
    id: "1790690000001",
    name: "Ibu Hj. Nurhayati",
    email: "owner@kostku.id",
    role: "owner",
    kostUid: "KOST-BDG-02",
    isDemo: false
  };

  const tenantUser = {
    id: 1790690895764,
    name: "Rian Pratama",
    email: "penghuni@kostku.id",
    role: "user",
    kamar: "102",
    kostUid: "KOST-BDG-02",
    isDemo: false
  };

  const testCases = [
    { name: 'Mobile Home', path: '/', viewport: { width: 390, height: 844 }, user: null },
    { name: 'Mobile Login', path: '/login', viewport: { width: 390, height: 844 }, user: null },
    { name: 'Mobile Tenant', path: '/dashboard', viewport: { width: 390, height: 844 }, user: tenantUser },
    { name: 'Mobile Owner', path: '/dashboard', viewport: { width: 390, height: 844 }, user: ownerUser },
    { name: 'Mobile Checkout', path: '/checkout', viewport: { width: 390, height: 844 }, user: null },
    { name: 'Tablet Search', path: '/search', viewport: { width: 820, height: 1180 }, user: null },
    { name: 'Tablet Dashboard', path: '/dashboard', viewport: { width: 820, height: 1180 }, user: ownerUser },
    { name: 'Tablet Keuangan', path: '/keuangan', viewport: { width: 820, height: 1180 }, user: ownerUser },
    { name: 'Desktop Landing', path: '/', viewport: { width: 1440, height: 900 }, user: null },
    { name: 'Desktop Owner', path: '/dashboard', viewport: { width: 1440, height: 900 }, user: ownerUser },
    { name: 'Desktop Keuangan', path: '/keuangan', viewport: { width: 1440, height: 900 }, user: ownerUser },
    { name: 'Desktop Checkout', path: '/checkout', viewport: { width: 1440, height: 900 }, user: null }
  ];

  console.log('🔍 Starting Comprehensive Overflow Diagnostics...\n');

  for (const tc of testCases) {
    await page.setViewport(tc.viewport);
    if (tc.user) {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(u => localStorage.setItem('kostUser', JSON.stringify(u)), tc.user);
    } else {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.clear());
    }

    await page.goto(`${BASE_URL}${tc.path}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const overflows = await page.evaluate((viewportWidth) => {
      const results = [];
      const docScrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      
      function isContainedInScrollTrack(node) {
        let parent = node.parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
          const style = window.getComputedStyle(parent);
          const pRect = parent.getBoundingClientRect();
          if ((style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden' || style.overflow === 'hidden') &&
              pRect.right <= viewportWidth + 2) {
            return true;
          }
          parent = parent.parentElement;
        }
        return false;
      }

      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // check if element extends past viewport width by more than 1.5px and is not contained in a valid scroll/hidden container
        if (rect.right > viewportWidth + 1.5 && !isContainedInScrollTrack(el)) {
          // find unique identifier
          let desc = el.tagName.toLowerCase();
          if (el.id) desc += `#${el.id}`;
          if (el.className && typeof el.className === 'string') desc += `.${el.className.trim().split(/\s+/).join('.')}`;
          const textSnippet = (el.innerText || el.textContent || '').trim().slice(0, 40);
          results.push({
            tag: desc,
            text: textSnippet,
            rectRight: Math.round(rect.right),
            width: Math.round(rect.width),
            overflowAmount: Math.round(rect.right - viewportWidth)
          });
        }
      }

      return {
        docScrollWidth,
        bodyScrollWidth,
        hasDocOverflow: docScrollWidth > viewportWidth,
        overflowingElements: results.slice(0, 15) // top 15
      };
    }, tc.viewport.width);

    if (overflows.hasDocOverflow || overflows.overflowingElements.length > 0) {
      console.log(`❌ [OVERFLOW DETECTED] ${tc.name} (${tc.viewport.width}x${tc.viewport.height})`);
      console.log(`   Document ScrollWidth: ${overflows.docScrollWidth}px (Viewport: ${tc.viewport.width}px -> OVERFLOW BY ${overflows.docScrollWidth - tc.viewport.width}px)`);
      console.log(`   Offending Elements (${overflows.overflowingElements.length} sample):`);
      for (const el of overflows.overflowingElements) {
        console.log(`     - <${el.tag}> (width: ${el.width}px, right: ${el.rectRight}px, +${el.overflowAmount}px) text: "${el.text}"`);
      }
    } else {
      console.log(`✅ [CLEAN] ${tc.name} (${tc.viewport.width}x${tc.viewport.height}) - ScrollWidth: ${overflows.docScrollWidth}px`);
    }
  }

    await browser.close();
    console.log('\nDiagnostics complete.');
  } finally {
    if (viteProcess) viteProcess.kill('SIGTERM');
    if (backendProcess) backendProcess.kill('SIGTERM');
  }
})();
