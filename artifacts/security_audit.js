const http = require('http');

async function checkEndpoint(host, port, persona) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ persona });
    const options = {
      hostname: host,
      port: port,
      path: '/api/test/session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        // Mocking an external IP by setting X-Forwarded-For if the app trusts it
        'X-Forwarded-For': '8.8.8.8' 
      }
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode);
    });

    req.on('error', (error) => {
      resolve('ERROR: ' + error.message);
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  const tlog = require('../scripts/test-logger');
  tlog.info('--- SECURITY AUDIT: TEST SESSION ENDPOINT ---');
  
  // 1. Test via 127.0.0.1 (Internal - Should be 200 or 400 if bad payload, but NOT 404 unless disabled)
  // Note: Since I am on the same machine, I am "Internal"
  const internalStatus = await checkEndpoint('127.0.0.1', 5500, 'admin');
  tlog.info(`Internal (127.0.0.1) Status: ${internalStatus}`);

  // 2. Test via localhost (Internal)
  const localhostStatus = await checkEndpoint('localhost', 5500, 'admin');
  tlog.info(`Localhost Status: ${localhostStatus}`);

  tlog.info('\n--- VERIFICATION CRITERIA ---');
  tlog.info('1. If internalStatus is 200, the route is functional.');
  tlog.info('2. If you were external, you MUST receive 404.');
  tlog.info('-------------------------------------------');
}

run();
