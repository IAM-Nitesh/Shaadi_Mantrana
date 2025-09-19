#!/usr/bin/env node
/**
 * Verifies periodic keepalive /health pings via Loki logs.
 * Requirements: GRAFANA_LOKI_URL, GRAFANA_LOKI_USER, GRAFANA_LOKI_PASSWORD
 * Optional: LOOKBACK_MINUTES (default 120)
 */

const https = require('https');

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

const LOKI_URL = getEnv('GRAFANA_LOKI_URL');
if (!LOKI_URL) {
  console.error('Missing GRAFANA_LOKI_URL');
  process.exit(1);
}
const LOKI_USER = getEnv('GRAFANA_LOKI_USER');
const LOKI_PASS = getEnv('GRAFANA_LOKI_PASSWORD');
if (!LOKI_USER || !LOKI_PASS) {
  console.error('Missing Loki basic auth credentials');
  process.exit(1);
}

const LOOKBACK_MINUTES = parseInt(getEnv('LOOKBACK_MINUTES', '120'), 10);

// Normalize base URL (strip trailing push path if present)
let base = LOKI_URL.replace(/\/loki\/api\/v1\/push$/, '');
const queryEndpoint = base.endsWith('/loki/api/v1/push')
  ? base.replace(/\/loki\/api\/v1\/push$/, '/loki/api/v1/query_range')
  : base.endsWith('/loki/api/v1/query_range')
    ? base
    : base.replace(/\/$/, '') + '/loki/api/v1/query_range';

const now = Date.now();
const startNs = BigInt(now - LOOKBACK_MINUTES * 60 * 1000) * 1000000n;
const endNs = BigInt(now) * 1000000n;

// Adjust selector to your labels; event="health_check"
const selector = '{event="health_check",source="keepalive"}';
const params = new URLSearchParams({
  query: selector,
  start: startNs.toString(),
  end: endNs.toString(),
  step: '60'
});

function lokiQuery(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url + '?' + params.toString());
    const options = {
      method: 'GET',
      auth: `${LOKI_USER}:${LOKI_PASS}`,
      rejectUnauthorized: true
    };
    https.get(u, options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error('Loki query failed ' + res.statusCode + ' ' + data));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function parseStreams(result) {
  if (!result || !result.data || !Array.isArray(result.data.result)) return [];
  const entries = [];
  for (const stream of result.data.result) {
    if (!Array.isArray(stream.values)) continue;
    for (const [ts, line] of stream.values) {
      try {
        const obj = JSON.parse(line);
        entries.push({ ts: Number(ts) / 1e9, line: obj });
      } catch (_) {}
    }
  }
  return entries.sort((a, b) => a.ts - b.ts);
}

(async () => {
  console.log(`Querying Loki for keepalive health_check logs over last ${LOOKBACK_MINUTES} minutes...`);
  try {
    const json = await lokiQuery(queryEndpoint);
    const entries = parseStreams(json);
    if (!entries.length) {
      console.log('No keepalive health_check logs found.');
      process.exit(2);
    }
    console.log(`Found ${entries.length} logs.`);
    // Compute intervals
    const intervals = [];
    for (let i = 1; i < entries.length; i++) {
      intervals.push(entries[i].ts - entries[i - 1].ts);
    }
    if (intervals.length) {
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const min = Math.min(...intervals);
      const max = Math.max(...intervals);
      console.log('Interval stats (seconds):', { min, max, avg: Number(avg.toFixed(2)) });
      // Flag if drift > 1.5x expected (600s default)
      const expected = 600;
      const anomalies = intervals.filter(i => i > expected * 1.5 || i < expected * 0.5);
      if (anomalies.length) {
        console.log('Anomalous intervals detected:', anomalies);
      }
    }
    // Show last 5
    console.log('Recent logs:');
    entries.slice(-5).forEach(e => {
      console.log(new Date(e.ts * 1000).toISOString(), e.line.status, e.line.database_status, e.line.email_status);
    });
  } catch (e) {
    console.error('Verification failed:', e.message);
    process.exit(1);
  }
})();
