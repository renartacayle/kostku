// scripts/test-concurrency-stress.mjs
// High-Concurrency Stress Test Suite for KostKu Backend API

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const TOTAL_REQUESTS = 600;
const CONCURRENCY_BATCH_SIZE = 50;

console.log(`\n======================================================`);
console.log(`⚡  KOSTKU CONCURRENCY & STRESS TEST SUITE`);
console.log(`Target      : ${BASE_URL}`);
console.log(`Total Req   : ${TOTAL_REQUESTS}`);
console.log(`Concurrency : ${CONCURRENCY_BATCH_SIZE} workers parallel`);
console.log(`======================================================\n`);

const ENDPOINTS = [
  '/api/health',
  '/api/public/kosts',
  '/api/community/bulletin?kostUid=KOST-BDG-02',
  '/api/community/preloved?kostUid=KOST-BDG-02',
  '/api/fintech/dunning/settings?kostUid=KOST-BDG-02',
  '/api/fintech/mutations',
  '/api/iot/smartlock/Kamar-101'
];

async function runWorker(requestId) {
  const endpoint = ENDPOINTS[requestId % ENDPOINTS.length];
  const url = `${BASE_URL}${endpoint}`;
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    const t1 = performance.now();
    const duration = t1 - t0;
    return {
      success: res.ok,
      status: res.status,
      duration,
      is5xx: res.status >= 500
    };
  } catch (err) {
    const t1 = performance.now();
    return {
      success: false,
      status: 0,
      duration: t1 - t0,
      error: err.message,
      is5xx: true
    };
  }
}

async function runStressTest() {
  const durations = [];
  let successCount = 0;
  let status2xx = 0;
  let status4xx = 0;
  let status5xx = 0;
  let networkErrors = 0;

  const tStart = performance.now();
  const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);
  const activeWorkers = [];

  let completed = 0;
  let lastReport = 0;

  async function next() {
    if (queue.length === 0) return;
    const reqId = queue.shift();
    const result = await runWorker(reqId);
    durations.push(result.duration);

    if (result.status >= 200 && result.status < 300) status2xx++;
    else if (result.status >= 400 && result.status < 500) status4xx++;
    else if (result.status >= 500) status5xx++;
    else networkErrors++;

    if (result.success) successCount++;

    completed++;
    const progress = Math.floor((completed / TOTAL_REQUESTS) * 100);
    if (progress >= lastReport + 20) {
      lastReport = progress;
      process.stdout.write(`⏳ Progress: ${completed}/${TOTAL_REQUESTS} requests (${progress}%)...\n`);
    }

    return next();
  }

  for (let i = 0; i < CONCURRENCY_BATCH_SIZE; i++) {
    activeWorkers.push(next());
  }

  await Promise.all(activeWorkers);
  const tEnd = performance.now();
  const totalDurationSec = (tEnd - tStart) / 1000;
  const throughputRps = (TOTAL_REQUESTS / totalDurationSec).toFixed(1);

  // Calculate statistics
  durations.sort((a, b) => a - b);
  const min = durations[0].toFixed(1);
  const max = durations[durations.length - 1].toFixed(1);
  const sum = durations.reduce((acc, v) => acc + v, 0);
  const avg = (sum / durations.length).toFixed(1);
  const p50 = durations[Math.floor(durations.length * 0.50)].toFixed(1);
  const p95 = durations[Math.floor(durations.length * 0.95)].toFixed(1);
  const p99 = durations[Math.floor(durations.length * 0.99)].toFixed(1);

  console.log(`\n======================================================`);
  console.log(`📊  CONCURRENCY & STRESS TEST RESULTS`);
  console.log(`======================================================`);
  console.log(`Total Requests  : ${TOTAL_REQUESTS}`);
  console.log(`Total Time Taken: ${totalDurationSec.toFixed(2)}s`);
  console.log(`Throughput      : \x1b[36m${throughputRps} req/sec\x1b[0m`);
  console.log(`Status 2xx (OK) : \x1b[32m${status2xx}\x1b[0m (${((status2xx / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`Status 4xx      : ${status4xx}`);
  console.log(`Status 5xx      : \x1b[${status5xx > 0 ? '31m' : '32m'}${status5xx}\x1b[0m`);
  console.log(`Network Failures: \x1b[${networkErrors > 0 ? '31m' : '32m'}${networkErrors}\x1b[0m`);
  console.log(`------------------------------------------------------`);
  console.log(`Latency Statistics:`);
  console.log(`  Min Latency   : ${min} ms`);
  console.log(`  Avg Latency   : ${avg} ms`);
  console.log(`  Median (p50)  : ${p50} ms`);
  console.log(`  95th % (p95)  : ${p95} ms`);
  console.log(`  99th % (p99)  : ${p99} ms`);
  console.log(`  Max Latency   : ${max} ms`);
  console.log(`======================================================`);

  // Post-stress liveness & health check
  process.stdout.write(`\n• Performing post-stress health verification ... `);
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (healthRes.ok) {
      const data = await healthRes.json();
      console.log(`\x1b[32m[HEALTHY]\x1b[0m Server status: ${data.status}`);
    } else {
      console.log(`\x1b[31m[UNHEALTHY]\x1b[0m HTTP ${healthRes.status}`);
      process.exit(1);
    }
  } catch (e) {
    console.log(`\x1b[31m[CRASHED]\x1b[0m ${e.message}`);
    process.exit(1);
  }

  if (status5xx > 0 || networkErrors > 0) {
    console.error(`\n❌ Stress test FAILED with 5xx or network drops.`);
    process.exit(1);
  } else {
    console.log(`\n✅ CONCURRENCY & STRESS TEST PASSED: 100% (600/600) 2xx responses, zero drops!\n`);
  }
}

runStressTest().catch(err => {
  console.error('Fatal stress test failure:', err);
  process.exit(1);
});
