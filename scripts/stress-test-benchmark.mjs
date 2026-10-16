import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

const PORT = 3099;
const SERVER_PATH = path.resolve('backend/server.js');

async function waitServerReady(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 404) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return false;
}

async function runBenchmark(name, makeRequest, totalRequests = 200, concurrency = 25) {
  const start = performance.now();
  let completed = 0;
  let errors = 0;
  const latencies = [];

  let index = 0;
  async function worker() {
    while (index < totalRequests) {
      const currentIdx = index++;
      const t0 = performance.now();
      try {
        const ok = await makeRequest(currentIdx);
        if (!ok) errors++;
      } catch (err) {
        errors++;
      }
      const t1 = performance.now();
      latencies.push(t1 - t0);
      completed++;
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationSec = (performance.now() - start) / 1000;
  latencies.sort((a, b) => a - b);

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = completed / durationSec;

  return {
    name,
    totalRequests,
    concurrency,
    durationSec: Number(durationSec.toFixed(2)),
    rps: Number(rps.toFixed(1)),
    avgMs: Number(avg.toFixed(2)),
    p50Ms: Number(p50.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
    errors
  };
}

async function main() {
  console.log('=== STARTING KOSTKU STRESS TEST BENCHMARK ===');
  console.log(`Spawning backend test server on port ${PORT}...`);

  const serverProc = spawn('node', [SERVER_PATH], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });

  serverProc.stdout.on('data', d => {});
  serverProc.stderr.on('data', d => {});

  const isReady = await waitServerReady(`http://127.0.0.1:${PORT}/api/health`);
  if (!isReady) {
    console.error('Server failed to start on port', PORT);
    serverProc.kill();
    process.exit(1);
  }

  console.log('Server online. Running load scenarios...\n');

  // Scenario 1: Health check (Baseline overhead)
  const resHealth = await runBenchmark('1. Read Baseline (GET /api/health)', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    return res.status === 200;
  }, 300, 30);

  // Scenario 2: Public Kosts Listing (Read + JSON serialization)
  const resPublic = await runBenchmark('2. Read Data Heavy (GET /api/public/kosts)', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/public/kosts`);
    return res.status === 200;
  }, 200, 20);

  // Scenario 3: Auth Login / Verification (CPU computation + find)
  const resLogin = await runBenchmark('3. Auth Verification (POST /api/login)', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
    });
    // Expected 401 for wrong password
    return res.status === 401;
  }, 200, 25);

  // Scenario 4: Concurrent Order Creation (Write heavy + disk I/O fs.writeFileSync)
  const resOrders = await runBenchmark('4. Write Disk Contention (POST /api/partner-orders)', async (idx) => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/partner-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kostUid: 'KOST-JAKSEL-01',
        userId: `STRESS-USER-${idx}`,
        userName: `Penghuni ${idx}`,
        roomNumber: '101',
        merchantName: 'Warung Bu Siti',
        items: [{ id: 'galon-01', name: 'Aqua Galon', price: 18000, qty: 1 }],
        subtotal: 18000,
        platformFee: 500,
        ownerCommission: 1000,
        total: 19500,
        paymentMethod: 'qris'
      })
    });
    return res.status === 200 || res.status === 201;
  }, 100, 15);

  serverProc.kill();

  console.log('=== BENCHMARK RESULTS TABLE ===');
  console.table([resHealth, resPublic, resLogin, resOrders]);

  console.log('\n=== ANALYSIS SUMMARY ===');
  console.log(`- Read Throughput (Baseline): ${resHealth.rps} req/sec (p95: ${resHealth.p95Ms}ms)`);
  console.log(`- Read Throughput (Public Catalog): ${resPublic.rps} req/sec (p95: ${resPublic.p95Ms}ms)`);
  console.log(`- Write Throughput (with fs.writeFileSync): ${resOrders.rps} req/sec (p95: ${resOrders.p95Ms}ms)`);
  console.log(`- Error count across all test scenarios: ${resHealth.errors + resPublic.errors + resLogin.errors + resOrders.errors}`);
}

main().catch(err => {
  console.error('Stress test error:', err);
  process.exit(1);
});
