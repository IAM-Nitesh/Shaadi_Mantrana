let promClient;
try {
  promClient = require('prom-client');
} catch (e) {
  promClient = null;
}

if (promClient) {
  // Default metrics (CPU, memory, etc.)
  promClient.collectDefaultMetrics({ timeout: 5000 });

  // Histogram for request durations
  const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 1, 3, 5]
  });

  module.exports = {
    promClient,
    httpRequestDuration
  };
} else {
  module.exports = { promClient: null };
}
