import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('   UNLAZY AUDIT FIXES VERIFICATION SUITE');
console.log('====================================================\n');

let failed = 0;
const assert = (condition, name, details = '') => {
  if (condition) {
    console.log(`  [PASS] ✓ ${name}`);
  } else {
    console.error(`  [FAIL] ✗ ${name} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
};

// ── TEST 1: Android Manifest Hardening ──
console.log('--- 1. ANDROID MANIFEST & NETWORK SECURITY ---');
const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
assert(manifestContent.includes('android:allowBackup="false"'), 'AndroidManifest: allowBackup is disabled');
assert(manifestContent.includes('android:usesCleartextTraffic="false"'), 'AndroidManifest: usesCleartextTraffic is disabled');

const netSecPath = path.join(rootDir, 'android/app/src/main/res/xml/network_security_config.xml');
const netSecContent = fs.readFileSync(netSecPath, 'utf8');
assert(netSecContent.includes('cleartextTrafficPermitted="false"'), 'NetworkSecurityConfig: cleartextTrafficPermitted is false');

// ── TEST 2: Frontend Code-Splitting in App.jsx ──
console.log('\n--- 2. FRONTEND CODE-SPLITTING & SUSPENSE ---');
const appJsxPath = path.join(rootDir, 'src/App.jsx');
const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
assert(appJsxContent.includes('import React, { useState, useEffect, Suspense, lazy }'), 'App.jsx: Suspense & lazy imported');
assert(appJsxContent.includes('const Dashboard = lazyRetry(') || appJsxContent.includes('const Dashboard = lazy('), 'App.jsx: Dashboard route is lazy loaded');
assert(appJsxContent.includes('const Mitra = lazyRetry(') || appJsxContent.includes('const Mitra = lazy('), 'App.jsx: Mitra route is lazy loaded');
assert(appJsxContent.includes('const Checkout = lazyRetry(') || appJsxContent.includes('const Checkout = lazy('), 'App.jsx: Checkout route is lazy loaded');
assert(appJsxContent.includes('const Keuangan = lazyRetry(') || appJsxContent.includes('const Keuangan = lazy('), 'App.jsx: Keuangan route is lazy loaded');
assert(appJsxContent.includes('<Suspense fallback={<PageLoadingFallback'), 'App.jsx: Routes wrapped in Suspense with fallback');

// ── TEST 3: Vite Build & Manual Chunks ──
console.log('\n--- 3. VITE MANUAL CHUNKS & BUNDLE SIZE ---');
const viteConfigPath = path.join(rootDir, 'vite.config.js');
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
assert(viteConfigContent.includes('manualChunks'), 'vite.config.js: manualChunks configured');
assert(viteConfigContent.includes('vendor-react'), 'vite.config.js: vendor-react chunk partitioned');
assert(viteConfigContent.includes('vendor-charts'), 'vite.config.js: vendor-charts chunk partitioned');

// Check build artifacts
const distAssetsDir = path.join(rootDir, 'dist/assets');
assert(fs.existsSync(distAssetsDir), 'dist/assets directory exists');
const distFiles = fs.readdirSync(distAssetsDir);
const mainIndexJs = distFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
assert(Boolean(mainIndexJs), `Found main index chunk: ${mainIndexJs}`);
if (mainIndexJs) {
  const indexStat = fs.statSync(path.join(distAssetsDir, mainIndexJs));
  const sizeKb = indexStat.size / 1024;
  assert(sizeKb < 400, `Main index bundle size is lightweight: ${sizeKb.toFixed(2)} KB (< 400 KB target, was 2342 KB)`);
}

// ── TEST 4: Backend Non-Blocking Atomic Persistence ──
console.log('\n--- 4. BACKEND ATOMIC ASYNC PERSISTENCE ---');
const serverJsPath = path.join(rootDir, 'backend/server.js');
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
assert(serverJsContent.includes('_scheduleAtomicWrite'), 'server.js: _scheduleAtomicWrite queue defined');
assert(serverJsContent.includes('fs.promises.writeFile'), 'server.js: Non-blocking fs.promises.writeFile utilized');
assert(serverJsContent.includes('fs.promises.rename'), 'server.js: Atomic file renaming for crash protection');

// ── TEST 5: Comprehensive Security & Concurrency Test ──
console.log('\n--- 5. REGRESSION & CONCURRENCY SUITE ---');
try {
  const testOut = execSync('npm test', { cwd: rootDir, encoding: 'utf8' });
  assert(testOut.includes('TEST SUMMARY: 22 PASSED, 0 FAILED'), 'npm test passed all 22/22 suites');
} catch (e) {
  assert(false, 'npm test execution failed', e.message);
}

console.log('\n====================================================');
if (failed === 0) {
  console.log('   ALL AUDIT FIXES VERIFIED SUCCESSFULLY (0 FAILURES)');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(`   VERIFICATION FAILED: ${failed} CHECKS FAILED`);
  console.log('====================================================');
  process.exit(1);
}
