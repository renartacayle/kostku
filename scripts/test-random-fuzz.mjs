// scripts/test-random-fuzz.mjs
// Automated 1,000+ Payload Random Fuzzing Test Suite for KostKu

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const TOTAL_FUZZ_ITERATIONS = 1000;
const BATCH_SIZE = 40;

console.log(`\n======================================================`);
console.log(`🎲  KOSTKU RANDOM FUZZING TEST SUITE`);
console.log(`Target     : ${BASE_URL}`);
console.log(`Iterations : ${TOTAL_FUZZ_ITERATIONS} randomized test vectors`);
console.log(`Batch Concurrency: ${BATCH_SIZE}`);
console.log(`======================================================\n`);

// Helper to generate deeply nested objects
function generateDeepObject(depth) {
  let root = { key: 'deep_leaf' };
  for (let i = 0; i < depth; i++) {
    root = { nested: root, depth: i };
  }
  return root;
}

// Helper to generate massive buffer string
function generateLongString(len) {
  return 'A'.repeat(len);
}

// Random Fuzz Payloads Library
const FUZZ_STRINGS = [
  // Malformed JSON fragments
  '{"unclosed": true,',
  '{"nested": {"broken": [1, 2, 3, ]}}',
  '{"nan": NaN, "inf": Infinity}',
  '<<<>>>{{{}}}[]]]',
  '',
  'null',
  'true',
  '1234567890',

  // Null bytes & control characters
  'test\0admin',
  'null%00byte',
  '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x0b\x0c\x0e\x0f',
  '\u0000\uFEFF\u200B\u200E\u200F', // Zero-width & RTL characters

  // Exotic unicode & emojis
  '🔥🚀🚨🎉'.repeat(50),
  '﷽'.repeat(30),
  'జ్ఞా'.repeat(40),
  'Z̵̢̛̞͈̦̖̘͖̦͙̙̤͕̗̈́͌̆̍͒͆͊̀̚ä̷̢̡̗̱̖̻̞̖̦̙́͌̆̍͒͆͊̀̚l̸̢̛̞͈̦̖̘͖̦͙̙̤͕̗̈́͌̆̍͒͆͊̀̚g̷̢̡̗̱̖̻̞̖̦̙̈́͌̆̍͒͆͊̀̚ơ̵̡̞͈̦̖̘͖̦͙̙̤͕̗̈́͌̆̍͒͆͊̀̚',

  // Injection vectors (SQLi, SSTI, XSS, Command Injection)
  "' OR '1'='1' --",
  "1; DROP TABLE users; --",
  "<script>alert('xss')</script>",
  "<img src=x onerror=alert(1)>",
  "{{7*7}}",
  "${7*7}",
  "#{7*7}",
  "; cat /etc/passwd",
  "| id",
  "`whoami`",
  "$(uname -a)",
  "../../../../etc/shadow",
  "..\\..\\windows\\system.ini",

  // Edge numerical boundaries
  Number.MAX_SAFE_INTEGER.toString(),
  Number.MIN_SAFE_INTEGER.toString(),
  '-1',
  '0',
  '999999999999999999999999999999999999999999999999999999999999'
];

const TARGET_ENDPOINTS = [
  { path: '/api/public/kosts', method: 'GET' },
  { path: '/api/community/bulletin', method: 'GET' },
  { path: '/api/community/bulletin', method: 'POST' },
  { path: '/api/complaints', method: 'POST' },
  { path: '/api/recover-account', method: 'POST' },
  { path: '/api/staff/attendance', method: 'GET' },
  { path: '/api/fintech/dunning/settings', method: 'GET' },
  { path: '/api/fintech/mutations', method: 'GET' }
];

function getRandomFuzzItem() {
  const r = Math.random();
  if (r < 0.35) {
    // Random string from library
    return FUZZ_STRINGS[Math.floor(Math.random() * FUZZ_STRINGS.length)];
  } else if (r < 0.50) {
    // Massive string (1,000 - 15,000 chars)
    return generateLongString(Math.floor(Math.random() * 14000) + 1000);
  } else if (r < 0.65) {
    // Deeply nested structure
    return generateDeepObject(Math.floor(Math.random() * 25) + 5);
  } else if (r < 0.80) {
    // Mutated object with mixed types
    return {
      id: Math.random() < 0.5 ? Math.random() : FUZZ_STRINGS[Math.floor(Math.random() * FUZZ_STRINGS.length)],
      count: Math.random() < 0.5 ? true : null,
      data: [1, 'string', { a: null, b: [1, 2, 3] }],
      notes: FUZZ_STRINGS[Math.floor(Math.random() * FUZZ_STRINGS.length)]
    };
  } else {
    // Random array of fuzz items
    return Array.from({ length: 10 }, () => FUZZ_STRINGS[Math.floor(Math.random() * FUZZ_STRINGS.length)]);
  }
}

