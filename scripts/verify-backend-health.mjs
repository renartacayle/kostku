import http from 'http';

function checkEndpoint(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const health = await checkEndpoint('http://localhost:3001/api/health');
    if (health.statusCode !== 200 || (health.body?.status !== 'online' && health.body?.status !== 'ok')) {
      console.error('Health endpoint check failed:', health);
      process.exit(1);
    }

    const publicKosts = await checkEndpoint('http://localhost:3001/api/public/kosts');
    if (publicKosts.statusCode !== 200 || !Array.isArray(publicKosts.body) || publicKosts.body.length === 0) {
      console.error('Public kosts check failed:', publicKosts);
      process.exit(1);
    }

    console.log('backend health verification passed');
    process.exit(0);
  } catch (err) {
    console.error('Network failure connecting to backend:', err.message);
    process.exit(1);
  }
})();
