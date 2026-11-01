// scripts/run-all-security-tests.mjs
// Master Runner: RCE Security Tests + Concurrency Stress Tests + Random Fuzzing

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`\n======================================================`);
console.log(`🛡️  KOSTKU FULL SUITE: SECURITY, STRESS & FUZZING`);
console.log(`======================================================\n`);

const testSuites = [
  { name: '1. RCE & Prototype Pollution Security Suite', file: 'test-rce-security.mjs' },
  { name: '2. High-Concurrency Stress Test Suite', file: 'test-concurrency-stress.mjs' },
  { name: '3. 1,000-Payload Random Fuzzing Suite', file: 'test-random-fuzz.mjs' }
];

let allPassed = true;

for (const suite of testSuites) {
  console.log(`\n>>> EXECUTING: ${suite.name} ...\n`);
  const res = spawnSync('node', [path.join(__dirname, suite.file)], {
    stdio: 'inherit'
  });
  if (res.status !== 0) {
    allPassed = false;
    console.error(`\n❌ FAILED: ${suite.name} exited with status ${res.status}`);
    break;
  }
}

console.log(`\n======================================================`);
if (allPassed) {
  console.log(`🎉 ALL SECURITY, STRESS, AND RANDOM FUZZ TESTS PASSED (100%)!`);
  console.log(`KostKu is fully hardened against RCE, prototype pollution, path traversal, and high-concurrency loads.`);
  console.log(`======================================================\n`);
  process.exit(0);
} else {
  console.error(`❌ ONE OR MORE SUITES FAILED.`);
  console.log(`======================================================\n`);
  process.exit(1);
}
