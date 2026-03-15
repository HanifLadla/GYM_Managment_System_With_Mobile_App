// Run this to test if your live API is reachable
// node test-api.js

const https = require('https');

const BASE_URL = 'gym.themedscalemarketing.com';

function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: BASE_URL,
      path: path,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      console.log(`✅ ${path} → Status: ${res.statusCode}`);
      resolve(res.statusCode);
    });

    req.on('error', (e) => {
      console.log(`❌ ${path} → Error: ${e.message}`);
      resolve(null);
    });

    req.setTimeout(5000, () => {
      console.log(`⏱️  ${path} → Timeout`);
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing live API: https://gym.themedscalemarketing.com\n');
  
  await testEndpoint('/api/settings');
  await testEndpoint('/api/members');
  await testEndpoint('/api/payments');
  await testEndpoint('/api/attendance/today');
  
  console.log('\nDone! 200/401 = API working, 500 = backend error, null = server unreachable');
}

runTests();