async function runFuzzIteration(index) {
  const target = TARGET_ENDPOINTS[index % TARGET_ENDPOINTS.length];
  const fuzzPayload = getRandomFuzzItem();

  let url = `${BASE_URL}${target.path}`;
  let options = {
    method: target.method,
    headers: {
      'Accept': 'application/json'
    }
  };

  if (target.method === 'GET') {
    // Inject fuzz into query parameters
    const queryParamVal = typeof fuzzPayload === 'string' ? fuzzPayload : JSON.stringify(fuzzPayload);
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}fuzzKey=${encodeURIComponent(queryParamVal).slice(0, 500)}`;
  } else {
    // POST request with fuzzed body
    options.headers['Content-Type'] = 'application/json';
    if (typeof fuzzPayload === 'string' && (fuzzPayload.startsWith('{') || fuzzPayload.startsWith('['))) {
      options.body = fuzzPayload;
    } else {
      options.body = JSON.stringify({
        fuzz: fuzzPayload,
        name: 'Fuzzer Test',
        title: 'Fuzzing Title',
        kostUid: 'KOST-BDG-02',
        role: 'anak_kost',
        content: typeof fuzzPayload === 'string' ? fuzzPayload : 'Fuzz body'
      });
    }
  }

  const t0 = performance.now();
  try {
    const res = await fetch(url, options);
    const t1 = performance.now();
    return {
      status: res.status,
      duration: t1 - t0,
      is5xx: res.status >= 500,
      crashed: false
    };
  } catch (err) {
    return {
      status: 0,
      duration: 0,
      is5xx: true,
      crashed: true,
      error: err.message
    };
  }
}

async function startFuzzing() {
  let totalHandled = 0;
  let status2xx = 0;
  let status4xx = 0;
  let status5xx = 0;
  let crashes = 0;

  const tStart = performance.now();
  const queue = Array.from({ length: TOTAL_FUZZ_ITERATIONS }, (_, i) => i);
  const workers = [];

  let completed = 0;
  let lastPct = 0;

  async function worker() {
    if (queue.length === 0) return;
    const item = queue.shift();
    const res = await runFuzzIteration(item);

    if (res.crashed) {
      crashes++;
    } else if (res.status >= 200 && res.status < 300) {
      status2xx++;
    } else if (res.status >= 400 && res.status < 500) {
      status4xx++;
    } else if (res.status >= 500) {
      status5xx++;
    }

    totalHandled++;
    completed++;
    const pct = Math.floor((completed / TOTAL_FUZZ_ITERATIONS) * 100);
    if (pct >= lastPct + 20) {
      lastPct = pct;
      process.stdout.write(`⏳ Fuzzing progress: ${completed}/${TOTAL_FUZZ_ITERATIONS} iterations (${pct}%)...\n`);
    }

    return worker();
  }

  for (let i = 0; i < BATCH_SIZE; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  const tEnd = performance.now();
  const durationSec = ((tEnd - tStart) / 1000).toFixed(2);

  console.log(`\n======================================================`);
  console.log(`📊  FUZZING TEST RESULTS SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total Iterations : ${TOTAL_FUZZ_ITERATIONS}`);
  console.log(`Time Taken       : ${durationSec}s`);
  console.log(`HTTP 2xx (Valid) : \x1b[32m${status2xx}\x1b[0m`);
  console.log(`HTTP 4xx (Reject): \x1b[33m${status4xx}\x1b[0m (Defensive Shield Rejections)`);
  console.log(`HTTP 5xx (Server): \x1b[${status5xx > 0 ? '31m' : '32m'}${status5xx}\x1b[0m`);
  console.log(`Server Crashes   : \x1b[${crashes > 0 ? '31m' : '32m'}${crashes}\x1b[0m`);
  console.log(`======================================================`);

  // Final Health & Memory Verification
  process.stdout.write(`\n• Performing post-fuzz health check ... `);
  try {
    const health = await fetch(`${BASE_URL}/api/health`);
    if (health.ok) {
      const data = await health.json();
      console.log(`\x1b[32m[ALIVE & HEALTHY]\x1b[0m Status: ${data.status}`);
    } else {
      console.log(`\x1b[31m[UNHEALTHY]\x1b[0m HTTP ${health.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.log(`\x1b[31m[DEAD]\x1b[0m ${err.message}`);
    process.exit(1);
  }

  if (status5xx > 0 || crashes > 0) {
    console.error(`\n❌ Fuzz test FAILED: Server generated ${status5xx} 500 errors or ${crashes} crashes.`);
    process.exit(1);
  } else {
    console.log(`\n✅ RANDOM FUZZ TEST PASSED: 1,000/1,000 payloads defended with ZERO 500 errors and ZERO crashes!\n`);
  }
}

startFuzzing().catch(err => {
  console.error('Fatal fuzzing error:', err);
  process.exit(1);
});
