const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function runOnce(email) {
  try {
    // send OTP
    const sendRes = await fetch('http://localhost:5500/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const sendJson = await sendRes.json();
    if (!sendRes.ok) {
      return { success: false, step: 'send', status: sendRes.status, error: sendJson };
    }
    const otp = sendJson.otp || sendJson.otpCode || null;
    if (!otp) {
      // in production email is sent; in dev we expect OTP in response
      return { success: false, step: 'send', status: sendRes.status, error: 'No OTP returned in development response', raw: sendJson };
    }

    // verify OTP
    const verifyRes = await fetch('http://localhost:5500/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const verifyJson = await verifyRes.json();
    if (!verifyRes.ok) {
      return { success: false, step: 'verify', status: verifyRes.status, error: verifyJson };
    }
    return { success: true, data: verifyJson };
  } catch (err) {
    return { success: false, step: 'network', error: String(err) };
  }
}

async function runMany(iterations) {
  const results = { success: 0, sendFail: 0, verifyFail: 0, networkFail: 0 };
  for (let i = 0; i < iterations; i++) {
    const email = `testuser+${Date.now()}+${i}@example.com`;
    if (i % 100 === 0) console.log('Running', i);
    // re-use same email occasionally to test rate limits
    const useEmail = i % 10 === 0 ? 'testuser+reuse@example.com' : email;
    // eslint-disable-next-line no-await-in-loop
    const res = await runOnce(useEmail);
    if (res.success) results.success++;
    else {
      if (res.step === 'send') results.sendFail++;
      else if (res.step === 'verify') results.verifyFail++;
      else results.networkFail++;
    }
  }
  return results;
}

(async () => {
  const ITER = parseInt(process.argv[2] || '100', 10);
  console.log('Starting', ITER, 'iterations');
  const start = Date.now();
  const summary = await runMany(ITER);
  const ms = Date.now() - start;
  console.log('Done in', ms, 'ms');
  console.log(summary);
})();
