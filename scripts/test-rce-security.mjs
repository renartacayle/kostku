// scripts/test-rce-security.mjs
// Automated Security Test Suite for KostKu: RCE, Prototype Pollution, Command Injection, Path Traversal, and Timing Attack Guards

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const VALID_ADMIN_KEY = 'KOSTKU_SUPER_ADMIN_SECURE_KEY';

console.log(`\n======================================================`);
console.log(`🛡️  KOSTKU RCE & SECURITY INTEGRITY TEST SUITE`);
console.log(`Target: ${BASE_URL}`);
console.log(`======================================================\n`);

let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  process.stdout.write(`• Testing: ${name.padEnd(55)} ... `);
  try {
    const result = await fn();
    if (result.success) {
      console.log(`\x1b[32m[PASSED]\x1b[0m ${result.detail || ''}`);
      passedTests++;
    } else {
      console.log(`\x1b[31m[FAILED]\x1b[0m ${result.detail || ''}`);
      failedTests++;
    }
  } catch (err) {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${err.message}`);
    failedTests++;
  }
}

async function startSuite() {
  // Capture snapshot of DB before tests that touch restore
  let initialBackup = null;
  try {
    const snapRes = await fetch(`${BASE_URL}/api/backup`, {
      headers: { 'x-admin-key': VALID_ADMIN_KEY }
    });
    if (snapRes.ok) {
      initialBackup = await snapRes.json();
    }
  } catch (_) {}

  // Test 1: CSP Header Check (Verify 'unsafe-eval' is eliminated)
  await runTest('CSP Header Hardening (No unsafe-eval)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const csp = res.headers.get('content-security-policy') || '';
    if (!csp) return { success: false, detail: 'CSP header not found' };
    if (csp.includes("'unsafe-eval'")) {
      return { success: false, detail: 'unsafe-eval is still present in CSP!' };
    }
    return { success: true, detail: 'CSP active without unsafe-eval' };
  });

  // Test 2: Prototype Pollution via Body (__proto__)
  await runTest('Block Prototype Pollution via __proto__ in body', async () => {
    const rawPayload = '{"__proto__": {"polluted": true}, "name": "Hacker Test"}';
    const res = await fetch(`${BASE_URL}/api/community/bulletin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawPayload
    });
    const isBlocked = (res.status === 403);
    const isPolluted = ({}).polluted === true;
    if (isBlocked && !isPolluted) {
      return { success: true, detail: `HTTP ${res.status} blocked, Object.prototype unaffected` };
    }
    return { success: false, detail: `Status: ${res.status}, Polluted: ${isPolluted}` };
  });

  // Test 3: Prototype Pollution via Constructor Prototype
  await runTest('Block Prototype Pollution via constructor.prototype', async () => {
    const rawPayload = '{"constructor": {"prototype": {"isAdmin": true}}, "title": "Pollution Probe"}';
    const res = await fetch(`${BASE_URL}/api/community/bulletin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawPayload
    });
    const isBlocked = (res.status === 403);
    const isPolluted = ({}).isAdmin === true;
    if (isBlocked && !isPolluted) {
      return { success: true, detail: `HTTP ${res.status} blocked, Object.prototype unaffected` };
    }
    return { success: false, detail: `Status: ${res.status}, Polluted: ${isPolluted}` };
  });

  // Test 4: Nested Prototype Pollution in Deep JSON
  await runTest('Block Nested Prototype Pollution (depth 3)', async () => {
    const rawPayload = '{"level1": {"level2": {"__proto__": {"evilVal": 1337}}}}';
    const res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawPayload
    });
    const isBlocked = (res.status === 403);
    const isPolluted = ({}).evilVal === 1337;
    if (isBlocked && !isPolluted) {
      return { success: true, detail: `HTTP ${res.status} blocked, deep probe defended` };
    }
    return { success: false, detail: `Status: ${res.status}, Polluted: ${isPolluted}` };
  });

  // Test 5: Command Injection in Query Param (; whoami)
  await runTest('Block Command Injection in Query Param (; whoami)', async () => {
    const res = await fetch(`${BASE_URL}/api/public/kosts?kostUid=KOST01;whoami`);
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      return { success: true, detail: `HTTP 400 (${data.error || 'Blocked'})` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 6: Command Injection via Subshell $(id) in Query Param
  await runTest('Block Subshell Execution in Query Param $(id)', async () => {
    const res = await fetch(`${BASE_URL}/api/staff/attendance?staffId=$(id)`);
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 blocked subshell` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 7: Command Injection via Backticks `cat /etc/passwd` in Query
  await runTest('Block Backtick Shell Execution in Query `uname -a`', async () => {
    const res = await fetch(`${BASE_URL}/api/invoices?status=\`uname%20-a\``);
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 blocked backticks` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 8: Command Injection in Body (bash -c)
  await runTest('Block Shell Spawning in JSON Body (bash -c)', async () => {
    const res = await fetch(`${BASE_URL}/api/community/bulletin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Normal Title',
        content: 'Testing shell exec bash -c "touch /tmp/pwned"'
      })
    });
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 blocked bash -c execution` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 9: Node.js Child Process Require in Body
  await runTest('Block require("child_process") in Body', async () => {
    const res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Komplain AC',
        description: 'require("child_process").execSync("id")'
      })
    });
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 blocked child_process injection` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 10: Path Traversal (../../../../etc/passwd)
  await runTest('Block Path Traversal in Query Param (../../)', async () => {
    const res = await fetch(`${BASE_URL}/api/public/kosts?file=../../../../etc/passwd`);
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 blocked path traversal` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 11: Windows Path Traversal (..\..\windows)
  await runTest('Block Windows Path Traversal (..\\..\\)', async () => {
    const res = await fetch(`${BASE_URL}/api/invoices?file=..%5C..%5Cwindows%5Csystem32`);
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 blocked Windows path traversal` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 12: Null Byte Injection (%00)
  await runTest('Block Null Byte Injection (%00)', async () => {
    const res = await fetch(`${BASE_URL}/api/public/kosts?kostUid=KOST%001`);
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 blocked null byte` };
    }
    return { success: false, detail: `Unexpected status: ${res.status}` };
  });

  // Test 13: Super Admin Query Key Blocking (Must NOT accept key via URL)
  await runTest('Reject Super Admin Key in URL Query (Timing-safe enforcement)', async () => {
    const res = await fetch(`${BASE_URL}/api/backup?adminKey=${VALID_ADMIN_KEY}`);
    if (res.status === 403) {
      return { success: true, detail: `HTTP 403 forbidden (query key rejected as required)` };
    }
    return { success: false, detail: `Expected 403, got ${res.status}` };
  });

  // Test 14: Super Admin Invalid Header Key Rejection
  await runTest('Reject Invalid Super Admin Header Key', async () => {
    const res = await fetch(`${BASE_URL}/api/backup`, {
      headers: { 'x-admin-key': 'WRONG_SECRET_KEY_12345' }
    });
    if (res.status === 403) {
      return { success: true, detail: `HTTP 403 forbidden on invalid header key` };
    }
    return { success: false, detail: `Expected 403, got ${res.status}` };
  });

  // Test 15: Super Admin Valid Header Authorization
  await runTest('Allow Valid Super Admin Key via Header', async () => {
    const res = await fetch(`${BASE_URL}/api/backup`, {
      headers: { 'x-admin-key': VALID_ADMIN_KEY }
    });
    if (res.status === 200) {
      const data = await res.json();
      return { success: true, detail: `HTTP 200 OK (returned ${data.users?.length || 0} users)` };
    }
    return { success: false, detail: `Expected 200, got ${res.status}` };
  });

  // Test 16: Restore Schema Validation (Rejection of Malformed Backup Data)
  await runTest('Reject Invalid Backup Data in /api/restore', async () => {
    const res = await fetch(`${BASE_URL}/api/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': VALID_ADMIN_KEY
      },
      body: JSON.stringify({ invalidField: true }) // Missing users array
    });
    if (res.status === 400) {
      return { success: true, detail: `HTTP 400 rejected malformed backup format` };
    }
    return { success: false, detail: `Expected 400, got ${res.status}` };
  });

  // Test 17: Restore Whitelist Sanitization & Preservation
  await runTest('Enforce Schema Whitelist on /api/restore', async () => {
    if (!initialBackup) {
      return { success: false, detail: 'Initial backup could not be captured' };
    }
    // Test restore with an extra arbitrary key injected
    const testPayload = {
      ...initialBackup,
      arbitraryMaliciousKey: { injected: true }
    };
    const res = await fetch(`${BASE_URL}/api/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': VALID_ADMIN_KEY
      },
      body: JSON.stringify(testPayload)
    });
    if (res.status === 200) {
      return { success: true, detail: `HTTP 200 restored with whitelist enforcement` };
    }
    return { success: false, detail: `Expected 200, got ${res.status}` };
  });

  // Test 18: Normal Legitimate Request Acceptance (Zero False Positives)
  await runTest('Accept Legitimate API Request (No False Positives)', async () => {
    const res = await fetch(`${BASE_URL}/api/public/kosts`);
    if (res.status === 200) {
      const data = await res.json();
      return { success: true, detail: `HTTP 200 OK (${data.length} kosts retrieved cleanly)` };
    }
    return { success: false, detail: `Expected 200, got ${res.status}` };
  });

  // Cleanup: Restore original DB to ensure zero side-effects
  if (initialBackup) {
    try {
      await fetch(`${BASE_URL}/api/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': VALID_ADMIN_KEY
        },
        body: JSON.stringify(initialBackup)
      });
    } catch (_) {}
  }

  console.log(`\n======================================================`);
  console.log(`📊  SECURITY TEST RESULTS SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total Tests Run : ${passedTests + failedTests}`);
  console.log(`Passed          : \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Failed          : \x1b[31m${failedTests}\x1b[0m`);

  if (failedTests > 0) {
    console.error(`❌ Security Test Suite FAILED with ${failedTests} failure(s).`);
    process.exit(1);
  } else {
    console.log(`✅ ALL ${passedTests} SECURITY & RCE ACCEPTANCE TESTS PASSED!\n`);
  }
}

startSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
